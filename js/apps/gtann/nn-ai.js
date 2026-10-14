(function (N) {
  'use strict';

  const GT = N.GT;
  const Phys = N.Phys;
  const stopSpeed = d => Math.sqrt(2 * 6.5 * Math.max(0, d));

  const AI = {};
  N.AI = AI;

  AI.step = (w, dt) => {
    for (const v of w.vehs) {
      if (!v.ai) continue;
      v.ind = 0;
      if (v.dead || v.sink) { v.ai = null; v.ctl.thr = 0; v.ctl.hand = true; continue; }
      if (!v.driver || v.driver.isPlayer || v.driver.dead) {
        if (v.ai.mode === 'lane') { v.ai.mode = 'phys'; v.vx = v.vx || 0; }
        v.ctl.thr = 0; v.ctl.steer = 0; v.ctl.hand = true;
        if (!v.driver || v.driver.dead) { v.ai = null; continue; }
        continue;
      }
      v.flipT = v.up < 0.45 && !v.wheels && Math.hypot(v.vx, v.vz) < 1.5 ? (v.flipT || 0) + dt : 0;
      if (v.flipT > 1.2) {
        const d = v.driver;
        if (d.cop || v.copUnit) AI.copsOut(w, v);
        else { w.exitVehicle(d); AI.flee(d, v.x, v.z, 8); v.ai = null; }
        continue;
      }
      const m = AI.vmodes[v.ai.mode];
      if (m) m(w, v, dt);
    }
    for (const p of w.peds) {
      if (p.veh && !p.isPlayer && !p.dead && p.ai) {
        if (p.ai.mode === 'follow' && p.ai.target && !p.ai.target.veh && !p.ai.target.dead) { w.exitVehicle(p); continue; }
        if (p.ai.shootFromCar && !w.player.dead) {
          if (p.fireT > 0) p.fireT -= dt;
          const pl = w.player;
          if (Math.hypot(pl.x - p.x, pl.z - p.z) < 32 && (p.veh.driver !== p || Math.abs(p.veh.spd) < 8)) AI.shootAt(w, p, pl, dt, 0.35);
        }
        continue;
      }
      if (p.exit && !p.isPlayer && !p.dead) {
        const X = p.exit, then = X.then;
        if (X.v && Math.abs(X.v.spd) > 4) { w.knockDown(p, 1.1, X.v.vx * 0.5, X.v.vz * 0.5, 1); if (then) p.ai = then; continue; }
        w.stepExit(p, dt, {});
        if (!p.exit && then) p.ai = then;
        continue;
      }
      if (p.isPlayer || p.dead || p.veh || p.rope) continue;
      if (p.swim || p.holdT > 0) { p.wantVx = p.wantVz = 0; continue; }
      if (p.state === 'down') continue;
      if (!p.ai) p.ai = { mode: 'idle' };
      AI.crowdPre(w, p);
      if (!p.ai.mission && p.ai.mode !== 'jack' && p.ai.mode !== 'dodge') AI.watchCars(w, p, dt);
      if (p.state === 'down') continue;
      const m = AI.pmodes[p.ai.mode] || AI.pmodes.idle;
      m(w, p, dt);
      if (p.fireT > 0) p.fireT -= dt;
      if (p.reloadT > 0) p.reloadT -= dt;
    }
    AI.stepHeli(w, dt);
    AI.stepDrop(w, dt);
  };

  function segDir(l, i) {
    const p = l.pts, k = i * 2;
    const dx = p[k + 2] - p[k], dz = p[k + 3] - p[k + 1], L = Math.hypot(dx, dz) || 1;
    return [dx / L, dz / L];
  }

  AI.turnSignal = (city, ai) => {
    let id = ai.conn;
    if (id < 0 && ai.next >= 0 && city.lanes[ai.lane].len - ai.s < 28) id = ai.next;
    if (id < 0) return 0;
    const c = city.conns[id];
    if (c.turn === 'S' || city.nodes[c.node].deg < 3) return 0;
    return c.turn === 'L' ? -1 : 1;
  };

  function pickConn(w, lane, prefer) {
    const outs = lane.out.map(id => w.city.conns[id]).filter(c => c.ambient || prefer === 'any');
    if (!outs.length) return -1;
    const straight = outs.filter(c => c.turn === 'S');
    if (straight.length && w.rng() < 0.55) return straight[Math.floor(w.rng() * straight.length)].id;
    return outs[Math.floor(w.rng() * outs.length)].id;
  }

  function scanAhead(w, v, range, yaw, ignore) {
    const fx = Math.sin(yaw), fz = -Math.cos(yaw), rx = -fz, rz = fx;
    let gap = Infinity, who = null;
    w.near(v.x + fx * range * 0.5, v.z + fz * range * 0.5, range * 0.6 + 4, e => {
      if (e === v || e === ignore) return;
      if (e.kind === 'ped' && (e.dead || e.veh)) return;
      const dx = e.x - v.x, dz = e.z - v.z;
      const along = dx * fx + dz * fz;
      if (along <= 0 || along > range) return;
      const lat = Math.abs(dx * rx + dz * rz);
      const wid = e.kind === 'veh' ? e.spec.hw + v.spec.hw + 0.5 : v.spec.hw + 0.55;
      if (lat > wid) return;
      if (e.kind === 'veh') {
        const ey = Math.sin(e.yaw) * fx - Math.cos(e.yaw) * fz;
        if (ey < -0.6 && lat > 1.2) return;
      }
      const g = along - v.spec.hl - (e.kind === 'veh' ? e.spec.hl : 0.3);
      if (g < gap) { gap = g; who = e; }
    });
    return who ? { gap, who } : null;
  }

  function nodeBusy(w, node, self) {
    const r = (node.r || 8) + 1.5;
    return w.near(node.x, node.z, r + 3, e => {
      if (e.kind !== 'veh' || e === self) return;
      if (N.dist2(e.x, e.z, node.x, node.z) < r * r && Math.hypot(e.vx, e.vz) > 0.5) return true;
    });
  }

  function connAfter(w, ai, lane, k) {
    if (!ai.q) ai.q = [];
    if (k < ai.q.length) return ai.q[k];
    if (k > ai.q.length) return -1;
    const c = pickConn(w, lane, ai.anyRoad ? 'any' : null);
    if (c >= 0) ai.q.push(c);
    return c;
  }

  function appendPline(out, pts, from, need) {
    let d = from, got = 0, started = false;
    for (let i = 2; i < pts.length && got < need; i += 2) {
      const ax = pts[i - 2], az = pts[i - 1], sx = pts[i] - ax, sz = pts[i + 1] - az;
      const L = Math.hypot(sx, sz);
      if (!started) {
        if (d > L && i < pts.length - 2) { d -= L; continue; }
        const t = L > 0 ? Math.min(1, d / L) : 0;
        out.push(ax + sx * t, az + sz * t);
        got = L * (1 - t);
        started = true;
      } else got += L;
      out.push(pts[i], pts[i + 1]);
    }
    if (!started) out.push(pts[pts.length - 2], pts[pts.length - 1]);
    return got;
  }

  function laneAhead(w, ai, D) {
    const city = w.city, out = [];
    let need = D, lane, k = 0;
    if (ai.conn < 0) {
      lane = city.lanes[ai.lane];
      need -= appendPline(out, lane.pts, ai.s, need);
      if (need > 0 && ai.next >= 0) {
        const c = city.conns[ai.next];
        need -= appendPline(out, c.pts, 0, need);
        lane = city.lanes[c.to];
        if (need > 0) need -= appendPline(out, lane.pts, 0, need);
      } else need = 0;
    } else {
      const c = city.conns[ai.conn];
      need -= appendPline(out, c.pts, ai.cs, need);
      lane = city.lanes[c.to];
      if (need > 0) need -= appendPline(out, lane.pts, 0, need);
    }
    while (need > 0 && k < 4) {
      const id = connAfter(w, ai, lane, k++);
      if (id < 0) break;
      const c = city.conns[id];
      need -= appendPline(out, c.pts, 0, need);
      lane = city.lanes[c.to];
      if (need > 0) need -= appendPline(out, lane.pts, 0, need);
    }
    if (out.length < 4) out.push(out[0] + 0.01, out[1]);
    return out;
  }

  const A_LAT = 3.4, A_BRAKE = 2.4, TURN_MIN = 2.6, CURVE_WIN = 8, CURVE_STEP = 2;

  function curveLimit(pts, cum, vmax, aLat) {
    const L = cum[cum.length - 1];
    const n = Math.floor(L / CURVE_STEP);
    if (n < 2) return vmax;
    const head = [];
    let prev = N.plineAt(pts, cum, 0);
    for (let i = 1; i <= n; i++) {
      const q = N.plineAt(pts, cum, i * CURVE_STEP);
      head.push(Math.atan2(q.x - prev.x, -(q.z - prev.z)));
      prev = q;
    }
    const win = CURVE_WIN / CURVE_STEP, half = win >> 1;
    let vt = vmax;
    for (let i = 0; i + 1 < head.length; i++) {
      let turn = 0, short = 0;
      for (let j = i; j < Math.min(head.length - 1, i + win); j++) {
        const a = Math.abs(N.wrap(head[j + 1] - head[j]));
        turn += a;
        if (j < i + half) short += a;
      }
      if (turn < 0.05) continue;
      const vc = Math.max(TURN_MIN, Math.sqrt(aLat * Math.min(CURVE_WIN / turn, CURVE_WIN * 0.5 / Math.max(short, 1e-3))));
      vt = Math.min(vt, Math.sqrt(vc * vc + 2 * A_BRAKE * Math.max(0, i * CURVE_STEP - 3)));
    }
    return vt;
  }

  function advanceLane(w, ai, d) {
    const city = w.city;
    if (ai.conn < 0) {
      const lane = city.lanes[ai.lane];
      ai.s += d;
      if (ai.s >= lane.len) {
        if (ai.next >= 0) { ai.conn = ai.next; ai.cs = ai.s - lane.len; ai.next = -1; } else { ai.s = lane.len; ai.v = 0; }
      }
    } else {
      const c = city.conns[ai.conn];
      ai.cs += d;
      if (ai.cs >= c.len) { ai.lane = c.to; ai.s = ai.cs - c.len; ai.conn = -1; ai.next = ai.q && ai.q.length ? ai.q.shift() : -1; }
    }
  }

  AI.blocks = e => {
    const sp = Math.hypot(e.vx || 0, e.vz || 0);
    if (e.kind === 'ped') return sp < 0.4;
    if (sp > 0.5) return false;
    if (e.ai && e.ai.mode === 'lane') return !!e.ai.det;
    return true;
  };

  AI.planDetour = (w, v, ai, who, gap) => {
    const pts = laneAhead(w, ai, 70), cum = N.cumLen(pts);
    const q0 = N.plineAt(pts, cum, 0), q1 = N.plineAt(pts, cum, 1.5);
    let tx = q1.x - q0.x, tz = q1.z - q0.z;
    const tl = Math.hypot(tx, tz) || 1;
    tx /= tl; tz /= tl;
    const rx = -tz, rz = tx;
    const lb = (who.x - pts[0]) * rx + (who.z - pts[1]) * rz;
    const along = (who.x - v.x) * tx + (who.z - v.z) * tz;
    const rel = who.kind === 'veh' ? N.wrap(who.yaw - N.yawOf(tx, tz)) : 0, cr = Math.abs(Math.cos(rel)), sr = Math.abs(Math.sin(rel));
    const bw = who.kind === 'veh' ? who.spec.hw * cr + who.spec.hl * sr : 0.4, bl = who.kind === 'veh' ? who.spec.hl * cr + who.spec.hw * sr : 0.4;
    const need = bw + v.spec.hw + 0.55, pass = along + bl + v.spec.hl + 2.5;
    const back = scanAhead(w, v, 7, v.yaw + Math.PI);
    const room = (back ? back.gap : 7) - 0.6;
    const opts = [lb - need, lb + need].sort((a, b) => Math.abs(a) + (a > 0 ? 0.5 : 0) - Math.abs(b) - (b > 0 ? 0.5 : 0));
    const hit = (x, z, r, moving) => w.near(x, z, 6, e => e.kind === 'veh' && e !== v && e !== who && (!moving || Math.hypot(e.vx, e.vz) > 1.5) && !!N.circleObb(x, z, r, Phys.obbOf(e)));
    for (const o of opts) {
      const needGap = 2 + Math.abs(o) * 1.5;
      if (gap + Math.max(0, room) < needGap - 0.3) continue;
      let ok = true;
      for (let k = 0; ok && k * 1.5 <= pass + 6; k++) {
        const sd = k * 1.5, q = N.plineAt(pts, cum, sd), ramp = N.clamp((sd - v.spec.hl * 0.5) / (needGap + v.spec.hl * 0.5), 0, 1);
        for (const lat of [-v.spec.hw, 0, v.spec.hw]) {
          const x = q.x - q.dz * (o * ramp + lat), z = q.z + q.dx * (o * ramp + lat);
          if (!w.pedSpotFree(x, z) || hit(x, z, 0.45, false)) { ok = false; break; }
        }
      }
      for (let sd = pass + 6; ok && sd < pass + 45; sd += 3) {
        const q = N.plineAt(pts, cum, sd);
        if (hit(q.x - q.dz * o, q.z + q.dx * o, v.spec.hw + 0.4, true)) ok = false;
      }
      if (!ok) continue;
      const rev = Math.max(0, Math.min(room, needGap - gap));
      return { who, off: o, pass: pass + rev, moved: 0, phase: rev > 0.05 ? 'rev' : 'out', revLeft: rev, stuckT: 0 };
    }
    return null;
  };

  AI.reverseLane = (w, v, ai, det, dt) => {
    const behind = scanAhead(w, v, 4, v.yaw + Math.PI);
    const step = Math.min(det.revLeft, 1.4 * dt);
    if (step <= 0 || behind && behind.gap < 0.5) { det.phase = 'out'; det.revLeft = 0; return; }
    const px = v.x, pz = v.z;
    v.x -= Math.sin(v.yaw) * step;
    v.z += Math.cos(v.yaw) * step;
    det.revLeft -= step;
    if (ai.conn < 0) ai.s = Math.max(0, ai.s - step);
    else ai.cs = Math.max(0, ai.cs - step);
    ai.v = 0;
    v.vx = (v.x - px) / dt;
    v.vz = (v.z - pz) / dt;
    v.spd = -step / dt;
    v.wz = 0;
    v.y = w.city.groundY(v.x, v.z);
    v.wheelRot -= step / v.spec.shape.wr;
    v.wheelRotR = v.wheelRot;
    v.rev = true;
    v.ctl.thr = -0.4;
    v.ctl.hand = false;
    if (det.revLeft <= 0) det.phase = 'out';
  };

  function mergeGap(w, v, cid, mine) {
    const city = w.city, to = city.conns[cid].to;
    let gap = Infinity;
    w.near(v.x, v.z, 28, o => {
      if (o.kind !== 'veh' || o === v || !o.ai || o.ai.mode !== 'lane') return;
      let ahead;
      if (o.ai.conn >= 0) {
        if (o.ai.conn === cid) return;
        const oc = city.conns[o.ai.conn];
        if (oc.to !== to) return;
        const left = oc.len - o.ai.cs;
        if (left > mine || left === mine && o.id > v.id) return;
        ahead = mine - left;
      } else if (o.ai.lane === to && o.ai.s < 14) ahead = mine + o.ai.s;
      else return;
      gap = Math.min(gap, ahead - v.spec.hl - o.spec.hl);
    });
    return gap;
  }

  const NODE_CONNS = new WeakMap();

  function segPointD2(px, pz, ax, az, bx, bz) {
    const sx = bx - ax, sz = bz - az, L2 = sx * sx + sz * sz;
    const t = L2 > 1e-9 ? N.clamp(((px - ax) * sx + (pz - az) * sz) / L2, 0, 1) : 0;
    const dx = px - ax - sx * t, dz = pz - az - sz * t;
    return dx * dx + dz * dz;
  }

  function plinesNear(a, b, r) {
    const r2 = r * r;
    for (let i = 2; i < a.length; i += 2) {
      for (let j = 2; j < b.length; j += 2) {
        if (segPointD2(a[i - 2], a[i - 1], b[j - 2], b[j - 1], b[j], b[j + 1]) < r2 || segPointD2(a[i], a[i + 1], b[j - 2], b[j - 1], b[j], b[j + 1]) < r2) return true;
        if (segPointD2(b[j - 2], b[j - 1], a[i - 2], a[i - 1], a[i], a[i + 1]) < r2 || segPointD2(b[j], b[j + 1], a[i - 2], a[i - 1], a[i], a[i + 1]) < r2) return true;
        const px = a[i - 2], pz = a[i - 1], rx = a[i] - px, rz = a[i + 1] - pz, qx = b[j - 2], qz = b[j - 1], sx = b[j] - qx, sz = b[j + 1] - qz;
        const den = rx * sz - rz * sx;
        if (Math.abs(den) < 1e-9) continue;
        const t = ((qx - px) * sz - (qz - pz) * sx) / den, u = ((qx - px) * rz - (qz - pz) * rx) / den;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return true;
      }
    }
    return false;
  }

  function crossSet(city, c) {
    if (c.cross) return c.cross;
    let byNode = NODE_CONNS.get(city);
    if (!byNode) {
      byNode = new Map();
      for (const q of city.conns) { if (!byNode.has(q.node)) byNode.set(q.node, []); byNode.get(q.node).push(q); }
      NODE_CONNS.set(city, byNode);
    }
    c.cross = new Set();
    for (const q of byNode.get(c.node)) if (q !== c && q.from !== c.from && q.to !== c.to && plinesNear(c.pts, q.pts, 2.2)) c.cross.add(q.id);
    return c.cross;
  }

  function crossBlocked(w, v, cid, rem) {
    const city = w.city, X = crossSet(city, city.conns[cid]);
    if (!X.size) return false;
    return w.near(v.x, v.z, 30, o => {
      if (o.kind !== 'veh' || o === v || !o.ai || o.ai.mode !== 'lane') return;
      if (o.ai.conn >= 0) return X.has(o.ai.conn) ? true : undefined;
      if (o.ai.next < 0 || !X.has(o.ai.next) || o.ai.v < 1.5) return;
      const orem = city.lanes[o.ai.lane].len - o.ai.s;
      if (orem < 10 && (orem < rem || orem === rem && o.id < v.id)) return true;
    });
  }

  AI.vmodes = {
    lane(w, v, dt) {
      const ai = v.ai, city = w.city;
      const panic = ai.panic > 0, calm = !v.siren && !panic;
      if (panic) {
        ai.panic -= dt;
        if (w.rng() < dt * 0.8) { v.horn = 0.5; w.emit({ t: 'horn', v }); }
      }
      let vt = panic ? Math.min(ai.vmax * 1.5, v.spec.vmax * 0.85) : ai.vmax;
      if (ai.conn < 0) {
        const lane = city.lanes[ai.lane];
        const rem = lane.len - ai.s;
        if (ai.next === undefined || ai.next < 0) ai.next = ai.q && ai.q.length ? ai.q.shift() : pickConn(w, lane, ai.anyRoad ? 'any' : null);
        const node = city.nodes[lane.to];
        if (node.light && calm && !city.edges[lane.edge].inner) {
          const st = city.lightState(node, w.t, lane.grp);
          if (st === 'r' || (st === 'y' && rem > 7)) vt = Math.min(vt, stopSpeed(rem - 1.2));
        }
        if (ai.next < 0) vt = Math.min(vt, stopSpeed(rem - 2));
        else {
          const c = city.conns[ai.next];
          if (c.turn === 'S' && !node.light && node.deg >= 3 && calm) vt = Math.min(vt, Math.sqrt(10 * 10 + 2 * A_BRAKE * Math.max(0, rem)));
          if (!node.light && node.deg >= 3 && rem < 9 && rem > 0.5 && calm) {
            if (nodeBusy(w, node, v)) vt = Math.min(vt, stopSpeed(rem - 1.5));
          }
          if (rem < 10 && vt > 0.5 && calm && crossBlocked(w, v, ai.next, rem)) vt = Math.min(vt, stopSpeed(rem - 1.5));
        }
      } else if (calm && city.conns[ai.conn].turn === 'S' && !city.nodes[city.conns[ai.conn].node].light) vt = Math.min(vt, 10);
      const mc = ai.conn >= 0 ? ai.conn : ai.next;
      if (mc >= 0 && !v.siren) {
        const mine = ai.conn >= 0 ? city.conns[mc].len - ai.cs : city.lanes[ai.lane].len - ai.s + city.conns[mc].len;
        if (mine < 25) vt = Math.min(vt, Math.max(0, (mergeGap(w, v, mc, mine) - 2.2) * 0.85));
      }
      const look = N.clamp(2 + ai.v * 0.45, 3.5, 12);
      const plan = Math.min(75, ai.v * ai.v / (2 * A_BRAKE) + 14);
      const pts = laneAhead(w, ai, Math.max(plan, look + 4));
      const cum = N.cumLen(pts);
      ai.planT = (ai.planT || 0) - dt;
      if (ai.planT <= 0 || ai.vc === undefined) {
        const first = ai.vc === undefined;
        ai.planT = 0.15;
        ai.vc = curveLimit(pts, cum, Math.max(vt, ai.vmax), panic ? A_LAT * 1.6 : A_LAT);
        if (first) ai.v = Math.min(ai.v, ai.vc);
      }
      vt = Math.min(vt, ai.vc);
      const det = ai.det, sh = ai.off || 0;
      const shift = q => sh ? { x: q.x - q.dz * sh, z: q.z + q.dx * sh } : q;
      const q10 = shift(N.plineAt(pts, cum, 10));
      const ah = scanAhead(w, v, 24, N.yawOf(q10.x - v.x, q10.z - v.z), det ? det.who : null);
      const blocker = !det && ah && ah.gap < 9 && AI.blocks(ah.who) ? ah.who : null;
      if (ah) {
        vt = Math.min(vt, Math.max(0, (ah.gap - (blocker ? 3.4 : 2.2)) * 0.85));
        if (ah.who.kind === 'ped' || (ah.who.driver && ah.who.driver.isPlayer)) {
          if (ah.gap < 7 && ai.v < 1 && w.rng() < dt * 0.7) { v.horn = 0.4; w.emit({ t: 'horn', v }); }
        }
      }
      ai.jamT = panic && ai.v < 1 && ah && ah.gap < 5 ? (ai.jamT || 0) + dt : 0;
      if (ai.jamT > 1.4) { AI.bailOut(w, v, ai.from || w.player); return; }
      if (det) {
        vt = Math.min(vt, 6);
        det.stuckT = ai.v < 0.3 && det.phase !== 'rev' ? det.stuckT + dt : 0;
        if (det.phase === 'out' && (det.moved > det.pass || det.stuckT > 6)) det.phase = 'back';
        if (det.phase === 'back' && Math.abs(sh) < 0.03) { ai.det = null; ai.off = 0; }
        if (det.phase === 'rev') { AI.reverseLane(w, v, ai, det, dt); return; }
      } else {
        ai.waitT = blocker && ai.v < 0.4 ? (ai.waitT || 0) + dt : 0;
        if (!ai.patience) ai.patience = 8 + w.rng() * 4;
        if (ai.waitT > ai.patience) {
          ai.det = AI.planDetour(w, v, ai, blocker, ah.gap);
          ai.waitT = ai.det ? 0 : ai.patience - 1.5;
          ai.noWay = ai.det ? 0 : (ai.noWay || 0) + 1;
          if (ai.noWay > 8) { v.ai = { mode: 'rejoin', ambient: true, vmax: ai.vmax, turn: true }; return; }
        }
      }
      const shL = det ? N.approach(sh, det.phase === 'out' ? det.off : 0, look * (det.phase === 'out' ? 0.6 : 0.4)) : sh;
      const tqr = N.plineAt(pts, cum, look), tq = shL ? { x: tqr.x - tqr.dz * shL, z: tqr.z + tqr.dx * shL } : tqr;
      const tdx = tq.x - v.x, tdz = tq.z - v.z, tL = Math.hypot(tdx, tdz);
      const alpha = tL > 0.3 ? N.wrap(N.yawOf(tdx, tdz) - v.yaw) : 0;
      const q1 = N.plineAt(pts, cum, 1), tgx = q1.x - pts[0], tgz = q1.z - pts[1], tgL = Math.hypot(tgx, tgz) || 1;
      const off = Math.hypot(v.x - (pts[0] - tgz / tgL * sh), v.z - (pts[1] + tgx / tgL * sh));
      vt = Math.min(vt, TURN_MIN + 14 * Math.max(0, 1 - Math.abs(alpha) / 0.7), off > 0.9 ? TURN_MIN + 6 / off : Infinity, det ? 1.5 + 3 * Math.max(0, 1.2 - off) : Infinity);
      const v0 = ai.v;
      ai.v = N.approach(ai.v, vt, dt * (vt > ai.v ? 2.6 : 8));
      const d = ai.v * dt;
      const fx0 = Math.sin(v.yaw), fz0 = -Math.cos(v.yaw);
      const lead = N.clamp(((v.x - pts[0]) * tgx + (v.z - pts[1]) * tgz) / tgL, -0.6, 0.6) * Math.min(1, dt * 4);
      const wb = v.spec.shape.wb || 2.4;
      const kMax = Math.min(Math.tan(0.62) / wb, A_LAT * 3 / Math.max(1, ai.v * ai.v));
      const kWant = N.clamp(2 * Math.sin(alpha) / Math.max(tL, 1), -kMax, kMax);
      ai.k = N.approach(ai.k || 0, kWant, dt * (0.6 + ai.v * 0.08));
      const dyaw = ai.k * d;
      const hy = v.yaw + dyaw * 0.5;
      const px = v.x, pz = v.z;
      v.x += Math.sin(hy) * d;
      v.z -= Math.cos(hy) * d;
      v.yaw = N.wrap(v.yaw + dyaw);
      advanceLane(w, ai, Math.max(0, d * (fx0 * tgx + fz0 * tgz) / tgL + lead));
      if (ai.det) {
        ai.det.moved += d;
        ai.off = N.approach(sh, ai.det.phase === 'out' ? ai.det.off : 0, d * (ai.det.phase === 'out' ? 0.6 : 0.4));
      }
      v.wz = dt > 0 ? dyaw / dt : 0;
      v.vx = dt > 0 ? (v.x - px) / dt : 0;
      v.vz = dt > 0 ? (v.z - pz) / dt : 0;
      v.spd = ai.v;
      v.y = city.groundY(v.x, v.z);
      v.vy = 0;
      v.air = false;
      if (dt > 0) Phys.bodyKin(v, dt, (ai.v - v0) / dt, ai.v * v.wz);
      v.wheelRot += ai.v * dt / v.spec.shape.wr;
      v.wheelRotR = v.wheelRot;
      v.steer = N.clamp(Math.atan(ai.k * wb), -0.6, 0.6);
      v.ctl.thr = vt > ai.v + 0.3 ? 0.6 : vt < ai.v - 0.3 ? -0.5 : 0.1;
      v.ctl.hand = false;
      v.lastLaneT = w.t;
      v.ind = AI.turnSignal(city, ai);
    },

    phys(w, v, dt) {
      const ai = v.ai;
      ai.t = (ai.t || 0) + dt;
      v.ind = 2;
      v.ctl.thr = 0;
      v.ctl.steer = 0;
      v.ctl.hand = Math.abs(v.spd) < 3;
      if (ai.t > 2.2 && Math.hypot(v.vx, v.vz) < 2) {
        if (v.driver && v.driver.cop && w.wanted.level > 0) { v.ai = { mode: 'pursue', target: w.player }; return; }
        ai.mode = 'rejoin';
        ai.t = 0;
      }
    },

    rejoin(w, v, dt) {
      const ai = v.ai, city = w.city;
      ai.t = (ai.t || 0) + dt;
      ai.age = (ai.age || 0) + dt;
      const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
      if (!ai.target || ai.t > 6) {
        const turn = ai.turn || ai.age > 14, away = ai.from && ai.age < 8 ? ai.from : null;
        if (turn && ai.tdx === undefined) { ai.tdx = fx; ai.tdz = fz; }
        const ok = (l, i) => {
          if (!l.ambient) return false;
          const d = segDir(l, i), dot = turn ? d[0] * ai.tdx + d[1] * ai.tdz : d[0] * fx + d[1] * fz;
          if (turn ? dot > -0.3 : dot < 0.3) return false;
          if (!away) return true;
          const k = i * 2;
          return (l.pts[k] - away.x) * d[0] + (l.pts[k + 1] - away.z) * d[1] > 0;
        };
        const ahead = (l, i) => { if (!l.ambient) return false; const d = segDir(l, i); return d[0] * fx + d[1] * fz > 0.3; };
        const nl = turn ? city.nearestLane(v.x, v.z, 30, ok) : city.nearestLane(v.x + fx * 6, v.z + fz * 6, 30, ok) || (away ? city.nearestLane(v.x + fx * 6, v.z + fz * 6, 30, ahead) : null);
        if (!nl) { ai.target = null; if (ai.age > 30) v.ai = null; return; }
        ai.target = nl;
        ai.t = 0;
      }
      const nl = ai.target;
      const l = nl.lane;
      const tp = city.lanePoint(l, N.clamp(nl.s + 9, 0, l.len));
      AI.steerTo(w, v, tp.x, tp.z, 8, dt);
      const cur = city.nearestLane(v.x, v.z, 3, q => q.id === l.id);
      if (cur && cur.d < 1.2 && Math.abs(N.wrap(v.yaw - N.yawOf(cur.dx, cur.dz))) < 0.3) {
        v.ai = { mode: 'lane', lane: l.id, s: cur.s, conn: -1, cs: 0, v: Math.max(0, v.spd), vmax: ai.vmax || l.speed * (0.8 + w.rng() * 0.3), next: -1, ambient: ai.ambient !== false, panic: ai.panic, from: ai.from };
      }
    },

    pursue(w, v, dt) {
      const ai = v.ai, city = w.city;
      const tgt = ai.target || w.player;
      if (w.wanted.level <= 0 && tgt === w.player) { v.siren = false; v.ai = { mode: 'rejoin', ambient: true }; return; }
      v.siren = true;
      if (v.rearDoor) v.rearDoor = Math.max(0, v.rearDoor - dt * 1.2);
      const tx0 = tgt.veh ? tgt.veh.x : tgt.x, tz0 = tgt.veh ? tgt.veh.z : tgt.z;
      const tvx = tgt.veh ? tgt.veh.vx : tgt.vx, tvz = tgt.veh ? tgt.veh.vz : tgt.vz;
      const dist = Math.hypot(tx0 - v.x, tz0 - v.z);
      ai.pathT = (ai.pathT || 0) - dt;
      if (dist < 45) {
        const lead = Math.min(1, dist / 25);
        const tx = tx0 + tvx * lead, tz = tz0 + tvz * lead;
        let vt;
        const tspd = tgt.veh ? Math.abs(tgt.veh.spd) : Math.hypot(tvx, tvz);
        if (!tgt.veh) vt = N.clamp((dist - 9) * 0.9, 0, 20);
        else vt = w.wanted.level >= 2 && tspd > 6 ? Math.max(tspd + (v.copUnit && v.pass.length >= 4 ? 9 : 6), 18) : N.clamp((dist - 7) * 1.1, 0, 22);
        if (v.copUnit && v.pass.length >= 4 && dist < 32 && (!tgt.veh || tspd < 3)) {
          AI.steerTo(w, v, tx, tz, 0, dt);
          if (Math.abs(v.spd) < 1.2) v.ai = { mode: 'unload', t: 0, k: 0, wait: 0 };
          return;
        }
        AI.steerTo(w, v, tx, tz, vt, dt);
        if (dist < 13 && Math.abs(v.spd) < 3 && (!tgt.veh || tspd < 3)) AI.copsOut(w, v);
        ai.path = null;
      } else {
        if (!ai.path || ai.pathT <= 0) AI.pathTo(w, v, ai, tx0, tz0);
        AI.followPath(w, v, ai, 26, dt);
      }
    },

    armor(w, v, dt) {
      const ai = v.ai, pl = w.player;
      if (w.wanted.level <= 0) { v.siren = false; v.ai = { mode: 'rejoin', ambient: true }; return; }
      const T = v.spec.turret, tank = v.spec.type === 'tank', G = N.VEH_GUNS[T.main], crew = v.driver;
      const tv = pl.veh, tx = tv ? tv.x : pl.x, tz = tv ? tv.z : pl.z, ty = tv ? tv.y + Math.min(1.1, tv.spec.shape.H * 0.5) : pl.y + 1.1;
      const d = Math.hypot(tx - v.x, tz - v.z), near = tank ? 30 : 40, far = tank ? 90 : 80;
      ai.blindT = ai.clear ? 0 : (ai.blindT || 0) + dt;
      AI.armorDrive(w, v, ai, tx, tz, d, near, ai.blindT > 6 ? near + 8 : far, dt);
      v.reloadT = Math.max(0, v.reloadT - dt);
      v.gunT = Math.max(0, v.gunT - dt);
      v.coaxT = Math.max(0, v.coaxT - dt);
      v.recoil = Math.max(0, v.recoil - dt * 2.5);
      const lead = d / (G.speed || 700), ax = tx + (tv ? tv.vx : pl.vx) * lead, az = tz + (tv ? tv.vz : pl.vz) * lead;
      w.aimTurret(v, ax, ty, az, dt);
      const m = w.gunPose(v, false), off = Math.abs(N.wrap(N.yawOf(ax - m.x, az - m.z) - N.yawOf(m.dx, m.dz)));
      ai.lookT = (ai.lookT || 0) - dt;
      if (ai.lookT <= 0) { ai.lookT = 0.3; ai.clear = d < (tank ? 170 : 150) && AI.lineClear(w, v, m, tx, ty, tz); }
      ai.seeT = ai.clear ? (ai.seeT || 0) + dt : 0;
      if (!ai.clear || ai.seeT < (tank ? 1.5 : 0.6)) return;
      if (off < 0.04) {
        if (tank) {
          ai.shotT = (ai.shotT || 0) - dt;
          if (ai.shotT <= 0 && v.reloadT <= 0 && w.fireTurret(crew, v, false, 2)) { v.reloadT += w.rng() * 3; ai.shotT = 1; }
        } else {
          ai.burstT = (ai.burstT === undefined ? 0.9 : ai.burstT) - dt;
          if (ai.burstT < -2.2) ai.burstT = 0.9;
          if (ai.burstT > 0) w.fireTurret(crew, v, false, 3);
        }
      }
      if (d < 70 && off < 0.08) {
        ai.coaxB = (ai.coaxB === undefined ? 0.7 : ai.coaxB) - dt;
        if (ai.coaxB < -1.8) ai.coaxB = 0.7;
        if (ai.coaxB > 0) w.fireTurret(crew, v, true, 3);
      }
    },

    route(w, v, dt) {
      const ai = v.ai;
      if (ai.delay > 0) { ai.delay -= dt; v.ctl.thr = 0; v.ctl.hand = true; return; }
      if (!ai.path || !ai.path.length) { AI.steerTo(w, v, v.x, v.z, 0, dt); return; }
      const done = AI.followPath(w, v, ai, ai.speed || 16, dt);
      if (done) {
        if (ai.loop) { ai.wp = 0; ai.pp = null; }
        else { ai.arrived = true; v.ctl.thr = 0; v.ctl.hand = true; }
      }
    },

    flee(w, v, dt) {
      const ai = v.ai, city = w.city;
      ai.pathT = (ai.pathT || 0) - dt;
      if (!ai.path || ai.wp >= ai.path.length || ai.pathT <= 0) {
        ai.pathT = 45;
        ai.pp = null;
        const from = AI.nextNode(city, v);
        const pl = w.player;
        let best = null, bs = -Infinity;
        for (let k = 0; k < 12; k++) {
          const n = city.nodes[Math.floor(w.rng() * city.nodes.length)];
          if (n.deg < 2) continue;
          const dn = Math.hypot(n.x - v.x, n.z - v.z);
          if (dn < 250) continue;
          const score = Math.hypot(n.x - pl.x, n.z - pl.z) - dn * 0.3 + (ai.area ? -Math.hypot(n.x - ai.area.x, n.z - ai.area.z) * 0.6 : 0);
          if (score > bs) { bs = score; best = n; }
        }
        if (best) {
          const r = city.route(from.id, best.id, !!ai.plant);
          if (r) { ai.path = AI.trimPath(v, AI.waypoints(city, r)); ai.wp = 0; ai.pp = null; }
        }
      }
      if (ai.path) AI.followPath(w, v, ai, ai.speed || 26, dt);
    },

    chase(w, v, dt) {
      const ai = v.ai;
      const tgt = ai.target;
      if (!tgt || tgt.dead || tgt.removed) { v.ai = { mode: 'phys' }; return; }
      const tx = tgt.veh ? tgt.veh.x : tgt.x, tz = tgt.veh ? tgt.veh.z : tgt.z;
      const dist = Math.hypot(tx - v.x, tz - v.z);
      if (dist < 50) {
        AI.steerTo(w, v, tx + (tgt.vx || 0) * 0.6, tz + (tgt.vz || 0) * 0.6, ai.speed || 28, dt);
        ai.path = null;
      } else {
        ai.pathT = (ai.pathT || 0) - dt;
        if (!ai.path || ai.pathT <= 0) AI.pathTo(w, v, ai, tx, tz);
        if (ai.path) AI.followPath(w, v, ai, ai.speed || 26, dt);
      }
    },

    unload(w, v, dt) {
      const ai = v.ai, pl = w.player;
      ai.t += dt;
      v.ctl.thr = 0; v.ctl.steer = 0; v.ctl.hand = true;
      v.siren = w.wanted.level > 0;
      const rear = v.spec.shape.body === 'truck';
      if (rear) v.rearDoor = Math.min(1, (v.rearDoor || 0) + dt * 1.6);
      const crew = v.pass.filter(p => !p.isPlayer && !p.dead);
      if (crew.length && ai.t > (rear ? 0.7 : 0.3) + ai.k * 0.45) {
        const p = crew[crew.length - 1];
        if (rear) w.exitRear(p); else w.exitVehicle(p);
        const tx = pl.veh ? pl.veh.x : pl.x, tz = pl.veh ? pl.veh.z : pl.z, dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz) || 1;
        const ux = dx / d, uz = dz / d, sd = ai.k % 2 ? 1 : -1, along = Math.min(d * 0.45, 4 + ai.k * 0.7), side = sd * (1.6 + (ai.k >> 1) * 1.7);
        p.ai = { mode: 'cop', car: v, post: [p.x + ux * along - uz * side, p.z + uz * along + ux * side] };
        ai.k++;
      }
      const tx = pl.veh ? pl.veh.x : pl.x, tz = pl.veh ? pl.veh.z : pl.z, far = Math.hypot(tx - v.x, tz - v.z);
      const boarding = w.peds.some(p => p.ai && p.ai.mode === 'board' && p.ai.car === v && !p.dead);
      if (boarding && ai.wait < 25) { ai.wait += dt; return; }
      if (w.wanted.level <= 0 || (!crew.length && far > 70) || (pl.veh && Math.abs(pl.veh.spd) > 6 && far > 40)) {
        v.ai = { mode: 'pursue', target: pl, aggressive: true };
        if (w.wanted.level <= 0) { v.siren = false; v.ai = { mode: 'rejoin', ambient: true }; }
      }
    },

    stopout(w, v, dt) {
      const ai = v.ai;
      ai.t += dt;
      v.ind = 2;
      v.ctl.steer = 0;
      v.ctl.thr = v.spd > 0.6 ? -1 : v.spd < -0.6 ? 1 : 0;
      v.ctl.hand = Math.abs(v.spd) < 1.2;
      ai.still = Math.abs(v.spd) < 0.5 ? (ai.still || 0) + dt : 0;
      if (ai.still > (ai.wait || 0.5) || ai.t > 6) {
        const d = v.driver;
        v.ai = null;
        if (d) w.npcExit(d, ai.then);
      }
    },

    ram(w, v, dt) {
      const ai = v.ai, pl = w.player, tv = pl.veh;
      ai.t += dt;
      const tx = tv ? tv.x : pl.x, tz = tv ? tv.z : pl.z, dist = Math.hypot(tx - v.x, tz - v.z);
      if (pl.dead || ai.t > ai.T || dist > 160 || w.wanted.level >= 3) { v.ai = { mode: 'rejoin', ambient: true, vmax: ai.vmax }; return; }
      if (!tv && dist < 25 || tv && ai.rams >= 2 && Math.abs(tv.spd) < 1 && dist < 11) { v.ai = { mode: 'stopout', t: 0, vmax: ai.vmax, wait: 0.2, then: { mode: 'attack', target: pl, t: 0, rage: 25 } }; return; }
      if (tv && v.hitBy === tv && v.hitDv > 2 && ai.t > 0.5 && !(ai.backT > 0)) { ai.backT = 1.1 + w.rng() * 0.5; ai.rams++; }
      if (ai.backT > 0) { ai.backT -= dt; v.ctl.thr = -1; v.ctl.steer = 0; v.ctl.hand = false; return; }
      if (w.rng() < dt * 0.6) { v.horn = 0.5; w.emit({ t: 'horn', v }); }
      const ang = N.wrap(N.yawOf(tx - v.x, tz - v.z) - v.yaw);
      ai.slowT = Math.abs(v.spd) < 0.6 ? (ai.slowT || 0) + dt : 0;
      if (ai.slowT > 1.5) { ai.slowT = 0; ai.gapT = 0; ai.backT = 1.1; return; }
      if (!(ai.gapT > 0) && Math.abs(ang) > 1.7 && dist < 14) ai.gapT = 2.5;
      if (ai.gapT > 0) {
        ai.gapT -= dt;
        if (dist > 16) ai.gapT = 0;
        v.ctl.thr = 1; v.ctl.steer = -0.1; v.ctl.hand = false;
        return;
      }
      if (Math.abs(ang) > 1.9) {
        v.ctl.thr = Math.abs(v.spd) > 7 ? -0.7 : 0.7; v.ctl.steer = -1; v.ctl.hand = false;
        return;
      }
      if (dist > 55) {
        ai.pathT = (ai.pathT || 0) - dt;
        if (!ai.path || ai.pathT <= 0) AI.pathTo(w, v, ai, tx, tz);
        AI.followPath(w, v, ai, 24, dt);
        return;
      }
      ai.path = null;
      const tvx = tv ? tv.vx : 0, tvz = tv ? tv.vz : 0, lead = Math.min(1.2, dist / 18);
      AI.steerTo(w, v, tx + tvx * lead, tz + tvz * lead, Math.max(13, Math.hypot(tvx, tvz) + 7), dt);
    },

    stop(w, v) { v.ctl.thr = 0; v.ctl.steer = 0; v.ctl.hand = true; }
  };

  AI.pathTo = (w, v, ai, tx, tz) => {
    const city = w.city, a = AI.nextNode(city, v), b = city.nearestNode(tx, tz, n => n.deg > 1);
    const r = city.route(a.id, b.id, true);
    ai.pathT = 4;
    ai.path = r ? AI.trimPath(v, AI.waypoints(city, r).concat([{ x: tx, z: tz }])) : [{ x: tx, z: tz }];
    ai.wp = 0;
    ai.pp = null;
  };

  AI.armorDrive = (w, v, ai, tx, tz, d, near, far, dt) => {
    const tank = v.spec.type === 'tank', pl = w.player;
    if (d > far) {
      if (d < 50) { AI.steerTo(w, v, tx, tz, 10, dt); ai.path = null; return; }
      ai.pathT = (ai.pathT || 0) - dt;
      if (!ai.path || ai.pathT <= 0) AI.pathTo(w, v, ai, tx, tz);
      AI.followPath(w, v, ai, tank ? 14 : 18, dt);
      return;
    }
    ai.path = null;
    if (tank && pl.veh && d < near && Math.abs(pl.veh.spd) < 4) { AI.steerTo(w, v, tx, tz, 8, dt); return; }
    if (!tank && d < near) {
      const ahead = (tx - v.x) * Math.sin(v.yaw) - (tz - v.z) * Math.cos(v.yaw) > 0;
      v.ctl.thr = Math.abs(v.spd) < 6 ? (ahead ? -0.8 : 0.8) : 0;
      v.ctl.steer = 0;
      v.ctl.hand = false;
      return;
    }
    AI.steerTo(w, v, v.x, v.z, 0, dt);
  };

  AI.lineClear = (w, v, m, tx, ty, tz) => {
    const pl = w.player, dx = tx - m.x, dy = ty - m.y, dz = tz - m.z, L = Math.hypot(dx, dy, dz) || 1;
    const hit = w.raycast(m.x, m.y, m.z, dx / L, dy / L, dz / L, L + 1, v.driver);
    return !hit || hit.t > L - 1.5 || hit.kind === 'ped' && hit.ped === pl || hit.kind === 'veh' && hit.veh === pl.veh;
  };

  AI.nextNode = (city, v) => {
    const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
    let best = null, bs = Infinity;
    for (const n of city.nodes) {
      if (n.deg < 2) continue;
      const dx = n.x - v.x, dz = n.z - v.z;
      const d = Math.hypot(dx, dz);
      if (d > 400) continue;
      const dot = d > 1 ? (dx * fx + dz * fz) / d : 1;
      const score = d * (dot > 0.5 ? 1 : dot > -0.2 ? 2.2 : 4);
      if (score < bs) { bs = score; best = n; }
    }
    return best || city.nearestNode(v.x, v.z, n => n.deg > 1);
  };

  AI.trimPath = (v, pts) => {
    const fx = Math.sin(v.yaw), fz = -Math.cos(v.yaw);
    while (pts.length > 1) {
      const p = pts[0];
      const dx = p.x - v.x, dz = p.z - v.z;
      if (Math.hypot(dx, dz) < 30 && dx * fx + dz * fz < 2) pts.shift(); else break;
    }
    return pts;
  };

  AI.waypoints = (city, nodes) => {
    const pts = [];
    for (let i = 0; i + 1 < nodes.length; i++) {
      const a = nodes[i], b = nodes[i + 1];
      const lane = city.laneFor(a, b, 0);
      let p = lane ? lane.pts : null;
      if (!p) { const e = city.edgeBetween(a, b); if (!e) continue; p = e.a === a ? e.pts : N.reversePoly(e.pts); }
      const cum = N.cumLen(p), L = cum[cum.length - 1];
      const n = Math.max(1, Math.ceil(L / 14));
      for (let k = 0; k <= n; k++) { const q = N.plineAt(p, cum, L * k / n); pts.push({ x: q.x, z: q.z }); }
    }
    if (!pts.length && nodes.length) { const n = city.nodes[nodes[0]]; pts.push({ x: n.x, z: n.z }); }
    return pts;
  };

  AI.followPath = (w, v, ai, speed, dt) => {
    const P = ai.path;
    if (!ai.pp) { ai.pp = [{ x: v.x, z: v.z }].concat(P); ai.seg = 0; }
    const pts = ai.pp;
    if (ai.seg === undefined) ai.seg = 0;
    const last = pts.length - 1;
    for (let k = 0; k < 4 && ai.seg < last; k++) {
      const a = pts[ai.seg], b = pts[ai.seg + 1];
      const sx = b.x - a.x, sz = b.z - a.z, L2 = sx * sx + sz * sz || 1;
      const t = ((v.x - a.x) * sx + (v.z - a.z) * sz) / L2;
      if (t > 1 || Math.hypot(b.x - v.x, b.z - v.z) < 4) ai.seg++; else break;
    }
    ai.wp = Math.max(0, ai.seg);
    const end = pts[last];
    if (ai.seg >= last || (ai.seg === last - 1 && Math.hypot(end.x - v.x, end.z - v.z) < (ai.wpR || 6))) { AI.steerTo(w, v, v.x, v.z, 0, dt); ai.wp = P.length; return true; }
    const a = pts[ai.seg], b = pts[ai.seg + 1];
    const sx = b.x - a.x, sz = b.z - a.z, SL = Math.hypot(sx, sz) || 1;
    const t = N.clamp(((v.x - a.x) * sx + (v.z - a.z) * sz) / (SL * SL), 0, 1);
    let px = a.x + sx * t, pz = a.z + sz * t;
    let look = Math.max(6, Math.abs(v.spd) * 0.75);
    let i = ai.seg, rem = SL * (1 - t);
    let tx = px, tz = pz;
    for (;;) {
      const A = pts[i], B = pts[i + 1];
      const ex = B.x - A.x, ez = B.z - A.z, EL = Math.hypot(ex, ez) || 1;
      const startT = i === ai.seg ? t : 0;
      const avail = EL * (1 - startT);
      if (look <= avail || i + 1 >= last) {
        const k = Math.min(1, startT + look / EL);
        tx = A.x + ex * k; tz = A.z + ez * k;
        break;
      }
      look -= avail;
      i++;
    }
    let vt = speed;
    let dist = rem;
    for (let j = ai.seg + 1; j < last && dist < 120; j++) {
      const A = pts[j - 1], B = pts[j], C = pts[j + 1];
      const a1 = Math.atan2(B.x - A.x, B.z - A.z), a2 = Math.atan2(C.x - B.x, C.z - B.z);
      const turn = Math.abs(N.wrap(a2 - a1));
      const vc = turn > 1.2 ? 8 : turn > 0.6 ? 12 : turn > 0.25 ? 18 : 99;
      if (vc < 99) vt = Math.min(vt, Math.sqrt(vc * vc + 2 * 4.2 * Math.max(0, dist - 4)) + (ai.aggressive ? 1.5 : 0));
      dist += Math.hypot(C.x - B.x, C.z - B.z);
    }
    AI.steerTo(w, v, tx, tz, vt, dt);
    return false;
  };

  AI.steerTo = (w, v, tx, tz, vt, dt) => {
    const ai = v.ai || {};
    const dx = tx - v.x, dz = tz - v.z;
    const dist = Math.hypot(dx, dz);
    const ang = dist > 0.5 ? N.wrap(N.yawOf(dx, dz) - v.yaw) : 0;
    let steer = N.clamp(ang * 2.1, -1, 1);
    let thr;
    const spd = v.spd;
    ai.stuckT = ai.stuckT || 0;
    if (ai.revT > 0) {
      ai.revT -= dt;
      v.ctl.thr = -1;
      v.ctl.steer = -ai.revSteer;
      v.ctl.hand = false;
      return;
    }
    const ah = scanAhead(w, v, 14, v.yaw);
    if (ah && ah.who.kind === 'veh' && !(ah.who.driver && ah.who.driver.isPlayer && (v.siren || ai.mode === 'ram')) && ah.gap < 8) {
      steer = N.clamp(steer + (ang >= 0 ? 0.6 : -0.6), -1, 1);
      vt = Math.min(vt, Math.max(4, ah.gap));
    }
    if (Math.abs(ang) > 2.3 && dist < 12) { thr = -0.8; steer = -steer; }
    else {
      const want = vt * N.clamp(1 - Math.abs(ang) / 2.4, 0.3, 1);
      thr = spd < want - 0.5 ? 1 : spd > want + 0.6 ? -Math.min(1, (spd - want) / 3 + 0.35) : 0.15;
      if (vt < 0.3) thr = spd > 0.5 ? -1 : 0;
    }
    v.ctl.thr = thr;
    v.ctl.steer = steer;
    v.ctl.hand = vt < 0.3 && Math.abs(spd) < 1 || (Math.abs(ang) > 1.3 && spd > 14);
    if (thr > 0.5 && Math.abs(spd) < 0.8 && vt > 2) ai.stuckT += dt; else ai.stuckT = Math.max(0, ai.stuckT - dt * 2);
    ai.moveT = (ai.moveT || 0) + dt;
    if (!ai.moveP) ai.moveP = { x: v.x, z: v.z };
    if (ai.moveT > 2.5) {
      if (vt > 2 && Math.hypot(v.x - ai.moveP.x, v.z - ai.moveP.z) < 1.5) ai.stuckT = 9;
      ai.moveT = 0;
      ai.moveP = { x: v.x, z: v.z };
    }
    if (ai.stuckT > 1.2) { ai.stuckT = 0; ai.revT = 1.3; ai.revSteer = steer >= 0 ? 1 : -1; ai.moveT = 0; ai.moveP = null; }
    v.ai = ai;
  };

  AI.bump = (v, w) => {
    if (!v.ai) return;
    if (v.ai.mode === 'lane') {
      const { vmax, panic, from } = v.ai;
      v.ai = { mode: 'phys', t: 0, vmax, ambient: true, panic, from };
    }
  };

  const CRASH_LINES = {
    stay: ['Куда смотришь, баран?!', 'Права купил, что ли?!', 'Ну ты даёшь, водила!'],
    look: ['Ну ты глянь, крыло помял!', 'Кто мне теперь за ремонт платить будет?!', 'Только из ремонта забрал...', 'Эх, бампер новый был...'],
    fight: ['Ты чё творишь, баран?!', 'Ну всё, приехали!', 'Сейчас я тебе фары-то поправлю!', 'Выходи, поговорим!'],
    ram: ['Ах ты гад! Ну держись!', 'Сейчас я тебя сам протараню!', 'Стоять, урод!'],
    flee: ['Псих какой-то!', 'Ну его, от греха подальше...', 'Да он больной!']
  };
  const BUSY_MODES = new Set(['ram', 'stopout', 'route', 'chase', 'pursue', 'unload', 'armor']);

  AI.crashReact = (w, v, other, dv) => {
    const d = v.driver;
    if (!d || d.isPlayer || d.dead || d.cop || d.ai && d.ai.mission || v.persistent || v.spec.turret || v.spec.type === 'bike') return;
    if (v.mood && w.t - v.mood.t < 8) return;
    if (v.ai && (BUSY_MODES.has(v.ai.mode) || v.ai.panic > 0)) { v.mood = { t: w.t, kind: v.mood ? v.mood.kind : 'busy' }; return; }
    let kind;
    if (d.gang) kind = w.rng() < 0.6 ? 'ram' : 'fight';
    else {
      const tough = d.tough || 0.1, timid = d.look && (d.look.old || !d.look.male) ? 0.12 : 0;
      const agg = Math.max(0.04, 0.12 + tough * 0.5 - timid), flee = 0.26 + timid, look = dv < 4 ? 0.1 : 0.22;
      const r = w.rng();
      kind = r < agg * 0.62 ? 'ram' : r < agg ? 'fight' : r < agg + flee ? 'flee' : r < agg + flee + look ? 'look' : 'stay';
    }
    v.mood = { t: w.t, kind };
    AI.mood(w, v, kind, other);
  };

  AI.mood = (w, v, kind, other) => {
    const d = v.driver, pl = w.player, vmax = v.ai && v.ai.vmax;
    if (kind === 'stay') { v.ai = { mode: 'phys', t: 0, vmax, ambient: true }; v.horn = 0.9; w.emit({ t: 'horn', v }); }
    else if (kind === 'look') {
      const c = Math.cos(v.yaw), sn = Math.sin(v.yaw), ox = other ? other.x - v.x : 0, oz = other ? other.z - v.z : -1;
      let lx = ox * c + oz * sn, lz = -ox * sn + oz * c;
      const L = Math.hypot(lx, lz) || 1;
      lx /= L; lz /= L;
      const k = Math.min((v.spec.hw + 0.8) / Math.max(Math.abs(lx), 1e-3), (v.spec.hl + 0.8) / Math.max(Math.abs(lz), 1e-3));
      v.ai = { mode: 'stopout', t: 0, vmax, wait: 0.6 + w.rng() * 0.8, then: { mode: 'inspect', car: v, lx: lx * k, lz: lz * k, t: 0, T: 4 + w.rng() * 4, vmax } };
    } else if (kind === 'fight') v.ai = { mode: 'stopout', t: 0, vmax, wait: 0.2, then: { mode: 'attack', target: pl, t: 0, rage: 25 } };
    else if (kind === 'ram') { v.ai = { mode: 'ram', t: 0, T: 18 + w.rng() * 14, vmax, rams: 0 }; v.horn = 0.9; w.emit({ t: 'horn', v }); }
    else v.ai = { mode: 'rejoin', ambient: true, vmax, panic: 10 + w.rng() * 8, from: { x: pl.x, z: pl.z } };
    if (d && w.rng() < 0.75) w.emit({ t: 'say', p: d, text: w.rng.pick(CRASH_LINES[kind]) });
  };

  AI.afterCarjack = (w, d, thief, v) => {
    if (w.rng() < 0.2 + d.tough * 0.5) {
      d.ai = { mode: 'attack', target: thief, t: 0, rage: 15, owner: v };
      w.emit({ t: 'say', p: d, text: w.rng.pick(['Э! Это моя тачка!', 'Стой, гад!', 'Куда?! Я её три года копил!']) });
    } else {
      AI.flee(d, thief.x, thief.z, 10);
      w.emit({ t: 'say', p: d, text: w.rng.pick(['Милиция!', 'Грабят!', 'Помогите!', 'Да забирай, только не бей!']) });
    }
  };

  AI.flee = (p, x, z, t) => {
    const prev = p.ai && p.ai.mode === 'flee' ? p.ai.prev : p.ai;
    p.ai = { mode: 'flee', fx: x, fz: z, t, prev: prev && prev.mode !== 'flee' ? prev : null };
  };

  AI.dodge = (p, v) => {
    if (p.ai && (p.ai.mode === 'dodge' || p.ai.mode === 'attack' || p.ai.mode === 'jack')) return;
    const sp = Math.hypot(v.vx, v.vz);
    const fx = sp > 1 ? v.vx / sp : Math.sin(v.yaw), fz = sp > 1 ? v.vz / sp : -Math.cos(v.yaw);
    const side = ((p.x - v.x) * -fz + (p.z - v.z) * fx) >= 0 ? 1 : -1;
    AI.dodgeTo(p, -fz * side, fx * side, 0.8);
  };

  AI.dodgeTo = (p, dx, dz, t) => {
    const prev = p.ai && p.ai.mode === 'dodge' ? p.ai.prev : p.ai;
    p.ai = { mode: 'dodge', dx, dz, t, prev };
  };

  const DODGE_LINES = ['Ты что, слепой?!', 'Куда прёшь?!', 'Тормози, псих!', 'Смотри куда едешь!', 'Совсем сдурел?!'];

  AI.watchCars = (w, p, dt) => {
    p.carT = (p.carT || 0) - dt;
    if (p.carT > 0) return;
    p.carT = 0.1;
    let th = null, bt = 1.3;
    w.near(p.x, p.z, 30, e => {
      if (e.kind !== 'veh' || e.dead || e.ai && e.ai.mode === 'lane' || e.vx * e.vx + e.vz * e.vz < 16) return;
      const ux = e.vx - p.vx, uz = e.vz - p.vz, u2 = ux * ux + uz * uz;
      if (u2 < 9) return;
      const rx = p.x - e.x, rz = p.z - e.z, t = (rx * ux + rz * uz) / u2;
      if (t <= 0 || t > bt) return;
      const mx = rx - ux * t, mz = rz - uz * t;
      if (Math.hypot(mx, mz) > e.spec.hw + 1.0) return;
      bt = t;
      th = { e, t, mx, mz, u: Math.sqrt(u2) };
    });
    if (!th) { p.threat = 0; return; }
    const e = th.e;
    if (p.threat === e.id) return;
    p.threat = e.id;
    const fx = (e.vx - p.vx) / th.u, fz = (e.vz - p.vz) / th.u;
    const sees = -Math.sin(p.yaw) * fx + Math.cos(p.yaw) * fz > -0.2;
    const tf = th.t - e.spec.hl / th.u;
    if (w.rng() > (sees ? 0.8 : 0.5) - (tf < 0.35 ? 0.3 : 0)) {
      p.anim.flinch = 0.35;
      if (!p.cop && !p.gang) { p.wantVx = p.wantVz = 0; p.holdT = 0.45; }
      return;
    }
    let sx = -fz, sz = fx;
    if (th.mx * sx + th.mz * sz < 0) { sx = -sx; sz = -sz; }
    if (!w.pedSpotFree(p.x + sx * 1.8, p.z + sz * 1.8) && w.pedSpotFree(p.x - sx * 1.8, p.z - sz * 1.8)) { sx = -sx; sz = -sz; }
    if (tf < 0.6) {
      p.yaw = N.yawOf(sx, sz);
      w.knockDown(p, 0.8, sx * 5.4 + p.vx * 0.3, sz * 5.4 + p.vz * 0.3, 2.3);
    } else AI.dodgeTo(p, sx, sz, 0.75);
    if (w.rng() < 0.35 && Math.hypot(p.x - w.player.x, p.z - w.player.z) < 20 && e.driver && e.driver.isPlayer) w.emit({ t: 'say', p, text: w.rng.pick(DODGE_LINES) });
  };

  const PANIC_LINES = ['Стреляют!', 'Ложись!', 'Мама!', 'Убивают!'];

  AI.calm = d => !d.isPlayer && !d.cop && !d.gang && !(d.ai && d.ai.mission) && !d.friendly;

  AI.hearShot = (w, x, z, r, by) => {
    w.near(x, z, r, e => {
      if (e.kind !== 'veh' || e.dead || !e.ai || e.persistent || e.siren || e.copUnit) return;
      if (e.ai.panic > 0 || e.ai.mode === 'flee' || e.ai.mode === 'route' || e.ai.mode === 'chase' || e.ai.mode === 'pursue' || e.ai.mode === 'unload' || e.ai.mode === 'armor') return;
      if (!e.driver || !AI.calm(e.driver)) return;
      if (N.dist2(e.x, e.z, x, z) > r * r) return;
      AI.panic(w, e, by, false);
    });
  };

  AI.carShot = (w, v, by) => {
    const d = v.driver;
    if (!d || d.isPlayer || d.dead || v.dead) return;
    if (d.gang && by && !(d.ai && d.ai.mission)) {
      for (const q of [d].concat(v.pass)) {
        if (q.isPlayer || q.dead) continue;
        w.exitVehicle(q);
        q.ai = { mode: 'attack', target: by, t: 0 };
      }
      v.ai = null;
      return;
    }
    if (!AI.calm(d) || v.persistent || !v.ai || v.ai.mode === 'route' || v.ai.mode === 'chase') return;
    AI.panic(w, v, by, true);
  };

  AI.bailOut = (w, v, from) => {
    const d0 = v.driver;
    for (const q of [v.driver].concat(v.pass)) {
      if (!q || q.isPlayer || q.dead || !AI.calm(q)) continue;
      w.npcExit(q, { mode: 'flee', fx: from.x, fz: from.z, t: w.rng.range(8, 14), prev: null });
    }
    v.ai = null;
    v.ctl.thr = 0; v.ctl.steer = 0; v.ctl.hand = true;
    if (d0 && Math.hypot(v.x - w.player.x, v.z - w.player.z) < 25 && w.rng() < 0.5) w.emit({ t: 'say', p: d0, text: w.rng.pick(PANIC_LINES) });
  };

  AI.panic = (w, v, by, hit) => {
    const from = { x: by ? by.x : v.x, z: by ? by.z : v.z };
    const slow = Math.abs(v.spd) < 2.5;
    const blocked = slow && !!scanAhead(w, v, 9, v.yaw);
    if (blocked || slow && w.rng() < 0.5 || (hit && w.rng() < 0.3 || w.rng() < 0.1) && Math.abs(v.spd) < 6) { AI.bailOut(w, v, from); return; }
    const T = 14 + w.rng() * 8;
    if (v.ai.mode === 'lane') Object.assign(v.ai, { panic: T, planT: 0, from });
    else v.ai = { mode: 'rejoin', ambient: true, vmax: v.ai.vmax, panic: T, from };
    v.horn = 0.8;
    w.emit({ t: 'horn', v });
  };

  AI.onHurt = (w, p, by, kind) => {
    if (p.ai && p.ai.mission) {
      if (p.ai.mode === 'guard' || p.ai.mode === 'idle' || p.ai.mode === 'goto') { if (by && !p.friendly) p.ai = Object.assign(p.ai, { mode: 'attack', target: by }); }
      return;
    }
    if (p.cop) {
      if (by && by.isPlayer) p.ai = { mode: 'cop' };
      return;
    }
    if (p.gang) {
      if (by) p.ai = { mode: 'attack', target: by, t: 0 };
      if (by && by.isPlayer) AI.gangAlert(w, p, by);
      return;
    }
    if (!by) return;
    if ((kind === 'melee' || kind === 'stab') && w.rng() < p.tough) p.ai = { mode: 'attack', target: by, t: 0, rage: 12 };
    else AI.flee(p, by.x, by.z, 12);
  };

  AI.gangAlert = (w, p, by) => {
    w.near(p.x, p.z, 30, e => {
      if (e.kind === 'ped' && e.gang && !e.dead && e.type === p.type && e !== p && (!e.ai || e.ai.mode !== 'attack')) e.ai = { mode: 'attack', target: by, t: 0 };
    });
  };

  AI.standDown = w => {
    for (const p of w.peds) if (p.cop && p.ai && (p.ai.mode === 'cop') && !(p.ai.mission)) p.ai = { mode: 'leave', t: 0 };
    for (const v of w.vehs) if (v.ai && v.ai.mode === 'pursue') { v.siren = false; v.ai = { mode: 'rejoin', ambient: true, t: 0 }; }
    for (const rb of w.roadblocks) rb.expire = true;
    if (w.heli) w.heli.leave = true;
  };

  AI.copsOut = (w, v) => {
    const occupants = [v.driver].concat(v.pass).filter(Boolean);
    for (const q of occupants) {
      w.exitVehicle(q);
      q.ai = { mode: 'cop', car: v };
    }
    v.ai = null;
    v.ctl.thr = 0; v.ctl.hand = true;
    v.copCar = true;
  };

  AI.moveTo = (p, tx, tz, speed, dt) => {
    let dx = tx - p.x, dz = tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.05) { p.wantVx = p.wantVz = 0; return d; }
    dx /= d; dz /= d;
    if (p.blocked > 0) {
      p.blocked -= dt;
      if (!p.side) p.side = Math.random() < 0.5 ? 1 : -1;
      const a = 1.25 * p.side;
      const c = Math.cos(a), s = Math.sin(a);
      const nx = dx * c - dz * s, nz = dx * s + dz * c;
      dx = nx; dz = nz;
    } else p.side = 0;
    const sp = Math.min(speed, d * 3);
    p.wantVx = dx * sp;
    p.wantVz = dz * sp;
    p.yaw = N.turnTo(p.yaw, N.yawOf(dx, dz), dt * 9);
    return d;
  };

  const segHitsBox = (ax, az, bx, bz, hx, hz) => {
    let t0 = 0, t1 = 1;
    const dx = bx - ax, dz = bz - az;
    for (const [p, q] of [[-dx, ax + hx], [dx, hx - ax], [-dz, az + hz], [dz, hz - az]]) {
      if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
    return true;
  };

  AI.toCarSpot = (w, p, v, tx, tz, speed, dt) => {
    const c = Math.cos(v.yaw), sn = Math.sin(v.yaw);
    const rx = p.x - v.x, rz = p.z - v.z, lx = rx * c + rz * sn, lz = -rx * sn + rz * c;
    const hw = v.spec.hw, hl = v.spec.hl;
    const bx = hw + 0.15, bz = hl + 0.15;
    const R = p.carRoute || (p.carRoute = { t: 0, ban: 0, banT: 0 });
    R.banT -= dt;
    if (R.banT <= 0) R.ban = 0;
    if (segHitsBox(lx, lz, tx, tz, bx, bz)) {
      const P = [[lx, lz], [hw + 0.75, hl + 0.75], [-hw - 0.75, hl + 0.75], [-hw - 0.75, -hl - 0.75], [hw + 0.75, -hl - 0.75], [tx, tz]];
      const dist = [0, Infinity, Infinity, Infinity, Infinity, Infinity], prev = [-1, -1, -1, -1, -1, -1], done = [];
      for (let i = 1; i < 5; i++) {
        const q = w.carLocal(v, P[i][0], P[i][1]);
        if (R.ban === i || !w.pedSpotFree(q.x, q.z) || w.near(q.x, q.z, 6, e => e.kind === 'veh' && e !== v && !!N.circleObb(q.x, q.z, 0.45, Phys.obbOf(e)))) done[i] = true;
      }
      for (;;) {
        let u = -1;
        for (let i = 0; i < 6; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
        if (u < 0 || u === 5) break;
        done[u] = true;
        for (let k = 1; k < 6; k++) {
          if (done[k] || segHitsBox(P[u][0], P[u][1], P[k][0], P[k][1], bx, bz)) continue;
          const d = dist[u] + Math.hypot(P[k][0] - P[u][0], P[k][1] - P[u][1]);
          if (d < dist[k]) { dist[k] = d; prev[k] = u; }
        }
      }
      let k = 5;
      while (prev[k] > 0) k = prev[k];
      if (prev[5] >= 0 && k !== 5) {
        let n = k;
        if (Math.hypot(P[n][0] - lx, P[n][1] - lz) < 0.35) { let m = 5; while (prev[m] !== n && prev[m] >= 0) m = prev[m]; n = m; }
        const q = w.carLocal(v, P[n][0], P[n][1]);
        AI.moveTo(p, q.x, q.z, speed, dt);
        R.t = Math.hypot(p.vx, p.vz) < 0.3 ? R.t + dt : 0;
        if (R.t > 1 && n !== 5) { R.ban = n; R.banT = 5; R.t = 0; }
        if (n !== 5) return Infinity;
        return Math.hypot(q.x - p.x, q.z - p.z);
      }
      if (prev[5] < 0) {
        const q = Math.abs(lx) < bx ? w.carLocal(v, (lx >= 0 ? 1 : -1) * (hw + 0.9), lz) : w.carLocal(v, lx, (lz >= 0 ? 1 : -1) * (hl + 0.9));
        AI.moveTo(p, q.x, q.z, speed, dt);
        return Infinity;
      }
    }
    const q = w.carLocal(v, tx, tz);
    return AI.moveTo(p, q.x, q.z, speed, dt);
  };

  AI.toDoor = (w, p, v, side, speed, dt) => {
    const dp = w.doorPos(v, side), c = Math.cos(v.yaw), sn = Math.sin(v.yaw), rx = dp.x - v.x, rz = dp.z - v.z;
    return AI.toCarSpot(w, p, v, rx * c + rz * sn, -rx * sn + rz * c, speed, dt);
  };

  AI.face = (p, x, z, dt) => { p.yaw = N.turnTo(p.yaw, N.yawOf(x - p.x, z - p.z), dt * 10); };

  AI.shootAt = (w, p, tgt, dt, acc) => {
    if (w.truce && tgt && tgt.isPlayer) return false;
    const wid = p.weapon;
    const wpn = N.WEAPONS[wid];
    if (!wpn || wpn.melee || wpn.throw) return false;
    if (p.fireT > 0 || p.reloadT > 0) return true;
    const tx = tgt.veh ? tgt.veh.x : tgt.x, tz = tgt.veh ? tgt.veh.z : tgt.z, ty = tgt.veh ? tgt.veh.y + 0.9 : tgt.y + 1.25;
    const m = w.muzzle(p);
    const dist = Math.hypot(tx - m.x, tz - m.z);
    if (dist > wpn.range * 0.8) return false;
    if (!w.los(m.x, m.y, m.z, tx, ty, tz)) return false;
    let dx = tx - m.x, dy = ty - m.y, dz = tz - m.z;
    const L = Math.hypot(dx, dy, dz);
    dx /= L; dy /= L; dz /= L;
    const miss = (acc === undefined ? 0.5 : acc);
    const spread = wpn.spread + (1 - miss) * 0.06 + Math.min(0.05, dist * 0.0012) + (tgt.veh ? Math.abs(tgt.veh.spd) * 0.002 : 0);
    p.aimPitch = Math.asin(N.clamp(dy, -1, 1));
    w.fire(p, wid, m.x, m.y, m.z, dx, dy, dz, spread);
    p.fireT = wpn.rate * (wpn.auto ? 1.3 : 1.6) + w.rng() * 0.4;
    p.anim.action = 'shoot';
    p.anim.actionT = 0.15;
    p.anim.aim = 1;
    p.burst = (p.burst || 0) + 1;
    if (p.burst > (wpn.auto ? 6 : 5)) { p.burst = 0; p.fireT = wpn.reload || 1.2; p.reloadT = wpn.reload || 0; }
    return true;
  };

  AI.pmodes = {
    idle(w, p, dt) {
      p.wantVx = p.wantVz = 0;
      p.anim.aim = N.approach(p.anim.aim, 0, dt * 4);
      if (p.ai.face) AI.face(p, p.ai.face.x, p.ai.face.z, dt);
      if (p.ai.dance) p.anim.dance = 1;
    },

    area(w, p, dt) {
      const ai = p.ai;
      const A = ai.rect;
      if (ai.wait > 0) { ai.wait -= dt; p.wantVx = p.wantVz = 0; return; }
      if (ai.tx === undefined) { const q = AI.areaPoint(w, A); ai.tx = q[0]; ai.tz = q[1]; }
      const d = AI.moveTo(p, ai.tx, ai.tz, 1.2, dt);
      if (d < 0.6 || p.blocked > 0.25) { ai.tx = undefined; ai.wait = w.rng.range(1, 6); }
    },

    flee(w, p, dt) {
      const ai = p.ai;
      ai.t -= dt;
      let dx = p.x - ai.fx, dz = p.z - ai.fz;
      const d = Math.hypot(dx, dz) || 1;
      AI.moveTo(p, p.x + dx / d * 5, p.z + dz / d * 5, 5.6, dt);
      if (ai.t <= 0) p.ai = ai.prev && ai.prev.mode !== 'attack' ? ai.prev : { mode: 'walk', edge: -1 };
    },

    dodge(w, p, dt) {
      const ai = p.ai;
      ai.t -= dt;
      p.wantVx = ai.dx * 5.5;
      p.wantVz = ai.dz * 5.5;
      p.yaw = N.turnTo(p.yaw, N.yawOf(ai.dx, ai.dz), dt * 12);
      if (ai.t <= 0) p.ai = ai.prev || { mode: 'walk', edge: -1 };
    },

    goto(w, p, dt) {
      const ai = p.ai;
      const d = AI.moveTo(p, ai.x, ai.z, ai.spd || (ai.run ? 4.6 : 1.5), dt);
      if (d < (ai.r || 0.8)) { ai.arrived = true; p.wantVx = p.wantVz = 0; if (ai.then) p.ai = Object.assign({ mission: ai.mission, invuln: ai.invuln }, ai.then); }
      AI.watch(w, p);
    },

    follow(w, p, dt) {
      const ai = p.ai;
      const t = ai.target;
      if (!t || t.dead) { p.ai = { mode: 'idle', mission: ai.mission }; return; }
      if (t.veh && !p.veh) {
        const v = t.veh;
        const dp = w.doorPos(v, 1);
        const d = AI.moveTo(p, dp.x, dp.z, 5, dt);
        if ((d < 1.6 || Math.hypot(p.x - v.x, p.z - v.z) < v.spec.hl + 0.9) && v.pass.length < 3 && Math.abs(v.spd) < 3) { w.seat(p, v, false); w.emit({ t: 'board', p, v }); }
        return;
      }
      const dx = t.x - p.x, dz = t.z - p.z;
      const d = Math.hypot(dx, dz);
      if (d > (ai.dist || 2.5)) AI.moveTo(p, t.x - dx / d * 1.6, t.z - dz / d * 1.6, d > 8 ? 5.5 : 3.8, dt);
      else { p.wantVx = p.wantVz = 0; AI.face(p, t.x, t.z, dt); }
      if (ai.fight) AI.helpFight(w, p, dt);
    },

    guard(w, p, dt) {
      const ai = p.ai;
      if (ai.x !== undefined && Math.hypot(ai.x - p.x, ai.z - p.z) > 1.5) AI.moveTo(p, ai.x, ai.z, 1.4, dt); else p.wantVx = p.wantVz = 0;
      if (ai.face) AI.face(p, ai.face.x, ai.face.z, dt);
      if (ai.dance) p.anim.dance = 1;
      AI.watch(w, p);
    },

    attack(w, p, dt) {
      const ai = p.ai;
      const tgt = ai.target || w.player;
      ai.t = (ai.t || 0) + dt;
      p.anim.dance = 0;
      if (w.truce && tgt && tgt.isPlayer) { p.wantVx = p.wantVz = 0; return; }
      if (!tgt || tgt.dead || tgt.removed) { p.ai = ai.mission ? { mode: 'guard', mission: ai.mission, x: p.x, z: p.z } : { mode: 'walk', edge: -1 }; return; }
      if (ai.rage !== undefined && ai.t > ai.rage && !ai.mission) { p.ai = { mode: 'walk', edge: -1 }; return; }
      const tx = tgt.veh ? tgt.veh.x : tgt.x, tz = tgt.veh ? tgt.veh.z : tgt.z;
      const d = Math.hypot(tx - p.x, tz - p.z);
      const wpn = N.WEAPONS[p.weapon] || N.WEAPONS.fists;
      if (wpn.melee) {
        if (tgt.veh && Math.abs(tgt.veh.spd) > 2) { AI.moveTo(p, tx, tz, 5, dt); return; }
        if (tgt.veh && tgt.isPlayer && !tgt.veh.spec.shape.hatch) {
          const v = tgt.veh;
          if (AI.toDoor(w, p, v, w.jackSide(v), 5.2, dt) < 1.2) {
            const back = Object.assign({}, ai);
            w.npcJack(p, v, ai.owner === v ? { mode: 'enter', car: v, drive: { mode: 'rejoin', ambient: true }, run: false } : back);
          }
          return;
        }
        if (d > wpn.range * 0.85) AI.moveTo(p, tx, tz, ai.walkIn ? 1.6 : 5.2, dt);
        else {
          p.wantVx = p.wantVz = 0;
          AI.face(p, tx, tz, dt);
          if (p.fireT <= 0 && !tgt.veh) { w.melee(p, wpn); p.fireT = wpn.rate * 2.2 + w.rng() * 0.4; }
        }
        return;
      }
      const pref = ai.range || wpn.aiRange || 14;
      AI.face(p, tx, tz, dt);
      if (d > pref + 4 || !ai.seeT) {
        AI.moveTo(p, tx, tz, ai.hold ? 0 : 4.4, dt);
        p.yaw = N.turnTo(p.yaw, N.yawOf(tx - p.x, tz - p.z), dt * 10);
      } else if (d < pref * 0.4) {
        AI.moveTo(p, p.x - (tx - p.x), p.z - (tz - p.z), 2.4, dt);
        p.yaw = N.turnTo(p.yaw, N.yawOf(tx - p.x, tz - p.z), dt * 10);
      } else {
        ai.strafe = ai.strafe || (w.rng() < 0.5 ? 1 : -1);
        if (w.rng() < dt * 0.5) ai.strafe = -ai.strafe;
        const sx = -(tz - p.z) / d * ai.strafe, sz = (tx - p.x) / d * ai.strafe;
        p.wantVx = ai.hold ? 0 : sx * 1.4;
        p.wantVz = ai.hold ? 0 : sz * 1.4;
      }
      ai.seeT = (ai.seeT || 0) - dt;
      if (AI.shootAt(w, p, tgt, dt, ai.acc)) ai.seeT = 1.5;
    },

    cop(w, p, dt) {
      const ai = p.ai;
      const pl = w.player;
      if (w.truce) { p.wantVx = p.wantVz = 0; return; }
      if (w.wanted.level <= 0 && !ai.mission) { p.ai = { mode: 'leave', t: 0 }; return; }
      if (pl.dead) { p.wantVx = p.wantVz = 0; return; }
      const tx = pl.veh ? pl.veh.x : pl.x, tz = pl.veh ? pl.veh.z : pl.z;
      const d = Math.hypot(tx - p.x, tz - p.z);
      const lethal = w.wanted.level >= 3 || (ai.hostile && w.wanted.level >= 2);
      if (lethal && p.weapon && !N.WEAPONS[p.weapon].melee) {
        if (ai.post && !ai.posted) { if (AI.moveTo(p, ai.post[0], ai.post[1], 4.8, dt) < 0.8) ai.posted = true; }
        else if (d > 22) AI.moveTo(p, tx, tz, 4.6, dt);
        else if (d < 5) AI.moveTo(p, p.x - (tx - p.x), p.z - (tz - p.z), 2, dt);
        else { p.wantVx = p.wantVz = 0; }
        AI.face(p, tx, tz, dt);
        AI.shootAt(w, p, pl, dt, 0.45 + w.wanted.level * 0.05);
        if (ai.car && !ai.car.dead && d > 70) { p.ai = { mode: 'board', car: ai.car }; }
        return;
      }
      if (pl.veh && pl.veh.spec.shape.hatch) {
        if (d < 12) AI.moveTo(p, p.x - (tx - p.x), p.z - (tz - p.z), 4.6, dt);
        else if (d > 30) AI.moveTo(p, tx, tz, 4.6, dt);
        else p.wantVx = p.wantVz = 0;
        AI.face(p, tx, tz, dt);
        if (p.weapon && !N.WEAPONS[p.weapon].melee) AI.shootAt(w, p, pl, dt, 0.4);
        ai.arrest = 0;
        return;
      }
      if (pl.veh) {
        const v = pl.veh;
        const dd = AI.toDoor(w, p, v, w.jackSide(v), 5.2, dt);
        if (dd < 1.2 && Math.abs(v.spd) < 1.5 && !w.busted) {
          if (w.npcJack(p, v, { mode: 'cop', car: ai.car, hostile: ai.hostile })) return;
          ai.arrest = v.driver !== pl ? (ai.arrest || 0) + dt : 0;
          if (ai.arrest > 1.4) { w.busted = true; w.emit({ t: 'busted' }); }
        } else ai.arrest = 0;
        if (ai.car && !ai.car.dead && d > 45) p.ai = { mode: 'board', car: ai.car };
        return;
      }
      if (d > 1.3) { AI.moveTo(p, tx, tz, 5.4, dt); ai.arrest = Math.max(0, (ai.arrest || 0) - dt); }
      else {
        p.wantVx = p.wantVz = 0;
        AI.face(p, tx, tz, dt);
        const psp = Math.hypot(pl.vx, pl.vz);
        if (psp < 2.6 && pl.state !== 'down') ai.arrest = (ai.arrest || 0) + dt;
        if (ai.arrest > 1.1 && !w.busted) { w.busted = true; w.emit({ t: 'busted' }); }
        if (p.fireT <= 0 && w.wanted.level >= 2) { w.melee(p, N.WEAPONS.fists); p.fireT = 1.2; }
      }
      p.anim.aim = N.approach(p.anim.aim, d < 10 ? 1 : 0, dt * 4);
    },

    inspect(w, p, dt) {
      const ai = p.ai, v = ai.car;
      ai.t += dt;
      if (!v || v.dead || v.removed) { p.ai = { mode: 'walk', edge: -1 }; return; }
      if (v.driver) { p.ai = v.driver.isPlayer ? { mode: 'attack', target: v.driver, t: 0, rage: 15, owner: v } : { mode: 'walk', edge: -1 }; return; }
      if (ai.t > ai.T + 15) { p.ai = { mode: 'walk', edge: -1 }; return; }
      if (ai.t > ai.T) {
        if (AI.toDoor(w, p, v, w.jackSide(v), 1.6, dt) < 0.6) {
          w.seat(p, v, true);
          v.ai = { mode: 'rejoin', ambient: true, vmax: ai.vmax };
          p.ai = { mode: 'idle' };
        }
        return;
      }
      if (AI.toCarSpot(w, p, v, ai.lx, ai.lz, 1.5, dt) < 0.45) {
        p.wantVx = p.wantVz = 0;
        AI.face(p, v.x, v.z, dt);
        p.anim.aim = 0;
      }
    },

    jack(w, p, dt) {
      if (!p.enter) { p.ai = p.ai.after || { mode: 'walk', edge: -1 }; return; }
      w.stepNpcJack(p, dt);
    },

    board(w, p, dt) {
      const v = p.ai.car;
      if (!v || v.dead || v.removed) { p.ai = { mode: 'cop' }; return; }
      const dp = w.doorPos(v, v.driver ? 1 : -1);
      const d = AI.moveTo(p, dp.x, dp.z, 5, dt);
      if (d < 1.4 || Math.hypot(p.x - v.x, p.z - v.z) < v.spec.hl + 0.8) {
        w.seat(p, v, !v.driver);
        if (v.driver === p) v.ai = { mode: 'pursue', target: w.player };
      }
    },

    leave(w, p, dt) {
      p.ai.t += dt;
      if (!p.ai.edge) p.ai = { mode: 'walk', edge: -1, leaving: true };
    },

    enter(w, p, dt) {
      const ai = p.ai;
      const v = ai.car;
      if (!v || v.dead || v.removed) { p.ai = { mode: 'flee', fx: p.x, fz: p.z, t: 5, prev: null }; return; }
      const side = v.driver && v.driver !== p ? 1 : -1;
      const dp = w.doorPos(v, side);
      const d = AI.moveTo(p, dp.x, dp.z, ai.run === false ? 1.6 : 5.2, dt);
      if (d < 1.5 || Math.hypot(p.x - v.x, p.z - v.z) < v.spec.hl + 0.8) {
        if (v.driver && v.driver.isPlayer) { p.ai = { mode: 'attack', target: w.player, mission: ai.mission }; return; }
        w.seat(p, v, !v.driver);
        if (v.driver === p && ai.drive) v.ai = Object.assign({}, ai.drive);
        p.ai = { mode: 'idle', mission: ai.mission };
      }
    }
  };

  AI.areaPoint = (w, A) => {
    let x = N.lerp(A.x0, A.x1, w.rng()), z = N.lerp(A.z0, A.z1, w.rng());
    for (let k = 0; k < 8 && (A.poly && !N.pointInPoly(A.poly, x, z) || !w.pedSpotFree(x, z)); k++) { x = N.lerp(A.x0, A.x1, w.rng()); z = N.lerp(A.z0, A.z1, w.rng()); }
    return [x, z];
  };

  AI.watch = (w, p) => {
    const ai = p.ai;
    if (!ai.aggro || p.friendly || w.truce) return;
    const pl = w.player;
    if (pl.dead) return;
    const d = Math.hypot(pl.x - p.x, pl.z - p.z);
    if (d > ai.aggro) return;
    ai.lookT = (ai.lookT || 0) - 1 / 60;
    if (ai.lookT > 0) return;
    ai.lookT = 0.4;
    if (d < ai.aggro * 0.35 || w.los(p.x, p.y + 1.6, p.z, pl.x, pl.y + 1.4, pl.z)) {
      p.ai = Object.assign({}, ai, { mode: 'attack', target: pl, t: 0 });
      if (ai.group) for (const q of w.peds) if (q !== p && q.ai && q.ai.group === ai.group && q.ai.mode !== 'attack' && !q.dead) q.ai = Object.assign({}, q.ai, { mode: 'attack', target: pl, t: 0 });
      w.emit({ t: 'alert', p });
    }
  };

  AI.helpFight = (w, p, dt) => {
    let tgt = null, bd = 30 * 30;
    w.near(p.x, p.z, 30, e => {
      if (e.kind !== 'ped' || e.dead || e.friendly || e.isPlayer) return;
      if (!(e.ai && e.ai.mode === 'attack')) return;
      const d = N.dist2(e.x, e.z, p.x, p.z);
      if (d < bd) { bd = d; tgt = e; }
    });
    if (tgt) {
      p.wantVx *= 0.3; p.wantVz *= 0.3;
      AI.face(p, tgt.x, tgt.z, dt);
      AI.shootAt(w, p, tgt, dt, 0.6);
    }
  };

  AI.vehStats = w => {
    let amb = 0, parked = 0, cops = 0;
    for (const v of w.vehs) {
      if (v.ai && v.ai.ambient) amb++;
      if (v.parkedSpot >= 0) parked++;
      if (v.copCar || (v.driver && v.driver.cop)) cops++;
    }
    return { amb, parked, cops };
  };

  AI.trafficModel = (w, x, z) => {
    const mix = N.TRAFFIC_MIX[w.city.district(x, z)];
    return w.rng.weighted(mix);
  };

  AI.visible = (w, x, z) => {
    const c = w.cam;
    const dx = x - c.x, dz = z - c.z;
    const d = Math.hypot(dx, dz);
    if (d < 25) return true;
    const dot = (dx * Math.sin(c.yaw) - dz * Math.cos(c.yaw)) / d;
    return dot > 0.45;
  };

  AI.populate = w => {
    const pl = w.player;
    const px = pl.x, pz = pl.z;
    const city = w.city;
    const night = w.darkness();
    const st = AI.vehStats(w);
    for (let i = w.vehs.length - 1; i >= 0; i--) {
      const v = w.vehs[i];
      if (v.persistent || v === pl.veh || (v.driver && v.driver.isPlayer) || v.pass.some(q => q.isPlayer)) continue;
      const d = Math.hypot(v.x - px, v.z - pz);
      if (v.parkedSpot >= 0 && !v.used) { if (d > 170) w.removeVehicle(v); continue; }
      const far = v.dead ? (d > 90 && !AI.visible(w, v.x, v.z)) || v.wreckT > 120 : d > 280 || (d > 205 && !AI.visible(w, v.x, v.z));
      if (far) w.removeVehicle(v);
    }
    for (let i = w.peds.length - 1; i >= 0; i--) {
      const p = w.peds[i];
      if (p.isPlayer || p.persistent || p.veh) continue;
      const d = Math.hypot(p.x - px, p.z - pz);
      if (d > 140 || (p.dead && ((d > 50 && !AI.visible(w, p.x, p.z)) || p.deadT > 90)) || (d > 90 && !AI.visible(w, p.x, p.z) && p.ai && p.ai.leaving)) w.removePed(p);
    }
    const density = (1 - night * 0.55) * w.settings.traffic;
    const target = Math.round(22 * density);
    if (st.amb < target) {
      const cand = [];
      city.laneHash.query(px - 185, pz - 185, px + 185, pz + 185, it => { if (it.lane.ambient) cand.push(it.lane); });
      for (let k = 0; k < 8 && cand.length; k++) {
        const lane = cand[Math.floor(w.rng() * cand.length)];
        const s = w.rng() * lane.len;
        const { x, z } = city.lanePoint(lane, s);
        const d = Math.hypot(x - px, z - pz);
        if (d < 85 || d > 185) continue;
        if (AI.visible(w, x, z) && d < 150) continue;
        let clear = true;
        w.near(x, z, 12, e => { if (e.kind === 'veh' && N.dist2(e.x, e.z, x, z) < 120) { clear = false; return true; } });
        if (!clear) continue;
        AI.spawnTraffic(w, lane, s);
        break;
      }
    }
    let nPark = st.parked;
    if (nPark < 46) {
      const R = 105;
      city.parkHash.query(px - R, pz - R, px + R, pz + R, sp => {
        if (nPark >= 46) return true;
        if (w.parkedSpawned.has(sp.id)) return;
        const d = Math.hypot(sp.x - px, sp.z - pz);
        if (d > R) return;
        if (d < 45 && w.t > 2 && AI.visible(w, sp.x, sp.z)) return;
        let clear = true;
        w.near(sp.x, sp.z, 6, e => { if (e.kind === 'veh' && N.dist2(e.x, e.z, sp.x, sp.z) < 16) { clear = false; return true; } });
        if (!clear) { w.parkedSpawned.set(sp.id, null); return; }
        const model = sp.kinds ? w.rng.pick(sp.kinds) : AI.parkedModel(w, sp.x, sp.z);
        if (sp.lot === 'carlot' && w.missionHold && w.missionHold.has('carlot')) return;
        const v = w.spawnVehicle(model, sp.x, sp.z, sp.yaw + (w.rng() < 0.5 && !sp.lot ? Math.PI : 0), { livery: sp.livery, spot: sp.id });
        if (sp.fresh) v.color = w.rng.pick(['#e6e2d6', '#1e3050', '#7e1a22', '#23452c', '#121212', '#56585c', '#c9ae5a']);
        v.parked = true;
        v.ctl.hand = true;
        if (sp.lot === 'ovd') v.copCar = true;
        w.parkedSpawned.set(sp.id, v);
        nPark++;
      });
    }
    AI.crowd(w);
    AI.dispatch(w);
  };

  AI.parkedModel = (w, x, z) => {
    for (let k = 0; k < 6; k++) {
      const m = AI.trafficModel(w, x, z);
      if (m !== 'paz' && m !== 'gaz53') return m;
    }
    return 'vaz2106';
  };

  AI.pedKind = (w, x, z, mix) => {
    const city = w.city;
    const zone = city.zoneAt(x, z);
    if (w.rng() < 0.035) return 'militia';
    if (N.GANG_ZONES.includes(zone) && w.rng() < 0.08) return 'zarechny';
    if (city.district(x, z) === 'avtozavod' && w.rng() < 0.03) return 'bandit';
    const m = mix && N.CIVIL_MIX[mix] ? N.CIVIL_MIX[mix] : N.CIVIL_MIX[city.district(x, z)];
    return w.rng.weighted(m);
  };

  const AMBIENT = {
    volga24: [['taxi', 0.25]], volga3110: [['taxi', 0.25], ['dps', 0.04]], vaz2107: [['militia', 0.08], ['dps', 0.04]], vaz2106: [['militia', 0.04], ['old', 0.015]],
    vaz2101: [['old', 0.03]], vaz2109: [['dps', 0.04]], vaz2110: [['dps', 0.05]], uaz469: [['militia', 0.1], ['old', 0.04]], uaz452: [['ambulance', 0.3]]
  };
  const HEAVY = { gaz53: 1.5, paz: 1.8, ural4320: 1.6 };

  AI.pickUnit = (w, units) => {
    let t = w.rng() * units.reduce((a, u) => a + u.w, 0);
    for (const u of units) { t -= u.w; if (t < 0) return u; }
    return units[units.length - 1];
  };

  AI.spawnTraffic = (w, lane, s, o = {}) => {
    const q = w.city.lanePoint(lane, s);
    const x = q.x, z = q.z;
    let model = o.model || AI.trafficModel(w, x, z);
    let livery = o.livery || null;
    if (!o.model && AMBIENT[model]) {
      let r = w.rng();
      for (const [l, pr] of AMBIENT[model]) { if (r < pr) { livery = l; break; } r -= pr; }
    }
    const cop = !!livery && N.plateClass(livery) === 'militia';
    const v = w.spawnVehicle(model, x, z, N.yawOf(q.dx, q.dz), { livery });
    const kind = cop ? 'militia' : AI.pedKind(w, x, z, null) === 'babushka' ? 'pensioner' : AI.pedKind(w, x, z, null);
    const d = w.spawnPed(kind === 'militia' || cop ? 'militia' : kind === 'girl' || kind === 'chelnok' ? 'woman' : kind, x, z, v.yaw);
    w.seat(d, v, true);
    if (cop) { const q = w.spawnPed('militia', x, z, v.yaw); w.seat(q, v, false); }
    v.ai = { mode: 'lane', lane: lane.id, s, conn: -1, cs: 0, v: lane.speed * 0.7, vmax: lane.speed * (0.78 + w.rng() * 0.32) * (v.spec.vmax < 30 ? 0.8 : 1), next: -1, ambient: true };
    return v;
  };

  AI.dispatch = w => {
    const lvl = w.wanted.level;
    const city = w.city;
    const pl = w.player;
    for (let i = w.roadblocks.length - 1; i >= 0; i--) {
      const rb = w.roadblocks[i];
      if (rb.expire || Math.hypot(rb.x - pl.x, rb.z - pl.z) > 260) {
        for (const v of rb.vehs) if (!v.removed && v.driver === null && !(v === pl.veh)) { v.persistent = false; }
        for (const p of rb.peds) if (!p.removed) p.persistent = false;
        w.roadblocks.splice(i, 1);
      }
    }
    if (lvl <= 0 || !w.settings.cops || w.wanted.noCops) return;
    if (city.inside(pl.x)) { if (w.heli && !w.heli.down) w.heli.leave = true; return; }
    w.dropCool = Math.max(0, (w.dropCool || 0) - 0.25);
    w.dispatchT -= 0.25;
    if (w.dispatchT > 0) return;
    w.dispatchT = 2.5;
    const D = N.DISPATCH[Math.min(lvl, N.DISPATCH.length - 1)];
    let cars = 0;
    for (const v of w.vehs) if (v.ai && (v.ai.mode === 'pursue' || v.ai.mode === 'unload' || v.ai.mode === 'armor')) cars++;
    if (cars < D.max) {
      for (let k = 0; k < 10; k++) {
        const ang = w.rng() * Math.PI * 2, rr = 90 + w.rng() * 70;
        const q = city.nearestLane(pl.x + Math.cos(ang) * rr, pl.z + Math.sin(ang) * rr, 40, l => l.ambient);
        if (!q) continue;
        const x = q.x, z = q.z;
        const d = Math.hypot(x - pl.x, z - pl.z);
        if (d < 80 || d > 170 || (AI.visible(w, x, z) && d < 130)) continue;
        const u = AI.pickUnit(w, D.units);
        if (u.cap && w.vehs.filter(c => c.copUnit && c.model === u.model && !c.dead && !c.removed).length >= u.cap) continue;
        const v = w.spawnVehicle(u.model, x, z, N.yawOf(q.dx, q.dz), { livery: u.livery });
        v.copCar = true;
        v.copUnit = true;
        v.siren = true;
        v.heavy = HEAVY[u.model] || 1.2;
        for (let i = 0; i < u.n; i++) { const c = w.spawnPed(u.crew, x, z, v.yaw); w.seat(c, v, i === 0); }
        v.ai = v.spec.turret ? { mode: 'armor', target: pl } : { mode: 'pursue', target: pl, aggressive: true };
        w.emit({ t: 'dispatch', model: u.model, livery: u.livery, n: u.n });
        break;
      }
    }
    if (D.roadblock && pl.veh && Math.abs(pl.veh.spd) > 12 && w.roadblocks.length < 1 && w.rng() < 0.35) AI.roadblock(w, D.roadblock);
    if (D.heli && w.heli && w.heli.type !== D.heli && !w.heli.down) w.heli.leave = true;
    if (D.heli && !w.heli) w.heli = AI.newHeli(D.heli, pl.x + 150, pl.z + 150, 45);
    if (D.drop && !w.drop && w.dropCool <= 0 && (!pl.veh || Math.abs(pl.veh.spd) < 6)) AI.startDrop(w);
  };

  AI.startDrop = w => {
    const pl = w.player, city = w.city;
    for (let k = 0; k < 8; k++) {
      const ang = w.rng() * Math.PI * 2, rr = 20 + w.rng() * 12;
      const q = city.nearestLane(pl.x + Math.cos(ang) * rr, pl.z + Math.sin(ang) * rr, 12, l => l.ambient);
      if (!q || Math.hypot(q.x - pl.x, q.z - pl.z) < 14) continue;
      const g = city.groundY(q.x, q.z), from = ang + Math.PI * (0.6 + w.rng() * 0.8);
      w.drop = Object.assign(AI.newHeli('mi8', q.x + Math.cos(from) * 220, q.z + Math.sin(from) * 220, g + 70), { tx: q.x, tz: q.z, g, phase: 'in', t: 0, n: 0, crew: 4 });
      w.dropCool = 75;
      w.emit({ t: 'drop', x: q.x, z: q.z });
      return;
    }
  };

  AI.ropePoint = (d, door) => {
    const c = Math.cos(d.yaw), s = Math.sin(d.yaw);
    return { x: d.x + door[0] * c - door[2] * s, z: d.z + door[0] * s + door[2] * c };
  };

  AI.newHeli = (type, x, z, y) => ({ type, x, y, z, yaw: 0, active: true, rot: 0, fireT: 3, leave: false, hp: N.HELIS[type].hp, maxHp: N.HELIS[type].hp, mode: 'orbit', modeT: 6, ang: 0, burstT: 0, rocketT: 0, salvo: 0 });

  AI.heliShooter = h => h.shooter || (h.shooter = { id: -1, isPlayer: false, heli: h, weapon: 'ak', x: h.x, y: h.y, z: h.z, yaw: 0, veh: null, anim: { shot: 9 } });

  AI.heliPoint = (h, q) => {
    const c = Math.cos(h.yaw), s = Math.sin(h.yaw);
    return { x: h.x + q[0] * c - q[2] * s, y: h.y + q[1], z: h.z + q[0] * s + q[2] * c };
  };

  AI.fallHeli = (w, h, slot, dt) => {
    h.vy = (h.vy || 0) - N.G * 0.7 * dt;
    h.y += h.vy * dt;
    h.yaw = N.wrap(h.yaw + dt * 2.6);
    h.roll = Math.min(0.5, (h.roll || 0) + dt * 0.3);
    h.rot += dt * 8;
    h.x += Math.sin(h.yaw) * dt * 6;
    h.z -= Math.cos(h.yaw) * dt * 6;
    const g = w.city.groundY(h.x, h.z);
    if (h.y > g + 1) return;
    w.explode(h.x, g + 1, h.z, 9, 300, h.killer || null, 'heli');
    w.emit({ t: 'helicrash', x: h.x, z: h.z, type: h.type });
    w[slot] = null;
  };

  AI.gunship = (w, h, dt) => {
    const pl = w.player, tv = pl.veh, tx = tv ? tv.x : pl.x, tz = tv ? tv.z : pl.z, ty = tv ? tv.y + 1 : pl.y + 1.1;
    const dx = tx - h.x, dz = tz - h.z, d = Math.hypot(dx, dz) || 1;
    h.modeT -= dt;
    let gx, gz, face;
    if (h.mode === 'run') {
      gx = tx - dx / d * 55; gz = tz - dz / d * 55;
      face = N.yawOf(dx, dz);
      if (h.modeT <= 0) { h.mode = 'orbit'; h.modeT = 7 + w.rng() * 4; }
    } else {
      h.ang += dt * 0.3;
      gx = tx + Math.cos(h.ang) * 90; gz = tz + Math.sin(h.ang) * 90;
      face = N.yawOf(gx - h.x, gz - h.z);
      if (h.modeT <= 0) { h.mode = 'run'; h.modeT = 7; h.salvo = 4; h.burstT = 0; h.rocketT = 1.5; }
    }
    const ex = gx - h.x, ez = gz - h.z, ed = Math.hypot(ex, ez), sp = Math.min(38, ed * 0.6);
    if (ed > 0.1) { h.x += ex / ed * sp * dt; h.z += ez / ed * sp * dt; }
    h.y = N.lerp(h.y, w.city.groundY(h.x, h.z) + (h.mode === 'run' ? 26 : 40), Math.min(1, dt * 0.6));
    h.yaw = N.turnTo(h.yaw, face, dt * 1.4);
    if (h.mode !== 'run' || d > 170 || Math.abs(N.wrap(N.yawOf(dx, dz) - h.yaw)) > 0.25) return;
    h.losT = (h.losT || 0) - dt;
    if (h.losT <= 0) { h.losT = 0.3; h.los = w.los(h.x, h.y - 1.3, h.z, tx, ty, tz); }
    if (!h.los) return;
    const S = AI.heliShooter(h), H = N.HELIS.mi24, G = N.VEH_GUNS[H.gun];
    h.burstT -= dt;
    if (h.burstT < -1.2) h.burstT = 1.0;
    h.fireT -= dt;
    if (h.burstT > 0 && h.fireT <= 0 && d < 150) {
      h.fireT = G.rate;
      const m = AI.heliPoint(h, H.muzzle), L = Math.hypot(tx - m.x, ty - m.y, tz - m.z) || 1;
      w.fire(S, H.gun, m.x, m.y, m.z, (tx - m.x) / L, (ty - m.y) / L, (tz - m.z) / L, G.spread * 1.5);
    }
    h.rocketT -= dt;
    if (h.salvo > 0 && h.rocketT <= 0 && d > 45) {
      h.rocketT = 0.3;
      const m = AI.heliPoint(h, H.pods[h.salvo % H.pods.length]), lead = d / 80;
      const ax = tx + (tv ? tv.vx : pl.vx) * lead + (w.rng() - 0.5) * 5, az = tz + (tv ? tv.vz : pl.vz) * lead + (w.rng() - 0.5) * 5;
      const L = Math.hypot(ax - m.x, ty - m.y, az - m.z) || 1;
      w.fire(S, 'rpg7', m.x, m.y, m.z, (ax - m.x) / L, (ty - m.y) / L, (az - m.z) / L, 0);
      h.salvo--;
    }
  };

  AI.stepDrop = (w, dt) => {
    const d = w.drop;
    if (!d) return;
    if (d.down) { AI.fallHeli(w, d, 'drop', dt); return; }
    d.rot += dt * 24;
    d.t += dt;
    const pl = w.player, H = 20, door = AI.MI8_DOOR;
    if (d.phase === 'in') {
      const r = AI.ropePoint(d, door), dx = d.tx - r.x, dz = d.tz - r.z, dd = Math.hypot(dx, dz);
      const sp = Math.min(34, dd * 0.5 + 1.5);
      if (dd > 0.3) { d.x += dx / dd * sp * dt; d.z += dz / dd * sp * dt; }
      if (dd > 6) d.yaw = N.turnTo(d.yaw, N.yawOf(dx, dz), dt * 1.2);
      d.y = N.lerp(d.y, d.g + H, Math.min(1, dt * 0.7));
      if (dd < 1 && Math.abs(d.y - d.g - H) < 1.2) { d.phase = 'hover'; d.t = 0; }
    } else if (d.phase === 'hover') {
      d.y = N.lerp(d.y, d.g + H, Math.min(1, dt * 2));
      if (d.n < d.crew && d.t > 1 + d.n * 1.7) {
        const r = AI.ropePoint(d, door), g = w.city.groundY(r.x, r.z);
        const p = w.spawnPed('omon', r.x, r.z, d.yaw);
        const tx = pl.veh ? pl.veh.x : pl.x, tz = pl.veh ? pl.veh.z : pl.z, dx = tx - r.x, dz = tz - r.z, dd = Math.hypot(dx, dz) || 1, sd = d.n % 2 ? 1 : -1;
        p.y = d.y + door[1] - 1.1;
        p.onGround = false;
        p.rope = { x: r.x, z: r.z, g, v: 4.2, ai: { mode: 'cop', post: [r.x + dx / dd * 4 - dz / dd * sd * (2 + d.n), r.z + dz / dd * 4 + dx / dd * sd * (2 + d.n)] } };
        p.ai = { mode: 'idle' };
        d.n++;
      }
      if (d.n >= d.crew && d.t > 1 + d.crew * 1.7 + 4.5) d.phase = 'out';
      if (w.wanted.level < 4 && d.n === 0) d.phase = 'out';
    } else {
      d.y += dt * 6;
      d.x += Math.sin(d.yaw) * dt * 32;
      d.z -= Math.cos(d.yaw) * dt * 32;
      if (d.y > d.g + 90) w.drop = null;
    }
  };
  AI.MI8_DOOR = [-1.43, -1.25, -4.95];

  AI.roadblock = (w, kind) => {
    const pl = w.player;
    const v0 = pl.veh;
    const sp = Math.hypot(v0.vx, v0.vz) || 1;
    const ax = pl.x + v0.vx / sp * 110, az = pl.z + v0.vz / sp * 110;
    const nl = w.city.nearestLane(ax, az, 25, l => l.ambient);
    if (!nl) return;
    const e = w.city.edges[nl.lane.edge];
    if (e.len < 40) return;
    const ce = w.city.nearestEdge(nl.x, nl.z, q => q === e, 30);
    if (!ce) return;
    const cx = ce.x, cz = ce.z, rx = -ce.dz, rz = ce.dx;
    if (Math.hypot(cx - pl.x, cz - pl.z) < 60 || AI.visible(w, cx, cz) && Math.hypot(cx - pl.x, cz - pl.z) < 80) return;
    const rb = { x: cx, z: cz, vehs: [], peds: [] };
    const half = e.w / 2;
    const across = N.yawOf(rx, rz);
    const omon = kind === 'omon';
    for (const s of [-1, 1]) {
      const x = cx + rx * s * half * 0.45, z = cz + rz * s * half * 0.45;
      const big = omon && s > 0;
      const model = big ? (w.rng() < 0.5 ? 'avtozak' : 'paz') : w.rng() < 0.5 ? 'vaz2107' : 'uaz469';
      const v = w.spawnVehicle(model, x, z, across + s * 0.2, { livery: big ? 'omon' : 'militia', persistent: true });
      v.copCar = true;
      v.siren = true;
      v.parked = true;
      v.heavy = big ? 3 : 2.2;
      rb.vehs.push(v);
      for (let k = 0; k < (omon ? 2 : 1); k++) {
        const c = w.spawnPed(omon ? 'omon' : 'militia', x + ce.dx * (3 + k * 1.6) + rx * k * 1.2, z + ce.dz * (3 + k * 1.6) + rz * k * 1.2, 0, { persistent: true });
        c.ai = { mode: 'cop', hostile: true };
        rb.peds.push(c);
      }
    }
    w.roadblocks.push(rb);
    w.emit({ t: 'roadblock', x: cx, z: cz });
  };

  AI.stepHeli = (w, dt) => {
    const h = w.heli;
    if (!h) return;
    if (h.down) { AI.fallHeli(w, h, 'heli', dt); return; }
    const pl = w.player;
    h.rot += dt * 30;
    if (h.leave || w.wanted.level < 3) {
      h.y += dt * 6;
      h.x += dt * 25;
      if (h.y > 120) w.heli = null;
      return;
    }
    if (h.type === 'mi24') { AI.gunship(w, h, dt); return; }
    const tx = pl.x - Math.sin(w.t * 0.3) * 18, tz = pl.z + Math.cos(w.t * 0.3) * 18;
    const dx = tx - h.x, dz = tz - h.z;
    const d = Math.hypot(dx, dz);
    const sp = Math.min(32, d * 0.8);
    if (d > 0.1) { h.x += dx / d * sp * dt; h.z += dz / d * sp * dt; }
    h.y = N.lerp(h.y, 32, dt * 0.5);
    h.yaw = N.turnTo(h.yaw, N.yawOf(pl.x - h.x, pl.z - h.z), dt * 1.5);
    h.fireT -= dt;
    if (h.fireT <= 0 && d < 40 && w.wanted.level >= 4) {
      h.fireT = 2.2 + w.rng() * 1.5;
      const burst = AI.heliShooter(h);
      const ty = (pl.veh ? pl.veh.y + 1 : pl.y + 1.2);
      let ddx = pl.x - h.x, ddy = ty - (h.y - 2), ddz = pl.z - h.z;
      const L = Math.hypot(ddx, ddy, ddz);
      w.fire(burst, 'ak', h.x, h.y - 2, h.z, ddx / L, ddy / L, ddz / L, 0.05);
    }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
