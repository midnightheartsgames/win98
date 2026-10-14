(function () {
  const { M4, Builder, rgb, shade } = window.P3D;

  const DIM = {
    m: { hip: 0.095, thigh: 0.45, shin: 0.42, sole: 0.055, shoulder: 0.22, upper: 0.29, fore: 0.25, torso: 0.5, waist: 0.155, chest: 0.215, depth: 0.12, headR: 0.105 },
    f: { hip: 0.09, thigh: 0.43, shin: 0.4, sole: 0.05, shoulder: 0.19, upper: 0.27, fore: 0.23, torso: 0.46, waist: 0.12, chest: 0.175, depth: 0.105, headR: 0.1 }
  };

  const JOINTS = ['spine', 'neck', 'shL', 'elL', 'shR', 'elR', 'hipL', 'knL', 'hipR', 'knR'];

  function restPose() {
    const p = { x: 0, y: 0, z: 0, ry: 0, rx: 0, rz: 0, lift: 0, mouth: 0, blink: 0, ground: true };
    JOINTS.forEach(j => { p[j] = [0, 0, 0]; });
    p.shL = [0, 0, 0.08];
    p.shR = [0, 0, 0.08];
    p.elL = [0.15, 0, 0];
    p.elR = [0.15, 0, 0];
    return p;
  }

  function buildHead(b, look, d) {
    const r = d.headR;
    if (look.robot) {
      b.box(r * 2.2, r * 2, r * 2.1, look.skin);
      b.at(0, r * 0.25, r * 1.06, (h) => h.box(r * 1.7, r * 0.45, 0.03, look.visor || [1, 0.15, 0.1, 1]));
      b.at(0, r * 1.2, 0, (h) => h.prism(6, 0.012, 0.012, 0, 0.012, 0.012, r * 1.4, 0x333333));
      b.at(0, r * 2.6, 0, (h) => h.ellipsoid(0.03, 0.03, 0.03, 6, 4, look.visor || [1, 0.15, 0.1, 1]));
      return;
    }
    b.ellipsoid(r * 0.95, r * 1.2, r * 1.05, 10, 7, look.skin);
    b.at(0, -r * 0.05, r * 0.98, (h) => h.box(0.026, 0.05, 0.04, shade(look.skin, 0.92)));
    b.at(0, -r * 0.62, r * 0.55, (h) => h.box(r * 1.15, r * 0.35, r * 0.6, look.skin));
    b.at(r * 0.97, 0, 0, (h) => h.box(0.02, 0.05, 0.035, shade(look.skin, 0.9)));
    b.at(-r * 0.97, 0, 0, (h) => h.box(0.02, 0.05, 0.035, shade(look.skin, 0.9)));
    const eyeZ = r * 0.97;
    if (look.glasses) {
      b.at(0, r * 0.22, eyeZ + 0.012, (h) => {
        h.box(r * 1.82, 0.012, 0.012, 0x111111);
        h.at(-r * 0.42, -0.018, 0, (g) => g.box(r * 0.74, 0.05, 0.014, [0.06, 0.06, 0.08, 0.15]));
        h.at(r * 0.42, -0.018, 0, (g) => g.box(r * 0.74, 0.05, 0.014, [0.06, 0.06, 0.08, 0.15]));
      });
      b.at(r * 0.95, r * 0.2, r * 0.3, (h) => h.box(0.008, 0.01, r * 1.2, 0x111111));
      b.at(-r * 0.95, r * 0.2, r * 0.3, (h) => h.box(0.008, 0.01, r * 1.2, 0x111111));
    }
    if (look.specs) {
      [-1, 1].forEach(s => b.at(s * r * 0.4, r * 0.2, eyeZ + 0.014, (h) => {
        h.at(0, 0.024, 0, (g) => g.box(r * 0.62, 0.008, 0.008, look.specs));
        h.at(0, -0.024, 0, (g) => g.box(r * 0.62, 0.008, 0.008, look.specs));
        h.at(-r * 0.31, 0, 0, (g) => g.box(0.008, 0.056, 0.008, look.specs));
        h.at(r * 0.31, 0, 0, (g) => g.box(0.008, 0.056, 0.008, look.specs));
      }));
      b.at(0, r * 0.22, eyeZ + 0.014, (h) => h.box(r * 0.2, 0.008, 0.008, look.specs));
    }
    if (look.makeup) [-1, 1].forEach(s => b.at(s * r * 0.4, r * 0.17, eyeZ - 0.006, (h) => h.box(r * 0.62, 0.06, 0.02, [0.06, 0.04, 0.06, 0])));
    b.at(-r * 0.4, r * 0.43, eyeZ - 0.004, (h) => h.box(r * 0.55, 0.014, 0.02, shade(look.hair, 0.7)));
    b.at(r * 0.4, r * 0.43, eyeZ - 0.004, (h) => h.box(r * 0.55, 0.014, 0.02, shade(look.hair, 0.7)));
    buildHair(b, look, r);
  }

  function buildEyes(b, look, d) {
    const r = d.headR;
    const eyeZ = r * 0.93;
    [-1, 1].forEach(s => {
      b.at(s * r * 0.4, r * 0.2, eyeZ, (h) => {
        h.box(r * 0.42, 0.026, 0.02, [0.95, 0.95, 0.92, 0.2]);
        h.at(0, 0, 0.008, (g) => g.box(0.018, 0.024, 0.012, look.eyes || 0x3a5a78));
      });
    });
  }

  function buildLids(b, look, d) {
    const r = d.headR;
    [-1, 1].forEach(s => b.at(s * r * 0.4, r * 0.2, r * 0.95, (h) => h.box(r * 0.46, 0.03, 0.024, shade(look.skin, 0.85))));
  }

  function buildHair(b, look, r) {
    const c = look.hair;
    const dark = shade(c, 0.8);
    const style = look.hairStyle || 'short';
    if (style === 'quiff') {
      b.at(0, r * 0.62, -r * 0.05, (h) => h.ellipsoid(r * 1.02, r * 0.62, r * 1.08, 8, 5, c));
      b.push(M4.translate(0, r * 1.02, r * 0.5), M4.rotX(-0.35));
      b.ellipsoid(r * 0.78, r * 0.42, r * 0.62, 8, 5, c);
      b.pop();
      b.at(0, r * 1.18, r * 0.72, (h) => h.ellipsoid(r * 0.6, r * 0.24, r * 0.36, 6, 4, shade(c, 1.12)));
      [-1, 1].forEach(s => b.at(s * r * 0.86, r * 0.1, -r * 0.2, (h) => h.box(0.04, r * 1.05, r * 1.25, dark)));
      b.at(0, 0.02, -r * 0.82, (h) => h.box(r * 1.6, r * 1.3, 0.05, dark));
    } else if (style === 'long') {
      b.at(0, r * 0.45, -r * 0.05, (h) => h.ellipsoid(r * 1.1, r * 0.75, r * 1.1, 8, 5, c));
      b.at(0, -r * 1.1, -r * 0.55, (h) => h.prism(6, r * 1.15, r * 0.5, 0, r * 1.05, r * 0.6, r * 1.9, c, { capTop: false, capBottom: true }));
      [-1, 1].forEach(s => b.at(s * r * 0.95, -r * 0.6, 0, (h) => h.box(0.05, r * 1.9, r * 1.1, dark)));
      b.at(0, r * 0.62, r * 0.78, (h) => h.box(r * 1.5, r * 0.22, 0.06, shade(c, 1.1)));
    } else if (style === 'bob') {
      b.at(0, r * 0.45, -r * 0.05, (h) => h.ellipsoid(r * 1.12, r * 0.78, r * 1.12, 8, 5, c));
      b.at(0, -r * 0.35, -r * 0.2, (h) => h.prism(8, r * 1.18, r * 1.05, 0, r * 1.1, r * 1.05, r * 0.9, c, { capTop: false, capBottom: true }));
      b.at(0, r * 0.6, r * 0.8, (h) => h.box(r * 1.6, r * 0.25, 0.06, shade(c, 1.1)));
    } else if (style === 'crop') {
      b.at(0, r * 0.55, -r * 0.08, (h) => h.ellipsoid(r * 1.0, r * 0.6, r * 1.02, 8, 4, c));
    } else if (style === 'spiky') {
      b.at(0, r * 0.45, -r * 0.1, (h) => h.ellipsoid(r * 1.15, r * 0.85, r * 1.15, 8, 5, c));
      const spikes = [[0, 1, 0.1, 0], [0.5, 0.85, 0.3, 0.5], [-0.5, 0.85, 0.3, -0.5], [0.9, 0.4, 0, 1.1], [-0.9, 0.4, 0, -1.1], [0.3, 0.9, -0.6, 0.3], [-0.3, 0.9, -0.6, -0.3], [0, 0.6, -0.9, 0], [0.7, 0.1, -0.6, 1.3], [-0.7, 0.1, -0.6, -1.3]];
      spikes.forEach(([x, y, z, tilt]) => {
        b.push(M4.translate(x * r, r * 0.5 + y * r * 0.7, z * r), M4.rotZ(-tilt * 0.7), M4.rotX(z * 0.9));
        b.prism(4, r * 0.28, r * 0.28, 0, r * 0.02, r * 0.02, r * 1.1, c);
        b.pop();
      });
      [-1, 1].forEach(s => b.at(s * r * 0.55, r * 0.05, r * 0.85, (h) => h.box(r * 0.45, r * 0.9, 0.03, c)));
    } else if (style === 'ears') {
      b.at(0, r * 0.35, -r * 0.05, (h) => h.ellipsoid(r * 1.12, r * 0.9, r * 1.1, 8, 5, c));
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * r * 1.05, r * 0.55, 0), M4.rotZ(-s * 1.05));
        b.prism(4, r * 0.55, r * 0.12, 0, r * 0.08, r * 0.04, r * 1.9, c);
        b.at(0, r * 0.25, r * 0.06, (e) => e.prism(4, r * 0.35, r * 0.05, 0, r * 0.05, r * 0.02, r * 1.3, look.earInner || 0xf0a0b0));
        b.pop();
      });
      b.at(0, r * 1.15, r * 0.3, (h) => h.ellipsoid(r * 0.35, r * 0.3, r * 0.3, 6, 4, shade(c, 1.15)));
    } else if (style === 'scarf') {
      b.at(0, r * 0.2, -r * 0.05, (h) => h.ellipsoid(r * 1.12, r * 1.25, r * 1.12, 9, 6, look.hat || c));
      b.at(0, -r * 1.05, r * 0.55, (h) => h.box(r * 0.5, r * 0.35, r * 0.35, shade(look.hat || c, 0.85)));
      b.at(0, r * 0.35, r * 0.9, (h) => h.box(r * 1.3, r * 0.2, 0.05, c));
    } else if (style === 'bald') {
      b.at(0, r * 0.5, -r * 0.1, (h) => h.ellipsoid(r * 0.98, r * 0.6, r * 1.0, 8, 4, shade(look.skin, 0.92)));
    } else if (style === 'afro') {
      b.at(0, r * 0.75, -r * 0.2, (h) => h.ellipsoid(r * 1.45, r * 1.05, r * 1.35, 9, 6, c));
    } else if (style === 'cap') {
      b.at(0, r * 0.62, -r * 0.05, (h) => h.ellipsoid(r * 1.04, r * 0.6, r * 1.08, 8, 5, look.hat || c));
      b.push(M4.translate(0, r * 0.62, -r * 1.0), M4.rotX(-0.2));
      b.box(r * 1.3, 0.018, r * 0.9, shade(look.hat || c, 0.85));
      b.pop();
      [-1, 1].forEach(s => b.at(s * r * 0.9, 0, r * 0.1, (h) => h.box(0.035, r * 0.6, r * 0.7, c)));
    } else if (style === 'bucket') {
      b.at(0, r * 0.62, 0, (h) => h.prism(10, r * 1.05, r * 1.1, 0, r * 0.9, r * 0.95, r * 0.75, look.hat || c));
      b.at(0, r * 0.62, 0, (h) => h.prism(12, r * 1.65, r * 1.7, -0.01, r * 1.1, r * 1.15, 0.01, shade(look.hat || c, 0.85), { capBottom: true }));
      [-1, 1].forEach(s => b.at(s * r * 0.9, r * 0.1, -r * 0.1, (h) => h.box(0.035, r * 0.7, r * 0.9, c)));
    } else if (style === 'bandana') {
      b.at(0, r * 0.6, -r * 0.06, (h) => h.ellipsoid(r * 1.02, r * 0.62, r * 1.06, 8, 5, c));
      b.at(0, r * 0.48, 0, (h) => h.prism(10, r * 1.02, r * 1.08, 0, r * 1.0, r * 1.06, r * 0.28, look.hat || 0xc02020, { capTop: false }));
      b.at(0, r * 0.55, -r * 1.12, (h) => h.box(r * 0.3, r * 0.5, 0.03, look.hat || 0xc02020));
    } else if (style === 'helmet') {
      b.at(0, r * 0.2, -r * 0.05, (h) => h.ellipsoid(r * 1.3, r * 1.35, r * 1.35, 10, 6, look.hat || c));
      b.at(0, r * 0.15, r * 1.02, (h) => h.box(r * 1.9, r * 0.7, 0.06, [0.1, 0.12, 0.16, 0.25]));
    } else {
      b.at(0, r * 0.6, -r * 0.06, (h) => h.ellipsoid(r * 1.02, r * 0.62, r * 1.06, 8, 5, c));
      b.at(0, r * 0.75, r * 0.6, (h) => h.box(r * 1.4, r * 0.3, r * 0.4, c));
    }
  }

  function buildTorso(b, look, d) {
    const top = look.top;
    b.prism(8, d.waist, d.depth * 0.9, 0, d.chest, d.depth, d.torso * 0.86, top, { capTop: false });
    b.at(0, d.torso * 0.86, 0, (h) => h.prism(8, d.chest, d.depth, 0, d.chest * 0.62, d.depth * 0.8, d.torso * 0.14, top));
    if (look.belly) {
      b.at(0, d.torso * 0.25, d.depth * 0.55, (h) => h.ellipsoid(d.waist * 1.25, d.torso * 0.32, d.depth * 1.1, 8, 5, look.top));
    }
    if (look.shirtFront) {
      const w = d.chest * 0.62;
      const y0 = d.torso * 0.12;
      const y1 = d.torso * 0.98;
      const z = d.depth * 0.93;
      if (look.shirtFront === 'stripes') {
        const n = 11;
        for (let i = 0; i < n; i++) {
          const ya = y0 + ((y1 - y0) * i) / n, yb = y0 + ((y1 - y0) * (i + 1)) / n;
          const col = i % 2 ? 0xf2f0ea : 0x1c2233;
          const wa = w * (0.7 + (0.3 * i) / n), wb = w * (0.7 + (0.3 * (i + 1)) / n);
          b.quad([-wa, ya, z + 0.002], [wa, ya, z + 0.002], [wb, yb, z + 0.004], [-wb, yb, z + 0.004], col);
        }
      } else {
        b.quad([-w * 0.7, y0, z + 0.002], [w * 0.7, y0, z + 0.002], [w, y1, z + 0.004], [-w, y1, z + 0.004], look.shirtFront);
      }
      if (look.lapels) {
        [-1, 1].forEach(s => b.quad([s * w * 0.72, y0, z + 0.01], [s * w * 1.05, y0 + 0.05, z + 0.014], [s * w * 1.25, y1, z + 0.02], [s * w * 0.95, y1, z + 0.012], shade(top, 0.8)));
      }
    }
    if (look.suspenders) {
      [-1, 1].forEach(s => {
        b.at(s * d.chest * 0.45, d.torso * 0.48, d.depth * 0.95, (h) => h.box(0.03, d.torso * 0.95, 0.012, look.suspenders));
        b.at(s * d.chest * 0.45, d.torso * 0.48, -d.depth * 0.95, (h) => h.box(0.03, d.torso * 0.95, 0.012, look.suspenders));
      });
    }
    if (look.collar) {
      b.at(0, d.torso, 0, (h) => h.prism(8, d.chest * 0.42, d.depth * 0.62, 0, d.chest * 0.36, d.depth * 0.55, 0.07, look.collar, { capTop: false }));
    }
    b.at(0, d.torso, 0, (h) => h.prism(6, 0.05, 0.05, 0, 0.045, 0.045, 0.1, look.neck || look.skin));
  }

  function buildHips(b, look, d) {
    b.prism(8, d.waist * 1.05, d.depth * 0.95, -0.1, d.waist, d.depth * 0.9, 0.1, look.legs, { capBottom: true });
    if (look.belt) b.at(0, 0.07, 0, (h) => h.prism(8, d.waist * 1.03, d.depth * 0.93, 0, d.waist * 1.03, d.depth * 0.93, 0.035, look.belt, { capTop: false }));
  }

  function buildSkirt(b, look, d) {
    if (look.coat) {
      b.prism(10, d.waist * 1.8, d.depth * 1.8, -0.72, d.waist * 1.12, d.depth * 1.15, 0.1, look.coat, { capTop: false, skip: [0, 9] });
      b.prism(10, d.waist * 1.74, d.depth * 1.74, -0.72, d.waist * 1.08, d.depth * 1.1, 0.1, shade(look.coat, 0.7), { capTop: false, skip: [0, 9] });
    } else if (look.dress) {
      b.prism(10, d.waist * 2.3, d.depth * 2.2, -0.6, d.waist * 1.05, d.depth, 0.1, look.dress, { capTop: false });
    }
  }

  function buildUpperArm(b, look, d) {
    const sleeve = look.bareArms ? look.skin : (look.sleeves || look.coat || look.top);
    b.prism(6, 0.05, 0.05, -d.upper, 0.062, 0.062, 0.02, sleeve, { capBottom: true });
  }

  function buildForeArm(b, look, d) {
    const sleeve = look.shortSleeves ? look.skin : (look.sleeves || look.coat || look.top);
    b.prism(6, 0.04, 0.04, -d.fore, 0.05, 0.05, 0, sleeve, { capBottom: true });
    if (look.cuffs) b.at(0, -d.fore + 0.01, 0, (h) => h.prism(6, 0.044, 0.044, 0, 0.044, 0.044, 0.04, look.cuffs, { capTop: false }));
    b.at(0, -d.fore - 0.05, 0.005, (h) => h.box(0.06, 0.1, 0.03, look.skin));
    b.at(0, -d.fore - 0.035, 0.03, (h) => h.box(0.022, 0.05, 0.025, look.skin));
  }

  function buildThigh(b, look, d) {
    b.prism(6, 0.062, 0.066, -d.thigh, 0.085, 0.09, 0, look.legs, { capBottom: true });
  }

  function buildShin(b, look, d) {
    const col = look.bareLegs ? look.skin : look.legs;
    b.prism(6, 0.047, 0.05, -d.shin, 0.062, 0.066, 0, col, { capBottom: true });
    b.at(0, -d.shin - d.sole / 2, 0.06, (h) => h.box(0.09, d.sole, 0.25, look.shoes, { faces: { top: shade(look.shoes, 1.2) } }));
  }

  class Figure {
    constructor(renderer, look, size = 'm') {
      this.look = look;
      this.d = DIM[size];
      this.scale = look.scale || 1;
      const mk = (fn) => {
        const b = new Builder();
        fn(b, look, this.d);
        return renderer.mesh(b);
      };
      this.parts = {
        hips: mk(buildHips),
        skirt: (look.coat || look.dress) ? mk(buildSkirt) : null,
        torso: mk(buildTorso),
        head: mk(buildHead),
        eyes: mk(buildEyes),
        lids: mk(buildLids),
        mouth: mk((b) => b.box(1, 1, 1, look.lips || [0.32, 0.08, 0.08, 0.1])),
        upper: mk(buildUpperArm),
        fore: mk(buildForeArm),
        thigh: mk(buildThigh),
        shin: mk(buildShin)
      };
      const disc = new Builder();
      disc.disc(0.42, 12, 0x000000, 0.012);
      this.blob = renderer.mesh(disc);
      this.renderer = renderer;
      this.matrices = null;
    }

    solve(pose) {
      const d = this.d;
      const side = { L: 1, R: -1 };
      const J = (a) => a || [0, 0, 0];
      const pv = pose.pivot || 0;
      const root = M4.chain(M4.translate(pose.x, 0, pose.z), M4.rotY(pose.ry), M4.translate(0, pv, 0), M4.rotX(pose.rx), M4.rotZ(pose.rz), M4.translate(0, -pv, 0), M4.scale(this.scale));
      const legBase = d.thigh + d.shin + d.sole;
      const pelvisLocal = M4.translate(0, legBase, 0);
      const out = {};
      const pelvis = M4.mul(root, pelvisLocal);
      out.hips = pelvis;
      const sp = J(pose.spine);
      const spine = M4.chain(pelvis, M4.translate(0, 0.1, 0), M4.rotY(sp[1]), M4.rotX(sp[0]), M4.rotZ(sp[2]));
      out.torso = spine;
      const nk = J(pose.neck);
      const neck = M4.chain(spine, M4.translate(0, d.torso + 0.08, 0), M4.rotY(nk[1]), M4.rotX(nk[0]), M4.rotZ(nk[2]));
      out.head = M4.mul(neck, M4.translate(0, d.headR * 1.25, 0));
      ['L', 'R'].forEach(s => {
        const k = side[s];
        const sh = J(pose['sh' + s]);
        const el = J(pose['el' + s]);
        const upper = M4.chain(spine, M4.translate(k * d.shoulder, d.torso * 0.9, 0), M4.rotY(k * sh[1]), M4.rotZ(k * sh[2]), M4.rotX(-sh[0]));
        const fore = M4.chain(upper, M4.translate(0, -d.upper, 0), M4.rotY(k * el[1]), M4.rotX(-el[0]));
        out['upper' + s] = upper;
        out['fore' + s] = fore;
        const hp = J(pose['hip' + s]);
        const kn = J(pose['kn' + s]);
        const thigh = M4.chain(pelvis, M4.translate(k * d.hip, -0.04, 0), M4.rotY(k * hp[1]), M4.rotZ(k * hp[2]), M4.rotX(-hp[0]));
        const shin = M4.chain(thigh, M4.translate(0, -d.thigh, 0), M4.rotX(kn[0]));
        out['thigh' + s] = thigh;
        out['shin' + s] = shin;
      });
      const hpL = J(pose.hipL), hpR = J(pose.hipR);
      out.skirt = M4.mul(pelvis, M4.rotX(-Math.max(hpL[0], hpR[0], 0) * 0.45 + (pose.skirtSwing || 0)));
      let lift = pose.lift || 0;
      if (pose.ground !== false) {
        let minY = Infinity;
        ['L', 'R'].forEach(s => {
          [[0, -d.shin - d.sole, -0.06], [0, -d.shin - d.sole, 0.18], [0, 0, 0.07]].forEach(p => {
            minY = Math.min(minY, M4.point(out['shin' + s], p)[1]);
          });
        });
        lift += -minY;
      } else {
        lift += pose.y || 0;
      }
      const shift = M4.translate(0, lift, 0);
      Object.keys(out).forEach(k => { out[k] = M4.mul(shift, out[k]); });
      this.matrices = out;
      this.pose = pose;
      return out;
    }

    headPoint(offset = [0, 0, 0]) {
      return M4.point(this.matrices.head, offset);
    }

    point(part, offset = [0, 0, 0]) {
      return M4.point(this.matrices[part], offset);
    }

    drawParts(opts) {
      const r = this.renderer;
      const m = this.matrices;
      const P = this.parts;
      r.draw(P.hips, m.hips, opts);
      if (P.skirt) r.draw(P.skirt, m.skirt, opts);
      r.draw(P.torso, m.torso, opts);
      r.draw(P.head, m.head, opts);
      ['L', 'R'].forEach(s => {
        r.draw(P.upper, m['upper' + s], opts);
        r.draw(P.fore, m['fore' + s], opts);
        r.draw(P.thigh, m['thigh' + s], opts);
        r.draw(P.shin, m['shin' + s], opts);
      });
    }

    draw(opts = {}) {
      if (!this.matrices) return;
      const r = this.renderer;
      const d = this.d;
      const pose = this.pose;
      this.drawParts(opts.tint ? { tint: opts.tint } : {});
      const hr = d.headR;
      if (!this.look.glasses && !this.look.robot && !this.look.helmetFace) {
        r.draw(pose.blink > 0.5 ? this.parts.lids : this.parts.eyes, this.matrices.head);
      }
      if (this.look.robot || this.look.helmetFace) return;
      const open = Math.max(0, Math.min(1, pose.mouth || 0));
      const mouthM = M4.chain(this.matrices.head, M4.translate(0, -hr * 0.52, hr * 0.9), M4.scale(hr * (0.5 + open * 0.08), 0.008 + open * 0.042, 0.03));
      r.draw(this.parts.mouth, mouthM);
    }

    drawProp(mesh, part, offset, opts) {
      if (!this.matrices || !mesh) return;
      this.renderer.draw(mesh, offset ? M4.mul(this.matrices[part], offset) : this.matrices[part], opts);
    }

    drawBlob(alpha = 0.35) {
      if (!this.matrices) return;
      const hp = this.point('hips');
      this.renderer.draw(this.blob, M4.translate(hp[0], 0, hp[2]), { flat: [0, 0, 0, alpha], blend: true, shadow: true });
    }

    drawShadow(lightDir, alpha = 0.45) {
      if (!this.matrices) return;
      const S = M4.planarShadow(lightDir, 0.01);
      const r = this.renderer;
      const m = this.matrices;
      const P = this.parts;
      const opts = { flat: [0.05, 0.06, 0.1, alpha], blend: true, shadow: true };
      const list = [['hips', 'hips'], ['torso', 'torso'], ['head', 'head']];
      if (P.skirt) list.push(['skirt', 'skirt']);
      ['L', 'R'].forEach(s => list.push(['upper', 'upper' + s], ['fore', 'fore' + s], ['thigh', 'thigh' + s], ['shin', 'shin' + s]));
      list.forEach(([part, key]) => r.draw(P[part], M4.mul(S, m[key]), opts));
    }
  }

  window.P3DFigure = { Figure, restPose, JOINTS, DIM };
})();
