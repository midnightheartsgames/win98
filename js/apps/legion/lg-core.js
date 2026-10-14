(function (L) {
  'use strict';

  L.CELL = 4;
  L.HSCALE = 0.125;
  L.TICK = 0.05;
  L.MODEL_SCALE = 0.00105;

  L.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  L.lerp = (a, b, t) => a + (b - a) * t;
  L.smooth = t => t * t * (3 - 2 * t);
  L.dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
  L.wrapAngle = a => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };
  L.angleTo = (ax, az, bx, bz) => Math.atan2(bx - ax, bz - az);
  L.turnToward = (a, target, maxStep) => {
    const d = L.wrapAngle(target - a);
    if (Math.abs(d) <= maxStep) return target;
    return a + Math.sign(d) * maxStep;
  };

  L.rng = function (seed) {
    let s = seed >>> 0 || 1;
    const next = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      next,
      range: (a, b) => a + (b - a) * next(),
      int: n => Math.floor(next() * n),
      pick: arr => arr[Math.floor(next() * arr.length)],
      chance: p => next() < p,
      state: () => s,
      setState: v => { s = v >>> 0; }
    };
  };

  L.hashString = str => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  L.roman = n => {
    const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let out = '';
    for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
    return out || 'I';
  };

  L.plural = (n, one, few, many) => {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };

  L.fmtTime = sec => {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  };

  L.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  L.clone = o => JSON.parse(JSON.stringify(o));

  L.ASSET_ROOT = 'content/legion/';

  L.readBinary = async path => {
    if (typeof fetch === 'function' && typeof window !== 'undefined') {
      const r = await fetch(L.ASSET_ROOT + path);
      if (!r.ok) throw new Error('load ' + path + ' ' + r.status);
      return r.arrayBuffer();
    }
    const buf = L.nodeRead(L.ASSET_ROOT + path);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  };

  L.readJSON = async path => {
    if (typeof fetch === 'function' && typeof window !== 'undefined') {
      const r = await fetch(L.ASSET_ROOT + path);
      if (!r.ok) throw new Error('load ' + path + ' ' + r.status);
      return r.json();
    }
    return JSON.parse(L.nodeRead(L.ASSET_ROOT + path).toString('utf8'));
  };
})(globalThis.Legion = globalThis.Legion || {});
