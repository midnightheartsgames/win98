(function (H) {
  'use strict';
  const G = H.Gfx;

  const DIRS = [[0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]];
  const SHAPES = [0b001001, 0b000101, 0b000011, 0b010101, 0b001011];
  const hash = (x, y, s) => G.hash(x, y, s);

  const PUZZLES = {
    mf_workshop: {
      title: 'Соединитель магнитных потоков', place: 'Мастерская «Незимье»',
      cols: 3, rows: 3, src: [0, 1, 5], dst: [[2, 1, 1]],
      paths: [[[0, 1], [1, 1], [2, 1]]], seed: 3
    },
    mf_backwater: {
      title: 'Соединитель магнитных потоков', place: 'Сточный проход',
      cols: 5, rows: 4, src: [0, 2, 4], dst: [[4, 0, 1]],
      paths: [[[0, 2], [1, 2], [2, 2], [2, 1], [3, 1], [4, 1], [4, 0]]], fixed: [[2, 1]], seed: 11
    },
    mf_mine: {
      title: 'Соединитель магнитных потоков', place: 'Большая шахта, центральный зал',
      cols: 4, rows: 4, src: [0, 0, 5], dst: [[3, 3, 2]],
      paths: [[[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2], [3, 3]]], fixed: [[1, 1]], seed: 23
    },
    mf_rivet1: {
      title: 'Соединитель магнитных потоков', place: 'Заклёпкоград, Заброшенный рынок',
      cols: 4, rows: 3, src: [0, 2, 5], dst: [[3, 0, 2]],
      paths: [[[0, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0]]], seed: 29
    },
    mf_rivet2: {
      title: 'Соединитель магнитных потоков', place: 'Заклёпкоград, торговая улица',
      cols: 5, rows: 4, src: [0, 0, 5], dst: [[4, 3, 2]],
      paths: [[[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2], [4, 2], [4, 3]]], fixed: [[2, 1]], seed: 31
    },
    mf_settle: {
      title: 'Соединитель магнитных потоков', place: 'Поселение роботов, Станция преобразования энергии',
      cols: 5, rows: 4, src: [0, 3, 5], dst: [[4, 0, 2]],
      paths: [[[0, 3], [1, 3], [1, 2], [2, 2], [2, 1], [3, 1], [3, 0], [4, 0]]], fixed: [[2, 2]], seed: 37
    },
    mf_settle2: {
      title: 'Соединитель магнитных потоков', place: 'Поселение роботов, восточная пещера',
      cols: 4, rows: 4, src: [0, 1, 5], dst: [[3, 2, 2]],
      paths: [[[0, 1], [1, 1], [1, 2], [2, 2], [3, 2]]], seed: 41
    },
    mf_rz1: {
      title: 'Соединитель магнитных потоков', place: 'Запретная зона, восточная платформа моста',
      cols: 5, rows: 3, src: [0, 0, 5], dst: [[4, 2, 2]],
      paths: [[[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2], [4, 2]]], fixed: [[2, 1]], seed: 43
    },
    mf_rz2: {
      title: 'Соединитель магнитных потоков', place: 'Запретная зона, западный переулок',
      cols: 5, rows: 4, src: [0, 2, 5], dst: [[4, 1, 2]],
      paths: [[[0, 2], [1, 2], [1, 1], [2, 1], [2, 0], [3, 0], [4, 0], [4, 1]]], fixed: [[1, 1], [3, 0]], seed: 47
    },
    mf_cor1: {
      title: 'Соединитель магнитных потоков', place: 'Коридор исчезающего эха, восточный крюк',
      cols: 5, rows: 4, src: [0, 1, 5], dst: [[4, 3, 2]],
      paths: [[[0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3], [4, 3]]], fixed: [[2, 2]], seed: 53
    },
    mf_cor2: {
      title: 'Соединитель магнитных потоков', place: 'Коридор исчезающего эха, южная развилка',
      cols: 6, rows: 4, src: [0, 3, 5], dst: [[5, 0, 2]],
      paths: [[[0, 3], [1, 3], [1, 2], [2, 2], [2, 1], [3, 1], [4, 1], [4, 0], [5, 0]]], fixed: [[2, 1], [4, 1]], seed: 59
    },
    mf_leisure: {
      title: 'Соединитель магнитных потоков', place: 'Сточный проход, Площадь отдыха',
      cols: 4, rows: 3, src: [0, 1, 5], dst: [[3, 1, 2]],
      paths: [[[0, 1], [1, 1], [2, 1], [3, 1]]], seed: 17
    }
  };

  const axial = (c, r) => [c, r - (c - (c & 1)) / 2];
  const rot = (m, n) => { n = ((n % 6) + 6) % 6; return ((m << n) | (m >> (6 - n))) & 63; };
  const dirOf = (a, b) => {
    const [aq, ar] = axial(a[0], a[1]), [bq, br] = axial(b[0], b[1]);
    return DIRS.findIndex(([dq, dr]) => aq + dq === bq && ar + dr === br);
  };

  const built = new Map();
  function build(id) {
    let B = built.get(id);
    if (B) return B;
    const d = PUZZLES[id];
    const cells = [], at = new Map();
    for (let c = 0; c < d.cols; c++) for (let r = 0; r < d.rows; r++) {
      const i = cells.length;
      cells.push({ c, r, mask: 0, path: false, fixed: false });
      at.set(c + ',' + r, i);
    }
    const cell = (c, r) => cells[at.get(c + ',' + r)];
    const sc = cell(d.src[0], d.src[1]);
    sc.mask |= 1 << d.src[2];
    for (const p of d.paths) {
      p.forEach((pt, k) => {
        const cl = cell(pt[0], pt[1]);
        cl.path = true;
        if (k > 0) { const e = dirOf(p[k - 1], pt); if (e < 0) throw new Error(id + ': cells ' + p[k - 1] + ' and ' + pt + ' are not neighbours'); cl.mask |= 1 << ((e + 3) % 6); }
        if (k < p.length - 1) { const e = dirOf(pt, p[k + 1]); if (e < 0) throw new Error(id + ': cells ' + pt + ' and ' + p[k + 1] + ' are not neighbours'); cl.mask |= 1 << e; }
      });
    }
    for (const t of d.dst) cell(t[0], t[1]).mask |= 1 << t[2];
    for (const f of d.fixed || []) cell(f[0], f[1]).fixed = true;
    cells.forEach((cl, i) => {
      if (!cl.path) cl.mask = rot(SHAPES[Math.floor(hash(i, d.seed, 401) * SHAPES.length)], Math.floor(hash(d.seed, i, 402) * 6));
      cl.start = cl.fixed ? 0 : 1 + Math.floor(hash(i + 7, d.seed, 403) * 5);
    });
    B = { id, def: d, cells, at, cell };
    built.set(id, B);
    return B;
  }

  function flow(B, turns) {
    const d = B.def, lit = new Set(), mask = i => rot(B.cells[i].mask, -turns[i]);
    const s0 = B.at.get(d.src[0] + ',' + d.src[1]);
    if (mask(s0) & (1 << d.src[2])) {
      const todo = [s0];
      lit.add(s0);
      while (todo.length) {
        const i = todo.pop(), cl = B.cells[i], [q, r] = axial(cl.c, cl.r), m = mask(i);
        for (let e = 0; e < 6; e++) {
          if (!(m & (1 << e))) continue;
          const nq = q + DIRS[e][0], nr = r + DIRS[e][1], nc = nq, nrow = nr + (nq - (nq & 1)) / 2, j = B.at.get(nc + ',' + nrow);
          if (j === undefined || lit.has(j) || !(mask(j) & (1 << ((e + 3) % 6)))) continue;
          lit.add(j); todo.push(j);
        }
      }
    }
    const reached = d.dst.map(t => { const j = B.at.get(t[0] + ',' + t[1]); return lit.has(j) && !!(mask(j) & (1 << t[2])); });
    return { lit, reached, done: reached.every(Boolean) };
  }

  const startTurns = B => B.cells.map(cl => cl.start);
  const solvedTurns = B => B.cells.map(() => 0);

  function openMagflow(id, close) {
    const ui = this, { W, HGT } = H.UI_CONST, B = build(id), d = B.def;
    const S = 28, HX = S * Math.sqrt(3) / 2;
    const bw = (d.cols - 1) * S * 1.5 + S * 2, bh = d.rows * HX * 2 + HX;
    const ox = W / 2 - bw / 2 + S, oy = 92 + (300 - bh) / 2 + HX;
    const centre = cl => [ox + cl.c * S * 1.5, oy + cl.r * HX * 2 + (cl.c & 1 ? HX : 0)];
    const edgePt = (x, y, e, k) => { const a = -Math.PI / 2 + e * Math.PI / 3; return [x + Math.cos(a) * HX * k, y + Math.sin(a) * HX * k]; };
    this.push({
      turns: startTurns(B), cur: B.at.get(d.src[0] + ',' + d.src[1]), done: 0, spin: B.cells.map(() => 0),
      tick(dt) {
        this.spin = this.spin.map(v => Math.max(0, v - dt * 6));
        if (this.done) { this.done += dt; if (this.done > 1.4) this.finish(true); }
      },
      finish(ok) {
        if (this.closed) return;
        this.closed = true;
        ui.screens.pop();
        ui.sfx(ok ? 'confirm' : 'cancel');
        if (close) close(ok);
      },
      turn(i, n) {
        if (this.done || B.cells[i].fixed) { ui.sfx('deny'); return; }
        this.turns[i] = (this.turns[i] - n + 6) % 6;
        this.spin[i] = n;
        ui.sfx('select');
        if (flow(B, this.turns).done) { this.done = 0.001; ui.sfx('star4'); }
      },
      draw(c) {
        const f = flow(B, this.turns), t = ui.t;
        c.fillStyle = 'rgba(2,3,10,0.7)'; c.fillRect(0, 0, W, HGT);
        ui.win(60, 40, W - 120, 400, { title: d.title });
        ui.text(d.place, W / 2, 66, { align: 'center', size: 11, col: '#a8b8d8' });
        c.fillStyle = '#0c1220'; c.fillRect(80, 84, W - 160, 312);
        c.strokeStyle = '#2a3a5a'; c.lineWidth = 1; c.strokeRect(80.5, 84.5, W - 161, 311);
        const node = (cl, e, on, kind) => {
          const [x, y] = centre(cl), [nx, ny] = edgePt(x, y, e, 1.55);
          const [ex, ey] = edgePt(x, y, e, 1);
          c.strokeStyle = on ? '#ffd040' : '#3a4a6a'; c.lineWidth = 6; c.beginPath(); c.moveTo(ex, ey); c.lineTo(nx, ny); c.stroke();
          const gr = c.createRadialGradient(nx, ny, 2, nx, ny, 18);
          gr.addColorStop(0, on ? 'rgba(255,220,90,0.75)' : 'rgba(90,140,220,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gr; c.fillRect(nx - 18, ny - 18, 36, 36);
          c.fillStyle = kind === 'src' ? '#ffb030' : on ? '#ffe890' : '#2a3450';
          c.beginPath(); c.arc(nx, ny, 8, 0, Math.PI * 2); c.fill();
          c.strokeStyle = '#e8f0ff'; c.lineWidth = 2; c.stroke();
        };
        node(B.cell(d.src[0], d.src[1]), d.src[2], true, 'src');
        d.dst.forEach((tg, k) => node(B.cell(tg[0], tg[1]), tg[2], f.reached[k], 'dst'));
        B.cells.forEach((cl, i) => {
          const [x, y] = centre(cl), on = f.lit.has(i), sel = i === this.cur;
          c.beginPath();
          for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const px = x + Math.cos(a) * (S - 2), py = y + Math.sin(a) * (S - 2); if (k) c.lineTo(px, py); else c.moveTo(px, py); }
          c.closePath();
          c.fillStyle = sel ? '#24324e' : '#18203a'; c.fill();
          c.lineWidth = cl.fixed ? 3 : 2; c.strokeStyle = cl.fixed ? '#c83a3a' : sel ? '#ffd890' : '#3e4e72'; c.stroke();
          const m = rot(cl.mask, -this.turns[i]), sp = this.spin[i] * Math.PI / 3;
          c.save(); c.translate(x, y); c.rotate(sp);
          c.lineCap = 'round';
          for (let e = 0; e < 6; e++) {
            if (!(m & (1 << e))) continue;
            const [ex, ey] = edgePt(0, 0, e, 1);
            c.strokeStyle = on ? '#8a6a10' : '#10141e'; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 0); c.lineTo(ex, ey); c.stroke();
            c.strokeStyle = on ? (this.done ? (Math.sin(t * 12) > 0 ? '#fff4c0' : '#ffd040') : '#ffd040') : '#5a6a8a'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(ex, ey); c.stroke();
          }
          c.fillStyle = on ? '#ffe890' : '#6a7a9a'; c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); c.fill();
          c.restore();
          ui.hit(x - HX, y - HX, HX * 2, HX * 2, b => { this.cur = i; this.turn(i, b === 2 ? -1 : 1); });
        });
        const msg = this.done ? 'Ток подан!' : 'Поверните модули, чтобы ток дошёл от узла питания до цепи.';
        ui.text(msg, W / 2, 402, { align: 'center', size: 12, bold: !!this.done, col: this.done ? '#ffd890' : '#e8f0ff' });
        if (B.cells.some(cl => cl.fixed)) ui.text('Модули в красной рамке не поворачиваются.', W / 2, 418, { align: 'center', size: 10, col: '#e89090' });
        ui.hints([['←↑→↓', 'Модуль'], ['Enter', 'Повернуть'], ['Q', 'Обратно'], ['Esc', 'Выйти']], W / 2, 452, { align: 'center' });
      },
      key(k, code) {
        if (this.done) return;
        if (k === 'back') { this.finish(false); return; }
        if (k === 'ok' || code === 'KeyE') { this.turn(this.cur, 1); return; }
        if (code === 'KeyQ') { this.turn(this.cur, -1); return; }
        const v = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[k];
        if (!v) return;
        const [x0, y0] = centre(B.cells[this.cur]);
        let best = -1, bd = Infinity;
        B.cells.forEach((cl, i) => {
          if (i === this.cur) return;
          const [x, y] = centre(cl), dx = x - x0, dy = y - y0, along = dx * v[0] + dy * v[1];
          if (along <= 4) return;
          const side = Math.abs(dx * v[1] - dy * v[0]), dist = along + side * 1.6;
          if (dist < bd) { bd = dist; best = i; }
        });
        if (best >= 0) { this.cur = best; ui.sfx('select'); }
      }
    });
  }

  if (H.UI) Object.assign(H.UI.prototype, { openMagflow });
  H.Magflow = { PUZZLES, build, flow, startTurns, solvedTurns, rot };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
