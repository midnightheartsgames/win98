(function (K) {
  'use strict';

  const M = K.METRICS, P = K.Places;
  const G = 9.81, JUMP_V = Math.sqrt(2 * G * M.jumpHeight), WALK_MAX = Math.cos(42 * Math.PI / 180), CELL = 16;
  const HEIGHT = 1.78, CROUCH_HEIGHT = 1.2, CRAWL_HEIGHT = 0.6, SHOVE = 0.35, BACK = 0.65, CRUTCH_WALK = 1.0, CRUTCH_RUN = 1.6, BRUSH = 0.7, CARRY = 2.2, DRAG = 0.8;

  const resolveBox = (b, T) => {
    const rot = (b.rot || 0) * Math.PI / 180, c = Math.cos(rot), s = Math.sin(rot), hw = b.w / 2, hd = b.d / 2;
    const pts = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [0, 0]].map(([u, v]) => T.heightAt(b.x + u * c - v * s, b.z + u * s + v * c));
    const gmin = Math.min(...pts), gmax = Math.max(...pts), gc = pts[4];
    let y0, y1;
    if (b.y1 !== undefined) { y0 = b.y0; y1 = b.y1; }
    else if (b.deck) { y0 = T.deckTop - 4; y1 = T.deckTop; }
    else if (b.onDeck) { y0 = T.deckTop; y1 = T.deckTop + b.h; }
    else if (b.y !== undefined) { y0 = gc + b.y; y1 = y0 + b.h; }
    else { y0 = gmin - 0.6; y1 = gmax + b.h; }
    return { x: b.x, z: b.z, hw, hd, c, s, rot, y0, y1, w: b.w, d: b.d, kind: b.kind, id: b.id || null, landmark: b.landmark || null, wall: b.wall || null, tower: !!b.tower, deck: !!b.deck, onDeck: !!b.onDeck, floor: !!b.floor, building: b.building || null, hidden: !!b.hidden, dressed: b.dressed || null };
  };

  const inside = (bx, x, z, margin) => {
    const dx = x - bx.x, dz = z - bx.z, u = dx * bx.c + dz * bx.s, v = -dx * bx.s + dz * bx.c;
    return Math.abs(u) <= bx.hw + margin && Math.abs(v) <= bx.hd + margin;
  };

  function world(T, F) {
    const boxes = [...P.BOXES, ...P.WALLS.flatMap(P.wallBoxes), ...P.town(T).boxes, ...(K.Detail && T.ground ? K.Detail.props(T, F).map(p => p.box) : [])].map(b => resolveBox(b, T));
    const cols = Math.ceil(T.SIZE / CELL), grid = new Map();
    boxes.forEach((bx, idx) => {
      const ex = Math.abs(bx.hw * bx.c) + Math.abs(bx.hd * bx.s), ez = Math.abs(bx.hw * bx.s) + Math.abs(bx.hd * bx.c);
      for (let j = Math.floor((bx.z - ez) / CELL); j <= Math.floor((bx.z + ez) / CELL); j++) {
        for (let i = Math.floor((bx.x - ex) / CELL); i <= Math.floor((bx.x + ex) / CELL); i++) {
          const key = j * cols + i;
          if (!grid.has(key)) grid.set(key, []);
          grid.get(key).push(idx);
        }
      }
    });
    const near = (x, z, r) => {
      const out = new Set();
      for (let j = Math.floor((z - r) / CELL); j <= Math.floor((z + r) / CELL); j++) {
        for (let i = Math.floor((x - r) / CELL); i <= Math.floor((x + r) / CELL); i++) {
          const list = grid.get(j * cols + i);
          if (list) for (const idx of list) out.add(idx);
        }
      }
      return [...out].map(i => boxes[i]);
    };
    const groundAt = (x, z, reach) => {
      let g = T.heightAt(x, z);
      for (const bx of near(x, z, 0.5)) {
        if (bx.y1 > g && bx.y1 <= reach && inside(bx, x, z, 0.05)) g = bx.y1;
      }
      return g;
    };
    const ladders = P.LADDERS.map(L => {
      const fx = Math.sin(L.yaw), fz = -Math.cos(L.yaw), x = L.x - fx * 0.4, z = L.z - fz * 0.4;
      const y0 = T.heightAt(x, z), px = L.x + fx * 0.3, pz = L.z + fz * 0.3;
      let y1 = y0;
      for (const bx of near(px, pz, 1)) if (inside(bx, px, pz, 0) && bx.y1 > y1) y1 = bx.y1;
      return { x, z, fx, fz, y0, y1, topX: L.x + fx * 0.6, topZ: L.z + fz * 0.6 };
    });
    const dyn = [];
    const dynNear = (x, z, r) => dyn.length ? dyn.filter(b => Math.abs(b.x - x) < r + b.hw + b.hd && Math.abs(b.z - z) < r + b.hw + b.hd) : dyn;
    return { terrain: T, flora: F || null, boxes, ladders, near, groundAt, dyn, dynNear };
  }

  const collide = (W, x, z, feet, height, stepUp, radius) => {
    const r = radius || M.radiusBody, up = stepUp === undefined ? M.step : stepUp;
    for (let it = 0; it < 3; it++) {
      let moved = false;
      for (const bx of W.dynNear && W.dyn.length ? W.near(x, z, r + 1).concat(W.dynNear(x, z, r + 1)) : W.near(x, z, r + 1)) {
        if (bx.y1 <= feet + up + 0.01 || bx.y0 >= feet + height) continue;
        const dx = x - bx.x, dz = z - bx.z;
        const u = dx * bx.c + dz * bx.s, v = -dx * bx.s + dz * bx.c;
        const cu = Math.max(-bx.hw, Math.min(bx.hw, u)), cv = Math.max(-bx.hd, Math.min(bx.hd, v));
        let pu = u - cu, pv = v - cv;
        const d = Math.hypot(pu, pv);
        if (d >= r) continue;
        if (d > 1e-6) {
          const k = (r - d) / d;
          pu *= k;
          pv *= k;
        } else {
          const ou = bx.hw - Math.abs(u), ov = bx.hd - Math.abs(v);
          if (ou < ov) { pu = (u >= 0 ? 1 : -1) * (ou + r); pv = 0; } else { pv = (v >= 0 ? 1 : -1) * (ov + r); pu = 0; }
        }
        x += pu * bx.c - pv * bx.s;
        z += pu * bx.s + pv * bx.c;
        moved = true;
      }
      if (W.flora) {
        const F = W.flora, tr = F.trees;
        const push = (cx, cz, rad) => {
          const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz), min = r + rad;
          if (d < min && d > 1e-6) { x += dx / d * (min - d); z += dz / d * (min - d); moved = true; }
        };
        F.trunksNear(x, z, r, t => push(tr.X[t], tr.Z[t], tr.RAD[t]));
        push(F.elder.x, F.elder.z, F.elder.r);
      }
      if (!moved) break;
    }
    return [x, z];
  };

  const body = (W, x, z, yaw) => ({
    pos: [x, W.groundAt(x, z, Infinity), z], vel: [0, 0, 0], yaw: yaw || 0,
    onGround: true, crouch: false, walk: false, swim: false, wade: 0, ladder: null,
    stamina: 100, tired: false, sprinting: false, eye: M.eyeStand, speed: 0
  });

  const ladderNear = (W, b) => W.ladders.find(L =>
    (Math.hypot(b.pos[0] - L.x, b.pos[2] - L.z) < 0.9 && b.pos[1] > L.y0 - 0.6 && b.pos[1] < L.y1 - 0.5) ||
    (Math.hypot(b.pos[0] - L.topX, b.pos[2] - L.topZ) < 0.9 && Math.abs(b.pos[1] - L.y1) < 0.6)) || null;

  const climb = (b, inp, dt) => {
    const L = b.ladder;
    b.vel = [0, 0, 0];
    if (inp.jump) {
      b.ladder = null;
      b.vel = [-L.fx * 2.5, 2, -L.fz * 2.5];
      b.onGround = false;
      return;
    }
    b.pos[0] = L.x;
    b.pos[2] = L.z;
    b.pos[1] += inp.fwd * 1.4 * dt;
    if (b.pos[1] >= L.y1 - 0.05 && inp.fwd > 0) {
      b.pos = [L.topX, L.y1, L.topZ];
      b.ladder = null;
      b.onGround = true;
    } else if (b.pos[1] <= L.y0 && inp.fwd < 0) {
      b.pos[1] = L.y0;
      b.ladder = null;
      b.onGround = true;
    } else {
      b.pos[1] = Math.max(L.y0, Math.min(L.y1, b.pos[1]));
    }
  };

  function step(b, inp, dt, W) {
    const T = W.terrain;
    b.yaw = inp.yaw;
    if (b.hold > 0) inp = Object.assign({}, inp, { fwd: 0, side: 0, jump: false, sprint: false });
    const L = b.limit || null, crawl = !!L && !L.stand && !(b.aid === 'crutch' && L.crutch), crutch = !!L && !L.stand && !crawl;
    b.crawl = crawl;
    b.crutchOn = crutch;
    if (crawl || crutch) { inp = Object.assign({}, inp, { jump: false, sprint: false }); b.crouch = false; }
    if (inp.crouch && !b.swim && !crawl && !crutch) b.crouch = !b.crouch;
    if (inp.walk) b.walk = !b.walk;
    if (b.ladder) { climb(b, inp, dt); b.eye = M.eyeStand; return b; }
    if (inp.use && (!b.limit || b.limit.ladder) && !b.crawl) {
      const L = ladderNear(W, b);
      if (L) {
        b.ladder = L;
        b.crouch = false;
        if (Math.abs(b.pos[1] - L.y1) < 0.6 && Math.hypot(b.pos[0] - L.topX, b.pos[2] - L.topZ) < 0.9) b.pos[1] = L.y1 - 0.2;
        climb(b, { fwd: 0 }, 0);
        return b;
      }
    }
    const fx = Math.sin(b.yaw), fz = -Math.cos(b.yaw), rx = Math.cos(b.yaw), rz = Math.sin(b.yaw);
    let mx = fx * inp.fwd + rx * inp.side, mz = fz * inp.fwd + rz * inp.side;
    const ml = Math.hypot(mx, mz);
    if (ml > 1) { mx /= ml; mz /= ml; }
    const terrain = T.heightAt(b.pos[0], b.pos[2]), water = T.waterAt(b.pos[0], b.pos[2]), depth = water - terrain;
    b.swim = depth > 1.25 && b.pos[1] < water - 0.9;
    if (b.swim) b.crouch = false;
    b.wade = !b.swim && depth > 0.25 && b.pos[1] < water ? Math.min(1, depth / 1.25) : 0;
    b.sprinting = !!inp.sprint && !b.load && !b.crouch && !b.walk && !b.swim && !b.tired && ml > 0.1 && b.onGround && (!L || L.sprint);
    if (L) b.staminaMax = 100 * L.stamina;
    b.stamina = Math.max(0, Math.min(b.staminaMax || 100, b.stamina + (b.sprinting ? -10 : 15) * dt));
    if (b.stamina <= 0) b.tired = true;
    if (b.tired && b.stamina >= 25) b.tired = false;
    const SP = b.speeds;
    let speed = b.swim ? 1.2 * (SP ? SP.swim : 1) : crawl ? L.crawl : crutch ? (b.walk ? CRUTCH_WALK : CRUTCH_RUN) : b.crouch || b.walk ? (SP ? SP.walk : M.walk) : b.sprinting ? (SP ? SP.sprint : M.sprint) : SP ? SP.run : L ? L.run : M.run;
    if (ml > 0.01 && (mx * fx + mz * fz) / ml < -0.3) speed *= BACK;
    if (b.slow) speed *= b.slow;
    if (b.load) speed = Math.min(speed, b.load === 'drag' ? DRAG : CARRY);
    if (b.brush && W.flora && W.flora.bushAt && !b.swim && W.flora.bushAt(b.pos[0], b.pos[2], 0.45)) speed *= BRUSH;
    if (b.wade) speed *= 1 - 0.45 * b.wade;
    if (b.onGround && !b.swim && ml > 0.01) {
      const reach = b.pos[1] + M.step;
      const rise = W.groundAt(b.pos[0] + mx / Math.max(ml, 1e-6) * 0.6, b.pos[2] + mz / Math.max(ml, 1e-6) * 0.6, reach) - W.groundAt(b.pos[0], b.pos[2], reach);
      const up = Math.max(0, rise / 0.6);
      speed *= Math.max(0.35, 1 - 1.4 * up / Math.hypot(1, up));
    }
    const stumble = b.shove ? 0 : 1, wx = mx * speed * stumble, wz = mz * speed * stumble;
    if (b.swim) {
      const flow = T.flowAt(b.pos[0], b.pos[2]);
      b.vel[0] = wx + flow[0];
      b.vel[2] = wz + flow[1];
      b.vel[1] = (water - 1.35 - b.pos[1]) * 3;
    } else if (b.onGround) {
      const k = Math.min(1, 12 * dt);
      b.vel[0] += (wx - b.vel[0]) * k;
      b.vel[2] += (wz - b.vel[2]) * k;
    } else {
      const k = Math.min(1, 0.6 * dt);
      b.vel[0] += (wx - b.vel[0]) * k;
      b.vel[2] += (wz - b.vel[2]) * k;
    }
    if (inp.jump && !b.load && b.onGround && !b.swim && !b.crouch && (!L || L.jump > 0)) {
      b.vel[1] = L ? Math.sqrt(2 * G * L.jump) : JUMP_V;
      b.vel[0] *= 0.68;
      b.vel[2] *= 0.68;
      b.onGround = false;
    }
    if (!b.onGround && !b.swim) b.vel[1] -= G * dt;
    let nx = b.pos[0] + b.vel[0] * dt, nz = b.pos[2] + b.vel[2] * dt;
    if (L && !L.swim && T.waterAt(nx, nz) - T.heightAt(nx, nz) > 1.2 && !b.swim) { nx = b.pos[0]; nz = b.pos[2]; b.vel[0] = 0; b.vel[2] = 0; b.deep = true; } else b.deep = false;
    if (b.shove) {
      const k = Math.max(0, b.shove[2] - dt / 2) / SHOVE;
      nx += b.shove[0] * k * dt;
      nz += b.shove[1] * k * dt;
      b.shove[2] -= dt;
      if (b.shove[2] <= 0) b.shove = null;
    }
    if (!b.swim) {
      const ng = T.heightAt(nx, nz);
      if (ng > b.pos[1] + M.step && T.normalAt(nx, nz)[1] < (b.climb ? 0.5 : WALK_MAX)) {
        nx = b.pos[0];
        nz = b.pos[2];
        b.vel[0] = 0;
        b.vel[2] = 0;
      }
    }
    const height = b.height || (crawl ? CRAWL_HEIGHT : b.crouch ? CROUCH_HEIGHT : HEIGHT);
    [nx, nz] = collide(W, nx, nz, b.pos[1], height, undefined, b.radius);
    if (K.Edge && T.river) { const e = K.Edge.hold([nx, 0, nz]); b.edge = e.held; nx = e.x; nz = e.z; }
    let ny = b.pos[1] + b.vel[1] * dt;
    const g = W.groundAt(nx, nz, Math.max(b.pos[1], ny) + M.step);
    if (b.swim) {
      if (ny < g) ny = g;
      b.onGround = false;
    } else if (ny <= g) {
      ny = g;
      b.vel[1] = 0;
      b.onGround = true;
    } else if (b.onGround && b.vel[1] <= 0 && ny - g < 0.6) {
      ny = g;
      b.vel[1] = 0;
    } else {
      b.onGround = false;
    }
    b.speed = Math.hypot(nx - b.pos[0], nz - b.pos[2]) / Math.max(dt, 1e-6);
    b.pos = [nx, ny, nz];
    if (!b.speeds) {
      const eye = b.swim ? water + 0.2 - b.pos[1] : crawl ? M.eyeCrawl : b.crouch ? M.eyeCrouch : M.eyeStand;
      b.eye += (eye - b.eye) * Math.min(1, 10 * dt);
    }
    return b;
  }

  const shove = (b, dir, dist) => { const v = 2 * dist / SHOVE; b.shove = [dir[0] * v, dir[2] * v, SHOVE]; };

  const CHAIR = Object.freeze({ drive: 2.85, own: 3.5, top: 9, turn: 1.7, roll: 0.35, brake: 4, step: 0.04, slope: 14, height: 1.3, seat: 0.5, eye: 1.15 });

  const chair = (id, x, z, yaw, W) => ({ id, pos: [x, W.groundAt(x, z, Infinity), z], yaw: yaw || 0, speed: 0, rider: null, pusher: null, stuck: 0 });

  const gradeAt = (T, x, z, fx, fz) => (T.heightAt(x + fx * 0.4, z + fz * 0.4) - T.heightAt(x - fx * 0.4, z - fz * 0.4)) / 0.8;

  function rollChair(c, inp, dt, W, pushed) {
    const T = W.terrain;
    if (pushed) c.yaw = pushed.yaw;
    else c.yaw += -(inp.side || 0) * CHAIR.turn * dt * (1 - Math.min(0.6, Math.abs(c.speed) / CHAIR.top));
    const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), grade = gradeAt(T, c.pos[0], c.pos[2], fx, fz);
    const pull = -G * grade / Math.sqrt(1 + grade * grade);
    let acc = pull - Math.sign(c.speed) * CHAIR.roll;
    if (pushed) acc = (pushed.speed - c.speed) * 6;
    else {
      const f = inp.fwd || 0;
      if (f && Math.sign(f) !== Math.sign(c.speed) && Math.abs(c.speed) > 0.3) acc -= Math.sign(c.speed) * CHAIR.brake;
      else if (f && Math.abs(c.speed) < CHAIR.own) acc += f * CHAIR.drive;
    }
    if (!pushed && Math.abs(c.speed) < 0.05) { const free = acc + Math.sign(c.speed) * CHAIR.roll; acc = free - K.clamp(free, -CHAIR.roll, CHAIR.roll); }
    c.speed = K.clamp(c.speed + acc * dt, -CHAIR.top, CHAIR.top);
    if (Math.abs(c.speed) < 0.04 && !inp.fwd && !pushed && Math.abs(pull) < CHAIR.roll) c.speed = 0;
    let nx = c.pos[0] + fx * c.speed * dt, nz = c.pos[2] + fz * c.speed * dt;
    const blocked = (x, z) => (W.flora && W.flora.bushAt && W.flora.bushAt(x, z, 0.35)) || T.waterAt(x, z) > T.heightAt(x, z) + 0.3;
    if (blocked(nx, nz)) { nx = c.pos[0]; nz = c.pos[2]; c.speed = 0; c.stuck = 0.3; }
    const [cx, cz] = collide(W, nx, nz, c.pos[1], CHAIR.height, CHAIR.step, M.radiusChair);
    if (Math.hypot(cx - nx, cz - nz) > 0.002) { c.speed *= -0.15; c.stuck = 0.3; }
    c.stuck = Math.max(0, c.stuck - dt);
    c.pos = [cx, W.groundAt(cx, cz, c.pos[1] + CHAIR.step), cz];
    return c;
  }

  const chairUphill = (T, c) => {
    const fx = Math.sin(c.yaw), fz = -Math.cos(c.yaw), g = gradeAt(T, c.pos[0], c.pos[2], fx, fz);
    return Math.atan(g) * 180 / Math.PI;
  };

  K.Move = { world, body, step, collide, ladderNear, resolveBox, shove, chair, rollChair, chairUphill, CHAIR, CARRY, DRAG, JUMP_V, HEIGHT, CROUCH_HEIGHT };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
