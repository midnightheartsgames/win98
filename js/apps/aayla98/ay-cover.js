(function (A) {
  'use strict';
  const C = A.Cover = {
    def(S) {
      return S.cover ? A.COVERS[S.cover.id] : null;
    },
    start(S, id) {
      if (!A.COVERS[id]) throw new Error('no cover ' + id);
      if (!S.cover || S.cover.id !== id) S.cover = { id, sus: 0, exposed: false };
      return S.cover;
    },
    add(S, n, why) {
      const c = S.cover;
      if (!c || c.exposed) return null;
      c.sus = A.clamp(c.sus + n, 0, 100);
      if (c.sus >= 100) c.exposed = true;
      return { sus: c.sus, exposed: c.exposed, add: n, why: why || null };
    },
    tick(S, dt) {
      const c = S.cover, d = C.def(S);
      if (!c || c.exposed) return null;
      c.sus = Math.max(0, c.sus - d.decay * dt);
      if (!d.stingy) return null;
      if ((S.flags.spent || 0) !== (c.spent || 0)) {
        c.spent = S.flags.spent || 0;
        c.idle = 0;
      }
      c.idle = (c.idle || 0) + dt;
      if (c.idle < d.stingy.every) return null;
      c.idle = 0;
      return C.add(S, d.stingy.add, 'stingy');
    },
    got(S) {
      const d = C.def(S);
      return d ? d.intel.filter(([k]) => S.flags[k]).length : 0;
    },
    done(S) {
      const d = C.def(S);
      return !!d && d.intel.every(([k]) => S.flags[k]);
    },
    end(S) {
      if (!S.cover) return;
      S.flags['cover_' + S.cover.id] = S.cover.exposed ? 'exposed' : 'clean';
      S.cover = null;
    },
    WHY: {
      seen: 'служанке здесь нечего делать',
      force: 'Сила на чужих глазах',
      screen: 'её заметили у ширмы',
      duty: 'работа по роли',
      lie: 'лекку выдали ложь',
      word: 'слова не по роли',
      stingy: 'наследница не тратит денег'
    },
    why(S, k) {
      const d = C.def(S);
      return (d && d.why && d.why[k]) || C.WHY[k];
    }
  };

  const SIDES = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const BASE = { I: 5, L: 3, T: 7 };
  const R = A.Repair = {
    cells(def) {
      return def.solved.map(row => row.split(' '));
    },
    start(id) {
      const def = A.REPAIRS[id], shift = def.shift.map(r => r.split(' ').map(Number));
      return R.cells(def).map((row, y) => row.map((c, x) => (+c[1] + shift[y][x]) % 4));
    },
    type(def, x, y) {
      return R.cells(def)[y][x][0];
    },
    mask(type, rot) {
      let m = BASE[type];
      for (let i = 0; i < rot; i++) m = ((m << 1) | (m >> 3)) & 15;
      return m;
    },
    open(def, rot, x, y, side) {
      return !!(R.mask(R.type(def, x, y), rot[y][x]) & (1 << side));
    },
    lit(def, rot) {
      const seen = new Set(), todo = [];
      if (R.open(def, rot, 0, def.from, 3)) {
        seen.add('0,' + def.from);
        todo.push([0, def.from]);
      }
      while (todo.length) {
        const [x, y] = todo.pop();
        for (let side = 0; side < 4; side++) {
          if (!R.open(def, rot, x, y, side)) continue;
          const nx = x + SIDES[side][0], ny = y + SIDES[side][1];
          if (nx < 0 || ny < 0 || nx >= def.w || ny >= def.h || seen.has(nx + ',' + ny)) continue;
          if (!R.open(def, rot, nx, ny, (side + 2) % 4)) continue;
          seen.add(nx + ',' + ny);
          todo.push([nx, ny]);
        }
      }
      return seen;
    },
    solved(def, rot) {
      return R.lit(def, rot).has((def.w - 1) + ',' + def.to) && R.open(def, rot, def.w - 1, def.to, 1);
    },
    turn(rot, x, y) {
      rot[y][x] = (rot[y][x] + 1) % 4;
    },
    solve(def, rot) {
      const want = rot.map(r => r.slice()), used = new Set();
      const go = (x, y, from) => {
        const key = x + ',' + y;
        if (used.has(key)) return false;
        used.add(key);
        const t = R.type(def, x, y);
        for (let k = 0; k < 4; k++) {
          const r = (rot[y][x] + k) % 4, m = R.mask(t, r);
          if (!(m & (1 << from))) continue;
          want[y][x] = r;
          if (x === def.w - 1 && y === def.to && (m & 2)) return true;
          for (let side = 0; side < 4; side++) {
            if (side === from || !(m & (1 << side))) continue;
            const nx = x + SIDES[side][0], ny = y + SIDES[side][1];
            if (nx < 0 || ny < 0 || nx >= def.w || ny >= def.h) continue;
            if (go(nx, ny, (side + 2) % 4)) return true;
          }
        }
        used.delete(key);
        want[y][x] = rot[y][x];
        return false;
      };
      if (!go(0, def.from, 3)) return null;
      const clicks = [];
      for (let y = 0; y < def.h; y++) for (let x = 0; x < def.w; x++) for (let k = 0; k < (want[y][x] - rot[y][x] + 4) % 4; k++) clicks.push([x, y]);
      return clicks;
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
