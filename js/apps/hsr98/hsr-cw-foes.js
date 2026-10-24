(function (H) {
  'use strict';
  const CW = H.CW, T = H.TUNING, AV = T.avBase;
  const { alive, spdOf } = H.battleStat;
  const GP = H.Game.prototype, BP = H.Battle.prototype;
  const E = o => Object.assign({ hp: 1, atk: 1, spd: 95, tough: 20, weak: [], resist: [], exp: 1, credits: 1, drops: [] }, o);
  const EN = H.ENEMIES;

  const FOES = {
    cocolia_x: E({ name: 'Коколия (исправная)', fam: 'boss', shape: 'cocolia2', col: ['#0e1a44', '#f0f8ff'], boss: true, hp: 22, atk: 2.3, spd: 110, tough: 220, weak: ['fire', 'elec', 'quant'], resist: ['ice', 'phys', 'wind'], exp: 22, credits: 22, noContact: true,
      skills: EN.cocolia2.skills.concat([{ n: 'Гнев зимних святых', t: 'charge', next: 6, text: 'Коколия копит гнев зимних святых! Следом ударит Кара бесконечной зимы.' }, { n: 'Кара бесконечной зимы', t: 'all', m: 2.2, e: 'ice' }]),
      pat: [0, 3, 5, 1, 4, 0, 5, 3] }),
    svarog_hand: E({ name: 'Вспомогательный манипулятор', fam: 'automaton', shape: 'hand', col: ['#3a3048', '#ff4aa8'], hp: 2.4, atk: 1.2, spd: 105, tough: 40, weak: ['fire', 'ice', 'imag'], resist: ['phys'], exp: 1, credits: 1, noContact: true,
      skills: [{ n: 'Хватка манипулятора', w: 2, t: 'single', m: 1.3, e: 'phys' }, { n: 'Удержание', w: 1, t: 'single', m: 0.8, e: 'phys', fx: [{ k: 'delay', v: 0.25 }] }], pat: [0, 1] }),
    phantylia_x: E({ name: 'Фантилия Неумирающая (исправная)', fam: 'boss', shape: 'phantylia', col: ['#141024', '#ffd08a'], boss: true, hp: 16, atk: 2.2, spd: 124, tough: 200, weak: ['elec', 'wind', 'imag'], resist: ['phys', 'fire', 'ice', 'quant'], exp: 18, credits: 16, noContact: true,
      skills: EN.phantylia2.skills.concat([{ n: 'Буйное цветение', t: 'summon', summon: ['lotus_ab', 'lotus_de'], max: 3 }]),
      pat: [0, 4, 1, 0, 3, 1, 4] }),
    timekiller: E({ name: 'Убийца времени', fam: 'voidranger', shape: 'ranger3', col: ['#1a1030', '#c88aff'], hp: 1.3, atk: 1.1, spd: 130, tough: 30, weak: ['wind', 'imag'], resist: ['quant'], exp: 1, credits: 1, noContact: true,
      skills: [{ n: 'Разрыв секунды', w: 2, t: 'single', m: 1.1, e: 'quant' }, { n: 'Петля времени', w: 1, t: 'single', m: 0.8, e: 'imag', fx: [{ k: 'delay', v: 0.15 }] }], pat: [0, 1] }),
    trotter_big: E(Object.assign({}, EN.trotter, { name: 'Большая свинка-копилка', elite: true, col: ['#f0c838', '#fff4b0'] }))
  };
  for (const [id, e] of Object.entries(FOES)) e.id = id;
  Object.assign(H.ENEMIES, FOES);

  Object.assign(CW.OPPONENTS.everwinter, { phases: [['shadewalker', 'cocolia1', 'shadewalker'], ['cocolia2', 'bronya_b'], ['frostspawn', 'cocolia_x', 'frostspawn']], fx: [null, null, 'wrath'] });
  Object.assign(CW.OPPONENTS.deepsky, { fx: [null, 'bombard', 'hand'] });
  Object.assign(CW.OPPONENTS, {
    doomsday: {
      name: 'Утилизация «Судный день»', short: 'Судный день', boss: 'doomsday', music: 'doomsday', bg: ['station', 'station'],
      elite: ['trampler', 'iceout', 'blazeout', 'stormbringer'], normal: ['reaver', 'eliminator', 'distorter', 'antibaryon', 'baryon', 'weaver'],
      phases: [['reaver', 'doomsday', 'eliminator'], ['eliminator', 'doomsday', 'trampler'], ['reaver', 'doomsday', 'reaver']], fx: [null, 'antimatter', 'doom']
    },
    swarm: {
      name: 'Инкубатор «Рой»', short: 'Рой', boss: 'skaracabaz_e', music: 'boss', bg: ['station2', 'station2'],
      elite: ['searing', 'prowler'], normal: ['juvsting', 'gnawsting', 'weaver'],
      phases: [['juvsting', 'skaracabaz_e', 'gnawsting'], ['gnawsting', 'skaracabaz_e2', 'gnawsting'], ['skaracabaz']], fx: [null, null, 'gene']
    },
    deathless: {
      name: 'Лига «Бессмертные»', short: 'Бессмертные', boss: 'phantylia', music: 'boss', bg: ['sim', 'sim'],
      elite: ['decaying', 'guardian'], normal: ['flamespawn', 'frostspawn', 'thunderspawn', 'windspawn', 'mask'],
      phases: [['lotus_ab', 'phantylia', 'mask'], ['lotus_de', 'phantylia2', 'lotus_de'], ['lotus_ab', 'phantylia_x', 'lotus_de']], fx: [null, null, 'havoc']
    },
    axel: {
      name: 'Гильдия «Аксель»', short: 'Аксель', boss: 'ks_proto', music: 'boss', bg: ['meadow', 'meadow'],
      elite: ['ks_toad_gold', 'ks_gator_big'], normal: ['ks_toad', 'ks_toad_blue', 'ks_goblin', 'ks_goblin_shaman', 'ks_doll', 'ks_turret', 'ks_spider', 'ks_gator'],
      phases: [['ks_goblin', 'ks_proto', 'ks_goblin_shaman'], ['ks_turret', 'ks_proto', 'ks_turret'], ['ks_proto']], fx: ['barrier', 'legs', 'core']
    }
  });
  Object.assign(CW.PHASE_FX, {
    cascade: { name: 'Каскад льда Судного дня', text: 'При первом падении Коколии ниже 50% на шкале появляется каскад: через 2 её хода он бьёт всех героев.', m: 2.5, turns: 2 },
    bombard: { name: 'Перенасыщенная бомбардировка', text: 'Каждый третий ход Сварог бьёт всех 12 раз и снижает защиту на 20% на 3 хода, складывается.', every: 3, hits: 12, m: 0.18, def: 0.2 },
    hand: { name: 'Вспомогательный манипулятор', text: 'При первом падении Сварога ниже 50% он сразу ходит полной мощью и вызывает до 4 манипуляторов.', n: 4 },
    antimatter: { name: 'Сбор антиматерии', text: 'Каждые 3 хода Зверь копит антиматерию; первый заряд вызывает Подавителя.', every: 3 },
    doom: { name: 'Неизбежная гибель', text: 'Каждый третий ход Зверя «Неизбежная гибель», после каждого заряда подкрепление Легиона.', every: 3 },
    gene: { name: 'Генное копирование', text: 'Скаракабаз без срока жизни: +50% скорости и 4 жаложука. Гибель всех жаложуков пробивает босса и отодвигает его на 200%.', spd: 0.5, n: 4 },
    havoc: { name: 'Опустошение', text: 'Пока Фантилия держит цель, Лотосы Разрушения каждый её ход бьют всех героев.', m: 0.3 },
    barrier: { name: 'Барьер', text: 'Прототип получает 30% урона. Барьер снимают три пробития или удар Аквы.', k: 0.3, breaks: 3 },
    legs: { name: 'Ноги', text: 'Прототип на ногах: обычный бой.' },
    core: { name: 'Ядро', text: 'Каждое 3-е действие «Перегрев ядра». Навык Казумы «Кража» один раз уносит 25% НР ядра.', every: 3, steal: 0.25 }
  });
  CW.PHASE_FX.finale = { name: 'Миг финала', text: 'До конца отсчёта меньше 100: отряд наносит двойной урон до конца боя.' };
  const FX = CW.PHASE_FX;

  const waves0 = GP.cwWaves;
  GP.cwWaves = function (run, kind) {
    const w = waves0.call(this, run, kind);
    if (kind === 'reward') for (const wave of w) wave.forEach((s, i) => { if (String(s).split(':')[0] === 'trotter') wave[i] = 'trotter_big:' + String(s).split(':')[1]; });
    if (kind !== 'boss') {
      const O = this.cwOpp(run);
      for (const wave of w) wave.forEach((s, i) => { const id = String(s).split(':')[0]; if (!H.ENEMIES[id] && O) wave[i] = O.normal[0] + ':' + String(s).split(':')[1]; });
    }
    return w;
  };

  const fight0 = GP.cwFight;
  GP.cwFight = function (branch) {
    const b = fight0.call(this, branch);
    if (b && b.cw && b.cw.kind === 'reward') b.cw.big = b.cw.waves[0].findIndex(s => String(s).split(':')[0] === 'trotter_big');
    return b;
  };

  const resolve0 = GP.cwResolve;
  GP.cwResolve = function (run) {
    if (run.fight && run.fight.kills) run.fight.kills = run.fight.kills.map(id => (id === 'trotter_big' ? 'trotter' : id));
    return resolve0.call(this, run);
  };

  const fxOf = (b, w) => (b.cw && b.cw.phaseFx ? b.cw.phaseFx[w == null ? b.wave : w] : null);
  const bossOf = b => b.living.find(e => e.data.boss) || null;

  Object.assign(BP, {
    cwPhaseStart(list, w) {
      const fx = fxOf(this, w), boss = list.find(u => u.data.boss);
      if (!boss) return;
      if (boss.id === 'cocolia_x') boss.flags.cwCascadeOk = true;
      if (boss.data.proto) {
        const f = boss.flags;
        f.protoInit = true; f.barrier = fx === 'barrier'; f.legs = fx !== 'core'; f.coreT = FX.core.every; f.cwBreaks = 0;
        if (fx) this.push({ t: 'cwPhase', k: fx });
        return;
      }
      if (boss.data.lifespan) boss.turnsTaken = -999;
      if (fx === 'gene') {
        boss.buffs.push({ s: 'spdP', v: FX.gene.spd, turns: 999, perm: true, name: FX.gene.name });
        for (let i = 0; i < FX.gene.n; i++) { const s = this.spawnFoe(i % 2 ? 'gnawsting' : 'juvsting', boss.lvl, boss); s.flags.cwSting = true; }
        boss.flags.cwGene = true;
      }
      if (fx === 'antimatter' || fx === 'doom' || fx === 'bombard' || fx === 'hand' || fx === 'havoc') boss.flags.cwBT = 0;
      if (fx && fx !== 'wrath' && fx !== 'aura') this.push({ t: 'cwPhase', k: fx });
    },

    cwBossTurn(u) {
      const fx = fxOf(this), d = u.data;
      if (!d.boss || !fx) return;
      u.flags.cwBT = (u.flags.cwBT || 0) + 1;
      const n = u.flags.cwBT, idx = name => d.skills.findIndex(s => s.n === name);
      if (fx === 'antimatter' && n % FX.antimatter.every === 0 && u.charging == null) { const i = idx('Сбор антиматерии'); if (i >= 0) u.planned = d.skills[i]; }
      if (fx === 'doom' && n % FX.doom.every === 0 && u.charging == null) { const i = idx('Неизбежная гибель'); if (i >= 0) u.planned = d.skills[i]; }
      if (fx === 'bombard' && n % FX.bombard.every === 0) u.flags.cwBombard = true;
    },

    cwBossAfter(u, charging0) {
      const fx = fxOf(this);
      if (!alive(u) || this.over) return;
      if (u.flags.cwBombard) {
        u.flags.cwBombard = false;
        const B = FX.bombard;
        this.push({ t: 'act', u, name: B.name, kind: 'enemy' });
        this.acting = u;
        for (let i = 0; i < B.hits; i++) { const t = this.rng.pick(this.livingAllies.filter(a => !a.flags.away)); if (t) this.hit(u, t, B.m, { e: 'fire' }); }
        for (const a of this.livingAllies) a.buffs.push({ s: 'defP', v: -B.def, turns: 3, name: B.name, debuff: true });
        this.acting = null;
      }
      if (fx === 'antimatter' && charging0 == null && u.charging != null && !u.flags.cwSummoned && this.living.length < 5) { u.flags.cwSummoned = true; this.spawnFoe('trampler', u.lvl, u); }
      if (fx === 'doom' && charging0 != null && u.charging == null && this.living.length < 5) this.spawnFoe(this.rng() < 0.5 ? 'reaver' : 'eliminator', u.lvl, u);
      if (fx === 'havoc' && u.lockTarget) {
        for (const l of this.living.filter(e => e.id === 'lotus_de')) {
          this.acting = l;
          this.push({ t: 'act', u: l, name: FX.havoc.name, kind: 'enemy' });
          for (const a of this.livingAllies.filter(x => !x.flags.away)) this.hit(l, a, FX.havoc.m, { e: 'elec' });
        }
        this.acting = null;
      }
      if (u.data.proto && u.flags.coreT === T.protoCore) u.flags.coreT = FX.core.every;
      if (u.flags.cwCascade > 0 && --u.flags.cwCascade === 0) {
        const C = FX.cascade;
        this.push({ t: 'act', u, name: C.name, kind: 'enemy' });
        this.acting = u;
        for (const a of this.livingAllies.filter(x => !x.flags.away)) this.hit(u, a, C.m, { e: 'ice' });
        this.acting = null;
      }
      this.cleanup();
    },

    cwBossHurt(src, t, before) {
      if (!t.data.boss || !alive(t)) return;
      const half = before >= t.maxHp * 0.5 && t.hp < t.maxHp * 0.5;
      if (half && t.flags.cwCascadeOk) { t.flags.cwCascadeOk = false; t.flags.cwCascade = FX.cascade.turns; this.push({ t: 'cwPhase', k: 'cascade' }); }
      if (half && fxOf(this) === 'hand' && !t.flags.cwHand) {
        t.flags.cwHand = true;
        t.av = 0;
        const room = Math.max(0, Math.min(FX.hand.n - this.living.filter(e => e.id === 'svarog_hand').length, 5 - this.living.length));
        for (let i = 0; i < room; i++) this.spawnFoe('svarog_hand', t.lvl, t);
        this.push({ t: 'cwPhase', k: 'hand' });
      }
      if (t.data.proto && t.flags.barrier && (src.charId === 'aqua' || (src.owner && src.owner.charId === 'aqua'))) this.cwBarrierDown(t, 'Аква: «Разрушение заклинаний!»');
    },

    cwBarrierDown(t, why) {
      t.flags.barrier = false;
      this.push({ t: 'status', u: t, text: 'Барьер разрушен!', col: '#8ad0ff' });
      if (why) this.push({ t: 'text', text: why });
    },

    cwStingCheck() {
      const boss = this.living.find(e => e.flags.cwGene);
      if (!boss || this.living.some(e => e.flags.cwSting)) return;
      boss.flags.cwGene = false;
      boss.tough = 0;
      if (!boss.broken) this.doBreak(this.livingAllies[0] || null, boss, 'phys');
      boss.av += 2 * AV / spdOf(boss);
      this.push({ t: 'status', u: boss, text: 'Рой уничтожен: босс пробит', col: '#ffffff' });
    }
  });

  const protoGuard0 = BP.protoGuard;
  BP.protoGuard = function (src, t, dmg, o) {
    if (!this.cwInfo) return protoGuard0.call(this, src, t, dmg, o);
    if (t.flags.barrier) return Math.max(1, Math.round(dmg * FX.barrier.k));
    return dmg;
  };

  const protoCore0 = BP.protoCore;
  BP.protoCore = function (actor, t) {
    if (!this.cwInfo) return protoCore0.call(this, actor, t);
    if (!t || !alive(t) || !t.data.proto || t.flags.cwStolen || fxOf(this) !== 'core') return false;
    t.flags.cwStolen = true;
    this.push({ t: 'status', u: t, text: 'Кража ядра!', col: '#ffd040' });
    this.hit(actor, t, 0, { raw: t.maxHp * FX.core.steal, label: 'Кража ядра' });
    return false;
  };

  const doBreak0 = BP.doBreak;
  BP.doBreak = function (src, tgt, e) {
    const r = doBreak0.call(this, src, tgt, e);
    if (this.cwInfo && tgt && tgt.data && tgt.data.proto && tgt.flags.barrier) {
      tgt.flags.cwBreaks = (tgt.flags.cwBreaks || 0) + 1;
      if (tgt.flags.cwBreaks >= FX.barrier.breaks) this.cwBarrierDown(tgt, 'Третье пробитие ломает барьер голема.');
      else this.push({ t: 'status', u: tgt, text: 'Барьер: ' + tgt.flags.cwBreaks + '/' + FX.barrier.breaks, col: '#8ad0ff' });
    }
    return r;
  };

  const enemyTurn0 = BP.enemyTurn;
  BP.enemyTurn = function (u) {
    if (!this.cwInfo || !u || !u.data || !u.data.boss) return enemyTurn0.call(this, u);
    this.cwBossTurn(u);
    const ch = u.charging;
    const r = enemyTurn0.call(this, u);
    if (this.cwInfo && !this.over) this.cwBossAfter(u, ch);
    return r;
  };

  const kitsHit0 = BP.cwKitsHit;
  BP.cwKitsHit = function (src, tgt, o, dmg, before) {
    kitsHit0.call(this, src, tgt, o, dmg, before);
    if (tgt && tgt.side === 'enemy') this.cwBossHurt(src, tgt, before);
  };

  const kitsKill0 = BP.cwKitsKill;
  BP.cwKitsKill = function (t, src) { kitsKill0.call(this, t, src); if (t && t.flags && t.flags.cwSting) this.cwStingCheck(); };

  const kitsWave0 = BP.cwKitsWave;
  BP.cwKitsWave = function (list) {
    kitsWave0.call(this, list);
    if (list === this.enemies) this.cwPhaseStart(list);
  };

  const kitsStart0 = BP.cwKitsStart;
  BP.cwKitsStart = function () { kitsStart0.call(this); this.cwPhaseStart(this.enemies, 0); };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
