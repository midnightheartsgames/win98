(function (FO) {
  'use strict';

  const ACM_ID = 0x01032897;
  const HEADER = 14;
  const MID = 0x8000;
  const NEAR2 = [-2, -1, 1, 2];
  const FAR2 = [-3, -2, 2, 3];
  const BITS3 = [-4, -3, -2, -1, 1, 2, 3, 4];

  function packed(digits, base) {
    const out = [];
    const total = Math.pow(base, digits);
    for (let i = 0; i < total; i++) {
      let v = i;
      let word = 0;
      for (let d = 0; d < digits; d++) {
        word |= (v % base) << (d * 4);
        v = Math.floor(v / base);
      }
      out.push(word);
    }
    return out;
  }

  const MUL_3X3 = packed(3, 3);
  const MUL_3X5 = packed(3, 5);
  const MUL_2X11 = packed(2, 11);

  class AcmDecoder {
    constructor(u8) {
      const v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      if (u8.length < HEADER || v.getUint32(0, true) !== ACM_ID) throw new Error('not an ACM stream');
      this.u8 = u8;
      this.total = v.getUint32(4, true);
      this.channels = v.getUint16(8, true);
      this.rate = v.getUint16(10, true);
      const pack = v.getUint16(12, true);
      this.level = pack & 15;
      this.rows = pack >> 4;
      this.cols = 1 << this.level;
      this.pos = HEADER;
      this.bits = 0;
      this.avail = 0;
      this.block = new Int32Array(this.rows * this.cols);
      this.wrap = new Int32Array(Math.max(0, 2 * this.cols - 2));
      this.amp = new Int32Array(0x10000);
      this.done = 0;
      this.ready = 0;
      this.next = 0;
    }

    get(n) {
      while (this.avail < n) {
        const byte = this.pos < this.u8.length ? this.u8[this.pos] : 0;
        this.pos++;
        this.bits = (this.bits | (byte << this.avail)) >>> 0;
        this.avail += 8;
      }
      const v = this.bits & ((1 << n) - 1);
      this.bits >>>= n;
      this.avail -= n;
      return v;
    }

    set(row, col, idx) {
      this.block[(row << this.level) + col] = this.amp[MID + idx];
    }

    fill(ind, col) {
      const rows = this.rows;
      if (ind === 0) {
        for (let i = 0; i < rows; i++) this.set(i, col, 0);
        return;
      }
      if (ind >= 3 && ind <= 16) {
        const middle = 1 << (ind - 1);
        for (let i = 0; i < rows; i++) this.set(i, col, this.get(ind) - middle);
        return;
      }
      const zeroPairs = ind === 17 || ind === 20 || ind === 23 || ind === 26;
      for (let i = 0; i < rows; i++) {
        if (ind === 19 || ind === 22 || ind === 29) {
          const word = ind === 19 ? MUL_3X3[this.get(5)] | 0 : ind === 22 ? MUL_3X5[this.get(7)] | 0 : MUL_2X11[this.get(7)] | 0;
          const bias = ind === 19 ? 1 : ind === 22 ? 2 : 5;
          const count = ind === 29 ? 2 : 3;
          for (let k = 0; k < count; k++) {
            this.set(i, col, ((word >> (k * 4)) & 15) - bias);
            if (k < count - 1 && ++i >= rows) break;
          }
          continue;
        }
        if (!this.get(1)) {
          this.set(i, col, 0);
          if (zeroPairs && ++i < rows) this.set(i, col, 0);
          continue;
        }
        if (zeroPairs && !this.get(1)) {
          this.set(i, col, 0);
          continue;
        }
        if (ind === 17 || ind === 18) this.set(i, col, this.get(1) ? 1 : -1);
        else if (ind === 20 || ind === 21) this.set(i, col, NEAR2[this.get(2)]);
        else if (ind === 23 || ind === 24) {
          if (!this.get(1)) this.set(i, col, this.get(1) ? 1 : -1);
          else this.set(i, col, FAR2[this.get(2)]);
        } else this.set(i, col, BITS3[this.get(3)]);
      }
    }

    juggle(wrapAt, blockAt, subLen, subCount) {
      const b = this.block;
      const w = this.wrap;
      for (let i = 0; i < subLen; i++) {
        let p = blockAt + i;
        let r0 = w[wrapAt + 2 * i];
        let r1 = w[wrapAt + 2 * i + 1];
        for (let j = 0; j < subCount >> 1; j++) {
          const r2 = b[p];
          b[p] = r1 * 2 + (r0 + r2);
          p += subLen;
          const r3 = b[p];
          b[p] = r2 * 2 - (r1 + r3);
          p += subLen;
          r0 = r2;
          r1 = r3;
        }
        w[wrapAt + 2 * i] = r0;
        w[wrapAt + 2 * i + 1] = r1;
      }
    }

    juggleBlock() {
      if (!this.level) return;
      const step = this.level > 9 ? 1 : (2048 >> this.level) - 2;
      let todo = this.rows;
      let blockAt = 0;
      for (;;) {
        let wrapAt = 0;
        let subCount = Math.min(step, todo);
        let subLen = this.cols >> 1;
        subCount *= 2;
        this.juggle(wrapAt, blockAt, subLen, subCount);
        wrapAt += subLen * 2;
        for (let i = 0, p = blockAt; i < subCount; i++, p += subLen) this.block[p]++;
        while (subLen > 1) {
          subLen >>= 1;
          subCount *= 2;
          this.juggle(wrapAt, blockAt, subLen, subCount);
          wrapAt += subLen * 2;
        }
        if (todo <= step) break;
        blockAt += step << this.level;
        todo -= step;
      }
    }

    decodeBlock() {
      const pwr = this.get(4);
      const val = this.get(16);
      const count = 1 << pwr;
      const amp = this.amp;
      for (let i = 0, x = 0; i < count; i++, x += val) amp[MID + i] = x;
      for (let i = 1, x = -val; i <= count; i++, x -= val) amp[MID - i] = x;
      for (let col = 0; col < this.cols; col++) {
        const ind = this.get(5);
        if (ind === 1 || ind === 2 || ind === 25 || ind === 28 || ind > 29) throw new Error('corrupt ACM block');
        this.fill(ind, col);
      }
      this.juggleBlock();
      this.ready = this.block.length;
      this.next = 0;
    }

    read(out, max) {
      let n = 0;
      const limit = Math.min(max === undefined ? out.length : max, out.length);
      while (n < limit && this.done < this.total) {
        if (this.next >= this.ready) this.decodeBlock();
        const take = Math.min(limit - n, this.ready - this.next, this.total - this.done);
        for (let i = 0; i < take; i++) {
          const s = this.block[this.next + i] >> this.level;
          out[n + i] = s > 32767 ? 32767 : s < -32768 ? -32768 : s;
        }
        this.next += take;
        this.done += take;
        n += take;
      }
      return n;
    }
  }

  FO.AcmDecoder = AcmDecoder;

  FO.decodeAcm = function (u8) {
    const dec = new AcmDecoder(u8);
    const out = new Int16Array(dec.total);
    dec.read(out);
    return { channels: dec.channels, rate: dec.rate, samples: out };
  };
})(globalThis.FO = globalThis.FO || {});
