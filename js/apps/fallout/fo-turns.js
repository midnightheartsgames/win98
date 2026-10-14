(function (FO) {
  'use strict';

  const D = FO.DAM;
  const M = FO.MANEUVER;
  const ROUND_TICKS = 5;
  const STANDUP_AP = 3;
  const MSG = { NEED_AP: 100, NO_AMMO: 101, RANGE: 102, CANT_END: 103, BLOCKED: 104, ARM: 105, ARMS: 106 };
  const EXP_LINE = 621;
  const EXP_PRAISE = 622;
  const EXP_UNHURT = 626;
  const OUTLINE_RED = [248, 0, 0];
  const OUTLINE_GREEN = [0, 248, 0];
  const CALLED = { ART: 118, X: 108, Y: 20, PIC_X: 128, PIC_Y: 31, CANCEL_X: 170, CANCEL_Y: 268, ROWS: [122, 188, 252, 316], LEFT: [0, 6, 2, 4], RIGHT: [3, 7, 1, 5] };

  const rnd = (a, b) => FO.combatRand(a, Math.max(a, b));
  const team = o => (o && o.critter ? o.critter.team | 0 : -1);
  const alive = o => !!o && !!o.critter && !(o.critter.results & D.DEAD);

  class Combat {
    constructor(play) {
      this.p = play;
      this.w = play.w;
      this.g = play.g;
      this.list = [];
      this.com = 0;
      this.noncom = 0;
      this.active = false;
      this.exp = 0;
      this.gcsd = null;
      this.current = null;
      this.freeMove = 0;
      this.waiters = [];
      this.input = null;
      this.acting = false;
      this.ending = false;
      this.endingGuy = null;
      this.elev = 0;
      this.combatMsg = play.combatMsg || new Map();
      this.combatAiMsg = play.combatAiMsg || new Map();
    }

    wait() {
      return new Promise(resolve => this.waiters.push(resolve));
    }

    tick() {
      if (this.waiters.length && this.w.anim.combatIdle()) {
        const list = this.waiters;
        this.waiters = [];
        for (const r of list) r();
      }
    }

    runScript(o, action, opts) {
      const sc = this.p.sc;
      if (!sc || !o || !o.script || action === null) return null;
      return sc.exec(o.script, action, opts || {});
    }

    combatProc(o, fixed) {
      return this.runScript(o, FO.ACT.COMBAT, { fixed });
    }

    dropScript(o) {
      const sc = this.p.sc;
      const st = this.w.map;
      if (sc) sc.removeTimers(o);
      if (!o.script) return;
      o.script.dead = true;
      if (st && st.scriptList) {
        const i = st.scriptList.indexOf(o.script);
        if (i >= 0) st.scriptList.splice(i, 1);
      }
    }

    knockOut(o, ticks) {
      if (this.p.sc) this.p.sc.addEvent(o, Math.max(1, ticks), 'knockout');
    }

    clearEvents(o) {
      if (this.p.sc) this.p.sc.removeEvents(o);
    }

    active_() {
      return this.list.slice(0, this.com);
    }

    async attack(attacker, defender, hitMode, location) {
      const w = this.w;
      let mode = hitMode;
      if (mode === FO.HIT_MODE.PUNCH && rnd(1, 4) === 1 && this.g.art.exists(FO.fid(FO.ART.CRITTER, FO.fidIndex(attacker.fid), FO.ANIM.KICK, FO.fidWeapon(attacker.fid)))) mode = FO.HIT_MODE.KICK;
      const ctx = FO.newAttack(attacker, defender, mode, location);
      const gcsd = this.gcsd;
      ctx.bonus = gcsd ? gcsd.accuracy | 0 : 0;
      if (FO.computeAttack(w, ctx) === -1) return -1;
      if (gcsd) {
        ctx.defenderDamage += gcsd.damageBonus | 0;
        if (ctx.defenderDamage < (gcsd.min | 0)) ctx.defenderDamage = gcsd.min | 0;
        if (ctx.defenderDamage > gcsd.max) ctx.defenderDamage = gcsd.max;
        if (gcsd.changeFlags) ctx.defenderFlags = gcsd.targetResults | 0;
      }
      let aimed = location !== FO.HIT_LOC.TORSO && location !== FO.HIT_LOC.UNCALLED;
      if (!aimed && attacker.dude) aimed = !!this.p.iface.attackMode().aimed;
      const cost = FO.apCost(attacker, ctx.hitMode, aimed);
      await FO.attackArt(this, ctx);
      if (FO.attackSequence(this, ctx) === -1) return -1;
      attacker.critter.ap = Math.max(0, attacker.critter.ap - cost);
      if (attacker.dude) FO.setWhoHitMe(attacker, defender);
      await this.wait();
      const weapon = FO.weaponFor(attacker, ctx.hitMode);
      if (weapon && FO.ammoMax(weapon) > 0) weapon.ammo = Math.max(0, (weapon.ammo | 0) - ctx.ammo);
      FO.combatDisplay(this, ctx);
      FO.applyAttack(this, ctx, true);
      const r = attacker.critter.results;
      if ((r & (D.KNOCKED_OUT | D.KNOCKED_DOWN)) && !(r & (D.KNOCKED_OUT | D.DEAD | D.LOSE_TURN))) await this.standUp(attacker);
      if (this.p.iface.refreshItems) this.p.iface.refreshItems();
      return 0;
    }

    async standUp(o) {
      const c = o.critter;
      c.ap = Math.max(0, c.ap - STANDUP_AP);
      const anim = FO.fidAnim(o.fid) === FO.ANIM.FALL_BACK ? FO.ANIM.BACK_TO_STANDING : FO.ANIM.PRONE_TO_STANDING;
      c.results &= ~D.KNOCKED_DOWN;
      this.w.anim.runCombat([{ kind: 'anim', obj: o, code: anim }]);
      await this.wait();
    }

    begin(attacker) {
      const w = this.w;
      w.anim.stopAll();
      this.elev = w.elev;
      if (this.active) return;
      this.exp = 0;
      this.list = (w.map.byElev[w.elev] || []).filter(o => FO.pidType(o.pid) === FO.PID.CRITTER && o.critter);
      this.list.forEach((o, i) => {
        const c = o.critter;
        c.damageLastTurn = 0;
        c.whoHitMe = null;
        c.maneuver = (c.maneuver | 0) & M.ENGAGING;
        c.ap = 0;
        o.cid = i;
      });
      this.com = 0;
      this.noncom = this.list.length;
      this.active = true;
      this.ending = false;
      this.endingGuy = null;
      w.inCombat = true;
      const friendly = FO.perkRank(w.dude, FO.PERK.FRIENDLY_FOE) > 0;
      for (const o of this.list) {
        o.outlineColor = friendly && team(o) === team(w.dude) ? OUTLINE_GREEN : OUTLINE_RED;
        o.outline = 0;
      }
      this.current = attacker || null;
      this.p.cursor = 'move';
    }

    sequenceInit(attacker, defender) {
      const w = this.w;
      let n = 0;
      const front = o => {
        const i = this.list.indexOf(o);
        if (i < 0) return;
        [this.list[n], this.list[i]] = [this.list[i], this.list[n]];
        n++;
      };
      if (attacker) front(attacker);
      if (defender && defender !== attacker) front(defender);
      if (attacker !== w.dude && defender !== w.dude) front(w.dude);
      this.com = n;
      this.noncom -= n;
      if (attacker) FO.setWhoHitMe(attacker, defender);
      if (defender) FO.setWhoHitMe(defender, attacker);
    }

    async addNoncoms() {
      const end = this.com + this.noncom;
      for (let i = this.com; i < end; i++) {
        const o = this.list[i];
        if (!FO.aiWantToJoin(this, o)) continue;
        o.critter.maneuver = 0;
        [this.list[i], this.list[this.com]] = [this.list[this.com], this.list[i]];
        this.com++;
        this.noncom--;
        if (!o.dude) await this.turn(o, false);
        if (!this.active) return;
      }
    }

    async sequence() {
      await this.addNoncoms();
      if (!this.active) return;
      let count = this.com;
      for (let i = 0; i < count; i++) {
        const o = this.list[i];
        if (!(o.critter.results & D.DEAD)) continue;
        const tail = this.noncom + count;
        this.list[i] = this.list[count - 1];
        this.list[count - 1] = this.list[tail - 1];
        this.list[tail - 1] = o;
        count--;
        i--;
      }
      for (let i = 0; i < count; i++) {
        const o = this.list[i];
        if (o.dude) continue;
        if (!(o.critter.results & D.KNOCKED_OUT) && o.critter.maneuver !== M.DISENGAGING) continue;
        o.critter.maneuver &= ~M.ENGAGING;
        this.noncom++;
        [this.list[i], this.list[count - 1]] = [this.list[count - 1], this.list[i]];
        count--;
        i--;
      }
      const head = this.list.slice(0, count).sort((a, b) => {
        const sa = FO.statValue(a, FO.STAT.SEQUENCE);
        const sb = FO.statValue(b, FO.STAT.SEQUENCE);
        if (sa !== sb) return sb - sa;
        return FO.statValue(b, FO.STAT.LK) - FO.statValue(a, FO.STAT.LK);
      });
      this.list.splice(0, count, ...head);
      this.com = count;
      this.p.passTime(ROUND_TICKS, false);
    }

    shouldEnd() {
      const dude = this.w.dude;
      if (this.com <= 1) return true;
      const act = this.active_();
      if (!act.includes(dude)) return true;
      let n = 0;
      for (const o of act) {
        if (team(o) !== team(dude)) break;
        const h = FO.whoHitMe(o);
        if (h && team(h) === team(dude)) break;
        n++;
      }
      return n === this.com;
    }

    async turn(o, resumed) {
      const w = this.w;
      const p = this.p;
      const c = o.critter;
      this.current = o;
      if (c.results & (D.KNOCKED_OUT | D.DEAD | D.LOSE_TURN)) {
        c.results &= ~D.LOSE_TURN;
      } else {
        if (!resumed) c.ap = FO.statValue(o, FO.STAT.MAX_AP) + (this.gcsd ? this.gcsd.apBonus | 0 : 0);
        if (o.dude) this.freeMove = resumed ? this.resumeFreeMove | 0 : 2 * FO.perkRank(o, FO.PERK.BONUS_MOVE);
        const s = this.combatProc(o, 4);
        if (!(s && s.overrides) && this.active) {
          if (!resumed && FO.isProne(o)) await this.standUp(o);
          if (o.dude) {
            if (this.gcsd && this.gcsd.defender) await this.attackThis(this.gcsd.defender, true);
            const r = await this.dudeInput();
            p.cursor = 'move';
            this.setOutlines(false);
            if (r === -1) {
              c.damageLastTurn = 0;
              this.freeMove = 0;
              return -1;
            }
          } else {
            await FO.combatAi(this, o, this.gcsd ? this.gcsd.defender : null);
          }
          await this.wait();
        }
      }
      c.damageLastTurn = 0;
      if (!alive(w.dude)) return -1;
      if (o.dude && this.elev !== w.dude.elev) return -1;
      this.freeMove = 0;
      return 0;
    }

    dudeTurn() {
      return !!this.input;
    }

    canAct() {
      return !!this.input && !this.acting && !this.p.busy;
    }

    dudeInput() {
      const d = this.w.dude;
      return new Promise(resolve => {
        this.input = { resolve };
        this.p.iface.refreshItems();
        this.checkInput(d);
      });
    }

    finishInput(code) {
      const input = this.input;
      if (!input) return;
      this.input = null;
      input.resolve(code);
    }

    checkInput() {
      const d = this.w.dude;
      if (!this.input || this.acting) return;
      if (this.ending || !this.active) {
        this.finishInput(-1);
        return;
      }
      if ((d.critter.results & (D.KNOCKED_OUT | D.DEAD | D.LOSE_TURN)) || d.critter.ap <= 0) this.finishInput(0);
    }

    async act(fn) {
      if (!this.canAct()) return false;
      this.acting = true;
      try {
        await fn();
        await this.wait();
      } finally {
        this.acting = false;
      }
      this.checkInput();
      return true;
    }

    endTurn() {
      if (this.canAct()) this.finishInput(0);
    }

    requestEnd() {
      if (!this.canAct()) return;
      const w = this.w;
      const dude = w.dude;
      if (this.elev !== dude.elev) {
        this.ending = true;
        this.finishInput(-1);
        return;
      }
      const considered = o => o !== dude && (team(o) !== team(dude) || (FO.whoHitMe(o) && team(FO.whoHitMe(o)) === team(o)));
      for (const o of this.active_()) {
        if (considered(o) && !FO.aiWantToStop(this, o)) {
          this.p.say(this.text(MSG.CANT_END));
          return;
        }
      }
      for (const o of this.list.slice(0, this.com + this.noncom)) {
        if (considered(o) && FO.aiWantToJoin(this, o)) {
          this.p.say(this.text(MSG.CANT_END));
          return;
        }
      }
      this.ending = true;
      this.finishInput(-1);
    }

    terminate() {
      this.ending = true;
      this.finishInput(-1);
    }

    text(id) {
      const e = this.combatMsg.get(id);
      return e ? e.text : '';
    }

    badShotMessage(r, hitMode, aimed) {
      const B = FO.BAD_SHOT;
      const p = this.p;
      if (r === B.NO_AMMO) {
        p.say(this.text(MSG.NO_AMMO));
        FO.uiSound(this.g, FO.sfxWeapon(this.g, FO.SFX_WEAPON.OUT_OF_AMMO, FO.weaponFor(this.w.dude, hitMode), hitMode, null));
      }
      else if (r === B.OUT_OF_RANGE) p.say(this.text(MSG.RANGE));
      else if (r === B.NO_AP) p.say(this.text(MSG.NEED_AP).replace('%d', FO.apCost(this.w.dude, hitMode, aimed)));
      else if (r === B.BLOCKED) p.say(this.text(MSG.BLOCKED));
      else if (r === B.ARM_CRIPPLED) p.say(this.text(MSG.ARM));
      else if (r === B.BOTH_ARMS) p.say(this.text(MSG.ARMS));
    }

    async attackThis(target, opening) {
      const w = this.w;
      const d = w.dude;
      if (!target) return;
      const mode = this.p.iface.attackMode();
      if (mode.hitMode < 0) return;
      const r = FO.badShot(w, d, target, mode.hitMode, mode.aimed);
      if (r !== FO.BAD_SHOT.OK) {
        this.badShotMessage(r, mode.hitMode, mode.aimed);
        return;
      }
      if (!this.active) {
        this.p.startCombat({ attacker: d, defender: target, apBonus: 0, accuracy: 0, damageBonus: 0, min: 0, max: 0x7FFFFFFF, changeFlags: 0 });
        return;
      }
      let loc = FO.HIT_LOC.UNCALLED;
      if (mode.aimed) {
        loc = await this.calledShot(target, mode.hitMode);
        if (loc < 0) return;
      }
      const run = () => this.attack(d, target, mode.hitMode, loc);
      if (opening) await run();
      else await this.act(run);
    }

    calledShot(target, hitMode) {
      return new Promise(resolve => this.p.openModal(new CalledShotScreen(this.p, this, target, hitMode, resolve)));
    }

    dudeMove(hex) {
      const w = this.w;
      const d = w.dude;
      if (hex < 0) return;
      this.act(async () => {
        const steps = Math.floor((d.critter.ap + this.freeMove) / FO.apPerHexes(d, 1));
        if (steps <= 0) return;
        w.anim.runCombat([{ kind: 'move', obj: d, tile: hex, limit: steps }]);
      });
    }

    spendStep(o) {
      if (!this.active || !o.critter) return true;
      let cost = FO.apPerHexes(o, 1);
      if (o.dude && this.freeMove >= cost) {
        this.freeMove -= cost;
        return true;
      }
      if (o.dude) {
        cost -= this.freeMove;
        this.freeMove = 0;
      }
      o.critter.ap = Math.max(0, o.critter.ap - cost);
      return o.critter.ap > 0;
    }

    setOutlines(on) {
      const w = this.w;
      const pref = this.g.prefs ? this.g.prefs.targetHighlight : 2;
      const show = on && pref !== 0;
      const pool = this.active ? this.list : (w.map.byElev[w.elev] || []).filter(o => FO.pidType(o.pid) === FO.PID.CRITTER);
      const friendly = FO.perkRank(w.dude, FO.PERK.FRIENDLY_FOE) > 0;
      for (const o of pool) {
        if (o.dude || !o.critter) continue;
        if (!this.active) o.outlineColor = friendly && team(o) === team(w.dude) ? OUTLINE_GREEN : OUTLINE_RED;
        o.outline = show && alive(o) ? 1 : 0;
      }
    }

    snapshot() {
      return {
        list: this.list.slice(), com: this.com, noncom: this.noncom, index: Math.max(0, this.list.indexOf(this.current)),
        exp: this.exp, elev: this.elev, freeMove: this.freeMove
      };
    }

    resume(s) {
      const w = this.w;
      if (this.active) return;
      this.list = s.list.filter(Boolean);
      this.com = s.com;
      this.noncom = s.noncom;
      this.exp = s.exp;
      this.elev = s.elev;
      this.active = true;
      this.ending = false;
      this.endingGuy = null;
      w.inCombat = true;
      const friendly = FO.perkRank(w.dude, FO.PERK.FRIENDLY_FOE) > 0;
      for (const o of this.list) o.outlineColor = friendly && team(o) === team(w.dude) ? OUTLINE_GREEN : OUTLINE_RED;
      this.current = this.list[s.index] || null;
      this.resumeFreeMove = s.freeMove | 0;
      this.run(null, s.index);
    }

    async run(gcsd, resumeAt) {
      const w = this.w;
      const resuming = resumeAt !== undefined;
      if (!resuming) {
        if (gcsd && ((gcsd.attacker && gcsd.attacker.elev !== w.elev) || (gcsd.defender && gcsd.defender.elev !== w.elev))) return;
        if (this.active) return;
        this.begin(gcsd ? gcsd.attacker : null);
        this.sequenceInit(gcsd ? gcsd.attacker : null, gcsd ? gcsd.defender : null);
        this.gcsd = gcsd || null;
      }
      let idx = resuming ? resumeAt : 0;
      let resumed = resuming;
      try {
        outer: for (;;) {
          for (; idx < this.com; idx++) {
            const r = await this.turn(this.list[idx], resumed);
            resumed = false;
            if (r === -1 || this.endingGuy || !this.active || this.ending) break outer;
            this.gcsd = null;
          }
          await this.sequence();
          if (!this.active || this.ending || this.shouldEnd()) break;
          idx = 0;
        }
      } finally {
        this.over();
      }
    }

    over() {
      const w = this.w;
      const d = w.dude;
      if (!this.active) return;
      for (const o of this.list.slice(0, this.com + this.noncom)) {
        o.critter.damageLastTurn = 0;
        o.critter.maneuver = 0;
      }
      for (const o of this.list) {
        o.critter.ap = 0;
        o.outline = 0;
        o.critter.whoHitMe = null;
      }
      this.active = false;
      this.input = null;
      this.gcsd = null;
      w.inCombat = false;
      d.critter.ap = FO.statValue(d, FO.STAT.MAX_AP);
      this.giveExp(this.exp);
      this.exp = 0;
      this.list = [];
      this.com = 0;
      this.noncom = 0;
      this.p.cursor = 'move';
      this.p.targeting = null;
      if (this.p.iface.refreshItems) this.p.iface.refreshItems();
      if (FO.isProne(d) && alive(d) && !this.endingGuy) {
        this.clearEvents(d);
        const anim = FO.fidAnim(d.fid) === FO.ANIM.FALL_BACK ? FO.ANIM.BACK_TO_STANDING : FO.ANIM.PRONE_TO_STANDING;
        d.critter.results &= ~(D.KNOCKED_DOWN | D.KNOCKED_OUT);
        w.anim.runCombat([{ kind: 'anim', obj: d, code: anim }]);
      }
      this.tick();
      for (const r of this.waiters.splice(0)) r();
    }

    giveExp(n) {
      const p = this.p;
      const d = this.w.dude;
      if (n <= 0 || !alive(d)) return;
      p.giveExp(n);
      let praise = EXP_PRAISE + rnd(0, 3);
      if ((d.critter.hp | 0) === FO.statValue(d, FO.STAT.MAX_HP) && rnd(0, 100) > 65) praise = EXP_UNHURT;
      const fmt = p.text(EXP_LINE);
      p.say(fmt.replace('%s', p.text(praise)).replace('%d', n));
    }
  }

  FO.isProne = function (o) {
    if (!o || !o.critter) return false;
    if (o.critter.results & (D.KNOCKED_OUT | D.KNOCKED_DOWN)) return true;
    return FO.isFallAnim(FO.fidAnim(o.fid));
  };

  class CalledShotScreen extends FO.Win {
    constructor(play, combat, target, hitMode, resolve) {
      super(play);
      this.combat = combat;
      this.target = target;
      this.hitMode = hitMode;
      this.resolve = resolve;
      this.overBar = true;
      this.hover = -1;
      this.button({ id: 'cancel', x: CALLED.CANCEL_X, y: CALLED.CANCEL_Y, w: 15, h: 16, up: 8, down: 9, key: 'Escape', onClick: () => this.finish(-1) });
      for (let i = 0; i < 8; i++) {
        const loc = i < 4 ? CALLED.LEFT[i] : CALLED.RIGHT[i - 4];
        const y = CALLED.ROWS[i % 4] - 82;
        this.button({ id: 'loc' + i, x: 0, y, w: 88, h: 10, onClick: () => this.finish(loc), loc, index: i });
      }
    }

    async enter() {
      const g = this.g;
      await g.art.loadAll([FO.IFACE(CALLED.ART), FO.IFACE(8), FO.IFACE(9), FO.IFACE(82), FO.fid(FO.ART.CRITTER, FO.fidIndex(this.target.fid), FO.ANIM.CALLED_SHOT_PIC, 0)]);
    }

    finish(loc) {
      this.close();
      if (loc >= 0) FO.uiSound(this.g, 'called');
      this.resolve(loc);
    }

    cursor() {
      return 267;
    }

    labelX(i) {
      if (i < 4) return 74;
      const name = FO.locationName(this.combat, this.target, CALLED.RIGHT[i - 4]);
      return 351 - (name ? this.g.fonts[101].width(name) : 10);
    }

    number(scr, x, y, value) {
      const nums = this.art(82);
      if (!nums) return;
      if (value < 0) {
        scr.blitPart(nums, 108, 0, 6, 17, this.x + x, this.y + y);
        scr.blitPart(nums, 108, 0, 6, 17, this.x + x + 6, this.y + y);
        return;
      }
      const v = Math.min(99, value);
      scr.blitPart(nums, Math.trunc(v / 10) * 9, 0, 9, 17, this.x + x, this.y + y);
      scr.blitPart(nums, (v % 10) * 9, 0, 9, 17, this.x + x + 9, this.y + y);
    }

    draw(scr) {
      const g = this.g;
      const w = this.p.w;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox + CALLED.X;
      this.y = oy + CALLED.Y;
      this.blit(scr, CALLED.ART, 0, 0);
      const pic = g.art.get(FO.fid(FO.ART.CRITTER, FO.fidIndex(this.target.fid), FO.ANIM.CALLED_SHOT_PIC, 0));
      if (pic) scr.blit(pic.dirs[0].frames[0], this.x + CALLED.PIC_X, this.y + CALLED.PIC_Y);
      const green = this.color('green');
      const red = this.color('red');
      const mx = g.mouse.x - this.x;
      const my = g.mouse.y - this.y;
      for (const b of this.buttons) {
        if (b.index === undefined) continue;
        const i = b.index;
        b.x = i < 4 ? 33 : this.labelX(i);
        const row = CALLED.ROWS[i % 4] - 86;
        const toHit = FO.determineToHit(w, w.dude, this.target, b.loc, this.hitMode, true);
        this.number(scr, i < 4 ? 33 : 373, row, toHit);
        const name = FO.locationName(this.combat, this.target, b.loc);
        if (name) this.text(name, this.labelX(i), row, b.contains(mx, my) ? red : green, 101);
      }
      this.drawButtons(scr);
    }
  }

  FO.Combat = Combat;
  FO.CalledShotScreen = CalledShotScreen;
})(globalThis.FO = globalThis.FO || {});
