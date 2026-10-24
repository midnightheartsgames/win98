(function (H) {
  'use strict';
  const CW = H.CW, TUN = CW.TUN;
  const { alive } = H.battleStat;
  const GP = H.Game.prototype, BP = H.Battle.prototype;

  const POW_P = [['atk', 0.12, 'АТК'], ['hp', 0.06, 'НР'], ['critR', 0.06, 'Шанс крита'], ['critD', 0.12, 'Крит. урон'], ['def', 0.08, 'Защита'], ['breakE', 0.15, 'Эффект пробития'], ['res', 0.08, 'Сопротивление эффектам']];
  const POW_S = [['atk', 0.36, 'АТК'], ['dr', 0.25, 'Понижение урона'], ['def', 0.36, 'Защита'], ['hp', 0.12, 'НР'], ['critR', 0.18, 'Шанс крита'], ['breakE', 0.3, 'Эффект пробития'], ['res', 0.16, 'Сопротивление эффектам'], ['critD', 0.36, 'Крит. урон']];
  const PERKS = [
    { id: 'prep', tab: 'p', name: 'Подготовка к бою', cost: 20, text: 'В начале боя работают техники всех героев поля. Если техники мешают друг другу, первой срабатывает техника левого героя.' },
    { id: 'goldBless', tab: 'p', name: 'Золотое благословение', cost: 60, text: 'Если в прошлой партии пройдено измерение 1, +2 монеты в начале каждого измерения.' },
    { id: 'baseArms', tab: 'p', name: 'Базовое вооружение', cost: 60, text: 'Простой предмет после босса измерения 1 и 2.' },
    { id: 'extraSupply', tab: 'p', name: 'Дополнительное снабжение', cost: 60, text: 'В снабжении на 1 вариант больше.' },
    { id: 'stratRoll', tab: 'p', name: 'Обновление стратегии', cost: 60, text: 'Каждую карточку стратегии можно обновить один раз.' },
    { id: 'longFight', tab: 'p', name: 'Затяжной бой', cost: 100, text: 'Ещё 1 простой предмет на старте. +2 НР команды после каждого боя.' },
    { id: 'thanks', tab: 's', name: 'Благодарность за победу', cost: 20, text: 'В начале боя 1 очко навыков. Если финальный босс повержен и в отсчёте осталось 100 или больше, +40 НР команды.' },
    { id: 'expInvest', tab: 's', name: 'Вложение в опыт', cost: 60, text: '+2 опыта в начале измерений 2 и 3.' },
    { id: 'weaken', tab: 's', name: 'Снижение мощи', cost: 60, text: 'В узлах наград враги сразу теряют 99% НР.' },
    { id: 'shiny', tab: 's', name: 'Сияющий алмаз', cost: 60, text: 'В снабжении у героя может оказаться алмаз вместо простого предмета.' },
    { id: 'adaptive', tab: 's', name: 'Адаптивная тактика', cost: 100, text: 'Прибавка серии 1 монета даже при серии 0. Враги встреч всегда сложности IV. Сила лечения и щита +10%.' },
    { id: 'envRoll', tab: 's', name: 'Обновление среды', cost: 60, text: 'Одна перетасовка сред в начале партии.' },
    { id: 'branchRoll', tab: 's', name: 'Обновление ветви', cost: 60, text: 'Одна перетасовка ветвей встречи.' },
    { id: 'supplyRoll', tab: 's', name: 'Обновление снабжения', cost: 60, text: 'Одна перетасовка снабжения.' },
    { id: 'fauna', tab: 's', name: 'Фантастическая фауна', cost: 100, text: 'В боях бывают свинки-копилки с наградой. Получаемый урон −10%, урон счастливого удара +10%.' },
    { id: 'recovery', tab: 's', name: 'Восстановление после действия', cost: 60, text: '«О гибели» стоит отсчёту на 10 меньше.' },
    { id: 'smith', tab: 's', name: 'Мастер-кузнец', cost: 60, text: '«Плавильная печь» и «Ключ для разборки» в начале измерения 2.' },
    { id: 'compensate', tab: 's', name: 'Служба компенсаций', cost: 60, text: '1 монета за каждые 10 потерянных НР команды.' },
    { id: 'safety', tab: 's', name: 'Страховочный механизм', cost: 100, text: 'Первый раз, когда НР команды должны дойти до 0, остаётся 1. Урон +10%. При серии от 6 прибавка серии 4.' }
  ];
  POW_P.forEach(([s, v, n], i) => PERKS.push({ id: 'powP' + i, tab: 'p', pow: true, stat: s, v, name: 'Боевая мощь: ' + n, cost: 20, text: n + ' героев режима +' + Math.round(v * 100) + '%.' }));
  POW_S.forEach(([s, v0, n], i) => PERKS.push({ id: 'powS' + i, tab: 's', pow: true, stat: s, v0, name: 'Боевая мощь: ' + n, cost: 20, get v() { return Math.round(this.v0 * (TUN.perkPowS == null ? 1 : TUN.perkPowS) * 100) / 100; }, get text() { return n + ' героев режима +' + Math.round(this.v * 100) + '%.'; } }));
  const PK = {};
  for (const p of PERKS) PK[p.id] = p;

  const BANK_STEPS = { strats: [15, 30, 45, 60, 75, 90], envs: [5, 10, 15, 20, 25, 30] };
  const BANK_REW = { jade: 20, pts: 200 };
  const LINK_REW = { jade: 20, pts: 200 };
  const LINK_BONDS = Object.keys(CW.BONDS).filter(k => CW.BONDS[k].kind !== 'special');

  function linkTasks(k) {
    const B = CW.BONDS[k], two = B.steps.length <= 2, a = two ? 0 : 1, b = two ? 1 : 2;
    return [{ i: 0, tier: a, n: B.steps[a] }, { i: 1, tier: b, n: B.steps[b] }, { i: 2, tier: b, n: B.steps[b], hard: true }];
  }

  const on = (g, id) => g.cwPerkOn(id);

  Object.assign(GP, {
    cwPerks() {
      const C = this.cwMeta();
      if (!C.perks) C.perks = { on: [] };
      if (!C.links) C.links = { done: [], got: [] };
      if (!C.bank) C.bank = { got: [] };
      return C;
    },

    cwPerkOn(id) { return this.cwPerks().perks.on.includes(id); },

    cwPerkCan(id) {
      const C = this.cwPerks(), P = PK[id];
      if (!P) return 'target';
      if (C.perks.on.includes(id)) return 'have';
      if (P.tab === 's' && PERKS.some(x => x.tab === 'p' && !C.perks.on.includes(x.id))) return 'locked';
      if (C.notes < P.cost) return 'notes';
      return null;
    },

    cwPerkBuy(id) {
      const err = this.cwPerkCan(id);
      if (err) return err;
      const C = this.cwPerks();
      C.notes -= PK[id].cost;
      C.perks.on.push(id);
      return null;
    },

    cwPerkReset() {
      const C = this.cwPerks();
      for (const id of C.perks.on) C.notes += PK[id].cost;
      C.perks.on = [];
    },

    cwPerkPow() {
      const out = {};
      for (const id of this.cwPerks().perks.on) { const P = PK[id]; if (P.pow) out[P.stat] = (out[P.stat] || 0) + P.v; }
      return out;
    },

    cwSeenAdd(kind, id) {
      const S = this.cw().seen, m = S[kind] || (S[kind] = {});
      if (!m[id]) m[id] = 1;
    },

    cwBankState() {
      const S = this.cw().seen;
      const cnt = k => Object.keys(S[k] || {}).length;
      const parts = { strats: [cnt('strats'), Object.keys(CW.STRATS).length], envs: [cnt('envs'), Object.keys(CW.ENVS).length], items: [cnt('items'), Object.keys(CW.ITEMS).length], kits: [cnt('kits'), CW.POOL.length], bonds: [cnt('bonds'), Object.keys(CW.BONDS).length], opps: [cnt('opps'), Object.keys(CW.OPPONENTS).length] };
      const have = Object.values(parts).reduce((a, p) => a + Math.min(p[0], p[1]), 0), all = Object.values(parts).reduce((a, p) => a + p[1], 0);
      return { parts, pct: Math.round(100 * have / all) };
    },

    cwBankClaim(kind, i) {
      const C = this.cwPerks(), need = BANK_STEPS[kind] && BANK_STEPS[kind][i], key = kind + i;
      if (need == null || C.bank.got.includes(key) || this.cwBankState().parts[kind][0] < need) return null;
      C.bank.got.push(key);
      C.asc.pts += BANK_REW.pts;
      return [BANK_REW.pts + ' очков продвижения'].concat(this.give({ jade: BANK_REW.jade }));
    },

    cwLinkCheck(run, sum) {
      if (!sum.cleared) return [];
      const C = this.cwPerks(), tiers = {}, out = [];
      for (const b of sum.bonds || []) tiers[b.k] = b.tier;
      for (const k of LINK_BONDS) for (const t of linkTasks(k)) {
        const key = k + ':' + t.i;
        if (C.links.done.includes(key) || tiers[k] == null || tiers[k] < t.tier) continue;
        if (t.hard && (run.mode !== 'standard' || run.tier < 5)) continue;
        C.links.done.push(key);
        out.push(key);
      }
      return out;
    },

    cwLinkClaim(key) {
      const C = this.cwPerks();
      if (!C.links.done.includes(key) || C.links.got.includes(key)) return null;
      C.links.got.push(key);
      C.asc.pts += LINK_REW.pts;
      return [LINK_REW.pts + ' очков продвижения'].concat(this.give({ jade: LINK_REW.jade }));
    },

    cwRerollEnv() {
      const run = this.cwRun();
      if (!run || !run.envPick || !on(this, 'envRoll') || run.envRolled) return 'used';
      run.envRolled = true;
      run.envPick = { opts: this.cwEnvDeal(run, 3) };
      return null;
    },

    cwRerollBranches() {
      const run = this.cwRun();
      if (!run || run.phase !== 'enc' || !on(this, 'branchRoll') || run.branchRolled) return 'used';
      run.branchRolled = true;
      run.branches = this.cwBranches(run);
      return null;
    },

    cwRerollSupply() {
      const run = this.cwRun();
      if (!run || run.phase !== 'supply' || !on(this, 'supplyRoll') || run.supplyRolled) return 'used';
      run.supplyRolled = true;
      run.offer = this.cwOffer(run);
      run.offerItems = run.offer.map(() => this.cwSupplyGear(run));
      return null;
    },

    cwSupplyGear(run) {
      if (on(this, 'shiny') && CW.rnd(run) < 0.25) return CW.rnd(run) < 0.5 ? 'red' : 'blue';
      return CW.BASICS[Math.floor(CW.rnd(run) * CW.BASICS.length)];
    },

    cwClaimMore() {
      const C = this.cwPerks(), st = this.cwBankState();
      let bank = 0;
      for (const [k, steps] of Object.entries(BANK_STEPS)) steps.forEach((n, i) => { if (st.parts[k][0] >= n && !C.bank.got.includes(k + i)) bank++; });
      return { links: C.links.done.filter(k => !C.links.got.includes(k)).length, bank };
    },

    cwTechs(cw) {
      if (!on(this, 'prep')) return [];
      const out = [], seen = new Set();
      for (const p of cw.party) { const ch = H.CHARS[p.charId]; if (ch && ch.tech && ch.tech.fx && !seen.has(ch.tech.fx)) { seen.add(ch.tech.fx); out.push({ charId: p.charId, fx: ch.tech.fx }); } }
      return out;
    }
  });

  const new0 = GP.cwNew;
  GP.cwNew = function (o = {}) {
    const run = new0.call(this, o);
    for (const k of run.opps) this.cwSeenAdd('opps', k);
    for (const u of this.cwDeployed(run)) this.cwSeenAdd('kits', u.id);
    if (on(this, 'longFight')) this.cwGift(run, 'basic');
    run.perkGold = on(this, 'goldBless') && !!this.cw().lastPlane1;
    if (run.perkGold) { run.gold += 2; run.earned += 2; }
    return run;
  };

  const begin0 = GP.cwBeginNode;
  GP.cwBeginNode = function (run) {
    if (run.node === 0 && run.step > 0) {
      if (run.perkGold) { run.gold += 2; run.earned += 2; }
      if (on(this, 'expInvest') && run.plane >= 1) this.cwAddExp(run, 2);
      if (on(this, 'smith') && run.plane === 1) { this.cwInvAdd(run, 'furnace'); this.cwInvAdd(run, 'key'); }
    }
    return begin0.call(this, run);
  };

  const go0 = GP.cwGo;
  GP.cwGo = function () {
    const r = go0.call(this), run = this.cwRun();
    if (run && run.phase === 'supply' && run.offer) {
      if (on(this, 'extraSupply')) { const id = this.cwDraw(run, this.cwCostRoll(run, Math.min(TUN.maxLevel, run.lvl + 1)) || 1); if (id && !run.offer.includes(id)) { run.offer.push(id); run.offerItems.push(this.cwSupplyGear(run)); } }
      if (on(this, 'shiny')) run.offerItems = run.offer.map(() => this.cwSupplyGear(run));
    }
    return r;
  };

  const roll0 = GP.cwRollShop;
  GP.cwRollShop = function (run) { roll0.call(this, run); for (const id of run.shop) if (id) this.cwSeenAdd('kits', id); };

  const give0 = GP.cwGive;
  GP.cwGive = function (run, id) { this.cwSeenAdd('kits', id); return give0.call(this, run, id); };

  const invAdd0 = GP.cwInvAdd;
  GP.cwInvAdd = function (run, id, sp) { if (CW.ITEMS[id]) this.cwSeenAdd('items', id); return invAdd0.call(this, run, id, sp); };

  const streak0 = GP.cwStreakGold;
  GP.cwStreakGold = function (streak) {
    let v = streak0.call(this, streak);
    if (on(this, 'adaptive')) v = Math.max(1, v);
    if (on(this, 'safety') && streak >= 6) v = Math.max(4, v);
    return v;
  };

  const mods0 = GP.cwFoeMods;
  GP.cwFoeMods = function (run, kind, branch) {
    const b = on(this, 'adaptive') && kind === 'enc' ? 3 : branch;
    const m = mods0.call(this, run, kind, b);
    if (on(this, 'weaken') && kind === 'reward') m.hp *= 0.01;
    return m;
  };

  const compile0 = GP.cwCompile;
  GP.cwCompile = function (run, kind) {
    const cw = compile0.call(this, run, kind), pw = this.cwPerkPow();
    for (const k of Object.keys(cw.tiers)) this.cwSeenAdd('bonds', k);
    const apply = st => {
      if (pw.atk) st.atk = Math.round(st.atk * (1 + pw.atk));
      if (pw.def) st.def = Math.round(st.def * (1 + pw.def));
      if (pw.hp) st.hp = Math.round(st.hp * (1 + pw.hp));
      if (pw.critR) st.critR += pw.critR;
      if (pw.critD) st.critD += pw.critD;
      if (pw.breakE) st.breakE = (st.breakE || 0) + pw.breakE;
      if (pw.res) st.res = (st.res || 0) + pw.res;
    };
    for (const p of cw.party) { apply(p.stats); p.hp = p.stats.hp; }
    for (const o of cw.off) apply(o.stats);
    cw.perk = { dr: pw.dr || 0, thanks: on(this, 'thanks'), fauna: on(this, 'fauna'), recovery: on(this, 'recovery'), safety: on(this, 'safety'), adaptive: on(this, 'adaptive') };
    if (cw.perk.recovery) cw.near = Math.max(0, cw.near - 10);
    if (cw.perk.adaptive) for (const u of Object.values(cw.units)) { u.healPow += 10; u.shieldPow += 10; }
    if (cw.perk.fauna && !cw.piggy && kind !== 'boss' && kind !== 'reward') cw.piggy = { chance: 0.15, coins: 2 };
    cw.techs = this.cwTechs(cw);
    return cw;
  };

  const rewards0 = GP.cwBondRewards;
  GP.cwBondRewards = function (run, rec) {
    rewards0.call(this, run, rec);
    if (rec.kind === 'reward') return;
    if (on(this, 'baseArms') && rec.kind === 'boss' && run.plane <= 1) { this.cwGift(run, 'basic'); rec.bondLines.push('Базовое вооружение'); }
    if (on(this, 'longFight')) run.hp = Math.min(run.hpMax, run.hp + 2);
    if (on(this, 'compensate') && rec.hpLoss) { const n = Math.floor(rec.hpLoss / 10); if (n) { rec.bondGold += n; rec.coins += n; rec.bondLines.push('Служба компенсаций: +' + n); } }
    const f = run.fight || {};
    if (on(this, 'thanks') && rec.kind === 'boss' && rec.win && run.plane === CW.MODES[run.mode].planes.length - 1 && f.left != null && f.left >= 100) run.hp += 40;
  };

  const finish0 = GP.cwFinish;
  GP.cwFinish = function (run, rec) {
    if (run.hp <= 0 && on(this, 'safety') && !run.safetyUsed) { run.safetyUsed = true; run.hp = 1; rec.safety = true; }
    return finish0.call(this, run, rec);
  };

  const close0 = GP.cwClose;
  GP.cwClose = function (run, cleared) {
    const sum = close0.call(this, run, cleared);
    this.cw().lastPlane1 = run.plane >= 1 || cleared;
    sum.links = this.cwLinkCheck(run, sum);
    const h = this.cw().hist[0];
    if (h) h.links = sum.links;
    return sum;
  };

  const kitsStart0 = BP.cwKitsStart;
  BP.cwKitsStart = function () {
    kitsStart0.call(this);
    const P = this.cw.perk;
    if (!P) return;
    if (P.dr || P.fauna) for (const a of this.allies) a.buffs.push({ s: 'dr', v: (P.dr || 0) + (P.fauna ? 0.1 : 0), turns: 999, perm: true, name: 'Преимущества' });
    if (P.thanks) this.sp = Math.min(T().spMax, this.sp + 1);
  };
  const T = () => H.TUNING;

  const kitsAmp0 = BP.cwKitsAmp;
  BP.cwKitsAmp = function (w, tgt, o) {
    const r = kitsAmp0.call(this, w, tgt, o);
    return this.cw.perk && this.cw.perk.safety ? (1 + r) * 1.1 - 1 : r;
  };

  const kitsLucky0 = BP.cwKitsLucky;
  BP.cwKitsLucky = function (w) {
    const r = kitsLucky0.call(this, w);
    if (this.cw.perk && this.cw.perk.fauna) r.dmg += 0.1;
    return r;
  };

  CW.PERKS = PERKS;
  CW.PERK = PK;
  CW.BANK_STEPS = BANK_STEPS;
  CW.LINK_BONDS = LINK_BONDS;
  CW.linkTasks = linkTasks;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
