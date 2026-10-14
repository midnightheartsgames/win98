(function (FO) {
  'use strict';

  const { TILE, COLS, ROWS, STRIDE, ENTRANCES, TOWNS: TOWN_COUNT, MAP_W, MAP_H, LOAD, GV, FOG, TERRAIN } = FO.WM;
  const T = () => FO.EXE.worldmap;
  const tileOf = v => Math.floor(v / TILE);

  const ART = {
    BTN_UP: 8, BTN_DOWN: 9, BOX: 136, LABELS: 137, DOT: 138, TARGET: 139, TARGET2: 153, FIGHT0: 154, FIGHT1: 155,
    MAP: 135, MONTHS: 129, NUMBERS: 82, SPOT: 168, SPOT_DOWN: 223, TOWN_MAP: 156, ARROW: 267
  };
  const VIEW = { x: 22, y: 21, w: 450, h: 442 };
  const VIEW_RIGHT = VIEW.x + VIEW.w;
  const VIEW_BOTTOM = VIEW.y + VIEW.h;
  const VIEW_MAX_X = MAP_W - VIEW.w;
  const VIEW_MAX_Y = MAP_H - VIEW.h;
  const CENTER = { x: 247, y: 242 };
  const PANEL = { buttonX: 508, labelX: 531, labelW: 82, labelH: 18, toggleX: 520, toggleY: 439, size: 15 };
  const DATE = { y: 12, day: 487, month: 513, year: 548, time: 593, digitW: 9, digitH: 17, monthW: 29, monthH: 14, monthStep: 15 };
  const MARKER = { w: 25, h: 13, dx: 10, dy: 15, clipX: 460 };
  const FRAME_MS = 66;
  const BLINK_MS = 199;
  const BLINKS = 7;
  const WAIT_MS = { CLICK: 300, ARRIVE: 500 };
  const SCROLL_STEP = 16;
  const HOVER_RANGE = 10;
  const TRAIL_EVERY = 2;
  const TRAIL_RGB = [216, 0, 0];
  const SEEN_SHADE = 64;
  const SPOT = { dx: -57, dy: -6, w: 164, h: 25, iconX: 69, iconY: 12 };
  const TOWN_VIEW = { x: 20, y: 20 };
  const WM_TEXT = { ENTRANCE: 200, CRATER: 290, RUINS: 501 };
  const CRATER_TOWN = { 11: [12, GV.MASTER_BLOWN, WM_TEXT.CRATER], 8: [13, GV.VATS_BLOWN, WM_TEXT.RUINS] };
  const QUIT_KEYS = ['KeyQ', 'KeyX'];
  const MUSIC = '03WRLDMP';

  const approxDist = (dx, dy) => (dx >= dy ? dx + (dy >> 1) : (dx >> 1) + dy);

  function shadowText(g, scr, s, x, y, color, left, right) {
    const f = g.fonts[101];
    if (!f || !s) return;
    const w = f.width(s) + 1;
    const h = f.height + 1;
    const tmp = new FO.Screen(w, h);
    f.draw(tmp, s, 1, 1, g.colors.nearest(0, 0, 0) || 1, g.colors);
    f.draw(tmp, s, 0, 0, color, g.colors);
    const from = Math.max(0, left - x);
    const to = Math.min(w, right - x);
    if (to > from) scr.blitPart(tmp, from, 0, to - from, h, x + from, y);
  }

  function drawNumber(g, scr, value, digits, x, y) {
    const nums = FO.frameOfArt(g, ART.NUMBERS);
    if (!nums) return;
    let v = Math.max(0, value | 0);
    for (let i = digits - 1; i >= 0; i--) {
      scr.blitPart(nums, (v % 10) * DATE.digitW, 0, DATE.digitW, DATE.digitH, x + i * DATE.digitW, y);
      v = Math.floor(v / 10);
    }
  }

  function drawPanel(win, scr) {
    const g = win.g;
    const wm = win.p.w.wm;
    const labs = win.art(ART.LABELS);
    if (labs) {
      for (let t = 0; t < TOWN_COUNT; t++) {
        if (FO.wmKnown(wm, t)) scr.blitPart(labs, 0, t * PANEL.labelH, PANEL.labelW, PANEL.labelH, win.x + PANEL.labelX, win.y + T().buttonY[t]);
      }
    }
    const sc = win.p.sc;
    const c = FO.calendar(sc ? sc.time : FO.START_TIME);
    drawNumber(g, scr, c.day, 2, win.x + DATE.day, win.y + DATE.y);
    const months = win.art(ART.MONTHS);
    if (months) scr.blitPart(months, 0, (c.month - 1) * DATE.monthStep, DATE.monthW, DATE.monthH, win.x + DATE.month, win.y + DATE.y);
    drawNumber(g, scr, c.year, 4, win.x + DATE.year, win.y + DATE.y);
    drawNumber(g, scr, sc ? sc.hour() : 0, 4, win.x + DATE.time, win.y + DATE.y);
  }

  function townButtons(win, onTown, onToggle) {
    for (let t = 0; t < TOWN_COUNT; t++) {
      win.button({ id: 'town' + t, x: PANEL.buttonX, y: T().buttonY[t], w: PANEL.size, h: PANEL.size, up: ART.BTN_UP, down: ART.BTN_DOWN, onClick: () => onTown(t) });
    }
    win.button({ id: 'toggle', x: PANEL.toggleX, y: PANEL.toggleY, w: PANEL.size, h: PANEL.size, up: ART.BTN_UP, down: ART.BTN_DOWN, onClick: onToggle });
  }

  function commonKey(win, e) {
    const g = win.g;
    if ((e.ctrlKey && QUIT_KEYS.includes(e.code)) || e.code === 'F10') {
      win.openModal(new FO.MessageBox(win.p, { title: win.p.text(0, 'MISC'), yesNo: true, onClose: () => FO.leaveGame(g) }));
      return true;
    }
    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      FO.stepBrightness(g, 1);
      return true;
    }
    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      FO.stepBrightness(g, -1);
      return true;
    }
    return e.code === 'F12';
  }

  class WorldMapScreen extends FO.Win {
    constructor(play, start) {
      super(play);
      this.drawCursor = true;
      this.wm = play.w.wm;
      this.start = start || { mode: 0, town: this.wm.town, entrance: 0 };
      this.modals = [];
      this.trip = FO.newTrip(this.wm);
      this.trail = new Uint8Array((MAP_W * MAP_H) >> 3);
      this.viewX = 0;
      this.viewY = 0;
      this.acc = 0;
      this.anim = null;
      this.done = false;
      this.cursorArt = ART.ARROW;
      this.reset();
      townButtons(this, t => this.townButton(t), () => this.toggle());
    }

    reset() {
      this.moving = false;
      this.toTown = false;
      this.follow = true;
      this.encounter = false;
      this.special = 0;
      this.enterTown = false;
      this.drop = false;
      this.quit = false;
      this.townMap = false;
      this.hover = false;
      this.target = 0;
      this.slow = 0;
      this.dots = 0;
      this.standing = true;
      this.viaButton = false;
    }

    async enter() {
      const g = this.g;
      const p = this.p;
      if (g.audio) g.audio.playMusic(MUSIC, true);
      await p.loadMsgs(['WORLDMAP', 'MISC']);
      const ids = [...Object.values(ART), ...Object.values(FO.SCROLL_CURSORS), ...Object.values(FO.SCROLL_BAD), ...FO.MESSAGE_BOX_ART];
      for (let t = 0; t < TOWN_COUNT; t++) ids.push(ART.TOWN_MAP + t);
      await g.art.loadAll(ids.map(FO.IFACE));
      this.trip.steps = 0;
      FO.wmSpeed(this.trip, p.w.dude);
      if (this.start.townMapFirst) {
        this.openTownMap(this.wm.town, r => this.begin(r.mode === -1 ? { mode: 0, town: this.wm.town, entrance: 0 } : r));
        return;
      }
      this.begin(this.start);
    }

    begin(st) {
      const wm = this.wm;
      if (this.p.gameOver || st.mode === 1) {
        this.gameOver();
        return;
      }
      if (st.mode === 2) {
        if (FO.wmTownAt(wm.x, wm.y) === st.town) {
          wm.town = st.town;
          this.loadSpot(st.town, st.entrance);
          return;
        }
        FO.wmToTown(this.trip, wm, st.town);
        this.viaButton = true;
        this.target = st.town;
        this.toTown = true;
        this.moving = true;
        wm.entrance = st.entrance;
      }
      this.prepare();
    }

    prepare() {
      const sc = this.p.sc;
      FO.wmSync(this.wm, sc.gvars, sc.time);
      this.centerView();
      FO.wmReveal(this.wm, FO.perkRank(this.p.w.dude, FO.PERK.SCOUT) > 0);
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

    sound(name) {
      FO.uiSound(this.g, name);
    }

    centerView() {
      this.viewX = Math.max(0, Math.min(VIEW_MAX_X, this.wm.x - CENTER.x));
      this.viewY = Math.max(0, Math.min(VIEW_MAX_Y, this.wm.y - CENTER.y));
    }

    scrollView(dx, dy) {
      if (!dx && !dy) return;
      this.viewX = Math.max(0, Math.min(VIEW_MAX_X, this.viewX + dx * SCROLL_STEP));
      this.viewY = Math.max(0, Math.min(VIEW_MAX_Y, this.viewY + dy * SCROLL_STEP));
    }

    local() {
      const m = this.g.mouse;
      return [m.x - this.x, m.y - this.y];
    }

    overDude() {
      const [mx, my] = this.local();
      const dx = Math.abs(mx - (this.wm.x - this.viewX + VIEW.x));
      const dy = Math.abs(my - (this.wm.y - this.viewY + VIEW.y) + 1);
      return approxDist(dx, dy) <= HOVER_RANGE;
    }

    update(dt) {
      for (const m of this.modals.slice()) if (m.update) m.update(dt);
      if (this.modals.length || this.done || this.busy) return;
      if (this.anim) {
        this.animate(dt * 1000);
        return;
      }
      this.acc += dt * 1000;
      while (this.acc >= FRAME_MS && !this.anim && !this.done && !this.busy && !this.modals.length) {
        this.acc -= FRAME_MS;
        this.tick();
      }
    }

    tick() {
      if (this.quit || this.encounter || this.enterTown || this.drop) {
        this.afterLoop();
        return;
      }
      this.hover = this.overDude();
      if (this.p.gameOver) {
        this.quit = true;
        return;
      }
      if (this.follow) this.centerView();
      this.edgeScroll();
      if (this.moving) this.travel();
      if (this.done || this.busy) return;
      const r = FO.wmTimed(this.p);
      if (r && r.over) {
        this.quit = true;
        this.p.gameOver = true;
      } else if (r && r.home) {
        this.quit = true;
        this.goHome();
      }
    }

    edgeScroll() {
      const g = this.g;
      const m = g.mouse;
      this.cursorArt = ART.ARROW;
      if (!m.inside || !g.active()) return;
      const dx = m.x <= 1 ? -1 : m.x >= g.scr.w - 2 ? 1 : 0;
      const dy = m.y <= 1 ? -1 : m.y >= g.scr.h - 1 ? 1 : 0;
      if (!dx && !dy) return;
      this.follow = false;
      const xOut = this.viewX + dx * SCROLL_STEP < 0 || this.viewX + dx * SCROLL_STEP > VIEW_MAX_X;
      const yOut = this.viewY + dy * SCROLL_STEP < 0 || this.viewY + dy * SCROLL_STEP > VIEW_MAX_Y;
      const dir = (dy < 0 ? 'n' : dy > 0 ? 's' : '') + (dx < 0 ? 'w' : dx > 0 ? 'e' : '');
      this.cursorArt = (!dx || xOut) && (!dy || yOut) ? FO.SCROLL_BAD[dir] : FO.SCROLL_CURSORS[dir];
      this.scrollView(dx, dy);
    }

    travel() {
      const p = this.p;
      const wm = this.wm;
      const trip = this.trip;
      this.standing = false;
      for (let k = 0; k < 2; k++) {
        if (!this.moving || this.encounter || this.enterTown || this.quit) break;
        const terrain = FO.wmTerrain(wm.x, wm.y);
        let timed = true;
        if (terrain === TERRAIN.MOUNTAIN) {
          if (--this.slow <= 0) {
            this.moving = FO.wmMove(trip, wm);
            this.slow = 2;
          }
        } else if (terrain === TERRAIN.CITY) {
          this.moving = FO.wmMove(trip, wm);
          if (--this.slow <= 0 && this.moving) {
            this.moving = FO.wmMove(trip, wm);
            this.slow = 4;
            timed = false;
          }
        } else {
          this.moving = FO.wmMove(trip, wm);
          this.slow = 0;
        }
        if (timed && this.passTime()) {
          this.interrupted();
          return;
        }
        if (this.dots-- <= 0) {
          const bit = wm.y * MAP_W + wm.x;
          this.trail[bit >> 3] |= 0x80 >> (wm.x & 7);
          this.dots = TRAIL_EVERY;
          FO.wmReveal(wm, FO.perkRank(p.w.dude, FO.PERK.SCOUT) > 0);
        }
        if (++trip.steps >= trip.checkSteps) {
          trip.steps = 0;
          FO.healParty(p, 24);
          if (FO.wmEncounterRoll(wm)) {
            this.encounter = true;
            this.toTown = false;
            this.moving = false;
            this.special = FO.wmSpecialRoll(wm, p.w.dude) + 1;
          }
        }
        if (this.toTown && !this.moving && !this.encounter) {
          const t = FO.wmTownAt(wm.x, wm.y);
          if (t !== -1) {
            this.target = t;
            this.viaButton = false;
            this.standing = true;
            this.toTown = this.moving = this.enterTown = this.encounter = this.quit = this.drop = false;
          }
        }
      }
      if (this.moving) return;
      this.trail.fill(0);
      if (this.enterTown || this.encounter) return;
      this.standing = true;
      this.viaButton = false;
      this.toTown = this.enterTown = this.quit = this.drop = this.encounter = false;
    }

    passTime() {
      const sc = this.p.sc;
      const now = sc.time;
      const end = now + this.trip.stepTime;
      if (end >= sc.nextEventAt()) {
        sc.time = sc.nextEventAt() + 1;
        if (sc.processDue()) return true;
      }
      sc.time = end;
      return false;
    }

    interrupted() {
      const wm = this.wm;
      this.townMap = this.drop = this.enterTown = this.encounter = false;
      const t = FO.wmTownAt(wm.x, wm.y);
      if (t !== -1) {
        this.target = t;
        this.enterTown = true;
      } else {
        this.drop = true;
      }
      this.exit();
    }

    afterLoop() {
      if (!this.quit && (this.special || this.encounter)) this.centerView();
      if (this.encounter) {
        this.anim = { kind: 'blink', frames: this.special ? [ART.TARGET2, ART.TARGET] : [ART.FIGHT0, ART.FIGHT1], step: 0, t: 0 };
        return;
      }
      if (this.enterTown || this.drop) {
        const click = this.standing || this.drop;
        this.anim = { kind: 'enter', t: 0, wait: click ? WAIT_MS.CLICK : WAIT_MS.ARRIVE, release: click, hover: this.hover };
        return;
      }
      this.exit();
    }

    animate(ms) {
      const a = this.anim;
      a.t += ms;
      if (a.kind === 'blink') {
        while (a.t >= BLINK_MS && a.step < BLINKS * 2) {
          a.t -= BLINK_MS;
          a.step++;
        }
        if (a.step < BLINKS * 2) return;
      } else {
        if (a.release && (this.g.mouse.down & 1)) {
          a.t = 0;
          return;
        }
        if (a.t < a.wait) return;
      }
      this.anim = null;
      this.exit();
    }

    gameOver() {
      if (this.done) return;
      this.done = true;
      FO.leaveGame(this.g);
    }

    exit() {
      if (this.p.gameOver) {
        this.gameOver();
        return;
      }
      if (this.drop) {
        this.loadTerrain(LOAD.DROP);
        return;
      }
      if (this.encounter) {
        if (this.special) this.loadMap(FO.EXE.specialMaps[this.special - 1], LOAD.SPECIAL);
        else this.loadTerrain(LOAD.ENCOUNTER);
        return;
      }
      if (this.enterTown) {
        this.enterTarget();
        return;
      }
      if (this.townMap) {
        this.townMapButton();
        return;
      }
      this.done = true;
    }

    loadTerrain(mode) {
      const wm = this.wm;
      this.p.sc.gvars[GV.WORLD_TERRAIN] = FO.wmRegion(wm.x, wm.y);
      this.loadMap(FO.wmRandomMap(wm), mode);
    }

    loadSpot(town, k) {
      const spot = T().hotspots[town][k] || T().hotspots[town][0];
      this.loadMap(spot[3], spot[2]);
    }

    loadMap(name, mode) {
      if (this.done) return;
      this.done = true;
      this.p.enterFromWorld(FO.wmCrater(this.p, name), mode);
    }

    goHome() {
      FO.wmArrive(this.p, T().mapTown.indexOf(0));
      this.loadSpot(0, 0);
    }

    enterTarget() {
      const wm = this.wm;
      const t = this.target;
      wm.town = t;
      if (!FO.wmKnown(wm, t)) {
        wm.known |= 1 << t;
        this.loadSpot(t, 0);
        return;
      }
      this.openTownMap(t, r => {
        if (this.p.gameOver || r.mode === 1) {
          this.gameOver();
          return;
        }
        if (r.mode === 3) {
          this.reset();
          this.prepare();
          return;
        }
        if (r.town === t) {
          this.loadSpot(t, r.entrance);
          return;
        }
        this.travelTo(r.town, r.entrance);
      });
    }

    townMapButton() {
      const wm = this.wm;
      const town = this.viaButton ? this.target : wm.town;
      this.openTownMap(town, r => {
        if (this.p.gameOver || r.mode === 1) {
          this.gameOver();
          return;
        }
        if (r.mode === 3) {
          this.reset();
          this.follow = false;
          this.prepare();
          return;
        }
        if (r.mode !== 2) {
          this.done = true;
          return;
        }
        const here = FO.wmTownAt(wm.x, wm.y);
        if (here === r.town) {
          wm.town = here;
          this.target = here;
          this.loadSpot(here, r.entrance);
          return;
        }
        this.target = r.town;
        this.travelTo(r.town, r.entrance);
      });
    }

    travelTo(town, entrance) {
      const wm = this.wm;
      this.quit = this.townMap = this.drop = this.enterTown = this.encounter = false;
      this.special = 0;
      this.slow = 0;
      this.dots = 0;
      this.follow = true;
      this.viaButton = true;
      FO.wmToTown(this.trip, wm, town);
      this.toTown = true;
      this.moving = true;
      this.standing = false;
      wm.entrance = entrance;
      this.prepare();
    }

    openTownMap(town, then) {
      this.openModal(new TownMapScreen(this, town, then));
    }

    townButton(t) {
      if (this.anim || this.done) return;
      const wm = this.wm;
      const trip = this.trip;
      if (!FO.wmKnown(wm, t)) return;
      if (this.toTown && this.moving && FO.wmTownAt(trip.destX, trip.destY) === t) return;
      const [cx, cy] = FO.wmTownCenter(t);
      trip.destX = cx;
      trip.destY = cy;
      const dest = FO.wmTownAt(cx, cy);
      if (FO.wmTownAt(wm.x, wm.y) === dest && dest !== -1) {
        this.enterTown = true;
        this.target = dest;
        this.moving = false;
        return;
      }
      const was = this.moving;
      FO.wmToTown(trip, wm, t);
      this.toTown = true;
      this.moving = true;
      this.follow = !was;
    }

    toggle() {
      if (this.anim || this.done) return;
      this.quit = true;
      this.townMap = true;
      this.viaButton = false;
    }

    mouseDown(m, button) {
      const t = this.top();
      if (t) {
        if (t.mouseDown) t.mouseDown(m, button);
        return;
      }
      if (this.anim || this.done || this.busy) return;
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      const [mx, my] = this.local();
      if (mx <= VIEW.x || mx >= VIEW_RIGHT || my <= VIEW.y || my >= VIEW_BOTTOM) return;
      const wm = this.wm;
      if (this.standing && this.overDude()) {
        this.sound('ib2p1xx1');
        this.encounter = false;
        this.enterTown = false;
        this.drop = true;
        this.viaButton = false;
        const t = FO.wmTownAt(wm.x, wm.y);
        if (t !== -1) {
          this.enterTown = true;
          this.target = t;
          this.drop = false;
        }
        return;
      }
      this.sound('ib1p1xx1');
      FO.wmLine(this.trip, wm, mx + this.viewX - VIEW.x, my + this.viewY - VIEW.y);
      this.follow = !this.moving;
      this.standing = false;
      this.moving = true;
      this.toTown = FO.wmTownAt(this.trip.destX, this.trip.destY) !== -1;
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
      if (t) return t.keyDown ? t.keyDown(e) !== false : true;
      if (this.anim || this.done || this.busy) return true;
      if (commonKey(this, e)) return true;
      let dx = 0;
      let dy = 0;
      switch (e.code) {
        case 'KeyA':
          this.follow = !this.follow;
          return true;
        case 'KeyP':
          this.openModal(new FO.PauseScreen(this.p, true));
          return true;
        case 'KeyC':
          this.centerView();
          return true;
        case 'Home':
          this.centerView();
          this.viewY = 0;
          dy = 1;
          break;
        case 'End':
          this.viewY = VIEW_MAX_Y;
          dy = 1;
          break;
        case 'ArrowLeft':
          if (this.viewX) dx = -1;
          break;
        case 'ArrowRight':
          if (this.viewX < VIEW_MAX_X) dx = 1;
          break;
        case 'ArrowUp':
          if (this.viewY) dy = -1;
          break;
        case 'ArrowDown':
          if (this.viewY < VIEW_MAX_Y) dy = 1;
          break;
        default:
          return super.keyDown(e);
      }
      this.follow = false;
      this.scrollView(dx, dy);
      return true;
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr);
      this.x = ox;
      this.y = oy;
      scr.fill(0);
      if (!(this.top() instanceof TownMapScreen)) {
        this.drawView(scr);
        const a = this.anim;
        if (!a || a.kind === 'enter') this.drawMarkers(scr, a);
        if (a && a.kind === 'blink') this.drawBlink(scr, a);
        this.blit(scr, ART.BOX, 0, 0);
        drawPanel(this, scr);
        this.drawButtons(scr);
      }
      for (const m of this.modals) m.draw(scr);
      if (g.mouse.inside) {
        const f = FO.frameOfArt(g, this.modals.length ? ART.ARROW : this.cursorArt);
        if (f) scr.blit(f, g.mouse.x, g.mouse.y);
      }
    }

    drawView(scr) {
      const g = this.g;
      const map = this.art(ART.MAP);
      const x0 = this.x + VIEW.x;
      const y0 = this.y + VIEW.y;
      if (map) scr.blitPart(map, this.viewX, this.viewY, VIEW.w, VIEW.h, x0, y0);
      const black = g.colors.nearest(0, 0, 0);
      const shade = g.colors.shade(SEEN_SHADE);
      const fog = this.wm.fog;
      for (let ty = tileOf(this.viewY); ty * TILE < this.viewY + VIEW.h && ty < ROWS; ty++) {
        for (let tx = tileOf(this.viewX); tx * TILE < this.viewX + VIEW.w && tx < COLS; tx++) {
          const v = fog[ty * STRIDE + tx];
          if (v === FOG.VISITED) continue;
          const left = Math.max(tx * TILE, this.viewX);
          const top = Math.max(ty * TILE, this.viewY);
          const right = Math.min((tx + 1) * TILE, this.viewX + VIEW.w);
          const bottom = Math.min((ty + 1) * TILE, this.viewY + VIEW.h);
          const sx = x0 + left - this.viewX;
          const sy = y0 + top - this.viewY;
          if (v === FOG.SEEN) scr.shadeRect(sx, sy, right - left, bottom - top, shade);
          else scr.rect(sx, sy, right - left, bottom - top, black);
        }
      }
    }

    drawMarkers(scr, anim) {
      const g = this.g;
      const wm = this.wm;
      const vx = this.viewX;
      const vy = this.viewY;
      if (this.standing || anim) {
        const sx = wm.x - vx + MARKER.dx;
        const sy = wm.y - vy + MARKER.dy;
        if (sx > -3 && sx < 484 && sy > 8 && sy < VIEW_BOTTOM) {
          const f = this.art(anim ? ART.SPOT_DOWN : ART.SPOT);
          const w = sx > MARKER.clipX ? MARKER.w - (sx - MARKER.clipX) : MARKER.w;
          if (f && w > 0) scr.blitPart(f, 0, 0, w, MARKER.h, this.x + sx, this.y + sy);
        }
        if (anim ? anim.hover : this.hover) this.drawLabel(scr, sx, sy);
      } else {
        const sx = wm.x - vx + 20;
        const sy = wm.y - vy + 19;
        if (sx > 17 && sx < 474 && sy > 16 && sy < VIEW_BOTTOM) this.blit(scr, ART.DOT, sx, sy);
      }
      if (!this.moving || anim) return;
      const tx = this.trip.destX - vx + 17;
      const ty = this.trip.destY - vy + 16;
      if (tx > 11 && tx < 474 && ty > 10 && ty < VIEW_BOTTOM) this.blit(scr, ART.TARGET, tx, ty);
      const red = g.colors.nearest(TRAIL_RGB[0], TRAIL_RGB[1], TRAIL_RGB[2]);
      const ox = this.x + VIEW.x - vx;
      const oy = this.y + VIEW.y - vy;
      for (let y = vy; y < vy + VIEW.h; y++) {
        const row = y * MAP_W;
        for (let x = vx; x < vx + VIEW.w; x++) {
          const bit = row + x;
          if (this.trail[bit >> 3] & (0x80 >> (x & 7))) scr.px[(oy + y) * scr.w + ox + x] = red;
        }
      }
    }

    drawLabel(scr, sx, sy) {
      const g = this.g;
      const s = FO.wmTownName(this.p, this.wm, FO.wmTownAt(this.wm.x, this.wm.y));
      const f = g.fonts[101];
      if (!f || !s) return;
      const w = f.width(s);
      const x = sx + ((MARKER.w - w) >> 1);
      const y = sy - 11;
      if (x <= VIEW.x - w || x >= VIEW_RIGHT || y <= 11 || y >= VIEW_BOTTOM) return;
      shadowText(g, scr, s, this.x + x, this.y + y, FO.uiColor(g, 'green'), this.x + VIEW.x, this.x + VIEW_RIGHT);
    }

    drawBlink(scr, a) {
      const wm = this.wm;
      const art = a.frames[Math.min(a.step, BLINKS * 2 - 1) & 1];
      if (this.special) {
        const sx = wm.x - this.viewX + 17;
        const sy = wm.y - this.viewY + 16;
        if (sx > 11 && sx < 474 && sy > 10 && sy < VIEW_BOTTOM) this.blit(scr, art, sx, sy);
        return;
      }
      const sx = wm.x - this.viewX + 19;
      const sy = wm.y - this.viewY + 16;
      if (sx > 15 && sx < VIEW_RIGHT && sy > 10 && sy < VIEW_BOTTOM) this.blit(scr, art, sx, sy);
    }
  }

  class TownMapScreen extends FO.Win {
    constructor(host, town, then) {
      super(host.p);
      this.host = host;
      this.town = town;
      this.then = then;
      this.wm = host.p.w.wm;
      this.spots = [];
      this.down = null;
      this.finished = false;
      townButtons(this, t => this.show(t), () => this.finish({ mode: 3, town: this.town, entrance: 0 }));
    }

    enter() {
      const sc = this.p.sc;
      FO.wmSync(this.wm, sc.gvars, sc.time);
      this.build();
    }

    openModal(win) {
      return this.host.openModal(win);
    }

    show(t) {
      if (!FO.wmKnown(this.wm, t)) return;
      this.town = t;
      this.build();
    }

    build() {
      const p = this.p;
      const gv = p.sc.gvars;
      let row = this.town;
      let label = -1;
      const crater = CRATER_TOWN[this.town];
      if (crater && gv[crater[1]]) {
        row = crater[0];
        label = crater[2];
      }
      this.spots = [];
      T().hotspots[row].forEach(([x, y], k) => {
        if (!this.wm.entrances[row * ENTRANCES + k]) return;
        const text = p.text(label >= 0 ? label : WM_TEXT.ENTRANCE + this.town * 10 + k, 'WORLDMAP');
        this.spots.push({ k, x: x + SPOT.dx, y: y + SPOT.dy, text });
      });
    }

    spotAt(m) {
      const lx = m.x - this.x;
      const ly = m.y - this.y;
      const up = this.art(ART.SPOT);
      const dn = this.art(ART.SPOT_DOWN);
      for (let i = this.spots.length - 1; i >= 0; i--) {
        const s = this.spots[i];
        const ix = lx - s.x - SPOT.iconX;
        const iy = ly - s.y - SPOT.iconY;
        const solid = f => !!f && ix >= 0 && iy >= 0 && ix < f.w && iy < f.h && f.px[iy * f.w + ix] !== 0;
        if (solid(up) || solid(dn)) return s;
      }
      return null;
    }

    finish(r) {
      if (this.finished) return;
      this.finished = true;
      this.host.closeModal(this);
      this.then(r);
    }

    update() {
      if (this.p.gameOver) this.finish({ mode: 1, town: this.town, entrance: 0 });
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      if (this.pressed || button !== 0) return;
      this.down = this.spotAt(m);
      if (this.down) FO.buttonSound(this.g, 'ib2p', false);
    }

    mouseUp(m, button) {
      if (this.pressed) {
        super.mouseUp(m, button);
        return;
      }
      const s = this.down;
      this.down = null;
      if (s && button === 0 && this.spotAt(m) === s) this.finish({ mode: 2, town: this.town, entrance: s.k });
    }

    keyDown(e) {
      if (commonKey(this, e)) return true;
      return super.keyDown(e);
    }

    draw(scr) {
      const g = this.g;
      const [ox, oy] = FO.screenOrigin(scr);
      this.x = ox;
      this.y = oy;
      const map = this.art(ART.TOWN_MAP + this.town);
      if (map) scr.blit(map, ox + TOWN_VIEW.x, oy + TOWN_VIEW.y);
      this.blit(scr, ART.BOX, 0, 0);
      drawPanel(this, scr);
      this.drawButtons(scr);
      const hot = g.mouse.inside ? this.spotAt(g.mouse) : null;
      const green = FO.uiColor(g, 'green');
      const f = g.fonts[101];
      for (const s of this.spots) {
        const pressed = this.down === s && hot === s && (g.mouse.down & 1);
        this.blit(scr, pressed ? ART.SPOT_DOWN : ART.SPOT, s.x + SPOT.iconX, s.y + SPOT.iconY);
        if (pressed || hot !== s || !f) continue;
        const x = Math.max(0, Math.trunc((SPOT.w - f.width(s.text)) / 2));
        shadowText(g, scr, s.text, ox + s.x + x, oy + s.y, green, ox + s.x, ox + s.x + SPOT.w);
      }
    }
  }

  FO.WorldMapScreen = WorldMapScreen;
  FO.TownMapScreen = TownMapScreen;
})(globalThis.FO = globalThis.FO || {});
