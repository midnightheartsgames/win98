(function (H) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  class Match {
    constructor(difficulty = 'normal') {
      this.difficulty = difficulty; this.score = [0, 0]; this.shots = [0, 0];
      this.period = 1; this.time = 60; this.phase = 'faceoff'; this.delay = 1.5;
      this.message = 'ВБРАСЫВАНИЕ'; this.event = ''; this.selected = 0; this.reset();
    }
    reset() {
      this.players = [];
      for (let team = 0; team < 2; team++) for (let i = 0; i < 4; i++) {
        this.players.push({ team, goalie: i === 3, number: [9, 17, 24, 1][i],
          x: team ? 900 - [430, 305, 240, 69][i] : [430, 305, 240, 69][i],
          y: [270, 145, 395, 270][i], vx: 0, vy: 0, dx: team ? -1 : 1, dy: 0, cooldown: .5, stun: 0 });
      }
      this.puck = { x: 450, y: 270, vx: 0, vy: 0, owner: null, lock: .2, last: 0 };
      this.selected = 0;
    }
    switchPlayer() {
      const p = this.puck;
      this.selected = p.owner !== null && this.players[p.owner].team === 0 ? p.owner :
        [0, 1, 2].sort((a, b) => distance(this.players[a], p) - distance(this.players[b], p))[0];
    }
    release(index, x, y, speed) {
      const p = this.players[index], puck = this.puck, d = Math.hypot(x - p.x, y - p.y) || 1;
      puck.owner = null; puck.x = p.x + (x - p.x) / d * 20; puck.y = p.y + (y - p.y) / d * 20;
      puck.vx = (x - p.x) / d * speed + p.vx * .2; puck.vy = (y - p.y) / d * speed + p.vy * .2;
      puck.lock = .16; puck.last = p.team; p.cooldown = .4;
    }
    shoot(index, aim = 0) {
      if (this.phase !== 'play' || this.puck.owner !== index) return;
      const p = this.players[index]; this.release(index, p.team ? 36 : 864, 270 + aim * 33, 620);
      this.shots[p.team]++; this.event = 'shot';
    }
    action(pass = false) {
      if (this.phase !== 'play') return;
      const i = this.selected, p = this.players[i];
      if (this.puck.owner === i) {
        if (pass) {
          const teammate = [0, 1, 2].filter(n => n !== i).sort((a, b) => distance(this.players[a], p) - distance(this.players[b], p))[0];
          this.release(i, this.players[teammate].x, this.players[teammate].y, 370); this.selected = teammate; this.event = 'pass';
        } else this.shoot(i, p.dy);
      } else if (pass) this.switchPlayer();
      else if (p.cooldown <= 0) {
        p.cooldown = .7; this.event = 'check';
        for (let j = 4; j < 7; j++) if (distance(p, this.players[j]) < 48) {
          this.players[j].stun = .65;
          if (this.puck.owner === j) { this.puck.owner = i; this.selected = i; }
        }
      }
    }
    step(dt, keys = {}) {
      if (this.phase === 'final') return;
      if (this.phase !== 'play') {
        this.delay -= dt;
        if (this.delay <= 0) { this.phase = 'play'; this.message = ''; }
        return;
      }
      this.time = Math.max(0, this.time - dt);
      if (this.time <= 0) {
        this.event = 'whistle';
        if (this.period === 3) { this.phase = 'final'; this.message = this.score[0] === this.score[1] ? 'НИЧЬЯ' : this.score[0] > this.score[1] ? 'ПОБЕДА!' : 'МАТЧ ОКОНЧЕН'; }
        else { this.period++; this.time = 60; this.reset(); this.phase = 'faceoff'; this.delay = 2.5; this.message = 'ПЕРИОД ' + this.period; }
        return;
      }
      const puck = this.puck; puck.lock = Math.max(0, puck.lock - dt);
      const chasers = [0, 1].map(team => this.players.map((p, i) => ({ p, i })).filter(o => o.p.team === team && !o.p.goalie && !(team === 0 && o.i === this.selected)).sort((a, b) => distance(a.p, puck) - distance(b.p, puck))[0]?.i);
      this.players.forEach((p, i) => {
        p.cooldown -= dt; p.stun = Math.max(0, p.stun - dt);
        let dx = 0, dy = 0, speed = p.team ? (this.difficulty === 'easy' ? 124 : this.difficulty === 'hard' ? 179 : 153) : 167;
        if (p.goalie) { dx = (p.team ? 823 : 77) - p.x; dy = clamp(puck.y, 233, 307) - p.y; speed = 150; }
        else if (i === this.selected) {
          dx = (+!!(keys.ArrowRight || keys.KeyD)) - (+!!(keys.ArrowLeft || keys.KeyA));
          dy = (+!!(keys.ArrowDown || keys.KeyS)) - (+!!(keys.ArrowUp || keys.KeyW));
          if (keys.ShiftLeft || keys.ShiftRight) speed = 215;
        } else if (puck.owner === i) {
          dx = (p.team ? 110 : 790) - p.x; dy = 270 - p.y;
          if (Math.abs(dx) < 310 && p.cooldown <= 0) this.shoot(i, Math.sin(this.time * 3) * .85);
        } else {
          const teammateOwns = puck.owner !== null && this.players[puck.owner].team === p.team;
          let tx, ty;
          if (i === chasers[p.team] && !teammateOwns) { tx = puck.x; ty = puck.y; }
          else { tx = clamp(puck.x + (p.team ? -1 : 1) * (teammateOwns ? 110 : -135), 150, 750); ty = i % 4 === 1 ? 145 : 395; }
          dx = tx - p.x; dy = ty - p.y;
        }
        const len = Math.hypot(dx, dy), moving = len > (i === this.selected ? 0 : 5);
        if (moving && !p.stun) { dx /= len; dy /= len; if (!p.goalie) { p.dx = dx; p.dy = dy; } }
        else { dx = 0; dy = 0; }
        const ease = 1 - Math.exp(-dt * 6);
        p.vx += (dx * speed - p.vx) * ease; p.vy += (dy * speed - p.vy) * ease;
        p.x = clamp(p.x + p.vx * dt, 52, 848); p.y = clamp(p.y + p.vy * dt, 52, 488);
      });
      // Separate skaters and allow a close defender to poke the puck loose.
      for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) {
        const p = this.players[a], q = this.players[b], d = distance(p, q);
        if (d > 0 && d < 24) {
          const overlap = (24 - d) / 2, dx = (p.x - q.x) / d, dy = (p.y - q.y) / d;
          p.x += dx * overlap; p.y += dy * overlap; q.x -= dx * overlap; q.y -= dy * overlap;
        }
        if (d < 32 && p.team !== q.team && puck.lock <= 0 && (puck.owner === a || puck.owner === b)) {
          const index = puck.owner === a ? b : a, defender = this.players[index];
          if (!defender.stun && defender.cooldown <= 0) {
            puck.owner = index; puck.lock = .7; defender.cooldown = .7;
            if (defender.team === 0 && !defender.goalie) this.selected = index;
          }
        }
      }
      this.players.forEach(p => { p.x = clamp(p.x, 52, 848); p.y = clamp(p.y, 52, 488); });
      if (puck.owner !== null) {
        const p = this.players[puck.owner]; puck.x = p.x + p.dx * 18; puck.y = p.y + p.dy * 18;
        if (p.goalie && p.cooldown <= 0) this.release(puck.owner, 450, 170 + (this.time % 2) * 100, 370);
      } else {
        puck.x += puck.vx * dt; puck.y += puck.vy * dt;
        puck.vx *= Math.exp(-dt * .38); puck.vy *= Math.exp(-dt * .38);
        if ((puck.x < 42 || puck.x > 858) && puck.y > 226 && puck.y < 314) {
          const team = puck.x > 858 ? 0 : 1; this.score[team]++; this.event = 'goal';
          this.reset(); this.phase = 'faceoff'; this.delay = 2.7; this.message = team === 0 ? 'ГОООЛ! • MOSCOW' : 'ГОЛ • DETROIT'; return;
        }
        if (puck.x < 42 || puck.x > 858) { puck.x = clamp(puck.x, 42, 858); puck.vx *= -.8; }
        if (puck.y < 42 || puck.y > 498) { puck.y = clamp(puck.y, 42, 498); puck.vy *= -.8; }
        if (puck.lock <= 0) {
          const candidates = this.players.map((p, i) => ({ p, i })).filter(o => !o.p.stun && o.p.cooldown <= 0 && distance(o.p, puck) < (o.p.goalie ? 25 : 19)).sort((a, b) => distance(a.p, puck) - distance(b.p, puck));
          if (candidates.length) {
            const { p, i } = candidates[0]; puck.owner = i; puck.vx = puck.vy = 0; puck.lock = .25;
            if (p.goalie) { p.cooldown = .55; this.event = 'save'; }
            else if (p.team === 0) this.selected = i;
          }
        }
      }
    }
  }
  H.Match = Match;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hockey98 = globalThis.Hockey98 || {});
