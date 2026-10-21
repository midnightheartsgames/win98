(function (H) {
  'use strict';

  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const opp = d => (d + 2) % 4;

  const PUZZLES = {
    cart1: {
      day: 1, title: 'Первая проверка', rows: [
        '..B....',
        '..=....',
        'C=T===.'
      ]
    },
    cart2: {
      day: 1, title: 'Груз к жёлтому', rows: [
        'C==O==Y'
      ]
    },
    cart3: {
      day: 1, title: 'Два упора', rows: [
        'B.....Y',
        '=.....=',
        'T==C==T',
        '=.....=',
        'O.....K'
      ]
    },
    cart4: {
      day: 2, title: 'Развилка', rows: [
        'Y==T==B',
        '...=...',
        '...=...',
        'C==T=OC'
      ]
    },
    cart5: {
      day: 2, title: 'Очередь на пути', rows: [
        'B=K=T=C=Y',
        '....=....',
        '....O....'
      ]
    },
    cart6: {
      day: 2, title: 'Объезд', rows: [
        'C===T===B',
        '....=...=',
        'K===T===Y'
      ]
    },
    cart7: {
      day: 3, title: 'Три вагонетки', rows: [
        'Y===T===B',
        '....=....',
        'C=O=T=C=B',
        '....=....',
        '....C....'
      ]
    },
    cart8: {
      day: 3, title: 'Разгрузка', rows: [
        'K=T=O=T=B',
        '..=...=..',
        '..Y...C..'
      ]
    },
    cart9: {
      day: 3, title: 'Экзамен мастера', rows: [
        'B==T==C==T==Y',
        '...=.....=...',
        '...O.....T==B',
        '...=.....=...',
        'K==T.....C...'
      ]
    }
  };

  const built = new Map();
  function build(id) {
    let B = built.get(id);
    if (B) return B;
    const d = PUZZLES[id], h = d.rows.length, w = d.rows[0].length;
    const rail = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d.rows[y][x] !== '.';
    const cells = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!rail(x, y)) { cells.push(null); continue; }
      const ch = d.rows[y][x], conn = [0, 1, 2, 3].filter(k => rail(x + DX[k], y + DY[k]));
      const cell = { x, y, conn, kind: ch === 'B' ? 'blue' : ch === 'Y' ? 'yellow' : ch === 'O' ? 'ore' : 'rail' };
      if (conn.length === 3) {
        const miss = [0, 1, 2, 3].find(k => !conn.includes(k)), stem = opp(miss), alts = conn.filter(k => k !== stem);
        cell.turnout = { stem, alts };
      }
      cells.push(cell);
    }
    const carts = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const ch = d.rows[y][x]; if (ch === 'C' || ch === 'K') carts.push({ i: y * w + x, loaded: ch === 'K' }); }
    const turnouts = cells.map((c, i) => c && c.turnout ? i : -1).filter(i => i >= 0);
    B = { id, def: d, w, h, cells, carts, turnouts };
    built.set(id, B);
    return B;
  }

  function startState(B) { return { carts: B.carts.map(c => ({ i: c.i, loaded: c.loaded })), sw: B.turnouts.map(() => 0) }; }

  function active(B, s, i) {
    const c = B.cells[i];
    if (!c) return [];
    if (!c.turnout) return c.conn;
    const k = B.turnouts.indexOf(i);
    return [c.turnout.stem, c.turnout.alts[s.sw[k]]];
  }

  function push(B, s, ci, d) {
    const cart = s.carts[ci];
    let at = cart.i;
    if (!active(B, s, at).includes(d)) return null;
    const busy = new Set(s.carts.filter((c, k) => k !== ci).map(c => c.i));
    const seen = new Set();
    let loaded = cart.loaded, moved = false;
    for (;;) {
      const x = at % B.w + DX[d], y = Math.floor(at / B.w) + DY[d];
      if (x < 0 || y < 0 || x >= B.w || y >= B.h) break;
      const n = y * B.w + x;
      if (!B.cells[n] || busy.has(n) || !active(B, s, n).includes(opp(d))) break;
      at = n;
      moved = true;
      const cell = B.cells[n];
      if (cell.kind === 'ore') { loaded = !loaded; break; }
      if (cell.kind === 'blue' || cell.kind === 'yellow') break;
      const next = active(B, s, n).find(k => k !== opp(d));
      if (next === undefined) break;
      const key = n + ':' + next;
      if (seen.has(key)) break;
      seen.add(key);
      d = next;
    }
    if (!moved) return null;
    const carts = s.carts.map((c, k) => k === ci ? { i: at, loaded } : c);
    return { carts, sw: s.sw };
  }

  function toggle(B, s, k) {
    const i = B.turnouts[k];
    if (s.carts.some(c => c.i === i)) return null;
    return { carts: s.carts, sw: s.sw.map((v, j) => j === k ? 1 - v : v) };
  }

  function solved(B, s) {
    return B.cells.every((c, i) => !c || (c.kind !== 'blue' && c.kind !== 'yellow') || s.carts.some(t => t.i === i && t.loaded === (c.kind === 'yellow')));
  }

  const keyOf = s => s.carts.map(c => c.i + (c.loaded ? 'k' : 'c')).join(',') + '|' + s.sw.join('');

  function solve(B, limit = 200000) {
    const s0 = startState(B), seen = new Map([[keyOf(s0), null]]), q = [s0];
    for (let h = 0; h < q.length && seen.size < limit; h++) {
      const s = q[h];
      if (solved(B, s)) {
        const path = [];
        for (let k = keyOf(s); seen.get(k); k = seen.get(k).from) path.unshift(seen.get(k).move);
        return path;
      }
      const next = [];
      s.carts.forEach((c, ci) => { for (let d = 0; d < 4; d++) { const n = push(B, s, ci, d); if (n) next.push([n, { t: 'push', ci, d }]); } });
      B.turnouts.forEach((t, k) => { const n = toggle(B, s, k); if (n) next.push([n, { t: 'sw', k }]); });
      for (const [n, move] of next) {
        const k = keyOf(n);
        if (seen.has(k)) continue;
        seen.set(k, { from: keyOf(s), move });
        q.push(n);
      }
    }
    return null;
  }

  function openCarts(id, close) {
    const ui = this, { W, HGT } = H.UI_CONST, B = build(id), d = B.def;
    const S = Math.min(48, Math.floor(Math.min((W - 200) / B.w, 260 / B.h)));
    const ox = Math.round(W / 2 - B.w * S / 2), oy = Math.round(100 + (280 - B.h * S) / 2);
    const firstCart = startState(B).carts[0].i;
    this.push({
      s: startState(B), cur: firstCart, sel: -1, done: 0, moves: 0,
      tick(dt) { if (this.done) { this.done += dt; if (this.done > 1.4) this.finish(true); } },
      finish(ok) {
        if (this.closed) return;
        this.closed = true;
        ui.screens.pop();
        ui.sfx(ok ? 'confirm' : 'cancel');
        if (close) close(ok);
      },
      reset() { this.s = startState(B); this.sel = -1; this.moves = 0; ui.sfx('cancel'); },
      act() {
        const i = this.cur, ci = this.s.carts.findIndex(c => c.i === i), k = B.turnouts.indexOf(i);
        if (ci >= 0) { this.sel = this.sel === ci ? -1 : ci; ui.sfx('select'); return; }
        if (k >= 0) { const n = toggle(B, this.s, k); if (n) { this.s = n; this.moves++; ui.sfx('lever'); } else ui.sfx('deny'); return; }
        ui.sfx('deny');
      },
      move(dir) {
        if (this.sel >= 0) {
          const n = push(B, this.s, this.sel, dir);
          if (!n) { ui.sfx('deny'); return; }
          this.s = n; this.moves++; this.cur = n.carts[this.sel].i; ui.sfx('hit');
          if (solved(B, this.s)) { this.done = 0.001; this.sel = -1; ui.sfx('star4'); }
          return;
        }
        const x = this.cur % B.w + DX[dir], y = Math.floor(this.cur / B.w) + DY[dir];
        if (x < 0 || y < 0 || x >= B.w || y >= B.h) return;
        this.cur = y * B.w + x;
        ui.sfx('select');
      },
      draw(c) {
        const t = ui.t;
        c.fillStyle = 'rgba(2,3,10,0.7)'; c.fillRect(0, 0, W, HGT);
        ui.win(60, 40, W - 120, 400, { title: 'Проверка вагонеток' });
        ui.text(d.title + ' · день ' + d.day, W / 2, 66, { align: 'center', size: 11, col: '#e8c890' });
        c.fillStyle = '#1a1612'; c.fillRect(80, 84, W - 160, 312);
        c.strokeStyle = '#4a3a2a'; c.lineWidth = 1; c.strokeRect(80.5, 84.5, W - 161, 311);
        const ctr = i => [ox + (i % B.w) * S + S / 2, oy + Math.floor(i / B.w) * S + S / 2];
        B.cells.forEach((cell, i) => {
          if (!cell) return;
          const [x, y] = ctr(i), act = active(B, this.s, i);
          for (const k of cell.conn) {
            const on = act.includes(k);
            c.strokeStyle = on ? '#8a7a68' : '#3a3028'; c.lineWidth = on ? 10 : 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + DX[k] * S / 2, y + DY[k] * S / 2); c.stroke();
            if (on) { c.strokeStyle = '#d8c8a8'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + DX[k] * S / 2, y + DY[k] * S / 2); c.stroke(); }
          }
          if (cell.turnout) {
            c.fillStyle = '#2a2420'; c.fillRect(x - 9, y - 9, 18, 18);
            const a = act.find(k => k !== cell.turnout.stem);
            c.fillStyle = '#ffb050'; c.beginPath(); c.arc(x + DX[a] * 6, y + DY[a] * 6, 4, 0, Math.PI * 2); c.fill();
            c.strokeStyle = '#ffd890'; c.lineWidth = 1; c.strokeRect(x - 8.5, y - 8.5, 17, 17);
          }
          if (cell.kind === 'blue' || cell.kind === 'yellow') {
            c.fillStyle = cell.kind === 'blue' ? '#3a7ad8' : '#e8c040'; c.fillRect(x - S / 2 + 4, y - S / 2 + 4, 8, S - 8); c.fillRect(x + S / 2 - 12, y - S / 2 + 4, 8, S - 8);
          }
          if (cell.kind === 'ore') {
            c.fillStyle = '#6a4a2a'; c.beginPath(); c.moveTo(x - 14, y + 12); c.lineTo(x, y - 10); c.lineTo(x + 14, y + 12); c.fill();
            c.fillStyle = '#ffb040'; c.fillRect(x - 4, y - 2, 4, 4); c.fillRect(x + 3, y + 4, 4, 4);
          }
          ui.hit(x - S / 2, y - S / 2, S, S, () => { this.cur = i; this.act(); });
        });
        this.s.carts.forEach((cart, ci) => {
          const [x, y] = ctr(cart.i), sel = ci === this.sel;
          c.fillStyle = sel ? '#ffd890' : '#5a5e68'; c.fillRect(x - 15, y - 12, 30, 22);
          c.fillStyle = '#3a3e48'; c.fillRect(x - 13, y - 10, 26, 16);
          if (cart.loaded) { c.fillStyle = '#ff9a3a'; c.fillRect(x - 11, y - 14, 22, 8); c.fillStyle = '#ffd890'; c.fillRect(x - 6, y - 14, 6, 4); }
          c.fillStyle = '#1a1a20'; c.beginPath(); c.arc(x - 9, y + 11, 4, 0, Math.PI * 2); c.arc(x + 9, y + 11, 4, 0, Math.PI * 2); c.fill();
        });
        const [cx, cy] = ctr(this.cur);
        c.strokeStyle = this.sel >= 0 ? '#ffd040' : (Math.sin(t * 6) > 0 ? '#ffffff' : '#a8c8ff'); c.lineWidth = 2; c.strokeRect(cx - S / 2 + 1.5, cy - S / 2 + 1.5, S - 3, S - 3);
        const msg = this.done ? 'Все вагонетки у своих упоров!' : this.sel >= 0 ? 'Стрелкой толкните вагонетку по рельсам.' : 'Пустые вагонетки к синим упорам, гружёные к жёлтым. Руда грузит и разгружает.';
        ui.text(msg, W / 2, 402, { align: 'center', size: 12, bold: !!this.done, col: this.done ? '#ffd890' : '#e8f0ff' });
        ui.text('Ходов: ' + this.moves, W / 2, 418, { align: 'center', size: 10, col: '#c8b898' });
        ui.hints([['←↑→↓', 'Курсор/толчок'], ['Enter', 'Вагонетка/стрелка'], ['R', 'Сначала'], ['Esc', 'Выйти']], W / 2, 452, { align: 'center' });
      },
      key(k, code) {
        if (this.done) return;
        if (k === 'back') { if (this.sel >= 0) { this.sel = -1; return; } this.finish(false); return; }
        if (k === 'ok' || code === 'KeyE') { this.act(); return; }
        if (code === 'KeyR') { this.reset(); return; }
        const dir = { up: 0, right: 1, down: 2, left: 3 }[k];
        if (dir !== undefined) this.move(dir);
      }
    });
  }

  if (H.UI) Object.assign(H.UI.prototype, { openCarts });
  H.Carts = { PUZZLES, build, startState, active, push, toggle, solved, solve };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
