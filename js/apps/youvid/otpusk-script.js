(function () {
  const { M4, V3 } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, ease } = K;
  const Rig = window.YouVidRig;
  const B = window.OtpuskBeats;
  const VO = window.OtpuskVoice || { vlad: '0', op: '0' };

  const ID = 'Sav3lOtpusk';
  const DURATION = 905.0;
  const FOV = 42;
  const P_Y = 1.0;
  const STRIDE = 1.5;
  const VOICE = K.envelope(VO.vlad, 20);
  const OPV = K.envelope(VO.op, 20);
  const CUTS = [0];

  function numeric(a, b) {
    if (typeof a === 'number' && typeof b === 'number') return true;
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every(v => typeof v === 'number');
  }

  function find(list, t) {
    let lo = 0, hi = list.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (list[mid][0] <= t) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  function compile(keys, linear, blend) {
    const fields = {};
    keys.forEach(([t, o]) => Object.keys(o).forEach(k => { (fields[k] = fields[k] || []).push([t, o[k]]); }));
    const names = Object.keys(fields);
    return (t) => {
      const out = {};
      names.forEach(k => {
        const list = fields[k];
        if (t < list[0][0]) return;
        const i = find(list, t);
        const [t0, v0] = list[i];
        const nx = list[i + 1];
        if (t <= t0 || !nx || !numeric(v0, nx[1])) {
          out[k] = v0;
          return;
        }
        const span = blend ? Math.min(blend, nx[0] - t0) : nx[0] - t0;
        const raw = clamp((t - (nx[0] - span)) / span, 0, 1);
        const e = linear && linear.includes(k) ? raw : ease(raw);
        out[k] = Array.isArray(v0) ? v0.map((v, j) => lerp(v, nx[1][j], e)) : lerp(v0, nx[1], e);
      });
      return out;
    };
  }

  const MOTION = (window.YouVidMotion || {})[ID];
  const motionAt = Rig.motion(MOTION);
  const SEGS = MOTION ? MOTION.segs.map(s => [s.t0, s.t1]) : [];

  function solveYaw(view, t0, t1) {
    let sx = 0, sz = 0, n = 0;
    for (let t = t0; t < t1; t += 0.2) {
      const i = SEGS.length ? find(SEGS, t) : -1;
      if (i < 0 || t < SEGS[i][0] || t >= SEGS[i][1]) continue;
      const mv = motionAt(t);
      if (!mv) continue;
      const a = view - mv[10] - Math.atan2(mv[3], mv[5]);
      sx += S(a);
      sz += C(a);
      n++;
    }
    return n ? Math.atan2(sx, sz) : view - PI;
  }

  const PLACE_KEYS = B.PLACE.map(([t, x, z, yaw, o], i) => {
    const next = B.PLACE[i + 1] ? B.PLACE[i + 1][0] : DURATION;
    const y = o && o.view !== undefined ? solveYaw(o.view, t, next) : yaw;
    return [t, Object.assign({ pos: [x, z], yaw: y }, o || {})];
  });
  for (let i = 1; i < PLACE_KEYS.length; i++) {
    const prev = PLACE_KEYS[i - 1][1].yaw;
    let y = PLACE_KEYS[i][1].yaw;
    while (y - prev > PI) y -= PI * 2;
    while (y - prev < -PI) y += PI * 2;
    PLACE_KEYS[i][1].yaw = y;
  }
  const PLACE = compile(PLACE_KEYS, ['pos']);
  const ACT = compile(B.ACT, null, 0.45);
  const CAM_KEYS = (() => {
    let base = {};
    return B.CAM.map(([t, o]) => {
      if (o.selfie) return [t, o];
      if (o.restore) return [t, Object.assign({}, base, { quick: 1 })];
      base = o;
      return [t, o];
    });
  })();

  function CAM(t) {
    return CAM_KEYS[find(CAM_KEYS, t)][1];
  }

  function camSpan(t) {
    const i = find(CAM_KEYS, t);
    return [CAM_KEYS[i][0], CAM_KEYS[i + 1] ? CAM_KEYS[i + 1][0] : DURATION];
  }

  const VIEWS = B.PLACE.map(([t, , , , o]) => [t, o && o.view !== undefined ? o.view : null]);

  const DIST = (() => {
    const step = 0.05;
    const n = Math.ceil(DURATION / step) + 2;
    const d = new Float32Array(n);
    let prev = PLACE(0).pos;
    for (let i = 1; i < n; i++) {
      const p = PLACE(i * step).pos;
      d[i] = d[i - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    return { step, d };
  })();

  function distAt(t) {
    const x = clamp(t, 0, DURATION) / DIST.step;
    const i = Math.min(DIST.d.length - 2, Math.floor(x));
    return lerp(DIST.d[i], DIST.d[i + 1], x - i);
  }

  function speedAt(t) {
    return (distAt(t + 0.15) - distAt(t - 0.15)) / 0.3;
  }

  function motionWeight(t) {
    const i = SEGS.length ? find(SEGS, t) : -1;
    if (i < 0) return 0;
    const [a, b] = SEGS[i];
    if (t < a || t >= b) return 0;
    return clamp((t - a) / 0.25, 0, 1) * clamp((b - t) / 0.25, 0, 1);
  }

  function angDiff(a, b) {
    let d = b - a;
    while (d > PI) d -= PI * 2;
    while (d < -PI) d += PI * 2;
    return d;
  }

  const STANDING = {
    sp: [0, 0, 0], nk: [0, 0, 0],
    hL: [0.3, -0.36, 0.1], hR: [-0.3, -0.36, 0.1], eL: [0.6, -0.2, -0.6], eR: [-0.6, -0.2, -0.6],
    gL: 'open', gR: 'open', eyes: 'open', frown: 0, strap: 1, phone: null, bagL: null, bagR: null
  };

  const PHONE_EAR = { hL: [0.15, 0.4, 0.07], eL: [0.65, -0.55, 0.2], gL: 'phone', phone: 'L', wL: [0.2, 0, 0] };

  function legs(pose, t, sp, crouch) {
    const ph = (distAt(t) / STRIDE) * PI * 2;
    const k = clamp(sp / 0.8, 0, 1);
    const out = {};
    [['L', 1, 0], ['R', -1, PI]].forEach(([s, side, off]) => {
      const f = ph + off;
      const z = 0.04 + 0.3 * k * S(f);
      const lift = 0.1 * k * Math.max(0, C(f));
      const y = -0.9 + lift + crouch * 0.42;
      out['f' + s] = [side * (0.15 - crouch * 0.02), y, z + crouch * 0.12];
      out['k' + s] = [side * (0.15 + crouch * 0.25), 0, 1];
      out['a' + s] = 0.1 * k * C(f) - crouch * 0.3;
    });
    out.bob = k * 0.03 * C(ph * 2) - crouch * 0.42;
    out.sway = k * 0.025 * S(ph);
    out.swing = k * S(ph);
    return out;
  }

  function faceAt(t, pose) {
    const v = VOICE(t);
    const mouth = pose.mouthHold || (v < 0.16 ? 'shut' : v < 0.5 ? 'open' : 'wide');
    let eyes = pose.eyes || 'open';
    const b = (t * 0.29 + 0.13) % 1;
    if ((eyes === 'open' || eyes === 'side') && b < 0.035) eyes = 'shut';
    return { mouth, eyes };
  }

  function vladWorld(t) {
    const pl = PLACE(t);
    return { x: pl.pos[0], z: pl.pos[1], yaw: pl.yaw, crouch: pl.crouch || 0 };
  }

  function stageVlad(t) {
    const w = vladWorld(t);
    const act = ACT(t);
    const arms = act.armsKeyed ? {} : { hL: STANDING.hL, hR: STANDING.hR, eL: STANDING.eL, eR: STANDING.eR, wL: null, wR: null };
    const pose = Object.assign({}, STANDING, act, arms, act.phoneEar && !act.armsKeyed ? PHONE_EAR : {});
    const wM = motionWeight(t);
    const mv = wM > 0 ? motionAt(t) : null;
    const sp = speedAt(t);
    const keep = (act.keep || '').split(' ');
    if (mv) {
      const blend3 = (key, idx) => {
        if (keep.includes(key)) return;
        const v = [mv[idx], mv[idx + 1], mv[idx + 2]];
        pose[key] = pose[key] ? pose[key].map((a, i) => lerp(a, v[i], wM)) : v;
      };
      blend3('sp', 9);
      blend3('nk', 12);
      const armOk = (c) => c > 0.45;
      if (!act.armsKeyed) {
        if (armOk(mv[27]) && !keep.includes('L')) { blend3('hL', 15); blend3('eL', 18); }
        if (armOk(mv[28]) && !keep.includes('R')) { blend3('hR', 21); blend3('eR', 24); }
      }
    }
    pose.sp = [clamp(pose.sp[0], -0.4, 0.8), clamp(pose.sp[1], -0.8, 0.8), clamp(pose.sp[2], -0.5, 0.5)];
    const lg = legs(pose, t, sp, w.crouch);
    ['fL', 'fR', 'kL', 'kR', 'aL', 'aR'].forEach(k => { pose[k] = lg[k]; });
    const breath = S(t * 1.5) * 0.01;
    pose.sp = [pose.sp[0] + breath + w.crouch * 0.35, pose.sp[1], pose.sp[2]];
    const v = VOICE(t);
    pose.nk = [pose.nk[0] + v * 0.05 * S(t * 11), pose.nk[1] + v * 0.04 * S(t * 6.7), pose.nk[2] + v * 0.03 * S(t * 4.9)];
    if (!mv || !armOk2(mv)) {
      if (!act.phoneEar && !act.armsKeyed && !pose.bagL) pose.hL = [pose.hL[0], pose.hL[1], pose.hL[2] + lg.swing * 0.12];
      if (!act.armsKeyed && !pose.bagR) pose.hR = [pose.hR[0], pose.hR[1], pose.hR[2] - lg.swing * 0.12];
    }
    const base = M4.chain(M4.translate(w.x, P_Y + lg.bob, w.z), M4.rotY(w.yaw), M4.translate(lg.sway, 0, 0));
    pose.p = M4.point(base, [0, 0, 0]);
    pose.up = M4.dir(base, [0, 1, 0]);
    pose.fwd = M4.dir(base, [0, 0, 1]);
    pose.swingL = [lg.swing * 0.15, 0.04];
    pose.swingR = [-lg.swing * 0.15, -0.04];
    pose.bagYaw = w.yaw;
    const face = faceAt(t, pose);
    pose.mouth = face.mouth;
    pose.eyes = face.eyes;
    const m = Rig.solve(pose, window.OtpuskCast.D);
    return { pose, m, world: w, mv, wM, speed: sp };
  }

  function armOk2(mv) {
    return mv[27] > 0.45 || mv[28] > 0.45;
  }

  function shotTarget(t, cam, pos, yawSmooth, yawNow) {
    if (cam.mode === 'world') return { eye: cam.eye, at: cam.at };
    if (cam.mode === 'face') {
      const v = VIEWS[find(VIEWS, t)][1];
      let look = v === null ? yawSmooth + PI : v;
      const wM = motionWeight(t);
      const mv = wM > 0 ? motionAt(t) : null;
      if (mv) look += angDiff(look, yawNow + mv[10] + Math.atan2(mv[3], mv[5])) * wM;
      const dx = S(look), dz = C(look);
      const side = cam.side || 0;
      return {
        eye: [pos[0] - dx * cam.d - dz * side, P_Y + cam.h, pos[1] - dz * cam.d + dx * side],
        at: [pos[0], P_Y + cam.ay, pos[1]]
      };
    }
    const f = M4.chain(M4.translate(pos[0], P_Y, pos[1]), M4.rotY(cam.selfie ? yawNow : yawSmooth));
    return { eye: M4.point(f, cam.eye), at: M4.point(f, cam.at) };
  }

  const TRACK = (() => {
    const step = 0.05;
    const n = Math.ceil(DURATION / step) + 2;
    const eye = new Float32Array(n * 3), dir = new Float32Array(n * 3), speed = new Float32Array(n);
    const p0 = PLACE(0);
    let yaw1 = p0.yaw, yaw2 = p0.yaw;
    let anc1 = p0.pos.slice(), anc2 = p0.pos.slice();
    let pol1 = null, pol2 = null, dir1 = null, dir2 = null;
    const lag = (tau) => 1 - Math.exp(-step / tau);
    const polar = (v) => [Math.atan2(v[0], v[2]), Math.hypot(v[0], v[2]), v[1]];
    const follow = (from, to, k) => [from[0] + angDiff(from[0], to[0]) * k, lerp(from[1], to[1], k), lerp(from[2], to[2], k)];
    let prev = null;
    for (let i = 0; i < n; i++) {
      const t = i * step;
      const pl = PLACE(t);
      const cam = CAM(t);
      const tau = cam.quick && t - camSpan(t)[0] < 1.2 ? 0.22 : cam.tau || 0.6;
      const ky = lag(0.7);
      yaw1 += (pl.yaw - yaw1) * ky;
      yaw2 += (yaw1 - yaw2) * ky;
      const ka = lag(0.25);
      anc1 = [lerp(anc1[0], pl.pos[0], ka), lerp(anc1[1], pl.pos[1], ka)];
      anc2 = [lerp(anc2[0], anc1[0], ka), lerp(anc2[1], anc1[1], ka)];
      const tg = shotTarget(t, cam, pl.pos, yaw2, pl.yaw);
      const ref = cam.mode === 'world' ? anc2 : pl.pos;
      const want = polar([tg.eye[0] - ref[0], tg.eye[1], tg.eye[2] - ref[1]]);
      if (!pol1) {
        pol1 = want.slice();
        pol2 = want.slice();
      }
      const k = lag(tau);
      pol1 = follow(pol1, want, k);
      pol2 = follow(pol2, pol1, k);
      const e = [anc2[0] + S(pol2[0]) * pol2[1], pol2[2], anc2[1] + C(pol2[0]) * pol2[1]];
      const wantDir = V3.norm(V3.sub(tg.at, e));
      if (!dir1) {
        dir1 = wantDir.slice();
        dir2 = wantDir.slice();
      }
      const kd = lag(Math.min(tau, 0.3));
      dir1 = V3.norm(V3.lerp(dir1, wantDir, kd));
      dir2 = V3.norm(V3.lerp(dir2, dir1, kd));
      eye.set(e, i * 3);
      dir.set(dir2, i * 3);
      speed[i] = prev ? Math.hypot(e[0] - prev[0], e[2] - prev[2]) / step : 0;
      prev = e;
    }
    return { step, n, eye, dir, speed };
  })();

  function trackAt(t) {
    const x = clamp(t, 0, DURATION) / TRACK.step;
    const i = Math.min(TRACK.n - 2, Math.floor(x));
    const f = x - i;
    const get = (arr) => [0, 1, 2].map(j => lerp(arr[i * 3 + j], arr[(i + 1) * 3 + j], f));
    return { eye: get(TRACK.eye), dir: V3.norm(get(TRACK.dir)), speed: lerp(TRACK.speed[i], TRACK.speed[i + 1], f) };
  }

  function boing(x) {
    return x <= 0 ? 0 : 1 - Math.exp(-7 * x) * C(13 * x);
  }

  function gagAt(t) {
    const out = { body: [1, 1, 1], head: 1, spin: 0, lift: 0, zoom: 1, vertigo: 1, shake: 0, negative: 0, text: null, textT: 0, hearts: -1 };
    B.GAGS.forEach(([t0, t1, g]) => {
      if (t < t0 || t > t1 + 0.8) return;
      const on = t < t1;
      const k = boing(t - t0) - boing(t - t1);
      const u = clamp((t - t0) / (t1 - t0), 0, 1);
      if (g.body) out.body = out.body.map((v, i) => v * (1 + (g.body[i] - 1) * k));
      if (g.head) out.head *= 1 + (g.head - 1) * k;
      if (g.spin) out.spin += PI * 2 * Math.round(g.spin * (t1 - t0)) * ease(u);
      if (g.lift) out.lift += g.lift * k;
      if (!on) return;
      if (g.zoom) out.zoom *= g.zoom;
      if (g.stutter) out.zoom *= Math.floor((t - t0) / g.stutter) % 2 ? 0.55 : 1;
      if (g.vertigo) out.vertigo = lerp(1, g.vertigo, ease(u));
      if (g.shake) out.shake += g.shake;
      if (g.negative) out.negative = 1;
      if (g.text) {
        out.text = g.text;
        out.textT = t - t0;
      }
      if (g.hearts) out.hearts = t - t0;
    });
    return out;
  }

  const SOLIDS = (() => {
    const Wd = window.OtpuskWorld;
    const out = [];
    Wd.PARKED.concat(Wd.LOT).forEach(([kind, x, z, ry]) => {
      const d = Wd.CAR_DIMS[kind];
      const along = Math.abs(S(ry)) < 0.5;
      const hx = (along ? d.L : d.W) / 2 + 0.18, hz = (along ? d.W : d.L) / 2 + 0.18;
      out.push([x - hx, z - hz, x + hx, z + hz, (kind === 'truck' ? 3.0 : d.Hr) + 0.12]);
    });
    Wd.BLOCKS.forEach(b => out.push([b.x0 - 0.3, b.z0 - 0.3, b.x1 + 0.3, b.z1 + 0.3, 60]));
    return out;
  })();

  function pushOut(p) {
    let best = null;
    SOLIDS.forEach(([x0, z0, x1, z1, h]) => {
      if (p[0] <= x0 || p[0] >= x1 || p[2] <= z0 || p[2] >= z1 || p[1] >= h) return;
      const opts = [[x0 - p[0], 0, 0], [x1 - p[0], 0, 0], [0, 0, z0 - p[2]], [0, 0, z1 - p[2]], [0, h - p[1], 0]];
      opts.forEach(o => { const l = Math.abs(o[0] + o[1] + o[2]); if (!best || l < best[1]) best = [o, l]; });
    });
    return best ? best[0] : [0, 0, 0];
  }

  function handheld(t, amp, speed) {
    const w = K.wobble(t * 1.6, amp, 1.3);
    const j = K.wobble(t * 5.7, amp * 0.22, 4.1);
    const walk = clamp(speed / 1.2, 0, 1);
    const ph = t * PI * 2 * 1.85;
    return {
      eye: [w[0] * 0.5 + j[0], w[1] * 0.35 + j[1] + walk * 0.02 * Math.abs(S(ph)), w[2] * 0.5],
      aim: [w[0] * 2.2 + j[0] * 1.4 + walk * 0.014 * S(ph), w[1] * 1.7 + j[1] * 1.4, w[2] * 2.2],
      roll: w[2] * 1.2 + walk * 0.01 * S(ph)
    };
  }

  function glueWeight(t, cam) {
    if (!cam.glue) return 0;
    const [t0, t1] = camSpan(t);
    return ease(clamp((t - t0) / 0.2, 0, 1) * clamp((t1 - t) / 0.2, 0, 1));
  }

  function cameraAt(t, st) {
    const cam = CAM(t);
    const gag = st.gag;
    const tr = trackAt(t);
    let eye = tr.eye;
    let at = V3.add(eye, tr.dir);
    const glued = glueWeight(t, cam);
    if (glued > 0) {
      eye = V3.lerp(eye, M4.point(st.m.head, [0.12, 0.04, 0.46]), glued);
      at = V3.lerp(at, M4.point(st.m.head, [0, -0.02, 0]), glued);
    }
    if (!cam.selfie && !glued) {
      const guard = (center, rad) => {
        const d = V3.sub(eye, center);
        const len = V3.len(d);
        if (len >= rad) return;
        const push = V3.mul(len > 1e-4 ? V3.norm(d) : [0, 0, 1], rad - len);
        eye = V3.add(eye, push);
        at = V3.add(at, push);
      };
      guard(M4.point(st.m.chest, [0, 0.0, 0.06]), 0.46);
      guard(M4.point(st.m.chest, [0, -0.28, 0.08]), 0.44);
      guard(st.m.pts.head, 0.24);
    }
    let fov = (cam.fov || FOV) * gag.zoom;
    if (gag.zoom < 1) at = V3.add(eye, V3.norm(V3.sub(M4.point(st.m.head, [0, -0.03, 0]), eye)));
    if (gag.vertigo < 1) {
      const head = st.m.pts.head;
      const dist = V3.len(V3.sub(head, eye));
      const wide = fov * gag.vertigo;
      const far = dist * Math.tan(fov * PI / 360) / Math.tan(wide * PI / 360);
      const back = V3.mul(V3.norm(V3.sub(eye, head)), far - dist);
      eye = V3.add(eye, back);
      at = V3.add(at, back);
      fov = wide;
    }
    const out = pushOut(eye);
    eye = V3.add(eye, out);
    at = V3.add(at, out);
    const hh = handheld(t, cam.shake === undefined ? 0.02 : cam.shake, glued ? 0 : tr.speed);
    const jolt = gag.shake ? K.wobble(t * 23, gag.shake, 7.7) : [0, 0, 0];
    eye = [eye[0] + hh.eye[0], Math.max(0.05, eye[1] + hh.eye[1]), eye[2] + hh.eye[2]];
    at = V3.add(V3.add(at, hh.aim), jolt);
    const dir = V3.norm(V3.sub(at, eye));
    const right = V3.norm(V3.cross(dir, [0, 1, 0]));
    const up0 = V3.cross(right, dir);
    const up = V3.norm(V3.add(V3.mul(up0, C(hh.roll)), V3.mul(right, S(hh.roll))));
    return { eye, at, up, fov, mode: cam.mode || 'rel', selfie: cam.selfie || null };
  }

  function trafficAt(t) {
    const out = [];
    B.TRAFFIC.forEach(([tc, kind, col, dir, xc, speed]) => {
      const v = speed || 11;
      const x = xc + dir * v * (t - tc);
      if (Math.abs(t - tc) * v < 160) out.push({ kind, col, x, z: dir > 0 ? 0.9 : -2.8, ry: dir > 0 ? 0 : PI, lights: true });
    });
    return out;
  }

  function walkersAt(t) {
    const out = [];
    B.WALKERS.forEach(([t0, t1, kind, from, to]) => {
      if (t < t0 || t > t1) return;
      const k = (t - t0) / (t1 - t0);
      const x = lerp(from[0], to[0], k), z = lerp(from[1], to[1], k);
      const yaw = Math.atan2(to[0] - from[0], to[1] - from[1]);
      const dist = Math.hypot(to[0] - from[0], to[1] - from[1]) * k;
      out.push({ kind, pos: [x, 0, z], yaw, phase: (dist / 1.3) * PI * 2, moving: true });
    });
    return out;
  }

  function opArmsAt(t) {
    return B.OPARMS.filter(a => t >= a[0] && t < a[1]).map(([t0, t1, o]) => {
      const k = clamp(Math.min((t - t0) / 0.35, (t1 - t) / 0.35), 0, 1);
      return Object.assign({ k: ease(k) }, o);
    });
  }

  function propsAt(t) {
    return B.PROPS.filter(p => t >= p[0] && t < p[1]).map(p => p[2]);
  }

  function stage(t) {
    const tt = clamp(t, 0, DURATION);
    const st = stageVlad(tt);
    st.gag = gagAt(tt);
    const camera = cameraAt(tt, st);
    const cam = CAM(tt);
    const op = cam.selfie ? { mood: cam.selfie, voice: OPV(tt), headAt: cam.opHead || null } : null;
    return {
      t: tt,
      pose: st.pose,
      m: st.m,
      world: st.world,
      camera,
      op,
      opArms: opArmsAt(tt),
      traffic: trafficAt(tt),
      walkers: walkersAt(tt),
      props: propsAt(tt),
      gag: st.gag
    };
  }

  window.OtpuskScript = { ID, DURATION, FOV, P_Y, VOICE, OPV, CUTS, stage, vladWorld, speedAt, motionWeight, gagAt, SEGS, PHONE_EAR };
})();
