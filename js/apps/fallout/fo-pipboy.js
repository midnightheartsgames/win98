(function (FO) {
  'use strict';

  const ART = { PIP: 127, RED_UP: 8, RED_DOWN: 9, NUMBERS: 82, MONTHS: 129, ALARM_DOWN: 131, ALARM_UP: 132, LOGO: 133 };
  const VIEW = { x: 254, y: 46, w: 374, h: 410 };
  const T = { CENTER: 0x02, RIGHT: 0x04, UNDERLINE: 0x08, LEFT_HEAD: 0x10, RIGHT_HEAD: 0x20, STRIKE: 0x40, EDGE: 0x80 };
  const WATER_CHIP = 101;
  const DISK_LINES = 35;
  const DISK_WIDTH = 348;
  const FIRST_ARCHIVE = 3;
  const MINUTE = FO.TICKS_PER_SEC * 60;
  const HOUR = MINUTE * 60;
  const DAY = HOUR * 24;
  const REST = [
    { minutes: 10 }, { minutes: 30 }, { minutes: 60 }, { minutes: 120 }, { minutes: 180 }, { minutes: 240 }, { minutes: 300 }, { minutes: 360 },
    { hour: 6 }, { hour: 12 }, { hour: 18 }, { hour: 0 }, { healed: true }
  ];

  FO.questValue = function (gvars, gvar) {
    const v = gvars[gvar] | 0;
    if (gvar === WATER_CHIP) return v > 1 ? 2 : 1;
    return v;
  };

  FO.pipQuests = function (gvars) {
    const cities = [];
    for (const [city, msg, gvar] of FO.EXE.quests) {
      const v = FO.questValue(gvars, gvar);
      if (v <= 0) continue;
      let c = cities.find(x => x.msg === city);
      if (!c) cities.push(c = { msg: city, quests: [] });
      c.quests.push({ msg, done: v !== 1 });
    }
    return cities;
  };

  FO.pipDisks = function (gvars) {
    return FO.EXE.holodisks.map((gvar, i) => (gvars[gvar] | 0) ? i : -1).filter(i => i >= 0);
  };

  FO.restTicks = function (time, choice) {
    const o = REST[choice];
    if (!o) return 0;
    if (o.minutes) return o.minutes * MINUTE;
    if (o.hour !== undefined) return (o.hour * HOUR - (time % DAY) + DAY) % DAY;
    return Infinity;
  };

  class PipboyScreen extends FO.Win {
    constructor(play, page) {
      super(play);
      this.overBar = true;
      this.msg = new Map();
      this.page = page || 'logo';
      this.hot = [];
      this.city = 0;
      this.disk = -1;
      this.diskPage = 0;
      this.place = null;
      this.level = null;
      this.rest = null;
      const pages = ['status', 'automaps', 'archives', 'close'];
      [0, 2, 3, 4].forEach((slot, i) => this.button({ id: pages[i], x: 53, y: 341 + slot * 27, w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, onClick: () => this.choose(pages[i]) }));
      this.button({ id: 'alarm', x: 124, y: 13, w: 28, h: 24, up: ART.ALARM_UP, down: ART.ALARM_DOWN, sound: 'ib2', onClick: () => this.choose('alarm') });
    }

    async enter() {
      const g = this.g;
      const path = FO.textPath('GAME\\PIPBOY.MSG');
      this.msg = g.data.has(path) ? FO.readMsg(await g.data.text(path)) : new Map();
      await g.art.loadAll(Object.values(ART).map(FO.IFACE));
      if (this.page === 'alarm' && !this.p.canRest()) {
        this.page = 'logo';
        this.refuseRest();
      }
    }

    m(id) {
      const e = this.msg.get(id);
      return e ? e.text : '';
    }

    get gvars() {
      return this.p.sc ? this.p.sc.gvars : [];
    }

    get lh() {
      const f = this.g.fonts[101];
      return f.height + f.lineGap;
    }

    get lastLine() {
      return Math.floor(VIEW.h / this.lh) - 1;
    }

    refuseRest() {
      this.p.openModal(new FO.MessageBox(this.p, { title: this.m(215), x: 192, y: 135, large: true }));
    }

    choose(name) {
      if (this.rest) return;
      if (name === 'close') {
        this.close();
        return;
      }
      if (name === 'alarm') {
        if (!this.p.canRest()) {
          this.refuseRest();
          return;
        }
      }
      if (name === 'automaps') this.p.w.processSeen();
      this.page = name;
    }

    keyDown(e) {
      if (e.code === 'Escape' && this.rest) {
        this.rest = null;
        return true;
      }
      if (e.code === 'Escape' || e.code === 'KeyP' || e.code === 'KeyZ') {
        if (!this.rest) this.close();
        return true;
      }
      return super.keyDown(e);
    }

    update(dt) {
      const r = this.rest;
      if (!r) return;
      const p = this.p;
      const d = p.w.dude;
      const rate = r.healed ? 12 * HOUR : Math.max(3 * HOUR, r.total / 2.5);
      let budget = Math.max(1, Math.round(rate * Math.min(dt, 0.1)));
      while (budget > 0 && this.rest) {
        const step = Math.min(budget, r.left, 10 * MINUTE);
        const stop = p.passTime(step, true);
        budget -= step;
        r.left -= step;
        const healed = (d.critter.hp | 0) >= FO.statValue(d, FO.STAT.MAX_HP);
        if (stop || p.gameOver || r.left <= 0 || (r.healed && healed) || !p.canRest() || (p.sc && (p.sc.dialog || p.sc.requests.length))) this.rest = null;
      }
    }

    startRest(choice) {
      const p = this.p;
      const d = p.w.dude;
      const total = FO.restTicks(p.sc ? p.sc.time : FO.START_TIME, choice);
      const healed = (d.critter.hp | 0) >= FO.statValue(d, FO.STAT.MAX_HP);
      if (!total || (REST[choice].healed && healed)) return;
      this.rest = { choice, total, left: total, healed: !!REST[choice].healed };
    }

    put(scr, s, flags, color, line, act, area) {
      const g = this.g;
      const f = g.fonts[101];
      const w = f.width(s);
      let x = flags & T.EDGE ? 1 : 8;
      if (flags & T.CENTER) x = Math.trunc((350 - w) / 2);
      else if (flags & T.RIGHT) x += 175;
      else if (flags & T.LEFT_HEAD) x += 102 - w;
      else if (flags & T.RIGHT_HEAD) x += 260 - w;
      const sx = this.x + VIEW.x + x;
      const sy = this.y + VIEW.y + line * this.lh;
      let name = color;
      if (act) {
        const box = area ? [this.x + VIEW.x + area[0], sy - 4, area[1], this.lh + 8] : [sx - 4, sy - 3, w + 8, this.lh + 6];
        const key = line + ':' + s;
        this.hot.push({ box, key, act });
        if (!this.rest && this.inside(box)) name = 'yellow';
      }
      const c = this.color(name);
      f.draw(scr, s, sx, sy, c, g.colors);
      if (flags & T.UNDERLINE) scr.rect(sx, sy + f.height - 1, w, 1, c);
      if (flags & T.STRIKE) scr.rect(sx, sy + 3, w, 1, c);
    }

    inside(box) {
      const m = this.g.mouse;
      return m.x >= box[0] && m.y >= box[1] && m.x < box[0] + box[2] && m.y < box[1] + box[3];
    }

    hotAt() {
      for (let i = this.hot.length - 1; i >= 0; i--) if (this.inside(this.hot[i].box)) return this.hot[i];
      return null;
    }

    mouseDown(m, button) {
      super.mouseDown(m, button);
      this.pressedHot = !this.pressed && button === 0 && !this.rest ? this.hotAt() : null;
    }

    mouseUp(m, button) {
      if (this.pressed) {
        super.mouseUp(m, button);
        return;
      }
      const h = this.pressedHot;
      this.pressedHot = null;
      const now = this.hotAt();
      if (h && now && now.key === h.key) h.act();
    }

    number(scr, v, n, x, y) {
      const nums = this.art(ART.NUMBERS);
      if (!nums) return;
      let value = Math.max(0, v | 0);
      for (let i = n - 1; i >= 0; i--) {
        scr.blitPart(nums, (value % 10) * 9, 0, 9, 17, this.x + x + i * 9, this.y + y);
        value = Math.floor(value / 10);
      }
    }

    drawClock(scr) {
      const sc = this.p.sc;
      const c = FO.calendar(sc ? sc.time : FO.START_TIME);
      this.number(scr, c.day, 2, 20, 17);
      const months = this.art(ART.MONTHS);
      if (months) scr.blitPart(months, 0, (c.month - 1) * 15, 29, 14, this.x + 46, this.y + 18);
      this.number(scr, c.year, 4, 83, 17);
      this.number(scr, sc ? sc.hour() : 0, 4, 155, 17);
    }

    draw(scr) {
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox;
      this.y = oy;
      this.blit(scr, ART.PIP, 0, 0);
      this.drawButtons(scr);
      if (this.rest) this.blit(scr, ART.ALARM_DOWN, 124, 13);
      this.drawClock(scr);
      this.hot = [];
      const pages = {
        logo: this.drawLogo, status: this.drawStatus, quests: this.drawQuests, disk: this.drawDisk, automaps: this.drawPlaces,
        levels: this.drawLevels, automap: this.drawAutomap, archives: this.drawArchives, alarm: this.drawAlarm
      };
      (pages[this.page] || this.drawLogo).call(this, scr);
    }

    drawLogo(scr) {
      const logo = this.art(ART.LOGO);
      this.blit(scr, ART.LOGO, 323, 156);
      const c = FO.calendar(this.p.sc ? this.p.sc.time : FO.START_TIME);
      const day = FO.EXE.holidays.find(h => h[0] === c.month && h[1] === c.day);
      if (!day || !logo) return;
      const s = this.m(day[2]);
      const w = this.g.fonts[101].width(s);
      FO.textIn(this.g, s, this.x + 323 + (logo.w >> 1) - (w >> 1) + 6, this.y + 174 + logo.h, 0, this.color('green'), 101);
    }

    drawStatus(scr) {
      const quests = FO.pipQuests(this.gvars);
      const disks = FO.pipDisks(this.gvars);
      this.put(scr, this.m(202), T.UNDERLINE | (disks.length ? T.LEFT_HEAD : T.CENTER), 'green', 0);
      if (!quests.length) this.put(scr, this.m(203), 0, 'green', 2);
      quests.forEach((c, i) => this.put(scr, this.m(c.msg), 0, 'green', 2 + i * 2, () => {
        this.city = c.msg;
        this.page = 'quests';
      }, [0, 183]));
      if (!disks.length) return;
      this.put(scr, this.m(211), T.UNDERLINE | T.RIGHT_HEAD, 'green', 0);
      disks.forEach((d, i) => this.put(scr, this.m(400 + d), T.RIGHT, 'green', 2 + i * 2, () => {
        this.disk = d;
        this.diskPage = 0;
        this.page = 'disk';
      }, [183, VIEW.w - 183]));
    }

    back(scr, to) {
      this.put(scr, this.m(201), T.CENTER, 'green', this.lastLine, () => {
        this.page = to;
      });
    }

    drawQuests(scr) {
      const city = FO.pipQuests(this.gvars).find(c => c.msg === this.city);
      this.put(scr, this.m(this.city) + ' ' + this.m(210), T.UNDERLINE, 'green', 1);
      let line = 3;
      (city ? city.quests : []).forEach((q, i) => {
        for (const l of this.g.fonts[101].wrap((i + 1) + '. ' + this.m(q.msg), 350)) {
          this.put(scr, l, q.done ? T.STRIKE : 0, q.done ? 'doneGreen' : 'green', line);
          line += 2;
        }
      });
      this.back(scr, 'status');
    }

    diskText(d) {
      const out = [];
      const base = (d + 1) * 1000;
      for (let id = base; id < base + 1500; id++) {
        const e = this.msg.get(id);
        if (!e || e.text === '**END-DISK**') break;
        const f = this.g.fonts[101];
        if (f.width(e.text) <= DISK_WIDTH) out.push(e.text);
        else out.push(...f.wrap(e.text, DISK_WIDTH));
      }
      return out;
    }

    drawDisk(scr) {
      const text = this.diskText(this.disk);
      const pages = Math.max(1, Math.ceil(text.length / DISK_LINES));
      const page = Math.min(this.diskPage, pages - 1);
      if (page === 0) this.put(scr, this.m(400 + this.disk), T.CENTER | T.UNDERLINE, 'green', 0);
      if (pages > 1) {
        const s = (page + 1) + ' ' + this.m(212) + ' ' + pages;
        FO.textIn(this.g, s, this.x + 580 - this.g.fonts[101].width(s), this.y + 48, 0, this.color('green'), 101);
      }
      let line = 3;
      for (const l of text.slice(page * DISK_LINES, (page + 1) * DISK_LINES)) {
        if (l !== '**END-PAR**') this.put(scr, l, T.EDGE, 'green', line);
        line++;
      }
      const last = this.lastLine;
      this.put(scr, this.m(201), T.LEFT_HEAD, 'green', last, () => {
        if (page > 0) this.diskPage = page - 1;
        else this.page = 'status';
      });
      if (page < pages - 1) this.put(scr, this.m(200), T.RIGHT_HEAD, 'green', last, () => {
        this.diskPage = page + 1;
      });
      else this.put(scr, this.m(214), T.RIGHT_HEAD, 'green', last, () => {
        this.page = 'status';
      });
    }

    places() {
      const w = this.p.w;
      const states = new Set([...w.states.values(), w.map].filter(Boolean));
      const groups = new Map();
      for (const st of states) {
        const levels = [0, 1, 2].filter(e => FO.hasAutomap(st, e));
        if (!levels.length) continue;
        const name = FO.mapPlaceName(w, st.index);
        if (!groups.has(name)) groups.set(name, []);
        for (const e of levels) groups.get(name).push({ state: st, elev: e });
      }
      return [...groups.entries()].sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0).map(([name, levels]) => ({ name, levels }));
    }

    drawPlaces(scr) {
      this.put(scr, this.m(205), T.CENTER | T.UNDERLINE, 'green', 0);
      this.places().forEach((pl, i) => this.put(scr, pl.name, 0, 'green', 2 + i * 2, () => {
        this.place = pl.name;
        this.page = 'levels';
      }, [0, 350]));
    }

    drawLevels(scr) {
      const w = this.p.w;
      const pl = this.places().find(x => x.name === this.place);
      this.put(scr, this.m(205), T.CENTER | T.UNDERLINE, 'green', 0);
      this.put(scr, this.place || '', T.CENTER, 'green', 2);
      (pl ? pl.levels : []).forEach((lv, i) => {
        const name = FO.mapLevelName(w, lv.state.index, lv.elev) || this.place;
        this.put(scr, name, 0, 'green', 4 + i * 2, () => {
          this.level = lv;
          this.page = 'automap';
        }, [0, 350]);
      });
      this.back(scr, 'automaps');
    }

    drawAutomap(scr) {
      const lv = this.level;
      if (lv) FO.drawPipAutomap(this.g, scr, lv.state, lv.elev, this.x, this.y, [this.x + VIEW.x, this.y + VIEW.y, this.x + VIEW.x + VIEW.w, this.y + VIEW.y + VIEW.h]);
      this.back(scr, 'levels');
    }

    drawArchives(scr) {
      const seen = this.p.w.movies || new Set();
      this.put(scr, this.m(206), T.CENTER | T.UNDERLINE, 'green', 0);
      let line = 2;
      FO.EXE.movies.forEach((name, i) => {
        if (i < FIRST_ARCHIVE || !seen.has(i)) return;
        this.put(scr, this.m(500 + i), 0, 'green', line, () => this.p.playMovie(i), [0, 350]);
        line += 2;
      });
    }

    drawAlarm(scr) {
      const d = this.p.w.dude;
      this.put(scr, this.m(300), T.CENTER | T.UNDERLINE, 'green', 0);
      const hp = this.m(301) + ' ' + (d.critter.hp | 0) + '/' + FO.statValue(d, FO.STAT.MAX_HP);
      const w = this.g.fonts[101].width(hp);
      FO.textIn(this.g, hp, this.x + VIEW.x + ((350 - w) >> 1), this.y + 66, 0, this.color('green'), 101);
      REST.forEach((o, i) => {
        const line = 5 + i * 2;
        if (this.rest && this.rest.choice === i) this.put(scr, this.m(302 + i), 0, 'yellow', line);
        else this.put(scr, this.m(302 + i), 0, 'green', line, () => this.startRest(i), [0, 350]);
      });
    }
  }

  FO.PipboyScreen = PipboyScreen;
})(globalThis.FO = globalThis.FO || {});
