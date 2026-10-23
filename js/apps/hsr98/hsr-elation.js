(function (H) {
  'use strict';
  const T = H.TUNING, AV = T.avBase, clamp = H.clamp;
  const { sv, defOf, spdOf, alive } = H.battleStat;

  const DEFAULTS = {
    punchPerHero: 1, punchK: 5, punchHalf: 240,
    ahaSpdBase: 80, ahaSpdDiv: [5, 10, 20, 40],
    bangerStart: 20, bangerTurns: 2,
    elationK: 2.4,
    rpsAll: 0.4, rpsRound: 0.15, rpsWinChance: 0.5, ultHoldPunch: 10, ultHoldTurns: 2,
    elFail: 2, elFailCap: 6,
    laughHits: 10, laughM: 0.5, laughEnergy: 2
  };
  for (const [k, v] of Object.entries(DEFAULTS)) if (T[k] == null) T[k] = v;

  const elationBase = lvl => T.elationK * H.breakBase(lvl);
  const punchMul = n => 1 + T.punchK * Math.max(0, n) / (Math.max(0, n) + T.punchHalf);
  const isHero = u => !!u && u.side === 'ally' && !u.summon && u.path === 'elation';
  const CC_OFF = u => {
    const was = !!(u.frozen || u.stun || u.swallowed);
    u.frozen = 0; u.frozenDmg = 0; u.stun = 0;
    return was;
  };

  Object.assign(H.CONES, {
    goodluck: {
      name: 'Благоприятный день', path: 'elation', rarity: 4, ref: 21065, stats: { hp: 43.2, atk: 24, def: 18 }, skill: 'Выбор',
      tpl: 'Крит. шанс владельца повышается на #1%. Когда владелец использует Навык Радости, Радость повышается на #1%. Может складываться до 2 раз.', p: [[0.12], [0.14], [0.16], [0.18], [0.2]], bonus: { critR: 1 }, fx: 'goodluck',
      desc: '«Сестрёнка-наставница, ты абсолютно уверена?»\n«Хм, никаких сомнений!»\n«Это не простой крем для рук: ставки теперь повыше.»\n«Игра простецкая... Что может пойти не так?»\nС этими словами розоволосая девочка отвернулась, чтобы её больше не беспокоили.\n\n«Судя по траектории чайных листьев, тебе нужно разыграть эту карту.»\nДевочка вытянула карту и перевернула её.\n«О, мне скоро повезёт.»\n«Давай ещё разок, не может этого быть...»\n...\n\nДевочка уже и не помнит, сколько таких партий с предсказаниями они сыграли вместе с наставницей. Запомнилось лишь неуёмное желание наставницы играть с ней снова и снова.\nПозже героиня захотела избежать предначертанной судьбы, и невзирая на помехи, отправилась в Комиссию по предсказаниям Лофу.\nПрибыв на корабль, она однажды случайно нашла в книге предсказаний изысканную закладку. При виде знакомого почерка у девочки, что покинула родину, на глазах выступили слёзы:\n\n«Кто сказал, что судьба не даёт второго шанса? Вот и счастливый талисман для тебя~»'
    },
    sneering: {
      name: 'Насмешка', path: 'elation', rarity: 3, ref: 20023, stats: { hp: 33.6, atk: 16.8, def: 12 }, skill: 'Разгулье',
      tpl: 'При активации Мига Ахи Радость владельца повышается на #1%, пока действует Миг Ахи.', p: [[0.16], [0.2], [0.24], [0.28], [0.32]], bonus: {}, fx: 'sneering',
      desc: 'Редкая сила, сконденсированная из времени. Именно из всех незначительных мгновений сплетается великолепная судьба.\n«Источник смеха это гримаса ужаса и запугивания».'
    }
  });
  H.coneInit({ goodluck: H.CONES.goodluck, sneering: H.CONES.sneering });
  if (!H.WARP_POOL.four.includes('cone:goodluck')) H.WARP_POOL.four.push('cone:goodluck');
  if (!H.WARP_POOL.three.includes('cone:sneering')) H.WARP_POOL.three.push('cone:sneering');

  const MAIL = { id: 'v16_elation', from: 'Пом-Пом', title: 'Версия 1.6: Путь Радости', give: { items: { elat2: 6, elat3: 3 } }, text: [
    'Уважаемый Первопроходец!',
    'Казума теперь идёт по Пути Радости, Пути Эона Ахи.',
    'В бою способности Казумы и провалы отряда копят Юмор. Когда Юмор есть, на шкалу действий встаёт Аха. Его ход называется Миг Ахи: Казума играет со всеми врагами в «Камень, ножницы, бумага!» и бьёт Уроном Радости. После Мига Юмор становится Настоящим хитом Казумы.',
    'Удачи у Казумы больше нет, её работу делают Юмор и Хит. Уровни Следов сохранились, узлы шанса эффекта стали узлами Радости.',
    'Конус Казумы «Это был трактор» теперь конус Радости. На героях других Путей его пассивка не действует.',
    'В Путеводителе появился Бутон Радости с материалами Пути, в стандартном прыжке конусы «Благоприятный день» и «Насмешка».',
    'Во вложении материалы Пути Радости для Следов Казумы. Счастливого пути!'
  ] };
  if (H.MAIL && !H.MAIL.some(m => m.id === MAIL.id)) H.MAIL.push(MAIL);

  Object.assign(H.Battle.prototype, {
    elHeroes() { return this.livingAllies.filter(isHero); },

    elStart() {
      const heroes = this.allies.filter(isHero);
      if (!heroes.length) return;
      const kept = this.el ? this.el.punch : 0;
      this.el = { punch: kept, fails: 0, tally: null, laughs: 0, instants: 0 };
      for (const u of heroes) {
        u.flags.banger = [{ v: T.bangerStart, t: T.bangerTurns }];
        this.push({ t: 'banger', u, v: this.bangerOf(u) });
      }
      this.gainPunch(T.punchPerHero * heroes.filter(alive).length, null, true);
    },

    punchOf() { return this.el ? this.el.punch : 0; },
    punchMul,
    elationBase,

    gainPunch(n, src, quiet) {
      if (!n || n <= 0 || this.over) return;
      if (!this.el) this.el = { punch: 0, fails: 0, tally: null, laughs: 0, instants: 0 };
      this.el.punch += n;
      this.push({ t: 'punch', v: this.el.punch, add: n, src: src || null, quiet: !!quiet });
      this.ahaEnsure();
    },

    elFailed(u, why) {
      if (!this.el || !this.elHeroes().length) return false;
      const key = (u ? u.key || u.id : '') + '|' + (this.actN || 0);
      if (this.el.lastFail === key) return false;
      if (this.el.fails + T.elFail > T.elFailCap) return false;
      this.el.lastFail = key;
      this.el.fails += T.elFail;
      this.gainPunch(T.elFail, u);
      if (why) this.push({ t: 'status', u: this.elHeroes()[0], text: 'Юмор: ' + why, col: '#ff9ae0' });
      return true;
    },

    bangerOf(u) { return u && u.flags.banger ? u.flags.banger.reduce((a, p) => a + p.v, 0) : 0; },

    addBanger(u, v) {
      if (!alive(u) || v <= 0) return;
      (u.flags.banger || (u.flags.banger = [])).push({ v, t: T.bangerTurns });
      this.push({ t: 'banger', u, v: this.bangerOf(u), add: v });
    },

    ahaSpd() {
      const spds = this.elHeroes().map(spdOf).sort((a, b) => b - a);
      return T.ahaSpdBase + spds.slice(0, 4).reduce((a, s, i) => a + s / T.ahaSpdDiv[i], 0);
    },

    ahaUnit() { return this.summons.find(s => s.aha && alive(s)) || null; },

    ahaEnsure() {
      if (!this.el || this.el.punch <= 0 || this.ahaUnit()) return;
      const lead = this.elHeroes()[0] || this.livingAllies[0] || this.allies[0];
      const lvl = lead ? lead.lvl : 1;
      const h = {
        side: 'ally', summon: true, aha: true, idx: -1, id: 'aha', charId: 'aha', key: 'aha', name: 'Аха', lvl, elem: 'quant', path: 'elation', kit: {},
        base: { spd: this.ahaSpd(), critR: 0, critD: 0.5 }, maxHp: 1, hp: 1, buffs: [], dots: [], shield: 0, shieldT: 0, frozen: 0, stun: 0, taunt: 0,
        dead: false, gone: false, av: 0, flags: {}, appear: true, cone: null, sets: {}, eid: 0, tr: null
      };
      h.av = AV / spdOf(h);
      this.summons.push(h);
      this.push({ t: 'aha', u: h, on: true });
      this.push(this.orderSnap(this.current));
    },

    ahaLeave(h) {
      if (!h || h.gone) return;
      h.gone = true;
      this.summons = this.summons.filter(s => s !== h);
      this.push({ t: 'aha', u: h, on: false });
      this.push(this.orderSnap(this.current));
    },

    ahaNow(fixed) {
      const h = this.ahaUnit() || this.ahaForce();
      if (!h) return;
      this.el.forced = fixed;
      h.av = 0;
      this.push(this.orderSnap(this.current));
    },

    ahaForce() {
      if (!this.el) this.el = { punch: 0, fails: 0, tally: null, laughs: 0, instants: 0 };
      const keep = this.el.punch;
      this.el.punch = Math.max(1, keep);
      this.ahaEnsure();
      this.el.punch = keep;
      return this.ahaUnit();
    },

    ahaAdvance(v) {
      const h = this.ahaUnit();
      if (!h) return;
      this.advance(h, v);
      this.push({ t: 'status', u: this.elHeroes()[0] || this.livingAllies[0], text: 'Аха ходит раньше', col: '#ff9ae0' });
      this.push(this.orderSnap(this.current));
    },

    elHit(src, tgt, m, o) {
      const count = o && o.count != null ? o.count : this.punchOf();
      const dealt = this.hit(src, tgt, m, Object.assign({ elation: true, kind: 'elation', label: 'Радость' }, o, { count }));
      if (this.el && this.el.tally != null) this.el.tally += dealt;
      return dealt;
    },

    elationDmg(src, tgt, mult, o, crit) {
      const e = o.e || src.elem;
      const base = elationBase(src.lvl) * mult;
      const stat = 1 + sv(src, 'elation') + (this.el && this.el.tally != null ? H.coneP(src, 'sneering', 1) : 0);
      const count = punchMul(o.count != null ? o.count : this.punchOf());
      const merry = 1 + sv(src, 'merry');
      const critM = crit ? 1 + sv(src, 'critD') : 1;
      const K = 200 + 10 * src.lvl;
      const chun = H.coneP(src, 'chunchun', 3);
      const tdef = defOf(tgt) * (1 - clamp(sv(tgt, 'defDown') + this.haresDef(tgt), 0, 1)) * (1 - clamp(sv(src, 'defIgnore') + sv(src, 'elDefIgnore') + chun + (o.defIgnore || 0), 0, 1));
      const defM = K / (tdef + K);
      let res = 0;
      if (tgt.side === 'enemy') res = tgt.weak.includes(e) ? 0 : tgt.resist.includes(e) ? T.resistRes : T.defaultRes;
      res -= sv(src, 'resPen') + (o.resPen || 0);
      if (tgt.side === 'enemy') res -= sv(tgt, 'resDown') + sv(tgt, e + 'ResDown');
      const resM = 1 - clamp(res, -1, 0.9);
      const vuln = 1 + sv(tgt, 'vuln') + sv(tgt, e + 'Vuln') + sv(tgt, 'elVuln');
      const brokenM = tgt.side === 'enemy' && !tgt.broken ? T.unbrokenMult : 1;
      const dr = 1 - clamp(sv(tgt, 'dr'), 0, 0.9);
      return Math.max(1, Math.round(base * stat * count * merry * critM * defM * resM * vuln * brokenM * dr));
    },

    elSkillRun(u, sk) {
      const run = H.ELATION_RUN[sk.run || 'fx'];
      if (run) run(this, u, sk);
      const luck = H.coneP(u, 'goodluck', 1);
      if (luck && alive(u)) {
        u.flags.goodluck = Math.min(2, (u.flags.goodluck || 0) + 1);
        u.buffs = u.buffs.filter(b => b.name !== 'Выбор');
        u.buffs.push({ s: 'elation', v: luck * u.flags.goodluck, turns: 999, name: 'Выбор' });
        this.push({ t: 'status', u, text: 'Выбор: Радость +' + Math.round(luck * u.flags.goodluck * 100) + '%', col: '#ff9ae0' });
      }
    },

    ahaTurn(h) {
      if (!this.el) { this.ahaLeave(h); return; }
      this.acting = h;
      this.hitThisAction = new Set();
      this.actSerial = (this.actSerial || 0) + 1;
      const crew = this.elHeroes().filter(u => u.kit.elSkill).sort((a, b) => (a.kit.elSkill.order || 0) - (b.kit.elSkill.order || 0));
      const forced = this.el.forced;
      this.el.forced = null;
      const start = this.el.punch, keep = forced != null;
      if (keep) this.el.punch = forced;
      this.el.instants++;
      if (!crew.length) this.laughter(h);
      else {
        this.push({ t: 'act', u: h, name: 'Миг Ахи', kind: 'aha' });
        this.push({ t: 'ahaStart', u: h, punch: this.el.punch, crew: crew.slice() });
        for (const u of this.elHeroes()) if (CC_OFF(u) || u.swallowed) { if (u.swallowed) this.release(u); this.push({ t: 'status', u, text: 'Аха снимает контроль', col: '#ff9ae0' }); }
        this.el.tally = 0;
        for (const u of crew) {
          if (this.over || !this.living.length) break;
          if (!alive(u)) continue;
          const sk = u.kit.elSkill;
          this.push({ t: 'act', u, name: sk.name, kind: 'elation' });
          this.push({ t: 'elCut', u, id: u.charId });
          this.elSkillRun(u, sk);
          this.cleanup();
        }
        const total = this.el.tally, counted = this.el.punch;
        this.el.tally = null;
        this.push({ t: 'ahaEnd', u: h, total, punch: counted });
        if (!this.over) for (const u of crew) if (alive(u)) this.addBanger(u, counted);
      }
      this.acting = null;
      if (keep) {
        this.el.punch = start + Math.max(0, this.el.punch - forced);
        this.cleanup();
        if (this.over) return;
        if (this.el.punch <= 0) { this.ahaLeave(h); return; }
        h.base.spd = this.ahaSpd();
        h.av = AV / spdOf(h);
        return;
      }
      const was = this.el.punch;
      this.el.punch = 0;
      this.el.fails = 0;
      this.push({ t: 'punch', v: 0, add: -was, quiet: true });
      this.cleanup();
      if (this.over) return;
      const refill = T.punchPerHero * this.elHeroes().length;
      if (refill > 0) { this.el.punch = refill; this.push({ t: 'punch', v: refill, add: refill, quiet: true }); }
      if (this.el.punch <= 0) { this.ahaLeave(h); return; }
      h.base.spd = this.ahaSpd();
      h.av = AV / spdOf(h);
    },

    laughter(h) {
      this.el.laughs++;
      this.push({ t: 'act', u: h, name: 'Да будет смех', kind: 'aha' });
      this.push({ t: 'laugh', u: h });
      for (let i = 0; i < T.laughHits; i++) {
        if (this.over) break;
        const pool = [...this.living, ...this.livingAllies.filter(a => !a.flags.away)];
        if (!pool.length) break;
        const t = this.rng.pick(pool);
        this.push({ t: 'laughHit', u: t });
        if (t.side === 'enemy') { this.hit(h, t, T.laughM, { elation: true, kind: 'elation', e: 'quant', count: this.el.punch, label: 'Смех' }); this.cleanup(); }
        else {
          if (t.hp > 1) { t.hp -= 1; this.push({ t: 'dmg', u: t, src: h, v: 1, crit: false, e: 'quant', hp: t.hp, shield: t.shield, label: 'Смех', el: true }); }
          this.gainEnergy(t, T.laughEnergy);
        }
      }
    },

    elAct(actor, ab, kind, R) {
      if (!isHero(actor) || this.over) return;
      if (ab.punch) this.gainPunch(ab.punch, actor);
      const t = R && R.main;
      const bang = this.bangerOf(actor);
      if (ab.elRider && bang > 0 && t && t.side === 'enemy' && alive(t)) this.elHit(actor, t, ab.elRider * (this.traceTalent ? this.traceTalent(actor) : 1), { count: bang, label: 'Хит' });
      if (kind === 'ult') {
        actor.flags.ultHeld = 0;
        const adv = Math.max(ab.ahaAdv || 0, (this.kitFx && this.kitFx(actor, 'ahaAdv')) || 0);
        if (adv > 0) this.ahaAdvance(adv);
      }
    },

    elHoldUlt(a) {
      if (!isHero(a) || !a.kit.ult || !a.kit.ult.ahaAdv || !this.el) return false;
      const h = this.ahaUnit();
      const soon = h && [...this.livingAllies, ...this.living].every(u => u.av >= h.av);
      return !(this.el.punch >= T.ultHoldPunch || soon) && (a.flags.ultHeld || 0) < T.ultHoldTurns;
    },

    elEnd(u) {
      if (!isHero(u)) return;
      if (this.ultReady(u)) u.flags.ultHeld = (u.flags.ultHeld || 0) + 1;
      if (!u.flags.banger || !u.flags.banger.length) return;
      const before = this.bangerOf(u);
      for (const p of u.flags.banger) p.t--;
      u.flags.banger = u.flags.banger.filter(p => p.t > 0);
      const now = this.bangerOf(u);
      if (now !== before) this.push({ t: 'banger', u, v: now, add: now - before });
    }
  });

  H.ELATION_RUN = {
    fx(b, u, sk) {
      for (const f of sk.fx || []) {
        if (b.over) break;
        const foes = b.living;
        if (!foes.length) break;
        if (f.k === 'elAll') for (const t of foes.slice()) b.elHit(u, t, f.m, { tough: f.tough || 0 });
        else if (f.k === 'elOne') b.elHit(u, foes.reduce((a, c) => (c.hp > a.hp ? c : a)), f.m, { tough: f.tough || 0 });
        else if (f.k === 'elBounce') for (let i = 0; i < f.n; i++) { const t = b.rng.pick(b.living); if (!t) break; b.elHit(u, t, f.m, { tough: f.tough || 0 }); }
        else if (f.k === 'punch') b.gainPunch(f.v, u);
      }
    }
  };

  H.ELATION_RUN.kazumaRps = (b, u) => {
    const k = (ev, d) => (b.kitFx && b.kitFx(u, ev)) || d, tl = b.traceTalent ? b.traceTalent(u) : 1;
    for (const t of b.living.slice()) b.elHit(u, t, T.rpsAll * tl, { tough: 10 });
    const rounds = k('rpsRounds', 6), rolls = k('rpsRolls', 1), gain = k('rpsWin', 1);
    for (let i = 0; i < rounds; i++) {
      if (b.over) break;
      const t = b.rng.pick(b.living);
      if (!t) break;
      let win = false;
      for (let r = 0; r < rolls; r++) if (b.rng() < T.rpsWinChance) win = true;
      b.push({ t: 'rps', u, tgt: t, win, hand: b.rng.pick(['камень', 'ножницы', 'бумага']) });
      b.elHit(u, t, T.rpsRound * tl * (win ? 2 : 1), { tough: 3, label: win ? 'Выиграл!' : 'Ничья' });
      if (win) b.gainPunch(gain, u, true);
    }
  };

  Object.assign(H, { elationBase, punchMul });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
