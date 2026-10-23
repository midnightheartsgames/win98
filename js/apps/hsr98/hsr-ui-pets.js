(function (H) {
  'use strict';
  const G = H.Gfx;
  const { W, HGT, C } = H.UI_CONST;

  const PS = 18;
  const FS = 13;
  const SHUT = '#2a1c24';
  const STAGE = { x: 166, y: 70, w: 458, h: 180 };
  const PANEL = { y: 258, h: 190 };
  const DEMO = [[0, 'in'], [3.2, 'sit'], [5, 'groom'], [7.4, 'sneeze'], [8.8, 'love'], [10.6, 'sleep'], [14.6, 'out'], [16.4, null]];
  const fmt = H.fmt;
  const stageCache = {};

  const mirror = pts => pts.map((v, i) => (i % 2 ? v : PS - v));

  function frontHead(p, L, cx, cy, face) {
    p.poly(L.fur, [cx - 5, cy - 1, cx - 4.4, cy - 7, cx - 1.2, cy - 3.6]);
    p.poly(L.fur, [cx + 5, cy - 1, cx + 4.4, cy - 7, cx + 1.2, cy - 3.6]);
    p.poly(L.ear, [cx - 4, cy - 2.6, cx - 3.9, cy - 5.6, cx - 2.2, cy - 3.6]);
    p.poly(L.ear, [cx + 4, cy - 2.6, cx + 3.9, cy - 5.6, cx + 2.2, cy - 3.6]);
    p.ell(L.fur, cx, cy + 0.4, 4.9, 4);
    p.ell(L.shade, cx, cy + 3.6, 3.4, 0.9);
    p.snap(L.mark, cx + 1, cy - 4, 1, 3);
    p.snap(L.mark, cx, cy - 3, 3, 1);
    if (face === 'open') { p.ell(L.eye, cx - 2.1, cy + 0.4, 1, 1.3); p.ell(L.eye, cx + 2.1, cy + 0.4, 1, 1.3); }
    else if (face === 'squint') { p.snap(SHUT, cx - 3, cy, 2, 1); p.snap(SHUT, cx + 1, cy, 2, 1); p.snap(SHUT, cx - 2, cy + 1, 1, 1); p.snap(SHUT, cx + 2, cy + 1, 1, 1); }
    else { p.snap(SHUT, cx - 3, cy + 1, 2, 1); p.snap(SHUT, cx + 1, cy + 1, 2, 1); }
    if (face === 'yawn') { p.ell(SHUT, cx, cy + 2.6, 1.3, 1.4); p.snap(L.nose, cx - 1, cy + 3, 1, 1); }
    else p.snap(L.nose, cx - 1, cy + 2, 1, 1);
  }

  function frontWings(p, L, lift) {
    const w = [6.2, 10.6 - lift, 2.2, 8 - lift * 2, 2.8, 9.6 - lift, 1.6, 10.8 - lift, 3.4, 11.2 - lift / 2, 3, 12.4, 6.4, 12.4];
    p.poly(L.wing, w); p.poly(L.wing, mirror(w));
    p.poly(L.wingHi, [6.2, 10.8 - lift, 2.8, 8.6 - lift * 2, 3.4, 9.8 - lift, 6.2, 11.6]);
    p.poly(L.wingHi, mirror([6.2, 10.8 - lift, 2.8, 8.6 - lift * 2, 3.4, 9.8 - lift, 6.2, 11.6]));
  }

  function front(p, L, pose, f) {
    const sit = pose !== 'walk';
    p.poly(L.fur, [12, 14.6, 14.8, 14, 16, 11.2, 15.6, 8.2, 14.4, 8.4, 14.8, 11, 14, 12.8, 11.8, 13]);
    frontWings(p, L, pose === 'walk' && f ? 0.8 : 0);
    if (sit) {
      p.ell(L.fur, 9, 12.4, 3.8, 3.6);
      p.ell(L.shade, 5.8, 14.6, 1.8, 1.3); p.ell(L.shade, 12.2, 14.6, 1.8, 1.3);
      if (pose === 'groom') { p.rect(L.fur, 9.4, 13.4, 1.6, 2.8); p.ell(L.light, 7.4, 9.6, 1.3, 1.7); }
      else { p.rect(L.fur, 6.8, 13.4, 1.6, 2.8); p.rect(L.fur, 9.6, 13.4, 1.6, 2.8); p.rect(L.shade, 8.4, 14, 1.2, 2.2); }
    } else {
      const a = f ? 2.6 : 3.4, b = f ? 3.4 : 2.6;
      p.rect(L.shade, 5, 13.2, 1.4, f ? 3 : 2.4); p.rect(L.shade, 11.6, 13.2, 1.4, f ? 2.4 : 3);
      p.ell(L.fur, 9, 12, 3.8, 2.8);
      p.rect(L.fur, 6.8, 13, 1.6, a); p.rect(L.fur, 9.6, 13, 1.6, b);
    }
    const face = pose === 'groom' || pose === 'happy' ? 'shut' : pose === 'yawn' ? 'yawn' : pose === 'squint' ? 'squint' : 'open';
    frontHead(p, L, 9, sit ? 7 : 7 + (f ? 1 : 0), face);
    if (pose === 'groom') { p.ell(L.fur, 7.4, 9.8, 1.4, 1.8); p.snap(L.nose, 8, 9, 1, 1); }
  }

  function back(p, L, pose, f) {
    const sit = pose !== 'walk';
    if (sit) {
      p.ell(L.fur, 9, 12.4, 3.8, 3.6);
      p.ell(L.shade, 9, 15, 3.6, 1);
    } else {
      p.rect(L.shade, 6.6, 13, 1.6, f ? 3.4 : 2.6); p.rect(L.shade, 9.8, 13, 1.6, f ? 2.6 : 3.4);
      p.ell(L.fur, 9, 12, 3.8, 2.8);
    }
    const lift = !sit && f ? 0.8 : 0;
    const w = [7, 10.2 - lift, 2, 7 - lift * 2, 2.8, 9 - lift, 1.4, 10.4 - lift, 3.4, 11, 3.4, 12.4, 7, 12];
    p.poly(L.wing, w); p.poly(L.wing, mirror(w));
    p.poly(L.wingHi, [7, 10.6, 2.6, 7.8 - lift * 2, 3, 9.2, 7, 11.4]); p.poly(L.wingHi, mirror([7, 10.6, 2.6, 7.8 - lift * 2, 3, 9.2, 7, 11.4]));
    p.poly(L.dark, [8, 13.4, 10, 13.4, 10.8, 9, 12.4, 6.2, 11, 5, 9, 8.6]);
    p.poly(L.fur, [8.6, 13, 9.6, 13, 10.4, 9, 11.8, 6.2, 11.2, 5.8, 9.6, 8.8]);
    const cy = sit ? 6.8 : 7 + (f ? 1 : 0);
    p.poly(L.fur, [4, cy - 1, 4.6, cy - 7, 7.8, cy - 3.6]);
    p.poly(L.fur, [14, cy - 1, 13.4, cy - 7, 10.2, cy - 3.6]);
    p.poly(L.shade, [4.8, cy - 2.6, 4.9, cy - 5.6, 6.6, cy - 3.6]);
    p.poly(L.shade, [13.2, cy - 2.6, 13.1, cy - 5.6, 11.4, cy - 3.6]);
    p.ell(L.fur, 9, cy + 0.4, 4.9, 4);
    p.ell(L.shade, 9, cy + 2.4, 3.6, 1.4);
  }

  function sideHead(p, L, cx, cy, face) {
    p.poly(L.fur, [cx - 3.2, cy - 2, cx - 3, cy - 6, cx - 0.4, cy - 3.6]);
    p.poly(L.fur, [cx + 0.2, cy - 3.2, cx + 1.8, cy - 6.2, cx + 3, cy - 2.6]);
    p.poly(L.ear, [cx + 0.9, cy - 3.4, cx + 1.8, cy - 5, cx + 2.4, cy - 3.2]);
    p.ell(L.fur, cx, cy, 4.2, 3.8);
    p.ell(L.fur, cx - 3.2, cy + 1, 1.6, 1.6);
    p.ell(L.light, cx + 0.6, cy - 2.2, 1.6, 0.8);
    p.snap(L.mark, cx - 1, cy - 4, 1, 3);
    p.snap(L.mark, cx - 2, cy - 3, 3, 1);
    if (face === 'open') p.ell(L.eye, cx - 1.8, cy + 0.2, 0.9, 1.3);
    else if (face === 'angry') { p.ell(L.eye, cx - 1.8, cy + 0.4, 0.9, 0.7); p.snap(SHUT, cx - 3, cy - 1, 2, 1); }
    else p.snap(SHUT, cx - 3, cy + 1, 2, 1);
    if (face === 'angry') { p.ell(SHUT, cx - 3.6, cy + 2.2, 1.2, 1); p.snap('#f4f0ea', cx - 4, cy + 1, 1, 1); }
    p.snap(L.nose, Math.floor(cx - 4.6), cy, 1, 1);
  }

  function sideWing(p, L, mode) {
    if (mode === 'up') {
      p.poly(L.wing, [9.6, 9.4, 6.6, 2.2, 9.2, 3.8, 10.8, 1.4, 12.2, 4.2, 14.4, 3, 13, 9]);
      p.poly(L.wingHi, [9.8, 8.6, 7.6, 3.4, 9.4, 4.6, 10.8, 2.6, 11.6, 5, 12.4, 8.4]);
    } else if (mode === 'down') {
      p.poly(L.wing, [9.6, 10, 6, 15.4, 8.8, 14, 10.6, 16.4, 12, 14, 14.4, 15.2, 12.8, 10]);
    } else {
      p.poly(L.wing, [9.4, 10, 10.6, 6, 11.8, 7.6, 13.2, 6.8, 13, 8.8, 13.6, 9.8]);
      p.poly(L.wingHi, [10, 9.6, 10.8, 7, 11.6, 8.2, 12.6, 9.4]);
    }
  }

  function side(p, L, pose, f) {
    if (pose === 'sit') {
      p.poly(L.fur, [7, 16, 14.4, 16, 16, 15, 15.2, 14.4, 13.6, 15, 7, 15]);
      p.ell(L.fur, 11, 12.4, 3.4, 3.6);
      p.ell(L.shade, 12.6, 14.4, 2.6, 1.8);
      p.rect(L.fur, 8.2, 12.6, 1.6, 3.6);
      sideWing(p, L, 'fold');
      sideHead(p, L, 8.6, 7.4, 'open');
      return;
    }
    if (pose === 'hiss') {
      p.poly(L.fur, [13.4, 9.6, 15, 1.8, 16.6, 1.6, 16.4, 4, 15, 10]);
      for (const [x, h] of [[6.6, 4.4], [8.2, 4.2], [11.8, 4.4], [13.4, 4.2]]) p.rect(x === 8.2 || x === 13.4 ? L.shade : L.fur, x, 12, 1.6, h);
      p.ell(L.fur, 10.2, 10, 4.6, 3);
      for (let i = 0; i < 5; i++) p.poly(L.fur, [7 + i * 1.6, 7.6, 7.8 + i * 1.6, 5.8, 8.6 + i * 1.6, 7.6]);
      sideWing(p, L, 'up');
      sideHead(p, L, 6, 9.6, 'angry');
      return;
    }
    const fly = pose === 'fly', by = fly ? 10.4 : 11.6;
    p.poly(L.fur, [13, by + 0.2, 15.6, by - 1.2, 16.4, by - 4.6, 15.6, by - 6, 15, by - 5.2, 15.4, by - 2.2, 13.4, by - 1.2]);
    if (fly) { p.rect(L.shade, 12.2, by + 1.6, 2.4, 1.4); p.rect(L.fur, 7, by + 1.6, 2.4, 1.4); }
    else {
      const a = f ? 0 : 1.2, b = f ? 1.2 : 0;
      p.rect(L.shade, 7.6 + b, 12.6, 1.5, 3.4); p.rect(L.shade, 12.4 - b, 12.6, 1.5, 3.4);
      p.rect(L.fur, 6.6 + a, 12.8, 1.6, 3.2); p.rect(L.fur, 13.2 - a, 12.8, 1.6, 3.2);
    }
    if (fly && !f) sideWing(p, L, 'down');
    p.ell(L.fur, 10.4, by, 4.4, 2.8);
    sideWing(p, L, fly ? (f ? 'up' : 'fold') : 'fold');
    sideHead(p, L, 6, fly ? 6.8 : 7.6 + (f ? 0.6 : 0), 'open');
  }

  function curl(p, L) {
    p.ell(L.fur, 10, 12.8, 5.8, 3.4);
    p.ell(L.light, 11, 10.6, 3, 0.8);
    p.poly(L.wing, [9, 10.6, 12.6, 8.4, 12.4, 9.8, 14.4, 9.6, 13, 11.4, 10, 11.8]);
    p.poly(L.dark, [3.4, 16, 13.8, 16, 16.2, 14.6, 16, 13, 14.4, 14.4, 4, 14.6]);
    p.poly(L.fur, [3.8, 15.6, 13.6, 15.6, 15.6, 14.4, 15.4, 13.6, 14, 14.6, 4, 15]);
    p.poly(L.fur, [1.8, 12, 2.2, 7.6, 4.8, 10]);
    p.poly(L.fur, [5.2, 9.8, 7.4, 7.4, 8, 10.8]);
    p.poly(L.ear, [2.6, 11, 2.8, 8.8, 4, 10.2]);
    p.ell(L.fur, 5.2, 12.6, 3.8, 3);
    p.snap(L.mark, 5, 10, 1, 2);
    p.snap(L.mark, 4, 10, 3, 1);
    p.snap(SHUT, 2, 13, 2, 1);
    p.snap(SHUT, 6, 13, 2, 1);
  }

  function catArt(p, L, view, pose, f) {
    if (pose === 'sleep') return curl(p, L);
    if (view === 'front') return front(p, L, pose, f);
    if (view === 'back') return back(p, L, pose, f);
    return side(p, L, pose, f);
  }

  function petCanvas(id, view, pose, f) {
    return G.pixelArt('pet|' + id + '|' + view + '|' + pose + '|' + (f || 0), PS, PS, p => catArt(p, H.PETS[id].look, view, pose, f || 0));
  }

  function fieldCanvas(id, view, pose, f) {
    return G.pixelArt('petf|' + id + '|' + view + '|' + pose + '|' + (f || 0), FS, FS, (p, g) => catArt(G.pen(g, FS / PS, 0, 0), H.PETS[id].look, view, pose, f || 0));
  }

  const VIEW = { down: 'front', up: 'back', left: 'side', right: 'side' };
  const FRONT_POSE = { groom: 'groom', yawn: 'yawn', sneeze: 'squint', pet: 'happy', love: 'happy', wake: 'sit' };

  function petFrame(a, t) {
    const flip = a.dir === 'right';
    if (a.prog < 1) {
      if (a.fly) return { view: 'side', pose: 'fly', f: Math.floor(t * 10) % 2, flip: a.ox < a.x || (a.ox === a.x && flip), lift: 7 };
      return { view: VIEW[a.dir], pose: 'walk', f: a.prog < 0.5 ? 0 : 1, flip };
    }
    if (a.act === 'sleep') return { view: 'front', pose: 'sleep', f: 0, flip: false };
    if (a.act === 'hiss') return { view: 'side', pose: 'hiss', f: 0, flip };
    if (FRONT_POSE[a.act]) return { view: 'front', pose: FRONT_POSE[a.act], f: 0, flip: false };
    if (a.still < 0.5 && a.act !== 'look') return { view: VIEW[a.dir], pose: 'walk', f: 0, flip };
    return { view: VIEW[a.dir], pose: 'sit', f: 0, flip };
  }

  function blitPet(c, cv, x, y, scale, flip) {
    const was = c.imageSmoothingEnabled, s = cv.width * scale;
    c.imageSmoothingEnabled = false;
    if (flip) { c.save(); c.translate(Math.round(x + s / 2), 0); c.scale(-1, 1); c.drawImage(cv, -s / 2, Math.round(y), s, s); c.restore(); }
    else c.drawImage(cv, Math.round(x - s / 2), Math.round(y), s, s);
    c.imageSmoothingEnabled = was;
  }

  function heart(c, x, y, k, col) {
    c.fillStyle = col;
    c.fillRect(x, y + k, k * 2, k * 2); c.fillRect(x + k * 3, y + k, k * 2, k * 2);
    c.fillRect(x + k, y, k, k); c.fillRect(x + k * 3, y, k, k);
    c.fillRect(x + k, y + k * 3, k * 3, k); c.fillRect(x + k * 2, y + k * 4, k, k);
  }

  function flame(c, x, y, s, k) {
    const r = s * (0.4 + k);
    c.fillStyle = 'rgba(255,120,40,' + (0.85 - k * 0.5).toFixed(3) + ')';
    c.beginPath(); c.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,220,110,' + (0.95 - k * 0.6).toFixed(3) + ')';
    c.beginPath(); c.ellipse(x, y + r * 0.1, r * 0.7, r * 0.55, 0, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#ffd870' : '#ff8a3a'; c.fillRect(Math.round(x + Math.cos(i * 1.3 + k * 4) * r * 1.6), Math.round(y - r * 0.4 - k * s - i), Math.max(1, s / 6), Math.max(1, s / 6)); }
  }

  function petFx(c, a, cx, top, scale, t) {
    const s = scale / 2;
    if (a.act === 'sleep') {
      for (let i = 0; i < 3; i++) {
        const k = ((t * 0.5 + i / 3) % 1);
        c.globalAlpha = Math.max(0, 1 - k);
        c.fillStyle = '#e8e4ff'; c.font = 'bold ' + Math.round((8 + i * 2) * s) + 'px sans-serif';
        c.fillText('z', cx + (6 + k * 10 + i * 3) * s, top + (14 - k * 16) * s);
      }
      c.globalAlpha = 1;
    } else if (a.act === 'sneeze' && a.actT < 0.8 && a.actT > 0.15) flame(c, cx - s, top + 19 * s, 4.5 * s, (0.8 - a.actT) / 0.65);
    else if (a.act === 'pet' || a.act === 'love') {
      for (let i = 0; i < 2; i++) {
        const k = (t * 0.9 + i * 0.5) % 1;
        c.globalAlpha = Math.max(0, 1 - k);
        heart(c, Math.round(cx - 10 * s + i * 14 * s), Math.round(top + (4 - k * 12) * s), Math.max(1, Math.round(s)), '#ff7aa8');
      }
      c.globalAlpha = 1;
    } else if (a.act === 'hiss') {
      c.strokeStyle = 'rgba(255,240,200,0.9)'; c.lineWidth = 1;
      const d = a.dir === 'right' ? 1 : -1, x0 = cx + d * 14 * s, y0 = top + 18 * s;
      for (const [dx, dy] of [[1, -0.6], [1.2, 0], [1, 0.6]]) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + d * dx * 5 * s, y0 + dy * 5 * s); c.stroke(); }
    }
  }

  function mansion(g, w, h) {
    g.fillStyle = '#5a3a2a'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 14) { g.fillStyle = (x / 14) % 2 ? '#62402e' : '#563626'; g.fillRect(x, 0, 13, h * 0.7); g.fillStyle = '#3e281c'; g.fillRect(x + 13, 0, 1, h * 0.7); }
    g.fillStyle = '#7a5236'; g.fillRect(0, h * 0.42, w, 3); g.fillStyle = '#3a2418'; g.fillRect(0, h * 0.42 + 3, w, 1);
    const wx = 18, wy = 12, ww = 46, wh = 40;
    g.fillStyle = '#2a1a12'; g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
    const sky = g.createLinearGradient(0, wy, 0, wy + wh);
    sky.addColorStop(0, '#16183a'); sky.addColorStop(1, '#3a3a6a');
    g.fillStyle = sky; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(wx + 34, wy + 11, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#16183a'; g.beginPath(); g.arc(wx + 36, wy + 10, 4.4, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(240,240,255,0.8)'; g.fillRect(wx + Math.floor(G.hash(i, 1, 21) * ww), wy + Math.floor(G.hash(i, 2, 21) * wh * 0.8), 1, 1); }
    g.fillStyle = '#2a1a12'; g.fillRect(wx + ww / 2 - 1, wy, 2, wh); g.fillRect(wx, wy + wh / 2 - 1, ww, 2);
    g.fillStyle = '#a83a3a'; g.fillRect(wx - 8, wy - 5, 8, wh + 14); g.fillRect(wx + ww, wy - 5, 8, wh + 14);
    g.fillStyle = '#7a2828'; for (let y = wy - 4; y < wy + wh + 8; y += 4) { g.fillRect(wx - 6, y, 1, 3); g.fillRect(wx + ww + 3, y, 1, 3); }
    const fx = w - 84, fy = h * 0.3;
    g.fillStyle = '#8a8a92'; g.fillRect(fx, fy, 62, h * 0.7 - fy + 2);
    g.fillStyle = '#a8a8b2'; g.fillRect(fx - 4, fy - 5, 70, 6);
    for (let y = fy + 4; y < h * 0.7; y += 6) for (let x = fx + ((y / 6) % 2) * 5; x < fx + 62; x += 10) { g.fillStyle = '#6e6e78'; g.fillRect(x, y, 1, 6); }
    g.fillStyle = '#1a1210'; g.fillRect(fx + 12, fy + 14, 38, h * 0.7 - fy - 12);
    const fire = g.createRadialGradient(fx + 31, h * 0.66, 2, fx + 31, h * 0.66, 30);
    fire.addColorStop(0, 'rgba(255,220,120,0.95)'); fire.addColorStop(0.4, 'rgba(255,130,50,0.7)'); fire.addColorStop(1, 'rgba(255,90,30,0)');
    g.fillStyle = fire; g.fillRect(fx + 12, fy + 14, 38, h * 0.7 - fy - 12);
    for (const [dx, hh] of [[20, 14], [27, 20], [34, 16], [40, 11]]) { g.fillStyle = '#ff9a3a'; g.beginPath(); g.moveTo(fx + dx - 4, h * 0.7); g.lineTo(fx + dx, h * 0.7 - hh); g.lineTo(fx + dx + 4, h * 0.7); g.fill(); g.fillStyle = '#ffe080'; g.beginPath(); g.moveTo(fx + dx - 2, h * 0.7); g.lineTo(fx + dx, h * 0.7 - hh * 0.55); g.lineTo(fx + dx + 2, h * 0.7); g.fill(); }
    const glow = g.createRadialGradient(fx + 31, h * 0.7, 6, fx + 31, h * 0.7, 120);
    glow.addColorStop(0, 'rgba(255,170,80,0.32)'); glow.addColorStop(1, 'rgba(255,170,80,0)');
    g.fillStyle = glow; g.fillRect(0, 0, w, h);
    g.fillStyle = '#4a2e1e'; g.fillRect(0, h * 0.7, w, h * 0.3);
    for (let y = h * 0.7; y < h; y += 5) { g.fillStyle = '#3c2416'; g.fillRect(0, y, w, 1); }
    for (let y = h * 0.7 + 2; y < h; y += 10) for (let x = (y / 10) % 2 ? 0 : 22; x < w; x += 44) { g.fillStyle = '#3c2416'; g.fillRect(x, y, 1, 4); }
    g.fillStyle = '#7a2a3a'; g.beginPath(); g.ellipse(w * 0.42, h * 0.86, w * 0.26, h * 0.1, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#d8b050'; g.lineWidth = 1; g.beginPath(); g.ellipse(w * 0.42, h * 0.86, w * 0.23, h * 0.08, 0, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#4a2a3a'; g.fillRect(0, h * 0.5, 22, h * 0.24); g.fillStyle = '#5e3448'; g.fillRect(0, h * 0.5, 26, 8);
  }

  function stageArt(id) {
    if (stageCache[id]) return stageCache[id];
    const w = STAGE.w / 2, h = STAGE.h / 2, cv = G.mkCanvas(w, h);
    mansion(cv.getContext('2d'), w, h);
    stageCache[id] = cv;
    return cv;
  }

  function demoAt(t) {
    const T = DEMO[DEMO.length - 1][0], u = ((t % T) + T) % T;
    let i = 0;
    while (i < DEMO.length - 2 && u >= DEMO[i + 1][0]) i++;
    return { kind: DEMO[i][1], k: (u - DEMO[i][0]) / (DEMO[i + 1][0] - DEMO[i][0]), u };
  }

  Object.assign(H.UI.prototype, {
    drawPetField(c, a, x, y) {
      const fr = petFrame(a, this.t), cv = fieldCanvas(a.id, fr.view, fr.pose, fr.f), lift = fr.lift || 0;
      c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(x + 16, y + 29, lift ? 5 : 7, 2.2, 0, 0, Math.PI * 2); c.fill();
      const top = y + 31 - FS * 2 - lift - (lift ? Math.round(Math.sin(this.t * 10) * 1.5) : 0);
      blitPet(c, cv, x + 16, top, 2, fr.flip);
      petFx(c, a, x + 16, top, 2 * FS / PS, this.t);
    },

    drawPetSay(c, a, x, y) {
      if (!a.say) return;
      const w = this.measure(a.say, 10, true) + 12, bx = Math.round(x + 16 - w / 2), by = Math.round(y - 6);
      c.fillStyle = 'rgba(250,246,236,0.94)'; c.fillRect(bx, by, w, 15);
      c.strokeStyle = 'rgba(60,44,30,0.85)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, w - 1, 14);
      c.fillStyle = 'rgba(250,246,236,0.94)'; c.beginPath(); c.moveTo(x + 13, by + 15); c.lineTo(x + 19, by + 15); c.lineTo(x + 16, by + 19); c.fill();
      this.text(a.say, bx + w / 2, by + 2, { align: 'center', size: 10, bold: true, col: '#3a2a1e' });
    },

    petIcon(c, id, x, y, size) {
      const cv = petCanvas(id, 'front', 'sit', 0), was = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, 0, 0, PS, PS * 0.62, Math.round(x), Math.round(y), size, Math.round(size * 0.62));
      c.imageSmoothingEnabled = was;
    },

    drawPetStage(c, id, x, y, w, h) {
      const d = H.PETS[id], dm = demoAt(this.t), ground = y + h - 24, scale = 4, s = PS * scale;
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      c.imageSmoothingEnabled = false;
      c.drawImage(stageArt(id), x, y, w, h);
      const mid = x + w * 0.42;
      let cx = mid, view = 'front', pose = 'sit', f = 0, flip = false, lift = 0;
      const a = { act: null, actT: 1, dir: 'down' };
      if (dm.kind === 'in') { cx = x - 40 + (mid - x + 40) * dm.k; view = 'side'; pose = 'walk'; f = Math.floor(dm.u * 6) % 2; flip = true; }
      else if (dm.kind === 'sit') { view = dm.k < 0.4 ? 'side' : 'front'; flip = true; }
      else if (dm.kind === 'groom') pose = 'groom';
      else if (dm.kind === 'sneeze') { pose = 'squint'; a.act = 'sneeze'; a.actT = 1.1 - dm.k * 1.1; }
      else if (dm.kind === 'love') { pose = 'happy'; a.act = 'love'; }
      else if (dm.kind === 'sleep') { pose = 'sleep'; a.act = 'sleep'; }
      else if (dm.kind === 'out') { view = 'side'; pose = 'fly'; f = Math.floor(dm.u * 10) % 2; flip = true; lift = 10 + dm.k * 60; cx = mid + dm.k * (w * 0.7); }
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(cx, ground + 2, Math.max(8, 26 - lift / 3), 6, 0, 0, Math.PI * 2); c.fill();
      const top = ground + 6 - s - lift;
      blitPet(c, petCanvas(id, view, pose, f), cx, top, scale, flip);
      petFx(c, a, cx, top, scale, this.t);
      if (d.fire && dm.kind === 'sneeze' && dm.k > 0.2 && dm.k < 0.9) this.text('Апчхи!', cx + 50, top + 26, { size: 13, bold: true, col: '#ffd070' });
      c.restore();
      c.strokeStyle = C.brass; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2); c.lineWidth = 1;
    },

    drawPetSupply(c, scr) {
      const g = this.game, s = g.state, ids = Object.keys(H.PETS);
      if (scr.psel >= ids.length) scr.psel = ids.length - 1;
      const id = ids[scr.psel], d = H.PETS[id], own = g.ownsPet(id), out = g.petOut() === id;
      this.supplyPill(W - 154, 10, 'jade', s.jade);
      let tx = 170;
      ids.forEach((pid, i) => {
        const on = i === scr.psel, label = H.PETS[pid].name, w = Math.round(this.measure(label, 11, true) + 40);
        c.fillStyle = '#000'; c.fillRect(tx - 1, 39, w + 2, 24);
        c.fillStyle = on ? '#efe6cc' : 'rgba(16,20,52,0.9)'; c.fillRect(tx, 40, w, 22);
        this.petIcon(c, pid, tx + 4, 44, 26);
        this.text(label, tx + 32, 45, { size: 11, bold: true, col: on ? '#20140c' : C.cream, shadow: !on });
        this.hit(tx, 40, w, 22, () => this.petPick(scr, i));
        tx += w + 4;
      });
      if (ids.length > 1) this.keycap(tx + 4, 45, '←→');
      const { x, y, w, h } = STAGE;
      c.fillStyle = '#000'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
      this.drawPetStage(c, id, x, y, w, h);
      const plate = d.kind + (own ? (out ? ' · гуляет с отрядом' : ' · ждёт на Экспрессе') : '');
      c.fillStyle = 'rgba(30,20,40,0.72)'; c.fillRect(x + 8, y + 10, this.measure(d.name, 18, true, true) + 16, 26);
      this.text(d.name, x + 16, y + 14, { size: 18, bold: true, serif: true, col: '#fff8f0' });
      c.fillStyle = 'rgba(30,20,40,0.72)'; c.fillRect(x + 8, y + 38, this.measure(plate, 10) + 12, 15);
      this.text(plate, x + 14, y + 40, { size: 10, col: own ? '#9ae8a0' : '#ffcf80' });
      const lw = 248, py = PANEL.y, ph = PANEL.h;
      this.win(x, py, lw, ph, { alpha: 0.88 });
      let ty = py + 10;
      this.wrap(d.text, lw - 24, 10).slice(0, 8).forEach(l => { this.text(l, x + 12, ty, { size: 10, col: '#c8d0f0' }); ty += 12; });
      if (own) {
        const st = g.petStats(id);
        this.text('Пройдено вместе: ' + fmt(st.steps) + ' шаг.', x + 12, py + ph - 62, { size: 10, col: C.sub });
        this.text('Погладили: ' + fmt(st.pets) + ' раз', x + 12, py + ph - 49, { size: 10, col: C.sub });
      } else {
        this.text('Цена:', x + 12, py + ph - 58, { size: 11, col: C.sub });
        this.money(x + 50, py + ph - 57, 'jade', d.price, { col: s.jade >= d.price ? C.gold : C.bad });
      }
      const label = !own ? 'Купить' : out ? 'Оставить на Экспрессе' : 'Взять с собой';
      this.button(x + 10, py + ph - 34, lw - 20, 24, label, () => this.petAct(scr), { size: 11, bold: true, icon: own ? 'pet' : 'shop', active: true });
      const rx = x + lw + 8, rw = w - lw - 8;
      this.win(rx, py, rw, ph, { alpha: 0.88 });
      this.text('Привычки', rx + 12, py + 9, { size: 12, bold: true, serif: true, col: C.gold });
      c.fillStyle = 'rgba(242,220,154,0.4)'; c.fillRect(rx + 12, py + 26, rw - 24, 1);
      let hy = py + 33;
      for (const hb of d.habits) {
        this.diamond(rx + 16, hy + 6, 3, C.brassHi, '#1a1208');
        this.wrap(hb, rw - 36, 10).slice(0, 2).forEach(l => { this.text(l, rx + 24, hy, { size: 10, col: '#e0e4f4' }); hy += 12; });
        hy += 4;
      }
      this.hints([['Tab', 'Раздел'], ['Enter', !own ? 'Купить' : out ? 'Оставить' : 'Взять с собой'], ['Esc', 'Назад']].concat(ids.length > 1 ? [['←→', 'Питомец']] : []), 170, HGT - 18);
    },

    petPick(scr, i) {
      if (i === scr.psel) return;
      scr.psel = i;
      this.sfx('select');
    },

    petAct(scr) {
      const g = this.game, id = Object.keys(H.PETS)[scr.psel], d = H.PETS[id];
      if (!g.ownsPet(id)) {
        if (g.state.jade < d.price) { this.sfx('deny'); this.toast('Не хватает звёздного нефрита: нужно ' + fmt(d.price) + '.'); return; }
        this.openPetBuy(id);
        return;
      }
      if (g.petOut() === id) { g.setPet(null); this.sfx('cancel'); this.toast(d.name + ' осталась на Экспрессе.'); return; }
      g.setPet(id); this.sfx('meow'); this.toast(d.name + ' пойдёт за отрядом.');
    },

    petSupplyKey(scr, k) {
      const n = Object.keys(H.PETS).length;
      if (k === 'left' || k === 'right') { if (n > 1) this.petPick(scr, (scr.psel + (k === 'left' ? n - 1 : 1)) % n); return; }
      if (k === 'ok') this.petAct(scr);
    },

    openPetBuy(id) {
      const ui = this, g = this.game, d = H.PETS[id];
      this.push({
        done: false, sel: 0,
        draw(c) {
          const x = W / 2 - 190, y = 150, w = 380, h = 160;
          ui.win(x, y, w, h, { title: this.done ? 'Новый питомец' : 'Покупка питомца' });
          c.fillStyle = 'rgba(60,36,30,0.9)'; c.fillRect(x + 16, y + 20, 72, 72);
          const cv = petCanvas(id, 'front', this.done ? 'happy' : 'sit', 0);
          blitPet(c, cv, x + 52, y + 20, 4, false);
          if (this.done) {
            ui.text(d.name + ' теперь в экипаже.', x + 102, y + 24, { size: 12, bold: true, col: C.gold });
            ui.wrap('Взять её с собой сейчас? Отпустить или позвать её можно в Снабжении, раздел «Питомцы».', w - 118, 11).forEach((l, i) => ui.text(l, x + 102, y + 46 + i * 14, { size: 11, col: C.sub }));
          } else {
            ui.text('Купить: ' + d.name + '?', x + 102, y + 24, { size: 12, bold: true, col: C.gold });
            ui.text('Цена:', x + 102, y + 48, { size: 11, col: C.sub });
            ui.money(x + 140, y + 47, 'jade', d.price, { col: C.gold });
            ui.text('Останется ' + fmt(g.state.jade - d.price) + ' нефрита', x + 102, y + 68, { size: 10, col: C.dim });
          }
          const a = this.done ? 'Взять с собой' : 'Купить', b = this.done ? 'Позже' : 'Отмена';
          ui.button(x + 30, y + h - 40, 140, 26, a, () => { this.sel = 0; this.key('ok'); }, { active: this.sel === 0, size: 12 });
          ui.button(x + w - 170, y + h - 40, 140, 26, b, () => { this.sel = 1; this.key('ok'); }, { active: this.sel === 1, size: 12 });
        },
        key(k) {
          if (k === 'left' || k === 'right') { this.sel = 1 - this.sel; ui.sfx('select'); return; }
          if (k === 'back') { ui.pop(); return; }
          if (k !== 'ok') return;
          if (this.sel === 1) { ui.pop(); return; }
          if (!this.done) {
            if (!g.buyPet(id)) { ui.sfx('deny'); ui.toast('Не хватает звёздного нефрита.'); return; }
            ui.sfx('meow'); this.done = true; this.sel = 0; return;
          }
          g.setPet(id); ui.sfx('confirm'); ui.toast(d.name + ' пойдёт за отрядом.');
          ui.pop();
        }
      });
    }
  });

  Object.assign(H, { petCanvas, petFrame, petStage: stageArt, PET_DEMO: DEMO });
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
