(function (K) {
  'use strict';
  const ROUND = 2.6;
  const TALK_RANGE = 2.9;
  const USE_RANGE = 1.9;
  K.ROUND = ROUND;

  const IMMEDIATE = new Set(['set', 'unset', 'var', 'q', 'xp', 'cr', 'give', 'take', 'ls', 'ds', 'join', 'heal', 'now']);

  class Game {
    constructor(opts) {
      opts = opts || {};
      this.seed = opts.seed || ((Math.random() * 1e9) | 0);
      this.rng = new K.RNG(this.seed);
      this.events = [];
      this.mode = 'title';
      this.paused = false;
      this.autoLeader = !!opts.autoLeader;
      this.autoLevel = !!opts.autoLevel;
      this.headless = !!opts.headless;
      this.settings = Object.assign({ autoPause: true, autoFight: true, difficulty: 1 }, opts.settings || {});
      this.resetState();
    }

    resetState() {
      K.resetUids(1);
      this.flags = {};
      this.vars = {};
      this.quests = {};
      this.journal = [];
      this.xp = 0;
      this.credits = 0;
      this.inv = [];
      this.roster = {};
      this.active = ['player'];
      this.leaderId = 'player';
      this.areaStates = {};
      this.shopStock = {};
      this.align = 50;
      this.time = 0;
      this.creatures = [];
      this.objects = [];
      this.doors = [];
      this.strikes = [];
      this.area = null;
      this.dialog = null;
      this.shop = null;
      this.loot = null;
      this.pazaak = null;
      this.swoop = null;
      this.duel = null;
      this.combat = false;
      this.log = [];
      this.stats = { kills: 0, deaths: 0, crits: 0 };
    }

    emit(type, data) { this.events.push(Object.assign({ type }, data || {})); }
    drain() { const e = this.events; this.events = []; return e; }
    addLog(text, col) {
      this.log.push({ text, col: col || '#c8e0ff', t: this.time });
      if (this.log.length > 200) this.log.shift();
      this.emit('log', { text, col });
    }

    newGame(spec) {
      this.resetState();
      spec = spec || {};
      const cls = spec.cls || 'soldier';
      const fem = !!spec.fem;
      const attrs = spec.attrs || K.defaultAttrs(cls);
      K.TEMPLATES.player = {
        id: 'player', n: spec.name || 'Рейвен', cls, lvl: 1, attrs: Object.assign({}, attrs),
        equip: { r: cls === 'soldier' ? 'long_sword' : 'blaster_pistol', body: 'clothes' },
        m: fem ? 'player_f' : 'player_m', feats: spec.feats || K.defaultFeats(cls), skills: spec.skills || K.defaultSkills(cls, attrs), ai: cls === 'soldier' ? 'melee' : 'ranged', party: true,
        grow: cls === 'soldier' ? ['power_attack', 'flurry', 'toughness', 'critical_strike', 'dueling', 'conditioning'] : cls === 'scout' ? ['rapid_shot', 'power_blast', 'toughness', 'sniper_shot', 'conditioning'] : ['rapid_shot', 'sniper_shot', 'dueling', 'toughness', 'power_blast']
      };
      const p = K.makeCreature('player', { faction: 'party', model: Object.assign({}, K.MODELS[fem ? 'player_f' : 'player_m'], spec.look || {}) });
      p.pid = 'player';
      p.fem = fem;
      p.portrait = spec.portrait || 0;
      this.roster.player = p;
      this.credits = 250;
      this.xp = 500;
      K.applyLevelUp(p, spec.levelChoice || K.autoLevelChoice(p));
      this.addItem('medpac', 3);
      this.addItem('frag', 1);
      this.addItem(cls === 'soldier' ? 'blaster_pistol' : 'short_sword', 1);
      this.addItem('card_p1', 1); this.addItem('card_p3', 1); this.addItem('card_m1', 1); this.addItem('card_m3', 1); this.addItem('card_p4', 1);
      this.addItem('card_m4', 1); this.addItem('card_p2', 1); this.addItem('card_m2', 1); this.addItem('card_f1', 1); this.addItem('card_p5', 1);
      this.setQuest('main', 10, true);
      this.mode = 'play';
      this.loadArea('upper_apts', '@');
      this.emit('mode', { mode: 'play' });
    }

    get leader() { return this.roster[this.leaderId]; }
    get player() { return this.roster.player; }
    partyCreatures() { return this.active.map(id => this.roster[id]).filter(Boolean); }
    livingParty() { return this.partyCreatures().filter(c => !c.dead); }
    partyLevel() { const p = this.partyCreatures(); return p.reduce((s, c) => s + c.level, 0) / Math.max(1, p.length); }

    areaState(id) {
      if (!this.areaStates[id]) this.areaStates[id] = { dead: {}, looted: {}, doors: {}, trig: {}, mines: {}, corpses: [], seen: {} };
      const s = this.areaStates[id];
      if (!s.seen) s.seen = {};
      return s;
    }

    tileAt(x, z) {
      const a = this.area;
      if (!a || x < 0 || z < 0 || x >= a.w || z >= a.h) return '#';
      return a.tiles[z * a.w + x];
    }
    inside(x, z) { return this.area && x >= 0 && z >= 0 && x < this.area.w && z < this.area.h; }
    doorAt(x, z) { return this.area ? this.area.doorIdx.get(z * this.area.w + x) : null; }
    baseWalk(x, z) { return this.inside(x, z) && this.area.walk[z * this.area.w + x] === 1; }
    pathWalk(x, z) {
      if (!this.baseWalk(x, z)) return false;
      const d = this.doorAt(x, z);
      if (d && !d.open && d.locked && !(d.keyItem && this.countItem(d.keyItem))) return false;
      return true;
    }
    solid(x, z) {
      if (!this.baseWalk(x, z)) return true;
      const d = this.doorAt(x, z);
      return !!(d && !d.open);
    }
    opaque(x, z) {
      if (!this.inside(x, z)) return true;
      if (this.area.opaque[z * this.area.w + x]) return true;
      const d = this.doorAt(x, z);
      return !!(d && !d.open);
    }
    los(ax, az, bx, bz) { return K.lineClear((x, z) => !this.opaque(x, z), ax, az, bx, bz, 0.25); }

    findMark(ch, areaDef) {
      const a = areaDef || (this.area && this.area.def);
      for (let z = 0; z < a.rows.length; z++) {
        const x = a.rows[z].indexOf(ch);
        if (x >= 0) return [x, z];
      }
      return null;
    }

    evalReq(list) { return !list || list.every(c => this.cond(c)); }

    loadArea(id, markCh, keepPos) {
      const def = K.AREAS[id];
      if (!def) throw new Error('area ' + id);
      const st = this.areaState(id);
      const w = Math.max(...def.rows.map(r => r.length)), h = def.rows.length;
      const a = { id, def, w, h, tiles: [], walk: new Uint8Array(w * h), opaque: new Uint8Array(w * h), doorIdx: new Map(), marks: [], spots: {}, explored: new Uint8Array(w * h), theme: K.THEMES[def.theme] };
      this.area = a;
      this.creatures = [];
      this.objects = [];
      this.doors = [];
      this.strikes = [];
      this.combat = false;
      for (let z = 0; z < h; z++) {
        for (let x = 0; x < w; x++) {
          let ch = def.rows[z][x] || ' ';
          const mk = def.marks && def.marks[ch];
          let tileCh = ch;
          if (mk) {
            a.marks.push({ ch, x, z, def: mk });
            if (!a.spots[ch]) a.spots[ch] = [x, z];
            tileCh = mk.t === 'door' ? '+' : (mk.t === 'exit' || mk.t === 'box' || mk.t === 'use') ? '#' : '.';
            if (mk.t === 'exit' || mk.t === 'box' || mk.t === 'use') tileCh = 'o';
          }
          const t = K.TILES[tileCh];
          const i = z * w + x;
          a.tiles.push(mk ? (mk.t === 'door' ? '+' : mk.t === 'exit' ? 'x' : mk.t === 'box' ? 'b' : mk.t === 'use' ? 'u' : this.floorUnder(def, x, z)) : ch);
          if (t) { a.walk[i] = t.walk ? 1 : 0; a.opaque[i] = t.opaque ? 1 : 0; }
          else { a.walk[i] = 0; a.opaque[i] = 0; }
          if (ch === '+') this.addDoor(x, z, {}, st);
        }
      }
      if (def.ship) {
        const s = def.ship;
        for (let z = s.z - 4; z <= s.z + 5; z++) for (let x = s.x - 7; x <= s.x + 7; x++) if (this.inside(x, z)) a.walk[z * w + x] = 0;
      }
      for (const m of a.marks) this.spawnMark(m, st);
      for (const c of st.corpses) this.objects.push(Object.assign({ type: 'corpse' }, c));
      if (def.bench) this.spawnBench(def.bench);
      this.placeParty(markCh, keepPos);
      if (def.forceParty) for (const pid of def.forceParty) if (this.roster[pid] && this.active.indexOf(pid) < 0) this.forceActive(pid);
      this.revealAround();
      this.emit('area', { id });
      this.addLog('— ' + def.n + ' —', '#ffe080');
      if (def.onEnter && K.SCRIPTS[def.onEnter]) K.SCRIPTS[def.onEnter](this, {});
    }

    floorUnder(def, x, z) {
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dz] of nb) {
        const r = def.rows[z + dz];
        const c = r && r[x + dx];
        if (c && K.TILES[c] && K.TILES[c].kind === 'floor') return c;
      }
      return '.';
    }

    addDoor(x, z, mk, st) {
      const key = x + ',' + z;
      const d = { x, z, key, open: false, lock: mk.lock || 0, keyItem: mk.key || null, req: mk.req || null, msg: mk.msg || null, n: mk.n || 'Дверь', alarm: !!mk.alarm, anim: 0 };
      d.locked = !!(d.lock || d.keyItem || d.req);
      const s = st.doors[key];
      if (s === 'open') { d.open = true; d.locked = false; d.anim = 1; }
      else if (s === 'unlocked') d.locked = false;
      this.doors.push(d);
      this.area.doorIdx.set(z * this.area.w + x, d);
      this.area.walk[z * this.area.w + x] = 1;
      return d;
    }

    spawnMark(m, st) {
      const d = m.def;
      const key = m.ch + '@' + m.x + ',' + m.z;
      if (d.req && !this.evalReq(d.req)) { if (d.t === 'exit' || d.t === 'box' || d.t === 'use') this.pushObject(m, d, key, st); return; }
      if (d.unless && d.unless.some(c => this.cond(c))) { if (d.t === 'use' || d.t === 'box') this.markFloor(m); return; }
      if (d.t === 'npc' || d.t === 'foe') {
        if (st.dead[key]) return;
        const c = d.t === 'npc' ? this.makeNpc(d.id) : K.makeCreature(d.tpl, { faction: d.faction || 'hostile', level: d.lvl });
        if (!c) return;
        c.spawnKey = key;
        c.x = m.x + 0.5; c.z = m.z + 0.5;
        c.home = [c.x, c.z];
        c.group = d.g || c.group || ('m_' + m.ch);
        if (d.leash) c.leash = d.leash;
        c.ang = d.face != null ? d.face : (c.faceAng != null ? c.faceAng : Math.PI);
        this.creatures.push(c);
        return;
      }
      if (d.t === 'door') { this.addDoor(m.x, m.z, d, st); return; }
      if (d.t === 'spot') return;
      this.pushObject(m, d, key, st);
    }

    clearTiles(ch) {
      const a = this.area;
      for (let z = 0; z < a.h; z++) for (let x = 0; x < a.w; x++) {
        const i = z * a.w + x;
        if (a.tiles[i] === ch) { a.tiles[i] = this.floorUnder(a.def, x, z) === ch ? '.' : this.floorUnder(a.def, x, z); a.walk[i] = 1; a.opaque[i] = 0; }
      }
      this.emit('tiles', {});
    }

    markFloor(m) {
      const i = m.z * this.area.w + m.x;
      this.area.walk[i] = 1;
      this.area.tiles[i] = this.floorUnder(this.area.def, m.x, m.z);
    }

    pushObject(m, d, key, st) {
      const o = { type: d.t, key, x: m.x + 0.5, z: m.z + 0.5, tx: m.x, tz: m.z, def: d, n: d.n || '' };
      if (d.t === 'box') {
        o.looted = !!st.looted[key];
        o.lock = d.lock || 0;
        o.locked = !!d.lock && !st.doors[key];
        o.model = d.model || 'locker';
        o.items = o.looted ? [] : (d.loot || []).map(l => ({ id: l[0], n: l[1] }));
        o.cr = o.looted ? 0 : (d.cr || 0);
        if (!o.n) o.n = 'Контейнер';
      }
      if (d.t === 'exit') o.n = d.n || 'Выход';
      if (d.t === 'mine') {
        if (st.mines[key]) return;
        o.armed = true; o.found = false;
      }
      if (d.t === 'trig') { if (st.trig[key]) return; }
      this.objects.push(o);
    }

    spawnBench(ch) {
      const p = this.findMark(ch);
      if (!p) return;
      let i = 0;
      for (const [pid, c] of Object.entries(this.roster)) {
        if (pid === 'player' || this.active.indexOf(pid) >= 0) continue;
        const b = K.makeCreature(c.tpl, { faction: 'neutral' });
        b.name = c.name; b.model = Object.assign({}, c.model); b.equip = Object.assign({}, c.equip);
        b.benchOf = pid; b.static = true;
        const spot = K.nearestWalkable(this.area.w, this.area.h, (x, z) => this.baseWalk(x, z) && !this.creatures.some(o => Math.floor(o.x) === x && Math.floor(o.z) === z), p[0] + (i % 3) - 1, p[1] + Math.floor(i / 3), 3);
        if (spot) { b.x = spot[0] + 0.5; b.z = spot[1] + 0.5; }
        b.ang = Math.PI * 0.5;
        this.creatures.push(b);
        i++;
      }
    }

    makeNpc(id) {
      const n = K.NPCS[id];
      if (!n) throw new Error('npc ' + id);
      const c = K.makeCreature(n.tpl || 'npc_human', { faction: n.faction || 'neutral', name: n.n, level: n.lvl, model: n.m ? Object.assign({}, K.MODELS[n.m]) : null });
      if (n.m) c.model = Object.assign({}, K.MODELS[n.m], n.look || {});
      c.npcId = id;
      c.dlg = n.dlg || null;
      c.bark = n.bark || null;
      c.wander = n.wander || 0;
      c.sight = n.sight || 0;
      c.group = n.g || null;
      c.faceAng = n.face != null ? n.face : null;
      c.immortal = !!n.immortal;
      c.caged = !!n.caged;
      c.static = !!n.static;
      if (n.hp) { c.hpBonus += n.hp; K.recalc(c); c.hp = c.maxHp; }
      return c;
    }

    placeParty(markCh, keepPos) {
      const party = this.partyCreatures();
      let start;
      if (keepPos) start = keepPos;
      else {
        const pos = markCh ? this.findMark(markCh) : null;
        start = pos || this.findMark('@') || [Math.floor(this.area.w / 2), Math.floor(this.area.h / 2)];
      }
      const taken = [];
      party.forEach((c, i) => {
        let p = null;
        if (keepPos && keepPos.members && keepPos.members[c.pid]) p = keepPos.members[c.pid];
        if (!p) {
          const base = K.nearestWalkable(this.area.w, this.area.h, (x, z) => this.baseWalk(x, z) && !this.doorAt(x, z) && !taken.some(t => t[0] === x && t[1] === z) && !this.creatures.some(o => Math.floor(o.x) === x && Math.floor(o.z) === z), start[0], start[1], 6);
          if (base) { p = [base[0] + 0.5, base[1] + 0.5]; taken.push(base); }
          else p = [start[0] + 0.5, start[1] + 0.5];
        }
        c.x = p[0]; c.z = p[1];
        c.path = null; c.target = null; c.queue = []; c.roundT = 0; c.aggro = false;
        c.faction = 'party';
        if (this.creatures.indexOf(c) < 0) this.creatures.push(c);
      });
      if (!this.roster[this.leaderId] || this.active.indexOf(this.leaderId) < 0 || this.roster[this.leaderId].dead) this.leaderId = 'player';
    }

    revealAround() {
      const a = this.area, L = this.leader;
      if (!a || !L) return;
      const r = 9;
      const cx = Math.floor(L.x), cz = Math.floor(L.z);
      for (let z = cz - r; z <= cz + r; z++) for (let x = cx - r; x <= cx + r; x++) {
        if (!this.inside(x, z)) continue;
        if ((x - cx) * (x - cx) + (z - cz) * (z - cz) <= r * r) a.explored[z * a.w + x] = 1;
      }
    }

    cond(c) {
      if (c[0] === '!') return !this.cond(c.slice(1));
      let m;
      if ((m = c.match(/^q:([a-z0-9_]+)(>=|<=|=|<|>)(\d+)$/))) return cmp(this.quests[m[1]] || 0, m[2], +m[3]);
      if ((m = c.match(/^var:([a-z0-9_]+)(>=|<=|=|<|>)(-?\d+)$/))) return cmp(this.vars[m[1]] || 0, m[2], +m[3]);
      if ((m = c.match(/^party:([a-z0-9_]+)$/))) return this.active.indexOf(m[1]) >= 0 && this.roster[m[1]] && !this.roster[m[1]].dead;
      if ((m = c.match(/^joined:([a-z0-9_]+)$/))) return !!this.roster[m[1]];
      if ((m = c.match(/^has:([a-z0-9_]+)(?::(\d+))?$/))) return this.countItem(m[1]) >= (+m[2] || 1);
      if ((m = c.match(/^cr>=(\d+)$/))) return this.credits >= +m[1];
      if ((m = c.match(/^cls:([a-z]+)$/))) return this.player.cls === m[1];
      if ((m = c.match(/^lvl>=(\d+)$/))) return this.player.level >= +m[1];
      if (c === 'fem') return !!this.player.fem;
      if ((m = c.match(/^skill:([a-z]{3}):(\d+)$/))) return this.bestSkill(m[1]) + 10 >= +m[2];
      if ((m = c.match(/^align(>=|<=)(\d+)$/))) return cmp(this.align, m[1], +m[2]);
      if (c === 'droid') return false;
      return !!this.flags[c];
    }

    bestSkill(k, who) {
      if (k === 'per') return K.skill(this.player, 'per');
      let best = -99;
      for (const c of (who ? [who] : this.livingParty())) best = Math.max(best, K.skill(c, k));
      return best;
    }

    act(a, ctx) {
      const p = a.split(':');
      const k = p[0];
      let m;
      switch (k) {
        case 'set': this.flags[p[1]] = true; break;
        case 'unset': delete this.flags[p[1]]; break;
        case 'var':
          m = a.match(/^var:([a-z0-9_]+)(\+=|-=|=)(-?\d+)$/);
          if (m[2] === '=') this.vars[m[1]] = +m[3];
          else this.vars[m[1]] = (this.vars[m[1]] || 0) + (m[2] === '+=' ? +m[3] : -m[3]);
          break;
        case 'q': m = a.match(/^q:([a-z0-9_]+)=(\d+)$/); this.setQuest(m[1], +m[2]); break;
        case 'xp': this.gainXp(+p[1]); break;
        case 'cr': this.addCredits(+p[1]); break;
        case 'give': this.addItem(p[1], +p[2] || 1, true); break;
        case 'take': this.removeItem(p[1], +p[2] || 1, true); break;
        case 'ls': this.shiftAlign(+p[1]); break;
        case 'ds': this.shiftAlign(-p[1]); break;
        case 'join': this.recruit(p[1], { owner: ctx && ctx.owner }); break;
        case 'heal': for (const c of this.partyCreatures()) { c.hp = c.maxHp; c.fp = c.maxFp; c.dead = false; } break;
        case 'fight': this.setGroupHostile(p[1]); break;
        case 'shop': this.openShop(p[1]); break;
        case 'pazaak': this.startPazaak(p[1]); break;
        case 'swoop': this.startSwoop(); break;
        case 'goto': this.travel(p[1], p[2]); break;
        case 'run': case 'now': if (K.SCRIPTS[p[1]]) K.SCRIPTS[p[1]](this, ctx || {}); else throw new Error('script ' + p[1]); break;
        case 'leave': if (ctx && ctx.owner && ctx.owner.uid) this.removeCreature(ctx.owner, true); break;
        case 'duel': this.startDuel(p[1]); break;
        case 'party': this.emit('ui', { open: 'party' }); break;
        case 'rest': this.rest(true); break;
        case 'end': break;
        default: throw new Error('action ' + a);
      }
    }

    shiftAlign(n) {
      this.align = K.clamp(this.align + n, 0, 100);
      this.addLog(n > 0 ? 'Светлая сторона +' + n : 'Тёмная сторона +' + (-n), n > 0 ? '#80c0ff' : '#ff6060');
      this.emit('align', { n });
    }

    setQuest(id, stage, silent) {
      const q = K.QUESTS[id];
      if (!q || !q.s[stage]) throw new Error('quest ' + id + ' ' + stage);
      const cur = this.quests[id] || 0;
      if (stage <= cur && !(Array.isArray(q.end) && q.end.indexOf(stage) >= 0 && stage !== cur)) return;
      this.quests[id] = stage;
      this.journal.push({ q: id, s: stage, t: this.time });
      if (!silent) {
        this.addLog('Журнал обновлён: ' + q.n, '#ffe080');
        this.emit('toast', { text: 'Журнал обновлён: ' + q.n });
        this.emit('sfx', { id: 'journal' });
      }
    }

    questDone(id) {
      const q = K.QUESTS[id], s = this.quests[id] || 0;
      if (!q) return false;
      return Array.isArray(q.end) ? q.end.indexOf(s) >= 0 : s >= q.end;
    }

    gainXp(n) {
      n = Math.round(n * K.XP_MULT);
      if (n <= 0) return;
      this.xp += n;
      this.addLog('Опыт +' + n, '#a0ffa0');
      this.emit('xp', { n });
      const lvl = K.levelForXp(this.xp);
      for (const c of Object.values(this.roster)) {
        if (c.level < lvl) {
          if (this.autoLevel || c.pid !== 'player' && c.autoLevel) { while (c.level < lvl) K.applyLevelUp(c, K.autoLevelChoice(c)); this.emit('levelup', { pid: c.pid }); }
          else if (!c.levelNotified || c.levelNotified < lvl) { c.levelNotified = lvl; this.emit('levelup', { pid: c.pid }); this.addLog(c.name + ' может повысить уровень!', '#ffe080'); }
        }
      }
    }

    pendingLevels(c) { return Math.max(0, K.levelForXp(this.xp) - c.level); }

    addCredits(n) {
      this.credits = Math.max(0, this.credits + n);
      if (n) this.addLog((n > 0 ? 'Получено кредитов: ' : 'Потрачено кредитов: ') + Math.abs(n), '#ffd070');
    }

    countItem(id) { const s = this.inv.find(i => i.id === id); return s ? s.n : 0; }
    addItem(id, n, announce) {
      if (!K.ITEMS[id]) throw new Error('item ' + id);
      n = n || 1;
      const s = this.inv.find(i => i.id === id);
      if (s) s.n += n; else this.inv.push({ id, n, isNew: true });
      if (announce) this.addLog('Получено: ' + K.ITEMS[id].n + (n > 1 ? ' ×' + n : ''), '#c0ffc0');
      if (K.ITEMS[id].k === 'q') this.onQuestItem(id);
    }
    removeItem(id, n, announce) {
      n = n || 1;
      const s = this.inv.find(i => i.id === id);
      if (!s) return false;
      s.n -= n;
      if (s.n <= 0) this.inv.splice(this.inv.indexOf(s), 1);
      if (announce) this.addLog('Отдано: ' + K.ITEMS[id].n, '#c0c0c0');
      return true;
    }

    recruit(id, opts) {
      opts = opts || {};
      if (this.roster[id]) return this.roster[id];
      const lvl = Math.max(1, K.levelForXp(this.xp));
      const c = K.makeCreature(id, { faction: 'party' });
      c.pid = id;
      c.autoLevel = true;
      K.levelTo(c, lvl);
      c.hp = c.maxHp; c.fp = c.maxFp;
      this.roster[id] = c;
      if (!opts.silent) {
        this.addLog(c.name + ' присоединяется к отряду.', '#ffe080');
        this.emit('toast', { text: c.name + ' присоединяется к отряду' });
        this.emit('sfx', { id: 'join' });
      }
      const owner = this.area ? this.creatures.find(o => o.npcId && K.NPCS[o.npcId] && K.NPCS[o.npcId].joins === id) || null : null;
      if (!opts.noActivate && this.area && K.FORCE_JOIN[id] && this.active.length >= 3) {
        const out = this.active.pop();
        const oc = this.roster[out];
        const i = this.creatures.indexOf(oc);
        if (i >= 0) this.creatures.splice(i, 1);
        this.addLog(oc.name + ' возвращается в квартиру в Верхнем городе.', '#c8e0ff');
      }
      if (!opts.noActivate) {
        if (this.active.length < 3) {
          this.active.push(id);
          if (this.area) {
            c.x = owner ? owner.x : this.leader.x + 1; c.z = owner ? owner.z : this.leader.z + 1;
            this.creatures.push(c);
          }
        } else if (!opts.silent) this.addLog(c.name + ' ждёт в квартире в Верхнем городе. Отряд можно сменить в меню «Отряд».', '#c8e0ff');
      }
      if (owner) this.removeCreature(owner, false);
      this.emit('party', {});
      return c;
    }

    forceActive(pid) {
      if (this.active.indexOf(pid) >= 0) return;
      if (this.active.length >= 3) {
        const out = this.active.pop();
        const oc = this.roster[out];
        const i = this.creatures.indexOf(oc);
        if (i >= 0) this.creatures.splice(i, 1);
      }
      this.active.push(pid);
      const c = this.roster[pid];
      c.x = this.leader.x + 0.8; c.z = this.leader.z + 0.8; c.path = null;
      this.creatures.push(c);
      this.addLog(c.name + ' идёт с вами.', '#c8e0ff');
    }

    setActive(ids) {
      if (this.combat) return false;
      const list = ['player'].concat(ids.filter(i => i !== 'player' && this.roster[i])).slice(0, 3);
      const forced = this.area && this.area.def.forceParty || [];
      for (const f of forced) if (this.roster[f] && list.indexOf(f) < 0) { if (list.length >= 3) list.pop(); list.push(f); }
      for (const id of this.active) {
        if (list.indexOf(id) < 0) {
          const c = this.roster[id];
          const i = this.creatures.indexOf(c);
          if (i >= 0) this.creatures.splice(i, 1);
        }
      }
      for (const id of list) {
        if (this.active.indexOf(id) < 0) {
          const c = this.roster[id];
          const p = K.nearestWalkable(this.area.w, this.area.h, (x, z) => this.baseWalk(x, z), this.leader.x + 1, this.leader.z + 1, 4) || [Math.floor(this.leader.x), Math.floor(this.leader.z)];
          c.x = p[0] + 0.5; c.z = p[1] + 0.5; c.path = null; c.target = null; c.queue = [];
          if (c.dead) { c.dead = false; c.hp = Math.max(1, c.hp); }
          this.creatures.push(c);
        }
      }
      this.active = list;
      if (list.indexOf(this.leaderId) < 0) this.leaderId = 'player';
      this.emit('party', {});
      return true;
    }

    setLeader(pid) {
      const c = this.roster[pid];
      if (!c || this.active.indexOf(pid) < 0 || c.dead) return false;
      this.leaderId = pid;
      this.emit('leader', { pid });
      return true;
    }

    cycleLeader() {
      const alive = this.active.filter(id => !this.roster[id].dead);
      if (alive.length < 2) return;
      const i = alive.indexOf(this.leaderId);
      this.setLeader(alive[(i + 1) % alive.length]);
    }

    removeCreature(c, walkAway) {
      const i = this.creatures.indexOf(c);
      if (i >= 0) this.creatures.splice(i, 1);
      if (c.spawnKey && walkAway) this.areaState(this.area.id).dead[c.spawnKey] = 1;
      this.emit('despawn', { uid: c.uid });
    }

    travel(areaId, markCh) {
      if (this.duel && areaId !== 'duel_ring') return;
      this.pendingTravel = { areaId, markCh };
    }

    doTravel() {
      const t = this.pendingTravel;
      this.pendingTravel = null;
      if (this.dialog) this.closeDialog(true);
      for (const c of this.partyCreatures()) { if (c.dead) { c.dead = false; c.hp = 1; } c.effects = c.effects.filter(e => e.id === 'battle_med' || e.id === 'stim'); }
      this.loadArea(t.areaId, t.markCh);
      if (this.mode !== 'play' && this.mode !== 'ending' && this.mode !== 'gameover') this.mode = 'play';
    }

    creatureByUid(uid) { return this.creatures.find(c => c.uid === uid) || null; }
    npc(id) { return this.creatures.find(c => c.npcId === id) || null; }

    setGroupHostile(g) {
      let n = 0;
      for (const c of this.creatures) {
        if (c.group === g && !c.dead && c.faction !== 'party') {
          c.faction = 'hostile';
          c.aggro = true;
          c.dlg = null;
          n++;
        }
      }
      if (n) this.enterCombat();
      return n;
    }

    enterCombat() {
      if (!this.combat) {
        this.combat = true;
        this.emit('combat', { on: true });
      }
    }

    isHostile(a, b) {
      if (a.dead || b.dead) return false;
      if (a.faction === 'party') return b.faction === 'hostile';
      if (a.faction === 'hostile') return b.faction === 'party';
      return false;
    }

    interact(target) {
      const L = this.leader;
      if (!L || L.dead || this.mode !== 'play') return;
      L.queue = [];
      L.target = null;
      L.attacking = false;
      L.interact = target;
      const tx = target.x, tz = target.z;
      this.pathTo(L, tx, tz, true);
    }

    pathTo(c, tx, tz, toObject) {
      const w = this.area.w, h = this.area.h;
      let gx = tx, gz = tz;
      if (toObject || !this.pathWalk(Math.floor(tx), Math.floor(tz))) {
        const best = this.bestApproach(c, tx, tz);
        if (best) { gx = best[0] + 0.5; gz = best[1] + 0.5; }
      }
      const raw = K.findPath(w, h, (x, z) => this.pathWalk(x, z), c.x, c.z, gx, gz, 9000);
      if (!raw) { c.path = null; return false; }
      if (raw.length) raw[raw.length - 1] = [toObject ? raw[raw.length - 1][0] : (this.pathWalk(Math.floor(tx), Math.floor(tz)) ? tx : raw[raw.length - 1][0]), toObject ? raw[raw.length - 1][1] : (this.pathWalk(Math.floor(tx), Math.floor(tz)) ? tz : raw[raw.length - 1][1])];
      c.path = K.smoothPath((x, z) => this.pathWalk(x, z) && !this.solidForPath(x, z), c.x, c.z, raw, c.radius * 0.9);
      c.stuckT = 0;
      return true;
    }

    solidForPath(x, z) { return false; }

    bestApproach(c, tx, tz) {
      const cx = Math.floor(tx), cz = Math.floor(tz);
      let best = null, bd = 1e9;
      for (let r = 1; r <= 3 && !best; r++) {
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const x = cx + dx, z = cz + dz;
          if (!this.pathWalk(x, z)) continue;
          const d = K.dist(x + 0.5, z + 0.5, c.x, c.z) * 0.3 + Math.hypot(dx, dz);
          if (d < bd) { bd = d; best = [x, z]; }
        }
      }
      return best;
    }

    cmdMove(x, z) {
      const L = this.leader;
      if (!L || L.dead || this.mode !== 'play' || K.hasEffect(L, 'stun')) return false;
      L.queue = []; L.target = null; L.attacking = false; L.interact = null;
      const ok = this.pathTo(L, x, z, false);
      if (ok) this.emit('moveMark', { x, z });
      return ok;
    }

    cmdAttack(target, feat) {
      const L = this.leader;
      if (!L || L.dead || !target || target.dead) return;
      if (target.faction !== 'hostile') {
        if (target.faction === 'neutral' && !target.caged && target.dlg) { this.interact(target); return; }
        return;
      }
      L.interact = null;
      if (feat) L.queue.push({ k: 'attack', target: target.uid, feat });
      L.target = target.uid;
      L.attacking = true;
      L.path = null;
      this.enterCombat();
    }

    cmdItem(itemId, user, target) {
      user = user || this.leader;
      const it = K.ITEMS[itemId];
      if (!it || !this.countItem(itemId) || user.dead) return false;
      if (it.use && it.use.grenade) {
        const t = target || this.creatureByUid(user.target);
        if (!t) { this.addLog('Выберите цель для гранаты.', '#ffb0b0'); return false; }
        user.queue.push({ k: 'grenade', item: itemId, target: t.uid });
        if (!user.target) user.target = t.uid;
        return true;
      }
      if (!this.combat) return this.useItemNow(user, itemId, target || user);
      user.queue.push({ k: 'item', item: itemId, target: (target || user).uid });
      return true;
    }

    cmdPower(power, user, target) {
      user = user || this.leader;
      const p = K.POWERS[power];
      if (!p || user.powers.indexOf(power) < 0) return false;
      if (user.fp < p.fp) { this.addLog('Недостаточно очков Силы.', '#ffb0b0'); return false; }
      if (p.target === 'enemy') {
        const t = target || this.creatureByUid(user.target);
        if (!t || t.faction !== 'hostile') { this.addLog('Выберите врага.', '#ffb0b0'); return false; }
        user.queue.push({ k: 'power', power, target: t.uid });
        if (!user.target) user.target = t.uid;
      } else if (!this.combat) this.castPower(user, power, null);
      else user.queue.push({ k: 'power', power, target: user.uid });
      return true;
    }

    useItemNow(user, itemId, target) {
      const it = K.ITEMS[itemId];
      const u = it.use;
      if (!u) return false;
      target = target || user;
      if (u.heal) {
        if (target.droid) { this.addLog('Аптечки не действуют на дроидов.', '#ffb0b0'); return false; }
        const v = u.heal + Math.max(0, K.skill(user, 'tre'));
        this.heal(target, v);
      } else if (u.repair) {
        if (!target.droid) { this.addLog('Ремкомплект нужен только дроидам.', '#ffb0b0'); return false; }
        this.heal(target, u.repair + Math.max(0, K.skill(user, 'rep')));
      } else if (u.buff === 'stim') {
        this.addEffect(target, { id: 'stim', t: u.t });
        this.emit('float', { uid: target.uid, text: 'Стимулятор', col: '#ffd080' });
      } else if (u.buff === 'shield') {
        this.addEffect(target, { id: 'shield', t: u.t, absorb: u.absorb });
        this.emit('float', { uid: target.uid, text: 'Энергощит', col: '#80c0ff' });
        this.emit('sfx', { id: 'shield' });
      } else return false;
      this.removeItem(itemId, 1);
      return true;
    }

    heal(c, v) {
      if (c.dead) return;
      const before = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + v);
      this.emit('float', { uid: c.uid, text: '+' + (c.hp - before), col: '#60ff80' });
      this.emit('fx', { kind: 'heal', x: c.x, z: c.z });
      this.emit('sfx', { id: 'heal' });
    }

    addEffect(c, e) {
      const ex = c.effects.find(x => x.id === e.id);
      if (ex) Object.assign(ex, e); else c.effects.push(Object.assign({}, e));
    }

    canRest() {
      if (this.combat || !this.area || this.area.def.noRest || this.duel) return false;
      return !this.creatures.some(c => c.faction === 'hostile' && !c.dead && K.dist(c.x, c.z, this.leader.x, this.leader.z) < 22);
    }

    rest(force) {
      if (!force && !this.canRest()) { this.addLog('Нельзя отдыхать: рядом враги.', '#ffb0b0'); return false; }
      for (const c of Object.values(this.roster)) { c.hp = c.maxHp; c.fp = c.maxFp; c.dead = false; c.effects = c.effects.filter(e => e.id !== 'plague' && e.id !== 'stun' && e.id !== 'knockdown'); }
      this.addLog('Отряд отдохнул. Здоровье и Сила восстановлены.', '#a0ffa0');
      this.emit('sfx', { id: 'rest' });
      return true;
    }

    doInteraction(L, o) {
      L.interact = null;
      L.path = null;
      if (o.uid) {
        const c = o;
        if (c.dead) { return; }
        L.ang = Math.atan2(c.x - L.x, c.z - L.z);
        if (c.faction === 'hostile') { this.cmdAttack(c); return; }
        if (!c.static && !c.caged) c.ang = Math.atan2(L.x - c.x, L.z - c.z);
        if (c.dlg) this.startDialog(c.dlg, c);
        else if (c.bark) {
          const t = Array.isArray(c.bark) ? this.rng.pick(c.bark) : c.bark;
          this.emit('float', { uid: c.uid, text: t, col: '#ffffff', long: true });
          this.addLog(c.name + ': ' + t, '#e0e0e0');
        } else if (c.pid && c.pid !== this.leaderId) {
          if (K.DIALOGS[c.pid + '_talk'] && !this.combat) this.startDialog(c.pid + '_talk', c);
          else this.addLog(c.name + ': «Я с тобой».', '#e0e0e0');
        } else if (c.benchOf) this.emit('ui', { open: 'party' });
        return;
      }
      if (o.type === 'box' || o.type === 'corpse') return this.openContainer(o, L);
      if (o.type === 'exit') return this.useExit(o);
      if (o.type === 'use') { if (o.def.dlg) this.startDialog(o.def.dlg, o); return; }
      if (o.type === 'mine') return this.disarmMine(o);
      if (o.type === 'door') return this.useDoor(o);
    }

    useExit(o) {
      const d = o.def;
      if (this.combat) { this.addLog('Нельзя уйти во время боя.', '#ffb0b0'); this.emit('toast', { text: 'Нельзя уйти во время боя' }); return; }
      if (d.req && !this.evalReq(d.req)) {
        this.addLog(d.msg || 'Проход закрыт.', '#ffb0b0');
        this.emit('toast', { text: d.msg || 'Проход закрыт' });
        if (d.onBlocked && K.SCRIPTS[d.onBlocked]) K.SCRIPTS[d.onBlocked](this, { obj: o });
        return;
      }
      if (d.setFlag) this.flags[d.setFlag] = true;
      if (d.script && K.SCRIPTS[d.script]) { K.SCRIPTS[d.script](this, { obj: o }); return; }
      this.emit('sfx', { id: 'door' });
      this.travel(d.to, d.at);
    }

    lockCheck(lock, keyItem) {
      if (keyItem && this.countItem(keyItem)) return { ok: true, how: 'key' };
      if (!lock) return { ok: false };
      const best = this.bestSkill('sec');
      if (best + 10 >= lock) return { ok: true, how: 'skill' };
      if (best + 15 >= lock && this.countItem('sec_spike')) { this.removeItem('sec_spike', 1); return { ok: true, how: 'spike' }; }
      return { ok: false, need: lock };
    }

    useDoor(d) {
      const st = this.areaState(this.area.id);
      if (d.req && !this.evalReq(d.req) && !(d.keyItem && this.countItem(d.keyItem))) {
        const r = d.lock ? this.lockCheck(d.lock, null) : { ok: false };
        if (!r.ok) { this.addLog(d.msg || 'Заперто.', '#ffb0b0'); this.emit('toast', { text: d.msg || 'Заперто' }); return false; }
      }
      if (d.locked) {
        const r = this.lockCheck(d.lock, d.keyItem);
        if (!r.ok) {
          const msg = d.msg || ('Заперто. Нужна Безопасность ' + d.lock + ' (лучшая в отряде: ' + (this.bestSkill('sec') + 10) + ').');
          this.addLog(msg, '#ffb0b0');
          this.emit('toast', { text: msg });
          this.emit('sfx', { id: 'locked' });
          return false;
        }
        d.locked = false;
        st.doors[d.key] = 'unlocked';
        this.addLog(r.how === 'key' ? 'Дверь открыта ключом.' : 'Замок взломан.', '#a0ffa0');
        if (r.how !== 'key') this.gainXp(d.lock * 4);
        this.emit('sfx', { id: 'unlock' });
        if (d.alarm) this.raiseAlarm();
      }
      this.openDoor(d);
      return true;
    }

    raiseAlarm() {
      if (this.flags.estate_alarm) return;
      this.flags.estate_alarm = true;
      for (const c of this.creatures) if (c.npcId === 'davik_guard_npc') { c.faction = 'hostile'; c.aggro = true; c.dlg = null; }
      this.addLog('Тревога! Охрана Давика атакует!', '#ff6060');
      this.emit('toast', { text: 'Тревога!' });
      this.enterCombat();
    }

    openDoor(d) {
      if (d.open) return;
      d.open = true;
      this.areaState(this.area.id).doors[d.key] = 'open';
      this.emit('door', { key: d.key });
      this.emit('sfx', { id: 'door' });
    }

    openContainer(o, user) {
      const st = this.areaState(this.area.id);
      if (o.locked) {
        const r = this.lockCheck(o.lock, null);
        if (!r.ok) {
          const msg = 'Заперто. Нужна Безопасность ' + o.lock + ' (лучшая в отряде: ' + (this.bestSkill('sec') + 10) + ').';
          this.addLog(msg, '#ffb0b0'); this.emit('toast', { text: msg }); this.emit('sfx', { id: 'locked' });
          return;
        }
        o.locked = false;
        st.doors[o.key] = 'unlocked';
        this.gainXp(o.lock * 4);
        this.emit('sfx', { id: 'unlock' });
        if (o.def && o.def.alarm) this.raiseAlarm();
      }
      this.loot = o;
      this.mode = 'loot';
      this.emit('mode', { mode: 'loot' });
      this.emit('sfx', { id: 'open' });
    }

    takeLoot(idx) {
      const o = this.loot;
      if (!o) return;
      const take = idx == null ? o.items.slice() : [o.items[idx]].filter(Boolean);
      for (const it of take) {
        this.addItem(it.id, it.n, true);
        o.items.splice(o.items.indexOf(it), 1);
      }
      if (idx == null && o.cr) { this.addCredits(o.cr); o.cr = 0; }
      if (!o.items.length && !o.cr) this.markLooted(o);
      else this.syncCorpse(o);
    }

    takeCredits() { const o = this.loot; if (o && o.cr) { this.addCredits(o.cr); o.cr = 0; if (!o.items.length) this.markLooted(o); } }

    markLooted(o) {
      const st = this.areaState(this.area.id);
      o.looted = true;
      if (o.type === 'corpse') {
        st.corpses = st.corpses.filter(c => c.key !== o.key);
        const i = this.objects.indexOf(o);
        if (i >= 0) this.objects.splice(i, 1);
      } else st.looted[o.key] = 1;
    }

    syncCorpse(o) {
      if (o.type !== 'corpse') return;
      const st = this.areaState(this.area.id);
      const c = st.corpses.find(x => x.key === o.key);
      if (c) { c.items = o.items.slice(); c.cr = o.cr; }
    }

    closeLoot() {
      if (this.loot && this.loot.type === 'box' && !this.loot.items.length && !this.loot.cr) this.markLooted(this.loot);
      this.loot = null;
      if (this.mode === 'loot') this.mode = 'play';
      this.emit('mode', { mode: this.mode });
    }

    onQuestItem(id) {
      const hook = K.QUEST_ITEM_HOOKS && K.QUEST_ITEM_HOOKS[id];
      if (hook) hook(this);
    }

    disarmMine(o) {
      if (!o.found) return;
      const best = this.bestSkill('dem');
      if (best + 10 >= o.def.dc) {
        o.armed = false;
        this.areaState(this.area.id).mines[o.key] = 1;
        this.objects.splice(this.objects.indexOf(o), 1);
        this.addLog('Мина обезврежена.', '#a0ffa0');
        this.addItem('frag', 1, true);
        this.gainXp(o.def.dc * 5);
        this.emit('sfx', { id: 'unlock' });
      } else {
        this.addLog('Не удалось обезвредить мину (Взрывчатка ' + (best + 10) + ' из ' + o.def.dc + ').', '#ffb0b0');
        if (best + 10 < o.def.dc - 5) this.detonateMine(o);
      }
    }

    detonateMine(o) {
      o.armed = false;
      this.areaState(this.area.id).mines[o.key] = 1;
      const i = this.objects.indexOf(o);
      if (i >= 0) this.objects.splice(i, 1);
      this.emit('fx', { kind: 'explosion', x: o.x, z: o.z });
      this.emit('sfx', { id: 'explode' });
      this.emit('shake', { v: 0.6 });
      for (const c of this.creatures) {
        if (c.dead || K.dist(c.x, c.z, o.x, o.z) > 2.6) continue;
        let dmg = this.rng.d(o.def.dmg[0], o.def.dmg[1]);
        if (K.rollSave(this.rng, c, 'ref', o.def.dc)) dmg = Math.floor(dmg / 2);
        this.applyDamage(c, dmg, 'fire', null);
      }
    }

    startDialog(id, owner) {
      const d = K.DIALOGS[id];
      if (!d) throw new Error('dialog ' + id);
      const start = d.starts.find(s => s.conds.every(c => this.cond(c)));
      if (!start) return false;
      for (const L of this.partyCreatures()) { L.path = null; L.interact = null; }
      this.dialog = { id, d, owner: owner || null, node: null, replies: [], pending: [], history: [] };
      this.mode = 'dialog';
      for (const a of start.acts) this.runAct(a);
      this.enterNode(start.node);
      if (this.dialog) this.emit('mode', { mode: 'dialog' });
      return true;
    }

    runAct(a) {
      const k = a.split(':')[0];
      if (IMMEDIATE.has(k)) this.act(a, { owner: this.dialog && this.dialog.owner });
      else if (this.dialog) this.dialog.pending.push(a);
      else this.act(a, {});
    }

    enterNode(id) {
      const D = this.dialog;
      if (!D) return;
      if (id === 'END') { this.closeDialog(); return; }
      const n = D.d.nodes[id];
      if (!n) throw new Error('node ' + D.id + '.' + id);
      D.node = n;
      for (const a of n.acts) this.runAct(a);
      if (!this.dialog) return;
      let replies;
      if (n.cont) replies = [{ text: '[Далее]', target: n.cont, conds: [], acts: n.contActs || [] }];
      else {
        replies = n.replies.filter(r => r.conds.every(c => this.cond(c)));
        if (!replies.length) replies = [{ text: '[Конец беседы]', target: 'END', conds: [], acts: [] }];
      }
      D.replies = replies;
      D.speaker = this.speakerOf(n.who);
      D.text = this.subst(n.text);
      D.history.push({ who: D.speaker.name, text: D.text });
      this.emit('dialog', { node: id });
    }

    speakerOf(who) {
      const D = this.dialog;
      if (who === 'self') return { name: D.owner && (D.owner.name || D.owner.n) || '', uid: D.owner && D.owner.uid };
      if (who === 'narr') return { name: '', uid: null };
      if (who === 'player') return { name: this.player.name, uid: this.player.uid };
      if (this.roster[who]) return { name: this.roster[who].name, uid: this.roster[who].uid };
      const live = this.npc(who);
      if (live) return { name: live.name, uid: live.uid };
      if (K.NPCS[who]) return { name: K.NPCS[who].n, uid: null };
      if (K.TEMPLATES[who]) return { name: K.TEMPLATES[who].n, uid: null };
      return { name: who, uid: null };
    }

    subst(t) {
      return t.replace(/\{name\}/g, this.player.name).replace(/\{cls\}/g, K.CLASSES[this.player.cls].n);
    }

    choose(i) {
      const D = this.dialog;
      if (!D || !D.replies[i]) return;
      const r = D.replies[i];
      D.history.push({ who: this.player.name, text: r.text, me: true });
      for (const a of r.acts) this.runAct(a);
      if (!this.dialog) return;
      let target = r.target;
      if (r.check) {
        const roll = this.rng.d20();
        const sk = this.bestSkill(r.check.skill);
        const ok = roll + sk >= r.check.dc || (r.check.skill === 'per' && sk + 10 >= r.check.dc + 4);
        this.addLog((ok ? 'Успех: ' : 'Провал: ') + K.SKILL_NAMES[r.check.skill] + ' (' + (roll + sk) + ' против ' + r.check.dc + ')', ok ? '#a0ffa0' : '#ffb0b0');
        if (!ok) target = r.check.fail;
        else if (!this.flags['chk_' + D.id + '_' + D.node.id]) { this.flags['chk_' + D.id + '_' + D.node.id] = true; this.gainXp(r.check.dc * 3); }
      }
      if (r.acts.indexOf('end') >= 0) target = 'END';
      this.enterNode(target);
    }

    closeDialog(silent) {
      const D = this.dialog;
      if (!D) return;
      this.dialog = null;
      if (this.mode === 'dialog') this.mode = 'play';
      if (!silent) this.emit('mode', { mode: this.mode });
      for (const a of D.pending) this.act(a, { owner: D.owner });
    }

    openShop(id) {
      const def = K.SHOPS[id];
      if (!def) throw new Error('shop ' + id);
      if (!this.shopStock[id]) this.shopStock[id] = Object.assign({}, def.stock);
      this.shop = { id, def, stock: this.shopStock[id] };
      this.mode = 'shop';
      this.emit('mode', { mode: 'shop' });
    }
    buyPrice(id) { const s = this.shop; return Math.ceil(K.ITEMS[id].cost * (s ? s.def.markup : 1) * (this.flags.bek_discount && s && s.id === 'bek' ? 0.8 : 1)); }
    sellPrice(id) { const s = this.shop; return Math.floor(K.ITEMS[id].cost * (s ? s.def.buy : 0.3)); }
    buy(id) {
      const s = this.shop;
      if (!s || !s.stock[id]) return false;
      const p = this.buyPrice(id);
      if (this.credits < p) { this.addLog('Не хватает кредитов.', '#ffb0b0'); return false; }
      this.credits -= p;
      if (s.stock[id] > 0) s.stock[id]--;
      this.addItem(id, 1);
      this.addLog('Куплено: ' + K.ITEMS[id].n + ' за ' + p + ' кр.', '#ffd070');
      this.emit('sfx', { id: 'buy' });
      return true;
    }
    sell(id) {
      const it = K.ITEMS[id];
      if (!it || it.k === 'q' || it.nodrop || !this.countItem(id)) return false;
      const p = this.sellPrice(id);
      this.removeItem(id, 1);
      this.credits += p;
      if (this.shop) { const st = this.shop.stock; if (st[id] !== -1) st[id] = (st[id] || 0) + 1; }
      this.addLog('Продано: ' + it.n + ' за ' + p + ' кр.', '#ffd070');
      this.emit('sfx', { id: 'buy' });
      return true;
    }
    closeShop() { this.shop = null; if (this.mode === 'shop') this.mode = 'play'; this.emit('mode', { mode: this.mode }); }

    equip(c, itemId, slot) {
      const it = K.ITEMS[itemId];
      const chk = K.canEquip(c, it, slot);
      if (!chk.ok) { this.addLog(chk.why, '#ffb0b0'); return false; }
      if (!this.countItem(itemId)) return false;
      if (this.combat && slot === 'body') { this.addLog('Нельзя менять броню в бою.', '#ffb0b0'); return false; }
      this.unequip(c, slot);
      if (it.k === 'w' && it.two && c.equip.l) this.unequip(c, 'l');
      this.removeItem(itemId, 1);
      c.equip[slot] = itemId;
      K.recalc(c);
      this.emit('equip', { uid: c.uid });
      return true;
    }
    unequip(c, slot) {
      const cur = c.equip[slot];
      if (!cur) return;
      if (K.ITEMS[cur].nodrop) { if (slot !== 'r') return; }
      c.equip[slot] = null;
      if (!K.ITEMS[cur].nodrop) this.addItem(cur, 1);
      if (slot === 'r' && K.ITEMS[cur].nodrop) c.equip[slot] = cur;
      K.recalc(c);
    }

    levelUp(c, choice) {
      if (this.pendingLevels(c) <= 0) return false;
      K.applyLevelUp(c, choice || K.autoLevelChoice(c));
      this.emit('sfx', { id: 'levelup' });
      this.addLog(c.name + ' достигает уровня ' + c.level + '!', '#ffe080');
      return true;
    }

    startPazaak(opp) {
      const def = K.PAZAAK_OPP[opp];
      if (!def) throw new Error('pazaak opp ' + opp);
      const deck = this.sideDeckIds();
      if (deck.length < 4) { this.addLog('Нужно хотя бы 4 карты для колоды пазаака.', '#ffb0b0'); return; }
      this.pazaak = new K.Pazaak({ rng: this.rng, playerSide: deck, opp: def, wager: def.wager, oppId: opp });
      this.mode = 'pazaak';
      this.emit('mode', { mode: 'pazaak' });
    }

    sideDeckIds() {
      if (this.customDeck && this.customDeck.every(id => this.countItem(id) >= this.customDeck.filter(x => x === id).length)) return this.customDeck.slice(0, 10);
      const all = [];
      for (const s of this.inv) if (K.ITEMS[s.id].k === 'c') for (let i = 0; i < s.n; i++) all.push(s.id);
      all.sort((a, b) => (K.ITEMS[b].card.kind === '±') - (K.ITEMS[a].card.kind === '±') || Math.abs(K.ITEMS[a].card.v) - Math.abs(K.ITEMS[b].card.v));
      return all.slice(0, 10);
    }

    endPazaak() {
      const p = this.pazaak;
      if (!p) return;
      const def = K.PAZAAK_OPP[p.oppId];
      const won = p.winner === 'player';
      if (p.winner) {
        this.flags.pz_last_win = won;
      if (won) { this.addCredits(p.wager); this.flags['pz_won_' + p.oppId] = true; }
        else this.addCredits(-p.wager);
      }
      this.pazaak = null;
      this.mode = 'play';
      this.emit('mode', { mode: 'play' });
      if (def.after && p.winner) this.startDialog(def.after, this.npc(def.npc));
    }

    startSwoop() {
      this.swoop = new K.Swoop({ seed: this.rng.int(1, 1e6), rival: 25.0 });
      this.mode = 'swoop';
      this.emit('mode', { mode: 'swoop' });
    }

    endSwoop() {
      const s = this.swoop;
      if (!s) return;
      this.swoop = null;
      this.mode = 'play';
      this.flags.swoop_raced = true;
      if (s.finished) {
        const t = Math.round(s.time * 100) / 100;
        if (!this.vars.swoop_best || t * 100 < this.vars.swoop_best) this.vars.swoop_best = Math.round(t * 100);
        this.flags.swoop_last_win = t <= s.rival;
        this.addLog('Время заезда: ' + t.toFixed(2) + ' с (лучшее время соперников: ' + s.rival.toFixed(2) + ' с).', '#ffe080');
      }
      this.emit('mode', { mode: 'play' });
      const n = this.npc('swoop_official');
      this.startDialog('swoop_result', n);
    }

    startDuel(opp) {
      const L = this.player;
      this.duel = { opp, back: { area: this.area.id }, active: this.active.slice(), leader: this.leaderId, hp: L.hp };
      this.active = ['player'];
      this.leaderId = 'player';
      this.pendingDuel = true;
      this.travel('duel_ring', 'p');
    }

    beginDuelFight() {
      const def = K.AREAS.duel_ring;
      const o = this.findMark('o', def);
      const c = K.makeCreature(this.duel.opp, { faction: 'neutral' });
      c.x = o[0] + 0.5; c.z = o[1] + 0.5; c.ang = 0; c.group = 'duel';
      this.creatures.push(c);
      this.player.hp = this.player.maxHp;
      this.player.ang = Math.PI;
      this.duel.foe = c;
      this.duel.countdown = 2.2;
      this.emit('toast', { text: 'Дуэль: ' + c.name });
      this.addLog('Аджуур: «Бойцы, приготовиться!»', '#ffe080');
    }

    finishDuel(won) {
      const d = this.duel;
      this.player.hp = Math.max(1, this.player.hp);
      this.player.dead = false;
      this.player.effects = [];
      this.flags.duel_last_win = won;
      if (won) this.flags['duel_won_' + d.opp] = true;
      this.active = d.active;
      this.leaderId = d.leader;
      this.duel = null;
      this.pendingAfterDuel = true;
      this.loadArea('upper_cantina', 'h');
      this.combat = false;
      const aj = this.npc('ajuur');
      this.startDialog('ajuur', aj);
    }

    serialize() {
      const strip = c => {
        const o = {};
        for (const k of ['uid', 'tpl', 'pid', 'name', 'cls', 'level', 'attrs', 'skills', 'feats', 'powers', 'equip', 'hp', 'fp', 'maxHp', 'maxFp', 'model', 'droid', 'race', 'natDef', 'hpBonus', 'grow', 'ai', 'radius', 'fem', 'portrait', 'autoLevel', 'levelNotified', 'effects', 'x', 'z', 'ang']) o[k] = JSON.parse(JSON.stringify(c[k] === undefined ? null : c[k]));
        return o;
      };
      return {
        v: 1, t: Date.now(), areaId: this.area.id, player: this.player.name, level: this.player.level,
        roster: Object.fromEntries(Object.entries(this.roster).map(([k, c]) => [k, strip(c)])),
        active: this.active.slice(), leaderId: this.leaderId, xp: this.xp, credits: this.credits,
        inv: JSON.parse(JSON.stringify(this.inv)), flags: Object.assign({}, this.flags), vars: Object.assign({}, this.vars),
        quests: Object.assign({}, this.quests), journal: this.journal.slice(), areaStates: JSON.parse(JSON.stringify(this.areaStates)),
        shopStock: JSON.parse(JSON.stringify(this.shopStock)), align: this.align, time: this.time, rng: this.rng.s, playerTpl: K.TEMPLATES.player,
        customDeck: this.customDeck || null
      };
    }

    deserialize(s) {
      this.resetState();
      if (s.playerTpl) K.TEMPLATES.player = s.playerTpl;
      let maxUid = 1;
      for (const [k, o] of Object.entries(s.roster)) {
        const c = K.makeCreature(o.tpl === 'player' ? 'player' : o.tpl, { faction: 'party' });
        Object.assign(c, o);
        c.path = null; c.queue = []; c.target = null; c.dead = false; c.anim = { a: 'idle', t: 0 };
        this.roster[k] = c;
        maxUid = Math.max(maxUid, c.uid);
      }
      K.resetUids(maxUid + 1);
      Object.assign(this, { active: s.active, leaderId: s.leaderId, xp: s.xp, credits: s.credits, inv: s.inv, flags: s.flags, vars: s.vars, quests: s.quests, journal: s.journal, areaStates: s.areaStates, shopStock: s.shopStock, align: s.align, time: s.time, customDeck: s.customDeck || null });
      this.rng.s = s.rng;
      const members = {};
      for (const id of this.active) { const c = this.roster[id]; members[id] = [c.x, c.z]; }
      const L = this.roster[this.leaderId] || this.roster.player;
      const keep = [Math.floor(L.x), Math.floor(L.z)];
      keep.members = members;
      this.mode = 'play';
      this.loadArea(s.areaId, null, keep);
      this.emit('mode', { mode: 'play' });
    }
  }

  function cmp(a, op, b) {
    switch (op) {
      case '>=': return a >= b;
      case '<=': return a <= b;
      case '>': return a > b;
      case '<': return a < b;
      default: return a === b;
    }
  }

  K.defaultAttrs = cls => cls === 'soldier' ? { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 } : cls === 'scout' ? { str: 12, dex: 16, con: 14, int: 14, wis: 10, cha: 10 } : { str: 10, dex: 16, con: 14, int: 12, wis: 10, cha: 14 };
  K.defaultFeats = cls => cls === 'soldier' ? ['power_attack', 'flurry'] : ['rapid_shot', 'toughness'];
  K.defaultSkills = (cls, attrs) => cls === 'soldier' ? { tre: 4, dem: 4 } : cls === 'scout' ? { com: 4, sec: 4, awa: 4, rep: 4, tre: 4, dem: 4 } : { sec: 4, per: 4, awa: 4, ste: 4, com: 4, tre: 4, dem: 4 };

  K.XP_MULT = 3;
  K.FORCE_JOIN = { bastila: true, t3: true, canderous: true };
  K.Game = Game;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
