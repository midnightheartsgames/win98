(function (B) {
  'use strict';

  const perm = new Uint8Array(512);
  (function seed() {
    const p = [];
    for (let i = 0; i < 256; i++) p.push(i);
    let s = 1234567;
    for (let i = 255; i > 0; i--) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();

  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  function grad(h, x, y, z) {
    const g = h & 15;
    const u = g < 8 ? x : y, v = g < 4 ? y : g === 12 || g === 14 ? x : z;
    return ((g & 1) ? -u : u) + ((g & 2) ? -v : v);
  }

  function noise3(x, y, z) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z, Bq = perm[X + 1] + Y, BA = perm[Bq] + Z, BB = perm[Bq + 1] + Z;
    return lerp(lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u), lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u), lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v), w);
  }

  function hnoise(size, x, y, z, hard) {
    if (size === 0) return 0;
    const s = 1 / size;
    let n = 0.5 + 0.5 * noise3(x * s, y * s, z * s);
    if (hard) n = Math.abs(2 * n - 1);
    return n;
  }

  function turbulence(size, x, y, z, depth, hard) {
    let sum = 0, fac = 1, amp = 0;
    let sz = size;
    for (let i = 0; i <= depth; i++) {
      sum += fac * hnoise(sz, x, y, z, hard);
      amp += fac;
      fac *= 0.5;
      sz *= 0.5;
    }
    return sum / amp;
  }

  function hash3(x, y, z) {
    let h = (Math.floor(x * 1000) * 73856093) ^ (Math.floor(y * 1000) * 19349663) ^ (Math.floor(z * 1000) * 83492791);
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  function bc(t, tex, v) {
    v = (v - 0.5) * tex.contrast + tex.bright - 0.5;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function colorband(cb, t) {
    const keys = cb.keys;
    if (!keys.length) return [t, t, t, 1];
    if (t <= keys[0].pos) return keys[0].col.slice();
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (t <= b.pos) {
        let f = (t - a.pos) / ((b.pos - a.pos) || 1);
        if (cb.ipo === 'ease') f = f * f * (3 - 2 * f);
        else if (cb.ipo === 'constant') f = 0;
        return a.col.map((v, k) => v + (b.col[k] - v) * f);
      }
    }
    return keys[keys.length - 1].col.slice();
  }

  function newColorband() {
    return { ipo: 'linear', cur: 0, keys: [{ pos: 0, col: [0, 0, 0, 0] }, { pos: 1, col: [1, 1, 1, 1] }] };
  }

  function imageSample(tex, x, y) {
    const im = tex.image && tex.image.pix;
    if (!im) return null;
    let u = (x + 1) / 2, v = (y + 1) / 2;
    if (tex.imaflag.rot90) { const t = u; u = v; v = 1 - t; }
    u = tex.crop[0] + u * (tex.crop[2] - tex.crop[0]);
    v = tex.crop[1] + v * (tex.crop[3] - tex.crop[1]);
    u *= tex.xrepeat; v *= tex.yrepeat;
    if (tex.extend === 'clip' || tex.extend === 'clipcube') { if (u < 0 || u > 1 || v < 0 || v > 1) return [0, 0, 0, 0]; }
    else if (tex.extend === 'extend') { u = Math.min(1, Math.max(0, u)); v = Math.min(1, Math.max(0, v)); }
    else { u -= Math.floor(u); v -= Math.floor(v); }
    const w = im.w, h = im.h;
    const fx = u * w - 0.5, fy = v * h - 0.5;
    const px = (ix, iy) => {
      ix = ((ix % w) + w) % w; iy = ((iy % h) + h) % h;
      const c = im.buf[(h - 1 - iy) * w + ix];
      return [(c & 255) / 255, ((c >> 8) & 255) / 255, ((c >> 16) & 255) / 255, (c >>> 24) / 255];
    };
    if (!tex.imaflag.interpol) return px(Math.round(fx), Math.round(fy));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const a = px(x0, y0), b = px(x0 + 1, y0), c = px(x0, y0 + 1), d = px(x0 + 1, y0 + 1);
    return a.map((q, k) => (q * (1 - tx) + b[k] * tx) * (1 - ty) + (c[k] * (1 - tx) + d[k] * tx) * ty);
  }

  function sample(tex, co) {
    const x = co[0], y = co[1], z = co[2];
    const hard = tex.noisetype === 'hard';
    const out = { tin: 0, rgb: null, ta: 1, nor: null };
    const sz = tex.noisesize || 0.25;
    switch (tex.type) {
      case 'clouds': {
        out.tin = turbulence(sz, x, y, z, tex.noisedepth, hard);
        if (tex.stype === 1) {
          out.rgb = [out.tin, turbulence(sz, y, x, z, tex.noisedepth, hard), turbulence(sz, y, z, x, tex.noisedepth, hard)];
        }
        break;
      }
      case 'wood': {
        let w;
        const st = tex.stype;
        if (st === 0) w = (x + y + z) * 10;
        else if (st === 1) w = Math.sqrt(x * x + y * y + z * z) * 20;
        else if (st === 2) w = (x + y + z) * 10 + tex.turbul * hnoise(sz, x, y, z, hard);
        else w = Math.sqrt(x * x + y * y + z * z) * 20 + tex.turbul * hnoise(sz, x, y, z, hard);
        out.tin = 0.5 + 0.5 * Math.sin(w);
        break;
      }
      case 'marble': {
        const n = 5 * (x + y + z) + tex.turbul * turbulence(sz, x, y, z, tex.noisedepth, hard);
        let mi = 0.5 + 0.5 * Math.sin(n);
        if (tex.stype === 1) mi = Math.sqrt(mi);
        else if (tex.stype === 2) mi = Math.sqrt(Math.sqrt(mi));
        out.tin = mi;
        break;
      }
      case 'magic': {
        const t = tex.turbul / 5;
        let a = Math.sin((x + y + z) * 5), b = Math.cos((-x + y - z) * 5), c = -Math.cos((-x - y + z) * 5);
        for (let i = 0; i < tex.noisedepth; i++) {
          const a2 = Math.cos(-a + b - c) * t, b2 = Math.sin(a - b - c) * t, c2 = Math.sin(-a - b + c) * t;
          a = a2 * 2; b = b2 * 2; c = c2 * 2;
        }
        out.rgb = [0.5 - a * 0.5, 0.5 - b * 0.5, 0.5 - c * 0.5].map(v => Math.min(1, Math.max(0, v)));
        out.tin = (out.rgb[0] + out.rgb[1] + out.rgb[2]) / 3;
        break;
      }
      case 'blend': {
        let u = tex.flipXY ? y : x, v = tex.flipXY ? x : y;
        const st = tex.stype;
        let t;
        if (st === 0) t = (1 + u) / 2;
        else if (st === 1) { t = (1 + u) / 2; t = t < 0 ? 0 : t * t; }
        else if (st === 2) { t = (1 + u) / 2; t = t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }
        else if (st === 3) t = (2 + u + v) / 4;
        else if (st === 4) { t = 1 - Math.sqrt(u * u + v * v + z * z); }
        else { t = 1 - Math.sqrt(u * u + v * v + z * z); t = t > 0 ? t * t : 0; }
        out.tin = Math.min(1, Math.max(0, t));
        break;
      }
      case 'stucci': {
        const b2 = hnoise(sz, x, y, z, hard);
        const ofs = tex.turbul / 200;
        const nx = hnoise(sz, x + ofs, y, z, hard), ny = hnoise(sz, x, y + ofs, z, hard), nz = hnoise(sz, x, y, z + ofs, hard);
        out.nor = [b2 - nx, b2 - ny, b2 - nz];
        if (tex.stype === 2) out.nor = out.nor.map(v => -v);
        out.tin = b2;
        break;
      }
      case 'noise': {
        let v = 0;
        for (let i = 0; i < Math.max(1, tex.noisedepth); i++) v += Math.random();
        out.tin = v / Math.max(1, tex.noisedepth);
        break;
      }
      case 'image': {
        const c = imageSample(tex, x, y);
        if (c) {
          out.rgb = [c[0], c[1], c[2]];
          out.ta = tex.imaflag.usealpha ? c[3] : 1;
          if (tex.imaflag.calcalpha) out.ta = Math.max(c[0], c[1], c[2]);
          if (tex.imaflag.negalpha) out.ta = 1 - out.ta;
          out.tin = out.ta < 1 ? out.ta : (c[0] + c[1] + c[2]) / 3;
        } else out.tin = 0;
        break;
      }
      default: out.tin = 0;
    }
    out.tin = bc(0, tex, out.tin);
    if (out.rgb) out.rgb = out.rgb.map((v, i) => bc(0, tex, v) * [tex.rfac, tex.gfac, tex.bfac][i]);
    if (tex.useColorband && tex.colorband) {
      const c = colorband(tex.colorband, out.tin);
      out.rgb = [c[0], c[1], c[2]];
      out.ta = c[3];
    }
    return out;
  }

  function texmap(mtex, co) {
    let c = [0, 0, 0];
    const p = mtex.proj;
    for (let i = 0; i < 3; i++) c[i] = p[i] ? co[p[i] - 1] : 0;
    const m = mtex.mapping;
    if (m === 'tube' || m === 'sphe') {
      const x = c[0], y = c[1], z = c[2];
      const u = Math.atan2(x, -y) / Math.PI;
      if (m === 'tube') c = [u, z, 0];
      else { const l = Math.hypot(x, y, z) || 1; c = [u, Math.asin(Math.max(-1, Math.min(1, z / l))) / (Math.PI / 2), 0]; }
    } else if (m === 'cube') {
      const ax = Math.abs(c[0]), ay = Math.abs(c[1]), az = Math.abs(c[2]);
      if (az >= ax && az >= ay) c = [c[0], c[1], 0];
      else if (ay >= ax) c = [c[0], c[2], 0];
      else c = [c[1], c[2], 0];
    }
    return [c[0] * mtex.size[0] + mtex.ofs[0], c[1] * mtex.size[1] + mtex.ofs[1], c[2] * mtex.size[2] + mtex.ofs[2]];
  }

  function blendCol(type, base, tex, fac) {
    const f = Math.max(0, Math.min(1, fac));
    if (type === 'mul') return base.map((b, i) => b * (1 - f + f * tex[i]));
    if (type === 'add') return base.map((b, i) => b + f * tex[i]);
    if (type === 'sub') return base.map((b, i) => b - f * tex[i]);
    return base.map((b, i) => b * (1 - f) + tex[i] * f);
  }

  function blendVal(type, base, tex, fac) {
    const f = Math.max(0, Math.min(1, fac));
    if (type === 'mul') return base * (1 - f + f * tex);
    if (type === 'add') return base + f * tex;
    if (type === 'sub') return base - f * tex;
    return base * (1 - f) + tex * f;
  }

  function previewPixel(tex, x, y) {
    const s = sample(tex, [x, y, 0]);
    if (s.rgb) return [s.rgb[0], s.rgb[1], s.rgb[2]];
    return [s.tin, s.tin, s.tin];
  }

  B.noise3 = noise3;
  B.Tex = { noise3, hnoise, turbulence, hash3, sample, texmap, blendCol, blendVal, colorband, newColorband, previewPixel, imageSample };
})(globalThis.B204 = globalThis.B204 || {});
