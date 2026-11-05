(function (H) {
  'use strict';
  const G = H.Gfx;
  const SS = 4;
  const cache = new Map();
  const byLook = new WeakMap();
  const INK = '#150e1c';
  const LASH = '#24161f';
  const MOUTH = '#b44c58';

  const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const dark = (c, t) => mix(c, '#2a1c40', t);
  const light = (c, t) => mix(c, '#fff8ec', t);

  const isMale = L => (L.sex ? L.sex === 'm' : ['m', 'tall', 'slim', 'lean'].includes(L.body));

  function accOf(look, name) {
    for (const a of look.acc || []) {
      const i = a.indexOf(':');
      if ((i < 0 ? a : a.slice(0, i)) === name) return i < 0 ? true : a.slice(i + 1);
    }
    return null;
  }

  function paletteOf(L) {
    const skin = L.skin || '#f6dcc8', hair = L.hair || '#4a4450', eye = L.eye || '#4a3a30';
    const top = L.top || '#4a4a66', inner = L.inner || '#e8e8ea', lower = L.lower || '#2a2a34';
    return {
      skin, skinSh: mix(skin, '#9a4a5a', 0.2), skinDk: mix(skin, '#6a2a3a', 0.42),
      hair, hairSh: dark(hair, 0.26), hairDk: dark(hair, 0.52), hairHi: L.hairHi || light(hair, 0.38),
      eye, eyeDk: dark(eye, 0.5), eye2: L.eye2 || light(eye, 0.32),
      top, topSh: dark(top, 0.24), topHi: light(top, 0.2), trim: L.trim || light(top, 0.4),
      inner, innerSh: dark(inner, 0.2), lower, lowerSh: dark(lower, 0.24),
      legs: L.legs || skin, shoes: L.shoes || '#2a2426', gloves: L.gloves || null,
      tips: L.tips || null, streak: L.streak || null, lash: mix(dark(hair, 0.6), LASH, 0.7)
    };
  }

  function pen(g, u, ox, oy) {
    const X = x => (ox + x * u), Y = y => (oy + y * u);
    const T = (v, o) => (o + v * u) * SS;
    return {
      g, u, X, Y,
      poly(col, pts) {
        g.fillStyle = col; g.beginPath();
        g.moveTo(T(pts[0], ox), T(pts[1], oy));
        for (let i = 2; i < pts.length; i += 2) g.lineTo(T(pts[i], ox), T(pts[i + 1], oy));
        g.closePath(); g.fill();
      },
      ell(col, x, y, rx, ry, rot) { g.fillStyle = col; g.beginPath(); g.ellipse(T(x, ox), T(y, oy), rx * u * SS, ry * u * SS, rot || 0, 0, Math.PI * 2); g.fill(); },
      rect(col, x, y, w, h) { g.fillStyle = col; g.fillRect(T(x, ox), T(y, oy), w * u * SS, h * u * SS); },
      px(col, x, y, w, h) { g.fillStyle = col; g.fillRect(x * SS, y * SS, (w || 1) * SS, (h || 1) * SS); },
      snap(col, x, y, w, h) {
        const x0 = Math.round(X(x)), y0 = Math.round(Y(y));
        const x1 = Math.max(x0 + 1, Math.round(X(x + w))), y1 = Math.max(y0 + 1, Math.round(Y(y + h)));
        g.fillStyle = col; g.fillRect(x0 * SS, y0 * SS, (x1 - x0) * SS, (y1 - y0) * SS);
      },
      clipPoly(pts, fn) {
        g.save(); g.beginPath(); g.moveTo(T(pts[0], ox), T(pts[1], oy));
        for (let i = 2; i < pts.length; i += 2) g.lineTo(T(pts[i], ox), T(pts[i + 1], oy));
        g.closePath(); g.clip(); fn(); g.restore();
      },
      clip(yFrom, fn) {
        g.save(); g.beginPath(); g.rect(0, T(yFrom, oy), g.canvas.width, g.canvas.height); g.clip(); fn(); g.restore();
      },
      band(yFrom, yTo, fn) {
        g.save(); g.beginPath(); g.rect(0, T(yFrom, oy), g.canvas.width, (yTo - yFrom) * u * SS); g.clip(); fn(); g.restore();
      }
    };
  }

  function downsample(src, w, h, outline) {
    const out = G.mkCanvas(w, h), og = out.getContext('2d');
    const sd = src.getContext('2d').getImageData(0, 0, w * SS, h * SS).data;
    const img = og.createImageData(w, h), d = img.data;
    const counts = new Map(), sw = w * SS, need = SS * SS * 0.4;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      counts.clear();
      let opaque = 0, best = 0, bestN = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const i = ((y * SS + sy) * sw + x * SS + sx) * 4;
        if (sd[i + 3] < 128) continue;
        opaque++;
        const k = (sd[i] << 16) | (sd[i + 1] << 8) | sd[i + 2];
        const n = (counts.get(k) || 0) + 1;
        counts.set(k, n);
        if (n > bestN) { bestN = n; best = k; }
      }
      if (opaque < need) continue;
      const o = (y * w + x) * 4;
      d[o] = best >> 16; d[o + 1] = (best >> 8) & 255; d[o + 2] = best & 255; d[o + 3] = 255;
    }
    if (outline) {
      const s = d.slice(), ink = rgb(INK);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        if (s[o + 3]) continue;
        let n = -1;
        for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = (ny * w + nx) * 4;
          if (s[q + 3]) { n = q; break; }
        }
        if (n < 0) continue;
        d[o] = s[n] + (ink[0] - s[n]) * 0.74; d[o + 1] = s[n + 1] + (ink[1] - s[n + 1]) * 0.74; d[o + 2] = s[n + 2] + (ink[2] - s[n + 2]) * 0.74; d[o + 3] = 255;
      }
    }
    og.putImageData(img, 0, 0);
    return out;
  }

  const TRAIL_F = { mood: 'blank', hair: '#8c898c', gloss: false, bangs: 'wisp', sides: 'layer', back: 'layer', crown: 'wild', body: 'f', coat: 'mid', lining: '#e2b64a', coatLen: 15, coatFlare: 2.4, low: 'skirt', lower: '#28262c', skirtLen: 8, legs: null, gloves: '#1e1c22', sashSide: 'r', sashTo: 'knee', acc: ['feather', 'rolled:#8a8890', 'piping:#e8c040', 'shbuckle:#d8b050', 'goldcuff:#d8b050', 'knifebelt:#2e2c32', 'skirtbuckles:#d8b050', 'sashtail:#e8c040', 'ankle:#2c2a2e', 'anklerim:#d8b050'] };
  let trailF = null, trailBase = null;
  function trailLook(gender) {
    const base = H.CHARS.trail.look;
    if (gender !== 'f') return base;
    if (trailBase !== base) { trailBase = base; trailF = Object.assign({}, base, TRAIL_F); }
    return trailF;
  }

  function lookOf(id, game) {
    if (id === '@' || id === 'trail' || id === 'trail_p') return (H.wornLook && H.wornLook('trail', game)) || trailLook(game && game.state ? game.state.gender : 'm');
    if (H.CHARS[id]) return (H.wornLook && H.wornLook(id, game)) || H.CHARS[id].look;
    const sp = H.SPEAKERS[id];
    if (id === 'pompom' && game && game.pomWorn) return H.pomOutfitLook(game.pomWorn());
    if (sp && sp.look) return sp.look;
    if (sp && sp.char) return lookOf(sp.char, game);
    return H.SPEAKERS.townsman.look;
  }

  function sceneLookOf(id, game) {
    if (id !== 'pompom') return lookOf(id, game);
    return game && game.pomInScenes ? H.pomOutfitLook(game.pomInScenes()) : H.SPEAKERS.pompom.look;
  }

  function hairCap(p, P, L) {
    p.ell(P.hair, 32, 24.5, 15.4, 14.8);
    if (L.crown === 'messy') {
      p.poly(P.hair, [25.6, 11.2, 26.8, 6.6, 31, 9.9]);
      p.poly(P.hair, [30.6, 10, 35.4, 5.6, 36.8, 10.4]);
      p.poly(P.hair, [36, 10.4, 40.6, 8.6, 40.2, 12]);
    } else if (L.crown === 'spiky') {
      for (const pts of [[27.8, 12, 30.4, 5.4, 35.6, 0.8, 36.6, 6, 35.8, 10.8], [35.2, 10.6, 39.6, 6.6, 46.8, 5.6, 44.8, 10.4, 42.6, 14.4], [28.6, 11.4, 24, 8.6, 18.2, 7.2, 19.8, 11.4, 21.6, 15], [20.4, 16.4, 15.6, 17, 11, 20.2, 14.8, 21.8, 17.6, 24.4], [46.4, 22.4, 50.4, 22.2, 54, 25, 50.2, 26.6, 47.4, 29.6]]) p.poly(P.hair, pts);
      for (const pts of [[34.8, 3.6, 34.8, 10.6, 33.6, 10.8, 33.8, 6], [44.4, 7.4, 41.2, 12.4, 40.2, 11.8], [20.4, 9, 25.4, 12.6, 24.4, 13.4], [13.6, 20.2, 18.6, 21.2, 18.2, 22.4], [51.6, 24.8, 47.6, 27.2, 47.4, 26]]) p.poly(P.hairSh, pts);
    } else if (L.crown === 'wavy') {
      p.ell(P.hair, 18.5, 21, 4.2, 6.5, 0.3);
      p.ell(P.hair, 45.5, 21, 4.2, 6.5, -0.3);
    } else if (L.crown === 'neat') p.ell(P.hair, 32, 21.5, 15.6, 12.6);
    else if (L.crown === 'wind') {
      p.ell(P.hair, 33, 15.6, 14.4, 8, 0.12);
      for (const pts of [[39, 11, 47, 10.4, 53.8, 14.6, 48.6, 18.6, 44, 17.4], [44.4, 15.6, 50.6, 17.4, 55.6, 21.6, 49.8, 23.6, 46, 21.6], [46.2, 21, 50.4, 23.6, 53.6, 27.8, 48.6, 28.2, 46.4, 25.6], [23, 11.4, 17.8, 12.2, 13.6, 14.8, 16.6, 18.6, 20.6, 16.6], [18, 18.6, 13.6, 20.4, 10.6, 23.2, 14.4, 25.6, 16.8, 23.8], [27.4, 10.8, 29.4, 7, 33.8, 6.6, 32.6, 9.6]]) p.poly(P.hair, pts);
      p.poly(P.hairSh, [48.6, 18.6, 53.8, 14.6, 51.6, 17.6]); p.poly(P.hairSh, [49.8, 23.6, 55.6, 21.6, 52.4, 23.6]); p.poly(P.hairSh, [14.4, 25.6, 10.6, 23.2, 13.4, 23.8]);
    } else if (L.crown === 'swept') {
      p.ell(P.hair, 33, 16, 13.6, 7.6, 0.1);
      p.poly(P.hair, [42.4, 11.4, 50.8, 17.2, 46.4, 17.6]);
      p.poly(P.hair, [46, 16, 51.4, 23.6, 47.6, 22.6]);
      p.poly(P.hair, [21, 12, 14.8, 16, 18.4, 17.2]);
    } else if (L.crown === 'wild') {
      for (const X of [x => x, x => 64 - x]) {
        p.poly(P.hair, [X(16.8), 22.6, X(17.6), 18.4, X(12.4), 21.6]);
        p.poly(P.hair, [X(17), 28.4, X(17.4), 24.4, X(13.2), 29.6]);
      }
      p.poly(P.hair, [29.4, 10.4, 34.2, 10, 27.2, 6.4]);
    } else if (L.crown === 'shag') {
      for (const X of [x => x, x => 64 - x]) {
        p.poly(P.hair, [X(17.2), 17.4, X(21.6), 12.8, X(14.6), 15.4]);
        p.poly(P.hair, [X(16.6), 22.4, X(17.6), 17.6, X(13.4), 22.8]);
        p.poly(P.hair, [X(23.4), 11.8, X(28.4), 10.2, X(23.2), 8.6]);
      }
    }
    if (L.back === 'hightail') for (let i = 0; i < 7; i++) p.ell(i % 2 ? P.hairSh : mix(P.hair, P.hairSh, 0.25), 25.4 + i * 2.2, 11.6 - Math.sin(i / 6 * Math.PI) * 1.6, 1.5, 1.3);
    if (L.ahoge === 'curl') p.poly(P.hair, [30.4, 10.6, 29.6, 6.6, 32.4, 4.2, 35.4, 4.6, 32.6, 6.2, 33.8, 10.4]);
    else if (L.ahoge) p.poly(P.hair, [31, 11, 29.5, 3, 35, 0.8, 32.8, 4.8, 34.2, 10.5]);
    p.poly(P.hairSh, [39, 10.5, 45.5, 15, 47.2, 23, 43, 18.5]);
    if (L.crown === 'spiky') for (const pts of [[21.6, 18.4, 24.8, 14.6, 28, 13.8, 24.6, 18.4], [29.4, 13.2, 34.2, 12.2, 34, 14.8, 29.6, 15.4], [36.4, 12.6, 41.2, 14, 40.6, 16.2, 36.2, 14.8]]) p.poly(P.hairHi, pts);
    else p.poly(P.hairHi, [22, 15.3, 26.8, 12.3, 37.2, 12.3, 42, 15.3, 40.2, 15.8, 36.5, 13.9, 27.5, 13.9, 23.8, 16]);
  }

  function bangShapes(L) {
    switch (L.bangs) {
      case 'blunt': return [[17.5, 12.4, 22, 12.4, 27, 12.4, 32, 12.4, 37, 12.4, 42, 12.4, 46.5, 12.4, 46.8, 27.5, 44, 29, 40, 27.8, 36, 29, 32, 27.8, 28, 29, 24, 27.8, 20, 29, 17.2, 27.5]];
      case 'swept': return [[18, 15, 47, 15, 46.2, 22, 40, 20.5, 31, 27, 23, 33.5, 19, 30.5], [36, 16.5, 46.5, 17, 46, 30.5, 42.5, 25.5], [24, 16, 32.5, 16, 27.5, 30.5, 24.5, 32.5]];
      case 'parted': return [[17.5, 15.5, 34, 13.5, 27.5, 21, 22.5, 30, 19, 32.5], [34, 13.5, 46.5, 15.5, 45.2, 32, 42, 29.5, 38.5, 21]];
      case 'center': return [[17.5, 15, 32.6, 13.6, 30.6, 19.6, 28.4, 25.4, 25.4, 28.4, 22.6, 27.6, 18.6, 31.6], [31.4, 13.6, 46.5, 15, 45.4, 31.6, 41.4, 27.6, 38.6, 28.4, 35.6, 25.4, 33.4, 19.6], [26, 16, 29, 16, 26.4, 29.4]];
      case 'eye': return [[18, 15, 44, 15, 38, 20, 33, 27, 30.8, 34.5, 26.5, 32.8, 21.5, 29.5], [36.5, 16.5, 46.5, 16.5, 46, 29.5, 43, 26.5, 39.5, 29], [17.6, 16, 23, 16, 20.4, 27.5, 17.8, 29.5]];
      case 'none': return [];
      case 'neat': return [[17.5, 15.5, 46.5, 15.5, 46.2, 20, 37, 18.3, 28, 20.5, 17.8, 21.8]];
      case 'hide': return [[17.5, 13.5, 24, 13.5, 32, 13.5, 40, 13.5, 46.5, 13.5, 46.8, 24, 44.6, 29, 42.6, 25, 40.4, 28.4, 38.4, 24.4, 35.8, 27.8, 34.6, 24.6, 33.6, 37.4, 31, 39.2, 27.4, 37.4, 23.6, 39.4, 19.8, 36.6, 17.2, 31, 17.2, 22]];
      case 'swoop': return [[17.5, 13.5, 24, 13.5, 32, 13.5, 40, 13.5, 46.5, 13.5, 46.8, 22, 44.2, 21.6, 41.6, 26.4, 38.2, 22.2, 34.4, 26.6, 32.8, 37.8, 30.6, 27.2, 28, 30.4, 25.4, 26.6, 22.2, 33.2, 20, 27, 18, 32.6, 17.2, 22]];
      case 'sidepart': return [[17.5, 13.5, 24, 13.5, 32, 13.5, 40, 13.5, 46.5, 13.5, 47.2, 24, 46, 33.4, 43.6, 26.6, 41.2, 30.6, 39, 24.8, 36.4, 28, 33.6, 22.4, 29.8, 25, 27.6, 19.6, 25.6, 19.4, 23, 25.6, 20.6, 21.2, 17.8, 29.8, 17.2, 22]];
      case 'sweep': return [[17.5, 13.5, 24, 13.5, 32, 13.5, 40, 13.5, 46.5, 13.5, 46.8, 22, 45.8, 29.6, 43.6, 25, 42, 30, 40, 25.4, 36.4, 29.6, 34.2, 26, 32.4, 28.6, 31, 37.6, 30.4, 28.6, 30, 26.6, 26, 30.4, 24.6, 25.6, 20.6, 33.4, 19.8, 26, 17.2, 30.6, 17.2, 22]].map(sh => (manFace(L) ? sh : sh.map((v, k) => (k % 2 && v > 26 && v < 37 ? v - 2.4 : v))));
      case 'wisp': {
        const out = [[17.5, 13.5, 24, 13.5, 32, 13.5, 40, 13.5, 46.5, 13.5, 46.5, 19.5, 17.5, 19.5]];
        for (const [a, b, tx, ty] of [[17.2, 23.2, 18.6, 32.4], [21.4, 27.6, 25.2, 30.2], [25.8, 31.2, 29.4, 28.4], [29.4, 33.4, 31.2, 37.6], [32.8, 38.4, 37.4, 30.2], [37.4, 43.2, 42.6, 32.6], [41.8, 46.8, 46.2, 34]]) out.push([a, 16, b, 16, (b + tx) / 2 + 0.4, (16 + ty) / 2, tx, ty]);
        return out;
      }
      default: {
        const out = [[17.5, 13.5, 46.5, 13.5, 46.5, 19, 17.5, 19]];
        for (const [a, b, tx, ty] of [[17.5, 24, 19.2, 30.5], [21, 28.5, 24.8, 29.5], [25, 32.5, 28.8, 32], [29.5, 36.5, 33, 29.2], [33.5, 40.5, 37.8, 31.5], [38, 44.5, 41.5, 28.8], [41.5, 46.8, 45.2, 31.5]]) out.push([a, 16, b, 16, tx, ty]);
        return out;
      }
    }
  }

  function sideShapes(L) {
    if (L.sides === 'none') return [];
    if (L.sides === 'shag') {
      const left = [16, 19.5, 22.8, 19.5, 22.4, 30, 21.6, 37, 20.4, 44.2, 18.8, 40.6, 16.6, 44.4, 16.2, 38.6, 13.6, 39.8, 15.4, 32, 14.4, 27.4];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    if (L.sides === 'jaw') {
      const left = [16.2, 19.5, 22.6, 19.5, 22, 29, 21.2, 37, 20.2, 44.6, 18.8, 40.4, 16.8, 43.6, 16, 35, 14.6, 31, 15.6, 26];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    if (L.sides === 'temple') {
      const left = [16.2, 19.5, 22.4, 19.5, 21.8, 29, 20.8, 36.4, 19.2, 40.6, 18.6, 35.4, 16.4, 38, 16, 30];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    if (L.sides === 'straight') {
      const left = [16, 19.5, 22.6, 19.5, 22.2, 32, 21.8, 50, 21.2, 58, 16.4, 58, 15.4, 46, 15.6, 30];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    if (L.sides === 'wave') {
      const left = [16, 19.5, 22.8, 19.5, 22.6, 30, 22, 40, 20.6, 47.6, 21.6, 53.6, 19.8, 59.6, 16.6, 63.4, 13.8, 61.2, 15.8, 57.4, 13.2, 53, 14.4, 46.4, 12.6, 40.4, 14.4, 33.4, 13.8, 26];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    if (L.sides === 'feather') {
      const left = [16, 19.5, 22.8, 19.5, 22.4, 30, 21.8, 38, 21.2, 45.6, 20, 49.6, 18.8, 44.6, 16.8, 47, 16.4, 41.4, 12.2, 43.2, 14.6, 37.6, 11.4, 37, 14.8, 32.4, 13.2, 29.6, 15, 26];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    if (L.sides === 'layer') {
      const left = [16, 19.5, 22.8, 19.5, 22.4, 31, 21.8, 41, 20.8, 49, 19.6, 56.4, 17.6, 53.6, 16, 59.4, 14.6, 52, 11.6, 55, 13.2, 45, 14.4, 36, 15.6, 28];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    if (L.sides === 'flick') {
      const left = [16, 19.5, 22.8, 19.5, 22.4, 31, 21.6, 40.6, 20.4, 46.4, 18.4, 50.8, 15.4, 54.8, 14.2, 51, 9.4, 52.4, 12.6, 47.6, 11.6, 43, 14.4, 38.4, 15.6, 30];
      return [left, left.map((v, i) => (i % 2 ? v : 64 - v))];
    }
    const long = L.sides === 'long';
    return [
      [16, 19.5, 22.8, 19.5, 22.2, 30, 21.2, long ? 46 : 37.5, 18.6, long ? 54.5 : 41.5, 15.8, long ? 44 : 34],
      [41.2, 19.5, 48, 19.5, 48.2, long ? 44 : 34, 45.4, long ? 54.5 : 41.5, 42.8, long ? 46 : 37.5, 41.8, 30]
    ];
  }

  const STREAKS = {
    l: [19, 15.5, 25.5, 15.5, 24.2, 30.5, 21, 33, 18.6, 27],
    r: [38.5, 15.5, 45, 15.5, 45.4, 27, 43, 33, 39.8, 30.5],
    thin: [41.4, 16, 43.2, 16, 44.6, 29.4, 43.6, 30.4],
    templel: [18.4, 17, 21.6, 16, 22.8, 24, 21.8, 33, 20.4, 38, 19.8, 30],
    under: [18.4, 31, 21.4, 30, 21.4, 40, 20.2, 50, 18.8, 42],
    lock: [19.6, 16, 22, 16, 22.4, 30, 21.6, 42, 20.2, 52, 19.6, 44, 20.2, 30],
    c: [27.5, 15.5, 31.5, 15.5, 29.6, 26.5, 27.6, 28],
    cthin: [28.6, 15.5, 30.6, 15.5, 30, 24.4, 29, 24.4],
    sidel: [16.6, 19.4, 21, 18.8, 21.8, 27, 21, 35, 19.8, 43.4, 18.6, 39.8, 17, 40.6, 16.4, 33, 15.6, 26.6]
  };

  const capTop = x => { const d = Math.min(0.995, Math.abs(x - 32) / 15.4); return 24.5 - 14.8 * Math.sqrt(1 - d * d) + 0.5; };
  const hug = pts => pts.map((v, i) => (i % 2 ? Math.max(v, capTop(pts[i - 1])) : v));

  function paintHeadHair(p, P, L) {
    const shadow = P.skinSh;
    const bangs = (L.bangsR ? bangShapes(L).map(s => s.map((v, i) => (i % 2 ? v : 64 - v))) : bangShapes(L)).map(hug);
    p.clipPoly(faceOf(L), () => { for (const s of bangs) p.poly(shadow, s.map((v, i) => v + (i % 2 ? 1.3 : 0.5))); });
    for (const s of bangs) p.poly(P.hair, s);
    if (L.bangs === 'wisp') bangs.forEach((sh, i) => { if (i % 2 === 0 && i) p.poly(mix(P.hair, P.hairSh, 0.32), sh.map((v, j) => (j % 2 && v > 18 ? v - 0.6 : v))); });
    if (L.bangs === 'swoop') {
      for (const [x0, y0, x1, y1] of [[42, 15.4, 34.4, 26.6], [44, 17, 38.2, 22.2], [38.6, 15.4, 30.6, 27.2], [35, 15.6, 25.4, 26.6], [31.4, 16, 22.2, 33.2]]) p.poly(mix(P.hair, P.hairSh, 0.42), [x0, y0, x0 + 1.4, y0, x1 + 0.8, y1, x1, y1]);
      p.poly(light(P.hair, 0.2), [36.6, 16.4, 38.4, 16.4, 33.6, 30, 32.8, 29]);
    }
    if (L.bangs === 'hide') {
      for (const [x0, y0, x1, y1] of [[27, 17, 23.6, 39.4], [31.6, 17, 31, 39.2], [37.4, 17.4, 35.8, 27.8], [42.6, 17.4, 42.6, 25]]) p.poly(mix(P.hair, P.hairSh, 0.4), [x0, y0, x0 + 1, y0, x1 + 0.6, y1, x1, y1]);
      p.poly(light(P.hair, 0.3), [21, 22, 22.4, 21.6, 21.6, 32, 20.6, 31]);
    }
    if (L.bangs === 'sidepart') {
      for (const [x0, y0, x1, y1] of [[29, 15, 43.6, 26.6], [27.4, 16.6, 39, 24.8], [27, 18.4, 33.6, 22.4]]) p.poly(mix(P.hair, P.hairSh, 0.5), [x0, y0, x0 + 1.4, y0 - 0.4, x1 + 0.6, y1, x1, y1]);
      p.poly(P.hairSh, [25, 11.6, 26.4, 11.6, 26.6, 19.4, 25.4, 19.4]);
      p.poly(mix(P.hair, P.hairSh, 0.5), [24.2, 17, 25.2, 17, 20.8, 21.2, 20.2, 20.6]);
    }
    if (L.bangs === 'sweep') for (const [x0, x1, y1] of [[45, 43.6, 25], [41.6, 40, 25.4], [36, 34.2, 26], [31.8, 30, 26.6], [27, 24.6, 25.6], [22.6, 19.8, 26]]) p.poly(mix(P.hair, P.hairSh, 0.5), [x0, 18.4, x0 + 1, 18.4, x1 + 0.7, y1, x1, y1]);
    const sides = sideShapes(L).map(hug);
    sides.forEach(s => p.poly(P.hair, s));
    if (L.streak) p.poly(P.streak, hug(L.bangs === 'sidepart' ? STREAKS.thin : STREAKS[L.streakShape || L.streakSide] || STREAKS.l));
    if (P.tips && sides.length) {
      const ty = L.tipsAt || (L.tipsFade ? 44 : 40);
      if (L.tipsFade) p.band(ty - 6, ty, () => sides.forEach(s => p.poly(mix(P.hair, P.tips, 0.5), s)));
      p.clip(ty, () => sides.forEach(s => p.poly(P.tips, s)));
    }
    if (L.sides === 'wave') for (const X of [x => x, x => 64 - x]) {
      p.poly(mix(P.hair, P.hairSh, 0.45), [X(19.6), 31, X(20.8), 31, X(20.4), 42, X(18.8), 50, X(19.8), 56, X(17.4), 61.4, X(18.4), 55.6, X(17.2), 49.6, X(19.4), 41]);
      p.poly(mix(P.hair, P.hairSh, 0.45), [X(15.4), 36, X(16.4), 36.4, X(15.6), 44, X(16.6), 50, X(14.6), 53, X(15.2), 47.4, X(14), 42.4]);
      p.poly(light(P.hair, 0.22), [X(21.2), 22, X(22.2), 22, X(21.4), 32, X(20.6), 32]);
    }
    if (L.sides === 'feather') for (const X of [x => x, x => 64 - x]) {
      p.poly(mix(P.hair, P.hairSh, 0.42), [X(19.4), 31, X(20.6), 31, X(20.2), 42, X(19.4), 47, X(19.2), 40]);
      p.poly(mix(P.hair, P.hairSh, 0.42), [X(15.4), 33.6, X(16.4), 34, X(15.8), 39.4, X(13.6), 41.4]);
    }
    if (L.gloss) {
      p.poly(light(P.hair, 0.42), [21.6, 17.6, 25.4, 13.6, 30, 12.2, 29, 13.6, 25.6, 15, 23, 18]);
      p.poly(light(P.hair, 0.42), [34.6, 12.4, 39.6, 13.4, 42.6, 16.4, 41.4, 16.8, 38.8, 14.6, 35, 13.6]);
      p.poly(light(P.hair, 0.3), [30.4, 14.4, 33.4, 14.2, 33, 15.4, 30.6, 15.6]);
    }
    if (L.sides === 'layer') for (const X of [x => x, x => 64 - x]) {
      p.poly(mix(P.hair, P.hairSh, 0.4), [X(18.6), 32, X(20), 32, X(19.8), 46, X(17.8), 55, X(18.4), 44]);
      p.poly(mix(P.hair, P.hairSh, 0.4), [X(14.6), 38, X(15.6), 38.4, X(15), 48, X(13.2), 52.6]);
      p.poly(light(P.hair, 0.18), [X(21), 22, X(22), 22, X(21.2), 34, X(20.4), 34]);
    }
    if (L.sides === 'flick') for (const X of [x => x, x => 64 - x]) {
      const layer = col => { p.poly(col, [X(18.6), 33, X(20), 33, X(19.6), 43, X(16.6), 51, X(17.8), 43]); p.poly(col, [X(14.8), 39.4, X(15.8), 39.8, X(14.6), 46.6, X(12.4), 49.4]); };
      p.band(0, 40, () => layer(mix(P.hair, P.hairSh, 0.4)));
      p.clip(40, () => layer(mix(P.tips || P.hair, P.hairSh, 0.4)));
    }
    if (accOf(L, 'sidebraid')) for (let i = 0; i < 7; i++) p.ell(i % 2 ? P.hairSh : mix(P.hair, P.hairSh, 0.25), 45.6 + i * 0.3, 24 + i * 3.4, 2.1, 1.9);
    if (accOf(L, 'braid')) { const bx = L.braidSide === 'r' ? 46.4 : 17.6, d = L.braidSide === 'r' ? 0.25 : -0.25; for (let i = 0; i < 7; i++) p.ell(i % 2 ? P.hairSh : P.hair, bx + i * d, 30 + i * 3.6, 2.5, 2.2); }
  }

  function lidDrop(lid, h) { return (lid === 'soft' || lid === 'narrow') && h >= 6 ? Math.max(1, Math.round(h / 8)) : 0; }

  function lidSlant(p, P, lid, x0, x1, y, side) {
    if (lid !== 'narrow') return;
    const half = Math.ceil((x1 - x0) / 2), ix = side < 0 ? x1 - half : x0;
    p.px(P.skin, ix, y, half, 1);
    p.px(P.lash, ix, y + 1, half, 1);
  }

  function eye(p, P, xu, yu, side, k, lid) {
    const u = p.u * (k || 1), x = Math.round(p.X(xu)), y0 = Math.round(p.Y(yu));
    const w = Math.max(2, Math.round(6.8 * u)), h = Math.max(2, Math.round(7.8 * u));
    const t = lidDrop(lid, h), y = y0 + t;
    const white = w >= 5;
    const iw = white ? w - 2 : w, ix = white ? x + 1 : x;
    if (white) p.px('#fbf8f6', x, y + 1, w, h - t - 1);
    p.px(P.eye, ix, y + 1, iw, h - t - 1);
    p.px(P.eyeDk, ix, y + 1, iw, Math.max(1, Math.round((h - 1) * 0.36) - t));
    if (h >= 4) {
      const low = P.eye2;
      const lh = low === P.eye ? 1 : Math.max(1, Math.floor((h - 1) / 2) - (h >= 7 ? 1 : 0));
      p.px(low, ix, y0 + h - lh, iw, lh);
    }
    if (iw >= 3 && h >= 5) p.px(mix(P.eyeDk, INK, 0.5), ix + Math.floor((iw - (iw >= 4 ? 2 : 1)) / 2), y0 + Math.round(h * 0.42), iw >= 4 ? 2 : 1, Math.max(1, Math.round(h * 0.3)));
    if (w >= 3) p.px('#ffffff', side < 0 ? ix : ix + iw - 1, y + (h >= 6 ? 2 : 1), 1, h >= 8 ? 2 : 1);
    p.px(P.lash, white ? (side < 0 ? x - 1 : x) : x, y, white ? w + 1 : w, 1);
    if (white) p.px(P.lash, side < 0 ? x - 1 : x + w, y + 1, 1, 1);
    if (t) lidSlant(p, P, lid, x, x + w, y, side);
    if (h >= 7) p.px(mix(P.skinDk, P.lash, 0.3), ix, y0 + h, iw, 1);
  }

  function eyeMale(p, P, xu, yu, side, lid) {
    const u = p.u, x = Math.round(p.X(xu)), y0 = Math.round(p.Y(yu));
    const w = Math.max(2, Math.round(7 * u)), h = Math.max(2, Math.round(5.9 * u));
    const t = lidDrop(lid, h), y = y0 + t;
    const white = w >= 5;
    const iw = white ? w - 3 : w, ix = white ? x + (side < 0 ? 2 : 1) : x;
    if (white) p.px('#f2eeec', x, y + 1, w, h - t - 1);
    p.px(P.eye, ix, y + 1, iw, h - t - 1);
    p.px(P.eyeDk, ix, y + 1, iw, Math.max(1, Math.round((h - 1) * 0.5) - t));
    if (iw >= 3 && h >= 4) p.px(mix(P.eyeDk, INK, 0.55), ix + Math.floor((iw - 1) / 2), y + 2, 1, h - t - 2);
    if (w >= 4 && h >= 3) p.px('#ffffff', side < 0 ? ix : ix + iw - 1, y + 1, 1, 1);
    p.px(P.lash, side < 0 ? x - 1 : x, y, w + 1, 1);
    if (white) p.px(P.lash, side < 0 ? x + w - 1 : x, y + 1, 1, 1);
    if (t) lidSlant(p, P, lid, x, x + w, y, side);
    if (h >= 4) p.px(mix(P.skin, P.skinDk, 0.55), ix, y0 + h, iw, 1);
  }

  const FACE = [19, 18, 45, 18, 46, 28, 44.5, 36.5, 39, 42.8, 32, 46.2, 25, 42.8, 19.5, 36.5, 18, 28];
  const FACE_M = [19.4, 18.4, 44.6, 18.4, 46.6, 28, 45.8, 35.5, 42.4, 41.8, 36.2, 46.6, 27.8, 46.6, 21.6, 41.8, 18.2, 35.5, 17.4, 28];
  const manFace = L => isMale(L) && !L.youth;
  const FACE_V = [19.4, 18.4, 44.6, 18.4, 46.4, 28, 45.4, 35.4, 41.6, 41.4, 35.6, 46.2, 32, 47.2, 28.4, 46.2, 22.4, 41.4, 18.6, 35.4, 17.6, 28];
  const faceOf = L => (manFace(L) ? (L.jaw === 'v' ? FACE_V : FACE_M) : FACE);

  const MOODS = {
    calm: { eye: 'open', mouth: 'line', brow: 'level' },
    smile: { eye: 'open', mouth: 'smile', brow: 'soft' },
    gentle: { eye: 'soft', mouth: 'smile', brow: 'soft' },
    sly: { eye: 'soft', mouth: 'smile', brow: 'arch' },
    lazy: { eye: 'half', mouth: 'smile', brow: 'low' },
    flat: { eye: 'half', mouth: 'tiny', brow: 'low' },
    cool: { eye: 'soft', mouth: 'line', brow: 'level' },
    serious: { eye: 'open', mouth: 'line', brow: 'stern' },
    stern: { eye: 'narrow', mouth: 'frown', brow: 'stern' },
    pout: { eye: 'open', mouth: 'frown', brow: 'level' },
    blank: { eye: 'open', mouth: 'tiny', brow: 'high' }
  };
  const moodOf = L => MOODS[L.mood] || MOODS.calm;

  function mouthShape(p, col, edge, x, y, w, kind) {
    if (p.u < 0.75 || kind === 'line' || kind === 'tiny') return p.snap(col, x, y, w, 1);
    const dy = kind === 'frown' ? 1 : -1;
    p.snap(col, x + 0.8, y, w - 1.6, 1);
    p.snap(edge, x - 0.4, y + dy, 1.2, 1);
    p.snap(edge, x + w - 0.8, y + dy, 1.2, 1);
  }

  function paintFaceMale(p, P, L) {
    p.ell(P.skin, 17.9, 31.5, 2.6, 3.9);
    p.ell(P.skin, 46.1, 31.5, 2.6, 3.9);
    p.ell(P.skinSh, 46.4, 32, 1.2, 2);
    if (L.jaw === 'v') {
      p.poly(P.skin, FACE_V);
      p.poly(P.skinSh, [43.6, 26, 46.4, 28, 45.4, 35.4, 41.6, 41.4, 35.6, 46.2, 37.8, 43, 41.8, 37.4]);
      p.poly(P.skinSh, [28, 45.4, 36, 45.4, 32, 47.2]);
    } else {
      p.poly(P.skin, FACE_M);
      p.poly(P.skinSh, [43.8, 26, 46.6, 28, 45.8, 35.5, 42.4, 41.8, 36.2, 46.6, 38.4, 43.4, 42.4, 37.6]);
      p.poly(P.skinSh, [25.6, 45.4, 38.4, 45.4, 36.2, 46.6, 27.8, 46.6]);
    }
    const M = moodOf(L), lid = p.u >= 0.75 ? M.eye : 'open';
    if (L.closed) { p.snap(P.lash, 21.6, 32, 7.4, 1.2); p.snap(P.lash, 35, 32, 7.4, 1.2); }
    else {
      eyeMale(p, P, 21.4, 29.2, -1, lid);
      eyeMale(p, L.eyeL ? Object.assign({}, P, { eye: L.eyeL, eyeDk: dark(L.eyeL, 0.5) }) : P, 35.4, 29.2, 1, lid);
      if (lid === 'half') for (const x of [20.4, 34.4]) { p.snap(P.skin, x, 29.2, 8.4, 1.6); p.snap(P.lash, x, 30.6, 8.4, 1); }
      const sc = accOf(L, 'facescar');
      if (sc && p.u >= 0.75) { p.snap(sc, 38.6, 36.4, 4, 0.7); p.snap(sc, 40, 35.6, 0.7, 2.4); }
      const liner = accOf(L, 'eyeliner');
      if (liner && p.u >= 0.75) for (const x of [20.4, 41.4]) p.snap(liner, x, 34, 2.2, 1);
    }
    const vm = accOf(L, 'vanirmask');
    if (vm) {
      p.poly('#18161e', [17.4, 21.6, 32, 18.4, 32, 38.4, 24, 37.4, 18, 33.6]);
      p.poly(vm, [32, 18.4, 46.6, 21.6, 46, 33.6, 40, 37.4, 32, 38.4]);
      p.poly(dark(vm, 0.16), [40.4, 25, 46.4, 23.4, 46, 33.6, 40, 37.4]);
      p.ell('#d83a3a', 25, 30.4, 1.9, 1.5); p.ell('#d83a3a', 38.8, 30.4, 1.9, 1.5);
      if (p.u >= 0.75) { p.snap('#18161e', 37.4, 21.4, 0.9, 4.2); p.snap('#18161e', 39.4, 21.4, 0.9, 4.2); }
    }
    p.snap(P.skinDk, 31.6, 35.2, 1.1, 2.6);
    p.snap(P.skinSh, 30, 38, 4, 0.9);
    if (L.mouth === 'open') p.snap('#6a2a30', 29.2, 41.8, 5, 1.8);
    else mouthShape(p, mix(P.skinDk, INK, 0.25), mix(P.skinDk, INK, 0.1), M.mouth === 'tiny' ? 30 : 29.2, 41.8, M.mouth === 'tiny' ? 4 : 5.6, M.mouth);
    p.snap(P.skinSh, 30.4, 43.2, 3.2, 0.8);
    if (accOf(L, 'mole')) p.snap('#5a3036', 37, 42.8, 1, 1);
    if (accOf(L, 'bandage')) { p.snap('#f2e4d8', 28.8, 35.2, 6.4, 1.8); p.snap('#d8c4b4', 31.6, 35.2, 0.9, 1.8); }
    { const v = accOf(L, 'goatee'); if (v) { p.poly(v, [27, 42.4, 37, 42.4, 37.6, 45.4, 34.4, 48.6, 29.6, 48.6, 26.4, 45.4]); p.poly(P.skin, [29.4, 43, 34.6, 43, 33.6, 44.4, 30.4, 44.4]); p.poly(v, [27.6, 39.8, 36.4, 39.8, 35.6, 41, 32, 40.4, 28.4, 41]); p.snap(mix(P.skinDk, INK, 0.3), 29.6, 42.2, 4.8, 0.8); } }
    if (accOf(L, 'stubble')) p.poly(mix(P.skin, P.hairSh, 0.28), [22.6, 38, 26, 43.6, 30, 45.8, 34, 45.8, 38, 43.6, 41.4, 38, 42.4, 41.8, 36.2, 46.6, 27.8, 46.6, 21.6, 41.8]);
    if (accOf(L, 'beard')) { p.poly(P.hairSh, [22.8, 37.5, 26, 42.5, 32, 44.4, 38, 42.5, 41.2, 37.5, 42.4, 41.8, 38, 47.4, 32, 49.4, 26, 47.4, 21.6, 41.8]); p.poly(P.hairSh, [27.6, 39.8, 36.4, 39.8, 35, 41.2, 29, 41.2]); }
  }

  function paintFace(p, P, L) {
    if (manFace(L)) return paintFaceMale(p, P, L);
    p.ell(P.skin, 18.4, 31.5, 2.2, 3.4);
    p.ell(P.skin, 45.6, 31.5, 2.2, 3.4);
    p.poly(P.skin, FACE);
    p.poly(P.skinSh, [43.5, 27, 46, 28, 44.5, 36.5, 39, 42.8, 36.5, 44, 41.5, 36.5]);
    const M = moodOf(L), fine = p.u >= 0.75, lid = fine ? M.eye : M.eye === 'half' ? 'half' : 'open';
    browsFemale(p, P, fine ? M.brow : M.brow === 'low' ? 'low' : 'level');
    if (L.closed) { p.snap(P.lash, 22, 32.4, 7, 1); p.snap(P.lash, 35.2, 32.4, 7, 1); p.snap(P.lash, 21.4, 31.4, 1, 1); p.snap(P.lash, 42, 31.4, 1, 1); }
    else {
      if (L.bigEyes) { eye(p, P, 21.2, 27, -1, 1.2, lid); eye(p, P, 34.6, 27, 1, 1.2, lid); }
      else { eye(p, P, 22, 28, -1, 1, lid); eye(p, P, 35.2, 28, 1, 1, lid); }
      if (lid === 'half') for (const x of [21.4, 34.6]) { p.snap(P.skin, x, 28, 8.2, 2.6); p.snap(P.lash, x, 30.2, 8.2, 1); if (p.u >= 0.75) p.snap(mix(P.skin, P.lash, 0.35), x + 0.6, 29.4, 7, 0.8); }
    }
    let v;
    if ((v = accOf(L, 'patchl'))) {
      p.poly(v, [41, 27.4, 46.6, 22.6, 47.2, 23.8, 42, 28.6]);
      p.poly(v, [36.4, 27.8, 29, 22.4, 29.6, 21.4, 37.2, 26.8]);
      p.ell(dark(v, 0.1), 38.6, 31.8, 4.7, 4.5);
      p.ell(v, 38.6, 31.6, 4.3, 4.1);
      p.ell(light(v, 0.22), 37.2, 30.2, 1.5, 1.1);
    }
    if ((v = accOf(L, 'eyepatch'))) {
      p.poly(dark(v, 0.12), [29.8, 18.6, 33.6, 20.4, 30.8, 25.6, 30.6, 36.4, 24.6, 38.6, 19.2, 36.6, 19.4, 28.4, 24.8, 26]);
      p.poly(v, [30, 18.6, 33, 20.2, 30.2, 25.6, 30, 35.6, 24.6, 37.6, 20, 36, 20.2, 28.6, 25, 26.6]);
      p.poly(dark(v, 0.1), [20.2, 31, 30, 30.2, 30, 31.2, 20.2, 32]);
    }
    if ((v = accOf(L, 'memomask'))) {
      p.poly('#14141c', [17, 22, 22, 15.6, 32, 13.4, 42, 15.6, 47, 22, 46.6, 33, 42, 41.6, 32, 47.4, 22, 41.6, 17.4, 33]);
      p.poly(v, [18.6, 22.6, 23, 17, 32, 15, 41, 17, 45.4, 22.6, 45, 32.6, 40.8, 40.6, 32, 45.8, 23.2, 40.6, 19, 32.6]);
      p.poly(light(v, 0.45), [18.6, 22.6, 23, 17, 32, 15, 27, 24, 21, 30]); p.poly(light(v, 0.22), [32, 15, 41, 17, 45.4, 22.6, 37, 25]);
      p.poly(dark(v, 0.22), [27, 24, 37, 25, 40.8, 40.6, 32, 45.8, 30, 34]); p.poly(dark(v, 0.1), [19, 32.6, 21, 30, 27, 24, 30, 34, 23.2, 40.6]);
      p.poly(light(v, 0.3), [37, 25, 45.4, 22.6, 45, 32.6, 40, 31]);
      p.snap('#effcff', 24, 20, 3, 1);
    }
    if (!accOf(L, 'memomask')) {
      p.snap(P.skinDk, 31.6, 37, 1.1, 1.1);
      const tiny = M.mouth === 'tiny', lip = tiny ? mix(P.skinDk, MOUTH, 0.45) : L.youth ? mix(P.skinDk, MOUTH, 0.35) : MOUTH;
      if (L.mouth === 'open') p.snap('#8a2a3a', 30.4, 41, 3.4, 1.8);
      else mouthShape(p, lip, mix(lip, P.skin, 0.45), tiny ? 30.8 : 30.4, 41, tiny ? 2.6 : L.youth ? 3.6 : 3.2, M.mouth);
    }
    if (L.blush) { p.snap(mix(P.skin, '#ff6080', 0.35), 21.5, 36.5, 3.5, 1); p.snap(mix(P.skin, '#ff6080', 0.35), 39, 36.5, 3.5, 1); }
    if (accOf(L, 'mole')) p.snap('#5a3036', 36.2, 42.8, 1, 1);
    if (accOf(L, 'bandage')) { p.snap('#f2e4d8', 28.8, 35.2, 6.4, 1.8); p.snap('#d8c4b4', 31.6, 35.2, 0.9, 1.8); }
    if (accOf(L, 'beard')) { p.poly(P.hairSh, [23.5, 37.5, 26, 42.5, 32, 44.2, 38, 42.5, 40.5, 37.5, 41.5, 42, 37.5, 47, 32, 48.8, 26.5, 47, 22.5, 42]); p.poly(P.hairSh, [28, 39.8, 36, 39.8, 34.5, 41, 29.5, 41]); }
  }

  function glassesAt(p, round, col, slim) {
    for (const x0 of [21.4, 34.4]) {
      const x = Math.round(p.X(x0)), y = Math.round(p.Y(slim ? 28.6 : 27.4)), w = Math.max(3, Math.round(8.2 * p.u)), h = Math.max(3, Math.round((slim ? 6.4 : 8) * p.u));
      if (round && w >= 6) {
        p.px(col, x + 1, y, w - 2, 1); p.px(col, x + 1, y + h - 1, w - 2, 1); p.px(col, x, y + 1, 1, h - 2); p.px(col, x + w - 1, y + 1, 1, h - 2);
      } else if (w >= 5) {
        p.px(col, x, y, w, 1); p.px(col, x, y + h - 1, w, 1); p.px(col, x, y, 1, h); p.px(col, x + w - 1, y, 1, h);
      } else p.px(col, x, y + h - 1, w, 1);
    }
    p.snap(col, 29.6, 30, 4.8, 0.9);
  }

  function backAcc(p, P, L) {
    let tb;
    if ((tb = accOf(L, 'trwings'))) for (const X of [x => x, x => 64 - x]) {
      p.poly(dark(tb, 0.22), [X(17), 56, X(9), 49, X(6.4), 51, X(8), 54.4, X(6.4), 57, X(10), 59.6, X(17), 61]);
      p.poly(tb, [X(17), 57, X(9.6), 50.6, X(7.8), 52, X(9.4), 54.8, X(8.2), 56.6, X(11), 58.4, X(17), 60]);
    }
    if ((tb = accOf(L, 'memohood'))) { p.poly(dark(tb, 0.12), [10, 46, 9, 26, 14, 11, 24, 3.4, 40, 3.4, 50, 11, 55, 26, 54, 46, 46, 50, 18, 50]); p.poly(tb, [11, 44, 10.4, 26, 15, 12, 24.6, 4.6, 39.4, 4.6, 49, 12, 53.6, 26, 53, 44]); p.poly(dark(tb, 0.1), [49, 12, 53.6, 26, 53, 44, 49, 44, 50, 26]); }
    if ((tb = accOf(L, 'cathood'))) { p.poly(dark(tb, 0.16), [11, 51, 9, 28, 13, 12, 23, 4, 41, 4, 51, 12, 55, 28, 53, 51, 45, 45, 19, 45]); p.poly(dark(tb, 0.06), [12, 47, 10.6, 28, 14.6, 13, 24, 5.4, 40, 5.4, 49.4, 13, 53.4, 28, 52, 47, 45, 43, 19, 43]); }
    if ((tb = accOf(L, 'greatsword'))) {
      p.poly(dark(tb, 0.5), [40, 66, 44.6, 64, 63.6, 24, 66, 16, 59.4, 22.4]);
      p.poly(tb, [41.6, 64.6, 44.2, 63.2, 62.4, 24.6, 64.6, 18.4, 59.6, 23.6]);
      p.poly('#ff9a2a', [44.2, 63.2, 45.2, 63.4, 64.4, 21.6, 64.6, 18.4, 62.4, 24.6]);
      p.poly('#ffd870', [45, 62.4, 45.4, 62.6, 63.8, 22, 63.6, 21.6]);
      p.poly('#1c1a20', [48.4, 50, 51.6, 51.6, 55.4, 43.2, 52.4, 41.8]);
    }
    if ((tb = accOf(L, 'doghood'))) { p.poly(dark(tb, 0.18), [11, 50, 9, 28, 13, 12, 23, 4, 41, 4, 51, 12, 55, 28, 53, 50, 45, 45, 19, 45]); p.poly(dark(tb, 0.08), [12, 46, 10.6, 28, 14.6, 13, 24, 5.4, 40, 5.4, 49.4, 13, 53.4, 28, 52, 46, 45, 43, 19, 43]); }
    if ((tb = accOf(L, 'hairbowback'))) { p.poly(tb, [16, 30, 9, 25, 9.6, 34]); p.poly(tb, [16, 30, 12, 37, 17, 36.4]); p.ell(light(tb, 0.2), 15.8, 30.4, 1.6, 1.4); }
    if ((tb = accOf(L, 'tailbow'))) {
      p.ell(P.hairSh, 33, 10.4, 4.6, 3.6);
      for (const sd of [-1, 1]) {
        p.poly(tb, [33, 8.4, 33 + sd * 5, 2.4, 33 + sd * 10.4, 0.4, 33 + sd * 8, 8.6]);
        p.poly(light(tb, 0.3), [33 + sd * 4.4, 4.6, 33 + sd * 9.4, 1.6, 33 + sd * 7.4, 6.4]);
        for (const [dx, dy] of [[6, 3.6], [7.8, 2.6], [7.2, 5.2], [5.2, 5.6]]) p.snap('#7a8af8', 33 + sd * dx - 0.4, dy, 0.8, 0.8);
      }
      p.ell(dark(tb, 0.2), 33, 8.4, 2, 1.8); p.snap('#d8dce4', 32.2, 7.6, 1.6, 1.4);
    }
    if (accOf(L, 'twintails')) for (const X of [x => x, x => 64 - x]) {
      p.poly(P.hairSh, [X(45), 12, X(54), 7.6, X(59), 16, X(58.4), 30, X(55), 38, X(53.6), 28, X(49.6), 17]);
      p.poly(P.hair, [X(45.6), 12.4, X(53.4), 8.8, X(57.4), 16, X(56.8), 28, X(54.6), 33, X(53.4), 25, X(49.6), 17]);
      p.ell(mix(P.hair, P.hairSh, 0.5), X(47.4), 12.6, 2.2, 1.8);
    }
    if (accOf(L, 'sidetail')) {
      p.poly(P.hairSh, [44, 13, 52.6, 9.6, 56, 17, 54.2, 30, 51.4, 36, 50.4, 27, 47.6, 18]);
      p.poly(P.hair, [44.6, 13.4, 52, 10.6, 54.4, 17, 52.8, 27.6, 51.2, 32, 50.6, 25, 47.6, 18]);
      p.ell(mix(P.hair, P.hairSh, 0.5), 47.2, 13.6, 2, 1.6);
    }
    if (accOf(L, 'hairloop')) {
      const outer = [], inner = [];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * (0.88 + i * 1.42 / 16);
        outer.push(38.4 + Math.cos(a) * 6.8, 8.6 + Math.sin(a) * 6.6);
        inner.unshift(38.8 + Math.cos(a) * 3.4, 8.8 + Math.sin(a) * 3.2);
      }
      p.poly(P.hair, outer.concat(inner));
      p.clipPoly(outer.concat(inner), () => {
        p.ell(P.hairSh, 38.8, 8.8, 4.6, 4.4);
        p.poly(P.hairHi, [33.6, 4.2, 37.4, 2.2, 41.6, 2.6, 37.6, 3.4]);
      });
    }
    if (accOf(L, 'bun')) {
      p.ell(P.hairSh, 47.6, 15.4, 7.4, 6.8, -0.4);
      p.ell(P.hair, 47, 14.6, 5.9, 5.3, -0.4);
      p.poly(P.hairHi, [43, 11.6, 47.6, 9.6, 50.6, 11.4, 45.8, 12.8]);
    }
  }

  function thHat(p, v) {
    const lav = '#b8a4ec', lavDk = '#7a5ac8', band = '#b02a3a', pet = '#8a5ae8', petHi = '#c8a8ff';
    const brim = (rx, ry, dy) => { const o = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; o.push(31 + Math.cos(a) * rx, 17 + dy + Math.sin(a) * ry - Math.cos(a) * 1.6); } return o; };
    p.poly(lavDk, brim(31, 7, 1));
    p.poly(lav, brim(30.4, 6.4, 0.8));
    const top = brim(29.6, 5, -0.4);
    p.poly(v, top);
    p.clipPoly(top, () => {
      p.poly(light(v, 0.16), [6, 15.4, 20, 12.4, 19, 14.2, 7, 17]);
      p.poly('#9a8cc8', [3, 17.6, 15, 15.4, 15, 16, 3.4, 18.4]);
      p.poly('#9a8cc8', [61, 15, 48, 13.8, 48, 14.6, 60.6, 16]);
    });
    const crown = [19, 15.6, 21.6, 9.6, 26, 4.6, 31, 1, 37, -2.2, 45, -4.6, 46.4, -3.4, 44, 0, 43.4, 4.6, 44.4, 9.6, 45.2, 15.4];
    p.poly(v, crown);
    p.clipPoly(crown, () => {
      p.poly(dark(v, 0.3), [40, -8, 50, -8, 50, 18, 41.6, 18, 40.4, 6]);
      p.poly(lavDk, [27.4, 11, 31, 4, 36.4, 0, 34.4, 4.6, 31.8, 11]);
      p.poly(lavDk, [35.6, 11, 37.6, 5, 41.6, -1.6, 40.2, 5, 38.6, 11]);
    });
    const bandPts = [19.4, 12.8, 31.2, 11.6, 44.8, 12.6, 45.2, 14.8, 31.2, 13.8, 19, 15];
    p.poly(band, bandPts);
    for (const [x, y, r] of [[23.8, 11.8, 4.2], [30.6, 13.2, 3.6], [36.8, 12, 3.2]]) {
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - 0.4; p.ell(pet, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.56, r * 0.56); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - 0.4; p.ell(petHi, x + Math.cos(a) * r * 0.52 - 0.2, y + Math.sin(a) * r * 0.52 - 0.2, r * 0.28, r * 0.28); }
      p.ell('#f4d86a', x, y, r * 0.24, r * 0.24);
    }
  }

  function witchHat(p, v) {
    const rim = '#f0b030', band = '#d03a2c', zig = '#f8a030';
    const brim = (rx, ry, dy) => { const o = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; o.push(31 + Math.cos(a) * rx, 17.4 + dy + Math.sin(a) * ry - Math.cos(a) * 1.4); } return o; };
    p.poly(rim, brim(30, 6.2, 0.6));
    const top = brim(29.4, 5.4, -0.2);
    p.poly(v, top);
    p.clipPoly(top, () => {
      p.poly('#6a5a6c', [0, 18.6, 12.6, 20.4, 7.6, 25, 0, 25]);
      p.poly('#6a5a6c', [64, 16, 51.4, 18, 56.4, 23, 64, 23]);
      p.poly(light(v, 0.14), [7.4, 16, 21.6, 12.4, 19.6, 14.8, 8.6, 17.6]);
      p.poly(dark(v, 0.22), [44, 13.4, 60, 12.4, 60, 16.4, 45, 16.6]);
    });
    const crown = [17.4, 16.4, 19.6, 9, 23.4, 3, 28.4, -1.4, 34.4, -3.8, 40.8, -3.6, 47.6, -1.4, 54.8, 2.8, 58, 6.4, 53.6, 5.6, 49.6, 3.6, 46.2, 4.6, 44.4, 9, 45.4, 16];
    p.poly(v, crown);
    p.clipPoly(crown, () => {
      p.poly(dark(v, 0.28), [38.4, -6, 64, -6, 64, 18, 41.4, 18, 43.4, 8]);
      p.poly(light(v, 0.16), [20.6, 14, 23.6, 5, 28.4, -0.4, 26.4, 6, 24.2, 14]);
    });
    const bandPts = [17.8, 12.6, 31.2, 11.2, 45, 12.2, 45.4, 16.4, 31.4, 15.4, 17.4, 16.6];
    p.poly(band, bandPts);
    p.clipPoly(bandPts, () => { for (let x = 17.6, k = 0; x < 46; x += 3.4, k++) p.poly(zig, k % 2 ? [x, 15.8, x + 1.7, 12.6, x + 3.4, 15.8] : [x, 11.4, x + 1.7, 14.6, x + 3.4, 11.4]); });
    for (const [bx, by] of [[25.4, 7.2], [36.8, 5.4]]) {
      p.ell(dark(band, 0.4), bx, by, 3.3, 3.3);
      p.ell(band, bx, by, 2.7, 2.7);
      p.poly(zig, [bx - 1.8, by - 1.2, bx - 1.2, by - 1.9, bx + 1.8, by + 1.2, bx + 1.2, by + 1.9]);
      p.poly(zig, [bx + 1.8, by - 1.2, bx + 1.2, by - 1.9, bx - 1.8, by + 1.2, bx - 1.2, by + 1.9]);
    }
    p.poly('#f08a30', [56.2, 5.4, 60.8, 9.6, 60.2, 15.8, 57.6, 12.4, 56, 16, 55, 9.8]);
    p.poly('#f8d040', [57, 7.6, 59.6, 10.4, 59, 14.2, 57.4, 11.6]);
  }

  function paintHeadAcc(p, P, L) {
    const bf = accOf(L, 'blindfold');
    if (bf) {
      const v = bf;
      p.poly(dark(v, 0.4), [18, 29.6, 46, 29.6, 45.6, 37.6, 18.4, 37.6]);
      p.poly(v, [18.4, 30.2, 45.6, 30.2, 45.2, 37, 18.8, 37]);
      p.poly(light(v, 0.28), [20, 30.8, 44, 30.8, 43.8, 31.8, 20.2, 31.8]);
      p.poly(dark(v, 0.25), [24, 34.4, 29.6, 34, 29.6, 35.2, 24, 35.6]);
      p.poly(dark(v, 0.25), [34.4, 34, 40, 34.4, 40, 35.6, 34.4, 35.2]);
    }
    if (accOf(L, 'glasses')) { const gv = accOf(L, 'glasses'); glassesAt(p, false, typeof gv === 'string' && gv[0] === '#' ? gv : '#241e26', gv === 'slim'); }
    if (accOf(L, 'roundglasses')) glassesAt(p, true, '#9a7448');
    let v;
    if ((v = accOf(L, 'witchhat'))) witchHat(p, v);
    if ((v = accOf(L, 'thhat'))) thHat(p, v);
    if ((v = accOf(L, 'xclips'))) for (const [x, y] of [[20.4, 21.6], [43.6, 21.6]]) {
      for (const d of [-1, 1]) {
        p.poly(dark(v, 0.35), [x - d * 2.4, y - 2.6, x - d * 1.2, y - 3.2, x + d * 2.4, y + 2.8, x + d * 1.2, y + 3.4]);
        p.poly(v, [x - d * 2.2, y - 2.8, x - d * 1.2, y - 3.2, x + d * 2.2, y + 2.4, x + d * 1.2, y + 2.8]);
      }
    }
    if ((v = accOf(L, 'earring'))) { p.snap(v, 17.8, 36, 1.4, 3); p.snap(v, 45.2, 36, 1.4, 3); }
    if ((v = accOf(L, 'dropgem'))) for (const x of [17.6, 46.4]) { p.snap('#c8ccd4', x - 0.4, 35.4, 0.8, 2); p.ell(dark(v, 0.35), x, 40.6, 2, 3); p.ell(v, x, 40.2, 1.6, 2.5); p.snap(light(v, 0.5), x - 0.8, 38.8, 0.8, 1); }
    if ((v = accOf(L, 'dangle'))) { p.snap(v, 17, 35.4, 1, 6.4); p.snap(light(v, 0.3), 16.6, 41.6, 1.8, 2.4); }
    if ((v = accOf(L, 'dangleR'))) { p.snap(v, 46.4, 35.4, 1, 6.4); p.snap(light(v, 0.3), 46, 41.6, 1.8, 2.4); }
    if ((v = accOf(L, 'earcuff'))) { p.snap(dark(v, 0.3), 46.4, 28.8, 1.6, 4.6); p.snap(v, 46.2, 28.4, 1.4, 3.6); }
    if ((v = accOf(L, 'hoop'))) { const x = 46.4, y = 39.6; p.snap(v, x - 2, y, 1, 4); p.snap(v, x + 1.6, y, 1, 4); p.snap(v, x - 1.4, y + 4, 3.4, 1); p.snap(v, x - 1.4, y - 1, 3.4, 1); p.snap(v, x - 0.2, 36, 1, 3); }
    if ((v = accOf(L, 'memohood'))) { p.poly(v, [14.8, 24, 16, 14, 23, 7, 32, 5.4, 41, 7, 48, 14, 49.2, 24, 47, 24, 45.6, 15.6, 40, 9.6, 32, 8.2, 24, 9.6, 18.4, 15.6, 17, 24]); p.poly(light(v, 0.5), [18, 14, 23.4, 8.4, 30, 7, 24, 10, 19.4, 15]); for (const x of [16, 48]) { p.ell('#14141c', x, 33, 2.2, 2.6); p.ell('#c8ccd4', x, 33, 1.2, 1.4); } }
    if ((v = accOf(L, 'cathood'))) {
      for (const s of [-1, 1]) {
        p.poly(dark(v, 0.14), [32 + s * 6, 9, 32 + s * 7.6, 0.6, 32 + s * 10.4, -3.6, 32 + s * 13.6, -4.2, 32 + s * 16.6, -1, 32 + s * 17.6, 5.6, 32 + s * 15.6, 11]);
        p.poly(v, [32 + s * 7, 8.6, 32 + s * 8.4, 1.4, 32 + s * 10.8, -2.4, 32 + s * 13.4, -3, 32 + s * 15.8, -0.4, 32 + s * 16.6, 5.4, 32 + s * 14.8, 10]);
        p.poly(light(v, 0.3), [32 + s * 9.4, 2, 32 + s * 11, -1, 32 + s * 13, -1.6, 32 + s * 11.6, 1.6]);
      }
      p.poly(v, [12.6, 34, 13.4, 18, 18.6, 9.6, 26, 5.8, 38, 5.8, 45.4, 9.6, 50.6, 18, 51.4, 34, 48.4, 34, 47.6, 19.6, 43.4, 12.2, 37, 9, 27, 9, 20.6, 12.2, 16.4, 19.6, 15.6, 34]);
      p.poly(light(v, 0.35), [16.4, 18, 20, 11.4, 27, 7.4, 22, 11, 18.4, 18.6]);
      p.poly(dark(v, 0.1), [48.4, 34, 47.6, 19.6, 43.4, 12.2, 45.4, 9.6, 50.6, 18, 51.4, 34]);
    }
    if ((v = accOf(L, 'trashlid'))) {
      const rx = 31, ry = 10, a = -0.22, rot = (x, y) => [rx + x * Math.cos(a) - y * Math.sin(a), ry + x * Math.sin(a) + y * Math.cos(a)];
      const poly = (col, pts) => p.poly(col, pts.flatMap(([x, y]) => rot(x, y)));
      p.ell(dark(v, 0.5), rx + 0.4, ry + 4.4, 22.6, 4.6, a);
      p.ell(dark(v, 0.22), rx, ry + 3.2, 22.2, 4.2, a);
      poly(v, [[-17, 3], [-16, -3], [-11, -8.6], [-4, -11], [4, -11], [11, -8.6], [16, -3], [17, 3]]);
      poly(dark(v, 0.16), [[8, -10], [11, -8.6], [16, -3], [17, 3], [10, 3]]);
      poly(light(v, 0.3), [[-14, -2], [-10, -7.4], [-4, -9.6], [-9, -6]]);
      for (const d of [-9, -3, 3, 9]) poly(dark(v, 0.22), [[d - 0.5, -9.6 + Math.abs(d) * 0.2], [d + 0.5, -9.6 + Math.abs(d) * 0.2], [d * 1.08 + 0.5, 2.6], [d * 1.08 - 0.5, 2.6]]);
      poly(dark(v, 0.45), [[-6, -10.6], [-5.4, -15.4], [5.4, -15.4], [6, -10.6], [4.2, -10.6], [3.8, -13.6], [-3.8, -13.6], [-4.2, -10.6]]);
      poly(light(v, 0.35), [[-5, -14.8], [4.6, -14.8], [4.4, -14.2], [-4.8, -14.2]]);
    }
    if ((v = accOf(L, 'flamehorn'))) {
      p.poly(dark(v, 0.4), [17, 16, 14.4, 6, 12.6, -4, 16.6, 3.4, 21.6, 13]);
      p.poly(v, [17.6, 14.6, 15.4, 6, 14, -1.6, 17, 4, 20.6, 12.6]);
      p.poly('#ff9a2a', [20.6, 12.6, 18, 5.6, 17.6, -2.4, 21.4, 4.4, 23, 11.6]);
      p.poly('#ffd870', [21, 10.6, 19.4, 5.6, 19.6, 1.6, 21.6, 6, 22, 10.4]);
    }
    if ((v = accOf(L, 'doghood'))) {
      const pink = L.earIn || '#f0b4b0';
      for (const s of [-1, 1]) {
        const X = x => 32 + s * x;
        p.poly(dark(v, 0.16), [X(5.4), 10.4, X(8.6), 0, X(12.2), -5.6, X(14.6), -4.6, X(17), 3.6, X(17.4), 9, X(15.4), 12]);
        p.poly(v, [X(6.4), 10, X(9.2), 0.8, X(12.4), -4.2, X(14), -3.4, X(16), 4, X(16.4), 9, X(14.8), 11]);
        p.poly(pink, [X(9.4), 6.6, X(11.4), 0.6, X(12.8), -1.4, X(14.2), 4.4, X(14.4), 8.4]);
        p.poly(light(pink, 0.35), [X(10.6), 5, X(12.2), 0.4, X(12.6), 2.6]);
      }
      p.poly(v, [12.6, 34, 13.4, 18, 18.6, 9.6, 26, 5.8, 38, 5.8, 45.4, 9.6, 50.6, 18, 51.4, 34, 48.4, 34, 47.6, 19.6, 43.4, 12.2, 37, 9, 27, 9, 20.6, 12.2, 16.4, 19.6, 15.6, 34]);
      p.poly(light(v, 0.4), [16.4, 18, 20, 11.4, 27, 7.4, 22, 11, 18.4, 18.6]);
      p.poly(dark(v, 0.1), [48.4, 34, 47.6, 19.6, 43.4, 12.2, 45.4, 9.6, 50.6, 18, 51.4, 34]);
      for (const x of [16, 20.4, 43.6, 48]) p.snap(light(v, 0.5), x - 0.5, 30 + (x % 3), 1, 2.4);
    }
    if ((v = accOf(L, 'hairorn'))) { p.poly(v, [46, 33, 49, 30.6, 50.4, 36, 47.4, 41, 46.4, 36]); p.poly(dark(v, 0.3), [47.4, 34, 49, 33, 48.6, 38, 47.4, 39]); p.snap('#d8b050', 47.2, 32, 1, 1); }
    if ((v = accOf(L, 'hairclip'))) { p.poly(v, [20, 16, 26, 13.6, 26.6, 15, 20.6, 17.4]); p.snap(dark(v, 0.3), 22, 15.4, 2, 0.6); }
    if ((v = accOf(L, 'laurel'))) {
      const lx = 42, ly = 21.4;
      for (const [a, l] of [[-2.5, 6.4], [-1.9, 7.4], [-1.3, 6.8], [-0.7, 5.4]]) {
        const tx = lx + Math.cos(a) * l, ty = ly + Math.sin(a) * l, nx = -Math.sin(a) * 1.3, ny = Math.cos(a) * 1.3;
        p.poly(dark(v, 0.35), [lx, ly, (lx + tx) / 2 + nx * 1.3, (ly + ty) / 2 + ny * 1.3, tx, ty, (lx + tx) / 2 - nx * 1.3, (ly + ty) / 2 - ny * 1.3]);
        p.poly(v, [lx, ly, (lx + tx) / 2 + nx, (ly + ty) / 2 + ny, tx, ty, (lx + tx) / 2 - nx * 0.4, (ly + ty) / 2 - ny * 0.4]);
      }
      p.snap(light(v, 0.4), lx - 0.4, ly - 3.4, 0.8, 1.6);
    }
    if ((v = accOf(L, 'gemclip'))) { p.poly(dark(v, 0.35), [44.6, 17.4, 47.6, 21, 44.6, 24.6, 41.6, 21]); p.poly(v, [44.6, 18.2, 46.8, 21, 44.6, 23.8, 42.4, 21]); p.poly(dark(v, 0.18), [44.6, 21, 46.8, 21, 44.6, 23.8]); }
    if ((v = accOf(L, 'redlily'))) {
      const fx = 14, fy = 44;
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.2; p.poly(i % 2 ? dark(v, 0.2) : v, [fx, fy, fx + Math.cos(a - 0.25) * 3, fy + Math.sin(a - 0.25) * 3, fx + Math.cos(a) * 7, fy + Math.sin(a) * 7, fx + Math.cos(a + 0.25) * 3, fy + Math.sin(a + 0.25) * 3]); }
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.snap(light(v, 0.4), fx + Math.cos(a) * 5.6 - 0.4, fy + Math.sin(a) * 5.6 - 0.4, 0.8, 0.8); }
      p.ell(dark(v, 0.4), fx, fy, 1.4, 1.4);
      p.poly('#5a2a2a', [fx + 0.4, fy + 1, fx + 1.4, fy + 1, fx + 5, 64, fx + 4, 64]);
    }
    if (accOf(L, 'tallspikes')) for (const [bx, tx, ty, w] of [[22, 16, 2, 4], [28, 27, -4, 4.4], [34, 37, -3, 4.4], [40, 47, 1, 4], [45, 54, 9, 3.4]]) {
      p.poly(P.hairSh, [bx - w, 15, tx, ty, bx + w, 15]);
      p.poly(P.hair, [bx - w + 1, 15, tx, ty + 1.4, bx + w - 1.4, 15]);
      p.poly(P.hairHi || light(P.hair, 0.3), [bx - w + 1.6, 14, tx - 0.2, ty + 3, bx - w + 3, 14]);
    }
    if ((v = accOf(L, 'tiebows'))) for (const X of [x => x, x => 64 - x]) {
      p.poly(v, [X(46), 10, X(41.6), 3, X(44.4), 1.8, X(48), 8.4]);
      p.poly(v, [X(47), 10, X(53.6), 4.6, X(54.6), 7.4, X(48.6), 11]);
      p.poly(light(v, 0.3), [X(43), 3.6, X(44.4), 2.8, X(46.6), 7]);
      p.ell(dark(v, 0.2), X(47), 9.8, 1.6, 1.4);
    }
    if ((v = accOf(L, 'headphones'))) {
      const outer = [], inner = [];
      for (let i = 0; i <= 18; i++) { const an = Math.PI * (1.02 + i * 0.96 / 18); outer.push(32 + Math.cos(an) * 18.4, 29 + Math.sin(an) * 17.6); inner.unshift(32 + Math.cos(an) * 16.8, 29 + Math.sin(an) * 16); }
      p.poly(v, outer.concat(inner));
      for (const x of [14.4, 49.6]) { p.ell(v, x, 31.4, 3.4, 4.4); p.ell(L.cupRing || '#d8a830', x, 31.4, 2.4, 3.4); p.ell(v, x, 31.4, 1.4, 2.2); }
    }
    if ((v = accOf(L, 'headset'))) { p.ell(v, 17.6, 31, 2.4, 3); p.ell('#3ad8c8', 17.6, 31, 0.9, 1.2); p.poly(v, [16.8, 28, 18.2, 28, 21, 18, 19.8, 18]); p.snap('#c8ccd4', 19, 19, 1, 4); }
    if ((v = accOf(L, 'hairtassel')) && !p.fig) for (const X of [x => x, x => 64 - x]) {
      p.poly(v, [X(6.6), 46.4, X(11.8), 45.6, X(12), 47.4, X(6.8), 48.2]);
      p.poly(v, [X(9.4), 47.4, X(10.6), 47.2, X(11.4), 52.6, X(10.2), 52.8]);
      p.poly(v, [X(8.6), 47.6, X(9.6), 47.6, X(8.4), 52.4, X(7.4), 52.2]);
      p.ell(L.bead || '#e8c050', X(10.8), 53.4, 1.2, 1.2);
      p.ell(L.bead || '#e8c050', X(7.9), 53, 1.2, 1.2);
    }
    if ((v = accOf(L, 'tassel'))) { p.snap('#e8e4ee', 17.4, 35.4, 1.6, 1.4); p.snap(v, 17, 36.8, 2.4, 2.4); p.snap(dark(v, 0.25), 17.4, 39.2, 1.6, 2.6); }
    if ((v = accOf(L, 'trbob'))) for (const X of [x => x, x => 64 - x]) {
      p.poly(dark(v, 0.2), [X(19), 20, X(13.6), 28, X(12.4), 37, X(14), 43, X(18.6), 45, X(21.8), 42, X(21), 33, X(22), 26]);
      p.poly(v, [X(19), 20, X(14.6), 28, X(13.6), 36, X(15), 41.6, X(18.6), 43.2, X(20.8), 40.6, X(20), 32, X(21), 25]);
      p.poly(light(v, 0.2), [X(16.4), 27, X(15.4), 34, X(16.2), 38, X(17), 34, X(18), 28]);
    }
    if ((v = accOf(L, 'trtuft'))) {
      p.poly(dark(v, 0.18), [43, 12.6, 46, 6.4, 51.4, 4.6, 50.4, 8.4, 53, 11, 48.6, 14.6]);
      p.poly(v, [44, 12.2, 46.6, 7.2, 50.2, 5.8, 49.2, 8.8, 51.2, 11, 48, 13.4]);
    }
    if ((v = accOf(L, 'headband'))) {
      const outer = [], inner = [];
      for (let i = 0; i <= 18; i++) { const an = Math.PI * (1.06 + i * 0.88 / 18); outer.push(32 + Math.cos(an) * 17.2, 27 + Math.sin(an) * 15.2); inner.unshift(32 + Math.cos(an) * 15.8, 27 + Math.sin(an) * 12.6); }
      p.poly(v, outer.concat(inner));
      p.poly(light(v, 0.3), outer.slice(10, 22).concat(inner.slice(inner.length - 22, inner.length - 10)));
    }
    if ((v = accOf(L, 'clip'))) { p.ell(v, 21.4, 20.4, 2.4, 2.4); p.ell(P.hair, 21.4, 20.4, 1.1, 1.1); p.poly(v, [22.4, 22, 23.4, 22, 26.4, 28, 25.4, 28.2]); }
    if ((v = accOf(L, 'hairloop'))) {
      for (const x of [29.6, 37]) { p.ell(dark('#e8b040', 0.25), x, 11.2, 1.5, 1.4); p.ell('#f0c050', x - 0.2, 11, 1.1, 1); }
      p.ell(dark(v, 0.35), 33.3, 10.6, 3, 2.8);
      p.ell(v, 33.2, 10.4, 2.6, 2.4);
      p.ell(light(v, 0.55), 32.4, 9.6, 0.9, 0.8);
    }
    if ((v = accOf(L, 'bun'))) {
      p.poly(P.top, [48.6, 18.2, 53.4, 20.6, 52.2, 27.4, 50, 22.4]);
      p.poly(v, [50.2, 9.4, 57, 5.2, 55.4, 8.8, 52, 11.6]);
      p.poly(v, [51.4, 12.4, 57.6, 12.6, 54.2, 15]);
      p.ell(light(v, 0.4), 51.6, 11.8, 1.4, 1.4);
    }
    if ((v = accOf(L, 'ribbon'))) {
      const [rx, ry] = L.back === 'tail' ? [47.5, 37] : [17.5, 33];
      p.poly(v, [rx, ry, rx - 3.8, ry - 2.8, rx - 3.4, ry + 2.8]);
      p.poly(v, [rx, ry, rx + 3.8, ry - 2.8, rx + 3.4, ry + 2.8]);
      p.ell(dark(v, 0.3), rx, ry, 1.2, 1.2);
    }
    if ((v = accOf(L, 'hairbow'))) { p.poly(v, [22.5, 9.5, 29, 1.5, 26.5, 11]); p.poly(v, [22.5, 9.5, 14.5, 2.5, 16.5, 12.5]); p.ell(light(v, 0.2), 22.5, 9.5, 1.5, 1.5); }
    if ((v = accOf(L, 'domino'))) {
      const d = dark(v, 0.3);
      p.poly(d, [17.6, 25.4, 46.4, 25.4, 45.6, 28, 18.4, 28]);
      p.poly(v, [18.2, 25.8, 45.8, 25.8, 45.2, 27.6, 18.8, 27.6]);
      for (const sd of [-1, 1]) {
        const m = a => a.map((q, i) => (i % 2 || sd < 0 ? q : 64 - q));
        p.poly(v, m([16.8, 27, 21.2, 27.4, 20.4, 35.6, 17.4, 33]));
        p.poly(v, m([20.4, 35.2, 30, 35.2, 29.4, 37.2, 21, 37]));
      }
      p.poly(v, [29.8, 27.4, 34.2, 27.4, 33.6, 32.4, 30.4, 32.4]);
    }
    if ((v = accOf(L, 'circlet'))) for (const s of [-1, 1]) {
      p.poly('#22385e', [32 + s * 13.4, 24.2, 32 + s * 16, 24.8, 32 + s * 15.8, 30.8, 32 + s * 13.2, 29.8]);
      p.poly(v, [32 + s * 13.8, 24.9, 32 + s * 15.3, 25.3, 32 + s * 15.1, 29.6, 32 + s * 13.6, 29]);
    }
    if ((v = accOf(L, 'bubble'))) {
      const ring = [];
      for (let i = 0; i <= 36; i++) { const an = i / 36 * Math.PI * 2; ring.push(32 + Math.cos(an) * 22, 25 + Math.sin(an) * 21); }
      ribbon(p, v, ring, 1.4);
      const hi = [];
      for (let i = 0; i <= 8; i++) { const an = Math.PI * (1.12 + i * 0.03); hi.push(32 + Math.cos(an) * 19, 25 + Math.sin(an) * 18); }
      ribbon(p, '#ffffff', hi, 1.2);
    }
    if ((v = accOf(L, 'catband'))) {
      for (const s of [-1, 1]) {
        p.poly(v, [32 + s * 5.6, 12.6, 32 + s * 14.6, 15.4, 32 + s * 13.8, 1]);
        p.poly(L.neon || '#fb2894', [32 + s * 9.4, 12.6, 32 + s * 12.4, 13.4, 32 + s * 12.6, 7.4]);
      }
      ribbon(p, v, [17.4, 19.4, 21.6, 13.6, 32, 10.6, 42.4, 13.6, 46.6, 19.4], -1.3);
    }
    if ((v = accOf(L, 'maidcap'))) {
      const arc = [15.6, 19.6, 19.8, 12.8, 25.6, 9.8, 32, 8.8, 38.4, 9.8, 44.2, 12.8, 48.4, 19.6];
      for (let i = 0; i < arc.length; i += 2) p.ell(v, arc[i], arc[i + 1] - 1.6, 2.4, 2);
      ribbon(p, v, arc, -2.6);
      const bc = L.capRibbon || P.trim, tail = L.capTail || '#a8d0f0';
      ribbon(p, bc, [16.6, 18.6, 20.6, 12.2, 32, 8.6, 43.4, 12.2, 47.4, 18.6], -0.9);
      for (const X of [x => x, x => 64 - x]) {
        p.poly(tail, [X(16.6), 19.6, X(17.6), 19.6, X(15.2), 33, X(14.2), 32.8]);
        p.poly(tail, [X(17.6), 19.6, X(18.6), 19.6, X(18.2), 31, X(17.2), 31]);
        p.poly(bc, [X(17), 19, X(13.4), 16.6, X(13.6), 21.6]); p.poly(bc, [X(17), 19, X(20.6), 16.6, X(20.4), 21.6]);
        p.ell(dark(bc, 0.3), X(17), 19, 1, 1);
      }
    }
    if ((v = accOf(L, 'heartbow'))) {
      const bx = 21.5, by = 8.4, w = '#fbf4f8';
      p.poly(v, [bx, by, bx - 10.6, by - 6.6, bx - 11.6, by + 3.8, bx - 2, by + 2.8]);
      p.poly(w, [bx, by, bx - 9.2, by - 5, bx - 10, by + 2.6, bx - 2, by + 1.8]);
      p.poly(v, [bx, by, bx + 9.6, by - 7.8, bx + 11.2, by + 1.6, bx + 2, by + 2.8]);
      p.poly(w, [bx, by, bx + 8.4, by - 6.4, bx + 9.6, by + 0.8, bx + 2, by + 1.8]);
      p.poly(w, [bx - 1, by + 1, bx - 5.2, by + 9.4, bx - 2.4, by + 8.4, bx, by + 2]);
      p.poly(v, [bx + 1, by + 1, bx + 4.8, by + 9.6, bx + 2, by + 8.8, bx, by + 2]);
      heartAt(p, '#c5883d', bx, by + 0.8, 3.6);
      heartAt(p, '#ff4a96', bx, by + 0.8, 2.7);
      p.ell('#ffd0e4', bx - 1.1, by - 0.4, 0.6, 0.6);
    }
    if ((v = accOf(L, 'goggles'))) {
      p.poly('#1c1a24', [16.5, 17, 47.5, 17, 46.5, 10, 17.5, 10]);
      p.poly(v, [18, 15.8, 46, 15.8, 45.2, 11.2, 18.8, 11.2]);
      p.poly(light(v, 0.45), [20, 14.8, 26, 14.8, 27, 12.2, 21, 12.2]);
    }
    if (accOf(L, 'shades')) {
      p.ell('#141018', 26.5, 12.5, 4.4, 3.4); p.ell('#141018', 37.5, 12.5, 4.4, 3.4);
      p.rect('#141018', 30, 11.6, 4, 1.2);
      p.snap('#5a4a66', 24.8, 11.2, 1.4, 1); p.snap('#5a4a66', 35.8, 11.2, 1.4, 1);
    }
    if ((v = accOf(L, 'beret'))) {
      p.ell(v, 35, 11.5, 16.5, 6.8, -0.14);
      p.ell(light(v, 0.16), 34, 9.6, 12, 3.4, -0.14);
      p.poly(dark(v, 0.3), [19, 17.5, 50, 12.5, 50.5, 14.5, 19.5, 19.5]);
      const bg = accOf(L, 'beretgold');
      if (bg) for (const X of [x => x, x => 64 - x]) {
        p.ell(dark(bg, 0.35), X(17.6), 19.6, 3.6, 3.6); p.ell(bg, X(17.6), 19.2, 3, 3); p.ell(dark(bg, 0.25), X(17.6), 19.2, 1.4, 1.4);
        p.poly('#3ab0e8', [X(17.6), 23, X(18.8), 24.6, X(17.6), 26.4, X(16.4), 24.6]);
        p.poly(bg, [X(16.8), 26.4, X(18.4), 26.4, X(18.6), 33, X(16.6), 33]); p.poly(light(bg, 0.3), [X(17.2), 26.4, X(17.8), 26.4, X(17.8), 33, X(17.2), 33]);
      } else {
        const f = accOf(L, 'flower') || '#8c5ae8';
        for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4 - 0.3; p.ell(f, 48 + Math.cos(a) * 2.6, 17 + Math.sin(a) * 2.6, 2.2, 1.6, a); }
        p.ell('#f0d060', 48, 17, 1.1, 1.1);
        p.poly('#3a4ab0', [47, 19.5, 50, 19.5, 51.5, 27, 48.5, 25]);
      }
      if (L.beretBand) { p.poly(L.beretBand, [19.2, 16.6, 46, 12.4, 46.4, 13.6, 19.4, 17.8]); for (const x of [26, 33, 40]) p.snap(light(L.beretBand, 0.4), x, 15 - (x - 26) * 0.14, 1.2, 0.8); }
    }
    if ((v = accOf(L, 'visor'))) {
      p.poly('#1e1c2a', [18, 17, 30, 17, 32, 15.4, 34, 17, 46, 17, 45, 11, 19, 11]);
      p.poly(v, [19.4, 16, 29.4, 16, 32, 14.2, 34.6, 16, 44.6, 16, 43.8, 12, 20.2, 12]);
      p.poly(mix(v, '#40d0f0', 0.55), [19.4, 16, 29.4, 16, 30.6, 15, 20, 14.6]); p.poly(mix(v, '#40d0f0', 0.55), [34.6, 16, 44.6, 16, 44.4, 14.6, 33.4, 15]);
      p.poly(light(v, 0.55), [22, 13.6, 27, 13.6, 27.6, 12.6, 22.6, 12.6]);
    }
    if ((v = accOf(L, 'hairblossom'))) { for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; p.ell(v, 15.6 + Math.cos(a) * 1.7, 18.6 + Math.sin(a) * 1.7, 1.5, 1.2, a); } p.ell('#e8c050', 15.6, 18.6, 0.9, 0.9); p.poly('#e8c050', [16.6, 20, 17.6, 20, 18.6, 24, 17.6, 24]); }
    if ((v = accOf(L, 'hairpins'))) { p.snap(v, 18.4, 27.6, 3, 0.9); p.snap(v, 42.6, 27.6, 3, 0.9); }
    if (accOf(L, 'strays')) for (const X of [x => x, x => 64 - x]) { p.poly(P.hair, [X(15.4), 39, X(16.2), 41.4, X(12.4), 45.8]); p.poly(P.hair, [X(15.6), 47, X(16.2), 49.4, X(13.2), 53.4]); }
    if ((v = accOf(L, 'ushanka'))) {
      p.ell(v, 32, 12.5, 19, 9.5);
      p.ell(v, 17, 16.5, 6, 6.5); p.ell(v, 47, 16.5, 6, 6.5);
      p.ell(light(v, 0.14), 27, 8.5, 8, 3.2);
      p.ell('#d2aa52', 44, 15, 3, 3); p.ell('#8a6a2a', 44, 15, 1.3, 1.3);
      p.poly('#2d6bd2', [44, 18, 49, 22, 47, 29, 45, 23]);
      p.poly('#f0f0f4', [46, 18.5, 51, 21, 50, 27]);
    }
    if (accOf(L, 'molehat')) {
      const W = '#f0eadc', Wd = '#d8cfbe', Br = '#4e3a2e';
      for (const X of [x => x, x => 64 - x]) {
        p.poly(Br, [X(11), 14, X(17.4), 16, X(16.6), 36, X(13.6), 41, X(9.4), 36]);
        p.poly(light(Br, 0.12), [X(11.6), 16, X(13.6), 16.4, X(12.6), 34, X(10.6), 33]);
        p.ell(W, X(12.6), 39.4, 3.6, 2.6); p.ell(Wd, X(13.2), 40.4, 2.4, 1.4);
      }
      p.poly(W, [10.6, 18, 11.4, 6, 17.4, -0.4, 46.6, -0.4, 52.6, 6, 53.4, 18]);
      p.poly(Wd, [46.6, -0.4, 52.6, 6, 53.4, 18, 48.4, 18]);
      p.poly(light(W, 0.4), [14, 6, 18.4, 1.6, 30, 1.2, 18.6, 4.4]);
      p.rect(Br, 10, 15.6, 44, 3.4);
      for (const x of [25, 39]) { p.poly('#4a3a32', [x - 2, 5, x + 2, 5, x + 3.6, 7, x + 3.6, 10.4, x + 2, 12.2, x - 2, 12.2, x - 3.6, 10.4, x - 3.6, 7]); p.poly('#6a5446', [x - 2, 5, x + 2, 5, x + 3, 6.4, x - 3, 6.4]); }
      const b = accOf(L, 'molebadge') || '#d8b050';
      p.poly('#d85030', [50.2, 13.6, 53.6, 13.6, 54.6, 24, 52.4, 22, 50.6, 24.4]); p.poly('#e8b020', [52, 13.6, 53.6, 13.6, 53.8, 21.6, 52.6, 20.4]);
      p.ell(dark(b, 0.3), 51.8, 11.4, 3, 3); p.ell(b, 51.6, 11, 2.4, 2.4); p.snap(light(b, 0.5), 50.8, 10, 1, 1);
    }
    if ((v = accOf(L, 'minecap'))) {
      const fur = L.capFur || '#eeeae2', brass = '#c89a48';
      p.poly(v, [12.4, 17, 13, 8, 18.6, 1.6, 45.4, 1.6, 51, 8, 51.6, 17]);
      p.poly(dark(v, 0.2), [45.4, 1.6, 51, 8, 51.6, 17, 46, 17]);
      p.poly(light(v, 0.3), [15.6, 8, 19.6, 3, 28, 2.6, 19.8, 5.4]);
      for (let x = 11.4; x <= 52.8; x += 3.45) { const i = Math.round((x - 11.4) / 3.45); p.ell(i % 2 ? dark(fur, 0.08) : fur, x, 16.4 + (i % 2) * 0.4, 2.5, 2.9); }
      p.poly(light(fur, 0.5), [13, 15, 20, 14, 26, 14.6, 19, 15.4]);
      p.ell(dark(brass, 0.45), 32, 9.4, 5.2, 4.8); p.ell(brass, 32, 9, 4.6, 4.2);
      p.ell('#fff0a0', 32, 9, 3.2, 2.9); p.ell('#fffbe4', 31.2, 8.2, 1.6, 1.4);
      p.rect(dark(brass, 0.3), 26, 12.8, 12, 1.2);
      const b = accOf(L, 'molebadge');
      if (b) { p.ell(dark(b, 0.3), 46.6, 8.6, 2.6, 2.6); p.ell(b, 46.4, 8.2, 2, 2); p.snap(light(b, 0.5), 45.8, 7.4, 1, 1); }
    }
    if (accOf(L, 'crown')) p.poly('#e8d070', [21.5, 12, 23.5, 3.5, 27.5, 8.5, 32, 1.5, 36.5, 8.5, 40.5, 3.5, 42.5, 12]);
    if ((v = accOf(L, 'tiara'))) {
      p.poly(dark(v, 0.5), [22.6, 13.4, 24.4, 6.2, 27.2, 9.6, 29.4, 4.6, 32, 0, 34.6, 4.6, 36.8, 9.6, 39.6, 6.2, 41.4, 13.4, 32, 11.8]);
      p.poly(v, [23.8, 12.4, 25, 7.8, 27.6, 10.8, 30, 5.6, 32, 1.8, 34, 5.6, 36.4, 10.8, 39, 7.8, 40.2, 12.4, 32, 10.8]);
      p.poly('#ffffff', [31.2, 3.8, 32, 1.8, 32.6, 8.6, 31.4, 9]);
      p.ell(L.tiaraGem || '#3a68d8', 32, 10, 1.6, 1.6);
    }
    if ((v = accOf(L, 'sweephorns'))) for (const s of [-1, 1]) {
      const X = x => 32 + s * x;
      const outer = [X(8.6), 15.6, X(13), 12, X(15.8), 6.8, X(16.4), 1.8, X(15.2), -1.2, X(13), -2.6];
      const inner = [X(13.2), 0.6, X(12.8), 4.8, X(10.8), 8.6, X(7.2), 11.8];
      p.poly(v, outer.concat(inner));
      p.poly('#9a1c2c', [X(14), 0.4, X(14.4), 3.6, X(13.6), 7.6, X(11.6), 11, X(8.8), 13.4, X(7.2), 11.8, X(10.8), 8.6, X(12.8), 4.8, X(13.2), 0.6]);
      p.poly(light(v, 0.35), [X(15.2), 2.4, X(15.8), 4.4, X(15.2), 7, X(14.4), 7.2]);
      p.ell('#1c1a22', X(9.8), 16, 2.2, 2.4);
      p.snap('#d8b050', X(9.8) - 0.5, 15.6, 1, 1);
    }
    if ((v = accOf(L, 'horns'))) for (const s of [-1, 1]) {
      const x = 32 + s * 6.4;
      p.poly(v, [x - s * 1.2, 13.6, x + s * 1.3, 13.8, x + s * 2.6, 9.6, x + s * 4.4, 6, x + s * 6.6, 3.4, x + s * 6.2, 1.8, x + s * 4.4, 3.4, x + s * 2, 6.6, x + s * 0.2, 9.8]);
      p.poly(v, [x + s * 3.2, 7.6, x + s * 1.4, 4.6, x + s * 1.6, 2.6, x + s * 2.6, 3.4, x + s * 4, 6.6]);
      p.poly(light(v, 0.55), [x + s * 4.6, 4.6, x + s * 6.2, 1.8, x + s * 6.6, 3.4, x + s * 5.2, 5]);
      p.poly(light(v, 0.45), [x + s * 1.5, 4.2, x + s * 1.6, 2.6, x + s * 2.6, 3.4, x + s * 2.4, 4.6]);
      p.poly(dark(v, 0.18), [x - s * 0.2, 13.6, x + s * 1.3, 13.8, x + s * 2.4, 10, x + s * 1, 9.8]);
    }
    if ((v = accOf(L, 'trflowers'))) for (const [x, y, r] of [[33.4, 11, 3], [40.6, 12.6, 3.5], [47, 18, 3.1]]) {
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - 0.3; p.ell(dark(v, 0.08), x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66, r * 0.56, r * 0.56); }
      p.ell(v, x, y, r * 0.66, r * 0.66);
      p.ell('#5a7ae8', x, y, r * 0.3, r * 0.3);
    }
    if ((v = accOf(L, 'hairflower'))) {
      const fx = x => (L.sideR ? 64 - x : x);
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 0.4; p.ell(dark(v, 0.15), fx(17 + Math.cos(a) * 2), 22 + Math.sin(a) * 2, 2, 1.6, L.sideR ? -a : a); }
      p.ell(v, fx(17), 22, 2.2, 2.2);
      p.ell(light(v, 0.45), fx(16.4), 21.3, 1, 0.8);
      p.poly(v, [fx(17.6), 24, fx(18.6), 24, fx(18.8), 31, fx(17.8), 31]);
      p.ell(v, fx(18.3), 31.6, 1, 1.3);
    }
    if ((v = accOf(L, 'lotus'))) {
      const fx = x => (L.sideR ? 64 - x : x), X = 17, Y = 11;
      for (const c of [0, 1]) {
        const cx = fx(X - 3.4 + c * 1.6);
        p.poly(dark(v, 0.35), [cx - 0.5, Y + 2, cx + 0.5, Y + 2, cx + 0.6, Y + 22, cx - 0.4, Y + 22]);
        for (const y of [Y + 9, Y + 15]) p.snap('#d8b050', cx - 0.8, y, 1.6, 1.2);
        p.poly(v, [cx - 1, Y + 22, cx + 1, Y + 22, cx + 1.3, Y + 27, cx - 1.3, Y + 27]);
        p.rect(dark(v, 0.3), cx - 1.3, Y + 26, 2.6, 1);
      }
      p.poly('#f4f0ec', [fx(X - 1), Y + 1.6, fx(X - 7.4), Y + 9.4, fx(X - 8.6), Y + 12.6, fx(X - 5.6), Y + 9.6, fx(X + 0.6), Y + 3]);
      p.poly('#c8c2c8', [fx(X - 3.6), Y + 5.4, fx(X - 8.4), Y + 12, fx(X - 7), Y + 9]);
      p.ell(dark(v, 0.2), fx(X), Y, 4.2, 3.6);
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 4, r = i % 2 ? 5.4 : 6.6;
        const tx = X + Math.cos(a) * r, ty = Y + Math.sin(a) * r * 0.86;
        const lx = X + Math.cos(a - 0.5) * 3.4, ly = Y + Math.sin(a - 0.5) * 3, rx = X + Math.cos(a + 0.5) * 3.4, ry = Y + Math.sin(a + 0.5) * 3;
        p.poly(i % 2 ? dark(v, 0.22) : v, [fx(lx), ly, fx(tx), ty, fx(rx), ry]);
      }
      p.ell(dark(v, 0.4), fx(X), Y, 2.8, 2.5);
      p.ell('#f0c040', fx(X), Y, 1.7, 1.5);
      p.snap(light(v, 0.5), fx(X + (L.sideR ? 1.6 : -2.6)), Y - 3.6, 1, 1);
    }
    if ((v = accOf(L, 'foxears'))) for (const s of [-1, 1]) {
      p.poly(v, [32 + s * 5.4, 12.6, 32 + s * 13.8, 14, 32 + s * 13.4, -6]);
      p.poly(light(v, 0.12), [32 + s * 6, 11.6, 32 + s * 8.6, 11.4, 32 + s * 12.8, -4, 32 + s * 13.4, -6]);
      p.poly(light(v, 0.22), [32 + s * 8.6, 11.8, 32 + s * 12.6, 12.6, 32 + s * 12.8, -1.4]);
      p.poly(light(v, 0.32), [32 + s * 10.2, 11.6, 32 + s * 12.2, 11.8, 32 + s * 12.4, 3.6]);
    }
    if (accOf(L, 'elfears')) for (const s of [-1, 1]) {
      const x = 32 + s * 13.4, e = L.earLen || 9.4;
      p.poly(P.skin, [x - s * 0.6, 28.6, x + s * e, 28.6 - e * 0.42, x + s * 1.6, 35.6, x - s * 0.6, 34.6]);
      p.poly(P.skinSh, [x + s * 0.8, 30.6, x + s * e * 0.7, 30.6 - e * 0.38, x + s * 1.6, 33.8]);
    }
    if ((v = accOf(L, 'helmet'))) {
      p.poly(v, [15.5, 23, 15.5, 11, 21.5, 4.5, 42.5, 4.5, 48.5, 11, 48.5, 23, 44, 18.5, 20, 18.5]);
      p.poly(light(v, 0.25), [20, 9, 30, 5.5, 30, 8.5, 21, 11]);
      p.rect('#e8e8f0', 15.5, 17.5, 33, 1.6);
      p.poly('#e8e8f0', [30, 4.5, 34, 4.5, 33, -1, 31, -1]);
    }
    if ((v = accOf(L, 'fxhairpin'))) {
      const gold = '#d8b048', d = dark(v, 0.3);
      for (const X of [x => x, x => 64 - x]) {
        p.poly(d, [X(31), 7, X(23), -1.6, X(20.4), 2.6, X(28), 9]);
        p.poly(v, [X(30.6), 6.4, X(23.4), -0.4, X(21.6), 2.4, X(28.2), 8]);
        p.poly(gold, [X(14.4), 9.4, X(25), 5.8, X(25.4), 7.2, X(15), 10.8]);
        p.ell(gold, X(14.4), 9.6, 2, 1.6);
        p.snap(gold, X(14.4) - 0.5, 10.4, 1, 2.4);
        p.poly(gold, [X(13), 12.6, X(15.8), 12.6, X(14.4), 15.6]);
        p.poly(v, [X(13.4), 15.4, X(15.4), 15.4, X(15.8), 22, X(13), 22]);
        p.poly(light(v, 0.3), [X(13.8), 15.4, X(14.6), 15.4, X(14.6), 21.4, X(13.6), 21.4]);
      }
      p.ell(gold, 32, 8.6, 2.6, 2);
      p.poly(gold, [32, 15.4, 33.4, 17.6, 32, 20, 30.6, 17.6]);
      p.poly('#8a3ad0', [32, 16.2, 32.8, 17.6, 32, 19.2, 31.2, 17.6]);
    }
    if ((v = accOf(L, 'talismancap'))) {
      p.ell(dark(v, 0.3), 34, 9.6, 13.4, 6.4, 0.12);
      p.ell(v, 34, 9, 12.4, 5.6, 0.12);
      p.poly(light(v, 0.25), [26, 6.4, 40, 5.4, 41, 7, 27, 8.2]);
      p.rect('#c8ccd8', 31, 7.4, 6, 1);
      p.ell('#d8b048', 23.6, 12.4, 2, 2);
      p.poly('#f0d050', [16.4, 6, 22.6, 1.4, 24.2, 9, 19.4, 10.6]);
      p.poly('#c8302a', [19, 4.6, 21.4, 3, 21.8, 4.2, 19.4, 5.8]);
      p.poly('#c8302a', [19.8, 6.8, 22.4, 5.4, 22.6, 6.6, 20.2, 8]);
      for (const X of [x => x, x => 64 - x]) { p.snap('#c8302a', X(14.6) - 0.5, 36, 1, 2.6); p.poly('#d8b048', [X(14.6), 38.4, X(17), 41, X(14.6), 43.6, X(12.2), 41]); p.poly('#5ac8e0', [X(14.6), 40, X(15.6), 41, X(14.6), 42, X(13.6), 41]); }
    }
    if ((v = accOf(L, 'hat'))) { p.ell(v, 32, 13, 17.5, 7.5); p.rect(dark(v, 0.25), 13.5, 16.5, 37, 3.2); }
    if ((v = accOf(L, 'minerhat'))) {
      p.poly(v, [15, 22, 16, 9, 23, 3.5, 41, 3.5, 48, 9, 49, 22]);
      p.rect(dark(v, 0.3), 13.5, 19.5, 37, 3);
      p.ell('#fff4c0', 32, 9, 3.4, 3); p.ell('#6a5a30', 32, 9, 4.4, 4, 0);
      p.ell('#fff8d8', 32, 9, 2.6, 2.3);
    }
  }

  function browsFemale(p, P, kind) {
    const col = P.hairDk;
    if (kind === 'stern') { p.snap(col, 22.4, 25, 2.8, 0.9); p.snap(col, 25.2, 26, 2.8, 0.9); p.snap(col, 36, 26, 2.8, 0.9); p.snap(col, 38.8, 25, 2.8, 0.9); return; }
    if (kind === 'arch') { p.snap(col, 22.4, 25.4, 5.6, 0.9); p.snap(col, 36, 24.4, 5.6, 0.9); return; }
    const y = { low: 26, high: 24.6, soft: 25 }[kind] || 25.4;
    p.snap(col, 22.4, y, 5.6, 0.9);
    p.snap(col, 36, y, 5.6, 0.9);
  }

  function browsMale(p, P, L) {
    const col = mix(P.hairDk, INK, 0.35), kind = L.mood && p.u >= 0.75 ? moodOf(L).brow : 'base';
    if (kind === 'stern') {
      p.snap(col, 21, 25.8, 4.4, 1.8); p.snap(col, 25.2, 26.8, 3.8, 1.8); p.snap(col, 27, 28, 2.4, 1.2);
      p.snap(col, 38.6, 25.8, 4.4, 1.8); p.snap(col, 35, 26.8, 3.8, 1.8); p.snap(col, 34.6, 28, 2.4, 1.2);
    } else if (kind === 'arch') {
      p.snap(col, 21, 26.4, 8, 1.8); p.snap(col, 27, 27.6, 2.4, 1.2);
      p.snap(col, 35, 25.2, 8, 1.6); p.snap(col, 41, 26.4, 2, 1);
    } else if (kind === 'base') {
      p.snap(col, 21, 26.4, 8, 1.8); p.snap(col, 35, 26.4, 8, 1.8);
      p.snap(col, 27, 27.6, 2.4, 1.2); p.snap(col, 34.6, 27.6, 2.4, 1.2);
    } else {
      const y = { low: 27, high: 25.4, soft: 26.2 }[kind] || 26.4, h = kind === 'soft' ? 1.2 : 1.8;
      p.snap(col, 21, y, 8, h); p.snap(col, 35, y, 8, h);
    }
    if (L.bangs === 'eye') p.snap(P.hair, 21, 25.4, 9, 4);
  }

  function paintVisor(p, P, L) {
    const pl = L.visor || '#1c1d24', fr = L.visorFrame || '#e8eaf0', ear = L.earCol || '#d8302e';
    for (const x of [15.6, 48.4]) { p.ell(dark(ear, 0.3), x, 31.4, 3, 3.6); p.ell(ear, x, 31, 2.6, 3.2); p.ell(pl, x, 31, 1.2, 1.6); }
    p.poly(fr, [17, 19.6, 47, 19.6, 47.6, 33, 44.4, 37, 19.6, 37, 16.4, 33]);
    p.poly(pl, [19, 21.2, 45, 21.2, 45.6, 32.6, 41, 40.8, 32, 48.6, 23, 40.8, 18.4, 32.6]);
    p.poly(light(pl, 0.18), [21, 22.8, 27.4, 22.8, 22.8, 31.4, 20.4, 30.2]);
    p.rect(light(pl, 0.1), 31.6, 22, 0.8, 24);
    if (L.closed) for (const sd of [-1, 1]) p.poly(P.eye, [32 + sd * 3.6, 31.6, 32 + sd * 9.6, 31.2, 32 + sd * 9.4, 32.2, 32 + sd * 3.8, 32.6]);
    else for (const sd of [-1, 1]) {
      p.poly(P.eye, [32 + sd * 3.4, 32.2, 32 + sd * 9.8, 29.4, 32 + sd * 9.4, 31.8, 32 + sd * 4.2, 34]);
      p.poly(P.eye2 || light(P.eye, 0.4), [32 + sd * 5, 32.2, 32 + sd * 8.4, 30.6, 32 + sd * 8, 31.6, 32 + sd * 5.4, 32.8]);
    }
  }

  function paintHead(p, P, L) {
    if (L.face === 'visor') { paintVisor(p, P, L); paintHeadHair(p, P, L); paintHeadAcc(p, P, L); return; }
    paintFace(p, P, L);
    const under = ['wisp', 'sweep', 'sidepart', 'hide', 'swoop'].includes(L.bangs);
    if (under && manFace(L) && !L.closed) browsMale(p, P, L);
    paintHeadHair(p, P, L);
    if (!under && manFace(L) && !L.closed) browsMale(p, P, L);
    paintHeadAcc(p, P, L);
  }

  function bustBackHair(p, P, L) {
    const vl = accOf(L, 'veil');
    if (vl) { p.poly(dark(vl, 0.08), [12, 64, 9, 40, 12, 20, 20, 8, 32, 4, 44, 8, 52, 20, 55, 40, 52, 64]); p.poly(vl, [14, 64, 11, 40, 14, 21, 21, 9.6, 32, 5.6, 43, 9.6, 50, 21, 53, 40, 50, 64]); for (let y = 30; y < 64; y += 4) { p.snap(dark(vl, 0.14), 10.6 + (y - 30) * 0.02, y, 0.8, 0.8); p.snap(dark(vl, 0.14), 53 - (y - 30) * 0.06, y, 0.8, 0.8); } }
    const c = P.hairSh;
    const draw = col => {
      switch (L.back) {
        case 'long': case 'hime': case 'flow': p.poly(col, [13, 22, 51, 22, 55, 44, 58.5, 64, 5.5, 64, 9, 44]); break;
        case 'shoulder': p.poly(col, [14, 22, 50, 22, 53, 40, 51, 54, 45, 56, 19, 56, 13, 54, 11, 40]); break;
        case 'wave': p.poly(col, [12.4, 22, 51.6, 22, 55.6, 36, 54, 44, 57.4, 52, 56, 58, 59, 64, 5, 64, 8, 58, 6.6, 52, 10, 44, 8.4, 36]); break;
        case 'layer': p.poly(col, [13, 22, 51, 22, 54.4, 38, 56.6, 50, 60.4, 58.6, 57.2, 57.4, 59, 64, 5, 64, 6.8, 57.4, 3.6, 58.6, 7.4, 50, 9.6, 38]); break;
        case 'flick': p.poly(col, [14, 22, 50, 22, 51.8, 34, 54, 40, 57.8, 43.4, 54.6, 44.8, 56, 50, 59.8, 53.4, 54.6, 53.8, 52.4, 56.4, 49.6, 51.6, 14.4, 51.6, 11.6, 56.4, 9.4, 53.8, 4.2, 53.4, 8, 50, 9.4, 44.8, 6.2, 43.4, 10, 40, 12.2, 34]); break;
        case 'tail': p.poly(col, [14, 22, 50, 22, 52, 36, 48, 44, 16, 44, 12, 36]); break;
        case 'hightail':
          p.poly(col, [24.4, 12, 27, 5.2, 32.6, 2, 38.6, 3, 41.4, 7.6, 38.6, 12]);
          p.poly(col, [27, 5.4, 21, 7.4, 15, 13.6, 10, 24, 6, 38, 3, 52, 2, 64, 9.4, 64, 9.8, 52, 13, 38, 17.6, 26, 23.4, 16]);
          break;
        case 'braids': p.poly(col, [14, 22, 50, 22, 50, 36, 14, 36]); for (const X of [x => x, x => 64 - x]) for (let i = 0; i < 4; i++) { const y = 40 + i * 6.4, x = X(10 - i * 1.6); p.ell(col, x, y, 4.4, 3.6); if (P.tips && i > 1) p.ell(mix(col, P.tips, 0.4), x + 1, y + 1, 1.4, 2); p.rect(i % 2 ? '#c42a38' : dark(col, 0.25), x - 3, y + 3, 6, 1); } break;
        case 'twinwave': p.poly(col, [14, 22, 50, 22, 50, 36, 14, 36]); for (const X of [x => x, x => 64 - x]) p.poly(col, [X(16), 20, X(22), 26, X(19), 36, X(22), 46, X(18), 56, X(20), 64, X(1), 64, X(5), 54, X(2), 44, X(6), 34, X(5), 26, X(10), 20]); break;
        case 'twin': p.poly(col, [14, 22, 50, 22, 50, 36, 14, 36]); p.poly(col, [16, 24, 21, 27, 18, 44, 13, 64, 5, 64, 9, 42]); p.poly(col, [48, 24, 43, 27, 46, 44, 51, 64, 59, 64, 55, 42]); break;
        case 'side': { const m = a => (L.sideR ? a.map((x, i) => (i % 2 ? x : 64 - x)) : a); p.poly(col, m([16, 22, 48, 22, 49, 34, 46, 40, 18, 40, 15, 34])); p.poly(P.hair, m([23, 11, 13, 4, 4, 13, 1.5, 30, 5, 45, 10.5, 52, 10, 36, 15, 20])); p.poly(c, m([9, 14, 4, 13, 1.5, 30, 5, 45, 7, 30])); break; }
        case 'nape': p.poly(col, [16, 22, 48, 22, 49, 35, 46, 43, 18, 43, 15, 35]); p.poly(col, [44, 35, 50.5, 38, 49.5, 47, 45.5, 44]); break;
        case 'wolf': p.poly(col, [16, 22, 48, 22, 49.6, 34, 48.6, 44, 47, 51, 44.2, 47.8, 42.6, 52.4, 21.4, 52.4, 19.8, 47.8, 17, 51, 15.4, 44, 14.4, 34]); break;
        default: p.poly(col, [16, 22, 48, 22, 49, 34, 46, 40, 18, 40, 15, 34]);
      }
    };
    draw(c);
    const ty = L.tipsAt || (L.tipsFade ? 44 : 40);
    if (P.tips && L.tipsFade) p.band(ty - 6, ty, () => draw(mix(c, dark(P.tips, 0.18), 0.5)));
    if (P.tips) p.clip(ty, () => draw(dark(P.tips, 0.18)));
  }

  function bustBody(p, P, L) {
    const male = isMale(L);
    if (L.coat === 'hoodcape') bustHoodBack(p, P, L);
    if (male) {
      p.rect(P.skin, 26.4, 37, 11.2, 13);
      p.poly(P.skinSh, [26.4, 37, 37.6, 37, 37.6, 43.4, 32, 47.4, 26.4, 43.4]);
      p.poly(P.skinSh, [34.6, 43, 37.6, 42, 37.6, 50, 35.2, 50]);
      p.snap(mix(P.skinSh, P.skinDk, 0.4), 31.3, 45.8, 1.5, 1.6);
    } else {
      p.rect(P.skin, 27.8, 38, 8.4, 12);
      p.poly(P.skinSh, [27.8, 38, 36.2, 38, 36.2, 44, 32, 46.8, 27.8, 44]);
    }
    const sh = male ? [0, 64, 0.5, 55, 6.5, 50.2, 19.5, 48.4, 44.5, 48.4, 57.5, 50.2, 63.5, 55, 64, 64] : [2, 64, 5, 55, 15, 50.5, 25, 48.6, 39, 48.6, 49, 50.5, 59, 55, 62, 64];
    if (L.coat === 'tabard') return bustTabard(p, P, L, sh);
    if (L.coat === 'robe') return bustRobe(p, P, L, sh);
    if (L.coat === 'shrug') return bustShrug(p, P, L, sh);
    if (L.coat === 'split') return bustSplit(p, P, L, sh);
    if (L.coat === 'cape') return bustCape(p, P, L, sh);
    if (L.coat === 'hoodcape') return bustHoodcape(p, P, L, sh);
    if (L.coat === 'memovest') return bustMemovest(p, P, L, sh);
    if (L.coat === 'sleeveless') return bustSleeveless(p, P, L, sh);
    if (L.coat === 'openvest') return bustOpenvest(p, P, L, sh);
    if (L.coat === 'crusader') return bustCrusader(p, P, L, sh);
    if (L.coat === 'bolero') return bustBolero(p, P, L, sh);
    if (L.coat === 'half') return bustHalf(p, P, L, sh);
    if (L.coat === 'offcoat') return bustOffcoat(p, P, L, sh);
    if (L.coat === 'crop') return bustCrop(p, P, L, sh);
    if (L.coat === 'cut') return bustCut(p, P, L, sh);
    if (L.coat === 'doll') return bustDoll(p, P, L, sh);
    if (L.coat === 'wrap') return bustWrap(p, P, L, sh);
    if (L.coat === 'leo') return bustLeo(p, P, L, sh);
    if (L.coat === 'bodice') return bustBodice(p, P, L, sh);
    if (L.coat === 'frost') return bustFrost(p, P, L, sh);
    if (L.coat === 'bikini') return bustBikini(p, P, L, sh);
    if (L.coat === 'bunnyvest') return bustBunnyvest(p, P, L, sh);
    if (L.coat === 'haori') return bustHaori(p, P, L, sh);
    if (L.coat === 'maid') return bustMaid(p, P, L, sh);
    if (L.coat === 'overalls') return bustOveralls(p, P, L, sh);
    if (L.coat === 'hoodie') return bustHoodie(p, P, L, sh);
    if (L.coat === 'valk') return bustValk(p, P, L, sh);
    if (L.coat === 'trashcan') return bustTrashcan(p, P, L);
    if (L.coat === 'bridal') {
      p.poly(P.skin, sh);
      p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
      const bod = [16.6, 64, 18, 57.4, 24.4, 55.2, 29.6, 56.6, 32, 59.4, 34.4, 56.6, 39.6, 55.2, 46, 57.4, 47.4, 64];
      p.poly(P.top, bod);
      p.clipPoly(bod, () => { p.poly(dark(P.top, 0.08), [38, 52, 48, 52, 48, 64, 40, 64]); for (let x = 19; x < 46; x += 2.6) p.ell(light(P.top, 0.5), x, 56.4 + Math.abs(x - 32) * 0.03, 1, 0.7); for (const x of [26, 38]) p.rect(dark(P.top, 0.1), x, 59, 0.6, 5); });
      return;
    }
    if (L.coat === 'raglan') return bustRaglan(p, P, L, sh);
    if (L.coat === 'volt') return bustVolt(p, P, L, sh);
    if (L.coat === 'gyaru') return bustGyaru(p, P, L, sh);
    if (L.coat === 'kid') return bustKid(p, P, L, sh);
    if (L.coat === 'heartcorset') return bustHeartCorset(p, P, L, sh);
    if (L.coat === 'suit') return bustSuit(p, P, L, sh);
    if (L.coat === 'avia') return bustAvia(p, P, L, sh);
    if (L.coat === 'ranger') return bustRanger(p, P, L, sh);
    if (L.collar === 'bare') {
      p.poly(P.skin, sh);
      p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.4, 28, 50.4]);
      p.poly(P.inner, [11, 64, 13, 57.5, 20, 55.5, 27, 58, 32, 56.5, 37, 58, 44, 55.5, 51, 57.5, 53, 64]);
      p.poly(P.innerSh, [44, 55.5, 51, 57.5, 53, 64, 46, 64]);
      if (L.coat === 'jacket') {
        p.poly(P.top, [2, 64, 5, 55, 12.5, 52, 16, 64]);
        p.poly(P.top, [62, 64, 59, 55, 51.5, 52, 48, 64]);
        p.poly(P.trim, [12.5, 52, 14, 52, 17.5, 64, 16, 64]);
        p.poly(P.trim, [51.5, 52, 50, 52, 46.5, 64, 48, 64]);
      }
      return;
    }
    p.poly(P.top, sh);
    p.poly(P.topSh, male ? [64, 64, 63.5, 55, 57.5, 50.2, 54, 51.6, 52.5, 64] : [62, 64, 59, 55, 53, 52, 51.5, 64]);
    if (male) { p.poly(P.topHi, [2, 56, 7, 51, 13, 49.6, 8, 53.6]); p.poly(P.topSh, [9, 64, 12, 57, 14, 64]); }
    switch (L.collar) {
      case 'v':
        p.poly(P.inner, [25.5, 48.6, 38.5, 48.6, 32, 61.5]);
        p.poly(P.trim, [23.8, 48.6, 26.4, 48.6, 32.4, 61.5, 31.4, 63.5]);
        p.poly(P.trim, [37.6, 48.6, 40.2, 48.6, 32.6, 63.5, 31.6, 61.5]);
        break;
      case 'high':
        p.poly(P.inner, [26.2, 39.5, 37.8, 39.5, 38.8, 50.5, 25.2, 50.5]);
        p.poly(P.innerSh, [34, 39.5, 37.8, 39.5, 38.8, 50.5, 35, 50.5]);
        p.rect(P.trim, 31, 50.5, 2, 13.5);
        break;
      case 'hood':
        p.poly(P.inner, [18.5, 51, 24.5, 46.3, 39.5, 46.3, 45.5, 51, 41.5, 58, 39, 64, 25, 64, 22.5, 58]);
        p.poly(P.innerSh, [24.5, 46.3, 39.5, 46.3, 37, 49.6, 27, 49.6]);
        p.poly(P.innerSh, [39.5, 52, 45.5, 51, 41.5, 58, 39, 64, 37, 64]);
        p.poly(P.trim, [18.5, 51, 20.6, 51, 24.4, 64, 22.3, 64]);
        p.poly(P.trim, [43.4, 51, 45.5, 51, 41.7, 64, 39.6, 64]);
        break;
      case 'fur':
        p.poly(P.inner, [26, 48.6, 38, 48.6, 32, 58]);
        p.ell(P.trim, 32, 50.5, 16, 4.5);
        for (let i = 0; i < 8; i++) p.ell(i % 2 ? P.trim : light(P.trim, 0.3), 16.5 + i * 4.4, 51.5 + (i % 2) * 0.8, 2.8, 2.6);
        break;
      case 'frill':
        p.poly(P.inner, [24, 45, 40, 45, 45.5, 51, 39.5, 53.5, 35.8, 51, 32, 53.8, 28.2, 51, 24.5, 53.5, 18.5, 51]);
        p.poly(P.innerSh, [24, 45, 40, 45, 38, 47.5, 26, 47.5]);
        break;
      case 'scoop': {
        p.poly(P.skin, [20.4, 48.6, 43.6, 48.6, 38, 54.6, 32, 59.4, 26, 54.6]);
        p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.6, 28, 50.6]);
        ribbon(p, P.trim, [20.4, 48.6, 26, 54.6, 32, 59.4], 1.6);
        ribbon(p, P.trim, [43.6, 48.6, 38, 54.6, 32, 59.4], -1.6);
        p.poly(dark(P.top, 0.35), [31.2, 59.6, 32.8, 59.6, 32.6, 64, 31.4, 64]);
        const cord = L.lace || '#3a1a1c';
        for (const y of [59.8, 62]) { p.poly(cord, [29.8, y, 31, y, 34.2, y + 1.8, 33, y + 1.8]); p.poly(cord, [34.2, y, 33, y, 29.8, y + 1.8, 31, y + 1.8]); }
        break;
      }
      case 'bow':
        p.poly(P.inner, [24.5, 47.5, 39.5, 47.5, 44, 64, 20, 64]);
        p.poly(P.trim, [20, 64, 22.5, 52, 24.5, 64]);
        p.poly(P.trim, [44, 64, 41.5, 52, 39.5, 64]);
        break;
      case 'shirt':
        p.poly(P.skin, [27.2, 48.4, 36.8, 48.4, 32, 53.2]);
        p.poly(P.innerSh, [23.4, 48, 27.4, 48.2, 32, 53.4, 28.4, 56]);
        p.poly(dark(P.inner, 0.3), [40.6, 48, 36.6, 48.2, 32, 53.4, 35.6, 56]);
        break;
      default:
        p.poly(P.inner, [27, 48.6, 37, 48.6, 32, 53]);
    }
  }

  function bustTabard(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.6, 28, 50.6]);
    const bell = accOf(L, 'bellsleeves');
    if (bell) for (const s of [-1, 1]) {
      const x = 32 + s * 30;
      p.poly(bell, [x, 64, x - s * 1.4, 58, x - s * 6, 55.4, x - s * 11.4, 57, x - s * 12.4, 64]);
      p.poly(dark(bell, 0.14), [x - s * 8.6, 56.2, x - s * 11.4, 57, x - s * 12.4, 64, x - s * 9.4, 64]);
      p.poly(P.top, [x - s * 1.2, 60.6, x - s * 11.8, 60.6, x - s * 12, 62, x - s * 1, 62]);
    }
    p.poly(P.inner, [26.4, 40, 37.6, 40, 38.4, 49.4, 25.6, 49.4]);
    p.poly(dark(P.inner, 0.3), [26.4, 41.4, 37.6, 41.4, 37.6, 42.4, 26.4, 42.4]);
    p.poly(P.inner, [24, 48.6, 40, 48.6, 40, 64, 24, 64]);
    p.poly(P.top, [17.4, 51, 24.6, 48.4, 29.6, 56.4, 32, 59.4, 34.4, 56.4, 39.4, 48.4, 46.6, 51, 48, 64, 16, 64]);
    p.poly(P.topSh, [39.4, 48.4, 46.6, 51, 48, 64, 41.6, 64, 40.4, 55]);
    p.poly(P.trim, [24.6, 48.4, 26.2, 48.4, 32, 57.8, 32, 59.4, 29.6, 56.4]);
    p.poly(P.trim, [39.4, 48.4, 37.8, 48.4, 32, 57.8, 32, 59.4, 34.4, 56.4]);
    p.ell('#f4f4fa', 32, 61.8, 2.8, 1.5);
    p.ell('#f4f4fa', 29.6, 62.6, 1.4, 1.1);
    p.ell('#f4f4fa', 34.4, 62.6, 1.4, 1.1);
  }

  function bustShrug(p, P, L, sh) {
    p.poly(P.inner, sh);
    p.poly(P.innerSh, [49, 50.5, 59, 55, 62, 64, 51, 64, 48, 56]);
    p.poly(P.innerSh, [29, 60, 30.4, 60, 30.6, 64, 29.2, 64]);
    const shoulder = L.shoulder || light(P.top, 0.3);
    for (const s of [-1, 1]) {
      const X = x => 32 + s * (32 - x);
      const pts = [X(1.6), 64, X(3), 58, X(6.6), 54.2, X(12.4), 52.8, X(17.2), 55.4, X(18.8), 64];
      p.poly(P.top, pts);
      p.clipPoly(pts, () => {
        p.poly(shoulder, [X(0), 52, X(20), 52, X(20), 56.4, X(13), 57.6, X(6), 57.2, X(0), 58.6]);
        p.poly(mix(shoulder, P.top, 0.5), [X(0), 58.6, X(6), 57.2, X(13), 57.6, X(20), 56.4, X(20), 57.8, X(13), 59, X(6), 58.6, X(0), 60]);
        p.poly(dark(P.top, 0.22), s > 0 ? [X(1.6), 64, X(3), 58, X(5.6), 56, X(7), 64] : [X(16), 56, X(17.2), 55.4, X(18.8), 64, X(16.6), 64]);
        p.poly(dark(P.top, 0.3), [X(9.4), 60, X(10.4), 60, X(11.4), 64, X(10.2), 64]);
      });
      p.snap('#d8b050', X(s > 0 ? 9.4 : 10.6), 58.6, 1.4, 1.4);
    }
    p.poly(P.innerSh, [20.6, 48.6, 43.4, 48.6, 51.6, 53.6, 46.2, 59, 38.6, 56.4, 32, 61, 25.4, 56.4, 17.8, 59, 12.4, 53.6]);
    p.poly(P.inner, [21.2, 48.6, 42.8, 48.6, 50.4, 53.4, 45.6, 57.8, 38.4, 55.2, 32, 59.6, 25.6, 55.2, 18.4, 57.8, 13.6, 53.4]);
    p.poly(mix(P.inner, P.innerSh, 0.5), [42.8, 48.6, 50.4, 53.4, 45.6, 57.8, 44, 53]);
    p.poly(P.skin, [26.6, 48.6, 37.4, 48.6, 32, 55.8]);
    p.poly(P.skinSh, [26.6, 48.6, 37.4, 48.6, 35.8, 50.6, 28.2, 50.6]);
    p.ell(dark('#d8b050', 0.25), 32, 62.4, 1.6, 1.6); p.ell('#e8c460', 31.8, 62.2, 1.2, 1.2);
  }

  function bustSplit(p, P, L, sh) {
    const lin = L.lining || P.trim;
    p.poly(P.top, sh);
    p.poly(P.topSh, [64, 64, 63.5, 55, 57.5, 50.2, 54, 51.6, 52.5, 64]);
    p.poly(P.topHi, [3, 57, 8, 51.6, 13, 50.4, 8, 54.4]);
    p.poly(dark(P.top, 0.12), [9, 64, 12, 57, 14, 64]);
    p.poly(P.inner, [22.6, 48.4, 41.4, 48.4, 45.4, 64, 18.6, 64]);
    p.poly(light(P.inner, 0.08), [22.6, 48.4, 27, 48.4, 25, 64, 18.6, 64]);
    const edge = L.edge || lin;
    p.poly(edge, [20.4, 48.4, 22.8, 48.4, 18.8, 64, 16.2, 64]);
    p.poly(edge, [43.6, 48.4, 41.2, 48.4, 45.2, 64, 47.8, 64]);
    p.poly(dark(edge, 0.3), [43.6, 48.4, 44.6, 48.4, 48.8, 64, 47.8, 64]);
    const sw = accOf(L, 'swirl');
    if (sw) for (const X of [x => x, x => 64 - x]) { p.poly(sw, [X(4), 60, X(8), 54, X(13), 52.6, X(11), 54.6, X(8.6), 58, X(10.6), 61, X(7.4), 63]); p.poly(sw, [X(12), 58, X(15), 56, X(15.6), 57.4, X(13.4), 59.6]); }
    if (L.collar === 'hood') {
      p.poly(lin, [14.6, 50.4, 22, 47, 24.6, 49, 19.4, 52.4]);
      p.poly(lin, [49.4, 50.4, 42, 47, 39.4, 49, 44.6, 52.4]);
      p.poly(P.innerSh, [21, 48.4, 43, 48.4, 44.6, 51.4, 40, 58, 32, 60.6, 24, 58, 19.4, 51.4]);
      p.poly(P.inner, [22, 48.4, 42, 48.4, 43.2, 51, 39.2, 56.6, 32, 59, 24.8, 56.6, 20.8, 51]);
      p.poly(P.skin, [26.4, 48.4, 37.6, 48.4, 32, 53.4]);
      p.poly(P.skinSh, [26.4, 48.4, 37.6, 48.4, 36.2, 50, 27.8, 50]);
      p.poly(P.innerSh, [27, 55.4, 37, 55.4, 32, 57.6]);
      return;
    }
    const neck = L.neck || P.inner;
    p.poly(neck, [25.8, 38.6, 38.2, 38.6, 39, 50.2, 25, 50.2]);
    p.poly(light(neck, 0.12), [25.8, 38.6, 28.6, 38.6, 28.2, 50.2, 25, 50.2]);
    p.poly(dark(neck, 0.3), [25, 49.4, 39, 49.4, 39, 50.6, 25, 50.6]);
  }

  function frostFlower(p, x, y, r, col, core) {
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5; p.ell(col, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.5); }
    p.ell(core, x, y, r * 0.38, r * 0.38);
  }

  function bustFrost(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    const fade = L.fade || P.top, bow = L.bow || P.trim, ds = accOf(L, 'detsleeves');
    if (ds) for (const X of [x => x, x => 64 - x]) {
      p.poly(ds, [X(0), 64, X(1.2), 59.6, X(7.6), 57.2, X(13.2), 58.6, X(14.4), 64]);
      p.poly(L.band || P.trim, [X(1), 60.6, X(7.6), 58.2, X(13.4), 59.6, X(13.6), 61, X(7.6), 59.6, X(1.2), 62]);
      for (let i = 0; i < 4; i++) p.ell(L.cuff || P.top, X(2.6 + i * 3.4), 58.8 - (i === 1 || i === 2 ? 0.8 : 0), 2, 1.4);
    }
    for (const sd of [-1, 1]) p.poly(P.trim, [32 + sd * 2.6, 49, 32 + sd * 4, 49, 32 + sd * 8.4, 57.4, 32 + sd * 6.8, 57.8]);
    const bod = [17.2, 64, 18.4, 58.6, 24.6, 56.2, 29.4, 57.6, 32, 60.6, 34.6, 57.6, 39.4, 56.2, 45.6, 58.6, 46.8, 64];
    p.poly(P.top, bod);
    p.clipPoly(bod, () => {
      p.band(61.4, 64, () => p.poly(mix(P.top, fade, 0.55), bod));
      p.poly(dark(P.top, 0.1), [37.6, 54, 48, 54, 48, 64, 40.4, 64]);
      for (const sd of [-1, 1]) p.poly(light(P.trim, 0.25), [32 + sd * 1, 61, 32 + sd * 7.4, 64, 32 + sd * 5.4, 64, 32 + sd * 0.4, 62]);
    });
    const col = L.neck || P.top;
    p.poly(col, [24.6, 45.4, 32, 47.4, 39.4, 45.4, 41.6, 49.2, 36.6, 51.6, 32, 49.6, 27.4, 51.6, 22.4, 49.2]);
    p.poly(dark(col, 0.14), [32, 49.6, 36.6, 51.6, 41.6, 49.2, 40.6, 48.4, 36.4, 50.2, 32, 48.6]);
    p.rect(bow, 27.4, 43.6, 9.2, 2);
    p.poly(bow, [32, 45.2, 27.4, 42.2, 27.8, 48.2]); p.poly(bow, [32, 45.2, 36.6, 42.2, 36.2, 48.2]);
    p.poly(dark(bow, 0.25), [32, 45.2, 30.4, 49.6, 32, 50.2, 33.6, 49.6]);
    p.ell(light(bow, 0.35), 32, 45.2, 1.4, 1.4);
    frostFlower(p, 32, 61, 3.6, L.flower || '#f4f0fc', L.flowerCore || '#9ad4f4');
  }

  function bustBodice(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    if (L.neck !== 'none') {
      const neck = L.neck || P.top;
      p.poly(neck, [26.2, 40, 37.8, 40, 38.6, 47.6, 32, 50, 25.4, 47.6]);
      p.poly(light(neck, 0.18), [26.2, 40, 37.8, 40, 37.8, 41.4, 26.2, 41.4]);
      for (let x = 27; x < 38; x += 2.2) p.ell('#f2eef0', x, 47.6, 1.1, 0.9);
    }
    p.poly(P.top, [19, 64, 20, 57, 25, 55, 32, 57.6, 39, 55, 44, 57, 45, 64]);
    p.poly(dark(P.top, 0.2), [38, 55.4, 44, 57, 45, 64, 40.4, 64]);
    p.poly('#f2eef0', [27.6, 56, 32, 57.6, 30, 64, 26, 64]);
    for (const y of [58.4, 61.6]) p.rect(dark(P.top, 0.35), 21, y, 22, 0.9);
    const rs = accOf(L, 'redsleeve');
    if (rs) for (const X of [x => x, x => 64 - x]) { p.poly(rs, [X(2), 64, X(3), 58, X(10), 57, X(13), 64]); p.poly('#f2eef0', [X(3), 58, X(10), 57, X(10.4), 58.6, X(3.2), 59.6]); }
  }

  function bustMemovest(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(P.inner, [20, 64, 21, 52, 25.4, 48.4, 38.6, 48.4, 43, 52, 44, 64]);
    p.poly(dark(P.inner, 0.25), [38.6, 48.4, 43, 52, 44, 64, 39.4, 64]);
    p.poly(light(P.inner, 0.18), [22, 56, 29, 53, 30, 56, 23.4, 59]);
    const neck = L.neck || P.inner;
    p.poly(neck, [25.4, 38.6, 38.6, 38.6, 40.6, 49, 36.4, 52.6, 27.6, 52.6, 23.4, 49]);
    p.poly(light(neck, 0.15), [25.4, 38.6, 28.4, 38.6, 27.6, 52.6, 23.4, 49]);
    for (const X of [x => x, x => 64 - x]) {
      p.poly(P.top, [X(10.6), 64, X(14.6), 51.4, X(19.6), 49, X(23.4), 51, X(22.6), 64]);
      p.poly(L.lining, [X(21.2), 52, X(23.4), 51, X(22.6), 64, X(21), 64]);
      p.poly(dark(P.top, 0.16), [X(14.6), 51.4, X(16.4), 51, X(12.4), 64, X(10.6), 64]);
    }
    p.poly(L.lining, [29.4, 56, 34.6, 56, 32, 64]); p.poly(light(L.lining, 0.4), [30.4, 56.6, 32, 56.6, 32, 61]);
  }

  function bustLeo(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(P.top, [19.6, 64, 20.6, 55.6, 25.6, 52.4, 32, 55, 38.4, 52.4, 43.4, 55.6, 44.4, 64]);
    p.poly(light(P.top, 0.14), [24, 54, 29.6, 54.6, 32, 58.6, 27.6, 59]);
    p.poly(P.top, [32, 57.4, 26.4, 54.6, 27.4, 60, 32, 59]); p.poly(P.top, [32, 57.4, 37.6, 54.6, 36.6, 60, 32, 59]);
    for (const sd of [-1, 1]) p.poly('#1e1c28', [32 + sd * 3.2, 47.6, 32 + sd * 4.2, 47.6, 32 + sd * 8.4, 54, 32 + sd * 7.4, 54]);
    p.poly('#1e1c28', [2.4, 64, 4.6, 56.6, 10, 54.6, 14, 57, 12.6, 64]);
    p.poly('#f4f4f8', [3, 58.6, 6.4, 54.8, 10.6, 55.4, 7.6, 59.6]);
  }

  function bustWrap(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(P.top, [19, 64, 20.4, 54, 25.4, 49.4, 38.6, 49.4, 43.6, 54, 45, 64]);
    p.poly(P.innerSh, [38.6, 49.4, 43.6, 54, 45, 64, 40.6, 64]);
    p.poly(P.innerSh, [25.4, 49.4, 27.4, 49.4, 40, 64, 37.6, 64]);
    p.poly(P.top, [3, 64, 4, 58.6, 9.4, 57.2, 14.4, 59, 13.6, 64]);
    p.poly(P.innerSh, [3, 64, 4, 58.6, 5.6, 58.2, 5, 64]);
    for (const y of [59.6, 62.2]) p.poly('#d8b050', [4, y, 13.8, y - 0.6, 14, y + 0.4, 4.2, y + 1]);
    p.poly(P.trim, [50, 64, 51, 58.6, 60.4, 57.6, 61.4, 64]);
    const neck = L.neck || P.inner;
    p.poly(neck, [26, 39.6, 38, 39.6, 38.6, 49.8, 31.6, 51.4, 25.4, 49.8]);
    p.poly(light(neck, 0.14), [26, 39.6, 28.6, 39.6, 28.2, 49.8, 25.4, 49.8]);
  }

  function bustDoll(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.6, 28, 50.6]);
    p.poly(P.inner, [16, 64, 18, 55.6, 26, 54.6, 32, 57.6, 38, 54.6, 46, 55.6, 48, 64]);
    p.poly(P.innerSh, [40, 55.2, 46, 55.6, 48, 64, 42, 64]);
    const dm = accOf(L, 'diamonds');
    if (dm) for (const [x, y] of [[22, 60], [32, 62], [42, 60]]) p.poly(dm, [x, y - 2, x + 1.8, y, x, y + 2, x - 1.8, y]);
    for (const X of [x => x, x => 64 - x]) {
      p.poly(P.top, [X(2), 64, X(3.6), 57, X(9), 55.6, X(19), 55, X(23.4), 64]);
      p.poly(light(P.top, 0.1), [X(18.6), 55, X(20.2), 55, X(24.6), 64, X(23), 64]);
      const fr = accOf(L, 'shoulderfrill');
      if (fr) for (let i = 0; i < 5; i++) p.ell(fr, X(4.6 + i * 3.2), 55.4 - (i % 2) * 0.6, 1.8, 1.4);
    }
  }

  function bustCut(p, P, L, sh) {
    p.poly(P.inner, sh);
    p.poly(light(P.inner, 0.08), [0, 64, 0.5, 55, 6.5, 50.2, 14, 49, 12, 64]);
    p.poly(P.top, [0, 64, 0.5, 55, 6.5, 50.2, 19.5, 48.4, 27, 48.4, 30.6, 56, 33.4, 64]);
    p.poly(dark(P.top, 0.14), [21, 52, 27, 48.4, 30.6, 56, 33.4, 64, 28.6, 64, 26, 56]);
    p.poly(P.topSh, [8, 64, 11.6, 57, 13.4, 64]);
    p.poly(P.top, [40, 48.4, 47, 48.4, 50.6, 52, 44.6, 64, 41, 64, 41.6, 56]);
    p.poly(dark(P.top, 0.14), [47, 48.4, 50.6, 52, 46.6, 58, 45.4, 54]);
    const neck = L.neck || P.inner;
    p.poly(neck, [26, 38.6, 38, 38.6, 38.8, 50.2, 25.2, 50.2]);
    p.poly(light(neck, 0.12), [26, 38.6, 28.8, 38.6, 28.4, 50.2, 25.2, 50.2]);
    p.rect('#e8e8ec', 31.4, 39.4, 1.2, 6);
  }

  function bustCrop(p, P, L, sh) {
    p.poly(P.top, sh);
    p.poly(P.topSh, [62, 64, 59, 55, 53, 52, 51.5, 64]);
    for (const X of [x => x, x => 64 - x]) { p.ell(light(P.top, 0.12), X(8), 59, 5.6, 4.6); p.ell(P.top, X(8.6), 60, 5, 4); }
    p.poly(P.skin, [22, 49, 42, 49, 42, 64, 22, 64]);
    p.poly(P.inner, [21, 64, 22, 54, 30, 50.6, 44, 51.6, 43, 64]);
    p.poly(dark(P.inner, 0.12), [37, 51.2, 44, 51.6, 43, 64, 39, 64]);
    p.poly('#1e1c24', [27, 49, 29, 49, 30.4, 51, 28.6, 52]);
    p.poly('#b8bcd8', [28, 58, 36, 58, 35, 61, 29, 61]); p.snap('#5a6ae0', 30.6, 58.6, 3, 1);
    for (const X of [x => x, x => 64 - x]) {
      p.poly(L.lining, [X(14.6), 51, X(19.6), 50, X(23.4), 64, X(19), 64]);
      p.poly(P.top, [X(4), 64, X(5), 56, X(14), 51, X(17.4), 51, X(20), 64]);
      p.poly(L.trim, [X(13), 48.4, X(22), 46, X(24.6), 49.4, X(19.6), 51.6, X(14.6), 52.6]);
      for (let i = 0; i < 4; i++) p.ell(L.trim, X(14 + i * 2.6), 48.8 - i * 0.6, 2, 1.8);
    }
    p.ell('#d8dce4', 51, 58.6, 2.2, 2.2); p.ell('#e888c0', 51, 58.6, 1.2, 1.2);
  }

  function bustOffcoat(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(P.innerSh, [16.6, 64, 18, 52, 24.4, 48.6, 39.6, 48.6, 46, 52, 47.4, 64]);
    p.poly(P.inner, [17.4, 64, 18.8, 52.4, 24.8, 49.4, 39.2, 49.4, 45.2, 52.4, 46.6, 64]);
    p.poly(P.innerSh, [42, 52, 45.2, 52.4, 46.6, 64, 43, 64]);
    p.poly(P.inner, [26.2, 40.4, 37.8, 40.4, 38.8, 49.4, 25.2, 49.4]);
    p.poly(P.innerSh, [34, 40.4, 37.8, 40.4, 38.8, 49.4, 35, 49.4]);
    for (const X of [x => x, x => 64 - x]) {
      p.poly(L.lining, [X(1.6), 64, X(2.4), 58.4, X(8), 56.6, X(12.6), 58.6, X(12), 64]);
      p.poly(P.top, [X(1.6), 64, X(2.2), 60, X(7.4), 57.6, X(12.2), 59.6, X(13.4), 64]);
      p.poly(P.innerSh, [X(6), 59, X(7), 58.6, X(8.6), 64, X(7.4), 64]);
    }
  }

  function bustHalf(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.6, 28, 50.6]);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    const bs = accOf(L, 'blacksleeve');
    if (bs) { p.poly(bs, [50.4, 58, 57.6, 56, 62, 60, 62.6, 64, 51.6, 64]); p.rect('#c8ccd4', 52, 60.4, 9.6, 0.9); }
    p.poly(P.inner, [32, 56, 37, 55, 44.6, 56.4, 46, 64, 32, 64]);
    for (let x = 33.4; x < 45; x += 2.4) p.ell(light(P.inner, 0.12), x, 56, 1.4, 1);
    p.poly(dark(P.inner, 0.25), [38, 58, 39, 58, 40, 64, 38.6, 64]);
    p.poly(P.innerSh, [16, 64, 18.4, 55, 24.6, 51.4, 30.4, 54.6, 33.4, 64]);
    p.poly(P.top, [17, 64, 19.2, 55.4, 24.6, 52.2, 30, 55.2, 32.4, 64]);
    p.poly(P.innerSh, [26.6, 54, 30, 55.2, 32.4, 64, 30.6, 64]);
    p.poly(P.top, [2, 64, 4.4, 57.6, 9.4, 55, 13, 57.4, 11.4, 64]);
    p.poly(P.innerSh, [9.4, 55, 13, 57.4, 11.4, 64, 9.4, 64]);
  }

  function bustBolero(p, P, L, sh) {
    p.poly(P.top, sh);
    p.poly(P.topSh, [49, 50.5, 59, 55, 62, 64, 52, 64, 47.6, 54]);
    for (const X of [x => x, x => 64 - x]) {
      p.poly(P.innerSh, [X(4), 60, X(8), 55.4, X(12.6), 54.6, X(10), 58.6, X(6.6), 64, X(4.2), 64]);
      p.poly(P.trim, [X(14.6), 51, X(17.4), 50.6, X(19.6), 64, X(17), 64]);
    }
    p.poly(P.inner, [21.6, 64, 22.8, 53, 27, 49.4, 37, 49.4, 41.2, 53, 42.4, 64]);
    p.poly(light(P.inner, 0.1), [23.2, 64, 24, 54.6, 29.6, 52, 30.6, 64]);
    p.poly(dark(P.inner, 0.3), [27, 58, 32, 61.4, 37, 58, 37, 59.2, 32, 62.6, 27, 59.2]);
    const neck = L.neck || P.inner;
    p.poly(neck, [26.2, 39.4, 37.8, 39.4, 38.4, 50, 25.6, 50]);
    p.poly(light(neck, 0.14), [26.2, 39.4, 28.8, 39.4, 28.4, 50, 25.6, 50]);
    p.rect('#d8b050', 26.2, 39.4, 11.6, 0.8);
  }

  function bustCape(p, P, L, sh) {
    const lin = L.lining || P.trim;
    if (L.sleeve) {
      p.poly(L.sleeve, sh);
      p.poly(dark(L.sleeve, 0.14), [49, 50.5, 59, 55, 62, 64, 52, 64]);
      for (const x of [26, 38]) p.poly(dark(L.sleeve, 0.12), [x, 54, x + 0.8, 54, x + 1.4, 64, x + 0.6, 64]);
      p.poly(dark(L.sleeve, 0.12), [31.6, 53, 32.4, 53, 32.4, 64, 31.6, 64]);
      p.poly(P.skin, [27.4, 40, 36.6, 40, 37, 48.6, 27, 48.6]);
      p.poly(P.skinSh, [27.4, 40, 36.6, 40, 36.6, 44, 27.4, 44]);
      for (const X of [x => x, x => 64 - x]) { p.poly(L.sleeve, [X(23.4), 48.4, X(27.6), 47.6, X(32), 52, X(27), 55]); p.poly(dark(L.sleeve, 0.16), [X(27), 55, X(32), 52, X(31), 54]); }
      const hv = accOf(L, 'chestharness');
      if (hv) { p.rect(hv, 18, 56.6, 28, 1.4); for (const x of [25.6, 37.6]) p.rect(hv, x, 49, 1, 7.6); }
      for (const X of [x => x, x => 64 - x]) {
        p.poly(lin, [X(2), 64, X(4.4), 55.6, X(10.6), 51.4, X(16.4), 52.4, X(15), 64]);
        p.poly(P.top, [X(1.2), 64, X(3), 56.4, X(9), 52.6, X(13), 53.4, X(9.6), 57, X(7.4), 64]);
        p.snap(L.trim, X(10.6) - 0.6, 55.4, 1.2, 1.4);
      }
      return;
    }
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.6, 28, 50.6]);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 50, 64]);
    p.poly(P.innerSh, [15, 64, 17, 58, 25.6, 55.6, 32, 58.6, 38.4, 55.6, 47, 58, 49, 64]);
    p.poly(P.inner, [16, 64, 17.8, 58.6, 25.6, 56.4, 32, 59.4, 38.4, 56.4, 46.2, 58.6, 48, 64]);
    for (const x of [22, 27, 37, 42]) p.poly(P.innerSh, [x, 58.6, x + 0.8, 58.6, x + 1.6, 64, x + 0.8, 64]);
    p.poly(P.inner, [26.4, 42.4, 37.6, 42.4, 37.8, 46, 26.2, 46]);
    p.poly(P.innerSh, [33.6, 42.4, 37.6, 42.4, 37.8, 46, 33.8, 46]);
    for (const sd of [-1, 1]) {
      p.poly(P.innerSh, [32 + sd * 3, 45.6, 32 + sd * 5.6, 45.6, 32 - sd * 9.4, 58.4, 32 - sd * 12.2, 58.4]);
      p.poly(P.inner, [32 + sd * 3.4, 45.6, 32 + sd * 5.2, 45.6, 32 - sd * 9.6, 57.6, 32 - sd * 11.6, 57.6]);
    }
    p.ell(dark('#d8b050', 0.3), 32, 50.4, 2.2, 1.6); p.ell(P.skin, 32, 50.1, 1.4, 0.9);
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      p.poly(lin, [X(2), 64, X(4.4), 55.6, X(10.6), 51.4, X(16.4), 52.4, X(15), 64]);
      p.poly(dark(lin, 0.2), [X(9), 57, X(10.4), 56.4, X(11), 58, X(9.6), 58.6]);
      p.poly(dark(lin, 0.2), [X(7), 61, X(8.4), 60.4, X(9), 62, X(7.6), 62.6]);
      p.poly(P.top, [X(2), 64, X(4.4), 55.6, X(10.6), 51.4, X(12), 51.6, X(7.4), 56.6, X(5.4), 64]);
    }
    p.poly(P.top, [19.6, 50.4, 22.4, 40.4, 25, 41, 23.8, 50.6]);
    p.poly(light(P.top, 0.2), [22.4, 40.4, 25, 41, 24.8, 42.4, 22.2, 42]);
  }

  function heartAt(p, col, x, y, r) {
    p.poly(col, [x, y + r, x - r, y - 0.05 * r, x - r * 0.95, y - 0.62 * r, x - r * 0.5, y - r, x, y - 0.6 * r, x + r * 0.5, y - r, x + r * 0.95, y - 0.62 * r, x + r, y - 0.05 * r]);
  }

  function ribbon(p, col, pts, w) {
    const n = pts.length / 2, out = [];
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1) * 2, b = Math.min(n - 1, i + 1) * 2;
      const dx = pts[b] - pts[a], dy = pts[b + 1] - pts[a + 1], l = Math.hypot(dx, dy) || 1;
      out.push(pts[i * 2] - dy / l * w, pts[i * 2 + 1] + dx / l * w);
    }
    for (let i = n - 1; i >= 0; i--) out.push(pts[i * 2], pts[i * 2 + 1]);
    p.poly(col, out);
  }

  function capeGems(p, x, y, r, gems) {
    for (const [sd, col] of [[-1, (gems && gems[0]) || '#e8862a'], [1, (gems && gems[1]) || '#34a45a']]) {
      const gx = x + sd * r * 0.95;
      p.poly(dark('#d8b050', 0.3), [gx, y - r * 1.2, gx + r, y, gx, y + r * 1.2, gx - r, y]);
      p.poly(col, [gx, y - r * 0.8, gx + r * 0.62, y, gx, y + r * 0.8, gx - r * 0.62, y]);
      p.poly(light(col, 0.45), [gx - r * 0.1, y - r * 0.6, gx + r * 0.3, y - r * 0.15, gx - r * 0.1, y]);
    }
  }

  function bustHoodBack(p, P, L) {
    p.poly(L.lining || P.topSh, [18.4, 51, 20.4, 42.4, 24.6, 38.2, 39.4, 38.2, 43.6, 42.4, 45.6, 51]);
    for (const X of [x => x, x => 64 - x]) p.poly(dark(L.lining || P.topSh, 0.3), [X(24.6), 38.2, X(26.6), 38.2, X(26.6), 46, X(25.4), 44]);
  }

  function bustHoodcape(p, P, L, sh) {
    const cord = L.lace || '#5a3424';
    p.poly(P.inner, sh);
    p.poly(P.innerSh, [38.6, 50, 45, 50, 43, 64, 37.4, 64]);
    p.poly(P.skin, [30, 52, 34, 52, 32, 61.4]);
    p.poly(P.skinSh, [30, 52, 34, 52, 33.3, 53.8, 30.7, 53.8]);
    for (const y of [54.2, 57.6]) {
      p.poly(cord, [29.2, y, 30.6, y, 34.8, y + 3, 33.4, y + 3]);
      p.poly(cord, [34.8, y, 33.4, y, 29.2, y + 3, 30.6, y + 3]);
    }
    p.poly(cord, [30.4, 61, 33.6, 61, 33.6, 62.2, 30.4, 62.2]);
    p.poly(cord, [30.6, 62, 31.8, 62, 31, 64, 29.8, 64]);
    p.poly(cord, [33.4, 62, 32.2, 62, 33, 64, 34.2, 64]);
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      const edge = [X(22.4), 42.2, X(24.4), 44.8, X(26.4), 49.4, X(29.8), 52.6, X(28), 56.6, X(25.8), 64];
      const piece = [X(0), 64, X(0.5), 55, X(6.5), 50.2, X(15.4), 48.2, X(19.4), 44.8].concat(edge);
      p.poly(sd < 0 ? P.top : mix(P.top, P.topSh, 0.4), piece);
      p.clipPoly(piece, () => {
        if (sd < 0) p.poly(P.topHi, [X(1.4), 55.6, X(6.8), 51.2, X(15.4), 49.2, X(19.6), 46, X(20.4), 47.4, X(16), 50.4, X(7.4), 52.4, X(2.6), 56.4]);
        else p.poly(P.topSh, [X(0), 64, X(0.5), 55, X(6.5), 50.2, X(10), 49.6, X(6), 56, X(5.4), 64]);
        p.poly(P.topSh, [X(9.4), 64, X(13.6), 56.4, X(18.6), 52.6, X(19.4), 53.4, X(15.2), 57.6, X(11.4), 64]);
        p.poly(P.topSh, [X(16.8), 64, X(19.6), 58.4, X(22.4), 55.6, X(22.8), 56.6, X(20.6), 60, X(18.6), 64]);
      });
      ribbon(p, P.trim, edge, sd < 0 ? 1.6 : -1.6);
      ribbon(p, dark(P.trim, 0.22), edge.slice(4), sd < 0 ? 0.6 : -0.6);
    }
    capeGems(p, 32, 52.6, 2.3, L.gems);
  }

  function bustCrusader(p, P, L, sh) {
    const plate = L.plate || '#f2eef8', lil = mix(plate, '#9a88b8', 0.42);
    p.poly(P.inner, sh);
    p.poly(dark(P.inner, 0.25), [49, 50.5, 59, 55, 62, 64, 51, 64]);
    const nc = L.neck || P.inner;
    p.rect(nc, 27.4, 41, 9.2, 8.4);
    p.rect(light(nc, 0.12), 33.6, 41, 3, 8.4);
    const bp = [16.4, 64, 17.6, 57, 21.4, 52.6, 27, 50.8, 32, 56.4, 37, 50.8, 42.6, 52.6, 46.4, 57, 47.6, 64];
    p.poly(plate, bp);
    p.clipPoly(bp, () => {
      p.poly(lil, [39, 50, 50, 50, 50, 64, 42.4, 64]);
      p.ell(lil, 25, 65, 8.8, 4.4);
      p.ell(lil, 39, 65, 8.8, 4.4);
      p.ell(plate, 24.4, 63.8, 7.8, 3.8);
      p.ell(mix(plate, lil, 0.5), 39.6, 63.8, 7.8, 3.8);
      p.poly(light(plate, 0.45), [19.6, 58.4, 23, 54.4, 25.2, 54.8, 21, 59.4]);
    });
    ribbon(p, P.trim, [21.4, 52.6, 27, 50.8, 32, 56.4, 37, 50.8, 42.6, 52.6], 1.4);
  }

  function bustOpenvest(p, P, L, sh) {
    const lin = L.lining || P.trim;
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [50, 50.5, 58, 53, 63, 57, 64, 64, 54, 64, 51, 56]);
    p.poly(P.inner, [19, 49.6, 25.4, 48.8, 32, 53.6, 38.6, 48.8, 45, 49.6, 47, 64, 17, 64]);
    p.poly(P.innerSh, [38.6, 48.8, 45, 49.6, 47, 64, 40, 64]);
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (x - 32);
      p.poly(sd < 0 ? P.top : P.topSh, [X(13), 50.6, X(19.4), 49, X(24), 53, X(26.4), 64, X(10.6), 64, X(9.8), 57]);
      p.poly(lin, [X(19.4), 49, X(21.6), 49.4, X(26.4), 64, X(24.4), 64, X(22.4), 56]);
      p.poly(sd < 0 ? P.top : P.topSh, [X(18.8), 50, X(20.6), 39.6, X(24.4), 38.6, X(23.6), 49]);
      p.poly(lin, [X(20.6), 39.6, X(24.4), 38.6, X(23.6), 49, X(22.4), 49.4, X(22.6), 41]);
    }
  }

  function bustSleeveless(p, P, L, sh) {
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.6, 28, 50.6]);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 53, 64, 50.4, 56]);
    const nc = L.neck || P.innerSh;
    p.rect(nc, 27.4, 41, 9.2, 8.4);
    p.rect(light(nc, 0.2), 27.4, 48.2, 9.2, 1.2);
    p.poly(P.inner, [25.6, 49.2, 38.4, 49.2, 41, 51, 32, 57.4, 23, 51]);
    p.poly(dark(P.inner, 0.12), [25.6, 49.2, 38.4, 49.2, 37.6, 50.6, 26.4, 50.6]);
    const vest = [23, 51, 27.4, 53.4, 32, 57.4, 36.6, 53.4, 41, 51, 44.2, 55, 46.4, 60.6, 47.2, 64, 16.8, 64, 17.6, 60.6, 19.8, 55];
    p.poly(P.top, vest);
    p.clipPoly(vest, () => {
      p.poly(P.topSh, [39.4, 50, 50, 50, 50, 64, 42.2, 64]);
      p.poly(P.topHi, [19.8, 57, 22.2, 55.6, 21.2, 61.6, 19.2, 62.4]);
    });
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      ribbon(p, P.trim, [X(23), 51, X(27.4), 53.4, X(32), 57.4], sd < 0 ? 1.4 : -1.4);
      p.poly(P.trim, [X(23.4), 51.4, X(21.6), 47.6, X(20.6), 50.4, X(15.6), 49.8, X(18.8), 52.8, X(20.2), 54.6]);
      p.poly(dark(P.trim, 0.14), [X(20.6), 50.4, X(15.6), 49.8, X(18.8), 52.8]);
    }
    p.poly(P.trim, [30.2, 58.4, 31.8, 58.4, 31.2, 64, 29.6, 64]);
  }

  function bustBikini(p, P, L, sh) {
    const bead = L.bead || '#e8c050';
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.6, 28, 50.6]);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 53, 64, 50.4, 56]);
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      p.poly(P.skinSh, [X(19.6), 51.6, X(28.4), 50.8, X(28.2), 51.8, X(20.2), 52.6]);
    }
    p.poly(P.skinSh, [31.4, 57, 32.6, 57, 32.4, 64, 31.6, 64]);
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      ribbon(p, P.top, [X(28.4), 44.6, X(26.4), 49.4, X(23.6), 54], sd < 0 ? -1.6 : 1.6);
      const cup = [X(15), 64, X(17), 58.6, X(23.4), 53.2, X(28.6), 56.6, X(31.2), 60.4, X(31.6), 64];
      p.poly(P.top, cup);
      p.clipPoly(cup, () => {
        p.poly(sd < 0 ? P.topHi : P.topSh, [X(17), 58.6, X(23.4), 53.2, X(25), 55.2, X(19), 60.4]);
        p.poly(dark(P.top, 0.25), [X(29.2), 58.4, X(31.6), 60.4, X(31.6), 64, X(30), 64]);
      });
    }
    const ky = 60.2;
    p.ell(dark(P.top, 0.1), 32, ky, 2, 1.6);
    for (const sd of [-1, 1]) p.poly(P.top, [32, ky, 32 + sd * 3.6, ky - 2, 32 + sd * 3.4, ky + 1.4, 32 + sd * 1.2, ky + 0.8]);
    p.ell(light(P.top, 0.18), 32, ky - 0.2, 1.2, 1);
    for (const sd of [-1, 1]) { p.poly(P.top, [32 + sd * 0.4, ky + 0.8, 32 + sd * 1.6, ky + 0.8, 32 + sd * 2.2, 63, 32 + sd * 1, 63]); p.ell(bead, 32 + sd * 1.6, 63.4, 1.2, 1.2); }
  }

  function bustBunnyvest(p, P, L, sh) {
    const fur = L.lining || '#f4f2ee', vs = dark(P.top, 0.22);
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(P.inner, [19.6, 64, 21, 53.4, 26, 50, 38, 50, 43, 53.4, 44.4, 64]);
    p.poly(P.innerSh, [37, 50, 38, 50, 43, 53.4, 44.4, 64, 39, 64]);
    p.poly(P.skin, [27.6, 49.6, 36.4, 49.6, 35, 51.6, 29, 51.6]);
    const pr = L.print || '#f6eef2';
    for (const [x, y, r] of [[33, 58.6, 2.6], [36.4, 57.6, 2.4], [39.4, 58.8, 2.2], [36, 60.4, 2.6]]) p.ell(pr, x, y, r, r * 0.8);
    p.ell(P.inner, 35, 58.8, 0.7, 0.7); p.ell(P.inner, 37.6, 58.8, 0.7, 0.7);
    for (const X of [x => x, x => 64 - x]) {
      const side = X(0) === 0;
      const vest = [X(11.4), 64, X(12.4), 55.6, X(16.6), 51.4, X(21.6), 50.6, X(23.2), 56, X(23.6), 64];
      p.poly(side ? P.top : vs, vest);
      p.clipPoly(vest, () => { for (let y = 53; y < 64; y += 2.6) p.rect(dark(P.top, 0.12), X(side ? 12 : 24), y, 12, 0.5); });
      p.poly(side ? P.top : vs, [X(20.4), 51.4, X(21.6), 47.8, X(26.8), 48.2, X(26.8), 50.8]);
      p.poly(light(P.top, 0.25), [X(21.6), 47.8, X(26.8), 48.2, X(26.8), 49, X(21.4), 48.8]);
      for (let i = 0; i < 5; i++) p.ell(fur, X(12.6 + i * 1.9), 55.4 - i * 1.1, 1.9, 1.7);
    }
    const ch = L.chain || '#d8a830';
    for (let i = 0; i < 6; i++) p.ell(ch, 27.2 + i * 1.9, 50.2 + Math.sin(i / 5 * Math.PI) * 1.6, 0.8, 0.7);
  }

  function bustHaori(p, P, L, sh) {
    const gold = P.trim, lin = L.lining || '#f2f2f4';
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(P.inner, [27.4, 41.4, 36.6, 41.4, 36.8, 50, 27.2, 50]);
    p.poly(P.innerSh, [34, 41.4, 36.6, 41.4, 36.8, 50, 34.4, 50]);
    p.rect(gold, 27.2, 41, 9.6, 1.4);
    p.poly(P.inner, [19.4, 64, 20.8, 54, 25.6, 49.4, 38.4, 49.4, 43.2, 54, 44.6, 64]);
    p.poly(P.innerSh, [37, 49.4, 38.4, 49.4, 43.2, 54, 44.6, 64, 39.4, 64]);
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      ribbon(p, gold, [X(26.4), 49.6, X(29.4), 54.6, X(31.6), 58.4], sd < 0 ? 1.2 : -1.2);
      ribbon(p, gold, [X(21.6), 53.4, X(21.2), 58, X(21), 64], sd < 0 ? 1.2 : -1.2);
      for (let i = 0; i < 4; i++) p.ell(lin, X(26.4 + i * 1.3), 47.6 + i * 1.6, 1.4, 1);
      const drape = [X(0), 64, X(0.6), 58, X(4), 55.2, X(11), 55.4, X(15.4), 59.4, X(16.4), 64];
      p.poly(sd < 0 ? P.top : P.topSh, drape);
      ribbon(p, lin, [X(0.6), 58, X(4), 55.2, X(11), 55.4, X(15.4), 59.4], sd < 0 ? -1.6 : 1.6);
      ribbon(p, gold, [X(1), 59.4, X(4.4), 57, X(10.8), 57.2, X(14.4), 60.8], sd < 0 ? -0.9 : 0.9);
    }
    p.poly(gold, [32, 50.6, 33.4, 52.6, 32, 54.4, 30.6, 52.6]);
  }

  function bustMaid(p, P, L, sh) {
    const pink = P.trim;
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(P.top, [27.2, 42.6, 36.8, 42.6, 37, 49, 27, 49]);
    p.poly(dark(P.top, 0.2), [34.4, 42.6, 36.8, 42.6, 37, 49, 34.8, 49]);
    p.rect(pink, 27, 48.2, 10, 0.9);
    const bl = [14, 64, 15.6, 55.4, 22, 53.6, 42, 53.6, 48.4, 55.4, 50, 64];
    p.poly(P.inner, bl);
    p.clipPoly(bl, () => {
      p.poly(P.innerSh, [40, 53.6, 48.4, 55.4, 50, 64, 41, 64]);
      for (let x = 17; x < 48; x += 3.2) p.rect(dark(P.top, 0.1), x, 55.2, 1.8, 0.8);
      for (const dx of [-1.6, 1.6]) p.rect(pink, 32 + dx - 0.5, 56.4, 1, 7.6);
      for (const y of [57.6, 60.4]) p.rect(P.top, 29.4, y, 5.2, 1.2);
    });
    for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      p.poly(P.top, [X(4), 58, X(7.4), 51.4, X(14), 49.4, X(15.6), 55.6, X(10), 59.4]);
      p.poly(dark(P.top, 0.25), [X(7.4), 51.4, X(14), 49.4, X(14.6), 51.4, X(9), 53.2]);
    }
    p.poly(pink, [32, 47.8, 26.2, 44.6, 26.8, 51.4]); p.poly(pink, [32, 47.8, 37.8, 44.6, 37.2, 51.4]);
    p.ell(dark(pink, 0.3), 32, 47.8, 1.6, 1.6);
    p.ell(pink, 26.4, 52, 1.5, 1.4); p.ell(pink, 28.4, 52, 1.5, 1.4); p.poly(pink, [25, 52.4, 29.8, 52.4, 27.4, 55.2]);
  }

  function bustTrashcan(p, P, L) {
    const can = P.top, dk = dark(can, 0.3), x0 = 6, x1 = 58;
    p.ell('#1a1a20', 32, 50.4, 24, 4.6);
    p.rect(L.collarCol || '#2a2a30', 25.4, 44, 13.2, 7.4);
    const body = [x0, 52, x0 + 1, 64, x1 - 1, 64, x1, 52];
    p.poly(can, body);
    p.clipPoly(body, () => {
      p.poly(dark(can, 0.16), [x1 - 12, 50, x1 + 2, 50, x1 + 2, 66, x1 - 11, 66]);
      p.poly(dark(can, 0.08), [x0 - 2, 50, x0 + 7, 50, x0 + 8, 66, x0 - 2, 66]);
      for (let x = x0 + 6; x < x1 - 2; x += 6.4) { p.rect(dk, x, 55.4, 1.4, 10); p.rect(light(can, 0.3), x + 1.4, 55.4, 0.8, 10); }
      p.rect(light(can, 0.45), 16, 55.4, 2, 10);
    });
    p.ell(dark(can, 0.1), 32, 52.6, 26.6, 3.6);
    p.ell(light(can, 0.25), 32, 52, 26, 2.6);
    p.ell('#1a1a20', 32, 51.2, 22.6, 2.4);
    p.rect(L.collarCol || '#2a2a30', 25.4, 47.6, 13.2, 3.4);
    p.rect(dk, x0 + 0.4, 54.4, x1 - x0 - 0.8, 1.2);
  }

  function bustValk(p, P, L, sh) {
    const suit = P.inner, plate = P.top, glow = L.glow || '#ff9a2a', fur = L.fur || '#1e1c22';
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(suit, [26.4, 41.6, 37.6, 41.6, 38.4, 49.4, 32, 51.4, 25.6, 49.4]);
    p.poly(dark(suit, 0.3), [34.6, 41.6, 37.6, 41.6, 38.4, 49.4, 35, 50.4]);
    p.poly(glow, [29.6, 48.4, 34.4, 48.4, 32, 51.6]);
    p.poly(suit, [16.6, 64, 18, 56.4, 23.4, 53.2, 32, 57.6, 40.6, 53.2, 46, 56.4, 47.4, 64]);
    for (const X of [x => x, x => 64 - x]) {
      const pl = [X(18.4), 59, X(21.4), 54.4, X(28.6), 55.8, X(31), 60.4, X(27), 64, X(19.2), 64];
      p.poly(plate, pl);
      p.clipPoly(pl, () => { p.poly(dark(plate, 0.3), [X(18), 62, X(31), 61, X(31), 65, X(18), 65]); p.poly(light(plate, 0.3), [X(21.6), 55, X(27.6), 56.2, X(22.6), 57]); });
      ribbon(p, glow, [X(21.4), 58.4, X(24.6), 60.6, X(28.6), 59.4], 1.1);
      p.snap('#ffd870', X(24.6) - 0.5, 60, 1, 0.8);
    }
    p.poly(suit, [31, 58, 33, 58, 33.6, 64, 30.4, 64]);
    for (let i = 0; i < 7; i++) { const a = -0.3 + i * 0.36; p.ell(i % 2 ? fur : light(fur, 0.12), 55 + Math.cos(a) * 6, 53 + Math.sin(a) * 4.4, 3.4, 2.8); }
    p.ell(fur, 54, 55, 6.4, 4.4);
    p.poly(light(fur, 0.22), [50, 51.6, 54, 50, 57, 50.6, 53, 52]);
  }

  function bustHoodie(p, P, L, sh) {
    const cord = L.cord || '#f8f4ec', rim = dark(P.top, 0.14);
    p.poly(P.top, sh);
    p.poly(P.topSh, [0, 64, 0.5, 55, 6.5, 50.2, 12, 49, 9, 54, 6, 64]);
    p.poly(P.topSh, [64, 64, 63.5, 55, 57.5, 50.2, 52, 49, 55, 54, 58, 64]);
    p.poly(rim, [19, 49, 25, 46.4, 39, 46.4, 45, 49, 41, 53.4, 32, 55.4, 23, 53.4]);
    p.poly(P.inner, [24, 48.6, 27.6, 47.4, 36.4, 47.4, 40, 48.6, 37, 51.4, 32, 52.6, 27, 51.4]);
    p.poly(light(P.top, 0.3), [20.4, 49, 25, 47, 30, 46.8, 24.4, 48.4]);
    for (const x of [29.4, 34.6]) { p.rect(cord, x - 0.5, 52, 1, 6.6); p.rect(dark(cord, 0.3), x - 0.7, 58.4, 1.4, 1.8); }
    const pw = accOf(L, 'pawprint');
    if (pw) { const x = 45, y = 59.4; p.ell(pw, x, y, 2.8, 2.3); for (const [dx, dy] of [[-3.2, -2.8], [-1.1, -4.4], [1.1, -4.4], [3.2, -2.8]]) p.ell(pw, x + dx, y + dy, 1.1, 1.2); }
  }

  function bustOveralls(p, P, L, sh) {
    const bib = P.lower, st = L.strap || '#6a4630', metal = '#c8ccd4';
    p.poly(P.top, sh);
    p.poly(P.topSh, [49, 50.5, 59, 55, 62, 64, 52, 64, 47, 54]);
    p.poly(P.skin, [28.6, 48.4, 35.4, 48.4, 32, 53.4]);
    p.poly(P.skinSh, [28.6, 48.4, 35.4, 48.4, 34, 50, 30, 50]);
    p.poly(dark(P.top, 0.25), [24, 48, 28.4, 48.2, 32, 53.6, 29, 55.6]);
    p.poly(dark(P.top, 0.35), [40, 48, 35.6, 48.2, 32, 53.6, 35, 55.6]);
    for (const y of [50, 52]) { p.poly(st, [30.4, y, 31.4, y, 33.6, y + 1.4, 32.6, y + 1.4]); p.poly(st, [33.6, y, 32.6, y, 30.4, y + 1.4, 31.4, y + 1.4]); }
    const front = [21.4, 64, 22.4, 56.6, 41.6, 56.6, 42.6, 64];
    p.poly(bib, front);
    p.clipPoly(front, () => { p.poly(dark(bib, 0.2), [36, 56, 44, 56, 44, 64, 37, 64]); p.rect(dark(bib, 0.35), 27, 59.4, 10, 0.8); p.rect(light(bib, 0.18), 22, 57, 20, 0.8); });
    for (const X of [x => x, x => 64 - x]) {
      p.poly(st, [X(13.6), 51.4, X(17), 50.8, X(25.4), 57.2, X(22.6), 57.8]);
      p.poly(light(st, 0.2), [X(14.4), 51.2, X(16), 51, X(23.8), 56.8, X(22.8), 57]);
      p.rect(dark(metal, 0.4), X(24) - 1.4, 56.4, 2.8, 2.6); p.rect(metal, X(24) - 1, 56.7, 2, 2);
    }
    const b = accOf(L, 'molebadge');
    if (b) { p.ell(dark(b, 0.3), 32, 61.6, 2.2, 2.2); p.ell(b, 32, 61.3, 1.7, 1.7); p.snap(light(b, 0.5), 31.2, 60.5, 0.8, 0.8); }
  }

  function bustRobe(p, P, L, sh) {
    p.poly(P.top, sh);
    p.poly(P.topSh, [64, 64, 63.5, 55, 57.5, 50.2, 54, 51.6, 52.5, 64]);
    p.poly(P.topHi, [3, 57, 8, 51.6, 13, 50.4, 8, 54.4]);
    p.poly(P.inner, [25.8, 39.4, 38.2, 39.4, 38.8, 49.4, 25.2, 49.4]);
    p.poly(dark(P.inner, 0.14), [34.4, 39.4, 38.2, 39.4, 38.8, 49.4, 35, 49.4]);
    p.poly(P.inner, [22.4, 48.4, 41.6, 48.4, 40.4, 64, 23.6, 64]);
    p.poly(dark(P.inner, 0.12), [34.6, 48.4, 41.6, 48.4, 40.4, 64, 36.4, 64]);
    p.poly(dark(P.inner, 0.22), [31, 44, 32.4, 44, 27.6, 64, 26.2, 64]);
    p.rect('#6aa6e2', 33, 49.4, 1.4, 14.6);
    p.rect('#c8384a', 34.4, 49.4, 0.8, 14.6);
    for (const y of [52, 57]) { p.snap('#c4c8d2', 24.4, y, 4.4, 1.2); p.snap('#8a8e9a', 24.4, y + 1.2, 4.4, 0.6); }
    p.poly(P.trim, [19.4, 48.4, 23, 48.4, 25.4, 64, 21.2, 64]);
    p.poly(P.trim, [44.6, 48.4, 41, 48.4, 38.6, 64, 42.8, 64]);
  }

  function bustRaglan(p, P, L, sh) {
    const sl = L.sleeve || P.trim;
    p.poly(P.top, sh);
    p.poly(P.topSh, [44, 49.4, 49, 50.5, 59, 55, 62, 64, 47, 64, 44.6, 57]);
    for (const s of [-1, 1]) {
      const m = a => a.map((v, i) => (i % 2 || s < 0 ? v : 64 - v));
      p.poly(s < 0 ? sl : dark(sl, 0.2), m([2, 64, 5, 55, 15, 50.5, 25, 48.6, 26.6, 49.8, 15.4, 64]));
    }
    p.poly(sl, [24.2, 48.2, 39.8, 48.2, 37.6, 51.8, 32, 53, 26.4, 51.8]);
    p.poly(P.skin, [26.4, 48.2, 37.6, 48.2, 36, 50.4, 32, 51.2, 28, 50.4]);
    p.poly(P.skinSh, [26.4, 48.2, 37.6, 48.2, 36.8, 49.4, 27.2, 49.4]);
  }

  function bustVolt(p, P, L, sh) {
    const sl = L.sleeve || '#1e2024', top = P.top, inn = P.inner, dot = dark(top, 0.5);
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(inn, [21.6, 64, 22.6, 53, 27, 50, 37, 50, 41.4, 53, 42.4, 64]);
    p.poly(top, [24.2, 64, 24.8, 53.2, 28.6, 50.4, 35.4, 50.4, 39.2, 53.2, 39.8, 64]);
    p.poly(dark(top, 0.18), [33.4, 50.4, 35.4, 50.4, 39.2, 53.2, 39.8, 64, 34.4, 64]);
    p.poly(inn, [30.2, 55.4, 33.8, 55.4, 33.8, 64, 30.2, 64]);
    p.rect('#f2f2f4', 30.8, 57.6, 2.4, 3);
    p.poly('#1e2024', [31.6, 58, 32.8, 58, 31.8, 59.4, 32.6, 59.4, 31.4, 60.4]);
    for (const [x, y] of [[27, 54.4], [28.6, 57.4], [37, 54.4], [35.4, 57.4]]) p.ell(dot, x, y, 0.9, 0.9);
    for (const X of [x => x, x => 64 - x]) {
      p.ell(dark(top, 0.2), X(24.4), 49.6, 3.6, 2.2);
      p.ell(top, X(24.4), 48.8, 3.2, 1.8);
      p.poly(sl, [X(1.4), 64, X(2.6), 57.4, X(8.6), 53.4, X(15.4), 53.8, X(17.6), 64]);
      p.poly(dark(sl, 0.2), [X(12), 53.6, X(15.4), 53.8, X(17.6), 64, X(13.6), 64]);
      p.ell(dark(top, 0.25), X(9.4), 55.8, 6.2, 3.2);
      p.ell(top, X(9.4), 55, 5.8, 2.8);
      p.ell('#34363e', X(5.4), 60.4, 2.8, 2.8);
      p.ell('#9a9ca6', X(5.4), 60.4, 1.5, 1.5);
      p.snap('#e8402a', X(5.4) - 0.4, 60, 0.8, 0.8);
    }
  }

  function bustKid(p, P, L, sh) {
    const jk = P.top, inn = P.inner, gold = '#d8b050';
    p.poly(jk, sh);
    p.poly(P.topSh, [49, 50.5, 59, 55, 62, 64, 52, 64, 47, 54]);
    p.poly(inn, [23, 64, 24, 52, 27.4, 48.6, 36.6, 48.6, 40, 52, 41, 64]);
    p.poly(light(inn, 0.12), [25, 56, 31.4, 55, 31.4, 60, 25.6, 61]);
    p.poly(light(inn, 0.12), [39, 56, 32.6, 55, 32.6, 60, 38.4, 61]);
    p.poly(gold, [32, 55.4, 34, 58.6, 32, 62, 30, 58.6]);
    p.poly(dark(gold, 0.3), [32, 56.8, 33, 58.6, 32, 60.4, 31, 58.6]);
    for (const X of [x => x, x => 64 - x]) {
      p.poly(jk, [X(21), 64, X(22), 52, X(24.6), 44, X(27.6), 44.6, X(26), 52, X(25.4), 64]);
      p.poly(L.collarIn || dark(jk, 0.3), [X(24.6), 44, X(27.6), 44.6, X(27), 48, X(25), 47.4]);
      p.rect('#c8ccd4', X(25.4) - 0.3, 52, 0.6, 12);
    }
    p.poly(gold, [46, 53.6, 46.8, 55.4, 48.6, 55.4, 47.2, 56.6, 47.8, 58.4, 46, 57.2, 44.2, 58.4, 44.8, 56.6, 43.4, 55.4, 45.2, 55.4]);
    p.rect('#f4f4f6', 52, 55, 1.6, 8); p.poly('#f4f4f6', [53.6, 58.6, 57.6, 55, 59, 55, 54.4, 59.4]); p.poly('#f4f4f6', [53.6, 58.8, 55, 58, 59.2, 63, 57.6, 63]);
    for (const X of [x => x, x => 64 - x]) { p.ell('#5a5c66', X(14.4), 53.4, 2.2, 1.8); p.ell('#c8ccd4', X(14.4), 53, 1.6, 1.3); p.ell('#5a5c66', X(18.6), 52.2, 1.4, 1.1); }
    p.poly('#9a9ca6', [56, 50, 60, 48.6, 61, 50, 57, 51.4]);
    p.rect(dark(P.inner, 0.3), 31.6, 48.6, 0.8, 6);
  }

  function bustGyaru(p, P, L, sh) {
    const jk = P.top, col = L.collarCol || '#f4f4f6', inn = P.inner;
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 52, 64]);
    p.poly(inn, [22, 64, 22.8, 54, 27, 51.4, 37, 51.4, 41.2, 54, 42, 64]);
    p.poly(dark(inn, 0.08), [35, 51.4, 37, 51.4, 41.2, 54, 42, 64, 36, 64]);
    p.poly('#1c1c22', [24, 57, 40, 57, 40, 62.6, 24, 62.6]);
    p.poly(inn, [25.4, 58.2, 27.4, 58.2, 30, 61.4, 28, 61.4]);
    p.poly(inn, [30.4, 58.2, 32.4, 58.2, 35, 61.4, 33, 61.4]);
    p.poly(inn, [35.4, 58.2, 37.4, 58.2, 39, 60.4, 38, 61.4]);
    for (const X of [x => x, x => 64 - x]) {
      p.poly(jk, [X(0.6), 64, X(1.6), 56, X(7), 52.4, X(13.6), 53, X(16.4), 58, X(15.4), 64]);
      p.poly(dark(jk, 0.25), [X(11), 53, X(13.6), 53, X(16.4), 58, X(15.4), 64, X(12.6), 64]);
      p.poly(col, [X(7), 52.4, X(13.6), 53, X(14.8), 55.6, X(9.4), 55.4]);
      p.poly(col, [X(25.6), 46.6, X(28.6), 49.4, X(26.6), 51, X(23.6), 48.4]);
    }
    p.snap('#c83040', 52, 57.4, 1.6, 1.6);
  }

  function bustAvia(p, P, L, sh) {
    const plate = L.plate || '#e2e8f8', plSh = L.plateSh || '#c0d0ee', ins = L.inset || '#6792c4';
    p.poly(P.top, sh);
    p.poly(P.topSh, [44, 49.4, 49, 50.5, 59, 55, 62, 64, 47, 64, 44.6, 57]);
    p.poly(ins, [27.2, 50.6, 36.8, 50.6, 35.6, 64, 28.4, 64]);
    p.poly(light(ins, 0.25), [28.6, 51.6, 30.6, 51.6, 30, 64, 29.2, 64]);
    for (const s of [-1, 1]) {
      const m = a => a.map((v, i) => (i % 2 || s < 0 ? v : 64 - v));
      p.poly('#22385e', m([3.4, 59, 5.8, 52.2, 14.6, 49.6, 19, 51.2, 15.2, 56.6, 7.4, 60.8]));
      p.poly(s < 0 ? plate : plSh, m([4.6, 58, 6.8, 53, 14.4, 50.8, 17.2, 51.6, 14.2, 55.6, 7.6, 59.4]));
    }
  }

  function bustRanger(p, P, L, sh) {
    p.poly(P.top, sh);
    p.poly(P.topSh, [44, 49.4, 49, 50.5, 59, 55, 62, 64, 47, 64, 44.6, 57]);
    p.poly(P.inner, [25, 40, 39, 40, 40, 50.6, 24, 50.6]);
    p.rect(P.trim, 31.4, 50.6, 1.2, 13.4);
    for (const x of [22, 42]) p.rect(P.trim, x - 2, 55, 4, 3);
    p.rect('#5ae8f8', 40.6, 55.8, 1.4, 1.2);
  }

  function bustSuit(p, P, L, sh) {
    const neon = L.neon || P.trim, neon2 = L.neon2 || '#5ae8f8';
    p.poly(P.top, sh);
    p.poly(P.topSh, [44, 49.4, 49, 50.5, 59, 55, 62, 64, 47, 64, 44.6, 57]);
    p.poly(light(P.top, 0.14), [8, 57, 14, 51.6, 19, 50.2, 13, 55.6]);
    p.poly(P.inner, [26, 39.6, 38, 39.6, 39, 50.6, 25, 50.6]);
    p.poly(dark(P.inner, 0.2), [34.4, 39.6, 38, 39.6, 39, 50.6, 35.2, 50.6]);
    p.rect(neon, 26, 39.4, 12, 1);
    ribbon(p, neon, [25, 50.6, 32, 52.4, 39, 50.6], 1);
    p.rect(neon, 31.4, 52.4, 1.2, 11.6);
    ribbon(p, neon, [16.4, 50.6, 21, 56, 22.6, 64], 1);
    ribbon(p, neon2, [47.6, 50.6, 43, 56, 41.4, 64], -1);
    p.ell(light(neon, 0.5), 32, 52.8, 1, 1);
  }

  function bustHeartCorset(p, P, L, sh) {
    const bow = L.bow || '#e26396';
    p.poly(P.skin, sh);
    p.poly(P.skinSh, [25, 48.6, 39, 48.6, 36, 50.4, 28, 50.4]);
    p.poly(P.skinSh, [49, 50.5, 59, 55, 62, 64, 54, 64, 51, 56]);
    const edge = [14.2, 57.8, 20, 56.2, 26, 57.6, 32, 56.8, 38, 57.6, 44, 56.2, 49.8, 57.8];
    p.poly(P.top, [13, 64].concat(edge, [51, 64]));
    p.poly(P.topSh, [44, 56.2, 49.8, 57.8, 51, 64, 45, 64]);
    ribbon(p, P.trim, edge, 1.1);
    p.rect(P.trim, 31.4, 61, 1.2, 3);
    p.poly(bow, [32, 59.6, 25.8, 56.6, 26.4, 62.6]);
    p.poly(bow, [32, 59.6, 38.2, 56.6, 37.6, 62.6]);
    p.poly(dark(bow, 0.22), [32, 59.6, 28.6, 64, 30.6, 64]);
    p.poly(dark(bow, 0.22), [32, 59.6, 35.4, 64, 33.4, 64]);
    p.ell(light(bow, 0.25), 32, 59.6, 1.5, 1.5);
    for (const s of [-1, 1]) p.poly(L.cuffCol || bow, [32 + s * 25.6, 58.6, 32 + s * 29.4, 60.4, 32 + s * 29.8, 62.6, 32 + s * 25.4, 61]);
  }

  function bustBodyAcc(p, P, L) {
    let v;
    if ((v = accOf(L, 'magia'))) {
      p.poly('#1e1c26', [24.6, 60.4, 32, 57.4, 39.4, 60.4, 34.4, 61.8, 33.6, 64, 30.4, 64, 29.6, 61.8]);
      for (const [x, y, w] of [[26.6, 59.4, 2.2], [29.6, 59.8, 1.6], [31.8, 59.2, 2], [34.4, 59.8, 1.4], [36.4, 59.4, 1.2]]) p.rect(v, x, y, w, 1.1);
    }
    if ((v = accOf(L, 'yoke'))) for (const sd of [-1, 1]) {
      const m = a => a.map((q, i) => (i % 2 || sd < 0 ? q : 64 - q));
      p.poly(v, m([2, 64, 5, 55, 15, 50.5, 25, 48.6, 26.4, 52, 18.6, 56, 12.6, 64]));
    }
    if ((v = accOf(L, 'lantern'))) {
      p.ell('#14141a', 32, 59, 5.4, 5.4); p.ell('#f4f4f8', 32, 59, 4.4, 4.4);
      p.rect('#14141a', 29.6, 56.2, 4.8, 5.4); p.rect('#14141a', 28.6, 55.4, 6.8, 1.2); p.rect('#14141a', 28.6, 61.4, 6.8, 1.2);
    }
    if ((v = accOf(L, 'gemcollar'))) {
      p.poly('#2a2e3a', [25.6, 40.4, 38.4, 40.4, 39.4, 50, 36.8, 52.6, 34.4, 51.4, 32, 54.4, 29.6, 51.4, 27.2, 52.6, 24.6, 50]);
      p.poly('#3e4454', [25.6, 40.4, 29, 40.4, 28.4, 50.8, 24.6, 50]);
      for (const x of [27, 30.4, 33.6, 37]) p.rect('#4a5264', x - 0.8, 47.6, 1.6, 1);
      p.ell('#16203c', 32, 51.4, 2.6, 2.6);
      p.ell(v, 32, 51.4, 1.9, 1.9);
      p.ell('#e4f6ff', 31.3, 50.7, 0.6, 0.6);
    }
    if ((v = accOf(L, 'heartchoker'))) { p.rect(v, 27.6, 46.4, 8.8, 1.8); heartAt(p, '#c5883d', 32, 48.8, 2.6); heartAt(p, v, 32, 48.8, 1.9); }
    if ((v = accOf(L, 'wingpad'))) {
      const s2 = mix(v, '#9a88b8', 0.4);
      for (const f of [[18.4, 53.6, 10.6, 52, 2.6, 54.4, 10, 55.8, 18, 57], [18.4, 51.4, 9.6, 47.2, 0.6, 47.4, 8.6, 50.4, 18, 54.6], [18.4, 49.4, 10.6, 44.2, 2, 40.6, 9.6, 46.6, 18, 52.4]]) {
        p.poly(s2, f.map((q, i) => (i % 2 ? q + 0.9 : q)));
        p.poly(v, f);
        p.poly(s2, [f[0] - 1, (f[1] + f[9]) / 2, f[4] + 2.4, f[5] + 0.6, f[4] + 2.6, f[5] + 1.1, f[0] - 1, (f[1] + f[9]) / 2 + 0.7]);
      }
    }
    if ((v = accOf(L, 'platepad'))) {
      const s2 = mix(v, '#9a88b8', 0.42);
      p.ell(s2, 54.2, 56.6, 9.8, 5.8, 0.25);
      p.ell(v, 53.8, 55.8, 9.2, 5.2, 0.25);
      p.ell(s2, 55.6, 61.6, 8.8, 4.8, 0.3);
      p.ell(v, 55.2, 61, 8.2, 4.2, 0.3);
      p.poly(light(v, 0.5), [46.6, 53, 53, 51.2, 57.4, 52.4, 50, 54.2]);
    }
    if ((v = accOf(L, 'ribbonbow'))) {
      p.poly('#b88418', [32, 53.2, 34.2, 56.2, 32, 59.2, 29.8, 56.2]);
      p.poly('#f8d860', [32, 54.2, 33.2, 56, 32, 56.8, 31, 56]);
      for (const sd of [-1, 1]) {
        const X = x => 32 + sd * (32 - x);
        p.poly(v, [X(31.2), 50.2, X(28.2), 55.8, X(29.8), 55.6, X(32), 51]);
        p.poly(v, [X(32), 49.6, X(25.4), 46.4, X(24.8), 51.8]);
        p.poly(dark(v, 0.32), [X(32), 49.6, X(24.8), 51.8, X(27.2), 50.8]);
      }
      p.ell(dark(v, 0.2), 32, 49.8, 1.7, 1.5);
    }
    if ((v = accOf(L, 'witchcape'))) for (const sd of [-1, 1]) {
      const X = x => 32 + sd * (32 - x);
      p.poly(sd < 0 ? v : dark(v, 0.16), [X(2), 64, X(4.6), 55.4, X(14.4), 50.6, X(22.6), 48.4, X(23.8), 50, X(15.6), 54.6, X(10), 64]);
      ribbon(p, L.capeTrim || P.trim, [X(23.8), 50, X(15.6), 54.6, X(10), 64], sd < 0 ? 1.8 : -1.8);
    }
    if ((v = accOf(L, 'gembow'))) {
      for (const sd of [-1, 1]) {
        const X = x => 32 + sd * (32 - x);
        p.poly(L.band || '#f0b440', [X(30.6), 58.4, X(27.6), 63.8, X(29.8), 62.6, X(31.6), 59]);
        p.poly(v, [X(32), 56.6, X(24.2), 52.4, X(23.4), 57.6, X(25.4), 61]);
        p.poly(dark(v, 0.3), [X(32), 56.6, X(25.4), 61, X(23.4), 57.6, X(26.6), 58.6]);
        p.poly(light(v, 0.3), [X(24.2), 52.4, X(28.4), 54.4, X(25.2), 54.4]);
      }
      p.ell(dark('#d8b050', 0.15), 32, 56.6, 2.8, 2.6);
      p.ell(accOf(L, 'hairloop') || '#2c5ad8', 32, 56.6, 2, 1.9);
      p.ell('#f4f8ff', 31.3, 55.8, 0.7, 0.6);
    }
    if ((v = accOf(L, 'shawl'))) for (const X of [x => x, x => 64 - x]) { p.poly(v, [X(0), 64, X(1), 56, X(6), 51.6, X(13), 52.6, X(16.4), 57, X(14), 64]); p.poly(dark(v, 0.12), [X(9), 56, X(14.6), 55.4, X(16.4), 57, X(14), 64, X(10.4), 64]); p.poly('#3aa0b0', [X(15), 52.6, X(16.4), 52, X(17.6), 58, X(16.2), 58.6]); p.poly('#e888b0', [X(16.2), 58.6, X(17.6), 58, X(17.8), 61, X(16.4), 61.6]); }
    if ((v = accOf(L, 'sheer'))) { p.poly(v, [27.4, 58, 32, 60, 36.6, 58, 35.6, 64, 28.4, 64]); p.poly('#dcb75c', [29.4, 61.4, 34.6, 61.4, 34.6, 62.6, 29.4, 62.6]); for (const X of [x => x, x => 64 - x]) p.poly('#dcb75c', [X(20), 58.6, X(25), 55.4, X(29.4), 58.6, X(25), 57]); }
    if ((v = accOf(L, 'blackyoke'))) { p.poly(v, [2, 64, 5, 55, 15, 50.5, 25, 48.6, 26, 52, 20, 56, 16, 64]); p.poly(v, [62, 64, 59, 55, 49, 50.5, 39, 48.6, 38, 52, 44, 56, 48, 64]); for (const y of [55, 60]) { p.snap('#c8ccd4', 26.4, y, 1.6, 1); p.snap('#c8ccd4', 36, y, 1.6, 1); } }
    if ((v = accOf(L, 'cravat'))) { p.poly(v, [25.4, 48.6, 38.6, 48.6, 36.6, 53.4, 27.4, 53.4]); p.poly(v, [28.4, 53, 35.6, 53, 38.4, 64, 32, 60.4, 25.6, 64]); p.poly(light(v, 0.35), [28.4, 53, 32, 53, 32, 60.4, 26.6, 63]); p.poly('#d8b050', [29, 50.6, 32, 49.4, 35, 50.6, 32, 52.4]); }
    if ((v = accOf(L, 'yoke'))) { p.poly(v, [2, 64, 4.4, 56, 12, 52.4, 17, 53, 16, 58, 9, 60, 5.6, 64]); p.poly(v, [62, 64, 59.6, 56, 52, 52.4, 47, 53, 48, 58, 55, 60, 58.4, 64]); }
    if ((v = accOf(L, 'tiestripe'))) { p.poly(v, [30, 58, 34, 58, 35, 64, 29, 64]); p.rect('#f8f4ea', 29.4, 61.6, 5.2, 0.8); }
    if ((v = accOf(L, 'leotard')) && L.coat === 'leo') { p.poly(v, [32, 59.4, 35, 58, 36.6, 64, 27.4, 64, 29, 58]); p.poly(dark(v, 0.1), [32, 59.4, 35, 58, 36.6, 64, 33, 64]); }
    else if ((v = accOf(L, 'leotard'))) p.poly(v, [32, 49, 37, 56, 34.6, 64, 29.4, 64, 27, 56]);
    if ((v = accOf(L, 'neckscarf'))) {
      p.poly(v, [25.6, 43.6, 38.4, 43.6, 40.2, 50.4, 24, 50.4]);
      p.poly(dark(v, 0.25), [33.6, 43.6, 38.4, 43.6, 40.2, 50.4, 35, 50.4]);
      p.poly('#d8305a', [25, 46.4, 39, 46.4, 39.4, 47.6, 24.6, 47.6]);
      p.poly(v, [34, 49.6, 42.6, 52, 41, 57.6, 35, 52.6]); p.poly(v, [32.4, 50, 36.6, 57.4, 33.4, 59.4, 30.8, 51.6]);
      p.poly(dark(v, 0.3), [36.6, 51.6, 42.6, 52, 41, 57.6]); p.poly('#d8305a', [33, 51, 34, 51, 36, 57, 35, 57.4]);
    }
    if ((v = accOf(L, 'armribbon2'))) { p.rect('#1e1c28', 51.6, 57.4, 9.6, 3); p.poly(v, [53, 56.6, 46, 52, 49.4, 58.6]); p.poly(v, [55, 56.6, 62.4, 51.4, 61.6, 58.6]); p.poly(dark(v, 0.25), [55.4, 58, 57.4, 58, 59, 64, 56.8, 64]); p.ell(dark(v, 0.35), 54.2, 57.6, 1.6, 1.4); }
    if ((v = accOf(L, 'vestv'))) { p.poly(v, [25.4, 48.4, 38.6, 48.4, 34.6, 60, 32, 63.4, 29.4, 60]); p.poly(light(v, 0.16), [31.4, 50, 32.6, 50, 32.4, 61, 31.6, 61]); }
    if ((v = accOf(L, 'leafclasp'))) for (const [x, y] of [[23.6, 58], [40.4, 58], [25, 62.4], [39, 62.4]]) { p.poly(dark(v, 0.3), [x - 1.8, y, x, y - 1.6, x + 1.8, y, x, y + 1.6]); p.poly(v, [x - 1.4, y, x, y - 1.2, x + 1.4, y, x, y + 1.2]); }
    if ((v = accOf(L, 'frogknot'))) { for (const y of [53.4, 57.8]) { p.ell(v, 32, y, 2, 2.2); p.ell(P.inner, 32, y, 0.9, 1.1); } p.ell('#d8402a', 28.8, 55.6, 1.4, 1.4); p.ell('#d8402a', 35.2, 55.6, 1.4, 1.4); p.ell('#ff9a7a', 28.4, 55.2, 0.5, 0.5); }
    if ((v = accOf(L, 'neckpiece'))) { p.poly(v, [30.8, 47, 33.2, 47, 33.6, 49.2, 32, 50.4, 30.4, 49.2]); p.snap(dark(v, 0.4), 31.6, 47.8, 0.8, 1.2); for (const x of [27.6, 36.4]) { p.ell(dark(v, 0.25), x, 48.6, 1.1, 1.1); p.ell('#202024', x, 48.6, 0.5, 0.5); } }
    if ((v = accOf(L, 'buttons'))) for (const x of [22.6, 41.4]) { p.ell(v, x, 61.4, 1.7, 1.7); p.ell(P.inner, x, 61.4, 0.8, 0.8); }
    if ((v = accOf(L, 'skullprint'))) { p.ell(v, 32, 57, 3.6, 3.2); p.rect(v, 30, 59, 4, 2.4); p.ell(P.inner, 30.6, 56.8, 1.1, 1.2); p.ell(P.inner, 33.4, 56.8, 1.1, 1.2); p.rect(P.inner, 31.6, 59.8, 0.8, 1.6); for (const s of [-1, 1]) p.poly(v, [32 + s * 2, 61.6, 32 + s * 6, 64, 32 + s * 5, 64, 32 + s * 1.4, 62.4]); }
    if ((v = accOf(L, 'chestplate'))) {
      p.poly(dark(v, 0.35), [22, 50, 32, 53.4, 42, 50, 40.6, 58, 32, 64, 23.4, 58]);
      p.poly(v, [23, 50.6, 32, 54, 41, 50.6, 39.8, 57.4, 32, 62.8, 24.2, 57.4]);
      p.poly(light(v, 0.45), [23.6, 51.4, 31.4, 54.6, 31.4, 61.6, 25, 57]);
      p.poly(dark(v, 0.2), [32, 56.6, 36.6, 55, 32, 60.4]);
      for (const [x, y, h] of [[25, 49.6, 6], [28.6, 48.4, 7], [35.4, 48.4, 7], [39, 49.6, 6], [32, 47.4, 6]]) { p.poly('#62c4f4', [x - 1.2, y, x, y - h, x + 1.2, y]); p.poly('#c8f0ff', [x - 0.4, y - 0.6, x, y - h + 1, x + 0.4, y - 0.6]); }
    }
    if ((v = accOf(L, 'furcollar'))) {
      for (let i = 0; i < 6; i++) for (const X of [x => x, x => 64 - x]) { p.ell(dark(v, 0.2), X(11 + i * 3.4), 52.8 - i * 1.1, 3.4, 3.2); p.ell(v, X(10.6 + i * 3.4), 52 - i * 1.1, 3, 2.7); }
      if (accOf(L, 'chestplate')) for (const [x, y, h] of [[26.4, 50.6, 6], [29.4, 50, 7.4], [34.6, 50, 7.4], [37.6, 50.6, 6], [32, 50.4, 6.6]]) { p.poly('#3aa8e4', [x - 1.4, y, x, y - h, x + 1.4, y]); p.poly('#c8f0ff', [x - 0.4, y - 0.8, x, y - h + 1.4, x + 0.4, y - 0.8]); }
    }
    if ((v = accOf(L, 'goldclasp'))) for (const x of [44.6, 48.4]) { p.ell(dark(v, 0.35), x, 56, 1.7, 1.7); p.ell(v, x, 55.7, 1.3, 1.3); }
    if ((v = accOf(L, 'pauldron'))) {
      for (let i = 0; i < 3; i++) {
        const y = 49 + i * 4.6, x = 8 - i * 0.6;
        p.poly(dark(v, 0.3), [x - 9, y + 4.6, x - 6, y - 1, x + 7, y - 2.4, x + 9, y + 3.4]);
        p.poly(v, [x - 8.4, y + 4, x - 5.6, y - 0.4, x + 6.6, y - 1.8, x + 8.4, y + 2.8]);
        p.poly('#2d5bd3', [x - 8.4, y + 4, x + 8.4, y + 2.8, x + 8.6, y + 3.8, x - 8.4, y + 5]);
      }
      p.poly('#62c4f4', [2, 52, 5, 40, 8, 51]); p.poly('#a8e4ff', [7, 50, 11, 42, 12.4, 50]); p.poly('#c8f0ff', [4, 50, 5, 44, 6, 50]);
    }
    if ((v = accOf(L, 'turtle'))) { p.poly(v, [26.2, 39.4, 37.8, 39.4, 38.6, 50, 32, 53, 25.4, 50]); p.poly(light(v, 0.14), [26.2, 39.4, 28.6, 39.4, 28.2, 50.4, 25.4, 50]); }
    if ((v = accOf(L, 'crossbelt'))) {
      p.poly(v, [22.6, 49, 27, 48.4, 46, 64, 40.6, 64]); p.poly(light(v, 0.2), [24.4, 49, 26, 48.8, 44, 64, 42.4, 64]);
      for (const [x, y] of [[29.2, 53.4], [36.4, 59.6]]) { p.poly('#d0d4dc', [x - 2.6, y, x, y - 1.8, x + 2.6, y, x, y + 1.8]); p.poly('#8a8e9a', [x - 0.6, y - 0.6, x + 0.6, y - 0.6, x, y + 1]); }
    }
    if ((v = accOf(L, 'claw'))) {
      p.poly(dark(v, 0.35), [0, 64, 0.4, 53, 4, 47.6, 10.6, 47.6, 14.6, 52, 13.4, 64]);
      p.poly(v, [1, 64, 1.2, 53.4, 4.6, 48.6, 10.2, 48.6, 13.6, 52.4, 12.6, 64]);
      p.poly(light(v, 0.5), [2.4, 60, 2.6, 53.6, 5.2, 50, 8, 50, 5, 53.4, 4, 60]);
      p.poly(dark(v, 0.35), [6, 56, 11, 54, 10.6, 55.6, 6.4, 57.6]); p.poly(dark(v, 0.35), [5.6, 60.6, 11, 58.4, 10.6, 60, 6, 62.2]);
      p.poly('#a050e0', [6.4, 48.6, 8.6, 38, 10.4, 48.4]); p.poly('#d8a0f8', [7.6, 47.4, 8.6, 40.4, 9.2, 47.4]);
    }
    if ((v = accOf(L, 'onesleeve'))) { p.poly(v, [51, 51.4, 58.6, 53.4, 63, 57.6, 64, 64, 49, 64]); p.poly(dark(v, 0.25), [58.6, 53.4, 63, 57.6, 64, 64, 58, 64]); }
    if (accOf(L, 'drills')) for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) {
      const x = 32 + sd * (24 - k * 1.6), y = 53 + k * 7.6;
      p.ell(P.hairSh, x, y, 6, 4.6);
      p.ell(P.hair, x - sd * 0.6, y - 0.8, 5, 3.6);
      p.ell(P.hairHi, x - sd * 1.6, y - 2, 2.2, 1.1);
    }
    if ((v = accOf(L, 'braidrings')) && L.back === 'twin') { p.rect(v, 7.2, 48.5, 9.4, 2.4); p.rect(v, 47.4, 48.5, 9.4, 2.4); p.rect(light(v, 0.4), 8.4, 48.9, 3, 0.8); p.rect(light(v, 0.4), 48.6, 48.9, 3, 0.8); }
    if (L.coat === 'dress' && L.collar === 'bare') p.poly(P.trim, [13, 57.5, 20, 55.5, 27, 58, 32, 56.5, 37, 58, 44, 55.5, 51, 57.5, 51, 59, 44, 57, 37, 59.6, 32, 58, 27, 59.6, 20, 57, 13, 59]);
    if ((v = accOf(L, 'petalcuff'))) for (const s of [-1, 1]) {
      const X = x => 32 + s * x;
      p.poly(P.top, [X(18.6), 56.4, X(24), 54.4, X(29.4), 57, X(30), 61.6, X(19.4), 61.6]);
      p.poly(dark(P.top, 0.3), [X(19.4), 60, X(30), 60, X(30), 61.6, X(19.4), 61.6]);
      p.poly('#2a7a74', [X(18.6), 56.4, X(24), 54.4, X(29.4), 57, X(28.6), 58.2, X(24), 56, X(19.4), 57.8]);
      p.poly(v, [X(23.2), 57.6, X(25.2), 57.6, X(25.6), 59.8, X(24.2), 61, X(22.8), 59.8]);
      p.snap(dark(v, 0.35), X(24.2) - 0.5, 58.8, 1, 1);
      for (const [a, b] of [[19.4, 23], [22.6, 26.6], [26.2, 30]]) p.poly('#f2eef0', [X(a), 61.6, X(b), 61.6, X((a + b) / 2 + 0.6), 64]);
    }
    if ((v = accOf(L, 'armorpad'))) for (const s of [-1, 1]) {
      const X = x => 32 + s * x;
      p.poly('#1e3a6a', [X(19), 58.4, X(28.4), 59.6, X(30), 64, X(17.6), 64]);
      p.poly(dark('#1e3a6a', 0.3), [X(19), 61.6, X(29.4), 62.2, X(30), 64, X(18), 64]);
      p.poly('#1c1a22', [X(19), 55.4, X(23.6), 52.6, X(28.6), 53.6, X(31), 57.6, X(30.6), 63, X(27.6), 64, X(25.2), 59.4, X(20), 58.2]);
      p.poly(v, [X(19), 55.4, X(23.6), 52.6, X(28.6), 53.6, X(31), 57.6, X(30.4), 58, X(28.2), 54.8, X(23.8), 54, X(19.8), 56.4]);
      p.poly('#9a1c2c', [X(27.8), 58.6, X(30), 58.8, X(29.8), 62.6, X(28.2), 63]);
      p.ell(v, X(26.2), 57.6, 1.8, 1.7);
      p.ell('#5ac8c0', X(26.2), 57.6, 1.2, 1.1);
      p.snap('#d8f4f0', X(26.2) - 0.8, 56.8, 0.8, 0.8);
    }
    if ((v = accOf(L, 'laceband'))) {
      const pts = [17, 64, 18.4, 55.6, 24, 53.4, 32, 54.6, 40, 53.4, 45.6, 55.6, 47, 64];
      p.poly(v, pts);
      p.clipPoly(pts, () => p.poly(dark(v, 0.1), [38, 52, 48, 52, 48, 64, 40, 64]));
      for (let x = 19.6; x < 45; x += 3.2) p.ell(light(v, 0.4), x, 55.2 - Math.abs(x - 32) * 0.06, 1.1, 0.8);
    }
    if ((v = accOf(L, 'puff'))) for (const s of [-1, 1]) {
      const x = 32 + s * 24.5;
      p.ell(dark(v, 0.14), x, 58.6, 8.4, 7.4);
      p.ell(v, x - s * 0.8, 57.6, 7.1, 6.1);
      p.ell(light(v, 0.45), x - s * 2.8, 55.2, 2.8, 1.7);
      p.poly(P.top, [x - s * 6.2, 62.6, x - s * 2, 60.8, x + s * 1.2, 64, x - s * 5.2, 64]);
    }
    if (accOf(L, 'pearls')) for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.15 + 0.7 * i / 6), x = 32 - Math.cos(a) * 9, y = 47.6 + Math.sin(a) * 7.2; p.ell('#a89c9e', x, y, 1.5, 1.5); p.ell('#fbf8f2', x - 0.3, y - 0.3, 1, 1); }
    if ((v = accOf(L, 'mandarin'))) {
      p.poly(v, [26.6, 43, 37.4, 43, 38.2, 49.2, 25.8, 49.2]);
      p.poly(dark(v, 0.35), [33, 43, 37.4, 43, 38.2, 49.2, 33.4, 49.2]);
      p.rect(P.trim, 25.8, 48.4, 12.4, 1);
      p.ell('#c8324a', 32, 50.4, 1.8, 1.8);
      p.ell('#ff8a9a', 31.6, 49.9, 0.6, 0.6);
    }
    if ((v = accOf(L, 'mantle'))) { p.poly(v, [1, 64, 4, 55, 13, 50.5, 21, 52, 16, 64]); p.poly(v, [63, 64, 60, 55, 51, 50.5, 43, 52, 48, 64]); p.poly(dark(v, 0.25), [59, 64, 58, 58, 52, 54, 48, 64]); }
    if ((v = accOf(L, 'furcape'))) for (let i = 0; i < 6; i++) { p.ell(v, 7 + i * 3.4, 57 - i * 1.1, 3.6, 3.4); p.ell(v, 57 - i * 3.4, 57 - i * 1.1, 3.6, 3.4); }
    if ((v = accOf(L, 'lavatee'))) { const lava = L.lava || '#ff7a2a'; p.poly(v, [22, 57.4, 28, 56.6, 31.4, 59.4, 29.6, 64, 21, 64, 20.2, 60]); p.snap(lava, 22, 59.6, 4.4, 0.8); p.snap(lava, 26, 60, 0.8, 3.4); p.poly(dark(P.inner, 0.25), [34, 62, 41, 58.4, 41.4, 59.4, 34.4, 63]); }
    if ((v = accOf(L, 'mecharm'))) { const pad = L.padCol || '#c8a858'; p.poly(dark(v, 0.2), [0, 64, 1, 57.6, 9, 56.6, 13, 64]); p.ell(dark(pad, 0.3), 8.6, 54.4, 8.4, 5.4, -0.25); p.ell(pad, 8.4, 53.6, 7.6, 4.6, -0.25); p.ell(light(pad, 0.35), 6.4, 52, 3, 1.4, -0.25); p.snap(L.lava || '#ff7a2a', 4, 60, 3, 0.8); }
    if ((v = accOf(L, 'capelet'))) {
      const fur = L.capeletFur || '#f4f4f8';
      p.poly(v, [1, 64, 4, 54.4, 14, 49.8, 24.6, 48.2, 26.4, 52, 22.4, 64]);
      p.poly(dark(v, 0.2), [63, 64, 60, 54.4, 50, 49.8, 39.4, 48.2, 37.6, 52, 41.6, 64]);
      p.poly(light(v, 0.22), [4.6, 55, 13, 51, 20, 49.6, 12, 53.4, 6.4, 58]);
      for (let i = 0; i < 4; i++) { p.ell(fur, 4 + i * 5.2, 63 - i * 0.3, 3.2, 2.4); p.ell(dark(fur, 0.08), 60 - i * 5.2, 63 - i * 0.3, 3.2, 2.4); }
    }
    if ((v = accOf(L, 'scarf'))) {
      p.poly(v, [17, 50.4, 22, 49.2, 26, 51, 38, 51, 42.4, 49.2, 47.6, 50.6, 46, 53.4, 32, 53.6, 19, 53.6]);
      p.poly(light(v, 0.12), [21, 50.4, 26, 51.2, 28, 52.6, 22, 52.4]);
      p.poly(v, [37, 49, 45.6, 48.4, 50, 52, 49, 64, 39.6, 64, 37.6, 56]);
      p.poly(dark(v, 0.25), [44, 50, 47.4, 50.4, 46.4, 64, 43.4, 64]);
      for (let x = 40.4; x < 49; x += 1.8) p.poly(dark(v, 0.3), [x, 61, x + 0.8, 61, x + 0.6, 64, x, 64]);
    }
    if ((v = accOf(L, 'brooch2'))) { p.poly(dark(v, 0.35), [38.4, 47.4, 40.4, 50.6, 38.4, 57.4, 36.4, 50.6]); p.poly(v, [38.4, 48.2, 39.8, 50.6, 38.4, 56, 37, 50.6]); p.snap('#8a94b4', 38, 50, 0.9, 1.4); }
    if ((v = accOf(L, 'kerchief'))) { p.poly(v, [24.5, 45.5, 39.5, 45.5, 36, 52, 32, 55.5, 28, 52]); p.ell(dark(v, 0.25), 32, 47, 2.2, 1.8); }
    if ((v = accOf(L, 'choker'))) { p.rect('#1c1a20', 27.8, 46.2, 8.4, 2); if (v !== true) p.ell(v, 32, 47.6, 1.6, 1.6); }
    if ((v = accOf(L, 'neckband'))) { p.rect(v, 26.2, 43.4, 11.6, 1.6); p.snap('#d8b050', 31.4, 43.6, 1.2, 1.2); }
    if (accOf(L, 'ruffles')) for (let y = 55; y < 64; y += 2.6) for (const sd of [-1, 1]) p.ell(P.innerSh, 32 + sd * 1.4, y, 1.6, 1);
    if ((v = accOf(L, 'feathers'))) {
      for (const [x, y, a] of [[9, 50, -0.9], [12.6, 48.4, -0.5], [16, 48.2, -0.2], [7, 54.4, -1.3]]) { p.ell(dark(v, 0.3), x, y, 4.4, 1.5, a); p.ell(v, x - 0.3, y - 0.3, 3.6, 1, a); }
      p.poly('#d8b050', [12.6, 51, 14.4, 51, 14, 58, 13, 58]); p.poly('#d8b050', [10.6, 53, 16.4, 53, 16.4, 54.2, 10.6, 54.2]);
    }
    if ((v = accOf(L, 'xstraps'))) { p.poly(dark(v, 0.15), [19, 61.4, 32, 59.4, 46, 62, 45.6, 64, 32, 61.6, 19.4, 63.6]); p.poly(v, [19, 61, 32, 59, 46, 61.6, 45.8, 63, 32, 60.8, 19.2, 62.6]); p.rect('#c8ccd4', 26, 60, 2.4, 2); }
    if ((v = accOf(L, 'vial'))) { p.rect('#d8b050', 30.6, 48.6, 2.8, 1.2); p.ell(dark(v, 0.35), 32, 52.6, 3, 3); p.ell(v, 32, 52.4, 2.5, 2.5); p.ell(light(v, 0.5), 31, 51.4, 0.9, 0.9); }
    if ((v = accOf(L, 'corset'))) for (const [x, y] of [[26.4, 56], [37.6, 56], [24.6, 61], [39.4, 61]]) p.snap(v, x - 0.5, y, 1.2, 1.2);
    if ((v = accOf(L, 'shoulderbow'))) {
      p.poly(v, [12, 53, 4.6, 48.6, 5.6, 55.4]); p.poly(v, [12, 53, 17.4, 47.4, 18.4, 54.4]);
      p.poly(dark(v, 0.25), [12, 53, 1.4, 58.4, 2.6, 61, 12.6, 55]); p.poly(v, [12.4, 54, 7, 64, 10.2, 64, 13.4, 55]);
      p.ell(dark(v, 0.35), 12, 53, 1.8, 1.6);
    }
    if ((v = accOf(L, 'hairwrap'))) { p.poly(dark(v, 0.18), [43.4, 41, 49.6, 38.4, 52.4, 45.4, 46, 48.6]); p.poly(v, [43.8, 41, 49.2, 38.8, 51.4, 44.8, 46.2, 47.4]); p.poly(dark(v, 0.1), [46, 41.6, 48.6, 40.6, 49.4, 43.6, 46.8, 44.6]); }
    if ((v = accOf(L, 'armbandr'))) p.rect(v, 54.6, 59.6, 7.4, 1.6);
    if ((v = accOf(L, 'sleeve1'))) { p.poly(v, [0, 64, 0.5, 55, 6.5, 50.2, 13, 49.4, 14.6, 64]); p.poly(light(v, 0.18), [3, 58, 7, 52, 9, 52, 5, 60]); }
    if ((v = accOf(L, 'neckstraps'))) for (const dx of [-3.4, 0, 3.4]) p.poly(v, [32 + dx - 0.8, 40, 32 + dx + 0.8, 40, 32 + dx * 1.9 + 1, 50, 32 + dx * 1.9 - 1, 50]);
    if ((v = accOf(L, 'chestpouch'))) { p.poly(v, [17, 49, 22, 48.4, 50, 64, 44, 64]); p.poly(v, [24, 52, 38, 55, 36, 64, 22, 62]); p.poly(light(v, 0.22), [25, 53, 37, 56, 36.8, 57.4, 24.8, 54.4]); p.snap('#d8b050', 30, 57.4, 2, 1.6); }
    if ((v = accOf(L, 'chevron'))) { p.poly(dark(v, 0.3), [43, 52, 49, 52, 49, 58, 43, 58]); for (const y of [53.4, 55.6]) p.poly(v, [43.6, y + 1.4, 46, y, 48.4, y + 1.4, 48.4, y + 2.2, 46, y + 0.8, 43.6, y + 2.2]); }
    if ((v = accOf(L, 'armbandL'))) p.poly(v, [1, 60.4, 9, 58.6, 9.6, 61.6, 1.2, 63.4]);
    if ((v = accOf(L, 'vestclips'))) for (const y of [54, 58.6]) for (const x of [24.6, 38.4]) p.snap(v, x, y, 1.4, 1.4);
    if ((v = accOf(L, 'haoritri'))) for (const X of [x => x, x => 64 - x]) { p.rect(v, X(2) - (X(2) > 32 ? 9 : 0), 61.4, 9, 1.2); for (let i = 0; i < 3; i++) p.poly(v, [X(3 + i * 2.6), 61.4, X(4.3 + i * 2.6), 59, X(5.6 + i * 2.6), 61.4]); }
    if ((v = accOf(L, 'xcollar'))) { p.poly(v, [28.6, 43.4, 30.2, 43.4, 32, 46.4, 31, 47.4]); p.poly(v, [35.4, 43.4, 33.8, 43.4, 32, 46.4, 33, 47.4]); }
    if ((v = accOf(L, 'iceemblem'))) {
      p.poly(dark(v, 0.3), [32, 53.6, 34, 57.6, 32, 64, 30, 57.6]);
      p.poly(v, [32, 54.4, 33.4, 57.6, 32, 63, 30.6, 57.6]);
      for (const sd of [-1, 1]) p.poly(v, [32, 57, 32 + sd * 6, 55.4, 32 + sd * 7.4, 57.6, 32 + sd * 3, 59]);
      p.poly(light(v, 0.5), [31.6, 55, 32.4, 55, 32.2, 61, 31.8, 61]);
    }
    if ((v = accOf(L, 'medals'))) { for (let i = 0; i < 3; i++) { const x = 12 + i * 3.2; p.poly('#c8303a', [x - 0.9, 52 + i * 0.8, x + 0.9, 51.6 + i * 0.8, x + 1, 57 + i * 0.8, x - 0.8, 57.4 + i * 0.8]); p.rect('#f2f2f6', x - 0.25, 52 + i * 0.8, 0.5, 5); p.ell(i === 1 ? '#c8ccd4' : '#d8b050', x, 59 + i * 0.8, 1.6, 1.6); } }
    if ((v = accOf(L, 'icebrooch'))) {
      const bx = 41, by = 55;
      for (const [x, h] of [[bx + 1.6, 8], [bx + 3.8, 10], [bx + 6, 7.4]]) { p.poly('#62c4f4', [x - 1.2, by - 1, x + 0.6, by - 1 - h, x + 1.6, by - 1.2]); p.poly('#c8f0ff', [x - 0.2, by - 1.6, x + 0.6, by + 0.4 - h, x + 0.8, by - 1.6]); }
      p.poly('#3a6ad8', [bx + 2, by + 1, bx + 9, by + 3, bx + 8, by + 7, bx + 2, by + 4]);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.6; p.ell(dark(v, 0.25), bx + Math.cos(a) * 2.4, by + Math.sin(a) * 2.4, 2, 1.6, a); p.ell(v, bx + Math.cos(a) * 2.2, by + Math.sin(a) * 2.2, 1.6, 1.2, a); }
      p.ell(dark(v, 0.4), bx, by, 1, 1);
    }
    if ((v = accOf(L, 'neckbtn'))) for (const x of [24.4, 39.6]) { p.ell('#14141c', x, 46, 1.8, 1.8); p.ell(v, x, 46, 1, 1); }
    if ((v = accOf(L, 'vestclasp'))) for (const [x, y] of [[19.6, 60], [44.4, 60]]) { p.ell('#14141c', x, y, 2.2, 2.2); p.ell(v, x, y, 1.4, 1.4); p.ell('#f2f4fa', x, y, 0.6, 0.6); }
    if ((v = accOf(L, 'rose'))) { p.ell(dark(v, 0.3), 39.6, 44.6, 2.8, 2.6); p.ell(v, 39.4, 44.3, 2.3, 2.1); p.ell(light(v, 0.4), 39, 43.8, 1, 0.9); p.snap(dark(v, 0.35), 39.6, 44.6, 0.8, 0.8); }
    if ((v = accOf(L, 'leafband'))) { for (let x = 18; x < 46; x += 3.4) p.poly(v, [x, 61.2, x + 1.8, 59.8, x + 3.6, 61, x + 1.8, 62.4]); p.poly(dark(v, 0.3), [17, 62.4, 47, 62.4, 47, 63, 17, 63]); }
    if ((v = accOf(L, 'zip'))) { p.snap(v, 31.5, 39, 1, 25); for (let y = 41; y < 64; y += 2.4) p.snap(dark(v, 0.3), 30.8, y, 0.8, 0.8); p.snap(v, 30, 38.6, 4, 0.8); }
    if ((v = accOf(L, 'stars'))) {
      const pts = [[35.6, 53.4], [38.8, 55.6], [37.4, 59.4], [40.6, 62.4]];
      for (let i = 1; i < pts.length; i++) { const [a, b] = pts[i - 1], [c, d] = pts[i]; p.poly(dark(v, 0.15), [a - 0.35, b, a + 0.35, b, c + 0.35, d, c - 0.35, d]); }
      pts.forEach(([x, y], i) => p.ell(i % 2 ? v : light(v, 0.35), x, y, i % 2 ? 1 : 1.3, i % 2 ? 1 : 1.3));
    }
    if ((v = accOf(L, 'dragonpad'))) {
      p.poly(dark(v, 0.35), [44.6, 50.6, 50.4, 46.4, 57.6, 46.6, 62.8, 50.6, 64, 58, 59, 56.4, 54.4, 59, 49.6, 56]);
      p.poly(v, [45.6, 50.2, 50.8, 46.8, 57.4, 47.2, 62, 50.6, 62.8, 56.4, 58.6, 55, 54.4, 57.4, 50.2, 55]);
      p.poly(light(v, 0.35), [47, 49.6, 51.2, 47.4, 57, 47.8, 55, 49.6, 50.4, 50.4]);
      p.poly(dark(v, 0.2), [55, 52, 60, 51.6, 62.4, 55.4, 58.6, 54.2]);
      p.ell('#d8b050', 51.4, 50.4, 1.5, 1.5);
      p.snap('#c8303a', 50.6, 54.6, 1.6, 1.4);
      p.poly('#f2f2f4', [50.6, 56, 52.8, 56, 53.6, 64, 50, 64]);
      p.poly('#d2d6de', [52, 56, 52.8, 56, 53.6, 64, 52.6, 64]);
      p.clip(61, () => p.poly(light(v, 0.2), [50.6, 56, 52.8, 56, 53.6, 64, 50, 64]));
    }
    if (accOf(L, 'halter')) for (const sd of [-1, 1]) p.poly('#1c1a20', [32 + sd * 2.4, 44.2, 32 + sd * 3.6, 44.2, 32 + sd * 6.6, 49.4, 32 + sd * 5.2, 49.4]);
    if ((v = accOf(L, 'clover'))) {
      for (const [dx, dy] of [[-1.7, 0], [1.7, 0], [0, -1.7], [0, 1.7]]) p.ell(dark(v, 0.2), 44.4 + dx, 59.8 + dy, 1.9, 1.9);
      for (const [dx, dy] of [[-1.6, 0], [1.6, 0], [0, -1.6], [0, 1.6]]) p.ell(v, 44.4 + dx, 59.8 + dy, 1.5, 1.5);
      p.snap('#6ab8ec', 43.9, 59.3, 1, 1);
    }
    if ((v = accOf(L, 'bow'))) { p.poly(v, [32, 50.5, 22.5, 46, 23.5, 56.5]); p.poly(v, [32, 50.5, 41.5, 46, 40.5, 56.5]); p.ell(dark(v, 0.35), 32, 50.5, 2.2, 2.2); p.poly(v, [30.5, 51.5, 33.5, 51.5, 35, 60, 29, 60]); if (accOf(L, 'neckband')) { p.poly('#8a5ccc', [24, 47.4, 30, 50, 24.4, 52.6]); p.poly('#d8b050', [40, 47.6, 34, 50.2, 39.6, 52.4]); } }
    if ((v = accOf(L, 'tie'))) { p.poly(v, [30.6, 46.6, 33.4, 46.6, 32.8, 48.6, 31.2, 48.6]); p.poly(v, [31.2, 48.4, 32.8, 48.4, 33.8, 60, 32, 62.4, 30.2, 60]); p.poly(light(v, 0.18), [31.4, 49, 32, 49, 31.6, 59, 30.8, 59.6]); }
    if ((v = accOf(L, 'lanyard'))) { p.snap(v, 27.5, 46, 1, 13); p.snap(v, 36, 46, 1, 13); p.rect('#f2f2f4', 26, 58, 5, 6); p.snap('#8a8aa0', 27, 60, 3, 1); }
    if (accOf(L, 'feather')) { p.poly('#ecc454', [43.5, 53, 46.5, 50.6, 45.6, 59, 43.8, 60]); p.snap('#c83030', 44.2, 57.5, 1, 1.2); }
    if ((v = accOf(L, 'piping'))) for (const sd of [-1, 1]) { const x = 32 + sd * 14.6; p.poly(v, [x - 0.5, 52.4, x + 0.5, 52.4, x + sd * 1.6 + 0.5, 64, x + sd * 1.6 - 0.5, 64]); }
    if ((v = accOf(L, 'shbuckle'))) { p.poly(dark(v, 0.3), [8.6, 53.4, 14.2, 50.2, 15.4, 52.4, 9.8, 55.6]); p.poly(v, [8.8, 52.8, 14, 49.8, 14.8, 51.4, 9.6, 54.4]); p.snap(light(v, 0.5), 11, 51.8, 1, 1); }
    if ((v = accOf(L, 'waistcorset'))) { p.poly(v, [23, 60, 41, 60, 41.6, 64, 22.4, 64]); p.ell('#d8b050', 32, 62, 1.6, 1.4); }
    if ((v = accOf(L, 'starorb'))) {
      const gold = '#d8b048', W = '#f6eef6';
      for (const X of [x => x, x => 64 - x]) p.poly(W, [X(25.4), 41, X(31), 43.6, X(29.4), 46.6, X(24.6), 45.4]);
      p.rect(gold, 28.6, 44.6, 6.8, 1.6);
      p.poly('#8a3ad0', [17, 55, 22, 53, 26, 56, 22, 58.4]);
      p.poly('#8a3ad0', [47, 55, 42, 53, 38, 56, 42, 58.4]);
      p.ell(dark(gold, 0.35), 32, 56, 6.4, 6.4);
      p.ell(gold, 32, 55.6, 5.8, 5.8);
      p.ell('#3a1a6a', 32, 55.6, 4.4, 4.4);
      p.ell('#7a3ae0', 31.4, 55, 3, 3);
      p.snap('#f0e0ff', 30.6, 54, 1, 1); p.snap('#f0e0ff', 33, 56.4, 1, 1);
      p.rect(gold, 31.4, 48, 1.2, 2);
      p.poly(W, [31, 61.4, 33, 61.4, 33.4, 64, 30.6, 64]);
    }
    if ((v = accOf(L, 'hhcharm'))) {
      const W = '#f2f4f2';
      p.poly(v, [26.6, 49.4, 37.4, 49.4, 38.6, 64, 25.4, 64]);
      p.poly(light(v, 0.25), [27.4, 52, 30, 52, 29, 64, 26.6, 64]);
      for (const X of [x => x, x => 64 - x]) p.poly(W, [X(26.4), 44.6, X(31.6), 46.6, X(28.4), 51.4]);
      p.ell('#c8302a', 32, 47.6, 1.8, 1.2);
      p.poly('#8a5a3a', [18.4, 51.6, 21, 50.4, 45.2, 63, 43, 64]);
      p.ell('#d8b048', 31.4, 55.4, 3.6, 3.6);
      p.ell('#2aa8b0', 31.4, 55.4, 2.8, 2.8);
      p.poly(W, [31.4, 52.6, 34.2, 55.4, 31.4, 58.2, 31.4, 55.4]);
      p.ell(W, 31.4, 54, 0.7, 0.7); p.ell('#2aa8b0', 31.4, 56.8, 0.7, 0.7);
      p.poly('#c8302a', [30.4, 59.2, 32.4, 59.2, 32.8, 64, 30, 64]);
    }
    if ((v = accOf(L, 'lunarbodice'))) {
      const S = '#c8ccd8';
      p.poly(S, [19.6, 57.2, 25, 55.2, 32, 57.8, 39, 55.2, 44.4, 57.2, 44, 58.4, 39, 56.6, 32, 59.2, 25, 56.6, 20, 58.4]);
      p.poly('#14141c', [29.6, 59, 34.4, 59, 33.6, 64, 30.4, 64]);
      p.poly(light(v, 0.35), [21.6, 60, 24.2, 58.8, 26.6, 60.4, 24.6, 61.6]);
      p.poly(light(v, 0.35), [42.4, 60, 39.8, 58.8, 37.4, 60.4, 39.4, 61.6]);
      p.ell(S, 32, 47.6, 2.4, 2.2);
      p.ell('#14141c', 32, 47.6, 1.4, 1.3);
      p.ell(S, 32, 51.4, 1, 1.4);
    }
    if ((v = accOf(L, 'jyarmor'))) {
      const gold = '#d8b048';
      p.poly(v, [25, 48.6, 39, 48.6, 41.4, 57, 39.6, 64, 24.4, 64, 22.6, 57]);
      p.poly(dark(v, 0.35), [32, 49.4, 37, 51, 36, 56, 32, 58.4, 28, 56, 27, 51]);
      p.poly(light(v, 0.3), [28.6, 51.4, 32, 50.2, 35.4, 51.4, 32, 54.6]);
      for (const y of [59.4, 62.2]) p.poly(dark(v, 0.3), [25.4, y, 32, y + 1.4, 38.6, y, 38.6, y + 1, 32, y + 2.4, 25.4, y + 1]);
      p.poly(gold, [24.6, 48.6, 25.6, 48.6, 23.6, 57, 22.6, 57]);
      p.poly(gold, [39.4, 48.6, 38.4, 48.6, 40.4, 57, 41.4, 57]);
      p.ell('#2a8a9a', 32, 46.6, 1.6, 1.2);
      p.poly('#2a8a9a', [31.4, 47.4, 32.6, 47.4, 33, 51.4, 31, 51.4]);
    }
    if ((v = accOf(L, 'lionpad'))) {
      const d = dark(v, 0.45);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; p.poly(d, [11 + Math.cos(a - 0.3) * 5.6, 54 + Math.sin(a - 0.3) * 5.2, 11 + Math.cos(a) * 8.2, 54 + Math.sin(a) * 7.6, 11 + Math.cos(a + 0.3) * 5.6, 54 + Math.sin(a + 0.3) * 5.2]); }
      p.ell(v, 11, 54, 6.2, 5.8);
      p.ell(light(v, 0.3), 11, 54.4, 3.8, 3.4);
      p.snap(d, 8.8, 53, 1.4, 1); p.snap(d, 11.8, 53, 1.4, 1);
      p.snap(d, 10.4, 55.6, 1.2, 1);
      p.ell(d, 11, 59.8, 2.4, 1.4);
      p.ell(v, 11, 59.8, 1.4, 0.7);
    }
    if ((v = accOf(L, 'ipcfront'))) {
      const W = '#f2f0f4', Wd = '#c8c6d4', gold = '#d8b048';
      for (const X of [x => x, x => 64 - x]) { p.poly(P.top, [X(2.6), 64, X(4.6), 58.4, X(12.6), 57, X(14.4), 64]); p.poly(v, [X(4.6), 58.4, X(12.6), 57, X(13), 59.2, X(4.8), 60.6]); p.poly('#f4f4f8', [X(4.8), 60.6, X(13), 59.2, X(13.1), 59.8, X(4.9), 61.2]); }
      p.poly(P.top, [19, 64, 20, 57, 24.4, 54, 26, 64]);
      p.poly(P.top, [38, 64, 39.6, 54, 44, 57, 45, 64]);
      p.poly(dark(P.top, 0.25), [40.6, 56, 44, 57, 45, 64, 41.4, 64]);
      p.poly(W, [24.4, 47.6, 39.6, 47.6, 41.2, 55, 40.4, 64, 23.6, 64, 22.8, 55]);
      p.poly(Wd, [36.4, 49, 39.6, 47.6, 41.2, 55, 40.4, 64, 37.2, 64]);
      p.poly(P.skin, [32, 49.4, 34, 52.4, 32, 55.6, 30, 52.4]);
      p.poly(W, [26, 40.4, 38, 40.4, 38.4, 46.4, 32, 48, 25.6, 46.4]);
      p.poly(Wd, [34.4, 40.4, 38, 40.4, 38.4, 46.4, 34.4, 47.2]);
      p.poly(W, [24.6, 45.2, 31, 46.8, 27, 50.6]);
      p.poly(W, [39.4, 45.2, 33, 46.8, 37, 50.6]);
      p.rect('#1c1a22', 27, 42.4, 10, 1.8);
      p.ell(gold, 32, 43.4, 1.3, 1.3);
      p.poly(v, [17.6, 54.2, 24.6, 50, 28.4, 51.2, 26.2, 64, 19.6, 64]);
      p.poly(dark(v, 0.3), [18.6, 57, 22, 54.6, 24.6, 57.2, 21.2, 59.6]);
      p.poly(dark(v, 0.3), [20.6, 61.4, 24, 59, 25.6, 61.6, 23.4, 64, 21.4, 64]);
      p.poly(light(v, 0.25), [19.4, 54.4, 23.6, 51.6, 24.6, 52.4, 20.8, 55.4]);
      p.poly(gold, [27.6, 51, 28.6, 51.4, 26.6, 64, 25.6, 64]);
      p.poly(v, [45.6, 51.4, 54.4, 50.4, 57.4, 54.8, 47.4, 56.2]);
      p.poly(dark(v, 0.3), [49.6, 52.6, 53, 51.8, 54.6, 54.2, 51, 54.8]);
      p.ell(gold, 52.6, 55.8, 1.4, 1.2);
      p.poly(W, [39.4, 57.2, 43.4, 57.4, 44.4, 64, 39.6, 64]);
      p.poly(Wd, [42, 57.4, 43.4, 57.4, 44.4, 64, 42.6, 64]);
      p.poly(gold, [41.6, 59.6, 42.4, 59.6, 43.2, 64, 41.2, 64]);
      p.ell(dark(gold, 0.3), 41.2, 55.8, 2.8, 2.8);
      p.ell(gold, 41.2, 55.4, 2.4, 2.4);
      p.ell('#ffe060', 41.2, 55.4, 1.2, 1.2);
      p.snap('#5ac8f0', 40.7, 58, 1, 1.2);
    }
    if ((v = accOf(L, 'lcdrape'))) {
      const gold = '#d8b048', blk = '#26262c';
      for (const X of [x => x, x => 64 - x]) { p.poly(blk, [X(5.4), 55, X(17.6), 50.6, X(19.4), 52.8, X(6.8), 57.8]); p.snap('#c8ccd4', Math.min(X(10.2), X(11.4)), 54, 1.2, 1.2); }
      p.poly(dark(v, 0.3), [21, 54.4, 25.8, 52.4, 46.4, 64, 38.4, 64]);
      p.poly(v, [21, 53.4, 25.4, 51.6, 44.4, 64, 38, 64]);
      p.poly(light(v, 0.25), [23.6, 53.6, 25, 53, 41.6, 64, 40, 64]);
      p.poly(v, [51.6, 57.4, 58.4, 55.4, 60.6, 64, 53.4, 64]);
      p.poly(dark(v, 0.3), [51.6, 57.4, 52.8, 57, 54.6, 64, 53.4, 64]);
      p.poly(dark(gold, 0.3), [17.2, 50.4, 22.6, 48.8, 25, 53.4, 22, 57.6, 18.4, 55.4]);
      p.poly(gold, [17.8, 50.6, 22.2, 49.4, 24.2, 53.2, 21.8, 56.6, 18.8, 55]);
      p.snap(light(gold, 0.45), 19.8, 51.4, 1.2, 1.2);
      p.snap('#2aa8a8', 21.4, 54, 1, 1);
      p.poly(gold, [32, 60.2, 33.4, 62, 32, 63.8, 30.6, 62]);
    }
    if ((v = accOf(L, 'ilfront'))) {
      const gold = '#d8b048', d = dark(v, 0.35);
      p.poly(P.skin, [44.6, 51.4, 51, 50, 56.4, 51, 59.4, 54.6, 52, 57, 45.4, 55.6]);
      p.poly(P.skinSh, [44.6, 51.4, 51, 50, 50.4, 51.4, 45.4, 53]);
      p.poly(v, [51.4, 56.8, 60, 54.2, 64, 57.4, 64, 64, 54.2, 64]);
      p.poly(d, [51.4, 56.8, 53.2, 56.4, 56, 64, 54.2, 64]);
      p.poly(d, [27, 50.4, 29.6, 50.4, 32.6, 59.4, 31.4, 60.4]);
      p.poly(d, [37, 50.4, 34.4, 50.4, 31.4, 59.4, 32.6, 60.4]);
      p.poly(P.skin, [32, 51.8, 34.2, 55.2, 32, 58.6, 29.8, 55.2]);
      p.poly(P.skinSh, [32, 51.8, 34.2, 55.2, 33.4, 55.2, 32, 53.2]);
      p.rect(v, 31, 59.4, 2, 4.6);
      p.poly(gold, [32, 48.6, 33.4, 50, 32, 51.6, 30.6, 50]);
      p.rect('#1a1e24', 2.4, 57, 9, 1.4);
      p.rect('#c8303a', 3.2, 58.4, 1.8, 5.6);
      p.snap('#f2f2ee', 3.6, 58.4, 1, 1);
    }
    if ((v = accOf(L, 'agarmor'))) {
      const gold = '#d8b048', sd = dark(v, 0.22), hi = light(v, 0.4);
      p.poly(sd, [19.4, 49.6, 44.6, 49.6, 46.6, 58, 40.6, 64, 23.4, 64, 17.4, 58]);
      p.poly(v, [20.4, 49.6, 43.6, 49.6, 45.4, 57.6, 39.8, 63, 24.2, 63, 18.6, 57.6]);
      p.poly(hi, [22, 51, 29, 51, 26, 58, 21, 57]);
      p.poly(dark(gold, 0.3), [32, 50.4, 36.2, 54.6, 34.6, 59.6, 32, 63.4, 29.4, 59.6, 27.8, 54.6]);
      p.poly(gold, [32, 51.4, 35.2, 54.8, 33.8, 59.2, 32, 62, 30.2, 59.2, 28.8, 54.8]);
      p.poly(gold, [28.8, 54.8, 23.4, 52.4, 25.4, 56.4]);
      p.poly(gold, [35.2, 54.8, 40.6, 52.4, 38.6, 56.4]);
      p.snap(light(gold, 0.5), 31.2, 53.4, 1.4, 2.4);
      p.rect('#a8202c', 40.6, 55, 1.2, 6.4);
      for (const X of [x => x, x => 64 - x]) {
        p.poly(sd, [X(0.4), 64, X(1.6), 55.4, X(7), 51.4, X(14.6), 51.6, X(18.4), 56, X(16.6), 64]);
        p.poly(v, [X(1.2), 63, X(2.4), 55.8, X(7.4), 52.4, X(14), 52.6, X(17.2), 56.4, X(15.8), 63]);
        p.poly(hi, [X(3.4), 56, X(7.6), 53.4, X(11), 53.6, X(5), 58]);
        p.poly(gold, [X(13), 52.4, X(15.6), 45.6, X(17.6), 49.8, X(16.2), 55.4]);
        p.poly(dark(gold, 0.3), [X(15.6), 45.6, X(17.6), 49.8, X(16.2), 55.4, X(15.6), 52]);
        p.poly(gold, [X(1.4), 60.6, X(15.6), 60.6, X(15.4), 61.6, X(1.4), 61.6]);
      }
      p.ell(dark(v, 0.4), 8.4, 57.4, 3.2, 3);
      p.ell(light(v, 0.15), 8.4, 57.2, 2.4, 2.2);
      p.ell(dark(v, 0.35), 8.4, 57.2, 1.1, 1);
    }
    if ((v = accOf(L, 'ratoga'))) {
      const gold = '#d8b048', blue = '#3a48c0', W = '#f2f2f4';
      p.poly(blue, [0, 64, 0.8, 56, 7.6, 51.6, 14, 52.4, 15.4, 64]);
      p.poly(dark(blue, 0.3), [0, 64, 0.8, 56, 3.4, 54.2, 4, 64]);
      p.poly(P.skin, [44.6, 51, 52.4, 49.8, 59.4, 52, 63, 57, 64, 64, 48.6, 64]);
      p.poly(P.skinSh, [59.4, 52, 63, 57, 64, 64, 60.6, 64]);
      p.poly(W, [40.6, 49.4, 46, 48.8, 50.6, 64, 42.6, 64]);
      p.poly(dark(W, 0.14), [46, 48.8, 47.4, 49.4, 51.8, 64, 50.6, 64]);
      p.ell(dark(gold, 0.35), 54, 55.4, 2.8, 2.8); p.ell(gold, 54, 55.2, 2.2, 2.2); p.ell(dark(gold, 0.3), 54, 55.2, 0.9, 0.9);
      p.rect('#c83a3a', 56.4, 59, 3, 0.6); p.rect('#3ab0a8', 57, 60.2, 2.2, 0.6);
      p.poly(dark(blue, 0.2), [16.4, 50.2, 23.6, 49.4, 28.6, 64, 19.4, 64]);
      p.poly(blue, [17.2, 50.2, 22.8, 49.6, 27.4, 64, 20.4, 64]);
      p.poly(gold, [17.2, 50.2, 18.2, 50.2, 21.6, 64, 20.4, 64]);
      p.ell(gold, 23, 56.4, 1.8, 1.8); p.ell(blue, 23.2, 56.6, 1, 1); p.ell(gold, 24.4, 61.4, 1.4, 1.4); p.ell(blue, 24.6, 61.6, 0.7, 0.7);
      p.poly(P.skin, [27, 46, 37, 46, 32, 61]);
      p.poly(P.skinSh, [27, 46, 37, 46, 35.8, 48.4, 28.2, 48.4]);
      for (const X of [x => x, x => 64 - x]) p.poly('#34323c', [X(24.6), 41.6, X(29), 43.4, X(30.6), 49.2, X(23.8), 51.4]);
      p.rect(gold, 31.7, 48, 0.6, 9); p.poly(gold, [32, 56.4, 33, 58, 32, 59.8, 31, 58]);
      p.poly(gold, [26.4, 43.6, 32, 45.8, 37.6, 43.6, 35.8, 47.4, 32, 48.8, 28.2, 47.4]);
      p.poly('#8a3ae0', [32, 44.6, 33.4, 46.4, 32, 48.6, 30.6, 46.4]); p.snap('#d8b4f8', 31.4, 45.6, 0.8, 0.8);
      const fe = [[3.6, 55], [6.4, 52.4], [9.6, 50.6], [12.6, 50]];
      for (const [x, y] of fe) { p.poly(dark(gold, 0.35), [x - 2.6, y + 3.4, x - 0.2, y - 5, x + 2.4, y + 3]); p.poly(gold, [x - 1.8, y + 2.6, x - 0.2, y - 3.8, x + 1.6, y + 2.4]); }
      p.ell('#f4f4f6', 8.2, 56.6, 2.2, 1.6); p.ell('#3a7ad8', 8.6, 56.6, 0.9, 0.9);
    }
    if ((v = accOf(L, 'jadecollar'))) {
      p.poly(mix(P.skin, '#2a1e20', 0.62), [24.6, 46.6, 39.4, 46.6, 42.4, 54.6, 39, 55, 32, 57.6, 25, 55, 21.6, 54.6]);
      p.poly(v, [26.2, 45.4, 37.8, 45.4, 37.2, 48.2, 34, 49.6, 30, 49.6, 26.8, 48.2]);
      p.poly(dark(v, 0.3), [26.2, 47.2, 37.8, 47.2, 37.2, 48.2, 26.8, 48.2]);
      p.ell(dark(v, 0.35), 32, 47.4, 1.6, 1.2);
      p.ell(v, 32, 52, 2.4, 2.2);
      p.ell('#5ac8c0', 32, 52, 1.6, 1.4);
      p.snap('#d8f4f0', 31, 51, 0.9, 0.9);
      for (let y = 54.4; y < 58; y += 1.6) p.snap(v, 31.5, y, 1, 1);
    }
    if ((v = accOf(L, 'knotbar'))) {
      p.poly(P.top, [25.6, 55.6, 30.6, 57, 30.4, 64, 25.2, 64]);
      p.poly(mix('#3a2a2a', P.top, 0.3), [29.8, 57.6, 34.2, 57.6, 33.8, 64, 30.2, 64]);
      p.poly('#d8b050', [30.2, 63.6, 32, 62.4, 33.8, 63.6, 33.4, 64, 32, 63.2, 30.6, 64]);
      p.rect(v, 22, 60.4, 20, 1.6);
      p.rect(dark(v, 0.3), 22, 61.6, 20, 0.5);
      for (const x of [26.4, 37.6]) { p.ell('#d8b050', x, 61.2, 1.6, 1.5); p.snap(dark('#d8b050', 0.3), x - 0.4, 60.8, 0.8, 0.8); }
    }
    if ((v = accOf(L, 'cloudbust'))) {
      for (const [a, b] of [[29.6, 25], [34.4, 39]]) p.poly('#1c1a20', [a - 0.6, 48, a + 0.6, 48, b + 0.7, 55.6, b - 0.7, 55.6]);
      p.poly(P.top, [19.6, 64, 20, 58, 22.4, 56.2, 32, 58.4, 41.6, 56.2, 44, 58, 44.4, 64]);
      p.poly(dark(P.top, 0.2), [38, 57.2, 41.6, 56.2, 44, 58, 44.4, 64, 40, 64]);
      p.poly(dark(P.top, 0.34), [22, 61.6, 27, 63, 32, 61.4, 37, 63, 42, 61.6, 42, 64, 22, 64]);
      for (const X of [x => x, x => 64 - x]) p.poly('#2a7a74', [X(19.4), 59.4, X(20), 57.4, X(23), 55.4, X(26.6), 56.6, X(21.6), 58.4, X(20.8), 60.6]);
      p.poly(dark(P.top, 0.32), [23, 56, 32, 58.6, 41, 56, 32, 59.8]);
      p.poly(v, [26.6, 57.4, 32, 59.4, 37.4, 57.4, 36, 60.6, 32, 63.6, 28, 60.6]);
      p.poly(dark(v, 0.3), [30.4, 60, 33.6, 60, 32, 62]);
      p.poly(light(v, 0.35), [27.6, 57.8, 30, 58.6, 28.6, 59.4]);
      for (const x of [25.4, 38.6]) { p.ell(v, x, 58.4, 1.2, 1); p.snap(dark(v, 0.3), x - 0.4, 58.4, 0.8, 0.6); }
    }
    if (accOf(L, 'badge')) { p.rect('#f2f2f4', 39, 55, 4.5, 5.6); p.snap('#2e5bd2', 39.6, 56.2, 3.2, 1); p.snap('#8a8aa0', 39.6, 58.2, 3.2, 1); }
    if (accOf(L, 'medal')) {
      p.poly('#2a5ad8', [50.6, 55.4, 60.6, 54.4, 61.6, 64, 51.4, 64]);
      for (let i = 0; i < 4; i++) p.poly(i % 2 ? '#f4f4f8' : '#d83040', [52.2 + i * 1.6, 55.6, 53.8 + i * 1.6, 55.4, 54.2 + i * 1.6, 61, 52.6 + i * 1.6, 61.2]);
      p.ell('#e0b848', 55.6, 62.4, 2, 1.6);
    }
    if ((v = accOf(L, 'icebow'))) {
      const bx = 35, by = 57.4;
      p.poly(v, [bx, by, bx - 9.4, by - 4.6, bx - 8.4, by + 4.4]); p.poly(v, [bx, by, bx + 8.4, by - 5, bx + 8, by + 3.6]);
      p.poly(dark(v, 0.3), [bx, by, bx - 8.4, by + 4.4, bx - 6.6, by + 2.6]); p.poly(dark(v, 0.3), [bx, by, bx + 8, by + 3.6, bx + 6.4, by + 2]);
      p.poly(v, [bx - 1.2, by + 1, bx + 1.2, by + 1, bx + 4, 64, bx + 0.6, 64]);
      p.ell('#d8b050', bx, by, 2.6, 2.2); p.ell(light('#d8b050', 0.4), bx - 0.4, by - 0.5, 1.1, 0.9);
      for (const [x, h] of [[bx + 1.6, 7.4], [bx + 3.8, 9.2], [bx + 6, 6.6]]) { p.poly('#62c4f4', [x - 1.1, by - 2.6, x + 0.5, by - 2.6 - h, x + 1.5, by - 2.8]); p.poly('#c8f0ff', [x - 0.2, by - 3.2, x + 0.5, by - 1.2 - h, x + 0.7, by - 3.2]); }
    }
    if ((v = accOf(L, 'aiguillette'))) { p.poly(v, [40, 51, 42, 51, 50, 60, 48, 60]); p.poly(v, [42, 53, 44, 53, 48, 63, 46, 63]); p.ell(v, 40.8, 51.5, 1.8, 1.8); }
    if ((v = accOf(L, 'clasps'))) for (const sd of [-1, 1]) {
      const x = 32 + sd * 8.6;
      p.ell(dark(v, 0.3), x, 50.4, 3.4, 2.2);
      p.ell(v, x, 50, 3, 1.8);
      p.ell(light(v, 0.45), x - 0.8, 49.4, 1.2, 0.7);
      p.ell('#f4f2ec', x, 53, 1.1, 1.1);
      p.poly('#e8b030', [x - 1.3, 54, x + 1.3, 54, x + 1.6, 63, x - 1.6, 63]);
      p.poly(light('#e8b030', 0.35), [x - 1.3, 54, x - 0.2, 54, x - 0.4, 63, x - 1.6, 63]);
    }
    if ((v = accOf(L, 'furtuft'))) {
      for (const [x, y, rx, ry, a] of [[10, 52, 6.4, 4.2, -0.5], [5.6, 56, 5.4, 3.4, -0.2], [12.6, 57.4, 5, 3.2, 0.3], [7, 61.4, 5.4, 3, 0.1]]) p.ell(v, x, y, rx, ry, a);
      p.poly(v, [4, 50, 9, 49.6, 6, 53]); p.poly(v, [1, 56, 4, 54.6, 3.6, 58]);
      p.ell(dark(v, 0.12), 11.4, 59.6, 3, 1.6, 0.2);
    }
    if ((v = accOf(L, 'spikepad'))) {
      p.poly(dark(v, 0.4), [0, 64, 0, 52, 6, 46.6, 16, 46, 21, 50, 20, 64]);
      p.poly(v, [1, 64, 1, 52.6, 6.4, 47.6, 15.6, 47, 19.8, 50.6, 18.8, 64]);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const x = 4 + c * 4 + r * 2, y = 55 + r * 4; p.poly(light(v, 0.3), [x, y - 1.6, x + 1.4, y, x, y + 1.6, x - 1.4, y]); }
      p.poly('#d8dce4', [6, 50.4, 15, 50.4, 13, 52.6, 8, 52.6]); p.ell('#3ad8c8', 10.6, 51.4, 1.4, 1);
      p.poly('#d8dce4', [14, 46.4, 19, 40, 17, 47.4]); p.poly('#d8dce4', [3, 50, 1, 43.4, 6, 48]);
    }
    if ((v = accOf(L, 'shcape'))) {
      p.poly(dark(v, 0.3), [21, 48.6, 13, 47.6, 5.4, 50.6, 1, 56, 0, 64, 10.6, 64, 13.4, 56.6, 18.4, 52]);
      p.poly(v, [20, 49.4, 13, 48.8, 6.4, 51.4, 2.6, 56.4, 2, 64, 9.4, 64, 12.6, 56.4, 17, 52.4]);
      p.poly(light(v, 0.25), [13, 49.4, 8, 51, 5, 55, 9.6, 52.4]);
    }
    if ((v = accOf(L, 'sidecape')) && !accOf(L, 'ipcfront')) {
      p.poly(v, [43, 48.6, 51, 47.6, 58.6, 50.6, 63, 56, 64, 64, 53.4, 64, 50.6, 56.6, 45.6, 52]);
      p.poly(dark(v, 0.22), [50.6, 56.6, 53.4, 64, 58, 64, 55, 56]);
      p.poly(light(v, 0.25), [45, 49.4, 51, 48.4, 56.6, 51.2, 50, 51.6]);
      p.poly('#c83040', [48.4, 50, 50.6, 49, 61.6, 61.6, 59.6, 62.6]);
      p.poly('#f2f4f8', [51, 55.4, 57.6, 53, 55, 57.4]);
    }
    if (accOf(L, 'brooch')) {
      p.ell('#8a909c', 44.6, 55, 4.4, 1.8); p.ell('#e2e6ee', 44.4, 54.6, 4, 1.4); p.ell('#e2e6ee', 42.6, 53.4, 1.8, 1.4); p.ell('#e2e6ee', 46.2, 53, 2, 1.6);
      p.snap('#c8384a', 44, 56.4, 1, 3);
    }
    if ((v = accOf(L, 'trdress'))) {
      p.poly(P.top, [20, 52, 27, 47, 37, 47, 44, 52]);
      p.rect('#34323e', 27.2, 45.4, 9.6, 2);
      p.poly(dark(v, 0.2), [28, 49.4, 36, 49.4, 37, 55, 32, 61, 27, 55]);
      p.poly(v, [28.8, 49.8, 35.2, 49.8, 36, 54.8, 32, 59.4, 28, 54.8]);
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - 0.3; p.ell('#f8f4ec', 48 + Math.cos(a) * 1.9, 53 + Math.sin(a) * 1.9, 1.5, 1.5); }
      p.ell('#5a7ae8', 48, 53, 0.9, 0.9);
    }
    if ((v = accOf(L, 'thcorset'))) {
      p.rect(v, 24.6, 50, 14.8, 0.9);
      p.poly(v, [27.4, 51, 32, 58.6, 36.6, 51, 35.4, 51, 32, 56.6, 28.6, 51]);
      p.ell('#8a5ae8', 32, 59, 1.7, 1.7);
      p.ell('#d8c0ff', 31.5, 58.5, 0.7, 0.7);
    }
    if ((v = accOf(L, 'keychoker'))) { p.rect(v, 27.8, 45.4, 8.4, 1.8); p.ell('#c8ccd4', 32, 48.6, 1.3, 1.3); p.snap('#c8ccd4', 31.6, 49.6, 0.9, 3); p.snap('#c8ccd4', 32.4, 51.4, 1.2, 0.8); }
    if ((v = accOf(L, 'chains'))) for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) p.snap(v, 32 + sd * (4 + i * 2.6), 61 - i * 0.4, 1.2, 0.8);
    if ((v = accOf(L, 'padlock'))) { p.poly(dark(v, 0.3), [26, 57.4, 38, 57.4, 37, 63, 32, 64.6, 27, 63]); p.poly(v, [26.6, 57.8, 37.4, 57.8, 36.4, 62.4, 32, 63.8, 27.6, 62.4]); p.poly(light(v, 0.4), [27.6, 58.4, 31.4, 58.4, 30.6, 61, 28, 60.6]); p.snap('#5a4020', 31.6, 59.6, 0.8, 1.6); }
    if ((v = accOf(L, 'hoodline'))) { p.poly(v, [19.6, 48.6, 25.2, 42.4, 26.4, 43, 21.6, 49.6]); p.poly(v, [44.4, 48.6, 38.8, 42.4, 37.6, 43, 42.4, 49.6]); }
    if ((v = accOf(L, 'pauldronr'))) { p.ell(dark(v, 0.35), 56.4, 55.4, 8.6, 6.4, 0.2); p.ell(v, 56, 54.6, 7.8, 5.6, 0.2); p.ell(light(v, 0.45), 54, 52.8, 4, 2, 0.2); p.poly(dark(v, 0.25), [50, 57.6, 63, 59.6, 62.6, 61, 49.6, 59]); }
    if ((v = accOf(L, 'gear'))) { p.ell('#26262c', 15.4, 58.6, 4.6, 4.6); p.ell(v, 15.4, 58.6, 3.6, 3.6); p.ell('#f4f4f8', 15.4, 58.6, 2.4, 2.4); p.ell('#c050a0', 15.4, 58.6, 0.8, 0.8); p.snap('#26262c', 15, 56.6, 0.8, 1.6); }
  }

  function specialBust(p, P, L) {
    if (L.style === 'terminal') {
      p.rect('#2a3040', 8, 6, 48, 40); p.rect('#081018', 11, 9, 42, 32); p.rect(dark(L.hair, 0.55), 13, 11, 38, 28);
      for (let i = 0; i < 5; i++) p.rect(L.hair, 16, 14 + i * 5, 8 + (i * 7) % 20, 2);
      p.rect('#4a5468', 24, 46, 16, 6); p.rect('#3a4050', 14, 52, 36, 12);
      return;
    }
    if (L.style === 'svarog') bustSvarog(p);
    if (L.style === 'pompom') { const u = p.u * 0.94; pomArt(pen(p.g, u, p.u * 32 - 50 * u, -4 * u), L, 1 / u); }
    if (L.style === 'cookbot') bustCookbot(p, L);
    if (L.style === 'dog') bustDog(p, L);
    if (L.style === 'beetlebot') bustBeetlebot(p, L);
    if (L.style === 'trotter') bustTrotter(p, L);
  }

  function bustTrotter(p, L) {
    const gd = L.top, hi = L.trim, dk = dark(L.top, 0.35);
    p.ell(dk, 32, 46, 27, 22); p.ell(gd, 32, 44, 26, 21); p.ell(hi, 22, 34, 9, 6);
    p.poly(gd, [12, 30, 8, 12, 22, 24]); p.poly(gd, [52, 30, 56, 12, 42, 24]); p.poly(dark(gd, 0.2), [12, 28, 10, 16, 19, 25]); p.poly(dark(gd, 0.2), [52, 28, 54, 16, 45, 25]);
    p.ell(dark(gd, 0.15), 32, 52, 10, 7); p.ell(dk, 28, 52, 2, 2.6); p.ell(dk, 36, 52, 2, 2.6);
    p.ell('#141418', 22, 40, 3, 3.4); p.ell('#141418', 42, 40, 3, 3.4); p.ell('#ffffff', 22.8, 39, 1, 1); p.ell('#ffffff', 42.8, 39, 1, 1);
    p.rect(hi, 26, 22, 12, 3); p.rect(dk, 30, 22, 4, 3);
    p.ell('#ff9aa8', 16, 48, 3, 2); p.ell('#ff9aa8', 48, 48, 3, 2);
  }

  function bustBeetlebot(p, L) {
    const sh = L.top, hi = light(L.top, 0.35), dk = dark(L.top, 0.35);
    p.ell(dk, 32, 70, 30, 20); p.ell(sh, 32, 66, 28, 18); p.ell(hi, 22, 58, 9, 5);
    p.rect(L.trim, 8, 62, 48, 4); p.rect(dark(L.trim, 0.3), 8, 65, 48, 1.4);
    p.ell(dk, 32, 34, 22, 20); p.ell(sh, 32, 32, 21, 19); p.ell(hi, 24, 22, 7, 5);
    p.rect('#141418', 16, 28, 32, 10); p.rect(L.eye, 20, 31, 24, 4); p.rect('#ffffff', 22, 32, 6, 1.4);
    p.rect(L.trim, 30, 8, 4, 8); p.ell(L.eye, 32, 7, 3, 3);
    p.rect(dk, 2, 50, 8, 16); p.rect(dk, 54, 50, 8, 16);
  }

  function bustDog(p, L) {
    const fur = L.hair, dk = dark(L.hair, 0.18);
    p.ell(dk, 32, 66, 26, 16); p.ell(fur, 32, 64, 24, 14);
    p.rect(L.top, 16, 50, 32, 4); p.ell('#ffd060', 32, 54, 2.6, 2.6);
    p.poly(fur, [10, 24, 12, 4, 24, 18]); p.poly(fur, [54, 24, 52, 4, 40, 18]);
    p.poly(L.trim, [13, 20, 14, 9, 21, 17]); p.poly(L.trim, [51, 20, 50, 9, 43, 17]);
    p.ell(dk, 32, 33, 22, 18); p.ell(fur, 32, 31, 21, 17); p.ell('#ffffff', 26, 24, 8, 5);
    p.ell('#ffffff', 32, 40, 10, 7);
    p.ell('#141418', 24, 30, 2.6, 3); p.ell('#141418', 40, 30, 2.6, 3); p.ell('#ffffff', 24.8, 29, 0.9, 0.9); p.ell('#ffffff', 40.8, 29, 0.9, 0.9);
    p.ell('#2a2a30', 32, 37, 3, 2); p.ell('#ff8aa0', 32, 44, 3, 2.4);
  }

  function bustCookbot(p, L) {
    p.ell(dark(L.top, 0.3), 32, 72, 30, 26); p.ell(L.top, 32, 70, 28, 24); p.ell(light(L.top, 0.4), 22, 60, 8, 5);
    p.rect(L.trim, 21, 45, 22, 5); p.rect(dark(L.trim, 0.25), 21, 49, 22, 1.4); p.ell('#ffd060', 32, 47.5, 2.4, 2.4);
    p.ell(L.trim, 12, 30, 3.4, 5.4); p.ell(L.trim, 52, 30, 3.4, 5.4);
    p.ell(dark(L.top, 0.28), 32, 31, 20.5, 16.5); p.ell(L.top, 32, 30, 19.5, 15.5); p.ell(light(L.top, 0.45), 24, 23, 6, 3.4);
    p.ell('#0c1420', 32, 31, 14.5, 9.6);
    p.rect(L.eye, 24.5, 26.5, 4.4, 5); p.rect(L.eye, 35.1, 26.5, 4.4, 5); p.rect(L.eye, 27, 34.5, 10, 2.2); p.rect(L.eye, 25.6, 33.4, 1.8, 1.6); p.rect(L.eye, 36.6, 33.4, 1.8, 1.6);
    p.rect(L.hair, 20, 9, 24, 8); p.rect(dark(L.hair, 0.12), 20, 14.6, 24, 2.4);
    p.ell(L.hair, 24, 7.5, 7, 6); p.ell(L.hair, 32, 4.6, 8, 6.4); p.ell(L.hair, 40, 7.5, 7, 6); p.ell(light(L.hair, 0.5), 29, 3.4, 3.4, 2);
  }

  const pomMirror = (s, pts) => pts.map((v, i) => (i % 2 || s < 0 ? v : 100 - v));

  function pomLine(p, col, pts, w) {
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const x0 = pts[i], y0 = pts[i + 1], x1 = pts[i + 2], y1 = pts[i + 3], d = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / d * w / 2, ny = (x1 - x0) / d * w / 2;
      p.poly(col, [x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny]);
    }
    for (let i = 0; i < pts.length; i += 2) p.ell(col, pts[i], pts[i + 1], w / 2, w / 2);
  }

  function pomLimbs(p, L) {
    const M = pomMirror, DK = L.ear, DKh = mix(DK, '#9a98b4', 0.3), IN = mix(L.hair, '#d4c6bc', 0.45), INs = mix(L.hair, '#8c7e90', 0.45);
    for (const s of [-1, 1]) {
      p.poly(DK, M(s, [31, 37, 27, 46, 22, 60, 17, 74, 12, 85, 8.6, 92, 10, 96.6, 15.6, 97.4, 21, 93, 26.4, 83, 31.6, 69, 35.6, 55, 37.6, 43]));
      p.poly(DKh, M(s, [21.4, 64, 17.6, 74, 14, 82, 11.6, 87, 13.4, 87.4, 16.4, 82.6, 20, 74.6, 23.4, 66]));
      p.poly(IN, M(s, [32.4, 39.6, 29.6, 44, 26.8, 51.6, 24.4, 59.4, 25.6, 66, 26.4, 72, 22, 85.4, 17.2, 94, 15.8, 97.2, 21, 93, 26.4, 83, 31.6, 69, 35.6, 55, 37.6, 43]));
      p.poly(INs, M(s, [29.6, 44, 26.8, 51.6, 24.4, 59.4, 25.6, 66, 26.4, 72, 27.4, 69.4, 26.8, 62.4, 27.6, 54, 30.6, 45.4]));
      p.poly(INs, M(s, [21.6, 88, 18.6, 93.4, 17.2, 96.6, 21, 93, 23.6, 88.6]));
    }
    for (const s of [-1, 1]) {
      p.poly(DK, M(s, [40.4, 85, 48, 85, 47.6, 96, 40.8, 96]));
      p.ell('#f6f2ea', s < 0 ? 44 : 56, 97.4, 4.8, 2.4);
      p.ell('#d4d0dc', s < 0 ? 44.6 : 56.6, 98.4, 3.6, 1.1);
    }
    p.poly(mix(DK, '#0c0a12', 0.3), [56.4, 85, 60, 85, 59.6, 96, 57, 96]);
  }

  function pomArt(p, L, q) {
    if (L.coat === 'pajamas') return pomPajamas(p, L, q);
    if (L.coat === 'chef') return pomChef(p, L, q);
    const fine = q < 1.3, lw = Math.max(0.9, q * 0.95);
    const FUR = L.hair, FURs = mix(FUR, '#9c8ea4', 0.3), DK = L.ear, DKh = mix(DK, '#9a98b4', 0.3);
    const RED = L.top, REDs = dark(RED, 0.34), REDh = light(RED, 0.16);
    const GOLD = L.trim, GOLDs = mix(GOLD, '#6a3a14', 0.4), GOLDh = light(GOLD, 0.55);
    const VIS = '#1d1b26', VISh = '#55536a', COL = L.beard || '#eee0c0', COLs = mix(COL, '#9a8270', 0.36);
    const PAW = '#f6f2ea', WH = '#fbfaf6', WHs = '#d4d0dc', LENS = '#dde2ea', LENSs = '#a8aebe';
    const M = pomMirror, line = (col, pts, w) => pomLine(p, col, pts, w);
    const trefoil = (x, y, r) => {
      for (const [dx, dy] of [[-0.95, 0.55], [0.95, 0.55], [0, -1.05]]) p.ell(GOLDs, x + dx * r, y + dy * r + 0.25 * r, r, r);
      for (const [dx, dy] of [[-0.95, 0.55], [0.95, 0.55], [0, -1.05]]) p.ell(GOLD, x + dx * r, y + dy * r, r * 0.92, r * 0.92);
      p.ell(GOLD, x, y, r * 0.8, r * 0.8);
      if (fine) p.ell(GOLDh, x - r * 0.3, y - r * 1.3, r * 0.4, r * 0.32);
    };

    pomLimbs(p, L);

    p.poly(RED, [36.4, 62.6, 63.6, 62.6, 66.8, 71, 68, 83.4, 66.4, 88.8, 33.6, 88.8, 32, 83.4, 33.2, 71]);
    p.poly(REDs, [58, 64, 63.6, 62.6, 66.8, 71, 68, 83.4, 66.4, 88.8, 59.6, 88.8, 61.4, 76]);
    p.poly(REDh, [37, 64.4, 40, 64.4, 37.4, 80, 34, 84, 34.2, 72]);
    p.poly(DK, [32.4, 86.4, 67.6, 86.4, 66.4, 89.2, 33.6, 89.2]);
    p.poly(DK, [42.8, 64.6, 57.2, 64.6, 59.6, 77, 58.4, 88.8, 41.6, 88.8, 40.4, 77]);
    p.poly(FUR, [44.4, 65, 55.6, 65, 57.8, 77, 56.8, 88, 43.2, 88, 42.2, 77]);
    p.poly(FURs, [53.6, 66, 55.6, 65, 57.8, 77, 56.8, 88, 53.8, 88, 55.2, 77]);
    p.poly(DK, [32.6, 84, 38.4, 80.6, 42.2, 86.4, 41.6, 88.8, 33.6, 88.8]);

    for (const [x, y] of [[44.6, 74.4], [46.8, 76.6], [49.2, 78.6], [51.6, 80.2], [53.6, 81.6]]) { p.ell(GOLDs, x, y + 0.4, 1.2, 1); p.ell(GOLD, x, y, 1.1, 0.9); }
    p.ell(GOLDs, 55.6, 83.4, 1.4, 1.4); p.ell(GOLD, 55.6, 83.2, 1.1, 1.1);
    p.ell(GOLDs, 55.6, 89.4, 5, 5); p.ell(GOLD, 55.4, 88.8, 4.6, 4.6); p.ell(WH, 55.4, 88.8, 3.4, 3.4);
    p.ell(WHs, 56.2, 89.6, 2.6, 2.6); p.ell(WH, 55.2, 88.6, 2.6, 2.6);
    line('#3a3448', [55.4, 88.8, 55.4, 86.2], lw * 0.7); line('#3a3448', [55.4, 88.8, 57.4, 89.8], lw * 0.7);
    if (fine) p.ell(GOLDh, 53.4, 86.4, 1.3, 0.8, -0.6);

    for (const s of [-1, 1]) {
      p.poly(s < 0 ? RED : REDs, M(s, [37.4, 63.4, 32.8, 65.8, 28.6, 77, 28.8, 81, 36, 81, 38.4, 71.4]));
      if (s < 0) p.poly(REDh, [33.4, 66.6, 35.4, 66, 31.6, 78.6, 29.6, 79]);
      p.poly(DK, M(s, [27.4, 79, 36.8, 79, 37.4, 85.2, 26.8, 85.2]));
      p.poly(DKh, M(s, [27.6, 79.4, 36.6, 79.4, 36.7, 80.6, 27.5, 80.6]));
      p.ell(PAW, s < 0 ? 32 : 68, 87, 3.8, 2.8);
      p.ell(WHs, s < 0 ? 32.6 : 68.6, 88.4, 2.6, 1.2);
    }

    p.poly(GOLDs, [60.6, 65.6, 79.6, 62.8, 81.6, 75.4, 62.4, 78.8]);
    p.poly(GOLD, [60.6, 65, 79.4, 62.2, 81, 74.6, 62.2, 77.8]);
    p.poly(RED, [61, 66.8, 79.4, 64.2, 80.6, 72.8, 62.2, 76]);
    p.poly(REDs, [62, 73.6, 80.4, 70.6, 80.6, 72.8, 62.2, 76]);
    p.ell(GOLD, 71, 69.8, 3.6, 3.4, -0.15); p.ell(RED, 71, 69.8, 2.5, 2.3, -0.15); p.ell(GOLD, 71, 69.8, 1.3, 1.2);
    if (fine) { line(GOLD, [64, 70.8, 68, 70.2], lw * 0.6); line(GOLD, [74, 69.2, 78.2, 68.6], lw * 0.6); }

    p.ell(COLs, 50, 63.4, 13.4, 5.6);
    for (const [x, y, r] of [[37.6, 61.6, 3.4], [40.4, 64.6, 3.6], [44.6, 66.6, 3.6], [50, 67.4, 3.8], [55.4, 66.6, 3.6], [59.6, 64.6, 3.6], [62.4, 61.6, 3.4]]) { p.ell(COLs, x, y + 0.7, r, r * 0.9); p.ell(COL, x, y, r * 0.94, r * 0.84); }
    p.ell(COL, 50, 62.4, 12.6, 4.6);
    p.poly(WHs, [46.6, 66.4, 53.4, 66.4, 55.6, 74.4, 51.4, 71.8, 50, 75.4, 48.6, 71.8, 44.4, 74.4]);
    p.poly(WH, [46.6, 66, 53.2, 66, 54.6, 73, 51.2, 70.6, 50, 73.6, 48.8, 70.6, 45.4, 73]);
    trefoil(50, 64.2, 2.1);

    p.ell(COLs, 50, 64, 13, 3.6);
    pomFace(p, L, q);

    p.poly(RED, [32, 37.4, 68, 37.4, 70.6, 3, 29.4, 3]);
    p.poly(REDs, [61.8, 37.4, 68, 37.4, 70.6, 3, 63.4, 3]);
    p.poly(REDh, [33.6, 37.4, 36.4, 37.4, 34.4, 3, 31.6, 3]);
    if (fine) for (let y = 6; y < 33; y += 3.2) p.poly(REDs, [60.2, y, 60.8, y, 60.9, y + 1.8, 60.3, y + 1.8]);
    for (const s of [-1, 1]) {
      p.poly(GOLD, M(s, [29.4, 3, 31.6, 3, 33.8, 37.4, 32, 37.4]));
      p.poly(GOLDs, M(s, [27.6, 24.6, 33.4, 25.6, 34.4, 37.6, 27.4, 38.6]));
      p.poly(GOLD, M(s, [28, 24.2, 33.2, 25.2, 34, 37, 27.8, 38]));
      for (const y of [26.6, 30.2, 33.8]) p.poly(GOLD, M(s, [28.2, y, 26.4, y + 0.4, 26.4, y + 2, 28.2, y + 2.2]));
      if (fine) p.poly(GOLDh, M(s, [28.8, 25.2, 30, 25.4, 30.4, 36.6, 29, 37]));
    }
    p.ell(VIS, 50, 2.4, 20.8, 2); p.rect(VIS, 29.2, 0.6, 41.6, 2.6); p.ell(VISh, 50, 1.6, 16, 0.7);
    p.poly(GOLDs, [39.4, 6.2, 60.6, 6.2, 61.8, 8.2, 60.6, 10.4, 39.4, 10.4, 38.2, 8.2]);
    p.poly(GOLD, [39.6, 5.8, 60.4, 5.8, 61.4, 7.8, 60.4, 9.8, 39.6, 9.8, 38.6, 7.8]);
    p.poly(REDs, [41, 6.8, 59, 6.8, 59.6, 7.8, 59, 8.8, 41, 8.8, 40.4, 7.8]);
    if (fine) for (const x of [43, 46.4, 49.6, 52.8, 56.2]) p.rect(GOLD, x, 7.3, 1.6, 1);
    trefoil(34.6, 7.6, 1.3); trefoil(65.4, 7.6, 1.3);

    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), r0 = 9, r1 = 12.2, w = 0.2;
      p.poly(GOLDs, [50 + Math.cos(a - w) * r0, 25.6 + Math.sin(a - w) * r0, 50 + Math.cos(a - w * 0.7) * r1, 25.6 + Math.sin(a - w * 0.7) * r1, 50 + Math.cos(a + w * 0.7) * r1, 25.6 + Math.sin(a + w * 0.7) * r1, 50 + Math.cos(a + w) * r0, 25.6 + Math.sin(a + w) * r0]);
      p.poly(GOLD, [50 + c * r0 - s * 1.5, 25 + s * r0 + c * 1.5, 50 + c * (r1 - 0.4) - s * 1.1, 25 + s * (r1 - 0.4) + c * 1.1, 50 + c * (r1 - 0.4) + s * 1.1, 25 + s * (r1 - 0.4) - c * 1.1, 50 + c * r0 + s * 1.5, 25 + s * r0 - c * 1.5]);
    }
    p.ell(GOLDs, 50, 25.6, 10.4, 10.4); p.ell(GOLD, 50, 25, 10, 10);
    if (fine) p.ell(GOLDh, 45.4, 18.6, 3.2, 1.6, -0.6);
    p.ell(GOLDs, 50, 25.2, 7.8, 7.8); p.ell('#4a4858', 50, 25.2, 7, 7);
    p.ell(LENSs, 50, 25.2, 6, 6); p.ell(LENS, 49.4, 24.6, 5.4, 5.4);
    if (fine) p.clipPoly([44, 19, 56, 19, 56, 31, 44, 31], () => { for (let x = 45.4; x < 55; x += 1.8) p.rect(LENSs, x, 19.4, 0.36, 11.6); for (let y = 20.6; y < 30; y += 1.8) p.rect(LENSs, 44.2, y, 11.6, 0.36); });
    p.ell(WH, 47.4, 22.6, 2.6, 1.8, -0.6);
    p.ell(GOLDs, 50, 13.6, 2.7, 2.7); p.ell(GOLD, 50, 13.3, 2.5, 2.5); p.ell(WH, 50, 13.3, 1.7, 1.7);
    if (fine) { line('#3a3448', [50, 13.3, 50, 12.1], 0.5); line('#3a3448', [50, 13.3, 50.9, 13.7], 0.5); }
    p.rect(GOLD, 49.2, 15.6, 1.6, 1.4);

    p.poly(GOLDs, [26.6, 36.4, 73.4, 36.4, 74.8, 39.4, 68.6, 43.6, 50, 45.2, 31.4, 43.6, 25.2, 39.4]);
    p.poly(GOLD, [26.8, 35.8, 73.2, 35.8, 74.4, 38.8, 68.4, 42.8, 50, 44.4, 31.6, 42.8, 25.6, 38.8]);
    p.poly(VIS, [27.6, 35.4, 72.4, 35.4, 73.2, 38, 67.8, 41.4, 50, 42.8, 32.2, 41.4, 26.8, 38]);
    p.poly(VISh, [32, 36.2, 54, 36.2, 52.4, 37.6, 33.6, 38.4]);
    if (fine) for (const x of [57.4, 59.4, 61.4, 63.4, 65.4]) p.poly(GOLD, [x, 38.6, x + 1.2, 38.4, x + 1.2, 39.8, x, 40]);
  }

  function pomFace(p, L, q) {
    const fine = q < 1.3, M = pomMirror, FUR = L.hair, FURs = mix(FUR, '#9c8ea4', 0.3), DK = L.ear, WH = '#fbfaf6';
    for (const s of [-1, 1]) p.poly(FURs, M(s, [31, 49, 27.6, 55.4, 31.6, 54.6, 30, 58.6, 34.4, 56]));
    p.ell(FURs, 50.8, 50.4, 21, 14.6);
    p.ell(FUR, 49.6, 49.6, 20.6, 14.2);
    for (const s of [-1, 1]) p.poly(FUR, M(s, [30.4, 48, 27.8, 54.4, 31.6, 53.6, 30.6, 57.2, 34.4, 54.6]));
    p.poly(DK, [29.4, 45, 30.6, 38, 69.4, 38, 70.6, 45, 66, 42.2, 57.6, 41.2, 51, 46.8, 50, 47.6, 49, 46.8, 42.4, 41.2, 34, 42.2]);

    for (const s of [-1, 1]) {
      const ex = s < 0 ? 40 : 60, ey = 50.4, io = -s * 0.5;
      p.ell(FURs, ex, ey + 0.4, 5.6, 6);
      p.ell(WH, ex, ey, 5, 5.6);
      p.ell('#1c3c94', ex + io, ey + 0.6, 3.9, 4.8);
      p.ell(L.eye, ex + io, ey + 1.6, 3.5, 3.7);
      p.ell(mix(L.eye, '#c0f4ff', 0.55), ex + io, ey + 3.2, 2.6, 1.8);
      p.ell('#0e1434', ex + io, ey + 0.8, 1.7, 2.5);
      p.ell(WH, ex + io - 1.4, ey - 1.2, 1.3, 1.3);
      if (fine) p.ell(WH, ex + io + 1.5, ey + 2.6, 0.6, 0.6);
      p.poly(FUR, M(s, [33, 40, 47.4, 40, 47.4, 46.8, 46.4, 47, 34.8, 45.4, 33, 46]));
      p.poly('#1c1622', M(s, [33.2, 46.8, 34.4, 44.6, 46.8, 45.8, 46.4, 47.8, 35, 46.6]));
      p.poly('#1c1622', M(s, [34.6, 45.4, 32, 43.8, 32.8, 47]));
    }
    p.poly(DK, [41.6, 41, 47.6, 45.6, 50, 50.4, 52.4, 45.6, 58.4, 41]);

    p.ell('#f4a0aa', 32.4, 56.4, 4.2, 2.4); p.ell('#f4a0aa', 67.6, 56.4, 4.2, 2.4);
    if (q < 0.8) pomLine(p, '#6a3040', [46.2, 56.8, 48.1, 58.4, 50, 57, 51.9, 58.4, 53.8, 56.8], 1.1);
    else {
      const mouth = q < 1.3 ? ['X..X..X', '.XX.XX.'] : ['X.X', '.X.'];
      mouth.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') p.snap('#6a3040', 50 + (i - row.length / 2) * q, 56.6 + j * q, q * 0.9, q * 0.9); }));
    }
  }

  function pomPajamas(p, L, q) {
    const fine = q < 1.3, lw = Math.max(0.9, q * 0.95), M = pomMirror, line = (col, pts, w) => pomLine(p, col, pts, w);
    const BL = L.top, BLs = mix(BL, '#3a5e94', 0.45), WT = L.stripe, WTs = mix(WT, BL, 0.5);
    const CAP = L.cap, CAPs = mix(CAP, '#3a5e94', 0.45), CAPh = light(CAP, 0.38);
    const GOLD = L.trim, GOLDs = mix(GOLD, '#6a3a14', 0.4), GOLDh = light(GOLD, 0.55);
    const RUF = L.beard, RUFs = mix(RUF, '#9c9ab0', 0.3), CR = L.bib, GEM = L.gem;
    const pitch = Math.max(3.6, 4 * q);
    const stripes = col => { for (let i = -8; i <= 8; i++) p.snap(col, 50 + i * pitch - pitch / 4, 58, pitch / 2, 36); };

    pomLimbs(p, L);

    const gown = [37.4, 62.6, 62.6, 62.6, 65.8, 71, 68.8, 85, 69.6, 91.8, 30.4, 91.8, 31.2, 85, 34.2, 71];
    const shade = [60.6, 58, 74, 58, 74, 94, 63, 94];
    p.poly(WT, gown);
    p.clipPoly(gown, () => {
      stripes(BL);
      p.clipPoly(shade, () => { p.rect(WTs, 58, 58, 16, 36); stripes(BLs); });
      p.rect(BLs, 28, 89.8, 44, 3);
    });

    p.poly(GOLDs, [38.4, 64.6, 61.6, 64.6, 61, 72.2, 55.4, 82.6, 50, 77.4, 44.6, 82.6, 39, 72.2]);
    p.poly(GOLD, [38.4, 64, 61.6, 64, 61, 71.6, 55.4, 82, 50, 76.8, 44.6, 82, 39, 71.6]);
    p.poly(CR, [39.8, 64, 60.2, 64, 59.6, 71.2, 55, 79.6, 50, 74.8, 45, 79.6, 40.4, 71.2]);
    if (fine) for (const x of [45.2, 54.8]) { p.ell(GOLD, x, 73, 1.7, 0.6, 0.785); p.ell(GOLD, x, 73, 1.7, 0.6, -0.785); p.ell(GOLDh, x, 73, 0.5, 0.5); }

    line(GOLD, [55.4, 86.8, 53, 89.6, 48.8, 91.2, 44.6, 91.8], lw * 0.8);
    p.ell(GOLDs, 54.8, 85.6, 2, 2); p.ell(GOLD, 54.6, 85.2, 1.7, 1.7);
    if (fine) p.ell(GOLDh, 54, 84.6, 0.6, 0.5);
    line('#3a414e', [56.4, 85, 58.8, 84.4], lw * 0.55);

    for (const s of [-1, 1]) {
      const sleeve = M(s, [37.4, 63.4, 32.8, 65.8, 28.6, 77, 28.8, 81, 36, 81, 38.4, 71.4]), cx = s < 0 ? 32.4 : 67.6;
      p.poly(s < 0 ? WT : WTs, sleeve);
      p.clipPoly(sleeve, () => stripes(s < 0 ? BL : BLs));
      p.ell(RUFs, cx, 82.6, 5.6, 3.3);
      p.ell(RUF, cx - s * 0.2, 82, 5.2, 2.9);
      for (const dx of [-3, 0, 3]) p.ell(RUF, cx + dx, 80.6, 2, 1.6);
      p.ell('#f6f2ea', cx - s * 0.4, 86.6, 3.6, 2.6);
      p.ell('#d4d0dc', cx - s * 0.4 + 0.6, 88, 2.6, 1.1);
    }

    p.ell(RUFs, 50, 63.6, 13.8, 5.6);
    for (const [x, y, r] of [[37.6, 61.4, 3.2], [40.4, 64.2, 3.4], [44.6, 66, 3.4], [50, 66.6, 3.6], [55.4, 66, 3.4], [59.6, 64.2, 3.4], [62.4, 61.4, 3.2]]) { p.ell(RUFs, x, y + 0.8, r, r * 0.9); p.ell(RUF, x, y, r * 0.94, r * 0.84); }
    p.ell(RUF, 50, 62.4, 12.8, 4.6);
    if (fine) for (const [x, y] of [[42, 64.6], [47.4, 66.2], [53.2, 66.2], [58.4, 64.4]]) p.ell(RUFs, x, y, 1.2, 0.6);
    p.ell(RUFs, 50, 64, 13, 3.4);

    pomFace(p, L, q);

    const droop = [36, 10.6, 28.4, 13.6, 22.4, 20.4, 18.8, 28.6, 17.8, 37.2, 19.4, 45, 24.4, 46.6, 25.8, 40.4, 26.6, 33, 29.2, 25.4, 33.6, 18.8];
    p.poly(CAP, droop);
    p.poly(CAPs, [22.4, 20.4, 18.8, 28.6, 17.8, 37.2, 19.4, 45, 24.4, 46.6, 22.6, 40.6, 22.2, 32.4, 24.6, 24.6]);
    p.poly(CAP, [26.6, 39.4, 25.8, 30.6, 28.4, 21, 33.6, 13.2, 41.6, 7.8, 50.6, 5.8, 59.6, 6.8, 67, 10.6, 71.8, 16.8, 74, 24.8, 74, 34]);
    p.poly(CAPs, [64.6, 9.6, 67, 10.6, 71.8, 16.8, 74, 24.8, 74, 34, 68.6, 35.2, 69.4, 24.6, 67.2, 15.6]);
    p.poly(CAPh, [37.4, 12.8, 44.2, 9, 51.6, 8, 50.2, 11.2, 43.6, 13.4, 38.6, 17.6]);
    if (fine) { line(CAPs, [30.6, 22, 27.4, 30.4, 27, 37.6], 0.8); line(CAPs, [44, 16.6, 38.6, 24, 36.4, 34], 0.7); }

    p.poly(GOLDs, [25.8, 38.6, 74.4, 32.6, 75, 38.6, 26.6, 44.4]);
    p.poly(GOLD, [25.8, 37.8, 74.4, 31.8, 74.8, 37.4, 26.4, 43.2]);
    p.poly(GOLDh, [26, 38.4, 74.2, 32.4, 74.3, 33.6, 26.2, 39.6]);
    if (fine) line(GOLDs, [27.4, 41.6, 73.6, 36.2], 0.5);
    p.poly(GOLDs, [70.4, 32.8, 75.6, 32, 76.6, 40.6, 71.4, 41.4]);
    p.poly(GOLD, [70.4, 32.2, 75.4, 31.4, 76.2, 39.8, 71.2, 40.6]);

    p.ell(GOLDs, 58.8, 24.8, 9.8, 9.8);
    p.ell(GOLD, 58.6, 24.2, 9.6, 9.6);
    p.ell(CAP, 63, 21.6, 6.6, 6.6);
    if (fine) { line(GOLDh, [51.2, 20.8, 52.2, 26.8, 55.8, 31.4], 0.8); line(GOLDs, [51, 26.8, 52.8, 28.8, 55.2, 29.8], 0.7); for (const [x, y] of [[51.6, 28.6], [53, 30], [54.6, 30.8]]) line(GOLDs, [x, y, x - 0.4, y + 1.3], 0.5); }
    p.ell(mix(GEM, '#0c1e48', 0.45), 62.8, 23.6, 2.7, 3.2);
    p.ell(GEM, 62.6, 23.2, 2.4, 2.9);
    p.poly(GEM, [60.9, 21.6, 62, 17.8, 64.3, 21.4]);
    p.ell(light(GEM, 0.7), 61.8, 22.2, 0.8, 1.1);

    p.ell(RUFs, 23.4, 51.4, 6.9, 6.6);
    p.ell(RUF, 22.8, 50.4, 6.4, 6);
    for (const [dx, dy] of [[-4.2, -2.4], [-1.2, -4.8], [3, -4], [4.8, -0.6], [-4.8, 1.4]]) p.ell(RUF, 22.8 + dx, 50.4 + dy, 2.2, 2);
    if (fine) p.ell(RUFs, 24.8, 53.2, 2.6, 1.5);
  }

  function pomChef(p, L, q) {
    const fine = q < 1.3, lw = Math.max(0.9, q * 0.95), M = pomMirror, line = (col, pts, w) => pomLine(p, col, pts, w);
    const WT = L.top, WTs = '#d6d2c8', WTh = '#ffffff';
    const AP = L.apron, APs = dark(AP, 0.3), APh = light(AP, 0.18);
    const SC = L.scarf, SCs = dark(SC, 0.28);
    const GOLD = L.trim, GOLDs = mix(GOLD, '#6a3a14', 0.4), GOLDh = light(GOLD, 0.55);
    const CAP = L.cap, CAPs = '#d8d6e2', RUF = L.beard, RUFs = '#d4d0dc';

    pomLimbs(p, L);

    p.poly(WT, [36, 62.6, 64, 62.6, 67, 72, 68.4, 86, 67, 90, 33, 90, 31.6, 86, 33, 72]);
    p.poly(WTs, [58, 63.4, 64, 62.6, 67, 72, 68.4, 86, 67, 90, 59.4, 90, 61, 76]);
    p.poly(AP, [39, 71, 61, 71, 63, 89.6, 37, 89.6]);
    p.poly(APs, [56, 71, 61, 71, 63, 89.6, 57.4, 89.6]);
    p.poly(APh, [40, 72, 43, 72, 41.8, 88, 38.6, 88]);
    p.rect(GOLD, 38.6, 70.4, 22.8, 1.6);
    p.poly(WT, [44, 76, 56, 76, 55.4, 84.4, 50, 86, 44.6, 84.4]);
    p.rect(GOLD, 44, 76, 12, 1.2);
    for (const y of [66.2, 69]) { p.ell(GOLD, 45.4, y, 1.1, 1.1); p.ell(GOLD, 54.6, y, 1.1, 1.1); }

    for (const s of [-1, 1]) {
      p.poly(s < 0 ? WT : WTs, M(s, [37.4, 63.4, 32.8, 65.8, 28.6, 77, 28.8, 81.4, 36, 81.4, 38.4, 71.4]));
      p.poly(AP, M(s, [28, 79.4, 36.6, 79.4, 37, 83.2, 27.6, 83.2]));
      p.ell('#f6f2ea', s < 0 ? 32 : 68, 86.6, 3.8, 2.8);
    }

    p.ell('#5a3620', 72, 73, 1.6, 8, -0.35);
    p.ell('#b8c2d0', 75.4, 65.4, 5.2, 3.8, -0.35);
    p.ell('#eef4fc', 74.8, 64.8, 3.8, 2.5, -0.35);

    p.ell(RUFs, 50, 63.4, 13.4, 5.2);
    p.ell(RUF, 50, 62.4, 12.6, 4.4);
    p.poly(SCs, [41, 63.6, 59, 63.6, 55.6, 72.8, 50, 69.6, 44.4, 72.8]);
    p.poly(SC, [41.6, 63, 58.4, 63, 55, 71.4, 50, 68.4, 45, 71.4]);
    p.ell(GOLDs, 50, 66.2, 2.4, 2.4); p.ell(GOLD, 50, 65.8, 2.1, 2.1);
    if (fine) p.ell(GOLDh, 49.4, 65.2, 0.8, 0.6);

    pomFace(p, L, q);

    p.ell(CAPs, 36, 17, 10, 9.5); p.ell(CAPs, 64, 17, 10, 9.5); p.ell(CAPs, 50, 12.6, 13.5, 11);
    p.ell(CAP, 35.6, 16.2, 9.6, 9); p.ell(CAP, 63.6, 16.2, 9.6, 9); p.ell(CAP, 49.6, 11.8, 13, 10.6);
    p.ell(WTh, 44, 8.6, 6, 4);
    p.poly(CAP, [30.4, 18, 69.6, 18, 68.2, 37.6, 31.8, 37.6]);
    p.poly(CAPs, [61.4, 18, 69.6, 18, 68.2, 37.6, 60.6, 37.6]);
    if (fine) for (const x of [38, 44, 50, 56, 62]) line(CAPs, [x, 18.6, x + (x - 50) * 0.06, 30], 0.7);
    p.poly(AP, [30.8, 31.6, 69.2, 31.6, 69.8, 38.2, 30.2, 38.2]);
    p.poly(APs, [61, 31.6, 69.2, 31.6, 69.8, 38.2, 61.2, 38.2]);
    p.rect(GOLD, 30.2, 36.8, 39.6, 2);
    p.ell(GOLDs, 50, 34.8, 3.8, 3.8); p.ell(GOLD, 50, 34.4, 3.4, 3.4);
    p.ell('#fff4d8', 50, 34.4, 2, 2);
  }

  function bustSvarog(p) {
    const { P, Ph, Pd, Pk, W, Ws, C, Ch, Cd, L, Ls, Fu, Fh, E, Eh, Er } = G.SVAROG;
    p.poly(C, [0, 64, 1, 42, 12, 32, 52, 32, 63, 42, 64, 64]);
    p.poly(Cd, [52, 32, 63, 42, 64, 64, 54, 64, 50, 44]);
    p.poly(Ch, [12, 32, 20, 32, 14, 46, 10, 64, 1, 64, 1, 42]);
    p.poly(L, [9, 46, 14, 46, 12, 64, 6, 64]); p.poly(Ls, [12, 46, 14, 46, 12, 64, 10, 64]);
    p.poly(L, [37, 33, 43, 33, 52, 64, 44, 64]); p.poly(Ls, [37, 33, 39.6, 33, 47, 64, 44, 64]);
    p.poly(P, [20, 38, 44, 38, 46, 50, 41.6, 54, 22.4, 54, 18, 50]);
    p.poly(Ph, [21.4, 39.4, 31.6, 39.4, 30.4, 47.6, 20.4, 48.6]); p.poly(Pd, [38.6, 39.4, 43.6, 39, 46, 50, 41.6, 54, 39.8, 50]);
    p.poly(Pk, [24, 50, 40, 50, 39, 54.6, 25, 54.6]);
    for (const x of [25.6, 30.2, 34.8]) p.snap(W, x, 50.8, 3.6, 2.8);
    p.poly(Pd, [22.4, 54.6, 41.6, 54.6, 40.6, 64, 23.4, 64]); p.poly(P, [23.8, 56, 40.2, 56, 39.4, 64, 24.6, 64]);
    p.poly(W, [29, 56.6, 35, 56.6, 34.2, 62.4, 29.8, 62.4]); p.poly(Ws, [32.4, 56.6, 35, 56.6, 34.2, 62.4, 32.4, 62.4]);
    for (const s of [-1, 1]) {
      const x = 32 + s * 24;
      p.poly(Pk, [x - 11, 50, x - 8.4, 38.6, x, 35.4, x + 8.4, 38.6, x + 11, 50, x + 8.4, 55.4, x - 8.4, 55.4]);
      p.poly(P, [x - 9.8, 49.4, x - 7.4, 39.6, x, 36.8, x + 7.4, 39.6, x + 9.8, 49.4, x + 7.6, 54, x - 7.6, 54]);
      p.poly(Ph, [x - 7.4, 39.6, x, 36.8, x + 1.8, 41.4, x - 5.8, 45]);
      p.poly(Pd, [x + 1.8, 41.4, x + 7.4, 39.6, x + 9.8, 49.4, x + 3.4, 45.6]);
      p.poly(Ws, [x - 9.4, 47.6, x + 9.4, 47.6, x + 9.6, 49.6, x - 9.6, 49.6]);
      p.poly(Pd, [x - 9.4, 49.6, x + 9.4, 49.6, x + 7.6, 54, x - 7.6, 54]);
    }
    p.poly(Pd, [15, 22, 24, 15, 25, 36, 13, 38]); p.poly(Pd, [49, 22, 40, 15, 39, 36, 51, 38]);
    p.poly(Pk, [17, 23, 23.4, 18, 24, 34, 16, 35.4]); p.poly(Pk, [47, 23, 40.6, 18, 40, 34, 48, 35.4]);
    for (const [x, y, rx, ry] of [[14, 37, 7, 4.6], [20, 34, 7.6, 5.4], [25, 31, 5, 5], [50, 37, 7.4, 4.8], [44, 34, 8, 5.6], [39, 30.6, 5.2, 5.2]]) p.ell(Fu, x, y, rx, ry);
    p.poly(Fu, [8, 37, 10.6, 32, 13.6, 34.4]); p.poly(Fu, [56, 37, 53.4, 32, 50.4, 34.4]);
    for (const [x, y] of [[17.6, 32.4], [23.4, 29.4], [41.2, 29.4], [47, 32.6]]) p.ell(Fh, x, y, 2.6, 1.6, -0.5);
    p.poly(Pk, [32, 0.6, 43.6, 11, 44.4, 24, 39.6, 33.4, 24.4, 33.4, 19.6, 24, 20.4, 11]);
    p.poly(P, [32, 2.6, 42.2, 11.6, 42.8, 23.6, 38.6, 31.8, 25.4, 31.8, 21.2, 23.6, 21.8, 11.6]);
    p.poly(Ph, [32, 2.6, 32, 9, 25.6, 12.6, 23.6, 23.4, 25.4, 31.8, 21.2, 23.6, 21.8, 11.6]);
    p.poly(Pd, [37, 7.2, 42.2, 11.6, 42.8, 23.6, 38.6, 31.8, 37.6, 22.6]);
    p.poly(Pd, [26, 13.6, 38, 13.6, 39.6, 22, 36, 26.4, 28, 26.4, 24.4, 22]);
    p.ell(Pk, 32, 19, 5.6, 5);
    p.ell(Er, 32, 19, 4.4, 4);
    p.ell(E, 32, 19, 3, 2.8);
    p.snap(Eh, 30.4, 17.2, 2, 1.8);
    p.snap(Pd, 31.2, 25.4, 1.6, 4.6);
    p.poly(W, [28.6, 29.6, 35.4, 29.6, 34.2, 32.2, 29.8, 32.2]);
  }

  function memo(look, tag, make) {
    let m = byLook.get(look);
    if (!m) byLook.set(look, m = new Map());
    let out = m.get(tag);
    if (!out) { out = make(); m.set(tag, out); }
    return out;
  }

  function bustCanvas(look, size) { return memo(look, 'b' + size, () => bustBuild(look, size)); }

  function bustBuild(look, size) {
    const key = 'bust|' + size + '|' + JSON.stringify(look);
    let out = cache.get(key);
    if (out) return out;
    const src = G.mkCanvas(size * SS, size * SS), g = src.getContext('2d');
    const P = paletteOf(look), p = pen(g, size / 64, 0, (look.bustY || 0) * size / 64);
    if (look.style) specialBust(p, P, look);
    else {
      bustBackHair(p, P, look);
      bustBody(p, P, look);
      bustBodyAcc(p, P, look);
      backAcc(p, P, look);
      hairCap(p, P, look);
      paintHead(p, P, look);
    }
    out = downsample(src, size, size, true);
    cache.set(key, out);
    return out;
  }

  const FIG_W = 48, FIG_H = 96, FOOT = 93;
  const BODIES = {
    m: { head: 4.6, sh: 24.8, chest: 32, waist: 42, hip: 47, knee: 68.5, ankle: 88, shW: 12.4, waW: 8, hiW: 8, legW: 6, armW: 4.4, hu: 0.45, neck: 5.4, wrist: 47, hand: 4.6, foot: 1.2, male: true },
    tall: { head: 2.4, sh: 22.8, chest: 30.8, waist: 41, hip: 46, knee: 68, ankle: 88, shW: 13, waW: 8.4, hiW: 8.2, legW: 6.2, armW: 4.6, hu: 0.44, neck: 5.6, wrist: 46.5, hand: 4.8, foot: 1.4, male: true },
    lean: { head: 2.8, sh: 23, chest: 30.8, waist: 41, hip: 46, knee: 68, ankle: 88, shW: 11.4, waW: 7.2, hiW: 7.4, legW: 5.6, armW: 4, hu: 0.45, neck: 5, wrist: 46.5, hand: 4.4, foot: 1.3, male: true },
    petite: { head: 10, sh: 32.6, chest: 38.4, waist: 45, hip: 50, knee: 70, ankle: 88, shW: 7.8, waW: 4.6, hiW: 6.8, legW: 4.2, armW: 2.8, hu: 0.48 },
    slim: { head: 3.6, sh: 23.8, chest: 31.4, waist: 41, hip: 46, knee: 68, ankle: 88, shW: 10.4, waW: 6.6, hiW: 7, legW: 5.4, armW: 3.8, hu: 0.46, neck: 4.8, wrist: 46.5, hand: 4.2, foot: 1.2, male: true },
    f: { head: 5, sh: 26, chest: 32.5, waist: 40.5, hip: 46, knee: 68, ankle: 88, shW: 8.8, waW: 5, hiW: 7.6, legW: 4.6, armW: 3, hu: 0.48 },
    tallf: { head: 3, sh: 24, chest: 31.5, waist: 39.5, hip: 45, knee: 67, ankle: 88, shW: 8.8, waW: 5, hiW: 7.6, legW: 4.6, armW: 3, hu: 0.48 },
    small: { head: 22, sh: 45, chest: 50.5, waist: 57.5, hip: 61.5, knee: 76, ankle: 88, shW: 8, waW: 6, hiW: 7, legW: 4.4, armW: 3, hu: 0.5 }
  };

  function figBackHair(p, P, L, B) {
    const vl = accOf(L, 'veil'), vx = 24;
    if (vl) {
      const end = B.knee + 6, pts = [vx - 7, B.head + 4, vx + 7, B.head + 4, vx + B.shW + 4, B.sh + 2, vx + B.hiW + 7, end, vx + 4, end + 2, vx - 4, end + 2, vx - B.hiW - 7, end, vx - B.shW - 4, B.sh + 2];
      p.poly(vl, pts);
      p.clipPoly(pts, () => { p.poly(dark(vl, 0.08), [vx + 3, 0, vx + 30, 0, vx + 30, end + 4, vx + 6, end + 4]); for (let x = vx - B.hiW - 7; x < vx + B.hiW + 8; x += 2.2) p.ell(dark(vl, 0.16), x, end + 0.6 - Math.abs(x - vx) * 0.12, 0.8, 0.6); });
    }
    const cx = 24, hy = B.head + 16.5 * B.hu;
    if (accOf(L, 'drills')) for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) {
      const x = cx + sd * (B.shW + 2.2 - k * 0.2), y = B.chest - 2 + k * 3.6, r = 3.4 - k * 0.3;
      p.ell(P.hairSh, x, y, r + 0.4, 2.2);
      p.ell(P.hair, x - sd * 0.4, y - 0.5, r, 1.6);
      p.ell(P.hairHi, x - sd * 1, y - 1, r * 0.4, 0.5);
    }
    const draw = col => {
      switch (L.back) {
        case 'long': p.poly(col, [cx - 7.2, hy - 3, cx + 7.2, hy - 3, cx + 9, B.sh + 3, cx + 9.6, B.waist + 5, cx + 6, B.hip + 3, cx - 6, B.hip + 3, cx - 9.6, B.waist + 5, cx - 9, B.sh + 3]); break;
        case 'flow': p.poly(col, [cx - 7.2, hy - 3, cx + 7.2, hy - 3, cx + 9.2, B.sh + 3, cx + 10, B.waist + 2, cx + 10.2, B.hip + 4, cx + 9.2, B.knee - 7, cx + 7.6, B.knee - 1, cx + 6, B.knee - 6.6, cx + 4.6, B.knee - 3, cx + 2.6, B.hip + 9, cx, B.hip + 11, cx - 2.6, B.hip + 9, cx - 4.6, B.knee - 3, cx - 6, B.knee - 6.6, cx - 7.6, B.knee - 1, cx - 9.2, B.knee - 7, cx - 10.2, B.hip + 4, cx - 10, B.waist + 2, cx - 9.2, B.sh + 3]); break;
        case 'hime': p.poly(col, [cx - 7.2, hy - 3, cx + 7.2, hy - 3, cx + 9.4, B.sh + 3, cx + 10.2, B.waist + 4, cx + 10.6, B.knee - 2, cx + 9, B.knee + 3, cx - 9, B.knee + 3, cx - 10.6, B.knee - 2, cx - 10.2, B.waist + 4, cx - 9.4, B.sh + 3]); break;
        case 'shoulder': p.poly(col, [cx - 7.2, hy - 3, cx + 7.2, hy - 3, cx + 8.6, B.sh + 2, cx + 7.5, B.sh + 7, cx - 7.5, B.sh + 7, cx - 8.6, B.sh + 2]); break;
        case 'wave': p.poly(col, [cx - 7.2, hy - 3, cx + 7.2, hy - 3, cx + 9.6, B.sh + 2, cx + 8.8, B.chest + 2, cx + 10.6, B.waist, cx + 9.4, B.hip + 1, cx + 6, B.hip + 3, cx - 6, B.hip + 3, cx - 9.4, B.hip + 1, cx - 10.6, B.waist, cx - 8.8, B.chest + 2, cx - 9.6, B.sh + 2]); break;
        case 'layer': p.poly(col, [cx - 7.2, hy - 3, cx + 7.2, hy - 3, cx + 9, B.sh + 3, cx + 9.8, B.chest + 4, cx + 11.2, B.waist + 1.6, cx + 8.6, B.waist + 0.4, cx + 8.4, B.waist + 3.6, cx + 5.4, B.waist + 0.6, cx - 5.4, B.waist + 0.6, cx - 8.4, B.waist + 3.6, cx - 8.6, B.waist + 0.4, cx - 11.2, B.waist + 1.6, cx - 9.8, B.chest + 4, cx - 9, B.sh + 3]); break;
        case 'flick': p.poly(col, [cx - 7.2, hy - 3, cx + 7.2, hy - 3, cx + 8, B.sh - 1, cx + 10.6, B.sh + 2.4, cx + 7.8, B.sh + 2.8, cx + 6.4, B.sh + 1.4, cx - 6.4, B.sh + 1.4, cx - 7.8, B.sh + 2.8, cx - 10.6, B.sh + 2.4, cx - 8, B.sh - 1]); break;
        case 'hightail': p.poly(col, [cx + 1, hy - 8.4, cx + 6.4, hy - 8, cx + 7.6, hy - 4, cx + 3, hy, cx - 5, B.sh - 1, cx - 9.4, B.chest + 2, cx - 11.6, B.waist + 4, cx - 12, B.hip + 8, cx - 10, B.hip + 13, cx - 8.6, B.hip + 6, cx - 7.6, B.waist + 1, cx - 5.4, B.chest - 1, cx - 2, B.sh - 4]); break;
        case 'tail': p.poly(col, [cx - 6.8, hy - 3, cx + 6.8, hy - 3, cx + 7, hy + 6, cx - 7, hy + 6]); p.poly(col, [cx + 3, hy + 3, cx + 7.5, hy + 4, cx + 9.5, B.chest + 2, cx + 7.5, B.waist + 4, cx + 5, B.chest]); break;
        case 'braids':
          p.poly(col, [cx - 6.8, hy - 3, cx + 6.8, hy - 3, cx + 7, hy + 6, cx - 7, hy + 6]);
          for (const s of [-1, 1]) {
            const pt = t => [cx + s * (8.4 + t * 6 + Math.sin(t * 3) * 1.6), B.sh + 1 + t * (B.knee - B.sh - 2)];
            const left = [], right = [];
            for (let k = 0; k <= 12; k++) { const t = k / 12, [x, y] = pt(t), w = 1.9 - t * 0.6; left.push(x - w, y); right.unshift(x + w, y); }
            p.poly(col, [cx + s * 6, B.sh - 3].concat(left.slice(0), right.slice(0)));
          }
          for (const s of [-1, 1]) for (let i = 0; i < 7; i++) {
            const t = i / 6, x = cx + s * (8.4 + t * 6 + Math.sin(t * 3) * 1.6), y = B.sh + 1 + t * (B.knee - B.sh - 2);
            p.ell(col, x, y, 2.4 - t * 0.4, 2.6);
            p.ell('#e8b0bc', x + s * 0.6, y + 0.6, 0.6, 1.4);
            p.rect(i % 2 ? '#c42a38' : dark(col, 0.3), x - 1.6, y + 1.8, 3.2, i % 2 ? 0.8 : 0.5);
          }
          break;
        case 'twin': p.poly(col, [cx - 7, hy - 4, cx - 3.5, hy - 1, cx - 7, B.waist, cx - 8.5, B.hip + 5, cx - 11.5, B.waist - 1, cx - 10.5, hy + 3]); p.poly(col, [cx + 7, hy - 4, cx + 3.5, hy - 1, cx + 7, B.waist, cx + 8.5, B.hip + 5, cx + 11.5, B.waist - 1, cx + 10.5, hy + 3]); break;
        case 'twinwave': for (const sd of [-1, 1]) p.poly(col, [cx + sd * 6, hy - 7, cx + sd * 3, hy - 2, cx + sd * 7.6, B.sh + 2, cx + sd * 6.6, B.chest + 3, cx + sd * 8.6, B.waist + 3, cx + sd * 7.4, B.hip + 6, cx + sd * 9.6, B.knee - 4, cx + sd * 12.2, B.hip + 8, cx + sd * 11.4, B.waist + 2, cx + sd * 13.6, B.chest + 1, cx + sd * 12.4, B.sh - 1, cx + sd * 12, hy - 4]); break;
        case 'side': { const pts = [cx - 3.5, hy - 7.5, cx - 9.5, hy - 10, cx - 15, hy - 3, cx - 15.5, B.sh + 5, cx - 12.5, B.chest + 3, cx - 11.5, B.sh - 1]; p.poly(col, L.sideR ? pts.map((x, i) => (i % 2 ? x : 2 * cx + 1 - x)) : pts); break; }
        case 'nape': p.poly(col, [cx - 6.6, hy - 2, cx + 6.6, hy - 2, cx + 6, hy + 8, cx - 6, hy + 8]); p.poly(col, [cx + 3, hy + 6, cx + 6.5, hy + 7, cx + 5.5, hy + 12]); break;
        case 'wolf': p.poly(col, [cx - 6.6, hy - 2, cx + 6.6, hy - 2, cx + 6.8, hy + 7, cx + 5.4, B.sh + 0.4, cx + 4.2, B.sh - 1.4, cx + 3.2, B.sh + 0.6, cx - 3.2, B.sh + 0.6, cx - 4.2, B.sh - 1.4, cx - 5.4, B.sh + 0.4, cx - 6.8, hy + 7]); break;
        default: p.ell(col, cx, hy, 7.3, 7.6);
      }
    };
    draw(P.hairSh);
    const tipsY = L.tipsAt ? B.chest + 3 : L.tipsFade ? B.sh - 1.5 : B.sh + 1;
    if (P.tips && L.tipsFade) p.band(tipsY - 3, tipsY, () => draw(mix(P.hairSh, dark(P.tips, 0.18), 0.5)));
    if (P.tips) p.clip(tipsY, () => draw(dark(P.tips, 0.18)));
  }

  function figBackAcc(p, P, L, B) {
    const cx = 24;
    let v;
    if ((v = accOf(L, 'trwings'))) for (const s of [-1, 1]) {
      p.poly(dark(v, 0.22), [cx + s * (B.shW - 1), B.sh + 2, cx + s * (B.shW + 3.6), B.sh - 2, cx + s * (B.shW + 5), B.sh + 0.6, cx + s * (B.shW + 3.8), B.sh + 2.6, cx + s * (B.shW + 3), B.sh + 5, cx + s * (B.shW - 1), B.sh + 5]);
      p.poly(v, [cx + s * (B.shW - 1), B.sh + 2.4, cx + s * (B.shW + 3.2), B.sh - 1.2, cx + s * (B.shW + 4.2), B.sh + 0.6, cx + s * (B.shW + 2.8), B.sh + 2.4, cx + s * (B.shW - 1), B.sh + 4]);
    }
    if ((v = accOf(L, 'greatsword'))) {
      const x0 = cx - B.hiW - 3, y0 = B.knee + 6, x1 = cx + B.shW + 9, y1 = B.head + 2;
      p.poly(dark(v, 0.5), [x0 - 1.6, y0, x0 + 1.4, y0 + 1.4, x1 + 1.6, y1 + 3, x1 + 2, y1 - 2, x1 - 2.4, y1 + 1]);
      p.poly(v, [x0 - 0.8, y0 - 0.2, x0 + 1, y0 + 0.8, x1 + 1, y1 + 2.4, x1 + 1.6, y1 - 1, x1 - 1.6, y1 + 1.4]);
      p.poly('#ff9a2a', [x0 + 1, y0 + 0.8, x0 + 1.8, y0 + 0.8, x1 + 1.8, y1 + 1.6, x1 + 1.6, y1 - 1]);
      const gx = x0 + (x1 - x0) * 0.24, gy = y0 + (y1 - y0) * 0.24;
      p.poly('#1c1a20', [gx - 2.2, gy - 1.2, gx + 1.4, gy - 2.6, gx + 2.2, gy + 1.2, gx - 1.4, gy + 2.6]);
    }
    if ((v = accOf(L, 'witchcape'))) {
      const lin = L.capeIn || '#6e4a52', end = B.knee + 9;
      const pts = [cx - B.shW - 0.8, B.sh - 0.6, cx + B.shW + 0.8, B.sh - 0.6, cx + B.shW + 6.4, end - 1.4, cx + 3, end + 0.6, cx - 3, end + 0.6, cx - B.shW - 6.4, end - 1.4];
      p.poly(lin, pts);
      p.clipPoly(pts, () => {
        p.poly(dark(lin, 0.2), [cx + 2, B.sh, cx + 20, B.sh, cx + 20, end + 2, cx + 3, end + 2]);
        for (const dx of [-5.6, 5.2]) p.poly(dark(lin, 0.28), [cx + dx * 0.5, B.sh + 6, cx + dx * 0.5 + 0.6, B.sh + 6, cx + dx * 1.6 + 0.6, end, cx + dx * 1.6, end]);
        if (L.capeZig) { p.band(end - 6, end + 1, () => p.poly(v, pts)); for (let x = cx - B.shW - 8; x < cx + B.shW + 8; x += 2.6) p.poly(L.capeZig, [x, end - 2.8, x + 1.3, end - 5.2, x + 2.6, end - 2.8, x + 1.3, end - 0.4]); }
      });
      ribbon(p, L.capeTrim || P.trim, [cx - B.shW - 0.8, B.sh - 0.6, cx - B.shW - 6.4, end - 1.4, cx - 3, end + 0.6, cx + 3, end + 0.6, cx + B.shW + 6.4, end - 1.4, cx + B.shW + 0.8, B.sh - 0.6], -1.2);
    }
    if ((v = accOf(L, 'mstaff'))) {
      const x0 = cx - B.shW - 1, top = 4.4;
      p.poly(dark(v, 0.35), [x0 - 0.8, top + 3, x0 + 0.8, top + 3, x0 + 0.6, FOOT - 0.4, x0 - 1, FOOT - 0.4]);
      p.poly(v, [x0 - 0.8, top + 3, x0 + 0.1, top + 3, x0 - 0.1, FOOT - 0.4, x0 - 1, FOOT - 0.4]);
      ribbon(p, v, [x0, top + 4, x0 + 1.4, top, x0 - 0.6, top - 3.2, x0 - 3.6, top - 2.4, x0 - 4, top + 0.8], 1.3);
      for (const y of [top + 6, top + 7.8]) p.poly('#e8b440', [x0 - 1.2, y, x0 + 1, y, x0 + 1, y + 0.8, x0 - 1.2, y + 0.8]);
      const [ox, oy] = [x0 - 1.8, top + 0.4];
      p.ell(dark('#e0304a', 0.35), ox, oy, 1.9, 1.9);
      p.ell('#e0304a', ox, oy, 1.5, 1.5);
      p.ell('#ffd0d8', ox - 0.5, oy - 0.5, 0.5, 0.5);
    }
    if ((v = accOf(L, 'shawl'))) for (const s of [-1, 1]) {
      const x0 = cx + s * B.shW;
      p.poly(v, [x0 - s * 2, B.sh + 1, x0 + s * 2.6, B.sh + 2.4, x0 + s * 3.4, B.knee - 6, x0 + s * 0.4, B.knee - 4, x0 - s * 1.6, B.waist]);
      p.poly(dark(v, 0.14), [x0 + s * 1.6, B.sh + 3, x0 + s * 2.4, B.sh + 2.4, x0 + s * 3, B.knee - 6, x0 + s * 2, B.knee - 5]);
      p.rect('#3a8a98', x0 + (s < 0 ? -3 : 0.4), B.hip + 4, 2.6, 0.8);
      for (const dx of [0.4, 1.4, 2.4]) p.poly('#c8b088', [x0 + s * dx - 0.3, B.knee - 6, x0 + s * dx + 0.3, B.knee - 6, x0 + s * dx + 0.4, B.knee - 1, x0 + s * dx - 0.4, B.knee - 1]);
    }
    if ((v = accOf(L, 'backpack'))) {
      p.poly(dark(v, 0.3), [cx - B.shW - 1.6, B.sh - 1, cx + B.shW + 1.6, B.sh - 1, cx + B.shW + 1.2, B.waist + 1, cx - B.shW - 1.2, B.waist + 1]);
      p.poly(v, [cx - B.shW - 1.2, B.sh - 0.6, cx + B.shW + 1, B.sh - 0.6, cx + B.shW + 0.8, B.waist + 0.4, cx - B.shW - 0.8, B.waist + 0.4]);
    }
    if ((v = accOf(L, 'heartwand'))) {
      const x0 = cx + B.shW + 1.8, top = B.sh - 6;
      p.poly(dark(v, 0.3), [x0 - 0.7, top + 3, x0 + 0.7, top + 3, x0 + 0.5, B.knee - 2, x0 - 0.9, B.knee - 2]);
      p.poly(v, [x0 - 0.7, top + 3, x0, top + 3, x0 - 0.2, B.knee - 2, x0 - 0.9, B.knee - 2]);
      for (const s of [-1, 1]) p.poly('#fbf4f8', [x0 + s * 1.6, top + 0.4, x0 + s * 6, top - 3.4, x0 + s * 5.2, top - 0.8, x0 + s * 6.2, top + 0.6, x0 + s * 2, top + 2.2]);
      heartAt(p, '#c5883d', x0, top, 3);
      heartAt(p, '#ff4a96', x0, top, 2.2);
      p.snap('#ffd0e4', x0 - 1.2, top - 1.2, 0.8, 0.8);
    }
    if ((v = accOf(L, 'idbadge'))) { const x = cx + B.waW + 0.4; p.rect(v, x - 1, B.waist + 1.2, 2.4, 2.8); p.rect('#2a2a32', x - 0.6, B.waist + 1.8, 1.6, 0.5); p.rect('#c8a050', x - 0.6, B.waist + 3, 1.6, 0.5); }
    if ((v = accOf(L, 'hipruffle'))) { const x = cx + B.waW + 1; p.ell(dark(v, 0.15), x, B.waist - 1, 2.4, 1.6); p.ell(v, x - 0.3, B.waist - 1.3, 2, 1.2); p.poly(v, [x - 0.6, B.waist - 0.4, x + 1.4, B.waist - 0.4, x + 2.6, B.waist + 2.6, x + 0.8, B.waist + 2]); }
    if ((v = accOf(L, 'skirtbuttons'))) { for (let y = B.waist + 2; y < B.hip + 7; y += 1.8) p.snap(v, cx + 1.4, y, 0.6, 0.6); p.rect(v, cx - 2.6, B.hip + 7.6, 1.6, 1); p.rect(v, cx - 4, B.waist + 1.2, 1.4, 1.2); }
    if ((v = accOf(L, 'shcape'))) {
      const x0 = cx - B.shW;
      p.poly(dark(v, 0.35), [x0 + 2, B.sh - 0.6, x0 - 2.6, B.sh + 1, x0 - 6.2, B.waist + 6, x0 - 5.4, B.knee + 4, x0 - 1.6, B.knee + 6.4, x0 + 0.6, B.hip]);
      p.poly(v, [x0 + 1, B.sh, x0 - 2.6, B.sh + 1.2, x0 - 6, B.waist + 6, x0 - 5.2, B.knee + 3.6, x0 - 3.4, B.knee + 4.6, x0 - 1.2, B.waist + 2]);
      p.poly('#f2f4f8', [x0 - 4.8, B.knee + 0.4, x0 - 4.2, B.knee + 0.2, x0 - 3.6, B.knee + 3.4, x0 - 4.2, B.knee + 3.6]);
      p.poly(light(v, 0.3), [x0 - 2.4, B.sh + 2, x0 - 1.6, B.sh + 2, x0 - 4.4, B.waist + 6, x0 - 5, B.waist + 5]);
    }
    if ((v = accOf(L, 'spikepad'))) {
      const x = cx - B.shW;
      p.poly(dark(v, 0.4), [x - 3.6, B.sh - 0.6, x + 2.6, B.sh - 1, x + 3, B.sh + 6.6, x - 3.4, B.sh + 7.4]);
      p.poly(v, [x - 3.2, B.sh - 0.2, x + 2.2, B.sh - 0.6, x + 2.6, B.sh + 6, x - 3, B.sh + 6.8]);
      for (const [dx, dy] of [[-1.6, 2], [0.8, 2], [-1.6, 4.6], [0.8, 4.6]]) p.poly(light(v, 0.3), [x + dx, B.sh + dy - 0.8, x + dx + 0.7, B.sh + dy, x + dx, B.sh + dy + 0.8, x + dx - 0.7, B.sh + dy]);
      p.poly('#d8dce4', [x - 1, B.sh - 0.6, x + 0.4, B.sh - 4, x + 1.2, B.sh - 0.6]);
      p.snap('#3ad8c8', x - 0.6, B.sh + 0.4, 1, 0.8);
    }
    if ((v = accOf(L, 'naginata'))) {
      const hx = cx + B.shW + 0.5, hy = (B.wrist || B.waist + 1) + (B.hand || 3.6) * 0.6;
      p.poly('#26282e', [hx - 0.8, hy, hx + 0.6, hy - 0.4, cx - B.shW - 8.4, B.head - 2.6, cx - B.shW - 9.6, B.head - 1.6]);
      p.poly('#3ad8c8', [cx - 4, (hy + B.head) / 2 - 2.6, cx - 2.6, (hy + B.head) / 2 - 3.6, cx - 1.8, (hy + B.head) / 2 - 2.6, cx - 3.2, (hy + B.head) / 2 - 1.6]);
      p.ell('#5a5c66', cx - B.shW - 9, B.head - 2.2, 1.4, 1.4);
    }
    if ((v = accOf(L, 'sidecape'))) {
      p.poly(v, [cx + B.shW - 2, B.sh, cx + B.shW + 2.4, B.sh + 1, cx + B.shW + 5.6, B.knee - 2, cx + B.shW + 3.8, B.knee + 2.4, cx + B.shW + 0.8, B.knee - 1, cx + B.shW - 1, B.waist]);
      p.poly(dark(v, 0.25), [cx + B.shW + 2.4, B.sh + 1, cx + B.shW + 5.6, B.knee - 2, cx + B.shW + 3.8, B.knee + 2.4, cx + B.shW + 3, B.waist]);
    }
    if ((v = accOf(L, 'racape'))) {
      const x = cx - B.shW, lt = light(v, 0.12), gold = '#b8a060';
      p.poly(dark(v, 0.3), [x + 1, B.sh, x + 4, B.sh + 1, x + 1, B.knee + 6, x - 6.4, B.knee + 2, x - 3, B.sh + 3]);
      p.poly(v, [x + 0.6, B.sh + 0.6, x + 3, B.sh + 1.6, x + 0.6, B.knee + 5, x - 5.6, B.knee + 1.6, x - 2.4, B.sh + 3.4]);
      p.poly(lt, [x - 1.6, B.sh + 3, x, B.sh + 2, x - 1, B.knee - 6, x - 3.6, B.knee - 6]);
      p.ell(gold, x - 2.4, B.knee - 0.6, 2.6, 2.6); p.ell(v, x - 2.4, B.knee - 0.6, 1.8, 1.8); p.ell(gold, x - 2.4, B.knee - 0.6, 1, 1); p.ell(v, x - 2.2, B.knee - 0.4, 0.4, 0.4);
    }
    if ((v = accOf(L, 'ghosttail'))) {
      const y0 = B.hip - 3, lt = light(v, 0.45);
      p.poly(dark(v, 0.2), [cx + 1, y0, cx + 7, y0 - 2, cx + 14, y0 + 4, cx + 19, B.knee - 2, cx + 23, B.knee - 6, cx + 22, B.knee + 2, cx + 25, B.knee + 4, cx + 18, B.knee + 7, cx + 12, B.knee + 2, cx + 7, y0 + 9, cx + 2, y0 + 5]);
      p.poly(v, [cx + 3, y0 + 1, cx + 8, y0, cx + 14, y0 + 6, cx + 18, B.knee, cx + 21, B.knee - 3, cx + 20, B.knee + 3, cx + 16, B.knee + 4, cx + 11, B.knee, cx + 7, y0 + 7]);
      p.poly(lt, [cx + 8, y0 + 3, cx + 12, y0 + 6, cx + 15, B.knee - 2, cx + 13, B.knee - 1]);
    }
    if ((v = accOf(L, 'dragontail'))) {
      const y0 = B.hip - 2;
      p.poly(v, [cx + 2, y0, cx + 6, y0 - 1, cx + 13, y0 + 7, cx + 18, B.knee + 3, cx + 21, B.ankle - 7, cx + 17, B.ankle - 5, cx + 13, B.knee + 6, cx + 8, y0 + 10, cx + 3, y0 + 5]);
      p.poly(light(v, 0.35), [cx + 9, y0 + 7, cx + 12, y0 + 8, cx + 16, B.knee + 4, cx + 14, B.knee + 6]);
      p.poly('#eef2fa', [cx + 18, B.ankle - 6, cx + 23, B.ankle - 13, cx + 24, B.ankle - 3, cx + 19, B.ankle - 3]);
    }
    if ((v = accOf(L, 'cattail'))) {
      const at = t => [cx - 3 - t * 11 - Math.sin(t * 3.4) * 2.4, B.hip - 2 + t * (B.knee - B.hip + 8)], left = [], right = [];
      for (let k = 0; k <= 14; k++) { const t = k / 14, [x, y] = at(t), w = 1.5 - t * 0.3; left.push(x - w, y); right.unshift(x + w, y); }
      p.poly(v, left.concat(right));
      for (let k = 1; k < 14; k += 2) { const [x, y] = at(k / 14); p.ell(L.spot || '#4a3424', x + (k % 4 ? 0.5 : -0.5), y, 0.8, 0.7); }
      const [ex, ey] = at(1); p.ell(dark(v, 0.35), ex, ey + 0.6, 1.3, 1);
    }
  }

  function figure(p, P, L, B) {
    const cx = 24, g = L.legGap || 0, lx = cx - B.legW - 0.4 - g, rx = cx + 0.4 + g, lw = B.legW;
    const cape = accOf(L, 'furcape'), mantle = accOf(L, 'mantle');
    if (mantle) p.poly(dark(mantle, 0.12), [cx - B.shW - 0.5, B.sh, cx + B.shW + 0.5, B.sh, cx + B.shW + 5, B.knee + 6, cx + 2, B.knee + 9, cx - B.shW - 5, B.knee + 6]);
    if (cape) p.poly(dark(cape, 0.08), [cx - B.shW - 1, B.sh + 1, cx + B.shW + 1, B.sh + 1, cx + B.shW + 5, B.knee, cx - B.shW - 5, B.knee]);
    if (L.coat === 'cape') {
      const lin = L.lining || P.trim, end = L.capeLen ? B.hip + L.capeLen : B.knee + 9;
      p.poly(L.sleeve ? dark(P.top, 0.1) : dark(lin, 0.35), [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.shW + 7, end, cx - B.shW - 7, end]);
      for (const s of [-1, 1]) {
        const pts = [cx + s * (B.shW - 1), B.sh - 0.6, cx + s * (B.shW + 2.6), B.sh + 0.6, cx + s * (B.shW + 7.4), end + 0.6, cx + s * (B.shW + 1.2), end - 0.6, cx + s * (B.shW - 1.6), B.waist];
        if (L.sleeve) {
          p.poly(P.top, pts);
          p.clipPoly(pts, () => { p.poly(lin, [cx + s * (B.shW - 1.6), B.sh, cx + s * (B.shW + 0.2), B.sh, cx + s * (B.shW + 2.4), end + 1, cx + s * (B.shW + 0.6), end + 1]); if (s > 0) p.poly(dark(P.top, 0.3), [cx + B.shW + 3, B.sh, cx + B.shW + 9, B.sh, cx + B.shW + 9, end + 2, cx + B.shW + 4.4, end + 2]); });
          for (const y of [B.hip, B.hip + 5, end - 3]) p.poly(L.trim, [cx + s * (B.shW + 4.6), y, cx + s * (B.shW + 5.6), y, cx + s * (B.shW + 5.1), y + 1.4]);
          continue;
        }
        p.poly(lin, pts);
        p.clipPoly(pts, () => {
          for (let y = B.sh + 4; y < end; y += 5.2) for (const dx of [0.4, 2.6]) p.ell(dark(lin, 0.18), cx + s * (B.shW + dx + (y - B.sh) * 0.08), y + (dx > 1 ? 2.6 : 0), 0.7, 0.7);
          if (s > 0) p.poly(dark(lin, 0.14), [cx + B.shW + 2, B.sh, cx + B.shW + 8, B.sh, cx + B.shW + 8, end + 2, cx + B.shW + 3.4, end + 2]);
        });
        p.poly(P.top, [cx + s * (B.shW + 1.4), B.sh + 0.2, cx + s * (B.shW + 2.6), B.sh + 0.6, cx + s * (B.shW + 7.4), end + 0.6, cx + s * (B.shW + 5.8), end + 0.8]);
        for (const y of [end - 6, end - 3]) p.snap('#d8b050', cx + s * (B.shW + 6.2) - 0.4, y, 0.8, 0.8);
      }
    }
    if (L.coat === 'hoodcape') {
      const lin = L.lining || P.topSh, neckTop = B.head + 38 * B.hu;
      for (const s of [-1, 1]) p.poly(s < 0 ? lin : dark(lin, 0.18), [cx + s * B.shW, B.sh - 1, cx + s * (B.shW + 2.4), B.sh + 1, cx + s * (B.shW + 3.6), B.waist + 1.4, cx + s * (B.shW + 1.4), B.waist + 2.4, cx + s * (B.shW - 1), B.sh + 6]);
      p.poly(lin, [cx - 5, B.sh + 0.6, cx - 4.6, neckTop - 0.6, cx - 2.6, neckTop - 1.6, cx + 2.6, neckTop - 1.6, cx + 4.6, neckTop - 0.6, cx + 5, B.sh + 0.6]);
      for (const s of [-1, 1]) p.poly(P.trim, [cx + s * 4.6, neckTop - 0.6, cx + s * 2.6, neckTop - 1.6, cx + s * 2.6, neckTop - 0.6, cx + s * 3.8, neckTop + 0.2]);
    }
    const tails = accOf(L, 'tails');
    if (tails) {
      const end = L.tailsTo === 'ankle' ? B.ankle - 1 : L.tailsTo === 'calf' ? B.knee + 11 : B.knee + 5;
      for (const s of L.tailsOne === 'l' ? [-1] : L.tailsOne === 'r' ? [1] : [-1, 1]) {
        const pts = [cx + s * (B.waW - 1), B.waist, cx + s * (B.waW + 1.5), B.waist - 0.5, cx + s * (B.hiW + 5.5), end - 1, cx + s * (B.hiW + 2.5), end + 2, cx + s * (B.hiW - 1.5), end - 3];
        p.poly(s > 0 ? dark(tails, 0.18) : tails, pts);
        if (L.tailsLining) p.clipPoly(pts, () => p.poly(L.tailsLining, [cx + s * (B.waW - 1), B.waist, cx + s * (B.waW + 1.2), B.waist, cx + s * (B.hiW + 2.6), end - 1, cx + s * (B.hiW - 1.6), end - 2]));
        if (L.tailsGold) p.clipPoly(pts, () => {
          const at = t => [cx + s * (B.waW + 1.5 + (B.hiW + 2.6 - B.waW) * t), B.waist + (end - B.waist) * t];
          p.poly('#f2eef0', [cx + s * (B.waW - 1), B.waist, cx + s * (B.waW - 0.2), B.waist, cx + s * (B.hiW - 0.8), end - 2, cx + s * (B.hiW - 1.6), end - 2]);
          for (let i = 0; i < 10; i++) { const [x1, y1] = at(0.12 + i * 0.08), [x2, y2] = at(0.2 + i * 0.08); p.poly(L.tailsGold, [x1, y1, x1 + s * 0.8, y1, x2 + s * 0.8, y2, x2, y2]); }
          for (const t of [0.3, 0.62]) { const [x, y] = at(t); p.snap(L.tailsGold, x + s * 1.2 - 0.5, y - 0.6, 1, 1); p.snap(L.tailsGold, x + s * 1.8 - 0.5, y + 0.4, 1, 1); }
        });
      }
    }
    if (L.coat === 'split') p.poly(L.backLining ? dark(L.lining || P.trim, 0.18) : dark(L.coatLow || P.top, 0.38), [cx - B.waW - 1, B.waist, cx + B.waW + 1, B.waist, cx + B.hiW + 4.4, B.hip + (L.coatLen || 31) + 0.6, cx - B.hiW - 4.4, B.hip + (L.coatLen || 31) + 0.6]);
    const coatHem = ['mid', 'parka', 'offcoat'].includes(L.coat) ? B.hip + (L.coatLen || 12) : null;
    const flare = L.coatFlare != null ? L.coatFlare : 4.5;
    if (coatHem) p.poly(L.coat === 'offcoat' ? dark(L.lining, 0.25) : L.lining ? dark(P.top, 0.42) : dark(P.top, 0.3), [cx - B.waW - 1, B.waist, cx + B.waW + 1, B.waist, cx + B.hiW + flare, coatHem + 0.6, cx - B.hiW - flare, coatHem + 0.6]);
    if (L.low === 'gown') {
      p.poly(mix(P.lower, '#c02830', 0.85), [cx - 2.4, B.hip + 1, cx - B.hiW - 1.2, B.hip + 2, cx - B.hiW - 4.4, B.ankle + 1.4, cx - 1.2, B.ankle + 1.4]);
      p.poly(dark('#c02830', 0.3), [cx - B.hiW - 2.4, B.knee + 6, cx - B.hiW - 4.4, B.ankle + 1.4, cx - B.hiW - 1.4, B.ankle + 1.4]);
      p.poly(P.lower, [cx - B.waW - 0.6, B.waist, cx - B.waW + 1, B.waist, cx - 3.4, B.hip + 3, cx - B.legW - 1.2, B.knee, cx - B.hiW - 1.4, B.ankle + 1.4, cx - B.hiW - 5.4, B.ankle + 1.4, cx - B.hiW - 1.8, B.hip + 1.4]);
      p.poly(P.lowerSh, [cx - B.legW - 1.2, B.knee, cx - B.hiW - 1.4, B.ankle + 1.4, cx - B.hiW - 3, B.ankle + 1.4, cx - B.legW - 2.4, B.knee]);
      p.poly(P.lowerSh, [cx + 2, B.waist, cx + B.waW + 0.5, B.waist, cx + B.hiW + 1.8, B.hip + 1.4, cx + B.hiW + 5.6, B.ankle + 1.4, cx + B.hiW + 3, B.ankle + 1.4, cx + B.hiW + 1.4, B.hip + 2]);
    }
    const hem = L.low === 'skirt' ? B.hip + (L.skirtLen || 10) : L.low === 'shorts' ? B.hip + 5 : L.low === 'slit' ? B.hip + 9 : null;
    const legX = s => (s < 0 ? cx - g : cx + 1 + g), legO = s => v => legX(s) + s * v;
    const legPts = s => {
      const o = legO(s);
      return [o(0), B.hip - 1, o(lw), B.hip - 1, o(lw - 0.1), B.hip + 7, o(lw - 0.8), B.knee, o(lw - 0.5), B.knee + 5, o(lw - 1.8), B.ankle, o(0.4), B.ankle, o(0.4), B.knee + 5, o(0.3), B.knee, o(0), B.hip + 9];
    };
    const legs = (col, from, to, only) => p.band(from, to, () => { for (const s of only ? [only] : [-1, 1]) p.poly(col, legPts(s)); });
    const rightEdge = (col, from, to) => {
      const o = legO(1);
      p.band(from, to, () => p.poly(col, [o(lw - 1.2), B.hip - 1, o(lw), B.hip - 1, o(lw - 0.1), B.hip + 7, o(lw - 0.8), B.knee, o(lw - 0.5), B.knee + 5, o(lw - 1.8), B.ankle, o(lw - 2.6), B.ankle, o(lw - 1.6), B.knee + 5, o(lw - 1.9), B.knee, o(lw - 1.3), B.hip + 7]));
    };
    const bare = !L.legs, legCol = P.legs;
    legs(legCol, L.low === 'pants' ? B.ankle - 2 : B.hip - 1, B.ankle + 0.5);
    rightEdge(bare ? P.skinSh : dark(legCol, 0.3), B.hip + 8, B.ankle - 2);
    if (!bare) p.band(B.hip + 9, B.ankle - 3, () => p.poly(light(legCol, 0.14), [cx - g - lw + 0.4, B.hip + 9, cx - g - lw + 1.4, B.hip + 9, cx - g - lw + 1.6, B.ankle - 3, cx - g - lw + 0.8, B.ankle - 3]));
    let v;
    if ((v = accOf(L, 'stockings'))) {
      const top = (hem || B.hip + 9) + 4;
      legs(v, top, B.ankle + 0.5);
      legs(light(v, 0.28), top, top + 1);
      rightEdge(dark(v, 0.3), top + 1, B.ankle);
      let w;
      if (accOf(L, 'stockcats')) for (const sd of [-1, 1]) { const o = legO(sd); p.poly(v, [o(0), top + 0.4, o(0.4), top - 2.2, o(lw * 0.4), top + 0.4]); p.poly(v, [o(lw * 0.6), top + 0.4, o(lw - 0.4), top - 2.2, o(lw), top + 0.4]); }
      if ((w = accOf(L, 'stockband'))) legs(w, top + 1, top + 2, 1);
      if ((w = accOf(L, 'garter2'))) { legs(w, top - 3.2, top - 2.2, -1); legs(w, top - 1.6, top - 0.6, -1); }
    }
    if ((v = accOf(L, 'socks'))) { legs(v, B.knee - 1.5, B.ankle + 0.5); legs(dark(v, 0.14), B.knee - 1.5, B.knee - 0.5); rightEdge(dark(v, 0.1), B.knee + 1, B.ankle); }
    const barefoot = accOf(L, 'barefoot');
    const fx = B.foot || 0;
    for (const [x0, mirror] of [[cx - g - lw, -1], [cx + 1 + g, 1]]) {
      const foot = [x0 + (mirror < 0 ? 0.8 : 0.3) - fx * 0.3, B.ankle - 1.5, x0 + lw - (mirror < 0 ? 0.3 : 0.8) + fx * 0.3, B.ankle - 1.5, x0 + lw + (mirror < 0 ? -0.2 : 1.3) + fx * (mirror > 0 ? 1 : 0.3), FOOT, x0 + (mirror < 0 ? -1.3 : 0.2) - fx * (mirror < 0 ? 1 : 0.3), FOOT];
      if (barefoot) {
        p.poly(P.skin, foot);
        p.rect(P.skinSh, x0 + (mirror < 0 ? -1 : 0.4), FOOT - 0.9, lw + 0.6, 0.9);
        p.rect(P.skinSh, x0 + (mirror < 0 ? lw - 1.4 : 1), B.ankle - 1, 0.9, 1.2);
        continue;
      }
      p.poly(P.shoes, foot);
      p.rect(light(P.shoes, 0.25), x0 + (mirror < 0 ? 1 : 0.8), B.ankle - 1.2, lw - 1.8, 0.8);
    }
    const shaft = (col, top, s) => {
      const o = legO(s);
      p.poly(col, [o(0), top, o(lw - 0.3), top, o(lw - 1.4), B.ankle, o(0.6), B.ankle]);
      p.poly(light(col, 0.3), [o(0), top, o(lw - 0.3), top, o(lw - 0.35), top + 1, o(0.05), top + 1]);
      if (s > 0) p.poly(dark(col, 0.25), [o(lw - 1.4), top + 1, o(lw - 0.35), top + 1, o(lw - 1.4), B.ankle, o(lw - 2.2), B.ankle]);
    };
    const ankle = accOf(L, 'ankle'), boots = accOf(L, 'boots');
    if (ankle) for (const s of [-1, 1]) shaft(ankle, B.ankle - 6, s);
    if ((v = accOf(L, 'anklerim'))) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(-0.2), B.ankle - 6.6, o(lw), B.ankle - 6.6, o(lw - 0.1), B.ankle - 5.6, o(-0.1), B.ankle - 5.6]); }
    if ((v = accOf(L, 'anklecuff'))) for (const s of [-1, 1]) {
      const o = legO(s);
      p.poly(v, [o(-0.7), B.ankle - 7, o(lw + 0.5), B.ankle - 7, o(lw - 0.6), B.ankle - 4.2, o(0.3), B.ankle - 4.2]);
      p.poly(light(v, 0.35), [o(-0.7), B.ankle - 7, o(lw + 0.5), B.ankle - 7, o(lw + 0.3), B.ankle - 6.2, o(-0.5), B.ankle - 6.2]);
      if (s > 0) p.poly(dark(v, 0.25), [o(lw - 1.2), B.ankle - 6.2, o(lw + 0.3), B.ankle - 6.2, o(lw - 0.6), B.ankle - 4.2, o(lw - 1.6), B.ankle - 4.2]);
    }
    if ((v = accOf(L, 'soles'))) for (const [x0, mirror] of [[cx - g - lw, -1], [cx + 1 + g, 1]]) p.rect(v, x0 + (mirror < 0 ? -1.3 : 0.2), FOOT - 0.9, lw + 1.1, 0.9);
    const bootTop = L.bootsTo === 'calf' ? B.knee + 5 : B.knee - 3;
    if (boots) for (const s of [-1, 1]) shaft(boots, bootTop, s);
    if ((v = accOf(L, 'trboot'))) shaft(v, bootTop, 1);
    const bootCuff = col => {
      for (const s of [-1, 1]) {
        const o = legO(s);
        p.poly(col, [o(-0.8), bootTop - 0.8, o(lw + 0.6), bootTop - 0.8, o(lw + 0.3), bootTop + 2.6, o(-0.5), bootTop + 2.6]);
        p.poly(light(col, 0.28), [o(-0.8), bootTop - 0.8, o(lw + 0.6), bootTop - 0.8, o(lw + 0.55), bootTop + 0.2, o(-0.75), bootTop + 0.2]);
        p.poly(dark(col, 0.3), [o(-0.5), bootTop + 1.8, o(lw + 0.3), bootTop + 1.8, o(lw + 0.3), bootTop + 2.6, o(-0.5), bootTop + 2.6]);
        if (s > 0) p.poly(dark(col, 0.2), [o(lw - 1), bootTop + 0.2, o(lw + 0.55), bootTop + 0.2, o(lw + 0.3), bootTop + 1.8, o(lw - 1.1), bootTop + 1.8]);
      }
    };
    if ((v = accOf(L, 'bootflap')) && boots) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(-0.6), bootTop - 1, o(lw + 0.4), bootTop - 1, o(lw + 0.2), bootTop + 3.4, o(lw * 0.5), bootTop + 4.6, o(-0.4), bootTop + 3.4]); p.poly(light(v, 0.3), [o(-0.6), bootTop - 1, o(lw + 0.4), bootTop - 1, o(lw + 0.4), bootTop, o(-0.6), bootTop]); p.poly('#e8e8ee', [o(-0.4), B.ankle - 2.4, o(lw), B.ankle - 2.4, o(lw), B.ankle - 1.4, o(-0.4), B.ankle - 1.4]); }
    if ((v = accOf(L, 'bootgem'))) for (const s of [-1, 1]) { const kx = legO(s)(lw * 0.5); p.poly(v, [kx, bootTop + 0.6, kx + 1.3, bootTop + 3, kx, bootTop + 5.6, kx - 1.3, bootTop + 3]); p.snap(light(v, 0.4), kx - 0.3, bootTop + 2, 0.6, 1.2); }
    if ((v = accOf(L, 'warmers'))) for (const s of [-1, 1]) {
      const x = legO(s)(lw * 0.5 - 0.3);
      p.ell(dark(v, 0.28), x, B.ankle - 2.2, lw * 0.5 + 1.5, 2.5);
      p.ell(v, x, B.ankle - 2.7, lw * 0.5 + 1.3, 2.1);
      p.ell(light(v, 0.32), x - s * 0.5, B.ankle - 3.7, lw * 0.32, 0.8);
    }
    if ((v = accOf(L, 'greaves'))) {
      const gs = mix(v, '#9a88b8', 0.45);
      legs(v, B.knee - 1, B.ankle + 0.5);
      legs(light(v, 0.3), B.knee - 1, B.knee);
      rightEdge(gs, B.knee, B.ankle);
      for (const s of [-1, 1]) { const kx = legO(s)(lw * 0.5); p.ell(mix(v, '#9a88b8', 0.3), kx, B.knee - 0.4, lw * 0.5 + 0.7, 1.8); p.ell(v, kx, B.knee - 0.8, lw * 0.5 + 0.4, 1.4); }
      legs(gs, B.ankle - 4, B.ankle - 3.4);
    }
    const tall = accOf(L, 'thighboots');
    if (tall) {
      const top = B.knee - (L.thighTop || 10);
      legs(tall, top, B.ankle + 0.5);
      legs(light(tall, 0.3), top, top + 1);
      rightEdge(dark(tall, 0.3), top + 1, B.ankle);
      const plate = accOf(L, 'kneeplate');
      if (plate) for (const s of [-1, 1]) {
        const kx = legO(s)(lw * 0.5);
        p.poly(plate, [kx, B.knee - 3.5, kx + 1.6, B.knee - 0.5, kx, B.knee + 2.5, kx - 1.6, B.knee - 0.5]);
        p.snap(L.trim || '#3a72d8', kx - 0.5, B.knee - 1, 1, 1);
      }
      const flap = accOf(L, 'bootvflap');
      if (flap) {
        legs('#e6eaf8', top - 3, top + 0.4);
        legs(dark(tall, 0.1), top - 3.8, top - 2.8);
        rightEdge('#c4c8dc', top - 2.8, top + 0.4);
        for (const s of [-1, 1]) {
          const o = legO(s);
          p.poly(flap, [o(-0.7), top - 0.2, o(lw * 0.5), top + 2.2, o(lw + 0.5), top - 0.2, o(lw + 0.4), top + 1.6, o(lw * 0.5), top + 4.2, o(-0.6), top + 1.6]);
          p.poly(light(flap, 0.3), [o(-0.7), top - 0.2, o(lw * 0.5), top + 2.2, o(lw * 0.5), top + 3, o(-0.65), top + 0.6]);
        }
      }
    }
    if (accOf(L, 'dolljoint')) for (const s of [-1, 1]) { const kx = legO(s)(lw * 0.5); p.ell(dark(P.legs, 0.2), kx, B.knee - 0.4, lw * 0.5 + 0.5, 1.6); p.ell(accOf(L, 'stockings') || P.skin, kx, B.knee - 0.8, lw * 0.5 + 0.2, 1.2); }
    if ((v = accOf(L, 'plates'))) for (const s of [-1, 1]) { const kx = legO(s)(lw * 0.5); p.ell('#22385e', kx, B.knee, lw * 0.5 + 1.1, 2.5); p.ell(s < 0 ? v : L.plateSh || '#c0d0ee', kx, B.knee - 0.3, lw * 0.5 + 0.6, 2); }
    if ((v = accOf(L, 'wingheel'))) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(lw - 0.4), B.ankle - 0.8, o(lw + 2.8), B.ankle - 4.4, o(lw + 2.2), B.ankle - 2, o(lw + 3.2), B.ankle - 2.4, o(lw + 1.2), B.ankle + 0.4]); }
    if ((v = accOf(L, 'heelbow'))) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(lw * 0.5), B.ankle - 5, o(lw + 1.4), B.ankle - 6.4, o(lw + 1.2), B.ankle - 3.6]); p.poly(v, [o(lw * 0.5), B.ankle - 5, o(-1.2), B.ankle - 6.4, o(-1), B.ankle - 3.6]); }
    if ((v = accOf(L, 'boot1'))) {
      const top = B.hip + 13;
      legs(v, top, B.ankle + 0.5, -1); legs(light(v, 0.25), top, top + 1, -1);
      const o = legO(-1);
      p.poly(v, [o(-0.6), top - 1.6, o(lw + 0.4), top - 0.4, o(lw + 0.2), top + 1, o(-0.6), top + 1]);
      p.poly('#c8ccd4', [o(lw * 0.5 - 0.3), top + 1, o(lw * 0.5 + 0.3), top + 1, o(lw * 0.5 + 0.2), B.ankle - 4, o(lw * 0.5 - 0.2), B.ankle - 4]);
      p.poly(L.trim, [o(lw * 0.5 - 1), top - 0.4, o(lw * 0.5 + 1), top - 0.4, o(lw * 0.5), top + 1.6]);
    }
    if ((v = accOf(L, 'thighstrap')) && accOf(L, 'boot1')) { const o = legO(-1); p.poly(v, [o(-0.4), B.hip + 9, o(lw + 0.4), B.hip + 9, o(lw + 0.4), B.hip + 10.4, o(-0.4), B.hip + 10.4]); p.snap(L.trim, o(lw * 0.5) - 0.5, B.hip + 9.2, 1, 1); }
    if ((v = accOf(L, 'tightlines'))) for (const s of [-1, 1]) { const o = legO(s); for (const x of [lw * 0.3, lw * 0.7]) p.poly(v, [o(x - 0.15), hem ? hem + 1 : B.hip + 2, o(x + 0.15), hem ? hem + 1 : B.hip + 2, o(x * 0.85 + 0.1), B.ankle - 2, o(x * 0.85 - 0.2), B.ankle - 2]); }
    if ((v = accOf(L, 'fishnet1'))) { const o = legO(1); legs(mix(P.skin, v, 0.12), B.knee + 1.2, B.knee + 6, 1); for (let y = B.knee + 1.6; y < B.knee + 6; y += 1.6) for (let x = 0.4; x < lw - 0.4; x += 1.6) p.snap(mix(P.skin, v, 0.45), o(x + ((y - B.knee) % 3.2 > 1.5 ? 0.8 : 0)), y, 0.5, 0.5); p.rect('#1e1e26', o(-0.2) - (0), B.knee + 0.4, lw + 0.2, 0.9); }
    if ((v = accOf(L, 'kneebandage'))) { const o = legO(1); p.poly(v, [o(-0.2), B.knee - 4, o(lw), B.knee - 6, o(lw), B.knee - 4.6, o(-0.2), B.knee - 2.6]); p.snap(light(v, 0.5), o(lw * 0.5) - 0.3, B.knee - 4.6, 0.6, 0.6); }
    if ((v = accOf(L, 'toecap'))) for (const [x0, mirror] of [[cx - g - lw, -1], [cx + 1 + g, 1]]) p.poly(v, [x0 + (mirror < 0 ? 0.6 : 0.3), B.ankle - 0.6, x0 + lw - (mirror < 0 ? 0.3 : 0.6), B.ankle - 0.6, x0 + lw * 0.5 + (mirror < 0 ? 0 : 0.4), B.ankle + 1.4]);
    if ((v = accOf(L, 'anklestrap'))) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(-0.2), B.ankle - 3, o(lw - 1), B.ankle - 3, o(lw - 1), B.ankle - 2.2, o(-0.2), B.ankle - 2.2]); }
    if ((v = accOf(L, 'socktop')) && boots) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(-0.2), bootTop - 1.4, o(lw), bootTop - 1.4, o(lw - 0.1), bootTop, o(-0.1), bootTop]); }
    if ((v = accOf(L, 'bootband')) && boots) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(-0.4), bootTop + 1, o(lw + 0.2), bootTop + 1, o(lw), bootTop + 2.4, o(-0.2), bootTop + 2.4]); }
    if ((v = accOf(L, 'bootband')) && boots) for (const [x0, mirror] of [[cx - g - lw, -1], [cx + 1 + g, 1]]) p.rect(v, x0 + (mirror < 0 ? -1.3 : 0.2), FOOT - 0.9, lw + 1.1, 0.9);
    if ((v = accOf(L, 'shinleaf')) && accOf(L, 'thighboots')) for (const s of [-1, 1]) {
      const kx = legO(s)(lw * 0.5);
      p.poly(v, [kx - 0.3, B.knee + 2.4, kx + 0.3, B.knee + 2.4, kx + 0.2, B.ankle - 4, kx - 0.2, B.ankle - 4]);
      p.poly(v, [kx, B.knee + 2, kx + 1.6, B.knee + 4.4, kx, B.knee + 6.4, kx - 1.6, B.knee + 4.4]);
      p.poly('#2a5ad8', [kx, B.knee - 2.6, kx + 1, B.knee - 0.8, kx, B.knee + 0.6, kx - 1, B.knee - 0.8]);
    }
    if ((v = accOf(L, 'stocking1'))) {
      const top = (hem || B.hip + 9) + 4, ss = L.stockSide === 'r' ? 1 : -1;
      legs(v, top, boots ? bootTop + 0.5 : B.ankle + 0.5, ss);
      legs(light(v, 0.2), top + 4, B.knee - 2, ss);
      legs(v, top + 4.6, B.knee - 2, ss);
      const rp = accOf(L, 'rips');
      if (rp) for (const [dy, dx] of [[3, 0.3], [6.4, 0.55], [9.6, 0.25]]) p.ell(rp, legO(ss)(lw * dx + 0.6), top + dy, 0.9, 0.7);
      const band = accOf(L, 'gband');
      if (band) {
        legs(band, top - 0.4, top + 2.4, ss);
        const kx = legO(ss)(lw * 0.5);
        for (const y of [top + 0.4, top + 1.4]) p.poly('#d8b050', [kx - 1.6, y + 0.8, kx, y, kx + 1.6, y + 0.8, kx + 1.6, y + 1.4, kx, y + 0.6, kx - 1.6, y + 1.4]);
      }
    }
    if ((v = accOf(L, 'legwrap'))) {
      const ws = L.stockSide === 'r' ? -1 : 1, top = (hem || B.hip + 9) + 1.6, end = boots ? bootTop + 0.5 : B.ankle + 0.5, o = legO(ws);
      legs(v, top, end, ws);
      for (let y = top + 1.4; y < end - 0.8; y += 2.3) p.poly(dark(v, 0.18), [o(-0.2), y + 1.1, o(lw + 0.2), y, o(lw + 0.2), y + 0.55, o(-0.2), y + 1.65]);
      p.band(top, end, () => p.poly(dark(v, 0.1), [o(lw - 1.2), top, o(lw + 0.2), top, o(lw - 1.6), end, o(lw - 2.6), end]));
    }
    if ((v = accOf(L, 'bootcuff')) && boots && !(L.low === 'pants' && L.tuck)) bootCuff(v);
    if ((v = accOf(L, 'stockbow'))) {
      const top = (hem || B.hip + 9) + 4;
      legs(v, top - 0.2, top + 1);
      for (const s of [-1, 1]) { const kx = legO(s)(lw * 0.5); p.poly(v, [kx, top + 0.4, kx - 1.8, top - 0.9, kx - 1.5, top + 1.9]); p.poly(v, [kx, top + 0.4, kx + 1.8, top - 0.9, kx + 1.5, top + 1.9]); }
    }
    if ((v = accOf(L, 'garter'))) {
      const gy = (hem || B.hip + 9) + 3, bow = accOf(L, 'garterbow');
      legs(v, gy, gy + (bow ? 1.6 : 1), -1);
      p.snap(light(v, 0.4), cx - lw * 0.5 - 1, gy, 1, 1);
      if (bow) {
        const kx = legO(-1)(lw * 0.5);
        legs(dark(v, 0.16), gy + 1.2, gy + 1.6, -1);
        p.poly(bow, [kx, gy + 1, kx + 1.1, gy + 2.3, kx, gy + 3.8, kx - 1.1, gy + 2.3]);
        p.snap(light(bow, 0.5), kx - 0.4, gy + 1.8, 0.8, 0.8);
      }
    }
    if (hem && L.low !== 'slit') {
      legs(bare ? P.skinSh : dark(legCol, 0.25), hem - 0.5, hem + 1.4);
    }
    const skirt = (y0, y1) => {
      const hw = B.hiW + 4, lo = P.lower;
      if (L.petti) {
        p.poly(L.petti, [cx - hw + 0.4, y1 - 1.2, cx + hw - 0.4, y1 - 1.2, cx + hw - 1, y1 + 1.3, cx - hw + 1, y1 + 1.3]);
        for (let x = -hw + 1.8; x <= hw - 1.8; x += 2.4) p.ell(L.petti, cx + x, y1 + 1.4, 1.2, 0.9);
        p.rect(dark(L.petti, 0.18), cx - hw + 1, y1 + 0.4, hw * 2 - 2, 0.6);
      }
      const shape = [cx - B.waW - 0.5, y0, cx + B.waW + 0.5, y0, cx + hw, y1 - 0.6, cx + hw * 0.5, y1 - 0.1, cx, y1 + 0.2, cx - hw * 0.5, y1 - 0.1, cx - hw, y1 - 0.6];
      p.poly(lo, shape);
      p.clipPoly(shape, () => {
        p.poly(P.lowerSh, [cx + 2.5, y0, cx + hw + 1, y0, cx + hw + 1, y1 + 1, cx + 4.2, y1 + 1]);
        const sf = accOf(L, 'skirtfade');
        if (sf) { const k = y => y0 + (y1 - y0) * y; p.band(y0 - 1, k(0.28), () => p.poly(sf, shape)); p.band(k(0.28), k(0.5), () => p.poly(mix(sf, lo, 0.5), shape)); p.band(y0 - 1, k(0.5), () => p.poly(dark(sf, 0.12), [cx + 2.5, y0, cx + hw + 1, y0, cx + hw + 1, y1 + 1, cx + 4.2, y1 + 1])); }
        for (const t of [-0.64, -0.22, 0.2, 0.62]) { const xb = cx + t * hw; p.poly(dark(lo, 0.32), [cx + t * B.waW - 0.25, y0 + 2, cx + t * B.waW + 0.25, y0 + 2, xb + 0.6, y1 + 1, xb - 0.6, y1 + 1]); }
        for (const t of [-0.43, 0]) { const xb = cx + t * hw; p.poly(light(lo, 0.16), [cx + t * B.waW - 0.2, y0 + 3, cx + t * B.waW + 0.2, y0 + 3, xb + 0.5, y1 + 1, xb - 0.5, y1 + 1]); }
        const ch = accOf(L, 'cloudhem');
        if (ch) {
          p.rect('#2a7a74', cx - 4.2, y0 + 1, 1.2, y1 - y0 - 2);
          for (const y of [y0 + 2.4, y0 + 4.4]) { p.rect(ch, cx - 5.4, y, 3.6, 0.7); p.snap(ch, cx - 5.8, y - 0.3, 0.8, 1.2); p.snap(ch, cx - 2.2, y - 0.3, 0.8, 1.2); }
          for (const dx of [-1.6, 3]) p.poly('#2a2226', [cx + dx, y1 - 3.6, cx + dx + 0.6, y1 - 2.4, cx + dx, y1 - 1.2, cx + dx - 0.6, y1 - 2.4]);
          for (let x = cx - hw + 1.6; x < cx + hw - 1; x += 3) { p.snap('#b8b4c0', x - 0.8, y1 - 1.6, 1.6, 0.6); p.snap('#b8b4c0', x + 0.4, y1 - 2.2, 0.6, 0.6); }
        }
        if (L.hem) p.rect(L.hem, cx - hw - 1, y1 - 2, hw * 2 + 2, 1);
        const fl = accOf(L, 'snowflakes');
        if (fl) for (const [dx, dy] of [[-5, 0.66], [4.4, 0.78], [8.4, 0.5]]) { const x = cx + dx, y = y0 + (y1 - y0) * dy; p.rect(fl, x - 1.3, y - 0.35, 2.6, 0.7); p.rect(fl, x - 0.35, y - 1.3, 0.7, 2.6); p.snap(fl, x - 0.5, y - 0.5, 1, 1); }
        const pl = accOf(L, 'plaid');
        if (pl) {
          for (let x = cx - hw + 0.6; x < cx + hw; x += 2.8) p.poly(pl, [x + (x - cx) * -0.25, y0, x + (x - cx) * -0.25 + 1, y0, x + 1, y1 + 1, x, y1 + 1]);
          for (let y = y0 + 2; y < y1; y += 2.8) p.rect(pl, cx - hw - 1, y, hw * 2 + 2, 1);
          if (L.plaidHi) for (let y = y0 + 3.4; y < y1; y += 2.8) p.rect(L.plaidHi, cx - hw - 1, y, hw * 2 + 2, 0.5);
        }
        const zz = accOf(L, 'zigzag');
        if (zz) {
          p.rect(zz, cx - hw - 1, y1 - 1.2, hw * 2 + 2, 1.6);
          for (let x = cx - hw - 0.6; x < cx + hw; x += 2.4) p.poly(zz, [x, y1 - 1, x + 1.2, y1 - 3.4, x + 2.4, y1 - 1]);
        }
      });
      p.rect(dark(lo, 0.35), cx - B.waW - 0.5, y0, B.waW * 2 + 1, 1);
    };
    switch (L.low) {
      case 'pants':
        p.poly(P.lower, g ? [lx - 0.4, B.waist, rx + lw + 0.4, B.waist, rx + lw + 0.5, B.hip, rx + lw - 0.4, B.ankle - 1.2, rx + 0.6, B.ankle - 1.2, rx + 0.2, B.knee, cx + 0.6, B.hip + 2.4, cx - 0.6, B.hip + 2.4, lx + lw - 0.2, B.knee, lx + lw - 0.6, B.ankle - 1.2, lx + 0.4, B.ankle - 1.2, lx - 0.5, B.hip] : [lx - 0.4, B.waist, rx + lw + 0.4, B.waist, rx + lw + 0.5, B.hip, rx + lw - 0.4, B.ankle - 1.2, rx + 0.6, B.ankle - 1.2, cx + 0.3, B.hip + 3, cx - 0.3, B.hip + 3, lx + lw - 0.6, B.ankle - 1.2, lx + 0.4, B.ankle - 1.2, lx - 0.5, B.hip]);
        p.poly(P.lowerSh, [rx + 1.8, B.hip + 2, rx + lw + 0.5, B.hip, rx + lw - 0.4, B.ankle - 1.2, rx + 2.4, B.ankle - 1.2]);
        if ((v = accOf(L, 'flarehem'))) {
          for (const s of [-1, 1]) {
            const o = s < 0 ? (x => cx - x) : (x => cx + x);
            p.poly(P.lower, [o(0.6), B.knee + 2, o(lw + 1), B.knee + 2, o(lw + 2.6), B.ankle - 0.6, o(0.2), B.ankle - 0.6]);
            p.poly(mix(P.lower, v, 0.45), [o(0.4), B.ankle - 6, o(lw + 2.1), B.ankle - 6, o(lw + 2.6), B.ankle - 0.6, o(0.2), B.ankle - 0.6]);
            p.poly(v, [o(0.3), B.ankle - 3, o(lw + 2.4), B.ankle - 3, o(lw + 2.6), B.ankle - 0.6, o(0.2), B.ankle - 0.6]);
            p.poly(dark(P.lower, 0.25), [o(lw * 0.5), B.knee + 6, o(lw * 0.5 + 0.6), B.knee + 6, o(lw * 0.5 + 1), B.ankle - 0.6, o(lw * 0.5 + 0.2), B.ankle - 0.6]);
            for (let y = B.knee + 4; y < B.ankle - 3; y += 2.6) p.snap('#3a3840', o(lw * 0.5 + (s < 0 ? 1.4 : -1.4)), y, 0.6, 0.6);
          }
        }
        if ((v = accOf(L, 'neon'))) for (const s of [-1, 1]) { const o = legO(s); p.poly(s < 0 ? v : L.neon2 || '#5ae8f8', [o(lw - 1), B.hip + 1, o(lw), B.hip + 1, o(lw - 0.6), B.knee, o(lw - 1.3), B.ankle - 6, o(lw - 2.3), B.ankle - 6, o(lw - 1.6), B.knee]); }
        if ((v = accOf(L, 'flare'))) for (const s of [-1, 1]) {
          const o = s < 0 ? (x => cx - x) : (x => cx + x);
          p.poly(s < 0 ? P.lower : P.lowerSh, [o(1.1), B.knee + 1, o(lw + 0.6), B.knee + 1, o(lw + 2), B.ankle - 0.4, o(1), B.ankle - 0.4]);
          if (s < 0) p.poly(light(P.lower, 0.18), [o(lw - 0.6), B.knee + 2, o(lw + 0.2), B.knee + 2, o(lw + 1.4), B.ankle - 1.2, o(lw + 0.6), B.ankle - 1.2]);
          p.rect(dark(P.lower, 0.22), Math.min(o(1), o(lw + 2)), B.ankle - 1.2, lw + 1, 0.8);
        }
        if ((v = accOf(L, 'goldstripes'))) for (const s of [-1, 1]) for (const d of [-0.8, 0.8]) { const o = legO(s); p.poly(v, [o(lw * 0.5 + d - 0.3), B.hip + 3, o(lw * 0.5 + d + 0.3), B.hip + 3, o(lw * 0.5 + d + 0.2), B.knee + 2, o(lw * 0.5 + d - 0.2), B.knee + 2]); }
        if ((v = accOf(L, 'pantstripe'))) for (const s of [-1, 1]) { const o = legO(s); if (L.stripeOut) p.poly(v, [o(lw - 0.2), B.waist + 1, o(lw + 0.5), B.waist + 1, o(lw - 0.2), B.ankle - 1.4, o(lw - 0.9), B.ankle - 1.4]); else p.poly(v, [o(lw * 0.5 - 0.3), B.knee + 4, o(lw * 0.5 + 0.3), B.knee + 4, o(lw * 0.5 - 0.1), B.ankle - 2, o(lw * 0.5 - 0.7), B.ankle - 2]); }
        if (boots && L.tuck) for (const s of [-1, 1]) shaft(boots, bootTop, s);
        if ((v = accOf(L, 'bootcuff')) && boots) bootCuff(v);
    if ((v = accOf(L, 'kneeband')) && boots) for (const s of [-1, 1]) { const o = legO(s); p.poly(v, [o(-0.4), bootTop - 1.6, o(lw + 0.2), bootTop - 1.6, o(lw), bootTop, o(-0.2), bootTop]); }
    if ((v = accOf(L, 'bootplate')) && boots) for (const s of [-1, 1]) { const kx = legO(s)(lw * 0.5); p.poly(v, [kx - 1.6, bootTop + 0.6, kx + 1.6, bootTop + 0.6, kx + 1.2, bootTop + 3.4, kx, bootTop + 4.2, kx - 1.2, bootTop + 3.4]); }

        break;
      case 'skirt':
        skirt(B.waist, hem);
        if ((v = accOf(L, 'ruffle3'))) {
          const hw = B.hiW + 4;
          for (const k of [0.38, 0.7]) {
            const y = B.waist + (hem - B.waist) * k, w = B.waW + (hw - B.waW) * k + 0.8;
            p.poly(v, [cx - w, y - 0.6, cx + w, y - 0.6, cx + w + 0.3, y + 0.5, cx - w - 0.3, y + 0.5]);
            p.poly(dark(P.lower, 0.25), [cx - w - 0.3, y + 0.5, cx + w + 0.3, y + 0.5, cx + w + 0.3, y + 1.1, cx - w - 0.3, y + 1.1]);
          }
        }
        if (accOf(L, 'skirtslit')) { const o = legO(1); p.poly(P.legs, [o(0.6), B.knee - 4, o(lw - 0.6), B.knee - 2, o(lw), hem + 0.4, o(0.2), hem + 0.4]); p.poly(dark(P.lower, 0.3), [o(0.2), B.knee - 4, o(0.8), B.knee - 4, o(0.6), hem + 0.4, o(0), hem + 0.4]); }
        if ((v = accOf(L, 'panell'))) {
          const pts = [cx - B.waW - 0.5, B.waist, cx + 0.4, B.waist, cx - 0.6, hem + 0.2, cx - B.hiW - 4, hem - 0.6];
          p.poly(v, pts);
          p.clipPoly(pts, () => p.poly(dark(v, 0.25), [cx - 2, B.waist, cx + 0.4, B.waist, cx - 0.6, hem + 1, cx - 3, hem + 1]));
        }
        if ((v = accOf(L, 'goldarc'))) { for (let a = 0; a < 6; a++) { const t = -0.9 + a * 0.36; p.snap(v, cx + 3.6 + Math.cos(t) * 3.4, B.hip + 1.4 + Math.sin(t) * 3.4, 0.7, 0.7); } p.snap(v, cx + 1, B.hip - 2, 0.6, 3); }
        if ((v = accOf(L, 'shortsr'))) {
          p.poly(v, [cx + 0.4, B.waist, cx + B.waW + 0.6, B.waist, cx + B.hiW + 1.8, B.hip + 4.6, cx + 1.2, B.hip + 5]);
          p.poly(light(v, 0.12), [cx + 1.4, B.waist + 1, cx + 2.4, B.waist + 1, cx + 2.6, B.hip + 4.6, cx + 1.6, B.hip + 4.8]);
          for (const [dx, dy] of [[4, 1.6], [5.4, 1.6], [4, 3], [5.4, 3]]) p.snap('#c8ccd4', cx + dx, B.waist + dy, 0.8, 0.8);
        }
        break;
      case 'shorts':
        p.poly(P.lower, [cx - B.waW - 0.5, B.waist, cx + B.waW + 0.5, B.waist, cx + B.hiW + 1.2, B.hip + 5, cx + 0.6, B.hip + 5, cx, B.hip + 4.4, cx - 0.6, B.hip + 5, cx - B.hiW - 1.2, B.hip + 5]);
        p.poly(P.lowerSh, [cx + 2, B.waist + 1, cx + B.waW + 0.5, B.waist, cx + B.hiW + 1.2, B.hip + 5, cx + 2.4, B.hip + 5, cx + 1.4, B.hip + 1]);
        p.rect(dark(P.lower, 0.35), cx - B.waW - 0.5, B.waist, B.waW * 2 + 1, 1);
        break;
      case 'long':
        p.poly(P.lower, [cx - B.waW - 0.5, B.waist, cx + B.waW + 0.5, B.waist, cx + B.hiW + 6, B.ankle + 1, cx - B.hiW - 6, B.ankle + 1]);
        p.poly(P.lowerSh, [cx + 2, B.waist + 1, cx + B.waW + 0.5, B.waist, cx + B.hiW + 6, B.ankle + 1, cx + 4, B.ankle + 1]);
        break;
      case 'ballgown': {
        const hw = B.hiW + 7.5, y1 = B.ankle + 1.6, shape = [cx - B.waW - 0.6, B.waist, cx + B.waW + 0.6, B.waist, cx + B.hiW + 1.6, B.hip, cx + hw - 1.6, B.knee + 4, cx + hw, y1, cx - hw, y1, cx - hw + 1.6, B.knee + 4, cx - B.hiW - 1.6, B.hip];
        p.poly(P.lower, shape);
        p.clipPoly(shape, () => {
          p.poly(P.lowerSh, [cx + 3, B.waist, cx + 20, B.waist, cx + 20, y1 + 2, cx + 7, y1 + 2]);
          for (const k of [0.3, 0.58, 0.84]) {
            const y = B.waist + (y1 - B.waist) * k, w = B.waW + (hw - B.waW) * k + 1;
            p.rect(dark(P.lower, 0.2), cx - w, y + 0.4, w * 2, 0.8);
            for (let x = cx - w; x <= cx + w; x += 2.4) { p.ell(dark(P.lower, 0.2), x, y + 1, 1.4, 0.9); p.ell(light(P.lower, 0.5), x - 0.3, y - 0.2, 1.2, 0.7); }
          }
          for (const t of [-0.6, -0.2, 0.25, 0.65]) p.poly(dark(P.lower, 0.1), [cx + t * B.waW - 0.2, B.hip, cx + t * B.waW + 0.2, B.hip, cx + t * hw + 0.5, y1, cx + t * hw - 0.5, y1]);
        });
        const rose = L.roseCol;
        if (rose) for (const [dx, dy, r] of [[-B.hiW + 0.6, B.hip - 0.4, 1.6], [B.hiW - 0.8, B.hip - 0.2, 1.6], [-1.6, B.hip + 5, 1.4], [1.4, B.hip + 7, 1.5], [3.8, B.hip + 4, 1.3], [-hw + 3, B.knee + 8, 1.7], [hw - 3.4, B.knee + 10, 1.8]]) { p.ell(dark(rose, 0.2), cx + dx, dy, r + 0.4, r + 0.3); p.ell(rose, cx + dx - 0.2, dy - 0.2, r, r * 0.9); p.snap(dark(rose, 0.25), cx + dx - 0.4, dy - 0.4, 0.8, 0.8); }
        break;
      }
      case 'gown': {
        const front = [cx - B.waW - 0.6, B.waist, cx + B.waW + 0.6, B.waist, cx + B.hiW + 1.4, B.hip + 2, cx + B.hiW + 3, B.ankle + 1, cx + 0.2, B.ankle + 1, cx - 1.4, B.knee, cx - 3, B.hip + 5, cx - B.waW - 1.4, B.hip + 1];
        p.poly(P.lower, front);
        p.clipPoly(front, () => {
          p.poly(P.lowerSh, [cx + 2.6, B.waist, cx + 9, B.waist, cx + B.hiW + 6, B.ankle + 2, cx + 3.6, B.ankle + 2]);
          for (const [x0, x1] of [[cx + 1, cx + 0.6], [cx + 4.4, cx + 6.4]]) p.poly(dark(P.lower, 0.14), [x0, B.hip + 3, x0 + 0.6, B.hip + 3, x1 + 0.6, B.ankle + 1, x1, B.ankle + 1]);
        });
        p.poly(mix(P.lower, '#c02830', 0.75), [cx - 3, B.hip + 5, cx - 2.2, B.hip + 5, cx + 0.8, B.ankle + 1, cx + 0.2, B.ankle + 1, cx - 1.4, B.knee]);
        break;
      }
      case 'slit':
        for (const s of [-1, 1]) {
          const sy = L.slitTo === 'knee' ? B.knee + (s < 0 ? 9 : 4) : B.ankle + 1.5;
          const sw = L.slitTo === 'knee' ? 2.6 : 5.5;
          p.poly(s < 0 ? P.lower : P.lowerSh, [cx + s * 1.2, B.waist, cx + s * (B.waW + 0.6), B.waist, cx + s * (B.hiW + sw), sy, cx + s * (B.hiW - 1.2), sy]);
          if (L.slitTo !== 'knee') p.poly(P.trim, [cx + s * (B.hiW - 1.2), B.ankle + 0.5, cx + s * (B.hiW + 5.5), B.ankle + 0.5, cx + s * (B.hiW + 5.5), B.ankle + 1.5, cx + s * (B.hiW - 1.2), B.ankle + 1.5]);
        }
        p.poly(L.apron || dark(P.lower, 0.5), [cx - B.waW - 0.2, B.waist, cx + B.waW + 0.2, B.waist, cx + B.hiW - 1.5, B.hip + 9, cx - B.hiW + 1.5, B.hip + 9]);
        if (!accOf(L, 'sigil')) p.rect(P.trim, cx - 0.5, B.waist + 1, 1, B.hip + 7 - B.waist);
        break;
    }
    for (const [key, sd] of [['kneepad', -1], ['kneepadr', 1]]) if ((v = accOf(L, key))) {
      const kx = legO(sd)(lw * 0.5);
      p.ell(dark(v, 0.3), kx, B.knee, lw * 0.5 + 0.9, 2.3);
      p.ell(v, kx, B.knee - 0.3, lw * 0.5 + 0.6, 1.9);
      p.ell(light(v, 0.4), kx - 0.6, B.knee - 1, 1, 0.6);
    }
    p.poly(P.inner, [cx - B.shW + 1.5, B.sh, cx + B.shW - 1.5, B.sh, cx + B.waW + 0.6, B.waist, cx - B.waW - 0.6, B.waist]);
    p.poly(P.innerSh, [cx + 2.5, B.sh + 1, cx + B.shW - 1.5, B.sh, cx + B.waW + 0.6, B.waist, cx + 2.5, B.waist]);
    const panel = (x0, x1, yEnd, hemIn, hemOut, col) => {
      p.poly(col || P.top, [cx + x0, B.sh, cx + x1, B.sh, cx + hemIn, yEnd, cx + hemOut, yEnd + 1]);
    };
    switch (L.coat) {
      case 'valk': {
        const plate = P.top, glow = L.glow || '#ff9a2a', fur = L.fur || '#1e1c22', top = B.chest - 0.6;
        p.poly(P.skin, [cx - B.shW + 1.5, B.sh, cx + B.shW - 1.5, B.sh, cx + B.waW + 0.6, top + 1, cx - B.waW - 0.6, top + 1]);
        p.poly(P.skinSh, [cx + 2.6, B.sh, cx + B.shW - 1.5, B.sh, cx + B.waW + 0.6, top + 1, cx + 3, top + 1]);
        const nw = B.neck || 4;
        p.rect(P.inner, cx - nw / 2 - 0.4, B.sh - 3, nw + 0.8, 3.4);
        p.poly(glow, [cx - 1, B.sh + 0.2, cx + 1, B.sh + 0.2, cx, B.sh + 1.6]);
        for (const s of [-1, 1]) {
          const pl = [cx + s * 0.4, top + 1.6, cx + s * (B.waW + 0.8), top - 0.4, cx + s * (B.waW + 0.6), top + 3.4, cx + s * 1.2, top + 4];
          p.poly(s > 0 ? dark(plate, 0.2) : plate, pl);
          p.snap(glow, cx + s * (B.waW * 0.5 + 0.6) - 0.6, top + 1.4, 1.2, 0.8);
          p.poly(plate, [cx + s * (B.waW - 0.4), B.waist - 1.6, cx + s * (B.waW + 1), B.waist - 2, cx + s * (B.hiW + 1.4), B.hip + 1.6, cx + s * (B.hiW - 1.2), B.hip + 2]);
          p.poly(glow, [cx + s * (B.hiW - 0.4), B.waist + 1, cx + s * (B.hiW + 0.6), B.waist + 1.6, cx + s * (B.hiW + 0.2), B.hip + 0.4, cx + s * (B.hiW - 0.6), B.hip]);
        }
        p.poly(dark(plate, 0.15), [cx - 1.2, B.waist - 1, cx + 1.2, B.waist - 1, cx + 0.6, B.hip, cx - 0.6, B.hip]);
        p.snap(glow, cx - 0.4, B.waist, 0.8, 1.6);
        const fx = cx + B.shW;
        p.ell(dark(fur, 0.2), fx - 0.6, B.sh + 1, 3.4, 2.8);
        for (const [dx, dy] of [[-2.4, -0.4], [0, -1], [1.8, 0.6], [-0.6, 1.6]]) p.ell(light(fur, 0.12), fx + dx, B.sh + dy, 1.4, 1.2);
        break;
      }
      case 'hoodie': {
        const cord = L.cord || '#f8f4ec', end = B.hip + 1.6;
        const body = [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 1.4, B.waist, cx + B.hiW + 1, end, cx - B.hiW - 1, end, cx - B.waW - 1.4, B.waist];
        p.poly(P.top, body);
        p.clipPoly(body, () => {
          p.poly(P.topSh, [cx + 3, B.sh, cx + 12, B.sh, cx + 12, end + 1, cx + 4, end + 1]);
          p.rect(dark(P.top, 0.16), cx - 12, end - 1.6, 24, 1.6);
          const py = B.waist - 0.6, pk = [cx - 4.6, py, cx + 4.6, py, cx + 5.4, end - 1.8, cx - 5.4, end - 1.8];
          p.poly(dark(P.top, 0.1), pk);
          p.poly(dark(P.top, 0.24), [cx - 4.6, py, cx + 4.6, py, cx + 4.6, py + 0.6, cx - 4.6, py + 0.6]);
          p.rect(dark(P.top, 0.24), cx - 0.3, py, 0.6, end - 1.8 - py);
        });
        for (const s of [-1, 1]) p.rect(cord, cx + s * 1.3 - 0.3, B.sh + 0.6, 0.6, 4.6);
        const pw = accOf(L, 'pawprint');
        if (pw) { const x = cx + 3.6, y = B.chest + 0.4; p.ell(pw, x, y, 1.2, 1); for (const dx of [-1.2, 0, 1.2]) p.snap(pw, x + dx - 0.35, y - 2, 0.7, 0.7); }
        break;
      }
      case 'overalls': {
        const bib = P.lower, st = L.strap || '#6a4630', metal = '#c8ccd4', top = B.chest + 1.2;
        const front = [cx - B.waW + 0.2, top, cx + B.waW - 0.2, top, cx + B.waW + 0.6, B.waist + 0.6, cx - B.waW - 0.6, B.waist + 0.6];
        p.poly(bib, front);
        p.clipPoly(front, () => { p.poly(P.lowerSh, [cx + 2.2, top, cx + 9, top, cx + 9, B.waist + 1, cx + 2.6, B.waist + 1]); p.rect(dark(bib, 0.35), cx - 2.4, top + 2.6, 4.8, 0.6); p.rect(light(bib, 0.2), cx - B.waW, top + 0.2, B.waW * 2, 0.5); });
        for (const s of [-1, 1]) {
          p.poly(st, [cx + s * (B.shW - 1), B.sh - 0.2, cx + s * (B.shW - 2.6), B.sh - 0.2, cx + s * (B.waW - 2), top + 0.6, cx + s * (B.waW - 0.6), top + 0.6]);
          p.snap(dark(metal, 0.4), cx + s * (B.waW - 1.3) - 0.9, top - 0.2, 1.8, 1.8); p.snap(metal, cx + s * (B.waW - 1.3) - 0.6, top, 1.2, 1.2);
          p.poly(L.tab || '#eceae4', [cx + s * (B.waW + 0.4), B.waist - 0.4, cx + s * (B.waW + 1.6), B.waist, cx + s * (B.hiW + 0.6), B.hip + 1.4, cx + s * (B.hiW - 0.6), B.hip + 1.6]);
          p.snap(metal, cx + s * (B.hiW - 0.2) - 0.4, B.hip - 0.2, 0.8, 0.8);
        }
        const b = accOf(L, 'molebadge');
        if (b) { p.ell(dark(b, 0.3), cx, top + 4.6, 1.3, 1.3); p.ell(b, cx, top + 4.4, 1, 1); }
        break;
      }
      case 'jacket':
        panel(-B.shW, -2.6, B.waist + 3, -2.2, -B.hiW - 0.8);
        panel(B.shW, 2.6, B.waist + 3, 2.2, B.hiW + 0.8);
        p.poly(P.trim, [cx - 3.6, B.sh, cx - 2.6, B.sh, cx - 2.2, B.waist + 3, cx - 3.2, B.waist + 3]);
        p.poly(P.trim, [cx + 3.6, B.sh, cx + 2.6, B.sh, cx + 2.2, B.waist + 3, cx + 3.2, B.waist + 3]);
        p.poly(P.topSh, [cx + B.shW - 2.5, B.sh + 2, cx + B.shW, B.sh, cx + B.hiW + 0.8, B.waist + 4, cx + B.hiW - 1.5, B.waist + 4]);
        break;
      case 'long':
        panel(-B.shW, -2.6, B.knee - 3, -3.2, -B.hiW - 4.5);
        panel(B.shW, 2.6, B.knee - 3, 3.2, B.hiW + 4.5);
        p.poly(P.trim, [cx - 3.6, B.sh, cx - 2.6, B.sh, cx - 3.2, B.knee - 3, cx - 4.2, B.knee - 3]);
        p.poly(P.trim, [cx + 3.6, B.sh, cx + 2.6, B.sh, cx + 3.2, B.knee - 3, cx + 4.2, B.knee - 3]);
        p.poly(P.topSh, [cx + B.shW - 2.5, B.sh + 2, cx + B.shW, B.sh, cx + B.hiW + 4.5, B.knee - 2, cx + B.hiW + 1, B.knee - 2]);
        if (L.coatLow) p.band(B.waist + 1, B.knee, () => {
          panel(-B.shW, -2.6, B.knee - 3, -3.2, -B.hiW - 4.5, L.coatLow);
          panel(B.shW, 2.6, B.knee - 3, 3.2, B.hiW + 4.5, dark(L.coatLow, 0.18));
          p.poly(light(L.coatLow, 0.3), [cx - 3.6, B.sh, cx - 2.6, B.sh, cx - 3.2, B.knee - 3, cx - 4.2, B.knee - 3]);
          p.poly(light(L.coatLow, 0.3), [cx + 3.6, B.sh, cx + 2.6, B.sh, cx + 3.2, B.knee - 3, cx + 4.2, B.knee - 3]);
        });
        break;
      case 'mid': {
        const lin = L.lining || P.trim;
        panel(-B.shW, -2.6, coatHem, -3, -B.hiW - flare);
        panel(B.shW, 2.6, coatHem, 3, B.hiW + flare);
        p.poly(P.topSh, [cx + B.shW - 2.5, B.sh + 2, cx + B.shW, B.sh, cx + B.hiW + flare, coatHem + 1, cx + B.hiW + flare - 3.3, coatHem + 0.5]);
        p.poly(lin, [cx - 3.6, B.sh, cx - 2.6, B.sh, cx - 3, coatHem, cx - 4, coatHem + 0.1]);
        p.poly(lin, [cx + 3.6, B.sh, cx + 2.6, B.sh, cx + 3, coatHem, cx + 4, coatHem + 0.1]);
        p.band(coatHem - 0.8, coatHem + 2, () => {
          for (const s of [-1, 1]) p.poly(dark(lin, 0.15), [cx + s * B.shW, B.sh, cx + s * 2.6, B.sh, cx + s * 3, coatHem, cx + s * (B.hiW + flare), coatHem + 1]);
        });
        p.rect(dark(P.top, 0.45), cx - B.waW - 0.8, B.waist - 0.2, 2.2, 1.4);
        break;
      }
      case 'split': {
        const low = L.coatLow || P.top, lin = L.lining || P.trim, end = B.hip + (L.coatLen || 31);
        for (const s of [-1, 1]) {
          const pts = [cx + s * B.shW, B.sh, cx + s * 2.6, B.sh, cx + s * 3.2, B.waist, cx + s * 3.6, end - 1, cx + s * (B.hiW * 0.5 + 2.4), end + 1.4, cx + s * (B.hiW + 1.6), end - 1.6, cx + s * (B.hiW + 4.6), end + 1, cx + s * (B.hiW + 2.2), B.waist + 2, cx + s * (B.waW + 1.4), B.waist];
          p.poly(P.top, pts);
          p.clipPoly(pts, () => {
            if (s > 0) p.poly(P.topSh, [cx + B.shW - 2.4, B.sh, cx + 30, B.sh, cx + 30, end + 3, cx + B.hiW + 1.6, end + 3, cx + B.waW - 0.4, B.waist]);
            p.rect(mix(P.top, low, 0.5), cx - 30, B.waist - 0.6, 60, 1.2);
            p.rect(low, cx - 30, B.waist + 0.6, 60, 60);
            if (s > 0) p.poly(dark(low, 0.22), [cx + B.waW + 0.4, B.waist + 0.6, cx + 30, B.waist + 0.6, cx + 30, end + 3, cx + B.hiW + 1.4, end + 3]);
            p.rect(light(low, 0.16), cx - 30, end - 2.6, 60, 0.8);
            p.poly(L.edge || lin, [cx + s * 2.4, B.sh, cx + s * 3.6, B.sh, cx + s * 4.4, end + 2, cx + s * 3.2, end + 2]);
            if (L.edge) p.poly(lin, [cx + s * 3.6, B.hip + 4, cx + s * 5.6, B.hip + 4, cx + s * 6.8, end + 2, cx + s * 4.4, end + 2]);
            const sw = accOf(L, 'swirl');
            if (sw) { const x = cx + s * (B.hiW + 1); p.poly(sw, [x, B.sh + 2, x + s * 1.6, B.chest, x + s * 0.4, B.waist - 2, x - s * 1.2, B.waist + 2, x - s * 0.2, B.chest + 1]); p.poly(sw, [x + s * 1, B.hip + 8, x + s * 2.4, B.hip + 14, x + s * 1.2, end - 2, x + s * 0.4, B.hip + 14]); }
            const rb = accOf(L, 'redbtn');
            if (rb && s > 0) for (const y of [B.hip + 3, B.hip + 8]) p.ell(rb, cx + 4.6, y, 0.9, 0.9);
          });
        }
        break;
      }
      case 'leo': {
        p.poly(P.top, [cx - B.waW - 0.8, B.sh + 1.6, cx + B.waW + 0.8, B.sh + 1.6, cx + B.waW + 0.6, B.chest + 2.6, cx - B.waW - 0.6, B.chest + 2.6]);
        p.poly(P.inner, [cx - 2.6, B.chest + 2, cx + 2.6, B.chest + 2, cx + B.waW + 0.6, B.waist, cx + B.waW + 0.8, B.waist + 1.4, cx - B.waW - 0.8, B.waist + 1.4, cx - B.waW - 0.6, B.waist]);
        p.poly(P.skin, [cx - B.waW - 0.6, B.chest + 2.6, cx - 2.6, B.chest + 2.2, cx - B.waW - 0.4, B.waist - 1.6]); p.poly(P.skin, [cx + B.waW + 0.6, B.chest + 2.6, cx + 2.6, B.chest + 2.2, cx + B.waW + 0.4, B.waist - 1.6]);
        p.snap(P.top, cx - 0.5, B.sh + 1.6, 1, 1.4);
        break;
      }
      case 'wrap': {
        const pts = [cx - B.shW + 1.6, B.sh + 0.6, cx + B.shW - 1.6, B.sh + 0.6, cx + B.waW + 0.8, B.waist, cx + B.hiW + 0.6, B.hip + 1, cx - B.hiW - 0.6, B.hip + 1, cx - B.waW - 0.8, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => {
          p.poly(P.innerSh, [cx + 2.4, B.sh, cx + B.shW, B.sh, cx + B.hiW + 2, B.hip + 2, cx + 3, B.hip + 2]);
          p.poly(P.innerSh, [cx - 3, B.sh + 1, cx - 2, B.sh + 1, cx + B.waW, B.waist - 1, cx + B.waW - 1, B.waist]);
          p.rect(light(P.top, 0.2), cx - B.waW - 1, B.waist - 1.6, B.waW * 2 + 2, 1.8);
        });
        for (const s of [-1, 1]) p.poly(P.skin, [cx + s * (B.shW - 1.6), B.sh + 0.6, cx + s * (B.shW + 0.4), B.sh + 0.4, cx + s * (B.shW - 0.2), B.sh + 3.4, cx + s * (B.shW - 2.6), B.sh + 2.6]);
        break;
      }
      case 'doll': {
        for (const s of [-1, 1]) {
          p.poly(P.top, [cx + s * (B.shW + 0.8), B.sh + 1.6, cx + s * (B.waW + 0.6), B.sh + 1.4, cx + s * (B.waW + 0.2), B.waist, cx + s * (B.waW + 1.6), B.waist + 0.4]);
          p.poly(light(P.top, 0.12), [cx + s * (B.waW + 0.6), B.sh + 1.4, cx + s * (B.waW + 1.4), B.sh + 1.4, cx + s * (B.waW + 0.9), B.waist, cx + s * (B.waW + 0.2), B.waist]);
        }
        break;
      }
      case 'memovest': {
        const end = B.knee - 2;
        p.poly(P.inner, [cx - B.shW + 2, B.sh, cx + B.shW - 2, B.sh, cx + B.waW + 0.6, B.waist, cx + B.waW + 0.8, B.hip + 1, cx - B.waW - 0.8, B.hip + 1, cx - B.waW - 0.6, B.waist]);
        p.poly(light(P.inner, 0.18), [cx - B.waW, B.chest - 1, cx - 1, B.chest - 2, cx - 1, B.chest + 1, cx - B.waW, B.chest + 2]);
        for (const s of [-1, 1]) {
          const pts = [cx + s * (B.shW - 1.6), B.sh - 0.4, cx + s * (B.waW - 1.2), B.sh, cx + s * 2.4, B.waist + 1, cx + s * 2.2, end, cx + s * (B.hiW + 4), end + 1, cx + s * (B.hiW + 1.4), B.hip, cx + s * (B.waW + 1.6), B.waist];
          p.poly(P.top, pts);
          p.clipPoly(pts, () => { p.poly(L.lining, [cx + s * 2.2, B.waist, cx + s * 3.2, B.waist, cx + s * 3, end + 2, cx + s * 2, end + 2]); if (s > 0) p.poly(dark(P.top, 0.14), [cx + B.hiW, B.waist, cx + 20, B.waist, cx + 20, end + 2, cx + B.hiW + 1, end + 2]); for (const k of [0.3, 0.6]) p.rect(dark(P.top, 0.12), cx - 20, B.hip + (end - B.hip) * k, 40, 0.4); });
        }
        const cr = accOf(L, 'crystal') || L.lining;
        p.poly(cr, [cx - 2.2, B.chest + 3, cx + 2.2, B.chest + 3, cx + 2, B.hip + 8, cx, B.hip + 11, cx - 2, B.hip + 8]);
        p.poly(light(cr, 0.45), [cx - 2.2, B.chest + 3, cx, B.chest + 3, cx - 0.4, B.hip + 9, cx - 2, B.hip + 8]);
        p.poly(dark(cr, 0.2), [cx + 0.6, B.chest + 6, cx + 2.2, B.chest + 3, cx + 2, B.hip + 8, cx + 0.6, B.hip + 9]);
        break;
      }
      case 'maid': {
        const pink = P.trim, ap = L.apron || '#f8f8fc', y0 = B.chest + 1.6, yc = B.waist - 1.4, top = B.waist + 0.2, bot = (hem || B.hip + 10) - 1.4;
        p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.shW - 2, B.sh + 1.6, cx - B.shW + 2, B.sh + 1.6]);
        p.poly(P.inner, [cx - B.shW + 1.6, B.sh + 1.2, cx + B.shW - 1.6, B.sh + 1.2, cx + B.waW + 1, y0, cx - B.waW - 1, y0]);
        p.poly(P.innerSh, [cx + 2.6, B.sh + 1.2, cx + B.shW - 1.6, B.sh + 1.2, cx + B.waW + 1, y0, cx + 3, y0]);
        for (let x = cx - B.shW + 2; x < cx + B.shW - 2; x += 2) p.rect(dark(P.top, 0.1), x, B.sh + 1.4, 1, 0.5);
        p.rect(pink, cx - 0.9, B.sh + 2.2, 0.6, y0 - B.sh - 2.2); p.rect(pink, cx + 0.3, B.sh + 2.2, 0.6, y0 - B.sh - 2.2);
        const cs = [cx - B.waW - 1, y0, cx + B.waW + 1, y0, cx + B.waW + 0.6, yc, cx - B.waW - 0.6, yc];
        p.poly(P.top, cs);
        p.clipPoly(cs, () => p.poly(dark(P.top, 0.22), [cx + 2.6, y0, cx + 9, y0, cx + 9, yc, cx + 2.8, yc]));
        for (const dx of [-2, 2]) for (const y of [y0 + 1.4, y0 + 3.6]) p.snap(pink, cx + dx - 0.4, y, 0.8, 0.8);
        p.poly(P.skin, [cx - B.waW - 0.6, yc, cx + B.waW + 0.6, yc, cx + B.waW + 0.6, top, cx - B.waW - 0.6, top]);
        p.poly(P.skinSh, [cx + 2.8, yc, cx + B.waW + 0.6, yc, cx + B.waW + 0.6, top, cx + 3, top]);
        p.rect(P.top, cx - 1.8, B.sh - 2.4, 3.6, 2.2);
        p.rect(pink, cx - 1.8, B.sh - 0.6, 3.6, 0.5);
        p.poly(pink, [cx, B.sh - 1.2, cx - 2.8, B.sh - 2.6, cx - 2.6, B.sh + 0.4]); p.poly(pink, [cx, B.sh - 1.2, cx + 2.8, B.sh - 2.6, cx + 2.6, B.sh + 0.4]);
        p.snap(dark(pink, 0.3), cx - 0.5, B.sh - 1.7, 1, 1);
        const apr = [cx - 4.6, top, cx + 4.6, top, cx + 4.4, bot, cx - 4.4, bot];
        for (let x = cx - 4.4; x <= cx + 4.4; x += 1.8) p.ell(ap, x, bot, 1, 0.9);
        p.poly(ap, apr);
        p.clipPoly(apr, () => { p.poly(dark(ap, 0.08), [cx + 1.6, top, cx + 6, top, cx + 6, bot + 1, cx + 2, bot + 1]); p.poly(pink, [cx - 3.4, top + 1.6, cx + 3.4, top + 1.6, cx + 3.2, bot - 1.6, cx - 3.2, bot - 1.6]); p.poly(ap, [cx - 2.8, top + 1.6, cx + 2.8, top + 1.6, cx + 2.6, bot - 2.2, cx - 2.6, bot - 2.2]); p.rect(ap, cx - 2.8, top, 5.6, 1.6); });
        for (const dx of [-4, 4]) { p.poly(pink, [cx + dx, top + 0.4, cx + dx - 1.4, top - 0.6, cx + dx - 1.4, top + 1.4]); p.poly(pink, [cx + dx, top + 0.4, cx + dx + 1.4, top - 0.6, cx + dx + 1.4, top + 1.4]); }
        const bx = cx + B.hiW + 1;
        p.poly(ap, [bx - 1.6, top + 0.6, bx + 3, top - 2.6, bx + 3.6, top + 2.4]); p.poly(ap, [bx - 1.6, top + 0.6, bx + 2.6, top + 3.6, bx + 1, top + 9]);
        p.poly(dark(ap, 0.12), [bx + 0.6, top + 2.6, bx + 2.6, top + 3.6, bx + 1, top + 9]);
        break;
      }
      case 'haori': {
        const gold = P.trim, lin = L.lining || '#f2f2f4', ob = L.obiCol || P.top, y0 = B.chest + 2.6, y1 = B.waist + 1.6, end = B.knee - 1;
        for (const s of [-1, 1]) {
          const x0 = cx + s * B.shW;
          const pts = [x0 - s * 0.6, B.sh + 4, x0 + s * 2.2, B.sh + 5, x0 + s * 3.8, end, x0 + s * 0.4, end + 1.4, x0 - s * 1.6, B.hip];
          p.poly(s < 0 ? P.top : P.topSh, pts);
          p.poly(lin, [x0 + s * 2.6, B.hip, x0 + s * 3.8, end, x0 + s * 2.8, end + 0.4, x0 + s * 1.8, B.hip]);
          p.poly(gold, [x0 + s * 1.2, end - 0.6, x0 + s * 3.8, end - 1, x0 + s * 3.8, end, x0 + s * 1.2, end + 0.4]);
        }
        p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.shW - 2.4, B.sh + 2.2, cx - B.shW + 2.4, B.sh + 2.2]);
        p.poly(P.inner, [cx - B.waW - 1, B.sh + 1.4, cx - 2, B.sh, cx + 2, B.sh, cx + B.waW + 1, B.sh + 1.4, cx + B.waW + 0.6, y0, cx - B.waW - 0.6, y0]);
        p.poly(P.innerSh, [cx + 2.4, B.sh, cx + B.waW + 1, B.sh + 1.4, cx + B.waW + 0.6, y0, cx + 3, y0]);
        p.rect(P.inner, cx - 1.8, B.sh - 2.4, 3.6, 2.6);
        p.rect(gold, cx - 1.8, B.sh - 2.6, 3.6, 0.7);
        for (const s of [-1, 1]) p.poly(gold, [cx + s * 2.2, B.sh, cx + s * 2.9, B.sh, cx + s * 0.4, B.chest + 0.4, cx - s * 0.1, B.chest - 0.4]);
        p.poly(ob, [cx - B.waW - 0.9, y0, cx + B.waW + 0.9, y0, cx + B.waW + 1, y1, cx - B.waW - 1, y1]);
        p.rect(gold, cx - B.waW - 0.9, y0, (B.waW + 0.9) * 2, 1);
        p.rect(lin, cx - B.waW - 0.9, y0 + 1.6, (B.waW + 0.9) * 2, 0.7);
        p.rect(gold, cx - B.waW - 1, y1 - 1, (B.waW + 1) * 2, 1);
        const fy = (y0 + y1) / 2 + 0.8;
        p.poly(gold, [cx, fy + 2, cx - 3.6, fy - 0.8, cx - 2.4, fy - 2.8, cx, fy - 3.6, cx + 2.4, fy - 2.8, cx + 3.6, fy - 0.8]);
        for (const dx of [-1.2, 0, 1.2]) p.poly(dark(gold, 0.35), [cx, fy + 1.6, cx + dx * 2.2 - 0.3, fy - 2.6, cx + dx * 2.2 + 0.3, fy - 2.6]);
        for (const dx of [-1.4, 1.4]) { p.rect(gold, cx + dx - 0.3, y1, 0.6, 3.6); p.ell(gold, cx + dx, y1 + 4, 0.6, 0.9); }
        const top = y1, bot = (hem || B.knee) + 0.6;
        const ap = [cx - 3.8, top, cx + 3.8, top, cx + 3.2, bot - 1.4, cx, bot + 0.6, cx - 3.2, bot - 1.4];
        p.poly(P.top, ap);
        p.clipPoly(ap, () => {
          p.poly(dark(P.top, 0.25), [cx + 1.2, top, cx + 4, top, cx + 4, bot + 1, cx + 1, bot + 1]);
          for (const s of [-1, 1]) p.poly(gold, [cx + s * 3.8, top, cx + s * 3, top, cx + s * 2.5, bot - 1.6, cx, bot - 0.2, cx, bot + 0.8, cx + s * 3.2, bot - 1.2]);
          p.poly(gold, [cx - 2, top + 0.4, cx - 1.4, top + 0.4, cx, top + 4, cx + 1.4, top + 0.4, cx + 2, top + 0.4, cx, top + 5.4]);
        });
        const ky = bot - 5.2;
        p.ell(gold, cx, ky, 2.2, 2.2); p.ell(P.top, cx, ky, 1.6, 1.6);
        for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) p.ell(gold, cx + dx * 0.8, ky + dy * 0.8, 0.5, 0.5);
        p.snap(gold, cx - 0.4, ky - 3.6, 0.8, 0.8);
        const leaf = L.leaf || '#c8a060';
        for (const [dx, dy] of [[-5.6, 3], [-6.4, 9], [5.4, 5], [6.2, 11], [-5, 15], [5, 16]]) if (B.waist + dy + 4 < bot) { p.ell(leaf, cx + dx, B.waist + dy + 3, 1.1, 0.8); p.snap(dark(leaf, 0.2), cx + dx - 0.2, B.waist + dy + 3.6, 0.5, 1); }
        break;
      }
      case 'bunnyvest': {
        const fur = L.lining || '#f4f2ee', y1 = B.chest + 3.4;
        p.poly(P.skin, [cx - B.waW - 0.6, y1 - 0.4, cx + B.waW + 0.6, y1 - 0.4, cx + B.waW + 0.6, B.waist + 0.4, cx - B.waW - 0.6, B.waist + 0.4]);
        p.poly(P.skinSh, [cx + 2.4, y1 - 0.4, cx + B.waW + 0.6, y1 - 0.4, cx + B.waW + 0.6, B.waist + 0.4, cx + 2.8, B.waist + 0.4]);
        p.snap(P.skinSh, cx - 0.5, B.waist - 1.6, 1, 1.2);
        p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.shW - 2.4, B.sh + 2, cx - B.shW + 2.4, B.sh + 2]);
        p.poly(P.inner, [cx - B.waW - 1.2, B.sh + 1.2, cx - 2.4, B.sh + 0.2, cx + 2.4, B.sh + 0.2, cx + B.waW + 1.2, B.sh + 1.2, cx + B.waW + 0.6, y1, cx - B.waW - 0.6, y1]);
        p.poly(P.innerSh, [cx + 2.6, B.sh + 0.4, cx + B.waW + 1.2, B.sh + 1.2, cx + B.waW + 0.6, y1, cx + 3, y1]);
        for (const [dx, dy, r] of [[0.4, 3.6, 1.3], [2, 3.2, 1.2], [1.2, 4.6, 1.3]]) p.ell(L.print || '#f6eef2', cx + dx, B.sh + dy, r, r * 0.8);
        for (const s of [-1, 1]) {
          const pts = [cx + s * (B.shW - 1), B.sh + 0.4, cx + s * 2.6, B.sh - 0.6, cx + s * 3, y1 - 1, cx + s * (B.waW + 1.6), y1 + 0.4];
          p.poly(s < 0 ? P.top : P.topSh, pts);
          p.poly(s < 0 ? P.top : P.topSh, [cx + s * 1.8, B.sh - 0.2, cx + s * 2.2, B.sh - 1.6, cx + s * 4.4, B.sh - 1.2, cx + s * 4.2, B.sh + 0.4]);
          for (let i = 0; i < 3; i++) p.ell(fur, cx + s * (B.shW - 1.2 - i * 0.2), B.sh + 1 + i * 1.6, 1.2, 1);
          p.rect(dark(P.top, 0.28), cx + (s < 0 ? -B.waW - 1.6 : 3), y1 - 0.4, B.waW - 1.4, 0.9);
        }
        for (let i = 0; i < 4; i++) p.snap(L.chain || '#d8a830', cx - 2.2 + i * 1.3, B.sh - 0.2 + Math.sin(i / 3 * Math.PI) * 0.8, 0.8, 0.7);
        break;
      }
      case 'bikini': {
        const bead = L.bead || '#e8c050', cy = B.chest + 1.4, by = B.hip - 2.4;
        p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.waW + 0.8, B.waist, cx + B.hiW + 0.2, B.hip, cx - B.hiW - 0.2, B.hip, cx - B.waW - 0.8, B.waist]);
        p.poly(P.skinSh, [cx + B.shW - 2.6, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.waW + 0.8, B.waist, cx + B.hiW + 0.2, B.hip, cx + B.hiW - 1.4, B.hip, cx + B.waW - 0.8, B.waist]);
        p.poly(P.skinSh, [cx - 3.4, cy + 2.2, cx + 3.4, cy + 2.2, cx + 2.6, cy + 3.2, cx - 2.6, cy + 3.2]);
        p.snap(P.skinSh, cx - 0.5, B.waist - 0.6, 1, 1.2);
        for (const s of [-1, 1]) {
          p.poly(P.top, [cx + s * 1.4, B.sh - 1.8, cx + s * 2.4, B.sh - 1.8, cx + s * 4.2, cy - 2.8, cx + s * 3.2, cy - 2.4]);
          const cup = [cx + s * 0.6, cy + 2, cx + s * 3.6, cy - 2.8, cx + s * (B.waW + 0.8), cy + 1.6, cx + s * (B.waW + 0.2), cy + 2.4];
          p.poly(s < 0 ? P.top : dark(P.top, 0.14), cup);
          p.poly(light(P.top, 0.22), [cx + s * 3.4, cy - 2.2, cx + s * 4.2, cy - 2.2, cx + s * 2, cy + 1.2, cx + s * 1.4, cy + 1.2]);
        }
        p.ell(P.top, cx, cy + 1.8, 1.1, 0.9);
        for (const s of [-1, 1]) { p.poly(P.top, [cx + s * 0.3, cy + 2.2, cx + s * 1, cy + 2.2, cx + s * 1.2, cy + 4.6, cx + s * 0.5, cy + 4.6]); p.snap(bead, cx + s * 0.85 - 0.5, cy + 4.4, 1, 1); }
        const bot = [cx - B.hiW + 0.2, by, cx - 2, by + 1.2, cx + 2, by + 1.2, cx + B.hiW - 0.2, by, cx + B.hiW - 0.4, by + 1.8, cx + 1.6, B.hip + 3.6, cx - 1.6, B.hip + 3.6, cx - B.hiW + 0.4, by + 1.8];
        p.poly(P.lower, bot);
        p.clipPoly(bot, () => p.poly(dark(P.lower, 0.2), [cx + 2.2, by, cx + 12, by, cx + 12, B.hip + 4, cx + 2.6, B.hip + 4]));
        for (const s of [-1, 1]) {
          const x = cx + s * (B.hiW - 0.4), y = by + 0.6;
          p.poly(P.trim, [x, y, x + s * 2, y - 1.4, x + s * 2, y + 1.2]);
          p.poly(P.trim, [x, y, x - s * 0.2, y + 3.6, x + s * 0.8, y + 3.4]);
          p.poly(P.trim, [x, y, x + s * 1.8, y + 3, x + s * 2.6, y + 2.4]);
          p.snap(bead, x + s * 2.2 - 0.5, y + 2.6, 1, 1);
        }
        break;
      }
      case 'bridal': {
        const top = B.sh + 5;
        p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.waW + 2, top + 1.6, cx - B.waW - 2, top + 1.6]);
        p.poly(P.skinSh, [cx + 2.4, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.waW + 2, top + 1.6, cx + 3, top + 1.6]);
        const pts = [cx - B.waW - 2, top, cx - 2.6, top + 0.2, cx, top + 1.6, cx + 2.6, top + 0.2, cx + B.waW + 2, top, cx + B.waW + 0.6, B.waist, cx + 1, B.waist + 2.4, cx - 1, B.waist + 2.4, cx - B.waW - 0.6, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => { p.poly(dark(P.top, 0.1), [cx + 2.6, top, cx + 10, top, cx + 10, B.waist + 3, cx + 3.2, B.waist + 3]); for (const dx of [-2.4, 2.4]) p.poly(dark(P.top, 0.14), [cx + dx - 0.25, top + 2, cx + dx + 0.25, top + 2, cx + dx * 0.4 + 0.25, B.waist + 2, cx + dx * 0.4 - 0.25, B.waist + 2]); for (let x = cx - B.waW - 1.4; x <= cx + B.waW + 1.6; x += 1.4) p.ell(light(P.top, 0.6), x, top + 0.4 + Math.abs(x - cx) * 0.02, 0.6, 0.45); });
        break;
      }
      case 'frost': {
        const top = B.sh + 3.4, fade = L.fade || P.top, bow = L.bow || P.trim;
        p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.waW + 2, top + 1.6, cx - B.waW - 2, top + 1.6]);
        p.poly(P.skinSh, [cx + 2.4, B.sh - 0.6, cx + B.shW - 1, B.sh - 0.6, cx + B.waW + 2, top + 1.6, cx + 3, top + 1.6]);
        const pts = [cx - B.waW - 2, top, cx - 2.4, top + 0.2, cx, top + 1.8, cx + 2.4, top + 0.2, cx + B.waW + 2, top, cx + B.waW + 0.8, B.waist, cx + B.waW + 1, B.waist + 1, cx - B.waW - 1, B.waist + 1, cx - B.waW - 0.8, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => {
          p.band(B.chest + 2.6, B.waist + 2, () => p.poly(mix(P.top, fade, 0.5), pts));
          p.band(B.chest + 5, B.waist + 2, () => p.poly(fade, pts));
          p.poly(dark(P.top, 0.1), [cx + 2.6, top, cx + 10, top, cx + 10, B.waist + 2, cx + 3.4, B.waist + 2]);
          for (const s of [-1, 1]) p.poly(light(P.trim, 0.2), [cx + s * 0.4, top + 2.4, cx + s * 4.4, B.waist + 1.4, cx + s * 3, B.waist + 1.4, cx, top + 3.4]);
        });
        for (const s of [-1, 1]) p.poly(P.trim, [cx + s * 1, B.sh - 1.6, cx + s * 1.8, B.sh - 1.6, cx + s * 3.6, top + 0.6, cx + s * 2.8, top + 0.8]);
        p.poly(L.neck || P.top, [cx - 3.2, B.sh - 1.8, cx + 3.2, B.sh - 1.8, cx + 4, B.sh + 0.2, cx, B.sh + 1.2, cx - 4, B.sh + 0.2]);
        p.poly(bow, [cx, B.sh - 2.2, cx - 2.4, B.sh - 3.4, cx - 2.2, B.sh - 0.8]); p.poly(bow, [cx, B.sh - 2.2, cx + 2.4, B.sh - 3.4, cx + 2.2, B.sh - 0.8]);
        frostFlower(p, cx, B.chest + 0.6, 2.6, L.flower || '#f4f0fc', L.flowerCore || '#9ad4f4');
        p.poly(L.flowerCore || '#9ad4f4', [cx - 1, B.chest + 2.4, cx + 1, B.chest + 2.4, cx, B.waist - 1]);
        break;
      }
      case 'bodice': {
        const pts = [cx - B.shW + 2, B.sh + 2, cx + B.shW - 2, B.sh + 2, cx + B.waW + 0.8, B.waist, cx + B.waW + 1, B.waist + 1, cx - B.waW - 1, B.waist + 1, cx - B.waW - 0.8, B.waist];
        p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.4, cx + B.shW - 1, B.sh - 0.4, cx + B.shW - 2, B.sh + 2.4, cx - B.shW + 2, B.sh + 2.4]);
        p.poly(P.top, pts);
        p.clipPoly(pts, () => { p.poly(dark(P.top, 0.2), [cx + 1.6, B.sh, cx + 9, B.sh, cx + 9, B.waist + 2, cx + 2.4, B.waist + 2]); p.poly('#f2eef0', [cx - 2.6, B.sh + 2, cx - 0.6, B.sh + 2, cx - 1, B.chest + 3, cx - 2.4, B.chest + 2]); for (const y of [B.chest, B.chest + 3, B.waist - 1]) p.rect(dark(P.top, 0.35), cx - 8, y, 16, 0.5); });
        p.snap('#c8ccd4', cx + 2, B.waist - 1.4, 1, 1);
        break;
      }
      case 'crop': {
        const y1 = B.chest + 3;
        p.poly(P.skin, [cx - B.waW - 0.6, y1, cx + B.waW + 0.6, y1, cx + B.waW + 0.6, B.waist + 0.4, cx - B.waW - 0.6, B.waist + 0.4]);
        p.poly(P.skinSh, [cx + 2, y1, cx + B.waW + 0.6, y1, cx + B.waW + 0.6, B.waist + 0.4, cx + 2.4, B.waist + 0.4]);
        p.poly(P.inner, [cx - B.shW + 1.6, B.sh + 0.6, cx + B.shW - 1.6, B.sh + 0.6, cx + B.waW + 0.6, y1, cx - B.waW - 0.6, y1]);
        p.poly('#1e1c24', [cx - 3, B.sh, cx - 2, B.sh, cx - 0.6, B.sh + 2.4, cx - 1.6, B.sh + 2.6]);
        for (const s of [-1, 1]) {
          p.poly(P.top, [cx + s * B.shW, B.sh, cx + s * 2.8, B.sh, cx + s * 3, y1, cx + s * (B.waW + 1.4), y1 + 0.4]);
          p.poly(L.lining, [cx + s * 2.8, B.sh, cx + s * 3.6, B.sh, cx + s * 3.8, y1, cx + s * 3, y1]);
          p.rect('#e8e8ee', cx + (s < 0 ? -B.waW - 1.4 : 1.2), y1 - 0.4, B.waW + 0.2, 1);
        }
        p.poly(P.topSh, [cx + 4, B.sh, cx + B.shW, B.sh, cx + B.waW + 1.4, y1 + 0.4, cx + 4, y1]);
        break;
      }
      case 'offcoat': {
        for (const s of [-1, 1]) {
          const pts = [cx + s * (B.shW + 1.6), B.sh + 3.4, cx + s * (B.shW - 1.2), B.sh + 4.4, cx + s * (B.waW + 0.8), B.waist + 1, cx + s * (B.hiW + 0.6), coatHem, cx + s * (B.hiW + 5), coatHem + 1];
          p.poly(P.top, pts);
          p.clipPoly(pts, () => {
            p.poly(L.lining, [cx + s * (B.shW - 1.2), B.sh + 4.4, cx + s * (B.shW + 0.4), B.sh + 4.4, cx + s * (B.hiW + 2.6), coatHem + 2, cx + s * (B.hiW + 0.4), coatHem + 2, cx + s * (B.waW + 0.6), B.waist + 1]);
            p.band(B.hip, coatHem + 2, () => p.poly(light(L.lining, 0.35), [cx + s * (B.waW + 0.6), B.waist + 1, cx + s * (B.waW + 3), B.waist + 1, cx + s * (B.hiW + 2.6), coatHem + 2, cx + s * (B.hiW + 0.4), coatHem + 2]));
            if (s > 0) p.poly(P.innerSh, [cx + B.shW + 1, B.sh, cx + B.shW + 8, B.sh, cx + B.hiW + 8, coatHem + 2, cx + B.hiW + 3.6, coatHem + 2]);
            for (const y of [B.waist + 4, B.hip + 5, coatHem - 2]) p.rect('#2a2632', cx + s * (B.hiW + 3.2) - 0.5, y, 1, 1.6);
          });
        }
        break;
      }
      case 'cut': {
        const pts = [cx - B.shW, B.sh, cx - 2.4, B.sh, cx - 1.6, B.waist, cx - 2.2, B.hip + 4, cx - B.hiW - 1.8, B.hip + 4.4, cx - B.waW - 1.4, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => p.poly(dark(P.top, 0.14), [cx - 4, B.sh, cx - 2.4, B.sh, cx - 1.6, B.waist, cx - 2.2, B.hip + 5, cx - 4, B.hip + 5]));
        p.poly(P.top, [cx + B.shW - 0.4, B.sh, cx + 3, B.sh, cx + 3.8, B.chest + 1.6, cx + B.waW + 1.4, B.chest + 2.2]);
        p.poly(dark(P.top, 0.14), [cx + B.shW - 0.4, B.sh, cx + B.shW - 2, B.sh, cx + B.waW + 0.4, B.chest + 2, cx + B.waW + 1.4, B.chest + 2.2]);
        break;
      }
      case 'half': {
        p.poly(P.skin, [cx - B.waW - 0.6, B.chest + 2, cx + B.waW + 0.6, B.chest + 2, cx + B.waW + 0.6, B.waist, cx - B.waW - 0.6, B.waist]);
        p.poly(P.skinSh, [cx + 2, B.chest + 2, cx + B.waW + 0.6, B.chest + 2, cx + B.waW + 0.6, B.waist, cx + 2.4, B.waist]);
        p.poly(P.inner, [cx - 0.4, B.sh + 1.4, cx + B.shW - 2.4, B.sh + 1, cx + B.waW + 1, B.chest + 2.6, cx, B.chest + 3]);
        for (let x = cx + 0.4; x < cx + B.shW - 2; x += 1.6) p.snap(light(P.inner, 0.14), x, B.sh + 0.8, 1, 1);
        p.poly(P.top, [cx - B.shW + 2.4, B.sh + 1, cx + 0.6, B.sh + 1.4, cx + 0.6, B.chest + 3.6, cx - B.waW - 1.4, B.chest + 3.2]);
        p.poly(P.innerSh, [cx - 1.2, B.sh + 1.6, cx + 0.6, B.sh + 1.4, cx + 0.6, B.chest + 3.6, cx - 1, B.chest + 3.6]);
        break;
      }
      case 'bolero': {
        for (const s of [-1, 1]) {
          p.poly(P.top, [cx + s * (B.shW + 0.6), B.sh - 0.4, cx + s * 2.6, B.sh - 0.4, cx + s * 3.6, B.chest + 2.4, cx + s * (B.waW + 1.4), B.chest + 3.4]);
          p.poly(P.trim, [cx + s * 2.6, B.sh - 0.4, cx + s * 3.4, B.sh - 0.4, cx + s * 4.2, B.chest + 2.8, cx + s * 3.6, B.chest + 2.6]);
        }
        p.poly(P.topSh, [cx + 4, B.sh, cx + B.shW, B.sh, cx + B.waW + 1.4, B.chest + 3.4, cx + 4.6, B.chest + 2.6]);
        break;
      }
      case 'shrug': {
        const cy = B.chest + 0.4, belt = L.belt || light(P.top, 0.4);
        p.rect(P.innerSh, cx - 0.2, B.sh + 2, 0.5, cy - B.sh - 2);
        for (const y of [B.sh + 2.8, B.chest - 1.2]) p.snap('#d8b050', cx - 0.5, y, 1, 1);
        p.poly(P.top, [cx - B.waW - 1.6, cy, cx + B.waW + 1.6, cy, cx + B.waW + 1, cy + 2.8, cx - B.waW - 1, cy + 2.8]);
        p.poly(P.topSh, [cx + 1.6, cy, cx + B.waW + 1.6, cy, cx + B.waW + 1, cy + 2.8, cx + 1.6, cy + 2.8]);
        p.poly(P.top, [cx - 2.2, cy + 2, cx - 0.4, cy + 2, cx - 1.8, B.waist + 2.4, cx - 4, B.waist + 1.6]);
        p.poly(P.topSh, [cx - 0.6, cy + 2, cx + 1, cy + 2, cx + 1.8, B.waist + 1.6, cx + 0.2, B.waist + 2]);
        p.ell(dark(P.top, 0.18), cx - 0.6, cy + 1.4, 1.6, 1.5);
        p.ell(P.top, cx - 0.9, cy + 1.1, 1, 0.9);
        p.poly(dark(belt, 0.2), [cx - B.waW - 0.8, B.waist - 1.6, cx - B.waW - 0.6, B.waist + 0.2, cx + B.hiW + 1, B.hip + 1.4, cx + B.hiW + 1, B.hip - 0.4]);
        p.poly(belt, [cx - B.waW - 0.8, B.waist - 1.6, cx - B.waW - 0.7, B.waist - 0.5, cx + B.hiW + 1, B.hip + 0.5, cx + B.hiW + 1, B.hip - 0.4]);
        p.snap('#e8e4f4', cx - B.waW + 0.6, B.waist - 1.2, 1.2, 1.2);
        break;
      }
      case 'parka': {
        const fur = P.trim, belt = L.belt || '#6a4430';
        p.poly(P.top, [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 1.4, B.waist, cx - B.waW - 1.4, B.waist]);
        p.poly(P.top, [cx - B.waW - 1.4, B.waist - 0.5, cx - 0.4, B.waist - 0.5, cx - 2.4, coatHem, cx - B.hiW - 4.5, coatHem + 1]);
        p.poly(P.top, [cx + B.waW + 1.4, B.waist - 0.5, cx + 0.4, B.waist - 0.5, cx + 2.4, coatHem, cx + B.hiW + 4.5, coatHem + 1]);
        p.poly(P.topSh, [cx + 3, B.sh + 1, cx + B.shW, B.sh, cx + B.waW + 1.4, B.waist, cx + B.hiW + 4.5, coatHem + 1, cx + B.hiW + 1.4, coatHem + 0.8, cx + 3, B.waist]);
        p.poly(dark(P.top, 0.4), [cx - 0.4, B.waist, cx + 0.2, B.waist, cx - 1.8, coatHem, cx - 2.4, coatHem]);
        p.poly(dark(P.top, 0.4), [cx + 0.4, B.waist, cx - 0.2, B.waist, cx + 1.8, coatHem, cx + 2.4, coatHem]);
        p.poly(P.inner, [cx - 2.6, B.sh - 0.2, cx + 2.6, B.sh - 0.2, cx + 0.4, B.chest + 2.5, cx - 0.4, B.chest + 2.5]);
        p.poly(dark(P.inner, 0.2), [cx + 0.6, B.sh + 1, cx + 2.6, B.sh - 0.2, cx + 0.4, B.chest + 2.5]);
        p.rect(dark(P.top, 0.4), cx - 0.5, B.chest + 2.5, 1, B.waist - B.chest - 2.5);
        p.rect(belt, cx - B.waW - 1.4, B.waist - 1.2, (B.waW + 1.4) * 2, 1.5);
        p.snap('#d8c088', cx - 1.6, B.waist - 1.2, 1.4, 1.5);
        p.poly(belt, [cx + 1.5, B.waist + 0.2, cx + 2.6, B.waist + 0.2, cx + 3.4, B.hip + 3, cx + 2.4, B.hip + 3]);
        for (const s of [-1, 1]) {
          p.ell(fur, cx + s * (B.hiW + 2.2), coatHem, 3.4, 1.7);
          p.ell(light(fur, 0.35), cx + s * (B.hiW + 1.6), coatHem - 0.5, 1.8, 0.9);
          p.ell(dark(fur, 0.12), cx + s * 3.4, coatHem + 0.2, 1.6, 1.1);
        }
        break;
      }
      case 'avia': {
        const plate = L.plate || '#e2e8f8', ins = L.inset || '#6792c4', hem2 = B.hip + 6;
        const pts = [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 0.8, B.waist, cx + B.legW + 1.4, B.hip + 1, cx + B.legW + 1, hem2, cx + 0.8, B.hip + 3.4, cx - 0.8, B.hip + 3.4, cx - B.legW - 1, hem2, cx - B.legW - 1.4, B.hip + 1, cx - B.waW - 0.8, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => {
          p.poly(P.topSh, [cx + 3, B.sh, cx + 14, B.sh, cx + 14, hem2 + 1, cx + 3.6, hem2 + 1]);
          p.poly(ins, [cx - 2.4, B.sh + 0.6, cx + 2.4, B.sh + 0.6, cx + 1.6, B.waist + 1, cx, B.waist + 2.6, cx - 1.6, B.waist + 1]);
          p.poly(light(ins, 0.25), [cx - 1.6, B.sh + 1.4, cx - 0.6, B.sh + 1.4, cx - 0.6, B.waist, cx - 1.2, B.waist]);
          for (const sd of [-1, 1]) ribbon(p, plate, [cx + sd * (B.legW + 1.6), B.hip + 0.6, cx + sd * (B.legW + 1.2), hem2 + 0.2, cx + sd * 0.6, B.hip + 3.2], sd * 1.1);
          p.snap('#5ae8f8', cx - B.legW + 0.4, B.hip + 1.2, 1, 1);
        });
        break;
      }
      case 'ranger': {
        const pts = [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 1, B.waist, cx + B.hiW, B.hip + 2, cx - B.hiW, B.hip + 2, cx - B.waW - 1, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => p.poly(P.topSh, [cx + 3, B.sh, cx + 14, B.sh, cx + 14, B.hip + 3, cx + 3.6, B.hip + 3]));
        p.rect(P.trim, cx - 0.5, B.sh + 1, 1, B.hip - B.sh);
        p.rect(P.trim, cx - B.waW - 1, B.waist - 0.6, (B.waW + 1) * 2, 1.2);
        p.snap('#5ae8f8', cx + 2, B.chest, 1, 1);
        break;
      }
      case 'suit': {
        const neon = L.neon || P.trim, neon2 = L.neon2 || '#5ae8f8', hem2 = B.hip + 2;
        const pts = [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 0.8, B.waist, cx + B.hiW - 1.4, hem2, cx - B.hiW + 1.4, hem2, cx - B.waW - 0.8, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => {
          p.poly(P.topSh, [cx + 3, B.sh, cx + 14, B.sh, cx + 14, hem2 + 1, cx + 3.6, hem2 + 1]);
          p.rect(neon, cx - 0.5, B.sh + 0.6, 1, B.waist - B.sh);
          ribbon(p, neon, [cx - B.shW + 2.4, B.sh, cx - 2.4, B.chest + 1, cx - 1.4, B.waist + 0.4], 1);
          ribbon(p, neon2, [cx + B.shW - 2.4, B.sh, cx + 2.4, B.chest + 1, cx + 1.4, B.waist + 0.4], -1);
          ribbon(p, neon, [cx - B.hiW, B.hip - 1.4, cx - 2, hem2 - 0.4, cx + 2, hem2 - 0.4, cx + B.hiW, B.hip - 1.4], 1);
        });
        break;
      }
      case 'shirt': {
        const pts = [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 1, B.waist, cx + B.waW + 0.6, B.waist + 0.8, cx - B.waW - 0.6, B.waist + 0.8, cx - B.waW - 1, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => p.poly(P.topSh, [cx + 2.8, B.sh, cx + 14, B.sh, cx + 14, B.waist + 2, cx + 3.4, B.waist + 2]));
        for (let y = B.sh + 3; y < B.waist; y += 3) p.snap(P.topSh, cx - 1.8, y, 0.8, 0.8);
        break;
      }
      case 'kid': {
        const hem = B.waist - 1.4, belly = L.belly || '#e4e6ec', gold = '#d8b050';
        p.poly(P.inner, [cx - B.shW + 1, B.sh, cx + B.shW - 1, B.sh, cx + B.waW + 0.6, B.chest + 3, cx - B.waW - 0.6, B.chest + 3]);
        p.poly(belly, [cx - B.waW + 0.4, B.chest + 3, cx + B.waW - 0.4, B.chest + 3, cx + B.waW - 0.2, B.waist + 0.4, cx - B.waW + 0.2, B.waist + 0.4]);
        p.rect(dark(belly, 0.18), cx - 0.3, B.chest + 3.4, 0.6, B.waist - B.chest - 3);
        p.rect(dark(belly, 0.18), cx - B.waW + 0.6, B.chest + 5.4, B.waW * 2 - 1.2, 0.5);
        p.poly(light(P.inner, 0.14), [cx - B.waW, B.chest - 0.6, cx + B.waW, B.chest - 0.6, cx + B.waW - 0.4, B.chest + 0.2, cx - B.waW + 0.4, B.chest + 0.2]);
        p.poly(dark(P.inner, 0.3), [cx - 0.4, B.sh + 0.6, cx + 0.4, B.sh + 0.6, cx + 0.4, B.chest + 3, cx - 0.4, B.chest + 3]);
        for (const sd of [-1, 1]) {
          for (let k = 0; k < 3; k++) p.rect(light(belly, 0.06), cx + (sd < 0 ? -B.waW + 0.9 : 0.6), B.chest + 3.8 + k * 1.9, B.waW - 1.5, 1.3);
          p.rect(gold, cx + sd * (B.waW - 0.4) - 0.3, B.chest + 3.2, 0.6, B.waist - B.chest - 3);
        }
        p.poly(gold, [cx, B.sh + 2.2, cx + 1.3, B.sh + 3.8, cx, B.sh + 5.4, cx - 1.3, B.sh + 3.8]);
        p.snap(dark(gold, 0.35), cx - 0.4, B.sh + 3.4, 0.8, 0.8);
        for (const sd of [-1, 1]) {
          const pts = [cx + sd * B.shW, B.sh, cx + sd * 2.6, B.sh, cx + sd * (B.waW - 1.4), hem, cx + sd * (B.waW + 1.6), hem + 0.6];
          p.poly(sd < 0 ? P.top : P.topSh, pts);
          p.rect('#c8ccd4', cx + sd * (B.waW - 1.2) - 0.3, B.sh + 3, 0.6, hem - B.sh - 3);
          p.poly(P.top, [cx + sd * 2.6, B.sh + 0.4, cx + sd * 4.6, B.sh - 2.6, cx + sd * 5.6, B.sh - 2.2, cx + sd * 4.4, B.sh + 1.2]);
        }
        p.snap(gold, cx + 3.4, B.sh + 2.6, 1, 1);
        p.rect('#f4f4f6', cx + B.waW - 0.6, hem - 2.6, 2, 1.4);
        p.rect('#c8283a', cx + B.waW - 0.2, hem - 2.2, 1.2, 0.6);
        p.poly('#f0c030', [cx + B.waW + 1.6, hem - 3.6, cx + B.waW + 2.4, hem - 2.2, cx + B.waW + 0.8, hem - 2.2]);
        for (const sd of [-1, 1]) {
          p.ell('#5a5c66', cx + sd * (B.shW - 2), B.sh + 0.8, 1.1, 0.9);
          p.ell('#c8ccd4', cx + sd * (B.shW - 2), B.sh + 0.6, 0.8, 0.6);
          p.poly(dark(P.top, 0.35), [cx + sd * 4.4, B.sh - 2.2, cx + sd * 5.6, B.sh - 2.2, cx + sd * 5, B.sh - 0.4]);
        }
        p.poly('#9a9ca6', [cx + B.shW - 1, B.sh - 2.4, cx + B.shW + 1.6, B.sh - 3.4, cx + B.shW + 2, B.sh - 2.8, cx + B.shW - 0.6, B.sh - 1.6]);
        break;
      }
      case 'gyaru': {
        const y2 = B.chest + 2.4, col = L.collarCol || '#f4f4f6';
        p.poly(P.skin, [cx - B.shW + 0.6, B.sh - 0.2, cx + B.shW - 0.6, B.sh - 0.2, cx + B.waW + 0.6, B.waist + 0.4, cx - B.waW - 0.6, B.waist + 0.4]);
        p.poly(P.skinSh, [cx + 2.4, B.sh, cx + B.shW - 0.6, B.sh, cx + B.waW + 0.6, B.waist + 0.4, cx + 2.6, B.waist + 0.4]);
        const tp = [cx - B.shW + 1.8, B.sh + 1.6, cx + B.shW - 1.8, B.sh + 1.6, cx + B.waW + 1, y2, cx - B.waW - 1, y2];
        p.poly(P.inner, tp);
        p.clipPoly(tp, () => { p.poly(dark(P.inner, 0.1), [cx + 2.4, B.sh, cx + 9, B.sh, cx + 9, y2 + 1, cx + 2.6, y2 + 1]); p.rect('#1c1c22', cx - B.waW - 1, B.sh + 3.4, B.waW * 2 + 2, 1.8); for (let i = -1; i <= 1; i++) p.rect(P.inner, cx + i * 2.2 - 0.4, B.sh + 3.6, 0.8, 1.4); });
        for (const sd of [-1, 1]) p.poly(col, [cx + sd * 1.2, B.sh - 1, cx + sd * 3.4, B.sh - 0.4, cx + sd * 2.6, B.sh + 1, cx + sd * 0.8, B.sh + 0.2]);
        break;
      }
      case 'volt': {
        const y1 = B.chest + 1.4, y2 = B.chest + 3.2;
        p.poly(P.skin, [cx - B.shW + 0.6, B.sh - 0.2, cx + B.shW - 0.6, B.sh - 0.2, cx + B.waW + 0.6, B.waist + 0.4, cx - B.waW - 0.6, B.waist + 0.4]);
        p.poly(P.skinSh, [cx + 2.4, B.sh, cx + B.shW - 0.6, B.sh, cx + B.waW + 0.6, B.waist + 0.4, cx + 2.6, B.waist + 0.4]);
        p.poly(P.inner, [cx - B.shW + 1.8, B.sh + 0.8, cx + B.shW - 1.8, B.sh + 0.8, cx + B.waW + 0.8, y2, cx - B.waW - 0.8, y2]);
        const pl = [cx - 3.6, B.sh + 0.4, cx + 3.6, B.sh + 0.4, cx + B.waW + 0.2, y1, cx - B.waW - 0.2, y1];
        p.poly(P.top, pl);
        p.clipPoly(pl, () => p.poly(P.topSh, [cx + 1.8, B.sh, cx + 9, B.sh, cx + 9, y1 + 1, cx + 1.8, y1 + 1]));
        p.rect(P.inner, cx - 0.8, B.sh + 2.6, 1.6, y1 - B.sh - 2.6);
        p.snap('#f2f2f4', cx - 0.5, B.sh + 3.4, 1, 1.2);
        for (const sd of [-1, 1]) { p.snap(dark(P.top, 0.5), cx + sd * 2.3 - 0.4, B.sh + 2.4, 0.8, 0.8); p.ell(P.top, cx + sd * 2.8, B.sh - 0.4, 2.2, 1.3); }
        break;
      }
      case 'raglan': {
        const sl = L.sleeve || P.trim, hem2 = B.hip + 1.6;
        const pts = [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 1.2, B.waist, cx + B.hiW + 1, hem2, cx - B.hiW - 1, hem2, cx - B.waW - 1.2, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => p.poly(P.topSh, [cx + 3, B.sh, cx + 14, B.sh, cx + 14, hem2 + 1, cx + 3.6, hem2 + 1]));
        p.rect(dark(P.top, 0.12), cx - B.hiW - 1, hem2 - 0.8, (B.hiW + 1) * 2, 0.8);
        for (const sd of [-1, 1]) p.poly(sd < 0 ? sl : dark(sl, 0.2), [cx + sd * 2.6, B.sh - 0.4, cx + sd * B.shW, B.sh - 0.2, cx + sd * (B.shW + 0.4), B.sh + 2.2, cx + sd * (B.shW - 1.4), B.sh + 3.4]);
        break;
      }
      case 'heartcorset': {
        const top = B.chest - 1.6, tip = B.hip + 1.4, bow = L.bow || '#e26396';
        p.poly(P.skin, [cx - B.shW + 0.6, B.sh - 0.4, cx + B.shW - 0.6, B.sh - 0.4, cx + B.waW + 1, top + 0.6, cx - B.waW - 1, top + 0.6]);
        p.poly(P.skinSh, [cx + 2.6, B.sh - 0.4, cx + B.shW - 0.6, B.sh - 0.4, cx + B.waW + 1, top + 0.6, cx + 3, top + 0.6]);
        const pts = [cx - B.waW - 1.6, top, cx, top + 1, cx + B.waW + 1.6, top, cx + B.waW + 0.8, B.waist, cx + B.hiW - 1, B.hip - 0.4, cx, tip, cx - B.hiW + 1, B.hip - 0.4, cx - B.waW - 0.8, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => { p.poly(P.topSh, [cx + 2.4, top, cx + 12, top, cx + 12, tip + 1, cx + 2.4, tip + 1]); p.rect(P.trim, cx - 0.4, top + 2.4, 0.8, tip - top - 2.4); });
        ribbon(p, P.trim, [cx - B.waW - 1.6, top, cx, top + 1, cx + B.waW + 1.6, top], 0.7);
        ribbon(p, P.trim, [cx - B.hiW + 1, B.hip - 0.4, cx, tip, cx + B.hiW - 1, B.hip - 0.4], -0.7);
        for (const sd of [-1, 1]) ribbon(p, P.trim, [cx + sd * (B.waW + 1.6), top, cx + sd * (B.waW + 0.8), B.waist, cx + sd * (B.hiW - 1), B.hip - 0.4], sd * 0.6);
        p.poly(bow, [cx, top + 1.6, cx - 3, top - 0.2, cx - 3, top + 3.2]);
        p.poly(bow, [cx, top + 1.6, cx + 3, top - 0.2, cx + 3, top + 3.2]);
        p.snap(light(bow, 0.25), cx - 0.5, top + 1.1, 1, 1);
        break;
      }
      case 'closed':
        p.poly(P.top, [cx - B.shW, B.sh, cx + B.shW, B.sh, cx + B.waW + 1, B.waist, cx + B.hiW + 2, B.hip + 4, cx - B.hiW - 2, B.hip + 4, cx - B.waW - 1, B.waist]);
        p.poly(P.topSh, [cx + 3, B.sh + 1, cx + B.shW, B.sh, cx + B.waW + 1, B.waist, cx + B.hiW + 2, B.hip + 4, cx + 3.5, B.hip + 4]);
        p.rect(P.trim, cx - 0.6, B.sh + 2, 1.2, B.hip + 2 - B.sh);
        p.rect(P.trim, cx - B.hiW - 2, B.hip + 3, B.hiW * 2 + 4, 1.1);
        p.rect(dark(P.top, 0.4), cx - B.waW - 1, B.waist - 0.6, B.waW * 2 + 2, 1.2);
        break;
      case 'dress':
        p.poly(P.top, [cx - B.shW + 1, B.sh, cx + B.shW - 1, B.sh, cx + B.waW + 0.6, B.waist, cx - B.waW - 0.6, B.waist]);
        p.poly(P.topSh, [cx + 2, B.sh + 1, cx + B.shW - 1, B.sh, cx + B.waW + 0.6, B.waist, cx + 2.4, B.waist]);
        if (!accOf(L, 'bigbelt')) p.rect(P.trim, cx - B.waW - 0.6, B.waist - 1, B.waW * 2 + 1.2, 1);
        break;
      case 'tabard': {
        const y1 = B.hip + 3.5;
        for (const s of [-1, 1]) p.poly(P.skin, [cx + s * (B.shW - 1.5), B.sh, cx + s * 3, B.sh, cx + s * (B.waW - 0.6), B.chest, cx + s * (B.shW - 1.4), B.chest - 1]);
        const pts = [cx - B.shW + 2.2, B.sh, cx - 2, B.sh, cx, B.chest + 1.5, cx + 2, B.sh, cx + B.shW - 2.2, B.sh, cx + B.waW + 0.8, B.waist, cx + B.hiW + 1.4, y1, cx + 2.6, y1 + 1.4, cx, y1 + 0.4, cx - 2.6, y1 + 1.4, cx - B.hiW - 1.4, y1, cx - B.waW - 0.8, B.waist];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => {
          p.poly(P.topSh, [cx + 2.6, B.sh, cx + B.shW, B.sh, cx + B.hiW + 2, y1 + 2, cx + 3.4, y1 + 2]);
          p.rect(P.trim, cx - B.hiW - 2, y1 - 1.8, (B.hiW + 2) * 2, 1);
          for (const x of [-4.4, 0, 4.4]) p.ell(P.trim, cx + x, y1 - 0.6, 1.3, 0.9);
        });
        p.poly(P.trim, [cx - 2, B.sh, cx - 1.2, B.sh, cx, B.chest, cx, B.chest + 1.5]);
        p.poly(P.trim, [cx + 2, B.sh, cx + 1.2, B.sh, cx, B.chest, cx, B.chest + 1.5]);
        p.snap('#f4f4fa', cx - 1, B.chest + 2.6, 2, 1.2);
        break;
      }
      case 'robe': {
        const y1 = B.knee + 4, cloud = L.cloud || '#d4ecf2', sash = L.sash || '#1e1e26';
        for (const s of [-1, 1]) {
          const pts = [cx + s * B.shW, B.sh, cx + s * 2.2, B.sh, cx + s * 2.2, B.waist, cx + s * (s < 0 ? 3.6 : 1.8), y1, cx + s * (B.hiW + 4.2), y1 + 1, cx + s * (B.hiW + 1.4), B.waist + 2, cx + s * (B.waW + 1.6), B.waist];
          p.poly(P.top, pts);
          p.clipPoly(pts, () => {
            if (s > 0) p.poly(P.topSh, [cx + B.shW - 2.4, B.sh, cx + B.shW + 6, B.sh, cx + B.hiW + 6, y1 + 2, cx + B.hiW + 1.4, y1 + 2]);
            p.rect('#e07ab0', cx - 30, y1 - 5.6, 60, 0.7);
            p.rect(cloud, cx - 30, y1 - 4.9, 60, 7);
            for (const x of [2.8, 5.8, 8.8, 11.8]) p.ell(P.top, cx + s * x, y1 - 5.2, 1.7, 1.5);
            p.ell(light(cloud, 0.4), cx + s * 7.3, y1 - 2.4, 1.6, 0.9);
          });
          p.poly(P.trim, [cx + s * 3.6, B.sh, cx + s * 2.2, B.sh, cx + s * 2.2, B.waist - 3, cx + s * 3.4, B.waist - 3]);
        }
        p.rect('#6aa6e2', cx + 0.4, B.sh + 1, 0.8, B.waist - 4 - B.sh);
        for (const y of [B.sh + 2.4, B.sh + 5]) p.snap('#c4c8d2', cx - 2, y, 1.6, 0.8);
        p.rect(sash, cx - B.waW - 1.6, B.waist - 3.4, (B.waW + 1.6) * 2, 4.4);
        p.rect(L.belt || '#7cc0e2', cx - B.waW - 1.6, B.waist - 1.8, (B.waW + 1.6) * 2, 1.1);
        p.snap('#eef0f6', cx + 0.6, B.waist - 2.8, 2.8, 1.2);
        p.snap('#eef0f6', cx + 2.6, B.waist - 1.8, 1.2, 2);
        p.poly(sash, [cx - 3.8, B.waist + 0.8, cx + 0.6, B.waist + 0.8, cx - 0.6, B.hip + 2.4, cx - 3.2, B.hip + 1.4]);
        p.poly('#d8b050', [cx - 3, B.waist + 1.6, cx - 0.4, B.waist + 1.6, cx - 1.4, B.waist + 3, cx - 2.2, B.waist + 3]);
        break;
      }
      case 'hoodcape': {
        const hem = B.hip + 5.4;
        const pts = [cx - B.waW - 0.6, B.waist - 1, cx + B.waW + 0.6, B.waist - 1, cx + B.hiW + 1.4, hem - 0.4, cx + 2, hem + 0.6, cx - 3, hem + 0.2, cx - B.hiW - 0.6, hem - 0.6, cx - B.hiW + 0.2, B.hip + 1.4, cx - B.hiW - 1.2, B.hip];
        p.poly(P.inner, pts);
        p.clipPoly(pts, () => {
          p.poly(P.innerSh, [cx + 2.6, B.waist - 1, cx + 12, B.waist - 1, cx + 12, hem + 2, cx + 3.4, hem + 2]);
          p.poly(P.innerSh, [cx - 2.4, B.hip, cx - 1.8, B.hip, cx - 2.6, hem + 1, cx - 3.2, hem + 1]);
        });
        break;
      }
      case 'crusader': {
        const plate = L.plate || '#f2eef8', lil = mix(plate, '#9a88b8', 0.42), end = B.knee + 9;
        const sk = [cx - B.waW - 0.6, B.waist - 0.5, cx + B.waW + 0.6, B.waist - 0.5, cx + B.hiW + 3.6, end, cx + 1.2, end + 0.6, cx - 1.2, end + 0.6, cx - B.hiW - 3.6, end];
        p.poly(P.lower, sk);
        p.clipPoly(sk, () => {
          p.poly(P.lowerSh, [cx + 2.6, B.waist, cx + 14, B.waist, cx + 14, end + 2, cx + 4.6, end + 2]);
          for (const t of [-0.55, 0.15, 0.6]) p.poly(dark(P.lower, 0.3), [cx + t * B.waW - 0.2, B.hip, cx + t * B.waW + 0.2, B.hip, cx + t * (B.hiW + 3.6) + 0.5, end + 1, cx + t * (B.hiW + 3.6) - 0.5, end + 1]);
        });
        for (const s of [-1, 1]) {
          const side = [cx + s * (B.waW - 0.6), B.waist - 0.5, cx + s * (B.waW + 1.4), B.waist - 0.5, cx + s * (B.hiW + 4.6), B.ankle - 1.4, cx + s * (B.hiW + 1.8), B.ankle - 0.6, cx + s * (B.hiW - 0.2), B.hip + 6];
          p.poly(s < 0 ? plate : lil, side);
          if (s > 0) p.clipPoly(side, () => p.poly(P.top, [cx + B.hiW - 0.4, B.hip + 6, cx + B.hiW + 1, B.hip + 6, cx + B.hiW + 2.8, B.ankle, cx + B.hiW + 1.4, B.ankle]));
        }
        const tip = B.knee + 3.4;
        p.poly(plate, [cx - 3.8, B.waist - 0.6, cx + 3.8, B.waist - 0.6, cx + 4.2, tip - 6, cx + 2.8, tip - 4.4, cx, tip, cx - 2.8, tip - 4.4, cx - 4.2, tip - 6]);
        const fr = [cx - 2.8, B.waist, cx + 2.8, B.waist, cx + 3.1, tip - 6.4, cx + 2, tip - 5.2, cx, tip - 1.8, cx - 2, tip - 5.2, cx - 3.1, tip - 6.4];
        p.poly(P.top, fr);
        p.clipPoly(fr, () => p.poly(P.topSh, [cx + 0.8, B.waist, cx + 4, B.waist, cx + 4, tip, cx + 0.8, tip]));
        for (const s of [-1, 1]) {
          const t0 = cx + s * (B.hiW + 0.4);
          p.poly(dark(lil, 0.12), [t0, B.hip - 1, t0 + s * 4, B.hip - 0.4, t0 + s * 4.4, B.hip + 4.6, t0 + s * 0.4, B.hip + 4]);
          p.poly(s < 0 ? plate : lil, [t0, B.hip - 1.4, t0 + s * 3.8, B.hip - 0.8, t0 + s * 4.1, B.hip + 3.8, t0 + s * 0.3, B.hip + 3.2]);
          p.poly(s < 0 ? lil : dark(lil, 0.12), [t0, B.hip + 1.2, t0 + s * 3.9, B.hip + 1.8, t0 + s * 3.9, B.hip + 2.4, t0, B.hip + 1.8]);
        }
        const belly = [cx - B.waW - 0.6, B.chest + 3.6, cx + B.waW + 0.6, B.chest + 3.6, cx + B.waW + 0.6, B.waist, cx - B.waW - 0.6, B.waist];
        p.poly(P.top, belly);
        p.clipPoly(belly, () => {
          p.poly(P.topSh, [cx + 3, B.chest + 3.6, cx + 10, B.chest + 3.6, cx + 10, B.waist, cx + 3, B.waist]);
          for (const s of [-1, 1]) p.rect(plate, cx + s * 2.6 - 0.5, B.chest + 3.6, 1, B.waist - B.chest);
        });
        const bp = [cx - B.shW + 2.6, B.sh + 1.4, cx - 2.4, B.sh + 0.6, cx, B.sh + 3, cx + 2.4, B.sh + 0.6, cx + B.shW - 2.6, B.sh + 1.4, cx + B.waW + 1.2, B.chest + 3.2, cx + B.waW + 0.6, B.chest + 4.4, cx, B.chest + 5, cx - B.waW - 0.6, B.chest + 4.4, cx - B.waW - 1.2, B.chest + 3.2];
        p.poly(plate, bp);
        p.clipPoly(bp, () => {
          p.poly(lil, [cx + 1.6, B.sh, cx + 12, B.sh, cx + 12, B.chest + 4, cx + 2.4, B.chest + 4]);
          for (const s of [-1, 1]) p.ell(lil, cx + s * 2.8, B.chest + 4.4, 3.2, 1.4);
        });
        ribbon(p, P.trim, [cx - B.waW - 1.2, B.chest + 3.2, cx - B.waW - 0.6, B.chest + 4.4, cx, B.chest + 5, cx + B.waW + 0.6, B.chest + 4.4, cx + B.waW + 1.2, B.chest + 3.2], -0.9);
        ribbon(p, P.trim, [cx - B.shW + 2.6, B.sh + 1.4, cx - 2.4, B.sh + 0.6, cx, B.sh + 3, cx + 2.4, B.sh + 0.6, cx + B.shW - 2.6, B.sh + 1.4], 0.8);
        break;
      }
      case 'sleeveless': {
        p.poly(P.skin, [cx - B.shW + 1.5, B.sh - 0.2, cx + B.shW - 1.5, B.sh - 0.2, cx + B.waW + 0.6, B.chest + 1.4, cx - B.waW - 0.6, B.chest + 1.4]);
        p.poly(P.skinSh, [cx + 2.6, B.sh - 0.2, cx + B.shW - 1.5, B.sh - 0.2, cx + B.waW + 0.6, B.chest + 1.4, cx + 3, B.chest + 1.4]);
        p.poly(P.inner, [cx - 2.6, B.sh - 0.4, cx + 2.6, B.sh - 0.4, cx, B.sh + 3]);
        const vest = [cx - 2.6, B.sh - 0.4, cx, B.sh + 3, cx + 2.6, B.sh - 0.4, cx + B.shW - 3.6, B.sh + 0.2, cx + B.waW + 0.6, B.chest + 1.2, cx + B.waW + 0.6, B.waist, cx + B.hiW + 0.6, B.hip + 1.8, cx - B.hiW - 0.6, B.hip + 1.8, cx - B.waW - 0.6, B.waist, cx - B.waW - 0.6, B.chest + 1.2, cx - B.shW + 3.6, B.sh + 0.2];
        p.poly(P.top, vest);
        p.clipPoly(vest, () => p.poly(P.topSh, [cx + 2.2, B.sh, cx + 12, B.sh, cx + 12, B.hip + 3, cx + 2.8, B.hip + 3]));
        ribbon(p, P.trim, [cx - B.hiW - 0.6, B.hip + 1.8, cx + B.hiW + 0.6, B.hip + 1.8], -1.1);
        p.poly(P.trim, [cx - 1.4, B.sh + 2.6, cx - 0.4, B.sh + 2.6, cx - 0.7, B.hip + 1.8, cx - 1.7, B.hip + 1.8]);
        for (const s of [-1, 1]) p.poly(P.trim, [cx + s * 2.6, B.sh - 0.4, cx + s * 3.4, B.sh - 1.8, cx + s * 3.9, B.sh - 0.5, cx + s * 5.4, B.sh - 0.6, cx + s * (B.shW - 3.6), B.sh + 0.6, cx + s * 3, B.sh + 1]);
        break;
      }
      case 'openvest': {
        const lin = L.lining || P.trim, nt = B.head + 38 * B.hu;
        p.poly(P.inner, [cx - B.shW + 1.6, B.sh - 0.2, cx + B.shW - 1.6, B.sh - 0.2, cx + B.waW + 0.4, B.waist, cx + B.hiW, B.hip + 1, cx - B.hiW, B.hip + 1, cx - B.waW - 0.4, B.waist]);
        p.poly(P.innerSh, [cx + 2.4, B.sh, cx + B.shW - 1.6, B.sh - 0.2, cx + B.waW + 0.4, B.waist, cx + B.hiW, B.hip + 1, cx + 3, B.hip + 1]);
        for (const s of [-1, 1]) {
          p.poly(s < 0 ? P.top : P.topSh, [cx + s * 3.4, B.sh - 0.6, cx + s * (B.shW - 0.4), B.sh - 0.4, cx + s * (B.shW + 0.2), B.sh + 2.4, cx + s * (B.waW + 0.8), B.waist, cx + s * (B.hiW + 1.2), B.hip + 3, cx + s * (B.hiW - 1.8), B.hip + 3.4, cx + s * 4.8, B.waist - 1, cx + s * 4.4, B.chest]);
          p.poly(lin, [cx + s * 3.4, B.sh - 0.6, cx + s * 4.4, B.sh - 0.4, cx + s * 5.4, B.chest, cx + s * 5.8, B.waist - 1, cx + s * 4.8, B.waist - 1, cx + s * 4.4, B.chest]);
          p.poly(s < 0 ? P.top : P.topSh, [cx + s * 3, B.sh - 0.4, cx + s * 3.6, nt + 1.6, cx + s * 5.2, nt + 2.2, cx + s * 5.6, B.sh - 0.2]);
        }
        break;
      }
      case 'vest':
        p.poly(P.top, [cx - B.shW + 2, B.sh, cx + B.shW - 2, B.sh, cx + B.waW + 0.6, B.waist, cx - B.waW - 0.6, B.waist]);
        p.poly(P.trim, [cx - B.shW + 2, B.sh, cx - B.shW + 4, B.sh, cx - B.waW + 1, B.waist, cx - B.waW - 0.6, B.waist]);
        break;
    }
    const opera = accOf(L, 'longgloves'), bell = accOf(L, 'bellsleeves'), half = accOf(L, 'halfsleeves');
    const bareArm = ['vest', 'tabard', 'cape', 'bolero', 'half', 'offcoat', 'doll', 'wrap', 'leo', 'crop', 'bodice', 'frost', 'bridal', 'sleeveless', 'memovest', 'openvest', 'raglan', 'heartcorset', 'volt', 'gyaru', 'bikini', 'bunnyvest', 'maid', 'valk'].includes(L.coat) && !(L.coat === 'cape' && L.sleeve);
    const cutArm = L.coat === 'cut';
    const rolled = accOf(L, 'rolled'), one = accOf(L, 'onesleeve'), claw = accOf(L, 'claw'), cuffs = accOf(L, 'furcuffs'), straps = accOf(L, 'straps');
    const sleeve = opera || half ? P.gloves : bareArm ? P.skin : L.sleeve || P.top, hand = half ? P.skin : P.gloves || P.skin;
    const wr = B.wrist || B.waist + 1, hl = B.hand || 3.6, lin0 = L.lining || P.trim;
    for (const s of [-1, 1]) {
      const x0 = cx + s * B.shW;
      const armPts = [x0 - s * 0.2, B.sh + 0.4, x0 - s * B.armW, B.sh + 1.4, x0 - s * (B.armW - 0.6), wr, x0 + s * 1.3, wr];
      p.poly(sleeve, armPts);
      if (B.male) p.poly(sleeve, [x0 - s * 2.6, B.sh - 0.6, x0 + s * 0.6, B.sh + 0.2, x0 + s * 1.8, B.sh + 3.4, x0 + s * 1.3, B.sh + 6, x0 - s * 2, B.sh + 5]);
      if (s > 0) p.poly(dark(sleeve, 0.2), [x0 - 0.6, B.sh + 1.5, x0 + 0.1, B.sh + 0.4, x0 + 1.3, wr, x0 - 0.3, wr]);
      if ((v = accOf(L, 'heartcuff'))) {
        const ey = B.sh + (wr - B.sh) * 0.38;
        p.band(B.sh - 1, ey, () => p.poly(P.skin, armPts));
        p.poly(v, [x0 + s * 1.5, ey - 0.4, x0 - s * (B.armW + 0.4), ey, x0 - s * (B.armW + 0.4), ey + 1.4, x0 + s * 1.5, ey + 1]);
        p.snap(light(v, 0.35), x0 - s * (B.armW * 0.5) - 0.5, ey + 0.2, 1, 1);
      }
      if (L.coat === 'raglan') {
        const ey = B.sh + (wr - B.sh) * 0.36, sl = L.sleeve || P.trim;
        p.poly(s < 0 ? sl : dark(sl, 0.16), [x0 + s * 1.2, B.sh - 0.4, x0 - s * (B.armW + 0.6), B.sh + 1, x0 - s * (B.armW + 0.8), ey, x0 + s * 1.8, ey + 0.4]);
      }
      if ((v = accOf(L, 'plates'))) {
        const ey = B.sh + (wr - B.sh) * 0.55, psh = L.plateSh || '#c0d0ee';
        p.band(ey, wr, () => p.poly(s < 0 ? P.skin : P.skinSh, armPts));
        p.poly('#22385e', [x0 + s * 1.9, ey - 1.4, x0 - s * (B.armW + 0.9), ey - 1.1, x0 - s * (B.armW + 0.8), ey + 1.6, x0 + s * 1.9, ey + 1.4]);
        p.poly(s < 0 ? v : psh, [x0 + s * 1.6, ey - 1, x0 - s * (B.armW + 0.6), ey - 0.7, x0 - s * (B.armW + 0.5), ey + 1, x0 + s * 1.6, ey + 0.8]);
        p.poly('#22385e', [x0 + s * 1.5, wr - 1.4, x0 - s * (B.armW + 0.3), wr - 1.4, x0 - s * (B.armW + 0.3), wr - 0.2, x0 + s * 1.5, wr - 0.2]);
        p.ell('#22385e', x0 - s * (B.armW * 0.5 - 0.8), B.sh + 1, B.armW * 0.5 + 2.1, 2.7);
        p.ell(s < 0 ? v : psh, x0 - s * (B.armW * 0.5 - 0.8), B.sh + 0.6, B.armW * 0.5 + 1.6, 2.2);
      }
      if ((v = accOf(L, 'glowcuff'))) { const xa = Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3) - 0.3; p.rect(v, xa, wr - 2.2, B.armW + 1.3, 1); p.rect(L.neon || '#fb2894', xa, wr - 1.2, B.armW + 1.3, 0.7); }
      if ((v = accOf(L, 'bangles')) && s < 0) { const xa = Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3) - 0.2; p.rect(v, xa, wr - 1.8, B.armW + 1.1, 0.7); p.rect(L.bangle2 || '#f070b0', xa, wr - 0.9, B.armW + 1.1, 0.7); }
      if (straps) { p.band(B.sh + 4.2, B.sh + 5.4, () => p.poly(straps, armPts)); p.snap('#c8ccd4', x0 - s * (B.armW * 0.5) - 0.4, B.sh + 4.4, 0.8, 0.8); }
      if ((v = accOf(L, 'opera1')) && s === (L.operaSide === 'r' ? 1 : -1)) { const ey = B.sh + 4; p.poly(v, [x0 + s * 1.5, ey, x0 - s * (B.armW + 0.1), ey + 0.4, x0 - s * (B.armW - 0.6), wr, x0 + s * 1.3, wr]); p.rect(v, Math.min(x0 - s * (B.armW + 0.3), x0 + s * 1.7), B.sh + 2.2, B.armW + 2, 1); p.poly(light(v, 0.18), [x0 + s * 0.4, ey + 1, x0 + s * 1.2, ey + 1, x0 + s * 1, wr - 1, x0 + s * 0.2, wr - 1]); }
      if ((v = accOf(L, 'bluetips'))) p.rect(v, Math.min(x0 - s * (B.armW - 1), x0 + s * 0.8), wr + hl - 0.8, B.armW - 1.6, 0.8);
      if ((v = accOf(L, 'armbandL')) && s < 0) p.poly(v, [x0 - 1.5, B.sh + 3.6, x0 + B.armW + 0.2, B.sh + 4, x0 + B.armW + 0.2, B.sh + 5.8, x0 - 1.5, B.sh + 5.4]);
      if ((v = accOf(L, 'sleeve1')) && s < 0) { p.poly(v, armPts); if (B.male) p.poly(v, [x0 - s * 2.6, B.sh - 0.6, x0 + s * 0.6, B.sh + 0.2, x0 + s * 1.8, B.sh + 3.4, x0 + s * 1.3, B.sh + 6, x0 - s * 2, B.sh + 5]); p.rect(P.top, Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3), wr - 1.6, B.armW + 0.7, 1.2); p.rect(light(v, 0.2), x0 - 0.4, B.sh + 3, 0.8, wr - B.sh - 5); }
      if ((v = accOf(L, 'cuffbtn')) && s < 0) for (const y of [wr - 3.4, wr - 1.8]) p.snap(v, x0 - 0.4, y, 0.9, 0.9);
      if (!bareArm && !opera && !half && !rolled && L.coat !== 'shrug' && L.coat !== 'hoodcape') p.rect(P.trim, Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3), wr - 1, B.armW + 0.7, 1);
      if ((v = accOf(L, 'trarm'))) {
        if (s < 0) {
          p.poly(v, [x0 + s * 1.6, wr - 2, x0 - s * (B.armW + 0.8), wr - 2, x0 - s * (B.armW + 1), wr + 0.2, x0 + s * 1.8, wr + 0.2]);
          p.ell(v, x0 - s * (B.armW * 0.5 - 0.6), B.sh + 2.6, B.armW * 0.5 + 1.2, 3);
        } else {
          const ey = B.sh + (wr - B.sh) * 0.55;
          p.band(B.sh + 3, ey, () => p.poly(P.skin, armPts));
          p.poly('#34323e', [x0 + s * 1.8, ey, x0 - s * (B.armW + 0.6), ey + 0.3, x0 - s * (B.armW + 0.2), wr + 0.4, x0 + s * 2, wr + 0.2]);
          p.poly('#9a9cac', [x0 + s * 1.8, ey + 0.4, x0 - s * (B.armW + 0.6), ey + 0.7, x0 - s * (B.armW + 0.5), ey + 1.5, x0 + s * 1.8, ey + 1.2]);
        }
      }
      if ((v = accOf(L, 'gauntlets'))) {
        const ey = B.sh + (wr - B.sh) * 0.66;
        p.poly(v, [x0 + s * 1.7, ey, x0 - s * (B.armW - 0.3), ey + 0.3, x0 - s * (B.armW - 0.4), wr + 0.4, x0 + s * 1.9, wr + 0.2]);
        if (s > 0) p.poly(dark(v, 0.2), [x0 + 0.5, ey, x0 + 1.7, ey, x0 + 1.9, wr + 0.2, x0 + 0.7, wr + 0.2]);
        for (const y of [ey + 0.9, wr - 1.3]) p.poly(L.gauntletBand || '#f2eef8', [x0 + s * 1.8, y, x0 - s * (B.armW - 0.3), y + 0.2, x0 - s * (B.armW - 0.3), y + 0.8, x0 + s * 1.8, y + 0.6]);
      }
      if ((v = accOf(L, 'detsleeves'))) {
        const ey = B.sh + (wr - B.sh) * (L.detAt || 0.4), band = L.band || '#f0b440', cf = L.cuff || P.top;
        p.poly(v, [x0 + s * 1.6, ey, x0 - s * (B.armW + 0.5), ey + 0.3, x0 - s * (B.armW + 1.1), wr + 0.6, x0 + s * 1.9, wr + 0.4]);
        if (s > 0) p.poly(dark(v, 0.16), [x0 + 0.4, ey, x0 + 1.6, ey, x0 + 1.9, wr + 0.4, x0 + 0.6, wr + 0.4]);
        p.poly(band, [x0 + s * 1.7, ey - 1.6, x0 - s * (B.armW + 0.6), ey - 1.3, x0 - s * (B.armW + 0.6), ey + 0.3, x0 + s * 1.7, ey]);
        p.poly(cf, [x0 + s * 1.7, ey, x0 - s * (B.armW + 0.6), ey + 0.3, x0 - s * (B.armW + 0.6), ey + 0.9, x0 + s * 1.7, ey + 0.6]);
        p.poly(cf, [x0 + s * 1.8, wr - 1.2, x0 - s * (B.armW + 1), wr - 0.9, x0 - s * (B.armW + 1.1), wr + 0.6, x0 + s * 1.9, wr + 0.4]);
      }
      p.poly(hand, [x0 + s * 1.3, wr, x0 - s * (B.armW - 0.6), wr, x0 - s * (B.armW - 1), wr + hl, x0 + s * 0.8, wr + hl]);
      if (half) p.poly(P.gloves, [x0 + s * 1.3, wr, x0 - s * (B.armW - 0.6), wr, x0 - s * (B.armW - 0.8), wr + hl * 0.45, x0 + s * 1.1, wr + hl * 0.45]);
      if (bell) {
        p.poly(bell, [x0 + s * 0.6, B.sh + 2.6, x0 - s * (B.armW + 0.2), B.sh + 3.4, x0 - s * (B.armW + 2.4), wr + 1.6, x0 + s * 2.6, wr + 2]);
        p.poly(dark(bell, 0.16), [x0 + s * 0.6, B.sh + 2.6, x0 + s * 1.4, B.sh + 4, x0 + s * 2.6, wr + 2, x0 + s * 1.2, wr + 2]);
        p.poly(L.cuff || P.top, [x0 - s * (B.armW + 1.9), wr - 0.8, x0 + s * 2.3, wr - 0.4, x0 + s * 2.4, wr + 0.6, x0 - s * (B.armW + 2.1), wr + 0.2]);
        p.poly('#d8b048', [x0 - s * (B.armW + 1.6), wr - 1.6, x0 + s * 2.1, wr - 1.2, x0 + s * 2.2, wr - 0.8, x0 - s * (B.armW + 1.8), wr - 1.1]);
      }
      if (half) {
        const ey = B.sh + (wr - B.sh) * 0.55;
        p.poly(P.top, [x0 + s * 0.6, B.sh - 0.2, x0 - s * (B.armW + 0.4), B.sh + 1, x0 - s * (B.armW + 1.8), ey, x0 + s * 2, ey + 0.6]);
        if (s > 0) p.poly(P.topSh, [x0 - 0.4, B.sh + 1, x0 + 0.6, B.sh - 0.2, x0 + 2, ey + 0.6, x0 + 0.4, ey + 0.4]);
        p.poly('#eef0f4', [x0 - s * (B.armW + 1.5), ey, x0 + s * 1.7, ey + 0.6, x0 + s * 1.5, ey + 1.8, x0 - s * (B.armW + 1.1), ey + 1.2]);
        p.poly(P.trim, [x0 - s * (B.armW + 1.8), ey - 0.9, x0 + s * 2, ey - 0.3, x0 + s * 2, ey + 0.6, x0 - s * (B.armW + 1.8), ey]);
        p.poly('#d8b050', [x0 - s * (B.armW + 1.7), ey - 1.9, x0 + s * 1.9, ey - 1.3, x0 + s * 1.9, ey - 0.8, x0 - s * (B.armW + 1.7), ey - 1.4]);
      }
      if (rolled) {
        const ey = B.sh + (wr - B.sh) * 0.5;
        p.poly(P.skin, [x0 - s * (B.armW - 0.4), ey + 1, x0 + s * 1.2, ey + 1, x0 + s * 1.3, wr, x0 - s * (B.armW - 0.6), wr]);
        if (s > 0) p.poly(P.skinSh, [x0 + 0.2, ey + 1, x0 + 1.2, ey + 1, x0 + 1.3, wr, x0 + 0.3, wr]);
        p.poly(rolled, [x0 - s * (B.armW + 0.3), ey - 0.6, x0 + s * 1.7, ey - 0.4, x0 + s * 1.6, ey + 1.4, x0 - s * (B.armW + 0.1), ey + 1.2]);
        p.poly(light(rolled, 0.25), [x0 - s * (B.armW + 0.3), ey - 0.6, x0 + s * 1.7, ey - 0.4, x0 + s * 1.7, ey + 0.2, x0 - s * (B.armW + 0.3), ey]);
        p.poly(P.gloves || P.skin, [x0 + s * 1.3, wr - 0.8, x0 - s * (B.armW - 0.6), wr - 0.8, x0 - s * (B.armW - 0.6), wr + 0.2, x0 + s * 1.3, wr + 0.2]);
      }
      if (one && s > 0 && L.coat === 'leo') {
        const ey = B.sh + (wr - B.sh) * 0.5;
        p.poly(one, [x0 - B.armW - 0.2, ey - 1, x0 + 1.6, ey - 1.4, x0 + 3.6, wr + 3, x0 + 1, wr + 4.4, x0 - B.armW - 0.8, wr + 1]);
        p.poly(dark(one, 0.25), [x0 + 0.6, ey - 1.2, x0 + 1.6, ey - 1.4, x0 + 3.6, wr + 3, x0 + 2, wr + 3.6]);
        p.poly(light(one, 0.3), [x0 - B.armW - 0.2, ey - 1, x0 - B.armW + 1, ey - 1.2, x0 - B.armW + 0.4, wr + 1, x0 - B.armW - 0.8, wr + 1]);
        p.rect('#1e1c28', x0 - B.armW - 0.2, B.sh + 3.6, B.armW + 1.6, 1.4);
        const rb = accOf(L, 'armribbon2');
        if (rb) { p.poly(rb, [x0 - 0.6, B.sh + 4.2, x0 + 3.4, B.sh + 1.6, x0 + 3, B.sh + 5]); p.poly(rb, [x0 + 0.6, B.sh + 4.6, x0 + 1.6, B.sh + 4.6, x0 + 3, B.ankle - 4, x0 + 1.8, B.ankle - 4]); }
      } else if (one && s > 0) {
        p.poly(one, [x0 - 1.4, B.sh - 0.4, x0 + 1.2, B.sh + 0.2, x0 + 2.8, wr + 1.4, x0 - B.armW - 1, wr + 1.2, x0 - B.armW - 0.2, B.sh + 2]);
        p.poly(dark(one, 0.25), [x0 + 0.4, B.sh + 1, x0 + 1.2, B.sh + 0.2, x0 + 2.8, wr + 1.4, x0 + 1.2, wr + 1.4]);
        p.poly(light(one, 0.3), [x0 - B.armW - 1, wr + 0.2, x0 + 2.6, wr + 0.4, x0 + 2.8, wr + 1.4, x0 - B.armW - 1, wr + 1.2]);
      }
      if (L.coat === 'leo' && s < 0) {
        const fc = accOf(L, 'furcuff') || '#f4f4f8';
        p.poly('#1e1c28', [x0 + 1.6, B.sh + 3, x0 + B.armW + 0.6, B.sh + 3.4, x0 + B.armW + 0.4, wr + hl * 0.7, x0 - 1.4, wr + hl * 0.7, x0 - 1.6, B.sh + 3.4]);
        p.poly(light('#1e1c28', 0.16), [x0 - 1, B.sh + 5, x0 + 0.2, B.sh + 5, x0 + 0.2, wr - 1, x0 - 1, wr - 1]);
        p.ell(fc, x0 + B.armW * 0.5 - 0.2, B.sh + 3, B.armW * 0.5 + 1.6, 1.6);
        p.ell(fc, x0 + B.armW * 0.5 - 0.2, wr - 0.6, B.armW * 0.5 + 1.4, 1.2);
      }
      if ((v = accOf(L, 'ruffcuff'))) { p.poly(dark(v, 0.12), [x0 + s * 2.2, wr - 2, x0 - s * (B.armW + 1), wr - 2, x0 - s * (B.armW + 1.4), wr + 0.6, x0 + s * 2.6, wr + 0.6]); p.poly(v, [x0 + s * 2, wr - 2, x0 - s * (B.armW + 0.8), wr - 2, x0 - s * (B.armW + 1), wr, x0 + s * 2.2, wr]); }
      if ((v = accOf(L, 'glovecuff'))) p.poly(v, [x0 + s * 1.6, wr - 0.6, x0 - s * (B.armW - 0.2), wr - 0.6, x0 - s * (B.armW - 0.3), wr + 1.2, x0 + s * 1.5, wr + 1.2]);
      if ((v = accOf(L, 'chainband')) && s > 0) { const ey = B.sh + (wr - B.sh) * 0.62; for (let x = x0 - B.armW; x < x0 + 1.4; x += 1.1) p.snap(v, x, ey, 0.8, 0.8); }
      if (claw && s < 0) {
        const ey = B.sh + (wr - B.sh) * 0.5;
        p.poly(dark(claw, 0.35), [x0 - 2.6, B.sh - 0.6, x0 + 1, B.sh - 1.4, x0 + B.armW + 0.6, B.sh + 1, x0 + B.armW + 0.6, ey + 0.4, x0 - 2.4, ey + 0.8]);
        p.poly(claw, [x0 - 2.2, B.sh - 0.2, x0 + 1, B.sh - 1, x0 + B.armW + 0.2, B.sh + 1.2, x0 + B.armW + 0.2, ey, x0 - 2, ey + 0.4]);
        p.poly(light(claw, 0.5), [x0 - 1.8, B.sh + 0.4, x0 - 0.2, B.sh - 0.2, x0 - 0.4, ey - 0.6, x0 - 1.6, ey - 0.4]);
        for (const y of [B.sh + 3, B.sh + 5.4]) p.rect(dark(claw, 0.35), x0 - 2, y, B.armW + 2, 0.5);
        p.poly('#a050e0', [x0 - 1.4, B.sh - 0.8, x0 - 0.4, B.sh - 7, x0 + 0.6, B.sh - 0.8]); p.poly('#d8a0f8', [x0 - 0.8, B.sh - 1.2, x0 - 0.4, B.sh - 5.4, x0, B.sh - 1.2]);
      }
      if (cuffs) {
        p.ell(dark(cuffs, 0.12), x0 - s * (B.armW * 0.5 - 0.6), wr - 0.1, B.armW * 0.5 + 1.4, 1.6);
        p.ell(cuffs, x0 - s * (B.armW * 0.5 - 0.6), wr - 0.4, B.armW * 0.5 + 1.2, 1.3);
      }
      if (L.coat === 'shrug') {
        const ey = B.sh + (wr - B.sh) * 0.58, shoulder = L.shoulder || light(P.top, 0.3);
        p.poly(dark(sleeve, 0.16), [x0 - s * (B.armW + 0.1), B.sh + 2, x0 - s * (B.armW - 1), B.sh + 2, x0 - s * (B.armW - 1.5), wr, x0 - s * (B.armW - 0.5), wr]);
        const pts = [x0 + s * 1.4, B.sh - 0.2, x0 - s * (B.armW + 0.4), B.sh + 0.8, x0 - s * (B.armW + 1.2), ey - 0.4, x0 - s * (B.armW * 0.4), ey + 1.4, x0 + s * 1.2, ey + 0.4, x0 + s * 2.4, ey + 1];
        p.poly(P.top, pts);
        p.clipPoly(pts, () => {
          p.rect(shoulder, x0 - 8, B.sh - 2, 16, 3.6);
          p.rect(mix(shoulder, P.top, 0.5), x0 - 8, B.sh + 1.6, 16, 1.4);
          if (s > 0) p.poly(P.topSh, [x0 - 0.4, B.sh, x0 + 3, B.sh, x0 + 3, ey + 2, x0 + 0.4, ey + 2]);
          p.rect(dark(P.top, 0.25), x0 - 8, ey - 0.2, 16, 0.6);
        });
        p.snap('#d8b050', x0 - s * (B.armW * 0.5) - 0.5, B.sh + 2.6, 1, 1);
        p.rect(P.trim, Math.min(x0 - s * (B.armW - 0.4), x0 + s * 1.6), wr - 1.8, B.armW + 1.2, 0.6);
        p.snap('#d8b050', x0 + (s < 0 ? -0.6 : 0.2), wr - 1.2, 0.8, 0.8);
        if (accOf(L, 'cufftails')) p.poly('#eef0f6', [x0 + s * 0.6, wr - 0.2, x0 + s * 1.6, wr - 0.2, x0 + s * 2, wr + hl + 1.2, x0 + s * 1, wr + hl + 0.8]);
      }
      if ((v = accOf(L, 'bracer')) && s < 0) {
        const ey = B.sh + (wr - B.sh) * 0.5;
        p.poly(light(sleeve, 0.1), [x0 - s * (B.armW + 0.6), ey - 1.6, x0 + s * 1.8, ey - 1.6, x0 + s * 1.8, ey + 0.4, x0 - s * (B.armW + 0.6), ey + 0.4]);
        p.poly('#a83038', [x0 - s * (B.armW + 0.5), ey - 2.4, x0 + s * 1.7, ey - 2.4, x0 + s * 1.7, ey - 1.6, x0 - s * (B.armW + 0.5), ey - 1.6]);
        p.poly(v, [x0 - s * (B.armW + 0.1), ey + 0.4, x0 + s * 1.5, ey + 0.4, x0 + s * 1.4, wr + hl * 0.55, x0 - s * (B.armW - 0.8), wr + hl * 0.55]);
        p.poly(light(v, 0.25), [x0 + s * 0.6, ey + 0.4, x0 + s * 1.5, ey + 0.4, x0 + s * 1.4, wr - 1, x0 + s * 0.6, wr - 1]);
        p.rect(L.lining || '#3a9c94', Math.min(x0 - s * (B.armW - 0.4), x0 + s * 1.5), wr - 1.4, B.armW + 1.1, 0.7);
      }
      if (cutArm && s > 0) {
        const ey = B.sh + (wr - B.sh) * 0.42;
        p.poly(P.inner, armPts);
        p.poly(P.skin, [x0 - s * (B.armW - 0.4), ey, x0 + s * 1.3, ey, x0 + s * 1.3, wr, x0 - s * (B.armW - 0.6), wr]);
        p.poly(P.skinSh, [x0 + 0.2, ey, x0 + 1.3, ey, x0 + 1.3, wr, x0 + 0.3, wr]);
        p.poly(P.inner, [x0 - s * (B.armW + 0.2), ey - 0.6, x0 + s * 1.5, ey - 0.6, x0 + s * 1.5, ey + 0.6, x0 - s * (B.armW + 0.2), ey + 0.6]);
        const gr = accOf(L, 'gloveR');
        if (gr) { p.poly(gr, [x0 + s * 1.4, wr - 1.2, x0 - s * (B.armW - 0.5), wr - 1.2, x0 - s * (B.armW - 1), wr + hl, x0 + s * 0.8, wr + hl]); p.rect(L.trim, x0 - B.armW + 0.4, wr - 1.6, B.armW + 1.1, 0.8); }
      }
      if (cutArm && s < 0) p.rect(L.trim, x0 - 1.2, B.sh + 6.6, B.armW + 1.4, 1);
      if (L.coat === 'wrap') {
        const ey = B.sh + (wr - B.sh) * 0.5;
        p.poly(P.gloves, [x0 - s * (B.armW - 0.4), ey, x0 + s * 1.3, ey, x0 + s * 1.3, wr, x0 - s * (B.armW - 0.6), wr]);
        p.poly(P.top, [x0 + s * 1.8, B.sh + 3.4, x0 - s * (B.armW + 0.6), B.sh + 4, x0 - s * (B.armW + 1), ey + 1, x0 + s * 2.2, ey + 1.4]);
        p.poly(P.innerSh, [x0 + s * 1.8, B.sh + 3.4, x0 + s * 0.6, B.sh + 3.6, x0 + s * 1, ey + 1.2, x0 + s * 2.2, ey + 1.4]);
        if (s < 0) for (const y of [B.sh + 5, B.sh + 7.4]) p.poly('#d8b050', [x0 - s * (B.armW + 0.8), y, x0 + s * 2, y - 0.8, x0 + s * 2, y, x0 - s * (B.armW + 0.8), y + 0.8]);
        else {
          p.poly(L.trim, [x0 - B.armW - 1, ey - 0.4, x0 + 2.2, ey, x0 + 2.2, ey + 1.4, x0 - B.armW - 1, ey + 1]);
          if (accOf(L, 'medal')) { p.rect(L.trim, x0 - B.armW - 0.2, B.sh + 3.6, B.armW + 1.6, 3.4); for (let i = 0; i < 3; i++) p.rect(i % 2 ? '#f4f4f8' : '#d83040', x0 - B.armW + 0.2 + i * 1.2, B.sh + 3.8, 0.8, 3); p.snap('#e0b848', x0 - 1, B.sh + 7, 1.2, 1.2); }
        }
      }
      if ((v = accOf(L, 'redsleeve')) && s < 0) {
        p.poly(v, [x0 - s * 0.2, B.sh + 3, x0 - s * B.armW, B.sh + 3.6, x0 - s * (B.armW - 0.4), wr + 0.6, x0 + s * 1.5, wr + 0.6]);
        p.poly(dark(v, 0.2), [x0 + s * 0.6, B.sh + 3, x0 - s * 0.2, B.sh + 3, x0 + s * 1.5, wr + 0.6, x0 + s * 0.8, wr + 0.6]);
        p.poly('#f2eef0', [x0 + s * 0.2, B.sh + 2.6, x0 - s * (B.armW + 0.2), B.sh + 3.2, x0 - s * (B.armW + 0.2), B.sh + 4.6, x0 + s * 0.4, B.sh + 4]);
        p.rect(dark(v, 0.3), Math.min(x0 - s * B.armW, x0 + s * 1.5), wr - 0.4, B.armW + 1.6, 0.8);
      }
      if ((v = accOf(L, 'ribbonwrap')) && s > 0) { const ey = B.sh + (wr - B.sh) * 0.4; for (let y = ey; y < wr + 1; y += 1.4) p.poly(v, [x0 - B.armW, y + 0.6, x0 + 1.4, y, x0 + 1.4, y + 0.6, x0 - B.armW, y + 1.2]); p.poly(v, [x0 + 0.4, wr, x0 + 1.4, wr, x0 + 2.4, B.hip + 6, x0 + 1.4, B.hip + 6]); }
      if (L.coat === 'crop') {
        const ey = B.sh + (wr - B.sh) * 0.5;
        const ws = s > 0 && accOf(L, 'whitesleeve');
        if (ws) p.poly(ws, [x0 - s * (B.armW - 0.2), ey + 1, x0 + s * 1.4, ey + 1, x0 + s * 1.4, wr, x0 - s * (B.armW - 0.6), wr]);
        p.ell(dark(P.top, 0.2), x0 - s * (B.armW * 0.5 - 0.6), B.sh + 3.4, B.armW * 0.5 + 1.6, 3.8);
        p.ell(P.top, x0 - s * (B.armW * 0.5 - 0.4), B.sh + 3, B.armW * 0.5 + 1.2, 3.3);
        p.poly(light(P.top, 0.14), [x0 - s * (B.armW - 0.2), B.sh + 1.6, x0 - s * (B.armW - 1.4), B.sh + 1.4, x0 - s * (B.armW - 1.2), B.sh + 5, x0 - s * (B.armW - 0.2), B.sh + 5]);
        p.poly('#2a2836', [x0 - s * (B.armW + 0.2), ey - 1.2, x0 + s * 1.6, ey - 1.2, x0 + s * 1.6, ey + 1.2, x0 - s * (B.armW + 0.2), ey + 1.2]);
        p.rect(L.lining, Math.min(x0 - s * (B.armW + 0.2), x0 + s * 1.6), ey - 0.2, B.armW + 1.8, 0.5);
        p.poly(P.gloves, [x0 + s * 1.5, wr - 1.4, x0 - s * (B.armW - 0.4), wr - 1.4, x0 - s * (B.armW - 0.9), wr + hl * 0.6, x0 + s * 1, wr + hl * 0.6]);
        p.snap('#c8ccd4', x0 - s * (B.armW * 0.5) - 0.4, wr - 1, 0.8, 0.8);
      }
      if (L.coat === 'kid') {
        const el = B.sh + (wr - B.sh) * 0.5;
        if (s > 0) {
          const kx = x0 - B.armW + 0.8, ky = B.sh + 3;
          p.rect('#f4f4f6', kx, ky, 1, 4.4);
          p.poly('#f4f4f6', [kx + 1, ky + 2, kx + 3.2, ky, kx + 3.8, ky + 0.6, kx + 1.4, ky + 2.8]);
          p.poly('#f4f4f6', [kx + 1, ky + 2.2, kx + 1.6, ky + 1.8, kx + 3.8, ky + 4.4, kx + 2.8, ky + 4.4]);
        } else p.rect('#1c1c22', x0 + 0.2, B.sh + 3, B.armW - 0.4, 1.6);
        p.poly(dark(P.top, 0.28), [x0 + s * 1.2, el - 0.3, x0 - s * (B.armW - 0.4), el, x0 - s * (B.armW - 0.6), el + 0.6, x0 + s * 1.2, el + 0.4]);
        const cf = Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3) - 0.3;
        p.rect('#f4f4f6', cf, wr - 2.2, B.armW + 1.3, 2.2);
        p.rect('#c8ccd4', cf, wr - 0.6, B.armW + 1.3, 0.6);
        p.snap('#c8283a', x0 - s * (B.armW * 0.5 - 0.4) - 0.4, wr + hl * 0.55, 0.8, 0.8);
      }
      if (L.coat === 'gyaru') {
        const ey = B.sh + (wr - B.sh) * 0.3, col = L.collarCol || '#f4f4f6';
        const pts = [x0 + s * 2.2, B.sh + 1.2, x0 - s * (B.armW + 1), B.sh + 1.8, x0 - s * (B.armW + 1.2), ey + 1.4, x0 + s * 2.4, ey + 1];
        p.poly(P.top, pts);
        if (s > 0) p.clipPoly(pts, () => p.poly(dark(P.top, 0.25), [x0 + 0.6, B.sh, x0 + 4, B.sh, x0 + 4, ey + 2, x0 + 0.8, ey + 2]));
        p.poly(col, [x0 + s * 2.2, B.sh + 1.2, x0 - s * (B.armW + 1), B.sh + 1.8, x0 - s * (B.armW + 0.6), B.sh + 2.8, x0 + s * 2.2, B.sh + 2.2]);
        if (s > 0) p.snap('#c83040', x0 - 1.6, ey - 1, 1, 1);
      }
      if (L.coat === 'volt') {
        const sl = L.sleeve || '#1e2024', ey = B.sh + (wr - B.sh) * 0.64, cap = x0 - s * (B.armW * 0.5 - 0.6);
        const pts = [x0 + s * 1.2, B.sh + 1.4, x0 - s * (B.armW + 0.8), B.sh + 2, x0 - s * (B.armW + 1.1), wr - 0.4, x0 + s * 1.5, wr - 0.2];
        p.poly(sl, pts);
        if (s > 0) p.clipPoly(pts, () => p.poly(dark(sl, 0.25), [x0 + 0.6, B.sh, x0 + 4, B.sh, x0 + 4, wr + 1, x0 + 0.8, wr + 1]));
        p.ell(dark(P.top, 0.25), cap, B.sh + 3.2, B.armW * 0.5 + 2, 2.4);
        p.ell(P.top, cap, B.sh + 2.7, B.armW * 0.5 + 1.8, 2);
        p.ell('#34363e', cap, B.sh + 6.4, 1.7, 1.7);
        p.ell('#9a9ca6', cap, B.sh + 6.4, 0.8, 0.8);
        p.rect(P.top, Math.min(x0 - s * (B.armW + 0.9), x0 + s * 1.3), ey, B.armW + 2.2, 0.9);
        p.poly(P.gloves, [x0 + s * 1.5, wr - 1.2, x0 - s * (B.armW - 0.4), wr - 1.2, x0 - s * (B.armW - 0.9), wr + hl * 0.55, x0 + s * 1, wr + hl * 0.55]);
      }
      if (L.coat === 'offcoat') {
        const ey = B.sh + (wr - B.sh) * 0.42;
        p.poly(L.lining, [x0 + s * 2.6, ey - 0.4, x0 - s * (B.armW + 0.4), ey, x0 - s * (B.armW + 1.6), wr + 3.6, x0 + s * 4.4, wr + 3.4]);
        p.poly(P.top, [x0 + s * 2.6, ey - 0.4, x0 - s * (B.armW + 0.4), ey, x0 - s * (B.armW + 0.8), wr + 1.6, x0 + s * 1.6, wr + 3.6, x0 + s * 4.4, wr + 3.4]);
        p.poly(P.innerSh, [x0 + s * 2.6, ey - 0.4, x0 + s * 1.2, ey - 0.2, x0 + s * 2.4, wr + 3.4, x0 + s * 4.4, wr + 3.4]);
        p.poly(P.trim, [x0 + s * 2.6, ey - 0.6, x0 - s * (B.armW + 0.4), ey - 0.2, x0 - s * (B.armW + 0.4), ey + 0.6, x0 + s * 2.6, ey + 0.2]);
        if ((v = accOf(L, 'thlace'))) {
          p.poly(v, [x0 + s * 1.6, wr - 0.4, x0 - s * (B.armW + 0.8), wr - 0.4, x0 - s * (B.armW + 1.2), wr + 2.6, x0 + s * 2, wr + 2.6]);
          p.poly(dark(v, 0.14), [x0 + s * 2, wr + 2, x0 - s * (B.armW + 1.2), wr + 2, x0 - s * (B.armW + 1.2), wr + 2.6, x0 + s * 2, wr + 2.6]);
          p.poly(P.skin, [x0 - s * (B.armW - 0.6), wr + 2.6, x0 + s * 1.6, wr + 2.6, x0 + s * 1.2, wr + 2.6 + hl, x0 - s * (B.armW - 1.2), wr + 2.6 + hl]);
          p.ell('#7a78e8', x0 - s * (B.armW * 0.3), wr - 1, 1.3, 0.9);
        }
        if ((v = accOf(L, 'bracelets')) && s < 0) { p.rect(v, Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3), wr - 1.6, B.armW + 0.7, 0.6); p.rect('#f070c0', Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3), wr - 0.8, B.armW + 0.7, 0.6); }
      }
      if (L.coat === 'half') {
        if (s < 0) {
          const pts = [x0 + s * 1.8, B.sh + 1.4, x0 - s * (B.armW + 0.6), B.sh + 2.4, x0 - s * (B.armW + 1.8), wr - 0.4, x0 + s * 3, wr - 0.2];
          p.poly(P.top, pts);
          p.poly(P.innerSh, [x0 + s * 1.8, B.sh + 1.4, x0 + s * 0.8, B.sh + 1.8, x0 + s * 1.6, wr - 0.4, x0 + s * 3, wr - 0.2]);
          p.poly('#e0508a', [x0 - s * (B.armW + 1.8), wr - 2, x0 + s * 3, wr - 1.8, x0 + s * 3, wr - 0.2, x0 - s * (B.armW + 1.8), wr - 0.4]);
          p.poly(L.trim, [x0 - s * (B.armW + 1.8), wr - 2.8, x0 + s * 3, wr - 2.6, x0 + s * 3, wr - 1.8, x0 - s * (B.armW + 1.8), wr - 2]);
          p.rect('#26242a', Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1.3), wr + 0.8, B.armW + 0.7, 0.9);
        } else {
          const bs = accOf(L, 'blacksleeve') || P.inner;
          p.poly(bs, [x0 + 1.4, B.sh + 1.8, x0 - B.armW - 0.2, B.sh + 2.4, x0 - B.armW + 0.2, wr, x0 + 1.4, wr]);
          p.poly(light(bs, 0.15), [x0 + 0.4, B.sh + 2, x0 + 1.4, B.sh + 1.8, x0 + 1.4, wr, x0 + 0.4, wr]);
          for (const y of [B.sh + 3.4, B.sh + 7, wr - 3]) p.rect('#c8ccd4', x0 - B.armW + 0.2, y, B.armW + 1.2, 0.7);
          const pg = accOf(L, 'pinkglove');
          if (pg) p.poly(pg, [x0 + 1.3, wr, x0 - B.armW + 0.6, wr, x0 - B.armW + 1, wr + hl * 0.55, x0 + 0.9, wr + hl * 0.55]);
        }
      }
      if (L.coat === 'bolero') {
        const pe = B.sh + 5.4, gl = accOf(L, 'longglove1');
        if (gl && s < 0) {
          p.poly(gl, [x0 - s * 0.2, pe - 0.4, x0 - s * B.armW, pe, x0 - s * (B.armW - 0.6), wr, x0 + s * 1.3, wr]);
          p.poly(gl, [x0 + s * 1.3, wr, x0 - s * (B.armW - 0.6), wr, x0 - s * (B.armW - 1), wr + hl, x0 + s * 0.8, wr + hl]);
          p.poly(light(gl, 0.18), [x0 - s * 0.2, pe, x0 - s * 1.2, pe, x0 - s * 0.9, wr, x0 + s * 0.2, wr]);
          for (const y of [pe + 3, pe + 6]) p.snap('#d8b050', x0 - s * (B.armW * 0.5) - 0.4, y, 0.8, 0.8);
        }
        if (s > 0) p.rect('#2a2420', x0 - B.armW + 0.6, wr - 1.2, B.armW + 0.6, 1.2);
        p.poly(dark(P.top, 0.1), [x0 + s * 1.6, B.sh - 0.8, x0 - s * (B.armW + 0.8), B.sh + 0.2, x0 - s * (B.armW + 1.2), pe, x0 + s * 2.4, pe + 0.6]);
        p.poly(P.top, [x0 + s * 1.4, B.sh - 0.8, x0 - s * (B.armW + 0.6), B.sh + 0.2, x0 - s * (B.armW + 0.8), pe - 0.6, x0 + s * 2, pe]);
        p.poly(P.trim, [x0 - s * (B.armW + 1.2), pe - 0.4, x0 + s * 2.4, pe + 0.2, x0 + s * 2.4, pe + 0.8, x0 - s * (B.armW + 1.2), pe + 0.2]);
      }
      if ((v = accOf(L, 'bracerR')) && s > 0) {
        const ey = B.sh + (wr - B.sh) * 0.5;
        p.poly(v, [x0 - B.armW - 0.2, ey, x0 + 1.5, ey, x0 + 1.4, wr - 0.6, x0 - B.armW + 0.5, wr - 0.6]);
        p.poly(light(v, 0.2), [x0 + 0.4, ey, x0 + 1.5, ey, x0 + 1.4, wr - 0.6, x0 + 0.4, wr - 0.6]);
        p.rect(L.trim, x0 - B.armW + 0.4, wr - 1.6, B.armW + 1.2, 1.2);
      }
      if ((v = accOf(L, 'armbandr')) && s > 0 && L.coat === 'bolero') p.rect(v, x0 - B.armW + 0.2, B.sh + 7, B.armW + 1.4, 1);
      else if ((v = accOf(L, 'armbandr')) && s > 0) p.poly(v, [x0 - B.armW - 0.2, B.sh + 6.2, x0 + 1.5, B.sh + 6.2, x0 + 1.5, B.sh + 7.4, x0 - B.armW - 0.2, B.sh + 7.4]);
      if ((v = accOf(L, 'dragonpad')) && s > 0) {
        p.poly(dark(v, 0.35), [x0 - 3.8, B.sh - 0.4, x0 + 0.6, B.sh - 1.8, x0 + 3.4, B.sh + 0.6, x0 + 3.6, B.sh + 4.6, x0 + 1, B.sh + 3.4, x0 - 2.6, B.sh + 2.6]);
        p.poly(v, [x0 - 3.4, B.sh - 0.2, x0 + 0.6, B.sh - 1.4, x0 + 3, B.sh + 0.8, x0 + 3, B.sh + 3.6, x0 + 1, B.sh + 2.6, x0 - 2.4, B.sh + 2]);
        p.poly(light(v, 0.4), [x0 - 2.8, B.sh - 0.2, x0 + 0.4, B.sh - 1, x0 + 1.4, B.sh + 0.2, x0 - 1.4, B.sh + 0.8]);
        p.snap('#d8b050', x0 - 1, B.sh + 0.4, 1, 1);
        p.poly('#f2f2f4', [x0 + 0.2, B.sh + 2.6, x0 + 1.4, B.sh + 2.6, x0 + 1.8, B.sh + 10, x0 + 0.6, B.sh + 10]);
        p.poly(L.lining || v, [x0 + 0.5, B.sh + 8, x0 + 1.7, B.sh + 8, x0 + 1.8, B.sh + 10, x0 + 0.6, B.sh + 10]);
        p.snap('#d8b050', x0 - 1.8, B.sh + 10.4, 1.2, 1.2);
      }
      if ((v = accOf(L, 'armribbon')) && s < 0) {
        const ey = B.sh + (wr - B.sh) * 0.45;
        p.poly(v, [x0 + s * 1.6, ey - 1, x0 - s * (B.armW + 0.4), ey - 0.2, x0 - s * (B.armW + 0.4), ey + 0.8, x0 + s * 1.6, ey]);
        p.poly(v, [x0 + s * 1.2, ey, x0 + s * 2.2, ey, x0 + s * 2.4, B.hip + 3, x0 + s * 1.4, B.hip + 3.6]);
        p.poly(dark(v, 0.25), [x0 + s * 1.9, ey + 2, x0 + s * 2.2, ey + 2, x0 + s * 2.4, B.hip + 3, x0 + s * 2, B.hip + 3.2]);
      }
      if ((v = accOf(L, 'armwrap')) && s < 0) {
        const ey = B.sh + 3;
        p.poly(v, [x0 + s * 2, ey, x0 - s * (B.armW + 0.8), ey + 0.6, x0 - s * (B.armW + 0.9), ey + 3.2, x0 + s * 2.1, ey + 2.6]);
        p.poly(dark(v, 0.22), [x0 + s * 2, ey + 1.3, x0 - s * (B.armW + 0.8), ey + 1.9, x0 - s * (B.armW + 0.8), ey + 2.3, x0 + s * 2, ey + 1.7]);
      }
      if ((v = accOf(L, 'ruffle')) && s < 0) {
        const ey = B.sh + (wr - B.sh) * 0.48;
        p.poly(dark(v, 0.14), [x0 + s * 1.8, ey - 2.6, x0 - s * (B.armW + 0.6), ey - 1.6, x0 - s * (B.armW + 1.4), ey + 2.6, x0 + s * 0.6, ey + 3.4, x0 + s * 2.8, ey + 1.6]);
        p.poly(v, [x0 + s * 1.6, ey - 2.4, x0 - s * (B.armW + 0.4), ey - 1.4, x0 - s * (B.armW + 0.8), ey + 1.6, x0 + s * 0.6, ey + 2.4, x0 + s * 2.4, ey + 1]);
        p.poly(P.top, [x0 + s * 1.5, B.sh, x0 - s * (B.armW + 0.2), B.sh + 0.8, x0 - s * (B.armW + 0.4), ey - 1.4, x0 + s * 1.6, ey - 2.4]);
        p.poly(lin0, [x0 - s * (B.armW - 0.6), B.sh + 1.6, x0 - s * (B.armW + 0.2), B.sh + 1.6, x0 - s * (B.armW + 0.4), ey - 1.6, x0 - s * (B.armW - 0.4), ey - 1.8]);
      }
      if ((v = accOf(L, 'bangle')) && s > 0) {
        p.poly(v, [x0 + 1.5, wr - 1.8, x0 - B.armW + 0.4, wr - 1.8, x0 - B.armW + 0.4, wr - 0.6, x0 + 1.5, wr - 0.6]);
        p.ell('#1e1a1c', x0 - 0.6, wr + 0.2, 1.8, 1);
      }
      if ((v = accOf(L, 'tancuff'))) { p.poly(dark(v, 0.2), [x0 + s * 2, wr - 3.4, x0 - s * (B.armW + 0.6), wr - 3.4, x0 - s * (B.armW + 0.6), wr + 0.4, x0 + s * 2, wr + 0.4]); p.poly(v, [x0 + s * 1.8, wr - 3.2, x0 - s * (B.armW + 0.4), wr - 3.2, x0 - s * (B.armW + 0.4), wr - 0.2, x0 + s * 1.8, wr - 0.2]); p.poly(dark(v, 0.25), [x0 - s * (B.armW * 0.5 - 1), wr - 3.2, x0 - s * (B.armW * 0.5 - 0.4), wr - 3.2, x0 - s * (B.armW * 0.5 + 0.8), wr - 0.2, x0 - s * (B.armW * 0.5 + 0.2), wr - 0.2]); const ey = B.sh + (wr - B.sh) * 0.35; p.poly(v, [x0 + s * 1.2, ey, x0 - s * (B.armW - 0.4), ey + 0.4, x0 - s * (B.armW - 0.6), ey + 3, x0 + s * 1.1, ey + 2.6]); }
      if ((v = accOf(L, 'goldcuff'))) p.poly(v, [x0 + s * 1.5, wr - 0.8, x0 - s * (B.armW - 0.4), wr - 0.8, x0 - s * (B.armW - 0.5), wr + 0.4, x0 + s * 1.4, wr + 0.4]);
      if ((v = accOf(L, 'glove1')) && s < 0) p.poly(v, [x0 + s * 1.3, wr, x0 - s * (B.armW - 0.6), wr, x0 - s * (B.armW - 1), wr + hl * 0.8, x0 + s * 0.8, wr + hl * 0.8]);
      if ((v = accOf(L, 'handwrap')) && s < 0) {
        p.poly(v, [x0 + s * 1.4, wr - 1.4, x0 - s * (B.armW - 0.5), wr - 1.4, x0 - s * (B.armW - 1), wr + hl - 0.4, x0 + s * 0.8, wr + hl - 0.4]);
        for (let y = wr - 0.6; y < wr + hl - 0.8; y += 1.4) p.poly(dark(v, 0.22), [x0 + s * 1.3, y, x0 - s * (B.armW - 0.6), y + 0.5, x0 - s * (B.armW - 0.6), y + 0.9, x0 + s * 1.3, y + 0.4]);
        p.rect(P.skin, Math.min(x0 - s * (B.armW - 1), x0 + s * 0.8), wr + hl - 0.6, B.armW - 1.6, 0.9);
      }
      if (B.male) p.rect(dark(hand, 0.18), x0 + (s < 0 ? -1.2 : -0.6) + s * 0.4, wr + hl - 1.2, 1.4, 1.2);
      if ((v = accOf(L, 'mecharm')) && s < 0) {
        const ey = B.sh + (wr - B.sh) * 0.48, lava = L.lava || '#ff7a2a', inX = x0 - s * (B.armW + 0.6), outX = x0 + s * 1.7;
        p.poly(dark(v, 0.3), [x0 - s * 0.4, B.sh + 0.2, inX, B.sh + 1.2, inX, wr + 0.6, outX, wr + 0.6]);
        p.poly(v, [x0 - s * 0.2, B.sh + 0.6, x0 - s * (B.armW + 0.2), B.sh + 1.6, x0 - s * (B.armW + 0.2), ey - 0.6, x0 + s * 1.3, ey - 0.6]);
        p.poly(v, [x0 + s * 1.5, ey + 0.4, x0 - s * (B.armW + 0.4), ey + 0.4, x0 - s * (B.armW + 0.4), wr + 0.2, x0 + s * 1.5, wr + 0.2]);
        p.poly(light(v, 0.3), [outX - s * 0.6, B.sh + 1.4, outX - s * 1.6, B.sh + 1.4, outX - s * 1.6, wr - 0.6, outX - s * 0.6, wr - 0.6]);
        p.snap(lava, Math.min(inX, outX) + 1.4, ey + 1.4, 0.6, 2.4); p.snap(lava, Math.min(inX, outX) + 1.4, ey + 3.6, 2, 0.6); p.snap(lava, Math.min(inX, outX) + 2.8, B.sh + 3.2, 0.6, 1.8);
        p.poly('#9aa0ac', [x0 + s * 1.4, wr + 0.4, x0 - s * (B.armW - 0.2), wr + 0.4, x0 - s * (B.armW - 0.6), wr + hl + 0.6, x0 + s * 1, wr + hl + 0.8]);
        for (const dx of [0.4, 1.6, 2.8]) p.rect('#5a606c', Math.min(x0 - s * (B.armW - 0.6), x0 + s * 1) + dx, wr + hl - 0.8, 0.5, 1.4);
        const pad = L.padCol || '#c8a858';
        p.ell(dark(pad, 0.3), x0 - s * (B.armW * 0.5 - 0.6), B.sh + 1.2, B.armW * 0.5 + 2.2, 2.8);
        p.ell(pad, x0 - s * (B.armW * 0.5 - 0.6), B.sh + 0.8, B.armW * 0.5 + 1.8, 2.3);
        p.ell(light(pad, 0.3), x0 - s * (B.armW * 0.5 - 0.2), B.sh + 0.2, 1.4, 0.8);
      }
      if ((v = accOf(L, 'prosthetic')) && s > 0) {
        const ey = B.sh + (wr - B.sh) * 0.5;
        p.poly(v, [x0 - B.armW + 0.2, ey, x0 + 1.4, ey, x0 + 1.3, wr + 0.6, x0 - B.armW + 0.4, wr + 0.6]);
        p.poly(light(v, 0.25), [x0 - B.armW + 0.4, ey + 0.6, x0 - 0.4, ey + 0.6, x0 - 0.6, wr - 0.8, x0 - B.armW + 0.4, wr - 0.8]);
        p.rect('#e8e8ec', x0 - B.armW + 0.8, ey + 2.4, 1, 1.6); p.rect('#e8e8ec', x0 - B.armW + 2.2, ey + 2.4, 1, 1.6);
        p.poly(v, [x0 + 1.3, wr + 0.4, x0 - B.armW + 0.4, wr + 0.4, x0 - B.armW + 0.2, wr + hl + 0.4, x0 + 1, wr + hl + 0.8]);
        for (const dx of [-0.4, 0.8, 2]) p.rect(light(v, 0.3), x0 - B.armW + dx, wr + hl - 0.6, 0.6, 1.4);
      }
    }
    const neckTop = B.head + 38 * B.hu, nw = B.neck || 4;
    p.rect(P.skin, cx - nw / 2, neckTop, nw, B.sh - neckTop + 1.2);
    p.rect(P.skinSh, cx - nw / 2, neckTop, nw, 1.6);
    if (B.male) p.poly(P.skin, [cx - nw / 2, B.sh - 1, cx - nw / 2 - 3, B.sh + 0.4, cx + nw / 2 + 3, B.sh + 0.4, cx + nw / 2, B.sh - 1]);
    switch (L.collar) {
      case 'v': p.poly(P.inner, [cx - 3 - (B.male ? 0.8 : 0), B.sh - 0.2, cx + 3 + (B.male ? 0.8 : 0), B.sh - 0.2, cx, B.sh + 6]); break;
      case 'high': { const cw = Math.max(5.2, nw + 1.2), nc = L.neck || P.inner; p.rect(nc, cx - cw / 2, neckTop + 1, cw, B.sh - neckTop + 0.5); p.rect(L.neck ? light(nc, 0.12) : P.innerSh, cx + cw / 2 - 1.8, neckTop + 1, 1.8, B.sh - neckTop + 0.5); break; }
      case 'hood': p.ell(P.inner, cx, B.sh + 1.2, B.male ? 7 : 5.8, 2.8); p.ell(P.innerSh, cx + 1.5, B.sh + 1.8, 3, 1.4); break;
      case 'fur': p.ell(P.trim, cx, B.sh + 0.6, B.shW - 1.2, 2.6); break;
      case 'sailor':
        p.poly(P.innerSh, [cx - B.shW + 0.2, B.sh - 0.2, cx + B.shW - 0.2, B.sh - 0.2, cx + B.shW - 0.8, B.sh + 2.8, cx + 2.6, B.sh + 2.2, cx, B.sh + 4.2, cx - 2.6, B.sh + 2.2, cx - B.shW + 0.8, B.sh + 2.8]);
        p.poly(P.inner, [cx - B.shW + 0.8, B.sh - 0.2, cx + B.shW - 0.8, B.sh - 0.2, cx + B.shW - 1.4, B.sh + 2, cx + 2.6, B.sh + 1.4, cx, B.sh + 3.2, cx - 2.6, B.sh + 1.4, cx - B.shW + 1.4, B.sh + 2]);
        p.poly(P.skin, [cx - 2.2, B.sh - 0.3, cx + 2.2, B.sh - 0.3, cx, B.sh + 2.2]);
        break;
      case 'frill': p.poly(P.inner, [cx - 4, B.sh - 0.5, cx + 4, B.sh - 0.5, cx + 5, B.sh + 2.5, cx, B.sh + 3.5, cx - 5, B.sh + 2.5]); break;
      case 'shirt':
        if (L.coat === 'shirt') { for (const sd of [-1, 1]) p.poly(P.inner, [cx, B.sh + 0.4, cx + sd * 3.4, B.sh - 1.4, cx + sd * 3.2, B.sh + 1.4]); p.poly(P.innerSh, [cx, B.sh + 0.4, cx + 3.4, B.sh - 1.4, cx + 3.2, B.sh + 1.4]); break; }
        p.rect(P.inner, cx - 2.6, neckTop + 1.4, 5.2, B.sh - neckTop);
        for (const sd of [-1, 1]) p.poly(P.inner, [cx + sd * 0.4, B.sh - 0.6, cx + sd * 3.6, B.sh - 1, cx + sd * 2.6, B.sh + 2.2]);
        p.poly(P.innerSh, [cx + 0.4, B.sh - 0.6, cx + 3.6, B.sh - 1, cx + 2.6, B.sh + 2.2]);
        break;
      case 'halter':
        p.rect(P.inner, cx - 2.6, neckTop + 0.6, 5.2, 2.2);
        for (const sd of [-1, 1]) p.poly(P.inner, [cx + sd * 1.6, neckTop + 2.4, cx + sd * 2.8, neckTop + 2.4, cx - sd * 4.4, B.chest + 0.6, cx - sd * 5.6, B.chest + 0.6]);
        p.snap('#d8b050', cx - 0.5, B.sh + 0.6, 1, 1);
        break;
      case 'bare': p.poly(P.skin, [cx - B.shW + 1, B.sh - 0.3, cx + B.shW - 1, B.sh - 0.3, cx + B.shW - 2.4, B.sh + 3.4, cx - B.shW + 2.4, B.sh + 3.4]); break;
      case 'scoop': {
        p.poly(P.skin, [cx - 4.8, B.sh - 0.4, cx + 4.8, B.sh - 0.4, cx, B.sh + 4.6]);
        ribbon(p, P.trim, [cx - 4.8, B.sh - 0.4, cx, B.sh + 4.6], 0.9);
        ribbon(p, P.trim, [cx + 4.8, B.sh - 0.4, cx, B.sh + 4.6], -0.9);
        p.poly(L.lace || '#3a1a1c', [cx - 0.8, B.sh + 4.8, cx + 0.8, B.sh + 4.8, cx + 0.4, B.sh + 7.2, cx - 0.4, B.sh + 7.2]);
        break;
      }
      case 'lace': {
        const cord = L.lace || '#5a3424';
        p.poly(P.skin, [cx - 1.4, B.sh + 1.2, cx + 1.4, B.sh + 1.2, cx, B.sh + 6.2]);
        p.poly(cord, [cx - 1.6, B.sh + 2.4, cx - 0.6, B.sh + 2.4, cx + 1.6, B.sh + 4.8, cx + 0.6, B.sh + 4.8]);
        p.poly(cord, [cx + 1.6, B.sh + 2.4, cx + 0.6, B.sh + 2.4, cx - 1.6, B.sh + 4.8, cx - 0.6, B.sh + 4.8]);
        break;
      }
    }
    if (mantle) for (const s of [-1, 1]) p.poly(mantle, [cx + s * (B.shW + 1.5), B.sh - 0.5, cx + s * (B.shW - 3), B.sh - 1, cx + s * (B.shW - 2), B.sh + 8, cx + s * (B.shW + 3), B.sh + 9]);
    if (cape) for (let i = 0; i < 5; i++) { p.ell(cape, cx - B.shW + 0.5 + i * 1.1, B.sh + 0.5 - i * 0.3, 2, 1.8); p.ell(cape, cx + B.shW - 0.5 - i * 1.1, B.sh + 0.5 - i * 0.3, 2, 1.8); }
    figBodyAcc(p, P, L, B, neckTop);
  }

  function figBodyAcc(p, P, L, B, neckTop) {
    const cx = 24;
    if (L.coat === 'trashcan') {
      const can = P.top, dk = dark(can, 0.3), top = B.sh - 2.2, bot = B.hip + 7, hw = B.shW + 3, wr = B.wrist || B.waist + 1, hl = B.hand || 3.6;
      const sleeve = L.sleeve || '#27252b', hand = P.gloves || P.skin;
      for (const s of [-1, 1]) {
        const hx = cx + s * (hw - 0.6), ax = cx + s * (hw + 2.2);
        p.poly(s > 0 ? dark(sleeve, 0.2) : sleeve, [hx, B.sh + 2.4, hx + s * 2.4, B.sh + 2, ax + s * 0.8, wr, ax - s * 1.8, wr]);
        p.poly(hand, [ax - s * 1.8, wr, ax + s * 0.8, wr, ax + s * 0.6, wr + hl, ax - s * 1.4, wr + hl]);
        p.rect(P.trim, Math.min(ax - s * 1.8, ax + s * 0.8), wr - 1, 2.6, 0.8);
      }
      const body = [cx - hw, top + 1, cx + hw, top + 1, cx + hw - 1.2, bot, cx - hw + 1.2, bot];
      p.poly(can, body);
      p.clipPoly(body, () => {
        p.poly(dark(can, 0.18), [cx + hw - 4, top, cx + hw + 2, top, cx + hw + 2, bot + 1, cx + hw - 4, bot + 1]);
        p.poly(dark(can, 0.08), [cx - hw - 2, top, cx - hw + 3, top, cx - hw + 3, bot + 1, cx - hw - 2, bot + 1]);
        for (let x = cx - hw + 2.4; x < cx + hw - 1; x += 2.8) { p.rect(dk, x, top + 4, 0.7, bot - top - 7); p.rect(light(can, 0.3), x + 0.7, top + 4, 0.5, bot - top - 7); }
        p.rect(light(can, 0.45), cx - hw + 3.6, top + 4, 0.9, bot - top - 7);
        p.rect(dk, cx - hw, top + 3, hw * 2, 0.8); p.rect(dk, cx - hw, bot - 2.4, hw * 2, 0.8);
      });
      for (const s of [-1, 1]) p.ell('#1a1a20', cx + s * (hw - 0.9), B.sh + 3, 1, 2);
      p.ell(dark(can, 0.1), cx, top + 1, hw + 0.6, 1.8);
      p.ell(light(can, 0.25), cx, top + 0.6, hw, 1.2);
      p.ell('#1a1a20', cx, top + 0.6, hw - 1.4, 0.8);
      const nw = B.neck || 4;
      p.rect(L.collarCol || '#27252b', cx - nw / 2 - 0.6, top - 1, nw + 1.2, 1.8);
    }
    const tas = accOf(L, 'hairtassel');
    if (tas) for (const s of [-1, 1]) {
      const x = cx + s * (B.hiW - 0.2), y = B.hip + 5;
      p.poly(tas, [x - 1.2, y, x + 1.2, y - 0.4, x + 1.2, y + 0.8, x - 1.2, y + 1.2]);
      p.poly(tas, [x - 0.2, y + 0.8, x + 0.6, y + 0.8, x + 1, y + 3.6, x + 0.2, y + 3.6]);
      p.snap(L.bead || '#e8c050', x + 0.1, y + 3.4, 1.1, 1.1);
    }
    if (accOf(L, 'yoke')) for (const s of [-1, 1]) {
      const v = accOf(L, 'yoke'), x0 = cx + s * B.shW;
      p.poly(v, [cx + s * 2.6, B.sh - 0.4, x0 + s * 0.4, B.sh - 0.2, x0 - s * (B.armW + 0.4), B.sh + 4, cx + s * 3.6, B.sh + 3]);
    }
    if (accOf(L, 'lantern')) {
      const y = B.chest - 0.6;
      p.ell('#14141a', cx, y, 2.2, 2.2); p.ell('#f4f4f8', cx, y, 1.7, 1.7); p.rect('#14141a', cx - 0.7, y - 1.1, 1.4, 2.2);
    }
    if (accOf(L, 'hipblade')) for (const s of [-1, 1]) {
      const v = accOf(L, 'hipblade'), x = cx + s * (B.legW + 1.8);
      p.poly(dark(v, 0.3), [x - 1, B.hip, x + 1, B.hip, x + s * 1.6, B.hip + 9.4, x + s * 0.2, B.hip + 10]);
      p.poly(v, [x - 0.5, B.hip + 0.6, x + 0.5, B.hip + 0.6, x + s * 1.1, B.hip + 8.8, x + s * 0.5, B.hip + 9]);
      p.rect('#2a2630', x - 1.5, B.hip - 1.8, 3, 3);
      p.snap('#5ae8f8', x - 0.5, B.hip - 0.8, 1, 1);
    }
    if (accOf(L, 'heartchoker')) { const nw = B.neck || 4; p.rect(accOf(L, 'heartchoker'), cx - nw / 2 - 0.2, B.sh - 2.4, nw + 0.4, 1); p.snap('#ffd0e4', cx - 0.5, B.sh - 1.9, 1, 1); }
    if (accOf(L, 'magia')) { p.poly('#1e1c26', [cx - 3.4, B.chest - 0.6, cx, B.chest - 2, cx + 3.4, B.chest - 0.6, cx + 1, B.chest + 0.6, cx - 1, B.chest + 0.6]); p.rect(accOf(L, 'magia'), cx - 2.4, B.chest - 1.2, 4.8, 0.6); }
    let v;
    if ((v = accOf(L, 'studbelt'))) {
      p.rect(v, cx - B.waW - 1, B.waist - 1, (B.waW + 1) * 2, 1.8);
      p.rect(light(v, 0.2), cx - B.waW - 1, B.waist - 1, (B.waW + 1) * 2, 0.5);
      for (const s of [-1, 1]) { p.ell(dark(v, 0.3), cx + s * 3.6, B.waist - 0.1, 1.1, 1.1); p.ell(light(v, 0.35), cx + s * 3.6, B.waist - 0.3, 0.6, 0.6); }
    }
    if ((v = accOf(L, 'wingpad'))) {
      const x0 = cx - B.shW + 1, y = B.sh, s2 = mix(v, '#9a88b8', 0.4);
      for (const f of [[x0, y + 1.4, x0 - 5, y + 0.6, x0 - 9.4, y + 1.2, x0 - 5, y + 2.6, x0, y + 3.2], [x0, y + 0.2, x0 - 5.6, y - 1.8, x0 - 11, y - 2.4, x0 - 5.6, y + 0.6, x0, y + 2], [x0, y - 0.8, x0 - 5, y - 4, x0 - 10, y - 6.2, x0 - 5.4, y - 2.2, x0, y + 1]]) {
        p.poly(s2, f.map((q, i) => (i % 2 ? q + 0.6 : q)));
        p.poly(v, f);
      }
    }
    if ((v = accOf(L, 'platepad'))) {
      const x0 = cx + B.shW, s2 = mix(v, '#9a88b8', 0.42);
      p.ell(s2, x0 + 0.6, B.sh + 1.4, 3.8, 2.8, 0.3);
      p.ell(v, x0 + 0.4, B.sh + 1, 3.4, 2.4, 0.3);
      p.ell(s2, x0 + 1.2, B.sh + 4.2, 3.4, 2.4, 0.35);
      p.ell(v, x0 + 1, B.sh + 3.8, 3, 2, 0.35);
    }
    if ((v = accOf(L, 'ribbonbow'))) {
      for (const s of [-1, 1]) { p.poly(v, [cx, B.sh - 0.4, cx + s * 2.8, B.sh - 1.8, cx + s * 2.6, B.sh + 1]); p.poly(dark(v, 0.25), [cx, B.sh - 0.2, cx + s * 1.4, B.sh + 1.4, cx + s * 0.6, B.sh + 2.6]); }
      p.snap('#e8c040', cx - 0.5, B.sh + 2.4, 1, 1);
    }
    if ((v = accOf(L, 'witchcape'))) for (const s of [-1, 1]) {
      p.poly(s < 0 ? v : dark(v, 0.16), [cx + s * 3.2, neckTop + 1.6, cx + s * (B.shW + 1.6), B.sh - 0.6, cx + s * (B.shW + 2.4), B.sh + 2.6, cx + s * (B.shW - 0.2), B.sh + 1.6, cx + s * 4.6, B.sh + 0.8]);
      ribbon(p, L.capeTrim || P.trim, [cx + s * 4.6, B.sh + 0.8, cx + s * (B.shW - 0.2), B.sh + 1.6, cx + s * (B.shW + 2.4), B.sh + 2.6], s < 0 ? 1.1 : -1.1);
    }
    if ((v = accOf(L, 'lavatee'))) {
      const lava = L.lava || '#ff7a2a';
      p.poly(v, [cx - 3.6, B.sh + 0.8, cx + 1.2, B.sh + 0.4, cx + 2.8, B.sh + 3, cx + 0.6, B.chest + 1.6, cx - 2.2, B.chest + 2.8, cx - 3.8, B.chest]);
      p.snap(lava, cx - 2.4, B.sh + 2.2, 2.4, 0.5); p.snap(lava, cx - 0.4, B.sh + 2.6, 0.5, 2.2); p.snap(lava, cx - 1.8, B.chest + 0.6, 1.8, 0.5);
      p.poly(dark(v, 0.1), [cx + 1.6, B.chest + 3, cx + 4.2, B.chest + 1.4, cx + 4.4, B.chest + 2, cx + 1.8, B.chest + 3.6]);
    }
    if ((v = accOf(L, 'shinL'))) p.poly(v, [cx - B.legW - 0.2, B.knee - 1, cx + 0.2, B.knee - 1, cx - 0.2, B.ankle - 3, cx - B.legW + 1.4, B.ankle - 3]);
    if ((v = accOf(L, 'legR'))) {
      const lava = L.lava || '#ff7a2a', x = cx + 1;
      p.poly(v, [x - 0.2, B.hip + 5, x + B.legW + 0.2, B.hip + 5, x + B.legW - 0.4, B.ankle - 3, x + 0.4, B.ankle - 3]);
      p.snap(lava, x + 1.4, B.knee + 2, 0.5, 2.6); p.snap(lava, x + 1.4, B.knee + 4.4, 1.6, 0.5); p.snap(lava, x + 2.4, B.knee + 7, 0.5, 2);
      for (const y of [B.hip + 6, B.hip + 8.4]) p.rect('#141218', x - 0.2, y, B.legW + 0.4, 0.7);
    }
    if ((v = accOf(L, 'capelet'))) {
      const fur = L.capeletFur || '#f4f4f8';
      for (const s of [-1, 1]) {
        const hemIn = [cx + s * 3.6, B.chest + 1.4], hemOut = [cx + s * (B.shW + 4.2), B.chest + 2.2];
        const piece = [cx + s * 3.2, neckTop + 1.4, cx + s * (B.shW + 0.6), B.sh - 0.9, cx + s * (B.shW + 3.6), B.sh + 2.6, hemOut[0], hemOut[1], hemIn[0], hemIn[1]];
        p.poly(s < 0 ? v : dark(v, 0.18), piece);
        p.clipPoly(piece, () => { if (s < 0) p.poly(light(v, 0.2), [cx - B.shW - 2, B.sh + 1, cx - B.shW + 1, B.sh - 0.6, cx - 6, B.sh - 0.8, cx - B.shW - 0.6, B.sh + 2.6]); });
        for (let i = 0; i <= 4; i++) { const k = i / 4; p.ell(s < 0 ? fur : dark(fur, 0.08), hemIn[0] + (hemOut[0] - hemIn[0]) * k, hemIn[1] + (hemOut[1] - hemIn[1]) * k + 0.2, 1.5, 1.2); }
      }
    }
    if ((v = accOf(L, 'bigbelt'))) {
      const x0 = cx - B.waW - 1, x1 = cx + B.hiW + 1.2, y0 = B.waist - 0.8, y1 = B.hip - 1.6;
      p.poly(v, [x0, y0, x1, y1, x1, y1 + 2.2, x0, y0 + 2.2]);
      p.poly(light(v, 0.2), [x0, y0, x1, y1, x1, y1 + 0.6, x0, y0 + 0.6]);
      const t = 0.62, bx = x0 + (x1 - x0) * t, by = y0 + (y1 - y0) * t;
      p.poly('#c8ccd8', [bx - 1.9, by - 1, bx + 1.9, by - 0.5, bx + 1.9, by + 3.1, bx - 1.9, by + 2.6]);
      p.poly(v, [bx - 0.8, by + 0.2, bx + 0.8, by + 0.4, bx + 0.8, by + 1.9, bx - 0.8, by + 1.7]);
      p.poly('#f4f6fa', [bx - 1.9, by - 1, bx + 1.9, by - 0.5, bx + 1.9, by, bx - 1.9, by - 0.5]);
    }
    if (L.coat === 'hoodcape') {
      for (const s of [-1, 1]) {
        const ein = cx + s * (B.shW - 3.8), yin = B.sh + 9.6, yout = B.sh + 11.8;
        const edge = [cx + s * 4.4, neckTop - 0.4, cx + s * 3.2, B.sh - 0.6, cx + s * 1, B.sh + 1.4, ein, yin];
        const hem = [ein, yin, cx + s * (B.shW - 0.8), B.sh + 11.4, cx + s * (B.shW + 2.8), yout];
        const piece = edge.concat(hem.slice(2), [cx + s * (B.shW + 3), B.sh + 3, cx + s * (B.shW + 1), B.sh - 1.2, cx + s * 6.6, B.sh - 1.6, cx + s * 5.4, neckTop + 0.4]);
        p.poly(s < 0 ? P.top : mix(P.top, P.topSh, 0.45), piece);
        p.clipPoly(piece, () => {
          if (s < 0) p.poly(P.topHi, [cx - B.shW - 3, B.sh + 2.4, cx - B.shW - 0.4, B.sh - 1.2, cx - 6.4, B.sh - 1.6, cx - 6.6, B.sh - 0.4, cx - B.shW + 0.4, B.sh + 0.2, cx - B.shW - 1.8, B.sh + 3.4]);
          else p.poly(P.topSh, [cx + B.shW + 0.6, B.sh - 1, cx + B.shW + 4, B.sh - 1, cx + B.shW + 4, yout + 1, cx + B.shW + 0.8, yout + 1]);
          p.poly(P.topSh, [cx + s * (B.shW - 2.6), B.sh + 3, cx + s * (B.shW - 1.6), B.sh + 3, cx + s * (B.shW - 0.2), B.sh + 10.4, cx + s * (B.shW - 1.2), B.sh + 10.8]);
        });
        ribbon(p, P.trim, edge.concat(hem.slice(2)), s < 0 ? 1.1 : -1.1);
      }
      capeGems(p, cx, B.sh + 1.2, 1.15, L.gems);
    }
    if (L.coat === 'cape') for (const s of [-1, 1]) {
      const lin = L.lining || P.trim;
      p.poly(lin, [cx + s * (B.shW - 2.6), B.sh - 0.8, cx + s * (B.shW + 2.4), B.sh + 0.4, cx + s * (B.shW + 3), B.sh + 3.4, cx + s * (B.shW - 0.6), B.sh + 1.8]);
      p.poly(P.top, [cx + s * (B.shW - 2.6), B.sh - 0.8, cx + s * (B.shW + 2.4), B.sh + 0.4, cx + s * (B.shW + 2.6), B.sh + 1.2, cx + s * (B.shW - 2.4), B.sh]);
      if (s < 0) p.poly(P.top, [cx - 4.2, B.sh, cx - 2.8, neckTop + 0.6, cx - 1.8, neckTop + 1, cx - 3, B.sh + 0.4]);
    }
    if ((v = accOf(L, 'leotard')) && L.coat !== 'leo') { p.poly(v, [cx, B.sh + 2, cx + 2.4, B.chest + 1.5, cx + 1.3, B.waist - 0.4, cx - 1.3, B.waist - 0.4, cx - 2.4, B.chest + 1.5]); p.poly(dark(v, 0.15), [cx, B.sh + 2, cx + 2.4, B.chest + 1.5, cx + 1.3, B.waist - 0.4, cx, B.waist - 0.4]); }
    if ((v = accOf(L, 'neckscarf'))) { p.rect(v, cx - 2.6, neckTop + 0.8, 5.2, B.sh - neckTop); p.rect('#d8305a', cx - 2.6, neckTop + 1.8, 5.2, 0.6); p.poly(v, [cx + 1, B.sh, cx + 4, B.sh + 2.4, cx + 2.6, B.sh + 3.4]); }
    if ((v = accOf(L, 'petals'))) for (const s of [-1, 1]) {
      const pts = [cx + s * 1.4, B.waist + 0.4, cx + s * (B.waW + 1), B.waist + 0.4, cx + s * (B.hiW + 2), B.hip + 6, cx + s * (B.hiW + 0.6), B.knee - 2, cx + s * (B.hiW - 1.4), B.hip + 9, cx + s * 2.4, B.knee - 6];
      p.poly(v, pts);
      p.clipPoly(pts, () => { p.rect('#f2f0fa', cx - 20, B.waist, 40, 2.6); p.rect('#8ad8f0', cx - 20, B.waist + 2.6, 40, 2.6); p.rect(mix('#8ad8f0', v, 0.5), cx - 20, B.waist + 5.2, 40, 2); if (s > 0) p.poly(dark(v, 0.2), [cx + B.hiW - 1, B.waist, cx + 20, B.waist, cx + 20, B.knee, cx + B.hiW, B.knee]); });
    }
    if ((v = accOf(L, 'legstraps'))) {
      const o = x => cx - x, ty = B.hip + 7;
      for (let i = 0; i < 3; i++) p.poly(v, [o(B.legW + 0.4), ty + i * 2, o(-0.2), ty + i * 2 + 1.4, o(-0.2), ty + i * 2 + 2.2, o(B.legW + 0.4), ty + i * 2 + 0.8]);
      p.rect('#1e1c28', o(B.legW + 0.4), ty + 6.4, B.legW + 0.6, 1.2);
    }
    if ((v = accOf(L, 'shinx'))) { const x0 = cx + 1, w = B.legW; for (const d of [0, 2.4]) { p.poly(v, [x0, B.knee + 2 + d, x0 + 0.8, B.knee + 2 + d, x0 + w, B.knee + 6 + d, x0 + w - 0.8, B.knee + 6.4 + d]); p.poly(v, [x0 + w - 0.8, B.knee + 2 + d, x0 + w, B.knee + 2 + d, x0 + 0.8, B.knee + 6.4 + d, x0, B.knee + 6 + d]); } }
    if ((v = accOf(L, 'vestv'))) p.poly(v, [cx - 2.8, B.sh, cx + 2.8, B.sh, cx + 1, B.chest + 2.6, cx, B.chest + 4, cx - 1, B.chest + 2.6]);
    if ((v = accOf(L, 'frogknot'))) { for (const y of [B.sh + 2.6, B.sh + 4.6]) p.snap(v, cx - 0.5, y, 1, 1.2); p.snap('#d8402a', cx - 1.9, B.sh + 3.6, 1, 1); p.snap('#d8402a', cx + 0.9, B.sh + 3.6, 1, 1); }
    if ((v = accOf(L, 'buttons'))) for (const y of [B.chest + 3.6, B.chest + 6.4]) for (const dx of [-2.4, 2.4]) { p.snap(v, cx + dx - 0.5, y, 1, 1); }
    if ((v = accOf(L, 'skullprint'))) { p.snap(v, cx - 1.2, B.chest + 0.4, 2.4, 1.6); p.snap(v, cx - 0.8, B.chest + 2, 1.6, 1); }
    if ((v = accOf(L, 'neckpiece'))) p.snap(v, cx - 0.5, neckTop + 1.6, 1, 1.4);
    if ((v = accOf(L, 'chestplate'))) {
      p.poly(dark(v, 0.3), [cx - 3.6, B.sh + 1, cx, B.sh + 2.2, cx + 3.6, B.sh + 1, cx + 3.2, B.chest + 1.6, cx, B.chest + 4, cx - 3.2, B.chest + 1.6]);
      p.poly(v, [cx - 3.2, B.sh + 1.3, cx, B.sh + 2.5, cx + 3.2, B.sh + 1.3, cx + 2.8, B.chest + 1.4, cx, B.chest + 3.4, cx - 2.8, B.chest + 1.4]);
      p.poly(light(v, 0.4), [cx - 2.8, B.sh + 1.6, cx - 0.3, B.sh + 2.6, cx - 0.3, B.chest + 2.8, cx - 2.4, B.chest + 1.2]);
      for (const dx of [-2.4, -0.8, 0.8, 2.4]) p.poly('#62c4f4', [cx + dx - 0.6, B.sh + 1, cx + dx, B.sh - 2.2, cx + dx + 0.6, B.sh + 1]);
    }
    if ((v = accOf(L, 'furcollar'))) for (let i = 0; i < 5; i++) { p.ell(v, cx - B.shW + 0.5 + i * 1.1, B.sh + 0.5 - i * 0.3, 2, 1.8); p.ell(v, cx + B.shW - 0.5 - i * 1.1, B.sh + 0.5 - i * 0.3, 2, 1.8); }
    if ((v = accOf(L, 'goldclasp'))) for (const y of [B.chest + 3, B.chest + 5.4]) { p.ell(v, cx + 0.6, y, 1, 1); p.poly(v, [cx + 1.4, y, cx + 2.6, y + 0.6, cx + 2.4, y + 2, cx + 1.8, y + 1.2]); }
    if ((v = accOf(L, 'hemband'))) { p.rect(v, cx - B.hiW - 2, B.hip + 2.6, B.hiW * 2 + 4, 1.4); p.rect('#1e1e26', cx - B.waW - 1, B.waist - 0.8, B.waW * 2 + 2, 1.2); }
    if ((v = accOf(L, 'pelt'))) {
      const x = cx - B.shW - 1, y = (B.wrist || B.waist + 1) + 2;
      p.poly(dark(v, 0.15), [x - 1.6, y, x + 2.4, y, x + 2, B.knee - 4, x - 0.4, B.knee + 2, x - 2.4, B.knee - 2]);
      p.poly(v, [x - 1.2, y, x + 2, y, x + 1.4, B.knee - 4, x - 0.4, B.knee + 0.6, x - 1.8, B.knee - 3]);
      p.poly(dark(v, 0.35), [x - 0.4, B.knee - 3, x + 0.6, B.knee - 3, x - 0.4, B.knee + 2]);
    }
    if ((v = accOf(L, 'icegauntlet'))) {
      const x0 = cx - B.shW, wr = B.wrist || B.waist + 1, hl = B.hand || 3.6;
      p.poly(dark(v, 0.3), [x0 - 2, B.sh + 7, x0 + B.armW + 0.8, B.sh + 7, x0 + B.armW + 0.6, wr + hl + 0.6, x0 + 0.4, wr + hl + 1.4, x0 - 2.2, wr + hl]);
      p.poly(v, [x0 - 1.6, B.sh + 7.4, x0 + B.armW + 0.4, B.sh + 7.4, x0 + B.armW + 0.2, wr + hl, x0 - 1.8, wr + hl - 0.4]);
      for (const y of [B.sh + 10, wr - 1]) p.rect(dark(v, 0.35), x0 - 1.8, y, B.armW + 2.2, 0.6);
      p.poly('#62c4f4', [x0 - 2.6, B.sh + 9, x0 - 6, B.sh + 3, x0 - 1.4, B.sh + 7.4]); p.poly('#a8e4ff', [x0 - 2, wr - 4, x0 - 5.2, wr - 9, x0 - 1.4, wr - 6]);
    }
    if ((v = accOf(L, 'pauldron'))) {
      const x = cx - B.shW;
      for (let i = 0; i < 3; i++) { p.poly(dark(v, 0.25), [x - 3.6, B.sh + 1 + i * 2.4, x + 2.4, B.sh - 0.4 + i * 2.4, x + 2.8, B.sh + 1.8 + i * 2.4, x - 3.6, B.sh + 3 + i * 2.4]); p.poly(v, [x - 3.4, B.sh + 1 + i * 2.4, x + 2.2, B.sh - 0.2 + i * 2.4, x + 2.4, B.sh + 1.2 + i * 2.4, x - 3.4, B.sh + 2.4 + i * 2.4]); p.rect('#2d5bd3', x - 3.4, B.sh + 2.4 + i * 2.4, 5.4, 0.5); }
      p.poly('#62c4f4', [x - 1.2, B.sh - 0.2, x + 0.2, B.sh - 4.4, x + 1.4, B.sh - 0.2]);
      p.poly('#a8e4ff', [x + 1, B.sh - 0.2, x + 2.6, B.sh - 3, x + 2.8, B.sh + 0.2]);
      p.ell(dark(v, 0.3), x + 0.5, B.sh + 2, 3.7, 2.9);
      p.ell(v, x + 0.3, B.sh + 1.6, 3.3, 2.5);
      p.ell(light(v, 0.45), x - 0.6, B.sh + 0.9, 1.5, 0.9);
    }
    if ((v = accOf(L, 'turtle'))) { p.rect(v, cx - 2.6, neckTop + 1, 5.2, B.sh - neckTop + 1); p.poly(v, [cx - 2.6, B.sh, cx + 2.6, B.sh, cx, B.sh + 3]); }
    if (accOf(L, 'vesthem')) for (const s of [-1, 1]) p.poly(P.inner, [cx + s * 0.2, B.waist - 1, cx + s * (B.waW + 0.4), B.waist - 1, cx + s * (B.waW + 0.2), B.waist + 1.2, cx + s * 1.4, B.waist + 3.4]);
    if ((v = accOf(L, 'crossbelt'))) {
      p.poly(v, [cx - 4.4, B.sh + 0.2, cx - 2.6, B.sh + 0.2, cx + B.waW + 1.2, B.waist - 1.6, cx + B.waW + 0.2, B.waist]);
      p.poly(v, [cx - B.waW - 1, B.waist - 2, cx - B.waW - 1, B.waist - 0.8, cx + B.hiW + 1, B.hip - 1, cx + B.hiW + 1, B.hip - 2.4]);
      for (const [x, y] of [[cx - 1, B.sh + 3.2], [cx + 2, B.chest + 2]]) p.poly('#d0d4dc', [x - 1.2, y, x, y - 0.9, x + 1.2, y, x, y + 0.9]);
    }
    if ((v = accOf(L, 'holster'))) {
      const o = x => cx + 1 + (L.legGap || 0) + x;
      p.rect(v, o(-0.2), B.hip + 4, B.legW + 0.6, 2.4);
      p.rect(light(v, 0.15), o(B.legW - 1.2), B.hip + 2, 1.4, 6.4);
      p.poly('#b0283e', [o(-0.2), B.hip + 9.4, o(B.legW + 0.4), B.hip + 7.4, o(B.legW + 0.4), B.hip + 8.6, o(-0.2), B.hip + 10.6]);
      p.poly('#d0d4dc', [o(B.legW), B.hip + 6.4, o(B.legW + 1.6), B.hip + 8.4, o(B.legW + 0.6), B.hip + 10]);
    }
    if ((v = accOf(L, 'waistbelt'))) {
      const open = ['long', 'mid', 'jacket'].includes(L.coat), w = open ? 2.8 : B.waW + 0.8;
      p.rect(v, cx - w, B.waist - 0.9, w * 2, 1.4);
      p.snap('#d8b050', cx - 0.8, B.waist - 0.9, 1.6, 1.4);
    }
    if ((v = accOf(L, 'waistbow'))) {
      p.poly(v, [cx - 1.4, B.waist - 0.4, cx - 5, B.waist - 2.6, cx - 4.6, B.waist + 1.6]);
      p.poly(v, [cx - 1.4, B.waist - 0.4, cx + 2.2, B.waist - 2.6, cx + 1.8, B.waist + 1.6]);
      p.poly(dark(v, 0.2), [cx - 2, B.waist, cx - 0.8, B.waist, cx + 0.4, B.hip + 3, cx - 1.4, B.hip + 3]);
      p.ell(dark(v, 0.35), cx - 1.4, B.waist - 0.4, 1, 1);
    }
    if ((v = accOf(L, 'sashtail'))) {
      const sd = L.sashSide === 'r' ? 1 : -1, x = cx + sd * (B.waW + 1.4);
      const end = L.sashTo === 'knee' ? B.knee - 2 : B.ankle - 5;
      const w = L.sashTo === 'knee' ? 0.6 : 0.9;
      p.poly(v, [x - w, B.waist - 0.5, x + w, B.waist - 0.5, x + sd * 1.4 + 0.5, end, x + sd * 1.4 - 1.3, end + 1.6]);
      p.poly(dark(v, 0.3), [x + 0.2, B.waist - 0.5, x + 0.9, B.waist - 0.5, x + sd * 1.4 + 0.5, end, x + sd * 1.4 - 0.3, end + 0.6]);
    }
    if ((v = accOf(L, 'clasps'))) for (const s of [-1, 1]) {
      const x = cx + s * 2.9;
      p.ell(dark(v, 0.3), x, B.sh + 0.6, 1.5, 1.1);
      p.ell(v, x, B.sh + 0.3, 1.3, 0.9);
      p.rect('#e8b030', x - 0.45, B.sh + 1.3, 0.9, 3.6);
    }
    if ((v = accOf(L, 'furtuft'))) {
      const x = cx - B.shW;
      p.ell(v, x + 0.4, B.sh + 0.8, 2.6, 1.8, -0.4);
      p.ell(v, x - 1.6, B.sh + 2.4, 2.2, 1.5, -0.2);
      p.ell(v, x + 0.6, B.sh + 3, 1.9, 1.4, 0.3);
      p.poly(v, [x - 3.4, B.sh + 1, x - 1.4, B.sh + 0.6, x - 2.4, B.sh + 2.2]);
      p.ell(dark(v, 0.14), x - 0.4, B.sh + 3.6, 1.6, 0.8);
    }
    if (accOf(L, 'gourd')) {
      const x = cx + B.waW + 1.6, y = B.waist + 0.6;
      p.ell('#5a3620', x, y, 1.4, 1.3);
      p.ell('#6a4024', x + 0.4, y + 3.2, 2.5, 2.5);
      p.ell('#9a6438', x - 0.3, y + 2.4, 1, 0.9);
      p.rect('#c8283a', x - 1.3, y + 0.9, 2.6, 0.8);
      p.rect('#3a6ad0', x + 1.6, y + 1.2, 0.8, 2.6);
    }
    if ((v = accOf(L, 'flute'))) {
      const x1 = cx - B.waW - 0.4, y1 = B.waist - 4, x2 = cx - B.waW - 2.6, y2 = B.hip + 8;
      p.poly(v, [x1 - 0.5, y1, x1 + 0.5, y1, x2 + 0.5, y2, x2 - 0.5, y2]);
      p.poly(light(v, 0.4), [x1 - 0.5, y1, x1, y1, x2, y2, x2 - 0.5, y2]);
      p.ell('#e88ab4', cx - B.waW - 1.4, B.hip + 1.4, 1.1, 1.8);
      p.ell('#f6d2e2', cx - B.waW - 1.6, B.hip + 0.8, 0.5, 0.7);
    }
    if ((v = accOf(L, 'sidecape'))) {
      p.poly(v, [cx + B.shW - 4.2, B.sh - 0.6, cx + B.shW + 1.4, B.sh, cx + B.shW + 2.2, B.sh + 4.4, cx + B.shW - 2.6, B.sh + 2.6]);
      p.poly(light(v, 0.25), [cx + B.shW - 3.6, B.sh - 0.4, cx + B.shW + 0.4, B.sh, cx + B.shW - 0.6, B.sh + 1.2]);
      p.poly('#c83040', [cx + 3.4, B.sh + 0.2, cx + 4.4, B.sh - 0.2, cx + B.shW + 1.4, B.chest + 3.2, cx + B.shW + 0.4, B.chest + 3.6]);
    }
    if (accOf(L, 'brooch')) {
      p.snap('#e2e6ee', cx + 3, B.chest - 1.6, 2.4, 1.2);
      for (const x of [cx + 3, cx + 4.8]) p.snap('#c4c8d2', x, B.chest, 0.8, 0.8);
    }
    if ((v = accOf(L, 'laceband'))) {
      const y1 = B.chest + 1.2, pts = [cx - B.shW + 1, B.sh + 0.6, cx + B.shW - 1, B.sh + 0.6, cx + B.waW + 1.2, y1, cx - B.waW - 1.2, y1];
      p.poly(v, pts);
      p.clipPoly(pts, () => p.poly(dark(v, 0.1), [cx + 2.4, B.sh, cx + 12, B.sh, cx + 12, y1 + 2, cx + 3, y1 + 2]));
      for (let x = cx - B.waW - 0.6; x <= cx + B.waW + 0.8; x += 1.6) p.ell(v, x, y1 + 0.2, 0.9, 0.7);
      p.snap(dark(v, 0.25), cx - 0.4, B.sh + 2.4, 0.8, 1.6);
    }
    if ((v = accOf(L, 'puff'))) for (const s of [-1, 1]) {
      const x0 = cx + s * B.shW;
      p.ell(dark(v, 0.12), x0 - s * 0.6, B.sh + 2.6, 2.9, 3.3);
      p.ell(v, x0 - s * 0.9, B.sh + 2.2, 2.3, 2.6);
      p.rect(P.top, x0 - s * 0.9 - 1.2, B.sh + 5.2, 2.4, 0.9);
    }
    if (accOf(L, 'pearls')) [[-2.6, 0.8], [-1.3, 1.8], [0, 2.3], [1.3, 1.8], [2.6, 0.8]].forEach(([dx, dy]) => p.snap('#fbf8f2', cx + dx - 0.4, B.sh + dy, 0.8, 0.8));
    if ((v = accOf(L, 'mandarin'))) { p.rect(v, cx - 2.4, neckTop + 1, 4.8, B.sh - neckTop + 0.2); p.snap('#c8324a', cx - 0.5, B.sh - 0.6, 1, 1); }
    if ((v = accOf(L, 'obi'))) {
      p.poly(v, [cx - B.waW - 0.8, B.chest + 2.6, cx + B.waW + 0.8, B.chest + 2.6, cx + B.waW + 1, B.waist + 1.6, cx - B.waW - 1, B.waist + 1.6]);
      p.poly(light(v, 0.12), [cx - B.waW - 0.6, B.chest + 3.2, cx - 1, B.chest + 3.2, cx - 1.2, B.waist + 1, cx - B.waW - 0.8, B.waist + 1]);
      p.poly('#c8ccd8', [cx - 1.6, B.waist - 1.6, cx + 1.6, B.waist - 1.6, cx + 1.2, B.waist + 0.8, cx - 1.2, B.waist + 0.8]); p.snap('#8a8e9a', cx - 0.4, B.waist - 1, 0.8, 1.2);
      for (const y of [B.chest + 3.6, B.waist - 2.6]) p.rect('#8a8e9a', cx - B.waW - 0.6, y, (B.waW + 0.6) * 2, 0.5);
    }
    if ((v = accOf(L, 'haoritri'))) for (const s of [-1, 1]) { const x0 = cx + s * B.shW, wr = B.wrist || B.waist + 1; for (let i = 0; i < 2; i++) p.poly(v, [x0 - s * (B.armW - 0.4) + s * i * 1.8, wr - 1.4, x0 - s * (B.armW - 1.3) + s * i * 1.8, wr - 3, x0 - s * (B.armW - 2.2) + s * i * 1.8, wr - 1.4]); }
    if ((v = accOf(L, 'redcuff'))) { const x0 = cx + B.shW, wr = B.wrist || B.waist + 1; p.rect(v, x0 - B.armW + 0.4, wr + 2.2, B.armW + 1, 1); }
    if ((v = accOf(L, 'xcollar'))) { p.poly(v, [cx - 1.6, B.sh - 1.6, cx - 0.8, B.sh - 1.6, cx + 0.2, B.sh, cx - 0.4, B.sh + 0.4]); p.poly(v, [cx + 1.6, B.sh - 1.6, cx + 0.8, B.sh - 1.6, cx - 0.2, B.sh, cx + 0.4, B.sh + 0.4]); }
    if ((v = accOf(L, 'iceemblem'))) { p.poly(v, [cx, B.chest - 1, cx + 1, B.chest + 2, cx, B.waist, cx - 1, B.chest + 2]); for (const sd of [-1, 1]) p.poly(v, [cx, B.chest + 1.4, cx + sd * 3, B.chest + 0.6, cx + sd * 3.4, B.chest + 1.6, cx + sd * 1.2, B.chest + 2.4]); }
    if ((v = accOf(L, 'icebrooch'))) { const x = cx + 3.6, y = B.sh + 3; p.poly('#62c4f4', [x, y, x + 1, y - 4, x + 1.6, y]); p.poly('#62c4f4', [x + 1.2, y, x + 2.8, y - 3.4, x + 2.8, y]); p.ell(v, x, y + 0.6, 1.4, 1.2); p.poly('#3a6ad8', [x - 0.4, y + 1.4, x + 2, y + 1.6, x + 1.6, y + 3.6]); }
    if (accOf(L, 'medals')) { const x = cx - B.shW + 0.4; for (let i = 0; i < 3; i++) { p.rect('#c8303a', x + i * 1.1, B.sh + 1 + i * 0.3, 0.8, 2); p.snap(i === 1 ? '#c8ccd4' : '#d8b050', x + i * 1.1, B.sh + 3 + i * 0.3, 0.8, 0.8); } }
    if ((v = accOf(L, 'apronw'))) {
      const pts = [cx - B.waW - 0.4, B.waist - 0.6, cx + B.waW + 0.4, B.waist - 0.6, cx + 3.4, B.hip + 3, cx + 2.2, B.knee - 3, cx - 1.6, B.knee - 0.6, cx - 3.6, B.hip + 6, cx - B.waW - 1, B.hip];
      p.poly(v, pts);
      p.clipPoly(pts, () => { p.rect(mix(v, '#8ac8f0', 0.45), cx - 10, B.knee - 7, 20, 10); p.poly(dark(v, 0.14), [cx + 0.6, B.waist, cx + 3.6, B.waist, cx + 3.4, B.knee, cx + 1.4, B.knee]); });
      p.snap('#d8b050', cx - 2.6, B.waist + 0.6, 1.6, 1);
    }
    if ((v = accOf(L, 'chestharness'))) { p.rect(v, cx - B.shW + 1.6, B.sh + 2.6, (B.shW - 1.6) * 2, 0.9); for (const sd of [-1, 1]) p.rect(v, cx + sd * 3.4 - 0.4, B.sh - 0.4, 0.8, 3.2); }
    if ((v = accOf(L, 'corsetHi'))) {
      const pts = [cx - B.waW - 0.8, B.chest + 3, cx + B.waW + 0.8, B.chest + 3, cx + B.waW + 1, B.waist, cx + B.hiW + 1, B.hip + 1, cx - B.hiW - 1, B.hip + 1, cx - B.waW - 1, B.waist];
      p.poly(v, pts);
      p.clipPoly(pts, () => { p.poly(light(v, 0.12), [cx - 4, B.chest + 4, cx - 1, B.chest + 4.4, cx - 2.4, B.waist - 0.6, cx - 4.6, B.waist]); p.poly(dark(v, 0.3), [cx + 2, B.chest + 3, cx + B.waW + 2, B.chest + 3, cx + B.hiW + 2, B.hip + 2, cx + 3, B.hip + 2]); });
      for (const [dx, dy] of [[-3.6, 3.2], [-0.6, 3], [2.6, 3.2], [-2.4, 5.4]]) p.poly(L.trim, [cx + dx - 0.7, B.chest + dy, cx + dx + 0.7, B.chest + dy, cx + dx, B.chest + dy + 1.6]);
      for (const y of [B.waist + 0.6, B.waist + 2.4]) for (const dx of [-0.9, 0.9]) p.snap('#c8ccd4', cx + dx - 0.4, y, 0.8, 0.8);
    }
    if ((v = accOf(L, 'jabot'))) { p.poly(v, [cx + 1.4, B.chest + 3.4, cx + 3, B.chest + 3.4, cx + 3.6, B.waist + 2, cx + 2.2, B.waist + 3.4, cx + 1.6, B.waist]); p.poly(dark(v, 0.25), [cx + 2.2, B.chest + 5, cx + 3.2, B.chest + 5.4, cx + 2.6, B.waist + 2.6]); }
    if ((v = accOf(L, 'thighcross'))) for (const s of [-1, 1]) { const o = x => (s < 0 ? cx - x : cx + 1 + x); for (const [a, b] of [[0, B.legW], [B.legW, 0]]) p.poly(v, [o(a), B.hip + 2, o(a) + 0.8, B.hip + 2, o(b) + 0.8, B.hip + 8, o(b), B.hip + 8]); }
    if ((v = accOf(L, 'sheer'))) { p.poly(mix(v, P.skin, 0.3), [cx - 1.6, B.chest + 2, cx + 1.6, B.chest + 2, cx + B.waW - 0.6, B.waist + 1, cx, B.hip + 1, cx - B.waW + 0.6, B.waist + 1]); p.rect('#dcb75c', cx - 1.4, B.chest + 2.6, 2.8, 0.8); }
    if ((v = accOf(L, 'frontpanel'))) {
      const pts = [cx - 2.8, B.waist + 1, cx + 2.4, B.waist + 1, cx + 3, B.hip + 4, cx + 1.4, B.knee + 4, cx - 1.6, B.knee + 10, cx - 2.6, B.hip + 6];
      p.poly(v, pts);
      p.clipPoly(pts, () => { p.poly('#3a8a98', [cx - 4, B.knee - 2, cx + 4, B.knee - 6, cx + 4, B.knee + 12, cx - 4, B.knee + 12]); for (let y = B.hip + 2; y < B.knee + 4; y += 2.4) p.rect(L.trim, cx + 0.6 + (y - B.hip) * 0.03, y, 1.6, 0.5); p.poly(L.trim, [cx + 2.2, B.waist + 2, cx + 2.8, B.waist + 2, cx + 1.8, B.knee + 6, cx + 1.2, B.knee + 6]); });
    }
    if ((v = accOf(L, 'plumbranch'))) {
      const pts = [cx + 1.6, B.waist + 2, cx + 0.4, B.hip + 3, cx - 1, B.hip + 8, cx - 0.6, B.knee + 2, cx - 1.6, B.knee + 8];
      for (let i = 0; i < pts.length - 2; i += 2) p.poly(dark(v, 0.35), [pts[i] - 0.3, pts[i + 1], pts[i] + 0.3, pts[i + 1], pts[i + 2] + 0.3, pts[i + 3], pts[i + 2] - 0.3, pts[i + 3]]);
      for (const [x, y, r] of [[cx + 1.2, B.waist + 3.6, 1.1], [cx - 0.6, B.hip + 5, 1.3], [cx + 0.8, B.hip + 9, 1], [cx - 1.2, B.knee + 0.6, 1.3], [cx - 0.4, B.knee + 5.6, 1]]) { p.ell(v, x, y, r, r); p.snap(L.plumCore || '#e8b0b8', x - 0.4, y - 0.4, 0.8, 0.8); }
    }
    if ((v = accOf(L, 'charmpanel'))) {
      const bot = B.ankle - 5, pts = [cx - 3, B.waist + 1, cx + 4, B.waist + 1, cx + 4, bot - 3, cx + 0.5, bot, cx - 3, bot - 3];
      p.poly(v, pts);
      p.clipPoly(pts, () => {
        p.rect('#8a1426', cx - 3, B.waist, 0.8, bot - B.waist);
        p.rect('#8a1426', cx + 3.2, B.waist, 0.8, bot - B.waist);
        for (const [y, h] of [[B.hip + 1, 2.6], [B.hip + 6.4, 3.4], [B.knee + 3, 2.8]]) {
          p.poly(L.trim, [cx + 0.5, y - h - 0.7, cx + 3, y, cx + 0.5, y + h + 0.7, cx - 2, y]);
          p.poly('#a01c30', [cx + 0.5, y - h, cx + 2.2, y, cx + 0.5, y + h, cx - 1.2, y]);
        }
      });
    }
    if ((v = accOf(L, 'cloudbust'))) {
      for (const sd of [-1, 1]) p.poly('#1c1a20', [cx + sd * 1.4 - 0.3, neckTop + 1.6, cx + sd * 1.4 + 0.3, neckTop + 1.6, cx + sd * 3 + 0.4, B.sh + 2.2, cx + sd * 3 - 0.4, B.sh + 2.2]);
      for (const sd of [-1, 1]) p.poly('#2a7a74', [cx + sd * (B.shW - 2), B.sh + 2, cx + sd * 1.4, B.sh + 2.8, cx + sd * 1.4, B.sh + 3.6, cx + sd * (B.shW - 2.2), B.sh + 3]);
      p.poly(v, [cx - 1.6, B.sh + 2.6, cx + 0.5, B.sh + 3.4, cx + 2.6, B.sh + 2.6, cx + 1.8, B.chest + 1.6, cx + 0.5, B.chest + 2.6, cx - 0.8, B.chest + 1.6]);
      p.poly(v, [cx - 0.4, B.waist - 1.6, cx + 0.5, B.waist - 3, cx + 1.4, B.waist - 1.6, cx + 0.5, B.waist - 0.2]);
    }
    if ((v = accOf(L, 'petalcuff'))) for (const s of [-1, 1]) {
      const x0 = cx + s * B.shW, xa = x0 - s * 2.6, xb = x0 + s * 1;
      p.poly(P.top, [xa, B.sh + 0.6, x0 - s * 0.4, B.sh - 0.4, xb, B.sh + 1.4, xb, B.sh + 3.6, xa, B.sh + 3.6]);
      p.poly('#2a7a74', [xa, B.sh + 0.6, x0 - s * 0.4, B.sh - 0.4, xb, B.sh + 1.4, xb, B.sh + 2.2, x0 - s * 0.4, B.sh + 0.6, xa, B.sh + 1.4]);
      p.snap(v, x0 - s * 0.8 - 0.5, B.sh + 2.2, 1, 1);
      for (let i = 0; i < 3; i++) { const a = xa + (xb - xa) * i / 3, b = xa + (xb - xa) * (i + 1) / 3; p.poly(i === 1 ? '#f2eef0' : '#dcd8de', [a, B.sh + 3.6, b, B.sh + 3.6, (a + b) / 2 + s * 0.6, B.sh + 7]); }
    }
    if ((v = accOf(L, 'ropecoil'))) {
      const x0 = cx - B.shW + 1.6, y = B.sh + 7.4, w = B.armW + 0.4;
      p.rect(v, x0 - w, y, w, 0.8);
      p.rect(dark(v, 0.18), x0 - w, y + 1.4, w, 0.8);
      p.snap(v, x0 - w - 0.8, y + 0.4, 1, 1);
      p.snap(v, x0 - w - 1.2, y + 1.4, 1, 1);
      p.rect(dark(v, 0.2), x0 - w - 0.6, y + 2.2, 0.8, 2.6);
      p.poly(v, [x0 - w - 1.2, y + 4.6, x0 - w + 0.4, y + 4.6, x0 - w + 0.6, y + 6.8, x0 - w - 1.4, y + 6.8]);
    }
    if ((v = accOf(L, 'hipbow'))) {
      const x = cx + B.waW + 0.6, y = B.waist + 0.8;
      p.ell('#f0c040', x + 1.2, B.hip + 3.4, 2.4, 2.6);
      p.ell(dark('#d8a030', 0.15), x + 1.8, B.hip + 3.8, 1.6, 2);
      p.ell(light('#f0c040', 0.4), x + 0.4, B.hip + 2.4, 0.7, 0.9);
      for (const [dx, ex] of [[-0.6, -1.6], [0.6, 2.6]]) p.poly(dark(v, 0.15), [x + dx, y + 1, x + ex, y + 6, x + ex + 0.9, y + 6.4, x + dx + 0.6, y + 1]);
      p.poly(v, [x, y, x - 2.6, y - 1.6, x - 2.8, y + 1.6]);
      p.poly(v, [x, y, x + 2.6, y - 1.6, x + 2.8, y + 1.6]);
      p.snap(dark(v, 0.35), x - 0.5, y - 0.5, 1, 1.2);
      p.snap('#d8b050', x - 2.2, y - 0.4, 0.8, 0.8);
    }
    if ((v = accOf(L, 'thighswirl'))) {
      const x = cx - B.legW * 0.5 - 0.4, y = B.hip + (L.skirtLen || 10) + 2.4;
      p.rect('#1c1a20', cx - B.legW - 0.2, y + 2, B.legW + 0.2, 0.8);
      p.poly(v, [x - 2, y, x - 1.2, y, x - 0.4, y + 2.6, x + 0.4, y + 0.4, x + 1.2, y + 0.4, x + 0.2, y + 3.6, x - 0.8, y + 3.6]);
      p.snap(v, x + 1.2, y - 0.4, 1, 1);
    }
    if ((v = accOf(L, 'anklegold'))) for (const s of [-1, 1]) {
      const o = x => (s < 0 ? cx - x : cx + 1 + x), lw = B.legW;
      p.poly(v, [o(-0.4), B.ankle - 6.8, o(lw + 0.2), B.ankle - 6.8, o(lw + 0.1), B.ankle - 6, o(-0.3), B.ankle - 6]);
      p.poly(v, [o(lw * 0.5 - 1.4), B.ankle - 5.6, o(lw * 0.5 - 0.6), B.ankle - 5.6, o(lw * 0.5), B.ankle - 3.4, o(lw * 0.5 + 0.6), B.ankle - 5.6, o(lw * 0.5 + 1.4), B.ankle - 5.6, o(lw * 0.5 + 0.4), B.ankle - 2.4, o(lw * 0.5 - 0.4), B.ankle - 2.4]);
    }
    if ((v = accOf(L, 'starorb'))) {
      const gold = '#d8b048';
      p.poly(v, [cx - 2.6, B.waist - 1, cx + 2.6, B.waist - 1, cx + 2.2, B.hip + 5, cx, B.hip + 6.4, cx - 2.2, B.hip + 5]);
      p.rect(gold, cx - 1.6, B.hip + 1.6, 3.2, 1.6);
      p.ell(gold, cx, B.chest - 0.6, 2.4, 2.4);
      p.ell('#7a3ae0', cx, B.chest - 0.6, 1.6, 1.6);
      p.snap('#f6eef6', cx - 0.5, B.chest + 1.8, 1, 3.4);
      p.snap(gold, cx - 0.5, B.sh - 0.8, 1, 1);
    }
    if ((v = accOf(L, 'hhcharm'))) {
      p.poly(v, [cx - 2.4, B.sh + 1, cx + 2.4, B.sh + 1, cx + 2.6, B.waist + 1, cx - 2.6, B.waist + 1]);
      p.poly('#8a5a3a', [cx - B.shW + 1, B.sh + 0.4, cx - B.shW + 2, B.sh, cx + B.waW + 1.4, B.hip, cx + B.waW + 0.4, B.hip + 0.6]);
      p.snap('#2aa8b0', cx - 1, B.chest - 1, 2, 2);
      p.snap('#c8302a', cx - 0.5, B.sh - 0.6, 1, 1);
      p.snap('#c8302a', cx - 0.5, B.chest + 1, 1, 3);
      p.ell(dark('#d8b048', 0.3), cx + B.waW + 1.2, B.hip + 2, 2.2, 2.2);
      p.ell('#d8b048', cx + B.waW + 1.2, B.hip + 1.8, 1.8, 1.8);
    }
    if ((v = accOf(L, 'lunarbodice'))) {
      const S = '#c8ccd8';
      p.poly('#14141c', [cx - 1.6, B.chest + 1, cx + 1.6, B.chest + 1, cx + 2.2, B.hip + 6, cx, B.hip + 8, cx - 2.2, B.hip + 6]);
      p.ell(dark(S, 0.3), cx, B.waist - 1.4, 2.6, 2.6);
      p.ell(S, cx, B.waist - 1.6, 2.2, 2.2);
      p.ell(light(S, 0.3), cx - 0.6, B.waist - 2.2, 0.8, 0.8);
      p.poly('#3ab0f0', [cx - 0.5, B.waist + 0.8, cx + 0.5, B.waist + 0.8, cx, B.hip + 3]);
      p.poly('#d8b048', [cx - 1.4, B.hip + 3.6, cx + 0.4, B.hip + 2.8, cx - 0.4, B.hip + 6, cx - 1.6, B.hip + 5.4]);
      p.snap(S, cx - 0.5, B.sh - 1.2, 1, 1);
      p.snap('#c8303a', cx + B.waW - 0.4, B.waist, 1.2, 1);
      p.snap('#c8303a', cx + B.waW - 0.2, B.waist + 1, 0.8, 3.2);
    }
    if ((v = accOf(L, 'jyarmor'))) {
      const gold = '#d8b048', W = L.inner || '#ecebe6';
      for (const s of [-1, 1]) {
        const pts = [cx + s * 5, B.waist + 0.6, cx + s * (B.hiW + 1.4), B.waist + 0.6, cx + s * (B.hiW + 3.4), B.knee + 9, cx + s * 4.6, B.knee + 9];
        p.poly(W, pts);
        p.poly(dark(W, 0.14), [cx + s * (B.hiW + 0.4), B.waist + 0.6, cx + s * (B.hiW + 1.4), B.waist + 0.6, cx + s * (B.hiW + 3.4), B.knee + 9, cx + s * (B.hiW + 2.2), B.knee + 9]);
        p.rect(dark(W, 0.25), Math.min(cx + s * 2.6, cx + s * (B.hiW + 2.6)), B.knee + 5, Math.abs(B.hiW), 0.7);
      }
      p.poly(v, [cx - 4.6, B.sh + 0.2, cx + 4.6, B.sh + 0.2, cx + 5.2, B.waist - 2.4, cx - 5.2, B.waist - 2.4]);
      p.poly(dark(v, 0.35), [cx, B.sh + 1.4, cx + 2.6, B.sh + 3, cx + 2, B.chest + 2, cx, B.chest + 3.4, cx - 2, B.chest + 2, cx - 2.6, B.sh + 3]);
      p.poly(light(v, 0.3), [cx - 1.4, B.sh + 2.2, cx + 1.4, B.sh + 2.2, cx, B.sh + 4.4]);
      p.rect('#2a2420', cx - B.waW - 0.6, B.waist - 2.6, B.waW * 2 + 1.2, 2.4);
      p.rect(gold, cx - 3, B.waist - 3, 6, 3);
      p.rect(dark(gold, 0.35), cx - 2, B.waist - 2, 4, 1);
      p.rect('#5a3a28', cx - B.waW, B.waist - 0.2, B.waW * 2, 1);
      p.snap('#2a8a9a', cx - 0.5, B.sh - 0.4, 1, 1.6);
      p.rect('#2a8a9a', cx + B.hiW + 0.4, B.waist + 1, 1.8, 6.4);
      p.rect('#d8b048', cx + B.hiW + 0.4, B.waist + 0.4, 1.8, 0.8);
      p.rect('#d8b048', cx + B.hiW + 0.4, B.waist + 7.2, 1.8, 0.8);
    }
    if ((v = accOf(L, 'lionpad'))) {
      const x = cx - B.shW - 0.4, y = B.sh + 1.2, d = dark(v, 0.45);
      p.ell(d, x, y, 3.4, 3.2);
      p.ell(v, x, y, 2.7, 2.5);
      p.snap(d, x - 1.2, y - 0.6, 0.9, 0.8); p.snap(d, x + 0.3, y - 0.6, 0.9, 0.8);
      p.snap(light(v, 0.35), x - 0.5, y + 0.5, 1, 0.8);
    }
    if ((v = accOf(L, 'ipcfront'))) {
      const W = '#f2f0f4', gold = '#d8b048', w = B.shW;
      p.poly(W, [cx - 2.4, B.sh - 0.6, cx + 2.4, B.sh - 0.6, cx + 2.8, B.chest + 2.4, cx - 2.8, B.chest + 2.4]);
      p.poly('#c8c6d4', [cx + 1, B.sh - 0.6, cx + 2.4, B.sh - 0.6, cx + 2.8, B.chest + 2.4, cx + 1.2, B.chest + 2.4]);
      p.poly(W, [cx - 2.4, neckTop + 0.2, cx + 2.4, neckTop + 0.2, cx + 2.8, neckTop + 2.4, cx - 2.8, neckTop + 2.4]);
      p.rect('#1c1a22', cx - 1.8, neckTop + 0.6, 3.6, 0.9);
      p.snap(P.skin, cx - 0.5, B.sh + 1, 1, 1.6);
      p.poly(v, [cx - w + 0.4, B.sh, cx - 2.2, B.sh - 0.4, cx - 2.6, B.waist - 1.4, cx - B.waW + 0.2, B.waist - 1.4]);
      p.poly(dark(v, 0.3), [cx - w + 1.4, B.sh + 2.6, cx - 3, B.sh + 2, cx - 3.2, B.sh + 3.6, cx - w + 1.6, B.sh + 4.2]);
      p.poly(gold, [cx - 2.6, B.sh - 0.4, cx - 2.1, B.sh - 0.4, cx - 2.3, B.waist - 1.4, cx - 2.8, B.waist - 1.4]);
      p.poly(v, [cx + w - 2.6, B.sh - 0.6, cx + w + 1.2, B.sh - 0.2, cx + w + 1, B.sh + 2, cx + w - 2.8, B.sh + 1.4]);
      p.snap(W, cx + 2.4, B.chest + 0.6, 1.4, 4.4);
      p.snap(gold, cx + 2.2, B.chest - 0.6, 1.8, 1.8);
    }
    if ((v = accOf(L, 'lcdrape'))) {
      const gold = '#d8b048', blk = '#26262c';
      for (const s of [-1, 1]) { p.poly(blk, [cx + s * 2.4, B.sh - 0.8, cx + s * (B.shW + 0.6), B.sh + 0.4, cx + s * (B.shW + 0.4), B.sh + 1.8, cx + s * 2.6, B.sh + 0.6]); p.snap('#c8ccd4', cx + s * (B.shW - 2.4) - 0.4, B.sh, 0.8, 0.8); }
      p.poly(dark(v, 0.3), [cx - 4.4, B.sh + 1.6, cx - 2.2, B.sh + 0.8, cx + B.waW + 0.8, B.waist - 1.4, cx + B.waW - 1.4, B.waist + 0.8]);
      p.poly(v, [cx - 4.2, B.sh + 1.2, cx - 2.6, B.sh + 0.4, cx + B.waW + 0.2, B.waist - 1.8, cx + B.waW - 1.4, B.waist - 0.2]);
      p.poly(v, [cx + B.waW - 1.4, B.waist - 1, cx + B.waW + 0.8, B.waist - 1.6, cx + B.hiW + 2.2, B.hip + 10, cx + B.hiW + 0.6, B.hip + 10.6]);
      p.poly(v, [cx + B.shW - B.armW - 0.2, B.sh + 5.4, cx + B.shW + 1.6, B.sh + 5, cx + B.shW + 1.6, B.sh + 7, cx + B.shW - B.armW - 0.1, B.sh + 7.4]);
      p.poly(dark(v, 0.3), [cx + B.shW - B.armW - 0.1, B.sh + 6.8, cx + B.shW + 1.6, B.sh + 6.4, cx + B.shW + 1.6, B.sh + 7, cx + B.shW - B.armW - 0.1, B.sh + 7.4]);
      p.ell(dark(gold, 0.3), cx - 4.4, B.sh + 1.2, 2.2, 2);
      p.ell(gold, cx - 4.4, B.sh + 1, 1.7, 1.6);
      p.snap('#2aa8a8', cx - 4.8, B.sh + 1.4, 0.8, 0.8);
    }
    if ((v = accOf(L, 'lctassels'))) {
      p.rect('#26262c', cx - B.waW - 0.4, B.waist - 0.4, B.waW * 2 + 0.8, 1.4);
      for (const s of [-1, 1]) {
        const x = cx + s * (B.waW - 1.2);
        p.rect(v, x - 0.9, B.waist - 0.8, 1.8, 2.2);
        p.rect(v, x - 0.25, B.waist + 1.4, 0.5, 4);
        p.ell(dark(v, 0.3), x, B.waist + 7, 1.5, 2.2);
        p.ell(v, x, B.waist + 6.8, 1.1, 1.8);
        p.rect(v, x - 0.25, B.waist + 9, 0.5, 5);
        p.poly(v, [x - 0.5, B.waist + 13.6, x + 0.5, B.waist + 13.6, x + 1, B.waist + 21, x - 1, B.waist + 21]);
        p.rect(dark(v, 0.3), x - 1, B.waist + 20.4, 2, 0.6);
      }
    }
    if ((v = accOf(L, 'ilfront'))) {
      const gold = '#d8b048', d = dark(v, 0.35), x1 = cx + B.shW;
      p.poly(P.skin, [x1 - 3.4, B.sh - 0.6, x1 + 0.8, B.sh + 0.2, x1 + 1.6, B.sh + 3.6, x1 - B.armW + 0.2, B.sh + 4.2, x1 - 4.6, B.sh + 1.6]);
      p.poly(v, [x1 - B.armW - 0.4, B.sh + 3.8, x1 + 1.8, B.sh + 3.2, x1 + 2.4, B.sh + 7.6, x1 - B.armW - 0.2, B.sh + 8.2]);
      p.poly(d, [x1 - B.armW - 0.2, B.sh + 7.2, x1 + 2.4, B.sh + 6.8, x1 + 2.4, B.sh + 7.6, x1 - B.armW - 0.2, B.sh + 8.2]);
      p.poly(d, [cx - 2.4, B.sh - 0.4, cx - 1.4, B.sh - 0.4, cx + 0.2, B.chest + 1.4, cx - 0.6, B.chest + 1.8]);
      p.poly(d, [cx + 2.4, B.sh - 0.4, cx + 1.4, B.sh - 0.4, cx - 0.2, B.chest + 1.4, cx + 0.6, B.chest + 1.8]);
      p.poly(P.skin, [cx, B.sh + 0.6, cx + 1.2, B.sh + 2.6, cx, B.sh + 4.6, cx - 1.2, B.sh + 2.6]);
      p.rect(v, cx - 0.5, B.chest + 1.4, 1, B.waist - B.chest - 4);
      p.snap(gold, cx - 0.5, B.sh - 0.8, 1, 1);
      const x0 = cx - B.shW;
      p.rect('#1a1e24', x0 - 1.2, B.sh + 4.6, B.armW + 1.4, 0.8);
      p.rect('#c8303a', x0 - 1.8, B.sh + 5.4, 1, 3.6);
    }
    if ((v = accOf(L, 'ilsash'))) {
      const gold = '#d8b048', d = dark(v, 0.3), y = B.waist - 1.6, lw = B.legW;
      for (const s of [-1, 1]) {
        p.poly(d, [cx + s * (B.waW - 2.4), B.waist + 1, cx + s * (B.hiW + 1.2), B.waist + 1, cx + s * (B.hiW + 2.8), B.ankle - 3, cx + s * (B.hiW + 0.6), B.ankle - 1, cx + s * (B.hiW - 1.4), B.ankle - 5]);
        p.poly(v, [cx + s * (B.waW - 1.6), B.waist + 1, cx + s * (B.hiW + 0.6), B.waist + 1, cx + s * (B.hiW + 2), B.ankle - 4, cx + s * (B.hiW - 0.8), B.ankle - 6]);
        const kx = s < 0 ? cx - lw * 0.5 : cx + 1 + lw * 0.5;
        p.poly(gold, [kx, B.knee + 2, kx + 1.4, B.knee + 4.6, kx, B.knee + 8, kx - 1.4, B.knee + 4.6]);
        p.poly('#8a5a3a', [kx, B.knee + 4.6, kx + 0.7, B.knee + 5.8, kx, B.knee + 7, kx - 0.7, B.knee + 5.8]);
      }
      p.rect('#eef0ee', cx + 3, B.waist + 0.4, 1.4, B.knee - B.waist + 2);
      p.poly(gold, [cx + 3, B.knee + 2.4, cx + 4.4, B.knee + 2.4, cx + 3.7, B.knee + 5]);
      p.poly(v, [cx - B.waW - 1, y - 2.6, cx + B.waW + 1, y - 2.6, cx + B.waW + 1.4, y + 2.8, cx - B.waW - 1.4, y + 2.8]);
      p.poly(d, [cx - B.waW - 1.4, y + 1.6, cx + B.waW + 1.4, y + 1.6, cx + B.waW + 1.4, y + 2.8, cx - B.waW - 1.4, y + 2.8]);
      p.rect(light(v, 0.2), cx - B.waW - 0.8, y - 2.4, B.waW * 2 + 1.6, 0.6);
      p.rect('#c8303a', cx + 2.6, y + 2.2, 2.4, 1);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2; p.poly(gold, [cx - 0.5, y, cx - 0.5 + Math.cos(a - 0.4) * 1.6, y + Math.sin(a - 0.4) * 1.6, cx - 0.5 + Math.cos(a) * 3.2, y + Math.sin(a) * 3, cx - 0.5 + Math.cos(a + 0.4) * 1.6, y + Math.sin(a + 0.4) * 1.6]); }
      p.ell('#2a2a30', cx - 0.5, y, 1.7, 1.7);
      p.ell('#5ae0e8', cx - 0.5, y, 1.3, 1.3);
      p.snap('#d8fafc', cx - 1, y - 0.6, 0.6, 0.6);
    }
    if ((v = accOf(L, 'agarmor'))) {
      const gold = '#d8b048', red = '#a8202c', sd = dark(v, 0.22), hi = light(v, 0.4), lw = B.legW, wr = B.wrist || B.waist + 1;
      p.poly('#3a2e28', [cx - B.hiW + 1, B.hip - 2, cx + B.hiW - 1, B.hip - 2, cx + B.hiW - 1.4, B.hip + 3, cx + 1, B.hip + 5.4, cx - 1, B.hip + 5.4, cx - B.hiW + 1.4, B.hip + 3]);
      p.poly(dark(red, 0.2), [cx - B.waW - 0.2, B.chest, cx + B.waW + 0.2, B.chest, cx + B.waW - 0.2, B.hip - 1, cx, B.hip + 0.6, cx - B.waW + 0.2, B.hip - 1]);
      p.poly(red, [cx - B.waW + 0.6, B.chest, cx + B.waW - 0.6, B.chest, cx + B.waW - 1, B.hip - 1.4, cx, B.hip - 0.2, cx - B.waW + 1, B.hip - 1.4]);
      for (const x of [-3.2, 0, 3.2]) p.rect(dark(red, 0.3), cx + x - 0.2, B.chest + 5, 0.4, B.hip - B.chest - 7);
      for (const y of [B.waist - 2, B.waist + 1.4]) p.rect(dark(red, 0.3), cx - B.waW + 1, y, B.waW * 2 - 2, 0.4);
      p.poly(sd, [cx - B.waW - 1, B.sh - 0.4, cx + B.waW + 1, B.sh - 0.4, cx + B.waW + 0.4, B.chest + 2.4, cx, B.chest + 5, cx - B.waW - 0.4, B.chest + 2.4]);
      p.poly(v, [cx - B.waW - 0.4, B.sh - 0.2, cx + B.waW + 0.4, B.sh - 0.2, cx + B.waW - 0.2, B.chest + 2, cx, B.chest + 4.2, cx - B.waW + 0.2, B.chest + 2]);
      p.poly(hi, [cx - B.waW + 0.6, B.sh + 0.6, cx - 2, B.sh + 0.6, cx - 3.4, B.chest, cx - B.waW + 1, B.chest - 1]);
      p.poly(gold, [cx, B.sh + 0.6, cx + 2, B.sh + 3.4, cx + 1, B.chest + 1.4, cx, B.chest + 3.4, cx - 1, B.chest + 1.4, cx - 2, B.sh + 3.4]);
      p.poly(gold, [cx - 2, B.sh + 3.4, cx - 5, B.sh + 2, cx - 3.6, B.sh + 5]);
      p.poly(gold, [cx + 2, B.sh + 3.4, cx + 5, B.sh + 2, cx + 3.6, B.sh + 5]);
      p.rect(red, cx + 3.6, B.sh + 3.4, 0.7, 4.4);
      for (const k of [0, 2]) { p.poly('#26222a', [cx - B.waW - 0.4, B.chest + 3.6 + k, cx + B.waW + 0.4, B.chest + 2 + k, cx + B.waW + 0.4, B.chest + 3 + k, cx - B.waW - 0.4, B.chest + 4.6 + k]); p.snap(gold, cx - 3.4 + k * 2.6, B.chest + 2.8 + k, 1, 0.9); }
      p.poly('#e8e4dc', [cx - B.waW + 1, B.hip - 2, cx, B.hip - 0.6, cx + B.waW - 1, B.hip - 2, cx + B.waW - 1, B.hip - 1.2, cx, B.hip + 0.2, cx - B.waW + 1, B.hip - 1.2]);
      p.ell(dark(red, 0.3), cx - 2.6, B.hip - 2, 1.7, 1.6);
      p.ell('#d8283a', cx - 2.6, B.hip - 2.2, 1.3, 1.2);
      p.snap('#f06070', cx - 3, B.hip - 2.6, 0.6, 0.6);
      for (const s of [-1, 1]) {
        const x = cx + s * (B.shW - 0.6), ey = B.sh + (wr - B.sh) * 0.45;
        p.ell(sd, x, B.sh + 1.4, 4.2, 3.6);
        p.ell(v, x, B.sh + 1.1, 3.6, 3);
        p.ell(hi, x - s * 1, B.sh + 0.2, 1.6, 1.1);
        p.poly(gold, [x - s * 0.4, B.sh - 1.4, x + s * 2.6, B.sh - 5.4, x + s * 3.4, B.sh - 0.4, x + s * 1.4, B.sh + 1.4]);
        p.rect(gold, x - 3.6, B.sh + 3.8, 7.2, 0.6);
        p.poly(gold, [x + s * 1.4, ey - 1.6, x + s * 4, ey - 2.8, x + s * 3, ey + 0.4, x + s * 1.4, ey + 1.2]);
        p.rect(red, Math.min(x - s * 2.6, x + s * 1.6), ey - 2.4, 4.2, 1.4);
        const kx = s < 0 ? cx - lw * 0.5 : cx + 1 + lw * 0.5;
        p.poly(gold, [kx - 1.8, B.knee - 2, kx, B.knee - 0.6, kx + 1.8, B.knee - 2, kx + 1.2, B.knee + 2.4, kx, B.knee + 3.6, kx - 1.2, B.knee + 2.4]);
        p.poly('#26222a', [kx - 0.6, B.knee + 0.4, kx + 0.6, B.knee + 0.4, kx, B.knee + 2.4]);
        p.poly('#3a2e28', [kx - 1.4, B.hip + 9, kx + 1.4, B.hip + 9, kx + 0.8, B.hip + 13, kx - 0.8, B.hip + 13]);
        const fx = cx + s * (B.hiW + 2.4), fy = B.hip + (L.coatLen || 26) - 7;
        p.poly(gold, [fx, fy, fx + s * 0.6, fy, fx + s * 2, fy + 5, fx + s * 1.4, fy + 5]);
        p.poly(gold, [fx - s * 1.6, fy + 1, fx - s * 1, fy + 1, fx + s * 0.6, fy + 6, fx, fy + 6]);
      }
    }
    if ((v = accOf(L, 'ratoga'))) {
      const gold = '#d8b048', blue = '#3a48c0', W = '#f2f2f4', wr = B.wrist || B.waist + 1;
      const armPts = s => { const x0 = cx + s * B.shW; return [x0 - s * 0.2, B.sh + 0.4, x0 - s * B.armW, B.sh + 1.4, x0 - s * (B.armW - 0.6), wr, x0 + s * 1.3, wr]; };
      p.band(B.sh - 1, wr - 4.4, () => p.poly(blue, armPts(-1)));
      if (B.male) p.poly(blue, [cx - B.shW + 2.6, B.sh - 0.6, cx - B.shW - 0.6, B.sh + 0.2, cx - B.shW - 1.8, B.sh + 3.4, cx - B.shW - 1.3, B.sh + 6, cx - B.shW + 2, B.sh + 5]);
      p.rect('#1e1c24', cx - B.shW - 1.6, B.sh + 6.4, B.armW + 1.8, 0.8);
      p.band(B.sh - 1, wr - 4.4, () => p.poly(P.skin, armPts(1)));
      if (B.male) p.poly(P.skin, [cx + B.shW - 2.6, B.sh - 0.6, cx + B.shW + 0.6, B.sh + 0.2, cx + B.shW + 1.8, B.sh + 3.4, cx + B.shW + 1.3, B.sh + 6, cx + B.shW - 2, B.sh + 5]);
      p.band(B.sh - 1, wr - 4.4, () => p.poly(P.skinSh, [cx + B.shW + 0.6, B.sh + 2, cx + B.shW + 1.8, B.sh + 3.4, cx + B.shW + 1.3, wr, cx + B.shW, wr]));
      for (const s of [-1, 1]) {
        const x0 = cx + s * B.shW, a = x0 - s * (B.armW - 0.4), b = x0 + s * 1.5;
        p.poly(dark(gold, 0.3), [a, wr - 4.8, b, wr - 4.8, b, wr - 0.6, a, wr - 0.6]);
        p.poly(gold, [a, wr - 4.6, b, wr - 4.6, b, wr - 1.6, a, wr - 1.6]);
        p.rect(light(gold, 0.35), Math.min(a, b), wr - 4.4, Math.abs(b - a), 0.6);
      }
      p.poly(P.skin, [cx - 1.8, B.sh - 0.2, cx + 1.8, B.sh - 0.2, cx, B.chest + 1]);
      for (const s of [-1, 1]) p.poly('#34323c', [cx + s * 1.6, B.sh - 2, cx + s * 3.4, B.sh - 1.2, cx + s * 2.6, B.sh + 2.4, cx + s * 1.4, B.sh + 0.6]);
      p.poly(gold, [cx - 2.4, B.sh, cx, B.sh + 0.8, cx + 2.4, B.sh, cx + 1.4, B.sh + 1.8, cx - 1.4, B.sh + 1.8]);
      p.snap('#8a3ae0', cx - 0.5, B.sh + 0.4, 1, 1.4);
      p.rect(gold, cx - 0.2, B.sh + 1.8, 0.4, B.chest - B.sh - 1);
      for (const y of [B.chest + 2, B.chest + 4.4, B.chest + 6.8]) p.snap('#e8e8ee', cx - 0.4, y, 0.8, 0.8);
      p.poly(W, [cx + B.shW - 3, B.sh - 0.8, cx + B.shW + 0.6, B.sh - 0.2, cx + 4.6, B.waist - 2, cx + 2.4, B.waist - 2.4]);
      p.poly(dark(W, 0.14), [cx + B.shW - 0.6, B.sh - 0.4, cx + B.shW + 0.6, B.sh - 0.2, cx + 4.6, B.waist - 2, cx + 3.8, B.waist - 2.2]);
      p.ell(dark(gold, 0.3), cx + B.shW - 1.2, B.sh + 1.4, 1.4, 1.4); p.ell(gold, cx + B.shW - 1.2, B.sh + 1.2, 1.1, 1.1);
      p.rect('#c83a3a', cx + B.shW - 0.4, B.sh + 4, 1.6, 0.4); p.rect('#3ab0a8', cx + B.shW - 0.2, B.sh + 4.8, 1.2, 0.4);
      p.poly(W, [cx + B.waW - 1.6, B.waist + 0.6, cx + B.hiW + 2, B.waist + 0.6, cx + B.hiW + 3, B.knee + 4, cx + B.hiW + 0.6, B.knee + 6, cx + B.hiW - 1, B.hip + 6]);
      p.poly(dark(W, 0.16), [cx + B.hiW + 1, B.waist + 1, cx + B.hiW + 2, B.waist + 0.6, cx + B.hiW + 3, B.knee + 4, cx + B.hiW + 2, B.knee + 5]);
      p.poly(dark(blue, 0.25), [cx - 5, B.sh - 0.6, cx - 2.4, B.sh - 0.6, cx - 1, B.waist, cx - 0.8, B.hip + 9, cx - 2.2, B.hip + 12, cx - 3.6, B.hip + 9, cx - 3.8, B.waist]);
      p.poly(blue, [cx - 4.6, B.sh - 0.6, cx - 2.8, B.sh - 0.6, cx - 1.4, B.waist, cx - 1.2, B.hip + 8.6, cx - 2.2, B.hip + 11, cx - 3.2, B.hip + 8.6, cx - 3.4, B.waist]);
      p.poly(gold, [cx - 4.6, B.sh - 0.6, cx - 4, B.sh - 0.6, cx - 3, B.waist, cx - 3.4, B.waist]);
      for (const y of [B.sh + 4, B.chest + 4, B.hip + 3]) { p.ell(gold, cx - 2.6, y, 0.9, 0.9); p.snap(blue, cx - 2.9, y - 0.3, 0.6, 0.6); }
      p.poly(W, [cx - B.waW - 1, B.waist - 2, cx + B.waW + 1.2, B.waist - 2.6, cx + B.waW + 1.6, B.waist + 1.4, cx - B.waW - 1, B.waist + 2]);
      p.poly(dark(W, 0.14), [cx - B.waW - 1, B.waist + 0.8, cx + B.waW + 1.6, B.waist + 0.2, cx + B.waW + 1.6, B.waist + 1.4, cx - B.waW - 1, B.waist + 2]);
      p.rect('#1e1c24', cx - B.waW - 0.6, B.waist - 3.2, B.waW * 2 + 1.2, 1.2);
      p.poly(gold, [cx - 1.6, B.waist - 3.6, cx + 2.2, B.waist - 3.6, cx + 1.6, B.waist - 1.6, cx - 1, B.waist - 1.6]);
      const rx = cx + 1 + B.legW * 0.5;
      p.rect('#1e1c24', cx + 1, B.hip + 7, B.legW, 0.8); p.poly(gold, [rx, B.hip + 6, rx + 0.9, B.hip + 7.4, rx, B.hip + 9.4, rx - 0.9, B.hip + 7.4]);
    }
    if ((v = accOf(L, 'rasandal'))) {
      const lw = B.legW;
      for (const s of [-1, 1]) {
        const x0 = s < 0 ? cx - lw + 0.4 : cx + 1.2, kx = x0 + (lw - 1.6) * 0.5;
        p.rect(P.skin, x0 + (s < 0 ? 0.4 : 0), B.ankle - 5.6, lw - 1.6, 4.4);
        p.rect('#1e1c24', x0 + (s < 0 ? 0.4 : 0), B.ankle - 3.4, lw - 1.6, 0.7);
        p.poly(dark(v, 0.3), [x0 - 0.6, B.ankle - 6, x0 + lw - 0.6, B.ankle - 6, x0 + lw - 1, B.ankle - 5, x0 - 0.2, B.ankle - 5]);
        p.poly(v, [kx - 1.8, B.ankle - 5.6, kx - 1, B.ankle - 8.6, kx, B.ankle - 6.4, kx + 1, B.ankle - 8.6, kx + 1.8, B.ankle - 5.6]);
        p.poly(v, [kx - 0.8, B.ankle - 1.6, kx + 0.8, B.ankle - 1.6, kx + 1.6, B.ankle + 1.6, kx - 1.6, B.ankle + 1.6]);
        p.snap('#3a48c0', kx - 0.4, B.ankle - 0.6, 0.8, 1);
      }
    }
    if ((v = accOf(L, 'jadecollar'))) {
      p.poly(mix(P.skin, '#2a1e20', 0.62), [cx - B.shW + 2.4, B.sh + 0.2, cx + B.shW - 1.4, B.sh + 0.2, cx + B.shW - 2, B.sh + 2.4, cx - B.shW + 2, B.sh + 2.4]);
      p.rect(v, cx - 1.6, neckTop + 1, 4.2, 1.2);
      p.snap('#5ac8c0', cx, B.sh + 0.4, 1, 1);
      p.snap(v, cx, B.sh + 1.6, 1, 1.2);
    }
    if ((v = accOf(L, 'knotbar'))) {
      p.poly(P.top, [cx - 2.8, B.sh + 2, cx - 0.4, B.sh + 2, cx - 0.8, B.chest + 3.2, cx - 2.8, B.chest + 3.2]);
      p.rect(v, cx - B.waW - 0.6, B.chest + 1, B.waW * 2 + 2.2, 1);
      for (const dx of [-2, 3]) p.snap('#d8b050', cx + dx - 0.5, B.chest + 0.8, 1, 1.4);
      p.poly(mix('#3a2a2a', P.top, 0.3), [cx - 1, B.chest + 2, cx + 2, B.chest + 2, cx + 1.8, B.waist - 1, cx - 0.8, B.waist - 1]);
      p.poly('#d8b050', [cx - 0.6, B.chest + 3.4, cx + 0.5, B.chest + 2.4, cx + 1.6, B.chest + 3.4, cx + 1.2, B.chest + 3.8, cx + 0.5, B.chest + 3.2, cx - 0.2, B.chest + 3.8]);
    }
    if ((v = accOf(L, 'armorpad'))) for (const s of [-1, 1]) {
      const x0 = cx + s * B.shW;
      p.poly('#1e3a6a', [x0 - s * 2.4, B.sh + 3, x0 + s * 1.4, B.sh + 3.6, x0 + s * 1.2, B.sh + 7, x0 - s * 2.2, B.sh + 6.2]);
      p.poly('#1c1a22', [x0 - s * 2.6, B.sh + 0.4, x0 + s * 0.2, B.sh - 1, x0 + s * 1.8, B.sh + 1.4, x0 + s * 1.6, B.sh + 4.2, x0 - s * 1.8, B.sh + 3.4]);
      p.poly(v, [x0 - s * 2.6, B.sh + 0.4, x0 + s * 0.2, B.sh - 1, x0 + s * 1.8, B.sh + 1.4, x0 + s * 1.4, B.sh + 1.8, x0 + s * 0.2, B.sh, x0 - s * 2.4, B.sh + 1.2]);
      p.snap('#5ac8c0', x0 - s * 0.4 - 0.5, B.sh + 2, 1, 1);
      p.snap('#9a1c2c', x0 + s * 1 - 0.4, B.sh + 2.4, 0.8, 1.6);
    }
    if ((v = accOf(L, 'lotussash'))) {
      const y = B.waist - 1;
      for (const sd of [-1, 1]) p.poly(v, [cx + 0.5, y, cx + 0.5 + sd * (B.waW + 3.4), y - 1.6, cx + 0.5 + sd * (B.waW + 3), y + 2.6, cx + 0.5 + sd * (B.waW + 1.4), y + 4.4, cx + 0.5, y + 2.4]);
      p.rect(dark(v, 0.25), cx - B.waW - 0.6, y + 2.4, B.waW * 2 + 2.2, 0.6);
      p.rect('#1c1a20', cx - B.waW - 0.6, y + 2.8, B.waW * 2 + 2.2, 0.9);
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.ell('#d8b050', cx + 0.5 + Math.cos(a) * 1.6, y + 1.4 + Math.sin(a) * 1.6, 0.9, 0.9); }
      p.ell('#d8b050', cx + 0.5, y + 1.4, 1.6, 1.6);
      p.ell('#f2eef0', cx + 0.5, y + 1.4, 1, 1);
      p.snap('#1c1a20', cx + 0.5, y + 0.8, 0.6, 1.2);
    }
    if ((v = accOf(L, 'sealpanel'))) {
      const top = B.waist + 2.4, bot = B.knee + 9, pts = [cx - 1.8, top, cx + 2.8, top, cx + 2.8, bot - 2.4, cx + 0.5, bot, cx - 1.8, bot - 2.4];
      p.poly(v, pts);
      p.clipPoly(pts, () => {
        p.poly(dark(v, 0.25), [cx + 1.6, top, cx + 2.8, top, cx + 2.8, bot, cx + 1.6, bot]);
        p.ell('#a01c28', cx + 0.5, top + 0.4, 1.8, 1.6);
        p.ell(v, cx + 0.5, top - 0.4, 1.6, 1.2);
        for (const y of [B.hip + 3, B.hip + 5.6]) p.poly('#d8b050', [cx + 0.5, y - 1, cx + 1.2, y, cx + 0.5, y + 1, cx - 0.2, y]);
        const y = B.knee - 0.6;
        p.poly('#d8b050', [cx + 0.5, y - 3.4, cx + 3, y, cx + 0.5, y + 3.4, cx - 2, y]);
        p.poly(v, [cx + 0.5, y - 2.4, cx + 2, y, cx + 0.5, y + 2.4, cx - 1, y]);
        p.poly('#a01c28', [cx + 0.5, y - 1.4, cx + 1.2, y, cx + 0.5, y + 1.4, cx - 0.2, y]);
        p.poly('#d8b050', [cx + 0.5, y + 3.6, cx + 2, y + 5.6, cx + 0.5, y + 7.6, cx - 1, y + 5.6]);
        p.poly(v, [cx + 0.5, y + 4.6, cx + 1.2, y + 5.6, cx + 0.5, y + 6.6, cx - 0.2, y + 5.6]);
      });
      for (const x of [cx - 1.8, cx + 2.3]) p.rect('#d8b050', x, top, 0.5, bot - top - 2.4);
    }
    if ((v = accOf(L, 'hipswirl'))) for (const sd of [-1, 1]) {
      const x = cx + 0.5 + sd * (B.hiW - 0.6), y = B.hip + 1;
      p.poly(v, [x, y, x + sd * 0.8, y, x - sd * 1.2, y + 2.6, x - sd * 2.2, y + 2.4]);
      p.snap(v, x - sd * 2.2 - 0.4, y + 1.6, 0.8, 0.8);
    }
    if ((v = accOf(L, 'thightattoo'))) {
      const x = cx + 1 + B.legW * 0.68, y = B.hip + (L.low === 'shorts' ? 6 : 9);
      p.rect(v, x - 0.3, y, 0.6, 7);
      for (const dy of [1, 3.4]) { p.poly(v, [x - 1.4, y + dy, x - 0.8, y + dy, x + 1.4, y + dy + 1.8, x + 0.8, y + dy + 1.8]); p.poly(v, [x + 0.8, y + dy, x + 1.4, y + dy, x - 0.8, y + dy + 1.8, x - 1.4, y + dy + 1.8]); }
    }
    if ((v = accOf(L, 'brushpen'))) {
      const x = cx - B.hiW - 0.4, y = B.waist + 0.6;
      p.poly(v, [x, y, x + 0.8, y, x - 1.2, B.hip + 5, x - 2, B.hip + 5]);
      p.poly(dark(v, 0.3), [x - 1.2, B.hip + 5, x - 2, B.hip + 5, x - 2.6, B.hip + 7, x - 1.6, B.hip + 7]);
      p.snap(light(v, 0.4), x - 0.2, y, 0.8, 0.8);
    }
    if ((v = accOf(L, 'tasselanklet'))) for (const s of [-1, 1]) {
      const o = x => (s < 0 ? cx - x : cx + 1 + x), lw = B.legW, y = B.ankle - 4.4;
      p.poly(v, [o(-0.6), y, o(lw + 0.4), y, o(lw + 0.2), y + 1.4, o(-0.4), y + 1.4]);
      p.snap(dark(v, 0.3), o(lw * 0.5) - 0.4, y + 0.3, 0.8, 0.8);
      p.rect(v, o(lw * 0.5) - 0.4, y + 1.4, 0.8, 2);
    }
    if ((v = accOf(L, 'onimask'))) {
      const y = B.waist + 0.2;
      p.poly(L.trim, [cx - 1.6, y - 0.6, cx - 2.4, y - 2.4, cx - 0.8, y - 0.8]);
      p.poly(L.trim, [cx + 2.6, y - 0.6, cx + 3.4, y - 2.4, cx + 1.8, y - 0.8]);
      p.ell(v, cx + 0.5, y + 1.2, 2.3, 2.2);
      p.snap('#4ab0d8', cx - 0.8, y + 0.6, 0.9, 0.7);
      p.snap('#4ab0d8', cx + 1, y + 0.6, 0.9, 0.7);
      p.rect('#f0eef2', cx - 0.6, y + 2, 2.2, 0.6);
    }
    if ((v = accOf(L, 'blossom'))) {
      p.ell(v, cx - 4.2, B.waist + 2.2, 1.7, 1.5);
      p.ell('#f3c9d4', cx - 2.4, B.waist + 3.8, 1.4, 1.2);
      p.ell(v, cx - 4.6, B.waist + 4.4, 1.2, 1);
      p.snap('#f0c86a', cx - 4.5, B.waist + 1.9, 0.7, 0.7);
    }
    if ((v = accOf(L, 'scarf'))) {
      p.poly(v, [cx - 4.6, B.sh - 0.6, cx + 4.6, B.sh - 0.6, cx + 5.4, B.sh + 1.4, cx - 4.8, B.sh + 1.6]);
      p.poly(v, [cx + 2, B.sh + 0.6, cx + 5.6, B.sh, cx + 7.2, B.chest + 1, cx + 6.4, B.chest + 6.6, cx + 2.4, B.chest + 6.6, cx + 1.8, B.chest]);
      p.poly(dark(v, 0.25), [cx + 5, B.sh + 1, cx + 6.6, B.chest, cx + 6.2, B.chest + 6.6, cx + 4.6, B.chest + 6.6]);
      for (let x = cx + 2.6; x < cx + 6.4; x += 1.2) p.snap(dark(v, 0.35), x, B.chest + 6.6, 0.6, 1.2);
    }
    if ((v = accOf(L, 'brooch2'))) { p.poly(v, [cx + 2.6, B.sh + 0.6, cx + 3.4, B.sh + 2.2, cx + 2.6, B.sh + 4.4, cx + 1.8, B.sh + 2.2]); }
    if ((v = accOf(L, 'harness'))) {
      p.poly(v, [cx - B.waW - 0.8, B.waist + 0.6, cx - B.waW - 0.4, B.waist + 1.8, cx + B.hiW + 0.6, B.hip + 6.6, cx + B.hiW + 0.6, B.hip + 5.4]);
      p.rect(v, cx + 1, B.hip + 7, B.legW + 0.4, 1);
      for (const y of [B.waist + 2.6, B.hip + 0.8]) { p.rect('#c8ccd4', cx - B.waW - 1.4, y, 1.8, 1.4); p.rect(dark(v, 0.1), cx - B.waW - 0.4, y + 0.4, 2.4, 0.6); }
      p.ell('#d8dce4', cx + B.hiW - 1.4, B.hip + 5.6, 0.8, 0.8);
    }
    if ((v = accOf(L, 'kerchief'))) p.poly(v, [cx - 3, B.sh - 0.6, cx + 3, B.sh - 0.6, cx, B.sh + 3.4]);
    if ((v = accOf(L, 'choker'))) p.rect('#1c1a20', cx - 2, neckTop + 1.4, 4, 1);
    if ((v = accOf(L, 'bow'))) { p.poly(v, [cx, B.sh + 1.4, cx - 3.4, B.sh - 0.4, cx - 3, B.sh + 3.4]); p.poly(v, [cx, B.sh + 1.4, cx + 3.4, B.sh - 0.4, cx + 3, B.sh + 3.4]); p.rect(dark(v, 0.35), cx - 0.6, B.sh + 0.8, 1.2, 1.2); }
    if ((v = accOf(L, 'tie'))) { p.rect(v, cx - 0.7, B.sh - 0.4, 1.4, 1.2); p.poly(v, [cx - 0.5, B.sh + 0.6, cx + 0.5, B.sh + 0.6, cx + 0.8, B.chest + 3.4, cx, B.chest + 4.6, cx - 0.8, B.chest + 3.4]); }
    if ((v = accOf(L, 'lanyard'))) { p.rect(v, cx - 2.5, B.sh, 0.7, 7); p.rect('#f2f2f4', cx - 3.2, B.sh + 6.5, 2.4, 3); }
    if (accOf(L, 'feather')) p.poly('#ecc454', [cx + 4.4, B.sh + 3, cx + 5.8, B.sh + 2, cx + 5.4, B.sh + 7, cx + 4.6, B.sh + 7.4]);
    if ((v = accOf(L, 'piping'))) for (const sd of [-1, 1]) p.poly(v, [cx + sd * 4.2, B.sh + 1, cx + sd * 4.8, B.sh + 1, cx + sd * 5.6, B.waist + 1, cx + sd * 5, B.waist + 1]);
    if ((v = accOf(L, 'shbuckle'))) { p.poly(v, [cx - B.shW - 0.6, B.sh + 1.6, cx - B.shW + 2.4, B.sh - 0.4, cx - B.shW + 2.8, B.sh + 0.6, cx - B.shW - 0.2, B.sh + 2.6]); }
    if ((v = accOf(L, 'knifebelt'))) {
      p.poly(v, [cx - B.waW - 1, B.waist + 1.4, cx - B.waW - 0.8, B.waist + 2.8, cx + B.hiW + 1.4, B.hip + 2.8, cx + B.hiW + 1.4, B.hip + 1.4]);
      p.poly('#8a2a30', [cx - B.waW - 2.6, B.waist + 0.2, cx - B.waW + 1.6, B.waist + 1.6, cx - B.waW + 1.4, B.waist + 2.6, cx - B.waW - 2.8, B.waist + 1.2]);
      p.snap('#d8b050', cx - B.waW - 2.4, B.waist + 0.2, 1, 1);
      p.snap('#c8ccd4', cx + B.hiW, B.hip + 1, 1.4, 1.6);
    }
    if ((v = accOf(L, 'watch'))) {
      const x = cx + B.waW - 0.6;
      for (let y = B.waist + 0.6; y < B.hip + 5; y += 1.4) p.snap(v, x + (y - B.waist) * 0.14, y, 0.7, 0.7);
      p.ell(dark(v, 0.3), x + 1.4, B.hip + 5.6, 1.5, 1.5); p.ell(v, x + 1.3, B.hip + 5.4, 1.2, 1.2); p.snap(light(v, 0.5), x + 0.9, B.hip + 5, 0.7, 0.7);
    }
    if ((v = accOf(L, 'skirtbuckles'))) {
      for (const y of [B.waist + 2.4, B.waist + 4]) p.snap(v, cx - 3.4, y, 2, 0.8);
      p.poly('#6a6870', [cx - 0.6, B.waist + 1, cx + 0.8, B.waist + 1, cx + 0.6, B.hip + 3.4, cx, B.hip + 4.4, cx - 0.6, B.hip + 3.4]);
      p.snap('#8ad8e8', cx + 2.6, B.hip + (L.skirtLen || 10) - 1.4, 2.4, 0.8);
    }
    if (accOf(L, 'badge')) { p.rect('#f2f2f4', cx + 3.5, B.sh + 5, 2, 2.6); p.rect('#2e5bd2', cx + 3.5, B.sh + 5.5, 2, 0.7); }
    if ((v = accOf(L, 'icebow'))) {
      p.poly(v, [cx + 1.8, B.sh + 2.6, cx - 1.4, B.sh + 1, cx - 1, B.sh + 4.4]); p.poly(v, [cx + 1.8, B.sh + 2.6, cx + 5, B.sh + 1, cx + 4.6, B.sh + 4.4]);
      p.poly(v, [cx + 1.2, B.sh + 3, cx + 2.6, B.sh + 3, cx + 3.8, B.waist - 1, cx + 2.4, B.waist - 1]);
      p.snap('#d8b050', cx + 1.3, B.sh + 2.1, 1, 1);
      p.poly('#62c4f4', [cx + 2.6, B.sh + 1, cx + 3.6, B.sh - 2.4, cx + 4.2, B.sh + 1]);
    }
    if ((v = accOf(L, 'gembow'))) {
      for (const s of [-1, 1]) {
        p.poly(L.band || '#f0b440', [cx + s * 0.4, B.sh + 2.6, cx + s * 1.8, B.sh + 5, cx + s * 0.9, B.sh + 4.6]);
        p.poly(v, [cx, B.sh + 2, cx + s * 3.2, B.sh + 0.6, cx + s * 2.8, B.sh + 3.8]);
      }
      p.snap(accOf(L, 'hairloop') || '#2c5ad8', cx - 0.5, B.sh + 1.5, 1, 1);
    }
    if ((v = accOf(L, 'molebadge')) && accOf(L, 'bow')) { p.ell(dark(v, 0.3), cx, B.sh + 2.6, 1.4, 1.4); p.ell(v, cx, B.sh + 2.4, 1.1, 1.1); }
    if ((v = accOf(L, 'blackyoke'))) for (const s of [-1, 1]) {
      p.poly(v, [cx + s * (B.shW - 0.2), B.sh, cx + s * 1.6, B.sh, cx + s * 2.4, B.chest - 0.6, cx + s * (B.waW + 1.2), B.chest + 0.4]);
      const pf = accOf(L, 'puff'), x0 = cx + s * B.shW;
      if (pf) { p.ell(dark(pf, 0.16), x0 - s * 0.6, B.sh + 4.4, 3.4, 3.8); p.ell(pf, x0 - s * 0.9, B.sh + 4, 2.9, 3.2); p.rect(dark(pf, 0.16), x0 - s * 0.9 - 0.4, B.sh + 2, 0.8, 4.6); p.rect(L.trim, x0 - s * 0.9 - 3, B.sh + 7.4, 6, 0.9); p.poly(v, [x0 - s * 1.8, B.sh - 0.4, x0 + s * 1.6, B.sh + 0.6, x0 + s * 1.4, B.sh + 2.2, x0 - s * 2, B.sh + 1.6]); }
    }
    if ((v = accOf(L, 'cravat'))) { p.poly(v, [cx - 1.4, B.sh - 0.4, cx + 1.4, B.sh - 0.4, cx + 1.6, B.chest + 2, cx, B.chest + 3, cx - 1.6, B.chest + 2]); p.snap(light(v, 0.4), cx - 0.8, B.sh + 1, 0.8, 3); }
    if ((v = accOf(L, 'whitebow'))) { p.poly(v, [cx, B.chest + 3, cx - 3.4, B.chest + 1.6, cx - 3, B.chest + 4.6]); p.poly(v, [cx, B.chest + 3, cx + 3.4, B.chest + 1.6, cx + 3, B.chest + 4.6]); p.poly(v, [cx - 0.8, B.chest + 3.4, cx + 0.8, B.chest + 3.4, cx + 1.4, B.waist + 1, cx - 1.4, B.waist + 1]); p.snap(dark(v, 0.2), cx - 0.5, B.chest + 2.6, 1, 1); }
    if ((v = accOf(L, 'sidepanel'))) for (const s of [-1, 1]) { p.poly(v, [cx + s * (B.waW - 0.6), B.chest + 1, cx + s * (B.waW + 1), B.chest + 1, cx + s * (B.hiW + 2), B.hip + 4, cx + s * (B.hiW + 0.2), B.hip + 4]); p.poly(L.trim, [cx + s * (B.waW - 1), B.chest + 1, cx + s * (B.waW - 0.6), B.chest + 1, cx + s * (B.hiW + 0.2), B.hip + 4, cx + s * (B.hiW - 0.2), B.hip + 4]); }
    if ((v = accOf(L, 'yoke'))) for (const s of [-1, 1]) p.poly(v, [cx + s * (B.shW + 0.8), B.sh + 0.4, cx + s * 3, B.sh - 0.2, cx + s * 3.6, B.sh + 2.6, cx + s * (B.shW + 0.6), B.sh + 3]);
    if ((v = accOf(L, 'tiestripe'))) { p.poly(v, [cx - 1.2, B.sh + 4, cx + 1.2, B.sh + 4, cx + 1.6, B.hip + 2, cx, B.hip + 3.4, cx - 1.6, B.hip + 2]); p.rect('#f8f4ea', cx - 1.5, B.hip, 3, 0.6); }
    if ((v = accOf(L, 'bat'))) {
      const wr = B.wrist || B.waist + 1, hx = cx + B.shW + (L.coat === 'trashcan' ? 4.6 : 0.6), hy = wr + 1.6, ex = hx + 7, ey = B.knee + 7;
      p.poly(dark(v, 0.35), [hx - 0.8, hy - 2, hx + 0.6, hy - 2.2, ex + 2.2, ey - 0.6, ex + 0.2, ey + 1.6]);
      p.poly(v, [hx - 0.5, hy - 1.8, hx + 0.4, hy - 2, ex + 1.6, ey - 0.6, ex + 0.2, ey + 0.8]);
      p.poly(light(v, 0.35), [hx + 1.6, hy + 2, hx + 2.1, hy + 2, ex + 1.4, ey - 1, ex + 0.9, ey - 0.6]);
      p.poly('#2a2a30', [hx - 1, hy - 3.6, hx + 0.8, hy - 3.8, hx + 1.6, hy + 1.2, hx - 0.2, hy + 1.4]);
      p.ell('#2a2a30', hx - 0.2, hy - 4, 1.4, 0.9);
    }
    if ((v = accOf(L, 'beltlamp'))) {
      const x = cx + B.hiW + 2.8, y = B.hip + 1.6, glow = L.lampGlow || '#ffd860';
      p.poly('#3a3030', [x - 0.3, B.waist + 0.4, x + 0.3, B.waist + 0.4, x + 0.3, y, x - 0.3, y]);
      p.ell('#3a3030', x, y + 0.6, 1.4, 1);
      p.rect(dark(v, 0.4), x - 1.8, y + 1, 3.6, 5);
      p.rect(glow, x - 1.2, y + 1.6, 2.4, 3.6);
      p.snap('#fffbe4', x - 0.8, y + 2, 0.8, 1.6);
      p.rect(v, x - 2, y + 0.8, 4, 0.8); p.rect(v, x - 2, y + 5.2, 4, 0.9);
      p.rect(v, x - 0.3, y + 1.4, 0.6, 3.8);
    }
    if ((v = accOf(L, 'pouches'))) for (const s of [-1, 1]) {
      const x = cx + s * (B.hiW + 2.4);
      p.rect('#3a2c26', x - 2, B.waist - 0.6, 4, 7.4);
      for (const y of [B.waist + 0.6, B.waist + 3.6]) { p.rect(v, x - 2.2, y, 4.4, 1.8); p.snap('#2a2420', x - 1.2, y + 0.5, 0.8, 0.8); p.snap('#2a2420', x + 0.4, y + 0.5, 0.8, 0.8); }
    }
    if ((v = accOf(L, 'goldtassel'))) { const x = cx + B.waW - 0.4; p.poly(v, [x - 0.3, B.waist, x + 0.3, B.waist, x + 0.5, B.hip + 3, x - 0.5, B.hip + 3]); p.poly(v, [x - 0.9, B.hip + 3, x + 0.9, B.hip + 3, x + 1.1, B.hip + 7, x - 1.1, B.hip + 7]); }
    if ((v = accOf(L, 'aiguillette'))) { p.poly(v, [cx + 2, B.sh + 1, cx + 3, B.sh + 1, cx + 7, B.chest + 3, cx + 6, B.chest + 3]); p.poly(v, [cx + 3, B.sh + 2.5, cx + 4, B.sh + 2.5, cx + 6.5, B.chest + 5, cx + 5.5, B.chest + 5]); }
    if ((v = accOf(L, 'armband'))) { const x0 = cx + B.shW; p.rect(v, x0 - B.armW - 0.4, B.sh + 5, B.armW + 2, 2); p.rect('#e0b848', x0 - B.armW * 0.5 - 0.2, B.sh + 5.4, 1.2, 1.2); }
    if (accOf(L, 'gauntlet')) {
      const x0 = cx - B.shW, wr = B.wrist || B.waist + 1, hl = B.hand || 3.6;
      p.poly('#3a3c44', [x0 - 1.6, wr - 2.6, x0 + B.armW + 0.6, wr - 2.6, x0 + B.armW + 0.6, wr + hl + 0.4, x0 + 0.6, wr + hl + 1.2, x0 - 1.8, wr + hl]);
      p.poly('#8e949e', [x0 - 1.2, wr - 2.2, x0 + B.armW + 0.2, wr - 2.2, x0 + B.armW, wr - 0.4, x0 - 1.2, wr - 0.4]);
      p.poly('#5a606a', [x0 - 1.4, wr + 0.4, x0 + B.armW + 0.4, wr + 0.4, x0 + B.armW + 0.2, wr + hl, x0 - 1.2, wr + hl - 0.4]);
      p.snap('#2e5bd2', x0 + 0.4, wr + hl - 1.6, 1.4, 1.2);
    }
    if ((v = accOf(L, 'pauldronr'))) {
      const x = cx + B.shW;
      p.ell(dark(v, 0.35), x + 0.4, B.sh + 1.6, 3.6, 2.8); p.ell(v, x + 0.2, B.sh + 1.2, 3.2, 2.4); p.ell(light(v, 0.45), x - 0.6, B.sh + 0.6, 1.4, 0.8);
    }
    if ((v = accOf(L, 'hoodline'))) p.poly(v, [cx - 3.4, B.sh - 0.4, cx + 3.4, B.sh - 0.4, cx + 4.6, B.sh + 1, cx - 4.6, B.sh + 1]);
    if ((v = accOf(L, 'gear'))) { p.ell('#26262c', cx - 4.6, B.sh + 3.6, 1.8, 1.8); p.ell(v, cx - 4.6, B.sh + 3.6, 1.3, 1.3); p.snap('#c050a0', cx - 5, B.sh + 3.2, 0.8, 0.8); }
    if ((v = accOf(L, 'chevrons'))) for (const y of [B.waist - 1, B.waist + 1.4, B.waist + 3.8]) p.poly(v, [cx - 6.4, y, cx - 5.4, y + 1, cx - 4.4, y, cx - 4.4, y + 0.8, cx - 5.4, y + 1.8, cx - 6.4, y + 0.8]);
    if ((v = accOf(L, 'harnessb'))) {
      p.rect(v, cx - B.waW - 0.8, B.waist + 0.4, (B.waW + 0.8) * 2, 1.4);
      p.rect('#c8ccd4', cx - 0.8, B.waist + 0.4, 1.6, 1.4);
      p.poly(v, [cx - 0.6, B.waist + 1.8, cx + 0.6, B.waist + 1.8, cx + 1.2, B.hip + 4, cx, B.hip + 4]);
    }
    if ((v = accOf(L, 'pouch'))) { p.rect(v, cx + 2.4, B.hip + 1.6, 3.6, 4.4); p.rect(light(v, 0.25), cx + 2.8, B.hip + 2, 2.8, 1); p.snap('#5a7af0', cx + 3.4, B.hip + 4.4, 1.4, 0.6); }
    if ((v = accOf(L, 'cord'))) p.poly(v, [cx + 3, B.sh + 6, cx + 3.6, B.sh + 6, cx + B.hiW + 1.6, B.hip + 7, cx + B.hiW + 1, B.hip + 7.4]);
    if ((v = accOf(L, 'redpanels'))) for (const s of [-1, 1]) {
      const pts = [cx + s * 2, B.waist - 0.4, cx + s * (B.waW + 1.2), B.waist - 0.4, cx + s * (B.hiW + 4), B.hip + 4, cx + s * (B.hiW + 6), B.knee - 2, cx + s * (B.hiW + 3), B.knee - 4, cx + s * (B.hiW + 2.4), B.knee + 1, cx + s * (B.hiW - 0.4), B.hip + 8, cx + s * 3.4, B.hip + 3];
      p.poly(v, pts);
      p.clipPoly(pts, () => { if (s > 0) p.poly(dark(v, 0.22), [cx + B.hiW, B.waist, cx + 20, B.waist, cx + 20, B.knee + 2, cx + B.hiW + 2, B.knee + 2]); p.rect(dark(v, 0.35), cx - 20, B.waist + 1.6, 40, 0.6); });
      p.rect('#c8ccd4', cx + s * (B.waW + 1.4) - 0.5, B.waist + 1.2, 1, 1.4);
      p.poly(light(v, 0.1), [cx + s * (B.hiW + 2), B.hip + 4, cx + s * (B.hiW + 2.8), B.hip + 4, cx + s * (B.hiW + 3.6), B.knee + 6, cx + s * (B.hiW + 2.8), B.knee + 6]);
    }
    if ((v = accOf(L, 'thighharness'))) { const o = x => cx + 1 + x; p.rect(v, o(-0.2), B.hip + 6, B.legW + 0.4, 1); p.poly(v, [o(0.2), B.hip + 7, o(1), B.hip + 7, o(B.legW * 0.5 + 0.4), B.hip + 11, o(B.legW * 0.5 - 0.4), B.hip + 11]); p.poly(v, [o(B.legW - 0.6), B.hip + 7, o(B.legW + 0.2), B.hip + 7, o(B.legW * 0.5 + 0.4), B.hip + 11, o(B.legW * 0.5 - 0.4), B.hip + 11]); }
    if ((v = accOf(L, 'whitebelt'))) {
      p.poly(v, [cx - B.waW - 1, B.waist + 0.4, cx + B.waW + 1, B.waist + 0.4, cx + B.waW + 1.2, B.waist + 1.6, cx - B.waW - 1.2, B.waist + 1.6]);
      p.ell('#2a2836', cx - 0.6, B.waist + 1, 2, 1.6); for (const [dx, dy, c] of [[-1.4, 0.6, '#e8b830'], [0.2, 0.6, '#8a6ae0'], [-0.6, 1.4, '#e8e8ee']]) p.snap(c, cx + dx - 0.3, B.waist + dy, 0.7, 0.7);
    }
    if ((v = accOf(L, 'sash2'))) { p.poly(v, [cx + 1.6, B.waist + 0.6, cx + B.hiW + 1.4, B.waist + 0.6, cx + B.hiW + 2.6, B.knee - 2, cx + B.hiW + 0.6, B.knee + 1, cx + B.hiW - 1.4, B.hip + 5]); p.poly(dark(v, 0.25), [cx + B.hiW, B.hip + 2, cx + B.hiW + 2.2, B.hip + 4, cx + B.hiW + 2.6, B.knee - 2, cx + B.hiW + 1.4, B.knee - 1]); for (const [dx, dy] of [[1.2, 0], [2, 1.6], [1, 3.2]]) p.snap('#2a2836', cx + B.hiW + dx - 0.3, B.knee - 7 + dy, 0.7, 0.7); }
    if ((v = accOf(L, 'gunholster'))) { const x = cx - B.hiW - 1.6; p.rect(v, x - 0.8, B.waist + 1.6, 1.8, 5); p.rect('#6a7af0', x - 0.2, B.waist + 2.4, 0.6, 3); p.poly('#c8ccd8', [x - 0.3, B.waist + 6.6, x + 0.3, B.waist + 6.6, x + 0.2, B.knee, x - 0.2, B.knee]); p.rect(v, x - 0.6, B.knee, 1.2, 2.4); }
    if ((v = accOf(L, 'thighgadget'))) { const o = x => cx - x; p.rect('#1e1e26', o(B.legW + 0.2), B.hip + 6.4, B.legW + 0.4, 1); p.rect(v, o(B.legW * 0.5 + 1.4), B.hip + 5.8, 2.8, 2.2); p.snap('#5a6ae0', o(B.legW * 0.5 + 0.4), B.hip + 6.4, 0.8, 0.8); p.rect('#5a6ae0', o(B.legW + 0.2), B.hip + 9.4, B.legW + 0.4, 0.9); }
    if ((v = accOf(L, 'rose'))) { p.ell(v, cx + 2.6, neckTop + 1.8, 1.3, 1.2); p.snap(light(v, 0.4), cx + 2.2, neckTop + 1.2, 0.8, 0.8); }
    if ((v = accOf(L, 'leafband'))) for (const y of [B.chest + 1.2, B.waist - 1]) for (let x = cx - B.waW - 0.6; x < cx + B.waW; x += 2) p.poly(v, [x, y + 0.5, x + 1, y - 0.3, x + 2, y + 0.5, x + 1, y + 1.3]);
    if (accOf(L, 'peplum')) {
      p.poly(P.innerSh, [cx - B.waW - 1, B.waist + 0.2, cx + B.waW + 1, B.waist + 0.2, cx + B.hiW + 1.4, B.hip - 0.2, cx + 2, B.hip + 1.4, cx - 1.6, B.hip, cx - B.hiW - 1, B.hip + 0.8]);
      p.poly(P.inner, [cx - B.waW - 0.8, B.waist + 0.2, cx + B.waW + 0.6, B.waist + 0.2, cx + B.hiW + 0.6, B.hip - 0.8, cx + 2, B.hip + 0.4, cx - 1.6, B.hip - 0.8, cx - B.hiW - 0.4, B.hip]);
      for (const x of [-3.4, 0.4, 3.6]) p.poly(P.innerSh, [cx + x, B.waist + 1.4, cx + x + 0.6, B.waist + 1.4, cx + x * 1.3 + 0.6, B.hip - 0.6, cx + x * 1.3, B.hip - 0.6]);
    }
    if ((v = accOf(L, 'lace'))) {
      p.poly(v, [cx - B.waW - 1, B.hip - 0.4, cx - 2.6, B.hip + 0.6, cx - 2.2, B.hip + 5.4, cx - 3.6, B.hip + 7.6, cx - 5.4, B.hip + 5, cx - B.hiW - 1, B.hip + 2]);
      for (const [dx, dy] of [[-4.6, 1.6], [-3.4, 4], [-5.6, 3.4]]) p.snap('#d8b050', cx + dx, B.hip + dy, 0.8, 0.8);
    }
    if ((v = accOf(L, 'capetassel'))) {
      const x = cx - B.shW - 1.8;
      p.poly('#d8b050', [x, B.chest + 2, x + 0.6, B.chest + 2, x + 0.4, B.knee + 2, x - 0.2, B.knee + 2]);
      p.poly(v, [x - 0.8, B.hip - 2, x + 1.2, B.hip - 2, x + 1.4, B.hip + 3, x - 1, B.hip + 3]);
      p.snap('#d8b050', x - 0.6, B.hip - 2.6, 1.6, 0.8);
    }
    if ((v = accOf(L, 'neckband'))) p.rect(v, cx - 2.2, neckTop + 2, 4.4, 0.8);
    if ((v = accOf(L, 'trdress'))) {
      p.poly(P.top, [cx - B.shW + 2, B.sh + 0.8, cx - 3, B.sh - 1.4, cx + 3, B.sh - 1.4, cx + B.shW - 2, B.sh + 0.8]);
      p.rect('#34323e', cx - 2.4, B.sh - 2.4, 4.8, 1.2);
      p.poly(dark(v, 0.2), [cx - 2.4, B.sh + 0.4, cx + 2.4, B.sh + 0.4, cx + 2.8, B.chest + 0.6, cx, B.chest + 4, cx - 2.8, B.chest + 0.6]);
      p.poly(v, [cx - 1.8, B.sh + 0.8, cx + 1.8, B.sh + 0.8, cx + 2.1, B.chest + 0.4, cx, B.chest + 3, cx - 2.1, B.chest + 0.4]);
      const fx = cx + B.hiW * 0.46, fy = B.hip + 2;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - 0.3; p.ell('#f8f4ec', fx + Math.cos(a) * 1.5, fy + Math.sin(a) * 1.5, 1.2, 1.2); }
      p.ell('#5a7ae8', fx, fy, 0.8, 0.8);
    }
    if ((v = accOf(L, 'thcorset'))) {
      p.rect(v, cx - 3.6, B.sh + 1.6, 7.2, 0.7);
      p.poly(v, [cx - 2.8, B.sh + 2.4, cx, B.chest + 3.4, cx + 2.8, B.sh + 2.4, cx + 2, B.sh + 2.4, cx, B.chest + 1.6, cx - 2, B.sh + 2.4]);
      p.ell('#8a5ae8', cx, B.chest + 3.8, 1, 1);
      p.poly(v, [cx - B.waW, B.waist - 1.6, cx + B.waW, B.waist - 3.4, cx + B.waW, B.waist - 2.4, cx - B.waW, B.waist - 0.6]);
    }
    if ((v = accOf(L, 'thkeys'))) for (const s of [-1, 1]) {
      const kx = cx + s * (B.hiW * 0.46);
      p.rect(v, kx - 0.4, B.knee + 9, 0.8, 2.6);
      p.ell(v, kx, B.knee + 8.6, 0.9, 0.9);
    }
    if ((v = accOf(L, 'keychoker'))) { p.rect(v, cx - 2, neckTop + 1.4, 4, 1); p.snap('#c8ccd4', cx - 0.4, neckTop + 2.4, 0.8, 1.6); }
    if ((v = accOf(L, 'shoulderfrill'))) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.ell(v, cx + s * (B.shW - 0.6 - i * 1.4), B.sh + 1.2, 0.9, 0.8);
    if ((v = accOf(L, 'diamonds'))) for (const [dx, dy] of [[-2.4, 3], [2.4, 3], [0, 6], [-3.6, 8], [3.6, 8]]) p.poly(v, [cx + dx, B.chest + dy - 1, cx + dx + 0.9, B.chest + dy, cx + dx, B.chest + dy + 1, cx + dx - 0.9, B.chest + dy]);
    if ((v = accOf(L, 'tie'))) { p.poly(v, [cx - 0.8, B.chest, cx + 0.8, B.chest, cx + 0.6, B.waist + 3, cx - 0.6, B.waist + 3]); p.poly(v, [cx - 0.4, B.waist + 2, cx + 2, B.waist + 4.4, cx + 1.2, B.waist + 5]); }
    if ((v = accOf(L, 'padlock'))) { p.poly(dark(v, 0.3), [cx - 2.6, B.sh + 3.4, cx + 2.6, B.sh + 3.4, cx + 2.2, B.chest + 0.6, cx, B.chest + 1.4, cx - 2.2, B.chest + 0.6]); p.poly(v, [cx - 2.2, B.sh + 3.6, cx + 2.2, B.sh + 3.6, cx + 1.8, B.chest + 0.2, cx, B.chest + 0.9, cx - 1.8, B.chest + 0.2]); p.snap('#5a4020', cx - 0.4, B.sh + 4.6, 0.8, 1); }
    if ((v = accOf(L, 'chains'))) for (const s of [-1, 1]) for (let i = 0; i < 4; i++) p.snap(v, cx + s * (2.6 + i * 1.3) - 0.3, B.chest - 0.6 + i * 1.6, 0.7, 0.7);
    if (accOf(L, 'ruffles')) for (let y = B.sh + 4; y < B.waist - 1; y += 1.8) p.snap(P.innerSh, cx - 0.5, y, 1, 0.8);
    if ((v = accOf(L, 'waistband'))) { p.rect(v, cx - B.waW - 0.8, B.waist - 1.4, (B.waW + 0.8) * 2, 1.4); p.rect('#f2f2f4', cx - B.waW - 0.8, B.waist - 0.8, (B.waW + 0.8) * 2, 0.4); }
    if ((v = accOf(L, 'pinkbelt'))) { p.poly('#c8a050', [cx - B.waW - 0.8, B.waist + 0.4, cx - B.waW - 0.6, B.waist + 1.4, cx + 2, B.waist + 0.4, cx + 1.8, B.waist - 0.4]); p.poly(v, [cx - 0.4, B.waist - 0.2, cx + 0.8, B.waist - 0.6, cx + B.hiW + 1, B.hip + 3, cx + B.hiW, B.hip + 3.6]); p.ell('#c8ccd4', cx + 0.4, B.waist - 0.2, 1, 1); }
    if ((v = accOf(L, 'thighbow'))) { const x = cx - B.legW * 0.6, y = B.hip + (L.skirtLen || 10) - 1; p.ell(dark(v, 0.15), x, y, 2.2, 1.6); p.ell(v, x - 0.4, y - 0.3, 1.8, 1.2); p.poly(v, [x - 0.6, y + 0.6, x + 0.6, y + 0.6, x + 0.8, y + 3, x - 0.2, y + 3]); }
    if ((v = accOf(L, 'feathers'))) {
      const x = cx - B.shW;
      for (const [dx, dy, a] of [[-0.6, -1.2, -0.9], [1.2, -2, -0.5], [-1.8, 0.6, -1.3]]) { p.ell(dark(v, 0.3), x + dx, B.sh + dy, 2.4, 0.9, a); p.ell(v, x + dx - 0.2, B.sh + dy - 0.2, 2, 0.6, a); }
      p.snap('#d8b050', x + 0.6, B.sh - 0.4, 0.8, 2.4);
    }
    if ((v = accOf(L, 'xstraps'))) {
      p.poly(v, [cx - B.waW - 0.8, B.chest + 2.6, cx + B.waW + 0.8, B.chest + 3.6, cx + B.waW + 0.8, B.chest + 4.6, cx - B.waW - 0.8, B.chest + 3.6]);
      p.poly(v, [cx - B.waW - 0.6, B.waist - 3, cx + B.waW + 0.6, B.waist - 4.4, cx + B.waW + 0.6, B.waist - 3.4, cx - B.waW - 0.6, B.waist - 2]);
      p.snap('#c8ccd4', cx - 2.4, B.chest + 2.8, 1.4, 1.2);
    }
    if ((v = accOf(L, 'tattoo'))) p.poly(v, [cx + 1.4, B.waist - 1.6, cx + 2.6, B.waist - 3.4, cx + 2, B.waist - 2.2, cx + 3, B.waist - 2.2, cx + 1.6, B.waist - 0.2, cx + 2.2, B.waist - 1.6]);
    if ((v = accOf(L, 'beltstrap'))) {
      p.rect(v, cx - B.waW - 0.8, B.waist - 0.4, (B.waW + 0.8) * 2, 1.4);
      p.snap('#c8ccd4', cx - 2.2, B.waist - 0.4, 1.4, 1.4);
      p.poly(v, [cx + 2.6, B.waist + 0.6, cx + 3.8, B.waist + 0.6, cx + 4.6, B.knee - 1, cx + 3.4, B.knee - 1]);
      for (let y = B.hip + 4; y < B.knee - 2; y += 2.6) p.snap('#8a8e9a', cx + 3.4 + (y - B.waist) * 0.03, y, 0.6, 0.6);
    }
    if ((v = accOf(L, 'pegs'))) for (let i = 0; i < 3; i++) p.poly(i % 2 ? dark(v, 0.2) : v, [cx - B.waW - 1 + i * 0.8, B.waist + 0.6, cx - B.waW - 0.6 + i * 0.8, B.waist + 0.6, cx - B.waW - 0.8 + i * 1, B.hip + 3 + i * 0.6, cx - B.waW - 1.2 + i * 1, B.hip + 3 + i * 0.6]);
    if ((v = accOf(L, 'vestclasp'))) for (const s of [-1, 1]) for (const y of [B.waist + 1, B.hip + 1.6]) { p.ell('#14141c', cx + s * 3.8, y, 1.1, 1.1); p.ell(v, cx + s * 3.8, y, 0.6, 0.6); }
    if ((v = accOf(L, 'leafclasp'))) for (const [dx, dy] of [[-2.4, 4], [2.4, 4], [-2.6, 6.6], [2.6, 6.6]]) p.poly(v, [cx + dx - 0.8, B.sh + dy, cx + dx, B.sh + dy - 0.8, cx + dx + 0.8, B.sh + dy, cx + dx, B.sh + dy + 0.8]);
    if ((v = accOf(L, 'jade'))) { p.ell(dark(v, 0.3), cx + 2.6, B.waist + 1.4, 1.2, 1.2); p.ell(v, cx + 2.5, B.waist + 1.2, 0.9, 0.9); }
    if ((v = accOf(L, 'thighorn'))) { const x = cx + 1 + B.legW * 0.5; p.poly(v, [x, B.hip + 4, x + 1.6, B.hip + 6.6, x + 0.6, B.hip + 6.4, x, B.hip + 10, x - 0.6, B.hip + 6.4, x - 1.6, B.hip + 6.6]); p.poly(dark(v, 0.3), [x - 0.3, B.hip + 6.4, x + 0.3, B.hip + 6.4, x, B.hip + 9.6]); }
    if ((v = accOf(L, 'neckstraps'))) for (const dx of [-1.6, 0, 1.6]) p.poly(v, [cx + dx - 0.35, neckTop + 1, cx + dx + 0.35, neckTop + 1, cx + dx * 1.8 + 0.4, B.sh + 1.4, cx + dx * 1.8 - 0.4, B.sh + 1.4]);
    if ((v = accOf(L, 'chestpouch'))) { p.poly(v, [cx - 4, B.sh + 0.4, cx - 2.8, B.sh, cx + B.waW + 1, B.chest + 3.6, cx + B.waW, B.chest + 4.4]); p.poly(v, [cx - 3, B.sh + 1.6, cx + 2.2, B.sh + 3, cx + 1.4, B.chest + 2.6, cx - 3.6, B.chest + 1.2]); p.rect(light(v, 0.25), cx - 2.6, B.sh + 2.2, 4, 0.6); p.snap('#d8b050', cx - 0.4, B.chest + 2, 1, 1); }
    if ((v = accOf(L, 'legstraps2'))) for (const s of [-1, 1]) { const x0 = s < 0 ? cx - B.legW - 0.6 : cx + 0.6; for (const y of [B.hip + 4, B.hip + 9]) { p.rect(v, x0, y, B.legW + 0.6, 1.4); p.snap('#8a8e9a', x0 + B.legW * 0.5 - 0.3, y + 0.3, 0.8, 0.8); } }
    if ((v = accOf(L, 'vial'))) { p.snap(v, cx - 0.7, B.sh + 0.4, 1.4, 1.6); p.snap('#d8b050', cx - 0.5, B.sh - 0.4, 1, 0.8); }
    if ((v = accOf(L, 'corset'))) { for (const dx of [-2.4, 2.4]) p.snap(v, cx + dx - 0.4, B.chest + 1, 0.8, 0.8); p.snap(v, cx - 0.4, B.chest + 3.6, 0.8, 0.8); }
    if ((v = accOf(L, 'shoulderbow'))) {
      const x = cx - B.shW - 0.4;
      p.poly(v, [x, B.sh + 0.6, x - 3, B.sh - 1.4, x - 2.6, B.sh + 2]); p.poly(v, [x, B.sh + 0.6, x + 2.4, B.sh - 1.8, x + 2.6, B.sh + 1.6]);
      p.poly(dark(v, 0.2), [x, B.sh + 1, x - 4.4, B.sh + 4.4, x - 3.6, B.sh + 5.2, x + 0.4, B.sh + 1.6]);
      p.snap(dark(v, 0.35), x - 0.5, B.sh, 1, 1);
    }
    if ((v = accOf(L, 'sigil'))) for (const y of [B.waist + 3, B.hip + 3]) { p.snap(v, cx - 2.6, y, 2.2, 0.6); p.snap(v, cx - 1.8, y - 1, 0.6, 2.6); }
    if ((v = accOf(L, 'bear'))) {
      const x = cx - B.hiW - 2.2, y = B.hip + 1;
      p.ell(dark(v, 0.25), x, y + 3.6, 2.4, 2.8);
      p.ell(v, x, y, 2.2, 2);
      p.ell(v, x - 1.6, y - 1.6, 0.9, 0.9); p.ell(v, x + 1.6, y - 1.6, 0.9, 0.9);
      p.ell(light(v, 0.4), x, y + 0.7, 1, 0.7);
      p.snap('#1e1416', x - 1.1, y - 0.4, 0.6, 0.6); p.snap('#1e1416', x + 0.5, y - 0.4, 0.6, 0.6);
    }
    if ((v = accOf(L, 'hourglass'))) {
      const x = cx + B.shW + 0.8, y = (B.wrist || B.waist + 1) + (B.hand || 3.6) - 1;
      p.poly(v, [x - 1.4, y, x + 1.4, y, x + 1.4, y + 0.6, x - 1.4, y + 0.6]); p.poly(v, [x - 1.4, y + 7, x + 1.4, y + 7, x + 1.4, y + 7.6, x - 1.4, y + 7.6]);
      p.poly('#b8e848', [x - 1, y + 0.6, x + 1, y + 0.6, x, y + 3.8]); p.poly('#b8e848', [x, y + 3.8, x + 1, y + 7, x - 1, y + 7]);
      p.rect(v, x - 1.5, y, 0.5, 7.6); p.rect(v, x + 1, y, 0.5, 7.6);
    }
    if ((v = accOf(L, 'zip'))) p.snap(v, cx - 0.5, neckTop + 1.2, 1, B.waist - neckTop - 2.6);
    if ((v = accOf(L, 'stars'))) for (const [dx, dy] of [[2.2, 3], [3.8, 4.6], [2.8, 6.6]]) p.snap(v, cx + dx, B.sh + dy, 0.8, 0.8);
    if ((v = accOf(L, 'flap'))) {
      p.rect(v, cx - B.waW - 0.6, B.waist - 2.4, (B.waW + 0.6) * 2, 2);
      p.rect(dark(v, 0.25), cx + 1, B.waist - 2.4, B.waW - 0.4, 2);
      p.poly(v, [cx - 6.2, B.waist - 0.6, cx - 1, B.waist - 0.6, cx - 1.4, B.hip + 3.4, cx - 3.6, B.hip + 5.4, cx - 5.8, B.hip + 3.4]);
      p.poly(light(v, 0.25), [cx - 6.2, B.waist - 0.6, cx - 5, B.waist - 0.6, cx - 4.8, B.hip + 3.8, cx - 5.8, B.hip + 3.4]);
      for (const y of [B.waist + 1, B.waist + 3.6]) p.snap('#d8b050', cx - 4, y, 1, 1);
    }
    if ((v = accOf(L, 'waistcorset'))) {
      p.poly(v, [cx - B.waW - 0.8, B.chest + 2.6, cx + B.waW + 0.8, B.chest + 2.6, cx + B.waW + 0.6, B.waist + 1.2, cx - B.waW - 0.6, B.waist + 1.2]);
      p.poly(light(v, 0.2), [cx - B.waW - 0.6, B.chest + 2.6, cx + B.waW + 0.6, B.chest + 2.6, cx + B.waW + 0.6, B.chest + 3.2, cx - B.waW - 0.6, B.chest + 3.2]);
      p.ell('#d8b050', cx, B.chest + 4.6, 1.2, 1.2); p.ell(v, cx, B.chest + 4.6, 0.5, 0.5);
      p.rect('#3a3a44', cx - B.waW - 0.6, B.waist - 0.4, B.waW * 2 + 1.2, 0.8);
    }
    if ((v = accOf(L, 'chainbelt'))) {
      const y = B.waist - 0.4;
      p.rect(v, cx - B.waW - 1, y, B.waW * 2 + 2, 1.8);
      for (let x = cx - B.waW; x < cx + B.waW; x += 1.8) p.snap('#9a9ca6', x, y + 0.6, 0.6, 0.6);
      p.rect('#c8ccd4', cx - 2.4, y - 0.2, 1.6, 2.2);
      for (let i = 0; i < 5; i++) p.ell('#b8bcc8', cx + B.waW - 0.4 + Math.sin(i * 0.9) * 0.8, y + 2.6 + i * 1.5, 0.9, 0.7);
    }
    if ((v = accOf(L, 'sneakers'))) for (const [x0, m] of [[cx - (L.legGap || 0) - B.legW, -1], [cx + 1 + (L.legGap || 0), 1]]) {
      p.rect(v, x0 + (m < 0 ? -0.6 : 0.6), FOOT - 2.4, B.legW + 0.4, 1.2);
      p.rect('#c8283a', x0 + (m < 0 ? B.legW - 1.2 : -0.2), FOOT - 2.2, 1.2, 1.4);
      p.rect('#f4f4f6', x0 + (m < 0 ? 0.6 : 1.4), B.ankle - 1.4, 1.6, 0.8);
    }
    if ((v = accOf(L, 'pantseam'))) for (const sd of [-1, 1]) { const x = cx + sd * ((L.legGap || 0) + B.legW * 0.55) + (sd > 0 ? 1 : 0); p.rect(v, x - 0.25, B.hip + 3, 0.5, B.ankle - B.hip - 6); }
    if ((v = accOf(L, 'kneeskull'))) { const x = cx - (L.legGap || 0) - B.legW * 0.5 - 0.4; p.ell(v, x, B.knee, 1.4, 1.2); p.snap('#1c1c22', x - 0.8, B.knee - 0.4, 0.6, 0.6); p.snap('#1c1c22', x + 0.2, B.knee - 0.4, 0.6, 0.6); }
    if ((v = accOf(L, 'revolvers'))) {
      const wr = B.wrist || B.waist + 1, hl = B.hand || 3.6;
      for (const sd of [-1, 1]) {
        const hx = cx + sd * (B.shW + 0.6), hy = wr + hl * 0.5, up = sd < 0;
        p.poly('#3a3c44', [hx - 1, hy - 1, hx + 1, hy - 1, hx + 1, hy + 1.4, hx - 1, hy + 1.4]);
        const y0 = up ? hy - 1 : hy + 1.4, y1 = up ? hy - 14 : hy + 13;
        p.poly(v, [hx - 0.9, y0, hx + 0.9, y0, hx + 0.9, y1, hx - 0.9, y1]);
        p.rect(light(v, 0.2), hx - 0.9, Math.min(y0, y1), 0.5, Math.abs(y1 - y0));
        p.poly('#4a4c56', [hx - 1.6, up ? hy - 3.6 : hy + 1.4, hx + 1.6, up ? hy - 3.6 : hy + 1.4, hx + 1.6, up ? hy - 1 : hy + 4, hx - 1.6, up ? hy - 1 : hy + 4]);
        p.rect('#c8283a', hx - 0.9, up ? hy - 5 : hy + 4.4, 1.8, 0.8);
        p.rect('#8a8c96', hx - 0.5, up ? y1 + 0.6 : y1 - 1.4, 1, 0.8);
      }
    }
    if ((v = accOf(L, 'furhem')) && L.low === 'shorts') for (const sd of [-1, 1]) {
      const y = B.hip + 4.4;
      p.poly(v, [cx + sd * 0.6, y, cx + sd * (B.hiW + 1.4), y, cx + sd * (B.hiW + 1.6), y + 1.6, cx + sd * (B.hiW * 0.5), y + 1.2, cx + sd * 0.8, y + 1.8]);
      p.snap(dark(v, 0.12), cx + sd * (B.hiW * 0.6) - 0.4, y + 0.6, 0.8, 0.8);
    }
    if ((v = accOf(L, 'ringbelt'))) {
      const y = B.waist + 0.4;
      p.poly(v, [cx - B.waW - 1, y, cx + B.waW + 1, y + 1.4, cx + B.waW + 1, y + 2.6, cx - B.waW - 1, y + 1.2]);
      p.ell('#c8b070', cx - B.waW + 1, y + 1.4, 1.2, 1.2); p.ell(v, cx - B.waW + 1, y + 1.4, 0.5, 0.5);
      p.rect('#c8b070', cx + 1.4, y + 0.8, 1.4, 1.2);
    }
    if ((v = accOf(L, 'bunnybag'))) {
      const x = cx - B.hiW - 1.4, y = B.waist + 1;
      p.poly(v, [x - 0.8, y - 3.6, x + 0.2, y - 6.6, x + 1, y - 3.4]);
      p.poly(v, [x + 1.6, y - 3.4, x + 3.2, y - 6.2, x + 3.4, y - 3]);
      p.ell(dark(v, 0.2), x + 1.4, y + 0.4, 3.4, 3.4);
      p.ell(v, x + 1.2, y, 3.2, 3.1);
      p.snap('#1c1c22', x, y - 0.8, 0.8, 0.8); p.snap('#e8402a', x + 1.8, y - 0.8, 0.9, 0.9);
    }
    if ((v = accOf(L, 'mechcase'))) {
      const hx = cx - B.shW - 1.2, hy = (B.wrist || B.waist + 1) + (B.hand || 3.6) * 0.7;
      p.poly(dark(v, 0.4), [hx - 1, hy - 0.4, hx + 0.6, hy - 0.4, hx + 0.6, hy + 1.4, hx - 1, hy + 1.4]);
      const bx = hx - 7.4, by = hy + 1.2, bw = 9.4, bh = 13;
      p.poly(v, [bx, by, bx + bw, by, bx + bw, by + bh, bx, by + bh]);
      p.poly(light(v, 0.14), [bx, by, bx + 1.2, by, bx + 1.2, by + bh, bx, by + bh]);
      for (const y of [by + 3, by + bh - 3.4]) p.rect(L.caseBand || '#1a1a20', bx, y, bw, 0.8);
      p.ell(L.caseGold || '#c8a050', bx + bw / 2, by + bh / 2, 3.2, 3.2);
      p.ell(v, bx + bw / 2, by + bh / 2, 2.4, 2.4);
      p.rect('#e8602a', bx + bw - 2.4, by + bh - 1.8, 1.6, 0.8);
    }
    if ((v = accOf(L, 'tagbelt'))) {
      const y = B.waist - 0.2;
      p.rect(v, cx - B.waW - 1, y, B.waW * 2 + 2, 1.2);
      p.rect('#c8ccd4', cx - 1, y - 0.1, 2, 1.4);
      p.rect('#e8602a', cx + B.waW - 1.6, y + 1.2, 1, 2.6);
      p.rect('#e8602a', cx + B.waW + 0.2, y + 1.2, 1, 2);
    }
    if ((v = accOf(L, 'tunicbelt'))) {
      const y = B.waist - 0.6;
      p.poly(v, [cx - B.waW - 0.8, y - 0.4, cx + B.waW + 0.8, y + 0.6, cx + B.waW + 0.8, y + 2.4, cx - B.waW - 0.8, y + 1.4]);
      p.poly(light(v, 0.22), [cx - B.waW - 0.8, y - 0.4, cx + B.waW + 0.8, y + 0.6, cx + B.waW + 0.8, y + 1.2, cx - B.waW - 0.8, y + 0.2]);
      const bx = cx + 2.4;
      p.poly('#b8a45a', [bx, y - 0.4, bx + 3, y - 0.2, bx + 3, y + 2.8, bx, y + 2.6]);
      p.poly(v, [bx + 0.9, y + 0.6, bx + 2, y + 0.7, bx + 2, y + 1.8, bx + 0.9, y + 1.7]);
      p.poly(light('#b8a45a', 0.35), [bx, y - 0.4, bx + 3, y - 0.2, bx + 3, y + 0.3, bx, y + 0.1]);
    }
    if ((v = accOf(L, 'hipbelt'))) {
      p.poly(dark(v, 0.2), [cx - B.waW - 0.8, B.waist - 1.2, cx - B.waW - 0.6, B.waist + 0.6, cx + B.hiW + 1, B.hip + 0.6, cx + B.hiW + 1, B.hip - 1]);
      p.poly(v, [cx - B.waW - 0.8, B.waist - 1.2, cx - B.waW - 0.7, B.waist, cx + B.hiW + 1, B.hip - 0.2, cx + B.hiW + 1, B.hip - 1]);
      p.snap('#d8b050', cx - 2, B.waist + 0.4, 1.6, 1.4);
    }
    if ((v = accOf(L, 'thighstrap'))) {
      p.rect(v, cx - B.legW - 0.4, B.hip + 6, B.legW + 0.6, 1.2);
      p.snap(L.lining || '#3a9c94', cx - B.legW - 1.2, B.hip + 5.4, 1.4, 2.2);
    }
    if ((v = accOf(L, 'bootstrap'))) for (const s of [-1, 1]) { const x = s < 0 ? cx - B.legW : cx + 1; p.rect(dark(v, 0.3), x, B.ankle - 4.6, B.legW - 0.4, 0.8); p.snap(v, x + B.legW * 0.5 - 0.5, B.ankle - 4.8, 1, 1.2); }
    if ((v = accOf(L, 'bowcase'))) {
      const x = cx + B.waW + 0.2, y = B.waist + 0.6, hy = B.hip + (L.skirtLen || 10);
      p.poly(v, [x - 1.4, y, x + 1.8, y - 0.6, x + 4.6, hy + 2.4, x + 2.6, hy + 4.2, x - 0.6, hy - 0.4]);
      p.poly(light(v, 0.2), [x - 1.4, y, x - 0.4, y - 0.2, x + 1.2, hy + 0.6, x - 0.6, hy - 0.4]);
      p.poly('#d8b050', [x + 2.2, hy + 1.6, x + 4.4, hy + 2.6, x + 2.6, hy + 4.2]);
      p.poly('#c86030', [x + 0.6, y - 0.4, x + 1.8, y - 0.6, x + 2.6, y + 5.4, x + 1.4, y + 5.6]);
    }
    if (accOf(L, 'halter')) for (const sd of [-1, 1]) p.snap('#1c1a20', cx + sd * 1.4 - (sd < 0 ? 0.6 : 0), neckTop + 2.4, 0.6, B.sh - neckTop - 2.4);
    if ((v = accOf(L, 'clover'))) { p.snap(v, cx + 4.2, B.sh + 3.4, 1.6, 1.6); p.snap('#6ab8ec', cx + 4.6, B.sh + 3.8, 0.8, 0.8); }
    if (accOf(L, 'camera')) { p.rect('#5ac2d6', cx + 2.5, B.waist + 1, 4.6, 3.4); p.rect('#1c2a3a', cx + 4, B.waist + 1.8, 1.8, 1.8); p.rect('#f0f0f4', cx + 2.8, B.waist + 1.2, 1, 0.8); }
    if (accOf(L, 'cane')) { p.rect('#2a2226', cx - B.shW - 2.2, B.waist + 2, 1.2, FOOT - B.waist - 2); p.rect('#c8a050', cx - B.shW - 2.6, B.waist + 1.2, 2, 1.2); }
    if ((v = accOf(L, 'braidrings')) && L.back === 'twin') for (const s of [-1, 1]) p.rect(v, cx + s * 10 - 1.6, B.waist + 1, 3.2, 1.4);
    if ((v = accOf(L, 'sheath'))) {
      const sx = cx + B.hiW - 1, sy = B.waist + 2.4;
      p.poly('#c8ccd8', [sx - 7.4, sy - 4.8, sx - 6.2, sy - 5.8, sx + 0.4, sy - 0.6, sx - 0.8, sy + 0.6]);
      for (let k = 0; k < 3; k++) p.poly('#2a2c3a', [sx - 6 + k * 2, sy - 4.4 + k * 1.6, sx - 5.2 + k * 2, sy - 5 + k * 1.6, sx - 4.6 + k * 2, sy - 4.4 + k * 1.6, sx - 5.4 + k * 2, sy - 3.8 + k * 1.6]);
      p.ell('#d8b050', sx, sy, 1.6, 1.2, 0.7);
      p.poly(v, [sx - 0.2, sy + 0.4, sx + 1.2, sy - 0.6, sx + 13.4, B.knee + 7.4, sx + 12, B.knee + 8.4]);
      p.poly(light(v, 0.35), [sx + 0.6, sy - 0.2, sx + 1.2, sy - 0.6, sx + 13.4, B.knee + 7.4, sx + 12.8, B.knee + 7.6]);
      for (const t of [0.35, 0.62]) { const x = sx + 0.5 + 12.5 * t, y = sy + (B.knee + 8 - sy) * t; p.poly('#5a5c68', [x - 1, y + 0.4, x + 0.6, y - 0.8, x + 1.2, y, x - 0.4, y + 1.2]); }
    }
    if ((v = accOf(L, 'katana'))) {
      const sx = cx + B.waW + 0.2, sy = B.waist + 2;
      p.poly(v, [sx - 0.6, sy + 0.4, sx + 0.8, sy - 0.4, sx + 5.6, B.hip + 13, sx + 4.2, B.hip + 13.6]);
      p.poly(light(v, 0.3), [sx + 0.2, sy, sx + 0.8, sy - 0.4, sx + 5.6, B.hip + 13, sx + 5, B.hip + 13.2]);
      p.poly('#c8a050', [sx + 3.8, B.hip + 11.6, sx + 5.4, B.hip + 11, sx + 5.6, B.hip + 13, sx + 4.2, B.hip + 13.6]);
      p.poly('#3a2a22', [sx - 5, sy - 3.2, sx - 4.2, sy - 4, sx - 0.2, sy - 0.6, sx - 1, sy + 0.2]);
      for (let k = 0; k < 2; k++) p.snap('#a88a6a', sx - 3.6 + k * 1.6, sy - 2.8 + k * 1.3, 0.8, 0.8);
      p.ell('#c8a050', sx - 0.4, sy - 0.2, 1.3, 0.9, 0.75);
    }
    if ((v = accOf(L, 'voltblade'))) {
      const hx = cx + B.shW + 0.5, hy = (B.wrist || B.waist + 1) + (B.hand || 3.6) * 0.6, glow = L.glow || '#c8f040';
      p.poly('#26282e', [hx - 1, hy - 3.6, hx + 0.6, hy - 4, hx + 1.2, hy + 0.6, hx - 0.4, hy + 1]);
      p.poly('#3a3c44', [hx - 2.6, hy + 0.2, hx + 2.8, hy - 0.8, hx + 3, hy + 1, hx - 2.4, hy + 2]);
      p.rect('#e8502a', hx + 1, hy - 0.2, 1.4, 1.6);
      const bl = [hx - 1.2, hy + 1.6, hx + 2, hy + 1, hx + 11.4, B.ankle - 3, hx + 9.4, B.ankle + 0.4];
      p.poly(v, bl);
      p.poly(glow, [hx - 0.1, hy + 2.2, hx + 1.2, hy + 1.8, hx + 10.6, B.ankle - 2.2, hx + 9.4, B.ankle - 1.2]);
      p.poly('#d8c070', [hx + 11.4, B.ankle - 3, hx + 9.4, B.ankle + 0.4, hx + 12, B.ankle + 0.8]);
    }
    if ((v = accOf(L, 'sword') || accOf(L, 'naginata'))) {
      const hx = cx + B.shW + 0.5, hy = (B.wrist || B.waist + 1) + (B.hand || 3.6) * 0.6;
      p.poly('#2a2c3a', [hx - 1.2, hy - 4, hx + 0.4, hy - 4.4, hx + 1.2, hy + 0.6, hx - 0.4, hy + 1]);
      p.poly('#d8b050', [hx - 2.4, hy + 0.4, hx + 2.6, hy - 0.6, hx + 2.8, hy + 0.8, hx - 2.2, hy + 1.8]);
      p.poly(v, [hx - 0.6, hy + 1.4, hx + 1.4, hy + 1, hx + 9, B.ankle - 2, hx + 8.2, B.ankle]);
      p.poly(light(v, 0.5), [hx + 0.6, hy + 1.2, hx + 1.4, hy + 1, hx + 9, B.ankle - 2]);
    }
  }

  function specialFigure(g, k, L) {
    if (L.style === 'svarog') return G.svarogArt(pen(g, 0.66 * k, (24 - 33) * k, (FOOT - 64) * k), 0);
    if (L.style === 'pompom') return pomArt(pen(g, 0.58 * k, (24 - 29) * k, (FOOT - 58) * k), L, 1 / (0.58 * k));
    const p = pen(g, k, 0, 0);
    if (L.style === 'beetlebot') {
      p.rect(dark(L.top, 0.4), 8, 76, 6, 14); p.rect(dark(L.top, 0.4), 34, 76, 6, 14); p.rect(dark(L.top, 0.4), 14, 80, 5, 10); p.rect(dark(L.top, 0.4), 29, 80, 5, 10);
      p.ell(dark(L.top, 0.3), 24, 68, 18, 14); p.ell(L.top, 24, 66, 17, 13); p.ell(light(L.top, 0.35), 18, 60, 6, 4);
      p.rect(L.trim, 7, 66, 34, 3);
      p.rect('#141418', 12, 60, 24, 6); p.rect(L.eye, 15, 62, 18, 2.4);
      p.rect(L.trim, 22, 46, 3, 8); p.ell(L.eye, 23.5, 45, 2.4, 2.4);
      return;
    }
    if (L.style === 'trotter') {
      p.ell(dark(L.top, 0.35), 24, 76, 18, 14); p.ell(L.top, 24, 74, 17, 13); p.ell(L.trim, 18, 68, 6, 4);
      p.poly(L.top, [10, 66, 8, 54, 17, 62]); p.poly(L.top, [38, 66, 40, 54, 31, 62]);
      p.ell(dark(L.top, 0.15), 24, 80, 6, 4); p.ell('#141418', 18, 72, 1.8, 2); p.ell('#141418', 30, 72, 1.8, 2);
      p.rect(dark(L.top, 0.35), 14, 86, 4, 6); p.rect(dark(L.top, 0.35), 30, 86, 4, 6);
      return;
    }
    if (L.style === 'cookbot') {
      p.ell(dark(L.top, 0.3), 24, 70, 15, 14); p.ell(L.top, 24, 69, 14, 13); p.rect(L.trim, 16, 54, 16, 3);
      p.ell(L.top, 24, 44, 11, 9); p.ell('#0c1420', 24, 45, 8, 5.4); p.rect(L.eye, 19, 42, 3, 3); p.rect(L.eye, 26, 42, 3, 3); p.rect(L.eye, 21, 47, 6, 1.4);
      p.rect(L.hair, 17, 30, 14, 5); p.ell(L.hair, 20, 29, 4, 3.6); p.ell(L.hair, 24, 27.5, 4.6, 3.8); p.ell(L.hair, 28, 29, 4, 3.6);
      p.rect('#3a3e48', 15, 82, 6, 8); p.rect('#3a3e48', 27, 82, 6, 8);
      return;
    }
    p.poly(L.top, [12, 92, 12, 40, 18, 34, 30, 34, 36, 40, 36, 92]);
    p.poly(L.hair, [15, 34, 15, 14, 19, 8, 29, 8, 33, 14, 33, 34]);
    p.rect('#101014', 17, 18, 14, 6); p.rect(L.eye, 18, 20, 12, 2);
    p.ell(L.trim, 24, 52, 3.5, 3.5);
    p.rect(dark(L.top, 0.3), 8, 42, 4, 30); p.rect(dark(L.top, 0.3), 36, 42, 4, 30);
  }

  function figureCanvas(look, k) { const s = k || 1; return memo(look, 'f' + s, () => figureBuild(look, s)); }

  function figureBuild(look, k) {
    const key = 'fig|' + k + '|' + JSON.stringify(look);
    let out = cache.get(key);
    if (out) return out;
    const src = G.mkCanvas(FIG_W * k * SS, FIG_H * k * SS), g = src.getContext('2d');
    const P = paletteOf(look);
    if (look.style) specialFigure(g, k, look);
    else {
      const B = BODIES[look.body] || BODIES.m;
      const body = pen(g, k, 0, 0);
      const head = pen(g, B.hu * k, (24 - 32 * B.hu) * k, (B.head - 8 * B.hu) * k);
      head.fig = true;
      figBackHair(body, P, look, B);
      figBackAcc(body, P, look, B);
      figure(body, P, look, B);
      backAcc(head, P, look);
      hairCap(head, P, look);
      paintHead(head, P, look);
    }
    out = downsample(src, FIG_W * k, FIG_H * k, true);
    cache.set(key, out);
    return out;
  }

  function spriteCanvas(look, dir, frame, opts = {}) { return memo(look, 's' + dir + frame + (opts.tint || ''), () => spriteBuild(look, dir, frame, opts)); }

  function spriteBuild(look, dir, frame, opts) {
    const key = 'spr|' + JSON.stringify(look) + '|' + dir + '|' + frame + '|' + (opts.tint || '');
    let out = cache.get(key);
    if (out) return out;
    const big = look.style === 'svarog', W = big ? 26 : 18, Hh = big ? 36 : 26;
    const c = G.mkCanvas(W, Hh), g = c.getContext('2d');
    const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x + 1, y + 1, w, h); };
    if (look.style) spriteSpecial(R, look, dir, frame);
    else spriteBody(R, paletteOf(look), look, dir, frame);
    const up = G.mkCanvas(W, Hh), ug = up.getContext('2d');
    ug.drawImage(downsampleSprite(c, W, Hh), 0, 0);
    if (opts.tint) { ug.globalCompositeOperation = 'source-atop'; ug.fillStyle = opts.tint; ug.fillRect(0, 0, W, Hh); ug.globalCompositeOperation = 'source-over'; }
    out = G.mkCanvas(W * 2, Hh * 2);
    const og = out.getContext('2d');
    og.imageSmoothingEnabled = false;
    og.drawImage(up, 0, 0, W * 2, Hh * 2);
    cache.set(key, out);
    return out;
  }

  function downsampleSprite(c, w, h) {
    const g = c.getContext('2d'), img = g.getImageData(0, 0, w, h), d = img.data, s = d.slice(), ink = rgb(INK);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      if (s[o + 3]) continue;
      let n = -1;
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = (ny * w + nx) * 4;
        if (s[q + 3] > 200) { n = q; break; }
      }
      if (n < 0) continue;
      d[o] = s[n] + (ink[0] - s[n]) * 0.78; d[o + 1] = s[n + 1] + (ink[1] - s[n + 1]) * 0.78; d[o + 2] = s[n + 2] + (ink[2] - s[n + 2]) * 0.78; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  }

  function spriteSpecial(R, L, dir, frame) {
    if (L.style === 'terminal') {
      R(2, 5, 12, 17, '#2a3040'); R(3, 6, 10, 8, '#081018'); R(4, 7, 8, 6, dark(L.hair, 0.4));
      R(5, 8, 5, 1, L.hair); R(5, 10, 3, 1, L.hair); R(2, 16, 12, 2, '#4a5468'); R(4, 18, 8, 4, '#3a4050');
      return;
    }
    if (L.style === 'svarog') return spriteSvarog(R, dir);
    if (L.style === 'pompom') spritePom(R, L, dir, frame);
    if (L.style === 'cookbot') spriteCookbot(R, L, dir, frame);
    if (L.style === 'dog') spriteDog(R, L, dir, frame);
    if (L.style === 'beetlebot') spriteBeetlebot(R, L, dir, frame);
    if (L.style === 'trotter') spriteTrotter(R, L, dir, frame);
  }

  function spriteTrotter(R, L, dir, frame) {
    const gd = L.top, hi = L.trim, dk = dark(L.top, 0.35), st = frame % 2;
    R(3, 24, 10, 1, 'rgba(0,0,0,0.25)');
    R(4, 21, 2, 3 - st, dk); R(10, 21, 2, 2 + st, dk);
    R(2, 13, 12, 9, dk); R(2, 12, 12, 9, gd); R(4, 12, 5, 3, hi);
    R(3, 10, 2, 3, gd); R(11, 10, 2, 3, gd);
    if (dir !== 'up') { const sx = dir === 'left' ? 2 : dir === 'right' ? 9 : 5; R(sx, 16, 5, 3, dark(gd, 0.15)); R(sx + 1, 17, 1, 1, dk); R(sx + 3, 17, 1, 1, dk); R(dir === 'right' ? 8 : dir === 'left' ? 4 : 4, 14, 1, 1, '#141418'); R(dir === 'right' ? 12 : dir === 'left' ? 7 : 11, 14, 1, 1, '#141418'); }
    R(6, 11, 4, 1, hi);
  }

  function spriteBeetlebot(R, L, dir, frame) {
    const st = frame % 2, dk = dark(L.top, 0.35);
    R(2, 24, 12, 1, 'rgba(0,0,0,0.25)');
    R(2, 20, 2, 4 - st, dk); R(12, 20, 2, 3 + st, dk); R(5, 21, 2, 3 + st, dk); R(9, 21, 2, 3 - st, dk);
    R(1, 12, 14, 9, dk); R(2, 11, 12, 9, L.top); R(3, 11, 4, 2, light(L.top, 0.35));
    R(1, 18, 14, 1, L.trim);
    if (dir !== 'up') { const sx = dir === 'left' ? 2 : dir === 'right' ? 6 : 4; R(sx, 14, 8, 3, '#141418'); R(sx + 1, 15, 6, 1, L.eye); }
    R(7, 7, 2, 4, L.trim); R(7, 6, 2, 1, L.eye);
  }

  function spriteDog(draw, L, dir, frame) {
    const fur = L.hair, dk = dark(L.hair, 0.16), hi = '#ffffff', step = frame % 2, side = dir === 'left' || dir === 'right';
    const R = (x, y, w, h, col) => draw(dir === 'left' ? 16 - x - w : x, y, w, h, col);
    R(2, 24, 12, 1, 'rgba(0,0,0,0.25)');
    if (side) {
      R(2, 21, 2, 3 - step, dk); R(5, 21, 2, 2 + step, fur); R(10, 21, 2, 3 - step, dk); R(12, 21, 2, 2 + step, fur);
      R(2, 15, 11, 7, dk); R(2, 14, 11, 6, fur); R(3, 14, 6, 2, hi);
      R(0, 11, 4, 4, fur); R(1, 10, 2, 2, fur); R(0, 12, 1, 2, hi);
      R(9, 9, 7, 7, dk); R(9, 8, 7, 7, fur); R(10, 8, 3, 2, hi);
      R(10, 5, 2, 4, fur); R(14, 5, 2, 4, dk); R(10, 6, 1, 2, L.trim);
      R(14, 10, 1, 1, '#141418'); R(15, 12, 1, 1, '#2a2a30'); R(13, 13, 2, 1, '#ff8aa0');
      R(8, 15, 3, 1, L.top);
      return;
    }
    R(4, 21, 3, 3 - step, fur); R(9, 21, 3, 2 + step, fur); R(4, 23 - step, 3, 1, dk); R(9, 22 + step, 3, 1, dk);
    R(3, 14, 10, 8, dk); R(3, 13, 10, 8, fur); R(4, 13, 4, 3, hi);
    if (dir === 'up') { R(7, 10, 3, 4, fur); R(8, 8, 2, 3, hi); }
    R(3, 6, 10, 9, dk); R(3, 5, 10, 9, fur); R(4, 5, 4, 3, hi);
    R(3, 2, 3, 4, fur); R(10, 2, 3, 4, fur); R(4, 3, 1, 2, L.trim); R(11, 3, 1, 2, L.trim);
    R(3, 14, 10, 1, L.top);
    if (dir === 'down') { R(5, 9, 1, 2, '#141418'); R(10, 9, 1, 2, '#141418'); R(7, 11, 2, 1, '#2a2a30'); R(7, 13, 2, 1, '#ff8aa0'); }
  }

  function spriteCookbot(R, L, dir, frame) {
    const bob = frame % 2;
    R(4, 24, 10, 1, 'rgba(0,0,0,0.25)');
    R(4, 21, 3, 3, '#3a3e48'); R(11, 21, 3, 3, '#3a3e48'); R(5, 22, 1, 1, '#8a8e9a'); R(12, 22, 1, 1, '#8a8e9a');
    R(3, 13 + bob, 12, 8, dark(L.top, 0.2)); R(4, 13 + bob, 10, 7, L.top); R(4, 13 + bob, 3, 2, light(L.top, 0.4));
    R(5, 12 + bob, 8, 1, L.trim); R(8, 12 + bob, 2, 1, '#ffd060');
    if (dir !== 'up') { R(4, 16 + bob, 10, 1, dark(L.top, 0.25)); R(6, 17 + bob, 6, 2, '#c8ccd8'); }
    R(4, 5 + bob, 10, 7, dark(L.top, 0.15)); R(5, 5 + bob, 8, 6, L.top);
    if (dir !== 'up') {
      const sx = dir === 'left' ? 4 : dir === 'right' ? 6 : 5;
      R(sx, 6 + bob, 8, 4, '#0c1420'); R(sx + 1, 7 + bob, 2, 1, L.eye); R(sx + 5, 7 + bob, 2, 1, L.eye); R(sx + 2, 9 + bob, 4, 1, L.eye);
    }
    R(3, 7 + bob, 1, 3, L.trim); R(14, 7 + bob, 1, 3, L.trim);
    R(5, 2 + bob, 8, 3, L.hair); R(4, 1 + bob, 3, 2, L.hair); R(8, 0 + bob, 3, 2, L.hair); R(11, 1 + bob, 3, 2, L.hair); R(5, 4 + bob, 8, 1, dark(L.hair, 0.15));
  }

  function spriteSvarog(draw, dir) {
    const S = G.SVAROG, flip = dir === 'left';
    const R = (x, y, w, h, col) => draw(flip ? 24 - x - w : x, y, w, h, col);
    const { P, Ph, Pd, W, Ws, C, Ch, Cd, L, Ls, Rd, Rk, T, Td, Sh, Fu, Fh, Gr, Grh, E, Eh } = S;
    R(2, 33, 20, 1, 'rgba(0,0,0,0.25)');
    const shoes = (a, b) => { R(a, 31, 5, 2, Sh); R(b, 31, 5, 2, Sh); R(a + 1, 31, 2, 1, '#3c3c48'); R(b + 1, 31, 2, 1, '#3c3c48'); };
    const arm = (x, shade) => {
      R(x + 1, 9, 3, 3, P); R(shade ? x + 3 : x + 1, 9, 1, 3, shade ? Pd : Ph);
      R(x + 1, 12, 3, 1, W);
      R(x, 13, 5, 4, P); R(x, 13, 1, 4, shade ? Ph : Pd); R(x + 4, 13, 1, 4, shade ? Pd : Ph); R(x, 15, 5, 1, Ws);
      R(x, 17, 5, 3, P); R(x, 17, 5, 1, Ph); R(x + 1, 18, 1, 2, Pd); R(x + 3, 18, 1, 2, Pd);
    };
    const pauldron = x => { R(x + 1, 5, 4, 1, Ph); R(x, 6, 6, 2, P); R(x + 4, 6, 2, 2, Pd); R(x, 8, 6, 1, Pd); };
    if (dir === 'down' || dir === 'up') {
      R(7, 19, 4, 12, T); R(13, 19, 4, 12, T); R(9, 19, 6, 3, T); R(10, 22, 1, 9, Td); R(16, 22, 1, 9, Td);
      shoes(6, 13);
      R(4, 6, 16, 4, C); R(3, 10, 18, 6, C); R(2, 16, 20, 5, C); R(1, 21, 22, 3, C); R(1, 24, 6, 1, C); R(17, 24, 6, 1, C);
      R(19, 10, 2, 6, Cd); R(20, 16, 2, 5, Cd); R(21, 21, 2, 4, Cd); R(3, 10, 1, 6, Ch); R(2, 16, 1, 5, Ch);
      R(1, 23, 3, 2, Gr); R(1, 23, 3, 1, Grh); R(20, 23, 3, 2, Gr); R(20, 23, 3, 1, Grh);
      if (dir === 'up') {
        R(7, 21, 10, 3, C); R(11, 18, 2, 6, Cd); R(11, 6, 2, 12, Ch);
        arm(16, true); arm(3, false); pauldron(15); pauldron(3);
        R(6, 3, 12, 3, Fu); R(5, 5, 3, 1, Fu); R(16, 5, 3, 1, Fu); R(8, 3, 2, 1, Fh); R(14, 4, 2, 1, Fh);
        R(11, 0, 2, 1, P); R(10, 1, 4, 1, P); R(9, 2, 6, 3, P); R(9, 2, 2, 3, Ph); R(14, 2, 1, 3, Pd); R(11, 1, 1, 4, Pd);
        return;
      }
      R(4, 10, 2, 11, L); R(5, 10, 1, 11, Ls); R(4, 21, 2, 2, Rd); R(4, 23, 2, 1, Rk);
      R(12, 5, 2, 3, L); R(13, 8, 2, 4, L); R(14, 12, 2, 4, L); R(15, 16, 3, 4, L); R(16, 20, 3, 1, L); R(16, 21, 3, 2, Rd); R(16, 23, 3, 1, Rk);
      R(13, 8, 1, 4, Ls); R(14, 12, 1, 4, Ls); R(15, 16, 1, 4, Ls);
      R(8, 6, 8, 4, P); R(8, 6, 3, 3, Ph); R(14, 6, 2, 4, Pd);
      R(9, 9, 6, 1, W); R(10, 9, 1, 1, Pd); R(13, 9, 1, 1, Pd);
      R(9, 10, 6, 3, Pd); R(10, 10, 4, 2, P); R(11, 10, 2, 2, W);
      R(9, 13, 6, 3, P); R(9, 13, 2, 3, Ph); R(13, 13, 2, 3, Pd); R(11, 14, 2, 1, W); R(10, 16, 4, 1, P); R(11, 17, 2, 1, Pd);
      R(7, 15, 2, 4, P); R(7, 15, 1, 3, Ph); R(15, 15, 2, 4, P); R(16, 15, 1, 3, Pd);
      R(8, 3, 2, 3, Pd); R(14, 3, 2, 3, Pd);
      arm(16, true); arm(3, false); pauldron(15); pauldron(3);
      R(6, 4, 3, 2, Fu); R(15, 4, 3, 2, Fu); R(5, 5, 2, 1, Fu); R(17, 5, 2, 1, Fu); R(7, 4, 1, 1, Fh); R(16, 4, 1, 1, Fh);
      R(11, 0, 1, 1, Ph); R(12, 0, 1, 1, P); R(10, 1, 4, 1, P); R(10, 1, 1, 1, Ph); R(13, 1, 1, 1, Pd);
      R(9, 2, 6, 3, P); R(9, 2, 2, 3, Ph); R(14, 2, 1, 3, Pd);
      R(11, 2, 2, 2, E); R(11, 2, 1, 1, Eh); R(11, 4, 2, 1, Pd);
      R(10, 5, 4, 1, P); R(11, 5, 2, 1, W);
      return;
    }
    R(9, 19, 5, 12, T); R(9, 22, 1, 9, Td); R(9, 31, 6, 2, Sh); R(12, 31, 2, 1, '#3c3c48');
    R(6, 5, 8, 5, C); R(5, 10, 10, 6, C); R(4, 16, 11, 5, C); R(3, 21, 11, 3, C);
    R(6, 5, 2, 5, Ch); R(5, 10, 2, 6, Ch); R(4, 16, 2, 5, Ch); R(3, 21, 2, 3, Ch);
    R(3, 23, 3, 2, Gr); R(3, 23, 3, 1, Grh);
    R(12, 6, 4, 4, P); R(12, 6, 2, 2, Ph); R(15, 9, 1, 1, W); R(12, 10, 4, 3, Pd); R(13, 10, 2, 2, P); R(12, 13, 4, 3, P); R(14, 13, 2, 3, Pd); R(13, 16, 2, 2, P);
    R(14, 16, 2, 3, P); R(15, 16, 1, 3, Pd);
    R(15, 8, 1, 6, L); R(16, 14, 1, 6, L); R(15, 20, 3, 1, L); R(14, 20, 1, 4, L); R(15, 21, 3, 2, Rd); R(14, 23, 4, 1, Rk);
    R(7, 3, 6, 3, Fu); R(6, 5, 3, 1, Fu); R(8, 3, 2, 1, Fh);
    R(10, 0, 3, 1, P); R(10, 1, 4, 1, P); R(10, 2, 5, 3, P); R(10, 1, 1, 4, Pd); R(11, 1, 1, 1, Ph); R(12, 2, 1, 1, Ph);
    R(14, 2, 1, 2, E); R(14, 2, 1, 1, Eh); R(13, 4, 2, 1, Pd); R(12, 5, 3, 1, P); R(13, 5, 2, 1, W);
    R(9, 9, 3, 3, P); R(9, 9, 1, 3, Ph); R(9, 12, 3, 1, W);
    R(8, 13, 5, 4, P); R(8, 13, 1, 4, Ph); R(12, 13, 1, 4, Pd); R(8, 15, 5, 1, Ws);
    R(8, 17, 5, 3, P); R(8, 17, 5, 1, Ph); R(10, 18, 1, 2, Pd);
    R(9, 5, 4, 1, Ph); R(8, 6, 6, 2, P); R(12, 6, 2, 2, Pd); R(8, 8, 6, 1, Pd);
  }

  function spritePomPajamas(draw, L, dir, frame) {
    const side = dir === 'left' || dir === 'right', flip = dir === 'left', back = dir === 'up';
    const R = (x, y, w, h, col) => draw(flip ? 17 - x - w : x, y, w, h, col);
    const BL = L.top, BLs = mix(BL, '#3a5e94', 0.45), WT = L.stripe, WTs = mix(WT, BL, 0.5), CAP = L.cap, CAPs = mix(CAP, '#3a5e94', 0.45);
    const GOLD = L.trim, DK = L.ear, DKs = mix(DK, '#0c0a12', 0.3), FUR = L.hair, FURs = mix(FUR, '#9c8ea4', 0.3), IN = mix(FUR, '#d4c6bc', 0.45);
    const RUF = L.beard, RUFs = mix(RUF, '#9c9ab0', 0.3), CR = L.bib, GEM = L.gem, INK = '#1c1622', PAW = '#f6f2ea';
    const l1 = frame === 1 ? 1 : 0, l3 = frame === 3 ? 1 : 0;
    const gown = (x0, w, shadeX) => { for (let x = x0; x < x0 + w; x++) R(x, 13, 1, 7, x === shadeX ? (x % 2 ? WTs : BLs) : (x % 2 ? WT : BL)); };
    if (!side) {
      R(3, 22, 11, 1, 'rgba(0,0,0,0.25)');
      for (const s of [-1, 1]) {
        const X = (x, w) => (s < 0 ? x : 17 - x - w);
        R(X(2, 2), 7, 2, 5, DK); R(X(1, 3), 12, 3, 6, DK); R(X(1, 3), 18, 3, 2, DK); R(X(1, 2), 20, 2, 1, DK);
        if (!back) { R(X(3, 1), 7, 1, 6, IN); R(X(3, 1), 18, 1, 2, IN); }
      }
      R(6, 20, 2, 1 - l1, back ? DKs : DK); R(9, 20, 2, 1 - l3, back ? DK : DKs);
      R(6, 21 - l1, 2, 1, PAW); R(9, 21 - l3, 2, 1, PAW);
      gown(4, 9, back ? 4 : 12);
      R(4, 19, 9, 1, BLs);
      R(3, 13, 1, 4, back ? BLs : BL); R(13, 13, 1, 4, back ? BL : BLs); R(3, 17, 1, 1, RUF); R(13, 17, 1, 1, RUFs); R(3, 18, 1, 1, PAW); R(13, 18, 1, 1, PAW);
      if (back) {
        R(4, 7, 9, 4, DK); R(5, 11, 7, 1, FURs); R(4, 12, 9, 1, RUF);
        R(6, 0, 5, 1, CAP); R(5, 1, 7, 5, CAP); R(5, 1, 1, 5, CAPs); R(12, 2, 1, 4, CAP); R(13, 4, 1, 3, CAP);
        R(4, 6, 9, 1, GOLD);
        R(13, 6, 3, 3, RUF); R(13, 8, 3, 1, RUFs);
        return;
      }
      R(6, 13, 5, 1, CR); R(7, 14, 1, 1, CR); R(9, 14, 1, 1, CR); R(9, 16, 1, 1, GOLD);
      R(4, 7, 9, 5, FUR); R(4, 12, 9, 1, RUF);
      R(7, 7, 3, 1, DK); R(8, 8, 1, 1, DK);
      R(5, 8, 2, 1, INK); R(10, 8, 2, 1, INK);
      R(5, 9, 2, 2, L.eye); R(10, 9, 2, 2, L.eye); R(5, 9, 1, 1, '#ffffff'); R(10, 9, 1, 1, '#ffffff'); R(6, 10, 1, 1, '#1c3c94'); R(11, 10, 1, 1, '#1c3c94');
      R(4, 10, 1, 1, '#f4a0aa'); R(12, 10, 1, 1, '#f4a0aa'); R(8, 11, 1, 1, '#c4848c');
      R(6, 0, 5, 1, CAP); R(5, 1, 7, 5, CAP); R(11, 1, 1, 5, CAPs); R(12, 2, 1, 4, CAPs); R(4, 2, 1, 4, CAP); R(3, 3, 1, 3, CAP); R(2, 5, 1, 2, CAPs);
      R(4, 6, 9, 1, GOLD);
      R(9, 2, 1, 3, GOLD); R(10, 4, 2, 1, GOLD); R(10, 3, 1, 1, GEM);
      R(0, 7, 3, 3, RUF); R(0, 9, 3, 1, RUFs); R(2, 7, 1, 1, RUFs);
      return;
    }
    R(3, 22, 10, 1, 'rgba(0,0,0,0.25)');
    R(4, 7, 2, 6, DK); R(3, 13, 2, 5, DK); R(2, 18, 3, 2, DK); R(1, 20, 2, 1, DK); R(4, 18, 1, 2, IN);
    R(8, 20, 2, 1 - l3, DKs); R(6, 20, 2, 1 - l1, DK);
    R(8, 21 - l3, 3, 1, PAW); R(6, 21 - l1, 3, 1, PAW);
    gown(5, 7, 5);
    R(5, 19, 7, 1, BLs);
    R(10, 13, 2, 2, CR); R(10, 16, 1, 1, GOLD);
    R(7, 14, 2, 3, BL); R(8, 14, 1, 3, WT); R(7, 17, 2, 1, RUF); R(7, 18, 2, 1, PAW);
    R(5, 7, 7, 5, FUR); R(5, 7, 2, 1, DK); R(6, 8, 1, 3, IN); R(5, 12, 7, 1, RUF);
    R(9, 7, 2, 1, DK);
    R(9, 8, 2, 1, INK); R(10, 9, 1, 2, L.eye); R(10, 9, 1, 1, '#ffffff');
    R(11, 10, 1, 1, '#f4a0aa');
    R(6, 0, 5, 1, CAP); R(5, 1, 7, 5, CAP); R(5, 1, 1, 5, CAPs); R(4, 2, 1, 4, CAP); R(3, 4, 1, 3, CAP);
    R(5, 6, 8, 1, GOLD);
    R(9, 2, 1, 2, GOLD); R(10, 4, 2, 1, GOLD); R(10, 3, 1, 1, GEM);
    R(1, 6, 3, 3, RUF); R(1, 8, 3, 1, RUFs);
  }

  function spritePomChef(draw, L, dir, frame) {
    const side = dir === 'left' || dir === 'right', flip = dir === 'left', back = dir === 'up';
    const R = (x, y, w, h, col) => draw(flip ? 17 - x - w : x, y, w, h, col);
    const WT = L.top, WTs = '#d6d2c8', AP = L.apron, APs = dark(AP, 0.3), SC = L.scarf;
    const GOLD = L.trim, DK = L.ear, DKs = mix(DK, '#0c0a12', 0.3), FUR = L.hair, FURs = mix(FUR, '#9c8ea4', 0.3), IN = mix(FUR, '#d4c6bc', 0.45);
    const CAP = L.cap, CAPs = '#d8d6e2', INK = '#1c1622', PAW = '#f6f2ea';
    const l1 = frame === 1 ? 1 : 0, l3 = frame === 3 ? 1 : 0;
    if (!side) {
      R(3, 22, 11, 1, 'rgba(0,0,0,0.25)');
      for (const s of [-1, 1]) {
        const X = (x, w) => (s < 0 ? x : 17 - x - w);
        R(X(2, 2), 7, 2, 5, DK); R(X(1, 3), 12, 3, 6, DK); R(X(1, 3), 18, 3, 2, DK); R(X(1, 2), 20, 2, 1, DK);
        if (!back) { R(X(3, 1), 7, 1, 6, IN); R(X(3, 1), 18, 1, 2, IN); }
      }
      R(6, 19, 2, 2 - l1, back ? DKs : DK); R(9, 19, 2, 2 - l3, back ? DK : DKs);
      R(6, 21 - l1, 2, 1, PAW); R(9, 21 - l3, 2, 1, PAW);
      R(4, 13, 9, 6, WT); R(12, 13, 1, 6, WTs);
      R(3, 13, 1, 4, WT); R(13, 13, 1, 4, WTs); R(3, 17, 1, 1, AP); R(13, 17, 1, 1, APs); R(3, 18, 1, 1, PAW); R(13, 18, 1, 1, PAW);
      if (back) {
        R(4, 16, 9, 1, AP); R(8, 16, 1, 3, APs);
        R(4, 7, 9, 4, DK); R(5, 11, 7, 1, FURs); R(5, 12, 7, 1, SC);
        R(4, 0, 9, 2, CAP); R(3, 1, 11, 3, CAP); R(5, 4, 7, 2, CAP); R(11, 1, 2, 4, CAPs);
        R(4, 5, 9, 1, AP); R(4, 6, 9, 1, GOLD);
        return;
      }
      R(5, 15, 7, 4, AP); R(11, 15, 1, 4, APs); R(5, 15, 7, 1, GOLD); R(7, 17, 3, 2, WT);
      R(4, 7, 9, 5, FUR); R(5, 12, 7, 1, SC); R(7, 13, 3, 1, SC); R(8, 12, 1, 1, GOLD);
      R(7, 7, 3, 1, DK); R(8, 8, 1, 1, DK);
      R(5, 8, 2, 1, INK); R(10, 8, 2, 1, INK);
      R(5, 9, 2, 2, L.eye); R(10, 9, 2, 2, L.eye); R(5, 9, 1, 1, '#ffffff'); R(10, 9, 1, 1, '#ffffff'); R(6, 10, 1, 1, '#1c3c94'); R(11, 10, 1, 1, '#1c3c94');
      R(4, 10, 1, 1, '#f4a0aa'); R(12, 10, 1, 1, '#f4a0aa'); R(8, 11, 1, 1, '#c4848c');
      R(4, 0, 9, 2, CAP); R(3, 1, 11, 3, CAP); R(5, 4, 7, 1, CAP); R(11, 1, 2, 4, CAPs);
      R(4, 5, 9, 1, AP); R(4, 6, 9, 1, GOLD); R(8, 5, 1, 2, GOLD);
      return;
    }
    R(3, 22, 10, 1, 'rgba(0,0,0,0.25)');
    R(4, 7, 2, 6, DK); R(3, 13, 2, 5, DK); R(2, 18, 3, 2, DK); R(1, 20, 2, 1, DK); R(4, 18, 1, 2, IN);
    R(8, 19, 2, 2 - l3, DKs); R(6, 19, 2, 2 - l1, DK);
    R(8, 21 - l3, 3, 1, PAW); R(6, 21 - l1, 3, 1, PAW);
    R(5, 13, 7, 6, WT); R(5, 13, 2, 6, WTs);
    R(7, 15, 5, 4, AP); R(7, 15, 5, 1, GOLD); R(9, 17, 2, 2, WT);
    R(7, 14, 2, 3, WT); R(7, 17, 2, 1, AP); R(7, 18, 2, 1, PAW);
    R(5, 7, 7, 5, FUR); R(5, 7, 2, 1, DK); R(6, 8, 1, 3, IN); R(6, 12, 6, 1, SC); R(10, 13, 2, 1, SC); R(11, 12, 1, 1, GOLD);
    R(9, 7, 2, 1, DK);
    R(9, 8, 2, 1, INK); R(10, 9, 1, 2, L.eye); R(10, 9, 1, 1, '#ffffff');
    R(11, 10, 1, 1, '#f4a0aa');
    R(5, 0, 7, 2, CAP); R(4, 1, 9, 3, CAP); R(5, 4, 7, 1, CAP); R(4, 1, 2, 4, CAPs);
    R(5, 5, 8, 1, AP); R(5, 6, 8, 1, GOLD); R(10, 5, 2, 2, GOLD);
  }

  function spritePom(draw, L, dir, frame) {
    if (L.coat === 'pajamas') return spritePomPajamas(draw, L, dir, frame);
    if (L.coat === 'chef') return spritePomChef(draw, L, dir, frame);
    const side = dir === 'left' || dir === 'right', flip = dir === 'left', back = dir === 'up';
    const R = (x, y, w, h, col) => draw(flip ? 17 - x - w : x, y, w, h, col);
    const RED = L.top, REDs = dark(RED, 0.34), GOLD = L.trim, DK = L.ear, DKs = mix(DK, '#0c0a12', 0.3), FUR = L.hair, FURs = mix(FUR, '#9c8ea4', 0.3);
    const IN = mix(FUR, '#d4c6bc', 0.45), COL = L.beard || '#eee0c0', VIS = '#1d1b26', INK = '#1c1622', PAW = '#f6f2ea', LENS = '#eef2f8';
    const l1 = frame === 1 ? 1 : 0, l3 = frame === 3 ? 1 : 0;
    if (!side) {
      R(3, 22, 11, 1, 'rgba(0,0,0,0.25)');
      for (const s of [-1, 1]) {
        const X = (x, w) => (s < 0 ? x : 17 - x - w);
        R(X(2, 2), 7, 2, 5, DK); R(X(1, 3), 12, 3, 6, DK); R(X(1, 3), 18, 3, 2, DK); R(X(1, 2), 20, 2, 1, DK);
        if (!back) { R(X(3, 1), 7, 1, 6, IN); R(X(3, 1), 18, 1, 2, IN); }
      }
      R(6, 19, 2, 2 - l1, back ? DKs : DK); R(9, 19, 2, 2 - l3, back ? DK : DKs);
      R(6, 21 - l1, 2, 1, PAW); R(9, 21 - l3, 2, 1, PAW);
      R(4, 13, 9, 6, RED); R(4, 18, 9, 1, DK);
      R(3, 13, 1, 4, RED); R(13, 13, 1, 4, REDs); R(3, 17, 1, 1, DK); R(13, 17, 1, 1, DK); R(3, 18, 1, 1, PAW); R(13, 18, 1, 1, PAW);
      if (back) {
        R(8, 13, 1, 5, REDs); R(3, 14, 2, 1, GOLD); R(3, 15, 2, 1, RED);
        R(4, 6, 9, 1, DK); R(4, 7, 9, 4, DK); R(5, 11, 7, 1, FURs); R(5, 12, 7, 1, COL);
        R(5, 0, 7, 1, VIS); R(5, 1, 7, 5, RED); R(5, 1, 1, 5, REDs); R(4, 5, 1, 1, GOLD); R(12, 5, 1, 1, GOLD);
        return;
      }
      R(6, 13, 1, 5, DK); R(10, 13, 1, 5, DK); R(7, 13, 3, 5, FUR); R(9, 16, 2, 2, GOLD);
      R(13, 14, 2, 1, GOLD); R(13, 15, 2, 1, RED);
      R(4, 7, 9, 5, FUR); R(5, 12, 7, 1, COL); R(8, 12, 1, 1, GOLD);
      R(7, 7, 3, 1, DK); R(8, 8, 1, 1, DK);
      R(5, 8, 2, 1, INK); R(10, 8, 2, 1, INK);
      R(5, 9, 2, 2, L.eye); R(10, 9, 2, 2, L.eye); R(5, 9, 1, 1, '#ffffff'); R(10, 9, 1, 1, '#ffffff'); R(6, 10, 1, 1, '#1c3c94'); R(11, 10, 1, 1, '#1c3c94');
      R(4, 10, 1, 1, '#f4a0aa'); R(12, 10, 1, 1, '#f4a0aa'); R(8, 11, 1, 1, '#c4848c');
      R(5, 0, 7, 1, VIS); R(5, 1, 7, 5, RED); R(11, 1, 1, 5, REDs); R(7, 1, 3, 1, GOLD);
      R(7, 2, 3, 3, GOLD); R(8, 3, 1, 1, LENS); R(4, 5, 1, 1, GOLD); R(12, 5, 1, 1, GOLD);
      R(4, 6, 9, 1, VIS);
      return;
    }
    R(3, 22, 10, 1, 'rgba(0,0,0,0.25)');
    R(4, 7, 2, 6, DK); R(3, 13, 2, 5, DK); R(2, 18, 3, 2, DK); R(1, 20, 2, 1, DK); R(4, 18, 1, 2, IN);
    R(8, 19, 2, 2 - l3, DKs); R(6, 19, 2, 2 - l1, DK);
    R(8, 21 - l3, 3, 1, PAW); R(6, 21 - l1, 3, 1, PAW);
    R(5, 13, 7, 6, RED); R(5, 13, 2, 5, REDs); R(5, 18, 7, 1, DK);
    R(9, 13, 1, 5, DK); R(10, 13, 2, 5, FUR); R(10, 17, 1, 1, GOLD);
    R(6, 14, 3, 1, GOLD); R(6, 15, 3, 1, RED); R(7, 16, 2, 1, RED); R(7, 17, 2, 1, DK); R(7, 18, 2, 1, PAW);
    R(5, 7, 7, 5, FUR); R(5, 7, 2, 1, DK); R(6, 8, 1, 3, IN); R(6, 12, 6, 1, COL); R(11, 12, 1, 1, GOLD);
    R(9, 7, 2, 1, DK);
    R(9, 8, 2, 1, INK); R(10, 9, 1, 2, L.eye); R(10, 9, 1, 1, '#ffffff');
    R(11, 10, 1, 1, '#f4a0aa');
    R(5, 0, 7, 1, VIS); R(5, 1, 7, 5, RED); R(5, 1, 1, 5, REDs); R(6, 1, 3, 1, GOLD); R(9, 2, 3, 3, GOLD); R(10, 3, 1, 1, LENS); R(5, 5, 1, 1, GOLD);
    R(5, 6, 9, 1, VIS);
  }


  function spriteBody(R, P, L, dir, frame) {
    const small = L.body === 'small', oy = small ? 3 : 0, male = isMale(L);
    const tx = male ? 3 : 4, tw = male ? 11 : 9, aL = male ? 2 : 3, aR = male ? 14 : 13, armH = male ? 6 : 5;
    const legA = frame === 1 ? 1 : 0, legB = frame === 3 ? 1 : 0;
    const side = dir === 'left' || dir === 'right';
    const back = dir === 'up';
    const hairBackCol = L.back === 'flick' || L.back === 'layer' ? mix(P.hair, P.hairSh, 0.5) : P.hairSh;
    if (!side) {
      if (L.back === 'long' || L.back === 'wave' || L.back === 'hime') R(3, 5 + oy, 10, (L.back === 'hime' ? 16 : 12) - oy, hairBackCol);
      if (L.back === 'flow') { R(3, 5 + oy, 10, 13 - oy, hairBackCol); R(3, 18, 2, 1, hairBackCol); R(11, 18, 2, 1, hairBackCol); R(3, 19, 1, 1, hairBackCol); R(12, 19, 1, 1, hairBackCol); }
      if (L.back === 'wave') { R(2, 9 + oy, 1, 7, hairBackCol); R(13, 9 + oy, 1, 7, hairBackCol); }
      if (L.back === 'layer') { R(3, 5 + oy, 10, 11 - oy, hairBackCol); R(2, 9 + oy, 1, 6, hairBackCol); R(13, 9 + oy, 1, 6, hairBackCol); R(1, 14 + oy, 1, 1, hairBackCol); R(14, 14 + oy, 1, 1, hairBackCol); }
      if (L.back === 'shoulder') R(3, 5 + oy, 10, 8, hairBackCol);
      if (L.back === 'flick') { R(3, 5 + oy, 10, 8, hairBackCol); R(2, 11 + oy, 1, 2, hairBackCol); R(13, 11 + oy, 1, 2, hairBackCol); if (P.tips) { R(3, 11 + oy, 10, 2, dark(P.tips, 0.18)); R(2, 11 + oy, 1, 2, dark(P.tips, 0.18)); R(13, 11 + oy, 1, 2, dark(P.tips, 0.18)); } }
      if (L.back === 'twin') { R(1, 5 + oy, 3, 11 - oy, P.hair); R(12, 5 + oy, 3, 11 - oy, P.hair); }
      if (L.back === 'twinwave') { R(0, 3 + oy, 3, 14 - oy, P.hair); R(13, 3 + oy, 3, 14 - oy, P.hair); R(1, 17, 2, 1, P.hairSh); R(13, 17, 2, 1, P.hairSh); }
      if (L.back === 'braids') { R(1, 6 + oy, 2, 14, P.hairSh); R(14, 6 + oy, 2, 14, P.hairSh); for (const y of [9, 13, 17]) { R(1, y + oy, 2, 1, dark(P.hairSh, 0.25)); R(14, y + oy, 2, 1, dark(P.hairSh, 0.25)); } }
      if (L.back === 'side') R(L.sideR && !back ? 12 : 0, 1 + oy, 4, 10, P.hair);
      if (L.back === 'side' && accOf(L, 'lotus')) R(L.sideR && !back ? 11 : 3, oy, 2, 2, accOf(L, 'lotus'));
      if (L.back === 'tail' && back) R(7, 8 + oy, 3, 8, P.hair);
      if (L.back === 'hightail' && !back) { R(1, 3 + oy, 2, 13, hairBackCol); R(2, 2 + oy, 2, 2, hairBackCol); if (P.tips) R(1, 12 + oy, 2, 4, dark(P.tips, 0.1)); }
    } else {
      const bx = dir === 'left' ? 9 : 3;
      if (L.back === 'long' || L.back === 'layer' || L.back === 'wave' || L.back === 'hime' || L.back === 'flow') R(bx, 5 + oy, 5, (L.back === 'hime' ? 16 : L.back === 'flow' ? 14 : 12) - oy, hairBackCol);
      if (L.back === 'layer') R(dir === 'left' ? bx + 1 : bx, 17, 4, 1, hairBackCol);
      if (L.back === 'shoulder' || L.back === 'tail' || L.back === 'flick') R(bx, 5 + oy, 4, 8, hairBackCol);
      if (L.back === 'flick' && P.tips) { R(bx, 11 + oy, 4, 2, dark(P.tips, 0.18)); R(dir === 'left' ? bx + 4 : bx - 1, 11 + oy, 1, 1, dark(P.tips, 0.18)); }
      if (L.back === 'twin' || L.back === 'braids') R(bx, 5 + oy, 3, 11 - oy, P.hair);
      if (L.back === 'twinwave') R(dir === 'left' ? 10 : 3, 3 + oy, 4, 14 - oy, P.hair);
      if (L.back === 'side') R(dir === 'left' ? 10 : 2, 1 + oy, 4, 10, P.hair);
      if (L.back === 'hightail') { const bx = dir === 'left' ? 12 : 2; R(bx, 2 + oy, 3, 14, hairBackCol); if (P.tips) R(bx, 12 + oy, 3, 4, dark(P.tips, 0.1)); }
    }
    R(4, 22, 8, 1, 'rgba(0,0,0,0.25)');
    const veil = accOf(L, 'veil');
    if (veil) { if (back) R(3, 3 + oy, 11, 15, veil); else if (side) R(dir === 'left' ? 10 : 2, 3 + oy, 5, 14, veil); else { R(2, 4 + oy, 2, 13, veil); R(13, 4 + oy, 2, 13, veil); } }
    let v;
    if ((v = accOf(L, 'cattail'))) {
      if (dir === 'down') { R(3, 15, 1, 4, v); R(2, 18, 1, 2, v); R(3, 16, 1, 1, L.spot || '#4a3424'); }
      else if (back) { R(8, 15, 1, 3, v); R(9, 17, 1, 3, v); R(8, 16, 1, 1, L.spot || '#4a3424'); }
      else { const x0 = dir === 'left' ? 12 : 3; R(x0, 15, 2, 1, v); R(dir === 'left' ? 13 : 2, 16, 1, 4, v); R(dir === 'left' ? 13 : 2, 17, 1, 1, L.spot || '#4a3424'); }
    }
    if ((v = accOf(L, 'racape'))) {
      if (dir === 'down') R(1, 13, 2, 6, v);
      else if (back) R(13, 13, 2, 6, v);
      else if (dir === 'right') R(4, 13, 3, 6, v);
    }
    if ((v = accOf(L, 'ghosttail'))) {
      if (dir === 'down') { R(12, 15, 3, 4, v); R(14, 13, 1, 2, light(v, 0.4)); }
      else if (back) { R(7, 15, 4, 5, v); R(9, 19, 2, 2, light(v, 0.4)); }
      else { const tx0 = dir === 'left' ? 12 : 1; R(tx0, 14, 4, 4, v); R(dir === 'left' ? 15 : 0, 12, 1, 3, light(v, 0.4)); }
    }
    if ((v = accOf(L, 'dragontail'))) {
      if (dir === 'down') { R(12, 15, 2, 4, v); R(13, 18, 2, 2, '#eef2fa'); }
      else if (back) { R(7, 15, 3, 5, v); R(8, 19, 3, 2, '#eef2fa'); }
      else { const tx0 = dir === 'left' ? 12 : 1; R(tx0, 15, 4, 3, v); R(dir === 'left' ? 15 : 0, 13, 2, 3, '#eef2fa'); }
    }
    if ((v = accOf(L, 'braidrings')) && L.back === 'twin') {
      if (!side) { R(1, 13, 3, 1, v); R(12, 13, 3, 1, v); } else R(dir === 'left' ? 9 : 3, 13, 3, 1, v);
    }
    const legCol = L.low === 'pants' ? P.lower : accOf(L, 'boots') || accOf(L, 'thighboots') || accOf(L, 'socks') || accOf(L, 'stockings') || P.legs;
    const shoe = accOf(L, 'barefoot') ? P.skin : accOf(L, 'ankle') || P.shoes;
    if (side) {
      R(6, 17 - legA, 3, 5, legCol); R(8, 17 - legB, 3, 5, dark(legCol, 0.18));
      R(6, 21 - legA, 3, 1, shoe); R(8, 21 - legB, 3, 1, shoe);
    } else {
      R(5, 17, 3, 5 - legA, legCol); R(9, 17, 3, 5 - legB, legCol);
      R(5, 21 - legA, 3, 1, shoe); R(9, 21 - legB, 3, 1, accOf(L, 'trboot') || shoe);
    }
    if ((v = accOf(L, 'greaves'))) {
      if (side) { R(6, 20 - legA, 3, 1, v); R(8, 20 - legB, 3, 1, mix(v, '#9a88b8', 0.3)); }
      else { R(5, 20 - legA, 3, 1, v); R(9, 20 - legB, 3, 1, v); }
    }
    if ((v = accOf(L, 'bootvflap')) && accOf(L, 'thighboots')) {
      if (side) { R(6, 18 - legA, 3, 1, P.skin); R(6, 19 - legA, 3, 1, '#e6eaf8'); R(8, 18 - legB, 3, 1, P.skinSh); R(8, 19 - legB, 3, 1, '#c8cce0'); R(dir === 'left' ? 6 : 10, 20 - (dir === 'left' ? legA : legB), 1, 1, v); }
      else { R(5, 18, 3, 1, P.skin); R(9, 18, 3, 1, P.skin); R(5, 19, 3, 1, '#e6eaf8'); R(9, 19, 3, 1, '#e6eaf8'); if (!back) { R(6, 20 - legA, 1, 1, v); R(10, 20 - legB, 1, 1, v); } }
    }
    const rs = L.stockSide === 'r', lim = accOf(L, 'boots') ? 2 : 4;
    if ((v = accOf(L, 'stocking1'))) {
      const near = (dir === 'left') !== rs, far = back !== rs;
      if (side) R(near ? 8 : 6, 17 - (near ? legB : legA), 3, lim, v);
      else R(far ? 9 : 5, 17, 3, lim - (far ? legB : legA), v);
      if ((v = accOf(L, 'gband')) && !side) R(far ? 9 : 5, 17, 3, 1, v);
    }
    if ((v = accOf(L, 'legwrap'))) {
      const near = (dir === 'left') === rs, far = back === rs;
      if (side) R(near ? 8 : 6, 17 - (near ? legB : legA), 3, lim, near ? dark(v, 0.08) : v);
      else R(far ? 9 : 5, 17, 3, lim - (far ? legB : legA), v);
    }
    if ((v = accOf(L, 'bootcuff')) && accOf(L, 'boots')) {
      const bt = accOf(L, 'boots');
      if (side) { R(6, 19 - legA, 3, 1, v); R(6, 20 - legA, 3, 1, bt); R(8, 19 - legB, 3, 1, dark(v, 0.18)); R(8, 20 - legB, 3, 1, dark(bt, 0.18)); }
      else { R(5, 19 - legA, 3, 1, v); R(9, 19 - legB, 3, 1, v); R(5, 20 - legA, 3, 1, bt); R(9, 20 - legB, 3, 1, bt); }
    }
    if ((v = accOf(L, 'anklecuff') || accOf(L, 'anklerim'))) {
      if (side) { R(6, 20 - legA, 3, 1, v); R(8, 20 - legB, 3, 1, dark(v, 0.18)); }
      else { R(5, 20 - legA, 3, 1, v); R(9, 20 - legB, 3, 1, v); }
    }
    if ((v = accOf(L, 'garter')) && accOf(L, 'garterbow')) {
      if (side) R(dir === 'left' ? 8 : 6, 18 - (dir === 'left' ? legB : legA), 3, 1, v);
      else R(back ? 9 : 5, 18, 3, 1, v);
    }
    if ((v = accOf(L, 'warmers'))) {
      if (side) { R(6, 20 - legA, 3, 1, v); R(8, 20 - legB, 3, 1, dark(v, 0.18)); }
      else { R(4, 20 - legA, 4, 1, v); R(9, 20 - legB, 4, 1, v); }
    }
    if ((v = accOf(L, 'tails')) && !side) { R(3, 15 + oy, 1, 5 - oy, back ? v : dark(v, 0.2)); R(13, 15 + oy, 1, 5 - oy, back ? v : dark(v, 0.2)); if (back) R(4, 15, 9, 4, v); }
    const bodyTop = 11 + oy;
    if (L.low === 'skirt' || L.low === 'long') R(side ? 5 : 4, 15, side ? 7 : 9, L.low === 'long' ? 6 : 3, P.lower);
    if ((v = accOf(L, 'ruffle3')) && L.low === 'skirt') { R(side ? 5 : 4, 16, side ? 7 : 9, 1, v); R(side ? 4 : 3, 17, side ? 9 : 11, 1, P.lower); }
    if (L.coat === 'avia') { R(5, 15, 7, 2, P.top); R(side ? 6 : 5, 17, side ? 3 : 3, 1, P.skin); if (!side) R(9, 17, 3, 1, P.skin); }
    if ((v = accOf(L, 'plaid')) && L.low === 'skirt') { R(side ? 5 : 4, 16, side ? 7 : 9, 1, v); R(6, 15, 1, 3, v); R(10, 15, 1, 3, v); }
    if ((v = accOf(L, 'neon')) && L.low === 'pants') { if (!side) { R(5, 17, 1, 3, v); R(11, 17, 1, 3, L.neon2 || '#5ae8f8'); } else R(dir === 'left' ? 10 : 6, 17, 1, 3, v); }
    if (accOf(L, 'flare') && !side) { R(4, 20 - legA, 1, 1, P.lower); R(12, 20 - legB, 1, 1, P.lowerSh); }
    if ((v = accOf(L, 'stockbow')) && !side) { R(5, 18, 3, 1, v); R(9, 18, 3, 1, v); }
    if (L.low === 'ballgown') {
      R(3, 15, 11, 7, P.lower); R(side ? 3 : 10, 15, side ? 2 : 4, 7, P.lowerSh); R(3, 18, 11, 1, light(P.lower, 0.4));
      if (L.roseCol && dir !== 'up') { R(5, 16, 1, 1, L.roseCol); R(9, 17, 1, 1, L.roseCol); R(11, 20, 1, 1, L.roseCol); }
    }
    if (L.low === 'gown') {
      R(side ? 4 : 4, 15, side ? 9 : 9, 6, P.lower);
      if (dir === 'down') { R(5, 17, 2, 4, P.skin); R(4, 19, 1, 2, '#c02830'); R(7, 17, 1, 3, mix(P.lower, '#c02830', 0.75)); R(10, 16, 2, 5, P.lowerSh); }
      else if (dir === 'right') { R(5, 17, 2, 4, P.skin); R(4, 18, 1, 3, '#c02830'); }
      else if (dir === 'left') R(10, 16, 3, 5, P.lowerSh);
      else R(4, 19, 9, 2, mix(P.lower, '#c02830', 0.3));
    }
    if (L.coat === 'cape') {
      const lin = L.sleeve ? P.top : L.lining || P.trim;
      if (back) R(3, 11 + oy, 11, 10, P.top);
      else if (side) { R(dir === 'left' ? 10 : 3, 11 + oy, 3, 9, lin); R(dir === 'left' ? 12 : 3, 11 + oy, 1, 9, P.top); }
      else { R(2, 11 + oy, 2, 9, lin); R(13, 11 + oy, 2, 9, lin); R(1, 12 + oy, 1, 8, P.top); R(15, 12 + oy, 1, 8, P.top); }
    }
    if ((v = accOf(L, 'witchcape')) && !back) {
      const lin = L.capeIn || '#6e4a52', tr = L.capeTrim || P.trim;
      if (side) { const bx = dir === 'left' ? 10 : 3; R(bx, 11 + oy, 4, 9, lin); R(dir === 'left' ? 13 : 3, 11 + oy, 1, 9, v); R(bx, 20, 4, 1, tr); }
      else { R(1, 12 + oy, 3, 8, lin); R(13, 12 + oy, 3, 8, dark(lin, 0.18)); R(1, 13 + oy, 1, 7, v); R(15, 13 + oy, 1, 7, v); R(1, 20, 3, 1, tr); R(13, 20, 3, 1, tr); }
    }
    if ((v = accOf(L, 'mstaff')) && !side) { const sx = back ? 14 : 2; R(sx, 3, 1, 18, v); R(sx, 1, 1, 2, v); R(back ? sx : sx - 1, 0, 2, 1, v); R(back ? sx + 1 : sx - 1, 1, 1, 1, '#e0304a'); }
    if (L.low === 'shorts') R(5, 15, 7, 2, P.lower);
    if (L.low === 'slit') {
      const ap = L.apron || dark(P.lower, 0.5);
      if (side) { R(4, 15, 3, 7, P.lower); R(10, 15, 3, 7, P.lowerSh); R(6, 15, 5, 3, ap); }
      else { R(3, 15, 3, 7, P.lower); R(11, 15, 3, 7, P.lowerSh); R(5, 15, 7, 3, ap); }
    }
    const torso = ['shrug', 'cape', 'hoodcape', 'crusader'].includes(L.coat) ? P.inner : P.top;
    if (side) R(4, bodyTop, 9, 16 - bodyTop, torso);
    else { R(tx, bodyTop, tw, 16 - bodyTop, torso); if (male) { R(tx, bodyTop, 1, 1, P.topHi); R(tx + tw - 1, bodyTop, 1, 1, P.topSh); R(tx + 1, 15, tw - 2, 1, P.topSh); } }
    if (L.coat === 'dress' && L.collar === 'bare' && dir !== 'up') R(5, bodyTop, 7, 1, P.skin);
    if (L.collar === 'scoop' && dir === 'down') { R(7, bodyTop, 3, 1, P.skin); R(8, bodyTop + 1, 1, 1, P.skin); R(6, bodyTop, 1, 1, P.trim); R(10, bodyTop, 1, 1, P.trim); }
    if (['long', 'mid', 'parka'].includes(L.coat)) R(side ? 5 : 4, 15, side ? 7 : 9, 3, L.coatLow || P.top);
    if (L.coat === 'split') {
      const low = L.coatLow || P.top, sh = dark(low, 0.22);
      if (dir === 'down') { R(3, 15, 4, 4, low); R(10, 15, 4, 4, sh); R(3, 18, 1, 1, light(low, 0.15)); R(6, 15, 1, 4, L.edge || L.lining || low); R(10, 15, 1, 4, L.edge || L.lining || low); }
      else if (back) { R(3, 15, 11, 4, low); R(8, 15, 1, 4, dark(low, 0.3)); }
      else { R(4, 15, 9, 4, low); R(dir === 'left' ? 10 : 4, 15, 3, 4, sh); }
      R(side ? 4 : 3, 14, side ? 9 : 11, 1, dark(low, 0.12));
    }
    if (L.coat === 'parka') { R(side ? 5 : 4, 15, side ? 7 : 9, 1, L.belt || '#6a4430'); R(side ? 5 : 4, 17, side ? 7 : 9, 1, P.trim); }
    if (L.coat === 'tabard') { R(5, 15, 7, 1, P.top); R(5, 16, 7, 1, P.trim); }
    if (L.coat === 'robe') {
      R(side ? 5 : 4, 15, side ? 7 : 9, 4, P.top);
      R(side ? 5 : 4, 18, side ? 7 : 9, 1, L.cloud || '#d4ecf2');
      if (dir === 'down') R(7, 15, 3, 3, P.lower);
      R(side ? 4 : tx, 14, side ? 9 : tw, 1, L.sash || '#1e1e26');
      if (!back) R(side ? (dir === 'left' ? 5 : 8) : 6, 14, side ? 4 : 5, 1, L.belt || '#7cc0e2');
    }
    if ((v = accOf(L, 'shcape'))) {
      if (dir === 'down') R(2, bodyTop + 1, 1, 7, v);
      else if (back) R(13, bodyTop + 1, 2, 7, v);
      else if (dir === 'right') R(4, bodyTop, 4, 8, v);
    }
    if ((v = accOf(L, 'sidecape'))) {
      if (dir === 'down') R(14, bodyTop + 1, 1, 7, v);
      else if (back) R(2, bodyTop + 1, 2, 7, v);
      else if (dir === 'left') R(9, bodyTop, 4, 8, v);
    }
    const open = (['jacket', 'long', 'mid', 'robe', 'split'].includes(L.coat) && ['v', 'hood', 'high', 'bow', 'fur'].includes(L.collar)) || L.coat === 'openvest';
    if (dir === 'down') {
      if (open || L.collar === 'bare') R(7, bodyTop, 3, 5, P.inner);
      if (open) { const tc = L.coat === 'split' ? L.edge || L.lining || P.trim : P.trim; R(6, bodyTop, 1, 5, tc); R(10, bodyTop, 1, 5, tc); }
      if ((v = accOf(L, 'zip'))) R(8, bodyTop, 1, 3, v);
      if (L.coat === 'raglan') R(7, bodyTop, 3, 1, L.sleeve || P.trim);
      if (L.coat === 'avia') { R(8, bodyTop + 1, 1, 3, L.inset || '#6792c4'); R(8, bodyTop, 1, 1, accOf(L, 'gemcollar') || '#4a90e0'); }
      if (L.coat === 'ranger') R(8, bodyTop, 1, 4, P.trim);
      if (L.coat === 'suit') { R(8, bodyTop, 1, 4, L.neon || P.trim); R(tx, bodyTop, 1, 1, L.neon || P.trim); R(tx + tw - 1, bodyTop, 1, 1, L.neon2 || '#5ae8f8'); }
      if ((v = accOf(L, 'tie'))) { R(8, bodyTop, 1, 3, v); if (L.collar === 'shirt') { R(7, bodyTop, 1, 1, P.innerSh); R(9, bodyTop, 1, 1, P.innerSh); } }
      if ((v = accOf(L, 'magia'))) { R(7, bodyTop + 2, 3, 1, '#1e1c26'); R(7, bodyTop + 2, 1, 1, v); R(9, bodyTop + 2, 1, 1, v); }
      if (L.coat === 'heartcorset') { R(tx, bodyTop, tw, 1, P.skin); R(8, bodyTop + 1, 1, 1, L.bow || '#e26396'); R(8, bodyTop + 3, 1, 1, P.trim); }
      if ((v = accOf(L, 'chestpouch'))) { R(6, bodyTop + 1, 3, 2, v); R(9, bodyTop + 3, 2, 1, v); }
      if ((v = accOf(L, 'chevron'))) R(10, bodyTop + 1, 1, 1, v);
      if ((v = accOf(L, 'iceemblem'))) R(8, bodyTop + 1, 1, 3, v);
      if ((v = accOf(L, 'apronw'))) R(6, 15, 4, 4, v);
      if ((v = accOf(L, 'starorb'))) { R(7, bodyTop + 1, 2, 2, '#d8b048'); R(7, bodyTop + 2, 2, 1, '#7a3ae0'); R(7, bodyTop + 5, 2, 3, v); }
      if ((v = accOf(L, 'hhcharm'))) { R(7, bodyTop + 1, 2, 2, '#2aa8b0'); R(7, bodyTop + 3, 1, 2, '#c8302a'); R(11, bodyTop + 5, 2, 2, '#d8b048'); }
      if ((v = accOf(L, 'lunarbodice'))) { R(7, bodyTop + 4, 2, 2, '#e8eef8'); R(7, bodyTop + 6, 2, 3, '#14141c'); }
      if ((v = accOf(L, 'jyarmor'))) { R(6, bodyTop + 1, 5, 4, v); R(7, bodyTop + 5, 3, 1, '#d8b048'); R(3, bodyTop + 6, 2, 4, L.inner || '#ecebe6'); R(12, bodyTop + 6, 2, 4, L.inner || '#ecebe6'); }
      if ((v = accOf(L, 'lionpad'))) R(1, bodyTop, 3, 2, v);
      if ((v = accOf(L, 'lcdrape'))) { R(5, bodyTop, 1, 1, '#d8b048'); R(6, bodyTop + 1, 1, 1, v); R(9, bodyTop + 2, 2, 1, v); R(10, bodyTop + 3, 2, 1, v); R(13, bodyTop + 1, 2, 1, v); }
      if ((v = accOf(L, 'lctassels'))) { R(5, bodyTop + 4, 7, 1, '#26262c'); R(5, bodyTop + 5, 1, 3, v); R(11, bodyTop + 5, 1, 3, v); }
      if ((v = accOf(L, 'ilfront'))) { R(8, bodyTop, 1, 1, P.skin); R(8, bodyTop + 1, 1, 2, v); R(13, bodyTop, 2, 1, P.skin); R(13, bodyTop + 1, 2, 1, v); R(2, bodyTop + 2, 1, 2, '#c8303a'); }
      if ((v = accOf(L, 'ilsash'))) { R(5, bodyTop + 3, 7, 1, v); R(8, bodyTop + 3, 1, 1, '#5ae0e8'); R(4, bodyTop + 4, 1, 4, v); R(12, bodyTop + 4, 1, 4, v); R(10, bodyTop + 4, 1, 2, '#eef0ee'); }
      if ((v = accOf(L, 'agarmor'))) { R(6, bodyTop, 5, 2, v); R(8, bodyTop, 1, 2, '#d8b048'); R(6, bodyTop + 2, 5, 1, '#a8202c'); R(5, bodyTop + 2, 7, 1, '#26222a'); R(7, bodyTop + 3, 1, 1, '#d8283a'); R(2, bodyTop, 2, 2, v); R(13, bodyTop, 2, 2, v); R(1, bodyTop - 1, 1, 1, '#d8b048'); R(15, bodyTop - 1, 1, 1, '#d8b048'); }
      if ((v = accOf(L, 'ratoga'))) { R(8, bodyTop, 1, 1, P.skin); R(6, bodyTop, 1, 4, '#3a48c0'); R(10, bodyTop, 1, 2, '#f2f2f4'); R(5, bodyTop + 3, 7, 1, '#f2f2f4'); R(8, bodyTop + 3, 1, 1, '#d8b048'); R(11, bodyTop + 4, 2, 3, '#f2f2f4'); R(2, bodyTop, 2, 3, '#3a48c0'); R(13, bodyTop, 2, 3, P.skin); R(2, bodyTop - 1, 2, 1, '#d8b048'); }
      if ((v = accOf(L, 'charmpanel'))) { R(7, 15, 3, 6, v); R(8, 16, 1, 1, '#a01c30'); R(8, 18, 1, 1, '#a01c30'); }
      if ((v = accOf(L, 'hipbow'))) { R(10, 14, 2, 1, v); R(11, 15, 1, 2, '#f0c040'); }
      if ((v = accOf(L, 'sealpanel'))) { R(7, 15, 3, 6, v); R(8, 18, 1, 1, '#d8b050'); R(8, 19, 1, 1, '#a01c30'); }
      if ((v = accOf(L, 'lotussash'))) { R(6, bodyTop + 4, 5, 1, v); R(8, bodyTop + 4, 1, 1, '#d8b050'); }
      if ((v = accOf(L, 'armorpad'))) { R(tx - 1, bodyTop, 2, 1, '#1c1a22'); R(tx + tw - 1, bodyTop, 2, 1, '#1c1a22'); R(tx - 1, bodyTop, 1, 1, v); R(tx + tw, bodyTop, 1, 1, v); }
      if ((v = accOf(L, 'onimask'))) R(8, bodyTop + 4, 1, 1, v);
      if ((v = accOf(L, 'cravat'))) { R(7, bodyTop + 1, 3, 1, v); R(8, bodyTop + 2, 1, 2, v); }
      if ((v = accOf(L, 'blackyoke'))) { R(tx, bodyTop, 2, 2, v); R(tx + tw - 2, bodyTop, 2, 2, v); }
      if ((v = accOf(L, 'vestv'))) R(7, bodyTop + 1, 3, 2, v);
      if ((v = accOf(L, 'stars'))) R(9, bodyTop + 2, 1, 1, v);
      if ((v = accOf(L, 'flap'))) { R(7, bodyTop + 3, 3, 1, v); R(6, 15, 2, 2, v); }
      if ((v = accOf(L, 'hipbelt'))) { R(7, bodyTop + 4, 2, 1, v); R(9, 15, 2, 1, v); }
      if ((v = accOf(L, 'waistcorset'))) { R(5, bodyTop + 4, 7, 2, v); R(8, bodyTop + 4, 1, 1, '#d8b050'); }
      if (L.coat === 'closed') R(8, bodyTop + 1, 1, 4, P.trim);
      if (L.coat === 'parka') R(8, bodyTop, 1, 1, P.inner);
      if (L.coat === 'tabard') { R(7, bodyTop, 3, 2, P.inner); R(8, bodyTop + 2, 1, 1, P.trim); }
      if ((v = accOf(L, 'clasps'))) { R(6, bodyTop, 1, 2, v); R(10, bodyTop, 1, 2, v); }
      if (L.collar === 'fur' || L.collar === 'hood') R(5, bodyTop, 7, 1, L.collar === 'fur' ? P.trim : P.inner);
    }
    if ((v = accOf(L, 'corsetHi'))) {
      if (!side) { R(tx, bodyTop + 3, tw, 2, v); R(5, 15, 7, 2, v); if (!back) { R(7, bodyTop + 3, 1, 1, L.trim); R(10, bodyTop + 3, 1, 1, L.trim); if ((v = accOf(L, 'jabot'))) R(9, bodyTop + 3, 1, 3, v); } }
      else { R(4, bodyTop + 3, 9, 2, v); R(5, 15, 7, 2, v); }
    }
    if (L.coat === 'leo') {
      if (dir === 'down') {
        R(tx, bodyTop, tw, 2, P.top); R(7, bodyTop + 2, 3, 3, P.inner); R(tx, bodyTop + 2, 3, 2, P.skin); R(tx + tw - 3, bodyTop + 2, 3, 2, P.skin);
        if ((v = accOf(L, 'petals'))) { R(4, 16, 2, 4, v); R(11, 16, 2, 4, v); R(4, 16, 2, 1, '#8ad8f0'); R(11, 16, 2, 1, '#8ad8f0'); }
      } else if (back) R(tx, bodyTop, tw, 4, P.top);
      else { R(4, bodyTop, 9, 2, P.top); R(4, bodyTop + 2, 9, 2, P.inner); if ((v = accOf(L, 'petals'))) R(dir === 'left' ? 9 : 4, 16, 4, 4, v); }
      const tl = accOf(L, 'tails');
      if (tl) { if (dir === 'down') R(2, 15, 2, 6, tl); else if (back) R(13, 15, 2, 6, tl); else if (dir === 'right') R(3, 15, 3, 6, tl); }
    }
    if (L.coat === 'wrap') {
      const tl = accOf(L, 'tails');
      if (dir === 'down') {
        R(4, bodyTop, 1, 1, P.skin); R(12, bodyTop, 1, 1, P.skin);
        if ((v = accOf(L, 'icebow'))) { R(8, bodyTop + 1, 3, 1, v); R(9, bodyTop + 2, 1, 2, v); R(10, bodyTop, 1, 1, '#62c4f4'); }
        if (tl) { R(2, 15, 2, 6, tl); R(13, 15, 2, 6, tl); R(3, 16, 1, 5, L.tailsLining || tl); R(13, 16, 1, 5, L.tailsLining || tl); }
      } else if (back) {
        if (tl) { R(4, 15, 9, 6, tl); R(8, 16, 1, 5, L.tailsLining || tl); }
      } else if (tl) { R(dir === 'left' ? 11 : 3, 15, 3, 6, tl); R(dir === 'left' ? 11 : 5, 16, 1, 5, L.tailsLining || tl); }
    }
    if (L.coat === 'doll') {
      if (dir === 'down') { R(tx, bodyTop, tw, 5, P.inner); R(tx, bodyTop, 1, 4, P.top); R(tx + tw - 1, bodyTop, 1, 4, P.top); R(8, bodyTop + 1, 1, 1, accOf(L, 'padlock') || P.inner); R(8, bodyTop + 2, 1, 2, accOf(L, 'tie') || P.inner); }
      else if (back) R(tx, bodyTop, tw, 5, P.top);
      else { R(4, bodyTop, 9, 5, P.inner); R(dir === 'left' ? 10 : 4, bodyTop, 3, 4, P.top); }
    }
    if (L.coat === 'memovest') {
      const cr = accOf(L, 'crystal') || L.lining;
      if (dir === 'down') { R(tx, bodyTop, 2, 6, P.top); R(tx + tw - 2, bodyTop, 2, 6, P.top); R(8, bodyTop + 2, 1, 4, cr); R(7, bodyTop, 3, 1, L.neck || P.inner); }
      else if (back) R(tx, bodyTop, tw, 6, P.top);
      else R(dir === 'left' ? 9 : 4, bodyTop, 4, 6, P.top);
    }
    if (L.coat === 'bridal') {
      if (dir !== 'up') R(side ? 4 : tx, bodyTop, side ? 9 : tw, 1, P.skin);
      else R(tx, bodyTop, tw, 1, P.skin);
    }
    if (L.coat === 'frost') {
      if (dir === 'down') { R(tx, bodyTop, tw, 1, P.skin); R(7, bodyTop, 3, 1, L.bow || P.trim); R(8, bodyTop + 1, 1, 1, L.flowerCore || '#9ad4f4'); R(8, bodyTop + 2, 1, 2, L.fade || P.top); }
      else if (back) { R(tx, bodyTop, tw, 1, P.skin); if ((v = accOf(L, 'backbow'))) { R(6, bodyTop + 2, 5, 1, v); R(8, bodyTop + 3, 1, 1, v); } }
      else R(4, bodyTop, 9, 1, P.skin);
    }
    if (L.coat === 'bodice') {
      if (dir === 'down') { R(tx, bodyTop, tw, 1, P.skin); R(9, bodyTop + 1, 1, 2, '#f2eef0'); if ((v = accOf(L, 'redpanels'))) { R(3, 15, 2, 5, v); R(12, 15, 2, 5, v); } }
      else if (back) { R(tx, bodyTop, tw, 1, P.skin); if ((v = accOf(L, 'tails'))) R(4, 15, 9, 6, v); }
      else { R(4, bodyTop, 9, 1, P.skin); if ((v = accOf(L, 'redpanels'))) R(dir === 'left' ? 9 : 4, 15, 4, 5, v); }
    }
    if (L.coat === 'crop') {
      if (dir === 'down') { R(tx, bodyTop, tw, 2, P.top); R(7, bodyTop, 3, 2, P.inner); R(6, bodyTop, 1, 2, L.lining); R(10, bodyTop, 1, 2, L.lining); R(tx, bodyTop + 2, tw, 1, P.skin); R(tx, bodyTop + 3, tw, 1, accOf(L, 'whitebelt') || P.lower); R(8, bodyTop + 3, 1, 1, '#2a2836'); if ((v = accOf(L, 'sash2'))) R(11, 15, 2, 4, v); }
      else if (back) { R(tx, bodyTop, tw, 2, P.top); R(tx, bodyTop + 2, tw, 1, P.skin); R(tx, bodyTop + 3, tw, 1, accOf(L, 'whitebelt') || P.lower); if ((v = accOf(L, 'sash2'))) R(4, 15, 2, 4, v); }
      else { R(4, bodyTop, 9, 2, P.top); R(4, bodyTop + 2, 9, 1, P.skin); R(4, bodyTop + 3, 9, 1, accOf(L, 'whitebelt') || P.lower); if ((v = accOf(L, 'sash2')) && dir === 'left') R(10, 15, 3, 4, v); }
      if (!back && !side) R(5, bodyTop - 1, 7, 1, L.trim);
    }
    if (L.coat === 'kid') {
      if (dir === 'down') { R(tx, bodyTop, tw, 3, P.top); R(7, bodyTop, 3, 2, P.inner); R(8, bodyTop + 1, 1, 1, '#d8b050'); R(7, bodyTop + 2, 3, 1, L.belly || '#e4e6ec'); R(tx, bodyTop + 3, tw, 1, accOf(L, 'chainbelt') || P.lower); R(5, bodyTop - 1, 2, 1, P.top); R(10, bodyTop - 1, 2, 1, P.top); }
      else if (back) { R(tx, bodyTop, tw, 3, P.top); R(tx, bodyTop + 3, tw, 1, accOf(L, 'chainbelt') || P.lower); }
      else { R(4, bodyTop, 9, 3, P.top); R(dir === 'left' ? 4 : 11, bodyTop, 2, 3, P.inner); R(4, bodyTop + 3, 9, 1, accOf(L, 'chainbelt') || P.lower); }
    }
    if (L.coat === 'gyaru') {
      if (dir === 'down') { R(tx, bodyTop, tw, 2, P.inner); R(tx, bodyTop + 1, tw, 1, '#1c1c22'); R(7, bodyTop + 1, 1, 1, P.inner); R(9, bodyTop + 1, 1, 1, P.inner); R(tx, bodyTop + 2, tw, 2, P.skin); R(5, bodyTop - 1, 2, 1, L.collarCol || '#f4f4f6'); R(10, bodyTop - 1, 2, 1, L.collarCol || '#f4f4f6'); }
      else if (back) { R(tx, bodyTop, tw, 2, P.top); R(tx, bodyTop + 2, tw, 2, P.skin); }
      else { R(4, bodyTop, 9, 2, P.inner); R(4, bodyTop + 2, 9, 2, P.skin); }
    }
    if (L.coat === 'volt') {
      if (dir === 'down') { R(tx, bodyTop, tw, 2, P.inner); R(6, bodyTop, 5, 2, P.top); R(8, bodyTop, 1, 2, P.inner); R(tx, bodyTop + 2, tw, 1, P.skin); R(tx, bodyTop + 3, tw, 1, P.lower); R(5, bodyTop - 1, 2, 1, P.top); R(10, bodyTop - 1, 2, 1, P.top); }
      else if (back) { R(tx, bodyTop, tw, 2, P.top); R(tx, bodyTop + 2, tw, 1, P.skin); R(tx, bodyTop + 3, tw, 1, P.lower); }
      else { R(4, bodyTop, 9, 2, P.inner); R(dir === 'left' ? 5 : 8, bodyTop, 4, 2, P.top); R(4, bodyTop + 2, 9, 1, P.skin); R(4, bodyTop + 3, 9, 1, P.lower); }
    }
    if (L.coat === 'offcoat') {
      const pl = accOf(L, 'panell');
      if (dir === 'down') {
        R(tx, bodyTop, tw, 4, P.inner); R(8, bodyTop + 2, 1, 2, P.innerSh); if ((v = accOf(L, 'bow'))) { R(7, bodyTop + 1, 1, 1, v); R(9, bodyTop + 1, 1, 1, v); R(8, bodyTop + 1, 1, 1, accOf(L, 'neckband') || v); }
        R(tx, 15, tw, 1, accOf(L, 'waistband') || P.inner);
        R(4, 16, 4, 2, pl || P.lower); R(8, 16, 4, 2, P.lower);
        R(2, 13, 2, 6, P.top); R(13, 13, 2, 6, P.top); R(3, 14, 1, 5, L.lining); R(13, 14, 1, 5, L.lining);
      } else if (back) {
        R(2, 13, 13, 6, P.top); R(8, 15, 1, 4, L.lining);
      } else {
        R(4, bodyTop, 9, 4, P.inner); R(4, 15, 9, 3, P.lower);
        R(dir === 'left' ? 9 : 3, 13, 5, 6, P.top); R(dir === 'left' ? 9 : 7, 14, 1, 5, L.lining);
      }
    }
    if (L.coat === 'half') {
      const bs = accOf(L, 'blacksleeve') || P.inner, tl = accOf(L, 'tails');
      if (dir === 'down') {
        R(tx, bodyTop, 5, 2, P.top); R(tx + 5, bodyTop, 4, 1, P.inner); R(tx + 5, bodyTop + 1, 4, 1, light(P.inner, 0.12)); R(tx, bodyTop + 2, tw, 2, P.skin); R(tx, bodyTop + 3, tw, 1, accOf(L, 'xstraps') || P.top);
        R(9, 15, 3, 2, accOf(L, 'shortsr') || P.lower);
        if (tl) R(2, 15, 2, 6, tl);
        if ((v = accOf(L, 'feathers'))) R(2, bodyTop - 1, 2, 2, v);
      } else if (back) {
        R(tx, bodyTop, tw, 2, P.top); R(tx, bodyTop + 2, tw, 2, P.skin);
        if (tl) R(13, 15, 2, 6, tl);
      } else {
        R(4, bodyTop, 9, 2, dir === 'left' ? P.top : P.inner); R(4, bodyTop + 2, 9, 2, P.skin);
        if (tl && dir === 'left') R(10, 15, 3, 6, tl);
      }
    }
    if (L.coat === 'bolero') {
      if (dir === 'down') {
        R(5, bodyTop, 7, 4, P.inner); R(4, bodyTop, 2, 2, P.top); R(11, bodyTop, 2, 2, P.top);
        if ((v = accOf(L, 'vial'))) R(8, bodyTop, 1, 1, v);
        R(6, bodyTop + 3, 5, 1, dark(P.inner, 0.3));
        if ((v = accOf(L, 'hipbelt'))) { R(5, 15, 3, 1, v); R(8, 16, 4, 1, v); }
        if ((v = accOf(L, 'bear'))) { R(2, 15, 2, 3, v); R(2, 14, 1, 1, v); R(3, 14, 1, 1, v); }
        if ((v = accOf(L, 'shoulderbow'))) { R(2, bodyTop - 1, 2, 2, v); R(1, bodyTop + 1, 1, 2, v); }
      } else if (back) {
        R(4, bodyTop, 9, 2, P.top);
        if ((v = accOf(L, 'shoulderbow'))) { R(13, bodyTop - 1, 2, 2, v); R(15, bodyTop + 1, 1, 2, v); }
        if ((v = accOf(L, 'bear'))) R(13, 15, 2, 3, v);
      } else {
        R(4, bodyTop, 9, 4, P.inner); R(dir === 'left' ? 7 : 6, bodyTop, 4, 2, P.top);
        if ((v = accOf(L, 'bear')) && dir === 'right') R(5, 15, 2, 3, v);
        if ((v = accOf(L, 'shoulderbow')) && dir === 'right') R(6, bodyTop - 1, 3, 2, v);
      }
    }
    if (L.coat === 'shrug') {
      const belt = L.belt || light(P.top, 0.4);
      if (L.hem) R(side ? 5 : 4, 17, side ? 7 : 9, 1, L.hem);
      if (dir === 'down') {
        R(7, bodyTop, 3, 1, P.skin); R(8, bodyTop + 1, 1, 1, '#d8b050');
        R(tx, bodyTop + 3, tw, 1, P.top); R(10, bodyTop + 3, 3, 1, P.topSh); R(7, bodyTop + 3, 2, 2, dark(P.top, 0.15));
        R(4, 15, 3, 1, belt); R(7, 16, 3, 1, belt);
        if ((v = accOf(L, 'bowcase'))) { R(11, 15, 2, 4, v); R(12, 18, 1, 1, '#d8b050'); }
        if (accOf(L, 'camera')) { R(10, 15, 2, 2, '#5ac2d6'); R(11, 16, 1, 1, '#1c2a3a'); }
      } else if (back) {
        R(tx, bodyTop + 3, tw, 1, P.top);
        if ((v = accOf(L, 'backbow'))) { R(5, bodyTop + 1, 3, 2, v); R(9, bodyTop + 1, 3, 2, v); R(8, bodyTop + 1, 1, 2, dark(v, 0.3)); R(7, bodyTop + 3, 1, 2, v); R(9, bodyTop + 3, 1, 2, v); }
        if ((v = accOf(L, 'bowcase'))) R(4, 15, 2, 4, v);
      } else {
        R(4, bodyTop + 3, 9, 1, P.top); R(4, 15, 9, 1, belt);
        if ((v = accOf(L, 'bowcase'))) { const bx = dir === 'left' ? 4 : 11; R(bx, 15, 2, 4, v); R(dir === 'left' ? 4 : 12, 18, 1, 1, '#d8b050'); }
      }
    }
    const tunic = ['shrug', 'hoodcape', 'crusader'].includes(L.coat);
    if (dir === 'left') R(4, bodyTop, 3, 5, tunic ? P.innerSh : P.topSh);
    if (dir === 'right') R(10, bodyTop, 3, 5, tunic ? P.innerSh : P.topSh);
    if (L.coat === 'maid') {
      const pink = P.trim, ap = L.apron || '#f8f8fc';
      if (back) { R(tx, bodyTop, tw, 4, P.top); R(tx, bodyTop + 4, tw, 1, P.skin); R(6, 15, 5, 2, ap); R(8, 15, 1, 1, dark(ap, 0.2)); }
      else if (side) { R(4, bodyTop, 9, 2, P.inner); R(4, bodyTop + 2, 9, 2, P.top); R(4, bodyTop + 4, 9, 1, P.skin); R(dir === 'left' ? 4 : 9, 15, 4, 3, ap); R(dir === 'left' ? 11 : 4, bodyTop, 2, 1, P.top); }
      else { R(tx, bodyTop, tw, 2, P.inner); R(tx, bodyTop, 1, 1, P.top); R(tx + tw - 1, bodyTop, 1, 1, P.top); R(8, bodyTop, 1, 1, pink); R(tx, bodyTop + 2, tw, 2, P.top); R(7, bodyTop + 2, 1, 1, pink); R(9, bodyTop + 2, 1, 1, pink); R(tx, bodyTop + 4, tw, 1, P.skin); R(6, 15, 5, 3, ap); R(7, 16, 3, 1, pink); }
    }
    if (L.coat === 'haori') {
      const gold = P.trim, ob = L.obiCol || P.top;
      if (back) { R(tx, bodyTop, tw, 5, P.top); R(4, 15, 9, 4, P.top); R(tx, bodyTop + 3, tw, 1, ob); R(8, bodyTop + 3, 1, 1, gold); }
      else if (side) { R(4, bodyTop, 9, 5, P.inner); R(dir === 'left' ? 10 : 4, bodyTop + 1, 3, 4, P.top); R(4, bodyTop + 3, 9, 1, ob); R(dir === 'left' ? 4 : 11, bodyTop + 3, 2, 1, gold); R(dir === 'left' ? 4 : 10, 15, 3, 3, P.top); }
      else { R(tx, bodyTop, tw, 5, P.inner); R(tx, bodyTop, 1, 1, P.skin); R(tx + tw - 1, bodyTop, 1, 1, P.skin); R(7, bodyTop, 1, 1, gold); R(9, bodyTop, 1, 1, gold); R(tx, bodyTop + 3, tw, 1, ob); R(8, bodyTop + 3, 1, 1, gold); R(7, 15, 3, 3, P.top); R(8, 17, 1, 1, gold); R(7, 15, 3, 1, gold); }
    }
    if (L.coat === 'bunnyvest') {
      if (side) { R(4, bodyTop, 9, 3, P.inner); R(dir === 'left' ? 9 : 4, bodyTop, 4, 3, P.top); R(4, bodyTop + 3, 9, 1, P.skin); R(dir === 'left' ? 11 : 4, bodyTop, 1, 1, L.lining || '#f4f2ee'); }
      else if (back) { R(tx, bodyTop, tw, 3, P.top); R(tx, bodyTop + 3, tw, 1, P.skin); R(7, bodyTop - 1, 3, 1, P.top); }
      else { R(tx, bodyTop, tw, 3, P.inner); R(tx, bodyTop, 2, 3, P.top); R(tx + tw - 2, bodyTop, 2, 3, P.topSh); R(tx, bodyTop, 1, 1, L.lining || '#f4f2ee'); R(tx + tw - 1, bodyTop, 1, 1, L.lining || '#f4f2ee'); R(8, bodyTop + 1, 2, 1, L.print || '#f6eef2'); R(tx, bodyTop + 3, tw, 1, P.skin); R(6, bodyTop - 1, 1, 1, P.top); R(10, bodyTop - 1, 1, 1, P.top); }
    }
    if (L.coat === 'bikini') {
      const lo = P.lower;
      if (side) {
        R(4, bodyTop, 9, 6, P.skin); R(dir === 'left' ? 9 : 4, bodyTop, 4, 6, P.skinSh);
        R(dir === 'left' ? 4 : 10, bodyTop + 1, 3, 1, P.top); R(dir === 'left' ? 7 : 9, bodyTop, 1, 1, P.top);
        R(5, 15, 7, 1, lo); R(6, 16, 5, 1, lo); R(dir === 'left' ? 9 : 7, 15, 1, 1, P.trim);
      } else {
        R(tx, bodyTop, tw, 6, P.skin); R(tx + tw - 3, bodyTop, 3, 6, P.skinSh);
        R(tx + 1, 15, tw - 2, 1, lo); R(7, 16, 3, 1, lo);
        if (back) R(tx, bodyTop + 1, tw, 1, P.top);
        else { R(tx + 1, bodyTop + 1, tw - 2, 1, P.top); R(8, bodyTop + 2, 1, 1, L.bead || '#e8c050'); R(6, bodyTop, 1, 1, P.top); R(10, bodyTop, 1, 1, P.top); R(tx, 15, 1, 1, P.trim); R(tx + tw - 1, 15, 1, 1, P.trim); }
      }
    }
    if (L.coat === 'trashcan') {
      const can = P.top, dk = dark(can, 0.3);
      R(side ? 3 : 2, bodyTop - 1, side ? 11 : 13, 18 - bodyTop, can);
      R(side ? 3 : 2, bodyTop - 1, side ? 11 : 13, 1, light(can, 0.25));
      if (!back) R(side ? 6 : 5, bodyTop - 1, side ? 5 : 7, 1, '#1a1a20');
      for (const x of side ? [5, 8, 11] : [4, 7, 10, 13]) R(x, bodyTop + 1, 1, 15 - bodyTop, dk);
      R(side ? (dir === 'left' ? 3 : 11) : 12, bodyTop, side ? 3 : 3, 18 - bodyTop, dark(can, 0.16));
    }
    if ((v = accOf(L, 'bat')) && !back) { const bx = dir === 'left' ? 2 : 13; R(bx, 14, 1, 2, '#2a2a30'); R(bx + (dir === 'left' ? -1 : 1), 16, 1, 5, v); }
    if (L.coat === 'valk') {
      const plate = P.top, glow = L.glow || '#ff9a2a';
      if (dir === 'down') { R(tx, bodyTop, tw, 1, P.skin); R(tx, bodyTop + 1, tw, 4, P.inner); R(tx, bodyTop + 1, 3, 2, plate); R(tx + tw - 3, bodyTop + 1, 3, 2, dark(plate, 0.2)); R(tx + 1, bodyTop + 2, 1, 1, glow); R(tx + tw - 2, bodyTop + 2, 1, 1, glow); R(tx, 15, 2, 2, plate); R(tx + tw - 2, 15, 2, 2, plate); R(tx + tw, bodyTop, 2, 1, L.fur || '#1e1c22'); }
      else if (back) { R(tx, bodyTop, tw, 1, P.skin); R(tx, bodyTop + 1, tw, 4, P.inner); }
      else { R(4, bodyTop, 9, 1, P.skin); R(4, bodyTop + 1, 9, 4, P.inner); R(dir === 'left' ? 4 : 9, bodyTop + 1, 4, 2, plate); R(dir === 'left' ? 5 : 11, bodyTop + 2, 1, 1, glow); }
    }
    if ((v = accOf(L, 'greatsword'))) {
      if (back) { for (let i = 0; i < 12; i++) R(3 + i, 18 - i, 1, 2, i % 4 ? v : dark(v, 0.3)); R(5, 15, 2, 2, '#1c1a20'); }
      else if (dir === 'down') { R(14, 2, 1, 12, v); R(15, 2, 1, 10, '#ff9a2a'); }
      else R(dir === 'left' ? 13 : 2, 2, 1, 12, v);
    }
    if (L.coat === 'hoodie') {
      const dk = dark(P.top, 0.16);
      if (dir === 'down') { R(tx, 15, tw, 1, dk); R(6, 14, 5, 1, dark(P.top, 0.1)); R(7, bodyTop, 1, 2, L.cord || '#f8f4ec'); R(9, bodyTop, 1, 2, L.cord || '#f8f4ec'); }
      else if (back) R(tx, 15, tw, 1, dk);
      else R(4, 15, 9, 1, dk);
    }
    if (L.coat === 'overalls') {
      const bib = P.lower, st = L.strap || '#6a4630', lo = 16 - bodyTop - 2;
      if (dir === 'down') { R(6, bodyTop + 2, 5, lo, bib); R(9, bodyTop + 2, 2, lo, P.lowerSh); R(6, bodyTop, 1, 2, st); R(10, bodyTop, 1, 2, st); if ((v = accOf(L, 'molebadge'))) R(8, bodyTop + 3, 1, 1, v); }
      else if (back) { R(tx, 15, tw, 1, bib); R(6, bodyTop, 1, 4, st); R(10, bodyTop, 1, 4, st); R(7, bodyTop + 2, 3, 1, st); }
      else { R(dir === 'left' ? 4 : 6, bodyTop + 2, 7, lo, bib); R(8, bodyTop, 1, 2, st); }
    }
    if ((v = accOf(L, 'beltlamp')) && dir !== 'left' && !back) { const lx = dir === 'right' ? 12 : 13; R(lx, 15, 2, 2, v); R(lx, 16, 2, 1, L.lampGlow || '#ffd860'); }
    const half = accOf(L, 'halfsleeves');
    const arm = accOf(L, 'bellsleeves') || (accOf(L, 'longgloves') ? P.gloves : ['vest', 'cape', 'bolero', 'offcoat', 'sleeveless', 'openvest', 'heartcorset', 'frost', 'bridal', 'bikini', 'bunnyvest', 'maid', 'valk'].includes(L.coat) && !(L.coat === 'cape' && L.sleeve) ? P.skin : L.sleeve || P.top), hand = half ? P.skin : P.gloves || P.skin;
    const sw = frame === 1 ? 1 : frame === 3 ? -1 : 0;
    if (!side) { R(aL, bodyTop + sw, 1, armH, arm); R(aR, bodyTop - sw, 1, armH, arm); R(aL, bodyTop + armH + sw, 1, 1, hand); R(aR, bodyTop + armH - sw, 1, 1, hand); }
    else { R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, armH, dark(arm, 0.12)); R(dir === 'left' ? 8 : 7, bodyTop + 1 + armH, 2, 1, hand); }
    if (half) {
      if (!side) { R(aL, bodyTop + 3 + sw, 1, armH - 3, P.gloves); R(aR, bodyTop + 3 - sw, 1, armH - 3, P.gloves); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 4, 2, armH - 3, P.gloves);
    }
    if ((v = accOf(L, 'detsleeves'))) {
      const band = L.band || '#f0b440', cf = L.cuff || P.top;
      if (!side) for (const [x, d] of [[aL, sw], [aR, -sw]]) { R(x, bodyTop + 1 + d, 1, 1, band); R(x, bodyTop + 2 + d, 1, armH - 3, v); R(x, bodyTop + armH - 1 + d, 1, 1, cf); }
      else { const ax = dir === 'left' ? 8 : 7; R(ax, bodyTop + 2, 2, 1, band); R(ax, bodyTop + 3, 2, armH - 3, dark(v, 0.08)); R(ax, bodyTop + armH, 2, 1, cf); }
    }
    if (L.coat === 'crusader') {
      const plate = L.plate || '#f2eef8', lil = mix(plate, '#9a88b8', 0.42), belt = accOf(L, 'studbelt');
      if (!side) {
        R(2, 15, 13, 5, P.lower); R(2, 15, 2, 6, back ? lil : plate); R(13, 15, 2, 6, back ? plate : lil);
        if (!back) {
          R(5, 15, 7, 3, plate); R(6, 15, 5, 3, P.top); R(6, 18, 5, 1, plate); R(7, 18, 3, 1, P.top); R(7, 19, 3, 1, plate); R(8, 19, 1, 1, P.top);
          R(tx + 1, bodyTop, tw - 2, 2, plate); R(tx + tw - 3, bodyTop, 2, 2, lil); R(tx + 1, bodyTop + 2, tw - 2, 1, P.trim);
          R(tx, bodyTop + 3, tw, 1, P.top); R(tx + 2, bodyTop + 3, 1, 1, plate); R(tx + tw - 3, bodyTop + 3, 1, 1, plate);
          R(8, bodyTop, 1, 1, accOf(L, 'ribbonbow') || '#c82838'); R(8, bodyTop + 1, 1, 1, '#e8c040');
        }
        if (belt) { R(tx, 15, tw, 1, belt); if (!back) { R(6, 15, 1, 1, light(belt, 0.4)); R(10, 15, 1, 1, light(belt, 0.4)); } }
      } else {
        const fx = dir === 'left' ? 4 : 10, bk = dir === 'left' ? 10 : 4;
        R(3, 15, 11, 5, P.lower); R(bk, 15, 3, 6, plate); R(fx, 15, 3, 4, P.top); R(dir === 'left' ? 4 : 11, 19, 2, 1, P.top);
        R(4, bodyTop, 9, 2, plate); R(bk, bodyTop, 3, 2, P.inner); R(4, bodyTop + 2, 9, 1, P.trim); R(4, bodyTop + 3, 9, 1, P.top);
        if (belt) R(4, 15, 9, 1, belt);
      }
    }
    if ((v = accOf(L, 'trwings'))) {
      if (!side) { R(1, bodyTop - 1, 2, 3, v); R(14, bodyTop - 1, 2, 3, v); }
      else R(dir === 'left' ? 12 : 3, bodyTop, 2, 3, v);
    }
    if (accOf(L, 'trarm') && !side) R(aR, bodyTop + 3 - sw, 1, 2, '#34323e');
    if ((v = accOf(L, 'gauntlets'))) {
      if (!side) { R(aL, bodyTop + 3 + sw, 1, 2, v); R(aR, bodyTop + 3 - sw, 1, 2, v); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 4, 2, 2, v);
    }
    if ((v = accOf(L, 'wingpad'))) {
      const s2 = mix(v, '#9a88b8', 0.4);
      if (dir === 'down') { R(0, bodyTop - 1, 3, 1, v); R(0, bodyTop, 4, 1, v); R(1, bodyTop + 1, 3, 1, s2); }
      else if (back) { R(14, bodyTop - 1, 3, 1, v); R(13, bodyTop, 4, 1, v); R(13, bodyTop + 1, 3, 1, s2); }
      else if (dir === 'right') { R(5, bodyTop - 1, 4, 1, v); R(4, bodyTop, 5, 1, s2); }
    }
    if ((v = accOf(L, 'platepad'))) {
      const s2 = mix(v, '#9a88b8', 0.42);
      if (dir === 'down') { R(13, bodyTop, 3, 2, v); R(14, bodyTop + 2, 2, 1, s2); }
      else if (back) { R(1, bodyTop, 3, 2, v); R(1, bodyTop + 2, 2, 1, s2); }
      else if (dir === 'left') { R(7, bodyTop, 3, 2, v); R(8, bodyTop + 2, 2, 1, s2); }
    }
    if (L.coat === 'sleeveless') {
      const gb = accOf(L, 'gembow');
      R(tx, 15, tw, 1, P.trim);
      if (dir === 'down') {
        R(tx, bodyTop, 1, 1, P.skin); R(tx + tw - 1, bodyTop, 1, 1, P.skin); R(tx + 1, bodyTop, 1, 1, P.trim); R(tx + tw - 2, bodyTop, 1, 1, P.trim);
        R(7, bodyTop, 3, 1, P.inner); R(7, bodyTop + 2, 1, 3, P.trim);
        if (gb) { R(7, bodyTop + 1, 3, 1, gb); R(8, bodyTop + 1, 1, 1, accOf(L, 'hairloop') || '#2c5ad8'); }
        if (L.hem) R(4, 17, 9, 1, L.hem);
      } else if (back) {
        R(tx, bodyTop, 1, 1, P.skin); R(tx + tw - 1, bodyTop, 1, 1, P.skin);
        if (L.hem) R(4, 17, 9, 1, L.hem);
      } else {
        R(dir === 'left' ? 4 : 11, bodyTop, 2, 1, P.inner); R(dir === 'left' ? 6 : 10, bodyTop, 1, 1, P.trim);
        if (gb) R(dir === 'left' ? 4 : 12, bodyTop + 1, 1, 1, gb);
        R(4, 15, 9, 1, P.trim); if (L.hem) R(5, 17, 7, 1, L.hem);
      }
    }
    if (L.coat === 'hoodcape') {
      const cs = mix(P.top, P.topSh, 0.45), belt = accOf(L, 'tunicbelt');
      if (dir === 'down') {
        R(4, 15, 9, 2, P.inner); R(10, 15, 3, 2, P.innerSh);
        if (belt) { R(tx, 14, tw, 1, belt); R(9, 14, 1, 1, '#b8a45a'); }
        R(aL, bodyTop, 5, 2, P.top); R(10, bodyTop, 5, 2, cs);
        R(7, bodyTop, 1, 1, P.trim); R(9, bodyTop, 1, 1, P.trim); R(6, bodyTop + 1, 1, 1, P.trim); R(10, bodyTop + 1, 1, 1, P.trim);
        R(aL, bodyTop + 2, 5, 1, P.trim); R(10, bodyTop + 2, 5, 1, P.trim);
        R(8, bodyTop, 1, 1, '#e8862a');
      } else if (back) {
        R(4, 15, 9, 2, P.inner); R(4, 16, 9, 1, P.innerSh);
        R(aL, bodyTop, 13, 3, P.top); R(9, bodyTop, 6, 3, cs);
        R(6, bodyTop, 5, 1, L.lining || P.topSh); R(5, bodyTop, 1, 1, P.trim); R(11, bodyTop, 1, 1, P.trim);
        R(aL, bodyTop + 3, 13, 1, P.trim);
      } else {
        const bk = dir === 'left' ? 10 : 4;
        R(4, 15, 9, 2, P.inner); R(bk, 15, 3, 2, P.innerSh);
        if (belt) { R(4, 14, 9, 1, belt); R(dir === 'left' ? 5 : 11, 14, 1, 1, '#b8a45a'); }
        R(4, bodyTop, 9, 2, dir === 'left' ? P.top : cs); R(bk, bodyTop, 3, 3, cs);
        R(dir === 'left' ? 4 : 7, bodyTop + 2, 6, 1, P.trim); R(bk, bodyTop + 3, 3, 1, P.trim);
        R(dir === 'left' ? 4 : 12, bodyTop, 1, 2, P.trim);
      }
    }
    if ((v = accOf(L, 'plates'))) {
      if (!side) { R(aL, bodyTop + sw, 1, 1, v); R(aR, bodyTop - sw, 1, 1, v); R(aL, bodyTop + 3 + sw, 1, 1, v); R(aR, bodyTop + 3 - sw, 1, 1, v); R(aL, bodyTop + 4 + sw, 1, 1, P.skin); R(aR, bodyTop + 4 - sw, 1, 1, P.skin); }
      else { R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 1, v); R(dir === 'left' ? 8 : 7, bodyTop + 3, 2, 1, v); R(dir === 'left' ? 8 : 7, bodyTop + 4, 2, 1, P.skin); }
    }
    if ((v = accOf(L, 'glowcuff'))) {
      if (!side) { R(aL, bodyTop + armH - 1 + sw, 1, 1, v); R(aR, bodyTop + armH - 1 - sw, 1, 1, v); }
      else R(dir === 'left' ? 8 : 7, bodyTop + armH, 2, 1, v);
    }
    if (L.coat === 'raglan') {
      if (!side) { R(aL, bodyTop + 2 + sw, 1, armH - 2, P.skin); R(aR, bodyTop + 2 - sw, 1, armH - 2, P.skin); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 3, 2, armH - 2, P.skin);
    }
    if ((v = accOf(L, 'heartcuff'))) {
      if (!side) { R(aL, bodyTop + sw, 1, 1, P.skin); R(aR, bodyTop - sw, 1, 1, P.skin); R(aL, bodyTop + 1 + sw, 1, 1, v); R(aR, bodyTop + 1 - sw, 1, 1, v); }
      else { R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 1, P.skin); R(dir === 'left' ? 8 : 7, bodyTop + 2, 2, 1, v); }
    }
    if (accOf(L, 'rolled')) {
      if (!side) { R(aL, bodyTop + 3 + sw, 1, armH - 3, P.skin); R(aR, bodyTop + 3 - sw, 1, armH - 3, P.skin); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 4, 2, armH - 3, P.skin);
    }
    if ((v = accOf(L, 'prosthetic'))) { if (!side) R(back ? aL : aR, bodyTop + 3 - (back ? -sw : sw), 1, armH - 2, light(v, 0.3)); else if (dir === 'left') R(8, bodyTop + 4, 2, armH - 2, v); }
    if (L.coat === 'shrug') {
      const sh = L.shoulder || light(P.top, 0.3);
      if (!side) { R(aL, bodyTop + sw, 1, 3, P.top); R(aR, bodyTop - sw, 1, 3, P.top); R(aL, bodyTop + sw, 1, 1, sh); R(aR, bodyTop - sw, 1, 1, sh); R(aL, bodyTop + armH - 1 + sw, 1, 1, P.trim); R(aR, bodyTop + armH - 1 - sw, 1, 1, P.trim); }
      else { const ax = dir === 'left' ? 8 : 7; R(ax, bodyTop + 1, 2, 3, P.top); R(ax, bodyTop + 1, 2, 1, sh); R(ax, bodyTop + armH, 2, 1, P.trim); }
      if ((v = accOf(L, 'glove1')) && dir !== 'right') { if (!side) R(back ? aR : aL, bodyTop + armH + (back ? -sw : sw), 1, 1, v); else R(8, bodyTop + 1 + armH, 2, 1, v); }
    }
    if (L.coat === 'wrap') {
      if (!side) { R(aL, bodyTop + 1 + sw, 1, 2, P.top); R(aR, bodyTop + 1 - sw, 1, 2, P.top); R(aL, bodyTop + 3 + sw, 1, armH - 2, P.gloves); R(aR, bodyTop + 3 - sw, 1, armH - 2, P.gloves); if (accOf(L, 'medal')) R(back ? aL : aR, bodyTop + 1 - (back ? -sw : sw), 1, 1, '#d83040'); }
      else { R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 2, P.top); R(dir === 'left' ? 8 : 7, bodyTop + 3, 2, armH - 2, P.gloves); }
    }
    if (L.coat === 'bodice') {
      const rs = accOf(L, 'redsleeve') || P.top;
      if (!side) { R(back ? aR : aL, bodyTop + 1 + (back ? -sw : sw), 1, armH - 1, rs); R(back ? aL : aR, bodyTop + 3 - (back ? -sw : sw), 1, armH - 3, accOf(L, 'ribbonwrap') || P.skin); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, armH, dir === 'right' ? rs : P.skin);
    }
    if (L.coat === 'crop') {
      if (!side) { R(aL, bodyTop + sw, 1, 3, P.top); R(aR, bodyTop - sw, 1, 3, P.top); R(aL, bodyTop + armH - 1 + sw, 1, 1, P.gloves); R(aR, bodyTop + armH - 1 - sw, 1, 1, P.gloves); if ((v = accOf(L, 'whitesleeve'))) R(back ? aL : aR, bodyTop + 3 - (back ? -sw : sw), 1, armH - 4, v); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 3, P.top);
    }
    if (L.coat === 'gyaru') {
      if (!side) { R(aL, bodyTop + sw, 1, 2, P.top); R(aR, bodyTop - sw, 1, 2, P.top); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 2, P.top);
    }
    if (L.coat === 'volt') {
      if (!side) { R(aL, bodyTop + sw, 1, 1, P.top); R(aR, bodyTop - sw, 1, 1, P.top); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 1, P.top);
    }
    if (L.coat === 'offcoat') {
      if (!side) { R(aL, bodyTop + 2 + sw, 1, armH - 1, P.top); R(aR, bodyTop + 2 - sw, 1, armH - 1, P.top); R(aL, bodyTop + 2 + sw, 1, 1, L.trim); R(aR, bodyTop + 2 - sw, 1, 1, L.trim); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 3, 2, armH - 1, P.top);
    }
    if (L.coat === 'half') {
      const bs = accOf(L, 'blacksleeve') || P.inner;
      if (!side) {
        R(back ? aR : aL, bodyTop + 1 + (back ? -sw : sw), 1, armH, P.top);
        R(back ? aL : aR, bodyTop + 1 - (back ? -sw : sw), 1, armH - 1, bs);
        if (!back) { R(aR, bodyTop + armH - sw, 1, 1, accOf(L, 'pinkglove') || P.skin); R(aL - 1, bodyTop + armH - 1 + sw, 1, 2, P.top); }
      } else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, armH, dir === 'left' ? P.top : bs);
    }
    if (L.coat === 'bolero') {
      const gl = accOf(L, 'longglove1');
      if (!side) { if (gl) R(back ? aR : aL, bodyTop + 2 + (back ? -sw : sw), 1, armH - 1, gl); R(aL, bodyTop + sw, 1, 2, P.top); R(aR, bodyTop - sw, 1, 2, P.top); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 2, P.top);
    }
    if ((v = accOf(L, 'icegauntlet'))) {
      if (!side) { const x = back ? aR : aL, d = back ? -sw : sw; R(x, bodyTop + 2 + d, 1, armH - 1, v); R(x, bodyTop + 1 + d, 1, 1, '#62c4f4'); if ((v = accOf(L, 'pelt'))) R(x - (back ? -1 : 1), bodyTop + armH + d, 1, 4, v); }
      else if (dir === 'right') R(7, bodyTop + 3, 2, armH - 2, v);
    }
    if ((v = accOf(L, 'bracerR')) && !side) R(back ? aL : aR, bodyTop + 3 - (back ? -sw : sw), 1, armH - 3, v);
    if ((v = accOf(L, 'armbandL'))) { if (!side) R(back ? aR : aL, bodyTop + 1 + (back ? -sw : sw), 1, 1, v); else if (dir === 'right') R(7, bodyTop + 2, 2, 1, v); }
    if ((v = accOf(L, 'sleeve1'))) { if (!side) R(back ? aR : aL, bodyTop + (back ? -sw : sw), 1, armH, v); else if (dir === 'right') R(7, bodyTop + 1, 2, armH, v); }
    if ((v = accOf(L, 'bracer'))) {
      if (!side) R(back ? aR : aL, bodyTop + 3 + (back ? -sw : sw), 1, armH - 2, v);
      else if (dir === 'right') R(7, bodyTop + 4, 2, armH - 2, v);
    }
    if ((v = accOf(L, 'dragonpad'))) {
      if (!side) { const x = back ? aL : aR; R(x - (back ? 0 : 1), bodyTop - 1, 2, 2, v); R(back ? x + 1 : x, bodyTop + 1, 1, 1, '#f2f2f4'); }
      else if (dir === 'left') { R(7, bodyTop, 3, 2, v); R(8, bodyTop + 2, 1, 2, '#f2f2f4'); }
    }
    if (L.coat === 'leo') {
      if (!side) { const d = back ? -sw : sw; R(back ? aR : aL, bodyTop + 1 + d, 1, armH, '#1e1c28'); R(back ? aR : aL, bodyTop + 1 + d, 1, 1, accOf(L, 'furcuff') || '#f4f4f8'); R(back ? aL : aR, bodyTop + 3 - d, 1, armH - 1, accOf(L, 'onesleeve') || P.top); }
      else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, armH, dir === 'right' ? '#1e1c28' : accOf(L, 'onesleeve') || P.top);
    } else if ((v = accOf(L, 'onesleeve')) && !side) R(back ? aL : aR, bodyTop - (back ? -sw : sw), 1, armH + 1, v);
    if (dir === 'down') {
      if ((v = accOf(L, 'leotard')) && L.coat !== 'leo') R(8, bodyTop + 1, 1, 3, v);
      if ((v = accOf(L, 'chestplate'))) { R(7, bodyTop, 3, 2, v); R(8, bodyTop, 1, 1, '#62c4f4'); }
      if ((v = accOf(L, 'crossbelt'))) { R(6, bodyTop + 1, 1, 1, v); R(7, bodyTop + 2, 1, 1, v); R(8, bodyTop + 3, 1, 1, v); }
      if ((v = accOf(L, 'waistbow'))) R(6, 15, 3, 1, v);
    }
    if ((v = accOf(L, 'spikepad')) && dir !== 'right') { R(dir === 'left' ? 7 : back ? aR - 1 : aL - 1, bodyTop - 1, 3, 3, v); R(dir === 'left' ? 8 : back ? aR : aL, bodyTop - 2, 1, 1, '#d8dce4'); }
    if ((v = accOf(L, 'pauldron')) && dir !== 'right') R(dir === 'left' ? 7 : back ? aR : aL, bodyTop - 1, 2, 2, v);
    if ((v = accOf(L, 'sashtail')) && !side) R((L.sashSide === 'r') !== back ? 13 : 3, 15, 1, 5, v);
    if (accOf(L, 'drills') && !side) { R(1, 12 + oy, 2, 4, P.hair); R(14, 12 + oy, 2, 4, P.hair); }
    if ((v = accOf(L, 'laceband')) && dir !== 'up') { if (side) R(dir === 'left' ? 6 : 5, bodyTop, 6, 1, v); else R(tx, bodyTop, tw, 1, v); }
    const puff = accOf(L, 'puff');
    if (puff) { if (!side) { R(aL, bodyTop + sw, 1, 2, puff); R(aR, bodyTop - sw, 1, 2, puff); } else R(dir === 'left' ? 8 : 7, bodyTop + 1, 2, 2, puff); }
    if (accOf(L, 'gauntlet') && dir !== 'left') R(dir === 'right' ? 7 : aR, bodyTop + 2, dir === 'right' ? 3 : 2, 4, '#9aa0aa');
    if (accOf(L, 'cane') && dir !== 'up') R(dir === 'left' ? aL - 1 : aR + 1, bodyTop + 2, 1, 9, '#2a2226');
    if ((v = accOf(L, 'zigzag'))) { const x0 = side ? 5 : 4, w = side ? 7 : 9; R(x0, 17, w, 1, v); for (let x = x0 + 1; x < x0 + w; x += 2) R(x, 16, 1, 1, v); }
    if ((v = accOf(L, 'bigbelt'))) {
      if (!side) { R(tx, 14, 5, 1, v); R(tx + 5, 15, tw - 5, 1, v); if (!back) R(tx + 5, 14, 2, 2, '#c8ccd8'); }
      else { R(4, 14, 9, 1, v); R(dir === 'left' ? 5 : 10, 14, 2, 1, '#c8ccd8'); }
    }
    if ((v = accOf(L, 'witchcape'))) {
      const tr = L.capeTrim || P.trim;
      if (back) { R(2, 11 + oy, 13, 9, v); R(9, 11 + oy, 6, 9, dark(v, 0.16)); R(2, 20, 13, 1, tr); if (L.capeZig) for (let x = 2; x < 15; x += 2) R(x, 18 + (x % 4 ? 0 : 1), 1, 1, L.capeZig); }
      else if (!side) { R(tx - 1, bodyTop, 2, 1, v); R(tx + tw - 1, bodyTop, 2, 1, dark(v, 0.16)); R(tx, bodyTop, 1, 1, tr); R(tx + tw - 1, bodyTop, 1, 1, tr); }
      else R(dir === 'left' ? 9 : 6, bodyTop, 2, 1, tr);
    }
    if ((v = accOf(L, 'mstaff')) && side) { const sx = dir === 'left' ? 9 : 7; R(sx, 3, 1, 18, v); R(sx, 1, 1, 2, v); R(dir === 'left' ? sx - 1 : sx, 0, 2, 1, v); R(dir === 'left' ? sx - 1 : sx + 1, 1, 1, 1, '#e0304a'); }
    if ((v = accOf(L, 'katana'))) {
      if (dir === 'down') { R(14, 14, 1, 1, '#c8a050'); R(15, 15, 1, 3, v); }
      else if (back) R(1, 15, 1, 3, v);
      else if (dir === 'left') { R(3, 13, 1, 2, '#3a2a22'); R(3, 15, 1, 1, '#c8a050'); R(13, 15, 1, 1, v); R(13, 16, 2, 1, v); }
      else { R(3, 15, 1, 1, v); R(2, 16, 2, 1, v); }
    }
    if ((v = accOf(L, 'sheath')) && dir !== 'up') { const sx = dir === 'left' ? aL : aR; R(sx, bodyTop + 7, 1, 2, '#d8b050'); R(dir === 'left' ? sx - 1 : sx + 1, bodyTop + 8, 1, 4, v); R(dir === 'left' ? sx - 2 : sx + 2, bodyTop + 11, 1, 3, v); }
    if ((v = accOf(L, 'revolvers')) && dir !== 'up') { if (!side) { R(aL, bodyTop + armH - 5, 1, 5, v); R(aR, bodyTop + armH + 1, 1, 5, v); } else R(dir === 'left' ? 7 : 9, bodyTop + armH + 1, 1, 5, v); }
    if ((v = accOf(L, 'mechcase')) && dir !== 'up') { R(dir === 'right' ? aR + 1 : aL - 3, bodyTop + armH, 3, 5, v); R(dir === 'right' ? aR + 2 : aL - 2, bodyTop + armH + 2, 1, 1, L.caseGold || '#c8a050'); }
    if ((v = accOf(L, 'bunnybag')) && dir !== 'up') R(dir === 'left' ? 11 : 4, 15, 2, 2, v);
    if ((v = accOf(L, 'voltblade')) && dir !== 'up') { R(dir === 'left' ? aL - 1 : aR + 1, bodyTop + 4, 2, 8, v); R(dir === 'left' ? aL - 1 : aR + 1, bodyTop + 5, 1, 6, L.glow || '#c8f040'); }
    if ((v = accOf(L, 'sword') || accOf(L, 'naginata')) && dir !== 'up') { R(dir === 'left' ? aL - 1 : aR + 1, bodyTop + 5, 1, 7, v); R(dir === 'left' ? aL - 2 : aR, bodyTop + 4, 3, 1, '#d8b050'); }
    const hy = 2 + oy;
    R(4, hy + 2, 9, 7, P.skin);
    R(3, hy, 11, 3, P.hair);
    if (L.crown === 'wind' && !side) { R(2, hy + 1, 1, 2, P.hair); R(14, hy + 1, 1, 2, P.hair); }
    else if (L.crown === 'wind') R(dir === 'left' ? 13 : 3, hy + 1, 1, 2, P.hair);
    else if (L.ahoge === 'curl') R(8, hy - 1, 2, 1, P.hair);
    else if (L.crown === 'spiky') {
      R(5, hy - 1, 1, 1, P.hair); R(8, hy - 2, 2, 2, P.hair); R(10, hy - 1, 2, 1, P.hair);
      if (!side) { R(2, hy + 1, 1, 2, P.hair); R(14, hy + 3, 1, 2, P.hair); }
      else R(dir === 'left' ? 13 : 3, hy + 1, 1, 2, P.hair);
    }
    else if (L.crown === 'messy' || L.ahoge) { R(4, hy - 1, 2, 1, P.hair); R(8, hy - (L.ahoge ? 2 : 1), 2, L.ahoge ? 2 : 1, P.hair); R(11, hy - 1, 2, 1, P.hair); }
    if (back) {
      R(3, hy, 11, L.back === 'short' || L.back === 'nape' ? 8 : 9, P.hair);
      if (L.back === 'wolf') { R(4, hy + 9, 2, 1, P.hair); R(11, hy + 9, 2, 1, P.hair); R(8, hy + 2, 1, 6, mix(P.hair, P.hairSh, 0.45)); }
      if (L.back === 'flick') { const sh = mix(P.hair, P.hairSh, 0.45); R(3, hy + 2, 1, 5, sh); R(13, hy + 2, 1, 5, sh); R(8, hy + 1, 1, 5, sh); if (P.tips) R(3, hy + 7, 11, 2, P.tips); }
      if (L.back === 'wave') { const sh = mix(P.hair, P.hairSh, 0.45); R(3, hy + 8, 11, 6, P.hair); R(2, hy + 9, 1, 4, P.hair); R(14, hy + 9, 1, 4, P.hair); R(4, hy + 14, 3, 1, P.hair); R(9, hy + 14, 3, 1, P.hair); R(6, hy + 2, 1, 11, sh); R(10, hy + 3, 1, 10, sh); if (P.tips) { R(3, hy + 11, 11, 3, P.tips); R(2, hy + 11, 1, 2, P.tips); R(14, hy + 11, 1, 2, P.tips); } }
      if (L.back === 'layer') { const sh = mix(P.hair, P.hairSh, 0.45); R(3, hy + 8, 11, 3, P.hair); R(2, hy + 8, 1, 3, P.hair); R(14, hy + 8, 1, 3, P.hair); R(4, hy + 11, 2, 1, P.hair); R(7, hy + 11, 3, 1, P.hair); R(11, hy + 11, 2, 1, P.hair); R(5, hy + 3, 1, 8, sh); R(8, hy + 2, 1, 9, sh); R(11, hy + 3, 1, 8, sh); }
    }
    else if (dir === 'down') {
      const long = L.sides === 'long';
      if (L.sides === 'flick') {
        const tc = P.tips || P.hair, sh = mix(P.hair, P.hairSh, 0.45);
        R(3, hy + 3, 2, 6, P.hair); R(12, hy + 3, 2, 6, P.hair);
        R(3, hy + 3, 1, 4, sh); R(13, hy + 3, 1, 4, sh); R(12, hy, 2, 3, sh);
        R(3, hy + 7, 2, 2, tc); R(12, hy + 7, 2, 2, tc); R(3, hy + 7, 1, 1, mix(tc, P.hairSh, 0.3)); R(13, hy + 7, 1, 1, mix(tc, P.hairSh, 0.3));
      } else if (L.sides === 'feather') {
        const sh = mix(P.hair, P.hairSh, 0.45);
        R(3, hy + 3, 2, 5, P.hair); R(12, hy + 3, 2, 5, P.hair); R(2, hy + 4, 1, 2, P.hair); R(14, hy + 4, 1, 2, P.hair);
        R(4, hy + 4, 1, 4, sh); R(12, hy + 4, 1, 4, sh);
      } else if (L.sides === 'wave') {
        const sh = mix(P.hair, P.hairSh, 0.45);
        R(3, hy + 3, 2, 9, P.hair); R(12, hy + 3, 2, 9, P.hair); R(2, hy + 6, 1, 5, P.hair); R(14, hy + 6, 1, 5, P.hair);
        R(3, hy + 4, 1, 6, sh); R(13, hy + 4, 1, 6, sh);
        if (P.tips) { R(2, hy + 10, 2, 2, P.tips); R(13, hy + 10, 2, 2, P.tips); }
      } else if (L.sides === 'layer') {
        const sh = mix(P.hair, P.hairSh, 0.45);
        R(3, hy + 3, 2, 8, P.hair); R(12, hy + 3, 2, 8, P.hair); R(2, hy + 7, 1, 3, P.hair); R(14, hy + 7, 1, 3, P.hair);
        R(3, hy + 4, 1, 5, sh); R(13, hy + 4, 1, 5, sh); R(12, hy, 2, 3, sh);
      } else if (L.sides !== 'none') { R(3, hy + 3, 2, long ? 6 : 3, P.hair); R(12, hy + 3, 2, long ? 6 : 3, P.hair); }
      if (L.bangs === 'wisp' || L.bangs === 'sweep') R(8, hy + 3, 1, 2, P.hair);
      if (L.bangs === 'sweep') R(5, hy + 3, 2, 2, P.hair);
      if (L.bangs === 'blunt') R(4, hy + 3, 9, 1, P.hair);
      else if (L.bangs === 'eye') { R(5, hy + 3, 4, 2, P.hair); R(10, hy + 3, 2, 1, P.hair); }
      else if (L.bangs === 'hide') { R(4, hy + 3, 5, 2, P.hair); R(10, hy + 3, 2, 1, P.hair); }
      else if (L.bangs === 'swoop') { R(5, hy + 3, 5, 1, P.hair); R(8, hy + 4, 2, 1, P.hair); R(4, hy + 3, 1, 2, P.hair); }
      else if (L.bangs !== 'neat' && L.bangs !== 'parted') { R(5, hy + 3, 3, 1, P.hair); R(9, hy + 3, 2, 1, P.hair); }
      if (L.streak && L.streakShape === 'lock') R(4, hy + 2, 1, 7, P.streak);
      else if (L.streak && L.streakShape === 'under') R(4, hy + 6, 1, 3, P.streak);
      else if (L.streak) R(L.streakSide === 'r' ? 11 : L.streakSide === 'c' ? 7 : 4, hy + 2, L.streakSide === 'c' ? 1 : 2, L.streakSide === 'c' ? 2 : L.sides === 'long' ? 7 : 3, P.streak);
    } else {
      R(dir === 'left' ? 8 : 4, hy + 2, 5, 5, P.hair);
      R(dir === 'left' ? 4 : 11, hy + 3, 2, 1, P.hair);
      if (L.sides === 'long') R(dir === 'left' ? 11 : 4, hy + 4, 2, 5, P.hair);
      if (L.sides === 'layer' || L.sides === 'wave') R(dir === 'left' ? 11 : 4, hy + 4, 2, 7, P.hair);
      if (L.sides === 'feather') { R(dir === 'left' ? 11 : 4, hy + 4, 2, 4, P.hair); R(dir === 'left' ? 13 : 3, hy + 5, 1, 2, P.hair); }
      if (L.sides === 'flick') { R(dir === 'left' ? 11 : 4, hy + 4, 2, 4, P.hair); R(dir === 'left' ? 11 : 4, hy + 6, 2, 2, P.tips || P.hair); }
    }
    if (P.tips && !side && L.back === 'long' && L.tipsBand !== false) R(3, 13 + oy, 10, 3, P.tips);
    const eyeCol = mix(P.eye, INK, 0.25);
    if (dir === 'down') {
      if (male) { R(6, hy + 5, 1, 1, eyeCol); R(10, hy + 5, 1, 1, eyeCol); R(5, hy + 4, 2, 1, P.hairDk); R(10, hy + 4, 2, 1, P.hairDk); }
      else { R(6, hy + 5, 1, 2, eyeCol); R(10, hy + 5, 1, 2, eyeCol); if (L.eyeFade) { R(6, hy + 6, 1, 1, P.eye2); R(10, hy + 6, 1, 1, P.eye2); } }
      if (L.bangs === 'eye' || L.bangs === 'hide') R(L.bangs === 'hide' ? 5 : 6, hy + 4, L.bangs === 'hide' ? 2 : 1, 3, P.hair);
    }
    if (dir === 'left') R(5, hy + 5, 1, male ? 1 : 2, eyeCol);
    if (dir === 'right') R(11, hy + 5, 1, male ? 1 : 2, eyeCol);
    if (L.face === 'visor' && !back) {
      const pl = L.visor || '#1c1d24';
      if (dir === 'down') { R(5, hy + 3, 7, 4, pl); R(7, hy + 7, 3, 1, pl); R(5, hy + 5, 2, 1, P.eye); R(10, hy + 5, 2, 1, P.eye); R(3, hy + 4, 1, 2, L.earCol || '#d8302e'); R(13, hy + 4, 1, 2, L.earCol || '#d8302e'); }
      else { R(dir === 'left' ? 4 : 8, hy + 3, 5, 4, pl); R(dir === 'left' ? 4 : 11, hy + 5, 2, 1, P.eye); R(dir === 'left' ? 9 : 6, hy + 4, 2, 2, L.earCol || '#d8302e'); }
    }
    if ((v = accOf(L, 'foxears'))) { R(3, hy - 3, 2, 3, v); R(12, hy - 3, 2, 3, v); R(3, hy - 4, 1, 1, v); R(13, hy - 4, 1, 1, v); if (!back) { R(4, hy - 2, 1, 1, '#d8ccd4'); R(12, hy - 2, 1, 1, '#d8ccd4'); } }
    if ((v = accOf(L, 'horns'))) { R(4, hy - 2, 1, 2, v); R(12, hy - 2, 1, 2, v); R(3, hy - 3, 1, 1, v); R(13, hy - 3, 1, 1, v); }
    if ((v = accOf(L, 'sweephorns'))) { R(2, hy - 1, 1, 3, v); R(13, hy - 1, 1, 3, v); R(3, hy - 2, 1, 1, '#9a1c2c'); R(12, hy - 2, 1, 1, '#9a1c2c'); }
    if ((accOf(L, 'glasses') || accOf(L, 'roundglasses')) && !back) { const gv = accOf(L, 'glasses'); R(dir === 'left' ? 4 : dir === 'right' ? 9 : 5, hy + 5, dir === 'down' ? 7 : 4, 1, typeof gv === 'string' && gv[0] === '#' ? gv : '#20202a'); }
    if ((v = accOf(L, 'bubble'))) { R(1, hy - 2, 15, 1, v); R(1, hy - 2, 1, 11, v); R(15, hy - 2, 1, 11, v); R(3, hy - 1, 1, 1, '#ffffff'); }
    if ((v = accOf(L, 'headphones'))) { R(4, hy - 2, 9, 1, v); R(2, hy + 3, 2, 3, v); R(13, hy + 3, 2, 3, v); if (!back) { R(2, hy + 4, 1, 1, L.cupRing || '#d8a830'); R(14, hy + 4, 1, 1, L.cupRing || '#d8a830'); } }
    if ((v = accOf(L, 'maidcap'))) { R(4, hy - 1, 8, 1, v); R(5, hy - 2, 6, 1, v); if (!back) { R(4, hy - 1, 1, 1, L.capRibbon || P.trim); R(11, hy - 1, 1, 1, L.capRibbon || P.trim); } }
    if ((v = accOf(L, 'catband'))) { R(3, hy - 2, 2, 2, v); R(12, hy - 2, 2, 2, v); R(3, hy - 3, 1, 1, v); R(13, hy - 3, 1, 1, v); if (!back) { R(4, hy - 2, 1, 1, L.neon || '#fb2894'); R(12, hy - 2, 1, 1, L.neon || '#fb2894'); } }
    if ((v = accOf(L, 'beret'))) { R(3, hy - 1, 12, 2, v); R(5, hy - 2, 8, 1, v); if (accOf(L, 'beretgold')) { R(2, hy + 1, 2, 2, '#d8b050'); R(13, hy + 1, 2, 2, '#d8b050'); } else if (!back) R(13, hy + 1, 2, 2, accOf(L, 'flower') || '#8c5ae8'); }
    if ((v = accOf(L, 'ushanka'))) { R(2, hy - 2, 13, 4, v); R(11, hy, 2, 2, '#d2aa52'); }
    if (accOf(L, 'molehat') && !back) { R(1, hy + 2, 2, 6, '#4e3a2e'); R(14, hy + 2, 2, 6, '#4e3a2e'); R(1, hy + 7, 2, 1, '#f0eadc'); R(14, hy + 7, 2, 1, '#f0eadc'); if (dir === 'down') R(14, hy - 1, 1, 2, '#d85030'); }
    if (accOf(L, 'molehat')) { R(1, hy - 3, 15, 5, '#ece6d8'); R(1, hy + 1, 15, 1, '#5c4030'); if (!back) { R(5, hy - 2, 2, 2, '#2a2024'); R(10, hy - 2, 2, 2, '#2a2024'); } }
    if ((v = accOf(L, 'tiara'))) { R(6, hy - 1, 5, 1, v); R(7, hy - 2, 1, 1, v); R(9, hy - 2, 1, 1, v); R(8, hy - 3, 1, 2, '#ffffff'); }
    if (accOf(L, 'crown')) { R(5, hy - 2, 7, 2, '#e8d070'); R(5, hy - 3, 1, 1, '#e8d070'); R(8, hy - 3, 1, 1, '#e8d070'); R(11, hy - 3, 1, 1, '#e8d070'); }
    if ((v = accOf(L, 'helmet'))) { R(3, hy - 1, 11, 5, v); R(3, hy + 3, 11, 1, light(v, 0.3)); R(7, hy - 2, 3, 2, '#e8e8f0'); }
    if ((v = accOf(L, 'laurel')) && !back) R(dir === 'left' ? 3 : 10, hy - 3, 3, 1, v);
    if ((v = accOf(L, 'fxhairpin'))) { R(5, hy - 4, 2, 2, v); R(10, hy - 4, 2, 2, v); R(3, hy - 2, 11, 1, '#d8b048'); R(2, hy - 1, 1, 3, v); R(14, hy - 1, 1, 3, v); }
    if ((v = accOf(L, 'talismancap'))) { R(4, hy - 3, 9, 2, v); R(2, hy - 5, 2, 3, '#f0d050'); }
    if ((v = accOf(L, 'hat'))) { R(2, hy - 1, 13, 2, v); R(4, hy - 3, 9, 3, v); }
    if (L.back === 'hightail') {
      R(6, hy - 2, 4, 2, P.hair); R(7, hy - 2, 2, 1, P.hairSh);
      if (back) { R(7, hy + 6, 3, 10, P.hair); R(8, hy + 7, 1, 8, P.hairSh); if (P.tips) R(7, hy + 13, 3, 3, P.tips); }
    }
    if ((v = accOf(L, 'xclips')) && !back) { if (dir === 'down') { R(4, hy + 3, 1, 1, v); R(12, hy + 3, 1, 1, v); } else R(dir === 'left' ? 5 : 11, hy + 3, 1, 1, v); }
    if ((v = accOf(L, 'trflowers')) && !back) { R(dir === 'left' ? 4 : 8, hy, 2, 1, v); R(dir === 'left' ? 7 : 11, hy + 1, 2, 1, v); R(dir === 'left' ? 2 : 13, hy + 2, 2, 1, v); }
    if ((v = accOf(L, 'trtuft'))) R(dir === 'left' ? 2 : 12, hy - 2, 3, 2, v);
    if ((v = accOf(L, 'thhat'))) {
      const lean = dir === 'right' ? -1 : back ? -1 : 1, tipX = lean > 0 ? 9 : 6;
      R(0, hy + 2, 17, 1, '#b8a4ec'); R(0, hy + 1, 17, 1, v); R(0, hy + 1, 1, 1, '#b8a4ec'); R(16, hy + 1, 1, 1, '#b8a4ec');
      R(4, hy, 9, 1, '#b02a3a');
      if (!back) { R(5, hy, 2, 1, '#8a5ae8'); R(8, hy, 2, 1, '#c8a8ff'); R(11, hy, 1, 1, '#8a5ae8'); }
      R(5, hy - 1, 7, 1, v); R(lean > 0 ? 6 : 5, hy - 2, 5, 1, v); R(tipX - 1, hy - 3, 3, 1, v); R(tipX, hy - 4, 1, 1, v);
    }
    if ((v = accOf(L, 'witchhat'))) {
      const band = '#d03a2c', zig = '#f8a030', lean = dir === 'right' ? -1 : back ? -1 : 1, tipX = lean > 0 ? 10 : 5;
      R(1, hy + 1, 15, 1, v); R(1, hy + 1, 1, 1, '#f0b030'); R(15, hy + 1, 1, 1, '#f0b030');
      if (!back) { R(1, hy + 2, 2, 1, '#6a5a6c'); R(14, hy + 2, 2, 1, '#6a5a6c'); }
      R(4, hy, 9, 1, band); for (const x of [5, 8, 11]) R(x, hy, 1, 1, zig);
      R(5, hy - 1, 7, 1, v); if (dir === 'down') { R(6, hy - 1, 1, 1, band); R(10, hy - 1, 1, 1, band); }
      R(lean > 0 ? 7 : 5, hy - 2, 5, 1, v); R(tipX, hy - 3, 2, 1, v); R(lean > 0 ? tipX + 2 : tipX - 1, hy - 3, 1, 2, zig);
    }
    if ((v = accOf(L, 'minerhat'))) { R(3, hy - 2, 11, 4, v); if (!back) R(7, hy - 1, 3, 2, '#fff4c0'); }
    if ((v = accOf(L, 'trashlid'))) { R(1, hy - 2, 15, 2, dark(v, 0.2)); R(3, hy - 4, 11, 2, v); R(6, hy - 5, 5, 1, dark(v, 0.35)); R(4, hy - 4, 3, 1, light(v, 0.3)); }
    if ((v = accOf(L, 'flamehorn')) && !back) { R(dir === 'right' ? 11 : 3, hy - 4, 2, 3, v); R(dir === 'right' ? 13 : 2, hy - 5, 1, 2, '#ff9a2a'); }
    if ((v = accOf(L, 'doghood'))) {
      R(2, hy - 1, 13, 1, v); R(2, hy, 1, 7, v); R(14, hy, 1, 7, v); if (back) R(3, hy, 11, 8, v);
      R(3, hy - 4, 2, 3, v); R(12, hy - 4, 2, 3, v); R(3, hy - 5, 1, 1, v); R(13, hy - 5, 1, 1, v);
      if (!back) { R(4, hy - 3, 1, 2, L.earIn || '#f0b4b0'); R(12, hy - 3, 1, 2, L.earIn || '#f0b4b0'); }
    }
    if ((v = accOf(L, 'minecap'))) {
      R(3, hy - 3, 11, 3, v); R(4, hy - 4, 9, 1, v); R(2, hy, 13, 2, L.capFur || '#eeeae2');
      if (dir === 'down') { R(7, hy - 2, 3, 2, '#c89a48'); R(8, hy - 2, 1, 1, '#fff0a0'); R(7, hy - 1, 1, 1, '#fff0a0'); R(9, hy - 1, 1, 1, '#fff0a0'); }
      else if (!back) R(dir === 'left' ? 3 : 12, hy - 2, 2, 2, '#fff0a0');
    }
    if ((v = accOf(L, 'goggles'))) R(3, hy, 11, 1, v);
    if ((v = accOf(L, 'hairbow'))) { R(1, hy - 2, 2, 2, v); R(4, hy - 2, 2, 2, v); }
    if ((v = accOf(L, 'heartbow'))) { const bx = dir === 'left' ? 9 : dir === 'right' ? 4 : 2; R(bx, hy - 2, 2, 2, '#fbf4f8'); R(bx + 3, hy - 2, 2, 2, '#fbf4f8'); R(bx + 2, hy - 2, 1, 2, v); R(bx, hy - 1, 1, 1, v); R(bx + 4, hy - 1, 1, 1, v); }
    if (accOf(L, 'twintails')) {
      if (dir === 'down' || back) { R(1, hy - 1, 2, 5, P.hair); R(13, hy - 1, 2, 5, P.hair); R(1, hy + 3, 1, 3, P.hairSh); R(14, hy + 3, 1, 3, P.hairSh); }
      else if (dir === 'right') { R(2, hy, 3, 2, P.hair); R(2, hy + 2, 2, 4, P.hairSh); }
      else { R(11, hy, 3, 2, P.hair); R(12, hy + 2, 2, 4, P.hairSh); }
    }
    if (accOf(L, 'sidetail')) {
      if (dir === 'down') { R(13, hy - 1, 2, 5, P.hair); R(14, hy + 3, 1, 3, P.hairSh); }
      else if (back) { R(2, hy - 1, 2, 5, P.hair); R(2, hy + 3, 1, 3, P.hairSh); }
      else if (dir === 'right') { R(2, hy, 3, 2, P.hair); R(2, hy + 2, 2, 4, P.hairSh); }
      else R(11, hy - 1, 3, 1, P.hair);
    }
    if ((v = accOf(L, 'hairloop'))) {
      const lx = dir === 'left' ? 7 : dir === 'right' ? 8 : 8;
      R(lx, hy - 3, 3, 1, P.hair); R(lx, hy - 2, 1, 1, P.hair); R(lx + 2, hy - 2, 1, 2, P.hairSh);
      R(lx, hy - 1, 2, 1, v); if (!side) { R(lx - 1, hy - 1, 1, 1, '#f0c050'); }
    }
    if ((v = accOf(L, 'bun'))) {
      const bx = dir === 'left' ? 11 : dir === 'right' ? 3 : back ? 3 : 12;
      R(bx, hy - 1, 3, 3, P.hair); R(bx + (bx > 8 ? 2 : 0), hy - 2, 1, 1, v); R(bx + 1, hy - 1, 1, 1, P.hairHi);
    }
    if ((v = accOf(L, 'mantle'))) {
      if (dir === 'down') { R(2, bodyTop, 2, 8, v); R(13, bodyTop, 2, 8, v); R(2, bodyTop, 1, 2, '#d8b050'); }
      else if (back) R(3, bodyTop, 11, 8, v);
      else R(dir === 'left' ? 10 : 3, bodyTop, 4, 8, v);
    }
    if ((v = accOf(L, 'visor'))) R(3, hy, 11, 1, v);
    if ((v = accOf(L, 'memohood'))) { R(2, hy - 1, 13, 1, v); R(2, hy, 1, 8, v); R(14, hy, 1, 8, v); if (back) R(3, hy, 11, 9, v); }
    if ((v = accOf(L, 'cathood'))) { R(2, hy - 1, 13, 1, v); R(2, hy, 1, 7, v); R(14, hy, 1, 7, v); R(3, hy - 3, 2, 2, v); R(12, hy - 3, 2, 2, v); if (back) R(3, hy, 11, 8, v); }
    if ((v = accOf(L, 'capelet'))) { const fur = L.capeletFur || '#f4f4f8'; if (side) { R(dir === 'left' ? 6 : 5, bodyTop, 6, 2, v); R(dir === 'left' ? 6 : 5, bodyTop + 2, 6, 1, fur); } else { R(2, bodyTop, 13, 2, v); R(2, bodyTop + 2, 4, 1, fur); R(11, bodyTop + 2, 4, 1, fur); } }
    if ((v = accOf(L, 'mecharm'))) { if (!side) { const d = back ? -sw : sw; R(back ? aR : aL, bodyTop + d, 1, armH, v); R(back ? aR : aL, bodyTop + armH + d, 1, 1, '#9aa0ac'); R(back ? aR : aL, bodyTop + d, 1, 1, L.padCol || '#c8a858'); } else if (dir === 'right') { R(7, bodyTop + 1, 2, armH, v); R(7, bodyTop + 1, 2, 1, L.padCol || '#c8a858'); } }
    if ((v = accOf(L, 'memomask')) && !back) { if (dir === 'down') { R(5, hy + 2, 7, 6, v); R(5, hy + 2, 3, 2, light(v, 0.4)); R(9, hy + 5, 3, 3, dark(v, 0.2)); } else R(dir === 'left' ? 4 : 7, hy + 2, 6, 6, v); }
    if ((v = accOf(L, 'memomask')) && !back) { const mx = dir === 'left' ? 3 : dir === 'right' ? 6 : 4, mw = dir === 'down' ? 9 : 8; R(mx, hy + 3, mw, 2, v); R(mx + 1, hy + 5, mw - 2, 1, v); R(mx + 1, hy + 3, 2, 1, light(v, 0.5)); }
    if ((v = accOf(L, 'patchl')) && !back && dir !== 'right') { if (dir === 'down') R(9, hy + 4, 3, 3, v); else R(4, hy + 4, 3, 3, v); }
    if ((v = accOf(L, 'vanirmask')) && !back) { if (dir === 'down') { R(5, hy + 2, 4, 4, '#18161e'); R(9, hy + 2, 4, 4, v); } else R(dir === 'left' ? 4 : 7, hy + 2, 6, 4, dir === 'left' ? '#18161e' : v); }
    if ((v = accOf(L, 'blindfold')) && !back) R(dir === 'left' ? 2 : 3, hy + 4, dir === 'down' ? 11 : 9, 2, v);
    if ((v = accOf(L, 'eyepatch')) && !back && dir !== 'right') { if (dir === 'down') R(5, hy + 4, 3, 3, v); else R(4, hy + 4, 3, 3, v); }
    if ((v = accOf(L, 'redlily')) && dir !== 'right' && !back) { R(dir === 'left' ? 4 : 2, hy + 7, 2, 2, v); R(dir === 'left' ? 5 : 3, hy + 7, 1, 1, light(v, 0.3)); }
    if ((v = accOf(L, 'tailbow'))) { R(5, hy - 3, 2, 1, light(v, 0.3)); R(6, hy - 2, 2, 1, v); R(10, hy - 3, 2, 1, light(v, 0.3)); R(9, hy - 2, 2, 1, v); }
    if (accOf(L, 'shades')) { R(4, hy - 1, 4, 1, '#141018'); R(9, hy - 1, 4, 1, '#141018'); R(8, hy - 1, 1, 1, '#5a4a66'); }
    if ((v = accOf(L, 'scarf'))) {
      R(side ? 5 : 4, 11 + oy, side ? 7 : 9, 1, v);
      if (dir === 'down') { R(9, 12 + oy, 2, 3, v); R(10, 15 + oy, 1, 1, dark(v, 0.3)); }
      else if (back) R(5, 12 + oy, 2, 4, v);
      else R(dir === 'left' ? 5 : 10, 12 + oy, 2, 2, v);
    }
    if ((v = accOf(L, 'claw'))) {
      if (!side) { const x = back ? aR - 1 : aL - 1; R(x, bodyTop - 1, 3, 4, v); R(x, bodyTop + 2, 3, 1, dark(v, 0.35)); R(x + 1, bodyTop - 3, 1, 2, '#a050e0'); }
      else if (dir === 'left') { R(8, bodyTop, 3, 3, v); R(8, bodyTop + 2, 3, 1, dark(v, 0.35)); }
    }
    if ((v = accOf(L, 'earcuff')) && dir !== 'left') R(dir === 'right' ? 6 : back ? 3 : 13, hy + 4, 1, 1, v);
  }

  function drawSprite(ctx, look, dir, frame, x, y, opts) {
    const c = spriteCanvas(look, dir, frame, opts);
    ctx.drawImage(c, Math.round(x) + 16 - c.width / 2, Math.round(y - 16) + 50 - c.height);
  }

  function drawPortrait(ctx, look, x, y, size) {
    ctx.drawImage(bustCanvas(look, Math.round(size)), Math.round(x), Math.round(y));
  }

  function drawBust(ctx, look, x, y, scale) {
    const c = bustCanvas(look, 64), s = scale || 2;
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, Math.round(x), Math.round(y), 64 * s, 64 * s);
    ctx.imageSmoothingEnabled = was;
  }

  function drawFigure(ctx, look, x, y, scale, opts = {}) {
    const c = figureCanvas(look), s = scale || 2;
    const was = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.save();
    if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
    if (opts.flip) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(c, -FIG_W / 2 * s, Math.round(y - FOOT * s), FIG_W * s, FIG_H * s); }
    else ctx.drawImage(c, Math.round(x - FIG_W / 2 * s), Math.round(y - FOOT * s), FIG_W * s, FIG_H * s);
    ctx.restore();
    ctx.imageSmoothingEnabled = was;
  }

  function pixelArt(key, w, h, draw, outline) {
    let out = cache.get(key);
    if (out) return out;
    const src = G.mkCanvas(w * SS, h * SS), g = src.getContext('2d');
    draw(pen(g, 1, 0, 0), g);
    out = downsample(src, w, h, outline !== false);
    cache.set(key, out);
    return out;
  }

  function faceEye(look, side) {
    return manFace(look) ? [side < 0 ? 24.9 : 38.9, 32.2] : [side < 0 ? 25.4 : 38.6, 31.9];
  }

  function figEye(look, side) {
    const B = BODIES[look.body] || BODIES.m, [x, y] = faceEye(look, side);
    return [24 - 32 * B.hu + x * B.hu, B.head - 8 * B.hu + y * B.hu];
  }

  function bustEye(look, side) {
    const [x, y] = faceEye(look, side);
    return [x, y + (look.bustY || 0)];
  }

  function staffOrb(look) {
    const B = BODIES[look.body] || BODIES.m;
    return [24 - B.shW - 2.8, 4.8];
  }

  Object.assign(G, { isMale, pixelArt, pen, downsample, dark, light, lookOf, sceneLookOf, trailLook, accOf, paletteOf, mix, bustCanvas, portraitCanvas: bustCanvas, figureCanvas, spriteCanvas, drawSprite, drawPortrait, drawBust, drawFigure, figEye, bustEye, staffOrb, FIG_W, FIG_H, FIG_FOOT: FOOT });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
