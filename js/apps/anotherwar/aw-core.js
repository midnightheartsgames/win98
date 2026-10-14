(function (AW) {
  'use strict';

  AW.C = {
    HMETR: 60,
    SEE_M: 6,
    UNSEE_M: 7.5,
    HCLOSE: 60,
    HFAR: 200,
    TICK: 1 / 30,
    VIEW_W: 800,
    VIEW_H: 600,
    PANEL_TOP: 40,
    PANEL_BOTTOM: 120,
    CELL: 8,
    ZK: 12 / 255,
    PIVOT_DY: -42,
    WALK_SPD: 2.2,
    STAMINA_MAX: 100,
    RESPAWN_S: 600
  };

  AW.DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  AW.DIR_VEC = [[0, -1], [1, -0.5], [1, 0], [1, 0.5], [0, 1], [-1, 0.5], [-1, 0], [-1, -0.5]];

  AW.dirFromVec = function (dx, dy) {
    if (!dx && !dy) return 4;
    const a = Math.atan2(dx, -dy * 2);
    let i = Math.round(a / (Math.PI / 4));
    if (i < 0) i += 8;
    return i % 8;
  };

  AW.angToDir = function (ang) {
    let i = Math.round(ang / (Math.PI / 4)) % 8;
    if (i < 0) i += 8;
    return [0, 7, 6, 5, 4, 3, 2, 1][i];
  };

  AW.dirByName = function (name) {
    const i = AW.DIRS.indexOf(String(name || '').toUpperCase());
    return i < 0 ? 4 : i;
  };

  AW.isoDist = function (x1, y1, x2, y2) {
    const dx = x2 - x1, dy = (y2 - y1) * 2;
    return Math.sqrt(dx * dx + dy * dy);
  };
  AW.isoDistM = function (x1, y1, x2, y2) { return AW.isoDist(x1, y1, x2, y2) / AW.C.HMETR; };
  AW.dist = function (x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); };
  AW.clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  AW.lerp = function (a, b, t) { return a + (b - a) * t; };

  AW.Rng = class {
    constructor(seed) { this.s = (seed >>> 0) || 0x9e3779b9; }
    next() {
      let t = (this.s += 0x6d2b79f5) >>> 0;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    int(n) { return 1 + Math.floor(this.next() * n); }
    range(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
    state() { return this.s; }
  };
  AW.rng = new AW.Rng(Date.now() >>> 0);
  AW.random = function (a, b) {
    if (b === undefined) return a > 0 ? AW.rng.int(a) : 0;
    return AW.rng.range(a, b);
  };
  AW.K6 = function (b) { return AW.rng.int(6) + (b || 0); };
  AW.K4 = function (b) { return AW.rng.int(4) + (b || 0); };
  AW.K3 = function (b) { return AW.rng.int(3) + (b || 0); };

  const EXPR_FN = {
    random: (a, b) => b === undefined ? AW.random(a) : AW.random(a, b),
    K3: b => AW.K3(b),
    K4: b => AW.K4(b),
    K6: b => AW.K6(b)
  };

  function parseExpr(s) {
    const tokens = s.match(/\d*\.?\d+|[A-Za-z_]\w*|\S/g) || [];
    let i = 0;
    const peek = () => tokens[i];
    const expect = t => { if (tokens[i++] !== t) throw new SyntaxError(s); };
    const call = name => {
      const args = [];
      i++;
      while (peek() !== ')') {
        args.push(sum());
        if (peek() === ',') i++;
        else if (peek() !== ')') throw new SyntaxError(s);
      }
      i++;
      return EXPR_FN[name] ? EXPR_FN[name].apply(null, args) : 0;
    };
    const primary = () => {
      const t = tokens[i++];
      if (t === '(') { const v = sum(); expect(')'); return v; }
      if (t === '-') return -primary();
      if (t === '+') return primary();
      if (/^[\d.]/.test(t || '')) return parseFloat(t);
      if (/^[A-Za-z_]/.test(t || '')) return peek() === '(' ? call(t) : 0;
      throw new SyntaxError(s);
    };
    const product = () => {
      let v = primary();
      while (peek() === '*' || peek() === '/') v = tokens[i++] === '*' ? v * primary() : v / primary();
      return v;
    };
    const sum = () => {
      let v = product();
      while (peek() === '+' || peek() === '-') v = tokens[i++] === '+' ? v + product() : v - product();
      return v;
    };
    const v = sum();
    if (i < tokens.length) throw new SyntaxError(s);
    return v;
  }

  AW.evalValue = function (expr, base) {
    if (expr === undefined || expr === null) return base;
    if (typeof expr === 'number') return expr;
    const s = String(expr).trim();
    if (s === '') return base;
    let v;
    try { v = parseExpr(s); } catch (e) { return base; }
    if (!isFinite(v)) return base;
    return s[0] === '+' ? (base || 0) + v : v;
  };

  AW.pointInPoly = function (poly, x, y) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi)) inside = !inside;
    }
    return inside;
  };

  AW.polyCenter = function (poly) {
    let x = 0, y = 0;
    for (const p of poly) { x += p[0]; y += p[1]; }
    return poly.length ? [x / poly.length, y / poly.length] : [0, 0];
  };

  AW.parseSay = function (text) {
    const src = String(text || '');
    const variants = src.split('~');
    const counts = variants.map(v => 1 + (v.match(/[{^]/g) || []).length);
    return { variants, counts };
  };

  AW.sayGroups = function (text, variantIndex) {
    const { variants, counts } = AW.parseSay(text);
    const vi = variantIndex === undefined ? 0 : Math.max(0, Math.min(variants.length - 1, variantIndex));
    let startNo = 0;
    for (let i = 0; i < vi; i++) startNo += counts[i];
    const s = variants[vi];
    const groups = [];
    let lines = [];
    let buf = '';
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '^') { lines.push(buf); buf = ''; i++; continue; }
      if (ch === '{') {
        const e = s.indexOf('}', i);
        const pause = parseFloat(s.slice(i + 1, e)) || 0;
        lines.push(buf); buf = '';
        groups.push({ lines, pause });
        lines = [];
        i = e + 1;
        continue;
      }
      buf += ch;
      i++;
    }
    lines.push(buf);
    groups.push({ lines, pause: 0 });
    let no = startNo;
    for (const g of groups) { g.no = no++; g.text = g.lines.join('\n').trim(); }
    return groups;
  };

  AW.plainText = function (text) {
    return String(text || '').split('~')[0].replace(/\{[\d.]+\}/g, ' ').replace(/\^/g, ' ').replace(/\s+/g, ' ').trim();
  };

  AW.rleDecode = function (rle, size) {
    const out = new Uint8Array(size);
    let p = 0;
    for (let i = 0; i < rle.length; i += 2) {
      const v = rle[i], n = rle[i + 1];
      out.fill(v, p, p + n);
      p += n;
    }
    return out;
  };

  AW.copy = function (o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); };

  AW.weightedPick = function (list) {
    if (!list || !list.length) return null;
    const entries = list.map(s => {
      const m = String(s).match(/^(\d+):(.*)$/);
      return m ? [parseInt(m[1], 10), m[2]] : [100, String(s)];
    });
    const total = entries.reduce((a, e) => a + e[0], 0);
    let r = AW.rng.next() * total;
    for (const e of entries) { r -= e[0]; if (r <= 0) return e[1]; }
    return entries[entries.length - 1][1];
  };

  AW.chanceList = function (list) {
    const out = [];
    for (const s of list || []) {
      const m = String(s).match(/^(\d+):(.*)$/);
      if (m) { if (AW.rng.int(100) <= parseInt(m[1], 10)) out.push(m[2]); }
      else out.push(String(s));
    }
    return out;
  };

  AW.fmtMoney = function (n) { return Math.round(n) + ' фр.'; };

  AW.plural = function (n, one, few, many) {
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    if (b === 1) return one;
    return many;
  };
})(globalThis.AW = globalThis.AW || {});
