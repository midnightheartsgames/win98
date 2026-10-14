(function (FO) {
  'use strict';

  FO.ART_DIRS = ['ITEMS', 'CRITTERS', 'SCENERY', 'WALLS', 'TILES', 'MISC', 'INTRFACE', 'INVEN', 'HEADS', 'BACKGRND', 'SKILLDEX'];
  FO.ART = { ITEM: 0, CRITTER: 1, SCENERY: 2, WALL: 3, TILE: 4, MISC: 5, INTERFACE: 6, INVEN: 7, HEAD: 8, BACKGROUND: 9, SKILLDEX: 10 };

  FO.fid = function (type, index, anim, weapon) {
    return ((type & 0xF) << 24) | (((anim || 0) & 0xFF) << 16) | (((weapon || 0) & 0xF) << 12) | (index & 0xFFF);
  };

  FO.fidType = fid => (fid >>> 24) & 0xF;
  FO.fidIndex = fid => fid & 0xFFF;
  FO.fidAnim = fid => (fid >>> 16) & 0xFF;
  FO.fidWeapon = fid => (fid >>> 12) & 0xF;

  const ch = n => String.fromCharCode(n);

  FO.critterSuffix = function (anim, weapon) {
    const letter = weapon ? ch(99 + weapon) : 'a';
    if (anim >= 48 && anim <= 63) return 'r' + ch(97 + anim - 48);
    if (anim >= 20 && anim <= 35) return 'b' + ch(97 + anim - 20);
    if (anim === 36) return 'ch';
    if (anim === 37) return 'cj';
    if (anim === 64) return 'na';
    if (anim >= 38 && anim <= 47) return weapon ? letter + ch(99 + anim - 38) : null;
    if (weapon && (anim === 0 || anim === 1)) return letter + ch(97 + anim);
    if (anim === 18) return weapon === 1 ? 'dm' : weapon === 4 ? 'gm' : 'as';
    if (anim === 13 && weapon) return letter + 'e';
    return 'a' + ch(97 + anim);
  };

  function prepare(frm) {
    for (const d of frm.dirs) {
      if (d.ready) continue;
      let x = 0;
      let y = 0;
      for (const f of d.frames) {
        x += f.ox;
        y += f.oy;
        f.sumX = x;
        f.sumY = y;
      }
      d.ready = true;
    }
    return frm;
  }

  class Art {
    constructor(data) {
      this.data = data;
      this.lists = [];
      this.critters = [];
      this.frms = new Map();
      this.jobs = new Map();
      this.bytes = 0;
      this.limit = 160 << 20;
      this.tick = 0;
    }

    async init() {
      for (let t = 0; t < FO.ART_DIRS.length; t++) {
        const dir = FO.ART_DIRS[t];
        const path = 'ART\\' + dir + '\\' + dir + '.LST';
        this.lists[t] = this.data.has(path) ? FO.readLst(await this.data.text(path)) : [];
      }
      this.critters = this.lists[FO.ART.CRITTER].map(line => {
        const parts = line.split(',');
        return { name: parts[0].trim().toUpperCase(), alias: parts.length > 1 ? parseInt(parts[1], 10) : -1 };
      });
    }

    critterBase(index, anim, weapon) {
      const c = this.critters[index];
      const suffix = FO.critterSuffix(anim, weapon);
      if (!c || !suffix) return null;
      return 'ART\\CRITTERS\\' + c.name + suffix.toUpperCase();
    }

    path(fid) {
      const type = FO.fidType(fid);
      if (type === FO.ART.CRITTER) {
        const base = this.critterBase(FO.fidIndex(fid), FO.fidAnim(fid), FO.fidWeapon(fid));
        return base ? base + '.FRM' : null;
      }
      const name = (this.lists[type] || [])[FO.fidIndex(fid)];
      if (!name) return null;
      return 'ART\\' + FO.ART_DIRS[type] + '\\' + FO.lstName(name).toUpperCase();
    }

    aliasOf(index) {
      const c = this.critters[index];
      return c && c.alias >= 0 ? c.alias : index;
    }

    exists(fid) {
      if (FO.fidType(fid) !== FO.ART.CRITTER) {
        const path = this.path(fid);
        return !!path && this.data.has(path);
      }
      const tried = new Set();
      let i = FO.fidIndex(fid);
      while (i >= 0 && !tried.has(i)) {
        tried.add(i);
        const base = this.critterBase(i, FO.fidAnim(fid), FO.fidWeapon(fid));
        if (base && (this.data.has(base + '.FRM') || this.data.has(base + '.FR0'))) return true;
        i = this.critters[i] ? this.critters[i].alias : -1;
      }
      return false;
    }

    async loadCritter(fid) {
      const index = FO.fidIndex(fid);
      const anim = FO.fidAnim(fid);
      const weapon = FO.fidWeapon(fid);
      const tried = new Set();
      let i = index;
      while (i >= 0 && !tried.has(i)) {
        tried.add(i);
        const base = this.critterBase(i, anim, weapon);
        if (base && this.data.has(base + '.FRM')) return FO.readFrm(await this.data.get(base + '.FRM'));
        if (base && this.data.has(base + '.FR0')) {
          const parts = [];
          for (let d = 0; d < 6; d++) {
            const p = base + '.FR' + d;
            parts.push(this.data.has(p) ? FO.readFrm(await this.data.get(p)) : null);
          }
          const first = parts.find(Boolean);
          const dirs = parts.map(p => (p || first).dirs[0]);
          return { version: first.version, fps: first.fps, action: first.action, count: first.count, dirs, single: false };
        }
        i = this.critters[i] ? this.critters[i].alias : -1;
      }
      return null;
    }

    load(fid) {
      if (this.frms.has(fid)) return Promise.resolve(this.frms.get(fid).frm);
      if (this.jobs.has(fid)) return this.jobs.get(fid);
      const job = (async () => {
        let frm = null;
        try {
          if (FO.fidType(fid) === FO.ART.CRITTER) frm = await this.loadCritter(fid);
          else {
            const path = this.path(fid);
            if (path && this.data.has(path)) frm = FO.readFrm(await this.data.get(path));
          }
        } catch (e) {
          frm = null;
        }
        let bytes = 0;
        if (frm) {
          prepare(frm);
          const seen = new Set();
          for (const d of frm.dirs) {
            if (seen.has(d.frames)) continue;
            seen.add(d.frames);
            for (const f of d.frames) bytes += f.px.length;
          }
        }
        this.frms.set(fid, { frm, bytes, used: this.tick });
        this.bytes += bytes;
        this.jobs.delete(fid);
        if (this.bytes > this.limit) this.sweep();
        return frm;
      })();
      this.jobs.set(fid, job);
      return job;
    }

    get(fid) {
      const e = this.frms.get(fid);
      if (!e) {
        if (!this.jobs.has(fid)) this.load(fid);
        return undefined;
      }
      e.used = this.tick;
      return e.frm;
    }

    loadPath(path) {
      const key = 'path:' + FO.key(path);
      if (this.frms.has(key)) return Promise.resolve(this.frms.get(key).frm);
      if (this.jobs.has(key)) return this.jobs.get(key);
      const job = (async () => {
        let frm = null;
        try {
          if (this.data.has(path)) frm = prepare(FO.readFrm(await this.data.get(path)));
        } catch (e) {
          frm = null;
        }
        this.frms.set(key, { frm, bytes: 0, used: Infinity });
        this.jobs.delete(key);
        return frm;
      })();
      this.jobs.set(key, job);
      return job;
    }

    getPath(path) {
      const e = this.frms.get('path:' + FO.key(path));
      if (!e) {
        this.loadPath(path);
        return undefined;
      }
      return e.frm;
    }

    loadAll(fids) {
      return Promise.all([...new Set(fids)].map(f => this.load(f)));
    }

    sweep() {
      const list = [...this.frms.entries()].filter(([, e]) => e.used < this.tick).sort((a, b) => a[1].used - b[1].used);
      for (const [fid, e] of list) {
        if (this.bytes <= this.limit * 0.7) break;
        this.frms.delete(fid);
        this.bytes -= e.bytes;
      }
    }
  }

  FO.Art = Art;
})(globalThis.FO = globalThis.FO || {});
