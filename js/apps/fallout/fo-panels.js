(function (FO) {
  'use strict';

  const SKILLDEX_SKILLS = [FO.SKILL.SNEAK, FO.SKILL.LOCKPICK, FO.SKILL.STEAL, FO.SKILL.TRAPS, FO.SKILL.FIRST_AID, FO.SKILL.DOCTOR, FO.SKILL.SCIENCE, FO.SKILL.REPAIR];
  const ELEVATOR_ART = [143, 150, 144, 145, 146, 147, 151, 152, 148, 148, 148, 151];

  class SkilldexScreen extends FO.Win {
    constructor(play, target) {
      super(play);
      this.target = target;
      this.msg = new Map();
      SKILLDEX_SKILLS.forEach((s, i) => this.button({ id: 's' + s, x: 14, y: 44 + i * 36, w: 86, h: 33, up: -1, down: 119, baked: true, sound: 'ib3', key: 'Digit' + (i + 1), onClick: () => this.pick(s) }));
      this.button({ id: 'cancel', x: 47, y: 339, w: 15, h: 16, up: -1, down: 9, baked: true, key: ['Escape', 'KeyS'], onClick: () => this.close() });
      this.pauses = true;
    }

    async enter() {
      const g = this.g;
      const path = FO.textPath('GAME\\SKILLDEX.MSG');
      this.msg = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      await g.art.loadAll([121, 119, 120, 9, 170].map(FO.IFACE));
    }

    m(id) {
      const e = this.msg.get(id);
      return e ? e.text : '';
    }

    pick(skill) {
      this.close();
      this.p.chooseSkill(skill, this.target);
    }

    draw(scr) {
      const g = this.g;
      this.x = Math.max(0, scr.w - 185 - 5);
      this.y = Math.max(0, scr.h - FO.BAR_H - 368 - 6);
      this.blit(scr, 121, 0, 0);
      this.drawButtons(scr);
      FO.textIn(g, this.m(100), this.x + 48, this.y + 14, 89, this.color('light'), 103, 'center');
      const d = this.p.w.dude;
      const nums = this.art(170);
      SKILLDEX_SKILLS.forEach((s, i) => {
        const pressed = this.pressed && this.pressed.id === 's' + s;
        FO.textIn(g, this.m(102 + i), this.x + 14, this.y + 44 + i * 36 + 12 + (pressed ? 1 : 0), 86, this.color('light'), 101, 'center');
        const v = String(Math.min(999, FO.skillValue(d, s))).padStart(3, '0');
        if (nums) for (let k = 0; k < 3; k++) scr.blitPart(nums, +v[k] * 14, 0, 14, 24, this.x + 111 + k * 14, this.y + 48 + i * 36);
      });
      this.text(this.m(101), 64, 340, this.color('light'), 101);
    }
  }

  const SKILL_MSG = {
    HEALED: 500, HEALTHY: 501, FAILED: 503, EXP: 505, DEAD: 512, LIMB_HEALED: 520, LIMB_FAILED: 525, LIMB: 530,
    TRAPS: 551, SCIENCE: 552, REPAIR: 553, TAXED: 590
  };
  const LIMBS = [0x40, 0x10, 0x20, 0x08, 0x04];
  const HOUR = 36000;
  const SNEAK_TICKS = 600;
  const HEAL_TICKS = 1800;
  const USES_PER_DAY = 3;
  const ROBOTIC = 2;
  const KITS = { 91: [FO.SKILL.DOCTOR, 900], 47: [FO.SKILL.FIRST_AID, 901] };
  const KIT_BONUS = 20;
  const JAMMED_MSG = 2001;
  const IN_COMBAT_MSG = 902;

  const randOf = play => (play.sc && play.sc.rand ? play.sc.rand : FO.combatRand);
  const skillText = (play, id, args) => {
    let s = play.text(id, 'SKILL');
    for (const a of args || []) s = s.replace(/%[sd]/, String(a));
    return s;
  };
  const sayHealthy = (play, target) => {
    if (target.dude) play.say(skillText(play, SKILL_MSG.HEALTHY));
    else play.say(skillText(play, SKILL_MSG.HEALTHY + 1, [FO.objName(play, target)]));
  };

  FO.skillUseSlot = function (d, skill, now) {
    const slots = d.skillUseTimes && d.skillUseTimes[skill] ? d.skillUseTimes[skill] : [0, 0, 0];
    let n = 0;
    while (n < USES_PER_DAY && slots[n]) n++;
    if (n < USES_PER_DAY) return n;
    return Math.floor(((now - slots[0]) >>> 0) / HOUR) > 24 ? USES_PER_DAY - 1 : -1;
  };

  FO.skillUseAdd = function (d, skill, now) {
    const i = FO.skillUseSlot(d, skill, now);
    if (i < 0) return;
    d.skillUseTimes = d.skillUseTimes || {};
    const slots = d.skillUseTimes[skill] = d.skillUseTimes[skill] || [0, 0, 0];
    if (slots[i]) for (let k = 0; k < i; k++) slots[k] = slots[k + 1];
    slots[i] = now;
  };

  FO.skillResult = function (play, o, skill, mod) {
    if (!FO.skillRow(skill)) return [FO.ROLL.FAIL, 0];
    return FO.rollVs(FO.skillValue(o, skill) + mod, FO.statValue(o, FO.STAT.CRIT_CHANCE), randOf(play));
  };

  FO.skillUseExp = function (play, user, skill, uses, mod) {
    if (!user.dude || uses <= 0) return;
    const row = FO.skillRow(skill);
    let exp = row ? row[5] : 0;
    if (!exp) return;
    if (row[6] && mod < 0) exp -= mod;
    exp *= uses;
    const before = user.exp | 0;
    if (play.giveExp) play.giveExp(exp);
    else FO.addExperience(user, exp);
    play.say(skillText(play, SKILL_MSG.EXP, [(user.exp | 0) - before]));
  };

  FO.isCrippled = o => !!(o && o.critter && (o.critter.results & 0x7C));

  FO.skillUse = function (play, user, target, skill, mod) {
    const w = play.w;
    const d = w.dude;
    const K = FO.SKILL;
    const R = FO.ROLL;
    const now = play.sc ? play.sc.time : 0;
    const rnd = randOf(play);
    const hp = FO.statValue(target, FO.STAT.HP);
    const max = FO.statValue(target, FO.STAT.MAX_HP);
    let minBonus = 0;
    let maxBonus = 0;
    if (user.dude && (skill === K.FIRST_AID || skill === K.DOCTOR)) {
      const rank = FO.perkRank(user, FO.PERK.HEALER);
      minBonus = 2 * rank;
      maxBonus = 5 * rank;
    }
    const critMod = FO.statValue(user, FO.STAT.CRIT_CHANCE) + mod;
    const robot = !!(target.proto && (target.proto.body | 0) === ROBOTIC && !target.dude);
    const heal = (lo, hi) => {
      const n = rnd(lo, hi);
      FO.adjustHits(play, target, n);
      if (user.dude) play.say(skillText(play, SKILL_MSG.HEALED, [Math.min(n, max - hp)]));
    };
    let exp = true;
    let success = false;
    let tries = 1;
    switch (skill) {
      case K.FIRST_AID:
      case K.DOCTOR: {
        if (FO.skillUseSlot(d, skill, now) === -1) {
          play.say(skillText(play, SKILL_MSG.TAXED + rnd(0, 2)));
          return -1;
        }
        if (w.isDead(target)) {
          play.say(skillText(play, SKILL_MSG.DEAD + rnd(0, 2)));
          break;
        }
        const doctor = skill === K.DOCTOR;
        if (hp < max || (doctor && FO.isCrippled(target))) {
          if (user.dude && FO.dip) FO.dip(play.g);
          let limbHealed = false;
          if (doctor && !robot && FO.isCrippled(target)) {
            LIMBS.forEach((flag, i) => {
              if (!(target.critter.results & flag)) return;
              tries++;
              const [r] = FO.skillResult(play, user, skill, critMod);
              let id = SKILL_MSG.LIMB_FAILED;
              if (r >= R.SUCCESS) {
                target.critter.results &= ~flag;
                success = true;
                limbHealed = true;
                id = SKILL_MSG.LIMB_HEALED;
                FO.skillUseAdd(d, skill, now);
              }
              play.say(skillText(play, id + (target === d ? 0 : 1), [skillText(play, SKILL_MSG.LIMB + i)]));
              FO.skillUseExp(play, user, skill, success ? 1 : 0, mod);
              exp = false;
            });
          }
          let r = R.FAIL;
          if (!robot) r = doctor ? FO.rollVs(FO.skillValue(user, skill), critMod, rnd)[0] : FO.skillResult(play, user, skill, critMod)[0];
          if (r >= R.SUCCESS) {
            if (doctor) heal(minBonus + 4, maxBonus + 10);
            else heal(minBonus + 1, maxBonus + 5);
            if (!doctor || !limbHealed) FO.skillUseAdd(d, skill, now);
            success = true;
            if (doctor) {
              FO.skillUseExp(play, user, skill, 1, mod);
              exp = false;
            }
          } else {
            play.say(skillText(play, SKILL_MSG.FAILED));
          }
        } else {
          if (user.dude) sayHealthy(play, target);
          exp = false;
        }
        if (user.dude && play.passTime) play.passTime(HEAL_TICKS * tries * (doctor ? 2 : 1), false);
        break;
      }
      case K.STEAL:
        if (FO.pidType(target.pid) === FO.PID.CRITTER && !w.isDead(target) && play.openSteal) play.openSteal(target);
        else if (play.openLoot) play.openLoot(target);
        break;
      case K.TRAPS:
        play.say(skillText(play, SKILL_MSG.TRAPS));
        return -1;
      case K.SCIENCE:
        play.say(skillText(play, SKILL_MSG.SCIENCE));
        return -1;
      case K.REPAIR:
        play.say(skillText(play, SKILL_MSG.REPAIR));
        return -1;
      case K.SNEAK:
      case K.LOCKPICK:
        break;
      default:
        return -1;
    }
    if (exp) FO.skillUseExp(play, user, skill, success ? 1 : 0, mod);
    return 0;
  };

  FO.lockJammed = function (w, o) {
    if (w.isDoor(o)) return ((o.openFlags | 0) & FO.JAMMED) !== 0;
    if (FO.pidType(o.pid) === FO.PID.ITEM && o.proto && o.proto.sub === FO.ITEM.CONTAINER) return ((o.dataFlags | 0) & FO.JAMMED) !== 0;
    return false;
  };

  FO.useSkill = function (play, skill, target) {
    const w = play.w;
    const d = w.dude;
    if (!target) return -1;
    if (FO.lockJammed(w, target)) {
      play.say(play.text(JAMMED_MSG, 'MISC'));
      return -1;
    }
    const s = target.script && play.sc ? play.sc.exec(target.script, FO.ACT.USE_SKILL_ON, { source: d, skill }) : null;
    if (s && s.overrides) return 0;
    return FO.skillUse(play, d, target, skill, 0);
  };

  FO.useKit = function (play, user, target, item) {
    const kit = KITS[item.pid];
    if (!kit) return null;
    if (play.w.inCombat) {
      if (user.dude) play.say(play.text(IN_COMBAT_MSG, 'PROTO'));
      return -1;
    }
    if (FO.skillUse(play, user, target, kit[0], KIT_BONUS) !== 0) return 0;
    if (randOf(play)(1, 10) !== 1) return 0;
    if (user.dude) play.say(play.text(kit[1], 'PROTO'));
    return 1;
  };

  FO.rollSneak = function (play) {
    const d = play.w.dude;
    d.sneakWorking = FO.skillResult(play, d, FO.SKILL.SNEAK, 0)[0] >= FO.ROLL.SUCCESS;
    if (play.sc) play.sc.addEvent(d, SNEAK_TICKS, 'sneak');
  };

  FO.toggleSneak = function (play) {
    const d = play.w.dude;
    play.w.anim.cancel(d);
    if (FO.isSneaking(d)) {
      FO.setPcFlag(d, FO.PC_FLAG.SNEAK, false);
      if (play.sc) play.sc.removeEvents(d, 'sneak');
      return;
    }
    FO.setPcFlag(d, FO.PC_FLAG.SNEAK, true);
    FO.rollSneak(play);
  };

  FO.stealCheck = function (play, thief, victim, item, planting, count) {
    const w = play.w;
    const rnd = play.sc ? play.sc.rand : (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    let mod = 1 - count;
    if (!thief.dude || !(FO.perkRank(thief, FO.PERK.PICKPOCKET) > 0)) {
      mod -= 4 * ((item.proto && item.proto.size) | 0);
      const turn = Math.abs((thief.rot | 0) - (victim.rot | 0));
      if (FO.fidType(victim.fid) === FO.ART.CRITTER && turn !== 0 && turn !== 1 && turn !== 5) mod -= 25;
    }
    if (victim.critter && (victim.critter.results & (FO.DAM.KNOCKED_OUT | FO.DAM.KNOCKED_DOWN))) mod += 20;
    const chance = Math.min(95, FO.skillValue(thief, FO.SKILL.STEAL) + mod);
    let r = FO.ROLL.CRIT_SUCCESS;
    if (!(thief.dude && w.party && w.party.includes(victim))) [r] = FO.rollVs(chance, FO.statValue(thief, FO.STAT.CRIT_CHANCE), rnd);
    let caught = r === FO.ROLL.CRIT_FAIL;
    if (r === FO.ROLL.FAIL || r === FO.ROLL.SUCCESS) {
      const spot = FO.pidType(victim.pid) === FO.PID.CRITTER ? FO.skillValue(victim, FO.SKILL.STEAL) - mod : 30 - mod;
      caught = FO.rollVs(spot, 0, rnd)[0] >= FO.ROLL.SUCCESS;
    }
    const id = (caught ? 570 : 571) + (planting ? 2 : 0);
    play.say(play.text(id, 'SKILL').replace('%s', play.g.protos.name(item.pid)));
    return !caught;
  };

  class ElevatorScreen extends FO.Win {
    constructor(play, type) {
      super(play);
      this.type = type;
      this.floors = (FO.GEN && FO.GEN.elevators && FO.GEN.elevators[type]) || [];
      this.panel = ELEVATOR_ART[type] !== undefined ? ELEVATOR_ART[type] : 148;
      this.current = this.floors.findIndex(f => f.map === play.w.map.index && f.elev === play.w.elev);
      this.floors.forEach((f, i) => this.button({ id: 'f' + i, x: 11, y: 13 + i * 50, w: 48, h: 50, up: 142, down: 141, baked: true, sound: 'ib1p', key: 'Digit' + (i + 1), onClick: () => this.go(i) }));
    }

    async enter() {
      await this.g.art.loadAll([this.panel, 141, 142].map(FO.IFACE));
    }

    go(i) {
      this.close();
      const f = this.floors[i];
      if (!f || i === this.current) return;
      const p = this.p;
      if (f.map === p.w.map.index) {
        p.w.moveTo(p.w.dude, f.tile, f.elev);
        p.centerOn(f.tile);
      } else {
        p.goto(f.map, f.tile, f.elev, -1);
      }
    }

    draw(scr) {
      const f = FO.frameOfArt(this.g, this.panel);
      const w = f ? f.w : 230;
      const h = f ? f.h : 284;
      this.x = Math.max(0, (scr.w - w) >> 1);
      this.y = Math.max(0, ((scr.h - FO.BAR_H) - h) >> 1);
      this.blit(scr, this.panel, 0, 0);
      this.drawButtons(scr);
    }

    keyDown(e) {
      if (e.code === 'Escape') {
        this.close();
        return true;
      }
      return super.keyDown(e);
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (!this.pressed && button === 0) {
        const f = FO.frameOfArt(this.g, this.panel);
        const lx = m.x - this.x;
        const ly = m.y - this.y;
        if (!f || lx < 0 || ly < 0 || lx >= f.w || ly >= f.h) this.close();
      }
    }
  }

  class OptionsScreen extends FO.Win {
    constructor(play) {
      super(play);
      this.msg = new Map();
      const closeIfDone = rc => {
        if (rc === 1) this.close();
      };
      const actions = [
        () => this.p.saveGame(closeIfDone),
        () => this.p.loadGame(closeIfDone),
        () => { this.close(); this.p.openPreferences(); },
        () => { this.close(); this.p.exitGame(); },
        () => this.close()
      ];
      const keys = ['KeyS', 'KeyL', 'KeyP', 'KeyE', ['KeyD', 'Escape', 'KeyO']];
      actions.forEach((fn, i) => this.button({ id: 'o' + i, x: 15, y: 19 + i * 37, w: 137, h: 34, up: 221, down: 222, sound: 'ib3', key: keys[i], onClick: fn }));
    }

    async enter() {
      const g = this.g;
      const path = FO.textPath('GAME\\OPTIONS.MSG');
      this.msg = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      await g.art.loadAll([220, 221, 222].map(FO.IFACE));
    }

    draw(scr) {
      this.x = Math.max(0, (scr.w - 164) >> 1);
      this.y = Math.max(0, ((scr.h - FO.BAR_H) - 217) >> 1);
      this.blit(scr, 220, 0, 0);
      this.drawButtons(scr);
      for (let i = 0; i < 5; i++) {
        const e = this.msg.get(i);
        const pressed = this.pressed && this.pressed.id === 'o' + i;
        FO.textIn(this.g, e ? e.text : '', this.x + 15, this.y + 19 + i * 37 + 12 + (pressed ? 1 : 0), 137, this.color('light'), 103, 'center');
      }
    }
  }

  class PictureScreen extends FO.Win {
    constructor(play, art, palette) {
      super(play);
      this.pic = art;
      this.palette = palette;
      this.overBar = true;
    }

    async enter() {
      const g = this.g;
      await g.art.loadAll([FO.IFACE(this.pic)]);
      if (this.palette && g.data.has(this.palette)) {
        g.colors.pushPalette(FO.readPal(await g.data.get(this.palette)).rgb);
        this.pushed = true;
      }
    }

    leave() {
      if (this.pushed) this.g.colors.popPalette();
    }

    draw(scr) {
      scr.fill(0);
      const f = this.art(this.pic);
      if (f) scr.blitScaled(f, [0, 0, f.w, f.h], FO.scaleRect(scr.w, scr.h, f.w, f.h, FO.screenPref(this.g.prefs, 'scaling')));
    }

    mouseDown() {
      this.close();
    }

    keyDown() {
      this.close();
      return true;
    }
  }

  const PAUSE = { BG: 208, DONE_BOX: 209, BTN_UP: 8, BTN_DOWN: 9, W: 139, H: 72, box: [13, 42], label: [52, 45], button: [26, 46], titleY: 10, world: [-65, -24], map: [0, -54] };
  const PAUSE_MSG = { DONE: 300, PAUSED: 301 };

  class PauseScreen extends FO.Win {
    constructor(play, world) {
      super(play);
      this.shift = world ? PAUSE.world : PAUSE.map;
      this.overBar = true;
      this.msg = new Map();
      this.button({ id: 'done', x: PAUSE.button[0], y: PAUSE.button[1], up: PAUSE.BTN_UP, down: PAUSE.BTN_DOWN, onClick: () => this.close() });
    }

    async enter() {
      const g = this.g;
      const path = FO.textPath('GAME\\OPTIONS.MSG');
      this.msg = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      await g.art.loadAll([PAUSE.BG, PAUSE.DONE_BOX, PAUSE.BTN_UP, PAUSE.BTN_DOWN].map(FO.IFACE));
    }

    m(id) {
      const e = this.msg.get(id);
      return e ? e.text : '';
    }

    keyDown(e) {
      if (e.code === 'Equal' || e.code === 'NumpadAdd') FO.stepBrightness(this.g, 1);
      else if (e.code === 'Minus' || e.code === 'NumpadSubtract') FO.stepBrightness(this.g, -1);
      else this.close();
      return true;
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox + ((640 - PAUSE.W) >> 1) + this.shift[0];
      this.y = oy + ((480 - PAUSE.H) >> 1) + this.shift[1];
      scr.rect(this.x, this.y, PAUSE.W, PAUSE.H, g.colors.nearest(0, 0, 0));
      this.blit(scr, PAUSE.BG, 0, 0);
      this.blit(scr, PAUSE.DONE_BOX, PAUSE.box[0], PAUSE.box[1]);
      const label = this.color('label');
      this.text(this.m(PAUSE_MSG.DONE), PAUSE.label[0], PAUSE.label[1], label, 103);
      const title = this.m(PAUSE_MSG.PAUSED);
      const f = g.fonts[104];
      if (f) this.text(title, ((PAUSE.W - f.width(title)) >> 1) + 2, PAUSE.titleY, label, 104);
      this.drawButtons(scr);
    }
  }

  FO.SkilldexScreen = SkilldexScreen;
  FO.ElevatorScreen = ElevatorScreen;
  FO.OptionsScreen = OptionsScreen;
  FO.PictureScreen = PictureScreen;
  FO.PauseScreen = PauseScreen;
})(globalThis.FO = globalThis.FO || {});
