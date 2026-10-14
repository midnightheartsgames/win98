(function (Z) {
  'use strict';

  const M = k => Z.MAT[k];
  const M4 = Z.M4;
  const T = (mb, c) => mb.setTint(c[0] / 2, c[1] / 2, c[2] / 2, 255);

  const legBones = (list, n, x0, y, zs, x1, y1, parent, prefix = 'g') => {
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
      const sd = s < 0 ? 'l' : 'r';
      list.push({ name: prefix + i + sd + 'a', parent, pos: [x0 * s, y, zs[i]] });
      list.push({ name: prefix + i + sd + 'b', parent: prefix + i + sd + 'a', pos: [x1 * s, y1, zs[i]] });
    }
  };

  const RIGS = {};
  {
    const b = [{ name: 'body', pos: [0, 0.45, 0] }, { name: 'head', parent: 'body', pos: [0, 0.45, -0.42] }];
    legBones(b, 3, 0.22, 0.4, [-0.28, -0.02, 0.24], 0.55, 0.3, 'body');
    RIGS.beetle = new Z.RigDef(b);
  }
  {
    const b = [{ name: 'body', pos: [0, 0.4, 0] }, { name: 'head', parent: 'body', pos: [0, 0.42, -0.62] }, { name: 'fl', parent: 'body', pos: [-0.2, 0.36, -0.5] }, { name: 'fr', parent: 'body', pos: [0.2, 0.36, -0.5] }];
    legBones(b, 2, 0.2, 0.35, [-0.1, 0.25], 0.5, 0.25, 'body');
    RIGS.cricket = new Z.RigDef(b);
  }
  RIGS.gull = new Z.RigDef([
    { name: 'body', pos: [0, 0.3, 0] }, { name: 'neck', parent: 'body', pos: [0, 0.38, -0.22] }, { name: 'head', parent: 'neck', pos: [0, 0.48, -0.3] },
    { name: 'wl1', parent: 'body', pos: [-0.12, 0.36, -0.05] }, { name: 'wl2', parent: 'wl1', pos: [-0.62, 0.36, -0.05] },
    { name: 'wr1', parent: 'body', pos: [0.12, 0.36, -0.05] }, { name: 'wr2', parent: 'wr1', pos: [0.62, 0.36, -0.05] },
    { name: 'tail', parent: 'body', pos: [0, 0.32, 0.25] }, { name: 'legl', parent: 'body', pos: [-0.06, 0.22, 0.05] }, { name: 'legr', parent: 'body', pos: [0.06, 0.22, 0.05] }
  ]);
  RIGS.fish = new Z.RigDef([
    { name: 'head', pos: [0, 0.35, -0.6] }, { name: 'jaw', parent: 'head', pos: [0, 0.3, -0.95] },
    { name: 's1', parent: 'head', pos: [0, 0.35, -0.2] }, { name: 's2', parent: 's1', pos: [0, 0.33, 0.25] }, { name: 's3', parent: 's2', pos: [0, 0.3, 0.7] }, { name: 'tail', parent: 's3', pos: [0, 0.3, 1.1] },
    { name: 'finl', parent: 'head', pos: [-0.3, 0.2, -0.4] }, { name: 'finr', parent: 'head', pos: [0.3, 0.2, -0.4] }
  ]);
  RIGS.bird = new Z.RigDef([
    { name: 'body', pos: [0, 0.75, 0] }, { name: 'neck', parent: 'body', pos: [0, 0.95, -0.25] }, { name: 'head', parent: 'neck', pos: [0, 1.25, -0.32] },
    { name: 'wl', parent: 'body', pos: [-0.26, 0.85, -0.05] }, { name: 'wr', parent: 'body', pos: [0.26, 0.85, -0.05] },
    { name: 'll1', parent: 'body', pos: [-0.12, 0.6, 0.02] }, { name: 'll2', parent: 'll1', pos: [-0.12, 0.32, 0.06] },
    { name: 'lr1', parent: 'body', pos: [0.12, 0.6, 0.02] }, { name: 'lr2', parent: 'lr1', pos: [0.12, 0.32, 0.06] }
  ]);
  RIGS.quad = new Z.RigDef([
    { name: 'body', pos: [0, 0.55, 0] }, { name: 'neck', parent: 'body', pos: [0, 0.62, -0.32] }, { name: 'head', parent: 'neck', pos: [0, 0.72, -0.45] }, { name: 'tail', parent: 'body', pos: [0, 0.6, 0.35] },
    { name: 'fl1', parent: 'body', pos: [-0.12, 0.5, -0.25] }, { name: 'fl2', parent: 'fl1', pos: [-0.12, 0.28, -0.25] },
    { name: 'fr1', parent: 'body', pos: [0.12, 0.5, -0.25] }, { name: 'fr2', parent: 'fr1', pos: [0.12, 0.28, -0.25] },
    { name: 'bl1', parent: 'body', pos: [-0.12, 0.5, 0.28] }, { name: 'bl2', parent: 'bl1', pos: [-0.12, 0.28, 0.3] },
    { name: 'br1', parent: 'body', pos: [0.12, 0.5, 0.28] }, { name: 'br2', parent: 'br1', pos: [0.12, 0.28, 0.3] }
  ]);
  RIGS.plant = new Z.RigDef([{ name: 's1', pos: [0, 0, 0] }, { name: 's2', parent: 's1', pos: [0, 1.4, 0] }, { name: 'head', parent: 's2', pos: [0, 2.8, 0] }]);
  RIGS.robot = new Z.RigDef([
    { name: 'base', pos: [0, 0.3, 0] }, { name: 'torso', parent: 'base', pos: [0, 0.8, 0] }, { name: 'head', parent: 'torso', pos: [0, 1.65, 0] },
    { name: 'larm', parent: 'torso', pos: [-0.38, 1.4, 0] }, { name: 'lfarm', parent: 'larm', pos: [-0.42, 1.05, 0] },
    { name: 'rarm', parent: 'torso', pos: [0.38, 1.4, 0] }, { name: 'rfarm', parent: 'rarm', pos: [0.42, 1.05, 0] }
  ]);
  RIGS.rover = new Z.RigDef([{ name: 'base', pos: [0, 0.6, 0] }, { name: 'turret', parent: 'base', pos: [0, 1.25, 0.1] }, { name: 'lid', parent: 'base', pos: [0, 1.2, 0.75] }]);
  RIGS.agregat = new Z.RigDef([
    { name: 'base', pos: [0, 0.35, 0] }, { name: 'torso', parent: 'base', pos: [0, 0.75, 0] }, { name: 'neck', parent: 'torso', pos: [0, 1.25, -0.1] }, { name: 'head', parent: 'neck', pos: [0, 1.5, -0.15] },
    { name: 'larm', parent: 'torso', pos: [-0.36, 1.05, -0.1] }, { name: 'lfarm', parent: 'larm', pos: [-0.4, 0.75, -0.3] },
    { name: 'rarm', parent: 'torso', pos: [0.36, 1.05, -0.1] }, { name: 'rfarm', parent: 'rarm', pos: [0.4, 0.75, -0.3] }
  ]);
  Z.RIGS = RIGS;

  const B = {
    beetle(look) {
      const mb = new Z.SkinBuilder(RIGS.beetle), K = Z.MODEL_KIT, queen = look.queen;
      const legCol = [176, 92, 40], dark = [34, 26, 20];
      mb.setMat(M('chitinStripes'), 0, 0); mb.setTint(queen ? 150 : 160, queen ? 140 : 150, queen ? 124 : 134, 255);
      mb.loft([[-0.27, 0.27, 0.17, 0.08], [-0.16, 0.36, 0.27, 0.12], [0.02, 0.41, 0.33, 0.14], [0.22, 0.41, 0.33, 0.15], [0.42, 0.35, 0.27, 0.13], [0.57, 0.22, 0.16, 0.09], [0.64, 0.06, 0.05, 0.03]].map(r => ({ c: [0, 0.42, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 22, U: [0, 1, 0], V: [1, 0, 0], n: 2.2, capA: true, capB: true, uvU: 1.9, uvV: 0.2 });
      K.paint(mb, 'rubber', dark);
      K.tubeAlong(mb, [[0, 0.7, -0.2], [0, 0.76, 0.05], [0, 0.75, 0.3], [0, 0.68, 0.5], [0, 0.55, 0.62]], [0.012], { b: 'body', sides: 4 });
      K.paint(mb, 'blank', [236, 150, 62]);
      mb.loft([[-0.43, 0.13, 0.1, 0.07], [-0.37, 0.21, 0.15, 0.09], [-0.28, 0.25, 0.17, 0.1], [-0.22, 0.22, 0.14, 0.09]].map(r => ({ c: [0, 0.47, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 16, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      K.paint(mb, 'rubber', dark);
      for (const [x, z, r] of [[0, -0.33, 0.04], [-0.09, -0.31, 0.03], [0.09, -0.31, 0.03], [-0.16, -0.27, 0.025], [0.16, -0.27, 0.025], [-0.05, -0.39, 0.022], [0.05, -0.39, 0.022]]) K.blob(mb, 'body', [x, 0.47 + 0.16 * Math.sqrt(Math.max(0, 1 - (x / 0.24) ** 2)) - 0.012, z], [r, 0.012, r * 0.9], 6, 4);
      K.paint(mb, 'blank', [200, 110, 46]);
      K.blob(mb, 'head', [0, 0.43, -0.5], [0.14, 0.11, 0.1], 10, 7);
      K.paint(mb, 'rubber', dark);
      for (const s of [-1, 1]) {
        K.blob(mb, 'head', [s * 0.1, 0.46, -0.55], [0.035, 0.03, 0.03], 6, 5);
        K.tubeAlong(mb, [[s * 0.06, 0.48, -0.58], [s * 0.12, 0.56, -0.68], [s * 0.17, 0.6, -0.8], [s * 0.2, 0.6, -0.9]], [0.012, 0.011, 0.014, 0.018], { b: 'head', sides: 5 });
        K.tubeAlong(mb, [[s * 0.05, 0.38, -0.58], [s * 0.04, 0.35, -0.64], [s * 0.01, 0.34, -0.67]], [0.02, 0.014, 0.006], { b: 'head', sides: 5 });
      }
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) {
        const sd = s < 0 ? 'l' : 'r', z = [-0.28, -0.02, 0.24][i], dz = (i - 1) * 0.08;
        K.paint(mb, 'blank', legCol);
        K.tubeAlong(mb, [[0.2 * s, 0.4, z], [0.38 * s, 0.38, z + dz * 0.5], [0.55 * s, 0.3, z + dz]], [0.04, 0.036, 0.03], { b: 'g' + i + sd + 'a', sides: 7 });
        K.tubeAlong(mb, [[0.55 * s, 0.3, z + dz], [0.66 * s, 0.14, z + dz * 1.6], [0.72 * s, 0.03, z + dz * 2.2]], [0.028, 0.02, 0.014], { b: 'g' + i + sd + 'b', sides: 6 });
        K.paint(mb, 'rubber', dark);
        K.tubeAlong(mb, [[0.72 * s, 0.035, z + dz * 2.2], [0.8 * s, 0.01, z + dz * 2.4]], [0.012, 0.006], { b: 'g' + i + sd + 'b', sides: 5 });
      }
      if (queen) {
        mb.setMat(M('soil'), 0, 0); mb.setTint(180, 160, 130, 255);
        mb.loft([[0.45, 0.2, 0.16, 0.16], [0.6, 0.34, 0.28, 0.26], [0.85, 0.36, 0.3, 0.26], [1.05, 0.24, 0.2, 0.18], [1.16, 0.06, 0.05, 0.05]].map((r, k) => ({ c: [0, 0.38 - k * 0.02, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 18, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true, shape: (ph, R, k) => k > 0 && k < 4 ? 0.02 * Math.sin(ph * 8) : 0 });
      }
      return { def: RIGS.beetle, mesh: mb, height: 0.8 * (look.scale || 1) };
    },
    cricket(look) {
      const mb = new Z.SkinBuilder(RIGS.cricket), K = Z.MODEL_KIT;
      const fur = [128, 92, 58], shell = [88, 60, 38], dark = [46, 34, 24];
      K.paint(mb, 'fur', fur);
      const ab = [];
      for (let k = 0; k <= 10; k++) { const z = -0.16 + k * 0.1, t = k / 10, r = Math.sin(Math.min(1, (t + 0.08) / 0.75) * Math.PI * 0.5) * (1 - Math.pow(t, 3) * 0.75); ab.push({ c: [0, 0.4 - t * 0.04, z], rx: 0.24 * r + (k % 2 ? 0.006 : 0), f: 0.18 * r + (k % 2 ? 0.006 : 0), bk: 0.15 * r, b: 'body' }); }
      mb.loft(ab, { sides: 18, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      K.paint(mb, 'leather', [104, 76, 48]);
      for (const s of [-1, 1]) mb.loft([[-0.1, 0.02], [0.1, 0.1], [0.35, 0.12], [0.5, 0.06]].map(r => ({ c: [s * 0.08, 0.6, r[0]], rx: r[1], f: 0.012, bk: 0.008, b: 'body' })), { sides: 10, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      K.paint(mb, 'leather', shell);
      mb.loft([[-0.66, 0.15, 0.12, 0.08], [-0.6, 0.22, 0.2, 0.1], [-0.42, 0.27, 0.25, 0.12], [-0.24, 0.27, 0.24, 0.13], [-0.13, 0.24, 0.2, 0.12]].map(r => ({ c: [0, 0.43, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 20, U: [0, 1, 0], V: [1, 0, 0], n: 2.4, capA: true, capB: true });
      K.paint(mb, 'rubber', dark);
      K.blob(mb, 'head', [0, 0.42, -0.72], [0.13, 0.11, 0.12], 10, 7);
      for (const s of [-1, 1]) {
        K.paint(mb, 'glass', [60, 50, 40]);
        K.blob(mb, 'head', [s * 0.09, 0.47, -0.76], [0.03, 0.035, 0.03], 6, 5);
        K.paint(mb, 'rubber', dark);
        K.tubeAlong(mb, [[s * 0.05, 0.47, -0.82], [s * 0.15, 0.52, -1.0], [s * 0.26, 0.55, -1.15], [s * 0.34, 0.52, -1.25]], [0.01, 0.008, 0.006, 0.004], { b: 'head', sides: 4 });
        K.tubeAlong(mb, [[s * 0.06, 0.34, 0.78], [s * 0.12, 0.38, 0.95], [s * 0.18, 0.4, 1.06]], [0.016, 0.01, 0.004], { b: 'body', sides: 4 });
        const fb = s < 0 ? 'fl' : 'fr';
        K.paint(mb, 'leather', shell);
        K.tubeAlong(mb, [[0.2 * s, 0.36, -0.5], [0.3 * s, 0.26, -0.62], [0.36 * s, 0.18, -0.76]], [0.075, 0.07, 0.06], { b: fb, sides: 9 });
        K.paint(mb, 'leather', [70, 48, 30]);
        mb.loft([[-0.72, 0.05, 0.04, 0.04], [-0.8, 0.11, 0.035, 0.035], [-0.88, 0.12, 0.03, 0.03]].map(r => ({ c: [0.38 * s, 0.17, r[0]], rx: r[1], f: r[2], bk: r[3], b: fb })), { sides: 12, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
        K.paint(mb, 'rubber', dark);
        for (let t = 0; t < 4; t++) K.tubeAlong(mb, [[0.38 * s + (t - 1.5) * 0.06, 0.16, -0.87], [0.38 * s + (t - 1.5) * 0.07, 0.12, -0.96]], [0.018, 0.005], { b: fb, sides: 5 });
      }
      for (let i = 0; i < 2; i++) for (const s of [-1, 1]) {
        const sd = s < 0 ? 'l' : 'r', z = [-0.1, 0.25][i];
        K.paint(mb, 'leather', shell);
        K.tubeAlong(mb, [[0.18 * s, 0.35, z], [0.36 * s, 0.32, z + 0.05], [0.5 * s, 0.25, z + 0.1]], [0.045, 0.04, 0.032], { b: 'g' + i + sd + 'a', sides: 7 });
        K.tubeAlong(mb, [[0.5 * s, 0.25, z + 0.1], [0.58 * s, 0.12, z + 0.2], [0.63 * s, 0.01, z + 0.3]], [0.03, 0.022, 0.012], { b: 'g' + i + sd + 'b', sides: 6 });
      }
      return { def: RIGS.cricket, mesh: mb, height: 0.8 };
    },
    gull(look) {
      const mb = new Z.SkinBuilder(RIGS.gull), K = Z.MODEL_KIT;
      const white = [244, 244, 240], grey = [168, 174, 184], blk = [36, 34, 34], red = [196, 46, 36];
      K.paint(mb, 'feathers', white);
      mb.loft([[-0.27, 0.07, 0.07, 0.06], [-0.2, 0.13, 0.13, 0.12], [-0.05, 0.16, 0.15, 0.15], [0.12, 0.15, 0.13, 0.13], [0.28, 0.09, 0.07, 0.07], [0.38, 0.04, 0.03, 0.03]].map(r => ({ c: [0, 0.31, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 16, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      K.paint(mb, 'feathers', grey);
      mb.loft([[-0.18, 0.13, 0.13, 0.12], [-0.05, 0.16, 0.15, 0.15], [0.12, 0.15, 0.13, 0.13], [0.3, 0.08, 0.06, 0.06]].map(r => ({ c: [0, 0.312, r[0]], rx: r[1] + 0.004, f: r[2] + 0.004, bk: r[3], b: 'body' })), { sides: 12, U: [0, 1, 0], V: [1, 0, 0], arc: [-1.15, 1.15] });
      K.paint(mb, 'feathers', white);
      mb.loft([{ c: [0, 0.34, -0.2], rx: 0.07, rz: 0.075, b: 'neck', b2: 'body', w: 0.4 }, { c: [0, 0.42, -0.26], rx: 0.06, rz: 0.06, b: 'neck' }, { c: [0, 0.48, -0.3], rx: 0.055, rz: 0.055, b: 'head', b2: 'neck', w: 0.3 }], { sides: 10 });
      K.paint(mb, 'feathers', [70, 56, 48]);
      K.blob(mb, 'head', [0, 0.5, -0.34], [0.065, 0.068, 0.085], 10, 8);
      K.paint(mb, 'feathers', white);
      for (const s of [-1, 1]) K.blob(mb, 'head', [s * 0.05, 0.515, -0.37], [0.014, 0.012, 0.012], 5, 4);
      K.paint(mb, 'blank', red);
      K.tubeAlong(mb, [[0, 0.5, -0.4], [0, 0.495, -0.47], [0, 0.49, -0.52], [0, 0.475, -0.535]], [0.02, 0.014, 0.009, 0.004], { b: 'head', sides: 6, ref: [0, 1, 0] });
      for (const s of [-1, 1]) {
        const sd = s < 0 ? 'l' : 'r';
        K.paint(mb, 'feathers', grey);
        mb.loft([[0.1, 0.13, 0.03, 0.012], [0.35, 0.15, 0.026, 0.01], [0.62, 0.14, 0.02, 0.008]].map(r => ({ c: [r[0] * s, 0.37, -0.02 + r[1] * 0.25], rx: r[1], f: r[2], bk: r[3], b: 'w' + sd + '1' })), { sides: 12, U: [0, 1, 0], V: [0, 0, 1], capA: true, capB: true });
        mb.loft([[0.62, 0.14, 0.02, 0.008], [0.9, 0.12, 0.014, 0.006], [1.02, 0.1, 0.012, 0.005]].map(r => ({ c: [r[0] * s, 0.37, -0.01 + r[1] * 0.3], rx: r[1], f: r[2], bk: r[3], b: 'w' + sd + '2' })), { sides: 12, U: [0, 1, 0], V: [0, 0, 1], capA: true });
        K.paint(mb, 'feathers', blk);
        mb.loft([[1.0, 0.1, 0.012, 0.005], [1.16, 0.075, 0.009, 0.004], [1.26, 0.03, 0.006, 0.003]].map(r => ({ c: [r[0] * s, 0.37, 0.0 + r[1] * 0.4], rx: r[1], f: r[2], bk: r[3], b: 'w' + sd + '2' })), { sides: 12, U: [0, 1, 0], V: [0, 0, 1], capA: true, capB: true });
        K.paint(mb, 'blank', red);
        K.tubeAlong(mb, [[0.06 * s, 0.22, 0.05], [0.06 * s, 0.1, 0.06], [0.06 * s, 0.02, 0.05]], [0.012, 0.01, 0.009], { b: 'leg' + sd, sides: 5 });
        mb.loft([[0.05, 0.012], [0.0, 0.04], [-0.05, 0.05]].map(r => ({ c: [0.06 * s, 0.012, r[0]], rx: r[1], f: 0.005, bk: 0.005, b: 'leg' + sd })), { sides: 8, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      }
      K.paint(mb, 'feathers', white);
      mb.loft([[0.24, 0.06, 0.015], [0.36, 0.1, 0.012], [0.46, 0.11, 0.008]].map(r => ({ c: [0, 0.33, r[0]], rx: r[1], f: r[2], bk: r[2], b: 'tail' })), { sides: 10, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      return { def: RIGS.gull, mesh: mb, height: 0.6 * (look.scale || 1) };
    },
    fish(look) {
      const mb = new Z.SkinBuilder(RIGS.fish), K = Z.MODEL_KIT, king = look.king;
      const skin = king ? [96, 92, 74] : [118, 116, 96], belly = king ? [170, 160, 132] : [196, 190, 160];
      const bones = z => z < -0.45 ? ['head'] : z < -0.2 ? ['head', 's1', Z.clamp((z + 0.45) / 0.25, 0, 1) * 0.5] : z < 0.1 ? ['s1'] : z < 0.35 ? ['s1', 's2', (z - 0.1) / 0.25 * 0.5] : z < 0.55 ? ['s2'] : z < 0.8 ? ['s2', 's3', (z - 0.55) / 0.25 * 0.5] : z < 1.0 ? ['s3'] : ['s3', 'tail', Math.min(1, (z - 1.0) / 0.15) * 0.6];
      const prof = [[-1.0, 0.3, 0.1, 0.09], [-0.92, 0.38, 0.16, 0.13], [-0.75, 0.42, 0.21, 0.16], [-0.55, 0.4, 0.24, 0.18], [-0.3, 0.35, 0.27, 0.2], [0.0, 0.3, 0.28, 0.2], [0.3, 0.24, 0.26, 0.18], [0.6, 0.17, 0.22, 0.14], [0.9, 0.11, 0.17, 0.1], [1.12, 0.06, 0.12, 0.07], [1.22, 0.03, 0.07, 0.04]];
      const rings = (off, yo) => prof.map(r => { const bw = bones(r[0]); return { c: [0, 0.32 + (r[0] < -0.6 ? (r[0] + 0.6) * 0.15 : 0) + (yo || 0), r[0]], rx: r[1] + off, f: r[2] + off, bk: r[3] + off, b: bw[0], b2: bw[1], w: bw[2] || 0 }; });
      K.paint(mb, 'fishskin', skin);
      mb.loft(rings(0), { sides: 20, U: [0, 1, 0], V: [1, 0, 0], n: 2.2, capA: true, capB: true, uvU: 1.5, uvV: 1.5 });
      K.paint(mb, 'fishskin', belly);
      mb.loft(rings(0.004).slice(1, 9), { sides: 10, U: [0, 1, 0], V: [1, 0, 0], n: 2.2, arc: [Math.PI - 1.0, Math.PI + 1.0] });
      K.paint(mb, 'fishskin', skin.map(v => v * 0.9));
      mb.loft([[-1.02, 0.28, 0.035, 0.04], [-0.9, 0.36, 0.045, 0.05], [-0.72, 0.3, 0.04, 0.045]].map(r => ({ c: [0, 0.2, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'jaw' })), { sides: 14, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      K.paint(mb, 'rubber', [40, 24, 22]);
      mb.loft([[-1.0, 0.26], [-0.92, 0.3]].map(r => ({ c: [0, 0.24, r[0]], rx: r[1], f: 0.012, bk: 0.012, b: 'head' })), { sides: 12, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      K.paint(mb, 'rubber', [50, 48, 40]);
      for (const s of [-1, 1]) {
        K.tubeAlong(mb, [[0.26 * s, 0.3, -0.95], [0.5 * s, 0.32, -1.1], [0.78 * s, 0.26, -1.25], [0.98 * s, 0.16, -1.32]], [0.026, 0.02, 0.012, 0.005], { b: 'head', sides: 5 });
        for (const k of [0.07, 0.16]) K.tubeAlong(mb, [[k * s, 0.18, -0.95], [k * 1.4 * s, 0.1, -1.02], [k * 1.6 * s, 0.03, -1.05]], [0.012, 0.008, 0.004], { b: 'jaw', sides: 4 });
        K.paint(mb, 'glass', [210, 190, 110]);
        K.blob(mb, 'head', [0.25 * s, 0.43, -0.86], [0.026, 0.026, 0.026], 6, 5);
        K.paint(mb, 'rubber', [10, 10, 10]);
        K.blob(mb, 'head', [0.262 * s, 0.438, -0.872], [0.012, 0.012, 0.012], 5, 4);
        const fb = s < 0 ? 'finl' : 'finr';
        K.paint(mb, 'fishskin', skin.map(v => v * 0.8));
        mb.loft([[0.3, 0.1], [0.5, 0.16], [0.66, 0.12], [0.72, 0.04]].map(r => ({ c: [r[0] * s, 0.18, -0.38 + (r[0] - 0.3) * 0.4], rx: r[1], f: 0.012, bk: 0.008, b: fb })), { sides: 10, U: [0, 1, 0], V: [0, 0, 1], capA: true, capB: true });
        K.paint(mb, 'fishskin', skin);
      }
      K.paint(mb, 'fishskin', skin.map(v => v * 0.75));
      mb.loft([[-0.18, 0.012, 0.0], [-0.08, 0.012, 0.12], [0.02, 0.01, 0.1], [0.08, 0.008, 0.0]].map(r => ({ c: [0, 0.6, r[0]], rx: r[1], f: r[2], bk: 0.01, b: 's1' })), { sides: 8, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      mb.loft([[0.15, 0.0], [0.3, 0.1], [0.6, 0.12], [0.95, 0.08], [1.1, 0.0]].map(r => { const bw = bones(r[0]); return { c: [0, 0.16, r[0]], rx: 0.01, f: 0.01, bk: r[1] + 0.01, b: bw[0], b2: bw[1], w: bw[2] || 0 }; }), { sides: 8, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      mb.loft([[1.15, 0.06], [1.25, 0.2], [1.38, 0.26], [1.46, 0.2], [1.5, 0.05]].map(r => ({ c: [0, 0.31, r[0]], rx: 0.012, f: r[1], bk: r[1], b: 'tail' })), { sides: 8, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      if (king) { K.paint(mb, 'rubber', [150, 120, 100]); for (const [x, z] of [[0.3, -0.2], [-0.25, 0.1], [0.2, 0.4]]) K.tubeAlong(mb, [[x, 0.55, z - 0.06], [x * 1.05, 0.56, z + 0.06]], [0.008], { b: z < 0 ? 's1' : 's2', sides: 4 }); }
      return { def: RIGS.fish, mesh: mb, height: 0.7 * (look.scale || 1) };
    },
    bird(look) {
      const mb = new Z.SkinBuilder(RIGS.bird), K = Z.MODEL_KIT, roo = look.rooster;
      const body = roo ? [178, 92, 46] : [244, 242, 234], wing = roo ? [120, 56, 30] : [232, 230, 222], comb = [214, 34, 30], yel = [226, 176, 56];
      K.paint(mb, 'feathers', body);
      mb.loft([[-0.36, 0.08, 0.1, 0.1], [-0.28, 0.24, 0.27, 0.28], [-0.1, 0.32, 0.32, 0.34], [0.12, 0.3, 0.3, 0.3], [0.3, 0.22, 0.24, 0.2], [0.42, 0.1, 0.14, 0.08], [0.46, 0.02, 0.04, 0.02]].map(r => ({ c: [0, 0.8 + (r[0] > 0.2 ? (r[0] - 0.2) * 0.4 : 0), r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 18, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true, uvU: 2.5, uvV: 2.5 });
      K.paint(mb, 'feathers', roo ? [218, 150, 54] : body);
      mb.loft([{ c: [0, 0.92, -0.2], rx: 0.15, rz: 0.15, b: 'neck', b2: 'body', w: 0.45 }, { c: [0, 1.06, -0.27], rx: 0.11, rz: 0.12, b: 'neck' }, { c: [0, 1.2, -0.31], rx: 0.085, rz: 0.09, b: 'head', b2: 'neck', w: 0.35 }], { sides: 12 });
      K.paint(mb, 'feathers', roo ? [218, 150, 54] : body);
      K.blob(mb, 'head', [0, 1.28, -0.34], [0.08, 0.09, 0.105], 10, 8);
      K.paint(mb, 'blank', comb);
      for (let i = 0; i < (roo ? 6 : 5); i++) K.blob(mb, 'head', [0, 1.37 + Math.sin(i / (roo ? 5 : 4) * Math.PI) * (roo ? 0.06 : 0.035), -0.4 + i * 0.035], [0.012, roo ? 0.05 : 0.035, 0.02], 6, 5);
      for (const s of [-1, 1]) K.blob(mb, 'head', [s * 0.022, 1.18, -0.41], [0.014, roo ? 0.05 : 0.035, 0.02], 6, 5);
      K.paint(mb, 'blank', yel);
      K.tubeAlong(mb, [[0, 1.28, -0.43], [0, 1.27, -0.48], [0, 1.25, -0.52]], [0.028, 0.016, 0.004], { b: 'head', sides: 6, ref: [0, 1, 0] });
      for (const s of [-1, 1]) {
        K.paint(mb, 'rubber', [20, 16, 12]);
        K.blob(mb, 'head', [s * 0.065, 1.3, -0.38], [0.014, 0.014, 0.014], 5, 4);
        const wb = s < 0 ? 'wl' : 'wr';
        K.paint(mb, 'feathers', wing);
        mb.loft([[-0.2, 0.05], [-0.1, 0.13], [0.1, 0.16], [0.28, 0.1], [0.38, 0.02]].map(r => ({ c: [0.3 * s, 0.86 - (r[0] + 0.2) * 0.12, r[0]], rx: 0.035, f: r[1], bk: r[1], b: wb })), { sides: 10, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
        const l1 = 'l' + (s < 0 ? 'l' : 'r') + '1', l2 = 'l' + (s < 0 ? 'l' : 'r') + '2';
        K.paint(mb, 'feathers', body);
        K.tubeAlong(mb, [[0.12 * s, 0.68, 0.0], [0.12 * s, 0.5, 0.03], [0.12 * s, 0.34, 0.06]], [0.075, 0.065, 0.04], { b: l1, sides: 9 });
        K.paint(mb, 'blank', yel);
        K.tubeAlong(mb, [[0.12 * s, 0.36, 0.06], [0.12 * s, 0.18, 0.04], [0.12 * s, 0.04, 0.0]], [0.032, 0.028, 0.026], { b: l2, sides: 8 });
        for (const a of [-0.45, 0, 0.45]) K.tubeAlong(mb, [[0.12 * s, 0.03, 0.0], [0.12 * s + Math.sin(a) * 0.08, 0.015, -Math.cos(a) * 0.08], [0.12 * s + Math.sin(a) * 0.14, 0.01, -Math.cos(a) * 0.14]], [0.018, 0.013, 0.006], { b: l2, sides: 5 });
        K.tubeAlong(mb, [[0.12 * s, 0.03, 0.01], [0.12 * s, 0.015, 0.09]], [0.016, 0.006], { b: l2, sides: 5 });
        K.tubeAlong(mb, [[0.12 * s, 0.12, 0.05], [0.12 * s, 0.1, 0.11]], [0.012, 0.003], { b: l2, sides: 5 });
      }
      if (roo) {
        for (let i = 0; i < 5; i++) {
          K.paint(mb, 'feathers', i % 2 ? [24, 60, 44] : [30, 30, 36]);
          const sp = (i - 2) * 0.05, h = 0.4 + (i === 2 ? 0.15 : 0);
          K.tubeAlong(mb, [[sp, 1.0, 0.36], [sp * 1.5, 1.2, 0.45], [sp * 2, 1.0 + h * 0.5, 0.62], [sp * 2.2, 0.8, 0.7]], [0.03, 0.035, 0.025, 0.006], { b: 'body', sides: 6 });
        }
      } else {
        K.paint(mb, 'feathers', body);
        mb.loft([[0.35, 0.04], [0.45, 0.1], [0.52, 0.12]].map(r => ({ c: [0, 1.0 + (r[0] - 0.35) * 0.6, r[0]], rx: r[1], f: 0.02, bk: 0.02, b: 'body' })), { sides: 10, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
      }
      return { def: RIGS.bird, mesh: mb, height: 1.4 * (look.scale || 1) };
    },
    quad(look) {
      const mb = new Z.SkinBuilder(RIGS.quad), K = Z.MODEL_KIT, kind = look.kind || 'dog';
      const col = kind === 'baibak' ? [184, 150, 98] : kind === 'ox' ? [118, 80, 54] : [112, 100, 84];
      const dark = col.map(v => v * 0.55);
      const legs = [['fl', -1, -0.25], ['fr', 1, -0.25], ['bl', -1, 0.28], ['br', 1, 0.28]];
      K.paint(mb, 'fur', col);
      if (kind === 'baibak') {
        mb.loft([[-0.36, 0.06, 0.06, 0.06], [-0.3, 0.17, 0.17, 0.2], [-0.12, 0.25, 0.24, 0.32], [0.1, 0.27, 0.25, 0.34], [0.3, 0.2, 0.2, 0.25], [0.4, 0.06, 0.06, 0.06]].map(r => ({ c: [0, 0.5, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 16, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true, uvU: 3, uvV: 3 });
        K.blob(mb, 'head', [0, 0.7, -0.46], [0.11, 0.1, 0.12], 10, 8);
        K.paint(mb, 'fur', dark);
        for (const s of [-1, 1]) K.blob(mb, 'head', [s * 0.07, 0.79, -0.42], [0.025, 0.022, 0.012], 5, 4);
        K.paint(mb, 'rubber', [18, 14, 10]);
        for (const s of [-1, 1]) K.blob(mb, 'head', [s * 0.065, 0.73, -0.55], [0.014, 0.014, 0.012], 5, 4);
        K.blob(mb, 'head', [0, 0.69, -0.585], [0.02, 0.014, 0.012], 5, 4);
        K.paint(mb, 'marble', [240, 230, 200]);
        for (const s of [-1, 1]) K.tubeAlong(mb, [[s * 0.012, 0.66, -0.575], [s * 0.012, 0.62, -0.57]], [0.01, 0.009], { b: 'head', sides: 4 });
        K.paint(mb, 'fur', dark);
        K.tubeAlong(mb, [[0, 0.56, 0.38], [0, 0.52, 0.48]], [0.04, 0.02], { b: 'tail', sides: 6 });
        for (const [n, x, z] of legs) { K.paint(mb, 'fur', col); K.tubeAlong(mb, [[0.13 * x, 0.42, z], [0.13 * x, 0.2, z], [0.13 * x, 0.06, z - 0.02]], [0.07, 0.055, 0.045], { bones: [[n + '1'], [n + '1', n + '2', 0.5], [n + '2']], sides: 8 }); K.paint(mb, 'rubber', dark); K.blob(mb, n + '2', [0.13 * x, 0.03, z - 0.05], [0.05, 0.03, 0.07], 6, 5); }
      } else {
        const ox = kind === 'ox';
        const prof = ox ? [[-0.36, 0.12, 0.14, 0.14], [-0.3, 0.2, 0.24, 0.26], [-0.12, 0.23, 0.28, 0.26], [0.1, 0.22, 0.24, 0.24], [0.3, 0.2, 0.2, 0.2], [0.38, 0.12, 0.12, 0.12], [0.41, 0.04, 0.04, 0.04]] : [[-0.36, 0.08, 0.1, 0.1], [-0.3, 0.13, 0.17, 0.19], [-0.15, 0.14, 0.16, 0.18], [0.08, 0.11, 0.11, 0.1], [0.28, 0.12, 0.12, 0.1], [0.38, 0.08, 0.08, 0.07], [0.41, 0.03, 0.03, 0.03]];
        mb.loft(prof.map(r => ({ c: [0, 0.57 + (ox && r[0] < -0.05 ? 0.04 : 0), r[0]], rx: r[1], f: r[2], bk: r[3], b: 'body' })), { sides: 16, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true, uvU: 3, uvV: 3, shape: (ph, R, k) => ox && k > 0 && k < 3 ? 0.06 * Math.max(0, Math.cos(ph)) * Math.max(0, Math.cos(ph) - 0.6) : 0 });
        mb.loft([{ c: [0, 0.6, -0.28], rx: ox ? 0.17 : 0.09, f: ox ? 0.2 : 0.1, bk: ox ? 0.22 : 0.1, b: 'neck', b2: 'body', w: 0.4 }, { c: [0, ox ? 0.66 : 0.68, -0.38], rx: ox ? 0.14 : 0.07, f: ox ? 0.15 : 0.075, bk: ox ? 0.2 : 0.08, b: 'neck' }, { c: [0, 0.72, -0.46], rx: ox ? 0.12 : 0.065, rz: ox ? 0.12 : 0.07, b: 'head', b2: 'neck', w: 0.3 }], { sides: 12 });
        if (ox) {
          mb.loft([[-0.42, 0.12, 0.12, 0.13], [-0.52, 0.12, 0.1, 0.13], [-0.66, 0.1, 0.08, 0.1], [-0.72, 0.08, 0.06, 0.07]].map(r => ({ c: [0, 0.73 + (r[0] + 0.42) * 0.5, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'head' })), { sides: 14, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
          K.paint(mb, 'rubber', [40, 30, 26]);
          K.blob(mb, 'head', [0, 0.6, -0.73], [0.075, 0.05, 0.03], 8, 6);
          K.paint(mb, 'marble', [226, 214, 190]);
          for (const s of [-1, 1]) K.tubeAlong(mb, [[s * 0.09, 0.82, -0.47], [s * 0.2, 0.86, -0.46], [s * 0.26, 0.96, -0.52], [s * 0.24, 1.04, -0.6]], [0.035, 0.026, 0.016, 0.005], { b: 'head', sides: 7 });
          K.tubeAlong(mb, [[0, 0.83, -0.52], [0, 0.94, -0.58], [0, 1.0, -0.68]], [0.032, 0.02, 0.005], { b: 'head', sides: 7 });
          K.paint(mb, 'fur', dark);
          for (const s of [-1, 1]) K.blob(mb, 'head', [s * 0.14, 0.77, -0.44], [0.05, 0.02, 0.03], 6, 4);
          K.tubeAlong(mb, [[0, 0.62, 0.4], [0, 0.45, 0.46], [0, 0.3, 0.47]], [0.025, 0.02, 0.015], { b: 'tail', sides: 5 });
          K.blob(mb, 'tail', [0, 0.27, 0.47], [0.04, 0.07, 0.04], 6, 5);
        } else {
          mb.loft([[-0.5, 0.06, 0.07, 0.06], [-0.58, 0.05, 0.05, 0.05], [-0.68, 0.035, 0.035, 0.035], [-0.73, 0.028, 0.026, 0.022]].map(r => ({ c: [0, 0.71 + (r[0] + 0.5) * 0.15, r[0]], rx: r[1], f: r[2], bk: r[3], b: 'head' })), { sides: 12, U: [0, 1, 0], V: [1, 0, 0], capA: true, capB: true });
          K.paint(mb, 'rubber', [20, 16, 14]);
          K.blob(mb, 'head', [0, 0.69, -0.74], [0.022, 0.018, 0.016], 6, 5);
          for (const s of [-1, 1]) K.blob(mb, 'head', [s * 0.04, 0.75, -0.55], [0.011, 0.011, 0.01], 5, 4);
          K.paint(mb, 'fur', dark);
          for (const s of [-1, 1]) mb.loft([[0.0, 0.03, 0.012], [0.06, 0.022, 0.008], [0.12, 0.004, 0.003]].map(r => ({ c: [s * (0.045 + r[0] * 0.25), 0.77 + r[0], -0.47], rx: r[1], f: r[2], bk: r[2], b: 'head' })), { sides: 8, U: [0, 0, -1], V: [1, 0, 0], capA: true, capB: true });
          K.paint(mb, 'fur', col);
          K.tubeAlong(mb, [[0, 0.62, 0.38], [0, 0.6, 0.5], [0, 0.5, 0.62], [0, 0.4, 0.66]], [0.035, 0.03, 0.022, 0.01], { b: 'tail', sides: 6 });
        }
        for (const [n, x, z] of legs) {
          const r = ox ? 1.6 : 1, back = z > 0;
          K.paint(mb, 'fur', col);
          K.tubeAlong(mb, [[0.12 * x, 0.56, z], [0.12 * x, back ? 0.44 : 0.4, z + (back ? 0.05 : 0)], [0.12 * x, 0.28, z]], [0.06 * r, 0.05 * r, 0.035 * r], { bones: [[n + '1'], [n + '1'], [n + '1', n + '2', 0.5]], sides: 8 });
          K.tubeAlong(mb, [[0.12 * x, 0.28, z], [0.12 * x, back ? 0.16 : 0.14, z + (back ? -0.03 : 0)], [0.12 * x, 0.04, z - 0.01]], [0.034 * r, 0.03 * r, 0.026 * r], { b: n + '2', sides: 8 });
          K.paint(mb, ox ? 'rubber' : 'fur', ox ? [36, 30, 26] : dark);
          K.blob(mb, n + '2', [0.12 * x, 0.025, z - 0.03], [0.035 * r, 0.025, 0.05 * r], 6, 5);
        }
      }
      const sc = kind === 'ox' ? 1.85 : kind === 'baibak' ? 0.62 : 1;
      return { def: RIGS.quad, mesh: mb, height: 0.9 * sc };
    },
    plant() {
      const mb = new Z.SkinBuilder(RIGS.plant), K = Z.MODEL_KIT;
      K.paint(mb, 'paintGreen', [120, 160, 84]);
      const st = [];
      for (let k = 0; k <= 8; k++) { const y = -0.1 + k * 0.36; st.push({ c: [Math.sin(k * 0.9) * 0.02, y, 0], rx: 0.085 - k * 0.004, rz: 0.08 - k * 0.004, b: y < 1.2 ? 's1' : y < 1.6 ? 's2' : y < 2.6 ? 's2' : 'head', b2: y < 1.2 ? null : y < 1.6 ? 's1' : y < 2.6 ? null : 's2', w: y >= 1.2 && y < 1.6 ? 0.4 : y >= 2.6 ? 0.4 : 0 }); }
      mb.loft(st, { sides: 9, uvV: 1 });
      for (let i = 0; i < 7; i++) {
        const y = 0.45 + i * 0.34, a = i * 2.4, c = Math.cos(a), s = Math.sin(a), L = 0.62 - i * 0.04;
        const bone = y < 1.4 ? 's1' : 's2';
        K.paint(mb, 'paintGreen', [96 + i * 6, 140 + i * 4, 70]);
        mb.loft([[0.04, 0.02], [0.18, 0.16], [0.36, 0.2], [0.55, 0.12], [0.7, 0.01]].map(r => ({ c: [c * r[0] * L / 0.7, y + Math.sin(r[0] * 4) * 0.08 - r[0] * r[0] * 0.3, s * r[0] * L / 0.7], rx: r[1] * L / 0.7, f: 0.008, bk: 0.008, b: bone })), { sides: 8, U: [0, 1, 0], V: [-s, 0, c], capA: true, capB: true, double: true });
        K.tubeAlong(mb, [[0, y - 0.02, 0], [c * 0.1, y + 0.03, s * 0.1]], [0.02, 0.014], { b: bone, sides: 5 });
      }
      const hy = 2.92, hz = -0.12;
      K.paint(mb, 'paintGreen', [90, 130, 60]);
      mb.loft([[0.06, 0.12], [0.0, 0.5], [-0.05, 0.56], [-0.08, 0.52]].map(r => ({ c: [0, hy, hz + r[0]], rx: r[1], rz: r[1], b: 'head' })), { sides: 22, U: [0, 1, 0], V: [1, 0, 0], capA: true });
      mb.setMat(M('soil'), 0, 0); mb.setTint(118, 90, 64, 255);
      mb.loft([[-0.08, 0.5], [-0.11, 0.42], [-0.12, 0.25], [-0.125, 0.02]].map(r => ({ c: [0, hy, hz + r[0]], rx: r[1], rz: r[1], b: 'head' })), { sides: 22, U: [0, 1, 0], V: [1, 0, 0], capB: true, uvU: 6, uvV: 6 });
      K.paint(mb, 'rubber', [60, 40, 24]);
      for (let i = 0; i < 40; i++) { const r = Math.sqrt(i / 40) * 0.44, a = i * 2.39996; K.blob(mb, 'head', [Math.cos(a) * r, hy + Math.sin(a) * r, hz - 0.125 + r * r * 0.25], [0.02, 0.02, 0.008], 4, 3); }
      for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 20; i++) {
        const a = (i + ring * 0.5) / 20 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), L = ring ? 0.36 : 0.42;
        mb.setMat(M('blank'), 0, 0); mb.setTint(ring ? 238 : 250, ring ? 170 : 196, 40, 255);
        mb.loft([[0.48, 0.02], [0.56, 0.065], [0.48 + L * 0.7, 0.05], [0.48 + L, 0.005]].map(r => ({ c: [c * r[0], hy + s * r[0], hz - 0.08 + (r[0] - 0.48) * 0.25 + ring * 0.02], rx: r[1], f: 0.006, bk: 0.006, b: 'head' })), { sides: 6, U: [0, 0, -1], V: [-s, c, 0], capA: true, capB: true, double: true });
      }
      return { def: RIGS.plant, mesh: mb, height: 3.4 };
    },
    robot(look) {
      const mb = new Z.SkinBuilder(RIGS.robot), K = Z.MODEL_KIT, planner = look && look.planner;
      const body = planner ? [96, 112, 92] : [196, 198, 186], trim = planner ? [60, 66, 58] : [70, 74, 76];
      K.paint(mb, 'rubber', [44, 44, 42]);
      for (const s of [-1, 1]) {
        mb.loft([-0.5, -0.42, 0.42, 0.5].map((z, i) => ({ c: [s * 0.36, 0.2, z], rx: 0.1, f: i === 0 || i === 3 ? 0.11 : 0.19, bk: i === 0 || i === 3 ? 0.11 : 0.19, b: 'base' })), { sides: 14, U: [0, 1, 0], V: [1, 0, 0], n: 3, capA: true, capB: true });
        K.paint(mb, 'metalGrey', [120, 120, 112]);
        for (const z of [-0.33, 0, 0.33]) K.tubeAlong(mb, [[s * 0.47, 0.2, z], [s * 0.49, 0.2, z]], [0.1], { b: 'base', sides: 12, capA: true });
        K.paint(mb, 'rubber', [44, 44, 42]);
      }
      K.paint(mb, 'metalGrey', trim);
      mb.loft([{ c: [0, 0.42, 0], rx: 0.27, f: 0.4, bk: 0.4 }, { c: [0, 0.28, 0], rx: 0.27, f: 0.44, bk: 0.44 }], { b: 'base', sides: 16, n: 4, capA: true });
      mb.loft([{ c: [0, 0.82, 0], rx: 0.1, rz: 0.1 }, { c: [0, 0.42, 0], rx: 0.13, rz: 0.13 }], { b: 'torso', b2: 'base', w: 0.3, sides: 12 });
      K.paint(mb, 'robotPaint', body);
      mb.loft([[1.56, 0.18, 0.15, 0.16], [1.52, 0.27, 0.21, 0.23], [1.38, 0.31, 0.25, 0.26], [1.1, 0.29, 0.25, 0.25], [0.9, 0.24, 0.21, 0.22], [0.8, 0.15, 0.13, 0.14]].map(r => ({ c: [0, r[0], 0], rx: r[1], f: r[2], bk: r[3], b: 'torso' })), { sides: 22, n: 2.6, capA: true, capB: true });
      K.paint(mb, 'paintRed', planner ? [160, 40, 30] : [210, 40, 30]);
      mb.loft([{ c: [0, 1.0, 0], rx: 0.276, f: 0.236, bk: 0.24 }, { c: [0, 0.95, 0], rx: 0.266, f: 0.226, bk: 0.232 }], { b: 'torso', sides: 22, n: 2.6 });
      K.paint(mb, 'gunMetal', [40, 40, 42]);
      K.tubeAlong(mb, [[0, 1.3, -0.24], [0, 1.3, -0.275]], [0.1, 0.09], { b: 'torso', sides: 16 });
      K.paint(mb, 'metalGrey', [150, 150, 140]);
      for (let i = 0; i < 4; i++) mb.boneBox('torso', 0, 1.36 - i * 0.04, -0.277, 0.15, 0.008, 0.006);
      if (planner) {
        for (let i = 0; i < 6; i++) { K.paint(mb, 'glow', i % 3 === 0 ? [255, 80, 40] : i % 3 === 1 ? [120, 255, 120] : [255, 200, 80]); mb.boneBox('torso', -0.15 + i * 0.06, 1.16, -0.252, 0.03, 0.03, 0.01); }
        K.paint(mb, 'paintRed', [200, 40, 30]);
        mb.boneBox('torso', 0, 1.49, -0.21, 0.07, 0.07, 0.02);
      }
      K.paint(mb, 'robotPaint', body);
      K.blob(mb, 'head', [0, 1.68, 0], [0.19, 0.16, 0.19], 14, 9);
      K.paint(mb, 'gunMetal', [30, 30, 32]);
      mb.loft([{ c: [0, 1.715, 0], rx: 0.192, f: 0.192, bk: 0.192 }, { c: [0, 1.665, 0], rx: 0.196, f: 0.196, bk: 0.196 }], { b: 'head', sides: 20, arc: [-1.0, 1.0] });
      K.paint(mb, 'glow', planner ? [120, 255, 140] : [255, 110, 50]);
      mb.loft([{ c: [0, 1.703, 0], rx: 0.197, f: 0.197, bk: 0.197 }, { c: [0, 1.677, 0], rx: 0.199, f: 0.199, bk: 0.199 }], { b: 'head', sides: 20, arc: [-0.7, 0.7] });
      K.paint(mb, 'metalGrey', [90, 90, 90]);
      K.tubeAlong(mb, [[0.1, 1.8, 0.05], [0.12, 2.12, 0.08]], [0.012, 0.005], { b: 'head', sides: 5 });
      K.paint(mb, 'paintRed', [230, 50, 40]);
      K.blob(mb, 'head', [0.12, 2.13, 0.08], [0.018, 0.018, 0.018], 6, 5);
      for (const s of [-1, 1]) {
        const sd = s < 0 ? 'l' : 'r';
        K.paint(mb, 'metalGrey', trim);
        K.blob(mb, sd + 'arm', [s * 0.36, 1.42, 0], [0.09, 0.09, 0.09], 10, 7);
        K.paint(mb, 'robotPaint', body);
        K.tubeAlong(mb, [[s * 0.38, 1.4, 0], [s * 0.42, 1.06, 0]], [0.06, 0.052], { b: sd + 'arm', sides: 10 });
        if (s < 0) { K.paint(mb, 'paintRed', [220, 40, 30]); K.tubeAlong(mb, [[s * 0.39, 1.31, 0], [s * 0.395, 1.22, 0]], [0.066, 0.064], { b: sd + 'arm', sides: 12 }); }
        K.paint(mb, 'metalGrey', trim);
        K.blob(mb, sd + 'farm', [s * 0.42, 1.05, 0], [0.06, 0.06, 0.06], 8, 6);
        K.paint(mb, 'robotPaint', body);
        K.tubeAlong(mb, [[s * 0.42, 1.05, 0], [s * 0.42, 1.05, -0.36]], [0.05, 0.045], { b: sd + 'farm', sides: 10 });
        if (s > 0) {
          K.paint(mb, 'metalGrey', [180, 150, 90]);
          K.tubeAlong(mb, [[0.42, 1.05, -0.36], [0.42, 1.05, -0.44], [0.42, 1.05, -0.47]], [0.05, 0.09, 0.1], { b: 'rfarm', sides: 14, capB: false, loft: { double: true } });
          K.paint(mb, 'glow', [255, 150, 70]);
          K.tubeAlong(mb, [[0.42, 1.05, -0.4], [0.42, 1.05, -0.5]], [0.016, 0.006], { b: 'rfarm', sides: 6 });
        } else {
          K.paint(mb, 'metalGrey', [90, 90, 90]);
          for (const a of [0, 2.1, 4.2]) K.tubeAlong(mb, [[-0.42, 1.05, -0.36], [-0.42 + Math.cos(a) * 0.04, 1.05 + Math.sin(a) * 0.04, -0.42], [-0.42 + Math.cos(a) * 0.025, 1.05 + Math.sin(a) * 0.025, -0.47]], [0.014, 0.011, 0.007], { b: 'lfarm', sides: 5 });
        }
      }
      return { def: RIGS.robot, mesh: mb, height: 2.0 };
    },
    rover() {
      const mb = new Z.SkinBuilder(RIGS.rover), K = Z.MODEL_KIT;
      const hull = [168, 170, 158], dark = [56, 58, 60], olive = [96, 112, 74];
      K.paint(mb, 'robotPaint', hull);
      mb.loft([[1.18, 0.86, 1.02, 1.02], [1.12, 0.88, 1.04, 1.04], [0.8, 0.74, 0.92, 0.92], [0.5, 0.58, 0.78, 0.78], [0.42, 0.5, 0.7, 0.7]].map(r => ({ c: [0, r[0], 0], rx: r[1], f: r[2], bk: r[3], b: 'base' })), { sides: 24, n: 3.2, capA: true, capB: true });
      K.paint(mb, 'metalGrey', [120, 122, 118]);
      mb.loft([{ c: [0, 1.2, 0], rx: 0.9, f: 1.06, bk: 1.06 }, { c: [0, 1.16, 0], rx: 0.9, f: 1.06, bk: 1.06 }], { b: 'base', sides: 24, n: 3.2 });
      K.paint(mb, 'rubber', [44, 44, 44]);
      for (const s of [-1, 1]) for (let i = 0; i < 4; i++) {
        const z = -0.75 + i * 0.5, x = s * 0.98;
        K.paint(mb, 'metalGrey', [96, 98, 96]);
        K.tubeAlong(mb, [[x - s * 0.12, 0.34, z], [x + s * 0.12, 0.34, z]], [0.34], { b: 'base', sides: 16, capB: false, loft: { double: true } });
        K.paint(mb, 'rubber', [40, 40, 40]);
        for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; K.tubeAlong(mb, [[x, 0.34, z], [x, 0.34 + Math.sin(a) * 0.32, z + Math.cos(a) * 0.32]], [0.012], { b: 'base', sides: 4, capB: false }); }
        for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; mb.boneBox('base', x, 0.34 + Math.sin(a) * 0.335 + 0.02, z + Math.cos(a) * 0.335, 0.26, 0.04, 0.06); }
        K.paint(mb, 'metalGrey', dark);
        K.tubeAlong(mb, [[x - s * 0.2, 0.34, z], [x + s * 0.14, 0.34, z]], [0.05], { b: 'base', sides: 8, capA: true });
      }
      K.paint(mb, 'metalGrey', [80, 82, 90]);
      mb.loft([{ c: [0, 1.24, -0.02], rx: 0.84, f: 1.0, bk: 1.0 }, { c: [0, 1.2, -0.02], rx: 0.86, f: 1.02, bk: 1.02 }], { b: 'lid', sides: 24, n: 3.2, capA: true });
      K.paint(mb, 'glass', [60, 80, 140]);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) mb.boneBox('lid', -0.58 + i * 0.39, 1.255, -0.65 + j * 0.62, 0.36, 0.01, 0.58);
      K.paint(mb, 'paintGreen', olive);
      mb.loft([{ c: [0, 1.82, 0.1], rx: 0.32, f: 0.3, bk: 0.32 }, { c: [0, 1.36, 0.1], rx: 0.36, f: 0.34, bk: 0.36 }], { b: 'turret', sides: 16, n: 3, capA: true });
      K.paint(mb, 'gunMetal', [52, 54, 56]);
      for (let i = 0; i < 6; i++) { const y = 1.5 + Math.floor(i / 3) * 0.13, x = -0.62 + (i % 3) * 0.13; K.tubeAlong(mb, [[x, y, 0.3], [x, y, -0.32]], [0.055], { b: 'turret', sides: 10, capB: false, loft: { double: true } }); }
      mb.boneBox('turret', -0.49, 1.42, 0.0, 0.42, 0.34, 0.66);
      K.tubeAlong(mb, [[0.15, 1.55, -0.2], [0.15, 1.55, -1.1]], [0.035, 0.03], { b: 'turret', sides: 8 });
      K.tubeAlong(mb, [[0.15, 1.55, -1.0], [0.15, 1.55, -1.14]], [0.05], { b: 'turret', sides: 8, capB: false, loft: { double: true } });
      K.paint(mb, 'metalGrey', [190, 190, 180]);
      K.tubeAlong(mb, [[0.1, 1.8, 0.3], [0.13, 2.6, 0.34]], [0.012, 0.006], { b: 'turret', sides: 4 });
      K.tubeAlong(mb, [[-0.55, 1.15, -0.65], [-0.62, 1.9, -0.72]], [0.012, 0.006], { b: 'base', sides: 4 });
      K.tubeAlong(mb, [[0.6, 1.15, 0.0], [0.64, 1.5, 0.05], [0.66, 1.5, 0.05]], [0.02, 0.02, 0.2], { b: 'base', sides: 10, capB: false, loft: { double: true } });
      K.paint(mb, 'glass', [30, 40, 50]);
      for (const x of [-0.36, -0.2, 0.2, 0.36]) K.tubeAlong(mb, [[x, 0.98, -0.98], [x, 0.98, -1.04]], [0.05, 0.045], { b: 'base', sides: 10 });
      K.paint(mb, 'paintRed', [200, 40, 30]);
      mb.boneBox('base', 0, 0.78, -0.88, 0.22, 0.18, 0.02);
      return { def: RIGS.rover, mesh: mb, height: 1.9 };
    },
    agregat(look) {
      const mb = new Z.SkinBuilder(RIGS.agregat), K = Z.MODEL_KIT;
      const paintCol = [214, 148, 46], steel = [110, 112, 112];
      K.paint(mb, 'metalGrey', [70, 72, 72]);
      mb.loft([{ c: [0, 0.34, 0], rx: 0.28, f: 0.32, bk: 0.28 }, { c: [0, 0.22, 0], rx: 0.32, f: 0.36, bk: 0.32 }], { b: 'base', sides: 18, n: 2.4, capA: true, capB: true });
      K.paint(mb, 'rubber', [40, 40, 40]);
      mb.loft([{ c: [0, 0.25, 0], rx: 0.335, f: 0.375, bk: 0.335 }, { c: [0, 0.2, 0], rx: 0.335, f: 0.375, bk: 0.335 }], { b: 'base', sides: 18, n: 2.4 });
      for (const [x, z, r] of [[-0.3, 0.18, 0.15], [0.3, 0.18, 0.15], [0, -0.28, 0.1]]) {
        K.paint(mb, 'rubber', [38, 38, 38]);
        K.tubeAlong(mb, [[x - 0.05, r, z], [x + 0.05, r, z]], [r], { b: 'base', sides: 14, capA: true });
        K.paint(mb, 'metalGrey', steel);
        K.tubeAlong(mb, [[x - 0.055, r, z], [x + 0.055, r, z]], [r * 0.45], { b: 'base', sides: 10, capA: true });
      }
      K.paint(mb, 'rubber', [50, 50, 50]);
      const boot = [];
      for (let i = 0; i <= 8; i++) boot.push({ c: [0, 0.36 + i * 0.05, 0], rx: i % 2 ? 0.085 : 0.1, rz: i % 2 ? 0.085 : 0.1, b: i < 4 ? 'base' : 'torso', b2: i < 4 ? 'torso' : 'base', w: 0.3 });
      mb.loft(boot, { sides: 12 });
      K.paint(mb, 'robotPaint', paintCol);
      mb.loft([[1.33, 0.16, 0.14, 0.15], [1.3, 0.25, 0.22, 0.23], [1.18, 0.28, 0.25, 0.25], [0.96, 0.28, 0.25, 0.25], [0.84, 0.25, 0.22, 0.22], [0.78, 0.15, 0.13, 0.13]].map(r => ({ c: [0, r[0], 0], rx: r[1], f: r[2], bk: r[3], b: 'torso' })), { sides: 22, n: 2.3, capA: true, capB: true });
      mb.setMat(Z.MAT.chitinStripes, 0, 0); mb.setTint(150, 150, 150, 255);
      mb.loft([{ c: [0, 0.9, 0], rx: 0.287, f: 0.257, bk: 0.257 }, { c: [0, 0.83, 0], rx: 0.262, f: 0.232, bk: 0.232 }], { b: 'torso', sides: 22, n: 2.3, uvU: 6 });
      K.paint(mb, 'metalGrey', steel);
      for (const y of [1.06, 1.22]) mb.loft([{ c: [0, y + 0.012, 0], rx: 0.288, f: 0.258, bk: 0.258 }, { c: [0, y - 0.012, 0], rx: 0.288, f: 0.258, bk: 0.258 }], { b: 'torso', sides: 22, n: 2.3 });
      K.paint(mb, 'gunMetal', [44, 46, 46]);
      mb.boneBox('torso', 0, 1.2, -0.255, 0.24, 0.16, 0.03);
      K.paint(mb, 'glow', [120, 255, 120]);
      K.tubeAlong(mb, [[-0.06, 1.13, -0.27], [-0.06, 1.13, -0.275]], [0.026], { b: 'torso', sides: 10 });
      K.paint(mb, 'glow', [255, 180, 60]);
      K.tubeAlong(mb, [[0.06, 1.13, -0.27], [0.06, 1.13, -0.275]], [0.026], { b: 'torso', sides: 10 });
      K.paint(mb, 'paintRed', [200, 30, 26]);
      mb.boneBox('torso', 0, 1.02, -0.252, 0.06, 0.06, 0.01);
      if (look && look.tie) {
        K.paint(mb, 'paintRed', [230, 36, 30]);
        K.blob(mb, 'torso', [0, 1.27, -0.215], [0.03, 0.022, 0.02], 6, 5);
        for (const s of [-1, 1]) K.tubeAlong(mb, [[0, 1.26, -0.22], [s * 0.035, 1.12, -0.258], [s * 0.05, 1.05, -0.262]], [0.016, 0.02, 0.01], { b: 'torso', sides: 4 });
      }
      K.paint(mb, 'rubber', [50, 50, 50]);
      const neck = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5; neck.push({ c: [0, Z.lerp(1.3, 1.48, t), Z.lerp(-0.06, -0.13, t)], rx: i % 2 ? 0.045 : 0.055, rz: i % 2 ? 0.045 : 0.055, b: t < 0.5 ? 'neck' : 'head' }); }
      mb.loft(neck, { sides: 10 });
      K.paint(mb, 'robotPaint', paintCol);
      mb.loft([-0.03, -0.06, -0.24, -0.27].map((z, i) => ({ c: [0, 1.58, z], rx: i === 0 || i === 3 ? 0.13 : 0.16, f: i === 0 || i === 3 ? 0.09 : 0.115, bk: i === 0 || i === 3 ? 0.09 : 0.115, b: 'head' })), { sides: 18, U: [0, 1, 0], V: [1, 0, 0], n: 4, capA: true, capB: true });
      K.paint(mb, 'glow', [255, 176, 70]);
      mb.boneBox('head', 0, 1.65, -0.271, 0.21, 0.14, 0.006);
      K.paint(mb, 'gunMetal', [24, 22, 20]);
      for (const s of [-1, 1]) mb.boneBox('head', s * 0.048, 1.62, -0.276, 0.04, 0.032, 0.004);
      mb.boneBox('head', 0, 1.548, -0.276, 0.08, 0.008, 0.004);
      K.paint(mb, 'metalGrey', [90, 90, 90]);
      for (const s of [-1, 1]) {
        K.tubeAlong(mb, [[s * 0.15, 1.62, -0.15], [s * 0.18, 1.62, -0.15]], [0.03], { b: 'head', sides: 10, capA: true });
        K.tubeAlong(mb, [[s * 0.1, 1.69, -0.12], [s * 0.13, 1.86, -0.1]], [0.008, 0.004], { b: 'head', sides: 5 });
      }
      for (const s of [-1, 1]) {
        const sd = s < 0 ? 'l' : 'r';
        K.paint(mb, 'metalGrey', steel);
        K.blob(mb, sd + 'arm', [s * 0.33, 1.08, -0.08], [0.075, 0.075, 0.075], 10, 7);
        K.paint(mb, 'robotPaint', paintCol);
        K.tubeAlong(mb, [[s * 0.35, 1.05, -0.1], [s * 0.4, 0.76, -0.29]], [0.05, 0.042], { b: sd + 'arm', sides: 10 });
        K.paint(mb, 'metalGrey', [170, 170, 165]);
        K.tubeAlong(mb, [[s * 0.4, 1.0, -0.04], [s * 0.44, 0.8, -0.24]], [0.012], { b: sd + 'arm', sides: 5, capA: true });
        K.paint(mb, 'metalGrey', steel);
        K.blob(mb, sd + 'farm', [s * 0.4, 0.75, -0.3], [0.05, 0.05, 0.05], 8, 6);
        K.paint(mb, 'robotPaint', paintCol);
        K.tubeAlong(mb, [[s * 0.4, 0.75, -0.3], [s * 0.4, 0.75, -0.6]], [0.042, 0.036], { b: sd + 'farm', sides: 10 });
        K.paint(mb, 'metalGrey', [80, 82, 82]);
        K.tubeAlong(mb, [[s * 0.4, 0.75, -0.6], [s * 0.4, 0.75, -0.66]], [0.05, 0.05], { b: sd + 'farm', sides: 10, capA: true });
        for (const k of [-1, 1]) K.tubeAlong(mb, [[s * 0.4, 0.75 + k * 0.03, -0.66], [s * 0.4, 0.75 + k * 0.06, -0.72], [s * 0.4, 0.75 + k * 0.035, -0.78]], [0.016, 0.013, 0.009], { b: sd + 'farm', sides: 5 });
      }
      return { def: RIGS.agregat, mesh: mb, height: 1.6 };
    }
  };
  Z.Creatures = B;

  const legCycle = (P, prefix, n, ph, amp, lift) => {
    for (let i = 0; i < n; i++) for (const s of [-1, 1]) {
      const sd = s < 0 ? 'l' : 'r';
      const tri = (i % 2 === 0) === (s < 0) ? 0 : Math.PI;
      const a = Math.sin(ph + tri), up = Math.max(0, Math.cos(ph + tri));
      P.set(prefix + i + sd + 'a', 0, a * amp * s, up * lift * s);
      P.set(prefix + i + sd + 'b', 0, 0, -up * lift * 0.6 * s);
    }
  };

  const QUAD_SCALE = { baibak: 0.62, ox: 1.85 };
  const root = (a, ctx, extraY = 0) => M4.trs(a.x, a.y + extraY, a.z, -a.yaw, 0, 0, ctx.scale || 1);
  const dead = (P, a, ctx, flip) => {
    const k = Z.clamp(a.anim.t / 0.6, 0, 1);
    P.set(P.def.bones[0].name, 0, 0, flip ? Math.PI * k : 0.4 * k);
    P.move(P.def.bones[0].name, 0, flip ? -0.2 * k : -0.1 * k, 0);
    const R = M4.trs(a.x, a.y, a.z, -a.yaw, 0, 0, ctx.scale || 1);
    P.solve(R);
    return R;
  };

  Object.assign(Z.Anim, {
    beetle(P, a, t, ctx) {
      P.reset();
      if (a.dead) return dead(P, a, ctx, true);
      const sp = ctx.speed || 0;
      a.anim.phase += 0;
      legCycle(P, 'g', 3, a.anim.phase * 2, sp > 0.2 ? 0.35 : 0.04 * Math.sin(t * 2), sp > 0.2 ? 0.25 : 0);
      P.move('body', 0, Math.abs(Math.sin(a.anim.phase * 2)) * 0.03, 0);
      if (a.anim.swing > 0) { const k = Math.sin((1 - a.anim.swing) * Math.PI); P.set('body', k * 0.3, 0, 0); P.set('head', k * 0.4, 0, 0); }
      P.solve(root(a, ctx));
      return P;
    },
    cricket(P, a, t, ctx) {
      P.reset();
      if (a.dead) return dead(P, a, ctx, true);
      const sp = ctx.speed || 0;
      legCycle(P, 'g', 2, a.anim.phase * 2, sp > 0.2 ? 0.3 : 0, 0.2);
      const dig = a.ai && a.ai.phase === 'dig' ? Math.sin(t * 20) * 0.5 : 0;
      P.set('fl', dig + (a.anim.swing > 0 ? Math.sin((1 - a.anim.swing) * Math.PI) * 0.9 : 0), 0, 0);
      P.set('fr', -dig + (a.anim.swing > 0 ? Math.sin((1 - a.anim.swing) * Math.PI) * 0.9 : 0), 0, 0);
      const sink = a.ai && a.ai.phase === 'dig' ? -Z.clamp(a.ai.pt, 0, 1) * 0.8 : 0;
      P.solve(root(a, ctx, sink));
      return P;
    },
    gull(P, a, t, ctx) {
      P.reset();
      if (a.dead) return dead(P, a, ctx, false);
      const diving = a.ai && a.ai.diving;
      const flap = diving ? 0 : Math.sin(t * 9 + (a.seed || 0)) * 0.7;
      P.set('wl1', 0, diving ? 0.9 : 0, flap * -1 - (diving ? 0.3 : 0));
      P.set('wr1', 0, diving ? -0.9 : 0, flap + (diving ? 0.3 : 0));
      P.set('wl2', 0, diving ? 0.6 : 0, flap * -0.5);
      P.set('wr2', 0, diving ? -0.6 : 0, flap * 0.5);
      P.set('body', diving ? 0.6 : -0.05 + Math.max(-0.4, Math.min(0.4, -(a.vy || 0) * 0.08)), 0, 0);
      P.solve(root(a, ctx));
      return P;
    },
    fish(P, a, t, ctx) {
      P.reset();
      if (a.dead) return dead(P, a, ctx, true);
      const sp = ctx.speed || 0;
      const f = t * (sp > 0.3 ? 6 : 2), amp = sp > 0.3 ? 0.35 : 0.12;
      P.set('s1', 0, Math.sin(f) * amp * 0.5, 0);
      P.set('s2', 0, Math.sin(f - 0.8) * amp, 0);
      P.set('s3', 0, Math.sin(f - 1.6) * amp * 1.2, 0);
      P.set('tail', 0, Math.sin(f - 2.4) * amp * 1.4, 0);
      P.set('finl', 0, 0, Math.sin(t * 5) * 0.3);
      P.set('finr', 0, 0, -Math.sin(t * 5) * 0.3);
      P.set('jaw', a.anim.swing > 0 ? Math.sin((1 - a.anim.swing) * Math.PI) * 0.5 : 0.05, 0, 0);
      const lurkY = a.lurking && a.inWater ? -0.45 : 0;
      P.solve(root(a, ctx, lurkY));
      return P;
    },
    bird(P, a, t, ctx) {
      P.reset();
      if (a.dead) return dead(P, a, ctx, false);
      const sp = ctx.speed || 0, ph = a.anim.phase * 1.6;
      const amp = sp > 0.2 ? 0.6 : 0;
      P.set('ll1', Math.sin(ph) * amp, 0, 0); P.set('lr1', -Math.sin(ph) * amp, 0, 0);
      P.set('ll2', -Math.max(0, Math.sin(ph + 1)) * amp, 0, 0); P.set('lr2', -Math.max(0, -Math.sin(ph + 1)) * amp, 0, 0);
      P.set('neck', Math.sin(ph * 2) * 0.15 * (sp > 0.2 ? 1 : 0.3) + (a.anim.swing > 0 ? Math.sin((1 - a.anim.swing) * Math.PI) * 0.9 : 0), 0, 0);
      const flap = a.combat ? Math.sin(t * 14) * 0.5 : 0;
      P.set('wl', 0, 0, -0.1 - Math.abs(flap)); P.set('wr', 0, 0, 0.1 + Math.abs(flap));
      P.solve(root(a, ctx, Math.abs(Math.sin(ph)) * 0.04));
      return P;
    },
    quad(P, a, t, ctx0) {
      P.reset();
      const ctx = Object.assign({}, ctx0, { scale: (ctx0.scale || 1) * (QUAD_SCALE[a.look && a.look.kind] || 1) });
      if (a.dead) return dead(P, a, ctx, false);
      const sp = ctx.speed || 0, ph = a.anim.phase * 1.4;
      const amp = Math.min(0.7, sp * 0.12);
      P.set('fl1', Math.sin(ph) * amp, 0, 0); P.set('br1', Math.sin(ph) * amp, 0, 0);
      P.set('fr1', -Math.sin(ph) * amp, 0, 0); P.set('bl1', -Math.sin(ph) * amp, 0, 0);
      P.set('fl2', Math.max(0, Math.cos(ph)) * amp, 0, 0); P.set('fr2', Math.max(0, -Math.cos(ph)) * amp, 0, 0);
      P.set('tail', 0.3, Math.sin(t * 6) * 0.4, 0);
      P.set('head', a.anim.swing > 0 ? Math.sin((1 - a.anim.swing) * Math.PI) * 0.5 : Math.sin(t * 0.7 + (a.seed || 0)) * 0.08, 0, 0);
      P.solve(root(a, ctx, Math.abs(Math.sin(ph)) * 0.03 * Math.min(1, sp / 3)));
      return P;
    },
    plant(P, a, t, ctx) {
      P.reset();
      if (a.dead) { const k = Z.clamp(a.anim.t / 0.8, 0, 1); P.set('s1', k * 1.2, 0, 0); P.solve(M4.trs(a.x, a.y, a.z, -a.yaw, 0, 0, 1)); return P; }
      const sw = Math.sin(t * 0.9 + (a.seed || 0)) * 0.04;
      P.set('s1', sw, 0, sw * 0.5);
      P.set('s2', sw, 0, 0);
      if (a.anim.fire > 0) P.add('head', -a.anim.fire * 0.12, 0, 0);
      P.solve(M4.trs(a.x, a.y, a.z, -a.yaw, 0, 0, 1));
      return P;
    },
    robot(P, a, t, ctx) {
      P.reset();
      if (a.dead) return dead(P, a, ctx, false);
      P.set('torso', 0, 0, 0);
      P.set('head', 0, Math.sin(t * 0.5) * 0.2, 0);
      const aim = ctx.aim || a.combat;
      P.set('rarm', aim ? -(ctx.aimPitch || 0) : 0.2, 0, 0);
      P.set('larm', aim ? 0.3 : 0.2, 0, 0);
      if (a.anim.fire > 0) P.add('rarm', 0.15 * a.anim.fire, 0, 0);
      P.solve(root(a, ctx, Math.sin(t * 8) * 0.008 * Math.min(1, (ctx.speed || 0))));
      return P;
    },
    rover(P, a, t, ctx) {
      P.reset();
      if (a.dead) { P.set('lid', 0.3, 0, 0); P.solve(M4.trs(a.x, a.y - 0.15, a.z, -a.yaw, 0, 0.12, 1)); return P; }
      P.set('lid', -0.5, 0, 0);
      P.set('turret', 0, Math.sin(t * 0.3) * (a.combat ? 0 : 0.5), 0);
      P.solve(root(a, ctx, Math.sin(t * 6) * 0.01 * Math.min(1, (ctx.speed || 0))));
      return P;
    },
    agregat(P, a, t, ctx) {
      P.reset();
      if (a.dead) return dead(P, a, ctx, false);
      P.set('head', 0, Math.sin(t * 0.6 + (a.seed || 0)) * 0.4, 0);
      const sw = a.anim.swing > 0 ? Math.sin((1 - a.anim.swing) * Math.PI) : 0;
      P.set('rarm', -sw * 0.8, 0, 0); P.set('larm', Math.sin(t * 1.3) * 0.1, 0, 0);
      P.solve(root(a, ctx));
      return P;
    }
  });
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
