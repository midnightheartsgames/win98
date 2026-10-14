(function (N) {
  'use strict';

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const LENSES = [18, 21, 24, 28, 35, 50, 70, 85, 105, 135, 200];
  const STOPS = [1.8, 2.8, 4, 5.6, 8, 11, 16];
  const FOCUS = [0.6, 1, 1.5, 2, 3, 4, 6, 8, 12, 18, 25, 40, 70, 150, 1000];
  const FILMS = [
    { id: 'life', name: 'Как в жизни' },
    { id: 'gold', name: 'Kodak Gold 200', sat: 1.16, con: 1.07, fade: 0.04, grain: 0.04, sh: [0.95, 0.99, 1.07], hi: [1.07, 1.0, 0.87], vig: 0.3, edge: 'KODAK GOLD 200' },
    { id: 'svema', name: '«Свема» цветная', sat: 0.72, con: 0.9, fade: 0.08, grain: 0.055, sh: [0.84, 1.03, 1.02], hi: [1.07, 0.97, 0.85], vig: 0.35, edge: 'СВЕМА  ЦНД-64' },
    { id: 'bw', name: '«Фото-64» ч/б', mono: 1, con: 1.14, fade: 0.05, grain: 0.08, vig: 0.32, sh: [1.12, 1.12, 1.12], hi: [1.08, 1.08, 1.08], edge: 'СВЕМА  ФОТО-64' },
    { id: 'sepia', name: 'Старая карточка', mono: 1, con: 0.94, fade: 0.09, grain: 0.06, sh: [0.82, 0.68, 0.5], hi: [1.1, 0.99, 0.8], vig: 0.6, edge: 'ФОТОБУМАГА' },
    { id: 'vhs', name: 'Видеокамера', sat: 0.84, con: 1.04, fade: 0.06, grain: 0.03, sh: [0.95, 1.0, 1.08], hi: [1.02, 1.0, 0.96], vig: 0.12, vhs: 1, edge: 'VHS-C' }
  ];
  const ASPECTS = [
    { id: 'screen', name: 'как экран', k: 0 },
    { id: '43', name: '4:3', k: 4 / 3 },
    { id: '32', name: '3:2, плёнка', k: 1.5 },
    { id: '11', name: '1:1', k: 1 },
    { id: '34', name: '3:4, стоя', k: 0.75 }
  ];
  const FRAMES = [
    { id: 'none', name: 'нет', b: [0, 0, 0, 0] },
    { id: 'print', name: 'фотокарточка', b: [0.032, 0.032, 0.032, 0.032], paper: '#f2eee2' },
    { id: 'instant', name: 'моментальное фото', b: [0.06, 0.06, 0.06, 0.25], paper: '#f5f4ef' },
    { id: 'strip', name: 'негатив', b: [0.014, 0.13, 0.014, 0.13], paper: '#16120f' }
  ];
  const GRIDS = [{ id: 'none', name: 'нет' }, { id: 'thirds', name: 'трети' }, { id: 'level', name: 'горизонт' }];
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const MONTHS_IN = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

  const bld = (b, side, k) => b ? { x: b.cx, y: (b.y0 || 0) + b.h * 0.5, z: b.cz, r: 0.5 * Math.max(b.x1 - b.x0, b.z1 - b.z0, b.h) * (k || 0.85), ref: b.id, side: side ? { x: side.x, z: side.z } : null } : null;
  const VIEWS = [
    { id: 'dk', name: 'Дворец культуры ГАЗ', find: c => bld(c.dkB, c.places.dk) },
    { id: 'mir', name: 'Кинотеатр «Мир»', find: c => bld(c.mirB, c.places.cinema) },
    { id: 'um', name: 'Универмаг с буквами на крыше', find: c => { const b = c.uniB, d = b && b.lm && b.lm.drum; return d ? { x: d.cx, y: 12, z: d.cz, r: d.r + 10, ref: b.id, side: c.places.univermag } : null; } },
    { id: 'hotel', name: 'Гостиница «Автозаводская»', find: c => bld(c.hotelB, c.places.hotel_door) },
    { id: 'radius', name: 'Радиусный дом', find: c => bld(c.radiusB, null, 0.7) },
    { id: 'gate', name: 'Главная проходная ГАЗ', find: c => (c.gazGate && c.places.gaz_gate ? { x: c.gazGate.x, y: 7, z: c.gazGate.z, r: 14, side: c.places.gaz_gate } : null) },
    {
      id: 'lenin', name: 'Ленин у проходной', find: c => {
        const g = c.gazGate || c.places.gaz_gate;
        const all = c.props.filter(p => p.type === 'monument' && p.kind === 'lenin');
        if (!all.length) return null;
        const m = g ? all.reduce((a, p) => (Math.hypot(p.x - g.x, p.z - g.z) < Math.hypot(a.x - g.x, a.z - g.z) ? p : a)) : all[0];
        return { x: m.x, y: 4, z: m.z, r: 3.8, dmax: 120 };
      }
    },
    {
      id: 'tower', name: 'Башня заводоуправления', find: c => {
        const b = c.buildings.find(q => !q.removed && q.lm && q.lm.type === 'gazadmin' && q.lm.tower);
        if (!b) return null;
        const t = N.polyBounds(b.lm.tower);
        return { x: (t.x0 + t.x1) / 2, y: 30, z: (t.z0 + t.z1) / 2, r: 17, ref: b.id, dmax: 700 };
      }
    },
    {
      id: 'chimneys', name: 'Трубы ГАЗа', find: c => {
        const all = c.props.filter(p => p.type === 'chimney' && p.stripes);
        if (!all.length) return null;
        const m = all.reduce((a, p) => (p.h > a.h ? p : a));
        return { x: m.x, y: m.h * 0.5, z: m.z, r: m.h * 0.45, dmax: 900 };
      }
    },
    { id: 'parkgate', name: 'Ворота Автозаводского парка', find: c => (c.parkGate && c.places.park_gate ? { x: c.parkGate.x, y: 6, z: c.parkGate.z, r: 13, side: c.places.park_gate } : null) },
    { id: 'ferris', name: 'Колесо обозрения', find: c => { const W = c.parkData && c.parkData.wheel; return W ? { x: W.x, y: W.hub, z: W.z, r: W.r + 2, dmax: 500 } : null; } },
    { id: 'bridge', name: 'Мызинский мост', find: c => { const d = c.bridgeDecks && c.bridgeDecks[0]; return d ? { x: d.x + d.dx * 260, y: 17, z: d.z + d.dz * 260, r: 45, dmax: 1200, side: c.places.myza_bridge } : null; } }
  ];

  const PHOTO = {
    roll: 24, reach: 40, reachIn: 14, speed: 4, fast: 3, out: 1024, quality: 0.82, fee: 300, bonus: 3000, budget: 4500000,
    dir: ['My Computer', 'C:', 'My Documents', 'Мои рисунки', 'Нижний Сити'], shown: 'Мои рисунки\\Нижний Сити', meta: 'gtann_photos',
    LENSES, STOPS, FOCUS, FILMS, ASPECTS, FRAMES, GRIDS, VIEWS
  };
  N.PHOTO = PHOTO;

  const byId = (list, id) => list.find(x => x.id === id) || list[0];
  N.lensFov = mm => 2 * Math.atan(12 / mm);
  N.lensFor = fov => LENSES.reduce((a, mm, i) => (Math.abs(N.lensFov(mm) - fov) < Math.abs(N.lensFov(LENSES[a]) - fov) ? i : a), 0);
  N.photoDay = day => { const d = new Date(Date.UTC(2000, 6, 12 + (day || 0))); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; };
  N.photoStamp = (day, clock, vhs) => {
    const D = N.photoDay(day);
    return vhs ? [N.pad(D.d, 2) + '.' + N.pad(D.m, 2) + '.' + D.y, N.clock(clock)] : ['’' + N.pad(D.y % 100, 2) + ' ' + String(D.m).padStart(2, ' ') + ' ' + N.pad(D.d, 2)];
  };
  N.photoDateText = day => { const D = N.photoDay(day); return D.d + ' ' + MONTHS[D.m - 1] + ' ' + D.y; };
  N.photoCoc = (mm, stop, focus, H) => mm * mm * H / (stop * Math.max(0.3, focus) * 24000);

  const FULL = { x0: 0, y0: 0, x1: 1, y1: 1 };
  N.photoCrop = (W, H, aspect, frame, area) => {
    const A = byId(ASPECTS, aspect), F = byId(FRAMES, frame), b = F.b, ar = area || FULL;
    const AX = ar.x0 * W, AY = ar.y0 * H, AW = (ar.x1 - ar.x0) * W, AH = (ar.y1 - ar.y0) * H;
    if (!A.k && F.id === 'none' && AW >= W - 0.5 && AH >= H - 0.5) return { x: 0, y: 0, w: W, h: H, fx: 0, fy: 0, fw: W, fh: H };
    const a = A.k || W / H, m = F.id === 'none' ? 0 : Math.min(AW, AH) * 0.05;
    const tw = 1 + b[0] + b[2], th = 1 / a + b[1] + b[3];
    const w = Math.min((AW - 2 * m) / tw, (AH - 2 * m) / th);
    const fw = w * tw, fh = w * th, fx = AX + (AW - fw) / 2, fy = AY + (AH - fh) / 2;
    return { x: fx + b[0] * w, y: fy + b[1] * w, w, h: w / a, fx, fy, fw, fh };
  };
  N.photoView = (W, H, crop, mm) => {
    const short = Math.min(crop.w, crop.h), tanV = 12 / mm * H / short;
    return { short, tanV, fov: 2 * Math.atan(tanV), sx: (crop.x + crop.w / 2) / W * 2 - 1, sy: 1 - (crop.y + crop.h / 2) / H * 2 };
  };

  N.photoSpots = city => {
    if (city.photoSpots) return city.photoSpots;
    const out = [];
    for (const v of VIEWS) {
      let s = null;
      try { s = v.find(city); } catch (e) { s = null; }
      if (s && isFinite(s.x) && isFinite(s.y) && isFinite(s.z) && s.r > 0) out.push(Object.assign({ id: v.id, name: v.name, dmax: 450 }, s));
    }
    city.photoSpots = out;
    return out;
  };

  N.photoBasis = (yaw, pitch, roll) => {
    const cp = Math.cos(pitch), f = [Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp];
    const r0 = [Math.cos(yaw), 0, Math.sin(yaw)];
    const u0 = [r0[1] * f[2] - r0[2] * f[1], r0[2] * f[0] - r0[0] * f[2], r0[0] * f[1] - r0[1] * f[0]];
    const c = Math.cos(roll || 0), s = Math.sin(roll || 0);
    return { f, r: [r0[0] * c - u0[0] * s, r0[1] * c - u0[1] * s, r0[2] * c - u0[2] * s], u: [u0[0] * c + r0[0] * s, u0[1] * c + r0[1] * s, u0[2] * c + r0[2] * s] };
  };

  const sightRay = (city, world, x, y, z, dx, dy, dz, L) => {
    let o = 0;
    for (let k = 0; k < 6; k++) {
      const h = N.Phys.rayStatic(city, x + dx * o, y + dy * o, z + dz * o, dx, dy, dz, L - o, world, false);
      if (!h) return null;
      if (h.it.kind !== 'edge') return { t: o + h.t, it: h.it };
      o += h.t + 0.05;
      if (o >= L) return null;
    }
    return null;
  };

  N.photoSeen = (city, world, cam, crop) => {
    const seen = [];
    const cw = crop.x1 - crop.x0, chh = crop.y1 - crop.y0;
    const ext = Math.max(cw * 2 * cam.tanV * cam.asp, chh * 2 * cam.tanV);
    for (const s of N.photoSpots(city)) {
      const dx = s.x - cam.x, dy = s.y - cam.y, dz = s.z - cam.z, d = Math.hypot(dx, dy, dz);
      if (d < 2 || d > s.dmax) continue;
      const zc = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
      if (zc <= 0.5) continue;
      const xc = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2], yc = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
      const sx = (xc / (zc * cam.tanV * cam.asp) + (cam.sx || 0) + 1) / 2, sy = (1 - yc / (zc * cam.tanV) - (cam.sy || 0)) / 2;
      if (sx < crop.x0 + cw * 0.08 || sx > crop.x1 - cw * 0.08 || sy < crop.y0 + chh * 0.08 || sy > crop.y1 - chh * 0.08) continue;
      const frac = 2 * s.r / zc / ext;
      if (frac < 0.25 || frac > 2.6) continue;
      if (s.side) {
        const ax = cam.x - s.x, az = cam.z - s.z, bx = s.side.x - s.x, bz = s.side.z - s.z;
        if ((ax * bx + az * bz) / ((Math.hypot(ax, az) * Math.hypot(bx, bz)) || 1) < 0.15) continue;
      }
      let clear = 0;
      for (const py of [s.y, s.y + s.r * 0.35, Math.max(0.8, s.y - s.r * 0.35)]) {
        const ex = s.x - cam.x, ey = py - cam.y, ez = s.z - cam.z, L = Math.hypot(ex, ey, ez) || 1;
        const h = sightRay(city, world, cam.x, cam.y, cam.z, ex / L, ey / L, ez / L, L);
        if (!h || h.t > L - s.r * 0.85 || (s.ref !== undefined && h.it.ref === s.ref)) clear++;
      }
      if (clear >= 2) seen.push(s.id);
    }
    return seen;
  };

  const MEM = new Map();
  const vfsOf = () => (typeof window !== 'undefined' && window.vfs && window.vfs.resolvePath && window.vfs.writeFile ? window.vfs : null);
  const store = () => (typeof localStorage !== 'undefined' ? localStorage : null);
  const metaAll = () => { try { return JSON.parse((store() && store().getItem(PHOTO.meta)) || '{}') || {}; } catch (e) { return {}; } };
  const metaSave = m => { try { if (store()) store().setItem(PHOTO.meta, JSON.stringify(m)); } catch (e) { } };
  const numOf = f => { const m = /(\d+)\.jpg$/i.exec(f); return m ? +m[1] : 0; };
  const isShot = f => /^Снимок_\d+\.jpg$/i.test(f);

  N.PhotoAlbum = {
    mem: MEM,
    dir(make) {
      const v = vfsOf(), D = PHOTO.dir;
      if (!v) return null;
      if (v.resolvePath(D)) return v;
      if (!make || !v.createFolder) return null;
      for (let i = 3; i < D.length; i++) {
        const p = D.slice(0, i + 1);
        if (v.resolvePath(p)) continue;
        if (!v.resolvePath(D.slice(0, i)) || !v.createFolder(D.slice(0, i), D[i])) return null;
      }
      return v.resolvePath(D) ? v : null;
    },
    files() {
      const v = this.dir(false);
      const names = v ? v.list(PHOTO.dir).filter(it => it.type === 'file').map(it => it.key) : Array.from(MEM.keys());
      return names.filter(isShot).sort((a, b) => numOf(a) - numOf(b));
    },
    count() { return this.files().length; },
    kept() { return !!vfsOf(); },
    read(file) { const v = this.dir(false); return v ? v.readFile(PHOTO.dir, file) : MEM.get(file) || null; },
    list() { const meta = metaAll(); return this.files().map(file => ({ file, n: numOf(file), meta: meta[file] || null })); },
    used() {
      const s = store();
      if (!s || typeof s.length !== 'number' || !s.key) return 0;
      let n = 0;
      for (let i = 0; i < s.length; i++) { const k = s.key(i); n += k.length + (s.getItem(k) || '').length; }
      return n;
    },
    save(url, meta) {
      const files = this.files();
      if (files.length >= PHOTO.roll) return { ok: false, err: 'Плёнка кончилась: ' + PHOTO.roll + ' кадра из ' + PHOTO.roll + '. Лишние снимки удаляются в «Фотоальбоме» (Esc — пауза).' };
      const n = files.length ? numOf(files[files.length - 1]) + 1 : 1;
      const file = 'Снимок_' + N.pad(n, 3) + '.jpg';
      const v = vfsOf() ? this.dir(true) : null;
      if (vfsOf() && !v) return { ok: false, err: 'Не удалось создать папку ' + PHOTO.shown + '.' };
      if (v) {
        if (this.used() + url.length + 600 > PHOTO.budget) return { ok: false, err: 'На диске C: не хватает места для снимка (нужно ' + Math.ceil(url.length * 0.75 / 1024) + ' КБ). Удалите старые снимки или ненужные файлы.' };
        if (!v.writeFile(PHOTO.dir, file, url)) return { ok: false, err: 'Не удалось записать ' + file + '.' };
      } else MEM.set(file, url);
      const m = metaAll();
      m[file] = meta || {};
      metaSave(m);
      return { ok: true, file, n, count: files.length + 1, kept: !!v };
    },
    remove(file) {
      const v = this.dir(false);
      const ok = v ? v.deleteItem(PHOTO.dir, file, false) : MEM.delete(file);
      const m = metaAll();
      delete m[file];
      metaSave(m);
      return !!ok;
    }
  };

  N.photoPrint = (g, R, o) => {
    const F = byId(FRAMES, o.frame), S = R.w / 1000;
    if (F.id !== 'none') {
      g.save();
      g.beginPath();
      g.rect(R.fx, R.fy, R.fw, R.fh);
      g.rect(R.x, R.y, R.w, R.h);
      g.fillStyle = F.paper;
      g.fill('evenodd');
      if (F.id === 'strip') {
        const top = R.y - R.fy, bot = R.fy + R.fh - R.y - R.h, gap = R.w / 8, hw = gap * 0.42, hh = Math.min(top, bot) * 0.36;
        g.fillStyle = '#d9cfbd';
        for (const cy of [R.fy + top * 0.62, R.y + R.h + bot * 0.38]) {
          for (let x = R.fx + (gap - hw) / 2; x < R.fx + R.fw - hw * 0.5; x += gap) { g.beginPath(); g.rect(x, cy - hh / 2, hw, hh); g.fill(); }
        }
        g.fillStyle = '#ff9a2e';
        g.font = 'bold ' + Math.round(Math.min(top, bot) * 0.2) + 'px "Courier New", monospace';
        g.textBaseline = 'middle';
        g.textAlign = 'left';
        g.fillText((o.edge || 'ФОТОПЛЁНКА') + '   ' + (o.n || 1) + ' ▸', R.x + 40 * S, R.fy + top * 0.2);
        g.textAlign = 'right';
        g.fillText(String(o.n || 1) + 'A', R.x + R.w - 40 * S, R.y + R.h + bot * 0.8);
      } else {
        g.strokeStyle = 'rgba(0,0,0,0.18)';
        g.lineWidth = Math.max(1, 2 * S);
        g.strokeRect(R.x, R.y, R.w, R.h);
        const sh = g.createLinearGradient(R.fx, R.fy, R.fx + R.fw, R.fy + R.fh);
        sh.addColorStop(0, 'rgba(255,255,255,0.10)');
        sh.addColorStop(1, 'rgba(0,0,0,0.10)');
        g.fillStyle = sh;
        g.beginPath();
        g.rect(R.fx, R.fy, R.fw, R.fh);
        g.rect(R.x, R.y, R.w, R.h);
        g.fill('evenodd');
        if (F.id === 'instant' && o.caption) {
          const bh = R.fy + R.fh - R.y - R.h;
          g.fillStyle = '#2a3c8c';
          g.font = 'italic ' + Math.round(Math.min(bh * 0.3, 46 * S)) + 'px "Segoe Print", "Comic Sans MS", cursive';
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.fillText(o.caption, R.x + R.w / 2, R.y + R.h + bh * 0.48, R.w * 0.92);
        }
      }
      g.restore();
    }
    if (o.date) {
      const lines = N.photoStamp(o.day, o.clock, o.vhs);
      g.save();
      g.textBaseline = 'alphabetic';
      if (o.vhs) {
        const fs = Math.round(R.h * 0.055);
        g.font = 'bold ' + fs + 'px "Courier New", monospace';
        g.fillStyle = '#f4f4f4';
        g.shadowColor = 'rgba(0,0,0,0.9)';
        g.shadowOffsetX = g.shadowOffsetY = Math.max(1, fs * 0.08);
        g.textAlign = 'left';
        g.fillText('PLAY ▶', R.x + R.w * 0.06, R.y + R.h * 0.11);
        g.fillText(lines[0], R.x + R.w * 0.06, R.y + R.h * 0.86);
        g.fillText(lines[1], R.x + R.w * 0.06, R.y + R.h * 0.86 + fs * 1.15);
      } else {
        const fs = Math.round(R.h * 0.048);
        g.font = 'bold ' + fs + 'px "Courier New", monospace';
        g.textAlign = 'right';
        g.shadowColor = 'rgba(255,110,20,0.85)';
        g.shadowBlur = fs * 0.35;
        g.fillStyle = '#ffa03c';
        g.fillText(lines[0], R.x + R.w * 0.95, R.y + R.h * 0.93);
      }
      g.restore();
    }
  };

  const ROWS = [
    ['КАМЕРА', 'lens', 'Объектив'], [null, 'roll', 'Наклон'], [null, 'stop', 'Диафрагма'], [null, 'focus', 'Фокус'], [null, 'ev', 'Экспозиция'], [null, 'flash', 'Вспышка'],
    ['ПЛЁНКА И ПЕЧАТЬ', 'film', 'Плёнка'], [null, 'aspect', 'Кадр'], [null, 'frame', 'Рамка'], [null, 'date', 'Дата на снимке'],
    ['ВИДОИСКАТЕЛЬ', 'grid', 'Сетка'], [null, 'tyoma', 'Тёма в кадре']
  ];
  const cycle = (list, id, d) => { const i = list.findIndex(x => x.id === id); return list[(Math.max(0, i) + d + list.length) % list.length].id; };
  const fmtM = d => (d >= 999 ? '∞' : d >= 20 ? Math.round(d) + ' м' : (Math.round(d * 10) / 10).toString().replace('.', ',') + ' м');
  const HINT = 'WASD, Пробел, Alt — камера · мышь с кнопкой — обзор · колесо — объектив · Q/E — наклон · F — резкость по центру · Enter — снять · H — скрыть · Esc — выйти';

  class Photo {
    constructor(ui) {
      this.ui = ui;
      this.on = false;
      this.el = null;
      this.row = 0;
      this.keys = new Set();
      this.prefs = Object.assign({ stop: 4, focus: 0, flash: false, film: 'life', aspect: 'screen', frame: 'none', date: false, grid: 'none', tyoma: true }, (ui.settings && ui.settings.photo) || {});
      this.reset();
    }

    reset() {
      this.hidden = false;
      this.free = FULL;
      this.flashK = 0;
      this.toast = null;
      this.note = null;
      this.edgeT = 0;
      this.drag = null;
      this.ev = 0;
      this.af = 10;
      this.del = null;
    }

    blocked() {
      const ui = this.ui, g = ui.game;
      if (!g || ui.demo || ui.state !== 'play') return 'Фотоаппарат можно достать только в игре.';
      if (ui.debug && ui.debug.open) return 'Сначала закройте меню отладки.';
      if (g.cut || g.shop || g.death || g.fade) return 'Сейчас не до снимков.';
      return null;
    }

    open() {
      if (this.on || this.blocked()) return false;
      const ui = this.ui, w = ui.game.world, pl = w.player, base = pl.veh || pl;
      this.reset();
      this.on = true;
      this.inside = !!(ui.city && ui.city.inside(pl.x));
      this.reach = this.inside ? PHOTO.reachIn : PHOTO.reach;
      this.anchor = { x: base.x, y: (base.y || 0) + 1.2, z: base.z };
      const cs = ui.camState;
      if (cs) {
        const dx = cs.tx - cs.x, dy = cs.ty - cs.y, dz = cs.tz - cs.z, L = Math.hypot(dx, dy, dz) || 1;
        const ahead = cs.scope || cs.fp ? 0.4 : 0;
        this.c = { x: cs.x + dx / L * ahead, y: cs.y + dy / L * ahead, z: cs.z + dz / L * ahead, yaw: Math.atan2(dx, -dz), pitch: Math.asin(N.clamp(dy / L, -1, 1)), roll: 0 };
        this.lens = N.lensFor(cs.fov || 1.05);
      } else {
        const yaw = base.yaw || 0;
        this.c = { x: base.x - Math.sin(yaw) * 4, y: this.anchor.y + 0.6, z: base.z + Math.cos(yaw) * 4, yaw, pitch: -0.12, roll: 0 };
        this.lens = 1;
      }
      this.c.pitch = N.clamp(this.c.pitch, -1.45, 1.45);
      this.home = Object.assign({ lens: this.lens }, this.c);
      this.af = this.centerDist();
      this.count = N.PhotoAlbum.count();
      this.keys.clear();
      if (ui.keys) ui.keys.clear();
      if (ui.pressed) ui.pressed.clear();
      if (ui.mouse) { ui.mouse.l = ui.mouse.r = false; ui.mouse.dx = ui.mouse.dy = 0; ui.mouse.wheel = 0; }
      if (ui.locked && typeof document !== 'undefined' && document.exitPointerLock) document.exitPointerLock();
      if (ui.audio && ui.audio.on) { ui.audio.setRadio(ui.settings.station || 0, false); ui.audio.hush(true); ui.audio.play('cameraon'); }
      const g = ui.game;
      if (!g.flags.photoHelp) { g.flags.photoHelp = true; this.say('Фотоаппарат. Время стоит, камера летает в ' + PHOTO.reach + ' м от Тёмы. Газета «Автозаводец» платит ' + N.money(PHOTO.fee) + ' за каждый вид района — список видов в меню паузы, вкладка «Фотоальбом».', 10); }
      this.build();
      return true;
    }

    close() {
      if (!this.on) return;
      this.on = false;
      this.keys.clear();
      this.drag = null;
      if (this.el) { this.el.remove(); this.el = null; }
      const ui = this.ui;
      ui.acc = 0;
      ui.camPos = null;
      if (ui.keys) ui.keys.clear();
      if (ui.pressed) ui.pressed.clear();
      if (ui.audio && ui.audio.on) ui.audio.hush(false);
      if (ui.el && ui.el.focus) ui.el.focus({ preventScroll: true });
    }

    release() { this.keys.clear(); this.drag = null; }

    say(text, t) { this.note = { text, t: t || 4 }; }

    savePrefs() {
      const s = this.ui.settings;
      if (!s) return;
      s.photo = Object.assign({}, this.prefs);
      N.saveSettings(s);
    }

    basis() { return N.photoBasis(this.c.yaw, this.c.pitch, this.c.roll); }

    fov() { return N.lensFov(LENSES[this.lens]); }

    dims() {
      const cv = this.ui.renderer && this.ui.renderer.canvas;
      return cv && cv.width && cv.height ? [cv.width, cv.height] : [1000 * 4 / 3, 1000];
    }

    area() {
      const el = this.el, root = this.ui.el;
      if (!el || this.hidden || !root || !root.getBoundingClientRect) return FULL;
      const r = el.getBoundingClientRect(), u = root.getBoundingClientRect();
      if (!u.width || !r.width) return FULL;
      const x1 = (r.left - u.left - 10) / u.width;
      return x1 > 0.45 && x1 < 1 ? { x0: 0, y0: 0, x1, y1: 1 } : FULL;
    }

    crop(W, H) { return N.photoCrop(W, H, this.prefs.aspect, this.prefs.frame, this.free || FULL); }

    view(W, H) { return N.photoView(W, H, this.crop(W, H), LENSES[this.lens]); }

    camera() {
      const c = this.c, B = this.basis(), [W, H] = this.dims(), V = this.view(W, H);
      return { x: c.x, y: c.y, z: c.z, tx: c.x + B.f[0] * 10, ty: c.y + B.f[1] * 10, tz: c.z + B.f[2] * 10, fov: V.fov, shift: [V.sx, V.sy], up: B.u, photo: true, hidePlayer: !this.prefs.tyoma };
    }

    film() { return byId(FILMS, this.prefs.film); }

    focusDist() { return this.prefs.focus > 0 ? this.prefs.focus : this.af; }

    params(W, H) {
      const V = this.view(W, H), P = this.prefs, stop = STOPS[P.stop], k = N.photoCoc(LENSES[this.lens], stop, this.focusDist(), V.short), s = V.short / 1000;
      const dof = P.stop < STOPS.length - 1 ? { k, focus: this.focusDist(), max: Math.max(3, 15 * s), step: Math.max(0.7, 1.1 * s) } : null;
      const c = this.c;
      const flash = P.flash ? { x: c.x, y: c.y + 0.1, z: c.z, r: 22, c: [2.7, 2.65, 2.5] } : null;
      return { dof, ev: Math.pow(2, this.ev / 3), film: this.film(), flash };
    }

    floorAt(x, z, y) {
      const ui = this.ui, city = ui.city, w = ui.game.world;
      if (city.inside(x)) return city.inMetro(x, z) && w.metro ? w.metro.floorY(x, z, y) : 0;
      let f = city.groundY(x, z);
      if (city.ground(x, z) === N.GT.WATER) { const wa = city.waterAt(x, z); if (wa) f = Math.max(f, wa.level); }
      const roof = city.roofAt(x, z);
      if (roof > 0 && y > roof - 0.6) f = Math.max(f, roof);
      return f;
    }

    moveTo(x, y, z) {
      const ui = this.ui, c = this.c, city = ui.city, w = ui.game.world;
      let dx = x - c.x, dy = y - c.y, dz = z - c.z;
      const L = Math.hypot(dx, dy, dz);
      if (L < 1e-5) return;
      const h = N.Phys.rayStatic(city, c.x, c.y, c.z, dx / L, dy / L, dz / L, L + 0.35, w, false);
      if (h && !h.it.ground && h.t > 0.04) { const t = Math.max(0, h.t - 0.35) / L; dx *= t; dy *= t; dz *= t; }
      let nx = c.x + dx, ny = c.y + dy, nz = c.z + dz;
      const A = this.anchor, ax = nx - A.x, ay = ny - A.y, az = nz - A.z, d = Math.hypot(ax, ay, az);
      if (d > this.reach) { const k = this.reach / d; nx = A.x + ax * k; ny = A.y + ay * k; nz = A.z + az * k; this.edgeT = 1.4; }
      const fl = this.floorAt(nx, nz, ny) + 0.3;
      if (ny < fl) ny = fl;
      c.x = nx; c.y = ny; c.z = nz;
    }

    look(dx, dy) {
      const s = (this.ui.settings && this.ui.settings.sens) || 1, k = 0.0042 * s * this.fov() / 1.05, inv = this.ui.settings && this.ui.settings.invert ? -1 : 1;
      this.c.yaw = N.wrap(this.c.yaw + dx * k);
      this.c.pitch = N.clamp(this.c.pitch - dy * k * inv, -1.45, 1.45);
    }

    rayAt(sx, sy) {
      const B = this.basis(), [W, H] = this.dims(), V = this.view(W, H);
      const px = (sx * 2 - 1 - V.sx) * V.tanV * W / H, py = (1 - sy * 2 - V.sy) * V.tanV;
      const d = [B.f[0] + B.r[0] * px + B.u[0] * py, B.f[1] + B.r[1] * px + B.u[1] * py, B.f[2] + B.r[2] * px + B.u[2] * py];
      const L = Math.hypot(d[0], d[1], d[2]);
      return [d[0] / L, d[1] / L, d[2] / L];
    }

    cropN() {
      const [W, H] = this.dims(), r = this.crop(W, H);
      return { x0: r.x / W, y0: r.y / H, x1: (r.x + r.w) / W, y1: (r.y + r.h) / H };
    }

    centerDist() {
      const ui = this.ui, w = ui.game.world, c = this.c, cr = this.cropN();
      const d = this.rayAt((cr.x0 + cr.x1) / 2, (cr.y0 + cr.y1) / 2), pl = w.player;
      const h = w.raycast(c.x, c.y, c.z, d[0], d[1], d[2], 1000, this.prefs.tyoma || pl.veh ? null : pl);
      return h ? Math.max(0.4, h.t) : 1000;
    }

    seen() {
      const ui = this.ui, c = this.c, B = this.basis(), [W, H] = this.dims(), V = this.view(W, H);
      const cam = { x: c.x, y: c.y, z: c.z, f: B.f, r: B.r, u: B.u, tanV: V.tanV, asp: W / H, sx: V.sx, sy: V.sy };
      return N.photoSeen(ui.city, ui.game.world, cam, this.cropN());
    }

    step(dt) {
      if (!this.on) return;
      this.free = this.area();
      const K = this.keys, c = this.c, B = this.basis();
      const has = (...ks) => ks.some(k => K.has(k));
      const fw = (has('KeyW') ? 1 : 0) - (has('KeyS') ? 1 : 0), st = (has('KeyD') ? 1 : 0) - (has('KeyA') ? 1 : 0), up = (has('Space') ? 1 : 0) - (has('AltLeft', 'AltRight') ? 1 : 0);
      if (fw || st || up) {
        const rl = Math.hypot(B.r[0], B.r[2]) || 1;
        let mx = B.f[0] * fw + B.r[0] / rl * st, my = B.f[1] * fw + up, mz = B.f[2] * fw + B.r[2] / rl * st;
        const L = Math.hypot(mx, my, mz) || 1, sp = PHOTO.speed * (has('ShiftLeft', 'ShiftRight') ? PHOTO.fast : 1) * dt / Math.max(1, L);
        this.moveTo(c.x + mx * sp, c.y + my * sp, c.z + mz * sp);
      }
      const roll = (has('KeyE') ? 1 : 0) - (has('KeyQ') ? 1 : 0);
      if (roll) c.roll = N.clamp(c.roll + roll * 0.6 * dt, -0.524, 0.524);
      const lx = (has('KeyL') ? 1 : 0) - (has('KeyJ') ? 1 : 0), ly = (has('KeyK') ? 1 : 0) - (has('KeyI') ? 1 : 0);
      if (lx || ly) this.look(lx * 260 * dt, ly * 260 * dt);
      if (this.prefs.focus === 0) {
        const t = this.centerDist(), a = Math.log(Math.max(0.3, this.af)), b = Math.log(t);
        this.af = Math.exp(a + (b - a) * Math.min(1, dt * 7));
      }
      this.panelT = (this.panelT || 0) - dt;
      if (this.panelT <= 0) { this.panelT = 0.12; this.refresh(); }
      this.flashK = Math.max(0, this.flashK - dt * 3.2);
      if (this.toast) { this.toast.t -= dt; if (this.toast.t <= 0) this.toast = null; }
      if (this.note) { this.note.t -= dt; if (this.note.t <= 0) this.note = null; }
      this.edgeT = Math.max(0, this.edgeT - dt);
      if (this.del && (this.del.t -= dt) <= 0) this.del = null;
    }

    adjust(key, d) {
      const P = this.prefs;
      switch (key) {
        case 'lens': this.lens = N.clamp(this.lens + d, 0, LENSES.length - 1); break;
        case 'roll': this.c.roll = N.clamp((Math.round(this.c.roll * 180 / Math.PI) + d) * Math.PI / 180, -0.524, 0.524); break;
        case 'stop': P.stop = N.clamp(P.stop + d, 0, STOPS.length - 1); break;
        case 'focus': {
          const near = v => FOCUS.reduce((a, x, j) => (Math.abs(Math.log(x / v)) < Math.abs(Math.log(FOCUS[a] / v)) ? j : a), 0);
          const i = N.clamp(P.focus > 0 ? near(P.focus) + 1 + d : d > 0 ? near(this.af) + 1 : 0, 0, FOCUS.length);
          P.focus = i === 0 ? 0 : FOCUS[i - 1];
          break;
        }
        case 'ev': this.ev = N.clamp(this.ev + d, -6, 6); break;
        case 'flash': P.flash = !P.flash; break;
        case 'film': P.film = cycle(FILMS, P.film, d); break;
        case 'aspect': P.aspect = cycle(ASPECTS, P.aspect, d); break;
        case 'frame': P.frame = cycle(FRAMES, P.frame, d); break;
        case 'date': P.date = !P.date; break;
        case 'grid': P.grid = cycle(GRIDS, P.grid, d); break;
        case 'tyoma': P.tyoma = !P.tyoma; break;
      }
      if (key !== 'lens' && key !== 'roll' && key !== 'ev') this.savePrefs();
      this.click();
      this.refresh();
    }

    value(key) {
      const P = this.prefs;
      switch (key) {
        case 'lens': return LENSES[this.lens] + ' мм';
        case 'roll': return Math.round(this.c.roll * 180 / Math.PI) + '°';
        case 'stop': return 'f/' + String(STOPS[P.stop]).replace('.', ',') + (P.stop === STOPS.length - 1 ? ', всё резко' : '');
        case 'focus': return P.focus > 0 ? fmtM(P.focus) : 'авто · ' + fmtM(this.af);
        case 'ev': return (this.ev > 0 ? '+' : this.ev < 0 ? '−' : '') + String(Math.round(Math.abs(this.ev) / 3 * 10) / 10).replace('.', ',') + ' EV';
        case 'flash': return P.flash ? 'вкл' : 'выкл';
        case 'film': return this.film().name;
        case 'aspect': return byId(ASPECTS, P.aspect).name;
        case 'frame': return byId(FRAMES, P.frame).name;
        case 'date': return P.date ? N.photoStamp(this.day(), this.clock(), !!this.film().vhs)[0] : 'нет';
        case 'grid': return byId(GRIDS, P.grid).name;
        case 'tyoma': return P.tyoma ? 'да' : 'скрыт';
      }
      return '';
    }

    day() { return (this.ui.game.state && this.ui.game.state.day) || 0; }

    clock() { return this.ui.game.world.clock; }

    click() { const A = this.ui.audio; if (A && A.on) A.play('pclick'); }

    deny(text) {
      this.say(text, 5);
      const A = this.ui.audio;
      if (A && A.on) A.play('pdeny');
    }

    key(e, down) {
      const k = e.code;
      if (e.preventDefault && (k.startsWith('Key') || k.startsWith('Arrow') || k.startsWith('Alt') || k.startsWith('Shift') || k.startsWith('Digit') || ['Space', 'Tab', 'Enter', 'NumpadEnter', 'Escape', 'F8', 'Equal', 'Minus', 'NumpadAdd', 'NumpadSubtract', 'Backspace'].includes(k))) e.preventDefault();
      if (!down) { this.keys.delete(k); return; }
      const rep = !!e.repeat;
      if (!rep) this.keys.add(k);
      const rows = ROWS.length;
      switch (k) {
        case 'Escape': case 'F8': case 'Backspace': if (!rep) this.close(); break;
        case 'Enter': case 'NumpadEnter': if (!rep) this.shoot(); break;
        case 'KeyH': if (!rep) { this.hidden = !this.hidden; if (this.el) this.el.classList.toggle('nn-hidden', this.hidden); this.free = this.area(); } break;
        case 'KeyR': if (!rep) { this.act('reset'); this.click(); } break;
        case 'KeyF': if (!rep) { this.prefs.focus = Math.min(1000, Math.round(this.centerDist() * 10) / 10); this.af = this.prefs.focus; this.click(); this.refresh(); } break;
        case 'ArrowUp': this.row = (this.row + rows - 1) % rows; this.click(); this.refresh(); break;
        case 'ArrowDown': this.row = (this.row + 1) % rows; this.click(); this.refresh(); break;
        case 'ArrowLeft': this.adjust(ROWS[this.row][1], -1); break;
        case 'ArrowRight': this.adjust(ROWS[this.row][1], 1); break;
        case 'Equal': case 'NumpadAdd': this.adjust('lens', 1); break;
        case 'Minus': case 'NumpadSubtract': this.adjust('lens', -1); break;
      }
    }

    mouse(e, down) {
      if (down) {
        if (e.button === 0 || e.button === 2) this.drag = { x: e.clientX, y: e.clientY };
      } else this.drag = null;
    }

    move(e) {
      if (!this.drag) return;
      const dx = e.clientX - this.drag.x, dy = e.clientY - this.drag.y;
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.look(dx, dy);
    }

    wheel(s) { if (s) this.adjust('lens', -s); }

    caption() {
      const ui = this.ui, pl = ui.game.world.player, D = N.photoDay(this.day());
      return ui.city.zoneAt(pl.x, pl.z) + ', ' + MONTHS_IN[D.m - 1] + ' ' + D.y;
    }

    printOpts(n) {
      const film = this.film();
      return { frame: this.prefs.frame, date: this.prefs.date, day: this.day(), clock: this.clock(), vhs: !!film.vhs, edge: film.edge, n, caption: this.caption() };
    }

    capture() {
      const ui = this.ui, R = ui.renderer, cv = R && R.canvas;
      if (!cv || typeof document === 'undefined' || !ui.render) return null;
      const P = this.prefs, W0 = cv.width, H0 = cv.height;
      const cr = this.crop(W0, H0), a = cr.w / cr.h, F = byId(FRAMES, P.frame).b;
      const outW = a >= 1 ? PHOTO.out : Math.round(PHOTO.out * a), outH = Math.round(outW / a);
      const gl = R.gl, maxS = Math.min(4096, (gl && gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)) || 4096);
      const k = N.clamp(outW / cr.w, 1, Math.min(2.5, maxS / W0, maxS / H0));
      const big = k > 1.02;
      if (big) R.resize(Math.round(W0 * k), Math.round(H0 * k));
      ui.render(0);
      const out = document.createElement('canvas');
      out.width = Math.round(outW * (1 + F[0] + F[2]));
      out.height = Math.round(outW * (1 / a + F[1] + F[3]));
      const g = out.getContext('2d');
      const rect = { x: Math.round(F[0] * outW), y: Math.round(F[1] * outW), w: outW, h: outH, fx: 0, fy: 0, fw: out.width, fh: out.height };
      g.fillStyle = '#000';
      g.fillRect(rect.x, rect.y, rect.w, rect.h);
      const sx = cv.width / W0, sy = cv.height / H0;
      try { g.drawImage(cv, cr.x * sx, cr.y * sy, cr.w * sx, cr.h * sy, rect.x, rect.y, rect.w, rect.h); } catch (e) { }
      if (big) { R.resize(W0, H0); ui.render(0); }
      const n = N.PhotoAlbum.files().reduce((m, f) => Math.max(m, numOf(f)), 0) + 1;
      N.photoPrint(g, rect, this.printOpts(n));
      return { canvas: out, url: out.toDataURL('image/jpeg', PHOTO.quality) };
    }

    shoot() {
      const ui = this.ui, g = ui.game, w = g.world, pl = w.player;
      if (N.PhotoAlbum.count() >= PHOTO.roll) { this.deny('Плёнка кончилась: ' + PHOTO.roll + ' кадра из ' + PHOTO.roll + '. Лишние снимки удаляются в «Фотоальбоме» (Esc → Пауза).'); return null; }
      const ids = this.seen();
      const shot = this.capture();
      if (!shot) { this.deny('Не получилось снять.'); return null; }
      const film = this.film();
      const meta = { zone: ui.city.zoneAt(pl.x, pl.z), clock: Math.floor(this.clock()), day: this.day(), wx: w.wx.name, lens: LENSES[this.lens], stop: STOPS[this.prefs.stop], film: film.name, views: ids };
      const res = N.PhotoAlbum.save(shot.url, meta);
      if (!res.ok) { this.deny(res.err); return null; }
      this.flashK = 1;
      const A = ui.audio;
      if (A && A.on) A.play('shutter');
      const fresh = g.photoTaken ? g.photoTaken(ids) : [];
      const name = id => (VIEWS.find(v => v.id === id) || { name: id }).name;
      const lines = ['Кадр ' + res.n + ' — ' + (res.kept ? PHOTO.shown + '\\' + res.file : 'хранится до конца сеанса')];
      if (fresh.length) lines.push('«Автозаводец» берёт: ' + fresh.map(name).join(', ') + ' (+' + N.money(PHOTO.fee * fresh.length) + ')');
      else if (ids.length) lines.push('В кадре: ' + ids.map(name).join(', ') + ' — уже в газете');
      this.toast = { img: shot.canvas, lines, t: 4.5 };
      this.count = res.count;
      this.refresh();
      return { file: res.file, ids, fresh };
    }

    build() {
      if (typeof document === 'undefined' || !this.ui.el || !this.ui.el.appendChild) return;
      const el = document.createElement('div');
      el.className = 'nn-photo';
      this.ui.el.appendChild(el);
      this.el = el;
      el.addEventListener('mousedown', e => {
        e.stopPropagation();
        e.preventDefault();
        if (e.button !== 0) return;
        this.ui.el.focus({ preventScroll: true });
        const a = e.target.closest && e.target.closest('[data-a]');
        if (a) { this.act(a.dataset.a); return; }
        const row = e.target.closest && e.target.closest('[data-r]');
        if (!row) return;
        this.row = +row.dataset.r;
        const d = e.target.closest('[data-d]');
        if (d) this.adjust(ROWS[this.row][1], +d.dataset.d);
        else this.refresh();
      });
      el.addEventListener('wheel', e => {
        e.stopPropagation();
        e.preventDefault();
        const row = e.target.closest && e.target.closest('[data-r]');
        if (row) { this.row = +row.dataset.r; this.adjust(ROWS[this.row][1], e.deltaY < 0 ? 1 : -1); }
      }, { passive: false });
      this.renderPanel();
      this.free = this.area();
    }

    act(a) {
      if (a === 'shoot') this.shoot();
      else if (a === 'hide') { this.hidden = true; if (this.el) this.el.classList.add('nn-hidden'); this.free = this.area(); }
      else if (a === 'reset') { Object.assign(this.c, this.home); this.lens = this.home.lens; this.refresh(); }
      else if (a === 'album') { this.close(); this.ui.pause('album'); }
      else if (a === 'exit') this.close();
    }

    left() { return PHOTO.roll - (this.count || 0); }

    rollText() { const n = this.left(); return n > 0 ? 'осталось кадров: ' + n + ' из ' + PHOTO.roll : 'плёнка кончилась'; }

    renderPanel() {
      if (!this.el) return;
      let html = `<div class="nn-ph-head"><b>ФОТОАППАРАТ</b><span class="nn-ph-roll">${esc(this.rollText())}</span></div><div class="nn-ph-body">`;
      ROWS.forEach(([group, key, label], i) => {
        if (group) html += `<div class="nn-ph-group">${esc(group)}</div>`;
        html += `<div class="nn-ph-row${i === this.row ? ' sel' : ''}" data-r="${i}"><span>${esc(label)}</span><b><i data-d="-1">◄</i><em>${esc(this.value(key))}</em><i data-d="1">►</i></b></div>`;
      });
      html += `</div><div class="nn-ph-acts"><button type="button" class="nn-ph-shoot" data-a="shoot">СНЯТЬ <small>Enter</small></button><button type="button" data-a="hide">Скрыть <small>H</small></button><button type="button" data-a="reset">Сброс <small>R</small></button><button type="button" data-a="album">Альбом</button><button type="button" data-a="exit">Выйти <small>Esc</small></button></div>`;
      this.el.innerHTML = html;
      this.refresh();
    }

    refresh() {
      if (!this.el) return;
      this.el.querySelectorAll('.nn-ph-row').forEach(n => {
        const i = +n.dataset.r, em = n.querySelector('em'), v = this.value(ROWS[i][1]);
        n.classList.toggle('sel', i === this.row);
        if (em.textContent !== v) em.textContent = v;
      });
      const r = this.el.querySelector('.nn-ph-roll'), t = this.rollText();
      if (r && r.textContent !== t) r.textContent = t;
      const b = this.el.querySelector('.nn-ph-shoot');
      if (b) b.classList.toggle('dim', this.left() <= 0);
    }

    draw(g, W, H) {
      g.clearRect(0, 0, W, H);
      if (!this.on) return;
      const S = Math.max(0.6, Math.min(W / 1280, H / 720) * 1.05), P = this.prefs;
      const R = this.crop(W, H), mx = W * ((this.free || FULL).x0 + (this.free || FULL).x1) / 2;
      g.fillStyle = 'rgba(6,4,14,0.78)';
      g.fillRect(0, 0, W, R.fy);
      g.fillRect(0, R.fy + R.fh, W, H - R.fy - R.fh);
      g.fillRect(0, R.fy, R.fx, R.fh);
      g.fillRect(R.fx + R.fw, R.fy, W - R.fx - R.fw, R.fh);
      N.photoPrint(g, R, this.printOpts((this.count || 0) + 1));
      if (!this.hidden) {
        g.save();
        g.strokeStyle = 'rgba(255,255,255,0.38)';
        g.lineWidth = Math.max(1, S);
        g.beginPath();
        if (P.grid === 'thirds') for (let i = 1; i < 3; i++) { g.moveTo(R.x + R.w * i / 3, R.y); g.lineTo(R.x + R.w * i / 3, R.y + R.h); g.moveTo(R.x, R.y + R.h * i / 3); g.lineTo(R.x + R.w, R.y + R.h * i / 3); }
        else if (P.grid === 'level') {
          const cx = R.x + R.w / 2, cy = R.y + R.h / 2, a = -this.c.roll, L = R.w * 0.45;
          g.moveTo(cx - Math.cos(a) * L, cy - Math.sin(a) * L); g.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L);
          g.moveTo(R.x, cy); g.lineTo(R.x + R.w * 0.04, cy); g.moveTo(R.x + R.w * 0.96, cy); g.lineTo(R.x + R.w, cy);
        }
        g.stroke();
        const cx = R.x + R.w / 2, cy = R.y + R.h / 2, b = 15 * S, m = 6 * S, man = P.focus > 0;
        g.strokeStyle = man ? '#7ae07a' : '#ffffff';
        g.lineWidth = 2 * S;
        g.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.moveTo(cx + sx * b, cy + sy * (b - m)); g.lineTo(cx + sx * b, cy + sy * b); g.lineTo(cx + sx * (b - m), cy + sy * b); }
        g.stroke();
        g.font = 'bold ' + Math.round(11 * S) + 'px Arial';
        g.textAlign = 'center';
        g.textBaseline = 'top';
        g.fillStyle = man ? '#7ae07a' : '#ffffff';
        g.shadowColor = '#000';
        g.shadowOffsetX = g.shadowOffsetY = 1;
        g.fillText((man ? 'фокус ' : 'АФ ') + fmtM(this.focusDist()), cx, cy + b + 4 * S);
        g.restore();
        this.textBox(g, HINT, mx, H - 8 * S, S, 'bottom', 'rgba(255,255,255,0.85)', 11, 1, mx * 2 - 24 * S);
        if (this.edgeT > 0) this.textBox(g, 'Дальше от Тёмы не отойти: ' + this.reach + ' м', mx, H - 52 * S, S, 'bottom', '#ffd23a', 13, Math.min(1, this.edgeT * 2));
      }
      if (this.note) this.textBox(g, this.note.text, mx, 14 * S, S, 'top', '#ffffff', 14, Math.min(1, this.note.t * 2), Math.min(mx * 1.6, 640 * S));
      if (this.toast) {
        const T = this.toast, a = Math.min(1, T.t * 2), tw = 150 * S, th = T.img ? tw * T.img.height / T.img.width : 0;
        const x = 14 * S, y = H - 60 * S - th - T.lines.length * 18 * S;
        g.save();
        g.globalAlpha = a;
        g.fillStyle = 'rgba(8,6,22,0.88)';
        const bw = Math.min(W * 0.6, 470 * S);
        g.fillRect(x - 6 * S, y - 6 * S, bw, th + 12 * S + T.lines.length * 18 * S + 4 * S);
        g.strokeStyle = '#f2c83a';
        g.lineWidth = 2;
        g.strokeRect(x - 6 * S, y - 6 * S, bw, th + 12 * S + T.lines.length * 18 * S + 4 * S);
        if (T.img) g.drawImage(T.img, x, y, tw, th);
        g.font = 'bold ' + Math.round(13 * S) + 'px Arial';
        g.textAlign = 'left';
        g.textBaseline = 'top';
        T.lines.forEach((l, i) => { g.fillStyle = i ? '#7ae0ff' : '#ffd23a'; g.fillText(l, x, y + th + 8 * S + i * 18 * S, bw - 14 * S); });
        g.restore();
      }
      if (this.flashK > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, this.flashK) * 0.85})`; g.fillRect(0, 0, W, H); }
    }

    textBox(g, text, x, y, S, base, col, size, alpha, maxW) {
      g.save();
      g.globalAlpha = alpha === undefined ? 1 : alpha;
      g.font = 'bold ' + Math.round(size * S) + 'px Arial';
      const lines = [];
      const words = String(text).split(' '), lim = maxW || Infinity;
      let cur = '';
      for (const wd of words) { const t = cur ? cur + ' ' + wd : wd; if (g.measureText(t).width > lim && cur) { lines.push(cur); cur = wd; } else cur = t; }
      if (cur) lines.push(cur);
      const lh = size * S * 1.3, w = Math.max(...lines.map(l => g.measureText(l).width)) + 16 * S, h = lines.length * lh + 8 * S;
      const y0 = base === 'bottom' ? y - h : y;
      g.fillStyle = 'rgba(0,0,0,0.6)';
      g.fillRect(x - w / 2, y0, w, h);
      g.fillStyle = col;
      g.textAlign = 'center';
      g.textBaseline = 'top';
      lines.forEach((l, i) => g.fillText(l, x, y0 + 4 * S + i * lh));
      g.restore();
    }
  }

  N.Photo = Photo;
  Photo.ROWS = ROWS;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
