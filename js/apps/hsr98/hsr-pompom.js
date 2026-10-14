(function (H) {
  'use strict';
  const G = H.Gfx, R3 = H.R3, M = R3.M;
  const SS = 4, BLACK = '#1c1a22', RED_DK = '#6e1018', PAW = '#f6f2ea';
  const TOON = [[0.82, 1.08], [0.6, 0.9], [-9, 0.7]];
  const look = () => H.SPEAKERS.pompom.look;

  function faceTex(happy) {
    const L = look();
    return R3.paint('pom|face' + (happy ? 1 : 0), 64, 64, (g, w, h) => {
      g.fillStyle = L.hair; g.fillRect(0, 0, w, h);
      g.fillStyle = L.ear;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(64, 0); g.lineTo(64, 30); g.lineTo(52, 23); g.lineTo(44, 25); g.lineTo(37.5, 28); g.lineTo(32, 19); g.lineTo(26.5, 28); g.lineTo(20, 25); g.lineTo(12, 23); g.lineTo(0, 30); g.closePath(); g.fill();
      if (happy) {
        g.strokeStyle = '#241c2c'; g.lineWidth = 3;
        for (const x of [21, 43]) { g.beginPath(); g.arc(x, 39, 6, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
      } else {
        for (const x of [21, 43]) {
          const o = x < 32 ? 1 : -1;
          g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, 36, 6.5, 7.5, 0, 0, Math.PI * 2); g.fill();
          const gr = g.createLinearGradient(0, 29, 0, 43); gr.addColorStop(0, '#1c46a4'); gr.addColorStop(1, '#70ccff');
          g.fillStyle = gr; g.beginPath(); g.ellipse(x + o, 37, 5, 6.3, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#0e1636'; g.beginPath(); g.ellipse(x + o, 37, 2.2, 3.2, 0, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#ffffff'; g.fillRect(x + o - 3, 32, 3, 3); g.fillRect(x + o + 2, 40, 1, 1);
          g.fillStyle = '#1e1628'; g.fillRect(x - 7, 28.5, 14, 2.5);
        }
      }
      g.fillStyle = '#f4a0aa';
      g.beginPath(); g.ellipse(11, 45, 5, 3.4, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(53, 45, 5, 3.4, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#5a2430'; g.lineWidth = 1.4;
      g.beginPath(); g.arc(29.6, 46, 2.4, 0.1, Math.PI - 0.1); g.stroke();
      g.beginPath(); g.arc(34.4, 46, 2.4, 0.1, Math.PI - 0.1); g.stroke();
      g.fillStyle = L.beard;
      for (const [x, y, r] of [[18, 60, 7], [25, 56, 6], [32, 55, 6.5], [39, 56, 6], [46, 60, 7]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      g.fillRect(12, 58, 40, 6);
      g.fillStyle = '#8a6424';
      for (const [x, y] of [[29, 57], [35, 57], [32, 61]]) { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#f0c050';
      for (const [x, y] of [[29, 57], [35, 57], [32, 61]]) { g.beginPath(); g.arc(x - 0.4, y - 0.4, 2.3, 0, Math.PI * 2); g.fill(); }
    });
  }

  function tails(m, red) {
    const n = 7, a0 = Math.PI * 0.55, a1 = Math.PI * 1.45;
    const lo = i => 0.06 + Math.abs(i / n - 0.5) * 0.14, p = (a, r, y) => [r * Math.sin(a), y, r * Math.cos(a)];
    for (let i = 0; i < n; i++) {
      const u = a0 + (a1 - a0) * i / n, v = a0 + (a1 - a0) * (i + 1) / n;
      R3.quad(m, [...p(u, 0.27, lo(i)), ...p(v, 0.27, lo(i + 1)), ...p(v, 0.212, 0.36), ...p(u, 0.212, 0.36)], i === 3 ? RED_DK : red, { two: true });
    }
  }

  let P = null;
  function parts() {
    if (P) return P;
    const L = look(), FUR = L.hair, DARK = L.ear, RED = L.top, GOLD = L.trim;
    P = {};
    P.leg = R3.mesh();
    R3.cyl(P.leg, 0, -0.2, 0, 0.058, 0.066, 0.2, 7, DARK);
    R3.ell(P.leg, 0, -0.19, 0.03, 0.068, 0.048, 0.098, 8, 5, PAW);
    P.body = R3.mesh();
    R3.ell(P.body, 0, 0.4, 0, 0.23, 0.25, 0.2, 12, 8, RED);
    R3.ell(P.body, 0, 0.37, 0.05, 0.14, 0.2, 0.165, 10, 7, FUR);
    tails(P.body, RED);
    for (const s of [-1, 1]) { const tr = R3.mesh(); R3.box(tr, 0, 0, 0, 0.03, 0.3, 0.02, BLACK); R3.merge(P.body, tr, M.of(M.t(s * 0.128, 0.33, 0.165), M.rz(s * 0.12), M.rx(0.12))); }
    for (const s of [-1, 1]) { const lp = R3.mesh(); R3.box(lp, 0, 0, 0, 0.05, 0.22, 0.02, BLACK); R3.merge(P.body, lp, M.of(M.t(s * 0.07, 0.5, 0.18), M.rz(s * 0.45), M.rx(-0.35))); }
    R3.ell(P.body, 0, 0.6, 0.12, 0.085, 0.05, 0.07, 8, 5, '#faf8f4');
    R3.ell(P.body, 0, 0.635, 0.13, 0.13, 0.065, 0.085, 10, 5, L.beard);
    for (const [x, y] of [[-0.024, 0.64], [0.024, 0.64], [0, 0.614]]) R3.ell(P.body, x, y, 0.212, 0.022, 0.022, 0.015, 6, 4, GOLD, { emit: 0.25 });
    const ch = R3.mesh(); R3.box(ch, 0, 0, 0, 0.012, 0.2, 0.012, GOLD, { emit: 0.2 }); R3.merge(P.body, ch, M.of(M.t(0.11, 0.43, 0.19), M.rz(0.55)));
    R3.disc(P.body, 0.17, 0.33, 0.175, 0.045, 0.02, 8, GOLD, { emit: 0.2 });
    R3.disc(P.body, 0.17, 0.33, 0.192, 0.034, 0.006, 8, '#f8f4e8', { emit: 0.3 });
    const head = happy => { const m = R3.mesh(); R3.ell(m, 0, 0, 0, 0.25, 0.215, 0.22, 14, 9, FUR, { face: { tex: faceTex(happy), z: 0.18 } }); R3.ell(m, 0, 0.05, -0.035, 0.254, 0.2, 0.225, 12, 7, DARK); return m; };
    P.head = head(false); P.headHappy = head(true);
    const ear = s => { const m = R3.mesh(); R3.ell(m, 0, -0.27, 0, 0.085, 0.3, 0.04, 8, 7, DARK); R3.ell(m, -s * 0.03, -0.31, 0.004, 0.058, 0.23, 0.036, 8, 6, '#d6d0da'); return m; };
    P.earL = ear(-1); P.earR = ear(1);
    P.arm = R3.mesh();
    R3.cyl(P.arm, 0, -0.2, 0, 0.082, 0.062, 0.2, 8, RED);
    R3.cyl(P.arm, 0, -0.245, 0, 0.094, 0.088, 0.06, 8, GOLD, { emit: 0.15 });
    R3.ell(P.arm, 0, -0.28, 0, 0.056, 0.05, 0.056, 7, 5, PAW);
    P.hat = R3.mesh();
    R3.cyl(P.hat, 0, 0, 0, 0.165, 0.178, 0.3, 12, RED, { capCol: BLACK });
    R3.cyl(P.hat, 0, 0.255, 0, 0.181, 0.182, 0.05, 12, BLACK, { cap: false });
    R3.cyl(P.hat, 0, 0.215, 0, 0.18, 0.181, 0.022, 12, GOLD, { cap: false, emit: 0.25 });
    R3.ell(P.hat, 0, 0.01, 0.1, 0.19, 0.024, 0.14, 10, 3, BLACK);
    R3.disc(P.hat, 0, 0.12, 0.155, 0.085, 0.025, 10, GOLD, { emit: 0.3 });
    R3.disc(P.hat, 0, 0.12, 0.178, 0.052, 0.012, 10, '#fffbe8', { emit: 1 });
    R3.disc(P.hat, 0, 0.215, 0.165, 0.022, 0.012, 8, '#f4f0e0', { emit: 0.4 });
    for (const s of [-1, 1]) R3.box(P.hat, s * 0.085, 0.06, 0.168, 0.07, 0.03, 0.016, GOLD, { emit: 0.25 });
    return P;
  }

  function draw(R, st) {
    const Q = parts();
    const root = M.of(M.t(st.x || 0, (st.y || 0) + (st.bob || 0), st.z || 0), M.ry(st.yaw || 0), M.rx(st.pitch || 0), M.s(1, st.sq || 1, 1));
    for (const s of [-1, 1]) R.draw(Q.leg, M.of(root, M.t(s * 0.09, 0.2, 0), M.rx(s * (st.leg || 0))));
    R.draw(Q.body, root);
    for (const s of [-1, 1]) R.draw(Q.arm, M.of(root, M.t(s * 0.215, 0.53, 0), M.ry(-s * (st.armYaw || 0)), M.rz(s * (st.armRoll == null ? 0.22 : st.armRoll)), M.rx((st.armPitch == null ? 0.1 : st.armPitch) + s * (st.armSwing || 0))));
    const head = M.of(root, M.t(0, 0.8, 0), M.rx(st.tilt || 0));
    R.draw(st.happy ? Q.headHappy : Q.head, head);
    for (const s of [-1, 1]) R.draw(s < 0 ? Q.earL : Q.earR, M.of(head, M.t(s * 0.2, 0.06, -0.03), M.rz(s * (0.12 + (st.ear || 0)))));
    const hat = M.of(head, M.t(0, 0.14, -0.01), M.rx(-0.1));
    R.draw(Q.hat, hat);
    return { lamp: M.pt(hat, 0, 0.12, 0.2) };
  }

  function bake(w, h, k, at, elev, pose) {
    const R = new R3.Raster(w * SS, h * SS);
    R.clear(null);
    R.light({ amb: [0.6, 0.6, 0.62], dir: [-0.5, 0.8, 0.75], sun: [0.55, 0.54, 0.5], toon: TOON });
    R.look([at[0], at[1] + Math.sin(elev) * 8, at[2] + Math.cos(elev) * 8], at, 30, 0, k * SS);
    draw(R, pose);
    return G.downsample(R.bake(), w, h, true);
  }

  function bust(size) { return bake(size, size, size / 0.94, [0, 0.83, 0], 0.08, { yaw: 0.28, tilt: 0.04 }); }

  function figure(kf) { return bake(48 * kf, 96 * kf, 41 * kf, [0, 1.1, 0], 0.05, { yaw: 0.22 }); }

  H.PomPom = { draw, bust, figure };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
