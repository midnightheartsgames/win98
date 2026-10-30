(function (A) {
  'use strict';
  const ATK = { blade: 'mig', strike: 'mig', blaster: 'mig', ion: 'mig', shock: 'wil', mind: 'wil', light: 'wil' };
  const DEF = { blade: 'sta', strike: 'sta', blaster: 'sta', ion: 'sta', shock: 'sta', mind: 'wil', light: 'wil' };
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

  A.heroId = m => m.hero || m.id;

  A.Party = {
    member(id, level, hero) {
      const st = A.stats(hero || id, level), m = { id, level, xp: A.xpFor(level), hp: st.hp, fp: st.fp, deflect: 1 };
      if (hero) m.hero = hero;
      return m;
    },
    ensure(S) {
      if (!S.party.length && !S.flags.forgot) S.party = [A.Party.member('aayla', 15), A.Party.member('vos', 17)];
      if (!S.flags.kit_pro && !S.flags.forgot) {
        S.items.bacta = (S.items.bacta || 0) + 2;
        S.items.stim = (S.items.stim || 0) + 1;
        S.flags.kit_pro = true;
      }
      const a = S.party.find(m => m.id === 'aayla');
      for (const [id, flag, plus] of [['vos', 'with_vos', 2], ['villie', 'with_villie', 0], ['kit', 'with_kit', 3], ['traa', 'with_traa', 3], ['bly', 'with_bly', 0], ['ekria', 'with_ekria', -4]]) {
        const has = S.party.find(m => m.id === id);
        if (!S.flags.forgot) continue;
        if (S.flags[flag] && a && !has) S.party.push(A.Party.member(id, a.level + plus));
        else if (!S.flags[flag] && has) S.party = S.party.filter(m => m.id !== id);
        const m = S.party.find(x => x.id === id);
        if (m && a && m.level < a.level + plus) {
          m.level = a.level + plus;
          m.xp = Math.max(m.xp || 0, A.xpFor(m.level));
        }
      }
      if (S.flags.retinue && a) {
        for (const id of ['anzat_1', 'anzat_2']) if (!S.party.some(m => m.id === id)) S.party.push(A.Party.member(id, a.level, 'anzat'));
      } else S.party = S.party.filter(m => A.heroId(m) !== 'anzat');
      return S.party;
    },
    stats(S, m) {
      const st = A.stats(A.heroId(m), m.level);
      if (m.id === 'aayla') st.wil += A.Memory.will(S);
      return st;
    },
    blade(S, hid) {
      return hid === 'aayla' && S.flags.blade_blue ? A.BLUE_BLADE : A.HEROES[hid].blade;
    },
    blade2(S, hid) {
      return hid === 'aayla' && S.flags.saber_green ? A.GREEN_BLADE : null;
    },
    gain(S, xp) {
      const out = [];
      if (!(xp > 0)) return out;
      for (const m of S.party) {
        if (A.heroId(m) === 'anzat') continue;
        m.xp = (m.xp || 0) + xp;
        const lv = A.levelFor(m.xp);
        if (lv > m.level) { out.push([m.id, lv]); m.level = lv; }
      }
      return out;
    },
    recover(m) {
      const st = A.stats(A.heroId(m), m.level), rate = A.RECOVER.hpPerFp;
      const fp = Math.min(m.fp, Math.ceil(Math.max(0, st.hp - m.hp) / rate));
      const hp = Math.min(st.hp - m.hp, fp * rate);
      m.hp += hp;
      m.fp -= fp;
      return { hp, fp };
    },
    rest(S) {
      for (const m of S.party) {
        const st = A.stats(A.heroId(m), m.level);
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
    },
    look(S, id) {
      const h = A.HEROES[id];
      if (id === 'aayla' && S.cover && A.COVERS[S.cover.id]) return A.COVERS[S.cover.id].look;
      return (h.looks && h.looks[S.chapter]) || h.look;
    },
    skills(S, m) {
      if (A.heroId(m) === 'bly') return (m.skills || A.HEROES.bly.skills).filter(id => id !== 'bcover' || A.Bonds.has(S, 'bly', 3)).concat(A.Bonds.has(S, 'bly', 5) ? ['volley'] : []);
      if (m.id !== 'aayla' || !S.flags.forgot) return m.skills || A.HEROES[A.heroId(m)].skills;
      const known = A.Memory.skills(S).filter(id => A.SKILLS[id] && !A.SKILLS[id].passive);
      const gifts = S.flags.gifts && (S.chapter === 'ch2' || S.dark >= A.DARK_GIFTS_FROM) ? A.GIFTS : [];
      const hand = S.flags.saber && A.reached(S, 'ch3') ? ['blade', 'fists'] : [S.flags.saber ? 'blade' : 'fists'];
      const extra = [];
      if (S.flags.tr_djemso) extra.push('djemso');
      if (A.Bonds.has(S, 'villie', 1) && !S.flags.with_villie) extra.push('bet');
      if (A.Bonds.has(S, 'vos', 3)) extra.push('duo');
      if (A.Bonds.has(S, 'kit', 3)) extra.push('twinwhirl');
      if (S.flags.tr_barrier) extra.push('barrier');
      if (A.Bonds.has(S, 'traa', 3)) extra.push('heal');
      if (A.Bonds.has(S, 'vos', 5)) extra.push('twidance');
      if (A.Bonds.has(S, 'ekria', 1)) extra.push('hack');
      return [...hand, ...known, ...gifts, ...extra, 'guard', 'talk'];
    },
    together(S) {
      if (!A.Bonds.has(S, 'tholme', 5) || S.flags['together_' + S.chapter]) return false;
      S.flags['together_' + S.chapter] = true;
      for (const m of S.party) m.fp = A.stats(A.heroId(m), m.level).fp;
      return true;
    },
    armed(S, id) {
      return id !== 'aayla' || !S.flags.forgot || !!S.flags.saber;
    },
    preset(S, chapter, tone) {
      A.Party.forget(S);
      S.restraint = 1;
      S.flags.pol_tone = tone || 'polite';
      if (!['ch2', 'int', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'].includes(chapter)) return S;
      const a = S.party[0];
      a.level = 5;
      a.xp = A.xpFor(5);
      const st = A.stats('aayla', 5);
      a.hp = st.hp;
      a.fp = st.fp;
      S.restraint = 2;
      S.memory = [1, 2, 4, 5];
      Object.assign(S.flags, { saber: true, feeling: 'fear', escape: true, warned: 'bala' });
      if (!['int', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7'].includes(chapter)) return S;
      a.level = 12;
      a.xp = A.xpFor(12) + 40;
      const st2 = A.stats('aayla', 12);
      a.hp = st2.hp;
      a.fp = st2.fp;
      S.chapter = 'int';
      S.dark = 30;
      S.memory = [1, 2, 4, 5, 7, 3, 8, 9];
      S.bonds = { vos: { rank: 0, pts: 1, letgo: 1 }, traa: { rank: 1, pts: 0, letgo: 0, last: 'bond_traa_1' } };
      Object.assign(S.flags, { gifts: true, post: 'turn', heart: true, fights: 19 });
      if (!['ch3', 'ch4', 'ch5', 'ch6', 'ch7'].includes(chapter)) return S;
      a.level = 15;
      a.xp = A.xpFor(15) + 60;
      const st3 = A.stats('aayla', 15);
      a.hp = st3.hp;
      a.fp = st3.fp;
      a.deflect = 2;
      S.chapter = 'ch3';
      S.dark = 15;
      S.credits = 300;
      S.memory = [1, 2, 4, 5, 7, 3, 8, 9, 6, 10, 12];
      S.faded = [6, 10];
      S.palace = { order: A.Memory.solve(), will: 4 };
      S.bonds.tholme = { rank: 2, pts: 1, letgo: 0, last: 'bond_tholme_2' };
      Object.assign(S.flags, { stark_told: true, blade_blue: true, tr_deflect2: true, rs_p1: true });
      if (!['ch4', 'ch5', 'ch6', 'ch7'].includes(chapter)) return S;
      a.level = 23;
      a.xp = A.xpFor(23) + 80;
      const st4 = A.stats('aayla', 23);
      a.hp = st4.hp;
      a.fp = st4.fp;
      S.chapter = 'ch4';
      S.dark = 20;
      S.restraint = 3;
      S.bonds.vos = { rank: 2, pts: 0, letgo: 1, last: 'bond_vos_2' };
      S.bonds.tholme = { rank: 3, pts: 0, letgo: 0, last: 'bond_tholme_3' };
      S.bonds.villie = { rank: 2, pts: 0, letgo: 0, last: 'bond_villie_2' };
      S.bonds.secura = { rank: 1, pts: 0, letgo: 0, last: 'bond_secura_1' };
      Object.assign(S.flags, { met_vos: true, tr_djemso: true, rs_p2: true, rs_p3: true, archive_ch4: true, cover_servant: 'clean' });
      if (!['ch5', 'ch6', 'ch7'].includes(chapter)) return S;
      a.level = 31;
      a.xp = A.xpFor(31) + 60;
      const st5 = A.stats('aayla', 31);
      a.hp = st5.hp;
      a.fp = st5.fp;
      a.deflect = 3;
      S.chapter = 'ch5';
      S.bonds.vos.rank = 3;
      S.bonds.vos.last = 'bond_vos_3';
      S.bonds.kit = { rank: 2, pts: 0, letgo: 0, last: 'bond_kit_2' };
      S.bonds.bly = { rank: 1, pts: 0, letgo: 0, last: 'bond_bly_1' };
      Object.assign(S.flags, { met_korto: true, saber_green: true, tr_deflect3: true, rs_p4: true, archive_ch5: true, cover_jayzaa: 'clean', duel_spar: 'won' });
      if (chapter !== 'ch6' && chapter !== 'ch7') return S;
      a.level = 37;
      a.xp = A.xpFor(37) + 60;
      const st6 = A.stats('aayla', 37);
      a.hp = st6.hp;
      a.fp = st6.fp;
      a.push = 3;
      S.chapter = 'ch5';
      S.dark = 12;
      S.bonds.vos.letgo = 2;
      S.bonds.traa = { rank: 3, pts: 0, letgo: 0, last: 'bond_traa_3' };
      S.bonds.kit = { rank: 4, pts: 0, letgo: 1, last: 'bond_kit_4' };
      S.bonds.bly = { rank: 2, pts: 0, letgo: 0, last: 'bond_bly_2' };
      S.bonds.secura = { rank: 3, pts: 0, letgo: 0, last: 'bond_secura_3' };
      Object.assign(S.flags, { tr_push2: true, tr_push3: true, rs_p5: true, rs_p6: true, archive_ch6: true, cover_tuulaa: 'clean', found_self: true, intel_route: true, intel_mountains: true, intel_hunter: true });
      if (chapter !== 'ch7') return S;
      a.level = 43;
      a.xp = A.xpFor(43) + 60;
      const st7 = A.stats('aayla', 43);
      a.hp = st7.hp;
      a.fp = st7.fp;
      S.chapter = 'ch6';
      S.dark = 10;
      S.bonds.vos = { rank: 5, pts: 0, letgo: 3, last: 'bond_vos_5' };
      S.bonds.bly = { rank: 4, pts: 0, letgo: 0, last: 'bond_bly_4' };
      Object.assign(S.flags, { rs_p7: true, rs_p8: true, archive_ch7: true, honoghr_deflected: true, bly_told: true, duel_honoghr_turns: 6, duel_honoghr_bly: 'covered', mind_medallion: true, mind_sanctum: true, mind_balcony: true, mind_kiffu: true });
      return S;
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
      const G = this.group;
      this.ownParty = !G.hero;
      const party = G.hero ? [].concat(G.hero).map(x => Object.assign(A.Party.member(x.id, x.level), x.skills ? { skills: x.skills } : {})) : S.party.filter(m => !G.party || G.party.includes(m.id));
      const lead = S.party.find(m => m.id === 'aayla');
      for (const al of G.allies || []) party.push(A.Party.member(al.id, al.level || (lead ? lead.level + (al.plus || 0) : 10), al.hero));
      for (const [i, m] of party.entries()) {
        const hid = A.heroId(m), h = A.HEROES[hid], st = this.ownParty ? A.Party.stats(S, m) : A.stats(hid, m.level), boost = this.help ? 1.25 : 1, armed = A.Party.armed(S, m.id), floor = opts.retry ? A.RETRY_FLOOR : 0;
        const hp0 = Math.max(Math.min(st.hp, m.hp), Math.round(st.hp * floor)), fp0 = Math.max(Math.min(st.fp, m.fp), Math.round(st.fp * floor));
        this.units.push({
          id: m.id, side: 'party', key: hid, name: h.name, look: A.Party.look(S, hid), weapon: armed ? undefined : 'none', armed, slot: i, row: 'party', level: m.level, retinue: !!h.retinue, saber: A.Party.blade(S, hid), saber2: A.Party.blade2(S, hid), pushLevel: m.push || 1, mindguard: m.id === 'aayla' && this.ownParty && A.Memory.skills(S).includes('mindguard'),
          hp: Math.max(1, Math.round(hp0 * boost)), maxhp: Math.round(st.hp * boost), fp: Math.round(fp0 * boost), maxfp: Math.round(st.fp * boost),
          mig: st.mig, wil: st.wil, agi: st.agi, sta: st.sta, tempo: h.tempo ? 0 : null, skills: A.Party.skills(S, m), deflectLevel: m.deflect || 1,
          status: {}, next: 0, evade: false, deflect: null
        });
      }
      this.instinct = !!S.flags.instinct && this.units.some(u => u.id === 'aayla');
      const lead0 = this.units.find(u => u.id === 'aayla');
      if (lead0 && this.ownParty && A.Bonds.has(S, 'vos', 5) && A.Bonds.released(S, 'vos')) lead0.tempo = 2;
      this.wet = !!G.rain || this.hazard === 'ocean';
      this.barrier = false;
      this.ask = null;
      this.used = {};
      this.bet = null;
      this.instinctUsed = false;
      this.spare = !!this.group.spare;
      this.talkSet = A.TALK_SETS[this.group.talk] || null;
      for (const [type, row, slot] of this.group.units) this.addEnemy(type, row, slot);
      if (S.flags['archive_' + S.chapter]) for (const e of this.enemies()) this.reveal(e.key);
      const adv = opts.advantage || 'none';
      this.advantage = adv;
      for (const u of this.units) {
        const d = this.delay(u), mine = (adv === 'party' && u.side === 'party') || (adv === 'enemy' && u.side === 'enemy');
        u.next = adv === 'none' ? d * 0.5 : mine ? d * 0.05 * (u.slot + 1) : d;
      }
      if (adv === 'party' && this.ownParty && A.Bonds.has(S, 'tholme', 4)) {
        const a = this.aayla();
        if (a) a.ambush = true;
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
      this.duel = (A.DUELS && A.DUELS[G.duel]) || null;
      if (this.duel && this.duel.start) this.duel.start(this);
    }

    addEnemy(type, row, slot) {
      const d = A.ENEMIES[type];
      const e = {
        id: type + '_' + (this.n++), side: 'enemy', key: type, name: d.name, kind: d.kind, look: d.look, beast: d.beast, weapon: d.weapon,
        row, slot, hp: Math.round(d.hp * this.diff.hp), maxhp: Math.round(d.hp * this.diff.hp), fp: 0, maxfp: 0,
        mig: d.mig, wil: d.wil, agi: d.agi, sta: d.sta, ai: d.ai, weight: d.weight, boss: !!d.boss, elite: !!d.elite, fake: !!d.fake, blade: d.blade || null,
        status: {}, next: 0, queue: [], talked: false, rage: false, disarmed: 0, pushes: 0, hazardCool: 0, breach: false, cycle: 0, shield: !!d.shield, fly: !!d.fly, grounded: 0
      };
      this.units.push(e);
      return e;
    }

    delay(u) { return 1000 / u.agi * (u.status && u.status.slow ? 1.5 : 1); }
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
      const d = A.ENEMIES[t.key], k = A.ENEMY_KINDS[t.kind] || A.ENEMY_KINDS.sentient, armor = (d.armor && d.armor[type]) || 1;
      if (k.immune.includes(type)) return 0;
      if (k.weak.includes(type) || (d.weak || []).includes(type)) return 1.5 * armor;
      if (k.resist.includes(type) || (d.resist || []).includes(type)) return 0.5 * armor;
      return armor;
    }

    weakness(key) {
      const d = A.ENEMIES[key], k = A.ENEMY_KINDS[d.kind] || A.ENEMY_KINDS.sentient;
      return { weak: [...new Set([...k.weak, ...(d.weak || [])])], resist: [...new Set([...k.resist, ...(d.resist || []), ...Object.keys(d.armor || {})])], immune: k.immune.slice() };
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
      if (src.status.suppressed) dmg *= 0.7;
      if (src.side === 'party' && this.wet && (A.HEROES[src.key] || {}).wet) dmg *= A.HEROES[src.key].wet;
      const shielded = tgt.shield && !tgt.status.shieldOff;
      if (shielded && skill.type === 'blaster') dmg = 0;
      if (shielded && skill.type === 'blade') dmg *= 0.5;
      if (this.barrier && tgt.side === 'party' && src.side === 'enemy' && skill.ranged) dmg *= 0.5;
      if (src.status.blind && skill.type === 'blaster') dmg *= 0.5;
      let breached = false;
      if (tgt.breach && mult > 0) { dmg *= 1.25; tgt.breach = false; breached = true; }
      if (tgt.guard) dmg *= 0.5;
      if (tgt.mindguard && skill.type === 'mind') dmg *= 0.5;
      const none = mult === 0 || (shielded && skill.type === 'blaster');
      return { dmg: none ? 0 : Math.max(1, Math.round(dmg)), weak: mult > 1 && !none, resist: !none && (mult < 1 || shielded), immune: none, breached, shielded };
    }

    aayla() { return this.units.find(u => u.id === 'aayla' && this.active(u)); }

    gainTempo(n) {
      const a = this.aayla();
      if (a && a.tempo !== null) a.tempo = Math.min(5, a.tempo + n);
    }

    hurt(tgt, dmg, ev) {
      tgt.hp = Math.max(0, tgt.hp - dmg);
      if (tgt.hp === 0) {
        const ko = this.spare && tgt.side === 'enemy' && tgt.kind !== 'beast' && tgt.kind !== 'droid';
        if (tgt.side === 'enemy') tgt.gone = ko ? 'ko' : 'dead';
        ev.push({ type: 'down', target: tgt.id, ko });
      }
    }

    instinctCheck(src, ev) {
      const a = this.aayla();
      if (!this.instinct || this.instinctUsed || !a || a.hp >= a.maxhp / 2) return;
      this.instinctUsed = true;
      const tgt = this.active(src) ? src : this.enemies()[0];
      if (!tgt) return;
      ev.push({ type: 'instinct', who: a.id, target: tgt.id });
      const r = this.strike(a, tgt, 'instinct', ev);
      if (this.active(tgt)) this.shove(tgt, r.dmg, A.SKILLS.instinct.level, ev);
    }

    greet(nrav) {
      return (this.talkSet && this.talkSet.greet[nrav]) || A.TALK.greet[nrav] || '';
    }

    strike(src, tgt, skillId, ev, scale) {
      const skill = A.SKILLS[skillId];
      if (tgt.fake) {
        tgt.gone = 'dispelled';
        ev.push({ type: 'strike', who: src.id, target: tgt.id, skill: skillId, dmg: 0, immune: true, fake: true });
        ev.push({ type: 'dispel', target: tgt.id });
        return { dmg: 0, weak: false, resist: false, immune: true };
      }
      const cort = (A.ENEMY_KINDS[tgt.kind] || {}).cortosis && skill.type === 'blade';
      const ambush = src.side === 'party' && src.ambush && skillId === 'blade';
      const drill = skillId === 'fists' && src.id === 'aayla' && this.ownParty && A.Bonds.has(this.S, 'bly', 2);
      const r = this.damage(src, tgt, skill, (scale || 1) * (ambush ? 2 : 1) * (drill ? 1.2 : 1));
      if (src.side === 'party' && src.hidden) { src.hidden = false; src.ambush = false; }
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
        if (!tgt.staggered) tgt.next += this.delay(tgt) * 0.5;
        tgt.staggered = true;
        this.gainTempo(1);
        e.breach = true;
      }
      return r;
    }

    reveal(key) {
      this.known[key] = { weak: true, nrav: true };
    }

    plan(u) {
      const seen = this.heroes().filter(h => !h.hidden), heroes = seen.length ? seen : this.heroes();
      if (!heroes.length) return { skill: 'wait' };
      if (this.duel && this.duel.plan) {
        const a = this.duel.plan(this, u);
        if (a) return a;
      }
      const pick = () => {
        const a = heroes.find(h => h.id === 'aayla');
        if (a && heroes.length > 1 && this.rnd01() < 0.55) return a.id;
        return heroes[Math.floor(this.rnd01() * heroes.length)].id;
      };
      if (u.ai === 'shooter') {
        const d = A.ENEMIES[u.key];
        if (d.closeIn && u.row === 'back' && !this.inRow('front').length && this.freeSlot('front', u.slot) !== null) return { skill: 'advance' };
        if (u.disarmed > 0) return u.row === 'front' ? { skill: 'punch', target: pick() } : { skill: 'search' };
        return { skill: d.shot || 'shot', target: pick() };
      }
      if (u.ai === 'melee' || u.ai === 'biter') {
        if (u.row === 'back') return this.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'wait' };
        return { skill: A.ENEMIES[u.key].melee || (u.ai === 'biter' ? 'bite' : 'stab'), target: pick() };
      }
      if (u.ai === 'lylek' || u.ai === 'lylekboss') {
        if (u.row === 'back') return this.freeSlot('front', u.slot) !== null ? { skill: 'advance' } : { skill: 'wait' };
        if (u.ai === 'lylekboss') {
          u.cycle++;
          return { skill: ['claw', 'tentacles', 'claw', 'barb', 'tail'][(u.cycle - 1) % 5], target: pick() };
        }
        const r = this.rnd01();
        if (A.ENEMIES[u.key].young) return { skill: r < 0.75 ? 'nip' : 'tentacles', target: pick() };
        if (this.advantage === 'enemy' && !u.opened) {
          u.opened = true;
          return { skill: 'pounce', target: pick() };
        }
        return { skill: r < 0.6 ? 'claw' : r < 0.8 ? 'tentacles' : 'barb', target: pick() };
      }
      if (u.ai === 'b2') {
        if (u.row === 'back' && this.freeSlot('front', u.slot) !== null) return { skill: 'advance' };
        u.cycle++;
        return { skill: u.row === 'back' || u.cycle % 2 ? 'b2burst' : 'b2punch', target: pick() };
      }
      if (u.ai === 'secdroid') {
        if (u.row === 'back' && this.freeSlot('front', u.slot) !== null) return { skill: 'advance' };
        u.cycle++;
        const dd = A.ENEMIES[u.key];
        return { skill: u.row === 'back' || u.cycle % 2 ? dd.shot || 'dlaser' : dd.melee || 'dclaw', target: pick() };
      }
      if (u.ai === 'flyer') {
        if (u.row === 'front' && u.grounded <= 0 && this.freeSlot('back', u.slot) !== null) return { skill: 'rise' };
        return { skill: A.ENEMIES[u.key].shot || 'sonic', target: pick() };
      }
      if (u.ai === 'netter') {
        u.cycle++;
        return u.cycle % 3 === 1 ? { skill: 'net', target: pick() } : { skill: 'shot', target: pick() };
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
      u.staggered = false;
      if (u.side === 'party') {
        u.deflect = null;
        u.guard = false;
        u.covering = false;
        if (u.id === 'aayla') this.barrier = false;
        if (u.status.regen) {
          const h = Math.max(1, Math.round(u.maxhp * 0.08));
          u.hp = Math.min(u.maxhp, u.hp + h);
          ev.push({ type: 'heal', target: u.id, amount: h, item: null });
        }
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
      if (u.side === 'party') u.djemso = false;
      if (u.grounded > 0) u.grounded--;
      for (const k of ['fear', 'blind', 'calm', 'saberOff', 'slow', 'shieldOff', 'regen', 'suppressed']) {
        if (u.status[k]) { u.status[k]--; if (!u.status[k]) delete u.status[k]; }
      }
      u.pushes = 0;
      if (u.status.rooted) {
        ev.push({ type: 'rooted', who: u.id });
        u.next += this.delay(u);
        u.status.rooted--;
        if (!u.status.rooted) delete u.status.rooted;
        return true;
      }
      if (u.status.stun) {
        delete u.status.stun;
        if (u.tempo !== null && u.tempo !== undefined) u.tempo = 0;
        ev.push({ type: 'stunned', who: u.id });
        u.next += this.delay(u);
        return true;
      }
      if (u.side === 'party') this.turns[u.id] = (this.turns[u.id] || 0) + 1;
      if (u.id === 'aayla' && this.kitFive() && this.turns.aayla % 3 === 0) {
        this.gainTempo(1);
        ev.push({ type: 'tempo', target: 'aayla', amount: 1, item: null });
      }
      return false;
    }

    kitFive() {
      const S = this.S;
      return this.ownParty && A.Bonds.has(S, 'kit', 5) && (A.Bonds.get(S, 'kit').letgo > 0 || !!this.partner('kit'));
    }

    proceed(ev) {
      for (let guard = 0; guard < 400 && !this.over; guard++) {
        if (this.ask) break;
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

    answer(id) {
      const q = this.ask;
      if (!q || this.over) throw new Error('nothing to answer');
      if (!q.options.some(o => o.id === id)) throw new Error('no answer ' + id);
      const ev = [];
      this.ask = null;
      if (this.duel && this.duel.answer) this.duel.answer(this, q, id, ev);
      if (this.check(ev)) return ev;
      return this.proceed(ev);
    }

    enemyAct(u, ev) {
      if (u.hacked > 0) {
        u.hacked--;
        u.queue = [];
        const d = A.ENEMIES[u.key], prey = this.enemies().filter(e => e !== u && !e.hidden);
        if (!prey.length) { ev.push({ type: 'idle', who: u.id, skill: 'wait' }); return; }
        const t = prey.sort((x, y) => x.hp - y.hp)[0], sk = d.shot || d.melee || 'shot';
        ev.push({ type: 'line', who: null, text: u.name + ' бьёт по своим.' });
        for (let i = 0; i < (A.SKILLS[sk].hits || 1) && this.active(t); i++) this.enemyHit(u, t, sk, ev);
        return;
      }
      let a = u.queue.length ? u.queue.shift() : this.plan(u);
      const tgtOk = q => !q.target || this.active(this.unit(q.target));
      const rowOk = q => !A.SKILLS[q.skill].melee || u.row === 'front' || u.ai === 'spiderboss';
      if (!tgtOk(a) || !rowOk(a) || (A.SKILLS[a.skill].ranged && u.disarmed > 0) || (a.skill === 'advance' && this.freeSlot('front', u.slot) === null)) a = this.plan(u);
      if (a.target && !this.active(this.unit(a.target))) a.target = (this.heroes()[0] || {}).id;
      const sk = A.SKILLS[a.skill];
      if (this.duel && this.duel.act && this.duel.act(this, u, a, ev)) {
        if (u.disarmed > 0) u.disarmed--;
        return;
      }
      if (a.skill === 'vdefend') {
        ev.push({ type: 'idle', who: u.id, skill: a.skill });
        return;
      }
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
      } else if (a.skill === 'rise') {
        const s = u.row === 'front' ? this.freeSlot('back', u.slot) : null;
        if (s !== null) {
          ev.push({ type: 'move', target: u.id, from: [u.row, u.slot], to: ['back', s], how: 'rise' });
          u.row = 'back';
          u.slot = s;
        } else ev.push({ type: 'idle', who: u.id, skill: 'wait' });
      } else if (a.skill === 'search' || a.skill === 'wait') {
        ev.push({ type: 'idle', who: u.id, skill: a.skill });
      } else {
        const tgt = this.unit(a.target);
        if (tgt) for (let i = 0; i < (sk.hits || 1) && this.active(tgt) && this.active(u); i++) this.enemyHit(u, tgt, a.skill, ev);
      }
      if (u.disarmed > 0) u.disarmed--;
      if (u.hazardCool > 0) u.hazardCool--;
    }

    enemyHit(u, tgt, skillId, ev) {
      const sk = A.SKILLS[skillId];
      const shield = tgt.id === 'aayla' && sk.ranged && this.heroes().find(h => h.covering && h.id !== tgt.id);
      if (shield) {
        ev.push({ type: 'line', who: shield.key, text: shield.name + ' закрывает генерала собой.' });
        tgt = shield;
      }
      if (tgt.evade) {
        tgt.evade = false;
        ev.push({ type: 'evade', who: u.id, target: tgt.id, skill: skillId });
        return;
      }
      const r = this.damage(u, tgt, sk);
      if (sk.deflect && tgt.deflect && tgt.deflect.charges > 0) {
        tgt.deflect.charges--;
        const aim = tgt.deflect.to && this.active(this.unit(tgt.deflect.to)) ? this.unit(tgt.deflect.to) : u;
        const blocked = aim.shield && !aim.status.shieldOff;
        const back = blocked ? 0 : Math.max(1, Math.round(r.dmg * tgt.deflect.share));
        ev.push({ type: 'shot', who: u.id, target: tgt.id, dmg: 0, deflected: back, to: aim.id, shielded: blocked });
        if (back) this.hurt(aim, back, ev);
        this.gainTempo(1);
        return;
      }
      ev.push({ type: sk.ranged ? 'shot' : 'strike', who: u.id, target: tgt.id, skill: skillId, dmg: r.dmg });
      this.hurt(tgt, r.dmg, ev);
      if (!this.active(tgt)) return;
      if (tgt.djemso && sk.melee && this.active(u)) {
        tgt.djemso = false;
        this.gainTempo(1);
        ev.push({ type: 'counter', who: tgt.id, target: u.id });
        if (tgt.armed !== false && !tgt.status.saberOff) this.strike(tgt, u, 'blade', ev, 0.6);
        if (!this.active(tgt)) return;
      }
      if (sk.poison && !tgt.status.poison && !this.barrier) { tgt.status.poison = 3; ev.push({ type: 'status', target: tgt.id, status: 'poison' }); }
      if (sk.stun) { tgt.status.stun = true; ev.push({ type: 'status', target: tgt.id, status: 'stun' }); }
      if (sk.slow) { tgt.status.slow = sk.slow; ev.push({ type: 'status', target: tgt.id, status: 'slow' }); }
      if (tgt.id === 'aayla') this.instinctCheck(u, ev);
    }

    check(ev) {
      if (this.over) return true;
      if (this.duel && this.duel.check && this.duel.check(this, ev)) return true;
      if (!this.enemies().length) {
        this.over = 'win';
        this.rewards = this.reward();
        ev.push({ type: 'victory', rewards: this.rewards });
        return true;
      }
      if (!this.heroes().length && this.chipFor()) {
        const a = this.units.find(u => u.id === 'aayla');
        this.S.flags['chip_' + this.S.chapter] = true;
        a.hp = Math.max(1, Math.round(a.maxhp * 0.3));
        ev.push({ type: 'chip', who: a.id, hp: a.hp });
        return false;
      }
      if (!this.heroes().length) {
        this.over = 'lose';
        ev.push({ type: 'defeat' });
        return true;
      }
      return false;
    }

    chipFor() {
      return this.ownParty && A.Bonds.has(this.S, 'villie', 3) && !this.S.flags['chip_' + this.S.chapter] && this.units.some(u => u.id === 'aayla');
    }

    betResult() {
      const b = this.bet;
      if (!b || !b.stake) return 0;
      const win = this.over === 'win' && (b.kind === 'fast' ? (this.turns.aayla || 99) <= A.BET.fast : this.units.filter(u => u.side === 'party').every(u => u.hp >= u.maxhp * A.BET.clean));
      b.won = win;
      return win ? b.stake * (A.BET.pays - 1) : -b.stake;
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
      const fp = sk.gift && this.S.chapter !== 'ch2' ? sk.giftFp : sk.fp || 0;
      return { fp, tempo: sk.tempo || 0 };
    }

    targets(u, skillId) {
      const sk = A.SKILLS[skillId];
      const all = this.enemies();
      if (sk.needs && sk.needs !== 'brace' && sk.needs !== 'retinue' && !this.partner(sk.needs)) return [];
      switch (sk.target) {
        case 'front': return all.filter(e => e.row === 'front' && !e.hidden).map(e => e.id);
        case 'any':
        case 'enemy': return all.filter(e => !e.hidden && !(sk.type === 'blade' && e.fly && e.row === 'back')).map(e => e.id);
        case 'row': return ROWS.filter(r => all.some(e => e.row === r));
        case 'back': return this.freeSlot('front') === null ? [] : all.filter(e => e.row === 'back').map(e => e.id);
        case 'shooter': return all.filter(e => e.ai === 'shooter' && !e.disarmed).map(e => e.id);
        case 'talk': return all.filter(e => e.kind !== 'beast' && e.kind !== 'droid' && !A.ENEMIES[e.key].mute && !e.talked && !e.rage).map(e => e.id);
        case 'frontAll': return all.some(e => e.row === 'front') ? ['frontAll'] : [];
        case 'ally': return this.heroes().map(h => h.id);
        case 'droid': return all.filter(e => e.kind === 'droid' && !e.hidden && !(e.hacked > 0)).map(e => e.id);
        case 'self': return sk.effect === 'deflect' && (u.deflectLevel || 1) >= 3 ? [u.id, ...all.filter(e => !e.hidden).map(e => e.id)] : [u.id];
        case 'bet': return this.bet || (this.S.credits || 0) <= 0 ? [] : ['fast', 'clean'];
        case 'none':
          if (sk.needs === 'brace' && !this.braceUp) return [];
          if (sk.needs === 'retinue' && !this.heroes().some(h => h.retinue && !h.status.rooted)) return [];
          return ['none'];
      }
      return [];
    }

    partner(key) {
      return this.heroes().find(h => h.key === key && !h.status.rooted && !h.status.stun) || null;
    }

    commands(u) {
      const out = [];
      if (this.ask) return out;
      for (const id of u.skills) {
        const sk = A.SKILLS[id], c = this.cost(u, id);
        if (sk.passive) continue;
        let why = null;
        if (sk.needs === 'brace' && !this.braceUp) continue;
        if (u.status.saberOff && sk.type === 'blade') why = 'клинок погас';
        else if (sk.once && this.used[u.id + ':' + id]) why = 'уже применено';
        else if (id === 'bet' && this.bet) why = 'ставка уже сделана';
        else if (sk.needs && A.HEROES[sk.needs] && !this.partner(sk.needs)) why = A.HEROES[sk.needs].name + ' не рядом';
        else if (c.fp > u.fp) why = 'не хватает Силы';
        else if (c.tempo > (u.tempo || 0)) why = 'не хватает Темпа';
        else if (!this.targets(u, id).length) why = 'нет цели';
        out.push({ id, name: sk.name, menu: sk.menu, fp: c.fp, tempo: c.tempo, enabled: !why, why, about: sk.about, gift: !!sk.gift });
      }
      if (this.duel && this.duel.commands) this.duel.commands(this, u, out);
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
      if (this.duel && this.duel.perform && this.duel.perform(this, u, skillId, ev, target)) {
        u.next += this.delay(u);
        this.turn = null;
        if (this.over) return ev;
        if (this.duel.afterAct) this.duel.afterAct(this, u, skillId, ev);
        if (this.check(ev)) return ev;
        return this.proceed(ev);
      }
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
        if (it.blind) for (const e of this.enemies()) { e.status.blind = it.blind; ev.push({ type: 'status', target: e.id, status: 'blind' }); }
      } else {
        const sk = A.SKILLS[skillId];
        const valid = this.targets(u, skillId);
        if (!valid.includes(target)) {
          if (valid.length === 1 && (target === undefined || target === null)) target = valid[0];
          else throw new Error('bad target ' + target + ' for ' + skillId);
        }
        weight = sk.weight || 1;
        u.fp -= this.cost(u, skillId).fp;
        if (sk.tempo) u.tempo -= sk.tempo;
        ev.push({ type: 'use', who: u.id, skill: skillId, target });
        if (sk.once) this.used[u.id + ':' + skillId] = true;
        this.perform(u, skillId, target, ev, extra || {});
        if (sk.gift) this.darkDelta += sk.dark || 0;
      }
      u.next += this.delay(u) * weight;
      this.turn = null;
      if (this.duel && this.duel.afterAct && !this.over) this.duel.afterAct(this, u, skillId, ev);
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
        case 'fists':
        case 'feral':
        case 'klightning':
          this.strike(u, tgt, id, ev);
          return;
        case 'hunger': {
          const r = this.strike(u, tgt, id, ev);
          const back = Math.round(r.dmg / 2);
          if (back > 0 && u.hp > 0) {
            u.hp = Math.min(u.maxhp, u.hp + back);
            ev.push({ type: 'heal', target: u.id, amount: back, item: null });
          }
          return;
        }
        case 'terror':
          for (const e of this.inRow(target)) {
            if (e.fake) { this.strike(u, e, id, ev); continue; }
            this.strike(u, e, id, ev);
            if (!this.active(e)) continue;
            e.status.fear = 2;
            ev.push({ type: 'status', target: e.id, status: 'fear' });
            if ((A.ENEMIES[e.key] || {}).nrav === 'coward') {
              e.gone = 'fled';
              ev.push({ type: 'flee', target: e.id });
            }
          }
          return;
        case 'command':
          for (const h of this.heroes().filter(x => x.retinue && !x.status.rooted)) {
            const prey = this.enemies().filter(e => !e.hidden).sort((a, b) => a.hp - b.hp)[0];
            if (!prey) break;
            ev.push({ type: 'use', who: h.id, skill: 'hunger', target: prey.id });
            this.perform(h, 'hunger', prey.id, ev, {});
          }
          return;
        case 'calm':
          u.status.calm = 3 + (u.id === 'aayla' && A.Bonds.has(this.S, 'traa', 1) ? 1 : 0);
          ev.push({ type: 'stance', who: u.id, stance: 'calm' });
          return;
        case 'foresee': {
          const deep = u.id === 'aayla' && this.ownParty && A.Bonds.has(this.S, 'vos', 1);
          if (deep) this.reveal(tgt.key);
          ev.push({ type: 'read', who: u.id, target: tgt.id, intents: this.intents(tgt).slice(0, deep ? 2 : 1) });
          return;
        }
        case 'djemso':
          u.djemso = true;
          ev.push({ type: 'stance', who: u.id, stance: 'djemso' });
          return;
        case 'vshot':
        case 'zapstaff':
          this.strike(u, tgt, id, ev);
          return;
        case 'thermal':
          for (const e of this.inRow(target)) this.strike(u, e, id, ev);
          return;
        case 'flash':
          for (const e of this.enemies()) { e.status.blind = 2; ev.push({ type: 'status', target: e.id, status: 'blind' }); }
          return;
        case 'bet':
          this.bet = { kind: target, stake: Math.min(A.BET.stake, this.S.credits || 0), by: u.id };
          ev.push({ type: 'bet', who: u.id, kind: target, stake: this.bet.stake });
          return;
        case 'combo':
          for (let i = 0; i < (u.saber2 ? 3 : 2) && this.active(tgt); i++) this.strike(u, tgt, id, ev);
          return;
        case 'shiicho':
          for (const e of this.inRow('front')) this.strike(u, e, id, ev);
          return;
        case 'mundipush':
        case 'tkthrow':
          this.strike(u, tgt, id, ev);
          return;
        case 'duo': {
          this.strike(u, tgt, id, ev);
          const vos = this.partner('vos');
          if (vos && this.active(tgt)) {
            ev.push({ type: 'use', who: vos.id, skill: 'duo', target: tgt.id });
            this.strike(vos, tgt, id, ev);
          }
          return;
        }
        case 'twinwhirl': {
          const held = this.S.flags.kit_held ? 1.3 : 1;
          for (const e of this.inRow('front')) this.strike(u, e, id, ev, held);
          const kit = this.partner('kit');
          if (kit) {
            ev.push({ type: 'use', who: kit.id, skill: 'shiicho', target: 'frontAll' });
            for (const e of this.inRow('front')) this.strike(kit, e, 'shiicho', ev, held);
          }
          return;
        }
        case 'roots': {
          tgt.status.rooted = u.key === 'traa' && this.ownParty && A.Bonds.has(this.S, 'traa', 2) ? 2 : 1;
          ev.push({ type: 'status', target: tgt.id, status: 'rooted' });
          for (const h of this.heroes()) h.status.regen = 2;
          ev.push({ type: 'stance', who: u.id, stance: 'roots' });
          return;
        }
        case 'heal': {
          const h = Math.round(tgt.maxhp * 0.3);
          tgt.hp = Math.min(tgt.maxhp, tgt.hp + h);
          ev.push({ type: 'heal', target: tgt.id, amount: h, item: null });
          return;
        }
        case 'cshot':
        case 'spalm':
          this.strike(u, tgt, id, ev);
          return;
        case 'bshot':
          for (let i = 0; i < 2 && this.active(tgt); i++) this.strike(u, tgt, id, ev);
          return;
        case 'grenade':
          for (const e of this.inRow(target)) this.strike(u, e, id, ev);
          return;
        case 'hack':
          tgt.hacked = 2;
          tgt.queue = [];
          ev.push({ type: 'status', target: tgt.id, status: 'hacked' });
          return;
        case 'volley':
          for (const e of this.enemies().filter(x => !x.hidden)) this.strike(u, e, id, ev);
          return;
        case 'suppress':
          for (const e of this.enemies()) { e.status.suppressed = 2; ev.push({ type: 'status', target: e.id, status: 'suppressed' }); }
          return;
        case 'bcover':
          u.covering = true;
          ev.push({ type: 'stance', who: u.id, stance: 'cover' });
          return;
        case 'twidance': {
          const pool = this.enemies().filter(e => !e.hidden && !e.fake && !(e.fly && e.row === 'back'));
          const picks = [];
          for (let i = 0; i < 3 && pool.length; i++) {
            const left = pool.filter(e => this.active(e) && !picks.includes(e));
            const t = (left.length ? left : pool.filter(e => this.active(e)))[0];
            if (!t) break;
            picks.push(t);
            this.strike(u, t, id, ev);
          }
          return;
        }
        case 'barrier':
          this.barrier = true;
          ev.push({ type: 'stance', who: u.id, stance: 'barrier' });
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
          const lv = u.pushLevel || A.SKILLS.push.level;
          const r = this.strike(u, tgt, id, ev, lv >= 3 ? 2 : lv === 2 ? 1.5 : 1);
          if (this.active(tgt)) this.shove(tgt, r.dmg, lv, ev);
          return;
        }
        case 'shadow':
          u.hidden = true;
          u.ambush = true;
          ev.push({ type: 'stance', who: u.id, stance: 'shadow' });
          return;
        case 'telepathy':
          for (const e of this.inRow(target)) {
            this.strike(u, e, id, ev);
            if (!this.active(e)) continue;
            e.status.fear = 2;
            ev.push({ type: 'status', target: e.id, status: 'fear' });
          }
          return;
        case 'pull': {
          const s = this.freeSlot('front', tgt.slot);
          ev.push({ type: 'move', target: tgt.id, from: [tgt.row, tgt.slot], to: ['front', s], how: 'pull' });
          tgt.row = 'front';
          tgt.slot = s;
          if (tgt.fly) {
            tgt.grounded = 2;
            ev.push({ type: 'status', target: tgt.id, status: 'grounded' });
          }
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
          u.deflect = { charges: lv.charges, share: lv.share, to: target && target !== u.id ? target : null };
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
      if (tgt.shield && !tgt.status.shieldOff) {
        tgt.status.shieldOff = 2;
        ev.push({ type: 'status', target: tgt.id, status: 'shieldOff' });
      }
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
      if (this.duel && this.duel.fall && this.duel.fall(this, tgt, ev)) return;
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
      return (this.talkSet ? this.talkSet.args : A.ARGUMENTS).some(f => this.S.flags[f]);
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
      const clan = !!d.twilek && this.ownParty && A.Bonds.has(this.S, 'secura', 3);
      let out = A.TALK.table[d.nrav][approach];
      if (approach === 'persuade' && !this.canPersuade()) out = 'rage';
      if (approach === 'mind' && (d.strongMind || u.wil < (d.resolve || 0) * (d.twilek && !clan ? 1.25 : 1))) out = 'rage';
      if (clan && out === 'rage' && approach !== 'threat' && !d.strongMind) out = 'flee';
      if (this.group.gentle && out === 'rage') out = 'pause';
      if (approach === 'threat') this.darkDelta += 1;
      this.reveal(tgt.key);
      const T = this.talkSet || A.TALK;
      ev.push({ type: 'talk', who: u.id, target: tgt.id, approach, outcome: out, say: T.say[approach], reply: T.reply[out] });
      if (out === 'rage') { tgt.rage = true; return; }
      if (out === 'pause') return;
      tgt.gone = 'talked';
      this.talked++;
      this.darkDelta -= 1;
      if (out === 'info') this.S.flags['info_' + this.groupId] = true;
    }

    finish() {
      const S = this.S, res = { xp: 0, levels: [], credits: 0, dark: 0, recovered: [] };
      const won = this.over === 'win' || this.over === 'end';
      if (this.over === 'win') Object.assign(res, this.rewards);
      if (this.over === 'end') Object.assign(res, this.reward(), { reason: this.endReason });
      const leader = S.party.find(m => m.id === 'aayla');
      for (const m of this.ownParty ? S.party : []) {
        const u = this.unit(m.id);
        if (A.heroId(m) === 'anzat') {
          const st = A.stats('anzat', leader ? leader.level : m.level);
          m.level = leader ? leader.level : m.level;
          m.hp = u && u.hp > 0 ? Math.min(st.hp, Math.max(1, u.hp)) : st.hp;
          if (won) m.hp = st.hp;
          m.fp = 0;
          continue;
        }
        if (!u) continue;
        const k = this.help ? 1 / 1.25 : 1;
        m.hp = Math.max(1, Math.round(u.hp * k));
        m.fp = Math.max(0, Math.round(u.fp * k));
        if (won) {
          m.xp += res.xp;
          const lv = A.levelFor(m.xp);
          if (lv > m.level) { res.levels.push([m.id, lv]); m.level = lv; }
          const r = A.Party.recover(m);
          if (r.hp) res.recovered.push([m.id, r.hp, r.fp]);
        }
      }
      if (this.ownParty) S.items = Object.assign({}, this.items);
      res.bet = this.betResult();
      if (this.bet) res.betWon = !!this.bet.won;
      S.credits = Math.max(0, (S.credits || 0) + res.bet);
      if (won) {
        S.credits = (S.credits || 0) + res.credits;
        S.dark = A.clamp(S.dark + this.darkDelta, 0, 100);
        res.dark = this.darkDelta;
      }
      return res;
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
