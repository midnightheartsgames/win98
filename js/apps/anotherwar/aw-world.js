(function (AW) {
  'use strict';

  const C = AW.C;
  const I = AW.Items;
  const SCRIPT_ENEMY = { '': 0, Cywil: 0, HeroiNPC: 1, RuchOporu: 2, Niemiec: 3, TajniakZTajemnica: 3, Rosjanin: 4 };
  const AI_BY_NAME = {
    NPUpierdliwy: 'soldier', NPUpierdliwyCLOSE: 'npupierdliwyclose', NPUpierdliwyFAR: 'npupierdliwyfar', NPRandomWalker: 'randomwalker',
    NPWiesniak: 'randomwalker', PRandomWalker: 'randomwalker', NPSzczur: 'rat', PAreaWalker: 'areawalker', PUndercover: 'undercover'
  };

  AW.Area = class {
    constructor(def) {
      this.kind = 'area';
      this.id = def.id;
      this.anchor = def.anchor || null;
      this.poly = def.poly || [];
      this.name = def.name || '';
      this.desc = def.desc || '';
      this.dlg = def.dlg || '';
      this.icon = def.icon || 'Zoom';
      this.active = def.active ? 1 : 0;
      this.safe = def.safe ? 1 : 0;
      this.ord = def.ord || 2;
      this.voice = def.voice || '';
      this.looked = 0;
    }
    contains(x, y) { return this.poly.length >= 3 && AW.pointInPoly(this.poly, x, y); }
    size() {
      if (this.sizeCache === undefined) {
        let s = 0;
        for (let i = 0; i < this.poly.length; i++) {
          const a = this.poly[i], b = this.poly[(i + 1) % this.poly.length];
          s += a[0] * b[1] - b[0] * a[1];
        }
        this.sizeCache = Math.abs(s) / 2;
      }
      return this.sizeCache;
    }
    point(i) {
      if (i === -2 || i === undefined) return this.anchor ? [this.anchor[0], this.anchor[1], this.anchor[2]] : (this.poly[0] ? [this.poly[0][0], this.poly[0][1], null] : null);
      const p = this.poly[i];
      return p ? [p[0], p[1], p[2] !== undefined ? p[2] : null] : this.point(-2);
    }
    randomPoint() {
      if (this.poly.length < 3) return this.point(-2);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of this.poly) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      for (let i = 0; i < 30; i++) {
        const x = x0 + AW.rng.next() * (x1 - x0), y = y0 + AW.rng.next() * (y1 - y0);
        if (this.contains(x, y)) return [x, y];
      }
      return this.point(-2);
    }
    center() { return AW.polyCenter(this.poly); }
  };

  AW.GfxObj = class {
    constructor(def) {
      this.kind = 'gfx';
      this.id = def.id;
      this.obj = def.obj;
      const m = AW.Data.gfxMeta(def.obj);
      this.key = m ? m.key : '';
      this.meta = m ? m.meta : null;
      this.x = def.x;
      this.y = def.y;
      this.visible = def.active !== 0 && def.visible !== false;
      this.anim = 0;
      this.t = def.frm || 0;
      this.frame = 0;
      this.loop = def.loop !== false;
      this.playing = def.playing !== false;
      this.mode = this.meta ? this.meta.mode : 'alpha';
      this.depth = def.depth || 0;
      this.onEnd = null;
    }
    frames() { return this.meta && this.meta.anims[this.anim] ? this.meta.anims[this.anim].f : []; }
    update(dt) {
      const fr = this.frames();
      if (!fr.length || !this.playing) return;
      const fps = (this.meta.anims[this.anim].fps || 15);
      this.t += dt * fps;
      if (this.t >= fr.length) {
        if (this.loop) this.t %= fr.length;
        else { this.t = fr.length - 1; this.playing = false; const cb = this.onEnd; this.onEnd = null; if (cb) cb(); }
      }
      this.frame = Math.floor(this.t);
    }
  };

  AW.World = class {
    constructor(env) {
      this.env = env || null;
      this.state = AW.World.newState();
      this.actors = [];
      this.areas = [];
      this.gfx = [];
      this.ground = [];
      this.sounds = [];
      this.fx = [];
      this.projectiles = [];
      this.mines = [];
      this.timers = [];
      this.hero = null;
      this.levelId = '';
      this.level = null;
      this.walk = null;
      this.cam = { x: 0, y: 0, follow: null, goal: null, instant: false };
      this.controlState = 1;
      this.cutscene = false;
      this.paused = false;
      this.dialog = null;
      this.tradeWith = null;
      this.gameSeq = new AW.Seq(this, null);
      this.time = 0;
      this.pendingLevel = null;
      this.loading = false;
      this.stash = null;
      this.taunter = null;
      this.lastStep = 0;
      this.night = false;
      this.cheatGod = false;
      this.combatT = 0;
    }

    static newState() {
      return { flags: { wizjer: 1, map1: 1, map2: 1, map3: 1 }, notes: [], quests: {}, dialogs: {}, levels: {}, visited: {}, diary: 0, playTime: 0, act: 1, kills: 0 };
    }

    ev(name) {
      const e = this.env;
      if (!e || typeof e[name] !== 'function') return null;
      const args = Array.prototype.slice.call(arguments, 1);
      return e[name].apply(e, args);
    }

    async newGame(opts) {
      this.state = AW.World.newState();
      this.hero = this.createHero(opts);
      this.actors = [];
      await this.loadLevel(opts.startLevel || 'StoryRoom', { from: '' });
    }

    createHero(opts) {
      const cls = opts.cls || 'strongman';
      const R = AW.Rules;
      const base = Object.assign({}, R.CLASSES[cls].base, opts.stats || {});
      const hpMax = R.hpBase(base.end, base.lck);
      const hero = new AW.Actor(this, {
        id: 'Hero', tml: cls, name: opts.name || 'Зигмунт', cls, base, hpMax, hp: hpMax, team: 1, enemy: 1,
        looks: { head: 'hero1', torso: 'hero1', legs: 'hero1' }, packsize: 3,
        ambients: [[100, 'ambient1'], [20, 'ambient3'], [50, 'ambient2'], [60, 'ambientlook']], skills: {}, voiceScheme: 'hero'
      });
      hero.skills[R.CLASSES[cls].skill] = 1;
      hero.spCharge = {};
      const row = R.spRow(cls, 1);
      hero.sp[row[0]] = 1;
      hero.spSel = row[0];
      for (const ref of ['h.A_whisky', 'i.szmal', 'u.A_kurtka_P']) {
        const it = I.create(ref, { noAffix: true });
        if (it) hero.inv.add(it);
      }
      return hero;
    }

    teamMembers() { return this.actors.filter(a => a.team === 1 && a !== this.hero); }
    inTeam(id) { const a = this.actor(id); return !!(a && a.team === 1); }
    teamHas(name) {
      const list = [this.hero].concat(this.teamMembers());
      return list.some(a => a && a.inv.has(name));
    }

    async loadLevel(id, opts) {
      const o = opts || {};
      this.loading = true;
      const prev = this.levelId;
      if (prev && this.level) this.saveLevelState();
      const team = [];
      if (this.hero) team.push(this.hero);
      for (const a of this.actors) if (a.team === 1 && a !== this.hero && a.follow !== false) team.push(a);
      const data = await AW.Data.level(id);
      this.level = data;
      this.levelId = id;
      this.walk = data.map ? AW.WalkMap.fromLevel(data.map) : null;
      this.actors = [];
      this.areas = data.areas.map(a => new AW.Area(a));
      this.gfx = data.gfx.map(g => new AW.GfxObj(g));
      this.ground = [];
      this.sounds = data.sounds.map(s => Object.assign({ t: AW.rng.next() * (s.interval || 5) }, s));
      this.fx = [];
      this.projectiles = [];
      this.mines = [];
      this.timers = [];
      this.gameSeq.reset();
      this.dialog = null;
      this.taunter = null;
      const saved = this.state.levels[id] || null;
      const first = !this.state.visited[id];
      this.state.visited[id] = 1;
      for (const h of data.humans) {
        if (team.some(t => t.id === h.id)) continue;
        const sv = saved && saved.actors ? saved.actors[h.id] : null;
        if (saved && saved.actors && !sv && !saved.keepAll) continue;
        const act = sv ? this.restoreActor(sv) : this.spawnHuman(h);
        if (act) this.actors.push(act);
      }
      if (saved && saved.extra) for (const sv of saved.extra) this.actors.push(this.restoreActor(sv));
      if (saved && saved.ground) this.ground = saved.ground.map(g => ({ item: g.item, x: g.x, y: g.y, uid: g.item.uid }));
      else for (const it of data.items) {
        if (!it.active) continue;
        const item = I.create(it.cls === 'citem' ? 'i.' + it.tml : it.cls === 'chealth' ? 'h.' + it.tml : it.cls === 'cweapon' ? 'w.' + it.tml : it.cls === 'cammo' ? 'a.' + it.tml : 'u.' + it.tml);
        if (item) this.ground.push({ item, x: it.x, y: it.y, uid: item.uid, levelItem: it.id });
      }
      if (saved) this.applyLevelState(saved);
      for (const t of team) {
        t.stopWalk();
        t.seq.reset();
        t.attack = null;
        t.say = null;
        this.actors.push(t);
      }
      this.placeTeam(prev, o);
      const S = AW.Scripts && AW.Scripts[id];
      if (this.hero && !this.hero.fight) this.hero.idle();
      for (const a of this.actors) if (!a.anim.name) a.idle();
      this.camInstantOn(this.hero);
      this.cutscene = false;
      this.controlState = 1;
      if (this.levelIsSafe() && this.hero) this.setFight(this.hero, 0);
      this.ev('guiMode', 2);
      if (S && S.onLoad) S.onLoad(this, prev, first, o);
      this.spawnZones(S, saved);
      this.loading = false;
      this.ev('levelLoaded', data, prev);
      this.music(data.music || '');
      return data;
    }

    levelIsSafe() { return !!(this.level && this.level.safe); }

    placeTeam(prev, o) {
      const h = this.hero;
      if (!h) return;
      let p = null;
      if (o && o.at) p = o.at;
      else if (prev) {
        const ar = this.area('a' + prev);
        if (ar) p = ar.point(-2);
      }
      if (!p) {
        const st = this.area('aStart');
        if (st) p = st.point(-2);
      }
      if (!p && this.level) p = [this.level.camera[0] + 400, this.level.camera[1] + 300];
      if (!p) return;
      const wp = this.walk ? this.walk.nearestWalkable(p[0], p[1], 30) || p : p;
      h.x = wp[0]; h.y = wp[1];
      if (p[2] !== undefined && p[2] !== null) h.dir = AW.angToDir(p[2]);
      let k = 0;
      for (const m of this.teamMembers()) {
        const ang = Math.PI * 0.75 + k * 0.6;
        let x = h.x + Math.cos(ang) * 50, y = h.y + Math.sin(ang) * 25;
        const q = this.walk ? this.walk.nearestWalkable(x, y, 20) : [x, y];
        if (q) { x = q[0]; y = q[1]; }
        m.x = x; m.y = y; m.dir = h.dir;
        k++;
      }
    }

    spawnHuman(h) {
      const D = AW.Data;
      const tml = h.tml ? D.human(h.tml) : null;
      const tmlName = tml ? tml.name : (h.tml || '');
      const num = (f, fb) => {
        if (tml && tml.exprs[f]) return D.humanValue(tml, f, fb);
        const v = h[f];
        return v === undefined || v === '' ? fb : (typeof v === 'number' ? v : AW.evalValue(v, 0));
      };
      const tx = f => tml && tml.exprs[f] ? String(tml.exprs[f][0]) : '';
      const kit = tml ? tml.kits : {};
      const looks = {
        head: kit.kit_head && kit.kit_head.length ? AW.weightedPick(kit.kit_head) : 'hero1',
        torso: kit.kit_torso && kit.kit_torso.length ? AW.weightedPick(kit.kit_torso) : '',
        legs: kit.kit_legs && kit.kit_legs.length ? AW.weightedPick(kit.kit_legs) : ''
      };
      const ambs = (kit.kit_ambients || []).map(s => { const m = String(s).match(/^(\d+):(.*)$/); return m ? [parseInt(m[1], 10), m[2].toLowerCase()] : [20, String(s).toLowerCase()]; });
      const skills = {};
      for (const s of kit.kit_skills || []) {
        const m = String(s).match(/^(\d+):(\w+)$/);
        if (m && AW.Rules.SKILL_BY_OLD[m[2]]) skills[AW.Rules.SKILL_BY_OLD[m[2]]] = parseInt(m[1], 10);
      }
      const script = tml ? tx('script') : (h.script || '');
      let enemy = SCRIPT_ENEMY[script];
      if (enemy === undefined) enemy = /^FFSkrzynia/.test(script) ? 5 : (h.enemy || 0);
      const base = { str: num('strength', 4), agi: num('agility', 4), int: num('inteligence', 4), end: num('endurance', 4), cha: num('charisma', 4), spd: Math.min(12, num('speed', 5)), lck: num('luck', 5) };
      const level = Math.max(1, num('level', 1));
      const toroll = num('toroll', 0);
      let hp, hpMax;
      if (tml) {
        hpMax = AW.Rules.hpBase(base.end, base.lck);
        for (let n = 0; n < level; n++) hpMax += AW.Rules.hpPerLevel(base.end, toroll);
        hp = hpMax;
      } else {
        hp = num('hitpoints', 0);
        hpMax = Math.max(1, num('maxhitpoints', 0) || hp || AW.Rules.hpBase(base.end, base.lck));
      }
      const dlg = tml ? tx('dlgDesc') : (h.dlg || '');
      const name = tml && tx('txtName') ? this.lookupName(tx('txtName')) : (h.name || h.id);
      const desc = tml && tx('txtDesc') ? this.lookupName(tx('txtDesc')) : (h.desc || '');
      const a = new AW.Actor(this, {
        id: h.id, tml: tmlName, name, desc, dlg, icon: h.icon || 'Talk',
        x: h.x, y: h.y, ang: h.ang || 0, visible: h.active !== 0, enemy, team: h.team === 1 ? 1 : 0, level,
        base, acBase: 0, toroll, tohit: num('tohit', 0), tomiss: num('tomiss', 0), hpMax, hp: Math.min(hpMax, hp || hpMax),
        looks, ambients: ambs.length ? ambs : [[100, 'ambient1']], skills,
        wambient: parseInt(tml ? tx('wambient') : (h.wambient || 0), 10) || 0, packsize: num('packsize', 9) || 3
      });
      a.acBase = enemy === 1 ? 0 : num('armorclass', 0) - AW.Rules.acBase(base.agi, level);
      a.xp = AW.Rules.xpForLevel(level);
      if (/^A_Woffic|^A_UOpart/.test(tmlName)) a.flags.officer = 1;
      a.script = script;
      const hand = kit.kit_hand && kit.kit_hand.length ? AW.weightedPick(kit.kit_hand.map(r => /^\d+:/.test(r) ? r : '50:' + r)) : '';
      if (hand) a.inv.hand = I.create(hand);
      let bi = 0;
      for (const ref of kit.kit_belt || []) {
        if (bi >= 7) break;
        const it = I.create(String(ref).replace(/^\d+:/, ''));
        if (it) a.inv.belt[bi++] = it;
      }
      a.loot = (kit.kit_backpack || []).slice();
      const aiName = tml ? tx('ai') : '';
      a.defaultAi = aiName;
      a.ai = AI_BY_NAME[aiName] ? AW.AI.create(a, AI_BY_NAME[aiName], []) : null;
      if (enemy === 5) { a.ai = null; a.wambient = 0; a.crate = true; a.radius = 18; }
      if (/^Szczur/i.test(tmlName)) a.radius = 4;
      return a;
    }

    spawnTemplate(tmlName, x, y, extra) {
      const a = this.spawnHuman(Object.assign({ id: tmlName + '_' + Math.floor(AW.rng.next() * 1e9).toString(36), tml: tmlName, x, y, active: 1 }, extra || {}));
      const tml = AW.Data.human(tmlName);
      const nm = tml.exprs.txtName ? tml.exprs.txtName[0] : '';
      if (nm) a.name = this.lookupName(nm);
      const ds = tml.exprs.txtDesc ? tml.exprs.txtDesc[0] : '';
      if (ds) a.desc = this.lookupName(ds);
      this.actors.push(a);
      a.idle();
      return a;
    }

    lookupName(s) {
      if (!s) return '';
      const k = String(s).replace(/^_/, '');
      const v = AW.TEXT && AW.TEXT[k] !== undefined ? AW.TEXT[k] : s;
      return String(v).replace(/^[MFNP]@/, '');
    }

    restoreActor(sv) {
      const a = new AW.Actor(this, Object.assign({}, sv, { inv: I.Inventory.load(sv.inv) }));
      a.fight = sv.fight || 0;
      a.wmode = sv.wmode || 0;
      if (a.dead) {
        a.setAnim(sv.corpseAnim || 'death2', { loop: false, hold: true });
        a.anim.t = 999;
      } else if (a.enemy === 3 || a.enemy === 2) a.ai = AW.AI.create(a, 'soldier', []);
      else if (sv.aiType) a.ai = AW.AI.create(a, sv.aiType, sv.aiArgs || []);
      if (a.team === 1 && a !== this.hero) a.ai = AW.AI.create(a, 'companion', []);
      if (/^Szczur/.test(a.tml)) a.ai = AW.AI.create(a, 'rat', []);
      if (sv.crate) a.crate = true;
      a.loot = sv.loot || null;
      return a;
    }

    saveLevelState() {
      const id = this.levelId;
      const st = { actors: {}, extra: [], ground: [], areas: {}, gfx: {}, walkMods: this.walkMods || [], time: this.time };
      for (const a of this.actors) {
        if (a.team === 1) continue;
        const s = a.serialize();
        const ai = a.ai && a.ai.type === 'interlocutor' ? a.savedAi : a.ai;
        s.aiType = ai ? ai.type : '';
        s.aiArgs = ai ? (ai.args || []).map(v => v && typeof v === 'object' ? v.id : v) : [];
        s.crate = a.crate || false;
        s.loot = a.loot || null;
        if (a.spawnZone) continue;
        if (this.level.humans.some(h => h.id === a.id)) st.actors[a.id] = s;
        else st.extra.push(s);
      }
      st.ground = this.ground.map(g => ({ item: g.item, x: g.x, y: g.y }));
      for (const ar of this.areas) st.areas[ar.id] = { active: ar.active, dlg: ar.dlg, desc: ar.desc, icon: ar.icon, name: ar.name, looked: ar.looked };
      for (const g of this.gfx) st.gfx[g.id] = { visible: g.visible, anim: g.anim, t: g.t, playing: g.playing, loop: g.loop };
      st.zoneTime = (this.state.levels[id] && this.state.levels[id].zoneTime) || this.zoneTime || 0;
      st.zoneAlive = this.actors.filter(a => a.spawnZone && !a.dead).map(a => { const s = a.serialize(); s.loot = a.loot; return s; });
      this.state.levels[id] = st;
      this.walkMods = [];
    }

    applyLevelState(st) {
      for (const ar of this.areas) {
        const s = st.areas && st.areas[ar.id];
        if (s) Object.assign(ar, s);
      }
      for (const g of this.gfx) {
        const s = st.gfx && st.gfx[g.id];
        if (s) Object.assign(g, s);
      }
      this.walkMods = (st.walkMods || []).slice();
      for (const m of this.walkMods) {
        const ar = this.area(m.area);
        if (ar && this.walk) this.walk.fillPoly(ar.poly, m.val);
      }
    }

    spawnZones(S, saved) {
      if (!S || !S.zones) return;
      const st = saved || {};
      const expired = !st.zoneTime || (this.state.playTime - st.zoneTime) > C.RESPAWN_S;
      if (!expired && st.zoneAlive) {
        for (const sv of st.zoneAlive) {
          const a = this.restoreActor(sv);
          a.spawnZone = sv.spawnZone || 'z';
          a.ai = a.enemy === 5 ? null : AW.AI.create(a, 'soldier', []);
          this.actors.push(a);
          a.idle();
        }
        this.zoneTime = st.zoneTime;
        this.restoreMines(st);
        return;
      }
      this.zoneTime = this.state.playTime;
      this.night = AW.rng.chance(0.5);
      for (const z of S.zones(this)) this.spawnZone(z);
    }

    restoreMines() {}

    spawnZone(z) {
      const ar = this.area(z.area);
      if (!ar || !ar.poly.length) return;
      const used = new Set();
      const pickPoint = (p1, p2) => {
        for (let k = 0; k < 200; k++) {
          const p = AW.random(p1, p2);
          if (!used.has(p) && ar.poly[p]) { used.add(p); return p; }
        }
        return -1;
      };
      let commander = null;
      if (z.commander) {
        const p = ar.point(-2);
        const q = this.walk ? this.walk.nearestWalkable(p[0], p[1], 10) || p : p;
        commander = this.spawnTemplate(AW.rng.pick(z.commander), q[0], q[1]);
        commander.spawnZone = z.area;
        if (p[2] !== null && p[2] !== undefined) commander.dir = AW.angToDir(p[2]);
        commander.flags.officer = 1;
        commander.ai = AW.AI.create(commander, commander.defaultAi && /FAR/i.test(commander.defaultAi) ? 'npupierdliwyfar' : 'soldier', []);
      }
      const spec = z.soldiers || z.mines;
      if (!spec) return;
      const [p1, p2, pmin0, pmax] = spec;
      const pmin = Math.min(pmin0, p2 - p1 + 1);
      let n = 0, guard = 0;
      while (n < pmin && guard++ < 50) {
        for (const [w, tml] of z.units) {
          if (AW.random(100) >= w) continue;
          const p = pickPoint(p1, p2);
          if (p < 0) { guard = 99; break; }
          n++;
          const pt = ar.poly[p];
          if (z.mines) {
            const q = this.walk ? this.walk.nearestWalkable(pt[0], pt[1], 6) : pt;
            if (q) this.mines.push({ x: q[0], y: q[1], area: 3, damage: 30, team: 3, owner: null, tml, zone: z.area });
          } else {
            const x = pt[0] + AW.random(60) - 30, y = pt[1] + AW.random(60) - 30;
            const q = this.walk ? this.walk.nearestWalkable(x, y, 10) || [pt[0], pt[1]] : [x, y];
            const a = this.spawnTemplate(tml, q[0], q[1]);
            a.spawnZone = z.area;
            a.dir = commander ? commander.dir : (pt[2] !== undefined && pt[2] !== null ? AW.angToDir(pt[2]) : AW.random(8) - 1);
            a.anim.t = AW.random(20);
            if (!a.crate) a.ai = AW.AI.create(a, 'soldier', []);
          }
          if (n >= pmax) break;
        }
      }
    }

    update(dt) {
      if (this.loading) return;
      if (this.pendingLevel) {
        const p = this.pendingLevel;
        this.pendingLevel = null;
        this.changeLevel(p.id, p.opts);
        return;
      }
      if (this.paused || this.tradeWith || this.uiModal) return;
      if (this.dialog) {
        for (const a of this.actors) {
          a.updateSay(dt);
          if (a.dead) continue;
          a.seq.update(dt);
          a.updateMove(dt);
          a.updateAnim(dt);
        }
        this.gameSeq.update(dt);
        this.updateCamera(dt);
        return;
      }
      this.time += dt;
      this.state.playTime += dt;
      if (this.timers.length) {
        const due = [];
        for (const t of this.timers) { t.t -= dt; if (t.t <= 0) due.push(t); }
        if (due.length) {
          this.timers = this.timers.filter(t => t.t > 0);
          for (const t of due) t.fn();
        }
      }
      this.gameSeq.update(dt);
      for (const a of this.actors.slice()) a.update(dt);
      AW.Combat.updateProjectiles(this, dt);
      AW.Combat.updateMines(this);
      for (const g of this.gfx) g.update(dt);
      this.updateFx(dt);
      this.updateSounds(dt);
      this.updateSafe();
      this.updateCompanionsDown(dt);
      if (this.inCombat()) this.combatT = 3; else if (this.combatT > 0) this.combatT -= dt;
      this.updateCamera(dt);
      const h = this.hero;
      if (h && h.dead && !this.deathPending) {
        this.deathPending = true;
        this.later(2.2, () => this.heroDeath());
      }
    }

    inCombat() {
      for (const a of this.actors) {
        if (a.dead || !a.visible) continue;
        if ((a.enemy === 3) && a.ai && a.ai.mode === 'attack') return true;
      }
      return false;
    }

    updateSafe() {
      const h = this.hero;
      if (!h || h.dead) return;
      if (h.fight && this.isSafe(h) && !this.inCombat()) this.setFight(h, 0);
    }

    isSafe(a) {
      if (this.levelIsSafe()) return true;
      for (const ar of this.areas) if (ar.safe && ar.contains(a.x, a.y)) return true;
      return false;
    }

    updateCompanionsDown(dt) {
      for (const a of this.teamMembers()) {
        if (!a.dead) continue;
        a.downT = (a.downT || 0) + dt;
        const danger = this.actors.some(e => !e.dead && e.visible && this.hostile(e, a) && AW.isoDistM(e.x, e.y, a.x, a.y) < 9);
        if (a.downT > 10 && !danger) this.reviveCompanion(a, Math.max(5, Math.floor(a.hpMax * 0.3)));
      }
    }

    reviveCompanion(a, hp) {
      a.dead = false;
      a.hp = Math.min(a.hpMax, hp);
      a.downT = 0;
      a.visible = true;
      a.ai = AW.AI.create(a, 'companion', []);
      a.setAnim('ambient1', { loop: false, onEnd: () => a.idle() });
      this.message(a.name + ' поднимается на ноги', 'green');
    }

    later(t, fn) { this.timers.push({ t, fn }); }

    hostile(a, b) {
      if (!a || !b || a === b) return false;
      const x = a.enemy, y = b.enemy;
      if (x === 5 || y === 5 || x === undefined || y === undefined) return false;
      if (a.chaos > 0 && y !== 0) return true;
      if (a.disinfo > 0 && x === 3 && y === 3) return true;
      if (x === 3) return y === 1 || y === 2 || y === 4;
      if (x === 2) return y === 3;
      if (x === 1) return y === 3;
      if (x === 4) return y === 3;
      return false;
    }

    alertAllies(a, target) {
      for (const o of this.actors) {
        if (o === a || o.dead || !o.visible || o.enemy !== a.enemy || !o.ai || !o.ai.engage) continue;
        if (AW.isoDistM(o.x, o.y, a.x, a.y) < 8 && o.ai.mode !== 'attack') o.ai.engage(target);
      }
    }

    noise(src, radius) {
      for (const o of this.actors) {
        if (o.dead || !o.visible || !o.ai || !o.ai.engage || o.ai.mode === 'attack') continue;
        if (!src.team && src.team !== 0) continue;
        if (AW.dist(o.x, o.y, src.x, src.y) > radius) continue;
        if (src.x !== undefined && src.enemy !== undefined && this.hostile(o, src)) o.ai.engage(src);
        else if (src.team === 1 && o.enemy === 3) {
          const h = this.hero;
          if (h && AW.dist(o.x, o.y, h.x, h.y) < radius) o.ai.engage(h);
        }
      }
    }

    teamAttacked(from) {
      for (const m of this.teamMembers()) if (m.ai && m.ai.onAttacked) m.ai.onAttacked(from);
    }

    provoke(target, from) {
      if (target.enemy === 0 && from === this.hero && !target.crate) {
        this.message(target.name + ' в ужасе', 'yellow');
      }
    }

    blockerAt(mover, x, y) {
      if (mover.crate) return null;
      for (const o of this.actors) {
        if (o === mover || o.dead || !o.visible || o.crate) continue;
        if (o.team === 1 && mover.team === 1) continue;
        if (o.radius < 8) continue;
        if (o.path && o.path.length) continue;
        const d = AW.isoDist(x, y, o.x, o.y);
        if (d < 22 && d < AW.isoDist(mover.x, mover.y, o.x, o.y)) return o;
      }
      return null;
    }

    footstep(a, run) {
      if (!this.env || !this.walk) return;
      const f = Math.floor(a.anim.t);
      const key = run ? [0, 6] : [0, 8];
      if (a._stepF === f) return;
      a._stepF = f;
      if (key.indexOf(f) < 0) return;
      if (AW.dist(a.x, a.y, this.cam.x + 400, this.cam.y + 300) > 520) return;
      const g = this.walk.ground(a.x, a.y);
      const names = [null, 'bruk', 'drewno', 'kaluza', 'kamien', 'metal', 'snieg', 'trawa', 'ziemia', 'kamien-reverb'];
      const n = names[g] || 'bruk';
      this.playSound('movement/' + n + (f === 0 ? '-p' : '-l'), a.x, a.y, a === this.hero ? 55 : 35);
    }

    resolve(name) {
      if (!name) return null;
      const s = String(name).trim();
      if (s === 'Hero' || s === 'Zygmunt') return this.hero;
      return this.actor(s) || this.area(s) || this.gfxObj(s) || null;
    }
    actor(id) { return this.actors.find(a => a.id === id) || null; }
    area(id) { return this.areas.find(a => a.id === id) || null; }
    gfxObj(id) { return this.gfx.find(g => g.id === id) || null; }

    actorAt(x, y, except) {
      let best = null, bd = Infinity;
      for (const a of this.actors) {
        if (a === except || a.dead || !a.visible) continue;
        const d = AW.dist(a.x, a.y - 40, x, y);
        if (d < 48 && d < bd) { bd = d; best = a; }
      }
      return best;
    }

    actorBox(a) {
      const fi = a.frameInfo();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const px = a.x + fi.off[0], py = a.y + fi.off[1];
      for (const p of fi.parts) {
        const f = p.f;
        x0 = Math.min(x0, px - f[4]); y0 = Math.min(y0, py - f[5]);
        x1 = Math.max(x1, px - f[4] + f[2]); y1 = Math.max(y1, py - f[5] + f[3]);
      }
      if (x0 === Infinity) return [a.x - 14, a.y - 90, a.x + 14, a.y];
      return [x0, y0, x1, y1];
    }

    pick(x, y) {
      let best = null, by = -Infinity;
      for (const a of this.actors) {
        if (!a.visible || a === this.hero || (a.dead && !a.dying)) continue;
        const b = this.actorBox(a);
        const pad = a.radius < 8 ? 10 : 0;
        if (x >= b[0] - pad && x <= b[2] + pad && y >= b[1] - pad && y <= b[3] + pad) {
          if (a.y > by) { by = a.y; best = { kind: 'human', obj: a }; }
        }
      }
      if (best) return best;
      for (const g of this.ground) {
        if (AW.dist(g.x, g.y - 8, x, y) < 22) return { kind: 'item', obj: g };
      }
      let bestA = null;
      for (const ar of this.areas) {
        if (!ar.active) continue;
        if (!ar.contains(x, y)) continue;
        if (!bestA || ar.ord > bestA.ord || (ar.ord === bestA.ord && ar.size() < bestA.size())) bestA = ar;
      }
      if (bestA) return { kind: 'area', obj: bestA };
      return null;
    }

    nearPos(mover, target, dist) {
      const d = dist || 80;
      let ang = Math.atan2(mover.y - target.y, mover.x - target.x);
      for (let k = 0; k < 8; k++) {
        const a = ang + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.5;
        const x = target.x + Math.cos(a) * d * 0.7, y = target.y + Math.sin(a) * d * 0.35;
        if (!this.walk || this.walk.walkable(x, y)) return [x, y];
      }
      return [target.x, target.y + 10];
    }

    updateCamera(dt) {
      const cam = this.cam;
      let tx, ty;
      if (cam.goal) { tx = cam.goal[0]; ty = cam.goal[1]; }
      else {
        const f = cam.follow || this.hero;
        if (!f) return;
        tx = f.x; ty = f.y - 50;
      }
      const vw = C.VIEW_W, vh = C.VIEW_H - C.PANEL_BOTTOM - C.PANEL_TOP;
      let gx = tx - vw / 2, gy = ty - vh / 2 - C.PANEL_TOP;
      if (this.scoutT > 0) { this.scoutT -= dt; gx += this.scoutDX || 0; gy += this.scoutDY || 0; }
      if (cam.instant) { cam.x = gx; cam.y = gy; cam.instant = false; }
      else {
        const k = Math.min(1, dt * 4);
        cam.x += (gx - cam.x) * k;
        cam.y += (gy - cam.y) * k;
      }
      this.clampCamera();
    }

    clampCamera() {
      const cam = this.cam;
      if (!this.level) return;
      const W = this.level.bgw || 800, H = this.level.bgh || 600;
      cam.x = Math.max(0, Math.min(Math.max(0, W - C.VIEW_W), cam.x));
      cam.y = Math.max(-C.PANEL_TOP, Math.min(Math.max(-C.PANEL_TOP, H - C.VIEW_H + C.PANEL_BOTTOM), cam.y));
      if (W < C.VIEW_W) cam.x = (W - C.VIEW_W) / 2;
      if (H + C.PANEL_BOTTOM + C.PANEL_TOP < C.VIEW_H) cam.y = (H - C.VIEW_H) / 2;
    }

    camFollow(a) { this.cam.follow = a || this.hero; this.cam.goal = null; }
    camGoto(x, y) { this.cam.goal = [x, y]; }
    camInstant() { this.cam.instant = true; this.updateCamera(0); }
    camInstantOn(a) { this.cam.follow = a || this.hero; this.cam.goal = null; this.cam.instant = true; this.updateCamera(0); }

    updateFx(dt) {
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter(f => f.t < f.life);
    }

    updateSounds(dt) {
      if (!this.env) return;
      for (const s of this.sounds) {
        if (!s.active) continue;
        if (!s.interval) {
          if (!s.loopOn) { s.loopOn = true; this.ev('loopSound', s); }
          continue;
        }
        s.t -= dt;
        if (s.t <= 0) {
          s.t = s.interval + AW.rng.next() * (s.rnd || 0);
          this.playSound(s.snd, s.x, s.y, s.vol || 100);
        }
      }
    }

    playSound(path, x, y, vol) {
      if (!path) return;
      const p = String(path).replace(/\\/g, '/').replace(/\.(wav|ogg|mp3)$/i, '').toLowerCase();
      this.ev('sound', p, x, y, vol === undefined ? 100 : vol);
    }

    playVoice(key, actor) {
      const k = String(key || '').toLowerCase();
      const dur = AW.Data.audioLen('speech/' + k);
      if (dur > 0) this.ev('voice', k, actor, dur);
      return dur;
    }
    stopVoice(actor) { this.ev('stopVoice', actor); }

    music(name) { this.ev('music', name); }
    message(text, color) { this.ev('message', text, color || ''); }
    floatText(a, text, color) { if (a) this.ev('float', a, text, color || '#ffffff'); }

    blood(a, explosion) {
      if (this.env && this.env.options && this.env.options.blood === false) return;
      this.fx.push({ kind: 'hitkrew', x: a.x + AW.random(-6, 6), y: a.y - 50 - AW.random(0, 20), t: 0, life: 0.5, depthY: a.y + 1 });
      if (AW.rng.chance(0.5) || explosion) this.fx.push({ kind: 'krew' + AW.random(3), x: a.x + AW.random(-10, 10), y: a.y + AW.random(-4, 4), t: 0, life: 40, ground: true });
    }
    impact(x, y) {
      this.fx.push({ kind: 'flash', x, y, t: 0, life: 0.25, add: true });
      if (AW.rng.chance(0.5)) this.playSound('impacts/ricochet' + AW.random(3), x, y, 60);
    }
    muzzle(a, tx, ty) {
      this.fx.push({ kind: 'tracer', x: a.x, y: a.y - 58, tx, ty: ty - 45, t: 0, life: 0.09 });
    }
    explosionFx(x, y, kind) {
      this.fx.push({ kind: kind === 'smoke' ? 'grdym3' : 'granat1', x, y: y - 10, t: 0, life: kind === 'smoke' ? 6 : 1.2, add: kind !== 'smoke', depthY: y + 30 });
      this.fx.push({ kind: 'dymziemia', x, y, t: 0, life: 1.6, add: true, depthY: y + 30 });
    }
    smokeCloud(x, y, area) {
      for (let i = 0; i < 6; i++) this.fx.push({ kind: 'grdym3', x: x + AW.random(-50, 50), y: y + AW.random(-20, 20), t: -i * 0.2, life: 8, depthY: y + 40 });
      for (const a of this.actors) if (!a.dead && AW.isoDistM(a.x, a.y, x, y) < (area || 3) + 1) a.misAim = 8;
    }
    painSound(a) {
      if (a.team === 1) this.playSound('hero/heropain' + AW.pick3(['1', '23', '3', '4', '5', '6', '7']), a.x, a.y, 90);
      else if (a.enemy === 3 || a.enemy === 2) this.playSound('enemies/enemy1/enemypain' + AW.random(5), a.x, a.y, 90);
    }

    setFight(a, v) {
      if (!a) return;
      if (v && a.isHero && this.isSafe(a) && !this.inCombat()) return;
      if (a.fight === v) return;
      a.fight = v;
      if (!a.path && !a.attack && !a.dead) a.idle();
    }

    heroDeath() {
      this.ev('heroDied', !/^A03/.test(this.levelId));
    }

    continueAfterDeath() {
      const from = this.levelId;
      for (const m of this.teamEquip()) {
        if (!m) continue;
        m.dead = false;
        m.hp = Math.max(1, Math.floor(m.hpMax / 2));
        m.stamina = C.STAMINA_MAX;
        m.visible = false;
        m.seq.reset();
        m.stopWalk();
        m.attack = null;
        m.fight = 0;
        m.anim.name = '';
      }
      this.deathPending = false;
      this.state.deathFrom = from;
      this.requestLevel('A_Death', { from });
    }

    backFromTheDead(level) {
      for (const m of this.teamEquip()) {
        if (!m) continue;
        m.visible = true;
        m.dead = false;
        if (m !== this.hero) m.ai = AW.AI.create(m, 'companion', []);
      }
      this.requestLevel(level || 'A02_CafeRene');
    }

    killActor(a, from, silent, opts) {
      if (a.dead) return;
      const S = AW.Scripts && AW.Scripts[this.levelId];
      if (a.script === 'TajniakZTajemnica' && !a.dying) {
        a.dying = true;
        a.dead = true;
        a.hp = 0;
        a.path = null;
        a.attack = null;
        a.ai = null;
        a.seq.reset();
        a.dlg = 'agentkosciol';
        a.icon = 'Talk';
        a.fixedAmb = 'tajniaklastamb';
        a.setAnim('death2', { loop: false, hold: true, onEnd: () => { a.setAnim('tajniaklastamb', { loop: true }); } });
        this.playSound('enemies/enemy1/enemydead1', a.x, a.y, 100);
        if (from && from.team === 1) this.awardKill(a, from);
        return;
      }
      a.dead = true;
      a.hp = 0;
      a.path = null;
      a.attack = null;
      a.say = null;
      a.seq.reset();
      const o = opts || {};
      const anim = a.isHero || a.team === 1 ? 'death' + AW.random(2, 4) : 'death' + AW.random(2, 4);
      a.corpseAnim = anim;
      a.setAnim(anim, { loop: false, hold: true });
      if (a === this.taunter) this.taunter = null;
      if (a.team === 1) this.playSound(a === this.hero ? 'hero/herodead' + AW.random(2) : 'hero/herodead1', a.x, a.y, 100);
      else if (a.enemy === 3 || a.enemy === 2) this.playSound('enemies/enemy1/enemydead' + AW.random(3), a.x, a.y, 100);
      this.fx.push({ kind: 'death', x: a.x, y: a.y - 100, t: 0, life: 1.2, add: true });
      if (a.team !== 1) {
        this.state.kills++;
        this.dropLoot(a);
        if (from && from.team === 1) this.awardKill(a, from);
      }
      if (a.team === 1 && a !== this.hero) { a.downT = 0; a.ai = null; this.message(a.name + ' ранен и упал', 'red'); }
      if (S && S.onDeath) S.onDeath(this, a, from);
    }

    awardKill(victim, killer) {
      const exp = AW.Combat.killXp(victim);
      const team = [this.hero].concat(this.teamMembers().filter(m => !m.dead));
      const each = Math.floor(exp / team.length);
      for (const m of team) {
        const n = m === killer ? each + Math.floor(exp * 0.4) : each;
        m.addXp(n);
        this.floatText(m, 'Опыт: +' + n, '#60ff60');
      }
    }

    dropLoot(a) {
      if (a.lootDropped) return;
      a.lootDropped = true;
      const luck = this.hero ? this.hero.stat('lck') : 6;
      const items = [];
      for (const s of a.loot || []) {
        const m = String(s).match(/^(\d+):(.*)$/);
        const p = m ? parseInt(m[1], 10) : 50;
        const ref = m ? m[2] : s;
        if (AW.random(100) < p + (luck - 7) * 2 + AW.random(2) - 1 && AW.random(100) < 62 + luck) {
          const it = I.create(ref);
          if (it) items.push(it);
        }
      }
      a.inv.belt = [null, null, null, null, null, null, null];
      a.inv.hand = null;
      for (const it of items) this.dropItemAt(it, a.x + AW.random(-24, 24), a.y + AW.random(-12, 12));
    }

    dropItemAt(item, x, y) {
      const p = this.walk ? this.walk.nearestWalkable(x, y, 6) || [x, y] : [x, y];
      this.ground.push({ item, x: p[0], y: p[1], uid: item.uid });
    }

    onLevelUp(a) {
      this.message(a.name + ': Новый уровень', 'green');
      this.playSound(a === this.hero ? 'menu/level' : 'menu/experience', a.x, a.y, 90);
      if (a === this.hero) this.ev('levelUp', a);
    }

    addExp(n) {
      const team = [this.hero].concat(this.teamMembers().filter(m => !m.dead));
      const each = Math.floor(n / team.length);
      const rest = n - each * team.length;
      for (let i = 0; i < team.length; i++) {
        const v = each + (i === 0 ? rest : 0);
        if (v > 0) { team[i].addXp(v); this.floatText(team[i], 'Опыт: +' + v, '#60ff60'); }
      }
    }

    flag(k) { return this.state.flags[k]; }
    setFlag(k, v) { this.state.flags[k] = v === undefined ? 1 : v; }
    hasNote(id) { return this.state.notes.some(n => n.id === id); }
    addNote(id) {
      if (!id || this.hasNote(id)) return;
      this.state.notes.push({ id, t: Math.floor(this.state.playTime) });
      if (this.hero) this.floatText(this.hero, 'Я это записал.', '#d1d1e6');
      this.playSound('menu/page-write', this.hero ? this.hero.x : 0, this.hero ? this.hero.y : 0, 80);
      this.ev('note', id);
      const S = AW.Scripts && AW.Scripts.onNote;
      if (S) S(this, id);
    }
    questKey(id) { return String(id || '').replace(/^q/, '').replace(/\d+$/, ''); }
    questStart(id) {
      const k = this.questKey(id);
      if (this.state.quests[k] === 'done' || this.state.quests[k] === 'active') return;
      this.state.quests[k] = 'active';
      this.ev('quest', k, 'active');
    }
    questDone(id) {
      const k = this.questKey(id);
      if (this.state.quests[k] === 'done') return;
      this.state.quests[k] = 'done';
      this.ev('quest', k, 'done');
    }
    questState(id) { return this.state.quests[this.questKey(id)] || 'inactive'; }

    dialogState(name) {
      const k = String(name).toLowerCase();
      if (!this.state.dialogs[k]) this.state.dialogs[k] = { start: '', counts: {} };
      return this.state.dialogs[k];
    }
    setDialogStart(node, name) {
      const dname = name ? String(name).toLowerCase() : (this.dialog ? this.dialog.name : this.lastDialog || '');
      if (!dname) return;
      this.dialogState(dname).start = node;
    }

    runPlay(src) {
      if (!src) return;
      const h = this.hero;
      if (!h) return;
      h.seq.play(src);
    }

    heroPlay(src) {
      const h = this.hero;
      if (!h || !src) return;
      h.seq.reset();
      h.seq.play(src);
    }

    interact(t, mode) {
      const h = this.hero;
      if (!h || h.dead || this.cutscene || this.dialog || !t) return;
      h.seq.reset();
      h.stopWalk();
      h.attack = null;
      const S = AW.Scripts && AW.Scripts[this.levelId];
      const hooks = S && (t.kind === 'area' ? S.areas : S.humans);
      const hook = hooks && hooks[t.id];
      const use = mode === 2 && t.dlg;
      h.seq.play('WT:' + t.id + (t.kind === 'human' ? ',70' : '') + '|W');
      h.seq.run(() => {
        if (t.kind === 'area') t.looked = 1;
        if (t.kind === 'human' && t.visible && !t.dead && t !== h) h.face(t.x, t.y);
        if (hook && hook.left && !use) hook.left(this, t);
        if (hook && hook.def && !use) { hook.def(this, t); return; }
        if (!use) { this.describe(t); return; }
        if (hook && hook.use) { hook.use(this, t); return; }
        this.useTarget(t);
      });
    }

    describe(t) {
      const h = this.hero;
      const d = String(t.desc || '');
      if (d.indexOf('PLAY:') === 0) {
        if (/LEV:/.test(d) && h.fight) return;
        h.seq.play(d.slice(5).replace(/OBJECT/g, t.id));
        return;
      }
      if (!d.trim()) return;
      const txt = AW.areaText ? AW.areaText(this.levelId, t, 'desc', d) : d;
      const ov = AW.AREA_TEXT && AW.AREA_TEXT[this.levelId] && AW.AREA_TEXT[this.levelId][t.id];
      h.seq.sayRaw(txt, txt === d || (ov && ov.force) ? (t.voice || '') : '');
    }

    useTarget(t) {
      const h = this.hero;
      const d = String(t.dlg || '');
      if (d.indexOf('PLAY:') === 0) {
        if (/LEV:/.test(d) && h.fight) return;
        h.seq.play(d.slice(5).replace(/OBJECT/g, t.id));
        return;
      }
      if (h.fight) return;
      this.dialogNpc = t.kind === 'human' ? t : null;
      this.openDialog(d, this.dialogNpc);
    }

    openBox(box) {
      if (!box || box.boxOpened) return;
      box.boxOpened = true;
      this.playSound('item/box-open', box.x, box.y, 90);
      this.dropLoot(box);
    }

    departure() {
      this.ev('departure');
    }

    call(name, args, seq) {
      const S = AW.Scripts || {};
      const lv = S[this.levelId];
      const fn = (lv && lv.fns && lv.fns[name]) || (S.fns && S.fns[name]);
      if (fn) return fn(this, args || [], seq);
      if (this.onScriptError) this.onScriptError(new Error('no fn ' + name), name);
      return null;
    }

    openDialog(name, npc) {
      const d = new AW.Dialog(this, name, npc && npc.kind === 'human' ? npc : this.dialogNpc || null);
      if (!d.valid()) return false;
      this.dialog = d;
      const target = d.npc;
      if (target && target !== this.hero) {
        target.savedAi = target.ai;
        target.ai = AW.AI.create(target, 'interlocutor', []);
        target.stopWalk();
        target.face(this.hero.x, this.hero.y);
      }
      if (this.hero) { this.hero.stopWalk(); this.hero.ai = null; }
      d.onClose = () => {
        this.lastDialog = d.name;
        if (this.dialog === d) this.dialog = null;
        if (target && target !== this.hero && target.ai && target.ai instanceof AW.AI.Interlocutor) target.ai = target.savedAi || null;
        this.ev('dialogClosed', d);
      };
      d.start();
      if (!d.closed) this.ev('dialog', d);
      return true;
    }

    openTrade(npc) {
      if (!npc) return;
      if (this.dialog) this.dialog.close();
      this.tradeWith = npc;
      if (!npc.tradeStock) {
        npc.tradeStock = true;
        npc.inv = new I.Inventory(9);
        for (const it of I.rollKit(I.RENE_KIT, this.hero ? this.hero.stat('lck') : 6)) npc.inv.add(it);
        npc.inv.changeCash(3000);
      }
      this.ev('trade', npc);
    }
    closeTrade() { this.tradeWith = null; this.ev('tradeClosed'); }

    requestLevel(id, opts) {
      if (/^(B|AKT2)/.test(String(id))) { this.ev('actEnd', 1); return; }
      if (this.hero && this.levelId && this.level && !/^(StoryRoom|A_Death|AKT1)$/.test(this.levelId)) {
        const marks = this.state.mapMarks || (this.state.mapMarks = {});
        const list = marks[this.levelId] || (marks[this.levelId] = []);
        const p = [Math.round(this.hero.x), Math.round(this.hero.y)];
        if (!list.some(q => Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) < 80)) list.push(p);
      }
      this.pendingLevel = { id, opts: opts || {} };
    }

    async changeLevel(id, opts) {
      this.ev('beforeLevel', id);
      if (id === 'A_Death' || id === 'AKT1' || id === 'StoryRoom') this.hero && (this.hero.visible = false);
      await this.loadLevel(id, opts || {});
    }

    openDoor(name) {
      const ar = this.area('a' + name);
      const wm = this.area('a' + name + 'WM');
      const g = this.gfxObj('g' + name);
      if (wm && this.walk) {
        this.walk.fillPoly(wm.poly, 1);
        this.walkMods = this.walkMods || [];
        this.walkMods.push({ area: wm.id, val: 1 });
      }
      if (ar) ar.active = 0;
      if (g) g.visible = false;
      this.setFlag('open_' + name, 1);
    }

    createItem(actor, ref, drop) {
      const a = actor && actor.kind === 'human' ? actor : this.hero;
      const it = I.create(ref);
      if (!it) return null;
      if (drop) this.dropItemAt(it, a.x, a.y);
      else if (!a.inv.add(it)) {
        this.dropItemAt(it, a.x, a.y);
        this.message('Не помещается в рюкзак: ' + I.displayName(it) + ' лежит на земле', 'yellow');
      } else this.message('Получено: ' + I.displayName(it), 'green');
      if (it.snd.pick) this.playSound(it.snd.pick, a.x, a.y, 80);
      return it;
    }

    giveItem(a, ref) { return this.createItem(a, ref, false); }

    deleteItem(actor, name) {
      const list = [this.hero].concat(this.teamMembers());
      for (const a of list) {
        const it = a.inv.findByName(name);
        if (it) { a.inv.remove(it); return true; }
      }
      return false;
    }

    dropItem(actor, name) {
      const a = actor && actor.kind === 'human' ? actor : this.hero;
      const it = a.inv.findByName(name);
      if (!it) return;
      a.inv.remove(it);
      this.dropItemAt(it, a.x, a.y);
    }

    cash(actor, n) {
      const a = this.hero;
      a.inv.changeCash(n);
      this.playSound(n > 0 ? 'item/coin-take' : 'item/coin-putoff', a.x, a.y, 80);
      this.floatText(a, (n > 0 ? '+' : '') + n + ' фр.', n > 0 ? '#ffe070' : '#ff9070');
    }

    healActor(actor, n) {
      const a = actor && actor.kind === 'human' ? actor : this.hero;
      const before = a.hp;
      a.heal(n);
      a.stamina = C.STAMINA_MAX;
      const d = a.hp - before;
      if (d > 0) this.floatText(a, 'Здоровье: +' + d, '#60ff60');
    }

    hitActor(actor, n) {
      const a = actor && actor.kind === 'human' ? actor : this.hero;
      a.hp -= n;
      this.floatText(a, 'Здоровье: -' + n, '#ff4040');
      if (a.hp <= 0) { a.hp = 1; }
    }

    setVisible(a, v) {
      if (!a) return;
      a.visible = !!v;
      if (a.kind === 'human' && v && !a.anim.name) a.idle();
    }

    setAI(a, type, args) {
      if (!a || a.kind !== 'human') return;
      a.ai = AW.AI.create(a, type, args || []);
    }

    addSkill(a, key) {
      const h = a && a.kind === 'human' ? a : this.hero;
      const lv = h.skills[key] || 0;
      if (lv >= 4) { this.addExp(1000); return; }
      h.skills[key] = lv + 1;
      this.message('Навык: ' + (AW.Rules.SKILLS[key] ? AW.Rules.SKILLS[key].name : key) + ' ' + h.skills[key], 'green');
    }

    stashItems(a) {
      const h = this.hero;
      if (!h || this.state.flags.stash) return;
      this.state.flags.stash = 1;
      this.state.stash = { inv: h.inv.serialize() };
      h.inv = new I.Inventory(h.inv.rows);
      h.fight = 0;
    }

    restoreItems(a) {
      const h = this.hero;
      if (!h || !this.state.stash) return;
      const old = I.Inventory.load(this.state.stash.inv);
      for (const it of old.all()) if (!h.inv.add(it)) this.dropItemAt(it, h.x, h.y);
      this.state.stash = null;
      this.message('Мои вещи нашлись', 'green');
    }

    gfxAnim(target, mode) {
      if (!target) return;
      const m = String(mode || '').replace(/^Ac\./i, '');
      const tab = { None: [0, 0], Full: [1, 1], OnlySeq: [0, 0], NoAI: [1, 1], NoDraw: [1, 0], OnlyDraw: [0, 1], SeqDraw: [0, 1], UpdSeq: [1, 0] }[m];
      if (!tab) return;
      target.visible = !!tab[1];
      target.playing = !!tab[0] && target.visible;
    }

    control(v) {
      this.controlState = v;
      this.cutscene = v !== 1;
      this.ev('control', v);
    }

    guardTrigger(a) {
      const S = AW.Scripts && AW.Scripts[this.levelId];
      if (S && S.guards && S.guards[a.id]) S.guards[a.id](this, a);
    }

    popup(name, sec, cb) { if (this.env && this.env.popup) this.env.popup(name, sec, cb); else this.later(sec, cb); }
    fade(dir, t) { this.ev('fade', dir, t); }

    lookupSay(key) {
      const k = String(key || '');
      if (k.startsWith('__')) return { text: (AW.TEXT && AW.TEXT[k.slice(2)]) || k.slice(2), voice: '' };
      if (k.startsWith('_')) {
        const name = k.slice(1);
        const text = (AW.TEXT && AW.TEXT[name]) || name;
        return { text, voice: name.toLowerCase() };
      }
      return { text: k, voice: '' };
    }

    useHealth(a, it) {
      const h = a;
      const heal = h.skills.heal || 0;
      let consumed = true;
      if (/^medkit/.test(it.name)) {
        let p = h.hpMax - h.hp;
        p = p - Math.floor(p * 0.2 * heal);
        if (p < it.amount) { it.amount = Math.floor(it.amount - p); h.hp = h.hpMax; consumed = false; }
        else { h.heal(it.amount + Math.floor(it.amount * 0.2 * heal)); it.amount = 0; }
        h.stamina = C.STAMINA_MAX;
      } else if (it.name === 'tools' || it.name === 'weaponkit') {
        const w = h.weapon();
        if (!w || !w.maxdur || (w.dur >= w.maxdur && !w.jammed) || w.dur <= 1) { this.message('Чинить нечего', ''); return false; }
        const lv = h.skills.repair || 0;
        const amount = it.amount + Math.floor(it.amount * 0.2 * lv);
        if (it.name === 'tools') { w.jammed = 0; w.dur = Math.min(w.maxdur, w.dur + amount); }
        else {
          const need = w.maxdur - w.dur;
          w.jammed = 0;
          const cost = need - Math.floor(need * 0.2 * lv);
          if (it.amount > cost) { w.dur = w.maxdur; it.amount -= cost; consumed = false; }
          else { w.dur += Math.floor(need * (it.amount / Math.max(1, cost))); it.amount = 0; }
        }
        this.fx.push({ kind: 'pck-weapon', x: h.x, y: h.y - 80, t: 0, life: 1, add: true, follow: h });
      } else {
        let amount = it.amount + Math.floor(it.amount * 0.2 * heal);
        if (amount < 0) h.hp = Math.max(1, h.hp + amount);
        else { h.heal(amount); h.stamina = C.STAMINA_MAX; }
        this.floatText(h, amount >= 0 ? 'Здоровье: +' + amount : 'Здоровье: ' + amount, amount >= 0 ? '#60ff60' : '#ff4040');
      }
      for (const b of I.buffs(it)) h.buffs.push({ stat: b.stat, v: b.v, t: b.t });
      if (I.buffs(it).length) this.message(h.name + ' чувствует, как по жилам разливается тепло', '');
      if (it.snd.use) this.playSound(it.snd.use, h.x, h.y, 80);
      if (!/^(tools|weaponkit)$/.test(it.name)) this.fx.push({ kind: 'pck', x: h.x, y: h.y - 90, t: 0, life: 1, add: true, follow: h });
      if (consumed) h.inv.remove(it);
      if (h === this.hero) this.message('Использовано: ' + I.displayName(it), '');
      return true;
    }

    teamEquip() { return [this.hero].concat(this.teamMembers()); }

    serialize() {
      if (this.level) this.saveLevelState();
      const team = this.teamMembers().map(a => a.serialize());
      return {
        v: 2, level: this.levelId, state: this.state, hero: this.hero.serialize(), team,
        heroPos: [Math.round(this.hero.x), Math.round(this.hero.y)], time: this.time
      };
    }

    async deserialize(s) {
      if (!(s.v >= 2)) I.fixV1Weights(s);
      this.state = s.state;
      this.hero = this.restoreActor(s.hero);
      this.hero.ai = null;
      this.actors = [this.hero];
      for (const t of s.team || []) {
        const a = this.restoreActor(t);
        a.ai = AW.AI.create(a, 'companion', []);
        this.actors.push(a);
      }
      this.levelId = '';
      this.level = null;
      const lv = s.level;
      const saved = this.state.levels[lv];
      if (saved) saved.keepAll = false;
      await this.loadLevel(lv, { from: '', at: s.heroPos, restoring: true });
      this.time = s.time || 0;
    }
  };

  AW.pick3 = function (arr) { return arr[Math.floor(AW.rng.next() * arr.length)]; };

  AW.Actor.prototype.onAttacked = function (from) {
    this.alert = 1;
    if (this.ai && this.ai.onAttacked) this.ai.onAttacked(from);
  };
})(globalThis.AW = globalThis.AW || {});
