(function (Q) {
  'use strict';
  const C = Q.CONTENTS;
  const WP = Q.WP;
  const ZERO = [0, 0, 0];
  const ITEM_MINS = [-15, -15, -15], ITEM_MAXS = [15, 15, 15];
  const PITCH_MAX = 89 * Q.DEG;

  function rayBoxNormal(s, d, bmin, bmax, fmax) {
    let t0 = -Infinity, t1 = Infinity, axis = -1, sign = 0;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-9) {
        if (s[i] < bmin[i] || s[i] > bmax[i]) return null;
        continue;
      }
      let a = (bmin[i] - s[i]) / d[i], b = (bmax[i] - s[i]) / d[i];
      let sg = -1;
      if (a > b) { const t = a; a = b; b = t; sg = 1; }
      if (a > t0) { t0 = a; axis = i; sign = sg; }
      if (b < t1) t1 = b;
      if (t0 > t1) return null;
    }
    if (t1 < 0 || t0 > fmax) return null;
    if (t0 < 0) return { f: 0, inside: true, normal: [0, 0, 1] };
    const n = [0, 0, 0];
    if (axis >= 0) n[axis] = sign;
    return { f: t0, inside: false, normal: n };
  }

  class Game {
    constructor(o) {
      this.o = o;
      this.mapId = o.map;
      this.world = Q.loadWorld(o.map);
      this.gametype = o.gametype || 'ffa';
      this.teamGame = this.gametype === 'team';
      this.fraglimit = o.fraglimit === undefined ? 20 : o.fraglimit;
      this.timelimit = o.timelimit || 0;
      this.mod = o.mod || 'baseq3';
      this.seed = (o.seed >>> 0) || 1;
      this.rng = Q.rng(this.seed);
      this.time = 0;
      this.tick = 0;
      this.events = [];
      this.players = [];
      this.projectiles = [];
      this.bodies = [];
      this.dropped = [];
      this.nextId = 1;
      this.state = 'warmup';
      this.warmupEnd = o.warmup === undefined ? 3 : o.warmup;
      this.matchTime = 0;
      this.intermissionAt = 0;
      this.exitReason = '';
      this.teamScores = { red: 0, blue: 0 };
      this.leadState = null;
      this.fragWarned = {};
      this.timeWarned = {};
      this.sudden = false;
      this.god = false;
      this.items = this.world.items.map((e, i) => {
        const def = Q.ITEMS[e.key];
        const it = { id: i, key: e.key, def, pos: e.pos.slice(), active: true, respawnAt: 0, spin: i * 0.7, alt: e.alt || null };
        if (it.alt && this.rng() < 0.5) this.swapAlt(it);
        if (def.type === 'powerup') { it.active = false; it.respawnAt = 45 + this.rng.crandom() * 15; }
        if (this.mod !== 'baseq3') { it.active = false; it.respawnAt = Infinity; }
        return it;
      });
      this.pads = this.world.pads.map(p => {
        const center = [p.pos[0], p.pos[1], p.pos[2] + 16];
        const height = p.target[2] - center[2];
        const time = Math.sqrt(Math.max(1, height) / (0.5 * Q.GRAVITY));
        const flat = [p.target[0] - center[0], p.target[1] - center[1], 0];
        const dist = Q.vlen(flat);
        const dir = dist > 0 ? Q.vscale(flat, 1 / dist) : [0, 0, 0];
        return Object.assign({}, p, { vel: [dir[0] * dist / time, dir[1] * dist / time, time * Q.GRAVITY] });
      });
      if (!o.noNav && Q.getNav) this.nav = Q.getNav(this.world);
      for (const pd of (o.players || [])) this.addPlayer(pd);
      this.local = this.players.find(p => p.human) || null;
    }

    emit(e) { this.events.push(e); }

    addPlayer(pd) {
      const bot = pd.bot ? Q.BOTS[pd.bot] : null;
      const model = pd.model && Q.BOTS[pd.model] ? Q.BOTS[pd.model] : bot || Q.BOTS.sarge;
      const p = {
        id: this.nextId++,
        name: pd.name || (bot ? bot.name : 'UnnamedPlayer'),
        human: !!pd.human,
        botKey: pd.bot || null,
        model: pd.model || pd.bot || 'sarge',
        look: model.look,
        gender: model.gender,
        skill: pd.skill || 3,
        team: pd.team || (this.teamGame ? (this.players.filter(q => q.team === 'red').length <= this.players.filter(q => q.team === 'blue').length ? 'red' : 'blue') : null),
        handicap: pd.handicap || 100,
        ping: pd.ping || 0,
        joinTime: this.time,
        score: 0, deaths: 0, kills: 0,
        stats: { shots: new Array(10).fill(0), hits: new Array(10).fill(0), excellent: 0, impressive: 0, gauntlet: 0, damage: 0, taken: 0, pickups: 0 },
        alive: false,
        respawnAt: 0,
        deadTime: -100,
        ps: this.newPs(),
        health: 0, armor: 0,
        weapons: new Array(10).fill(false),
        ammo: new Array(10).fill(0),
        weapon: WP.MACHINEGUN, weaponState: 'ready', weaponTime: 0, pendingWeapon: 0,
        powerups: {}, holdable: null,
        lastFire: -10, lastHit: -10, lastPain: -10, lastKillTime: -100, accurateCount: 0,
        firing: false, lgTarget: null, lgEnd: null,
        lastAttacker: null, lastHurt: -10, damageDir: null,
        painDebounce: 0, lavaNext: 0, timerResidual: 0,
        forceView: null, gesture: -10, deathAnim: 0, spawnTime: 0,
        chatCd: 0, attackHeld: false, noclip: false
      };
      this.players.push(p);
      if (bot && Q.BotAI) p.ai = new Q.BotAI(this, p);
      this.spawn(p, true);
      if (p.ai && this.rng() < 0.5 && bot.hello) this.chat(p, this.rng.pick(bot.hello));
      return p;
    }

    removePlayer(p) {
      const i = this.players.indexOf(p);
      if (i >= 0) this.players.splice(i, 1);
    }

    newPs() {
      return { origin: [0, 0, 0], velocity: [0, 0, 0], yaw: 0, pitch: 0, onGround: false, groundNormal: null, ducked: false, viewheight: Q.VIEWHEIGHT, pmFlags: 0, pmTime: 0, waterLevel: 0, waterType: 0, dead: false, speed: 320, events: [], mins: Q.PLAYER_MINS, maxs: Q.PLAYER_MAXS, time: 0, stepUp: 0 };
    }

    chat(p, text) {
      this.emit({ t: 'chat', p: p.id, name: p.name, text, team: p.team });
    }

    pickSpawn(p, avoid) {
      const spots = [];
      for (const s of this.world.spawns) {
        if (this.spotTelefrag(s.pos, p)) continue;
        spots.push({ s, d: avoid ? Q.vdist(avoid, s.pos) : this.rng() * 1000 });
      }
      if (!spots.length) return this.world.spawns[this.rng.int(this.world.spawns.length)];
      spots.sort((a, b) => b.d - a.d);
      const n = Math.max(1, Math.floor(spots.length / 2));
      return spots[Math.min(spots.length - 1, Math.floor(this.rng() * n))].s;
    }

    spotTelefrag(pos, self) {
      const mn = Q.vadd(pos, Q.PLAYER_MINS), mx = Q.vadd(pos, Q.PLAYER_MAXS);
      return this.players.some(q => q !== self && q.alive && Q.boxOverlap(mn, mx, Q.vadd(q.ps.origin, q.ps.mins), Q.vadd(q.ps.origin, q.ps.maxs)));
    }

    spawn(p, initial) {
      if (!initial && p.ps.origin && p.alive === false && p.deadTime > -100) this.makeBody(p);
      const spot = this.pickSpawn(p, initial ? null : p.ps.origin);
      p.ps = this.newPs();
      p.ps.origin = spot.pos.slice();
      p.ps.yaw = spot.yaw;
      p.ps.time = this.time;
      p.forceView = { yaw: spot.yaw, pitch: 0 };
      p.alive = true;
      p.health = 125;
      p.armor = 0;
      p.weapons = new Array(10).fill(false);
      p.ammo = new Array(10).fill(0);
      p.powerups = {};
      p.holdable = null;
      p.accurateCount = 0;
      p.weaponTime = 0;
      p.weaponState = 'ready';
      p.pendingWeapon = 0;
      p.lastAttacker = null;
      p.spawnTime = this.time;
      p.timerResidual = 0;
      p.firing = false;
      if (this.mod === 'instagib') {
        p.weapons[WP.GAUNTLET] = true; p.weapons[WP.RAILGUN] = true; p.ammo[WP.RAILGUN] = 999; p.weapon = WP.RAILGUN; p.health = 100;
      } else if (this.mod === 'arsenal') {
        for (let w = 1; w <= 9; w++) { p.weapons[w] = true; p.ammo[w] = w === WP.GAUNTLET ? -1 : w === WP.BFG ? 20 : w === WP.LIGHTNING || w === WP.MACHINEGUN || w === WP.PLASMA ? 150 : 25; }
        p.health = 100; p.armor = 100; p.weapon = WP.ROCKET;
      } else {
        p.weapons[WP.GAUNTLET] = true; p.weapons[WP.MACHINEGUN] = true;
        p.ammo[WP.MACHINEGUN] = this.teamGame ? 50 : 100;
        p.ammo[WP.GAUNTLET] = -1;
        p.weapon = WP.MACHINEGUN;
      }
      this.killBox(p);
      if (p.ai) p.ai.onSpawn();
      if (!initial) this.emit({ t: 'teleport_in', pos: p.ps.origin.slice(), p: p.id });
      this.emit({ t: 'respawn', p: p.id });
    }

    killBox(p) {
      const mn = Q.vadd(p.ps.origin, p.ps.mins), mx = Q.vadd(p.ps.origin, p.ps.maxs);
      for (const q of this.players) {
        if (q === p || !q.alive) continue;
        if (Q.boxOverlap(mn, mx, Q.vadd(q.ps.origin, q.ps.mins), Q.vadd(q.ps.origin, q.ps.maxs))) {
          this.damage(q, p, p, null, q.ps.origin, 100000, { noProtect: true, noKnock: true }, 'telefrag');
        }
      }
    }

    makeBody(p) {
      this.bodies.push({ pos: p.ps.origin.slice(), yaw: p.ps.yaw, look: p.look, model: p.model, team: p.team, deathAnim: p.deathAnim, t0: p.deadTime, health: Math.min(0, p.health), gibbed: !!p.gibbed, sinkAt: this.time + 5, removeAt: this.time + 6.5, vel: p.ps.velocity.slice() });
      if (this.bodies.length > 8) this.bodies.shift();
    }

    ranking() {
      return this.players.slice().sort((a, b) => b.score - a.score || a.deaths - b.deaths || a.id - b.id);
    }

    rankOf(p) {
      const higher = this.players.filter(q => q.score > p.score).length;
      const tied = this.players.some(q => q !== p && q.score === p.score);
      return { rank: higher + 1, tied };
    }

    leaderScore() {
      if (this.teamGame) return Math.max(this.teamScores.red, this.teamScores.blue);
      let m = -Infinity;
      for (const p of this.players) m = Math.max(m, p.score);
      return this.players.length ? m : 0;
    }

    moveTrace(p) {
      return (a, b, mins, maxs) => {
        const t = this.world.trace(a, b, mins, maxs, Q.MASK_PLAYER);
        const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const len = Q.vlen(d);
        if (len < 1e-6) return t;
        for (const q of this.players) {
          if (q === p || !q.alive) continue;
          const bmin = [q.ps.origin[0] + q.ps.mins[0] - maxs[0], q.ps.origin[1] + q.ps.mins[1] - maxs[1], q.ps.origin[2] + q.ps.mins[2] - maxs[2]];
          const bmax = [q.ps.origin[0] + q.ps.maxs[0] - mins[0], q.ps.origin[1] + q.ps.maxs[1] - mins[1], q.ps.origin[2] + q.ps.maxs[2] - mins[2]];
          const h = rayBoxNormal(a, d, bmin, bmax, t.fraction);
          if (!h || h.inside) continue;
          const f = Math.max(0, h.f - 0.125 / len);
          if (f < t.fraction) {
            t.fraction = f;
            t.normal = h.normal;
            t.endpos = [a[0] + d[0] * f, a[1] + d[1] * f, a[2] + d[2] * f];
            t.entity = q;
            t.mat = null;
          }
        }
        return t;
      };
    }

    shotTrace(start, end, pass, ignore) {
      const t = this.world.trace(start, end, ZERO, ZERO, Q.MASK_SHOT);
      const d = [end[0] - start[0], end[1] - start[1], end[2] - start[2]];
      t.player = null;
      t.body = null;
      for (const q of this.players) {
        if (q === pass || !q.alive || (ignore && ignore.includes(q))) continue;
        const bmin = Q.vadd(q.ps.origin, q.ps.mins), bmax = Q.vadd(q.ps.origin, q.ps.maxs);
        const h = rayBoxNormal(start, d, bmin, bmax, t.fraction);
        if (!h) continue;
        if (h.f <= t.fraction) {
          t.fraction = h.f;
          t.normal = h.normal;
          t.endpos = [start[0] + d[0] * h.f, start[1] + d[1] * h.f, start[2] + d[2] * h.f];
          t.player = q;
          t.body = null;
          t.mat = null;
        }
      }
      for (const b of this.bodies) {
        if (b.gibbed || (ignore && ignore.includes(b))) continue;
        const bmin = [b.pos[0] - 15, b.pos[1] - 15, b.pos[2] - 24], bmax = [b.pos[0] + 15, b.pos[1] + 15, b.pos[2] - 8];
        const h = rayBoxNormal(start, d, bmin, bmax, t.fraction);
        if (!h || h.f > t.fraction) continue;
        t.fraction = h.f;
        t.normal = h.normal;
        t.endpos = [start[0] + d[0] * h.f, start[1] + d[1] * h.f, start[2] + d[2] * h.f];
        t.player = null;
        t.body = b;
      }
      return t;
    }

    step(localCmd) {
      const dt = Q.TICK;
      this.time += dt;
      this.tick++;
      if (this.state === 'intermission') {
        for (const p of this.players) if (p.ai) p.ai.intermission();
        return;
      }
      if (this.state === 'warmup' && this.time >= this.warmupEnd) {
        this.state = 'play';
        this.matchStart = this.time;
        this.emit({ t: 'announce', say: 'fight' });
      }
      if (this.state === 'play') this.matchTime = this.time - this.matchStart;
      for (const p of this.players) {
        let cmd;
        if (p.human) cmd = localCmd || { forward: 0, right: 0, up: 0, yaw: p.ps.yaw, pitch: p.ps.pitch };
        else if (p.ai) cmd = p.ai.think();
        else cmd = { forward: 0, right: 0, up: 0, yaw: p.ps.yaw, pitch: p.ps.pitch };
        this.clientThink(p, cmd);
      }
      this.runProjectiles(dt);
      this.runItems();
      this.runBodies(dt);
      if (this.state === 'play') this.checkRules();
      else if (this.state === 'exiting' && this.time >= this.intermissionAt) this.beginIntermission();
    }

    clientThink(p, cmd) {
      const frozen = this.state === 'warmup' || this.state === 'exiting';
      if (!p.alive) {
        p.ps.dead = true;
        Q.pmove(p.ps, { forward: 0, right: 0, up: 0 }, Q.TICK, this.moveTrace(p), q => this.world.pointContents(q));
        p.ps.events.length = 0;
        const want = cmd.attack && !p.attackHeld;
        p.attackHeld = !!cmd.attack;
        if (this.state !== 'play' && this.state !== 'warmup') return;
        if (this.time >= p.respawnAt && (want || p.ai || this.time >= p.deadTime + Q.FORCE_RESPAWN)) this.spawn(p, false);
        return;
      }
      p.attackHeld = !!cmd.attack;
      p.ps.yaw = Q.wrapAng(cmd.yaw);
      p.ps.pitch = Q.clamp(cmd.pitch, -PITCH_MAX, PITCH_MAX);
      p.ps.speed = p.powerups.haste > this.time ? 416 : 320;
      p.ps.time = this.time;
      const pm = frozen ? { forward: 0, right: 0, up: 0 } : cmd;
      if (p.noclip) {
        const av = Q.angleVectors(p.ps.yaw, p.ps.pitch);
        const sp = 600 * Q.TICK / 127;
        p.ps.origin = Q.vma(Q.vma(Q.vma(p.ps.origin, (pm.forward || 0) * sp, av.fwd), (pm.right || 0) * sp, av.right), (pm.up || 0) * sp, [0, 0, 1]);
        p.ps.velocity = [0, 0, 0];
      } else {
        Q.pmove(p.ps, pm, Q.TICK, this.moveTrace(p), q => this.world.pointContents(q));
      }
      for (const ev of p.ps.events) this.playerEvent(p, ev);
      p.ps.events.length = 0;
      this.footsteps(p);
      if (!frozen) {
        this.touchTriggers(p);
        if (!p.alive) return;
        this.touchItems(p);
        this.weaponThink(p, cmd);
        if (cmd.useItem && p.holdable && !p.useHeld) this.useHoldable(p);
        p.useHeld = !!cmd.useItem;
        if (cmd.gesture && this.time - p.gesture > 2.5) { p.gesture = this.time; this.emit({ t: 'gesture', p: p.id }); }
      }
      this.worldEffects(p);
      this.timerActions(p);
      for (const k of Q.POWERUPS) {
        if (p.powerups[k] && p.powerups[k] <= this.time) { delete p.powerups[k]; this.emit({ t: 'powerup_end', p: p.id, pw: k }); }
        else if (p.powerups[k] && p.powerups[k] - this.time < 3 && !p['warn_' + k] && p.powerups[k] - this.time > 0) { p['warn_' + k] = true; this.emit({ t: 'powerup_warn', p: p.id, pw: k }); }
      }
    }

    playerEvent(p, ev) {
      if (ev === 'jump') this.emit({ t: 'jump', p: p.id });
      else if (ev === 'land') this.emit({ t: 'land', p: p.id });
      else if (ev === 'fall_medium') { this.emit({ t: 'fall', p: p.id, far: false }); this.damage(p, null, null, null, p.ps.origin, 5, { noArmor: true, noKnock: true }, 'falling'); }
      else if (ev === 'fall_far') { this.emit({ t: 'fall', p: p.id, far: true }); this.damage(p, null, null, null, p.ps.origin, 10, { noArmor: true, noKnock: true }, 'falling'); }
    }

    footsteps(p) {
      if (!p.ps.onGround) { p.stepPhase = 0; return; }
      const sp = Q.vlen2(p.ps.velocity);
      if (sp < 200 || p.ps.ducked) return;
      p.stepPhase = (p.stepPhase || 0) + sp * Q.TICK;
      if (p.stepPhase > 132) {
        p.stepPhase -= 132;
        this.emit({ t: 'footstep', p: p.id, metal: !!Q.matInfo(p.ps.groundMat).metal });
      }
    }

    touchTriggers(p) {
      const mn = Q.vadd(p.ps.origin, p.ps.mins), mx = Q.vadd(p.ps.origin, p.ps.maxs);
      let onPad = null;
      for (const pad of this.pads) {
        if (!Q.boxOverlap(mn, mx, pad.min, pad.max)) continue;
        onPad = pad;
        p.ps.velocity = pad.vel.slice();
        p.ps.onGround = false;
        p.ps.noFallUntil = this.time + 3;
        if (p.lastPad !== pad) this.emit({ t: 'jumppad', p: p.id, pos: pad.pos.slice() });
        break;
      }
      p.lastPad = onPad;
      for (const tp of this.world.teles) {
        if (!Q.boxOverlap(mn, mx, tp.min, tp.max)) continue;
        this.teleport(p, tp.dest, tp.yaw);
        return;
      }
      for (const h of this.world.hurts) {
        if (!Q.boxOverlap(mn, mx, h.min, h.max)) continue;
        this.damage(p, null, null, null, p.ps.origin, h.dmg, { noProtect: true, noKnock: true }, h.mod);
        if (!p.alive) return;
      }
    }

    teleport(p, dest, yaw) {
      this.emit({ t: 'teleport_out', pos: p.ps.origin.slice(), p: p.id });
      p.ps.origin = [dest[0], dest[1], dest[2] + 1];
      p.ps.velocity = [Math.cos(yaw) * 400, Math.sin(yaw) * 400, 0];
      p.ps.pmTime = 160;
      p.ps.pmFlags |= Q.PMF.TIME_KNOCKBACK;
      p.ps.yaw = yaw;
      p.ps.pitch = 0;
      p.forceView = { yaw, pitch: 0 };
      p.teleported = this.time;
      this.killBox(p);
      this.emit({ t: 'teleport_in', pos: p.ps.origin.slice(), p: p.id });
      if (p.ai) p.ai.onTeleport();
    }

    canGrab(p, it) {
      const d = it.def;
      if (d.type === 'weapon') return true;
      if (d.type === 'ammo') return p.ammo[d.wp] < Q.MAX_AMMO;
      if (d.type === 'armor') return p.armor < 200;
      if (d.type === 'health') return d.max === 200 ? p.health < 200 : p.health < 100;
      if (d.type === 'powerup') return true;
      if (d.type === 'holdable') return !p.holdable;
      return false;
    }

    touchItems(p) {
      const mn = Q.vadd(p.ps.origin, p.ps.mins), mx = Q.vadd(p.ps.origin, p.ps.maxs);
      for (const it of this.items) {
        if (!it.active) continue;
        if (!Q.boxOverlap(mn, mx, Q.vadd(it.pos, ITEM_MINS), Q.vadd(it.pos, ITEM_MAXS))) continue;
        if (!this.canGrab(p, it)) continue;
        this.pickup(p, it, false);
        it.active = false;
        it.taken = true;
        it.respawnAt = this.time + it.def.respawn;
      }
      for (let i = this.dropped.length - 1; i >= 0; i--) {
        const it = this.dropped[i];
        if (this.time - it.dropTime < 0.5 && it.owner === p.id) continue;
        if (!Q.boxOverlap(mn, mx, Q.vadd(it.pos, ITEM_MINS), Q.vadd(it.pos, ITEM_MAXS))) continue;
        if (!this.canGrab(p, it)) continue;
        this.pickup(p, it, true);
        this.dropped.splice(i, 1);
      }
    }

    pickup(p, it, dropped) {
      const d = it.def;
      if (d.type === 'weapon') {
        let q = Q.WEAPONS[d.wp].pickup;
        if (!dropped) q = p.ammo[d.wp] < q ? q - p.ammo[d.wp] : 1;
        const had = p.weapons[d.wp];
        p.weapons[d.wp] = true;
        p.ammo[d.wp] = Math.min(Q.MAX_AMMO, p.ammo[d.wp] + q);
        if (!had && p.human && this.o.autoswitch !== false && !p.firing) this.selectWeapon(p, d.wp);
        if (p.ai) p.ai.onPickup(it);
      } else if (d.type === 'ammo') {
        p.ammo[d.wp] = Math.min(Q.MAX_AMMO, p.ammo[d.wp] + d.amount);
      } else if (d.type === 'armor') {
        p.armor = Math.min(200, p.armor + d.amount);
      } else if (d.type === 'health') {
        p.health = Math.min(d.max, p.health + d.amount);
      } else if (d.type === 'powerup') {
        const base = p.powerups[d.pw] && p.powerups[d.pw] > this.time ? p.powerups[d.pw] : this.time;
        p.powerups[d.pw] = base + (it.remaining || Q.POWERUP_TIME);
        p['warn_' + d.pw] = false;
        this.emit({ t: 'powerup', p: p.id, pw: d.pw });
      } else if (d.type === 'holdable') {
        p.holdable = d.hold;
      }
      p.stats.pickups++;
      this.emit({ t: 'pickup', p: p.id, key: it.key, pos: it.pos.slice() });
    }

    swapAlt(it) {
      const k = it.key;
      it.key = it.alt;
      it.alt = k;
      it.def = Q.ITEMS[it.key];
    }

    runItems() {
      for (const it of this.items) {
        if (!it.active && this.time >= it.respawnAt) {
          if (it.alt && it.taken) this.swapAlt(it);
          it.taken = false;
          it.active = true;
          this.emit({ t: 'item_respawn', key: it.key, pos: it.pos.slice() });
        }
      }
      for (let i = this.dropped.length - 1; i >= 0; i--) {
        const it = this.dropped[i];
        if (this.time - it.dropTime > 30) { this.dropped.splice(i, 1); continue; }
        if (!it.rest) {
          it.vel[2] -= Q.GRAVITY * Q.TICK;
          const end = Q.vma(it.pos, Q.TICK, it.vel);
          const t = this.world.trace(it.pos, end, ITEM_MINS, ITEM_MAXS, Q.MASK_PLAYER);
          it.pos = t.endpos;
          if (t.fraction < 1) {
            if (t.normal[2] > 0.7) { it.rest = true; it.vel = [0, 0, 0]; }
            else it.vel = Q.clipVelocity(it.vel, t.normal, 1.5);
          }
          if (this.world.pointContents(it.pos) & Q.MASK_LIQUID) this.dropped.splice(i, 1);
        }
      }
    }

    dropItem(p, key, extra) {
      const def = Q.ITEMS[key];
      const a = p.ps.yaw + (this.rng() - 0.5) * 1.2;
      const it = Object.assign({ id: 'd' + (this.nextId++), key, def, pos: [p.ps.origin[0], p.ps.origin[1], p.ps.origin[2] + 8], vel: [Math.cos(a) * 150, Math.sin(a) * 150, 200], dropTime: this.time, owner: p.id, active: true, spin: this.rng() * 6, dropped: true }, extra || {});
      this.dropped.push(it);
    }

    useHoldable(p) {
      if (p.holdable === 'medkit') {
        p.health = Math.max(p.health, 125);
        this.emit({ t: 'use_medkit', p: p.id });
      } else if (p.holdable === 'teleporter') {
        const s = this.pickSpawn(p, p.ps.origin);
        this.teleport(p, [s.pos[0], s.pos[1], s.pos[2] - 25], s.yaw);
      }
      p.holdable = null;
    }

    worldEffects(p) {
      if (!p.alive) return;
      if (p.ps.waterLevel && (p.ps.waterType & (C.LAVA | C.SLIME))) {
        if (this.time >= p.lavaNext) {
          p.lavaNext = this.time + 0.7;
          if (p.powerups.battlesuit > this.time) this.emit({ t: 'battlesuit', p: p.id });
          else if (p.ps.waterType & C.LAVA) this.damage(p, null, null, null, p.ps.origin, 30 * p.ps.waterLevel, { noKnock: true }, 'lava');
          else this.damage(p, null, null, null, p.ps.origin, 10 * p.ps.waterLevel, { noKnock: true }, 'slime');
        }
      }
    }

    timerActions(p) {
      if (!p.alive) return;
      p.timerResidual += Q.TICK;
      if (p.timerResidual < 1) return;
      p.timerResidual -= 1;
      if (p.powerups.regen > this.time) {
        if (p.health < 100) { p.health = Math.min(110, p.health + 15); this.emit({ t: 'regen', p: p.id }); }
        else if (p.health < 200) { p.health = Math.min(200, p.health + 5); this.emit({ t: 'regen', p: p.id }); }
      } else if (p.health > 100) p.health--;
      if (p.armor > 100) p.armor--;
    }

    selectWeapon(p, w) {
      if (!p.weapons[w] || w === p.weapon && !p.pendingWeapon) return false;
      if (p.ammo[w] === 0 && w !== WP.GAUNTLET) return false;
      if (w === p.weapon) { p.pendingWeapon = 0; return true; }
      p.pendingWeapon = w;
      return true;
    }

    bestWeapon(p) {
      const order = [WP.RAILGUN, WP.LIGHTNING, WP.ROCKET, WP.PLASMA, WP.SHOTGUN, WP.BFG, WP.GRENADE, WP.MACHINEGUN];
      for (const w of order) if (p.weapons[w] && p.ammo[w] > 0 && w !== WP.GRENADE) return w;
      if (p.weapons[WP.GRENADE] && p.ammo[WP.GRENADE] > 0) return WP.GRENADE;
      return WP.GAUNTLET;
    }

    weaponThink(p, cmd) {
      const dtms = Q.TICK * 1000;
      if (cmd.weapon && cmd.weapon !== p.weapon && cmd.weapon !== p.pendingWeapon) this.selectWeapon(p, cmd.weapon);
      if (p.weaponTime > 0) p.weaponTime -= dtms;
      p.firing = false;
      if (p.pendingWeapon && p.weaponState !== 'dropping' && p.weaponState !== 'raising' && p.weaponTime <= 0) {
        p.weaponState = 'dropping';
        p.weaponTime += Q.WEAPON_DROP_TIME;
        this.emit({ t: 'weapon_drop', p: p.id });
      }
      if (p.weaponTime > 0) { p.lgEnd = null; return; }
      if (p.weaponState === 'dropping') {
        if (p.pendingWeapon) p.weapon = p.pendingWeapon;
        p.pendingWeapon = 0;
        p.weaponState = 'raising';
        p.weaponTime += Q.WEAPON_RAISE_TIME;
        this.emit({ t: 'weapon_raise', p: p.id, wp: p.weapon });
        return;
      }
      if (p.weaponState === 'raising') p.weaponState = 'ready';
      if (!cmd.attack) { p.weaponState = 'ready'; p.lgEnd = null; return; }
      const w = p.weapon;
      if (w !== WP.GAUNTLET && p.ammo[w] === 0) {
        this.emit({ t: 'noammo', p: p.id });
        p.weaponTime += 500;
        const b = this.bestWeapon(p);
        if (b !== w) this.selectWeapon(p, b);
        return;
      }
      if (w === WP.GAUNTLET && !this.gauntletHit(p)) { p.weaponTime = 0; p.weaponState = 'ready'; p.firing = true; return; }
      p.weaponState = 'firing';
      p.firing = true;
      if (w !== WP.GAUNTLET && p.ammo[w] > 0 && this.mod !== 'instagib') p.ammo[w]--;
      let add = Q.WEAPONS[w].refire;
      if (p.powerups.haste > this.time) add /= 1.3;
      p.weaponTime += add;
      p.lastFire = this.time;
      this.fire(p, w);
    }

    muzzle(p) {
      const av = Q.angleVectors(p.ps.yaw, p.ps.pitch);
      const eye = [p.ps.origin[0], p.ps.origin[1], p.ps.origin[2] + p.ps.viewheight];
      return { av, eye, start: Q.vma(eye, 14, av.fwd) };
    }

    gauntletHit(p) {
      const { av, start } = this.muzzle(p);
      const t = this.shotTrace(start, Q.vma(start, 32, av.fwd), p);
      if (!t.player) return false;
      p.gauntletTarget = t.player;
      return true;
    }

    fire(p, w) {
      const quad = p.powerups.quad > this.time ? 3 : 1;
      const { av, start } = this.muzzle(p);
      p.stats.shots[w]++;
      this.emit({ t: 'fire', p: p.id, wp: w, quad: quad > 1, pos: start.slice(), dir: av.fwd.slice() });
      if (w === WP.GAUNTLET) {
        const t = this.shotTrace(start, Q.vma(start, 32, av.fwd), p);
        if (t.player) {
          p.stats.hits[w]++;
          this.damage(t.player, p, p, av.fwd, t.endpos, 50 * quad, {}, 'gauntlet');
          this.emit({ t: 'gauntlet_hit', p: p.id, pos: t.endpos });
        }
      } else if (w === WP.MACHINEGUN) {
        this.bullet(p, start, av, Q.WEAPONS[w].spread, (this.teamGame ? 5 : 7) * quad, 'machinegun', w);
      } else if (w === WP.SHOTGUN) {
        let hitAny = false;
        for (let i = 0; i < 11; i++) {
          const r = this.rng.crandom() * 700, u = this.rng.crandom() * 700;
          const end = Q.vma(Q.vma(Q.vma(start, 8192, av.fwd), r * 0.5, av.right), u * 0.5, av.up);
          const t = this.shotTrace(start, end, p);
          if (t.player) { hitAny = true; this.damage(t.player, p, p, av.fwd, t.endpos, 10 * quad, {}, 'shotgun'); this.emit({ t: 'blood', pos: t.endpos, p: t.player.id, n: 1 }); }
          else if (t.body) this.hitBody(t.body, 10 * quad, t.endpos);
          else if (t.fraction < 1 && !Q.matInfo(t.mat).noimpact) this.emit({ t: 'pellet', pos: t.endpos, normal: t.normal, mat: t.mat });
        }
        if (hitAny) p.stats.hits[w]++;
      } else if (w === WP.LIGHTNING) {
        const end = Q.vma(start, 768, av.fwd);
        const t = this.shotTrace(start, end, p);
        p.lgEnd = t.endpos;
        this.emit({ t: 'lightning', p: p.id, from: start, to: t.endpos, hit: !!t.player, normal: t.normal, mat: t.mat, world: t.fraction < 1 && !t.player });
        if (t.player) { p.stats.hits[w]++; this.damage(t.player, p, p, av.fwd, t.endpos, 8 * quad, {}, 'lightning'); }
        else if (t.body) this.hitBody(t.body, 8 * quad, t.endpos);
      } else if (w === WP.RAILGUN) {
        this.rail(p, start, av, quad);
      } else if (w === WP.ROCKET) {
        this.missile(p, 'rocket', start, Q.vscale(av.fwd, 900), 100 * quad, 100 * quad, 120, 'rocket');
      } else if (w === WP.GRENADE) {
        const dir = Q.vnorm([av.fwd[0], av.fwd[1], av.fwd[2] + 0.2]);
        this.missile(p, 'grenade', start, Q.vscale(dir, 700), 100 * quad, 100 * quad, 150, 'grenade');
      } else if (w === WP.PLASMA) {
        this.missile(p, 'plasma', start, Q.vscale(av.fwd, 2000), 20 * quad, 15 * quad, 20, 'plasma');
      } else if (w === WP.BFG) {
        this.missile(p, 'bfg', start, Q.vscale(av.fwd, 2000), 100 * quad, 100 * quad, 120, 'bfg');
      }
    }

    bullet(p, start, av, spread, dmg, mod, w) {
      const ang = this.rng() * Math.PI * 2;
      const r = Math.sin(ang) * this.rng.crandom() * spread * 16, u = Math.cos(ang) * this.rng.crandom() * spread * 16;
      const end = Q.vma(Q.vma(Q.vma(start, 8192, av.fwd), r / 16, av.right), u / 16, av.up);
      const t = this.shotTrace(start, end, p);
      if (t.player) {
        p.stats.hits[w]++;
        this.damage(t.player, p, p, av.fwd, t.endpos, dmg, {}, mod);
        this.emit({ t: 'blood', pos: t.endpos, p: t.player.id, n: 1 });
      } else if (t.body) this.hitBody(t.body, dmg, t.endpos);
      else if (t.fraction < 1 && !Q.matInfo(t.mat).noimpact) this.emit({ t: 'bullet', pos: t.endpos, normal: t.normal, mat: t.mat });
    }

    rail(p, start, av, quad) {
      const end = Q.vma(start, 8192, av.fwd);
      const ignore = [];
      let from = start, hits = 0, last = null;
      for (let i = 0; i < 5; i++) {
        const t = this.shotTrace(from, end, p, ignore);
        last = t;
        if (t.player) {
          hits++;
          ignore.push(t.player);
          this.damage(t.player, p, p, av.fwd, t.endpos, (this.mod === 'instagib' ? 1000 : 100) * quad, {}, 'railgun');
          this.emit({ t: 'blood', pos: t.endpos, p: t.player.id, n: 3 });
          from = t.endpos;
          continue;
        }
        if (t.body) { ignore.push(t.body); this.hitBody(t.body, 100 * quad, t.endpos); from = t.endpos; continue; }
        break;
      }
      const to = last ? last.endpos : end;
      this.emit({ t: 'rail', p: p.id, from: start, to, normal: last && last.fraction < 1 ? last.normal : null, mat: last ? last.mat : null, sky: last && Q.matInfo(last.mat).noimpact });
      if (hits) {
        p.stats.hits[WP.RAILGUN]++;
        p.accurateCount++;
        if (p.accurateCount >= 2) {
          p.accurateCount -= 2;
          p.stats.impressive++;
          this.emit({ t: 'award', p: p.id, award: 'impressive' });
        }
      } else p.accurateCount = 0;
    }

    missile(p, kind, start, vel, dmg, splash, radius, mod) {
      const m = { id: this.nextId++, kind, owner: p.id, ownerRef: p, pos: start.slice(), vel: vel.slice(), dmg, splash, radius, mod, born: this.time, quad: p.powerups.quad > this.time };
      const t = this.shotTrace(Q.vma(p.ps.origin, p.ps.viewheight, [0, 0, 1]), start, p);
      if (t.fraction < 1) m.pos = Q.vma(t.endpos, -1, Q.vnorm(vel));
      this.projectiles.push(m);
      return m;
    }

    runProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const m = this.projectiles[i];
        if (m.kind === 'grenade') {
          if (this.time - m.born >= 2.5) { this.explode(m, null, [0, 0, 1], null); this.projectiles.splice(i, 1); continue; }
          if (!m.rest) m.vel[2] -= Q.GRAVITY * dt;
        } else if (this.time - m.born > 10) { this.projectiles.splice(i, 1); continue; }
        if (m.rest) continue;
        const end = Q.vma(m.pos, dt, m.vel);
        const owner = this.players.find(q => q.id === m.owner);
        const t = this.shotTrace(m.pos, end, owner);
        if (t.fraction >= 1) { m.pos = end; continue; }
        if (Q.matInfo(t.mat).noimpact && !t.player && !t.body) { this.projectiles.splice(i, 1); continue; }
        if (m.kind === 'grenade' && !t.player && !t.body) {
          const v = m.vel;
          const dot = Q.vdot(v, t.normal);
          m.vel = Q.vscale(Q.vma(v, -2 * dot, t.normal), 0.65);
          m.pos = Q.vma(t.endpos, 0.5, t.normal);
          if (t.normal[2] > 0.2 && Q.vlen(m.vel) < 40) { m.rest = true; m.vel = [0, 0, 0]; }
          else this.emit({ t: 'bounce', pos: m.pos.slice() });
          continue;
        }
        m.pos = t.endpos;
        this.explode(m, t.player || null, t.normal || [0, 0, 1], t.mat, t.body);
        this.projectiles.splice(i, 1);
      }
    }

    explode(m, hitPlayer, normal, mat, body) {
      const owner = this.players.find(q => q.id === m.owner) || null;
      if (hitPlayer) {
        if (owner) owner.stats.hits[this.wpOfKind(m.kind)]++;
        this.damage(hitPlayer, owner, owner, Q.vnorm(m.vel), m.pos, m.dmg, {}, m.mod);
        this.emit({ t: 'blood', pos: m.pos.slice(), p: hitPlayer.id, n: 2 });
      }
      if (body) this.hitBody(body, m.dmg, m.pos);
      const pos = hitPlayer ? m.pos : Q.vma(m.pos, 1, normal);
      this.radiusDamage(pos, owner, m.splash, m.radius, hitPlayer, m.mod + '_splash', m.kind);
      this.emit({ t: 'explode', kind: m.kind, pos: pos.slice(), normal: normal.slice(), mat, quad: m.quad, direct: !!hitPlayer });
    }

    wpOfKind(kind) {
      return kind === 'rocket' ? WP.ROCKET : kind === 'grenade' ? WP.GRENADE : kind === 'plasma' ? WP.PLASMA : WP.BFG;
    }

    canDamage(targetPos, origin) {
      const offs = [[0, 0], [15, 15], [15, -15], [-15, 15], [-15, -15]];
      for (const o of offs) {
        const dest = [targetPos[0] + o[0], targetPos[1] + o[1], targetPos[2]];
        if (this.world.trace(origin, dest, ZERO, ZERO, Q.MASK_SHOT).fraction >= 1) return true;
      }
      return false;
    }

    radiusDamage(origin, attacker, dmg, radius, ignore, mod, kind) {
      if (radius < 1) radius = 1;
      let hitSomeone = false;
      for (const q of this.players.slice()) {
        if (!q.alive || q === ignore) continue;
        const mn = Q.vadd(q.ps.origin, q.ps.mins), mx = Q.vadd(q.ps.origin, q.ps.maxs);
        const v = [0, 0, 0];
        for (let i = 0; i < 3; i++) v[i] = origin[i] < mn[i] ? mn[i] - origin[i] : origin[i] > mx[i] ? origin[i] - mx[i] : 0;
        const dist = Q.vlen(v);
        if (dist >= radius) continue;
        const points = dmg * (1 - dist / radius);
        if (!this.canDamage(q.ps.origin, origin)) continue;
        if (attacker && q !== attacker && !this.sameTeam(q, attacker)) hitSomeone = true;
        const dir = Q.vsub(q.ps.origin, origin);
        dir[2] += 24;
        this.damage(q, attacker, attacker, Q.vnorm(dir), origin, points, { radius: true }, mod);
      }
      for (const b of this.bodies) {
        if (b.gibbed) continue;
        const d = Q.vdist(b.pos, origin);
        if (d < radius) this.hitBody(b, dmg * (1 - d / radius), b.pos);
      }
      if (hitSomeone && attacker && ignore === null) attacker.stats.hits[this.wpOfKind(kind)]++;
      return hitSomeone;
    }

    hitBody(b, dmg, pos) {
      b.health -= dmg;
      if (b.health <= Q.GIB_HEALTH && !b.gibbed) {
        b.gibbed = true;
        this.emit({ t: 'gib', pos: [b.pos[0], b.pos[1], b.pos[2] - 12], body: true });
      } else this.emit({ t: 'blood', pos: pos.slice(), n: 1 });
    }

    sameTeam(a, b) {
      return this.teamGame && a && b && a.team && a.team === b.team;
    }

    damage(targ, inflictor, attacker, dir, point, dmg, flags, mod) {
      if (!targ.alive) return;
      if (this.state === 'intermission' || this.state === 'exiting') return;
      flags = flags || {};
      if (attacker && attacker !== targ && attacker.handicap < 100) dmg = dmg * attacker.handicap / 100;
      let knock = Math.min(200, dmg);
      if (!dir || flags.noKnock) knock = 0;
      if (knock) {
        const kv = Q.vscale(dir, 1000 * knock / 200);
        targ.ps.velocity = Q.vadd(targ.ps.velocity, kv);
        let tm = knock * 2;
        if (tm < 50) tm = 50;
        if (tm > 200) tm = 200;
        targ.ps.pmTime = tm;
        targ.ps.pmFlags |= Q.PMF.TIME_KNOCKBACK;
        targ.ps.onGround = false;
      }
      if (!flags.noProtect) {
        if (targ !== attacker && this.sameTeam(targ, attacker)) return;
        if ((this.god && targ.human) || targ.godmode) return;
      }
      if (targ.powerups.battlesuit > this.time) {
        this.emit({ t: 'battlesuit', p: targ.id });
        if (flags.radius || mod === 'falling') return;
        dmg *= 0.5;
      }
      if (targ === attacker && (this.mod === 'arsenal' || this.mod === 'instagib')) return;
      if (targ === attacker) dmg *= 0.5;
      if (dmg < 1) dmg = 1;
      let take = Math.round(dmg);
      if (!flags.noArmor && targ.armor > 0) {
        let save = Math.ceil(take * Q.ARMOR_PROTECTION);
        if (save >= targ.armor) save = targ.armor;
        targ.armor -= save;
        take -= save;
      }
      if (attacker && attacker !== targ) {
        targ.lastAttacker = attacker.id;
        attacker.stats.damage += take;
        this.emit({ t: 'hit', a: attacker.id, v: targ.id, dmg: take, team: this.sameTeam(targ, attacker) });
        if (targ.ai) targ.ai.onDamaged(attacker);
      }
      targ.lastHurt = this.time;
      targ.stats.taken += take;
      targ.damageDir = dir ? dir.slice() : null;
      if (take > 0) this.emit({ t: 'damage', v: targ.id, a: attacker ? attacker.id : 0, dmg: take, dir: dir ? dir.slice() : null, point: point ? point.slice() : null });
      targ.health -= take;
      if (targ.health <= 0) {
        if (targ.health < -999) targ.health = -999;
        this.kill(targ, attacker, mod);
      } else if (this.time >= targ.painDebounce) {
        targ.painDebounce = this.time + 0.7;
        this.emit({ t: 'pain', p: targ.id, health: targ.health });
      }
    }

    kill(p, attacker, mod) {
      if (!p.alive) return;
      p.alive = false;
      p.ps.dead = true;
      p.deadTime = this.time;
      p.respawnAt = this.time + Q.RESPAWN_DELAY + (p.ai ? 0.3 + this.rng() * 0.8 : 0);
      p.deaths++;
      p.firing = false;
      p.lgEnd = null;
      p.deathAnim = this.rng.int(3);
      p.gibbed = p.health <= Q.GIB_HEALTH || mod === 'suicide';
      const killer = attacker && attacker !== p ? attacker : null;
      if (killer) {
        if (this.sameTeam(p, killer)) { killer.score--; if (this.teamGame) this.teamScores[killer.team]--; }
        else {
          killer.score++;
          killer.kills++;
          if (this.teamGame) this.teamScores[killer.team]++;
          if (mod === 'gauntlet') { killer.stats.gauntlet++; this.emit({ t: 'award', p: killer.id, award: 'gauntlet' }); }
          if (this.time - killer.lastKillTime < Q.CARNAGE_TIME) { killer.stats.excellent++; this.emit({ t: 'award', p: killer.id, award: 'excellent' }); }
          killer.lastKillTime = this.time;
        }
      } else {
        p.score--;
        if (this.teamGame && p.team) this.teamScores[p.team]--;
      }
      const text = Q.obituary(p.name, killer ? killer.name : null, mod, p.gender);
      this.emit({ t: 'obit', text, v: p.id, a: killer ? killer.id : 0, mod });
      this.emit({ t: 'death', p: p.id, mod, gib: p.gibbed, pos: p.ps.origin.slice() });
      if (p.gibbed) this.emit({ t: 'gib', pos: p.ps.origin.slice(), p: p.id });
      if (this.mod === 'baseq3') {
        const w = p.weapon;
        if (w > WP.MACHINEGUN && p.ammo[w] > 0) {
          const key = Object.keys(Q.ITEMS).find(k => Q.ITEMS[k].type === 'weapon' && Q.ITEMS[k].wp === w);
          if (key) this.dropItem(p, key);
        }
        for (const k of Q.POWERUPS) {
          if (p.powerups[k] > this.time) {
            const key = Object.keys(Q.ITEMS).find(kk => Q.ITEMS[kk].pw === k);
            this.dropItem(p, key, { remaining: p.powerups[k] - this.time });
          }
        }
      }
      p.powerups = {};
      if (p.ai) p.ai.onDeath(killer);
      if (killer && killer.ai) killer.ai.onKill(p);
      this.checkLead();
    }

    checkLead() {
      const me = this.local;
      if (!me || this.teamGame) return;
      const r = this.rankOf(me);
      const st = r.rank === 1 ? (r.tied ? 'tied' : 'lead') : 'behind';
      if (this.leadState && st !== this.leadState && this.state === 'play') {
        this.emit({ t: 'announce', say: st === 'lead' ? 'taken_lead' : st === 'tied' ? 'tied_lead' : 'lost_lead' });
      }
      this.leadState = st;
    }

    checkRules() {
      const lead = this.leaderScore();
      if (this.fraglimit > 0) {
        for (const n of [3, 2, 1]) {
          if (lead === this.fraglimit - n && !this.fragWarned[n]) {
            this.fragWarned[n] = true;
            this.emit({ t: 'announce', say: n + '_frags' });
          }
        }
      }
      if (this.timelimit > 0) {
        const left = this.timelimit * 60 - this.matchTime;
        if (left <= 300 && left > 290 && !this.timeWarned[5] && this.timelimit > 5) { this.timeWarned[5] = true; this.emit({ t: 'announce', say: '5_minute' }); }
        if (left <= 60 && !this.timeWarned[1] && this.timelimit > 1) { this.timeWarned[1] = true; this.emit({ t: 'announce', say: '1_minute' }); }
      }
      const tied = this.scoreTied();
      if (this.fraglimit > 0 && lead >= this.fraglimit && !tied) return this.exitLevel('Fraglimit hit.');
      if (this.timelimit > 0 && this.matchTime >= this.timelimit * 60) {
        if (tied) {
          if (!this.sudden) { this.sudden = true; this.emit({ t: 'announce', say: 'sudden_death' }); }
          return;
        }
        return this.exitLevel('Timelimit hit.');
      }
    }

    scoreTied() {
      if (this.teamGame) return this.teamScores.red === this.teamScores.blue;
      const r = this.ranking();
      return r.length > 1 && r[0].score === r[1].score;
    }

    exitLevel(reason) {
      this.state = 'exiting';
      this.exitReason = reason;
      this.intermissionAt = this.time + 2;
      this.emit({ t: 'exit', reason });
    }

    beginIntermission() {
      this.state = 'intermission';
      this.intermissionStart = this.time;
      for (const p of this.players) {
        if (!p.alive) this.spawn(p, false);
        p.firing = false;
      }
      const winner = this.winner();
      for (const p of this.players) {
        const acc = this.accuracy(p);
        if (acc >= 0.5 && p.stats.shots.reduce((a, b) => a + b, 0) > 20) p.stats.accuracy = true;
        if (p === winner && p.deaths === 0 && !this.teamGame) p.stats.perfect = true;
      }
      this.emit({ t: 'intermission', winner: winner ? winner.id : 0, reason: this.exitReason });
      const me = this.local;
      if (me) {
        if (this.teamGame) this.emit({ t: 'announce', say: this.teamScores[me.team] > this.teamScores[me.team === 'red' ? 'blue' : 'red'] ? 'you_win' : 'you_lose' });
        else this.emit({ t: 'announce', say: winner === me ? 'you_win' : 'you_lose' });
      }
    }

    winner() {
      if (this.teamGame) {
        const t = this.teamScores.red >= this.teamScores.blue ? 'red' : 'blue';
        return this.ranking().find(p => p.team === t) || null;
      }
      return this.ranking()[0] || null;
    }

    accuracy(p) {
      let s = 0, h = 0;
      for (let w = 2; w <= 9; w++) { s += p.stats.shots[w]; h += p.stats.hits[w]; }
      return s ? h / s : 0;
    }

    runBodies() {
      for (let i = this.bodies.length - 1; i >= 0; i--) {
        const b = this.bodies[i];
        if (this.time >= b.removeAt) this.bodies.splice(i, 1);
      }
    }

    player(id) { return this.players.find(p => p.id === id) || null; }

    cheat(cmd) {
      const me = this.local;
      if (!me) return 'no player';
      if (cmd === 'god') { this.god = !this.god; return this.god ? 'godmode ON' : 'godmode OFF'; }
      if (cmd === 'noclip') { me.noclip = !me.noclip; return me.noclip ? 'noclip ON' : 'noclip OFF'; }
      if (cmd === 'give all') {
        for (let w = 1; w <= 9; w++) { me.weapons[w] = true; if (w > 1) me.ammo[w] = Q.MAX_AMMO; }
        me.health = 200; me.armor = 200;
        return 'give all';
      }
      if (cmd === 'kill') { if (me.alive) this.damage(me, null, null, null, me.ps.origin, 100000, { noProtect: true, noKnock: true }, 'suicide'); return ''; }
      return 'unknown command';
    }
  }
  Q.Game = Game;
})(globalThis.Quake3 = globalThis.Quake3 || {});
