(function (L) {
  'use strict';

  const SAVE_KEY = 'legion98_profile_v1';
  const OPTS_KEY = 'legion98_opts_v1';
  const STAT_KEYS = ['ar', 'dm', 'cc', 'ag', 'hit', 'sh', 'sa', 'sd', 'mo', 'hp', 'crit', 'pierce', 'shots', 'range', 'oc', 'op', 'og', 'lr', 'tr', 'ta', 'vsCav', 'vsInf', 'vsEle', 'defCav', 'defInf', 'speed'];

  const A = {};

  A.OPTS_DEF = { music: 0.6, sfx: 0.85, voice: 0.8, grass: true, trees: 1, shadows: true, numbers: true, edgeScroll: true, quality: 1, hints: true };

  A.newProfile = (name, difficulty) => {
    const p = {
      v: 1,
      army: name || 'Легион I',
      difficulty: difficulty == null ? 1 : difficulty,
      glory: 0,
      denarii: 50,
      squads: [],
      nextId: 1,
      progress: {},
      chronicle: { intro: [], outro: [] },
      unlocked: L.START_UNLOCKED.slice(),
      favours: [],
      stats: { battles: 0, won: 0, lost: 0, kills: 0, losses: 0 },
      created: Date.now()
    };
    for (const key of L.START_ARMY) A.addSquad(p, key);
    return p;
  };

  A.addSquad = (p, key, name) => {
    const u = L.UNITS[key];
    const sq = {
      id: p.nextId++,
      key,
      name: name || A.defaultName(p, key),
      men: u.men,
      level: 1,
      xp: 0,
      skills: {},
      equip: {},
      color: L.FACTIONS.rome.color,
      history: { battles: 0, kills: 0, lost: 0, bestKills: 0, bestXp: 0, medals: 0, promoted: 0 },
      deploy: null
    };
    p.squads.push(sq);
    return sq;
  };

  A.defaultName = (p, key) => {
    const base = L.UNITS[key].name;
    const used = new Set(p.squads.map(s => s.name));
    for (let i = 1; i < 99; i++) {
      const n = base + ' ' + L.roman(i);
      if (!used.has(n)) return n;
    }
    return base;
  };

  A.maxMen = sq => L.UNITS[sq.key].men;

  A.nextLevelXp = sq => sq.level - 1 < L.XP_LEVELS.length ? L.XP_LEVELS[sq.level - 1] : null;

  A.canPromote = sq => {
    const need = A.nextLevelXp(sq);
    return need != null && sq.xp >= need && A.promoteOptions(sq).length > 0;
  };

  A.skillAllowed = (sq, id) => {
    const s = L.SKILLS[id];
    const tags = L.unitTags(sq.key);
    if (s.only && !tags.has(s.only)) return false;
    if (s.notLeader && tags.has('leader')) return false;
    if (tags.has('leader') && !['quick', 'strategist', 'leadership', 'block', 'dodge', 'parry', 'hardiness', 'swordsman', 'gmswords', 'officers', 'feint'].includes(id)) return false;
    return true;
  };

  A.reqMet = (sq, req) => (req || []).every(([id, tier]) => (sq.skills[id] || 0) >= tier || (id === 'swordsman' && sq.skills.gmswords) || (id === 'marksman' && sq.skills.gmmarks));

  A.promoteOptions = sq => {
    const out = [];
    for (const id of L.SKILL_ORDER) {
      const s = L.SKILLS[id];
      if (!A.skillAllowed(sq, id)) continue;
      const cur = sq.skills[id] || 0;
      if (cur >= s.tiers.length) continue;
      if (s.replaces && !sq.skills[id] && !((sq.skills[s.replaces] || 0) >= 4)) continue;
      if (!A.reqMet(sq, s.req)) continue;
      if (id === 'swordsman' && sq.skills.gmswords) continue;
      if (id === 'marksman' && sq.skills.gmmarks) continue;
      out.push({ id, tier: cur + 1, name: s.names[cur], desc: s.desc, fx: s.tiers[cur], prev: cur ? s.tiers[cur - 1] : null });
    }
    return out;
  };

  A.promote = (sq, id) => {
    if (!A.canPromote(sq)) return false;
    const opt = A.promoteOptions(sq).find(o => o.id === id);
    if (!opt) return false;
    const s = L.SKILLS[id];
    sq.skills[id] = opt.tier;
    if (s.replaces && sq.skills[s.replaces]) delete sq.skills[s.replaces];
    sq.level++;
    if (sq.history) sq.history.promoted = (sq.history.promoted || 0) + 1;
    return true;
  };

  A.equipTier = (sq, slot) => {
    const v = sq.equip[slot];
    return Array.isArray(v) ? v : (v || 0);
  };

  A.equipOptions = sq => {
    const tags = L.unitTags(sq.key);
    const out = [];
    for (const slot of L.EQUIP_ORDER) {
      const e = L.EQUIP[slot];
      if (e.flat) {
        const owned = sq.equip[slot] || [];
        e.tiers.forEach((t, i) => {
          if (t.only && !tags.has(t.only)) return;
          if (slot === 'relic' && owned.length && !owned.includes(i)) {
            out.push({ slot, index: i, item: t, owned: false, blocked: 'Отряд уже владеет реликвией' });
            return;
          }
          out.push({ slot, index: i, item: t, owned: owned.includes(i), blocked: A.reqMet(sq, t.req) ? null : A.reqText(t.req) });
        });
      } else {
        const cur = sq.equip[slot] || 0;
        const next = e.tiers[cur];
        out.push({ slot, index: cur, item: next || null, current: cur ? e.tiers[cur - 1] : null, owned: false, maxed: !next, blocked: next && !A.reqMet(sq, next.req) ? A.reqText(next.req) : null });
      }
    }
    return out;
  };

  A.reqText = req => 'Требуется: ' + (req || []).map(([id, tier]) => L.SKILLS[id].names[Math.min(tier, L.SKILLS[id].names.length) - 1]).join(', ');

  A.buyEquip = (p, sq, slot, index) => {
    const e = L.EQUIP[slot];
    if (e.flat) {
      const t = e.tiers[index];
      const owned = sq.equip[slot] || [];
      if (!t || owned.includes(index) || !A.reqMet(sq, t.req) || p.denarii < t.cost) return false;
      if (t.only && !L.unitTags(sq.key).has(t.only)) return false;
      if (slot === 'relic' && owned.length) return false;
      p.denarii -= t.cost;
      sq.equip[slot] = owned.concat([index]);
      return true;
    }
    const cur = sq.equip[slot] || 0;
    const t = e.tiers[cur];
    if (!t || index !== cur || !A.reqMet(sq, t.req) || p.denarii < t.cost) return false;
    p.denarii -= t.cost;
    sq.equip[slot] = cur + 1;
    return true;
  };

  A.stats = (sq, extra) => {
    const u = L.UNITS[sq.key];
    const st = {};
    for (const k of STAT_KEYS) st[k] = 0;
    for (const k of ['ar', 'dm', 'cc', 'ag', 'hit', 'sh', 'sa', 'sd', 'mo', 'hp']) st[k] = u[k];
    st.crit = u.ks ? u.ks * 0.4 : 0;
    st.shots = u.fire ? u.fire[1] : 0;
    st.range = u.fire ? u.fire[3] : 0;
    st.minRange = u.fire ? u.fire[2] : 0;
    st.rate = u.fire ? u.fire[0] / 30 : 0;
    st.oc = u.order;
    st.tr = u.trample[0];
    st.ta = u.trample[1];
    const lv = Math.max(0, sq.level - 1);
    st.ag += L.LEVEL_BONUS.ag * lv;
    st.hit += L.LEVEL_BONUS.hit * lv;
    st.mo += L.LEVEL_BONUS.mo * lv;
    st.hp += L.LEVEL_BONUS.hp * lv;
    const add = fx => {
      for (const k in fx) if (typeof fx[k] === 'number' && k in st) st[k] += fx[k];
    };
    let forms = false;
    for (const id in sq.skills) {
      const s = L.SKILLS[id];
      if (!s) continue;
      const tier = s.tiers[Math.min(sq.skills[id], s.tiers.length) - 1];
      if (tier.forms) forms = true;
      add(tier);
    }
    for (const slot in sq.equip) {
      const e = L.EQUIP[slot];
      if (!e) continue;
      const v = sq.equip[slot];
      if (Array.isArray(v)) v.forEach(i => e.tiers[i] && add(e.tiers[i].fx));
      else if (v > 0) add(e.tiers[v - 1].fx);
    }
    if (extra) add(extra);
    st.forms = forms;
    st.oc = Math.max(1000, st.oc);
    st.hp = Math.max(5, st.hp);
    st.ag = Math.max(0, st.ag);
    return st;
  };

  A.recruitCost = key => L.UNITS[key].cost;
  A.replenishCostPerMan = key => Math.max(1, Math.round(L.UNITS[key].cost / L.UNITS[key].men * 0.8));
  A.replenishCost = sq => (A.maxMen(sq) - sq.men) * A.replenishCostPerMan(sq.key);

  A.canRecruit = (p, key) => p.unlocked.includes(key) && p.glory >= A.recruitCost(key) && p.squads.length < L.ARMY_MAX;

  A.recruit = (p, key, name) => {
    if (!A.canRecruit(p, key)) return null;
    p.glory -= A.recruitCost(key);
    return A.addSquad(p, key, name);
  };

  A.replenish = (p, sq, limit) => {
    const per = A.replenishCostPerMan(sq.key);
    const missing = A.maxMen(sq) - sq.men;
    const n = Math.min(missing, Math.floor(p.glory / per), limit == null ? missing : limit);
    if (n <= 0) return 0;
    p.glory -= n * per;
    sq.men += n;
    return n;
  };

  A.replenishAll = p => {
    const order = p.squads.slice().sort((a, b) => a.men / A.maxMen(a) - b.men / A.maxMen(b));
    let total = 0;
    for (const sq of order) total += A.replenish(p, sq);
    return total;
  };

  A.grant = (p, glory, denarii) => {
    p.glory = Math.max(0, Math.round(p.glory + (glory || 0)));
    p.denarii = Math.max(0, Math.round(p.denarii + (denarii || 0)));
    return p;
  };

  A.disband = (p, sq) => {
    if (L.UNITS[sq.key].leader) return false;
    p.squads = p.squads.filter(s => s !== sq);
    return true;
  };

  A.general = p => p.squads.find(s => L.UNITS[s.key].leader);

  A.xpPerKill = key => 1 + L.UNITS[key].xp / 15;

  A.autoSkills = (sq, level, rnd) => {
    sq.level = 1;
    sq.xp = 0;
    sq.skills = {};
    for (let i = 1; i < level; i++) {
      sq.xp = L.XP_LEVELS[sq.level - 1];
      const opts = A.promoteOptions(sq);
      if (!opts.length) break;
      const tags = L.unitTags(sq.key);
      const weight = o => {
        let w = 1;
        if (['swordsman', 'feint', 'block', 'officers'].includes(o.id)) w = 3;
        if (tags.has('shooter') && ['marksman', 'vulner'].includes(o.id)) w = 4;
        if (tags.has('mounted') && o.id === 'ridedown') w = 4;
        if (tags.has('leader') && ['strategist', 'quick', 'leadership'].includes(o.id)) w = 4;
        if (o.id === 'wedge' || o.id === 'drill') w = 0.3;
        return w;
      };
      let total = 0;
      for (const o of opts) total += weight(o);
      let r = rnd.next() * total;
      let pick = opts[0];
      for (const o of opts) { r -= weight(o); if (r <= 0) { pick = o; break; } }
      A.promote(sq, pick.id);
    }
    sq.xp = 0;
    return sq;
  };

  A.normalize = p => {
    if (!p || typeof p !== 'object' || !Array.isArray(p.squads)) return null;
    const d = A.newProfile(p.army, p.difficulty);
    const out = Object.assign(d, p);
    out.squads = p.squads.filter(s => s && L.UNITS[s.key]).map(s => Object.assign({ skills: {}, equip: {}, history: {}, level: 1, xp: 0, color: 0 }, s));
    out.squads.forEach(s => {
      s.men = L.clamp(s.men | 0, 0, A.maxMen(s));
      s.history = Object.assign({ battles: 0, kills: 0, lost: 0, bestKills: 0, bestXp: 0, medals: 0, promoted: 0 }, s.history);
    });
    if (!out.squads.some(s => L.UNITS[s.key].leader)) {
      const g = A.addSquad(out, 'legate');
      out.squads = [g].concat(out.squads.filter(s => s !== g));
    }
    out.unlocked = Array.from(new Set((p.unlocked || []).concat(L.START_UNLOCKED))).filter(k => L.UNITS[k]);
    out.favours = (p.favours || []).filter(f => L.FAVOURS[f]);
    out.progress = p.progress || {};
    out.chronicle = { intro: ((p.chronicle || {}).intro || []).slice(), outro: ((p.chronicle || {}).outro || []).slice() };
    return out;
  };

  A.load = () => {
    try { return A.normalize(JSON.parse(localStorage.getItem(SAVE_KEY))); } catch (e) { return null; }
  };
  A.save = p => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(p)); return true; } catch (e) { return false; }
  };
  A.clear = () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  };
  A.loadOpts = () => {
    let o = null;
    try { o = JSON.parse(localStorage.getItem(OPTS_KEY)); } catch (e) { }
    return Object.assign({}, A.OPTS_DEF, o || {});
  };
  A.saveOpts = o => {
    try { localStorage.setItem(OPTS_KEY, JSON.stringify(o)); } catch (e) { }
  };

  A.applyBattle = (p, level, result) => {
    const medalIdx = result.medal;
    const prev = p.progress[level.id];
    const diff = L.DIFFICULTY[p.difficulty] || L.DIFFICULTY[1];
    const rewards = { glory: 0, denarii: 0, favour: null, unlocked: [], promotions: [] };
    p.stats.battles++;
    if (result.won) {
      p.stats.won++;
      const mul = L.MEDALS[medalIdx].mul * diff.reward;
      const first = !prev || prev.medal == null;
      const prevMul = prev && prev.medal != null ? L.MEDALS[prev.medal].mul * diff.reward : 0;
      const gainMul = first ? mul : Math.max(mul - prevMul, 0) + mul * 0.2;
      rewards.glory = Math.round(level.reward.glory * gainMul);
      rewards.denarii = Math.round(level.reward.denarii * gainMul);
      if (medalIdx === 2 && (!prev || prev.medal !== 2)) {
        const keys = L.FAVOUR_ORDER.filter(k => !p.favours.includes(k));
        const pool = keys.length ? keys : L.FAVOUR_ORDER;
        rewards.favour = pool[(L.hashString(level.id + p.created) + p.stats.battles) % pool.length];
        if (p.favours.length < 4) p.favours.push(rewards.favour);
      }
      p.progress[level.id] = { medal: Math.max(medalIdx, prev && prev.medal != null ? prev.medal : -1), best: Math.max(result.score, prev ? prev.best || 0 : 0) };
      for (const k of level.unlocks || []) if (!p.unlocked.includes(k)) { p.unlocked.push(k); rewards.unlocked.push(k); }
    } else {
      p.stats.lost++;
      if (!prev) p.progress[level.id] = { medal: null, best: 0 };
    }
    p.glory += rewards.glory;
    p.denarii += rewards.denarii;
    if (!result.won) {
      rewards.destroyed = [];
      return rewards;
    }
    for (const r of result.squads) {
      const sq = p.squads.find(s => s.id === r.id);
      if (!sq) continue;
      sq.men = Math.max(0, r.men);
      sq.xp += r.xp;
      sq.history.battles++;
      sq.history.kills += r.kills;
      sq.history.lost += r.lost;
      sq.history.bestKills = Math.max(sq.history.bestKills, r.kills);
      sq.history.bestXp = Math.max(sq.history.bestXp, r.xp);
      if (medalIdx === 2) sq.history.medals++;
      if (r.deploy) sq.deploy = r.deploy;
      if (A.canPromote(sq)) rewards.promotions.push(sq.id);
    }
    p.stats.kills += result.kills;
    p.stats.losses += result.lost;
    const general = A.general(p);
    const dead = p.squads.filter(s => s.men <= 0 && s !== general);
    p.squads = p.squads.filter(s => s.men > 0 || s === general);
    if (general && general.men <= 0) general.men = 1;
    rewards.destroyed = dead.map(s => s.name);
    return rewards;
  };

  L.Army = A;
})(globalThis.Legion = globalThis.Legion || {});
