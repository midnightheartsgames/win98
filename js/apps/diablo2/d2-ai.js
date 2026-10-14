(function (D) {
  'use strict';

  const AGGRO = 11;

  function alive(e) { return e && !e.dead; }

  function pickTarget(g, m) {
    let best = null, bd = m.boss ? 14 : AGGRO;
    for (const e of g.ents) {
      if (e.dead || e.team !== 0 || e.untargetable) continue;
      let d = Math.hypot(e.x - m.x, e.y - m.y);
      if (e.unit === 'decoy') d -= 6;
      if (d < bd && D.losLine(g.area, m.x, m.y, e.x, e.y)) { bd = d; best = e; }
    }
    return best;
  }

  function alertPack(g, m, t) {
    if (!m.pack && !m.packId) return;
    const pid = m.pack || m.packId;
    for (const o of g.ents) {
      if (o.dead || o.kind !== 'mon' || o === m) continue;
      if ((o.pack === pid || o.id === pid || o.packId === pid) && o.ai.st === 'idle') { o.ai.st = 'hunt'; o.ai.target = t; }
    }
  }

  function provoke(g, m, src) {
    if (!src || m.dead || m.kind !== 'mon') return;
    const t = src.kind === 'ghost' ? g.hero : src;
    if (t.team === m.team) return;
    if (m.ai.st === 'idle' || !alive(m.ai.target)) { m.ai.target = t; m.ai.st = 'hunt'; alertPack(g, m, t); }
  }

  function moveTo(g, e, x, y, dt) {
    e.ai.repath = (e.ai.repath || 0) - dt;
    if (D.walkLine(g.area, e.x, e.y, x, y, e.r * 0.7)) { e.path = [{ x, y }]; return; }
    if (e.ai.repath > 0 && e.path) return;
    e.ai.repath = 0.6 + g.rng.next() * 0.5;
    if (!g.pathTo(e, x, y, 1600)) e.path = null;
  }

  function flee(g, e, from, dt) {
    const a = Math.atan2(e.y - from.y, e.x - from.x) + g.rng.range(-0.5, 0.5);
    const tx = e.x + Math.cos(a) * 3, ty = e.y + Math.sin(a) * 3;
    if (D.walkable(g.area, Math.floor(tx), Math.floor(ty))) e.path = [{ x: tx, y: ty }];
    else moveTo(g, e, e.ai.home.x, e.ai.home.y, dt);
  }

  function meleeAct(g, e, t) {
    g.startAct(e, {
      anim: 'attack', dur: e.atk, fireAt: e.mon ? e.mon.hitAt : 0.5, target: t, x: t.x, y: t.y,
      run: () => {
        g.sfx(e.kind === 'mon' ? 'mswing' : 'swing', e.x, e.y);
        const hit = g.meleeHit(e, t, { reach: (e.range || 1.1) + 0.3 });
        if (hit && e.slows) { t.fx.chill = Math.max(t.fx.chill || 0, 2); t.fx.chillPct = 0.35; }
        if (hit && e.unit === 'bloodgolem') { const heal = (e.dmg[0] + e.dmg[1]) * 0.25; e.hp = Math.min(e.hpMax, e.hp + heal); g.hero.hp = Math.min(g.hero.hpMax, g.hero.hp + heal * 0.3); }
      }
    });
    e.ai.cd = g.time + (e.kind === 'mon' ? 0.35 + g.rng.next() * 0.6 : 0.1 + g.rng.next() * 0.25);
  }

  function rangedAct(g, e, t, fn, anim) {
    g.startAct(e, { anim: anim || 'attack', dur: e.atk, fireAt: e.mon ? e.mon.hitAt : 0.55, target: t, x: t.x, y: t.y, run: () => fn(g, e, t) });
    e.ai.cd = g.time + 0.4 + g.rng.next() * 0.9;
  }

  function monster(g, m, dt) {
    const ai = m.ai;
    if (m.fx.fear > 0) { flee(g, m, g.hero, dt); return; }
    if (ai.st === 'idle') {
      ai.t -= dt;
      const t = pickTarget(g, m);
      if (t) { ai.st = 'hunt'; ai.target = t; alertPack(g, m, t); if (m.boss) g.sfx('boss_alert_' + m.type, m.x, m.y); return; }
      if (ai.t <= 0) {
        ai.t = 3 + g.rng.next() * 5;
        if (!m.boss && g.rng.next() < 0.6) {
          const tx = ai.home.x + g.rng.range(-2.5, 2.5), ty = ai.home.y + g.rng.range(-2.5, 2.5);
          if (D.walkLine(g.area, m.x, m.y, tx, ty, 0.2)) m.path = [{ x: tx, y: ty }];
        }
      }
      return;
    }
    let t = ai.target;
    if (!alive(t) || Math.hypot(t.x - m.x, t.y - m.y) > 26) {
      t = pickTarget(g, m);
      ai.target = t;
      if (!t) { ai.st = 'idle'; ai.t = 1; moveTo(g, m, ai.home.x, ai.home.y, dt); return; }
    }
    if (t.unit !== 'decoy') {
      const dec = g.ents.find(e => e.unit === 'decoy' && !e.dead && Math.hypot(e.x - m.x, e.y - m.y) < 9);
      if (dec) { t = dec; ai.target = dec; }
    }
    const d = Math.hypot(t.x - m.x, t.y - m.y) - t.r - m.r;
    const kind = m.mon.ai;
    if (g.time < ai.cd) { if (kind !== 'melee' && kind !== 'fallen') return; }
    ai.special -= dt;
    if (kind === 'shaman' && ai.special <= 0) {
      ai.special = 4 + g.rng.next() * 3;
      const c = g.ents.find(e => e.dead && e.type === 'fallen' && !e.noCorpse && Math.hypot(e.x - m.x, e.y - m.y) < 8);
      if (c) {
        g.startAct(m, { anim: 'cast', dur: 0.9, fireAt: 0.7, x: c.x, y: c.y, run: () => revive(g, c) });
        return;
      }
    }
    if (m.type === 'andariel') {
      if (ai.special <= 0 && d < 9) {
        ai.special = 5 + g.rng.next() * 2.5;
        rangedAct(g, m, t, D.Skills.andarielSpray, 'cast');
        return;
      }
      if (m.hp < m.hpMax * 0.5 && (ai.nova || 0) < g.time) {
        ai.nova = g.time + 9;
        g.startAct(m, { anim: 'cast', dur: 0.9, fireAt: 0.6, run: () => D.Skills.nova(g, m, 'poison', [m.dmg[1] * 1.5, m.dmg[1] * 2.5], 1, 0) });
        return;
      }
    }
    if (m.type === 'countess' && m.hp < m.hpMax * 0.5 && (ai.nova || 0) < g.time && d < 5) {
      ai.nova = g.time + 7;
      g.startAct(m, { anim: 'cast', dur: 0.8, fireAt: 0.6, run: () => D.Skills.nova(g, m, 'fire', [m.dmg[0], m.dmg[1] * 1.3], 1, 0) });
      return;
    }
    if (kind === 'raven' && ai.special <= 0) {
      ai.special = 11 + g.rng.next() * 4;
      const mine = g.ents.filter(e => !e.dead && e.raisedBy === m.id).length;
      if (mine < 6) {
        g.startAct(m, {
          anim: 'cast', dur: 1.0, fireAt: 0.7, run: () => {
            for (let k = 0; k < 2; k++) {
              const p = g.freeSpot(g.area, m.x, m.y, 3);
              if (!p) continue;
              const z = g.makeMonster('zombie', m.lvl - 1, { x: p.x, y: p.y, minion: true });
              z.raisedBy = m.id; z.ai.st = 'hunt'; z.ai.target = t; z.anim = { n: 'appear', t: 0, dur: 0.8 };
              g.area.ents.push(z);
              g.vfx.push({ k: 'summon', el: 'shadow', x: p.x, y: p.y, z: 0, t: 0, dur: 0.7 });
            }
            g.sfx('raise', m.x, m.y);
          }
        });
        return;
      }
    }
    if (kind === 'melee' || kind === 'fallen' || kind === 'ghost' || kind === 'andariel') {
      if (d <= m.range) { if (g.time >= ai.cd) meleeAct(g, m, t); else m.path = null; return; }
      moveTo(g, m, t.x, t.y, dt);
      return;
    }
    if (kind === 'flyer') {
      ai.fly = (ai.fly || g.rng.next() * 10) + dt;
      if (d <= m.range && g.time >= ai.cd) { meleeAct(g, m, t); ai.cd = g.time + 0.8 + g.rng.next(); return; }
      const off = g.time < ai.cd ? 2.5 : 0.6;
      const tx = t.x + Math.cos(ai.fly * 2.3 + m.id) * off, ty = t.y + Math.sin(ai.fly * 1.7 + m.id) * off;
      m.path = [{ x: tx, y: ty }];
      return;
    }
    const range = m.range;
    const los = D.losLine(g.area, m.x, m.y, t.x, t.y);
    if (d < 2.2 && g.rng.next() < 0.03 * 30 * dt && kind !== 'countess') { flee(g, m, t, dt); return; }
    if (d <= range && los) {
      if (g.time >= ai.cd) rangedAct(g, m, t, D.Skills.monShoot, kind === 'ranged' || kind === 'raven' ? 'shoot' : 'cast');
      else m.path = null;
      return;
    }
    moveTo(g, m, t.x, t.y, dt);
  }

  function revive(g, c) {
    if (!c.dead || c.noCorpse) return;
    c.dead = false;
    c.hp = c.hpMax;
    c.deathT = 0;
    c.anim = { n: 'appear', t: 0, dur: 0.6 };
    c.fx = { buffs: {} };
    c.ai.st = 'hunt';
    c.ai.target = g.hero;
    g.vfx.push({ k: 'summon', el: 'fire', x: c.x, y: c.y, z: 0, t: 0, dur: 0.6 });
    g.sfx('revive', c.x, c.y);
  }

  function petTarget(g, p) {
    const h = g.hero;
    if (h.order && h.order.target && !h.order.target.dead && h.order.target.team === 1 && Math.hypot(h.order.target.x - p.x, h.order.target.y - p.y) < 12) return h.order.target;
    if (h.act && h.act.target && !h.act.target.dead && h.act.target.team === 1) return h.act.target;
    let best = null, bd = p.kind === 'merc' || p.unit === 'skelmage' ? 10 : 8;
    for (const e of g.ents) {
      if (e.dead || e.team !== 1) continue;
      const dh = Math.hypot(e.x - h.x, e.y - h.y);
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (dh < 11 && d < bd + 2 && D.losLine(g.area, p.x, p.y, e.x, e.y)) { if (d < bd) { bd = d; best = e; } }
    }
    return best;
  }

  function pet(g, p, dt) {
    const h = g.hero;
    const ai = p.ai;
    if (p.anim.n === 'appear' && p.anim.t < p.anim.dur) { p.anim.t += dt; return; }
    const dh = Math.hypot(h.x - p.x, h.y - p.y);
    if (p.unit === 'cbsentry' || p.unit === 'lsentry') {
      if (g.time < ai.cd) return;
      const t = g.enemiesNear(p.x, p.y, p.range, p.team).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      if (t && D.losLine(g.area, p.x, p.y, t.x, t.y)) { p.dir = Math.atan2(t.y - p.y, t.x - p.x); D.Skills.trapShoot(g, p, t); ai.cd = g.time + p.atk; }
      return;
    }
    if (p.unit === 'volcano') { if (g.time >= ai.cd) { D.Skills.volcanoTick(g, p); ai.cd = g.time + p.atk; } return; }
    if (p.unit === 'decoy') return;
    if (dh > 26) { const s = g.freeSpot(g.area, h.x, h.y, 2); if (s) { p.x = s.x; p.y = s.y; p.path = null; } return; }
    if (p.unit === 'oaksage' || p.unit === 'wolverine') {
      if (dh > 2.2) moveTo(g, p, h.x - 1, h.y - 1, dt); else p.path = null;
      return;
    }
    if (p.unit === 'raven') {
      const t = petTarget(g, p);
      if (!t) { if (dh > 2) p.path = [{ x: h.x + Math.cos(g.time * 3 + p.id) * 1.5, y: h.y + Math.sin(g.time * 3 + p.id) * 1.5 }]; return; }
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < 0.9 && g.time >= ai.cd) {
        g.damage(p, t, { ph: p.dmg }, {});
        if (!t.boss) t.fx.blind = 2;
        p.hits--;
        ai.cd = g.time + 0.5;
        g.sfx('raven', p.x, p.y);
        if (p.hits <= 0) { p.dead = true; p.noCorpse = true; p.deathT = 1.5; }
        return;
      }
      p.path = [{ x: t.x + Math.cos(g.time * 5 + p.id) * 0.4, y: t.y + Math.sin(g.time * 5 + p.id) * 0.4 }];
      return;
    }
    let t = ai.target;
    if (!alive(t) || Math.hypot(t.x - h.x, t.y - h.y) > 14) t = ai.target = petTarget(g, p);
    if (!t) {
      if (dh > 3.5) moveTo(g, p, h.x + Math.cos(p.id) * 1.5, h.y + Math.sin(p.id) * 1.5, dt);
      else p.path = null;
      return;
    }
    const d = Math.hypot(t.x - p.x, t.y - p.y) - t.r - p.r;
    const ranged = p.kind === 'merc' || p.unit === 'skelmage';
    if (ranged) {
      if (d <= p.range && D.losLine(g.area, p.x, p.y, t.x, t.y)) {
        if (g.time >= ai.cd) { g.startAct(p, { anim: p.kind === 'merc' ? 'bow' : 'cast', dur: p.atk, fireAt: 0.6, target: t, x: t.x, y: t.y, run: () => D.Skills.petShoot(g, p, t) }); ai.cd = g.time + 0.2 + g.rng.next() * 0.4; }
        else p.path = null;
      } else moveTo(g, p, t.x, t.y, dt);
      return;
    }
    if (d <= p.range) { if (g.time >= ai.cd) meleeAct(g, p, t); else p.path = null; return; }
    moveTo(g, p, t.x, t.y, dt);
  }

  function update(g, e, dt) {
    if (e.act || e.fx.freeze > 0 || e.fx.stun > 0) return;
    if (e.anim.n === 'appear' && e.anim.t < e.anim.dur) { e.anim.t += dt; return; }
    if (e.kind === 'mon') monster(g, e, dt);
    else pet(g, e, dt);
    if (!e.act) {
      const n = e.path && e.path.length ? 'walk' : 'idle';
      if (e.anim.n !== n) e.anim = { n, t: 0, dur: 1 };
      else e.anim.t += dt;
    }
  }

  D.AI = { update, provoke, pickTarget, revive };
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Diablo2 = globalThis.Diablo2 || {});
