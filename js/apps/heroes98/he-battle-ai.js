(function (H) {
  'use strict';
  const BA = H.Battle;
  const U = s => H.UNITS[s.unit];
  const avg = f => (f.min + f.max) / 2;
  const worth = (s, dmg) => Math.min(dmg, BA.total(s)) / BA.hpOf(s) * U(s).cost;
  const prio = t => (U(t).shots && t.shots > 0 ? 1.3 : 1);
  const AI_MANA_WORTH = 12;
  const HOLD_ROUNDS = 3;
  const HOLD_SHOOTERS = 1.2;
  const ALARM_WORTH = 0.1;
  const RANKS_PULL = 1;
  const DRAG_WORTH = 0.6;
  const CALL_WORTH = 0.8;
  const WARD_WORTH = 0.15;
  const CRY_WORTH = 0.6;
  const GROW_WORTH = 0.05;
  const STILL_WORTH = 1.8;
  const FOG_WORTH = 0.5;
  const TEMPER_WORTH = 0.06;
  const COOL_WORTH = 0.03;
  const BURST_WORTH = 1;
  const DEEP_WORTH = 0.12;
  const MEND_WORTH = 0.6;
  const REVIVE_WORTH = 1;
  const SWITCH_WORTH = 0.3;
  const nearest = (B, s, c, r) => Math.min(...BA.alive(B).filter(t => t.side !== s.side).map(t => BA.gap(s, c, r, t)));
  const inRanks = (B, s, c, r) => {
    const own = !!(H.FACTIONS[U(s).faction] || {}).formation;
    return BA.alive(B).some(t => t !== s && t.side === s.side && !U(t).machine && (own || U(t).atkNear || U(t).guardNear) && BA.touching(s, c, r, t)) ? RANKS_PULL : 0;
  };

  const poleScore = (B, s, t, p) => {
    const crowd = BA.alive(B).filter(o => o.side !== s.side && BA.touching(s, p.c, p.r, o)).length;
    return worth(t, avg(BA.forecast(B, s, t, 'pole', { c: p.c, r: p.r }))) * prio(t) - crowd * U(s).cost * 0.05 - p.steps * 0.01;
  };
  const shotScore = (B, s, t) => {
    const at = { c: s.c, r: s.r };
    return BA.blastTargets(B, s, t).reduce((v, [n, kind]) => v + worth(n, avg(BA.forecast(B, s, n, kind, at))) * prio(n), worth(t, avg(BA.forecast(B, s, t, 'shot'))) * prio(t));
  };
  const meleeScore = (B, s, t, p) => {
    const f = BA.forecast(B, s, t, 'melee', { c: p.c, r: p.r, flown: U(s).fly ? p.steps : 0, run: p.steps });
    let loss = f.retal ? worth(s, avg(f.retal)) : 0;
    for (const h of BA.supporters(B, t)) loss += worth(s, avg(BA.forecast(B, h, s, 'support', { c: h.c, r: h.r })));
    const crowd = BA.alive(B).filter(o => o.side !== s.side && o !== t && BA.touching(s, p.c, p.r, o)).length;
    return worth(t, avg(f)) * prio(t) * (U(s).twiceStill && !p.steps ? STILL_WORTH : 1) - loss * 0.8 - crowd * U(s).cost * 0.05 - p.steps * 0.01;
  };

  const stackValue = s => s.count * U(s).cost;
  const stackWorth = t => BA.total(t) / BA.hpOf(t) * U(t).cost;
  const spellValue = (B, s, h, sp, a) => {
    const caster = s.side, foe = t => t.side !== caster;
    let list = [];
    if (a.target != null) list = [B.stacks[a.target]];
    else if (sp.aim === 'foes') list = BA.alive(B).filter(t => foe(t) && !BA.concealed(t, caster));
    else if (sp.aim === 'owns') list = BA.alive(B).filter(t => !foe(t));
    else if (sp.area) list = BA.stacksIn(B, BA.areaCells(sp.area, a.c, a.r, caster));
    const amount = pair => BA.spellAmount(B, h, sp, pair), rounds = Math.min(4, BA.spellRounds(B, h, sp));
    let v = 0;
    if (sp.strikes) {
      const pool = BA.alive(B).filter(t => foe(t) && !BA.concealed(t, caster));
      for (const t of pool) v += worth(t, BA.spellDamage(B, h, sp, t, amount(sp.dmg))) * sp.strikes / Math.max(1, pool.length);
    }
    if (sp.summon) v += Math.max(1, Math.round(amount(sp.count))) * H.UNITS[sp.summon].cost * 0.4;
    if (sp.stop) v += BA.alive(B).filter(foe).reduce((t, x) => t + stackWorth(x), 0) * 0.12;
    for (const t of list) {
      if (BA.resists(t, sp)) continue;
      const sign = foe(t) ? 1 : -1, w = stackWorth(t);
      if (sp.dmg && !sp.strikes) v += sign * worth(t, BA.spellDamage(B, h, sp, t, amount(sp.dmg)));
      if (sp.heal && !foe(t)) v += worth(t, Math.min(t.start * BA.hpOf(t) - BA.total(t), amount(sp.heal)));
      if (sp.raise && !foe(t)) v += worth(t, Math.min(t.start * BA.hpOf(t) - BA.total(t), amount(sp.raise))) * 0.8;
      if (t.fx.some(e => e.spell === sp.id)) continue;
      if (sp.poison) v += sign * worth(t, amount(sp.poison) * rounds) * 0.7;
      if (sp.fx) v += w * (sp.control ? 0.16 : 0.07) * (sp.rounds === 99 ? 1 : Math.min(1.5, rounds / 2));
      if (sp.ready) v += w * Math.abs(sp.ready) / 100 * 0.4;
      if (sp.flee) v += w * 0.1;
      if (sp.clone) v += w * sp.clone * 0.3;
    }
    return v;
  };
  const realValue = (B, side) => BA.alive(B).filter(t => t.side === side && !U(t).machine && !t.summoned).reduce((v, t) => v + stackValue(t), 0);
  const chooseRetreat = (B, s) => {
    const side = B.sides[s.side], T = H.MACHINE;
    if (!side.aiFlees || B.round < T.fleeRound) return null;
    const mine = realValue(B, s.side);
    if (mine * T.fleeRatio > realValue(B, 1 - s.side)) return null;
    if (BA.canRetreat(B, s.side, 'ransom') && side.gold > BA.ransomPrice(B, s.side) * 3) return { type: 'ransom' };
    return BA.canRetreat(B, s.side, 'flee') ? { type: 'flee' } : null;
  };

  const chooseMachine = (B, s) => {
    const u = U(s);
    if (u.machine === 'ballista') {
      const list = BA.targets(B, s.side).filter(t => !BA.veiled(B, t));
      let best = null;
      for (const t of list) {
        const v = worth(t, avg(BA.forecast(B, s, t, 'shot', { c: s.c, r: s.r }))) * prio(t);
        if (!best || v > best.v) best = { v, t };
      }
      return best && BA.canShoot(B, s) ? { type: 'shoot', target: best.t.id } : { type: 'defend' };
    }
    if (u.machine === 'tent') {
      const t = BA.tendList(B, s).sort((a, b) => (BA.hpOf(b) - b.hp) * U(b).cost / BA.hpOf(b) - (BA.hpOf(a) - a.hp) * U(a).cost / BA.hpOf(a))[0];
      return t ? { type: 'tend', target: t.id } : { type: 'defend' };
    }
    if (u.machine === 'catapult' && B.siege) {
      const own = BA.alive(B).filter(t => t.side === s.side && !U(t).machine).sort((a, b) => stackValue(b) - stackValue(a))[0], row = own ? own.r : 5;
      const live = B.siege.pieces.map((p, i) => ({ p, i })).filter(q => q.p.hp > 0);
      if (!live.length) return { type: 'defend' };
      const near = q => Math.min(...q.p.rows.map(r => Math.abs(r - row)));
      return { type: 'hurl', piece: live.sort((a, b) => a.p.hp - b.p.hp || near(a) - near(b))[0].i };
    }
    return { type: 'defend' };
  };

  const chooseSpell = B => {
    const s = B.stacks[B.active], h = B.sides[s.side].hero;
    if (!h || !h.spells || !h.spells.length) return null;
    let best = null;
    for (const id of h.spells) {
      const sp = H.SPELLS[id];
      if (sp.aim === 'road' || sp.push || sp.swap || sp.bush || sp.wall || sp.zone || sp.dispel || sp.rewind || sp.order || BA.castBlock(B, id)) continue;
      const opts = sp.area ? BA.castOptions(B, id).filter(a => BA.stacksIn(B, BA.areaCells(sp.area, a.c, a.r, s.side)).some(t => t.side !== s.side)) : BA.castOptions(B, id);
      for (const a of opts) {
        const v = spellValue(B, s, h, sp, a) / BA.spellCost(B, h, sp);
        if (!best || v > best.v) best = { v, a };
      }
    }
    return best && best.v >= AI_MANA_WORTH ? best.a : null;
  };

  const shootersWorth = (B, side) => BA.alive(B).filter(t => t.side === side && U(t).shots && t.shots > 0 && !U(t).machine).reduce((v, t) => v + stackValue(t), 0);
  const holdBack = (B, s, rc, foes) => {
    if (B.round > HOLD_ROUNDS || U(s).shots || shootersWorth(B, 1 - s.side) > shootersWorth(B, s.side) * HOLD_SHOOTERS) return null;
    const hitters = foes.filter(t => !U(t).machine && !(U(t).shots && t.shots > 0));
    const danger = (c, r) => hitters.some(t => BA.gap(s, c, r, t) <= U(t).speed + (t.speedPlus || 0) + 1);
    if (!hitters.length || danger(s.c, s.r)) return null;
    let best = null;
    for (const p of rc.values()) {
      if (!p.steps || danger(p.c, p.r)) continue;
      const d = nearest(B, s, p.c, p.r) - inRanks(B, s, p.c, p.r);
      if (!best || d < best.d) best = { d, c: p.c, r: p.r };
    }
    if (best && best.d < nearest(B, s, s.c, s.r) - inRanks(B, s, s.c, s.r)) return { type: 'move', c: best.c, r: best.r };
    return s.waited ? { type: 'defend' } : { type: 'wait' };
  };

  const choose = B => {
    BA.plantAll(B);
    BA.mirrorAll(B);
    const s = B.stacks[B.active], u = U(s), foes = BA.targets(B, s.side), rc = BA.reach(B, s);
    const leave = chooseRetreat(B, s);
    if (leave) return leave;
    const spell = chooseSpell(B);
    if (spell) return spell;
    if (BA.canOrder(B, 'high')) return { type: 'order', order: 'high' };
    if (BA.canOrder(B, 'flood')) {
      let top = null;
      for (const t of foes) {
        const n = BA.stacksIn(B, BA.floodCells(t.c, t.r)).filter(x => x.side !== s.side).reduce((v, x) => v + stackWorth(x), 0);
        if (!top || n > top.n) top = { n, c: t.c, r: t.r };
      }
      if (top) return { type: 'order', order: 'flood', c: top.c, r: top.r };
    }
    if (BA.canOrder(B, 'warcry')) {
      const pick = BA.alive(B).filter(t => t.side === s.side && t !== s && !U(t).machine).sort((a, b) => b.count * U(b).cost - a.count * U(a).cost)[0];
      if (pick) return { type: 'order', order: 'warcry', target: pick.id };
    }
    if (u.machine) return chooseMachine(B, s);
    if (BA.canCharm(s) && foes.length) {
      const spell = u.spellOnce ? H.SPELLS[u.spellOnce] : null, fit = foes.filter(t => !U(t).spellproof && !(spell && BA.resists(t, spell))), t = fit.length ? fit.reduce((a, b) => (stackWorth(b) > stackWorth(a) ? b : a)) : null;
      if (t) return { type: 'charm', target: t.id };
    }
    let best = null;
    const take = (score, action) => { if (!best || score > best.score) best = { score, action }; };
    const shooting = BA.canShoot(B, s);
    if (shooting) for (const t of foes) if (BA.sees(B, s, t)) take(shotScore(B, s, t), { type: 'shoot', target: t.id });
    const healWorth = (t, n) => Math.min(t.start * BA.hpOf(t) - BA.total(t), n) / BA.hpOf(t) * U(t).cost;
    if (BA.canMend(s)) for (const t of BA.mendList(B, s)) take(healWorth(t, s.count * BA.hpOf(s) * u.mend.share) * MEND_WORTH, { type: 'mend', target: t.id });
    if (BA.canRevive(s)) for (const t of BA.reviveList(B, s)) take(healWorth(t, s.count * u.revive) * REVIVE_WORTH, { type: 'revive', target: t.id });
    if (BA.canSwitch(s) && !BA.enemyNear(B, s, s.c, s.r)) for (const t of BA.switchList(B, s)) if (U(t).shots && t.shots > 0 && BA.enemyNear(B, t, t.c, t.r)) take(stackWorth(t) * SWITCH_WORTH, { type: 'switch', target: t.id });
    if (BA.canAlarm(s)) take(BA.alive(B).filter(t => t.side === s.side && t !== s && !U(t).machine).reduce((v, t) => v + stackValue(t), 0) * u.alarm / H.BATTLE.full * ALARM_WORTH * (B.round <= 2 ? 1 : 0.5), { type: 'alarm' });
    if (BA.canCall(s)) for (const t of BA.callList(B, s)) take((t.start - t.count) * U(t).cost * u.kinCall * CALL_WORTH, { type: 'call', target: t.id });
    if (BA.canDrag(B, s)) for (const t of foes) if (BA.inDrag(B, s, t)) take(stackWorth(t) * (u.drag.ready || 10) / H.BATTLE.full * DRAG_WORTH * (U(t).shots && t.shots > 0 ? 2 : 1), { type: 'lasso', target: t.id });
    if (BA.canWard(s)) {
      for (const t of BA.wardList(B, s)) {
        if (t.fx.some(e => e.trait === 'Оберег') || !foes.some(f => BA.gap(t, t.c, t.r, f) <= U(f).speed + 1 || (U(f).shots && f.shots > 0))) continue;
        take(stackWorth(t) * u.ward.share * WARD_WORTH, { type: 'ward', target: t.id });
      }
    }
    if (H.FACTIONS[u.faction] && H.FACTIONS[u.faction].heat && (s.heat || 0) >= BA.heatCap(B, s) && !BA.fxHas(s, 'noOverheat')) take(stackWorth(s) * COOL_WORTH, { type: 'defend' });
    if (BA.canTemper(s)) for (const t of BA.temperList(B, s)) take(stackWorth(t) * TEMPER_WORTH * (BA.enemyNear(B, t, t.c, t.r) ? 1.5 : 1), { type: 'temper', target: t.id });
    if (BA.canBurst(B, s)) {
      const at = { c: s.c, r: s.r }, gain = BA.burstList(B, s).reduce((v, t) => v + (t.side !== s.side ? 1 : -1) * worth(t, avg(BA.forecast(B, s, t, 'burst', at))), 0) - stackWorth(s);
      if (gain > 0) take(gain * BURST_WORTH, { type: 'burst' });
    }
    if (BA.canFog(s)) take(Math.min(shootersWorth(B, 1 - s.side), BA.alive(B).filter(t => t.side === s.side && BA.gap(s, s.c, s.r, t) <= u.fog.range).reduce((v, t) => v + stackWorth(t), 0)) * u.fog.share * FOG_WORTH, { type: 'fog' });
    if (BA.canDeep(s) && !BA.enemyNear(B, s, s.c, s.r)) {
      for (const t of foes) {
        if (!U(t).shots || !t.shots) continue;
        const p = BA.cells(t).flatMap(q => H.Hex.near(q[0], q[1])).find(q => BA.deepOkay(B, s, q[0], q[1]));
        if (p) take(stackWorth(t) * DEEP_WORTH, { type: 'deep', c: p[0], r: p[1] });
      }
    }
    if (BA.canCry(s)) for (const t of BA.cryList(B, s)) take(stackWorth(t) * u.cry.ready / H.BATTLE.full * CRY_WORTH, { type: 'cry', target: t.id });
    if (BA.canGrow(s)) {
      const cell = BA.cells(s).flatMap(p => H.Hex.near(p[0], p[1])).find(p => BA.growOkay(B, s, p[0], p[1]));
      if (cell) take(stackValue(s) * GROW_WORTH, { type: 'grow', c: cell[0], r: cell[1] });
    }
    if (BA.canVolley(B, s)) for (const t of foes) if (BA.inVolley(B, s, t)) take(worth(t, avg(BA.forecast(B, s, t, 'volley'))) * prio(t) * 1.15, { type: 'volley', target: t.id });
    if (u.bell && !BA.enemyNear(B, s, s.c, s.r)) {
      for (const t of foes) if (BA.gap(s, s.c, s.r, t) <= u.bell.range) take(worth(t, avg(BA.forecast(B, s, t, 'bell'))) * prio(t) * 1.1, { type: 'bell', target: t.id });
    }
    if (u.saddle && s.shots > 0 && !shooting) {
      for (const p of rc.values()) {
        if (!p.steps || (u.saddleSteps && p.steps > u.saddleSteps) || BA.enemyNear(B, s, p.c, p.r)) continue;
        const ctx = { c: p.c, r: p.r }, room = nearest(B, s, p.c, p.r);
        for (const t of foes) if (!BA.veiled(B, t) && !(B.sides[s.side].noShoot >= B.round)) take(worth(t, avg(BA.forecast(B, s, t, 'saddle', ctx))) * prio(t) + room * 0.5, { type: 'saddle', c: p.c, r: p.r, target: t.id });
      }
    }
    if (!shooting) {
      for (const t of foes) for (const p of BA.spots(B, s, t, rc)) take(meleeScore(B, s, t, p), { type: 'attack', target: t.id, c: p.c, r: p.r });
      for (const t of foes) for (const p of BA.poleSpots(B, s, t, rc)) take(poleScore(B, s, t, p), { type: 'attack', target: t.id, c: p.c, r: p.r });
    }
    if (best) return best.action;
    if (B.siege && s.side === 1 && !u.fly && B.round <= H.SIEGE.hold) return { type: 'defend' };
    const hold = B.siege ? null : holdBack(B, s, rc, foes);
    if (hold) return hold;
    const walk = (B.siege || B.deck) && !u.fly ? BA.walkField(B, s) : null, far = 9999;
    const away = (c, r) => {
      if (!walk) return nearest(B, s, c, r);
      const w = walk[H.Hex.idx(c, r)];
      return w >= 0 ? w : far + nearest(B, s, c, r);
    };
    let step = null;
    for (const p of rc.values()) {
      if (!p.steps) continue;
      const d = away(p.c, p.r) - inRanks(B, s, p.c, p.r);
      if (!step || d < step.d || (d === step.d && p.steps < step.steps)) step = { d, steps: p.steps, c: p.c, r: p.r };
    }
    return step && step.d < away(s.c, s.r) - inRanks(B, s, s.c, s.r) ? { type: 'move', c: step.c, r: step.r } : { type: 'defend' };
  };

  const play = (B, maxRounds) => {
    const cap = maxRounds || 100;
    while (B.winner < 0 && B.round <= cap) BA.act(B, choose(B));
    return B.winner;
  };

  const QUICK = { rounds: 40, meet: 6, across: 12, farShots: 0.75, farTicks: 20, helpers: 2, helpShare: 0.6, blastHit: 0.5 };

  const quickCast = (B, side, list) => {
    const h = B.sides[side].hero;
    if (!h || !h.spells || !h.spells.length) return;
    let best = null;
    for (const id of h.spells) {
      const sp = H.SPELLS[id];
      if (!sp.dmg || sp.school === 'road' || h.mana < BA.spellCost(B, h, sp)) continue;
      const raw = BA.spellAmount(B, h, sp, sp.dmg) * (sp.strikes || 1) * (sp.area ? 1.5 : 1);
      if (!best || raw > best.raw) best = { sp, raw };
    }
    if (!best) return;
    const t = list.reduce((a, b) => (stackValue(b) > stackValue(a) ? b : a));
    if (BA.resists(t, best.sp)) return;
    h.mana -= BA.spellCost(B, h, best.sp);
    BA.hurt(t, BA.spellDamage(B, h, best.sp, t, best.raw));
  };

  const quickStrike = (B, s, foes, tick) => {
    const shoot = s.shots > 0;
    let pick = null;
    for (const t of foes) {
      const f = BA.forecast(B, s, t, shoot ? 'shot' : 'melee', { c: s.c, r: s.r, flown: 0, run: s.ran ? 0 : U(s).speed }), dmg = avg(f) * (shoot && tick < 0 ? H.SIEGE.throughWall : shoot && tick < QUICK.farTicks ? QUICK.farShots : 1), v = worth(t, dmg) * prio(t);
      if (!pick || v > pick.v) pick = { v, t, dmg };
    }
    const t = pick.t, blast = shoot ? U(s).splash || (U(s).line ? U(s).line.share : 0) : 0, other = blast ? foes.find(x => x !== t && x.count > 0) : null;
    if (shoot) s.shots--;
    s.ran = true;
    BA.hurt(t, Math.max(1, Math.floor(pick.dmg)));
    if (other) BA.hurt(other, Math.max(1, Math.floor(pick.dmg * blast * QUICK.blastHit)));
    if (!shoot && (H.FACTIONS[U(t).faction] || {}).formation) {
      const helpers = BA.alive(B).filter(x => x !== t && x.side === t.side && !x.supported && (H.FACTIONS[U(x).faction] || {}).formation).slice(0, QUICK.helpers);
      for (const x of helpers) {
        if (s.count <= 0) break;
        x.supported = true;
        BA.hurt(s, Math.max(1, Math.floor(avg(BA.forecast(B, x, s, 'support', { c: x.c, r: x.r })) * QUICK.helpShare)));
      }
    }
    if (!shoot && !U(s).pole && !U(s).elusive && s.count > 0 && t.count > 0 && !t.retaliated) {
      t.retaliated = true;
      BA.hurt(s, Math.max(1, Math.floor(avg(BA.forecast(B, t, s, 'retal', { c: t.c, r: t.r })))));
    }
  };

  const quickWalls = siege => {
    if (!siege) return 0;
    const T = H.SIEGE;
    return Math.ceil(Math.min(T.wall[siege.fort], T.gate[siege.fort]));
  };

  const estimate = (sides, moon, siege) => {
    const placed = sides.map((sd, side) => Object.assign({}, sd, { stacks: sd.stacks.map((x, i) => Object.assign({}, x, { c: side ? 8 : 3, r: i % H.BATTLE.rows })) })), n = placed[0].stacks.length + placed[1].stacks.length;
    const B = BA.create({ seed: 1, moon: moon || null, obstacles: [], ready: new Array(n).fill(0), sides: placed });
    const start = [0, 1].map(side => B.stacks.filter(s => s.side === side && !s.summoned).reduce((t, s) => t + stackValue(s), 0));
    const list = side => B.stacks.filter(s => s.side === side && s.count > 0);
    const melee = side => list(side).some(s => !U(s).shots);
    const breach = quickWalls(siege);
    for (const s of B.stacks) {
      s.ready = 0;
      s.trip = U(s).shots ? 0 : Math.max(0, Math.ceil((melee(1 - s.side) ? QUICK.meet : QUICK.across) / U(s).speed) - 1);
      if (breach && !U(s).fly) s.trip += s.side === 0 ? breach : breach + 1;
    }
    let tick = 0, round = 1;
    while (round <= QUICK.rounds && list(0).length && list(1).length) {
      tick++;
      for (const s of list(0).concat(list(1))) s.ready += BA.initOf(s);
      if (tick % H.BATTLE.roundTicks === 0) {
        round++;
        for (const s of B.stacks) {
          s.retaliated = false;
          s.supported = false;
        }
        for (const side of [0, 1]) if (list(1 - side).length) quickCast(B, side, list(1 - side));
        for (let i = 0; siege && i < H.SIEGE.towers[siege.fort] && list(0).length; i++) BA.hurt(list(0).reduce((a, b) => (stackValue(b) > stackValue(a) ? b : a)), siege.dmg);
      }
      const due = list(0).concat(list(1)).filter(s => s.ready >= H.BATTLE.full).sort((a, b) => b.ready - a.ready || BA.initOf(b) - BA.initOf(a) || a.id - b.id);
      for (const s of due) {
        if (s.count <= 0) continue;
        s.ready = 0;
        if (s.trip > 0) {
          s.trip--;
          continue;
        }
        const foes = list(1 - s.side);
        if (!foes.length) break;
        quickStrike(B, s, foes, breach && s.side === 0 && round <= breach ? -1 : tick);
      }
    }
    const left = [0, 1].map(side => list(side).filter(s => !s.summoned).reduce((t, s) => t + stackValue(s), 0));
    const share = [0, 1].map(side => (start[side] ? left[side] / start[side] : 0));
    return { win: share[0] > 0 && (share[1] === 0 || share[0] >= share[1]), lost: share.map(v => 1 - v), value: [start[0] - left[0], start[1] - left[1]], rounds: round };
  };

  H.BattleAI = { choose, play, worth, estimate };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
