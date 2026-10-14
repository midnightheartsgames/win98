(function (FO) {
  'use strict';

  FO.LANG = 'ENGLISH';
  FO.textPath = function (sub) {
    return 'TEXT\\' + FO.LANG + '\\' + sub;
  };

  FO.PID = { ITEM: 0, CRITTER: 1, SCENERY: 2, WALL: 3, TILE: 4, MISC: 5 };
  FO.pidType = pid => (pid >>> 24) & 0xF;
  FO.pidIndex = pid => pid & 0xFFFFFF;

  const MSG = ['PRO_ITEM', 'PRO_CRIT', 'PRO_SCEN', 'PRO_WALL', 'PRO_TILE', 'PRO_MISC'];

  class Protos {
    constructor(data) {
      this.data = data;
      this.lists = [];
      this.msgs = [];
      this.map = new Map();
    }

    async init() {
      await this.data.prefetch(/^PROTO\\/);
      for (let t = 0; t < FO.PRO_TYPES.length; t++) {
        const dir = FO.PRO_TYPES[t].toUpperCase();
        this.lists[t] = FO.readLst(await this.data.text('PROTO\\' + dir + '\\' + dir + '.LST'));
        this.msgs[t] = FO.readMsg(await this.data.text(FO.textPath('GAME\\' + MSG[t] + '.MSG')));
      }
    }

    file(pid) {
      const t = FO.pidType(pid);
      const name = (this.lists[t] || [])[FO.pidIndex(pid) - 1];
      return name ? 'PROTO\\' + FO.PRO_TYPES[t].toUpperCase() + '\\' + FO.lstName(name).toUpperCase() : null;
    }

    get(pid) {
      let p = this.map.get(pid);
      if (p !== undefined) return p;
      const path = this.file(pid);
      const u8 = path && this.data.peek(path);
      p = u8 ? FO.readPro(u8) : null;
      this.map.set(pid, p);
      return p;
    }

    count(type) {
      return (this.lists[type] || []).length;
    }

    text(pid, offset) {
      const p = this.get(pid);
      if (!p) return '';
      const m = this.msgs[FO.pidType(pid)].get(p.text + (offset || 0));
      return m ? m.text : '';
    }

    name(pid) { return this.text(pid, 0); }
    desc(pid) { return this.text(pid, 1); }
  }

  FO.Protos = Protos;
})(globalThis.FO = globalThis.FO || {});
