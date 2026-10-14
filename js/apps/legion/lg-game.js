(function (L) {
  'use strict';

  L.terrainOpts = lv => Object.assign({}, lv.quick ? {} : (L.MAP_TERRAIN || {})[lv.map] || {}, lv.terrain || {});

  L.squadSpec = sq => ({ id: sq.id, key: sq.key, name: sq.name, men: sq.men, level: sq.level, xp: sq.xp, skills: sq.skills, equip: sq.equip, color: sq.color });

  L.setupBattle = (lv, profile, terrain, opts) => {
    opts = opts || {};
    const difficulty = profile ? profile.difficulty : (opts.difficulty == null ? 1 : opts.difficulty);
    const seed = opts.seed || (L.hashString(lv.id) ^ (Date.now() & 0xffff));
    const enemy = opts.enemy || L.buildEnemy(lv, difficulty, L.hashString(lv.id + ':' + difficulty));
    const zone = lv.playerZone;
    const size = terrain.size;
    const ez = lv.enemyZone || [size * 0.2, size * 0.1, size * 0.8, size * 0.45];
    const cfg = {
      terrain, seed, difficulty,
      playerZone: zone, enemyZone: ez,
      playerFace: lv.playerFace, enemyFace: lv.enemyFace == null ? null : lv.enemyFace,
      objectives: L.clone(lv.objectives || []),
      reinforcements: (lv.reinforcements || []).map((r, i) => ({ at: r.at, text: r.text, side: 1, squads: r.squads.map((e, j) => L.makeEnemySpec(e, lv, L.DIFFICULTY[difficulty], L.rng(L.hashString(lv.id + i + ':' + j)), 100 + i * 10 + j)) })),
      escape: lv.escape || null,
      medals: lv.medals || null,
      par: lv.par || null,
      scoreBonus: lv.scoreBonus || null,
      player: [], enemy
    };
    const squads = opts.squads || (profile ? profile.squads : []);
    const chosen = squads.filter(s => s.men > 0);
    const general = chosen.find(s => L.UNITS[s.key].leader);
    const onField = new Set(opts.selected || L.defaultSelection(chosen, lv.cap).map(s => s.id));
    if (general) onField.add(general.id);
    for (const sq of chosen) {
      const spec = L.squadSpec(sq);
      spec.face = lv.playerFace;
      spec.form = sq.deploy && sq.deploy.form && L.FORMS[sq.deploy.form] ? sq.deploy.form : 'balanced';
      spec.doctrine = sq.deploy && sq.deploy.doctrine ? sq.deploy.doctrine : (L.UNITS[sq.key].leader ? 'longhold' : 'hold');
      cfg.player.push(spec);
    }
    const b = new L.Battle(cfg);
    const mine = b.squads.filter(s => s.side === 0);
    for (const s of mine) {
      s.onField = onField.has(s.ref);
      if (s.form !== 'balanced' && L.FORMS[s.form].skill && !s.stats.forms) b.setForm(s, 'balanced');
    }
    const remembered = mine.filter(s => s.onField && squads.find(q => q.id === s.ref && q.deploy && q.deploy.u != null));
    const fresh = mine.filter(s => s.onField && !remembered.includes(s));
    b.autoDeploy(0, fresh.length ? mine.filter(s => s.onField) : []);
    const failed = [];
    for (const s of remembered) {
      const d = squads.find(q => q.id === s.ref).deploy;
      const x = L.lerp(zone[0], zone[2], d.u), z = L.lerp(zone[1], zone[3], d.v);
      if (b.validDeploy(s, x, z)) b.placeSquad(s, x, z, lv.playerFace + (d.rel || 0));
      else failed.push(s);
    }
    if (failed.length || (fresh.length && remembered.length)) b.autoDeploy(0, fresh.concat(failed));
    b.resolveDeploy(0);
    const diff = L.DIFFICULTY[difficulty];
    const aiOpts = Object.assign({}, lv.ai || {});
    aiOpts.reserve = difficulty >= 2 ? 0.05 : 0.15;
    if (difficulty >= 2) aiOpts.huntGeneral = true;
    b.cfg.ai = [new L.Commander(b, 1, aiOpts)];
    if (opts.autopilot) b.cfg.ai.push(new L.Commander(b, 0, Object.assign({ signalAt: 20, signalRange: 200 }, opts.autopilot)));
    b.level = lv;
    b.profile = profile;
    b.diffInfo = diff;
    return b;
  };

  L.defaultSelection = (squads, cap) => {
    const list = squads.filter(s => s.men > 0).slice();
    const general = list.find(s => L.UNITS[s.key].leader);
    const rest = list.filter(s => s !== general).sort((a, b) => (b.level - a.level) || (L.UNITS[b.key].cost - L.UNITS[a.key].cost) || (b.men - a.men));
    const out = general ? [general] : [];
    for (const s of rest) if (out.length < cap) out.push(s);
    return out;
  };

  L.rememberDeploy = (b, profile) => {
    const lv = b.level;
    const zone = lv.playerZone;
    const out = {};
    for (const s of b.squads) {
      if (s.side !== 0 || s.ref == null) continue;
      const sq = profile.squads.find(q => q.id === s.ref);
      if (!sq) continue;
      sq.deploy = {
        u: L.clamp((s.ax - zone[0]) / (zone[2] - zone[0]), 0, 1),
        v: L.clamp((s.az - zone[1]) / (zone[3] - zone[1]), 0, 1),
        rel: L.wrapAngle(s.face - lv.playerFace),
        form: s.form,
        doctrine: s.doctrine,
        on: s.onField
      };
      out[s.ref] = sq.deploy;
    }
    return out;
  };

  L.quickLevel = (opts) => {
    const size = opts.size || 1024;
    return {
      id: 'quick', n: 0, era: 2, title: 'Арена', map: opts.map, faction: opts.faction, color: L.QUICK_FACTIONS[opts.faction].color,
      short: 'Быстрая битва', briefing: ['Свободное сражение без последствий для кампании.'], cap: 16, reward: { glory: 0, denarii: 0 }, unlocks: [],
      objectives: [{ type: 'rout' }],
      playerZone: [size * 0.3, size * 0.64, size * 0.7, size * 0.78], playerFace: Math.PI,
      enemy: [], ai: { signalAt: 50 }, quick: true
    };
  };
})(globalThis.Legion = globalThis.Legion || {});
