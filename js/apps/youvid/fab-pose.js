(function () {
  const { V3 } = window.P3D;
  const { PI, S, C, clamp, lerp, ease } = window.YouVidKit;
  const Cast = window.FabCast;

  function local(x, z, yaw, lx, lz) {
    return [x + C(yaw) * lx + S(yaw) * lz, z - S(yaw) * lx + C(yaw) * lz];
  }

  function arms(cls, o) {
    const d = Cast.D[cls];
    return {
      hL: o.hL || [d.shX + 0.08, -0.25, 0.06],
      hR: o.hR || [-(d.shX + 0.08), -0.25, 0.06],
      eL: o.eL, eR: o.eR, wL: o.wL, wR: o.wR
    };
  }

  function base(cls, p, yaw, o) {
    return Object.assign({ p, fwd: [S(yaw), 0, C(yaw)], up: [0, 1, 0], sp: o.sp || [0, 0, 0], nk: o.nk || [0, 0, 0] }, arms(cls, o));
  }

  function stand(cls, x, z, yaw, opts) {
    const o = opts || {};
    const d = Cast.D[cls];
    const y0 = o.y || 0;
    const p = [x, Cast.standY(cls) + y0 + (o.dy || 0), z];
    const spread = o.spread === undefined ? 0.04 : o.spread;
    const fl = local(x, z, yaw, d.hipX + spread, o.fl === undefined ? 0.03 : o.fl);
    const fr = local(x, z, yaw, -(d.hipX + spread), o.fr === undefined ? -0.01 : o.fr);
    const pose = base(cls, p, yaw, o);
    pose.fLw = [fl[0], y0 + 0.075 + (o.liftL || 0), fl[1]];
    pose.fRw = [fr[0], y0 + 0.075 + (o.liftR || 0), fr[1]];
    return pose;
  }

  function crouch(cls, x, z, yaw, opts) {
    const o = Object.assign({ sp: [0.35, 0, 0], nk: [-0.25, 0, 0] }, opts || {});
    const d = Cast.D[cls];
    const pose = stand(cls, x, z, yaw, Object.assign({}, o, { dy: -(d.thigh + d.shin) * (o.depth || 0.42), spread: 0.1, fl: 0.16, fr: -0.08 }));
    return pose;
  }

  function run(cls, x, z, yaw, phase, opts) {
    const o = opts || {};
    const d = Cast.D[cls];
    const legLen = d.thigh + d.shin;
    const amp = o.stride === undefined ? 0.34 : o.stride;
    const ph = phase * PI * 2;
    const bob = Math.abs(S(ph)) * 0.05 * (o.bob === undefined ? 1 : o.bob);
    const p = [x, Cast.standY(cls) - 0.05 + bob + (o.y || 0), z];
    const lean = o.lean === undefined ? 0.22 : o.lean;
    const pose = base(cls, p, yaw, Object.assign({ sp: [lean, S(ph) * 0.15, 0], nk: [-lean * 0.7, -S(ph) * 0.12, 0] }, o));
    const foot = (k, sgn) => {
      const sw = S(ph) * sgn;
      const lift = Math.max(0, C(ph) * sgn) * 0.22;
      return [k * (d.hipX + 0.02), -legLen + 0.06 + lift, sw * amp * legLen];
    };
    pose.fL = foot(1, 1);
    pose.fR = foot(-1, -1);
    pose.aL = -0.2 * S(ph);
    pose.aR = 0.2 * S(ph);
    if (!o.hL) pose.hL = [d.shX + 0.04, -0.15, -S(ph) * 0.24 + 0.08];
    if (!o.hR) pose.hR = [-(d.shX + 0.04), -0.15, S(ph) * 0.24 + 0.08];
    if (!o.eL) pose.eL = [0.4, -0.2, -0.8];
    if (!o.eR) pose.eR = [-0.4, -0.2, -0.8];
    return pose;
  }

  function sitFloor(cls, x, z, yaw, opts) {
    const o = opts || {};
    const d = Cast.D[cls];
    const p = [x, 0.2 + (o.y || 0), z];
    const pose = base(cls, p, yaw, Object.assign({ sp: [-0.1, 0, 0] }, o));
    const legLen = d.thigh + d.shin;
    const splay = o.splay === undefined ? 0.35 : o.splay;
    const fl = local(x, z, yaw, d.hipX + legLen * S(splay), legLen * C(splay) * 0.92);
    const fr = local(x, z, yaw, -(d.hipX + legLen * S(splay)), legLen * C(splay) * 0.92);
    pose.fLw = [fl[0], 0.08, fl[1]];
    pose.fRw = [fr[0], 0.08, fr[1]];
    pose.kL = [0.3, 1, 0.3];
    pose.kR = [-0.3, 1, 0.3];
    return pose;
  }

  function prone(cls, x, z, yaw, opts) {
    const o = opts || {};
    const d = Cast.D[cls];
    const dir = [S(yaw), 0, C(yaw)];
    const p = [x, 0.17 + (o.y || 0), z];
    const pose = Object.assign({ p, up: V3.norm([dir[0], o.tilt || 0.12, dir[2]]), fwd: [0, -1, 0], sp: o.sp || [0, 0, 0], nk: o.nk || [-0.9, 0, 0] }, arms(cls, o));
    const legLen = d.thigh + d.shin;
    const side = [C(yaw), 0, -S(yaw)];
    pose.fLw = V3.add(V3.add(p, V3.mul(dir, -legLen)), V3.add(V3.mul(side, d.hipX + 0.06), [0, -0.06, 0]));
    pose.fRw = V3.add(V3.add(p, V3.mul(dir, -legLen)), V3.add(V3.mul(side, -(d.hipX + 0.06)), [0, -0.06, 0]));
    pose.kL = [0.2, -0.2, 1];
    pose.kR = [-0.2, -0.2, 1];
    if (!o.hL) pose.hL = [d.shX + 0.1, 0.3, 0.2];
    if (!o.hR) pose.hR = [-(d.shX + 0.1), 0.3, 0.2];
    return pose;
  }

  function supine(cls, x, z, yaw, opts) {
    const o = opts || {};
    const d = Cast.D[cls];
    const dir = [S(yaw), 0, C(yaw)];
    const p = [x, 0.16 + (o.y || 0), z];
    const pose = Object.assign({ p, up: V3.norm([dir[0], o.tilt || 0.05, dir[2]]), fwd: [0, 1, 0], sp: o.sp || [0, 0, 0], nk: o.nk || [0.2, 0, 0] }, arms(cls, o));
    const legLen = d.thigh + d.shin;
    const side = [-C(yaw), 0, S(yaw)];
    pose.fLw = V3.add(V3.add(p, V3.mul(dir, -legLen)), V3.mul(side, d.hipX + 0.1));
    pose.fRw = V3.add(V3.add(p, V3.mul(dir, -legLen)), V3.mul(side, -(d.hipX + 0.1)));
    pose.fLw[1] = 0.08;
    pose.fRw[1] = 0.08;
    pose.kL = [0.3, 0, 1];
    pose.kR = [-0.3, 0, 1];
    if (!o.hL) pose.hL = [d.shX + 0.25, -0.1, -0.05];
    if (!o.hR) pose.hR = [-(d.shX + 0.25), -0.1, -0.05];
    return pose;
  }

  function airborne(cls, p, up, fwd, opts) {
    const o = opts || {};
    const d = Cast.D[cls];
    const legLen = d.thigh + d.shin;
    const pose = Object.assign({ p, up: V3.norm(up), fwd: V3.norm(fwd), sp: o.sp || [0, 0, 0], nk: o.nk || [0, 0, 0] }, arms(cls, Object.assign({ hL: [d.shX + 0.3, 0.1, 0.1], hR: [-(d.shX + 0.3), 0.15, 0.05] }, o)));
    pose.fL = o.fL || [d.hipX + 0.08, -legLen * 0.85, 0.12];
    pose.fR = o.fR || [-(d.hipX + 0.08), -legLen * 0.75, -0.2];
    return pose;
  }

  const VEC = ['p', 'up', 'fwd', 'sp', 'nk', 'hL', 'hR', 'eL', 'eR', 'wL', 'wR', 'fL', 'fR', 'fLw', 'fRw', 'kL', 'kR', 'hLw', 'hRw'];

  function blend(a, b, k) {
    if (k <= 0) return a;
    if (k >= 1) return b;
    const out = Object.assign({}, a);
    VEC.forEach(key => {
      if (a[key] && b[key]) out[key] = a[key].map((v, i) => lerp(v, b[key][i], k));
      else if (b[key] && k > 0.5) out[key] = b[key];
    });
    ['aL', 'aR'].forEach(key => { if (a[key] !== undefined || b[key] !== undefined) out[key] = lerp(a[key] || 0, b[key] || 0, k); });
    if (a.fLw && !b.fLw && b.fL) { delete out.fLw; out.fL = b.fL; }
    if (a.fRw && !b.fRw && b.fR) { delete out.fRw; out.fR = b.fR; }
    return out;
  }

  function seq(list, t) {
    if (t <= list[0][0]) return list[0][1](t);
    for (let i = 0; i < list.length - 1; i++) {
      const [t0, f0, dur] = list[i];
      const [t1, f1] = list[i + 1];
      if (t < t1) {
        const k = dur ? ease((t - (t1 - dur)) / dur) : 0;
        return k > 0 ? blend(f0(t), f1(t), k) : f0(t);
      }
    }
    return list[list.length - 1][1](t);
  }

  function with_(pose, extra) {
    return Object.assign({}, pose, extra);
  }

  function aimGun(cls, gun, opts) {
    const g = Cast.twoHanded(gun, opts);
    return { hR: g.hR, hL: g.hL, gunM: g.M };
  }

  window.FabPose = { local, stand, crouch, run, sitFloor, prone, supine, airborne, blend, seq, with: with_, aimGun, VEC };
})();
