(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Cast = window.StsCast;
  const Track = window.StsTrack;

  const ID = 'Vl4dNaCTC98';
  const DURATION = 50.085;
  const ASPECT = 16 / 9;
  const CUTS = [0, 1.683, 1.966, 2.2, 2.566, 3.383, 5.383, 8.783, 12.383, 16.0, 16.633, 20.066, 21.933, 23.433, 27.133, 30.633, 34.316, 36.683, 38.266, 41.833, 42.133, 45.1];
  const LYRICS = [
    [28.56, 'Молодёжь'],
    [30.0, 'Даёшь молодёжь, настроение в порядке'],
    [33.88, 'Даёшь молодёжь от Москвы до Камчатки'],
    [37.52, 'Даёшь молодёжь, отдыхаем красиво'],
    [41.14, 'Даёшь молодёжь на экранах России'],
    [44.3, 'Даёшь молодёжь']
  ];
  const BEAT = 0.4645;
  const BEAT0 = 0.14;

  function hermite(p0, p1, p2, p3, t0, t1, t2, t3, t) {
    const h = t2 - t1;
    const u = clamp((t - t1) / h, 0, 1);
    const u2 = u * u, u3 = u2 * u;
    const m1 = ((p2 - p0) / Math.max(1e-4, t2 - t0)) * h;
    const m2 = ((p3 - p1) / Math.max(1e-4, t3 - t1)) * h;
    return (2 * u3 - 3 * u2 + 1) * p1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * p2 + (u3 - u2) * m2;
  }

  function track(keys) {
    const full = [];
    let cur = {};
    keys.forEach(([t, v]) => {
      cur = Object.assign({}, cur, v);
      full.push([t, cur]);
    });
    const num = (x) => typeof x === 'number';
    return (t) => {
      if (t <= full[0][0]) return Object.assign({}, full[0][1]);
      const n = full.length;
      if (t >= full[n - 1][0]) return Object.assign({}, full[n - 1][1]);
      let i = 1;
      while (i < n && t >= full[i][0]) i++;
      const [t1, a] = full[i - 1], [t2, b] = full[i];
      const [t0, z] = full[Math.max(0, i - 2)], [t3, c] = full[Math.min(n - 1, i + 1)];
      const ta = i - 2 >= 0 ? t0 : t1 - 1, tb = i + 1 < n ? t3 : t2 + 1;
      const out = {};
      Object.keys(a).forEach(key => {
        const va = a[key], vb = b[key];
        if (num(va) && num(vb)) {
          out[key] = hermite(num(z[key]) ? z[key] : va, va, vb, num(c[key]) ? c[key] : vb, ta, t1, t2, tb, t);
        } else if (Array.isArray(va) && Array.isArray(vb) && va.length === vb.length && num(va[0])) {
          const za = Array.isArray(z[key]) && z[key].length === va.length ? z[key] : va;
          const cb = Array.isArray(c[key]) && c[key].length === vb.length ? c[key] : vb;
          out[key] = va.map((x, j) => hermite(za[j], x, vb[j], cb[j], ta, t1, t2, tb, t));
        } else {
          out[key] = va;
        }
      });
      return out;
    };
  }

  function basis(cam) {
    const f = V3.norm(V3.sub(cam.at, cam.eye));
    const r = V3.norm(V3.cross(f, cam.up || [0, 1, 0]));
    const u = V3.cross(r, f);
    const ty = Math.tan((cam.fov * PI) / 360);
    return { f, r, u, ty, tx: ty * ASPECT };
  }

  function rayDir(cam, sx, sy) {
    const B = basis(cam);
    return V3.norm(V3.add(V3.add(B.f, V3.mul(B.r, (2 * sx - 1) * B.tx)), V3.mul(B.u, (1 - 2 * sy) * B.ty)));
  }

  function project(cam, p) {
    const B = basis(cam);
    const d = V3.sub(p, cam.eye);
    const z = Math.max(1e-4, V3.dot(d, B.f));
    return [0.5 + V3.dot(d, B.r) / (z * B.tx) / 2, 0.5 - V3.dot(d, B.u) / (z * B.ty) / 2, z];
  }

  function onPlaneZ(cam, sx, sy, z) {
    const d = rayDir(cam, sx, sy);
    const k = (z - cam.eye[2]) / (Math.abs(d[2]) < 1e-5 ? 1e-5 : d[2]);
    return V3.add(cam.eye, V3.mul(d, k));
  }

  function sphereHit(cam, sx, sy, center, radius, depth) {
    const d = rayDir(cam, sx, sy);
    const oc = V3.sub(cam.eye, center);
    const bq = V3.dot(d, oc);
    const cq = V3.dot(oc, oc) - radius * radius;
    const disc = bq * bq - cq;
    let t;
    if (disc < 0 || depth === 'mid') t = -bq;
    else t = depth === 'back' ? -bq + Math.sqrt(disc) : -bq - Math.sqrt(disc);
    const p = V3.add(cam.eye, V3.mul(d, t));
    const off = V3.sub(p, center);
    const len = V3.len(off);
    return len < 1e-5 ? V3.add(center, [0, -radius, 0]) : V3.add(center, V3.mul(off, radius / len));
  }

  const KP = { nose: 0, eyeL: 1, eyeR: 2, earL: 3, earR: 4, shL: 5, shR: 6, elL: 7, elR: 8, wrL: 9, wrR: 10, hipL: 11, hipR: 12, knL: 13, knR: 14, anL: 15, anR: 16 };

  function fitLimbs(who, pose, cam, name, t, opts) {
    const o = opts || {};
    const kp = Track.at(name, t);
    if (!kp) return pose;
    const D = Cast.DIMS[Cast.PEOPLE[who].body];
    const m = Cast.solve(who, pose);
    const sides = o.sides || ['L', 'R'];
    sides.forEach(s => {
      const depth = (o.depth && o.depth[s]) || o.depthAll || 'front';
      const sh = kp[KP['sh' + s]], el = kp[KP['el' + s]], wr = kp[KP['wr' + s]];
      if (sh[2] < 0.3 || el[2] < 0.3 || (o.arms === false)) return;
      const S3 = m.pts['shoulder' + s];
      const s2 = project(cam, S3);
      const ex = s2[0] + (el[0] - sh[0]) * (o.gain || 1), ey = s2[1] + (el[1] - sh[1]) * (o.gain || 1);
      const E3 = sphereHit(cam, ex, ey, S3, D.upper, depth);
      pose['e' + s + 'w'] = V3.add(E3, V3.mul(V3.sub(E3, S3), 0.3));
      if (wr[2] >= 0.3) {
        const e2 = project(cam, E3);
        const W3 = sphereHit(cam, e2[0] + (wr[0] - el[0]) * (o.gain || 1), e2[1] + (wr[1] - el[1]) * (o.gain || 1), E3, D.fore * 0.98, (o.wrist && o.wrist[s]) || depth);
        pose['h' + s + 'w'] = W3;
        delete pose['h' + s];
      } else {
        pose['h' + s + 'w'] = V3.add(E3, V3.mul(V3.norm(V3.sub(E3, S3)), D.fore * 0.95));
      }
    });
    if (o.legs) {
      sides.forEach(s => {
        const hp = kp[KP['hip' + s]], kn = kp[KP['kn' + s]], an = kp[KP['an' + s]];
        if (hp[2] < 0.3 || kn[2] < 0.3) return;
        const H3 = m.pts['hip' + s];
        const h2 = project(cam, H3);
        const K3 = sphereHit(cam, h2[0] + kn[0] - hp[0], h2[1] + kn[1] - hp[1], H3, D.thigh, o.legs);
        pose['k' + s + 'w'] = V3.add(K3, V3.mul(V3.sub(K3, H3), 0.4));
        if (an[2] >= 0.3) {
          const k2 = project(cam, K3);
          pose['f' + s + 'w'] = sphereHit(cam, k2[0] + an[0] - kn[0], k2[1] + an[1] - kn[1], K3, D.shin, o.legs);
        } else {
          pose['f' + s + 'w'] = V3.add(K3, V3.mul(V3.norm(V3.sub(K3, H3)), D.shin));
        }
      });
    }
    return pose;
  }

  function trackPlace(cam, name, t, z) {
    const kp = Track.at(name, t);
    const sl = kp[KP.shL], sr = kp[KP.shR];
    const mx = (sl[0] + sr[0]) / 2, my = (sl[1] + sr[1]) / 2;
    return { mid: onPlaneZ(cam, mx, my, z), kp };
  }

  function trackDepth(cam, name, t, width) {
    const kp = Track.at(name, t);
    const sl = kp[KP.shL], sr = kp[KP.shR];
    const mx = (sl[0] + sr[0]) / 2, my = (sl[1] + sr[1]) / 2;
    const w = Math.hypot((sl[0] - sr[0]) * ASPECT, sl[1] - sr[1]);
    const dist = width / Math.max(0.02, w * 2 * Math.tan((cam.fov * PI) / 360));
    return { mid: V3.add(cam.eye, V3.mul(rayDir(cam, mx, my), dist)), kp };
  }

  function trackRoll(name, t) {
    const kp = Track.at(name, t);
    const sl = kp[KP.shL], sr = kp[KP.shR];
    return Math.atan2((sl[1] - sr[1]), (sl[0] - sr[0]) * ASPECT);
  }

  function W(base, yaw, v) {
    const c = C(yaw), s = S(yaw);
    return [base[0] + v[0] * c + v[2] * s, base[1] + v[1], base[2] - v[0] * s + v[2] * c];
  }

  const SIT = { fL: [0.16, -0.5, 0.42], fR: [-0.16, -0.5, 0.42], kL: [0.2, 0.3, 1], kR: [-0.2, 0.3, 1] };

  function body(k) {
    const yaw = k.yaw || 0;
    const M = M4.chain(M4.rotY(yaw), M4.rotX(k.tilt || 0), M4.rotZ(k.roll || 0));
    const pose = {
      p: k.p,
      up: M4.dir(M, [0, 1, 0]),
      fwd: M4.dir(M, [0, 0, 1]),
      sp: k.sp || [0, 0, 0],
      nk: k.nk || [0, 0, 0],
      eyes: k.eyes || 'open',
      brows: k.brows || 'flat',
      mouth: k.mouth || 'shut',
      gaze: k.gaze || 'c',
      gL: k.gL || 'open',
      gR: k.gR || 'open',
      outfit: k.outfit
    };
    if (k.sit) Object.assign(pose, SIT);
    ['hL', 'hR', 'eL', 'eR', 'hLw', 'hRw', 'eLw', 'eRw', 'fL', 'fR', 'kL', 'kR', 'fLw', 'fRw', 'kLw', 'kRw', 'wL', 'wR', 'aL', 'aR', 'hat', 'hair', 'hideL', 'hideR', 'noLegs', 'glasses'].forEach(f => { if (k[f] !== undefined) pose[f] = k[f]; });
    return pose;
  }

  function walkLegs(pose, phase, stride, lift) {
    const s = S(phase), c = C(phase);
    pose.fL = [0.13, -0.88 + Math.max(0, s) * (lift || 0.1), c * stride];
    pose.fR = [-0.13, -0.88 + Math.max(0, -s) * (lift || 0.1), -c * stride];
    pose.kL = [0.15, 0, 1];
    pose.kR = [-0.15, 0, 1];
    return pose;
  }

  function wob(t, amp, seed) {
    return K.wobble(t, amp, seed);
  }

  function cam(eye, at, fov, roll, shake, t, seed) {
    const w = shake ? wob(t, shake, seed || 1) : [0, 0, 0];
    const f = V3.norm(V3.sub(at, eye));
    const right = V3.norm(V3.cross(f, [0, 1, 0]));
    const up0 = V3.cross(right, f);
    const r = (roll || 0) + w[2] * 0.4;
    const up = V3.add(V3.mul(up0, C(r)), V3.mul(right, S(r)));
    return { eye: V3.add(eye, [w[0] * 0.3, w[1] * 0.3, 0]), at: V3.add(at, [w[0], w[1], 0]), up, fov };
  }

  function blink(t, seed) {
    const p = 2.9 + (seed % 5) * 0.41;
    return ((t + seed * 0.73) % p) < 0.11;
  }

  function beatPhase(t) {
    return ((t - BEAT0) / BEAT) % 1;
  }

  const ENVS = {
    stream: { sunDir: [0.3, -0.5, -0.8], sunColor: [0.34, 0.33, 0.28], ambTop: [0.86, 0.84, 0.7], ambBottom: [0.4, 0.38, 0.3], fogColor: [0.2, 0.2, 0.16], fogNear: 8, fogFar: 20, points: [{ pos: [0.3, 1.6, 1.4], color: [0.5, 0.46, 0.36] }] },
    street: { sunDir: [0.5, -0.6, -0.5], sunColor: [0.5, 0.48, 0.44], ambTop: [0.78, 0.8, 0.84], ambBottom: [0.4, 0.4, 0.42], fogColor: [0.62, 0.64, 0.66], fogNear: 14, fogFar: 40, points: [] },
    clips: { sunDir: [-0.4, -0.5, -0.7], sunColor: [0.26, 0.22, 0.14], ambTop: [0.78, 0.68, 0.48], ambBottom: [0.36, 0.3, 0.22], fogColor: [0.2, 0.17, 0.1], fogNear: 6, fogFar: 14, points: [{ pos: [0.2, 1.8, 1.2], color: [0.5, 0.42, 0.28] }] },
    pc: { sunDir: [-0.3, -0.6, -0.7], sunColor: [0.3, 0.24, 0.16], ambTop: [0.82, 0.68, 0.52], ambBottom: [0.36, 0.28, 0.22], fogColor: [0.25, 0.2, 0.16], fogNear: 5, fogFar: 12, points: [{ pos: [-0.1, 0.9, -0.3], color: [0.05, 0.1, 0.45] }, { pos: [0.4, 1.9, 0.6], color: [0.4, 0.32, 0.22] }] },
    limo: { sunDir: [0, -1, 0], sunColor: [0.06, 0.06, 0.1], ambTop: [0.22, 0.2, 0.42], ambBottom: [0.08, 0.06, 0.14], fogColor: [0.02, 0.02, 0.05], fogNear: 4, fogFar: 9, points: [{ pos: [-0.1, 1.35, -0.1], color: [0.62, 0.42, 0.6] }, { pos: [1.2, 1.1, 0.3], color: [0.5, 0.12, 0.2] }] },
    airport: { sunDir: [0.2, -0.8, -0.5], sunColor: [0.3, 0.31, 0.33], ambTop: [0.86, 0.88, 0.92], ambBottom: [0.6, 0.62, 0.66], fogColor: [0.78, 0.8, 0.83], fogNear: 25, fogFar: 230, points: [] },
    beach: { sunDir: [-0.4, -0.6, 0.65], sunColor: [0.6, 0.58, 0.52], ambTop: [0.8, 0.84, 0.92], ambBottom: [0.5, 0.48, 0.42], fogColor: [0.82, 0.88, 0.94], fogNear: 60, fogFar: 900, points: [] },
    ren: { sunDir: [0.6, -0.4, -0.7], sunColor: [0.42, 0.36, 0.32], ambTop: [0.88, 0.8, 0.74], ambBottom: [0.42, 0.34, 0.3], fogColor: [0.3, 0.25, 0.22], fogNear: 6, fogFar: 14, points: [{ pos: [-0.8, 1.4, 0.6], color: [0.4, 0.36, 0.32] }] },
    park: { sunDir: [0.3, -0.7, -0.5], sunColor: [0.42, 0.42, 0.38], ambTop: [0.8, 0.84, 0.8], ambBottom: [0.4, 0.42, 0.36], fogColor: [0.82, 0.86, 0.86], fogNear: 18, fogFar: 60, points: [] },
    juice: { sunDir: [0.4, -0.5, -0.75], sunColor: [0.3, 0.27, 0.2], ambTop: [0.8, 0.74, 0.58], ambBottom: [0.4, 0.36, 0.28], fogColor: [0.3, 0.26, 0.18], fogNear: 6, fogFar: 12, points: [{ pos: [-0.5, 1.5, 0.9], color: [0.42, 0.38, 0.3] }] },
    greece: { sunDir: [0.3, -0.5, -0.8], sunColor: [0.36, 0.36, 0.38], ambTop: [0.84, 0.86, 0.9], ambBottom: [0.5, 0.5, 0.5], fogColor: [0.78, 0.8, 0.82], fogNear: 30, fogFar: 120, points: [] },
    under: { sunDir: [0.1, -1, 0.2], sunColor: [0.3, 0.44, 0.42], ambTop: [0.5, 0.8, 0.78], ambBottom: [0.12, 0.3, 0.32], fogColor: [0.2, 0.46, 0.46], fogNear: 0.5, fogFar: 4.5, points: [] },
    surface: { sunDir: [0.2, -0.45, 0.85], sunColor: [0.5, 0.48, 0.44], ambTop: [0.6, 0.7, 0.9], ambBottom: [0.3, 0.32, 0.38], fogColor: [0.7, 0.82, 0.94], fogNear: 100, fogFar: 900, points: [] },
    towel: { sunDir: [0.5, -0.4, -0.75], sunColor: [0.36, 0.35, 0.33], ambTop: [0.95, 0.93, 0.9], ambBottom: [0.5, 0.48, 0.46], fogColor: [0.4, 0.38, 0.36], fogNear: 7, fogFar: 15, points: [{ pos: [-1.0, 1.7, -0.9], color: [0.4, 0.4, 0.4] }] },
    santa: { sunDir: [0.25, -0.7, -0.65], sunColor: [0.26, 0.24, 0.2], ambTop: [1.0, 0.94, 0.82], ambBottom: [0.5, 0.46, 0.4], fogColor: [0.08, 0.07, 0.05], fogNear: 9, fogFar: 22, points: [{ pos: [0.2, 2.1, 1.6], color: [0.32, 0.28, 0.22] }] },
    studio: { sunDir: [0.2, -0.4, -0.9], sunColor: [0.34, 0.35, 0.38], ambTop: [0.92, 0.94, 0.98], ambBottom: [0.5, 0.52, 0.56], fogColor: [0.5, 0.52, 0.56], fogNear: 6, fogFar: 14, points: [] },
    bra: { sunDir: [0.3, -0.4, -0.85], sunColor: [0.34, 0.33, 0.3], ambTop: [0.92, 0.9, 0.86], ambBottom: [0.46, 0.44, 0.4], fogColor: [0.4, 0.38, 0.35], fogNear: 6, fogFar: 14, points: [] }
  };

  const streamKeys = track([
    [0.0, { nk: [0.25, 0.25, 0.1], eyes: 'squint', mouth: 'open' }],
    [0.3, { nk: [0.1, -0.2, -0.15], eyes: 'shut', mouth: 'smile' }],
    [0.6, { nk: [0.0, 0.3, 0.1], eyes: 'squint', mouth: 'open' }],
    [0.9, { nk: [-0.15, -0.1, -0.2], eyes: 'shut', mouth: 'shout' }],
    [1.2, { nk: [0.2, 0.25, 0.25], eyes: 'squint', mouth: 'open' }],
    [1.5, { nk: [0.1, -0.15, -0.1], eyes: 'shut', mouth: 'smile' }]
  ]);

  function shotStream(t) {
    const c = cam([0.24, 1.2, 1.55], [0.3, 1.04, 0], 48, 0, 0, t);
    const pl = trackPlace(c, 'stream', t, 0.0);
    const k = streamKeys(t);
    const roll = clamp(trackRoll('stream', t), -0.5, 0.5);
    const pose = body({ p: V3.sub(pl.mid, [0, 0.36, 0]), roll: -roll * 0.6, sp: [0.1, 0.25 * S(t * 5.2), roll * 0.4], nk: k.nk, eyes: k.eyes, mouth: k.mouth, brows: 'up', gL: 'open', gR: 'open', fL: [0.16, -0.86, 0.05], fR: [-0.16, -0.86, 0.05] });
    fitLimbs('yellow', pose, c, 'stream', t, { depthAll: 'front' });
    return { set: 'stream', env: ENVS.stream, camera: c, cast: [{ who: 'yellow', pose }], overlay: 'rules' };
  }

  function shotStreet(t, u) {
    const second = t >= 1.966;
    const c = second ? cam([0.25, 1.25, 1.5], [0.0, 0.95, 0], 42, 0.02, 0.01, t, 2) : cam([-0.2, 1.12, 1.25], [0.05, 0.86, 0], 50, -0.03, 0.012, t, 3);
    const pose = body(second
      ? { p: [0.0, 0.94, 0], tilt: 0.42, roll: 0.05, sp: [0.25, -0.15, 0], nk: [0.6, -0.35, 0.1], eyes: 'half', gaze: 'd', outfit: 'jacket' }
      : { p: [0.0, 0.95, 0], sp: [0.05, 0.1, 0], nk: [0.05, 0, 0], outfit: 'jacket' });
    fitLimbs('leather', pose, c, second ? 'bend' : 'street', t, { depthAll: 'mid' });
    if (!second) pose.hLw = V3.add(pose.p, [0.2, -0.12, 0.08]);
    return { set: 'street', env: ENVS.street, camera: c, cast: [{ who: 'leather', pose }] };
  }

  function shotCrocs(t, u) {
    const c = cam([0.123, 1.215, 0.622], [0.201, 1.143, -0.373], 48, 0.0, 0.004, t, 4);
    const pose = body({ p: [0.12, 0.62, -0.05], sit: true, nk: [0.05, -0.05, 0], eyes: 'open', gaze: 'c', mouth: 'shut', outfit: 'top', gL: 'hold', gR: 'hold' });
    const head = Cast.solve('young', pose).pts.head;
    const croc = V3.add(head, [0.09, -0.11 + 0.01 * S(u * 9), 0.15]);
    pose.hRw = V3.add(croc, [-0.1, -0.09, 0.0]);
    pose.hLw = V3.add(croc, [0.15, -0.06, 0.02]);
    pose.eRw = V3.add(croc, [-0.35, -0.35, -0.1]);
    pose.eLw = V3.add(croc, [0.4, -0.35, -0.1]);
    return { set: 'clips', env: ENVS.clips, camera: c, cast: [{ who: 'young', pose }], props: { croc: M4.chain(M4.translate(croc[0], croc[1], croc[2]), M4.rotZ(0.45), M4.rotY(PI / 2), M4.scale(1.3, 1.3, 1.3)) } };
  }

  function shotClips(t, u) {
    const c = cam([0.104, 1.149, 0.646], [0.01, 1.185, -0.349], 42, 0, 0.004, t, 5);
    const pose = body({ p: [0.05, 0.64, -0.02], sit: true, nk: [0.12 + 0.05 * S(u * 3), 0.04, 0.03], eyes: blink(t, 2) ? 'shut' : 'open', mouth: 'shut', gaze: 'c', outfit: 'top', gL: 'hold', gR: 'hold' });
    const head = Cast.solve('young', pose).pts.head;
    const base = V3.add(head, [0.0, -0.24, 0.18]);
    pose.hRw = V3.add(base, [-0.07, 0.0, 0.0]);
    pose.hLw = V3.add(base, [0.08, 0.0, 0.0]);
    pose.eRw = V3.add(base, [-0.4, -0.3, -0.15]);
    pose.eLw = V3.add(base, [0.4, -0.3, -0.15]);
    const fan = 0.06 * S(u * 2.4);
    return {
      set: 'clips', env: ENVS.clips, camera: c, cast: [{ who: 'young', pose }],
      props: { things: [[-0.07, 0.22 + fan, 0.0], [0.0, 0.02, 0.02], [0.075, -0.24 - fan, 0.0]].map(([dx, a, dz]) => M4.chain(M4.translate(base[0] + dx, base[1] + 0.01, base[2] + 0.04 + dz), M4.rotZ(a), M4.scale(0.95, 0.95, 0.95))) }
    };
  }

  const pcCam = track([
    [3.383, { yaw: 0.28, pitch: -0.06, eye: [-0.12, 1.2, 0.32] }],
    [3.7, { yaw: 0.12, pitch: -0.08, eye: [-0.1, 1.2, 0.33] }],
    [4.3, { yaw: -0.42, pitch: -0.05, eye: [0.0, 1.15, 0.38] }],
    [4.6, { yaw: -0.25, pitch: -0.06, eye: [-0.05, 1.18, 0.35] }],
    [4.85, { yaw: 0.22, pitch: -0.06, eye: [-0.12, 1.22, 0.3] }],
    [5.383, { yaw: 0.26, pitch: -0.05, eye: [-0.12, 1.22, 0.3] }]
  ]);

  function shotPc(t, u) {
    const k = pcCam(t);
    const at = V3.add(k.eye, [-S(k.yaw) * C(k.pitch), S(k.pitch), -C(k.yaw) * C(k.pitch)]);
    const c = cam(k.eye, at, 50, 0.08 * S(t * 3), 0.02, t, 6);
    const face = [-0.5, 1.2, 0.18];
    const horns = t > 4.75;
    const pose = body({ p: V3.add(face, [0.02, -0.64, -0.12]), yaw: 0.75, nk: [0.0, 0.3, 0.0], eyes: 'half', mouth: horns ? 'smile' : 'shut', outfit: 'top', gL: 'horns', gR: 'fist', noLegs: true, hRw: V3.add(k.eye, [0.06, -0.12, 0.05]) });
    if (horns) pose.hLw = [-0.24, 1.12, -0.08];
    else pose.hLw = V3.add(face, [0.1, -0.5, 0.05]);
    return { set: 'pc', env: ENVS.pc, camera: c, cast: [{ who: 'young', pose }] };
  }

  const bedKeys = track([
    [5.383, { p: [0.42, 0.6, 0.72], tilt: -0.05, roll: 0.0, yaw: -0.1, nk: [0.12, 0.25, 0.0], eyes: 'open', mouth: 'shut', swing: 0 }],
    [5.9, { p: [0.42, 0.6, 0.72], tilt: -0.08, roll: -0.06, yaw: -0.15, nk: [0.1, 0.3, 0.05], swing: 1 }],
    [6.3, { p: [0.42, 0.6, 0.72], tilt: 0.0, roll: 0.0, yaw: -0.05, nk: [0.25, -0.15, 0.0], eyes: 'half', swing: 1 }],
    [6.8, { p: [0.4, 0.6, 0.72], tilt: -0.12, roll: 0.05, yaw: 0.0, nk: [0.1, -0.1, 0.0], eyes: 'open', mouth: 'open' }],
    [7.15, { p: [0.36, 0.6, 0.72], tilt: -0.2, roll: 0.25, yaw: 0.1, nk: [0.0, 0.2, -0.2], mouth: 'open' }],
    [7.5, { p: [0.26, 0.6, 0.66], tilt: -0.5, roll: 0.75, yaw: 0.2, nk: [-0.2, 0.3, -0.3], eyes: 'shut', mouth: 'wide' }],
    [7.85, { p: [0.15, 0.62, 0.55], tilt: -0.95, roll: 1.1, yaw: 0.25, nk: [-0.2, 0.2, -0.2] }],
    [8.3, { p: [0.1, 0.66, 0.5], tilt: -1.25, roll: 1.2, yaw: 0.3, nk: [-0.1, 0.0, -0.2] }],
    [8.783, { p: [0.1, 0.66, 0.5], tilt: -1.3, roll: 1.25, yaw: 0.3, nk: [-0.1, 0.0, -0.2] }]
  ]);

  function shotBed(t) {
    const c = cam([0.02, 1.0, 2.3], [0.22, 0.78, 0.5], 38, 0, 0.006, t, 7);
    const k = bedKeys(t);
    const pose = body({ p: k.p, tilt: k.tilt, roll: k.roll, yaw: k.yaw, nk: k.nk, eyes: k.eyes, mouth: k.mouth, sit: true, gL: 'open', gR: 'fist' });
    pose.wear = 'tee';
    const fall = t > 7.4;
    fitVlad(pose, c, t, fall);
    const m = window.VladCast.solve(pose);
    const garment = t < 6.25 ? M4.chain(m.handR, M4.translate(0, -0.12, 0), M4.rotZ(0.6 * S(t * 7)), M4.rotX(1.2 + 0.6 * S(t * 6))) : null;
    return { set: 'vlad', env: ENVS.santa, camera: c, vlad: { pose, m }, props: { garment, heap: t >= 6.25 ? M4.translate(-0.42, 0.5, 0.52) : null, room: { heap: 'wall' } } };
  }

  function fitVlad(pose, c, t, fall) {
    const VC = window.VladCast;
    const kp = Track.at('bed', t);
    const D = VC.D;
    const m = VC.solve(pose);
    ['L', 'R'].forEach(s => {
      const sh = kp[KP['sh' + s]], el = kp[KP['el' + s]], wr = kp[KP['wr' + s]];
      if (sh[2] < 0.3 || el[2] < 0.3) return;
      const S3 = m.pts['shoulder' + s];
      const s2 = project(c, S3);
      const E3 = sphereHit(c, s2[0] + el[0] - sh[0], s2[1] + el[1] - sh[1], S3, D.upper, 'front');
      pose['e' + s + 'w'] = V3.add(E3, V3.mul(V3.sub(E3, S3), 0.3));
      if (wr[2] >= 0.3) {
        const e2 = project(c, E3);
        pose['h' + s + 'w'] = sphereHit(c, e2[0] + wr[0] - el[0], e2[1] + wr[1] - el[1], E3, D.fore, 'front');
      }
    });
    if (fall) {
      const u = clamp((t - 7.4) / 0.9, 0, 1);
      const kick = 0.5 + 0.5 * S((t - 7.4) * 7);
      pose.fL = [0.16, lerp(-0.5, -0.2, u), lerp(0.42, 0.9, u * kick)];
      pose.fR = [-0.16, lerp(-0.5, -0.1, u), lerp(0.42, 0.95, u * (1 - kick * 0.5))];
      pose.kL = [0.2, 1, 0.3];
      pose.kR = [-0.2, 1, 0.3];
    }
  }

  const limoKeys = track([
    [8.783, { yaw: 0.34, pitch: 0.0 }],
    [9.9, { yaw: 0.37, pitch: 0.02 }],
    [10.05, { yaw: 0.2, pitch: 0.35 }],
    [10.3, { yaw: -0.74, pitch: 0.08 }],
    [10.7, { yaw: -0.78, pitch: 0.04 }],
    [11.3, { yaw: -0.82, pitch: 0.05 }],
    [11.9, { yaw: -0.77, pitch: 0.04 }],
    [12.1, { yaw: 0.1, pitch: 0.3 }],
    [12.383, { yaw: 0.34, pitch: 0.0 }]
  ]);

  function shotLimo(t) {
    const k = limoKeys(t);
    const eye = [0.04, 1.14, 0.04];
    const at = V3.add(eye, [-S(k.yaw), S(k.pitch), -C(k.yaw)]);
    const c = cam(eye, at, 50, 0.1 * S(t * 2.1) - 0.06, 0.025, t, 8);
    const laugh = (t * 2.3) % 1 < 0.6;
    const party = body({ p: [-0.32, 0.62, -0.72], sit: true, yaw: 0.25, nk: [0.0, 0.35 + 0.1 * S(t * 3), 0.05 * S(t * 5)], eyes: laugh ? 'squint' : 'half', mouth: laugh ? 'laugh' : 'smile', hL: [0.25, -0.25, 0.2], hR: [-0.25, -0.25, 0.2] });
    const beanie = body({ p: [0.75, 0.6, -0.46], sit: true, yaw: -1.1, nk: [0.05 + 0.04 * S(t * 4), -0.35, 0.0], eyes: 'squint', mouth: (t * 1.7) % 1 < 0.5 ? 'laugh' : 'smile', hL: [0.25, -0.2, 0.3], hR: [-0.25, -0.22, 0.25] });
    return { set: 'limo', env: ENVS.limo, camera: c, cast: [{ who: 'party', pose: party }, { who: 'beanie', pose: beanie }] };
  }

  const airKeys = track([
    [12.383, { yaw: 0.0, pitch: -0.05, fov: 60, nk: [0.0, 0.25, 0.05], mouth: 'talk' }],
    [12.75, { yaw: 0.05, pitch: -0.05, nk: [0.05, -0.35, 0.0], mouth: 'shut' }],
    [12.95, { yaw: -0.5, pitch: -0.12, fov: 60 }],
    [13.3, { yaw: -0.62, pitch: -0.2, fov: 58 }],
    [14.2, { yaw: -0.5, pitch: -0.19, fov: 54 }],
    [16.0, { yaw: -0.38, pitch: -0.18, fov: 46 }]
  ]);

  function shotAirport(t) {
    const k = airKeys(t);
    const eye = [0.2, 1.55, 0.7];
    const at = V3.add(eye, [-S(k.yaw), S(k.pitch), -C(k.yaw)]);
    const c = cam(eye, at, k.fov, 0.02, 0.012, t, 9);
    const cast = [];
    if (t < 13.25) {
      const talk = k.mouth === 'talk' && (t * 7) % 1 < 0.55 ? 'talk' : 'shut';
      cast.push({ who: 'vlad', pose: body({ p: [-0.18, 0.95, 0.15], yaw: 0.3, nk: k.nk, eyes: 'open', mouth: talk, outfit: 'puffer', hair: 'slick', hRw: [0.12, 1.4, 0.55], gR: 'fist' }) });
    }
    return { set: 'airport', env: ENVS.airport, camera: c, cast };
  }

  const beachPath = track([
    [16.85, { x: 0.0, z: 0.0, yaw: 0.0, walk: 0 }],
    [17.2, { x: 0.0, z: -0.1, yaw: 0.0, walk: 0 }],
    [17.4, { x: 0.05, z: -0.4, yaw: PI, walk: 1 }],
    [17.62, { x: 0.15, z: -1.4, yaw: 0.15, walk: 0.3 }],
    [17.8, { x: 0.2, z: -2.0, yaw: PI, walk: 1 }],
    [18.2, { x: 0.3, z: -4.5, yaw: PI, walk: 1.4 }],
    [18.4, { x: 0.35, z: -5.6, yaw: PI, walk: 1.4 }],
    [18.6, { x: 0.4, z: -6.6, yaw: PI, walk: 0 }],
    [20.066, { x: 0.9, z: -14.5, yaw: PI, walk: 0 }]
  ]);

  function shotBeach(t) {
    if (t < 16.85) {
      const jump = t >= 16.633;
      const face = [0, 1.62, 0];
      const eye = jump ? [0.2, 1.42, 0.62] : [-0.031, 1.532, 0.631];
      const c = cam(eye, jump ? [0.0, 1.5, -0.3] : [-0.024, 1.464, -0.367], 52, jump ? 0.18 : -0.03, 0.02, t, 10);
      const pose = body({ p: [0, 0.95, 0], yaw: jump ? 0.25 : -0.1, nk: [0.05, (t < 16.25 ? -0.55 : 0.0) + (jump ? -0.2 : 0), 0.0], eyes: 'open', mouth: t > 16.3 ? 'smile' : 'talk', outfit: 'shorts', hair: 'slick', hRw: V3.add(eye, [-0.25, -0.25, 0.05]), eRw: V3.add(eye, [-0.55, -0.5, -0.3]), gR: 'fist', gaze: t < 16.25 ? 'r' : 'c' });
      return { set: 'beach', env: ENVS.beach, camera: c, cast: [{ who: 'vlad', pose }], face };
    }
    const pull = ease((t - 16.85) / 0.2);
    const eyeFar = [-0.3, 1.32, 1.35], eyeNear = [0.1, 1.5, 0.7];
    const c = cam(V3.lerp(eyeNear, eyeFar, pull), V3.lerp([0, 1.5, -0.3], [0.0, 1.3, 0.54], pull), lerp(52, 42, pull), 0, 0.004, t, 11);
    const k = beachPath(t);
    const swim = t > 18.55;
    const phase = (t - 16.85) * 9.5;
    const p = [k.x, swim ? -0.1 : 0.95 - (k.walk > 0.5 ? 0.04 * Math.abs(S(phase)) : 0), k.z];
    const pose = body({ p, yaw: k.yaw, tilt: swim ? 1.45 : k.walk > 1.2 ? 0.25 : 0.05, eyes: 'open', mouth: 'smile', outfit: 'shorts', hair: 'slick', gL: 'point', gR: 'point' });
    if (k.walk > 0.2 && !swim) walkLegs(pose, phase, 0.28 * Math.min(1, k.walk), 0.12);
    if (!swim) fitLimbs('vlad', pose, c, 'beach', t, { depthAll: 'mid' });
    else {
      pose.hLw = V3.add(p, [0.3 + 0.2 * S(t * 6), 0.1, -0.5]);
      pose.hRw = V3.add(p, [-0.3 - 0.2 * S(t * 6 + 2), 0.1, -0.5]);
    }
    const splash = t > 18.15 && t < 18.9 ? { p: [k.x, 0, k.z], k: 0.5 + 1.2 * S(clamp((t - 18.15) / 0.75, 0, 1) * PI) } : null;
    return { set: 'beach', env: ENVS.beach, camera: c, cast: [{ who: 'vlad', pose }], splash };
  }

  const renKeys = track([
    [20.066, { p: [0.05, 0.92, -0.05], yaw: 0.25, tilt: 0.05, roll: 0.1 }],
    [20.8, { p: [-0.05, 0.92, -0.02], yaw: 0.45, tilt: 0.08, roll: 0.15 }],
    [21.3, { p: [0.0, 0.94, -0.08], yaw: -0.65, tilt: 0.1, roll: -0.1 }],
    [21.7, { p: [0.15, 0.95, -0.1], yaw: -0.8, tilt: 0.12, roll: -0.15 }],
    [21.933, { p: [0.25, 0.95, -0.1], yaw: -0.9, tilt: 0.12, roll: -0.15 }]
  ]);

  function shotRen(t) {
    if (t < 21.933) {
      const k = renKeys(t);
      const c = cam([0.0, 1.05, 0.62], [0.05, 0.95, 0], 58, 0.0, 0.006, t, 12);
      const pose = body({ p: k.p, yaw: k.yaw, tilt: k.tilt, roll: k.roll, nk: [0.4, 0, 0], eyes: 'half', hL: [0.32, -0.3, 0.05], hR: [-0.32, -0.3, 0.05], fL: [0.15, -0.88, 0.05], fR: [-0.15, -0.88, 0.05] });
      return { set: 'ren', env: ENVS.ren, camera: c, cast: [{ who: 'ren', pose }], overlay: 'ren', letterbox: 0.055, grade: [1.06, 0.88, 0.88, 0.1] };
    }
    const c = cam([0.177, 1.259, 0.138], [0.058, 1.311, -0.854], 52, 0.0, 0.003, t, 13);
    const pose = body({ p: [0.2, 0.62, -0.45], sit: true, yaw: -0.08, tilt: -0.08, nk: [0.12, 0.05 + 0.03 * S(t * 2), 0.05], eyes: blink(t, 4) ? 'shut' : 'half', brows: 'sad', mouth: 'shut', gaze: 'c', hL: [0.3, -0.35, 0.15], hR: [-0.3, -0.35, 0.15] });
    return { set: 'ren', env: ENVS.ren, camera: c, cast: [{ who: 'ren', pose }], overlay: 'ren', letterbox: 0.055, grade: [1.06, 0.9, 0.88, 0.1] };
  }

  const GROUP = [
    ['ginger', -1.95, -0.04, 0.35],
    ['stripe', -0.95, 0.0, 0.08],
    ['specs', 0.02, 0.1, -0.08],
    ['longhair', 0.72, 0.0, -0.12],
    ['vlad', 1.75, 0.15, -0.35]
  ];

  function shotGroup(t, u) {
    const c = cam([0.0, 1.48, 3.0], [0.0, 1.3, 0], 40, 0, 0.004, t, 14);
    const cast = GROUP.map(([who, x, z, yaw], i) => {
      const name = who === 'vlad' ? 'zip' : who;
      const kp = Track.at(name, t);
      const nose = kp[KP.nose];
      const sway = 0.02 * S(t * 1.3 + i);
      const pose = body({
        p: [x + sway, 0.98, z], yaw, outfit: who === 'vlad' ? 'zip' : undefined,
        nk: [0.04, (nose[0] - (kp[KP.shL][0] + kp[KP.shR][0]) / 2) * 6 - yaw * 0.6, 0],
        eyes: blink(t, i + 1) ? 'shut' : 'open', mouth: i === 3 && (t * 3) % 1 < 0.5 ? 'talk' : i === 2 ? 'smile' : 'shut',
        hL: [0.16, -0.38, 0.12], hR: [-0.16, -0.38, 0.12], gL: 'fist', gR: 'fist', fL: [0.13, -0.88, 0.04], fR: [-0.13, -0.88, 0.04]
      });
      if (who === 'longhair') pose.hRw = [x - 0.62, 1.38, z + 0.05];
      if (who === 'stripe') { pose.hL = [0.2, -0.42, 0.06]; pose.hR = [-0.2, -0.42, 0.06]; }
      if (who === 'specs' && u > 2.4 && u < 3.1) pose.hRw = [x - 0.05, 1.58, z + 0.2];
      return { who, pose };
    });
    return { set: 'park', env: ENVS.park, camera: c, cast };
  }

  const juiceKeys = track([
    [27.133, { nk: [0.05, 0.15, 0.05], eyes: 'half', mouth: 'talk', fov: 42, hL: [0.26, -0.3, 0.32], tip: 0 }],
    [27.3, { nk: [0.1, 0.1, 0.1], eyes: 'half', mouth: 'shut', hL: [0.2, -0.05, 0.36], tip: 0.2 }],
    [27.5, { hL: [0.26, -0.3, 0.32], tip: 0 }],
    [27.6, { nk: [0.0, 0.05, -0.05], eyes: 'half', mouth: 'open' }],
    [28.1, { nk: [0.05, 0.25, 0.0], eyes: 'half', mouth: 'talk', hL: [0.26, -0.3, 0.32], tip: 0 }],
    [28.3, { hL: [0.18, 0.02, 0.34], tip: 0.3 }],
    [28.5, { nk: [0.0, 0.15, 0.05], eyes: 'shut', mouth: 'pout', fov: 39, hL: [0.12, 0.26, 0.3], tip: 1 }],
    [29.0, { nk: [-0.2, 0.1, 0.1], eyes: 'shut', mouth: 'pout', hL: [0.1, 0.3, 0.26], tip: 1.1 }],
    [30.633, { nk: [-0.26, 0.12, 0.12], eyes: 'shut', mouth: 'pout', fov: 34, hL: [0.1, 0.33, 0.24], tip: 1.2 }]
  ]);

  function packBasis(base, dir) {
    const y = V3.norm(dir);
    const x = V3.norm(V3.cross(y, [0, 0, 1]));
    const z = V3.cross(x, y);
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, base[0], base[1], base[2], 1]);
  }

  function shotJuice(t) {
    const k = juiceKeys(t);
    const c = cam([-0.124, 1.266, 0.56], [0.045, 1.252, -0.425], k.fov, 0, 0.003, t, 15);
    const pose = body({ p: [0.0, 0.66, -0.1], sit: true, nk: k.nk, eyes: k.eyes, mouth: k.mouth, outfit: 'polo', gL: 'hold', gR: 'open', hR: [-0.25, -0.35, 0.25] });
    const R = Cast.DIMS.heavy.head;
    const mouth = M4.point(Cast.solve('vlad', pose).head, [0.03, -0.52 * R, 0.92 * R]);
    const lift = clamp(k.tip, 0, 1.2);
    const restBase = [0.19, 0.98, 0.15];
    const drinkDir = V3.norm([-0.86, -0.22 - 0.12 * (lift - 1), -0.32]);
    const drinkBase = V3.sub(mouth, V3.mul(drinkDir, 0.235));
    const u = clamp(lift, 0, 1);
    const dir = V3.norm(V3.lerp([0, 1, 0], drinkDir, u));
    const base = V3.lerp(restBase, drinkBase, u);
    const pack = packBasis(base, dir);
    const side = M4.dir(pack, [1, 0, 0]);
    pose.hLw = V3.add(V3.add(base, V3.mul(dir, 0.07)), V3.mul(side, 0.06));
    pose.eLw = V3.add(pose.hLw, [0.35, -0.25, -0.2]);
    return { set: 'juice', env: ENVS.juice, camera: c, cast: [{ who: 'vlad', pose }], props: { pack } };
  }

  function shotGreece(t) {
    const c = cam([0.1, 1.15, 4.6], [0.05, 1.32, 0], 44, 0, 0.004, t, 16);
    const d = trackDepth(c, 'greece', t, 0.42);
    const mid = d.mid;
    const phase = t * 6;
    const pose = body({ p: [mid[0], 0.97, Math.min(1.8, mid[2])], roll: -trackRoll('greece', t) * 0.5, eyes: 'squint', mouth: 'smile', outfit: 'greece', gL: 'open', gR: 'open', sp: [0, 0.2 * S(phase * 0.5), 0] });
    walkLegs(pose, phase, 0.06, 0.05);
    fitLimbs('vlad', pose, c, 'greece', t, { depthAll: 'front' });
    return { set: 'greece', env: ENVS.greece, camera: c, cast: [{ who: 'vlad', pose }], overlay: 'donate' };
  }

  const underKeys = track([
    [34.316, { head: [0.1, -0.35, -0.55], tilt: 0.35, nk: [0.2, 0, 0], camPitch: 0.45 }],
    [34.6, { head: [0.12, -0.62, -0.5], tilt: 0.45, nk: [0.35, -0.1, 0], camPitch: 0.15 }],
    [35.0, { head: [0.14, -0.78, -0.46], tilt: 0.4, nk: [0.4, -0.05, 0], camPitch: 0.1 }],
    [35.4, { head: [0.08, -0.72, -0.5], tilt: 0.15, nk: [0.1, 0.0, 0], camPitch: 0.45 }],
    [36.0, { head: [0.04, -0.5, -0.52], tilt: -0.05, nk: [-0.2, 0.0, 0], camPitch: 0.95 }],
    [36.683, { head: [0.0, -0.15, -0.5], tilt: -0.1, nk: [-0.25, 0.0, 0], camPitch: 1.1 }]
  ]);

  function shotUnder(t) {
    const k = underKeys(t);
    const eye = [0.0, -0.95, 0.05];
    const at = V3.add(eye, [0, S(k.camPitch), -C(k.camPitch)]);
    const c = cam(eye, at, 88, 0.15 * S(t * 2), 0.03, t, 17);
    const pose = body({ p: V3.add(k.head, [0, -0.58, -0.12]), tilt: k.tilt, nk: k.nk, eyes: 'shut', mouth: 'shut', outfit: 'swim', hair: 'messy', hL: [0.45, 0.15, 0.25], hR: [-0.45, 0.2, 0.25], fL: [0.15, -0.85, -0.2], fR: [-0.15, -0.85, -0.2] });
    return { set: 'sea', env: ENVS.under, camera: c, cast: [{ who: 'vlad', pose }], under: true, grade: [0.86, 1.0, 1.0, 0.1] };
  }

  const surfKeys = track([
    [36.683, { face: [0.14, 0.06, -0.27], yaw: -0.25, roll: 0.42, pitch: 0.62, nk: [-0.25, -0.35, 0.1] }],
    [37.1, { face: [0.08, 0.07, -0.26], yaw: -0.15, roll: 0.3, pitch: 0.64, nk: [-0.3, -0.2, 0.05] }],
    [37.5, { face: [0.0, 0.08, -0.27], yaw: 0.0, roll: 0.1, pitch: 0.66, nk: [-0.32, 0.0, 0.0] }],
    [38.266, { face: [0.04, 0.05, -0.27], yaw: 0.1, roll: -0.18, pitch: 0.62, nk: [-0.28, 0.1, -0.05] }]
  ]);

  function shotSurface(t) {
    const k = surfKeys(t);
    const eye = [0, 0.03, 0.0];
    const at = V3.add(eye, [-S(k.yaw), S(k.pitch), -C(k.yaw)]);
    const c = cam(eye, at, 80, k.roll, 0.025, t, 18);
    const head = k.face;
    const pose = body({ p: [head[0], head[1] - 0.6, head[2] - 0.1], nk: k.nk, eyes: 'squint', brows: 'furrow', mouth: 'shout', outfit: 'swim', hair: 'slick', hL: [0.35, 0.0, 0.2], hR: [-0.35, 0.0, 0.2], noLegs: true });
    return { set: 'sea', env: ENVS.surface, camera: c, cast: [{ who: 'vlad', pose }], under: false, sun: { dir: V3.norm([-0.42, 0.78, -0.47]) } };
  }

  function shotTowel(t, u) {
    const c = cam([0.0, 1.2, 1.25], [0.0, 1.12, -1.0], 50, 0, 0.002, t, 19);
    const walkZ = lerp(-1.55, 0.45, ease((t - 39.4) / 1.9));
    const mid = trackPlace(c, 'towel', t, walkZ).mid;
    const turned = t < 39.5;
    const pose = body({ p: [mid[0], 0.98, walkZ], yaw: turned ? -1.2 + 0.2 * S(t * 2) : lerp(-0.6, 0, clamp((t - 39.5) / 0.6, 0, 1)), eyes: 'open', mouth: t > 40.3 ? 'talk' : 'shut', outfit: 'towel', gL: 'open', gR: 'open' });
    if (!turned) walkLegs(pose, (t - 39.5) * 7, 0.2, 0.1);
    fitLimbs('vlad', pose, c, 'towel', t, { depthAll: 'mid' });
    return { set: 'towel', env: ENVS.towel, camera: c, cast: [{ who: 'vlad', pose }], overlay: 'chat' };
  }

  function shotSanta(t) {
    const c = cam([0.55, 1.08, 1.62], [0.18, 1.12, 0.55], 40, 0, 0.004, t, 20);
    const pose = body({ p: [0.12, 0.62, 0.62], sit: true, nk: [0.1, 0.1, 0], eyes: 'open', mouth: 'talk', outfit: 'santa', gL: 'hold', hL: [0.1, -0.05, 0.38], hR: [-0.4, -0.2, 0.15] });
    const blendIn = clamp((t - 41.983) / 0.15, 0, 1);
    return { set: 'vladroom', env: ENVS.santa, camera: c, cast: [{ who: 'vlad', pose }], overlay: 'tvbug', wipe: blendIn, props: { carton: true, room: { heap: 'back' } } };
  }

  const studioKeys = track([
    [42.133, { nk: [0.05, 0.05, 0.05], eyes: 'half', mouth: 'talk' }],
    [42.6, { nk: [0.0, -0.05, 0.0], eyes: 'shut', mouth: 'open' }],
    [43.1, { nk: [0.08, 0.05, 0.08], eyes: 'half', mouth: 'talk' }],
    [43.6, { nk: [0.1, 0.12, 0.05], eyes: 'shut', mouth: 'talk' }],
    [44.2, { nk: [0.05, -0.08, -0.03], eyes: 'half', mouth: 'open' }],
    [45.1, { nk: [0.05, 0.05, 0.0], eyes: 'shut', mouth: 'talk' }]
  ]);

  function shotStudio(t, u) {
    const k = studioKeys(t);
    const c = cam([0.0, 1.2, 0.34], [-0.02, 1.35, -0.6], 42, 0, 0.003, t, 21);
    const talk = k.mouth === 'talk' ? ((t * 6.5) % 1 < 0.5 ? 'talk' : 'shut') : k.mouth;
    const hand = t > 42.25 && t < 42.75;
    const pose = body({ p: [0.0, 0.64, -0.22], sit: true, nk: k.nk, eyes: k.eyes, brows: 'sad', mouth: talk, outfit: 'hoodie', gR: 'open', hL: [0.25, -0.3, 0.25], hR: hand ? [-0.02, 0.1, 0.3] : [-0.25, -0.3, 0.25] });
    return { set: 'studio', env: ENVS.studio, camera: c, cast: [{ who: 'vlad', pose }], overlay: 'greek', grecii: t >= 43.85 };
  }

  function shotBra(t) {
    const c = cam([0.023, 1.216, 0.447], [0.089, 0.979, -0.523], 48, 0.04, 0.004, t, 22);
    const ph = beatPhase(t);
    const pose = body({ p: [0.02, 0.66, -0.22], sit: true, roll: -0.05, nk: [0.18, 0.05 * S(t * 2.2), -0.08], eyes: 'squint', brows: 'furrow', mouth: ph < 0.5 ? 'grimace' : 'open', outfit: 'bra', gR: 'open', hL: [0.3, -0.32, 0.25] });
    const head = Cast.solve('vlad', pose).pts.head;
    const slap = t < 45.95 ? 0 : 0.5 + 0.5 * C(2 * PI * ph);
    pose.hRw = V3.lerp(V3.add(head, [-0.17, 0.03, 0.15]), V3.add(head, [-0.03, -0.14, 0.21]), slap);
    pose.eRw = V3.add(head, [-0.45, -0.45, 0.05]);
    return { set: 'bra', env: ENVS.bra, camera: c, cast: [{ who: 'vlad', pose }], selective: true };
  }

  const SHOTS = [
    { t: 0, name: 'stream', fn: shotStream },
    { t: 1.683, name: 'street', fn: shotStreet },
    { t: 1.966, name: 'bend', fn: shotStreet },
    { t: 2.2, name: 'crocs', fn: shotCrocs },
    { t: 2.566, name: 'clips', fn: shotClips },
    { t: 3.383, name: 'pc', fn: shotPc },
    { t: 5.383, name: 'bed', fn: shotBed },
    { t: 8.783, name: 'limo', fn: shotLimo },
    { t: 12.383, name: 'airport', fn: shotAirport },
    { t: 16.0, name: 'beach', fn: shotBeach },
    { t: 20.066, name: 'ren', fn: shotRen },
    { t: 21.933, name: 'renFace', fn: shotRen },
    { t: 23.433, name: 'group', fn: shotGroup },
    { t: 27.133, name: 'juice', fn: shotJuice },
    { t: 30.633, name: 'greece', fn: shotGreece },
    { t: 34.316, name: 'under', fn: shotUnder },
    { t: 36.683, name: 'surface', fn: shotSurface },
    { t: 38.266, name: 'towel', fn: shotTowel },
    { t: 41.833, name: 'santa', fn: shotSanta },
    { t: 42.133, name: 'studio', fn: shotStudio },
    { t: 45.1, name: 'bra', fn: shotBra }
  ];

  function shotIndex(t) {
    let i = 0;
    while (i + 1 < SHOTS.length && SHOTS[i + 1].t <= t) i++;
    return i;
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION - 1e-3);
    const i = shotIndex(tt);
    const sh = SHOTS[i];
    const st = sh.fn(tt, tt - sh.t, sh);
    st.t = tt;
    st.shot = sh.name;
    st.index = i;
    st.cast = st.cast || [];
    st.letterbox = st.letterbox || 0;
    st.grade = st.grade || null;
    return st;
  }

  function lyricAt(t) {
    let out = '';
    LYRICS.forEach(([t0, text]) => { if (t >= t0) out = text; });
    return t < 46.7 ? out : '';
  }

  window.StsScript = { ID, DURATION, CUTS, SHOTS, LYRICS, BEAT, stage, lyricAt, project, rayDir, track, voice: Track.voice };
})();
