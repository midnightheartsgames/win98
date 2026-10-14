(function (FO) {
  'use strict';

  const SCROLL_CURSORS = { n: 271, ne: 272, e: 273, se: 274, s: 275, sw: 276, w: 277, nw: 270 };
  const SCROLL_BAD = { n: 331, ne: 329, e: 328, se: 332, s: 334, sw: 333, w: 335, nw: 330 };
  const FLOAT_RGB555 = [32747, 10570, 31744, 992, 31, 10570, 21140, 32074, 32747, 32767, 10570, 8456, 15855];
  const FLOAT_CODE = { WARNING: -2, CYCLE: -1 };
  const WARNING_FLOAT = { RGB555: 31744, FONT: 103 };
  const TEXT = { MAX: 19, WRAP: 200, ABOVE: 60, FONT: 101, BLACK: 0, NONE: -1, BASE_MIN: 1, LINE_SCALE: 0.4, LINE_MAX: 2 };
  const ITEM_OUTLINE = [232, 232, 64];
  const CURSOR = { ARROW: 267, ATTACK: 279, USE: 293, WAIT: 295, BUSY: 278 };
  const INFO_DELAY = 250;
  const REST_HEAL_TICKS = 180 * 600;
  const PORTABLE_CONTAINER = 0x8000;
  const GIZMO_REMAINS_PID = 0xD5;
  const MSG = { SEEN: 480, SEARCH: 485, CLOSE: 486, LOCKED: 487 };
  const MOVIE_FLAGS = 0xB;
  const LOAD_MUSIC = 'WIND2';
  const BLAST_MOVIES = [3, 4];
  const LAST_MOVIES = [6, 7];
  const MSG_FILES = ['PROTO', 'MISC', 'INVENTRY', 'SKILL', 'STAT', 'EDITOR', 'COMBAT', 'COMBATAI', 'ITEM', 'PERK', 'INTRFACE', 'WORLDMAP'];
  const MISC_MSG = { QUIT: 0, QUICK_LOADED: 4, QUICK_SAVED: 5 };
  const KEY_SOUND = 'ib1p1xx1';
  FO.SCROLL_CURSORS = SCROLL_CURSORS;

  FO.floatColor = function (g, code) {
    const rgb = FLOAT_RGB555[code] === undefined ? FLOAT_RGB555[0] : FLOAT_RGB555[code];
    return g.colors.inv[rgb];
  };

  FO.textDelays = function (prefs) {
    const base = Math.max(TEXT.BASE_MIN, FO.prefValue(prefs, 'textDelay'));
    const line = Math.max(0, Math.min(TEXT.LINE_MAX, (base - 1) * TEXT.LINE_SCALE));
    return { base: Math.trunc(base * 1000), line: Math.trunc(line * 1000) };
  };

  function outlineText(buf, color) {
    const { w, h, px } = buf;
    for (let y = 1; y < h - 1; y++) {
      let outside = true;
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (px[i] && outside) {
          px[i - 1] = color;
          outside = false;
        } else if (!px[i] && !outside) {
          px[i] = color;
          outside = true;
        }
      }
    }
    for (let x = 0; x < w; x++) {
      let outside = true;
      for (let y = 0; y < h; y++) {
        const i = y * w + x;
        if (px[i] && outside) {
          if (i >= w) px[i - w] = color;
          outside = false;
        } else if (!px[i] && !outside) {
          px[i] = color;
          outside = true;
        }
      }
    }
  }
  FO.SCROLL_BAD = SCROLL_BAD;

  class Play {
    constructor(game, world, scripts) {
      this.g = game;
      this.w = world;
      this.sc = scripts;
      FO.lightOf = o => o.tile >= 0 && world.map && o.elev === world.elev ? FO.lightAt({ light: world.light() }, o.tile) : FO.LIGHT_FULL;
      FO.gameDifficulty = () => FO.prefValue(game.prefs, 'gameDifficulty');
      FO.combatDifficulty = () => FO.prefValue(game.prefs, 'combatDifficulty');
      FO.gameTime = () => (scripts ? scripts.time : 0);
      FO.combatList = () => (this.combat && this.combat.active ? this.combat.list : []);
      FO.combatTurn = () => (this.combat && this.combat.active ? this.combat.current : undefined);
      world.anim.fpsBonus = o => (world.inCombat && FO.fidAnim(o.fid) === FO.ANIM.WALK && (!o.dude || game.prefs.playerSpeed) ? game.prefs.combatSpeed | 0 : 0);
      this.iface = new FO.Iface(this);
      this.modals = [];
      this.menu = null;
      this.press = null;
      this.cursor = 'move';
      this.cx = 0;
      this.cy = 0;
      this.scrollAt = 0;
      this.tickMs = 0;
      this.log = [];
      this.floats = [];
      this.textClock = 0;
      this.vis = [];
      this.hover = null;
      this.hoverHex = -1;
      this.busy = false;
      this.msgs = {};
      this.combatMsg = new Map();
      this.combatAiMsg = new Map();
      this.combat = new FO.Combat(this);
      this.pendingCombat = null;
      this.hoverAt = 0;
      this.hoverKey = '';
      this.carried = { party: [], scripts: [] };
      this.gameOver = false;
    }

    async loadMsgs(names) {
      const g = this.g;
      for (const name of names) {
        if (this.msgs[name]) continue;
        const path = FO.textPath('GAME\\' + name + '.MSG');
        this.msgs[name] = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      }
    }

    async enter() {
      const g = this.g;
      await this.loadMsgs(MSG_FILES);
      FO.filterMessages(g, this.msgs.COMBATAI);
      this.combatMsg = this.msgs.COMBAT;
      this.combatAiMsg = this.msgs.COMBATAI;
      this.combat.combatMsg = this.combatMsg;
      this.combat.combatAiMsg = this.combatAiMsg;
      if (!FO.AI_PACKETS && g.data.has(FO.AI_PATH)) FO.AI_PACKETS = FO.readAiPackets(await g.data.text(FO.AI_PATH));
      const ids = [16, 1, 3, 126, 134, 250, 267, 268, 269, 278, 279, 293, 295, 6, 7, 10, 13, 17, 31, 32, 40, 41, 42, 43, 44, 45, 46, 56, 57, 58, 59, 82, 83, 84, 85, 104, 105, 106, 107, 108, 109, 110, 117, 287, 288, 289, 290, 291, 292,
        ...Object.values(SCROLL_CURSORS), ...Object.values(SCROLL_BAD), ...Object.values(FO.ACTION_ICONS).flat()];
      await g.art.loadAll(ids.map(FO.IFACE));
      await Promise.all(FO.IFACE_ART.map(p => g.art.loadPath(p)));
      this.w.on.step = (o, st) => this.stepped(o, st);
      this.w.on.elevation = () => this.centerOn(this.w.dude.tile);
      this.w.on.door = (o, door) => this.useDoor(o, door);
      if (this.sc) this.sc.host = this;
      if (this.w.map) this.centerOn(this.w.dude.tile);
    }

    leave() {
      this.w.on.step = null;
      this.w.on.elevation = null;
      this.w.on.door = null;
    }

    async start(map, tile, elev, rot) {
      await this.goto(map, tile, elev, rot);
    }

    async goto(map, tile, elev, rot) {
      this.busy = true;
      try {
        this.leaveMap();
        await this.arrive(map, tile, elev, rot);
        if (this.sc) FO.wmArrive(this, this.w.map.index);
      } finally {
        this.busy = false;
      }
    }

    leaveMap() {
      const w = this.w;
      const sc = this.sc;
      if (!w.map) return;
      if (this.combat.active) this.combat.terminate();
      this.menu = null;
      this.press = null;
      this.targeting = null;
      if (sc) {
        sc.exitMap();
        FO.leaveMapEvents(this);
      }
      const st = w.map;
      const party = (w.party || []).filter(o => o.tile >= 0 && st.byElev[o.elev] && st.byElev[o.elev].includes(o));
      const scripts = FO.ownedScripts([w.dude, ...party]);
      if (st.scriptList) st.scriptList = st.scriptList.filter(s => !scripts.includes(s));
      this.carried = { party: w.leave(sc ? sc.time : 0, party), scripts };
      if (sc) sc.scheduleMidnight();
    }

    async arrive(map, tile, elev, rot) {
      const w = this.w;
      const sc = this.sc;
      if (this.g.audio) this.g.audio.playMusic(LOAD_MUSIC, true);
      this.floats = [];
      const state = await w.enter(map, tile, elev, rot);
      const carried = this.carried;
      this.carried = { party: [], scripts: [] };
      for (const o of carried.party) w.add(o, o.tile, o.elev);
      if (sc) {
        FO.ageMap(this, state, FO.wmMapHours(state, sc.time));
        sc.enterMap(carried.scripts);
        sc.scheduleMidnight();
      }
      if (this.g.audio && FO.EXE.mapMusic[state.index]) this.g.audio.playMusic(FO.EXE.mapMusic[state.index], true);
      await w.preload(w.elev);
      this.centerOn(w.dude.tile);
    }

    async openWorldMap(townMapFirst) {
      if (this.busy) return;
      this.busy = true;
      try {
        this.leaveMap();
      } finally {
        this.busy = false;
      }
      await this.g.setMode(new FO.WorldMapScreen(this, { mode: 0, town: this.w.wm.town, entrance: 0, townMapFirst: !!townMapFirst }));
    }

    async enterFromWorld(name, loadIndex) {
      const sc = this.sc;
      sc.gvars[FO.WM.GV.LOAD_MAP_INDEX] = loadIndex;
      this.busy = true;
      try {
        await this.arrive(name, -1, -1, -1);
      } finally {
        this.busy = false;
      }
      await this.g.setMode(this);
    }

    text(id, file) {
      const m = this.msgs[file || 'PROTO'];
      const e = m && m.get(id);
      return e ? e.text : '';
    }

    say(line) {
      if (!line) return;
      this.log.push({ line, t: this.g.now || 0 });
      if (this.log.length > 100) this.log.shift();
      this.iface.scrollBack = 0;
    }

    floatMsg(o, text, code) {
      const g = this.g;
      const w = this.w;
      if (!o || o.elev !== w.elev) return null;
      let c = code;
      if (c === FLOAT_CODE.CYCLE) {
        g.floatCycle = (g.floatCycle | 0) + 1 > FLOAT_RGB555.length - 1 ? 1 : (g.floatCycle | 0) + 1;
        c = g.floatCycle;
      }
      const black = g.colors.inv[TEXT.BLACK];
      if (c === FLOAT_CODE.WARNING) {
        this.centerOn(w.dude.tile);
        return this.floatText(null, text, WARNING_FLOAT.FONT, g.colors.inv[WARNING_FLOAT.RGB555], black, w.dude.tile);
      }
      return this.floatText(o, text, TEXT.FONT, FO.floatColor(g, c), black);
    }

    floatText(o, raw, fontId, color, outline, tile) {
      const g = this.g;
      if (!raw || this.floats.length >= TEXT.MAX) return null;
      const text = FO.speakerText(raw, FO.isFemale(o));
      const f = g.fonts[fontId] || g.fonts[TEXT.FONT];
      const lines = f.breakLines(text, TEXT.WRAP).map(l => (l.endsWith(' ') ? l.slice(0, -1) : l));
      const pad = outline === TEXT.NONE ? 0 : 2;
      const lh = f.height + f.lineGap + 1;
      const w = Math.max(0, ...lines.map(l => f.advance(l))) + pad;
      const h = lines.length * lh + pad;
      const buf = new FO.Screen(Math.max(1, w), Math.max(1, h));
      lines.forEach((l, i) => f.draw(buf, l, Math.trunc((w - f.advance(l)) / 2), (pad ? 1 : 0) + i * lh, color, g.colors));
      if (pad) outlineText(buf, outline);
      if (o) this.floats = this.floats.filter(t => t.o !== o);
      const t = { o, tile: o ? o.tile : tile, fixed: !o, buf, lines: lines.length, at: this.textClock, dx: 0, dy: 0 };
      this.placeText(t);
      this.floats.push(t);
      return t;
    }

    placeText(t) {
      const [vx, vy] = this.viewXY();
      const sx = FO.hexLeft(t.tile) - vx;
      const sy = FO.hexTop(t.tile) - vy;
      const W = this.g.scr.w;
      const H = this.mapH();
      const { w, h } = t.buf;
      const half = Math.trunc(w / 2);
      const above = sy - (h + TEXT.ABOVE);
      const x0 = sx + 16 - half;
      const left = sx - 16 - w;
      const tries = [
        [x0, t.fixed ? sy : above], [x0 - half, t.fixed ? sy : above], [x0 - half + w, t.fixed ? sy : above],
        [left, sy - 16 - h], [left + w + 64, sy - 16 - h],
        [x0, sy], [x0 - half, sy], [x0 - half + w, sy]
      ];
      const fit = tries.find(([x, y]) => x >= 0 && y >= 0 && x + w - 1 < W && y + h - 1 < H) || [x0, above];
      t.dx = fit[0] - sx;
      t.dy = fit[1] - sy;
    }

    mapH() {
      return this.g.scr.h - FO.BAR_H;
    }

    viewXY() {
      return [Math.round(this.cx - this.g.scr.w / 2), Math.round(this.cy - this.mapH() / 2)];
    }

    onScreen(o) {
      const frm = o.tile >= 0 ? this.g.art.get(o.fid) : null;
      if (!frm) return false;
      const [left, top, w, h] = FO.objectRect(o, frm);
      const [vx, vy] = this.viewXY();
      const x = left - vx;
      const y = top - vy;
      return x + w > 0 && y + h > 0 && x < this.g.scr.w && y < this.mapH();
    }

    centerOn(tile) {
      if (tile < 0) return;
      this.cx = FO.hexLeft(tile) + 16;
      this.cy = FO.hexTop(tile) + 8;
    }

    canCenter(x, y) {
      const w = this.w;
      const d = w.dude;
      const hex = FO.worldHex(x, y);
      if (hex < 0) return false;
      if (w.scrollBlocked(hex, w.elev)) return false;
      const [dx, dy] = FO.hexCenter(d.tile);
      const nx = Math.abs(x - dx);
      const ny = Math.abs(y - dy);
      const ox = Math.abs(this.cx - dx);
      const oy = Math.abs(this.cy - dy);
      if ((nx > ox || ny > oy) && (nx >= 480 || ny >= 400)) return false;
      return true;
    }

    edge() {
      const m = this.g.mouse;
      if (!m.inside || !this.g.active() || this.modals.length || this.menu) return null;
      const W = this.g.scr.w;
      const H = this.g.scr.h;
      const l = m.x < 2;
      const r = m.x >= W - 2;
      const t = m.y < 2;
      const b = m.y >= H - 2;
      if (!l && !r && !t && !b) return null;
      return (t ? 'n' : b ? 's' : '') + (l ? 'w' : r ? 'e' : '');
    }

    scroll(dir) {
      const step = { n: [0, -24], s: [0, 24], e: [32, 0], w: [-32, 0], ne: [32, -24], nw: [-32, -24], se: [32, 24], sw: [-32, 24] }[dir];
      if (!step) return false;
      const x = this.cx + step[0];
      const y = this.cy + step[1];
      if (!this.canCenter(x, y)) return false;
      this.cx = x;
      this.cy = y;
      return true;
    }

    inDialog() {
      return !!(this.sc && this.sc.dialog);
    }

    openModal(win) {
      this.modals.push(win);
      this.menu = null;
      if (win.enter) win.enter();
      return win;
    }

    closeModal(win) {
      const i = this.modals.indexOf(win);
      if (i >= 0) this.modals.splice(i, 1);
      if (win.leave) win.leave();
      this.combat.checkInput();
    }

    top() {
      return this.modals[this.modals.length - 1] || null;
    }

    paused() {
      return this.busy || this.inDialog() || this.modals.some(m => m.pauses) || this.g.colors.fading();
    }

    update(dt) {
      const g = this.g;
      const w = this.w;
      const sc = this.sc;
      if (!w.map) return;
      FO.textGender = FO.statValue(w.dude, FO.STAT.GENDER) === 1 ? 1 : 0;
      const ms = dt * 1000;
      this.iface.update(dt);
      for (const m of this.modals.slice()) if (m.update) m.update(dt);
      if (!this.paused()) {
        w.anim.update(ms);
        this.combat.tick();
        if (sc && !w.inCombat) {
          this.tickMs += ms;
          const ticks = Math.floor(this.tickMs / 100);
          if (ticks > 0) {
            this.tickMs -= ticks * 100;
            this.passTime(ticks, false);
          }
          sc.critterProc(ms);
        }
      }
      if (sc && !this.busy) this.handleRequests();
      if (this.pendingCombat && !this.combat.active && !this.paused()) {
        const gcsd = this.pendingCombat;
        this.pendingCombat = null;
        this.combat.run(gcsd === true ? null : gcsd);
      }
      if (this.gameOver && !this.over && !this.modals.some(m => m instanceof FO.MovieScreen)) {
        this.over = true;
        FO.leaveGame(g);
        return;
      }
      if (w.isDead(w.dude) && !w.anim.busy(w.dude) && !this.over) {
        this.over = true;
        g.setMode(new FO.DeathScreen(g));
        return;
      }
      if (sc && sc.dialog && !this.modals.some(m => m instanceof FO.DialogScreen)) this.openModal(new FO.DialogScreen(this, sc.dialog));
      const now = g.now || 0;
      if (!this.paused()) this.textClock += dt * 1000;
      const delay = FO.textDelays(g.prefs);
      this.floats = this.floats.filter(t => this.textClock - t.at < delay.base + delay.line * t.lines && !(t.o && t.o.destroyed));
      if (this.press && !this.menu && (g.mouse.down & 1) && now - this.press.t > 300 && this.press.obj) {
        this.menu = new FO.ActionMenu(this, this.press.obj, this.press.x, this.press.y, this.menuItems(this.press.obj));
      }
      if (this.menu) this.menu.update(g.mouse);
      const k = g.keys;
      let dir = this.edge();
      if (!dir && g.active() && !this.modals.length) {
        const v = k.has('ArrowUp') ? 'n' : k.has('ArrowDown') ? 's' : '';
        const h = k.has('ArrowLeft') ? 'w' : k.has('ArrowRight') ? 'e' : '';
        if (v || h) dir = v + h;
      }
      this.scrollDir = dir;
      this.scrollOk = true;
      if (dir) {
        this.scrollAt -= dt;
        if (this.scrollAt <= 0) {
          this.scrollAt = 0.05;
          this.scrollOk = this.scroll(dir);
        }
      } else {
        this.scrollAt = 0;
      }
    }

    passTime(ticks, resting) {
      const sc = this.sc;
      if (!sc) return false;
      const d = this.w.dude;
      const stop = sc.advance(ticks);
      if (resting) {
        d.restTicks = (d.restTicks | 0) + ticks;
        if (d.restTicks >= REST_HEAL_TICKS) {
          d.restTicks = 0;
          FO.healParty(this, 3);
        }
      }
      return stop;
    }

    canRest() {
      const w = this.w;
      if (w.inCombat || !w.map) return false;
      return !w.map.byElev[w.elev].some(o => !o.dude && w.isCritter(o) && !w.isDead(o) && o.hostile);
    }

    playMovie(index, flags) {
      if (index >= 0) this.w.movies.add(index);
      return new Promise(resolve => {
        const movie = new FO.MovieScreen(this.g, index, flags === undefined ? MOVIE_FLAGS : flags, resolve);
        const mode = this.g.mode;
        movie.host = mode !== this && mode && mode.openModal ? mode : this;
        movie.host.openModal(movie);
      });
    }

    handleRequests() {
      const sc = this.sc;
      for (const r of sc.takeRequests()) {
        if (r.kind === 'loadMap') {
          const idx = typeof r.map === 'string' ? this.w.mapIndex(r.map) : r.map;
          const gi = sc.gvarIndex('LOAD_MAP_INDEX');
          if (gi >= 0) sc.gvars[gi] = r.entrance | 0;
          if (idx >= 0) this.goto(idx, -1, -1, -1);
        } else if (r.kind === 'talk') {
          this.talk(r.obj, true);
        } else if (r.kind === 'worldMap' || r.kind === 'townMap') {
          this.openWorldMap(r.kind === 'townMap');
          return;
        } else if (r.kind === 'elevator') {
          if (FO.ElevatorScreen) this.openModal(new FO.ElevatorScreen(this, r.type));
        } else if (r.kind === 'endCombat') {
          if (this.combat.active) this.combat.terminate();
        } else if (r.kind === 'endgameSlides') {
          const show = new FO.EndgameScreen(this);
          show.host = this;
          this.openModal(show);
        } else if (r.kind === 'endgameMovie') {
          FO.endgameMovie(this.g);
          return;
        } else if (r.kind === 'fade') {
          FO.fade(this.g, r.out ? 0 : 1).then(() => sc.resumeScript(r.script));
        } else if (r.kind === 'movie') {
          const blast = r.movie === BLAST_MOVIES[0] || r.movie === BLAST_MOVIES[1];
          const flags = (FO.SCRIPT_MOVIE_FLAGS[r.movie] | 0) | (blast ? FO.MOVIE_FLAGS.FADE_IN : 0);
          this.playMovie(r.movie, flags).then(() => {
            if (LAST_MOVIES.includes(r.movie)) this.gameOver = true;
            sc.resumeScript(r.script);
          });
        } else if (r.kind === 'endGame') {
          this.gameOver = true;
        }
      }
    }

    stepped(o) {
      const w = this.w;
      if (this.sc && FO.pidType(o.pid) === FO.PID.CRITTER) this.sc.spatial(o);
      const more = !(this.combat.active && FO.pidType(o.pid) === FO.PID.CRITTER) || this.combat.spendStep(o);
      if (!o.dude) return more;
      this.centerOn(o.tile);
      const exit = w.exitAt(o.tile, o.elev);
      if (exit) {
        this.useExit(exit);
        return false;
      }
      return more;
    }

    async useExit(exit) {
      const w = this.w;
      if (this.busy) return;
      if (this.combat.active) this.combat.terminate();
      if (exit.destMap < 0) {
        await this.openWorldMap(exit.destMap === -1);
        return;
      }
      if (exit.destMap === w.map.index) {
        await w.setElevation(exit.destElev, exit.destTile);
        this.centerOn(w.dude.tile);
        return;
      }
      await this.goto(exit.destMap, exit.destTile, exit.destElev, exit.destRot);
    }

    view() {
      const w = this.w;
      const [x, y] = this.viewXY();
      const d = w.dude;
      const hiddenRoof = d.tile >= 0 ? FO.roofHidden(w.map.roofs[w.elev], FO.hexSquare(d.tile)) : null;
      return {
        map: w.map, elev: w.elev, x, y, art: this.g.art, colors: this.g.colors,
        objects: w.map.byElev, light: w.light(), roofs: true, hiddenRoof
      };
    }

    pick(mx, my) {
      for (let i = this.vis.length - 1; i >= 0; i--) {
        const e = this.vis[i];
        if (FO.pidType(e.o.pid) === FO.PID.MISC) continue;
        const lx = mx - e.x;
        const ly = my - e.y;
        if (lx < 0 || ly < 0 || lx >= e.f.w || ly >= e.f.h) continue;
        if (e.f.px[ly * e.f.w + lx]) return e.o;
      }
      return null;
    }

    draw(scr) {
      const g = this.g;
      const w = this.w;
      if (!w.map) {
        scr.fill(0);
        return;
      }
      const mapH = this.mapH();
      const full = scr.h;
      const v = this.view();
      scr.h = mapH;
      this.vis = FO.drawMap(scr, v);
      const mx = g.mouse.x;
      const my = g.mouse.y;
      const overMap = g.mouse.inside && my < mapH && !this.modals.length && !this.menu;
      this.hoverHex = overMap ? FO.worldHex(mx + v.x, my + v.y) : -1;
      this.hover = overMap ? this.pick(mx, my) : null;
      const key = this.hoverHex + ':' + (this.hover ? this.hover.id : 0);
      if (key !== this.hoverKey) {
        this.hoverKey = key;
        this.hoverAt = g.now || 0;
      }
      const still = (g.now || 0) - this.hoverAt >= INFO_DELAY;
      if (overMap && this.cursor === 'move' && !this.targeting && !this.scrollDir && this.hoverHex >= 0) {
        const blocked = !!w.blocker(this.hoverHex, w.elev, w.dude);
        const frm = g.art.get(FO.IFACE(blocked ? 3 : 1));
        const hx = FO.hexLeft(this.hoverHex) - v.x;
        const hy = FO.hexTop(this.hoverHex) - v.y;
        if (frm) scr.blit(frm.dirs[0].frames[0], hx, hy);
        if (still && w.inCombat && this.combat.dudeTurn()) this.drawMoveCost(hx, hy);
      }
      this.combat.setOutlines(!!(this.targeting && this.targeting.attack) && (!w.inCombat || this.combat.dudeTurn()));
      const lit = this.itemLit();
      if (lit) {
        lit.outline = 1;
        lit.outlineColor = ITEM_OUTLINE;
      }
      FO.drawOutlines(scr, v, this.vis);
      if (lit) {
        lit.outline = 0;
        lit.outlineColor = null;
      }
      this.drawFloats(scr, v);
      if (overMap && still && this.targeting && this.targeting.attack) this.drawToHit(mx, my);
      scr.h = full;
      this.iface.draw(scr);
      for (const m of this.modals) m.draw(scr);
      if (this.menu) this.menu.draw(scr);
      this.drawCursor(scr);
    }

    drawFloats(scr, v) {
      for (const t of this.floats) {
        if (t.tile >= 0) scr.blit(t.buf, FO.hexLeft(t.tile) - v.x + t.dx, FO.hexTop(t.tile) - v.y + t.dy);
      }
    }

    itemLit() {
      const o = this.hover;
      if (!o || !FO.prefValue(this.g.prefs, 'itemHighlight') || FO.pidType(o.pid) !== FO.PID.ITEM) return null;
      if ((o.flags & FO.FLAG.NO_HIGHLIGHT) || o.outline) return null;
      return o;
    }

    drawMoveCost(hx, hy) {
      const g = this.g;
      const w = this.w;
      const d = w.dude;
      const path = w.findPath(d, this.hoverHex, 0);
      let text = 'X';
      let ok = false;
      if (path && path.length) {
        const cost = Math.max(0, FO.apPerHexes(d, path.length) - this.combat.freeMove);
        if (cost <= d.critter.ap) {
          text = String(cost);
          ok = true;
        }
      }
      const col = ok ? g.color(248, 248, 248) : g.color(248, 0, 0);
      const f = g.fonts[101];
      g.text(text, hx + 16 - (f.width(text) >> 1), hy + 4, col, 101);
    }

    drawToHit(mx, my) {
      const g = this.g;
      const w = this.w;
      const o = this.hover;
      if (!o || FO.pidType(o.pid) !== FO.PID.CRITTER || o.dude) return;
      const mode = this.iface.attackMode();
      let text = ' X ';
      let col = g.color(248, 0, 0);
      if (mode.hitMode >= 0 && FO.badShot(w, w.dude, o, mode.hitMode, mode.aimed) === FO.BAD_SHOT.OK) {
        text = FO.determineToHit(w, w.dude, o, FO.HIT_LOC.UNCALLED, mode.hitMode, true) + '%';
        col = g.color(248, 248, 248);
      }
      g.text(text, mx + 18, my + 2, 0, 101);
      g.text(text, mx + 17, my + 1, col, 101);
    }

    drawCursor(scr) {
      const g = this.g;
      if (!g.mouse.inside) return;
      let index = 267;
      const top = this.top();
      if (top && top.noCursor) return;
      if (this.menu) index = -1;
      else if (this.scrollDir) index = (this.scrollOk ? SCROLL_CURSORS : SCROLL_BAD)[this.scrollDir];
      else if (this.busy) index = CURSOR.BUSY;
      else if (top) index = top.cursor ? top.cursor() : CURSOR.ARROW;
      else if (this.w.inCombat && !this.combat.canAct()) index = CURSOR.WAIT;
      else if (this.iface.contains(g.mouse)) index = this.iface.cursorAt(g.mouse);
      else if (this.targeting) index = this.targeting.attack ? CURSOR.ATTACK : CURSOR.USE;
      else index = this.cursor === 'action' ? 250 : -1;
      if (index < 0) return;
      const frm = g.art.get(FO.IFACE(index));
      if (!frm) return;
      const f = frm.dirs[0].frames[0];
      let x = g.mouse.x;
      let y = g.mouse.y;
      if (this.scrollDir || index === 268 || index === 269) {
        x -= f.w >> 1;
        y -= f.h >> 1;
        x = Math.max(0, Math.min(scr.w - f.w, x));
        y = Math.max(0, Math.min(scr.h - f.h, y));
      }
      scr.blit(f, x, y);
    }

    mouseDown(m, button) {
      if (this.g.colors.fading()) return;
      const top = this.top();
      if (top) {
        if (top.mouseDown) top.mouseDown(m, button);
        return;
      }
      if (this.busy) return;
      const locked = this.w.inCombat && !this.combat.canAct();
      if (this.iface.contains(m)) {
        if (!locked || this.iface.at(m) === 'options') this.iface.mouseDown(m, button);
        return;
      }
      if (locked) return;
      if (button === 2) {
        if (this.targeting) this.targeting = null;
        else this.cursor = this.cursor === 'move' ? 'action' : 'move';
        return;
      }
      if (button !== 0) return;
      if (this.targeting) {
        const t = this.targeting;
        if (t.attack) {
          if (this.hover && !this.hover.dude && FO.pidType(this.hover.pid) === FO.PID.CRITTER) this.combat.attackThis(this.hover, false);
          return;
        }
        this.targeting = null;
        if (!this.hover) return;
        if (t.item) this.useItemOn(t.item, this.hover);
        else this.applySkill(t.skill, this.hover);
        return;
      }
      if (this.cursor === 'move') this.walkTo(this.hoverHex);
      else this.press = { t: this.g.now || 0, obj: this.hover, x: m.x, y: m.y };
    }

    mouseMove(m) {
      const top = this.top();
      if (top && top.mouseMove) top.mouseMove(m);
    }

    useItemOn(item, target) {
      const w = this.w;
      const d = w.dude;
      this.approach(target, 1, () => {
        w.anim.run([{ kind: 'anim', obj: d, code: FO.ANIM.MAGIC_HANDS_MIDDLE, done: () => {
          const kit = FO.useKit(this, d, target, item);
          if (kit !== null) {
            if (kit === 1) FO.consumeOne(this, d, item);
            this.iface.refreshItems();
            return;
          }
          const s = this.exec(target, FO.ACT.USE_OBJ_ON, { source: d, usedWith: item });
          if (s && s.overrides) return;
          FO.useItemOn(this, d, target, item);
          this.iface.refreshItems();
        } }]);
      });
    }

    mouseUp(m, button) {
      if (this.g.colors.fading()) return;
      const top = this.top();
      if (top) {
        if (top.mouseUp) top.mouseUp(m, button);
        return;
      }
      if (this.iface.pressed) {
        this.iface.mouseUp(m, button);
        return;
      }
      if (button !== 0) return;
      const press = this.press;
      this.press = null;
      if (this.menu) {
        const menu = this.menu;
        this.menu = null;
        this.doAction(menu.items[menu.hover], menu.obj);
        return;
      }
      if (press && press.obj) this.doAction(this.menuItems(press.obj)[0], press.obj);
    }

    menuItems(o) {
      const w = this.w;
      const type = FO.pidType(o.pid);
      if (o.dude) return ['rotate', 'skill', 'inven', 'cancel'];
      if (type === FO.PID.CRITTER) return w.isDead(o) ? ['use', 'look', 'skill', 'inven', 'cancel'] : ['talk', 'look', 'skill', 'inven', 'cancel'];
      if (type === FO.PID.ITEM) return ['use', 'look', 'skill', 'inven', 'cancel'];
      if (type === FO.PID.SCENERY) return ['use', 'look', 'skill', 'inven', 'cancel'];
      return ['look', 'cancel'];
    }

    doAction(kind, o) {
      if (!o || kind === 'cancel') return;
      if (kind === 'look') this.look(o);
      else if (kind === 'talk') this.talk(o);
      else if (kind === 'use') this.act(o);
      else if (kind === 'rotate') this.w.dude.rot = (this.w.dude.rot + 1) % 6;
      else if (kind === 'skill') this.openSkilldex(o);
      else if (kind === 'inven') this.openInventory(o);
    }

    walkTo(hex) {
      const w = this.w;
      const d = w.dude;
      if (hex < 0) return;
      if (w.inCombat) {
        this.combat.dudeMove(hex);
        return;
      }
      w.anim.cancel(d);
      const run = this.g.keys.has('ShiftLeft') || this.g.keys.has('ShiftRight') ? !this.g.prefs.running : !!this.g.prefs.running;
      w.anim.run([{ kind: 'move', obj: d, tile: hex, run }]);
    }

    approach(target, near, then) {
      const w = this.w;
      const d = w.dude;
      w.anim.cancel(d);
      const run = !!this.g.prefs.running;
      const tile = target.owner ? target.owner.tile : target.tile;
      if (FO.hexDist(d.tile, tile) <= near) {
        d.rot = FO.hexDir(d.tile, tile);
        then();
        return;
      }
      w.anim.run([{
        kind: 'move', obj: d, tile, near, run,
        done: ok => {
          if (!ok && FO.hexDist(d.tile, tile) > near) {
            this.say(this.text(661));
            return;
          }
          d.rot = FO.hexDir(d.tile, tile);
          then();
        }
      }]);
    }

    exec(o, action, opts) {
      if (!this.sc || !o || !o.script) return null;
      return this.sc.exec(o.script, action, opts);
    }

    look(o) {
      const w = this.w;
      if (o.dude) {
        this.say(this.text(490).replace('%s', w.dude.name || 'yourself'));
        return;
      }
      const s = this.exec(o, FO.ACT.LOOK_AT, { source: w.dude });
      if (s && s.overrides) return;
      const name = this.g.protos.name(o.pid);
      if (w.isDead(o)) this.say(this.text(491).replace('%s', name));
      else if (name) this.say(this.text(490).replace('%s', name));
      else this.say(this.text(493));
    }

    examine(o) {
      const s = this.exec(o, FO.ACT.DESCRIPTION, { source: this.w.dude });
      if (s && s.overrides) return;
      const desc = this.g.protos.desc(o.pid);
      if (desc) this.say(desc);
      else this.look(o);
    }

    talk(o, direct) {
      const w = this.w;
      if (!o || w.isDead(o)) return;
      const go = () => {
        if (o.script) this.exec(o, FO.ACT.TALK, { source: w.dude });
        else this.say(this.text(904));
      };
      if (direct) {
        go();
        return;
      }
      if (FO.hexDist(w.dude.tile, o.tile) < 9 && !FO.shotBlocked(w, w.dude, o)) {
        w.anim.cancel(w.dude);
        w.dude.rot = FO.hexDir(w.dude.tile, o.tile);
        go();
      } else {
        this.approach(o, 1, go);
      }
    }

    useObject(who, o) {
      const w = this.w;
      if (!o || FO.fidType(o.fid) !== FO.ART.SCENERY) return;
      if (w.isDoor(o)) {
        this.useDoor(who, o);
        return;
      }
      const s = this.exec(o, FO.ACT.USE, { source: who });
      if (s && s.overrides) return;
      if (who && who.dude) this.say(this.text(MSG.SEEN).replace('%s', this.g.protos.name(o.pid)));
    }

    useDoor(who, door) {
      const w = this.w;
      const g = this.g;
      if (w.locked(door)) FO.uiSound(g, FO.sfxOpen(g, door, FO.SFX_OPEN.LOCKED));
      const s = this.exec(door, FO.ACT.USE, { source: who });
      if (s && s.overrides) return;
      if (door.frame === 0 && (door.openFlags & FO.DOOR_OPEN)) return;
      const open = door.frame === 0;
      if (!open && w.doorBlockedByObject(door)) return;
      w.setDoor(door, open, null, FO.sfxOpen(g, door, open ? FO.SFX_OPEN.OPEN : FO.SFX_OPEN.CLOSE));
    }

    useContainer(who, o) {
      const w = this.w;
      const g = this.g;
      if (w.locked(o)) {
        FO.uiSound(g, FO.sfxOpen(g, o, FO.SFX_OPEN.LOCKED));
        if (who && who.dude) this.say(this.text(MSG.LOCKED));
        return;
      }
      const s = this.exec(o, FO.ACT.USE, { source: who });
      if (s && s.overrides) return;
      const opening = o.frame === 0;
      w.anim.run([
        { kind: 'sfx', obj: o, delay: 0, sound: FO.sfxOpen(g, o, opening ? FO.SFX_OPEN.OPEN : FO.SFX_OPEN.CLOSE) },
        { kind: 'anim', obj: o, delay: 0, hold: true, noOffset: true, reverse: !opening }
      ]);
      if (who && who.dude) this.say(this.text(opening ? MSG.SEARCH : MSG.CLOSE).replace('%s', g.protos.name(o.pid)));
    }

    pickUp(who, o) {
      if (o.tile < 0) return;
      const s = this.exec(o, FO.ACT.PICKUP, { source: who });
      if (s && s.overrides) return;
      this.w.take(who, o, o.quantityOnGround || 1);
    }

    handsSteps(who, magic) {
      const A = FO.ANIM;
      const code = FO.fidWeapon(who.fid);
      const before = code ? [{ kind: 'sfx', obj: who, sound: FO.sfxArt(this.g, who, A.PUT_AWAY, 0) }, { kind: 'anim', obj: who, code: A.PUT_AWAY, delay: 0 }] : [];
      const after = code ? [{ kind: 'sfx', obj: who, delay: -1, sound: FO.sfxArt(this.g, who, A.TAKE_OUT, code) }, { kind: 'anim', obj: who, code: A.TAKE_OUT, delay: 0 }] : [];
      return { before, hands: { kind: 'anim', obj: who, code: magic, delay: -1 }, after };
    }

    async getObject(who, o) {
      const w = this.w;
      const g = this.g;
      const A = FO.ANIM;
      if (o.tile < 0) return;
      const p = o.proto || {};
      const actionFrame = async code => {
        const frm = await g.art.load(FO.critterFid(who, code));
        return frm ? frm.action | 0 : 0;
      };
      if (w.itemType(o) === FO.ITEM.CONTAINER && !(p.flagsExt & PORTABLE_CONTAINER)) {
        const closed = o.frame === 0;
        const h = this.handsSteps(who, (p.openFlags & 1) ? A.MAGIC_HANDS_GROUND : A.MAGIC_HANDS_MIDDLE);
        const frame = await actionFrame(h.hands.code);
        const steps = [...h.before, h.hands];
        if (o.pid !== GIZMO_REMAINS_PID) steps.push({ kind: 'call', obj: who, delay: frame, fn: () => this.useContainer(who, o) });
        steps.push({ kind: 'until', obj: who, test: () => !!h.hands.finished }, ...h.after);
        if (closed || o.pid === GIZMO_REMAINS_PID) steps.push({ kind: 'call', obj: who, delay: -1, fn: () => this.openLoot(o) });
        w.anim.run(steps);
        return;
      }
      const hands = { kind: 'anim', obj: who, code: A.MAGIC_HANDS_GROUND, delay: 0 };
      const frame = await actionFrame(hands.code);
      const sound = FO.sfxPickup(g, o);
      const steps = [hands];
      if (sound) steps.push({ kind: 'sfx', obj: o, delay: frame, sound });
      steps.push({ kind: 'call', obj: who, delay: sound ? 0 : frame, fn: () => this.pickUp(who, o) });
      w.anim.run(steps);
    }

    act(o) {
      const w = this.w;
      const d = w.dude;
      const type = FO.pidType(o.pid);
      if (type === FO.PID.CRITTER) {
        if (w.isDead(o)) this.approach(o, 1, () => this.openLoot(o));
        else this.talk(o);
        return;
      }
      if (type === FO.PID.ITEM) {
        this.approach(o, 1, () => this.getObject(d, o));
        return;
      }
      if (type === FO.PID.SCENERY) {
        this.approach(o, 1, () => {
          const p = o.proto || {};
          const h = this.handsSteps(d, (p.flagsExt & 1) ? FO.ANIM.MAGIC_HANDS_GROUND : FO.ANIM.MAGIC_HANDS_MIDDLE);
          w.anim.run([...h.before, h.hands, { kind: 'call', obj: d, delay: -1, fn: () => this.useObject(d, o) }, ...h.after]);
        });
        return;
      }
      this.look(o);
    }

    attack(attacker, target, args) {
      if (!attacker || !target || !attacker.critter || !target.critter) return;
      if (attacker.critter.results & (FO.DAM.KNOCKED_OUT | FO.DAM.DEAD | FO.DAM.LOSE_TURN)) return;
      if (target.critter.results & FO.DAM.DEAD) return;
      attacker.hostile = true;
      const a = args || [];
      if (this.combat.active) {
        if (!(attacker.critter.maneuver & FO.MANEUVER.ENGAGING)) {
          attacker.critter.maneuver |= FO.MANEUVER.ENGAGING;
          FO.setWhoHitMe(attacker, target);
        }
        return;
      }
      const same = (a[5] | 0) === (a[6] | 0);
      this.requestCombat({
        attacker, defender: target, apBonus: 0, accuracy: a[2] | 0, damageBonus: 0, min: a[3] | 0,
        max: a.length ? a[4] | 0 : 0x7FFFFFFF, changeFlags: same ? 1 : 0, attackerResults: same ? a[5] | 0 : 0, targetResults: same ? a[6] | 0 : 0
      });
    }

    requestCombat(gcsd) {
      if (this.combat.active) return;
      this.pendingCombat = gcsd || true;
    }

    startCombat(gcsd) {
      this.requestCombat(gcsd);
    }

    queueEvent(t) {
      if (t.kind === 'midnight') return FO.midnight(this);
      const handled = FO.itemEvent(this, t);
      if (handled !== null) return handled;
      const o = t.obj;
      if (t.kind !== 'knockout' || !o || !o.critter || (o.critter.results & FO.DAM.DEAD)) return false;
      o.critter.results &= ~FO.DAM.KNOCKED_OUT;
      o.critter.results |= FO.DAM.KNOCKED_DOWN;
      if (!this.w.inCombat) {
        const anim = FO.fidAnim(o.fid) === FO.ANIM.FALL_BACK ? FO.ANIM.BACK_TO_STANDING : FO.ANIM.PRONE_TO_STANDING;
        o.critter.results &= ~FO.DAM.KNOCKED_DOWN;
        this.w.anim.run([{ kind: 'anim', obj: o, code: anim }]);
      }
      return false;
    }

    giveExp(n) {
      FO.addExperience(this.w.dude, n, () => this.levelUp());
    }

    levelUp() {
      this.say(this.text(600, 'STAT'));
      FO.uiSound(this.g, 'levelup');
    }

    dialogStart(d) {
      this.w.anim.cancel(this.w.dude);
      if (!this.modals.some(m => m instanceof FO.DialogScreen)) this.openModal(new FO.DialogScreen(this, d));
    }

    dialogShow() {}

    dialogEnd() {}

    swapHands() {
      const d = this.w.dude;
      d.hand = (d.hand | 0) ? 0 : 1;
      FO.refreshDudeArt(this);
      this.iface.refreshItems();
      this.targeting = null;
    }

    cycleMode() {
      this.iface.cycle();
    }

    useActive() {
      const w = this.w;
      const d = w.dude;
      const st = this.iface.state();
      if (w.inCombat && !this.combat.canAct()) return;
      if (st.weapon) {
        if (st.action === FO.ITEM_ACTION.RELOAD) {
          const cost = FO.itemApCost(d, (d.hand | 0) ? FO.HIT_MODE.RIGHT_RELOAD : FO.HIT_MODE.LEFT_RELOAD, false);
          if (w.inCombat && cost > d.critter.ap) return;
          let loaded = false;
          while (st.item && FO.tryReload(d, st.item) !== -1) loaded = true;
          if (loaded) FO.reloadSound(this.g, st.item);
          this.iface.cycle();
          this.iface.refreshItems();
          if (w.inCombat) d.critter.ap = Math.max(0, d.critter.ap - cost);
          this.combat.checkInput();
          return;
        }
        this.targeting = { attack: true };
        if (!w.inCombat) this.requestCombat(null);
        return;
      }
      if (FO.canUseItemOn(st.item)) {
        this.targeting = { item: st.item };
        return;
      }
      if (FO.canUseItem(st.item)) {
        const cost = 2;
        if (w.inCombat && cost > d.critter.ap) return;
        if (FO.useItem) FO.useItem(this, d, st.item);
        this.iface.refreshItems();
        if (w.inCombat) d.critter.ap = Math.max(0, d.critter.ap - cost);
        this.combat.checkInput();
      }
    }

    combatKey() {
      if (!this.w.inCombat) this.requestCombat(null);
    }

    openInventory(target) {
      const w = this.w;
      if (w.inCombat && !target) {
        if (!this.combat.canAct()) return;
        const cost = 4 - FO.perkRank(w.dude, FO.PERK.QUICK_POCKETS);
        if (cost > 0) {
          if (cost > w.dude.critter.ap) {
            this.say(this.text(19, 'INVENTRY'));
            return;
          }
          w.dude.critter.ap -= cost;
        }
      }
      this.openModal(new FO.InventoryScreen(this, target ? { useOn: target } : null));
    }

    openLoot(o) {
      this.openModal(new FO.LootScreen(this, o));
    }

    openSteal(o) {
      this.openModal(new FO.LootScreen(this, o, { steal: true }));
    }

    openBarter(npc, mod) {
      if (!npc || this.modals.some(m => m instanceof FO.BarterScreen)) return;
      const talk = this.modals.find(m => m instanceof FO.DialogScreen) || null;
      this.openModal(new FO.BarterScreen(this, npc, mod, talk));
    }

    barter(mod) {
      const d = this.sc && this.sc.dialog;
      if (d && d.npc) this.openBarter(d.npc, mod);
    }

    openOptions() {
      this.openModal(new FO.OptionsScreen(this));
    }

    openSkilldex(target) {
      this.openModal(new FO.SkilldexScreen(this, target || null));
    }

    openAutomap() {
      this.openModal(new FO.AutomapScreen(this));
    }

    openCharacter() {
      this.openModal(new FO.CharacterScreen(this));
    }

    openPipboy(page) {
      if (this.w.inCombat) {
        this.say(this.text(7, 'MISC'));
        return;
      }
      this.openModal(new FO.PipboyScreen(this, page));
    }

    chooseSkill(skill, target) {
      const d = this.w.dude;
      if (skill === FO.SKILL.SNEAK) {
        FO.toggleSneak(this);
        return;
      }
      if (target) {
        this.applySkill(skill, target);
        return;
      }
      this.targeting = { skill };
    }

    applySkill(skill, target) {
      const d = this.w.dude;
      const go = () => this.w.anim.run([{ kind: 'anim', obj: d, code: FO.ANIM.MAGIC_HANDS_MIDDLE, done: () => FO.useSkill(this, skill, target) }]);
      if (target === d) FO.useSkill(this, skill, target);
      else this.approach(target, 1, go);
    }

    saveGame(then) {
      return FO.saveGame(this, false).then(rc => {
        if (then) then(rc);
        return rc;
      });
    }

    loadGame(then) {
      return FO.loadGame(this, false).then(rc => {
        if (then) then(rc);
        return rc;
      });
    }

    quickSave() {
      return FO.saveGame(this, true).then(rc => {
        if (rc === 1) this.say(this.text(MISC_MSG.QUICK_SAVED, 'MISC'));
        return rc;
      });
    }

    quickLoad() {
      const g = this.g;
      return FO.loadGame(this, true).then(rc => {
        if (rc === 1 && g.play) g.play.say(g.play.text(MISC_MSG.QUICK_LOADED, 'MISC'));
        return rc;
      });
    }

    gameKey(fn) {
      FO.uiSound(this.g, KEY_SOUND);
      fn();
      return true;
    }

    openPreferences() {
      this.openModal(new FO.PrefsScreen(this));
    }

    exitGame() {
      this.openModal(new FO.MessageBox(this, { title: this.text(MISC_MSG.QUIT, 'MISC'), yesNo: true, onClose: () => FO.leaveGame(this.g) }));
    }

    openHelp() {
      this.openModal(new FO.PictureScreen(this, 297, 'ART/INTRFACE/HELPSCRN.PAL'));
    }

    endTurn() {
      if (this.combat.active) this.combat.endTurn();
    }

    endCombat() {
      if (this.combat.active) this.combat.requestEnd();
    }

    keyDown(e) {
      const g = this.g;
      if (g.colors.fading()) return true;
      const top = this.top();
      if (top) {
        if (top.keyDown) return top.keyDown(e) !== false;
        return true;
      }
      const ctrl = e.ctrlKey;
      if (this.w.inCombat && !this.combat.canAct() && e.code !== 'KeyO' && e.code !== 'Escape') return true;
      if (ctrl) {
        if (e.code === 'KeyS') return this.gameKey(() => this.saveGame());
        if (e.code === 'KeyL') return this.gameKey(() => this.loadGame());
        if (e.code === 'KeyQ' || e.code === 'KeyX') return this.gameKey(() => this.exitGame());
      }
      switch (e.code) {
        case 'F4': return this.gameKey(() => this.saveGame());
        case 'F5': return this.gameKey(() => this.loadGame());
        case 'F6': return this.gameKey(() => this.quickSave());
        case 'F7': return this.gameKey(() => this.quickLoad());
        case 'F10': return this.gameKey(() => this.exitGame());
        case 'Space': this.endTurn(); return true;
        case 'Enter': case 'NumpadEnter': this.endCombat(); return true;
        case 'KeyA': this.combatKey(); return true;
        case 'Home': this.centerOn(this.w.dude.tile); return true;
        case 'KeyM': this.cursor = this.cursor === 'move' ? 'action' : 'move'; return true;
        case 'KeyI': this.openInventory(); return true;
        case 'KeyC': this.openCharacter(); return true;
        case 'KeyP': if (!ctrl) this.openPipboy(); return true;
        case 'KeyZ': this.openPipboy('alarm'); return true;
        case 'KeyS': if (!ctrl) this.openSkilldex(); return true;
        case 'KeyO': case 'Escape': this.openOptions(); return true;
        case 'KeyB': this.swapHands(); return true;
        case 'KeyN': this.cycleMode(); return true;
        case 'Tab': this.openAutomap(); return true;
        case 'Comma': this.w.dude.rot = (this.w.dude.rot + 5) % 6; return true;
        case 'Period': this.w.dude.rot = (this.w.dude.rot + 1) % 6; return true;
        case 'Slash': this.say(this.timeText()); return true;
        case 'Equal': case 'NumpadAdd': FO.stepBrightness(g, 1); return true;
        case 'Minus': case 'NumpadSubtract': FO.stepBrightness(g, -1); return true;
        case 'F9': if (g.opts.debug !== false) g.setMode(new FO.MapViewer(g)); return true;
        case 'F1': this.openHelp(); return true;
        case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5': case 'Digit6': case 'Digit7': case 'Digit8':
          this.chooseSkill([8, 9, 10, 11, 6, 7, 12, 13][+e.code.slice(5) - 1]);
          return true;
        default: return false;
      }
    }

    timeText() {
      const c = FO.calendar(this.sc ? this.sc.time : FO.START_TIME);
      const h = this.sc ? this.sc.hour() : 0;
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return c.day + ' ' + FO.tr(this.g, months[c.month - 1]) + ' ' + c.year + ' ' + String(h).padStart(4, '0');
    }
  }

  FO.Play = Play;
})(globalThis.FO = globalThis.FO || {});
