(function (A) {
  'use strict';
  const LANES = [112, 130, 148];
  const POS = { back: 44, front: 98, party: 238, shift: 6, partyShift: 14 };
  const PARTY_LANE = [1, 0, 2];
  const CATS = { blade: 'Клинок', force: 'Сила', stance: 'Стойка', talk: 'Слово', own: 'Свой приём', items: 'Вещи', flee: 'Отход' };
  const CAT_ORDER = Object.keys(CATS);
  const ADVANTAGE = { party: 'Засада: первый ход ваш, один враг в бреши', enemy: 'Вас заметили: первый ход у врага', none: 'Встреча лицом к лицу' };
  const OUTCOME = { surrender: 'сдаётся', flee: 'бежит', info: 'выдаёт сведения и уходит', rage: 'злится: бьёт сильнее, Слово закрыто' };
  const STATUS_NAMES = { poison: 'яд', stun: 'оглушение', disarmed: 'без оружия', fear: 'страх', blind: 'ослепление', calm: 'покой', saberOff: 'клинок погас' };
  const STANCES = { evade: 'Кувырок нексу', guard: 'Защита', focus: 'Сосредоточиться: +30 % Силы' };
  const ROW = { front: 'передний ряд', back: 'задний ряд' };
  const MELEE = new Set(['blade', 'combo', 'leap', 'whirl', 'stab', 'punch', 'bite', 'bigbite']);
  const SHAPES = {
    human: { w: 48, h: 64, ax: 24, ay: 61, crop: [15, 5, 18, 18, 2], talk: [10, 0, 30, 40], chest: [0, -34], hand: [14, -29] },
    spider: { w: 32, h: 24, ax: 16, ay: 22, crop: [10, 4, 18, 18, 2], talk: [4, 0, 26, 24], chest: [4, -10], hand: [8, -9] },
    giant: { w: 80, h: 60, ax: 40, ay: 58, crop: [34, 18, 36, 36, 1], talk: [30, 10, 46, 46], chest: [8, -26], hand: [18, -20] }
  };
  const SCENES = {
    cave: { wall: ['#100c14', '#211a22', '#352a2a'], floor: ['#352c26', '#463a30', '#55473a'], crack: '#2a221c' },
    mine: { wall: ['#0c0a0e', '#1c161c', '#302626'], floor: ['#2a2420', '#38302a', '#463c32'], crack: '#221c18' }
  };
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  const flip = c => {
    const m = document.createElement('canvas');
    m.width = c.width;
    m.height = c.height;
    const g = m.getContext('2d');
    g.translate(c.width, 0);
    g.scale(-1, 1);
    g.drawImage(c, 0, 0);
    return m;
  };

  const plot = (g, a, b, fn) => {
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
    for (let i = 0; i <= n; i++) fn(Math.round(a[0] + (b[0] - a[0]) * i / n), Math.round(a[1] + (b[1] - a[1]) * i / n));
  };

  const beam = (g, a, b, glow, core) => {
    g.fillStyle = glow;
    plot(g, a, b, (x, y) => { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); });
    g.fillStyle = core;
    plot(g, a, b, (x, y) => g.fillRect(x, y, 1, 1));
  };

  A.BattleView = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.b = opts.battle;
      this.enc = opts.encounter || {};
      this.onEnd = opts.onEnd;
      this.defeats = opts.defeats || 0;
      this.sound = ui.vn ? ui.vn.sound : new A.Audio(ui);
      this.cache = new Map();
      this.vis = new Map();
      for (const u of this.b.units) this.addVis(u);
      this.fx = [];
      this.pops = [];
      this.rocks = [];
      this.queue = [];
      this.cur = null;
      this.t = 0;
      this.mode = 'intro';
      this.introT = this.b.advantage === 'none' ? 1 : 1.8;
      this.braceShown = this.b.braceUp;
      this.sel = { cat: 0, cmd: 0, tgt: 0, talk: 0, result: 0 };
      this.lastCat = {};
      this.hits = [];
      this.read = {};
      this.banner = null;
      this.talkShow = null;
      this.tl = this.b.timeline(9);
      this.queue.push(...this.b.begin());
      this.sound.sfx('ignite');
    }

    addVis(u) {
      const shape = SHAPES[u.beast] || SHAPES.human;
      const v = {
        id: u.id, side: u.side, key: u.key, name: u.name, look: u.look, beast: u.beast, weapon: u.weapon, row: u.row, slot: u.slot,
        hp: u.hp, maxhp: u.maxhp, shape, x: 0, y: 0, hx: 0, hy: 0, speed: 8, off: 0, offY: 0, alpha: 1, down: u.hp <= 0,
        anim: null, lunge: null, hurtT: 0, flash: 0, fade: 0, fall: null
      };
      this.vis.set(u.id, v);
      this.place(v, true);
      return v;
    }

    home(v) {
      if (v.side === 'party') {
        const lane = PARTY_LANE[v.slot] === undefined ? v.slot : PARTY_LANE[v.slot];
        return [POS.party + lane * POS.partyShift, LANES[lane]];
      }
      return [(v.row === 'front' ? POS.front : POS.back) - v.slot * POS.shift, LANES[v.slot]];
    }

    place(v, snap) {
      const h = this.home(v);
      v.hx = h[0];
      v.hy = h[1];
      if (snap) { v.x = h[0]; v.y = h[1]; }
    }

    dir(v) { return v.side === 'party' ? -1 : 1; }
    chest(v) { return [v.x + v.shape.chest[0] * this.dir(v), v.y + v.shape.chest[1]]; }
    hand(v) { return [v.x + v.off + v.shape.hand[0] * this.dir(v), v.y + v.offY + v.shape.hand[1]]; }

    hero() {
      const u = this.b.current();
      return u && u.side === 'party' && !this.b.over ? u : null;
    }

    sprite(v, frame) {
      const key = (v.beast || v.look) + ':' + frame + ':' + (v.weapon || '') + ':' + v.side;
      let c = this.cache.get(key);
      if (!c) {
        c = (v.beast ? A.Pix.beast(v.beast, frame) : A.Pix.battle(v.look, frame, v.weapon)).canvas();
        if (v.side === 'enemy' && !v.beast) c = flip(c);
        this.cache.set(key, c);
      }
      return c;
    }

    icon(id) {
      let c = this.cache.get('icon:' + id);
      if (!c) {
        c = A.Pix.icon(id).canvas();
        this.cache.set('icon:' + id, c);
      }
      return c;
    }

    frameOf(v) {
      if (v.down) return 'ko';
      if (v.anim && v.anim.t < v.anim.d) return v.anim.frames[Math.min(v.anim.frames.length - 1, Math.floor(v.anim.t / v.anim.d * v.anim.frames.length))];
      if (v.hurtT > 0) return 'hurt';
      return Math.floor(this.t * 2 + v.slot * 0.7) % 2 ? 'idle1' : 'idle0';
    }

    pose(v, kind, d) {
      const frames = kind === 'force' && !v.beast ? ['force0', 'force1', 'force2'] : v.beast ? ['attack0', 'attack1', 'attack2'] : ['attack0', 'attack1', 'attack2', 'attack3'];
      v.anim = { frames, t: 0, d };
    }

    say(v, text) {
      this.banner = { text: v ? `${v.name} · ${text}` : text, t: 1.4 };
    }

    pop(v, text, col, dy) {
      this.pops.push({ x: (v.x + v.off) * 2, y: (v.y - v.shape.ay - 2) * 2 + (dy || 0), text, col: col || '#ffffff', t: 0, life: 1 });
    }

    hit(v, dmg, e) {
      e = e || {};
      v.hp = Math.max(0, v.hp - dmg);
      if (e.immune) this.pop(v, e.cortosis ? 'кортозис' : 'нет урона', '#b0b0b8');
      else this.pop(v, String(dmg), e.color || (e.weak ? '#ffd040' : e.resist ? '#a0a0a8' : '#ffffff'));
      if (e.breach) this.pop(v, 'БРЕШЬ', '#ffa040', -18);
      if (dmg > 0) {
        v.hurtT = 0.3;
        v.flash = 0.08;
        const sk = e.skill && A.SKILLS[e.skill];
        this.sound.sfx(sk && sk.type === 'blade' && !v.beast ? 'clash' : 'hit');
      }
    }

    beat(e) {
      const V = id => this.vis.get(id);
      switch (e.type) {
        case 'turn': {
          this.actor = e.who;
          if (this.tl) {
            const i = this.tl.indexOf(e.who);
            this.tl = i >= 0 ? this.tl.slice(i) : [e.who].concat(this.tl);
          }
          const v = V(e.who);
          return { d: v && v.side === 'enemy' ? 0.16 : 0.04 };
        }
        case 'use': {
          const v = V(e.who), sk = A.SKILLS[e.skill];
          this.say(v, sk.name);
          if (sk.menu === 'force' || sk.menu === 'own' || e.skill === 'focus') this.pose(v, 'force', 0.5);
          return { d: 0.18 };
        }
        case 'strike': {
          const src = V(e.who), tgt = V(e.target), sk = A.SKILLS[e.skill];
          const land = () => this.hit(tgt, e.dmg, e);
          if (src.side === 'enemy') this.say(src, sk.name);
          if (e.skill === 'push') {
            this.fx.push({ kind: 'wave', from: this.hand(src), to: this.chest(tgt), t: 0, life: 0.3 });
            this.sound.sfx('force');
            return { d: 0.42, hits: [[0.72, land]] };
          }
          if (e.skill === 'vlightning') {
            this.pose(src, 'force', 0.45);
            this.fx.push({ kind: 'lightning', from: this.hand(src), to: this.chest(tgt), t: 0, life: 0.4 });
            this.sound.sfx('lightning');
            return { d: 0.46, hits: [[0.55, land]] };
          }
          if (e.skill === 'throw') {
            this.pose(src, 'attack', 0.3);
            this.fx.push({ kind: 'saber', from: this.hand(src), to: this.chest(tgt), t: 0, life: 0.42, col: (A.HEROES[src.key] || {}).blade || '#e83a2a' });
            this.sound.sfx('blade');
            return { d: 0.4, hits: [[0.5, land]] };
          }
          this.pose(src, 'attack', 0.36);
          if (MELEE.has(e.skill)) src.lunge = { t: 0, d: 0.36, dx: (tgt.x - src.x) * 0.72, arc: e.skill === 'leap' ? 18 : 0 };
          this.sound.sfx(src.beast ? 'hit' : 'blade');
          return { d: 0.4, hits: [[0.5, land]] };
        }
        case 'shot': {
          const src = V(e.who), tgt = V(e.target), from = this.hand(src), to = this.chest(tgt);
          this.say(src, 'Выстрел');
          this.pose(src, 'attack', 0.3);
          this.sound.sfx('shot');
          this.fx.push({ kind: 'bolt', from, to, t: 0, life: 0.2 });
          if (!e.deflected) return { d: 0.36, hits: [[0.55, () => this.hit(tgt, e.dmg)]] };
          return {
            d: 0.62,
            hits: [
              [0.33, () => {
                this.pose(tgt, 'attack', 0.22);
                this.sound.sfx('deflect');
                this.pop(tgt, 'отражено', '#ff9a80');
                this.fx.push({ kind: 'bolt', from: to, to: this.chest(src), t: 0, life: 0.18 });
              }],
              [0.66, () => this.hit(src, e.deflected)]
            ]
          };
        }
        case 'down': {
          const v = V(e.target);
          v.down = true;
          if (v.side === 'enemy') v.fade = 1;
          this.sound.sfx('down');
          return { d: 0.28 };
        }
        case 'move': {
          const v = V(e.target);
          v.row = e.to[0];
          v.slot = e.to[1];
          v.speed = e.how === 'advance' ? 6 : 14;
          this.place(v);
          if (e.how === 'advance') this.say(v, 'Шаг вперёд');
          return { d: 0.32 };
        }
        case 'collide': {
          const v = V(e.target);
          this.hit(v, e.dmg);
          this.pop(v, 'удар о своих', '#d8c8a8', -18);
          return { d: 0.32 };
        }
        case 'fall': {
          const v = V(e.target), where = A.HAZARDS[e.hazard] || e.hazard;
          if (e.kind === 'out') {
            v.fall = { t: 0 };
            this.pop(v, where + '!', '#ff8a6a');
            this.sound.sfx('down');
            return { d: 0.7 };
          }
          this.hit(v, e.dmg);
          this.pop(v, 'край: ' + where, '#ff8a6a', -18);
          return { d: 0.45 };
        }
        case 'collapse': {
          this.braceShown = false;
          this.sound.sfx('rocks');
          for (let i = 0; i < 26; i++) this.rocks.push({ x: 8 + (i * 37) % 70, y: 30 - (i * 13) % 40, vy: 20 + (i * 7) % 30, s: 2 + i % 3 });
          const hits = [];
          for (const [id, kind, dmg] of e.hit) {
            const v = V(id);
            if (kind === 'out') hits.push([0.55, () => { v.fade = 1; this.pop(v, 'под завалом', '#d8c8a8'); }]);
            else hits.push([0.6, () => this.hit(v, dmg)]);
          }
          return { d: 0.95, hits };
        }
        case 'summon': {
          const u = this.b.unit(e.target), v = this.vis.get(e.target) || this.addVis(u);
          v.alpha = 0;
          v.fadeIn = true;
          this.say(V(e.who), 'Зов роя');
          return { d: 0.45 };
        }
        case 'idle':
          this.say(V(e.who), A.SKILLS[e.skill].name);
          return { d: 0.3 };
        case 'evade':
          this.say(V(e.who), A.SKILLS[e.skill].name);
          this.pop(V(e.target), 'мимо', '#a8e8c8');
          return { d: 0.32 };
        case 'status':
          this.pop(V(e.target), STATUS_NAMES[e.status] || e.status, '#c8b8ff', -18);
          return { d: 0.3 };
        case 'poison':
          this.hit(V(e.target), e.dmg, { color: '#7ad86a' });
          return { d: 0.32 };
        case 'stunned':
          this.pop(V(e.who), 'оглушение: ход пропущен', '#f8e070');
          return { d: 0.5 };
        case 'resist':
          this.pop(V(e.target), 'не сдвинулся', '#d8c8a8', -18);
          return { d: 0.32 };
        case 'stance':
          this.pop(V(e.who), e.stance === 'deflect' ? `Отражение: ${e.charges}` : STANCES[e.stance] || e.stance, '#ffc8a0');
          this.fx.push({ kind: 'glow', at: V(e.who), t: 0, life: 0.4, col: e.stance === 'deflect' ? '#ff8070' : '#8ad0ff' });
          return { d: 0.3 };
        case 'reveal':
          for (const id of e.targets) this.pop(V(id), 'раскрыт', '#8ad8ff');
          this.fx.push({ kind: 'sense', t: 0, life: 0.6 });
          return { d: 0.55 };
        case 'read': {
          const v = V(e.target);
          this.read[e.target] = e.intents;
          this.pop(v, 'Прочтение', '#8ad8ff');
          this.banner = { text: `${v.name}: дальше ${e.intents.map(i => i.name.toLowerCase()).join(', ')}`, t: 2.2 };
          return { d: 0.9 };
        }
        case 'talk':
          this.talkShow = e;
          return {
            d: 0.1, wait: true,
            done: () => {
              this.talkShow = null;
              const v = V(e.target);
              if (e.outcome === 'rage') this.pop(v, 'ярость', '#ff4a3a');
              else { v.fade = 1; v.leaving = true; }
            }
          };
        case 'heal': {
          const v = V(e.target);
          v.hp = Math.min(v.maxhp, v.hp + e.amount);
          this.pop(v, '+' + e.amount, '#7ae07a');
          this.sound.sfx('heal');
          return { d: 0.35 };
        }
        case 'tempo':
          this.pop(V('aayla'), `+${e.amount} Темпа`, '#ff9a80');
          return { d: 0.3 };
        case 'cure':
          this.pop(V(e.target), 'яд снят', '#7ae07a');
          return { d: 0.3 };
        case 'escape':
          for (const v of this.vis.values()) if (v.side === 'party') { v.hx += 90; v.speed = 4; }
          this.say(null, 'Отход');
          return { d: 0.65 };
        case 'victory':
          this.say(null, 'Победа');
          return { d: 0.4 };
        case 'defeat':
          this.say(null, 'Отряд пал');
          return { d: 0.6 };
      }
      return null;
    }

    next() {
      while (!this.cur && this.queue.length) {
        const bt = this.beat(this.queue.shift());
        if (!bt) continue;
        this.cur = { t: 0, d: bt.d || 0, wait: !!bt.wait, done: bt.done, hits: (bt.hits || []).map(([at, fn]) => ({ at, fn, done: false })) };
      }
    }

    play(step) {
      this.next();
      while (this.cur) {
        const c = this.cur;
        c.t += step;
        step = 0;
        for (const h of c.hits) if (!h.done && c.t >= h.at * c.d) { h.done = true; h.fn(); }
        if (c.wait || c.t < c.d) return;
        for (const h of c.hits) if (!h.done) { h.done = true; h.fn(); }
        if (c.done) c.done();
        this.cur = null;
        this.next();
      }
      this.settle();
    }

    settle() {
      for (const u of this.b.units) {
        const v = this.vis.get(u.id) || this.addVis(u);
        v.hp = u.hp;
        v.maxhp = u.maxhp;
        if (v.row !== u.row || v.slot !== u.slot) {
          v.row = u.row;
          v.slot = u.slot;
          this.place(v);
        }
        if (u.gone && !v.fade && !v.fall) v.fade = 1;
        v.down = u.hp <= 0;
      }
      this.tl = null;
      this.actor = null;
      const over = this.b.over;
      if (over === 'win') {
        this.res = this.b.finish();
        this.mode = 'result';
        this.sound.sfx('win');
      } else if (over === 'lose') {
        this.mode = 'result';
        this.sel.result = 0;
        this.sound.sfx('lose');
      } else if (over === 'flee') {
        this.res = this.b.finish();
        this.end({ over: 'flee', res: this.res });
      } else this.openCmd();
    }

    end(r) {
      if (this.done) return;
      this.done = true;
      this.mode = 'done';
      this.onEnd(r);
    }

    cats() {
      const u = this.hero();
      if (!u) return [];
      const cmds = this.b.commands(u);
      return CAT_ORDER.map(id => ({ id, name: CATS[id], cmds: cmds.filter(c => c.menu === id) }))
        .filter(c => c.cmds.length)
        .map(c => Object.assign(c, { enabled: c.cmds.some(x => x.enabled), why: c.cmds.some(x => x.enabled) ? null : c.cmds[0].why }));
    }

    openCmd() {
      const u = this.hero();
      if (!u) return;
      this.mode = 'cmd';
      const cats = this.cats();
      this.sel.cat = Math.min(cats.length - 1, this.lastCat[u.id] || 0);
      this.sel.cmd = 0;
      this.pending = null;
    }

    cmdList() {
      const c = this.cats()[this.sel.cat];
      return c ? c.cmds : [];
    }

    targetsFor(u, cmd) {
      if (cmd.id === 'flee') return null;
      if (cmd.id.startsWith('item:')) {
        const it = A.ITEMS[cmd.id.slice(5)];
        return it.tempo ? null : this.b.heroes().map(h => h.id);
      }
      const sk = A.SKILLS[cmd.id];
      if (sk.target === 'self' || sk.target === 'none') return null;
      return this.b.targets(u, cmd.id);
    }

    choose(cmd) {
      const u = this.hero();
      this.pending = cmd;
      const list = this.targetsFor(u, cmd);
      if (!list) return this.commit(cmd.id);
      this.tgts = list.slice().sort((p, q) => this.order(p) - this.order(q));
      this.sel.tgt = 0;
      if (cmd.id.startsWith('item:') && A.ITEMS[cmd.id.slice(5)].heal) {
        let low = 2;
        this.tgts.forEach((id, i) => { const h = this.b.unit(id), r = h.hp / h.maxhp; if (r < low) { low = r; this.sel.tgt = i; } });
      }
      this.backTo = this.cmdList().length === 1 ? 'cmd' : 'skill';
      this.mode = 'target';
      this.sound.click();
    }

    order(id) {
      if (id === 'front' || id === 'frontAll') return 0;
      if (id === 'back') return 1;
      const u = this.b.unit(id);
      if (!u) return 9;
      return u.side === 'party' ? u.slot : (u.row === 'front' ? 0 : 3) + u.slot;
    }

    commit(skillId, target, extra) {
      const u = this.hero();
      if (!u) return;
      let tgt = target;
      if (tgt === undefined || tgt === null) {
        const sk = A.SKILLS[skillId];
        tgt = skillId.startsWith('item:') ? 'aayla' : sk && sk.target === 'none' ? 'none' : u.id;
      }
      this.lastCat[u.id] = this.sel.cat;
      this.actor = u.id;
      this.tl = [u.id].concat(this.b.forecast(u, skillId, 8));
      const ev = this.b.act(skillId, tgt, extra);
      this.queue.push(...ev);
      this.mode = 'play';
      this.pending = null;
      this.sound.click();
    }

    tpos(id) {
      if (id === 'front' || id === 'frontAll') return [POS.front, LANES[1]];
      if (id === 'back') return [POS.back, LANES[1]];
      const v = this.vis.get(id);
      return v ? [v.hx, v.hy] : [160, 120];
    }

    moveTarget(dx, dy) {
      const n = this.tgts.length;
      if (n < 2) return;
      const cur = this.tpos(this.tgts[this.sel.tgt]);
      let best = -1, bd = Infinity;
      this.tgts.forEach((id, i) => {
        if (i === this.sel.tgt) return;
        const p = this.tpos(id), ex = p[0] - cur[0], ey = p[1] - cur[1];
        if ((dx && Math.sign(ex) !== dx) || (dy && Math.sign(ey) !== dy)) return;
        const d = Math.abs(ex) * (dx ? 1 : 3) + Math.abs(ey) * (dy ? 1 : 3);
        if (d < bd) { bd = d; best = i; }
      });
      this.sel.tgt = best >= 0 ? best : (this.sel.tgt + (dx + dy > 0 ? 1 : -1) + n) % n;
      this.sound.blip(900);
    }

    wantsBack() {
      return this.mode === 'skill' || this.mode === 'target' || this.mode === 'talk';
    }

    key(code) {
      const up = code === 'ArrowUp' || code === 'KeyW', down = code === 'ArrowDown' || code === 'KeyS';
      const left = code === 'ArrowLeft' || code === 'KeyA', right = code === 'ArrowRight' || code === 'KeyD';
      const ok = code === 'Enter' || code === 'Space', back = code === 'Escape';
      const wrap = (i, n) => (n ? (i + n) % n : 0);
      switch (this.mode) {
        case 'intro':
          if (ok) { this.introT = 0; return true; }
          return !back;
        case 'play':
          if (ok && this.cur && this.cur.wait) { this.cur.wait = false; this.cur.t = this.cur.d; return true; }
          return !back;
        case 'cmd': {
          const cats = this.cats();
          if (up || down) { this.sel.cat = wrap(this.sel.cat + (up ? -1 : 1), cats.length); this.sel.cmd = 0; this.sound.blip(900); return true; }
          if (ok || right) {
            const c = cats[this.sel.cat];
            if (!c || !c.enabled) { this.sound.blip(300); return true; }
            if (c.cmds.length === 1 && (c.id === 'talk' || c.id === 'flee')) { this.choose(c.cmds[0]); return true; }
            this.mode = 'skill';
            this.sel.cmd = Math.max(0, c.cmds.findIndex(x => x.enabled));
            this.sound.click();
            return true;
          }
          return !back;
        }
        case 'skill': {
          const list = this.cmdList();
          if (up || down) { this.sel.cmd = wrap(this.sel.cmd + (up ? -1 : 1), list.length); this.sound.blip(900); return true; }
          if (ok || right) {
            const c = list[this.sel.cmd];
            if (!c || !c.enabled) { this.sound.blip(300); return true; }
            this.choose(c);
            return true;
          }
          if (back || left) { this.mode = 'cmd'; this.sound.blip(600); return true; }
          return true;
        }
        case 'target':
          if (up || down || left || right) { this.moveTarget(left ? -1 : right ? 1 : 0, up ? -1 : down ? 1 : 0); return true; }
          if (ok) {
            const t = this.tgts[this.sel.tgt];
            if (this.pending.id === 'talk') {
              this.talkTarget = t;
              const list = this.b.approaches(this.b.unit(t));
              this.sel.talk = Math.max(0, list.findIndex(a => a.enabled));
              this.mode = 'talk';
              this.sound.click();
              return true;
            }
            this.commit(this.pending.id, t);
            return true;
          }
          if (back) { this.mode = this.backTo; this.sound.blip(600); return true; }
          return true;
        case 'talk': {
          const list = this.b.approaches(this.b.unit(this.talkTarget));
          if (up || down) { this.sel.talk = wrap(this.sel.talk + (up ? -1 : 1), list.length); this.sound.blip(900); return true; }
          if (ok) {
            const a = list[this.sel.talk];
            if (!a.enabled) { this.sound.blip(300); return true; }
            this.commit('talk', this.talkTarget, { approach: a.id });
            return true;
          }
          if (back) { this.mode = 'target'; this.sound.blip(600); return true; }
          return true;
        }
        case 'result': {
          const opts = this.resultOptions();
          if (up || down) { this.sel.result = wrap(this.sel.result + (up ? -1 : 1), opts.length); this.sound.blip(900); return true; }
          if (ok) { opts[this.sel.result].act(); return true; }
          return !back;
        }
      }
      return false;
    }

    resultOptions() {
      if (this.b.over === 'win') return [{ label: 'Дальше', act: () => this.end({ over: 'win', res: this.res }) }];
      const opts = [{ label: 'Повторить бой', act: () => this.end({ over: 'lose', help: false }) }];
      if (A.DIFFICULTY[this.b.S.difficulty || 'normal'].help && this.defeats + 1 >= 2) opts.push({ label: 'Повторить с Помощью Силы: +25 % здоровья и Силы', act: () => this.end({ over: 'lose', help: true }) });
      return opts;
    }

    click(x, y, button) {
      if (button === 2) return this.key('Escape');
      for (let i = this.hits.length - 1; i >= 0; i--) {
        const h = this.hits[i];
        if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) { if (h.hover) h.hover(); return h.fn(); }
      }
      if (this.mode === 'intro' || this.mode === 'play' || this.mode === 'result') this.key('Enter');
    }

    hover(x, y) {
      for (let i = this.hits.length - 1; i >= 0; i--) {
        const h = this.hits[i];
        if (h.hover && x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) return h.hover();
      }
    }

    update(dt) {
      this.t += dt;
      const held = this.ui.held ? this.ui.held() : new Set();
      const step = this.mode === 'play' && (held.has('Enter') || held.has('Space')) ? dt * 3 : dt;
      if (this.mode === 'intro') {
        this.introT -= dt;
        if (this.introT <= 0) this.mode = 'play';
      }
      for (const v of this.vis.values()) {
        const k = Math.min(1, dt * v.speed);
        v.x += (v.hx - v.x) * k;
        v.y += (v.hy - v.y) * k;
        if (Math.abs(v.hx - v.x) < 0.5) v.speed = 8;
        if (v.anim) v.anim.t += step;
        if (v.lunge) {
          v.lunge.t += step;
          const f = Math.min(1, v.lunge.t / v.lunge.d), s = Math.sin(Math.PI * f);
          v.off = v.lunge.dx * s;
          v.offY = -v.lunge.arc * s;
          if (f >= 1) { v.lunge = null; v.off = 0; v.offY = 0; }
        }
        v.hurtT = Math.max(0, v.hurtT - step);
        v.flash = Math.max(0, v.flash - step);
        if (v.fadeIn) { v.alpha = Math.min(1, v.alpha + step * 3); if (v.alpha >= 1) v.fadeIn = false; }
        if (v.fade && !v.fadeIn) {
          v.fade = Math.max(0, v.fade - step * (v.leaving ? 1.2 : 1.6));
          v.alpha = Math.min(v.alpha, v.fade);
          if (v.leaving) v.hx -= dt * 50;
        }
        if (v.fall) {
          v.fall.t += step;
          v.hx = v.x = v.x - step * 40;
          v.offY = v.fall.t * v.fall.t * 260;
          v.alpha = Math.max(0, 1 - v.fall.t * 1.6);
        }
      }
      for (const f of this.fx) f.t += step;
      this.fx = this.fx.filter(f => f.t < f.life);
      for (const p of this.pops) p.t += dt;
      this.pops = this.pops.filter(p => p.t < p.life);
      for (const r of this.rocks) { r.vy += 300 * step; r.y += r.vy * step; }
      this.rocks = this.rocks.filter(r => r.y < 150);
      if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
      if (this.mode === 'play') this.play(step);
    }

    bg() {
      const scene = this.b.group.scene || 'cave', key = scene + ':' + (this.b.hazard || '');
      if (this.bgKey === key) return this.bgCanvas;
      const S = SCENES[scene] || SCENES.cave, R = new A.Art.Raster(320, 240);
      R.dither(0, 0, 320, 98, S.wall);
      R.dither(0, 96, 320, 76, S.floor);
      for (const [y, w] of [[104, 1], [114, 1], [128, 1], [146, 1], [166, 1]]) R.rect(0, y, 320, w, S.crack);
      for (let i = 0; i < 14; i++) {
        const x = (i * 53) % 320;
        R.poly([[x, 0], [x + 9, 0], [x + 4, 8 + (i * 7) % 14]], S.wall[0]);
      }
      if (scene === 'mine') {
        R.rect(0, 18, 320, 4, '#3a2a1c');
        for (let x = 30; x < 320; x += 58) R.rect(x, 18, 6, 80, '#46321f');
        R.rect(0, 160, 320, 1, '#6a6a70');
        R.rect(0, 167, 320, 1, '#6a6a70');
        for (let x = 4; x < 320; x += 12) R.rect(x, 159, 3, 10, '#3a2a1c');
        for (let i = 0; i < 7; i++) {
          const x = 20 + i * 44, y = 40 + (i * 17) % 40;
          R.poly([[x, y - 4], [x + 3, y], [x, y + 4], [x - 3, y]], '#2a7a9a');
          R.set(x, y - 1, '#a8f0ff');
        }
      } else {
        for (const [x, y] of [[276, 80], [292, 84], [284, 70]]) {
          R.rect(x, y, 14, 12, '#5a4630');
          R.rect(x, y + 5, 14, 1, '#3a2c1e');
          R.rect(x + 6, y, 1, 12, '#3a2c1e');
        }
      }
      if (this.b.hazard === 'chasm') {
        for (let y = 94; y < 172; y += 2) {
          const edge = 16 + ((y * 7) % 5) - (y > 140 ? 2 : 0);
          R.rect(0, y, edge, 2, '#040306');
          R.rect(edge, y, 1, 2, '#6a5a4a');
        }
        R.dither(0, 90, 18, 8, [S.wall[1], '#040306']);
      }
      R.rect(0, 172, 320, 68, '#08060c');
      this.bgCanvas = R.canvas();
      this.bgKey = key;
      return this.bgCanvas;
    }

    drawHazard(g) {
      const h = this.b.hazard;
      if (h === 'chasm' && this.hazardHint) {
        g.fillStyle = `rgba(255,110,70,${0.25 + 0.2 * Math.sin(this.t * 8)})`;
        g.fillRect(0, 94, 20, 78);
      }
      if (h !== 'brace') return;
      if (this.braceShown) {
        g.fillStyle = '#5a4026';
        g.fillRect(10, 58, 5, 92);
        g.fillRect(70, 58, 5, 92);
        g.fillRect(6, 56, 74, 5);
        g.fillStyle = '#3a2816';
        g.fillRect(28, 58, 1, 3);
        g.fillRect(52, 57, 1, 4);
        g.fillStyle = '#4a4040';
        for (let i = 0; i < 8; i++) g.fillRect(12 + i * 8, 50 - (i % 3) * 2, 6, 6);
        if (this.hazardHint) {
          g.fillStyle = `rgba(255,190,90,${0.25 + 0.2 * Math.sin(this.t * 8)})`;
          g.fillRect(6, 56, 74, 5);
        }
      } else {
        g.fillStyle = '#4a4040';
        for (let i = 0; i < 24; i++) g.fillRect(8 + (i * 29) % 66, 96 + (i * 17) % 50, 6 + i % 4, 4 + i % 3);
        g.fillStyle = '#5a4026';
        g.fillRect(14, 120, 30, 3);
        g.fillRect(40, 132, 26, 3);
      }
    }

    marked() {
      if (this.mode !== 'target' || !this.tgts) return new Set();
      const t = this.tgts[this.sel.tgt];
      if (t === 'front' || t === 'back') return new Set(this.b.inRow(t).map(e => e.id));
      if (t === 'frontAll') return new Set(this.b.inRow('front').map(e => e.id));
      return new Set([t]);
    }

    drawUnit(g, v, marked) {
      const s = v.shape, fr = this.frameOf(v), c = this.sprite(v, fr);
      const x = Math.round(v.x + v.off - s.ax), y = Math.round(v.y + v.offY - s.ay);
      g.globalAlpha = Math.max(0, Math.min(1, v.alpha));
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(Math.round(v.x - s.w * 0.25), Math.round(v.y - 1), Math.round(s.w * 0.5), 3);
      if (v.flash > 0) g.filter = 'brightness(260%)';
      else if (marked) g.filter = `brightness(${135 + 25 * Math.sin(this.t * 10)}%)`;
      g.drawImage(c, x, y);
      g.filter = 'none';
      const u = this.b.unit(v.id);
      if (v.side === 'party' && !v.down && u && !u.status.saberOff) {
        const p = A.Pix.POSES[fr], a = A.Pix.saberLine(p, 5)[1], b = A.Pix.saberLine(p, 22)[1];
        const col = (A.HEROES[v.key] || {}).blade || '#e83a2a';
        beam(g, [x + a[0], y + a[1]], [x + b[0], y + b[1]], col, '#fff4ee');
      }
      g.globalAlpha = 1;
    }

    drawFx(g) {
      for (const f of this.fx) {
        const k = Math.min(1, f.t / f.life);
        if (f.kind === 'bolt') {
          const p = lerp(f.from, f.to, k), d = Math.hypot(f.to[0] - f.from[0], f.to[1] - f.from[1]) || 1;
          const q = [p[0] - (f.to[0] - f.from[0]) / d * 6, p[1] - (f.to[1] - f.from[1]) / d * 6];
          beam(g, q, p, '#ff3a28', '#ffd8c8');
        } else if (f.kind === 'wave') {
          const p = lerp(f.from, f.to, k);
          g.strokeStyle = `rgba(170,220,255,${1 - k * 0.6})`;
          g.lineWidth = 1;
          for (let i = 0; i < 3; i++) {
            g.beginPath();
            g.arc(p[0] + i * 4, p[1], 4 + i * 3 + k * 4, Math.PI * 0.65, Math.PI * 1.35);
            g.stroke();
          }
        } else if (f.kind === 'lightning') {
          let prev = f.from;
          for (let i = 1; i <= 7; i++) {
            const base = lerp(f.from, f.to, i / 7), j = i === 7 ? 0 : (Math.random() - 0.5) * 10;
            const p = [base[0], base[1] + j];
            beam(g, prev, p, '#9a7aff', '#ffffff');
            prev = p;
          }
        } else if (f.kind === 'saber') {
          const p = k < 0.5 ? lerp(f.from, f.to, k * 2) : lerp(f.to, f.from, (k - 0.5) * 2), a = this.t * 30;
          beam(g, [p[0] - Math.cos(a) * 7, p[1] - Math.sin(a) * 7], [p[0] + Math.cos(a) * 7, p[1] + Math.sin(a) * 7], f.col, '#fff4ee');
        } else if (f.kind === 'glow') {
          g.strokeStyle = f.col;
          g.globalAlpha = 1 - k;
          g.beginPath();
          g.arc(f.at.x, f.at.y - f.at.shape.ay / 2, 14 + k * 8, 0, Math.PI * 2);
          g.stroke();
          g.globalAlpha = 1;
        } else if (f.kind === 'sense') {
          g.strokeStyle = `rgba(140,216,255,${1 - k})`;
          g.beginPath();
          g.arc(250, 120, 20 + k * 220, 0, Math.PI * 2);
          g.stroke();
        }
      }
      g.fillStyle = '#5a5050';
      for (const r of this.rocks) g.fillRect(Math.round(r.x), Math.round(r.y), r.s, r.s);
    }

    statusIcons(u) {
      const out = [];
      if (!u) return out;
      if (u.breach) out.push('breach');
      for (const k of ['poison', 'stun', 'fear', 'blind', 'calm', 'saberOff']) if (u.status[k]) out.push(k);
      if (u.rage) out.push('rage');
      if (u.disarmed) out.push('disarmed');
      if (u.deflect && u.deflect.charges > 0) out.push('deflect');
      if (u.evade) out.push('evade');
      if (u.guard) out.push('guard');
      return out;
    }

    drawMarks(g, marked) {
      for (const v of this.vis.values()) {
        if (v.alpha < 0.5 || v.down) continue;
        const u = this.b.unit(v.id), top = Math.round(v.y - v.shape.ay - 2);
        if (v.side === 'enemy') {
          const w = v.beast === 'giant' ? 40 : 20, x = Math.round(v.x - w / 2), y = Math.round(v.y + 3);
          g.fillStyle = '#100808';
          g.fillRect(x - 1, y - 1, w + 2, 4);
          g.fillStyle = '#d84a3a';
          g.fillRect(x, y, Math.round(w * v.hp / v.maxhp), 2);
        }
        const icons = this.statusIcons(u);
        icons.forEach((id, i) => g.drawImage(this.icon(id), Math.round(v.x - icons.length * 4 + i * 8), top - 8));
        if (marked.has(v.id)) {
          const bob = Math.round(Math.sin(this.t * 8) * 2), ax = Math.round(v.x), ay = top - 12 + bob - (icons.length ? 8 : 0);
          g.fillStyle = '#f4bf6a';
          g.fillRect(ax - 3, ay, 7, 1);
          g.fillRect(ax - 2, ay + 1, 5, 1);
          g.fillRect(ax - 1, ay + 2, 3, 1);
          g.fillRect(ax, ay + 3, 1, 1);
        }
      }
    }

    draw(gfx) {
      const lg = gfx.lg, g = gfx.g;
      this.hits = [];
      const marked = this.marked();
      const pend = this.mode === 'target' && this.pending && this.tgts ? this.tgts[this.sel.tgt] : null;
      const pu = pend && this.b.unit(pend);
      this.hazardHint = !!(this.pending && ((this.pending.id === 'push' && pu && pu.row === 'back' && this.b.hazard && this.b.hazard !== 'brace') || this.pending.id === 'brace'));
      if (this.mode === 'skill') {
        const c = this.cmdList()[this.sel.cmd];
        if (c && c.id === 'brace') this.hazardHint = true;
      }
      lg.drawImage(this.bg(), 0, 0);
      this.drawHazard(lg);
      const order = [...this.vis.values()].filter(v => v.alpha > 0.02).sort((p, q) => p.y - q.y || p.x - q.x);
      for (const v of order) this.drawUnit(lg, v, marked.has(v.id));
      this.drawFx(lg);
      this.drawMarks(lg, marked);
      gfx.present();
      this.drawHazardLabel(g);
      this.drawTimeline(g);
      this.drawPops(g);
      this.drawStrip(g);
      this.drawCommands(g);
      this.drawParty(g);
      if (this.mode === 'talk' || this.talkShow) this.drawTalk(g);
      if (this.mode === 'intro') this.drawIntro(g);
      if (this.mode === 'result') this.drawResult(g);
    }

    drawHazardLabel(g) {
      const h = this.b.hazard;
      if (!h || (h === 'brace' && !this.braceShown)) return;
      const F = A.Font, K = A.UIKit, text = A.HAZARDS[h], x = 6, y = h === 'brace' ? 90 : 166;
      const w = F.measure('text', text) + 12;
      g.fillStyle = 'rgba(10,6,8,0.75)';
      g.fillRect(x, y, w, 18);
      F.draw(g, 'text', text, x + 6, y + 1, this.hazardHint ? '#ffb090' : '#c8a890', K.SHADOW);
    }

    timelineIds() {
      const u = this.hero();
      if (this.mode === 'play' || this.mode === 'intro') return (this.tl || this.b.timeline(8)).filter(id => { const x = this.b.unit(id); return x && this.b.active(x); });
      if (!u) return this.b.timeline(8);
      let skill = null;
      if (this.mode === 'skill') { const c = this.cmdList()[this.sel.cmd]; skill = c && c.id; }
      if (this.mode === 'target' || this.mode === 'talk') skill = this.pending && this.pending.id;
      if (!skill) return this.b.timeline(8);
      return [u.id].concat(this.b.forecast(u, skill, 7));
    }

    portrait(g, v, x, y, size) {
      const c = this.sprite(v, 'idle0'), [cx, cy, cw, ch] = v.shape.crop;
      const sx = v.side === 'enemy' && !v.beast ? v.shape.w - cx - cw : cx;
      g.imageSmoothingEnabled = false;
      g.drawImage(c, sx, cy, cw, ch, x, y, size, size);
    }

    drawTimeline(g) {
      const F = A.Font, K = A.UIKit, ids = this.timelineIds().slice(0, 8), n = ids.length;
      if (!n) return;
      const W = 34, gap = 5, x0 = Math.round(320 - (n * (W + gap) - gap) / 2), y0 = 6;
      const hero = this.hero(), forecast = hero && (this.mode === 'skill' || this.mode === 'target' || this.mode === 'talk');
      F.draw(g, 'text', 'Очередь', x0 - 62, y0 + 9, '#a89a80', K.SHADOW);
      ids.forEach((id, i) => {
        const v = this.vis.get(id), u = this.b.unit(id);
        if (!v || !u) return;
        const x = x0 + i * (W + gap);
        g.fillStyle = v.side === 'party' ? '#1e3a5a' : '#4a1e1e';
        g.fillRect(x, y0, W, W);
        this.portrait(g, v, x + 1, y0 + 1, W - 2);
        let frame = '#6a5a4a';
        if (i === 0) frame = '#f4bf6a';
        if (forecast && i > 0 && id === hero.id) frame = '#ffe8a0';
        g.strokeStyle = frame;
        g.lineWidth = i === 0 || (forecast && id === hero.id) ? 2 : 1;
        g.strokeRect(x + 0.5, y0 + 0.5, W - 1, W - 1);
        if (u.ai === 'shooter' && !u.disarmed) g.drawImage(this.icon('blaster'), x + W - 9, y0 + W - 9);
        if (forecast && i > 0 && id === hero.id) F.draw(g, 'text', 'снова', x + 2, y0 + W + 1, '#ffe8a0', K.SHADOW);
      });
    }

    drawPops(g) {
      const F = A.Font, K = A.UIKit;
      if (this.banner && this.mode === 'play') {
        const t = this.banner.text, w = F.measure('bold', t) + 24, x = Math.round(320 - w / 2);
        K.bevel(g, x, 58, w, 22, 'rgba(18,12,28,0.92)', '#8a7a60', '#2a2018');
        F.draw(g, 'bold', t, x + 12, 61, K.GOLD, K.SHADOW);
      }
      for (const p of this.pops) {
        const k = p.t / p.life, a = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        g.globalAlpha = a;
        F.draw(g, 'bold', p.text, Math.round(p.x - F.measure('bold', p.text) / 2), Math.round(p.y - 24 - k * 22), p.col, '#05030a');
        g.globalAlpha = 1;
      }
    }

    known(u) {
      const k = this.b.known[u.key];
      return k || {};
    }

    targetInfo(id) {
      if (id === 'front' || id === 'back') return `${ROW[id]}: ${this.b.inRow(id).length} врага`;
      if (id === 'frontAll') return `весь передний ряд: ${this.b.inRow('front').length} врага`;
      const u = this.b.unit(id);
      if (!u) return '';
      if (u.side === 'party') return `${u.name}: здоровье ${u.hp}/${u.maxhp}`;
      const parts = [u.name, ROW[u.row], `${u.hp}/${u.maxhp}`];
      const kn = this.known(u);
      if (kn.nrav) parts.push('нрав: ' + (A.NRAV[A.ENEMIES[u.key].nrav] || 'зверь'));
      if (this.read[id]) parts.push('дальше: ' + this.read[id].map(i => i.name.toLowerCase()).join(', '));
      return parts.join(' · ');
    }

    pushHint(u) {
      if (!u) return '';
      if (u.row === 'front') return this.b.freeSlot('back', u.slot) === null ? 'ударится о стоящих сзади' : 'отлетит в задний ряд';
      if (u.weight === 'heavy' && u.pushes < 1) return 'тяжёлый: сдвинет только второй толчок';
      if (!this.b.hazard || this.b.hazard === 'brace') return 'ударится о стену';
      if (u.boss) return u.hazardCool > 0 ? 'устоял недавно: ударится о стену' : 'сорвётся на край: –15 % здоровья';
      return 'упадёт: ' + A.HAZARDS[this.b.hazard];
    }

    drawStrip(g) {
      const F = A.Font, K = A.UIKit, L = id => A.Input.label(id, this.ui.device);
      let text = '', col = K.INK, icons = null;
      const u = this.hero();
      if (this.mode === 'cmd' && u) {
        const c = this.cats()[this.sel.cat];
        text = c && !c.enabled ? `${c.name}: ${c.why}` : `Ход: ${u.name}. ${L('move')}: выбор, ${L('ok')}: команда, ${L('menu')}: пауза`;
        if (c && !c.enabled) col = '#e09080';
      } else if (this.mode === 'skill' && u) {
        const c = this.cmdList()[this.sel.cmd];
        if (c) {
          text = `${c.name}: ${c.about}`;
          if (!c.enabled) { text += ` · ${c.why}`; col = '#e09080'; }
          if (c.id === 'deflect') {
            const list = this.b.forecast(u, 'deflect', 12), n = this.b.shotsBefore(u.id, list);
            const lv = A.STANCE.deflect[Math.max(0, Math.min(2, (u.deflectLevel || 1) - 1))];
            text += ` · до хода выстрелят: ${n}, стойка примет ${lv.charges}`;
          }
        }
      } else if (this.mode === 'target') {
        const id = this.tgts[this.sel.tgt], tu = this.b.unit(id);
        text = this.targetInfo(id);
        if (this.pending.id === 'push') text += ' · ' + this.pushHint(tu);
        if (tu && tu.side === 'enemy') {
          const kn = this.known(tu);
          icons = kn.weak ? this.b.weakness(tu.key) : 'unknown';
        }
      } else if (this.mode === 'talk') text = `Слово: ${L('move')}: подход, ${L('ok')}: сказать, ${L('back')}: назад`;
      else if (this.mode === 'play' && this.cur && this.cur.wait) text = `${L('ok')}: дальше`;
      else if (this.mode === 'play') text = `${L('ok')} (держать): быстрее`;
      if (!text) return;
      g.fillStyle = 'rgba(8,6,14,0.82)';
      g.fillRect(8, 318, 624, 24);
      g.fillStyle = '#4a3a2a';
      g.fillRect(8, 318, 624, 1);
      let x = 18;
      F.draw(g, 'text', text, x, 322, col, K.SHADOW);
      x += F.measure('text', text) + 10;
      if (icons === 'unknown') F.draw(g, 'text', 'слабости: ?', x, 322, '#a89a80', K.SHADOW);
      else if (icons) {
        const draw = (label, list, c2) => {
          if (!list.length) return;
          F.draw(g, 'text', label, x, 322, c2, K.SHADOW);
          x += F.measure('text', label) + 4;
          for (const t of list) {
            g.drawImage(this.icon(t), x, 323, 14, 14);
            x += 17;
          }
          x += 6;
        };
        draw('слабость', icons.weak, '#ffd040');
        draw('стойкость', icons.resist, '#a0a0a8');
        draw('неуязвим', icons.immune, '#808088');
      }
    }

    drawCommands(g) {
      const F = A.Font, K = A.UIKit;
      K.bevel(g, 8, 346, 404, 128, 'rgba(18,12,28,0.95)', '#8a7a60', '#2a2018');
      const u = this.hero(), menuMode = ['cmd', 'skill', 'target', 'talk'].includes(this.mode);
      if (!u || !menuMode) {
        const a = this.actor && this.b.unit(this.actor);
        F.draw(g, 'bold', a ? `Ходит: ${a.name}` : this.b.group.name, 20, 352, K.GOLD, K.SHADOW);
        if (this.b.hazard) F.draw(g, 'text', 'Опасность у края: ' + A.HAZARDS[this.b.hazard], 20, 374, '#c8a890', K.SHADOW);
        return;
      }
      F.draw(g, 'bold', 'Ход: ' + u.name, 20, 352, K.GOLD, K.SHADOW);
      const cats = this.cats();
      cats.forEach((c, i) => {
        const y = 374 + i * 16, on = i === this.sel.cat;
        if (on) {
          g.fillStyle = this.mode === 'cmd' ? 'rgba(244,191,106,0.22)' : 'rgba(244,191,106,0.1)';
          g.fillRect(14, y - 1, 126, 16);
        }
        F.draw(g, 'text', (on ? '> ' : '  ') + c.name, 18, y, c.enabled ? (on ? '#fff4d8' : K.INK) : '#6a6070', K.SHADOW);
        this.hits.push({
          x: 14, y: y - 1, w: 126, h: 16,
          hover: () => { if (this.mode === 'cmd') this.sel.cat = i; },
          fn: () => { if (this.mode !== 'cmd' && this.mode !== 'skill') return; this.sel.cat = i; this.mode = 'cmd'; this.key('Enter'); }
        });
      });
      const list = this.cmdList(), sub = this.mode !== 'cmd';
      list.forEach((c, i) => {
        const y = 374 + i * 16, on = sub && i === this.sel.cmd;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.22)';
          g.fillRect(148, y - 1, 258, 16);
        }
        const col = !c.enabled ? '#6a6070' : on ? '#fff4d8' : sub ? K.INK : '#a89a80';
        F.draw(g, 'text', c.name, 156, y, col, K.SHADOW);
        const cost = c.fp ? `Сила ${c.fp}` : c.tempo ? `Темп ${c.tempo}` : '';
        if (cost) F.draw(g, 'text', cost, 400 - F.measure('text', cost), y, c.enabled ? '#a8c8e8' : '#6a6070', K.SHADOW);
        this.hits.push({
          x: 148, y: y - 1, w: 258, h: 16,
          hover: () => { if (this.mode === 'cmd' || this.mode === 'skill') { this.mode = 'skill'; this.sel.cmd = i; } },
          fn: () => {
            if (this.mode !== 'cmd' && this.mode !== 'skill') return;
            this.mode = 'skill';
            this.sel.cmd = i;
            this.key('Enter');
          }
        });
      });
      if (this.mode === 'target') {
        this.tgts.forEach((id, i) => {
          const p = this.tpos(id), v = this.vis.get(id), s = v ? v.shape : SHAPES.human;
          this.hits.push({ x: (p[0] - s.ax) * 2, y: (p[1] - s.ay) * 2, w: s.w * 2, h: s.h * 2, hover: () => { this.sel.tgt = i; }, fn: () => { this.sel.tgt = i; this.key('Enter'); } });
        });
      }
    }

    drawParty(g) {
      const F = A.Font, K = A.UIKit;
      K.bevel(g, 420, 346, 212, 128, 'rgba(18,12,28,0.95)', '#8a7a60', '#2a2018');
      const cur = this.hero();
      this.b.units.filter(u => u.side === 'party').forEach((u, i) => {
        const v = this.vis.get(u.id), y = 352 + i * 41, on = cur && cur.id === u.id && ['cmd', 'skill', 'target', 'talk'].includes(this.mode);
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.14)';
          g.fillRect(426, y - 2, 200, 40);
        }
        F.draw(g, 'bold', u.name, 430, y, v.down ? '#8a6060' : on ? K.GOLD : K.INK, K.SHADOW);
        const bar = (by, h, f, col) => {
          g.fillStyle = '#0a0810';
          g.fillRect(430, by, 102, h);
          g.fillStyle = col;
          g.fillRect(431, by + 1, Math.round(100 * Math.max(0, Math.min(1, f))), h - 2);
        };
        bar(y + 18, 7, v.hp / v.maxhp, v.hp / v.maxhp < 0.35 ? '#ff6a3a' : '#d84a3a');
        bar(y + 27, 5, u.fp / Math.max(1, u.maxfp), '#5aa8f0');
        F.draw(g, 'text', `${v.hp}/${v.maxhp}`, 538, y + 12, K.INK, K.SHADOW);
        F.draw(g, 'text', 'Сила ' + u.fp, 538, y + 25, '#a8c8e8', K.SHADOW);
        if (u.tempo !== null && u.tempo !== undefined) {
          const col = (A.HEROES[u.id] || {}).blade || '#e83a2a';
          for (let k = 0; k < 5; k++) {
            const x = 588 + k * 8, lit = k < u.tempo;
            g.fillStyle = lit ? col : '#2a2028';
            g.fillRect(x, y + 2, 4, 14);
            if (lit) {
              g.fillStyle = '#fff0e8';
              g.fillRect(x + 1, y + 3, 2, 12);
            }
          }
          F.draw(g, 'text', 'Темп', 584 - F.measure('text', 'Темп') - 4, y, '#c8a8a0', K.SHADOW);
        }
        const icons = this.statusIcons(u);
        let ix = 434 + F.measure('bold', u.name) + 4;
        for (const id of icons) {
          g.drawImage(this.icon(id), ix, y + 1, 14, 14);
          ix += 16;
        }
      });
    }

    drawTalk(g) {
      const F = A.Font, K = A.UIKit, id = this.talkShow ? this.talkShow.target : this.talkTarget, u = this.b.unit(id), v = this.vis.get(id);
      if (!u || !v) return;
      K.bevel(g, 40, 92, 560, 214, 'rgba(14,10,24,0.96)', '#d8b884', '#4a3020');
      g.fillStyle = '#1a1424';
      g.fillRect(54, 106, 98, 128);
      const c = this.sprite(v, 'idle0'), [cx, cy, cw, ch] = v.shape.talk;
      const sx = v.side === 'enemy' && !v.beast ? v.shape.w - cx - cw : cx;
      g.imageSmoothingEnabled = false;
      g.drawImage(c, sx, cy, cw, ch, 56, 108, 94, Math.round(94 * ch / cw));
      F.draw(g, 'bold', u.name, 168, 104, K.GOLD, K.SHADOW);
      const kn = this.known(u), d = A.ENEMIES[u.key];
      if (kn.nrav) F.draw(g, 'text', 'нрав: ' + A.NRAV[d.nrav], 168 + F.measure('bold', u.name) + 12, 104, '#a89a80', K.SHADOW);
      if (this.talkShow) {
        const e = this.talkShow, lines = [];
        F.wrap('text', 'Эйла: ' + e.say, 410).forEach(l => lines.push([l, '#c8d8f0']));
        F.wrap('text', u.name + ': ' + e.reply, 410).forEach(l => lines.push([l, K.INK]));
        lines.forEach(([l, col], i) => F.draw(g, 'text', l, 168, 130 + i * 18, col, K.SHADOW));
        const out = `${u.name} ${OUTCOME[e.outcome]}`;
        F.draw(g, 'bold', out, 168, 140 + lines.length * 18, e.outcome === 'rage' ? '#ff7a6a' : '#a8e8a0', K.SHADOW);
        F.draw(g, 'text', A.Input.label('ok', this.ui.device) + ': дальше', 168, 280, '#a89a80', K.SHADOW);
        this.hits.push({ x: 40, y: 92, w: 560, h: 214, fn: () => this.key('Enter') });
        return;
      }
      const greet = A.TALK.greet[d.nrav] || '';
      F.wrap('text', '«' + greet + '»', 410).forEach((l, i) => F.draw(g, 'text', l, 168, 128 + i * 18, K.INK, K.SHADOW));
      this.b.approaches(u).forEach((a, i) => {
        const y = 186 + i * 22, on = i === this.sel.talk;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.2)';
          g.fillRect(164, y - 2, 420, 20);
        }
        F.draw(g, 'text', (on ? '> ' : '  ') + a.name, 168, y, a.enabled ? (on ? '#fff4d8' : K.INK) : '#6a6070', K.SHADOW);
        const note = a.enabled ? (a.id === 'threat' ? 'страх, тёмный путь' : '') : a.why;
        if (note) F.draw(g, 'text', note, 300, y, a.enabled ? '#a89a80' : '#8a6a70', K.SHADOW);
        this.hits.push({ x: 164, y: y - 2, w: 420, h: 20, hover: () => { this.sel.talk = i; }, fn: () => { this.sel.talk = i; this.key('Enter'); } });
      });
    }

    drawIntro(g) {
      const F = A.Font, K = A.UIKit, title = this.b.group.name, sub = ADVANTAGE[this.b.advantage] || '';
      const w = Math.max(F.measure('bold', title), F.measure('text', sub)) + 48, x = Math.round(320 - w / 2);
      K.bevel(g, x, 140, w, 52, 'rgba(14,10,24,0.94)', '#d8b884', '#4a3020');
      F.draw(g, 'bold', title, Math.round(320 - F.measure('bold', title) / 2), 148, K.GOLD, K.SHADOW);
      F.draw(g, 'text', sub, Math.round(320 - F.measure('text', sub) / 2), 168, this.b.advantage === 'enemy' ? '#ff9a80' : this.b.advantage === 'party' ? '#a8e8a0' : K.INK, K.SHADOW);
    }

    drawResult(g) {
      const F = A.Font, K = A.UIKit, win = this.b.over === 'win', lines = [];
      if (win) {
        const r = this.res;
        lines.push(['Опыт +' + r.xp, K.INK]);
        if (r.credits) lines.push(['Кредиты +' + r.credits, K.INK]);
        if (r.talked) lines.push(['Ушли без боя: ' + r.talked, '#a8e8a0']);
        for (const [id, lv] of r.levels) lines.push([`${A.HEROES[id].name}: уровень ${lv}`, K.GOLD]);
        for (const [id, hp, fp] of r.recovered) lines.push([`Сила затянула раны: ${A.HEROES[id].name} +${hp} здоровья, –${fp} Силы`, '#a8c8e8']);
        if (this.b.S.flags['info_' + this.b.groupId]) lines.push(['Сведения записаны в журнал.', '#c8b8ff']);
      } else lines.push(['Отряд пал. Бой можно начать заново.', K.INK]);
      const opts = this.resultOptions();
      const w = Math.max(320, ...lines.map(l => F.measure('text', l[0]) + 48), ...opts.map(o => F.measure('text', o.label) + 72));
      const h = 56 + lines.length * 18 + opts.length * 20, x = Math.round(320 - w / 2), y = Math.round(170 - h / 2);
      K.bevel(g, x, y, w, h, 'rgba(14,10,24,0.96)', '#d8b884', '#4a3020');
      const title = win ? 'Победа' : 'Поражение';
      F.draw(g, 'bold', title, Math.round(320 - F.measure('bold', title) / 2), y + 10, win ? K.GOLD : '#ff8a6a', K.SHADOW);
      lines.forEach(([l, col], i) => F.draw(g, 'text', l, x + 24, y + 34 + i * 18, col, K.SHADOW));
      opts.forEach((o, i) => {
        const oy = y + 40 + lines.length * 18 + i * 20, on = i === this.sel.result;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.2)';
          g.fillRect(x + 20, oy - 2, w - 40, 18);
        }
        F.draw(g, 'text', (on ? '> ' : '  ') + o.label, x + 24, oy, on ? '#fff4d8' : K.INK, K.SHADOW);
        this.hits.push({ x: x + 20, y: oy - 2, w: w - 40, h: 18, hover: () => { this.sel.result = i; }, fn: () => { this.sel.result = i; o.act(); } });
      });
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
