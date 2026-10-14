(function (W) {
  'use strict';
  const D = W.Data;

  class Bot {
    constructor(game, opts = {}) {
      this.g = game; this.opts = opts;
      this.path = null; this.goal = null; this.replan = 0; this.stuck = 0; this.lastPos = null; this.useCooldown = 0; this.jitter = 0;
      this.visited = new Set();
    }

    passable(x, y, keys) {
      const g = this.g, L = g.level;
      if (x < 0 || y < 0 || x >= L.w || y >= L.h) return false;
      const k = y * L.w + x;
      if (L.solid[k]) return false;
      const di = L.doorAt[k];
      if (di >= 0) { const d = L.doors[di]; if (d.lock && !keys[d.lock - 1]) return false; }
      const si = L.statAt[k];
      if (si >= 0 && L.statics[si].active && L.statics[si].block) return false;
      const pw = g.pushwall;
      if (pw && ((x === pw.x && y === pw.y) || (x === pw.x + pw.dx && y === pw.y + pw.dy))) return false;
      return true;
    }

    bfs(targetFn, keys = this.g.keys) {
      const g = this.g, L = g.level, sx = g.tileX, sy = g.tileY;
      const prev = new Int32Array(L.w * L.h).fill(-2);
      const q = [sy * L.w + sx]; prev[q[0]] = -1;
      for (let qi = 0; qi < q.length; qi++) {
        const k = q[qi], x = k % L.w, y = (k / L.w) | 0;
        if (targetFn(x, y, k)) {
          const path = [];
          for (let c = k; c !== -1; c = prev[c]) path.push(c);
          return path.reverse();
        }
        for (const [dx, dy] of W.Level.DIRS4) {
          const nx = x + dx, ny = y + dy, nk = ny * L.w + nx;
          if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h || prev[nk] !== -2) continue;
          if (!this.passable(nx, ny, keys)) continue;
          prev[nk] = k; q.push(nk);
        }
      }
      return null;
    }

    exitTiles() {
      const L = this.g.level, out = [];
      for (let k = 0; k < L.w * L.h; k++) if (L.exitAt[k] && L.solid[k] && (this.opts.secret ? L.exitAt[k] === 2 : true)) out.push(k);
      if (this.opts.secret === false) return out.filter(k => L.exitAt[k] === 1);
      return out;
    }

    pickGoal() {
      const g = this.g, L = g.level;
      const exits = this.exitTiles();
      const nearExit = (x, y) => exits.some(k => { const ex = k % L.w, ey = (k / L.w) | 0; return Math.abs(ex - x) + Math.abs(ey - y) === 1; });
      const boss = g.actors.find(a => a.def.boss && a.state !== 'dead' && a.state !== 'die');
      if (g.ammo < 10 || g.health < 40) {
        const need = L.statics.filter(s => s.active && s.pick && ((g.ammo < 10 && D.PICKUPS[s.pick].ammo) || (g.health < 40 && D.PICKUPS[s.pick].heal >= 10)));
        if (need.length) {
          const p = this.bfs((x, y) => need.some(s => s.x === x && s.y === y));
          if (p && p.length < 40) return { kind: 'supply', path: p };
        }
      }
      if (this.opts.items) {
        const want = L.statics.filter(s => s.active && s.pick && (D.PICKUPS[s.pick].treasure || D.PICKUPS[s.pick].key || D.PICKUPS[s.pick].weapon));
        if (want.length) {
          const p = this.bfs((x, y) => want.some(s => s.x === x && s.y === y));
          if (p) return { kind: 'item', path: p };
        }
      }
      let p = this.bfs(nearExit);
      if (p) return { kind: 'exit', path: p };
      const keyItems = L.statics.filter(s => s.active && (s.pick === 'key1' || s.pick === 'key2'));
      if (keyItems.length) {
        p = this.bfs((x, y) => keyItems.some(s => s.x === x && s.y === y));
        if (p) return { kind: 'key', path: p };
      }
      if (boss) {
        p = this.bfs((x, y) => Math.abs(x - Math.floor(boss.x)) + Math.abs(y - Math.floor(boss.y)) <= 2);
        if (p) return { kind: 'boss', path: p };
      }
      for (let k = 0; k < L.w * L.h; k++) {
        if (!L.push[k]) continue;
        const x = k % L.w, y = (k / L.w) | 0;
        p = this.bfs((tx, ty) => Math.abs(tx - x) + Math.abs(ty - y) === 1 && this.pushFree(x, y, x - tx, y - ty));
        if (p) return { kind: 'push', path: p, push: [x, y] };
      }
      return null;
    }

    pushFree(x, y, dx, dy) {
      const L = this.g.level, nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) return false;
      return !L.solid[ny * L.w + nx] && L.doorAt[ny * L.w + nx] < 0;
    }

    target() {
      const g = this.g;
      let best = null, bd = 12;
      for (const a of g.actors) {
        if (a.state === 'dead' || a.state === 'die' || a.def.invulnerable) continue;
        const d = Math.hypot(a.x - g.px, a.y - g.py);
        if (d < bd && g.lineClear(g.px, g.py, a.x, a.y)) { bd = d; best = a; }
      }
      return best;
    }

    input() {
      const g = this.g, inp = { fwd: 0, strafe: 0, turn: 0, mouseTurn: 0, run: false, fire: false, use: false, weapon: -1 };
      if (g.mode !== 'play') return inp;
      const L = g.level;
      const best = g.weapons[3] ? 3 : g.weapons[2] ? 2 : 1;
      if (g.weapon !== best && g.ammo > 0 && !g.atk) inp.weapon = best;
      let enemy = this.target();
      if (enemy && g.ammo <= 0 && Math.hypot(enemy.x - g.px, enemy.y - g.py) > 1.4) enemy = null;
      if (enemy && !this.opts.pacifist) {
        const want = Math.atan2(enemy.y - g.py, enemy.x - g.px);
        let d = want - g.angle; d = Math.atan2(Math.sin(d), Math.cos(d));
        inp.mouseTurn = Math.max(-0.12, Math.min(0.12, d));
        if (Math.abs(d) < 0.1) inp.fire = (g.time & 1) === 0 || g.weapon >= 2;
        if (Math.hypot(enemy.x - g.px, enemy.y - g.py) > 2.5 && !enemy.def.boss) return inp;
        if (enemy.def.boss && Math.hypot(enemy.x - g.px, enemy.y - g.py) < 4) return inp;
      }
      if (--this.replan <= 0 || !this.path || !this.path.length) {
        const goal = this.pickGoal();
        this.goal = goal; this.path = goal ? goal.path.slice(1) : null; this.replan = 35;
      }
      const pk = g.tileY * L.w + g.tileX;
      if (this.lastPos && Math.hypot(this.lastPos[0] - g.px, this.lastPos[1] - g.py) < 0.002) this.stuck++; else this.stuck = 0;
      this.lastPos = [g.px, g.py];
      if (this.useCooldown > 0) this.useCooldown--;
      if (!this.path || !this.path.length) {
        if (this.goal && this.goal.kind === 'exit') this.faceAndUse(inp, this.exitTiles().find(k => Math.abs(k % L.w - g.tileX) + Math.abs(((k / L.w) | 0) - g.tileY) === 1));
        else if (this.goal && this.goal.kind === 'push') this.faceAndUse(inp, this.goal.push[1] * L.w + this.goal.push[0]);
        else { inp.turn = 1; }
        return inp;
      }
      while (this.path.length && this.path[0] === pk) this.path.shift();
      if (!this.path.length) return inp;
      const nk = this.path[0], nx = nk % L.w, ny = (nk / L.w) | 0;
      const di = L.doorAt[nk];
      if (di >= 0 && L.doors[di].state !== 'open') {
        if (Math.abs(nx - g.tileX) + Math.abs(ny - g.tileY) === 1) {
          if (L.doors[di].state === 'opening') { inp.fwd = 0; return inp; }
          this.faceAndUse(inp, nk); return inp;
        }
      }
      const tx = nx + 0.5, ty = ny + 0.5;
      const want = Math.atan2(ty - g.py, tx - g.px);
      let d = want - g.angle; d = Math.atan2(Math.sin(d), Math.cos(d));
      if (!enemy) inp.mouseTurn = Math.max(-0.15, Math.min(0.15, d));
      if (Math.abs(d) < 0.6 || enemy) {
        const ca = Math.cos(g.angle), sa = Math.sin(g.angle), vx = tx - g.px, vy = ty - g.py;
        inp.fwd = Math.max(-1, Math.min(1, (vx * ca + vy * sa) * 3));
        inp.strafe = Math.max(-1, Math.min(1, (-vx * sa + vy * ca) * 3));
      }
      if (this.stuck > 20) { inp.strafe = (this.jitter++ & 32) ? 1 : -1; inp.use = (this.stuck & 15) === 0; if (this.stuck > 60) { this.path = null; this.stuck = 0; } }
      inp.run = !this.opts.walk;
      return inp;
    }

    faceAndUse(inp, k) {
      const g = this.g, L = g.level;
      if (k === undefined || k === null) return;
      const x = k % L.w, y = (k / L.w) | 0;
      const want = Math.atan2(y + 0.5 - g.py, x + 0.5 - g.px);
      const snapped = Math.round(want / (Math.PI / 2)) * (Math.PI / 2);
      let d = snapped - g.angle; d = Math.atan2(Math.sin(d), Math.cos(d));
      inp.mouseTurn = Math.max(-0.2, Math.min(0.2, d));
      const cx = g.tileX + 0.5, cy = g.tileY + 0.5;
      inp.fwd = 0;
      const ca = Math.cos(g.angle), sa = Math.sin(g.angle);
      inp.fwd = Math.max(-0.5, Math.min(0.5, ((cx - g.px) * ca + (cy - g.py) * sa) * 3));
      inp.strafe = Math.max(-0.5, Math.min(0.5, (-(cx - g.px) * sa + (cy - g.py) * ca) * 3));
      if (Math.abs(d) < 0.05 && this.useCooldown <= 0) { inp.use = true; this.useCooldown = 20; this.replan = 0; this.path = null; }
    }
  }

  W.Bot = Bot;
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
