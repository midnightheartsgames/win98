(function (A) {
  'use strict';
  const ATK = { blade: 'mig', strike: 'mig', blaster: 'mig', ion: 'mig', shock: 'wil', mind: 'wil' };
  const DEF = { blade: 'sta', strike: 'sta', blaster: 'sta', ion: 'sta', shock: 'sta', mind: 'wil' };
  const ROWS = ['front', 'back'];

  A.stats = (id, level) => {
    const h = A.HEROES[id], out = {};
    for (const k of Object.keys(h.base)) out[k] = Math.round(h.base[k] + h.grow[k] * level);
    return out;
  };
  A.xpFor = level => (level <= 1 ? 0 : Math.round(24 * Math.pow(level, 1.8)));
  A.levelFor = xp => {
    let l = 1;
    while (l < 50 && A.xpFor(l + 1) <= xp) l++;
    return l;
  };

  A.Party = {
    member(id, level) {
      const st = A.stats(id, level);
      return { id, level, xp: A.xpFor(level), hp: st.hp, fp: st.fp, deflect: 1 };
    },
    ensure(S) {
      if (!S.party.length && !S.flags.forgot) S.party = [A.Party.member('aayla', 15), A.Party.member('vos', 17)];
      if (!S.flags.kit_pro && !S.flags.forgot) {
        S.items.bacta = (S.items.bacta || 0) + 2;
        S.items.stim = (S.items.stim || 0) + 1;
        S.flags.kit_pro = true;
      }
      return S.party;
    },
    recover(m) {
      const st = A.stats(m.id, m.level), rate = A.RECOVER.hpPerFp;
      const fp = Math.min(m.fp, Math.ceil(Math.max(0, st.hp - m.hp) / rate));
      const hp = Math.min(st.hp - m.hp, fp * rate);
      m.hp += hp;
      m.fp -= fp;
      return { hp, fp };
    },
    rest(S) {
      for (const m of S.party) {
        const st = A.stats(m.id, m.level);
        m.hp = st.hp;
        m.fp = st.fp;
      }
    },
    forget(S) {
      const was = S.party.find(m => m.id === 'aayla') || A.Party.member('aayla', 15);
      const lost = (was.skills || A.HEROES.aayla.skills).filter(id => !A.BASIC_SKILLS.includes(id));
      const m = A.Party.member('aayla', 1);
      m.skills = [];
      S.party = [m];
      S.items = {};
      S.flags.forgot = true;
      return { level: was.level, lost };
    }
  };

  A.Battle = class {
    constructor(opts) {
      const S = this.S = opts.S;
      this.groupId = opts.group;
      this.group = A.GROUPS[opts.group];
      if (!this.group) throw new Error('no group ' + opts.group);
      this.seed = opts.seed || 1;
      this.rnd = A.rng(this.seed);
      this.diff = A.DIFFICULTY[opts.difficulty || S.difficulty || 'normal'];
      this.help = !!opts.help;
      this.noFlee = !!opts.noFlee;
      this.hazard = this.group.hazard;
      this.braceUp = this.hazard === 'brace';
      this.items = Object.assign({}, S.items);
      if (!S.flags.known) S.flags.known = {};
      this.known = S.flags.known;
      this.units = [];
      this.n = 0;
      for (const [i, m] of S.party.entries()) {
        const h = A.HEROES[m.id], st = A.stats(m.id, m.level), boost = this.help ? 1.25 : 1;
        this.units.push({
          id: m.id, side: 'party', key: m.id, name: h.name, look: h.look, slot: i, row: 'party', level: m.level,
          hp: Math.max(1, Math.round(Math.min(st.hp, m.hp) * boost)), maxhp: Math.round(st.hp * boost), fp: Math.round(Math.min(st.fp, m.fp) * boost), maxfp: Math.round(st.fp * boost),
          mig: st.mig, wil: st.wil, agi: st.agi, sta: st.sta, tempo: h.tempo ? 0 : null, skills: m.skills || h.skills, deflectLevel: m.deflect || 1,
          status: {}, next: 0, evade: false, deflect: null
        });
      }
      for (const [type, row, slot] of this.group.units) this.addEnemy(type, row, slot);
      const adv = opts.advantage || 'none';
      this.advantage = adv;
      for (const u of this.units) {
        const d = this.delay(u), mine = (adv === 'party' && u.side === 'party') || (adv === 'enemy' && u.side === 'enemy');
        u.next = adv === 'none' ? d * 0.5 : mine ? d * 0.05 * (u.slot + 1) : d;
      }
      if (adv === 'party') {
        const e = this.enemies().sort((a, b) => (a.row === 'front' ? 0 : 1) - (b.row === 'front' ? 0 : 1) || a.slot - b.slot)[0];
        if (e) { e.breach = true; e.next += this.delay(e) * 0.5; }
      }
      this.darkDelta = 0;
      this.talked = 0;
      this.turns = {};
      this.over = null;
      this.turn = null;
      this.ready = false;
      this.log = [];
    }

    addEnemy(type, row, slot) {
      const d = A.ENEMIES[type];
      const e = {
        id: type + '_' + (this.n++), side: 'enemy', key: type, name: d.name, kind: d.kind, look: d.look, beast: d.beast, weapon: d.weapon,
        row, slot, hp: Math.round(d.hp * this.diff.hp), maxhp: Math.round(d.hp * this.diff.hp), fp: 0, maxfp: 0,
        mig: d.mig, wil: d.wil, agi: d.agi, sta: d.sta, ai: d.ai, weight: d.weight, boss: !!d.boss, elite: !!d.elite,
        status: {}, next: 0, queue: [], talked: false, rage: false, disarmed: 0, pushes: 0, hazardCool: 0, breach: false, cycle: 0
      };
      this.units.push(e);
      return e;
    }

    delay(u) { return 1000 / u.agi; }
    active(u) { return u && u.hp > 0 && !u.gone; }
    enemies() { return this.units.filter(u => u.side === 'enemy' && this.active(u)); }
    heroes() { return this.units.filter(u => u.side === 'party' && this.active(u)); }
    unit(id) { return this.units.find(u => u.id === id); }
    inRow(row) { return this.enemies().filter(e => e.row === row); }
    rnd01() { return this.rnd(); }

    order(list) {
      return list.slice().sort((a, b) => a.next - b.next || (a.side === b.side ? a.slot - b.slot : a.side === 'party' ? -1 : 1));
    }

    current() {
      return this.order(this.units.filter(u => this.active(u)))[0] || null;
    }

    timeline(n) {
      const sim = this.units.filter(u => this.active(u)).map(u => ({ u, next: u.next, side: u.side, slot: u.slot }));
      const out = [];
      for (let i = 0; i < n && sim.length; i++) {
        sim.sort((a, b) => a.next - b.next || (a.side === b.side ? a.slot - b.slot : a.side === 'party' ? -1 : 1));
        out.push(sim[0].u.id);
        sim[0].next += this.delay(sim[0].u);
      }
      return out;
    }

    forecast(u, skillId, n) {
      const keep = u.next, sk = A.SKILLS[skillId];
      u.next += this.delay(u) * (sk && sk.weight ? sk.weight : 1);
      const out = this.timeline(n || 8);
      u.next = keep;
      return out;
    }

    shotsBefore(id, list) {
      const end = list.indexOf(id);
      return list.slice(0, end < 0 ? list.length : end).filter(x => {
        const e = this.unit(x);
        return e && e.side === 'enemy' && e.ai === 'shooter' && !e.disarmed;
      }).length;
    }

    freeSlot(row, prefer) {
      const used = new Set(this.inRow(row).map(e => e.slot));
      if (prefer !== undefined && !used.has(prefer)) return prefer;
      for (const s of [1, 0, 2]) if (!used.has(s)) return s;
      return null;
    }

    mult(t, type) {
      if (t.side !== 'enemy') return 1;
      const d = A.ENEMIES[t.key], k = A.ENEMY_KINDS[t.kind] || A.ENEMY_KINDS.sentient;
      if (k.immune.includes(type)) return 0;
      if (k.weak.includes(type) || (d.weak || []).includes(type)) return 1.5;
      if (k.resist.includes(type) || (d.resist || []).includes(type)) return 0.5;
      return 1;
    }

    weakness(key) {
      const d = A.ENEMIES[key], k = A.ENEMY_KINDS[d.kind] || A.ENEMY_KINDS.sentient;
      return { weak: [...new Set([...k.weak, ...(d.weak || [])])], resist: [...new Set([...k.resist, ...(d.resist || [])])], immune: k.immune.slice() };
    }

    damage(src, tgt, skill, scale) {
      let atk = src[skill.atk || ATK[skill.type]];
      if (src.status.fear) atk *= 0.7;
      if (src.rage) atk *= 1.25;
      let def = tgt[DEF[skill.type]];
      if (tgt.rage) def *= 0.75;
      const mult = this.mult(tgt, skill.type);
      let dmg = skill.power * (scale || 1) * atk / (atk + def) * mult * (0.95 + this.rnd01() * 0.1);
      if (src.side === 'enemy') dmg *= this.diff.dmg;
      if (src.status.blind && skill.type === 'blaster') dmg *= 0.5;
      let breached = false;
      if (tgt.breach && mult > 0) { dmg *= 1.25; tgt.breach = false; breached = true; }
      if (tgt.guard) dmg *= 0.5;
      return { dmg: mult > 0 ? Math.max(1, Math.round(dmg)) : 0, weak: mult > 1, resist: mult > 0 && mult < 1, immune: mult === 0, breached };
    }

    aayla() { return this.units.find(u => u.id === 'aayla' && this.active(u)); }

    gainTempo(n) {
      const a = this.aayla();
      if (a && a.tempo !== null) a.tempo = Math.min(5, a.tempo + n);
    }

    hurt(tgt, dmg, ev) {
      tgt.hp = Math.max(0, tgt.hp - dmg);
      if (tgt.hp === 0) {
        if (tgt.side === 'enemy') tgt.gone = 'dead';
        ev.push({ type: 'down', target: tgt.id });
      }
    }

    strike(src, tgt, skillId, ev, scale) {
      const skill = A.SKILLS[skillId];
      const cort = (A.ENEMY_KINDS[tgt.kind] || {}).cortosis && skill.type === 'blade';
      const r = this.damage(src, tgt, skill, scale);
      if (cort) {
        r.dmg = 0;
        r.immune = true;
        src.status.saberOff = 1;
      }
      const e = { type: 'strike', who: src.id, target: tgt.id, skill: skillId, dmg: r.dmg, weak: r.weak, resist: r.resist, immune: r.immune, breached: r.breached, cortosis: cort };
      ev.push(e);
      this.hurt(tgt, r.dmg, ev);
      if (r.weak && this.active(tgt)) {
        tgt.breach = true;
        tgt.next += this.delay(tgt) * 0.5;
        this.gainTempo(1);
        e.breach = true;
      }
      return r;
    }

    reveal(key) {
      this.known[key] = { weak: true, nrav: true };
    }

    plan(u) {
      const heroes = this.heroes();
      if (!heroes.length) return { skill: 'wait' };
      const pick = () => {
        const a = heroes.find(h => h.id === 'aayla');
        if (a && heroes.length > 1 && this.rnd01() < 0.55) return a.id;
        return heroes[Math.floor(this.rnd01() * heroes.length)].id;
      };
      if (u.ai === 'shooter') {
        if (u.disarmed > 0) return u.row === 'front' ? { skill: 'punch', target: pick() } : { skill: 'search' };
        return { skill: 'shot', target: pick() };
      }
      if (u.ai === 'melee' || u.ai === 'biter') {
        if (u.row === 'back') return this.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'wait' };
        return { skill: u.ai === 'biter' ? 'bite' : 'stab', target: pick() };
      }
      if (u.ai === 'spiderboss') {
        u.cycle++;
        const step = ['bigbite', 'web', 'bigbite', 'swarm'][(u.cycle - 1) % 4];
        if (step === 'swarm') return this.freeSlot('front') !== null ? { skill: 'swarm' } : { skill: 'bigbite', target: pick() };
        return { skill: step, target: pick() };
      }
      return { skill: 'wait' };
    }

    intents(u) {
      while (u.queue.length < 2) u.queue.push(this.plan(u));
      return u.queue.map(q => ({ skill: q.skill, name: A.SKILLS[q.skill].name, target: q.target || null }));
    }

    startTurn(u, ev) {
      ev.push({ type: 'turn', who: u.id });
      if (u.side === 'party') {
        u.deflect = null;
        u.guard = false;
        const regen = Math.round(u.maxfp * 0.05 * (u.status.calm ? 2 : 1));
        u.fp = Math.min(u.maxfp, u.fp + regen);
      }
      if (u.status.poison) {
        const d = Math.max(1, Math.round(u.maxhp * 0.05));
        ev.push({ type: 'poison', target: u.id, dmg: d });
        this.hurt(u, d, ev);
        u.status.poison--;
        if (!u.status.poison) delete u.status.poison;
        if (!this.active(u)) return true;
      }
      for (const k of ['fear', 'blind', 'calm', 'saberOff']) {
        if (u.status[k]) { u.status[k]--; if (!u.status[k]) delete u.status[k]; }
      }
      u.pushes = 0;
      if (u.status.stun) {
        delete u.status.stun;
        if (u.tempo !== null && u.tempo !== undefined) u.tempo = 0;
        ev.push({ type: 'stunned', who: u.id });
        u.next += this.delay(u);
        return true;
      }
      if (u.side === 'party') this.turns[u.id] = (this.turns[u.id] || 0) + 1;
      return false;
    }

    proceed(ev) {
      for (let guard = 0; guard < 400 && !this.over; guard++) {
        const u = this.current();
        if (!u) break;
        if (this.turn !== u.id) { this.turn = u.id; this.ready = false; }
        if (!this.ready) {
          const skip = this.startTurn(u, ev);
          this.ready = true;
          if (this.check(ev)) break;
          if (skip) { this.turn = null; continue; }
        }
        if (u.side === 'party') return ev;
        this.enemyAct(u, ev);
        u.next += this.delay(u);
        this.turn = null;
        if (this.check(ev)) break;
      }
      return ev;
    }

    begin() { return this.proceed([]); }

    enemyAct(u, ev) {
      let a = u.queue.length ? u.queue.shift() : this.plan(u);
      const tgtOk = q => !q.target || this.active(this.unit(q.target));
      const rowOk = q => !A.SKILLS[q.skill].melee || u.row === 'front' || u.ai === 'spiderboss';
      if (!tgtOk(a) || !rowOk(a) || (a.skill === 'shot' && u.disarmed > 0) || (a.skill === 'advance' && this.freeSlot('front', u.slot) === null)) a = this.plan(u);
      if (a.target && !this.active(this.unit(a.target))) a.target = (this.heroes()[0] || {}).id;
      const sk = A.SKILLS[a.skill];
      if (a.skill === 'advance') {
        const s = this.freeSlot('front', u.slot);
        ev.push({ type: 'move', target: u.id, from: [u.row, u.slot], to: ['front', s], how: 'advance' });
        u.row = 'front';
        u.slot = s;
      } else if (a.skill === 'swarm') {
        const s = this.freeSlot('front');
        if (s !== null) {
          const e = this.addEnemy(sk.summon, 'front', s);
          e.next = u.next + this.delay(e) * 0.5;
          ev.push({ type: 'summon', who: u.id, target: e.id });
        }
      } else if (a.skill === 'search' || a.skill === 'wait') {
        ev.push({ type: 'idle', who: u.id, skill: a.skill });
      } else {
        const tgt = this.unit(a.target);
        if (tgt) this.enemyHit(u, tgt, a.skill, ev);
      }
      if (u.disarmed > 0) u.disarmed--;
      if (u.hazardCool > 0) u.hazardCool--;
    }

    enemyHit(u, tgt, skillId, ev) {
      const sk = A.SKILLS[skillId];
      if (tgt.evade) {
        tgt.evade = false;
        ev.push({ type: 'evade', who: u.id, target: tgt.id, skill: skillId });
        return;
      }
      const r = this.damage(u, tgt, sk);
      if (sk.deflect && tgt.deflect && tgt.deflect.charges > 0) {
        tgt.deflect.charges--;
        const back = Math.max(1, Math.round(r.dmg * tgt.deflect.share));
        ev.push({ type: 'shot', who: u.id, target: tgt.id, dmg: 0, deflected: back });
        this.hurt(u, back, ev);
        this.gainTempo(1);
        return;
      }
      ev.push({ type: sk.ranged ? 'shot' : 'strike', who: u.id, target: tgt.id, skill: skillId, dmg: r.dmg });
      this.hurt(tgt, r.dmg, ev);
      if (!this.active(tgt)) return;
      if (sk.poison && !tgt.status.poison) { tgt.status.poison = 3; ev.push({ type: 'status', target: tgt.id, status: 'poison' }); }
      if (sk.stun) { tgt.status.stun = true; ev.push({ type: 'status', target: tgt.id, status: 'stun' }); }
    }

    check(ev) {
      if (this.over) return true;
      if (!this.enemies().length) {
        this.over = 'win';
        this.rewards = this.reward();
        ev.push({ type: 'victory', rewards: this.rewards });
        return true;
      }
      if (!this.heroes().length) {
        this.over = 'lose';
        ev.push({ type: 'defeat' });
        return true;
      }
      return false;
    }

    reward() {
      let xp = 0, credits = 0;
      for (const e of this.units.filter(u => u.side === 'enemy' && (u.gone || u.hp <= 0))) {
        const d = A.ENEMIES[e.key];
        xp += d.xp;
        if (e.gone !== 'fell' && e.gone !== 'trapped') credits += d.credits;
      }
      return { xp, credits, talked: this.talked, dark: this.darkDelta };
    }

    cost(u, skillId) {
      const sk = A.SKILLS[skillId];
      return { fp: sk.fp || 0, tempo: sk.tempo || 0 };
    }

    targets(u, skillId) {
      const sk = A.SKILLS[skillId];
      const all = this.enemies();
      switch (sk.target) {
        case 'front': return all.filter(e => e.row === 'front').map(e => e.id);
        case 'any':
        case 'enemy': return all.map(e => e.id);
        case 'row': return ROWS.filter(r => all.some(e => e.row === r));
        case 'back': return this.freeSlot('front') === null ? [] : all.filter(e => e.row === 'back').map(e => e.id);
        case 'shooter': return all.filter(e => e.ai === 'shooter' && !e.disarmed).map(e => e.id);
        case 'talk': return all.filter(e => e.kind !== 'beast' && e.kind !== 'droid' && !e.talked && !e.rage).map(e => e.id);
        case 'frontAll': return all.some(e => e.row === 'front') ? ['frontAll'] : [];
        case 'self': return [u.id];
        case 'none': return sk.needs === 'brace' && !this.braceUp ? [] : ['none'];
      }
      return [];
    }

    commands(u) {
      const out = [];
      for (const id of u.skills) {
        const sk = A.SKILLS[id], c = this.cost(u, id);
        let why = null;
        if (sk.needs === 'brace' && !this.braceUp) continue;
        if (u.status.saberOff && sk.type === 'blade') why = 'клинок погас';
        else if (c.fp > u.fp) why = 'не хватает Силы';
        else if (c.tempo > (u.tempo || 0)) why = 'не хватает Темпа';
        else if (!this.targets(u, id).length) why = 'нет цели';
        out.push({ id, name: sk.name, menu: sk.menu, fp: c.fp, tempo: c.tempo, enabled: !why, why, about: sk.about });
      }
      for (const [id, n] of Object.entries(this.items)) {
        if (!n || !A.ITEMS[id]) continue;
        const it = A.ITEMS[id];
        let why = null;
        if (it.tempo && !this.aayla()) why = 'нет Эйлы';
        out.push({ id: 'item:' + id, name: `${it.name} ×${n}`, menu: 'items', enabled: !why, why, about: it.about });
      }
      const stay = this.group.boss ? 'с боссом нельзя' : this.noFlee ? 'отступать некуда' : null;
      out.push({ id: 'flee', name: 'Отход', menu: 'flee', enabled: !stay, why: stay, about: 'уйти из боя' });
      return out;
    }

    act(skillId, target, extra) {
      const u = this.current();
      if (!u || u.side !== 'party' || this.over) throw new Error('not a party turn');
      const ev = [];
      const opt = this.commands(u).find(c => c.id === skillId);
      if (!opt || !opt.enabled) throw new Error('command not available: ' + skillId + (opt ? ' (' + opt.why + ')' : ''));
      let weight = 1;
      if (skillId === 'flee') {
        this.over = 'flee';
        ev.push({ type: 'escape' });
        return ev;
      }
      if (skillId.startsWith('item:')) {
        const id = skillId.slice(5), it = A.ITEMS[id];
        const tgt = this.unit(target) || u;
        this.items[id]--;
        if (it.heal) {
          const h = Math.round(tgt.maxhp * it.heal);
          tgt.hp = Math.min(tgt.maxhp, tgt.hp + h);
          ev.push({ type: 'heal', target: tgt.id, amount: h, item: id });
        }
        if (it.tempo) { this.gainTempo(it.tempo); ev.push({ type: 'tempo', target: 'aayla', amount: it.tempo, item: id }); }
        if (it.cure) { delete tgt.status[it.cure]; ev.push({ type: 'cure', target: tgt.id, status: it.cure }); }
      } else {
        const sk = A.SKILLS[skillId];
        const valid = this.targets(u, skillId);
        if (!valid.includes(target)) {
          if (valid.length === 1 && (target === undefined || target === null)) target = valid[0];
          else throw new Error('bad target ' + target + ' for ' + skillId);
        }
        weight = sk.weight || 1;
        u.fp -= sk.fp || 0;
        if (sk.tempo) u.tempo -= sk.tempo;
        ev.push({ type: 'use', who: u.id, skill: skillId, target });
        this.perform(u, skillId, target, ev, extra || {});
      }
      u.next += this.delay(u) * weight;
      this.turn = null;
      if (this.check(ev)) return ev;
      return this.proceed(ev);
    }

    perform(u, id, target, ev, extra) {
      const tgt = this.unit(target);
      switch (id) {
        case 'blade': {
          const r = this.strike(u, tgt, id, ev);
          if (r.dmg > 0 && u.tempo !== null) this.gainTempo(1);
          return;
        }
        case 'combo':
          for (let i = 0; i < 2 && this.active(tgt); i++) this.strike(u, tgt, id, ev);
          return;
        case 'leap':
        case 'vlightning':
          this.strike(u, tgt, id, ev);
          return;
        case 'throw':
          for (const e of this.inRow(target)) this.strike(u, e, id, ev);
          return;
        case 'whirl':
          for (const e of this.inRow('front')) this.strike(u, e, id, ev);
          return;
        case 'roll':
          u.evade = true;
          ev.push({ type: 'stance', who: u.id, stance: 'evade' });
          return;
        case 'push': {
          const r = this.strike(u, tgt, id, ev);
          if (this.active(tgt)) this.shove(tgt, r.dmg, A.SKILLS.push.level, ev);
          return;
        }
        case 'pull': {
          const s = this.freeSlot('front', tgt.slot);
          ev.push({ type: 'move', target: tgt.id, from: [tgt.row, tgt.slot], to: ['front', s], how: 'pull' });
          tgt.row = 'front';
          tgt.slot = s;
          return;
        }
        case 'disarm':
          tgt.disarmed = 2;
          ev.push({ type: 'status', target: tgt.id, status: 'disarmed' });
          return;
        case 'sense':
          for (const e of this.enemies()) this.reveal(e.key);
          ev.push({ type: 'reveal', targets: this.enemies().map(e => e.id) });
          return;
        case 'brace': {
          this.braceUp = false;
          const hit = [];
          for (const e of this.inRow('back')) {
            if (e.boss || e.elite) {
              const dmg = Math.round(e.maxhp * (e.boss ? 0.15 : 0.4));
              hit.push([e.id, e.boss ? 'boss' : 'elite', dmg]);
              if (e.boss) e.next += this.delay(e) * 0.5;
            } else { e.gone = 'trapped'; hit.push([e.id, 'out', 0]); }
          }
          ev.push({ type: 'collapse', hit });
          for (const [id, , dmg] of hit) if (dmg) this.hurt(this.unit(id), dmg, ev);
          return;
        }
        case 'deflect': {
          const lv = A.STANCE.deflect[Math.max(0, Math.min(2, (u.deflectLevel || 1) - 1))];
          u.deflect = { charges: lv.charges, share: lv.share };
          ev.push({ type: 'stance', who: u.id, stance: 'deflect', charges: lv.charges });
          return;
        }
        case 'guard':
          u.guard = true;
          ev.push({ type: 'stance', who: u.id, stance: 'guard' });
          return;
        case 'focus':
          u.fp = Math.min(u.maxfp, u.fp + Math.round(u.maxfp * 0.3));
          u.status.calm = 2;
          ev.push({ type: 'stance', who: u.id, stance: 'focus' });
          return;
        case 'read': {
          this.reveal(tgt.key);
          ev.push({ type: 'read', who: u.id, target: tgt.id, intents: this.intents(tgt) });
          return;
        }
        case 'talk':
          this.talk(u, tgt, extra.approach || 'persuade', ev);
          return;
      }
      throw new Error('unknown skill ' + id);
    }

    shove(tgt, dmg, level, ev) {
      if (tgt.weight === 'heavy' && level < 3) {
        tgt.pushes++;
        if (tgt.pushes < 2) { ev.push({ type: 'resist', target: tgt.id }); return; }
      }
      const collide = () => {
        const extra = Math.max(1, Math.round(dmg * 0.5));
        ev.push({ type: 'collide', target: tgt.id, dmg: extra });
        this.hurt(tgt, extra, ev);
        tgt.next += this.delay(tgt) * 0.3;
      };
      if (tgt.row === 'front') {
        const s = this.freeSlot('back', tgt.slot);
        if (s === null) return collide();
        ev.push({ type: 'move', target: tgt.id, from: ['front', tgt.slot], to: ['back', s], how: 'push' });
        tgt.row = 'back';
        tgt.slot = s;
        return;
      }
      if (!this.hazard || this.hazard === 'brace') return collide();
      if (tgt.boss) {
        if (tgt.hazardCool > 0) return collide();
        tgt.hazardCool = 3;
        const dmg = Math.round(tgt.maxhp * 0.15);
        ev.push({ type: 'fall', target: tgt.id, hazard: this.hazard, kind: 'boss', dmg });
        this.hurt(tgt, dmg, ev);
        tgt.next += this.delay(tgt) * 0.5;
        return;
      }
      if (tgt.elite) {
        const dmg = Math.round(tgt.maxhp * 0.4);
        ev.push({ type: 'fall', target: tgt.id, hazard: this.hazard, kind: 'elite', dmg });
        this.hurt(tgt, dmg, ev);
        return;
      }
      tgt.gone = 'fell';
      ev.push({ type: 'fall', target: tgt.id, hazard: this.hazard, kind: 'out' });
    }

    canPersuade() {
      return A.ARGUMENTS.some(f => this.S.flags[f]);
    }

    approaches(tgt) {
      const d = A.ENEMIES[tgt.key];
      return Object.keys(A.TALK.approaches).map(a => {
        let why = null;
        if (a === 'persuade' && !this.canPersuade()) why = 'нет довода';
        if (a === 'mind' && d.strongMind) why = 'не поддаётся внушению';
        return { id: a, name: A.TALK.approaches[a], enabled: !why, why };
      });
    }

    talk(u, tgt, approach, ev) {
      const d = A.ENEMIES[tgt.key];
      tgt.talked = true;
      let out = A.TALK.table[d.nrav][approach];
      if (approach === 'persuade' && !this.canPersuade()) out = 'rage';
      if (approach === 'mind' && (d.strongMind || u.wil < (d.resolve || 0) * (d.twilek ? 1.25 : 1))) out = 'rage';
      if (approach === 'threat') this.darkDelta += 1;
      this.reveal(tgt.key);
      ev.push({ type: 'talk', who: u.id, target: tgt.id, approach, outcome: out, say: A.TALK.say[approach], reply: A.TALK.reply[out] });
      if (out === 'rage') { tgt.rage = true; return; }
      tgt.gone = 'talked';
      this.talked++;
      this.darkDelta -= 1;
      if (out === 'info') this.S.flags['info_' + this.groupId] = true;
    }

    finish() {
      const S = this.S, res = { xp: 0, levels: [], credits: 0, dark: 0, recovered: [] };
      if (this.over === 'win') Object.assign(res, this.rewards);
      for (const m of S.party) {
        const u = this.unit(m.id);
        if (!u) continue;
        const k = this.help ? 1 / 1.25 : 1;
        m.hp = Math.max(1, Math.round(u.hp * k));
        m.fp = Math.max(0, Math.round(u.fp * k));
        if (this.over === 'win') {
          m.xp += res.xp;
          const lv = A.levelFor(m.xp);
          if (lv > m.level) { res.levels.push([m.id, lv]); m.level = lv; }
          const r = A.Party.recover(m);
          if (r.hp) res.recovered.push([m.id, r.hp, r.fp]);
        }
      }
      S.items = Object.assign({}, this.items);
      if (this.over === 'win') {
        S.credits = (S.credits || 0) + res.credits;
        S.dark = A.clamp(S.dark + res.dark, 0, 100);
      }
      return res;
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
