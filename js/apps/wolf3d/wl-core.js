(function (W) {
  'use strict';
  const D = W.Data, PL = D.PLAYER, TIC = D.TIC;
  const DX8 = [1, 1, 0, -1, -1, -1, 0, 1], DY8 = [0, 1, 1, 1, 0, -1, -1, -1];
  const NODIR = 8;
  const OPP = d => d === NODIR ? NODIR : (d + 4) & 7;
  const DOOR_SPEED = 1 / 64, DOOR_WAIT = 300, PUSH_SPEED = 1 / 128, FAST_RUN_BOOST = 2;

  function castRay(G, ox, oy, rdx, rdy, maxT = 64) {
    const L = G.level, w = L.w, h = L.h;
    let mx = Math.floor(ox), my = Math.floor(oy);
    const ddx = rdx === 0 ? 1e30 : Math.abs(1 / rdx), ddy = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
    const sx = rdx < 0 ? -1 : 1, sy = rdy < 0 ? -1 : 1;
    let sdx = rdx < 0 ? (ox - mx) * ddx : (mx + 1 - ox) * ddx, sdy = rdy < 0 ? (oy - my) * ddy : (my + 1 - oy) * ddy;
    const pw = G.pushwall;
    let prevDoor = false, side = 0, t = 0;
    for (let guard = 0; guard < 256; guard++) {
      if (sdx < sdy) { t = sdx; sdx += ddx; mx += sx; side = 0; } else { t = sdy; sdy += ddy; my += sy; side = 1; }
      if (t > maxT) return null;
      if (mx < 0 || my < 0 || mx >= w || my >= h) return { t, side, x: mx, y: my, tex: 1, u: 0, kind: 'wall' };
      const k = my * w + mx;
      if (pw && ((mx === pw.x && my === pw.y) || (mx === pw.x + pw.dx && my === pw.y + pw.dy))) {
        const bx0 = pw.x + pw.dx * pw.off, by0 = pw.y + pw.dy * pw.off, bx1 = bx0 + 1, by1 = by0 + 1;
        let tn = -Infinity, tf = Infinity, ax = 0;
        if (rdx !== 0) { let a = (bx0 - ox) / rdx, b = (bx1 - ox) / rdx; if (a > b) [a, b] = [b, a]; if (a > tn) { tn = a; ax = 0; } tf = Math.min(tf, b); } else if (ox < bx0 || ox > bx1) tn = Infinity;
        if (rdy !== 0) { let a = (by0 - oy) / rdy, b = (by1 - oy) / rdy; if (a > b) [a, b] = [b, a]; if (a > tn) { tn = a; ax = 1; } tf = Math.min(tf, b); } else if (oy < by0 || oy > by1) tn = Infinity;
        if (tn <= tf && tn > 0) {
          const hx = ox + rdx * tn, hy = oy + rdy * tn;
          if (hx >= mx - 1e-4 && hx <= mx + 1 + 1e-4 && hy >= my - 1e-4 && hy <= my + 1 + 1e-4) {
            let u = ax === 0 ? hy - by0 : hx - bx0;
            if ((ax === 0 && rdx > 0) || (ax === 1 && rdy < 0)) u = 1 - u;
            return { t: tn, side: ax, x: mx, y: my, tex: pw.tex, u: Math.min(0.9999, Math.max(0, u)), kind: 'push' };
          }
        }
        prevDoor = false;
        continue;
      }
      const di = L.doorAt[k];
      if (di >= 0) {
        const door = L.doors[di];
        let tt, f;
        if (door.axis === 'v') { if (rdx === 0) { prevDoor = true; continue; } tt = (mx + 0.5 - ox) / rdx; f = oy + tt * rdy - my; }
        else { if (rdy === 0) { prevDoor = true; continue; } tt = (my + 0.5 - oy) / rdy; f = ox + tt * rdx - mx; }
        if (tt > 0 && f >= 0 && f < 1 && f >= door.pos) {
          const tex = door.elev ? 'doorelev' : door.lock === 1 ? 'doorlock1' : door.lock === 2 ? 'doorlock2' : 'door';
          const u = f - door.pos;
          return { t: tt, side: door.axis === 'v' ? 0 : 1, x: mx, y: my, tex: D.TEXTURES.indexOf(tex) + 1, u: Math.min(0.9999, Math.max(0, u)), kind: 'door', door };
        }
        prevDoor = true;
        continue;
      }
      if (L.solid[k]) {
        let u = side === 0 ? oy + t * rdy : ox + t * rdx;
        u -= Math.floor(u);
        if ((side === 0 && rdx > 0) || (side === 1 && rdy < 0)) u = 1 - u;
        const tex = prevDoor ? D.TEXTURES.indexOf('doorside') + 1 : L.wall[k];
        return { t, side, x: mx, y: my, tex, u: Math.min(0.9999, Math.max(0, u)), kind: 'wall' };
      }
      prevDoor = false;
    }
    return null;
  }

  class Game {
    constructor(opts) {
      this.maps = opts.maps || W.Maps;
      this.skill = opts.skill !== undefined ? opts.skill : 1;
      this.episode = opts.episode || 0;
      this.seed = (opts.seed !== undefined ? opts.seed : (Math.random() * 1e9) | 0) >>> 0;
      this.score = 0; this.lives = PL.lives; this.nextExtra = PL.extraLife;
      this.health = 100; this.ammo = PL.startAmmo; this.weapons = [true, true, false, false]; this.weapon = 1; this.chosen = 1;
      this.keys = [false, false];
      this.god = false; this.noclip = false; this.fastRun = false; this.infiniteAmmo = false; this.events = []; this.messages = [];
      this.stats = []; this.totalTime = 0;
      this.mliUsed = false;
      this.floor = opts.floor || 0;
      if (opts.noStart) return;
      this.startLevel(this.floor);
    }

    rand() { this.seed = (Math.imul(this.seed, 1103515245) + 12345) >>> 0; return (this.seed >>> 16) & 255; }
    mapDef(floor = this.floor) { return this.maps[this.episode][floor]; }
    snd(name, x, y) { if (name) this.events.push({ snd: name, x: x === undefined ? this.px : x, y: y === undefined ? this.py : y }); }
    msg(text) { this.messages.push(text); }

    startLevel(floor) {
      this.floor = floor;
      const def = this.mapDef(floor);
      const L = W.Level.parse(def, this.skill);
      this.level = L;
      this.px = L.start.x; this.py = L.start.y; this.angle = L.start.angle;
      this.keys = [false, false];
      this.pushwall = null;
      this.projectiles = []; this.effects = [];
      this.occ = new Int16Array(L.w * L.h).fill(-1);
      this.actors = L.actors.map((a, i) => this.makeActor(a, i));
      this.kills = 0; this.secrets = 0; this.treasures = 0; this.time = 0;
      this.mode = 'play'; this.atk = null; this.prevFire = false; this.prevUse = false; this.prevPush = false;
      this.damageFlash = 0; this.bonusFlash = 0; this.grin = 0; this.faceLook = 0; this.faceCount = 0;
      this.madenoise = false; this.areaDirty = true; this.areaLinks = []; this.thrust = 0;
      this.oldScore = this.score;
      this.exitType = 0; this.exitTics = 0; this.killer = null; this.bossKill = null; this.dyingTics = 0;
      if (this.weapon > 0 && this.ammo <= 0) this.weapon = 0;
      this.levelStartState = { health: this.health, ammo: this.ammo, weapons: this.weapons.slice(), weapon: this.weapon, chosen: this.chosen };
    }

    makeActor(a, i) {
      const def = D.ENEMIES[a.type];
      const A = {
        id: i, type: a.type, def, x: a.x + 0.5, y: a.y + 0.5, tx: a.x, ty: a.y, dir: a.dir, dist: 0, doorWait: -1,
        hp: def.hp[this.skill], state: a.patrol ? 'path' : 'stand', attack: false, ambush: a.ambush, firstAttack: false,
        reaction: 0, anim: null, frame: 0, ftics: 0, visible: false, variant: a.variant || 0, painFlip: false
      };
      if (def.ghost) { A.state = 'chase'; A.attack = true; A.dir = NODIR; }
      if (def.boss && !def.ghost) A.ambush = false;
      this.occ[a.y * this.level.w + a.x] = i;
      return A;
    }

    get tileX() { return Math.floor(this.px); }
    get tileY() { return Math.floor(this.py); }

    isDoorBlockingMove(k) { const di = this.level.doorAt[k]; return di >= 0 && this.level.doors[di].pos < 1; }
    tileBlocked(x, y) {
      const L = this.level;
      if (x < 0 || y < 0 || x >= L.w || y >= L.h) return true;
      const k = y * L.w + x;
      if (L.solid[k]) return true;
      if (this.isDoorBlockingMove(k)) return true;
      const si = L.statAt[k];
      if (si >= 0 && L.statics[si].block && L.statics[si].active) return true;
      const pw = this.pushwall;
      if (pw && ((x === pw.x && y === pw.y) || (x === pw.x + pw.dx && y === pw.y + pw.dy))) return true;
      return false;
    }

    tryMove(x, y) {
      const r = PL.radius;
      if (!this.noclip) {
        for (let ty = Math.floor(y - r); ty <= Math.floor(y + r); ty++) for (let tx = Math.floor(x - r); tx <= Math.floor(x + r); tx++) if (this.tileBlocked(tx, ty)) return false;
      }
      for (const a of this.actors) {
        if (a.state === 'dead' || a.state === 'die') continue;
        if (Math.abs(a.x - x) < 0.72 && Math.abs(a.y - y) < 0.72) {
          if (Math.abs(a.x - this.px) < 0.72 && Math.abs(a.y - this.py) < 0.72) continue;
          return false;
        }
      }
      return true;
    }

    clipMove(dx, dy) {
      const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.2) || 1;
      for (let i = 0; i < steps; i++) {
        const sx = dx / steps, sy = dy / steps;
        if (this.tryMove(this.px + sx, this.py + sy)) { this.px += sx; this.py += sy; continue; }
        if (this.tryMove(this.px + sx, this.py)) { this.px += sx; continue; }
        if (this.tryMove(this.px, this.py + sy)) { this.py += sy; continue; }
      }
    }

    tic(inp) {
      this.events.length = 0;
      inp = inp || {};
      if (this.mode === 'play') this.playTic(inp);
      else if (this.mode === 'dying') this.dyingTic();
      else if (this.mode === 'exit') { this.exitTics++; if (this.exitTics > 50) this.mode = 'exited'; }
      else if (this.mode === 'bosskill') { this.updateActors(); this.updateEffects(); }
      else if (this.mode === 'deathcam') this.deathcamTic();
      this.damageFlash = Math.max(0, this.damageFlash - 1 / 20);
      this.bonusFlash = Math.max(0, this.bonusFlash - 1 / 12);
    }

    playTic(inp) {
      this.time++;
      const run = !!inp.run;
      const turnRate = (run ? PL.runTurn : PL.turn) / TIC;
      if (inp.strafeHeld) { inp.strafe = (inp.strafe || 0) + (inp.turn || 0); inp.turn = 0; }
      this.angle += (inp.turn || 0) * turnRate + (inp.mouseTurn || 0);
      this.angle = Math.atan2(Math.sin(this.angle), Math.cos(this.angle));
      const boost = this.fastRun ? FAST_RUN_BOOST : 1;
      const sp = (run ? PL.run : PL.walk) / TIC * boost;
      const f = Math.max(-1, Math.min(1, inp.fwd || 0)), s = Math.max(-1, Math.min(1, inp.strafe || 0));
      const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
      let dx = (ca * f - sa * s) * sp + ca * (inp.mouseFwd || 0) * boost, dy = (sa * f + ca * s) * sp + sa * (inp.mouseFwd || 0) * boost;
      const len = Math.hypot(dx, dy), maxStep = PL.run / TIC * 1.2 * boost;
      if (len > maxStep) { dx *= maxStep / len; dy *= maxStep / len; }
      this.thrust = Math.hypot(dx, dy) * TIC;
      if (dx || dy) {
        const otx = this.tileX, oty = this.tileY;
        this.clipMove(dx, dy);
        if (otx !== this.tileX || oty !== this.tileY) this.areaDirty = true;
      }
      this.checkPickups();
      if (inp.weapon !== undefined && inp.weapon >= 0) this.selectWeapon(inp.weapon);
      if (inp.use && !this.prevUse) this.use();
      this.prevUse = !!inp.use;
      this.weaponTic(!!inp.fire);
      this.updateDoors();
      this.updatePushwall();
      this.updateActors();
      this.updateProjectiles();
      this.updateEffects();
      this.madenoise = false;
      this.faceTic();
      if (this.health <= 0 && this.mode === 'play') this.die();
    }

    faceTic() {
      if (this.grin > 0) this.grin--;
      if (--this.faceCount <= 0) { this.faceLook = [-1, 0, 0, 1][this.rand() & 3]; this.faceCount = 35 + (this.rand() >> 1); }
    }
    get faceName() {
      if (this.health <= 0) return 'dead';
      const stage = Math.min(6, Math.floor((100 - this.health) / 16));
      if (this.god && !this.hideGod) return 'god' + stage;
      if (this.grin > 0) return 'grin';
      return `f${stage}_${this.faceLook}`;
    }

    givePoints(n) {
      this.score += n;
      while (this.score >= this.nextExtra) { this.nextExtra += PL.extraLife; this.giveLife(); }
    }
    giveLife() { if (this.lives < PL.maxLives) this.lives++; this.snd('p_oneup'); }

    checkPickups() {
      const L = this.level, k = this.tileY * L.w + this.tileX;
      for (let i = 0; i < L.statics.length; i++) {
        const st = L.statics[i];
        if (!st.active || !st.pick || st.x !== this.tileX || st.y !== this.tileY) continue;
        if (this.pickup(st)) { st.active = false; if (L.statAt[k] === i) L.statAt[k] = -1; }
      }
    }

    pickup(st) {
      const p = D.PICKUPS[st.pick];
      if (p.heal) {
        if (this.health >= PL.maxHealth) return false;
        if (p.onlyBelow && this.health >= p.onlyBelow) return false;
        this.health = Math.min(PL.maxHealth, this.health + p.heal);
      }
      if (p.ammo && !p.weapon) {
        if (this.ammo >= PL.maxAmmo) return false;
        this.giveAmmo(p.ammo);
      }
      if (p.key) this.keys[p.key - 1] = true;
      if (p.score) this.givePoints(p.score);
      if (p.treasure) this.treasures++;
      if (p.life) { this.health = PL.maxHealth; this.giveAmmo(25); this.giveLife(); }
      if (p.weapon) {
        this.giveAmmo(p.ammo);
        if (!this.weapons[p.weapon]) this.weapons[p.weapon] = true;
        if (this.chosen < p.weapon) { this.chosen = p.weapon; if (!this.atk) this.weapon = p.weapon; }
        if (p.grin) this.grin = 140;
      }
      this.bonusFlash = 1;
      this.snd(p.snd);
      return true;
    }

    giveAmmo(n) {
      const was = this.ammo;
      this.ammo = Math.min(PL.maxAmmo, this.ammo + n);
      if (was <= 0 && this.weapon === 0 && this.chosen > 0 && !this.atk) this.weapon = this.chosen;
    }

    selectWeapon(w) {
      if (this.atk || !this.weapons[w]) return;
      if (w > 0 && this.ammo <= 0) return;
      this.weapon = w; this.chosen = w;
    }

    use() {
      const dir = ((Math.round(this.angle / (Math.PI / 2)) % 4) + 4) % 4;
      const [dx, dy] = W.Level.DIRS4[dir];
      const cx = this.tileX + dx, cy = this.tileY + dy, L = this.level;
      if (cx < 0 || cy < 0 || cx >= L.w || cy >= L.h) return;
      const k = cy * L.w + cx;
      const di = L.doorAt[k];
      if (di >= 0) { this.operateDoor(L.doors[di]); return; }
      if (L.push[k] && !this.pushwall) { this.startPush(cx, cy, dx, dy); return; }
      if (L.exitAt[k] && L.solid[k]) {
        this.exitType = L.exitAt[k];
        L.wall[k] = D.TEXTURES.indexOf('switchdown') + 1;
        this.snd('u_switch');
        this.mode = 'exit'; this.exitTics = 0;
        return;
      }
      if (L.solid[k]) this.snd('u_nothing');
    }

    operateDoor(door) {
      if (door.lock && !this.keys[door.lock - 1]) { this.snd('u_locked', door.x + 0.5, door.y + 0.5); return; }
      if (door.state === 'closed' || door.state === 'closing') this.openDoor(door);
      else if (!this.doorOccupied(door)) { door.state = 'closing'; this.snd('u_door_close', door.x + 0.5, door.y + 0.5); }
    }

    openDoor(door) {
      if (door.state === 'open') { door.tics = 0; return; }
      if (door.state === 'opening') return;
      if (door.state === 'closed') this.areaDirty = true;
      door.state = 'opening';
      this.snd('u_door_open', door.x + 0.5, door.y + 0.5);
    }

    doorOccupied(door) {
      const r = PL.radius;
      if (Math.floor(this.px - r) <= door.x && Math.floor(this.px + r) >= door.x && Math.floor(this.py - r) <= door.y && Math.floor(this.py + r) >= door.y) return true;
      const k = door.y * this.level.w + door.x;
      if (this.occ[k] >= 0) return true;
      for (const a of this.actors) if ((a.state === 'dead' || a.state === 'die') && Math.floor(a.x) === door.x && Math.floor(a.y) === door.y) return true;
      return false;
    }

    updateDoors() {
      for (const door of this.level.doors) {
        if (door.state === 'opening') {
          door.pos += DOOR_SPEED;
          if (door.pos >= 1) { door.pos = 1; door.state = 'open'; door.tics = 0; }
        } else if (door.state === 'open') {
          if (++door.tics >= DOOR_WAIT) {
            if (this.doorOccupied(door)) door.tics = DOOR_WAIT - 35;
            else { door.state = 'closing'; this.snd('u_door_close', door.x + 0.5, door.y + 0.5); }
          }
        } else if (door.state === 'closing') {
          if (this.doorOccupied(door)) { door.state = 'opening'; continue; }
          door.pos -= DOOR_SPEED;
          if (door.pos <= 0) { door.pos = 0; door.state = 'closed'; this.areaDirty = true; }
        }
      }
    }

    startPush(x, y, dx, dy) {
      const L = this.level;
      const nx = x + dx, ny = y + dy;
      if (this.pushTileBlocked(nx, ny)) { this.snd('u_nothing'); return; }
      const k = y * L.w + x;
      this.pushwall = { x, y, dx, dy, off: 0, tex: L.wall[k], steps: 0 };
      L.solid[k] = 0; L.push[k] = 0; L.wall[k] = 0;
      L.area[k] = L.area[this.tileY * L.w + this.tileX];
      this.secrets++;
      this.snd('u_pushwall', x + 0.5, y + 0.5);
    }

    pushTileBlocked(x, y) {
      const L = this.level;
      if (x < 0 || y < 0 || x >= L.w || y >= L.h) return true;
      const k = y * L.w + x;
      if (L.solid[k] || L.doorAt[k] >= 0 || this.occ[k] >= 0) return true;
      const si = L.statAt[k];
      if (si >= 0 && L.statics[si].active && L.statics[si].block) return true;
      if (Math.floor(this.px) === x && Math.floor(this.py) === y) return true;
      return false;
    }

    updatePushwall() {
      const pw = this.pushwall;
      if (!pw) return;
      pw.off += PUSH_SPEED;
      if (pw.off < 1) return;
      const L = this.level;
      pw.x += pw.dx; pw.y += pw.dy; pw.off = 0; pw.steps++;
      const k = pw.y * L.w + pw.x;
      const pa = L.area[this.tileY * L.w + this.tileX], oa = L.area[k];
      if (oa >= 0 && pa >= 0 && oa !== pa) { this.areaLinks.push([pa, oa]); this.areaDirty = true; }
      if (pw.steps < 2 && !this.pushTileBlocked(pw.x + pw.dx, pw.y + pw.dy)) return;
      L.solid[k] = 1; L.wall[k] = pw.tex; L.area[k] = -1;
      this.pushwall = null;
    }

    reachableAreas() {
      if (!this.areaDirty && this.areaCache && this.areaCacheTile === this.tileY * this.level.w + this.tileX) return this.areaCache;
      const L = this.level, set = new Uint8Array(L.areaCount + 1);
      const start = L.area[this.tileY * L.w + this.tileX];
      const stack = [];
      if (start >= 0) { set[start] = 1; stack.push(start); }
      const pdoor = L.doorAt[this.tileY * L.w + this.tileX];
      if (pdoor >= 0) for (const a of L.doors[pdoor].areas) if (a >= 0 && !set[a]) { set[a] = 1; stack.push(a); }
      while (stack.length) {
        const a = stack.pop();
        for (const d of L.doors) {
          if (d.state === 'closed') continue;
          const [p, q] = d.areas;
          if (p === a && q >= 0 && !set[q]) { set[q] = 1; stack.push(q); }
          if (q === a && p >= 0 && !set[p]) { set[p] = 1; stack.push(p); }
        }
        for (const [p, q] of this.areaLinks) {
          if (p === a && !set[q]) { set[q] = 1; stack.push(q); }
          if (q === a && !set[p]) { set[p] = 1; stack.push(p); }
        }
      }
      this.areaCache = set; this.areaCacheTile = this.tileY * L.w + this.tileX; this.areaDirty = false;
      return set;
    }
    actorArea(a) {
      const L = this.level, k = Math.floor(a.y) * L.w + Math.floor(a.x);
      const ar = L.area[k];
      if (ar >= 0) return ar;
      const di = L.doorAt[k];
      return di >= 0 ? L.doors[di].areas[0] : -1;
    }
    areaByPlayer(a) { const ar = this.actorArea(a); return ar >= 0 && !!this.reachableAreas()[ar]; }

    lineClear(x0, y0, x1, y1) {
      const dx = x1 - x0, dy = y1 - y0, dist = Math.hypot(dx, dy);
      if (dist < 1e-6) return true;
      const hit = castRay(this, x0, y0, dx / dist, dy / dist, dist);
      return !hit || hit.t >= dist;
    }

    weaponTic(fire) {
      const firePressed = fire && !this.prevFire;
      this.prevFire = fire;
      if (!this.atk) {
        if (!fire) return;
        if (this.weapon > 0 && this.ammo <= 0) { this.weapon = 0; }
        const def = D.WEAPONS[this.weapon];
        if (!firePressed && this.weapon < 2) return;
        this.atk = { i: 0, tics: def.frames[0][1] };
        return;
      }
      const def = D.WEAPONS[this.weapon];
      if (--this.atk.tics > 0) return;
      const leave = def.frames[this.atk.i][3];
      let next = this.atk.i + 1;
      if (leave === 'loop' && fire && this.ammo > 0) next = 1;
      if (next >= def.frames.length) {
        this.atk = null;
        if (this.weapon > 0 && this.ammo <= 0) this.weapon = 0;
        return;
      }
      this.atk.i = next; this.atk.tics = def.frames[next][1];
      const act = def.frames[next][2];
      if (act === 'fire') {
        if (this.ammo <= 0) { this.atk.i = Math.min(def.frames.length - 1, next + 1); return; }
        if (!this.infiniteAmmo) this.ammo--;
        this.gunAttack(def);
      } else if (act === 'knife') this.knifeAttack();
    }
    get weaponFrame() { return this.atk ? D.WEAPONS[this.weapon].frames[this.atk.i][0] : 0; }

    findTarget(maxDist) {
      const ca = Math.cos(this.angle), sa = Math.sin(this.angle);
      let best = null, bd = Infinity;
      for (const a of this.actors) {
        if (a.state === 'dead' || a.state === 'die' || a.def.invulnerable) continue;
        const dx = a.x - this.px, dy = a.y - this.py;
        const fwd = dx * ca + dy * sa;
        if (fwd <= 0.05 || fwd > maxDist) continue;
        const side = -dx * sa + dy * ca;
        if (Math.abs(side) > fwd * PL.aimTan + 0.18) continue;
        if (fwd < bd && this.lineClear(this.px, this.py, a.x, a.y)) { bd = fwd; best = a; }
      }
      return best ? { a: best, fwd: bd } : null;
    }

    gunAttack(def) {
      this.snd(def.snd);
      this.madenoise = true;
      const tg = this.findTarget(64);
      if (!tg) return;
      const a = tg.a;
      const dist = Math.max(Math.abs(Math.floor(a.x) - this.tileX), Math.abs(Math.floor(a.y) - this.tileY));
      let dmg;
      if (dist < 2) dmg = this.rand() >> 2;
      else if (dist < 4) dmg = Math.floor(this.rand() / 6);
      else { if (Math.floor(this.rand() / 12) < dist) return; dmg = Math.floor(this.rand() / 6); }
      this.damageActor(a, dmg);
    }

    knifeAttack() {
      this.snd('w_knife');
      const tg = this.findTarget(PL.knifeReach);
      if (!tg) return;
      this.damageActor(tg.a, this.rand() >> 4);
    }

    damageActor(a, dmg) {
      if (a.state === 'dead' || a.state === 'die' || a.def.invulnerable) return;
      if (!a.attack) dmg *= 2;
      a.hp -= dmg;
      if (a.hp <= 0) { this.killActor(a); return; }
      if (!a.attack) this.firstSighting(a);
      if (!a.def.boss && !a.def.ghost) {
        a.painFlip = !a.painFlip;
        this.setAnim(a, 'pain', [[a.hp & 1 ? 'pain1' : 'pain2', 10]]);
        this.snd('e_pain', a.x, a.y);
      }
    }

    killActor(a) {
      const def = a.def;
      this.givePoints(def.points);
      if (!def.ghost) this.kills++;
      this.snd(def.die[this.rand() % def.die.length], a.x, a.y);
      this.releaseActorTiles(a);
      const dieSeq = a.type === 'dog' ? [['die1', 12], ['die2', 12]] : [['die1', 15], ['die2', 15], ['die3', 15]];
      this.setAnim(a, 'die', dieSeq);
      a.attack = false;
      let drop = def.drop;
      if (drop === 'ssdrop') drop = this.weapons[2] ? 'clip2' : 'mg';
      if (drop) this.spawnStatic(Math.floor(a.x), Math.floor(a.y), drop);
    }

    spawnStatic(x, y, item) {
      const L = this.level;
      L.statics.push({ x, y, spr: item, block: false, pick: item, active: true, dropped: true });
    }

    releaseActorTiles(a) {
      for (let k = 0; k < this.occ.length; k++) if (this.occ[k] === a.id) this.occ[k] = -1;
    }

    setAnim(a, state, seq) {
      a.state = state; a.anim = seq; a.frame = 0; a.ftics = seq[0][1];
      this.enterFrame(a);
    }
    enterFrame(a) {
      const act = a.anim[a.frame][2];
      if (act) this.actorAction(a, act);
    }

    firstSighting(a) {
      if (a.attack) return;
      a.attack = true; a.firstAttack = true; a.reaction = 0;
      a.state = 'chase'; a.anim = null;
      if (a.def.alert) this.snd(a.def.alert, a.x, a.y);
      if (a.dist <= 0 && a.doorWait < 0) a.dir = NODIR;
    }

    playerVisibleFrom(a) {
      return this.lineClear(a.x, a.y, this.px, this.py);
    }

    checkSight(a) {
      if (!this.areaByPlayer(a)) return false;
      const dx = this.px - a.x, dy = this.py - a.y;
      if (Math.abs(dx) < 1.5 && Math.abs(dy) < 1.5) return true;
      switch (a.dir) {
        case 0: if (dx < 0) return false; break;
        case 2: if (dy < 0) return false; break;
        case 4: if (dx > 0) return false; break;
        case 6: if (dy > 0) return false; break;
      }
      return this.playerVisibleFrom(a);
    }

    sightPlayer(a) {
      if (a.reaction > 0) {
        if (--a.reaction > 0) return false;
        this.firstSighting(a);
        return true;
      }
      if (!this.areaByPlayer(a)) return false;
      if (a.ambush) { if (!this.checkSight(a)) return false; a.ambush = false; }
      else if (!this.madenoise && !this.checkSight(a)) return false;
      const t = a.type;
      a.reaction = t === 'guard' ? 1 + (this.rand() >> 2) : t === 'officer' ? 2 : t === 'mutant' || t === 'ss' ? 1 + Math.floor(this.rand() / 6) : t === 'dog' ? 1 + (this.rand() >> 3) : 1;
      return false;
    }

    updateActors() {
      const n = this.actors.length;
      const ca = Math.cos(this.angle), sa = Math.sin(this.angle), fovTan = 0.75;
      for (let i = 0; i < n; i++) {
        const a = this.actors[i];
        if (a.state === 'dead') continue;
        const dx = a.x - this.px, dy = a.y - this.py, fwd = dx * ca + dy * sa, side = -dx * sa + dy * ca;
        a.visible = fwd > 0.1 && Math.abs(side) < fwd * fovTan + 0.5 && (this.time & 3 ? a.visible : this.lineClear(this.px, this.py, a.x, a.y));
        if (a.anim) {
          if (--a.ftics <= 0) {
            a.frame++;
            if (a.frame >= a.anim.length) this.animDone(a);
            else { a.ftics = a.anim[a.frame][1]; this.enterFrame(a); }
          }
          if (a.state === 'die' || a.state === 'pain' || a.state === 'shoot') continue;
        }
        if (this.mode !== 'play') continue;
        if (a.state === 'stand') { this.sightPlayer(a); a.walkT = 0; }
        else if (a.state === 'path') { if (!this.sightPlayer(a)) this.pathTic(a); }
        else if (a.state === 'chase') this.chaseTic(a);
      }
    }

    animDone(a) {
      if (a.state === 'die') {
        a.anim = null;
        if (a.def.spawn) {
          a.state = 'dead';
          const h = this.makeActor({ type: a.def.spawn, x: Math.floor(a.x), y: Math.floor(a.y), dir: NODIR }, this.actors.length);
          h.x = a.x; h.y = a.y; h.state = 'chase'; h.attack = true;
          this.actors.push(h);
          this.level.totals.kills++;
          this.snd(h.def.alert, h.x, h.y);
          return;
        }
        a.state = 'dead';
        if (a.def.deathcam) { this.mode = 'bosskill'; this.bossKill = { id: a.id, tics: 0 }; }
        return;
      }
      a.anim = null;
      a.state = 'chase';
      if (a.dist <= 0 && a.doorWait < 0) a.dir = NODIR;
    }

    actorAction(a, act) {
      if (act === 'fire') { this.tShoot(a); return; }
      if (act === 'bite') { this.tBite(a); return; }
      if (act === 'needle' || act === 'rocket' || act === 'fireball') { this.launch(a, act); return; }
    }

    tShoot(a) {
      this.snd(a.def.fireSnd, a.x, a.y);
      if (!this.areaByPlayer(a)) return;
      if (!this.playerVisibleFrom(a)) return;
      let dist = Math.max(Math.abs(Math.floor(a.x) - this.tileX), Math.abs(Math.floor(a.y) - this.tileY));
      if (a.def.sharp) dist = Math.floor(dist * 2 / 3);
      const running = this.thrust >= PL.run * 0.9;
      const hit = running ? (a.visible ? 160 - dist * 16 : 160 - dist * 8) : (a.visible ? 256 - dist * 16 : 256 - dist * 8);
      if (this.rand() < hit) {
        const dmg = dist < 2 ? this.rand() >> 2 : dist < 4 ? this.rand() >> 3 : this.rand() >> 4;
        this.takeDamage(dmg, a);
      }
    }

    tBite(a) {
      this.snd(a.def.fireSnd, a.x, a.y);
      if (Math.abs(this.px - a.x) <= 1.45 && Math.abs(this.py - a.y) <= 1.45 && this.rand() < 180) this.takeDamage(this.rand() >> 4, a);
    }

    launch(a, kind) {
      const P = D.PROJECTILES[kind];
      const ang = Math.atan2(this.py - a.y, this.px - a.x);
      this.projectiles.push({ kind, x: a.x, y: a.y, vx: Math.cos(ang) * P.speed / TIC, vy: Math.sin(ang) * P.speed / TIC, owner: a.id, t: 0 });
      this.snd(a.def.fireSnd, a.x, a.y);
    }

    updateProjectiles() {
      const L = this.level;
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i], P = D.PROJECTILES[p.kind];
        p.x += p.vx; p.y += p.vy; p.t++;
        if (P.smoke && p.t % 4 === 0) this.effects.push({ x: p.x, y: p.y, seq: ['smoke0', 'smoke1', 'smoke2'], f: 0, tics: 6 });
        const tx = Math.floor(p.x), ty = Math.floor(p.y);
        const k = ty * L.w + tx;
        const hitWall = tx < 0 || ty < 0 || tx >= L.w || ty >= L.h || L.solid[k] || this.isDoorBlockingMove(k) || (this.pushwall && tx === this.pushwall.x && ty === this.pushwall.y);
        if (Math.abs(p.x - this.px) < 0.65 && Math.abs(p.y - this.py) < 0.65) {
          const dmg = P.dmg[0] + (this.rand() >> 3);
          this.takeDamage(Math.min(dmg, P.dmg[0] + P.dmg[1]), this.actors[p.owner] || null);
          this.projectiles.splice(i, 1);
          if (P.boom) { this.effects.push({ x: p.x, y: p.y, seq: ['boom0', 'boom1', 'boom2'], f: 0, tics: 6 }); this.snd('e_boom', p.x, p.y); }
          continue;
        }
        if (hitWall || p.t > TIC * 8) {
          this.projectiles.splice(i, 1);
          if (P.boom) { this.effects.push({ x: p.x - p.vx * 2, y: p.y - p.vy * 2, seq: ['boom0', 'boom1', 'boom2'], f: 0, tics: 6 }); this.snd('e_boom', p.x, p.y); }
        }
      }
    }

    updateEffects() {
      for (let i = this.effects.length - 1; i >= 0; i--) {
        const e = this.effects[i];
        if (--e.tics <= 0) { e.f++; e.tics = 6; if (e.f >= e.seq.length) this.effects.splice(i, 1); }
      }
    }

    takeDamage(points, attacker) {
      if (this.mode !== 'play') return;
      if (this.skill === 0) points >>= 2;
      if (points <= 0) return;
      if (!this.god) this.health -= points;
      this.damageFlash = Math.min(1, this.damageFlash + points / 40 + 0.2);
      if (this.health <= 0) { this.health = 0; this.killer = attacker; }
      else this.snd('p_hurt');
    }

    die() {
      this.mode = 'dying'; this.dyingTics = 0; this.atk = null;
      this.snd('p_die');
      if (this.killer) this.dieAngle = Math.atan2(this.killer.y - this.py, this.killer.x - this.px);
      else this.dieAngle = this.angle;
    }

    dyingTic() {
      this.dyingTics++;
      let d = this.dieAngle - this.angle;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      const step = 3 * Math.PI / 180;
      if (Math.abs(d) > step) this.angle += Math.sign(d) * step; else this.angle = this.dieAngle;
      this.updateActors();
      this.updateEffects();
      if (this.dyingTics > 80) this.mode = 'dead';
    }

    respawn() {
      this.lives--;
      if (this.lives < 0) { this.mode = 'gameover'; return false; }
      this.health = 100; this.ammo = PL.startAmmo; this.weapons = [true, true, false, false]; this.weapon = 1; this.chosen = 1;
      this.score = this.oldScore;
      this.nextExtra = Math.max(PL.extraLife, (Math.floor(this.score / PL.extraLife) + 1) * PL.extraLife);
      this.startLevel(this.floor);
      return true;
    }

    canWalkActor(a, x, y) {
      const L = this.level;
      if (x < 0 || y < 0 || x >= L.w || y >= L.h) return false;
      const k = y * L.w + x;
      if (L.solid[k]) return false;
      const si = L.statAt[k];
      if (si >= 0 && L.statics[si].block && L.statics[si].active) return false;
      if (this.occ[k] >= 0 && this.occ[k] !== a.id) return false;
      if (x === this.tileX && y === this.tileY) return false;
      const pw = this.pushwall;
      if (pw && ((x === pw.x && y === pw.y) || (x === pw.x + pw.dx && y === pw.y + pw.dy))) return false;
      const di = L.doorAt[k];
      if (di >= 0 && L.doors[di].lock && L.doors[di].state === 'closed') return false;
      return true;
    }

    tryWalk(a, d) {
      if (d === NODIR) return false;
      const nx = a.tx + DX8[d], ny = a.ty + DY8[d];
      if (d & 1) {
        if (!this.canWalkActor(a, nx, a.ty) || !this.canWalkActor(a, a.tx, ny)) return false;
        const L = this.level;
        if (L.doorAt[a.ty * L.w + nx] >= 0 || L.doorAt[ny * L.w + a.tx] >= 0 || L.doorAt[ny * L.w + nx] >= 0) return false;
      }
      if (!this.canWalkActor(a, nx, ny)) return false;
      const L = this.level, k = ny * L.w + nx;
      a.dir = d;
      this.occ[a.ty * L.w + a.tx] = -1;
      a.tx = nx; a.ty = ny;
      this.occ[k] = a.id;
      a.dist = 1;
      const di = L.doorAt[k];
      a.doorWait = di >= 0 && L.doors[di].state !== 'open' ? di : -1;
      return true;
    }

    selectChaseDir(a) {
      const olddir = a.dir, turnaround = OPP(olddir);
      const dx = this.tileX - a.tx, dy = this.tileY - a.ty;
      let d1 = dx > 0 ? 0 : dx < 0 ? 4 : NODIR, d2 = dy < 0 ? 6 : dy > 0 ? 2 : NODIR;
      if (Math.abs(dy) > Math.abs(dx)) [d1, d2] = [d2, d1];
      if (d1 === turnaround) d1 = NODIR;
      if (d2 === turnaround) d2 = NODIR;
      if (d1 !== NODIR && this.tryWalk(a, d1)) return;
      if (d2 !== NODIR && this.tryWalk(a, d2)) return;
      if (olddir !== NODIR && this.tryWalk(a, olddir)) return;
      const order = this.rand() > 128 ? [6, 0, 2, 4] : [4, 2, 0, 6];
      for (const d of order) if (d !== turnaround && this.tryWalk(a, d)) return;
      if (turnaround !== NODIR && this.tryWalk(a, turnaround)) return;
      a.dir = NODIR;
    }

    selectDodgeDir(a) {
      let turnaround;
      if (a.firstAttack) { turnaround = NODIR; a.firstAttack = false; } else turnaround = OPP(a.dir);
      const dx = this.tileX - a.tx, dy = this.tileY - a.ty;
      const t = [0, 0, 0, 0, 0];
      if (dx > 0) { t[1] = 0; t[3] = 4; } else { t[1] = 4; t[3] = 0; }
      if (dy > 0) { t[2] = 2; t[4] = 6; } else { t[2] = 6; t[4] = 2; }
      if (Math.abs(dx) > Math.abs(dy)) { [t[1], t[2]] = [t[2], t[1]]; [t[3], t[4]] = [t[4], t[3]]; }
      if (this.rand() < 128) { [t[1], t[2]] = [t[2], t[1]]; [t[3], t[4]] = [t[4], t[3]]; }
      t[0] = this.diagonal(t[1], t[2]);
      for (let i = 0; i < 5; i++) { if (t[i] === NODIR || t[i] === turnaround) continue; if (this.tryWalk(a, t[i])) return; }
      if (turnaround !== NODIR && this.tryWalk(a, turnaround)) return;
      a.dir = NODIR;
    }

    selectRunDir(a) {
      const dx = this.tileX - a.tx, dy = this.tileY - a.ty;
      const t = [dx < 0 ? 0 : 4, dy < 0 ? 2 : 6];
      if (Math.abs(dy) > Math.abs(dx)) t.reverse();
      t.unshift(this.diagonal(t[0], t[1]));
      for (const d of t) if (d !== NODIR && this.tryWalk(a, d)) return;
      this.selectDodgeDir(a);
    }

    diagonal(a, b) {
      const s = new Set([a, b]);
      if (s.has(0) && s.has(2)) return 1;
      if (s.has(2) && s.has(4)) return 3;
      if (s.has(4) && s.has(6)) return 5;
      if (s.has(6) && s.has(0)) return 7;
      return NODIR;
    }

    moveActor(a, move) {
      const L = this.level;
      while (move > 0) {
        if (a.dir === NODIR) return false;
        if (a.doorWait >= 0) {
          const door = L.doors[a.doorWait];
          this.openDoor(door);
          if (door.state !== 'open') return true;
          a.doorWait = -1;
        }
        const step = Math.min(move, a.dist);
        a.x += DX8[a.dir] * step; a.y += DY8[a.dir] * step;
        a.dist -= step; move -= step;
        if (a.dist <= 1e-6) {
          a.x = a.tx + 0.5; a.y = a.ty + 0.5; a.dist = 0;
          return move > 0 ? move : 0.000001;
        }
      }
      return 0;
    }

    pathTic(a) {
      const speed = a.def.patrol / TIC;
      this.walkAnim(a, 20);
      if (a.dist <= 0 && a.doorWait < 0) { if (!this.patrolTurn(a)) return; }
      let left = this.moveActor(a, speed);
      while (left && left > 1e-5 && a.dist <= 0) { if (!this.patrolTurn(a)) return; left = this.moveActor(a, left); }
    }

    patrolTurn(a) {
      const d = a.dir === NODIR ? 0 : a.dir & 6;
      for (const nd of [d, (d + 2) & 7, (d + 6) & 7, (d + 4) & 7]) if (this.tryWalk(a, nd)) return true;
      a.dir = NODIR;
      return false;
    }

    walkAnim(a, rate) {
      a.walkT = (a.walkT || 0) + 1;
      a.walkFrame = Math.floor(a.walkT / rate) & 3;
    }

    chaseTic(a) {
      const def = a.def;
      this.walkAnim(a, def.ghost ? 12 : 10);
      if (def.ghost) { this.ghostTic(a); return; }
      let dodge = false;
      const tdist = Math.max(Math.abs(a.tx - this.tileX), Math.abs(a.ty - this.tileY));
      if (def.melee) {
        if (Math.abs(this.px - a.x) < 1.3 && Math.abs(this.py - a.y) < 1.3) { this.setAnim(a, 'shoot', def.shoot); return; }
      } else if (def.shoot.length && this.areaByPlayer(a) && this.playerVisibleFrom(a)) {
        let chance;
        if (def.keepAway || def.float) chance = def.float ? 2 : 8;
        else chance = (!tdist || (tdist === 1 && a.dist < 0.25)) ? 300 : Math.floor(16 / tdist);
        if (this.rand() < chance) { this.setAnim(a, 'shoot', def.shoot); return; }
        dodge = !def.boss;
      }
      const choose = () => {
        if (def.keepAway && tdist < def.keepAway) this.selectRunDir(a);
        else if (dodge || def.melee || def.float) this.selectDodgeDir(a);
        else this.selectChaseDir(a);
      };
      if (a.dir === NODIR || (a.dist <= 0 && a.doorWait < 0)) { choose(); if (a.dir === NODIR) return; }
      let left = this.moveActor(a, def.chase / TIC);
      let guard = 0;
      while (left && left > 1e-5 && a.dist <= 0 && guard++ < 3) { choose(); if (a.dir === NODIR) return; left = this.moveActor(a, left); }
      if (def.clank && (this.time % 24) === 0) this.snd('e_step', a.x, a.y);
    }

    ghostTic(a) {
      if (a.dir === NODIR || a.dist <= 0) { this.selectChaseDir(a); if (a.dir === NODIR) return; }
      let left = this.moveActor(a, a.def.chase / TIC), guard = 0;
      while (left && left > 1e-5 && a.dist <= 0 && guard++ < 3) { this.selectChaseDir(a); if (a.dir === NODIR) return; left = this.moveActor(a, left); }
      if ((this.time & 7) === 0 && Math.abs(a.x - this.px) < 0.9 && Math.abs(a.y - this.py) < 0.9) this.takeDamage(2 + (this.rand() & 3), a);
    }

    startDeathcam() {
      const b = this.actors[this.bossKill.id];
      let best = null;
      for (let r = 3.5; r >= 1.5 && !best; r -= 0.5) {
        for (let k = 0; k < 16; k++) {
          const ang = Math.atan2(this.py - b.y, this.px - b.x) + (k >> 1) * (k & 1 ? 1 : -1) * Math.PI / 8;
          const x = b.x + Math.cos(ang) * r, y = b.y + Math.sin(ang) * r;
          const tx = Math.floor(x), ty = Math.floor(y);
          if (this.tileBlocked(tx, ty) || !this.lineClear(x, y, b.x, b.y)) continue;
          best = { x, y }; break;
        }
      }
      if (!best) best = { x: this.px, y: this.py };
      this.px = best.x; this.py = best.y; this.angle = Math.atan2(b.y - best.y, b.x - best.x);
      this.mode = 'deathcam'; this.camTics = 0;
      b.state = 'die';
      this.setAnim(b, 'die', [['shoot1', 50], ['die1', 18], ['die2', 18], ['die3', 18]]);
      this.snd(b.def.die[0], b.x, b.y);
    }

    deathcamTic() {
      this.camTics++;
      const b = this.actors[this.bossKill.id];
      if (b.anim) { if (--b.ftics <= 0) { b.frame++; if (b.frame >= b.anim.length) { b.anim = null; b.state = 'dead'; } else b.ftics = b.anim[b.frame][1]; } }
      if (!b.anim && this.camTics > 200) this.mode = 'won';
    }

    levelStats() {
      const T = this.level.totals;
      const pct = (a, b) => b ? Math.round(a * 100 / b) : 100;
      return { kills: pct(this.kills, T.kills), secrets: pct(this.secrets, T.secrets), treasures: pct(this.treasures, T.treasures), time: Math.floor(this.time / TIC), par: this.level.par };
    }

    nextFloor() {
      const ep = D.EPISODES[this.episode];
      if (this.floor === 9) return ep.secretFrom;
      if (this.exitType === 2) return 9;
      if (this.floor >= 8) return -1;
      return this.floor + 1;
    }

    mli() {
      this.health = 100; this.ammo = 99; this.keys = [true, true]; this.weapons = [true, true, true, true];
      if (!this.atk) this.weapon = 3;
      this.chosen = 3; this.score = 0; this.oldScore = 0; this.nextExtra = PL.extraLife; this.mliUsed = true;
      this.grin = 140; this.bonusFlash = 1;
    }
    debugHealth() { this.health = PL.maxHealth; this.bonusFlash = 1; }
    debugWeapons() {
      this.weapons = [true, true, true, true]; this.chosen = 3;
      if (this.ammo <= 0) this.giveAmmo(PL.startAmmo);
      if (!this.atk) this.weapon = 3;
      this.bonusFlash = 1;
    }
    debugAmmo() { this.giveAmmo(PL.maxAmmo); this.bonusFlash = 1; }
    debugItems() { this.health = 100; this.ammo = 99; this.keys = [true, true]; this.weapons = [true, true, true, true]; this.chosen = 3; if (!this.atk) this.weapon = 3; this.bonusFlash = 1; }

    serialize() {
      const L = this.level;
      return JSON.stringify({
        v: 1, episode: this.episode, floor: this.floor, skill: this.skill, seed: this.seed,
        score: this.score, lives: this.lives, nextExtra: this.nextExtra, health: this.health, ammo: this.ammo, weapons: this.weapons, weapon: this.weapon, chosen: this.chosen, keys: this.keys,
        px: this.px, py: this.py, angle: this.angle, kills: this.kills, secrets: this.secrets, treasures: this.treasures, time: this.time, oldScore: this.oldScore,
        stats: this.stats, totalTime: this.totalTime, mliUsed: this.mliUsed,
        wall: Array.from(L.wall), solid: Array.from(L.solid), push: Array.from(L.push), area: Array.from(L.area), statAt: Array.from(L.statAt),
        doors: L.doors.map(d => [d.pos, d.state, d.tics]), statics: L.statics, totals: L.totals, areaLinks: this.areaLinks,
        actors: this.actors.map(a => { const o = Object.assign({}, a); delete o.def; return o; }),
        occ: Array.from(this.occ), pushwall: this.pushwall, projectiles: this.projectiles, effects: this.effects, levelStartState: this.levelStartState
      });
    }

    static deserialize(json, maps) {
      const s = typeof json === 'string' ? JSON.parse(json) : json;
      const g = new Game({ maps, skill: s.skill, episode: s.episode, floor: s.floor, seed: s.seed });
      Object.assign(g, {
        score: s.score, lives: s.lives, nextExtra: s.nextExtra, health: s.health, ammo: s.ammo, weapons: s.weapons, weapon: s.weapon, chosen: s.chosen, keys: s.keys,
        px: s.px, py: s.py, angle: s.angle, kills: s.kills, secrets: s.secrets, treasures: s.treasures, time: s.time, oldScore: s.oldScore,
        stats: s.stats || [], totalTime: s.totalTime || 0, mliUsed: !!s.mliUsed, areaLinks: s.areaLinks || [], pushwall: s.pushwall, projectiles: s.projectiles || [], effects: s.effects || [],
        levelStartState: s.levelStartState
      });
      const L = g.level;
      L.wall.set(s.wall); L.solid.set(s.solid); L.push.set(s.push); L.area.set(s.area); L.statAt.set(s.statAt);
      s.doors.forEach((d, i) => { L.doors[i].pos = d[0]; L.doors[i].state = d[1]; L.doors[i].tics = d[2]; });
      L.statics = s.statics; L.totals = s.totals;
      g.actors = s.actors.map(a => Object.assign(a, { def: D.ENEMIES[a.type] }));
      g.occ.set(s.occ);
      g.areaDirty = true;
      return g;
    }
  }

  W.Game = Game;
  W.castRay = castRay;
  W.DX8 = DX8; W.DY8 = DY8; W.NODIR = NODIR;
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
