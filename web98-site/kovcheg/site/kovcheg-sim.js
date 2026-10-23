(() => {
  function create(H, K) {
    const keyOf = id => (id === 'trail_p' ? 'trail' : id);
    const clash = team => team.includes('trail') && team.includes('trail_p');
    const sigCone = id => Object.keys(H.CONES).find(k => H.CONES[k].sig === id) || null;

    function coneFor(id, kind) {
      const p = H.CHARS[id].path;
      if (kind === 'early') return K.EARLY_CONE[p];
      if (kind === 'sig') return sigCone(id) || K.STD_CONE[p];
      return K.STD_CONE[p];
    }

    function gear(g, id, cone, relicLvl) {
      const key = keyOf(id), c = H.CHARS[id], p = K.PRESETS[K.CHARS[id].build];
      const cid = coneFor(id, cone);
      if (cid) g.equipCone(key, g.debugCone(cid, 1, 1)[0].uid);
      const set = p.set === 'elem' ? K.ELEM_SET[c.elem] : p.set;
      const sphere = p.sphere === 'elem' ? c.elem + 'P' : p.sphere;
      const pieces = [['head', 'hpF', set], ['hands', 'atkF', set], ['body', p.body, set], ['feet', p.feet, set], ['sphere', sphere, p.planar], ['rope', p.rope, p.planar]];
      for (const [slot, main, s] of pieces) {
        const rel = g.debugRelic({ set: s, slot, main, lvl: relicLvl, subs: p.subs.filter(x => x !== main), roll: 1 });
        if (!rel) throw new Error('relic ' + id + ' ' + slot + ' ' + main);
        g.equipRelic(key, rel.uid);
      }
    }

    function makeGame(team, lvl, cone, relicLvl) {
      const g = new H.Game({ seed: 7 });
      const s = g.state;
      s.flags.fh_met = true;
      s.roster = {};
      for (const id of team) {
        if (id === 'trail' || id === 'trail_p') s.mcPath = id;
        g.debugChar(keyOf(id), lvl, 0);
        if (g.fillTraces) g.fillTraces(keyOf(id), 'cap');
        gear(g, id, cone, relicLvl);
      }
      s.party = team.map(keyOf);
      return g;
    }

    function hitValue(fx, n) {
      let v = 0;
      for (const f of fx || []) {
        if (f.k !== 'dmg') continue;
        const m = (f.m || 0) + (f.plusDef || 0) * 0.5 + (f.hpM || 0) * 0.5;
        v += m * (f.hits || 1) + (f.adj || 0) * Math.min(2, Math.max(0, n - 1));
      }
      return v;
    }

    function abilityValue(ab, n) {
      if (!ab) return 0;
      const v = hitValue(ab.fx, n);
      return ab.target === 'all' ? v * n : v;
    }

    function worth(fu, n) {
      return abilityValue(fu.f, n) >= fu.members.reduce((a, m) => a + abilityValue(m.kit.ult, n), 0);
    }

    function fusionPolicy(b) {
      if (b.over || !b.canAct()) return false;
      const n = b.living.length;
      if (!n) return false;
      for (const fu of b.availableFusions()) {
        if (!fu.ready || !worth(fu, n)) continue;
        if (b.fusion(fu.id, b.autoTarget(fu.members[0]))) return true;
      }
      return false;
    }

    function holds(b) {
      if (b.over) return [];
      const n = Math.max(1, b.living.length), out = new Set();
      for (const fu of b.availableFusions()) {
        if (fu.ready || !worth(fu, n)) continue;
        const ready = fu.members.filter(m => b.ultReady(m));
        const rest = fu.members.filter(m => !b.ultReady(m));
        if (ready.length && rest.every(m => !m.dead && m.hp > 0 && m.energy >= m.maxEnergy * 0.5)) ready.forEach(m => out.add(m));
      }
      return [...out];
    }

    function step(b) {
      const held = holds(b);
      const keep = held.map(m => m.maxEnergy);
      held.forEach(m => { m.maxEnergy = Infinity; });
      try { return b.autoStep(); }
      finally { held.forEach((m, i) => { m.maxEnergy = keep[i]; if (m.energy > m.maxEnergy) m.energy = m.maxEnergy; }); }
    }

    function tally(dmg, events) {
      if (!dmg) return;
      for (const e of events) if (e.t === 'dmg' && e.src && e.src.side === 'ally' && e.u && e.u.side === 'enemy') dmg[e.src.charId] = (dmg[e.src.charId] || 0) + e.v;
    }

    function play(b, dmg) {
      let guard = 0;
      tally(dmg, b.drain());
      while (!b.over && guard++ < 5000) {
        if (fusionPolicy(b)) { tally(dmg, b.drain()); continue; }
        if (!step(b)) break;
        tally(dmg, b.drain());
      }
      return b;
    }

    function battle(g, team, o, seed, dmg) {
      const keys = team.map(keyOf);
      const party = g.fhSpecs(keys);
      const techs = keys.map(k => ({ charId: g.kitOf(k), fx: H.CHARS[g.kitOf(k)].tech.fx }));
      const b = new H.Battle(Object.assign({
        party, seed, techs, waves: o.waves.map(w => w.slice()), lvl: o.lvl, noFlee: true, noContact: true, boss: !!o.boss,
        foeHp: o.foeHp || 1, foeAtk: o.foeAtk || 1, fh: o.fh || { budget: 999, used: 0, turb: null }
      }, o.extra || {}));
      tally(dmg, b.start() || []);
      play(b, dmg);
      const win = !!(b.over && b.result && b.result.win);
      return { win, cyc: b.fh ? b.fh.cyc : 0, down: b.fh ? b.fh.down : 0, clock: b.clock || 0 };
    }

    function encWaves(id) {
      const e = H.ENCOUNTERS[id];
      const waves = e.waves || [e.enemies];
      const lvl = Math.max(...waves.flat().map(s => +String(s).split(':')[1] || 1));
      const extra = {};
      for (const k of ['endAt', 'hpStart', 'allyBuff', 'field']) if (e[k]) extra[k] = e[k];
      return { waves, lvl, boss: !!e.boss, extra };
    }

    function hallNode(g, team, n, ni, seed, dmg) {
      const st = H.FH.STAGES[n - 1];
      let used = 0, down = 0;
      for (let bi = 0; bi < st.nodes[ni].length; bi++) {
        const b0 = st.nodes[ni][bi];
        const r = battle(g, team, {
          waves: b0.waves.map(w => w.map(id => id + ':' + st.lvl)), lvl: st.lvl,
          foeHp: H.FH.TUN.hp[n - 1], foeAtk: 1 + (n - 1) * H.FH.TUN.atkRamp,
          fh: { budget: st.budget, used, turb: st.turb, n, node: ni, bi }
        }, seed * 7919 + ni * 131 + bi * 17 + n * 1009, dmg);
        down += r.down;
        if (!r.win) return { win: false, cyc: used, down };
        used += r.cyc;
      }
      return { win: true, cyc: used, down };
    }

    function hallRun(team, n, ni, seeds, cone, relicLvl, dmg) {
      if (clash(team)) return null;
      const st = H.FH.STAGES[n - 1];
      const g = makeGame(team, st.lvl, cone, relicLvl);
      let cyc = 0, wins = 0, down = 0;
      for (let s = 1; s <= seeds; s++) {
        const r = hallNode(g, team, n, ni, s, dmg);
        down += r.down;
        if (r.win) { wins++; cyc += r.cyc; } else cyc += st.budget;
      }
      return { cyc: cyc / seeds, win: wins / seeds, down: down / seeds };
    }

    function bossRun(team, encId, seeds, cone, relicLvl, cond, dmg) {
      if (clash(team)) return null;
      const e = encWaves(encId);
      const g = makeGame(team, e.lvl, cone, relicLvl);
      let cyc = 0, wins = 0, down = 0;
      for (let s = 1; s <= seeds; s++) {
        const r = battle(g, team, { waves: e.waves.map(w => w.map(x => x)), lvl: e.lvl, boss: e.boss, foeHp: cond.hp, foeAtk: cond.atk, extra: e.extra }, s * 104729 + encId.length * 31, dmg);
        down += r.down;
        if (r.win) { wins++; cyc += r.cyc; } else cyc += cond.failCycles || 40;
      }
      return { cyc, wins, runs: seeds, down };
    }

    return { keyOf, clash, sigCone, coneFor, gear, makeGame, hitValue, abilityValue, worth, fusionPolicy, holds, step, play, battle, encWaves, hallNode, hallRun, bossRun };
  }

  const api = { create };
  if (typeof window !== 'undefined') window.kovchegSim = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
