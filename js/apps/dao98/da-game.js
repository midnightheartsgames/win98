(function (D) {
  'use strict';
  const { clamp, dist, RNG } = D;
  const DEFERRED = new Set(['run', 'fight', 'hostile', 'shop', 'goto', 'party', 'rest']);
  const INV_CAP = 80;

  class Game {
    constructor(opt) {
      opt = opt || {};
      this.seed = opt.seed || (Date.now() & 0xffffff);
      this.rng = new RNG(this.seed);
      this.headless = !!opt.headless;
      this.events = [];
      this.flags = {};
      this.quests = {};
      this.questLog = [];
      this.codex = {};
      this.codexNew = {};
      this.inv = [];
      this.gold = 0;
      this.party = [];
      this.roster = {};
      this.pc = null;
      this.leader = null;
      this.areaId = null;
      this.L = null;
      this.ents = [];
      this.objs = [];
      this.areaState = {};
      this.time = 0;
      this.playTime = 0;
      this.paused = false;
      this.mode = 'play';
      this.dialog = null;
      this.coros = [];
      this.cutDepth = 0;
      this.combat = false;
      this.difficulty = opt.difficulty || 'normal';
      this.auto = !!opt.auto;
      this.origin = null;
      this.projectiles = [];
      this.fields = [];
      this.traps = [];
      this.deferred = [];
      this.slides = null;
      this.shop = null;
      this.loot = null;
      this.travel = null;
      this.stats = { kills: 0, dmg: 0, crits: 0, deaths: 0 };
      this.chosen = {};
      this.holdPos = false;
      this.selected = [];
      this.stolen = {};
      this.music = null;
      this.ending = null;
    }

    emit(type, data) {
      this.events.push(Object.assign({ type }, data));
      if (this.events.length > 400) this.events.splice(0, this.events.length - 400);
    }
    toast(text, kind) { this.emit('toast', { text, kind: kind || '' }); }
    log(text, kind) { this.emit('log', { text, kind: kind || '' }); }
    sound(id, x, z) { if (!this.headless) this.emit('sound', { id, x, z }); }
    float(ent, text, col) { if (!this.headless) this.emit('float', { uid: ent.uid, text, col }); }

    lookup(name) {
      const pc = this.pc;
      const dot = name.indexOf('.');
      if (dot > 0) {
        const k = name.slice(0, dot), v = name.slice(dot + 1);
        switch (k) {
          case 'quest': return this.quests[v] || 0;
          case 'item': return this.count(v);
          case 'party': return this.party.some(c => c.key === v) ? 1 : 0;
          case 'has': return this.roster[v] ? 1 : 0;
          case 'ap': return this.roster[v] ? this.roster[v].approval : 0;
          case 'skill': return pc ? pc.skills[v] || 0 : 0;
          case 'chosen': return this.chosen[v] ? 1 : 0;
          case 'alive': return this.ents.some(e => (e.key === v || e.group === v) && !e.dead) ? 1 : 0;
          case 'here': return this.ents.some(e => e.key === v && !e.dead && !e.gone) ? 1 : 0;
          default: return 0;
        }
      }
      switch (name) {
        case 'race': return pc.race;
        case 'cls': return pc.cls;
        case 'sex': return pc.sex;
        case 'origin': return this.origin;
        case 'lvl': return pc.lvl;
        case 'gold': return this.gold;
        case 'area': return this.areaId;
        case 'diff': return this.difficulty;
        case 'combat': return this.combat ? 1 : 0;
        case 'rogue': return pc.cls === 'rogue' ? 1 : 0;
        case 'mage': return pc.cls === 'mage' ? 1 : 0;
        case 'warrior': return pc.cls === 'warrior' ? 1 : 0;
        case 'female': return pc.sex === 'f' ? 1 : 0;
        case 'male': return pc.sex === 'm' ? 1 : 0;
        case 'dwarf': return pc.race === 'dwarf' ? 1 : 0;
        case 'elf': return pc.race === 'elf' ? 1 : 0;
        case 'human': return pc.race === 'human' ? 1 : 0;
        case 'str': case 'dex': case 'wil': case 'mag': case 'cun': case 'con': return pc.stats.a[name];
        case 'lock': return this.bestLock();
        case 'persuade': return D.skillScore(pc, 'persuade');
        case 'intimidate': return D.skillScore(pc, 'intimidate');
        case 'partysize': return this.party.length;
        default: return this.flags[name] || 0;
      }
    }
    cond(c) { return D.evalAll(typeof c === 'string' ? [c] : c, n => this.lookup(n)); }
    flag(f) { return this.flags[f] || 0; }
    set(f, v) { this.flags[f] = v === undefined ? 1 : v; }

    act(s) {
      const { name, args } = D.parseAct(s);
      if (this.mode === 'dialog' && DEFERRED.has(name)) { this.deferred.push(s); return; }
      switch (name) {
        case 'set': this.set(args[0], args[1] !== undefined ? (isNaN(+args[1]) ? args[1] : +args[1]) : 1); break;
        case 'clr': delete this.flags[args[0]]; break;
        case 'inc': this.flags[args[0]] = (this.flags[args[0]] || 0) + (args[1] ? +args[1] : 1); break;
        case 'quest': this.setQuest(args[0], +args[1]); break;
        case 'give': this.give(args[0], args[1] ? +args[1] : 1, true); break;
        case 'take': this.take(args[0], args[1] ? +args[1] : this.count(args[0])); break;
        case 'gold': this.addGold(+args[0]); break;
        case 'xp': this.giveXp(+args[0]); break;
        case 'ap': this.approve(args[0], +args[1]); break;
        case 'join': this.join(args[0]); break;
        case 'leave': this.leave(args[0]); break;
        case 'codex': this.addCodex(args[0]); break;
        case 'run': case 'do': this.runScript(args[0]); break;
        case 'fight': this.fightGroup(args[0]); break;
        case 'hostile': this.makeHostile(args[0]); break;
        case 'shop': this.openShop(args[0]); break;
        case 'goto': this.goto(args[0], args[1]); break;
        case 'remove': this.removeNpc(args[0]); break;
        case 'heal': this.healParty(); break;
        case 'learn': if (!this.pc.abilities.includes(args[0])) { this.pc.abilities.push(args[0]); D.recalc(this.pc); } break;
        case 'end': if (this.dialog) this.dialog.endAfter = true; break;
        case 'toast': this.toast((D.TOASTS && D.TOASTS[args[0]]) || args[0]); break;
        case 'equip': this.forceEquip(this.pc, args[0], args[1]); break;
        case 'follow': this.setFollow(args[0], true); break;
        case 'unfollow': this.setFollow(args[0], false); break;
        case 'music': this.music = args[0]; this.emit('music', { id: args[0] }); break;
        case 'party': this.emit('panel', { id: 'party' }); break;
        case 'rest': this.healParty(); this.emit('fade', { t: 1 }); break;
        case 'mouse': this.setMouse(args[0] === 'on'); break;
        default: throw new Error('unknown action ' + s);
      }
    }

    setQuest(id, stage) {
      const q = D.QUESTS[id];
      if (!q) throw new Error('quest ' + id);
      const prev = this.quests[id] || 0;
      if (stage <= prev && !(q.done && stage === q.done && prev !== stage)) return;
      this.quests[id] = stage;
      if (!this.questLog.includes(id)) this.questLog.unshift(id);
      else { this.questLog.splice(this.questLog.indexOf(id), 1); this.questLog.unshift(id); }
      const done = q.done && stage >= q.done;
      const failed = q.fail && q.fail.includes(stage);
      this.emit('quest', { id, stage, name: q.name, done, failed, isNew: prev === 0 });
      if (done && q.xp) this.giveXp(q.xp);
      this.sound(done ? 'quest_done' : 'quest');
    }
    questDone(id) { const q = D.QUESTS[id]; return q && (this.quests[id] || 0) >= q.done; }

    addCodex(id) {
      if (this.codex[id]) return;
      if (!D.CODEX[id]) throw new Error('codex ' + id);
      this.codex[id] = 1;
      this.codexNew[id] = 1;
      this.emit('codex', { id, title: D.CODEX[id].title });
      this.giveXp(25, true);
    }

    count(id) { const e = this.inv.find(x => x.id === id); return e ? e.n : 0; }
    invSlots() { return this.inv.length; }
    give(id, n, announce) {
      if (!D.ITEMS[id]) throw new Error('item ' + id);
      n = n || 1;
      const e = this.inv.find(x => x.id === id);
      if (e) e.n += n; else this.inv.push({ id, n, t: this.time });
      if (announce) this.emit('item', { id, n, name: D.ITEMS[id].name });
      if (this.inv.length > INV_CAP) this.toast('Инвентарь переполнен!', 'warn');
      return true;
    }
    take(id, n) {
      const e = this.inv.find(x => x.id === id);
      if (!e) return 0;
      const k = Math.min(n, e.n);
      e.n -= k;
      if (e.n <= 0) this.inv.splice(this.inv.indexOf(e), 1);
      return k;
    }
    addGold(c) {
      this.gold = Math.max(0, this.gold + c);
      if (c > 0) this.emit('gold', { n: c });
    }
    invCap() { return INV_CAP; }

    giveXp(n, quiet) {
      if (!n) return;
      const members = Object.values(this.roster).concat([this.pc]);
      for (const c of members) {
        const ups = D.gainXp(c, n);
        if (ups) {
          if (c.kind !== 'pc' && (this.auto || c.autoLevel)) D.autoLevel(c);
          if (c === this.pc && this.auto) D.autoLevel(c);
          if (this.party.includes(c) || c === this.pc) this.emit('levelup', { uid: c.uid, name: c.name, lvl: c.lvl });
        }
      }
      if (!quiet) this.emit('xp', { n });
    }

    approve(key, n) {
      const c = this.roster[key];
      if (!c || !n) return;
      const before = c.approval;
      c.approval = clamp(c.approval + n, -100, 100);
      this.emit('approve', { key, name: c.name, n, val: c.approval, before });
    }
    approvalWord(v) {
      if (v >= 75) return 'Обожание';
      if (v >= 50) return 'Тёплые чувства';
      if (v >= 25) return 'Дружелюбие';
      if (v > -25) return 'Нейтрально';
      if (v > -50) return 'Прохладно';
      if (v > -75) return 'Недовольство';
      return 'Враждебность';
    }

    companionDef(key) { return D.COMPANIONS[key]; }
    makeCompanion(key) {
      const d = D.COMPANIONS[key];
      if (!d) throw new Error('companion ' + key);
      const c = D.makeCreature({ key, kind: 'party', name: d.name, race: d.race, cls: d.cls, sex: d.sex, model: d.model, lvl: d.lvl || 1, attr: d.attr, equip: d.equip, ab: d.ab, faction: 'party', radius: d.radius, nat: d.nat });
      c.skills = Object.assign({}, d.skills || {});
      c.build = d.build || null;
      c.temp = !!d.temp;
      c.autoLevel = true;
      if (d.set2) c.set2 = Object.assign({}, d.set2);
      c.approval = d.approval || 0;
      c.xp = D.xpForLevel(c.lvl);
      const target = Math.max(c.lvl, Math.min(this.pc ? this.pc.lvl + (d.lvlBonus || 0) : 1, 20));
      if (d.scale !== false && this.pc && target > c.lvl) D.gainXp(c, D.xpForLevel(target) - c.xp);
      D.autoLevel(c);
      c.tactics = D.defaultTactics ? D.defaultTactics(c) : [];
      D.recalc(c);
      c.hp = c.stats.hpMax; c.mp = c.stats.mpMax;
      return c;
    }
    join(key) {
      let c = this.roster[key];
      if (!c) { c = this.makeCompanion(key); this.roster[key] = c; }
      c.dead = false; c.down = false; c.gone = false;
      if (!this.party.includes(c)) {
        if (this.party.length < 4) {
          this.party.push(c);
          if (this.L) {
            const p = this.formationSpot(this.party.length - 1);
            this.placeEnt(c, p[0], p[1]);
            if (!this.ents.includes(c)) this.ents.push(c);
          }
        }
      }
      this.emit('party', {});
      if (!D.COMPANIONS[key].temp) this.emit('join', { key, name: c.name });
      return c;
    }
    leave(key) {
      const c = this.roster[key];
      if (!c) return;
      const i = this.party.indexOf(c);
      if (i >= 0) this.party.splice(i, 1);
      const j = this.ents.indexOf(c);
      if (j >= 0) this.ents.splice(j, 1);
      if (D.COMPANIONS[key] && D.COMPANIONS[key].temp) {
        this.returnGear(c);
        delete this.roster[key];
      }
      if (this.leader === c) this.leader = this.pc;
      this.emit('party', {});
    }
    returnGear(c) {
      const d = D.COMPANIONS[c.key];
      const base = d && d.equip ? Object.values(d.equip) : [];
      for (const slot of D.EQUIP_SLOTS) {
        const id = c.equip[slot];
        if (!id) continue;
        const i = base.indexOf(id);
        if (i >= 0) { base.splice(i, 1); continue; }
        if (!D.ITEMS[id].fade) this.give(id, 1);
      }
    }
    setActiveParty(keys) {
      const list = [this.pc];
      for (const k of keys) if (this.roster[k] && list.length < 4) list.push(this.roster[k]);
      for (const c of this.party) if (!list.includes(c)) { const j = this.ents.indexOf(c); if (j >= 0) this.ents.splice(j, 1); }
      this.party = list;
      list.forEach((c, i) => {
        if (!this.ents.includes(c)) {
          const p = this.formationSpot(i);
          this.placeEnt(c, p[0], p[1]);
          c.dead = false; c.down = false;
          this.ents.push(c);
        }
      });
      if (!this.party.includes(this.leader)) this.leader = this.pc;
      this.emit('party', {});
    }
    setFollow(npcId, on) {
      const e = this.ents.find(x => x.key === npcId && x.kind === 'npc');
      if (!e) return;
      e.following = on;
      e.faction = on ? 'ally' : 'neutral';
    }

    healParty() {
      for (const c of this.party) {
        c.dead = false; c.down = false;
        c.hp = c.stats.hpMax; c.mp = c.stats.mpMax;
        c.effects = c.effects.filter(e => e.keep);
      }
    }

    forceEquip(c, slot, id) {
      c.equip[slot] = id;
      D.recalc(c);
    }
    equipFromInv(c, slot, id) {
      const err = D.canEquip(c, slot, id);
      if (err) return err;
      if (!this.count(id)) return 'Нет в инвентаре';
      const it = D.ITEMS[id];
      this.take(id, 1);
      if (c.equip[slot]) this.give(c.equip[slot], 1);
      c.equip[slot] = id;
      if (slot === 'main' && it.hands === 2 && c.equip.off) { this.give(c.equip.off, 1); c.equip.off = null; }
      const r = c.hp / c.stats.hpMax;
      D.recalc(c);
      c.hp = Math.max(1, Math.round(c.stats.hpMax * r));
      this.sound('equip');
      return null;
    }
    unequip(c, slot) {
      const id = c.equip[slot];
      if (!id) return;
      if (D.ITEMS[id].fade) return;
      this.give(id, 1);
      c.equip[slot] = null;
      D.recalc(c);
      this.sound('equip');
    }
    swapWeaponSet(c) {
      const m = c.equip.main, o = c.equip.off;
      c.equip.main = c.set2.main; c.equip.off = c.set2.off;
      c.set2 = { main: m, off: o };
      c.activeSet = c.activeSet ? 0 : 1;
      D.recalc(c);
      c.swing = 0.8;
      this.sound('equip');
    }

    useItem(c, id, target) {
      const it = D.ITEMS[id];
      if (!it || !it.use || !this.count(id)) return 'Нет предмета';
      const u = it.use;
      if (u.dogOnly && c.look.kind !== 'dog') return 'Только для мабари';
      if (it.mageOnly && c.cls !== 'mage' && !c.t) return 'Лириумные зелья пьют только маги';
      if (c.dead || c.down) return 'Персонаж без сознания';
      if ((c.cds['item'] || 0) > 0 && (u.heal || u.mana || u.stamina)) return 'Зелье ещё не подействовало';
      if (u.bomb || u.trap) {
        if (!target) return 'Нужна цель';
        this.take(id, 1);
        if (u.bomb) this.throwBomb(c, u.bomb, target, it);
        else this.placeTrap(c, u.trap, target);
        return null;
      }
      this.take(id, 1);
      if (u.heal) this.healEnt(c, Math.round(u.heal * (1 + Math.max(0, c.stats.a.mag - 10) * 0.02)), c);
      if (u.mana && c.cls === 'mage') { c.mp = Math.min(c.stats.mpMax, c.mp + u.mana); this.float(c, '+' + u.mana, '#6af'); }
      if (u.stamina && c.cls !== 'mage') { c.mp = Math.min(c.stats.mpMax, c.mp + u.stamina); this.float(c, '+' + u.stamina, '#6f6'); }
      if (u.cure) { c.injuries = []; D.recalc(c); this.float(c, 'Травмы вылечены', '#fc8'); }
      if (u.buff) this.addEffect(c, { id: 'crunch', mods: u.buff, dur: 20 });
      if (u.coat) this.addEffect(c, { id: 'coat', mods: { fireAdd: 0 }, coat: u.coat, dur: u.coat.dur });
      c.cds['item'] = 2;
      this.sound('potion');
      return null;
    }

    bestLock() {
      let best = 0;
      for (const c of this.party) if (!c.dead && !c.down) best = Math.max(best, c.stats.lock || 0);
      return best;
    }

    runScript(id, ctx) {
      const fn = D.SCRIPTS[id];
      if (!fn) throw new Error('script ' + id);
      const r = fn(this, ctx || {});
      if (r && typeof r.next === 'function') {
        const co = { it: r, wait: 0, until: null, id };
        this.coros.push(co);
        this.stepCoro(co, 0);
      }
    }
    stepCoro(co, dt) {
      if (co.done) return;
      if (co.wait > 0) { co.wait -= dt; if (co.wait > 0) return; }
      if (co.until && !co.until()) return;
      co.until = null;
      for (let guard = 0; guard < 50; guard++) {
        const r = co.it.next();
        if (r.done) { co.done = true; return; }
        const v = r.value;
        if (typeof v === 'number') { co.wait = this.headless ? 0 : v; if (!this.headless && v > 0) return; continue; }
        if (typeof v === 'function') { if (!v()) { co.until = v; return; } continue; }
        if (v === 'dlg') { co.until = () => this.mode !== 'dialog'; if (this.mode === 'dialog') return; continue; }
        if (v === 'slides') { co.until = () => !this.slides; if (this.slides) return; continue; }
        if (v === 'fight') { co.until = () => !this.combat && !this.ents.some(e => e.faction === 'hostile' && !e.dead && e.aware); if (!co.until()) return; continue; }
        if (v === 'arrive') { co.until = () => this.ents.every(e => !e.scriptMove); if (!co.until()) return; continue; }
      }
    }
    updateCoros(dt) {
      for (const co of this.coros.slice()) this.stepCoro(co, dt);
      this.coros = this.coros.filter(c => !c.done);
    }
    cutscene(on) {
      this.cutDepth = Math.max(0, this.cutDepth + (on ? 1 : -1));
      if (this.cutDepth > 0 && this.mode === 'play') this.mode = 'cutscene';
      if (this.cutDepth === 0 && this.mode === 'cutscene') this.mode = 'play';
      if (on) for (const c of this.party) { c.path = null; c.order = null; }
    }
    showSlides(list, opts) {
      if (this.headless) { this.slides = null; return; }
      this.slides = { list, i: 0, opts: opts || {} };
      this.emit('slides', {});
    }
    nextSlide() {
      if (!this.slides) return;
      this.slides.i++;
      if (this.slides.i >= this.slides.list.length) this.slides = null;
    }

    startDialog(dlgId, speaker) {
      const dlg = D.DIALOGS[dlgId];
      if (!dlg) throw new Error('dialog ' + dlgId);
      this.dialog = { id: dlgId, node: null, line: 0, speaker: speaker || null, prevMode: this.mode === 'dialog' ? 'play' : this.mode, endAfter: false };
      this.mode = 'dialog';
      for (const c of this.party) { c.path = null; if (c.order && c.order.type !== 'hold') c.order = null; }
      if (speaker && this.leader) {
        speaker.face = D.angleTo(speaker.x, speaker.z, this.leader.x, this.leader.z);
        this.leader.face = D.angleTo(this.leader.x, this.leader.z, speaker.x, speaker.z);
      }
      this.enterNode('start');
      this.emit('dialog', { open: true });
    }
    enterNode(id, depth) {
      depth = depth || 0;
      if (depth > 30) throw new Error('dialog loop ' + this.dialog.id + '/' + id);
      if (id === 'end') { this.closeDialog(); return; }
      const dlg = D.DIALOGS[this.dialog.id];
      const node = dlg.nodes[id];
      if (!node) throw new Error('node ' + this.dialog.id + '/' + id);
      for (const j of node.jumps) {
        if (!j.conds.length || this.cond(j.conds)) {
          for (const a of j.acts) this.act(a);
          this.enterNode(j.to, depth + 1);
          return;
        }
      }
      this.dialog.node = id;
      this.dialog.line = 0;
      for (const a of node.acts) this.act(a);
      if (this.mode !== 'dialog' || !this.dialog) return;
      if (!node.lines.length && !node.replies.length) {
        const nx = this.nextAfter(node);
        if (nx) { for (const a of nx.acts) this.act(a); this.enterNode(nx.to, depth + 1); }
        else this.closeDialog();
        return;
      }
      this.emit('dialogline', {});
      this.speakLine();
    }
    speakLine() {
      const n = this.curNode();
      if (!n) return;
      const l = n.lines[this.dialog.line];
      if (l) this.emit('speak', { sp: l.sp, text: this.subst(l.text) });
    }
    curNode() { return this.dialog ? D.DIALOGS[this.dialog.id].nodes[this.dialog.node] : null; }
    curLine() {
      const n = this.curNode();
      if (!n) return null;
      const l = n.lines[this.dialog.line];
      return l ? { sp: l.sp, name: this.speakerName(l.sp), text: this.subst(l.text) } : null;
    }
    subst(t) {
      if (!this.pc) return t;
      const f = this.pc.sex === 'f';
      return t.replace(/\{name\}/g, this.pc.name).replace(/\{family\}/g, this.familyName()).replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (m, a, b) => (f ? b : a));
    }
    familyName() {
      const o = D.ORIGINS[this.origin];
      if (!o) return '';
      if (this.origin === 'mage') return this.pc.race === 'elf' ? 'Сурана' : 'Амелл';
      return o.family;
    }
    speakerDef(sp) {
      if (sp === 'pc') return this.pc;
      return this.roster[sp] || D.NPCS[sp] || (D.COMPANIONS && D.COMPANIONS[sp]) || this.ents.find(x => x.key === sp) || D.TEMPLATES[sp] || null;
    }
    speakerName(sp) {
      if (sp === 'narr') return '';
      const d = this.speakerDef(sp);
      return d ? d.name : sp;
    }
    speakerVoice(sp) {
      if (sp === 'narr') return { key: 'narr', narr: true };
      const d = this.speakerDef(sp) || {}, m = d.model || {};
      return { key: sp, sex: d.sex || m.sex || 'm', race: d.race || m.race || (m.kind === 'dog' ? 'beast' : 'human') };
    }
    moreLines() { const n = this.curNode(); return n && this.dialog.line < n.lines.length - 1; }
    replies() {
      const n = this.curNode();
      if (!n || this.moreLines()) return [];
      return n.replies.filter(r => (!r.once || !this.chosen[r.key]) && this.cond(r.conds)).map(r => Object.assign({}, r, { text: this.subst(r.text) }));
    }
    advance() {
      if (!this.dialog) return;
      const n = this.curNode();
      if (this.moreLines()) { this.dialog.line++; this.speakLine(); this.emit('dialogline', {}); return; }
      if (this.replies().length) return;
      const nx = this.nextAfter(n);
      if (nx) {
        for (const a of nx.acts) this.act(a);
        this.enterNode(nx.to);
        return;
      }
      this.closeDialog();
    }
    nextAfter(n) { return n.afters.find(j => !j.conds.length || this.cond(j.conds)) || null; }
    choose(i) {
      if (!this.dialog) return;
      if (this.moreLines()) { this.advance(); return; }
      const opts = this.replies();
      const r = opts[i];
      if (!r) { if (!opts.length) this.advance(); return; }
      this.chosen[r.key] = 1;
      let to = r.to;
      if (r.check) {
        const score = D.skillScore(this.pc, r.check.kind);
        const ok = score >= r.check.dc;
        this.emit('check', { ok, label: r.label });
        if (!ok) to = r.check.fail;
        else for (const a of r.acts) this.act(a);
      } else for (const a of r.acts) this.act(a);
      if (!this.dialog) return;
      if (this.dialog.endAfter) { this.closeDialog(); return; }
      this.enterNode(to);
    }
    closeDialog() {
      if (!this.dialog) return;
      this.dialog = null;
      this.mode = this.cutDepth > 0 ? 'cutscene' : 'play';
      this.emit('dialog', { open: false });
      const list = this.deferred;
      this.deferred = [];
      for (const a of list) this.act(a);
    }

    formationSpot(i, x, z, face) {
      const l = this.leader || this.pc;
      x = x !== undefined ? x : l.x; z = z !== undefined ? z : l.z; face = face !== undefined ? face : l.face;
      const offs = [[0, 0], [-1.3, -1.3], [1.3, -1.3], [0, -2.6]];
      const o = offs[i] || [0, -3.5];
      const s = Math.sin(face), c = Math.cos(face);
      const px = x + o[0] * c + o[1] * s, pz = z - o[0] * s + o[1] * c;
      if (this.L) {
        const p = D.nearestWalkable(this.L.nav, px, pz, 5);
        if (p && D.walkLine(this.L.nav, x, z, p[0], p[1])) return p;
        const q = D.nearestWalkable(this.L.nav, x, z, 4);
        return q || [x, z];
      }
      return [px, pz];
    }
    placeEnt(e, x, z) {
      e.x = x; e.z = z;
      e.y = this.L ? this.L.nav.heightAt(x, z) : 0;
      e.path = null; e.vx = 0; e.vz = 0;
    }

    goto(areaId, spotId) {
      if (this.headless || this.mode === 'loading') { this.enterArea(areaId, spotId); return; }
      this.emit('loading', { area: areaId, spot: spotId });
      this.pendingGoto = [areaId, spotId];
    }
    finishGoto() {
      if (!this.pendingGoto) return;
      const [a, s] = this.pendingGoto;
      this.pendingGoto = null;
      this.enterArea(a, s);
    }

    saveAreaState() {
      if (!this.areaId) return;
      const st = this.areaState[this.areaId] || (this.areaState[this.areaId] = {});
      st.dead = st.dead || {};
      for (const e of this.ents) if (e.objKey && e.dead && e.kind !== 'party') st.dead[e.objKey] = 1;
      st.removed = st.removed || {};
    }
    stateFor(id) {
      return this.areaState[id] || (this.areaState[id] = { dead: {}, removed: {}, boxes: {}, doors: {}, used: {}, trig: {}, pouches: [], hostile: {} });
    }

    enterArea(id, spotId) {
      this.saveAreaState();
      const def = D.AREAS[id];
      if (!def) throw new Error('area ' + id);
      const L = D.layout(id);
      this.areaId = id;
      this.areaSerial = (this.areaSerial || 0) + 1;
      this.L = L;
      this.def = def;
      this.theme = typeof def.theme === 'function' ? def.theme(this) : def.theme;
      const st = this.stateFor(id);
      this.ents = [];
      this.objs = [];
      this.projectiles = [];
      this.fields = [];
      this.traps = [];
      this.combat = false;
      L.nav.block.fill(0);
      L.objects.forEach((o, idx) => {
        const key = o.t + ':' + idx;
        const live = o.t === 'box' || o.t === 'use' || o.t === 'exit' || o.t === 'trig';
        if (!live && o.if && !this.cond(o.if)) return;
        if (!live && o.unless && this.cond(o.unless)) return;
        if (o.t === 'npc') {
          if (st.removed[o.id]) return;
          const d = D.NPCS[o.id];
          if (!d) throw new Error('npc ' + o.id);
          const e = D.makeCreature({ key: o.id, kind: 'npc', name: d.name, race: d.race || 'human', cls: d.cls || 'warrior', sex: d.sex || 'm', model: d.model, lvl: d.lvl || 3, attr: d.attr, equip: d.equip, ab: d.ab || [], faction: d.faction || 'neutral', radius: d.radius, nat: d.nat });
          e.npc = d; e.dlg = o.dlg || d.dlg; e.objKey = key; e.anim = o.anim || d.anim || 'idle'; e.bark = o.bark || d.bark; e.home = [o.x, o.z]; e.wander = o.wander || 0;
          e.essential = d.essential !== false;
          this.placeEnt(e, o.x, o.z);
          e.face = o.face || 0;
          if (st.hostile[o.id]) this.convertHostile(e);
          this.ents.push(e);
        } else if (o.t === 'foe') {
          if (st.dead[key]) return;
          const e = D.fromTemplate(o.tpl, o.opts || {});
          e.objKey = key; e.group = o.group; e.home = [o.x, o.z]; e.dlg = o.dlg || null; e.anim = o.anim || 'idle';
          if (o.neutral && !st.hostile[o.group]) { e.faction = 'neutral'; e.neutralFoe = true; }
          if (o.ally) e.faction = 'ally';
          if (o.asleep) e.asleep = true;
          if (o.patrol) e.patrol = o.patrol;
          e.aware = false;
          const dm = D.DIFFICULTY[this.difficulty];
          if (e.faction === 'hostile' || e.neutralFoe) { e.stats.hpMax = Math.round(e.stats.hpMax * dm.foeHp); e.hpScale = dm.foeHp; e.hp = e.stats.hpMax; }
          const sp = L.nav.okAt(o.x, o.z) ? [o.x, o.z] : D.nearestWalkable(L.nav, o.x, o.z, 4) || [o.x, o.z];
          this.placeEnt(e, sp[0], sp[1]);
          e.face = o.face || 0;
          this.ents.push(e);
        } else if (o.t === 'box') {
          const b = Object.assign({}, o, { sk: key, opened: !!(st.boxes[key] && st.boxes[key].opened), empty: !!(st.boxes[key] && st.boxes[key].empty) });
          this.objs.push(b);
        } else if (o.t === 'door') {
          const open = st.doors[key] !== undefined ? st.doors[key] : !!o.open;
          const d = Object.assign({}, o, { sk: key, open });
          this.objs.push(d);
          this.L.nav.opaque[o.cz * L.w + o.cx] = open ? 0 : 1;
          if (!open) this.L.nav.block[o.cz * L.w + o.cx] = 1;
        } else if (o.t === 'exit' || o.t === 'use') {
          if (o.t === 'use' && o.onceKey !== false && o.once && st.used[key]) return;
          this.objs.push(Object.assign({}, o, { sk: key }));
        } else if (o.t === 'trig') {
          if (o.once && st.trig[key]) return;
          this.objs.push(Object.assign({}, o, { sk: key }));
        }
      });
      for (const p of st.pouches || []) this.objs.push(Object.assign({ t: 'box', kind: 'pouch' }, p));
      const spot = (spotId && L.spots[spotId]) || Object.values(L.spots)[0];
      if (!spot) throw new Error('no spot in ' + id);
      let sx = spot.x, sz = spot.z, face = spot.face || 0;
      if (spot.t === 'exit') {
        const p = D.nearestWalkable(L.nav, spot.x, spot.z, 4);
        if (p) { sx = p[0]; sz = p[1]; }
        if (spot.face !== undefined) face = spot.face;
      }
      if (!this.leader || !this.party.includes(this.leader)) this.leader = this.pc;
      this.leader.face = face;
      this.party.forEach((c, i) => {
        c.dead = false;
        if (c.down) { c.down = false; c.hp = Math.max(c.hp, 1); }
        const p = i === 0 ? [sx, sz] : this.formationSpot(i, sx, sz, face);
        const q = D.nearestWalkable(L.nav, p[0], p[1], 6) || [sx, sz];
        this.placeEnt(c, q[0], q[1]);
        c.face = face; c.order = null; c.target = null; c.effects = c.effects.filter(e => e.keep);
        c.cast = null; c.anim = 'idle';
        this.ents.unshift(c);
      });
      if (this.leader !== this.party[0]) {
        const lx = this.leader.x, lz = this.leader.z;
        this.leader.x = this.party[0].x; this.leader.z = this.party[0].z;
        this.party[0].x = lx; this.party[0].z = lz;
      }
      this.selected = [this.leader];
      this.mode = this.cutDepth > 0 ? 'cutscene' : 'play';
      this.music = def.music || (D.THEMES[this.theme] && D.THEMES[this.theme].music);
      this.emit('area', { id, name: def.name });
      if (!st.visited) { st.visited = 1; if (def.codex) this.addCodex(def.codex); }
      if (def.onEnter) this.runScript(def.onEnter);
      if (!this.headless && !def.noAutosave) this.emit('autosave', {});
    }

    removeNpc(id) {
      const st = this.stateFor(this.areaId);
      for (const e of this.ents) if (e.key === id && e.kind === 'npc') { e.gone = true; }
      this.ents = this.ents.filter(e => !(e.key === id && e.kind === 'npc'));
      st.removed[id] = 1;
    }
    hideNpc(id) { this.ents = this.ents.filter(e => !(e.key === id && e.kind === 'npc')); }
    removeNpcIn(areaId, id) { this.stateFor(areaId).removed[id] = 1; }
    restoreNpcIn(areaId, id) { delete this.stateFor(areaId).removed[id]; }
    convertHostile(e) {
      e.faction = 'hostile';
      e.kind = 'foe';
      e.aware = true;
      e.xpValue = e.xpValue || (e.npc && e.npc.xp) || 60;
      e.loot = (e.npc && e.npc.loot) || e.loot || 'soldier';
      e.rank = (e.npc && e.npc.rank) || e.rank || 'normal';
    }
    makeHostile(id) {
      const st = this.stateFor(this.areaId);
      for (const e of this.ents) if (e.key === id && !e.dead) { this.convertHostile(e); st.hostile[id] = 1; }
      this.combat = true;
    }
    fightGroup(g) {
      const st = this.stateFor(this.areaId);
      st.hostile[g] = 1;
      for (const e of this.ents) if (e.group === g && !e.dead) { e.faction = 'hostile'; e.neutralFoe = false; e.aware = true; e.asleep = false; }
      this.combat = true;
    }
    spawn(tpl, x, z, opt) {
      const e = D.fromTemplate(tpl, opt || {});
      const p = D.nearestWalkable(this.L.nav, x, z, 6) || [x, z];
      this.placeEnt(e, p[0], p[1]);
      e.group = (opt && opt.group) || 'spawn';
      e.aware = !(opt && opt.unaware);
      e.face = (opt && opt.face) || 0;
      const dm = D.DIFFICULTY[this.difficulty];
      if (e.faction === 'hostile') { e.stats.hpMax = Math.round(e.stats.hpMax * dm.foeHp); e.hpScale = dm.foeHp; e.hp = e.stats.hpMax; }
      this.ents.push(e);
      return e;
    }
    spawnNpc(id, x, z, face, opt) {
      const d = D.NPCS[id];
      if (!d) throw new Error('npc ' + id);
      const old = this.ents.find(e => e.key === id && e.kind === 'npc');
      if (old) { this.placeEnt(old, x, z); old.face = face || 0; return old; }
      const e = D.makeCreature({ key: id, kind: 'npc', name: d.name, race: d.race || 'human', cls: d.cls || 'warrior', sex: d.sex || 'm', model: d.model, lvl: d.lvl || 3, attr: d.attr, equip: d.equip, ab: d.ab || [], faction: d.faction || 'neutral', radius: d.radius, nat: d.nat });
      e.npc = d; e.dlg = (opt && opt.dlg) || d.dlg; e.anim = (opt && opt.anim) || d.anim || 'idle'; e.home = [x, z]; e.essential = true;
      const p = D.nearestWalkable(this.L.nav, x, z, 5) || [x, z];
      this.placeEnt(e, p[0], p[1]);
      e.face = face || 0;
      this.ents.push(e);
      delete this.stateFor(this.areaId).removed[id];
      return e;
    }
    walkNpc(id, x, z, face, speed) {
      const e = typeof id === 'string' ? this.npcEnt(id) : id;
      if (!e) return null;
      e.scriptMove = [x, z, speed || 1];
      e.scriptFace = face;
      e.path = null;
      if (this.headless) { const p = D.nearestWalkable(this.L.nav, x, z, 5) || [x, z]; this.placeEnt(e, p[0], p[1]); e.scriptMove = null; if (face !== undefined) e.face = face; }
      return e;
    }
    spot(id) { return this.L.spots[id]; }
    npcEnt(id) { return this.ents.find(e => e.key === id && !e.gone); }
    groupAlive(g) { return this.ents.filter(e => e.group === g && !e.dead).length; }

    objOn(o) { return !(o.if && !this.cond(o.if)) && !(o.unless && this.cond(o.unless)); }
    activeObjs() { return this.objs.filter(o => this.objOn(o)); }
    obj(id) { return this.objs.find(o => o.id === id && this.objOn(o)); }
    setDoor(id, open) {
      const d = this.objs.find(o => o.t === 'door' && o.id === id);
      if (!d) return;
      d.open = open;
      this.stateFor(this.areaId).doors[d.sk] = open;
      this.L.nav.block[d.cz * this.L.w + d.cx] = open ? 0 : 1;
      this.L.nav.opaque[d.cz * this.L.w + d.cx] = open ? 0 : 1;
      this.sound(open ? 'door' : 'door_close');
    }
    doorState(areaId, doorId, open) {
      const L = D.layout(areaId);
      L.objects.forEach((o, idx) => { if (o.t === 'door' && o.id === doorId) this.stateFor(areaId).doors['door:' + idx] = open; });
    }

    tryInteract(o) {
      const who = this.leader;
      if (o.t && o.t !== 'steal' && !o.uid && !this.objOn(o)) return;
      if (o.t === 'door') {
        if (o.open) { this.setDoor(o.id, false); return; }
        if (o.lock) {
          if (o.key && this.count(o.key)) { this.setDoor(o.id, true); this.toast('Открыто ключом: ' + D.ITEMS[o.key].name); return; }
          if (o.lock >= 9) { this.toast(o.lockText || 'Заперто.'); this.sound('locked'); return; }
          if (this.bestLock() >= o.lock) { this.setDoor(o.id, true); this.toast('Замок вскрыт'); this.sound('lockpick'); o.lock = 0; this.giveXp(20); return; }
          this.toast(o.lockText || ('Заперто. Нужен ключ или разбойник с навыком взлома ' + o.lock + '.'));
          this.sound('locked');
          return;
        }
        this.setDoor(o.id, true);
        if (o.run) this.runScript(o.run, { obj: o });
        return;
      }
      if (o.t === 'box') { this.openBox(o); return; }
      if (o.t === 'exit') {
        if (o.req && !this.cond(o.req)) { this.toast(o.reqText || 'Сейчас туда нельзя.'); return; }
        if (this.combat) { this.toast('Нельзя уйти во время боя.'); return; }
        if (o.run) { this.runScript(o.run, { obj: o }); return; }
        if (o.map) { this.openWorldMap(o.map); return; }
        this.goto(o.to, o.at);
        return;
      }
      if (o.t === 'use') {
        if (o.req && !this.cond(o.req)) { this.toast(o.reqText || 'Ничего не происходит.'); return; }
        if (o.once) this.stateFor(this.areaId).used[o.sk] = 1;
        if (o.once) this.objs = this.objs.filter(x => x !== o);
        if (o.dlg) this.startDialog(o.dlg, null);
        else if (o.run) this.runScript(o.run, { obj: o });
        return;
      }
      if (o.t === 'steal') { const r = this.stealFrom(o.ent); if (r && r !== 'fail') this.toast(r, 'warn'); return; }
      if (o.kind === 'npc' || o.kind === 'foe' || o.kind === 'party') this.talkTo(o, who);
    }
    talkTo(e) {
      if (e.kind === 'party' && e !== this.leader) {
        const d = D.COMPANIONS[e.key];
        if (d && d.dlg && !this.combat) this.startDialog(d.dlg, e);
        return;
      }
      if (e.dlg) {
        if (e.dlgCond && !this.cond(e.dlgCond)) return;
        this.startDialog(typeof e.dlg === 'function' ? e.dlg(this) : e.dlg, e);
      } else if (e.bark) this.float(e, e.bark, '#fff');
      else if (e.npc && e.npc.barks) this.float(e, this.subst(this.rng.pick(e.npc.barks)), '#fff');
    }

    rollLoot(table, lvl) {
      const rows = D.LOOT[table] || [];
      const out = [];
      let gold = 0;
      const scale = 1 + (lvl || 1) * 0.25;
      for (const [p, what, a, b] of rows) {
        if (!this.rng.chance(p)) continue;
        if (what === 'money') gold += Math.round(this.rng.range(a, b) * scale);
        else if (D.LOOT_POOLS[what]) out.push([this.rng.pick(D.LOOT_POOLS[what]), 1]);
        else out.push([what, 1]);
      }
      return { items: out, gold };
    }
    openBox(o) {
      const st = this.stateFor(this.areaId);
      if (o.lock && !o.unlocked && !(st.boxes[o.sk] && st.boxes[o.sk].unlocked)) {
        if (o.key2 && this.count(o.key2)) { o.unlocked = true; }
        else if (o.lock < 9 && this.bestLock() >= o.lock) { o.unlocked = true; this.toast('Замок вскрыт'); this.sound('lockpick'); this.giveXp(15); }
        else { this.toast(o.lock >= 9 ? (o.lockText || 'Заперто.') : 'Заперто. Нужен разбойник с навыком взлома ' + o.lock + (o.key2 ? ' или ключ.' : '.')); this.sound('locked'); return; }
        (st.boxes[o.sk] || (st.boxes[o.sk] = {})).unlocked = true;
      }
      let rec = st.boxes[o.sk];
      if (o.kind === 'pouch') rec = o;
      else if (!rec || !rec.items) {
        const items = (o.loot || []).map(x => [x[0], x[1] || 1]);
        let gold = o.gold || 0;
        if (o.table) { const r = this.rollLoot(o.table, o.lvl || this.pc.lvl); items.push(...r.items); gold += r.gold; }
        rec = Object.assign(st.boxes[o.sk] || {}, { items, gold, opened: true });
        st.boxes[o.sk] = rec;
      }
      o.opened = true;
      this.sound(o.kind === 'chest' ? 'chest' : 'loot');
      if (o.run && !rec.ran) { rec.ran = 1; this.runScript(o.run, { obj: o }); }
      this.loot = { obj: o, rec };
      if (this.auto || this.headless) { this.takeAll(); return; }
      this.emit('loot', {});
    }
    takeLoot(i) {
      if (!this.loot) return;
      const rec = this.loot.rec;
      const it = rec.items[i];
      if (!it) return;
      this.give(it[0], it[1]);
      rec.items.splice(i, 1);
      this.checkEmpty();
    }
    takeAll() {
      if (!this.loot) return;
      const rec = this.loot.rec;
      for (const [id, n] of rec.items) this.give(id, n);
      rec.items = [];
      if (rec.gold) { this.addGold(rec.gold); rec.gold = 0; }
      this.checkEmpty();
      this.loot = null;
    }
    takeGold() {
      if (!this.loot) return;
      this.addGold(this.loot.rec.gold);
      this.loot.rec.gold = 0;
      this.checkEmpty();
    }
    checkEmpty() {
      if (!this.loot) return;
      const { obj, rec } = this.loot;
      if (!rec.items.length && !rec.gold) {
        rec.empty = true;
        obj.empty = true;
        if (obj.kind === 'pouch') {
          this.objs = this.objs.filter(x => x !== obj);
          const st = this.stateFor(this.areaId);
          st.pouches = (st.pouches || []).filter(p => p.sk !== obj.sk);
        }
      }
    }
    closeLoot() { this.loot = null; }
    dropPouch(e) {
      const r = this.rollLoot(e.loot, e.lvl);
      if (!r.items.length && !r.gold) return;
      const p = { sk: 'pouch:' + e.uid, id: 'pouch' + e.uid, x: e.x, z: e.z, items: r.items, gold: r.gold, t: 'box', kind: 'pouch' };
      this.stateFor(this.areaId).pouches.push(p);
      this.objs.push(Object.assign({ t: 'box', kind: 'pouch' }, p));
    }

    openShop(id) {
      const s = D.SHOPS[id];
      if (!s) throw new Error('shop ' + id);
      this.shop = { id, def: s, stock: this.shopStock(id) };
      this.emit('shop', {});
    }
    shopStock(id) {
      const st = this.stateFor('shop_' + id);
      if (!st.stock) st.stock = D.SHOPS[id].items.map(([i, n]) => ({ id: i, n: n || 99 }));
      return st.stock;
    }
    buyPrice(id) {
      const s = this.shop ? this.shop.def : null;
      const m = (s && s.markup) || 1;
      const disc = this.flags['disc_' + (this.shop && this.shop.id)] ? 0.8 : 1;
      return Math.max(1, Math.round(D.ITEMS[id].price * m * disc));
    }
    sellPrice(id) { return Math.max(0, Math.round(D.ITEMS[id].price * 0.25)); }
    buy(id) {
      const e = this.shop.stock.find(x => x.id === id);
      if (!e || e.n <= 0) return 'Нет в наличии';
      const p = this.buyPrice(id);
      if (this.gold < p) return 'Не хватает денег';
      this.gold -= p;
      e.n--;
      if (e.n <= 0) this.shop.stock.splice(this.shop.stock.indexOf(e), 1);
      this.give(id, 1);
      this.sound('coins');
      return null;
    }
    sell(id) {
      const it = D.ITEMS[id];
      if (!it || it.quest) return 'Это нельзя продать';
      if (!this.count(id)) return 'Нет предмета';
      this.take(id, 1);
      this.gold += this.sellPrice(id);
      const e = this.shop.stock.find(x => x.id === id);
      if (e) e.n++; else this.shop.stock.push({ id, n: 1 });
      this.sound('coins');
      return null;
    }
    closeShop() { this.shop = null; }

    canCraft(r, c) {
      c = c || this.bestCrafter(r.skill);
      if (!c || (c.skills[r.skill] || 0) < r.rank) return false;
      return r.need.every(([id, n]) => this.count(id) >= n);
    }
    bestCrafter(skill) {
      let best = null;
      for (const c of this.party) if (!best || (c.skills[skill] || 0) > (best.skills[skill] || 0)) best = c;
      return best;
    }
    craft(rid) {
      const r = D.RECIPES.find(x => x.id === rid);
      if (!r) return 'Нет рецепта';
      if (!this.canCraft(r)) return 'Не хватает навыка или материалов';
      for (const [id, n] of r.need) this.take(id, n);
      this.give(r.out, r.n);
      this.sound('craft');
      return null;
    }

    stealFrom(e) {
      const pc = this.leader;
      const r = pc.skills.stealing || 0;
      if (!r) return 'Нужен навык воровства';
      if (this.stolen[e.key]) return 'Здесь уже нечего взять';
      const npc = e.npc;
      if (!npc || !npc.steal) return 'У этого человека нечего красть';
      const chance = clamp(35 + r * 15 + (pc.stats.a.dex - 10) * 2 + (pc.stats.a.cun - 10) * 2 - (npc.stealDc || 0) * 10, 5, 95);
      this.stolen[e.key] = 1;
      if (this.rng.next() * 100 < chance) {
        const [id, n] = npc.steal;
        if (id === 'money') this.addGold(n); else this.give(id, n || 1, true);
        this.giveXp(30);
        this.toast('Кража удалась');
        return null;
      }
      this.toast('Вас заметили! ' + e.name + ' хмурится.');
      return 'fail';
    }

    openWorldMap(fromId) {
      this.travel = { from: fromId, dests: D.worldDestinations ? D.worldDestinations(this, fromId) : [] };
      this.mode = 'map';
      this.emit('worldmap', {});
      if (this.auto) {
        const d = this.travel.dests.find(x => x.open);
        if (d) this.travelTo(d.id);
      }
    }
    travelTo(destId) {
      const d = D.WORLD[destId];
      if (!d) return;
      const from = this.travel ? this.travel.from : null;
      this.travel = null;
      this.mode = 'play';
      this.flags['visited_' + destId] = 1;
      const enc = D.pickEncounter ? D.pickEncounter(this, from, destId) : null;
      if (enc) { this.flags.encounterDest = destId; this.goto(enc.area, enc.spot); return; }
      this.goto(d.area, d.spot);
    }
    closeMap() { this.travel = null; this.mode = 'play'; }

    setMouse(on) {
      const c = this.pc;
      c.mouse = on;
      c.radius = on ? 0.2 : 0.38;
      this.emit('morph', { uid: c.uid, on });
    }

    serialize() {
      this.saveAreaState();
      const areaStateCopy = JSON.parse(JSON.stringify(this.areaState));
      return {
        v: 1, seed: this.seed, time: this.time, playTime: this.playTime, flags: this.flags, quests: this.quests, questLog: this.questLog, codex: this.codex,
        inv: this.inv, gold: this.gold, pc: D.serializeCreature(this.pc), roster: Object.fromEntries(Object.entries(this.roster).map(([k, c]) => [k, D.serializeCreature(c)])),
        party: this.party.map(c => c.key), leader: this.leader ? this.leader.key : 'pc', area: this.areaId, pos: this.party.map(c => [c.x, c.z, c.face]),
        areaState: areaStateCopy, difficulty: this.difficulty, origin: this.origin, stats: this.stats, chosen: this.chosen, stolen: this.stolen, music: this.music
      };
    }
    static load(s, opt) {
      const g = new Game(Object.assign({}, opt, { seed: s.seed, difficulty: s.difficulty }));
      Object.assign(g, { time: s.time, playTime: s.playTime || 0, flags: s.flags, quests: s.quests, questLog: s.questLog || [], codex: s.codex, inv: s.inv, gold: s.gold, areaState: s.areaState, origin: s.origin, stats: s.stats || g.stats, chosen: s.chosen || {}, stolen: s.stolen || {} });
      g.pc = D.restoreCreature(s.pc);
      for (const [k, cs] of Object.entries(s.roster)) {
        const c = D.restoreCreature(cs);
        c.temp = !!(D.COMPANIONS[k] && D.COMPANIONS[k].temp);
        c.autoLevel = true;
        if (!c.tactics && D.defaultTactics) c.tactics = D.defaultTactics(c);
        g.roster[k] = c;
      }
      if (!g.pc.tactics && D.defaultTactics) g.pc.tactics = D.defaultTactics(g.pc);
      g.party = s.party.map(k => (k === 'pc' ? g.pc : g.roster[k])).filter(Boolean);
      g.leader = s.leader === 'pc' ? g.pc : g.roster[s.leader] || g.pc;
      g.areaId = null;
      const sv = g.headless;
      g.headless = true;
      g.enterArea(s.area, null);
      g.headless = sv;
      g.party.forEach((c, i) => { const p = s.pos[i]; if (p) { g.placeEnt(c, p[0], p[1]); c.face = p[2]; } });
      g.mode = 'play';
      g.events = [];
      g.emit('area', { id: g.areaId, name: g.def.name });
      return g;
    }

    newGame(o) {
      this.origin = o.origin;
      this.pc = D.startingPlayer(o);
      this.pc.autoLevel = !!o.autoLevel;
      this.pc.tactics = D.defaultTactics ? D.defaultTactics(this.pc) : [];
      this.party = [this.pc];
      this.leader = this.pc;
      const setup = D.ORIGIN_SETUP[o.origin];
      if (setup) setup(this);
      D.recalc(this.pc);
      this.pc.hp = this.pc.stats.hpMax; this.pc.mp = this.pc.stats.mpMax;
      const [a, s] = D.ORIGINS[o.origin].start;
      this.enterArea(a, s);
    }
  }

  D.Game = Game;
  D.INV_CAP = INV_CAP;
  D.ORIGIN_SETUP = D.ORIGIN_SETUP || {};
  D.COMPANIONS = D.COMPANIONS || {};
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
