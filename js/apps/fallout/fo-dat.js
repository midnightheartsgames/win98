(function (FO) {
  'use strict';

  FO.lzss = function (src, size) {
    const out = new Uint8Array(size);
    const dict = new Uint8Array(4096);
    let i = 0;
    let o = 0;
    while (i + 2 <= src.length && o < size) {
      let n = (src[i] << 8) | src[i + 1];
      i += 2;
      if (n === 0) break;
      if (n & 0x8000) {
        n = 0x10000 - n;
        const take = Math.min(n, size - o, src.length - i);
        out.set(src.subarray(i, i + take), o);
        o += take;
        i += n;
        continue;
      }
      const end = Math.min(src.length, i + n);
      dict.fill(0x20);
      let r = 4078;
      while (i < end && o < size) {
        const flags = src[i++];
        for (let bit = 0; bit < 8 && i < end && o < size; bit++) {
          if (flags & (1 << bit)) {
            const c = src[i++];
            out[o++] = c;
            dict[r] = c;
            r = (r + 1) & 4095;
          } else {
            if (i + 2 > end) break;
            const lo = src[i++];
            const hi = src[i++];
            const pos = lo | ((hi & 0xF0) << 4);
            const len = (hi & 0x0F) + 3;
            for (let k = 0; k < len && o < size; k++) {
              const c = dict[(pos + k) & 4095];
              out[o++] = c;
              dict[r] = c;
              r = (r + 1) & 4095;
            }
          }
        }
      }
      i = end;
    }
    if (o !== size) throw new Error('LZSS: got ' + o + ' of ' + size + ' bytes');
    return out;
  };

  FO.readDatIndex = function (u8) {
    const r = new FO.Bytes(u8);
    const dirCount = r.u32();
    r.skip(12);
    const dirs = [];
    for (let i = 0; i < dirCount; i++) dirs.push(r.pstr());
    const files = new Map();
    for (const dir of dirs) {
      const count = r.u32();
      r.skip(12);
      const prefix = dir === '.' ? '' : FO.key(dir) + '\\';
      for (let i = 0; i < count; i++) {
        const name = r.pstr();
        const attr = r.u32();
        const off = r.u32();
        const size = r.u32();
        const packed = r.u32();
        files.set(prefix + name.toUpperCase(), { off, size, packed, lzss: (attr & 0x40) !== 0 });
      }
    }
    return { dirs, files, end: r.p };
  };

  class Archive {
    constructor(name, index, src) {
      this.name = name;
      this.files = index.files;
      this.src = src;
    }

    async read(e) {
      const raw = await this.src.range(this.name, e.off, e.lzss ? e.packed : e.size);
      return e.lzss ? FO.lzss(raw, e.size) : raw;
    }

    static async open(name, src) {
      let len = 1 << 20;
      for (;;) {
        const head = await src.range(name, 0, len);
        try {
          return new Archive(name, FO.readDatIndex(head), src);
        } catch (e) {
          if (!(e instanceof RangeError) || head.length < len) throw e;
          len *= 2;
        }
      }
    }
  }

  const OVERLAY = { MSG: 'msg', TEXT: 'text', BIN: 'bin' };
  const PARALLEL = 16;

  FO.overlayKind = function (rel) {
    if (/^TEXT\/(DIALOG|GAME)\/[^/]+\.txt$/.test(rel)) return OVERLAY.MSG;
    if (/^TEXT[/]/.test(rel) || /\.(TXT|BIO)$/i.test(rel)) return OVERLAY.TEXT;
    return OVERLAY.BIN;
  };

  class Data {
    constructor(src) {
      this.src = src;
      this.archives = [];
      this.over = new Map();
      this.overSrc = null;
      this.overKept = new Map();
      this.texts = new Map();
      this.loose = new Map();
      this.kept = new Map();
      this.cache = new Map();
      this.cacheBytes = 0;
      this.cacheLimit = 48 << 20;
      this.pending = new Map();
    }

    static async open(src, loose, overlay) {
      const d = new Data(src);
      for (const [k, rel] of Object.entries(loose || {})) d.loose.set(k, rel);
      if (overlay) {
        d.overSrc = overlay.src;
        for (const [k, rel] of Object.entries(overlay.files)) d.over.set(k, rel);
      }
      d.archives.push(await Archive.open('CRITTER.DAT', src));
      d.archives.push(await Archive.open('MASTER.DAT', src));
      return d;
    }

    overKind(k) {
      const rel = this.over.get(k);
      return rel ? FO.overlayKind(rel) : null;
    }

    async overlay(k) {
      let u8 = this.overKept.get(k);
      if (!u8) {
        u8 = await this.overSrc.file(this.over.get(k));
        this.overKept.set(k, u8);
      }
      return u8;
    }

    where(path) {
      const k = FO.key(path);
      if (this.overKind(k) === OVERLAY.BIN) return 'RU';
      if (this.loose.has(k)) return 'DATA';
      for (const a of this.archives) if (a.files.has(k)) return a.name;
      return null;
    }

    has(path) { return this.where(path) !== null; }

    size(path) {
      const k = FO.key(path);
      for (const a of this.archives) {
        const e = a.files.get(k);
        if (e) return e.size;
      }
      return -1;
    }

    list(re) {
      const out = new Set();
      for (const k of this.over.keys()) if (re.test(k) && this.overKind(k) === OVERLAY.BIN) out.add(k);
      for (const k of this.loose.keys()) if (re.test(k)) out.add(k);
      for (const a of this.archives) for (const k of a.files.keys()) if (re.test(k)) out.add(k);
      return [...out].sort();
    }

    async prefetch(re) {
      const span = e => e.lzss ? e.packed : e.size;
      for (const a of this.archives) {
        const list = [];
        for (const [k, e] of a.files) if (re.test(k) && !this.kept.has(k) && !this.loose.has(k)) list.push([k, e]);
        list.sort((x, y) => x[1].off - y[1].off);
        let i = 0;
        while (i < list.length) {
          const start = list[i][1].off;
          let end = start + span(list[i][1]);
          let j = i + 1;
          while (j < list.length && list[j][1].off - end < 65536 && list[j][1].off + span(list[j][1]) - start < (8 << 20)) {
            end = Math.max(end, list[j][1].off + span(list[j][1]));
            j++;
          }
          const chunk = await this.src.range(a.name, start, end - start);
          for (let n = i; n < j; n++) {
            const [key, e] = list[n];
            const raw = chunk.subarray(e.off - start, e.off - start + span(e));
            this.kept.set(key, e.lzss ? FO.lzss(raw, e.size) : raw.slice());
          }
          i = j;
        }
      }
      for (const [k, rel] of this.loose) if (re.test(k) && !this.kept.has(k)) this.kept.set(k, await this.src.file(rel));
      const extra = [...this.over.keys()].filter(k => re.test(k) && !this.overKept.has(k));
      for (let i = 0; i < extra.length; i += PARALLEL) await Promise.all(extra.slice(i, i + PARALLEL).map(k => this.overlay(k)));
    }

    get(path) {
      const k = FO.key(path);
      if (this.overKind(k) === OVERLAY.BIN) return this.overlay(k);
      const kept = this.kept.get(k);
      if (kept) return Promise.resolve(kept);
      const hit = this.cache.get(k);
      if (hit) {
        this.cache.delete(k);
        this.cache.set(k, hit);
        return Promise.resolve(hit);
      }
      const wait = this.pending.get(k);
      if (wait) return wait;
      const job = this.load(k).then(u8 => {
        this.pending.delete(k);
        this.remember(k, u8);
        return u8;
      }, err => {
        this.pending.delete(k);
        throw err;
      });
      this.pending.set(k, job);
      return job;
    }

    async load(k) {
      const rel = this.loose.get(k);
      if (rel) return this.src.file(rel);
      for (const a of this.archives) {
        const e = a.files.get(k);
        if (e) return a.read(e);
      }
      throw new Error('Fallout data has no file ' + k);
    }

    remember(k, u8) {
      if (u8.length > this.cacheLimit / 8) return;
      this.cache.set(k, u8);
      this.cacheBytes += u8.length;
      while (this.cacheBytes > this.cacheLimit) {
        const [old, v] = this.cache.entries().next().value;
        this.cache.delete(old);
        this.cacheBytes -= v.length;
      }
    }

    localized(k, en, ru) {
      const s = this.overKind(k) === OVERLAY.MSG ? FO.mergeMsg(FO.latin1(en), FO.utf8(ru)) : FO.utf8(ru);
      this.texts.set(k, s);
      return s;
    }

    async text(path) {
      const k = FO.key(path);
      const kind = this.overKind(k);
      if (!kind || kind === OVERLAY.BIN) return FO.latin1(await this.get(k));
      if (this.texts.has(k)) return this.texts.get(k);
      const ru = await this.overlay(k);
      return this.localized(k, kind === OVERLAY.MSG ? await this.get(k) : null, ru);
    }

    async overlayText(path) {
      const k = FO.key(path);
      return this.overKind(k) === OVERLAY.TEXT ? FO.utf8(await this.overlay(k)) : null;
    }

    peekText(path) {
      const k = FO.key(path);
      const kind = this.overKind(k);
      const en = this.peek(k);
      if (!kind || kind === OVERLAY.BIN) return en ? FO.latin1(en) : null;
      if (this.texts.has(k)) return this.texts.get(k);
      const ru = this.overKept.get(k);
      if (!ru || (kind === OVERLAY.MSG && !en)) return en ? FO.latin1(en) : null;
      return this.localized(k, en, ru);
    }

    peek(path) {
      const k = FO.key(path);
      if (this.overKind(k) === OVERLAY.BIN) return this.overKept.get(k) || null;
      return this.kept.get(k) || this.cache.get(k) || null;
    }
  }

  FO.Archive = Archive;
  FO.Data = Data;

  FO.webSource = function (base, sub) {
    const root = base.endsWith('/') ? base : base + '/';
    const dir = sub === undefined ? 'DATA/' : sub;
    return {
      async range(name, start, len) {
        const res = await fetch(root + name, { headers: { Range: 'bytes=' + start + '-' + (start + len - 1) } });
        if (res.status !== 206) throw new Error(name + ': byte ranges are not served (' + res.status + ')');
        return new Uint8Array(await res.arrayBuffer());
      },
      async file(rel) {
        const res = await fetch(root + dir + rel.split('/').map(encodeURIComponent).join('/'));
        if (!res.ok) throw new Error(dir + rel + ': ' + res.status);
        return new Uint8Array(await res.arrayBuffer());
      }
    };
  };

  FO.nodeSource = function (root, sub) {
    const dir = sub === undefined ? 'DATA' : sub;
    const fs = require('fs');
    const path = require('path');
    const fds = new Map();
    const fd = name => {
      if (!fds.has(name)) fds.set(name, fs.openSync(path.join(root, name), 'r'));
      return fds.get(name);
    };
    return {
      async range(name, start, len) {
        const b = new Uint8Array(len);
        const n = fs.readSync(fd(name), b, 0, len, start);
        return n === len ? b : b.subarray(0, n);
      },
      async file(rel) { return new Uint8Array(fs.readFileSync(path.join(root, dir, rel))); },
      close() { for (const f of fds.values()) fs.closeSync(f); fds.clear(); }
    };
  };
})(globalThis.FO = globalThis.FO || {});
