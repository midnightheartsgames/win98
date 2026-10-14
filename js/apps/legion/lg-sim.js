(function (L) {
  'use strict';

  const HASH = 4;
  const THINK = 0.25;
  const BASE_CP = 20000;
  const BASE_REGEN = 230;
  const SIGNAL_COST = 5000;
  const RALLY_COST = 12000;
  const RETREAT_COST = 4000;
  const SWING = { foot: 1.7, cav: 1.8, elephant: 2.3, leader: 1.4 };
  const BREAK_AT = [0.8, 0.68];
  const unit = v => (Math.abs(v) < 1e-9 ? 0 : Math.abs(Math.abs(v) - 1) < 1e-9 ? Math.sign(v) : v);
  const PROJ = { javelin: 23, arrow: 42, pilum: 20 };
  const STATE_NAMES = {
    waiting: 'Ждет сигнала', holding: 'Стоит', advancing: 'Наступает', charging: 'Атакует', engaged: 'В бою', shooting: 'Стреляет',
    flanking: 'Обходит', withdrawing: 'Отходит', routing: 'Бежит', rallying: 'Собирается', fled: 'Покинул поле', destroyed: 'Уничтожен',
    pursuing: 'Преследует', volley: 'Метает пилумы', moving: 'Идет', evading: 'Отступает', ready: 'Готов'
  };

  class Battle {
    constructor(cfg) {
      this.cfg = cfg;
      this.terrain = cfg.terrain;
      this.size = this.terrain.size;
      this.rnd = L.rng(cfg.seed || 1);
      this.time = 0;
      this.state = 'deploy';
      this.squads = [];
      this.soldiers = [];
      this.projectiles = [];
      this.stuck = [];
      this.events = [];
      this.nextSquadId = 1;
      this.diff = L.DIFFICULTY[cfg.difficulty == null ? 1 : cfg.difficulty];
      this.objectives = (cfg.objectives || []).map(o => Object.assign({ done: false, failed: false }, o));
      this.reinforcements = (cfg.reinforcements || []).map(r => Object.assign({ spawned: false }, r));
      this.maxTime = cfg.maxTime || 1500;
      this.sides = [0, 1].map(i => ({
        index: i,
        cp: 0, cpMax: BASE_CP, regen: BASE_REGEN,
        signaled: false, general: null, generalDead: false,
        men0: 0, killed: 0, lost: 0, fled: 0,
        zone: i === 0 ? cfg.playerZone : cfg.enemyZone,
        face: i === 0 ? (cfg.playerFace == null ? Math.PI : cfg.playerFace) : (cfg.enemyFace == null ? (cfg.playerFace == null ? 0 : L.wrapAngle(cfg.playerFace + Math.PI)) : cfg.enemyFace),
        ai: 1
      }));
      this.cellsN = Math.ceil(this.size / HASH);
      this.head = new Int32Array(this.cellsN * this.cellsN);
      this.next = new Int32Array(64);
      for (const spec of cfg.player || []) this.addSquad(spec, 0);
      for (const spec of cfg.enemy || []) this.addSquad(spec, 1);
      this.refreshCommand();
      for (const s of this.sides) s.cp = s.cpMax * 0.6;
    }

    addSquad(spec, side) {
      const def = L.UNITS[spec.key];
      const cls = L.CLASSES[def.type];
      const st = L.Army.stats(spec);
      if (side === 1 && this.diff) {
        st.dm *= this.diff.enemyStat;
        st.hit *= this.diff.enemyStat;
      }
      const sq = {
        id: this.nextSquadId++, ref: spec.id, side, key: spec.key, def, cls, clsName: def.type, family: L.familyOf(spec.key),
        name: spec.name || def.name, level: spec.level || 1, color: spec.color == null ? 0 : spec.color, stats: st,
        form: spec.form || 'balanced', doctrine: spec.doctrine || (def.leader ? 'longhold' : 'advance'),
        ax: spec.x || 0, az: spec.z || 0, face: spec.face == null ? (side === 0 ? Math.PI : 0) : spec.face,
        men0: Math.max(1, spec.men == null ? def.men : spec.men), menMax: def.men,
        soldiers: [], alive: 0, kills: 0, lost: 0, xp: 0, killValue: 0,
        moraleMax: Math.max(50, st.mo), morale: 0, stateName: 'ready', state: 'ready',
        order: null, holding: false, waitUntil: 0, target: null, fireTarget: null, pursueUntil: 0, thinkT: 0,
        speedNow: 0, moving: false, running: false, chargeT: 0, volleyT: 0, evades: 0, rallies: 0, routT: 0, calmT: 0,
        path: null, goal: null, flankHits: 0, rearHits: 0, recentLost: 0, recentKilled: 0, windowT: 0,
        favour: null, favourT: 0, general: !!def.leader && (spec.general != null ? !!spec.general : !this.sides[side].general), elite: spec.elite || null, deployed: true, onField: true,
        waypoint: null, lastEngaged: -99, reinforce: !!spec.reinforce, cohesion: 4, width: 0, depth: 0, radius: 0,
        rotateLock: false, aiRole: spec.aiRole || null
      };
      sq.morale = sq.moraleMax;
      this.squads.push(sq);
      const n = sq.men0;
      for (let i = 0; i < n; i++) {
        const s = {
          sq, idx: i, x: sq.ax, z: sq.az, px: sq.ax, pz: sq.az, face: sq.face, hp: st.hp, alive: true, dead: false, dieT: 0,
          anim: 'stand', animT: this.rnd.range(0, 10), animVar: this.rnd.int(3), target: null, cd: this.rnd.range(0, 1.2), searchT: this.rnd.range(0, 0.3),
          ammo: st.shots, shootCd: this.rnd.range(0, 2.5), release: 0, shotTarget: null, vx: 0, vz: 0, jx: this.rnd.range(-1, 1), jz: this.rnd.range(-1, 1),
          lx: 0, lz: 0, sface: 0, walkPhase: this.rnd.range(0, 10), trampled: null, fightT: 0, speedJ: this.rnd.range(0.94, 1.06), fleeDir: 0,
          uid: this.soldiers.length
        };
        sq.soldiers.push(s);
        this.soldiers.push(s);
      }
      sq.alive = n;
      if (this.next.length < this.soldiers.length) {
        const nn = new Int32Array(Math.max(this.soldiers.length * 2, 256));
        this.next = nn;
      }
      this.layout(sq);
      this.snap(sq);
      if (sq.general) this.sides[side].general = sq;
      this.sides[side].men0 += n;
      return sq;
    }

    refreshCommand() {
      for (const side of this.sides) {
        const g = side.general;
        const op = g ? g.stats.op : 0;
        const og = g ? g.stats.og : 0;
        const aiMul = side.index === 1 ? this.diff.aiPoints : 1;
        side.cpMax = (BASE_CP + op) * (side.index === 1 ? Math.max(1, aiMul) : 1);
        side.regen = BASE_REGEN * (1 + og * 0.06) * aiMul;
        side.leaderR = g ? 40 + g.stats.lr * 8 : 0;
      }
    }

    layout(sq) {
      const f = L.FORMS[sq.form];
      const fam = L.FAMILIES[sq.family];
      const men = sq.soldiers.filter(s => s.alive).length || 1;
      const cols0 = f.cols[sq.menMax] || Math.ceil(Math.sqrt(sq.menMax) * 1.3);
      const cols = Math.max(1, Math.min(cols0, men));
      const rows = Math.ceil(men / cols);
      const alive = sq.soldiers.filter(s => s.alive);
      if (f.wedge && men > 3) {
        let placed = 0, r = 0;
        while (placed < men) {
          const inRow = Math.min(1 + r * 2, men - placed);
          for (let c = 0; c < inRow; c++) {
            const s = alive[placed++];
            s.lx = (c - (inRow - 1) / 2) * fam.dx;
            s.lz = -r * fam.dz;
            s.sface = 0;
          }
          r++;
        }
        const shift = (r - 1) * fam.dz / 2;
        for (const s of alive) s.lz += shift;
        sq.width = (r * 2 - 1) * fam.dx;
        sq.depth = r * fam.dz;
      } else if (f.square && men > 7) {
        const side = Math.max(2, Math.ceil(men / 4));
        const half = side * fam.dx / 2;
        alive.forEach((s, i) => {
          const edge = i % 4, k = Math.floor(i / 4);
          const t = (k - (side - 1) / 2) * fam.dx * 0.95;
          if (edge === 0) { s.lx = t; s.lz = half; s.sface = 0; }
          else if (edge === 1) { s.lx = half; s.lz = -t; s.sface = Math.PI / 2; }
          else if (edge === 2) { s.lx = -t; s.lz = -half; s.sface = Math.PI; }
          else { s.lx = -half; s.lz = t; s.sface = -Math.PI / 2; }
        });
        sq.width = half * 2;
        sq.depth = half * 2;
      } else {
        alive.forEach((s, i) => {
          const r = Math.floor(i / cols), c = i % cols;
          const inRow = r === rows - 1 ? men - r * cols : cols;
          const off = (cols - inRow) / 2;
          s.lx = (c + off - (cols - 1) / 2) * fam.dx + s.jx * fam.jitter * fam.dx;
          s.lz = ((rows - 1) / 2 - r) * fam.dz + s.jz * fam.jitter * fam.dz;
          if (sq.family === 'checker' && r % 2) s.lx += fam.dx * 0.5;
          s.sface = 0;
        });
        sq.width = cols * fam.dx;
        sq.depth = rows * fam.dz;
      }
      sq.radius = Math.hypot(sq.width, sq.depth) / 2;
    }

    slotPos(sq, s) {
      const c = Math.cos(sq.face), sn = Math.sin(sq.face);
      return [sq.ax + c * s.lx + sn * s.lz, sq.az - sn * s.lx + c * s.lz];
    }

    snap(sq) {
      for (const s of sq.soldiers) {
        if (!s.alive) continue;
        const [x, z] = this.slotPos(sq, s);
        s.x = s.px = x;
        s.z = s.pz = z;
        s.face = sq.face + s.sface;
      }
    }

    placeSquad(sq, x, z, face) {
      sq.ax = x;
      sq.az = z;
      if (face != null) sq.face = face;
      this.snap(sq);
    }

    setForm(sq, form) {
      if (!L.FORMS[form]) return false;
      if (L.FORMS[form].skill && !sq.stats.forms) return false;
      if (sq.general && form !== 'balanced') return false;
      sq.form = form;
      this.layout(sq);
      if (this.state === 'deploy') this.snap(sq);
      return true;
    }

    inZone(side, x, z) {
      const zn = this.sides[side].zone;
      return !!zn && x >= zn[0] && z >= zn[1] && x <= zn[2] && z <= zn[3];
    }

    validDeploy(sq, x, z) {
      if (!this.inZone(sq.side, x, z)) return false;
      const t = this.terrain.typeAt(x, z);
      if (t === L.T.ford || t === L.T.water) return false;
      return this.terrain.passable(x, z, sq.clsName);
    }

    autoDeploy(side, only) {
      const zn = this.sides[side].zone;
      const face = this.sides[side].face;
      const list = this.squads.filter(s => s.side === side && s.onField && (!only || only.includes(s)));
      const fx = unit(Math.sin(face)), fz = unit(Math.cos(face)), rx = -fz, rz = fx;
      const corners = [[zn[0], zn[1]], [zn[2], zn[1]], [zn[0], zn[3]], [zn[2], zn[3]]];
      const front = Math.max(...corners.map(([x, z]) => x * fx + z * fz));
      const lats = corners.map(([x, z]) => x * rx + z * rz);
      const latMin = Math.min(...lats), latMax = Math.max(...lats), center = (latMin + latMax) / 2;
      const put = (s, lat, depth) => {
        const l = L.clamp(lat, latMin + s.width / 2, latMax - s.width / 2);
        const d = front - depth;
        this.placeSquad(s, fx * d + rx * l, fz * d + rz * l, face);
      };
      const groups = { skirm: [], heavy: [], light: [], cav: [], back: [], leader: [] };
      for (const sq of list) {
        const t = sq.clsName;
        if (sq.general) groups.leader.push(sq);
        else if (t === 'Skirmisher') groups.skirm.push(sq);
        else if (t === 'HeavyInf' || t === 'Elephant') groups.heavy.push(sq);
        else if (t === 'LightInf') groups.light.push(sq);
        else if (t === 'Archer') groups.back.push(sq);
        else groups.cav.push(sq);
      }
      const line = (arr, depth, gap) => {
        const total = arr.reduce((a, s) => a + s.width + gap, -gap);
        let lat = center - total / 2;
        for (const s of arr) {
          put(s, lat + s.width / 2, depth);
          lat += s.width + gap;
        }
      };
      line(groups.skirm, 18, 10);
      const main = groups.light.concat(groups.heavy);
      main.sort((a, b) => (a.clsName === 'HeavyInf') - (b.clsName === 'HeavyInf'));
      const mid = [];
      main.forEach((s, i) => (i % 2 ? mid.push(s) : mid.unshift(s)));
      line(mid, 48, 6);
      line(groups.back, 73, 10);
      const midW = mid.reduce((a, s) => a + s.width + 6, 0);
      groups.cav.forEach((s, i) => {
        const sideSign = i % 2 ? 1 : -1;
        const k = Math.floor(i / 2);
        put(s, center + sideSign * (midW / 2 + 16 + k * (s.width + 8) + s.width / 2), 52);
      });
      groups.leader.forEach(s => put(s, center, 88));
      this.resolveDeploy(side, list);
    }

    squadsClash(a, b) {
      if (L.dist(a.ax, a.az, b.ax, b.az) < Math.min(a.width, a.depth) / 2 + Math.min(b.width, b.depth) / 2 + 0.5) return true;
      const corners = s => {
        const c = Math.cos(s.face), sn = Math.sin(s.face), hw = s.width / 2, hd = s.depth / 2;
        return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([lx, lz]) => [s.ax + c * lx + sn * lz, s.az - sn * lx + c * lz]);
      };
      const ca = corners(a), cb = corners(b);
      for (const ang of [a.face, a.face + Math.PI / 2, b.face, b.face + Math.PI / 2]) {
        const ax = Math.cos(ang), az = -Math.sin(ang);
        const pa = ca.map(p => p[0] * ax + p[1] * az), pb = cb.map(p => p[0] * ax + p[1] * az);
        if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
      }
      return true;
    }

    deployClashes(side) {
      const list = this.squads.filter(s => s.side === side && s.onField);
      const bad = new Set();
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        if (!this.validDeploy(a, a.ax, a.az)) bad.add(a);
        for (let j = i + 1; j < list.length; j++) {
          if (this.squadsClash(a, list[j])) { bad.add(a); bad.add(list[j]); }
        }
      }
      return bad;
    }

    resolveDeploy(side, order) {
      const mine = this.squads.filter(s => s.side === side && s.onField);
      const moving = order ? order.filter(s => mine.includes(s)) : mine;
      const settled = mine.filter(s => !moving.includes(s));
      for (const sq of moving) {
        const free = (x, z) => {
          if (!this.validDeploy(sq, x, z)) return false;
          const probe = { ax: x, az: z, face: sq.face, width: sq.width, depth: sq.depth };
          return !settled.some(o => this.squadsClash(probe, o));
        };
        if (!free(sq.ax, sq.az)) {
          const zn = this.sides[side].zone;
          const p = this.findFree(sq.ax, sq.az, free) || (zn && this.findFree((zn[0] + zn[2]) / 2, (zn[1] + zn[3]) / 2, free));
          if (p) this.placeSquad(sq, p[0], p[1], sq.face);
        }
        settled.push(sq);
      }
    }

    findFree(x, z, free) {
      for (let r = 4; r < 420; r += 4) {
        const n = Math.max(12, Math.round(r / 2));
        for (let a = 0; a < n; a++) {
          const px = x + Math.cos(a / n * Math.PI * 2) * r, pz = z + Math.sin(a / n * Math.PI * 2) * r;
          if (free(px, pz)) return [px, pz];
        }
      }
      return null;
    }

    start() {
      for (const sq of this.squads) {
        if (!sq.onField) {
          for (const s of sq.soldiers) { s.alive = false; s.gone = true; }
          sq.alive = 0;
          sq.state = 'absent';
          this.sides[sq.side].men0 -= sq.men0;
          continue;
        }
        const d = L.DOCTRINES[sq.doctrine];
        sq.waitUntil = d.wait;
        sq.state = d.wait > 1 ? 'waiting' : 'advancing';
      }
      this.state = 'battle';
      this.emit({ type: 'start' });
    }

    emit(e) {
      this.events.push(e);
      if (this.events.length > 600) this.events.splice(0, this.events.length - 600);
    }

    enemiesOf(sq) {
      return this.squads.filter(o => o.side !== sq.side && o.alive > 0 && o.onField && o.state !== 'fled' && o.state !== 'absent');
    }

    centroid(sq) {
      let x = 0, z = 0, n = 0;
      for (const s of sq.soldiers) if (s.alive) { x += s.x; z += s.z; n++; }
      return n ? [x / n, z / n] : [sq.ax, sq.az];
    }

    edgeDist(a, b) {
      const [ax, az] = a.cx != null ? [a.cx, a.cz] : [a.ax, a.az];
      const [bx, bz] = b.cx != null ? [b.cx, b.cz] : [b.ax, b.az];
      return Math.max(0, L.dist(ax, az, bx, bz) - a.radius * 0.7 - b.radius * 0.7);
    }

    orderCost(sq) {
      const side = this.sides[sq.side];
      const f = L.FORMS[sq.form];
      let c = Math.max(1000, sq.stats.oc + (f.oc || 0));
      if (side.generalDead) c *= 1.5;
      return Math.round(c);
    }

    spend(side, cost) {
      const s = this.sides[side];
      if (s.cp < cost) return false;
      s.cp -= cost;
      return true;
    }

    command(sq, cmd, free) {
      if (this.state === 'deploy') {
        if (cmd.type === 'form') return this.setForm(sq, cmd.form);
        if (cmd.type === 'doctrine') { sq.doctrine = cmd.doctrine; return true; }
        return false;
      }
      if (this.state !== 'battle' || sq.alive <= 0 || sq.state === 'fled' || sq.state === 'routing') return false;
      if (cmd.type === 'form' && (!L.FORMS[cmd.form] || (L.FORMS[cmd.form].skill && !sq.stats.forms) || sq.form === cmd.form || sq.general)) return false;
      if (cmd.type === 'disengage' && !sq.cls.cav) return false;
      const cost = this.orderCost(sq);
      if (!free && !this.spend(sq.side, cost)) {
        this.emit({ type: 'nopoints', side: sq.side });
        return false;
      }
      switch (cmd.type) {
        case 'move':
          sq.order = { type: 'move', x: cmd.x, z: cmd.z, run: !!cmd.run, face: cmd.face };
          sq.path = this.terrain.path(sq.ax, sq.az, cmd.x, cmd.z, sq.clsName);
          sq.holding = false;
          sq.target = null;
          break;
        case 'attack':
          sq.order = { type: 'attack', target: cmd.target };
          sq.target = cmd.target;
          sq.holding = false;
          break;
        case 'halt':
          sq.order = null;
          sq.holding = true;
          sq.target = null;
          sq.path = null;
          break;
        case 'disengage': {
          const en = this.nearestEnemy(sq, 9999);
          let [dx, dz] = this.backOf(sq.side);
          if (en) {
            const [ex, ez] = this.centroid(en);
            const d = L.dist(sq.ax, sq.az, ex, ez) || 1;
            dx = (sq.ax - ex) / d;
            dz = (sq.az - ez) / d;
          }
          const tx = L.clamp(sq.ax + dx * 70, 10, this.size - 10), tz = L.clamp(sq.az + dz * 70, 10, this.size - 10);
          sq.order = { type: 'move', x: tx, z: tz, run: true, disengage: true };
          sq.path = this.terrain.path(sq.ax, sq.az, tx, tz, sq.clsName);
          sq.target = null;
          for (const s of sq.soldiers) s.target = null;
          sq.holding = false;
          break;
        }
        case 'charge':
          sq.doctrine = 'charge';
          sq.order = null;
          sq.holding = false;
          sq.waitUntil = 0;
          break;
        case 'form':
          this.setForm(sq, cmd.form);
          break;
        case 'doctrine':
          sq.doctrine = cmd.doctrine;
          sq.order = null;
          sq.holding = false;
          sq.waitUntil = this.time + L.DOCTRINES[cmd.doctrine].wait;
          sq.target = null;
          break;
        default:
          return false;
      }
      this.emit({ type: 'order', squad: sq, cmd: cmd.type, side: sq.side });
      return true;
    }

    signal(side, free) {
      if (this.state !== 'battle') return false;
      if (!free && !this.spend(side, SIGNAL_COST)) { this.emit({ type: 'nopoints', side }); return false; }
      const s = this.sides[side];
      s.signaled = true;
      for (const sq of this.squads) {
        if (sq.side !== side || sq.alive <= 0) continue;
        if (sq.holding) sq.holding = false;
        if (sq.doctrine === 'hold' || sq.doctrine === 'longhold') {
          if (!sq.general) sq.waitUntil = 0;
        }
      }
      this.emit({ type: 'signal', side });
      return true;
    }

    rally(side, free) {
      if (this.state !== 'battle') return false;
      const s = this.sides[side];
      if (!s.general || s.generalDead) return false;
      if (!free && !this.spend(side, RALLY_COST)) { this.emit({ type: 'nopoints', side }); return false; }
      const g = s.general;
      const [gx, gz] = this.centroid(g);
      const r = s.leaderR * 2;
      for (const sq of this.squads) {
        if (sq.side !== side || sq.alive <= 0 || sq.state === 'fled') continue;
        const [x, z] = this.centroid(sq);
        if (L.dist(x, z, gx, gz) > r) continue;
        sq.morale = Math.min(sq.moraleMax, sq.morale + sq.moraleMax * 0.25);
        if (sq.state === 'routing' && sq.rallies < 3) this.rallySquad(sq);
      }
      this.emit({ type: 'rally', side, x: gx, z: gz });
      return true;
    }

    retreat(side, free) {
      if (this.state !== 'battle') return false;
      if (!free && !this.spend(side, RETREAT_COST)) { this.emit({ type: 'nopoints', side }); return false; }
      const [bx, bz] = this.backOf(side);
      for (const sq of this.squads) {
        if (sq.side !== side || sq.alive <= 0 || sq.state === 'routing' || sq.state === 'fled') continue;
        const tx = L.clamp(sq.ax + bx * 70, 12, this.size - 12), tz = L.clamp(sq.az + bz * 70, 12, this.size - 12);
        sq.order = { type: 'move', x: tx, z: tz, run: false, retreat: true };
        sq.path = this.terrain.path(sq.ax, sq.az, tx, tz, sq.clsName);
        sq.target = null;
        for (const s of sq.soldiers) s.target = null;
      }
      this.emit({ type: 'retreat', side });
      return true;
    }

    useFavour(sq, kind) {
      if (this.state !== 'battle' || !L.FAVOURS[kind] || sq.alive <= 0) return false;
      sq.favour = kind;
      sq.favourT = L.FAVOURS[kind].dur;
      this.emit({ type: 'favour', squad: sq, kind, side: sq.side });
      return true;
    }

    nearestEnemy(sq, maxDist, cone) {
      let best = null, bd = Infinity;
      const fx = Math.sin(sq.face), fz = Math.cos(sq.face);
      for (const o of this.squads) {
        if (o.side === sq.side || o.alive <= 0 || !o.onField || o.state === 'fled' || o.state === 'absent') continue;
        const [ox, oz] = [o.cx, o.cz];
        let d = this.edgeDist(sq, o);
        if (d > maxDist) continue;
        if (cone) {
          const dx = ox - sq.cx, dz = oz - sq.cz;
          const l = Math.hypot(dx, dz) || 1;
          if ((dx * fx + dz * fz) / l < cone) continue;
        }
        if (o.state === 'routing') d += 60;
        if (d < bd) { bd = d; best = o; }
      }
      return best;
    }

    tick() {
      if (this.state !== 'battle') return;
      const dt = L.TICK;
      this.time += dt;
      for (const side of this.sides) {
        let regen = side.regen;
        if (side.generalDead) regen *= 0.5;
        side.cp = Math.min(side.cpMax, side.cp + regen * dt);
      }
      for (const r of this.reinforcements) {
        if (!r.spawned && this.time >= r.at) {
          r.spawned = true;
          for (const spec of r.squads) {
            const sq = this.addSquad(Object.assign({ reinforce: true }, spec), r.side == null ? 1 : r.side);
            sq.state = 'advancing';
            sq.waitUntil = 0;
          }
          this.emit({ type: 'reinforce', side: r.side == null ? 1 : r.side, text: r.text || null });
        }
      }
      for (const sq of this.squads) {
        if (sq.alive <= 0) continue;
        const c = this.centroid(sq);
        sq.cx = c[0];
        sq.cz = c[1];
      }
      this.buildHash();
      for (const sq of this.squads) {
        if (sq.alive <= 0 || sq.state === 'fled' || sq.state === 'absent') continue;
        sq.thinkT -= dt;
        if (sq.thinkT <= 0) {
          sq.thinkT = THINK;
          this.think(sq);
        }
        this.moveAnchor(sq, dt);
        this.updateMorale(sq, dt);
        if (sq.favour) {
          sq.favourT -= dt;
          if (sq.favourT <= 0) sq.favour = null;
        }
        if (sq.chargeT > 0) sq.chargeT -= dt;
      }
      for (const s of this.soldiers) {
        if (s.gone) continue;
        if (!s.alive) {
          s.dieT += dt;
          continue;
        }
        this.updateSoldier(s, dt);
      }
      this.updateProjectiles(dt);
      this.breakT = (this.breakT || 0) - dt;
      if (this.breakT <= 0) {
        this.breakT = 0.5;
        this.checkBreak(0);
        this.checkBreak(1);
      }
      if (this.cfg.escape) this.updateEscape();
      if (this.cfg.ai) for (const ai of this.cfg.ai) ai.tick(dt);
      this.checkEnd();
    }

    buildHash() {
      const n = this.cellsN;
      this.head.fill(-1);
      const next = this.next;
      for (let i = 0; i < this.soldiers.length; i++) {
        const s = this.soldiers[i];
        if (!s.alive) continue;
        const cx = L.clamp((s.x / HASH) | 0, 0, n - 1), cz = L.clamp((s.z / HASH) | 0, 0, n - 1);
        const c = cz * n + cx;
        next[i] = this.head[c];
        this.head[c] = i;
      }
    }

    query(x, z, r, fn) {
      const n = this.cellsN;
      const x0 = L.clamp(((x - r) / HASH) | 0, 0, n - 1), x1 = L.clamp(((x + r) / HASH) | 0, 0, n - 1);
      const z0 = L.clamp(((z - r) / HASH) | 0, 0, n - 1), z1 = L.clamp(((z + r) / HASH) | 0, 0, n - 1);
      for (let cz = z0; cz <= z1; cz++) {
        for (let cx = x0; cx <= x1; cx++) {
          for (let i = this.head[cz * n + cx]; i !== -1; i = this.next[i]) {
            if (fn(this.soldiers[i]) === true) return;
          }
        }
      }
    }

    think(sq) {
      const dt = THINK;
      const side = this.sides[sq.side];
      if (sq.state === 'routing') return;
      sq.windowT += dt;
      if (sq.windowT > 3) {
        sq.windowT = 0;
        sq.recentLost = 0;
        sq.recentKilled = 0;
      }
      const engaged = this.time - sq.lastEngaged < 1.2;
      if (sq.target && (sq.target.alive <= 0 || sq.target.state === 'fled')) sq.target = null;
      if (sq.order) {
        const o = sq.order;
        if (o.type === 'attack') {
          if (!o.target || o.target.alive <= 0 || o.target.state === 'fled') { sq.order = null; sq.target = null; }
          else {
            sq.target = o.target;
            sq.state = engaged ? 'engaged' : (sq.cls.cav ? 'charging' : 'advancing');
            return;
          }
        } else if (o.type === 'move') {
          const d = L.dist(sq.ax, sq.az, o.x, o.z);
          if (d < 3) {
            if (o.face != null) sq.face = o.face;
            sq.order = null;
            sq.holding = true;
            sq.path = null;
          } else {
            sq.state = o.disengage || o.retreat ? 'withdrawing' : 'moving';
            if (!o.disengage && !o.retreat && engaged) sq.state = 'engaged';
            return;
          }
        }
      }
      if (sq.holding && sq.holdUntil && this.time > sq.holdUntil) {
        sq.holding = false;
        sq.holdUntil = 0;
        sq.waitUntil = 0;
      }
      if (sq.holding || (sq.general && sq.doctrine === 'longhold')) {
        const threat = this.nearestEnemy(sq, sq.general ? 18 : 14);
        if (threat) { sq.target = threat; sq.state = 'engaged'; }
        else if (this.shooterBrain(sq, true)) return;
        else { sq.target = null; sq.state = 'holding'; }
        return;
      }
      const d = L.DOCTRINES[sq.doctrine];
      if (sq.state === 'pursuing' && this.time < sq.pursueUntil && sq.target && sq.target.state === 'routing') return;
      if (d.wait > 1 && this.time < sq.waitUntil && !side.signaled) {
        const threat = this.nearestEnemy(sq, d.react);
        if (!threat) {
          if (!this.shooterBrain(sq, true)) sq.state = 'waiting';
          return;
        }
        sq.waitUntil = 0;
      }
      if (this.shooterBrain(sq, false)) return;
      if (sq.target && sq.target.alive > 0 && sq.target.state !== 'fled') {
        if (sq.target.state === 'routing' && !engaged) {
          const pursue = sq.cls.cav ? 10 : sq.clsName === 'LightInf' || sq.clsName === 'Skirmisher' ? 5 : 0;
          if (pursue && this.edgeDist(sq, sq.target) < 40 && sq.state !== 'pursuing') {
            sq.state = 'pursuing';
            sq.pursueUntil = this.time + pursue;
            return;
          }
          sq.target = null;
        } else {
          sq.state = engaged ? 'engaged' : (d.run || (sq.cls.cav && this.edgeDist(sq, sq.target) < 60) ? 'charging' : 'advancing');
          return;
        }
      }
      if (d.arc && !sq.flankDone) {
        const t = this.nearestEnemy(sq, 9999);
        if (!t) { sq.state = 'holding'; return; }
        const close = this.nearestEnemy(sq, d.react);
        if (close) { sq.target = close; sq.flankDone = true; sq.state = 'advancing'; return; }
        if (!sq.waypoint) {
          const lat = Math.sign((sq.ax - t.cx) * Math.cos(t.face) - (sq.az - t.cz) * Math.sin(t.face)) || 1;
          const rx = Math.cos(t.face) * lat, rz = -Math.sin(t.face) * lat;
          const wx = L.clamp(t.cx + rx * (d.arc + t.radius), 20, this.size - 20);
          const wz = L.clamp(t.cz + rz * (d.arc + t.radius) - Math.cos(t.face) * 10, 20, this.size - 20);
          sq.waypoint = [wx, wz];
          sq.path = this.terrain.path(sq.ax, sq.az, wx, wz, sq.clsName);
          sq.flankTarget = t;
        }
        if (L.dist(sq.ax, sq.az, sq.waypoint[0], sq.waypoint[1]) < 15 || !sq.flankTarget || sq.flankTarget.alive <= 0) {
          sq.flankDone = true;
          sq.target = sq.flankTarget && sq.flankTarget.alive > 0 ? sq.flankTarget : this.nearestEnemy(sq, 9999);
          sq.state = 'charging';
          return;
        }
        sq.state = 'flanking';
        return;
      }
      const react = d.react;
      let t = d.seek ? this.nearestEnemy(sq, 9999) : this.nearestEnemy(sq, react);
      if (!t) {
        const ahead = this.nearestEnemy(sq, 600, 0.35) || this.nearestEnemy(sq, 9999);
        if (ahead) { sq.goalSquad = ahead; sq.state = d.run ? 'charging' : 'advancing'; sq.target = null; return; }
        sq.state = 'holding';
        return;
      }
      sq.target = t;
      sq.state = d.run ? 'charging' : 'advancing';
    }

    shooterBrain(sq, stationary) {
      const f = sq.def.fire;
      if (!f || sq.state === 'engaged' && this.time - sq.lastEngaged < 1.2) return false;
      const d = L.DOCTRINES[sq.doctrine];
      if (!d.fire && !stationary) return false;
      const ammo = sq.soldiers.reduce((a, s) => a + (s.alive ? s.ammo : 0), 0);
      if (ammo <= 0) return false;
      if (sq.def.pilum) {
        const t = sq.target || this.nearestEnemy(sq, 30);
        if (t && this.edgeDist(sq, t) < sq.stats.range - 2 && this.edgeDist(sq, t) > 3 && t.state !== 'routing') {
          sq.fireTarget = t;
          if (sq.volleyT <= 0 && sq.state !== 'volley') sq.volleyT = 2.2;
          if (sq.volleyT > 0) { sq.state = 'volley'; sq.target = t; return true; }
        }
        return false;
      }
      const range = sq.stats.range;
      const t = this.nearestEnemy(sq, range + 25);
      if (!t) {
        sq.fireTarget = null;
        return false;
      }
      const dist = this.edgeDist(sq, t);
      if (sq.clsName === 'Skirmisher' && !t.def.fire && sq.evades < 6 && dist < 18 && t.state !== 'routing' && !t.cls.cav && !sq.stay) {
        const [ex, ez] = [t.cx, t.cz];
        const l = L.dist(sq.ax, sq.az, ex, ez) || 1;
        const tx = L.clamp(sq.ax + (sq.ax - ex) / l * 32, 12, this.size - 12), tz = L.clamp(sq.az + (sq.az - ez) / l * 32, 12, this.size - 12);
        if (this.terrain.passable(tx, tz, sq.clsName)) {
          sq.evades++;
          sq.order = { type: 'move', x: tx, z: tz, run: true, evade: true, face: sq.face };
          sq.path = [[tx, tz]];
          sq.state = 'evading';
          return true;
        }
      }
      if (dist <= range) {
        sq.fireTarget = t;
        sq.state = 'shooting';
        return true;
      }
      if (stationary) return false;
      sq.fireTarget = null;
      sq.goalSquad = t;
      sq.target = null;
      sq.state = 'advancing';
      return true;
    }

    moveAnchor(sq, dt) {
      if (sq.state === 'routing') {
        sq.ax = sq.cx;
        sq.az = sq.cz;
        return;
      }
      if (sq.volleyT > 0) {
        sq.volleyT -= dt;
        if (sq.volleyT <= 0) {
          sq.volleyT = -6;
          sq.state = 'charging';
          sq.chargeT = 3;
        }
        this.faceToward(sq, sq.fireTarget, dt);
        sq.moving = false;
        return;
      }
      if (sq.volleyT < 0) sq.volleyT = Math.min(0, sq.volleyT + dt);
      let gx = null, gz = null, run = false;
      const st = sq.state;
      if (sq.order && sq.order.type === 'move' && (st === 'moving' || st === 'withdrawing' || st === 'evading')) {
        if (!sq.path || !sq.path.length) sq.path = [[sq.order.x, sq.order.z]];
        let wp = sq.path[0];
        if (L.dist(sq.ax, sq.az, wp[0], wp[1]) < 3 && sq.path.length > 1) { sq.path.shift(); wp = sq.path[0]; }
        gx = wp[0]; gz = wp[1];
        run = sq.order.run;
      } else if (st === 'flanking' && sq.waypoint) {
        if (!sq.path || !sq.path.length) sq.path = [sq.waypoint];
        let wp = sq.path[0];
        if (L.dist(sq.ax, sq.az, wp[0], wp[1]) < 4 && sq.path.length > 1) { sq.path.shift(); wp = sq.path[0]; }
        gx = wp[0]; gz = wp[1];
        run = sq.cls.cav;
      } else if ((st === 'advancing' || st === 'charging' || st === 'engaged' || st === 'pursuing') && (sq.target || sq.goalSquad)) {
        const t = sq.target || sq.goalSquad;
        if (t.alive > 0) {
          const dx = t.cx - sq.ax, dz = t.cz - sq.az;
          const l = Math.hypot(dx, dz) || 1;
          const stop = sq.target ? (sq.depth * 0.5 + t.depth * 0.45 + 0.6) : 0;
          if (l > stop) {
            const k = (l - stop) / l;
            [gx, gz] = this.routeTo(sq, sq.ax + dx * k, sq.az + dz * k);
          }
          run = st === 'charging' || st === 'pursuing' || (sq.cls.cav && sq.target && l < 70);
          if (st === 'engaged') run = false;
        }
      } else if (st === 'shooting' && sq.fireTarget) {
        this.faceToward(sq, sq.fireTarget, dt);
      }
      if (gx == null) {
        sq.moving = false;
        sq.running = false;
        sq.speedNow = 0;
        if ((st === 'engaged' || st === 'holding') && sq.target) this.faceToward(sq, sq.target, dt);
        if (st === 'holding' && !sq.target && sq.order == null && sq.holdFace != null) sq.face = L.turnToward(sq.face, sq.holdFace, dt);
        return;
      }
      const dx = gx - sq.ax, dz = gz - sq.az;
      const l = Math.hypot(dx, dz);
      if (l < 0.3) { sq.moving = false; sq.speedNow = 0; return; }
      let sp = this.squadSpeed(sq, run);
      const want = Math.atan2(dx, dz);
      const diff = Math.abs(L.wrapAngle(want - sq.face));
      const turnRate = sq.cls.cav ? 1.3 : 1.0;
      if (sq.order && (sq.order.evade || sq.order.disengage || sq.order.retreat) && diff > 1.6) {
        sq.face = L.turnToward(sq.face, want, dt * turnRate * 2);
      } else {
        sq.face = L.turnToward(sq.face, want, dt * turnRate);
        if (diff > 0.9) sp *= 0.35;
      }
      const step = Math.min(l, sp * dt);
      const nx = sq.ax + dx / l * step, nz = sq.az + dz / l * step;
      if (this.terrain.passable(nx, nz, sq.clsName)) {
        sq.ax = nx;
        sq.az = nz;
      } else if (!(sq.repathT > this.time)) {
        sq.repathT = this.time + 1;
        sq.route = null;
        sq.path = this.terrain.path(sq.ax, sq.az, gx, gz, sq.clsName);
      }
      sq.moving = true;
      sq.running = run;
      sq.speedNow = sp;
      if (run && st === 'charging' && sq.target && this.edgeDist(sq, sq.target) < 12 && sq.chargeT <= 0) {
        sq.chargeT = 3;
        this.emit({ type: 'charge', squad: sq, side: sq.side, x: sq.ax, z: sq.az });
      }
    }

    faceToward(sq, t, dt) {
      if (!t || t.alive <= 0) return;
      const want = Math.atan2(t.cx - sq.ax, t.cz - sq.az);
      sq.face = L.turnToward(sq.face, want, dt * 0.8);
    }

    squadSpeed(sq, run) {
      let sp = 30 / sq.cls.move[0];
      const f = L.FORMS[sq.form];
      sp *= 1 + (f.speed || 0) + (sq.stats.speed || 0);
      if (run) sp *= sq.cls.run;
      if (sq.favour && L.FAVOURS[sq.favour].fx.speedMul) sp *= L.FAVOURS[sq.favour].fx.speedMul;
      sp *= Math.max(0.25, this.terrain.speedFactor(sq.ax, sq.az, sq.clsName));
      return sp;
    }

    updateSoldier(s, dt) {
      const sq = s.sq;
      s.px = s.x;
      s.pz = s.z;
      s.animT += dt;
      const routing = sq.state === 'routing';
      let tx, tz, speed, face = null, anim = null;
      const favSpeed = sq.favour && L.FAVOURS[sq.favour].fx.speedMul ? L.FAVOURS[sq.favour].fx.speedMul : 1;
      const baseSpeed = 30 / sq.cls.move[0] * (1 + (L.FORMS[sq.form].speed || 0) + (sq.stats.speed || 0)) * s.speedJ * favSpeed;
      const tf = Math.max(0.25, this.terrain.speedFactor(s.x, s.z, sq.clsName));
      if (routing) {
        if (!s.fleeDir) s.fleeDir = this.backOf(sq.side)[2] + s.jx * 0.5;
        tx = s.x + Math.sin(s.fleeDir) * 10;
        tz = s.z + Math.cos(s.fleeDir) * 10;
        speed = baseSpeed * sq.cls.run * tf;
        anim = 'flee';
        s.target = null;
      } else {
        const inCombat = this.soldierCombat(s, dt);
        if (!s.alive) return;
        if (inCombat) {
          const t = s.target;
          const d = L.dist(s.x, s.z, t.x, t.z);
          const reach = Math.max(sq.cls.reach + t.sq.cls.reach * 0.35, sq.cls.sep + t.sq.cls.sep + 0.3);
          face = Math.atan2(t.x - s.x, t.z - s.z);
          if (d > reach) {
            tx = t.x - (t.x - s.x) / d * reach * 0.85;
            tz = t.z - (t.z - s.z) / d * reach * 0.85;
            speed = baseSpeed * (sq.cls.cav ? 1.6 : 1.4) * tf;
          } else {
            tx = s.x;
            tz = s.z;
            speed = 0;
          }
        } else {
          const [sx, sz] = this.slotPos(sq, s);
          tx = sx;
          tz = sz;
          const d = L.dist(s.x, s.z, sx, sz);
          const squadSp = sq.moving ? sq.speedNow : 0;
          speed = Math.max(squadSp * 1.25, Math.min(d * 1.5, baseSpeed * (d > 6 ? sq.cls.run : 1.2))) * tf;
          if (d < 0.25) speed = 0;
        }
      }
      const dx = tx - s.x, dz = tz - s.z;
      const l = Math.hypot(dx, dz);
      let mx = 0, mz = 0;
      if (l > 0.01 && speed > 0) {
        const step = Math.min(l, speed * dt);
        mx = dx / l * step;
        mz = dz / l * step;
      }
      const sep = sq.cls.sep;
      let px = 0, pz = 0;
      const sx0 = s.x, sz0 = s.z;
      this.query(s.x, s.z, 2.4, o => {
        if (o === s) return;
        const ox = sx0 - o.x, oz = sz0 - o.z;
        const d2 = ox * ox + oz * oz;
        const minD = sep + o.sq.cls.sep;
        if (d2 < minD * minD && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const push = (minD - d) / minD;
          const w = o.sq === sq ? 0.5 : 0.9;
          px += ox / d * push * w;
          pz += oz / d * push * w;
        }
      });
      const pl = Math.hypot(px, pz);
      if (pl > 0) {
        const pmax = 2.2 * dt;
        const k = Math.min(1, pmax / pl) * Math.min(pl, 1);
        mx += px * k * 1.5;
        mz += pz * k * 1.5;
      }
      let nx = s.x + mx, nz = s.z + mz;
      nx = L.clamp(nx, 2, this.size - 2);
      nz = L.clamp(nz, 2, this.size - 2);
      if (this.terrain.typeAt(nx, nz) === L.T.water) {
        nx = s.x;
        nz = s.z;
      }
      s.x = nx;
      s.z = nz;
      const moved = Math.hypot(s.x - s.px, s.z - s.pz) / dt;
      s.vx = (s.x - s.px) / dt;
      s.vz = (s.z - s.pz) / dt;
      if (face != null) s.face = L.turnToward(s.face, face, dt * 6);
      else if (moved > 0.4) s.face = L.turnToward(s.face, Math.atan2(s.vx, s.vz), dt * 5);
      else s.face = L.turnToward(s.face, sq.face + s.sface, dt * 3);
      s.walkPhase += moved * dt;
      if (!anim) {
        if (s.fightT > 0) {
          s.fightT -= dt;
          anim = s.anim === 'shoot' ? 'shoot' : 'fight';
        } else if (s.target && L.dist(s.x, s.z, s.target.x, s.target.z) < sq.cls.reach + 1.5) anim = 'ready';
        else if (moved > baseSpeed * 1.35) anim = 'run';
        else if (moved > 0.35) anim = 'walk';
        else anim = s.anim === 'ready' && this.time - sq.lastEngaged < 3 ? 'ready' : 'stand';
      }
      if (anim !== s.anim) {
        s.anim = anim;
        s.animT = 0;
        if (anim === 'fight' || anim === 'stand' || anim === 'ready') s.animVar = this.rnd.int(3);
      }
      if (routing || sq.escaping) this.checkFled(s);
      if (sq.def.fire && !routing) this.soldierShoot(s, dt);
    }

    routeTo(sq, gx, gz) {
      const t = this.terrain;
      if (!t.anyBlocked || t.lineClear(sq.ax, sq.az, gx, gz)) {
        sq.route = null;
        return [gx, gz];
      }
      let r = sq.route;
      if (!r || this.time > r.until || L.dist(r.gx, r.gz, gx, gz) > 40) {
        r = sq.route = { pts: t.path(sq.ax, sq.az, gx, gz, sq.clsName), gx, gz, until: this.time + 3 };
      }
      while (r.pts.length > 1 && L.dist(sq.ax, sq.az, r.pts[0][0], r.pts[0][1]) < 5) r.pts.shift();
      return r.pts[0] || [gx, gz];
    }

    backOf(side) {
      const a = L.wrapAngle(this.sides[side].face + Math.PI);
      return [unit(Math.sin(a)), unit(Math.cos(a)), a];
    }

    escapePoint(edge, x, z, margin) {
      const far = this.size - margin;
      if (edge === 'north') return [x, margin];
      if (edge === 'south') return [x, far];
      if (edge === 'west') return [margin, z];
      return [far, z];
    }

    updateEscape() {
      const e = this.cfg.escape;
      const g = this.sides[1].general;
      if (!g || g.alive <= 0 || g.state === 'fled' || g.state === 'routing') return;
      if (!g.escaping) {
        const threat = this.squads.some(o => o.side === 0 && o.alive > 0 && o.state !== 'routing' && L.dist(o.cx, o.cz, g.cx, g.cz) < e.threat);
        if (this.time < e.after && !threat) return;
        g.escaping = true;
        this.emit({ type: 'escape', squad: g, side: 1 });
        for (const o of this.squads) {
          if (o.side !== 1 || o === g || o.alive <= 0 || o.aiRole !== 'escort') continue;
          const [tx, tz] = this.escapePoint(e.edge, g.ax + (o.ax - g.ax) * 0.3, g.az + (o.az - g.az) * 0.3, 30);
          o.order = { type: 'move', x: tx, z: tz, run: false };
          o.path = this.terrain.path(o.ax, o.az, tx, tz, o.clsName);
        }
      }
      if (!g.order || g.order.type !== 'move') {
        const [tx, tz] = this.escapePoint(e.edge, g.ax, g.az, 2);
        g.order = { type: 'move', x: tx, z: tz, run: !e.walk, retreat: true };
        g.path = this.terrain.path(g.ax, g.az, tx, tz, g.clsName);
        g.holding = false;
      }
    }

    checkFled(s) {
      const m = 6;
      if (s.x < m || s.z < m || s.x > this.size - m || s.z > this.size - m) {
        s.alive = false;
        s.gone = true;
        const sq = s.sq;
        sq.alive--;
        sq.fledMen = (sq.fledMen || 0) + 1;
        this.sides[sq.side].fled++;
        if (sq.alive <= 0) {
          sq.state = 'fled';
          this.emit({ type: sq.escaping ? 'escaped' : 'fled', squad: sq, side: sq.side });
        }
      }
    }

    soldierCombat(s, dt) {
      const sq = s.sq;
      s.searchT -= dt;
      if (s.target && (!s.target.alive || L.dist(s.x, s.z, s.target.x, s.target.z) > 9)) s.target = null;
      const engagedSquad = sq.state === 'engaged' || sq.state === 'charging' || sq.state === 'pursuing' || sq.state === 'advancing' || sq.state === 'holding' || sq.state === 'waiting' || sq.state === 'shooting' || sq.state === 'volley' || sq.state === 'flanking';
      if (!s.target && s.searchT <= 0) {
        s.searchT = 0.3 + this.rnd.next() * 0.2;
        const mine = sq.target;
        const r = (sq.state === 'engaged' || sq.state === 'pursuing' ? 6 : 2.8) + Math.max(0, sq.cls.reach - 1.2) * 1.5;
        let best = null, bd = r * r;
        const x0 = s.x, z0 = s.z;
        this.query(s.x, s.z, r, o => {
          if (o.sq.side === sq.side || !o.alive || o.sq.state === 'absent') return;
          const dx = o.x - x0, dz = o.z - z0;
          let d2 = dx * dx + dz * dz;
          if (mine && o.sq !== mine) d2 *= 1.4;
          if (sq.state === 'pursuing' && o.sq.state !== 'routing') d2 *= 1.6;
          if (d2 < bd) { bd = d2; best = o; }
        });
        if (best && (engagedSquad || bd < 6)) s.target = best;
      }
      if (!s.target) return false;
      const t = s.target;
      const d = L.dist(s.x, s.z, t.x, t.z);
      const reach = Math.max(sq.cls.reach + t.sq.cls.reach * 0.35, sq.cls.sep + t.sq.cls.sep + 0.3);
      sq.lastEngaged = this.time;
      if (t.sq.state !== 'routing') t.sq.lastEngaged = this.time;
      if (sq.cls.cav && sq.chargeT > 0 && !t.sq.cls.cav && d < reach + 1.2) this.tryTrample(s, t);
      if (!s.alive) return false;
      if (!t.alive) { s.target = null; return false; }
      s.cd -= dt;
      if (d <= reach + 0.15 && s.cd <= 0) {
        const kind = sq.def.leader ? 'leader' : sq.clsName === 'Elephant' ? 'elephant' : sq.cls.cav ? 'cav' : 'foot';
        s.cd = SWING[kind] * this.rnd.range(0.8, 1.25);
        s.fightT = 0.9;
        s.anim = 'fight';
        s.animT = 0;
        s.animVar = this.rnd.int(3);
        this.strike(s, t);
      }
      return true;
    }

    tryTrample(s, t) {
      if (t.trampled === s.uid || !t.alive) return;
      t.trampled = s.uid;
      const a = s.sq, d = t.sq;
      const frontal = Math.abs(L.wrapAngle(Math.atan2(s.x - t.x, s.z - t.z) - d.face)) < 1.0;
      const spearWall = (d.def.spear || d.def.trample[1] >= 50 || d.form === 'square') && frontal && d.state !== 'routing' && a.clsName !== 'Elephant';
      if (spearWall && this.rnd.chance(0.16 + (d.form === 'defend' || d.form === 'square' ? 0.08 : 0))) {
        this.kill(s, t, 'melee');
        return;
      }
      let p = (a.stats.tr - d.stats.ta * 0.5 - (L.FORMS[d.form].ta || 0) * 0.5) / 100;
      p *= this.terrain.effAt(s.x, s.z, a.clsName);
      if (d.state === 'routing') p = Math.max(p, 0.35);
      if (d.clsName === 'Skirmisher') p *= 1.3;
      if (p <= 0 || !this.rnd.chance(p)) return;
      this.kill(t, s, 'trample');
      d.morale -= d.moraleMax * 0.015;
    }

    terrainEff(s) {
      return this.terrain.effAt(s.x, s.z, s.sq.clsName);
    }

    moraleEff(sq) {
      const p = sq.morale / sq.moraleMax;
      return p > 0.6 ? 1 : p > 0.3 ? 0.95 : p > 0.12 ? 0.86 : 0.76;
    }

    strike(a, d) {
      const A = a.sq, D = d.sq;
      const as = A.stats, ds = D.stats;
      const af = L.FORMS[A.form], df = L.FORMS[D.form];
      const effA = Math.pow(this.terrainEff(a), 0.5) * this.moraleEff(A);
      const effD = this.terrainEff(d);
      let hit = as.hit * (1 + af.hit) + (A.family === 'regular' ? 2 : 0);
      let ag = ds.ag * (D.favour && L.FAVOURS[D.favour].fx.agMul ? L.FAVOURS[D.favour].fx.agMul : 1);
      if (D.state === 'routing') ag *= 0.3;
      let p = 0.12 + 0.75 * hit / (hit + 0.45 * ag + 6);
      const dh = this.terrain.heightAt(a.x, a.z) - this.terrain.heightAt(d.x, d.z);
      if (dh > 1.2) p += 0.06;
      else if (dh < -1.2) p -= 0.05;
      const toA = Math.atan2(a.x - d.x, a.z - d.z);
      const rel = Math.abs(L.wrapAngle(toA - D.face));
      let flank = 0;
      if (!df.noFlank && D.state !== 'routing') {
        if (rel > 2.1) flank = 2;
        else if (rel > 1.05) flank = 1;
      }
      if (flank === 1) { p += 0.08; D.flankHits += 1; }
      if (flank === 2) { p += 0.16; D.rearHits += 1; }
      if (A.chargeT > 0) p += A.cls.cav ? 0.12 : 0.06;
      const vsMounted = D.cls.cav && !D.def.leader;
      const spear = !A.cls.cav && (A.def.spear || A.def.trample[1] >= 50);
      if (A.cls.cav && !D.cls.cav && A.chargeT <= 0 && D.state !== 'routing') p *= 0.7;
      if (!A.cls.cav && vsMounted) p += spear ? 0.14 : 0.05;
      p = p * effA * (1 + (1 - effD) * 0.4);
      if (A.cls.cav && ds.defCav) p *= 1 - ds.defCav / 200;
      if (!A.cls.cav && ds.defInf) p *= 1 - ds.defInf / 200;
      p = L.clamp(p, 0.05, 0.92);
      if (!this.rnd.chance(p)) {
        if (this.rnd.chance(0.25)) this.emit({ type: 'clash', x: d.x, z: d.z, side: D.side });
        return;
      }
      let crit = 0;
      if (D.cls.cav && D.clsName !== 'Elephant') crit += as.vsCav || 0;
      else if (D.clsName === 'Elephant') crit += (as.vsEle || 0) * 2;
      else crit += as.vsInf || 0;
      if (A.favour && L.FAVOURS[A.favour].fx.meleeCrit) crit = Math.max(crit, L.FAVOURS[A.favour].fx.meleeCrit);
      if (crit > 0 && this.rnd.chance(crit / 100)) {
        this.kill(d, a, 'crit');
        this.emit({ type: 'hit', x: d.x, z: d.z, side: D.side, dmg: -1 });
        return;
      }
      let dm = as.dm * (1 + af.dm) * effA * this.rnd.range(0.75, 1.25) * (A.def.ke || 250) / 250;
      if (spear && vsMounted) dm *= 1.25;
      if (A.chargeT > 0) dm *= (A.cls.cav ? 1.55 : 1.25) * (1 + (af.charge || 0));
      if (A.favour && L.FAVOURS[A.favour].fx.dmMul) dm *= L.FAVOURS[A.favour].fx.dmMul * (A.favour === 'hercules' ? this.rnd.range(0.85, 1.2) : 1);
      let ar = ds.ar * (1 + df.ar) * Math.pow(effD, 0.3) * (1 - (as.pierce || 0)) * (D.family === 'regular' ? 1.2 : 1);
      if (flank === 2) ar *= 0.7;
      let dmg = dm * dm / (dm + Math.max(0, ar));
      if (D.favour && L.FAVOURS[D.favour].fx.takenMul) dmg *= L.FAVOURS[D.favour].fx.takenMul;
      d.hp -= dmg;
      const shock = (as.cc || 1) * 0.0011 * (A.clsName === 'Elephant' ? 1.5 : 1);
      if (!(D.favour && L.FAVOURS[D.favour].fx.noMoraleLoss)) D.morale -= D.moraleMax * shock;
      this.emit({ type: 'hit', x: d.x, z: d.z, side: D.side, dmg: Math.max(1, Math.round(dmg)), heavy: dmg > 14 });
      if (d.hp <= 0) this.kill(d, a, 'melee');
      if (A.clsName === 'Elephant' && !a.sweeping) this.elephantSweep(a, d);
    }

    elephantSweep(a, first) {
      const A = a.sq;
      const others = [];
      this.query(a.x, a.z, 4.5, o => {
        if (o !== first && o.alive && o.sq.side !== A.side && others.length < 3) others.push(o);
      });
      a.sweeping = true;
      for (const o of others) {
        if (!o.sq.cls.cav && this.rnd.chance(0.25)) {
          this.kill(o, a, 'trample');
          o.sq.morale -= o.sq.moraleMax * 0.01;
        } else if (this.rnd.chance(0.6)) this.strike(a, o);
      }
      a.sweeping = false;
    }

    kill(d, a, how) {
      if (!d.alive) return;
      d.alive = false;
      d.dead = true;
      d.dieT = 0;
      d.anim = 'die';
      d.animT = 0;
      d.animVar = this.rnd.int(d.sq.cls.cav ? 2 : 4);
      d.target = null;
      const D = d.sq;
      D.alive--;
      D.lost++;
      if (how === 'melee' || how === 'crit' || how === 'trample') D.recentLost++;
      this.sides[D.side].lost++;
      if (a) {
        const A = a.sq;
        A.kills++;
        A.recentKilled++;
        A.xp += L.Army.xpPerKill(D.key);
        A.killValue += D.def.cost / Math.max(1, D.menMax);
        this.sides[A.side].killed++;
      }
      if (!(D.favour && L.FAVOURS[D.favour].fx.noMoraleLoss)) {
        const k = 0.017 + D.def.panic[1] * 0.0012;
        D.morale -= D.moraleMax * k;
      }
      this.emit({ type: how === 'trample' ? 'trample' : 'kill', x: d.x, z: d.z, side: D.side, cav: D.cls.cav, general: D.general, key: D.key });
      if (D.alive <= 0) {
        D.state = 'destroyed';
        this.emit({ type: 'destroyed', squad: D, side: D.side });
      }
      if (D.general && D.alive <= 0) this.generalDied(D);
      if (D.alive > 0 && D.state !== 'routing' && D.lost % 2 === 0) this.relayout(D);
    }

    relayout(sq) {
      this.layout(sq);
    }

    generalDied(g) {
      const side = this.sides[g.side];
      if (side.generalDead) return;
      side.generalDead = true;
      for (const sq of this.squads) {
        if (sq.side !== g.side || sq.alive <= 0) continue;
        sq.morale -= sq.moraleMax * 0.15;
      }
      this.emit({ type: 'general', side: g.side, squad: g });
    }

    soldierShoot(s, dt) {
      const sq = s.sq;
      if (s.release > 0) {
        s.release -= dt;
        if (s.release <= 0) this.launch(s);
      }
      if (sq.state !== 'shooting' && sq.state !== 'volley' && !(sq.holding && sq.fireTarget)) return;
      if (s.target || s.ammo <= 0) return;
      s.shootCd -= dt;
      if (s.shootCd > 0) return;
      const t = sq.fireTarget;
      if (!t || t.alive <= 0) return;
      const range = sq.stats.range;
      const d = L.dist(s.x, s.z, t.cx, t.cz) - t.radius * 0.6;
      if (d > range || d < sq.stats.minRange * 0.5) return;
      s.ammo--;
      s.shootCd = sq.stats.rate * this.rnd.range(0.85, 1.35);
      s.anim = 'shoot';
      s.animT = 0;
      s.fightT = sq.def.bow ? 1.1 : 1.0;
      s.release = sq.def.bow ? 0.55 : 0.45;
      s.shotTarget = t;
      s.face = Math.atan2(t.cx - s.x, t.cz - s.z);
    }

    launch(s) {
      const sq = s.sq;
      const t = s.shotTarget;
      if (!t || t.alive <= 0 || !s.alive) return;
      let best = null, bd = Infinity;
      for (let i = 0; i < 4; i++) {
        const cand = t.soldiers[this.rnd.int(t.soldiers.length)];
        if (!cand.alive) continue;
        const d = L.dist(s.x, s.z, cand.x, cand.z);
        if (d < bd) { bd = d; best = cand; }
      }
      if (!best) return;
      const kind = sq.def.bow ? 'arrow' : sq.def.pilum ? 'pilum' : 'javelin';
      const speed = PROJ[kind];
      const flight = Math.max(0.35, bd / speed) * (kind === 'arrow' ? 1.25 : 1);
      const scatter = bd * 0.045;
      const tx = best.x + best.vx * flight + this.rnd.range(-scatter, scatter);
      const tz = best.z + best.vz * flight + this.rnd.range(-scatter, scatter);
      const y0 = this.terrain.heightAt(s.x, s.z) + 1.7;
      const y1 = this.terrain.heightAt(tx, tz) + 1.0;
      const g = 9.8;
      const vy = (y1 - y0 + 0.5 * g * flight * flight) / flight;
      this.projectiles.push({ kind, x: s.x, y: y0, z: s.z, vx: (tx - s.x) / flight, vy, vz: (tz - s.z) / flight, t: 0, T: flight, tx, tz, target: best, from: sq, dist: bd, side: sq.side });
      this.emit({ type: 'shoot', x: s.x, z: s.z, kind, side: sq.side });
    }

    updateProjectiles(dt) {
      const g = 9.8;
      const keep = [];
      for (const p of this.projectiles) {
        p.t += dt;
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.vy -= g * dt;
        p.y += p.vy * dt;
        if (p.t < p.T) { keep.push(p); continue; }
        let victim = null;
        if (p.target.alive && L.dist(p.target.x, p.target.z, p.tx, p.tz) < 1.4) victim = p.target;
        else {
          let bd = 0.9 * 0.9;
          this.query(p.tx, p.tz, 1.2, o => {
            if (!o.alive || o.sq.side === p.side) return;
            const d2 = (o.x - p.tx) ** 2 + (o.z - p.tz) ** 2;
            if (d2 < bd) { bd = d2; victim = o; }
          });
        }
        if (victim) this.shotHit(p, victim);
        else {
          this.stuck.push({ kind: p.kind, x: p.tx, z: p.tz, y: this.terrain.heightAt(p.tx, p.tz), ax: Math.atan2(p.vx, p.vz), t: this.time });
          if (this.stuck.length > 900) this.stuck.shift();
        }
      }
      this.projectiles = keep;
    }

    shotHit(p, d) {
      const A = p.from, D = d.sq;
      const as = A.stats, ds = D.stats;
      const df = L.FORMS[D.form];
      const dens = D.family === 'checker' ? 0.7 : D.family === 'irregular' ? 0.95 : D.family === 'elephant' ? 1.5 : D.cls.cav ? 1.1 : 1.15;
      let sh = as.sh;
      if (A.favour && L.FAVOURS[A.favour].fx.shMul) sh *= L.FAVOURS[A.favour].fx.shMul;
      let pHit = (0.08 + sh * 0.008) * (1 - 0.35 * Math.min(1, p.dist / Math.max(20, as.range))) * dens;
      pHit *= 1 - Math.min(0.7, ds.sa * (1 + (df.sa || 0)) * 0.07);
      if (D.favour && L.FAVOURS[D.favour].fx.agMul) pHit *= 0.6;
      pHit = L.clamp(pHit, 0.03, 0.85);
      if (!this.rnd.chance(pHit)) {
        this.emit({ type: 'block', x: d.x, z: d.z, side: D.side, kind: p.kind });
        return;
      }
      let crit = as.crit || 0;
      if (A.favour && L.FAVOURS[A.favour].fx.critMin) crit = Math.max(crit, L.FAVOURS[A.favour].fx.critMin);
      this.emit({ type: 'missilehit', x: d.x, z: d.z, side: D.side, cav: D.cls.cav, kind: p.kind });
      if (!(D.favour && L.FAVOURS[D.favour].fx.noMoraleLoss)) D.morale -= D.moraleMax * (p.kind === 'pilum' ? 0.015 : 0.006);
      if (crit > 0 && this.rnd.chance(crit / 100)) {
        this.kill(d, { sq: A }, 'shot');
        this.emit({ type: 'hit', x: d.x, z: d.z, side: D.side, dmg: -1 });
        return;
      }
      const sd = as.sd * this.rnd.range(0.75, 1.25);
      let dmg = sd * sd / (sd + ds.ar * 0.6);
      if (D.favour && L.FAVOURS[D.favour].fx.takenMul) dmg *= L.FAVOURS[D.favour].fx.takenMul;
      d.hp -= dmg;
      this.emit({ type: 'hit', x: d.x, z: d.z, side: D.side, dmg: Math.max(1, Math.round(dmg)) });
      if (d.hp <= 0) this.kill(d, { sq: A }, 'shot');
    }

    updateMorale(sq, dt) {
      const side = this.sides[sq.side];
      const fav = sq.favour ? L.FAVOURS[sq.favour].fx : null;
      if (sq.flankHits || sq.rearHits) {
        if (!(fav && fav.noMoraleLoss)) sq.morale -= sq.moraleMax * (sq.flankHits * 0.0035 + sq.rearHits * 0.007);
        sq.flankHits = 0;
        sq.rearHits = 0;
      }
      if (sq.recentLost > sq.recentKilled + 2 && !(fav && fav.noMoraleLoss)) sq.morale -= sq.moraleMax * Math.min(0.01, 0.0025 * (sq.recentLost - sq.recentKilled)) * dt;
      let aura = false;
      const g = side.general;
      if (g && !side.generalDead && g.alive > 0 && g !== sq) aura = L.dist(sq.cx, sq.cz, g.cx, g.cz) < side.leaderR;
      const engaged = this.time - sq.lastEngaged < 1.5;
      if (sq.state === 'routing') {
        const threat = this.nearestEnemy(sq, 35);
        if (!threat) {
          sq.calmT += dt;
          if (sq.calmT > 4) sq.morale += sq.moraleMax * 0.03 * dt * (aura ? 1.6 : 1);
          if (sq.morale > sq.moraleMax * 0.35 && sq.rallies < 2) this.rallySquad(sq);
        } else sq.calmT = 0;
        return;
      }
      if (!engaged) {
        const regen = 0.012 + (aura ? 0.01 : 0);
        sq.morale = Math.min(sq.moraleMax, sq.morale + sq.moraleMax * regen * dt);
      } else if (aura) sq.morale = Math.min(sq.moraleMax, sq.morale + sq.moraleMax * 0.004 * dt);
      const p = sq.morale / sq.moraleMax;
      sq.cohesion = p > 0.6 ? 4 : p > 0.3 ? 3 : p > 0.12 ? 2 : 1;
      if (sq.morale <= 0 && !(fav && fav.noRout)) this.routSquad(sq);
    }

    checkBreak(sideIdx) {
      const side = this.sides[sideIdx];
      if (side.broken || !side.men0) return;
      if (this.reinforcements.some(r => !r.spawned && (r.side == null ? 1 : r.side) === sideIdx)) return;
      let gone = side.lost + side.fled;
      for (const sq of this.squads) if (sq.side === sideIdx && sq.onField && sq.state === 'routing') gone += sq.alive;
      if (gone < side.men0 * BREAK_AT[sideIdx]) return;
      side.broken = true;
      for (const sq of this.squads) {
        if (sq.side !== sideIdx || !sq.onField || sq.alive <= 0 || sq.elite) continue;
        sq.rallies = 2;
        if (sq.favour && L.FAVOURS[sq.favour].fx.noRout) continue;
        if (!sq.general) this.routSquad(sq);
      }
      this.emit({ type: 'armyBreak', side: sideIdx });
    }

    routSquad(sq) {
      if (sq.state === 'routing' || sq.alive <= 0) return;
      sq.state = 'routing';
      sq.order = null;
      sq.target = null;
      sq.holding = false;
      sq.calmT = 0;
      sq.morale = 0;
      for (const s of sq.soldiers) {
        s.target = null;
        s.fleeDir = 0;
      }
      this.emit({ type: 'rout', squad: sq, side: sq.side, x: sq.cx, z: sq.cz });
      for (const o of this.squads) {
        if (o.side !== sq.side || o === sq || o.alive <= 0 || o.state === 'routing') continue;
        if (L.dist(o.cx, o.cz, sq.cx, sq.cz) > 70) continue;
        if (o.favour && L.FAVOURS[o.favour].fx.noMoraleLoss) continue;
        o.morale -= o.moraleMax * (0.03 + o.def.panic[0] * 0.005);
      }
    }

    rallySquad(sq) {
      if (sq.state !== 'routing') return;
      sq.rallies++;
      sq.state = 'holding';
      sq.holding = true;
      sq.holdUntil = this.time + 8;
      sq.morale = Math.max(sq.morale, sq.moraleMax * 0.35);
      const [x, z] = this.centroid(sq);
      sq.ax = x;
      sq.az = z;
      sq.face = this.sides[sq.side].face;
      for (const s of sq.soldiers) s.fleeDir = 0;
      this.layout(sq);
      this.emit({ type: 'rallied', squad: sq, side: sq.side });
    }

    fighting(side) {
      const list = this.squads.filter(s => s.side === side && s.alive > 0 && s.onField && s.state !== 'routing' && s.state !== 'fled' && s.state !== 'absent');
      const troops = list.filter(s => !s.general);
      const pendingOwn = this.reinforcements.some(r => !r.spawned && (r.side == null ? 1 : r.side) === side);
      return troops.length || pendingOwn ? list : [];
    }

    objectiveStatus() {
      const out = [];
      const me = this.sides[0], them = this.sides[1];
      for (const o of this.objectives) {
        let text = '', progress = 0;
        switch (o.type) {
          case 'kill': text = 'Осталось убить: ' + Math.max(0, o.n - me.killed); progress = me.killed / o.n; break;
          case 'survive': text = 'Продержаться: ' + L.fmtTime(Math.max(0, o.sec - this.time)); progress = this.time / o.sec; break;
          case 'killGeneral': text = them.generalDead ? 'Вражеский генерал убит' : 'Убейте вражеского генерала'; progress = them.generalDead ? 1 : 0; break;
          case 'keepGeneral': text = me.generalDead ? 'Наш генерал погиб' : 'Наш генерал должен выжить'; progress = me.generalDead ? 0 : 1; break;
          case 'losses': text = 'Допустимые потери: ' + Math.max(0, o.n - me.lost); progress = 1 - me.lost / o.n; break;
          case 'time': text = 'Время: ' + L.fmtTime(Math.max(0, o.sec - this.time)); progress = 1 - this.time / o.sec; break;
          case 'rout': text = 'Обратите врага в бегство'; progress = 1 - this.fighting(1).length / Math.max(1, this.squads.filter(s => s.side === 1 && s.onField).length); break;
          case 'destroy': {
            const list = this.squads.filter(s => s.side === 1 && s.elite === o.tag);
            const left = list.filter(s => s.alive > 0 && s.state !== 'fled').length;
            text = 'Черная стража: осталось ' + left + ' из ' + list.length;
            progress = 1 - left / Math.max(1, list.length);
            break;
          }
          default: break;
        }
        out.push({ type: o.type, text, progress: L.clamp(progress, 0, 1), done: o.done, failed: o.failed });
      }
      return out;
    }

    checkEnd() {
      if (this.state !== 'battle') return;
      const me = this.sides[0], them = this.sides[1];
      let won = null, reason = '';
      const pending = this.reinforcements.some(r => !r.spawned && (r.side == null || r.side === 1));
      const hasSurvive = this.objectives.some(o => o.type === 'survive');
      for (const o of this.objectives) {
        if (o.type === 'kill' && me.killed >= o.n) o.done = true;
        if (o.type === 'survive' && this.time >= o.sec) o.done = true;
        if (o.type === 'killGeneral' && them.generalDead) o.done = true;
        if (o.type === 'keepGeneral' && me.generalDead) o.failed = true;
        if (o.type === 'losses' && me.lost > o.n) o.failed = true;
        if (o.type === 'time' && this.time > o.sec) o.failed = true;
        if (o.type === 'destroy' && this.squads.filter(s => s.side === 1 && s.elite === o.tag).every(s => s.alive <= 0 || s.state === 'fled')) o.done = true;
        if (o.type === 'rout' && !pending && this.fighting(1).length === 0) o.done = true;
      }
      if (this.cfg.escape && this.sides[1].general && this.sides[1].general.state === 'fled' && !them.generalDead) {
        this.finish(false, 'escape');
        return;
      }
      const main = this.objectives.filter(o => ['kill', 'survive', 'killGeneral', 'rout', 'destroy'].includes(o.type));
      const failed = this.objectives.find(o => o.failed);
      if (failed) { won = false; reason = failed.type; }
      else if (this.fighting(0).length === 0) { won = false; reason = 'routed'; }
      else if (main.length && main.every(o => o.done)) {
        const constraints = this.objectives.filter(o => o.type === 'keepGeneral' || o.type === 'losses');
        if (!constraints.some(o => o.failed)) { won = true; reason = 'objective'; }
      } else if (this.fighting(1).length === 0 && !pending && !hasSurvive) { won = true; reason = 'enemyRouted'; }
      else if (this.fighting(1).length === 0 && !pending && hasSurvive) { won = true; reason = 'enemyRouted'; }
      else if (this.time >= this.maxTime) { won = false; reason = 'timeout'; }
      if (won === null) return;
      if (won) for (const o of this.objectives) if (!o.failed && ['keepGeneral', 'losses', 'time'].includes(o.type)) o.done = true;
      this.finish(won, reason);
    }

    finish(won, reason) {
      this.state = 'over';
      this.result = this.buildResult(won, reason);
      this.emit({ type: 'end', won, reason });
    }

    buildResult(won, reason) {
      const me = this.sides[0], them = this.sides[1];
      let killScore = 0, routScore = 0, enemyValue = 0, enemyMen = 0, lostMen = 0;
      for (const sq of this.squads) {
        if (!sq.onField) continue;
        if (sq.side === 0) {
          lostMen += sq.lost;
          continue;
        }
        const per = sq.def.cost / Math.max(1, sq.menMax) * 2 + 4;
        killScore += sq.lost * per;
        enemyValue += sq.men0 * per;
        enemyMen += sq.men0;
        if (sq.state === 'routing' || sq.state === 'fled' || sq.state === 'destroyed') routScore += sq.men0 * per * 0.25;
      }
      const lossScore = lostMen * enemyValue / Math.max(1, enemyMen);
      const cfg = this.cfg;
      const par = cfg.par || 360;
      const survive = this.objectives.some(o => o.type === 'survive');
      const speed = survive ? 1 : L.clamp(2 - this.time / par, 0.5, 1.5);
      const bonus = won ? Math.round((cfg.scoreBonus || enemyValue * 0.2) * speed) : 0;
      const score = Math.max(0, Math.round(killScore + routScore + bonus - lossScore));
      const medals = cfg.medals || [Math.round(enemyValue * 0.55), Math.round(enemyValue * 0.85)];
      let medal = 0;
      if (score >= medals[1]) medal = 2;
      else if (score >= medals[0]) medal = 1;
      const squads = this.squads.filter(s => s.side === 0 && s.ref != null && s.onField).map(s => ({
        id: s.ref, name: s.name, key: s.key, kills: s.kills, lost: s.lost, men: s.alive + (s.fledMen || 0),
        xp: Math.round(s.xp + (won ? 20 : 8)), state: s.state
      }));
      return {
        won, reason, time: this.time, kills: me.killed, lost: me.lost, enemyMen: them.men0, playerMen: me.men0, fled: them.fled,
        score, medal: won ? medal : 0, medals, killScore: Math.round(killScore), routScore: Math.round(routScore), lossScore: Math.round(lossScore), bonus, speed,
        squads, objectives: this.objectiveStatus()
      };
    }

    stateName(sq) {
      return STATE_NAMES[sq.state] || '';
    }
  }

  L.Battle = Battle;
  L.STATE_NAMES = STATE_NAMES;
  L.COSTS = { signal: SIGNAL_COST, rally: RALLY_COST, retreat: RETREAT_COST };
})(globalThis.Legion = globalThis.Legion || {});
