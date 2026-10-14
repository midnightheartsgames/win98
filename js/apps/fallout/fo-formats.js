(function (FO) {
  'use strict';

  FO.readPal = function (u8) {
    const rgb = new Uint8Array(768);
    const free = [];
    for (let i = 0; i < 256; i++) {
      const r = u8[i * 3];
      const g = u8[i * 3 + 1];
      const b = u8[i * 3 + 2];
      if (r > 63 || g > 63 || b > 63) {
        free.push(i);
        continue;
      }
      rgb[i * 3] = r << 2;
      rgb[i * 3 + 1] = g << 2;
      rgb[i * 3 + 2] = b << 2;
    }
    const inv = u8.length >= 768 + 32768 ? u8.slice(768, 768 + 32768) : null;
    return { rgb, inv, free };
  };

  function readFrames(r, count) {
    const frames = [];
    for (let f = 0; f < count; f++) {
      const w = r.u16();
      const h = r.u16();
      const n = r.u32();
      const ox = r.i16();
      const oy = r.i16();
      let px = r.bytes(n);
      if (n !== w * h) {
        const fixed = new Uint8Array(w * h);
        fixed.set(px.subarray(0, Math.min(n, w * h)));
        px = fixed;
      }
      frames.push({ w, h, ox, oy, px });
    }
    return frames;
  }

  FO.readFrm = function (u8) {
    const r = new FO.Bytes(u8);
    const version = r.u32();
    const fps = r.u16();
    const action = r.u16();
    const count = r.u16();
    const sx = [];
    const sy = [];
    const offs = [];
    for (let d = 0; d < 6; d++) sx.push(r.i16());
    for (let d = 0; d < 6; d++) sy.push(r.i16());
    for (let d = 0; d < 6; d++) offs.push(r.u32());
    const size = r.u32();
    const base = r.p;
    const dirs = [];
    const frameSets = [];
    for (let d = 0; d < 6; d++) {
      const first = offs.indexOf(offs[d]);
      if (first < d) {
        frameSets.push(frameSets[first]);
      } else {
        r.p = base + offs[d];
        frameSets.push(readFrames(r, count));
      }
      dirs.push({ sx: sx[d], sy: sy[d], frames: frameSets[d] });
    }
    const single = offs.every(o => o === offs[0]);
    return { version, fps, action, count, size, dirs, single };
  };

  FO.readMsg = function (text) {
    const map = new Map();
    let i = 0;
    const field = () => {
      const a = text.indexOf('{', i);
      if (a < 0) return null;
      const b = text.indexOf('}', a + 1);
      if (b < 0) return null;
      i = b + 1;
      return text.slice(a + 1, b);
    };
    for (;;) {
      const num = field();
      if (num === null) break;
      if (!/^\s*-?\d+\s*$/.test(num)) continue;
      const audio = field();
      if (audio === null) break;
      const body = field();
      if (body === null) break;
      map.set(parseInt(num, 10), { text: body.replace(/\r/g, '').replace(/\n/g, ''), audio: audio.trim() });
    }
    return map;
  };

  FO.readOverlay = function (text) {
    const map = new Map();
    for (const line of String(text).split('\n')) {
      const m = /^(\d+)(?: (.*))?$/.exec(line.replace(/\r$/, ''));
      if (m) map.set(parseInt(m[1], 10), m[2] || '');
    }
    return map;
  };

  FO.STRINGS_PATH = 'TEXT\\ENGLISH\\STRINGS.TXT';

  FO.readStrings = function (text) {
    const map = new Map();
    for (const line of String(text || '').split('\n')) {
      const tab = line.indexOf('\t');
      if (tab > 0) map.set(line.slice(0, tab), line.slice(tab + 1).replace(/\r$/, ''));
    }
    return map;
  };

  FO.tr = function (g, text) {
    const t = g && g.strings ? g.strings.get(text) : undefined;
    return t === undefined ? text : t;
  };

  FO.mergeMsg = function (en, ru) {
    const over = FO.readOverlay(ru);
    let out = '';
    for (const [id, m] of FO.readMsg(en)) out += '{' + id + '}{' + m.audio + '}{' + (over.has(id) ? over.get(id) : m.text) + '}\n';
    return out;
  };

  FO.readLst = function (text) {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    return lines;
  };

  FO.lstName = function (line) {
    return String(line || '').split(/[\s,;]/)[0];
  };

  FO.readScriptsLst = function (text) {
    return FO.readLst(text).map(line => {
      const m = /local_vars\s*=\s*(\d+)/i.exec(line);
      return { name: FO.lstName(line), vars: m ? parseInt(m[1], 10) : 0 };
    });
  };

  FO.readGam = function (text) {
    const vars = [];
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:=\s*(-?\d+)/.exec(line.replace(/\/\/.*$/, ''));
      if (m) vars.push({ name: m[1], value: parseInt(m[2], 10) });
    }
    return vars;
  };

  FO.readIni = function (text) {
    const out = { '': {} };
    let sec = out[''];
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/;.*$/, '').trim();
      if (!line) continue;
      const m = /^\[([^\]]*)\]/.exec(line);
      if (m) {
        const name = m[1].trim();
        sec = out[name] = out[name] || {};
        continue;
      }
      const eq = line.indexOf('=');
      if (eq > 0) sec[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
    return out;
  };

  FO.readSve = function (text) {
    const out = [];
    for (const line of text.split(/\r?\n/)) {
      const m = /^\s*(\d+)\s*:(.*)$/.exec(line);
      if (m) out.push({ frame: parseInt(m[1], 10), text: m[2].trim() });
    }
    return out.sort((a, b) => a.frame - b.frame);
  };

  FO.readLip = function (u8) {
    const r = new FO.Bytes(u8);
    const version = r.u32();
    r.skip(12);
    const soundSize = r.u32();
    const phonemeCount = r.u32();
    r.skip(4);
    const markerCount = r.u32();
    const name = r.str(8);
    const ext = r.str(4);
    const phonemes = r.bytes(phonemeCount);
    const markers = [];
    for (let i = 0; i < markerCount; i++) markers.push({ type: r.u32(), pos: r.u32() });
    return { version, soundSize, name, ext, phonemes, markers };
  };

  FO.readFon = function (u8) {
    const r = new FO.Bytes(u8);
    const count = r.u32le();
    const height = r.u32le();
    const spacing = r.u32le();
    r.skip(8);
    const glyphs = [];
    for (let i = 0; i < count; i++) glyphs.push({ w: r.u32le(), off: r.u32le() });
    return { kind: 'fon', count, height, spacing, glyphs, data: u8.subarray(r.p) };
  };

  FO.readAaf = function (u8) {
    const r = new FO.Bytes(u8);
    if (r.str(4) !== 'AAFF') throw new Error('AAF: bad signature');
    const height = r.u16();
    const gapH = r.u16();
    const space = r.u16();
    const gapV = r.u16();
    const glyphs = [];
    for (let i = 0; i < 256; i++) glyphs.push({ w: r.u16(), h: r.u16(), off: r.u32() });
    return { kind: 'aaf', height, gapH, space, gapV, glyphs, data: u8.subarray(r.p) };
  };

  FO.readRix = function (u8) {
    const r = new FO.Bytes(u8);
    if (r.str(4) !== 'RIX3') throw new Error('RIX: bad signature');
    const w = r.u16le();
    const h = r.u16le();
    r.skip(2);
    const pal = new Uint8Array(768);
    const raw = r.bytes(768);
    for (let i = 0; i < 768; i++) pal[i] = Math.min(63, raw[i]) << 2;
    return { w, h, pal, px: r.bytes(w * h) };
  };

  FO.readGcd = function (u8) {
    const r = new FO.Bytes(u8);
    const head = r.i32();
    const base = r.ints(35);
    const bonus = r.ints(35);
    const skills = r.ints(18);
    const extra = r.ints(3);
    const name = r.str(32);
    const tags = r.ints(4);
    const traits = r.ints(2);
    const points = r.i32();
    return { head, base, bonus, skills, extra, name, tags, traits, points };
  };

  function readNameTable(r) {
    const base = r.p;
    const len = r.u32();
    const end = r.p + len;
    const map = new Map();
    while (r.p < end) {
      const n = r.u16();
      map.set(r.p - base, FO.cstr(r.b, r.p, n));
      r.p += n;
    }
    r.p = end;
    if (r.u32() !== 0xFFFFFFFF) throw new Error('INT: table without terminator');
    return map;
  }

  FO.readInt = function (u8) {
    const r = new FO.Bytes(u8, 0x2A);
    const n = r.u32();
    const procs = [];
    for (let i = 0; i < n; i++) procs.push({ nameOff: r.u32(), flags: r.u32(), time: r.u32(), cond: r.u32(), body: r.u32(), args: r.u32() });
    const names = readNameTable(r);
    let strings = new Map();
    if (r.v.getUint32(r.p) === 0xFFFFFFFF) r.skip(4);
    else strings = readNameTable(r);
    for (const p of procs) p.name = names.get(p.nameOff) || '';
    return { procs, names, strings, code: r.p, bytes: u8 };
  };

  FO.PRO_TYPES = ['items', 'critters', 'scenery', 'walls', 'tiles', 'misc'];

  function readItem(r, p) {
    p.flagsExt = r.u32();
    p.sid = r.i32();
    p.sub = r.u32();
    p.material = r.u32();
    p.size = r.i32();
    p.weight = r.i32();
    p.cost = r.i32();
    p.invFid = r.i32();
    p.sound = r.u8();
    switch (p.sub) {
      case 0:
        p.ac = r.i32();
        p.dr = r.ints(7);
        p.dt = r.ints(7);
        p.perk = r.i32();
        p.maleFid = r.i32();
        p.femaleFid = r.i32();
        break;
      case 1:
        p.maxSize = r.i32();
        p.openFlags = r.u32();
        break;
      case 2:
        p.stats = r.ints(3);
        p.amount0 = r.ints(3);
        p.duration1 = r.i32();
        p.amount1 = r.ints(3);
        p.duration2 = r.i32();
        p.amount2 = r.ints(3);
        p.addictionRate = r.i32();
        p.addictionEffect = r.i32();
        p.addictionOnset = r.i32();
        break;
      case 3:
        p.anim = r.i32();
        p.minDmg = r.i32();
        p.maxDmg = r.i32();
        p.dmgType = r.i32();
        p.range1 = r.i32();
        p.range2 = r.i32();
        p.projPid = r.i32();
        p.minSt = r.i32();
        p.ap1 = r.i32();
        p.ap2 = r.i32();
        p.critFail = r.i32();
        p.perk = r.i32();
        p.burst = r.i32();
        p.caliber = r.i32();
        p.ammoPid = r.i32();
        p.maxAmmo = r.i32();
        p.sound2 = r.u8();
        break;
      case 4:
        p.caliber = r.i32();
        p.quantity = r.i32();
        p.acMod = r.i32();
        p.drMod = r.i32();
        p.dmgMult = r.i32();
        p.dmgDiv = r.i32();
        break;
      case 5:
        p.powerPid = r.i32();
        p.powerType = r.i32();
        p.charges = r.i32();
        break;
      case 6:
        p.keyCode = r.i32();
        break;
      default:
        throw new Error('PRO: unknown item subtype ' + p.sub);
    }
  }

  function readCritter(r, p) {
    p.flagsExt = r.u32();
    p.sid = r.i32();
    p.headFid = r.i32();
    p.ai = r.i32();
    p.team = r.i32();
    p.critterFlags = r.u32();
    p.base = r.ints(35);
    p.bonus = r.ints(35);
    p.skills = r.ints(18);
    p.body = r.i32();
    p.exp = r.i32();
    p.killType = r.i32();
  }

  function readScenery(r, p) {
    p.flagsExt = r.u32();
    p.sid = r.i32();
    p.sub = r.u32();
    p.material = r.u32();
    p.sound = r.u8();
    switch (p.sub) {
      case 0:
        p.walkThru = r.i32();
        p.doorUnknown = r.i32();
        break;
      case 1:
        p.dest = r.i32();
        p.destMap = r.i32();
        break;
      case 2:
        p.elevator = r.i32();
        p.level = r.i32();
        break;
      case 3:
      case 4:
        p.dest = r.i32();
        break;
      case 5:
        p.genericUnknown = r.i32();
        break;
      default:
        throw new Error('PRO: unknown scenery subtype ' + p.sub);
    }
  }

  FO.readPro = function (u8) {
    const r = new FO.Bytes(u8);
    const p = { pid: r.i32(), text: r.i32(), fid: r.i32(), lightRadius: r.i32(), lightIntensity: r.i32(), flags: r.u32() };
    p.type = (p.pid >>> 24) & 0x0F;
    if (p.type === 0) readItem(r, p);
    else if (p.type === 1) readCritter(r, p);
    else if (p.type === 2) readScenery(r, p);
    else if (p.type === 3) {
      p.flagsExt = r.u32();
      p.sid = r.i32();
      p.material = r.u32();
    } else if (p.type === 4) {
      p.material = r.u32();
    } else if (p.type === 5) {
      p.flagsExt = r.u32();
    } else {
      throw new Error('PRO: unknown type ' + p.type);
    }
    if (r.p !== u8.length) throw new Error('PRO: ' + (u8.length - r.p) + ' bytes left for pid ' + p.pid);
    return p;
  };
})(globalThis.FO = globalThis.FO || {});
