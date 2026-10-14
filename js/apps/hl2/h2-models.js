(function (H) {
  'use strict';

  const M4 = H.M4;
  const PI = Math.PI;

  class Batch {
    constructor() {
      this.groups = new Map();
      this.lightFn = null;
      this.tint = null;
      this.blend = 'opaque';
      this.alpha = 1;
      this.count = 0;
    }
    reset() { for (const g of this.groups.values()) g.data.length = 0; this.count = 0; }
    group(tex, blend) {
      const key = blend + '|' + tex;
      let g = this.groups.get(key);
      if (!g) { g = { tex, blend, data: [] }; this.groups.set(key, g); }
      return g;
    }
    shade(p, n, col) {
      let c;
      if (this.lightFn) c = this.lightFn(p, n);
      else c = [1, 1, 1];
      if (col) c = [c[0] * col[0], c[1] * col[1], c[2] * col[2]];
      if (this.tint) c = [c[0] * this.tint[0], c[1] * this.tint[1], c[2] * this.tint[2]];
      return c;
    }
    quad(tex, p0, p1, p2, p3, uv, n, col, o = {}) {
      const g = this.group(tex, o.blend || this.blend);
      const a = o.alpha !== undefined ? o.alpha : this.alpha;
      const d = g.data;
      const pts = [p0, p1, p2, p3];
      const cs = o.flat ? null : pts.map(p => this.shade(p, n, col));
      const flatC = o.flat ? (col || [1, 1, 1]) : null;
      const idx = [0, 1, 2, 0, 2, 3];
      for (const k of idx) {
        const p = pts[k];
        const c = flatC || cs[k];
        d.push(p.x, p.y, p.z, uv[k * 2], uv[k * 2 + 1], c[0], c[1], c[2], a, n.x, n.y, n.z);
      }
      this.count += 6;
    }
    tri(tex, p0, p1, p2, uv, n, col, o = {}) {
      const g = this.group(tex, o.blend || this.blend);
      const a = o.alpha !== undefined ? o.alpha : this.alpha;
      const d = g.data;
      const pts = [p0, p1, p2];
      for (let k = 0; k < 3; k++) {
        const p = pts[k];
        const c = o.flat ? (col || [1, 1, 1]) : this.shade(p, n, col);
        d.push(p.x, p.y, p.z, uv[k * 2], uv[k * 2 + 1], c[0], c[1], c[2], a, n.x, n.y, n.z);
      }
      this.count += 3;
    }
    box(m, x1, y1, z1, x2, y2, z2, tex, o = {}) {
      const T = typeof tex === 'string' ? { top: tex, bottom: tex, side: tex, front: tex, back: tex } : Object.assign({ top: tex.side, bottom: tex.side, front: tex.side, back: tex.side }, tex);
      const P = (x, y, z) => M4.point(m, x, y, z);
      const N = (x, y, z) => H.vnorm(M4.dir(m, x, y, z));
      const c = [P(x1, y1, z1), P(x2, y1, z1), P(x2, y2, z1), P(x1, y2, z1), P(x1, y1, z2), P(x2, y1, z2), P(x2, y2, z2), P(x1, y2, z2)];
      const col = o.col || null;
      const ws = o.world ? o.world : 0;
      const U = (a, b) => (ws ? [0, 0, a / ws, 0, a / ws, b / ws, 0, b / ws] : [0, 1, 1, 1, 1, 0, 0, 0]);
      const W = x2 - x1, Hh = y2 - y1, D = z2 - z1;
      const fl = !!o.flat;
      if (!o.skip || !o.skip.includes('back')) this.quad(T.back, c[1], c[0], c[3], c[2], U(W, Hh), N(0, 0, -1), col, { flat: fl, blend: o.blend, alpha: o.alpha });
      if (!o.skip || !o.skip.includes('front')) this.quad(T.front, c[4], c[5], c[6], c[7], U(W, Hh), N(0, 0, 1), col, { flat: fl, blend: o.blend, alpha: o.alpha });
      if (!o.skip || !o.skip.includes('left')) this.quad(T.side, c[5], c[1], c[2], c[6], U(D, Hh), N(1, 0, 0), col, { flat: fl, blend: o.blend, alpha: o.alpha });
      if (!o.skip || !o.skip.includes('right')) this.quad(T.side, c[0], c[4], c[7], c[3], U(D, Hh), N(-1, 0, 0), col, { flat: fl, blend: o.blend, alpha: o.alpha });
      if (!o.skip || !o.skip.includes('top')) this.quad(T.top, c[7], c[6], c[2], c[3], U(W, D), N(0, 1, 0), col, { flat: fl, blend: o.blend, alpha: o.alpha });
      if (!o.skip || !o.skip.includes('bottom')) this.quad(T.bottom, c[0], c[1], c[5], c[4], U(W, D), N(0, -1, 0), col, { flat: fl, blend: o.blend, alpha: o.alpha });
    }
    cyl(m, r1, r2, y1, y2, seg, tex, o = {}) {
      const col = o.col || null;
      const capTex = o.cap || tex;
      const pts = [];
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * PI * 2;
        pts.push({ a, c: Math.cos(a), s: Math.sin(a) });
      }
      for (let i = 0; i < seg; i++) {
        const A = pts[i], B = pts[i + 1];
        const p0 = M4.point(m, A.c * r1, y1, A.s * r1), p1 = M4.point(m, B.c * r1, y1, B.s * r1);
        const p2 = M4.point(m, B.c * r2, y2, B.s * r2), p3 = M4.point(m, A.c * r2, y2, A.s * r2);
        const mid = (A.a + B.a) / 2;
        const n = H.vnorm(M4.dir(m, Math.cos(mid), (r1 - r2) / Math.max(0.01, y2 - y1), Math.sin(mid)));
        const u0 = i / seg * (o.uRep || 1), u1 = (i + 1) / seg * (o.uRep || 1);
        this.quad(tex, p1, p0, p3, p2, [u1, 1, u0, 1, u0, 0, u1, 0], n, col, { flat: o.flat, blend: o.blend, alpha: o.alpha });
      }
      if (o.caps !== false) {
        const ct = M4.point(m, 0, y2, 0), cb = M4.point(m, 0, y1, 0);
        const nt = H.vnorm(M4.dir(m, 0, 1, 0)), nb = H.vnorm(M4.dir(m, 0, -1, 0));
        for (let i = 0; i < seg; i++) {
          const A = pts[i], B = pts[i + 1];
          if (r2 > 0.001) this.tri(capTex, ct, M4.point(m, B.c * r2, y2, B.s * r2), M4.point(m, A.c * r2, y2, A.s * r2), [0.5, 0.5, 0.5 + B.c * 0.5, 0.5 + B.s * 0.5, 0.5 + A.c * 0.5, 0.5 + A.s * 0.5], nt, col, { flat: o.flat, blend: o.blend, alpha: o.alpha });
          if (r1 > 0.001) this.tri(capTex, cb, M4.point(m, A.c * r1, y1, A.s * r1), M4.point(m, B.c * r1, y1, B.s * r1), [0.5, 0.5, 0.5 + A.c * 0.5, 0.5 + A.s * 0.5, 0.5 + B.c * 0.5, 0.5 + B.s * 0.5], nb, col, { flat: o.flat, blend: o.blend, alpha: o.alpha });
        }
      }
    }
    sphere(m, r, seg, tex, o = {}) {
      const rings = Math.max(3, Math.floor(seg / 2));
      const col = o.col || null;
      const sy = o.sy || 1;
      for (let j = 0; j < rings; j++) {
        const a0 = -PI / 2 + PI * j / rings, a1 = -PI / 2 + PI * (j + 1) / rings;
        for (let i = 0; i < seg; i++) {
          const b0 = PI * 2 * i / seg, b1 = PI * 2 * (i + 1) / seg;
          const v = (a, b) => ({ x: Math.cos(a) * Math.cos(b), y: Math.sin(a), z: Math.cos(a) * Math.sin(b) });
          const q = [v(a0, b0), v(a0, b1), v(a1, b1), v(a1, b0)];
          const pw = q.map(p => M4.point(m, p.x * r, p.y * r * sy, p.z * r));
          const mid = v((a0 + a1) / 2, (b0 + b1) / 2);
          const n = H.vnorm(M4.dir(m, mid.x, mid.y, mid.z));
          this.quad(tex, pw[1], pw[0], pw[3], pw[2], [(i + 1) / seg, 1 - j / rings, i / seg, 1 - j / rings, i / seg, 1 - (j + 1) / rings, (i + 1) / seg, 1 - (j + 1) / rings], n, col, { flat: o.flat, blend: o.blend, alpha: o.alpha });
        }
      }
    }
    billboard(p, size, tex, col, blend, cam, rot = 0, alpha = 1) {
      const cr = Math.cos(rot), sr = Math.sin(rot);
      const rx = (cam.right.x * cr + cam.up.x * sr) * size, ry = (cam.right.y * cr + cam.up.y * sr) * size, rz = (cam.right.z * cr + cam.up.z * sr) * size;
      const ux = (cam.up.x * cr - cam.right.x * sr) * size, uy = (cam.up.y * cr - cam.right.y * sr) * size, uz = (cam.up.z * cr - cam.right.z * sr) * size;
      const q = [
        { x: p.x - rx - ux, y: p.y - ry - uy, z: p.z - rz - uz }, { x: p.x + rx - ux, y: p.y + ry - uy, z: p.z + rz - uz },
        { x: p.x + rx + ux, y: p.y + ry + uy, z: p.z + rz + uz }, { x: p.x - rx + ux, y: p.y - ry + uy, z: p.z - rz + uz }
      ];
      this.quad(tex, q[0], q[1], q[2], q[3], [0, 1, 1, 1, 1, 0, 0, 0], cam.back, col, { flat: true, blend, alpha });
    }
    streak(p, v, size, tex, col, blend, cam, alpha = 1) {
      const a = p, b = H.vadd(p, v, -0.05);
      this.beam(a, b, size, tex, col, blend, cam, alpha);
    }
    beam(a, b, w, tex, col, blend, cam, alpha = 1) {
      const d = H.vsub(b, a);
      const toCam = H.vsub(cam.pos, a);
      let side = H.vcross(d, toCam);
      const l = H.vlen(side);
      if (l < 1e-6) return;
      side = H.vscale(side, w / l);
      const q0 = H.vadd(a, side, -1), q1 = H.vadd(a, side, 1), q2 = H.vadd(b, side, 1), q3 = H.vadd(b, side, -1);
      this.quad(tex, q0, q1, q2, q3, [0, 0, 0, 1, 1, 1, 1, 0], cam.back, col, { flat: true, blend, alpha });
    }
  }

  const SKINS = {
    metrocop: { face: 'face_cop', head: 'cop', torso: 'cop', arms: 'cop', legs: 'cop', feet: 'boots', hands: 'cloth_black', helmet: 'cop' },
    soldier: { face: 'face_soldier', head: 'soldier', torso: 'soldier', arms: 'soldier', legs: 'soldier', feet: 'boots', hands: 'cloth_black', bulk: 1.12, helmet: 'soldier' },
    elite: { face: 'face_elite', head: 'elite', torso: 'elite', arms: 'elite', legs: 'elite', feet: 'boots', hands: 'cloth_black', bulk: 1.12, helmet: 'elite' },
    prisonguard: { face: 'face_guard', head: 'prisonguard', torso: 'prisonguard', arms: 'prisonguard', legs: 'prisonguard', feet: 'boots', hands: 'cloth_black', bulk: 1.1, helmet: 'prisonguard' },
    rebel: { face: 'face_rebel', head: 'hair_brown', torso: 'cloth_green', arms: 'cloth_green', legs: 'cloth_denim', feet: 'boots', hands: 'skin', vest: 'cloth_brown' },
    medic: { face: 'face_rebel2', head: 'hair_dark', torso: 'cloth_white', arms: 'cloth_blue', legs: 'cloth_denim', feet: 'boots', hands: 'skin_dark', cross: true },
    citizen: { face: 'face_citizen', head: 'hair_brown', torso: 'cloth_blue', arms: 'cloth_blue', legs: 'cloth_blue', feet: 'boots', hands: 'skin' },
    alyx: { face: 'face_alyx', head: 'hair_dark', torso: 'cloth_brown', arms: 'cloth_brown', legs: 'cloth_denim', feet: 'boots', hands: 'skin_dark', slim: 0.88 },
    barney: { face: 'face_barney', head: 'hair_brown', torso: 'cloth_blue', arms: 'cloth_blue', legs: 'cop', feet: 'boots', hands: 'skin', vest: 'cop' },
    kleiner: { face: 'face_kleiner', head: 'hair_grey', torso: 'cloth_white', arms: 'cloth_white', legs: 'cloth_grey', feet: 'cloth_black', hands: 'skin', coat: 'cloth_white' },
    eli: { face: 'face_eli', head: 'hair_grey', torso: 'cloth_brown', arms: 'cloth_brown', legs: 'cloth_grey', feet: 'cloth_black', hands: 'skin_dark' },
    mossman: { face: 'face_mossman', head: 'hair_dark', torso: 'cloth_brown', arms: 'cloth_white', legs: 'cloth_black', feet: 'cloth_black', hands: 'skin', slim: 0.9 },
    breen: { face: 'face_breen', head: 'hair_grey', torso: 'cloth_grey', arms: 'cloth_grey', legs: 'cloth_grey', feet: 'cloth_black', hands: 'skin' },
    gman: { face: 'face_gman', head: 'hair_dark', torso: 'cloth_black', arms: 'cloth_black', legs: 'cloth_black', feet: 'cloth_black', hands: 'skin', slim: 0.92 },
    grigori: { face: 'face_grigori', head: 'hair_dark', torso: 'cloth_black', arms: 'cloth_black', legs: 'cloth_black', feet: 'cloth_black', hands: 'skin', coat: 'cloth_black' },
    zombie: { face: 'face_zombie', head: 'crab', torso: 'zombie_body', arms: 'skin_pale', legs: 'cloth_grey', feet: 'boots', hands: 'skin_pale', crab: 'crab', zombie: true },
    fastzombie: { face: 'skin_pale', head: 'crab', torso: 'skin_pale', arms: 'skin_pale', legs: 'skin_pale', feet: 'skin_pale', hands: 'skin_pale', crab: 'crab', zombie: true, slim: 0.72 },
    poisonzombie: { face: 'face_zombie', head: 'crab_dark', torso: 'skin_pale', arms: 'skin_pale', legs: 'cloth_grey', feet: 'boots', hands: 'skin_pale', crab: 'crab_dark', zombie: true, bulk: 1.45, sacs: true },
    vort: { face: 'face_vort', head: 'vort', torso: 'vort', arms: 'vort', legs: 'vort', feet: 'vort', hands: 'vort', vort: true }
  };

  function part(parent, px, py, pz, yaw, pitch, roll) { return M4.mul(parent, M4.trs(px, py, pz, yaw, pitch, roll)); }

  function weaponModel(b, m, w) {
    if (!w) return;
    if (w === 'baton') { b.box(m, -0.02, -0.02, 0, 0.02, 0.02, 0.5, 'gun'); b.box(m, -0.025, -0.025, 0.42, 0.025, 0.025, 0.5, 'light_blue', { flat: true, col: [1, 1, 1] }); return; }
    if (w === 'npcpistol' || w === 'alyxgun') { b.box(m, -0.02, -0.03, -0.02, 0.02, 0.03, 0.2, 'gun'); b.box(m, -0.018, -0.12, 0, 0.018, 0, 0.05, 'gun'); return; }
    if (w === 'npcshotgun') { b.box(m, -0.03, -0.04, -0.25, 0.03, 0.03, 0.6, 'gun'); b.box(m, -0.035, -0.05, 0.1, 0.035, -0.0, 0.3, 'wood'); return; }
    if (w === 'npcar2') { b.box(m, -0.035, -0.05, -0.3, 0.035, 0.06, 0.55, 'synth_dark'); b.box(m, -0.02, -0.02, 0.55, 0.02, 0.02, 0.7, 'gun'); b.box(m, -0.02, 0.06, 0.05, 0.02, 0.09, 0.2, 'light_blue', { flat: true, col: [1, 1, 1] }); return; }
    if (w === 'rpg_npc') { b.cyl(M4.mul(m, M4.trs(0, 0, 0, 0, PI / 2, 0)), 0.07, 0.07, -0.5, 0.6, 6, 'metal_green'); return; }
    b.box(m, -0.03, -0.04, -0.2, 0.03, 0.05, 0.4, 'gun');
    b.box(m, -0.02, -0.14, 0.05, 0.02, -0.04, 0.12, 'gun');
  }

  function humanoid(b, n, t, skinName) {
    const sk = SKINS[skinName] || SKINS.citizen;
    const hScale = n.def.height / 1.8;
    const bulk = (sk.bulk || 1) * (sk.slim || 1);
    const alive = n.alive;
    let fall = 0;
    if (!alive) fall = Math.min(1, (t - n.deadT) / 0.65);
    const fdir = n.deathDir ? Math.atan2(n.deathDir.x, n.deathDir.z) : n.yaw;
    const rel = H.wrapAngle(fdir - n.yaw);
    const backward = Math.abs(rel) < PI / 2;
    const fallPitch = fall * fall * (PI / 2 - 0.06) * (backward ? -1 : 1);
    const crouch = n.crouch ? 0.35 : 0;
    const root = M4.trs(n.pos.x, n.pos.y + (alive ? 0 : 0.12 * fall), n.pos.z, n.yaw, fallPitch, 0, hScale, hScale, hScale);
    const spd = n.speedNow || 0;
    const ph = n.walk * 2.2;
    const amp = alive ? Math.min(1, spd / 3.5) * 0.75 : 0;
    const legA = Math.sin(ph) * amp, legB = -legA;
    const armed = alive && n.weapon && n.weapon !== 'vortzap' && H.NPC_WEAPONS[n.weapon] && !H.NPC_WEAPONS[n.weapon].melee && (n.state === 'combat' || n.enemy || n.follow || n.inSquad);
    const hipY = 0.92 - crouch * 0.4;
    const pelvis = part(root, 0, hipY, 0, 0, alive ? 0 : 0, 0);
    const thigh = (side, a) => {
      const m = part(pelvis, side * 0.1 * bulk, 0, 0, 0, a - crouch * 1.2, 0);
      b.box(m, -0.075 * bulk, -0.46, -0.08, 0.075 * bulk, 0, 0.08, sk.legs);
      const knee = part(m, 0, -0.46, 0, 0, Math.max(0, -a) * 0.9 + crouch * 2.2, 0);
      b.box(knee, -0.065 * bulk, -0.42, -0.07, 0.065 * bulk, 0, 0.07, sk.legs);
      b.box(knee, -0.07 * bulk, -0.46, -0.08, 0.07 * bulk, -0.4, 0.14, sk.feet);
    };
    thigh(1, legA);
    thigh(-1, legB);
    const lean = alive ? (n.act === 'swing' ? 0.25 : 0) + (sk.zombie ? 0.25 : 0) + crouch * 0.6 : 0;
    const torso = part(pelvis, 0, 0, 0, 0, lean, 0);
    const tw = 0.2 * bulk, td = 0.12 * (sk.bulk || 1);
    b.box(torso, -tw, 0, -td, tw, 0.58, td, { side: sk.torso, front: sk.torso, back: sk.torso, top: sk.torso, bottom: sk.torso });
    if (sk.vest) b.box(torso, -tw - 0.01, 0.2, -td - 0.015, tw + 0.01, 0.52, td + 0.015, sk.vest);
    if (sk.coat) b.box(torso, -tw - 0.015, -0.35, -td - 0.02, tw + 0.015, 0.2, td + 0.02, sk.coat, { skip: ['top', 'bottom'] });
    if (sk.cross) b.box(torso, -0.05, 0.34, td + 0.001, 0.05, 0.44, td + 0.01, 'cloth_red', { flat: true, col: [0.9, 0.2, 0.2] });
    if (sk.sacs) { b.sphere(part(torso, 0, 0.3, td + 0.05, 0, 0, 0), 0.14, 6, 'crab_dark'); b.sphere(part(torso, 0.1, 0.45, td + 0.05, 0, 0, 0), 0.1, 6, 'crab_dark'); }
    const talk = n.talkT > 0 ? Math.abs(Math.sin(t * 14)) * 0.08 : 0;
    const headPitch = alive ? -(n.aim || 0) * 0.5 + talk : 0;
    const head = part(torso, 0, 0.6, 0, 0, headPitch, 0);
    if (!n.headless) {
      b.box(head, -0.11, 0, -0.12, 0.11, 0.26, 0.12, { side: sk.head, top: sk.head, back: sk.head, bottom: sk.hands, front: sk.face });
      if (sk.helmet) b.box(head, -0.125, 0.16, -0.135, 0.125, 0.29, 0.13, sk.helmet);
      if (sk.crab) {
        const ch = part(head, 0, 0.26, 0, 0, 0.2, 0);
        b.box(ch, -0.16, -0.02, -0.18, 0.16, 0.1, 0.16, sk.crab);
        b.box(ch, 0.12, -0.08, 0.06, 0.2, 0.02, 0.2, sk.crab);
        b.box(ch, -0.2, -0.08, 0.06, -0.12, 0.02, 0.2, sk.crab);
      }
    }
    const shoulderY = 0.52;
    const arm = (side, pitch, roll, fore) => {
      const m = part(torso, side * (tw + 0.07), shoulderY, 0, 0, pitch, roll);
      b.box(m, -0.06, -0.3, -0.06, 0.06, 0.03, 0.06, sk.arms);
      const e = part(m, 0, -0.3, 0, 0, fore, 0);
      b.box(e, -0.05, -0.28, -0.05, 0.05, 0, 0.05, sk.arms);
      b.box(e, -0.045, -0.36, -0.045, 0.045, -0.28, 0.045, sk.hands);
      return e;
    };
    let rPitch, lPitch, rFore, lFore, rRoll = 0, lRoll = 0;
    if (!alive) { rPitch = -2.6 * fall; lPitch = -2.4 * fall; rFore = 0.3; lFore = 0.3; rRoll = 0.4 * fall; lRoll = -0.4 * fall; }
    else if (sk.zombie) { rPitch = 1.2 + Math.sin(t * 2) * 0.1; lPitch = 1.1 + Math.cos(t * 2) * 0.1; rFore = 0.2; lFore = 0.2; if (n.act === 'swing') { rPitch = 2.4 - (1 - n.actT / 0.7) * 2.2; } if (n.act === 'throw') { rPitch = lPitch = 2.6; } }
    else if (n.act === 'swing') { const k = Math.max(0, n.actT / 0.4); rPitch = 2.6 * k - 0.4; rFore = 0.5; lPitch = 0.2; lFore = 0.3; }
    else if (n.act === 'throw') { rPitch = 2.8 * Math.max(0, n.actT / 0.6); rFore = 0.4; lPitch = 0.6; lFore = 0.2; }
    else if (armed) { const aim = n.aim || 0; rPitch = 1.35 + aim; rFore = 0.15; lPitch = 1.2 + aim; lFore = 0.55; lRoll = -0.45; }
    else if (n.cat === 'story' && n.talkT > 0) { rPitch = 0.6 + Math.sin(t * 3) * 0.2; rFore = 0.8; lPitch = -legA * 0.8; lFore = 0.2; }
    else { rPitch = -legA * 0.8; lPitch = -legB * 0.8; rFore = 0.25 + amp * 0.3; lFore = 0.25 + amp * 0.3; }
    const re = arm(-1, rPitch, -rRoll, rFore);
    arm(1, lPitch, lRoll, lFore);
    if (alive && n.weapon && n.weapon !== 'vortzap') {
      const hand = part(re, 0, -0.32, 0.02, 0, -PI / 2 + (armed ? -rFore + 0 : 0), 0);
      weaponModel(b, part(hand, 0, 0, 0, 0, armed ? 0 : 0, 0), n.weapon);
    }
  }

  function vort(b, n, t) {
    const alive = n.alive;
    const fall = alive ? 0 : Math.min(1, (t - n.deadT) / 0.6);
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, -fall * 1.4, 0);
    const amp = Math.min(1, (n.speedNow || 0) / 3) * 0.6, ph = n.walk * 2.2;
    for (const side of [1, -1]) {
      const m = part(root, side * 0.14, 0.95, 0, 0, Math.sin(ph) * amp * side - 0.3, 0);
      b.box(m, -0.07, -0.5, -0.07, 0.07, 0, 0.07, 'vort');
      const k = part(m, 0, -0.5, 0, 0, 0.9, 0);
      b.box(k, -0.06, -0.48, -0.06, 0.06, 0, 0.06, 'vort');
    }
    const torso = part(root, 0, 0.95, 0, 0, 0.55, 0);
    b.box(torso, -0.2, 0, -0.13, 0.2, 0.55, 0.14, 'vort');
    const head = part(torso, 0, 0.55, 0.08, 0, 0.2, 0);
    b.box(head, -0.1, 0, -0.1, 0.1, 0.18, 0.24, { side: 'vort', front: 'face_vort' });
    b.box(head, -0.04, 0.15, 0.1, 0.04, 0.2, 0.18, 'light_red', { flat: true, col: [1, 0.3, 0.2] });
    const zap = n.act === 'fire' || (n.wcd !== undefined && n.enemy && n.wcd < 0.4);
    for (const side of [1, -1]) {
      const a = part(torso, side * 0.25, 0.45, 0, 0, zap ? 1.4 : 0.3, side * 0.2);
      b.box(a, -0.05, -0.55, -0.05, 0.05, 0, 0.05, 'vort');
      if (zap && alive) b.box(a, -0.06, -0.62, -0.06, 0.06, -0.52, 0.06, 'light_green', { flat: true, col: [0.6, 1, 0.6] });
    }
    b.box(part(torso, 0, 0.3, 0.14, 0, 0, 0), -0.06, -0.1, 0, 0.06, 0.1, 0.12, 'vort');
  }

  function crab(b, n, t, tex, s = 1) {
    const alive = n.alive;
    const flip = alive ? 0 : Math.min(1, (t - n.deadT) / 0.3) * PI;
    const leapPitch = n.leaping ? -0.5 : 0;
    const root = M4.trs(n.pos.x, n.pos.y + 0.12 * s, n.pos.z, n.yaw, leapPitch, flip, s, s, s);
    b.box(root, -0.18, 0, -0.2, 0.18, 0.16, 0.2, tex);
    b.box(root, -0.12, 0.12, -0.12, 0.12, 0.22, 0.14, tex);
    b.box(root, -0.1, -0.02, 0.18, 0.1, 0.06, 0.24, 'black');
    const ph = (n.walk || 0) * 4 + t * (alive ? 0 : 0);
    for (const side of [1, -1]) {
      for (const z of [0.12, -0.08]) {
        const leg = part(root, side * 0.17, 0.06, z, side * 0.5, n.leaping ? -0.9 : Math.sin(ph + z * 10) * 0.3, side * -0.5);
        b.box(leg, -0.025, -0.02, 0, 0.025, 0.02, 0.26, tex);
        const f = part(leg, 0, 0, 0.26, 0, 0.9, 0);
        b.box(f, -0.02, -0.02, 0, 0.02, 0.02, 0.18, tex);
      }
    }
  }

  function antlion(b, n, t) {
    const alive = n.alive;
    const flip = alive ? 0 : Math.min(1, (t - n.deadT) / 0.4) * 2.6;
    const emerge = n.emergeT > 0 ? n.emergeT / 1.2 : 0;
    const root = M4.trs(n.pos.x, n.pos.y + 0.45 - emerge * 1.2, n.pos.z, n.yaw, n.jumping ? -0.3 : 0, flip, 1, 1, 1);
    const tex = n.team === 'pet' ? 'antlion' : 'antlion';
    b.box(root, -0.28, -0.1, -0.75, 0.28, 0.25, 0.05, tex);
    b.box(root, -0.2, -0.05, 0.05, 0.2, 0.25, 0.45, tex);
    const head = part(root, 0, 0.1, 0.45, 0, 0.2, 0);
    b.box(head, -0.15, -0.12, 0, 0.15, 0.12, 0.3, tex);
    b.box(head, -0.18, -0.16, 0.25, -0.1, -0.06, 0.42, 'crab_dark');
    b.box(head, 0.1, -0.16, 0.25, 0.18, -0.06, 0.42, 'crab_dark');
    const wing = n.jumping ? Math.sin(t * 60) * 0.6 : 0;
    for (const side of [1, -1]) {
      const w = part(root, side * 0.18, 0.24, -0.1, 0, 0, side * (0.2 + wing));
      b.box(w, -0.02, 0, -0.7, 0.02, 0.02, 0.1, 'glass', { blend: 'alpha' });
    }
    const ph = (n.walk || 0) * 3;
    for (const side of [1, -1]) {
      for (let k = 0; k < 2; k++) {
        const z = k ? 0.3 : -0.2;
        const a = Math.sin(ph + k * PI + (side > 0 ? 0 : PI)) * 0.4 * Math.min(1, (n.speedNow || 0) / 3);
        const leg = part(root, side * 0.25, 0.15, z, side * (k ? 0.7 : 2.2), a, side * -0.9);
        b.box(leg, -0.035, -0.035, 0, 0.035, 0.035, 0.55, tex);
        const f = part(leg, 0, 0, 0.55, 0, 1.5, 0);
        b.box(f, -0.03, -0.03, 0, 0.03, 0.03, 0.55, 'crab_dark');
      }
    }
  }

  function guardModel(b, n, t) {
    const alive = n.alive;
    const fall = alive ? 0 : Math.min(1, (t - n.deadT) / 1.2) * 1.4;
    const root = M4.trs(n.pos.x, n.pos.y + 1.2, n.pos.z, n.yaw, n.charging ? 0.25 : 0, fall, 1, 1, 1);
    b.box(root, -0.9, -0.3, -1.1, 0.9, 1.1, 0.8, 'guard');
    b.box(root, -0.6, 0.6, -1.3, 0.6, 1.3, -0.3, 'guard');
    const head = part(root, 0, 0.3, 0.8, 0, 0.3, 0);
    b.box(head, -0.55, -0.4, 0, 0.55, 0.45, 0.9, 'guard');
    b.box(head, -0.35, -0.55, 0.6, 0.35, -0.3, 1.0, 'crab_dark');
    const ph = (n.walk || 0) * 2;
    for (const side of [1, -1]) {
      for (const z of [0.4, -0.7]) {
        const a = Math.sin(ph + z * 3 + (side > 0 ? 0 : PI)) * 0.35;
        const leg = part(root, side * 0.8, -0.1, z, 0, a, side * -0.25);
        b.box(leg, -0.18, -1.15, -0.18, 0.18, 0, 0.18, 'guard');
      }
    }
    if (n.act === 'swing') b.box(part(root, 0.7, 0.5, 0.9, 0, -1.2, 0), -0.2, -0.2, 0, 0.2, 0.2, 1.2, 'guard');
  }

  function manhack(b, n, t) {
    const root = M4.trs(n.pos.x, n.pos.y + 0.15, n.pos.z, n.yaw, 0, n.alive ? Math.sin(t * 9) * 0.15 : 1.2);
    b.box(root, -0.2, -0.08, -0.25, 0.2, 0.08, 0.25, 'synth_dark');
    b.box(root, -0.06, 0.02, 0.18, 0.06, 0.07, 0.26, 'light_red', { flat: true, col: [1, 0.3, 0.2] });
    const spin = t * 60;
    for (let k = 0; k < 2; k++) {
      const bm = part(root, 0, 0.1, 0, spin + k * PI / 2, 0, 0);
      b.box(bm, -0.34, -0.004, -0.03, 0.34, 0.004, 0.03, 'gun_light', { alpha: n.alive ? 0.5 : 1, blend: n.alive ? 'alpha' : 'opaque' });
    }
  }

  function scanner(b, n, t) {
    const root = M4.trs(n.pos.x, n.pos.y + 0.2, n.pos.z, n.yaw, Math.sin(t * 2) * 0.05, 0);
    b.sphere(root, 0.26, 8, 'synth');
    b.box(root, -0.1, -0.08, 0.2, 0.1, 0.08, 0.34, 'synth_dark');
    b.box(root, -0.05, -0.04, 0.33, 0.05, 0.04, 0.36, 'light', { flat: true, col: [1, 1, 1] });
    b.box(root, -0.34, -0.03, -0.06, -0.22, 0.03, 0.06, 'synth_dark');
    b.box(root, 0.22, -0.03, -0.06, 0.34, 0.03, 0.06, 'synth_dark');
    b.box(root, -0.03, -0.4, -0.03, 0.03, -0.2, 0.03, 'synth_dark');
  }

  function barnacle(b, n, t) {
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, 0, 0);
    b.box(root, -0.35, -0.45, -0.35, 0.35, 0, 0.35, 'crab');
    b.box(root, -0.25, -0.6, -0.25, 0.25, -0.45, 0.25, 'crab_dark');
    const len = n.alive ? (n.tongueLen || n.tongue || 1) : 0.2;
    const sway = Math.sin(t * 1.3) * 0.05;
    b.box(M4.trs(n.pos.x + sway, n.pos.y - 0.6, n.pos.z, 0, 0, 0), -0.025, -len, -0.025, 0.025, 0, 0.025, 'cloth_red', { col: [0.8, 0.4, 0.4] });
  }

  function turretModel(b, n, t) {
    const tipped = n.tipped || (n.kind === 'prop');
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, 0, tipped ? 1.45 : 0);
    for (const a of [0, 2.1, 4.2]) {
      const leg = part(root, 0, 0.5, 0, a, -2.6, 0);
      b.box(leg, -0.025, -0.02, 0, 0.025, 0.02, 0.62, 'synth_dark');
    }
    b.box(root, -0.14, 0.45, -0.18, 0.14, 1.15, 0.18, { side: 'combine', front: 'synth', back: 'synth', top: 'synth_dark', bottom: 'synth_dark' });
    b.box(root, -0.05, 0.9, 0.18, 0.05, 1.0, 0.45, 'gun');
    const live = n.alive && !n.tipped && n.kind !== 'prop';
    b.box(root, -0.04, 1.02, 0.16, 0.04, 1.08, 0.2, live && n.enemy ? 'light_red' : 'light_green', { flat: true, col: [1, 1, 1] });
  }

  function roller(b, n, t) {
    const m = M4.trs(n.pos.x, n.pos.y + 0.32, n.pos.z, n.yaw, -(n.roll || 0), 0);
    b.sphere(m, 0.32, 8, 'gun_light');
    for (let k = 0; k < 3; k++) b.box(part(m, 0, 0, 0, k * 2.1, 0, 0), -0.34, -0.03, -0.06, 0.34, 0.03, 0.06, 'synth_dark');
    if (n.enemy) b.box(m, -0.05, 0.3, -0.05, 0.05, 0.36, 0.05, 'light_blue', { flat: true, col: [1, 1, 1] });
  }

  function chopper(b, n, t) {
    const tilt = H.clamp(H.vlen({ x: n.vel.x, y: 0, z: n.vel.z }) * 0.02, 0, 0.3);
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, tilt, n.crashing ? Math.sin(t * 5) * 0.5 : 0);
    b.box(root, -1.1, -1.2, -1.4, 1.1, 0.8, 2.2, { side: 'synth_dark', front: 'synth', back: 'synth_dark', top: 'synth_dark', bottom: 'synth' });
    b.box(root, -0.8, -0.8, 2.2, 0.8, 0.4, 3.4, 'synth');
    b.box(root, -0.6, -0.5, 3.3, 0.6, 0.1, 3.5, 'light_red', { flat: true, col: [1, 0.3, 0.2] });
    b.box(root, -0.3, -0.3, -5.6, 0.3, 0.4, -1.4, 'synth_dark');
    b.box(root, -0.05, 0, -6.0, 0.05, 1.4, -5.4, 'synth');
    b.box(root, -1.6, -1.0, 0.2, -1.1, -0.6, 1.2, 'gun');
    b.box(root, 1.1, -1.0, 0.2, 1.6, -0.6, 1.2, 'gun');
    b.box(root, -0.12, -1.4, 2.4, 0.12, -1.15, 3.6, 'gun');
    const rot = t * 25;
    for (let k = 0; k < 2; k++) b.box(part(root, 0, 1.0, 0.2, rot + k * PI / 2, 0, 0), -5.2, -0.02, -0.18, 5.2, 0.02, 0.18, 'synth_dark', { blend: 'alpha', alpha: 0.45 });
    b.box(root, -0.2, 0.8, -0.1, 0.2, 1.05, 0.5, 'synth_dark');
  }

  function gunship(b, n, t) {
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, H.clamp(H.vlen(n.vel) * 0.015, 0, 0.2), n.crashing ? Math.sin(t * 5) * 0.6 : Math.sin(t * 0.8) * 0.05);
    b.sphere(M4.mul(root, M4.trs(0, 0, 0.5, 0, 0, 0, 1.2, 0.8, 2.6)), 1, 8, 'vort');
    b.box(root, -0.2, -0.2, -4.2, 0.2, 0.2, -1.5, 'vort');
    for (const side of [1, -1]) {
      const w = part(root, side * 1.0, 0.1, 0.2, 0, 0, side * (0.15 + Math.sin(t * 3) * 0.05));
      b.box(w, side > 0 ? 0 : -3.2, -0.05, -0.8, side > 0 ? 3.2 : 0, 0.05, 0.6, 'synth', { blend: 'alpha', alpha: 0.85 });
    }
    b.box(root, -0.15, -0.9, 2.4, 0.15, -0.6, 3.2, 'gun');
    const rot = t * 20;
    b.box(part(root, 0, 0, -4.3, 0, 0, rot), -1.3, -0.1, -0.05, 1.3, 0.1, 0.05, 'synth_dark', { blend: 'alpha', alpha: 0.5 });
  }

  function striderModel(b, n, t) {
    const alive = n.alive;
    const col = alive ? 0 : Math.min(1, (t - n.deadT) / 2);
    const by = (n.bodyY || n.pos.y + 8.5) - col * 7.5;
    const root = M4.trs(n.pos.x, by, n.pos.z, n.yaw, 0, col * 0.5);
    b.box(root, -1.3, -0.7, -1.6, 1.3, 0.6, 1.4, 'synth_dark');
    b.box(root, -0.9, 0.4, -1.2, 0.9, 1.0, 1.0, 'synth');
    b.box(root, -0.4, -1.1, 1.0, 0.4, -0.6, 2.2, 'gun');
    b.box(root, -0.12, -1.0, 2.2, 0.12, -0.8, 3.0, 'gun');
    if (n.cannonCharge > 0) b.sphere(M4.mul(root, M4.trs(0, -1.3, 1.2, 0, 0, 0)), 0.3 + (1.8 - n.cannonCharge) * 0.2, 6, 'light_blue', { flat: true, col: [1, 1, 1] });
    const ph = (n.walk || 0);
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094 + 0.5;
      const foot = { x: n.pos.x + Math.sin(n.yaw + a) * 4.2 + Math.sin(ph + k * 2) * 0.8 * Math.sin(n.yaw), y: n.pos.y, z: n.pos.z + Math.cos(n.yaw + a) * 4.2 + Math.sin(ph + k * 2) * 0.8 * Math.cos(n.yaw) };
      const hip = M4.point(root, Math.sin(a) * 1.0, 0, Math.cos(a) * 1.0);
      const knee = { x: (hip.x + foot.x) / 2 + Math.sin(n.yaw + a) * 2.2, y: by + 1.8 - col * 3, z: (hip.z + foot.z) / 2 + Math.cos(n.yaw + a) * 2.2 };
      seg(b, hip, knee, 0.22, 'synth_dark');
      seg(b, knee, foot, 0.14, 'synth_dark');
    }
  }

  function seg(b, a, c, r, tex) {
    const d = H.vsub(c, a);
    const len = H.vlen(d);
    const yaw = Math.atan2(d.x, d.z);
    const pitch = Math.asin(H.clamp(d.y / len, -1, 1));
    const m = M4.trs(a.x, a.y, a.z, yaw, pitch, 0);
    b.box(m, -r, -r, 0, r, r, len, tex);
  }

  function apcModel(b, n, t) {
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, 0, n.alive ? 0 : 0.1);
    const tex = n.alive ? 'combine' : 'black';
    b.box(root, -1.3, 0.5, -2.6, 1.3, 2.1, 2.6, { side: tex, top: 'synth_dark', front: 'synth', back: 'synth_dark', bottom: 'black' });
    b.box(root, -1.1, 2.1, -1.4, 1.1, 2.6, 1.8, 'synth_dark');
    b.box(root, -0.12, 2.3, 1.2, 0.12, 2.5, 2.8, 'gun');
    for (const side of [1, -1]) for (const z of [-1.7, 0, 1.7]) b.cyl(M4.mul(root, M4.trs(side * 1.3, 0.55, z, 0, 0, PI / 2)), 0.55, 0.55, -0.2, 0.2, 8, 'tire');
  }

  function dropship(b, n, t) {
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, 0, Math.sin(t) * 0.05);
    b.sphere(M4.mul(root, M4.trs(0, 1.4, 0, 0, 0, 0, 1.6, 1, 4.2)), 1, 8, 'synth_dark');
    for (const side of [1, -1]) b.box(part(root, side * 1.4, 1.2, 1.5, 0, 0, side * 0.6), -0.15, -2.2, -0.15, 0.15, 0, 0.15, 'synth_dark');
    if (n.dropGroup !== null && n.dropGroup !== undefined) b.box(root, -1.2, -2, -2, 1.2, 0.4, 2, 'combine');
    b.box(root, -0.2, 1.2, -5.5, 0.2, 1.6, -3.5, 'synth');
  }

  function dog(b, n, t) {
    const root = M4.trs(n.pos.x, n.pos.y, n.pos.z, n.yaw, 0, 0);
    const ph = (n.walk || 0) * 1.8, amp = Math.min(1, (n.speedNow || 0) / 3) * 0.5;
    for (const side of [1, -1]) {
      const leg = part(root, side * 0.45, 1.3, 0, 0, Math.sin(ph) * amp * side, side * 0.15);
      b.box(leg, -0.13, -1.3, -0.15, 0.13, 0, 0.15, 'dog');
    }
    const torso = part(root, 0, 1.3, 0, 0, 0.15, 0);
    b.box(torso, -0.55, 0, -0.45, 0.55, 1.0, 0.4, 'dog');
    b.box(torso, -0.3, 1.0, -0.3, 0.3, 1.3, 0.2, 'metal');
    const head = part(torso, 0, 1.25, 0.1, 0, 0.1, 0);
    b.box(head, -0.25, 0, -0.2, 0.25, 0.3, 0.35, 'dog');
    b.box(head, -0.08, 0.12, 0.35, 0.08, 0.22, 0.4, 'light_blue', { flat: true, col: [1, 1, 1] });
    const throwing = n.act === 'throw';
    for (const side of [1, -1]) {
      const a = part(torso, side * 0.68, 0.85, 0, 0, throwing ? 2.4 : 0.4 + Math.sin(t * 1.3 + side) * 0.1, side * 0.1);
      b.box(a, -0.12, -0.9, -0.12, 0.12, 0.1, 0.12, 'dog');
      const f = part(a, 0, -0.9, 0, 0, 0.7, 0);
      b.box(f, -0.1, -0.8, -0.1, 0.1, 0, 0.1, 'dog');
      b.box(f, -0.16, -1.0, -0.16, 0.16, -0.8, 0.16, 'metal');
    }
  }

  function drawNpc(b, n, t) {
    const mdl = n.def.model;
    if (n.dissolve) b.tint = [1 - n.dissolve * 0.8, 1 - n.dissolve * 0.5, 1];
    switch (mdl) {
      case 'headcrab': crab(b, n, t, 'crab'); break;
      case 'fastcrab': crab(b, n, t, 'crab', 0.85); break;
      case 'poisoncrab': crab(b, n, t, 'crab_dark', 1.15); break;
      case 'antlion': antlion(b, n, t); break;
      case 'antlionguard': guardModel(b, n, t); break;
      case 'manhack': manhack(b, n, t); break;
      case 'scanner': scanner(b, n, t); break;
      case 'barnacle': barnacle(b, n, t); break;
      case 'turret': turretModel(b, n, t); break;
      case 'rollermine': roller(b, n, t); break;
      case 'chopper': chopper(b, n, t); break;
      case 'gunship': gunship(b, n, t); break;
      case 'strider': striderModel(b, n, t); break;
      case 'apc': apcModel(b, n, t); break;
      case 'dropship': dropship(b, n, t); break;
      case 'dog': dog(b, n, t); break;
      case 'vort': vort(b, n, t); break;
      case 'soldier': humanoid(b, n, t, 'soldier'); break;
      case 'metrocop': humanoid(b, n, t, 'metrocop'); break;
      default: humanoid(b, n, t, SKINS[mdl] ? mdl : 'citizen');
    }
    b.tint = null;
  }

  function propMatrix(p) {
    return M4.trs(p.pos.x, p.pos.y + p.half.y, p.pos.z, p.yaw, p.rot.p, p.rot.r);
  }

  function drawProp(b, p, t) {
    const m = propMatrix(p);
    const s = p.def.size;
    const hx = s[0], hy = s[1], hz = s[2];
    switch (p.def.model) {
      case 'crate': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'crate'); break;
      case 'barrel': b.cyl(m, hx, hx, -hy, hy, 10, 'barrel', { cap: 'metal' }); break;
      case 'barrel_red': b.cyl(m, hx, hx, -hy, hy, 10, 'barrel_red', { cap: 'metal' }); break;
      case 'barrel_float': b.cyl(m, hx, hx, -hy, hy, 10, 'barrel_blue', { cap: 'barrel_blue' }); break;
      case 'propane': b.cyl(m, hx, hx, -hy, hy * 0.7, 8, 'white', { col: [0.9, 0.9, 0.85] }); b.sphere(M4.mul(m, M4.trs(0, hy * 0.7, 0, 0, 0, 0)), hx, 6, 'white', { col: [0.9, 0.9, 0.85] }); break;
      case 'gascan': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'barrel_red'); b.box(m, -0.02, hy, -0.02, 0.02, hy + 0.05, 0.05, 'gun'); break;
      case 'can': b.cyl(m, hx, hx, -hy, hy, 6, 'white', { col: [0.8, 0.2, 0.2] }); break;
      case 'bottle': b.cyl(m, hx, hx * 0.4, -hy, hy, 6, 'glass', { col: [0.4, 0.8, 0.5], blend: 'alpha' }); break;
      case 'melon': b.sphere(m, hx, 8, 'melon', { sy: 1.2 }); break;
      case 'paint': b.cyl(m, hx, hx, -hy, hy, 8, 'metal', { col: [0.9, 0.9, 0.9] }); break;
      case 'cinder': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'concrete'); break;
      case 'brick': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'brick'); break;
      case 'radiator': for (let i = 0; i < 8; i++) { const x = -hx + (i + 0.5) * hx / 4; b.box(m, x - 0.05, -hy, -hz, x + 0.05, hy, hz, 'metal', { col: [0.9, 0.9, 0.85] }); } break;
      case 'sawblade': b.cyl(M4.mul(m, M4.trs(0, 0, 0, p.held ? t * 20 : 0, 0, 0)), hx, hx, -hy, hy, 12, 'saw', { cap: 'saw' }); break;
      case 'tire': b.cyl(m, hx, hx, -hy, hy, 10, 'tire', { cap: 'tire' }); break;
      case 'pallet': for (let i = 0; i < 4; i++) { const z = -hz + (i + 0.5) * hz / 2; b.box(m, -hx, hy * 0.2, z - 0.08, hx, hy, z + 0.08, 'planks'); } b.box(m, -hx, -hy, -hz, -hx + 0.1, hy * 0.2, hz, 'wood'); b.box(m, hx - 0.1, -hy, -hz, hx, hy * 0.2, hz, 'wood'); break;
      case 'plank': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'planks'); break;
      case 'cabinet': b.box(m, -hx, -hy, -hz, hx, hy, hz, { side: 'metal_green', front: 'door_metal', top: 'metal_green' }); break;
      case 'fridge': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'white', { col: [0.85, 0.85, 0.8] }); b.box(m, hx - 0.05, -0.1, hz, hx - 0.02, 0.4, hz + 0.04, 'gun'); break;
      case 'tv': b.box(m, -hx, -hy, -hz, hx, hy, hz, { side: 'wood', front: 'screen', top: 'wood' }); break;
      case 'chair': b.box(m, -hx, -0.02, -hz, hx, 0.04, hz, 'wood'); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(m, x * hx * 0.8 - 0.02, -hy, z * hz * 0.8 - 0.02, x * hx * 0.8 + 0.02, 0, z * hz * 0.8 + 0.02, 'wood'); b.box(m, -hx, 0.04, -hz, hx, hy, -hz + 0.04, 'wood'); break;
      case 'table': b.box(m, -hx, hy - 0.06, -hz, hx, hy, hz, 'wood'); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(m, x * hx * 0.9 - 0.04, -hy, z * hz * 0.9 - 0.04, x * hx * 0.9 + 0.04, hy - 0.06, z * hz * 0.9 + 0.04, 'wood'); break;
      case 'mattress': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'cloth_white', { col: [0.8, 0.75, 0.6] }); break;
      case 'bathtub': b.box(m, -hx, -hy, -hz, hx, -hy + 0.06, hz, 'white'); b.box(m, -hx, -hy, -hz, hx, hy, -hz + 0.06, 'white'); b.box(m, -hx, -hy, hz - 0.06, hx, hy, hz, 'white'); b.box(m, -hx, -hy, -hz, -hx + 0.06, hy, hz, 'white'); b.box(m, hx - 0.06, -hy, -hz, hx, hy, hz, 'white'); break;
      case 'dumpster': b.box(m, -hx, -hy, -hz, hx, hy, hz, 'metal_green'); break;
      case 'car': car(b, m, hx, hy, hz); break;
      case 'ball': b.sphere(m, hx, 8, 'white', { col: [0.9, 0.3, 0.2] }); break;
      case 'lamarr': crab(b, { pos: { x: p.pos.x, y: p.pos.y, z: p.pos.z }, yaw: p.yaw, alive: true, walk: t, leaping: !p.onGround }, t, 'crab'); break;
      case 'energyball': b.sphere(m, hx, 6, 'light_blue', { flat: true, col: [1, 1, 1] }); break;
      case 'turret': turretModel(b, { pos: p.pos, yaw: p.yaw, kind: 'prop' }, t); break;
      case 'pheropod': b.sphere(m, hx, 6, 'antlion', { sy: 0.7 }); break;
      case 'body': b.box(m, -hx, -hy, -hz, hx, hy, hz, SKINS[p.skin] ? SKINS[p.skin].torso : 'soldier'); break;
      default: b.box(m, -hx, -hy, -hz, hx, hy, hz, 'crate');
    }
  }

  function car(b, m, hx, hy, hz) {
    b.box(m, -hx, -hy + 0.25, -hz, hx, 0.05, hz, 'car_paint');
    b.box(m, -hx + 0.1, 0.05, -hz * 0.45, hx - 0.1, hy, hz * 0.4, { side: 'car_glass', front: 'car_glass', back: 'car_glass', top: 'car_paint' });
    for (const x of [-1, 1]) for (const z of [-0.65, 0.65]) b.cyl(M4.mul(m, M4.trs(x * (hx - 0.05), -hy + 0.3, z * hz, 0, 0, PI / 2)), 0.3, 0.3, -0.12, 0.12, 8, 'tire');
  }

  const AMMO_COL = {
    ammo_pistol: [0.7, 0.6, 0.3], ammo_357: [0.6, 0.5, 0.4], ammo_smg: [0.4, 0.5, 0.35], ammo_smggren: [0.4, 0.5, 0.3], ammo_ar2: [0.3, 0.4, 0.6],
    ammo_ar2ball: [0.4, 0.8, 1], ammo_buckshot: [0.7, 0.2, 0.15], ammo_bolt: [0.5, 0.4, 0.3], ammo_rocket: [0.4, 0.45, 0.3], ammo_grenade: [0.3, 0.35, 0.3]
  };

  function drawItem(b, it, t) {
    const bob = Math.sin(t * 2 + it.spin) * 0.03;
    const m = M4.trs(it.pos.x, it.pos.y + bob, it.pos.z, it.spin * 0.8, 0, 0);
    const ty = it.type;
    if (ty === 'healthkit') { b.box(m, -0.2, 0, -0.14, 0.2, 0.12, 0.14, 'white', { col: [0.9, 0.9, 0.9] }); b.box(m, -0.06, 0.12, -0.02, 0.06, 0.125, 0.02, 'cloth_red', { flat: true, col: [1, 0.2, 0.2] }); b.box(m, -0.02, 0.12, -0.06, 0.02, 0.126, 0.06, 'cloth_red', { flat: true, col: [1, 0.2, 0.2] }); }
    else if (ty === 'healthvial') { b.cyl(m, 0.05, 0.05, 0, 0.2, 6, 'light_green', { col: [0.5, 1, 0.5] }); }
    else if (ty === 'battery') { b.box(m, -0.07, 0, -0.05, 0.07, 0.22, 0.05, 'gun_light'); b.box(m, -0.05, 0.05, 0.051, 0.05, 0.17, 0.056, 'light_blue', { flat: true, col: [0.7, 0.9, 1] }); }
    else if (ty === 'suit') { const sm = M4.trs(it.pos.x, it.pos.y, it.pos.z, it.spin * 0.2, 0, 0); b.box(sm, -0.25, 0.9, -0.14, 0.25, 1.5, 0.14, 'hev'); b.box(sm, -0.12, 1.5, -0.12, 0.12, 1.76, 0.12, 'hev'); b.box(sm, -0.22, 0, -0.1, -0.02, 0.9, 0.1, 'hev'); b.box(sm, 0.02, 0, -0.1, 0.22, 0.9, 0.1, 'hev'); }
    else if (ty.startsWith('weapon_')) viewless(b, m, ty.slice(7));
    else { const c = AMMO_COL[ty] || [0.5, 0.5, 0.5]; b.box(m, -0.14, 0, -0.1, 0.14, 0.16, 0.1, 'metal', { col: c }); }
  }

  function viewless(b, m, w) {
    const r = M4.mul(m, M4.trs(0, 0.08, 0, 0, 0, PI / 2));
    if (w === 'crowbar') { b.box(m, -0.02, 0.02, -0.4, 0.02, 0.05, 0.4, 'cloth_red', { col: [0.9, 0.3, 0.2] }); return; }
    if (w === 'gravgun') { b.box(m, -0.15, 0, -0.3, 0.15, 0.25, 0.3, 'gg'); return; }
    b.box(m, -0.04, 0, -0.3, 0.04, 0.12, 0.3, w === 'ar2' ? 'synth_dark' : 'gun');
    weaponModel(b, r, null);
  }

  function drawProjectile(b, q, t, cam) {
    if (q.kind === 'grenade') {
      const m = M4.trs(q.pos.x, q.pos.y, q.pos.z, q.t * 6, q.t * 4, 0);
      b.box(m, -0.05, -0.07, -0.05, 0.05, 0.07, 0.05, 'soldier');
      if (Math.floor((q.blink || 0) * 4) % 2 === 0) b.billboard(H.vadd(q.pos, { x: 0, y: 0.1, z: 0 }), 0.12, 'flare', [1, 0.2, 0.1], 'add', cam);
    } else if (q.kind === 'smggren' || q.kind === 'bomb') {
      b.sphere(M4.trs(q.pos.x, q.pos.y, q.pos.z, 0, 0, 0), q.kind === 'bomb' ? 0.3 : 0.06, 6, 'gun');
    } else if (q.kind === 'rocket') {
      const m = M4.trs(q.pos.x, q.pos.y, q.pos.z, Math.atan2(q.dir.x, q.dir.z), Math.asin(H.clamp(q.dir.y, -1, 1)), 0);
      b.box(m, -0.05, -0.05, -0.3, 0.05, 0.05, 0.3, 'gun_light');
      b.billboard(M4.point(m, 0, 0, -0.35), 0.35, 'flare', [1, 0.7, 0.3], 'add', cam);
    } else if (q.kind === 'bolt') {
      const d = H.vnorm(q.vel);
      const m = M4.trs(q.pos.x, q.pos.y, q.pos.z, Math.atan2(d.x, d.z), Math.asin(H.clamp(d.y, -1, 1)), 0);
      b.box(m, -0.01, -0.01, -0.3, 0.01, 0.01, 0.3, 'light_orange', { flat: true, col: [1, 0.8, 0.5] });
    } else if (q.kind === 'ball') {
      b.billboard(q.pos, 0.45 + Math.sin(t * 30) * 0.05, 'flare', [0.6, 0.9, 1.3], 'add', cam);
      b.billboard(q.pos, 0.2, 'flare', [1, 1, 1], 'add', cam);
    } else if (q.kind === 'bait') {
      b.sphere(M4.trs(q.pos.x, q.pos.y, q.pos.z, 0, 0, 0), 0.08, 6, 'antlion');
    }
  }

  function drawVehicle(b, v, t, firstPerson) {
    const m = M4.trs(v.pos.x, v.pos.y + (v.bob || 0), v.pos.z, v.yaw, v.pitch || 0, v.roll || 0);
    if (v.type === 'airboat') {
      b.box(m, -1.2, 0, -1.8, 1.2, 0.35, 1.9, { side: 'metal_green', top: 'metal', front: 'metal_green', back: 'metal_green', bottom: 'metal_rust' });
      b.box(m, -1.0, 0.35, 1.2, 1.0, 0.55, 1.9, 'metal_green');
      b.box(m, -0.35, 0.35, -0.2, 0.35, 0.8, 0.4, 'cloth_black');
      b.box(m, -0.35, 0.8, -0.3, 0.35, 1.3, -0.2, 'cloth_black');
      b.box(m, -0.9, 0.35, -1.9, 0.9, 2.0, -1.8, 'grate', { blend: 'alpha' });
      const fan = M4.mul(m, M4.trs(0, 1.2, -1.95, 0, 0, t * (5 + (v.engine || 0) * 40)));
      for (let k = 0; k < 2; k++) b.box(M4.mul(fan, M4.trs(0, 0, 0, 0, 0, k * PI / 2)), -0.8, -0.08, -0.03, 0.8, 0.08, 0.03, 'wood');
      b.box(m, -0.4, 0.35, -1.7, 0.4, 1.2, -1.2, 'metal_rust');
      if (!firstPerson) b.box(m, -0.5, 1.0, 0.5, 0.5, 1.05, 0.6, 'gun');
      if (v.gun) { b.box(m, -0.12, 0.55, 0.9, 0.12, 0.85, 1.4, 'synth_dark'); b.box(m, -0.04, 0.65, 1.4, 0.04, 0.73, 2.0, 'gun'); }
    } else {
      b.box(m, -0.95, 0.5, -1.6, 0.95, 0.75, 1.9, 'metal_rust');
      for (const x of [-1, 1]) {
        b.box(m, x * 0.9 - 0.04, 0.75, -1.3, x * 0.9 + 0.04, 1.5, -1.2, 'gun');
        b.box(m, x * 0.9 - 0.04, 0.75, 0.8, x * 0.9 + 0.04, 1.3, 0.9, 'gun');
      }
      if (!firstPerson) b.box(m, -0.94, 1.45, -1.3, 0.94, 1.5, 0.9, 'gun', { skip: ['bottom'] });
      else for (const z of [-1.3, 0.8]) b.box(m, -0.94, 1.45, z, 0.94, 1.5, z + 0.1, 'gun');
      if (!firstPerson) {
        b.box(m, -0.35, 0.75, -0.6, 0.35, 1.1, 0.0, 'cloth_black');
        b.box(m, -0.35, 1.1, -0.6, 0.35, 1.5, -0.5, 'cloth_black');
      }
      b.box(m, -0.5, 0.75, 1.0, 0.5, 0.95, 1.9, 'metal');
      for (const x of [-1, 1]) for (const z of [-1.3, 1.5]) b.cyl(M4.mul(m, M4.trs(x * 1.05, 0.48, z, 0, 0, PI / 2)), 0.48, 0.48, -0.18, 0.18, 10, 'tire', { cap: 'gun' });
      if (v.gun) { b.box(m, -0.12, 1.5, -0.8, 0.12, 1.75, 0.2, 'gun_light'); b.cyl(M4.mul(m, M4.trs(0, 1.62, 0.2, 0, PI / 2, 0)), 0.08, 0.08, 0, 0.8, 6, 'gg'); }
    }
  }

  function drawDoor(b, d) {
    const bx = d.box;
    if (d.type === 'field') {
      if (d.t >= 0.95) return;
      const a = (1 - d.t) * 0.9;
      b.box(M4.identity(), bx.x1, bx.y1, bx.z1, bx.x2, bx.y2, bx.z2, 'field', { blend: 'add', alpha: a, flat: true, col: [0.7, 0.85, 1], world: 2 });
      return;
    }
    if (d.type === 'swing') {
      const w = bx.x2 - bx.x1, dz = bx.z2 - bx.z1;
      const alongX = w >= dz;
      const ang = d.t * 1.6 * (d.swingDir || 1);
      const hx = alongX ? bx.x1 : (bx.x1 + bx.x2) / 2, hz = alongX ? (bx.z1 + bx.z2) / 2 : bx.z1;
      const m = M4.trs(hx, bx.y1, hz, ang, 0, 0);
      if (alongX) b.box(m, 0, 0, -dz / 2, w, bx.y2 - bx.y1, dz / 2, { side: d.tex, front: d.tex, back: d.tex }, { world: 0 });
      else b.box(m, -w / 2, 0, 0, w / 2, bx.y2 - bx.y1, dz, { side: d.tex, front: d.tex, back: d.tex });
      return;
    }
    b.box(M4.identity(), bx.x1, bx.y1, bx.z1, bx.x2, bx.y2, bx.z2, d.tex, { world: 2, blend: d.tex === 'gate' ? 'alpha' : undefined });
  }

  function drawCharger(b, c) {
    const m = M4.trs(c.pos.x, c.pos.y, c.pos.z, c.yaw, 0, 0);
    if (c.type === 'rockets') {
      b.box(m, -0.7, -0.5, -0.45, 0.7, 0.35, 0.45, 'metal_green');
      b.box(m, -0.72, 0.35, -0.47, 0.72, 0.45, 0.47, 'metal_green', { col: [0.8, 0.85, 0.8] });
      b.box(m, -0.3, -0.2, 0.46, 0.3, 0.1, 0.47, 'hazard', { flat: true, col: [1, 1, 1] });
      return;
    }
    b.box(m, -0.3, -0.4, -0.08, 0.3, 0.4, 0.08, c.type === 'health' ? 'white' : 'gun_light', { col: c.type === 'health' ? [0.85, 0.85, 0.8] : [0.8, 0.8, 0.85] });
    const k = c.charge / c.max;
    b.box(m, -0.12, -0.25, 0.08, 0.12, -0.25 + 0.5 * k, 0.1, c.type === 'health' ? 'light_green' : 'light_orange', { flat: true, col: [1, 1, 1] });
    if (c.type === 'health') { b.box(m, -0.08, 0.26, 0.08, 0.08, 0.3, 0.1, 'cloth_red', { flat: true, col: [1, 0.2, 0.2] }); b.box(m, -0.02, 0.2, 0.08, 0.02, 0.36, 0.1, 'cloth_red', { flat: true, col: [1, 0.2, 0.2] }); }
  }

  function drawButton(b, bt) {
    const m = M4.trs(bt.pos.x, bt.pos.y, bt.pos.z, bt.yaw, 0, 0);
    b.box(m, -0.14, -0.2, -0.04, 0.14, 0.2, 0.04, 'metal');
    b.box(m, -0.07, -0.07, 0.04, 0.07, 0.07, bt.pressed ? 0.05 : 0.09, bt.locked ? 'light_red' : bt.pressed ? 'light_green' : 'light_orange', { flat: true, col: [1, 1, 1] });
  }

  function drawSurface(b, s) {
    for (const bx of s.boxes) b.box(M4.identity(), bx.x1, bx.y1, bx.z1, bx.x2, bx.y2, bx.z2, s.tex, { world: 2 });
    if (s.kind === 'seesaw') {
      const m = M4.trs(s.x, s.yPivot - 0.05, s.z, s.axis === 'x' ? 0 : PI / 2, 0, 0);
      b.box(m, -0.3, -s.yPivot, -0.3, 0.3, 0, 0.3, 'metal_rust');
    }
  }

  function drawHazard(b, h, t) {
    if (h.type === 'blades') {
      const cx = (h.box.x1 + h.box.x2) / 2, cz = (h.box.z1 + h.box.z2) / 2, cy = (h.box.y1 + h.box.y2) / 2;
      const m = M4.trs(cx, cy, cz, h.on ? t * 12 : 0.3, 0, 0);
      const r = Math.max(h.box.x2 - h.box.x1, h.box.z2 - h.box.z1) / 2;
      b.box(m, -r, -0.03, -0.1, r, 0.03, 0.1, 'saw');
      b.box(m, -0.1, -0.03, -r, 0.1, 0.03, r, 'saw');
      b.box(M4.trs(cx, h.box.y1, cz, 0, 0, 0), -0.1, 0, -0.1, 0.1, cy - h.box.y1, 0.1, 'metal_rust');
    }
    if (h.type === 'electric' && h.on) {
      b.box(M4.identity(), h.box.x1, h.box.y1, h.box.z1, h.box.x2, h.box.y2, h.box.z2, 'field', { blend: 'add', alpha: 0.12 + Math.random() * 0.1, flat: true, col: [0.6, 0.8, 1] });
    }
  }

  function tree(b, m, s, dead) {
    b.cyl(m, 0.22 * s, 0.14 * s, 0, 3.2 * s, 6, 'bark');
    if (dead) {
      for (let k = 0; k < 5; k++) b.box(M4.mul(m, M4.trs(0, (1.8 + k * 0.35) * s, 0, k * 1.3, 0.9, 0)), -0.04, 0, -0.04, 0.04, 1.4 * s, 0.04, 'bark');
      return;
    }
    for (let k = 0; k < 3; k++) {
      const y = (2 + k * 1.1) * s, r = (2.0 - k * 0.5) * s;
      b.cyl(M4.mul(m, M4.trs(0, y, 0, k, 0, 0)), r, r * 0.3, 0, 1.7 * s, 7, 'leaves', { blend: 'alphatest', caps: false });
      b.cyl(M4.mul(m, M4.trs(0, y, 0, k, 0, 0)), r * 0.85, r * 0.2, 0.1, 1.5 * s, 7, 'hedge', { caps: true });
    }
  }

  function drawStatic(b, md, t) {
    const m = M4.trs(md.x, md.y, md.z, md.yaw, 0, 0, md.scale, md.scale, md.scale);
    switch (md.kind) {
      case 'lamp':
        b.box(m, -0.07, 0, -0.07, 0.07, 5, 0.07, 'gun');
        b.box(m, -0.05, 4.9, 0, 0.05, 5.0, 1.1, 'gun');
        b.box(m, -0.18, 4.75, 0.9, 0.18, 4.9, 1.3, 'light', { flat: true, col: [1, 0.95, 0.8] });
        break;
      case 'bench': b.box(m, -0.9, 0.42, -0.2, 0.9, 0.48, 0.2, 'wood'); b.box(m, -0.9, 0.48, -0.22, 0.9, 0.9, -0.18, 'wood'); for (const x of [-0.8, 0.8]) b.box(m, x - 0.04, 0, -0.2, x + 0.04, 0.42, 0.2, 'gun'); break;
      case 'tree': tree(b, m, 1, false); break;
      case 'deadtree': tree(b, m, 1, true); break;
      case 'bush': b.sphere(M4.mul(m, M4.trs(0, 0.5, 0, 0, 0, 0)), 0.9, 7, 'hedge', { sy: 0.7 }); break;
      case 'trashcan': b.cyl(m, 0.3, 0.3, 0, 0.9, 8, 'metal_green'); break;
      case 'sandbags': for (let k = 0; k < 3; k++) b.box(m, -1.2 + (k % 2) * 0.1, k * 0.25, -0.3, 1.2 - (k % 2) * 0.1, k * 0.25 + 0.25, 0.3, 'cloth_brown', { col: [0.9, 0.85, 0.7] }); break;
      case 'barricade': b.box(m, -1.5, 0, -0.15, 1.5, 2.2, 0.15, 'combine_wall'); b.box(m, -1.6, 2.2, -0.2, 1.6, 2.35, 0.2, 'synth_dark'); break;
      case 'wreck': car(b, M4.mul(m, M4.trs(0, 0.7, 0, 0, 0, 0.04)), 0.95, 0.7, 2.1); break;
      case 'bus': b.box(m, -1.3, 0.4, -5, 1.3, 3.2, 5, { side: 'train', front: 'metal_rust', back: 'metal_rust', top: 'metal_rust' }); break;
      case 'wagon': b.box(m, -1.5, 0.6, -6, 1.5, 3.6, 6, { side: 'train', front: 'metal_green', back: 'metal_green', top: 'roof_tin' }); for (const z of [-4.5, 4.5]) b.box(m, -1.2, 0, z - 1, 1.2, 0.6, z + 1, 'gun'); break;
      case 'grave': b.box(m, -0.35, 0, -0.08, 0.35, 0.8, 0.08, 'rock'); break;
      case 'cross': b.box(m, -0.06, 0, -0.06, 0.06, 1.3, 0.06, 'wood'); b.box(m, -0.35, 0.85, -0.05, 0.35, 0.97, 0.05, 'wood'); break;
      case 'pole': b.cyl(m, 0.12, 0.1, 0, 9, 6, 'bark'); b.box(m, -1.2, 8.2, -0.06, 1.2, 8.35, 0.06, 'wood'); break;
      case 'antenna': b.box(m, -0.05, 0, -0.05, 0.05, 6, 0.05, 'gun'); for (let k = 1; k < 5; k++) b.box(m, -0.6 + k * 0.1, k * 1.2, -0.03, 0.6 - k * 0.1, k * 1.2 + 0.05, 0.03, 'gun'); break;
      case 'crane': b.box(m, -0.5, 0, -0.5, 0.5, 18, 0.5, 'metal_rust'); b.box(m, -0.4, 17, -4, 0.4, 18, 14, 'metal_rust'); break;
      case 'pipe': b.cyl(M4.mul(m, M4.trs(0, 0, 0, 0, PI / 2, 0)), md.r || 0.3, md.r || 0.3, 0, md.len || 4, 8, 'pipe', { caps: false }); break;
      case 'tank': b.cyl(m, 3, 3, 0, 6, 12, 'metal_rust', { cap: 'metal' }); break;
      case 'lighthouse': b.cyl(m, 2.2, 1.6, 0, 18, 10, 'plaster_white', { cap: 'metal' }); b.cyl(M4.mul(m, M4.trs(0, 18, 0, 0, 0, 0)), 1.4, 1.4, 0, 2, 8, 'glass', { blend: 'alpha' }); b.cyl(M4.mul(m, M4.trs(0, 20, 0, 0, 0, 0)), 1.6, 0.2, 0, 1.4, 8, 'cloth_red', { col: [0.7, 0.2, 0.15] }); break;
      case 'citadel':
        b.box(m, -30, 0, -30, 30, 700, 30, 'citadel', { world: 40 });
        b.box(m, -38, 0, -38, 38, 120, 38, 'citadel', { world: 40 });
        b.box(m, -22, 700, -22, 22, 760, 22, 'citadel', { world: 40 });
        break;
      case 'screen': b.box(m, -1.2, 0, -0.1, 1.2, 1.5, 0.1, { side: 'gun', front: 'screen', back: 'gun', top: 'gun' }); break;
      case 'teleporter': teleporter(b, m, t, md); break;
      case 'reactor': reactor(b, m, t, md); break;
      case 'thumper': thumper(b, m, t, md); break;
      case 'pod': b.sphere(M4.mul(m, M4.trs(0, 1.1, 0, 0, 0, 0)), 1.1, 8, 'synth_dark', { sy: 1.2 }); b.box(m, -0.2, 2.3, -0.2, 0.2, 5, 0.2, 'gun'); break;
      case 'shelf': b.box(m, -1, 0, -0.25, 1, 2, 0.25, 'wood', { skip: ['front'] }); for (let k = 0; k < 4; k++) b.box(m, -0.98, k * 0.5, -0.24, 0.98, k * 0.5 + 0.04, 0.24, 'wood'); break;
      case 'desk': b.box(m, -0.8, 0.72, -0.4, 0.8, 0.78, 0.4, 'wood'); b.box(m, -0.8, 0, -0.4, -0.4, 0.72, 0.4, 'wood'); b.box(m, 0.4, 0, -0.4, 0.8, 0.72, 0.4, 'wood'); break;
      case 'computer': b.box(m, -0.25, 0, -0.2, 0.25, 0.4, 0.2, { side: 'white', front: 'screen', top: 'white' }, { col: [0.85, 0.83, 0.75] }); break;
      case 'console': b.box(m, -0.6, 0, -0.3, 0.6, 1.0, 0.3, { side: 'combine', front: 'screen', top: 'synth_dark' }); break;
      case 'bed': b.box(m, -0.5, 0, -1, 0.5, 0.45, 1, 'metal'); b.box(m, -0.45, 0.45, -0.95, 0.45, 0.6, 0.95, 'cloth_white', { col: [0.8, 0.78, 0.7] }); break;
      case 'fence': for (let k = -2; k <= 2; k++) b.box(m, k * 1 - 0.04, 0, -0.04, k * 1 + 0.04, 2, 0.04, 'gun'); b.box(m, -2, 0, -0.01, 2, 2, 0.01, 'chainlink', { blend: 'alphatest', world: 1 }); break;
      case 'boat': b.box(m, -1.2, 0, -3, 1.2, 1, 3, 'metal_rust'); break;
      case 'statue': b.box(m, -1, 0, -1, 1, 1.6, 1, 'marble'); b.box(m, -0.4, 1.6, -0.3, 0.4, 3.4, 0.3, 'marble'); b.box(m, -0.2, 3.4, -0.2, 0.2, 3.8, 0.2, 'marble'); break;
      case 'crate_stack': b.box(m, -1, 0, -1, 1, 2, 1, 'crate', { world: 1 }); break;
      case 'light': b.box(m, -0.3, -0.05, -0.3, 0.3, 0, 0.3, 'light', { flat: true, col: [1, 0.97, 0.85] }); break;
      case 'light_blue': b.box(m, -0.3, -0.05, -0.3, 0.3, 0, 0.3, 'light_blue', { flat: true, col: [1, 1, 1] }); break;
      case 'light_red': b.box(m, -0.15, -0.15, -0.15, 0.15, 0.15, 0.15, 'light_red', { flat: true, col: [1, 1, 1] }); break;
    }
  }

  function teleporter(b, m, t, md) {
    b.cyl(m, 1.6, 1.6, 0, 0.3, 12, 'metal', { cap: 'metal' });
    for (let k = 0; k < 4; k++) {
      const a = k * PI / 2 + PI / 4;
      b.box(M4.mul(m, M4.trs(Math.sin(a) * 1.5, 0, Math.cos(a) * 1.5, a, 0, 0)), -0.12, 0, -0.12, 0.12, 3.2, 0.12, 'metal_rust');
    }
    b.cyl(M4.mul(m, M4.trs(0, 3.2, 0, 0, 0, 0)), 1.7, 1.2, 0, 0.4, 12, 'metal', { cap: 'metal' });
    if (md.active) {
      const k = 0.5 + Math.sin(t * 20) * 0.3;
      b.cyl(M4.mul(m, M4.trs(0, 0.3, 0, t * 3, 0, 0)), 1.1, 1.1, 0, 2.9, 10, 'field', { blend: 'add', alpha: k, flat: true, col: [0.8, 0.9, 1], caps: false });
    }
  }

  function reactor(b, m, t, md) {
    b.cyl(m, 3, 3, 0, 1, 12, 'combine', { cap: 'synth_dark' });
    b.cyl(M4.mul(m, M4.trs(0, 1, 0, 0, 0, 0)), 1.2, 1.2, 0, 14, 10, 'synth_dark', { caps: false });
    const k = md.hits || 0;
    b.cyl(M4.mul(m, M4.trs(0, 1, 0, t * 2, 0, 0)), 0.8, 0.8, 0, 14, 10, 'field', { blend: 'add', alpha: 0.6 + 0.3 * Math.sin(t * (6 + k * 6)), flat: true, col: [0.6 + k * 0.1, 0.8, 1], caps: false });
    for (let r = 0; r < 3; r++) b.cyl(M4.mul(m, M4.trs(0, 3 + r * 4, 0, t * (r + 1), 0, 0)), 2.2, 2.2, 0, 0.4, 12, 'combine', { cap: 'synth_dark' });
  }

  function thumper(b, m, t, md) {
    b.box(m, -0.8, 0, -0.8, 0.8, 0.4, 0.8, 'metal_rust');
    for (const x of [-0.6, 0.6]) b.box(m, x - 0.1, 0.4, -0.1, x + 0.1, 3.5, 0.1, 'metal_rust');
    const ph = md.on === false ? 1 : (Math.sin(t * 2.2) + 1) / 2;
    b.box(m, -0.5, 0.5 + ph * 2.4, -0.5, 0.5, 1.0 + ph * 2.4, 0.5, 'hazard');
  }

  function hands(b, m, tex = 'hev') {
    b.box(m, 0.08, -0.3, -0.02, 0.19, -0.2, 0.16, tex);
    b.box(m, 0.07, -0.31, 0.12, 0.18, -0.2, 0.22, 'cloth_black');
  }

  function viewModel(b, id, anim, p, t) {
    const base = M4.trs(0.02, -0.02, -0.2, PI, 0, 0, 0.85, 0.85, 0.85);
    const sw = anim.swing, kick = anim.kick;
    const V = (x, y, z, yaw = 0, pitch = 0, roll = 0) => M4.mul(base, M4.trs(x, y, z, yaw, pitch, roll));
    const bx = anim.bobX, by = anim.bobY;
    const suit = p.suit ? 'hev' : 'cloth_blue';
    if (id === 'crowbar') {
      const s = sw > 0 ? Math.sin(Math.min(1, sw) * PI) : 0;
      const m = V(-0.2 + bx, -0.28 + by + s * 0.1, 0.35, -0.3 - s * 0.6, 0.6 - s * 1.6, -0.2);
      b.box(m, -0.012, -0.012, 0, 0.012, 0.012, 0.62, 'cloth_red', { col: [0.8, 0.25, 0.2] });
      b.box(m, -0.012, -0.012, 0.62, 0.012, 0.08, 0.64, 'cloth_red', { col: [0.8, 0.25, 0.2] });
      b.box(V(-0.22 + bx, -0.33 + by + s * 0.1, 0.25, -0.3 - s * 0.6, 0.6 - s * 1.6, -0.2), -0.05, -0.05, -0.2, 0.05, 0.05, 0.06, suit);
      return;
    }
    if (id === 'gravgun') {
      const m = V(-0.16 + bx, -0.24 + by, 0.3 - kick * 0.08, 0, kick * 0.2, 0);
      const tex = p.superGG ? 'gg_blue' : 'gg';
      b.box(m, -0.09, -0.07, -0.1, 0.09, 0.09, 0.28, tex);
      b.box(m, -0.06, -0.12, -0.3, 0.06, 0.02, -0.1, 'gun');
      for (let k = 0; k < 3; k++) {
        const a = k * 2.09 + (p.held ? 0 : Math.sin(t * 3) * 0.05);
        const open = p.held ? 0.25 : 0.12;
        b.box(M4.mul(m, M4.trs(Math.sin(a) * 0.07, Math.cos(a) * 0.07 + 0.01, 0.28, 0, 0, a)), -0.012, -0.012, 0, 0.012, 0.012 + open * 0.3, 0.16, 'gun_light');
      }
      hands(b, V(-0.12 + bx, -0.08 + by, 0.12), suit);
      return;
    }
    const recoil = kick;
    const m = V(-0.14 + bx, -0.2 + by - recoil * 0.02, 0.3 - recoil * 0.06, 0, recoil * 0.25, 0);
    switch (id) {
      case 'pistol': b.box(m, -0.02, -0.03, 0, 0.02, 0.02, 0.2, 'gun'); b.box(m, -0.018, -0.12, 0.02, 0.018, -0.03, 0.07, 'gun'); break;
      case 'magnum': b.box(m, -0.022, -0.03, 0, 0.022, 0.025, 0.26, 'gun_light'); b.cyl(M4.mul(m, M4.trs(0, -0.005, 0.07, 0, PI / 2, 0)), 0.035, 0.035, -0.03, 0.03, 6, 'gun_light'); b.box(m, -0.02, -0.14, 0, 0.02, -0.03, 0.05, 'wood'); break;
      case 'smg': b.box(m, -0.03, -0.04, -0.12, 0.03, 0.04, 0.26, 'gun'); b.box(m, -0.02, -0.16, 0.08, 0.02, -0.04, 0.12, 'gun'); b.box(m, -0.012, -0.012, 0.26, 0.012, 0.012, 0.34, 'gun'); b.box(m, -0.03, -0.07, 0.14, 0.03, -0.04, 0.22, 'gun_light'); break;
      case 'ar2': b.box(m, -0.035, -0.05, -0.18, 0.035, 0.06, 0.3, 'synth_dark'); b.box(m, -0.018, -0.018, 0.3, 0.018, 0.018, 0.45, 'gun'); b.box(m, -0.008, 0.06, 0.02, 0.008, 0.07, 0.1, 'light_blue', { flat: true, col: [0.8, 0.95, 1] }); b.sphere(M4.mul(m, M4.trs(0, -0.02, -0.1, 0, 0, 0)), 0.035, 6, 'light_blue', { flat: true, col: [0.6, 0.8, 1] }); break;
      case 'shotgun': b.box(m, -0.025, -0.02, -0.15, 0.025, 0.03, 0.45, 'gun'); b.box(m, -0.028, -0.06, 0.08, 0.028, -0.02, 0.3, 'wood'); b.box(m, -0.03, -0.06, -0.25, 0.03, 0.02, -0.12, 'wood'); break;
      case 'crossbow': b.box(m, -0.03, -0.04, -0.15, 0.03, 0.03, 0.35, 'gun'); b.box(m, -0.3, -0.005, 0.28, 0.3, 0.02, 0.32, 'gun_light'); b.box(m, -0.005, 0.03, -0.1, 0.005, 0.04, 0.35, 'light_orange', { flat: true, col: [1, 0.7, 0.4] }); b.box(m, -0.02, 0.04, -0.05, 0.02, 0.08, 0.08, 'gun'); break;
      case 'grenade': if (!p.ammo.grenade) break; b.box(V(-0.16 + bx, -0.22 + by - sw * 0.2, 0.28), -0.035, -0.05, -0.035, 0.035, 0.05, 0.035, 'soldier'); break;
      case 'rpg': b.cyl(M4.mul(V(-0.18 + bx, -0.14 + by, 0.3), M4.trs(0, 0, 0, 0, PI / 2, 0)), 0.07, 0.07, -0.25, 0.5, 8, 'metal_green', { cap: 'gun' }); b.box(V(-0.18 + bx, -0.14 + by, 0.3), -0.02, 0.06, 0.1, 0.02, 0.12, 0.2, 'gun'); break;
      case 'bugbait': b.sphere(V(-0.16 + bx, -0.22 + by, 0.28 + (anim.squeeze || 0) * 0.02), 0.06, 6, 'antlion', { sy: 0.8 }); break;
    }
    hands(b, V(-0.12 + bx, -0.08 + by - recoil * 0.02, 0.12 - recoil * 0.06), suit);
  }

  H.Batch = Batch;
  H.Models = { drawNpc, drawProp, drawItem, drawProjectile, drawVehicle, drawDoor, drawCharger, drawButton, drawSurface, drawHazard, drawStatic, viewModel, SKINS };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
