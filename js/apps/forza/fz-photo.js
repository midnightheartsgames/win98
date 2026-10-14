(function (F) {
  'use strict';

  const M4 = F.M4;
  const RANGE = 60, CEIL = 40, NEAR = 0.1, FAR = 4000;
  const XP = 750, CR = 1000, ALL_CR = 10000;
  const FOCALS = [14, 18, 21, 24, 28, 35, 50, 70, 85, 105, 135, 200, 300];
  const STOPS = [0, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
  const FOCUS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 7, 10, 15, 20, 30, 50, 75, 100, 200, 500];
  const ASPECTS = [['screen', 'Как экран', 0], ['4:3', '4:3', 4 / 3], ['3:2', '3:2', 1.5], ['16:9', '16:9', 16 / 9], ['1:1', '1:1', 1], ['4:5', '4:5', 0.8], ['2.39:1', '2,39:1', 2.39]];
  const SIZES = [['screen', 'Как экран', 0], ['600', '', 600], ['768', '', 768], ['960', '', 960], ['1200', '', 1200]];
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const TABS = ['КАДР', 'ОПТИКА', 'ЦВЕТ', 'СЦЕНА', 'ПЕЧАТЬ'];
  const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF', 'KeyZ', 'KeyX', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight']);
  const LOOK = ['ap', 'af', 'fd', 'blur', 'vig', 'flare', 'ev', 'con', 'sat', 'filter', 'grain', 'aspect', 'grid', 'date', 'caption', 'logo', 'frame', 'res'];
  const DIR_NAME = 'Forza Horizon';
  const MEM = new Map();

  const FILTERS = {
    none: { name: 'Без фильтра', m: [1, 0, 0, 0, 1, 0, 0, 0, 1], off: [0, 0, 0] },
    bw: { name: 'Чёрно-белая', m: [0.3, 0.59, 0.11, 0.3, 0.59, 0.11, 0.3, 0.59, 0.11], off: [0, 0, 0] },
    sepia: { name: 'Сепия', m: [0.34, 0.62, 0.15, 0.3, 0.55, 0.13, 0.23, 0.43, 0.1], off: [0.03, 0.015, 0] },
    slide: { name: 'Выцветший слайд', m: [0.86, 0.08, 0.02, 0.04, 0.82, 0.06, 0.02, 0.1, 0.78], off: [0.07, 0.05, 0.09] },
    warm: { name: 'Тёплая плёнка', m: [1.07, 0.02, 0, 0.01, 1, 0, 0, 0.02, 0.84], off: [0.02, 0.01, 0] },
    cold: { name: 'Холодная плёнка', m: [0.9, 0, 0.02, 0, 0.98, 0.04, 0.02, 0.04, 1.08], off: [0, 0.01, 0.03] },
    cross: { name: 'Кросс-процесс', m: [1.12, -0.04, -0.08, -0.02, 1.14, -0.06, 0.04, 0.02, 0.72], off: [-0.02, 0, 0.14] }
  };
  for (const f of Object.values(FILTERS)) {
    const m = f.m;
    f.mat = new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
    f.off3 = new Float32Array(f.off);
  }

  const h = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  const esc = s => F.esc(s);
  const num = (v, d = 1) => v.toFixed(d).replace('.', ',').replace(/,0+$/, '');

  function hhmm(clock) {
    const m = Math.floor((((clock % 24) + 24) % 24) * 60 + 1e-6);
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  function evText(ev) {
    const v = Math.round(ev * 3);
    if (!v) return '0 EV';
    const a = Math.abs(v), whole = Math.floor(a / 3), part = ['', '⅓', '⅔'][a % 3];
    return (v > 0 ? '+' : '−') + (whole || !part ? whole : '') + part + ' EV';
  }

  function fovOf(fl) { return 2 * Math.atan(12 / fl) * 180 / Math.PI; }
  function focalOf(fov) { return 12 / Math.tan(fov * Math.PI / 360); }

  function cocScale(fl, stop, focus, px) {
    if (!stop) return 0;
    const f = fl / 1000;
    return (f / stop) * f / Math.max(focus - f, 1e-3) * px / 0.024;
  }

  function cropOf(W, H, a) {
    if (!a) return [0, 0, W, H];
    if (a >= W / H) { const ch = W / a; return [0, (H - ch) / 2, W, ch]; }
    const cw = H * a;
    return [(W - cw) / 2, 0, cw, H];
  }

  function cropUv(A, a) {
    if (!a) return [0, 0, 1, 1];
    if (a >= A) { const k = A / a; return [0, (1 - k) / 2, 1, (1 + k) / 2]; }
    const k = a / A;
    return [(1 - k) / 2, 0, (1 + k) / 2, 1];
  }

  function captureSize(W, H, a, rows, lim) {
    const A = W / H;
    a = a || A;
    let oh = rows || Math.round(a >= A ? W / a : H), ow = Math.round(oh * a);
    if (ow > lim) { ow = lim; oh = Math.round(lim / a); }
    let rw = a >= A ? ow : Math.round(oh * A), rh = a >= A ? Math.round(ow / A) : oh;
    const k = Math.min(1, lim / rw, lim / rh);
    if (k < 1) { rw = Math.floor(rw * k); rh = Math.floor(rh * k); ow = Math.floor(ow * k); oh = Math.floor(oh * k); }
    return { rw, rh, ow, oh };
  }

  function festDay(p) {
    const n = Math.min(48, Object.keys((p && p.results) || {}).length);
    const d = new Date(2001, 6, 14 + n);
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
  }

  function dateText(day) { return `'${String(day.y % 100).padStart(2, '0')} ${day.m} ${String(day.d).padStart(2, ' ')}`; }
  function dateLong(day) { return `${day.d} ${MONTHS[day.m - 1]} ${day.y}`; }

  function collides(c, x, z, m) {
    if (c.k === 'poly') return F.inPoly(x, z, c.pts);
    if (c.k === 'box') {
      const dx = x - c.x, dz = z - c.z;
      return Math.abs(dx * c.c + dz * c.s) < c.hx + m && Math.abs(-dx * c.s + dz * c.c) < c.hz + m;
    }
    return Math.hypot(x - c.x, z - c.z) < c.r + m;
  }

  function reach(c) { return c.k === 'box' ? Math.hypot(c.hx, c.hz) : c.r || 0; }

  function rayHit(world, a, b) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (len < 0.01) return 1;
    const cols = world.colliders(Math.min(a[0], b[0]) - 1, Math.min(a[2], b[2]) - 1, Math.max(a[0], b[0]) + 1, Math.max(a[2], b[2]) + 1);
    const n = Math.max(2, Math.ceil(len / 0.5));
    let best = 1;
    for (const c of cols) {
      if (c.k !== 'box' && c.k !== 'poly') continue;
      if (F.segDist(c.x, c.z, a[0], a[2], b[0], b[2]).d > reach(c) + 1) continue;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        if (t >= best) break;
        const y = a[1] + (b[1] - a[1]) * t;
        if (y < c.y0 || y > c.y1) continue;
        if (collides(c, a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t, 0.2)) { best = t; break; }
      }
    }
    return best;
  }

  function sight(world, a, b, skip) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const cols = world.colliders(Math.min(a[0], b[0]) - 1, Math.min(a[2], b[2]) - 1, Math.max(a[0], b[0]) + 1, Math.max(a[2], b[2]) + 1);
    const n = Math.max(2, Math.ceil(len / 1.5));
    let vis = 1;
    for (const c of cols) {
      const tree = c.k === 'circ' && c.src && F.TREE && F.TREE[c.src.kind];
      if (c.k !== 'box' && c.k !== 'poly' && !tree) continue;
      if (skip && Math.hypot(c.x - skip.x, c.z - skip.z) < skip.r) continue;
      if (F.segDist(c.x, c.z, a[0], a[2], b[0], b[2]).d > reach(c) + (tree ? 2.6 : 1)) continue;
      for (let i = 1; i < n; i++) {
        const t = i / n, y = a[1] + (b[1] - a[1]) * t;
        if (y < c.y0 || y > c.y1) continue;
        const x = a[0] + (b[0] - a[0]) * t, z = a[2] + (b[2] - a[2]) * t;
        if (tree ? Math.hypot(x - c.x, z - c.z) < 2.6 : collides(c, x, z, 0)) {
          if (!tree) return 0;
          vis *= 0.6;
          break;
        }
      }
    }
    return vis;
  }

  function constrain(world, car, e, pivot) {
    let x = e[0], y = e[1], z = e[2];
    const dx = x - car.x, dz = z - car.z, hd = Math.hypot(dx, dz);
    if (hd > RANGE) { x = car.x + dx / hd * RANGE; z = car.z + dz / hd * RANGE; }
    y = Math.min(y, car.y + CEIL);
    const len = Math.hypot(x - pivot[0], y - pivot[1], z - pivot[2]);
    const hit = rayHit(world, pivot, [x, y, z]);
    if (hit < 1) {
      const t = Math.max(0, hit - 0.45 / Math.max(len, 0.01));
      x = pivot[0] + (x - pivot[0]) * t; y = pivot[1] + (y - pivot[1]) * t; z = pivot[2] + (z - pivot[2]) * t;
    }
    let floor = world.ground(x, z, Math.max(y, world.terrainH(x, z)) + 1, false);
    if (world.isWaterAt(x, z)) floor = Math.max(floor, F.WATER_Y);
    y = Math.max(y, floor + 0.3);
    const fx = Math.sin(car.yaw), fz = -Math.cos(car.yaw), qx = x - car.x, qz = z - car.z;
    const u = qx * fx + qz * fz, v = qx * fz * -1 + qz * fx;
    const hl = car.len / 2 + 0.25, hw = car.wid / 2 + 0.25, top = car.y + car.hgt + 0.2;
    if (Math.abs(u) < hl && Math.abs(v) < hw && y < top) {
      const pu = hl - Math.abs(u), pv = hw - Math.abs(v), py = top - y;
      if (py <= pu && py <= pv) y = top;
      else if (pu <= pv) { const d = (Math.sign(u) || 1) * pu; x += fx * d; z += fz * d; }
      else { const d = (Math.sign(v) || 1) * pv; x += -fz * d; z += fx * d; }
    }
    return [x, y, z];
  }

  function targets(scene) {
    const out = [], seen = new Set();
    for (const l of (scene && scene.landmarks) || []) {
      if (!l.name || seen.has(l.type)) continue;
      seen.add(l.type);
      const d = (l.src && l.src.def) || (F.LMK && F.LMK[l.type]) || { r: 10 };
      const r = d.box ? Math.hypot(d.box[0], d.box[1]) / 2 : d.r || 10;
      out.push({ key: l.type, name: l.name, x: l.x, y: l.y, z: l.z, h: l.h || 30, r });
    }
    return out;
  }

  function spotted(world, list, cam, vp, crop, car) {
    const m = 0.02;
    const inCrop = s => s[3] > 0 && Math.abs(s[2]) <= 1 && s[0] * 0.5 + 0.5 > crop[0] + m && s[0] * 0.5 + 0.5 < crop[2] - m && s[1] * 0.5 + 0.5 > crop[1] + m && s[1] * 0.5 + 0.5 < crop[3] - m;
    const hasCar = !!car && inCrop(M4.apply(vp, car.x, car.y + car.hgt * 0.5, car.z));
    const tanH = Math.tan(cam.fov * Math.PI / 360), cropH = crop[3] - crop[1];
    const found = [];
    for (const t of list) {
      const d = Math.hypot(t.x - cam.x, t.z - cam.z), ext = Math.max(t.h, t.r * 1.2);
      if (d > F.clamp(ext * 4.5, 60, 900)) continue;
      if (ext / Math.max(d, 1) / (2 * tanH) / cropH < 0.2) continue;
      for (const k of [0.3, 0.6, 0.9]) {
        const y = t.y + t.h * k;
        if (!inCrop(M4.apply(vp, t.x, y, t.z))) continue;
        if (sight(world, [cam.x, cam.y, cam.z], [t.x, y, t.z], { x: t.x, z: t.z, r: t.r + 3 }) > 0.5) { found.push(t); break; }
      }
    }
    return { car: hasCar, found };
  }

  function vpOf(cam, aspect) {
    return M4.mul(M4.persp(cam.fov * Math.PI / 180, aspect, cam.near || NEAR, cam.far || FAR), M4.lookAt(cam.x, cam.y, cam.z, cam.tx, cam.ty, cam.tz, cam.ux || 0, cam.uy === undefined ? 1 : cam.uy, cam.uz || 0));
  }

  function award(game, found, total) {
    const p = game.profile, got = p.photoLm || (p.photoLm = []);
    const fresh = found.filter(t => !got.includes(t.key));
    if (!fresh.length) return null;
    for (const t of fresh) got.push(t.key);
    const xp = XP * fresh.length, cr = CR * fresh.length;
    let bonus = 0;
    if (total && got.length >= total && !p.photoAll) { p.photoAll = true; bonus = ALL_CR; }
    p.credits += cr + bonus;
    game.addXp(xp);
    game.save();
    return { fresh, xp, cr, bonus };
  }

  function vfsDir() {
    const vfs = typeof window !== 'undefined' ? window.vfs : null;
    if (!vfs || !vfs.resolvePath || !vfs.writeFile) return null;
    const docs = ['My Computer', 'C:', 'My Documents'], pics = docs.concat(['Мои рисунки']);
    const base = vfs.resolvePath(pics) ? pics : vfs.resolvePath(docs) ? docs : null;
    if (!base) return null;
    const dir = base.concat([DIR_NAME]);
    if (!vfs.resolvePath(dir) && !(vfs.createFolder && vfs.createFolder(base, DIR_NAME))) return null;
    return { vfs, dir };
  }

  function dirText(dir) { return dir.slice(1).join('\\').replace('My Documents', 'Мои документы'); }

  function roomFor(n) {
    try {
      localStorage.setItem('fh_photo_probe', 'x'.repeat(n));
      localStorage.removeItem('fh_photo_probe');
      return true;
    } catch (e) {
      try { localStorage.removeItem('fh_photo_probe'); } catch (e2) { }
      return false;
    }
  }

  function readPhoto(ph) {
    if (ph.at === 'vfs') {
      const loc = vfsDir();
      return loc ? loc.vfs.readFile(loc.dir, ph.file) : null;
    }
    return MEM.has(ph.file) ? MEM.get(ph.file) : null;
  }

  function store(p, url, meta) {
    const loc = vfsDir();
    const taken = name => (loc ? loc.vfs.readFile(loc.dir, name) !== null : MEM.has(name));
    let n = (p.photoN || 0) + 1, file;
    do { file = 'RIGA_' + String(n).padStart(4, '0') + '.JPG'; n++; } while (taken(file) && n < 100000);
    if (loc) {
      if (!roomFor(url.length + 4096)) return { ok: false, err: 'На диске C: не хватает места. Удалите старые снимки в альбоме.' };
      if (!loc.vfs.writeFile(loc.dir, file, url)) return { ok: false, err: 'Не удалось записать файл.' };
    } else MEM.set(file, url);
    p.photoN = n - 1;
    const ph = Object.assign({ file, at: loc ? 'vfs' : 'mem', t: Date.now() }, meta);
    const list = p.photos || (p.photos = []);
    list.push(ph);
    if (list.length > 200) list.splice(0, list.length - 200);
    return { ok: true, ph, where: loc ? dirText(loc.dir) + '\\' + file : file };
  }

  function photoList(p) { return (p.photos || []).filter(ph => readPhoto(ph) !== null); }

  function removePhoto(p, ph) {
    if (ph.at === 'vfs') {
      const loc = vfsDir();
      if (loc && loc.vfs.deleteItem) loc.vfs.deleteItem(loc.dir, ph.file, true);
    } else MEM.delete(ph.file);
    p.photos = (p.photos || []).filter(q => q !== ph);
  }

  function lookDefaults() {
    return { ap: 0, af: 'car', fd: 10, blur: 0, vig: 30, flare: 'on', ev: 0, con: 0, sat: 100, filter: 'none', grain: 0, aspect: 'screen', grid: 'thirds', date: 'off', caption: 'off', logo: 'off', frame: 'none', res: '768' };
  }

  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd' };

  function sevenSeg(c, text, x, y, hgt, col) {
    const w = hgt * 0.5, t = hgt * 0.14, sl = hgt * 0.12, gap = hgt * 0.16;
    const at = (px, py) => [px + sl * (1 - py / hgt), py];
    const bar = (x0, y0, x1, y1) => {
      const hor = y0 === y1, a = at(x0, y0), b = at(x1, y1), k = t / 2;
      c.beginPath();
      if (hor) { c.moveTo(a[0] + k, a[1]); c.lineTo(a[0] + k * 2, a[1] - k); c.lineTo(b[0] - k * 2, b[1] - k); c.lineTo(b[0] - k, b[1]); c.lineTo(b[0] - k * 2, b[1] + k); c.lineTo(a[0] + k * 2, a[1] + k); }
      else { c.moveTo(a[0], a[1] + k); c.lineTo(a[0] + k, a[1] + k * 2); c.lineTo(b[0] + k, b[1] - k * 2); c.lineTo(b[0], b[1] - k); c.lineTo(b[0] - k, b[1] - k * 2); c.lineTo(a[0] - k, a[1] + k * 2); }
      c.closePath();
      c.fill();
    };
    c.save();
    c.fillStyle = col;
    c.shadowColor = col;
    c.shadowBlur = hgt * 0.35;
    let cx = x;
    for (const ch of text) {
      if (ch === ' ') { cx += w * 1.6; continue; }
      if (ch === "'") { c.fillRect(cx + sl, y, t, hgt * 0.32); cx += t * 3; continue; }
      const s = SEG[ch] || '';
      const X0 = cx, X1 = cx + w, Y0 = y, Y1 = y + hgt / 2, Y2 = y + hgt;
      for (const g of s) {
        if (g === 'a') bar(X0, Y0, X1, Y0);
        if (g === 'g') bar(X0, Y1, X1, Y1);
        if (g === 'd') bar(X0, Y2, X1, Y2);
        if (g === 'f') bar(X0, Y0, X0, Y1);
        if (g === 'b') bar(X1, Y0, X1, Y1);
        if (g === 'e') bar(X0, Y1, X0, Y2);
        if (g === 'c') bar(X1, Y1, X1, Y2);
      }
      cx += w + gap;
    }
    c.restore();
    return cx - x;
  }

  function dateWidth(text, hgt) {
    let w = 0;
    for (const ch of text) w += ch === ' ' ? hgt * 0.8 : ch === "'" ? hgt * 0.42 : hgt * 0.66;
    return w;
  }

  function logo(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.transform(1, 0, -0.14, 1, 0, 0);
    c.shadowColor = 'rgba(0,0,0,0.55)';
    c.shadowOffsetX = s * 0.04; c.shadowOffsetY = s * 0.04;
    c.textBaseline = 'top';
    c.fillStyle = '#fff';
    c.font = `900 ${Math.round(s * 0.3)}px 'Arial Black', Arial`;
    const f = 'F O R Z A';
    c.fillText(f, 0, 0);
    c.font = `900 ${Math.round(s * 0.72)}px 'Arial Black', Arial`;
    const w = c.measureText('HORIZON').width;
    const gr = c.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, '#ffc81e'); gr.addColorStop(0.45, '#ff7a1a'); gr.addColorStop(1, '#e6146e');
    c.fillStyle = gr;
    c.fillText('HORIZON', 0, s * 0.3);
    c.shadowColor = 'transparent';
    c.fillStyle = '#fff';
    c.fillRect(0, s * 1.08, s * 1.3, s * 0.34);
    c.fillStyle = '#111';
    c.font = `900 ${Math.round(s * 0.26)}px 'Arial Black', Arial`;
    c.fillText('R Ī G A', s * 0.1, s * 1.12);
    c.restore();
  }

  function captionLines(o, info) {
    if (o.caption === 'off') return [];
    const place = [info.place, info.street].filter(Boolean).join(' · ');
    return o.caption === 'full' ? [place, info.car] : [place];
  }

  function stamp(c, x, y, w, hgt, o, info, withCaption = true) {
    const u = Math.min(w, hgt * 1.5) / 100;
    if (o.logo === 'on') logo(c, x + u * 3, y + u * 3, u * 5.5);
    if (o.date === 'on') {
      const txt = dateText(info.day), dh = u * 2.8;
      sevenSeg(c, txt, x + w - u * 3.5 - dateWidth(txt, dh), y + hgt - u * 3.5 - dh, dh, '#ff8f1f');
    }
    const lines = withCaption ? captionLines(o, info) : [];
    if (lines.length) {
      c.save();
      c.textBaseline = 'alphabetic';
      c.shadowColor = 'rgba(0,0,0,0.8)';
      c.shadowOffsetX = u * 0.2; c.shadowOffsetY = u * 0.2; c.shadowBlur = u * 0.6;
      c.fillStyle = '#fff';
      let ly = y + hgt - u * 3.5;
      for (let i = lines.length - 1; i >= 0; i--) {
        c.font = i === 0 ? `italic 700 ${Math.round(u * 2.6)}px 'Segoe UI', Arial` : `italic 400 ${Math.round(u * 2.1)}px 'Segoe UI', Arial`;
        c.fillText(lines[i], x + u * 3.5, ly);
        ly -= u * (i === 0 ? 3.2 : 2.8);
      }
      c.restore();
    }
  }

  function framed(photo, o, info) {
    const W = photo.width, H = photo.height;
    if (o.frame === 'instant') {
      const side = Math.round(W * 0.055), bottom = Math.round(W * 0.2);
      const cv = h('canvas');
      cv.width = W + side * 2; cv.height = H + side + bottom;
      const c = cv.getContext('2d');
      const gr = c.createLinearGradient(0, 0, cv.width, cv.height);
      gr.addColorStop(0, '#fbf9f2'); gr.addColorStop(1, '#ebe6d8');
      c.fillStyle = gr;
      c.fillRect(0, 0, cv.width, cv.height);
      c.fillStyle = '#20201c';
      c.fillRect(side - 2, side - 2, W + 4, H + 4);
      c.drawImage(photo, side, side);
      const lines = captionLines(o, info);
      if (lines.length) {
        c.fillStyle = '#1d2a6e';
        c.textBaseline = 'middle';
        c.textAlign = 'center';
        lines.forEach((l, i) => {
          c.font = `italic ${Math.round(bottom * (i ? 0.16 : 0.22))}px 'Comic Sans MS', 'Segoe Print', cursive`;
          c.fillText(l, cv.width / 2, side + H + bottom * (lines.length > 1 ? 0.4 + i * 0.28 : 0.5));
        });
      }
      return cv;
    }
    if (o.frame === 'film') {
      const band = Math.round(H * 0.13), side = Math.round(W * 0.025);
      const cv = h('canvas');
      cv.width = W + side * 2; cv.height = H + band * 2;
      const c = cv.getContext('2d');
      c.fillStyle = '#0d0b0a';
      c.fillRect(0, 0, cv.width, cv.height);
      c.drawImage(photo, side, band);
      const hw = band * 0.34, hh = band * 0.42, step = hw * 2.1;
      c.fillStyle = '#e9e2d0';
      for (let hx = step * 0.4; hx < cv.width - hw; hx += step) {
        for (const hy of [band * 0.14, cv.height - band * 0.14 - hh]) {
          c.beginPath();
          const r = hw * 0.18;
          c.moveTo(hx + r, hy); c.lineTo(hx + hw - r, hy); c.quadraticCurveTo(hx + hw, hy, hx + hw, hy + r); c.lineTo(hx + hw, hy + hh - r);
          c.quadraticCurveTo(hx + hw, hy + hh, hx + hw - r, hy + hh); c.lineTo(hx + r, hy + hh); c.quadraticCurveTo(hx, hy + hh, hx, hy + hh - r); c.lineTo(hx, hy + r); c.quadraticCurveTo(hx, hy, hx + r, hy);
          c.fill();
        }
      }
      c.fillStyle = '#f0a020';
      c.font = `700 ${Math.round(band * 0.2)}px 'Courier New', monospace`;
      c.textBaseline = 'middle';
      const n = info.n || 1;
      c.fillText('HORIZON 200', side + W * 0.06, band * 0.8);
      c.fillText('▸ ' + n + 'A', side + W * 0.62, band * 0.8);
      c.fillText(String(n), side + W * 0.3, cv.height - band * 0.8);
      c.fillText('RĪGA 2001', side + W * 0.7, cv.height - band * 0.8);
      return cv;
    }
    return photo;
  }

  class Mode {
    constructor(ui) {
      this.ui = ui;
      const g = ui.game, v = g.veh, p = ui.pose || v, sp = v.spec;
      this.car = { x: p.x, y: p.y, z: p.z, yaw: p.yaw, len: sp.len, wid: sp.wid, hgt: sp.hgt };
      this.time = performance.now() / 1000;
      this.t = performance.now();
      this.seed = 1 + Math.floor(Math.random() * 9973);
      this.held = new Set();
      this.bare = false;
      this.busy = false;
      this.cap = null;
      this.tabIdx = 0;
      this.popup0 = ui.popupK || 0;
      this.scanT = 0;
      this.live = null;
      const look = g.profile.photoOpt || {};
      this.o = Object.assign(lookDefaults(), ...LOOK.filter(k => look[k] !== undefined).map(k => ({ [k]: look[k] })));
      Object.assign(this.o, { mode: 'orbit', roll: 0, clock: g.clock, wx: '', lights: 'auto', brake: 'auto', steer: null, car: 'show', others: 'show' });
      if (!ui.renderer.depthExt) this.o.ap = 0;
      const C = ui.lastCam;
      this.fl = F.clamp(C ? focalOf(2 * Math.atan(1 / C.proj[5]) * 180 / Math.PI) : 20, 12, 300);
      const e = ui.lastCamPos || [p.x - Math.sin(p.yaw) * 7, p.y + 2.4, p.z + Math.cos(p.yaw) * 7];
      const t = this.target();
      const dx = t[0] - e[0], dy = t[1] - e[1], dz = t[2] - e[2], d = Math.hypot(dx, dy, dz) || 1;
      this.yaw = Math.atan2(dx, -dz);
      this.pitch = Math.asin(F.clamp(dy / d, -1, 1));
      this.dist = F.clamp(d, this.minDist(), RANGE);
      this.pos = e.slice();
      this.eye = this.place();
      this.targetsList = targets(ui.scene);
    }

    target() { const c = this.car; return [c.x, c.y + c.hgt * 0.5, c.z]; }
    pivot() { const c = this.car; return [c.x, c.y + Math.max(1, c.hgt * 0.7), c.z]; }
    minDist() { return Math.max(1.4, this.car.len * 0.55); }
    fwd() { const cp = Math.cos(this.pitch); return [Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp]; }

    place() {
      const f = this.fwd(), t = this.target();
      const want = this.o.mode === 'orbit' ? [t[0] - f[0] * this.dist, t[1] - f[1] * this.dist, t[2] - f[2] * this.dist] : this.pos;
      const e = constrain(this.ui.world, this.car, want, this.pivot());
      if (this.o.mode === 'free') this.pos = e;
      return e;
    }

    hideCar() { return this.o.car === 'hide'; }
    flare() { return this.o.flare === 'on'; }
    uploads() { return this.cap ? 400 : 4; }
    rng() { return F.rng(this.seed); }
    aspect() { const a = ASPECTS.find(x => x[0] === this.o.aspect); return a ? a[2] : 0; }

    env() {
      const g = this.ui.game, o = this.o;
      return F.skyEnv(o.clock, o.wx || g.wx || g.weather, this.ui.settings().draw, o.wx ? undefined : g.wetK);
    }

    camera() {
      const e = this.eye, f = this.fwd(), roll = this.o.roll * Math.PI / 180;
      const rl = Math.hypot(f[0], f[2]) || 1, r = [-f[2] / rl, 0, f[0] / rl];
      const u0 = [-r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1]];
      const cr = Math.cos(roll), sr = Math.sin(roll), fov = fovOf(this.fl);
      return {
        x: e[0], y: e[1], z: e[2], tx: e[0] + f[0] * 10, ty: e[1] + f[1] * 10, tz: e[2] + f[2] * 10,
        ux: u0[0] * cr + r[0] * sr, uy: u0[1] * cr + r[1] * sr, uz: u0[2] * cr + r[2] * sr,
        fov, near: NEAR, far: FAR, lodK: Math.min(1, Math.tan(fov * Math.PI / 360) / Math.tan(31 * Math.PI / 180))
      };
    }

    carState(st) {
      const o = this.o;
      if (o.lights !== 'auto') st.lights = st.popup = o.lights === 'on' ? 1 : 0;
      if (o.brake !== 'auto') st.brake = o.brake === 'on' ? 1 : 0;
      if (o.steer !== null) st.steer = o.steer * Math.PI / 180;
      return st;
    }

    focusDist() {
      if (this.o.af !== 'car') return this.o.fd;
      const t = this.target(), e = this.eye, f = this.fwd();
      return Math.max(0.3, (t[0] - e[0]) * f[0] + (t[1] - e[1]) * f[1] + (t[2] - e[2]) * f[2]);
    }

    post(fx, env) {
      const o = this.o, r = this.ui.renderer, retro = this.ui.settings().gfx === 'retro', flt = FILTERS[o.filter] || FILTERS.none;
      if (retro) { fx.bloom = 0; fx.rays = 0; fx.sat = 1; fx.contrast = 1; fx.tint = [1, 1, 1]; }
      fx.expo *= Math.pow(2, o.ev);
      fx.contrast *= 1 + o.con / 100;
      fx.sat *= o.sat / 100;
      fx.vig = o.vig / 100 + (retro ? 0 : (env.storm || 0) * 0.1);
      fx.blur = o.blur / 100 * 0.9;
      fx.blurC = this.carUv || null;
      fx.mat = flt.mat;
      fx.off = flt.off3;
      fx.grain = o.grain / 100 * 0.16;
      fx.seed = this.seed % 97;
      if (o.ap && r.depthExt) {
        const H = r.canvas.height, focus = this.focusDist();
        fx.dof = { near: NEAR, far: FAR, focus, k: cocScale(this.fl, o.ap, focus, H), maxR: Math.min(40, 20 * H / 720) };
      }
      return fx;
    }

    clearHud() {
      const hud = this.ui.hud, c = hud.ctx;
      c.setTransform(hud.dpr, 0, 0, hud.dpr, 0, 0);
      c.clearRect(0, 0, hud.w, hud.h);
    }

    render() {
      const ui = this.ui, g = ui.game, r = ui.renderer;
      if (!g || !r) return;
      const hide = this.o.others === 'hide', race = g.race, keepT = g.traffic.cars, keepR = race ? race.rivals : null;
      this.busy = true;
      r.forcePost = true;
      r.wantDepth = this.o.ap > 0;
      if (ui.sunVisT !== undefined) ui.sunVis = ui.sunVisT;
      ui.popupK = this.o.lights === 'auto' ? this.popup0 : this.o.lights === 'on' ? 1 : 0;
      if (hide) { g.traffic.cars = []; if (race) race.rivals = []; }
      try {
        ui.render(0);
      } finally {
        if (hide) { g.traffic.cars = keepT; if (race) race.rivals = keepR; }
        this.busy = false;
      }
    }

    frame() {
      const now = performance.now(), dt = Math.min(0.1, Math.max(0, (now - this.t) / 1000));
      this.t = now;
      if (this.ui.menus.top !== this.scr) return;
      this.move(dt);
      this.eye = this.place();
      const C = this.ui.lastCam;
      if (C) {
        const c = this.car, s = M4.apply(C.vp, c.x, c.y + c.hgt * 0.5, c.z);
        this.carUv = s[3] > 0 ? [F.clamp(s[0] * 0.5 + 0.5, 0, 1), F.clamp(s[1] * 0.5 + 0.5, 0, 1)] : null;
      }
      if (this.flashK > 0) { this.flashK = Math.max(0, this.flashK - dt / 0.4); this.flashEl.style.opacity = String(0.95 * this.flashK * this.flashK); }
      this.scanT -= dt;
      if (this.scanT <= 0) { this.scanT = 0.45; this.scan(); }
      this.drawVF();
      this.readout();
    }

    move(dt) {
      const k = this.held, key = c => (k.has(c) ? 1 : 0), p = this.padAx;
      let mx = key('KeyD') - key('KeyA'), mz = key('KeyW') - key('KeyS'), my = key('KeyR') - key('KeyF'), zm = key('KeyX') - key('KeyZ'), lx = 0, ly = 0;
      if (p) { mx += p.lx; mz -= p.ly; lx += p.rx; ly += p.ry; zm += p.rt - p.lt; }
      const sp = (k.has('ShiftLeft') || k.has('ShiftRight') ? 3 : 1) * (k.has('ControlLeft') || k.has('ControlRight') ? 0.3 : 1);
      const turn = Math.min(1, fovOf(this.fl) / 50);
      if (this.o.mode === 'orbit') {
        this.yaw += (-mx * 1.2 + lx * 1.8) * dt * sp * turn;
        this.pitch += (-my * 0.9 + ly * 1.4) * dt * sp * turn;
        this.dist = F.clamp(this.dist * Math.exp(-mz * 1.1 * dt * sp), this.minDist(), RANGE);
      } else {
        this.yaw += lx * 1.8 * dt * turn;
        this.pitch -= ly * 1.4 * dt * turn;
        const f = this.fwd(), v = 6 * sp * dt;
        this.pos = [this.pos[0] + (f[0] * mz + Math.cos(this.yaw) * mx) * v, this.pos[1] + (f[1] * mz + my) * v, this.pos[2] + (f[2] * mz + Math.sin(this.yaw) * mx) * v];
      }
      this.pitch = F.clamp(this.pitch, -1.45, 1.45);
      if (zm) this.fl = F.clamp(this.fl * Math.exp(zm * 0.9 * dt), 12, 300);
      if (mx || mz || my || zm || lx || ly) this.refreshRows();
    }

    drag(dx, dy) {
      const s = 0.005 * Math.min(1, fovOf(this.fl) / 50);
      this.yaw += dx * s;
      this.pitch = F.clamp(this.pitch + (this.o.mode === 'orbit' ? dy : -dy) * s, -1.45, 1.45);
    }

    wheel(e) {
      const d = F.clamp(e.deltaY, -300, 300);
      if (e.shiftKey) this.fl = F.clamp(this.fl * Math.exp(-d * 0.0012), 12, 300);
      else if (this.o.mode === 'orbit') this.dist = F.clamp(this.dist * Math.exp(d * 0.0012), this.minDist(), RANGE);
      else { const f = this.fwd(), v = -d * 0.012; this.pos = [this.pos[0] + f[0] * v, this.pos[1] + f[1] * v, this.pos[2] + f[2] * v]; }
      this.refreshRows();
    }

    switchMode() {
      if (this.o.mode === 'orbit') { this.o.mode = 'free'; this.pos = this.eye.slice(); }
      else {
        const t = this.target(), e = this.eye, dx = t[0] - e[0], dy = t[1] - e[1], dz = t[2] - e[2], d = Math.hypot(dx, dy, dz) || 1;
        this.o.mode = 'orbit';
        this.yaw = Math.atan2(dx, -dz);
        this.pitch = Math.asin(F.clamp(dy / d, -1, 1));
        this.dist = F.clamp(d, this.minDist(), RANGE);
      }
      this.ui.audio.play('blip');
      this.refreshRows();
    }

    scan() {
      const ui = this.ui;
      if (!ui.world) { this.live = null; return; }
      const cam = this.camera(), [W, H] = ui.internalSize();
      this.live = spotted(ui.world, this.targetsList, cam, vpOf(cam, W / H), cropUv(W / H, this.aspect()), this.hideCar() ? null : this.car);
    }

    keyUp(code) { this.held.delete(code); }

    key(e) {
      const k = e.code;
      if (MOVE.has(k)) { this.held.add(k); return true; }
      if (k === 'Space') { if (!e.repeat) this.shoot(); return true; }
      if (k === 'KeyH') { this.toggleUi(); return true; }
      if (k === 'KeyG') { this.openAlbum(); return true; }
      if (k === 'Tab') { this.switchMode(); return true; }
      if (k === 'KeyV') { this.exit(); return true; }
      return false;
    }

    pad(gp, edge, fake) {
      const m = this.ui.menus;
      if (m.top !== this.scr) { this.padAx = null; return false; }
      const dz = v => (Math.abs(v || 0) > 0.15 ? v : 0), bv = i => (gp.buttons[i] ? gp.buttons[i].value : 0);
      this.padAx = { lx: dz(gp.axes[0]), ly: dz(gp.axes[1]), rx: dz(gp.axes[2]), ry: dz(gp.axes[3]), lt: bv(6), rt: bv(7) };
      if (edge(12)) m.key(fake('ArrowUp'));
      if (edge(13)) m.key(fake('ArrowDown'));
      if (edge(14)) m.key(fake('ArrowLeft'));
      if (edge(15)) m.key(fake('ArrowRight'));
      if (edge(0)) m.key(fake('Enter'));
      if (edge(4)) m.key(fake('KeyQ'));
      if (edge(5)) m.key(fake('KeyE'));
      if (edge(2)) this.shoot();
      if (edge(3)) this.toggleUi();
      if (edge(8)) this.openAlbum();
      if (edge(10)) this.switchMode();
      if (edge(1)) m.key(fake('Escape'));
      return true;
    }

    toggleUi() {
      this.bare = !this.bare;
      this.scr.el.classList.toggle('fz-ph-bare', this.bare);
    }

    exit() { if (this.ui.menus.top === this.scr) this.ui.menus.pop(); }

    close() {
      const ui = this.ui, g = ui.game, r = ui.renderer;
      if (g) {
        const look = {};
        for (const k of LOOK) look[k] = this.o[k];
        g.profile.photoOpt = look;
        g.save();
      }
      if (r) { r.forcePost = false; r.wantDepth = false; }
      ui.photo = null;
      ui.camPos = null;
      ui.keys = {};
      this.held.clear();
      if (this.noteT) clearTimeout(this.noteT);
    }

    opts() {
      const o = this.o, depth = !!this.ui.renderer.depthExt, W = F.WEATHER;
      const list = (tab, id, name, items, off) => ({ tab, id, name, items, off });
      const range = (tab, id, name, min, max, inc, fmt) => ({ tab, id, name, min, max, inc, fmt });
      const custom = (tab, id, name, step, text, off) => ({ tab, id, name, step, text, off });
      const sizeName = rows => {
        const a = this.aspect() || (this.ui.el.clientWidth || 4) / (this.ui.el.clientHeight || 3);
        return rows ? `${Math.round(rows * a)}×${rows}` : 'Как экран';
      };
      const stepList = (arr, cur, d) => {
        if (d > 0) return arr.find(v => v > cur + 1e-6) ?? arr[arr.length - 1];
        for (let i = arr.length - 1; i >= 0; i--) if (arr[i] < cur - 1e-6) return arr[i];
        return arr[0];
      };
      return [
        list(0, 'mode', 'Камера', [['orbit', 'Вокруг машины'], ['free', 'Свободная']]),
        custom(0, 'fl', 'Объектив', d => { this.fl = stepList(FOCALS, this.fl, d); }, () => `${Math.round(this.fl)} мм · ${Math.round(fovOf(this.fl))}°`),
        range(0, 'roll', 'Наклон горизонта', -30, 30, 1, v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '°'),
        list(0, 'aspect', 'Формат кадра', ASPECTS.map(a => [a[0], a[1]])),
        list(0, 'grid', 'Сетка видоискателя', [['off', 'Нет'], ['thirds', 'Правило третей'], ['center', 'Перекрестье']]),
        list(1, 'ap', 'Диафрагма', STOPS.map(s => [s, s ? 'f/' + num(s) : 'Всё резко']), () => !depth),
        list(1, 'af', 'Фокусировка', [['car', 'На машину'], ['manual', 'Вручную']], () => !o.ap),
        custom(1, 'fd', 'Дистанция фокуса', d => { o.fd = stepList(FOCUS, o.fd, d); }, () => (o.af === 'car' ? 'авто · ' + num(this.focusDist()) + ' м' : num(o.fd) + ' м'), () => !o.ap || o.af === 'car'),
        range(1, 'blur', 'Смаз движения', 0, 100, 10, v => v + '%'),
        range(1, 'vig', 'Виньетирование', 0, 100, 10, v => v + '%'),
        list(1, 'flare', 'Блики солнца', [['on', 'Есть'], ['off', 'Нет']]),
        range(2, 'ev', 'Экспозиция', -2, 2, 1 / 3, evText),
        range(2, 'con', 'Контраст', -50, 50, 5, v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '%'),
        range(2, 'sat', 'Насыщенность', 0, 200, 10, v => v + '%'),
        list(2, 'filter', 'Плёнка', Object.keys(FILTERS).map(k => [k, FILTERS[k].name])),
        range(2, 'grain', 'Зерно', 0, 100, 10, v => v + '%'),
        custom(3, 'clock', 'Время суток', d => { o.clock = ((Math.round(o.clock * 4) + d) / 4 + 24) % 24; }, () => hhmm(o.clock)),
        list(3, 'wx', 'Погода', [['', 'Как сейчас']].concat(Object.keys(W).map(k => [k, W[k].name]))),
        list(3, 'lights', 'Фары', [['auto', 'Как есть'], ['on', 'Включены'], ['off', 'Выключены']]),
        list(3, 'brake', 'Стоп-сигналы', [['auto', 'Как есть'], ['on', 'Горят'], ['off', 'Погашены']]),
        custom(3, 'steer', 'Поворот колёс', d => {
          const cur = o.steer === null ? Math.round(this.ui.game.veh.delta * 180 / Math.PI / 5) * 5 : o.steer;
          o.steer = F.clamp(cur + d * 5, -35, 35);
        }, () => (o.steer === null ? 'Как есть' : (o.steer > 0 ? 'вправо ' : o.steer < 0 ? 'влево ' : '') + Math.abs(o.steer) + '°')),
        list(3, 'car', 'Ваша машина', [['show', 'В кадре'], ['hide', 'Скрыта']]),
        list(3, 'others', 'Другие машины', [['show', 'В кадре'], ['hide', 'Скрыты']]),
        list(4, 'date', 'Дата на снимке', [['off', 'Нет'], ['on', 'Как у мыльницы']]),
        list(4, 'caption', 'Подпись', [['off', 'Нет'], ['place', 'Место'], ['full', 'Место и машина']]),
        list(4, 'logo', 'Логотип фестиваля', [['off', 'Нет'], ['on', 'Есть']]),
        list(4, 'frame', 'Рамка', [['none', 'Нет'], ['instant', 'Моментальное фото'], ['film', 'Плёнка 35 мм']]),
        list(4, 'res', 'Размер снимка', SIZES.map(s => [s[0], sizeName(s[2])]))
      ];
    }

    value(opt) {
      if (opt.text) return opt.text();
      if (opt.items) { const it = opt.items.find(i => i[0] === this.o[opt.id]); return it ? it[1] : ''; }
      return opt.fmt(this.o[opt.id]);
    }

    adjust(opt, d) {
      if (opt.off && opt.off()) return;
      const o = this.o;
      if (opt.id === 'mode') { this.switchMode(); return; }
      if (opt.step) opt.step(d);
      else if (opt.items) {
        const i = opt.items.findIndex(x => x[0] === o[opt.id]), n = opt.items.length;
        o[opt.id] = opt.items[((i < 0 ? 0 : i) + d + n) % n][0];
      } else o[opt.id] = F.clamp(Math.round((o[opt.id] + d * opt.inc) * 1000) / 1000, opt.min, opt.max);
      this.refreshRows();
    }

    screen() {
      const menus = this.ui.menus;
      const el = h('div', 'fz-scr fz-photo');
      el.innerHTML = `<canvas class="fz-ph-vf"></canvas><div class="fz-ph-panel"><div class="fz-ph-head"><b>ФОТОРЕЖИМ</b><span></span></div><div class="fz-ph-tabs"></div><div class="fz-ph-rows"></div><div class="fz-ph-btns"></div></div>
        <div class="fz-ph-strip"><div class="fz-ph-read"></div><div class="fz-ph-hunt"></div></div><div class="fz-ph-flash"></div><div class="fz-ph-note"></div>`;
      this.vf = el.querySelector('.fz-ph-vf');
      this.readEl = el.querySelector('.fz-ph-read');
      this.huntEl = el.querySelector('.fz-ph-hunt');
      this.flashEl = el.querySelector('.fz-ph-flash');
      this.noteEl = el.querySelector('.fz-ph-note');
      this.frameNo = el.querySelector('.fz-ph-head span');
      const strip = el.querySelector('.fz-ph-strip');
      strip.appendChild(menus.hints([['Пробел', 'Снимок'], ['Мышь / WASD', 'Камера'], ['R / F', 'Выше / ниже'], ['Z / X', 'Зум'], ['Tab', 'Режим камеры'], ['↑↓ ←→', 'Настройки'], ['Q / E', 'Разделы'], ['G', 'Альбом'], ['H', 'Скрыть'], ['Esc', 'Выход']]));
      let drag = null;
      this.vf.addEventListener('pointerdown', e => {
        drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
        this.vf.setPointerCapture(e.pointerId);
        this.vf.classList.add('fz-ph-drag');
        this.ui.el.focus({ preventScroll: true });
      });
      this.vf.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        this.drag(e.clientX - drag.x, e.clientY - drag.y);
        drag.x = e.clientX; drag.y = e.clientY;
      });
      const up = () => { drag = null; this.vf.classList.remove('fz-ph-drag'); };
      this.vf.addEventListener('pointerup', up);
      this.vf.addEventListener('pointercancel', up);
      this.vf.addEventListener('wheel', e => { e.preventDefault(); this.wheel(e); }, { passive: false });
      const scr = { el, isPhoto: true, draw: () => this.frame(), onKey: e => this.key(e), back: () => this.exit(), onClose: () => this.close() };
      scr.tab = d => { this.tabIdx = (this.tabIdx + d + TABS.length) % TABS.length; this.buildPanel(); this.ui.audio.play('blip'); };
      scr.refresh = () => { this.buildPanel(); };
      this.scr = scr;
      this.buildPanel();
      return scr;
    }

    buildPanel() {
      const menus = this.ui.menus, el = this.scr.el;
      const tabs = el.querySelector('.fz-ph-tabs'), rows = el.querySelector('.fz-ph-rows'), btns = el.querySelector('.fz-ph-btns');
      tabs.innerHTML = ''; rows.innerHTML = ''; btns.innerHTML = '';
      TABS.forEach((t, i) => tabs.appendChild(menus.nav(h('span', 'fz-ph-tab' + (i === this.tabIdx ? ' on' : ''), t), () => { this.tabIdx = i; this.buildPanel(); })));
      this.rows = [];
      for (const opt of this.opts().filter(x => x.tab === this.tabIdx)) {
        const row = h('div', 'fz-ph-row', `<span>${esc(opt.name)}</span><b><i class="fz-ph-l"></i><em></em><i class="fz-ph-r"></i></b>`);
        menus.nav(row, null, d => this.adjust(opt, d));
        row.querySelector('.fz-ph-l').addEventListener('click', ev => { ev.stopPropagation(); menus.setFocus(row); this.adjust(opt, -1); this.ui.audio.play('blip'); });
        row.querySelector('.fz-ph-r').addEventListener('click', ev => { ev.stopPropagation(); menus.setFocus(row); this.adjust(opt, 1); this.ui.audio.play('blip'); });
        row.addEventListener('wheel', ev => { ev.preventDefault(); this.adjust(opt, ev.deltaY < 0 ? 1 : -1); }, { passive: false });
        rows.appendChild(row);
        this.rows.push({ opt, row, em: row.querySelector('em') });
      }
      if (this.rows[0]) this.rows[0].row.setAttribute('data-first', '1');
      const btn = (t, cls, fn) => btns.appendChild(menus.nav(h('div', 'fz-ph-btn ' + cls, t), fn));
      btn('Снимок', 'fz-ph-shot', () => this.shoot());
      btn('Альбом', '', () => this.openAlbum());
      btn('Сбросить', '', () => this.reset());
      btn('Выход', '', () => this.exit());
      this.refreshRows();
      if (menus.top === this.scr) menus.autoFocus(this.scr, true);
    }

    refreshRows() {
      for (const r of this.rows || []) {
        const off = !!(r.opt.off && r.opt.off());
        r.row.classList.toggle('fz-ph-off', off);
        const v = this.value(r.opt);
        if (r.em.textContent !== v) r.em.textContent = v;
      }
      if (this.frameNo) this.frameNo.textContent = 'кадр ' + (((this.ui.game && this.ui.game.profile.photoN) || 0) + 1);
    }

    reset() {
      const keep = { mode: this.o.mode };
      Object.assign(this.o, lookDefaults(), { roll: 0, clock: this.ui.game.clock, wx: '', lights: 'auto', brake: 'auto', steer: null, car: 'show', others: 'show' }, keep);
      if (!this.ui.renderer.depthExt) this.o.ap = 0;
      this.refreshRows();
      this.note('Настройки сброшены', '', null);
    }

    info(seen = this.live) {
      const ui = this.ui, g = ui.game, car = F.Cars.get(g.entry.id), p = g.profile, c = this.car;
      if (!this.where) {
        const d = ui.world.districtAt(c.x, c.z), nr = ui.world.nearestRoad(c.x, c.z, 25);
        this.where = { district: d ? d.name : '', street: nr && nr.e.name ? nr.e.name : '' };
      }
      const lm = seen && seen.car && seen.found[0], wh = this.where;
      const place = lm ? lm.name : wh.district || wh.street || 'Рига', street = lm || wh.district ? wh.street : '';
      return {
        place, street, car: `${car.year} ${car.make} ${car.model}`, clock: this.o.clock,
        weather: F.WEATHER[F.weatherId(this.o.wx || g.weather)].name, day: festDay(p), n: (p.photoN || 0) + 1, ev: g.race ? g.race.ev.name : ''
      };
    }

    drawVF() {
      const cv = this.vf, W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) return;
      const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const [x, y, w, hh] = cropOf(W, H, this.aspect());
      c.fillStyle = 'rgba(6,6,8,0.72)';
      if (y > 0.5) { c.fillRect(0, 0, W, y); c.fillRect(0, y + hh, W, H - y - hh); }
      if (x > 0.5) { c.fillRect(0, 0, x, H); c.fillRect(x + w, 0, W - x - w, H); }
      stamp(c, x, y, w, hh, this.o, this.info(), this.o.frame !== 'instant');
      if (this.bare) return;
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 1;
      if (this.o.grid === 'thirds') {
        c.beginPath();
        for (const k of [1, 2]) { c.moveTo(x + w * k / 3, y); c.lineTo(x + w * k / 3, y + hh); c.moveTo(x, y + hh * k / 3); c.lineTo(x + w, y + hh * k / 3); }
        c.stroke();
      } else if (this.o.grid === 'center') {
        c.beginPath();
        c.moveTo(x + w / 2 - 14, y + hh / 2); c.lineTo(x + w / 2 + 14, y + hh / 2); c.moveTo(x + w / 2, y + hh / 2 - 14); c.lineTo(x + w / 2, y + hh / 2 + 14);
        c.stroke();
      }
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 2;
      const L = Math.min(w, hh) * 0.06, m = 10;
      c.beginPath();
      for (const [px, py, sx, sy] of [[x + m, y + m, 1, 1], [x + w - m, y + m, -1, 1], [x + m, y + hh - m, 1, -1], [x + w - m, y + hh - m, -1, -1]]) {
        c.moveTo(px, py + sy * L); c.lineTo(px, py); c.lineTo(px + sx * L, py);
      }
      c.stroke();
      const af = this.o.ap && this.o.af === 'car' && this.carUv ? [this.carUv[0] * W, (1 - this.carUv[1]) * H] : [x + w / 2, y + hh / 2];
      c.strokeStyle = this.o.ap ? '#d7ff1e' : 'rgba(255,255,255,0.6)';
      c.lineWidth = 1.5;
      const s = 12;
      c.beginPath();
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.moveTo(af[0] + sx * s, af[1] + sy * (s - 5)); c.lineTo(af[0] + sx * s, af[1] + sy * s); c.lineTo(af[0] + sx * (s - 5), af[1] + sy * s); }
      c.stroke();
    }

    readout() {
      const o = this.o;
      const parts = [
        `<i class="${o.mode === 'orbit' ? 'orb' : 'fly'}">${o.mode === 'orbit' ? 'ОРБИТА' : 'СВОБОДНАЯ'}</i>`,
        `<b>${Math.round(this.fl)}</b> мм`, o.ap ? `<b>f/${num(o.ap)}</b>` : '', o.ap ? `⊙ ${num(this.focusDist())} м` : '', evText(o.ev), o.filter !== 'none' ? esc(FILTERS[o.filter].name) : '',
        `${hhmm(o.clock)}`, esc(this.info().place)
      ].filter(Boolean);
      const html = parts.map(p => `<span>${p}</span>`).join('');
      if (html !== this.readHtml) { this.readHtml = html; this.readEl.innerHTML = html; }
      const got = (this.ui.game.profile.photoLm || []), lv = this.live;
      let hunt = `Фотоохота: ${got.length} / ${this.targetsList.length}`;
      if (lv && lv.found.length) {
        const names = lv.found.map(t => esc(t.name) + (got.includes(t.key) ? '' : ' <em>новое!</em>')).join(', ');
        hunt += lv.car ? ` · В кадре: ${names}` : ` · В кадре: ${names} — поймайте в кадр свою машину`;
      }
      if (hunt !== this.huntHtml) { this.huntHtml = hunt; this.huntEl.innerHTML = hunt; }
    }

    maxDim() {
      const gl = this.ui.renderer.gl;
      return Math.min(2560, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 2048);
    }

    shoot() {
      const ui = this.ui, g = ui.game;
      if (!g || this.busy || ui.menus.top !== this.scr) return;
      const cssW = ui.el.clientWidth || 640, cssH = ui.el.clientHeight || 480;
      const [W0, H0] = ui.internalSize(), a = this.aspect() || W0 / H0;
      const size = captureSize(W0, H0, a, this.o.res === 'screen' ? 0 : +this.o.res, this.maxDim());
      const cam = this.camera();
      const seen = spotted(ui.world, this.targetsList, cam, vpOf(cam, size.rw / size.rh), cropUv(size.rw / size.rh, a), this.hideCar() ? null : this.car);
      const info = this.info(seen);
      let out;
      this.cap = [size.rw, size.rh, cssW, cssH];
      try {
        this.render();
        out = this.compose(size, a, info);
      } finally {
        this.cap = null;
      }
      this.flash();
      let url;
      try { url = out.toDataURL('image/jpeg', 0.9); } catch (e) { this.note('Снимок не сохранён', 'Браузер не отдал изображение.', null, true); return; }
      const p = g.profile;
      const res = store(p, url, {
        x: +this.car.x.toFixed(1), z: +this.car.z.toFixed(1), car: g.entry.id, carName: info.car, place: info.place, street: info.street,
        clock: +this.o.clock.toFixed(2), weather: info.weather, day: info.day, ev: info.ev, lms: seen.found.map(t => t.name), w: out.width, hgt: out.height
      });
      if (!res.ok) { this.note('Снимок не сохранён', res.err, null, true); return; }
      const prize = seen.car ? award(g, seen.found, this.targetsList.length) : null;
      g.save();
      const lines = [esc(res.where), `${out.width}×${out.height}`];
      if (prize) {
        lines.push(`<b class="fz-ph-prize">Фотоохота: ${prize.fresh.map(t => esc(t.name)).join(', ')} · +${F.fmtCR(prize.xp)} XP · +CR ${F.fmtCR(prize.cr)}</b>`);
        if (prize.bonus) lines.push(`<b class="fz-ph-prize">Все достопримечательности Риги сняты! Бонус CR ${F.fmtCR(prize.bonus)}</b>`);
        ui.audio.play('star');
      }
      this.note('Снимок сохранён', lines.join('<br>'), url);
      this.live = null;
      this.scanT = 0;
      this.refreshRows();
    }

    compose(size, a, info) {
      const ui = this.ui, { rw, rh, ow, oh } = size, [cx, cy, cw, ch] = cropOf(rw, rh, a);
      const photo = h('canvas');
      photo.width = ow; photo.height = oh;
      const x = photo.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.drawImage(ui.view, cx, cy, cw, ch, 0, 0, ow, oh);
      if (this.flare()) {
        const hc = ui.hudCv, kx = hc.width / rw, ky = hc.height / rh;
        x.drawImage(hc, cx * kx, cy * ky, cw * kx, ch * ky, 0, 0, ow, oh);
      }
      stamp(x, 0, 0, ow, oh, this.o, info, this.o.frame !== 'instant');
      return framed(photo, this.o, info);
    }

    flash() {
      const au = this.ui.audio;
      au.burst(3400, 'highpass', 0.035, 0.32, 0.7);
      au.burst(1500, 'bandpass', 0.06, 0.26, 1.4, 0.08);
      au.tone(90, 0.05, 0.12, 'square', 0.02);
      this.flashK = 1;
      this.flashEl.style.opacity = '0.95';
    }

    note(title, body, img, bad) {
      const n = this.noteEl;
      n.className = 'fz-ph-note on' + (bad ? ' bad' : '');
      n.innerHTML = `${img ? `<img src="${img}">` : ''}<div><b>${esc(title)}</b><p>${body}</p></div>`;
      if (this.noteT) clearTimeout(this.noteT);
      this.noteT = setTimeout(() => { n.classList.remove('on'); }, bad ? 6000 : 4500);
    }

    openAlbum() {
      if (this.ui.menus.top !== this.scr) return;
      this.held.clear();
      this.ui.menus.push(album(this.ui, this));
    }
  }

  function album(ui, mode) {
    const menus = ui.menus, g = ui.game, p = g.profile;
    const el = h('div', 'fz-scr fz-album');
    const scr = { el, tabIdx: 0, sel: null };
    const all = () => (mode ? mode.targetsList : targets(ui.scene));
    const say = t => { const s = el.querySelector('.fz-al-say'); if (s) { s.textContent = t; s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); } };
    const render = () => {
      const list = photoList(p).slice().reverse(), lm = all(), got = p.photoLm || [];
      el.innerHTML = `<div class="fz-al-head"><div class="fz-gtitle">Фотоальбом</div><div class="fz-al-tabs"></div><div class="fz-al-count">${list.length} ${F.plural(list.length, 'снимок', 'снимка', 'снимков')} · Фотоохота ${got.length} / ${lm.length}</div></div><div class="fz-al-body"></div><div class="fz-al-say"></div>`;
      const tabs = el.querySelector('.fz-al-tabs'), body = el.querySelector('.fz-al-body');
      ['СНИМКИ', 'ФОТООХОТА'].forEach((t, i) => tabs.appendChild(menus.nav(h('span', 'fz-al-tab' + (i === scr.tabIdx ? ' on' : ''), t), () => { scr.tabIdx = i; render(); })));
      if (scr.tabIdx === 0) shots(body, list);
      else hunt(body, lm, got);
      el.appendChild(menus.hints([['←→', 'Листать'], ['Enter', 'Выбрать'], ['Q / E', 'Разделы'], ['Esc', 'Назад']]));
      menus.autoFocus(scr);
    };
    const shots = (body, list) => {
      body.className = 'fz-al-body fz-al-shots';
      if (!list.length) {
        body.appendChild(h('div', 'fz-al-empty', '<b>Альбом пуст</b><p>Откройте фоторежим (V или пункт меню «Фоторежим»), выберите кадр и нажмите Пробел.</p>'));
        return;
      }
      const view = h('div', 'fz-al-view'), pic = h('div', 'fz-al-pic', '<img>'), info = h('div', 'fz-al-info');
      view.appendChild(pic); view.appendChild(info);
      const strip = h('div', 'fz-al-strip');
      body.appendChild(view); body.appendChild(strip);
      const img = pic.querySelector('img');
      const show = ph => {
        scr.sel = ph;
        img.src = readPhoto(ph) || '';
        const row = (k, v) => (v ? `<div><span>${k}</span><em>${esc(v)}</em></div>` : '');
        const day = ph.day ? dateLong(ph.day) : '';
        info.innerHTML = `<b>${esc(ph.file)}</b>${row('Место', [ph.place, ph.street].filter(Boolean).join(' · '))}${row('Машина', ph.carName)}${row('Время', ph.clock !== undefined ? hhmm(ph.clock) + (ph.weather ? ' · ' + ph.weather : '') : '')}${row('Дата', day)}${row('Событие', ph.ev)}${row('В кадре', (ph.lms || []).join(', '))}${row('Размер', ph.w ? ph.w + '×' + ph.hgt : '')}`;
        const acts = h('div', 'fz-al-acts');
        const act = (t, fn, hot) => acts.appendChild(menus.nav(h('div', 'fz-btn' + (hot ? ' fz-btn-hot' : ''), t), fn));
        act('Маршрут сюда', () => {
          if (g.race) { say('Маршрут недоступен во время гонки'); return; }
          g.setWaypoint(ph.x, ph.z);
          say('Маршрут проложен: ' + (ph.place || 'место снимка'));
        }, true);
        if (typeof window !== 'undefined' && window.appDialogs && window.appDialogs.saveDisplaySettings) act('Обои Рабочего стола', () => {
          const d = window.appDialogs, s = d.saveDisplaySettings({ wallpaper: readPhoto(ph), wallpaperMode: 'stretch' });
          if (d.applyDisplaySettings) d.applyDisplaySettings(s || d.getDisplaySettings());
          say('Снимок стал обоями Рабочего стола');
        });
        if (ph.at !== 'vfs') act('Скачать', () => { const a = document.createElement('a'); a.href = readPhoto(ph); a.download = ph.file; a.click(); });
        act('Удалить', () => menus.confirm('Удалить снимок', ph.at === 'vfs' ? `Файл ${esc(ph.file)} будет перемещён в Корзину.` : `Снимок ${esc(ph.file)} будет удалён.`, () => { removePhoto(p, ph); g.save(); render(); }));
        info.appendChild(acts);
      };
      list.forEach((ph, i) => {
        const th = menus.nav(h('div', 'fz-al-thumb', `<img src="${readPhoto(ph)}"><span>${String(p.photos.indexOf(ph) + 1).padStart(2, '0')}</span>`), () => show(ph));
        th._onFocus = () => { if (scr.sel !== ph) show(ph); strip.querySelectorAll('.fz-al-thumb').forEach(t => t.classList.toggle('on', t === th)); };
        if (i === 0) th.setAttribute('data-first', '1');
        strip.appendChild(th);
      });
      show(list.includes(scr.sel) ? scr.sel : list[0]);
    };
    const hunt = (body, lm, got) => {
      body.className = 'fz-al-body fz-al-hunt';
      body.appendChild(h('p', 'fz-al-rule', `Сфотографируйте свою машину на фоне каждой достопримечательности Риги: за первый снимок — +${F.fmtCR(XP)} XP и CR ${F.fmtCR(CR)}, за все ${lm.length} — ещё CR ${F.fmtCR(ALL_CR)}. Достопримечательность должна занимать заметную часть кадра и не прятаться за домами. Enter — проложить маршрут.`));
      const grid = h('div', 'fz-al-lms');
      body.appendChild(grid);
      lm.forEach((t, i) => {
        const d = ui.world.districtAt(t.x, t.z), done = got.includes(t.key);
        const card = menus.nav(h('div', 'fz-al-lm' + (done ? ' done' : ''), `<i></i><b>${esc(t.name)}</b><span>${esc(d ? d.name : 'Рига')}</span>`), () => {
          if (g.race) { say('Маршрут недоступен во время гонки'); return; }
          g.setWaypoint(t.x, t.z);
          say('Маршрут проложен: ' + t.name);
        });
        if (i === 0) card.setAttribute('data-first', '1');
        grid.appendChild(card);
      });
    };
    scr.tab = d => { scr.tabIdx = (scr.tabIdx + d + 2) % 2; render(); ui.audio.play('blip'); };
    scr.refresh = render;
    render();
    return scr;
  }

  F.Photo = {
    Mode, album, fovOf, focalOf, cocScale, cropOf, cropUv, captureSize, festDay, dateText, dateLong, evText, constrain, rayHit, sight, targets, spotted, award,
    store, photoList, removePhoto, readPhoto, lookDefaults, FILTERS, FOCALS, STOPS, ASPECTS, SIZES, LOOK, RANGE, CEIL, XP, CR, ALL_CR
  };
})(globalThis.Forza = globalThis.Forza || {});
