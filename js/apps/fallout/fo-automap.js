(function (FO) {
  'use strict';

  const ART = { BACK: 171, RED_UP: 8, RED_DOWN: 9, SWITCH_HIGH: 172, SWITCH_LOW: 173 };
  const WIN = { x: 75, y: 0, w: 519, h: 480 };
  const EXIT_MARKER_PID = 0x2000031;
  const AUTO_INVISO_PID = 0x2000158;
  const MOTION_SENSOR_PID = 59;

  FO.mapPlaceName = function (w, index) {
    const e = w.mapMsg && w.mapMsg.get(100 + index);
    return e ? e.text : '';
  };

  FO.mapLevelName = function (w, index, elev) {
    const e = w.mapMsg && w.mapMsg.get(200 + index * 3 + elev);
    return e ? e.text : '';
  };

  FO.automapKind = function (o) {
    if (!(o.flags & FO.FLAG.SEEN) || o.tile < 0) return 0;
    const type = (o.fid >>> 24) & 0xF;
    if (type === FO.ART.WALL) return 1;
    if (type === FO.ART.SCENERY && o.pid !== AUTO_INVISO_PID) return 2;
    return 0;
  };

  FO.hasAutomap = function (state, elev) {
    if (!FO.EXE.automap.includes(state.index)) return false;
    return state.byElev[elev].some(o => FO.automapKind(o));
  };

  FO.drawPipAutomap = function (g, scr, state, elev, ox, oy, clip) {
    const colors = [0, FO.uiColor(g, 'green'), FO.uiColor(g, 'deepGreen')];
    for (const o of state.byElev[elev]) {
      const kind = FO.automapKind(o);
      if (!kind) continue;
      const row = Math.floor(o.tile / 200);
      const idx = row * 200 + (200 - (o.tile % 200));
      const x = ox + 238 + 2 * (idx % 200);
      const y = oy + 105 + 2 * Math.floor(idx / 200);
      if (x < clip[0] || y < clip[1] || x + 2 > clip[2] || y >= clip[3]) continue;
      scr.rect(x, y, 2, 1, colors[kind]);
    }
  };

  class AutomapScreen extends FO.Win {
    constructor(play) {
      super(play);
      this.overBar = true;
      this.scanner = false;
      this.button({ id: 'scanner', x: 111, y: 454, w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, key: ['KeyS'], onClick: () => this.scan() });
      this.button({ id: 'cancel', x: 277, y: 454, w: 15, h: 16, up: ART.RED_UP, down: ART.RED_DOWN, key: ['Escape', 'Tab', 'KeyA'], onClick: () => this.close() });
      this.button({ id: 'detail', x: 457, y: 340, w: 42, h: 74, up: -1, down: -1, sound: 'toggle', onClick: () => { play.automapHigh = !play.automapHigh; } });
    }

    async enter() {
      this.p.w.processSeen();
      await this.g.art.loadAll(Object.values(ART).map(FO.IFACE));
    }

    scan() {
      const p = this.p;
      const d = p.w.dude;
      const sensor = (d.inventory || []).map(e => e.obj).find(o => o.pid === MOTION_SENSOR_PID && (o.flags & (FO.FLAG.LEFT_HAND | FO.FLAG.RIGHT_HAND)));
      const say = id => p.openModal(new FO.MessageBox(p, { title: p.text(id, 'MISC'), x: 165, y: 140 }));
      if (!sensor) {
        say(17);
        return;
      }
      if ((sensor.charges | 0) <= 0) {
        say(18);
        return;
      }
      sensor.charges--;
      this.scanner = true;
    }

    keyDown(e) {
      if (e.code === 'KeyH') this.p.automapHigh = true;
      else if (e.code === 'KeyL') this.p.automapHigh = false;
      else return super.keyDown(e);
      return true;
    }

    tint(o, high) {
      const w = this.p.w;
      const type = (o.fid >>> 24) & 0xF;
      if (type === FO.ART.CRITTER && !(o.flags & FO.FLAG.HIDDEN) && this.scanner && !w.isDead(o)) return 'red';
      if (!(o.flags & FO.FLAG.SEEN)) return null;
      if (o.pid === EXIT_MARKER_PID) return 'orange';
      if (type === FO.ART.WALL) return 'green';
      if (type === FO.ART.SCENERY && high && o.pid !== AUTO_INVISO_PID) return 'deepGreen';
      if (o.dude) return 'red';
      return null;
    }

    draw(scr) {
      const g = this.g;
      const w = this.p.w;
      const [ox, oy] = FO.screenOrigin(scr, this.g);
      this.x = ox + WIN.x;
      this.y = oy + WIN.y;
      this.blit(scr, ART.BACK, 0, 0);
      const high = !!this.p.automapHigh;
      this.blit(scr, high ? ART.SWITCH_HIGH : ART.SWITCH_LOW, 457, 340);
      this.drawButtons(scr);
      const green = this.color('green');
      const wall = FO.uiColor(g, 'green');
      const scenery = FO.uiColor(g, 'deepGreen');
      const at = (x, y) => scr.px[(this.y + y) * scr.w + this.x + x];
      const put = (x, y, c) => {
        if (x < 0 || y < 0 || x >= WIN.w || y >= WIN.h) return;
        scr.px[(this.y + y) * scr.w + this.x + x] = c;
      };
      for (const o of w.map.byElev[w.elev]) {
        if (o.tile < 0) continue;
        const name = this.tint(o, high);
        if (!name) continue;
        const c = FO.uiColor(g, name);
        const x = 449 - 2 * (o.tile % 200);
        const y = 2 * Math.floor(o.tile / 200) + 8;
        if (at(x, y) !== wall || c !== scenery) put(x, y, c);
        if (at(x + 1, y) !== wall || c !== scenery) put(x + 1, y, c);
        if (o.dude) {
          put(x - 1, y, c);
          put(x, y - 1, c);
          put(x, y + 1, c);
        }
      }
      const idx = w.map.index;
      FO.textIn(g, FO.mapPlaceName(w, idx), this.x + 240, this.y + 380, 0, green, 101);
      FO.textIn(g, FO.mapLevelName(w, idx, w.elev), this.x + 240, this.y + 396, 0, green, 101);
    }
  }

  FO.AutomapScreen = AutomapScreen;
})(globalThis.FO = globalThis.FO || {});
