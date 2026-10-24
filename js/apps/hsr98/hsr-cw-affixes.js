(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN;
  const { alive, atkOf } = H.battleStat;
  const GP = H.Game.prototype, BP = H.Battle.prototype;
  const ELEM_NAME = { phys: 'физики', fire: 'огня', ice: 'льда', elec: 'молнии', wind: 'ветра', quant: 'кванта', imag: 'мнимости' };

  const AFFIXES = {
    boostEscort: { fam: 'boost', danger: 1, name: 'Усиление свиты', text: 'Обычные враги и элита: +30% скорости, +20% НР.' },
    boostBoss: { fam: 'boost', danger: 2, name: 'Усиление босса', text: 'Боссы: +60% скорости, +30% НР.' },
    boostP1: { fam: 'boost', danger: 1, plane: 0, name: 'Усиление первого измерения', text: 'Враги измерения 1: +20% скорости, +20% НР.' },
    boostP2: { fam: 'boost', danger: 2, plane: 1, name: 'Усиление второго измерения', text: 'Враги измерения 2: +40% скорости, +25% НР.' },
    boostP3: { fam: 'boost', danger: 2, plane: 2, name: 'Усиление третьего измерения', text: 'Враги измерения 3: +60% скорости, +30% НР.' },
    frontOff: { danger: 1, name: 'Отключение фронта', text: 'Первый удар каждого героя поля наносит 1 урона.' },
    rearOff: { danger: 1, name: 'Отключение тыла', text: 'Первый удар каждого героя вне поля наносит 1 урона.' },
    magma: { danger: 2, name: 'Магматическая бомбардировка', text: 'Первого героя поля чаще бьют, после удара Горение 12% его НР на 3 хода, складывается.' },
    hearty: { danger: 1, name: 'Сытная потасовка', text: 'Отсчёт битвы −30, отсчёт босса +20.' },
    inevitable: { danger: 1, name: 'Неминуемая развязка', text: 'Отсчёт босса −30, отсчёт встречи +20.' },
    extraHit: { danger: 1, name: 'Лишний удар', text: 'За каждую пустую ячейку экипировки герой получает дополнительный чистый урон 8% удара.' },
    injury: { danger: 2, name: 'Постоянная травма', text: 'Потерянные НР героя снижают его наибольший НР на 20% потерянного, до 60% (до конца боя).' },
    heavyStep: { danger: 1, name: 'Тяжёлая поступь', text: 'Удар врага отодвигает героя на 8%.' },
    inertia: { danger: 2, name: 'Инерция', text: 'После первого действия враг сразу ходит ещё раз.' },
    fightFlight: { danger: 1, name: 'Бей или беги', text: 'При НР ниже 50% враг ходит раньше на 100%.' },
    purity: { danger: 1, name: 'Чистота плоти и духа', text: 'При первом падении ниже 50% враг снимает все ослабления и лечится на 10% + 2% за каждое снятое.' },
    syncActions: { danger: 2, name: 'Синхронные действия', text: 'Каждое ускорение хода героя двигает элиту или босса вперёд на 20%.' },
    critRiddle: { danger: 1, name: 'Критическая загадка', text: 'Удар по герою поля на 1 ход снижает его силу лечения и щита на 50%.' },
    exhaustion: { danger: 2, name: 'Истощение', text: 'Герои без 3 предметов наносят 80% урона.' },
    cryosleep: { danger: 2, name: 'Криосон', text: 'После «О гибели» герой заморожен на 2 хода.' },
    lostLuck: { danger: 1, name: 'Потерянная удача', text: 'Шанс счастливого удара отряда −25%.' },
    weakHunt: { danger: 1, name: 'Охота на слабых', text: 'Герои 1★ получают +20% урона.' },
    vengeance: { danger: 1, name: 'Пылающая месть', text: 'Гибель обычного врага даёт остальным +8% урона на 1 ход, складывается.' },
    energyDrain: { danger: 1, name: 'Исчезновение энергии', text: 'Удар по врагу отнимает у атакующего 4 энергии, если она не полна.' },
    roleModel: { danger: 1, name: 'Пример для подражания', text: 'Лучший по урону герой наносит 75%, остальные 110%.' },
    jailCard: { danger: 1, name: 'Карточка «Выйти из тюрьмы»', text: 'Враг, чьи НР упали ниже 1%, один раз остаётся на 10%.' },
    overEndure: { danger: 1, name: 'Сверх выносливости', text: 'После 7 ударов враг ходит раньше на 100%.' },
    selfDefense: { danger: 2, name: 'Самооборона', text: 'Удар героя поля возвращает ему урон 120% АТК врага, не добивая.' },
    quickCool: { danger: 1, name: 'Быстрое охлаждение', text: 'В конце хода героя поля 15% шанса заморозки за каждое потраченное очко навыков.' },
    hemostasis: { danger: 1, name: 'Срочный гемостаз', text: 'Враги входят в бой с −20% НР, после каждого действия лечатся на 15%, всего 3 раза.' },
    speedSwap: { danger: 1, name: 'Смена скоростей', text: 'Два героя с наибольшей скоростью теряют 40%, два с наименьшей получают 25%.' },
    trap: { danger: 1, name: 'Это ловушка', text: 'В начале боя у каждого героя поля 40% шанса заточения или запутывания (−20% хода).' },
    trashTreasure: { danger: 1, name: 'Сокровище в мусор', text: 'Первый продвинутый предмет каждого измерения с шансом 50% становится мусорным мешком.' },
    timeKiller: { danger: 2, name: 'Убийца времени', text: 'В битвах иногда выходит «Убийца времени», каждый его удар отнимает у отсчёта 7.' },
    badStart: { danger: 1, name: 'Плохой старт', text: '−20 НР команды в начале партии.' },
    bondsFirst: { danger: 1, name: 'Связи прежде всего', text: 'Отряд наносит 105%, базовый урон связей и стратегий 70%.' },
    thickSkin: { danger: 2, name: 'Толстокожие', text: 'Непробитые враги получают на 30% меньше урона.' },
    blunted: { danger: 2, name: 'Притупленное остриё', text: 'Герои с понижением урона меньше 20% наносят 80% урона.' },
    diffAttitude: { danger: 1, name: 'Разное отношение', text: 'Герои 1★/2★/3★ наносят 80/90/105% урона.' },
    rustyTreasury: { danger: 1, name: 'Ржавая казна', text: 'За каждый неиспользованный предмет в инвентаре враги +3% урона и −4% получаемого, до 10 предметов.' },
    alone: { danger: 2, name: 'Я один', text: 'Герой с 1/2/3 невключёнными связями наносит 85/60/30% урона.' },
    growthPains: { danger: 1, name: 'Болезнь роста', text: 'После 8-го уровня каждая покупка опыта сжигает ещё 1 монету.' },
    cheapTaste: { danger: 1, name: 'Дешёвый вкус', text: 'Стоимость 1–3 наносит 105%, стоимость 4–5: 80%.' },
    dearTaste: { danger: 1, name: 'Дорогой вкус', text: 'Стоимость 1–3 наносит 80%, стоимость 4–5: 105%.' }
  };
  for (const [e, n] of Object.entries(ELEM_NAME)) AFFIXES['curb_' + e] = { danger: 1, elem: e, name: 'Сдерживание ' + n, text: 'Первые 4 атаки героев этой стихии наносят 1 урона.' };

  const COUNT = tier => (tier >= 8 ? 4 : tier >= 6 ? 3 : tier >= 4 ? 2 : tier >= 2 ? 1 : 0);
  const has = (b, id) => !!(b.cw && b.cw.affix && b.cw.affix.includes(id));
  const onRun = (run, id) => !!run && (run.affixes || []).includes(id);
  const ownerOf = u => (u && u.cwU ? u : u && u.owner && u.owner.cwU ? u.owner : null);
  const drOf = u => u.buffs.reduce((a, b) => a + (b.s === 'dr' ? b.v : 0), 0);

  Object.assign(GP, {
    cwRollAffixes(run) {
      const n = COUNT(run.tier), out = [];
      if (!n) return out;
      const boost = Object.keys(AFFIXES).filter(k => AFFIXES[k].fam === 'boost'), rest = Object.keys(AFFIXES).filter(k => AFFIXES[k].fam !== 'boost' && !/^curb_/.test(k)).concat('curb');
      const take = (list, k) => { for (let i = 0; i < k && list.length; i++) out.push(list.splice(Math.floor(CW.rnd(run) * list.length), 1)[0]); };
      take(boost, n >= 3 ? 2 : 1);
      take(rest, n - out.length);
      const ci = out.indexOf('curb');
      if (ci >= 0) out[ci] = 'curb_' + Object.keys(ELEM_NAME)[Math.floor(CW.rnd(run) * 7)];
      return out;
    }
  });

  const new0 = GP.cwNew;
  GP.cwNew = function (o = {}) {
    const run = new0.call(this, o);
    run.affixes = this.cwRollAffixes(run);
    if (onRun(run, 'badStart')) { run.hp -= 20; }
    return run;
  };

  const countdown0 = GP.cwCountdown;
  GP.cwCountdown = function (run, kind) {
    let v = countdown0.call(this, run, kind);
    if (v == null) return v;
    if (onRun(run, 'hearty')) v += kind === 'boss' ? 20 : kind === 'fight' ? -30 : 0;
    if (onRun(run, 'inevitable')) v += kind === 'boss' ? -30 : kind === 'enc' ? 20 : 0;
    return Math.max(30, v);
  };

  const buyExp0 = GP.cwBuyExp;
  GP.cwBuyExp = function () {
    const run = this.cwRun(), r = buyExp0.call(this);
    if (r && onRun(run, 'growthPains') && run.lvl >= 8 && run.gold > 0) { run.gold--; run.spent++; }
    return r;
  };

  const invAdd0 = GP.cwInvAdd;
  GP.cwInvAdd = function (run, id, sp) {
    if (onRun(run, 'trashTreasure') && CW.ITEMS[id] && CW.ITEMS[id].kind === 'adv') {
      run.trashAt = run.trashAt || {};
      if (!run.trashAt[run.plane]) { run.trashAt[run.plane] = true; if (CW.rnd(run) < 0.5) return invAdd0.call(this, run, 'trash'); }
    }
    return invAdd0.call(this, run, id, sp);
  };

  const compile0 = GP.cwCompile;
  GP.cwCompile = function (run, kind) {
    const cw = compile0.call(this, run, kind);
    cw.affix = (run.affixes || []).filter(k => !(run.affixOff || []).includes(k));
    cw.invN = Math.min(10, this.cwInv(run).length);
    if (cw.affix.includes('bondsFirst')) cw.base *= 0.7;
    for (const u of Object.values(cw.units)) u.offBonds = CW.UNITS[u.id].bonds.filter(k => CW.BONDS[k] && !(cw.tiers[k] >= 0)).length;
    cw.timeKiller = cw.affix.includes('timeKiller') && kind !== 'boss' && kind !== 'reward' && CW.rnd(run) < 0.4;
    return cw;
  };

  Object.assign(BP, {
    cwAffixFoes(list) {
      const cw = this.cw, p = cw.plane;
      for (const e of list) {
        const big = e.data.boss;
        let hp = 1, spd = 0;
        if (has(this, 'boostEscort') && !big) { hp *= 1.2; spd += 0.3; }
        if (has(this, 'boostBoss') && big) { hp *= 1.3; spd += 0.6; }
        for (const k of ['boostP1', 'boostP2', 'boostP3']) if (has(this, k) && AFFIXES[k].plane === p) { hp *= [1.2, 1.25, 1.3][p]; spd += [0.2, 0.4, 0.6][p]; }
        if (hp !== 1) { const k = e.hp / e.maxHp; e.maxHp = Math.max(1, Math.round(e.maxHp * hp)); e.hp = Math.max(1, Math.round(e.maxHp * k)); }
        if (has(this, 'hemostasis') && e.flags.cwHemo == null) { e.flags.cwHemo = 3; e.hp = Math.max(1, Math.round(e.maxHp * 0.8)); }
        if (spd) e.buffs.push({ s: 'spdP', v: spd, turns: 999, perm: true, name: 'Аффикс: скорость' });
        if (has(this, 'rustyTreasury') && cw.invN) e.buffs.push({ s: 'dmgP', v: 0.03 * cw.invN, turns: 999, perm: true, name: 'Ржавая казна' }, { s: 'dr', v: 0.04 * cw.invN, turns: 999, perm: true, name: 'Ржавая казна: защита' });
      }
      if (cw.timeKiller && list === this.enemies && !this.cwInfo.timeKillerOut) {
        const t = list.filter(e => !e.data.boss && !e.data.elite)[0];
        if (t) { this.cwInfo.timeKillerOut = true; const k = this.spawnFoe(H.ENEMIES.timekiller ? 'timekiller' : t.id, t.lvl, null); k.flags.cwTimeKiller = true; this.push({ t: 'status', u: k, text: 'Убийца времени', col: '#c88aff' }); }
      }
    },

    cwAffixStart() {
      const I = this.cwInfo, field = this.allies.filter(a => a.cwU && alive(a));
      this.cwAffixFoes(this.enemies);
      if (has(this, 'magma') && field[0]) field[0].buffs.push({ s: 'aggro', v: 3, turns: 999, perm: true, name: 'Магматическая бомбардировка' });
      if (has(this, 'weakHunt')) for (const a of field) if (a.cwU.star === 1) a.buffs.push({ s: 'vuln', v: 0.2, turns: 999, perm: true, name: 'Охота на слабых', debuff: true });
      if (has(this, 'speedSwap') && field.length >= 2) {
        const by = field.slice().sort((a, b) => H.battleStat.spdOf(b) - H.battleStat.spdOf(a));
        for (const a of by.slice(0, 2)) a.buffs.push({ s: 'spdP', v: -0.4, turns: 999, perm: true, name: 'Смена скоростей', debuff: true });
        for (const a of by.slice(-2).filter(x => !by.slice(0, 2).includes(x))) a.buffs.push({ s: 'spdP', v: 0.25, turns: 999, perm: true, name: 'Смена скоростей' });
      }
      if (has(this, 'trap')) for (const a of field) if (this.rng() < 0.4) { this.advance(a, -0.2); this.push({ t: 'status', u: a, text: this.rng() < 0.5 ? 'Заточение' : 'Запутывание', col: '#c8a8ff', debuff: true }); }
      I.curb = 0;
    },

    cwAffixMul(w, tgt, o) {
      const cw = this.cw, I = this.cwInfo, u = w.cwU;
      if (!u) return 1;
      let m = 1;
      if (has(this, 'exhaustion') && (u.it ? u.it.items.length : 0) < 3) m *= 0.8;
      if (has(this, 'bondsFirst')) m *= 1.05;
      if (has(this, 'blunted') && drOf(w) < 0.2) m *= 0.8;
      if (has(this, 'diffAttitude')) m *= [0.8, 0.9, 1.05][Math.min(2, u.star - 1)];
      if (has(this, 'cheapTaste')) m *= u.cost <= 3 ? 1.05 : 0.8;
      if (has(this, 'dearTaste')) m *= u.cost <= 3 ? 0.8 : 1.05;
      if (has(this, 'alone') && u.offBonds) m *= [1, 0.85, 0.6, 0.3][Math.min(3, u.offBonds)];
      if (has(this, 'roleModel')) { const top = Object.entries(I.dmg || {}).sort((a, b) => b[1] - a[1])[0]; m *= top && +top[0] === u.uid ? 0.75 : 1.1; }
      if (has(this, 'thickSkin') && tgt && tgt.side === 'enemy' && !tgt.broken) m *= 0.7;
      return m;
    }
  });

  const kitsStart0 = BP.cwKitsStart;
  BP.cwKitsStart = function () { kitsStart0.call(this); this.cwAffixStart(); };

  const kitsWave0 = BP.cwKitsWave;
  BP.cwKitsWave = function (list) { kitsWave0.call(this, list); this.cwAffixFoes(list); };

  const kitsAmp0 = BP.cwKitsAmp;
  BP.cwKitsAmp = function (w, tgt, o) {
    const r = kitsAmp0.call(this, w, tgt, o), m = this.cwAffixMul(w, tgt, o);
    return m !== 1 ? (1 + r) * m - 1 : r;
  };

  const kitsLucky0 = BP.cwKitsLucky;
  BP.cwKitsLucky = function (w) {
    const r = kitsLucky0.call(this, w);
    if (has(this, 'lostLuck')) r.ch -= 0.25;
    return r;
  };

  const dmgCalc0 = BP.dmgCalc;
  BP.dmgCalc = function (src, tgt, mult, o, crit) {
    const v = dmgCalc0.call(this, src, tgt, mult, o, crit);
    const I = this.cwInfo;
    if (!I || !src || src.side !== 'ally' || !tgt || tgt.side !== 'enemy' || o.isDot) return v;
    const w = ownerOf(src);
    if (!w) return v;
    if (has(this, 'frontOff') && !w.summon && w.flags.cwFirst !== true) { w.flags.cwFirst = true; return 1; }
    if (has(this, 'rearOff') && w.summon && w.cwOff && w.flags.cwFirst !== true) { w.flags.cwFirst = true; return 1; }
    const curb = this.cw.affix.find(k => /^curb_/.test(k));
    if (curb && w.elem === AFFIXES[curb].elem && I.curb < 4) {
      if (I.curbAct !== this.actSerial) { I.curbAct = this.actSerial; I.curb++; }
      return 1;
    }
    return v;
  };

  const hit0 = BP.hit;
  BP.hit = function (src, tgt, mult, o = {}) {
    const I = this.cwInfo;
    if (!I || !tgt || !src) return hit0.call(this, src, tgt, mult, o);
    const before = tgt.hp, broken = tgt.broken;
    const dmg = hit0.call(this, src, tgt, mult, o);
    if (this.over) return dmg;
    if (tgt.side === 'ally' && src.side === 'enemy' && !o.isDot) {
      if (has(this, 'heavyStep') && alive(tgt) && tgt.flags.cwStep !== this.actSerial) { tgt.flags.cwStep = this.actSerial; this.advance(tgt, -0.08); }
      if (has(this, 'magma') && alive(tgt) && tgt === this.allies.find(a => a.cwU && alive(a))) this.addDot(src, tgt, 'burn', tgt.maxHp * 0.12, 3, 5);
      if (has(this, 'critRiddle') && alive(tgt)) { tgt.buffs = tgt.buffs.filter(b => b.name !== 'Критическая загадка'); tgt.buffs.push({ s: 'healP', v: -0.5, turns: 1, name: 'Критическая загадка', debuff: true }, { s: 'shieldP', v: -0.5, turns: 1, name: 'Критическая загадка: щит', debuff: true }); }
      if (has(this, 'injury') && before > tgt.hp && alive(tgt)) { const floor = (tgt.base.hp || tgt.maxHp) * 0.4; tgt.maxHp = Math.max(floor, Math.round(tgt.maxHp - (before - tgt.hp) * 0.2)); tgt.hp = Math.min(tgt.hp, tgt.maxHp); }
      if (src.flags && src.flags.cwTimeKiller && I.left != null && src.flags.cwTkAct !== this.actSerial) { src.flags.cwTkAct = this.actSerial; I.left = Math.max(0, I.left - 7); this.push({ t: 'status', u: src, text: 'Отсчёт −7', col: '#c88aff' }); }
    }
    if (tgt.side === 'enemy' && src.side === 'ally' && !o.isDot && !o.echo) {
      const w = ownerOf(src);
      if (has(this, 'energyDrain') && w && !w.summon && w.energy < w.maxEnergy && w.flags.cwDrain !== this.actSerial) { w.flags.cwDrain = this.actSerial; w.energy = Math.max(0, w.energy - 4); }
      if (has(this, 'overEndure') && alive(tgt)) { tgt.flags.cwHits = (tgt.flags.cwHits || 0) + 1; if (tgt.flags.cwHits % 7 === 0) this.advance(tgt, 1); }
      if (has(this, 'fightFlight') && alive(tgt) && !tgt.flags.cwFled && tgt.hp < tgt.maxHp * 0.5) { tgt.flags.cwFled = true; this.advance(tgt, 1); }
      if (has(this, 'purity') && alive(tgt) && !tgt.flags.cwPure && before >= tgt.maxHp * 0.5 && tgt.hp < tgt.maxHp * 0.5) {
        tgt.flags.cwPure = true;
        const n = tgt.buffs.filter(b => b.debuff).length;
        tgt.buffs = tgt.buffs.filter(b => !b.debuff || b.perm);
        tgt.dots = [];
        tgt.hp = Math.min(tgt.maxHp, tgt.hp + Math.round(tgt.maxHp * (0.1 + 0.02 * n)));
        this.push({ t: 'status', u: tgt, text: 'Чистота плоти и духа', col: '#9aff9a' });
      }
      if (has(this, 'selfDefense') && w && !w.summon && alive(w) && w.flags.cwDef !== this.actSerial) { w.flags.cwDef = this.actSerial; const v = Math.min(w.hp - 1, Math.round(atkOf(tgt) * 1.2)); if (v > 0) { w.hp -= v; this.push({ t: 'dmg', u: w, src: tgt, v, e: 'phys', hp: w.hp, shield: w.shield, label: 'Самооборона' }); } }
      if (has(this, 'extraHit') && w && dmg > 1 && !this.cwExtraBusy) {
        const empty = 3 - ((w.cwU.it && w.cwU.it.items.length) || 0);
        if (empty > 0 && alive(tgt)) { this.cwExtraBusy = true; hit0.call(this, src, tgt, 0, { raw: dmg * 0.08 * empty, echo: true, label: 'Лишний удар' }); this.cwExtraBusy = false; }
      }
    }
    return dmg;
  };

  const advance0 = BP.advance;
  BP.advance = function (u, v) {
    advance0.call(this, u, v);
    if (this.cwInfo && v > 0 && u && u.side === 'ally' && has(this, 'syncActions') && !this.cwSyncBusy) {
      this.cwSyncBusy = true;
      for (const e of this.living) if (e.data.boss || e.data.elite) advance0.call(this, e, 0.2);
      this.cwSyncBusy = false;
    }
  };

  const onZero0 = BP.onZero;
  BP.onZero = function (tgt, src) {
    if (this.cwInfo && tgt && tgt.side === 'enemy' && has(this, 'jailCard') && !tgt.flags.cwJail) {
      tgt.flags.cwJail = true;
      tgt.hp = Math.max(1, Math.ceil(tgt.maxHp * 0.1));
      this.push({ t: 'status', u: tgt, text: 'Выйти из тюрьмы', col: '#ffd471' });
      return;
    }
    return onZero0.call(this, tgt, src);
  };

  const enemyTurn0 = BP.enemyTurn;
  BP.enemyTurn = function (u) {
    const r = enemyTurn0.call(this, u);
    if (!this.cwInfo || this.over || !alive(u)) return r;
    if (has(this, 'inertia') && !u.flags.cwInert) { u.flags.cwInert = true; u.av = 0; }
    if (has(this, 'hemostasis') && u.flags.cwHemo > 0) { u.flags.cwHemo--; u.hp = Math.min(u.maxHp, u.hp + Math.round(u.maxHp * 0.15)); }
    return r;
  };

  const kitsKill0 = BP.cwKitsKill;
  BP.cwKitsKill = function (t, src) {
    kitsKill0.call(this, t, src);
    if (has(this, 'vengeance') && t && t.side === 'enemy' && !t.data.boss && !t.data.elite) for (const e of this.living) e.buffs.push({ s: 'dmgP', v: 0.08, turns: 1, name: 'Пылающая месть' });
  };

  const kitsAfter0 = BP.cwKitsAfter;
  BP.cwKitsAfter = function (u, kind) {
    const I = this.cwInfo, sp0 = I && I.spBefore != null ? I.spBefore : this.sp;
    kitsAfter0.call(this, u, kind);
    if (!I || this.over || !u || !u.cwU || u.summon || !has(this, 'quickCool')) return;
    const spent = sp0 - this.sp;
    if (spent > 0 && alive(u) && this.rng() < 0.15 * spent) { u.frozen = 1; this.push({ t: 'status', u, text: 'Быстрое охлаждение', col: '#8adfff', debuff: true }); }
  };

  const nearAfter0 = BP.cwKitsNearAfter;
  BP.cwKitsNearAfter = function (u) {
    nearAfter0.call(this, u);
    if (has(this, 'cryosleep') && u && alive(u)) { u.frozen = 1; u.stun = 1; this.push({ t: 'status', u, text: 'Криосон', col: '#8adfff', debuff: true }); }
  };

  CW.AFFIXES = AFFIXES;
  CW.affixCount = COUNT;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
