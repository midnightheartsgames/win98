(function (N) {
  'use strict';

  const M3 = N.M3;
  const LK = N.LAMPKIND;

  const MARKER_COL = {
    mission: [255, 210, 40], save: [60, 200, 255], shop: [255, 140, 30], clothes: [255, 140, 30], respray: [80, 140, 255], tele: [240, 240, 255], buy: [80, 230, 90],
    ride: [120, 200, 255], tir: [255, 90, 70], food: [255, 170, 60],
    dest: [255, 60, 190], enemy: [230, 40, 30], veh: [60, 140, 255], friend: [60, 220, 90], pickup: [255, 220, 40]
  };
  N.MARKER_COL = MARKER_COL;
  const WHITE = [255, 255, 255, 255];
  const DARK = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const WL = N.M3.mat(), WM = N.M3.mat(), WT = N.M3.mat(), WS = new Float32Array(12), DM = new Float32Array(12);
  const DL = N.M3.mat(), DM2 = N.M3.mat(), DT = N.M3.mat(), DS = new Float32Array(12), NEEDLE_LAMP = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const NEEDLE_ZERO = Math.PI * 0.75, NEEDLE_SWEEP = Math.PI * 1.5;
  N.dialTop = spec => Math.max(140, Math.ceil(spec.vmax * 3.6 * 1.1 / 20) * 20);
  N.dialValue = (v, k, fix) => {
    const run = !!v.driver && !v.dead;
    if (k === 'spd') return N.clamp(Math.abs(v.spd || 0) * 3.6 / N.dialTop(v.spec), 0, 1);
    if (k === 'rpm') return run ? N.clamp((v.rpm || 0.2) / 1.1, 0, 1) : 0;
    return run ? fix || 0 : 0;
  };
  const HELI_PAINT = { mi2: N.hex('#2a4a8a'), mi8: N.hex('#3d5068'), mi24: N.hex('#56603e') }, HELI_LOOK = [0.7, 0.15, 0], HELI_ARMY = [0.25, 0.5, 0], HELI_BURNT = [0, 1, 0];
  let ROPE_MB = null;
  const ROPE = () => {
    if (ROPE_MB) return ROPE_MB;
    ROPE_MB = new N.MB(32);
    ROPE_MB.box(-0.018, -1, -0.018, 0.018, 0, 0.018, { layer: N.TEX.darkmetal, kind: 0, c: [74, 64, 48, 255] });
    return ROPE_MB;
  };
  const BURNT = [0, 1, 0], NEW_CAR = [0.85, 0.05, 0], FLAME_AT = {};
  N.LOD_NEAR = 24;
  N.LOD_MID = 64;
  N.CAR_DETAIL = {
    high: { name: 'высокая', near: 24, mid: 64, inside: true, cones: 3, steer: 60 },
    mid: { name: 'средняя', near: 16, mid: 44, inside: true, cones: 2, steer: 30 },
    low: { name: 'низкая', near: 9, mid: 28, inside: false, cones: 1, steer: 0 }
  };
  N.carLod = (d, own, CD) => (own || d < CD.near ? 0 : d < CD.mid ? 1 : 2);

  N.carLook = v => {
    if (v.dead) return BURNT;
    const s = v.spec, L = v.livery && s.liveries ? s.liveries[v.livery] : null;
    const age = N.clamp((2000 - (s.year || 1990)) / 25, 0, 1);
    const metal = N.METALLIC.has(v.color) ? 0.12 : 0;
    const gloss = L && L.gloss !== undefined ? L.gloss : N.clamp(0.92 - age * 0.7 * (1 - metal * 2) + metal + (N.hash2(v.id, 11, 3) - 0.5) * 0.3, 0.12, 0.97);
    const dirt = L && L.dirt !== undefined ? L.dirt : N.clamp(age * 0.45 + N.hash2(v.id, 23, 5) * 0.4 + (s.dirty || 0), 0, 1);
    const tint = L && L.tint !== undefined ? L.tint : N.hash2(v.id, 37, 7) < (s.tintChance || 0) ? 0.6 : s.tint || 0;
    return [gloss, dirt, tint];
  };

  N.spotCars = (order, own, others) => {
    const out = new Set();
    for (const [d, v] of order) if (v === own && v.lights && !v.dead) out.add(v);
    let n = 0;
    for (let i = order.length - 1; i >= 0 && n < others; i--) {
      const [d, v] = order[i];
      if (d > 60) break;
      if (v === own || !v.lights || v.dead) continue;
      out.add(v);
      n++;
    }
    return out;
  };
  const HEAD_GLOW = [255, 245, 210, 160], TAIL_GLOW = [255, 40, 30, 150], TAIL_BRAKE = [255, 40, 30, 255], TAIL_STOP = [255, 40, 30, 220], REV_GLOW = [255, 255, 240, 170], IND_GLOW = [255, 160, 40, 220];

  N.lampGlow = (M, a, eye, o) => {
    const p = a.p, n = a.n, r = o || {};
    r.x = M[0] * p[0] + M[1] * p[1] + M[2] * p[2] + M[9];
    r.y = M[3] * p[0] + M[4] * p[1] + M[5] * p[2] + M[10];
    r.z = M[6] * p[0] + M[7] * p[1] + M[8] * p[2] + M[11];
    const nx = M[0] * n[0] + M[1] * n[1] + M[2] * n[2], ny = M[3] * n[0] + M[4] * n[1] + M[5] * n[2], nz = M[6] * n[0] + M[7] * n[1] + M[8] * n[2];
    const dx = eye[0] - r.x, dy = eye[1] - r.y, dz = eye[2] - r.z, d = Math.hypot(dx, dy, dz) || 1;
    const pull = Math.min(0.7, d * 0.35);
    r.k = N.smooth(0.02, 0.4, (nx * dx + ny * dy + nz * dz) / d);
    r.gx = r.x + dx / d * pull; r.gy = r.y + dy / d * pull; r.gz = r.z + dz / d * pull;
    r.gs = (d - pull) / d;
    return r;
  };

  class Scene {
    constructor(renderer, geo, city) {
      this.r = renderer;
      this.geo = geo;
      this.city = city;
      this.fallMesh = null;
    }

    syncBroken(W) {
      if (this.brkWorld === W && this.brkVer === W.brkVer) return;
      const hid = this.hidProps || (this.hidProps = new Set()), want = new Set();
      for (const rec of W.broken.keys()) want.add(rec.p);
      for (const p of [...hid]) if (!want.has(p) && this.r.setPropHidden(p, false)) hid.delete(p);
      for (const p of want) if (!hid.has(p) && this.r.setPropHidden(p, true)) hid.add(p);
      this.brkWorld = W;
      this.brkVer = W.brkVer;
    }

    carMatrix(v) {
      const lift = v.dead ? 0 : 0;
      return M3.euler((v.pitch || 0) + (v.bodyPitch || 0), -v.yaw, v.roll || 0, v.x, v.y + lift, v.z);
    }

    fill(f) {
      const R = this.r, world = f.world, game = f.game, cam = f.cam, env = f.env, fx = f.fx, t = f.time;
      const org = [Math.round(cam.x), Math.round(cam.y), Math.round(cam.z)];
      this.headless = !!cam.headless;
      this.ads = cam.ads || 0;
      R.dyn.reset(org);
      R.glass.reset(org);
      R.sprites.reset(org);
      R.addSprites.reset(org);
      R.fxq.reset(org);
      const FT = N.FXT;
      const amb = N.clamp((env.sky[0] + env.sky[1] + env.sky[2]) * 0.5 + (env.sunCol[0] + env.sunCol[1] + env.sunCol[2]) * 0.15, 0.12, 1.15);
      const shadowK = 0.55 + 0.45 * N.clamp((env.sunCol[0] + env.sunCol[1] + env.sunCol[2]) / 2.2, 0, 1);
      const halo = env.halo || 1;
      const eye = [cam.x, cam.y, cam.z];
      this.camPos = eye;
      const fwd = [cam.tx - cam.x, cam.ty - cam.y, cam.tz - cam.z];
      const fl = Math.hypot(fwd[0], fwd[1], fwd[2]) || 1;
      fwd[0] /= fl; fwd[1] /= fl; fwd[2] /= fl;
      let Rv = [fwd[2], 0, -fwd[0]];
      const rl = Math.hypot(Rv[0], Rv[2]) || 1;
      Rv = [-Rv[0] / rl, 0, -Rv[2] / rl];
      const Uv = [Rv[1] * fwd[2] - Rv[2] * fwd[1], Rv[2] * fwd[0] - Rv[0] * fwd[2], Rv[0] * fwd[1] - Rv[1] * fwd[0]];
      this.R = Rv;
      this.U = Uv;
      const maxD = cam.scope ? env.fogFar + 20 : Math.min(env.fogFar + 20, 320);
      const pedD = cam.scope ? env.fogFar + 20 : 150;
      const vis = (x, z, r) => {
        const dx = x - cam.x, dz = z - cam.z;
        const d = Math.hypot(dx, dz);
        if (d > maxD + r) return false;
        if (d < 18 + r) return true;
        return (dx * fwd[0] + dz * fwd[2]) / d > 0.35 - r / d;
      };
      const night = env.night;
      const interior = !!env.interior;
      const lights = [];
      const W = world;
      const blink = Math.floor(t * 4) % 2;
      const tick = Math.floor(t * 3) % 2 === 0;
      const carBeam = Math.max(0, env.beam - 0.15 * night);
      const inside = x => this.city.inside(x);
      const camInside = interior;
      const metroCam = !!env.metro, ML = this.city.metroLine;
      const metroDim = p => (metroCam && ML ? Math.min(1, Math.max(0.3, ML.light(p.x, p.z, p.y) / (env.metroK || 1) + (p.mseat || W.metro && W.metro.player.aboard && p.isPlayer ? 1 : 0))) : 1);
      const order = [];
      for (const v of W.vehs) {
        if (inside(v.x) !== camInside) continue;
        if (!vis(v.x, v.z, v.spec.hl)) continue;
        order.push([Math.hypot(v.x - cam.x, v.z - cam.z), v]);
      }
      order.sort((a, b) => b[0] - a[0]);
      const CD = N.CAR_DETAIL[f.cars] || N.CAR_DETAIL.high;
      const spotCars = N.spotCars(order, W.player.veh, f.quality === 'low' ? 0 : CD.cones);
      const glow = this.glowOut || (this.glowOut = {});
      for (const [dcam, v] of order) {
        const own = v === W.player.veh, m = N.Models.car(v.model, v.livery, N.carLod(dcam, own, CD));
        const M = this.carMatrix(v);
        const paint = N.hex(v.dead ? '#1a1816' : v.color);
        const dim = v.dead ? 0.35 : v.hp < v.maxHp * 0.3 ? 0.8 : 1;
        const look = N.carLook(v);
        const ind = v.dead ? 0 : v.ind || 0;
        const lamp = v.dead ? DARK : [v.lights ? 2.6 : 0, v.brake ? 2.4 : v.lights ? 1.3 : 0, v.siren ? (blink ? 3 : 0.4) : 0, v.siren ? (blink ? 0.4 : 3) : 0, v.livery === 'taxi' && night > 0.3 ? 2.2 : 0, v.rev ? 2.2 : 0, tick && (ind === -1 || ind === 2) ? 2 : 0, tick && (ind === 1 || ind === 2) ? 2 : 0, v.lights ? 1.6 : 0, v.lights ? 0.9 : 0];
        R.dyn.add(m.mb, M, paint, null, null, lamp, dim, look);
        if (m.lod === 0 && !m.bike && !m.armor && (CD.inside || own)) {
          const ins = N.Cars.inside(v.model, v.livery, (v.id * 7 + 3) % (m.trims || 1));
          R.dyn.add(ins, M, paint, null, null, lamp, dim);
          if (ins.dials) this.dials(v, ins.dials, M, dim);
        }
        if (!v.dead) R.glass.add(m.gl, M, null, null, null, null, 1, look);
        if (m.plates.length && v.plateCls) {
          const pm = N.Models.plate('plate|' + v.plateCls + '|' + v.plateIdx);
          if (pm) for (const q of m.plates) R.dyn.add(pm, M3.mul(M, q), null, null, null, null, dim);
        }
        if (m.rear) {
          const d = m.rear, ry = -(v.rearDoor || 0) * 1.75, c = Math.cos(ry), sn = Math.sin(ry);
          R.dyn.add(d.mb, M3.mul(M, M3.euler(0, ry, 0, d.hx - (c * d.hx + sn * d.hz), 0, d.hz - (-sn * d.hx + c * d.hz))), paint, null, null, null, dim, look);
        }
        if (m.doors) {
          for (let k = 0; k < 2; k++) {
            const d = m.doors[k];
            const ry = d.sx * N.smooth(0, 1, (v.door && v.door[k]) || 0) * 1.15;
            const c = Math.cos(ry), sn = Math.sin(ry);
            const DM = M3.mul(M, M3.euler(0, ry, 0, d.hx - (c * d.hx + sn * d.hz), 0, d.hz - (-sn * d.hx + c * d.hz)));
            R.dyn.add(d.mb, DM, paint, null, null, null, dim, look);
            if (!v.dead) R.glass.add(d.gl, DM, null, null, null, null, 1, look);
          }
        }
        const wm = m.wheel || N.Models.wheel(), wdim = v.dead ? 0.3 : 1;
        if (m.wheelsMb) R.dyn.add(m.wheelsMb, M, null, null, null, null, wdim);
        else for (const w of m.wheels) {
          const steer = w.front ? -(v.steer || 0) : 0;
          M3.euler(-((w.front || v.wheelRotR === undefined ? v.wheelRot : v.wheelRotR) || 0), steer + (w.sx < 0 ? Math.PI : 0), 0, w.x, w.y + N.Phys.wheelLift(v, w.x, w.z), w.z, WL);
          const sc = w.r;
          WS[0] = (w.thin ? 0.35 : 1) * sc; WS[4] = sc; WS[8] = sc;
          R.dyn.add(w.kind ? m.wheelKinds[w.kind] : wm, M3.mul(M3.mul(M, WL, WM), WS, WT), null, null, null, null, wdim);
        }
        if (m.turret) {
          const tq = m.turret, gq = m.gun, TM = M3.mul(M, M3.euler(0, -(v.turretYaw || 0), 0, tq.pivot[0], tq.pivot[1], tq.pivot[2]));
          R.dyn.add(tq.mb, TM, paint, null, null, null, dim, look);
          R.dyn.add(gq.mb, M3.mul(TM, M3.euler(v.gunPitch || 0, 0, 0, gq.pivot[0], gq.pivot[1], gq.pivot[2] + (v.recoil || 0) * 0.35)), paint, null, null, null, dim, look);
        }
        if (m.cargo) {
          const cm = N.Models.car(m.cargo.model, null, m.lod);
          const CM = M3.mul(M, M3.euler(0, 0, 0, 0, m.cargo.y, m.cargo.z));
          const cc = N.hex(['#e6e2d6', '#121212', '#1e3050', '#7e1a22'][v.id % 4]);
          R.dyn.add(cm.mb, CM, cc, null, null, null, 1, NEW_CAR);
          R.glass.add(cm.gl, CM, null, null, null, null, 1, NEW_CAR);
          for (const d of cm.doors || []) {
            R.dyn.add(d.mb, CM, cc, null, null, null, 1, NEW_CAR);
            R.glass.add(d.gl, CM, null, null, null, null, 1, NEW_CAR);
          }
          for (const w of cm.wheels) {
            const L = M3.euler(0, w.sx < 0 ? Math.PI : 0, 0, w.x, w.y, w.z);
            const S = new Float32Array(12);
            S[0] = w.r; S[4] = w.r; S[8] = w.r;
            R.dyn.add(cm.wheel || wm, M3.mul(M3.mul(CM, L), S), null, null, null, null, 1);
          }
        }
        const occ = [v.driver].concat(v.pass).filter(Boolean);
        if (m.cab && !m.bike && !m.armor && (own || m.lod === 0 && CD.inside || v.driver && dcam < CD.steer)) {
          const ws = m.cab.wheel;
          const WS = new Float32Array(12);
          WS[0] = ws.r; WS[4] = ws.r; WS[8] = ws.r;
          R.dyn.add(N.Cars.steer(m.steer), M3.mul(M3.mul(M, M3.euler(-ws.tilt, 0, -(v.steer || 0) * 2.4, ws.x, ws.y, ws.z)), WS), null, null, null, null, dim);
        }
        if (dcam < 80 && !m.armor) {
          occ.forEach((p, i) => {
            if (p.hidden || cam.hidePlayer && p.isPlayer) return;
            const s = m.seat;
            const sx = i === 0 ? s.x : i === 1 ? -s.x : (i % 2 ? s.x : -s.x);
            const sz = i < 2 ? s.z : s.z + 0.9;
            const cb = N.cabin(v.spec), tall = (p.look && p.look.tall) || 1, car = m.bike && i && cb.side;
            const ry = car ? cb.side.y + N.SIT_HIP - N.PELVIS_Y * tall : N.seatRoot(cb, tall) + (m.bike && i ? 0.05 : 0);
            let root = M3.mul(M, M3.euler(0, 0, 0, car ? cb.side.x : m.bike && i ? s.x : sx, ry, car ? cb.side.z : m.bike && i ? s.z + 0.4 : sz));
            let sit = 1;
            const b = p.anim && p.anim.board;
            if (b && b.t < 0.55 && !m.bike) {
              const k = N.smooth(0, 1, b.t / 0.55);
              const lx = (b.side < 0 ? -1 : 1) * (v.spec.hw - 0.02), lz = s.z + 0.08;
              const c = Math.cos(v.yaw), sn = Math.sin(v.yaw);
              const gx = v.x + lx * c - lz * sn, gz = v.z + lx * sn + lz * c;
              const sxw = root[9], szw = root[11], syw = root[10];
              const x = k < 0.5 ? N.lerp(b.x, gx, k * 2) : N.lerp(gx, sxw, k * 2 - 1);
              const z = k < 0.5 ? N.lerp(b.z, gz, k * 2) : N.lerp(gz, szw, k * 2 - 1);
              const face = N.yawOf(-b.side * c, -b.side * sn);
              const yaw = N.wrap(face + N.wrap(v.yaw - face) * N.smooth(0.2, 0.9, k));
              root = M3.euler(0, -yaw, 0, x, N.lerp(b.y, syw, N.smooth(0.15, 0.85, k)), z);
              sit = N.smooth(0.05, 0.9, k);
            }
            this.addPed(p, root, t, { sit, dist: dcam, duck: sit < 1 });
          });
        }
        const sh = N.clamp(1 - (v.y - this.city.groundY(v.x, v.z)) / 4, 0, 1);
        if (sh > 0.05 && !camInside) R.sprites.ground(v.x, this.city.groundY(v.x, v.z) + 0.04, v.z, v.spec.hw + 0.35, v.spec.hl + 0.35, v.yaw, 6, [0, 0, 0, Math.round(170 * sh * (1 - night * 0.4) * shadowK)]);
        const fx0 = Math.sin(v.yaw), fz0 = -Math.cos(v.yaw), rx = -fz0, rz = fx0;
        if (v.fire && dcam < 160) {
          const hl = v.spec.hl, by = v.spec.shape.belt * 0.85, eng = (N.Phys.handling(v.spec).rearEngine ? 1 : -1) * hl * 0.6;
          const flames = v.fire < 1 ? [[eng, 0.8, 0.55], [eng * 0.75, 0.55, 0.4]] : [[0, 1.25, 0.95], [-hl * 0.45, 0.85, 0.65], [hl * 0.4, 0.8, 0.6]];
          flames.forEach((q, k) => {
            const hh = q[1] * (1 + 0.25 * Math.sin(t * 3.1 + k * 2 + v.id)), p = N.Phys.point(v, 0, by, q[0], FLAME_AT);
            R.fxq.bill(p.x, p.y, p.z, q[2], hh, FT.FLAME, 0, (v.id * 0.37 + k * 0.21) % 1, WHITE, Rv, [0, 1, 0], 0, true);
          });
        }
        if (!v.dead) {
          for (const a of m.lamps) {
            let size, col;
            if (a.k === 'head') { if (!v.lights) continue; size = (m.bike ? 1.1 : 1.5) * Math.pow(halo, 0.3); col = HEAD_GLOW; }
            else if (a.k === 'tail') { if (!v.lights && !v.brake) continue; size = v.lights ? 0.7 : 0.6; col = v.brake ? (v.lights ? TAIL_BRAKE : TAIL_STOP) : TAIL_GLOW; }
            else if (a.k === 'rev') { if (!v.rev) continue; size = 0.55; col = REV_GLOW; }
            else { if (!lamp[a.side < 0 ? 6 : 7]) continue; size = 0.5; col = IND_GLOW; }
            N.lampGlow(M, a, eye, glow);
            if (glow.k < 0.01) continue;
            R.addSprites.bill(glow.gx, glow.gy, glow.gz, size * glow.gs, 0, [col[0], col[1], col[2], Math.round(col[3] * glow.k)], Rv, Uv);
          }
        }
        if (v.lights && !v.dead) {
          const gy = this.city.groundY(v.x, v.z) + 0.05;
          const a8 = carBeam > 0.02 && dcam < 70 ? Math.round(255 * carBeam * 0.3 * N.clamp((70 - dcam) / 25, 0, 1)) : 0;
          let cx = 0, cy = 0, cz = 0, nh = 0;
          for (const a of m.lamps) {
            if (a.k !== 'head') continue;
            N.lampGlow(M, a, eye, glow);
            cx += glow.x; cy += glow.y; cz += glow.z; nh++;
            const s = m.bike ? 0 : a.side;
            if (a8 > 0) this.beam([glow.x, glow.y, glow.z], [glow.x + fx0 * 22 + rx * s * 1.4, gy + 0.5, glow.z + fz0 * 22 + rz * s * 1.4], 0.12, 2.8, [255, 240, 210, a8], eye, Rv, Uv);
          }
          if (nh && spotCars.has(v) && lights.length < N.MAX_LIGHTS) {
            const k = v === W.player.veh ? 1 : 0.75;
            lights.push({ x: cx / nh, y: cy / nh, z: cz / nh, r: v === W.player.veh ? 46 : 34, c: [3.0 * k, 2.85 * k, 2.4 * k], d: [fx0 * 0.998, -0.06, fz0 * 0.998], cos: 0.87 });
          } else if (nh) R.addSprites.ground(cx / nh + fx0 * 7, gy, cz / nh + fz0 * 7, 4.2, 7.5, Math.atan2(fz0, fx0) - Math.PI / 2, 7, [120, 110, 90, Math.round(255 * night)]);
        }
        if (v.siren && !v.dead && (blink || !(m.beacon && m.beacon.blue))) {
          const b = m.beacon ? m.beacon.p : [0.3, v.spec.shape.H + 0.2, 0];
          const x = M[0] * b[0] + M[1] * b[1] + M[2] * b[2] + M[9], y = M[3] * b[0] + M[4] * b[1] + M[5] * b[2] + M[10], z = M[6] * b[0] + M[7] * b[1] + M[8] * b[2] + M[11];
          R.addSprites.bill(x, y, z, m.beacon && m.beacon.blue ? 1.6 : 2.2, 0, blink ? [60, 90, 255, 255] : [255, 40, 40, 255], Rv, Uv);
          if (dcam < 60 && lights.length < N.MAX_LIGHTS - 1) lights.push({ x, y: y + 0.5, z, r: 12, c: blink ? [0.3, 0.4, 1.6] : [1.6, 0.25, 0.2] });
        }
        if (v.fire && lights.length < N.MAX_LIGHTS - 1 && dcam < 80) lights.push({ x: v.x, y: v.y + 1.5, z: v.z, r: 12 * Math.sqrt(v.fire), c: [1.6, 0.8, 0.3] });
      }
      for (const p of W.peds) {
        if (p.veh || p.hidden || (cam.fp && !cam.headless || cam.hidePlayer) && p.isPlayer) continue;
        if (inside(p.x) !== camInside) continue;
        if (!vis(p.x, p.z, 1)) continue;
        if (Math.hypot(p.x - cam.x, p.z - cam.z) > pedD) continue;
        const dp = Math.hypot(p.x - cam.x, p.z - cam.z);
        const al = p.anim.alight;
        if (al && al.t < 0.5 && al.v && !al.v.removed) {
          const v = al.v, cab = N.cabin(v.spec);
          const k = N.smooth(0, 1, al.t / 0.5);
          const c = Math.cos(v.yaw), sn = Math.sin(v.yaw);
          const sxl = al.side < 0 ? cab.seat.x : -cab.seat.x;
          const sx = v.x + sxl * c - cab.seat.z * sn, sz = v.z + sxl * sn + cab.seat.z * c;
          const sy = v.y + N.seatRoot(cab, (p.look && p.look.tall) || 1);
          const out = N.yawOf(al.side * c, al.side * sn);
          const yaw = N.wrap(v.yaw + N.wrap(out - v.yaw) * N.smooth(0.1, 0.7, k) * 0.8);
          this.addPed(p, M3.euler(0, -yaw, 0, N.lerp(sx, p.x, k), N.lerp(sy, p.y, N.smooth(0.2, 0.9, k)), N.lerp(sz, p.z, k)), t, { sit: 1 - N.smooth(0.1, 0.85, k), dist: dp, duck: true });
        } else if (p.mseat) {
          const tall = (p.look && p.look.tall) || 1;
          this.addPed(p, M3.euler(0, -(p.yaw || 0), 0, p.x, p.y + 0.5 + N.SIT_HIP - N.PELVIS_Y * tall, p.z), t, { dist: dp, sit: 1, bench: true, dim: metroDim(p) });
        } else if (p.bench && !p.dead && p.state !== 'down' && p.ai && p.ai.mode === 'bench') {
          const tall = (p.look && p.look.tall) || 1;
          this.addPed(p, M3.euler(0, -p.bench.yaw, 0, p.bench.x, p.y + p.bench.y + N.SIT_HIP - N.PELVIS_Y * tall, p.bench.z), t, { dist: dp, sit: 1, bench: true });
        } else this.addPed(p, N.pedRoot(p), t, { dist: dp, dim: metroDim(p) });
        const shY = p.wl !== null && p.wl !== undefined && p.wl > p.y ? p.wl + 0.03 : p.y + 0.03;
        if (!(p.wl !== null && p.wl !== undefined && p.wade > 0.05)) R.sprites.ground(p.x, shY, p.z, 0.45, 0.45, 0, 6, [0, 0, 0, Math.round(140 * (1 - night * 0.5) * shadowK)]);
        if (p.wade > 0.05 && p.wl !== null && p.wl !== undefined && dp < 60) {
          const sp = Math.hypot(p.vx, p.vz);
          const a = Math.round(N.clamp(70 + sp * 25, 0, 150) * (p.swim ? 1.4 : 1));
          R.sprites.ground(p.x, p.wl + 0.02, p.z, 0.55 + Math.sin(t * 3 + p.id) * 0.05, 0.55, t * 0.3, 14, [210, 225, 235, Math.min(220, a)]);
        }
      }
      for (const k of W.pickups) {
        if (k.taken || k.hidden) continue;
        if (k.follow) {
          const p = k.follow;
          if (p.removed || p.veh || p.hidden) continue;
          const c = Math.cos(p.yaw || 0), s = Math.sin(p.yaw || 0);
          k.x = p.x + c * 0.27 + Math.sin(p.yaw || 0) * 0.04; k.z = p.z + s * 0.27 - Math.cos(p.yaw || 0) * 0.04; k.y = p.y + (p.dead ? 0.12 : 0.68); k.yaw = (p.yaw || 0) + Math.PI / 2;
        }
        if (inside(k.x) !== camInside) continue;
        if (!vis(k.x, k.z, 1)) continue;
        const mesh = N.Models.pickup(k);
        if (k.prop || k.follow) { R.dyn.add(mesh, M3.euler(k.tilt || 0, -(k.yaw || 0), 0, k.x, k.y, k.z), null); continue; }
        const bob = Math.sin(t * 2.5 + k.id) * 0.12;
        const M = M3.euler(0, t * 2 + k.id, 0, k.x, k.y + bob, k.z);
        R.dyn.add(mesh, M, null);
        const col = N.hex(N.PICKUPS[k.type] ? N.PICKUPS[k.type].color : '#ffffff');
        R.addSprites.bill(k.x, k.y + bob, k.z, 1.3, 0, [col[0], col[1], col[2], 110], Rv, Uv);
      }
      N.Guns.draw(this, W, fx, lights, Rv, Uv, vis, t);
      if (f.throwAid) N.Guns.aim(this, W, t, Rv, Uv);
      for (const h of [W.drop, W.heli]) {
        if (!h || camInside) continue;
        const hm = N.Cars.heli(h.type), M = M3.euler(-0.06, -h.yaw, h.roll || 0, h.x, h.y, h.z);
        R.dyn.add(hm.mb, M, HELI_PAINT[h.type], null, null, null, h.down ? 0.45 : 1, h.down ? HELI_BURNT : h.type === 'mi24' ? HELI_ARMY : HELI_LOOK);
        R.dyn.add(hm.rotor, M3.mul(M, M3.euler(0, h.rot, 0, hm.hub[0], hm.hub[1], hm.hub[2])), null);
        R.dyn.add(hm.tail, M3.mul(M, M3.euler(h.rot * 2.7, 0, 0, hm.tailAt[0], hm.tailAt[1], hm.tailAt[2])), null);
      }
      const D = W.drop;
      if (D && !camInside && (D.phase === 'hover' || W.peds.some(p => p.rope))) {
        const r = N.AI.ropePoint(D, N.AI.MI8_DOOR), top = D.y + N.AI.MI8_DOOR[1], len = Math.max(0.5, top - D.g);
        const S = new Float32Array(12);
        S[0] = 1; S[4] = len; S[8] = 1;
        R.dyn.add(ROPE(), M3.mul(M3.euler(0, 0, 0, r.x, top, r.z), S), null);
      }
      if (W.heli && !camInside) {
        const h = W.heli;
        if (night > 0.3) {
          const pl = W.player;
          R.addSprites.bill(h.x, h.y - 1.6, h.z, 2.5, 0, [255, 255, 230, 255], Rv, Uv);
          R.addSprites.ground(pl.x, pl.y + 0.06, pl.z, 5, 5, 0, 0, [120, 120, 100, 255]);
          lights.push({ x: pl.x, y: pl.y + 6, z: pl.z, r: 14, c: [1.2, 1.2, 1.0] });
        }
      }
      this.syncBroken(W);
      for (const b of W.debris) {
        if (!vis(b.x, b.z, b.sh.r) || Math.abs(b.x - cam.x) + Math.abs(b.z - cam.z) > 260) continue;
        R.dyn.add(N.Props.debris(this.geo, b), N.Debris.matrix(b, DM), null);
      }
      if (!camInside && night > 0.05) {
        const lamps = this.geo.lamps;
        const near = [];
        for (const L of lamps) {
          if (L.off) continue;
          const dx = L.x - cam.x, dz = L.z - cam.z;
          const d2 = dx * dx + dz * dz;
          if (d2 > 260 * 260) continue;
          const d = Math.sqrt(d2);
          if (d > 30 && (dx * fwd[0] + dz * fwd[2]) / d < 0.3) continue;
          R.addSprites.bill(L.x, L.y - 0.1, L.z, (L.park ? 1.4 : 2.6) * halo, 0, [255, 200, 120, Math.round(210 * night)], Rv, Uv);
          if (d < 140) R.addSprites.ground(L.x, this.city.groundY(L.x, L.z) + 0.06, L.z, 6.5, 6.5, 0, 0, [110, 70, 30, Math.round(255 * night)]);
          if (env.beam > 0.05 && d < 95) this.beam([L.x, L.y - 0.25, L.z], [L.x, this.city.groundY(L.x, L.z) + 0.15, L.z], 0.22, L.park ? 2.2 : 3.8, [255, 196, 120, Math.round(255 * env.beam * night * 0.24)], eye, Rv, Uv);
          near.push([d2, L]);
        }
        near.sort((a, b) => a[0] - b[0]);
        for (let i = 0; i < near.length && lights.length < 12; i++) { const L = near[i][1]; lights.push({ x: L.x, y: L.y - 0.8, z: L.z, r: 15, c: [1.25 * night, 0.82 * night, 0.42 * night] }); }
      }
      if (!camInside) {
        for (const p of this.geo.tlights) {
          if (p.brk && W.broken.has(p.brk)) continue;
          const dx = p.x - cam.x, dz = p.z - cam.z;
          if (dx * dx + dz * dz > 170 * 170) continue;
          const n = this.city.nodes[p.node];
          const st = this.city.lightState(n, W.t, p.grp || 0);
          const y = (p.gy || 0) + (st === 'r' ? 3.42 : st === 'y' ? 3.06 : 2.7);
          const col = st === 'r' ? [255, 40, 30, 255] : st === 'y' ? [255, 200, 40, 255] : [60, 255, 120, 255];
          const fx = Math.sin(p.rot || 0), fz = -Math.cos(p.rot || 0);
          R.addSprites.bill(p.x + fx * 0.22, y, p.z + fz * 0.22, (0.55 + night * 0.5) * Math.sqrt(halo), 0, col, Rv, Uv);
        }
      }
      if (!camInside && N.ParkDraw) N.ParkDraw.fill(this, f, lights, Rv, Uv, vis, t);
      if (metroCam && N.MetroDraw) N.MetroDraw.fill(this, f, lights, Rv, Uv, vis, t);
      else if (camInside) {
        const r = this.city.clubRoom;
        const cols = [[1.6, 0.3, 1.2], [0.3, 1.2, 1.6], [1.6, 1.2, 0.2], [0.6, 0.3, 1.6]];
        for (let i = 0; i < 4; i++) {
          const a = t * (0.6 + i * 0.2) + i * 1.6;
          const x = r.x0 + 20 + Math.cos(a) * 7, z = r.z0 + 15 + Math.sin(a * 1.3) * 6;
          lights.push({ x, y: 4, z, r: 14, c: cols[i] });
          R.addSprites.ground(x, 0.16, z, 2.6, 2.6, 0, 0, [cols[i][0] * 120 | 0, cols[i][1] * 120 | 0, cols[i][2] * 120 | 0, 255]);
          R.addSprites.bill(r.x0 + 20 + (i - 1.5) * 3, r.H - 0.7, r.z0 + 15, 0.9, 0, [cols[i][0] * 150 | 0, cols[i][1] * 150 | 0, cols[i][2] * 150 | 0, 255], Rv, Uv);
        }
        lights.push({ x: r.x0 + 3, y: 3, z: r.z0 + 10, r: 12, c: [1.2, 0.8, 0.5] });
      }
      if (game && game.cutLights) for (const L of game.cutLights) if (lights.length < N.MAX_LIGHTS) lights.push(L);
      if (game && game.cut && night > 0.25 && lights.length < N.MAX_LIGHTS) lights.push({ x: cam.x + Rv[0] * 1.2, y: cam.y + 1.1, z: cam.z + Rv[2] * 1.2, r: 13, c: [1.05 * night, 0.98 * night, 0.9 * night] });
      for (const fl of fx.flashes) {
        if (lights.length >= N.MAX_LIGHTS) break;
        const k = 1 - fl.t / fl.life;
        lights.push({ x: fl.x, y: fl.y, z: fl.z, r: fl.r, c: fl.col.map(c => c * fl.i * k) });
      }
      for (const k of fx.skids) {
        if (!vis(k.x, k.z, 2)) continue;
        R.sprites.ground(k.x, k.y, k.z, 0.13, k.l, k.yaw, 0, [22, 20, 18, Math.round(k.a * Math.min(1, (k.life - k.t) / 8))]);
      }
      for (const d of fx.decals) {
        if (!vis(d.x, d.z, 2)) continue;
        const a = Math.min(1, (d.life - d.t) / 3);
        R.sprites.ground(d.x, this.city.groundY(d.x, d.z) + 0.05, d.z, d.s, d.s, d.rot || 0, d.cell, [d.col[0], d.col[1], d.col[2], Math.round(d.col[3] * a)]);
      }
      for (const p of fx.parts) {
        const k = p.t / p.life;
        const s = p.s0 + (p.s1 - p.s0) * k;
        const a = p.add ? (1 - k) : p.a * (1 - k) * Math.min(1, p.t * 6);
        const m = p.lit ? amb : 1;
        const col = [Math.min(255, p.col[0] * m) | 0, Math.min(255, p.col[1] * m) | 0, Math.min(255, p.col[2] * m) | 0, Math.round(255 * N.clamp(a, 0, 1))];
        (p.add ? R.addSprites : R.sprites).bill(p.x, p.y, p.z, s, p.cell, col, Rv, Uv, (p.rot || 0) + p.t * 0.6);
      }
      for (const r of fx.ripples) {
        if (!vis(r.x, r.z, r.r1)) continue;
        const k = r.t / r.life, rad = N.lerp(r.r0, r.r1, Math.sqrt(k));
        R.sprites.ground(r.x, r.y + 0.015, r.z, rad, rad, 0, 8, [225, 235, 242, Math.round(170 * (1 - k) * (1 - k))]);
      }
      this.effects(fx, eye, Rv, Uv);
      if (game && !f.hideMarkers) this.markers(game, t, camInside, Rv, Uv, vis);
      return lights;
    }

    beam(a, b, w0, w1, col, eye, Rv, Uv) {
      const Q = this.r.fxq, FT = N.FXT;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
      const mx = (a[0] + b[0]) / 2 - eye[0], my = (a[1] + b[1]) / 2 - eye[1], mz = (a[2] + b[2]) / 2 - eye[2];
      const ml = Math.hypot(mx, my, mz) || 1;
      const f = Math.abs(((b[0] - a[0]) * mx + (b[1] - a[1]) * my + (b[2] - a[2]) * mz) / (L * ml));
      const side = 1 - N.smooth(0.72, 0.96, f);
      if (side > 0.01) Q.axis(a, b, w0, w1, FT.BEAM, 0, 0, [col[0], col[1], col[2], Math.round(col[3] * side)], eye);
      if (side > 0.99) return;
      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const r = N.lerp(w0, w1, t) * 0.85;
        const k = (1 - side) * Math.pow(1 - t, 1.3) * 0.45;
        Q.bill(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, r, r, FT.GLOW, 0, 0, [col[0], col[1], col[2], Math.round(col[3] * k)], Rv, Uv, 0);
      }
    }

    effects(fx, eye, Rv, Uv) {
      const Q = this.r.fxq, FT = N.FXT;
      for (const s of fx.shots) {
        const age = s.t / s.life;
        Q.bill(s.x, s.y, s.z, s.size, s.size, FT.STAR, age, s.seed, WHITE, Rv, Uv, s.seed * 6.28);
        const L = s.size * 2.6;
        Q.axis([s.x, s.y, s.z], [s.x + s.dx * L, s.y + s.dy * L, s.z + s.dz * L], s.size * 0.3, s.size * 0.42, FT.JET, age, s.seed, WHITE, eye);
      }
      for (const tr of fx.tracers) {
        const head = Math.min(tr.dist, tr.t * tr.speed);
        const tail = Math.max(0, head - tr.len);
        if (head - tail < 0.05 || tr.dist < 0.5) continue;
        const ux = (tr.b[0] - tr.a[0]) / tr.dist, uy = (tr.b[1] - tr.a[1]) / tr.dist, uz = (tr.b[2] - tr.a[2]) / tr.dist;
        const A = [tr.a[0] + ux * tail, tr.a[1] + uy * tail, tr.a[2] + uz * tail], B = [tr.a[0] + ux * head, tr.a[1] + uy * head, tr.a[2] + uz * head];
        const w = Math.max(tr.w, Math.hypot(B[0] - eye[0], B[1] - eye[1], B[2] - eye[2]) * 0.0016);
        const fade = tr.t * tr.speed > tr.dist ? N.clamp(1 - (tr.t - tr.dist / tr.speed) / 0.05, 0, 1) : 1;
        Q.axis(A, B, w, w, FT.TRACER, 0, 0, [255, 255, 255, Math.round(tr.a8 * fade)], eye);
      }
      for (const h of fx.hits) Q.bill(h.x, h.y, h.z, 0.34, 0.34, FT.HIT, h.t / h.life, h.seed, WHITE, Rv, Uv, h.seed * 6.28);
      for (const b of fx.balls) {
        if (b.t < 0) continue;
        const age = b.t / b.life;
        const s = b.size * (0.55 + 0.8 * Math.sqrt(age));
        Q.bill(b.x, b.y + b.rise * b.t, b.z, s, s, FT.BALL, age, b.seed, WHITE, Rv, Uv, b.seed * 6.28);
      }
      for (const r of fx.rings) Q.flat(r.x, this.city.groundY(r.x, r.z) + 0.12, r.z, r.r, FT.RING, r.t / r.life, 0, WHITE);
    }

    dials(v, list, M, dim) {
      const R = this.r, run = !!v.driver && !v.dead;
      NEEDLE_LAMP[9] = run ? (v.lights ? 1.25 : 0.75) : 0;
      for (const d of list) {
        const u = N.dialValue(v, d.k, d.u);
        if (d.bar) {
          if (u < 0.01) continue;
          M3.euler(0, 0, 0, d.x, d.y, d.z, DL);
          DS.fill(0); DS[0] = d.w * u; DS[4] = d.h; DS[8] = 1;
          R.dyn.add(N.Cars.bar(), M3.mul(M3.mul(M, DL, DM2), DS, DT), null, null, null, NEEDLE_LAMP, dim);
        } else {
          M3.euler(0, 0, NEEDLE_ZERO - u * NEEDLE_SWEEP, d.x, d.y, d.z, DL);
          DS.fill(0); DS[0] = d.r; DS[4] = d.r; DS[8] = d.r;
          R.dyn.add(N.Cars.needle(), M3.mul(M3.mul(M, DL, DM2), DS, DT), null, null, null, NEEDLE_LAMP, dim);
        }
      }
    }

    addPed(p, root, t, o) {
      const R = this.r;
      const lod = o && o.dist > 42 ? 1 : 0;
      const m = N.Models.ped(p.look, lod);
      const rig = N.pedRig(p, t, root, m.piv, p.isPlayer && this.headless ? Object.assign({}, o, { fp: this.ads }) : o);
      m.mb.piv = m.piv;
      if (p.isPlayer) {
        const e = N.pedEye(rig.G, p.look), ref = p.veh || p;
        this.selfEye = { x: e[0], y: e[1], z: e[2], ref, rx: ref.x, ry: ref.y, rz: ref.z, t };
      }
      R.dyn.add(m.mb, null, null, m.bones, p.isPlayer && this.headless ? N.headless(rig.G) : rig.G, null, (p.dead ? (p.anim.deathKind === 'fire' ? 0.32 : 0.85) : p.burn > 0 ? 0.7 : 1) * (o && o.dim || 1));
      if (rig.item && p.eat && N.Models.food) R.dyn.add(N.Models.food(p.eat.id), rig.item, null);
      if (rig.wpn) {
        R.dyn.add(N.Models.weapon(p.weapon), rig.wpn, null);
        for (const q of rig.parts) R.dyn.add(q.mb, q.m, null);
        N.Guns.held(this, p, rig.wpn, t);
      }
    }

    markers(game, t, camInside, Rv, Uv, vis) {
      const R = this.r;
      const city = this.city;
      const pulse = 0.75 + Math.sin(t * 4) * 0.25;
      const ring = (x, y, z, r, h, col, a) => {
        const seg = 14;
        for (let i = 0; i < seg; i++) {
          const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
          const x0 = x + Math.cos(a0) * r, z0 = z + Math.sin(a0) * r, x1 = x + Math.cos(a1) * r, z1 = z + Math.sin(a1) * r;
          R.addSprites.quad([x0, y + h, z0], [x1, y + h, z1], [x1, y, z1], [x0, y, z0], 12, [col[0], col[1], col[2], Math.round(a * 255)]);
        }
        R.addSprites.ground(x, y + 0.04, z, r, r, t, 14, [col[0], col[1], col[2], Math.round(a * 200)]);
      };
      const cp = this.camPos;
      const arrow = (x, y, z, col) => {
        const d = cp ? Math.hypot(x - cp[0], z - cp[2]) : 20;
        if (d < 5) return;
        const bob = Math.sin(t * 3) * 0.2;
        R.sprites.bill(x, y + bob, z, N.clamp(d * 0.035, 0.5, 1.6), 13, [col[0], col[1], col[2], 235], Rv, Uv);
      };
      for (const m of game.markers()) {
        const y0 = m.y !== undefined ? m.y : city.groundY(m.x, m.z);
        if (city.inside(m.x) !== camInside) continue;
        if (!vis(m.x, m.z, 3)) continue;
        const col = MARKER_COL[m.type] || [255, 255, 255];
        const r = m.type === 'respray' ? 2.6 : 1.1;
        ring(m.x, y0, m.z, r, m.type === 'respray' ? 2.2 : 1.6, col, 0.55 * pulse);
      }
      for (const b of game.blips()) {
        const col = MARKER_COL[b.type] || [255, 255, 255];
        if (city.inside(b.x) !== camInside) continue;
        if (b.type === 'dest') {
          const y0 = b.y !== undefined ? b.y : city.groundY(b.x, b.z);
          if (vis(b.x, b.z, 5)) ring(b.x, y0, b.z, Math.min(b.r || 3, 6) * 0.6, 2, col, 0.6 * pulse);
        } else if (b.ent) {
          const e = b.ent;
          const ex = e.veh ? e.veh.x : e.x, ez = e.veh ? e.veh.z : e.z, ey = e.veh ? e.veh.y + e.veh.spec.shape.H : e.kind === 'veh' ? e.y + e.spec.shape.H : e.y + 1.9;
          if (vis(ex, ez, 2)) arrow(ex, ey + 1.2, ez, col);
        } else if (b.type === 'pickup') {
          if (vis(b.x, b.z, 2)) arrow(b.x, city.groundY(b.x, b.z) + 1.8, b.z, col);
        }
      }
    }
  }

  N.Scene = Scene;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
