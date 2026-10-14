(function (M) {
  'use strict';
  const PI = Math.PI;
  const BONES = [
    ['pelvis', -1, [0, 0.98, 0]],
    ['spine', 0, [0, 0.12, 0]],
    ['chest', 1, [0, 0.2, 0]],
    ['neck', 2, [0, 0.25, 0]],
    ['head', 3, [0, 0.07, 0]],
    ['uarmL', 2, [-0.2, 0.19, 0]],
    ['farmL', 5, [0, -0.29, 0]],
    ['handL', 6, [0, -0.25, 0]],
    ['uarmR', 2, [0.2, 0.19, 0]],
    ['farmR', 8, [0, -0.29, 0]],
    ['handR', 9, [0, -0.25, 0]],
    ['thighL', 0, [-0.1, -0.04, 0]],
    ['shinL', 11, [0, -0.44, 0]],
    ['footL', 12, [0, -0.44, 0]],
    ['thighR', 0, [0.1, -0.04, 0]],
    ['shinR', 14, [0, -0.44, 0]],
    ['footR', 15, [0, -0.44, 0]]
  ];
  const B = {};
  BONES.forEach((b, i) => { B[b[0]] = i; });
  const N = BONES.length;
  const STRIDE = 3 + N * 3;
  const ALL = BONES.map((b, i) => i);
  const LOWER = [B.pelvis, B.thighL, B.shinL, B.footL, B.thighR, B.shinR, B.footR];
  const DEATH_CLIP = { back: 'death_back', flyback: 'death_back', front: 'death_front' };
  const clips = {};

  function clip(name) {
    if (name in clips) return clips[name];
    const src = M.MOCAP && M.MOCAP[name];
    let c = null;
    if (src) {
      const bin = atob(src.data.replace(/-/g, '+').replace(/_/g, '/'));
      const v = new Float32Array(bin.length >> 1);
      for (let i = 0; i < v.length; i++) {
        const u = bin.charCodeAt(i * 2) | bin.charCodeAt(i * 2 + 1) << 8;
        v[i] = (u > 32767 ? u - 65536 : u) / src.q;
      }
      c = { fps: src.fps, frames: src.frames, loop: src.loop, dist: src.dist, len: src.frames / src.fps, v };
    }
    clips[name] = c;
    return c;
  }

  function turn(from, to) { return to - from - Math.round((to - from) / (2 * PI)) * 2 * PI; }

  function playClip(P, c, t, w, bones) {
    let f = t * c.fps, i0, i1;
    if (c.loop) { f = ((f % c.frames) + c.frames) % c.frames; i0 = Math.floor(f); i1 = (i0 + 1) % c.frames; }
    else { f = M.clamp(f, 0, c.frames - 1); i0 = Math.floor(f); i1 = Math.min(i0 + 1, c.frames - 1); }
    const k = f - i0, a = i0 * STRIDE, b = i1 * STRIDE, v = c.v;
    if (bones.includes(B.pelvis)) for (let j = 0; j < 3; j++) P.root[j] += (v[a + j] + (v[b + j] - v[a + j]) * k - P.root[j]) * w;
    for (const i of bones) {
      const o = 3 + i * 3, r = P.rot[i];
      for (let j = 0; j < 3; j++) {
        const x = v[a + o + j] + turn(v[a + o + j], v[b + o + j]) * k;
        r[j] += turn(r[j], x) * w;
      }
    }
  }

  const IDLES = ['idle', 'idle_look', 'idle_shift'];

  function idleClip(s, armed) {
    if (armed) return clip('idle_stance') || clip('idle');
    return clip(IDLES[(s.seed || 0) % IDLES.length]) || clip('idle');
  }

  function mocapLayer(P, s, amp, fwd, ph, bones, armed) {
    const idle = idleClip(s, armed), walk = clip('walk'), run = clip('run'), sprint = clip('sprint');
    const move = M.clamp(amp / 0.12, 0, 1), ahead = move * M.clamp((fwd - 0.5) / 0.3, 0, 1);
    const dist = ph * 2.3 / PI;
    if (idle && move < 1) playClip(P, idle, (s.t || 0) + (s.seed || 0) * 0.7, 1 - move, bones);
    if (walk && walk.dist > 0) {
      const w = ahead * (run ? 1 : M.clamp((0.62 - amp) / 0.14, 0, 1));
      if (w > 0) playClip(P, walk, dist / walk.dist * walk.len, w, bones);
    }
    if (run && run.dist > 0) {
      const w = ahead * M.clamp((amp - 0.48) / 0.14, 0, 1);
      if (w > 0) playClip(P, run, dist / run.dist * run.len, w, bones);
    }
    if (sprint && sprint.dist > 0) {
      const w = ahead * M.clamp((amp - 0.95) / 0.1, 0, 1);
      if (w > 0) playClip(P, sprint, dist / sprint.dist * sprint.len, w, bones);
    }
  }

  function stepLayer(P, s, amp, bones) {
    if (s.turn && amp < 0.1) {
      const c = clip(s.turn > 0 ? 'turn_l' : 'turn_r');
      if (c) playClip(P, c, s.turnT * 1.6, M.clamp(s.turnT / 0.12, 0, 1), bones);
    }
    if (s.stopT !== undefined && s.stopT < 0.75 && amp < 0.3) {
      const c = clip('run_stop');
      if (c) playClip(P, c, s.stopT * 1.1, 1 - M.smooth((s.stopT - 0.4) / 0.35), bones);
    }
    if (s.feet) P.rot[B.pelvis][1] += s.feet;
  }

  function landLayer(P, s) {
    const L = s.land;
    if (!L) return;
    if (L.kind === 'roll') {
      const c = clip('land_roll');
      if (c) playClip(P, c, 0.15 + L.t * 2.2, 1 - M.smooth((L.t - 0.55) / 0.25), ALL);
    } else {
      const c = clip('land_hard');
      if (c) playClip(P, c, 0.12 + L.t * 1.7, 1 - M.smooth((L.t - 0.45) / 0.4), ALL);
    }
  }

  function airLayer(P, s, bones) {
    const up = clip('jump_up'), fall = clip('fall');
    const airT = s.airT || 0;
    if (up && s.jumped && airT < 0.4) playClip(P, up, airT, 1, bones);
    if (fall) {
      const w = s.jumped ? M.clamp((airT - 0.2) / 0.2, 0, 1) : M.clamp(airT / 0.25, 0, 1);
      if (w > 0) { playClip(P, fall, airT, w, bones); P.root[1] += 0.3 * w; }
    }
  }

  function toFrame(Q, dYaw) {
    if (!dYaw) return;
    const c = Math.cos(dYaw), sn = Math.sin(dYaw), x = Q.root[0], z = Q.root[2];
    Q.root[0] = c * x + sn * z;
    Q.root[2] = -sn * x + c * z;
    Q.rot[B.pelvis][1] += dYaw;
  }

  function mix(P, Q, w) {
    if (w <= 0) return;
    for (let j = 0; j < 3; j++) P.root[j] += (Q.root[j] - P.root[j]) * w;
    for (let i = 0; i < N; i++) for (let j = 0; j < 3; j++) P.rot[i][j] += turn(P.rot[i][j], Q.rot[i][j]) * w;
  }

  function coverArms(Q, s) {
    const h = s.hold;
    if (h === 'pistol' || h === 'dual') {
      Q.rot[B.uarmR] = [-0.2, 0.15, 0.25]; Q.rot[B.farmR] = [2.25, 0, 0]; Q.rot[B.handR] = [0.45, 0, 0];
      if (h === 'dual') { Q.rot[B.uarmL] = [-0.2, -0.15, -0.25]; Q.rot[B.farmL] = [2.25, 0, 0]; Q.rot[B.handL] = [0.45, 0, 0]; }
    } else if (h === 'rifle') {
      armToward(Q, 'R', [0.25, -0.75, -0.45], 1.3);
      armToward(Q, 'L', [-0.35, -0.3, -0.85], 1.5);
    }
  }

  function coverLayer(P, s) {
    const C = s.cover;
    const kind = C.tall ? 'tall' : 'low';
    const Q = blank();
    let w = C.k;
    if (C.enter >= 0) {
      const c = clip('cover_in_' + kind);
      if (c) playClip(Q, c, c.len * (0.25 + 0.75 * C.enter), 1, ALL);
      w *= M.smooth(C.enter / 0.35);
    } else if (C.out >= 0) {
      const c = clip('cover_out_' + kind);
      if (c) playClip(Q, c, c.len * 0.5 * C.out, 1, ALL);
      w *= 1 - M.smooth((C.out - 0.35) / 0.65);
    } else {
      const idle = clip('cover_idle_' + kind);
      if (idle) playClip(Q, idle, (s.t || 0) + (s.seed || 0) * 0.9, 1, ALL);
      const sl = C.slide || 0;
      const sneak = clip((sl > 0 ? 'cover_right_' : 'cover_left_') + kind);
      const ws = M.clamp(Math.abs(sl) / 0.9, 0, 1);
      if (sneak && sneak.dist > 0 && ws > 0) {
        const d = sl > 0 ? C.dist : -C.dist;
        playClip(Q, sneak, ((d % sneak.dist) + sneak.dist) % sneak.dist / sneak.dist * sneak.len, ws, ALL);
      }
    }
    if (!clip('cover_idle_' + kind)) {
      if (C.tall) Q.rot[B.spine][0] = 0.05;
      else crouchLegs(Q, 0, 0);
      Q.rot[B.pelvis][1] += PI;
    }
    coverArms(Q, s);
    Q.rot[B.head][1] -= (C.edge || 0) * (C.tall ? 0.55 : 0.35);
    toFrame(Q, C.wall || 0);
    mix(P, Q, w);
  }

  function blank() {
    const rot = [];
    for (let i = 0; i < N; i++) rot.push([0, 0, 0]);
    return { rot, root: [0, 0, 0], rootM: null };
  }

  function aimArm(v) {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    const vx = v[0] / l, vy = v[1] / l, vz = v[2] / l;
    const ax = Math.acos(M.clamp(-vy, -1, 1));
    const s = Math.sin(ax);
    const ay = s > 1e-4 ? Math.atan2(-vx, -vz) : 0;
    return [ax, ay, 0];
  }

  function basis(U, F) {
    const Bk = [-F[0], -F[1], -F[2]];
    const X = M.norm(M.cross(U, Bk));
    const Bn = M.cross(X, U);
    return new Float32Array([X[0], X[1], X[2], 0, U[0], U[1], U[2], 0, Bn[0], Bn[1], Bn[2], 0, 0, 0, 0, 1]);
  }

  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3); }

  function legs(P, ph, fwd, side, amp, crouch) {
    const s = Math.sin(ph), c = Math.cos(ph);
    const A = 0.62 * amp;
    P.rot[B.thighL][0] = s * A * fwd - (crouch ? 0 : 0);
    P.rot[B.thighR][0] = -s * A * fwd;
    P.rot[B.thighL][2] = s * 0.32 * amp * side;
    P.rot[B.thighR][2] = -s * 0.32 * amp * side;
    const kneeL = Math.max(0, -Math.cos(ph - 0.6)) * 1.25 * amp + 0.08 * amp;
    const kneeR = Math.max(0, Math.cos(ph - 0.6)) * 1.25 * amp + 0.08 * amp;
    P.rot[B.shinL][0] = -kneeL * Math.max(0.35, Math.abs(fwd) + Math.abs(side) * 0.6);
    P.rot[B.shinR][0] = -kneeR * Math.max(0.35, Math.abs(fwd) + Math.abs(side) * 0.6);
    P.rot[B.footL][0] = kneeL * 0.35;
    P.rot[B.footR][0] = kneeR * 0.35;
    P.root[1] -= Math.abs(c) * 0.045 * amp;
    P.rot[B.pelvis][1] = s * 0.14 * amp * fwd;
    P.rot[B.chest][1] = -s * 0.16 * amp * fwd;
  }

  function crouchLegs(P, ph, amp) {
    P.root[1] -= 0.42;
    P.rot[B.pelvis][0] = -0.15;
    P.rot[B.thighL][0] = 1.35 + Math.sin(ph) * 0.25 * amp;
    P.rot[B.thighR][0] = 1.05 - Math.sin(ph) * 0.25 * amp;
    P.rot[B.shinL][0] = -2.0;
    P.rot[B.shinR][0] = -1.55;
    P.rot[B.footL][0] = 0.6;
    P.rot[B.footR][0] = 0.3;
    P.rot[B.thighR][2] = 0.12;
    P.rot[B.spine][0] = -0.12;
  }

  function relaxedArms(P, ph, amp, fwd) {
    const s = Math.sin(ph);
    P.rot[B.uarmL][0] = -s * 0.55 * amp * fwd + 0.05;
    P.rot[B.uarmR][0] = s * 0.55 * amp * fwd + 0.05;
    P.rot[B.uarmL][2] = -0.08;
    P.rot[B.uarmR][2] = 0.08;
    P.rot[B.farmL][0] = 0.25 + 0.4 * amp;
    P.rot[B.farmR][0] = 0.25 + 0.4 * amp;
  }

  function armToward(P, side, v, bend) {
    const r = aimArm(v);
    const u = side === 'L' ? B.uarmL : B.uarmR, f = side === 'L' ? B.farmL : B.farmR, h = side === 'L' ? B.handL : B.handR;
    P.rot[u][0] = r[0] - (bend || 0) * 0.5;
    P.rot[u][1] = r[1];
    P.rot[u][2] = 0;
    P.rot[f][0] = bend || 0.04;
    P.rot[f][1] = 0;
    P.rot[h][0] = -(bend || 0) * 0.5;
  }

  function aimLayer(P, s, chestPitch) {
    const pitch = s.pitch || 0;
    const cp = chestPitch !== undefined ? chestPitch : pitch * 0.35;
    P.rot[B.spine][0] += cp * 0.5;
    P.rot[B.chest][0] += cp * 0.5;
    const ap = pitch - cp;
    const dir = [0, Math.sin(ap), -Math.cos(ap)];
    const kick = s.fireT >= 0 && s.fireT < 0.13 ? (1 - s.fireT / 0.13) : 0;
    const hold = s.hold || 'none';
    if (hold === 'pistol') {
      armToward(P, 'R', [dir[0] - 0.12, dir[1] + kick * 0.25, dir[2]], 0.05);
      if (s.twoHand) armToward(P, 'L', [0.35, dir[1] - 0.05, dir[2]], 0.5);
      else { P.rot[B.uarmL][0] = 0.1; P.rot[B.uarmL][2] = -0.12; P.rot[B.farmL][0] = 0.35; }
      P.rot[B.chest][1] += 0.12;
    } else if (hold === 'dual') {
      const kl = s.side === 1 ? kick : 0, kr = s.side === 1 ? 0 : kick;
      armToward(P, 'R', [dir[0] + 0.1, dir[1] + kr * 0.25, dir[2]], 0.05);
      armToward(P, 'L', [dir[0] - 0.1, dir[1] + kl * 0.25, dir[2]], 0.05);
    } else if (hold === 'rifle') {
      armToward(P, 'R', [0.1, dir[1] - 0.35 + kick * 0.2, -0.55], 1.1);
      armToward(P, 'L', [0.55, dir[1] + 0.05 + kick * 0.2, dir[2] * 0.9], 0.35);
      P.rot[B.chest][1] += 0.3;
      P.rot[B.head][1] -= 0.25;
    } else if (hold === 'melee') {
      const sw = s.swingT >= 0 && s.swingT < 0.45 ? s.swingT / 0.45 : 1;
      if (sw < 1) {
        const a = sw < 0.3 ? sw / 0.3 : 1 - (sw - 0.3) / 0.7;
        armToward(P, 'R', [0.6 - a * 1.2, 0.6 - a * 0.5, -0.4 - a * 0.6], 0.3);
        armToward(P, 'L', [0.4 - a * 1.0, 0.4 - a * 0.5, -0.4 - a * 0.5], 0.3);
        P.rot[B.chest][1] += 0.6 - a * 1.3;
      } else {
        P.rot[B.uarmR][0] = 0.35; P.rot[B.farmR][0] = 0.9; P.rot[B.uarmR][2] = 0.1;
        P.rot[B.uarmL][0] = 0.1; P.rot[B.farmL][0] = 0.4;
      }
    } else if (hold === 'throw') {
      const tt = s.throwT >= 0 && s.throwT < 0.6 ? s.throwT / 0.6 : 1;
      if (tt < 1) {
        const a = tt < 0.45 ? tt / 0.45 : 1 - (tt - 0.45) / 0.55;
        armToward(P, 'R', [0.3, 0.5 + a * 0.6, 0.6 - a * 1.8], 0.4 + a * 0.3);
        P.rot[B.chest][1] += 0.4 * a;
      } else armToward(P, 'R', [0.25, -0.5, -0.6], 0.6);
      P.rot[B.uarmL][0] = 0.4; P.rot[B.farmL][0] = 0.3;
    }
    if (s.reloadT >= 0 && s.reloadT < 0.6 && hold !== 'melee' && hold !== 'throw') {
      const a = Math.sin(s.reloadT / 0.6 * PI);
      armToward(P, 'L', [0.3, -0.6 + a * 0.3, -0.5], 1.2);
      P.rot[B.uarmR][0] -= a * 0.5;
    }
    P.rot[B.head][0] += pitch * 0.35 - cp * 0.5;
  }

  function deathPose(P, s) {
    const d = s.death;
    const dc = clip(DEATH_CLIP[d.kind]);
    if (dc) { playClip(P, dc, d.t, 1, ALL); return; }
    const t = d.t;
    const k = ease(t / (d.kind === 'drop' ? 0.9 : d.kind === 'flyback' || d.kind === 'blown' ? 0.55 : 0.7));
    const R = M.GL.mat4;
    let rootRot;
    if (d.kind === 'front') rootRot = R.rotXm(-PI / 2 * k);
    else if (d.kind === 'drop') {
      const k1 = ease(t / 0.35), k2 = ease((t - 0.3) / 0.6);
      P.root[1] -= 0.4 * k1;
      P.rot[B.thighL][0] = 1.2 * k1 * (1 - k2);
      P.rot[B.thighR][0] = 1.0 * k1 * (1 - k2);
      P.rot[B.shinL][0] = -1.9 * k1 * (1 - k2 * 0.7);
      P.rot[B.shinR][0] = -1.6 * k1 * (1 - k2 * 0.6);
      rootRot = R.rotZm(PI / 2 * k2 * (d.side || 1));
    } else if (d.kind === 'spinL' || d.kind === 'spinR') {
      const sg = d.kind === 'spinL' ? 1 : -1;
      rootRot = R.mul(R.rotY(sg * PI * 0.6 * ease(t / 0.4)), R.rotXm(PI / 2 * k));
    } else if (d.kind === 'blown') rootRot = R.mul(R.rotXm(PI / 2 * k), R.rotY(k * 1.2));
    else rootRot = R.rotXm(PI / 2 * k);
    P.rootM = rootRot;
    P.root[1] -= 0.8 * k;
    const flail = Math.sin(t * 14) * (1 - k) * 0.6;
    P.rot[B.uarmL][0] = 0.4 + flail + k * 1.6; P.rot[B.uarmL][2] = -0.3 - k * 0.6;
    P.rot[B.uarmR][0] = 0.4 - flail + k * 1.2; P.rot[B.uarmR][2] = 0.3 + k * 0.7;
    P.rot[B.farmL][0] = 0.6 * (1 - k) + 0.3;
    P.rot[B.farmR][0] = 0.5 * (1 - k) + 0.5;
    if (d.kind !== 'drop') {
      P.rot[B.thighL][0] = 0.5 * Math.sin(k * PI) + 0.1;
      P.rot[B.thighR][0] = 0.8 * Math.sin(k * PI) - 0.05;
      P.rot[B.shinL][0] = -0.9 * Math.sin(k * PI) - 0.1;
      P.rot[B.shinR][0] = -1.2 * Math.sin(k * PI) - 0.25;
      P.rot[B.thighL][2] = -0.15 * k; P.rot[B.thighR][2] = 0.2 * k;
    }
    P.rot[B.head][1] = 0.5 * k * (d.kind === 'spinR' ? -1 : 1);
    P.rot[B.head][0] = d.kind === 'front' ? 0.3 * k : -0.25 * k;
  }

  function special(P, s, name) {
    switch (name) {
      case 'hands':
        P.rot[B.uarmL][0] = 2.6; P.rot[B.uarmR][0] = 2.6; P.rot[B.uarmL][2] = -0.5; P.rot[B.uarmR][2] = 0.5;
        P.rot[B.farmL][0] = 1.3; P.rot[B.farmR][0] = 1.3;
        break;
      case 'sit':
        P.root[1] -= 0.46;
        P.rot[B.thighL][0] = PI / 2; P.rot[B.thighR][0] = PI / 2;
        P.rot[B.shinL][0] = -PI / 2; P.rot[B.shinR][0] = -PI / 2;
        P.rot[B.uarmL][0] = 0.5; P.rot[B.uarmR][0] = 0.5; P.rot[B.farmL][0] = 0.8; P.rot[B.farmR][0] = 0.8;
        break;
      case 'kneel':
        P.root[1] -= 0.46;
        P.rot[B.thighL][0] = PI / 2; P.rot[B.shinL][0] = -PI / 2;
        P.rot[B.thighR][0] = -0.05; P.rot[B.shinR][0] = -PI / 2; P.rot[B.footR][0] = 0.4;
        P.rot[B.spine][0] = -0.2; P.rot[B.head][0] = -0.35;
        P.rot[B.uarmL][0] = 0.6; P.rot[B.farmL][0] = 0.6; P.rot[B.uarmR][0] = 0.5; P.rot[B.farmR][0] = 0.7;
        break;
      case 'cradle':
        special(P, s, 'kneel');
        P.rot[B.uarmL][0] = 1.1; P.rot[B.uarmR][0] = 1.1; P.rot[B.uarmL][1] = -0.4; P.rot[B.uarmR][1] = 0.4; P.rot[B.farmL][0] = 1.4; P.rot[B.farmR][0] = 1.4;
        P.rot[B.head][0] = -0.6;
        break;
      case 'phone':
        P.rot[B.uarmR][0] = 0.4; P.rot[B.uarmR][2] = 0.5; P.rot[B.farmR][0] = 2.5; P.rot[B.handR][0] = 0.3;
        P.rot[B.uarmL][0] = 0.1; P.rot[B.farmL][0] = 0.3;
        P.rot[B.head][2] = 0.12;
        break;
      case 'cower':
        crouchLegs(P, 0, 0);
        P.rot[B.uarmL][0] = 2.2; P.rot[B.uarmR][0] = 2.2; P.rot[B.farmL][0] = 1.9; P.rot[B.farmR][0] = 1.9;
        P.rot[B.uarmL][2] = 0.4; P.rot[B.uarmR][2] = -0.4;
        P.rot[B.spine][0] = -0.5; P.rot[B.head][0] = -0.5;
        break;
      case 'lie':
        P.rootM = M.GL.mat4.rotXm(PI / 2);
        P.root[1] -= 0.78 - (s.lieH || 0);
        P.rot[B.uarmL][2] = -0.25; P.rot[B.uarmR][2] = 0.2; P.rot[B.farmL][0] = 0.3; P.rot[B.farmR][0] = 0.6;
        P.rot[B.head][1] = 0.5;
        P.rot[B.thighR][0] = 0.25; P.rot[B.shinR][0] = -0.5;
        break;
      case 'slump':
        P.root[1] -= 0.62;
        P.rootM = M.GL.mat4.rotXm(0.35);
        P.rot[B.thighL][0] = 1.35; P.rot[B.thighR][0] = 1.2; P.rot[B.shinL][0] = -0.3; P.rot[B.shinR][0] = -0.6;
        P.rot[B.uarmL][2] = -0.3; P.rot[B.uarmR][2] = 0.4;
        P.rot[B.head][0] = -0.7; P.rot[B.head][2] = 0.3;
        break;
      case 'point':
        armToward(P, 'R', [0.2, 0.1, -1], 0);
        break;
      case 'hostage':
        armToward(P, 'L', [0.6, 0.05, -0.8], 1.5);
        armToward(P, 'R', [-0.25, 0.35, -0.9], 0.3);
        break;
      case 'burn':
        P.rot[B.uarmL][0] = 2 + Math.sin(s.t * 13) * 0.8; P.rot[B.uarmR][0] = 2 + Math.cos(s.t * 11) * 0.8;
        P.rot[B.farmL][0] = 1.2; P.rot[B.farmR][0] = 1.2;
        break;
      case 'dance':
        P.rot[B.uarmL][0] = 1 + Math.sin(s.t * 6) * 1.2; P.rot[B.uarmR][0] = 1 + Math.sin(s.t * 6 + 2) * 1.2;
        P.root[1] -= Math.abs(Math.sin(s.t * 6)) * 0.08;
        P.rot[B.chest][1] = Math.sin(s.t * 3) * 0.4;
        P.rot[B.head][0] = Math.sin(s.t * 12) * 0.3;
        break;
      case 'count':
        special(P, s, 'sit');
        P.rot[B.uarmL][0] = 1.0; P.rot[B.uarmR][0] = 1.0 + Math.sin(s.t * 4) * 0.2; P.rot[B.farmL][0] = 1.0; P.rot[B.farmR][0] = 1.1;
        P.rot[B.head][0] = -0.4;
        break;
      case 'tv':
        special(P, s, 'sit');
        P.rot[B.uarmL][0] = 0.6; P.rot[B.farmL][0] = 1.3;
        break;
      case 'fridge':
        P.rot[B.spine][0] = -0.6; P.rot[B.chest][0] = -0.3;
        armToward(P, 'R', [0.1, -0.2, -1], 0.3);
        armToward(P, 'L', [-0.2, 0.2, -1], 0.2);
        break;
      case 'drunk':
        P.rot[B.spine][2] = Math.sin(s.t * 1.3) * 0.12;
        P.rot[B.head][0] = -0.3;
        break;
      case 'sing':
        P.rot[B.head][0] = 0.3 + Math.sin(s.t * 3) * 0.1;
        P.rot[B.uarmR][0] = 1.2; P.rot[B.farmR][0] = 1.3;
        break;
      case 'chant':
        P.rot[B.uarmL][0] = 2.4; P.rot[B.uarmR][0] = 2.4; P.rot[B.uarmL][2] = -0.7; P.rot[B.uarmR][2] = 0.7;
        P.rot[B.head][0] = 0.5 + Math.sin(s.t * 2) * 0.1;
        P.rot[B.chest][0] = 0.15;
        break;
    }
  }

  function divePose(P, s) {
    const R = M.GL.mat4;
    const d = s.dive;
    const U = [d.dir[0], d.phase === 'air' ? 0.12 : 0, d.dir[2]];
    const Un = M.norm(U);
    const a = s.aimDir;
    const dot = M.dot(a, Un);
    let F = M.sub(a, M.scale(Un, dot));
    if (M.len(F) < 0.25) F = dot > 0 ? [0, -1, 0] : [0, 1, 0];
    F = M.norm(F);
    const bodyYawInv = R.rotY(-s.yaw);
    const Ul = R.xformDir(bodyYawInv, Un), Fl = R.xformDir(bodyYawInv, F);
    P.rootM = basis(Ul, Fl);
    P.root[1] -= d.phase === 'air' ? 0.35 : 0.7;
    const inv = P.rootM;
    const al = R.xformDir(bodyYawInv, a);
    const loc = [inv[0] * al[0] + inv[1] * al[1] + inv[2] * al[2], inv[4] * al[0] + inv[5] * al[1] + inv[6] * al[2], inv[8] * al[0] + inv[9] * al[1] + inv[10] * al[2]];
    const hold = s.hold;
    const kick = s.fireT >= 0 && s.fireT < 0.13 ? (1 - s.fireT / 0.13) * 0.2 : 0;
    if (hold === 'dual') {
      armToward(P, 'R', [loc[0] + 0.08, loc[1] + kick, loc[2]], 0.05);
      armToward(P, 'L', [loc[0] - 0.08, loc[1] + kick, loc[2]], 0.05);
    } else if (hold === 'rifle') {
      armToward(P, 'R', [loc[0] + 0.05, loc[1] - 0.2, loc[2]], 0.9);
      armToward(P, 'L', [loc[0] - 0.2, loc[1], loc[2]], 0.3);
    } else if (hold !== 'none') {
      armToward(P, 'R', [loc[0], loc[1] + kick, loc[2]], 0.05);
      P.rot[B.uarmL][0] = 0.4; P.rot[B.uarmL][2] = -0.5; P.rot[B.farmL][0] = 0.6;
    } else {
      P.rot[B.uarmL][0] = 2.5; P.rot[B.uarmR][0] = 2.5;
    }
    P.rot[B.thighL][0] = 0.2; P.rot[B.thighR][0] = -0.1; P.rot[B.shinL][0] = -0.5; P.rot[B.shinR][0] = -0.25;
    if (d.phase !== 'air') { P.rot[B.shinL][0] = -0.2; P.rot[B.shinR][0] = -0.1; }
    const hl = [loc[0], loc[1], loc[2]];
    P.rot[B.head][0] = M.clamp(Math.atan2(hl[1], -hl[2]) * 0.5, -0.8, 0.8);
  }

  function pose(s) {
    const P = blank();
    if (s.death) { deathPose(P, s); return P; }
    if (s.special && s.special !== 'hostage' && s.special !== 'point' && s.special !== 'phone' && s.special !== 'sing' && s.special !== 'fridge' && s.special !== 'drunk') { special(P, s, s.special); return P; }
    if (s.dive) { divePose(P, s); return P; }
    const sp = s.speed || 0;
    const amp = M.clamp(sp / 4.5, 0, 1.15);
    const len = Math.hypot(s.move ? s.move[0] : 0, s.move ? s.move[1] : 0) || 1;
    const fwd = s.move ? s.move[1] / len : 0, side = s.move ? s.move[0] / len : 0;
    const ph = s.phase || 0;
    if (s.crouch) crouchLegs(P, ph, amp);
    else if (s.air) {
      P.rot[B.thighL][0] = 0.7; P.rot[B.thighR][0] = -0.15; P.rot[B.shinL][0] = -1.1; P.rot[B.shinR][0] = -0.5;
    } else if (amp > 0.03) {
      legs(P, ph, fwd, side, amp, false);
      P.rot[B.spine][0] -= 0.12 * amp * Math.max(0, fwd);
    } else {
      const br = Math.sin((s.t || 0) * 1.7) * 0.015;
      P.rot[B.chest][0] += br;
      P.rot[B.thighR][2] = 0.06; P.rot[B.thighL][2] = -0.04;
      P.rot[B.thighR][0] = 0.06; P.rot[B.shinR][0] = -0.1;
    }
    const armed = s.hold && s.hold !== 'none' && s.aim !== false;
    if (armed) aimLayer(P, s);
    else relaxedArms(P, ph, amp, fwd);
    const bones = armed ? LOWER : ALL;
    if (!s.crouch && !s.air) {
      const hip = P.rot[B.pelvis].slice();
      mocapLayer(P, s, amp, fwd, ph, bones, armed);
      stepLayer(P, s, amp, bones);
      if (armed) for (let j = 0; j < 3; j++) P.rot[B.spine][j] -= turn(hip[j], P.rot[B.pelvis][j]);
      else if (s.feet) { P.rot[B.spine][1] -= s.feet * 0.5; P.rot[B.chest][1] -= s.feet * 0.3; P.rot[B.head][1] -= s.feet * 0.2; }
      landLayer(P, s);
    } else if (s.air) airLayer(P, s, bones);
    if (s.cover) coverLayer(P, s);
    if (s.special) special(P, s, s.special);
    if (s.flinchT >= 0 && s.flinchT < 0.3) {
      const k = 1 - s.flinchT / 0.3;
      P.rot[B.chest][0] += 0.3 * k;
      P.rot[B.head][0] += 0.35 * k;
      P.rot[B.spine][2] += 0.12 * k;
    }
    if (s.burn) special(P, s, 'burn');
    return P;
  }

  M.Anim = { BONES, B, N, pose, blank, aimArm, basis, clip, mix, toFrame };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
