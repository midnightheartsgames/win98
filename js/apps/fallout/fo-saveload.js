(function (FO) {
  'use strict';

  const ART = { BACK: 237, BOX: 238, COVER: 239, RED_UP: 8, RED_DOWN: 9, DOWN_OFF: 181, DOWN_ON: 182, UP_OFF: 199, UP_ON: 200, ARROW: 267 };
  const MSG = {
    LOAD: 100, QUICK_LOAD: 101, SAVE: 102, QUICK_SAVE: 103, DONE: 104, CANCEL: 105, LIST_ERROR: 106, DIR: 107, DIR_BAD: 108,
    SLOT_SAVE: 109, SLOT_LOAD: 110, EMPTY: 111, CORRUPT: 112, OLD: 113, INFO_EMPTY: 114, INFO_ERROR: 115, INFO_OLD: 116,
    MONTH: 116, DESCRIPTION: 130, OVERWRITE: 131, SAVE_ERROR: 132, SAVE_FAIL: 133, LOAD_ERROR: 134, LOAD_FAIL: 135, LOAD_OLD: 136
  };
  const MISC = { QUIT: 0 };
  const KIND = { SAVE: 0, QUICK_SAVE: 1, LOAD: 2, MENU_LOAD: 3, QUICK_LOAD: 4 };
  const TITLE = [MSG.SAVE, MSG.QUICK_SAVE, MSG.LOAD, MSG.LOAD, MSG.QUICK_LOAD];
  const POS = {
    title: [48, 27], done: [410, 348], cancel: [515, 348], doneBtn: [391, 349], cancelBtn: [495, 349], arrows: [35, 58],
    list: [55, 87, 230, 353], clickTop: 79, thumb: [366, 58], cover: [340, 39], infoWidth: 164,
    infoName: [396, 254], infoDate: [397, 256], infoPlace: [399, 259], infoText: [404, 262], infoOld: [400, 262], box: [169, 116]
  };
  const BOX = { done: [56, 57], cancel: [181, 57], title: 7, doneBtn: [34, 58], cancelBtn: [160, 58], field: [24, 35], max: 29, cursorTrim: 4 };
  const SIZE = { RED: [15, 16], ARROW: [11, 14] };
  const FRAME_MS = 41;
  const BLINK_FRAMES = 3;
  const DOUBLE_CLICK_FRAMES = 24;
  const REPEAT = { FIRST: 4, MAX: 24, DELAY_MS: 14 * FRAME_MS };
  const MAP_LEVEL_MSG = 200;
  const SAVE_DIR = '"SAVEGAME\\"';
  const CHAR = { FIRST: 0x20, LAST: 0x7A };

  FO.SAVE_KIND = KIND;

  const isSave = kind => kind === KIND.SAVE || kind === KIND.QUICK_SAVE;

  function copyOpaque(scr, px, w, h, x, y) {
    const x0 = Math.max(0, -x);
    const x1 = Math.min(w, scr.w - x);
    if (x0 >= x1) return;
    for (let j = 0; j < h; j++) {
      const dy = y + j;
      if (dy >= 0 && dy < scr.h) scr.px.set(px.subarray(j * w + x0, j * w + x1), dy * scr.w + x + x0);
    }
  }

  function copyArt(g, scr, idx, x, y) {
    const f = FO.frameOfArt(g, idx);
    if (f) copyOpaque(scr, f.px, f.w, f.h, x, y);
    return f;
  }

  function lineHeight(g) {
    const f = g.fonts[101];
    return f.height + f.lineGap;
  }

  async function loadMsg(g, file) {
    const path = FO.textPath(file);
    return g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
  }

  FO.captureThumb = function (play) {
    const g = play.g;
    const scr = new FO.Screen(g.scr.w, play.mapH());
    if (play.w.map) {
      const v = play.view();
      const full = g.scr;
      g.scr = scr;
      try {
        FO.drawOutlines(scr, v, FO.drawMap(scr, v));
        play.drawFloats(scr, v);
      } finally {
        g.scr = full;
      }
    }
    return FO.scaleThumb(scr.px, scr.w, scr.h, scr.w);
  };

  FO.slotPlace = function (msgs, header) {
    const place = msgs.get(FO.EXE.mapPlaces[header.map]);
    const level = msgs.get(MAP_LEVEL_MSG + 3 * header.map + header.elev);
    return (place ? place.text : '') + ' ' + (level ? level.text : '');
  };

  FO.slotClock = function (time) {
    const minutes = Math.floor((time >>> 0) / 600);
    return (Math.floor(minutes / 60) % 24) * 100 + minutes % 60;
  };

  class DescriptionBox extends FO.Win {
    constructor(screen, slot, initial, then) {
      super(screen.p);
      this.screen = screen;
      this.slot = slot;
      this.value = initial || '';
      this.then = then;
      this.frameMs = 0;
      this.frames = 0;
      this.blink = false;
      this.shown = false;
      this.overBar = true;
      const [rw, rh] = SIZE.RED;
      this.button({ id: 'done', x: BOX.doneBtn[0], y: BOX.doneBtn[1], w: rw, h: rh, up: ART.RED_UP, down: ART.RED_DOWN, onClick: () => this.finish(true) });
      this.button({ id: 'cancel', x: BOX.cancelBtn[0], y: BOX.cancelBtn[1], w: rw, h: rh, up: ART.RED_UP, down: ART.RED_DOWN, onClick: () => this.finish(false) });
    }

    finish(ok) {
      this.screen.child = null;
      this.then(ok ? this.value : null);
    }

    update(dt) {
      this.frameMs += dt * 1000;
      while (this.frameMs >= FRAME_MS) {
        this.frameMs -= FRAME_MS;
        if (++this.frames < BLINK_FRAMES) continue;
        this.frames = 0;
        this.blink = !this.blink;
        this.shown = this.blink;
      }
    }

    edit(value) {
      this.value = value;
      this.shown = false;
    }

    keyDown(e) {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') this.finish(true);
      else if (e.code === 'Escape') this.finish(false);
      else if (e.code === 'Backspace' || e.code === 'Delete') {
        if (this.value.length) this.edit(this.value.slice(0, -1));
      } else if (e.key && e.key.length === 1) {
        const c = e.key.charCodeAt(0);
        if (c >= CHAR.FIRST && c <= CHAR.LAST && this.value.length < BOX.max) this.edit(this.value + e.key);
      }
      return true;
    }

    draw(scr) {
      const g = this.g;
      const s = this.screen;
      this.x = s.x + POS.box[0];
      this.y = s.y + POS.box[1];
      const box = copyArt(g, scr, ART.BOX, this.x, this.y);
      const label = this.color('label');
      const title = s.msg(MSG.DESCRIPTION);
      this.text(title, Math.trunc(((box ? box.w : 0) - g.fonts[103].advance(title)) / 2) + this.slot, BOX.title, label, 103);
      this.text(s.msg(MSG.DONE), BOX.done[0], BOX.done[1], label, 103);
      this.text(s.msg(MSG.CANCEL), BOX.cancel[0] + this.slot, BOX.cancel[1], label, 103);
      this.drawButtons(scr);
      const f = g.fonts[101];
      const green = this.color('green');
      this.text(this.value, BOX.field[0], BOX.field[1], green, 101);
      if (!this.shown) return;
      const cw = f.advance('_') - BOX.cursorTrim;
      const end = BOX.field[0] + f.advance(this.value + ' ');
      scr.rect(this.x + end - cw, this.y + BOX.field[1], cw, lineHeight(g) - 2, green);
    }
  }

  class SaveLoadScreen extends FO.Win {
    constructor(host, kind, done) {
      super(host.openModal ? host : { g: host.g });
      this.host = host;
      this.kind = kind;
      this.doneFn = done || null;
      this.standalone = !host.openModal;
      this.drawCursor = this.standalone;
      this.msgs = new Map();
      this.places = new Map();
      this.slots = [];
      this.snapshot = null;
      this.child = null;
      this.busy = false;
      this.ready = false;
      this.closed = false;
      this.repeat = null;
      this.lastClick = -1;
      this.frameMs = 0;
      this.dblFrames = DOUBLE_CLICK_FRAMES;
      this.overBar = true;
      const [rw, rh] = SIZE.RED;
      const [aw, ah] = SIZE.ARROW;
      const [ax, ay] = POS.arrows;
      const [lx, ly, lw, lh] = POS.list;
      this.button({ id: 'done', x: POS.doneBtn[0], y: POS.doneBtn[1], w: rw, h: rh, up: ART.RED_UP, down: ART.RED_DOWN, onClick: () => this.done() });
      this.button({ id: 'cancel', x: POS.cancelBtn[0], y: POS.cancelBtn[1], w: rw, h: rh, up: ART.RED_UP, down: ART.RED_DOWN, onClick: () => this.cancel() });
      this.button({ id: 'up', x: ax, y: ay, w: aw, h: ah, up: ART.UP_OFF, down: ART.UP_ON, dir: -1 });
      this.button({ id: 'down', x: ax, y: ay + ah, w: aw, h: ah, up: ART.DOWN_OFF, down: ART.DOWN_ON, dir: 1 });
      this.button({ id: 'list', x: lx, y: ly, w: lw, h: lh, sound: 'none', onClick: () => this.clickList() });
    }

    get cursorSlot() {
      return this.g.saveCursor | 0;
    }

    set cursorSlot(i) {
      this.g.saveCursor = Math.max(0, Math.min(FO.SAVE.SLOTS - 1, i));
    }

    msg(id) {
      const e = this.msgs.get(id);
      return e ? e.text : '';
    }

    async enter() {
      const g = this.g;
      this.msgs = await loadMsg(g, 'GAME\\LSGAME.MSG');
      this.places = await loadMsg(g, 'GAME\\MAP.MSG');
      await g.art.loadAll([...Object.values(ART), ...FO.MESSAGE_BOX_ART].map(FO.IFACE));
      if (isSave(this.kind)) this.snapshot = FO.captureThumb(this.p);
      try {
        this.slots = await FO.slotList(g);
      } catch (e) {
        this.ready = true;
        this.error([MSG.LIST_ERROR, MSG.DIR, SAVE_DIR, MSG.DIR_BAD], () => this.close(-1));
        return;
      }
      this.ready = true;
    }

    openModal(win) {
      win.owner = this;
      this.child = win;
      if (win.enter) win.enter();
      return win;
    }

    closeModal(win) {
      if (this.child === win) this.child = null;
    }

    slotState(i) {
      const s = this.slots[i];
      return s ? s.state : FO.SAVE.STATE.EMPTY;
    }

    error(lines, then) {
      FO.uiSound(this.g, 'iisxxxx1');
      const text = lines.map(l => (typeof l === 'number' ? this.msg(l) : l));
      this.openModal(new FO.MessageBox(this.p, { title: text[0], lines: text.slice(1), large: true, x: POS.box[0], y: POS.box[1], onClose: then || null }));
    }

    select(i) {
      this.cursorSlot = i;
    }

    clickList() {
      const ly = this.g.mouse.y - this.y;
      const slot = Math.max(0, Math.min(FO.SAVE.SLOTS - 1, Math.trunc((ly - POS.clickTop) / (3 * lineHeight(this.g) + 4))));
      this.select(slot);
      if (this.lastClick === slot) {
        FO.uiSound(this.g, 'ib1p1xx1');
        this.done();
      }
      this.lastClick = slot;
    }

    done() {
      if (this.busy || this.child || !this.ready) return;
      const S = FO.SAVE.STATE;
      const slot = this.cursorSlot;
      const st = this.slotState(slot);
      if (!isSave(this.kind)) {
        if (st === S.OLD) this.error([MSG.LOAD_ERROR, MSG.LOAD_OLD, MSG.LOAD_FAIL]);
        else if (st === S.CORRUPT) this.error([MSG.LOAD_ERROR, MSG.LOAD_FAIL]);
        else if (st === S.VALID) this.load(slot);
        return;
      }
      if (st !== S.VALID) {
        this.describe(slot);
        return;
      }
      this.openModal(new FO.MessageBox(this.p, { title: this.msg(MSG.OVERWRITE), yesNo: true, x: POS.box[0], y: POS.box[1], onClose: () => this.describe(slot) }));
    }

    describe(slot) {
      const cur = this.slots[slot];
      const initial = cur && cur.state === FO.SAVE.STATE.VALID && cur.header ? cur.header.description : '';
      this.child = new DescriptionBox(this, slot, initial, text => {
        if (text !== null) this.save(slot, text);
      });
    }

    async save(slot, description) {
      this.busy = true;
      try {
        await FO.writeSlot(this.g, slot, this.p, description, this.snapshot);
      } catch (e) {
        this.busy = false;
        this.error([MSG.SAVE_ERROR, MSG.SAVE_FAIL]);
        this.slots = await FO.slotList(this.g).catch(() => this.slots);
        return;
      }
      this.close(1);
    }

    async load(slot) {
      this.busy = true;
      try {
        await FO.loadGameData(this.g, (await FO.readSlot(this.g, slot)).data);
      } catch (e) {
        this.busy = false;
        this.error([MSG.LOAD_ERROR, MSG.LOAD_FAIL], () => this.quitToMenu());
        return;
      }
      this.close(1);
    }

    cancel() {
      if (this.busy || !this.ready) return;
      this.close(0);
    }

    quit() {
      const title = FO.miscText(this.g, MISC.QUIT) || (this.p.text ? this.p.text(MISC.QUIT, 'MISC') : '');
      this.openModal(new FO.MessageBox(this.p, { title, yesNo: true, onClose: () => this.quitToMenu() }));
    }

    quitToMenu() {
      this.close(0, true);
      FO.leaveGame(this.g);
    }

    close(rc, leaving) {
      if (this.closed) return;
      this.closed = true;
      if (!this.standalone && this.g.mode === this.host && this.host.modals.includes(this)) this.host.closeModal(this);
      if (this.doneFn) this.doneFn(rc, !!leaving);
    }

    update(dt) {
      if (this.child && this.child.update) this.child.update(dt);
      this.frameMs += dt * 1000;
      while (this.frameMs >= FRAME_MS) {
        this.frameMs -= FRAME_MS;
        if (--this.dblFrames > 0) continue;
        this.dblFrames = DOUBLE_CLICK_FRAMES;
        this.lastClick = -1;
      }
      const r = this.repeat;
      if (!r) return;
      const b = this.pressed;
      if (b !== r.button || !b.contains(this.g.mouse.x - this.x, this.g.mouse.y - this.y)) {
        this.repeat = null;
        return;
      }
      r.left -= dt * 1000;
      while (r.left <= 0) {
        r.rate = Math.min(REPEAT.MAX, r.rate + 1);
        this.select(this.cursorSlot + b.dir);
        r.left += 1000 / r.rate;
      }
    }

    mouseDown(m, button) {
      if (this.child) {
        if (this.child.mouseDown) this.child.mouseDown(m, button);
        return;
      }
      if (this.busy || !this.ready) return;
      super.mouseDown(m, button);
      const b = this.pressed;
      if (!b || !b.dir) return;
      this.lastClick = -1;
      this.select(this.cursorSlot + b.dir);
      this.repeat = { button: b, rate: REPEAT.FIRST, left: REPEAT.DELAY_MS };
    }

    mouseUp(m, button) {
      if (this.child) {
        if (this.child.mouseUp) this.child.mouseUp(m, button);
        return;
      }
      this.repeat = null;
      if (this.busy || !this.ready) return;
      super.mouseUp(m, button);
    }

    keyDown(e) {
      if (this.child) return this.child.keyDown ? this.child.keyDown(e) !== false : true;
      if (this.busy || !this.ready) return true;
      if (e.code === 'F10' || (e.ctrlKey && (e.code === 'KeyQ' || e.code === 'KeyX'))) {
        this.quit();
        return true;
      }
      switch (e.code) {
        case 'Escape': this.cancel(); return true;
        case 'ArrowUp': this.lastClick = -1; this.select(this.cursorSlot - 1); return true;
        case 'ArrowDown': this.lastClick = -1; this.select(this.cursorSlot + 1); return true;
        case 'Home': this.lastClick = -1; this.select(0); return true;
        case 'End': this.lastClick = -1; this.select(FO.SAVE.SLOTS - 1); return true;
        case 'Enter': case 'NumpadEnter': this.done(); return true;
        case 'Equal': case 'NumpadAdd': FO.stepBrightness(this.g, 1); return true;
        case 'Minus': case 'NumpadSubtract': FO.stepBrightness(this.g, -1); return true;
        default: return true;
      }
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox;
      this.y = oy;
      if (!this.p.w) scr.fill(0);
      if (!this.ready) return;
      copyArt(g, scr, ART.BACK, ox, oy);
      const label = this.color('label');
      this.text(this.msg(TITLE[this.kind]), POS.title[0], POS.title[1], label, 103);
      this.text(this.msg(MSG.DONE), POS.done[0], POS.done[1], label, 103);
      this.text(this.msg(MSG.CANCEL), POS.cancel[0], POS.cancel[1], label, 103);
      this.drawButtons(scr);
      this.drawThumb(scr);
      this.drawList();
      this.drawInfo();
      if (this.child) this.child.draw(scr);
      if (this.standalone && g.mouse.inside) FO.blitArt(g, scr, ART.ARROW, g.mouse.x, g.mouse.y);
    }

    drawThumb(scr) {
      const slot = this.slots[this.cursorSlot];
      const { W, H } = FO.SAVE.THUMB;
      const [tx, ty] = POS.thumb;
      if (slot && slot.state === FO.SAVE.STATE.VALID && slot.thumb) copyOpaque(scr, slot.thumb, W, H, this.x + tx, this.y + ty);
      else if (!isSave(this.kind)) copyArt(this.g, scr, ART.COVER, this.x + POS.cover[0], this.y + POS.cover[1]);
      else if (this.snapshot) copyOpaque(scr, this.snapshot, W, H, this.x + tx, this.y + ty);
    }

    drawList() {
      const S = FO.SAVE.STATE;
      const lh = lineHeight(this.g);
      const name = this.msg(isSave(this.kind) ? MSG.SLOT_SAVE : MSG.SLOT_LOAD);
      const x = POS.list[0];
      let y = POS.list[1];
      for (let i = 0; i < FO.SAVE.SLOTS; i++) {
        let color = this.color(i === this.cursorSlot ? 'yellow' : 'green');
        this.text('[   ' + name + ' ' + String(i + 1).padStart(2, '0') + ':   ]', x, y, color, 101);
        y += lh;
        const st = this.slotState(i);
        let line = '';
        if (st === S.VALID) line = this.slots[i].header.description || '';
        else if (st === S.EMPTY) line = '       ' + this.msg(MSG.EMPTY);
        else {
          line = st === S.OLD ? ' ' + this.msg(MSG.OLD) : this.msg(MSG.CORRUPT);
          color = this.color('orange');
        }
        this.text(line, x, y, color, 101);
        y += 2 * lh + 4;
      }
    }

    drawInfo() {
      const g = this.g;
      const S = FO.SAVE.STATE;
      const st = this.slotState(this.cursorSlot);
      if (st === S.EMPTY) {
        this.text(this.msg(MSG.INFO_EMPTY), POS.infoText[0], POS.infoText[1], this.color('green'), 101);
        return;
      }
      if (st === S.CORRUPT) {
        this.text(this.msg(MSG.INFO_ERROR), POS.infoText[0], POS.infoText[1], this.color('orange'), 101);
        return;
      }
      if (st === S.OLD) {
        this.text(this.msg(MSG.INFO_OLD), POS.infoOld[0], POS.infoOld[1], this.color('orange'), 101);
        return;
      }
      const green = this.color('green');
      const h = this.slots[this.cursorSlot].header;
      const lh = lineHeight(g);
      this.text(h.name || '', POS.infoName[0], POS.infoName[1], green, 101);
      const c = FO.calendar(h.time);
      const date = String(c.day).padStart(2, '0') + ' ' + this.msg(MSG.MONTH + c.month) + ' ' + String(c.year).padStart(4, '0') + '   ' + String(FO.slotClock(h.time)).padStart(4, '0');
      this.text(date, POS.infoDate[0], POS.infoDate[1] + lh, green, 101);
      const lines = g.fonts[101].wrap(FO.slotPlace(this.places, h), POS.infoWidth);
      lines.forEach((l, i) => this.text(l, POS.infoPlace[0], POS.infoPlace[1] + 2 * lh + i * (lh + 2), green, 101));
    }
  }

  FO.SaveLoadScreen = SaveLoadScreen;

  class BlackScreen {
    constructor() {
      this.pauses = true;
    }

    draw(scr) {
      scr.fill(0);
    }

    keyDown() {
      return true;
    }
  }

  async function failBox(play, title, line) {
    const msgs = await loadMsg(play.g, 'GAME\\LSGAME.MSG');
    const text = id => (msgs.get(id) || {}).text || '';
    FO.uiSound(play.g, 'iisxxxx1');
    await new Promise(resolve => play.openModal(new FO.MessageBox(play, { title: text(title), lines: [text(line)], large: true, x: POS.box[0], y: POS.box[1], onClose: resolve })));
  }

  async function quickSaveDirect(play) {
    const g = play.g;
    const slot = g.saveCursor | 0;
    try {
      const old = (await FO.slotList(g))[slot];
      const description = old && old.header ? old.header.description || '' : '';
      await FO.writeSlot(g, slot, play, description, FO.captureThumb(play));
      return 1;
    } catch (e) {
      await failBox(play, MSG.SAVE_ERROR, MSG.SAVE_FAIL);
      return -1;
    }
  }

  async function quickLoadDirect(play) {
    const g = play.g;
    play.openModal(new BlackScreen());
    try {
      await FO.loadGameData(g, (await FO.readSlot(g, g.saveCursor | 0)).data);
      return 1;
    } catch (e) {
      await failBox(play, MSG.LOAD_ERROR, MSG.LOAD_FAIL);
      FO.leaveGame(g);
      return -1;
    }
  }

  FO.saveGame = function (play, quick) {
    const g = play.g;
    if (quick && g.quickDone) return quickSaveDirect(play);
    g.quickDone = false;
    return new Promise(resolve => play.openModal(new SaveLoadScreen(play, quick ? KIND.QUICK_SAVE : KIND.SAVE, rc => {
      if (quick && rc === 1) g.quickDone = true;
      resolve(rc);
    })));
  };

  FO.loadGame = function (play, quick) {
    const g = play.g;
    if (quick && g.quickDone) return quickLoadDirect(play);
    g.quickDone = false;
    return new Promise(resolve => play.openModal(new SaveLoadScreen(play, quick ? KIND.QUICK_LOAD : KIND.LOAD, rc => {
      if (quick && rc === 1) g.quickDone = true;
      resolve(rc);
    })));
  };

  FO.loadFromMenu = async function (g) {
    g.quickDone = false;
    if (g.audio) g.audio.stopMusic();
    await FO.fade(g, 0);
    await g.setMode(new BlackScreen());
    await FO.fade(g, 1);
    return new Promise(resolve => g.setMode(new SaveLoadScreen({ g }, KIND.MENU_LOAD, (rc, leaving) => {
      if (rc !== 1 && !leaving) FO.leaveGame(g);
      resolve(rc);
    })));
  };
})(globalThis.FO = globalThis.FO || {});
