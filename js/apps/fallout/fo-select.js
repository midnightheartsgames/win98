(function (FO) {
  'use strict';

  const ART = { BACK: 174, PREV_UP: 122, PREV_DOWN: 123, NEXT_UP: 124, NEXT_DOWN: 125, BUTTON_UP: 8, BUTTON_DOWN: 9, CURSOR: 267 };
  const PORTRAIT = { cx: 150, bottom: 240, vidY: 252 };
  const PANEL = { nameX: 318, top: 40, statX: 348, splitX: 365 };
  const BIO = { x: 420, top: 40, bottom: 260 };
  const MISC_MSG = { AP: 15, HP: 16 };
  const S = FO.STAT;

  class CharSelect extends FO.Win {
    constructor(g, world, onStart) {
      super({ g });
      this.w = world;
      this.onStart = onStart;
      this.modals = [];
      this.index = 0;
      this.msgs = {};
      this.bios = [];
      this.drawCursor = true;
      this.sc = null;
      this.button({ id: 'prev', x: 292, y: 320, up: ART.PREV_UP, down: ART.PREV_DOWN, sound: 'ib2', onClick: () => this.turn(-1) });
      this.button({ id: 'next', x: 318, y: 320, up: ART.NEXT_UP, down: ART.NEXT_DOWN, sound: 'ib2', onClick: () => this.turn(1) });
      this.button({ id: 'take', x: 81, y: 323, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, key: 'KeyT', onClick: () => this.start() });
      this.button({ id: 'modify', x: 435, y: 320, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, key: 'KeyM', onClick: () => this.edit(false) });
      this.button({ id: 'create', x: 80, y: 425, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, key: 'KeyC', onClick: () => this.edit(true) });
      this.button({ id: 'back', x: 461, y: 425, up: ART.BUTTON_UP, down: ART.BUTTON_DOWN, key: ['Escape', 'KeyB'], onClick: () => FO.showMainMenu(this.g) });
    }

    async enter() {
      const g = this.g;
      for (const name of ['STAT', 'MISC', 'SKILL', 'TRAIT']) {
        const path = FO.textPath('GAME\\' + name + '.MSG');
        this.msgs[name] = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      }
      const premades = FO.EXE.premades;
      await g.art.loadAll([...Object.values(ART), ...premades.map(p => p[1])].map(FO.IFACE));
      for (const b of this.buttons) {
        const f = this.art(b.up);
        if (f) {
          b.w = f.w;
          b.h = f.h;
        }
      }
      for (const [path] of premades) {
        const bio = path + '.BIO';
        this.bios.push(g.data.has(bio) ? (await g.data.text(bio)).split(/\r?\n/) : []);
      }
      await this.load();
    }

    m(file, id) {
      const e = this.msgs[file] && this.msgs[file].get(id);
      return e ? e.text : '';
    }

    load() {
      return FO.loadPremade(this.g.data, this.w.dude, FO.EXE.premades[this.index][0]);
    }

    turn(dir) {
      const n = FO.EXE.premades.length;
      this.index = (this.index + dir + n) % n;
      this.load();
    }

    start() {
      if (this.onStart) this.onStart();
    }

    edit(blank) {
      if (blank) FO.resetDude(this.w.dude);
      const ed = new FO.CharacterScreen(this, true);
      ed.onClose = ok => {
        if (ok) this.start();
        else this.load();
      };
      this.openModal(ed);
    }

    openModal(win) {
      this.modals.push(win);
      if (win.enter) win.enter();
      return win;
    }

    closeModal(win) {
      const i = this.modals.indexOf(win);
      if (i >= 0) this.modals.splice(i, 1);
      if (win.leave) win.leave();
    }

    top() {
      return this.modals[this.modals.length - 1] || null;
    }

    update(dt) {
      for (const m of this.modals.slice()) if (m.update) m.update(dt);
    }

    mouseDown(m, button) {
      const t = this.top();
      if (t) {
        if (t.mouseDown) t.mouseDown(m, button);
        return;
      }
      super.mouseDown(m, button);
    }

    mouseUp(m, button) {
      const t = this.top();
      if (t) {
        if (t.mouseUp) t.mouseUp(m, button);
        return;
      }
      super.mouseUp(m, button);
    }

    keyDown(e) {
      const t = this.top();
      if (t) return t.keyDown ? t.keyDown(e) : false;
      if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        FO.uiSound(this.g, 'ib2p1xx1');
        this.turn(e.code === 'ArrowLeft' ? -1 : 1);
        return true;
      }
      return super.keyDown(e);
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr);
      this.x = ox;
      this.y = oy;
      scr.fill(0);
      this.blit(scr, ART.BACK, 0, 0);
      this.drawPortrait(scr);
      this.drawStats(scr);
      this.drawBio(scr);
      this.drawButtons(scr);
      for (const m of this.modals) m.draw(scr);
      if (g.mouse.inside) {
        const f = FO.frameOfArt(g, ART.CURSOR);
        if (f) scr.blit(f, g.mouse.x, g.mouse.y);
      }
    }

    drawPortrait(scr) {
      const [, art, number] = FO.EXE.premades[this.index];
      const vid = FO.tr(this.g, number);
      const f = this.art(art);
      if (f) {
        const x = this.x + PORTRAIT.cx - (f.w >> 1);
        const y = this.y + PORTRAIT.bottom - f.h;
        for (let row = 0; row < f.h; row += 2) scr.blitPart(f, 0, row, f.w, 1, x, y + row);
      }
      const font = this.g.fonts[101];
      this.text(vid, PORTRAIT.cx - (font.width(vid) >> 1), PORTRAIT.vidY, this.color('green'), 101);
    }

    right(s, x, y) {
      const font = this.g.fonts[101];
      this.text(s, x - font.width(s), y, this.color('green'), 101);
    }

    pair(label, value, x, y) {
      this.right(label, x, y);
      this.text(value, x, y, this.color('green'), 101);
    }

    drawStats(scr) {
      const g = this.g;
      const d = this.w.dude;
      const font = g.fonts[101];
      const lh = font.height + font.lineGap;
      const green = this.color('green');
      const name = d.name || '';
      this.text(name, PANEL.nameX - (font.width(name) >> 1), PANEL.top, green, 101);
      let y = PANEL.top + 2 * lh;
      for (let i = 0; i < 7; i++) {
        const v = FO.statValue(d, i);
        this.pair(this.m('STAT', 100 + i) + ' ' + String(v).padStart(2, '0'), '  ' + this.m('STAT', 300 + Math.max(1, Math.min(10, v))), PANEL.statX, y);
        y += lh;
      }
      y += lh;
      this.pair(this.m('MISC', MISC_MSG.HP), ' ' + FO.statValue(d, S.HP) + '/' + FO.statValue(d, S.MAX_HP), PANEL.splitX, y);
      y += lh;
      this.pair(this.m('STAT', 100 + S.AC), ' ' + FO.statValue(d, S.AC), PANEL.splitX, y);
      y += lh;
      this.pair(this.m('MISC', MISC_MSG.AP), ' ' + FO.statValue(d, S.MAX_AP), PANEL.splitX, y);
      y += lh;
      this.pair(this.m('STAT', 100 + S.MELEE_DMG), ' ' + FO.statValue(d, S.MELEE_DMG), PANEL.splitX, y);
      y += lh;
      for (let k = 0; k < 3; k++) {
        y += lh;
        const s = d.tags[k];
        if (s >= 0) this.pair(this.m('SKILL', 100 + s), ' ' + FO.skillValue(d, s) + '%', PANEL.splitX, y);
      }
      for (let k = 0; k < 2; k++) {
        y += lh;
        const t = d.traits[k];
        if (t >= 0) this.right(this.m('TRAIT', 100 + t), PANEL.splitX, y);
      }
    }

    drawBio(scr) {
      const font = this.g.fonts[101];
      const lh = font.height + font.lineGap;
      const green = this.color('green');
      let y = BIO.top;
      for (const line of this.bios[this.index] || []) {
        if (y >= BIO.bottom) break;
        this.text(line, BIO.x, y, green, 101);
        y += lh;
      }
    }
  }

  FO.CharSelect = CharSelect;
})(globalThis.FO = globalThis.FO || {});
