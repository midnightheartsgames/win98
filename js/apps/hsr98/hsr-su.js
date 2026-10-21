(function (H) {
  'use strict';
  const SU = H.SU, TUN = SU.TUN;
  const blessDef = id => SU.BLESSINGS.find(b => b.id === id);
  const curioDef = id => SU.CURIOS.find(c => c.id === id);
  const worldDef = id => SU.WORLDS.find(w => w.id === id);
  const FIGHTS = ['combat', 'elite', 'boss'];

  Object.assign(H.Game.prototype, {
    suRun() { return this.state.su || null; },
    suPaths() { return this.state.suPaths || (this.state.suPaths = []); },
    suWorld() { const su = this.suRun(); return su ? worldDef(su.world) : null; },

    suWorldOpen(w) { return w.id === 1 ? !!this.state.flags.su_open : this.cond(w.need); },
    suFirst(w) { return !this.state.flags['su_clear_' + w.id]; },
    suReward(w, first) {
      return { jade: TUN.jade * (first ? TUN.firstMult : 1), credits: TUN.credits * (first ? TUN.firstMult : 1), sets: first ? TUN.firstSets : 1, power: first ? 0 : TUN.power };
    },
    suClaims() { return this.state.suClaims || (this.state.suClaims = []); },

    suStart(worldId, path, team, opts = {}) {
      const s = this.state, w = worldDef(worldId);
      if (!w || this.suRun() || (!opts.tut && (!this.suWorldOpen(w) || !this.suPaths().includes(path)))) return false;
      const keys = [...new Set(team || s.party)].filter(k => s.roster[k]).slice(0, 4);
      if (!keys.length) return false;
      for (const k of Object.keys(s.broken)) if (k.startsWith('su')) delete s.broken[k];
      s.su = { world: w.id, path, team: keys, hp: {}, en: {}, d: -1, dom: null, bless: [], curios: [], frag: TUN.fragStart, seen: [], tut: !!opts.tut, bank: 0, wins: 0, elites: 0, log: [], back: { map: this.map.id, x: this.player.x, y: this.player.y } };
      for (const k of keys) { s.su.hp[k] = null; s.su.en[k] = 0; }
      if (opts.tut) this.setQuest('su_beta', 'run');
      this.emit({ t: 'sfx', id: 'warp' });
      this.suEnter(w.plan[0][0]);
      return true;
    },

    suEnter(type) {
      const s = this.state, su = s.su, w = worldDef(su.world), rng = this.rng;
      su.d++;
      const d = su.d, lvl = w.lvl + Math.floor(d * 0.4), layouts = SU.LAYOUTS[type];
      const dom = { type, layout: layouts[rng.int(layouts.length)], lvl, groups: {}, done: {}, used: {}, cleared: false, next: [], event: null, final: false };
      const pick = list => list[rng.int(list.length)];
      if (type === 'combat') {
        dom.groups[1] = { g: pick(w.pools.normal).slice(), lvl };
        if (rng() < 0.65) dom.groups[2] = { g: pick(w.pools.normal).slice(), lvl, optional: true };
      } else if (type === 'elite') dom.groups[1] = { g: pick(w.pools.elite).slice(), lvl: lvl + 1, elite: true };
      else if (type === 'boss') { const b = pick(w.pools.boss); dom.groups[1] = { g: b.waves[0].slice(), waves: b.waves, lvl: lvl + 2, boss: true }; }
      else if (type === 'respite') { dom.cleared = true; dom.final = d === w.plan.length - 2; }
      else dom.event = su.tut && type === 'event' ? 'stephen' : this.suPickEvent(type);
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
      if (hpP) st.hp = Math.round(st.hp * (1 + hpP));
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

    suBattleOpts() { const su = this.state.su; return { path: su.path, bless: su.bless.map(b => ({ id: b.id, lvl: b.lvl })), curios: su.curios.map(c => ({ id: c.id, broken: !!c.broken })) }; },

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
      const g = e.def, su = this.state.su, w = worldDef(su.world);
      const o = { su: true, ent: e, lvl: g.lvl, ambush, bg: 'sim', noFlee: true, boss: !!g.boss, music: g.boss ? w.music : g.elite ? 'boss' : 'battle', foeHp: g.boss ? w.bossHp : g.elite ? TUN.eliteHp : 1, foeAtk: g.boss ? w.bossAtk : g.elite ? w.atk * TUN.eliteAtk : w.atk, suHp: JSON.parse(JSON.stringify(su.hp)), suEn: JSON.parse(JSON.stringify(su.en)) };
      if (g.waves) o.waves = g.waves.map((wv, i) => wv.map(id => id + ':' + (g.lvl + (g.waves.length > 1 && i === 0 ? -2 : 0))));
      else o.enemies = g.g.map(id => id + ':' + g.lvl);
      return this.startBattle(o);
    },

    suFight(pool) {
      const su = this.state.su, w = worldDef(su.world), dom = su.dom, list = w.pools[pool] || w.pools.elite;
      const g = pool === 'trotter' ? ['trotter', 'trotter', 'trotter'] : pool === 'legion' ? ['trampler', 'reaver', 'eliminator'] : list[this.rng.int(list.length)];
      return this.startBattle({ su: true, suFight: true, lvl: dom.lvl + 1, enemies: g.map(id => id + ':' + (dom.lvl + 1)), bg: 'sim', noFlee: true, music: 'boss', foeHp: pool === 'trotter' ? 1 : TUN.eliteHp, foeAtk: pool === 'trotter' ? w.atk : w.atk * TUN.eliteAtk, suHp: JSON.parse(JSON.stringify(su.hp)), suEn: JSON.parse(JSON.stringify(su.en)), fromScript: true });
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
      if (boss) { su.queue = []; this.suComplete(); return out; }
      su.queue = su.queue || [];
      if (ctx.o.suFight) { this.suFlush(); return out; }
      const w = worldDef(su.world), aeon = su.tut ? (su.wins === 1 && !this.suPaths().includes('preservation') ? { path: 'preservation' } : null)
        : (w.aeons || []).find(a => a.after === (elite ? 'elite' : 'first') && !this.suPaths().includes(a.path) && (a.after !== 'first' || su.wins === 1));
      if (aeon) su.queue.push({ type: 'script', name: 'su_aeon_' + aeon.path });
      if (elite) {
        su.elites++;
        su.queue.push({ type: 'ui', ui: 'su_bless', opts: [], rar: 3, why: 'Элита повержена' });
        su.queue.push({ type: 'ui', ui: 'su_curio', opts: [], why: 'Награда за элиту' });
      } else if (!aeon) su.queue.push({ type: 'ui', ui: 'su_bless', opts: [], why: 'Победа в бою' });
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
      if (!q.opts.length) { su.frag += 40; this.toast('Выбирать больше нечего: +40 фрагментов'); this.suFlush(); return; }
      this.pending = Object.assign({ type: 'ui' }, q);
    },

    suOffer(o = {}) {
      const su = this.state.su, paths = this.suPaths(), owned = new Set(su.bless.map(b => b.id)), rng = this.rng;
      let pool = SU.BLESSINGS.filter(b => paths.includes(b.path) && !owned.has(b.id));
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
      if (before < 3 && this.suOwnCount() >= 3) this.toast('Резонанс Пути открыт: «' + SU.PATHS[su.path].name + '». В бою он копит энергию, клавиша F.');
      return true;
    },

    suOwnCount() { const su = this.state.su; return su.bless.filter(b => blessDef(b.id).path === su.path).length; },

    suAddCurio(id) {
      const su = this.state.su, d = curioDef(id);
      if (!d || su.curios.some(c => c.id === id)) return false;
      su.curios.push({ id, uses: d.uses == null ? null : d.uses, broken: false });
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
      if (p.ui === 'su_end') { this.suExit(); return; }
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
          if (!paths.includes(st.path)) { paths.push(st.path); this.toast('Открыт Путь «' + SU.PATHS[st.path].name + '» в Виртуальной вселенной'); }
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

    suComplete(scripted) {
      const s = this.state, su = s.su, w = worldDef(su.world);
      if (su.tut && !scripted && H.SU.SCRIPTS.su_aeon_remembrance && !this.suPaths().includes('remembrance')) { this.runScript('su_aeon_remembrance'); return; }
      const first = this.suFirst(w), rw = this.suReward(w, first), res = { world: w.id, first, win: true, jade: rw.jade, credits: rw.credits, sets: [], power: rw.power, pending: false, frag: su.frag, bless: su.bless.length, curios: su.curios.length };
      for (let i = 0; i < rw.sets; i++) res.sets.push({ set: w.set || H.PLANAR_SETS[this.rng.int(H.PLANAR_SETS.length)], rl: Math.min(15, w.orn + this.rng.int(3)) });
      s.flags['su_clear_' + w.id] = true;
      if (su.tut) { s.flags.su_beta_run = true; this.setQuest('su_beta', 'report'); }
      if (!first && s.power < rw.power) {
        const claims = this.suClaims();
        if (claims.length < 3) claims.push({ world: w.id, sets: res.sets });
        res.pending = true;
      } else {
        if (!first) s.power -= rw.power;
        if (first && w.id >= 3) res.tracks = 1;
        this.give({ jade: res.jade, credits: res.credits, ornament: res.sets.map(x => ({ set: x.set, rl: x.rl })), items: res.tracks ? { tracks: res.tracks } : null });
      }
      su.result = res;
      this.pending = { type: 'ui', ui: 'su_end', res };
    },

    suFail() {
      const su = this.state.su;
      if (!su) return false;
      su.result = { world: su.world, win: false, first: false, jade: 0, credits: 0, sets: [], frag: su.frag, bless: su.bless.length, curios: su.curios.length };
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
