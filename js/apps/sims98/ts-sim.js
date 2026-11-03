(function (S) {
  'use strict';
  const M = S.METRICS, H = S.House, Body = S.Body, Clips = S.Clips;
  const TURN_RATE = 7, TURN_STOP = 1.4, TURN_STEP = 0.2;
  const BLEND_TIME = 0.2, WAIT_LIMIT = 0.7, STUCK_LIMIT = 3, ASK_ASIDE_AT = 2, GHOST_TIME = 2, STOP_NEAR = 1.6, CLIMB_RATE = 1.4;
  const AHEAD = 0.6, ALIGN_SPEED = 1.1, HIPS_ABOVE_SEAT = 0.08, DOOR_REACH = 1.1, CAR_FROM = 40, CAR_WAIT = 0.7, CAR_STEP_OUT = 1.2;
  const ANGLE = Math.PI * 2, TOWN_TILES = M.town * M.town, SUBSTEP = 0.1, MAX_SUBSTEPS = 3, REFINE_LIMIT = 8000, NEAR_LIMIT = 8000, ENTER_REACH = 1.5, APPROACH_TRIES = 4;
  const BUSY_STATES = new Set(['arrive', 'align', 'sitDown', 'standUp', 'leave']);
  const FLOOR_LIE = 0.1;

  const wrap = a => a - Math.round(a / ANGLE) * ANGLE;

  const setClip = (sim, name) => {
    if (sim.clip === name) return;
    sim.fromRot.set(sim.rot);
    sim.fromRoot[0] = sim.root[0];
    sim.fromRoot[1] = sim.root[1];
    sim.fromRoot[2] = sim.root[2];
    sim.clip = name;
    sim.blend = 0;
  };

  const tileKey = (floor, lot, x, z) => {
    const tx = Math.floor(x), tz = Math.floor(z);
    if (floor === 0 || !lot) return tx + tz * M.town;
    return TOWN_TILES * (1 + lot.index) + floor * 4096 + (tx - lot.x) + (tz - lot.z) * 64;
  };

  const keyOfSim = sim => tileKey(sim.floor, sim.lot, sim.x, sim.z);

  const placesOf = (lot, item, pose) => {
    const model = S.KINDS[S.KIND_ID[item.kind]], [a, b, c, d] = S.TURNS[item.facing], base = Math.atan2(-b, -d);
    const point = (lx, lz, y, turn) => {
      const yaw = base + (turn || 0) * Math.PI;
      return { x: lot.x + item.x + a * lx + b * lz, z: lot.z + item.z + c * lx + d * lz, y, yaw, fx: Math.sin(yaw), fz: Math.cos(yaw), pose };
    };
    if (pose === 'sit') return (model.seats || []).map(s => point(s[0], s[1], s[2], s[3]));
    if (pose === 'lie') return (model.beds || []).map(s => point(s[0], s[1], s[2], s[3]));
    if (pose === 'inside') return [point(0, 0, 0, 1)];
    if (pose === 'near') {
      const hw = model.w / 2 + 0.5, hd = model.d / 2 + 0.5;
      return [[0, -hd], [hw, 0], [0, hd], [-hw, 0]].map(([dx, dz]) => {
        const yaw = Math.atan2(-dx, -dz);
        return { x: lot.x + item.x + dx, z: lot.z + item.z + dz, y: 0, yaw, fx: Math.sin(yaw), fz: Math.cos(yaw), pose };
      });
    }
    const out = [];
    for (let i = 0; i < model.w; i++) out.push(point(i + 0.5 - model.w / 2, -(model.d / 2 + 0.5), 0, 1));
    return out;
  };

  const approachTiles = (lot, item, place) => {
    const model = S.KINDS[S.KIND_ID[item.kind]], turned = item.facing % 2 === 1, hw = (turned ? model.d : model.w) / 2, hd = (turned ? model.w : model.d) / 2;
    const x0 = Math.floor(lot.x + item.x - hw + 0.01) - 1, x1 = Math.ceil(lot.x + item.x + hw - 0.01), z0 = Math.floor(lot.z + item.z - hd + 0.01) - 1, z1 = Math.ceil(lot.z + item.z + hd - 0.01), ring = [];
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        if (x === x0 || x === x1 || z === z0 || z === z1) ring.push([x, z, Math.hypot(x + 0.5 - place.x, z + 0.5 - place.z)]);
      }
    }
    return ring.sort((p, q) => p[2] - q[2]);
  };

  const othersOn = (world, sim, lot) => {
    const set = new Set(), nav = lot ? lot.nav : world.ground;
    for (const other of world.live) {
      if (other === sim || other.inside || other.state === 'drive') continue;
      if (lot) {
        if (other.lot !== lot) continue;
        set.add(nav.node(other.floor, Math.floor(other.x) - lot.x, Math.floor(other.z) - lot.z));
      } else if (other.floor === 0) {
        set.add(Math.floor(other.x) + Math.floor(other.z) * M.town);
      }
    }
    return set;
  };

  const startNode = (nav, k, x, z) => {
    const tx = Math.floor(x), tz = Math.floor(z);
    return nav.isFree(k, tx, tz) ? nav.node(k, tx, tz) : nav.nearestFree(k, x, z);
  };

  const findAround = (nav, start, end, avoid, limit) => {
    const found = nav.find(start, end, avoid, limit);
    return found.reached || !avoid.size ? found : nav.find(start, end, null, limit);
  };

  const inLot = (world, sim, lot, goal) => {
    const nav = lot.nav, avoid = othersOn(world, sim, lot), start = startNode(nav, sim.floor, sim.x - lot.x, sim.z - lot.z);
    const end = startNode(nav, goal.floor, goal.x - lot.x, goal.z - lot.z);
    if (start < 0 || end < 0) return null;
    const found = findAround(nav, start, end, avoid);
    const path = nav.route({ x: sim.x - lot.x, z: sim.z - lot.z, floor: sim.floor }, found.nodes, avoid).map(w => ({ x: w.x + lot.x, z: w.z + lot.z, floor: w.floor, slope: w.slope }));
    return { path, reached: found.reached && end === nav.node(goal.floor, Math.floor(goal.x - lot.x), Math.floor(goal.z - lot.z)) };
  };

  const onGround = (world, sim, fromX, fromZ, gx, gz) => {
    const g = world.ground, start = startNode(g, 0, fromX, fromZ), end = startNode(g, 0, gx, gz);
    if (start < 0 || end < 0) return null;
    const [sx, sz] = g.tileOf(start), [ex, ez] = g.tileOf(end), plan = g.plan(sx, sz, ex, ez), exact = end === g.node(0, Math.floor(gx), Math.floor(gz));
    if (!plan.reached) return { path: [], reached: false };
    if (plan.near) {
      const avoid = othersOn(world, sim, null), found = findAround(g, start, end, avoid, NEAR_LIMIT);
      return { path: g.route({ x: fromX, z: fromZ, floor: 0 }, found.nodes, avoid), reached: found.reached && exact };
    }
    return { path: plan.points.map(([x, z]) => ({ x, z, floor: 0, slope: 0, coarse: true })), reached: exact };
  };

  const planPath = (world, sim, goal) => {
    const lot = sim.lot, target = goal.lot || world.ground.lotAt(goal.x, goal.z);
    if (lot && target === lot) return inLot(world, sim, lot, goal);
    const out = [];
    let fromX = sim.x, fromZ = sim.z, reached = true;
    if (sim.floor > 0) {
      const entry = lot.nav.entryOf(sim.floor), down = inLot(world, sim, lot, { x: entry[0] + lot.x + 0.5, z: entry[1] + lot.z + 0.5, floor: 0 });
      if (!down) return null;
      if (!down.reached) return down;
      out.push(...down.path);
      fromX = entry[0] + lot.x + 0.5;
      fromZ = entry[1] + lot.z + 0.5;
    }
    let gx = goal.x, gz = goal.z, upper = null;
    if (goal.floor > 0) {
      const entry = target.nav.entryOf(goal.floor);
      gx = entry[0] + target.x + 0.5;
      gz = entry[1] + target.z + 0.5;
      upper = inLot(world, { x: gx, z: gz, floor: 0, lot: target, id: sim.id }, target, goal);
      if (!upper) return null;
    }
    const ground = onGround(world, sim, fromX, fromZ, gx, gz);
    if (!ground) return null;
    out.push(...ground.path);
    reached = reached && ground.reached;
    if (upper) {
      out.push(...upper.path);
      reached = reached && upper.reached;
    }
    return { path: out, reached };
  };

  const leaveSeat = sim => {
    if (sim.seat) {
      sim.seat.item.takers[sim.seat.slot] = null;
      sim.seat = null;
    }
  };

  const beginMove = (sim, plan, run) => {
    sim.path = plan.path;
    sim.wp = 0;
    sim.run = !!run;
    sim.wait = 0;
    sim.stuck = 0;
    sim.state = plan.path.length ? 'move' : 'arrive';
    sim.slopeFrom = null;
  };

  const seatGoal = (world, sim, order) => {
    const lot = order.lot, nav = lot.nav, pose = order.pose || 'sit', places = placesOf(lot, order.item, pose);
    if (!order.item.takers) order.item.takers = {};
    const slots = places.map((_, i) => i).filter(i => !order.item.takers[i]);
    if (sim.lot !== lot || sim.floor !== order.item.floor) {
      const place = places[slots.length ? slots[0] : 0], tile = pose === 'front' || pose === 'near' ? [Math.floor(place.x), Math.floor(place.z)] : approachTiles(lot, order.item, place).find(([x, z]) => nav.isFree(order.item.floor, x - lot.x, z - lot.z));
      return { walkFirst: tile ? { x: tile[0] + 0.5, z: tile[1] + 0.5, floor: order.item.floor, lot } : null };
    }
    let best = null;
    for (const slot of slots) {
      const place = places[slot], tiles = pose === 'front' || pose === 'near' ? [[Math.floor(place.x), Math.floor(place.z)]] : approachTiles(lot, order.item, place).filter(([x, z]) => nav.isFree(order.item.floor, x - lot.x, z - lot.z)).slice(0, APPROACH_TRIES);
      for (const [tx, tz] of tiles) {
        if (!nav.isFree(order.item.floor, tx - lot.x, tz - lot.z)) continue;
        const plan = inLot(world, sim, lot, { x: tx + 0.5, z: tz + 0.5, floor: order.item.floor });
        if (!plan || !plan.reached) continue;
        const length = plan.path.reduce((sum, w, i) => sum + Math.hypot(w.x - (i ? plan.path[i - 1].x : sim.x), w.z - (i ? plan.path[i - 1].z : sim.z)), 0);
        if (!best || length < best.length) best = { plan, slot, place, length, tx, tz };
      }
    }
    return { best };
  };

  const startGoal = (world, sim, order) => {
    sim.order = null;
    sim.goal = null;
    if (order.item) {
      const { walkFirst, best } = seatGoal(world, sim, order);
      if (walkFirst === null) {
        sim.note = 'нельзя дойти';
        return;
      }
      if (walkFirst) {
        const plan = planPath(world, sim, walkFirst);
        if (!plan) return;
        sim.goal = walkFirst;
        sim.then = order;
        beginMove(sim, plan, order.run);
        return;
      }
      if (!best) {
        sim.note = 'нельзя дойти';
        return;
      }
      order.item.takers[best.slot] = sim.id;
      sim.seat = { lot: order.lot, item: order.item, slot: best.slot, place: best.place, backX: best.tx + 0.5, backZ: best.tz + 0.5, pose: best.place.pose };
      sim.goal = { x: best.tx + 0.5, z: best.tz + 0.5, floor: order.item.floor, lot: order.lot };
      beginMove(sim, best.plan, order.run);
      return;
    }
    const goal = { x: order.x, z: order.z, floor: order.floor || 0, lot: order.lot || null, enter: order.enter || null };
    if (order.car !== false && (sim.hasCar || order.ride) && S.Sim.wantsCar(world, sim, goal)) {
      const roads = world.roads, a = roads.nearest(sim.x, sim.z), b = roads.nearest(goal.x, goal.z), line = roads.route(a, b);
      if (line.length > 1) {
        sim.after = { line, goal, run: order.run, ride: order.ride || null };
        const plan = planPath(world, sim, { x: a.x, z: a.z, floor: 0 });
        if (plan && plan.reached) {
          sim.goal = { x: a.x, z: a.z, floor: 0, lot: null };
          sim.note = '';
          beginMove(sim, plan, order.run);
          return;
        }
        sim.after = null;
      }
    }
    const plan = planPath(world, sim, goal);
    if (!plan) return;
    sim.goal = goal;
    sim.note = plan.reached ? '' : 'нельзя дойти';
    beginMove(sim, plan, order.run);
  };

  const turnTo = (sim, yaw, dt) => {
    const diff = wrap(yaw - sim.yaw), step = S.clamp(diff, -TURN_RATE * dt, TURN_RATE * dt);
    sim.yaw = wrap(sim.yaw + step);
    return { left: Math.abs(diff - step), turned: Math.abs(step) };
  };

  const refine = (world, sim) => {
    const g = world.ground, path = sim.path, i = sim.wp, avoid = othersOn(world, sim, null);
    let j = i;
    while (j + 1 < path.length && path[j + 1].coarse && g.clear(0, sim.x, sim.z, path[j + 1].x, path[j + 1].z, avoid)) j++;
    const target = path[j];
    if (g.clear(0, sim.x, sim.z, target.x, target.z, avoid)) {
      path.splice(i, j - i + 1, { x: target.x, z: target.z, floor: 0, slope: 0 });
      return;
    }
    const start = startNode(g, 0, sim.x, sim.z), end = g.node(0, Math.floor(target.x), Math.floor(target.z));
    const found = findAround(g, start, end, avoid, REFINE_LIMIT);
    const near = g.route({ x: sim.x, z: sim.z, floor: 0 }, found.nodes, avoid);
    path.splice(i, j - i + 1, ...(near.length ? near : [{ x: target.x, z: target.z, floor: 0, slope: 0 }]));
  };

  const stepAside = (world, who, mover) => {
    if (who.state !== 'idle' || who.order || who.seat || who.inside || who.path) return;
    const upper = who.floor > 0, lot = who.lot, nav = upper ? lot.nav : world.ground, ox = upper ? lot.x : 0, oz = upper ? lot.z : 0;
    const tx = Math.floor(who.x) - ox, tz = Math.floor(who.z) - oz;
    let best = null, bestFar = -1;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      if (!nav.canGo(who.floor, tx, tz, dx, dz)) continue;
      const x = tx + dx + ox + 0.5, z = tz + dz + oz + 0.5;
      if (world.taken.has(tileKey(who.floor, lot, x, z))) continue;
      const far = Math.hypot(x - mover.x, z - mover.z);
      if (far > bestFar) {
        bestFar = far;
        best = [x, z];
      }
    }
    if (best) who.order = { x: best[0], z: best[1], floor: who.floor, lot: upper ? lot : world.ground.lotAt(best[0], best[1]), car: false };
  };

  const moveStep = (world, sim, dt) => {
    const goal = sim.goal;
    if (goal && goal.enter && sim.floor === 0 && Math.hypot(sim.x - goal.x, sim.z - goal.z) < ENTER_REACH) {
      finishMove(world, sim);
      return;
    }
    if (sim.ghost > 0) sim.ghost -= dt;
    let w = sim.path[sim.wp];
    if (w.coarse) {
      refine(world, sim);
      w = sim.path[sim.wp];
    }
    const dx = w.x - sim.x, dz = w.z - sim.z, len = Math.hypot(dx, dz);
    if (len < 1e-4) {
      nextWaypoint(world, sim);
      return;
    }
    const going = Math.atan2(dx, dz), { left, turned } = turnTo(sim, going, dt);
    if (!w.slope && sim.floor === w.floor) {
      const ax = sim.x + dx / len * AHEAD, az = sim.z + dz / len * AHEAD, ahead = tileKey(sim.floor, sim.lot, ax, az), own = keyOfSim(sim);
      const taker = world.taken.get(ahead);
      if (ahead !== own && taker && taker !== sim && sim.ghost <= 0) {
        if (goal && !sim.seat && sim.wp === sim.path.length - 1 && Math.hypot(goal.x - sim.x, goal.z - sim.z) < STOP_NEAR) {
          finishMove(world, sim);
          return;
        }
        sim.wait += dt;
        setClip(sim, 'idle');
        sim.phase += dt / Clips.LIST.idle.seconds;
        if (sim.wait > WAIT_LIMIT) {
          sim.wait = 0;
          sim.stuck++;
          if (sim.stuck === ASK_ASIDE_AT) stepAside(world, taker, sim);
          if (sim.stuck > STUCK_LIMIT) {
            sim.stuck = 0;
            sim.ghost = GHOST_TIME;
            return;
          }
          if (taker.state === 'move' && taker.wait > 0 && sim.id > taker.id) return;
          const plan = goal && planPath(world, sim, goal);
          if (plan) {
            sim.path = plan.path;
            sim.wp = 0;
            if (!plan.path.length) finishMove(world, sim);
          }
        }
        return;
      }
      if (ahead !== own && sim.ghost <= 0) {
        sim.reserved = ahead;
        world.taken.set(ahead, sim);
      }
    }
    sim.wait = 0;
    const speed = (sim.run && !w.slope ? M.run : M.walk) * (left > TURN_STOP ? 0.12 : Math.max(0.35, Math.cos(left)));
    const dist = Math.min(speed * dt, len);
    sim.x += dx / len * dist;
    sim.z += dz / len * dist;
    if (w.slope) {
      const from = sim.slopeFrom || (sim.slopeFrom = { len: Math.hypot(sim.x - dx / len * dist - w.x, sim.z - dz / len * dist - w.z), y: sim.y });
      const done = 1 - Math.hypot(sim.x - w.x, sim.z - w.z) / from.len;
      sim.y = from.y + w.slope * M.floorStep * done;
      if (done > 0.5) sim.floor = w.floor;
      setClip(sim, w.slope > 0 ? 'stairsUp' : 'stairsDown');
      sim.phase += dist / (Clips.LIST[sim.clip].stride * sim.scale);
    } else {
      if (sim.floor === 0) sim.lot = world.ground.lotAt(sim.x, sim.z);
      const target = S.Sim.groundY(world, sim.floor, sim.lot, sim.x, sim.z);
      sim.y += S.clamp(target - sim.y, -CLIMB_RATE * dt, CLIMB_RATE * dt);
      setClip(sim, sim.run ? 'run' : 'walk');
      sim.phase += (dist + turned * TURN_STEP) / (Clips.LIST[sim.clip].stride * sim.scale);
    }
    if (dist >= len - 1e-6) nextWaypoint(world, sim);
  };

  const nextWaypoint = (world, sim) => {
    const w = sim.path[sim.wp];
    if (w.slope) {
      sim.y = H.floorY(sim.lot.house, w.floor);
      sim.floor = w.floor;
      sim.slopeFrom = null;
    }
    sim.x = w.x;
    sim.z = w.z;
    sim.wp++;
    if (sim.wp >= sim.path.length) finishMove(world, sim);
  };

  const beginDrive = (world, sim) => {
    const { line } = sim.after, [x, z] = line[0], [nx, nz] = line[1], len = Math.hypot(nx - x, nz - z) || 1;
    sim.car = { line, i: 1, x, z, y: S.Terrain.heightAt(world.terrain, x, z), dx: (nx - x) / len, dz: (nz - z) / len, wait: CAR_WAIT };
    sim.ride = sim.after.ride || null;
    sim.state = 'board';
    sim.path = null;
    sim.trip = null;
    sim.goal = null;
    sim.reserved = -1;
  };

  const standByCar = (sim, dt) => {
    setClip(sim, 'idle');
    sim.phase += dt / Clips.LIST.idle.seconds;
    sim.car.wait -= dt;
    return sim.car.wait <= 0;
  };

  const driveStep = (world, sim, dt) => {
    const car = sim.car;
    let left = M.car * dt;
    while (left > 0 && car.i < car.line.length) {
      const [tx, tz] = car.line[car.i], dx = tx - sim.x, dz = tz - sim.z, len = Math.hypot(dx, dz);
      if (len > 1e-6) {
        car.dx = dx / len;
        car.dz = dz / len;
      }
      if (len <= left) {
        sim.x = tx;
        sim.z = tz;
        left -= len;
        car.i++;
      } else {
        sim.x += dx / len * left;
        sim.z += dz / len * left;
        left = 0;
      }
    }
    sim.lot = world.ground.lotAt(sim.x, sim.z);
    sim.y = S.Sim.groundY(world, 0, sim.lot, sim.x, sim.z);
    car.x = sim.x;
    car.z = sim.z;
    car.y = sim.y;
    if (car.i >= car.line.length) {
      const { goal } = sim.after, gx = goal.x - sim.x, gz = goal.z - sim.z, len = Math.hypot(gx, gz) || 1;
      sim.x += gx / len * CAR_STEP_OUT;
      sim.z += gz / len * CAR_STEP_OUT;
      sim.lot = world.ground.lotAt(sim.x, sim.z);
      sim.y = S.Sim.groundY(world, 0, sim.lot, sim.x, sim.z);
      sim.yaw = Math.atan2(gx, gz);
      car.wait = CAR_WAIT;
      sim.state = 'unboard';
    }
  };

  const arrived = (world, sim) => {
    const goal = sim.goal;
    if (sim.after) {
      beginDrive(world, sim);
      return;
    }
    sim.goal = null;
    if (goal && goal.enter) {
      sim.inside = goal.enter;
      sim.lot = goal.enter;
      sim.state = 'idle';
      return;
    }
    if (sim.then) {
      const next = sim.then;
      sim.then = null;
      sim.state = 'idle';
      startGoal(world, sim, next);
      return;
    }
    sim.state = 'idle';
  };

  const finishMove = (world, sim) => {
    sim.path = null;
    sim.stuck = 0;
    sim.ghost = 0;
    sim.reserved = -1;
    if (sim.order) {
      sim.state = 'idle';
      startGoal(world, sim, sim.order);
      return;
    }
    if (sim.seat) {
      sim.state = 'align';
      return;
    }
    arrived(world, sim);
  };

  const tripStep = (world, sim, dt) => {
    const trip = sim.trip;
    let left = M.walk * dt;
    sim.phase += left / (Clips.LIST.walk.stride * sim.scale);
    while (left > 0 && trip.i < trip.points.length) {
      const [tx, tz] = trip.points[trip.i], dx = tx - sim.x, dz = tz - sim.z, len = Math.hypot(dx, dz);
      if (len > 1e-6) sim.yaw = Math.atan2(dx, dz);
      if (len <= left) {
        sim.x = tx;
        sim.z = tz;
        left -= len;
        trip.i++;
      } else {
        sim.x += dx / len * left;
        sim.z += dz / len * left;
        left = 0;
      }
    }
    if (trip.i >= trip.points.length) {
      sim.trip = null;
      sim.lot = world.ground.lotAt(sim.x, sim.z);
      sim.floor = sim.goal ? sim.goal.floor : 0;
      sim.y = S.Sim.groundY(world, sim.floor, sim.lot, sim.x, sim.z);
      arrived(world, sim);
    }
  };

  const beginTrip = (world, sim, goal) => {
    const g = world.ground, plan = g.plan(Math.floor(sim.x), Math.floor(sim.z), Math.floor(goal.x), Math.floor(goal.z));
    sim.goal = goal;
    sim.floor = 0;
    sim.trip = { points: plan.reached ? plan.points.map(p => p.slice()) : [[goal.x, goal.z]], i: 0 };
    const last = sim.trip.points[sim.trip.points.length - 1];
    last[0] = goal.x;
    last[1] = goal.z;
    sim.state = 'trip';
    sim.path = null;
  };

  const stepOut = (world, sim) => {
    const lot = sim.inside;
    sim.x = lot.doorOut[0];
    sim.z = lot.doorOut[1];
    sim.inside = null;
    sim.floor = 0;
    sim.lot = world.ground.lotAt(sim.x, sim.z);
    sim.y = S.Sim.groundY(world, 0, sim.lot, sim.x, sim.z);
    sim.state = 'idle';
  };

  const stateStep = {
    idle(world, sim, dt) {
      const clip = sim.failLeft > 0 ? 'shrug' : 'idle';
      setClip(sim, clip);
      sim.phase += dt / Clips.LIST[clip].seconds;
      sim.wantUp = false;
      if (sim.order) startGoal(world, sim, sim.order);
    },
    move(world, sim, dt) {
      moveStep(world, sim, dt);
    },
    arrive(world, sim) {
      finishMove(world, sim);
    },
    trip(world, sim, dt) {
      tripStep(world, sim, dt);
    },
    board(world, sim, dt) {
      turnTo(sim, Math.atan2(sim.car.x - sim.x, sim.car.z - sim.z), dt);
      if (!standByCar(sim, dt)) return;
      sim.x = sim.car.x;
      sim.z = sim.car.z;
      sim.state = 'drive';
    },
    drive(world, sim, dt) {
      driveStep(world, sim, dt);
    },
    unboard(world, sim, dt) {
      if (!standByCar(sim, dt)) return;
      const { goal, run } = sim.after;
      sim.car = null;
      sim.after = null;
      sim.ride = null;
      sim.state = 'idle';
      S.Sim.go(world, sim, Object.assign({}, goal, { run, car: false }));
    },
    use(world, sim, dt) {
      setClip(sim, sim.useClip || 'use');
      sim.phase += dt / (Clips.LIST[sim.clip].seconds || 2);
      if (!sim.order && !sim.wantUp) return;
      sim.wantUp = false;
      if (sim.seat && sim.seat.pose === 'inside') {
        sim.state = 'leave';
        return;
      }
      if (sim.seat) leaveSeat(sim);
      sim.state = 'idle';
    },
    align(world, sim, dt) {
      const place = sim.seat.place, slide = sim.seat.pose === 'lie', dx = place.x - sim.x, dz = place.z - sim.z, len = Math.hypot(dx, dz);
      if (len > 0.02 && !slide) {
        const { turned } = turnTo(sim, Math.atan2(dx, dz), dt), dist = Math.min(ALIGN_SPEED * dt, len);
        sim.x += dx / len * dist;
        sim.z += dz / len * dist;
        setClip(sim, 'walk');
        sim.phase += (dist + turned * TURN_STEP) / (Clips.LIST.walk.stride * sim.scale);
        return;
      }
      const { left, turned } = turnTo(sim, place.yaw, dt);
      setClip(sim, 'walk');
      sim.phase += turned * TURN_STEP / (Clips.LIST.walk.stride * sim.scale);
      if (left < 0.02) {
        sim.state = sim.seat.pose === 'sit' || slide ? 'sitDown' : 'use';
        sim.timer = 0;
        if (sim.state === 'use') setClip(sim, sim.useClip || 'use');
      }
    },
    sitDown(world, sim, dt) {
      const seat = sim.seat, lie = seat.pose === 'lie', clip = lie ? 'lieDown' : 'sitDown';
      setClip(sim, clip);
      sim.timer += dt / Clips.LIST[clip].seconds;
      sim.phase = sim.timer;
      sim.seatW = S.smooth(0, 1, sim.timer);
      if (lie) {
        sim.x = seat.backX + (seat.place.x - seat.backX) * sim.seatW;
        sim.z = seat.backZ + (seat.place.z - seat.backZ) * sim.seatW;
      }
      if (sim.timer >= 1) {
        sim.state = 'sit';
        sim.phase = 0;
        setClip(sim, sim.useClip || (lie ? 'sleep' : 'sit'));
      }
    },
    sit(world, sim, dt) {
      const clip = sim.useClip || (sim.seat && sim.seat.pose === 'lie' ? 'sleep' : 'sit');
      setClip(sim, clip);
      sim.phase += dt / (Clips.LIST[clip].seconds || 2);
      sim.seatW = 1;
      if (sim.order || sim.wantUp) {
        sim.wantUp = false;
        sim.state = 'standUp';
        sim.timer = 0;
      }
    },
    standUp(world, sim, dt) {
      const seat = sim.seat, lie = seat.pose === 'lie', clip = lie ? 'getUp' : 'standUp';
      setClip(sim, clip);
      sim.timer += dt / Clips.LIST[clip].seconds;
      sim.phase = sim.timer;
      sim.seatW = 1 - S.smooth(0, 1, sim.timer);
      if (lie) {
        sim.x = seat.backX + (seat.place.x - seat.backX) * sim.seatW;
        sim.z = seat.backZ + (seat.place.z - seat.backZ) * sim.seatW;
      }
      if (sim.timer >= 1) {
        sim.seatW = 0;
        sim.state = 'leave';
      }
    },
    leave(world, sim, dt) {
      const dx = sim.seat.backX - sim.x, dz = sim.seat.backZ - sim.z, len = Math.hypot(dx, dz);
      if (len < 0.02) {
        leaveSeat(sim);
        sim.state = 'idle';
        return;
      }
      const { turned } = turnTo(sim, Math.atan2(dx, dz), dt), dist = Math.min(ALIGN_SPEED * dt, len);
      sim.x += dx / len * dist;
      sim.z += dz / len * dist;
      setClip(sim, 'walk');
      sim.phase += (dist + turned * TURN_STEP) / (Clips.LIST.walk.stride * sim.scale);
    }
  };

  S.Sim = {
    STATE_NAMES: { idle: 'стоит', move: 'идёт', arrive: 'стоит', trip: 'идёт', use: 'за делом', board: 'садится в машину', drive: 'едет', unboard: 'выходит из машины', align: 'подходит к месту', sitDown: 'садится', sit: 'сидит', standUp: 'встаёт', leave: 'отходит' },
    tileKey,

    create(o) {
      const skel = Body.skeleton(o.age, o.sex);
      return {
        id: o.id, name: o.name, age: o.age, sex: o.sex, hair: o.hair, look: o.look, skel,
        x: o.x, z: o.z, floor: o.floor || 0, y: o.y === undefined ? 0 : o.y, yaw: o.yaw || 0,
        scale: Math.max(skel.legLen / 0.93, 0.3), state: 'idle', clip: 'idle', phase: o.phase || 0, blend: 1, timer: 0, seatW: 0,
        rot: new Float32Array(Body.COUNT * 3), root: [0, 0, 0], fromRot: new Float32Array(Body.COUNT * 3), fromRoot: [0, 0, 0], rows: new Float32Array(Body.COUNT * 12),
        path: null, wp: 0, run: false, wait: 0, stuck: 0, ghost: 0, order: null, wantUp: false, useClip: null, needs: o.needs || null, moods: o.needs ? [] : null, held: [], face: 0, act: null, queue: [],
        traits: o.traits ? o.traits.slice() : null, knows: o.needs ? {} : null, hold: 0, holdClip: null, traitState: {}, bubble: null, bubbleLeft: 0,
        wish: o.needs && S.Wishes ? S.Wishes.fresh() : null, happy: 0, dream: null, rewards: o.needs ? [] : null, skill: o.needs && S.Skills ? S.Skills.fresh() : null, thinkLeft: 0, failText: '', failLeft: 0, seat: null, note: '', slopeFrom: null, reserved: -1,
        lot: null, live: !!o.live, inside: null, goal: null, after: null, keepAfter: null, then: null, trip: null, car: null, ride: null,
        hasCar: !!o.hasCar, carColor: o.carColor || 0, free: !!o.free, home: o.home || null, day: o.day || null, dayIndex: -1
      };
    },

    groundY(world, floor, lot, x, z) {
      if (lot) return lot.nav.groundY(floor, x - lot.x, z - lot.z);
      return S.Terrain.heightAt(world.terrain, x, z);
    },

    wantsCar(world, sim, goal) {
      return Math.hypot(goal.x - sim.x, goal.z - sim.z) > CAR_FROM;
    },

    order(world, sim, order) {
      sim.note = '';
      if (sim.inside) stepOut(world, sim);
      if (sim.car) {
        if (order.x !== undefined && sim.after) sim.after.goal = { x: order.x, z: order.z, floor: order.floor || 0, lot: order.lot || null, enter: order.enter || null };
        return;
      }
      sim.after = null;
      sim.then = null;
      if (sim.state === 'trip') {
        sim.trip = null;
        sim.state = 'idle';
      }
      if (sim.state === 'sitDown' || sim.state === 'sit' || sim.state === 'standUp' || sim.state === 'leave' || sim.state === 'idle' || sim.state === 'use' || sim.path === null) {
        sim.order = order;
        return;
      }
      if (sim.seat) leaveSeat(sim);
      const w = sim.path[sim.wp];
      if (w && w.slope) {
        sim.order = order;
        sim.path = [w];
        sim.wp = 0;
        return;
      }
      sim.state = 'idle';
      sim.path = null;
      sim.reserved = -1;
      sim.order = order;
    },

    placesOf,

    cancel(world, sim) {
      if (sim.car || sim.inside) return;
      sim.useClip = null;
      if (sim.state === 'idle' && !sim.order) return;
      if (sim.state === 'sit' || sim.state === 'use' || sim.state === 'sitDown') {
        sim.order = null;
        sim.wantUp = true;
        return;
      }
      if (sim.state === 'standUp' || sim.state === 'leave') {
        sim.order = null;
        return;
      }
      const atSeat = sim.state === 'align', x = atSeat ? sim.seat.backX : sim.x, z = atSeat ? sim.seat.backZ : sim.z;
      S.Sim.order(world, sim, { x, z, floor: sim.floor, lot: sim.lot, car: false });
    },

    getUp(sim) {
      sim.useClip = null;
      if (sim.state === 'sit' || sim.state === 'use') sim.wantUp = true;
    },

    useHere(sim) {
      sim.state = 'use';
      sim.wantUp = false;
      setClip(sim, sim.useClip || 'use');
    },

    go(world, sim, goal) {
      if (sim.live) {
        S.Sim.order(world, sim, goal);
        return;
      }
      if (sim.inside) stepOut(world, sim);
      const target = { x: goal.x, z: goal.z, floor: goal.floor || 0, lot: goal.lot || null, enter: goal.enter || null };
      if (sim.car) {
        if (sim.after) sim.after.goal = target;
        return;
      }
      if (goal.car !== false && (sim.hasCar || goal.ride) && S.Sim.wantsCar(world, sim, target)) {
        const roads = world.roads, a = roads.nearest(sim.x, sim.z), b = roads.nearest(target.x, target.z), line = roads.route(a, b);
        if (line.length > 1) {
          sim.after = { line, goal: target, ride: goal.ride || null };
          beginTrip(world, sim, { x: a.x, z: a.z, floor: 0, lot: null });
          return;
        }
      }
      sim.after = null;
      beginTrip(world, sim, target);
    },

    toBusiness(world, sim) {
      if (!sim.live) return;
      sim.live = false;
      sim.reserved = -1;
      sim.seatW = 0;
      if (sim.seat) leaveSeat(sim);
      sim.then = null;
      sim.slopeFrom = null;
      if (sim.car || sim.inside) return;
      const goal = sim.goal, order = sim.order;
      sim.order = null;
      sim.path = null;
      sim.state = 'idle';
      if (order && !order.item) S.Sim.go(world, sim, order);
      else if (goal) beginTrip(world, sim, goal);
    },

    toLive(world, sim) {
      if (sim.live) return;
      sim.live = true;
      sim.blend = 1;
      if (sim.inside || sim.car) return;
      sim.lot = world.ground.lotAt(sim.x, sim.z);
      const free = startNode(world.ground, 0, sim.x, sim.z);
      if (sim.floor === 0 && free >= 0) {
        const [tx, tz] = world.ground.tileOf(free);
        if (Math.floor(sim.x) !== tx || Math.floor(sim.z) !== tz) {
          sim.x = tx + 0.5;
          sim.z = tz + 0.5;
          sim.lot = world.ground.lotAt(sim.x, sim.z);
        }
      }
      sim.y = S.Sim.groundY(world, sim.floor, sim.lot, sim.x, sim.z);
      if (sim.state === 'trip') {
        const goal = sim.goal;
        sim.trip = null;
        sim.state = 'idle';
        sim.goal = null;
        if (sim.after) {
          const after = sim.after;
          sim.after = null;
          sim.order = { x: goal.x, z: goal.z, floor: 0, car: false };
          sim.keepAfter = after;
        } else {
          sim.order = Object.assign({ car: false }, goal);
        }
      }
    },

    hold(sim, mins, clip) {
      sim.hold = mins;
      sim.holdClip = clip || 'idle';
    },

    step(world, sim, dt) {
      if (sim.inside) {
        if (sim.state === 'use' || sim.wantUp || sim.hold > 0) Object.assign(sim, { state: 'idle', wantUp: false, hold: 0, holdClip: null, useClip: null });
        return;
      }
      if (sim.hold > 0) {
        const clip = sim.holdClip || 'idle';
        setClip(sim, clip);
        sim.phase += dt / (Clips.LIST[clip].seconds || 2);
        sim.hold -= dt;
        if (sim.hold <= 0) {
          sim.hold = 0;
          sim.holdClip = null;
        }
        if (sim.blend < 1) sim.blend = Math.min(1, sim.blend + dt / BLEND_TIME);
        return;
      }
      if (sim.keepAfter && !sim.order) {
        sim.after = sim.keepAfter;
        sim.keepAfter = null;
      }
      stateStep[sim.state](world, sim, dt);
      if (sim.blend < 1) sim.blend = Math.min(1, sim.blend + dt / BLEND_TIME);
    },

    stepAll(world, dt) {
      const count = Math.max(1, Math.min(MAX_SUBSTEPS, Math.ceil(dt / SUBSTEP))), sub = dt / count, taken = world.taken;
      for (let k = 0; k < count; k++) {
        taken.clear();
        for (const sim of world.live) {
          if (sim.inside || sim.state === 'drive') continue;
          taken.set(keyOfSim(sim), sim);
          if (sim.reserved >= 0) taken.set(sim.reserved, sim);
        }
        for (const sim of world.sims) {
          if (sim.live) S.Sim.step(world, sim, sub);
        }
        for (const door of world.doors) {
          let open = false;
          for (const sim of world.live) {
            if (sim.inside || sim.floor !== door.floor || sim.lot !== door.lot) continue;
            if (Math.abs(sim.x - door.x) < DOOR_REACH && Math.abs(sim.z - door.z) < DOOR_REACH && Math.hypot(sim.x - door.x, sim.z - door.z) < DOOR_REACH) {
              open = true;
              break;
            }
          }
          if (open !== door.open) {
            door.open = open;
            world.changed.add(door);
          }
        }
      }
      for (const sim of world.sims) {
        if (!sim.live) S.Sim.step(world, sim, dt);
      }
    },

    pose(sim) {
      const seat = sim.seat, w = sim.seatW, drop = sim.clip === 'sleepFloor' ? sim.skel.hipsY - FLOOR_LIE : seat && w > 0 ? (sim.skel.hipsY - (seat.place.y + HIPS_ABOVE_SEAT * Math.max(sim.scale, 0.6))) * w : 0;
      Clips.sample(sim.clip, sim.phase, sim.rot, sim.root);
      if (sim.blend < 1) Clips.blend(sim.fromRot, sim.fromRoot, sim.rot, sim.root, S.smooth(0, 1, sim.blend));
      return Body.pose(sim.skel, sim.rot, sim.root, sim.x, sim.y - drop, sim.z, sim.yaw, sim.rows);
    },

    indoors(sim) {
      return !!sim.lot && !sim.inside && H.roomAt(sim.lot.house, sim.floor, sim.x - sim.lot.x, sim.z - sim.lot.z) > 0;
    },

    moving: sim => sim.state === 'trip' || sim.clip === 'walk' || sim.clip === 'run',

    busy: sim => !!(sim.order || sim.path || sim.car || sim.trip || sim.wantUp || sim.hold > 0) || BUSY_STATES.has(sim.state),

    hiddenBy(world, sim, rot) {
      const [a, b, c, d] = S.TURNS[rot], wx = (a + c) * Math.SQRT1_2, wz = (b + d) * Math.SQRT1_2, rise = Math.tan(S.CAMERA.elevation);
      for (let t = 0.5; t < 30; t += 0.5) {
        const x = sim.x + wx * t, z = sim.z + wz * t, lot = world.ground.lotAt(x, z);
        if (!lot || !lot.house.floors.length || lot.closed) continue;
        if (t * rise >= lot.house.floors.length * M.floorStep) return null;
        if (H.roomAt(lot.house, 0, x - lot.x, z - lot.z) > 0) return lot;
      }
      return null;
    },

    carSprite(dx, dz, ride) {
      const k = (Math.round(Math.atan2(-dx, -dz) / (Math.PI / 4)) + 8) % 8, model = ride === 'bus' ? 'm_bus' : 'm_car';
      return k % 2 === 0 ? { kind: model, facing: k / 2 } : { kind: model + '45', facing: (k - 1) / 2 };
    }
  };
})(globalThis.Sims98 = globalThis.Sims98 || {});
