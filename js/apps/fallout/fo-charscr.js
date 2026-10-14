(function (FO) {
  'use strict';

  const ART = {
    CREATE: 169, EDIT: 177, BIGNUM: 170, AGE_MASK: 175, AGE_OFF: 176, AGE_ON: 204, NAME_MASK: 183, NAME_ON: 184, NAME_OFF: 185,
    FOLDER_MASK: 186, SEX_MASK: 187, SEX_OFF: 188, SEX_ON: 189, SLIDER: 190, MINUS_OFF: 191, MINUS_ON: 192, PLUS_OFF: 193, PLUS_ON: 194,
    BUTTON_UP: 8, BUTTON_DOWN: 9, AGE_BOX: 205, CHAR_WIN: 208, DONE_BOX: 209, FEMALE_OFF: 210, FEMALE_ON: 211, MALE_OFF: 212,
    MALE_ON: 213, NAME_BOX: 214, LEFT_UP: 122, LEFT_DOWN: 123, RIGHT_UP: 124, RIGHT_DOWN: 125, TAG_OFF: 215, TAG_ON: 216,
    KARMA_FOLDER: 178, KILLS_FOLDER: 179, PERKS_FOLDER: 180
  };
  const ALL_ART = Object.values(ART);
  const SPECIAL_Y = [37, 70, 103, 136, 169, 202, 235];
  const KILL_TITLE = '%s Kills';
  const DERIVED = [[302, 9], [301, 8], [311, 12], [304, 11], [305, 24, true], [306, 32, true], [307, 31, true], [308, 13], [309, 14], [310, 15, true]];
  const DERIVED_ART = [18, 19, 20, 21, 22, 23, 83, 24, 25, 26];
  const CONDITIONS = [[312, 400, 11], [313, 401, 12], [314, 402, 13, 0x40], [315, 403, 14, 0x20], [316, 404, 15, 0x10], [317, 405, 16, 0x08], [318, 406, 17, 0x04]];
  const KARMA_GVARS = [156, 157, 158, 189, 190, 191, 192, 193, 194];
  const KARMA_ART = [48, 49, 51, 50, 52, 53, 53, 53, 53, 52];
  const REPUTATION_GVAR = 155;
  const KILL_TYPES_SHOWN = 14;
  const SEL = { LEVEL: 7, EXP: 8, NEXT: 9, FOLDER: 10, PERKS: 40, KILLS: 41, KARMA: 42, HP: 43, DERIVED: 51, SKILL: 61, SKILL_POINTS: 79, SKILLS: 80, TRAITS: 81, TRAIT: 82, END: 98 };
  const FOLDER = { PERKS: 0, KARMA: 1, KILLS: 2 };
  const CARD = { x: 345, y: 267, artX: 484, artY: 309, titleX: 348, titleY: 272, lineX2: 613, textY: 315, textW: 136 };
  const CODES = { DONE: 500, OPTIONS: 501, CANCEL: 502 };
  const HOLD = 19.2;
  const ROLL_MS = 123;
  const FRAME_MS = 41;
  const DIGIT_W = 14;
  const DIGIT_H = 24;
  const ROLL_GLYPH = 11;
  const MAX_SKILL_POINTS_SHOWN = 99;
  const SKILLDEX_ART = 125;
  const memory = new WeakMap();

  const lineHeight = (g, font) => {
    const f = g.fonts[font];
    return f ? f.height + f.lineGap : 0;
  };

  FO.thousands = function (n) {
    return String(Math.max(0, n | 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  class HoldRepeat {
    constructor(threshold, step) {
      this.threshold = threshold;
      this.step = step;
      this.count = 0;
      this.rate = 4;
      this.next = 0;
      this.stopped = false;
    }

    tick(now) {
      while (!this.stopped && now >= this.next) {
        const at = this.next;
        if (this.count <= this.threshold) this.count++;
        if (this.count === 1 || this.count > this.threshold) {
          if (this.count > this.threshold) this.rate = Math.min(24, this.rate + 1);
          if (this.step() === false) this.stopped = true;
        }
        this.next = at + (this.count < this.threshold ? FRAME_MS : Math.floor(1000 / this.rate));
      }
    }
  }

  FO.HoldRepeat = HoldRepeat;

  FO.leftDarkColumn = function (g, frame, start) {
    let best = start;
    const pal = g.colors.base;
    for (let y = 0; y < frame.h; y++) {
      for (let x = 0; x < frame.w && x <= best; x++) {
        const c = frame.px[y * frame.w + x];
        const m = Math.max(pal[c * 3], pal[c * 3 + 1], pal[c * 3 + 2]) >> 3;
        if (m < 2 && x < best) best = x;
      }
    }
    return Math.max(0, best - 8);
  };

  class CharacterScreen extends FO.Win {
    constructor(host, creation) {
      super(host);
      this.overBar = true;
      this.creation = !!creation;
      this.msgs = {};
      this.saved = null;
      this.clock = 0;
      this.hold = null;
      this.rolls = new Map();
      this.lastCard = null;
      this.result = null;
      this.onClose = null;
      const w = host.w;
      if (!memory.has(w)) memory.set(w, { sel: 0, folder: FOLDER.PERKS, skillRow: 0 });
      this.ui = memory.get(w);
      this.button({ id: 'options', x: 343, y: 454, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, key: this.creation ? ['KeyO'] : ['KeyP'], onClick: () => this.options() });
      this.button({ id: 'cancel', x: 552, y: 454, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, key: 'Escape', onClick: () => this.cancel() });
      this.button({ id: 'done', x: 455, y: 454, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, key: ['Enter', 'NumpadEnter'], onClick: () => this.done() });
    }

    get dude() {
      return this.p.w.dude;
    }

    async enter() {
      const g = this.g;
      for (const name of ['EDITOR', 'STAT', 'SKILL', 'PERK', 'TRAIT', 'PROTO']) {
        const path = FO.textPath('GAME\\' + name + '.MSG');
        this.msgs[name] = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      }
      await g.art.loadAll([...ALL_ART, ...FO.MESSAGE_BOX_ART].map(FO.IFACE));
      g.art.loadAll([...Array(SKILLDEX_ART).keys()].map(i => FO.fid(FO.ART.SKILLDEX, i)));
      this.fitButtons();
      this.addHotspots();
      const d = this.dude;
      this.saved = this.snapshot();
      if (!this.creation) {
        FO.levelCheck(d);
        FO.recalcDerived(d);
        if (d.freePerk && FO.PerkPicker) this.p.openModal(new FO.PerkPicker(this.p, this));
      }
    }

    fitButtons() {
      for (const b of this.buttons) {
        if (b.up < 0) continue;
        const f = this.art(b.up);
        if (f) {
          b.w = f.w;
          b.h = f.h;
        }
      }
    }

    size(id) {
      const f = this.art(id);
      return f ? [f.w, f.h] : [0, 0];
    }

    addHotspots() {
      const spot = (x, y, w, h, fn) => this.button({ x, y, w, h, up: -1, down: -1, onClick: () => fn(this.local()) });
      spot(19, 38, 125, 227, m => this.clickSpecial(m));
      spot(28, 280, 124, 32, m => this.clickLevel(m));
      if (this.creation) {
        spot(52, 324, 169, 20, () => this.select(SEL.TRAITS));
        spot(47, 353, 245, 100, m => this.clickTraitList(m));
      } else {
        spot(28, 363, 283, 105, m => this.clickFolderList(m));
        const [fw, fh] = this.size(ART.FOLDER_MASK);
        this.button({ x: 11, y: 327, w: fw, h: fh, up: -1, down: -1, mask: ART.FOLDER_MASK, onClick: () => this.clickFolder(this.local()) });
      }
      spot(191, 41, 122, 110, m => this.select(SEL.HP + Math.trunc(Math.max(0, m.y - 41) / 13)));
      spot(191, 175, 122, 135, m => this.select(SEL.DERIVED + Math.trunc(Math.max(0, m.y - 175) / 13)));
      spot(376, 5, 223, 20, () => this.select(SEL.SKILLS));
      spot(370, 27, 223, 195, m => this.clickSkill(m));
      spot(396, 228, 171, 25, () => this.select(SEL.SKILL_POINTS));
      if (this.creation) this.addCreationButtons();
    }

    addCreationButtons() {
      const [nw, nh] = this.size(ART.NAME_OFF);
      const [aw, ah] = this.size(ART.AGE_ON);
      const [sw, sh] = this.size(ART.SEX_ON);
      this.button({ id: 'name', x: 9, y: 0, w: nw, h: nh, up: -1, down: -1, mask: ART.NAME_MASK, key: ['KeyN'], onClick: () => this.p.openModal(new NameDialog(this.p, this)) });
      this.button({ id: 'age', x: 9 + nw, y: 0, w: aw, h: ah, up: -1, down: -1, mask: ART.AGE_MASK, key: ['KeyA'], onClick: () => this.p.openModal(new AgeDialog(this.p, this)) });
      this.button({ id: 'sex', x: 9 + nw + aw, y: 0, w: sw, h: sh, up: -1, down: -1, mask: ART.SEX_MASK, key: ['KeyS'], onClick: () => this.p.openModal(new SexDialog(this.p, this)) });
      const [tw, th] = this.size(ART.TAG_ON);
      for (let i = 0; i < FO.SKILL_COUNT; i++) this.button({ x: 347, y: 26 + i * th, w: tw, h: th, up: ART.TAG_OFF, down: ART.TAG_ON, onClick: () => this.toggleTag(i) });
      for (let i = 0; i < 8; i++) this.button({ x: 23, y: 352 + i * (th + 2), w: tw, h: th, up: ART.TAG_OFF, down: ART.TAG_ON, onClick: () => this.toggleTrait(i) });
      for (let i = 0; i < 8; i++) this.button({ x: 298, y: 352 + i * (th + 2), w: tw, h: th, up: ART.TAG_OFF, down: ART.TAG_ON, onClick: () => this.toggleTrait(8 + i) });
    }

    holdButtons() {
      const out = [];
      const [pw, ph] = this.size(ART.PLUS_ON);
      const [mw, mh] = this.size(ART.MINUS_ON);
      if (this.creation) {
        SPECIAL_Y.forEach((y, i) => {
          out.push({ x: 149, y, w: pw, h: ph, up: ART.PLUS_OFF, down: ART.PLUS_ON, run: () => this.special(i, 1) });
          out.push({ x: 149, y: y + ph - 1, w: mw, h: mh, up: ART.MINUS_OFF, down: ART.MINUS_ON, run: () => this.special(i, -1) });
        });
      } else {
        const sy = this.sliderY();
        out.push({ x: 614, y: sy - 7, w: pw, h: ph, up: ART.PLUS_OFF, down: ART.PLUS_ON, run: () => this.skillStep(1) });
        out.push({ x: 614, y: sy + 4 + mh - 12, w: mw, h: mh, up: ART.MINUS_OFF, down: ART.MINUS_ON, run: () => this.skillStep(-1) });
      }
      return out;
    }

    sliderY() {
      return (lineHeight(this.g, 101) + 1) * this.ui.skillRow + 27;
    }

    local() {
      return { x: this.g.mouse.x - this.x, y: this.g.mouse.y - this.y };
    }

    m(file, id) {
      const e = this.msgs[file] && this.msgs[file].get(id);
      return e ? e.text : '';
    }

    killTitle(name) {
      const pattern = FO.tr(this.g, KILL_TITLE);
      return pattern === KILL_TITLE ? name + ' ' + this.m('EDITOR', 126) : pattern.replace('%s', name);
    }

    sound(name) {
      FO.uiSound(this.g, name);
    }

    snapshot() {
      const d = this.dude;
      return {
        stats: { base: d.stats.base.slice(), bonus: d.stats.bonus.slice(), skills: d.stats.skills.slice() },
        perks: Object.assign({}, d.perks), tags: d.tags.slice(), traits: d.traits.slice(), skillPoints: d.skillPoints | 0,
        level: d.level || 1, exp: d.exp | 0, karma: d.karma | 0, reputation: d.reputation | 0, lastLevel: d.lastLevel || 1,
        freePerk: !!d.freePerk, skillLevels: [...Array(FO.SKILL_COUNT).keys()].map(i => FO.skillValue(d, i))
      };
    }

    restore() {
      const d = this.dude;
      const s = this.saved;
      d.stats.base = s.stats.base.slice();
      d.stats.bonus = s.stats.bonus.slice();
      d.stats.skills = s.stats.skills.slice();
      d.perks = Object.assign({}, s.perks);
      d.tags = s.tags.slice();
      d.traits = s.traits.slice();
      Object.assign(d, { skillPoints: s.skillPoints, level: s.level, exp: s.exp, karma: s.karma, reputation: s.reputation, lastLevel: s.lastLevel, freePerk: s.freePerk });
    }

    tagsLeft() {
      const d = this.dude;
      let empty = 0;
      for (let i = FO.TAG_SLOTS - 1; i >= 0 && d.tags[i] === -1; i--) empty++;
      return this.creation ? empty - 1 : empty;
    }

    traitSlotsLeft() {
      const d = this.dude;
      let empty = 0;
      for (let i = 1; i >= 0 && d.traits[i] === -1; i--) empty++;
      return empty;
    }

    select(sel) {
      this.ui.sel = sel;
    }

    done() {
      const d = this.dude;
      if (this.creation) {
        let lines = null;
        if ((d.charPoints | 0) !== 0) lines = [118, 119];
        else if (this.tagsLeft() > 0) lines = [142, 143];
        else if ([0, 1, 2, 3, 4, 5, 6].some(i => FO.baseWithTraits(d, i) + FO.statBonus(d, i) > 10)) lines = [157, 158];
        if (lines) {
          this.sound('iisxxxx1');
          this.warn(this.m('EDITOR', lines[0]), [this.m('EDITOR', lines[1])]);
          return;
        }
      }
      this.finish(true);
    }

    cancel() {
      this.finish(false);
    }

    finish(ok) {
      const d = this.dude;
      if (this.creation) {
        d.tags[3] = -1;
        this.ui.sel = 0;
        if (d.critter) d.critter.hp = FO.statValue(d, FO.STAT.MAX_HP);
      }
      if (!ok) this.restore();
      FO.setPcFlag(d, FO.PC_FLAG.LEVEL, false);
      this.result = ok;
      this.close();
      if (this.onClose) this.onClose(ok);
    }

    warn(title, lines) {
      this.p.openModal(new FO.MessageBox(this.p, { title, lines, x: 192, y: 126, color: 'orange', titleColor: 'orange' }));
    }

    options() {}

    roll(key, from, to) {
      if (from === to) return;
      this.rolls.set(key, { from, to, at: this.clock });
    }

    special(i, dir) {
      const d = this.dude;
      const before = FO.baseWithTraits(d, i) + FO.statBonus(d, i);
      const points = d.charPoints | 0;
      let ok = false;
      if (dir > 0) {
        if (points > 0 && before < 10 && FO.setBaseStat(d, i, FO.baseWithTraits(d, i) + 1) >= 0) {
          d.charPoints = points - 1;
          ok = true;
        }
      } else if (FO.setBaseStat(d, i, FO.baseWithTraits(d, i) - 1) >= 0) {
        d.charPoints = points + 1;
        ok = true;
      }
      if (ok) {
        this.roll('stat' + i, before, FO.baseWithTraits(d, i) + FO.statBonus(d, i));
        this.roll('points', points, d.charPoints);
      }
      FO.recalcDerived(d);
      this.select(i);
      return ok;
    }

    skillStep(dir) {
      const d = this.dude;
      const row = this.ui.skillRow;
      const points = d.skillPoints | 0;
      let ok = true;
      if (dir > 0) {
        if (points < 1) {
          this.sound('iisxxxx1');
          this.warn(this.m('EDITOR', 136), []);
          ok = false;
        } else if (FO.skillIncPoint(d, row) === -3) {
          this.sound('iisxxxx1');
          this.warn(this.m('SKILL', 100 + row) + ':', [this.m('EDITOR', 132), this.m('EDITOR', 133)]);
          ok = false;
        }
      } else if (!(FO.skillValue(d, row) > this.saved.skillLevels[row] && FO.skillDecPoint(d, row) !== -2)) {
        this.sound('iisxxxx1');
        this.warn(this.m('SKILL', 100 + row) + ':', [this.m('EDITOR', 134), this.m('EDITOR', 135)]);
        ok = false;
      }
      this.select(SEL.SKILL + row);
      if (ok) this.roll('skillPoints', points, d.skillPoints | 0);
      return ok;
    }

    toggleTag(skill) {
      const d = this.dude;
      const before = this.tagsLeft();
      const at = d.tags.indexOf(skill);
      if (at >= 0) {
        if (at === 0) {
          d.tags[0] = d.tags[1];
          d.tags[1] = d.tags[2];
          d.tags[2] = -1;
        } else if (at === 1) {
          d.tags[1] = d.tags[2];
          d.tags[2] = -1;
        } else {
          d.tags[2] = -1;
        }
      } else if (before > 0) {
        d.tags[d.tags.indexOf(-1)] = skill;
      } else {
        this.sound('iisxxxx1');
        this.warn(this.m('EDITOR', 140), [this.m('EDITOR', 141)]);
      }
      this.roll('tags', before, this.tagsLeft());
      this.select(SEL.SKILL + skill);
    }

    toggleTrait(trait) {
      const d = this.dude;
      if (d.traits[0] === trait) {
        d.traits[0] = d.traits[1];
        d.traits[1] = -1;
      } else if (d.traits[1] === trait) {
        d.traits[1] = -1;
      } else if (this.traitSlotsLeft() > 0) {
        d.traits[d.traits[0] === -1 ? 0 : 1] = trait;
      } else {
        this.sound('iisxxxx1');
        this.warn(this.m('EDITOR', 148), [this.m('EDITOR', 149)]);
      }
      FO.recalcDerived(d);
      this.select(SEL.TRAIT + trait);
    }

    clickSpecial(m) {
      for (let i = 0; i < 7; i++) {
        const slack = 5 - i * 0.25;
        if (SPECIAL_Y[i] - slack > m.y) continue;
        if (SPECIAL_Y[i] + 22 + slack >= m.y) {
          this.select(i);
          return;
        }
      }
    }

    clickLevel(m) {
      if (this.creation) this.select(SEL.LEVEL);
      else this.select(SEL.LEVEL + Math.trunc(Math.max(0, m.y - 280) / 10));
    }

    clickFolderList(m) {
      let sel = SEL.FOLDER + Math.trunc(Math.max(0, m.y - 364) / (lineHeight(this.g, 101) + 1));
      if (this.ui.folder === FOLDER.KILLS && m.x >= 175) sel += 10;
      this.select(sel);
    }

    clickFolder(m) {
      this.sound('ib3p1xx1');
      if (m.x <= 110) {
        this.ui.folder = FOLDER.PERKS;
        this.select(SEL.PERKS);
      } else if (m.x >= 208) {
        this.ui.folder = FOLDER.KILLS;
        this.select(SEL.KILLS);
      } else {
        this.ui.folder = FOLDER.KARMA;
        this.select(SEL.KARMA);
      }
    }

    clickSkill(m) {
      const row = Math.min(17, Math.round(Math.max(0, m.y - 27) * 0.0923076942563057));
      this.ui.skillRow = row;
      this.select(SEL.SKILL + row);
    }

    clickTraitList(m) {
      const lh = lineHeight(this.g, 101);
      const step = Math.fround(lh + 3.56);
      let y = 353;
      let row = 0;
      for (; row < 8; row++) {
        if (!(y - 4 > m.y) && !(lh + y < m.y)) break;
        y = Math.fround(y + step);
      }
      row = Math.min(7, row);
      this.select(SEL.TRAIT + row + (m.x >= 169 ? 8 : 0));
    }

    hit(m) {
      const b = super.hit(m);
      if (b && b.mask >= 0) {
        const f = this.art(b.mask);
        if (f && !f.px[(m.y - this.y - b.y) * f.w + (m.x - this.x - b.x)]) return null;
      }
      return b;
    }

    mouseDown(m, button) {
      if (button !== 0) return;
      for (const b of this.holdButtons()) {
        const lx = m.x - this.x;
        const ly = m.y - this.y;
        if (lx >= b.x && ly >= b.y && lx < b.x + b.w && ly < b.y + b.h) {
          this.sound('down');
          const rep = new HoldRepeat(HOLD, () => b.run());
          rep.next = this.clock;
          this.hold = { b, rep };
          rep.tick(this.clock);
          return;
        }
      }
      super.mouseDown(m, button);
    }

    mouseUp(m, button) {
      if (button === 0 && this.hold) {
        this.hold = null;
        this.sound('up');
        return;
      }
      super.mouseUp(m, button);
    }

    keyDown(e) {
      if (!this.creation) {
        if (FO.isPlusKey(e)) {
          this.skillStep(1);
          return true;
        }
        if (FO.isMinusKey(e)) {
          this.skillStep(-1);
          return true;
        }
      }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') this.sound('ib1p1xx1');
      return super.keyDown(e);
    }

    update(dt) {
      this.clock += dt * 1000;
      if (this.hold) {
        const b = this.hold.b;
        const lx = this.g.mouse.x - this.x;
        const ly = this.g.mouse.y - this.y;
        if (!(lx >= b.x && ly >= b.y && lx < b.x + b.w && ly < b.y + b.h) || this.p.top() !== this) this.hold = null;
        else {
          this.hold.rep.tick(this.clock);
          if (this.hold && this.hold.rep.stopped) this.hold = null;
        }
      }
    }

    bignum(scr, x, y, value, red, key) {
      const r = key ? this.rolls.get(key) : null;
      if (FO.drawBignum(this, scr, x, y, value, red, r && r.to === value ? r : null) && key) this.rolls.delete(key);
    }

    draw(scr) {
      const g = this.g;
      [this.x, this.y] = FO.screenOrigin(scr, g);
      const d = this.dude;
      this.blit(scr, this.creation ? ART.CREATE : ART.EDIT, 0, 0);
      this.drawHeader(scr, d);
      const label = this.color('label');
      if (this.creation) {
        this.text(this.m('EDITOR', 116), 14, 286, label, 103);
        this.bignum(scr, 126, 282, d.charPoints | 0, false, 'points');
        this.text(this.m('EDITOR', 139), 52, 326, label, 103);
      } else {
        this.drawFolderTab(scr);
        this.drawLevel(scr, d);
      }
      this.text(this.m('EDITOR', this.creation ? 101 : 103), 363, 454, label, 103);
      this.text(this.m('EDITOR', 102), 571, 454, label, 103);
      this.text(this.m('EDITOR', 100), 475, 454, label, 103);
      this.drawSpecial(scr, d);
      this.drawHealth(scr, d);
      this.drawDerived(scr, d);
      this.drawSkills(scr, d);
      if (this.creation) this.drawTraits(scr, d);
      else this.drawFolderList(scr, d);
      this.drawCard(scr, d);
      this.drawButtons(scr);
      for (const b of this.holdButtons()) {
        const down = this.hold && this.hold.b.x === b.x && this.hold.b.y === b.y;
        this.blit(scr, down ? b.down : b.up, b.x, b.y);
      }
      if (!this.creation) {
        const f = this.art(ART.SLIDER);
        if (f) this.blit(scr, ART.SLIDER, 592, (lineHeight(g, 101) + 1) * this.ui.skillRow + 16);
      }
    }

    drawButtons(scr) {
      for (const b of this.buttons) {
        const header = b.id === 'name' || b.id === 'age' || b.id === 'sex';
        if (b.up < 0 && !header) continue;
        const pressed = this.pressed === b && b.contains(this.g.mouse.x - this.x, this.g.mouse.y - this.y);
        if (header) this.drawHeaderButton(scr, b.id, b.x, pressed);
        else this.blit(scr, pressed ? b.down : b.up, b.x, b.y);
      }
    }

    headerText(id) {
      const d = this.dude;
      if (id === 'age') return this.m('EDITOR', 104) + ' ' + FO.statValue(d, FO.STAT.AGE);
      if (id === 'sex') return this.m('EDITOR', 107 + FO.statValue(d, FO.STAT.GENDER));
      return FO.fitName(this.g.fonts[103], d.name || '', 100);
    }

    drawHeaderButton(scr, id, x, on) {
      const arts = { name: [ART.NAME_OFF, ART.NAME_ON, 3], age: [ART.AGE_OFF, ART.AGE_ON, 1], sex: [ART.SEX_OFF, ART.SEX_ON, 0] }[id];
      const art = on ? arts[1] : arts[0];
      const f = this.blit(scr, art, x, 0);
      if (!f) return;
      const font = this.g.fonts[103];
      const s = this.headerText(id);
      const color = this.color(on ? 'tabOff' : 'label');
      this.text(s, x + (f.w >> 1) + arts[2] - (font.width(s) >> 1), 6, color, 103);
    }

    drawHeader(scr) {
      if (this.creation) return;
      const [nw] = this.size(ART.NAME_OFF);
      const [aw] = this.size(ART.AGE_ON);
      this.drawHeaderButton(scr, 'name', 9, false);
      this.drawHeaderButton(scr, 'age', 9 + nw, false);
      this.drawHeaderButton(scr, 'sex', 9 + nw + aw, false);
    }

    drawFolderTab(scr) {
      const art = [ART.PERKS_FOLDER, ART.KARMA_FOLDER, ART.KILLS_FOLDER][this.ui.folder];
      const f = this.blit(scr, art, 11, 327);
      if (!f) return;
      const font = this.g.fonts[103];
      [[109, 61], [110, 159], [111, 257]].forEach(([id, cx], i) => {
        const s = this.m('EDITOR', id);
        const on = i === this.ui.folder;
        this.text(s, 11 + cx - (font.width(s) >> 1), 327 + (on ? 5 : 6), this.color(on ? 'label' : 'tabOff'), 103);
      });
    }

    drawLevel(scr, d) {
      const lh = lineHeight(this.g, 101) + 1;
      const c = sel => this.color(this.ui.sel === sel ? 'yellow' : 'green');
      const level = d.level || 1;
      this.text(this.m('EDITOR', 113) + ' ' + level, 32, 280, c(SEL.LEVEL), 101);
      this.text(this.m('EDITOR', 114) + ' ' + FO.thousands(d.exp | 0), 32, 280 + lh, c(SEL.EXP), 101);
      const next = level >= FO.MAX_LEVEL ? '------' : FO.thousands(FO.expForLevel(level + 1));
      this.text(this.m('EDITOR', 115) + ' ' + next, 32, 280 + 2 * lh, c(SEL.NEXT), 101);
    }

    drawSpecial(scr, d) {
      const green = this.color('green');
      for (let i = 0; i < 7; i++) {
        const y = SPECIAL_Y[i];
        if (this.creation) {
          const v = FO.baseWithTraits(d, i) + FO.statBonus(d, i);
          this.bignum(scr, 58, y, v, v > 10, 'stat' + i);
          const lv = Math.min(210, FO.statValue(d, i) + 199);
          this.text(this.m('EDITOR', lv), 103, y + 8, green, 101);
        } else {
          const v = FO.statValue(d, i);
          this.bignum(scr, 58, y, v, false);
          this.text(this.m('STAT', 300 + Math.max(1, Math.min(10, v))), 103, y + 8, green, 101);
        }
      }
    }

    drawHealth(scr, d) {
      const lh = lineHeight(this.g, 101) + 3;
      const sel = this.ui.sel;
      let y = 46;
      const max = FO.statValue(d, FO.STAT.MAX_HP);
      const hp = this.creation ? max : FO.statValue(d, FO.STAT.HP);
      this.text(this.m('EDITOR', 300) + '  ' + hp + '/' + max, 194, y, this.color(sel === SEL.HP ? 'yellow' : 'green'), 101);
      y += lh;
      const c = d.critter || {};
      const active = [(c.poison | 0) > 0, (c.rad | 0) > 0];
      CONDITIONS.forEach(([name, , , bit], i) => {
        const on = bit ? !!((c.results | 0) & bit) : active[i];
        const chosen = sel === SEL.HP + 1 + i;
        const color = chosen ? (on ? 'yellow' : 'inactiveSel') : (on ? 'green' : 'inactive');
        this.text(this.m('EDITOR', name), 194, y, this.color(color), 101);
        y += lh;
      });
    }

    drawDerived(scr, d) {
      const lh = lineHeight(this.g, 101) + 3;
      let y = 179;
      DERIVED.forEach(([name, stat, pct], i) => {
        const color = this.color(this.ui.sel === SEL.DERIVED + i ? 'yellow' : 'green');
        this.text(this.m('EDITOR', name), 194, y, color, 101);
        const v = FO.statValue(d, stat);
        this.text(pct ? v + '%' : String(v), 288, y, color, 101);
        y += lh;
      });
    }

    drawSkills(scr, d) {
      const label = this.color('label');
      this.text(this.m('EDITOR', 117), 380, 5, label, 103);
      if (this.creation) {
        this.text(this.m('EDITOR', 138), 422, 233, label, 103);
        this.bignum(scr, 522, 228, this.tagsLeft(), false, 'tags');
      } else {
        this.text(this.m('EDITOR', 112), 400, 233, label, 103);
        this.bignum(scr, 522, 228, Math.min(MAX_SKILL_POINTS_SHOWN + 1, d.skillPoints | 0), false, 'skillPoints');
      }
      const lh = lineHeight(this.g, 101) + 1;
      const selRow = this.ui.sel >= SEL.SKILL && this.ui.sel < SEL.SKILL_POINTS ? this.ui.sel - SEL.SKILL : -1;
      let y = 27;
      for (let i = 0; i < FO.SKILL_COUNT; i++) {
        const tagged = d.tags.includes(i);
        const color = this.color(i === selRow ? (tagged ? 'white' : 'yellow') : (tagged ? 'tagGray' : 'green'));
        this.text(this.m('SKILL', 100 + i), 380, y, color, 101);
        this.text(FO.skillValue(d, i) + '%', 573, y, color, 101);
        y += lh;
      }
    }

    drawTraits(scr, d) {
      const lh = lineHeight(this.g, 101);
      const step = Math.fround(lh + 3.56);
      const sel = this.ui.sel >= SEL.TRAIT && this.ui.sel < SEL.END ? this.ui.sel - SEL.TRAIT : -1;
      for (let col = 0; col < 2; col++) {
        let y = 353;
        for (let k = 0; k < 8; k++) {
          const t = col * 8 + k;
          const chosen = d.traits.includes(t);
          const color = t === sel ? (chosen ? 'white' : 'yellow') : (chosen ? 'tagGray' : 'green');
          this.text(this.m('TRAIT', 100 + t), col ? 199 : 47, Math.round(y), this.color(color), 101);
          y = Math.fround(y + step);
        }
      }
    }

    perkLines(d) {
      const out = [];
      for (let p = 0; p < FO.PERK_COUNT && out.length < FO.MAX_FREE_PERKS_OWNED; p++) {
        const r = FO.perkRank(d, p);
        if (r > 0) out.push({ p, text: r > 1 ? this.m('PERK', 101 + p) + ' (' + r + ')' : this.m('PERK', 101 + p) });
      }
      return out;
    }

    karmaLines(d) {
      const gv = this.p.sc ? this.p.sc.gvars : [];
      const out = [{ k: 0, text: this.m('EDITOR', 1000) + String(gv[REPUTATION_GVAR] | 0) }];
      for (let k = 1; k < KARMA_GVARS.length; k++) if ((gv[KARMA_GVARS[k]] | 0) !== 0) out.push({ k, text: this.m('EDITOR', 1001 + k) });
      return out;
    }

    killLines(d) {
      const out = [];
      for (let t = 0; t < KILL_TYPES_SHOWN; t++) {
        const n = d.kills ? d.kills[t] | 0 : 0;
        if (n > 0) out.push({ t, n, text: this.m('PROTO', 450 + t) });
      }
      return out.sort((a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0));
    }

    drawFolderList(scr, d) {
      const g = this.g;
      const lh = lineHeight(g, 101) + 1;
      const row = this.ui.sel >= SEL.FOLDER && this.ui.sel < SEL.HP ? this.ui.sel - SEL.FOLDER : -1;
      const c = r => this.color(r === row ? 'yellow' : 'green');
      if (this.ui.folder === FOLDER.PERKS) {
        let y = 364;
        this.perkLines(d).forEach((l, i) => {
          this.text(l.text, 34, y, c(i), 101);
          y += lh;
        });
        const ty = 7 * lh + 362;
        const s = this.m('EDITOR', 156);
        const sw = g.fonts[101].width(s);
        const x0 = (280 - sw) >> 1;
        const green = this.color('green');
        this.text(s, x0 + 31, ty, green, 101);
        const ly = ty + (lineHeight(g, 101) >> 1);
        this.line(scr, 34, ly, 134, green);
        this.line(scr, x0 + 68 + sw - 23, ly, x0 + 68 + sw + 74, green);
        let y2 = ty + lh;
        if (d.traits[0] !== -1) {
          this.text(this.m('TRAIT', 100 + d.traits[0]), 34, y2, c(8), 101);
          y2 += lh;
        }
        if (d.traits[1] !== -1) this.text(this.m('TRAIT', 100 + d.traits[1]), 34, y2, c(9), 101);
        return;
      }
      if (this.ui.folder === FOLDER.KARMA) {
        let y = 362;
        this.karmaLines(d).forEach((l, i) => {
          this.text(l.text, 34, y, c(i), 101);
          y += lh;
        });
        return;
      }
      const kills = this.killLines(d);
      kills.forEach((l, i) => {
        const col = i >= 10 ? 1 : 0;
        const y = 362 + (i - col * 10) * lh;
        this.text(l.text, col ? 191 : 34, y, c(i), 101);
        this.text(String(l.n), col ? 293 : 136, y, c(i), 101);
      });
    }

    line(scr, x1, y, x2, color) {
      scr.rect(this.x + x1, this.y + y, x2 - x1 + 1, 1, color);
    }

    cardInfo(d) {
      const sel = this.ui.sel;
      const st = n => [this.statArt(n), this.m('STAT', 100 + n), this.m('STAT', 200 + n)];
      if (sel < 0 || sel >= SEL.END) return null;
      if (sel < 7) return st(sel);
      if (sel < SEL.FOLDER) {
        if (this.creation) return sel === SEL.LEVEL ? [7, this.m('EDITOR', 120), this.m('EDITOR', 121)] : null;
        if (sel === SEL.LEVEL) return [7, this.m('STAT', 401), this.m('STAT', 501)];
        if (sel === SEL.EXP) return [8, this.m('STAT', 402), this.m('STAT', 502)];
        return [9, this.m('EDITOR', 122), this.m('EDITOR', 123)];
      }
      if (sel === SEL.TRAITS) return [54, this.m('EDITOR', 146), this.m('EDITOR', 147)];
      if (sel >= SEL.TRAIT) return this.traitCard(sel - SEL.TRAIT);
      if (sel < SEL.HP) return this.folderCard(d, sel - SEL.FOLDER);
      if (sel === SEL.HP) return [this.statArt(FO.STAT.MAX_HP), this.m('EDITOR', 300), this.m('STAT', 200 + FO.STAT.MAX_HP)];
      if (sel < SEL.DERIVED) {
        const [name, desc, art] = CONDITIONS[sel - SEL.HP - 1];
        return [art, this.m('EDITOR', name), this.m('EDITOR', desc)];
      }
      if (sel < SEL.SKILL) {
        const i = Math.min(9, sel - SEL.DERIVED);
        const stat = DERIVED[i][1];
        return [DERIVED_ART[i], this.m('STAT', 100 + stat), this.m('STAT', 200 + stat)];
      }
      if (sel < SEL.SKILL_POINTS) {
        const k = Math.min(17, sel - SEL.SKILL);
        const row = FO.skillRow(k);
        const rank = this.m('EDITOR', 137) + ' ' + row[0] + '% ' + this.m('SKILL', 300 + k);
        return [row[7], this.m('SKILL', 100 + k), this.m('SKILL', 200 + k), rank];
      }
      if (sel === SEL.SKILL_POINTS) return this.creation ? [27, this.m('EDITOR', 144), this.m('EDITOR', 145)] : [27, this.m('EDITOR', 130), this.m('EDITOR', 131)];
      return [27, this.m('EDITOR', 150), this.m('EDITOR', 151)];
    }

    statArt(n) {
      const r = FO.EXE.stats[n];
      return r ? r[3] : 0;
    }

    traitCard(t) {
      return [55 + t, this.m('TRAIT', 100 + t), this.m('TRAIT', 200 + t)];
    }

    folderCard(d, row) {
      if (this.ui.folder === FOLDER.PERKS) {
        const perks = this.perkLines(d);
        if (row < 7 || row > 11) {
          if (perks.length && row < perks.length) {
            const p = perks[row].p;
            return [72 + p, this.m('PERK', 101 + p), this.m('PERK', 201 + p)];
          }
          return [71, this.m('EDITOR', 124), this.m('EDITOR', 127)];
        }
        const empty = this.traitSlotsLeft();
        const k = row - 8;
        if (empty > 1 || k < 0 || k >= 2) return [54, this.m('EDITOR', 146), this.m('EDITOR', 147)];
        const slot = k === 1 && empty === 1 ? 0 : k;
        return this.traitCard(d.traits[slot]);
      }
      if (this.ui.folder === FOLDER.KARMA) {
        const lines = this.karmaLines(d);
        if (row >= lines.length) return [47, this.m('EDITOR', 125), this.m('EDITOR', 128)];
        let k = 0;
        if (row > 0) {
          const gv = this.p.sc ? this.p.sc.gvars : [];
          let n = 0;
          k = 0;
          for (let i = 0; i < KARMA_GVARS.length; i++) {
            if ((gv[KARMA_GVARS[i]] | 0) === 0) continue;
            if (n === row - 1) {
              k = i;
              break;
            }
            n++;
          }
          k += 1;
        }
        return [KARMA_ART[k], this.m('EDITOR', 1000 + k), this.m('EDITOR', 1100 + k)];
      }
      const kills = this.killLines(d);
      if (row < kills.length) return [46, this.killTitle(kills[row].text), this.m('PROTO', 465 + kills[row].t)];
      return [46, this.m('EDITOR', 126), this.m('EDITOR', 129)];
    }

    drawCard(scr, d) {
      const info = this.cardInfo(d);
      if (!info) return;
      const [art, title, text, rank] = info;
      FO.drawCard(this, scr, { art, title, text, rank, artX: CARD.artX, artY: CARD.artY, x: CARD.titleX, y: CARD.titleY, lineX2: CARD.lineX2, textY: CARD.textY, textW: CARD.textW });
    }
  }

  FO.drawBignum = function (win, scr, x, y, value, red, roll) {
    const nums = win.art(ART.BIGNUM);
    if (!nums) return true;
    const half = red ? nums.w >> 1 : 0;
    const glyph = (g, px) => scr.blitPart(nums, half + g * DIGIT_W, 0, DIGIT_W, DIGIT_H, win.x + px, win.y + y);
    if (value > 99 || value < 0) {
      glyph(9, x);
      glyph(9, x + DIGIT_W);
      return true;
    }
    let tens = Math.trunc(value / 10);
    let ones = value % 10;
    let over = true;
    if (roll && roll.from >= 0 && roll.from <= 99) {
      const t = win.clock - roll.at;
      const onesEnd = roll.from % 10 !== ones ? ROLL_MS : 0;
      const tensEnd = onesEnd + (Math.trunc(roll.from / 10) !== tens ? ROLL_MS : 0);
      if (t < onesEnd) {
        ones = ROLL_GLYPH;
        tens = Math.trunc(roll.from / 10);
        over = false;
      } else if (t < tensEnd) {
        tens = ROLL_GLYPH;
        over = false;
      }
    }
    glyph(tens, x);
    glyph(ones, x + DIGIT_W);
    return over;
  };

  FO.drawCard = function (win, scr, c) {
    const g = win.g;
    const black = g.color(0, 0, 0);
    const pic = g.art.get(FO.fid(FO.ART.SKILLDEX, c.art));
    let left = 150;
    if (pic) {
      const f = pic.dirs[0].frames[0];
      scr.blit(f, win.x + c.artX, win.y + c.artY);
      if (!f.darkLeft) f.darkLeft = FO.leftDarkColumn(g, f, 150) + 1;
      left = f.darkLeft - 1;
    }
    const tf = g.fonts[102];
    const lh102 = lineHeight(g, 102);
    const lh101 = lineHeight(g, 101);
    win.text(c.title, c.x, c.y, black, 102);
    if (c.rank) win.text(c.rank, c.x + (tf ? tf.width(c.title) : 0) + 8, c.y + lh102 - 4 - lh101, black, 101);
    scr.rect(win.x + c.x, win.y + c.y + lh102, c.lineX2 - c.x + 1, 1, black);
    scr.rect(win.x + c.x, win.y + c.y + lh102 + 1, c.lineX2 - c.x + 1, 1, black);
    const lines = g.fonts[101].wrap(c.text || '', left + c.textW);
    lines.forEach((l, i) => win.text(l, c.x, c.textY + i * (lh101 + 1), black, 101));
    const key = c.art + '|' + c.title;
    if (win.lastCard !== null && win.lastCard !== undefined && win.lastCard !== key && win.sound) win.sound('isdxxxx1');
    win.lastCard = key;
  };

  FO.isPlusKey = e => e.code === 'ArrowRight' || e.key === '+' || e.key === 'N';
  FO.isMinusKey = e => e.code === 'ArrowLeft' || e.key === '-' || e.key === 'J';

  FO.fitName = function (font, name, max) {
    if (!font || font.width(name) <= max) return name;
    let n = 0;
    let spaced = false;
    while (n < 40 && n < name.length) {
      if (name[n] === ' ') spaced = true;
      if (font.width(name.slice(0, n + 1)) > max) break;
      n++;
    }
    let s = name.slice(0, n);
    if (spaced) {
      let k = n;
      if (name[k - 1] !== ' ') {
        k--;
        while (k > 1 && name[k] !== ' ') k--;
      } else {
        k--;
      }
      s = name.slice(0, k);
    }
    return s;
  };

  class SubDialog extends FO.Win {
    constructor(host, editor, x) {
      super(host);
      this.editor = editor;
      this.overBar = true;
      this.ox = x;
      this.button({ id: 'done', x: 26, y: 44, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, onClick: () => this.finish() });
    }

    sound(name) {
      FO.uiSound(this.g, name);
    }

    place(scr) {
      this.x = this.editor.x + this.ox;
      this.y = this.editor.y;
    }

    finish() {
      this.close();
    }

    keyDown(e) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        this.sound('ib1p1xx1');
        this.finish();
        return true;
      }
      if (e.code === 'Escape') {
        this.cancel();
        return true;
      }
      return false;
    }

    cancel() {
      this.finish();
    }

    drawFrame(scr, doneX, doneY, labelX, labelY) {
      this.blit(scr, ART.CHAR_WIN, 0, 0);
      this.blit(scr, ART.DONE_BOX, doneX, doneY);
      this.text(this.editor.m('EDITOR', 100), labelX, labelY, this.color('label'), 103);
    }
  }

  class NameDialog extends SubDialog {
    constructor(host, editor) {
      super(host, editor, 17);
      const n = editor.dude.name || '';
      this.value = n === 'None' ? '' : n;
      this.blinkAt = 0;
      this.blink = true;
      this.clock = 0;
    }

    update(dt) {
      this.clock += dt * 1000;
      if (this.clock - this.blinkAt >= 3 * FRAME_MS) {
        this.blinkAt = this.clock;
        this.blink = !this.blink;
      }
    }

    finish() {
      if (this.value) this.editor.dude.name = this.value;
      this.close();
    }

    cancel() {
      this.close();
    }

    keyDown(e) {
      if (e.code === 'Backspace' || e.code === 'Delete') {
        this.value = this.value.slice(0, -1);
        return true;
      }
      if (e.key && e.key.length === 1) {
        const c = e.key.charCodeAt(0);
        if (c >= 0x20 && c <= 0x7A && this.value.length < 11) this.value += e.key;
        return true;
      }
      return super.keyDown(e);
    }

    draw(scr) {
      this.place(scr);
      this.drawFrame(scr, 13, 40, 50, 44);
      this.blit(scr, ART.NAME_BOX, 13, 13);
      const green = this.color('green');
      this.text(this.value, 23, 19, green, 101);
      if (this.blink) {
        const f = this.g.fonts[101];
        this.text('_', 23 + f.width(this.value) + (this.value ? f.gap : 0), 19, green, 101);
      }
      this.drawButtons(scr);
    }
  }

  class AgeDialog extends SubDialog {
    constructor(host, editor) {
      const [nw] = editor.size(ART.NAME_OFF);
      super(host, editor, nw + 9);
      this.clock = 0;
      this.hold = null;
      this.roll = null;
    }

    arrows() {
      const [lw, lh] = this.editor.size(ART.LEFT_DOWN);
      const [rw, rh] = this.editor.size(ART.RIGHT_DOWN);
      return [
        { x: 105, y: 13, w: rw, h: rh, up: ART.RIGHT_UP, down: ART.RIGHT_DOWN, dir: 1 },
        { x: 19, y: 13, w: lw, h: lh, up: ART.LEFT_UP, down: ART.LEFT_DOWN, dir: -1 }
      ];
    }

    step(dir) {
      const d = this.editor.dude;
      const before = FO.statValue(d, FO.STAT.AGE);
      const ok = FO.setBaseStat(d, FO.STAT.AGE, FO.baseWithTraits(d, FO.STAT.AGE) + dir) >= 0;
      if (ok) this.roll = { from: before, to: FO.statValue(d, FO.STAT.AGE), at: this.clock };
      return ok;
    }

    keyDown(e) {
      if (FO.isPlusKey(e)) {
        this.step(1);
        return true;
      }
      if (FO.isMinusKey(e)) {
        this.step(-1);
        return true;
      }
      return super.keyDown(e);
    }

    mouseDown(m, button) {
      if (button !== 0) return;
      for (const a of this.arrows()) {
        const lx = m.x - this.x;
        const ly = m.y - this.y;
        if (lx >= a.x && ly >= a.y && lx < a.x + a.w && ly < a.y + a.h) {
          const rep = new HoldRepeat(HOLD, () => this.step(a.dir));
          rep.next = this.clock;
          this.hold = { a, rep };
          rep.tick(this.clock);
          return;
        }
      }
      super.mouseDown(m, button);
    }

    mouseUp(m, button) {
      if (button === 0 && this.hold) {
        this.hold = null;
        return;
      }
      super.mouseUp(m, button);
    }

    update(dt) {
      this.clock += dt * 1000;
      if (this.hold) {
        const a = this.hold.a;
        const lx = this.g.mouse.x - this.x;
        const ly = this.g.mouse.y - this.y;
        if (!(lx >= a.x && ly >= a.y && lx < a.x + a.w && ly < a.y + a.h)) this.hold = null;
        else this.hold.rep.tick(this.clock);
      }
    }

    draw(scr) {
      this.place(scr);
      this.blit(scr, ART.CHAR_WIN, 0, 0);
      this.blit(scr, ART.AGE_BOX, 8, 7);
      this.blit(scr, ART.DONE_BOX, 13, 40);
      this.text(this.editor.m('EDITOR', 100), 50, 44, this.color('label'), 103);
      const age = FO.statValue(this.editor.dude, FO.STAT.AGE);
      if (FO.drawBignum(this, scr, 55, 10, age, false, this.roll && this.roll.to === age ? this.roll : null)) this.roll = null;
      for (const a of this.arrows()) this.blit(scr, this.hold && this.hold.a === a ? a.down : a.up, a.x, a.y);
      this.drawButtons(scr);
    }
  }

  class SexDialog extends SubDialog {
    constructor(host, editor) {
      const [nw] = editor.size(ART.NAME_OFF);
      const [aw] = editor.size(ART.AGE_ON);
      super(host, editor, nw + aw + 9);
      this.buttons[0].x = 28;
      this.buttons[0].y = 48;
      this.button({ id: 'male', x: 22, y: 2, up: ART.MALE_OFF, down: ART.MALE_ON, onClick: () => this.pick(0) });
      this.button({ id: 'female', x: 71, y: 3, up: ART.FEMALE_OFF, down: ART.FEMALE_ON, onClick: () => this.pick(1) });
    }

    async enter() {
      for (const b of this.buttons) {
        const f = this.art(b.up);
        if (f) {
          b.w = f.w;
          b.h = f.h;
        }
      }
    }

    pick(gender) {
      FO.setBaseStat(this.editor.dude, FO.STAT.GENDER, gender);
      FO.textGender = gender === 1 ? 1 : 0;
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (this.pressed && (this.pressed.id === 'male' || this.pressed.id === 'female')) {
        const b = this.pressed;
        this.pressed = null;
        if (b.onClick) b.onClick(b);
      }
    }

    draw(scr) {
      this.place(scr);
      this.drawFrame(scr, 15, 44, 52, 48);
      const gender = FO.statValue(this.editor.dude, FO.STAT.GENDER);
      for (const b of this.buttons) {
        if (b.id === 'male') this.blit(scr, gender === 0 ? b.down : b.up, b.x, b.y);
        else if (b.id === 'female') this.blit(scr, gender === 1 ? b.down : b.up, b.x, b.y);
      }
      const done = this.buttons[0];
      const down = this.pressed === done && done.contains(this.g.mouse.x - this.x, this.g.mouse.y - this.y);
      this.blit(scr, down ? done.down : done.up, done.x, done.y);
    }
  }

  FO.CharacterScreen = CharacterScreen;
})(globalThis.FO = globalThis.FO || {});
