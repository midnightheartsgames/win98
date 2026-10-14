(function (FO) {
  'use strict';

  class MapViewer {
    constructor(game) {
      this.g = game;
      this.names = [];
      this.index = 0;
      this.elev = 0;
      this.x = 0;
      this.y = 0;
      this.roofs = true;
      this.night = false;
      this.map = null;
      this.vis = [];
      this.busy = false;
    }

    async enter() {
      const D = this.g.data;
      const msg = FO.readMsg(await D.text(FO.textPath('GAME\\MAP.MSG')));
      const listed = [];
      for (let i = 0; i < 200; i++) {
        const m = msg.get(i);
        if (m && /\.MAP$/i.test(m.text)) listed.push(m.text.replace(/\.MAP$/i, '').toUpperCase());
      }
      const all = D.list(/^MAPS\\[^\\]+\.MAP$/).map(k => k.slice(5, -4));
      this.names = listed.concat(all.filter(n => !listed.includes(n)));
      const start = this.names.indexOf(this.g.opts.map || 'V13ENT');
      await this.open(start >= 0 ? start : 0);
    }

    async open(index, elev) {
      if (this.busy) return;
      this.busy = true;
      const g = this.g;
      this.index = (index + this.names.length) % this.names.length;
      const name = this.names[this.index];
      g.status = 'Loading ' + name + '...';
      try {
        this.map = FO.readMap(await g.data.get('MAPS\\' + name + '.MAP'), g.protos);
        const h = this.map.header;
        this.elev = elev === undefined ? h.elev : elev;
        this.center(h.tile);
        await this.preload();
        this.relight();
        g.status = '';
      } catch (e) {
        g.status = name + ': ' + e.message;
      }
      this.busy = false;
    }

    async preload() {
      const fids = [];
      const e = this.elev;
      for (let sq = 0; sq < FO.SQUARES; sq++) {
        fids.push(FO.fid(FO.ART.TILE, this.map.floors[e][sq] & 0xFFF), FO.fid(FO.ART.TILE, this.map.roofs[e][sq] & 0xFFF));
      }
      for (const o of this.map.objects[e]) fids.push(o.fid);
      await this.g.art.loadAll(fids);
    }

    relight() {
      this.light = FO.computeLight(this.map.objects[this.elev], this.night ? 0x4000 : FO.LIGHT_FULL);
    }

    center(tile) {
      const [cx, cy] = FO.hexCenter(tile);
      this.x = Math.round(cx - this.g.scr.w / 2);
      this.y = Math.round(cy - (this.g.scr.h - 100) / 2);
    }

    view() {
      const g = this.g;
      let hiddenRoof = null;
      if (g.mouse.inside) {
        const hex = FO.worldHex(g.mouse.x + this.x, g.mouse.y + this.y);
        if (hex >= 0) hiddenRoof = FO.roofHidden(this.map.roofs[this.elev], FO.hexSquare(hex));
      }
      return {
        map: this.map, elev: this.elev, x: this.x, y: this.y, art: g.art, colors: g.colors,
        objects: this.map.objects, light: this.light, roofs: this.roofs, hiddenRoof
      };
    }

    update(dt) {
      const g = this.g;
      const k = g.keys;
      const speed = 640 * dt;
      let dx = 0;
      let dy = 0;
      if (k.has('ArrowLeft')) dx -= speed;
      if (k.has('ArrowRight')) dx += speed;
      if (k.has('ArrowUp')) dy -= speed;
      if (k.has('ArrowDown')) dy += speed;
      if (g.mouse.inside) {
        if (g.mouse.x < 6) dx -= speed;
        if (g.mouse.x >= g.scr.w - 6) dx += speed;
        if (g.mouse.y < 6) dy -= speed;
        if (g.mouse.y >= g.scr.h - 6) dy += speed;
      }
      this.x = Math.round(Math.max(-600, Math.min(8400, this.x + dx)));
      this.y = Math.round(Math.max(-1800, Math.min(2900, this.y + dy)));
    }

    pick(mx, my) {
      for (let i = this.vis.length - 1; i >= 0; i--) {
        const e = this.vis[i];
        const lx = mx - e.x;
        const ly = my - e.y;
        if (lx < 0 || ly < 0 || lx >= e.f.w || ly >= e.f.h) continue;
        if (e.f.px[ly * e.f.w + lx]) return e.o;
      }
      return null;
    }

    draw(scr) {
      const g = this.g;
      if (!this.map) {
        scr.fill(0);
        return;
      }
      this.vis = FO.drawMap(scr, this.view());
      const green = g.color(0, 255, 0);
      const name = this.names[this.index];
      g.text(name + '  elevation ' + this.elev + '  [PgUp/PgDn] map  [ [ ] ] elevation  [R] roofs ' + (this.roofs ? 'on' : 'off') + '  [L] night ' + (this.night ? 'on' : 'off'), 6, 4, green);
      if (g.mouse.inside) {
        const hex = FO.worldHex(g.mouse.x + this.x, g.mouse.y + this.y);
        const o = this.pick(g.mouse.x, g.mouse.y);
        let label = 'hex ' + hex;
        if (o) label += '  ' + (g.protos.name(o.pid) || 'pid ' + o.pid.toString(16)) + '  pid ' + o.pid.toString(16) + '  tile ' + o.tile;
        g.text(label, 6, 18, green);
      }
    }

    keyDown(e) {
      if (this.busy) return;
      if (e.code === 'PageDown') this.open(this.index + 1);
      else if (e.code === 'PageUp') this.open(this.index - 1);
      else if (e.code === 'BracketRight' || e.code === 'BracketLeft') {
        const step = e.code === 'BracketRight' ? 1 : -1;
        for (let i = 1; i <= 3; i++) {
          const n = (this.elev + step * i + 3) % 3;
          if (!(this.map.header.flags & (2 << n))) {
            this.elev = n;
            break;
          }
        }
        this.busy = true;
        this.preload().then(() => {
          this.relight();
          this.busy = false;
        });
      } else if (e.code === 'KeyR') this.roofs = !this.roofs;
      else if (e.code === 'KeyL') {
        this.night = !this.night;
        this.relight();
      } else if (e.code === 'Home') this.center(this.map.header.tile);
      else if (e.code === 'F9' && this.g.play) this.g.setMode(this.g.play);
      else return false;
      return true;
    }
  }

  FO.MapViewer = MapViewer;
})(globalThis.FO = globalThis.FO || {});
