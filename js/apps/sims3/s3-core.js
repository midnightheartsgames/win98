(function (S) {
  'use strict';
  const WALL_H = 3;
  const CUT_H = 0.7;
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const DAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const DAY_LONG = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  const MIN_DAY = 1440;

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
  const wrapAngle = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const approach = (v, target, step) => v < target ? Math.min(target, v + step) : Math.max(target, v - step);

  function hash2(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function hashStr(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  class RNG {
    constructor(seed) { this.s = (seed >>> 0) || 1; }
    next() {
      let t = this.s = (this.s + 0x6D2B79F5) >>> 0;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + (b - a) * this.next(); }
    int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    chance(p) { return this.next() < p; }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
      return arr;
    }
    weighted(list) {
      let sum = 0;
      for (const it of list) sum += Math.max(0, it[1]);
      if (sum <= 0) return list.length ? list[0][0] : null;
      let r = this.next() * sum;
      for (const it of list) { r -= Math.max(0, it[1]); if (r <= 0) return it[0]; }
      return list[list.length - 1][0];
    }
  }

  class Heap {
    constructor() { this.k = []; this.v = []; }
    get size() { return this.k.length; }
    push(key, val) {
      const k = this.k, v = this.v;
      let i = k.length;
      k.push(key); v.push(val);
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (k[p] <= key) break;
        k[i] = k[p]; v[i] = v[p]; i = p;
      }
      k[i] = key; v[i] = val;
    }
    pop() {
      const k = this.k, v = this.v;
      const top = v[0];
      const lk = k.pop(), lv = v.pop();
      if (k.length) {
        let i = 0;
        const n = k.length;
        for (;;) {
          const l = i * 2 + 1, r = l + 1;
          let m = i, mk = lk;
          if (l < n && k[l] < mk) { m = l; mk = k[l]; }
          if (r < n && k[r] < mk) { m = r; mk = k[r]; }
          if (m === i) break;
          k[i] = k[m]; v[i] = v[m]; i = m;
        }
        k[i] = lk; v[i] = lv;
      }
      return top;
    }
  }

  function fwd(r) { return [DX[r], DY[r]]; }
  function side(r) { return [-DY[r], DX[r]]; }
  function localToWorld(r, u, v) {
    const f = fwd(r), s = side(r);
    return [u * s[0] + v * f[0], u * s[1] + v * f[1]];
  }
  function dirAngle(r) { return Math.atan2(DY[r], DX[r]); }
  function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
  function dirFromVec(dx, dy) {
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 1 : 3;
    return dy >= 0 ? 2 : 0;
  }

  function plural(n, forms) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return forms[2];
    if (b > 1 && b < 5) return forms[1];
    if (b === 1) return forms[0];
    return forms[2];
  }

  function fmtNum(n) {
    const s = String(Math.round(Math.abs(n)));
    let out = '';
    for (let i = 0; i < s.length; i++) {
      if (i && (s.length - i) % 3 === 0) out += ' ';
      out += s[i];
    }
    return (n < 0 ? '-' : '') + out;
  }
  const fmtMoney = n => '§ ' + fmtNum(n);
  const pad2 = n => (n < 10 ? '0' : '') + n;
  function clockOf(t) {
    const m = ((Math.floor(t) % MIN_DAY) + MIN_DAY) % MIN_DAY;
    return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60);
  }
  function dayOf(t) { return Math.floor(t / MIN_DAY); }
  function dowOf(t) { return dayOf(t) % 7; }
  function hourOf(t) { return ((t % MIN_DAY) + MIN_DAY) % MIN_DAY / 60; }
  function fmtClock(t) { return DAY_SHORT[dowOf(t)] + '. ' + clockOf(t); }
  function fmtDuration(min) {
    min = Math.max(0, Math.round(min));
    if (min >= 1440) { const d = Math.round(min / 1440); return d + ' ' + plural(d, ['день', 'дня', 'дней']); }
    if (min >= 60) { const h = Math.round(min / 60); return h + ' ч.'; }
    return min + ' мин.';
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const AGES = ['baby', 'toddler', 'child', 'teen', 'ya', 'adult', 'elder'];
  const AGE_INFO = {
    baby: { name: 'Младенец', scale: 0.32, traits: 0, next: 'toddler' },
    toddler: { name: 'Малыш', scale: 0.5, traits: 2, next: 'child' },
    child: { name: 'Ребёнок', scale: 0.68, traits: 3, next: 'teen' },
    teen: { name: 'Подросток', scale: 0.92, traits: 4, next: 'ya' },
    ya: { name: 'Молодой', scale: 1, traits: 5, next: 'adult' },
    adult: { name: 'Взрослый', scale: 1, traits: 5, next: 'elder' },
    elder: { name: 'Пожилой', scale: 0.97, traits: 5, next: null }
  };
  const ageIdx = a => AGES.indexOf(a);
  const isAdultish = a => ageIdx(a) >= 4;
  const atLeast = (a, b) => ageIdx(a) >= ageIdx(b);

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  }
  function rgbToHex(c) {
    const f = v => { const s = Math.round(clamp(v, 0, 1) * 255).toString(16); return s.length < 2 ? '0' + s : s; };
    return '#' + f(c[0]) + f(c[1]) + f(c[2]);
  }
  function mixRgb(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function shadeRgb(a, k) { return [clamp(a[0] * k, 0, 1), clamp(a[1] * k, 0, 1), clamp(a[2] * k, 0, 1)]; }

  function genderize(sim, m, f) { return sim && sim.gender === 'f' ? f : m; }

  function fillText(tpl, vars) {
    return String(tpl).replace(/\{(\w+)\}/g, (all, k) => vars && vars[k] !== undefined ? vars[k] : all);
  }

  Object.assign(S, {
    WALL_H, CUT_H, DX, DY, DAY_SHORT, DAY_LONG, MIN_DAY, AGES, AGE_INFO,
    clamp, lerp, smooth, dist, sign, wrapAngle, approach, hash2, hashStr, RNG, Heap,
    fwd, side, localToWorld, dirAngle, angleTo, dirFromVec, plural, fmtNum, fmtMoney, clockOf, dayOf, dowOf, hourOf, fmtClock, fmtDuration,
    esc, ageIdx, isAdultish, atLeast, hexToRgb, rgbToHex, mixRgb, shadeRgb, genderize, fillText
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
