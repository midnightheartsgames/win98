(function (FO) {
  'use strict';

  const ART = { BACK: 86, BUTTON_UP: 8, BUTTON_DOWN: 9, UP_OFF: 199, UP_ON: 200, DOWN_OFF: 181, DOWN_ON: 182 };
  const ORIGIN = [33, 91];
  const LIST = { x: 45, y: 43, w: 192, h: 129, rankX: 207, rows: 11 };
  const CARD = { artX: 413, artY: 64, x: 280, y: 27, lineX2: 545, textY: 70, textW: 133 };
  const TITLE = { perk: 152, pick: 153, lose: 154, tag: 155 };
  const HOLD = 14.4;
  const DOUBLE_CLICK_MS = 700;
  const P = FO.PERK;

  const byText = (a, b) => (a.text < b.text ? -1 : a.text > b.text ? 1 : 0);

  class PerkPicker extends FO.Win {
    constructor(host, editor) {
      super(host);
      this.editor = editor;
      this.overBar = true;
      this.clock = 0;
      this.hold = null;
      this.clickRow = -2;
      this.clickReset = 0;
      this.lastCard = null;
      this.ownedTraits = 0;
      this.button({ id: 'done', x: 48, y: 186, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, onClick: () => this.accept() });
      this.button({ id: 'cancel', x: 153, y: 186, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, onClick: () => this.cancel() });
      this.perkPhase();
    }

    get dude() {
      return this.editor.dude;
    }

    m(file, id) {
      return this.editor.m(file, id);
    }

    sound(name) {
      FO.uiSound(this.g, name);
    }

    async enter() {
      await this.g.art.loadAll(Object.values(ART).map(FO.IFACE));
      for (const b of this.buttons) {
        const f = this.art(b.up);
        if (f) {
          b.w = f.w;
          b.h = f.h;
        }
      }
    }

    reset(phase, list, count) {
      this.phase = phase;
      this.list = list;
      this.count = count === undefined ? list.length : count;
      this.top = 0;
      this.sel = 0;
      this.clickRow = -2;
    }

    perkPhase() {
      const d = this.dude;
      const list = FO.perkList(d).map(p => ({ id: p, text: this.m('PERK', 101 + p) })).sort(byText);
      this.reset('perk', list);
    }

    tagPhase() {
      const d = this.dude;
      const list = [];
      for (let i = 0; i < FO.SKILL_COUNT; i++) if (!d.tags.includes(i)) list.push({ id: i, text: this.m('SKILL', 100 + i) });
      this.reset('tag', list.sort(byText));
    }

    losePhase() {
      const d = this.dude;
      const list = d.traits.map(t => ({ id: t, text: this.m('TRAIT', 100 + t) }));
      const shown = list.slice(0, this.ownedTraits);
      if (this.ownedTraits > 1) shown.sort(byText);
      this.reset('lose', shown, this.ownedTraits);
    }

    pickPhase() {
      const original = this.editor.saved.traits;
      const list = [];
      for (let t = 0; t < FO.TRAIT_COUNT; t++) if (!original.includes(t)) list.push({ id: t, text: this.m('TRAIT', 100 + t) });
      this.reset('pick', list.sort(byText), Math.min(FO.TRAIT_COUNT, FO.TRAIT_COUNT - this.ownedTraits));
    }

    current() {
      return this.list[this.top + this.sel] || null;
    }

    accept() {
      const d = this.dude;
      const saved = this.editor.saved.perks;
      const item = this.current();
      if (this.phase === 'perk') {
        if (!item || FO.perkAdd(d, item.id) === -1) {
          this.finish(false);
          return;
        }
        if (FO.perkRank(d, P.TAG) && !(saved[P.TAG] | 0)) {
          this.tagPhase();
          return;
        }
        if (FO.perkRank(d, P.MUTATE) && !(saved[P.MUTATE] | 0)) {
          this.ownedTraits = 2 - this.trailingEmptyTraits();
          if (this.ownedTraits >= 1) this.losePhase();
          else this.pickPhase();
          return;
        }
        if (FO.perkRank(d, P.LIFEGIVER) !== (saved[P.LIFEGIVER] | 0)) {
          FO.addBonusStat(d, FO.STAT.MAX_HP, 4);
          if (d.critter) d.critter.hp = Math.min((d.critter.hp | 0) + 4, FO.statValue(d, FO.STAT.MAX_HP));
        } else if (FO.perkRank(d, P.EDUCATED) !== (saved[P.EDUCATED] | 0)) {
          d.skillPoints = (d.skillPoints | 0) + 2;
        }
        this.finish(true);
        return;
      }
      if (this.phase === 'tag') {
        if (item) d.tags[3] = item.id;
        this.finish(true);
        return;
      }
      if (this.phase === 'lose') {
        this.loseTrait(item);
        this.pickPhase();
        return;
      }
      if (item) {
        if (this.ownedTraits === 0) {
          d.traits[0] = item.id;
          d.traits[1] = -1;
        } else {
          d.traits[1] = item.id;
        }
      }
      this.finish(true);
    }

    trailingEmptyTraits() {
      const t = this.dude.traits;
      let n = 0;
      for (let i = 1; i >= 0 && t[i] === -1; i--) n++;
      return n;
    }

    loseTrait(item) {
      const t = this.dude.traits;
      const first = this.list[0];
      if (this.sel === 0) {
        if (this.ownedTraits === 1) {
          t[0] = -1;
          t[1] = -1;
        } else if (first && first.id === t[0]) {
          t[0] = t[1];
          t[1] = -1;
        } else {
          t[1] = -1;
        }
        return;
      }
      if (first && first.id === t[0]) {
        t[1] = -1;
      } else {
        t[0] = t[1];
        t[1] = -1;
      }
    }

    cancel() {
      const d = this.dude;
      if (this.phase === 'tag') {
        d.tags = this.editor.saved.tags.slice();
        FO.perkSub(d, P.TAG);
      } else if (this.phase === 'lose' || this.phase === 'pick') {
        d.traits = this.editor.saved.traits.slice();
        FO.perkSub(d, P.MUTATE);
      }
      this.finish(false);
    }

    finish(ok) {
      const d = this.dude;
      if (ok) d.freePerk = false;
      FO.recalcDerived(d);
      this.close();
    }

    up() {
      this.clickRow = -2;
      this.top--;
      if (this.top < 0) {
        this.top = 0;
        this.sel = Math.max(0, this.sel - 1);
      }
    }

    down() {
      this.clickRow = -2;
      if (this.count > LIST.rows) {
        this.top++;
        if (this.top > this.count - LIST.rows) {
          this.top = this.count - LIST.rows;
          this.sel = Math.min(LIST.rows - 1, this.sel + 1);
        }
      } else {
        this.sel = Math.min(this.count - 1, this.sel + 1);
      }
    }

    rowHeight() {
      const f = this.g.fonts[101];
      return f.height + f.lineGap + 2;
    }

    arrows() {
      const u = this.art(ART.UP_ON);
      const dn = this.art(ART.DOWN_ON);
      const uh = u ? u.h : 0;
      return [
        { x: 25, y: 46, w: u ? u.w : 0, h: uh, up: ART.UP_OFF, down: ART.UP_ON, run: () => this.up() },
        { x: 25, y: 47 + uh, w: dn ? dn.w : 0, h: dn ? dn.h : 0, up: ART.DOWN_OFF, down: ART.DOWN_ON, run: () => this.down() }
      ];
    }

    keyDown(e) {
      switch (e.code) {
        case 'Enter':
        case 'NumpadEnter':
          this.sound('ib1p1xx1');
          this.accept();
          return true;
        case 'Escape':
          this.cancel();
          return true;
        case 'ArrowUp':
          this.up();
          return true;
        case 'ArrowDown':
          this.down();
          return true;
        case 'Home':
          this.clickRow = -2;
          this.top = 0;
          this.sel = 0;
          return true;
        case 'End':
          this.clickRow = -2;
          if (this.count > LIST.rows) {
            this.top = this.count - LIST.rows;
            this.sel = LIST.rows - 1;
          } else {
            this.sel = Math.max(0, this.count - 1);
          }
          return true;
        default:
          return super.keyDown(e);
      }
    }

    mouseDown(m, button) {
      if (button !== 0) return;
      const lx = m.x - this.x;
      const ly = m.y - this.y;
      for (const a of this.arrows()) {
        if (lx >= a.x && ly >= a.y && lx < a.x + a.w && ly < a.y + a.h) {
          const rep = new FO.HoldRepeat(HOLD, a.run);
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
      if (button !== 0) return;
      const lx = m.x - this.x;
      const ly = m.y - this.y;
      if (lx < LIST.x || ly < LIST.y || lx >= LIST.x + LIST.w || ly >= LIST.y + LIST.h) return;
      const row = Math.max(0, Math.min(this.count - 1, Math.trunc((ly - LIST.y) / this.rowHeight())));
      this.sel = row;
      if (this.clickRow === row) {
        this.sound('ib1p1xx1');
        this.accept();
        return;
      }
      this.clickRow = row;
    }

    update(dt) {
      this.clock += dt * 1000;
      if (this.clock - this.clickReset > DOUBLE_CLICK_MS) {
        this.clickReset = this.clock;
        this.clickRow = -2;
      }
      if (this.hold) {
        const a = this.hold.a;
        const lx = this.g.mouse.x - this.x;
        const ly = this.g.mouse.y - this.y;
        if (!(lx >= a.x && ly >= a.y && lx < a.x + a.w && ly < a.y + a.h)) this.hold = null;
        else this.hold.rep.tick(this.clock);
      }
    }

    cardInfo() {
      const item = this.current();
      if (!item) return null;
      const d = this.dude;
      if (this.phase === 'perk') {
        const r = FO.perkRank(d, item.id);
        return [72 + item.id, item.text, this.m('PERK', 201 + item.id), r ? '(' + r + ')' : ''];
      }
      if (this.phase === 'tag') return [FO.skillRow(item.id)[7], item.text, this.m('SKILL', 200 + item.id)];
      return [55 + item.id, item.text, this.m('TRAIT', 200 + item.id)];
    }

    draw(scr) {
      const ed = this.editor;
      this.x = ed.x + ORIGIN[0];
      this.y = ed.y + ORIGIN[1];
      this.blit(scr, ART.BACK, 0, 0);
      const label = this.color('label');
      this.text(this.m('EDITOR', TITLE[this.phase]), 49, 16, label, 103);
      this.text(this.m('EDITOR', 100), 69, 186, label, 103);
      this.text(this.m('EDITOR', 102), 171, 186, label, 103);
      const rh = this.rowHeight();
      const d = this.dude;
      const from = this.phase === 'lose' ? 0 : this.top;
      const rows = this.phase === 'lose' ? this.list.length : Math.min(LIST.rows, this.list.length - this.top);
      for (let k = 0; k < rows; k++) {
        const item = this.list[from + k];
        const on = this.phase === 'lose' ? k === this.sel : from + k === this.top + this.sel;
        const color = this.color(on ? 'yellow' : 'green');
        const y = LIST.y + k * rh;
        this.text(item.text, LIST.x, y, color, 101);
        if (this.phase === 'perk') {
          const r = FO.perkRank(d, item.id);
          if (r) this.text('(' + r + ')', LIST.rankX, y, color, 101);
        }
      }
      const info = this.cardInfo();
      if (info) FO.drawCard(this, scr, Object.assign({ art: info[0], title: info[1], text: info[2], rank: info[3] }, CARD));
      this.drawButtons(scr);
      for (const a of this.arrows()) this.blit(scr, this.hold && this.hold.a.y === a.y ? a.down : a.up, a.x, a.y);
    }
  }

  FO.PerkPicker = PerkPicker;
})(globalThis.FO = globalThis.FO || {});
