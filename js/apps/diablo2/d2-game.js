(function (D) {
  'use strict';
  const { RNG, AREAS, BASES, MONSTERS, ALLIES, SUPERUNIQUES, NPCS, TALK, QUEST_MAP, SKILLS, clamp } = D;

  const REACH = 1.3;
  const ACTIVE_R = 30;

  function roll(rng, v) {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    return v[0] + rng.next() * (v[1] - v[0]);
  }

  class Game {
    constructor(char, o) {
      o = o || {};
      this.char = char;
      this.diff = o.diff || 0;
      this.seed = o.seed !== undefined ? o.seed : (Math.random() * 1e9) | 0;
      this.rng = new RNG(this.seed ^ 0x51f15e);
      this.areas = {};
      this.time = 0;
      this.events = [];
      this.vfx = [];
      this.missiles = [];
      this.effects = [];
      this.idSeq = 1;
      this.held = null;
      this.shops = {};
      this.mercOffers = null;
      this.portal = null;
      this.cursorMode = null;
      this.prog = char.prog[this.diff];
      this.prog.q = this.prog.q || {};
      this.pets = [];
      this.cairnTouched = [];
      this.stats = { kills: 0, deaths: 0 };
      this.hero = this.makeHero();
      this.enterArea('town', 'start', true);
      if (char.merc && !char.merc.dead) this.spawnMerc(true);
      if (char.corpse && char.corpse.diff === this.diff) {
        const p = this.area.entries.death;
        this.addDyn('corpse', p.x + 1, p.y + 1, { label: 'Тело: ' + char.name });
      }
    }

    nid() { return this.idSeq++; }
    ev(e) { this.events.push(e); if (this.events.length > 200) this.events.shift(); }
    msg(text, c) { this.ev({ t: 'msg', text, c: c || D.COL.white }); }
    sfx(s, x, y) { this.ev({ t: 'sfx', s, x, y }); }
    q(id) { return this.prog.q[id] || 0; }
    setQ(id, v) {
      if (this.q(id) >= v) return;
      this.prog.q[id] = v;
      this.ev({ t: 'quest', id, v });
      const log = QUEST_MAP[id].log;
      if (v >= log.length - 1) this.msg('Задание «' + QUEST_MAP[id].name + '» выполнено', D.COL.gold);
      else this.msg('Задание «' + QUEST_MAP[id].name + '» обновлено', D.COL.gold);
    }

    makeHero() {
      const ch = this.char;
      const h = {
        id: this.nid(), kind: 'hero', team: 0, char: ch, cls: ch.cls, name: ch.name, x: 0, y: 0, r: 0.34, dir: Math.PI * 0.25,
        hp: 1, mp: 0, sp: 0, fx: { buffs: {} }, anim: { n: 'idle', t: 0, dur: 1 }, act: null, order: null, path: null, cd: {}, model: ch.cls,
        charges: null, form: null, pots: [], stepPhase: 0, moving: false, auraFx: {}, lvl: ch.level
      };
      D.recalc(h, this);
      h.hp = ch.life !== null && ch.life !== undefined ? Math.min(ch.life, h.hpMax) : h.hpMax;
      h.mp = ch.mana !== null && ch.mana !== undefined ? Math.min(ch.mana, h.mpMax) : h.mpMax;
      h.sp = h.spMax;
      if (h.hp <= 0) h.hp = h.hpMax;
      return h;
    }

    recalc() { D.recalc(this.hero, this); }

    get area() { return this._area; }

    loadArea(id) {
      if (this.areas[id]) return this.areas[id];
      const a = D.generate(id, this.seed, {});
      a.ents = [];
      a.items = [];
      a.dyn = [];
      this.areas[id] = a;
      const lvl = a.def.lvl[this.diff];
      if (a.def.town) {
        for (const n of a.npcs) {
          if (n.needs === 'cain' && this.q('cain') < 5) continue;
          a.ents.push(this.makeNpc(n.id, n.x, n.y));
        }
      } else {
        for (const p of a.packs) this.spawnPack(a, p, lvl);
        for (const e of a.ents) this.settle(a, e);
      }
      if (id === 'stonyfield' && this.q('cain') >= 4 && a.cairn) this.addDynTo(a, 'redportal', a.cairn.x, a.cairn.y, { to: 'tristram', label: 'Тристрам' });
      if (id === 'tristram' && this.q('cain') >= 5) { const cage = a.objs.find(o => o.type === 'cage'); if (cage) cage.open = true; }
      return a;
    }

    makeNpc(id, x, y) {
      const n = NPCS[id];
      return {
        id: this.nid(), kind: 'npc', npc: id, team: 2, name: n.name, x, y, home: { x, y }, r: 0.36, dir: Math.PI * 0.7, hp: 1, hpMax: 1,
        fx: { buffs: {} }, anim: { n: 'idle', t: Math.random() * 3, dur: 1 }, model: n.model, act: null, path: null, stepPhase: 0, wanderT: 2 + Math.random() * 4
      };
    }

    monLevel(a) { return a.def.lvl[this.diff]; }

    makeMonster(type, lvl, o) {
      o = o || {};
      const t = MONSTERS[type];
      const dm = D.DIFF_MUL[this.diff];
      let hpM = t.hp * dm.hp, dmgM = t.dmg * dm.dmg, arM = t.ar * dm.ar, xpM = t.xp * dm.xp, defM = t.def;
      const mods = (o.mods || []).slice();
      let name = o.name || t.names[Math.min(t.names.length - 1, this.diff === 0 ? (lvl >= 7 ? 1 : 0) : this.diff + 1)];
      let tint = t.tints[Math.min(t.tints.length - 1, this.diff === 0 ? (lvl >= 7 ? 1 : 0) : this.diff + 1)];
      let speed = t.speed, atk = t.atk;
      if (o.champ) {
        hpM *= 3; dmgM *= 1.4; arM *= 1.3; xpM *= 3;
        const ck = o.champKind || 'champion';
        if (ck === 'berserker') dmgM *= 1.5;
        if (ck === 'fanatic') { atk *= 0.6; speed *= 1.2; }
        if (ck === 'ghostly') speed *= 0.7;
      }
      if (o.unique) { hpM *= 4; dmgM *= 1.5; arM *= 1.3; xpM *= 5; }
      if (o.su) { hpM *= t.boss ? 1 : 4; dmgM *= t.boss ? 1 : 1.5; xpM *= t.boss ? 1 : 5; }
      if (o.minion) { hpM *= 1.6; xpM *= 1.5; }
      if (mods.includes('strong')) dmgM *= 1.6;
      if (mods.includes('fast')) { speed *= 1.35; atk *= 0.7; }
      if (mods.includes('stoneskin')) defM *= 3;
      const res = {};
      for (const k of ['f', 'c', 'l', 'p', 'ph', 'm']) res[k] = t.res[k][this.diff];
      if (mods.includes('mres')) { res.f += 40; res.c += 40; res.l += 40; }
      if (mods.includes('fireench')) res.f += 50;
      if (mods.includes('coldench')) res.c += 50;
      if (mods.includes('lightench')) res.l += 50;
      if (mods.includes('stoneskin')) res.ph += 40;
      if (o.champKind === 'ghostly') res.ph += 50;
      const d = D.monDmg(lvl);
      const hpMax = Math.max(1, Math.round(D.monHp(lvl) * hpM));
      const e = {
        id: this.nid(), kind: 'mon', type, mon: t, team: 1, name, lvl, x: o.x, y: o.y, r: t.r, dir: this.rng.range(0, Math.PI * 2),
        hp: hpMax, hpMax, dmg: [d[0] * dmgM, d[1] * dmgM], ar: D.monAr(lvl) * arM, def: D.monDef(lvl) * defM, xp: Math.round(D.monXp(lvl) * xpM),
        res, speed, atk, range: t.range, fx: { buffs: {} }, anim: { n: 'idle', t: Math.random() * 3, dur: 1 }, act: null, path: null, model: t.model, tint,
        champ: !!o.champ, champKind: o.champKind || null, unique: !!o.unique, su: o.su || null, boss: !!t.boss || !!o.su, mods, minion: !!o.minion,
        ai: { st: 'idle', t: this.rng.range(0, 2), home: { x: o.x, y: o.y }, cd: 0, special: this.rng.range(4, 8) }, stepPhase: 0, float: !!t.float, pack: o.pack || null
      };
      return e;
    }

    spawnPack(a, p, lvl) {
      const rng = this.rng;
      if (p.su) {
        const su = SUPERUNIQUES[p.su];
        const boss = this.makeMonster(su.type, lvl + su.lvl, { x: p.x, y: p.y, su: p.su, name: su.name, mods: su.mods });
        a.ents.push(boss);
        const n = rng.int(su.minions[0], su.minions[1]);
        for (let i = 0; i < n; i++) {
          const pt = this.freeSpot(a, p.x, p.y, 3);
          if (pt) a.ents.push(this.makeMonster(su.minionType || su.type, lvl + 1, { x: pt.x, y: pt.y, minion: true, pack: boss.id, mods: su.mods.includes('fireench') ? ['fireench'] : [] }));
        }
        boss.packId = boss.id;
        return;
      }
      const t = MONSTERS[p.type];
      const packId = this.nid();
      if (p.unique) {
        const nmods = 1 + this.diff + (rng.chance(0.3) ? 1 : 0);
        const mods = rng.shuffle(D.MOD_LIST.filter(m => m !== 'multishot' || t.ai === 'ranged')).slice(0, nmods);
        const name = rng.pick(D.UNIQUE_NAME_A) + ' ' + rng.pick(D.UNIQUE_NAME_B).toLowerCase() + ' ' + rng.pick(D.UNIQUE_NAME_C);
        const boss = this.makeMonster(p.type, lvl + 3, { x: p.x, y: p.y, unique: true, mods, name, pack: packId });
        a.ents.push(boss);
        const n = rng.int(2, 4);
        for (let i = 0; i < n; i++) { const pt = this.freeSpot(a, p.x, p.y, 3); if (pt) a.ents.push(this.makeMonster(p.type, lvl + 1, { x: pt.x, y: pt.y, minion: true, pack: packId })); }
        return;
      }
      const n = rng.int(t.pack[0], t.pack[1]);
      const ck = p.champ ? rng.pick(D.CHAMPION_KINDS) : null;
      const count = p.champ ? rng.int(2, 4) : n;
      for (let i = 0; i < count; i++) {
        const pt = this.freeSpot(a, p.x, p.y, 3.5);
        if (!pt) continue;
        const m = this.makeMonster(p.type, lvl + (p.champ ? 2 : 0), { x: pt.x, y: pt.y, champ: !!p.champ, champKind: ck ? ck[0] : null, pack: packId });
        if (ck) m.name = ck[1] + ' ' + m.name.toLowerCase();
        a.ents.push(m);
      }
      if (p.type === 'fallen' && !p.champ && rng.chance(0.55)) {
        const pt = this.freeSpot(a, p.x, p.y, 3.5);
        if (pt) a.ents.push(this.makeMonster('shaman', lvl, { x: pt.x, y: pt.y, pack: packId }));
      }
      if (p.type === 'shaman') {
        for (let i = 0; i < rng.int(3, 6); i++) { const pt = this.freeSpot(a, p.x, p.y, 3.5); if (pt) a.ents.push(this.makeMonster('fallen', lvl, { x: pt.x, y: pt.y, pack: packId })); }
      }
    }

    freeSpot(a, x, y, r) {
      for (let k = 0; k < 20; k++) {
        const px = x + this.rng.range(-r, r), py = y + this.rng.range(-r, r);
        if (!D.walkable(a, Math.floor(px), Math.floor(py))) continue;
        if (a.ents.some(e => !e.dead && Math.hypot(e.x - px, e.y - py) < 0.7)) continue;
        return { x: px, y: py };
      }
      return D.nearestWalkable(a, x, y, 3);
    }

    addDynTo(a, type, x, y, o) {
      const ob = Object.assign({ id: 'd' + this.nid(), type, x, y, dyn: true }, o || {});
      a.dyn.push(ob);
      return ob;
    }
    addDyn(type, x, y, o) { return this.addDynTo(this.area, type, x, y, o); }

    get ents() { return this.area.ents; }

    enterArea(id, entry, first) {
      const prev = this._area;
      const a = this.loadArea(id);
      if (prev && prev !== a) {
        prev.ents = prev.ents.filter(e => e !== this.hero && !this.pets.includes(e));
      }
      this._area = a;
      this.missiles = [];
      this.effects = [];
      this.vfx = [];
      const p = (entry && typeof entry === 'object') ? entry : (a.entries[entry] || a.entries.start);
      const spot = D.nearestWalkable(a, p.x, p.y, 4) || p;
      const h = this.hero;
      h.x = spot.x; h.y = spot.y; h.path = null; h.order = null; h.act = null; h.anim = { n: 'idle', t: 0, dur: 1 };
      if (!a.ents.includes(h)) a.ents.push(h);
      for (const pet of this.pets) {
        if (pet.dead) continue;
        const ps = this.freeSpot(a, h.x, h.y, 2) || spot;
        pet.x = ps.x; pet.y = ps.y; pet.path = null; pet.act = null;
        if (!a.ents.includes(pet)) a.ents.push(pet);
      }
      if (a.def.wp && !this.prog.wp[id] && a.def.town) this.prog.wp[id] = 1;
      if (id === 'den' && this.q('den') === 0) this.setQ('den', 1);
      if (id.startsWith('catacombs') && this.q('andariel') === 0) this.setQ('andariel', 1);
      if (!a.def.town) this.leftTownAt = this.time;
      if (a.def.town && this.portal && this.portal.area !== 'town') {
        const tp = a.entries.portal;
        if (!a.dyn.some(o => o.type === 'portal')) this.addDynTo(a, 'portal', tp.x, tp.y, { to: this.portal.area, label: AREAS[this.portal.area].name });
      }
      D.recalc(h, this);
      this.revealAround(4);
      this.ev({ t: 'area', id, first: !!first });
      if (!first) this.msg(a.def.name, D.COL.tan);
      this.ev({ t: 'autosave' });
    }

    revealAround(extra) {
      const a = this.area, h = this.hero;
      const r = (h.lightR || 8) + (extra || 0) + (a.dungeon ? 0 : 6);
      const x0 = Math.max(0, Math.floor(h.x - r)), x1 = Math.min(a.w - 1, Math.ceil(h.x + r));
      const y0 = Math.max(0, Math.floor(h.y - r)), y1 = Math.min(a.h - 1, Math.ceil(h.y + r));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if ((x - h.x) * (x - h.x) + (y - h.y) * (y - h.y) < r * r) a.seen[y * a.w + x] = 1;
    }

    hostile(a, b) {
      if (a.team === 2 || b.team === 2) return false;
      return a.team !== b.team;
    }

    enemiesNear(x, y, r, team, o) {
      const out = [];
      for (const e of this.ents) {
        if (e.dead || e.team === 2 || e.team === team || e.untargetable) continue;
        if (o && o.exclude && o.exclude.has(e.id)) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d <= r + e.r) out.push(e);
      }
      return out;
    }

    alliesNear(x, y, r, team) {
      return this.ents.filter(e => !e.dead && e.team === team && Math.hypot(e.x - x, e.y - y) <= r);
    }

    corpseNear(x, y, r) {
      let best = null, bd = r;
      for (const e of this.ents) {
        if (!e.dead || e.kind !== 'mon' || e.noCorpse || e.boss) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < bd) { bd = d; best = e; }
      }
      return best;
    }

    update(dt) {
      dt = Math.min(dt, 0.1);
      while (dt > 1e-6) {
        const s = Math.min(dt, 1 / 30);
        this.step(s);
        dt -= s;
      }
    }

    step(dt) {
      this.time += dt;
      this.char.time = (this.char.time || 0) + dt;
      const h = this.hero;
      this.updateStatus(h, dt);
      if (!h.dead) this.updateHero(dt);
      else this.updateDeadAnim(h, dt);
      const ents = this.ents.slice();
      for (const e of ents) {
        if (e === h) continue;
        const far = Math.hypot(e.x - h.x, e.y - h.y) > ACTIVE_R && e.kind !== 'pet' && e.kind !== 'merc';
        this.updateStatus(e, dt);
        if (e.dead) { this.updateDeadAnim(e, dt); continue; }
        if (far) continue;
        if (e.kind === 'npc') this.updateNpc(e, dt);
        else D.AI.update(this, e, dt);
        this.updateAct(e, dt);
        this.followPath(e, dt);
      }
      D.Skills.updateMissiles(this, dt);
      D.Skills.updateEffects(this, dt);
      D.Skills.updateAuras(this, dt);
      for (let i = this.vfx.length - 1; i >= 0; i--) { const v = this.vfx[i]; v.t += dt; if (v.t >= v.dur) this.vfx.splice(i, 1); }
      this.separate(dt);
      this.pickupGoldNear();
      this.checkTriggers();
      if (Math.floor(this.time * 4) !== Math.floor((this.time - dt) * 4)) this.revealAround(0);
      this.cleanupDead();
    }

    cleanupDead() {
      const a = this.area;
      let corpses = 0;
      for (let i = a.ents.length - 1; i >= 0; i--) {
        const e = a.ents[i];
        if (!e.dead) continue;
        if (e.kind === 'pet' || e.kind === 'merc') { if (e.deathT > 2) { a.ents.splice(i, 1); this.pets = this.pets.filter(p => p !== e); } continue; }
        if (e.noCorpse && e.deathT > 0.6) { a.ents.splice(i, 1); continue; }
        corpses++;
        if (corpses > 90 && e.deathT > 20) a.ents.splice(i, 1);
      }
    }

    updateDeadAnim(e, dt) {
      e.deathT = (e.deathT || 0) + dt;
      e.anim.t += dt;
      if (e.anim.n === 'death' && e.anim.t >= e.anim.dur) e.anim = { n: 'dead', t: 0, dur: 1 };
      if (e === this.hero && e.deathT > 1.6 && !this.diedShown) { this.diedShown = true; this.ev({ t: 'died' }); }
    }

    updateStatus(e, dt) {
      const fx = e.fx;
      for (const k of ['chill', 'freeze', 'stun', 'fear', 'blind']) if (fx[k] > 0) fx[k] = Math.max(0, fx[k] - dt);
      if (fx.poison) {
        if (!e.dead) {
          const dmg = fx.poison.dps * dt;
          e.hp -= dmg;
          if (e.hp <= 0 && !e.dead) {
            if (e.kind === 'hero') e.hp = 1;
            else this.kill(e, fx.poison.src ? this.ents.find(x => x.id === fx.poison.src) : null);
          }
        }
        if (fx.poison) { fx.poison.t -= dt; if (fx.poison.t <= 0) fx.poison = null; }
      }
      if (fx.bleed) {
        if (!e.dead) { e.hp -= fx.bleed.dps * dt; if (e.hp <= 0) this.kill(e, null); }
        if (fx.bleed) { fx.bleed.t -= dt; if (fx.bleed.t <= 0) fx.bleed = null; }
      }
      if (fx.curse) { fx.curse.t -= dt; if (fx.curse.t <= 0) fx.curse = null; }
      let changed = false;
      for (const k in fx.buffs) {
        const b = fx.buffs[k];
        if (b.t === Infinity) continue;
        b.t -= dt;
        if (b.t <= 0) { delete fx.buffs[k]; changed = true; if (e === this.hero) this.msg(buffName(k) + ': действие закончилось', D.COL.dim); }
      }
      if (changed && e === this.hero) this.recalc();
      if (e.summonT !== undefined && !e.dead) {
        e.summonT -= dt;
        if (e.summonT <= 0) { e.dead = true; e.noCorpse = true; e.deathT = 1.5; e.anim = { n: 'death', t: 0, dur: 0.6 }; }
      }
    }

    updateNpc(e, dt) {
      if (e.act) return;
      if (this.talking === e) { e.path = null; e.dir = Math.atan2(this.hero.y - e.y, this.hero.x - e.x); return; }
      e.wanderT -= dt;
      if (e.wanderT <= 0) {
        e.wanderT = 3 + this.rng.range(0, 6);
        const w = NPCS[e.npc].wander || 1;
        const tx = e.home.x + this.rng.range(-w, w), ty = e.home.y + this.rng.range(-w, w);
        if (D.walkable(this.area, Math.floor(tx), Math.floor(ty))) e.path = [{ x: tx, y: ty }];
        e.walkSpeed = 1.3;
      }
    }

    moveSpeed(e) {
      let s;
      if (e.kind === 'hero') s = this.char.runOn && e.sp > 0.5 && !this.area.def.town ? e.st.run : (this.area.def.town && this.char.runOn ? e.st.run : e.st.walk);
      else if (e.kind === 'npc') s = e.walkSpeed || 1.3;
      else s = e.speed !== undefined ? e.speed : 2.5;
      if (e.fx.chill > 0) s *= 1 - (e.fx.chillPct || 0.5);
      if (e.fx.curse && e.fx.curse.type === 'decrepify') s *= 0.5;
      if (e.fx.holdSlow) s *= 1 - e.fx.holdSlow;
      return s;
    }

    followPath(e, dt) {
      if (!e.path || !e.path.length || e.act || e.fx.freeze > 0 || e.fx.stun > 0 || e.dead) { e.moving = false; return; }
      const p = e.path[0];
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.12) { e.path.shift(); if (!e.path.length) { e.path = null; e.moving = false; } return; }
      const sp = this.moveSpeed(e);
      const stp = Math.min(d, sp * dt);
      const nx = e.x + dx / d * stp, ny = e.y + dy / d * stp;
      e.dir = Math.atan2(dy, dx);
      const moved = this.tryMove(e, nx, ny);
      e.moving = moved;
      if (moved) e.stepPhase += stp;
      else {
        e.stuck = (e.stuck || 0) + dt;
        if (e.stuck > 0.4) { e.stuck = 0; e.path = null; e.moving = false; }
      }
      if (e.kind === 'hero' && moved) {
        const running = sp >= e.st.run * 0.99 && !this.area.def.town;
        if (running) { e.sp = Math.max(0, e.sp - dt * 3.2); }
        e.running = sp >= e.st.run * 0.99;
      }
    }

    canStand(e, x, y) { return this.standIn(this.area, e, x, y); }

    standIn(a, e, x, y) {
      const r = e.r * 0.8;
      if (e.float && e.kind === 'mon' && e.type === 'bat') return D.flyable(a, Math.floor(x), Math.floor(y)) || D.walkable(a, Math.floor(x), Math.floor(y));
      return D.walkable(a, Math.floor(x + r), Math.floor(y + r)) && D.walkable(a, Math.floor(x - r), Math.floor(y - r)) &&
        D.walkable(a, Math.floor(x + r), Math.floor(y - r)) && D.walkable(a, Math.floor(x - r), Math.floor(y + r));
    }

    settle(a, e) {
      if (this.standIn(a, e, e.x, e.y)) return true;
      const cx = Math.floor(e.x), cy = Math.floor(e.y);
      for (let r = 0; r <= 6; r++) {
        let best = null, bd = 1e9;
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const px = cx + dx + 0.5, py = cy + dy + 0.5;
          if (!this.standIn(a, e, px, py)) continue;
          const dd = (px - e.x) * (px - e.x) + (py - e.y) * (py - e.y);
          if (dd < bd) { bd = dd; best = { x: px, y: py }; }
        }
        if (best) { e.x = best.x; e.y = best.y; return true; }
      }
      return false;
    }

    tryMove(e, nx, ny) {
      if (!this.canStand(e, e.x, e.y) && this.settle(this.area, e)) return true;
      if (this.canStand(e, nx, ny)) { e.x = nx; e.y = ny; return true; }
      if (this.canStand(e, nx, e.y)) { e.x = nx; return true; }
      if (this.canStand(e, e.x, ny)) { e.y = ny; return true; }
      return false;
    }

    separate(dt) {
      const ents = this.ents;
      const n = ents.length;
      for (let i = 0; i < n; i++) {
        const a = ents[i];
        if (a.dead || a.kind === 'npc' && a.act) continue;
        for (let j = i + 1; j < n; j++) {
          const b = ents[j];
          if (b.dead || (a.float && b.float)) continue;
          const dx = b.x - a.x, dy = b.y - a.y;
          const md = (a.r + b.r) * 0.85;
          if (Math.abs(dx) > md || Math.abs(dy) > md) continue;
          const d = Math.hypot(dx, dy);
          if (d >= md || d < 1e-4) continue;
          const push = (md - d) * 0.5;
          const ux = dx / d, uy = dy / d;
          const aw = a.kind === 'hero' ? 0.25 : a.boss ? 0.1 : 0.5, bw = b.kind === 'hero' ? 0.25 : b.boss ? 0.1 : 0.5;
          const tot = aw + bw || 1;
          if (!a.act && a.kind !== 'npc') this.tryMove(a, a.x - ux * push * 2 * aw / tot, a.y - uy * push * 2 * aw / tot);
          if (!b.act && b.kind !== 'npc') this.tryMove(b, b.x + ux * push * 2 * bw / tot, b.y + uy * push * 2 * bw / tot);
        }
      }
    }

    pathTo(e, x, y, max) {
      const p = D.findPath(this.area, e.x, e.y, x, y, max || 5000);
      e.path = p && p.length ? p : null;
      return !!e.path;
    }

    updateHero(dt) {
      const h = this.hero;
      const st = h.st;
      h.anim.t += dt;
      const regenMul = 1 + (st.manaRegen || 0) / 100;
      h.mp = Math.min(h.mpMax, h.mp + h.mpMax / 120 * regenMul * dt);
      if (st.regen) h.hp = Math.min(h.hpMax, h.hp + st.regen * 0.6 * dt);
      if (!h.running || !h.moving) h.sp = Math.min(h.spMax, h.sp + h.spMax / 20 * dt * (1 + (h.auraFx.frw ? 0.5 : 0)));
      for (let i = h.pots.length - 1; i >= 0; i--) {
        const p = h.pots[i];
        const k = Math.min(dt, p.t);
        if (p.hp) h.hp = Math.min(h.hpMax, h.hp + p.hp / p.dur * k);
        if (p.mp) h.mp = Math.min(h.mpMax, h.mp + p.mp / p.dur * k);
        p.t -= dt;
        if (p.t <= 0) h.pots.splice(i, 1);
      }
      if (h.fx.freeze > 0 || h.fx.stun > 0) return;
      this.updateAct(h, dt);
      if (!h.act) this.heroOrder(dt);
      this.followPath(h, dt);
      if (!h.act) {
        const n = h.moving ? (h.running ? 'run' : 'walk') : 'idle';
        if (h.anim.n !== n) h.anim = { n, t: 0, dur: 1 };
      }
    }

    heroOrder() {
      const h = this.hero;
      const o = h.order;
      if (!o) return;
      if (o.k === 'move') {
        if (!h.path || o.dirty) {
          o.dirty = false;
          if (Math.hypot(o.x - h.x, o.y - h.y) < 0.2) { h.order = null; return; }
          if (!this.pathTo(h, o.x, o.y)) { h.order = null; return; }
        }
        if (!h.path) h.order = null;
        return;
      }
      if (o.k === 'interact') {
        const t = o.target;
        const tx = t.mouth ? t.mouth.x : t.front ? t.front.x : t.x, ty = t.mouth ? t.mouth.y : t.front ? t.front.y : t.y;
        const reach = (t.kind === 'npc' ? 1.6 : t.item ? 1.1 : 1.5) + (t.cells ? Math.sqrt(t.cells.length) * 0.5 : 0);
        if (Math.hypot(tx - h.x, ty - h.y) <= reach) {
          h.path = null;
          h.order = null;
          h.dir = Math.atan2(ty - h.y, tx - h.x);
          this.interact(t);
          return;
        }
        if (!h.path) { if (!this.pathTo(h, tx, ty)) h.order = null; }
        return;
      }
      if (o.k === 'skill') {
        const sid = o.skill;
        const t = o.target && !o.target.dead ? o.target : null;
        if (o.target && o.target.dead && !o.corpse) { h.order = null; h.path = null; return; }
        const range = D.Skills.range(this, h, sid, t);
        const tx = t ? t.x : o.x, ty = t ? t.y : o.y;
        const d = Math.hypot(tx - h.x, ty - h.y) - (t ? t.r : 0);
        const needLos = range < 50 && range > 2.5 && !D.losLine(this.area, h.x, h.y, tx, ty);
        if (d <= range && !needLos) {
          h.path = null;
          const ok = D.Skills.begin(this, h, sid, { x: tx, y: ty, target: t, side: o.side, corpse: o.corpse });
          if (!o.hold || !ok) h.order = null;
          if (ok && t && t.dead) h.order = null;
          return;
        }
        if (range >= 50) return;
        if (!h.path || (o.lastTx !== undefined && Math.hypot(o.lastTx - tx, o.lastTy - ty) > 1)) {
          o.lastTx = tx; o.lastTy = ty;
          if (!this.pathTo(h, tx, ty, 4000)) { h.order = null; }
        }
      }
    }

    cmdMove(x, y) {
      const h = this.hero;
      if (h.dead) return;
      this.talking = null;
      if (h.act && h.act.whirl) return;
      if (h.order && h.order.k === 'move') {
        if (Math.hypot(h.order.x - x, h.order.y - y) > 0.4) { h.order.x = x; h.order.y = y; h.order.dirty = true; }
        return;
      }
      h.order = { k: 'move', x, y, dirty: true };
      h.path = null;
    }

    cmdStop() { const h = this.hero; h.order = null; h.path = null; }

    cmdSkill(side, x, y, target, hold, standStill) {
      const h = this.hero;
      if (h.dead) return;
      this.talking = null;
      const sid = side === 'left' ? this.char.left : this.char.right;
      const sk = SKILLS[sid];
      if (sk && sk.kind === 'aura') return;
      if (sk && sk.target === 'corpse') {
        const c = target && target.dead ? target : this.corpseNear(x, y, 2.5);
        if (!c) { this.overhead('Нужен труп'); return; }
        h.order = { k: 'skill', skill: sid, x: c.x, y: c.y, target: c, side, hold: false, corpse: true };
        return;
      }
      if (target && target.dead) target = null;
      if (standStill) {
        if (!h.act) D.Skills.begin(this, h, sid, { x, y, target, side, still: true });
        h.order = hold ? { k: 'skill', skill: sid, x, y, target: null, side, hold: true, still: true } : null;
        return;
      }
      h.order = { k: 'skill', skill: sid, x, y, target, side, hold: !!hold };
      h.path = null;
    }

    cmdInteract(t) {
      const h = this.hero;
      if (h.dead) return;
      this.talking = null;
      h.order = { k: 'interact', target: t };
      h.path = null;
    }

    overhead(text) { this.ev({ t: 'overhead', text, id: this.hero.id }); }

    startAct(e, act) {
      e.act = Object.assign({ t: 0, fired: 0 }, act);
      e.anim = { n: act.anim || 'attack', t: 0, dur: act.dur };
      e.path = null;
      if (act.x !== undefined) e.dir = Math.atan2(act.y - e.y, act.x - e.x);
    }

    updateAct(e, dt) {
      const a = e.act;
      if (!a) return;
      if (e.fx.freeze > 0 || e.fx.stun > 0) return;
      const slow = e.fx.chill > 0 ? 0.6 : 1;
      a.t += dt * slow;
      e.anim.t = a.t;
      if (a.target && !a.target.dead && !a.lockDir) e.dir = Math.atan2(a.target.y - e.y, a.target.x - e.x);
      if (a.whirl) { D.Skills.whirlStep(this, e, a, dt); if (!e.act) return; }
      if (a.leap) D.Skills.leapStep(this, e, a, dt);
      const hits = a.hitTimes || [a.fireAt === undefined ? 0.5 : a.fireAt];
      while (a.fired < hits.length && a.t >= hits[a.fired] * a.dur) {
        const k = a.fired;
        a.fired++;
        if (a.run) a.run(this, e, a, k);
      }
      if (a.t >= a.dur) {
        e.act = null;
        if (e.anim.n !== 'death') e.anim = { n: 'idle', t: 0, dur: 1 };
        if (a.after) a.after(this, e);
      }
    }

    hitChance(att, def) {
      const ar = att.kind === 'hero' ? att.st.ar * (1 + (att.act && att.act.arPct ? att.act.arPct : 0) / 100) : att.ar;
      let dv = def.kind === 'hero' ? def.st.def : def.def;
      if (def.fx.curse && def.fx.curse.type === 'inner_sight') dv = Math.max(0, dv - def.fx.curse.val);
      if (def.fx.buffs && def.fx.buffs.battle_cry) dv *= 0.5;
      if (att.kind === 'hero' && att.st.itd && !def.boss) dv = 0;
      if (att.kind === 'hero' && att.st.itdPct) dv *= 1 - att.st.itdPct / 100;
      const al = att.lvl || 1, dl = def.lvl || 1;
      return clamp(2 * ar / (ar + dv + 1) * al / (al + dl), 0.05, 0.95);
    }

    heroWeaponPack(h, o) {
      o = o || {};
      const st = h.st;
      const rng = this.rng;
      let wd = st.wdmg;
      if (o.throw && st.rh && BASES[st.rh.base].tdmg) { const d = D.weaponDamage(st.rh); wd = { min: d.t[0], max: d.t[1] }; }
      if (o.kick) wd = { min: 2 + Math.floor(st.str / 12), max: 6 + Math.floor(st.str / 6) };
      let pct = (o.throw ? st.throwStat : st.statDmgPct) + st.ed + (o.ed || 0);
      if (o.target && o.target.mon && o.target.mon.undead) pct += st.undead;
      if (h.form === 'wolf' || h.form === 'bear') pct += 20;
      let ph = (wd.min + rng.next() * (wd.max - wd.min)) * (1 + pct / 100);
      if (st.dual && o.offhand && st.lh) { const d2 = D.weaponDamage(st.lh); ph = (d2.min + rng.next() * (d2.max - d2.min)) * (1 + pct / 100); }
      if (o.dmgMul) ph *= o.dmgMul;
      let crit = false;
      if (rng.next() < st.crit / 100 || rng.next() < st.ds / 100) { ph *= 2; crit = true; }
      const pack = { ph, crit };
      const add = (k, v) => { if (!v) return; if (typeof v === 'number') pack[k] = (pack[k] || 0) + v; else pack[k] = [((pack[k] && pack[k][0]) || 0) + v[0], ((pack[k] && pack[k][1]) || 0) + v[1]]; };
      add('fire', st.add.fire); add('cold', st.add.cold); add('light', st.add.light); add('magic', st.add.magic);
      if (st.add.poison) { pack.poison = (pack.poison || 0) + st.add.poison; pack.pdur = 3; }
      if (st.add.cold) pack.chill = 2;
      if (h.auraFx.holyFireAdd) add('fire', h.auraFx.holyFireAdd);
      if (o.add) for (const k in o.add) { if (k === 'poison') { pack.poison = (pack.poison || 0) + o.add.poison; pack.pdur = 3; } else add(k, o.add[k]); }
      return pack;
    }

    monsterPack(m) {
      const rng = this.rng;
      const ph = m.dmg[0] + rng.next() * (m.dmg[1] - m.dmg[0]);
      const pack = { ph };
      let wk = m.fx.curse && m.fx.curse.type === 'weaken' ? 0.67 : 1;
      if (m.fx.curse && m.fx.curse.type === 'decrepify') wk *= 0.5;
      if (m.fx.buffs.battle_cry) wk *= 0.75;
      pack.ph *= wk;
      const el = m.mon && m.mon.el;
      if (m.mods.includes('fireench')) pack.fire = [ph * 0.5, ph];
      if (m.mods.includes('coldench')) { pack.cold = [ph * 0.4, ph * 0.8]; pack.chill = 3; }
      if (m.mods.includes('lightench')) pack.light = [1, ph * 1.5];
      if (m.mods.includes('spectral')) { const k = rng.pick(['fire', 'cold', 'light']); pack[k] = [ph * 0.5, ph * 1.2]; if (k === 'cold') pack.chill = 2; }
      if (el === 'poison' && m.type === 'andariel') { pack.poison = ph * 3; pack.pdur = 3; }
      if (el === 'cold' && m.type === 'ghost') { pack.cold = [ph * 0.3, ph * 0.6]; pack.chill = 2; pack.ph *= 0.6; }
      return pack;
    }

    meleeHit(att, tgt, o) {
      o = o || {};
      if (!tgt || tgt.dead) return false;
      if (Math.hypot(tgt.x - att.x, tgt.y - att.y) > (o.reach || this.reachOf(att)) + tgt.r + 0.6) return false;
      if (this.rng.next() > this.hitChance(att, tgt) && !o.autoHit) { this.sfx('swing', att.x, att.y); return false; }
      if (tgt.kind === 'hero') {
        const st = tgt.st;
        if (st.dodge && !tgt.act && this.rng.next() < st.dodge / 100) { this.overheadFx(tgt, 'dodge'); return false; }
        const bl = st.shield ? st.block : st.clawBlock;
        if (bl && this.rng.next() < bl / 100 && !(tgt.act && tgt.act.noBlock)) {
          if (!tgt.act) { tgt.anim = { n: 'block', t: 0, dur: 0.28 }; tgt.act = { t: 0, dur: 0.28, fired: 1, block: true }; }
          this.sfx('block', tgt.x, tgt.y);
          return false;
        }
      }
      const pack = att.kind === 'hero' ? this.heroWeaponPack(att, Object.assign({ target: tgt }, o)) : att.kind === 'mon' ? this.monsterPack(att) : this.petPack(att);
      if (o.extraPack) for (const k in o.extraPack) pack[k] = o.extraPack[k];
      this.damage(att, tgt, pack, Object.assign({ melee: true }, o));
      if (att.kind === 'hero') this.wearItem(att, 'weapon');
      if (tgt.kind === 'hero') this.wearItem(tgt, 'armor');
      return true;
    }

    reachOf(e) {
      if (e.kind === 'hero') {
        const b = e.st.rb;
        if (e.form) return 1.2;
        if (!b) return 1.0;
        if (b.type === 'spear' || b.type === 'polearm') return 1.9;
        if (b.hands === 2 || b.type === 'staff') return 1.4;
        return 1.15;
      }
      return e.range || 1.1;
    }

    petPack(p) {
      const ph = p.dmg[0] + this.rng.next() * (p.dmg[1] - p.dmg[0]);
      const pack = { ph };
      if (p.el) pack[p.el] = [ph * 0.5, ph];
      if (p.unit === 'firegolem') pack.fire = [ph * 0.8, ph * 1.4];
      if (p.merc && p.merc.type === 'fire') pack.fire = [ph * 0.3, ph * 0.6];
      if (p.merc && p.merc.type === 'cold') { pack.cold = [ph * 0.2, ph * 0.4]; pack.chill = 2; }
      const own = this.hero;
      if (own.auraFx.ed) pack.ph *= 1 + own.auraFx.ed / 100;
      if (own.auraFx.wolverineEd) pack.ph *= 1 + own.auraFx.wolverineEd / 100;
      return pack;
    }

    wearItem(e, kind) {
      if (this.rng.next() > 0.035) return;
      const ch = this.char;
      const list = kind === 'weapon' ? [D.activeHands(ch).rh] : ['head', 'body', 'gloves', 'feet', 'belt'].map(s => ch.equip[s]).concat([D.activeHands(ch).lh]);
      const it = this.rng.pick(list.filter(x => x && x.maxDur && x.dur > 0 && !(x.stats && x.stats.indestructible)));
      if (!it) return;
      it.dur--;
      if (it.dur === 0) { this.msg(D.itemName(it) + ' сломан' + (BASES[it.base].g === 'f' ? 'а' : BASES[it.base].g === 'pl' ? 'ы' : BASES[it.base].g === 'n' ? 'о' : '') + '!', D.COL.red); this.recalc(); }
      else if (it.dur === Math.ceil(it.maxDur * 0.1)) this.ev({ t: 'lowdur', uid: it.uid });
    }

    resOf(e, k) {
      if (e.kind === 'hero') return e.st.res[k] || 0;
      let r = (e.res && e.res[k]) || 0;
      if (e.kind === 'pet' || e.kind === 'merc') r = e.resAll || 0;
      return r;
    }

    damage(src, tgt, pack, o) {
      o = o || {};
      if (!tgt || tgt.dead || tgt.invuln) return 0;
      const rng = this.rng;
      let total = 0, phys = 0;
      const curse = tgt.fx.curse;
      if (pack.ph) {
        let v = roll(rng, pack.ph);
        if (tgt.kind === 'hero') {
          v = Math.max(0, v - tgt.st.dr);
          const ba = tgt.fx.buffs.bone_armor;
          if (ba) { const ab = Math.min(ba.val, v); ba.val -= ab; v -= ab; if (ba.val <= 0) { delete tgt.fx.buffs.bone_armor; this.msg('Костяная броня разрушена', D.COL.dim); } }
          if (tgt.fx.curse && tgt.fx.curse.type === 'amplify') v *= 1.5;
        } else {
          let pr = this.resOf(tgt, 'ph');
          if (curse && curse.type === 'amplify') pr -= 100;
          if (curse && curse.type === 'decrepify') pr -= 50;
          v *= 1 - clamp(pr, -100, 95) / 100;
        }
        if (o.undeadBonus && tgt.mon && tgt.mon.undead) v *= o.undeadBonus;
        phys = Math.max(0, v);
        total += phys;
      }
      const elem = (k, rk) => {
        if (!pack[k]) return 0;
        let v = roll(rng, pack[k]);
        const r = this.resOf(tgt, rk);
        if (r >= 100) { return 0; }
        v *= 1 - clamp(r, -100, 95) / 100;
        if (k === 'magic' && tgt.kind === 'hero') v = Math.max(0, v - tgt.st.mdr);
        if (o.undeadBonus && tgt.mon && tgt.mon.undead) v *= o.undeadBonus;
        return Math.max(0, v);
      };
      const fire = elem('fire', 'f'), cold = elem('cold', 'c'), light = elem('light', 'l'), magic = elem('magic', 'm');
      total += fire + cold + light + magic;
      if (pack.cold && cold > 0 && !(tgt.kind === 'hero' && tgt.st.cbf)) {
        const len = (pack.chill || 2) * (tgt.boss ? 0.5 : 1) * (tgt.kind === 'hero' && tgt.st.hfd ? 0.5 : 1);
        tgt.fx.chill = Math.max(tgt.fx.chill || 0, len);
        tgt.fx.chillPct = 0.5;
      }
      if (pack.freeze && cold > 0 && !(tgt.kind === 'hero' && tgt.st.cbf) && !tgt.boss) tgt.fx.freeze = Math.max(tgt.fx.freeze || 0, pack.freeze);
      if (pack.poison) {
        const r = this.resOf(tgt, 'p');
        if (r < 100) {
          const tot = pack.poison * (1 - clamp(r, -100, 95) / 100);
          const dur = pack.pdur || 3;
          const dps = tot / dur;
          if (!tgt.fx.poison || tgt.fx.poison.dps < dps) tgt.fx.poison = { dps, t: dur, src: src ? src.id : null };
        }
      }
      if (src && src.kind === 'hero' && o.melee && tgt.kind === 'mon') {
        const st = src.st;
        if (st.cb && rng.next() < st.cb / 100) total += tgt.hp * (tgt.boss ? 0.125 : 0.25) * (this.diff ? 0.5 : 1);
        if (st.ow && rng.next() < st.ow / 100) tgt.fx.bleed = { dps: (src.lvl * 2 + 4) * (tgt.boss ? 0.5 : 1), t: 8 };
        if (st.freeze && !tgt.boss) tgt.fx.freeze = Math.max(tgt.fx.freeze || 0, st.freeze * 0.5);
        if (st.flee && rng.next() < st.flee / 100 && !tgt.boss) tgt.fx.fear = 3;
        const lm = this.diff === 0 ? 1 : this.diff === 1 ? 0.67 : 0.5;
        const lm2 = tgt.boss ? 0.5 : 1;
        if (st.ll) src.hp = Math.min(src.hpMax, src.hp + phys * st.ll / 100 * lm * lm2);
        if (st.ml) src.mp = Math.min(src.mpMax, src.mp + phys * st.ml / 100 * lm * lm2);
        if (o.knock || st.kb) this.knock(src, tgt, o.knock ? 1.4 : 0.7);
      }
      if (curse && curse.type === 'life_tap' && src && src.team !== tgt.team) src.hp = Math.min(src.hpMax, src.hp + phys * 0.5);
      if (src && o.melee && src.fx.curse && src.fx.curse.type === 'iron_maiden' && phys > 0) this.rawHurt(src, phys * src.fx.curse.val / 100, null);
      if (o.melee && src && !src.dead && tgt.kind === 'hero') {
        let th = tgt.st.thorns;
        if (tgt.auraFx.thorns) th += phys * tgt.auraFx.thorns / 100;
        if (tgt.fx.buffs.frozen_armor && src.kind === 'mon' && !src.boss) src.fx.freeze = Math.max(src.fx.freeze || 0, tgt.fx.buffs.frozen_armor.freeze);
        if (th > 0) this.rawHurt(src, th, tgt);
      }
      if (o.melee && src && tgt.kind === 'mon' && tgt.mods && tgt.mods.includes('lightench') && rng.next() < 0.3) D.Skills.monsterBolts(this, tgt);
      if (src && src.kind === 'mon' && tgt.kind === 'hero' && src.mods.includes('cursed') && o.melee) tgt.fx.curse = { type: 'amplify', t: 4, val: 50 };
      if (src && src.kind === 'mon' && tgt.kind === 'hero' && src.mods.includes('manaburn')) tgt.mp = Math.max(0, tgt.mp - total * 0.5);
      if (src && src.mon && src.mon.drain && tgt.kind === 'hero') tgt.mp = Math.max(0, tgt.mp - total * 0.4);
      if (tgt.kind === 'hero' && pack.ph && o.melee) this.ev({ t: 'hurt', amt: total });
      total = Math.max(0, total);
      tgt.hp -= total;
      if (total > 0) this.hitFx(tgt, pack, total, src);
      if (tgt.hp <= 0) {
        if (tgt.kind === 'hero' && tgt.hp > -0.5) tgt.hp = 0;
        this.kill(tgt, src);
      } else {
        this.stagger(tgt, total, src);
        if (tgt.kind === 'mon' && src) D.AI.provoke(this, tgt, src);
      }
      return total;
    }

    rawHurt(e, v, src) {
      if (e.dead || v <= 0) return;
      e.hp -= v;
      if (e.hp <= 0) this.kill(e, src);
    }

    knock(src, tgt, d) {
      if (tgt.boss || tgt.dead) return;
      const a = Math.atan2(tgt.y - src.y, tgt.x - src.x);
      for (let k = 0; k < 6; k++) this.tryMove(tgt, tgt.x + Math.cos(a) * d / 6, tgt.y + Math.sin(a) * d / 6);
      tgt.act = null;
      tgt.anim = { n: 'hit', t: 0, dur: 0.35 };
      tgt.fx.stun = Math.max(tgt.fx.stun || 0, 0.25);
    }

    stagger(tgt, amt, src) {
      if (tgt.dead) return;
      if (tgt.kind === 'hero') {
        if (amt >= tgt.hpMax / 12 && !(tgt.act && (tgt.act.whirl || tgt.act.leap))) {
          tgt.act = { t: 0, dur: tgt.st.hitDur, fired: 1, hit: true };
          tgt.anim = { n: 'hit', t: 0, dur: tgt.st.hitDur };
          tgt.path = null;
        }
        return;
      }
      if (tgt.boss || tgt.kind === 'npc') return;
      if (amt >= tgt.hpMax * 0.07 || this.rng.next() < 0.25) {
        tgt.act = { t: 0, dur: 0.3, fired: 1, hit: true };
        tgt.anim = { n: 'hit', t: 0, dur: 0.3 };
        tgt.path = null;
      }
    }

    hitFx(tgt, pack, total, src) {
      const el = pack.fire ? 'fire' : pack.cold ? 'cold' : pack.light ? 'light' : pack.poison && !pack.ph ? 'poison' : pack.magic ? 'magic' : 'blood';
      const blood = tgt.mon && (tgt.mon.undead || tgt.type === 'ghost') ? 'bone' : 'blood';
      this.vfx.push({ k: 'hit', el: el === 'blood' ? blood : el, x: tgt.x, y: tgt.y, z: 1.0, t: 0, dur: 0.35, s: Math.min(2, 0.6 + total / (tgt.hpMax || 1) * 3) });
      this.sfx(pack.crit ? 'crit' : el === 'blood' || el === 'bone' ? 'hit' : 'hit_' + el, tgt.x, tgt.y);
    }

    overheadFx(e, k) { this.vfx.push({ k, x: e.x, y: e.y, z: 2.2, t: 0, dur: 0.6 }); }

    kill(tgt, src) {
      if (tgt.dead) return;
      tgt.dead = true;
      tgt.hp = 0;
      tgt.act = null;
      tgt.path = null;
      tgt.deathT = 0;
      tgt.fx.poison = null; tgt.fx.bleed = null; tgt.fx.freeze = 0;
      tgt.anim = { n: 'death', t: 0, dur: tgt.boss ? 1.6 : 0.8 };
      if (tgt.kind === 'hero') { this.heroDied(); return; }
      if (tgt.kind === 'merc') { this.char.merc.dead = true; this.msg('Ваша наёмница погибла', D.COL.red); this.sfx('merc_die', tgt.x, tgt.y); return; }
      if (tgt.kind === 'pet') { tgt.noCorpse = true; return; }
      if (tgt.kind !== 'mon') return;
      this.stats.kills++;
      this.sfx(tgt.boss ? 'boss_die' : 'die_' + (tgt.mon.undead ? 'undead' : tgt.mon.demon ? 'demon' : 'beast'), tgt.x, tgt.y);
      const killer = src && (src.kind === 'hero' || src.kind === 'pet' || src.kind === 'merc') ? this.hero : null;
      if (killer || this.hero.team !== tgt.team) this.giveXp(tgt);
      const h = this.hero;
      if (h.st.lak) h.hp = Math.min(h.hpMax, h.hp + h.st.lak);
      if (h.st.mak) h.mp = Math.min(h.mpMax, h.mp + h.st.mak);
      this.dropLoot(tgt);
      if (tgt.mods.includes('fireench')) D.Skills.nova(this, tgt, 'fire', [tgt.dmg[0], tgt.dmg[1] * 1.5], 1, 3);
      if (tgt.mods.includes('coldench')) D.Skills.nova(this, tgt, 'cold', [tgt.dmg[0] * 0.5, tgt.dmg[1]], 1, 3);
      if (tgt.type === 'fallen') for (const e of this.ents) if (!e.dead && e.type === 'fallen' && e !== tgt && Math.hypot(e.x - tgt.x, e.y - tgt.y) < 8 && this.rng.next() < 0.5) e.fx.fear = 2.5;
      this.questKill(tgt);
    }

    giveXp(m) {
      const ch = this.char;
      if (ch.level >= 99) return;
      const dl = m.lvl - ch.level;
      let mul = 1;
      if (dl > 5) mul = ch.level / m.lvl;
      else if (dl < -5) mul = Math.max(0.05, 1 + (dl + 5) * 0.12);
      if (this.hero.fx.buffs.shrine_experience) mul *= 1.5;
      const x = Math.max(1, Math.round(m.xp * mul));
      ch.xp += x;
      while (ch.level < 99 && ch.xp >= D.xpFor(ch.level + 1)) this.levelUp();
    }

    levelUp() {
      const ch = this.char, h = this.hero;
      ch.level++;
      ch.statPts += 5;
      ch.skillPts += 1;
      this.recalc();
      h.hp = h.hpMax; h.mp = h.mpMax; h.sp = h.spMax;
      this.ev({ t: 'lvlup', lvl: ch.level });
      this.vfx.push({ k: 'lvlup', x: h.x, y: h.y, z: 0, t: 0, dur: 1.4, follow: h.id });
      this.msg('Новый уровень: ' + ch.level, D.COL.gold);
      for (const p of this.pets) if (p.kind === 'merc') this.updateMercStats(p);
    }

    heroDied() {
      const h = this.hero;
      this.stats.deaths++;
      h.pots = [];
      h.order = null;
      this.diedShown = false;
      this.deathPos = { area: this.area.id, x: h.x, y: h.y };
      this.sfx('hero_die', h.x, h.y);
      this.ev({ t: 'herodeath' });
    }

    respawn() {
      const ch = this.char, h = this.hero;
      if (!h.dead) return;
      if (ch.hc) { ch.dead = true; this.ev({ t: 'hcdead' }); return; }
      const eq = {};
      for (const s of D.SLOTS) if (ch.equip[s]) { eq[s] = ch.equip[s]; }
      const lost = Math.floor(ch.gold * 0.1);
      ch.gold -= lost;
      if (this.diff > 0) {
        const cur = D.xpFor(ch.level), nxt = D.xpFor(ch.level + 1);
        ch.xp = Math.max(cur, ch.xp - Math.floor((nxt - cur) * (this.diff === 1 ? 0.05 : 0.1)));
      }
      if (Object.keys(eq).length) {
        if (ch.corpse) this.retrieveCorpse(true);
        ch.corpse = { diff: this.diff, equip: eq };
        ch.equip = {};
        const dp = this.deathPos;
        const a = this.areas[dp.area];
        this.addDynTo(a, 'corpse', dp.x, dp.y, { label: 'Тело: ' + ch.name });
      }
      h.dead = false;
      h.anim = { n: 'idle', t: 0, dur: 1 };
      h.fx = { buffs: {} };
      h.form = null; h.charges = null;
      this.recalc();
      h.hp = h.hpMax; h.mp = h.mpMax; h.sp = h.spMax;
      this.enterArea('town', 'death');
      if (lost) this.msg('Вы потеряли ' + lost + ' золота', D.COL.red);
    }

    retrieveCorpse(silent) {
      const ch = this.char;
      if (!ch.corpse) return;
      const inv = D.invGrid(ch);
      for (const s in ch.corpse.equip) {
        const it = ch.corpse.equip[s];
        if (!ch.equip[s]) ch.equip[s] = it;
        else if (!inv.add(it)) this.dropItem(it, this.hero.x, this.hero.y);
      }
      ch.corpse = null;
      this.recalc();
      if (!silent) { this.msg('Вы забрали своё снаряжение', D.COL.white); this.sfx('pickup', this.hero.x, this.hero.y); }
      for (const a of Object.values(this.areas)) a.dyn = a.dyn.filter(o => o.type !== 'corpse');
    }

    dropItem(it, x, y) {
      const a = this.area;
      const p = D.nearestWalkable(a, x, y, 3) || { x, y };
      const gi = { id: 'i' + this.nid(), item: it, x: p.x, y: p.y, t: 0, fromX: x, fromY: y };
      a.items.push(gi);
      this.sfx(BASES[it.base] && BASES[it.base].cat === 'misc' && BASES[it.base].type.endsWith('pot') ? 'drop_potion' : 'drop', p.x, p.y);
      return gi;
    }

    dropGold(n, x, y) {
      const a = this.area;
      const p = D.nearestWalkable(a, x, y, 3) || { x, y };
      a.items.push({ id: 'i' + this.nid(), gold: n, x: p.x, y: p.y, t: 0 });
    }

    scatter(x, y, k, n) {
      const ang = k / Math.max(1, n) * Math.PI * 2 + this.rng.range(-0.3, 0.3);
      const r = 0.7 + this.rng.range(0, 0.9);
      return { x: x + Math.cos(ang) * r, y: y + Math.sin(ang) * r };
    }

    dropLoot(m) {
      const rng = this.rng;
      const ilvl = Math.max(1, m.lvl);
      const hero = this.hero;
      let picks = m.su ? 5 : m.unique ? 4 : m.champ ? 2 : 1;
      let noDrop = m.su ? 0 : m.unique ? 0.1 : m.champ ? 0.3 : 0.55;
      let bonus = m.su ? 4 : m.unique ? 3 : m.champ ? 2 : 1;
      if (m.type === 'andariel') { picks = 7; bonus = this.q('andariel') < 2 ? 8 : 6; }
      if (m.type === 'countess') picks = 4;
      const drops = [];
      for (let i = 0; i < picks; i++) {
        if (rng.next() < noDrop) continue;
        const r = rng.next();
        if (r < 0.32) drops.push({ gold: Math.round((rng.int(ilvl * 3 + 8, ilvl * 12 + 28)) * (1 + hero.st.gf / 100) * (1 + this.diff * 0.8)) });
        else if (r < 0.64) drops.push({ item: D.potionFor(rng, ilvl) });
        else if (r < 0.9) drops.push({ item: D.rollItem(rng, ilvl, { mf: hero.st.mf, bonus }) });
        else if (r < 0.95) drops.push({ item: D.makeItem(rng.chance(0.5) ? 'tp_scroll' : rng.chance(0.6) ? 'id_scroll' : rng.chance(0.5) ? 'arrows' : 'key', { qty: rng.chance(0.5) ? undefined : rng.int(1, 4) }) });
        else if (ilvl >= 3) drops.push({ item: D.gemOrRune(rng, ilvl) });
      }
      if (m.type === 'andariel' && this.q('andariel') < 2) {
        drops.push({ item: D.rollItem(rng, ilvl, { quality: 'rare' }) });
        drops.push({ item: D.rollSpecial(rng, ilvl) });
      }
      if (m.type === 'countess') {
        drops.push({ gold: Math.round(rng.int(400, 900) * (1 + this.diff * 2) * (1 + hero.st.gf / 100)) });
        const nr = rng.int(2, 4);
        for (let i = 0; i < nr; i++) {
          const pool = D.RUNE_IDS.filter(id => BASES[id].qlvl <= (this.diff === 0 ? 17 : this.diff === 1 ? 30 : 51));
          drops.push({ item: D.makeItem(rng.weighted(pool, id => Math.pow(0.7, BASES[id].rank))) });
        }
      }
      drops.forEach((d, k) => {
        const p = this.scatter(m.x, m.y, k, drops.length);
        if (d.gold) this.dropGold(d.gold, p.x, p.y);
        else this.dropItem(d.item, p.x, p.y);
      });
      if (drops.some(d => d.item && (d.item.q === 'unique' || d.item.q === 'set' || BASES[d.item.base].type === 'rune'))) this.sfx('drop_special', m.x, m.y);
    }

    questKill(m) {
      const aid = this.area.id;
      if (aid === 'den' && this.q('den') <= 1) {
        const left = this.ents.filter(e => e.kind === 'mon' && !e.dead).length;
        this.denLeft = left;
        if (left === 0) { this.setQ('den', 2); this.msg('Логово зла очищено!', D.COL.gold); this.sfx('quest', 0, 0); }
        else if (left <= 5) this.msg('Осталось чудовищ в логове: ' + left, D.COL.dim);
      }
      if (m.su === 'blood_raven') { this.setQ('burial', 2); this.sfx('quest', 0, 0); }
      if (m.su === 'countess') { this.setQ('tower', 2); this.sfx('quest', 0, 0); }
      if (m.su === 'andariel') { this.setQ('andariel', 2); this.sfx('quest', 0, 0); this.ev({ t: 'bossdown', id: 'andariel' }); }
    }

    pickupGoldNear() {
      const h = this.hero;
      if (h.dead) return;
      const a = this.area;
      for (let i = a.items.length - 1; i >= 0; i--) {
        const gi = a.items[i];
        if (!gi.gold || gi.t < 0.3) continue;
        if (Math.hypot(gi.x - h.x, gi.y - h.y) < 0.9) this.pickUp(gi);
      }
      for (const gi of a.items) gi.t += 1 / 30;
    }

    pickUp(gi) {
      const a = this.area, ch = this.char;
      if (gi.gold) {
        const room = D.goldMax(ch) - ch.gold;
        if (room <= 0) { this.overhead('Больше золота не унести'); return false; }
        const take = Math.min(room, gi.gold);
        ch.gold += take;
        gi.gold -= take;
        if (gi.gold <= 0) a.items.splice(a.items.indexOf(gi), 1);
        this.sfx('gold', gi.x, gi.y);
        return true;
      }
      const it = gi.item;
      const b = BASES[it.base];
      if (b.type === 'quest' || b.id === 'q_malus') this.questPickup(it);
      if (D.beltAccept(b) && b.type !== 'scroll' && D.beltAdd(ch, it)) { a.items.splice(a.items.indexOf(gi), 1); this.sfx('pickup', gi.x, gi.y); return true; }
      if (b.type === 'scroll') {
        const tome = ch.inv.find(x => BASES[x.base].type === 'tome' && BASES[x.base].spell === b.spell && x.qty < BASES[x.base].maxQty);
        if (tome) { tome.qty++; a.items.splice(a.items.indexOf(gi), 1); this.sfx('pickup', gi.x, gi.y); return true; }
      }
      if (D.isStackable(b)) {
        const same = ch.inv.find(x => x.base === it.base && x.qty < b.maxQty);
        if (same) {
          const mv = Math.min(b.maxQty - same.qty, it.qty);
          same.qty += mv; it.qty -= mv;
          if (it.qty <= 0) { a.items.splice(a.items.indexOf(gi), 1); this.sfx('pickup', gi.x, gi.y); return true; }
        }
      }
      if (b.type === 'quiver') {
        const lh = D.activeHands(ch).lh;
        if (lh && lh.base === it.base && lh.qty < b.maxQty) {
          const mv = Math.min(b.maxQty - lh.qty, it.qty);
          lh.qty += mv; it.qty -= mv;
          if (it.qty <= 0) { a.items.splice(a.items.indexOf(gi), 1); this.sfx('pickup', gi.x, gi.y); return true; }
        }
      }
      const g = D.invGrid(ch);
      if (!g.add(it)) { this.overhead('Нет места'); this.sfx('noroom', gi.x, gi.y); return false; }
      a.items.splice(a.items.indexOf(gi), 1);
      this.sfx('pickup', gi.x, gi.y);
      if (b.cat === 'charm') this.recalc();
      return true;
    }

    questPickup(it) {
      if (it.base === 'q_scroll') this.setQ('cain', 2);
      if (it.base === 'q_malus') this.setQ('tools', 2);
    }

    interact(t) {
      const h = this.hero;
      if (t.item || t.gold) { this.pickUp(t); return; }
      if (t.kind === 'npc') { this.openNpc(t); return; }
      if (t.kind === 'mon') return;
      switch (t.type) {
        case 'wp':
          if (!this.prog.wp[this.area.id]) { this.prog.wp[this.area.id] = 1; this.msg('Путевая точка активирована', D.COL.tan); this.sfx('wp', t.x, t.y); }
          this.ev({ t: 'open', panel: 'wp' });
          break;
        case 'stash': this.ev({ t: 'open', panel: 'stash' }); this.sfx('chest', t.x, t.y); break;
        case 'stairs_down': case 'stairs_up': case 'cave': case 'tower': case 'gate':
          this.enterArea(t.to, 'from:' + this.area.id); break;
        case 'portal': this.usePortal(t); break;
        case 'redportal': this.enterArea(t.to, t.to === 'tristram' ? 'start' : { x: this.areas.stonyfield.cairn.x + 1.5, y: this.areas.stonyfield.cairn.y + 1.5 }); break;
        case 'chest': case 'barrel': case 'urn': case 'body': this.openContainer(t); break;
        case 'shrine': this.useShrine(t); break;
        case 'cairn': this.touchCairn(t); break;
        case 'inifuss':
          if (t.open) break;
          if (this.q('cain') >= 1 && this.q('cain') < 3 && !this.hasItem('q_scroll')) { t.open = true; this.dropItem(D.makeItem('q_scroll'), t.front.x, t.front.y); this.sfx('quest', t.x, t.y); }
          else this.overhead('Древнее дерево безмолвствует');
          break;
        case 'tome':
          if (this.q('tower') === 0) { this.setQ('tower', 1); this.ev({ t: 'read', text: 'Заплесневелый фолиант повествует о Графине — кровавой правительнице, что купалась в крови юных дев. Её замуровали в подвалах собственной башни на Чёрном болоте, но слуги шепчутся, что её сокровища до сих пор лежат в самых глубоких покоях.' }); this.sfx('book', t.x, t.y); }
          break;
        case 'cage': this.openCage(t); break;
        case 'wirt':
          if (!t.open) { t.open = true; this.dropItem(D.makeItem('wirts_leg'), t.x + 0.8, t.y + 0.6); this.dropGold(this.rng.int(50, 200) * (1 + this.diff), t.x + 0.5, t.y - 0.6); this.sfx('body', t.x, t.y); }
          break;
        case 'malus':
          if (!t.open) { t.open = true; this.dropItem(D.makeItem('q_malus'), t.x + 0.8, t.y + 0.8); this.sfx('quest', t.x, t.y); }
          break;
        case 'corpse': this.retrieveCorpse(); break;
      }
    }

    hasItem(base) {
      const ch = this.char;
      return ch.inv.some(i => i.base === base) || (this.held && this.held.base === base) || Object.values(ch.equip).some(i => i && i.base === base);
    }

    removeItem(base) {
      const ch = this.char;
      const i = ch.inv.findIndex(x => x.base === base);
      if (i >= 0) { ch.inv.splice(i, 1); return true; }
      if (this.held && this.held.base === base) { this.held = null; return true; }
      for (const s in ch.equip) if (ch.equip[s] && ch.equip[s].base === base) { delete ch.equip[s]; this.recalc(); return true; }
      return false;
    }

    openContainer(t) {
      if (t.open) return;
      if (t.type === 'chest' && t.locked) {
        const k = this.char.inv.find(i => i.base === 'key');
        if (!k) { this.overhead('Нужен ключ'); this.sfx('locked', t.x, t.y); return; }
        k.qty--;
        if (k.qty <= 0) this.char.inv.splice(this.char.inv.indexOf(k), 1);
      }
      t.open = true;
      const rng = this.rng;
      const ilvl = this.monLevel(this.area);
      this.sfx(t.type === 'barrel' ? 'barrel' : t.type === 'urn' ? 'urn' : t.type === 'body' ? 'body' : 'chest', t.x, t.y);
      const n = t.type === 'chest' ? rng.int(1, t.locked ? 4 : 3) : rng.int(0, 1);
      const bonus = t.locked ? 2 : 1;
      for (let i = 0; i < n; i++) {
        const p = this.scatter(t.x, t.y, i, n);
        const r = rng.next();
        if (r < 0.35) this.dropGold(Math.round(rng.int(ilvl * 3 + 5, ilvl * 12 + 25) * (1 + this.hero.st.gf / 100) * (1 + this.diff)), p.x, p.y);
        else if (r < 0.62) this.dropItem(D.potionFor(rng, ilvl), p.x, p.y);
        else if (r < 0.95) this.dropItem(D.rollItem(rng, ilvl, { mf: this.hero.st.mf, bonus }), p.x, p.y);
        else this.dropItem(D.gemOrRune(rng, ilvl + 2), p.x, p.y);
      }
      if (t.type === 'barrel' && rng.chance(0.08)) D.Skills.nova(this, { x: t.x, y: t.y, team: 1, id: -1, lvl: ilvl }, 'fire', [ilvl, ilvl * 3], 1, 2);
    }

    useShrine(t) {
      if (t.open) { this.overhead('Святилище пусто'); return; }
      t.open = true;
      const h = this.hero;
      const names = { armor: 'Святилище брони', combat: 'Святилище битвы', refill: 'Святилище пополнения', experience: 'Святилище опыта', mana: 'Святилище маны', skill: 'Святилище мастерства', stamina: 'Святилище выносливости', resist: 'Святилище стойкости' };
      this.msg(names[t.shrine], D.COL.blue);
      this.sfx('shrine', t.x, t.y);
      this.vfx.push({ k: 'shrine', x: h.x, y: h.y, z: 0, t: 0, dur: 1.2, follow: h.id });
      for (const k in h.fx.buffs) if (k.startsWith('shrine_')) delete h.fx.buffs[k];
      if (t.shrine === 'refill') { h.hp = h.hpMax; h.mp = h.mpMax; }
      else if (t.shrine === 'stamina') h.fx.buffs.shrine_stamina = { t: 96 };
      else h.fx.buffs['shrine_' + t.shrine] = { t: 96 };
      this.recalc();
    }

    touchCairn(t) {
      const a = this.area;
      if (this.q('cain') < 3) { this.overhead('Камни безмолвствуют'); return; }
      if (this.q('cain') >= 4) return;
      const order = a.cairn.order;
      const k = this.cairnTouched.length;
      if (order[k] === t.rune) {
        this.cairnTouched.push(t.rune);
        t.lit = true;
        this.sfx('cairn', t.x, t.y);
        if (this.cairnTouched.length === 5) {
          this.addDyn('redportal', a.cairn.x, a.cairn.y, { to: 'tristram', label: 'Тристрам' });
          this.setQ('cain', 4);
          this.sfx('portal', a.cairn.x, a.cairn.y);
          this.vfx.push({ k: 'flash', c: '#ff2020', t: 0, dur: 0.8 });
        }
      } else {
        this.cairnTouched = [];
        for (const o of a.objs) if (o.type === 'cairn') o.lit = false;
        this.overhead('Неверный порядок');
        this.sfx('fail', t.x, t.y);
      }
    }

    openCage(t) {
      if (t.open) return;
      if (this.q('cain') < 4) return;
      t.open = true;
      this.setQ('cain', 5);
      this.sfx('cage', t.x, t.y);
      this.ev({ t: 'talk', npc: 'cain', text: TALK.cain.rescue });
      const town = this.areas.town;
      if (town && !town.ents.some(e => e.npc === 'cain')) { const n = town.npcs.find(x => x.id === 'cain'); town.ents.push(this.makeNpc('cain', n.x, n.y)); }
    }

    castTownPortal() {
      const a = this.area, h = this.hero;
      if (a.def.town) { this.overhead('Здесь нельзя'); return false; }
      for (const ar of Object.values(this.areas)) ar.dyn = ar.dyn.filter(o => o.type !== 'portal');
      this.portal = { area: a.id, x: h.x + 1, y: h.y + 1 };
      const p = D.nearestWalkable(a, h.x + 1.2, h.y + 1.2, 3) || { x: h.x, y: h.y };
      this.addDyn('portal', p.x, p.y, { to: 'town', label: 'Лагерь разбойниц' });
      const town = this.loadArea('town');
      const tp = town.entries.portal;
      this.addDynTo(town, 'portal', tp.x, tp.y, { to: a.id, label: a.def.name });
      this.portal.x = p.x; this.portal.y = p.y;
      this.sfx('portal', p.x, p.y);
      return true;
    }

    usePortal(t) {
      if (t.to === 'town') { const tp = this.loadArea('town').entries.portal; this.enterArea('town', { x: tp.x + 1, y: tp.y + 1 }); return; }
      const p = this.portal;
      if (!p) return;
      this.enterArea(p.area, { x: p.x + 0.8, y: p.y + 0.8 });
      for (const ar of Object.values(this.areas)) ar.dyn = ar.dyn.filter(o => o.type !== 'portal');
      this.portal = null;
      this.sfx('portal', this.hero.x, this.hero.y);
    }

    travelWp(id) {
      if (!this.prog.wp[id]) return false;
      if (id === this.area.id) return false;
      this.enterArea(id, 'wp');
      this.sfx('wp', this.hero.x, this.hero.y);
      return true;
    }

    checkTriggers() {
      const h = this.hero, a = this.area;
      if (h.dead) return;
      const ci = Math.floor(h.y) * a.w + Math.floor(h.x);
      for (const ex of a.exits) {
        if (ex.zone.includes(ci) && !ex.gate) { this.enterArea(ex.to, 'from:' + a.id); return; }
      }
      for (const o of a.objs) {
        if (o.type === 'wp' && !this.prog.wp[a.id] && Math.hypot(o.x - h.x, o.y - h.y) < 2.2) { this.prog.wp[a.id] = 1; this.msg('Путевая точка активирована', D.COL.tan); this.sfx('wp', o.x, o.y); }
      }
    }

    openNpc(n) {
      this.talking = n;
      if (NPCS[n.npc].heals) {
        const h = this.hero;
        if (h.hp < h.hpMax || h.mp < h.mpMax || h.fx.poison) { h.hp = h.hpMax; h.mp = h.mpMax; h.fx.poison = null; this.sfx('heal', h.x, h.y); }
      }
      this.ev({ t: 'npc', npc: n.npc, id: n.id });
      this.sfx('npc_' + n.npc, n.x, n.y);
    }

    npcMenu(id) {
      const m = [];
      m.push(['talk', 'Поговорить']);
      const n = NPCS[id];
      if (n.shop) m.push(['trade', id === 'charsi' ? 'Торговать/чинить' : 'Торговать']);
      if (n.gamble) m.push(['gamble', 'Азартная игра']);
      if (n.hire) m.push(['hire', this.char.merc && this.char.merc.dead ? 'Воскресить наёмницу' : 'Нанять']);
      if (n.identify && this.q('cain') >= 5) m.push(['identify', 'Опознать предметы']);
      if (id === 'charsi' && this.q('tools') === 3) m.push(['imbue', 'Наделить силой']);
      if (id === 'warriv' && this.q('andariel') >= 2) m.push(['travel', 'На восток']);
      m.push(['cancel', 'Уйти']);
      return m;
    }

    talk(id) {
      const T = TALK[id];
      const q = k => this.q(k);
      let text = null;
      const seen = this.prog.talked = this.prog.talked || {};
      if (id === 'akara') {
        if (q('den') === 2) { text = T.den2; this.setQ('den', 3); this.char.skillPts += 1; this.msg('Вы получили очко навыка', D.COL.gold); }
        else if (q('cain') === 2 && this.hasItem('q_scroll')) { text = T.cain2; this.removeItem('q_scroll'); const it = D.makeItem('q_scroll2'); if (!D.invGrid(this.char).add(it)) this.dropItem(it, this.hero.x, this.hero.y); this.setQ('cain', 3); }
        else if (q('den') === 0 || (q('den') === 1 && !seen.akara_den)) { text = seen.akara ? T.den1 : T.intro + '\n\n' + T.den1; seen.akara = 1; seen.akara_den = 1; this.setQ('den', 1); }
        else if (q('cain') === 0 && q('den') >= 3) { text = T.cain1; this.setQ('cain', 1); }
        else if (q('cain') >= 5 && !seen.akara_cain) { text = T.cain3; seen.akara_cain = 1; }
        else if (q('tower') === 1 && !seen.akara_tower) { text = T.tower; seen.akara_tower = 1; }
        else if (q('cain') === 1 && q('den') >= 3) text = T.cain1;
        else text = this.rng.pick(T.gossip);
      } else if (id === 'kashya') {
        if (q('burial') === 2) { text = T.burial2; this.setQ('burial', 3); this.prog.freeMerc = true; }
        else if (q('burial') === 0) { text = seen.kashya ? T.burial1 : T.intro + '\n\n' + T.burial1; seen.kashya = 1; this.setQ('burial', 1); }
        else if (q('andariel') <= 1 && q('burial') >= 3 && q('tools') >= 1 && !seen.kashya_and) { text = T.andariel; seen.kashya_and = 1; this.setQ('andariel', 1); }
        else if (q('burial') === 1) text = T.burial1;
        else text = this.rng.pick(T.gossip);
      } else if (id === 'charsi') {
        if (q('tools') === 2 && this.hasItem('q_malus')) { text = T.tools2; this.removeItem('q_malus'); this.setQ('tools', 3); }
        else if (q('tools') === 0 && (q('cain') >= 1 || q('burial') >= 3 || this.char.level >= 8)) { text = seen.charsi ? T.tools1 : T.intro + '\n\n' + T.tools1; seen.charsi = 1; this.setQ('tools', 1); }
        else if (!seen.charsi) { text = T.intro; seen.charsi = 1; }
        else if (q('tools') === 1) text = T.tools1;
        else text = this.rng.pick(T.gossip);
      } else if (id === 'warriv') {
        if (q('andariel') >= 2) text = T.andariel2;
        else if (!seen.warriv) { text = T.intro; seen.warriv = 1; }
        else text = this.rng.pick(T.gossip);
      } else if (id === 'cain') {
        if (q('cain') === 5) { text = T.intro; this.setQ('cain', 6); }
        else if (q('andariel') === 1 && !seen.cain_and) { text = T.andariel; seen.cain_and = 1; }
        else text = this.rng.pick(T.gossip);
      } else {
        if (!seen[id]) { text = T.intro; seen[id] = 1; } else text = this.rng.pick(T.gossip);
      }
      this.ev({ t: 'talk', npc: id, text });
      return text;
    }

    travelEast() {
      if (this.q('andariel') < 2) return;
      this.setQ('andariel', 3);
      this.char.maxDiff = Math.max(this.char.maxDiff || 0, Math.min(2, this.diff + 1));
      this.char.seen.act1end = true;
      this.ev({ t: 'actend', diff: this.diff });
    }

    shopTier() { return Math.min(90, this.char.level + 5 + this.diff * 8); }

    shopStock(npc) {
      const s = this.shops[npc];
      if (s && this.time - s.t < 300 && !(s.visit !== this.leftTownAt && this.time - s.t > 60)) return s.items;
      const rng = this.rng;
      const lvl = this.shopTier();
      const items = [];
      const inf = (id) => { const it = D.makeItem(id); it.inf = true; items.push(it); };
      const potTier = lvl < 8 ? 2 : lvl < 20 ? 3 : lvl < 35 ? 4 : 5;
      if (npc === 'akara') {
        for (let t = 1; t <= potTier; t++) { inf('hp' + t); inf('mp' + t); }
        inf('tp_scroll'); inf('id_scroll');
        const tp = D.makeItem('tp_tome', { qty: 0 }); tp.inf = true; items.push(tp);
        const idt = D.makeItem('id_tome', { qty: 0 }); idt.inf = true; items.push(idt);
        for (let i = 0; i < 9; i++) items.push(D.rollItem(rng, lvl, { filter: b => ['wand', 'staff', 'orb', 'amulet', 'ring', 'circlet'].includes(b.type) && b.type !== 'ring', quality: rng.chance(0.55) ? 'magic' : 'normal' }));
      } else if (npc === 'charsi') {
        inf('arrows'); inf('bolts');
        for (let i = 0; i < 22; i++) items.push(D.rollItem(rng, lvl, { filter: b => (b.cat === 'weapon' || b.cat === 'armor') && !['wand', 'staff', 'orb'].includes(b.type), quality: rng.chance(0.3) ? 'magic' : 'normal' }));
      } else if (npc === 'gheed') {
        inf('key'); inf('tp_scroll'); inf('hp' + Math.max(1, potTier - 1));
        for (let i = 0; i < 10; i++) items.push(D.rollItem(rng, lvl, { filter: b => b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'charm', quality: rng.chance(0.5) ? 'magic' : 'normal' }));
      }
      for (const it of items) { it.idf = true; if (BASES[it.base].type === 'key') it.qty = 1; }
      this.shops[npc] = { t: this.time, items, visit: this.leftTownAt };
      return items;
    }

    priceOf(it) { return D.buyPrice(it, this.hero.st.sums.vendor || 0); }

    buy(npc, it, toBelt) {
      const ch = this.char;
      if (this.held) return false;
      const price = this.priceOf(it);
      if (ch.gold < price) { this.overhead('Недостаточно золота'); return false; }
      let item = it;
      if (it.inf) { item = D.makeItem(it.base, { qty: BASES[it.base].type === 'tome' ? 0 : undefined }); if (BASES[it.base].type === 'key') item.qty = 1; }
      const b = BASES[item.base];
      if (b.type === 'tome' && it.inf) item.qty = 0;
      const tome = b.type === 'scroll' ? ch.inv.find(x => BASES[x.base].type === 'tome' && BASES[x.base].spell === b.spell && x.qty < 20) : null;
      const keys = b.type === 'key' ? ch.inv.find(x => x.base === 'key' && x.qty < 12) : null;
      if (toBelt && D.beltAccept(b) && b.type !== 'scroll' && D.beltAdd(ch, item)) this.sfx('item_down', 0, 0);
      else if (tome) tome.qty++;
      else if (keys) keys.qty++;
      else if (!D.invGrid(ch).add(item)) { this.overhead('Нет места'); return false; }
      ch.gold -= price;
      if (!it.inf) { const list = this.shops[npc].items; list.splice(list.indexOf(it), 1); }
      this.sfx('buy', 0, 0);
      return true;
    }

    sell(npc, it) {
      const ch = this.char;
      const b = BASES[it.base];
      if (b.type === 'quest') { this.overhead('Это нельзя продать'); return false; }
      const price = D.sellPrice(it, ch.level);
      const room = D.goldMax(ch) - ch.gold;
      if (it === this.held) this.held = null;
      else { const i = ch.inv.indexOf(it); if (i < 0) return false; ch.inv.splice(i, 1); }
      ch.gold += Math.min(room, price);
      it.idf = true;
      if (this.shops[npc]) this.shops[npc].items.push(it);
      this.sfx('sell', 0, 0);
      if (b.cat === 'charm') this.recalc();
      return true;
    }

    repairAllCost() {
      const ch = this.char;
      let c = 0;
      for (const s in ch.equip) if (ch.equip[s]) c += D.repairCost(ch.equip[s]);
      for (const it of ch.inv) c += D.repairCost(it);
      return c;
    }

    repairAll() {
      const ch = this.char;
      const c = this.repairAllCost();
      if (!c) return false;
      if (ch.gold < c) { this.overhead('Недостаточно золота'); return false; }
      ch.gold -= c;
      const fix = it => { if (it.maxDur) it.dur = it.maxDur; const b = BASES[it.base]; if (b.qty) it.qty = b.qty; };
      for (const s in ch.equip) if (ch.equip[s]) fix(ch.equip[s]);
      for (const it of ch.inv) fix(it);
      this.recalc();
      this.sfx('repair', 0, 0);
      return true;
    }

    gambleList() {
      if (this.gambleCache && this.time - this.gambleCache.t < 120) return this.gambleCache.items;
      const lvl = this.char.level;
      const pool = D.BASE_LIST.filter(b => (b.cat === 'weapon' || b.cat === 'armor' || b.cat === 'jewel') && b.qlvl <= lvl + 5 && b.type !== 'quiver');
      const items = [];
      for (const t of ['ring', 'amulet', 'circlet']) { const b = pool.find(x => x.type === t && x.qlvl <= lvl + 5); if (b) { const it = D.makeItem(b.id); it.gamble = true; it.idf = true; items.push(it); } }
      for (let i = 0; i < 17; i++) { const b = this.rng.pick(pool); const it = D.makeItem(b.id); it.gamble = true; it.idf = true; items.push(it); }
      this.gambleCache = { t: this.time, items };
      return items;
    }

    gamblePrice(it) {
      const b = BASES[it.base];
      const lvl = this.char.level;
      return Math.round((b.cat === 'jewel' ? 3000 : 800 + b.qlvl * 90) + lvl * lvl * 12 + lvl * 150);
    }

    gamble(it) {
      const ch = this.char;
      const price = this.gamblePrice(it);
      if (ch.gold < price) { this.overhead('Недостаточно золота'); return null; }
      const rng = this.rng;
      const ilvl = Math.max(1, ch.level + rng.int(-5, 4));
      const r = rng.next();
      const q = r < 0.0015 ? 'unique' : r < 0.004 ? 'set' : r < 0.11 ? 'rare' : 'magic';
      const item = D.finishQuality(D.makeItem(it.base, { ilvl, rng }), q, rng);
      item.ilvl = ilvl;
      if (!D.invGrid(ch).add(item)) { this.overhead('Нет места'); return null; }
      ch.gold -= price;
      item.idf = true;
      this.gambleCache.items.splice(this.gambleCache.items.indexOf(it), 1, (() => { const b = this.rng.pick(D.BASE_LIST.filter(x => (x.cat === 'weapon' || x.cat === 'armor' || x.cat === 'jewel') && x.qlvl <= ch.level + 5 && x.type !== 'quiver')); const n = D.makeItem(b.id); n.gamble = true; n.idf = true; return n; })());
      this.sfx('buy', 0, 0);
      if (item.q === 'unique' || item.q === 'set') this.sfx('drop_special', 0, 0);
      return item;
    }

    mercList() {
      if (this.mercOffers && this.time - this.mercOffers.t < 300) return this.mercOffers.list;
      const lvl = this.char.level;
      const list = [];
      const names = this.rng.shuffle(D.MERC_NAMES.slice());
      for (let i = 0; i < 4; i++) {
        const l = Math.max(1, lvl + this.rng.int(-2, 1));
        list.push({ name: names[i], lvl: l, type: this.rng.chance(0.5) ? 'fire' : 'cold' });
      }
      this.mercOffers = { t: this.time, list };
      return list;
    }

    mercCost(o) { return this.prog.freeMerc ? 0 : Math.round(80 + o.lvl * o.lvl * 7 + o.lvl * 30) * (1 + this.diff); }
    reviveCost() { const m = this.char.merc; return m ? Math.min(50000, Math.round(100 + m.lvl * m.lvl * 5)) : 0; }

    hireMerc(o) {
      const ch = this.char;
      const c = this.mercCost(o);
      if (ch.gold < c) { this.overhead('Недостаточно золота'); return false; }
      ch.gold -= c;
      if (this.prog.freeMerc) this.prog.freeMerc = false;
      for (const p of this.pets.filter(p => p.kind === 'merc')) { p.dead = true; p.noCorpse = true; }
      this.pets = this.pets.filter(p => p.kind !== 'merc');
      this.area.ents = this.area.ents.filter(e => e.kind !== 'merc');
      ch.merc = { name: o.name, lvl: o.lvl, type: o.type, dead: false };
      this.spawnMerc();
      this.mercOffers.list.splice(this.mercOffers.list.indexOf(o), 1);
      this.sfx('buy', 0, 0);
      return true;
    }

    reviveMerc() {
      const ch = this.char;
      if (!ch.merc || !ch.merc.dead) return false;
      const c = this.reviveCost();
      if (ch.gold < c) { this.overhead('Недостаточно золота'); return false; }
      ch.gold -= c;
      ch.merc.dead = false;
      this.spawnMerc();
      return true;
    }

    spawnMerc() {
      const ch = this.char;
      const h = this.hero;
      const p = this.freeSpot(this.area, h.x, h.y, 2) || { x: h.x, y: h.y };
      const u = ALLIES.merc;
      const m = {
        id: this.nid(), kind: 'merc', team: 0, unit: 'merc', name: ch.merc.name, merc: ch.merc, x: p.x, y: p.y, r: u.r, dir: 0, fx: { buffs: {} },
        anim: { n: 'idle', t: 0, dur: 1 }, act: null, path: null, model: u.model, tint: u.tint, speed: u.speed, range: u.range, atk: u.atk, ai: { st: 'follow', t: 0, cd: 0 }, stepPhase: 0, owner: h.id
      };
      this.updateMercStats(m);
      m.hp = m.hpMax;
      this.pets.push(m);
      this.area.ents.push(m);
      return m;
    }

    updateMercStats(m) {
      const ch = this.char;
      ch.merc.lvl = Math.max(ch.merc.lvl, Math.min(ch.level, ch.merc.lvl + 1));
      const L = ch.merc.lvl;
      const dm = [1, 1.5, 2.2][this.diff];
      m.lvl = L;
      m.hpMax = Math.round((55 + 16 * L) * dm);
      m.dmg = [(2 + 1.6 * L) * dm, (5 + 2.6 * L) * dm];
      m.ar = (40 + 16 * L) * [1, 1.3, 1.6][this.diff];
      m.def = (20 + 8 * L) * dm;
      m.resAll = Math.min(75, L) - [0, 40, 100][this.diff];
      if (m.hp > m.hpMax) m.hp = m.hpMax;
    }

    identify(it) { if (!it.idf) { it.idf = true; this.sfx('identify', 0, 0); return true; } return false; }

    identifyAll() {
      const ch = this.char;
      let n = 0;
      for (const it of ch.inv) if (!it.idf) { it.idf = true; n++; }
      for (const s in ch.equip) if (ch.equip[s] && !ch.equip[s].idf) { ch.equip[s].idf = true; n++; }
      if (n) { this.sfx('identify', 0, 0); this.msg('Опознано предметов: ' + n, D.COL.white); }
      else this.msg('Нет неопознанных предметов', D.COL.dim);
      this.recalc();
      return n;
    }

    imbue(it) {
      const b = BASES[it.base];
      if (this.q('tools') !== 3) return false;
      if (!(b.cat === 'weapon' || b.cat === 'armor') || !(it.q === 'normal' || it.q === 'superior' || it.q === 'socketed')) { this.overhead('Нужна обычная вещь'); return false; }
      D.imbue(it, this.rng, this.char.level);
      this.setQ('tools', 4);
      this.sfx('imbue', 0, 0);
      this.ev({ t: 'talk', npc: 'charsi', text: TALK.charsi.tools3 });
      this.recalc();
      return true;
    }

    saveState() {
      const ch = this.char, h = this.hero;
      ch.life = h.dead ? h.hpMax : Math.round(h.hp);
      ch.mana = Math.round(h.mp);
      if (this.held) {
        const g = D.invGrid(ch);
        if (!g.add(this.held)) this.dropItem(this.held, h.x, h.y); else this.held = null;
        this.held = null;
      }
      return D.serializeChar(ch);
    }
  }

  function buffName(k) {
    const n = { frozen_armor: 'Ледяная броня', bone_armor: 'Костяная броня', burst: 'Ускорение', fade: 'Тень', holy_shield: 'Святой щит', shout: 'Крик', battle_orders: 'Боевые приказы', battle_cry: 'Боевой клич' };
    if (k.startsWith('shrine_')) return 'Святилище';
    return n[k] || k;
  }

  Object.assign(D, { Game, buffName, roll });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
