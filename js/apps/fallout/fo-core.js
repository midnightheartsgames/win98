(function (FO) {
  'use strict';

  FO.key = function (path) {
    return String(path).split('/').join('\\').replace(/^(\.\\)+/, '').replace(/^\\+/, '').toUpperCase();
  };

  FO.latin1 = function (u8, start, end) {
    const a = start || 0;
    const b = end === undefined ? u8.length : end;
    let s = '';
    for (let i = a; i < b; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, Math.min(b, i + 8192)));
    return s;
  };

  FO.utf8 = function (u8) {
    const s = new TextDecoder('utf-8').decode(u8);
    return s.charCodeAt(0) === 0xFEFF ? s.slice(1) : s;
  };

  FO.cstr = function (u8, start, max) {
    const lim = Math.min(u8.length, start + max);
    let e = start;
    while (e < lim && u8[e]) e++;
    return FO.latin1(u8, start, e);
  };

  class Bytes {
    constructor(u8, pos) {
      this.b = u8;
      this.v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      this.p = pos || 0;
    }

    get left() { return this.b.length - this.p; }
    skip(n) { this.p += n; return this; }
    u8() { return this.v.getUint8(this.p++); }
    i8() { return this.v.getInt8(this.p++); }
    u16() { const x = this.v.getUint16(this.p); this.p += 2; return x; }
    i16() { const x = this.v.getInt16(this.p); this.p += 2; return x; }
    u32() { const x = this.v.getUint32(this.p); this.p += 4; return x; }
    i32() { const x = this.v.getInt32(this.p); this.p += 4; return x; }
    u16le() { const x = this.v.getUint16(this.p, true); this.p += 2; return x; }
    i16le() { const x = this.v.getInt16(this.p, true); this.p += 2; return x; }
    u32le() { const x = this.v.getUint32(this.p, true); this.p += 4; return x; }
    i32le() { const x = this.v.getInt32(this.p, true); this.p += 4; return x; }
    ints(n) { const out = new Array(n); for (let i = 0; i < n; i++) out[i] = this.i32(); return out; }

    bytes(n) {
      if (this.p + n > this.b.length) throw new RangeError('read past end');
      const x = this.b.subarray(this.p, this.p + n);
      this.p += n;
      return x;
    }

    str(n) { const s = FO.cstr(this.b, this.p, n); this.p += n; return s; }
    pstr() { const n = this.u8(); return FO.latin1(this.bytes(n)); }
  }

  FO.Bytes = Bytes;
})(globalThis.FO = globalThis.FO || {});
