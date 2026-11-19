(function (H) {
  'use strict';
  const SU = H.SU, TUN = SU.TUN;
  const blessDef = id => SU.BLESSINGS.find(b => b.id === id);
  const curioDef = id => SU.CURIOS.find(c => c.id === id);
  const worldDef = id => SU.WORLDS.find(w => w.id === id);
  const FIGHTS = ['combat', 'elite', 'boss'];
  const MOVED_WORLDS = [[4, 6], [3, 4], [2, 3]];
  const prevWorld = w => SU.WORLDS.slice(0, SU.WORLDS.indexOf(w)).reverse().find(x => !x.soon) || null;
  const clearKey = (w, d) => 'su_clear_' + w.id + (d > 1 ? '_' + d : '');
  const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
  const weekStart = ms => {
    const d = new Date(ms);
    d.setHours(4, 0, 0, 0);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    if (d.getTime() > ms) d.setDate(d.getDate() - 7);
    return d.getTime();
  };
  const weekEnd = start => { const d = new Date(start); d.setDate(d.getDate() + 7); return d.getTime(); };
  const domPts = (max, n, d) => Math.round(max * (d + 1) / n) - Math.round(max * d / n);
  const domLvl = (w, d, i) => { const [a, b] = w.diff[d - 1].lvl, n = w.plan.length - 1; return a + Math.round((b - a) * Math.min(i, n) / n); };

  Object.assign(H.Game.prototype, {
    suRun() { return this.state.su || null; },
    suPaths() { return this.state.suPaths || (this.state.suPaths = []); },
    suWorld() { const su = this.suRun(); return su ? worldDef(su.world) : null; },

    suWorldOpen(w) {
      if (w.soon) return false;
      if (!this.suFirst(w)) return true;
      const prev = prevWorld(w);
      return (!prev || !this.suFirst(prev)) && this.cond(w.story);
    },
    suNeedText(w) {
      if (w.soon) return 'Мир ещё строится. Скоро.';
      const prev = prevWorld(w);
      if (!prev) return 'Сначала пройдите учебный тест Герты.';
      return 'Нужно: ' + prev.name + ' и миссия «' + w.mission + '».';
    },
    fixSuWorlds(old) {
      const s = this.state;
      if (old) {
        const f = s.flags, move = id => (MOVED_WORLDS.find(([a]) => a === id) || [0, id])[1];
        for (const [a, b] of MOVED_WORLDS) if (f['su_clear_' + a]) { f['su_clear_' + b] = true; delete f['su_clear_' + a]; }
        for (const c of s.suClaims || []) c.world = move(c.world);
        if (s.su) s.su.world = move(s.su.world);
        if (s.hertaShop && Array.isArray(s.hertaShop.worldBonds)) s.hertaShop.worldBonds = s.hertaShop.worldBonds.map(move);
        if (s.profile && Array.isArray(s.profile.log)) for (const e of s.profile.log) if (e.kind === 'su') e.id = move(e.id);
      }
      s.suv = 1;
    },
    suFirst(w, d = 1) { return !this.state.flags[clearKey(w, d)]; },
    suRoman(d) { return ROMAN[d - 1]; },
    suDiffOpen(w, d) {
      const row = w.diff[d - 1];
      if (!row || !this.suWorldOpen(w)) return false;
      return d === 1 || (!this.suFirst(w, d - 1) && this.suEq() >= row.eq);
    },
    suDiffNeed(w, d) {
      const row = w.diff[d - 1];
      if (!this.suWorldOpen(w)) return this.suNeedText(w);
      if (d > 1 && this.suFirst(w, d - 1)) return 'Нужно пройти сложность ' + ROMAN[d - 2] + '.';
      return 'Нужен уровень Равновесия ' + row.eq + '.';
    },
    suDiffLvl(w, d) { return w.diff[d - 1].lvl; },
    suReward(w, first, d = 1) {
      if (!first) return { jade: 0, credits: 0, sets: 0, power: 0 };
      if (d > 1) return { jade: TUN.diffJade, credits: TUN.diffCredits, sets: 1, power: 0 };
      return { jade: TUN.jade * TUN.firstMult, credits: TUN.credits * TUN.firstMult, sets: TUN.firstSets, power: 0 };
    },
    suOrnReward(w) { return w.sets.length ? { jade: TUN.jade, credits: TUN.credits, sets: 1, power: TUN.power } : null; },
    suImm() { return this.state.inv.items.immersifier || 0; },
    suBuyImm() {
      const s = this.state;
      if (s.power < TUN.power || this.suImm() >= TUN.immMax) return false;
      s.power -= TUN.power;
      s.inv.items.immersifier = this.suImm() + 1;
      return true;
    },
    suExchange(pay) {
      const s = this.state, su = s.su, p = this.pending;
      if (!su || !p || p.ui !== 'su_orn' || p.left <= 0) return null;
      if (pay === 'imm') { if (this.suImm() < 1) return null; s.inv.items.immersifier--; }
      else { if (s.power < TUN.power) return null; s.power -= TUN.power; }
      const w = worldDef(su.world), dm = w.diff[(su.diff || 1) - 1], got = { set: this.suDropSet(w), rl: Math.min(15, dm.orn + this.rng.int(3)) };
      p.left--;
      (su.ornGot = su.ornGot || []).push(got);
      return this.give({ jade: TUN.jade, credits: TUN.credits, ornament: [got] });
    },
    suClaims() { return this.state.suClaims || (this.state.suClaims = []); },

    suStart(worldId, path, team, opts = {}) {
      const s = this.state, w = worldDef(worldId);
      const diff = opts.diff || 1;
      if (!w || this.suRun() || !w.diff[diff - 1] || (!opts.tut && (!this.suDiffOpen(w, diff) || !this.suPaths().includes(path)))) return false;
      const keys = [...new Set(team || s.party)].filter(k => s.roster[k]).slice(0, 4);
      if (!keys.length) return false;
      for (const k of Object.keys(s.broken)) if (k.startsWith('su')) delete s.broken[k];
      if (!opts.tut) s.suPick = { world: w.id, diff };
      s.su = { world: w.id, diff, path, team: keys, hp: {}, en: {}, d: -1, dom: null, bless: [], curios: [], frag: TUN.fragStart + (opts.tut ? 0 : this.suTreeSum('frag')), rerolls: opts.tut ? 0 : this.suTreeSum('reroll'), pts: 0, seen: [], tut: !!opts.tut, bank: 0, wins: 0, elites: 0, log: [], back: { map: this.map.id, x: this.player.x, y: this.player.y } };
      for (const k of keys) { s.su.hp[k] = null; s.su.en[k] = 0; }
      if (opts.tut) this.setQuest('su_beta', 'run');
      this.emit({ t: 'sfx', id: 'warp' });
      this.suEnter(w.plan[0][0]);
      return true;
    },

    suEnter(type) {
      const s = this.state, su = s.su, w = worldDef(su.world), rng = this.rng;
      su.d++;
      const d = su.d, lvl = domLvl(w, su.diff || 1, d), layouts = SU.LAYOUTS[type];
      const dom = { type, layout: layouts[rng.int(layouts.length)], lvl, groups: {}, done: {}, used: {}, cleared: false, next: [], event: null, final: false };
      const pick = list => list[rng.int(list.length)];
      if (type === 'combat') {
        dom.groups[1] = { g: pick(w.pools.normal).slice(), lvl };
        if (rng() < 0.65) dom.groups[2] = { g: pick(w.pools.normal).slice(), lvl, optional: true };
      } else if (type === 'elite') dom.groups[1] = { g: pick(w.pools.elite).slice(), lvl, elite: true, bug: su.log.includes('elite') };
      else if (type === 'boss') { const b = pick(w.pools.boss); dom.groups[1] = { g: b.waves[0].slice(), waves: b.waves, lvl, boss: true }; }
      else if (type === 'respite') { dom.cleared = true; dom.final = d === w.plan.length - 2; }
      else dom.event = su.tut && type === 'event' ? 'stephen' : this.suPickEvent(type);
      if (dom.event) this.suArchNote('ev', dom.event);
      const nextPlan = w.plan[d + 1];
      if (nextPlan) { const opts = nextPlan.slice(); while (opts.length) dom.next.push(opts.splice(rng.int(opts.length), 1)[0]); dom.next = dom.next.slice(0, 3); }
      su.dom = dom;
      su.log.push(type);
      const interest = this.suCurioRun('interest');
      if (interest && d > 0) { const n = Math.floor(su.frag * interest); if (n > 0) { su.frag += n; this.toast('Золотая монета раскола: +' + n + ' фрагментов'); } }
      this.loadMap(dom.layout, 's', { silent: true });
      const name = w.name + ' · ' + SU.DOMAINS[type].name;
      this.emit({ t: 'map', id: dom.layout, name: 'Виртуальная вселенная: ' + name, music: type === 'boss' ? 'boss' : 'sim' });
      this.emit({ t: 'autosave' });
      if (su.tut && H.SU.SCRIPTS['su_tut_' + type + '_' + d]) this.runScript('su_tut_' + type + '_' + d);
      return dom;
    },

    suPickEvent(kind) {
      const su = this.state.su, pool = Object.entries(SU.EVENTS).filter(([, e]) => e.kind === kind && (!e.worlds || e.worlds.includes(su.world)));
      const fresh = pool.filter(([id]) => !su.seen.includes(id)), list = fresh.length ? fresh : pool;
      if (!list.length) return null;
      const [id] = list[this.rng.int(list.length)];
      su.seen.push(id);
      return id;
    },

    suGroup(ch) {
      const su = this.state.su;
      if (!su || !su.dom || su.dom.done[ch]) return null;
      return su.dom.groups[ch] || null;
    },

    suPortal(slot) {
      const dom = this.state.su && this.state.su.dom;
      return dom && dom.cleared ? dom.next[slot] || null : null;
    },

    suNext(slot) {
      const type = this.suPortal(slot);
      if (!type || this.busy()) return false;
      this.suDomDone();
      this.emit({ t: 'sfx', id: 'warp' });
      this.suEnter(type);
      return true;
    },

    suCurioRun(key) {
      const su = this.state.su;
      if (!su) return null;
      for (const c of su.curios) { const d = curioDef(c.id); if (!c.broken && d && d.run && d.run[key] != null) return d.run[key]; }
      return null;
    },

    suUseCurio(key) {
      const su = this.state.su;
      const c = su.curios.find(x => { const d = curioDef(x.id); return !x.broken && d && d.run && d.run[key] != null; });
      if (!c) return false;
      const d = curioDef(c.id);
      if (d.uses) { c.uses = (c.uses == null ? d.uses : c.uses) - 1; if (c.uses <= 0) { c.broken = true; this.toast('Диковина «' + d.name + '» сломалась.'); } }
      return true;
    },

    suSpecStats(k) {
      const st = this.charStats(k), su = this.state.su;
      let hpP = 0;
      for (const b of su.bless) { const d = blessDef(b.id); for (const f of d.fx) if (f.on === 'spec' && f.s === 'hpP') hpP += Array.isArray(f.v) ? f.v[b.lvl > 1 ? 1 : 0] : f.v; }
      hpP += this.suTreeSum('hpP');
      if (hpP) st.hp = Math.round(st.hp * (1 + hpP));
      const atkP = this.suTreeSum('atkP'), defP = this.suTreeSum('defP'), spdP = this.suTreeSum('spdP');
      if (atkP) st.atk = Math.round(st.atk * (1 + atkP));
      if (defP) st.def = Math.round(st.def * (1 + defP));
      if (spdP) st.spd = Math.round(st.spd * (1 + spdP));
      st.critR += this.suTreeSum('critR');
      return st;
    },

    suPartySpecs() {
      const s = this.state, su = s.su;
      return this.suTeam().map(k => {
        const st = this.suSpecStats(k), hp = su.hp[k];
        return { key: k, charId: this.kitOf(k), name: k === 'trail' ? s.name : undefined, lvl: s.roster[k].lvl, stats: st, hp: hp == null ? st.hp : Math.min(hp, st.hp), energy: su.en[k] || 0, cone: this.coneEffect(k), sets: this.planarSets(k), tr: this.traceSpec(k), eid: s.roster[k].eid || 0 };
      });
    },

    suTeam() { const s = this.state, su = s.su; return su.team.filter(k => s.roster[k]).sort((a, b) => (s.party.indexOf(a) + 1 || 9) - (s.party.indexOf(b) + 1 || 9)); },

    suBattleOpts() { const su = this.state.su; return { forms: (su.forms || []).slice(), path: su.path, bless: su.bless.map(b => ({ id: b.id, lvl: b.lvl })), curios: su.curios.map(c => ({ id: c.id, broken: !!c.broken })), resStart: su.tut ? 0 : this.suTreeSum('resStart'), enStart: su.tut ? 0 : this.suTreeSum('enStart') }; },

    suHpOf(k) { const su = this.state.su, st = this.suSpecStats(k), hp = su.hp[k]; return { cur: hp == null ? st.hp : Math.min(hp, st.hp), max: st.hp }; },

    suHealTeam(f) {
      const su = this.state.su;
      for (const k of su.team) { const { cur, max } = this.suHpOf(k); if (cur > 0) su.hp[k] = Math.min(max, Math.round(cur + max * f)); }
    },

    suReviveAll(full) {
      const su = this.state.su;
      let n = 0;
      for (const k of su.team) { const { cur, max } = this.suHpOf(k); if (cur <= 0) { su.hp[k] = full ? max : Math.round(max * 0.5); n++; } }
      return n;
    },

    suDowned() { const su = this.state.su; return su ? su.team.filter(k => this.suHpOf(k).cur <= 0) : []; },

    suEncounter(e, ambush) {
      const g = e.def, su = this.state.su, w = worldDef(su.world), dm = w.diff[(su.diff || 1) - 1], bug = !!g.bug;
      const B = TUN.berserk, fight = { berserk: g.boss ? B.boss : g.elite ? B.elite : 0, bug, complete: !!g.boss, fullEn: !su.tut && !!(g.boss || g.elite) && this.suTreeSum('eliteEn') > 0 };
      const o = { su: fight, ent: e, lvl: g.lvl, ambush, bg: 'sim', noFlee: true, boss: !!g.boss, music: g.boss ? w.music : g.elite ? 'boss' : 'battle', foeHp: (g.boss ? w.bossHp : g.elite ? TUN.eliteHp : 1) * dm.hp, foeAtk: (g.boss ? w.bossAtk : g.elite ? w.atk * TUN.eliteAtk : w.atk) * dm.atk, suHp: JSON.parse(JSON.stringify(su.hp)), suEn: JSON.parse(JSON.stringify(su.en)) };
      if (g.waves) o.waves = g.waves.map((wv, i) => wv.map(id => id + ':' + (g.lvl + (g.waves.length > 1 && i === 0 ? -2 : 0))));
      else o.enemies = g.g.map(id => id + ':' + g.lvl);
      return this.startBattle(o);
    },

    suFight(pool) {
      const su = this.state.su, w = worldDef(su.world), dm = w.diff[(su.diff || 1) - 1], dom = su.dom, list = w.pools[pool] || w.pools.elite;
      const g = pool === 'trotter' ? ['trotter', 'trotter', 'trotter'] : pool === 'legion' ? ['trampler', 'reaver', 'eliminator'] : list[this.rng.int(list.length)];
      return this.startBattle({ su: true, suFight: true, lvl: dom.lvl + 1, enemies: g.map(id => id + ':' + (dom.lvl + 1)), bg: 'sim', noFlee: true, music: 'boss', foeHp: (pool === 'trotter' ? 1 : TUN.eliteHp) * dm.hp, foeAtk: (pool === 'trotter' ? w.atk : w.atk * TUN.eliteAtk) * dm.atk, suHp: JSON.parse(JSON.stringify(su.hp)), suEn: JSON.parse(JSON.stringify(su.en)), fromScript: true });
    },

    suEndBattle(b, ctx, out) {
      const s = this.state, su = s.su, r = b.result;
      for (const a of r.allies) if (su.team.includes(a.key)) { su.hp[a.key] = a.hp; su.en[a.key] = a.energy; }
      this.battle = null;
      out.su = true;
      if (!r.win) {
        this.battleCtx = Object.assign(ctx, { lost: true });
        out.lost = true;
        out.fromScript = !!su.tut;
        out.suFail = !su.tut;
        return out;
      }
      this.battleCtx = null;
      su.wins++;
      const g = ctx.ent ? ctx.ent.def : null, elite = !!(g && g.elite) || !!ctx.o.suFight, boss = !!(g && g.boss);
      const fragP = this.suCurioRun('fragP') || 0;
      const gain = Math.round((elite ? TUN.fragElite : boss ? 0 : TUN.fragWin) * (1 + fragP));
      su.frag += gain;
      out.frag = gain; out.exp = 0; out.credits = 0; out.jade = 0; out.items = [];
      for (const u of b.enemies) if (u.dead && s.bank.enemies[u.id]) s.bank.enemies[u.id].kills++;
      if (ctx.ent) { ctx.ent.dead = true; su.dom.done[ctx.ent.ch] = true; if (ctx.ent.ch === '1') su.dom.cleared = true; }
      const heal = this.suCurioRun('winHeal');
      if (heal) this.suHealTeam(heal);
      if (this.suDowned().length && this.suCurioRun('winRevive') && this.suUseCurio('winRevive')) { this.suReviveAll(true); this.toast('Плод инопланетного дерева воскресил павших.'); }
      if (boss) {
        su.queue = [];
        if (!su.tut && worldDef(su.world).sets.length) { su.queue.push({ type: 'ui', ui: 'su_orn', left: TUN.ornBoss, final: true }); this.suFlush(); }
        else this.suComplete();
        return out;
      }
      su.queue = su.queue || [];
      if (ctx.o.suFight) { this.suFlush(); return out; }
      const w = worldDef(su.world), aeon = su.tut ? (su.wins === 1 && !this.suPaths().includes('preservation') ? { path: 'preservation' } : null)
        : (w.aeons || []).find(a => a.after === (elite ? 'elite' : 'first') && !this.suPaths().includes(a.path) && (a.after !== 'first' || su.wins === 1));
      if (aeon) su.queue.push({ type: 'script', name: 'su_aeon_' + aeon.path });
      if (elite) {
        su.elites++;
        su.queue.push({ type: 'ui', ui: 'su_bless', opts: [], rar: 3, why: 'Элита повержена' });
        su.queue.push({ type: 'ui', ui: 'su_curio', opts: [], why: 'Награда за элиту' });
        if (!su.tut && w.sets.length) su.queue.push({ type: 'ui', ui: 'su_orn', left: TUN.ornElite });
      } else if (!aeon) su.queue.push({ type: 'ui', ui: 'su_bless', opts: [], why: 'Победа в бою' });
      if (su.wins === 1 && !su.tut && this.suTreeSum('extraBless')) su.queue.push({ type: 'ui', ui: 'su_bless', opts: [], why: 'Древо способностей: ещё одно благословение' });
      this.suFlush();
      return out;
    },

    suFlush() {
      const su = this.state.su;
      if (!su || this.pending || this.battle || !su.queue || !su.queue.length) return;
      const q = su.queue.shift();
      if (q.type === 'script') { this.runScript(q.name); return; }
      if (q.ui === 'su_bless' && !q.opts.length) q.opts = this.suOffer({ rar: q.rar });
      if (q.ui === 'su_curio' && !q.opts.length) q.opts = this.suCurioOffer();
      if ((q.ui === 'su_bless' || q.ui === 'su_curio') && !q.opts.length) { su.frag += 40; this.toast('Выбирать больше нечего: +40 фрагментов'); this.suFlush(); return; }
      this.pending = Object.assign({ type: 'ui' }, q);
    },

    suOffer(o = {}) {
      const su = this.state.su, paths = this.suPaths(), owned = new Set(su.bless.map(b => b.id)), rng = this.rng;
      const banned = this.suCanBan() ? this.suBans().filter(p => p !== su.path) : [];
      let pool = SU.BLESSINGS.filter(b => paths.includes(b.path) && !owned.has(b.id) && !banned.includes(b.path));
      if (o.path) { const own = pool.filter(b => b.path === o.path); if (own.length) pool = own; }
      const waxes = su.curios.filter(c => !c.broken && curioDef(c.id).run && curioDef(c.id).run.wax).map(c => curioDef(c.id).run.wax);
      const out = [], late = su.d >= Math.floor(worldDef(su.world).plan.length / 2);
      let three = !o.rar && this.suCurioRun('nextThree') ? this.suUseCurio('nextThree') : false;
      for (let i = 0; i < 3 && pool.length; i++) {
        let rar = o.rar;
        if (!rar) { const dist = late ? TUN.combatRarLate : TUN.combatRar, x = rng(); rar = x < dist[0] ? 1 : x < dist[0] + dist[1] ? 2 : 3; }
        if (three) { rar = 3; three = false; }
        const x = rng(), others = paths.filter(p => p !== su.path);
        let path = x < TUN.pathWeight ? su.path : waxes.length && x < TUN.pathWeight + TUN.waxWeight ? waxes[rng.int(waxes.length)] : others.length ? others[rng.int(others.length)] : su.path;
        if (o.path) path = o.path;
        let cands = pool.filter(b => b.path === path && b.rar === rar);
        if (!cands.length) cands = pool.filter(b => b.rar === rar);
        if (!cands.length) cands = pool.filter(b => b.path === path);
        if (!cands.length) cands = pool;
        const b = cands[rng.int(cands.length)];
        out.push(b.id);
        pool = pool.filter(x2 => x2 !== b);
      }
      return out;
    },

    suCurioOffer() {
      const su = this.state.su, owned = new Set(su.curios.map(c => c.id));
      const pool = SU.CURIOS.filter(c => !c.bad && !owned.has(c.id) && (!c.path || this.suPaths().includes(c.path)));
      const out = [];
      for (let i = 0; i < 3 && pool.length; i++) out.push(pool.splice(this.rng.int(pool.length), 1)[0].id);
      return out;
    },

    suAddBless(id, lvl) {
      const su = this.state.su, d = blessDef(id);
      if (!d || su.bless.some(b => b.id === id)) return false;
      const before = this.suOwnCount();
      su.bless.push({ id, lvl: lvl || (d.rar === 1 && this.suCurioRun('enhanceOne') ? 2 : 1) });
      this.suArchNote('bless', id);
      if (before < 3 && this.suOwnCount() >= 3) this.toast('Резонанс Пути открыт: «' + SU.PATHS[su.path].name + '». В бою он копит энергию, клавиша F.');
      const now = this.suOwnCount();
      if (TUN.formAt.some(n => before < n && now >= n)) {
        const opts = this.suFormOffer();
        if (opts.length) (su.queue = su.queue || []).push({ type: 'ui', ui: 'su_form', opts, why: 'Благословений Пути: ' + now });
      }
      return true;
    },

    suFormOffer() {
      const su = this.state.su, had = su.forms || [];
      return SU.FORMS.filter(f => f.path === su.path && !had.includes(f.id)).map(f => f.id);
    },

    suAddForm(id) {
      const su = this.state.su, f = SU.FORMS.find(x => x.id === id);
      if (!f || f.path !== su.path) return false;
      su.forms = su.forms || [];
      if (su.forms.includes(id)) return false;
      su.forms.push(id);
      this.toast(f.name);
      return true;
    },

    suBans() { return this.state.suBan || (this.state.suBan = []); },
    suCanBan() { return this.suPaths().length >= Object.keys(SU.PATHS).length; },
    suToggleBan(path) {
      const bans = this.suBans();
      if (!this.suCanBan() || !SU.PATHS[path]) return false;
      const i = bans.indexOf(path);
      if (i >= 0) { bans.splice(i, 1); return true; }
      if (bans.length >= 2) return false;
      bans.push(path);
      return true;
    },

    suOwnCount() { const su = this.state.su; return su.bless.filter(b => blessDef(b.id).path === su.path).length; },

    suAddCurio(id) {
      const su = this.state.su, d = curioDef(id);
      if (!d || su.curios.some(c => c.id === id)) return false;
      su.curios.push({ id, uses: d.uses == null ? null : d.uses, broken: false });
      this.suArchNote('cur', id);
      if (d.instant === 'blessRandom') { const n = 1 + this.rng.int(2); for (const b of this.suOffer({}).slice(0, n)) this.suAddBless(b); }
      if (d.instant === 'enhance2') this.suEnhanceRandom(2);
      if (d.instant === 'wax') { const b = this.suOffer({ path: d.path })[0]; if (b) this.suAddBless(b); }
      return true;
    },

    suEnhanceRandom(n) {
      const su = this.state.su, list = su.bless.filter(b => b.lvl < 2);
      let done = 0;
      while (done < n && list.length) { const b = list.splice(this.rng.int(list.length), 1)[0]; b.lvl = 2; done++; }
      return done;
    },

    suCost(base, kind) {
      const off = kind === 'trade' ? this.suCurioRun('tradeOff') || 0 : this.suCurioRun('discount') || 0;
      const tax = kind === 'enhance' ? this.suCurioRun('tax') || 0 : 0;
      return Math.round(base * (1 - off) * (1 + tax));
    },

    suEnhanceCost(id) { const d = blessDef(id); return this.suCost(TUN.enhanceCost[d.rar], 'enhance'); },

    suEnhance(id) {
      const su = this.state.su, b = su && su.bless.find(x => x.id === id);
      if (!b || b.lvl > 1) return false;
      const cost = this.suEnhanceCost(id);
      if (su.frag < cost) return false;
      su.frag -= cost;
      b.lvl = 2;
      return true;
    },

    suShop() {
      const su = this.state.su, dom = su.dom, down = this.suDowned().length;
      const list = [
        { id: 'bless', name: 'Купить благословение 1★', cost: this.suCost(TUN.blessCost) },
        { id: 'curio', name: 'Купить диковину', cost: this.suCost(TUN.curioCost) },
        { id: 'enhance2', name: 'Усилить 2 случайных благословения', cost: this.suCost(TUN.enhance2Cost, 'enhance'), off: !su.bless.some(b => b.lvl < 2) },
        { id: 'revive', name: 'Воскресить павших', cost: this.suCost(TUN.reviveCost) * Math.max(1, down), off: !down }
      ];
      if (dom.final) list.push({ id: 'enhance', name: 'Усилить выбранное благословение', cost: 0, off: !su.bless.some(b => b.lvl < 2) });
      if (su.bank > 0 && dom.final) list.push({ id: 'bank', name: 'Забрать вклад из Банка времени', cost: 0, gain: su.bank });
      return list.filter(x => !(dom.bought || []).includes(x.id) || x.id === 'enhance');
    },

    suShopBuy(id) {
      const su = this.state.su, dom = su.dom, e = this.suShop().find(x => x.id === id);
      if (!e || e.off || su.frag < e.cost) return false;
      su.frag -= e.cost;
      if (id !== 'enhance') (dom.bought = dom.bought || []).push(id);
      const back = this.pending && this.pending.ui === 'su_shop' ? this.pending : null;
      if (id === 'bless') this.pending = { type: 'ui', ui: 'su_bless', opts: this.suOffer({ rar: 1 }), why: 'Покупка у Герты', back };
      else if (id === 'curio') this.pending = { type: 'ui', ui: 'su_curio', opts: this.suCurioOffer(), why: 'Покупка у Герты', back };
      else if (id === 'enhance2') this.suEnhanceRandom(2);
      else if (id === 'revive') this.suReviveAll(false);
      else if (id === 'bank') { su.frag += su.bank; su.bank = 0; }
      else if (id === 'enhance') this.pending = { type: 'ui', ui: 'su_enhance', back };
      return true;
    },

    suResolve(p, val) {
      const su = this.state.su;
      if (!su) return;
      if (p.ui === 'su_bless') {
        const n = this.suCurioRun('twoPicks') && p.opts.length > 1 ? 2 : 1;
        const picks = [].concat(val == null ? [0] : val).slice(0, n);
        if (n === 2 && picks.length === 2) this.suUseCurio('twoPicks');
        for (const i of picks) if (p.opts[i]) this.suAddBless(p.opts[i], p.enh ? 2 : 0);
      }
      if (p.ui === 'su_curio' && p.opts.length) this.suAddCurio(p.opts[val == null ? 0 : val] || p.opts[0]);
      if (p.ui === 'su_form' && p.opts.length) this.suAddForm(p.opts[val == null ? 0 : val] || p.opts[0]);
      if (p.ui === 'su_end') { this.suExit(); return; }
      if (p.ui === 'su_orn' && p.final) { this.pending = null; this.suComplete(); return; }
      if (p.back) { this.pending = p.back; return; }
      this.suFlush();
    },

    suOp(st) {
      const su = this.state.su;
      if (!su) return false;
      switch (st.su) {
        case 'frag': su.frag = Math.max(0, su.frag + st.n); if (!this.skipping) this.toast((st.n > 0 ? '+' : '') + st.n + ' космических фрагментов'); return false;
        case 'hp':
          for (const k of su.team) { const { cur, max } = this.suHpOf(k); if (cur > 0) su.hp[k] = Math.max(1, Math.min(max, Math.round(cur + max * st.v))); }
          return false;
        case 'bless': {
          const opts = this.suOffer({ rar: st.rar, path: st.path === 'own' ? su.path : st.path });
          if (!opts.length) { su.frag += 40; return false; }
          this.pending = { type: 'ui', ui: 'su_bless', opts, enh: !!st.enh, why: st.why || 'Событие' };
          return true;
        }
        case 'pay': {
          const cost = st.trade ? this.suCost(st.n, 'trade') : st.n;
          if (su.frag < cost) { this.suLast = 'poor'; return false; }
          su.frag -= cost;
          this.suLast = 'ok';
          return false;
        }
        case 'curio':
          if (st.id) { this.suAddCurio(st.id); this.toast('Диковина: ' + curioDef(st.id).name); return false; }
          { const opts = this.suCurioOffer(); if (!opts.length) { su.frag += 40; return false; } this.pending = { type: 'ui', ui: 'su_curio', opts, why: st.why || 'Событие' }; }
          return true;
        case 'enhance': { const n = this.suEnhanceRandom(st.n || 1); if (n) this.toast('Усилено благословений: ' + n); return false; }
        case 'unlock': {
          const paths = this.suPaths();
          if (!paths.includes(st.path)) { paths.push(st.path); if (this.suUnlockPathBond) this.suUnlockPathBond(st.path); this.toast('Открыт Путь «' + SU.PATHS[st.path].name + '» в Виртуальной вселенной'); }
          return false;
        }
        case 'bank': if (su.frag >= st.n) { su.frag -= st.n; su.bank += st.n * 2; } return false;
        case 'lottery': {
          if (su.frag < st.cost) { this.suLast = 'poor'; return false; }
          su.frag -= st.cost;
          su.lotto = (su.lotto || 0) + 1;
          const x = this.rng();
          this.suLast = x < 0.45 ? 'curio' : x < 0.75 ? 'frag' : 'none';
          if (this.suLast === 'curio') { const c = this.suCurioOffer()[0]; if (c) this.suAddCurio(c); else this.suLast = 'frag'; }
          if (this.suLast === 'frag') su.frag += st.cost * 3;
          return false;
        }
        case 'swap': {
          const low = su.bless.filter(b => blessDef(b.id).rar < 3).sort((a, b) => blessDef(a.id).rar - blessDef(b.id).rar)[0];
          if (!low) { this.suLast = 'none'; return false; }
          su.bless = su.bless.filter(b => b !== low);
          const rar = Math.min(3, blessDef(low.id).rar + 1), n = this.suOffer({ rar })[0];
          if (n) this.suAddBless(n);
          this.suLast = 'ok';
          return false;
        }
        case 'sell': {
          if (!su.bless.length) { this.suLast = 'none'; return false; }
          const b = su.bless.splice(this.rng.int(su.bless.length), 1)[0];
          su.frag += 60;
          this.toast('Продано: «' + blessDef(b.id).name + '», +60 фрагментов');
          this.suLast = 'ok';
          return false;
        }
        case 'energy': for (const k of su.team) su.en[k] = Math.min(H.CHARS[this.kitOf(k)].energy, (su.en[k] || 0) + st.v); return false;
        case 'fight': this.skipping = false; this.suFight(st.pool || 'elite'); return true;
        case 'reward':
          su.queue = su.queue || [];
          su.queue.push({ type: 'ui', ui: 'su_bless', opts: [], rar: st.rar || 3, why: st.why || 'Награда' });
          if (st.curio) su.queue.push({ type: 'ui', ui: 'su_curio', opts: [], why: st.why || 'Награда' });
          return false;
        case 'done': su.dom.cleared = true; return false;
        case 'end': this.suComplete(true); return true;
      }
      return false;
    },

    suCond(expr) {
      const su = this.state.su;
      if (!su) return false;
      const m = /^(frag|hp)([<>]=?)(\d+)$/.exec(expr);
      if (m) { const a = m[1] === 'frag' ? su.frag : 0, b = +m[3]; return m[2] === '>=' ? a >= b : m[2] === '>' ? a > b : m[2] === '<=' ? a <= b : a < b; }
      if (expr.startsWith('last=')) return this.suLast === expr.slice(5);
      if (expr.startsWith('lotto>=')) return (su.lotto || 0) >= +expr.slice(7);
      if (expr === 'final') return !!(su.dom && su.dom.final);
      if (expr === 'downed') return this.suDowned().length > 0;
      if (expr === 'bless') return su.bless.length > 0;
      return false;
    },

    suDropSet(w) {
      const list = w.sets.length ? w.sets : H.PLANAR_SETS;
      return list[this.rng.int(list.length)];
    },

    suComplete(scripted) {
      const s = this.state, su = s.su, w = worldDef(su.world);
      if (su.tut && !scripted && H.SU.SCRIPTS.su_aeon_remembrance && !this.suPaths().includes('remembrance')) { this.runScript('su_aeon_remembrance'); return; }
      const dn = su.diff || 1, dm = w.diff[dn - 1], first = this.suFirst(w, dn), rw = this.suReward(w, first, dn), res = { world: w.id, diff: dn, first, win: true, jade: rw.jade, credits: rw.credits, sets: [], got: (su.ornGot || []).slice(), frag: su.frag, bless: su.bless.length, curios: su.curios.length };
      for (let i = 0; i < rw.sets; i++) res.sets.push({ set: this.suDropSet(w), rl: Math.min(15, dm.orn + this.rng.int(3)) });
      s.flags[clearKey(w, dn)] = true;
      if (first && dn === 1 && this.profileNote) this.profileNote('su', w.id);
      if (su.tut) { s.flags.su_beta_run = true; this.setQuest('su_beta', 'report'); }
      if (first) {
        if (dn === 1 && w.tracks) res.tracks = 1;
        this.give({ jade: res.jade, credits: res.credits, ornament: res.sets.map(x => ({ set: x.set, rl: x.rl })), items: res.tracks ? { tracks: res.tracks } : null });
      }
      if (this.suAwardRun) Object.assign(res, this.suAwardRun(su, true, first));
      this.suDomDone();
      Object.assign(res, this.suSettle(su));
      su.result = res;
      this.pending = { type: 'ui', ui: 'su_end', res };
    },

    suFail() {
      const su = this.state.su;
      if (!su) return false;
      su.result = { world: su.world, diff: su.diff || 1, win: false, first: false, jade: 0, credits: 0, sets: [], frag: su.frag, bless: su.bless.length, curios: su.curios.length };
      if (this.suAwardRun) Object.assign(su.result, this.suAwardRun(su, false, false));
      Object.assign(su.result, this.suSettle(su));
      this.battleCtx = null;
      this.pending = { type: 'ui', ui: 'su_end', res: su.result };
      return true;
    },

    suAbort() {
      if (!this.suRun()) return false;
      this.suFail();
      return true;
    },

    suExit() {
      const s = this.state, su = s.su;
      if (!su) return;
      const tut = su.tut, won = su.result && su.result.win;
      s.su = null;
      this.pending = null;
      this.script = null;
      this.scriptQueue = [];
      for (const k of Object.keys(s.broken)) if (k.startsWith('su')) delete s.broken[k];
      this.loadMap('hs_office', 'u', { silent: true });
      const m = this.map.ents.find(e => e.kind === 'prop' && e.def.obj === 'su_machine');
      if (m) { const [x, y] = this.freeNear(m.x, m.y + 1); this.placePlayer(x, y); this.player.dir = 'up'; }
      this.emit({ t: 'map', id: 'hs_office', name: H.MAPS.hs_office.name, music: H.MAPS.hs_office.music });
      if (tut && won && H.SCRIPTS.su_beta_report) this.runScript('su_beta_report');
      this.emit({ t: 'autosave' });
    },

    suClaim(i) {
      const s = this.state, claims = this.suClaims(), c = claims[i];
      if (!c || s.power < TUN.power) return null;
      s.power -= TUN.power;
      claims.splice(i, 1);
      return this.give({ jade: TUN.jade, credits: TUN.credits, ornament: c.sets.map(x => ({ set: x.set, rl: x.rl })) });
    },

    suPtsMax(w, d = 1) {
      if (d === 1) return TUN.ptsWorld[w.id] || TUN.ptsTop;
      const lo = w.diff[d - 1].lvl[0], row = TUN.ptsHigh.find(([at]) => lo >= at);
      return row ? row[1] : TUN.ptsTop;
    },

    suDomDone() {
      const su = this.state.su;
      if (!su || su.tut || !su.dom || su.dom.counted) return 0;
      const w = worldDef(su.world), n = domPts(this.suPtsMax(w, su.diff || 1), w.plan.length, su.d);
      su.dom.counted = true;
      su.pts = (su.pts || 0) + n;
      return n;
    },

    suWeek() {
      const s = this.state, key = weekStart(this.now());
      if (!s.suWeek || s.suWeek.key !== key) s.suWeek = { key, pts: 0, got: [] };
      return s.suWeek;
    },

    suWeekLeft() { return weekEnd(this.suWeek().key) - this.now(); },

    suEq() { return this.equilibriumLevel ? this.equilibriumLevel() : 0; },

    suWeekStep() { return TUN.weekStep[Math.min(TUN.weekStep.length - 1, this.suEq())]; },

    suWeekMax() { return this.suWeekStep() * SU.WEEK(0).length; },

    suWeekRows() {
      const wk = this.suWeek(), step = this.suWeekStep();
      return SU.WEEK(this.suEq()).map((rw, i) => ({ at: step * (i + 1), rw, got: wk.got.includes(i), ok: wk.pts >= step * (i + 1) && !wk.got.includes(i) }));
    },

    suWeekClaim() {
      const wk = this.suWeek(), out = [];
      this.suWeekRows().forEach((r, i) => { if (r.ok) { wk.got.push(i); out.push(...this.give(r.rw)); } });
      return out.length ? out : null;
    },

    suTree() { return this.state.suTree || (this.state.suTree = { pts: 0, got: [] }); },

    suTreeSum(key) {
      const got = (this.state.suTree && this.state.suTree.got) || [];
      return SU.TREE.reduce((sum, n) => sum + (got.includes(n.id) && n.fx[key] ? n.fx[key] : 0), 0);
    },

    suTreeNeed(id) {
      const n = SU.TREE.find(x => x.id === id);
      if (!n) return null;
      const line = SU.TREE.filter(x => x.br === n.br);
      return line[line.indexOf(n) - 1] || null;
    },

    suTreeState(id) {
      const t = this.suTree(), n = SU.TREE.find(x => x.id === id);
      if (!n) return 'none';
      if (t.got.includes(id)) return 'got';
      const need = this.suTreeNeed(id);
      if (need && !t.got.includes(need.id)) return 'locked';
      return t.pts >= n.cost ? 'ready' : 'poor';
    },

    suTreeBuy(id) {
      if (this.suTreeState(id) !== 'ready') return false;
      const t = this.suTree(), n = SU.TREE.find(x => x.id === id);
      t.pts -= n.cost;
      t.got.push(id);
      return true;
    },

    suReroll(p) {
      const su = this.state.su;
      if (!su || !p || p.ui !== 'su_bless' || !(su.rerolls > 0)) return false;
      const opts = this.suOffer({ rar: p.rar });
      if (!opts.length) return false;
      su.rerolls--;
      p.opts = opts;
      return true;
    },

    suSettle(su) {
      if (su.tut) return {};
      const wk = this.suWeek(), w = worldDef(su.world), pts = su.pts || 0;
      const week = Math.max(0, Math.min(pts, this.suWeekMax() - wk.pts));
      wk.pts += week;
      const abil = w.id >= TUN.abilFrom ? Math.round(pts * TUN.abilRate) : 0;
      this.suTree().pts += abil;
      return { pts, week, weekNow: wk.pts, weekMax: this.suWeekMax(), abil };
    },

    suArch() { return this.state.suArch || (this.state.suArch = { cur: [], ev: [], bless: [], paid: { cur: [], ev: [], path: [] } }); },

    suArchNote(kind, id) {
      const list = this.suArch()[kind];
      if (!list.includes(id)) list.push(id);
    },

    suArchPathDone(path) {
      const got = this.suArch().bless;
      return SU.BLESSINGS.filter(b => b.path === path).every(b => got.includes(b.id));
    },

    suArchDue() {
      const a = this.suArch();
      const cur = a.cur.filter(id => !a.paid.cur.includes(id)), ev = a.ev.filter(id => !a.paid.ev.includes(id));
      const paths = Object.keys(SU.PATHS).filter(p => this.suArchPathDone(p) && !a.paid.path.includes(p));
      return { cur, ev, paths, jade: cur.length * TUN.archCurio + ev.length * TUN.archEvent + paths.length * TUN.archPath };
    },

    suArchClaim() {
      const a = this.suArch(), due = this.suArchDue();
      if (!due.jade) return null;
      a.paid.cur.push(...due.cur);
      a.paid.ev.push(...due.ev);
      a.paid.path.push(...due.paths);
      return this.give({ jade: due.jade });
    },

    suUseObject(e) {
      const su = this.state.su, dom = su.dom, key = e.x + ',' + e.y;
      if (dom.used[key]) { this.toast('Уже использовано.'); return true; }
      dom.used[key] = true;
      this.emit({ t: 'sfx', id: e.kind === 'su_heal' ? 'heal' : 'buff' });
      if (e.kind === 'su_heal') { this.suHealTeam(TUN.healObj); this.toast('Капсула восстановления: отряд вылечен на 30%'); }
      else { this.state.tp = Math.min(H.TUNING.tpMax, this.state.tp + 1); this.toast('+1 очко техники'); }
      return true;
    }
  });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
