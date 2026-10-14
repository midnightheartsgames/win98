(function (H) {
  'use strict';
  const T = H.TUNING, AV = T.avBase, clamp = H.clamp;
  const DOT_ELEM = { burn: 'fire', shock: 'elec', bleed: 'phys', shear: 'wind', entangle: 'quant', erode: 'elec' };
  const DOT_NAME = { burn: 'Горение', shock: 'Шок', bleed: 'Кровотечение', shear: 'Порыв ветра', entangle: 'Запутывание', erode: 'Паутинка' };
  const DOT_TYPES = Object.keys(DOT_ELEM);

  const condOk = (u, c) => (c === 'shielded' ? u.shield > 0 : c === 'frozen' ? u.frozen > 0 || !!u.flags.dissoc : c === 'dissoc' ? !!u.flags.dissoc : true);
  function sv(u, k) {
    let v = u.base[k] || 0;
    for (const b of u.buffs) if (b.s === k && (!b.cond || condOk(u, b.cond))) v += b.v;
    return v;
  }
  function bsum(u, k) {
    let v = 0;
    for (const b of u.buffs) if (b.s === k && (!b.cond || condOk(u, b.cond))) v += b.v;
    return v;
  }
  const shieldAtk = u => { const k = u.shield > 0 ? bsum(u, 'atkShield') : 0; return k ? Math.min(u.shield * k, u.base.atk * bsum(u, 'atkShieldCap')) / u.base.atk : 0; };
  const setOn = (u, k) => !!(u.sets && u.sets[k]);
  const atkOf = u => Math.max(1, u.base.atk * (1 + bsum(u, 'atkP') + (setOn(u, 'station') && spdOf(u) >= 120 ? 0.12 : 0) + shieldAtk(u)));
  const defOf = u => Math.max(0, u.base.def * (1 + bsum(u, 'defP')));
  const spdOf = u => Math.max(10, u.base.spd * (1 + bsum(u, 'spdP')) + bsum(u, 'spd'));
  const alive = u => u && !u.dead && !u.gone;

  function makeAlly(spec, idx) {
    const kit = H.CHARS[spec.charId];
    const base = Object.assign({ critR: 0.05, critD: 0.5, breakE: 0, ehr: 0, res: 0, healP: 0, err: 0, dmgP: 0, ultP: 0 }, spec.stats);
    return {
      side: 'ally', idx, id: spec.charId, charId: spec.charId, kit, name: spec.name || kit.name, lvl: spec.lvl, elem: kit.elem, path: kit.path,
      base, maxHp: spec.stats.hp, hp: spec.hp == null ? spec.stats.hp : clamp(spec.hp, 0, spec.stats.hp), energy: spec.energy || 0, maxEnergy: kit.energy,
      buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, frozenDmg: 0, stun: 0, taunt: 0, dead: spec.hp != null && spec.hp <= 0, av: 0, flags: {}, trial: !!spec.trial, key: spec.key || spec.charId, appear: true, cone: spec.cone || null, sets: spec.sets || {}
    };
  }

  const BUGS = [['atkP', -1, 'bugAtk', 'Баг: атака'], ['defDown', 1, 'bugDef', 'Баг: защита'], ['spdP', -1, 'bugSpd', 'Баг: скорость']];
  const tallyOf = (u, plus) => Math.min(T.tallyCap * u.maxHp, ((u.flags && u.flags.tally) || 0) + (plus || 0));

  const STANCES = { jo: { s: 'elecP', v: 0.15, name: 'Стойка Дзёгэн' }, ka: { s: 'resPen', v: 0.12, name: 'Стойка Кагэн' } };

  const NOTES = {
    str: { name: 'Геката: струнные', m: 1.8, tough: 15, delay: 0.15 },
    wind: { name: 'Геката: духовые', m: 0.9, tough: 10, delay: 0 },
    cad: { name: 'Геката: каденция', m: 1.1, tough: 15, delay: 0.1 }
  };

  const coneFx = (u, fx) => (u.cone && u.cone.fx === fx ? 1 + 0.25 * ((u.cone.sup || 1) - 1) : 0);
  const unholy = u => !!u && u.side === 'enemy' && (H.UNHOLY || []).includes(u.id);
  const bigFoe = u => !!(u.data && (u.data.boss || u.data.elite));
  const CHANT = ['Чернее черноты, темнее тьмы, сольюсь с моим алым светом!', 'Пробудись, сойди к этим пределам и явись искажением!', 'Танцуй, танцуй, танцуй! Пусть сила разрушения хлынет потоком!'];

  function makeEnemy(id, lvl, idx, hpMul, atkMul) {
    const d = H.ENEMIES[id], g = H.grow(lvl);
    const hp = Math.round(T.enemyHp * d.hp * g * (hpMul || 1));
    return {
      side: 'enemy', idx, id, data: d, name: d.name, lvl, elem: 'phys',
      base: { hp, atk: T.enemyAtk * d.atk * g * (atkMul || 1), def: 200 + 10 * lvl, spd: d.spd, critR: 0, critD: 0.5, ehr: 0, res: d.boss ? 0.3 : T.enemyEffectRes, dmgP: 0 },
      maxHp: hp, hp, tough: d.tough, maxTough: d.tough, broken: false, weak: d.weak, resist: d.resist || [],
      buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, frozenDmg: 0, stun: 0, taunt: 0, dead: false, av: 0, flags: {},
      mood: { eager: 0, happy: 0, angry: 0, scared: 0 }, charging: null, lockTarget: null, patIdx: 0, turnsTaken: 0, appear: true
    };
  }

  class Battle {
    constructor(opts) {
      this.opts = opts;
      this.rng = H.makeRandom(opts.seed || 1);
      this.allies = opts.party.map((p, i) => makeAlly(p, i));
      this.waves = (opts.waves || [opts.enemies]).map(w => w.slice());
      this.wave = 0;
      this.enemies = [];
      this.sp = opts.sp == null ? T.spStart : opts.sp;
      this.ev = [];
      this.phase = 'run';
      this.current = null;
      this.extra = null;
      this.over = false;
      this.result = null;
      this.boss = !!opts.boss;
      this.noFlee = !!opts.noFlee;
      this.loseOk = !!opts.loseOk;
      this.reward = { exp: 0, credits: 0, drops: [], gifts: [], jade: 0, contacts: [] };
      this.fusionsUsed = new Set();
      this.crossed = new Set();
      this.hitThisAction = new Set();
      this.round = 0;
      this.actions = 0;
      this.su = opts.su ? H.SU.compile(opts.su) : null;
      this.summons = [];
      this.elysPending = [];
      this.spawnWave(true);
    }

    get living() { return this.enemies.filter(alive); }
    get livingAllies() { return this.allies.filter(alive); }
    get livingSummons() { return this.summons.filter(alive); }
    push(e) { this.ev.push(e); }
    orderSnap(cur) { return { t: 'order', cur, av: new Map([...this.livingAllies, ...this.living, ...this.livingSummons].map(u => [u, u.av])) }; }
    drain() { const e = this.ev; this.ev = []; return e; }

    spawnWave(first) {
      const list = this.waves[this.wave];
      this.enemies = list.map((s, i) => {
        const [id, lv] = String(s).split(':');
        return makeEnemy(id, +lv || this.opts.lvl || 1, i, this.opts.foeHp, this.opts.foeAtk);
      });
      for (const u of this.enemies) { u.av = AV / spdOf(u); u.appear = first; if (this.su) this.suFoe(u); }
      if (!first) { this.push(this.orderSnap(this.current)); this.push({ t: 'wave', n: this.wave + 1, list: this.enemies.slice() }); }
    }

    start() {
      const ruan = this.allies.find(a => a.charId === 'ruanmei' && alive(a));
      if (ruan) for (const a of this.allies) if (a !== ruan) a.buffs.push({ s: 'spdP', v: 0.1, turns: 999, name: 'Соматотипическая спираль' });
      for (const a of this.allies) if (a.charId === 'clara') a.buffs.push({ s: 'dr', v: 0.1, turns: 999, name: 'Потому что мы семья' });
      for (const a of this.allies) if (coneFx(a, 'mirror')) for (const b of this.livingAllies) this.gainEnergy(b, 10);
      for (const a of this.allies) a.av = AV / spdOf(a);
      for (const a of this.livingAllies) if (setOn(a, 'vonwacq') && spdOf(a) >= 120) { this.advance(a, 0.4); this.push({ t: 'status', u: a, text: 'Живой Вонвак: ход раньше' }); }
      if (this.su) this.suStart();
      for (const a of this.allies) if (a.charId === 'himeko') a.flags.charges = 1;
      this.huntersStart();
      this.section6Start();
      this.wuwaStart();
      this.axelStart();
      this.inabaStart();
      this.foursStart();
      if (this.memo) this.memo('start', {});
      const o = this.opts;
      if (o.nextAtk) for (const a of this.livingAllies) this.addBuff(a, { s: 'atkP', v: o.nextAtk, turns: 3, name: 'Жаркое' });
      if (o.nextCrit) for (const a of this.livingAllies) this.addBuff(a, { s: 'critR', v: o.nextCrit, turns: 3, name: 'Жареный рис' });
      if (o.ambush === 'enemy') {
        this.push({ t: 'text', text: 'Засада! Враги атакуют первыми.' });
        for (const e of this.enemies) e.av = 0;
      }
      this.push(this.orderSnap(null));
      for (const tch of o.techs || []) this.applyTech(tch);
      if (o.ambush === 'player' && o.leader != null) {
        const l = this.allies[o.leader];
        if (alive(l)) {
          this.push({ t: 'act', u: l, name: 'Удар первым!', kind: 'first' });
          for (const e of this.living) this.hit(l, e, 0.5, { tough: 10, kind: 'first' });
          this.cleanup();
        }
      }
      this.step();
      return this.drain();
    }

    applyTech(tch) {
      const src = this.allies.find(a => a.charId === tch.charId) || this.allies[0];
      const g = H.grow(src.lvl);
      this.push({ t: 'text', text: 'Техника: ' + (H.CHARS[tch.charId] ? H.CHARS[tch.charId].tech.name : '') });
      switch (tch.fx) {
        case 'healAll': for (const a of this.livingAllies) this.heal(src, a, a.maxHp * 0.15); break;
        case 'shieldAll': for (const a of this.livingAllies) this.giveShield(a, defOf(src) * 0.24 + 30 * g, 2); break;
        case 'freezeAll': for (const e of this.living) this.tryFreeze(src, e, 1); break;
        case 'selfAtk': this.addBuff(src, { s: 'atkP', v: 0.4, turns: 3, name: 'Техника' }); break;
        case 'fireVuln': for (const e of this.living) this.addBuff(e, { s: 'fireVuln', v: 0.2, turns: 2, name: 'Неполное сгорание', debuff: true }); break;
        case 'slowAll': for (const e of this.living) { this.delay(e, 0.2); this.addBuff(e, { s: 'spdP', v: -0.1, turns: 2, name: 'Замедление', debuff: true }); } break;
        case 'weaken': for (const e of this.living) this.addBuff(e, { s: 'dmgDealtDown', v: 0.3, turns: 1, name: 'Ослабление', debuff: true }); break;
        case 'stunOne': { const e = this.rng.pick(this.living); if (e) { e.stun = 1; this.push({ t: 'status', u: e, text: 'Оглушение' }); } break; }
        case 'fireAoe': for (const e of this.living) this.hit(src, e, 0.5, { e: 'fire', tough: 5 }); break;
        case 'elecAoe': for (const e of this.living) this.hit(src, e, 0.8, { e: 'elec', tough: 5 }); break;
        case 'seeleBuff': this.addBuff(src, { s: 'dmgP', v: 0.8, turns: 1, name: 'Усиление' }); break;
        case 'teamAtk': for (const a of this.livingAllies) this.addBuff(a, { s: 'atkP', v: 0.15, turns: 2, name: 'Знамя' }); break;
        case 'delayAll': for (const e of this.living) this.delay(e, 0.25); break;
        case 'burnAll': for (const e of this.living) this.addDot(src, e, 'burn', atkOf(src) * 0.35, 2); break;
        case 'defDownAll': for (const e of this.living) this.addBuff(e, { s: 'defDown', v: 0.2, turns: 2, name: 'Защита −20%', debuff: true }); break;
        case 'ruanSkill': this.overtone(); break;
        case 'invigAll': this.invigorate(2); break;
        case 'yanqingTech': this.addBuff(src, { s: 'vsHigh', v: 0.3, turns: 2, name: 'Истинный меч' }); break;
        case 'miyabiTech': this.gainFrost(src, 3); for (const e of this.living) this.icefire(src, e); break;
        case 'yanagiTech': for (const e of this.living) this.addDot(src, e, 'shock', atkOf(src) * 0.6, 2); break;
        case 'phrolovaTech': this.writeNote(src, 'cad'); this.writeNote(src, 'cad'); break;
        case 'kazumaTech':
          for (const a of this.livingAllies) this.advance(a, 0.25);
          this.setLuck(src, Math.min(T.luckMax, (src.flags.luck || 0) + 2));
          break;
        case 'aquaTech':
          for (const a of this.livingAllies) this.heal(src, a, a.maxHp * 0.1);
          for (const e of this.living) if (!e.data.boss) { e.mood.happy += 1; this.push({ t: 'status', u: e, text: 'Радость +1', col: '#80ff90' }); }
          break;
        case 'meguminTech':
          this.actKind = 'tech';
          for (const e of this.living.slice()) this.hit(src, e, 1.8, { e: 'fire', tough: 15, anyTough: true, label: 'Ежедневный взрыв' });
          this.actKind = null;
          if (alive(src)) this.collapse(src, 1);
          break;
        case 'darknessTech':
          src.taunt = 2;
          this.gainEcstasy(src, 3);
          break;
        case 'scarTech': {
          const t = this.living[0];
          if (t) { this.sealElysium(src, t, 2); t.elys.embers = 2; this.push({ t: 'elys', u: t, elys: this.elysSnap(t) }); }
          break;
        }
        case 'kafkaTech':
          for (const e of this.living.slice()) { this.hit(src, e, 0.5, { e: 'elec', tough: 10 }); if (alive(e)) this.addDot(src, e, 'shock', atkOf(src) * T.kafkaShock, 2); }
          break;
        case 'wolfTech':
          for (const e of this.living.slice()) this.hit(src, e, 0.8, { e: 'quant', tough: 20, anyTough: true });
          break;
        case 'bladeTech':
          this.consumeHp(src, 0.2);
          for (const e of this.living.slice()) this.hit(src, e, 0, { e: 'wind', tough: 10, hpM: 0.4 });
          this.resolveShuhu();
          break;
        case 'claraBait':
          for (const e of this.living) this.hit(src, e, 0.8, { tough: 5, label: 'Сварог' });
          this.addBuff(src, { s: 'aggro', v: 4, turns: 2, name: 'Приманка' });
          break;
        default: if (!this.foursTech(tch.fx, src)) this.inabaTech(tch.fx, src);
      }
      this.cleanup();
    }

    overtone() {
      for (const f of H.CHARS.ruanmei.skill.fx) for (const a of this.livingAllies) this.addBuff(a, { s: f.s, v: f.v, turns: f.turns, name: f.name }, f.quiet);
    }

    invigorate(turns) {
      for (const a of this.livingAllies) {
        const cur = a.buffs.find(b => b.s === 'invig');
        if (cur) cur.turns += 1;
        else this.addBuff(a, { s: 'invig', v: 0, turns, name: 'Оживление' });
      }
    }

    invigHeal(u) {
      const bailu = this.allies.find(a => a.charId === 'bailu');
      if (!bailu) return;
      this.push({ t: 'status', u, text: 'Оживление', col: '#9ef0e0' });
      this.heal(bailu, u, bailu.maxHp * 0.054 + 12 * H.grow(bailu.lvl));
    }

    gainSync(u) {
      u.flags.sync = true;
      this.addBuff(u, { s: 'critR', v: 0.2, turns: 999, name: 'Единение' });
      this.addBuff(u, { s: 'critD', v: 0.3, turns: 999, name: 'Единение: крит. урон' }, true);
      this.addBuff(u, { s: 'aggro', v: -0.6, turns: 999, name: 'Единение: скрытность' }, true);
    }

    loseSync(u) {
      u.flags.sync = false;
      u.buffs = u.buffs.filter(b => !b.name.startsWith('Единение'));
      this.push({ t: 'status', u, text: 'Единение потеряно', debuff: true });
    }

    section6Start() {
      const miyabi = this.allies.find(a => a.charId === 'miyabi');
      if (miyabi && this.allies.some(a => a !== miyabi && (a.charId === 'yanagi' || a.path === 'harmony' || a.path === 'nihility'))) miyabi.buffs.push({ s: 'shimoP', v: 0.3, turns: 999, name: 'Мороз и вьюга' });
      for (const a of this.allies) if (a.charId === 'yanagi') { a.flags.stance = 'jo'; a.buffs.push(Object.assign({ turns: 999 }, STANCES.jo)); }
    }

    chaosOn() { return this.allies.some(a => a.charId === 'yanagi' && alive(a)); }

    gainFrost(u, v) {
      if (!u || u.charId !== 'miyabi' || !alive(u)) return;
      const before = u.flags.frost || 0;
      u.flags.frost = Math.min(T.frostMax, before + v);
      if (u.flags.frost !== before) this.push({ t: 'frost', u, v: u.flags.frost, add: u.flags.frost - before });
    }

    chargeLevels(u) { return u && u.kit.charged ? Math.min(u.kit.charged.length, Math.floor((u.flags.frost || 0) / 2)) : 0; }

    setCharge(u, lv) {
      if (!u || !u.kit.charged) return 0;
      u.flags.chargeSel = clamp(lv | 0, 0, this.chargeLevels(u));
      return u.flags.chargeSel;
    }

    icefire(src, t) {
      if (!alive(t) || t.side !== 'enemy' || t.frostbite) return;
      const n = (t.flags.icefire || 0) + 1;
      if (n < T.icefireMax) { t.flags.icefire = n; this.push({ t: 'icefire', u: t, v: n }); return; }
      t.flags.icefire = 0;
      this.push({ t: 'icefire', u: t, v: 0 });
      this.frostbite(src, t);
    }

    frostbite(src, t) {
      this.disorder(src, t, 'frostbite');
      if (!alive(t)) return;
      t.frostbite = { dmg: atkOf(src) * T.frostbiteDmg, turns: 2, src };
      this.push({ t: 'status', u: t, text: 'Обморожение', col: '#bfe8ff', debuff: true });
      this.hit(src, t, 0, { fixed: atkOf(src) * T.frostburnBurst, e: 'ice', isDot: true, label: 'Прорыв ледяного ожога' });
      if (!alive(t)) return;
      this.addBuff(t, { s: 'toughIn', v: T.frostburnTough, turns: 2, name: 'Ледяной ожог', debuff: true });
      if (src.flags.fbAct !== this.actSerial) { src.flags.fbAct = this.actSerial; this.gainFrost(src, 1); }
    }

    anomalies(t) {
      const out = t.dots.map(d => ({ kind: d.type, e: DOT_ELEM[d.type], pend: d.dmg * (d.stacks || 1) * Math.max(1, d.turns) }));
      if (t.frozen && t.frozenSrc) out.push({ kind: 'freeze', e: 'ice', pend: t.frozenDmg });
      if (t.frostbite) out.push({ kind: 'frostbite', e: 'ice', pend: t.frostbite.dmg });
      return out;
    }

    burstOf(list) {
      let pend = 0, big = -1, e = 'phys';
      for (const a of list) { pend += a.pend; if (a.pend > big) { big = a.pend; e = a.e; } }
      return { pend, e };
    }

    disorder(src, t, kind) {
      if (!src || src.side !== 'ally' || !alive(t) || t.side !== 'enemy' || !this.chaosOn()) return;
      const old = this.anomalies(t).filter(a => a.kind !== kind && a.kind !== 'freeze');
      if (old.length) this.chaosBurst(src, t, old);
    }

    chaosBurst(src, t, old) {
      const gone = new Set(old.map(a => a.kind));
      t.dots = t.dots.filter(d => !gone.has(d.type));
      if (gone.has('frostbite')) { delete t.frostbite; t.buffs = t.buffs.filter(b => b.name !== 'Ледяной ожог'); }
      const { pend, e } = this.burstOf(old);
      this.chaosN = (this.chaosN || 0) + 1;
      this.push({ t: 'chaos', u: t, text: 'Хаос!' });
      this.hit(src, t, 0, { fixed: pend * T.chaosMult * (1 + sv(src, 'chaosP') + 0.3 * coneFx(src, 'weaver')), e, isDot: true, label: 'Хаос' });
      const miyabi = this.allies.find(a => a.charId === 'miyabi' && alive(a));
      if (miyabi) this.gainFrost(miyabi, 2);
    }

    polarity(src, t, m) {
      if (!alive(t) || t.side !== 'enemy') return;
      const list = this.anomalies(t);
      if (!list.length) return;
      const { pend, e } = this.burstOf(list);
      this.polarityN = (this.polarityN || 0) + 1;
      this.hit(src, t, 0, { fixed: pend * T.polarityMult * m * (1 + sv(src, 'chaosP') + 0.3 * coneFx(src, 'weaver')), e, isDot: true, label: 'Сбитая полярность' });
    }

    switchStance(u) {
      if (!u || u.charId !== 'yanagi' || !alive(u)) return;
      const from = u.flags.stance === 'ka' ? 'ka' : 'jo', to = from === 'jo' ? 'ka' : 'jo';
      u.buffs = u.buffs.filter(b => b.name !== STANCES[from].name && b.name !== STANCES[to].name + ': эхо');
      u.flags.stance = to;
      u.buffs.push(Object.assign({ turns: 999 }, STANCES[to]));
      this.addBuff(u, { s: STANCES[from].s, v: STANCES[from].v, turns: 1, name: STANCES[from].name + ': эхо' }, true);
      this.push({ t: 'stance', u, stance: to, text: STANCES[to].name });
    }

    svMark(t) { if (alive(t) && t.side === 'enemy') this.addBuff(t, { s: 'svMark', v: 0, turns: 99, name: 'Метка Сварога', debuff: true }); }

    svarogCounter(clara, foe, strong) {
      const adj = strong ? this.adjacent(this.living, foe) : [];
      if (strong) clara.flags.promise--;
      this.acting = clara;
      this.push({ t: 'act', u: clara, name: strong ? 'Сварог: Обещание' : 'Ответный удар Сварога', kind: 'follow' });
      this.hit(clara, foe, strong ? 2.6 : 1.6, { tough: strong ? 20 : 10, e: 'phys', label: 'Сварог', kind: 'follow' });
      this.svMark(foe);
      for (const a of adj) { this.hit(clara, a, 1.3, { tough: 10, e: 'phys', label: 'Сварог', kind: 'follow' }); this.svMark(a); }
      this.gainEnergy(clara, 5);
      if (this.su) this.bless('follow', { u: clara, hits: [foe, ...adj] });
      this.acting = null;
      this.cleanup();
    }

    huntersStart() {
      for (const a of this.allies) {
        if (a.charId === 'kafka') a.flags.trill = true;
        if (a.charId === 'blade') { a.flags.shuhu = 0; a.flags.tally = 0; }
      }
    }

    kafkaTalent(u, hits) {
      const k = this.allies.find(a => a.charId === 'kafka' && a !== u && alive(a) && a.flags.trill);
      const t = hits.find(alive);
      if (!k || !t || this.over) return;
      k.flags.trill = false;
      const prev = this.acting;
      this.acting = k;
      this.push({ t: 'act', u: k, name: 'Жестокая нежность', kind: 'follow' });
      this.hit(k, t, T.kafkaFollow, { e: 'elec', tough: 10, kind: 'follow', label: 'Жестокая нежность' });
      if (alive(t)) { if (this.rng.chance(this.effectChance(k, t, 1))) this.addDot(k, t, 'shock', atkOf(k) * T.kafkaShock, 2); else this.resisted(k); }
      this.gainEnergy(k, 10);
      if (this.su) this.bless('follow', { u: k, hits: [t] });
      this.acting = prev;
    }

    detonate(src, t, ratio) {
      if (!alive(t) || t.side !== 'enemy' || !t.dots.length) return;
      this.detN = (this.detN || 0) + 1;
      this.push({ t: 'status', u: t, text: 'Детонация', col: '#d890ff', debuff: true });
      for (const d of t.dots.slice()) {
        if (!alive(t)) break;
        this.hit(d.src || src, t, 0, { fixed: d.dmg * (d.stacks || 1) * ratio, e: DOT_ELEM[d.type], isDot: true, dot: true, label: DOT_NAME[d.type] + ': детонация' });
        if (d.type === 'burn') this.foursBurn(t);
      }
    }

    debuffCount(t) { return t.buffs.filter(b => b.debuff).length + t.dots.length + (t.implant ? 1 : 0); }

    plantBug(src, t) {
      if (!alive(t) || t.side !== 'enemy') return;
      if (!this.rng.chance(this.effectChance(src, t, T.bugChance))) { this.resisted(src); return; }
      const fresh = BUGS.filter(b => !t.buffs.some(x => x.name === b[3]));
      const [s, sign, key, name] = this.rng.pick(fresh.length ? fresh : BUGS);
      this.addBuff(t, { s, v: sign * T[key], turns: T.bugTurns, name, debuff: true });
    }

    implantChoices() { return [...new Set(this.livingAllies.map(a => a.elem))]; }

    implantElem(u, t) {
      const list = this.implantChoices();
      if (u && u.flags.implantPick && list.includes(u.flags.implantPick)) return u.flags.implantPick;
      const ranked = this.livingAllies.filter(a => a !== u).sort((a, b) => atkOf(b) - atkOf(a)).map(a => a.elem).concat(list);
      return ranked.find(e => !t || !t.data || !t.data.weak.includes(e)) || ranked[0] || 'quant';
    }

    setImplant(u, e) {
      if (!u || u.charId !== 'silverwolf') return null;
      u.flags.implantPick = this.implantChoices().includes(e) ? e : null;
      return u.flags.implantPick;
    }

    implant(src, t, e, sure) {
      if (!alive(t) || t.side !== 'enemy' || !e) return false;
      if (!sure && !this.rng.chance(this.effectChance(src, t, 1))) { this.resisted(src); this.push({ t: 'status', u: t, text: 'Изменения отклонены', debuff: true }); return false; }
      if (t.implant) this.removeImplant(t, true);
      if (t.data.weak.includes(e)) { this.push({ t: 'status', u: t, text: 'Уязвимость уже есть', debuff: true }); return false; }
      t.weak = t.data.weak.concat(e);
      t.implant = { e, turns: T.implantTurns };
      this.push({ t: 'implant', u: t, e, text: 'Уязвимость: ' + H.ELEMENTS[e].name });
      return true;
    }

    removeImplant(t, quiet) {
      if (!t.implant) return;
      delete t.implant;
      t.weak = t.data.weak.slice();
      if (!quiet) this.push({ t: 'implant', u: t, e: null, text: 'Уязвимость пропала' });
    }

    inHell(u) { return !!u && u.charId === 'blade' && u.buffs.some(b => b.name === 'Адский пейзаж'); }

    skillLocked(u) { return this.inHell(u) || this.foursLocked(u); }

    consumeHp(u, frac) {
      if (!alive(u)) return 0;
      const cost = Math.min(Math.round(u.maxHp * frac), u.hp - 1);
      if (cost <= 0) return 0;
      u.hp -= cost;
      this.push({ t: 'dmg', u, src: u, v: cost, e: 'wind', hp: u.hp, shield: u.shield, label: 'Цена клинка' });
      this.hpLost(u, cost);
      this.hurtMark(u);
      return cost;
    }

    hpLost(u, v) {
      if (u.charId === 'blade' && v > 0) u.flags.tally = tallyOf(u, v);
    }

    hurtMark(u) {
      this.foursHurt(u);
      if (u.charId === 'blade') this.gainShuhu(u, 1);
      const k = coneFx(u, 'unreachable');
      if (k && alive(u)) this.addBuff(u, { s: 'dmgP', v: 0.24 * k, turns: 99, name: 'Недоступная сторона' }, true);
    }

    sentence(u) {
      if (!alive(u)) return;
      const half = Math.round(u.maxHp * 0.5);
      if (u.hp > half) {
        const cost = u.hp - half;
        u.hp = half;
        this.push({ t: 'dmg', u, src: u, v: cost, e: 'wind', hp: u.hp, shield: u.shield, label: 'Смертный приговор' });
        this.hpLost(u, cost);
        this.hurtMark(u);
      } else if (u.hp < half) {
        u.hp = half;
        this.push({ t: 'heal', u, v: 0, hp: u.hp });
      }
    }

    gainShuhu(u, n) {
      if (!alive(u) || u.charId !== 'blade') return;
      const before = u.flags.shuhu || 0;
      u.flags.shuhu = Math.min(T.shuhuMax, before + n);
      if (u.flags.shuhu !== before) this.push({ t: 'shuhu', u, v: u.flags.shuhu, add: u.flags.shuhu - before });
    }

    resolveShuhu() {
      const b = this.allies.find(a => a.charId === 'blade' && alive(a) && (a.flags.shuhu || 0) >= T.shuhuMax);
      if (!b || this.over || !this.living.length) return false;
      b.flags.shuhu = 0;
      this.push({ t: 'shuhu', u: b, v: 0, add: 0 });
      const prev = this.acting;
      this.acting = b;
      this.push({ t: 'act', u: b, name: 'Дар Шуху', kind: 'follow' });
      const hits = this.living.slice();
      for (const e of hits) this.hit(b, e, T.shuhuAtk, { e: 'wind', tough: 10, kind: 'follow', hpM: T.shuhuHp, label: 'Дар Шуху' });
      if (alive(b)) this.heal(b, b, b.maxHp * T.shuhuHeal);
      this.gainEnergy(b, 10);
      if (this.su) this.bless('follow', { u: b, hits });
      this.acting = prev;
      this.cleanup();
      return true;
    }

    huntersAfter(u, kind, hits) {
      const basicLike = kind === 'basic' || kind === 'enhanced', own = basicLike || kind === 'skill' || kind === 'ult';
      if (basicLike && hits.length) this.kafkaTalent(u, hits);
      if (u.charId === 'silverwolf' && own) { const t = hits.find(alive); if (t) this.plantBug(u, t); }
      const rain = coneFx(u, 'rain');
      if (rain && own) {
        const pool = hits.filter(t => alive(t) && !t.buffs.some(b => b.name === 'Эфирный код'));
        const t = pool.length ? this.rng.pick(pool) : null;
        if (t && this.rng.chance(this.effectChance(u, t, 0.65))) this.addBuff(t, { s: 'vuln', v: 0.12 * rain, turns: 1, name: 'Эфирный код', debuff: true });
      }
      const pat = coneFx(u, 'patience');
      if (pat && hits.length && kind !== 'fusion') {
        u.flags.patience = Math.min(3, (u.flags.patience || 0) + 1);
        u.buffs = u.buffs.filter(b => b.name !== 'Просто надо подождать');
        u.buffs.push({ s: 'spdP', v: 0.048 * pat * u.flags.patience, turns: 999, name: 'Просто надо подождать' });
        for (const t of hits) if (alive(t) && !t.dots.some(d => d.type === 'erode')) this.addDot(u, t, 'erode', atkOf(u) * 0.6 * pat, 1);
      }
      if (hits.length && kind !== 'fusion' && u.buffs.some(b => b.name === 'Недоступная сторона')) u.buffs = u.buffs.filter(b => b.name !== 'Недоступная сторона');
    }

    wuwaStart() {
      for (const a of this.allies) {
        if (!a.kit.notes) continue;
        a.flags.notes = [];
        this.gainAfter(a, T.afterStart, true);
      }
    }

    gainAfter(u, n, quiet) {
      if (!u || !u.kit.notes || !alive(u)) return;
      const before = u.flags.after || 0;
      u.flags.after = Math.min(T.afterMax, before + n);
      u.buffs = u.buffs.filter(b => b.name !== 'Послезвучие');
      if (u.flags.after > 0) u.buffs.push({ s: 'critD', v: T.afterCritD * u.flags.after, turns: 999, name: 'Послезвучие' });
      if (!quiet && u.flags.after !== before) this.push({ t: 'after', u, v: u.flags.after });
    }

    writeNote(u, kind) {
      if (!u || !u.kit.notes || !alive(u) || u.flags.maestro) return;
      const notes = u.flags.notes || (u.flags.notes = []);
      if (u.flags.cad) { kind = 'cad'; u.flags.cad = false; }
      notes.push(kind);
      if (notes.length > T.notesMax) {
        const i = notes.findIndex(n => n !== 'cad');
        notes.splice(i >= 0 ? i : notes.length - 1, 1);
      }
      this.push({ t: 'notes', u, notes: notes.slice(), add: kind });
    }

    cadenzaNext() {
      for (const a of this.livingAllies) if (a.kit.notes && !a.flags.cad) { a.flags.cad = true; this.push({ t: 'status', u: a, text: 'Следующая нота: каденция', col: '#ffd870' }); }
    }

    maestro(u) {
      if (!u || !u.kit.notes || !alive(u)) return;
      const notes = (u.flags.notes || []).slice();
      u.flags.notes = [];
      u.flags.reinc = false;
      u.flags.maestro = { left: notes };
      this.push({ t: 'notes', u, notes: [] });
      this.addBuff(u, { s: 'atkP', v: T.maestroAtk, turns: 999, name: 'Маэстро' });
      const h = {
        side: 'ally', summon: true, idx: u.idx, id: 'hecate', charId: 'hecate', key: 'hecate', owner: u, name: 'Геката', lvl: u.lvl, elem: 'quant', path: u.path,
        base: { spd: T.hecateSpd }, maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, stun: 0, taunt: 0, dead: false, gone: false, av: 0, flags: {}, appear: true
      };
      this.summons = this.summons.filter(alive);
      this.summons.push(h);
      this.push({ t: 'hecate', u: h, owner: u, on: true, notes: notes.slice() });
      this.push(this.orderSnap(this.current));
    }

    playNote(u, note, h, quiet) {
      const N = NOTES[note], foes = this.living;
      if (!N || !foes.length) return;
      if (!quiet) this.push({ t: 'act', u: h || u, name: N.name, kind: 'summon', note });
      const o = { e: 'quant', label: N.name.split(': ')[1], kind: 'hecate', side: 'hecate', tough: N.tough };
      const list = note === 'str' ? [foes.reduce((a, b) => (b.hp > a.hp ? b : a))] : foes.slice();
      for (const t of list) { this.hit(u, t, N.m, o); if (N.delay) this.delay(t, N.delay); }
      this.gainAfter(u, 1);
      const lethe = coneFx(u, 'lethe');
      if (lethe) {
        this.addBuff(u, { s: 'dmgP', v: 0.32 * lethe, turns: 2, name: 'Летейская элегия' }, true);
        this.addBuff(u, { s: 'defIgnore', v: 0.08 * lethe, turns: 2, name: 'Летейская элегия: защита' }, true);
      }
    }

    summonTurn(h) {
      const u = h.owner, m = u && u.flags.maestro;
      if (!alive(u) || !m) { this.hecateLeave(h); return; }
      this.acting = h;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      for (const note of m.left.splice(0, T.notesPerTurn)) {
        if (this.over || !this.living.length) break;
        this.playNote(u, note, h);
      }
      this.acting = null;
      this.cleanup();
      if (this.over) return;
      if (!m.left.length) this.curtainCall(h);
      else h.av = AV / spdOf(h);
    }

    curtainCall(h) {
      const u = h.owner;
      if (alive(u) && this.living.length) {
        this.acting = h;
        this.hitThisAction = new Set();
        this.push({ t: 'act', u: h, name: 'Финальный поклон', kind: 'summon', note: 'curtain' });
        const m = 1.2 * (1 + T.curtainPerAfter * (u.flags.after || 0));
        for (const t of this.living.slice()) this.hit(u, t, m, { e: 'quant', label: 'Финальный поклон', kind: 'hecate', side: 'hecate', tough: 20 });
        this.acting = null;
        this.cleanup();
      }
      this.hecateLeave(h);
      if (this.over || !alive(u)) return;
      const others = this.livingAllies.filter(a => a !== u), pool = others.length ? others : [u];
      const next = pool.reduce((a, b) => (b.av < a.av ? b : a));
      this.addBuff(next, { s: 'dmgP', v: T.outroDmg, turns: 1, name: 'Неоконченная пьеса' });
    }

    hecateLeave(h) {
      if (h.gone) return;
      h.gone = true;
      const u = h.owner;
      this.summons = this.summons.filter(s => s !== h);
      if (u) {
        u.flags.maestro = null;
        u.buffs = u.buffs.filter(b => b.name !== 'Маэстро');
      }
      this.push({ t: 'hecate', u: h, owner: u, on: false });
      this.push(this.orderSnap(this.current));
    }

    elysSnap(t) { return t.elys ? { need: t.elys.need, broke: t.elys.broke.length, embers: t.elys.embers, rounds: t.elys.rounds } : null; }

    sealElysium(scar, t, need) {
      if (!alive(t) || t.side !== 'enemy') return;
      const e = t.elys;
      if (e && e.by === scar) {
        e.embers = Math.min(T.embersMax, e.embers + 2);
        e.rounds = T.elysRounds;
        e.need = Math.min(e.need, need);
        if (e.broke.length >= e.need && !this.elysPending.includes(t)) this.elysPending.push(t);
      } else t.elys = { by: scar, need, broke: [], embers: 0, rounds: T.elysRounds };
      this.push({ t: 'elys', u: t, elys: this.elysSnap(t) });
      this.scarAura();
    }

    breakSeal(src, t, key) {
      const e = t.elys;
      if (src === e.by || e.broke.includes(key) || e.broke.length >= e.need) return;
      e.broke.push(key);
      this.push({ t: 'seal', u: t, left: e.need - e.broke.length, elys: this.elysSnap(t) });
      if (e.broke.length >= e.need && !this.elysPending.includes(t)) this.elysPending.push(t);
    }

    resolveElysium() {
      if (this.elysBusy) return;
      this.elysBusy = true;
      while (this.elysPending.length && !this.over) {
        const t = this.elysPending.shift();
        if (alive(t) && t.elys) this.elysiumBurst(t);
      }
      this.elysBusy = false;
    }

    elysiumBurst(t) {
      const e = t.elys, scar = e.by;
      delete t.elys;
      this.scarAura();
      this.push({ t: 'elysBurst', u: t });
      if (!alive(scar)) return;
      const prev = this.acting;
      this.acting = scar;
      this.push({ t: 'act', u: scar, name: 'Разрыв Элизиума', kind: 'follow' });
      const lull = coneFx(scar, 'lullaby'), m = T.elysBurst + T.emberMult * e.embers;
      const o = { label: 'Разрыв Элизиума', kind: 'follow', extraBonus: 0.3 * lull };
      const adj = this.adjacent(this.living, t);
      this.hit(scar, t, m, Object.assign({ tough: 20 }, o));
      for (const a of adj) this.hit(scar, a, m * T.elysAdj, Object.assign({ tough: 10 }, o));
      if (lull && alive(scar)) this.addBuff(scar, { s: 'atkP', v: 0.24 * lull, turns: 2, name: 'Колыбельная' });
      if (scar.flags.nightmare > 0) this.heal(scar, scar, scar.maxHp * T.nightmareHeal);
      this.gainEnergy(scar, 10);
      this.advance(scar, T.elysAdvance);
      if (this.su) this.bless('follow', { u: scar, hits: [t, ...adj] });
      this.acting = prev;
    }

    scarAura() {
      for (const s of this.allies) {
        if (s.charId !== 'scar') continue;
        const on = alive(s) && this.living.some(t => t.elys && t.elys.by === s);
        const has = s.buffs.some(b => b.name === 'Хозяин Элизиума');
        if (on && !has) s.buffs.push({ s: 'dr', v: T.elysDr, turns: 999, name: 'Хозяин Элизиума' });
        if (!on && has) s.buffs = s.buffs.filter(b => b.name !== 'Хозяин Элизиума');
      }
    }

    endNightmare(u) {
      u.flags.nightmare = 0;
      u.elem = u.kit.elem;
      const cost = Math.min(Math.round(u.hp * T.nightmareCost), u.hp - 1);
      if (cost > 0) { u.hp -= cost; this.push({ t: 'dmg', u, src: u, v: cost, e: 'quant', hp: u.hp, shield: u.shield, label: 'Цена эволюции' }); }
      this.push({ t: 'form', u, on: false });
    }

    axelStart() {
      for (const a of this.allies) {
        if (a.charId === 'kazuma') a.buffs.push({ s: 'critR', v: T.kazumaCrit, turns: 999, name: 'Невероятная удача', perm: true });
        if (a.charId === 'darkness') a.buffs.push({ s: 'res', v: T.darknessRes, turns: 999, name: 'Крепкое тело', perm: true });
      }
    }

    gainLuck(n) {
      const k = this.allies.find(a => a.charId === 'kazuma' && alive(a));
      if (!k || n <= 0) return;
      this.setLuck(k, Math.min(T.luckMax, (k.flags.luck || 0) + n));
    }

    setLuck(u, v) {
      if (!u) return;
      const before = u.flags.luck || 0;
      u.flags.luck = v;
      u.buffs = u.buffs.filter(b => b.name !== 'Удача' && b.name !== 'Удача: эффекты');
      if (v > 0) { u.buffs.push({ s: 'critR', v: T.luckCrit * v, turns: 999, name: 'Удача' }); u.buffs.push({ s: 'ehr', v: T.luckEhr * v, turns: 999, name: 'Удача: эффекты' }); }
      if (v !== before) this.push({ t: 'luck', u, v, add: v - before });
    }

    resisted(src) { if (src && src.side === 'ally') this.gainLuck(1); }

    immobile(t) { return !!t && t.side === 'enemy' && (t.broken || t.frozen > 0 || t.flags.bound > 0); }

    gainEcstasy(u, n) {
      if (!u || u.charId !== 'darkness' || !alive(u)) return;
      const before = u.flags.ecstasy || 0;
      u.flags.ecstasy = Math.min(T.ecstasyMax, before + n);
      u.buffs = u.buffs.filter(b => b.name !== 'Восторг');
      if (u.flags.ecstasy > 0) u.buffs.push({ s: 'defP', v: T.ecstasyDef * u.flags.ecstasy, turns: 999, name: 'Восторг' });
      if (u.flags.ecstasy !== before) this.push({ t: 'ecstasy', u, v: u.flags.ecstasy, add: u.flags.ecstasy - before });
    }

    miss(actor, t) {
      this.push({ t: 'miss', u: t, src: actor });
      t.flags.provoke = actor;
      this.push({ t: 'status', u: t, text: 'Вызов', col: '#ffb0d8', debuff: true });
      this.gainEcstasy(actor, 1);
      this.gainLuck(1);
    }

    collapse(u, n) {
      if (!u || !alive(u)) return;
      u.flags.chant = 0;
      u.flags.collapse = n;
      u.buffs = u.buffs.filter(b => !b.name.startsWith('Без сил'));
      u.buffs.push({ s: 'defP', v: -T.collapseDef, turns: 999, name: 'Без сил', debuff: true });
      u.buffs.push({ s: 'aggro', v: 1, turns: 999, name: 'Без сил: беззащитна', debuff: true });
      this.push({ t: 'collapse', u, on: true, v: n });
    }

    wake(u) {
      if (!u || !u.flags.collapse && !u.buffs.some(b => b.name === 'Без сил')) return;
      u.flags.collapse = 0;
      u.buffs = u.buffs.filter(b => !b.name.startsWith('Без сил'));
      this.push({ t: 'collapse', u, on: false, v: 0 });
    }

    coverer(tgt) { return this.allies.find(a => a.charId === 'darkness' && a !== tgt && alive(a) && a.flags.cover > 0) || null; }

    coverHit(src, dk, v, e) {
      v = Math.round(v * (1 - clamp(sv(dk, 'dr'), 0, 0.9)));
      let absorbed = 0;
      if (dk.shield > 0) { absorbed = Math.min(dk.shield, v); dk.shield -= absorbed; v -= absorbed; if (dk.shield <= 0) { dk.shield = 0; dk.shieldT = 0; } }
      dk.hp = Math.max(0, dk.hp - v);
      this.push({ t: 'dmg', u: dk, src, v: v + absorbed, crit: false, e, hp: dk.hp, shield: dk.shield, label: 'Прикрытие' });
      if (!this.hitThisAction.has(dk)) { this.hitThisAction.add(dk); this.gainEnergy(dk, T.energyHit); }
      this.gainEcstasy(dk, 1);
      if (dk.hp <= 0) this.onZero(dk, src);
    }

    loot(u, t, sure) {
      if (!this.rng.chance(sure ? 1 : clamp(T.stealLoot + sv(u, 'critR'), 0, 1))) return;
      const rare = this.rng.chance(sure ? T.stealRare * 2 : T.stealRare);
      const id = rare ? 'relic' : this.rng.pick(['medkit', 'coffee', 'exp1', 'thermos', 'credits']);
      this.reward.drops.push(id);
      const name = id === 'relic' ? 'реликвия' : id === 'credits' ? 'кредиты' : H.ITEMS[id].name;
      this.push({ t: 'loot', u: t, src: u, item: id, text: 'Добыча: ' + name });
    }

    axelConeDmg(src) {
      if (src.side !== 'ally') return 0;
      let b = 0;
      const ch = coneFx(src, 'chunchun');
      if (ch) b += 0.03 * ch * (src.flags.luck || 0) + (src.flags.chun ? 0.2 * ch : 0);
      const dk = this.allies.find(a => alive(a) && coneFx(a, 'adamant'));
      if (dk) b += 0.02 * coneFx(dk, 'adamant') * Math.min(T.ecstasyMax, dk.flags.ecstasy || 0);
      return b;
    }

    axelAfter(u, hits) {
      if (u.flags.chunArm) { u.flags.chunArm = false; u.flags.chun = true; }
      else if (u.flags.chun && hits.length) u.flags.chun = false;
    }

    axelMult(actor, f, t, m, pv) {
      let v = m;
      if (f.chant) v *= 1 + (T.chantDmg + 0.1 * coneFx(actor, 'manastaff')) * (actor.flags.chant || 0);
      if (f.luck) v += f.luck * (actor.flags.luck || 0);
      if (f.holy && unholy(t)) v += f.holy * (1 + T.tearsHoly * (pv ? actor.flags.tears || 0 : this.tearsNow || 0));
      return v * (!pv && this.failNow ? T.failMult : 1);
    }

    wetFreeze(src, t) {
      t.buffs = t.buffs.filter(b => b.s !== 'wet');
      if (bigFoe(t) && !this.rng.chance(T.wetFreezeBig)) { this.push({ t: 'status', u: t, text: 'Стряхнул воду', debuff: true }); this.resisted(src); return false; }
      return this.tryFreeze(src, t, 1, true);
    }

    setSkill(u, i) {
      if (!u || !u.kit.skills) return 0;
      if (u.kit.personas && u.flags.personaLock) return u.flags.skillSel | 0;
      const n = u.kit.skills.length;
      const before = u.flags.skillSel | 0;
      u.flags.skillSel = ((i % n) + n) % n;
      if (u.kit.personas) this.setPersona(u, u.flags.skillSel, u.flags.skillSel === before);
      return u.flags.skillSel;
    }

    addBuff(u, b, quiet) {
      if (!alive(u)) return;
      const nb = Object.assign({ turns: 1 }, b);
      if (this.current === u || this.acting === u) nb.skip = 1;
      const i = u.buffs.findIndex(x => x.name === nb.name && x.s === nb.s);
      if (i >= 0) u.buffs[i] = nb; else u.buffs.push(nb);
      if (!quiet) this.push({ t: 'status', u, text: nb.name, debuff: !!nb.debuff });
    }

    breakDmg(src, tgt, m) { return H.breakBase(src.lvl) * (1 + sv(src, 'breakE')) * (0.5 + tgt.maxTough / 40) * m; }

    rebloom(u, mark) {
      u.buffs = u.buffs.filter(b => b !== mark);
      const src = mark.src;
      this.push({ t: 'status', u, text: 'Цветение: пробитие продлено', col: '#bff4ff', debuff: true });
      this.hit(src, u, 0, { fixed: this.breakDmg(src, u, 0.6), e: 'ice', isDot: true, label: 'Цветение' });
      if (alive(u)) u.av = (0.2 + 0.1 * sv(src, 'breakE')) * AV / spdOf(u);
    }

    danhengTalent(u) {
      if (u.flags.windCd > 0 || u.flags.wind) return;
      u.flags.wind = true;
      u.flags.windCd = 2;
      u.buffs.push({ s: 'resPen', v: 0.36, turns: 99, name: 'Верхом на ветре' });
    }

    delay(u, v) { if (alive(u)) u.av += v * AV / spdOf(u); }
    advance(u, v) { if (alive(u)) u.av = Math.max(0, u.av - v * AV / spdOf(u)); }

    effectChance(src, tgt, base) {
      const ehr = src ? sv(src, 'ehr') : 0;
      return clamp(base * (1 + ehr) * (1 - sv(tgt, 'res')), 0, 1);
    }

    tryFreeze(src, tgt, base, sure) {
      if (!alive(tgt)) return false;
      if (!sure && !this.rng.chance(this.effectChance(src, tgt, base))) { this.resisted(src); return false; }
      if (!tgt.frozen) this.disorder(src, tgt, 'freeze');
      if (!alive(tgt)) return false;
      tgt.frozen = 1;
      tgt.frozenDmg = src ? atkOf(src) * 0.3 : 0;
      tgt.frozenSrc = src;
      this.push({ t: 'status', u: tgt, text: 'Заморозка', col: '#8adfff', debuff: true });
      if (this.su && src && src.side === 'ally') this.bless('freeze', { src, tgt });
      return true;
    }

    addDot(src, tgt, type, dmg, turns, stackMax) {
      if (!alive(tgt)) return;
      if (!tgt.dots.some(d => d.type === type)) this.disorder(src, tgt, type);
      if (!alive(tgt)) return;
      const ex = tgt.dots.find(d => d.type === type);
      if (ex) {
        ex.turns = Math.max(ex.turns, turns);
        ex.dmg = Math.max(ex.dmg, dmg);
        if (stackMax) ex.stacks = Math.min(stackMax, (ex.stacks || 1) + 1);
        ex.src = src;
      } else tgt.dots.push({ type, dmg, turns, src, stacks: 1 });
      this.push({ t: 'status', u: tgt, text: DOT_NAME[type], col: H.ELEMENTS[DOT_ELEM[type]].col, debuff: true });
    }

    giveShield(u, v, turns) {
      if (!alive(u)) return;
      v = Math.round(v * (1 + sv(u, 'shieldP')));
      if (v >= u.shield) { u.shield = v; }
      u.shieldT = Math.max(u.shieldT, turns);
      this.push({ t: 'shield', u, v: u.shield });
    }

    heal(src, u, v) {
      if (!alive(u)) return 0;
      let m = 1 + (src ? sv(src, 'healP') : 0) + sv(u, 'healIn');
      if (src && src.charId === 'natasha' && u.hp / u.maxHp <= 0.3) m += 0.5;
      const amt = Math.round(v * m);
      const before = u.hp;
      u.hp = Math.min(u.maxHp, u.hp + amt);
      this.push({ t: 'heal', u, v: u.hp - before, hp: u.hp });
      const got = u.hp - before;
      const hg = src ? coneFx(src, 'hagoromo') : 0;
      if (hg) this.addBuff(u, { s: 'res', v: 0.2 * hg, turns: 2, name: 'Перьевая мантия' }, true);
      if (this.su && got > 0 && u.side === 'ally') {
        this.bless('heal', { u, amt: got, src });
        if (src && src !== u && src.side === 'ally') this.bless('healGive', { src, u, amt: got });
      }
      return got;
    }

    dmgCalc(src, tgt, mult, o, crit) {
      const e = o.e || src.elem;
      const base = o.fixed != null ? o.fixed : mult * (o.stat === 'def' ? defOf(src) : o.stat === 'hp' ? src.maxHp : atkOf(src)) + (o.plusDef || 0) * defOf(src) + (o.hpM || 0) * src.maxHp + (o.tallyM ? o.tallyM * tallyOf(src, o.tallyPlus) : 0);
      let bonus = 1 + sv(src, 'dmgP') + sv(src, e + 'P') + (o.kind === 'ult' ? sv(src, 'ultP') : 0) + (o.extraBonus || 0);
      if (o.dot) bonus += sv(src, 'dotP');
      if (o.kind === 'follow') bonus += sv(src, 'followP');
      if (o.kind === 'skill') bonus += sv(src, 'skillP');
      if (this.memoDmg) bonus += this.memoDmg(src, tgt, o);
      if (o.charged) bonus += sv(src, 'shimoP') + (tgt.buffs.some(b => b.name === 'Ледяной ожог') ? T.shimoVsBurn : 0);
      if (tgt.frozen && (o.kind === 'skill' || o.kind === 'ult')) bonus += sv(src, 'vsFrozen');
      if (src.charId === 'arlan') bonus += 0.72 * (1 - src.hp / src.maxHp);
      bonus += this.inabaDmg(src, tgt, o);
      bonus += this.foursDmg(src, tgt, o);
      bonus += this.axelConeDmg(src);
      if (tgt.hp >= tgt.maxHp * 0.5) bonus += bsum(src, 'vsHigh');
      const night = coneFx(src, 'night'), nightSt = night ? clamp(Math.floor((spdOf(src) - 100) / 10), 0, 6) * night : 0;
      if (['basic', 'skill', 'enhanced'].includes(o.kind)) bonus += 0.06 * nightSt;
      if ((o.kind === 'ult' || o.kind === 'follow') && setOn(src, 'salsotto') && sv(src, 'critR') >= 0.5 - 1e-9) bonus += 0.15;
      const critM = crit ? 1 + sv(src, 'critD') + (o.kind === 'ult' ? 0.12 * nightSt : 0) : 1;
      const K = 200 + 10 * src.lvl;
      const tdef = defOf(tgt) * (1 - clamp(sv(tgt, 'defDown'), 0, 1)) * (o.kind === 'follow' ? 1 - clamp(sv(src, 'followDefIgnore'), 0, 1) : 1) * (1 - clamp(bsum(src, 'defIgnore'), 0, 1));
      const defM = K / (tdef + K);
      let res = 0;
      if (tgt.side === 'enemy') res = tgt.weak.includes(e) ? 0 : tgt.resist.includes(e) ? T.resistRes : T.defaultRes;
      res -= sv(src, 'resPen');
      if (tgt.side === 'enemy') res -= bsum(tgt, 'resDown');
      const resM = 1 - clamp(res, -1, 0.9);
      const vuln = 1 + sv(tgt, 'vuln') + sv(tgt, e + 'Vuln') + (o.isDot ? sv(tgt, 'dotVuln') : 0);
      const brokenM = tgt.side === 'enemy' && !tgt.broken && !o.broken ? T.unbrokenMult : 1;
      const dr = (1 - clamp(sv(tgt, 'dr'), 0, 0.9)) * (1 - clamp(sv(src, 'dmgDealtDown'), 0, 0.9)) * (tgt.charId === 'aqua' && unholy(src) ? 1 - T.unholyDr : 1);
      return Math.max(1, Math.round(base * bonus * critM * defM * resM * vuln * brokenM * dr));
    }

    hit(src, tgt, mult, o = {}) {
      if (!alive(tgt)) return 0;
      const e = o.e || src.elem;
      let crit = false;
      if (!o.isDot && o.fixed == null && o.raw == null) crit = !!o.alwaysCrit || this.rng() < clamp(sv(src, 'critR') + (o.kind === 'follow' ? bsum(src, 'followCritR') : 0) + (coneFx(src, 'rain') && this.debuffCount(tgt) >= 3 ? 0.12 * coneFx(src, 'rain') : 0) + bsum(tgt, 'critTaken'), 0, 1);
      let dmg = o.raw != null ? Math.max(1, Math.round(o.raw)) : this.dmgCalc(src, tgt, mult, o, crit);
      if (tgt.side === 'ally' && src.side === 'enemy' && !o.isDot && dmg > 1) {
        const dk = this.coverer(tgt);
        if (dk) { const share = Math.round(dmg * T.coverShare); dmg -= share; this.coverHit(src, dk, share, e); }
      }
      let absorbed = 0;
      if (tgt.shield > 0) {
        absorbed = Math.min(tgt.shield, dmg);
        tgt.shield -= absorbed;
        dmg -= absorbed;
        if (tgt.shield <= 0) { tgt.shield = 0; tgt.shieldT = 0; }
      }
      const before = tgt.hp;
      tgt.hp = Math.max(0, tgt.hp - dmg);
      if (tgt.side === 'enemy' && before > tgt.maxHp * 0.5 && tgt.hp <= tgt.maxHp * 0.5 && tgt.hp > 0) this.crossed.add(tgt);
      this.push({ t: 'dmg', u: tgt, src, v: dmg + absorbed, crit, e, hp: tgt.hp, shield: tgt.shield, label: o.label, dot: !!o.isDot });
      const critTough = crit && src.charId === 'chie' && !tgt.weak.includes(e) && !o.anyTough;
      if (tgt.side === 'enemy' && o.tough && !tgt.broken && (tgt.weak.includes(e) || o.anyTough || critTough) && tgt.tough > 0) {
        const toughBefore = tgt.tough;
        tgt.tough = Math.max(0, tgt.tough - o.tough * (critTough ? T.chieCritTough : 1) * (1 + sv(src, 'breakEff')) * (1 + sv(tgt, 'toughIn')));
        this.push({ t: 'tough', u: tgt, v: tgt.tough });
        this.foursTough(src, tgt, toughBefore - tgt.tough, o);
        if (tgt.tough <= 0) this.doBreak(src, tgt, e);
      }
      let first = false;
      if (tgt.side === 'ally' && src.side === 'enemy' && !o.isDot) {
        if (tgt.flags.sync && dmg > 0) this.loseSync(tgt);
        if (!this.hitThisAction.has(tgt)) { first = true; this.hitThisAction.add(tgt); this.gainEnergy(tgt, T.energyHit); }
        if (tgt.charId === 'darkness') this.gainEcstasy(tgt, 1);
        if (first) this.hurtMark(tgt);
        if (this.memo) this.memo('hurt', { u: tgt, dmg });
      }
      if (tgt.side === 'ally' && tgt.charId === 'blade' && before > tgt.hp) this.hpLost(tgt, before - tgt.hp);
      if (tgt.hp <= 0) this.onZero(tgt, src);
      if (tgt.elys && alive(tgt) && src.side === 'ally' && !o.isDot) this.breakSeal(src, tgt, o.side || src.key);
      if (src.charId === 'miyabi' && e === 'ice' && !o.isDot && tgt.side === 'enemy') this.icefire(src, tgt);
      if (e === 'ice' && !o.isDot && tgt.side === 'enemy' && alive(tgt) && tgt.buffs.some(b => b.s === 'wet')) this.wetFreeze(src, tgt);
      if (first && alive(tgt) && tgt.buffs.some(b => b.s === 'invig')) this.invigHeal(tgt);
      if (this.su) {
        if (first) { this.clearCritBoost(); this.bless('hurt', { u: tgt, src, lost: before - tgt.hp, shieldBefore: tgt.shield + absorbed }); }
        if (tgt.side === 'ally') this.suLow(tgt);
        if (o.dot && tgt.side === 'enemy') this.bless('dot', { tgt, src });
      }
      if (tgt.side === 'enemy' && src.side === 'ally' && !o.isDot && !o.echo) this.stitchEcho(src, tgt, dmg + absorbed, o);
      return dmg + absorbed;
    }

    onZero(tgt, src) {
      if (tgt.side === 'ally' && tgt.charId === 'gepard' && !tgt.flags.revived) {
        tgt.flags.revived = true;
        tgt.hp = Math.round(tgt.maxHp * 0.5);
        tgt.dots = []; tgt.buffs = tgt.buffs.filter(b => !b.debuff);
        this.push({ t: 'revive', u: tgt, hp: tgt.hp, text: 'Непоколебимость!' });
        return;
      }
      const bailu = tgt.side === 'ally' && this.allies.find(a => a.charId === 'bailu' && (alive(a) || a === tgt));
      if (bailu && !bailu.flags.elixir) {
        bailu.flags.elixir = true;
        const amt = Math.round((bailu.maxHp * 0.18 + 40 * H.grow(bailu.lvl)) * (1 + sv(bailu, 'healP')));
        tgt.hp = Math.min(tgt.maxHp, amt);
        this.push({ t: 'revive', u: tgt, hp: tgt.hp, text: 'Тыква эликсира!' });
        return;
      }
      if (tgt.side === 'ally' && this.su && this.suSurvive(tgt)) return;
      tgt.dead = true;
      tgt.shield = 0;
      this.push({ t: 'kill', u: tgt });
      if (this.memo) this.memo(tgt.side === 'ally' ? 'down' : 'kill', { u: tgt, src });
      if (tgt.elys) { delete tgt.elys; this.scarAura(); }
      if (tgt.side === 'ally') for (const h of this.summons.slice()) if (h.owner === tgt) this.hecateLeave(h);
      if (tgt.side === 'ally' && tgt.charId === 'scar') this.scarAura();
      if (tgt.side === 'enemy') {
        const firstKill = !tgt.rewarded;
        this.grantEnemyReward(tgt, 1);
        if (src && src.side === 'ally') {
          this.gainEnergy(src, T.energyKill);
          if (src.charId === 'seele' && this.acting === src && !src.flags.inExtra) src.flags.resurge = true;
          if (firstKill && src.charId === 'megumin' && ['ult', 'fusion', 'tech'].includes(this.actKind)) { this.gainEnergy(src, T.boomKillEnergy); this.boomExp = Math.min(T.boomExpMax, (this.boomExp || 0) + T.boomExp); }
          if (this.killEnergy && this.acting === src) this.gainEnergy(src, this.killEnergy);
          if (this.su) this.bless('kill', { src, tgt });
        }
      }
    }

    grantEnemyReward(u, expMult) {
      if (u.rewarded) return;
      u.rewarded = true;
      const d = u.data;
      this.reward.exp += Math.round(H.enemyExp(u.lvl, d.exp) * expMult);
      this.reward.credits += Math.round((12 + 6 * u.lvl) * (d.credits == null ? 1 : d.credits) * expMult);
      if (!d.boss && this.rng.chance(d.elite ? 0.6 : 0.12)) this.reward.drops.push(d.elite ? 'relic' : this.rng.pick(['medkit', 'exp1', 'exp1', 'coffee']));
    }

    doBreak(src, tgt, e) {
      tgt.broken = true;
      tgt.tough = 0;
      this.inabaBreak(src, tgt);
      this.foursBreak(src, tgt);
      const coef = H.ELEMENTS[e].coef;
      const bb = H.breakBase(src.lvl) * (1 + sv(src, 'breakE'));
      this.push({ t: 'break', u: tgt, e, text: 'ПРОБИТИЕ! ' + H.BREAK_EFFECT[e] });
      if (this.su && src.side === 'ally') this.bless('break', { src, tgt, e, dmg: bb * coef * (0.5 + tgt.maxTough / 40) });
      this.hit(src, tgt, 0, { fixed: bb * coef * (0.5 + tgt.maxTough / 40), e, isDot: true, label: 'Пробитие' });
      if (!alive(tgt)) return;
      const ruan = this.allies.find(a => a.charId === 'ruanmei' && alive(a));
      if (ruan && src.side === 'ally') {
        this.hit(ruan, tgt, 0, { fixed: this.breakDmg(ruan, tgt, 1.2), e: 'ice', isDot: true, label: 'Спираль' });
        if (!alive(tgt)) return;
      }
      this.delay(tgt, T.brokenDelay);
      if (tgt.charging != null || tgt.lockTarget) {
        tgt.charging = null; tgt.lockTarget = null;
        this.push({ t: 'text', text: tgt.name + ': подготовка прервана!' });
      }
      if (tgt.shield > 0) { tgt.shield = 0; this.push({ t: 'status', u: tgt, text: 'Щит разрушен' }); }
      const big = tgt.data.boss || tgt.data.elite;
      switch (e) {
        case 'phys': this.addDot(src, tgt, 'bleed', Math.min(tgt.maxHp * (big ? 0.05 : 0.16), bb * 3), 2); break;
        case 'fire': this.addDot(src, tgt, 'burn', bb, 2); break;
        case 'ice': this.disorder(src, tgt, 'freeze'); if (!alive(tgt)) break; tgt.frozen = 1; tgt.frozenDmg = bb; tgt.frozenSrc = src; this.push({ t: 'status', u: tgt, text: 'Заморозка', col: '#8adfff', debuff: true }); break;
        case 'elec': this.addDot(src, tgt, 'shock', bb * 2, 2); break;
        case 'wind': this.addDot(src, tgt, 'shear', bb * (big ? 3 : 1), 2); break;
        case 'quant': this.delay(tgt, 0.2); this.addDot(src, tgt, 'entangle', bb * 1.2, 1); break;
        case 'imag': this.delay(tgt, 0.3); this.addBuff(tgt, { s: 'spdP', v: -0.1, turns: 1, name: 'Заточение', debuff: true }); break;
      }
      for (const a of this.allies) {
        if (!alive(a)) continue;
        if (a.charId === 'himeko') a.flags.charges = Math.min(3, (a.flags.charges || 0) + 1);
        if (a.charId === 'trail' && a === src && (a.flags.stacks || 0) < 2) {
          a.flags.stacks = (a.flags.stacks || 0) + 1;
          a.buffs.push({ s: 'atkP', v: 0.2, turns: 999, name: 'Воля разрушения ' + a.flags.stacks });
          this.push({ t: 'status', u: a, text: 'Атака +20%' });
        }
      }
    }

    gainEnergy(u, v) {
      if (!alive(u) || u.side !== 'ally') return;
      u.energy = Math.min(u.maxEnergy, u.energy + v * (1 + sv(u, 'err')));
    }

    pickTarget(u) {
      const list = this.livingAllies;
      if (!list.length) return null;
      if (u.lockTarget && alive(u.lockTarget)) return u.lockTarget;
      if (u.elys && alive(u.elys.by)) return u.elys.by;
      if (u.flags.provoke && alive(u.flags.provoke)) return u.flags.provoke;
      const taunters = list.filter(a => a.taunt > 0);
      if (taunters.length) return this.rng.pick(taunters);
      let total = 0;
      const w = list.map(a => { const v = H.PATHS[a.path].aggro * Math.max(0.1, 1 + bsum(a, 'aggro')) * (a.charId === 'aqua' && unholy(u) ? T.unholyAggro : 1); total += v; return v; });
      let r = this.rng() * total;
      for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; }
      return list[list.length - 1];
    }

    adjacent(list, t) {
      const i = list.indexOf(t);
      return [list[i - 1], list[i + 1]].filter(Boolean);
    }

    startTurn(u) {
      if (u.side === 'enemy' && u.elys && --u.elys.rounds <= 0) { delete u.elys; this.push({ t: 'elysEnd', u }); this.scarAura(); }
      if (u.side === 'enemy' && u.flags.bindImm > 0 && !u.flags.bound) u.flags.bindImm--;
      if (u.side === 'enemy' && u.broken) {
        const mark = u.buffs.find(b => b.s === 'bloom');
        if (mark) { this.rebloom(u, mark); return alive(u) ? 'bloom' : 'dead'; }
        u.broken = false;
        u.tough = u.maxTough;
        this.push({ t: 'recover', u });
      }
      if (u.side === 'ally') {
        if (this.memo) this.memo('turn', { u });
        if (u.charId === 'march') u.flags.counters = 2;
        if (u.charId === 'kafka') u.flags.trill = true;
        if (u.charId === 'silverwolf') u.flags.implantPick = null;
        this.inabaTurn(u);
        this.foursTurn(u);
        if (u.charId === 'asta' && u.flags.charge) { u.flags.charge = Math.max(0, u.flags.charge - 3); this.astaAura(u); }
        if (u.flags.windCd > 0) u.flags.windCd--;
      }
      const echo = this.su && u.side === 'enemy' ? this.suEcho() : 0;
      for (const d of u.dots.slice()) {
        if (!alive(u)) break;
        this.hit(d.src || u, u, 0, { fixed: d.dmg * (d.stacks || 1), e: DOT_ELEM[d.type], isDot: true, dot: true, label: DOT_NAME[d.type] });
        if (echo && alive(u)) this.hit(d.src || u, u, 0, { fixed: d.dmg * (d.stacks || 1) * echo, e: DOT_ELEM[d.type], isDot: true, dot: true, label: 'Отзвук' });
        if (d.type === 'burn' && u.side === 'enemy') { this.burnHeal(); this.foursBurn(u); }
        d.turns--;
      }
      u.dots = u.dots.filter(d => d.turns > 0);
      if (u.frostbite && --u.frostbite.turns <= 0) delete u.frostbite;
      if (!alive(u)) { this.cleanup(); return 'dead'; }
      for (const b of u.buffs) if (b.hot && alive(u)) this.heal(b.src, u, b.hot);
      if (u.side === 'ally' && u.flags.collapse > 0) {
        u.flags.collapse--;
        this.push({ t: 'status', u, text: 'Без сил', debuff: true });
        if (u.flags.collapse <= 0) this.wake(u);
        return 'skip';
      }
      if (u.side === 'enemy' && u.flags.bound > 0) {
        u.flags.bound = 0;
        u.flags.bindImm = 1;
        this.push({ t: 'status', u, text: 'Связан: пропуск хода', col: '#d8c890', debuff: true });
        return 'skip';
      }
      if (u.frozen) {
        u.frozen = 0;
        if (u.frozenDmg && u.frozenSrc) this.hit(u.frozenSrc, u, 0, { fixed: u.frozenDmg, e: 'ice', isDot: true, label: 'Разморозка' });
        if (this.su && alive(u)) this.suThaw(u);
        this.push({ t: 'status', u, text: 'Пропуск хода (лёд)' });
        if (!alive(u)) { this.cleanup(); return 'dead'; }
        return 'skip';
      }
      if (u.stun) { u.stun = 0; this.push({ t: 'status', u, text: 'Пропуск хода' }); return 'skip'; }
      return 'act';
    }

    endTurn(u) {
      if (!u) return;
      if (this.memo) this.memo('endTurn', { u });
      if (this.su && u.side === 'ally' && alive(u)) this.bless('turnEnd', { u });
      for (const b of u.buffs) { if (b.skip) { b.skip = 0; continue; } b.turns--; }
      this.foursEnd(u);
      u.buffs = u.buffs.filter(b => b.turns > 0);
      if (u.taunt > 0) u.taunt--;
      if (u.flags.cover > 0 && --u.flags.cover <= 0) {
        this.push({ t: 'status', u, text: 'Прикрытие кончилось' });
        const ad = coneFx(u, 'adamant');
        if (ad && alive(u)) for (const a of this.livingAllies) this.giveShield(a, defOf(u) * 0.16 * ad + 20 * H.grow(u.lvl), 2);
      }
      if (u.side === 'enemy') u.flags.provoke = null;
      if (u.side === 'enemy' && u.implant && --u.implant.turns <= 0) this.removeImplant(u);
      if (u.shieldT > 0) { u.shieldT--; if (u.shieldT <= 0) u.shield = 0; }
      u.av = AV / spdOf(u);
    }

    step() {
      let guard = 0;
      while (!this.over && guard++ < 500) {
        if (this.extra) {
          const u = this.extra;
          this.extra = null;
          if (alive(u)) {
            u.flags.inExtra = true;
            this.current = u;
            this.phase = 'input';
            this.push({ t: 'turn', u, extra: true });
            return;
          }
        }
        const units = [...this.livingAllies, ...this.living, ...this.livingSummons];
        if (!units.length) { this.checkEnd(); return; }
        let best = units[0];
        for (const u of units) if (u.av < best.av - 1e-9) best = u;
        const d = best.av;
        for (const u of units) u.av = Math.max(0, u.av - d);
        this.round++;
        if (this.memo) { this.memo('tick', { d }); if (this.over) return; }
        this.push(this.orderSnap(best));
        if (this.su) this.suTick();
        if (best.summon) {
          this.summonTurn(best);
          this.cleanup();
          continue;
        }
        if (best.side === 'enemy') {
          this.enemyTurn(best);
          this.cleanup();
          continue;
        }
        const r = this.startTurn(best);
        if (r === 'skip') { this.endTurn(best); this.cleanup(); continue; }
        if (r === 'dead') continue;
        if (this.su) {
          if (best.flags.cbPending) { this.addCritBoost(best, best.flags.cbPending, 12); best.flags.cbPending = 0; }
          this.bless('turn', { u: best });
        }
        this.current = best;
        this.phase = 'input';
        this.push({ t: 'turn', u: best });
        return;
      }
    }

    enemyTurn(u) {
      const r = this.startTurn(u);
      if (r === 'dead' || r === 'bloom') return;
      if (r === 'skip') { this.endTurn(u); return; }
      const d = u.data;
      if (d.flee && u.turnsTaken >= d.flee) {
        u.gone = true;
        this.push({ t: 'flee', u, text: u.name + ' ускакал в варп!' });
        return;
      }
      if (d.lifespan && u.turnsTaken >= d.lifespan) {
        for (const o of this.living) { o.gone = true; if (o !== u) this.push({ t: 'flee', u: o, text: '' }); }
        this.push({ t: 'flee', u, text: d.lifeText || u.name + ' рассыпается.' });
        this.cleanup();
        return;
      }
      u.turnsTaken++;
      let sk;
      const charged = u.charging != null;
      if (charged) { sk = d.skills[u.charging]; u.charging = null; u.planned = null; }
      else if (u.planned) { sk = u.planned; u.planned = null; }
      else sk = this.pickSkill(u);
      if (sk.t === 'summon' && this.living.length >= (sk.max || 3) + 1) sk = d.skills[0];
      this.riseWarn(u, sk, charged);
      this.acting = u;
      this.hitThisAction = new Set();
      this.push({ t: 'act', u, name: sk.n, kind: 'enemy' });
      const shieldedBefore = new Set(this.livingAllies.filter(a => a.shield > 0));
      const hitAllies = [];
      const hitOne = (tgt, m) => { if (!alive(tgt)) return; this.hit(u, tgt, m, { e: sk.e || 'phys' }); hitAllies.push(tgt); };
      switch (sk.t) {
        case 'single': {
          const t = this.pickTarget(u);
          hitOne(t, sk.m);
          if (sk.splash) for (const a of this.adjacent(this.livingAllies, t)) hitOne(a, sk.m * sk.splash);
          break;
        }
        case 'blast': {
          const t = this.pickTarget(u);
          const adj = this.adjacent(this.livingAllies, t);
          hitOne(t, sk.m);
          for (const a of adj) hitOne(a, sk.m * 0.6);
          break;
        }
        case 'all': {
          const lock = u.lockTarget;
          for (const a of this.livingAllies) hitOne(a, sk.m * (lock === a && sk.lockBonus ? sk.lockBonus : 1));
          break;
        }
        case 'summon': {
          const room = (sk.max || 3) + 1 - this.living.length;
          const ids = sk.summon.slice(0, Math.max(0, room));
          for (const id of ids) {
            const e = makeEnemy(id, Math.max(1, u.lvl - 2), this.enemies.length, 1, this.opts.foeAtk);
            e.av = AV / spdOf(e);
            e.appear = false;
            if (this.su) this.suFoe(e);
            this.enemies.push(e);
            this.push(this.orderSnap(u));
            this.push({ t: 'summon', u: e });
          }
          break;
        }
        case 'charge': u.charging = sk.next; this.push({ t: 'text', text: sk.text || (u.name + ' готовит мощную атаку!'), warn: true }); break;
        case 'lock': {
          const t = this.pickTarget(u);
          u.lockTarget = t; u.charging = sk.next;
          this.push({ t: 'lock', u, target: t, text: (sk.text || 'Цель захвачена!') + ' Цель: ' + (t ? t.name : '') });
          break;
        }
        case 'rally':
          for (const e of this.living) { this.addBuff(e, { s: 'atkP', v: 0.2, turns: 2, name: 'Приказ' }); if (e !== u) this.advance(e, 0.2); }
          break;
        case 'self': break;
      }
      if (sk.t !== 'lock' && sk.t !== 'charge' && u.charging == null) u.lockTarget = null;
      for (const f of sk.fx || []) {
        if (f.k === 'shieldSelf') { u.shield = Math.round(u.maxHp * f.m); u.shieldT = 3; this.push({ t: 'shield', u, v: u.shield }); continue; }
        const targets = sk.t === 'self' ? [u] : hitAllies;
        for (const t of new Set(targets)) {
          if (!alive(t)) continue;
          if (f.k === 'freeze') this.tryFreeze(u, t, f.chance);
          else if (f.k === 'dot') { if (this.rng.chance(this.effectChance(u, t, f.chance))) this.addDot(u, t, f.type, atkOf(u) * f.m, f.turns); }
          else if (f.k === 'debuff') { if (this.rng.chance(this.effectChance(u, t, f.chance))) this.addBuff(t, { s: f.s, v: f.v, turns: f.turns, name: f.name, debuff: true }); }
        }
      }
      if (sk.self === 'die' && alive(u)) { u.dead = true; u.rewarded = true; this.grantEnemyReward(u, 1); this.push({ t: 'kill', u }); }
      this.acting = null;
      const march = this.allies.find(a => a.charId === 'march' && alive(a));
      if (march && alive(u)) {
        for (const a of new Set(hitAllies)) {
          if (!shieldedBefore.has(a) || !alive(u) || !(march.flags.counters > 0) || this.over) continue;
          march.flags.counters--;
          this.acting = march;
          this.push({ t: 'act', u: march, name: 'Контратака', kind: 'follow' });
          this.hit(march, u, 0.5, { tough: 10, e: 'ice', kind: 'follow' });
          this.gainEnergy(march, 5);
          if (this.su) this.bless('follow', { u: march, hits: [u] });
          this.acting = null;
          this.cleanup();
        }
      }
      const clara = this.allies.find(a => a.charId === 'clara' && alive(a));
      if (clara && alive(u) && !this.over && hitAllies.length) {
        const strong = clara.flags.promise > 0;
        if (strong || hitAllies.includes(clara)) this.svarogCounter(clara, u, strong);
      }
      this.resolveShuhu();
      this.endTurn(u);
      if (this.analyzed(u)) this.planNext(u);
    }

    pickSkill(u) {
      const d = u.data;
      if (d.pat) {
        const sk = d.skills[d.pat[u.patIdx % d.pat.length]];
        u.patIdx++;
        return sk;
      }
      const opts = d.skills.filter(s => s.w > 0 && !(s.t === 'summon' && this.living.length >= (s.max || 3) + 1));
      let tot = opts.reduce((a, s) => a + s.w, 0), r2 = this.rng() * tot;
      let sk = opts[opts.length - 1];
      for (const s of opts) { r2 -= s.w; if (r2 <= 0) { sk = s; break; } }
      return sk;
    }

    resReady() { return false; }

    resolveTargets(actor, ab, target) {
      const foes = actor.side === 'ally' ? this.living : this.livingAllies;
      const friends = actor.side === 'ally' ? this.livingAllies : this.living;
      switch (ab.target) {
        case 'single': case 'bounce': return { main: target && alive(target) ? target : foes[0], adj: [] };
        case 'blast': { const m = target && alive(target) ? target : foes[0]; return { main: m, adj: this.adjacent(foes, m) }; }
        case 'all': return { main: null, adj: [], all: foes };
        case 'ally':
          if (ab.revive && target && target.side === 'ally' && target.dead && !target.gone && !target.summon) return { ally: target, revive: true };
          return { ally: target && alive(target) ? target : actor };
        case 'allies': return { allies: friends };
        case 'self': return { ally: actor };
      }
      return {};
    }

    useAbility(actor, ab, target, kind) {
      this.acting = actor;
      this.hitThisAction = new Set();
      this.crossed = new Set();
      this.killEnergy = 0;
      this.actSerial = (this.actSerial || 0) + 1;
      this.actKind = kind;
      const R = this.resolveTargets(actor, ab, target);
      this.push({ t: 'act', u: actor, name: R.revive ? 'Воскрешение' : ab.name, kind, lv: ab.lv });
      const hitSet = new Set();
      const toughOf = main => this.toughFor(kind, main);
      if (R.revive) {
        const a = R.ally;
        a.dead = false; a.hp = Math.max(1, Math.round(a.maxHp * T.reviveHp)); a.energy = 0; a.dots = []; a.frozen = 0; a.shield = 0; a.shieldT = 0; a.taunt = 0; a.stun = 0;
        a.flags.collapse = 0;
        a.buffs = a.buffs.filter(b => b.turns >= 999 && !b.debuff);
        a.av = AV / spdOf(a);
        this.push({ t: 'revive', u: a, hp: a.hp, text: 'Воскрешение!' });
        this.push(this.orderSnap(this.current));
        this.actKind = null;
        this.cleanup();
        this.afterAction(actor, kind, hitSet);
        this.acting = null;
        this.followUps();
        return;
      }
      const aqua = actor.charId === 'aqua' && (kind === 'basic' || kind === 'skill');
      this.tearsNow = aqua ? actor.flags.tears || 0 : 0;
      this.failNow = aqua && this.rng() < T.aquaFail;
      if (this.failNow) this.push({ t: 'fail', u: actor });
      for (const f of ab.fx) {
        const src = f.statOf ? (this.allies.find(a => a.charId === f.statOf && alive(a)) || actor) : actor;
        switch (f.k) {
          case 'dmg': {
            const o = { kind, e: f.e, plusDef: f.plusDef, alwaysCrit: f.alwaysCrit, charged: f.charged, anyTough: f.anyTough, hpM: f.hpM, tallyM: f.tallyM, extraBonus: f.ecst ? T.ecstasyDmg * (actor.flags.ecstasy || 0) : 0 };
            const chantT = f.chant ? T.chantTough * (actor.flags.chant || 0) : 0;
            if (R.all) {
              for (const t of R.all) {
                if (!alive(t)) continue;
                let extra = o.extraBonus;
                if (f.vsHalf && t.hp >= t.maxHp * 0.5) extra += f.vsHalf;
                this.hit(src, t, this.axelMult(actor, f, t, f.m), Object.assign({}, o, { tough: (f.tough || (kind === 'ult' || kind === 'fusion' ? 20 : 10)) + chantT, extraBonus: extra }));
                hitSet.add(t);
              }
            } else if (ab.target === 'bounce') {
              const hits = f.hits || 1;
              for (let i = 0; i < hits; i++) {
                const pool = this.living;
                if (!pool.length) break;
                const t = i === 0 && alive(R.main) ? R.main : this.rng.pick(pool);
                this.hit(src, t, f.m, Object.assign({}, o, { tough: f.tough || (kind === 'skill' ? 5 : 10) }));
                hitSet.add(t);
              }
            } else if (R.main) {
              const t = R.main;
              let m = this.axelMult(actor, f, t, f.m);
              if (f.vsSlow && t.buffs.some(b => b.s === 'spdP' && b.v < 0)) m += f.vsSlow;
              const critBefore = this.ev.length;
              this.hit(src, t, m, Object.assign({}, o, { tough: (f.tough || toughOf(true)) + chantT }));
              hitSet.add(t);
              const hitEv = this.ev.slice(critBefore).find(x => x.t === 'dmg' && x.u === t);
              if (hitEv && hitEv.crit) this.lastCrit = true; else this.lastCrit = false;
              if (f.adj != null) for (const a of R.adj) { this.hit(src, a, this.axelMult(actor, f, a, f.adj), Object.assign({}, o, { tough: f.adjTough || toughOf(false), plusDef: f.adjDef || 0, hpM: f.adjHp || 0, tallyM: f.adjTally || 0 })); hitSet.add(a); }
            }
            break;
          }
          case 'heal': {
            const list = f.who === 'allies' ? this.livingAllies : f.who === 'self' ? [actor] : f.who && f.who.startsWith('member:') ? this.allies.filter(a => a.charId === f.who.slice(7) && alive(a)) : [R.ally || actor];
            const amt = (src.maxHp * f.m + f.flat * H.grow(src.lvl)) * (this.failNow && !coneFx(src, 'hagoromo') ? T.failMult : 1) * (1 + T.tearsHeal * this.tearsNow);
            for (const a of list) this.heal(src, a, amt);
            for (let i = 1; i <= (f.bounce || 0); i++) {
              const pool = this.livingAllies;
              if (!pool.length) break;
              this.heal(src, pool.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a)), amt * (1 - f.decay * i));
            }
            break;
          }
          case 'hot': {
            const a = R.ally || actor;
            if (alive(a)) this.addBuff(a, { s: 'hotMark', v: 0, turns: f.turns, name: 'Регенерация', hot: Math.round((src.maxHp * f.m + f.flat * H.grow(src.lvl)) * (1 + sv(src, 'healP'))), src });
            break;
          }
          case 'shield': {
            const list = f.who === 'allies' ? this.livingAllies : [R.ally || actor];
            for (const a of list) this.giveShield(a, defOf(src) * f.m + f.flat * H.grow(src.lvl), f.turns);
            break;
          }
          case 'taunt': {
            const a = f.who === 'self' ? actor : (R.ally || actor);
            if (f.ifHp && a.hp < a.maxHp * f.ifHp) break;
            a.taunt = f.turns + 1;
            this.push({ t: 'status', u: a, text: 'Провокация' });
            break;
          }
          case 'buff': {
            const list = f.who === 'allies' ? this.livingAllies : f.who === 'self' ? [actor] : [R.ally || actor];
            for (const a of list) this.addBuff(a, { s: f.s, v: f.v, turns: f.turns, name: f.name }, f.quiet);
            break;
          }
          case 'bloom':
            for (const t of this.living) this.addBuff(t, { s: 'bloom', v: 0, turns: 99, name: 'Цветение', debuff: true, src });
            break;
          case 'debuff': {
            const list = f.who === 'all' ? this.living : [...hitSet].filter(t => t.side === 'enemy');
            if (f.onCrit && !this.lastCrit) break;
            for (const t of list) if (alive(t)) { if (this.rng.chance(this.effectChance(src, t, f.chance))) this.addBuff(t, { s: f.s, v: f.v, turns: f.turns, name: f.name, debuff: true }); else this.resisted(src); }
            break;
          }
          case 'dot': {
            const list = [...hitSet].filter(t => t.side === 'enemy');
            for (const t of list) if (alive(t)) { if (this.rng.chance(this.effectChance(src, t, f.chance))) this.addDot(src, t, f.type, atkOf(src) * f.m, f.turns); else this.resisted(src); }
            break;
          }
          case 'freeze': for (const t of [...hitSet]) if (alive(t)) this.tryFreeze(src, t, f.chance); break;
          case 'imprison':
            for (const t of [...hitSet]) {
              if (!alive(t)) continue;
              if (!this.rng.chance(this.effectChance(src, t, f.chance))) { this.resisted(src); continue; }
              this.delay(t, 0.4);
              this.addBuff(t, { s: 'spdP', v: -0.1, turns: 2, name: 'Замедление', debuff: true });
            }
            break;
          case 'delay': for (const t of (R.all || [...hitSet])) this.delay(t, f.v); break;
          case 'advance': {
            let list = [];
            if (f.who === 'self') list = [actor];
            else if (f.who === 'allies') list = this.livingAllies.filter(a => a !== actor);
            else if (f.who && f.who.startsWith('member:')) list = this.allies.filter(a => a.charId === f.who.slice(7) && alive(a));
            else list = [R.ally || actor];
            for (const a of list) {
              if (f.v >= 1 && a !== actor) { a.av = 0; this.push({ t: 'status', u: a, text: 'Действует сейчас' }); }
              else if (a === actor && f.who === 'self') a.flags.advanceAfter = (a.flags.advanceAfter || 0) + f.v;
              else this.advance(a, f.v);
            }
            break;
          }
          case 'energy': for (const a of this.livingAllies) this.gainEnergy(a, f.v); break;
          case 'cleanse': {
            const a = R.ally || actor;
            const i = a.buffs.findIndex(b => b.debuff);
            if (i >= 0) { a.buffs.splice(i, 1); this.push({ t: 'status', u: a, text: 'Очищение' }); }
            else if (a.dots.length) { a.dots.shift(); this.push({ t: 'status', u: a, text: 'Очищение' }); }
            if (a.frozen) a.frozen = 0;
            break;
          }
          case 'dispel': {
            const t = R.main;
            if (t && alive(t)) {
              const i = t.buffs.findIndex(b => !b.debuff && !b.perm);
              if (i >= 0) { t.buffs.splice(i, 1); this.push({ t: 'status', u: t, text: 'Усиление снято' }); }
              if (t.shield > 0) { t.shield = 0; this.push({ t: 'status', u: t, text: 'Щит снят' }); }
            }
            break;
          }
          case 'selfCost': {
            const cost = Math.round(actor.maxHp * f.hpP);
            actor.hp = Math.max(1, actor.hp - cost);
            this.push({ t: 'dmg', u: actor, src: actor, v: cost, e: 'elec', hp: actor.hp, shield: actor.shield, label: 'Цена' });
            break;
          }
          case 'extendDots':
            for (const t of this.living) for (const d of t.dots) if (d.type === f.type) d.turns += f.turns;
            break;
          case 'killEnergy': this.killEnergy = f.v; for (const t of hitSet) if (t.dead && t.rewarded) this.gainEnergy(actor, f.v); break;
          case 'magma': actor.flags.magma = Math.min(8, (actor.flags.magma || 0) + f.v); break;
          case 'hookEnhance': actor.flags.enhanced = true; break;
          case 'invig': this.invigorate(f.turns); break;
          case 'sync': this.gainSync(actor); break;
          case 'yanqingUlt':
            this.addBuff(actor, { s: 'critR', v: 0.6, turns: 1, name: 'Блаженный дождь' });
            if (actor.flags.sync) this.addBuff(actor, { s: 'critD', v: 0.5, turns: 1, name: 'Блаженный дождь: крит. урон' }, true);
            break;
          case 'svarogMarked':
            for (const t of this.living.filter(x => x.buffs.some(b => b.s === 'svMark'))) {
              t.buffs = t.buffs.filter(b => b.s !== 'svMark');
              this.hit(src, t, f.m, { kind, tough: 10, label: 'Сварог' });
              hitSet.add(t);
            }
            break;
          case 'svMark': for (const t of hitSet) this.svMark(t); break;
          case 'promise': actor.flags.promise = f.v; this.push({ t: 'status', u: actor, text: 'Сварог наготове' }); break;
          case 'frost': this.gainFrost(f.who && f.who.startsWith('member:') ? this.allies.find(a => a.charId === f.who.slice(7)) : actor, f.v); break;
          case 'polarity': for (const t of [...hitSet]) this.polarity(src, t, f.m); break;
          case 'stance': this.switchStance(actor); break;
          case 'shinra': actor.flags.shinra = f.v; this.push({ t: 'status', u: actor, text: 'Синрабансё' }); break;
          case 'eclipse':
            for (const a of this.livingAllies) this.addBuff(a, { s: 'chaosP', v: 0.4, turns: 2, name: 'Лунное затмение' }, a !== actor);
            break;
          case 'chaosAll':
            for (const t of this.living) { const old = this.anomalies(t).filter(a => a.kind !== 'freeze'); if (old.length && this.chaosOn()) this.chaosBurst(src, t, old); }
            break;
          case 'resurge': actor.flags.resurgeBuff = true; this.addBuff(actor, { s: 'dmgP', v: 0.8, turns: 1, name: 'Усиление' }); this.addBuff(actor, { s: 'resPen', v: 0.2, turns: 1, name: 'Усиление: кванты' }); break;
          case 'note': this.writeNote(actor, f.v); break;
          case 'reinc': if (!actor.flags.maestro) actor.flags.reinc = true; break;
          case 'cue':
            for (const h of this.livingSummons) if (h.owner === actor) { h.av = 0; this.push({ t: 'status', u: actor, text: 'Геката, вступай!', col: '#ff8aa0' }); }
            break;
          case 'maestro': this.maestro(actor); break;
          case 'notesAll': {
            const ph = this.allies.find(a => a.kit.notes && alive(a));
            if (!ph) break;
            const notes = (ph.flags.notes || []).slice();
            ph.flags.notes = [];
            this.push({ t: 'notes', u: ph, notes: [] });
            for (const n of notes) { if (!this.living.length) break; this.playNote(ph, n, null, true); }
            break;
          }
          case 'ember':
            for (const t of hitSet) if (alive(t) && t.elys && t.elys.by === actor) { t.elys.embers = Math.min(T.embersMax, t.elys.embers + f.v); this.push({ t: 'elys', u: t, elys: this.elysSnap(t) }); }
            break;
          case 'elysium': for (const t of [...hitSet]) if (t.side === 'enemy') this.sealElysium(actor, t, f.seals); break;
          case 'elysiumAll': {
            const sc = this.allies.find(a => a.charId === 'scar' && alive(a));
            if (!sc) break;
            for (const t of this.living) {
              if (!t.elys || t.elys.by !== sc) t.elys = { by: sc, need: 2, broke: [], embers: 0, rounds: T.elysRounds };
              t.elys.embers = T.embersMax;
              t.elys.broke = ['fusion:1', 'fusion:2'];
              this.push({ t: 'seal', u: t, left: 0, elys: this.elysSnap(t) });
              if (!this.elysPending.includes(t)) this.elysPending.push(t);
            }
            break;
          }
          case 'nightmare':
            actor.flags.nightmare = T.nightmareTurns;
            actor.elem = 'quant';
            this.push({ t: 'form', u: actor, on: true });
            break;
          case 'steal': {
            const t = R.main;
            if (!t || !alive(t)) break;
            const i = t.buffs.findIndex(b => !b.debuff && !b.perm);
            if (i >= 0) {
              const b = t.buffs.splice(i, 1)[0];
              this.push({ t: 'status', u: t, text: 'Украдено: ' + b.name, debuff: true });
              this.addBuff(actor, { s: b.s, v: b.v, turns: 2, name: 'Краденое: ' + b.name });
              actor.flags.chunArm = !!coneFx(actor, 'chunchun');
            }
            if (t.shield > 0) { const v = t.shield; t.shield = 0; this.push({ t: 'status', u: t, text: 'Щит украден', debuff: true }); this.giveShield(actor, Math.min(v, actor.maxHp * 0.3), 2); actor.flags.chunArm = !!coneFx(actor, 'chunchun'); }
            this.loot(actor, t, false);
            break;
          }
          case 'bind': {
            const t = R.main;
            if (!t || !alive(t)) break;
            hitSet.add(t);
            if (t.flags.bindImm > 0 || t.flags.bound > 0) { this.push({ t: 'status', u: t, text: 'Верёвка соскальзывает', debuff: true }); break; }
            if (!this.rng.chance(this.effectChance(src, t, T.bindChance))) { this.push({ t: 'status', u: t, text: 'Вырвался!', debuff: true }); this.resisted(src); break; }
            if (bigFoe(t)) { this.delay(t, T.bindBigDelay); t.flags.bindImm = 1; this.push({ t: 'status', u: t, text: 'Связан: отброшен', col: '#d8c890', debuff: true }); }
            else { t.flags.bound = 1; this.push({ t: 'status', u: t, text: 'Связан', col: '#d8c890', debuff: true }); }
            actor.flags.chunArm = !!coneFx(actor, 'chunchun');
            break;
          }
          case 'drain': {
            const ally = R.ally || actor, foes = this.living;
            if (foes.length) {
              const t = foes.reduce((a, b) => (b.hp > a.hp ? b : a));
              const d = this.hit(src, t, f.m, { kind, tough: T.toughBasic, label: 'Касание' });
              hitSet.add(t);
              if (alive(actor) && d > 0) this.heal(actor, actor, d * T.drainHeal);
            }
            if (alive(ally)) {
              this.gainEnergy(ally, T.drainEnergy);
              this.push({ t: 'status', u: ally, text: 'Энергия +' + T.drainEnergy, col: '#ffe080' });
              if (ally.flags.collapse > 0) this.wake(ally);
            }
            break;
          }
          case 'heist': {
            const t = R.main;
            if (t && alive(t)) {
              t.buffs = t.buffs.filter(b => b.debuff || b.perm);
              if (t.shield > 0) t.shield = 0;
              const stop = t.charging != null || !!t.lockTarget;
              t.charging = null; t.lockTarget = null;
              this.push({ t: 'status', u: t, text: stop ? 'Оружие украдено: атака сорвана!' : 'Обобран до нитки', debuff: true });
              this.addBuff(t, { s: 'atkP', v: -T.heistAtk, turns: 2, name: 'Без оружия', debuff: true });
              this.loot(actor, t, true);
            }
            this.setLuck(actor, 0);
            break;
          }
          case 'purge': {
            const t = R.main;
            if (!t || !alive(t) || !unholy(t)) break;
            const i = t.buffs.findIndex(b => !b.debuff && !b.perm);
            if (i >= 0) t.buffs.splice(i, 1);
            if (t.shield > 0) t.shield = 0;
            this.push({ t: 'status', u: t, text: 'Очищение нечисти', col: '#bfe8ff', debuff: true });
            break;
          }
          case 'wet': for (const t of this.living) this.addBuff(t, { s: 'wet', v: 0, turns: 1, name: 'Мокрый', debuff: true }); break;
          case 'freezeWet':
            for (const t of this.living) if (t.buffs.some(b => b.s === 'wet')) this.wetFreeze(src, t);
            break;
          case 'chant': {
            const n = Math.min(T.chantMax, (actor.flags.chant || 0) + 1);
            actor.flags.chant = n;
            this.gainEnergy(actor, T.chantEnergy);
            this.push({ t: 'chant', u: actor, v: n, line: CHANT[n - 1] });
            break;
          }
          case 'collapse': this.collapse(actor, T.collapseTurns - (coneFx(actor, 'manastaff') ? 1 : 0)); break;
          case 'swing': {
            const t = R.main;
            if (!t || !alive(t)) break;
            if (this.immobile(t)) {
              this.hit(src, t, f.m, { kind, plusDef: f.def, tough: toughOf(true), extraBonus: T.ecstasyDmg * (actor.flags.ecstasy || 0) });
              hitSet.add(t);
            } else this.miss(actor, t);
            break;
          }
          case 'cover':
            actor.flags.cover = f.turns + (this.current === actor ? 1 : 0);
            this.push({ t: 'status', u: actor, text: 'Прикрытие', col: '#ffc8e0' });
            break;
          case 'ecstasy': this.gainEcstasy(actor, f.v); break;
          case 'ecstasySpend':
            actor.flags.ecstasy = 0;
            actor.buffs = actor.buffs.filter(b => b.name !== 'Восторг');
            this.push({ t: 'ecstasy', u: actor, v: 0, add: 0 });
            break;
          case 'luck': this.gainLuck(f.v); break;
          case 'onMe': {
            const dk = this.allies.find(a => a.charId === 'darkness' && alive(a));
            if (!dk) break;
            const cost = Math.min(Math.round(dk.maxHp * 0.1), dk.hp - 1);
            if (cost > 0) { dk.hp -= cost; this.push({ t: 'dmg', u: dk, src: actor, v: cost, e: 'fire', hp: dk.hp, shield: dk.shield, label: 'В эпицентре' }); }
            this.gainEcstasy(dk, T.ecstasyMax);
            dk.taunt = 2;
            this.push({ t: 'status', u: dk, text: 'Восторг! Провокация', col: '#ffb0d8' });
            break;
          }
          case 'tauntTo': {
            const a = this.allies.find(x => x.charId === f.v && alive(x));
            if (a) { a.taunt = f.turns + 1; this.push({ t: 'status', u: a, text: 'Провокация' }); }
            break;
          }
          case 'cleanseAll':
            for (const a of this.livingAllies) {
              const i = a.buffs.findIndex(b => b.debuff && !b.name.startsWith('Без сил'));
              if (i >= 0) a.buffs.splice(i, 1); else if (a.dots.length) a.dots.shift();
              if (a.frozen) a.frozen = 0;
            }
            break;
          case 'detonate': {
            const ratio = f.v === 'ult' ? T.kafkaDetUlt : T.kafkaDetSkill;
            const list = f.main ? [R.main] : [...hitSet].filter(t => t.side === 'enemy');
            for (const t of list) if (t && alive(t)) this.detonate(src, t, ratio);
            break;
          }
          case 'implant': if (R.main) this.implant(src, R.main, this.implantElem(actor, R.main)); break;
          case 'implantAll': for (const t of this.living) this.implant(src, t, f.e, true); break;
          case 'hpCost': this.consumeHp(src, f.v); break;
          case 'hellscape':
            src.buffs = src.buffs.filter(b => b.name !== 'Адский пейзаж');
            src.buffs.push({ s: 'dmgP', v: T.hellDmg, turns: T.hellTurns, name: 'Адский пейзаж' });
            this.push({ t: 'status', u: src, text: 'Адский пейзаж', col: '#ff6a5a' });
            break;
          case 'sentence': this.sentence(src); break;
          case 'tallyReset': src.flags.tally = 0; break;
          case 'shuhuFull': { const bl = this.allies.find(a => a.charId === 'blade' && alive(a)); if (bl) this.gainShuhu(bl, T.shuhuMax); break; }
          default: if (!this.foursFx(f, actor, src, R, hitSet, kind)) this.inabaFx(f, actor, src, R, hitSet);
        }
      }
      if (aqua) {
        if (this.failNow) {
          actor.flags.tears = Math.min(T.tearsMax, (actor.flags.tears || 0) + 1);
          this.push({ t: 'status', u: actor, text: 'Слёзы ' + actor.flags.tears, col: '#8ad0ff' });
          this.gainLuck(1);
        } else if (actor.flags.tears) actor.flags.tears = 0;
      }
      this.failNow = false;
      this.tearsNow = 0;
      this.actKind = null;
      for (const a of (R.ally ? [R.ally] : R.allies || [])) if (a.charId === 'danheng' && a !== actor && actor.side === 'ally') this.danhengTalent(a);
      this.cleanup();
      this.afterAction(actor, kind, hitSet);
      this.acting = null;
      this.followUps();
    }

    toughFor(kind, main) {
      if (kind === 'basic' || kind === 'enhanced') return main ? T.toughBasic : 5;
      if (kind === 'skill') return main ? T.toughSkill : T.toughBasic;
      if (kind === 'ult') return main ? T.toughUlt : T.toughSkill;
      return main ? 20 : 10;
    }

    preview(kind, target, who) {
      const actor = who || this.current;
      if (!actor || !alive(actor) || this.over) return null;
      const { ab, kind: k } = this.abilityFor(actor, kind);
      const R = this.resolveTargets(actor, ab, target);
      const rows = new Map(), hpNow = new Map(this.livingAllies.map(a => [a, a.hp]));
      let tallyPlus = 0;
      const out = { kind: k, ab, rows, bounce: 0 };
      const row = t => { if (!rows.has(t)) rows.set(t, { lo: 0, hi: 0, tough: 0, heal: 0, shield: 0, breakE: null, src: actor }); return rows.get(t); };
      const addHit = (src, t, m, o) => {
        if (!alive(t)) return;
        const r = row(t), e = o.e || src.elem;
        r.lo += this.dmgCalc(src, t, m, o, !!o.alwaysCrit);
        r.hi += this.dmgCalc(src, t, m, o, true);
        if (t.side === 'enemy' && o.tough && !t.broken && (t.weak.includes(e) || o.anyTough) && t.tough > 0) {
          r.tough += o.tough * (1 + sv(src, 'breakEff')) * (1 + sv(t, 'toughIn'));
          if (!r.breakE) { r.breakE = e; r.src = src; }
        }
      };
      const addHeal = (src, a, v) => {
        if (!alive(a)) return;
        let m = (1 + sv(src, 'healP')) * (src.charId === 'aqua' ? 1 + T.tearsHeal * (src.flags.tears || 0) : 1);
        if (src.charId === 'natasha' && hpNow.get(a) / a.maxHp <= 0.3) m += 0.5;
        const amt = Math.round(v * m);
        row(a).heal += amt;
        hpNow.set(a, Math.min(a.maxHp, hpNow.get(a) + amt));
      };
      if (R.revive) {
        out.revive = true;
        row(R.ally).heal = Math.max(1, Math.round(R.ally.maxHp * T.reviveHp));
        return out;
      }
      for (const f of ab.fx) {
        const src = f.statOf ? (this.allies.find(a => a.charId === f.statOf && alive(a)) || actor) : actor;
        const ecst = f.ecst ? T.ecstasyDmg * (actor.flags.ecstasy || 0) : 0, chantT = f.chant ? T.chantTough * (actor.flags.chant || 0) : 0;
        const o = { kind: k, e: f.e, plusDef: f.plusDef, alwaysCrit: f.alwaysCrit, charged: f.charged, anyTough: f.anyTough, hpM: f.hpM, tallyM: f.tallyM, tallyPlus, extraBonus: ecst };
        switch (f.k) {
          case 'dmg':
            if (R.all) {
              for (const t of R.all) addHit(src, t, this.axelMult(actor, f, t, f.m, true), Object.assign({}, o, { tough: (f.tough || (k === 'ult' || k === 'fusion' ? 20 : 10)) + chantT, extraBonus: ecst + (f.vsHalf && t.hp >= t.maxHp * 0.5 ? f.vsHalf : 0) }));
            } else if (ab.target === 'bounce') {
              if (R.main) addHit(src, R.main, f.m, Object.assign({}, o, { tough: f.tough || (k === 'skill' ? 5 : 10) }));
              out.bounce += Math.max(0, (f.hits || 1) - 1);
            } else if (R.main) {
              const t = R.main;
              const m = this.axelMult(actor, f, t, f.m, true) + (f.vsSlow && t.buffs.some(b => b.s === 'spdP' && b.v < 0) ? f.vsSlow : 0);
              addHit(src, t, m, Object.assign({}, o, { tough: (f.tough || this.toughFor(k, true)) + chantT }));
              if (f.adj != null) for (const a of R.adj) addHit(src, a, this.axelMult(actor, f, a, f.adj, true), Object.assign({}, o, { tough: f.adjTough || this.toughFor(k, false), plusDef: f.adjDef || 0, hpM: f.adjHp || 0, tallyM: f.adjTally || 0 }));
            }
            break;
          case 'hpCost': tallyPlus += Math.max(0, Math.min(Math.round(src.maxHp * f.v), src.hp - 1)); break;
          case 'sentence': tallyPlus += Math.max(0, src.hp - Math.round(src.maxHp * 0.5)); break;
          case 'swing': {
            const t = R.main;
            if (!t || !alive(t)) break;
            if (this.immobile(t)) addHit(src, t, f.m, { kind: k, plusDef: f.def, tough: this.toughFor(k, true), extraBonus: T.ecstasyDmg * (actor.flags.ecstasy || 0) });
            else row(t).miss = true;
            break;
          }
          case 'bind': {
            const t = R.main;
            if (!t || !alive(t)) break;
            row(t).bind = t.flags.bindImm > 0 || t.flags.bound > 0 ? 0 : this.effectChance(src, t, T.bindChance);
            break;
          }
          case 'drain': {
            const foes = this.living;
            if (foes.length) addHit(src, foes.reduce((a, b) => (b.hp > a.hp ? b : a)), f.m, { kind: k, tough: T.toughBasic });
            break;
          }
          case 'svarogMarked':
            for (const t of this.living.filter(x => x.buffs.some(b => b.s === 'svMark'))) addHit(src, t, f.m, { kind: k, tough: 10 });
            break;
          case 'heal': {
            const list = f.who === 'allies' ? this.livingAllies : f.who === 'self' ? [actor] : [R.ally || actor];
            const amt = src.maxHp * f.m + f.flat * H.grow(src.lvl);
            for (const a of list) addHeal(src, a, amt);
            for (let i = 1; i <= (f.bounce || 0); i++) {
              const pool = this.livingAllies;
              if (pool.length) addHeal(src, pool.reduce((a, b) => (hpNow.get(b) / b.maxHp < hpNow.get(a) / a.maxHp ? b : a)), amt * (1 - f.decay * i));
            }
            break;
          }
          case 'shield': {
            const list = f.who === 'allies' ? this.livingAllies : [R.ally || actor];
            for (const a of list) if (alive(a)) row(a).shield += Math.round((defOf(src) * f.m + f.flat * H.grow(src.lvl)) * (1 + sv(a, 'shieldP')));
            break;
          }
          default: this.foursPreview(f, src, actor, R, addHit, k);
        }
      }
      for (const [t, r] of rows) {
        const e = t.elys;
        if (t.side !== 'enemy' || !e || actor === e.by || e.broke.includes(actor.key) || e.broke.length >= e.need) continue;
        r.seal = true;
        if (e.broke.length + 1 >= e.need && alive(e.by)) {
          const m = T.elysBurst + T.emberMult * e.embers, o = { kind: 'follow', extraBonus: 0.3 * coneFx(e.by, 'lullaby') };
          r.burst = this.dmgCalc(e.by, t, m, o, false);
          r.lo += r.burst;
          r.hi += this.dmgCalc(e.by, t, m, o, true);
        }
      }
      for (const [t, r] of rows) {
        if (t.side !== 'enemy') continue;
        r.toughAfter = Math.max(0, t.tough - r.tough);
        r.breaks = !t.broken && r.tough > 0 && r.toughAfter <= 0;
        if (r.breaks) {
          const fixed = H.breakBase(r.src.lvl) * (1 + sv(r.src, 'breakE')) * H.ELEMENTS[r.breakE].coef * (0.5 + t.maxTough / 40);
          const bd = this.dmgCalc(r.src, t, 0, { fixed, e: r.breakE, isDot: true, broken: true }, false);
          r.lo += bd; r.hi += bd;
        }
        r.hpLo = Math.max(0, r.lo - t.shield);
        r.hpHi = Math.max(0, r.hi - t.shield);
        r.kill = r.hpLo >= t.hp;
        r.mayKill = r.hpHi >= t.hp;
      }
      return out;
    }

    afterAction(u, kind, hitSet) {
      if (u.side !== 'ally' || !alive(u)) return;
      if (this.memo) this.memo('after', { u, kind });
      const hits = [...hitSet].filter(t => t.side === 'enemy');
      const attacked = hits.length > 0;
      if (u.charId === 'danheng' && attacked && u.flags.wind) {
        u.flags.wind = false;
        u.buffs = u.buffs.filter(b => b.name !== 'Верхом на ветре');
      }
      if (u.charId === 'trail_p' && ['basic', 'skill', 'ult', 'enhanced'].includes(kind)) {
        for (const a of this.livingAllies) this.giveShield(a, defOf(u) * 0.06 + 20 * H.grow(u.lvl), 2);
      }
      for (const t of hits) {
        if (!alive(t) && u.charId !== 'asta') continue;
        if (u.charId === 'welt' && alive(t) && t.buffs.some(b => b.s === 'spdP' && b.v < 0)) this.hit(u, t, 0.6, { e: 'imag', label: 'Гравитация' });
        if (u.charId === 'serval' && alive(t) && t.dots.some(d => d.type === 'shock')) this.hit(u, t, 0.4, { e: 'elec', label: 'Рок-н-ролл' });
        if (u.charId === 'sampo' && alive(t) && this.rng.chance(this.effectChance(u, t, 0.65))) this.addDot(u, t, 'shear', atkOf(u) * 0.52, 3, 5);
        if (u.charId === 'hook' && alive(t) && t.dots.some(d => d.type === 'burn')) { this.hit(u, t, 0.5, { e: 'fire', label: 'Ха-ха!' }); this.heal(u, u, u.maxHp * 0.05); }
      }
      if (u.charId === 'pela' && hits.some(t => t.buffs.some(b => b.debuff) || t.dots.length)) this.gainEnergy(u, 11);
      if (u.charId === 'asta' && attacked && kind !== 'fusion') {
        let add = hits.length;
        add += hits.filter(t => t.weak.includes('fire')).length ? 1 : 0;
        u.flags.charge = Math.min(5, (u.flags.charge || 0) + add);
        this.astaAura(u);
      }
      const shrine = coneFx(u, 'shrine');
      if (shrine && (kind === 'skill' || kind === 'ult')) {
        u.flags.shrine = Math.min(2, (u.flags.shrine || 0) + 1);
        const cur = u.buffs.find(b => b.name === 'Храм вьюги');
        if (!cur) u.flags.shrine = 1;
        this.addBuff(u, { s: 'iceP', v: 0.18 * shrine * u.flags.shrine, turns: 2, name: 'Храм вьюги' }, true);
      }
      if (u.charId === 'yanqing' && u.flags.sync && attacked && kind !== 'fusion') {
        const t = hits.find(alive);
        if (t && this.rng.chance(0.5)) {
          this.push({ t: 'act', u, name: 'Ледяной клинок', kind: 'follow' });
          this.hit(u, t, 0.5, { e: 'ice', tough: 5, label: 'Клинок', kind: 'follow' });
          this.tryFreeze(u, t, 0.65);
          this.gainEnergy(u, 10);
          if (this.su) this.bless('follow', { u, hits: [t] });
        }
      }
      this.huntersAfter(u, kind, hits);
      this.axelAfter(u, hits);
      this.foursAfter(u, kind, hits);
      if (this.su && kind !== 'contact') this.bless('act', { u, kind, hits });
      if (u.flags.advanceAfter) { u.flags.pendingAdvance = (u.flags.pendingAdvance || 0) + u.flags.advanceAfter; u.flags.advanceAfter = 0; }
    }

    astaAura(u) {
      const v = 0.14 * (u.flags.charge || 0);
      for (const a of this.livingAllies) {
        a.buffs = a.buffs.filter(b => b.name !== 'Заряд Асты');
        if (v > 0) a.buffs.push({ s: 'atkP', v, turns: 999, name: 'Заряд Асты' });
      }
    }

    followUps() {
      let guard = 0;
      while (!this.over && guard++ < 6) {
        let did = false;
        const herta = this.allies.find(a => a.charId === 'herta' && alive(a));
        if (herta && this.crossed.size && this.living.length) {
          this.crossed = new Set();
          this.acting = herta;
          this.push({ t: 'act', u: herta, name: 'Кукла Герты', kind: 'follow' });
          const hits = this.living.slice();
          for (const e of hits) this.hit(herta, e, 0.25, { e: 'ice', tough: 5, kind: 'follow' });
          this.gainEnergy(herta, 5);
          if (this.su) this.bless('follow', { u: herta, hits });
          this.acting = null;
          this.cleanup();
          did = true;
        }
        const him = this.allies.find(a => a.charId === 'himeko' && alive(a));
        if (him && (him.flags.charges || 0) >= 3 && this.living.length) {
          him.flags.charges = 0;
          this.acting = him;
          this.push({ t: 'act', u: him, name: 'Победный порыв', kind: 'follow' });
          const hits = this.living.slice();
          for (const e of hits) this.hit(him, e, 1.4, { e: 'fire', tough: 10, kind: 'follow' });
          this.gainEnergy(him, 10);
          if (this.su) this.bless('follow', { u: him, hits });
          this.acting = null;
          this.cleanup();
          did = true;
        }
        if (this.resolveShuhu()) did = true;
        if (this.yosukeStrike()) did = true;
        if (this.foursFollow()) did = true;
        if (!did) break;
      }
    }

    cleanup() {
      if (this.over) return;
      if (this.elysPending.length) this.resolveElysium();
      if (this.over) return;
      if (!this.livingAllies.length) { this.finish(false); return; }
      if (!this.living.length) {
        if (this.wave < this.waves.length - 1) {
          this.wave++;
          this.spawnWave(false);
          return;
        }
        this.finish(true);
      }
    }

    checkEnd() { this.cleanup(); }

    finish(win) {
      this.foursClear();
      this.over = true;
      this.phase = 'over';
      this.current = null;
      if (win && this.opts.boss) this.reward.jade += H.BOSS_JADE[this.waves[this.waves.length - 1][0].split(':')[0]] || 0;
      if (win && this.boomExp) this.reward.exp = Math.round(this.reward.exp * (1 + this.boomExp));
      this.result = { win, fled: false, reward: this.reward, allies: this.allies.map(a => ({ charId: a.charId, key: a.key, hp: a.dead ? 0 : a.hp, energy: Math.round(a.energy), trial: a.trial })), fusions: [...this.fusionsUsed] };
      this.push({ t: win ? 'win' : 'lose' });
    }

    canAct() { return this.phase === 'input' && !!this.current && !this.over; }

    abilityFor(u, kind) {
      const four = this.foursAbility(u, kind);
      if (four) return four;
      if (kind === 'basic') {
        if (u.charId === 'trail_p' && (u.flags.magma || 0) >= 4) return { ab: u.kit.enhanced, kind: 'enhanced' };
        if (u.charId === 'darkness' && (u.flags.ecstasy || 0) >= T.ecstasyMax) return { ab: u.kit.enhanced, kind: 'enhanced' };
        if (u.kit.charged && u.flags.chargeSel > 0 && this.chargeLevels(u) >= u.flags.chargeSel) return { ab: u.kit.charged[u.flags.chargeSel - 1], kind: 'enhanced' };
        if (u.charId === 'yanagi' && u.flags.shinra > 0) return { ab: u.kit.enhanced, kind: 'enhanced' };
        if (u.kit.notes && u.flags.maestro) return { ab: u.kit.cue, kind: 'basic' };
        if (u.kit.notes && u.flags.reinc) return { ab: u.kit.enhanced, kind: 'enhanced' };
        if (u.kit.nbasic && u.flags.nightmare > 0) return { ab: u.kit.nbasic, kind: 'enhanced' };
        if (this.inHell(u)) return { ab: u.kit.enhanced, kind: 'enhanced' };
        return { ab: u.kit.basic, kind: 'basic' };
      }
      if (kind === 'skill') {
        if (u.kit.skills) return { ab: u.kit.skills[clamp(u.flags.skillSel | 0, 0, u.kit.skills.length - 1)], kind: 'skill' };
        if (u.charId === 'hook' && u.flags.enhanced) return { ab: u.kit.enhanced, kind: 'skill' };
        if (u.kit.nskill && u.flags.nightmare > 0) return { ab: u.kit.nskill, kind: 'skill' };
        return { ab: u.kit.skill, kind: 'skill' };
      }
      return { ab: u.kit.ult, kind: 'ult' };
    }

    skillCost(u, target) {
      if (u.kit.skill && u.kit.skill.revive && target && target.side === 'ally' && target.dead && !target.gone) return T.reviveSp;
      if (u.flags.freeSkill) return 0;
      return u.kit.skill && u.kit.skill.noSp ? 0 : 1;
    }

    act(kind, target) {
      if (!this.canAct()) return false;
      const u = this.current;
      const { ab, kind: k } = this.abilityFor(u, kind);
      if (kind === 'skill') {
        const cost = this.skillCost(u, target);
        if (this.sp < cost || this.skillLocked(u)) return false;
        if (ab.noSelf && target === u) target = this.livingAllies.find(a => a !== u) || u;
        this.sp -= cost;
        u.flags.freeSkill = false;
      } else this.sp = Math.min(T.spMax, this.sp + 1);
      if (u.kit.personas) u.flags.personaLock = true;
      if (k === 'enhanced' && u.charId === 'trail_p') u.flags.magma -= 4;
      if (k === 'enhanced' && ab.lv) { u.flags.frost -= 2 * ab.lv; this.push({ t: 'frost', u, v: u.flags.frost, add: -2 * ab.lv }); }
      if (k === 'enhanced' && u.charId === 'yanagi') u.flags.shinra--;
      if (k === 'enhanced' && u.kit.notes) u.flags.reinc = false;
      if (u.kit.charged) u.flags.chargeSel = 0;
      if (u.charId === 'hook' && kind === 'skill' && u.flags.enhanced) u.flags.enhanced = false;
      this.phase = 'run';
      this.useAbility(u, ab, target, k);
      const more = this.oneMore === u;
      this.oneMore = null;
      if (ab.keepTurn && !this.over && alive(u)) { this.actions++; this.current = u; this.phase = 'input'; this.push({ t: 'turn', u, keep: true }); return true; }
      this.gainEnergy(u, ab.energy || (kind === 'skill' ? T.energySkill : T.energyBasic));
      this.actions++;
      if (more && !this.over && alive(u) && this.living.length) {
        u.flags.oneMore = true;
        this.oneMoreN = (this.oneMoreN || 0) + 1;
        this.current = u;
        this.phase = 'input';
        this.push({ t: 'oneMore', u, aoa: this.living.every(e => e.broken) });
        this.push({ t: 'turn', u, keep: true, oneMore: true });
        return true;
      }
      this.finishAllyTurn(u);
      return true;
    }

    finishAllyTurn(u) {
      if (this.over) return;
      if (u.flags.nightmare > 0 && --u.flags.nightmare === 0 && alive(u)) this.endNightmare(u);
      const extra = u.flags.resurge && u.charId === 'seele' && !u.flags.inExtra;
      u.flags.resurge = false;
      const wasExtra = u.flags.inExtra;
      u.flags.inExtra = false;
      u.flags.oneMore = false;
      if (!wasExtra) this.endTurn(u);
      if (u.flags.pendingAdvance) { this.advance(u, u.flags.pendingAdvance); u.flags.pendingAdvance = 0; }
      this.current = null;
      if (extra && alive(u)) {
        this.addBuff(u, { s: 'dmgP', v: 0.8, turns: 1, name: 'Усиление' });
        u.buffs.forEach(b => { if (b.name === 'Усиление') b.skip = 1; });
        this.push({ t: 'text', text: 'Зеле: Возрождение! Дополнительный ход.' });
        this.extra = u;
      }
      this.cleanup();
      this.step();
    }

    ultReady(u) {
      if (u && u.kit && u.kit.notes) return alive(u) && !u.flags.maestro && (u.flags.notes || []).length >= T.notesMax && !u.frozen && !this.over;
      return alive(u) && u.energy >= u.maxEnergy && !u.frozen && !(u.flags.collapse > 0) && !this.over;
    }

    ult(u, target) {
      if (!this.canAct() || !this.ultReady(u)) return false;
      const { ab } = this.abilityFor(u, 'ult');
      u.energy = 0;
      this.useAbility(u, ab, target, 'ult');
      this.gainEnergy(u, T.energyUlt);
      if (!this.over) this.cadenzaNext();
      const mirror = coneFx(u, 'mirror');
      if (mirror && !this.over) for (const a of this.livingAllies) this.addBuff(a, { s: 'dmgP', v: 0.24 * mirror, turns: 3, name: 'Прошлое в зеркале' });
      if (u.flags.resurge && u.charId === 'seele' && alive(u) && !this.over) {
        u.flags.resurge = false;
        this.push({ t: 'text', text: 'Зеле: Возрождение! Дополнительный ход.' });
        this.extra = u;
      }
      if (u.flags.pendingAdvance && this.current !== u) { this.advance(u, u.flags.pendingAdvance); u.flags.pendingAdvance = 0; }
      if (!this.over && this.current && !alive(this.current)) { this.current = null; this.phase = 'run'; this.step(); }
      return true;
    }

    availableFusions() {
      const out = [];
      for (const [id, f] of Object.entries(H.FUSIONS)) {
        const ms = f.members.map(c => this.allies.find(a => a.charId === c));
        if (ms.every(Boolean)) out.push({ id, f, ready: ms.every(m => this.ultReady(m)), members: ms });
      }
      return out;
    }

    fusion(id, target) {
      if (!this.canAct()) return false;
      const fu = this.availableFusions().find(x => x.id === id);
      if (!fu || !fu.ready) return false;
      for (const m of fu.members) m.energy = 0;
      this.fusionsUsed.add(id);
      this.push({ t: 'fusion', id, name: fu.f.name, members: fu.members });
      this.useAbility(fu.members[0], fu.f, target, 'fusion');
      if (this.pendingAoa) {
        const lead = this.pendingAoa;
        this.pendingAoa = null;
        if (!this.over && this.living.length && this.living.every(e => e.broken)) { this.allOut(lead); this.cleanup(); this.followUps(); }
      }
      for (const m of fu.members) this.gainEnergy(m, T.energyUlt);
      if (!this.over) this.cadenzaNext();
      if (!this.over && this.current && !alive(this.current)) { this.current = null; this.phase = 'run'; this.step(); }
      return true;
    }

    contact(ci, target) {
      if (!this.canAct()) return false;
      const u = this.current;
      const action = u.kit.contact[ci];
      if (!action) return false;
      const t = target && alive(target) && target.side === 'enemy' ? target : this.living[0];
      this.phase = 'run';
      this.acting = u;
      this.push({ t: 'act', u, name: 'Контакт: ' + action.name, kind: 'contact' });
      const d = t.data;
      if (d.noContact || d.boss || this.opts.noContact) {
        this.push({ t: 'mood', u: t, mood: 'none', text: t.name + ' не слушает.' });
      } else {
        const prof = H.CONTACT[d.fam] || H.CONTACT.spawn;
        let mood = prof.react[action.tag] || 'none';
        if (mood !== 'none' && this.rng.chance(0.2)) mood = this.rng.pick(['eager', 'happy', 'angry', 'scared']);
        if (this.opts.rumorKind && mood === 'angry' && d.fam === 'shade') mood = 'happy';
        if (mood === 'none') this.push({ t: 'mood', u: t, mood, text: prof.lines.none });
        else {
          t.mood[mood] += (this.opts.rumorKind && mood === 'happy') ? 2 : 1;
          this.push({ t: 'mood', u: t, mood, level: t.mood[mood], text: t.name + ': ' + { eager: 'Интерес', happy: 'Радость', angry: 'Злость', scared: 'Страх' }[mood] + ' ' + t.mood[mood] + '/' + T.contactThreshold });
          if (t.mood[mood] >= T.contactThreshold) this.resolveContact(t, mood, prof);
        }
      }
      this.gainEnergy(u, T.energyKill);
      this.acting = null;
      this.cleanup();
      this.finishAllyTurn(u);
      return true;
    }

    resolveContact(t, mood, prof) {
      this.push({ t: 'mood', u: t, mood, text: prof.lines[mood], final: true });
      if (mood === 'angry') {
        t.mood.angry = 0;
        this.addBuff(t, { s: 'atkP', v: 0.3, turns: 3, name: 'Ярость' });
        this.advance(t, 0.5);
        return;
      }
      t.gone = true;
      this.push({ t: 'leave', u: t, mood });
      if (mood === 'scared') { this.grantEnemyReward(t, 0.3); return; }
      this.grantEnemyReward(t, 0.8);
      this.reward.contacts.push({ id: t.id, mood });
      if (mood === 'eager') this.reward.gifts.push(t.data.gift || 'medkit');
      else { this.reward.credits += 20 * t.lvl; this.reward.jade += 5; }
    }

    flee() {
      if (this.noFlee || this.over) return false;
      this.foursClear();
      this.over = true;
      this.phase = 'over';
      this.result = { win: false, fled: true, reward: { exp: 0, credits: 0, drops: [], gifts: [], jade: 0, contacts: [] }, allies: this.allies.map(a => ({ charId: a.charId, key: a.key, hp: a.dead ? 0 : a.hp, energy: Math.round(a.energy), trial: a.trial })), fusions: [] };
      this.push({ t: 'fled' });
      return true;
    }

    autoTarget(u) {
      const foes = this.living;
      if (!foes.length) return null;
      const sealed = foes.filter(e => e.elys && (e.elys.by === u || !e.elys.broke.includes(u.key)));
      if (sealed.length) return sealed.reduce((a, b) => (b.hp < a.hp ? b : a));
      if (u.charId === 'darkness') { const still = foes.filter(e => this.immobile(e)); if (still.length) return still.reduce((a, b) => (b.hp < a.hp ? b : a)); }
      if (u.charId === 'kanji' && u.flags.stitch) { const s = u.flags.stitch, pair = [s.a, s.b].filter(alive); if (pair.length) return pair.reduce((a, b) => (b.hp > a.hp ? b : a)); }
      const weak = foes.filter(e => e.weak.includes(u.elem) && !e.broken);
      const pool = weak.length ? weak : foes;
      return pool.reduce((a, b) => (b.hp < a.hp ? b : a));
    }

    autoStep() {
      if (!this.canAct()) return false;
      if (this.resReady()) { this.resonate(); if (!this.canAct()) return true; }
      for (const a of this.livingAllies) {
        if (!this.ultReady(a) || this.over) continue;
        const ab = a.kit.ult;
        if (ab.target === 'allies' && a.path === 'abundance' && !this.livingAllies.some(x => x.hp < x.maxHp * 0.6)) continue;
        if (this.foursHoldUlt(a)) continue;
        this.ult(a, ab.target === 'ally' ? this.foursUltAlly(a) : this.autoTarget(a));
        if (!this.canAct()) return true;
      }
      const u = this.current;
      if (!u) return false;
      if (this.aoaReady()) return this.allOut();
      const fa = this.foursAuto(u);
      if (fa != null) return fa;
      const low = this.livingAllies.reduce((a, b) => (b.hp / b.maxHp < a.hp / a.maxHp ? b : a));
      const sk = u.kit.skill;
      let useSkill = false, tgt = this.autoTarget(u);
      const fallen = u.kit.skill.revive ? this.allies.find(a => a.dead && !a.gone && !a.trial) : null;
      if (fallen && this.sp >= T.reviveSp) return this.act('skill', fallen);
      if (u.charId === 'kazuma') {
        const down = this.livingAllies.find(a => a.flags.collapse > 0);
        const rich = this.living.find(e => e.shield > 0 || e.buffs.some(b => !b.debuff && !b.perm));
        const dk = this.livingAllies.some(a => a.charId === 'darkness');
        let mode = -1, t2 = tgt;
        if (down) { mode = 2; t2 = down; }
        else if (rich) { mode = 0; t2 = rich; }
        else if (dk && tgt && !this.immobile(tgt) && !bigFoe(tgt) && !(tgt.flags.bindImm > 0)) mode = 1;
        if (mode >= 0 && this.sp >= (mode === 2 ? 1 : 2)) { this.setSkill(u, mode); return this.act('skill', t2); }
        return this.act('basic', tgt);
      }
      if (u.charId === 'megumin') {
        if ((u.flags.chant || 0) < T.chantMax && this.sp >= 1) return this.act('skill', u);
        return this.act('basic', tgt);
      }
      if (u.kit.personas) {
        this.autoPersona(u);
        const t = this.autoTarget(u);
        if (this.sp >= this.skillCost(u) && (this.sp >= 2 || u.flags.freeSkill || (t && t.weak.includes(u.elem) && !t.broken))) return this.act('skill', t);
        return this.act('basic', t);
      }
      if (u.charId === 'rise') {
        const fresh = this.living.filter(e => !this.analyzed(e)).sort((a, b) => (b.data.boss ? 1 : 0) - (a.data.boss ? 1 : 0) || b.hp - a.hp)[0];
        if (fresh && this.sp >= 1 && (this.sp >= 2 || fresh.data.boss || fresh.data.elite)) return this.act('skill', fresh);
        return this.act('basic', tgt);
      }
      if (u.charId === 'kanji') {
        if (!u.flags.stitch && this.living.length >= 2 && this.sp >= 1) { const t = this.living.reduce((a, b) => (b.hp > a.hp ? b : a)); return this.act('skill', t); }
        const s = u.flags.stitch, t = s && alive(s.a) ? s.a : s && alive(s.b) ? s.b : tgt;
        if (this.sp >= 3) return this.act('skill', t);
        return this.act('basic', t);
      }
      if ((sk.target === 'ally' || sk.target === 'self') && !sk.keepTurn) {
        if (u.path === 'abundance') { useSkill = low.hp < low.maxHp * 0.6 && this.sp >= 1; tgt = low; }
        else if (u.path === 'preservation') { useSkill = this.sp >= 2 && !this.livingAllies.some(a => a.shield > 0 || a.taunt > 0); tgt = low; }
        else { useSkill = this.sp >= 2; tgt = this.livingAllies.filter(a => a !== u).sort((a, b) => atkOf(b) - atkOf(a))[0] || u; }
      } else if (u.charId === 'arlan') useSkill = u.hp > u.maxHp * 0.3;
      else if (u.charId === 'miyabi') {
        const lv = this.chargeLevels(u), t = tgt;
        if (lv >= 3 || (lv >= 1 && t && t.buffs.some(b => b.name === 'Ледяной ожог'))) { this.setCharge(u, lv); return this.act('basic', t); }
        useSkill = this.sp >= 1;
      } else if (u.charId === 'yanagi') useSkill = this.sp >= 2 || (this.sp >= 1 && this.living.some(e => this.anomalies(e).length));
      else if (u.charId === 'ruanmei') useSkill = this.sp >= 1 && !u.buffs.some(b => b.name === 'Обертон' && b.turns > 1);
      else if (u.kit.notes) useSkill = !u.flags.maestro && !u.flags.reinc && this.sp >= 2;
      else if (u.charId === 'scar') useSkill = this.sp >= 1 && !this.living.some(e => e.elys && e.elys.by === u);
      else if (u.charId === 'kafka') { const t = this.living.reduce((a, b) => (b.dots.length > a.dots.length ? b : a)); useSkill = this.sp >= 1 && (t.dots.length > 0 || this.sp >= 3); tgt = t; }
      else if (u.charId === 'silverwolf') { const t = this.living.filter(e => !e.implant).sort((a, b) => b.hp - a.hp)[0]; useSkill = this.sp >= 1 && !!t; if (t) tgt = t; }
      else if (u.charId === 'blade') useSkill = !this.inHell(u) && this.sp >= 1 && u.hp > u.maxHp * 0.45;
      else useSkill = this.sp >= (u.path === 'hunt' || u.path === 'erudition' || u.path === 'destruction' ? 1 : 2);
      if (useSkill && this.sp >= this.skillCost(u)) return this.act('skill', tgt);
      return this.act('basic', this.autoTarget(u));
    }

    runAuto(maxActions = 400) {
      let n = 0;
      while (!this.over && n++ < maxActions) { if (!this.autoStep()) break; }
      this.drain();
      return this.result;
    }
  }

  Object.assign(H, { Battle, battleStat: { sv, atkOf, defOf, spdOf, alive, tallyOf }, DOT_NAME, DOT_ELEM, DOT_TYPES });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
