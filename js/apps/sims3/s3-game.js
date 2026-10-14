(function (S) {
  'use strict';
  const { OBJECTS, ACTS, RNG, clamp, TER, DX, DY, NEED_KEYS, MOODLETS, TRAITS, FAMILIES, AGE_INFO, LIFESPANS, CAREERS, PART_TIME } = S;
  const D = t => OBJECTS[t];
  const SPEEDS = [0, 1, 3, 10];
  const CAR_COLORS = ['#c83a3a', '#3a6ab8', '#e8e0d0', '#2a2a30', '#4a8a4a', '#d8b860', '#8a8c90', '#6a2a3a'];

  class Game {
    constructor(opt) {
      opt = opt || {};
      this.seed = opt.seed || 1999;
      const town = S.buildTown(this.seed);
      this.world = town.world;
      this.world.tracking = true;
      this.lots = this.world.lots;
      this.rng = new RNG((this.seed ^ 0x5151) >>> 0);
      this.t = opt.t !== undefined ? opt.t : 8 * 60;
      this.sims = new Map();
      this.households = new Map();
      this.rels = new Map();
      this.nextSimId = 1; this.nextHH = 1;
      this.opts = Object.assign({ autonomy: 'full', aging: true, lifespan: 'normal', story: true, wishes: true, tips: true }, opt.opts || {});
      this.activeHH = 0; this.sel = 0;
      this.vehicles = []; this.nextCar = 1;
      this.notes = []; this.noteId = 1;
      this.fxList = [];
      this.hooks = {};
      this.speed = 1;
      this.lastHour = Math.floor(this.t / 60);
      this.objVersion = 1; this.lightVersion = 1;
      this.fires = [];
      this.services = [];
      this.debug = !!opt.debug;
      this.flags = {};
      this.lastSoc = new Map();
      if (!opt.empty) this.populate();
      this.world.onChange = (lotId) => { if (lotId >= 0 && this.lots[lotId]) this.lots[lotId].dirty = true; };
    }

    get day() { return Math.floor(this.t / 1440); }
    get hour() { return S.hourOf(this.t); }
    isNight() { const h = this.hour; return h >= 20 || h < 6; }
    darkness() {
      const h = this.hour;
      if (h >= 7 && h < 18) return 0;
      if (h >= 18 && h < 21) return (h - 18) / 3;
      if (h >= 5 && h < 7) return 1 - (h - 5) / 2;
      return 1;
    }

    populate() {
      for (const fam of FAMILIES) {
        const lot = this.world.lotByKey[fam.lot];
        const hh = this.addHousehold(fam.last, lot.id, fam.funds, fam.key);
        const members = [];
        for (const m of fam.members) {
          const look = S.makeLook(this.rng, m.gender, m.age);
          if (m.look) Object.assign(look, m.look);
          const sim = this.addSim(S.randomSim(this.rng, { gender: m.gender, age: m.age, first: m.first, last: m.last || fam.last, traits: m.traits, look, ltw: m.ltw }), hh);
          if (m.job) sim.job = { c: m.job[0], lvl: m.job[1], branch: m.job[2] || null, perf: 20, days: 0 };
          members.push(sim);
        }
        for (const [i, j, v, kind] of fam.rels) {
          const a = members[i], b = members[j];
          const r = this.rel(a, b);
          r.v = v; r.met = true;
          if (kind === 'married') { r.flags.married = true; r.flags.romance = true; }
          if (kind === 'family') {
            if (S.ageIdx(a.age) - S.ageIdx(b.age) >= 2) b.parents = (b.parents || []).concat(a.id);
            else if (S.ageIdx(b.age) - S.ageIdx(a.age) >= 2) a.parents = (a.parents || []).concat(b.id);
          }
          r.known[a.id] = b.traits.slice(); r.known[b.id] = a.traits.slice();
        }
        const kids = members.filter(s => S.ageIdx(s.age) <= 3);
        for (let x = 0; x < kids.length; x++) for (let y = x + 1; y < kids.length; y++) {
          const pa = kids[x].parents || [], pb = kids[y].parents || [];
          if (pa.some(p => pb.includes(p))) { const r = this.rel(kids[x], kids[y]); r.met = true; if (r.v < 20) r.v = 25; }
        }
      }
      const all = [...this.sims.values()];
      for (let k = 0; k < 40; k++) {
        const a = this.rng.pick(all), b = this.rng.pick(all);
        if (a === b || a.hh === b.hh || a.isBaby || b.isBaby) continue;
        const r = this.rel(a, b);
        r.met = true; r.v = clamp(r.v + this.rng.int(5, 35), -100, 100);
        S.revealTrait(this, a, b); S.revealTrait(this, b, a);
      }
    }

    addHousehold(name, lotId, funds, key) {
      const hh = { id: this.nextHH++, name, lot: lotId, funds: funds || 0, members: [], bills: [], royalties: [], key: key || null, visits: 0 };
      this.households.set(hh.id, hh);
      if (lotId >= 0) { this.lots[lotId].hh = hh.id; this.lots[lotId].sale = false; }
      return hh;
    }

    addSim(sim, hh) {
      sim.id = this.nextSimId++;
      this.sims.set(sim.id, sim);
      if (hh) { sim.hh = hh.id; hh.members.push(sim.id); }
      sim.ageLen = this.stageLength(sim.age);
      sim.ageDays = this.rng.int(0, Math.max(0, Math.floor(sim.ageLen * 0.6)));
      if (sim.age === 'child' || sim.age === 'teen') sim.school = { perf: 10, grade: 'C' };
      if (hh && hh.lot >= 0) this.placeAtHome(sim, hh);
      for (const n of NEED_KEYS) sim.needs[n] = 50 + this.rng.range(0, 40);
      return sim;
    }

    placeAtHome(sim, hh) {
      const lot = this.lots[hh.lot];
      const w = this.world;
      let p = null;
      if (lot.doorIn && w.walkable(lot.doorIn[0], lot.doorIn[1])) {
        p = w.nearestWalkable(lot.doorIn[0] + this.rng.int(-2, 2), lot.doorIn[1] + this.rng.int(-2, 2), 4, (x, y) => w.lotAt(x, y) === lot.id && w.indoor(x, y));
        if (!p) p = lot.doorIn;
      }
      if (!p) p = w.nearestWalkable(lot.x + (lot.w >> 1), lot.y + (lot.h >> 1), 10) || lot.curb;
      sim.x = p[0] + 0.5; sim.y = p[1] + 0.5; sim.lv = 0; sim.lot = w.lotAt(p[0], p[1]);
    }

    stageLength(age) {
      const L = LIFESPANS[this.opts.lifespan] || LIFESPANS.normal;
      const base = L.stages[age] || 10;
      if (age === 'elder') return base + this.rng.int(0, Math.ceil(base * 0.4));
      return base;
    }

    hh(sim) { return sim ? this.households.get(sim.hh) : null; }
    active() { return this.households.get(this.activeHH); }
    isActive(sim) { return !!sim && sim.hh === this.activeHH && this.activeHH > 0; }
    selected() { return this.sims.get(this.sel); }
    householdSize(sim) { const h = this.hh(sim); return h ? h.members.filter(id => { const s = this.sims.get(id); return s && !s.dead; }).length : 1; }
    householdOnLot(sim) {
      const h = this.hh(sim);
      if (!h) return [sim];
      return h.members.map(id => this.sims.get(id)).filter(s => s && !s.dead && s.lot === sim.lot && !s.hidden);
    }
    members(hh) { return hh ? hh.members.map(id => this.sims.get(id)).filter(s => s && !s.dead) : []; }

    famInv(hh) { if (!hh.inv) hh.inv = []; return hh.inv; }
    toFamily(sim, idx) {
      const hh = this.hh(sim), it = sim.inv[idx];
      if (!hh || !it || it.k === 'homework') return false;
      sim.inv.splice(idx, 1);
      this.famInv(hh).push(it);
      return true;
    }
    fromFamily(sim, idx) {
      const hh = this.hh(sim);
      if (!hh || sim.isBaby || sim.dead) return false;
      const inv = this.famInv(hh), it = inv[idx];
      if (!it) return false;
      inv.splice(idx, 1);
      sim.inv.push(it);
      return true;
    }
    famItemValue(it) {
      if (it.k !== 'obj' || !OBJECTS[it.t]) return 0;
      return Math.round((it.value !== undefined ? it.value : OBJECTS[it.t].price) * 0.7 * (it.broken ? 0.5 : 1));
    }
    sellFamilyItem(hh, idx) {
      const inv = this.famInv(hh), it = inv[idx];
      const v = it ? this.famItemValue(it) : 0;
      if (!it || it.k !== 'obj') return -1;
      inv.splice(idx, 1);
      hh.funds += v;
      return v;
    }

    relKey(a, b) { const x = Math.min(a.id, b.id), y = Math.max(a.id, b.id); return x + ':' + y; }
    rel(a, b) {
      const k = this.relKey(a, b);
      let r = this.rels.get(k);
      if (!r) { r = { v: 0, met: false, flags: {}, known: {}, last: -1e9 }; this.rels.set(k, r); }
      return r;
    }
    peekRel(a, b) { return this.rels.get(this.relKey(a, b)) || null; }
    meet(a, b) {
      const r = this.rel(a, b);
      if (r.met) return;
      r.met = true;
      a.stat('met'); b.stat('met');
      this.note(a, { k: 'meet', t: b.id }); this.note(b, { k: 'meet', t: a.id });
    }
    relAdd(a, b, dv) {
      const r = this.rel(a, b);
      const before = r.v;
      r.v = clamp(r.v + dv, -100, 100);
      if (dv > 0 && !r.met) this.meet(a, b);
      r.last = this.t;
      this.lastSoc.set(this.relKey(a, b), this.t);
      if (before < 35 && r.v >= 35 || before < 65 && r.v >= 65 || before > -60 && r.v <= -60) this.checkFriendship(a, b);
    }
    lastSocialWith(a, b) { const t = this.lastSoc.get(this.relKey(a, b)); return t === undefined ? 1e9 : this.t - t; }
    checkFriendship(a, b) {
      const r = this.rel(a, b);
      const st = r.v <= -60 ? 'enemy' : r.v >= 65 ? 'good_friend' : r.v >= 35 ? 'friend' : null;
      if (!st || r['st_' + st]) return;
      r['st_' + st] = true;
      this.note(a, { k: 'rel', t: b.id, st }); this.note(b, { k: 'rel', t: a.id, st });
      if (st === 'friend' && (this.isActive(a) || this.isActive(b))) this.notify(a.first + ' и ' + b.first + ' подружились.', { sim: this.isActive(a) ? a : b, icon: 'm_heart', minor: true });
      if (st === 'enemy' && (this.isActive(a) || this.isActive(b))) this.notify(a.first + ' и ' + b.first + ' теперь враги.', { sim: this.isActive(a) ? a : b, icon: 'm_angry', minor: true });
    }
    relLabel(a, b) {
      const fam = this.familyLabel(a, b);
      const r = this.peekRel(a, b);
      if (r && r.flags.married) return S.genderize(b, 'Муж', 'Жена');
      if (fam) return fam;
      if (!r || !r.met) return 'Незнакомец';
      if (r.flags.engaged) return S.genderize(b, 'Жених', 'Невеста');
      if (r.flags.steady) return S.genderize(b, 'Парень', 'Девушка');
      if (r.flags.romance) return 'Романтический интерес';
      if (r.flags.ex) return S.genderize(b, 'Бывший', 'Бывшая');
      if (r.flags.bff) return 'Лучший друг';
      if (r.v <= -60) return 'Враг';
      if (r.v <= -20) return 'Неприязнь';
      if (r.v >= 65) return 'Хороший друг';
      if (r.v >= 35) return 'Друг';
      return 'Знакомый';
    }
    familyLabel(a, b) {
      const pa = a.parents || [], pb = b.parents || [];
      if (pb.includes(a.id)) return S.genderize(b, 'Сын', 'Дочь');
      if (pa.includes(b.id)) return S.genderize(b, 'Отец', 'Мать');
      if (pa.length && pa.some(p => pb.includes(p))) return S.genderize(b, 'Брат', 'Сестра');
      for (const p of pa) { const ps = this.sims.get(p); if (ps && (ps.parents || []).includes(b.id)) return S.genderize(b, 'Дедушка', 'Бабушка'); }
      for (const p of pb) { const ps = this.sims.get(p); if (ps && (ps.parents || []).includes(a.id)) return S.genderize(b, 'Внук', 'Внучка'); }
      return null;
    }
    isFamily(a, b) { const l = this.familyLabel(a, b); return !!l; }
    partnerOf(sim) {
      for (const [k, r] of this.rels) {
        if (!(r.flags.steady || r.flags.engaged || r.flags.married)) continue;
        const [x, y] = k.split(':').map(Number);
        if (x === sim.id) return y;
        if (y === sim.id) return x;
      }
      return 0;
    }
    spouseOf(sim) {
      for (const [k, r] of this.rels) {
        if (!r.flags.married) continue;
        const [x, y] = k.split(':').map(Number);
        if (x === sim.id) return this.sims.get(y);
        if (y === sim.id) return this.sims.get(x);
      }
      return null;
    }

    queue(sim, key, target, opt) {
      const A = ACTS[key];
      if (!A || !sim || sim.dead) return null;
      opt = Object.assign({}, opt || {});
      if (A.test) {
        let r;
        try { r = A.test(sim, target, this); } catch (e) { r = 'Сейчас нельзя'; }
        if (r !== true) { if (opt.user && typeof r === 'string') this.tip(sim, r); return null; }
      }
      const act = new S.Action(this, sim, A, target, opt);
      if (opt.user) {
        const cur = sim.queue[0];
        sim.queue = sim.queue.filter((q, i) => i === 0 || !q.auto);
        if (cur && (cur.auto || (cur.def.soft && sim.queue.length === 1))) cur.cancel();
        if (sim.queue.length >= 8) return null;
        sim.idleT = 0;
      }
      sim.queue.push(act);
      return act;
    }
    queueFront(sim, key, target, opt) {
      const A = ACTS[key];
      if (!A || !sim || sim.dead) return null;
      opt = opt || {};
      const act = new S.Action(this, sim, A, target, opt);
      if (sim.queue.length) {
        if (!opt.quiet) sim.queue[0].cancel();
        sim.queue.splice(1, 0, act);
      } else sim.queue.push(act);
      return act;
    }
    cancelAction(sim, act) {
      if (!act) return;
      if (sim.queue[0] === act) act.cancel();
      else sim.queue = sim.queue.filter(q => q !== act);
    }
    clearQueue(sim) {
      for (const a of sim.queue) a.cancel();
      sim.queue = sim.queue.slice(0, 1);
    }
    hardStop(sim) {
      for (const a of sim.queue) { a.cancelled = true; a.finish(); }
      sim.queue = [];
      sim.path = null;
    }

    engage(target, actor, dur) {
      target.engage = { by: actor.id, until: this.t + dur, anim: 'listen' };
      if (!target.seatOf && !target.lieH) target.anim = 'listen';
    }
    disengage(target) { target.engage = null; }

    update(realSec) {
      const mult = SPEEDS[this.speed] || 0;
      if (!mult) return;
      let dt = Math.min(realSec, 0.25) * mult;
      while (dt > 1e-6) {
        const d = Math.min(0.5, dt);
        this.step(d);
        dt -= d;
      }
    }

    step(dt) {
      this.t += dt;
      const hour = Math.floor(this.t / 60);
      while (this.lastHour < hour) { this.lastHour++; this.onHour(this.lastHour); }
      for (const sim of this.sims.values()) this.simTick(sim, dt);
      this.updateCars(dt);
      this.lifeTick(dt);
      if (this.fxList.length) this.fxList = this.fxList.filter(f => f.until > this.t);
    }

    simTick(sim, dt) {
      if (sim.dead) return;
      this.needsTick(sim, dt);
      sim.animT += dt;
      if (sim.bubble && sim.bubble.until < this.t) sim.bubble = null;
      if (sim.balloon && sim.balloon.until < this.t) sim.balloon = null;
      if (sim.engage) {
        if (sim.engage.until > this.t && this.sims.get(sim.engage.by) && !this.sims.get(sim.engage.by).dead) return;
        sim.engage = null;
      }
      if (sim.carriedBy) {
        const c = this.sims.get(sim.carriedBy);
        if (!c || c.dead) { sim.carriedBy = null; return; }
        sim.x = c.x + Math.cos(c.face) * 0.2; sim.y = c.y + Math.sin(c.face) * 0.2; sim.lot = c.lot; sim.face = c.face; sim.hidden = c.hidden;
        return;
      }
      if (sim.isBaby) { sim.anim = sim.inCrib ? 'baby_crib' : 'baby'; return; }
      const cur = sim.queue[0];
      if (cur) {
        sim.idleT = 0;
        if (sim.carry && !cur.def.care && !cur.gen) this.releaseCarry(sim);
        if (cur.step(dt)) {
          const i = sim.queue.indexOf(cur);
          if (i >= 0) sim.queue.splice(i, 1);
        }
        return;
      }
      if (sim.anim !== 'idle' && sim.anim !== 'dead' && !sim.seatOf) sim.anim = 'idle';
      sim.idleT += dt;
      const wait = sim.npc || !this.isActive(sim) ? 1 : 2;
      if (sim.idleT < wait) return;
      sim.idleT = -this.rng.range(0, 1.5);
      if ((sim.failN || 0) >= 6) { this.rescue(sim); sim.failN = 0; }
      if (sim.isToddler && this.hh(sim) && sim.lot !== this.hh(sim).lot && this.hh(sim).lot >= 0) { this.queue(sim, 'go_home', sim, {}); return; }
      if (this.planNpc(sim)) return;
      const c = S.decide(this, sim);
      if (c) this.queue(sim, c.key, c.target, Object.assign({}, c.opt || {}));
      else if (this.rng.chance(0.3)) this.wander(sim);
    }

    releaseCarry(sim) {
      const baby = this.sims.get(sim.carry);
      if (!baby) { sim.carry = null; sim.prop = null; return; }
      if (baby.isBaby) {
        const crib = this.nearestObj(sim, o => D(o.t).crib && !o.use.baby, 40);
        if (crib) { this.putInCrib(sim, baby, crib); return; }
      }
      this.putDown(sim);
    }

    rescue(sim) {
      const w = this.world;
      const lot = this.lots[sim.lot];
      const hh = this.hh(sim);
      const home = hh && hh.lot >= 0 ? this.lots[hh.lot] : null;
      const t = (lot && (lot.doorIn || lot.entrance)) || (home && (home.doorIn || home.entrance));
      const p = t ? (w.walkable(t[0], t[1]) ? t : w.nearestWalkable(t[0], t[1], 5)) : w.nearestWalkable(sim.x, sim.y, 8);
      if (p) { sim.x = p[0] + 0.5; sim.y = p[1] + 0.5; sim.lv = p[2] || 0; sim.zOff = 0; sim.lot = w.lotAt(p[0], p[1]); }
    }

    wander(sim) {
      const w = this.world;
      const lot = sim.lot;
      const p = w.nearestWalkable(sim.x + this.rng.range(-5, 5), sim.y + this.rng.range(-5, 5), 3, (x, y) => w.lotAt(x, y) === lot, sim.lv || 0);
      if (p) this.queue(sim, 'go_here', p, {});
    }

    simsNear(sim, r) {
      const out = [];
      for (const s of this.sims.values()) {
        if (s === sim || s.dead || s.hidden) continue;
        if ((s.lv || 0) !== (sim.lv || 0)) continue;
        if (Math.abs(s.x - sim.x) > r || Math.abs(s.y - sim.y) > r) continue;
        if (Math.hypot(s.x - sim.x, s.y - sim.y) <= r) out.push(s);
      }
      return out;
    }

    nearestObj(sim, pred, radius, from) {
      const w = this.world;
      let best = null, bd = 1e9;
      const ox = from ? from.x : sim.x, oy = from ? from.y : sim.y;
      const lot = sim.lot;
      for (const ob of w.objects.values()) {
        if (Math.abs(ob.x - ox) > radius || Math.abs(ob.y - oy) > radius) continue;
        if (lot >= 0 && ob.lot !== lot && ob.lot >= 0) continue;
        if (!pred(ob)) continue;
        const d = Math.hypot(ob.x + 0.5 - ox, ob.y + 0.5 - oy) + Math.abs((ob.lv || 0) - ((from || sim).lv || 0)) * 8;
        if (d < bd && d <= radius) { bd = d; best = ob; }
      }
      return best;
    }

    freeSurfaceNear(x, y, r, lv) {
      const w = this.world;
      lv = lv || 0;
      let best = null, bd = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const tx = x + dx, ty = y + dy;
        if (!w.inb(tx, ty)) continue;
        const base = w.objAt(tx, ty, 'occ', lv);
        if (!base || !D(base.t).surface || D(base.t).dishwasher) continue;
        if (w.layer.surf[w.li(tx, ty, lv)]) continue;
        if (!this.surfaceReachable(base, tx, ty)) continue;
        if (w.roomAt(tx, ty, lv) !== w.roomAt(x, y, lv) && w.indoor(x, y, lv)) continue;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = [tx, ty]; }
      }
      return best;
    }

    findDiningSeat(sim) {
      const w = this.world;
      let best = null, bd = 1e9;
      for (const ob of w.objects.values()) {
        const d = D(ob.t);
        if (!d.seat || ob.lot !== sim.lot) continue;
        if (Math.abs(ob.x - sim.x) > 18 || Math.abs(ob.y - sim.y) > 18) continue;
        if (ob.t === 'toilet' || ob.t === 'toilet_lux' || ob.t === 'chess') continue;
        if (ob.t === 'picnic_table') {
          const spots = S.seatSpots(ob);
          const free = spots.findIndex(s => !ob.use['seat' + s.i]);
          if (free < 0) continue;
          const dist = Math.hypot(ob.x - sim.x, ob.y - sim.y);
          if (dist < bd) { bd = dist; best = { ob, spot: free, table: null }; }
          continue;
        }
        if (S.footprint(d, ob.r)[0] * S.footprint(d, ob.r)[1] !== 1) continue;
        if (ob.use.seat0 && ob.use.seat0 !== sim.id) continue;
        const tx = ob.x + DX[ob.r], ty = ob.y + DY[ob.r], ol = ob.lv || 0;
        const table = w.objAt(tx, ty, 'occ', ol);
        let score = Math.hypot(ob.x - sim.x, ob.y - sim.y) + Math.abs(ol - (sim.lv || 0)) * 15;
        let tile = null;
        if (table && D(table.t).table) {
          const si = w.layer.surf[w.li(tx, ty, ol)];
          if (si) { const it = w.objects.get(si); if (it && it.t !== 'flowers') continue; if (it && it.t === 'flowers') score += 1; }
          else tile = [tx, ty];
        } else if (D(ob.t).seat) score += 12;
        if (score < bd) { bd = score; best = { ob, spot: 0, table: tile }; }
      }
      return best && bd < 40 ? best : null;
    }

    surfaceReachable(base, tx, ty) {
      const w = this.world;
      const d = D(base.t);
      const lv = base.lv || 0;
      if (d.table || d.desk || base.t === 'table_end' || base.t === 'table_coffee' || base.t === 'picnic_table') {
        for (let k = 0; k < 4; k++) { const nx = tx + DX[k], ny = ty + DY[k]; if (w.walkable(nx, ny, lv) && w.edgeOpen(tx, ty, nx, ny, lv)) return true; }
        return false;
      }
      const fx = tx + DX[base.r], fy = ty + DY[base.r];
      return w.walkable(fx, fy, lv) && w.edgeOpen(tx, ty, fx, fy, lv);
    }

    dropDirtyPlate(sim) {
      const w = this.world;
      const lv = sim.lv || 0;
      const p = this.freeSurfaceNear(Math.floor(sim.x), Math.floor(sim.y), 4, lv);
      if (p) { w.placeObject('dirty_plate', p[0], p[1], 0, { lot: w.lotAt(p[0], p[1]), lv }); this.dirtyObjs(); }
    }
    platterEmpty(pl) {
      const w = this.world;
      if (!w.objects.has(pl.id)) return;
      const x = pl.x, y = pl.y, lv = pl.lv || 0;
      w.removeObject(pl.id);
      w.placeObject('dirty_plate', x, y, 0, { lot: w.lotAt(x, y), lv });
      this.dirtyObjs();
    }
    callToMeal(sim, platter) {
      for (const s of this.householdOnLot(sim).concat(this.simsNear(sim, 20).filter(v => v.visitor && v.lot === sim.lot))) {
        if (s === sim || s.isBaby || s.isToddler || s.inside) continue;
        if (s.needs.hunger > 85) continue;
        if (s.queue.some(q => q.user)) continue;
        if (s.queue[0] && s.queue[0].auto) s.queue[0].cancel();
        this.queue(s, 'serve_plate', platter, {});
      }
    }

    hasIngredient(sim, ing) {
      if (ing === 'fish') return sim.inv.some(i => i.k === 'fish');
      if (S.FISH[ing]) return sim.inv.some(i => i.k === 'fish' && i.f === ing);
      return sim.inv.some(i => i.k === 'produce' && i.p === ing);
    }
    useIngredient(sim, ing) {
      const idx = sim.inv.findIndex(i => ing === 'fish' ? i.k === 'fish' : S.FISH[ing] ? i.k === 'fish' && i.f === ing : i.k === 'produce' && i.p === ing);
      if (idx >= 0) sim.inv.splice(idx, 1);
    }
    ingredientName(ing) { return ing === 'fish' ? 'любая рыба' : S.FISH[ing] ? S.FISH[ing].name.toLowerCase() : S.PLANTS[ing] ? S.PLANTS[ing].name.toLowerCase() : ing; }

    spend(sim, amount, reason) {
      const hh = this.hh(sim);
      if (!hh) return true;
      if (hh.funds < amount) return false;
      hh.funds -= amount;
      if (this.isActive(sim) && amount >= 5) this.fx('money', sim, -amount);
      return true;
    }
    earn(sim, amount, reason, quiet) {
      const hh = this.hh(sim);
      if (!hh) return;
      hh.funds += amount;
      if (!quiet && this.isActive(sim)) this.fx('money', sim, amount);
      this.note(sim, { k: 'money', total: hh.funds });
    }

    dirtyObjs() { this.objVersion++; }
    lightsChanged() { this.lightVersion++; }
    fx(type, who, data) {
      const pos = who && who.x !== undefined ? { x: who.x, y: who.y, sim: who.id } : who;
      this.fxList.push({ type, x: pos ? pos.x : 0, y: pos ? pos.y : 0, sim: pos && pos.sim, data, t: this.t, until: this.t + (type === 'money' || type === 'text' || type === 'rel' ? 3 : 1.5) });
    }
    sound(name, sim) { if (this.hooks.sound) this.hooks.sound(name, sim); }
    notify(text, o) {
      o = o || {};
      if (o.sim && !this.isActive(o.sim) && !o.force) return null;
      const n = { id: this.noteId++, text, icon: o.icon || 'm_star', sim: o.sim ? o.sim.id : 0, t: this.t, actions: o.actions || null, minor: !!o.minor, kind: o.kind || null };
      this.notes.push(n);
      if (this.notes.length > 40) this.notes.shift();
      if (this.hooks.notify) this.hooks.notify(n);
      return n;
    }
    tip(sim, text) { if (!sim || this.isActive(sim)) { if (this.hooks.tip) this.hooks.tip(text, sim); } }

    noiseAt(sim) {
      const w = this.world;
      const lv = sim.lv || 0;
      const room = w.roomAt(Math.floor(sim.x), Math.floor(sim.y), lv);
      let n = 0;
      for (const ob of w.objects.values()) {
        if (!(ob.st.on || ob.st.play)) continue;
        if ((ob.lv || 0) !== lv || Math.abs(ob.x - sim.x) > 8 || Math.abs(ob.y - sim.y) > 8) continue;
        const [cx, cy] = w.center(ob);
        if (w.roomAt(Math.floor(cx - 0.01), Math.floor(cy - 0.01), lv) === room && (D(ob.t).tv || D(ob.t).stereo)) n++;
      }
      for (const s of this.simsNear(sim, 5)) if (s.anim === 'guitar' || s.anim === 'dance' || s.anim === 'cry' || (s.isBaby && s.crying)) n++;
      return n;
    }

    workoutMoods(sim, minutes) {
      if (minutes < 15) return;
      if (sim.has('athletic')) sim.addMood('workout_high', this.t);
      else if (sim.has('couch_potato')) sim.addMood('overexerted', this.t);
      else if (minutes > 90 && sim.skillLevel('athletic') < 5) sim.addMood('sore', this.t);
      sim.flags.lastWorkout = this.t;
    }

    simsOnLot(lotId) { return [...this.sims.values()].filter(s => !s.dead && s.lot === lotId && !s.hidden); }

    nearWater(sim, r) {
      const w = this.world;
      const x0 = Math.floor(sim.x), y0 = Math.floor(sim.y);
      let best = null, bd = 1e9;
      for (let dy = -r; dy <= r; dy += 1) for (let dx = -r; dx <= r; dx += 1) {
        const x = x0 + dx, y = y0 + dy;
        if (!w.walkable(x, y)) continue;
        let near = false;
        for (let k = 0; k < 4; k++) if (w.isWater(x + DX[k], y + DY[k])) near = true;
        if (!near) continue;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = [x, y]; }
      }
      return best;
    }

    roadTile(p) {
      const w = this.world;
      const ok = (x, y) => { const t = w.ter(x, y); return (t === TER.road || t === TER.bridge && w.road[w.idx(x, y)]) && w.inb(x, y); };
      if (ok(p[0], p[1])) return p;
      for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (ok(p[0] + dx, p[1] + dy)) return [p[0] + dx, p[1] + dy];
      return null;
    }
    roadPath(a, b) {
      const w = this.world;
      const s = this.roadTile(a), e = this.roadTile(b);
      if (!s || !e) return null;
      const W = w.W, H = w.H;
      const isRoad = (x, y) => { if (!w.inb(x, y)) return false; const t = w.terrain[y * W + x]; return t === TER.road || (t === TER.bridge && w.road[y * W + x]); };
      const start = s[1] * W + s[0], goal = e[1] * W + e[0];
      const from = new Int32Array(W * H).fill(-2);
      const q = [start];
      from[start] = -1;
      for (let h = 0; h < q.length; h++) {
        const c = q[h];
        if (c === goal) break;
        const x = c % W, y = (c / W) | 0;
        for (let k = 0; k < 4; k++) {
          const nx = x + DX[k], ny = y + DY[k];
          if (!isRoad(nx, ny)) continue;
          const ni = ny * W + nx;
          if (from[ni] !== -2) continue;
          from[ni] = c;
          q.push(ni);
        }
      }
      if (from[goal] === -2) return null;
      const path = [];
      for (let c = goal; c >= 0; c = from[c]) path.push([c % W, (c / W) | 0]);
      path.reverse();
      return path;
    }

    spawnCar(sim, fromLane, toLane, kind) {
      const main = this.roadPath(fromLane, toLane);
      if (!main || main.length < 2) return null;
      const w = this.world;
      let approach = null;
      const s = main[0];
      for (let tries = 0; tries < 6 && !approach; tries++) {
        const back = this.roadTile([s[0] + this.rng.int(-14, 14), s[1] + this.rng.int(-14, 14)]);
        if (back) { const p = this.roadPath(back, s); if (p && p.length > 4) approach = p; }
      }
      if (!approach) approach = [s];
      const car = { id: this.nextCar++, kind: kind || 'car', color: kind === 'carpool' ? '#e8c832' : kind === 'bus' ? '#e8a020' : kind === 'taxi' ? '#e8c832' : this.rng.pick(CAR_COLORS), stage: 'arrive', path: approach, i: 0, x: approach[0][0] + 0.5, y: approach[0][1] + 0.5, heading: 0, sim: sim.id, main, boarded: false, arrived: false, leave: false, wait: 0 };
      this.vehicles.push(car);
      return car;
    }
    removeCar(car) { this.vehicles = this.vehicles.filter(c => c !== car); }
    updateCars(dt) {
      for (const car of this.vehicles.slice()) {
        const speed = car.kind === 'bus' ? 7 : 9;
        const sim = this.sims.get(car.sim);
        if (car.stage === 'arrive' || car.stage === 'drive' || car.stage === 'leave') {
          let step = speed * dt;
          while (step > 0 && car.i < car.path.length - 1) {
            const [nx, ny] = car.path[car.i + 1];
            const tx = nx + 0.5, ty = ny + 0.5;
            const dx = tx - car.x, dy = ty - car.y, d = Math.hypot(dx, dy);
            if (d > 0.001) car.heading = Math.atan2(dy, dx);
            if (d <= step) { car.x = tx; car.y = ty; car.i++; step -= d; } else { car.x += dx / d * step; car.y += dy / d * step; step = 0; }
          }
          if (car.i >= car.path.length - 1) {
            if (car.stage === 'arrive') { car.stage = 'wait'; if (sim && this.isActive(sim)) this.sound('horn', sim); }
            else if (car.stage === 'drive') { car.stage = 'drop'; car.arrived = true; }
            else if (car.stage === 'leave') { this.removeCar(car); continue; }
          }
          if (car.stage === 'drive' && sim) { sim.x = car.x; sim.y = car.y; sim.lot = this.world.lotAt(Math.floor(car.x), Math.floor(car.y)); }
        } else if (car.stage === 'wait') {
          car.wait += dt;
          if (sim && !sim.dead && Math.hypot(sim.x - car.x, sim.y - car.y) < 3.2) { car.boarded = true; car.stage = 'drive'; car.path = car.main; car.i = 0; }
          else if (car.wait > 90 || !sim || sim.dead) { car.stage = 'leave'; car.path = [[Math.floor(car.x), Math.floor(car.y)]]; car.i = 0; this.removeCar(car); }
        } else if (car.stage === 'drop') {
          if (car.leave) {
            const ahead = this.roadTile([Math.floor(car.x + Math.cos(car.heading) * 14), Math.floor(car.y + Math.sin(car.heading) * 14)]);
            const p = ahead ? this.roadPath([Math.floor(car.x), Math.floor(car.y)], ahead) : null;
            if (p && p.length > 2) { car.stage = 'leave'; car.path = p; car.i = 0; } else this.removeCar(car);
          }
        }
      }
    }

    onArriveLot(sim, lotId) {
      if (lotId === undefined || lotId < 0) return;
      const lot = this.lots[lotId];
      if (!lot) return;
      sim.lot = lotId;
      if (lot.kind !== 'home') this.note(sim, { k: 'visit', lot: lot.key });
    }

    menuFor(sim, target) {
      const out = [];
      if (!sim || !target) return out;
      const addAct = (key, tgt) => {
        const A = ACTS[key];
        if (!A || A.hidden) return;
        let t;
        try { t = A.test ? A.test(sim, tgt, this) : true; } catch (e) { t = false; }
        if (t === null || t === false || t === undefined) return;
        const label = typeof A.name === 'function' ? A.name(sim, tgt, this) : A.name;
        const entry = { label, key, target: tgt, disabled: t === true ? null : t, icon: A.icon };
        if (A.menu && t === true) {
          const sub = A.menu(sim, tgt, this) || [];
          if (!sub.length) return;
          entry.sub = sub.map(e => ({ label: e.label, key, target: tgt, opt: e.opt, disabled: e.disabled || null, sub: e.sub ? e.sub.map(z => ({ label: z.label, key, target: tgt, opt: z.opt })) : null }));
        }
        out.push(entry);
      };
      if (target.kind === 'obj') {
        const ob = target.ob;
        for (const key of S.objectActs(ob)) addAct(key, ob);
      } else if (target.kind === 'sim') {
        const o = target.sim;
        if (o === sim) {
          for (const key of ['self_outfit', 'phone', 'go_work', 'go_school', 'skip_work', 'do_homework', 'read_inv', 'guitar_inv', 'tips_inv', 'jog', 'talk_self', 'evil_laugh', 'go_home']) addAct(key, sim);
        } else if (o.isBaby || o.isToddler) {
          for (const key of ['pick_up', 'put_down', 'feed_baby', 'change', 'cuddle', 'to_crib']) addAct(key, o);
          for (const e of S.socialMenu(this, sim, o)) out.push(e);
        } else {
          for (const e of S.socialMenu(this, sim, o)) out.push(e);
        }
      } else if (target.kind === 'tile') {
        for (const key of target.tile[2] ? ['go_here', 'run_here'] : ['go_here', 'run_here', 'swim', 'fish_here', 'plant_seed']) addAct(key, target.tile);
      } else if (target.kind === 'lot') {
        addAct('visit_lot', target.lot);
      }
      return out;
    }
  }

  Object.assign(S, { Game, SPEEDS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
