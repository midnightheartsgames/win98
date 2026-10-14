(function (FO) {
  'use strict';

  const ART = { BACK: 140, UP: 299, DOWN: 300, CURSOR: 267 };
  const HR = {
    BACK: 'ART\\INTRFACE\\HR_MAINMENU.FRM', PANEL: 'ART\\INTRFACE\\HR_MENU_BG.FRM',
    BOX: 'ART\\INTRFACE\\HR_OPTIONS_BG.FRM', BOX_UP: 'ART\\INTRFACE\\HR_OPTIONS_DN.FRM', BOX_DOWN: 'ART\\INTRFACE\\HR_OPTIONS_UP.FRM'
  };
  const ITEMS = [
    { msg: 9, key: 'KeyI', act: 'intro' },
    { msg: 10, key: 'KeyN', act: 'newGame' },
    { msg: 11, key: 'KeyL', act: 'loadGame' },
    { screen: 3, key: 'KeyO', act: 'options' },
    { msg: 12, key: 'KeyC', act: 'credits' },
    { msg: 13, key: ['KeyE', 'Escape'], act: 'exit' }
  ];
  const MENU = { x: 425, y: 45, step: 42, textX: 520, panel: -24 };
  const BOX = { w: 217, h: 119, x: 17, y: [18, 68], button: [182, 33], labels: [0, 1] };
  const SCROLL_MS = 38;
  const MUSIC = { MENU: '07DESERT', CREDITS: 'MAYBE' };
  const MOVIE = { IPLOGO: 0, INTRO: 2, OVRINTRO: 5 };

  FO.PLAYER_GCD = 'PREMADE\\PLAYER';

  FO.newWorld = async function (g) {
    const world = new FO.World(g);
    await world.init();
    await FO.loadPremade(g.data, world.dude, FO.PLAYER_GCD);
    return world;
  };

  FO.startGame = async function (g, world, map, tile, elev) {
    g.world = world;
    g.scripts = new FO.Scripts(g, g.world);
    await g.scripts.init();
    g.play = new FO.Play(g, g.world, g.scripts);
    await g.setMode(g.play);
    await g.play.start(map || 'V13ENT', tile === undefined ? -1 : tile, elev === undefined ? -1 : elev, -1);
    if (g.colors.fade < 1) await FO.fade(g, 1);
  };

  FO.boot = async function (g) {
    await FO.playMovieMode(g, MOVIE.IPLOGO, FO.MOVIE_FLAGS.FADE_OUT);
    await FO.playMovieMode(g, MOVIE.INTRO, 0);
    return FO.showMainMenu(g);
  };

  FO.newGame = async function (g, map, tile, elev) {
    await FO.startGame(g, await FO.newWorld(g), map, tile, elev);
  };

  FO.chooseCharacter = async function (g) {
    const world = await FO.newWorld(g);
    const select = new FO.CharSelect(g, world, async () => {
      await FO.playMovieMode(g, MOVIE.OVRINTRO, FO.MOVIE_FLAGS.STOP_MUSIC);
      await FO.startGame(g, world, g.opts.map);
    });
    return g.setMode(select);
  };

  FO.showMainMenu = function (g) {
    g.play = null;
    g.world = null;
    g.scripts = null;
    return g.setMode(new MainMenu(g));
  };

  FO.leaveGame = async function (g) {
    if (g.leaving) return;
    g.leaving = true;
    try {
      await FO.fade(g, 0, FO.FADE_TINT.WHITE);
    } finally {
      g.leaving = false;
    }
    return FO.showMainMenu(g);
  };

  FO.miscText = function (g, id) {
    const e = g.misc && g.misc.get(id);
    return e ? e.text : '';
  };

  async function loadMisc(g) {
    if (g.misc) return;
    const path = FO.textPath('GAME\\MISC.MSG');
    g.misc = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
  }

  function drawArtCursor(g, scr) {
    if (!g.mouse.inside) return;
    const f = FO.frameOfArt(g, ART.CURSOR);
    if (f) scr.blit(f, g.mouse.x, g.mouse.y);
  }

  class MainMenu extends FO.Win {
    constructor(g) {
      super({ g });
      this.drawCursor = true;
      this.modals = [];
      ITEMS.forEach((it, i) => this.button({ id: it.act, x: MENU.x, y: MENU.y + i * MENU.step, w: 26, h: 26, up: ART.UP, down: ART.DOWN, sound: 'menu', key: it.key, onClick: () => this.choose(it.act) }));
    }

    openModal(win) {
      win.owner = this;
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

    mouseMove(m) {
      const t = this.top();
      if (t && t.mouseMove) t.mouseMove(m);
    }

    keyDown(e) {
      const t = this.top();
      if (t) return t.keyDown ? t.keyDown(e) : false;
      const hit = super.keyDown(e);
      if (hit) FO.uiSound(this.g, 'nmselec1');
      return hit;
    }

    async enter() {
      const g = this.g;
      if (g.audio && g.audio.musicName !== MUSIC.MENU) g.audio.playMusic(MUSIC.MENU, true);
      await loadMisc(g);
      await FO.loadScreenText(g);
      await g.art.loadAll([ART.BACK, ART.UP, ART.DOWN, ART.CURSOR].map(FO.IFACE));
      await Promise.all(Object.values(HR).map(p => g.art.loadPath(p)));
      if (g.colors.fade < 1) await FO.fade(g, 1);
    }

    choose(act) {
      const g = this.g;
      if (act === 'intro') FO.playMovieMode(g, MOVIE.INTRO, FO.MOVIE_FLAGS.PAUSE_MUSIC).then(() => FO.showMainMenu(g));
      else if (act === 'newGame') FO.chooseCharacter(g);
      else if (act === 'loadGame') FO.loadFromMenu(g);
      else if (act === 'options') this.openModal(new OptionsBox(this));
      else if (act === 'credits') g.setMode(new CreditsScreen(g, g.keys.has('ShiftLeft') || g.keys.has('ShiftRight') ? 'QUOTES.TXT' : 'CREDITS.TXT'));
      else if (act === 'exit') {
        if (g.opts.onExit) g.opts.onExit();
      }
    }

    itemText(it) {
      return it.msg !== undefined ? FO.miscText(this.g, it.msg) : FO.screenText(this.g, it.screen).toUpperCase();
    }

    backdrop(scr) {
      const g = this.g;
      const mode = FO.screenPref(g.prefs, 'scaling');
      const hr = mode !== FO.SCALE.NONE && (scr.w > 640 || scr.h > 480) && FO.frameOfArt(g, HR.BACK);
      if (!hr) {
        this.blit(scr, ART.BACK, 0, 0);
        return [this.x, this.y, 640, 480];
      }
      const rect = FO.scaleRect(scr.w, scr.h, hr.w, hr.h, mode);
      scr.blitScaled(hr, [0, 0, hr.w, hr.h], rect);
      this.blit(scr, HR.PANEL, MENU.x + MENU.panel, MENU.y + MENU.panel);
      return rect;
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr);
      this.x = ox;
      this.y = oy;
      scr.fill(0);
      const [px, py, pw, ph] = this.backdrop(scr);
      this.drawButtons(scr);
      const title = this.color('title');
      ITEMS.forEach((it, i) => {
        const s = this.itemText(it);
        FO.textIn(g, s, ox + MENU.textX - (g.fonts[104].width(s) >> 1), oy + MENU.y + 1 + i * MENU.step, 0, title, 104);
      });
      const small = this.color('menuText');
      FO.textIn(g, FO.miscText(g, 14), px + 15, py + ph - 20, 0, small, 100);
      const version = 'FALLOUT 1.1 ';
      FO.textIn(g, version, px + pw - 25 - g.fonts[100].width(version), py + ph - 20, 0, small, 100);
      for (const m of this.modals) m.draw(scr);
      drawArtCursor(g, scr);
    }

    close() {}
  }

  class OptionsBox extends FO.Win {
    constructor(menu) {
      super({ g: menu.g });
      BOX.labels.forEach((id, i) => this.button({ id: 'pick' + id, x: BOX.x, y: BOX.y[i], w: BOX.button[0], h: BOX.button[1], up: HR.BOX_UP, down: HR.BOX_DOWN, sound: 'menu', onClick: () => this.pick(i) }));
    }

    pick(i) {
      const menu = this.owner;
      menu.closeModal(this);
      menu.openModal(i === 0 ? new FO.PrefsScreen({ g: this.g }) : new FO.ScreenSettings({ g: this.g }));
    }

    cancel() {
      this.close();
    }

    mouseDown(m, button) {
      if (m.x < this.x || m.y < this.y || m.x >= this.x + BOX.w || m.y >= this.y + BOX.h) {
        this.close();
        return;
      }
      super.mouseDown(m, button);
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr);
      this.x = ox + ((640 - BOX.w) >> 1);
      this.y = oy + ((480 - BOX.h) >> 1);
      this.blit(scr, HR.BOX, 0, 0);
      this.drawButtons(scr);
      const title = this.color('title');
      BOX.labels.forEach((id, i) => FO.textIn(g, FO.screenText(g, id), this.x + BOX.x, this.y + BOX.y[i] + 8, BOX.button[0], title, 103, 'center'));
    }
  }

  class CreditsScreen {
    constructor(g, file, opts) {
      this.g = g;
      this.file = file;
      this.opts = opts || {};
      this.lines = [];
      this.offset = 0;
      this.acc = 0;
      this.drawCursor = true;
    }

    async enter() {
      const g = this.g;
      if (g.audio && !this.opts.keepMusic) g.audio.playMusic(MUSIC.CREDITS, true);
      if (g.colors.fade < 1) FO.fade(g, 1);
      const path = FO.textPath(this.file);
      const text = g.data.has(path) ? await g.data.text(path) : '';
      const label = FO.uiColor(g, 'creditTitle');
      const name = FO.uiColor(g, 'creditName');
      const head = FO.uiColor(g, 'creditHead');
      for (const raw of text.split(/\r?\n/)) {
        if (raw[0] === ';') continue;
        if (raw[0] === '@') this.lines.push({ s: raw.slice(1), font: 103, color: label });
        else if (raw[0] === '#') this.lines.push({ s: raw.slice(1), font: 104, color: head });
        else this.lines.push({ s: raw, font: 104, color: name });
      }
      this.offset = -g.scr.h;
    }

    update(dt) {
      this.acc += dt * 1000;
      while (this.acc >= SCROLL_MS) {
        this.acc -= SCROLL_MS;
        this.offset++;
      }
      if (this.offset > this.height()) this.finish();
    }

    height() {
      const g = this.g;
      return this.lines.reduce((h, l) => h + g.fonts[l.font].height + g.fonts[l.font].lineGap, 0);
    }

    draw(scr) {
      const g = this.g;
      scr.fill(0);
      let y = -this.offset;
      for (const l of this.lines) {
        const f = g.fonts[l.font];
        const lh = f.height + f.lineGap;
        if (y + lh > 0 && y < scr.h) FO.textIn(g, l.s, (scr.w - f.width(l.s)) >> 1, y, 0, l.color, l.font);
        y += lh;
      }
    }

    finish() {
      if (this.done) return;
      this.done = true;
      if (this.opts.then) this.opts.then();
      else FO.showMainMenu(this.g);
    }

    mouseDown() {
      this.finish();
    }

    keyDown() {
      this.finish();
      return true;
    }
  }

  FO.MainMenu = MainMenu;
  FO.CreditsScreen = CreditsScreen;
})(globalThis.FO = globalThis.FO || {});
