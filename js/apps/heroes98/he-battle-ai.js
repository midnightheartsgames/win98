(function (H) {
  'use strict';
  const BA = H.Battle;
  const U = s => H.UNITS[s.unit];
  const avg = f => (f.min + f.max) / 2;
  const worth = (s, dmg) => Math.min(dmg, BA.total(s)) / BA.hpOf(s) * U(s).cost;
  const prio = t => (U(t).shots && t.shots > 0 ? 1.3 : 1);
  const AI_MANA_WORTH = 12;
  const nearest = (B, s, c, r) => Math.min(...BA.alive(B).filter(t => t.side !== s.side).map(t => BA.gap(s, c, r, t)));

  const meleeScore = (B, s, t, p) => {
    const f = BA.forecast(B, s, t, 'melee', { c: p.c, r: p.r, flown: U(s).fly ? p.steps : 0 });
    let loss = f.retal ? worth(s, avg(f.retal)) : 0;
    for (const h of BA.supporters(B, t)) loss += worth(s, avg(BA.forecast(B, h, s, 'support', { c: h.c, r: h.r })));
    const crowd = BA.alive(B).filter(o => o.side !== s.side && o !== t && BA.touching(s, p.c, p.r, o)).length;
    return worth(t, avg(f)) * prio(t) - loss * 0.8 - crowd * U(s).cost * 0.05 - p.steps * 0.01;
  };

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

  const choose = B => {
    const s = B.stacks[B.active], u = U(s), foes = BA.alive(B).filter(t => t.side !== s.side), rc = BA.reach(B, s);
    const spell = chooseSpell(B);
    if (spell) return spell;
    if (BA.canOrder(B, 'high')) return { type: 'order', order: 'high' };
    if (BA.canOrder(B, 'warcry')) {
      const pick = BA.alive(B).filter(t => t.side === s.side && t !== s).sort((a, b) => b.count * U(b).cost - a.count * U(a).cost)[0];
      return { type: 'order', order: 'warcry', target: pick.id };
    }
    let best = null;
    const take = (score, action) => { if (!best || score > best.score) best = { score, action }; };
    const shooting = BA.canShoot(B, s);
    if (shooting) for (const t of foes) if (!BA.fxHas(t, 'hidden')) take(worth(t, avg(BA.forecast(B, s, t, 'shot'))) * prio(t), { type: 'shoot', target: t.id });
    if (u.bell && !BA.enemyNear(B, s, s.c, s.r)) {
      for (const t of foes) if (BA.gap(s, s.c, s.r, t) <= u.bell.range) take(worth(t, avg(BA.forecast(B, s, t, 'bell'))) * prio(t) * 1.1, { type: 'bell', target: t.id });
    }
    if (u.saddle && s.shots > 0 && !shooting) {
      for (const p of rc.values()) {
        if (!p.steps || BA.enemyNear(B, s, p.c, p.r)) continue;
        const ctx = { c: p.c, r: p.r }, room = nearest(B, s, p.c, p.r);
        for (const t of foes) if (!BA.fxHas(t, 'hidden') && !(B.sides[s.side].noShoot >= B.round)) take(worth(t, avg(BA.forecast(B, s, t, 'saddle', ctx))) * prio(t) + room * 0.5, { type: 'saddle', c: p.c, r: p.r, target: t.id });
      }
    }
    if (!shooting) {
      for (const t of foes) for (const p of BA.spots(B, s, t, rc)) take(meleeScore(B, s, t, p), { type: 'attack', target: t.id, c: p.c, r: p.r });
    }
    if (best) return best.action;
    let step = null;
    for (const p of rc.values()) {
      if (!p.steps) continue;
      const d = nearest(B, s, p.c, p.r);
      if (!step || d < step.d || (d === step.d && p.steps < step.steps)) step = { d, steps: p.steps, c: p.c, r: p.r };
    }
    return step && step.d < nearest(B, s, s.c, s.r) ? { type: 'move', c: step.c, r: step.r } : { type: 'defend' };
  };

  const play = (B, maxRounds) => {
    const cap = maxRounds || 100;
    while (B.winner < 0 && B.round <= cap) BA.act(B, choose(B));
    return B.winner;
  };

  const QUICK = { rounds: 40, meet: 6, across: 12, farShots: 0.75, farTicks: 20, helpers: 2, helpShare: 0.6 };

  const stackValue = s => s.count * U(s).cost;
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
      const f = BA.forecast(B, s, t, shoot ? 'shot' : 'melee', { c: s.c, r: s.r, flown: 0 }), dmg = avg(f) * (shoot && tick < QUICK.farTicks ? QUICK.farShots : 1), v = worth(t, dmg) * prio(t);
      if (!pick || v > pick.v) pick = { v, t, dmg };
    }
    const t = pick.t;
    if (shoot) s.shots--;
    BA.hurt(t, Math.max(1, Math.floor(pick.dmg)));
    if (!shoot && (H.FACTIONS[U(t).faction] || {}).formation) {
      const helpers = BA.alive(B).filter(x => x !== t && x.side === t.side && !x.supported && (H.FACTIONS[U(x).faction] || {}).formation).slice(0, QUICK.helpers);
      for (const x of helpers) {
        if (s.count <= 0) break;
        x.supported = true;
        BA.hurt(s, Math.max(1, Math.floor(avg(BA.forecast(B, x, s, 'support', { c: x.c, r: x.r })) * QUICK.helpShare)));
      }
    }
    if (!shoot && s.count > 0 && t.count > 0 && !t.retaliated) {
      t.retaliated = true;
      BA.hurt(s, Math.max(1, Math.floor(avg(BA.forecast(B, t, s, 'retal', { c: t.c, r: t.r })))));
    }
  };

  const estimate = (sides, moon) => {
    const placed = sides.map((sd, side) => Object.assign({}, sd, { stacks: sd.stacks.map((x, i) => Object.assign({}, x, { c: side ? 8 : 3, r: i })) })), n = placed[0].stacks.length + placed[1].stacks.length;
    const B = BA.create({ seed: 1, moon: moon || null, obstacles: [], ready: new Array(n).fill(0), sides: placed });
    const start = [0, 1].map(side => B.stacks.filter(s => s.side === side).reduce((t, s) => t + stackValue(s), 0));
    const list = side => B.stacks.filter(s => s.side === side && s.count > 0);
    const melee = side => list(side).some(s => !U(s).shots);
    for (const s of B.stacks) {
      s.ready = 0;
      s.trip = U(s).shots ? 0 : Math.max(0, Math.ceil((melee(1 - s.side) ? QUICK.meet : QUICK.across) / U(s).speed) - 1);
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
        quickStrike(B, s, foes, tick);
      }
    }
    const left = [0, 1].map(side => list(side).reduce((t, s) => t + stackValue(s), 0));
    const share = [0, 1].map(side => (start[side] ? left[side] / start[side] : 0));
    return { win: share[0] > 0 && (share[1] === 0 || share[0] >= share[1]), lost: share.map(v => 1 - v), value: [start[0] - left[0], start[1] - left[1]], rounds: round };
  };

  H.BattleAI = { choose, play, worth, estimate };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
