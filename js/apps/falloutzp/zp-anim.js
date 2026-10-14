(function (Z) {
  'use strict';

  const M4 = Z.M4;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm = a => { const L = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / L, a[1] / L, a[2] / L]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  Z.Pose.prototype.setBoneWorld = function (name, pos, yAxis, zHint) {
    const i = this.def.index[name], b = this.def.bones[i], o = i * 16, W = this.world, S = this.skin;
    const Y = norm(yAxis);
    let Zv = sub(zHint, Y.map(v => v * dot(zHint, Y)));
    if (Math.hypot(...Zv) < 1e-4) Zv = Math.abs(Y[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    Zv = norm(Zv);
    const X = cross(Y, Zv);
    const sc = this.rootScale || 1;
    W[o] = X[0] * sc; W[o + 1] = X[1] * sc; W[o + 2] = X[2] * sc; W[o + 3] = 0;
    W[o + 4] = Y[0] * sc; W[o + 5] = Y[1] * sc; W[o + 6] = Y[2] * sc; W[o + 7] = 0;
    W[o + 8] = Zv[0] * sc; W[o + 9] = Zv[1] * sc; W[o + 10] = Zv[2] * sc; W[o + 11] = 0;
    W[o + 12] = pos[0]; W[o + 13] = pos[1]; W[o + 14] = pos[2]; W[o + 15] = 1;
    for (let k = 0; k < 12; k++) S[o + k] = W[o + k];
    S[o + 12] = W[o + 12] - (W[o] * b.pos[0] + W[o + 4] * b.pos[1] + W[o + 8] * b.pos[2]);
    S[o + 13] = W[o + 13] - (W[o + 1] * b.pos[0] + W[o + 5] * b.pos[1] + W[o + 9] * b.pos[2]);
    S[o + 14] = W[o + 14] - (W[o + 2] * b.pos[0] + W[o + 6] * b.pos[1] + W[o + 10] * b.pos[2]);
    S[o + 15] = 1;
  };

  Z.holdKind = wd => {
    if (!wd) return 'unarmed';
    if (wd.wtype === 'unarmed') return 'unarmed';
    if (wd.wtype === 'melee') return 'melee';
    if (wd.thrown || wd.mine) return 'throw';
    if (wd.twoHand) return 'rifle';
    return 'pistol';
  };

  const mixRot = (P, name, rx, ry, rz, k) => {
    const i = P.def.index[name];
    if (i === undefined || k <= 0) return;
    P.rot[i * 3] = Z.lerp(P.rot[i * 3], rx, k); P.rot[i * 3 + 1] = Z.lerp(P.rot[i * 3 + 1], ry, k); P.rot[i * 3 + 2] = Z.lerp(P.rot[i * 3 + 2], rz, k);
  };

  Z.Anim = {
    human(pose, a, t, ctx = {}) {
      const P = pose;
      P.reset();
      const an = a.anim, sp = ctx.speed || 0;
      const scale = ctx.scale || 1;
      if (a.dead || an.state === 'dead') { ctx.gunM = null; ctx.extras = []; return this.dead(P, a, ctx); }
      const run = sp > 3, sneak = a.sneak;
      const gait = Z.clamp(sp / 4.4, 0, 1);
      const ph = an.phase;
      const step = Math.max(Math.min(1, sp / 1.2), ctx.turnStep || 0);
      const legAmp = (run ? 0.75 : 0.5) * step * (sp > 0.15 ? 1 : 0.55);
      const s = Math.sin(ph), c = Math.cos(ph);
      const strafe = ctx.strafe || 0;
      const armed = (ctx.wk || 0) > 0 && ctx.wid;
      if (sp > 0.15 || (ctx.turnStep || 0) > 0.05) {
        P.set('lthigh', s * legAmp - (sneak ? 0.5 : 0), 0, 0);
        P.set('rthigh', -s * legAmp - (sneak ? 0.5 : 0), 0, 0);
        P.set('lshin', -Math.max(0, -Math.sin(ph + 0.9)) * legAmp * 1.5 - (sneak ? 0.8 : 0), 0, 0);
        P.set('rshin', -Math.max(0, Math.sin(ph + 0.9)) * legAmp * 1.5 - (sneak ? 0.8 : 0), 0, 0);
        P.set('lfoot', Math.max(0, s) * 0.3 * legAmp + (sneak ? 0.3 : 0), 0, 0);
        P.set('rfoot', Math.max(0, -s) * 0.3 * legAmp + (sneak ? 0.3 : 0), 0, 0);
        P.move('hips', 0, -Math.abs(c) * 0.035 * gait - (sneak ? 0.22 : 0), 0);
        P.set('hips', (run ? -0.12 : -0.03) * (ctx.back ? -0.5 : 1) - (sneak ? 0.25 : 0), s * 0.12 * gait + strafe, 0);
        P.set('spine', sneak ? 0.15 : 0, -s * 0.1 * gait - strafe * 0.55, 0);
        P.set('chest', sneak ? 0.12 : 0, -s * 0.06 * gait - strafe * 0.45, 0);
        P.set('luarm', -s * 0.5 * gait, 0, -0.08);
        P.set('ruarm', s * 0.5 * gait, 0, 0.08);
        P.set('lfarm', 0.3 + gait * 0.6, 0, 0);
        P.set('rfarm', 0.3 + gait * 0.6, 0, 0);
      } else {
        const br = Math.sin(t * 1.6 + (a.seed || 0)) * 0.02;
        P.set('chest', br, 0, 0);
        P.set('luarm', 0.02, 0, -0.07 - br);
        P.set('ruarm', 0.02, 0, 0.07 + br);
        P.set('lfarm', 0.12, 0, 0);
        P.set('rfarm', 0.12, 0, 0);
        P.set('head', Math.sin(t * 0.3 + (a.seed || 0)) * 0.05, Math.sin(t * 0.23 + (a.seed || 0) * 2) * 0.25 * (ctx.lookAround === false || armed ? 0 : 1), 0);
        if (sneak) {
          P.move('hips', 0, -0.3, 0);
          P.set('hips', -0.25, 0, 0); P.set('spine', 0.2, 0, 0); P.set('chest', 0.12, 0, 0);
          P.set('lthigh', -1.2, 0, -0.05); P.set('rthigh', -0.6, 0, 0.05);
          P.set('lshin', -1.5, 0, 0); P.set('rshin', -1.3, 0, 0);
          P.set('lfoot', 0.4, 0, 0); P.set('rfoot', 0.6, 0, 0);
        }
        if (ctx.sit) {
          P.move('hips', 0, -0.45, 0.1);
          P.set('lthigh', -1.5, 0, -0.05); P.set('rthigh', -1.5, 0, 0.05);
          P.set('lshin', 1.5, 0, 0); P.set('rshin', 1.5, 0, 0);
        }
      }
      const air = ctx.air || 0;
      if (air > 0) {
        const up = ctx.rising || 0;
        mixRot(P, 'lthigh', -0.85 + up * 0.3, 0, -0.06, air); mixRot(P, 'rthigh', -0.3 + up * 0.2, 0, 0.06, air);
        mixRot(P, 'lshin', -1.15 + up * 0.4, 0, 0, air); mixRot(P, 'rshin', -0.6 + up * 0.2, 0, 0, air);
        mixRot(P, 'lfoot', 0.35, 0, 0, air); mixRot(P, 'rfoot', 0.25, 0, 0, air);
        mixRot(P, 'luarm', -0.35, 0, -0.45, air); mixRot(P, 'ruarm', -0.2, 0, 0.45, air);
        mixRot(P, 'lfarm', 0.7, 0, 0, air); mixRot(P, 'rfarm', 0.7, 0, 0, air);
        P.add('spine', 0.08 * air, 0, 0);
      }
      const land = ctx.land || 0;
      if (land > 0) {
        P.move('hips', 0, -0.12 * land, 0);
        P.add('lthigh', -0.45 * land, 0, 0); P.add('rthigh', -0.45 * land, 0, 0);
        P.add('lshin', -0.85 * land, 0, 0); P.add('rshin', -0.85 * land, 0, 0);
        P.add('lfoot', 0.4 * land, 0, 0); P.add('rfoot', 0.4 * land, 0, 0);
        P.add('spine', 0.15 * land, 0, 0);
      }
      if (ctx.talk) {
        const tk = ctx.talk;
        P.add('ruarm', 0.3 + Math.sin(t * 2.3) * 0.2 * tk, 0, 0.15);
        P.add('rfarm', 0.9 + Math.sin(t * 3.1) * 0.25 * tk, 0, 0);
        P.add('head', Math.sin(t * 4.1) * 0.04 * tk, 0, 0);
      }
      if (an.hit > 0) { P.add('chest', -an.hit * 0.6, 0, 0); P.add('head', -an.hit * 0.5, 0, 0); }
      const pitch = ctx.aimPitch || 0;
      if (armed) {
        const kind = Z.wieldKind(Z.item(ctx.wid)), aimK = (ctx.aimK || 0) * Math.min(1, ctx.wk);
        P.add('spine', -pitch * 0.25, 0, 0);
        P.add('chest', -pitch * 0.3, 0, 0);
        P.add('head', -pitch * 0.35, 0, 0);
        if (kind === 'rifle') { P.add('spine', 0, -0.2 - 0.15 * aimK, 0); P.add('chest', 0, -0.15 - 0.15 * aimK, 0); P.add('head', 0.14 * aimK, 0.35 + 0.3 * aimK, -0.14 * aimK); }
        else if (kind === 'pistol') { P.add('chest', 0, -0.08 * aimK, 0); P.add('head', 0.04 * aimK, 0.08 * aimK, 0); }
      }
      P.add('jaw', ctx.mouth || 0, 0, 0);
      const root = M4.trs(a.x, a.y, a.z, -a.yaw, 0, 0, scale);
      P.scale[0] = 1;
      P.rootScale = scale;
      P.solve(root);
      if (Z.wieldTP && ctx.wid !== undefined) Z.wieldTP(P, a, ctx);
      return root;
    },

    dead(P, a, ctx) {
      const an = a.anim;
      const k = Z.clamp(an.t / 0.7, 0, 1), e = k * k * (3 - 2 * k);
      const back = (a.seed || 0) % 2 === 0 ? 1 : -1;
      P.move('hips', 0, -0.82 * e, 0);
      P.set('hips', back * 1.5 * e, 0, ((a.seed || 0) % 3 - 1) * 0.2 * e);
      P.set('spine', back * 0.05 * e, 0, 0);
      P.set('head', -back * 0.2 * e, ((a.seed || 1) % 5 - 2) * 0.3 * e, 0);
      P.set('luarm', back * 0.6 * e, 0, -1.1 * e);
      P.set('ruarm', back * 0.2 * e, 0, 0.9 * e);
      P.set('lfarm', 0.6 * e, 0, 0);
      P.set('rfarm', 0.3 * e, 0, 0);
      P.set('lthigh', -0.2 * e * back, 0, -0.15 * e);
      P.set('rthigh', 0.1 * e * back, 0, 0.12 * e);
      P.set('lshin', -0.3 * e, 0, 0);
      P.set('rshin', -0.1 * e, 0, 0);
      const root = M4.trs(a.x, a.y, a.z, -a.yaw, 0, 0, ctx.scale || 1);
      P.solve(root);
      return root;
    }
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
