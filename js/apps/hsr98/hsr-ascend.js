(function (H) {
  'use strict';
  const T = H.TUNING, A = H.ASC, BOOKS = ['exp1', 'exp2', 'exp3'], AETHER = ['aether1', 'aether2', 'aether3'];

  const NEW_SHADOWS = [
    { id: 'cx_quanta', name: 'Застойная тень: Форма кванта', boss: 'trampler', adds: ['reaver', 'reaver'], need: 'doom', sets: ['genius', 'passerby'], text: 'Рейнджер пустоты и два Захватчика в Базовой зоне станции «Герта». Реликвии за каждую победу.' },
    { id: 'cx_icicle', name: 'Застойная тень: Форма сосульки', boss: 'iceout', adds: ['weaver', 'mara'], ownsMat: true, sets: ['glacial', 'eagle'] },
    { id: 'cx_doom', name: 'Застойная тень: Форма рока', boss: 'shifter', adds: ['mara', 'dracolion'], ownsMat: true, sets: ['knight', 'thunder'] },
    { id: 'cx_celestial', name: 'Застойная тень: Форма небожителя', boss: 'ascended', adds: ['ballista', 'ballista'], ownsMat: true, sets: ['glacial', 'eagle'] },
    { id: 'cx_abomination', name: 'Застойная тень: Форма оборотня', boss: 'ape', adds: ['ghound', 'lupus'], ownsMat: true, sets: ['genius', 'passerby'] },
    { id: 'cx_puppetry', name: 'Застойная тень: Форма идола', boss: 'aurumaton', adds: ['dragonfish', 'dragonfish'], ownsMat: true, sets: ['knight', 'thunder'] },
    { id: 'cx_perdition', name: 'Застойная тень: Форма погибели', boss: 'spectral', adds: ['dracolion', 'dracolion'], ownsMat: true, sets: ['champion', 'thief'] }
  ];
  const FAR_SHADOW = 'Эта Тень лежит на Лофу Сяньчжоу. Симулятор воссоздаёт её по записям, когда в экипаже есть герой с её материалом. Реликвии за каждую победу.';
  for (const c of NEW_SHADOWS) if (!H.CALYX.some(x => x.id === c.id)) H.CALYX.push(Object.assign({ cost: 30, music: 'boss', reward: 'relic', text: FAR_SHADOW }, c));

  for (const [id, m] of Object.entries(A.shadows)) {
    const c = m.cx && H.CALYX.find(x => x.id === m.cx);
    if (c) { c.mat = id; c.text += ' Материал возвышения: ' + m.name + '.'; }
    H.ITEMS[id] = c
      ? { name: m.name, kind: 'mat', mat: 'asc', rar: 4, price: 0, src: c.name + '.', text: 'Материал возвышения героев. Остаётся после Застойной тени, ' + c.name.split(': ')[1] + '.' }
      : { name: m.name, kind: 'mat', mat: 'asc', rar: 4, price: 0, src: 'Награды проводника.', text: 'Материал возвышения Первопроходца. Экипаж получает его от проводника по мере Освоения.' };
  }

  const AETHER_SRC = 'Чашелист (золотой): Бутон эфира, магазины, награды проводника.';
  [['aether1', 'Разрежённый эфир', 2, 500, 150, 'Редкий осадок эфира в кассете.'], ['aether2', 'Конденсированный эфир', 3, 2000, 500, 'Сгущённый эфир в кассете.'], ['aether3', 'Очищенный эфир', 4, 6000, 1500, 'Чистый эфир в кассете.']].forEach(([id, name, rar, coneExp, price, text]) => {
    H.ITEMS[id] = { name, kind: 'exp', rar, price, coneExp, src: AETHER_SRC, note: 'Тратится на экране конуса.', text: text + ' +' + H.fmt(coneExp) + ' опыта световому конусу.' };
  });
  H.AETHER_CALYX = [{ aether1: 3 }, { aether1: 3, aether2: 1 }, { aether2: 3, aether1: 2 }, { aether3: 1, aether2: 2 }];

  Object.assign(H.Game.prototype, {
    ascMatNeeded(id) {
      const s = this.state, has = k => A.shadowOf[this.kitOf(k)] === id;
      if (Object.keys(s.roster).some(k => !s.roster[k].guest && has(k))) return true;
      const t = this.guideTarget ? this.guideState().target : null;
      return !!t && A.shadowOf[t] === id;
    },

    ascOf(key) {
      const r = this.state.roster[key];
      if (!r) return 0;
      return r.asc == null || r.lvl > H.ascCap(r.asc) ? H.ascPhase(r.lvl) : r.asc;
    },

    levelCap(key) {
      const r = this.state.roster[key];
      return !T.ascOn || !r || r.guest ? H.MAX_LVL : H.ascCap(this.ascOf(key));
    },

    statAsc(key) {
      const r = this.state.roster[key];
      return T.ascOn && r && !r.guest ? this.ascOf(key) : undefined;
    },

    gateOk(key, gate) {
      const r = this.state.roster[key];
      if (!T.ascOn || r.guest || gate > 70) return r.lvl >= gate;
      return this.ascOf(key) >= (gate - 10) / 10;
    },

    expBooks() { return BOOKS.map(id => ({ id, exp: H.ITEMS[id].use.exp, have: this.state.inv.items[id] || 0 })); },

    expCredits(exp) { return Math.round(exp / A.heroCredit * T.upCredit); },

    expToCap(key) {
      const r = this.state.roster[key], cap = this.levelCap(key);
      let n = -r.exp;
      for (let l = r.lvl; l < cap; l++) n += H.expToNext(l);
      return Math.max(0, n);
    },

    expAfter(key, gain) {
      const r = this.state.roster[key], cap = this.levelCap(key);
      let lvl = r.lvl, exp = r.exp + gain;
      while (lvl < cap && exp >= H.expToNext(lvl)) { exp -= H.expToNext(lvl); lvl++; }
      return { lvl, exp: lvl >= cap ? 0 : exp };
    },

    useExp(key, picks) {
      const s = this.state, r = s.roster[key];
      if (!r || r.guest || r.lvl >= this.levelCap(key)) return null;
      let gain = 0;
      for (const b of this.expBooks()) { const n = picks[b.id] || 0; if (n < 0 || n > b.have) return null; gain += n * b.exp; }
      const cost = this.expCredits(gain);
      if (gain <= 0 || s.credits < cost) return null;
      s.credits -= cost;
      for (const id of BOOKS) { const n = picks[id] || 0; if (!n) continue; s.inv.items[id] -= n; if (!s.inv.items[id]) delete s.inv.items[id]; }
      const from = r.lvl;
      this.addExp(key, gain);
      return { from, to: r.lvl, gain, cost };
    },

    statsAt(key, lvl, asc) {
      const r = this.state.roster[key], was = r.lvl, wasAsc = r.asc;
      r.lvl = lvl;
      if (asc != null) r.asc = asc;
      const st = this.charStats(key);
      r.lvl = was;
      r.asc = wasAsc;
      return st;
    },

    ascCost(key, at) {
      const kit = this.kitOf(key), p = at == null ? this.ascOf(key) : at;
      if (p >= 6) return null;
      const d = H.TRACES[kit], row = A.heroCost[key === 'trail' ? 'trail' : d.cost][p], items = {};
      items[d.mats[1] + row.foe[0]] = row.foe[1];
      if (row.boss) items[A.shadowOf[kit]] = row.boss;
      return { to: p + 1, credits: Math.round(row.cr * T.upCredit), tl: A.tl[p + 1], items };
    },

    ascInfo(key) {
      const s = this.state, r = s.roster[key], asc = this.ascOf(key), cost = this.ascCost(key);
      const out = { asc, cost, atCap: r.lvl >= H.ascCap(asc), why: null, short: [], synth: false };
      if (!cost) { out.why = 'max'; return out; }
      if (r.guest || !out.atCap) { out.why = 'lvl'; return out; }
      out.short = Object.entries(cost.items).filter(([id, n]) => (s.inv.items[id] || 0) < n).map(([id]) => id);
      out.synth = out.short.length > 0 && this.ascSynthCovers(cost.items);
      if (this.trailLevel() < cost.tl) out.why = 'tl';
      else if (out.short.length) out.why = 'mats';
      else if (s.credits < cost.credits) out.why = 'credits';
      return out;
    },

    matPlan(need) {
      const inv = Object.assign({}, this.state.inv.items), ops = [];
      for (const [id, n] of Object.entries(need)) inv[id] = (inv[id] || 0) - n;
      const make = (id, n) => {
        const it = H.ITEMS[id];
        if (!it || (it.mat !== 'foe' && it.mat !== 'path')) return false;
        let miss = n;
        const lines = Object.keys(it.mat === 'foe' ? H.TRACE_FOE_LINES : H.TRACE_PATH_LINES);
        for (const line of lines) {
          const from = line + it.tier;
          if (from === id || miss <= 0) continue;
          const times = Math.min(miss, Math.floor(Math.max(0, inv[from] || 0) / 2));
          if (times > 0) { inv[from] -= times * 2; miss -= times; ops.push(['swap', from, id, times]); }
        }
        if (miss <= 0) return true;
        if (it.tier <= 1) return false;
        const low = it.line + (it.tier - 1), have = Math.max(0, inv[low] || 0), want = miss * 3;
        if (have < want && !make(low, want - have)) return false;
        inv[low] = (inv[low] || 0) - want;
        ops.push(['synth', low, miss]);
        return true;
      };
      for (const [id] of Object.entries(need)) {
        if ((inv[id] || 0) >= 0) continue;
        const miss = -inv[id];
        if (!make(id, miss)) return null;
        inv[id] = 0;
      }
      return ops;
    },

    ascSynthCovers(need) { return !!this.matPlan(need); },

    matGather(need) {
      const ops = this.matPlan(need);
      if (!ops) return false;
      for (const op of ops) { if (op[0] === 'swap') this.exchange(op[1], op[2], op[3]); else this.synth(op[1], op[2]); }
      return true;
    },

    ascReady(key) {
      const r = this.state.roster[key];
      return !!r && !r.guest && T.ascOn && !this.ascInfo(key).why;
    },

    ascUnlocks(key, to) {
      const kit = this.kitOf(key), lvl = H.TRACE_PHASE_LVL[to], from = H.TRACE_PHASE_LVL[to - 1] || 1, out = [];
      const skill = H.traceAbilityCap('skill', lvl), basic = H.traceAbilityCap('basic', lvl);
      if (skill > H.traceAbilityCap('skill', from)) out.push('Навык, абсолютная техника и талант до ур. ' + skill);
      if (basic > H.traceAbilityCap('basic', from)) out.push('Атака до ур. ' + basic);
      const nodes = H.traceNodes(kit).filter(n => (n.kind === 'bonus' || n.kind === 'stat') && n.gate === lvl);
      const bonus = nodes.filter(n => n.kind === 'bonus'), stats = nodes.length - bonus.length;
      for (const n of bonus) out.push('Доп. способность: ' + n.title);
      if (stats) out.push('Новые Следы характеристик: ' + stats);
      return out;
    },

    ascend(key) {
      const s = this.state, r = s.roster[key], info = this.ascInfo(key);
      if (info.why) return null;
      const from = info.asc, to = info.cost.to;
      s.credits -= info.cost.credits;
      for (const [id, n] of Object.entries(info.cost.items)) { s.inv.items[id] -= n; if (!s.inv.items[id]) delete s.inv.items[id]; }
      r.asc = to;
      const pass = to % 2 === 1;
      if (pass) s.inv.items.pass = (s.inv.items.pass || 0) + 1;
      if (this.clampHp) this.clampHp(key);
      return { from, to, cap: H.ascCap(to), pass };
    },

    upLimit(key) {
      let p = this.ascOf(key);
      while (p < 6 && this.trailLevel() >= A.tl[p + 1]) p++;
      return H.ascCap(p);
    },

    planUp(key, target) {
      const r = this.state.roster[key];
      return planFor({ lvl: r.lvl, exp: r.exp, asc: this.ascOf(key), limit: this.upLimit(key), need: H.expToNext, books: this.expBooks(), credit: e => this.expCredits(e), cost: p => this.ascCost(key, p) }, target, this.state);
    },

    upReach(key) {
      return reachOf(this.state.roster[key].lvl, this.upLimit(key), t => this.planUp(key, t));
    },

    upDefault(key) {
      const r = this.state.roster[key];
      return defaultOf(r.lvl, this.upReach(key), this.upLimit(key), H.ascCap(this.ascOf(key)));
    },

    applyUp(key, target) {
      const r = this.state.roster[key], plan = this.planUp(key, target);
      if (!plan.ok || r.guest) return null;
      const pass = payPlan(this.state, plan, true);
      r.asc = plan.ascTo;
      this.addExp(key, plan.sum);
      if (this.clampHp) this.clampHp(key);
      return Object.assign(plan, { pass });
    },

    coneOf(uid) { return this.state.inv.cones.find(x => x.uid === uid) || null; },

    coneLvlOf(cn, holder) {
      const lvl = cn.lvl == null ? (holder ? holder.lvl : 1) : cn.lvl, asc = cn.lvl == null ? H.ascPhase(lvl) : cn.asc || 0;
      return { lvl, asc, cap: H.ascCap(asc) };
    },

    coneStatsOf(cn) {
      const holder = Object.values(this.state.roster).find(r => r.cone === cn.uid), L = this.coneLvlOf(cn, holder);
      return H.coneStatsAt(cn.id, L.lvl, L.asc);
    },

    coneFix(cn) {
      if (!cn) return null;
      if (cn.lvl == null) { const holder = Object.values(this.state.roster).find(r => r.cone === cn.uid); cn.lvl = holder ? holder.lvl : 1; cn.asc = H.ascPhase(cn.lvl); cn.exp = 0; }
      if (cn.exp == null) cn.exp = 0;
      if (cn.lock == null) cn.lock = false;
      return cn;
    },

    toggleConeLock(uid) {
      const cn = this.coneOf(uid);
      if (!cn) return false;
      cn.lock = !cn.lock;
      return cn.lock;
    },

    coneNeed(cn, lvl) { return A.coneExp[H.CONES[cn.id].rarity][Math.min(lvl, H.MAX_LVL - 1) - 1]; },

    coneBooks() { return AETHER.map(id => ({ id, exp: H.ITEMS[id].coneExp, have: this.state.inv.items[id] || 0 })); },

    coneCredits(exp) { return Math.round(exp / A.coneCredit * T.upCredit); },

    coneToCap(cn) {
      this.coneFix(cn);
      let n = -cn.exp;
      for (let l = cn.lvl; l < H.ascCap(cn.asc); l++) n += this.coneNeed(cn, l);
      return Math.max(0, n);
    },

    coneAfter(cn, gain) {
      this.coneFix(cn);
      const cap = H.ascCap(cn.asc);
      let lvl = cn.lvl, exp = cn.exp + gain;
      while (lvl < cap && exp >= this.coneNeed(cn, lvl)) { exp -= this.coneNeed(cn, lvl); lvl++; }
      return { lvl, exp: lvl >= cap ? 0 : exp };
    },

    coneAddExp(cn, gain) {
      const to = this.coneAfter(cn, gain);
      cn.lvl = to.lvl; cn.exp = to.exp;
    },

    coneSupMode() { return this.state.coneSup === 'manual' ? 'manual' : 'auto'; },

    setConeSup(mode) { this.state.coneSup = mode === 'manual' ? 'manual' : 'auto'; },

    coneWorn(uid) { return Object.values(this.state.roster).some(r => r.cone === uid); },

    coneCopies(cn) { return this.state.inv.cones.filter(x => x.id === cn.id && x.uid !== cn.uid && !this.coneWorn(x.uid) && !x.lock).sort((a, b) => (a.lvl || 1) - (b.lvl || 1) || (a.sup || 1) - (b.sup || 1)); },

    coneMerge(cn, donor) {
      const s = this.state;
      if (!cn || !donor || cn === donor || cn.id !== donor.id || this.coneWorn(donor.uid) || donor.lock) return null;
      const to = (cn.sup || 1) + (donor.sup || 1);
      if (to > 5) return null;
      cn.sup = to;
      s.inv.cones = s.inv.cones.filter(x => x.uid !== donor.uid);
      return { sup: to };
    },

    coneFree(cn) { return this.state.inv.cones.filter(x => x.uid !== cn.uid && !this.coneWorn(x.uid) && !x.lock); },

    coneFeedExp(uids) {
      const s = this.state;
      return uids.reduce((a, uid) => { const x = s.inv.cones.find(c => c.uid === uid); return a + (x ? A.coneFodder[H.CONES[x.id].rarity] : 0); }, 0);
    },

    coneFeedRisky(uids) {
      const s = this.state;
      return uids.some(uid => { const x = s.inv.cones.find(c => c.uid === uid); return x && ((x.lvl || 1) > 1 || (x.sup || 1) > 1 || H.CONES[x.id].rarity >= 5); });
    },

    coneUseExp(cn, picks, feed = []) {
      const s = this.state;
      this.coneFix(cn);
      if (cn.lvl >= H.ascCap(cn.asc)) return null;
      if (feed.some(uid => uid === cn.uid || this.coneWorn(uid) || !s.inv.cones.some(x => x.uid === uid && !x.lock))) return null;
      let gain = this.coneFeedExp(feed);
      for (const b of this.coneBooks()) { const n = picks[b.id] || 0; if (n < 0 || n > b.have) return null; gain += n * b.exp; }
      const cost = this.coneCredits(gain);
      if (gain <= 0 || s.credits < cost) return null;
      s.credits -= cost;
      for (const id of AETHER) { const n = picks[id] || 0; if (!n) continue; s.inv.items[id] -= n; if (!s.inv.items[id]) delete s.inv.items[id]; }
      if (feed.length) s.inv.cones = s.inv.cones.filter(x => !feed.includes(x.uid));
      const from = cn.lvl;
      this.coneAddExp(cn, gain);
      return { from, to: cn.lvl, gain, cost };
    },

    coneIsEnhanced(cn) {
      if (!cn) return false;
      return (cn.lvl == null ? 1 : cn.lvl) > 1 || (cn.exp || 0) > 0 || (cn.asc || 0) > 0 || (cn.sup || 1) > 1;
    },

    coneInvestedExp(cn) {
      if (!cn) return 0;
      let exp = cn.exp || 0;
      const lvl = cn.lvl == null ? 1 : cn.lvl;
      for (let l = 1; l < lvl; l++) exp += this.coneNeed(cn, l);
      return exp;
    },

    coneSalvageable(cn, opts = {}) {
      const d = cn && H.CONES[cn.id];
      if (!d || (d.rarity !== 3 && d.rarity !== 4) || this.coneWorn(cn.uid)) return false;
      const incEnh = typeof opts === 'boolean' ? opts : !!(opts && opts.includeEnhanced);
      if (!incEnh && this.coneIsEnhanced(cn)) return false;
      return true;
    },

    coneCanSalvage(cn, opts = {}) {
      return this.coneSalvageable(cn, opts) && !cn.lock;
    },

    coneSalvageableTotal(opts = {}) {
      return this.state.inv.cones.filter(cn => this.coneCanSalvage(cn, opts)).length;
    },

    sortCones(list, sortKey = 'rarity', dir = 1, opts = {}) {
      const s = this.state, idxMap = new Map();
      s.inv.cones.forEach((x, i) => idxMap.set(x.uid, i));
      const valOf = cn => {
        const d = H.CONES[cn.id];
        if (sortKey === 'lvl') return this.coneLvlOf(cn, Object.values(s.roster).find(r => r.cone === cn.uid)).lvl;
        if (sortKey === 'atk' || sortKey === 'def' || sortKey === 'hp') return this.coneStatsOf(cn)[sortKey];
        if (sortKey === 'uid') return typeof cn.uid === 'number' ? cn.uid : (idxMap.get(cn.uid) || 0);
        return d ? d.rarity : 0;
      };
      return list.slice().sort((a, b) => {
        const da = H.CONES[a.id], db = H.CONES[b.id];
        if (sortKey === 'name') {
          const cmp = (da ? da.name : '').localeCompare(db ? db.name : '', 'ru');
          if (cmp) return cmp * dir;
        } else {
          const diff = valOf(a) - valOf(b);
          if (diff) return diff * dir;
        }
        if (opts.salvage && !!a.lock !== !!b.lock) return a.lock ? 1 : -1;
        if (da && db && da.rarity !== db.rarity) return (da.rarity - db.rarity) * dir;
        if (a.id !== b.id) return a.id.localeCompare(b.id);
        return (idxMap.get(a.uid) || 0) - (idxMap.get(b.uid) || 0);
      });
    },

    coneSalvageList(sortKey = 'rarity', dir = 1, opts = {}) {
      if (sortKey && typeof sortKey === 'object') {
        opts = sortKey;
        dir = opts.sortDir || opts.dir || 1;
        sortKey = opts.sortKey || 'rarity';
      }
      const incEnh = typeof opts === 'boolean' ? opts : !!(opts && opts.includeEnhanced);
      const raw = this.state.inv.cones.filter(cn => this.coneSalvageable(cn, { includeEnhanced: incEnh }));
      return this.sortCones(raw, sortKey, dir, { salvage: true });
    },

    coneManageLock(mode) {
      const s = this.state;
      let changed = 0;
      if (mode === 'unlock4') {
        for (const cn of s.inv.cones) {
          const d = H.CONES[cn.id];
          if (d && d.rarity === 4 && cn.lock) { cn.lock = false; changed++; }
        }
        return changed;
      }
      if (mode === 'lock4_down') {
        for (const cn of s.inv.cones) {
          const d = H.CONES[cn.id];
          if (d && d.rarity <= 4 && !cn.lock) { cn.lock = true; changed++; }
        }
        return changed;
      }
      if (mode === 'unlock4_extra') {
        const groups = {};
        s.inv.cones.forEach((cn, idx) => {
          const d = H.CONES[cn.id];
          if (!d || d.rarity !== 4) return;
          (groups[cn.id] || (groups[cn.id] = [])).push({ cn, idx });
        });
        for (const items of Object.values(groups)) {
          items.sort((a, b) => {
            const wa = this.coneWorn(a.cn.uid) ? 0 : 1, wb = this.coneWorn(b.cn.uid) ? 0 : 1;
            if (wa !== wb) return wa - wb;
            const la = ((a.cn.lvl || 1) > 1 || (a.cn.exp || 0) > 0 || (a.cn.asc || 0) > 0) ? 0 : 1;
            const lb = ((b.cn.lvl || 1) > 1 || (b.cn.exp || 0) > 0 || (b.cn.asc || 0) > 0) ? 0 : 1;
            if (la !== lb) return la - lb;
            const sa = a.cn.sup || 1, sb = b.cn.sup || 1;
            if (sa !== sb) return sb - sa;
            const ka = a.cn.lock ? 0 : 1, kb = b.cn.lock ? 0 : 1;
            if (ka !== kb) return ka - kb;
            return a.idx - b.idx;
          });
          let kept = 0;
          for (const { cn } of items) {
            if (kept < 5) {
              if (!cn.lock) { cn.lock = true; changed++; }
              kept += (cn.sup || 1);
            } else if (this.coneSalvageable(cn) && cn.lock) {
              cn.lock = false;
              changed++;
            }
          }
        }
        return changed;
      }
      return 0;
    },

    coneSalvagePreview(uids) {
      const s = this.state, seen = new Set(), valid = [], totals = {};
      let hasRare4 = false, hasEnhanced = false, maxLvl = 1;
      for (const uid of (uids || [])) {
        if (seen.has(uid) || valid.length >= A.coneSalvageCap) continue;
        seen.add(uid);
        const cn = s.inv.cones.find(x => x.uid === uid);
        if (!cn || !this.coneCanSalvage(cn, { includeEnhanced: true })) continue;
        const d = H.CONES[cn.id], y = A.coneSalvageYield[d.rarity];
        if (!y) continue;
        valid.push(uid);
        const lv = cn.lvl || 1, sup = Math.max(1, cn.sup || 1);
        if (d.rarity >= 4) hasRare4 = true;
        if (this.coneIsEnhanced(cn)) hasEnhanced = true;
        if (lv > maxLvl) maxLvl = lv;
        totals[y.id] = (totals[y.id] || 0) + y.count * sup;
        const invExp = this.coneInvestedExp(cn);
        if (invExp > 0) {
          let refund = Math.floor(invExp * 0.8);
          if (lv > 1 && refund < 500) refund = 500;
          for (const id of ['aether3', 'aether2', 'aether1']) {
            const e = H.ITEMS[id].coneExp, n = Math.floor(refund / e);
            if (n > 0) { totals[id] = (totals[id] || 0) + n; refund -= n * e; }
          }
        }
      }
      const items = AETHER.filter(id => totals[id] > 0).map(id => ({ id, count: totals[id], name: H.ITEMS[id].name, rar: H.ITEMS[id].rar }));
      return { uids: valid, count: valid.length, hasRare4, hasEnhanced, maxLvl, items };
    },

    coneSalvage(uids) {
      const p = this.coneSalvagePreview(uids);
      if (!p.count) return null;
      const drop = new Set(p.uids), s = this.state;
      s.inv.cones = s.inv.cones.filter(x => !drop.has(x.uid));
      for (const it of p.items) s.inv.items[it.id] = (s.inv.items[it.id] || 0) + it.count;
      return p;
    },

    coneAscCost(cn, at) {
      const p = at == null ? this.coneFix(cn).asc : at;
      if (p >= 6) return null;
      const d = H.CONES[cn.id], row = A.coneCost[d.rarity][p], items = {}, line = Object.keys(H.TRACE_PATH_LINES).find(k => H.TRACE_PATH_LINES[k][0] === d.path);
      items[A.coneFoe[cn.id] + row.foe[0]] = row.foe[1];
      if (row.path) items[line + row.path[0]] = row.path[1];
      return { to: p + 1, credits: Math.round(row.cr * T.upCredit), tl: A.tl[p + 1], items };
    },

    coneAscInfo(cn) {
      const s = this.state, c = this.coneFix(cn), cost = this.coneAscCost(c), out = { asc: c.asc, cost, atCap: c.lvl >= H.ascCap(c.asc), why: null, short: [], synth: false };
      if (!cost) { out.why = 'max'; return out; }
      if (!out.atCap) { out.why = 'lvl'; return out; }
      out.short = Object.entries(cost.items).filter(([id, n]) => (s.inv.items[id] || 0) < n).map(([id]) => id);
      out.synth = out.short.length > 0 && this.ascSynthCovers(cost.items);
      if (this.trailLevel() < cost.tl) out.why = 'tl';
      else if (out.short.length) out.why = 'mats';
      else if (s.credits < cost.credits) out.why = 'credits';
      return out;
    },

    coneAscend(cn) {
      const s = this.state, info = this.coneAscInfo(cn);
      if (info.why) return null;
      s.credits -= info.cost.credits;
      for (const [id, n] of Object.entries(info.cost.items)) { s.inv.items[id] -= n; if (!s.inv.items[id]) delete s.inv.items[id]; }
      const from = cn.asc;
      cn.asc = info.cost.to;
      return { from, to: cn.asc, cap: H.ascCap(cn.asc) };
    },

    coneLimit(cn) {
      let p = this.coneFix(cn).asc;
      while (p < 6 && this.trailLevel() >= A.tl[p + 1]) p++;
      return H.ascCap(p);
    },

    conePlan(cn, target) {
      this.coneFix(cn);
      return planFor({ lvl: cn.lvl, exp: cn.exp, asc: cn.asc, limit: this.coneLimit(cn), need: l => this.coneNeed(cn, l), books: this.coneBooks(), credit: e => this.coneCredits(e), cost: p => this.coneAscCost(cn, p) }, target, this.state);
    },

    coneReach(cn) { return reachOf(this.coneFix(cn).lvl, this.coneLimit(cn), t => this.conePlan(cn, t)); },

    coneDefault(cn) { return defaultOf(this.coneFix(cn).lvl, this.coneReach(cn), this.coneLimit(cn), H.ascCap(cn.asc)); },

    coneApply(cn, target) {
      const plan = this.conePlan(cn, target);
      if (!plan.ok) return null;
      payPlan(this.state, plan, false);
      cn.asc = plan.ascTo;
      this.coneAddExp(cn, plan.sum);
      return plan;
    },

    upQuick(kind) { return !!(this.state.upQuick && this.state.upQuick[kind]); },

    setUpQuick(kind, on) { if (!this.state.upQuick) this.state.upQuick = {}; this.state.upQuick[kind] = !!on; },

    autoAscend(key) {
      let n = 0;
      for (;;) {
        const info = this.ascInfo(key);
        if (info.why === 'mats' && info.synth) this.matGather(info.cost.items);
        if (!this.ascend(key)) return n;
        n++;
      }
    },

    ascNoteDue() {
      const s = this.state;
      return T.ascOn && !s.flags.asc_note && s.party.slice(0, 4).some(k => { const r = s.roster[k]; return r && !r.guest && r.lvl >= this.levelCap(k) && r.lvl < H.MAX_LVL; });
    },

    fixAscension(old) {
      const st = this.state;
      for (const r of Object.values(st.roster)) if (r.asc == null) r.asc = H.ascPhase(r.lvl);
      const avg = st.party.length ? this.avgLevel() : 1;
      for (const cn of st.inv.cones) {
        if (cn.lvl != null) continue;
        const holder = Object.values(st.roster).find(r => r.cone === cn.uid);
        cn.lvl = holder ? holder.lvl : avg; cn.asc = H.ascPhase(cn.lvl); cn.exp = 0;
      }
      if (old && H.TL_ASC_ITEMS) for (const lvl of st.tlGot || []) for (const [id, n] of Object.entries(H.TL_ASC_ITEMS[lvl] || {})) st.inv.items[id] = (st.inv.items[id] || 0) + n;
      st.asv = 1;
    }
  });

  function pickExp(need, items, inv) {
    const out = {};
    let sum = 0;
    for (const it of items) { const n = Math.min(inv[it.id] || 0, Math.ceil(Math.max(0, need - sum) / it.exp)); out[it.id] = n; sum += n * it.exp; }
    for (const it of items) while (out[it.id] > 0 && sum - it.exp >= need) { out[it.id]--; sum -= it.exp; }
    return { out, sum };
  }
  H.pickExp = pickExp;

  function planFor(sub, target, state) {
    const to = H.clamp(target, sub.lvl, sub.limit), ascTo = Math.max(sub.asc, to <= 20 ? 0 : Math.ceil((to - 20) / 10)), items = {}, inv = state.inv.items;
    let need = -sub.exp, credits = 0;
    for (let l = sub.lvl; l < to; l++) need += sub.need(l);
    need = Math.max(0, need);
    for (let p = sub.asc; p < ascTo; p++) {
      const c = sub.cost(p);
      credits += c.credits;
      for (const [id, n] of Object.entries(c.items)) items[id] = (items[id] || 0) + n;
    }
    const pick = pickExp(need, sub.books, inv), short = Object.keys(items).filter(id => (inv[id] || 0) < items[id]);
    credits += sub.credit(pick.sum);
    let lvl = sub.lvl, exp = sub.exp + pick.sum;
    while (lvl < H.ascCap(ascTo) && exp >= sub.need(lvl)) { exp -= sub.need(lvl); lvl++; }
    const expShort = Math.max(0, need - pick.sum), creditsShort = Math.max(0, credits - state.credits);
    return { from: sub.lvl, target: to, to: lvl, exp: lvl >= H.ascCap(ascTo) ? 0 : exp, ascFrom: sub.asc, ascTo, need, sum: pick.sum, books: pick.out, items, credits, short, expShort, creditsShort, ok: to > sub.lvl && !short.length && !expShort && !creditsShort };
  }

  function reachOf(lvl, limit, plan) {
    let lo = lvl, hi = limit;
    while (lo < hi) { const m = Math.ceil((lo + hi) / 2); if (plan(m).ok) lo = m; else hi = m - 1; }
    return lo;
  }

  function defaultOf(lvl, reach, limit, cap) {
    if (reach > lvl) return reach;
    return Math.min(limit, lvl < cap ? cap : cap + 10);
  }

  function payPlan(state, plan, passes) {
    state.credits -= plan.credits;
    for (const [id, n] of Object.entries(Object.assign({}, plan.books, plan.items))) { if (!n) continue; state.inv.items[id] -= n; if (!state.inv.items[id]) delete state.inv.items[id]; }
    if (!passes) return 0;
    let pass = 0;
    for (let p = plan.ascFrom + 1; p <= plan.ascTo; p++) if (p % 2 === 1) pass++;
    if (pass) state.inv.items.pass = (state.inv.items.pass || 0) + pass;
    return pass;
  }

  const baseAlerts = H.Game.prototype.alerts;
  H.Game.prototype.alerts = function () {
    const out = baseAlerts.call(this);
    if (!out.chars) out.chars = Object.keys(this.state.roster).some(k => this.ascReady(k));
    return out;
  };

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
