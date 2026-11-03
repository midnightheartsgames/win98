(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const Heavy = window.MeetHeavy;

  const COL = {
    metal: 0x8a908c, metalDk: 0x4e5452, metalLt: 0xb8bcb8, pad: 0x4a5a54, padDk: 0x34403c, rubber: 0x1e1e1e, gun: 0x5a5e60, gunDk: 0x2e3032,
    red: 0xa8302a, brass: 0xc08a3a, copper: 0xc86a30, white: 0xe8e6e0, porcelain: 0xe6e2d6, pack: 0x7a827c, packDk: 0x4a504c,
    heart: 0xb8333a, heartDk: 0x7a1a24, vessel: 0xc0505a, vein: 0x6a3a6a, fat: 0xe0c08a, fridge: 0xd8d6c8, fridgeDk: 0xa8a69a,
    glass: 0x9ab0a8, bottle: 0x5a2a12, dove: 0xf0efea, doveDk: 0xc8c6c0, beak: 0xd89a8a, crow: 0x1a1a1c, blood: 0x8e1016,
    rib: 0xe6dccb, organ: 0x8a2a3a, flesh: 0xc0606a, shirt: 0xb4382f, vest: 0x3a3532, skin: 0xd38d62,
    mask: 0x34436a, maskDk: 0x22304e, spySkin: 0xdca688, chair: 0xd8782a, chairDk: 0x9a5018, wood: 0x6a4a30, rock: 0x6a6460, rockDk: 0x4a4440
  };

  const METAL = { spec: [0.6, 30], rim: 0.6 };
  const PAINT = { spec: [0.25, 14], rim: 0.6 };
  const WET = { spec: [0.9, 40], rim: 0.9 };

  function basisM(o, x, y, z) {
    return new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, o[0], o[1], o[2], 1]);
  }

  function alongM(a, b, r) {
    const d = V3.sub(b, a);
    const len = V3.len(d) || 1e-4;
    const y = V3.mul(d, 1 / len);
    let x = V3.cross(y, Math.abs(y[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]);
    x = V3.norm(x);
    const z = V3.cross(x, y);
    return basisM(a, V3.mul(x, r), V3.mul(y, len), V3.mul(z, r));
  }

  function aimM(pos, dir, up) {
    const z = V3.norm(dir);
    let x = V3.cross(up || [0, 1, 0], z);
    x = V3.len(x) < 1e-5 ? [1, 0, 0] : V3.norm(x);
    return basisM(pos, x, V3.cross(z, x), z);
  }

  function ring(b, r, y, w, col, sides) {
    b.prism(sides || 18, r, r, y - w / 2, r, r, y + w / 2, col, { capTop: false });
  }

  function lump(b, seed, rx, ry, rz, nu, nv, col, amp) {
    const g = rand(seed);
    const bumps = [];
    for (let i = 0; i < 7; i++) bumps.push([g() * PI * 2, (g() - 0.5) * PI * 0.9, 0.3 + g() * 0.5, (g() - 0.4) * amp]);
    const R = (yaw, pit) => {
      let k = 1;
      bumps.forEach(([by, bp, w, a]) => {
        const d = Math.acos(clamp(C(pit) * C(bp) * C(yaw - by) + S(pit) * S(bp), -1, 1));
        k += a * Math.exp(-(d / w) * (d / w));
      });
      return k;
    };
    const pt = (i, j) => {
      const yaw = (i / nu) * PI * 2, pit = -PI / 2 + (j / nv) * PI;
      const k = R(yaw, pit);
      return [S(yaw) * C(pit) * rx * k, S(pit) * ry * k, C(yaw) * C(pit) * rz * k];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), col);
      }
    }
    return b;
  }

  function buildTable(b) {
    b.at(0, 0.02, 0, h => h.box(0.7, 0.04, 0.5, COL.metalDk));
    b.prism(14, 0.09, 0.09, 0.04, 0.07, 0.07, 0.62, COL.metal);
    b.at(-0.02, 0.66, 0, h => h.box(0.5, 0.06, 0.62, COL.metal));
    b.at(-0.02, 0.73, 0, h => h.box(0.48, 0.08, 0.6, COL.pad));
    const back = 0.56;
    b.push(M4.translate(0.22, 0.72, 0), M4.rotZ(back));
    b.at(0.42, 0.04, 0, h => h.box(0.84, 0.08, 0.62, COL.pad));
    b.at(0.42, -0.02, 0, h => h.box(0.82, 0.04, 0.58, COL.metal));
    b.at(0.88, 0.07, 0, h => h.box(0.14, 0.06, 0.3, COL.padDk));
    [-1, 1].forEach(s => b.at(0.86, 0.12, s * 0.16, h => h.box(0.16, 0.12, 0.05, COL.padDk)));
    b.pop();
    b.push(M4.translate(-0.26, 0.72, 0), M4.rotZ(-0.08));
    b.at(-0.48, 0.02, 0, h => h.box(0.96, 0.08, 0.6, COL.pad));
    b.at(-0.48, -0.04, 0, h => h.box(0.94, 0.04, 0.56, COL.metal));
    b.pop();
    [-1, 1].forEach(s => {
      K.tube(b, [[-1.1, 0.74, s * 0.33], [-0.3, 0.76, s * 0.33], [0.2, 0.76, s * 0.33], [0.6, 1.0, s * 0.35]], [0.012, 0.012, 0.012, 0.012], 6, COL.metalLt);
    });
    const arc = [];
    for (let i = 0; i <= 12; i++) {
      const a = lerp(-1.2, 1.2, i / 12);
      arc.push([0.93 + C(a) * 0.12, 1.24 + C(a) * 0.32, S(a) * 0.36]);
    }
    K.tube(b, arc, arc.map(() => 0.02), 8, COL.metal);
    return b;
  }

  function unitCyl(b, col, sides) {
    b.prism(sides || 12, 1, 1, 0, 1, 1, 1, col, { capBottom: true });
    return b;
  }

  function buildLabGun(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(20, 0.1, 0.1, -0.34, 0.11, 0.11, -0.1, COL.gunDk, { capBottom: true });
    b.prism(20, 0.11, 0.11, -0.1, 0.1, 0.1, 0.22, COL.gun);
    for (let i = 0; i < 6; i++) ring(b, 0.118, -0.06 + i * 0.05, 0.022, COL.red, 20);
    b.prism(20, 0.1, 0.1, 0.22, 0.13, 0.13, 0.34, COL.gunDk, { capTop: false });
    b.prism(20, 0.13, 0.13, 0.34, 0.12, 0.12, 0.36, COL.metalLt, { capTop: false });
    b.at(0, 0.3, 0, h => h.prism(20, 0.08, 0.08, 0, 0.08, 0.08, 0.02, rgb(0xff5a40, 1)));
    b.pop();
    b.at(0, 0.14, -0.1, h => h.box(0.08, 0.1, 0.16, COL.gunDk));
    b.at(0.13, 0, -0.05, h => h.box(0.04, 0.12, 0.24, COL.metalDk));
    b.at(-0.13, 0, -0.05, h => h.box(0.04, 0.12, 0.24, COL.metalDk));
    const hose = [];
    for (let i = 0; i <= 14; i++) {
      const k = i / 14;
      hose.push([S(k * PI * 1.2) * 0.22, 0.05 + S(k * PI) * 0.3, -0.34 - k * 0.5]);
    }
    for (let i = 0; i < hose.length - 1; i++) {
      const r0 = i % 2 ? 0.048 : 0.056;
      K.tube(b, [hose[i], hose[i + 1]], [r0, r0], 8, i % 2 ? COL.gunDk : COL.rubber);
    }
    return b;
  }

  function buildMedigun(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(14, 0.045, 0.045, -0.18, 0.05, 0.05, -0.02, COL.gunDk, { capBottom: true });
    b.prism(14, 0.05, 0.05, -0.02, 0.046, 0.046, 0.2, COL.gun);
    for (let i = 0; i < 7; i++) ring(b, 0.056, 0.02 + i * 0.026, 0.014, COL.red, 14);
    b.prism(14, 0.046, 0.046, 0.2, 0.062, 0.062, 0.27, COL.gunDk, { capTop: false });
    b.prism(14, 0.062, 0.062, 0.27, 0.058, 0.058, 0.3, COL.metalLt, { capTop: false });
    b.at(0, 0.28, 0, h => h.prism(14, 0.04, 0.04, 0, 0.04, 0.04, 0.012, COL.gunDk));
    b.pop();
    b.at(0, 0.06, -0.16, h => h.ellipsoid(0.035, 0.035, 0.012, 12, 6, rgb(0xd83a2a, 0.6)));
    b.push(M4.translate(0, -0.05, -0.08), M4.rotX(0.25));
    b.at(0, -0.06, 0, h => h.box(0.032, 0.12, 0.045, COL.rubber));
    b.pop();
    b.at(0, -0.035, -0.035, h => h.box(0.012, 0.03, 0.02, COL.metalDk));
    b.push(M4.translate(0, 0.07, 0.06));
    K.tube(b, [[0, -0.02, -0.06], [0, 0.03, -0.04], [0, 0.04, 0.04], [0, -0.02, 0.06]], [0.008, 0.008, 0.008, 0.008], 6, COL.metalDk);
    b.pop();
    K.tube(b, [[0, -0.02, -0.18], [0, -0.06, -0.26], [0.02, -0.16, -0.3]], [0.014, 0.014, 0.014], 6, COL.rubber);
    return b;
  }

  function buildPack(b) {
    b.at(0, 0.2, 0, h => h.box(0.32, 0.42, 0.15, COL.pack));
    b.at(0, 0.2, -0.078, h => h.box(0.26, 0.34, 0.01, COL.packDk));
    b.at(0, 0.42, 0, h => h.box(0.34, 0.03, 0.17, COL.packDk));
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.1, 0.44, -0.01));
      for (let i = 0; i < 9; i++) {
        const y = i * 0.03;
        const r = lerp(0.05, 0.034, i / 9);
        b.prism(16, r, r, y, r, r, y + 0.018, COL.porcelain);
        b.prism(16, r * 0.62, r * 0.62, y + 0.018, r * 0.62, r * 0.62, y + 0.03, COL.porcelain, { capTop: false });
      }
      b.prism(12, 0.012, 0.012, 0.27, 0.012, 0.012, 0.33, COL.metalDk);
      b.pop();
      const loop = [];
      for (let i = 0; i <= 12; i++) {
        const a = lerp(0, PI * 1.05, i / 12);
        loop.push([s * (0.1 + S(a) * 0.1), 0.76 + C(a) * 0.08 - (1 - C(a)) * 0.08, -0.01 - S(a) * 0.02]);
      }
      K.tube(b, loop, loop.map(() => 0.009), 6, COL.copper);
    });
    b.push(M4.translate(-0.2, 0.18, 0.0));
    b.prism(16, 0.05, 0.05, -0.16, 0.05, 0.05, 0.16, COL.red, { capBottom: true });
    b.at(0, 0.16, 0, h => h.ellipsoid(0.05, 0.03, 0.05, 12, 6, COL.red));
    ring(b, 0.052, -0.02, 0.07, COL.white, 16);
    b.at(0, 0.21, 0, h => h.prism(10, 0.016, 0.016, 0, 0.012, 0.012, 0.04, COL.metalDk));
    b.pop();
    b.at(0.17, 0.26, 0.0, h => h.box(0.02, 0.2, 0.12, COL.packDk));
    b.at(0, 0.12, -0.08, h => {
      h.push(M4.rotX(PI / 2));
      h.prism(18, 0.06, 0.06, -0.01, 0.06, 0.06, 0.02, COL.metalLt);
      h.pop();
    });
    return b;
  }

  function buildMeterBox(b) {
    b.box(0.14, 0.12, 0.05, COL.gunDk);
    b.at(0, -0.035, 0.026, h => h.box(0.1, 0.03, 0.004, COL.packDk));
    return b;
  }

  function quadMesh(b, w, h, col) {
    b.quad([-w / 2, -h / 2, 0], [w / 2, -h / 2, 0], [w / 2, h / 2, 0], [-w / 2, h / 2, 0], col || rgb(0xffffff), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    return b;
  }

  function buildHeart(b, s) {
    b.push(M4.scale(s, s, s), M4.rotZ(-0.35));
    K.spherePatch(b, 0.052, 0.068, 0.046, -PI, PI, -PI / 2, PI / 2, 18, 12, COL.heart, [2, 2]);
    b.at(0.03, 0.035, 0.004, h => K.spherePatch(h, 0.034, 0.036, 0.034, -PI, PI, -PI / 2, PI / 2, 12, 8, COL.heartDk, [1, 1]));
    b.at(-0.028, 0.03, 0.0, h => K.spherePatch(h, 0.03, 0.032, 0.03, -PI, PI, -PI / 2, PI / 2, 12, 8, COL.heart, [1, 1]));
    b.pop();
    const sc = (p) => V3.mul(p, s);
    K.tube(b, [[0.0, 0.05, 0], [0.004, 0.09, 0.004], [-0.02, 0.118, 0.006], [-0.05, 0.112, 0.004], [-0.06, 0.09, 0.0]].map(sc), [0.018, 0.019, 0.018, 0.016, 0.015].map(r => r * s), 10, COL.vessel);
    K.tube(b, [[0.02, 0.05, 0.02], [0.03, 0.08, 0.03], [0.045, 0.1, 0.028]].map(sc), [0.014, 0.014, 0.012].map(r => r * s), 8, COL.vein);
    K.tube(b, [[-0.03, 0.05, -0.01], [-0.034, 0.085, -0.014], [-0.03, 0.105, -0.012]].map(sc), [0.013, 0.013, 0.012].map(r => r * s), 8, COL.vessel);
    [[-0.01, 0.12], [-0.035, 0.122], [-0.055, 0.108]].forEach(([x, y]) => K.tube(b, [[x, y - 0.01, 0.004], [x, y + 0.012, 0.004]].map(sc), [0.006 * s, 0.006 * s], 6, COL.vessel));
    b.at(0.015 * s, 0.035 * s, 0.03 * s, h => h.ellipsoid(0.02 * s, 0.008 * s, 0.012 * s, 8, 5, COL.fat));
    return b;
  }

  function buildUber(b) {
    b.push(M4.rotZ(PI / 2));
    b.prism(20, 0.034, 0.034, -0.03, 0.034, 0.034, 0.03, COL.metalLt, { capBottom: true });
    b.pop();
    b.push(M4.translate(0, 0.034, 0));
    b.prism(16, 0.016, 0.016, 0, 0.016, 0.016, 0.02, COL.white);
    b.prism(16, 0.02, 0.02, 0.02, 0.02, 0.02, 0.034, COL.red);
    b.prism(16, 0.016, 0.016, 0.034, 0.016, 0.016, 0.044, COL.white);
    b.pop();
    [-1, 1].forEach(s => {
      const loop = [];
      for (let i = 0; i <= 10; i++) {
        const a = lerp(-0.3, PI + 0.3, i / 10);
        loop.push([s * (0.036 + 0.012 * S(a)), 0.012 * C(a), 0.026 * C(a * 0.5) - 0.01]);
      }
      K.tube(b, loop, loop.map(() => 0.0035), 5, COL.brass);
    });
    K.tube(b, [[0.02, -0.03, -0.02], [0.03, -0.06, -0.01], [0.012, -0.08, 0.01]], [0.004, 0.004, 0.004], 5, COL.brass);
    K.tube(b, [[-0.02, -0.03, -0.02], [-0.034, -0.065, -0.012], [-0.02, -0.085, 0.006]], [0.004, 0.004, 0.004], 5, COL.copper);
    return b;
  }

  function buildSaw(b) {
    b.at(0, 0, 0, h => h.box(0.03, 0.12, 0.034, COL.red));
    b.at(0, 0.065, 0, h => h.box(0.05, 0.014, 0.05, COL.metalDk));
    b.push(M4.translate(0, 0.07, 0));
    b.at(0.0, 0.14, 0.0, h => h.box(0.004, 0.27, 0.07, COL.metalLt));
    b.at(0.0, 0.14, -0.04, h => h.box(0.01, 0.27, 0.014, COL.metal));
    for (let i = 0; i < 18; i++) {
      const y = 0.01 + i * 0.015;
      b.tri([0.002, y, 0.035], [0.002, y + 0.015, 0.035], [0.002, y + 0.0075, 0.047], COL.metalLt);
      b.tri([-0.002, y, 0.035], [-0.002, y + 0.0075, 0.047], [-0.002, y + 0.015, 0.035], COL.metalLt);
    }
    b.pop();
    return b;
  }

  function buildFridge(b) {
    const W = 0.74, H = 1.5, Dp = 0.66;
    b.at(0, H / 2, -Dp / 2, h => h.box(W, H, 0.04, COL.fridge));
    [-1, 1].forEach(s => b.at(s * (W / 2 - 0.02), H / 2, 0, h => h.box(0.04, H, Dp, COL.fridge)));
    b.at(0, 0.04, 0, h => h.box(W, 0.08, Dp, COL.fridgeDk));
    b.push(M4.translate(0, H, -Dp / 2 + 0.02), M4.rotX(PI / 2));
    b.prism(24, W / 2, 0.2, 0, W / 2, 0.2, Dp - 0.02, COL.fridge, { capTop: true, capBottom: true, skip: [0, 1, 2, 3, 4, 5, 18, 19, 20, 21, 22, 23].map(i => (i + 6) % 24) });
    b.pop();
    b.at(0, H - 0.04, 0, h => h.box(W - 0.08, 0.04, Dp - 0.06, rgb(0xfcfcf0, 0.9)));
    [0.42, 0.78, 1.12].forEach(y => {
      for (let i = 0; i < 12; i++) b.at(-W / 2 + 0.06 + i * 0.056, y, 0, h => h.box(0.006, 0.006, Dp - 0.1, COL.metalLt));
      b.at(0, y, Dp / 2 - 0.06, h => h.box(W - 0.08, 0.012, 0.012, COL.metalLt));
      b.at(0, y, -Dp / 2 + 0.06, h => h.box(W - 0.08, 0.012, 0.012, COL.metalLt));
    });
    b.push(M4.translate(0, 0.95, -Dp / 2 + 0.03));
    K.discXY(b, 0, 0, 0, 0.26, 28, rgb(0x9a9a92));
    for (let i = 0; i < 6; i++) K.tube(b, (() => { const pts = []; for (let k = 0; k <= 24; k++) { const a = (k / 24) * PI * 2; pts.push([C(a) * (0.05 + i * 0.04), S(a) * (0.05 + i * 0.04), 0.01]); } return pts; })(), new Array(25).fill(0.004), 4, COL.metalLt);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * PI * 2;
      K.tube(b, [[0, 0, 0.012], [C(a) * 0.25, S(a) * 0.25, 0.012]], [0.004, 0.004], 4, COL.metalLt);
    }
    b.pop();
    return b;
  }

  function buildFridgeDoor(b) {
    const W = 0.74, H = 1.5;
    b.at(W / 2, H / 2, 0.02, h => h.box(W, H - 0.1, 0.06, COL.fridge));
    b.at(W - 0.06, H * 0.6, 0.07, h => h.box(0.03, 0.3, 0.03, COL.metalLt));
    b.at(W / 2, H / 2, -0.03, h => h.box(W - 0.1, H - 0.2, 0.04, COL.fridgeDk));
    [0.5, 0.9, 1.2].forEach(y => b.at(W / 2, y, -0.08, h => h.box(W - 0.14, 0.08, 0.06, COL.fridgeDk)));
    return b;
  }

  function buildBottle(b) {
    b.prism(12, 0.032, 0.032, 0, 0.032, 0.032, 0.17, COL.bottle, { capBottom: true });
    b.at(0, 0.17, 0, h => h.ellipsoid(0.032, 0.03, 0.032, 12, 6, COL.bottle));
    b.prism(10, 0.012, 0.012, 0.19, 0.012, 0.012, 0.26, COL.bottle);
    return b;
  }

  function buildCan(b) {
    b.prism(16, 0.033, 0.033, 0, 0.033, 0.033, 0.12, 0xe8c430, { capBottom: true, capTop: true });
    return b;
  }

  function buildDish(b) {
    b.prism(20, 0.12, 0.09, 0, 0.14, 0.11, 0.035, 0xd8e0dc, { capBottom: true, capTop: false });
    return b;
  }

  function buildSandwich(b) {
    b.prism(18, 0.13, 0.13, 0, 0.13, 0.13, 0.012, COL.white, { capBottom: true });
    b.at(0, 0.03, 0, h => h.box(0.16, 0.022, 0.1, 0xd8b070));
    b.at(0, 0.047, 0, h => h.box(0.165, 0.014, 0.105, 0x6a9a3a));
    b.at(0, 0.062, 0, h => h.box(0.16, 0.022, 0.1, 0xd8b070));
    return b;
  }

  function buildSpyHead(b) {
    K.spherePatch(b, 0.085, 0.112, 0.098, -PI, PI, -PI / 2, PI / 2, 24, 14, rgb(0xffffff), [1, 1]);
    b.at(0, -0.01, 0.094, h => h.ellipsoid(0.017, 0.03, 0.022, 10, 6, COL.mask));
    b.at(0, -0.12, -0.01, h => h.prism(16, 0.055, 0.05, -0.08, 0.055, 0.05, 0.03, COL.mask, { capBottom: true }));
    [-1, 1].forEach(s => b.at(s * 0.084, 0.0, -0.005, h => h.ellipsoid(0.012, 0.03, 0.022, 8, 6, COL.mask)));
    return b;
  }

  function paintSpyMask(ctx, W, H) {
    ctx.fillStyle = '#34436a';
    ctx.fillRect(0, 0, W, H);
    const P = (a, p) => [(a + PI) / (2 * PI) * W, (1 - (p + PI / 2) / PI) * H];
    ctx.fillStyle = '#dca688';
    ctx.beginPath();
    ctx.ellipse(...P(0, 0.2), W * 0.1, H * 0.07, 0, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(...P(0, -0.52), W * 0.075, H * 0.11, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22304e';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#22304e';
    ctx.beginPath();
    ctx.ellipse(...P(0, 0.2), W * 0.1, H * 0.07, 0, 0, PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(...P(0, -0.52), W * 0.075, H * 0.11, 0, 0, PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#2a1e1a';
    [-1, 1].forEach(s => {
      const [x, y] = P(s * 0.3, 0.32);
      ctx.fillRect(x - W * 0.035, y - 3, W * 0.07, 6);
    });
    const [mx, my] = P(0, -0.5);
    ctx.fillStyle = '#7a3a34';
    ctx.fillRect(mx - W * 0.04, my - 2, W * 0.08, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 40; i++) ctx.fillRect(0, i * H / 40, W, 1);
  }

  function buildEye(b) {
    b.ellipsoid(0.011, 0.011, 0.008, 10, 6, 0xeeeae2);
    b.at(0, 0, 0.007, h => h.ellipsoid(0.005, 0.005, 0.002, 8, 4, 0x3a5a8a));
    b.at(0, 0, 0.0085, h => h.ellipsoid(0.0025, 0.0025, 0.001, 6, 3, 0x0a0a0a));
    return b;
  }

  function buildCig(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(8, 0.0045, 0.0045, 0, 0.0045, 0.0045, 0.06, COL.white, { capBottom: true });
    b.prism(8, 0.0045, 0.0045, 0.06, 0.0045, 0.0045, 0.066, rgb(0xff7a30, 1));
    b.pop();
    return b;
  }

  function buildDoveBody(b, bloody) {
    const red = (p, region) => (bloody && region(p) ? COL.blood : COL.dove);
    b.push(M4.rotX(-0.32));
    b.ellipsoid(0.044, 0.046, 0.1, 16, 10, COL.dove, { colorAt: (p) => red(p, q => q[2] > 0.02 && q[1] < 0.015) });
    b.at(0, -0.008, 0.045, h => h.ellipsoid(0.042, 0.046, 0.05, 14, 8, COL.dove, { colorAt: (p) => red(p, q => q[1] < 0.03) }));
    b.pop();
    b.at(0, 0.062, 0.072, h => h.ellipsoid(0.024, 0.032, 0.026, 12, 8, COL.dove, { colorAt: (p) => red(p, q => q[2] > 0.004) }));
    b.at(0, 0.084, 0.088, h => h.ellipsoid(0.023, 0.024, 0.03, 12, 8, COL.dove, { colorAt: (p) => red(p, q => q[1] > 0.008 && q[2] > 0) }));
    b.at(0, 0.082, 0.118, h => {
      h.push(M4.rotX(PI / 2 + 0.25));
      h.prism(8, 0.0075, 0.0055, 0, 0.0016, 0.0016, 0.026, COL.beak, { capBottom: true });
      h.pop();
      h.at(0, 0.006, -0.002, q => q.ellipsoid(0.007, 0.004, 0.006, 6, 4, 0xece8e2));
    });
    [-1, 1].forEach(s2 => {
      b.at(s2 * 0.02, 0.09, 0.1, h => h.ellipsoid(0.0045, 0.0055, 0.0045, 6, 4, 0x1a0e0e));
      b.at(s2 * 0.018, -0.05, 0.03, h => h.prism(5, 0.0035, 0.0035, -0.03, 0.0035, 0.0035, 0, COL.beak));
      b.at(s2 * 0.018, -0.08, 0.04, h => h.box(0.012, 0.004, 0.028, COL.beak));
    });
    b.push(M4.translate(0, 0.0, -0.08), M4.rotX(-0.45));
    const tail = [[-0.03, 0, -0.11], [0.03, 0, -0.11], [0.014, 0, 0.0], [-0.014, 0, 0.0]];
    b.quad(tail[0], tail[1], tail[2], tail[3], COL.doveDk, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
    b.quad(tail[3], tail[2], tail[1], tail[0], COL.doveDk, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    b.pop();
    if (bloody) {
      const g = rand(77);
      for (let i = 0; i < 9; i++) {
        const a = g() * PI * 2, y = (g() - 0.3) * 0.06;
        b.at(S(a) * 0.044, y, C(a) * 0.08, h => h.ellipsoid(0.008 + g() * 0.01, 0.006 + g() * 0.008, 0.006, 6, 4, COL.blood));
      }
    }
    return b;
  }

  function buildWing(b, side) {
    const k = side === 'L' ? 1 : -1;
    const pts = [[0, 0, 0.04], [k * 0.08, 0.004, 0.035], [k * 0.17, 0.0, 0.0], [k * 0.2, -0.004, -0.05], [k * 0.12, -0.002, -0.07], [0, 0, -0.05]];
    for (let i = 1; i < pts.length - 1; i++) {
      const up = [0, 1, 0];
      b.tri(pts[0], k > 0 ? pts[i + 1] : pts[i], k > 0 ? pts[i] : pts[i + 1], COL.dove, null, [up, up, up]);
      b.tri(pts[0], k > 0 ? pts[i] : pts[i + 1], k > 0 ? pts[i + 1] : pts[i], COL.doveDk, null, [[0, -1, 0], [0, -1, 0], [0, -1, 0]]);
    }
    return b;
  }

  function buildFoldedWing(b, side) {
    const k = side === 'L' ? 1 : -1;
    b.at(k * 0.038, 0.022, -0.03, h => {
      h.push(M4.rotX(-0.35), M4.rotY(k * 0.1), M4.rotZ(-k * 0.2));
      h.ellipsoid(0.013, 0.036, 0.1, 12, 6, COL.dove);
      h.at(0, -0.006, -0.07, q => q.ellipsoid(0.01, 0.022, 0.06, 10, 5, COL.doveDk));
      h.pop();
    });
    return b;
  }

  const CAV = { a: 0.0, y: 0.22, ra: 0.5, ry: 0.2 };

  function cavPt(u, v, lift) {
    const ang = CAV.a + u * CAV.ra, y = CAV.y + v * CAV.ry;
    return Heavy.torsoSurf(ang, y, lift || 0);
  }

  function cavNormal(u, v) {
    const ang = CAV.a + u * CAV.ra;
    return V3.norm([S(ang), 0.1, C(ang)]);
  }

  function buildHole(b) {
    const n = 28;
    const c = cavPt(0, 0, 0.006);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      b.tri(c, cavPt(C(a0), S(a0), 0.006), cavPt(C(a1), S(a1), 0.006), 0xffffff);
    }
    return b;
  }

  function buildBowl(b) {
    const nr = 8, na = 28;
    const pt = (rr, a) => {
      const u = C(a) * rr, v = S(a) * rr;
      const s = cavPt(u, v, 0);
      const n = cavNormal(u, v);
      const depth = 0.1 * (1 - rr * rr) + 0.012;
      return V3.add(s, V3.mul(n, -depth));
    };
    for (let j = 0; j < nr; j++) {
      for (let i = 0; i < na; i++) {
        const r0 = j / nr, r1 = (j + 1) / nr, a0 = (i / na) * PI * 2, a1 = ((i + 1) / na) * PI * 2;
        const q = [pt(r0, a0), pt(r0, a1), pt(r1, a1), pt(r1, a0)];
        const sh = (r) => rgb([lerp(0.32, 0.6, r), lerp(0.06, 0.16, r), lerp(0.1, 0.18, r)]);
        b.quad(q[0], q[1], q[2], q[3], [sh(r0), sh(r0), sh(r1), sh(r1)], [[C(a0) * r0 * 0.5 + 0.5, S(a0) * r0 * 0.5 + 0.5], [C(a1) * r0 * 0.5 + 0.5, S(a1) * r0 * 0.5 + 0.5], [C(a1) * r1 * 0.5 + 0.5, S(a1) * r1 * 0.5 + 0.5], [C(a0) * r1 * 0.5 + 0.5, S(a0) * r1 * 0.5 + 0.5]]);
      }
    }
    return b;
  }

  function buildOrgans(b) {
    const place = (u, v, d, fn) => {
      const s = cavPt(u, v, 0);
      const n = cavNormal(u, v);
      const p = V3.add(s, V3.mul(n, -d));
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(Math.atan2(n[0], n[2])));
      fn(b);
      b.pop();
    };
    const g = rand(301);
    for (let i = 0; i < 16; i++) {
      const u = (g() - 0.5) * 1.1, v = -0.7 + g() * 0.7;
      place(u, v, 0.05 + g() * 0.02, h => lump(h, 300 + i, 0.026 + g() * 0.02, 0.018 + g() * 0.012, 0.024, 10, 6, g() < 0.5 ? 0x9a4a6a : 0x7a3050, 0.25));
    }
    [-1, 1].forEach(s => place(s * 0.55, 0.25, 0.04, h => lump(h, 320 + s, 0.05, 0.08, 0.04, 12, 8, 0xc06a78, 0.18)));
    place(-0.1, 0.45, 0.045, h => lump(h, 330, 0.06, 0.04, 0.04, 12, 7, 0x6a1a22, 0.15));
    return b;
  }

  function buildRim(b) {
    const n = 40;
    const g = rand(311);
    const jag = [];
    for (let i = 0; i <= n; i++) jag.push(i === n ? jag[0] : 0.08 + g() * 0.12);
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const o0 = cavPt(C(a0) * (1 + jag[i]), S(a0) * (1 + jag[i]), 0.004), o1 = cavPt(C(a1) * (1 + jag[i + 1]), S(a1) * (1 + jag[i + 1]), 0.004);
      const m0 = cavPt(C(a0) * 1.02, S(a0) * 1.02, 0.022), m1 = cavPt(C(a1) * 1.02, S(a1) * 1.02, 0.022);
      const i0 = cavPt(C(a0) * 0.93, S(a0) * 0.93, 0.012), i1 = cavPt(C(a1) * 0.93, S(a1) * 0.93, 0.012);
      const d0 = cavPt(C(a0) * 0.88, S(a0) * 0.88, -0.03), d1 = cavPt(C(a1) * 0.88, S(a1) * 0.88, -0.03);
      b.quad(o0, o1, m1, m0, [rgb(COL.shirt), rgb(COL.shirt), rgb(0xd88878), rgb(0xd88878)]);
      b.quad(m0, m1, i1, i0, [rgb(0xd88878), rgb(0xd88878), rgb(COL.blood), rgb(COL.blood)]);
      b.quad(i0, i1, d1, d0, COL.blood);
    }
    [-1, 1].forEach(s => {
      for (let i = 0; i < 6; i++) {
        const v = -0.62 + i * 0.26;
        const u = s * Math.sqrt(Math.max(0.02, 1 - v * v)) * 0.98;
        const base = cavPt(u, v, 0.0);
        const n = cavNormal(u, v);
        const outw = V3.norm(V3.add(V3.mul(n, 1), [s * 0.5 * C(CAV.a + u * CAV.ra), 0, 0]));
        const tip = V3.add(base, V3.add(V3.mul(outw, 0.075 + (i % 2) * 0.012), [0, 0.006, 0]));
        K.tube(b, [V3.add(base, V3.mul(n, -0.02)), V3.lerp(base, tip, 0.6), tip], [0.011, 0.01, 0.008], 6, COL.rib);
      }
    });
    for (let i = 0; i < 10; i++) {
      const a = g() * PI * 2, rr = 1.05 + g() * 0.3;
      const p = cavPt(C(a) * rr, S(a) * rr, 0.006);
      b.at(p[0], p[1], p[2], h => h.ellipsoid(0.012 + g() * 0.02, 0.01 + g() * 0.015, 0.006, 8, 4, COL.blood));
    }
    return b;
  }

  function buildRock(b, seed, flat) {
    const g = rand(seed);
    const nu = 9, nv = 6;
    const R = [];
    for (let j = 0; j <= nv; j++) {
      const row = [];
      for (let i = 0; i <= nu; i++) row.push(i === nu ? null : 0.75 + g() * 0.5);
      row[nu] = row[0];
      R.push(row);
    }
    const pt = (i, j) => {
      const yaw = (i / nu) * PI * 2, pit = -PI / 2 + (j / nv) * PI;
      const r = j === 0 || j === nv ? 0.85 : R[j][i];
      return [S(yaw) * C(pit) * r, Math.max(-0.2, S(pit)) * r * (flat || 0.7), C(yaw) * C(pit) * r];
    };
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const sh = 0.85 + g() * 0.3;
        const c = rgb(COL.rock);
        b.quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), [c[0] * sh, c[1] * sh, c[2] * sh, 0]);
      }
    }
    return b;
  }

  function buildTree(b) {
    const g = rand(401);
    const branch = (p, dir, len, r, depth) => {
      const end = V3.add(p, V3.mul(dir, len));
      K.tube(b, [p, end], [r, r * 0.7], 6, 0x2a2420);
      if (depth <= 0) return;
      const n = depth > 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const d = V3.norm(V3.add(dir, [(g() - 0.5) * 1.4, 0.2 + g() * 0.4, (g() - 0.5) * 1.0]));
        branch(end, d, len * (0.55 + g() * 0.2), r * 0.6, depth - 1);
      }
    };
    branch([0, 0, 0], [0.05, 1, 0], 1.6, 0.11, 4);
    return b;
  }

  function buildCrow(b) {
    b.ellipsoid(0.05, 0.055, 0.11, 12, 8, COL.crow);
    b.at(0, 0.06, 0.09, h => h.ellipsoid(0.034, 0.034, 0.04, 10, 6, COL.crow));
    b.at(0, 0.058, 0.135, h => { h.push(M4.rotX(PI / 2 - 0.2)); h.prism(6, 0.01, 0.008, 0, 0.002, 0.002, 0.04, 0x3a3434, { capBottom: true }); h.pop(); });
    b.push(M4.translate(0, 0.01, -0.1), M4.rotX(-0.35));
    b.box(0.06, 0.008, 0.12, COL.crow);
    b.pop();
    [-1, 1].forEach(s => b.at(s * 0.02, -0.07, 0.01, h => h.prism(4, 0.004, 0.004, -0.04, 0.004, 0.004, 0, 0x2a2424)));
    return b;
  }

  function buildBomb(b) {
    b.ellipsoid(0.07, 0.07, 0.07, 14, 10, 0x1e1e22);
    b.at(0, 0.07, 0, h => h.prism(8, 0.018, 0.018, 0, 0.018, 0.018, 0.025, 0x3a3a3e));
    K.tube(b, [[0, 0.095, 0], [0.01, 0.12, 0.004], [0.02, 0.135, 0.01]], [0.004, 0.004, 0.004], 4, 0xc8b080);
    return b;
  }

  function buildChair(b) {
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => K.tube(b, [[sx * 0.2, 0, sz * 0.18], [sx * 0.21, 0.44, sz * 0.19]], [0.01, 0.01], 5, COL.metalDk)));
    b.push(M4.translate(0, 0.46, 0.02));
    b.box(0.46, 0.03, 0.42, COL.chair);
    b.at(0, -0.02, 0, h => h.box(0.44, 0.012, 0.4, COL.chairDk));
    b.pop();
    b.push(M4.translate(0, 0.72, -0.2), M4.rotX(-0.12));
    b.box(0.46, 0.34, 0.03, COL.chair);
    b.pop();
    return b;
  }

  function buildDispenser(b) {
    b.box(0.16, 0.22, 0.08, 0xa8282a);
    b.at(0, 0.03, 0.041, h => h.box(0.1, 0.08, 0.004, 0xe8e0d6));
    b.at(0.1, 0.0, 0.02, h => h.box(0.04, 0.02, 0.02, COL.metalDk));
    return b;
  }

  function buildGurneyDoor(b) {
    b.at(0, 1.05, 0, h => h.box(0.72, 2.1, 0.05, 0x8ec2b0));
    b.at(0, 1.4, 0.03, h => K.discXY(h, 0, 0, 0, 0.13, 20, rgb(0x6a8a80)));
    b.at(0, 1.4, 0.032, h => K.discXY(h, 0, 0, 0, 0.11, 20, rgb(0x2a3a36, 0.15)));
    b.at(0, 0.5, 0.03, h => h.box(0.6, 0.3, 0.008, 0x7aa898));
    return b;
  }

  function buildLamp(b) {
    K.tube(b, [[0, 1.0, 0], [0, 0.35, 0], [0.05, 0.12, 0]], [0.03, 0.03, 0.03], 8, COL.metal);
    b.push(M4.translate(0.05, 0.06, 0));
    b.prism(32, 0.36, 0.36, -0.08, 0.38, 0.38, 0.05, COL.metal, { capTop: true });
    b.prism(32, 0.36, 0.36, -0.1, 0.36, 0.36, -0.08, COL.metalDk, { capBottom: true });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2 + 0.3;
      b.at(C(a) * 0.21, -0.11, S(a) * 0.21, h => h.ellipsoid(0.09, 0.03, 0.09, 16, 6, rgb(0xfff8ea, 1)));
    }
    b.at(0, -0.11, 0, h => h.ellipsoid(0.06, 0.025, 0.06, 12, 5, rgb(0xfff8ea, 1)));
    b.pop();
    return b;
  }

  function buildXrayBox(b) {
    b.box(0.62, 0.78, 0.06, COL.metalDk);
    b.at(0, 0, 0.032, h => quadMesh(h, 0.58, 0.74, rgb(0xffffff, 0.92)));
    return b;
  }

  function buildMonitor(b) {
    b.at(0, 0, 0, h => h.box(0.42, 0.34, 0.32, 0x8a8e86));
    b.at(0, 0.0, 0.162, h => quadMesh(h, 0.32, 0.24, rgb(0xffffff, 0.85)));
    b.at(0, -0.42, 0, h => h.prism(8, 0.03, 0.03, -0.6, 0.03, 0.03, 0.25, COL.metal));
    b.at(0, -1.02, 0, h => h.box(0.4, 0.04, 0.4, COL.metalDk));
    return b;
  }

  function buildTray(b) {
    b.at(0, 0.82, 0, h => h.box(0.6, 0.02, 0.4, COL.metalLt));
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => b.at(sx * 0.27, 0.41, sz * 0.17, h => h.box(0.02, 0.82, 0.02, COL.metal))));
    b.at(-0.1, 0.84, 0.05, h => h.box(0.16, 0.006, 0.02, COL.metalLt));
    b.at(0.1, 0.84, -0.06, h => h.box(0.12, 0.006, 0.012, COL.metalLt));
    return b;
  }

  function buildJar(b, seed) {
    const g = rand(seed);
    const h0 = 0.18 + g() * 0.12, r0 = 0.07 + g() * 0.05;
    b.prism(14, r0 * 0.7, r0 * 0.7, 0, r0, r0, h0 * 0.5, 0xb86a3a, { capBottom: true });
    b.prism(14, r0, r0, h0 * 0.5, r0 * 0.55, r0 * 0.55, h0, 0xa85a30);
    b.prism(14, r0 * 0.55, r0 * 0.55, h0, r0 * 0.6, r0 * 0.6, h0 + 0.03, 0x9a5028);
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      cyl: mk(b => unitCyl(b, 0xffffff, 12)),
      table: mk(buildTable),
      labGun: mk(buildLabGun),
      medigun: mk(buildMedigun),
      pack: mk(buildPack),
      meterBox: mk(buildMeterBox),
      plate: mk(b => quadMesh(b, 1, 1)),
      heart: mk(b => buildHeart(b, 1)),
      bigHeart: mk(b => buildHeart(b, 1.45)),
      uber: mk(buildUber),
      needle: mk(b => b.at(0, 0.012, 0, h => h.box(0.003, 0.026, 0.002, 0x1a1414))),
      gaugeDisc: mk(b => K.discXY(b, 0, 0, 0, 0.5, 28, rgb(0xffffff))),
      saw: mk(buildSaw),
      fridge: mk(buildFridge),
      fridgeDoor: mk(buildFridgeDoor),
      bottle: mk(buildBottle),
      can: mk(buildCan),
      dish: mk(buildDish),
      sandwich: mk(buildSandwich),
      spyHead: mk(buildSpyHead),
      spyTex: r.texture(256, paintSpyMask, { height: 128, clamp: true }),
      eye: mk(buildEye),
      cig: mk(buildCig),
      dove: mk(b => buildDoveBody(b, false)),
      doveBloody: mk(b => buildDoveBody(b, true)),
      wingL: mk(b => buildWing(b, 'L')),
      wingR: mk(b => buildWing(b, 'R')),
      foldL: mk(b => buildFoldedWing(b, 'L')),
      foldR: mk(b => buildFoldedWing(b, 'R')),
      hole: mk(buildHole),
      bowl: mk(buildBowl),
      organs: mk(buildOrgans),
      rim: mk(buildRim),
      rocks: [11, 12, 13, 14].map(s => mk(b => buildRock(b, s, 0.7))),
      slabs: [21, 22].map(s => mk(b => buildRock(b, s, 0.35))),
      tree: mk(buildTree),
      crow: mk(buildCrow),
      chair: mk(buildChair),
      bomb: mk(buildBomb),
      dispenser: mk(buildDispenser),
      door: mk(buildGurneyDoor),
      lamp: mk(buildLamp),
      xray: mk(buildXrayBox),
      monitor: mk(buildMonitor),
      tray: mk(buildTray),
      jars: [31, 32, 33].map(s => mk(b => buildJar(b, s)))
    };
  }

  function drawCyl(fx, PR, a, b2, r, opts) {
    fx.draw(PR.cyl, alongM(a, b2, r), opts);
  }

  function drawLabGun(fx, PR, g, T) {
    const mount = g.mount;
    const elbow = g.elbow;
    const rear = M4.point(g.M, [0, 0.0, -0.34]);
    const tint = g.tint ? { tint: g.tint } : {};
    drawCyl(fx, PR, mount, elbow, 0.04, Object.assign({}, METAL, tint));
    drawCyl(fx, PR, elbow, rear, 0.035, Object.assign({}, METAL, tint));
    fx.draw(PR.labGun, g.M, Object.assign({}, PAINT, tint));
  }

  function heartM(M, beat) {
    const k = 1 + 0.06 * Math.max(0, S(beat * PI * 2)) * Math.max(0, S(beat * PI * 2));
    return M4.mul(M, M4.scale(k, k, k));
  }

  function drawHeart(fx, PR, h, T) {
    const M = heartM(h.M, h.beat || 0);
    const glow = h.glow || 0;
    fx.draw(h.big ? PR.bigHeart : PR.heart, M, Object.assign({ texture: T('heartSkin'), tint: [1 + glow * 0.6, 1 + glow * 0.2, 1 + glow * 0.2] }, WET));
    if (h.uber !== undefined) {
      const U = M4.mul(h.M, h.uberM || M4.translate(0.02, h.big ? 0.16 : 0.11, 0));
      drawUber(fx, PR, U, h.uber, T);
    }
  }

  function drawUber(fx, PR, U, needle, T) {
    fx.draw(PR.uber, U, METAL);
    fx.draw(PR.gaugeDisc, M4.chain(U, M4.translate(0, 0, 0.0345), M4.scale(0.062, 0.062, 1)), { texture: T('gauge'), spec: [0.6, 30], rim: 0.2 });
    fx.draw(PR.needle, M4.chain(U, M4.translate(0, 0, 0.036), M4.rotZ(lerp(2.2, -2.0, clamp(needle, 0, 1)))), { spec: [0.2, 8] });
  }

  function drawMeter(fx, PR, M, level, lit, T) {
    fx.draw(PR.meterBox, M, PAINT);
    fx.draw(PR.plate, M4.chain(M, M4.translate(0, 0.016, 0.026), M4.scale(0.11, 0.07, 1)), { texture: T('meterFace'), spec: [0.5, 30], rim: 0.1 });
    const pivot = M4.chain(M, M4.translate(0, -0.016, 0.028), M4.rotZ(lerp(1.35, -1.35, clamp(level, 0, 1))), M4.scale(1.6, 1.8, 1));
    fx.draw(PR.needle, pivot, { spec: [0.2, 8] });
    fx.draw(PR.plate, M4.chain(M, M4.translate(0, -0.035, 0.0285), M4.scale(0.09, 0.024, 1)), { texture: T(lit ? 'lampOn' : 'lampOff'), noFog: true, spec: [0, 1], rim: 0, tint: lit ? [1.6, 1.6, 1.6] : [1, 1, 1] });
  }

  function drawPack(fx, PR, chest, o, T) {
    const P = M4.mul(chest, M4.chain(M4.translate(0, 0.02, -0.22)));
    const tint = o && o.tint ? { tint: o.tint } : {};
    fx.draw(PR.pack, P, Object.assign({}, PAINT, tint));
    if (o && o.meter !== undefined) drawMeter(fx, PR, M4.chain(P, M4.translate(0.19, 0.26, 0.0), M4.rotY(PI / 2)), o.meter, o.lit, T);
    return P;
  }

  function drawDove(fx, PR, d) {
    const M = M4.mul(d.M, M4.scale(1.45, 1.45, 1.45));
    const tint = d.tint ? { tint: d.tint } : {};
    const mat = Object.assign({ spec: [0.15, 10], rim: 0.9 }, tint);
    fx.draw(d.bloody ? PR.doveBloody : PR.dove, M, mat);
    if (d.flap === undefined) {
      fx.draw(PR.foldL, M, mat);
      fx.draw(PR.foldR, M, mat);
    } else {
      const a = d.flap;
      fx.draw(PR.wingL, M4.chain(M, M4.translate(0.03, 0.03, 0.01), M4.rotZ(a)), mat);
      fx.draw(PR.wingR, M4.chain(M, M4.translate(-0.03, 0.03, 0.01), M4.rotZ(-a)), mat);
    }
  }

  function drawSpyHead(fx, PR, M, f) {
    const face = f || {};
    fx.draw(PR.spyHead, M, { texture: PR.spyTex, spec: [0.15, 10], rim: 0.8 });
    const look = face.look || [0, 0];
    [-1, 1].forEach(s => fx.draw(PR.eye, M4.chain(M, M4.translate(s * 0.03, 0.018, 0.084), M4.rotY(look[0]), M4.rotX(-look[1])), { spec: [0.8, 40], rim: 0.2 }));
    const jaw = clamp(face.jaw || 0, 0, 1);
    fx.draw(PR.cig, M4.chain(M, M4.translate(-0.022, -0.052 - jaw * 0.008, 0.088), M4.rotY(-0.5), M4.rotX(0.25 + jaw * 0.2)), { spec: [0.2, 8], rim: 0.4 });
  }

  function grip(kind, side, M) {
    const k = side === 'L' ? 1 : -1;
    if (kind === 'medigun') {
      if (side === 'R') return { pos: M4.point(M, [0, -0.085, -0.075]), fingers: V3.norm(M4.dir(M, [k * -1, -0.2, 0.15])), palm: V3.norm(M4.dir(M, [k * 1, 0, 0])), pose: 'grip' };
      return { pos: M4.point(M, [0, 0.07, 0.07]), fingers: V3.norm(M4.dir(M, [k * 1, 0.1, 0])), palm: V3.norm(M4.dir(M, [0, -1, 0])), pose: 'grip' };
    }
    if (kind === 'saw') return { pos: M4.point(M, [0, -0.02, 0]), fingers: V3.norm(M4.dir(M, [k * -1, 0, 0.2])), palm: V3.norm(M4.dir(M, [0, 0, -1])), pose: 'grip' };
    if (kind === 'heart') return { pos: M4.point(M, [k * 0.06, -0.02, 0.0]), fingers: V3.norm(M4.dir(M, [k * -0.5, 0.6, 0.4])), palm: V3.norm(M4.dir(M, [k * -1, 0.2, 0])), pose: 'cup' };
    return { pos: M4.point(M, [0, 0, 0]), fingers: V3.norm(M4.dir(M, [0, 0, 1])), palm: V3.norm(M4.dir(M, [0, -1, 0])), pose: 'pinch' };
  }

  window.MedProps = { COL, METAL, PAINT, WET, build, alongM, aimM, basisM, drawCyl, drawLabGun, drawHeart, drawUber, drawMeter, drawPack, drawDove, drawSpyHead, heartM, grip, CAV, cavPt, cavNormal };
})();
