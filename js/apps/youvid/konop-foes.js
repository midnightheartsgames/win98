(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;
  const KW = window.KonopWorld;
  const { boxAt, ellAt, boulder } = KW;

  function eye(b, pos, r, pupil, look) {
    ellAt(b, pos, r, r, r * 0.7, 10, 8, rgb(0xffffff, 0.5));
    const lk = look || [0, 0];
    ellAt(b, [pos[0] + lk[0] * r * 0.4, pos[1] + lk[1] * r * 0.4, pos[2] + r * 0.62], r * 0.32, r * 0.32, r * 0.12, 8, 6, pupil || 0x1a1418);
  }

  function build(r) {
    const m = (fn) => K.mesh(r, fn);
    const F = {};

    F.trollBody = m(b => {
      ellAt(b, [0, 1.25, 0], 0.62, 0.62, 0.5, 12, 9, 0x5e8e3e);
      ellAt(b, [0, 1.05, 0.22], 0.46, 0.42, 0.34, 10, 8, 0x86b45a);
      ellAt(b, [0, 1.6, -0.25], 0.5, 0.36, 0.38, 10, 7, 0x527e36);
      boxAt(b, [0, 0.72, 0.05], [0.8, 0.26, 0.6], 0x6a4a2a);
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.26, 0.42, 0.04], 0.17, 0.32, 0.17, 8, 6, 0x5e8e3e);
        ellAt(b, [s * 0.28, 0.08, 0.1], 0.16, 0.08, 0.24, 8, 5, 0x4a7430);
      });
    });
    F.trollHead = m(b => {
      ellAt(b, [0, 0, 0], 0.3, 0.26, 0.28, 10, 8, 0x5e8e3e);
      ellAt(b, [0, -0.1, 0.2], 0.26, 0.15, 0.2, 10, 6, rgb(0xd8502a, 0.2));
      ellAt(b, [0, -0.06, 0.26], 0.2, 0.08, 0.1, 8, 5, rgb(0x6a1410, 0.2));
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.11, -0.02, 0.33));
        b.prism(5, 0.025, 0.025, 0, 0.004, 0.004, 0.07, 0xf4f0e0);
        b.pop();
        ellAt(b, [s * 0.11, 0.1, 0.22], 0.05, 0.035, 0.03, 8, 5, rgb(0xff3020, 1));
        ellAt(b, [s * 0.11, 0.155, 0.2], 0.08, 0.02, 0.03, 6, 4, 0x2e4a1e, M4.rotZ(s * 0.4));
      });
    });
    F.trollArm = m(b => {
      ellAt(b, [0, -0.25, 0], 0.15, 0.3, 0.15, 8, 6, 0x5e8e3e);
      ellAt(b, [0, -0.62, 0.04], 0.13, 0.26, 0.13, 8, 6, 0x5e8e3e);
      ellAt(b, [0, -0.9, 0.06], 0.14, 0.12, 0.14, 8, 6, 0x4e7a32);
    });
    F.mace = m(b => {
      b.push(M4.rotX(PI / 2));
      b.prism(6, 0.035, 0.035, -0.1, 0.035, 0.035, 0.6, 0x6a4a2a);
      b.pop();
      ellAt(b, [0, 0, 0.72], 0.14, 0.14, 0.14, 8, 6, 0x3a3a40);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * PI * 2, e = (i % 2 ? 0.5 : -0.4);
        b.push(M4.translate(0, 0, 0.72), M4.rotY(a), M4.rotX(e));
        b.prism(4, 0.035, 0.035, 0.12, 0.002, 0.002, 0.24, 0x8a8a92);
        b.pop();
      }
    });

    F.owlBody = m(b => {
      ellAt(b, [0, 0, 0], 0.17, 0.15, 0.15, 10, 8, 0x6a4a9a);
      ellAt(b, [0, -0.02, 0.06], 0.13, 0.11, 0.1, 8, 6, 0x9a7ac0);
      eye(b, [-0.06, 0.04, 0.12], 0.045, 0x1a1418);
      eye(b, [0.06, 0.04, 0.12], 0.045, 0x1a1418);
      b.push(M4.translate(0, -0.03, 0.15), M4.rotX(0.5));
      b.prism(4, 0.04, 0.03, 0, 0.003, 0.003, 0.09, rgb(0xf4d050, 0.2));
      b.pop();
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.08, 0.13, 0), M4.rotZ(-s * 0.4));
        b.prism(4, 0.03, 0.03, 0, 0.002, 0.002, 0.09, 0x4a2a7a);
        b.pop();
      });
    });
    F.owlWing = m(b => {
      b.quad([0, 0, 0.06], [0.42, 0.04, 0.02], [0.36, -0.06, -0.06], [0, -0.04, -0.08], 0x5a3a8a);
      b.tri([0.2, 0.0, -0.06], [0.36, -0.06, -0.06], [0.28, -0.14, -0.04], 0x4a2a7a);
    });

    F.ghost = m(b => {
      ellAt(b, [0, 0, 0], 0.12, 0.14, 0.1, 10, 8, rgb(0xe8f4ff, 0.75));
      b.push(M4.translate(0, -0.1, -0.02), M4.rotX(0.3));
      b.prism(8, 0.1, 0.08, 0, 0.01, 0.01, -0.22, rgb(0xd8ecff, 0.7), { capTop: false });
      b.pop();
      ellAt(b, [-0.04, 0.03, 0.09], 0.018, 0.026, 0.01, 6, 4, 0x1a1a2a);
      ellAt(b, [0.04, 0.03, 0.09], 0.018, 0.026, 0.01, 6, 4, 0x1a1a2a);
      ellAt(b, [0, -0.04, 0.095], 0.02, 0.012, 0.008, 6, 4, 0x3a3a5a);
    });

    F.rabbit = m(b => {
      ellAt(b, [0, 0.1, 0], 0.11, 0.1, 0.14, 8, 6, 0xa87a5a);
      ellAt(b, [0, 0.2, 0.12], 0.07, 0.07, 0.07, 8, 6, 0xb88a6a);
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.03, 0.26, 0.1), M4.rotZ(-s * 0.15));
        b.ellipsoid(0.02, 0.1, 0.012, 6, 5, 0xa87a5a);
        b.pop();
        ellAt(b, [s * 0.035, 0.22, 0.18], 0.012, 0.014, 0.008, 5, 4, 0x1a1414);
      });
      ellAt(b, [0, 0.12, -0.14], 0.04, 0.04, 0.04, 6, 4, 0xf4ece4);
    });

    F.minoBody = m(b => {
      ellAt(b, [0, 1.6, 0], 0.62, 0.6, 0.42, 12, 9, 0x2e221e);
      ellAt(b, [0, 1.15, 0.05], 0.45, 0.42, 0.34, 10, 8, 0x3a2a24);
      boxAt(b, [0, 0.82, 0.02], [0.7, 0.3, 0.5], 0x4a3020);
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.55, 2.0, 0], 0.3, 0.2, 0.3, 8, 6, 0x6a6e78);
        ellAt(b, [s * 0.24, 0.45, 0.04], 0.19, 0.42, 0.19, 8, 6, 0x2e221e);
        ellAt(b, [s * 0.26, 0.08, 0.1], 0.16, 0.08, 0.26, 8, 5, 0x1a1210);
      });
    });
    F.minoHead = m(b => {
      ellAt(b, [0, 0, 0], 0.3, 0.3, 0.32, 10, 8, 0x2e221e);
      ellAt(b, [0, -0.12, 0.25], 0.2, 0.15, 0.17, 8, 6, 0x3e2e26);
      ellAt(b, [0, -0.08, 0.36], 0.14, 0.08, 0.06, 8, 5, rgb(0x5a0c0c, 0.3));
      [-1, 1].forEach(s => {
        ellAt(b, [s * 0.13, 0.06, 0.26], 0.06, 0.04, 0.03, 8, 5, rgb(0xff2a14, 1));
        K.tube(b, [[s * 0.22, 0.14, 0], [s * 0.48, 0.24, 0.05], [s * 0.6, 0.46, 0.16], [s * 0.52, 0.62, 0.3]], [0.07, 0.055, 0.035, 0.01], 7, 0xe8dcc0);
      });
    });
    F.minoArm = m(b => {
      ellAt(b, [0, -0.3, 0], 0.18, 0.34, 0.18, 8, 6, 0x2e221e);
      ellAt(b, [0, -0.72, 0.04], 0.16, 0.3, 0.16, 8, 6, 0x2e221e);
      boxAt(b, [0, -0.7, 0.04], [0.36, 0.2, 0.36], 0x5a5e68);
      ellAt(b, [0, -1.02, 0.06], 0.16, 0.13, 0.16, 8, 6, 0x221a16);
    });
    F.axe = m(b => {
      b.push(M4.rotX(PI / 2));
      b.prism(6, 0.04, 0.04, -0.2, 0.04, 0.04, 1.1, 0x4a3020);
      b.pop();
      b.quad([0, 0, 0.75], [0.5, 0, 0.6], [0.55, 0, 1.15], [0, 0, 1.08], rgb(0xb8bcc4, 0.2));
    });

    F.golem = m(b => {
      const dark = 0x2a2a30, mid = 0x3a3a42, edge = 0x50505a;
      ellAt(b, [0, 5.2, -1.0], 3.8, 2.6, 2.6, 12, 8, dark);
      ellAt(b, [0, 4.4, 1.0], 2.8, 2.0, 1.8, 10, 7, mid);
      ellAt(b, [0, 5.0, 2.6], 1.6, 1.2, 1.2, 10, 7, dark);
      [-1, 1].forEach(s => {
        ellAt(b, [s * 3.6, 5.6, 0.2], 1.6, 1.4, 1.5, 10, 7, mid);
        b.push(M4.translate(s * 4.2, 4.6, 1.0), M4.rotZ(s * 0.25), M4.rotX(-0.35));
        b.prism(8, 1.1, 1.1, -4.6, 0.9, 0.9, 0, dark);
        for (let k = 0; k < 4; k++) b.prism(8, 1.16, 1.16, -1.0 - k * 1.0, 1.16, 1.16, -0.92 - k * 1.0, edge);
        b.pop();
        boulder(b, [s * 5.4, 0.6, 2.8], [1.5, 0.9, 1.6], dark, 2001 + (s > 0 ? 1 : 0), true);
        ellAt(b, [s * 1.6, 1.4, -2.2], 1.0, 1.6, 1.0, 8, 6, dark);
      });
    });
    F.golemEyes = m(b => {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.55, 5.25, 3.72), M4.rotZ(s * 0.25));
        b.quad([-0.38, -0.08, 0], [0.38, -0.08, 0], [0.42, 0.1, 0], [-0.34, 0.1, 0], rgb(0xff1a28, 1));
        b.pop();
      });
    });
    F.golemHead = m(b => {
      boulder(b, [0, 0, 0], [1.4, 1.3, 1.2], 0x5a5a56, 2011, false);
      boxAt(b, [0, 0.1, 1.05], [1.2, 0.2, 0.3], 0x3a3a36);
      ellAt(b, [0.35, 0.12, 1.12], 0.2, 0.12, 0.08, 8, 5, rgb(0xff1a28, 1));
    });

    F.rockBig = m(b => {
      boulder(b, [0, 0.8, 0], [1.0, 0.9, 0.8], 0x6e7c78, 2101, true);
      boulder(b, [-0.75, 0.35, 0.3], [0.45, 0.4, 0.4], 0x627070, 2103, true);
      boulder(b, [0.8, 0.3, 0.2], [0.4, 0.35, 0.35], 0x627070, 2105, true);
    });
    F.rockBigFace = m(b => {
      eye(b, [-0.36, 1.05, 0.66], 0.2, 0x8a1010, [0.1, -0.2]);
      eye(b, [0.38, 1.0, 0.64], 0.22, 0x8a1010, [-0.2, 0.1]);
      const n = 16;
      for (let i = 0; i < n; i++) {
        const a0 = PI * 0.15 + (i / n) * PI * 0.7, a1 = PI * 0.15 + ((i + 1) / n) * PI * 0.7;
        const P = (a, rr) => [C(a) * rr * 1.25, 0.82 - S(a) * rr * 0.55, 0.78];
        b.quad(P(a0, 0.62), P(a1, 0.62), P(a1, 0.46), P(a0, 0.46), rgb(0xd8202a, 0.35));
      }
    });
    F.rockSmall = m(b => {
      boulder(b, [0, 0.3, 0], [0.38, 0.32, 0.32], 0x52565a, 2201, true);
      eye(b, [-0.11, 0.38, 0.27], 0.07, 0x141418);
      eye(b, [0.11, 0.38, 0.27], 0.07, 0x141418);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a0 = PI * 0.2 + (i / n) * PI * 0.6, a1 = PI * 0.2 + ((i + 1) / n) * PI * 0.6;
        const P = (a, rr) => [C(a) * rr, 0.28 - S(a) * rr * 0.6, 0.31];
        b.quad(P(a0, 0.16), P(a1, 0.16), P(a1, 0.1), P(a0, 0.1), rgb(0xd02028, 0.3));
      }
    });

    F.debris = m(b => {
      boulder(b, [0, 0, 0], [0.5, 0.36, 0.42], 0x56645e, 2301, false);
      boulder(b, [0.05, 0.12, 0.05], [0.3, 0.2, 0.26], 0x6a7a72, 2303, false);
    });

    F.shadow = m(b => {
      ellAt(b, [0, 0.6, 0], 0.6, 0.65, 0.5, 9, 7, 0x0c1424);
      ellAt(b, [0, 1.2, 0.1], 0.38, 0.32, 0.32, 8, 6, 0x0e182a);
      ellAt(b, [-0.12, 1.25, 0.38], 0.05, 0.06, 0.02, 6, 4, rgb(0xf0e060, 1));
      ellAt(b, [0.12, 1.25, 0.38], 0.05, 0.06, 0.02, 6, 4, rgb(0xf0e060, 1));
    });

    F.verdia = m(b => {
      const d = 0x1a3260, e = 0x3a6ab0;
      b.push(M4.translate(0, 1.6, 0), M4.rotX(-0.7));
      ellAt(b, [0, 0, 0], 0.55, 0.6, 1.2, 10, 7, d);
      K.tube(b, [[0, 0.3, 0.9], [0, 0.9, 1.3], [0, 1.4, 1.5]], [0.3, 0.26, 0.18], 8, d);
      ellAt(b, [0, 1.5, 1.75], 0.18, 0.2, 0.42, 8, 6, d);
      [-1, 1].forEach(s => {
        K.tube(b, [[s * 0.25, -0.2, 0.9], [s * 0.3, 0.2, 1.5], [s * 0.28, -0.3, 1.9]], [0.1, 0.08, 0.06], 6, d);
        K.tube(b, [[s * 0.25, -0.3, -0.9], [s * 0.3, -1.1, -1.0], [s * 0.28, -1.9, -0.8]], [0.13, 0.09, 0.07], 6, d);
      });
      K.tube(b, [[0, 0.2, -1.2], [0, -0.4, -1.8], [0, -1.0, -1.9]], [0.12, 0.1, 0.04], 6, e);
      b.pop();
      b.push(M4.translate(0, 2.6, -0.3), M4.rotX(-0.35));
      ellAt(b, [0, 0.5, 0], 0.32, 0.5, 0.24, 8, 6, d);
      ellAt(b, [0.35, 0.8, 0], 0.16, 0.16, 0.16, 6, 5, e);
      K.tube(b, [[0.35, 0.8, 0], [0.6, 0.5, 0.3], [0.7, 0.3, 0.6]], [0.09, 0.08, 0.07], 6, d);
      b.pop();
      for (let i = 0; i < 10; i++) {
        const a0 = -1.2 + (i / 10) * 2.4, a1 = -1.2 + ((i + 1) / 10) * 2.4;
        b.quad([S(a0) * 0.4, 3.6, -0.4 + C(a0) * 0.2], [S(a1) * 0.4, 3.6, -0.4 + C(a1) * 0.2], [S(a1) * 2.2, 2.4, -1.6 + C(a1) * 0.6], [S(a0) * 2.2, 2.4, -1.6 + C(a0) * 0.6], e);
      }
    });
    F.verdiaSword = m(b => {
      b.quad([-0.08, 0, 0], [0.08, 0, 0], [0.06, 0, 2.6], [-0.06, 0, 2.6], rgb(0x6ab8ff, 0.9));
      boxAt(b, [0, 0, -0.1], [0.4, 0.05, 0.08], 0x0a1426);
    });

    return F;
  }

  function place(f) {
    const s = f.scale || 1;
    return M4.chain(M4.translate(f.pos[0], f.pos[1], f.pos[2]), M4.rotY(f.yaw || 0), M4.rotX(f.pitch || 0), M4.rotZ(f.roll || 0), M4.scale(s, s, s));
  }

  const DRAW = {
    troll(r, F, f, base) {
      const sw = f.swing || 0, st = f.step || 0;
      r.draw(F.trollBody, M4.chain(base, M4.translate(0, Math.abs(S(st)) * 0.06, 0), M4.rotX(0.25)));
      r.draw(F.trollHead, M4.chain(base, M4.translate(0, 1.85, 0.32), M4.rotX(-0.15 + (f.roar || 0) * 0.2)));
      r.draw(F.trollArm, M4.chain(base, M4.translate(-0.62, 1.55, 0.05), M4.rotZ(-0.35), M4.rotX(-0.4)));
      const arm = M4.chain(base, M4.translate(0.62, 1.6, 0.05), M4.rotZ(0.3 + sw * 0.4), M4.rotX(-2.4 + sw * 1.6));
      r.draw(F.trollArm, arm);
      r.draw(F.mace, M4.chain(arm, M4.translate(0, -0.95, 0.06), M4.rotX(-PI / 2 - 0.3)));
    },
    owl(r, F, f, base) {
      r.draw(F.owlBody, base);
      const fl = S(f.flap || 0) * 0.8;
      r.draw(F.owlWing, M4.chain(base, M4.translate(0.12, 0.02, 0), M4.rotZ(fl)));
      r.draw(F.owlWing, M4.chain(base, M4.scale(-1, 1, 1), M4.translate(0.12, 0.02, 0), M4.rotZ(fl)));
    },
    ghost(r, F, f, base) {
      r.draw(F.ghost, M4.chain(base, M4.rotZ(S(f.wob || 0) * 0.2)), { blend: true, alpha: 0.85 });
    },
    rabbit(r, F, f, base) {
      r.draw(F.rabbit, base);
    },
    mino(r, F, f, base) {
      r.draw(F.minoBody, base);
      r.draw(F.minoHead, M4.chain(base, M4.translate(0, 2.25, 0.25), M4.rotX(0.2 - (f.roar || 0) * 0.25)));
      r.draw(F.minoArm, M4.chain(base, M4.translate(-0.7, 2.0, 0), M4.rotZ(-0.5), M4.rotX(-0.5)));
      const arm = M4.chain(base, M4.translate(0.7, 2.0, 0), M4.rotZ(0.6), M4.rotX(-1.6 + (f.raise || 0)));
      r.draw(F.minoArm, arm);
      r.draw(F.axe, M4.chain(arm, M4.translate(0, -1.05, 0.06), M4.rotX(-PI / 2 + 0.6)));
    },
    golem(r, F, f, base) {
      r.draw(F.golem, base);
      r.draw(F.golemEyes, base);
    },
    golemHead(r, F, f, base) {
      r.draw(F.golemHead, base);
    },
    rockBig(r, F, f, base) {
      const k = f.glow || 0;
      const tint = [1 + k * 1.6, 1 + k * 1.3, 1 + k * 0.1];
      r.draw(F.rockBig, M4.chain(base, M4.scale(1 + k * 0.08, 1 + k * 0.08, 1 + k * 0.08)), { tint });
      r.draw(F.rockBigFace, base, { tint });
    },
    rockSmall(r, F, f, base) {
      r.draw(F.rockSmall, base);
    },
    shadow(r, F, f, base) {
      r.draw(F.shadow, base);
    },
    debris(r, F, f, base) {
      r.draw(F.debris, base);
    },
    verdia(r, F, f, base) {
      r.draw(F.verdia, base);
      r.draw(F.verdiaSword, M4.chain(base, M4.translate(0.7, 2.9, 0.4), M4.rotX(-0.9)), { blend: true, alpha: 0.9 });
    }
  };

  function draw(r, F, f) {
    const fn = DRAW[f.kind];
    if (fn) fn(r, F, f, place(f));
  }

  window.KonopFoes = { build, draw };
})();
