(function (D) {
  'use strict';
  const { clamp, dist, angleTo, wrapAngle, turnToward } = D;
  const G = D.Game.prototype;
  const INCAP = new Set(['stun', 'knock', 'sleep', 'para', 'freeze', 'horror', 'field', 'grab']);
  const ST_NAME = { stun: 'Оглушение', knock: 'Сбит с ног', sleep: 'Сон', para: 'Паралич', freeze: 'Заморожен', horror: 'Ужас', pin: 'Обездвижен', field: 'Силовое поле', grab: 'Захвачен' };
  const SIGHT = 13;

  const alive = e => !e.dead && !e.down && !e.gone;
  const hasSt = (e, st) => e.effects.some(x => x.st === st);
  const incap = e => e.effects.some(x => INCAP.has(x.st));
  const pinned = e => e.effects.some(x => x.st === 'pin' || INCAP.has(x.st));
  const isFoeOf = (a, b) => {
    if (!alive(a) || !alive(b)) return false;
    const fa = a.faction, fb = b.faction;
    if (fa === 'hostile') return fb === 'party' || fb === 'ally';
    if (fa === 'party' || fa === 'ally') return fb === 'hostile';
    return false;
  };

  D.defaultTactics = c => {
    const t = [];
    const has = id => c.abilities.includes(id);
    const push = (cond, act) => t.push({ c: cond, a: act, on: true });
    if (c.look.kind === 'dog') {
      push('self_hp25', 'item:crunch');
      if (has('howl')) push('self_surround', 'ab:howl');
      if (has('overwhelm')) push('enemy_ranged', 'ab:overwhelm');
      if (has('shred')) push('enemy_strong', 'ab:shred');
      if (has('overwhelm')) push('enemy_near', 'ab:overwhelm');
      push('leader_target', 'attack');
      push('enemy_near', 'attack');
      return t;
    }
    if (c.cls === 'mage') {
      if (has('heal')) push('ally_hp25', 'ab:heal');
      push('self_hp25', 'item:poultice');
      push('self_mp25', 'item:lyrium');
      for (const s of ['rock_armor', 'spell_wisp', 'flaming_weapons', 'frost_weapons', 'death_syphon']) if (has(s)) push('self_any', 'ab:' + s);
      if (has('heal')) push('ally_hp50', 'ab:heal');
      if (has('rejuvenate')) push('ally_mp25', 'ab:rejuvenate');
      if (has('mind_blast')) push('self_surround', 'ab:mind_blast');
      if (has('fireball')) push('enemy_cluster', 'ab:fireball');
      if (has('sleep')) push('enemy_cluster', 'ab:sleep');
      if (has('cone_of_cold')) push('self_surround', 'ab:cone_of_cold');
      if (has('heroic_offense')) push('self_any', 'ab:heroic_offense');
      for (const s of ['drain_life', 'crushing_prison', 'horror', 'weakness', 'curse_mortality', 'petrify']) if (has(s)) push('enemy_strong', 'ab:' + s);
      for (const s of ['winters_grasp', 'stonefist', 'disorient']) if (has(s)) push('enemy_on_ally', 'ab:' + s);
      if (has('flame_blast')) push('enemy_on_me', 'ab:flame_blast');
      push('leader_target', 'attack');
      push('enemy_near', 'attack');
      return t;
    }
    push('self_hp25', 'item:poultice');
    if (c.cls === 'warrior') {
      for (const s of ['shield_defense', 'indomitable', 'threaten', 'precise_striking', 'dual_striking', 'aim', 'rapid_shot']) if (has(s)) push('self_any', 'ab:' + s);
      if (has('taunt')) push('enemy_on_ally', 'ab:taunt');
      if (has('shield_pummel')) push('enemy_strong', 'ab:shield_pummel');
      if (has('critical_strike')) push('enemy_strong', 'ab:critical_strike');
      if (has('sunder_arms')) push('enemy_strong', 'ab:sunder_arms');
      if (has('assault')) push('enemy_strong', 'ab:assault');
      if (has('shield_bash')) push('enemy_on_me', 'ab:shield_bash');
      if (has('pommel_strike')) push('enemy_on_me', 'ab:pommel_strike');
      if (has('pinning_shot')) push('enemy_ranged', 'ab:pinning_shot');
      if (has('crippling_shot')) push('enemy_strong', 'ab:crippling_shot');
      if (has('flurry')) push('enemy_near', 'ab:flurry');
      if (has('riposte')) push('enemy_near', 'ab:riposte');
      push('self_mp25', 'item:stamina');
      push('leader_target', 'attack');
      push('enemy_near', 'attack');
      return t;
    }
    for (const s of ['dual_striking', 'aim', 'rapid_shot']) if (has(s)) push('self_any', 'ab:' + s);
    if (has('dirty_fighting')) push('enemy_on_me', 'ab:dirty_fighting');
    if (has('deadly_strike')) push('enemy_strong', 'ab:deadly_strike');
    if (has('pinning_shot')) push('enemy_ranged', 'ab:pinning_shot');
    if (has('crippling_shot')) push('enemy_strong', 'ab:crippling_shot');
    if (has('below_belt')) push('enemy_near', 'ab:below_belt');
    if (has('flurry')) push('enemy_strong', 'ab:flurry');
    if (has('riposte')) push('enemy_near', 'ab:riposte');
    push('self_mp25', 'item:stamina');
    push('leader_target', 'attack');
    push('enemy_near', 'attack');
    return t;
  };
  D.tacticSlots = c => {
    if (c.look.kind === 'dog') return 5 + Math.floor(c.lvl / 3);
    return 4 + (c.skills.combat_tactics || 0) * 2 + Math.floor(c.lvl / 3);
  };

  G.partyMods = function () {
    const m = {};
    for (const c of this.party) {
      if (!alive(c)) continue;
      for (const id of c.sustained) {
        const s = D.AB[id] && D.AB[id].fx.sus;
        if (!s) continue;
        if (s.partySpd) m.partySpdApplied = (m.partySpdApplied || 1) * s.partySpd;
        if (s.partyMove) m.move = (m.move || 0) + s.partyMove;
        if (s.partyFire) m.fireAdd = (m.fireAdd || 0) + s.partyFire;
        if (s.partyCold) m.coldAdd = (m.coldAdd || 0) + s.partyCold;
      }
    }
    return m;
  };
  G.refresh = function (c) {
    D.recalc(c, c.faction === 'party' ? this._pm : null);
    if (c.hpScale) c.stats.hpMax = Math.round(c.stats.hpMax * c.hpScale);
    if (c.hp > c.stats.hpMax) c.hp = c.stats.hpMax;
  };

  G.addEffect = function (c, e) {
    const prev = c.effects.find(x => x.id === e.id);
    if (prev) c.effects.splice(c.effects.indexOf(prev), 1);
    e.t = e.dur;
    c.effects.push(e);
    if (e.st && INCAP.has(e.st)) {
      c.cast = null; c.pending = null;
      if (e.st === 'knock') c.anim = 'knock';
      this.float(c, ST_NAME[e.st], '#fd6');
    } else if (e.st === 'pin') this.float(c, ST_NAME.pin, '#fd6');
    if (e.mods) this.refresh(c);
  };
  G.removeEffect = function (c, id) {
    const i = c.effects.findIndex(x => x.id === id);
    if (i >= 0) { const e = c.effects[i]; c.effects.splice(i, 1); if (e.mods) this.refresh(c); }
  };
  G.tryStatus = function (src, tgt, st, dur, res, power, idBase) {
    if (!alive(tgt)) return false;
    if (tgt.stats.immune && (st === 'knock' || st === 'stun' || st === 'grab' || st === 'freeze' || st === 'para')) { this.float(tgt, 'Невосприимчив', '#aaa'); return false; }
    if (res && res !== 'none') {
      const chance = D.resistChance(tgt, res, power || 0);
      if (this.rng.next() * 100 < chance) { this.float(tgt, 'Сопротивление', '#aaa'); return false; }
    }
    this.addEffect(tgt, { id: (idBase || 'st') + '_' + st, st, dur, src: src && src.uid });
    return true;
  };

  G.healEnt = function (c, n, src) {
    if (c.dead) return;
    if (c.effects.some(e => e.mods && e.mods.noRegen)) n = Math.round(n * 0.3);
    const before = c.hp;
    c.hp = Math.min(c.stats.hpMax, c.hp + n);
    if (c.down && c.hp > 0) { c.down = false; c.anim = 'getup'; }
    const got = Math.round(c.hp - before);
    if (got > 0) this.float(c, '+' + got, '#5f5');
    this.emit('fx', { fx: 'heal', uid: c.uid });
    for (const e of this.ents) if (e.faction === 'hostile' && e.aware && src) this.addThreat(e, src, got * 0.5);
  };
  G.addThreat = function (holder, src, n) {
    if (!holder.threat) holder.threat = {};
    holder.threat[src.uid] = (holder.threat[src.uid] || 0) + n * (src.stats.threat || 1);
  };

  G.damage = function (src, tgt, amount, el, opt) {
    opt = opt || {};
    if (!alive(tgt) || tgt.faction === 'neutral' && !opt.force) return 0;
    if (hasSt(tgt, 'field')) { this.float(tgt, 'Неуязвим', '#6cf'); return 0; }
    if (this.god && tgt.faction === 'party') return 0;
    let dmg = amount;
    if (el === 'fire') dmg *= 1 - clamp(tgt.stats.fireRes, -100, 100) / 100;
    if (el === 'cold') dmg *= 1 - clamp(tgt.stats.coldRes, -100, 100) / 100;
    if (el === 'nature') dmg *= 1 - clamp(tgt.stats.natureRes, 0, 75) / 100;
    if (el === 'spirit' && tgt.race === 'dwarf') dmg *= 0.9;
    const dm = D.DIFFICULTY[this.difficulty];
    if (src && src.faction === 'hostile' && tgt.faction === 'party') dmg *= dm.foeDmg;
    if (src && src.faction === 'party' && tgt.faction === 'hostile') dmg *= dm.pcDmg;
    if (src && src.faction === 'party' && tgt.faction === 'party') dmg *= this.difficulty === 'easy' ? 0 : 0.5;
    dmg = Math.max(el === 'phys' ? 1 : 0, Math.round(dmg));
    if (dmg <= 0) return 0;
    tgt.hp -= dmg;
    if (tgt.essential && tgt.kind === 'npc' && tgt.hp < 1) tgt.hp = 1;
    tgt.hurtT = 0.35;
    if (tgt.faction === 'party' || src && src.faction === 'party') tgt.blood = Math.min(1, (tgt.blood || 0) + dmg / tgt.stats.hpMax * 1.4);
    if (hasSt(tgt, 'sleep')) this.removeEffect(tgt, tgt.effects.find(e => e.st === 'sleep').id);
    if (tgt.cast && tgt.cast.t > 0.2 && tgt.cls === 'mage' && this.rng.chance(0.18 - (tgt.skills.combat_training || 0) * 0.04)) { tgt.cast = null; this.float(tgt, 'Сбит', '#fa8'); }
    if (src) {
      if (tgt.faction === 'hostile' || tgt.faction === 'ally') this.addThreat(tgt, src, dmg);
      if (tgt.faction === 'hostile' && !tgt.aware) this.alert(tgt, src);
      if (src.faction === 'party') this.stats.dmg += dmg;
    }
    this.float(tgt, (opt.crit ? '!' : '') + dmg, opt.crit ? '#ff4' : el === 'fire' ? '#f84' : el === 'cold' ? '#8cf' : el === 'spirit' ? '#c8f' : el === 'nature' ? '#9c3' : tgt.faction === 'party' ? '#f66' : '#fff');
    if (el === 'phys' && !opt.noBlood) this.emit('fx', { fx: 'blood', uid: tgt.uid, n: opt.crit ? 14 : 7 });
    if (tgt.hp <= 0) this.kill(tgt, src);
    return dmg;
  };

  G.kill = function (c, src) {
    c.hp = 0;
    c.cast = null; c.pending = null; c.path = null; c.order = null;
    if (c.grabbedBy) { const o = this.ents.find(e => e.uid === c.grabbedBy); if (o) o.grabbing = null; c.grabbedBy = null; }
    if (c.grabbing) { const v = this.ents.find(e => e.uid === c.grabbing); if (v) { v.grabbedBy = null; this.removeEffect(v, 'grab'); } c.grabbing = null; }
    if (c.faction === 'party') {
      c.down = true;
      c.anim = 'down';
      c.effects = c.effects.filter(e => e.keep);
      c.sustained = [];
      this.refresh(c);
      c.pendingInjury = true;
      this.stats.deaths++;
      this.log(c.name + ' теряет сознание!', 'bad');
      this.sound('down');
      if (this.leader === c) {
        const next = this.party.find(p => alive(p));
        if (next) { this.leader = next; this.selected = [next]; this.emit('leader', {}); }
      }
      if (!this.party.some(alive)) {
        if (this.flags.nonlethal_fight) { this.runScript(this.flags.nonlethal_fight); return; }
        this.mode = 'dead';
        this.emit('gameover', {});
      }
      return;
    }
    if (c.t && c.t.nonlethal) {
      c.down = true; c.anim = 'down'; c.faction = 'neutral'; c.aware = false;
      this.log(c.name + ' сдаётся.', 'good');
      this.checkGroup(c.group);
      return;
    }
    c.dead = true;
    c.anim = 'dead';
    c.deadT = 0;
    c.effects = [];
    if (c.faction === 'hostile' || c.kind === 'foe') {
      this.stats.kills++;
      if (c.xpValue) this.giveXp(c.xpValue, true);
      if (c.loot && c.loot !== 'none') this.dropPouch(c);
      if (src && src.faction === 'party') {
        const dbm = src.stats.mods.onKillMp;
        if (dbm) src.mp = Math.min(src.stats.mpMax, src.mp + dbm);
      }
      this.log(c.name + ' повержен.', 'good');
      this.sound('death_' + (c.race === 'darkspawn' ? 'ds' : c.race === 'beast' ? 'beast' : 'human'));
      if (c.objKey) this.stateFor(this.areaId).dead[c.objKey] = 1;
      if (c.onDeath) this.runScript(c.onDeath, { ent: c });
      if (this.def && this.def.onKill) this.runScript(this.def.onKill, { ent: c });
      this.checkGroup(c.group);
    }
  };
  G.checkGroup = function (g) {
    if (!g) return;
    if (this.ents.some(e => e.group === g && !e.dead && !e.down)) return;
    const k = 'cleared_' + g;
    if (this.flags[k]) return;
    this.flags[k] = 1;
    const gd = D.GROUPS[g];
    if (gd && gd.onClear) this.runScript(gd.onClear);
  };

  G.alert = function (c, src) {
    if (c.faction !== 'hostile') return;
    c.aware = true;
    c.asleep = false;
    if (src) this.addThreat(c, src, 5);
    for (const o of this.ents) {
      if (o === c || o.faction !== 'hostile' || o.aware || o.dead) continue;
      if ((o.group && o.group === c.group) || dist(o.x, o.z, c.x, c.z) < 9) {
        o.aware = true; o.asleep = false;
        if (src) this.addThreat(o, src, 3);
      }
    }
    if (!this.combat) this.startCombat();
  };
  G.startCombat = function () {
    this.combat = true;
    for (const c of this.party) if (c.mouse) this.setMouse(false);
    this.emit('combat', { on: true });
    this.sound('combat');
    for (const c of this.party) {
      if (c === this.leader && !this.auto) continue;
      if (c.order && c.order.type === 'move') c.order = null;
    }
    if (this.autoPause && !this.auto) { this.paused = true; this.emit('pause', { on: true }); }
  };
  G.endCombat = function () {
    this.combat = false;
    for (const c of this.party) {
      if (c.down) {
        c.down = false; c.hp = Math.max(1, Math.round(c.stats.hpMax * 0.1)); c.anim = 'getup';
        if (c.pendingInjury) {
          const inj = this.rng.pick(D.INJURIES);
          if (!c.injuries.includes(inj.id)) c.injuries.push(inj.id);
          this.refresh(c);
          this.log(c.name + ' получает травму: ' + inj.name + '.', 'bad');
        }
      }
      c.pendingInjury = false;
      c.target = null;
      if (c.order && c.order.type === 'attack') c.order = null;
    }
    this.fields = [];
    this.emit('combat', { on: false });
  };

  G.abilityCost = function (c, a) {
    return Math.round((a.cost || 0) * (1 + (c.stats.fat || 0) / 100));
  };
  G.abilityRange = function (c, a) {
    if (a.range === 'melee') return c.stats.reach;
    if (a.range === 'bow') return c.stats.range || 14;
    return a.range || 0;
  };
  G.canUse = function (c, id, target) {
    const a = D.AB[id];
    if (!a) return 'Нет способности';
    if (!c.abilities.includes(id) && !(c.t && c.t.ab && c.t.ab.includes(id))) return 'Не изучено';
    if (a.kind === 'pas') return 'Пассивная способность';
    if (!alive(c) || incap(c)) return 'Персонаж не может действовать';
    if (a.need) {
      const s = c.stats.style;
      if (a.need === 'shield' && s !== 'shield') return 'Нужен щит';
      if (a.need === '2h' && s !== '2h') return 'Нужно двуручное оружие';
      if (a.need === 'dual' && s !== 'dual') return 'Нужны два клинка';
      if (a.need === 'bow' && s !== 'bow') return 'Нужен лук';
    }
    if (a.kind === 'sus') {
      if (c.sustained.includes(id)) return null;
      if (id === 'stealth' && this.combat && !c.stats.mods.combatStealth && this.ents.some(e => e.faction === 'hostile' && e.aware && alive(e) && dist(e.x, e.z, c.x, c.z) < 10)) return 'Враги слишком близко';
    }
    if ((c.cds[id] || 0) > 0) return 'Перезарядка';
    if (c.mp < this.abilityCost(c, a)) return c.cls === 'mage' ? 'Не хватает маны' : 'Не хватает выносливости';
    if (target && a.tgt === 'enemy' && target.uid && !isFoeOf(c, target)) return 'Нужна вражеская цель';
    if (target && a.tgt === 'ally' && target.uid && (target.faction !== c.faction || target.dead)) return 'Нужен союзник';
    return null;
  };

  G.cmdAbility = function (c, id, target) {
    const err = this.canUse(c, id, target);
    if (err) { if (c.faction === 'party' && !this.auto) this.toast(err, 'warn'); return false; }
    const a = D.AB[id];
    if (a.kind === 'sus') { this.toggleSustained(c, id); return true; }
    if (a.tgt === 'self') target = c;
    if (!target) return false;
    c.order = { type: 'ability', id, uid: target.uid, x: target.x, z: target.z, ground: a.tgt === 'ground' && !target.uid };
    c.path = null;
    return true;
  };
  G.toggleSustained = function (c, id) {
    const a = D.AB[id];
    const i = c.sustained.indexOf(id);
    if (i >= 0) { c.sustained.splice(i, 1); this.refresh(c); this._pmDirty = true; this.float(c, a.name + ': выкл', '#aaa'); return; }
    const cost = this.abilityCost(c, a);
    if (c.mp < cost) return;
    c.mp -= cost;
    c.sustained.push(id);
    if (id === 'stealth') { c.stealthCrit = true; for (const e of this.ents) if (e.threat) delete e.threat[c.uid]; }
    this.refresh(c);
    this._pmDirty = true;
    c.anim = 'cast'; c.animT = 0;
    this.float(c, a.name, '#9cf');
    this.emit('fx', { fx: 'sustain', uid: c.uid, ab: id });
    this.sound('sustain');
  };
  G.breakStealth = function (c) {
    const i = c.sustained.indexOf('stealth');
    if (i >= 0) { c.sustained.splice(i, 1); this.refresh(c); this.float(c, 'Скрытность нарушена', '#aaa'); }
  };

  G.performAbility = function (c, id, target, gx, gz) {
    const a = D.AB[id];
    const cost = this.abilityCost(c, a);
    if (c.mp < cost && !(c.t && !c.abilities.length)) return;
    c.mp -= cost;
    c.cds[id] = a.cd || 0;
    const fx = a.fx;
    const tx = target ? target.x : gx, tz = target ? target.z : gz;
    c.face = angleTo(c.x, c.z, tx, tz) || c.face;
    if (c.faction === 'party') this.log(c.name + ': ' + a.name, 'ab');
    this.emit('fx', { fx: 'cast', uid: c.uid, ab: id });
    const power = c.cls === 'mage' || c.race === 'demon' || c.race === 'spirit' ? c.stats.sp + 10 : (c.stats.a.str - 10) * 1.5 + c.lvl * 2;
    if (fx.hit) {
      const n = fx.hit.n || 1;
      for (let k = 0; k < n; k++) {
        const hit = this.attackRoll(c, target, { mult: fx.hit.mult, crit: fx.hit.crit, pierce: fx.hit.pierce, ranged: a.range === 'bow', abil: true, delay: k * 0.3 });
        if (hit && fx.hit.st && (k === n - 1)) this.tryStatus(c, target, fx.hit.st, fx.hit.dur, fx.hit.res, power, id);
      }
      if (a.range === 'bow') this.spawnProjectile(c, target, 'arrow', null);
      c.anim = 'attack'; c.animT = 0; c.swing = Math.max(c.swing || 0, c.stats.spd * 0.6);
    }
    if (fx.debuff && target) {
      const d = fx.debuff;
      if (d.st) this.tryStatus(c, target, d.st, d.dur, d.res, power, id);
      else if (d.res === 'none' || this.rng.next() * 100 >= D.resistChance(target, d.res, power)) this.addEffect(target, { id: 'db_' + id, mods: d.mods, dur: d.dur, src: c.uid, debuff: 1 });
      else this.float(target, 'Сопротивление', '#aaa');
      if (!fx.hit) { c.anim = 'cast'; c.animT = 0; }
      if (target.faction === 'hostile') this.addThreat(target, c, 15);
    }
    if (fx.dot && target) {
      this.addEffect(target, { id: 'dot_' + id, dot: { el: fx.dot.el, dps: fx.dot.dps + (c.cls === 'mage' ? c.stats.sp * 0.1 : 0) }, dur: fx.dot.dur, src: c.uid });
    }
    if (fx.heal) {
      const n = Math.round(fx.heal.base + c.stats.sp * fx.heal.sp);
      this.healEnt(target || c, n, c);
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.mana) {
      const t = target || c;
      const n = Math.round(fx.mana.base + c.stats.sp * fx.mana.sp);
      t.mp = Math.min(t.stats.mpMax, t.mp + n);
      this.float(t, '+' + n, '#6af');
      this.emit('fx', { fx: 'mana', uid: t.uid });
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.party && fx.party.mana) {
      for (const p of this.party) if (alive(p)) { p.mp = Math.min(p.stats.mpMax, p.mp + fx.party.mana); this.emit('fx', { fx: 'mana', uid: p.uid }); }
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.buff) {
      const t = target || c;
      this.addEffect(t, { id: 'buff_' + id, mods: fx.buff.mods, dur: fx.buff.dur, src: c.uid, buff: 1 });
      this.emit('fx', { fx: 'buff', uid: t.uid });
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.drain && target) {
      const n = Math.round(fx.drain.base + c.stats.sp * fx.drain.sp);
      this.spawnProjectile(c, target, 'drain', () => {
        const got = this.damage(c, target, n, 'spirit');
        if (got) this.healEnt(c, got, null);
      });
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.taunt) {
      for (const e of this.ents) if (isFoeOf(c, e) && dist(e.x, e.z, c.x, c.z) < fx.taunt.r) { this.addThreat(e, c, 400); e.target = c.uid; e.aware = true; }
      this.emit('fx', { fx: 'taunt', uid: c.uid });
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.disengage && target && target.threat) { target.threat[c.uid] = 0; if (target.target === c.uid) target.target = null; }
    if (fx.feign) {
      for (const e of this.ents) if (e.threat) { e.threat[c.uid] = 0; if (e.target === c.uid) e.target = null; }
      this.addEffect(c, { id: 'feign', st: 'stun', dur: 2, mods: { def: 50 } });
    }
    if (fx.cone) this.doCone(c, fx.cone, tx, tz, power, id);
    if (fx.aoe) {
      const ax = fx.aoe.at === 'self' ? c.x : tx, az = fx.aoe.at === 'self' ? c.z : tz;
      this.doAoe(c, fx.aoe, ax, az, power, id);
      c.anim = fx.aoe.at === 'self' && c.t && id !== 'mind_blast' ? 'slam' : 'cast'; c.animT = 0;
    }
    if (fx.bolt) {
      const b = fx.bolt;
      const kind = b.stone ? 'stone' : b.web ? 'web' : b.el === 'fire' ? (b.aoe ? 'fireball' : 'firebolt') : b.el === 'cold' ? 'frost' : 'bolt';
      const gTarget = target || { x: gx, z: gz, ground: 1 };
      this.spawnProjectile(c, gTarget, kind, (hx, hz) => {
        const dmg = b.base + c.stats.sp * b.sp;
        if (b.aoe) this.doAoe(c, { r: b.aoe, el: b.el, base: dmg, sp: 0, st: b.st, dur: b.dur, res: b.res, ff: b.ff }, hx, hz, power, id);
        else if (target && alive(target)) {
          this.damage(c, target, dmg, b.el);
          if (b.st && alive(target)) this.tryStatus(c, target, b.st, b.dur, b.res, power, id);
        }
      }, b.speed);
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.field) {
      this.fields.push({ x: tx, z: tz, r: fx.field.r, el: fx.field.el, dps: fx.field.dps + c.stats.sp * 0.15, t: fx.field.dur, src: c.uid, slow: fx.field.slow, fac: c.faction });
      this.emit('fx', { fx: 'field', x: tx, z: tz, r: fx.field.r, el: fx.field.el, dur: fx.field.dur });
      c.anim = 'cast'; c.animT = 0;
    }
    if (fx.grab && target) {
      if (target.stats.immune || target.look.kind === 'ogre') return;
      this.addEffect(target, { id: 'grab', st: 'grab', dur: fx.grab.dur, dot: { el: 'phys', dps: fx.grab.dps }, src: c.uid });
      target.grabbedBy = c.uid;
      c.grabbing = target.uid;
      c.grabT = fx.grab.dur;
      c.anim = 'grab'; c.animT = 0;
      this.sound('ogre_roar');
    }
    this.sound('ab_' + (fx.hit ? 'hit' : fx.heal ? 'heal' : fx.bolt || fx.drain ? 'bolt' : fx.cone || fx.field ? 'fire' : 'cast'));
  };

  G.doCone = function (c, cone, tx, tz, power, id) {
    const dir = angleTo(c.x, c.z, tx, tz);
    const half = (cone.deg * Math.PI / 180) / 2;
    const dmg = cone.base + c.stats.sp * cone.sp;
    this.emit('fx', { fx: 'cone', uid: c.uid, dir, len: cone.len, el: cone.el, deg: cone.deg });
    for (const e of this.ents.slice()) {
      if (!alive(e) || e === c) continue;
      const friendly = e.faction === c.faction || (c.faction === 'party' && e.faction === 'ally');
      if (e.faction === 'neutral') continue;
      if (friendly && (this.difficulty === 'easy' || !cone.ff)) continue;
      const d = dist(c.x, c.z, e.x, e.z);
      if (d > cone.len + e.radius) continue;
      if (Math.abs(wrapAngle(angleTo(c.x, c.z, e.x, e.z) - dir)) > half + 0.1) continue;
      this.damage(c, e, dmg, cone.el);
      if (cone.dot && alive(e)) this.addEffect(e, { id: 'dot_' + id, dot: { el: cone.el, dps: cone.dot.dps }, dur: cone.dot.dur, src: c.uid });
      if (cone.st && alive(e)) this.tryStatus(c, e, cone.st, cone.dur, cone.res, power, id);
    }
    c.anim = 'cast'; c.animT = 0;
  };
  G.doAoe = function (c, a, x, z, power, id) {
    this.emit('fx', { fx: 'aoe', x, z, r: a.r, el: a.el || 'magic', ab: id, uid: c.uid });
    if (a.shake) this.emit('shake', { t: 0.5 });
    const dmg = (a.base || 0) + c.stats.sp * (a.sp || 0);
    for (const e of this.ents.slice()) {
      if (!alive(e)) continue;
      if (e === c && a.at === 'self') continue;
      if (e.faction === 'neutral') continue;
      const foe = isFoeOf(c, e);
      if (!foe && (a.foes || !a.ff || this.difficulty === 'easy')) continue;
      if (dist(x, z, e.x, e.z) > a.r + e.radius) continue;
      if (dmg > 0) this.damage(c, e, foe ? dmg : dmg * 0.5, a.el || 'spirit');
      if (a.st && alive(e)) this.tryStatus(c, e, a.st, a.dur, a.res, power, id);
      if (a.mods && alive(e)) {
        if (a.res === 'none' || this.rng.next() * 100 >= D.resistChance(e, a.res, power)) this.addEffect(e, { id: 'db_' + id, mods: a.mods, dur: a.dur, src: c.uid, debuff: 1 });
      }
      if (a.dot && alive(e)) this.addEffect(e, { id: 'dot_' + id, dot: { el: a.el, dps: a.dot.dps }, dur: a.dot.dur, src: c.uid });
      if (a.threatWipe && e.threat) e.threat[c.uid] = 0;
      if (foe && e.faction === 'hostile') this.alert(e, c);
    }
  };

  G.spawnProjectile = function (src, target, kind, onHit, speed) {
    const y0 = src.y + (src.look.kind === 'ogre' ? 2.5 : 1.3);
    const p = { kind, x: src.x + Math.sin(src.face) * 0.5, z: src.z + Math.cos(src.face) * 0.5, y: y0, src: src.uid, tgt: target.uid || null, tx: target.x, tz: target.z, ground: !!target.ground, speed: speed || (kind === 'arrow' ? 26 : 15), onHit, t: 0 };
    this.projectiles.push(p);
    if (this.headless) { this.projectiles.pop(); if (onHit) onHit(target.x, target.z); }
    return p;
  };
  G.updateProjectiles = function (dt) {
    for (const p of this.projectiles) {
      p.t += dt;
      let tx = p.tx, tz = p.tz, ty = 1.1;
      if (p.tgt) {
        const t = this.ents.find(e => e.uid === p.tgt);
        if (t && !t.dead) { tx = t.x; tz = t.z; ty = t.y + (t.look.kind === 'ogre' ? 2.2 : t.look.kind === 'humanoid' ? 1.1 : 0.6); p.tx = tx; p.tz = tz; }
      } else ty = this.L.nav.heightAt(tx, tz) + 0.3;
      const dx = tx - p.x, dz = tz - p.z, dy = ty - p.y;
      const d = Math.hypot(dx, dz, dy);
      const step = p.speed * dt;
      if (d <= step || p.t > 4) {
        p.done = true;
        if (p.onHit) p.onHit(tx, tz);
        if (p.kind !== 'arrow') this.emit('fx', { fx: 'impact', kind: p.kind, x: tx, z: tz, y: ty });
      } else {
        p.x += dx / d * step; p.z += dz / d * step; p.y += dy / d * step;
        if (p.kind === 'bomb') p.y += Math.sin(Math.min(1, p.t * 1.5) * Math.PI) * 0.12;
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.done);
  };

  G.attackRoll = function (a, t, opt) {
    opt = opt || {};
    if (!alive(t)) return false;
    const ranged = opt.ranged !== undefined ? opt.ranged : D.isRanged(a) && a.stats.style !== 'staff';
    const helpless = t.effects.some(e => INCAP.has(e.st) && e.st !== 'field');
    let atk = a.stats.atk + (opt.bonus || 0);
    let def = t.stats.def + (ranged ? t.stats.mdef * 0.6 : 0);
    const flank = Math.abs(wrapAngle(angleTo(t.x, t.z, a.x, a.z) - t.face)) > (a.stats.mods.flank ? 1.6 : 2.0);
    if (flank) def -= 10;
    const chance = helpless ? 100 : D.hitChance(atk, def);
    const roll = this.rng.next() * 100;
    if (roll >= chance) {
      this.float(t, 'Промах', '#bbb');
      if (a.faction === 'party' || t.faction === 'party') this.log(a.name + ' → ' + t.name + ': промах', 'miss');
      this.sound(ranged ? 'whoosh' : 'swing');
      if (t.faction === 'hostile' && !t.aware) this.alert(t, a);
      return false;
    }
    if (!helpless && t.stats.dodge && this.rng.next() * 100 < t.stats.dodge) { this.float(t, 'Уклонение', '#bbb'); return false; }
    const backstab = a.cls === 'rogue' && !ranged && a.faction !== 'hostile' && (flank || helpless);
    let crit = opt.crit || backstab || (a.stealthCrit && a.sustained.includes('stealth')) || (a.stats.mods.coup && helpless) || this.rng.next() * 100 < a.stats.crit;
    if (a.faction === 'hostile' && backstab) crit = true;
    let dmg = a.stats.dmg * (0.85 + this.rng.next() * 0.3) * (opt.mult || 1);
    if (crit) { dmg *= backstab ? 1.6 : 1.5; this.stats.crits += a.faction === 'party' ? 1 : 0; }
    if (a.stats.mods.dmgPct) dmg *= 1 + a.stats.mods.dmgPct / 100;
    const arm = Math.max(0, t.stats.arm - a.stats.pierce);
    const pierceFrac = opt.pierce || 0;
    dmg -= arm * (0.35 + this.rng.next() * 0.4) * (1 - pierceFrac);
    dmg = Math.max(1, dmg);
    const doIt = () => {
      if (!alive(t)) return;
      const got = this.damage(a, t, dmg, 'phys', { crit });
      if (a.faction === 'party' || t.faction === 'party') this.log(a.name + ' → ' + t.name + ': ' + got + (crit ? (backstab ? ' (удар в спину)' : ' (крит)') : ''), crit ? 'crit' : 'hit');
      const fire = (a.stats.fireAdd || 0), cold = (a.stats.coldAdd || 0);
      if (fire && alive(t)) this.damage(a, t, fire, 'fire');
      if (cold && alive(t)) this.damage(a, t, cold, 'cold');
      const coat = a.effects.find(e => e.coat);
      if (coat && alive(t)) this.damage(a, t, coat.coat.add, coat.coat.el);
      if (a.t && a.t.poison && alive(t)) this.addEffect(t, { id: 'poison', dot: { el: 'nature', dps: a.t.poison }, dur: 5, src: a.uid });
      if (crit && a.stats.mods.bleedOnCrit && alive(t)) this.addEffect(t, { id: 'bleed', dot: { el: 'phys', dps: 4 }, dur: 6, src: a.uid });
      this.sound(ranged ? 'arrow_hit' : crit ? 'hit_crit' : t.stats.arm > 4 ? 'hit_armor' : 'hit');
    };
    if (ranged || this.headless || !opt.delay) doIt(); else a.queued = (a.queued || []).concat([{ t: opt.delay, fn: doIt }]);
    if (a.stealthCrit && a.sustained.includes('stealth')) { a.stealthCrit = false; }
    if (a.sustained.includes('stealth')) this.breakStealth(a);
    return true;
  };

  G.basicAttack = function (a, t) {
    const st = a.stats.style;
    a.face = angleTo(a.x, a.z, t.x, t.z);
    a.anim = 'attack'; a.animT = 0;
    a.swing = a.stats.spd;
    if (st === 'staff' || (a.t && a.t.bolt)) {
      const el = (D.mainWeapon(a) && D.mainWeapon(a).staff) || (a.t && a.t.bolt) || 'spirit';
      const dmg = a.stats.dmg + a.stats.sp * 0.3;
      this.spawnProjectile(a, t, 'staff_' + el, () => { if (alive(t)) this.damage(a, t, dmg, el); }, 18);
      this.sound('staff');
      return;
    }
    if (st === 'bow') {
      this.spawnProjectile(a, t, 'arrow', null, 30);
      this.attackRoll(a, t, { ranged: true });
      this.sound('bow');
      return;
    }
    this.sound('swing');
    this.attackRoll(a, t, { delay: 0.28 });
    if (st === 'dual' && this.rng.chance(0.5)) {
      this.attackRoll(a, t, { mult: a.stats.offMult, delay: 0.45 });
    }
  };

  G.throwBomb = function (c, bomb, target, it) {
    const tx = target.x, tz = target.z;
    c.face = angleTo(c.x, c.z, tx, tz);
    c.anim = 'throw'; c.animT = 0;
    this.spawnProjectile(c, { x: tx, z: tz, ground: 1 }, 'bomb', () => {
      this.doAoe(c, { r: bomb.r, el: bomb.el, base: bomb.base, sp: 0, st: bomb.st, dur: bomb.dur, res: 'phys', mods: bomb.mods, ff: 1, dot: bomb.dot }, tx, tz, 15, it.id);
    }, 12);
    this.sound('throw');
  };
  G.placeTrap = function (c, trap, target) {
    this.traps.push({ x: target.x, z: target.z, base: trap.base, st: trap.st, dur: trap.dur, src: c.uid });
    this.emit('fx', { fx: 'trap', x: target.x, z: target.z });
    this.sound('trap');
  };

  G.nearestFoe = function (c, maxD, filter) {
    let best = null, bd = maxD || 999;
    for (const e of this.ents) {
      if (!isFoeOf(c, e)) continue;
      if (e.faction === 'hostile' && !e.aware && c.faction !== 'hostile') continue;
      if (filter && !filter(e)) continue;
      const d = dist(c.x, c.z, e.x, e.z);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  };
  G.visibleTo = function (a, b) {
    if (b.sustained && b.sustained.includes('stealth') && dist(a.x, a.z, b.x, b.z) > 2.5) return false;
    return D.sightLine(this.L.nav, a.x, a.z, b.x, b.z);
  };

  G.evalTactic = function (c, cond) {
    const foes = () => this.ents.filter(e => e.faction === 'hostile' && alive(e) && e.aware);
    const allies = () => this.party.filter(alive);
    const R = 22;
    const near = (list) => { let b = null, bd = R; for (const e of list) { const d = dist(c.x, c.z, e.x, e.z); if (d < bd) { bd = d; b = e; } } return b; };
    switch (cond) {
      case 'enemy_near': return near(foes());
      case 'enemy_on_me': return near(foes().filter(e => e.target === c.uid));
      case 'enemy_on_ally': return near(foes().filter(e => e.target && e.target !== c.uid && this.party.some(p => p.uid === e.target)));
      case 'enemy_ranged': return near(foes().filter(e => D.isRanged(e)));
      case 'enemy_strong': return near(foes().filter(e => e.rank === 'lt' || e.rank === 'elite' || e.rank === 'boss'));
      case 'enemy_weak': return near(foes().filter(e => e.hp < e.stats.hpMax * 0.25));
      case 'enemy_cluster': {
        const fs = foes();
        return near(fs.filter(e => fs.filter(o => o !== e && dist(o.x, o.z, e.x, e.z) < 3.2).length >= 2));
      }
      case 'leader_target': {
        const l = this.leader;
        if (!l || l === c) return null;
        const t = this.ents.find(e => e.uid === l.target && alive(e) && isFoeOf(c, e));
        return t || null;
      }
      case 'self_hp50': return c.hp < c.stats.hpMax * 0.5 ? c : null;
      case 'self_hp25': return c.hp < c.stats.hpMax * 0.25 ? c : null;
      case 'self_mp25': return c.mp < c.stats.mpMax * 0.25 ? c : null;
      case 'self_surround': return foes().filter(e => dist(e.x, e.z, c.x, c.z) < 3).length >= 2 ? c : null;
      case 'self_any': return this.combat ? c : null;
      case 'ally_hp50': return allies().filter(a => a.hp < a.stats.hpMax * 0.5).sort((a, b) => a.hp / a.stats.hpMax - b.hp / b.stats.hpMax)[0] || null;
      case 'ally_hp25': return allies().filter(a => a.hp < a.stats.hpMax * 0.25).sort((a, b) => a.hp / a.stats.hpMax - b.hp / b.stats.hpMax)[0] || null;
      case 'ally_mp25': return allies().filter(a => a !== c && a.mp < a.stats.mpMax * 0.25)[0] || null;
      default: return null;
    }
  };
  G.bestItem = function (kind) {
    const lists = {
      poultice: ['poultice_greater', 'poultice', 'poultice_lesser'],
      lyrium: ['lyrium', 'lyrium_lesser'],
      stamina: ['stamina_draught'],
      crunch: ['mabari_crunch']
    };
    return (lists[kind] || []).find(id => this.count(id) > 0) || null;
  };
  G.runTactics = function (c) {
    if (!c.tactics || !c.tacticsOn) return false;
    const slots = D.tacticSlots(c);
    let n = 0;
    for (const t of c.tactics) {
      if (n++ >= slots) break;
      if (!t.on) continue;
      const target = this.evalTactic(c, t.c);
      if (!target) continue;
      const [kind, arg] = t.a.split(':');
      if (kind === 'attack') {
        const foe = target.faction === 'hostile' ? target : this.nearestFoe(c, 22);
        if (!foe) continue;
        c.order = { type: 'attack', uid: foe.uid, ai: 1 };
        return true;
      }
      if (kind === 'item') {
        if ((c.cds.item || 0) > 0) continue;
        const id = this.bestItem(arg);
        if (!id) continue;
        if (arg === 'lyrium' && c.cls !== 'mage') continue;
        if (arg === 'stamina' && c.cls === 'mage') continue;
        if (arg === 'crunch' && c.look.kind !== 'dog') continue;
        if (!this.useItem(c, id)) return true;
        continue;
      }
      if (kind === 'ab') {
        const a = D.AB[arg];
        if (!a) continue;
        if (a.kind === 'sus') {
          if (c.sustained.includes(arg)) continue;
          if (this.canUse(c, arg)) continue;
          this.toggleSustained(c, arg);
          return true;
        }
        let tgt = target;
        if (a.tgt === 'enemy' && tgt.faction !== 'hostile') tgt = this.nearestFoe(c, 22);
        if (a.tgt === 'ally' && tgt.faction === 'hostile') continue;
        if (a.tgt === 'ground' && tgt.faction !== 'hostile') tgt = this.nearestFoe(c, 22);
        if (a.tgt === 'self') tgt = c;
        if (!tgt) continue;
        if (a.id === 'heroic_offense' && tgt === c) tgt = this.party.find(p => alive(p) && p.cls !== 'mage' && !p.effects.some(e => e.id === 'buff_heroic_offense')) || null;
        if (!tgt) continue;
        if (a.tgt === 'ground' || a.fx.cone || a.fx.bolt && a.fx.bolt.aoe) {
          const ff = this.party.some(p => p !== c && alive(p) && dist(p.x, p.z, tgt.x, tgt.z) < ((a.fx.bolt && a.fx.bolt.aoe) || (a.fx.aoe && a.fx.aoe.r) || 0) + 0.8 && (a.fx.bolt && a.fx.bolt.ff || a.fx.field));
          if (ff) continue;
        }
        if (this.canUse(c, arg, tgt)) continue;
        c.order = { type: 'ability', id: arg, uid: tgt.uid, x: tgt.x, z: tgt.z, ai: 1 };
        return true;
      }
      if (kind === 'to_leader' && this.leader !== c) { c.order = { type: 'move', x: this.leader.x, z: this.leader.z, ai: 1 }; return true; }
      if (kind === 'switch_melee' && D.isRanged(c) && c.set2.main) { this.swapWeaponSet(c); return true; }
      if (kind === 'switch_ranged' && !D.isRanged(c) && c.set2.main && D.ITEMS[c.set2.main].bow) { this.swapWeaponSet(c); return true; }
    }
    return false;
  };

  G.hostileThink = function (c) {
    if (c.grabbing) return;
    let best = null, bs = -1;
    for (const e of this.ents) {
      if (!isFoeOf(c, e)) continue;
      const d = dist(c.x, c.z, e.x, e.z);
      if (d > 30) continue;
      if (e.sustained && e.sustained.includes('stealth') && d > 2.5) continue;
      const th = (c.threat && c.threat[e.uid]) || 0;
      const score = th + 30 / (1 + d) + (c.target === e.uid ? 10 : 0);
      if (score > bs) { bs = score; best = e; }
    }
    if (!best) { c.order = null; c.target = null; return; }
    c.target = best.uid;
    const abil = (c.abilities.length ? c.abilities : (c.t && c.t.ab) || []).filter(id => D.AB[id] && D.AB[id].kind === 'act');
    if (abil.length && this.rng.chance(0.4)) {
      for (const id of this.rng.chance(0.5) ? abil : abil.slice().reverse()) {
        const a = D.AB[id];
        if ((c.cds[id] || 0) > 0) continue;
        if (c.mp < this.abilityCost(c, a) && !c.t) continue;
        let tgt = best;
        if (a.tgt === 'self') {
          const around = this.ents.filter(e => isFoeOf(c, e) && dist(e.x, e.z, c.x, c.z) < ((a.fx.aoe && a.fx.aoe.r) || 4)).length;
          if (around < 1 || (id === 'ogre_slam' && around < 2 && this.rng.chance(0.5))) continue;
          tgt = c;
        }
        if (id === 'grab' && (best.look.kind !== 'humanoid' && best.look.kind !== 'dog')) continue;
        if (a.need && this.canUse(c, id, tgt)) continue;
        c.order = { type: 'ability', id, uid: tgt.uid, x: tgt.x, z: tgt.z, ai: 1 };
        return;
      }
    }
    c.order = { type: 'attack', uid: best.uid, ai: 1 };
  };

  G.allyThink = function (c) {
    const foe = this.nearestFoe(c, 16);
    if (foe) { c.order = { type: 'attack', uid: foe.uid, ai: 1 }; c.target = foe.uid; return; }
    c.order = null;
  };

  G.partyThink = function (c) {
    if (c.order && !c.order.ai) return;
    if (this.holdPos && c !== this.leader && !this.combat) return;
    if (this.combat && c.behavior !== 'passive') {
      if (this.runTactics(c)) return;
      if (!c.order || c.order.ai) {
        const lt = this.leader && this.leader !== c ? this.ents.find(e => e.uid === this.leader.target && isFoeOf(c, e)) : null;
        const foe = lt || this.nearestFoe(c, 20, e => e.target && this.party.some(p => p.uid === e.target)) || this.nearestFoe(c, 20);
        if (foe) c.order = { type: 'attack', uid: foe.uid, ai: 1 };
      }
      return;
    }
    if (c.order && c.order.ai && c.order.type !== 'move') c.order = null;
  };

  G.orderDone = function (c) { c.order = null; c.path = null; };

  G.pathTo = function (c, x, z, reach) {
    const small = !!c.mouse;
    const nav = this.L.nav;
    const marked = [];
    const tc = Math.floor(z) * nav.w + Math.floor(x);
    for (const e of this.ents) {
      if (e === c || e.gone || e.dead || e.kind !== 'npc' || e.following || e.scriptMove || e.wander || e.path) continue;
      const i = Math.floor(e.z) * nav.w + Math.floor(e.x);
      if (i === tc || nav.block[i] || !nav.inside(Math.floor(e.x), Math.floor(e.z))) continue;
      if (Math.floor(c.x) === Math.floor(e.x) && Math.floor(c.z) === Math.floor(e.z)) continue;
      nav.block[i] = 1;
      marked.push(i);
    }
    const p = D.findPath(nav, c.x, c.z, x, z, { small, reach: reach || 6, partial: true });
    for (const i of marked) nav.block[i] = 0;
    c.path = p;
    c.pathGoal = [x, z];
    c.repath = 0.6;
    return !!p;
  };

  G.cmdMove = function (c, x, z) {
    c.order = { type: 'move', x, z };
    this.pathTo(c, x, z);
    if (c === this.leader && !this.combat) for (const p of this.party) if (p !== c && p.order && p.order.ai) p.order = null;
  };
  G.cmdAttack = function (c, t) {
    if (!t || !isFoeOf(c, t)) return;
    c.order = { type: 'attack', uid: t.uid };
    c.target = t.uid;
    if (t.faction === 'hostile' && !t.aware) this.alert(t, c);
  };
  G.cmdInteract = function (c, o) {
    c.order = { type: 'interact', obj: o, uid: o.uid || null };
    this.pathTo(c, o.x, o.z, 3);
  };
  G.cmdStop = function (c) { c.order = null; c.path = null; };

  G.moveAlong = function (c, dt, speedMul) {
    if (!c.path || !c.path.length) return true;
    const wp = c.path[0];
    const dx = wp[0] - c.x, dz = wp[1] - c.z;
    const d = Math.hypot(dx, dz);
    const sp = c.stats.move * (speedMul || 1) * (c.mouse ? 0.8 : 1) * (this.L.nav.slow[Math.floor(c.z) * this.L.w + Math.floor(c.x)] ? 0.7 : 1);
    if (d < 0.12) { c.path.shift(); return !c.path.length; }
    const step = Math.min(d, sp * dt);
    this.stepMove(c, dx / d * step, dz / d * step);
    c.face = turnToward(c.face, Math.atan2(dx, dz), dt * 10);
    c.moving = true;
    return false;
  };
  G.stepMove = function (c, mx, mz) {
    const nav = this.L.nav, small = !!c.mouse;
    const nx = c.x + mx, nz = c.z + mz;
    if (nav.okAt(nx, nz, small) || !nav.okAt(c.x, c.z, small)) { c.x = nx; c.z = nz; }
    else if (nav.okAt(nx, c.z, small)) c.x = nx;
    else if (nav.okAt(c.x, nz, small)) c.z = nz;
    c.y = nav.heightAt(c.x, c.z);
  };
  G.separate = function (dt) {
    const list = this.ents.filter(e => !e.dead && !e.gone && !e.down);
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        const dx = b.x - a.x, dz = b.z - a.z;
        const rr = a.radius + b.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr || d2 < 1e-6) continue;
        const d = Math.sqrt(d2), push = (rr - d) * 0.5;
        const ux = dx / d, uz = dz / d;
        const aStill = !a.moving, bStill = !b.moving;
        const wa = a.look.kind === 'ogre' ? 0.1 : aStill && !bStill ? 0.3 : 0.5;
        const wb = b.look.kind === 'ogre' ? 0.1 : bStill && !aStill ? 0.3 : 0.5;
        if (a.kind !== 'npc' || a.following) this.stepMove(a, -ux * push * wa * 2, -uz * push * wa * 2);
        if (b.kind !== 'npc' || b.following) this.stepMove(b, ux * push * wb * 2, uz * push * wb * 2);
      }
    }
  };

  G.actOrder = function (c, dt) {
    const o = c.order;
    if (!o) return;
    if (o.type === 'move') {
      if (!c.path) this.pathTo(c, o.x, o.z);
      const d = dist(c.x, c.z, o.x, o.z);
      if (o.bestD === undefined || d < o.bestD - 0.05) { o.bestD = d; o.stall = 0; } else o.stall = (o.stall || 0) + dt;
      if (o.stall > 1.5) { o.stall = 0; o.tries = (o.tries || 0) + 1; if (o.tries > 2) { this.orderDone(c); return; } this.pathTo(c, o.x, o.z); }
      if (this.moveAlong(c, dt) || !c.path) this.orderDone(c);
      return;
    }
    if (o.type === 'interact') {
      const obj = o.obj;
      const tx = obj.x, tz = obj.z;
      const d = dist(c.x, c.z, tx, tz);
      const reach = obj.t === 'exit' ? 1.6 : obj.uid ? 2.6 : obj.t === 'trig' ? 1 : 1.9;
      if (o.bestD === undefined || d < o.bestD - 0.05) { o.bestD = d; o.stall = 0; } else o.stall = (o.stall || 0) + dt;
      if (d <= reach || (d < reach + 1.2 && !c.path) || (o.stall > 1 && d < reach + 2)) {
        this.orderDone(c);
        c.face = angleTo(c.x, c.z, tx, tz);
        this.tryInteract(obj);
        return;
      }
      if (!c.path) { if (!this.pathTo(c, tx, tz, 3)) { this.orderDone(c); return; } }
      this.moveAlong(c, dt);
      return;
    }
    if (o.type === 'attack' || o.type === 'ability') {
      const t = o.uid ? this.ents.find(e => e.uid === o.uid) : null;
      const ab = o.type === 'ability' ? D.AB[o.id] : null;
      if (o.type === 'attack' && (!t || !alive(t) || !isFoeOf(c, t))) { this.orderDone(c); return; }
      if (ab && ab.tgt !== 'ground' && ab.tgt !== 'self' && (!t || t.dead)) { this.orderDone(c); return; }
      const tx = t ? t.x : o.x, tz = t ? t.z : o.z;
      let range;
      if (ab) range = this.abilityRange(c, ab);
      else range = c.stats.range || c.stats.reach;
      if (ab && ab.tgt === 'self') range = 999;
      const tr = t && t !== c ? t.radius : 0;
      const d = dist(c.x, c.z, tx, tz) - tr - c.radius * 0.5;
      const needLos = (range > 3) && t !== c;
      const los = !needLos || D.sightLine(this.L.nav, c.x, c.z, tx, tz);
      if (d <= range && los) {
        c.path = null;
        c.moving = false;
        c.face = turnToward(c.face, angleTo(c.x, c.z, tx, tz), dt * 12);
        if (c.target !== (t && t.uid) && t && t !== c && isFoeOf(c, t)) c.target = t.uid;
        if (ab) {
          if (c.cast) return;
          const err = this.canUse(c, o.id, t && t !== c ? t : null);
          if (err) { this.orderDone(c); return; }
          const castTime = c.cls === 'mage' || ab.fx.bolt || ab.fx.cone || ab.fx.heal || ab.fx.field ? 0.55 : 0.05;
          if (this.headless || castTime < 0.1) { this.performAbility(c, o.id, t, o.x, o.z); this.orderDone(c); if (t && isFoeOf(c, t)) c.order = { type: 'attack', uid: t.uid, ai: o.ai }; }
          else { c.cast = { id: o.id, t: castTime, tgt: t ? t.uid : null, x: tx, z: tz, ai: o.ai }; c.anim = 'cast'; c.animT = 0; this.orderDone(c); }
          return;
        }
        if ((c.swing || 0) <= 0) this.basicAttack(c, t);
        return;
      }
      if (pinned(c)) return;
      c.repath = (c.repath || 0) - dt;
      if (!c.path || c.repath <= 0 || (c.pathGoal && dist(c.pathGoal[0], c.pathGoal[1], tx, tz) > 1.5)) this.pathTo(c, tx, tz, 3);
      if (c.path) this.moveAlong(c, dt);
      else if (o.ai) this.orderDone(c);
    }
  };

  G.followLeader = function (c, i, dt) {
    const l = this.leader;
    if (!l || c === l) return;
    const d = dist(c.x, c.z, l.x, l.z);
    if (d > 40) { const p = this.formationSpot(i); this.placeEnt(c, p[0], p[1]); return; }
    const spot = this.formationSpot(i);
    const ds = dist(c.x, c.z, spot[0], spot[1]);
    if (ds < 0.6 && !l.moving) { c.path = null; c.moving = false; c.face = turnToward(c.face, l.face, dt * 4); return; }
    if (ds < 0.3) { c.path = null; return; }
    c.repath = (c.repath || 0) - dt;
    if (!c.path || c.repath <= 0) { this.pathTo(c, spot[0], spot[1], 4); c.repath = 0.5; }
    const mul = d > 6 ? 1.35 : d > 3 ? 1.1 : 1;
    this.moveAlong(c, dt, mul);
  };

  G.updateEffects = function (c, dt) {
    let changed = false;
    for (const e of c.effects) {
      e.t -= dt;
      if (e.dot) {
        e.acc = (e.acc || 0) + e.dot.dps * dt;
        if (e.acc >= 3 || (e.t <= 0 && e.acc >= 1)) {
          const n = Math.floor(e.acc);
          e.acc -= n;
          const src = this.ents.find(x => x.uid === e.src) || null;
          this.damage(src, c, n, e.dot.el, { noBlood: e.dot.el !== 'phys' });
          if (c.dead || c.down) return;
        }
      }
    }
    const before = c.effects.length;
    const ending = c.effects.filter(e => e.t <= 0);
    c.effects = c.effects.filter(e => e.t > 0);
    for (const e of ending) {
      if (e.mods) changed = true;
      if (e.st === 'knock') c.anim = 'getup';
      if (e.st === 'grab') {
        const o = this.ents.find(x => x.uid === c.grabbedBy);
        if (o) o.grabbing = null;
        c.grabbedBy = null;
        this.tryStatus(null, c, 'knock', 1.5, 'none');
      }
    }
    if (changed || before !== c.effects.length && ending.some(e => e.mods)) this.refresh(c);
  };

  G.updateEnt = function (c, dt) {
    for (const k in c.cds) if (c.cds[k] > 0) c.cds[k] -= dt;
    if (c.swing > 0) c.swing -= dt;
    if (c.hurtT > 0) c.hurtT -= dt;
    if (c.animT !== undefined) c.animT += dt;
    if (c.queued && c.queued.length) {
      for (const q of c.queued) q.t -= dt;
      const ready = c.queued.filter(q => q.t <= 0);
      c.queued = c.queued.filter(q => q.t > 0);
      for (const q of ready) q.fn();
    }
    if (c.dead) { c.deadT = (c.deadT || 0) + dt; return; }
    this.updateEffects(c, dt);
    if (c.dead || c.down) return;
    const upkeep = c.sustained.length * 0.9;
    const inCombat = this.combat;
    const noRegen = c.effects.some(e => e.mods && e.mods.noRegen);
    if (c.faction === 'party' || c.faction === 'ally') {
      const hpR = inCombat ? 0.15 + (c.stats.hpRegen || 0) : c.stats.hpMax * 0.06 + (c.stats.hpRegen || 0);
      const mpR = inCombat ? (c.cls === 'mage' ? 1.4 + (c.stats.a.wil - 10) * 0.04 : 1.8 + (c.stats.a.wil - 10) * 0.05) + (c.stats.mpRegen || 0) - upkeep : c.stats.mpMax * 0.06;
      if (!noRegen) c.hp = Math.min(c.stats.hpMax, c.hp + hpR * dt);
      c.mp = clamp(c.mp + mpR * dt, 0, c.stats.mpMax);
    } else if (c.faction === 'hostile') {
      if (!c.aware) c.hp = Math.min(c.stats.hpMax, c.hp + c.stats.hpMax * 0.04 * dt);
      c.mp = Math.min(c.stats.mpMax, c.mp + 2 * dt);
    }
    if (c.cast) {
      if (incap(c)) { c.cast = null; return; }
      c.cast.t -= dt;
      if (c.cast.t <= 0) {
        const k = c.cast;
        c.cast = null;
        const t = k.tgt ? this.ents.find(e => e.uid === k.tgt) : null;
        if (!t || !t.dead || D.AB[k.id].tgt === 'ground') {
          if (!this.canUse(c, k.id, t && t !== c ? t : null)) this.performAbility(c, k.id, t, t ? t.x : k.x, t ? t.z : k.z);
          if (t && isFoeOf(c, t) && !c.order) c.order = { type: 'attack', uid: t.uid, ai: k.ai };
        }
      }
      return;
    }
    if (incap(c)) { c.path = null; c.moving = false; return; }
  };

  G.checkAwareness = function () {
    const party = this.party.filter(alive);
    for (const e of this.ents) {
      if (e.faction !== 'hostile' || e.aware || e.dead || e.down) continue;
      const range = e.asleep ? 4 : SIGHT;
      for (const p of party) {
        const d = dist(e.x, e.z, p.x, p.z);
        if (d > range) continue;
        if (p.sustained.includes('stealth') && d > 2.5) continue;
        if (!D.sightLine(this.L.nav, e.x, e.z, p.x, p.z)) continue;
        this.alert(e, p);
        break;
      }
    }
  };

  G.checkTriggers = function () {
    const l = this.leader;
    if (!l || this.mode !== 'play') return;
    for (const o of this.objs) {
      if (o.t !== 'trig' || o.fired || !this.objOn(o)) continue;
      if (l.x >= o.x && l.x < o.x + o.w && l.z >= o.z && l.z < o.z + o.d) {
        if (o.req && !this.cond(o.req)) continue;
        if (o.once) { o.fired = true; this.stateFor(this.areaId).trig[o.sk] = 1; }
        else { o.fired = true; o.refire = 2; }
        if (o.dlg) { const sp = o.speaker ? this.npcEnt(o.speaker) : null; this.startDialog(o.dlg, sp); }
        else if (o.run) this.runScript(o.run, { obj: o });
        return;
      }
    }
    for (const o of this.objs) if (o.t === 'trig' && !o.once && o.fired) {
      if (!(l.x >= o.x && l.x < o.x + o.w && l.z >= o.z && l.z < o.z + o.d)) o.fired = false;
    }
  };

  G.updateFields = function (dt) {
    for (const f of this.fields) {
      f.t -= dt;
      f.acc = (f.acc || 0) + dt;
      if (f.acc < 1) continue;
      f.acc -= 1;
      const src = this.ents.find(e => e.uid === f.src) || null;
      for (const e of this.ents) {
        if (!alive(e) || e.faction === 'neutral') continue;
        if (dist(e.x, e.z, f.x, f.z) > f.r) continue;
        if (e.faction === f.fac && this.difficulty === 'easy') continue;
        this.damage(src, e, e.faction === f.fac ? f.dps * 0.5 : f.dps, f.el, { noBlood: true });
        if (f.slow && alive(e)) this.addEffect(e, { id: 'field_slow', mods: { move: -0.4 }, dur: 1.2 });
      }
    }
    this.fields = this.fields.filter(f => f.t > 0);
    for (const tr of this.traps) {
      for (const e of this.ents) {
        if (e.faction !== 'hostile' || !alive(e)) continue;
        if (dist(e.x, e.z, tr.x, tr.z) < 0.9) {
          tr.done = true;
          const src = this.ents.find(x => x.uid === tr.src) || null;
          this.damage(src, e, tr.base, 'phys');
          if (alive(e)) this.tryStatus(src, e, tr.st, tr.dur, 'none');
          this.emit('fx', { fx: 'impact', kind: 'trap', x: tr.x, z: tr.z, y: e.y });
          this.sound('trap_snap');
          break;
        }
      }
    }
    this.traps = this.traps.filter(t => !t.done);
  };

  G.npcIdle = function (e, dt) {
    if (e.following) {
      const l = this.leader;
      if (l && dist(e.x, e.z, l.x, l.z) > 3) {
        e.repath = (e.repath || 0) - dt;
        if (!e.path || e.repath <= 0) { this.pathTo(e, l.x, l.z, 4); e.repath = 0.8; }
        this.moveAlong(e, dt);
      } else { e.path = null; e.moving = false; }
      return;
    }
    if (e.scriptMove) {
      if (!e.path) this.pathTo(e, e.scriptMove[0], e.scriptMove[1], 4);
      if (this.moveAlong(e, dt, e.scriptMove[2] || 1) || !e.path) { e.scriptMove = null; e.moving = false; if (e.scriptFace !== undefined) { e.face = e.scriptFace; e.scriptFace = undefined; } }
      return;
    }
    if (e.patrol && e.faction !== 'party') {
      e.pi = e.pi || 0;
      const p = e.patrol[e.pi % e.patrol.length];
      if (!e.path) this.pathTo(e, p[0] + 0.5, p[1] + 0.5, 3);
      if (this.moveAlong(e, dt, 0.5) || !e.path) { e.pi++; e.path = null; e.wait = 2; }
      return;
    }
    if (e.wander && !this.combat) {
      e.wait = (e.wait || this.rng.range(2, 6)) - dt;
      if (e.path) { if (this.moveAlong(e, dt, 0.45)) { e.path = null; e.moving = false; } return; }
      if (e.wait <= 0) {
        const tx = e.home[0] + this.rng.range(-e.wander, e.wander), tz = e.home[1] + this.rng.range(-e.wander, e.wander);
        if (this.L.nav.okAt(tx, tz)) this.pathTo(e, tx, tz, 2);
        e.wait = this.rng.range(3, 8);
      }
    }
    e.moving = false;
  };

  G.sim = function (dt) {
    if (this._pmDirty || !this._pm) { this._pm = this.partyMods(); this._pmDirty = false; for (const c of this.party) this.refresh(c); }
    this.thinkT = (this.thinkT || 0) - dt;
    const think = this.thinkT <= 0;
    if (think) this.thinkT = 0.35;
    for (const e of this.ents) { e.moving = false; this.updateEnt(e, dt); }
    this.checkAwareness();
    const anyAware = this.ents.some(e => e.faction === 'hostile' && alive(e) && e.aware);
    if (anyAware && !this.combat) this.startCombat();
    if (!anyAware && this.combat) this.endCombat();
    this.party.forEach((c, i) => {
      if (!alive(c) || incap(c) || c.cast) return;
      const isLead = c === this.leader;
      if (isLead && !this.auto) {
        if (c.dirMove) {
          const [mx, mz] = c.dirMove;
          const sp = c.stats.move * dt;
          this.stepMove(c, mx * sp, mz * sp);
          c.face = turnToward(c.face, Math.atan2(mx, mz), dt * 12);
          c.moving = true;
          c.order = null; c.path = null;
          return;
        }
        if (this.combat && !c.order && c.target && c.autoAttack !== false) {
          const t = this.ents.find(e => e.uid === c.target);
          if (t && isFoeOf(c, t) && dist(c.x, c.z, t.x, t.z) < (c.stats.range || c.stats.reach) + 0.5) c.order = { type: 'attack', uid: t.uid };
        }
      } else if (think) this.partyThink(c);
      if (c.order) this.actOrder(c, dt);
      else if (!isLead && !this.holdPos && (!this.combat || c.behavior === 'passive')) this.followLeader(c, i, dt);
    });
    for (const e of this.ents) {
      if (e.faction === 'party' || !alive(e)) continue;
      if (incap(e) || e.cast) continue;
      if (e.faction === 'hostile' && e.aware) {
        if (think || !e.order) this.hostileThink(e);
        if (e.order) this.actOrder(e, dt);
        continue;
      }
      if (e.faction === 'ally' && (this.combat || e.order)) {
        if (think) this.allyThink(e);
        if (e.order) { this.actOrder(e, dt); continue; }
      }
      this.npcIdle(e, dt);
    }
    this.separate(dt);
    this.updateProjectiles(dt);
    this.updateFields(dt);
    for (const e of this.ents) if (e.grabbedBy) {
      const o = this.ents.find(x => x.uid === e.grabbedBy);
      if (o && !o.dead) { e.x = o.x + Math.sin(o.face) * 1.2; e.z = o.z + Math.cos(o.face) * 1.2; e.y = o.y + 1.6; }
    }
    this.checkTriggers();
    for (const e of this.ents) if (e.threat) for (const k in e.threat) e.threat[k] *= Math.pow(0.97, dt);
  };

  G.update = function (dt) {
    dt = Math.min(dt, 0.1);
    if (this.mode === 'loading' || this.mode === 'dead' || this.mode === 'end') return;
    if (this.mode === 'map') return;
    this.updateCoros(this.paused ? 0 : dt);
    if (this.paused || this.mode === 'dialog' || this.loot || this.shop || this.slides) {
      if (this.mode === 'dialog' || this.slides) for (const e of this.ents) if (e.animT !== undefined) e.animT += dt;
      return;
    }
    this.time += dt;
    this.playTime += dt;
    this.sim(dt);
  };

  Object.assign(D, { alive, incap, isFoeOf, ST_NAME, INCAP });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
