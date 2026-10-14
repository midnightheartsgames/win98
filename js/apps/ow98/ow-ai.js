(function (O) {
  'use strict';
  const { clamp, lerp, angDiff } = O;
  const NavF = O.Nav;

  const PREF = {
    mccree: { range: 14, max: 40, retreat: 0.35 },
    soldier: { range: 20, max: 55, retreat: 0.35 },
    tracer: { range: 7, max: 20, retreat: 0.4, flank: true },
    junkrat: { range: 14, max: 26, retreat: 0.35 },
    torbjorn: { range: 12, max: 30, retreat: 0.35 },
    widowmaker: { range: 32, max: 80, retreat: 0.4, sniper: true },
    reinhardt: { range: 3.5, max: 30, retreat: 0.2, tank: true },
    roadhog: { range: 6, max: 18, retreat: 0.28, tank: true },
    winston: { range: 4, max: 20, retreat: 0.25, tank: true },
    lucio: { range: 10, max: 25, retreat: 0.4, support: true },
    mercy: { range: 14, max: 30, retreat: 0.45, support: true },
    zenyatta: { range: 20, max: 45, retreat: 0.4, support: true }
  };
  const H = O.HEROES;
  const PROJ = { junkrat: [H.junkrat.w.speed, H.junkrat.w.grav], torbjorn: [H.torbjorn.w.speed, H.torbjorn.w.grav], lucio: [H.lucio.w.speed, 0], mercy: [H.mercy.blaster.speed, 0], zenyatta: [H.zenyatta.orb.speed, 0] };

  function skillP(h) {
    const s = clamp(h.skill, 0, 2) / 2;
    return {
      react: lerp(0.5, 0.16, s),
      err: lerp(0.075, 0.018, s),
      turn: lerp(4.2, 11, s),
      head: lerp(0.08, 0.45, s),
      lead: lerp(0.45, 0.95, s),
      smart: lerp(0.35, 0.95, s)
    };
  }

  function mkAi(g, h) {
    return {
      thinkT: g.rand() * 0.2, target: null, tSince: 0, seen: {}, goal: null, path: null, pathI: 0, pathNode: -1, repathT: 0,
      strafe: g.rand() < 0.5 ? -1 : 1, strafeT: 0, errX: 0, errY: 0, errT: 0, react: 0, stuckT: 0, lastPos: { x: h.pos.x, z: h.pos.z }, lastCheck: 0,
      jumpT: 0, hold: null, holdT: 0, wait: 0, chatT: 20 + g.rand() * 40, p: skillP(h), mode: 'move', vis: [], abilT: 0, pickT: 0.4 + g.rand() * 3.5,
      yaw: h.yaw, pitch: 0, fav: O.HERO_ORDER[O.hash(h.name) % O.HERO_ORDER.length], wander: null
    };
  }

  function need(g, team) {
    const comp = g.teamComp(team).map(id => O.HEROES[id].role);
    const count = r => comp.filter(x => x === r).length;
    return { tank: count('tank'), support: count('support'), dps: count('offense') + count('defense'), n: comp.length };
  }

  const AI = {
    pick(g, h, force) {
      if (!h.ai) h.ai = mkAi(g, h);
      if (h.human && !force) return;
      if (h.want && O.HEROES[h.want] && O.HEROES[h.want].training) { g.requestHero(h, h.want); return; }
      if (!force && g.phase === 'assemble') {
        h.ai.pickT -= O.TICK;
        if (h.ai.pickT > 0) return;
      }
      const taken = new Set(g.teamComp(h.team));
      const free = O.HERO_ORDER.filter(id => g.rules.noLimits || !taken.has(id));
      if (!free.length) return;
      let choice = null;
      if (h.want && free.includes(h.want)) choice = h.want;
      else {
        const n = need(g, h.team);
        const att = g.roleOf(h.team) === 'att' || g.mode === 'control';
        let role;
        if (n.support < 2 && (n.support === 0 || n.n >= 2)) role = 'support';
        else if (n.tank < 1 || (n.tank < 2 && n.n >= 3)) role = 'tank';
        else role = att ? (g.rand() < 0.65 ? 'offense' : 'defense') : (g.rand() < 0.6 ? 'defense' : 'offense');
        let pool = free.filter(id => O.HEROES[id].role === role);
        if (!pool.length) pool = free.filter(id => (role === 'offense' || role === 'defense') ? ['offense', 'defense'].includes(O.HEROES[id].role) : true);
        if (!pool.length) pool = free;
        if (pool.includes(h.ai.fav) && g.rand() < 0.5) choice = h.ai.fav;
        else choice = O.pick(g.rand, pool);
      }
      g.requestHero(h, choice);
    },

    think(g, h, dt) {
      if (!h.ai) h.ai = mkAi(g, h);
      if (h.drill && h.home) return this.drill(g, h, dt);
      const ai = h.ai;
      if (ai.reset) { ai.reset = false; ai.path = null; ai.goal = null; ai.hold = null; ai.target = null; ai.seen = {}; }
      const inp = O.blankInput();
      ai.thinkT -= dt;
      if (ai.thinkT <= 0) {
        ai.thinkT = 0.12 + g.rand() * 0.08;
        this.perceive(g, h, ai);
        this.plan(g, h, ai);
      }
      this.moveTo(g, h, ai, inp, dt);
      this.aim(g, h, ai, inp, dt);
      const kit = BOT[h.heroId];
      if (kit) kit(g, h, ai, inp, dt);
      this.chatter(g, h, ai, dt);
      this.emote(g, h, ai, inp);
      inp.yaw = ai.yaw; inp.pitch = ai.pitch;
      return inp;
    },

    emote(g, h, ai, inp) {
      const v = h.vis;
      const waiting = (g.phase === 'setup' && g.roleOf(h.team) === 'att') || g.phase === 'assemble';
      const still = !inp.fwd && !inp.side && !inp.fire && !inp.jump && h.onGround && h.inSpawn;
      if (v.pose) {
        if (!waiting || !still || g.t > ai.emoteEnd) v.pose = null;
        return;
      }
      if (!waiting || !still || !O.Clips || !h.heroId || ai.emoteDone === g.phase) return;
      const roll = O.hash(h.name + ':' + Math.floor(g.t * 2)) % 1000;
      if (roll > 40) return;
      ai.emoteDone = g.phase;
      const list = O.Clips.list(h.heroId, 'emote').slice(1);
      if (!list.length || O.hash(h.name + g.phase) % 3 === 0) return;
      const [key, c] = list[O.hash(h.name + ':' + g.t) % list.length];
      v.pose = 'emote:' + key; v.poseT = g.t;
      ai.emoteEnd = g.t + (c.loop ? 5 + (O.hash(h.name) % 5) : c.len);
    },

    drill(g, h, dt) {
      const ai = h.ai, home = h.home, inp = O.blankInput();
      const hy = home.yaw || 0, rx = -Math.cos(hy), rz = Math.sin(hy);
      let wantYaw = hy, wantPitch = 0, dirX = 0, dirZ = 0;
      if (h.drill === 'strafe' || h.drill === 'shoot') {
        ai.side = ai.side || 1;
        const lat = (h.pos.x - home.x) * rx + (h.pos.z - home.z) * rz;
        if (lat > 3.5) ai.side = -1; else if (lat < -3.5) ai.side = 1;
        ai.sideT = (ai.sideT || 0) - dt;
        if (ai.sideT <= 0) { ai.sideT = 1 + g.rand() * 1.6; if (g.rand() < 0.4) ai.side = -ai.side; }
        dirX = rx * ai.side; dirZ = rz * ai.side;
      }
      if (h.drill === 'hurt') {
        ai.hurtT = (ai.hurtT || 0) + dt;
        if (h.hp >= h.maxHp && ai.hurtT > 3.5) { ai.hurtT = 0; h.hp = Math.max(40, h.hp - 110); h.lastHurt = g.t; }
      }
      if (h.drill === 'shoot') {
        const t = g.heroes.filter(o => o.team !== h.team && o.alive && g.targetable(o)).sort((a, b) => Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) - Math.hypot(b.pos.x - h.pos.x, b.pos.z - h.pos.z))[0];
        if (t) {
          const e = g.eye(h), c = g.chest(t);
          const d = Math.hypot(c.x - e.x, c.z - e.z);
          if (d < 34 && g.world.clear(e.x, e.y, e.z, c.x, c.y, c.z)) {
            ai.errT = (ai.errT || 0) - dt;
            if (ai.errT <= 0) { ai.errT = 0.5; ai.errX = (g.rand() - 0.5) * 0.12; ai.errY = (g.rand() - 0.5) * 0.08; }
            wantYaw = Math.atan2(c.x - e.x, c.z - e.z) + (ai.errX || 0);
            wantPitch = Math.atan2(c.y - e.y, d) + (ai.errY || 0);
            ai.seenT = (ai.seenT || 0) + dt;
            inp.fire = ai.seenT > 0.8 && Math.abs(angDiff(ai.yaw, wantYaw)) < 0.15;
          } else ai.seenT = 0;
        }
      }
      ai.yaw += clamp(angDiff(ai.yaw, wantYaw), -5 * dt, 5 * dt);
      ai.pitch += clamp(wantPitch - ai.pitch, -3 * dt, 3 * dt);
      if (dirX || dirZ) {
        const sy = Math.sin(ai.yaw), cy = Math.cos(ai.yaw);
        inp.fwd = clamp(dirX * sy + dirZ * cy, -1, 1) * 0.6;
        inp.side = clamp(-(dirX * cy) + dirZ * sy, -1, 1) * 0.6;
      }
      inp.yaw = ai.yaw; inp.pitch = ai.pitch;
      return inp;
    },

    perceive(g, h, ai) {
      const e = g.eye(h), f = g.aim(h);
      const vis = [];
      const reveal = g.infra && g.infra[h.team] > g.t;
      for (const t of g.heroes) {
        if (t.team === h.team || !g.targetable(t)) continue;
        const c = g.chest(t);
        const dx = c.x - e.x, dy = c.y - e.y, dz = c.z - e.z, d = Math.hypot(dx, dy, dz);
        const maxR = h.heroId === 'widowmaker' ? 95 : 72;
        if (d > maxR) continue;
        const inFov = (dx * f.x + dy * f.y + dz * f.z) / d > 0.2;
        const heard = d < 14 || (t.vis.shotT > g.t - 0.5 && d < 30) || (h.hurtBy[t.id] > g.t - 1.5);
        if (!inFov && !heard && !reveal && !(t.st.revealed > 0)) continue;
        if (!g.world.clear(e.x, e.y, e.z, c.x, c.y, c.z)) {
          if (!g.world.clear(e.x, e.y, e.z, t.pos.x, t.pos.y + g.heroH(t) - 0.15, t.pos.z)) {
            if (reveal) ai.seen[t.id] = { t: g.t, x: t.pos.x, y: t.pos.y, z: t.pos.z, vis: false };
            continue;
          }
        }
        vis.push({ t, d });
        ai.seen[t.id] = { t: g.t, x: t.pos.x, y: t.pos.y, z: t.pos.z, vis: true };
      }
      ai.vis = vis;
      g.teamAI = g.teamAI || [{}, {}];
      const tmk = g.teamAI[h.team];
      if (tmk.knownT !== g.tickN) {
        tmk.knownT = g.tickN;
        tmk.known = (tmk.known || []).filter(k => g.t - k.t < 2);
      }
      for (const v of vis) {
        const k = tmk.known.find(x => x.id === v.t.id);
        if (k) { k.x = v.t.pos.x; k.y = v.t.pos.y; k.z = v.t.pos.z; k.t = g.t; }
        else tmk.known.push({ id: v.t.id, x: v.t.pos.x, y: v.t.pos.y, z: v.t.pos.z, t: g.t });
      }
      let best = null, bs = -Infinity;
      const pref = PREF[h.heroId] || PREF.soldier;
      for (const v of vis) {
        const t = v.t;
        let s = 60 / (v.d + 4);
        s += (1 - t.hp / t.maxHp) * 1.2;
        if (ai.target === t.id) s += 1.3;
        if (h.hurtBy[t.id] > g.t - 1.5) s += 1.0;
        if (pref.flank && t.def.role === 'support') s += 1.4;
        if (pref.sniper && t.def.role !== 'tank') s += 0.8;
        if (h.heroId === 'winston' && (t.def.role === 'support' || t.heroId === 'widowmaker')) s += 1.2;
        if (t.heroId === 'reinhardt' && t.k.bOn && h.heroId !== 'reinhardt') s -= 0.6;
        if (t.ultOn === 'deadeye' || t.ultOn === 'tire' || (t.k && t.k.shatterT > 0)) s += 4;
        if (v.d > pref.max) s -= 2;
        if (s > bs) { bs = s; best = t; }
      }
      const prev = ai.target;
      ai.target = best ? best.id : null;
      if (ai.target !== prev && ai.target !== null) { ai.react = ai.p.react * (0.7 + g.rand() * 0.6); ai.tSince = 0; }
    },

    objTarget(g) {
      const M = O.MODES[g.mode];
      return M.target(g);
    },

    holdSpot(g, h, ai) {
      const obj = this.objTarget(g);
      const pref = PREF[h.heroId];
      const stage = g.mode === 'control' ? 0 : g.stage;
      const hints = g.map.hints.filter(x => x.stage === stage);
      let spot = null;
      if (obj.payload) {
        const path = g.map.payload;
        const ahead = O.payloadPos(path, Math.min(path.len, g.obj.s + 9 + (h.idx % 3) * 4));
        spot = { x: ahead.x + (g.rand() - 0.5) * 7, y: ahead.y, z: ahead.z + (g.rand() - 0.5) * 7 };
        if (pref.sniper) {
          const perch = hints.filter(x => x.kind === 'perch').sort((a, b) => Math.hypot(a.x - obj.x, a.z - obj.z) - Math.hypot(b.x - obj.x, b.z - obj.z))[0];
          if (perch && Math.hypot(perch.x - obj.x, perch.z - obj.z) < 45) spot = perch;
        }
      } else {
        const perches = hints.filter(x => x.kind === 'perch');
        const holds = hints.filter(x => x.kind === 'hold');
        if (pref.sniper && perches.length) spot = perches[h.idx % perches.length];
        else if (pref.tank || pref.support) spot = { x: obj.x + (g.rand() - 0.5) * obj.r, y: obj.y, z: obj.z + (g.rand() - 0.5) * obj.r };
        else if (holds.length && g.rand() < 0.75) spot = holds[(h.idx + (g.rand() * 2 | 0)) % holds.length];
        else if (perches.length && g.rand() < 0.4) spot = perches[h.idx % perches.length];
        else spot = { x: obj.x + (g.rand() - 0.5) * obj.r * 1.6, y: obj.y, z: obj.z + (g.rand() - 0.5) * obj.r * 1.6 };
      }
      return spot;
    },

    stageSpot(g, h, obj) {
      const stage = g.mode === 'control' ? 0 : g.stage;
      let hints = g.map.hints.filter(x => x.stage === stage && x.kind === 'stage');
      if (obj && obj.payload) return this.payloadRally(g, h.team) || O.payloadPos(g.map.payload, Math.max(0, g.obj.s - 16));
      if (!hints.length) return null;
      return hints[h.idx % hints.length];
    },

    payloadRally(g, team) {
      g.teamAI = g.teamAI || [{}, {}];
      const tm = g.teamAI[team];
      const sp = g.spawnFor(team), pp = g.obj.pos;
      if (!sp || !pp) return null;
      if (tm.rallySp === sp && Math.abs(tm.rallyS - g.obj.s) < 4 && (tm.rally || g.t - tm.rallyT < 2)) return tm.rally;
      tm.rallySp = sp; tm.rallyS = g.obj.s; tm.rallyT = g.t; tm.rally = null;
      const nav = g.nav;
      const a = nav.nearest(sp.pts[0].x, sp.y, sp.pts[0].z, 4), b = nav.nearest(pp.x, pp.y, pp.z, 6);
      const path = a >= 0 && b >= 0 ? nav.path(a, b, team) : null;
      if (!path) return null;
      for (let i = path.length - 1; i >= 0; i--) {
        const k = path[i];
        if (Math.hypot(nav.x[k] - pp.x, nav.z[k] - pp.z) >= 14) { tm.rally = { x: nav.x[k], y: nav.y[k], z: nav.z[k] }; break; }
      }
      if (!tm.rally) tm.rally = { x: nav.x[a], y: nav.y[a], z: nav.z[a] };
      return tm.rally;
    },

    team(g, team, obj) {
      g.teamAI = g.teamAI || [{}, {}];
      const tm = g.teamAI[team];
      if (tm.t === g.tickN) return tm;
      tm.t = g.tickN;
      const mates = g.heroes.filter(a => a.team === team && a.alive && a.heroId);
      tm.stage = this.stageSpot(g, mates[0] || g.heroes.find(a => a.team === team), obj);
      if (!tm.stage) { tm.push = true; return tm; }
      tm.stageD = Math.hypot(tm.stage.x - obj.x, tm.stage.z - obj.z);
      const ready = mates.filter(a => Math.hypot(a.pos.x - obj.x, a.pos.z - obj.z) < tm.stageD + 8).length;
      const fighting = mates.filter(a => Math.hypot(a.pos.x - obj.x, a.pos.z - obj.z) < tm.stageD - 6).length;
      const late = g.obj && (g.obj.overtime || g.obj.time < 25);
      if (tm.push) {
        if (mates.length <= 3 && fighting <= 1 && !late) tm.push = false;
      } else {
        if (tm.gatherT === undefined) tm.gatherT = g.t;
        const waited = g.t - tm.gatherT;
        if ((ready >= 5) || (ready >= 4 && waited > 6) || waited > 14 || late) { tm.push = true; tm.gatherT = undefined; }
      }
      return tm;
    },

    plan(g, h, ai) {
      const pref = PREF[h.heroId] || PREF.soldier;
      const role = g.roleOf(h.team);
      const obj = this.objTarget(g);
      const enemyOn = g.mode === 'control' ? (g.obj.n ? g.obj.n[1 - h.team] > 0 : false) : (g.obj.attN > 0 || (obj.payload && g.obj.moving > 0));
      const target = ai.target !== null ? g.heroes[ai.target] : null;
      const hpF = (h.hp + h.armor + h.shield + h.temp + h.packArmor) / (h.maxHp + h.maxArmor + h.maxShield);
      let goal = null, kind = 'obj';
      if (g.phase === 'setup' && role === 'att') {
        goal = { x: h.pos.x, y: h.pos.y, z: h.pos.z };
        kind = 'wait';
      }
      if (!goal && hpF < pref.retreat && !h.ultOn && !h.inSpawn && (target || h.lastHurt > g.t - 2)) {
        const pk = this.nearestPack(g, h, 30);
        const healer = g.heroes.find(a => a.alive && a.team === h.team && a !== h && a.def && a.def.role === 'support' && Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) < 30);
        if (pk) { goal = pk; kind = 'retreat'; }
        else if (healer && !pref.support) { goal = healer.pos; kind = 'retreat'; }
        else if (!pref.tank) { const sp = g.spawnFor(h.team); if (sp && Math.hypot(sp.pts[0].x - h.pos.x, sp.pts[0].z - h.pos.z) < 60) { goal = sp.pts[0]; kind = 'retreat'; } }
      }
      if (!goal && hpF < 0.6 && !target) {
        const pk = this.nearestPack(g, h, 14);
        if (pk) { goal = pk; kind = 'pack'; }
      }
      if (!goal && pref.support) {
        let worst = null, wf = 0.97;
        for (const a of g.heroes) {
          if (!a.alive || a.team !== h.team || a === h) continue;
          const d = Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z);
          if (d > 45) continue;
          const f = (a.hp + a.armor + a.shield) / (a.maxHp + a.maxArmor + a.maxShield) + d / 200;
          if (f < wf) { wf = f; worst = a; }
        }
        let anchor = worst;
        if (!anchor) {
          let bd = Infinity;
          for (const a of g.heroes) {
            if (!a.alive || a.team !== h.team || a === h || a.inSpawn) continue;
            const d = Math.hypot(a.pos.x - obj.x, a.pos.z - obj.z) + (a.def.role === 'tank' ? -6 : 0);
            if (d < bd) { bd = d; anchor = a; }
          }
        }
        if (anchor && Math.hypot(anchor.pos.x - obj.x, anchor.pos.z - obj.z) < 70) {
          const back = { x: anchor.pos.x - (obj.x - anchor.pos.x) * 0.08, y: anchor.pos.y, z: anchor.pos.z - (obj.z - anchor.pos.z) * 0.08 };
          goal = back; kind = 'follow';
          ai.anchor = anchor.id;
        } else ai.anchor = null;
      }
      if (!goal) {
        if (role === 'att' || g.mode === 'control') {
          const own = g.mode === 'control' && g.obj.owner === h.team && !enemyOn;
          const tm = this.team(g, h.team, obj);
          const st = tm.stage;
          const myD = Math.hypot(h.pos.x - obj.x, h.pos.z - obj.z);
          if (st && !tm.push && myD > tm.stageD - 4 && !own) {
            goal = st; kind = 'stage';
          } else {
            if (own) {
              if (!ai.hold || ai.holdT < g.t) { ai.hold = this.holdSpot(g, h, ai); ai.holdT = g.t + 8 + g.rand() * 6; }
              goal = ai.hold; kind = 'hold';
            } else if (obj.payload) {
              const pp = g.obj.pos;
              const back = O.payloadPos(g.map.payload, Math.max(0, g.obj.s - 1.5));
              const side = ((h.idx % 3) - 1) * 2.2;
              const yx = Math.cos(pp.yaw), yz = -Math.sin(pp.yaw);
              goal = { x: back.x + yx * side, y: back.y, z: back.z + yz * side };
              if (pref.sniper && ai.target !== null) goal = { x: pp.x - Math.sin(pp.yaw) * 12, y: pp.y, z: pp.z - Math.cos(pp.yaw) * 12 };
              kind = 'obj';
            } else {
              if (!ai.spot || ai.spotT < g.t || ai.spotFor !== obj) {
                const a = g.rand() * Math.PI * 2, r = Math.sqrt(g.rand()) * obj.r * 0.65;
                ai.spot = { x: obj.x + Math.cos(a) * r, y: obj.y, z: obj.z + Math.sin(a) * r };
                ai.spotT = g.t + 5; ai.spotFor = obj;
              }
              goal = ai.spot;
              if (pref.sniper && !enemyOn) {
                const perch = g.map.hints.filter(x => x.kind === 'perch' && x.stage === (g.mode === 'control' ? 0 : g.stage))[h.idx % 2];
                if (perch) goal = perch;
              }
              kind = 'obj';
            }
          }
        } else {
          if (enemyOn && !pref.sniper) {
            goal = { x: obj.x, y: obj.y, z: obj.z };
            if (obj.payload) goal = g.obj.pos;
            kind = 'contest';
          } else {
            if (!ai.hold || ai.holdT < g.t || ai.holdStage !== g.stage) { ai.hold = this.holdSpot(g, h, ai); ai.holdT = g.t + (obj.payload ? 4 : 14) + g.rand() * 8; ai.holdStage = g.stage; }
            goal = ai.hold; kind = 'hold';
          }
        }
      }
      if (target && kind !== 'retreat' && kind !== 'wait') {
        const d = Math.hypot(target.pos.x - h.pos.x, target.pos.z - h.pos.z);
        const leash = pref.tank ? 18 : pref.flank ? 30 : pref.sniper ? 6 : 14;
        const goalD = goal ? Math.hypot(goal.x - h.pos.x, goal.z - h.pos.z) : 0;
        if (d > pref.range + 3 && d < pref.max + 10 && goalD < leash + 10 && !pref.sniper) {
          goal = { x: target.pos.x, y: target.pos.y, z: target.pos.z }; kind = 'chase';
        }
      }
      if (!target && (kind === 'hold' || kind === 'obj' || kind === 'follow') && !pref.sniper) {
        const tm = g.teamAI && g.teamAI[h.team];
        const known = tm && tm.known;
        if (known) {
          let best = null, bd = pref.support ? 16 : 26;
          for (const k of known) {
            const dObj = Math.hypot(k.x - obj.x, k.z - obj.z);
            const dMe = Math.hypot(k.x - h.pos.x, k.z - h.pos.z);
            if (dObj < 32 && dMe < bd) { bd = dMe; best = k; }
          }
          if (best) { goal = { x: best.x, y: best.y, z: best.z }; kind = 'collapse'; }
        }
      }
      if (!goal) goal = { x: obj.x, y: obj.y, z: obj.z };
      ai.goal = goal; ai.kind = kind;
    },

    nearestPack(g, h, maxD) {
      let best = null, bd = maxD;
      for (const p of g.pickups) {
        if (p.t > 0) continue;
        const d = Math.hypot(p.x - h.pos.x, p.z - h.pos.z) + Math.abs(p.y - h.pos.y) * 2;
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    },

    moveTo(g, h, ai, inp, dt) {
      const goal = ai.goal;
      if (!goal) return;
      const nav = g.nav;
      const gd = Math.hypot(goal.x - h.pos.x, goal.z - h.pos.z);
      let dirX = 0, dirZ = 0;
      const target = ai.target !== null ? g.heroes[ai.target] : null;
      const pref = PREF[h.heroId] || PREF.soldier;
      const arrive = ai.kind === 'hold' || ai.kind === 'obj' || ai.kind === 'contest' || ai.kind === 'follow' ? 1.2 : ai.kind === 'wait' ? 99 : 0.8;
      if (gd > arrive || Math.abs(goal.y - h.pos.y) > 2.2) {
        ai.repathT -= dt;
        const gnode = nav.nearest(goal.x, goal.y, goal.z, 5);
        if (!ai.path || ai.repathT <= 0 || ai.pathNode !== gnode || ai.pathI >= ai.path.length) {
          const s = nav.nearest(h.pos.x, h.pos.y, h.pos.z, 3);
          ai.path = s >= 0 && gnode >= 0 ? nav.path(s, gnode, h.team) : null;
          ai.pathI = 1; ai.pathNode = gnode; ai.repathT = (ai.path ? 1.2 : 3) + g.rand() * 0.6;
        }
        if (ai.path && ai.pathI < ai.path.length) {
          let k = ai.path[ai.pathI];
          while (ai.pathI < ai.path.length - 1 && Math.hypot(nav.x[k] - h.pos.x, nav.z[k] - h.pos.z) < 0.9 && Math.abs(nav.y[k] - h.pos.y) < 1.2) { ai.pathI++; k = ai.path[ai.pathI]; }
          for (let look = Math.min(ai.path.length - 1, ai.pathI + 5); look > ai.pathI; look--) {
            const kk = ai.path[look];
            if (Math.abs(nav.y[kk] - h.pos.y) > 1.5) continue;
            let jumpy = false;
            for (let q = ai.pathI; q < look; q++) if (nav.edgeFlag(ai.path[q], ai.path[q + 1]) > 0) { jumpy = true; break; }
            if (jumpy) continue;
            if (nav.walkLine(h.pos.x, h.pos.y, h.pos.z, nav.x[kk], nav.z[kk])) { ai.pathI = look; k = kk; break; }
          }
          dirX = nav.x[k] - h.pos.x; dirZ = nav.z[k] - h.pos.z;
          const prevK = ai.path[ai.pathI - 1];
          if (prevK !== undefined && nav.edgeFlag(prevK, k) === NavF.F_JUMP && h.onGround && Math.hypot(dirX, dirZ) < 1.6) inp.jump = true;
          if (nav.y[k] - h.pos.y > 0.55 && h.onGround && Math.hypot(dirX, dirZ) < 1.4) inp.jump = true;
        } else {
          dirX = goal.x - h.pos.x; dirZ = goal.z - h.pos.z;
        }
      } else if (ai.kind === 'hold' || ai.kind === 'obj' || ai.kind === 'follow' || ai.kind === 'contest') {
        ai.path = null;
      }
      if (target && ai.kind !== 'retreat' && h.onGround) {
        const tx = target.pos.x - h.pos.x, tz = target.pos.z - h.pos.z, td = Math.hypot(tx, tz) || 1;
        ai.strafeT -= dt;
        if (ai.strafeT <= 0) { ai.strafe = g.rand() < 0.5 ? -1 : 1; ai.strafeT = 0.35 + g.rand() * 0.9; }
        const sx = -tz / td * ai.strafe, sz = tx / td * ai.strafe;
        const near = gd <= arrive + 2;
        let wf = near ? 1 : 0.55;
        if (pref.sniper && h.k.scoped) wf = 0.15;
        dirX = dirX * (near ? 0 : 1) + sx * wf * 2;
        dirZ = dirZ * (near ? 0 : 1) + sz * wf * 2;
        if (near) {
          if (td > pref.range + 4 && !pref.sniper) { dirX += tx / td; dirZ += tz / td; }
          else if (td < pref.range - 3 && !pref.tank) { dirX -= tx / td * 1.2; dirZ -= tz / td * 1.2; }
        }
        if (g.rand() < 0.004 * (1 + h.skill)) inp.jump = true;
      }
      const l = Math.hypot(dirX, dirZ);
      if (l > 0.01) {
        const nx = dirX / l, nz = dirZ / l;
        if (!nav.walkLine(h.pos.x, h.pos.y, h.pos.z, h.pos.x + nx * 1.2, h.pos.z + nz * 1.2) && ai.path && ai.path.length > ai.pathI && target) {
          const k = ai.path[ai.pathI];
          const px = nav.x[k] - h.pos.x, pz = nav.z[k] - h.pos.z, pl = Math.hypot(px, pz) || 1;
          dirX = px / pl; dirZ = pz / pl;
        } else { dirX = nx; dirZ = nz; }
        if (h.onGround && g.world.groundAt(h.pos.x + dirX * 1.1, h.pos.z + dirZ * 1.1, h.pos.y + 0.6, 0.2) < Math.max(g.map.killY, h.pos.y - 9)) { dirX = 0; dirZ = 0; }
        const sy = Math.sin(ai.yaw), cy = Math.cos(ai.yaw);
        inp.fwd = clamp(dirX * sy + dirZ * cy, -1, 1);
        inp.side = clamp(-(dirX * cy) + dirZ * sy, -1, 1);
        ai.moveYaw = Math.atan2(dirX, dirZ);
      } else ai.moveYaw = null;
      ai.lastCheck += dt;
      if (ai.lastCheck > 1.2) {
        const moved = Math.hypot(h.pos.x - ai.lastPos.x, h.pos.z - ai.lastPos.z);
        if (l > 0.01 && moved < 0.5 && gd > 2 && !target) { ai.stuckT += ai.lastCheck; inp.jump = true; ai.path = null; }
        else ai.stuckT = 0;
        if (ai.stuckT > 4) {
          const k = nav.randomNear(h.pos.x, h.pos.y, h.pos.z, 8, g.rand);
          if (k >= 0) { ai.goal = { x: nav.x[k], y: nav.y[k], z: nav.z[k] }; ai.kind = 'unstick'; ai.thinkT = 1.5; }
          ai.stuckT = 0;
        }
        ai.lastPos = { x: h.pos.x, z: h.pos.z }; ai.lastCheck = 0;
      }
    },

    aimPoint(g, h, ai, t) {
      const pr = PROJ[h.heroId];
      const e = g.eye(h);
      let head = false;
      if ((h.heroId === 'widowmaker' || h.heroId === 'mccree' || h.heroId === 'soldier') && ai.headRoll === undefined) ai.headRoll = g.rand() < ai.p.head;
      head = !!ai.headRoll;
      let x = t.pos.x, y = t.pos.y + (head ? g.heroH(t) - t.def.headR : g.heroH(t) * 0.58), z = t.pos.z;
      if (pr) {
        const d = Math.hypot(x - e.x, y - e.y, z - e.z);
        const tf = d / pr[0];
        const L = ai.p.lead;
        x += t.vel.x * tf * L; z += t.vel.z * tf * L;
        if (t.onGround) y += 0; else y += t.vel.y * tf * L * 0.5;
        if (pr[1] > 0) {
          const hd = Math.hypot(x - e.x, z - e.z), dy = y - e.y;
          const v = pr[0], gr = pr[1];
          const disc = v ** 4 - gr * (gr * hd * hd + 2 * dy * v * v);
          const ang = disc >= 0 ? Math.atan((v * v - Math.sqrt(disc)) / (gr * hd)) : Math.PI / 4;
          return { x, y: e.y + Math.tan(ang) * hd, z };
        }
      }
      return { x, y, z };
    },

    aim(g, h, ai, inp, dt) {
      const t = ai.target !== null ? g.heroes[ai.target] : null;
      let wantYaw = ai.yaw, wantPitch = ai.pitch;
      const e = g.eye(h);
      if (t && g.targetable(t)) {
        ai.tSince += dt;
        ai.errT -= dt;
        if (ai.errT <= 0) {
          const spd = Math.hypot(t.vel.x, t.vel.z);
          const mag = ai.p.err * (1 + spd / 7) * (ai.tSince < 0.6 ? 1.8 : 1);
          ai.errX = (g.rand() - 0.5) * 2 * mag; ai.errY = (g.rand() - 0.5) * 1.4 * mag;
          ai.errT = 0.3 + g.rand() * 0.25;
          ai.headRoll = undefined;
        }
        const p = this.aimPoint(g, h, ai, t);
        const dx = p.x - e.x, dy = p.y - e.y, dz = p.z - e.z;
        wantYaw = Math.atan2(dx, dz) + ai.errX;
        wantPitch = Math.atan2(dy, Math.hypot(dx, dz)) + ai.errY;
        ai.tDist = Math.hypot(dx, dy, dz);
        const ang = Math.hypot(angDiff(ai.yaw, wantYaw - ai.errX), ai.pitch - (wantPitch - ai.errY));
        const tol = Math.atan2(t.r + 0.25, ai.tDist) * 1.6 + 0.012;
        ai.onTarget = ang < tol + Math.abs(ai.errX) * 0.2;
        ai.react -= dt;
        ai.canShoot = ai.react <= 0 && ai.onTarget;
      } else {
        ai.canShoot = false; ai.onTarget = false; ai.tDist = 999;
        const seen = Object.entries(ai.seen).filter(([, s]) => g.t - s.t < 2.5).sort((a, b) => b[1].t - a[1].t)[0];
        if (seen && ai.kind !== 'retreat') {
          wantYaw = Math.atan2(seen[1].x - h.pos.x, seen[1].z - h.pos.z);
          wantPitch = 0;
        } else if (ai.moveYaw !== null && ai.moveYaw !== undefined) {
          wantYaw = ai.moveYaw; wantPitch = -0.05;
        } else {
          const obj = this.objTarget(g);
          if (Math.hypot(obj.x - h.pos.x, obj.z - h.pos.z) > 3) wantYaw = Math.atan2(obj.x - h.pos.x, obj.z - h.pos.z);
          wantPitch = 0;
        }
      }
      const tr = ai.p.turn * (t ? 1 : 0.6) * dt;
      const dy = angDiff(ai.yaw, wantYaw);
      ai.yaw = O.wrapAng(ai.yaw + clamp(dy * Math.min(1, dt * 14), -tr, tr));
      ai.pitch = clamp(ai.pitch + clamp((wantPitch - ai.pitch) * Math.min(1, dt * 14), -tr, tr), -1.4, 1.4);
    },

    chatter(g, h, ai, dt) {
      ai.chatT -= dt;
      if (ai.chatT > 0) return;
      ai.chatT = 60 + g.rand() * 120;
      if (g.rand() < 0.3 && g.phase === 'play') g.say(h, O.pick(g.rand, O.CHAT.ally));
    }
  };

  function shootIf(g, h, ai, inp, maxRange) {
    if (ai.canShoot && ai.tDist <= maxRange) inp.fire = true;
  }
  function enemiesNear(g, h, r, pos) {
    const p = pos || h.pos;
    return g.heroes.filter(t => t.team !== h.team && g.targetable(t) && Math.hypot(t.pos.x - p.x, t.pos.y - p.y, t.pos.z - p.z) < r);
  }
  function visCount(ai, r) { return ai.vis.filter(v => v.d < r).length; }
  function hpFrac(h) { return (h.hp + h.armor + h.shield + h.temp + h.packArmor) / (h.maxHp + h.maxArmor + h.maxShield); }
  function tgt(g, ai) { return ai.target !== null ? g.heroes[ai.target] : null; }
  function every(ai, key, sec, g) { ai[key] = (ai[key] || 0) - O.TICK; if (ai[key] > 0) return false; ai[key] = sec * (0.7 + g.rand() * 0.6); return true; }

  const BOT = {
    mccree(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (h.ultOn === 'deadeye') {
        const marks = h.k.marks || {};
        let ready = 0;
        for (const id in marks) { const x = g.heroes[id]; if (x && x.alive && marks[id] >= x.hp + x.armor + x.shield) ready++; }
        if ((ready >= 2 || (ready >= 1 && h.ultT > 2.2) || h.ultT > 4.2 || hpFrac(h) < 0.35) && h.ultT > 0.5) inp.fire = true;
        return;
      }
      if (!t) { if (h.ammo < h.maxAmmo && g.rand() < 0.02) inp.reload = true; return; }
      const d = ai.tDist;
      if (d < 5.5 && !(h.cd.e > 0) && ai.onTarget && g.rand() < 0.3 * ai.p.smart + 0.05) inp.e = true;
      if (d < 5 && h.ammo >= 3 && ai.onTarget) inp.fire2 = true;
      else shootIf(g, h, ai, inp, 42);
      if (h.ammo === 0 && !(h.cd.shift > 0) && d < 14) inp.shift = true;
      if (g.ultReady(h) && visCount(ai, 30) >= 2 && enemiesNear(g, h, 7).length === 0 && hpFrac(h) > 0.5) inp.q = true;
    },
    soldier(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (!t) {
        if (ai.goal && Math.hypot(ai.goal.x - h.pos.x, ai.goal.z - h.pos.z) > 14 && inp.fwd > 0.5) inp.shift = true;
        if (h.ammo < h.maxAmmo * 0.5 && every(ai, 'rl', 1, g)) inp.reload = true;
        return;
      }
      shootIf(g, h, ai, inp, 55);
      if (ai.onTarget && ai.tDist < 30 && !(h.cd.fire2 > 0) && g.rand() < 0.05) inp.fire2 = true;
      if (!(h.cd.e > 0) && hpFrac(h) < 0.6) inp.e = true;
      if (g.ultReady(h) && (visCount(ai, 35) >= 2 || (visCount(ai, 25) >= 1 && hpFrac(t) > 0.7 && g.rand() < 0.01))) inp.q = true;
    },
    tracer(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (!(h.cd.e > 0) && hpFrac(h) < 0.4 && h.lastHurt > g.t - 1 && h.hist.length > 60) { inp.e = true; return; }
      if (!t) {
        if (h.k.blinks === 3 && ai.goal && Math.hypot(ai.goal.x - h.pos.x, ai.goal.z - h.pos.z) > 20 && inp.fwd > 0.7 && every(ai, 'bl', 2, g)) inp.shift = true;
        return;
      }
      shootIf(g, h, ai, inp, 22);
      const d = ai.tDist;
      if (h.k.blinks >= 2 && d > 11 && d < 22 && every(ai, 'bl', 1.2, g)) { inp.shift = true; inp.fwd = 1; inp.side = 0; }
      else if (h.lastHurt > g.t - 0.4 && h.k.blinks >= 1 && every(ai, 'bd', 1.5, g)) { inp.shift = true; inp.side = ai.strafe; inp.fwd = 0; }
      if (g.ultReady(h) && d < 7 && ai.onTarget && (t.hp + t.armor > 180 || enemiesNear(g, t, 3.5).length >= 2)) inp.q = true;
    },
    junkrat(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (h.ultOn === 'tire') {
        const tire = g.deploy.find(x => x.id === h.k.tire);
        if (tire) {
          const foes = enemiesNear(g, h, 60, tire.pos);
          let best = null, bd = Infinity;
          for (const f of foes) { const dd = Math.hypot(f.pos.x - tire.pos.x, f.pos.z - tire.pos.z); if (dd < bd) { bd = dd; best = f; } }
          if (best) {
            ai.yaw = Math.atan2(best.pos.x - tire.pos.x, best.pos.z - tire.pos.z);
            const close = foes.filter(f => Math.hypot(f.pos.x - tire.pos.x, f.pos.y - tire.pos.y, f.pos.z - tire.pos.z) < 3.2).length;
            if (close >= 2 || (close >= 1 && tire.age > 5) || tire.age > 8.5) inp.fire = true;
          } else if (tire.age > 6) inp.fire = true;
        }
        return;
      }
      const mine = h.k.mine !== null ? g.proj.find(x => x.id === h.k.mine) : null;
      if (mine && mine.stuckTo !== undefined) {
        if (enemiesNear(g, h, 2.6, mine.pos).length) inp.fire2 = true;
        else if (hpFrac(h) < 0.3 && Math.hypot(mine.pos.x - h.pos.x, mine.pos.z - h.pos.z) < 2) inp.fire2 = true;
        else if (!t && every(ai, 'mdet', 6, g)) inp.fire2 = true;
      }
      if (!t) {
        if (g.roleOf(h.team) === 'def' && !(h.cd.e > 0) && ai.kind === 'hold' && every(ai, 'trap', 4, g)) { ai.pitch = -0.6; inp.e = true; }
        return;
      }
      shootIf(g, h, ai, inp, 28);
      if (!mine && !(h.cd.shift > 0) && ai.tDist < 14 && ai.onTarget && g.rand() < 0.05) inp.shift = true;
      if (!(h.cd.e > 0) && ai.tDist < 6 && g.rand() < 0.05) { ai.pitch = -0.9; inp.e = true; }
      if (g.ultReady(h) && (visCount(ai, 40) >= 2 || g.rand() < 0.003)) inp.q = true;
    },
    torbjorn(g, h, ai, inp) {
      const t = tgt(g, ai);
      const tur = h.k.turret !== null ? g.deploy.find(x => x.id === h.k.turret) : null;
      if (!tur && !(h.cd.shift > 0) && (ai.kind === 'hold' || ai.kind === 'obj' || ai.kind === 'wait' || (t && ai.tDist < 20)) && every(ai, 'tur', 1.2, g)) { ai.pitch = -0.4; inp.shift = true; }
      if (h.k.scrap >= 50 && !(h.cd.e > 0)) {
        const mate = g.heroes.find(a => a.alive && a.team === h.team && a !== h && a.packArmor < 20 && Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) < 3);
        if ((mate || h.packArmor < 20) && every(ai, 'pack', 3, g)) { inp.e = true; ai.pitch = -0.3; }
      }
      if (g.ultReady(h) && (visCount(ai, 30) >= 2 || (t && hpFrac(h) < 0.5))) inp.q = true;
      if (!t) {
        if (tur && tur.level < 2 && Math.hypot(tur.pos.x - h.pos.x, tur.pos.z - h.pos.z) < 3.5 && ai.kind !== 'retreat') {
          inp.slot = 2;
          ai.yaw = Math.atan2(tur.pos.x - h.pos.x, tur.pos.z - h.pos.z);
          ai.pitch = Math.atan2(tur.pos.y + 0.5 - (h.pos.y + h.eyeH), Math.hypot(tur.pos.x - h.pos.x, tur.pos.z - h.pos.z));
          if (h.weapon === 1) inp.fire = true;
          if (tur) ai.goal = { x: tur.pos.x, y: tur.pos.y, z: tur.pos.z };
        } else if (h.weapon !== 0) inp.slot = 1;
        return;
      }
      if (h.weapon !== 0) inp.slot = 1;
      if (ai.tDist < 6 && h.ammo >= 3 && ai.onTarget) inp.fire2 = true;
      else shootIf(g, h, ai, inp, 35);
    },
    widowmaker(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (g.ultReady(h) && (ai.vis.length >= 1 || g.t - (ai.lastFight || -99) < 3)) inp.q = true;
      if (ai.vis.length) ai.lastFight = g.t;
      if (!(h.cd.e > 0) && (ai.kind === 'hold' || ai.kind === 'obj') && ai.goal && Math.hypot(ai.goal.x - h.pos.x, ai.goal.z - h.pos.z) < 3 && every(ai, 'ven', 5, g)) { ai.pitch = -0.7; inp.e = true; }
      if (!(h.cd.shift > 0) && ai.goal && ai.goal.y > h.pos.y + 2 && Math.hypot(ai.goal.x - h.pos.x, ai.goal.z - h.pos.z) < 16) {
        const e = g.eye(h);
        const dx = ai.goal.x - e.x, dy = ai.goal.y + 1 - e.y, dz = ai.goal.z - e.z;
        const d = Math.hypot(dx, dy, dz);
        const r = g.world.raycast(e.x, e.y, e.z, dx / d, dy / d, dz / d, 20);
        if (r && r.t > d - 2.5) { ai.yaw = Math.atan2(dx, dz); ai.pitch = Math.atan2(dy, Math.hypot(dx, dz)); inp.shift = true; }
      }
      if (!t) return;
      if (ai.tDist > 11) {
        inp.fire2 = true;
        const need = t.hp + t.armor + t.shield + t.temp;
        const dmg = 12 + 108 * (h.k.charge || 0);
        if (ai.onTarget && ai.react <= 0 && (h.k.charge >= 0.95 || dmg * (ai.headRoll ? 2.5 : 1) >= need) && every(ai, 'snipe', 0.2, g)) inp.fire = true;
      } else {
        shootIf(g, h, ai, inp, 14);
        if (ai.tDist < 6 && !(h.cd.shift > 0) && hpFrac(h) < 0.6) { ai.pitch = 0.8; inp.shift = true; }
      }
    },
    reinhardt(g, h, ai, inp) {
      const t = tgt(g, ai);
      const threats = ai.vis.filter(v => v.d < 35).length;
      const hurt = h.lastHurt > g.t - 1.2;
      if (g.ultReady(h)) {
        const f = { x: Math.sin(ai.yaw), z: Math.cos(ai.yaw) };
        const inCone = ai.vis.filter(v => v.d < 16 && ((v.t.pos.x - h.pos.x) * f.x + (v.t.pos.z - h.pos.z) * f.z) / Math.max(0.1, v.d) > 0.8).length;
        if (inCone >= 2 || (inCone >= 1 && hpFrac(h) < 0.3)) { inp.q = true; return; }
      }
      if (!t) return;
      const d = ai.tDist;
      if (d < 5.2 && ai.onTarget) { inp.fire = true; return; }
      if ((threats >= 1 && (hurt || d > 7)) && h.k.bar.hp > 300) inp.fire2 = true;
      if (!(h.cd.e > 0) && d < 22 && d > 5 && ai.onTarget && g.rand() < 0.04) { inp.fire2 = false; inp.e = true; }
      if (!(h.cd.shift > 0) && d > 5 && d < 14 && ai.onTarget && hpFrac(t) < 0.9 && g.nav.walkLine(h.pos.x, h.pos.y, h.pos.z, t.pos.x, t.pos.z) && g.rand() < 0.015 * (1 + h.skill)) { inp.fire2 = false; inp.shift = true; }
    },
    roadhog(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (!(h.cd.e > 0) && hpFrac(h) < 0.5 && !(h.k.pull)) { inp.e = true; return; }
      if (g.ultReady(h) && visCount(ai, 12) >= 2) inp.q = true;
      if (h.ultOn === 'hog') { if (t && ai.tDist < 16) inp.fire = true; return; }
      if (!t) { if (h.ammo < 2 && every(ai, 'rl', 1, g)) inp.reload = true; return; }
      const d = ai.tDist;
      if (!(h.cd.shift > 0) && d > 5 && d < 18.5 && ai.onTarget && ai.react <= 0 && g.rand() < 0.08) inp.shift = true;
      if (h.k.pull || (d < 7 && ai.onTarget)) inp.fire = true;
      else if (d < 16 && ai.onTarget && g.rand() < 0.4) inp.fire2 = true;
      if (d < 2.5 && h.fireCd > 0.3 && !(h.cd.melee > 0)) inp.melee = true;
    },
    winston(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (h.ultOn === 'rage') {
        if (t && ai.tDist < 4.5) inp.fire = true;
        if (t && ai.tDist > 8 && !(h.cd.shift > 0)) inp.shift = true;
        return;
      }
      if (g.ultReady(h) && ((hpFrac(h) < 0.35 && visCount(ai, 15)) || visCount(ai, 8) >= 3)) { inp.q = true; return; }
      if (!(h.cd.e > 0) && (hpFrac(h) < 0.55 || visCount(ai, 10) >= 2) && t && ai.tDist < 10) { ai.pitch = -0.45; inp.e = true; }
      if (!t) {
        if (!(h.cd.shift > 0) && ai.goal && Math.hypot(ai.goal.x - h.pos.x, ai.goal.z - h.pos.z) > 22 && inp.fwd > 0.7 && every(ai, 'jp', 1, g)) { ai.pitch = 0.25; inp.shift = true; }
        return;
      }
      const d = ai.tDist;
      if (d < 8.5) inp.fire = true;
      if (!(h.cd.shift > 0) && d > 9 && d < 22 && ai.onTarget && hpFrac(h) > 0.4 && g.rand() < 0.03) { ai.pitch = Math.max(ai.pitch, 0.15); inp.shift = true; }
    },
    lucio(g, h, ai, inp) {
      const t = tgt(g, ai);
      const allies = g.heroes.filter(a => a.alive && a.team === h.team && Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) < 20);
      const hurt = allies.filter(a => hpFrac(a) < 0.85).length;
      const want = hurt >= 1 || t ? 'heal' : 'speed';
      if (want !== h.k.song && !(h.cd.shift > 0) && every(ai, 'song', 1, g)) inp.shift = true;
      if (!(h.cd.e > 0) && (hurt >= 2 || (hurt >= 1 && t))) inp.e = true;
      if (g.ultReady(h) && (allies.filter(a => hpFrac(a) < 0.5).length >= 2 || (visCount(ai, 20) >= 3 && allies.length >= 3))) inp.q = true;
      if (!t) return;
      shootIf(g, h, ai, inp, 30);
      if (ai.tDist < 6 && !(h.cd.fire2 > 0) && ai.onTarget) inp.fire2 = true;
    },
    mercy(g, h, ai, inp) {
      const t = tgt(g, ai);
      if (h.weapon !== 0) inp.slot = 1;
      const dead = g.heroes.filter(a => a.team === h.team && !a.alive && a.spawned && a.deathPos && a.respawnT > 1.5 && Math.hypot(a.deathPos.x - h.pos.x, a.deathPos.z - h.pos.z) < 30);
      if (g.ultReady(h) && dead.length >= 2) {
        const nearDead = dead.filter(a => Math.hypot(a.deathPos.x - h.pos.x, a.deathPos.y - h.pos.y, a.deathPos.z - h.pos.z) < 14);
        if (nearDead.length >= 2 || (nearDead.length >= 1 && visCount(ai, 20) === 0)) { inp.q = true; }
        else if (dead.length) { ai.goal = dead[0].deathPos; ai.kind = 'rez'; }
      }
      let best = null, bs = -Infinity;
      for (const a of g.heroes) {
        if (!a.alive || a.team !== h.team || a === h) continue;
        const dx = a.pos.x - h.pos.x, dz = a.pos.z - h.pos.z, d = Math.hypot(dx, a.pos.y - h.pos.y, dz);
        if (d > 15) continue;
        const f = hpFrac(a);
        const s = (1 - f) * 4 + (a.def.role === 'tank' ? 0.3 : 0) - d * 0.03 + (h.k.beamTo === a.id ? 0.4 : 0);
        if (s > bs && g.hasLos(h, a)) { bs = s; best = a; }
      }
      if (best) {
        const e = g.eye(h), c = g.chest(best);
        ai.yaw = Math.atan2(c.x - e.x, c.z - e.z);
        ai.pitch = Math.atan2(c.y - e.y, Math.hypot(c.x - e.x, c.z - e.z));
        const f = hpFrac(best);
        if (f < 0.98) inp.fire = true;
        else if (best.def.role !== 'support' && (best.vis.shotT > g.t - 1)) inp.fire2 = true;
        else inp.fire = true;
      } else if (ai.anchor !== null && ai.anchor !== undefined) {
        const a = g.heroes[ai.anchor];
        if (a && a.alive && !(h.cd.shift > 0) && Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) > 12 && Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) < 28 && g.hasLos(h, a)) {
          const e = g.eye(h), c = g.chest(a);
          ai.yaw = Math.atan2(c.x - e.x, c.z - e.z);
          ai.pitch = Math.atan2(c.y - e.y, Math.hypot(c.x - e.x, c.z - e.z));
          inp.shift = true;
        }
      }
      if (h.lastHurt > g.t - 0.5 && !(h.cd.shift > 0) && best && Math.hypot(best.pos.x - h.pos.x, best.pos.z - h.pos.z) > 6) inp.shift = true;
      if (!h.onGround && h.vel.y < -2) inp.jump = true;
      if (!best && t && ai.tDist < 12 && hpFrac(h) > 0.4 && g.rand() < 0.01) inp.slot = 2;
    },
    zenyatta(g, h, ai, inp) {
      const t = tgt(g, ai);
      let worst = null, wf = 0.9;
      for (const a of g.heroes) {
        if (!a.alive || a.team !== h.team || a === h) continue;
        const f = hpFrac(a);
        if (f < wf && Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) < 38 && g.hasLos(h, a)) { wf = f; worst = a; }
      }
      const cur = h.k.harmony !== null ? g.heroes[h.k.harmony] : null;
      if (worst && (!cur || !cur.alive || (hpFrac(cur) > 0.95 && worst !== cur)) && !(h.cd.shift > 0)) {
        const e = g.eye(h), c = g.chest(worst);
        ai.yaw = Math.atan2(c.x - e.x, c.z - e.z);
        ai.pitch = Math.atan2(c.y - e.y, Math.hypot(c.x - e.x, c.z - e.z));
        inp.shift = true;
        return;
      }
      if (g.ultReady(h)) {
        const low = g.heroes.filter(a => a.alive && a.team === h.team && hpFrac(a) < 0.5 && Math.hypot(a.pos.x - h.pos.x, a.pos.z - h.pos.z) < 10).length;
        if (low >= 2 || (hpFrac(h) < 0.3 && t)) inp.q = true;
      }
      if (!t) return;
      if (h.k.discord !== t.id && !(h.cd.e > 0) && ai.onTarget) inp.e = true;
      if (t.def.role === 'tank' && ai.tDist < 25 && h.ammo >= 5 && ai.onTarget) {
        if ((h.k.volley || 0) < 5) inp.fire2 = true;
      } else shootIf(g, h, ai, inp, 50);
    }
  };

  O.AI = AI;
  O.AI_PREF = PREF;
})(globalThis.Ow98 = globalThis.Ow98 || {});
