(function (AW) {
  'use strict';

  const R = AW.Rules;
  const DIRS = AW.DIRS;

  const COLORS = { hero: '#f9f996', johann: '#d1d1e6', other: '#fffbe7' };

  AW.Actor = class {
    constructor(world, def) {
      this.world = world;
      this.kind = 'human';
      this.id = def.id;
      this.tml = def.tml || '';
      this.name = def.name || def.id;
      this.desc = def.desc || '';
      this.dlg = def.dlg || '';
      this.icon = def.icon || 'Talk';
      this.x = def.x || 0;
      this.y = def.y || 0;
      this.dir = def.dir !== undefined ? def.dir : AW.angToDir(def.ang || 0);
      this.visible = def.visible !== undefined ? !!def.visible : true;
      this.enemy = def.enemy || 0;
      this.team = def.team || 0;
      this.cls = def.cls || '';
      this.level = def.level || 1;
      this.xp = def.xp || 0;
      this.points = def.points || 0;
      this.base = Object.assign({ str: 5, agi: 5, int: 5, end: 5, cha: 5, spd: 5, lck: 5 }, def.base || {});
      this.acBase = def.acBase !== undefined ? def.acBase : 0;
      this.toroll = def.toroll || 0;
      this.tohit = def.tohit || 0;
      this.tomiss = def.tomiss || 0;
      this.hpMax = def.hpMax || 20;
      this.hp = def.hp !== undefined ? def.hp : this.hpMax;
      this.stamina = AW.C.STAMINA_MAX;
      this.skills = Object.assign({}, def.skills || {});
      this.sp = Object.assign({}, def.sp || {});
      this.spCharge = Object.assign({}, def.spCharge || {});
      this.spSel = def.spSel || '';
      this.spArmed = null;
      this.buffs = [];
      this.looks = Object.assign({ head: '', torso: '', legs: '' }, def.looks || {});
      this.ambients = def.ambients || [[100, 'ambient1']];
      this.fixedAmb = def.fixedAmb || '';
      this.wambient = def.wambient || 0;
      this.inv = def.inv || new AW.Items.Inventory(def.packsize || 5);
      this.fight = 0;
      this.wmode = 0;
      this.dead = !!def.dead;
      this.corpseAnim = def.corpseAnim || '';
      this.path = null;
      this.pathGoal = null;
      this.onArrive = null;
      this.anim = { name: '', wc: 'empty', t: 0, frame: 0, loop: true, count: 1, onEnd: null, rev: false };
      this.say = null;
      this.seq = new AW.Seq(world, this);
      this.ai = null;
      this.aiPaused = 0;
      this.stun = 0;
      this.hitFlash = 0;
      this.cooldown = 0;
      this.alert = 0;
      this.target = null;
      this.lazyTarget = null;
      this.noHit = 0;
      this.chaos = 0;
      this.panic = 0;
      this.misAim = 0;
      this.taunt = 0;
      this.stealth = 0;
      this.officer = 0;
      this.leczenie = 0;
      this.regenT = 60;
      this.follow = def.follow || null;
      this.followDist = def.followDist || 60;
      this.radius = 14;
      this.color = def.color || (def.id === 'Hero' ? COLORS.hero : def.id === 'Johann' ? COLORS.johann : COLORS.other);
      this.voiceScheme = def.voiceScheme || '';
      this.flags = def.flags || {};
      this.lootDropped = !!def.lootDropped;
      this.spawnZone = def.spawnZone || '';
      this.loot = def.loot || null;
      this.blindWalk = def.blindWalk || '';
      this.sitting = !!def.sitting;
      this.idleT = 0;
    }

    get isHero() { return this === this.world.hero; }
    get alive() { return !this.dead; }

    stat(s) {
      let v = this.base[s] || 0;
      for (const it of this.equipped()) for (const [k, n] of AW.Items.effects(it)) if (k === s) v += n;
      for (const b of this.buffs) if (b.stat === s) v += b.v;
      if (s === 'cha' && this.skills.drinker) v += this.skills.drinker * 2;
      if (s === 'spd') v = Math.min(12, v);
      return v;
    }

    equipped() {
      const out = [];
      for (const k of Object.keys(this.inv.wear)) if (this.inv.wear[k]) out.push(this.inv.wear[k]);
      if (this.inv.hand && AW.Items.isWeapon(this.inv.hand)) out.push(this.inv.hand);
      return out;
    }

    bonus(key) {
      let v = 0;
      for (const it of this.equipped()) for (const [k, n] of AW.Items.effects(it)) if (k === key) v += n;
      return v;
    }

    leaderLevel() {
      const h = this.world.hero;
      return this.team === 1 && h && h !== this ? (h.skills.leader || 0) : 0;
    }

    ac() {
      let v = R.acBase(this.stat('agi'), this.level) + this.acBase + this.bonus('ac') + this.leaderLevel() * 2;
      if (this.skills.tough) v += 1 + this.skills.tough;
      return v;
    }

    toRoll() { return this.toroll + this.bonus('toroll') + this.leaderLevel(); }
    toHit() { return this.tohit + this.bonus('tohit') + (this.officer > 0 ? 3 : 0); }
    toMiss() { return this.tomiss + this.bonus('tomiss'); }
    dmgBonus() { return this.bonus('dmg') + (this.officer > 0 ? 3 : 0); }

    maxWeight() { return 12 * this.stat('str'); }
    overweight() { return this.inv.weight() > this.maxWeight(); }

    weapon() { return this.inv.hand && AW.Items.isWeapon(this.inv.hand) ? this.inv.hand : null; }

    wclass() {
      const w = this.weapon();
      if (!w) return 'EMPTY';
      return AW.Items.wclass(w);
    }

    armedLook() {
      if (this.isHero || this.team === 1) return this.fight === 1;
      return this.fight === 1 || this.wambient === 1;
    }

    gfxClass() {
      if (!this.armedLook()) {
        const w = this.inv.hand;
        if (w && AW.Items.wclass(w) === 'MUG') return 'mug';
        return 'empty';
      }
      return AW.Items.gfxClass(this.wclass());
    }

    weaponSkin() {
      const w = this.inv.hand;
      if (!w) return '';
      if (!this.armedLook() && AW.Items.wclass(w) !== 'MUG') return '';
      return AW.Items.WEAPON_GFX[w.name] || '';
    }

    lookSkins() {
      const l = Object.assign({}, this.looks);
      const wear = this.inv.wear;
      const nor = function (it) { return it && it.wearNOR && !/^\s*--/.test(it.wearNOR) ? it.wearNOR.trim() : ''; };
      if (nor(wear.helm)) l.head = nor(wear.helm);
      if (nor(wear.torso)) l.torso = nor(wear.torso);
      if (nor(wear.pants)) l.legs = nor(wear.pants);
      return l;
    }

    sheetFor(anim, wc, part, skin) {
      if (!skin) return null;
      const key = anim + '_' + wc + '_' + part + '_' + skin;
      const s = AW.Data.sheet(key);
      return s ? { key, s } : null;
    }

    resolveAnim(name) {
      let a = String(name || 'ambient1').toLowerCase();
      if (a === 'ambient') a = this.pickAmbient();
      if (a === 'ambient_talk') a = 'talk1';
      if (a === 'sit') a = 'sambient1';
      if (a === 'sit_down') a = 'sdown';
      if (a === 'sit_up') a = 'sup';
      let wc = this.gfxClass();
      const armed = this.armedLook() && wc !== 'empty' && wc !== 'mug';
      if (this.fight === 1 && (a === 'ambient1' || a === 'ambient2' || a === 'ambient3' || a === 'ambientlook')) a = 'aim';
      if (this.fight === 1 && a === 'walk') a = 'bwalk';
      if (a === 'aim' && armed && wc !== 'knife' && (this.nearestEnemyDist() < AW.C.HCLOSE || !this.weaponReady())) a = 'caim';
      if ((wc === 'empty' || wc === 'knife') && a === 'cfire1') a = 'fire1';
      if (a.indexOf('death') === 0 || a === 'confuse' || a === 'panic' || a === 'drink1' || a === 'sdown' || a === 'sup' || a === 'hang' || a === 'laid' || a === 'blindwalk') {
        if (!this.hasAnim(a, wc)) wc = 'empty';
      }
      if (!this.hasAnim(a, wc)) {
        if (this.hasAnim(a, 'empty')) wc = 'empty';
        else if (a === 'bwalk') a = 'walk';
        else if (a === 'caim') a = 'aim';
      }
      if (!this.hasAnim(a, wc) && !this.hasAnim(a, 'empty')) {
        if (a.indexOf('talk') === 0 || a.indexOf('ambient') === 0 || a === 'stalk1' || a === 'sdrink') a = this.hasAnim('sambient1', wc) && this.sitting ? 'sambient1' : 'ambient1';
        if (!this.hasAnim(a, wc)) wc = 'empty';
      }
      return { a, wc };
    }

    hasAnim(a, wc) {
      const l = this.lookSkins();
      return !!(this.sheetFor(a, wc, 'torso', l.torso) || this.sheetFor(a, wc, 'legs', l.legs) || this.sheetFor(a, wc, 'head', l.head));
    }

    animFrames(a, wc) {
      const l = this.lookSkins();
      const dir = DIRS[this.dir];
      let best = 0, fps = 15;
      for (const part of ['legs', 'torso', 'head']) {
        const sh = this.sheetFor(a, wc, part, l[part]);
        if (sh && sh.s.d[dir]) { best = Math.max(best, sh.s.d[dir].length); fps = sh.s.fps || fps; }
      }
      const inf = AW.Data.anims && AW.Data.anims.inf;
      if (inf) {
        const e = inf[(a + '_' + wc).toLowerCase()] || inf[a.toLowerCase()];
        if (e && e.fps) fps = e.fps;
      }
      return { n: best || 1, fps: fps || 15 };
    }

    setAnim(name, opts) {
      const o = opts || {};
      const r = this.resolveAnim(name);
      const same = this.anim.name === r.a && this.anim.wc === r.wc;
      if (same && o.keep) return;
      const fr = this.animFrames(r.a, r.wc);
      this.anim = {
        name: r.a, wc: r.wc, t: same && o.keep ? this.anim.t : 0, frame: 0, n: fr.n, fps: fr.fps * (o.speed || 1),
        loop: o.loop !== undefined ? o.loop : true, count: o.count || 1, onEnd: o.onEnd || null, hold: !!o.hold, req: name
      };
    }

    pickAmbient() {
      if (this.fixedAmb) return this.fixedAmb;
      const list = this.ambients && this.ambients.length ? this.ambients : [[100, 'ambient1']];
      const total = list.reduce((a, e) => a + e[0], 0);
      let r = AW.rng.next() * total;
      for (const e of list) { r -= e[0]; if (r <= 0) return e[1]; }
      return list[0][1];
    }

    idle() {
      if (this.dead) return;
      const amb = this.fixedAmb || (this.fight ? 'aim' : this.pickAmbient());
      this.setAnim(amb, { loop: false, onEnd: () => this.idle() });
    }

    frameInfo() {
      const a = this.anim;
      const l = this.lookSkins();
      const dir = DIRS[this.dir];
      const parts = [];
      const wskin = this.weaponSkin();
      const list = [['legs', l.legs], ['torso', l.torso], ['head', l.head], ['weapon', wskin]];
      for (const [part, skin] of list) {
        if (!skin) continue;
        let sh = this.sheetFor(a.name, a.wc, part, skin);
        if (!sh && part === 'weapon') continue;
        if (!sh) sh = this.sheetFor(a.name, 'empty', part, skin);
        if (!sh) continue;
        const frames = sh.s.d[dir];
        if (!frames || !frames.length) continue;
        const f = frames[Math.min(frames.length - 1, a.frame)];
        parts.push({ key: sh.key, sheet: sh.s, f });
      }
      const off = AW.Data.infOffset(a.name, a.wc, dir);
      return { parts, off };
    }

    updateAnim(dt) {
      const a = this.anim;
      if (!a.name) { this.idle(); return; }
      a.t += dt * a.fps;
      const f = Math.floor(a.t);
      if (f >= a.n) {
        if (a.hold) { a.frame = a.n - 1; return; }
        if (a.loop) { a.t = a.t % a.n; a.frame = Math.floor(a.t); return; }
        a.count--;
        if (a.count > 0) { a.t -= a.n; a.frame = Math.floor(a.t); return; }
        a.frame = a.n - 1;
        const cb = a.onEnd;
        a.onEnd = null;
        a.loop = true;
        a.hold = true;
        if (cb) cb();
        else if (!this.dead) this.idle();
        return;
      }
      a.frame = f;
    }

    face(x, y) {
      const dx = x - this.x, dy = y - this.y;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      this.dir = AW.dirFromVec(dx, dy);
    }

    faceDir(d) { this.dir = ((d % 8) + 8) % 8; }

    walkTo(x, y, opts) {
      const o = opts || {};
      const wm = this.world.walk;
      if (!wm) return false;
      const path = wm.findPath(this.x, this.y, x, y, { goalRadius: o.goalRadius || 30, partial: o.partial !== false });
      if (!path || !path.length) { this.path = null; if (o.onFail) o.onFail(); return false; }
      this.path = path;
      this.pathGoal = [x, y];
      this.onArrive = o.onArrive || null;
      this.onPathFail = o.onFail || null;
      this.runOverride = o.run;
      return true;
    }

    stopWalk() { this.path = null; this.onArrive = null; }

    walkSpeed() {
      let spd = AW.C.WALK_SPD * 30;
      const run = this.runOverride !== undefined ? this.runOverride : this.wmode > 0;
      if (run && !this.overweight() && this.stamina > 0) spd = spd * (2 + this.stat('spd') / 13);
      if (this.blindWalk) spd *= 0.6;
      return spd;
    }

    isRunning() {
      const run = this.runOverride !== undefined ? this.runOverride : this.wmode > 0;
      return !!this.path && run && !this.overweight() && this.stamina > 0;
    }

    updateMove(dt) {
      if (!this.path || !this.path.length) return;
      const run = this.isRunning();
      if (this.isHero && run) {
        this.stamina -= (15 - this.stat('end')) * 0.05 * 30 * dt;
        if (this.stamina < 0) this.stamina = 0;
      }
      const spd = this.walkSpeed();
      let move = spd * dt;
      while (move > 0 && this.path && this.path.length) {
        const [tx, ty] = this.path[0];
        const dx = tx - this.x, dy = ty - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 0.5) this.dir = AW.dirFromVec(dx, dy);
        if (d <= move) {
          this.x = tx; this.y = ty; move -= d;
          this.path.shift();
        } else {
          const nx = this.x + dx / d * move, ny = this.y + dy / d * move;
          const blocker = this.world.blockerAt(this, nx, ny);
          if (blocker) {
            this.blockT = (this.blockT || 0) + dt;
            if (this.blockT > 1.2) {
              this.blockT = 0;
              const g = this.pathGoal;
              if (g && !this.walkTo(g[0], g[1], { onArrive: this.onArrive, run: this.runOverride })) this.finishWalk(false);
            }
            move = 0;
            break;
          }
          this.blockT = 0;
          this.x = nx; this.y = ny; move = 0;
        }
      }
      let walkAnim = run ? 'run' : 'walk';
      if (this.blindWalk) walkAnim = this.blindWalk;
      if (this.path && this.path.length) {
        const r = this.resolveAnim(walkAnim);
        if (this.anim.name !== r.a || this.anim.wc !== r.wc) this.setAnim(walkAnim, { loop: true });
        this.world.footstep(this, run);
      } else this.finishWalk(true);
    }

    finishWalk(ok) {
      this.path = null;
      this.runOverride = undefined;
      const cb = this.onArrive;
      this.onArrive = null;
      if (this.anim.name === 'walk' || this.anim.name === 'run' || this.anim.name === 'bwalk' || this.anim.name === this.blindWalk) this.idle();
      if (cb) cb(ok);
    }

    sayText(text, opts) {
      const o = opts || {};
      const src = String(text || '');
      const variants = AW.parseSay(src).variants.length;
      const vi = variants > 1 ? Math.floor(AW.rng.next() * variants) : 0;
      const groups = AW.sayGroups(src, vi).filter(g => g.text !== '' || g.pause > 0);
      this.say = { groups, i: -1, t: 0, voice: o.voice || '', duration: o.duration || 0, onEnd: o.onEnd || null, voiceT: 0 };
      this.nextSay();
    }

    nextSay() {
      const s = this.say;
      if (!s) return;
      s.i++;
      if (s.i >= s.groups.length) {
        const cb = s.onEnd;
        this.say = null;
        if (cb) cb();
        return;
      }
      const g = s.groups[s.i];
      let len = 0;
      if (g.text) {
        len = Math.max(1.6, 0.9 + g.text.length * 0.055);
        if (s.voice) {
          const vk = g.no > 0 ? s.voice + '_' + g.no : s.voice;
          const dur = this.world.playVoice(vk, this);
          if (dur > 0) len = Math.max(dur + 0.15, 0.8);
        }
      }
      s.cur = g.text;
      s.t = len + g.pause;
    }

    updateSay(dt) {
      if (!this.say) return;
      this.say.t -= dt;
      if (this.say.t <= 0) this.nextSay();
    }

    skipSay() {
      if (!this.say) return;
      this.world.stopVoice(this);
      this.say.t = 0;
    }

    nearestEnemyDist() {
      let best = Infinity;
      for (const o of this.world.actors) {
        if (o === this || o.dead || !o.visible) continue;
        if (!this.world.hostile(this, o)) continue;
        const d = AW.isoDist(this.x, this.y, o.x, o.y);
        if (d < best) best = d;
      }
      return best;
    }

    weaponReady() {
      const w = this.weapon();
      if (!w) return true;
      const wc = AW.Items.wclass(w);
      if (wc === 'KNIFE' || wc === 'EMPTY' || wc === 'MUG') return true;
      if (w.jammed) return false;
      if (w.dur <= 1) return false;
      return !!(w.link && w.link.amount > 0);
    }

    addXp(n) {
      if (n <= 0) return;
      this.xp += n;
      let up = false;
      while (this.xp >= R.xpNext(this.level)) {
        this.level++;
        this.points++;
        this.hpMax += R.hpPerLevel(this.stat('end'), this.toRoll());
        this.hp = this.hpMax;
        this.stamina = AW.C.STAMINA_MAX;
        up = true;
      }
      if (up) this.world.onLevelUp(this);
    }

    heal(n) {
      if (this.dead) return;
      this.hp = Math.min(this.hpMax, this.hp + n);
    }

    updateTimers(dt) {
      if (this.stun > 0) this.stun -= dt;
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.cooldown > 0) this.cooldown -= dt;
      for (const k of ['noHit', 'chaos', 'panic', 'misAim', 'taunt', 'stealth', 'officer']) if (this[k] > 0) this[k] = Math.max(0, this[k] - dt);
      if (this.buffs.length) {
        for (const b of this.buffs) b.t -= dt;
        this.buffs = this.buffs.filter(b => b.t > 0);
      }
      if (this.team === 1 && !this.dead) {
        if (!this.isRunning()) this.stamina = Math.min(AW.C.STAMINA_MAX, this.stamina + dt * (3 + this.stat('end') * 0.6));
        this.regenT -= dt;
        if (this.regenT <= 0) { this.regenT = 60; this.heal(1); }
        if (this.skills.heal) {
          this.leczenie -= dt;
          if (this.leczenie <= 0) { this.leczenie = Math.max(2, 10 - 2 * this.skills.heal); this.heal(1); }
        }
        if (this.skills.repair && this.weapon()) {
          this.naprawa = (this.naprawa || 0) - dt;
          const w = this.weapon();
          if (this.naprawa <= 0) {
            this.naprawa = Math.max(2, 10 - 2 * this.skills.repair);
            if (w.maxdur && w.dur < w.maxdur) w.dur++;
          }
        }
      }
      if (this.isHero || this.team === 1) this.updateSpecials(dt);
    }

    updateSpecials(dt) {
      if (!this.cls) return;
      for (const s of R.SPECIALS[this.cls] || []) {
        const lv = this.sp[s.id] || 0;
        if (!lv) continue;
        if (this.spCharge[s.id] === undefined) this.spCharge[s.id] = 100;
        if (this.spCharge[s.id] < 100) {
          const time = Math.max(30, s.time - lv * 15 - (this.stat('spd') - 7) * 5);
          this.spCharge[s.id] = Math.min(100, this.spCharge[s.id] + dt * 100 / time);
        }
      }
    }

    update(dt) {
      this.updateTimers(dt);
      this.updateSay(dt);
      if (this.dead) { this.updateAnim(dt); return; }
      this.seq.update(dt);
      if (this.stun > 0) {
        this.path = null;
        if (!this.knocked && this.anim.name !== 'confuse') this.setAnim('confuse', { loop: true });
        this.updateAnim(dt);
        return;
      }
      if (this.ai && !this.aiPaused && !this.seq.busy()) this.ai.update(dt);
      this.updateMove(dt);
      this.updateAnim(dt);
    }

    serialize() {
      return {
        id: this.id, tml: this.tml, name: this.name, desc: this.desc, dlg: this.dlg, icon: this.icon, x: Math.round(this.x), y: Math.round(this.y), dir: this.dir,
        visible: this.visible, enemy: this.enemy, team: this.team, cls: this.cls, level: this.level, xp: this.xp, points: this.points,
        base: this.base, acBase: this.acBase, toroll: this.toroll, tohit: this.tohit, tomiss: this.tomiss, hpMax: this.hpMax, hp: this.hp,
        skills: this.skills, sp: this.sp, spCharge: this.spCharge, spSel: this.spSel, looks: this.looks, ambients: this.ambients,
        fixedAmb: this.fixedAmb, wambient: this.wambient, inv: this.inv.serialize(), dead: this.dead, corpseAnim: this.corpseAnim,
        followDist: this.followDist, voiceScheme: this.voiceScheme, flags: this.flags, lootDropped: this.lootDropped, blindWalk: this.blindWalk,
        sitting: this.sitting, fight: this.fight, wmode: this.wmode
      };
    }
  };
})(globalThis.AW = globalThis.AW || {});
