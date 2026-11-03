(function (S) {
  'use strict';
  const M = S.METRICS;
  const LEGEND_W = 170, MARGIN = 14, PERSON_REACH = 4, INDOOR_ROWS = 6, LABEL_H = 13, LABEL_PAD = 2;
  const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const KINDS = [
    { id: 'own', name: 'Свой дом', color: '#3fb24f', mark: 'д' },
    { id: 'home', name: 'Дома', color: '#c8c2a8', mark: 'д' },
    { id: 'work', name: 'Работа', color: '#4f9fe0', mark: 'р' },
    { id: 'school', name: 'Школа', color: '#4fd0d8', mark: 'ш' },
    { id: 'shop', name: 'Магазин', color: '#e05050', mark: 'м' },
    { id: 'park', name: 'Парк и пляж', color: '#3a5fb0', mark: 'п' },
    { id: 'people', name: 'Жители', color: '#f0a040', mark: '•' }
  ];

  class MapView {
    constructor(ui) {
      this.ui = ui;
      this.open = false;
      this.mark = null;
      this.hidden = new Set();
      this.base = null;
      this.hover = null;
    }

    toggle() {
      this.open = !this.open;
      this.ui.stamp = '';
      if (this.open && !this.base) this.bake();
    }

    bake() {
      const world = this.ui.scene.world, canvas = document.createElement('canvas');
      canvas.width = M.town;
      canvas.height = M.town;
      const g = canvas.getContext('2d'), image = g.createImageData(M.town, M.town), colors = S.Terrain.colors(world.terrain), t = world.terrain;
      for (let z = 0; z < M.town; z++) {
        for (let x = 0; x < M.town; x++) {
          const at = x + z * M.town, h = t.heights[x + z * t.side], k = S.clamp(0.82 + h * 0.012, 0.7, 1.15);
          image.data[at * 4] = Math.min(255, colors[at * 4] * k);
          image.data[at * 4 + 1] = Math.min(255, colors[at * 4 + 1] * k);
          image.data[at * 4 + 2] = Math.min(255, colors[at * 4 + 2] * k);
          image.data[at * 4 + 3] = 255;
        }
      }
      g.putImageData(image, 0, 0);
      this.base = canvas;
    }

    layout(v) {
      const size = Math.min(v.sh - MARGIN * 2, v.sw - LEGEND_W - MARGIN * 3);
      return { size, x: LEGEND_W + MARGIN * 2 + Math.floor((v.sw - LEGEND_W - MARGIN * 3 - size) / 2), y: Math.floor((v.sh - size) / 2), k: size / M.town };
    }

    kindOf(lot) {
      if (lot === this.ui.selected.home) return 'own';
      return lot.kind;
    }

    worldAt(v, sx, sy) {
      const a = this.layout(v), x = (sx - a.x) / a.k, z = (sy - a.y) / a.k;
      return x >= 0 && z >= 0 && x < M.town && z < M.town ? [x, z] : null;
    }

    dotOf(sim) {
      const lot = sim.inside;
      if (!lot) return [sim.x, sim.z];
      const n = this.ui.scene.sims.indexOf(sim), row = Math.floor(n / INDOOR_ROWS) % INDOOR_ROWS;
      return [lot.x + lot.w * (n % INDOOR_ROWS + 0.5) / INDOOR_ROWS, lot.z + lot.d * (row + 0.5) / INDOOR_ROWS];
    }

    personAt(v, sx, sy) {
      if (this.hidden.has('people')) return null;
      const a = this.layout(v);
      let best = null, bestD = PERSON_REACH;
      for (const sim of this.ui.scene.sims) {
        const [x, z] = this.dotOf(sim), d = Math.hypot(a.x + x * a.k - sx, a.y + z * a.k - sy);
        if (d < bestD) {
          bestD = d;
          best = sim;
        }
      }
      return best;
    }

    lotAt(v, sx, sy) {
      const at = this.worldAt(v, sx, sy);
      if (!at) return null;
      return this.ui.scene.world.ground.lotAt(at[0], at[1]);
    }

    minutes(sim, x, z) {
      const walk = Math.hypot(sim.x - x, sim.z - z) / M.walk;
      return Math.max(1, Math.round(walk / 60));
    }

    legendRow(i) {
      return { x: MARGIN, y: 62 + i * 22, w: LEGEND_W, h: 20 };
    }

    click(sx, sy, button) {
      const ui = this.ui, v = ui.screen, world = ui.scene.world;
      for (let i = 0; i < KINDS.length; i++) {
        const r = this.legendRow(i);
        if (sx >= r.x && sx < r.x + r.w && sy >= r.y && sy < r.y + r.h) {
          const id = KINDS[i].id;
          if (this.hidden.has(id)) this.hidden.delete(id);
          else this.hidden.add(id);
          ui.stamp = '';
          return;
        }
      }
      const at = this.worldAt(v, sx, sy);
      if (!at) {
        this.toggle();
        return;
      }
      const person = this.personAt(v, sx, sy);
      if (person) {
        ui.watch = person === ui.selected ? null : person;
        ui.camera.setView({ x: person.x, z: person.z, zoom: Math.min(ui.camera.zoom, 2) });
        ui.follow = true;
        this.toggle();
        return;
      }
      if (button === 2) {
        ui.watch = null;
        ui.follow = false;
        ui.flyTo(at[0], at[1]);
        this.toggle();
        return;
      }
      const lot = world.ground.lotAt(at[0], at[1]);
      const target = lot && !lot.closed ? { x: lot.doorOut[0], z: lot.doorOut[1], floor: 0, lot } : S.Town.goalAt(world, at[0], at[1], 0);
      S.Acts.add(world, ui.selected, S.Acts.goAct(target, true));
      ui.watch = null;
      ui.centerOnSim();
      this.toggle();
    }

    draw(g, v) {
      const ui = this.ui, world = ui.scene.world, a = this.layout(v), hide = this.hidden, pointer = ui.pointer, Font = S.Font;
      g.fillStyle = 'rgba(10, 16, 32, 0.9)';
      g.fillRect(0, 0, v.sw, v.sh);
      g.imageSmoothingEnabled = true;
      if (!this.base) this.bake();
      g.drawImage(this.base, a.x, a.y, a.size, a.size);
      g.strokeStyle = '#000';
      g.strokeRect(a.x - 1, a.y - 1, a.size + 2, a.size + 2);
      const rects = [];
      for (const lot of world.lots) {
        const kind = this.kindOf(lot), spec = KINDS.find(k => k.id === kind);
        if (hide.has(kind)) continue;
        const r = { x: a.x + lot.x * a.k, y: a.y + lot.z * a.k, w: Math.max(3, lot.w * a.k), h: Math.max(3, lot.d * a.k) };
        g.fillStyle = spec.color;
        g.fillRect(r.x, r.y, r.w, r.h);
        g.strokeStyle = '#000';
        g.strokeRect(r.x + 0.5, r.y + 0.5, r.w, r.h);
        rects.push(r);
        if (lot.name) r.name = lot.name;
      }
      const placed = [];
      for (const r of rects.filter(q => q.name)) {
        const w = Font.measure('smallb', r.name) + LABEL_PAD * 2, x = Math.round(r.x + r.w / 2 - w / 2);
        const mid = Math.round(r.y + r.h / 2 - LABEL_H / 2), spots = [[x, r.y - LABEL_H - 1], [x, r.y + r.h + 1], [r.x + r.w + 1, mid], [r.x - w - 1, mid], [x, r.y - LABEL_H * 2 - 2], [x, r.y + r.h + LABEL_H + 2]];
        const spot = spots.map(([sx, sy]) => ({ x: sx, y: sy, w, h: LABEL_H })).find(b => !placed.some(p => overlaps(p, b)));
        if (!spot) continue;
        placed.push(spot);
        Font.shadowed(g, 'smallb', r.name, spot.x + LABEL_PAD, spot.y, '#fff');
      }
      const c = ui.camera, half = 0.5 * (v.sw / c.tile + v.sh / (c.tile / 2));
      g.strokeStyle = '#fff';
      g.strokeRect(a.x + (c.fx - half / 2) * a.k, a.y + (c.fz - half / 2) * a.k, half * a.k, half * a.k);
      if (!hide.has('people')) {
        for (const sim of world.sims) {
          const [x, z] = this.dotOf(sim);
          g.fillStyle = sim.inside ? '#6a3a10' : sim.state === 'drive' ? '#ff5a3a' : sim.live ? '#ffd24a' : '#f0a040';
          g.fillRect(a.x + x * a.k - 1.5, a.y + z * a.k - 1.5, 3, 3);
        }
      }
      if (world.spots && world.family.some(s => s.rewards && s.rewards.includes('collectorHelper'))) {
        g.fillStyle = '#7cff6a';
        for (const spot of S.Collect.shown(world)) g.fillRect(Math.round(a.x + spot.x * a.k) - 1, Math.round(a.y + spot.z * a.k) - 1, 2, 2);
      }
      const mark = this.mark;
      if (mark && ui.time < mark.until) {
        const [kx, kz] = this.dotOf(mark.sim), r = 6 + (Math.floor(ui.time * 4) % 3) * 2;
        g.strokeStyle = '#ff5a8a';
        g.lineWidth = 2;
        g.strokeRect(Math.round(a.x + kx * a.k - r), Math.round(a.y + kz * a.k - r), r * 2, r * 2);
        g.lineWidth = 1;
        Font.shadowed(g, 'smallb', mark.sim.name, a.x + kx * a.k + r + 3, a.y + kz * a.k - 6, '#ffd0e0');
      }
      const me = ui.selected, [mx, mz] = this.dotOf(me);
      g.fillStyle = '#62e05c';
      g.fillRect(a.x + mx * a.k - 3, a.y + mz * a.k - 3, 6, 6);
      g.strokeStyle = '#000';
      g.strokeRect(a.x + mx * a.k - 3.5, a.y + mz * a.k - 3.5, 7, 7);
      S.Kit.glass(g, MARGIN, MARGIN, LEGEND_W, v.sh - MARGIN * 2, 'deep', 8);
      Font.draw(g, 'title', 'Карта города', MARGIN + 8, MARGIN + 6, '#fff');
      Font.draw(g, 'small', 'M, Esc: закрыть', MARGIN + 8, MARGIN + 27, '#dbe6f8');
      KINDS.forEach((k, i) => {
        const r = this.legendRow(i), off = hide.has(k.id);
        g.fillStyle = off ? '#3a4560' : k.color;
        g.fillRect(r.x + 8, r.y + 3, 14, 14);
        g.strokeStyle = '#102a66';
        g.strokeRect(r.x + 8.5, r.y + 3.5, 13, 13);
        Font.draw(g, 'smallb', k.mark, r.x + 12, r.y + 3, '#000');
        Font.draw(g, 'small', k.name, r.x + 28, r.y + 4, off ? '#8a98b4' : '#fff');
      });
      let line = 62 + KINDS.length * 22 + 8;
      for (const text of ['Щелчок: идти туда', 'Щелчок по жителю:', 'камера за ним', 'Правая кнопка:', 'камера туда']) {
        Font.draw(g, 'small', text, MARGIN + 8, line, '#dbe6f8');
        line += 15;
      }
      if (!pointer) return;
      const person = this.personAt(v, pointer.x, pointer.y), lot = this.lotAt(v, pointer.x, pointer.y), at = this.worldAt(v, pointer.x, pointer.y);
      if (!at) return;
      const title = person ? person.name : lot ? (lot.name || 'Жилой участок') : 'Город', detail = person ? (person.inside ? 'внутри: ' + (person.inside.name || 'жилой дом') : S.Sim.STATE_NAMES[person.state]) : 'пешком около ' + this.minutes(me, at[0], at[1]) + ' мин';
      S.Kit.drawTip(g, v.sw, v.sh, pointer.x, pointer.y, { title, text: detail });
    }
  }

  S.MapView = MapView;
})(globalThis.Sims98 = globalThis.Sims98 || {});
