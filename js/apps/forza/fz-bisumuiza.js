(function (F) {
  'use strict';

  const C = F.col;
  const MAT = F.MAT;
  const shade = F.Models.shade;
  const Street = F.Street;
  const { vq, oq } = Street;
  const AW = 512, AH = 256, PAD = 2;
  const WHITE = C('#ffffff');
  const GAUGE = 0.76, WIRE_Y = 5.5, SPAN_Y = 6.3;
  const ARMS = [[0.68, 4.2], [0.8, 5.4], [0.92, 4.2]];
  const REGIONS = [['csdd', 256, 96], ['galap', 256, 64], ['piens', 256, 64], ['milk', 128, 64], ['white', 8, 8]];

  const A = (() => {
    const out = {}, list = REGIONS.slice().sort((a, b) => b[2] - a[2] || b[1] - a[1]);
    let x = 0, y = 0, row = 0;
    for (const [id, w, h] of list) {
      if (x + w + PAD * 2 > AW) { x = 0; y += row + PAD * 2; row = 0; }
      out[id] = [x + PAD, y + PAD, w, h];
      x += w + PAD * 2;
      row = Math.max(row, h);
    }
    if (y + row + PAD * 2 > AH) throw new Error('bisumuiza atlas overflow');
    return out;
  })();

  function uv(id, u0 = 0, v0 = 0, u1 = 1, v1 = 1) {
    const r = A[id];
    const U = u => (r[0] + 0.5 + (r[2] - 1) * u) / AW, V = v => (r[1] + 0.5 + (r[3] - 1) * v) / AH;
    return [U(u0), V(v1), U(u1), V(v1), U(u1), V(v0), U(u0), V(v0)];
  }
  const WHITE_UV = [(A.white[0] + 4) / AW, (A.white[1] + 4) / AH];

  function label(x, s, cx, cy, size, col, maxW, style = '') {
    x.save();
    x.font = `${style} 900 ${size}px Arial`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const w = x.measureText(s).width;
    if (maxW && w > maxW) { x.translate(cx, cy); x.scale(maxW / w, 1); x.translate(-cx, -cy); }
    x.fillStyle = col;
    x.fillText(s, cx, cy);
    x.restore();
  }

  const PAINT = {
    white(x, w, h) { x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); },
    csdd(x, w, h) {
      x.fillStyle = '#ffd21e'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#1a3c8c'; x.lineWidth = 4; x.strokeRect(4, 4, w - 8, h - 8);
      label(x, 'CSDD', w / 2, 36, 56, '#1a3c8c', w - 40, 'italic');
      x.fillStyle = '#1a3c8c'; x.fillRect(8, 66, w - 16, 22);
      label(x, 'TEHNISKĀ APSKATE · EKSĀMENI', w / 2, 78, 14, '#ffffff', w - 28);
    },
    galap(x, w, h) {
      x.fillStyle = '#1a4a9a'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.strokeRect(4, 4, w - 8, h - 8);
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(34, h / 2, 20, 0, Math.PI * 2); x.fill();
      label(x, '10', 34, h / 2 + 1, 24, '#1a4a9a');
      label(x, 'BIŠUMUIŽA', w / 2 + 28, h / 2 + 1, 30, '#ffffff', w - 84);
    },
    piens(x, w, h) {
      x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a62a8'; x.fillRect(0, h - 7, w, 7);
      x.beginPath(); x.moveTo(26, 8); x.quadraticCurveTo(42, 30, 26, 46); x.quadraticCurveTo(10, 30, 26, 8); x.fill();
      label(x, 'RĪGAS PIENA KOMBINĀTS', w / 2 + 20, 22, 17, '#2a62a8', w - 60);
      label(x, 'Bauskas iela 180', w / 2 + 20, 44, 12, '#5a5e62', w - 60);
    },
    milk(x, w, h) {
      x.fillStyle = '#f4f2e6'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#2a62a8';
      x.beginPath(); x.moveTo(0, h - 14);
      for (let i = 0; i <= w; i += 8) x.lineTo(i, h - 14 + Math.sin(i / w * Math.PI * 6) * 4);
      x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
      label(x, 'PIENS', w / 2, h / 2 - 8, 30, '#2a62a8', w - 16);
    }
  };

  F.Tex.register('bis', () => {
    const cv = F.Tex.canvas(AW, AH), x = cv.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#8a8478'; x.fillRect(0, 0, AW, AH);
    for (const [id] of REGIONS) {
      const [rx, ry, w, h] = A[id];
      const t = F.Tex.canvas(w, h), tx = t.getContext('2d', { willReadFrequently: true });
      PAINT[id](tx, w, h);
      for (const [dx, dy] of [[-PAD, 0], [PAD, 0], [0, -PAD], [0, PAD]]) x.drawImage(t, rx + dx, ry + dy);
      x.drawImage(t, rx, ry);
    }
    return cv;
  }, { clamp: true });

  function hooks(t) {
    const k = t.h / 27, rx = -t.tz, rz = t.tx, out = [[t.x, t.y + t.h, t.z]];
    for (const [f, l] of ARMS) for (const s of [-1, 1]) out.push([t.x + rx * s * l * k, t.y + t.h * f - 1.2, t.z + rz * s * l * k]);
    return out;
  }

  function pylon(wb, t) {
    const h = t.h, k = h / 27, base = h * 0.105, waist = 0.62 * k, yw = h * 0.6, top = h - 1.6, col = C('#a2a9ae'), dark = C('#5c6468');
    const half = y => (y < yw ? base + (waist - base) * y / yw : waist + (0.22 - waist) * (y - yw) / (top - yw));
    const levels = [0, yw * 0.3, yw * 0.58, yw * 0.82, yw, (yw + top) / 2, top];
    for (let i = 0; i + 1 < levels.length; i++) {
      const y0 = levels[i], y1 = levels[i + 1], a = half(y0), c = half(y1);
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        wb.beam([sx * a, y0, sz * a], [sx * c, y1, sz * c], 0.09 * k, col);
        wb.beam([sx * c, y1, sz * c], [-sz * c, y1, sx * c], 0.05 * k, col);
        wb.beam(i % 2 ? [sx * a, y0, sz * a] : [-sz * a, y0, sx * a], i % 2 ? [-sz * c, y1, sx * c] : [sx * c, y1, sz * c], 0.04 * k, col);
      }
    }
    wb.beam([0, top, 0], [0, h, 0], 0.07 * k, col);
    for (const [f, l] of ARMS) {
      const y = h * f, L = l * k, r = half(y);
      wb.beam([-L, y, 0], [L, y, 0], 0.08 * k, col);
      for (const s of [-1, 1]) {
        wb.beam([s * L, y, 0], [s * r, y + 1.5 * k, 0], 0.04 * k, col);
        wb.beam([s * L, y, 0], [s * L, y - 1.2, 0], 0.05, dark);
      }
    }
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) wb.box(sx * base, 0.2, sz * base, 0.35, 0.2, 0.35, C('#b0aca0'));
    return h;
  }

  function cables(scene, towers) {
    const col = C('#3a3e42');
    for (let i = 0; i + 1 < towers.length; i++) {
      const A0 = hooks(towers[i]), A1 = hooks(towers[i + 1]), span = Math.hypot(towers[i + 1].x - towers[i].x, towers[i + 1].z - towers[i].z), sag = span * 0.035;
      for (let w = 0; w < A0.length; w++) {
        const p = A0[w], q = A1[w], at = t => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t - sag * 4 * t * (1 - t), p[2] + (q[2] - p[2]) * t];
        for (let k = 0; k < 8; k++) {
          const a = at(k / 8), c = at((k + 1) / 8), ch = scene.chunkAt((a[0] + c[0]) / 2, (a[2] + c[2]) / 2);
          scene.g(ch, 'white').beam(a, c, w ? 0.04 : 0.025, col);
          scene.grow(ch, Math.min(a[1], c[1]) - 1, Math.max(a[1], c[1]) + 1);
        }
      }
    }
  }

  function rails(scene, tram) {
    const groove = C('#34373a'), head = C('#c2c8cd');
    for (const run of tram.runs) {
      const n = run.length, side = run.map((p, i) => {
        const a = run[Math.max(0, i - 1)], c = run[Math.min(n - 1, i + 1)], l = Math.hypot(c.x - a.x, c.z - a.z) || 1;
        return [-(c.z - a.z) / l, (c.x - a.x) / l];
      });
      let bed = [], s = 0;
      const flush = () => {
        if (bed.length > 1) scene.ribbon(scene.chunkAt(bed[bed.length >> 1][0], bed[bed.length >> 1][1]), 'rail', bed.map(q => [q[0], q[1]]), bed.map(q => q[2]), 1.95, 1.95, 0.05, 4, s);
        bed = [];
      };
      for (let i = 0; i + 1 < n; i++) {
        const p = run[i], q = run[i + 1];
        if (p.bed && q.bed) {
          if (!bed.length) bed.push([p.x, p.z, p.y]);
          bed.push([q.x, q.z, q.y]);
          if (bed.length >= 25) { flush(); s += 48; }
          continue;
        }
        flush();
        const ch = scene.chunkAt((p.x + q.x) / 2, (p.z + q.z) / 2), b = scene.g(ch, 'paint');
        for (const g of [-GAUGE, GAUGE]) for (const [hw, lift, col] of [[0.16, 0.02, groove], [0.035, 0.028, head]]) {
          const P = (o, nrm, k) => [o.x + nrm[0] * (g + k * hw), o.y + lift, o.z + nrm[1] * (g + k * hw)];
          oq(b, P(p, side[i], -1), P(p, side[i], 1), P(q, side[i + 1], 1), P(q, side[i + 1], -1), col, 0, null, [0, 1, 0]);
        }
        scene.grow(ch, Math.min(p.y, q.y) - 1, Math.max(p.y, q.y) + 1);
      }
      flush();
    }
  }

  function overhead(scene, tram, world) {
    const wire = C('#2a2c2e');
    const line = (a, c, w) => {
      const ch = scene.chunkAt((a[0] + c[0]) / 2, (a[2] + c[2]) / 2);
      scene.g(ch, 'x_white').beam(a, c, w, wire);
      scene.grow(ch, Math.min(a[1], c[1]) - 1, Math.max(a[1], c[1]) + 1);
    };
    for (const run of tram.runs) for (let i = 0; i + 1 < run.length; i++) line([run[i].x, run[i].y + WIRE_Y, run[i].z], [run[i + 1].x, run[i + 1].y + WIRE_Y, run[i + 1].z], 0.025);
    for (const s of tram.spans) line([s[0], world.terrainH(s[0], s[1]) + SPAN_Y, s[1]], [s[2], world.terrainH(s[2], s[3]) + SPAN_Y, s[3]], 0.02);
  }

  function board(wb, mb, s) {
    const hw = s.w / 2, y0 = s.lift, y1 = s.lift + s.h, post = C('#6a7278');
    for (const k of [-1, 1]) wb.box(k * (hw - 0.25), y1 / 2, 0.07, 0.06, y1 / 2, 0.06, post);
    vq(mb, [-hw, -0.01], [hw, -0.01], y0, y1, [0, 0, -1], WHITE, 0, uv(s.id));
    vq(wb, [-hw, 0.01], [hw, 0.01], y0, y1, [0, 0, 1], C('#9aa0a4'));
    return y1 + 1;
  }

  function tanker(wb, mb) {
    const cab = C('#3f6f9f'), tank = C('#f4f2e6'), dark = C('#22262a'), tyre = C('#16181a'), glass = C('#1a2630');
    wb.box(0, 1.18, -3.45, 1, 0.42, 0.45, cab);
    wb.box(0, 1.6, -2.25, 1.1, 0.85, 0.75, cab, 0, { top: shade(cab, 1.1) });
    vq(wb, [-0.92, -3.01], [0.92, -3.01], 1.7, 2.35, [0, 0, -1], glass, MAT.GLASS);
    for (const s of [-1, 1]) {
      vq(wb, [s * 1.106, -2.8], [s * 1.106, -2], 1.7, 2.3, [s, 0, 0], glass, MAT.GLASS);
      vq(mb, [s * 1.056, -1.1], [s * 1.056, 3.6], 1.2, 2.3, [s, 0, 0], WHITE, 0, uv('milk'));
      wb.box(s * 0.5, 1.1, -3.91, 0.16, 0.12, 0.02, C('#f4f0d8'));
    }
    wb.box(0, 1.75, 1.25, 1.05, 0.55, 2.35, tank);
    wb.box(0, 2.46, 1.25, 0.72, 0.16, 2.35, shade(tank, 1.04));
    wb.box(0, 1.07, 1.25, 0.72, 0.13, 2.35, shade(tank, 0.86));
    wb.cyl(0, 2.62, 0.3, 0.3, 0.16, 8, C('#c8ccd0'));
    wb.box(0, 0.74, 0.1, 0.5, 0.16, 3.7, dark);
    for (const z of [-3.1, 1.9, 2.95]) for (const s of [-1, 1]) wb.box(s * 0.92, 0.48, z, 0.16, 0.48, 0.48, tyre);
    return 3;
  }

  function decorate(scene) {
    const w = scene.w, bis = w.bis;
    if (!bis) return;
    const place = (x, y, z, yaw, fn) => {
      const ch = scene.chunkAt(x, z), wb = scene.g(ch, 'white'), mb = scene.g(ch, 'bis');
      mb.uvw = WHITE_UV;
      wb.setM(x, y, z, yaw); mb.setM(x, y, z, yaw);
      const h = fn(wb, mb);
      wb.clearM(); mb.clearM();
      scene.grow(ch, y - 1, y + h);
    };
    for (const t of bis.towers) if (!t.ghost) place(t.x, t.y, t.z, F.yawOf(t.tx, t.tz), wb => pylon(wb, t));
    cables(scene, bis.towers);
    rails(scene, bis.tram);
    overhead(scene, bis.tram, w);
    for (const s of bis.signs) place(s.x, s.y, s.z, s.yaw, (wb, mb) => board(wb, mb, s));
    for (const v of bis.trucks) place(v.x, v.y, v.z, v.yaw, tanker);
  }

  const PROPS = F.Models.PROPS;

  PROPS.tpole = (b, p) => {
    const col = C('#4a5055');
    b.cyl(0, 0, 0, 0.13, 7.2, 6, col, 0, { r2: 0.09 });
    b.box(0, 0.25, 0, 0.2, 0.25, 0.2, shade(col, 0.8));
    if (!p.arm) return;
    b.beam([0, 6.1, 0], [0, 6.1, -p.arm - 0.3], 0.04, col);
    b.beam([0, 7, 0], [0, 6.15, -p.arm * 0.8], 0.02, col);
  };

  PROPS.cone = b => {
    b.box(0, 0.02, 0, 0.2, 0.02, 0.2, C('#1e1e1e'));
    b.cone(0, 0.04, 0, 0.17, 0.62, 8, C('#f06a1a'));
    b.cyl(0, 0.27, 0, 0.115, 0.11, 8, C('#f2f2ec'), 0, { r2: 0.087, top: false });
  };

  PROPS.rblock = b => {
    const white = C('#ecebe4'), red = C('#c8302a');
    b.box(0, 0.12, 0, 1.74, 0.12, 0.34, C('#9a968c'));
    for (let k = 0; k < 5; k++) b.box(-1.392 + k * 0.696, 0.5, 0, 0.348, 0.26, 0.2, k % 2 ? white : red);
  };

  PROPS.gpier = b => {
    const stone = C('#d8d0bc');
    b.box(0, 1.2, 0, 0.45, 1.2, 0.45, stone);
    b.box(0, 2.5, 0, 0.56, 0.1, 0.56, shade(stone, 1.08));
    b.cone(0, 2.6, 0, 0.4, 0.5, 4, shade(stone, 0.92));
  };

  F.Bis = { A, REGIONS, ARMS, uv, hooks, pylon, tanker, decorate };
})(globalThis.Forza = globalThis.Forza || {});
