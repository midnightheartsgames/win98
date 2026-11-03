(function (H) {
  'use strict';
  const DIRS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  const TURN = ['up', 'right', 'down', 'left'];
  const FIELD = { scan: 7.5, ahead: 10, beam: 0.9, mateSpeed: 5.5, mateRush: 0.3, mateLost: 8, leadSpeed: 4, leadTether: 6, leadNear: 3 };
  const SOLID = new Set(['dispatch', 'screen', 'pyxis', 'foeactor', 'lfdog', 'sconce']);
  const SCONCES_IN_SEAL = 4;

  const HEX = [[0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0]];
  const ABACUS = {
    gate1: {
      title: 'Нефритовая схема: первая подложка', axes: [[0, 0], [0, 1]], modules: { '0,-1': 'a' }, bases: { '0,2': 'a' },
      tips: ['Это вычислительный модуль, который можно перемещать.', 'Выберите основу оси, чтобы переместить вычислительные модули вокруг неё.', 'Переместите все вычислительные модули на соответствующие базы для нормального функционирования подложки.']
    },
    gate2: {
      title: 'Нефритовая схема: вторая подложка', axes: [[0, 0], [2, -1], [1, 1]], modules: { '-1,0': 'a', '1,2': 'b' }, bases: { '3,-1': 'a', '0,-1': 'b' },
      tips: ['Теперь модулей два, а у оси три основы. Одна ось двигает все модули вокруг себя сразу.', 'Цинцюэ: «Если один модуль уже на месте, не трогайте его ось без необходимости».']
    }
  };
  const MUTARE = {
    t: { title: 'Временной терминал', steps: 8, start: [3, 6], handles: [[[0, 1]], [[1, 1]]], names: ['Внутреннее кольцо', 'Внешнее кольцо'], tip: 'Совместите части знака с образцом на стеле. Кольца вращаются независимо.' },
    s: { title: 'Пространственный терминал', steps: 8, start: [2, 5, 3], handles: [[[0, 1]], [[1, 1]], [[2, 1], [1, 1]]], names: ['Внутреннее кольцо', 'Среднее кольцо', 'Внешнее и среднее'], tip: 'Третья ручка тянет за собой среднее кольцо. Начинайте с внешнего.' },
    k: { title: 'Кармический терминал', steps: 8, start: [3, 6, 0], handles: [[[0, 1], [1, 1]], [[1, -1]]], names: ['Внутреннее и среднее', 'Среднее назад'], tip: 'Внешнее кольцо закреплено: оно и задаёт верное положение. Первая ручка двигает сразу два кольца.' }
  };
  const abacusRing = (d, ax) => {
    const axes = new Set(d.axes.map(a => a.join()));
    return HEX.map(([q, r]) => [ax[0] + q, ax[1] + r]).filter(c => !axes.has(c.join()));
  };
  const abacusCells = d => {
    const out = new Map();
    for (const a of d.axes) for (const c of abacusRing(d, a)) out.set(c.join(), c);
    return [...out.values()];
  };
  const abacusTurn = (d, mods, i) => {
    const ring = abacusRing(d, d.axes[i]).map(c => c.join()), next = Object.assign({}, mods);
    for (const k of ring) delete next[k];
    ring.forEach((k, n) => { if (mods[k]) next[ring[(n + 1) % ring.length]] = mods[k]; });
    return next;
  };
  const abacusDone = (d, mods) => Object.entries(d.bases).every(([k, v]) => mods[k] === v);
  const mutareTurn = (d, pos, i, dir) => {
    const next = pos.slice();
    for (const [ring, step] of d.handles[i]) next[ring] = (next[ring] + step * (dir || 1) + d.steps * 4) % d.steps;
    return next;
  };
  const mutareDone = pos => pos.every(v => v === 0);

  const P = H.Game.prototype;
  const base = { mapMusic: P.mapMusic, loadMap: P.loadMap, blocked: P.blocked, solidEnt: P.solidEnt, visible: P.visible, interact: P.interact, update: P.update, openLift: P.openLift, resume: P.resume, battleTheme: P.battleTheme };
  const expand = path => {
    const out = [path[0].slice()];
    for (let i = 1; i < path.length; i++) {
      let [x, y] = path[i - 1];
      const [tx, ty] = path[i];
      while (x !== tx || y !== ty) { x += Math.sign(tx - x); y += Math.sign(ty - y); out.push([x, y]); }
    }
    return out;
  };
  const laneCells = l => { const [dx, dy] = DIRS[l.dir]; return Array.from({ length: l.n }, (_, i) => [l.from[0] + dx * i, l.from[1] + dy * i]); };

  Object.assign(P, {
    lfState() { return this.state.lf || (this.state.lf = { cargo: {}, px: {} }); },

    loadMap(id, atMark, opts) {
      base.loadMap.call(this, id, atMark, opts);
      for (const name of Object.keys(this.map.def.lanes || {})) {
        const [x, y] = this.laneBox(name)[0];
        this.map.ents.push({ kind: 'cargo', lane: name, x, y, ax: x, ay: y });
      }
    },

    laneAt(name) {
      const at = this.lfState().cargo[this.map.id + ':' + name];
      return at == null ? this.map.def.lanes[name].at : at;
    },

    laneBox(name, at) {
      const l = this.map.def.lanes[name], from = at == null ? this.laneAt(name) : at, cells = laneCells(l).slice(from, from + l.box), wide = l.wide || 1, [dx, dy] = DIRS[l.dir];
      if (wide < 2) return cells;
      const out = [];
      for (const [x, y] of cells) for (let i = 0; i < wide; i++) out.push([x + Math.abs(dy) * i, y + Math.abs(dx) * i]);
      return out;
    },

    cargoCover() {
      const out = {};
      for (const name of Object.keys(this.map.def.lanes || {})) for (const [x, y] of this.laneBox(name)) out[x + ',' + y] = name;
      return out;
    },

    trenchAt(x, y) {
      const t = H.TILES[this.map.tiles[y][x]];
      return !!t && t.kind === 'chasm';
    },

    moveCargo(name, d) {
      const l = this.map.def.lanes[name], at = this.laneAt(name), next = at + d;
      if (next < l.min || next > l.max) return 'limit';
      const cover = this.cargoCover(), now = this.laneBox(name), p = this.player;
      if (now.some(([x, y]) => x === p.x && y === p.y)) return 'player';
      for (const [x, y] of this.laneBox(name, next)) {
        const who = cover[x + ',' + y];
        if (who && who !== name) return 'cargo';
        if (x === p.x && y === p.y) return 'player';
        if (this.map.ents.some(e => e.kind === 'enemy' && this.visible(e) && e.x === x && e.y === y)) return 'foe';
      }
      this.lfState().cargo[this.map.id + ':' + name] = next;
      const box = this.map.ents.find(e => e.kind === 'cargo' && e.lane === name), [bx, by] = this.laneBox(name)[0];
      if (box) { box.x = bx; box.y = by; }
      this.emit({ t: 'sfx', id: 'lever' });
      return true;
    },

    blocked(x, y, forSpawn) {
      const m = this.map;
      if (m && m.def.lanes && x >= 0 && y >= 0 && x < m.w && y < m.h && this.cargoCover()[x + ',' + y]) return !this.trenchAt(x, y);
      return base.blocked.call(this, x, y, forSpawn);
    },

    solidEnt(e) {
      if (e.kind === 'pyxis') return true;
      return SOLID.has(e.kind) || base.solidEnt.call(this, e);
    },

    visible(e) {
      if (e.kind === 'enemy' && this.state.flags.lf_dh3_on) return false;
      if (e.kind === 'enemy' && this.map.def.enemyIf && !this.cond(this.map.def.enemyIf)) return false;
      if (e.kind === 'pyxis' && e.def.role === 'c') return !this.state.flags['lf_px_' + e.def.board];
      if (e.kind === 'foeactor' || e.kind === 'lfdog') return this.cond(e.def.if);
      return base.visible.call(this, e);
    },

    interact(opts = {}) {
      if (!this.busy() && !this.player.moving) {
        const [fx, fy] = this.front(), e = this.entAt(fx, fy, x => SOLID.has(x.kind));
        if (e && e.kind === 'dispatch') { this.pending = { type: 'ui', ui: 'lfdispatch', lane: e.def.lane }; return true; }
        if (e && e.kind === 'screen') return this.useScreen(e);
        if (e && e.kind === 'pyxis') return this.usePyxis(e);
        if (e && e.kind === 'sconce') return this.useSconce(e);
        const mate = this.entAt(fx, fy, x => x.kind === 'lfmate');
        if (mate) { mate.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[this.player.dir]; this.runScript(mate.def.script); return true; }
      }
      return base.interact.call(this, opts);
    },

    update(dt, input) {
      base.update.call(this, dt, input);
      if (!this.map || this.battle || this.pending || this.script) return;
      if (this.map.def.mate) this.lfMateStep(dt);
      if (this.state.lf && this.state.lf.lead) this.lfLeadStep(dt);
      if (this.pyxisThen && this.state.time >= this.pyxisThen.at) { const then = this.pyxisThen.script; this.pyxisThen = null; this.runScript(then); }
    },

    resume(val) {
      const p = this.pending;
      if (p && p.type === 'ui' && (p.ui === 'abacus' || p.ui === 'mutare')) {
        if (val) this.state.flags['lf_pz_' + p.id] = true;
        else if (this.script) this.script.pc = p.fail && this.script.labels[p.fail] !== undefined ? this.script.labels[p.fail] : this.script.steps.length;
      }
      return base.resume.call(this, val);
    },

    mapMusic(def) {
      return def.giftWalk && this.state.flags.lf_gifts_on && !this.state.flags.lf_ceremony ? 'serene' : base.mapMusic.call(this, def);
    },

    battleTheme() {
      return (this.map && this.map.def.battleMusic) || base.battleTheme.call(this);
    },

    openLift(e) {
      if (!e.def.skiff) return base.openLift.call(this, e);
      const here = this.map.id, steps = [], opts = [];
      e.def.lift.filter(l => l[0] !== here).forEach(([map, at, need, lockText], i) => {
        const open = !need || this.cond(need), name = H.MAPS[map].name.split(': ').pop();
        opts.push([open ? name : name + ' (закрыто)', 'l' + i]);
        steps.push('#l' + i);
        if (open) steps.push({ cine: 'c_lf_skiff' }, { lift: [map, at] }, { end: true });
        else steps.push('|' + (lockText || 'Этот маршрут закрыт.'), { end: true });
      });
      opts.push(['Остаться здесь', 'stay']);
      steps.unshift({ choice: opts, title: 'Звёздный ялик' });
      steps.push('#stay', { end: true });
      const labels = {};
      steps.forEach((st, i) => { if (typeof st === 'string' && st[0] === '#') labels[st.slice(1)] = i; });
      this.lastExitTile = e.x + ',' + e.y;
      this.script = { name: 'skiff', steps, pc: 0, labels };
      this.skipping = false;
      this.advanceScript();
    },

    lfLeadStart(arg) {
      this.lfState().lead = Object.assign({ map: this.map.id }, arg);
      return [];
    },

    lfLeadStep(dt) {
      const L = this.state.lf.lead, m = this.map, p = this.player, at = m.ents.findIndex(e => e.kind === 'lflead');
      if (L.map !== m.id) { if (at >= 0) m.ents.splice(at, 1); return; }
      let a = m.ents[at];
      if (!a) {
        const cells = expand(L.path), [x, y] = cells[0];
        a = { kind: 'lflead', def: { who: L.who }, dir: 'down', cells, i: 0, x, y, fx: x, fy: y, ox: x, oy: y, prog: 1 };
        m.ents.push(a);
      }
      const d = Math.abs(a.x - p.x) + Math.abs(a.y - p.y);
      if (a.prog < 1) {
        a.prog = Math.min(1, a.prog + dt * FIELD.leadSpeed);
        a.fx = a.ox + (a.x - a.ox) * a.prog; a.fy = a.oy + (a.y - a.oy) * a.prog;
        return;
      }
      if (a.i < a.cells.length - 1) {
        if (d > FIELD.leadTether) return;
        const [nx, ny] = a.cells[++a.i], dx = nx - a.x, dy = ny - a.y;
        a.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        Object.assign(a, { ox: a.x, oy: a.y, x: nx, y: ny, prog: 0 });
        return;
      }
      if (d <= FIELD.leadNear) {
        delete this.state.lf.lead;
        m.ents.splice(m.ents.indexOf(a), 1);
        this.runScript(L.then);
      }
    },

    lfMateStep(dt) {
      const m = this.map, p = this.player;
      [].concat(m.def.mate).forEach((def, idx) => {
        const at = m.ents.findIndex(e => e.kind === 'lfmate' && e.def === def);
        if (!this.cond(def.if)) { if (at >= 0) m.ents.splice(at, 1); return; }
        let a = m.ents[at];
        const far = a && Math.abs(a.x - p.x) + Math.abs(a.y - p.y) > FIELD.mateLost;
        if (!a || far) {
          const [x, y] = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x0, y0]) => !this.blocked(x0, y0, true) && !m.ents.some(e => e.kind === 'lfmate' && e !== a && e.x === x0 && e.y === y0)) || [p.x, p.y];
          if (!a) { a = { kind: 'lfmate', def, dir: p.dir }; m.ents.push(a); }
          Object.assign(a, { x, y, fx: x, fy: y, ox: x, oy: y, prog: 1, trail: [], px: p.x, py: p.y });
        }
        if (a.px !== p.x || a.py !== p.y) { a.trail.push([a.px, a.py]); a.px = p.x; a.py = p.y; }
        if (a.prog < 1) {
          a.prog = Math.min(1, a.prog + dt * FIELD.mateSpeed * (1 + a.trail.length * FIELD.mateRush));
          a.fx = a.ox + (a.x - a.ox) * a.prog; a.fy = a.oy + (a.y - a.oy) * a.prog;
          return;
        }
        if (a.trail.length < 2 + idx) return;
        const [nx, ny] = a.trail.shift(), dx = nx - a.x, dy = ny - a.y;
        if (!dx && !dy) return;
        a.dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        Object.assign(a, { ox: a.x, oy: a.y, x: nx, y: ny, prog: 0 });
      });
    },

    sconceLit(e) {
      return !!this.state.flags['lf_seal_' + e.def.seal] || e.def.n <= ((this.lfState().sconce || {})[e.def.seal] || 0);
    },

    useSconce(e) {
      const st = this.lfState(), lit = st.sconce || (st.sconce = {}), id = e.def.seal, flag = 'lf_seal_' + id;
      if (this.state.flags[flag]) { this.toast('Эта печать уже снята.'); return true; }
      if (e.def.n !== (lit[id] || 0) + 1) {
        lit[id] = 0;
        this.emit({ t: 'sfx', id: 'deny' });
        this.toast('Огни гаснут.');
        this.runScript(e.def.fail);
        return true;
      }
      lit[id] = e.def.n;
      this.emit({ t: 'sfx', id: 'lever' });
      if (e.def.n === SCONCES_IN_SEAL) {
        this.emit({ t: 'sfx', id: 'warp' });
        this.toast('Печать снята');
        this.runScript(e.def.then);
      }
      return true;
    },

    screenOn(e) { return !e.def.if || this.cond(e.def.if); },

    screenPair(e) { const at = this.map.marks[e.def.to]; return at ? this.map.ents.find(o => o.kind === 'screen' && o.x === at[0][0] && o.y === at[0][1]) : null; },

    useScreen(e) {
      if (!this.screenOn(e)) { this.toast(e.def.lockText || 'Ширма телепортации не работает.'); this.emit({ t: 'sfx', id: 'deny' }); return true; }
      const to = this.screenPair(e);
      if (!to) return false;
      const [dx, dy] = DIRS[to.def.out || 'down'], [x, y] = this.freeNear(to.x + dx, to.y + dy);
      this.placePlayer(x, y);
      this.player.dir = to.def.out || 'down';
      this.emit({ t: 'sfx', id: 'warp' });
      return true;
    },

    pyxisDir(e) {
      const v = this.lfState().px[this.map.id + ':' + e.x + ',' + e.y];
      return v || e.def.dir;
    },

    usePyxis(e) {
      if (e.def.role === 'r') {
        const now = this.pyxisDir(e), next = TURN[(TURN.indexOf(now) + 1) % 4];
        this.lfState().px[this.map.id + ':' + e.x + ',' + e.y] = next;
        this.emit({ t: 'sfx', id: 'select' });
        return true;
      }
      if (e.def.role === 't') return this.pyxisFire(e);
      return true;
    },

    pyxisTrace(start) {
      const m = this.map, board = start.def.board, at = (x, y) => m.ents.filter(o => o.x === x && o.y === y && (o.kind === 'pyxis' || o.kind === 'screen'));
      const segs = [], hits = new Set(), seen = new Set(), cover = this.cargoCover();
      let x = start.x, y = start.y, dir = this.pyxisDir(start), sx = x, sy = y;
      const cut = () => { if (sx !== x || sy !== y) segs.push([sx, sy, x, y]); sx = x; sy = y; };
      for (let guard = 0; guard < 400; guard++) {
        const key = x + ',' + y + ',' + dir;
        if (seen.has(key)) break;
        seen.add(key);
        const [dx, dy] = DIRS[dir];
        x += dx; y += dy;
        if (x < 0 || y < 0 || x >= m.w || y >= m.h) { x -= dx; y -= dy; break; }
        const t = H.TILES[m.tiles[y][x]], here = at(x, y);
        const rec = here.find(o => o.kind === 'pyxis' && (o.def.role === 'r' || o.def.role === 'f') && o.def.board === board);
        if (rec) { cut(); dir = this.pyxisDir(rec); continue; }
        const coil = here.find(o => o.kind === 'pyxis' && o.def.role === 'c' && o.def.board === board);
        if (coil) { if (this.visible(coil)) hits.add(coil); continue; }
        const scr = here.find(o => o.kind === 'screen');
        if (scr) {
          const to = this.screenPair(scr);
          if (!to) { cut(); break; }
          cut();
          x = to.x; y = to.y; sx = x; sy = y;
          continue;
        }
        if (cover[x + ',' + y] && !this.trenchAt(x, y)) { cut(); return { segs, hits }; }
        if (t && t.solid && t.kind !== 'chasm') { x -= dx; y -= dy; break; }
      }
      cut();
      return { segs, hits };
    },

    pyxisCoils(board) { return this.map.ents.filter(o => o.kind === 'pyxis' && o.def.role === 'c' && o.def.board === board); },

    pyxisFire(e) {
      const board = e.def.board, flag = 'lf_px_' + board;
      if (this.state.flags[flag]) { this.toast('Узлы Древа амброзии уже уничтожены.'); return true; }
      const { segs, hits } = this.pyxisTrace(e), coils = this.pyxisCoils(board), ok = coils.length > 0 && coils.every(c => hits.has(c));
      this.beam = { segs, until: this.state.time + FIELD.beam, ok, hit: [...hits].map(c => [c.x, c.y]) };
      this.emit({ t: 'sfx', id: ok ? 'break' : 'deny' });
      if (ok) { this.state.flags[flag] = true; this.toast('Узлы Древа амброзии уничтожились одновременно'); if (e.def.then) this.pyxisThen = { script: e.def.then, at: this.state.time + FIELD.beam }; }
      else this.toast('Узлы Древа амброзии не уничтожились одновременно');
      return true;
    },

    lfFogLevel() {
      const f = this.map && this.map.def.fog;
      return f ? f.levels[f.flags.filter(k => this.state.flags[k]).length] : 0;
    },

    trailNow() {
      const t = this.map.def.trails || [];
      return t.find(x => !x.if || this.cond(x.if)) || null;
    },

    ditingScan() {
      const tr = this.trailNow();
      if (!tr) { this.toast('Дитин здесь ничего не чует.'); this.emit({ t: 'sfx', id: 'deny' }); return false; }
      this.scent = { map: this.map.id, until: this.state.time + FIELD.scan };
      this.emit({ t: 'sfx', id: 'select' });
      return true;
    },

    ditingCells() {
      const sc = this.scent, tr = this.trailNow();
      if (!sc || !tr || sc.map !== this.map.id || this.state.time >= sc.until) return null;
      const cells = expand(tr.path), p = this.player;
      let best = 0, bd = Infinity;
      cells.forEach(([x, y], i) => { const d = Math.abs(x - p.x) + Math.abs(y - p.y); if (d <= bd) { bd = d; best = i; } });
      return { cells: bd > FIELD.ahead ? [] : cells.slice(best, best + FIELD.ahead), col: tr.col || '#ff9ac8', left: sc.until - this.state.time };
    }
  });

  H.LF_FIELD = { FIELD, DIRS, TURN, laneCells, expand, ABACUS, MUTARE, abacusRing, abacusCells, abacusTurn, abacusDone, mutareTurn, mutareDone };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
