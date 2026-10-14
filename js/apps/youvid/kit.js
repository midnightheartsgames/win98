(function () {
  const { M4, V3, Builder, rand } = window.P3D;
  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = (x) => { const k = clamp(x, 0, 1); return k * k * (3 - 2 * k); };
  const frac = (x) => x - Math.floor(x);
  const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function envelope(str, rate) {
    const vals = new Float32Array(str.length);
    for (let i = 0; i < str.length; i++) vals[i] = Math.max(0, ALPHA.indexOf(str[i])) / (ALPHA.length - 1);
    return (t) => {
      const x = t * rate;
      const i = Math.floor(x);
      if (i < 0 || i >= vals.length - 1) return 0;
      return lerp(vals[i], vals[i + 1], x - i);
    };
  }

  function keys(list) {
    return (t) => {
      if (t <= list[0][0]) return list[0][1];
      for (let i = 1; i < list.length; i++) {
        if (t < list[i][0]) {
          const [t0, v0] = list[i - 1];
          const [t1, v1] = list[i];
          const k = ease((t - t0) / (t1 - t0));
          return Array.isArray(v0) ? v0.map((v, j) => lerp(v, v1[j], k)) : lerp(v0, v1, k);
        }
      }
      return list[list.length - 1][1];
    };
  }

  function spherePatch(b, rx, ry, rz, y0, y1, p0, p1, nu, nv, col, uvs) {
    const pt = (u, v) => {
      const yaw = y0 + (y1 - y0) * u, pit = p0 + (p1 - p0) * v;
      const n = [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
      return { p: [n[0] * rx, n[1] * ry, n[2] * rz], n: V3.norm([n[0] / rx, n[1] / ry, n[2] / rz]) };
    };
    const uv = (u, v) => [u * uvs[0], v * uvs[1]];
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), bb = pt(u1, v0), c = pt(u1, v1), d = pt(u0, v1);
        b.quad(a.p, bb.p, c.p, d.p, col, uvs ? [uv(u0, v0), uv(u1, v0), uv(u1, v1), uv(u0, v1)] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
    return b;
  }

  function discXY(b, x, y, z, rad, n, col) {
    const nz = [0, 0, 1];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      b.tri([x, y, z], [x + C(a0) * rad, y + S(a0) * rad, z], [x + C(a1) * rad, y + S(a1) * rad, z], col, [[0.5, 0.5], [0.5 + C(a0) * 0.5, 0.5 + S(a0) * 0.5], [0.5 + C(a1) * 0.5, 0.5 + S(a1) * 0.5]], [nz, nz, nz]);
    }
    return b;
  }

  function tube(b, pts, radii, sides, col) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], c = pts[i + 1];
      const dir = V3.norm(V3.sub(c, a));
      let side = V3.cross(dir, [0, 1, 0]);
      if (V3.len(side) < 1e-3) side = [1, 0, 0];
      side = V3.norm(side);
      const up = V3.cross(side, dir);
      const ring = (p, r, k) => {
        const ang = (k / sides) * PI * 2;
        const n = V3.add(V3.mul(side, C(ang)), V3.mul(up, S(ang)));
        return { p: V3.add(p, V3.mul(n, r)), n };
      };
      for (let k = 0; k < sides; k++) {
        const p0 = ring(a, radii[i], k), p1 = ring(a, radii[i], k + 1);
        const q0 = ring(c, radii[i + 1], k), q1 = ring(c, radii[i + 1], k + 1);
        b.quad(p0.p, p1.p, q1.p, q0.p, col, null, [p0.n, p1.n, q1.n, q0.n]);
      }
    }
    return b;
  }

  function mesh(r, fn) {
    const b = new Builder();
    fn(b);
    return r.mesh(b);
  }

  function noiseTex(base, seed, amount, specks) {
    return (ctx, w, h) => {
      const g = rand(seed);
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      const n = w * h * (specks || 0.35);
      for (let i = 0; i < n; i++) {
        const v = g();
        ctx.fillStyle = v < 0.5 ? `rgba(0,0,0,${amount * g()})` : `rgba(255,255,255,${amount * g()})`;
        ctx.fillRect(Math.floor(g() * w), Math.floor(g() * h), 1 + Math.floor(g() * 2), 1);
      }
    };
  }

  function overlay(r, w, h) {
    const unit = mesh(r, b => b.quad([0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [1, 1, 1, 1], null, [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    const ENV = { sunDir: [0, -1, 0], sunColor: [0, 0, 0], ambTop: [1, 1, 1], ambBottom: [1, 1, 1], fogColor: [0, 0, 0], fogNear: 1000, fogFar: 2000 };
    const ORTHO = new Float32Array([2 / w, 0, 0, 0, 0, -2 / h, 0, 0, 0, 0, -1, 0, -1, 1, 0, 1]);
    const VIEW = M4.ident();
    return {
      begin(rect, colorM, colorAdd) {
        r.begin(ENV, { proj: ORTHO, view: VIEW, colorM, colorAdd }, rect, true);
      },
      rect(x, y, rw, rh, opts) {
        r.draw(unit, M4.chain(M4.translate(x, y + rh, 0), M4.scale(rw, -rh, 1)), Object.assign({ noFog: true }, opts));
      },
      quad: unit
    };
  }

  function textCanvas(w, h, draw) {
    return (ctx, cw, ch) => {
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.scale(cw / w, ch / h);
      draw(ctx, w, h);
      ctx.restore();
    };
  }

  function wobble(t, amp, seed) {
    const s = seed || 0;
    return [
      (S(t * 1.31 + s) * 0.6 + S(t * 2.7 + s * 2) * 0.3 + S(t * 5.3 + s) * 0.1) * amp,
      (S(t * 1.07 + s * 3) * 0.6 + S(t * 3.1 + s) * 0.3 + S(t * 6.1 + s * 5) * 0.1) * amp,
      (S(t * 0.83 + s * 7) * 0.5 + S(t * 2.3 + s) * 0.5) * amp
    ];
  }

  window.YouVidKit = { PI, S, C, clamp, lerp, ease, frac, envelope, keys, spherePatch, discXY, tube, mesh, noiseTex, overlay, textCanvas, wobble };
})();
