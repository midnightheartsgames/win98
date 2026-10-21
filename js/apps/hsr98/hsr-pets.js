(function (H) {
  'use strict';

  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const BACK = { up: 'down', down: 'up', left: 'right', right: 'left' };
  const PET_TUNE = { speed: 5.2, rush: 0.45, flyFrom: 3, lost: 9, sleepAfter: 24, lazySleep: 9, actMin: 3.5, actRand: 4.5, sayFor: 1.8 };

  const PETS = {
    chomusuke: {
      name: 'Чомусуке', kind: 'Питомец', price: 1200, home: 'ax_mansion', scene: 'mansion', fly: true, fire: true,
      look: { fur: '#654a55', shade: '#523c47', dark: '#3c2a34', light: '#7c606b', eye: '#f5eb9d', nose: '#e8a0a8', mark: '#c43a62', wing: '#44344a', wingHi: '#5e4a62', ear: '#7a5662' },
      text: 'Чёрная кошка с крылышками летучей мыши и красным крестом на лбу, фамильяр Мегумин из Акселя. Мегумин клянётся, что это самая обычная кошка. Обычные кошки не летают и не чихают огнём, но спорить с Мегумин себе дороже. У Чомусуке теперь есть проездной Экспресса: она ходит за тем, кто ведёт отряд.',
      habits: [
        'Ходит за лидером отряда. Если отстанет, догоняет на крыльях.',
        'Когда отряд долго стоит на месте, сворачивается клубком и спит.',
        'Иногда чихает огнём и делает вид, что ничего не было.',
        'Шипит на Акву и держится от неё на два шага.',
        'Ластится к Мегумин. При Казуме засыпает втрое быстрее.'
      ],
      likes: ['megumin', 'kazuma'], fears: ['aqua'], lazy: ['kazuma'],
      acts: [['groom', 3], ['look', 3], ['wander', 2], ['yawn', 2], ['sneeze', 1]],
      purr: ['Мрр.', 'Мур-р-р...', 'Мяу!', 'Мя?', 'Мрр-мяу.'],
      hiss: ['Ш-ш-ш!', 'Фш-ш!'],
      sleepy: ['Мя-а...'],
      leader: {
        megumin: ['Мегумин: «Хорошая кошка. Самая обычная кошка, слышите?»', 'Мегумин: «Чомусуке, не чихай огнём при людях.»'],
        kazuma: ['Казума: «Опять огонь из пасти. Мегумин, это точно кошка?»', 'Казума: «Спит больше меня. Уважаю.»'],
        aqua: ['Аква: «Она опять меня царапает! Я богиня, между прочим!»', 'Аква: «Тёмная аура, я же чувствую! Отойди от неё!»'],
        darkness: ['Даркнесс: «Если она меня поцарапает, я… я не против.»']
      }
    }
  };

  const ACT_TIME = { groom: 2.4, look: 1.6, yawn: 1.3, sneeze: 1.1, hiss: 1.3, love: 1.6, pet: 1.8, wake: 1.2 };

  Object.assign(H.Game.prototype, {
    ownsPet(id) { return !!PETS[id] && this.state.pets.includes(id); },
    petOut() { const id = this.state.pet; return id && this.ownsPet(id) ? id : null; },
    buyPet(id) {
      const s = this.state, d = PETS[id];
      if (!d || this.ownsPet(id) || s.jade < d.price) return false;
      s.jade -= d.price;
      s.pets.push(id);
      return true;
    },
    setPet(id) {
      if (id != null && !this.ownsPet(id)) return false;
      this.state.pet = id || null;
      this.pet = null;
      return true;
    },
    petStats(id) { return this.state.petLog[id] || (this.state.petLog[id] = { steps: 0, pets: 0 }); },
    petLeader() { return this.kitOf(this.state.party[0]); },
    petHidden(id) { return !!(this.state.su || this.map.id === PETS[id].home); },

    petSpawn(id) {
      const p = this.player, [bx, by] = DIRS[BACK[p.dir]];
      const tries = [[by, bx], [-by, -bx], [bx, by], [0, 1], [0, -1], [1, 0], [-1, 0]];
      let at = [p.x, p.y];
      for (const [dx, dy] of tries) if (!this.petBlocked(p.x + dx, p.y + dy)) { at = [p.x + dx, p.y + dy]; break; }
      return { id, map: this.map.id, x: at[0], y: at[1], fx: at[0], fy: at[1], ox: at[0], oy: at[1], prog: 1, dir: p.dir, px: p.x, py: p.y, trail: [], still: 0, act: null, actT: 0, next: 2, fly: false, say: null, sayT: 0, t: 0 };
    },

    petBlocked(x, y) {
      if (this.blocked(x, y)) return true;
      return this.map.ents.some(e => e.x === x && e.y === y && (e.kind === 'exit' || e.kind === 'trigger') && this.visible(e));
    },

    petGap(id) { return PETS[id].fears.includes(this.petLeader()) ? 2 : 1; },

    updatePet(dt) {
      const id = this.petOut();
      if (!id || !this.map || this.petHidden(id)) { this.pet = null; return; }
      const p = this.player, d = PETS[id];
      let a = this.pet;
      if (!a || a.id !== id || a.map !== this.map.id || Math.abs(a.x - p.x) + Math.abs(a.y - p.y) > PET_TUNE.lost) a = this.pet = this.petSpawn(id);
      a.t += dt;
      if (a.sayT > 0 && (a.sayT -= dt) <= 0) a.say = null;
      if (a.px !== p.x || a.py !== p.y) {
        if (!(a.px === a.x && a.py === a.y && a.prog >= 1)) a.trail.push([a.px, a.py]);
        a.px = p.x; a.py = p.y; a.still = 0;
        if (a.act === 'sleep' || a.act === 'pet' || a.act === 'love') a.act = null;
      } else if (!p.moving && !this.busy()) a.still += dt;
      const gap = this.petGap(id);
      if (a.prog < 1) {
        const back = Math.max(0, a.trail.length - gap + 1);
        a.prog = Math.min(1, a.prog + dt * PET_TUNE.speed * (1 + back * PET_TUNE.rush) * (this.speedMul ? this.speedMul() : 1));
        a.fx = a.ox + (a.x - a.ox) * a.prog; a.fy = a.oy + (a.y - a.oy) * a.prog;
        if (a.prog >= 1) { a.fx = a.x; a.fy = a.y; if (a.walked) this.petStats(id).steps++; a.walked = false; }
        return;
      }
      while (a.trail.length && a.trail[0][0] === a.x && a.trail[0][1] === a.y) a.trail.shift();
      if (a.trail.length >= gap) {
        const [nx, ny] = a.trail.shift();
        if (nx === p.x && ny === p.y) return;
        this.petStep(a, nx, ny, true);
        a.fly = d.fly && a.trail.length >= PET_TUNE.flyFrom;
        a.act = null;
        return;
      }
      a.fly = false;
      this.petIdle(a, d, dt);
    },

    petStep(a, nx, ny, follow) {
      const dx = nx - a.x, dy = ny - a.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) { a.x = a.fx = a.ox = nx; a.y = a.fy = a.oy = ny; a.prog = 1; return; }
      a.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      a.ox = a.x; a.oy = a.y; a.x = nx; a.y = ny; a.prog = 0; a.walked = follow;
    },

    petFace(a) {
      const p = this.player, dx = p.x - a.x, dy = p.y - a.y;
      if (dx || dy) a.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    },

    petIdle(a, d, dt) {
      if (a.act) {
        if (a.act === 'sleep') return;
        a.actT -= dt;
        if (a.actT > 0) return;
        a.act = null;
      }
      const lead = this.petLeader(), sleepAt = d.lazy.includes(lead) ? PET_TUNE.lazySleep : PET_TUNE.sleepAfter;
      if (a.still >= sleepAt) { a.act = 'sleep'; a.dir = 'down'; return; }
      if (a.still > 0.4 && a.still < 0.6) this.petFace(a);
      a.next -= dt;
      if (a.next > 0) return;
      a.next = PET_TUNE.actMin + this.rng() * PET_TUNE.actRand;
      if (this.busy()) return;
      const near = Math.abs(a.x - this.player.x) + Math.abs(a.y - this.player.y) <= 2;
      if (near && d.fears.includes(lead) && this.rng() < 0.5) return this.petAct(a, 'hiss');
      if (near && d.likes.includes(lead) && this.rng() < 0.3) return this.petAct(a, 'love');
      const pool = d.acts.filter(([k]) => k !== 'sneeze' || d.fire), sum = pool.reduce((n, x) => n + x[1], 0);
      let r = this.rng() * sum, kind = pool[0][0];
      for (const [k, w] of pool) { if ((r -= w) < 0) { kind = k; break; } }
      if (kind === 'wander') return this.petWander(a);
      if (kind === 'look') a.dir = this.rng.pick(['left', 'right', 'down', 'up']);
      this.petAct(a, kind);
    },

    petAct(a, kind) {
      const d = PETS[a.id];
      a.act = kind; a.actT = ACT_TIME[kind] || 1.5;
      if (kind === 'hiss') { this.petFace(a); this.petSay(a, this.rng.pick(d.hiss)); this.emit({ t: 'sfx', id: 'hiss' }); }
      else if (kind === 'love') { this.petFace(a); this.petSay(a, this.rng.pick(d.purr)); }
      else if (kind === 'sneeze') { a.dir = 'down'; this.emit({ t: 'sfx', id: 'sneeze' }); }
      else if (kind === 'yawn' || kind === 'groom') a.dir = 'down';
    },

    petSay(a, text) { a.say = text; a.sayT = PET_TUNE.sayFor; },

    petWander(a) {
      const p = this.player, opts = [];
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = a.x + dx, ny = a.y + dy, dist = Math.abs(nx - p.x) + Math.abs(ny - p.y);
        if (dist >= 1 && dist <= 2 && !(nx === p.x && ny === p.y) && !this.petBlocked(nx, ny)) opts.push([nx, ny]);
      }
      if (!opts.length) return;
      const [nx, ny] = this.rng.pick(opts);
      this.petStep(a, nx, ny, false);
    },

    petFront() {
      const a = this.pet;
      if (!a || a.prog < 1 || this.busy() || this.player.moving) return null;
      const [fx, fy] = this.front();
      return a.x === fx && a.y === fy ? a : null;
    },

    petTouch(fx, fy) {
      const a = this.pet;
      if (!a || a.prog < 1 || a.x !== fx || a.y !== fy) return false;
      const d = PETS[a.id], lead = this.petLeader(), st = this.petStats(a.id);
      a.dir = BACK[this.player.dir];
      a.still = 0;
      if (a.act === 'sleep') {
        a.act = 'wake'; a.actT = ACT_TIME.wake;
        this.petSay(a, this.rng.pick(d.sleepy));
        this.emit({ t: 'sfx', id: 'meow' });
        return true;
      }
      st.pets++;
      if (d.fears.includes(lead)) {
        a.act = 'hiss'; a.actT = ACT_TIME.hiss;
        this.petSay(a, this.rng.pick(d.hiss));
        this.emit({ t: 'sfx', id: 'hiss' });
      } else {
        a.act = 'pet'; a.actT = ACT_TIME.pet;
        this.petSay(a, this.rng.pick(d.purr));
        this.emit({ t: 'sfx', id: 'purr' });
      }
      const lines = d.leader[lead];
      if (lines && st.pets % 3 === 1) this.toast(this.rng.pick(lines));
      return true;
    }
  });

  Object.assign(H, { PETS, PET_TUNE });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
