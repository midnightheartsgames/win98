/**
 * Doom 98 — game simulation (no DOM). Runs at Doom's 35 tics per second and follows the original
 * engine's rules: player thrust/friction/step-up/view bob, monster look/chase/attack state machines,
 * hitscan with vertical autoaim, missiles, splash damage, doors, lifts, switches, teleporters,
 * pickups, weapon psprites, cheats, intermission stats and save games. Emits events for UI/audio.
 */
(function (D) {
  'use strict';
  if (typeof require !== 'undefined') { if (!D.DATA) require('./doom-data.js'); if (!D.buildLevel) require('./doom-level.js'); }
  const { MF, THINGS, WEAPONS, WEAPON_ORDER, AMMO, SKILLS, TICRATE } = D.DATA;
  const PI = Math.PI, TAU = PI * 2, DEG = PI / 180;
  const MELEERANGE = 64, MISSILERANGE = 2048, USERANGE = 64, VIEWHEIGHT = 41, MAXSTEP = 24, GRAVITY = 1, FRICTION = 0.90625, STOPSPEED = 0.0625, MAXMOVE = 30;
  const FLOATSPEED = 4, BASETHRESHOLD = 100, WEAPONTOP = 32, WEAPONBOTTOM = 128, LOWERSPEED = 6, RAISESPEED = 6, BUTTONTIME = 35;
  const XSPEED = [1, 0.70710678, 0, -0.70710678, -1, -0.70710678, 0, 0.70710678], YSPEED = [0, 0.70710678, 1, 0.70710678, 0, -0.70710678, -1, -0.70710678];
  const NODIR = 8, OPPOSITE = [4, 5, 6, 7, 0, 1, 2, 3, 8], DIAGS = [3, 1, 5, 7];
  const SWITCHES = { SW1OFF: 'SW1ON', SW1ON: 'SW1OFF', SW2OFF: 'SW2ON', SW2ON: 'SW2OFF', SW3OFF: 'SW3ON', SW3ON: 'SW3OFF', SW4OFF: 'SW4ON', SW4ON: 'SW4OFF' };
  const normAng = a => { a %= TAU; if (a > PI) a -= TAU; else if (a <= -PI) a += TAU; return a; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

  // weapon pseudo-states for lowering / raising
  for (const id in WEAPONS) {
    const st = WEAPONS[id].st, fr = st.ready[0].frame;
    st.lower = [{ label: 'lower', index: 0, frame: fr, tics: 1, action: 'lower', next: { label: 'lower', index: 0 } }];
    st.raise = [{ label: 'raise', index: 0, frame: fr, tics: 1, action: 'raise', next: { label: 'raise', index: 0 } }];
  }

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 0x1234567; }
    next() { let t = (this.s = (this.s + 0x6D2B79F5) >>> 0); t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    P() { return Math.floor(this.next() * 256); }            // 0..255 like P_Random
    sub() { return this.P() - this.P(); }                     // -255..255
  }

  // ================================================================= Game
  class Game {
    constructor(opts = {}) {
      this.skill = opts.skill != null ? opts.skill : 2;
      this.sk = SKILLS[this.skill];
      this.maps = opts.maps || D.MAPS;
      this.rng = new RNG(opts.seed || 1998);
      this.events = [];
      this.nextId = 1;
      this.player = this.newPlayer();
      this.episodeTime = 0;
      this.loadLevel(opts.map || this.maps[0].id);
    }
    newPlayer() {
      return {
        mo: null, health: 100, armor: 0, armortype: 0, ammo: { bullets: 50, shells: 0, rockets: 0, cells: 0 }, maxammo: { bullets: 200, shells: 50, rockets: 50, cells: 300 },
        backpack: false, weapons: { fist: true, pistol: true }, ready: 'pistol', pending: null, keys: { red: false, blue: false, yellow: false },
        powers: { invuln: 0, strength: 0, invis: 0, ironfeet: 0, allmap: 0, infrared: 0 }, cheats: { god: false, noclip: false },
        kills: 0, items: 0, secrets: 0, damagecount: 0, bonuscount: 0, extralight: 0, attacker: null, refire: 0, attackdown: false, usedown: false,
        viewheight: VIEWHEIGHT, deltaviewheight: 0, viewz: 0, bob: 0, dead: false, psp: [{ state: null, tics: -1, sx: 1, sy: WEAPONTOP }, { state: null, tics: -1, sx: 0, sy: 0 }],
        message: null, didsecret: false
      };
    }
    // ------------------------------------------------------------------ level setup
    mapInfo(id) { return this.maps.find(m => m.id === id); }
    loadLevel(id) {
      const info = this.mapInfo(id); if (!info) throw new Error('no map ' + id);
      this.mapId = id; this.info = info;
      this.L = D.buildLevel(info); this.L.validcount = 0; this.bossDone = false;
      this.mobjs = []; this.tgrid = new Map(); this.thinkers = []; this.leveltime = 0; this.buttons = []; this.exitPending = null;
      this.totalKills = 0; this.totalItems = 0; this.totalSecrets = this.L.sectors.filter(s => s.secret).length;
      const p = this.player; p.kills = 0; p.items = 0; p.secrets = 0; p.keys = { red: false, blue: false, yellow: false };
      p.powers = { invuln: 0, strength: 0, invis: 0, ironfeet: 0, allmap: 0, infrared: 0 }; p.damagecount = 0; p.bonuscount = 0; p.attacker = null; p.extralight = 0; p.dead = false;
      for (const s of this.L.sectors) { s.baseLight = s.light; s.origFloor = s.floor; s.origCeil = s.ceil; if (s.fx) this.spawnLightFx(s); }
      for (const t of this.L.things) this.spawnMapThing(t);
      if (!p.mo) throw new Error(`${id}: no player start`);
      this.setupPsprites();
      this.rebuildThingGrid();
      this.emit({ t: 'level', id });
    }
    spawnMapThing(t) {
      const sk = this.skill <= 1 ? 0 : this.skill === 2 ? 1 : 2;
      if (t.min != null && sk < t.min) return; if (t.max != null && sk > t.max) return;
      if (t.type === 'player') {
        const p = this.player, mo = this.spawn('player', t.x, t.y, null); mo.angle = (t.angle || 0) * DEG; mo.player = p; mo.health = p.health; p.mo = mo;
        p.viewheight = VIEWHEIGHT; p.deltaviewheight = 0; p.viewz = mo.z + VIEWHEIGHT; if (p.health <= 0) p.health = mo.health = 100;
        return;
      }
      const info = THINGS[t.type]; if (!info) throw new Error('unknown thing ' + t.type);
      const mo = this.spawn(t.type, t.x, t.y, null);
      mo.angle = (t.angle || 0) * DEG; if (t.ambush) mo.flags |= MF.AMBUSH; if (t.id) mo.tid = t.id;
      if (mo.flags & MF.COUNTKILL) this.totalKills++;
      if (mo.flags & MF.COUNTITEM) this.totalItems++;
      if (mo.tics > 0) mo.tics = 1 + (this.rng.P() % mo.tics);
      mo.spawnPoint = { x: t.x, y: t.y, angle: mo.angle, type: t.type };
    }
    spawn(type, x, y, z) {
      const info = THINGS[type];
      const mo = { id: this.nextId++, type, info, x, y, z: 0, px: x, py: y, pz: 0, angle: 0, momx: 0, momy: 0, momz: 0, radius: info.radius, height: info.height, flags: info.flags, health: info.hp || 1000,
        state: null, tics: 0, target: null, tracer: null, reactiontime: info.reaction || 0, threshold: 0, movedir: NODIR, movecount: 0, sector: 0, floorz: 0, ceilingz: 0, removed: false, frame: 'A', bright: false, player: null };
      if (this.sk.fast && info.reaction) mo.reactiontime = 0;
      mo.sector = D.pointSector(this.L, x, y);
      const s = this.L.sectors[mo.sector]; mo.floorz = s.floor; mo.ceilingz = s.ceil;
      if (z === 'ceil' || (mo.flags & MF.SPAWNCEILING)) mo.z = s.ceil - mo.height; else if (z == null) mo.z = s.floor; else mo.z = z;
      if (info.float) mo.z += info.float;
      mo.pz = mo.z;
      this.mobjs.push(mo);
      const st = info.st.spawn[0]; mo.state = st; mo.frame = st.frame; mo.bright = st.bright; mo.tics = st.tics;
      return mo;
    }
    remove(mo) { mo.removed = true; }
    emit(e) { this.events.push(e); }
    sound(name, mo, full) { this.emit({ t: 'sound', name, x: mo ? mo.x : 0, y: mo ? mo.y : 0, player: !!(mo && mo.player) || !!full, mo }); }
    msg(key, vars) { this.emit({ t: 'msg', key, vars }); }

    // ------------------------------------------------------------------ state machine
    setState(mo, label, index = 0) {
      for (let guard = 0; guard < 64; guard++) {
        const list = mo.info.st[label];
        if (!list || !list[index]) { this.remove(mo); return false; }
        const st = list[index];
        mo.state = st; mo.frame = st.frame; mo.bright = st.bright;
        mo.tics = st.tics; if (this.sk.fast && (label === 'see' || label === 'missile' || label === 'melee') && mo.tics > 1 && mo.info.speed) mo.tics = Math.max(1, mo.tics >> 1);
        if (st.action) { this.action(mo, st.action); if (mo.removed) return false; if (mo.state !== st) return true; }
        if (mo.tics !== 0) return true;
        if (!st.next) { this.remove(mo); return false; }
        label = st.next.label; index = st.next.index;
      }
      return true;
    }
    advance(mo) {
      if (mo.tics === -1) return;
      if (--mo.tics > 0) return;
      const st = mo.state;
      if (!st.next) { if (st.tics >= 0) this.remove(mo); return; }
      this.setState(mo, st.next.label, st.next.index);
    }
    action(mo, name) { const f = ACTIONS[name]; if (f) f.call(this, mo); }

    // ------------------------------------------------------------------ spatial queries
    rebuildThingGrid() {
      const bm = this.L.blockmap, g = new Map();
      for (const m of this.mobjs) { if (m.removed) continue; const k = Math.floor((m.x - bm.x) / 128) + ',' + Math.floor((m.y - bm.y) / 128); let a = g.get(k); if (!a) g.set(k, a = []); a.push(m); }
      this.tgrid = g;
    }
    thingsNear(x, y, r) {
      const bm = this.L.blockmap, out = [], x0 = Math.floor((x - r - 64 - bm.x) / 128), x1 = Math.floor((x + r + 64 - bm.x) / 128), y0 = Math.floor((y - r - 64 - bm.y) / 128), y1 = Math.floor((y + r + 64 - bm.y) / 128);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const a = this.tgrid.get(cx + ',' + cy); if (a) for (const m of a) if (!m.removed) out.push(m); }
      return out;
    }
    linesNear(x, y, r) {
      const bm = this.L.blockmap, vc = ++this.L.validcount || (this.L.validcount = 1), out = [];
      const x0 = Math.max(0, Math.floor((x - r - bm.x) / bm.size)), x1 = Math.min(bm.w - 1, Math.floor((x + r - bm.x) / bm.size));
      const y0 = Math.max(0, Math.floor((y - r - bm.y) / bm.size)), y1 = Math.min(bm.h - 1, Math.floor((y + r - bm.y) / bm.size));
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) for (const li of bm.cells[cy * bm.w + cx]) { const l = this.L.lines[li]; if (l.validcount === vc) continue; l.validcount = vc; out.push(l); }
      return out;
    }
    // lines crossed by the segment, blockmap DDA
    linesAlong(x1, y1, x2, y2) {
      const bm = this.L.blockmap, vc = ++this.L.validcount, out = [];
      const dx = x2 - x1, dy = y2 - y1, n = Math.ceil(Math.hypot(dx, dy) / (bm.size / 4)) + 1;
      let lastCell = -1;
      for (let i = 0; i <= n; i++) {
        const x = x1 + dx * i / n, y = y1 + dy * i / n;
        for (const ox of [-1, 1]) for (const oy of [-1, 1]) {
          const cx = Math.floor((x + ox - bm.x) / bm.size), cy = Math.floor((y + oy - bm.y) / bm.size);
          if (cx < 0 || cy < 0 || cx >= bm.w || cy >= bm.h) continue;
          const c = cy * bm.w + cx; if (c === lastCell) continue;
          for (const li of bm.cells[c]) { const l = this.L.lines[li]; if (l.validcount === vc) continue; l.validcount = vc; out.push(l); }
        }
      }
      return out;
    }
    opening(l) { const f = this.L.sectors[l.front], b = this.L.sectors[l.back]; return { top: Math.min(f.ceil, b.ceil), bottom: Math.max(f.floor, b.floor), low: Math.min(f.floor, b.floor) }; }

    // ------------------------------------------------------------------ movement / collision
    // Doom's P_CheckPosition with a circle instead of a box. Fills this.tm*.
    checkPosition(mo, x, y) {
      const L = this.L, r = mo.radius, sec = L.sectors[D.pointSector(L, x, y)];
      this.tmFloor = sec.floor; this.tmCeil = sec.ceil; this.tmDrop = sec.floor; this.tmBlockLine = null; this.tmHit = null; this.tmSpec = [];
      this.tmCeilLine = null;
      if (mo.flags & MF.NOCLIP) return true;
      // things
      if (mo.flags & (MF.SOLID | MF.MISSILE | MF.PICKUP | MF.SKULLFLY) || mo.player) {
        for (const t of this.thingsNear(x, y, r)) {
          if (t === mo || t.removed || !(t.flags & (MF.SOLID | MF.SPECIAL | MF.SHOOTABLE))) continue;
          const bd = t.radius + r, dx = t.x - x, dy = t.y - y;
          if (Math.abs(dx) >= bd || Math.abs(dy) >= bd || dx * dx + dy * dy >= bd * bd) continue;
          if (mo.flags & MF.SKULLFLY) { if (t.flags & MF.SHOOTABLE) { this.tmHit = t; return false; } continue; }
          if (mo.flags & MF.MISSILE) {
            if (mo.z > t.z + t.height || mo.z + mo.height < t.z) continue;
            if (mo.target && t === mo.target) continue;
            if (!(t.flags & MF.SHOOTABLE)) { if (t.flags & MF.SOLID) { this.tmHit = t; return false; } continue; }
            this.tmHit = t; return false;
          }
          if (t.flags & MF.SPECIAL) continue;
          if (!(t.flags & MF.SOLID)) continue;
          if (mo.z >= t.z + t.height || mo.z + mo.height <= t.z) continue;
          // allow separating movement when already overlapping
          const odx = t.x - mo.x, ody = t.y - mo.y;
          if (odx * odx + ody * ody < bd * bd && dx * dx + dy * dy > odx * odx + ody * ody) continue;
          this.tmHit = t; return false;
        }
      }
      // lines
      let best = Infinity;
      for (const l of this.linesNear(x, y, r)) {
        const d = distToLine(x, y, l); if (d >= r) continue;
        if (l.back < 0 || (l.block && !mo.player && !(mo.flags & MF.MISSILE))) { if (d < best) { best = d; this.tmBlockLine = l; } if (!(mo.flags & MF.MISSILE)) continue; this.tmBlockLine = l; return false; }
        const o = this.opening(l);
        if (o.top < this.tmCeil) { this.tmCeil = o.top; this.tmCeilLine = l; }
        if (o.bottom > this.tmFloor) this.tmFloor = o.bottom;
        if (o.low < this.tmDrop) this.tmDrop = o.low;
        if (l.special) this.tmSpec.push(l);
      }
      if (this.tmBlockLine) return false;
      return true;
    }
    tryMove(mo, x, y) {
      this.floatok = false;
      if (!this.checkPosition(mo, x, y)) return false;
      if (!(mo.flags & MF.NOCLIP)) {
        if (this.tmCeil - this.tmFloor < mo.height) return false;
        this.floatok = true;
        if (!(mo.flags & MF.TELEPORT) && this.tmCeil - mo.z < mo.height) return false;
        if (!(mo.flags & MF.TELEPORT) && this.tmFloor - mo.z > MAXSTEP) return false;
        if (!(mo.flags & (MF.DROPOFF | MF.FLOAT)) && this.tmFloor - this.tmDrop > MAXSTEP) return false;
      }
      const ox = mo.x, oy = mo.y;
      mo.floorz = this.tmFloor; mo.ceilingz = this.tmCeil; mo.x = x; mo.y = y; mo.sector = D.pointSector(this.L, x, y);
      if (!(mo.flags & (MF.MISSILE | MF.NOCLIP)) && (mo.player || mo.info.speed)) this.crossTriggers(mo, ox, oy, x, y);
      return true;
    }
    // Doom's P_XYMovement with sliding for the player
    xyMovement(mo) {
      if (!mo.momx && !mo.momy) { if (mo.flags & MF.SKULLFLY) { mo.flags &= ~MF.SKULLFLY; mo.momz = 0; this.setState(mo, 'spawn'); } return; }
      mo.momx = clamp(mo.momx, -MAXMOVE, MAXMOVE); mo.momy = clamp(mo.momy, -MAXMOVE, MAXMOVE);
      let xm = mo.momx, ym = mo.momy;
      const steps = Math.max(1, Math.ceil(Math.hypot(xm, ym) / Math.min(8, mo.radius * 0.75)));
      const sx = xm / steps, sy = ym / steps;
      for (let i = 0; i < steps; i++) {
        if (mo.removed) return;
        if (this.tryMove(mo, mo.x + sx, mo.y + sy)) continue;
        if (mo.player) { this.slideMove(mo, sx * (steps - i), sy * (steps - i)); break; }
        if (mo.flags & MF.SKULLFLY) { this.skullHit(mo); return; }
        if (mo.flags & MF.MISSILE) {
          const cl = this.tmBlockLine || this.tmCeilLine;
          if (!this.tmHit && cl && cl.back >= 0) { const bs = this.L.sectors[cl.back], fs = this.L.sectors[cl.front]; if ((bs.ctex === 'F_SKY1' || fs.ctex === 'F_SKY1') && mo.z > Math.min(bs.ceil, fs.ceil) - 4) { this.remove(mo); return; } }
          if (this.tmHit) this.missileHit(mo, this.tmHit); else this.explodeMissile(mo);
          return;
        }
        if (this.tmSpec.length && mo.info.speed) for (const l of this.tmSpec) if (l.special === 'door') this.useSpecial(l, mo, 0);
        mo.momx = mo.momy = 0; break;
      }
      if (mo.flags & (MF.MISSILE | MF.SKULLFLY)) return;
      if (mo.z > mo.floorz && !(mo.flags & MF.CORPSE)) return; // no friction in the air
      const p = mo.player;
      if (Math.abs(mo.momx) < STOPSPEED && Math.abs(mo.momy) < STOPSPEED && (!p || (!p.cmd.forward && !p.cmd.side))) { mo.momx = mo.momy = 0; }
      else { mo.momx *= FRICTION; mo.momy *= FRICTION; }
    }
    slideMove(mo, mx, my) {
      for (let tries = 0; tries < 3; tries++) {
        let l = this.tmBlockLine;
        if (!l && !this.tmHit) {
          // blocked by a two-sided line (step/ceiling): find the nearest line in the way
          let best = Infinity; for (const c of this.linesNear(mo.x + mx, mo.y + my, mo.radius)) { const d = distToLine(mo.x + mx, mo.y + my, c); if (d < mo.radius && d < best) { best = d; l = c; } }
        }
        let nx, ny;
        if (l) { const len = l.len; nx = l.dx / len; ny = l.dy / len; }
        else if (this.tmHit) { const dx = mo.x - this.tmHit.x, dy = mo.y - this.tmHit.y, d = Math.hypot(dx, dy) || 1; nx = -dy / d; ny = dx / d; }
        else break;
        const dot = mx * nx + my * ny; mx = nx * dot; my = ny * dot;
        if (Math.abs(mx) < 0.01 && Math.abs(my) < 0.01) break;
        const n = Math.max(1, Math.ceil(Math.hypot(mx, my) / 8)); let ok = true;
        for (let i = 0; i < n; i++) if (!this.tryMove(mo, mo.x + mx / n, mo.y + my / n)) { ok = false; mx -= mx * i / n; my -= my * i / n; break; }
        const md = mo.momx * nx + mo.momy * ny; mo.momx = nx * md; mo.momy = ny * md;
        if (ok) return;
      }
      // stairstep fallback like Doom
      if (!this.tryMove(mo, mo.x + mx, mo.y)) mo.momx = 0;
      if (!this.tryMove(mo, mo.x, mo.y + my)) mo.momy = 0;
    }
    zMovement(mo) {
      const p = mo.player;
      if (p && mo.z < mo.floorz) { p.viewheight -= mo.floorz - mo.z; p.deltaviewheight = (VIEWHEIGHT - p.viewheight) / 8; }
      mo.z += mo.momz;
      if ((mo.flags & MF.FLOAT) && mo.target && !(mo.flags & (MF.SKULLFLY | MF.INFLOAT))) {
        const dist = Math.hypot(mo.x - mo.target.x, mo.y - mo.target.y), delta = mo.target.z + (mo.height >> 1) - mo.z;
        if (delta < 0 && dist < -delta * 3) mo.z -= FLOATSPEED; else if (delta > 0 && dist < delta * 3) mo.z += FLOATSPEED;
      }
      if (mo.z <= mo.floorz) {
        if (mo.flags & MF.SKULLFLY) mo.momz = -mo.momz;
        if (mo.momz < 0) { if (p && mo.momz < -GRAVITY * 8) { p.deltaviewheight = mo.momz / 8; this.sound('oof', mo); } mo.momz = 0; }
        mo.z = mo.floorz;
        if ((mo.flags & MF.MISSILE) && !(mo.flags & MF.NOCLIP)) { this.explodeMissile(mo); return; }
      } else if (!(mo.flags & MF.NOGRAVITY)) mo.momz -= mo.momz === 0 ? GRAVITY * 2 : GRAVITY;
      if (mo.z + mo.height > mo.ceilingz) {
        if (mo.momz > 0) mo.momz = 0;
        mo.z = mo.ceilingz - mo.height;
        if (mo.flags & MF.SKULLFLY) mo.momz = -mo.momz;
        if ((mo.flags & MF.MISSILE) && !(mo.flags & MF.NOCLIP)) { if (this.L.sectors[mo.sector].ctex === 'F_SKY1') this.remove(mo); else this.explodeMissile(mo); }
      }
    }

    // ------------------------------------------------------------------ main tick
    tick(cmd) {
      cmd = cmd || {};
      const p = this.player;
      p.cmd = { forward: cmd.forward || 0, side: cmd.side || 0 };
      for (const m of this.mobjs) { m.px = m.x; m.py = m.y; m.pz = m.z; }
      p.pviewz = p.viewz; p.pangle = p.mo.angle;
      this.playerThink(cmd);
      this.rebuildThingGrid();
      for (let i = 0; i < this.mobjs.length; i++) {
        const m = this.mobjs[i]; if (m.removed || m.player) continue;
        if (m.momx || m.momy || (m.flags & MF.SKULLFLY)) this.xyMovement(m);
        if (m.removed) continue;
        if (m.z !== m.floorz || m.momz || (m.flags & MF.FLOAT)) this.zMovement(m);
        if (m.removed) continue;
        if (m.tics !== -1) this.advance(m);
        else if ((m.flags & MF.COUNTKILL) && this.sk.respawn && (m.flags & MF.CORPSE)) this.nightmareRespawn(m);
      }
      this.mobjs = this.mobjs.filter(m => !m.removed);
      for (const t of this.thinkers) if (!t.done) this.runThinker(t);
      this.thinkers = this.thinkers.filter(t => !t.done);
      for (const b of this.buttons) if (--b.timer <= 0) { this.L.sides[b.side][b.part] = b.tex; b.done = true; this.sound('swtchn', { x: b.x, y: b.y }); }
      this.buttons = this.buttons.filter(b => !b.done);
      this.leveltime++; this.episodeTime++;
      if (this.exitPending && --this.exitPending.delay <= 0) { const e = this.exitPending; this.exitPending = null; this.emit({ t: 'exit', secret: e.secret }); this.exited = e; }
    }

    // ------------------------------------------------------------------ player
    playerThink(cmd) {
      const p = this.player, mo = p.mo;
      if (p.cheats.noclip) mo.flags |= MF.NOCLIP; else mo.flags &= ~MF.NOCLIP;
      if (p.dead) { this.deathThink(cmd); return; }
      if (cmd.turn) mo.angle = normAng(mo.angle + cmd.turn);
      p.pitch = cmd.pitch || 0;
      const onground = mo.z <= mo.floorz;
      if (mo.reactiontime) mo.reactiontime--;
      else if (onground || p.cheats.noclip) {
        const f = (cmd.forward || 0) / 32, s = (cmd.side || 0) / 32, c = Math.cos(mo.angle), sn = Math.sin(mo.angle);
        if (f) { mo.momx += f * c; mo.momy += f * sn; }
        if (s) { mo.momx += s * sn; mo.momy -= s * c; }
      }
      // physics for the player body
      this.xyMovement(mo);
      this.zMovement(mo);
      this.calcHeight();
      this.sectorSpecial();
      this.touchSpecials();
      this.checkTeleport(mo);
      if (cmd.use) { if (!p.usedown) { this.useLines(); p.usedown = true; } } else p.usedown = false;
      if (cmd.weapon) this.selectSlot(cmd.weapon);
      if (cmd.weaponStep) this.cycleWeapon(cmd.weaponStep);
      p.fire = !!cmd.fire;
      this.movePsprites();
      const pw = p.powers;
      if (pw.strength) pw.strength++;
      if (pw.invuln) pw.invuln--;
      if (pw.invis) { if (!--pw.invis) mo.flags &= ~MF.SHADOW; }
      if (pw.infrared) pw.infrared--;
      if (pw.ironfeet) pw.ironfeet--;
      if (p.damagecount) p.damagecount--;
      if (p.bonuscount) p.bonuscount--;
    }
    calcHeight() {
      const p = this.player, mo = p.mo;
      p.bob = Math.min(16, (mo.momx * mo.momx + mo.momy * mo.momy) / 4);
      const bob = p.dead ? 0 : p.bob / 2 * Math.sin(TAU * this.leveltime / 20);
      if (!p.dead) {
        p.viewheight += p.deltaviewheight;
        if (p.viewheight > VIEWHEIGHT) { p.viewheight = VIEWHEIGHT; p.deltaviewheight = 0; }
        if (p.viewheight < VIEWHEIGHT / 2) { p.viewheight = VIEWHEIGHT / 2; if (p.deltaviewheight <= 0) p.deltaviewheight = 1; }
        if (p.deltaviewheight) { p.deltaviewheight += 0.25; if (!p.deltaviewheight) p.deltaviewheight = 1; }
      }
      p.viewz = mo.z + p.viewheight + bob;
      if (p.viewz > mo.ceilingz - 4) p.viewz = mo.ceilingz - 4;
    }
    deathThink(cmd) {
      const p = this.player, mo = p.mo;
      this.movePsprites();
      if (p.viewheight > 6) p.viewheight -= 1; if (p.viewheight < 6) p.viewheight = 6;
      p.deltaviewheight = 0;
      this.xyMovement(mo); this.zMovement(mo);
      p.viewz = mo.z + p.viewheight;
      if (p.attacker && p.attacker !== mo && !p.attacker.removed) {
        const a = Math.atan2(p.attacker.y - mo.y, p.attacker.x - mo.x), d = normAng(a - mo.angle);
        if (Math.abs(d) < 5 * DEG) { mo.angle = a; if (p.damagecount) p.damagecount--; } else mo.angle = normAng(mo.angle + Math.sign(d) * 5 * DEG);
      } else if (p.damagecount) p.damagecount--;
      if (cmd.use && !p.usedown && this.leveltime - p.deathTime > 20) { p.usedown = true; this.emit({ t: 'reborn' }); }
      else if (!cmd.use) p.usedown = false;
    }
    reborn() { this.player = this.newPlayer(); this.exited = null; this.exitPending = null; this.loadLevel(this.mapId); }
    sectorSpecial() {
      const p = this.player, mo = p.mo, s = this.L.sectors[mo.sector];
      if (mo.z !== s.floor) return;
      if (s.hurt && !(this.leveltime & 31)) {
        if (!p.powers.ironfeet || (s.hurt >= 20 && this.rng.P() < 5)) this.damage(mo, null, null, s.hurt);
      }
      if (s.secret) { p.secrets++; s.secret = false; this.msg('secret'); this.sound('getpow', mo, true); }
    }
    touchSpecials() {
      const p = this.player, mo = p.mo;
      for (const t of this.thingsNear(mo.x, mo.y, mo.radius)) {
        if (t.removed || !(t.flags & MF.SPECIAL)) continue;
        const bd = t.radius + mo.radius; if (Math.abs(t.x - mo.x) >= bd || Math.abs(t.y - mo.y) >= bd) continue;
        const dz = t.z - mo.z; if (dz > mo.height || dz < -8 - (t.info.float || 0)) continue;
        this.touchSpecial(t);
      }
    }
    // ------------------------------------------------------------------ pickups
    giveAmmo(type, num, dropped) {
      const p = this.player;
      if (p.ammo[type] >= p.maxammo[type]) return false;
      if (dropped) num = Math.max(1, num >> 1);
      if (this.sk.ammo > 1) num *= 2;
      const old = p.ammo[type];
      p.ammo[type] = Math.min(p.maxammo[type], p.ammo[type] + num);
      if (old === 0 && (p.ready === 'fist' || p.ready === 'pistol')) {
        const pref = { bullets: ['chaingun', 'pistol'], shells: ['ssg', 'shotgun'], rockets: [], cells: ['plasma'] }[type];
        for (const w of pref) if (p.weapons[w] && w !== p.ready) { if (p.ready === 'fist' || w !== 'pistol') p.pending = w; break; }
      }
      return true;
    }
    giveWeapon(w, dropped) {
      const p = this.player, info = WEAPONS[w];
      let gaveAmmo = false;
      if (info.ammo) gaveAmmo = this.giveAmmo(info.ammo, AMMO[info.ammo].clip * (dropped ? 1 : 2), false);
      if (p.weapons[w]) return gaveAmmo;
      p.weapons[w] = true; p.pending = w;
      return true;
    }
    touchSpecial(t) {
      const p = this.player, info = t.info, mo = p.mo;
      if (p.dead) return;
      let snd = 'itemup', msg = info.msg;
      switch (info.pickup) {
        case 'ammo': if (!this.giveAmmo(info.ammo, info.amount, t.flags & MF.DROPPED)) return; break;
        case 'backpack':
          if (!p.backpack) { for (const k in p.maxammo) p.maxammo[k] *= 2; p.backpack = true; }
          for (const k in AMMO) this.giveAmmo(k, AMMO[k].clip, false);
          break;
        case 'health':
          if (info.max === 100 && p.health >= 100) return;
          if (info.id === 'medikit' && p.health < 25) msg = 'gotmedineed';
          p.health = Math.min(info.max, p.health + info.amount); mo.health = p.health; break;
        case 'armorbonus': p.armor = Math.min(200, p.armor + 1); if (!p.armortype) p.armortype = 1; break;
        case 'armor': if (p.armor >= info.armor) return; p.armor = info.armor; p.armortype = info.cls; break;
        case 'soulsphere': p.health = Math.min(200, p.health + 100); mo.health = p.health; snd = 'getpow'; break;
        case 'power':
          snd = 'getpow';
          if (info.power === 'invuln') p.powers.invuln = 30 * TICRATE;
          else if (info.power === 'strength') { p.powers.strength = 1; if (p.health < 100) { p.health = 100; mo.health = 100; } if (p.ready !== 'fist') p.pending = 'fist'; }
          else if (info.power === 'invis') { p.powers.invis = 60 * TICRATE; mo.flags |= MF.SHADOW; }
          else if (info.power === 'ironfeet') p.powers.ironfeet = 60 * TICRATE;
          else if (info.power === 'allmap') p.powers.allmap = 1;
          else if (info.power === 'infrared') p.powers.infrared = 120 * TICRATE;
          break;
        case 'key': if (!p.keys[info.key]) this.msg(msg); p.keys[info.key] = true; msg = null; break;
        case 'weapon': if (!this.giveWeapon(info.weapon, t.flags & MF.DROPPED)) return; snd = 'wpnup'; break;
        default: return;
      }
      if (t.flags & MF.COUNTITEM) p.items++;
      this.remove(t);
      p.bonuscount += 6;
      if (msg) this.msg(msg);
      this.sound(snd, mo, true);
      this.emit({ t: 'pickup', type: info.id });
    }

    // ------------------------------------------------------------------ weapons
    setupPsprites() {
      const p = this.player;
      if (!p.weapons[p.ready]) p.ready = 'pistol';
      p.pending = null; p.psp[1].state = null;
      p.psp[0].sy = WEAPONBOTTOM;
      this.setPsp(0, 'raise');
    }
    setPsp(pos, label, index = 0) {
      const p = this.player, psp = p.psp[pos], w = WEAPONS[p.ready];
      for (let guard = 0; guard < 32; guard++) {
        const list = w.st[label];
        if (!list) { psp.state = null; return; }
        const st = list[index]; psp.state = st; psp.tics = st.tics;
        if (st.action) { WEAPON_ACTIONS[st.action].call(this, psp, pos); if (psp.state !== st) return; if (!psp.state) return; }
        if (psp.tics !== 0) return;
        if (!st.next) { psp.state = null; return; }
        label = st.next.label; index = st.next.index;
      }
    }
    movePsprites() {
      const p = this.player;
      for (let i = 0; i < 2; i++) {
        const psp = p.psp[i]; if (!psp.state || psp.tics === -1) continue;
        if (--psp.tics <= 0) { const n = psp.state.next; if (n) this.setPsp(i, n.label, n.index); else psp.state = null; }
      }
      p.psp[1].sx = p.psp[0].sx; p.psp[1].sy = p.psp[0].sy;
    }
    hasAmmo(w) { const p = this.player, info = WEAPONS[w]; return !info.ammo || p.ammo[info.ammo] >= info.per; }
    checkAmmo() {
      const p = this.player; if (this.hasAmmo(p.ready)) return true;
      const order = ['plasma', 'ssg', 'chaingun', 'shotgun', 'pistol', 'chainsaw', 'rocket', 'bfg', 'fist'];
      for (const w of order) if (p.weapons[w] && this.hasAmmo(w)) { p.pending = w; break; }
      this.setPsp(0, 'lower');
      return false;
    }
    fireWeapon() {
      const p = this.player;
      if (!this.checkAmmo()) return;
      this.setPsp(0, 'fire');
      this.noiseAlert(p.mo, p.mo);
    }
    selectSlot(slot) {
      const p = this.player; let w = null;
      if (slot === 1) w = p.ready === 'chainsaw' || !p.weapons.chainsaw ? 'fist' : 'chainsaw';
      else if (slot === 3) w = p.weapons.ssg && p.ready !== 'ssg' ? 'ssg' : p.weapons.shotgun ? 'shotgun' : p.weapons.ssg ? 'ssg' : null;
      else w = ({ 2: 'pistol', 4: 'chaingun', 5: 'rocket', 6: 'plasma', 7: 'bfg' })[slot];
      if (w && p.weapons[w] && w !== p.ready) p.pending = w;
    }
    cycleWeapon(dir) {
      const p = this.player, owned = WEAPON_ORDER.filter(w => p.weapons[w] && this.hasAmmo(w));
      if (!owned.length) return;
      const cur = owned.indexOf(p.pending || p.ready);
      p.pending = owned[(cur + dir + owned.length) % owned.length];
      if (p.pending === p.ready) p.pending = null;
    }
    // aim like P_AimLineAttack: returns slope, sets this.lineTarget
    aimLine(mo, angle, range) {
      const shootz = mo.z + (mo.height >> 1) + 8, c = Math.cos(angle), s = Math.sin(angle);
      const x2 = mo.x + c * range, y2 = mo.y + s * range;
      let top = 100 / 160, bot = -100 / 160;
      this.lineTarget = null;
      const hits = this.intercepts(mo, mo.x, mo.y, x2, y2, range);
      for (const h of hits) {
        const d = h.frac;
        if (h.line) {
          const l = h.line; if (l.back < 0) return 0;
          const o = this.opening(l); if (o.bottom >= o.top) return 0;
          const f = this.L.sectors[l.front], b = this.L.sectors[l.back];
          if (d > 0) { if (f.floor !== b.floor) bot = Math.max(bot, (o.bottom - shootz) / d); if (f.ceil !== b.ceil) top = Math.min(top, (o.top - shootz) / d); }
          if (top <= bot) return 0;
          continue;
        }
        const t = h.thing; if (!(t.flags & MF.SHOOTABLE) || t === mo) continue;
        let tt = (t.z + t.height - shootz) / d, tb = (t.z - shootz) / d;
        if (tt < bot || tb > top) continue;
        tt = Math.min(tt, top); tb = Math.max(tb, bot);
        this.lineTarget = t; return (tt + tb) / 2;
      }
      return 0;
    }
    // sorted list of line and thing intersections along a ray
    intercepts(src, x1, y1, x2, y2, range) {
      const out = [], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      for (const l of this.linesAlong(x1, y1, x2, y2)) {
        const den = l.dy * dx - l.dx * dy; if (!den) continue;
        const t = (l.dx * (y1 - l.y1) - l.dy * (x1 - l.x1)) / den, u = (dx * (y1 - l.y1) - dy * (x1 - l.x1)) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue;
        out.push({ frac: t * len, line: l, side: (l.dx * (y1 - l.y1) - l.dy * (x1 - l.x1)) > 0 ? 0 : 1 });
      }
      const ux = dx / len, uy = dy / len;
      for (const m of this.mobjs) {
        if (m === src || m.removed || !(m.flags & MF.SHOOTABLE)) continue;
        const ox = m.x - x1, oy = m.y - y1, along = ox * ux + oy * uy; if (along < 0 || along > range + m.radius) continue;
        const perp = Math.abs(ox * uy - oy * ux); if (perp > m.radius) continue;
        out.push({ frac: Math.max(0.01, along - Math.sqrt(m.radius * m.radius - perp * perp)), thing: m });
      }
      out.sort((a, b) => a.frac - b.frac);
      return out;
    }
    // P_LineAttack
    lineAttack(mo, angle, range, slope, damage) {
      const shootz = mo.z + (mo.height >> 1) + 8, c = Math.cos(angle), s = Math.sin(angle);
      const x2 = mo.x + c * range, y2 = mo.y + s * range;
      let sec = this.L.sectors[mo.sector];
      const floorHit = (d0, d1) => {
        // did the shot hit the current sector's floor or ceiling between d0 and d1?
        let d = Infinity; if (slope < 0) d = (sec.floor - shootz) / slope; else if (slope > 0) d = (sec.ceil - shootz) / slope;
        if (d >= d0 && d <= d1) { if (slope > 0 && sec.ctex === 'F_SKY1') return 'sky'; this.spawnPuff(mo.x + c * (d - 2), mo.y + s * (d - 2), shootz + slope * (d - 2)); return true; }
        return false;
      };
      let last = 0;
      for (const h of this.intercepts(mo, mo.x, mo.y, x2, y2, range)) {
        const d = h.frac;
        if (h.line) {
          const l = h.line, fh = floorHit(last, d); if (fh) return;
          last = d;
          const z = shootz + slope * d;
          if (l.back >= 0) {
            const o = this.opening(l), f = this.L.sectors[l.front], b = this.L.sectors[l.back];
            if (z > o.bottom && z < o.top) { sec = h.side === 0 ? b : f; continue; }
            if (z >= o.top && (f.ctex === 'F_SKY1' && b.ctex === 'F_SKY1')) return; // shot into the sky
          } else if (z > this.L.sectors[l.front].ceil && this.L.sectors[l.front].ctex === 'F_SKY1') return;
          const pd = d - 4; this.spawnPuff(mo.x + c * pd, mo.y + s * pd, z);
          return;
        }
        const t = h.thing, z = shootz + slope * d;
        if (z < t.z || z > t.z + t.height) continue;
        if (floorHit(last, d)) return;
        const pd = d - 10, px = mo.x + c * pd, py = mo.y + s * pd;
        if (t.flags & MF.NOBLOOD) this.spawnPuff(px, py, z); else this.spawnBlood(px, py, z, damage);
        if (damage) this.damage(t, mo, mo, damage);
        return;
      }
      floorHit(last, range);
    }
    spawnPuff(x, y, z) { const m = this.spawn('puff', x, y, z + ((this.rng.sub()) / 64)); m.momz = 1; m.tics = Math.max(1, m.tics - (this.rng.P() & 3)); }
    spawnBlood(x, y, z, dmg) { const m = this.spawn('blood', x, y, z + this.rng.sub() / 64); m.momz = 2; m.tics = Math.max(1, m.tics - (this.rng.P() & 3)); if (dmg <= 12 && dmg >= 9) this.setState(m, 'spawn', 1); else if (dmg < 9) this.setState(m, 'spawn', 2); }
    bulletSlope(mo) {
      let a = mo.angle, slope = this.aimLine(mo, a, 1024);
      if (!this.lineTarget) { a += 5.625 * DEG; slope = this.aimLine(mo, a, 1024); if (!this.lineTarget) { a -= 11.25 * DEG; slope = this.aimLine(mo, a, 1024); } }
      if (!this.lineTarget) slope = mo.player && mo.player.pitch ? Math.tan(mo.player.pitch) : 0;
      return slope;
    }
    gunShot(mo, accurate, slope) {
      const dmg = 5 * (this.rng.P() % 3 + 1);
      let a = mo.angle; if (!accurate) a += this.rng.sub() * (5.625 * DEG / 255);
      this.lineAttack(mo, a, MISSILERANGE, slope, dmg);
    }

    // ------------------------------------------------------------------ missiles
    spawnMissile(src, dest, type) {
      const th = this.spawn(type, src.x, src.y, src.z + 32), info = THINGS[type];
      if (info.sounds && info.sounds.see) this.sound(info.sounds.see, th);
      th.target = src;
      let an = Math.atan2(dest.y - src.y, dest.x - src.x);
      if (dest.flags & MF.SHADOW) an += this.rng.sub() * (22.5 * DEG / 255);
      const speed = info.speed * (this.sk.fast && type !== 'rocket' ? 2 : 1);
      th.angle = an; th.momx = Math.cos(an) * speed; th.momy = Math.sin(an) * speed;
      const dist = Math.max(1, Math.hypot(dest.x - src.x, dest.y - src.y) / speed);
      th.momz = (dest.z - src.z) / dist;
      this.checkMissileSpawn(th);
      return th;
    }
    spawnPlayerMissile(mo, type) {
      let an = mo.angle, slope = this.aimLine(mo, an, 1024);
      if (!this.lineTarget) { an += 5.625 * DEG; slope = this.aimLine(mo, an, 1024); if (!this.lineTarget) { an -= 11.25 * DEG; slope = this.aimLine(mo, an, 1024); } if (!this.lineTarget) { an = mo.angle; slope = mo.player && mo.player.pitch ? Math.tan(mo.player.pitch) : 0; } }
      const info = THINGS[type], th = this.spawn(type, mo.x, mo.y, mo.z + 32);
      if (info.sounds && info.sounds.see) this.sound(info.sounds.see, th);
      th.target = mo; th.angle = an; th.momx = Math.cos(an) * info.speed; th.momy = Math.sin(an) * info.speed; th.momz = info.speed * slope;
      this.checkMissileSpawn(th);
      return th;
    }
    checkMissileSpawn(th) {
      th.tics = Math.max(1, th.tics - (this.rng.P() & 3));
      const x = th.x + th.momx / 2, y = th.y + th.momy / 2; th.z += th.momz / 2;
      if (!this.tryMove(th, x, y)) { if (this.tmHit) this.missileHit(th, this.tmHit); else this.explodeMissile(th); }
    }
    missileHit(mo, t) {
      if (mo.removed) return;
      if (t.flags & MF.SHOOTABLE) {
        const src = mo.target;
        const same = src && src.type === t.type && !t.player;
        if (!same) { const dmg = (this.rng.P() % 8 + 1) * mo.info.damage; if (!(t.flags & MF.NOBLOOD)) this.spawnBlood(mo.x, mo.y, mo.z, dmg); this.damage(t, mo, src, dmg); }
      }
      this.explodeMissile(mo);
    }
    explodeMissile(mo) {
      if (mo.removed || mo.state && mo.state.label === 'death') return;
      mo.momx = mo.momy = mo.momz = 0;
      mo.flags &= ~MF.MISSILE;
      if (mo.info.sounds && mo.info.sounds.death) this.sound(mo.info.sounds.death, mo);
      this.setState(mo, 'death');
      if (!mo.removed) mo.tics = Math.max(1, mo.tics - (this.rng.P() & 3));
    }
    radiusAttack(spot, source, damage) {
      for (const t of this.thingsNear(spot.x, spot.y, damage)) {
        if (!(t.flags & MF.SHOOTABLE) || t.removed) continue;
        if (t.type === 'cyber') continue;
        let dist = Math.max(Math.abs(t.x - spot.x), Math.abs(t.y - spot.y)) - t.radius; if (dist < 0) dist = 0;
        if (dist >= damage) continue;
        if (this.checkSight(t, spot)) this.damage(t, spot, source, Math.floor(damage - dist));
      }
    }

    // ------------------------------------------------------------------ damage / death
    damage(target, inflictor, source, dmg) {
      if (!(target.flags & MF.SHOOTABLE) || target.health <= 0) return;
      if (target.flags & MF.SKULLFLY) { target.momx = target.momy = target.momz = 0; }
      const p = target.player;
      if (p && this.skill === 0) dmg >>= 1;
      if (inflictor && !(target.flags & MF.NOCLIP) && (!source || !source.player || source.player.ready !== 'chainsaw')) {
        let an = Math.atan2(target.y - inflictor.y, target.x - inflictor.x), thrust = dmg * 12.5 / target.info.mass;
        if (dmg < 40 && dmg > target.health && target.z - inflictor.z > 64 && (this.rng.P() & 1)) { an += PI; thrust *= 4; }
        target.momx += Math.cos(an) * thrust; target.momy += Math.sin(an) * thrust;
      }
      if (p) {
        if ((p.cheats.god || p.powers.invuln) && dmg < 1000) return;
        if (p.armortype) {
          let saved = p.armortype === 1 ? Math.floor(dmg / 3) : Math.floor(dmg / 2);
          if (p.armor <= saved) { saved = p.armor; p.armortype = 0; }
          p.armor -= saved; dmg -= saved;
        }
        p.health = Math.max(0, p.health - dmg);
        p.attacker = source; p.damagecount = Math.min(100, p.damagecount + dmg);
        this.emit({ t: 'hurt', dmg, source });
      }
      target.health -= dmg;
      if (target.health <= 0) { this.kill(source, target); return; }
      if (this.rng.P() < target.info.pain && !(target.flags & MF.SKULLFLY)) { target.flags |= MF.JUSTHIT; if (target.info.st.pain) this.setState(target, 'pain'); }
      target.reactiontime = 0;
      if ((!target.threshold) && source && source !== target && !target.player && source.flags & MF.SHOOTABLE) {
        target.target = source; target.threshold = BASETHRESHOLD;
        if (target.state && target.state.label === 'spawn' && target.info.st.see) this.setState(target, 'see');
      }
    }
    kill(source, target) {
      target.flags &= ~(MF.SHOOTABLE | MF.FLOAT | MF.SKULLFLY);
      if (target.type !== 'soul') target.flags &= ~MF.NOGRAVITY;
      target.flags |= MF.CORPSE | MF.DROPOFF;
      target.height = target.height / 4;
      if (target.flags & MF.COUNTKILL) this.player.kills++;
      if (target.player) {
        const p = target.player; p.dead = true; p.deathTime = this.leveltime; p.health = 0; target.flags &= ~MF.SOLID;
        this.sound(target.health < -50 ? 'pdiehi' : 'pldeth', target, true);
        this.setPsp(0, 'lower');
        this.emit({ t: 'death' });
        return;
      }
      if (target.health < -target.info.hp && target.info.st.xdeath) this.setState(target, 'xdeath'); else this.setState(target, 'death');
      if (!target.removed) target.tics = Math.max(1, target.tics - (this.rng.P() & 3));
      if (this.info.bossType === target.type && target.type !== 'cyber') ACTIONS.bossDeath.call(this, target);
      const drop = target.info.drop;
      if (drop) { const d = this.spawn(drop, target.x, target.y, null); d.flags |= MF.DROPPED; }
    }
    nightmareRespawn(m) {
      m.movecount++;
      if (m.movecount < 12 * TICRATE || (this.leveltime & 31) || this.rng.P() > 4) return;
      const sp = m.spawnPoint; if (!sp) return;
      const test = this.spawn(sp.type, sp.x, sp.y, null);
      if (!this.checkPosition(test, sp.x, sp.y)) { this.remove(test); return; }
      test.angle = sp.angle; test.spawnPoint = sp;
      this.spawn('tfog', m.x, m.y, null); this.spawn('tfog', sp.x, sp.y, null); this.sound('telept', test);
      this.remove(m);
    }

    // ------------------------------------------------------------------ AI helpers
    checkSight(a, b) {
      const sz = a.z + a.height - (a.height >> 2);
      const dist = Math.hypot(b.x - a.x, b.y - a.y); if (dist < 1) return true;
      let top = (b.z + b.height - sz) / dist, bot = (b.z - sz) / dist;
      const dx = b.x - a.x, dy = b.y - a.y;
      for (const l of this.linesAlong(a.x, a.y, b.x, b.y)) {
        const den = l.dy * dx - l.dx * dy; if (!den) continue;
        const t = (l.dx * (a.y - l.y1) - l.dy * (a.x - l.x1)) / den, u = (dx * (a.y - l.y1) - dy * (a.x - l.x1)) / den;
        if (t <= 0 || t >= 1 || u < 0 || u > 1) continue;
        if (l.back < 0) return false;
        const f = this.L.sectors[l.front], bs = this.L.sectors[l.back];
        if (f.floor === bs.floor && f.ceil === bs.ceil) continue;
        const o = this.opening(l); if (o.bottom >= o.top) return false;
        const d = t * dist;
        if (f.floor !== bs.floor) bot = Math.max(bot, (o.bottom - sz) / d);
        if (f.ceil !== bs.ceil) top = Math.min(top, (o.top - sz) / d);
        if (top <= bot) return false;
      }
      return true;
    }
    noiseAlert(target, emitter) {
      const vc = ++this.soundValid || (this.soundValid = 1);
      const flood = (si, blocks) => {
        const s = this.L.sectors[si];
        if (s.soundValid === vc && s.soundTraversed <= blocks + 1) return;
        s.soundValid = vc; s.soundTraversed = blocks + 1; s.soundTarget = target;
        for (const li of s.lines) {
          const l = this.L.lines[li]; if (l.back < 0) continue;
          const o = this.opening(l); if (o.top - o.bottom <= 0) continue;
          const other = l.front === si ? l.back : l.front;
          flood(other, blocks);
        }
      };
      flood(emitter.sector, 0);
    }
    lookForPlayers(mo, allaround) {
      const p = this.player, pm = p.mo;
      if (p.dead || !pm || p.notarget) return false;
      if (!this.checkSight(mo, pm)) return false;
      if (!allaround) {
        const an = normAng(Math.atan2(pm.y - mo.y, pm.x - mo.x) - mo.angle);
        if (Math.abs(an) > PI / 2 && Math.hypot(pm.x - mo.x, pm.y - mo.y) > MELEERANGE) return false;
      }
      mo.target = pm; return true;
    }
    faceTarget(mo) {
      if (!mo.target) return;
      mo.flags &= ~MF.AMBUSH;
      mo.angle = Math.atan2(mo.target.y - mo.y, mo.target.x - mo.x);
      if (mo.target.flags & MF.SHADOW) mo.angle += this.rng.sub() * (22.5 * DEG / 255);
    }
    checkMeleeRange(mo) {
      const t = mo.target; if (!t) return false;
      const dist = Math.hypot(t.x - mo.x, t.y - mo.y);
      if (dist >= MELEERANGE - 20 + t.radius) return false;
      if (Math.abs((t.z + t.height / 2) - (mo.z + mo.height / 2)) > 64 + mo.height / 2) return false;
      return this.checkSight(mo, t);
    }
    checkMissileRange(mo) {
      if (!this.checkSight(mo, mo.target)) return false;
      if (mo.flags & MF.JUSTHIT) { mo.flags &= ~MF.JUSTHIT; return true; }
      if (mo.reactiontime) return false;
      let dist = Math.hypot(mo.x - mo.target.x, mo.y - mo.target.y) - 64;
      if (!mo.info.st.melee) dist -= 128;
      if (mo.type === 'cyber' || mo.type === 'soul') dist /= 2;
      dist = Math.min(dist, mo.type === 'cyber' ? 160 : 200);
      return this.rng.P() >= dist;
    }
    moveMonster(mo) {
      if (mo.movedir === NODIR) return false;
      const speed = mo.info.speed, tx = mo.x + speed * XSPEED[mo.movedir], ty = mo.y + speed * YSPEED[mo.movedir];
      if (!this.tryMove(mo, tx, ty)) {
        if ((mo.flags & MF.FLOAT) && this.floatok) {
          if (mo.z < this.tmFloor) mo.z += FLOATSPEED; else mo.z -= FLOATSPEED;
          mo.flags |= MF.INFLOAT; return true;
        }
        if (!this.tmSpec.length) return false;
        mo.movedir = NODIR; let good = false;
        for (const l of this.tmSpec) if (this.useSpecial(l, mo, this.lineSideOf(l, mo))) good = true;
        return good;
      }
      mo.flags &= ~MF.INFLOAT;
      if (!(mo.flags & MF.FLOAT)) mo.z = mo.floorz;
      return true;
    }
    tryWalk(mo) { if (!this.moveMonster(mo)) return false; mo.movecount = this.rng.P() & 15; return true; }
    newChaseDir(mo) {
      const t = mo.target, olddir = mo.movedir, turnaround = OPPOSITE[olddir];
      const dx = t.x - mo.x, dy = t.y - mo.y, d = [NODIR, dx > 10 ? 0 : dx < -10 ? 4 : NODIR, dy < -10 ? 6 : dy > 10 ? 2 : NODIR];
      if (d[1] !== NODIR && d[2] !== NODIR) { mo.movedir = DIAGS[((dy < 0) << 1) + (dx > 0)]; if (mo.movedir !== turnaround && this.tryWalk(mo)) return; }
      if (this.rng.P() > 200 || Math.abs(dy) > Math.abs(dx)) { const tmp = d[1]; d[1] = d[2]; d[2] = tmp; }
      if (d[1] === turnaround) d[1] = NODIR; if (d[2] === turnaround) d[2] = NODIR;
      if (d[1] !== NODIR) { mo.movedir = d[1]; if (this.tryWalk(mo)) return; }
      if (d[2] !== NODIR) { mo.movedir = d[2]; if (this.tryWalk(mo)) return; }
      if (olddir !== NODIR) { mo.movedir = olddir; if (this.tryWalk(mo)) return; }
      if (this.rng.P() & 1) { for (let td = 0; td <= 7; td++) if (td !== turnaround) { mo.movedir = td; if (this.tryWalk(mo)) return; } }
      else { for (let td = 7; td >= 0; td--) if (td !== turnaround) { mo.movedir = td; if (this.tryWalk(mo)) return; } }
      if (turnaround !== NODIR) { mo.movedir = turnaround; if (this.tryWalk(mo)) return; }
      mo.movedir = NODIR;
    }
    skullHit(mo) {
      const t = this.tmHit;
      if (t && (t.flags & MF.SHOOTABLE)) this.damage(t, mo, mo, (this.rng.P() % 8 + 1) * mo.info.damage);
      mo.flags &= ~MF.SKULLFLY; mo.momx = mo.momy = mo.momz = 0;
      this.setState(mo, 'spawn');
    }

    // ------------------------------------------------------------------ specials: use, triggers, movers
    lineSideOf(l, mo) { return D.sideOf(mo.x, mo.y, l.x1, l.y1, l.dx, l.dy) >= 0 ? 0 : 1; }
    useLines() {
      const p = this.player, mo = p.mo, c = Math.cos(mo.angle), s = Math.sin(mo.angle);
      const x2 = mo.x + c * USERANGE, y2 = mo.y + s * USERANGE;
      const hits = [];
      for (const l of this.linesAlong(mo.x, mo.y, x2, y2)) {
        const dx = x2 - mo.x, dy = y2 - mo.y, den = l.dy * dx - l.dx * dy; if (!den) continue;
        const t = (l.dx * (mo.y - l.y1) - l.dy * (mo.x - l.x1)) / den, u = (dx * (mo.y - l.y1) - dy * (mo.x - l.x1)) / den;
        if (t < 0 || t > 1 || u < 0 || u > 1) continue; hits.push({ t, l });
      }
      hits.sort((a, b) => a.t - b.t);
      for (const { l } of hits) {
        if (l.special) { this.useSpecial(l, mo, this.lineSideOf(l, mo)); return; }
        if (l.back < 0) { this.sound('noway', mo, true); return; }
        const o = this.opening(l); if (o.top <= o.bottom) { this.sound('noway', mo, true); return; }
      }
    }
    keyCheck(mo, key, kind) {
      if (!key) return true;
      if (!mo.player) return false;
      if (mo.player.keys[key]) return true;
      this.msg(`pd_${key}${kind}`); this.sound('noway', mo, true); return false;
    }
    // activate a line special (use or monster bump)
    useSpecial(l, mo, side) {
      const L = this.L, sp = l.special;
      if (sp === 'door') {
        const near = side === 0 ? l.front : l.back, far = side === 0 ? l.back : l.front;
        const sec = L.sectors[far].door ? L.sectors[far] : L.sectors[near].door ? L.sectors[near] : null;
        if (!sec) return false;
        if (!mo.player && sec.door.key) return false;
        if (!this.keyCheck(mo, sec.door.key, 'k')) return false;
        return this.verticalDoor(sec, mo);
      }
      if (sp === 'liftUse') {
        if (!mo.player) return false;
        const near = side === 0 ? l.front : l.back, far = side === 0 ? l.back : l.front;
        const sec = L.sectors[far].lift ? L.sectors[far] : L.sectors[near].lift ? L.sectors[near] : null;
        if (!sec) return false;
        return this.startLift(sec);
      }
      if (!mo.player) return false;
      if (l.used && l.once) return false;
      if (!this.keyCheck(mo, l.key, 'o')) return false;
      const ok = this.doAction(sp, l.tag, mo, l);
      if (ok || sp === 'exit' || sp === 'secretexit') this.changeSwitch(l, !l.once, sp === 'exit' || sp === 'secretexit');
      if (l.once) l.used = true;
      return ok;
    }
    changeSwitch(l, repeat, exit) {
      const side = this.L.sides[l.sides[0]];
      for (const part of ['mid', 'upper', 'lower']) {
        const tex = side[part]; if (!tex || !SWITCHES[tex]) continue;
        side[part] = SWITCHES[tex];
        const x = (l.x1 + l.x2) / 2, y = (l.y1 + l.y2) / 2;
        this.sound(exit ? 'swtchx' : 'swtchn', { x, y });
        if (repeat) this.buttons.push({ side: side.index, part, tex, timer: BUTTONTIME, x, y });
        return;
      }
    }
    doAction(action, tag, mo, line) {
      const L = this.L, secs = tag ? L.sectors.filter(s => s.tag === tag) : [];
      let any = false;
      switch (action) {
        case 'exit': this.exitLevel(false); return true;
        case 'secretexit': this.exitLevel(true); return true;
        case 'openDoor': for (const s of secs) any = this.startDoor(s, 'open') || any; return any;
        case 'raiseDoor': for (const s of secs) any = this.startDoor(s, 'normal') || any; return any;
        case 'closeDoor': for (const s of secs) any = this.startDoor(s, 'close') || any; return any;
        case 'lift': for (const s of secs) any = this.startLift(s) || any; return any;
        case 'lowerFloor': for (const s of secs) any = this.startFloor(s, 'lowerToHighest') || any; return any;
        case 'lowerFloorLowest': for (const s of secs) any = this.startFloor(s, 'lowerToLowest') || any; return any;
        case 'raiseFloor': for (const s of secs) any = this.startFloor(s, 'raiseToLowestCeiling') || any; return any;
        case 'raiseFloorNext': for (const s of secs) any = this.startFloor(s, 'raiseToNext') || any; return any;
        case 'raiseFloor24': for (const s of secs) any = this.startFloor(s, 'raise24') || any; return any;
        case 'raiseFloorTo': for (const s of secs) any = this.startFloor(s, 'raiseTo') || any; return any;
        case 'lightOn': for (const s of secs) { s.light = s.baseLight = Math.max(s.light, ...s.neighbors.map(n => L.sectors[n].light)); any = true; } return any;
        case 'lightOff': for (const s of secs) { s.light = s.baseLight = 35; any = true; } return any;
        case 'teleport': return this.teleport(mo, line && line.dest || tag);
        default: return false;
      }
    }
    exitLevel(secret) { if (this.exitPending || this.exited) return; this.exitPending = { secret, delay: 8 }; }
    crossTriggers(mo, x1, y1, x2, y2) {
      for (const t of this.L.triggers) {
        if (t.used && t.once) continue;
        if (!mo.player && !t.monsters) continue;
        const s1 = D.sideOf(x1, y1, t.x1, t.y1, t.x2 - t.x1, t.y2 - t.y1), s2 = D.sideOf(x2, y2, t.x1, t.y1, t.x2 - t.x1, t.y2 - t.y1);
        if ((s1 >= 0) === (s2 >= 0)) continue;
        const u1 = D.sideOf(t.x1, t.y1, x1, y1, x2 - x1, y2 - y1), u2 = D.sideOf(t.x2, t.y2, x1, y1, x2 - x1, y2 - y1);
        if ((u1 >= 0) === (u2 >= 0)) continue;
        if (t.action === 'teleport') { if (s1 < 0) continue; if (this.teleport(mo, t.dest || t.tag) && t.once) t.used = true; continue; }
        if (t.msg && mo.player) this.emit({ t: 'msg', text: t.msg });
        if (this.doAction(t.action, t.tag, mo, null) || t.action === 'exit' || t.action === 'secretexit') { if (t.once) t.used = true; }
        else if (t.once && t.action !== 'lift') t.used = true;
      }
    }
    checkTeleport(mo) {
      const s = this.L.sectors[mo.sector];
      if (s.teleport && mo.z <= s.floor + 1 && mo.lastTele !== this.leveltime - 1) this.teleport(mo, s.teleport);
    }
    teleport(mo, dest) {
      const d = this.mobjs.find(m => m.type === 'teledest' && m.tid === dest); if (!d) return false;
      const ox = mo.x, oy = mo.y, oz = mo.z;
      mo.flags |= MF.TELEPORT;
      // telefrag anything standing at the destination
      for (const t of this.thingsNear(d.x, d.y, mo.radius)) if (t !== mo && (t.flags & MF.SHOOTABLE) && Math.hypot(t.x - d.x, t.y - d.y) < t.radius + mo.radius) { if (!mo.player && !t.player) { mo.flags &= ~MF.TELEPORT; return false; } this.damage(t, mo, mo, 10000); }
      const ok = this.tryMove(mo, d.x, d.y); mo.flags &= ~MF.TELEPORT;
      if (!ok) return false;
      mo.z = mo.floorz; mo.px = mo.x; mo.py = mo.y; mo.pz = mo.z;
      this.spawn('tfog', ox, oy, oz); const f = this.spawn('tfog', d.x + 20 * Math.cos(d.angle), d.y + 20 * Math.sin(d.angle), mo.z);
      this.sound('telept', f); this.sound('telept', { x: ox, y: oy });
      mo.angle = d.angle; mo.momx = mo.momy = mo.momz = 0;
      if (mo.player) { mo.reactiontime = 18; mo.player.viewz = mo.z + mo.player.viewheight; mo.player.pviewz = mo.player.viewz; mo.player.pangle = mo.angle; }
      mo.lastTele = this.leveltime;
      return true;
    }
    activeMover(sec, kind) { return this.thinkers.find(t => !t.done && t.sector === sec && t.kind === kind); }
    lowestNeighborCeil(s) { let v = Infinity; for (const n of s.neighbors) v = Math.min(v, this.L.sectors[n].ceil); return v === Infinity ? s.ceil : v; }
    verticalDoor(sec, mo) {
      const t = this.activeMover(sec, 'door') || this.activeMover(sec, 'ceil');
      if (t) {
        if (t.type === 'normal' || t.type === 'close') {
          if (t.dir === -1) { t.dir = 1; this.sound(sec.door.fast ? 'bdopn' : 'doropn', { x: sec.center[0], y: sec.center[1] }); return true; }
          if (!mo.player) return false;
          t.dir = -1; this.sound(sec.door.fast ? 'bdcls' : 'dorcls', { x: sec.center[0], y: sec.center[1] }); return true;
        }
        return false;
      }
      if (sec.ceil >= this.doorTop(sec) && sec.door.stay) return false;
      return this.startDoor(sec, sec.door.stay ? 'open' : 'normal');
    }
    doorTop(sec) { return sec.door && sec.door.top != null ? sec.door.top : this.lowestNeighborCeil(sec) - 4; }
    startDoor(sec, type) {
      if (this.activeMover(sec, 'door')) return false;
      const fast = sec.door && sec.door.fast, top = this.doorTop(sec);
      const t = { kind: 'door', sector: sec, type, speed: fast ? 8 : 2, top, wait: 150, count: 0, dir: type === 'close' ? -1 : 1 };
      if (t.dir === 1 && sec.ceil >= top) { if (type === 'open') return false; t.dir = 0; t.count = t.wait; }
      if (t.dir === -1 && sec.ceil <= sec.floor) return false;
      this.thinkers.push(t);
      if (t.dir) this.sound(t.dir > 0 ? (fast ? 'bdopn' : 'doropn') : (fast ? 'bdcls' : 'dorcls'), { x: sec.center[0], y: sec.center[1] });
      return true;
    }
    startLift(sec) {
      const t0 = this.activeMover(sec, 'lift');
      if (t0) { if (t0.dir === 0 && t0.wasUp) return false; return false; }
      let low = sec.floor; for (const n of sec.neighbors) low = Math.min(low, this.L.sectors[n].floor);
      const high = sec.lift && sec.lift.high != null ? sec.lift.high : sec.origFloor;
      if (low >= sec.floor && sec.floor >= high) return false;
      this.thinkers.push({ kind: 'lift', sector: sec, low, high, speed: 4, wait: 105, count: 0, dir: sec.floor > low ? -1 : 1 });
      this.sound('pstart', { x: sec.center[0], y: sec.center[1] });
      return true;
    }
    startFloor(sec, type) {
      if (this.activeMover(sec, 'floor')) return false;
      const N = sec.neighbors.map(n => this.L.sectors[n]);
      let dest, dir, speed = 1;
      if (type === 'lowerToHighest') { dest = Math.max(-32768, ...N.map(s => s.floor).filter(f => f < sec.floor)); if (!isFinite(dest) || dest === -32768) dest = Math.min(...N.map(s => s.floor)); dir = -1; speed = 1; }
      else if (type === 'lowerToLowest') { dest = Math.min(sec.floor, ...N.map(s => s.floor)); dir = -1; speed = 1; }
      else if (type === 'raiseToLowestCeiling') { dest = Math.min(...N.map(s => s.ceil), sec.ceil); dir = 1; }
      else if (type === 'raiseToNext') { const up = N.map(s => s.floor).filter(f => f > sec.floor); dest = up.length ? Math.min(...up) : sec.floor; dir = 1; }
      else if (type === 'raise24') { dest = sec.floor + 24; dir = 1; }
      else if (type === 'raiseTo') { dest = sec.raiseTo != null ? sec.raiseTo : (sec.door && sec.door.top) || sec.floor; dir = 1; }
      if (sec.moveSpeed) speed = sec.moveSpeed;
      if (dest === sec.floor) return false;
      this.thinkers.push({ kind: 'floor', sector: sec, dest, dir: dest > sec.floor ? 1 : -1, speed: Math.max(speed, dir > 0 ? 1 : 1) });
      this.sound('pstart', { x: sec.center[0], y: sec.center[1] });
      return true;
    }
    // move a floor/ceiling; returns 'ok' | 'pastdest' | 'crushed'
    movePlane(sec, part, speed, dest, dir) {
      const old = sec[part];
      let v = old + speed * dir, past = false;
      if ((dir > 0 && v >= dest) || (dir < 0 && v <= dest)) { v = dest; past = true; }
      sec[part] = v;
      if (!this.changeSector(sec)) { sec[part] = old; this.changeSector(sec); return 'crushed'; }
      return past ? 'pastdest' : 'ok';
    }
    // P_ChangeSector: re-fit things touching the sector; false if something no longer fits
    changeSector(sec) {
      let ok = true;
      const [x0, y0, x1, y1] = sec.bbox;
      for (const m of this.mobjs) {
        if (m.removed || m.x + m.radius < x0 || m.x - m.radius > x1 || m.y + m.radius < y0 || m.y - m.radius > y1) continue;
        const onfloor = m.z <= m.floorz + 0.001;
        this.checkPosition(m, m.x, m.y);
        m.floorz = this.tmFloor; m.ceilingz = this.tmCeil;
        if (onfloor || m.z < m.floorz) { if (!(m.flags & MF.MISSILE)) m.z = m.floorz; }
        else if (m.z + m.height > m.ceilingz) m.z = Math.max(m.floorz, m.ceilingz - m.height);
        if (m.ceilingz - m.floorz < m.height) {
          if (m.flags & MF.CORPSE) { if (m.info.hp) { m.height = 0; } continue; }
          if (m.flags & MF.DROPPED || m.flags & MF.SPECIAL) { this.remove(m); continue; }
          if (!(m.flags & MF.SHOOTABLE) && !(m.flags & MF.SOLID)) continue;
          ok = false;
        }
      }
      return ok;
    }
    runThinker(t) {
      const s = t.sector, pos = { x: s.center[0], y: s.center[1] };
      if (t.kind === 'door') {
        if (t.dir === 0) {
          if (--t.count <= 0) { if (t.type === 'normal') { t.dir = -1; this.sound(s.door && s.door.fast ? 'bdcls' : 'dorcls', pos); } else t.done = true; }
          return;
        }
        if (t.dir === -1) {
          const r = this.movePlane(s, 'ceil', t.speed, s.floor, -1);
          if (r === 'pastdest') { t.done = true; }
          else if (r === 'crushed') { t.dir = 1; this.sound(s.door && s.door.fast ? 'bdopn' : 'doropn', pos); }
        } else {
          const r = this.movePlane(s, 'ceil', t.speed, t.top, 1);
          if (r === 'pastdest') { if (t.type === 'normal') { t.dir = 0; t.count = t.wait; } else t.done = true; }
        }
      } else if (t.kind === 'lift') {
        if (t.dir === 0) { if (--t.count <= 0) { t.dir = t.wasUp ? -1 : 1; this.sound('pstart', pos); } return; }
        const dest = t.dir < 0 ? t.low : t.high;
        const r = this.movePlane(s, 'floor', t.speed, dest, t.dir);
        if (r === 'pastdest') { this.sound('pstop', pos); if (t.dir < 0) { t.dir = 0; t.count = t.wait; t.wasUp = false; } else t.done = true; }
        else if (r === 'crushed' && t.dir > 0) { t.dir = -1; this.sound('pstart', pos); }
      } else if (t.kind === 'floor') {
        const r = this.movePlane(s, 'floor', t.speed, t.dest, t.dir);
        if (!(this.leveltime & 7)) this.sound('stnmov', pos);
        if (r === 'pastdest') { t.done = true; this.sound('pstop', pos); }
      } else if (t.kind === 'light') this.lightThink(t);
    }
    spawnLightFx(s) {
      let min = s.light; for (const n of s.neighbors) min = Math.min(min, this.L.sectors[n].light);
      if (min === s.light) min = Math.max(0, s.light - 96);
      this.thinkers.push({ kind: 'light', sector: s, fx: s.fx, max: s.light, min, count: 1 + (this.rng.P() & 7), dir: -1 });
    }
    lightThink(t) {
      const s = t.sector;
      if (t.fx === 'glow') { s.light += t.dir * 8; if (s.light <= t.min) { s.light = t.min; t.dir = 1; } else if (s.light >= t.max) { s.light = t.max; t.dir = -1; } return; }
      if (--t.count > 0) return;
      if (t.fx === 'flicker') { const amount = (this.rng.P() & 3) * 16; s.light = s.light - amount < t.min ? t.min : t.max - amount; t.count = 4; }
      else if (t.fx === 'blink') { if (s.light === t.max) { s.light = t.min; t.count = 15; } else { s.light = t.max; t.count = 5; } }
      else if (t.fx === 'strobe') { if (s.light === t.max) { s.light = t.min; t.count = 35; } else { s.light = t.max; t.count = 5; } }
      else if (t.fx === 'random') { if (s.light === t.max) { s.light = t.min; t.count = (this.rng.P() & 7) + 1; } else { s.light = t.max; t.count = (this.rng.P() & 63) + 1; } }
    }

    // ------------------------------------------------------------------ cheats
    cheat(code) {
      const p = this.player, mo = p.mo; code = code.toLowerCase();
      if (code === 'iddqd') { p.cheats.god = !p.cheats.god; if (p.cheats.god) { p.health = mo.health = 100; } return p.cheats.god ? 'dqdon' : 'dqdoff'; }
      if (code === 'idkfa' || code === 'idfa') {
        p.armor = 200; p.armortype = 2;
        for (const w of WEAPON_ORDER) p.weapons[w] = true;
        if (!p.backpack) { for (const k in p.maxammo) p.maxammo[k] *= 2; p.backpack = true; }
        for (const k in p.ammo) p.ammo[k] = p.maxammo[k];
        if (code === 'idkfa') { p.keys = { red: true, blue: true, yellow: true }; return 'kfaadded'; }
        return 'faadded';
      }
      if (code === 'idclip' || code === 'idspispopd') { p.cheats.noclip = !p.cheats.noclip; return p.cheats.noclip ? 'ncon' : 'ncoff'; }
      if (code === 'idchoppers') { p.weapons.chainsaw = true; p.powers.invuln = 1; p.pending = 'chainsaw'; return 'choppers'; }
      if (code === 'idbehold') return 'behold';
      const b = /^idbehold([vsirla])$/.exec(code);
      if (b) {
        const k = b[1];
        if (k === 'v') p.powers.invuln = p.powers.invuln ? 0 : 30 * TICRATE;
        if (k === 's') { p.powers.strength = p.powers.strength ? 0 : 1; if (p.powers.strength && p.health < 100) p.health = mo.health = 100; }
        if (k === 'i') { p.powers.invis = p.powers.invis ? 0 : 60 * TICRATE; if (p.powers.invis) mo.flags |= MF.SHADOW; else mo.flags &= ~MF.SHADOW; }
        if (k === 'r') p.powers.ironfeet = p.powers.ironfeet ? 0 : 60 * TICRATE;
        if (k === 'a') p.powers.allmap = p.powers.allmap ? 0 : 1;
        if (k === 'l') p.powers.infrared = p.powers.infrared ? 0 : 120 * TICRATE;
        return 'beholdx';
      }
      if (code === 'idmypos') return { key: 'mypos', vars: { x: Math.round(mo.x), y: Math.round(mo.y), a: Math.round(((mo.angle / DEG) + 360) % 360) } };
      const c = /^idclev(\d)(\d)$/.exec(code);
      if (c) { const id = `E${c[1]}M${c[2]}`; if (!this.mapInfo(id)) return null; this.emit({ t: 'warp', id }); return 'clev'; }
      return null;
    }

    // ------------------------------------------------------------------ progression
    stats() {
      const p = this.player;
      return { kills: p.kills, items: p.items, secrets: p.secrets, totalKills: this.totalKills, totalItems: this.totalItems, totalSecrets: this.totalSecrets, time: Math.floor(this.leveltime / TICRATE), par: this.info.par || 0, map: this.info };
    }
    nextMapId(secret) { return secret && this.info.secretNext ? this.info.secretNext : this.info.next || null; }
    // carry inventory to the next level (Doom's G_PlayerFinishLevel)
    startMap(id) {
      const p = this.player;
      p.mo = null; p.pending = null; p.psp[1].state = null; p.cheats = Object.assign({}, p.cheats);
      if (p.health <= 0) Object.assign(p, this.newPlayer());
      this.exited = null; this.exitPending = null;
      this.loadLevel(id);
    }

    // ------------------------------------------------------------------ save / load
    serialize() {
      const ids = new Map(); this.mobjs.forEach((m, i) => ids.set(m, i));
      const ref = m => m && ids.has(m) ? ids.get(m) : -1;
      const p = this.player;
      return {
        v: 1, map: this.mapId, skill: this.skill, leveltime: this.leveltime, episodeTime: this.episodeTime, totals: [this.totalKills, this.totalItems, this.totalSecrets], rng: this.rng.s,
        player: Object.assign({}, p, { mo: ref(p.mo), attacker: ref(p.attacker), cmd: undefined, psp: p.psp.map(ps => ({ sx: ps.sx, sy: ps.sy, tics: ps.tics, st: ps.state ? [ps.state.label, ps.state.index] : null })) }),
        sectors: this.L.sectors.map(s => [s.floor, s.ceil, s.light, s.secret ? 1 : 0, s.baseLight]),
        lines: this.L.lines.map(l => (l.used ? 1 : 0) | (l.flags & D.LF.MAPPED ? 2 : 0)),
        sides: this.L.sides.map(s => [s.upper, s.mid, s.lower]),
        triggers: this.L.triggers.map(t => t.used ? 1 : 0),
        buttons: this.buttons,
        thinkers: this.thinkers.map(t => Object.assign({}, t, { sector: t.sector.index })),
        mobjs: this.mobjs.map(m => ({ type: m.type, x: m.x, y: m.y, z: m.z, angle: m.angle, momx: m.momx, momy: m.momy, momz: m.momz, radius: m.radius, height: m.height, flags: m.flags, health: m.health,
          st: m.state ? [m.state.label, m.state.index] : null, tics: m.tics, target: ref(m.target), reactiontime: m.reactiontime, threshold: m.threshold, movedir: m.movedir, movecount: m.movecount, tid: m.tid || null, spawnPoint: m.spawnPoint || null, player: m.player ? 1 : 0 }))
      };
    }
    static deserialize(data, opts = {}) {
      const g = Object.create(Game.prototype);
      g.skill = data.skill; g.sk = SKILLS[g.skill]; g.maps = opts.maps || D.MAPS; g.rng = new RNG(1); g.rng.s = data.rng; g.events = []; g.nextId = 1;
      g.mapId = data.map; g.info = g.mapInfo(data.map); g.L = D.buildLevel(g.info); g.L.validcount = 0;
      g.leveltime = data.leveltime; g.episodeTime = data.episodeTime || 0; [g.totalKills, g.totalItems, g.totalSecrets] = data.totals;
      g.L.sectors.forEach((s, i) => { const d = data.sectors[i]; s.origFloor = s.floor; s.origCeil = s.ceil; s.floor = d[0]; s.ceil = d[1]; s.light = d[2]; s.secret = !!d[3]; s.baseLight = d[4]; });
      g.L.lines.forEach((l, i) => { l.used = !!(data.lines[i] & 1); if (data.lines[i] & 2) l.flags |= D.LF.MAPPED; });
      g.L.sides.forEach((s, i) => { [s.upper, s.mid, s.lower] = data.sides[i]; });
      g.L.triggers.forEach((t, i) => { t.used = !!data.triggers[i]; });
      g.buttons = data.buttons || [];
      g.thinkers = data.thinkers.map(t => Object.assign({}, t, { sector: g.L.sectors[t.sector] }));
      g.mobjs = data.mobjs.map(d => {
        const info = THINGS[d.type];
        const m = Object.assign({ id: g.nextId++, info, px: d.x, py: d.y, pz: d.z, removed: false, frame: 'A', bright: false, player: null, tracer: null }, d);
        m.sector = D.pointSector(g.L, m.x, m.y); const s = g.L.sectors[m.sector]; m.floorz = s.floor; m.ceilingz = s.ceil;
        if (d.st) { const st = info.st[d.st[0]][d.st[1]]; m.state = st; m.frame = st.frame; m.bright = st.bright; } else m.state = null;
        return m;
      });
      data.mobjs.forEach((d, i) => { g.mobjs[i].target = d.target >= 0 ? g.mobjs[d.target] : null; });
      const p = Object.assign(g.newPlayer(), data.player);
      p.mo = g.mobjs[data.player.mo]; p.mo.player = p; p.attacker = data.player.attacker >= 0 ? g.mobjs[data.player.attacker] : null;
      p.psp = data.player.psp.map(ps => ({ sx: ps.sx, sy: ps.sy, tics: ps.tics, state: ps.st ? WEAPONS[p.ready].st[ps.st[0]][ps.st[1]] : null }));
      if (p.psp[1].state && !WEAPONS[p.ready].st[p.psp[1].state.label]) p.psp[1].state = null;
      p.cmd = { forward: 0, side: 0 }; p.pviewz = p.viewz; p.pangle = p.mo.angle;
      g.player = p;
      g.rebuildThingGrid();
      for (const m of g.mobjs) { g.checkPosition(m, m.x, m.y); m.floorz = g.tmFloor; m.ceilingz = g.tmCeil; }
      return g;
    }
  }

  function distToLine(px, py, l) {
    const dx = l.dx, dy = l.dy; let t = ((px - l.x1) * dx + (py - l.y1) * dy) / (l.len * l.len);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return Math.hypot(px - (l.x1 + dx * t), py - (l.y1 + dy * t));
  }

  // ================================================================= monster actions (this = Game)
  const ACTIONS = {
    look(mo) {
      mo.threshold = 0;
      const targ = this.L.sectors[mo.sector].soundTarget;
      let see = false;
      if (targ && (targ.flags & MF.SHOOTABLE) && this.L.sectors[mo.sector].soundValid === this.soundValid && !(targ.player && targ.player.dead)) {
        mo.target = targ;
        see = !(mo.flags & MF.AMBUSH) || this.checkSight(mo, targ);
      }
      if (!see && !this.lookForPlayers(mo, false)) return;
      const s = mo.info.sounds && mo.info.sounds.see;
      if (s) this.sound(s, mo, mo.type === 'cyber');
      this.setState(mo, 'see');
    },
    chase(mo) {
      if (mo.reactiontime) mo.reactiontime--;
      if (mo.threshold) { if (!mo.target || mo.target.health <= 0 || mo.target.removed) mo.threshold = 0; else mo.threshold--; }
      if (mo.movedir < 8) {
        const want = mo.movedir * PI / 4, d = normAng(Math.round(mo.angle / (PI / 4)) * (PI / 4) - want);
        mo.angle = Math.round(mo.angle / (PI / 4)) * (PI / 4);
        if (d > 0.01) mo.angle -= PI / 4; else if (d < -0.01) mo.angle += PI / 4;
      }
      if (!mo.target || !(mo.target.flags & MF.SHOOTABLE) || mo.target.removed) {
        if (this.lookForPlayers(mo, true)) return;
        this.setState(mo, 'spawn'); return;
      }
      if (mo.flags & MF.JUSTATTACKED) { mo.flags &= ~MF.JUSTATTACKED; if (!this.sk.fast) this.newChaseDir(mo); return; }
      if (mo.info.st.melee && this.checkMeleeRange(mo)) {
        if (mo.info.sounds && mo.info.sounds.attack && mo.type !== 'zombie' && mo.type !== 'sgguy') this.sound(mo.info.sounds.attack, mo);
        this.setState(mo, 'melee'); return;
      }
      if (mo.info.st.missile && (this.sk.fast || !mo.movecount) && this.checkMissileRange(mo)) { this.setState(mo, 'missile'); mo.flags |= MF.JUSTATTACKED; return; }
      if (--mo.movecount < 0 || !this.moveMonster(mo)) this.newChaseDir(mo);
      if (mo.info.sounds && mo.info.sounds.active && this.rng.P() < 3) this.sound(mo.info.sounds.active, mo);
    },
    face(mo) { this.faceTarget(mo); },
    pain(mo) { if (mo.info.sounds && mo.info.sounds.pain) this.sound(mo.info.sounds.pain, mo); },
    scream(mo) { if (mo.info.sounds && mo.info.sounds.death) this.sound(mo.info.sounds.death, mo, mo.type === 'cyber'); },
    xscream(mo) { this.sound('slop', mo); },
    playerScream(mo) { this.sound('pldeth', mo, true); },
    fall(mo) { mo.flags &= ~MF.SOLID; },
    hoof(mo) { this.sound('hoof', mo); ACTIONS.chase.call(this, mo); },
    metal(mo) { this.sound('metal', mo); ACTIONS.chase.call(this, mo); },
    posAttack(mo) {
      if (!mo.target) return; this.faceTarget(mo);
      const slope = this.aimLine(mo, mo.angle, MISSILERANGE);
      this.sound('pistol', mo);
      const a = mo.angle + this.rng.sub() * (22.5 * DEG / 255);
      this.lineAttack(mo, a, MISSILERANGE, slope, (this.rng.P() % 5 + 1) * 3);
    },
    sposAttack(mo) {
      if (!mo.target) return; this.sound('shotgn', mo); this.faceTarget(mo);
      const slope = this.aimLine(mo, mo.angle, MISSILERANGE);
      for (let i = 0; i < 3; i++) this.lineAttack(mo, mo.angle + this.rng.sub() * (22.5 * DEG / 255), MISSILERANGE, slope, (this.rng.P() % 5 + 1) * 3);
    },
    troopAttack(mo) {
      if (!mo.target) return; this.faceTarget(mo);
      if (this.checkMeleeRange(mo)) { this.sound('claw', mo); this.damage(mo.target, mo, mo, (this.rng.P() % 8 + 1) * 3); return; }
      this.spawnMissile(mo, mo.target, 'impball');
    },
    sargAttack(mo) {
      if (!mo.target) return; this.faceTarget(mo);
      if (this.checkMeleeRange(mo)) this.damage(mo.target, mo, mo, (this.rng.P() % 10 + 1) * 4);
    },
    headAttack(mo) {
      if (!mo.target) return; this.faceTarget(mo);
      if (this.checkMeleeRange(mo)) { this.damage(mo.target, mo, mo, (this.rng.P() % 6 + 1) * 10); return; }
      this.spawnMissile(mo, mo.target, 'cacoball');
    },
    bruisAttack(mo) {
      if (!mo.target) return;
      if (this.checkMeleeRange(mo)) { this.sound('claw', mo); this.damage(mo.target, mo, mo, (this.rng.P() % 8 + 1) * 10); return; }
      this.spawnMissile(mo, mo.target, 'baronball');
    },
    cyberAttack(mo) { if (!mo.target) return; this.faceTarget(mo); this.spawnMissile(mo, mo.target, 'rocket'); },
    skullAttack(mo) {
      if (!mo.target) return;
      const t = mo.target; mo.flags |= MF.SKULLFLY; this.sound('sklatk', mo); this.faceTarget(mo);
      mo.momx = Math.cos(mo.angle) * 20; mo.momy = Math.sin(mo.angle) * 20;
      const dist = Math.max(1, Math.hypot(t.x - mo.x, t.y - mo.y) / 20);
      mo.momz = (t.z + t.height / 2 - mo.z) / dist;
    },
    explode(mo) { this.radiusAttack(mo, mo.target, 128); },
    bfgSpray(mo) {
      const src = mo.target; if (!src) return;
      for (let i = 0; i < 40; i++) {
        const an = mo.angle - PI / 4 + (PI / 2) / 40 * i;
        this.aimLine(src, an, 1024);
        const t = this.lineTarget; if (!t) continue;
        this.spawn('bfgspray', t.x, t.y, t.z + t.height / 4);
        let dmg = 0; for (let j = 0; j < 15; j++) dmg += (this.rng.P() & 7) + 1;
        this.damage(t, src, src, dmg);
      }
    },
    bossDeath(mo) {
      if (this.info.bossType !== mo.type || this.bossDone) return;
      if (this.mobjs.some(m => m !== mo && !m.removed && m.type === mo.type && m.health > 0)) return;
      this.bossDone = true;
      const act = this.info.bossAction || { action: 'exit' };
      if (act.action === 'exit') this.exitLevel(false); else this.doAction(act.action, act.tag, this.player.mo, null);
    }
  };

  // ================================================================= weapon actions (this = Game)
  const WEAPON_ACTIONS = {
    weaponReady(psp) {
      const p = this.player;
      if (p.ready === 'chainsaw' && psp.state.frame === 'C') this.sound('sawidl', p.mo, true);
      if (p.pending || p.health <= 0) { this.setPsp(0, 'lower'); return; }
      if (p.fire) { if (!p.attackdown || !['rocket', 'bfg'].includes(p.ready)) { p.attackdown = true; this.fireWeapon(); return; } }
      else p.attackdown = false;
      const a1 = TAU * (this.leveltime & 63) / 64;
      psp.sx = 1 + p.bob * Math.cos(a1);
      psp.sy = WEAPONTOP + p.bob * Math.abs(Math.sin(a1));
    },
    lower(psp) {
      const p = this.player;
      psp.sy += LOWERSPEED;
      if (psp.sy < WEAPONBOTTOM) return;
      if (p.dead) { psp.sy = WEAPONBOTTOM; psp.tics = -1; return; }
      if (!p.pending) p.pending = p.ready;
      p.ready = p.pending; p.pending = null;
      this.setPsp(0, 'raise');
      if (p.ready === 'chainsaw') this.sound('sawup', p.mo, true);
    },
    raise(psp) {
      psp.sy -= RAISESPEED;
      if (psp.sy > WEAPONTOP) return;
      psp.sy = WEAPONTOP; psp.sx = 1;
      this.setPsp(0, 'ready');
    },
    reFire() {
      const p = this.player;
      if (p.fire && !p.pending && p.health > 0) { p.refire++; this.fireWeapon(); }
      else { p.refire = 0; this.checkAmmo(); }
    },
    gunFlash() { this.setPsp(1, 'flash'); },
    light1() { this.player.extralight = 1; },
    light2() { this.player.extralight = 2; },
    lightDone() { this.player.extralight = 0; },
    punch() {
      const p = this.player, mo = p.mo;
      let dmg = (this.rng.P() % 10 + 1) * 2; if (p.powers.strength) dmg *= 10;
      const an = mo.angle + this.rng.sub() * (5.625 * DEG / 255), slope = this.aimLine(mo, an, MELEERANGE);
      const t = this.lineTarget;
      this.lineAttack(mo, an, MELEERANGE, slope, dmg);
      if (t) { this.sound('punch', mo, true); mo.angle = Math.atan2(t.y - mo.y, t.x - mo.x); }
    },
    saw() {
      const p = this.player, mo = p.mo, dmg = 2 * (this.rng.P() % 10 + 1);
      const an = mo.angle + this.rng.sub() * (5.625 * DEG / 255), slope = this.aimLine(mo, an, MELEERANGE + 1);
      const t = this.lineTarget;
      this.lineAttack(mo, an, MELEERANGE + 1, slope, dmg);
      if (!t) { this.sound('sawful', mo, true); return; }
      this.sound('sawhit', mo, true);
      const want = Math.atan2(t.y - mo.y, t.x - mo.x), d = normAng(want - mo.angle);
      if (Math.abs(d) > 2 * DEG) mo.angle = normAng(mo.angle + Math.sign(d) * Math.min(Math.abs(d), 4 * DEG)); else mo.angle = want;
    },
    firePistol() {
      const p = this.player; this.sound('pistol', p.mo, true); p.ammo.bullets--;
      this.setPsp(1, 'flash'); this.gunShot(p.mo, !p.refire, this.bulletSlope(p.mo));
    },
    fireShotgun() {
      const p = this.player; this.sound('shotgn', p.mo, true); p.ammo.shells--;
      this.setPsp(1, 'flash'); const slope = this.bulletSlope(p.mo);
      for (let i = 0; i < 7; i++) this.gunShot(p.mo, false, slope);
    },
    fireShotgun2() {
      const p = this.player, mo = p.mo; this.sound('dshtgn', mo, true); p.ammo.shells = Math.max(0, p.ammo.shells - 2);
      this.setPsp(1, 'flash'); const slope = this.bulletSlope(mo);
      for (let i = 0; i < 20; i++) this.lineAttack(mo, mo.angle + this.rng.sub() * (11.25 * DEG / 255), MISSILERANGE, slope + this.rng.sub() * (0.125 / 255), 5 * (this.rng.P() % 3 + 1));
    },
    checkReload() {},
    openShotgun2() { this.sound('dbopn', this.player.mo, true); },
    loadShotgun2() { this.sound('dbload', this.player.mo, true); },
    closeShotgun2() { this.sound('dbcls', this.player.mo, true); WEAPON_ACTIONS.reFire.call(this); },
    fireCGun(psp) {
      const p = this.player; if (!p.ammo.bullets) return;
      this.sound('pistol', p.mo, true); p.ammo.bullets--;
      this.setPsp(1, psp.state.frame === 'A' ? 'flash' : 'flash2');
      this.gunShot(p.mo, !p.refire, this.bulletSlope(p.mo));
    },
    fireMissile() { const p = this.player; p.ammo.rockets--; this.spawnPlayerMissile(p.mo, 'rocket'); },
    firePlasma() { const p = this.player; p.ammo.cells--; this.setPsp(1, this.rng.P() & 1 ? 'flash2' : 'flash'); this.spawnPlayerMissile(p.mo, 'plasmaball'); },
    bfgSound() { this.sound('bfg', this.player.mo, true); },
    fireBFG() { const p = this.player; p.ammo.cells = Math.max(0, p.ammo.cells - 40); this.spawnPlayerMissile(p.mo, 'bfgball'); }
  };

  D.Game = Game; D.RNG = RNG; D.ACTIONS = ACTIONS; D.normAng = normAng; D.distToLine = distToLine;
  D.CONST = { MELEERANGE, MISSILERANGE, VIEWHEIGHT, WEAPONTOP, WEAPONBOTTOM, TICRATE };
  if (typeof module !== 'undefined') module.exports = D;
})(globalThis.Doom98 = globalThis.Doom98 || {});
