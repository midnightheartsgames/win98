(function (Q) {
  'use strict';
  const PMF_DUCKED = 1, PMF_JUMP_HELD = 2, PMF_TIME_LAND = 32, PMF_TIME_KNOCKBACK = 64;
  Q.PMF = { DUCKED: PMF_DUCKED, JUMP_HELD: PMF_JUMP_HELD, TIME_LAND: PMF_TIME_LAND, TIME_KNOCKBACK: PMF_TIME_KNOCKBACK };
  const ACCEL = 10, AIRACCEL = 1, WATERACCEL = 4, FRICTION = 6, WATERFRICTION = 1, STOPSPEED = 100, DUCKSCALE = 0.25, SWIMSCALE = 0.5;
  const MAX_CLIP_PLANES = 5;

  function clipVelocity(v, n, overbounce) {
    let backoff = v[0] * n[0] + v[1] * n[1] + v[2] * n[2];
    backoff = backoff < 0 ? backoff * overbounce : backoff / overbounce;
    return [v[0] - n[0] * backoff, v[1] - n[1] * backoff, v[2] - n[2] * backoff];
  }
  Q.clipVelocity = clipVelocity;

  function cmdScale(cmd, speed) {
    let max = Math.abs(cmd.forward);
    if (Math.abs(cmd.right) > max) max = Math.abs(cmd.right);
    if (Math.abs(cmd.up) > max) max = Math.abs(cmd.up);
    if (!max) return 0;
    const total = Math.sqrt(cmd.forward * cmd.forward + cmd.right * cmd.right + cmd.up * cmd.up);
    return speed * max / (127 * total);
  }

  function accelerate(m, wishdir, wishspeed, accel) {
    const v = m.ps.velocity;
    const cur = v[0] * wishdir[0] + v[1] * wishdir[1] + v[2] * wishdir[2];
    const add = wishspeed - cur;
    if (add <= 0) return;
    let acc = accel * m.dt * wishspeed;
    if (acc > add) acc = add;
    v[0] += acc * wishdir[0]; v[1] += acc * wishdir[1]; v[2] += acc * wishdir[2];
  }

  function friction(m) {
    const ps = m.ps, v = ps.velocity;
    const vec = [v[0], v[1], v[2]];
    if (m.walking) vec[2] = 0;
    const speed = Q.vlen(vec);
    if (speed < 1) { v[0] = 0; v[1] = 0; return; }
    let drop = 0;
    if (ps.waterLevel <= 1 && m.walking && !(ps.pmFlags & PMF_TIME_KNOCKBACK)) {
      const control = speed < STOPSPEED ? STOPSPEED : speed;
      drop += control * FRICTION * m.dt;
    }
    if (ps.waterLevel) drop += speed * WATERFRICTION * ps.waterLevel * m.dt;
    let ns = speed - drop;
    if (ns < 0) ns = 0;
    ns /= speed;
    v[0] *= ns; v[1] *= ns; v[2] *= ns;
  }

  function slideMove(m, gravity) {
    const ps = m.ps;
    let v = ps.velocity.slice();
    let endVelocity = null;
    const primal = v.slice();
    if (gravity) {
      endVelocity = v.slice();
      endVelocity[2] -= Q.GRAVITY * m.dt;
      v[2] = (v[2] + endVelocity[2]) * 0.5;
      primal[2] = endVelocity[2];
      if (m.groundPlane) v = clipVelocity(v, m.gt.normal, Q.OVERCLIP);
    }
    let timeLeft = m.dt;
    const planes = [];
    if (m.groundPlane) planes.push(m.gt.normal);
    planes.push(Q.vnorm(v));
    let bump = 0;
    for (bump = 0; bump < 4; bump++) {
      const end = Q.vma(ps.origin, timeLeft, v);
      const t = m.trace(ps.origin, end, m.mins, m.maxs);
      if (t.allSolid) { v[2] = 0; ps.velocity = v; return true; }
      if (t.fraction > 0) ps.origin = t.endpos;
      if (t.fraction === 1) break;
      m.touch(t);
      timeLeft -= timeLeft * t.fraction;
      if (planes.length >= MAX_CLIP_PLANES) { ps.velocity = [0, 0, 0]; return true; }
      let dup = false;
      for (const p of planes) {
        if (Q.vdot(t.normal, p) > 0.99) { v = Q.vadd(t.normal, v); dup = true; break; }
      }
      if (dup) continue;
      planes.push(t.normal);
      for (let i = 0; i < planes.length; i++) {
        const into = Q.vdot(v, planes[i]);
        if (into >= 0.1) continue;
        let clipV = clipVelocity(v, planes[i], Q.OVERCLIP);
        let endClip = endVelocity ? clipVelocity(endVelocity, planes[i], Q.OVERCLIP) : null;
        let stopped = false;
        for (let j = 0; j < planes.length; j++) {
          if (j === i) continue;
          if (Q.vdot(clipV, planes[j]) >= 0.1) continue;
          clipV = clipVelocity(clipV, planes[j], Q.OVERCLIP);
          if (endClip) endClip = clipVelocity(endClip, planes[j], Q.OVERCLIP);
          if (Q.vdot(clipV, planes[i]) >= 0) continue;
          const dir = Q.vnorm(Q.vcross(planes[i], planes[j]));
          clipV = Q.vscale(dir, Q.vdot(dir, v));
          if (endClip) endClip = Q.vscale(dir, Q.vdot(dir, endVelocity));
          for (let k = 0; k < planes.length; k++) {
            if (k === i || k === j) continue;
            if (Q.vdot(clipV, planes[k]) >= 0.1) continue;
            ps.velocity = [0, 0, 0];
            stopped = true;
            break;
          }
          if (stopped) return true;
        }
        v = clipV;
        if (endClip) endVelocity = endClip;
        break;
      }
    }
    if (gravity) v = endVelocity;
    if (ps.pmTime > 0 && (ps.pmFlags & PMF_TIME_KNOCKBACK)) v = primal;
    ps.velocity = v;
    return bump !== 0;
  }

  function stepSlideMove(m, gravity) {
    const ps = m.ps;
    const startO = ps.origin.slice(), startV = ps.velocity.slice();
    if (!slideMove(m, gravity)) return;
    const down = [startO[0], startO[1], startO[2] - Q.STEPSIZE];
    let t = m.trace(startO, down, m.mins, m.maxs);
    if (ps.velocity[2] > 0 && (t.fraction === 1 || t.normal[2] < 0.7)) return;
    const downO = ps.origin.slice(), downV = ps.velocity.slice();
    const up = [startO[0], startO[1], startO[2] + Q.STEPSIZE];
    t = m.trace(startO, up, m.mins, m.maxs);
    if (t.allSolid) return;
    const stepSize = t.endpos[2] - startO[2];
    ps.origin = t.endpos;
    ps.velocity = startV.slice();
    slideMove(m, gravity);
    const d2 = [ps.origin[0], ps.origin[1], ps.origin[2] - stepSize];
    t = m.trace(ps.origin, d2, m.mins, m.maxs);
    if (!t.allSolid) ps.origin = t.endpos;
    if (t.fraction < 1) ps.velocity = clipVelocity(ps.velocity, t.normal, Q.OVERCLIP);
    const moved = Q.vlen2(Q.vsub(ps.origin, startO)), movedDown = Q.vlen2(Q.vsub(downO, startO));
    if (moved + 0.01 < movedDown) { ps.origin = downO; ps.velocity = downV; return; }
    const delta = ps.origin[2] - startO[2];
    if (delta > 2) ps.stepUp = (ps.stepUp || 0) + delta;
  }

  function crashLand(m) {
    const ps = m.ps;
    let delta = m.prevVel[2] * m.prevVel[2] * 0.0001;
    if (ps.pmFlags & PMF_DUCKED) delta *= 2;
    if (ps.waterLevel === 3) return;
    if (ps.waterLevel === 2) delta *= 0.25;
    if (ps.waterLevel === 1) delta *= 0.5;
    if (delta < 1) return;
    if (ps.noFallUntil && ps.time < ps.noFallUntil) delta = Math.min(delta, 7.5);
    if (delta > 60) ps.events.push('fall_far');
    else if (delta > 40) ps.events.push('fall_medium');
    else if (delta > 7) ps.events.push('land');
    else ps.events.push('step');
  }

  function groundTrace(m) {
    const ps = m.ps;
    const point = [ps.origin[0], ps.origin[1], ps.origin[2] - 0.25];
    let t = m.trace(ps.origin, point, m.mins, m.maxs);
    m.gt = t;
    if (t.allSolid) {
      let fixed = false;
      for (let i = -1; i <= 1 && !fixed; i++) {
        for (let j = -1; j <= 1 && !fixed; j++) {
          for (let k = -1; k <= 1 && !fixed; k++) {
            const p = [ps.origin[0] + i, ps.origin[1] + j, ps.origin[2] + k];
            const tt = m.trace(p, p, m.mins, m.maxs);
            if (!tt.allSolid) {
              const pd = [ps.origin[0], ps.origin[1], ps.origin[2] - 0.25];
              t = m.trace(p, pd, m.mins, m.maxs);
              m.gt = t;
              fixed = true;
            }
          }
        }
      }
      if (!fixed) { ps.onGround = false; m.groundPlane = false; m.walking = false; return; }
    }
    if (t.fraction === 1) { ps.onGround = false; m.groundPlane = false; m.walking = false; return; }
    if (ps.velocity[2] > 0 && Q.vdot(ps.velocity, t.normal) > 10) { ps.onGround = false; m.groundPlane = false; m.walking = false; return; }
    if (t.normal[2] < Q.MIN_WALK_NORMAL) { ps.onGround = false; m.groundPlane = true; m.walking = false; return; }
    m.groundPlane = true;
    m.walking = true;
    if (!ps.onGround) {
      crashLand(m);
      if (m.prevVel[2] < -200) { ps.pmFlags |= PMF_TIME_LAND; ps.pmTime = 250; }
    }
    ps.onGround = true;
    ps.groundNormal = t.normal;
    ps.groundMat = t.mat;
  }

  function setWaterLevel(m) {
    const ps = m.ps;
    ps.waterLevel = 0; ps.waterType = 0;
    const o = ps.origin;
    const minsZ = m.mins[2];
    let c = m.pc([o[0], o[1], o[2] + minsZ + 1]);
    if (!(c & Q.MASK_LIQUID)) return;
    const sample2 = ps.viewheight - minsZ, sample1 = sample2 / 2;
    ps.waterType = c;
    ps.waterLevel = 1;
    c = m.pc([o[0], o[1], o[2] + minsZ + sample1]);
    if (c & Q.MASK_LIQUID) {
      ps.waterLevel = 2;
      c = m.pc([o[0], o[1], o[2] + minsZ + sample2]);
      if (c & Q.MASK_LIQUID) ps.waterLevel = 3;
    }
  }

  function checkDuck(m) {
    const ps = m.ps;
    if (ps.dead) { m.maxs = [15, 15, Q.DEAD_MAXZ]; ps.viewheight = Q.DEAD_VIEWHEIGHT; return; }
    if (m.cmd.up < 0) ps.pmFlags |= PMF_DUCKED;
    else if (ps.pmFlags & PMF_DUCKED) {
      const t = m.trace(ps.origin, ps.origin, Q.PLAYER_MINS, Q.PLAYER_MAXS);
      if (!t.allSolid && !t.startSolid) ps.pmFlags &= ~PMF_DUCKED;
    }
    if (ps.pmFlags & PMF_DUCKED) { m.maxs = [15, 15, Q.CROUCH_MAXZ]; ps.viewheight = Q.CROUCH_VIEWHEIGHT; }
    else { m.maxs = [15, 15, 32]; ps.viewheight = Q.VIEWHEIGHT; }
    ps.ducked = !!(ps.pmFlags & PMF_DUCKED);
  }

  function checkJump(m) {
    const ps = m.ps;
    if (m.cmd.up < 10) return false;
    if (ps.pmFlags & PMF_JUMP_HELD) { m.cmd.up = 0; return false; }
    m.groundPlane = false;
    m.walking = false;
    ps.pmFlags |= PMF_JUMP_HELD;
    ps.onGround = false;
    ps.velocity[2] = Q.JUMP_VELOCITY;
    ps.events.push('jump');
    return true;
  }

  function flatBasis(m) {
    const f = Q.vnorm([m.fwd[0], m.fwd[1], 0]), r = Q.vnorm([m.right[0], m.right[1], 0]);
    return { f, r };
  }

  function airMove(m) {
    const ps = m.ps;
    friction(m);
    const scale = cmdScale(m.cmd, ps.speed);
    const { f, r } = flatBasis(m);
    const wv = [f[0] * m.cmd.forward + r[0] * m.cmd.right, f[1] * m.cmd.forward + r[1] * m.cmd.right, 0];
    const ws = Q.vlen(wv);
    const wd = ws > 0 ? Q.vscale(wv, 1 / ws) : [0, 0, 0];
    accelerate(m, wd, ws * scale, AIRACCEL);
    if (m.groundPlane) ps.velocity = clipVelocity(ps.velocity, m.gt.normal, Q.OVERCLIP);
    stepSlideMove(m, true);
  }

  function waterMove(m) {
    const ps = m.ps;
    friction(m);
    const scale = cmdScale(m.cmd, ps.speed);
    let wv;
    if (!scale) wv = [0, 0, -60];
    else {
      wv = [0, 0, 0];
      for (let i = 0; i < 3; i++) wv[i] = scale * m.fwd[i] * m.cmd.forward + scale * m.right[i] * m.cmd.right;
      wv[2] += scale * m.cmd.up;
    }
    let ws = Q.vlen(wv);
    const wd = ws > 0 ? Q.vscale(wv, 1 / ws) : [0, 0, 0];
    if (ws > ps.speed * SWIMSCALE) ws = ps.speed * SWIMSCALE;
    accelerate(m, wd, ws, WATERACCEL);
    if (m.groundPlane && Q.vdot(ps.velocity, m.gt.normal) < 0) {
      const vel = Q.vlen(ps.velocity);
      ps.velocity = Q.vscale(Q.vnorm(clipVelocity(ps.velocity, m.gt.normal, Q.OVERCLIP)), vel);
    }
    slideMove(m, false);
  }

  function walkMove(m) {
    const ps = m.ps;
    if (checkJump(m)) {
      if (ps.waterLevel > 1) waterMove(m); else airMove(m);
      return;
    }
    friction(m);
    const scale = cmdScale(m.cmd, ps.speed);
    const n = m.gt.normal;
    let f = Q.vnorm(clipVelocity([m.fwd[0], m.fwd[1], 0], n, Q.OVERCLIP));
    let r = Q.vnorm(clipVelocity([m.right[0], m.right[1], 0], n, Q.OVERCLIP));
    const wv = [f[0] * m.cmd.forward + r[0] * m.cmd.right, f[1] * m.cmd.forward + r[1] * m.cmd.right, f[2] * m.cmd.forward + r[2] * m.cmd.right];
    let ws = Q.vlen(wv);
    const wd = ws > 0 ? Q.vscale(wv, 1 / ws) : [0, 0, 0];
    ws *= scale;
    if ((ps.pmFlags & PMF_DUCKED) && ws > ps.speed * DUCKSCALE) ws = ps.speed * DUCKSCALE;
    if (ps.waterLevel) {
      const wscale = 1 - (1 - SWIMSCALE) * ps.waterLevel / 3;
      if (ws > ps.speed * wscale) ws = ps.speed * wscale;
    }
    const knock = !!(ps.pmFlags & PMF_TIME_KNOCKBACK);
    accelerate(m, wd, ws, knock ? AIRACCEL : ACCEL);
    if (knock) ps.velocity[2] -= Q.GRAVITY * m.dt;
    const vel = Q.vlen(ps.velocity);
    ps.velocity = clipVelocity(ps.velocity, n, Q.OVERCLIP);
    const nv = Q.vnorm(ps.velocity);
    ps.velocity = Q.vscale(nv, vel);
    if (!ps.velocity[0] && !ps.velocity[1]) return;
    stepSlideMove(m, false);
  }

  function deadMove(m) {
    const ps = m.ps;
    if (!m.walking) return;
    const v = ps.velocity;
    const speed = Q.vlen(v) - 20;
    if (speed <= 0) { ps.velocity = [0, 0, 0]; return; }
    ps.velocity = Q.vscale(Q.vnorm(v), speed);
  }

  Q.pmove = function (ps, cmd, dt, trace, pointContents, touch) {
    const m = {
      ps, dt, trace, pc: pointContents, touch: touch || (() => { }),
      cmd: { forward: cmd.forward | 0, right: cmd.right | 0, up: cmd.up | 0 },
      mins: Q.PLAYER_MINS, maxs: [15, 15, 32], walking: false, groundPlane: false, gt: null,
      prevVel: ps.velocity.slice(), prevOrigin: ps.origin.slice()
    };
    ps.events = ps.events || [];
    if (ps.dead) { m.cmd.forward = 0; m.cmd.right = 0; m.cmd.up = 0; }
    if (m.cmd.up < 10) ps.pmFlags &= ~PMF_JUMP_HELD;
    const av = Q.angleVectors(ps.yaw, ps.pitch);
    m.fwd = av.fwd; m.right = av.right; m.up = av.up;
    checkDuck(m);
    groundTrace(m);
    if (ps.dead) deadMove(m);
    if (ps.pmTime > 0) {
      ps.pmTime -= dt * 1000;
      if (ps.pmTime <= 0) { ps.pmTime = 0; ps.pmFlags &= ~(PMF_TIME_KNOCKBACK | PMF_TIME_LAND); }
    }
    setWaterLevel(m);
    if (ps.waterLevel > 1) waterMove(m);
    else if (m.walking) walkMove(m);
    else airMove(m);
    groundTrace(m);
    setWaterLevel(m);
    ps.mins = m.mins;
    ps.maxs = m.maxs;
    return m;
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
