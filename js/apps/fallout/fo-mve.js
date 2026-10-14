(function (FO) {
  'use strict';

  const SIGNATURE = 'Interplay MVE File\x1A';
  const HEADER = 26;
  const OP = {
    END: 0x00, TIMER: 0x02, AUDIO_INIT: 0x03, VIDEO_INIT: 0x05, SEND: 0x07, AUDIO: 0x08,
    PALETTE: 0x0C, MAP: 0x0F, VIDEO: 0x11
  };
  const AUDIO_FLAG = { STEREO: 1, BITS16: 2, COMPRESSED: 4 };
  const VIDEO_DATA_HEADER = 14;
  const AUDIO_DATA_HEADER = 6;
  const BLOCK = 8;

  const s8 = v => (v << 24) >> 24;

  class Mve {
    constructor(u8) {
      if (String.fromCharCode(...u8.subarray(0, SIGNATURE.length)) !== SIGNATURE) throw new Error('not an Interplay MVE file');
      this.u8 = u8;
      this.v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      this.pos = HEADER;
      this.w = 0;
      this.h = 0;
      this.frameUs = 0;
      this.palette = new Uint8Array(768);
      this.paletteVersion = 0;
      this.front = null;
      this.back = null;
      this.map = null;
      this.mapAt = 0;
      this.frames = 0;
      this.decoded = 0;
      this.ended = false;
      this.audio = { rate: 0, channels: 0, bits16: false, compressed: false };
    }

    u16(p) {
      return this.v.getUint16(p, true);
    }

    opcodes(fn) {
      let p = HEADER;
      const u8 = this.u8;
      while (p + 4 <= u8.length) {
        const len = this.u16(p);
        const end = p + 4 + len;
        p += 4;
        while (p + 4 <= end) {
          const size = this.u16(p);
          if (fn(u8[p + 2], u8[p + 3], p + 4, size) === false) return;
          p += 4 + size;
        }
        p = end;
      }
    }

    decodeAudio(delta) {
      const chunks = [];
      let total = 0;
      this.opcodes((op, ver, at, size) => {
        if (op === OP.TIMER) this.frameUs = this.v.getUint32(at, true) * this.u16(at + 4);
        else if (op === OP.AUDIO_INIT) {
          const flags = this.u16(at + 2);
          this.audio = { rate: this.u16(at + 4), channels: flags & AUDIO_FLAG.STEREO ? 2 : 1, bits16: !!(flags & AUDIO_FLAG.BITS16), compressed: ver >= 1 && !!(flags & AUDIO_FLAG.COMPRESSED) };
        } else if (op === OP.VIDEO_INIT) {
          this.w = this.u16(at) * BLOCK;
          this.h = this.u16(at + 2) * BLOCK;
        } else if (op === OP.AUDIO && (this.u16(at + 2) & 1)) {
          const pcm = this.audioChunk(at, size, delta);
          chunks.push(pcm);
          total += pcm.length;
        }
      });
      const out = new Int16Array(total);
      let o = 0;
      for (const c of chunks) {
        out.set(c, o);
        o += c.length;
      }
      return out;
    }

    audioChunk(at, size, delta) {
      const a = this.audio;
      const bytes = this.u16(at + 4);
      const data = at + AUDIO_DATA_HEADER;
      const u8 = this.u8;
      if (!a.compressed) {
        if (!a.bits16) {
          const out = new Int16Array(bytes);
          for (let i = 0; i < bytes; i++) out[i] = (u8[data + i] - 128) << 8;
          return out;
        }
        const out = new Int16Array(bytes >> 1);
        for (let i = 0; i < out.length; i++) out[i] = this.v.getInt16(data + i * 2, true);
        return out;
      }
      const ch = a.channels;
      const out = new Int16Array(bytes >> 1);
      const pred = [0, 0];
      let p = data;
      let o = 0;
      for (let c = 0; c < ch; c++) {
        pred[c] = this.v.getInt16(p, true);
        p += 2;
        out[o++] = pred[c];
      }
      let c = 0;
      const end = at + size;
      while (o < out.length && p < end) {
        pred[c] = (pred[c] + delta[u8[p++]]) << 16 >> 16;
        out[o++] = pred[c];
        c ^= ch - 1;
      }
      return out;
    }

    next() {
      const u8 = this.u8;
      while (!this.ended && this.pos + 4 <= u8.length) {
        const len = this.u16(this.pos);
        const end = this.pos + 4 + len;
        let p = this.pos + 4;
        let shown = false;
        while (p + 4 <= end) {
          const size = this.u16(p);
          const op = u8[p + 2];
          const at = p + 4;
          if (op === OP.END) this.ended = true;
          else if (op === OP.VIDEO_INIT) this.initVideo(this.u16(at) * BLOCK, this.u16(at + 2) * BLOCK);
          else if (op === OP.PALETTE) this.setPalette(at);
          else if (op === OP.MAP) {
            this.map = at;
            this.mapAt = size;
          } else if (op === OP.VIDEO) this.decodeFrame(at, size);
          else if (op === OP.SEND) shown = true;
          p += 4 + size;
        }
        this.pos = end;
        if (shown) {
          this.frames++;
          return true;
        }
      }
      this.ended = true;
      return false;
    }

    initVideo(w, h) {
      if (this.front && w === this.w && h === this.h) return;
      this.w = w;
      this.h = h;
      this.front = new Uint8Array(w * h);
      this.back = new Uint8Array(w * h);
    }

    setPalette(at) {
      const start = this.u16(at);
      const count = this.u16(at + 2);
      for (let i = 0; i < count * 3 && (start * 3 + i) < 768; i++) this.palette[start * 3 + i] = (this.u8[at + 4 + i] & 63) << 2;
      this.paletteVersion++;
    }

    decodeFrame(at, size) {
      const W = this.w;
      const dst = this.back;
      const src = this.front;
      const u8 = this.u8;
      const end = at + size;
      let s = at + VIDEO_DATA_HEADER;
      const byte = () => (s < end ? u8[s++] : 0);
      const le16 = () => {
        const r = byte();
        return r | (byte() << 8);
      };
      const copy = (from, pos, dx, dy) => {
        const off = pos + dy * W + dx;
        if (off < 0 || off + 7 * W + 8 > from.length) return;
        for (let y = 0; y < 8; y++) {
          if (from === dst) dst.copyWithin(pos + y * W, off + y * W, off + y * W + 8);
          else dst.set(from.subarray(off + y * W, off + y * W + 8), pos + y * W);
        }
      };
      const fill2x2 = (pos, x, y, c) => {
        const i = pos + y * W + x;
        dst[i] = dst[i + 1] = dst[i + W] = dst[i + W + 1] = c;
      };
      const blocksX = W / BLOCK;
      const blocksY = this.h / BLOCK;
      const P = new Uint8Array(8);
      let n = 0;
      for (let by = 0; by < blocksY; by++) {
        for (let bx = 0; bx < blocksX; bx++, n++) {
          const mb = u8[this.map + (n >> 1)];
          const opcode = n & 1 ? mb >> 4 : mb & 15;
          const pos = by * BLOCK * W + bx * BLOCK;
          switch (opcode) {
            case 0x0:
              copy(src, pos, 0, 0);
              break;
            case 0x1:
              break;
            case 0x2: {
              const b = byte();
              if (b < 56) copy(dst, pos, 8 + (b % 7), (b / 7) | 0);
              else copy(dst, pos, -14 + ((b - 56) % 29), 8 + (((b - 56) / 29) | 0));
              break;
            }
            case 0x3: {
              const b = byte();
              if (b < 56) copy(dst, pos, -(8 + (b % 7)), -((b / 7) | 0));
              else copy(dst, pos, -(-14 + ((b - 56) % 29)), -(8 + (((b - 56) / 29) | 0)));
              break;
            }
            case 0x4: {
              const b = byte();
              copy(src, pos, -8 + (b & 15), -8 + (b >> 4));
              break;
            }
            case 0x5: {
              const x = s8(byte());
              const y = s8(byte());
              copy(src, pos, x, y);
              break;
            }
            case 0x6:
              break;
            case 0x7: {
              P[0] = byte();
              P[1] = byte();
              if (P[0] <= P[1]) {
                for (let y = 0; y < 8; y++) {
                  let f = byte();
                  for (let x = 0; x < 8; x++, f >>= 1) dst[pos + y * W + x] = P[f & 1];
                }
              } else {
                let f = le16();
                for (let y = 0; y < 8; y += 2) for (let x = 0; x < 8; x += 2, f >>= 1) fill2x2(pos, x, y, P[f & 1]);
              }
              break;
            }
            case 0x8: {
              P[0] = byte();
              P[1] = byte();
              if (P[0] <= P[1]) {
                for (let q = 0; q < 4; q++) {
                  if (q) {
                    P[0] = byte();
                    P[1] = byte();
                  }
                  let f = le16();
                  const qx = q < 2 ? 0 : 4;
                  const qy = q & 1 ? 4 : 0;
                  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++, f >>= 1) dst[pos + (qy + y) * W + qx + x] = P[f & 1];
                }
              } else {
                let f = le16() | (le16() << 16);
                P[2] = byte();
                P[3] = byte();
                if (P[2] <= P[3]) {
                  for (let half = 0; half < 2; half++) {
                    if (half) {
                      P[0] = P[2];
                      P[1] = P[3];
                      f = le16() | (le16() << 16);
                    }
                    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++, f >>>= 1) dst[pos + y * W + half * 4 + x] = P[f & 1];
                  }
                } else {
                  for (let y = 0; y < 8; y++) {
                    if (y === 4) {
                      P[0] = P[2];
                      P[1] = P[3];
                      f = le16() | (le16() << 16);
                    }
                    for (let x = 0; x < 8; x++, f >>>= 1) dst[pos + y * W + x] = P[f & 1];
                  }
                }
              }
              break;
            }
            case 0x9: {
              for (let i = 0; i < 4; i++) P[i] = byte();
              if (P[0] <= P[1]) {
                if (P[2] <= P[3]) {
                  for (let y = 0; y < 8; y++) {
                    let f = le16();
                    for (let x = 0; x < 8; x++, f >>= 2) dst[pos + y * W + x] = P[f & 3];
                  }
                } else {
                  let f = le16() | (le16() << 16);
                  for (let y = 0; y < 8; y += 2) for (let x = 0; x < 8; x += 2, f >>>= 2) fill2x2(pos, x, y, P[f & 3]);
                }
              } else {
                let lo = le16() | (le16() << 16);
                let hi = le16() | (le16() << 16);
                const take = () => {
                  const r = lo & 3;
                  lo = (lo >>> 2) | ((hi & 3) << 30);
                  hi >>>= 2;
                  return P[r];
                };
                if (P[2] <= P[3]) {
                  for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x += 2) {
                      const c = take();
                      dst[pos + y * W + x] = dst[pos + y * W + x + 1] = c;
                    }
                  }
                } else {
                  for (let y = 0; y < 8; y += 2) {
                    for (let x = 0; x < 8; x++) {
                      const c = take();
                      dst[pos + y * W + x] = dst[pos + (y + 1) * W + x] = c;
                    }
                  }
                }
              }
              break;
            }
            case 0xA: {
              for (let i = 0; i < 4; i++) P[i] = byte();
              if (P[0] <= P[1]) {
                for (let q = 0; q < 4; q++) {
                  if (q) for (let i = 0; i < 4; i++) P[i] = byte();
                  let f = le16() | (le16() << 16);
                  const qx = q < 2 ? 0 : 4;
                  const qy = q & 1 ? 4 : 0;
                  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++, f >>>= 2) dst[pos + (qy + y) * W + qx + x] = P[f & 3];
                }
              } else {
                let lo = le16() | (le16() << 16);
                let hi = le16() | (le16() << 16);
                for (let i = 4; i < 8; i++) P[i] = byte();
                const vert = P[4] <= P[5];
                const take = () => {
                  const r = lo & 3;
                  lo = (lo >>> 2) | ((hi & 3) << 30);
                  hi >>>= 2;
                  return P[r];
                };
                for (let half = 0; half < 2; half++) {
                  if (half) {
                    P[0] = P[4];
                    P[1] = P[5];
                    P[2] = P[6];
                    P[3] = P[7];
                    lo = le16() | (le16() << 16);
                    hi = le16() | (le16() << 16);
                  }
                  if (vert) {
                    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) dst[pos + y * W + half * 4 + x] = take();
                  } else {
                    for (let y = 0; y < 4; y++) for (let x = 0; x < 8; x++) dst[pos + (half * 4 + y) * W + x] = take();
                  }
                }
              }
              break;
            }
            case 0xB:
              for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) dst[pos + y * W + x] = byte();
              break;
            case 0xC:
              for (let y = 0; y < 8; y += 2) for (let x = 0; x < 8; x += 2) fill2x2(pos, x, y, byte());
              break;
            case 0xD: {
              for (let y = 0; y < 8; y++) {
                if (!(y & 3)) {
                  P[0] = byte();
                  P[1] = byte();
                }
                dst.fill(P[0], pos + y * W, pos + y * W + 4);
                dst.fill(P[1], pos + y * W + 4, pos + y * W + 8);
              }
              break;
            }
            case 0xE: {
              const c = byte();
              for (let y = 0; y < 8; y++) dst.fill(c, pos + y * W, pos + y * W + 8);
              break;
            }
            case 0xF: {
              P[0] = byte();
              P[1] = byte();
              for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) dst[pos + y * W + x] = P[(x ^ y) & 1];
              break;
            }
          }
        }
      }
      this.back = src;
      this.front = dst;
      this.decoded++;
    }
  }

  FO.Mve = Mve;
})(globalThis.FO = globalThis.FO || {});
