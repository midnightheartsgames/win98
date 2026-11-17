(function (HO) {
  'use strict';
  const C = HO.CMB, T = HO.TUN;
  const N = globalThis.Hsr98.HD.N;
  const sec = s => Math.round(s * T.hz);
  const yawTo = (a, x, z) => HO.wrapAngle(N.atan2(x - a.x, -(z - a.z)));
  const len = (dx, dz) => Math.sqrt(dx * dx + dz * dz);
  const dist = (a, b) => { const dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); };
  const person = (coat, hair, skin) => ({ type: 'person', coat, hair, skin, race: 'human' });

  HO.COMPANIONS = {
    arlan: { name: 'Арлан', path: 'destruction', sex: 'm', look: person('#3a4a6a', '#e8e4f0', '#8e5b3c'), lines: { start: 'Меня ничто не остановит.', ult: 'Это всё, на что ты способен?', win: 'Даже немного силы бывает полезно.', taunt: 'Тишина.' } },
    herta: { name: 'Кукла Герты', path: 'erudition', sex: 'f', look: person('#5a4a8a', '#c8b0e8', '#f4e4f0'), lines: { start: 'И это считается сильным?', ult: 'Ты знаешь, кто я?', break: 'Ты... ох.', win: 'Будет больно. Было.' } },
    joanna: { name: 'Джоанна', path: 'abundance', sex: 'f', look: person('#e0f4ec', '#c85a3a', '#f0d6c0'), lines: { start: 'Держитесь рядом. Я всех вижу.', ult: 'Все ко мне. Сейчас станет легче.', revive: 'Вставай. Смена ещё не кончилась.', win: 'Все целы. Почти все.' } }
  };
  HO.PARTY_FOR = { destruction: ['herta', 'joanna'], abundance: ['arlan', 'herta'], erudition: ['arlan', 'joanna'] };
  HO.ORDERS = { assist: 'Атаковать мою цель', follow: 'Ко мне', hold: 'Стоять здесь', passive: 'Не нападать' };
  HO.compGear = (lvl, path) => {
    if (lvl >= 9) return { cone: HO.PATH_CONE3[path], head: 'head3s', hands: 'hands3s', body: 'body3s', feet: 'feet3s' };
    if (lvl >= 6) return { cone: HO.PATH_CONE3[path], head: 'head3', hands: 'hands3', body: 'body3', feet: 'feet3' };
    return { cone: HO.PATH_CONE[path], head: 'head2', hands: 'hands2', body: 'body2', feet: 'feet2' };
  };
  const BAD = new Set(['poison', 'spores', 'burn', 'bleed']);

  Object.assign(HO.World.prototype, {
    partyOf(a) {
      const P = this.state.party;
      if (!P) return [a];
      if (a.uid !== P.owner && !P.members.includes(a.uid)) return [a];
      return [P.owner, ...P.members].map(u => this.byUid(u)).filter(Boolean);
    },

    ownerOf(h) {
      return h && h.companion ? this.byUid(h.owner) : h;
    },

    summonParty(a) {
      if (this.state.party) return this.dismissParty();
      if (this.state.trial) return this.denyText(a, 'busy', 'Во время испытания напарники не приходят');
      const nav = this.nav(), uids = [];
      HO.PARTY_FOR[a.path].forEach((id, i) => {
        const d = HO.COMPANIONS[id];
        const sheet = HO.newSheet({ id: 'comp_' + id, name: d.name, race: 'human', sex: d.sex, path: d.path, level: a.sheet.lvl, learnAll: true });
        for (const [slot, item] of Object.entries(HO.compGear(a.sheet.lvl, d.path))) sheet.gear[slot] = { id: item, dur: 100 };
        const c = this.addHero(i + 1, { sheet });
        const cell = nav.nearestFree(a.x + (i ? 1.5 : -1.5), a.z + 1.5), p = cell >= 0 ? nav.center(cell) : [a.x, a.z];
        Object.assign(c, { companion: id, owner: a.uid, x: p[0], z: p[1], yaw: a.yaw, think: this.state.tick + 4 + i * 6, goal: null, route: null, routeAt: -99, saidAt: -9999 });
        c.y = Math.max(0, this.floorBelow(c.x, c.z, 50));
        c.hp = this.stat(c, 'maxHp');
        uids.push(c.uid);
      });
      this.state.party = { owner: a.uid, members: uids, order: 'assist', hold: null, first: 0, stop: 0, oocAt: this.state.tick };
      this.events.push({ k: 'party', uid: a.uid, on: true });
      for (const u of uids) this.say(this.byUid(u), 'start');
    },

    dismissParty() {
      const P = this.state.party;
      if (!P) return;
      const gone = new Set(P.members);
      this.state.actors = this.state.actors.filter(x => !gone.has(x.uid));
      for (const f of this.foes()) for (const u of gone) delete f.threat[u];
      this.state.party = null;
      this.events.push({ k: 'party', uid: P.owner, on: false });
    },

    say(c, key) {
      const line = c && c.companion && HO.COMPANIONS[c.companion].lines[key];
      if (!line || this.state.tick - c.saidAt < sec(12)) return;
      c.saidAt = this.state.tick;
      this.events.push({ k: 'say', uid: c.uid, text: line });
    },

    cmd_order(c, a) {
      const P = this.state.party;
      if (!P || P.owner !== a.uid) return this.deny(a, 'nothing');
      P.order = c.o;
      P.hold = c.o === 'hold' ? { x: a.x, z: a.z } : null;
      this.events.push({ k: 'order', uid: a.uid, o: c.o });
    },

    cmd_mark(c, a) {
      const P = this.state.party, f = this.byUid(c.uid);
      if (!P || P.owner !== a.uid) return this.deny(a, 'nothing');
      if (c.uid && (!f || f.kind !== 'foe' || f.dead)) return this.deny(a, 'target');
      P[c.m] = c.uid;
      if (c.m === 'first' && P.stop === c.uid) P.stop = 0;
      if (c.m === 'stop' && P.first === c.uid) P.first = 0;
      this.events.push({ k: 'mark', uid: a.uid, m: c.m, foe: c.uid });
    },

    partyTick() {
      const P = this.state.party;
      if (!P) return;
      const tick = this.state.tick, owner = this.byUid(P.owner);
      if (!owner) { this.dismissParty(); return; }
      const members = P.members.map(u => this.byUid(u)).filter(Boolean), all = [owner, ...members];
      for (const k of ['first', 'stop']) { const f = this.byUid(P[k]); if (!f || f.dead) P[k] = 0; }
      const fighting = this.foes().filter(f => !f.dead && f.state === 'fight' && all.some(h => f.threat[h.uid] !== undefined));
      if (fighting.length) P.oocAt = 0;
      else if (!P.oocAt) {
        P.oocAt = tick;
        if (members.some(m => !m.dead)) this.say(members.find(m => !m.dead), 'win');
      }
      for (const c of members) {
        if (c.dead && P.oocAt && tick - P.oocAt > sec(8) && !owner.dead && !owner.ghost) {
          const nav = this.nav(), cell = nav.nearestFree(owner.x + 1.5, owner.z + 1.5), p = cell >= 0 ? nav.center(cell) : [owner.x, owner.z];
          Object.assign(c, { dead: false, x: p[0], z: p[1], vx: 0, vz: 0, goal: null, route: null, combatAt: -9999 });
          c.hp = this.stat(c, 'maxHp') * 0.3;
          if (c.base.pool) c.res = c.base.pool * 0.3;
          this.events.push({ k: 'revive', uid: c.uid, src: owner.uid });
          const healer = members.find(m => m.companion === 'joanna' && !m.dead);
          if (healer) this.say(healer, 'revive');
        }
        if (c.dead) continue;
        if (tick >= c.think) {
          c.think = tick + 8 + Math.floor(this.roll() * 9);
          this.compThink(c, P, owner, all, fighting);
        }
        this.compMove(c);
      }
    },

    compCmd(c, cmd) {
      cmd.seat = c.seat;
      const k = HO.clean(cmd);
      if (k) this.apply(k);
    },

    compMove(c) {
      const g = c.goal;
      if (!g || (c.cast && !g.dodge)) { if (c.mf) this.compCmd(c, { t: 'move', f: 0, s: 0, r: 0 }); return; }
      if (dist(c, g) <= (g.near || 1.5)) { if (c.mf) this.compCmd(c, { t: 'move', f: 0, s: 0, r: 0 }); if (g.face) this.compCmd(c, { t: 'face', yaw: yawTo(c, g.face.x, g.face.z) }); return; }
      const nav = this.nav(), tick = this.state.tick;
      if (!c.route || tick - c.routeAt > sec(1) || !c.route.length) { c.route = nav.path(c.x, c.z, g.x, g.z, 20000) || [[g.x, g.z]]; c.routeAt = tick; }
      while (c.route.length > 1 && dist(c, { x: c.route[0][0], z: c.route[0][1] }) < 0.7) c.route.shift();
      const p = c.route[0];
      this.compCmd(c, { t: 'face', yaw: yawTo(c, p[0], p[1]) });
      if (c.mf !== 1) this.compCmd(c, { t: 'move', f: 1, s: 0, r: 0 });
    },

    dangerAt(c) {
      for (const f of this.foes()) if (!f.dead && f.prep && f.prep.kind !== 'all' && f.prep.kind !== 'single' && this.inPrep(f.prep, c)) return f;
      return null;
    },

    escapeFrom(c, f) {
      const pr = f.prep, nav = this.nav();
      const from = pr.kind === 'circles' ? pr.pts.reduce((m, p) => (len(p[0] - c.x, p[1] - c.z) < len(m[0] - c.x, m[1] - c.z) ? p : m), pr.pts[0]) : [pr.x, pr.z];
      const step = pr.kind === 'cone' ? 0 : pr.r + 2;
      let best = null, bd = Infinity;
      for (let i = 0; i < 16; i++) {
        const ang = i * HO.PI / 8, x = (pr.kind === 'cone' ? c.x : from[0]) + N.sin(ang) * (step || 4), z = (pr.kind === 'cone' ? c.z : from[1]) - N.cos(ang) * (step || 4);
        if (!nav.walkable(x, z) || this.inPrep(pr, { x, z })) continue;
        const d = len(x - c.x, z - c.z);
        if (d < bd) { bd = d; best = { x, z }; }
      }
      return best;
    },

    compThink(c, P, owner, all, fighting) {
      const danger = this.dangerAt(c);
      if (danger) {
        const out = this.escapeFrom(c, danger);
        if (out) { if (c.cast) this.compCmd(c, { t: 'stopCast' }); c.goal = { x: out.x, z: out.z, near: 0.6, dodge: true }; return; }
      }
      const order = P.order, attack = order === 'assist' || order === 'hold';
      const near = (x, z, n, face) => ({ x, z, near: n, face });
      const home = order === 'hold' && P.hold ? near(P.hold.x, P.hold.z, 1.2) : near(owner.x, owner.z, 4);
      const ooc = !fighting.length;
      const path = c.path;
      const cast = (ab, uid) => this.compCmd(c, { t: 'cast', ab, uid: uid || 0 });
      const ownerT = this.byUid(owner.target);
      const ownerFoe = ownerT && ownerT.kind === 'foe' && !ownerT.dead && (owner.attacking || owner.inCombat || ownerT.state === 'fight') ? ownerT : null;
      const pool = fighting.slice();
      if (ownerFoe && !pool.includes(ownerFoe)) pool.push(ownerFoe);
      const nearest = list => list.slice().sort((p, q) => dist(c, p) - dist(c, q) || p.uid - q.uid)[0];
      if (ooc && !ownerFoe) {
        if (c.attacking) this.compCmd(c, { t: 'attack', on: false });
        if (c.base.pool && c.res / c.base.pool < 0.5) { c.goal = null; if (!c.sit) this.compCmd(c, { t: 'sit', on: true }); return; }
        if (path === 'abundance') {
          const hurt = all.filter(h => !h.dead && !h.ghost && h.hp / this.stat(h, 'maxHp') < 0.8).sort((p, q) => p.hp / this.stat(p, 'maxHp') - q.hp / this.stat(q, 'maxHp'))[0];
          if (hurt && dist(c, hurt) <= 28) { c.goal = null; cast('a_heal', hurt.uid); return; }
        }
        if (c.sit && dist(c, owner) < 10) return;
        c.goal = order === 'hold' && P.hold ? home : near(owner.x, owner.z, order === 'follow' ? 2.5 : 4);
        return;
      }
      if (order === 'follow' || order === 'passive') {
        if (c.attacking) this.compCmd(c, { t: 'attack', on: false });
        if (path === 'abundance') this.healerHeal(c, all, cast);
        c.goal = near(owner.x, owner.z, order === 'follow' ? 2.5 : 4);
        return;
      }
      if (path === 'destruction') {
        const loose = pool.filter(f => f.aim && f.aim !== c.uid && f.state === 'fight').sort((p, q) => dist(c, p) - dist(c, q) || p.uid - q.uid);
        let t = loose[0] || (P.first && this.byUid(P.first)) || ownerFoe || nearest(pool);
        if (!t || t.dead) return;
        if (loose[0] && dist(c, loose[0]) <= 10 && !(c.cds.d_taunt > this.state.tick)) { cast('d_taunt', loose[0].uid); this.say(c, 'taunt'); }
        if (t.uid === P.stop && pool.length > 1) t = nearest(pool.filter(f => f.uid !== P.stop)) || t;
        c.goal = near(t.x, t.z, 2.2, t);
        if (c.target !== t.uid) this.compCmd(c, { t: 'target', uid: t.uid });
        if (!c.attacking) this.compCmd(c, { t: 'attack', on: true });
        const close = pool.filter(f => dist(c, f) < 8).length;
        if (c.energy >= C.energyMax && (t.elite || close >= 2)) { cast('d_ult', t.uid); this.say(c, 'ult'); }
        if (close >= 2) cast('d_clap');
        if (!c.auras.some(x => x.key === 'shout')) cast('d_shout');
        if (!t.auras.some(x => x.key === 'rend' && x.src === c.uid)) cast('d_rend', t.uid);
        cast('d_sunder', t.uid);
        cast('d_mighty');
        return;
      }
      if (path === 'abundance') {
        if (this.healerHeal(c, all, cast)) return;
        const t = ownerFoe || nearest(pool);
        if (attack && t && c.res / c.base.pool > 0.6) {
          c.goal = dist(c, t) > 22 || !this.los(c, t) ? near(t.x, t.z, 18) : null;
          if (!c.goal) { this.compCmd(c, { t: 'face', yaw: yawTo(c, t.x, t.z) }); if (!t.auras.some(x => x.key === 'wither' && x.src === c.uid)) cast('a_wither', t.uid); else cast('a_smite', t.uid); }
        } else c.goal = near(owner.x, owner.z, 14);
        return;
      }
      const tank = all.find(h => h.path === 'destruction' && !h.dead && h !== c);
      const prepped = pool.filter(f => f.prep && f.tough > 0 && HO.FOES[f.id].weak.some(e => e === 'fire' || e === 'ice'));
      const stopF = P.stop && this.byUid(P.stop);
      if (stopF && !stopF.dead && !stopF.elite && !stopF.auras.some(x => x.k === 'poly') && dist(c, stopF) <= 28) { c.goal = null; this.compCmd(c, { t: 'face', yaw: yawTo(c, stopF.x, stopF.z) }); cast('e_stop', stopF.uid); return; }
      const tankT = tank && this.byUid(tank.target);
      let t = nearest(prepped) || (P.first && this.byUid(P.first)) || (tankT && tankT.kind === 'foe' && !tankT.dead ? tankT : null) || ownerFoe || nearest(pool);
      if (!t || t.dead || t.uid === P.stop) t = nearest(pool.filter(f => f.uid !== P.stop));
      if (!t) return;
      if (dist(c, t) > 22 || !this.los(c, t)) { c.goal = near(t.x, t.z, 16); return; }
      c.goal = null;
      this.compCmd(c, { t: 'face', yaw: yawTo(c, t.x, t.z) });
      if (c.target !== t.uid) this.compCmd(c, { t: 'target', uid: t.uid });
      if (!c.attacking) cast('e_attack', t.uid);
      const around = pool.filter(f => dist(c, f) <= 9).length;
      if (c.energy >= C.energyMax && around >= 2) { cast('e_ult'); this.say(c, 'ult'); }
      const weak = HO.FOES[t.id].weak;
      const first = weak.includes('ice') && !weak.includes('fire') ? 'e_ice' : 'e_fire';
      const thrifty = pool.some(f => HO.FOES[f.id].boss), spare = !thrifty || c.res / c.base.pool > 0.4, mustBreak = t.prep && t.tough > 0 && (weak.includes('fire') || weak.includes('ice'));
      if (!spare && !mustBreak) return;
      if (spare && pool.filter(f => f !== t && dist(t, f) <= 6 && f.uid !== P.stop).length >= 2) cast('e_cascade', t.uid);
      cast(first, t.uid);
      cast(first === 'e_ice' ? 'e_fire' : 'e_ice', t.uid);
    },

    healerHeal(c, all, cast) {
      const alive = all.filter(h => !h.dead && !h.ghost);
      const frac = h => h.hp / this.stat(h, 'maxHp');
      const low = alive.slice().sort((p, q) => frac(p) - frac(q) || p.uid - q.uid)[0];
      const reach = h => dist(c, h) <= 28 && this.los(c, h);
      if (alive.filter(h => frac(h) < 0.5).length >= 2 && c.energy >= C.energyMax) { cast('a_ult'); this.say(c, 'ult'); return true; }
      if (low && frac(low) < 0.55) {
        if (!reach(low)) { c.goal = { x: low.x, z: low.z, near: 20 }; return true; }
        c.goal = null;
        if (c.cast) return true;
        cast('a_heal', low.uid);
        return true;
      }
      const sick = alive.find(h => h.auras.some(x => x.k === 'dot' && BAD.has(x.key)) && reach(h));
      if (sick && c.res / c.base.pool > 0.2) { cast('a_cleanse', sick.uid); return true; }
      const tank = alive.find(h => h.path === 'destruction' && h !== c) || alive.filter(h => h !== c).sort((p, q) => frac(p) - frac(q))[0];
      if (tank && reach(tank) && frac(tank) < 0.9 && !tank.auras.some(x => x.key === 'sprout' && x.src === c.uid)) { cast('a_sprout', tank.uid); return true; }
      if (low && frac(low) < 0.8 && reach(low) && !low.auras.some(x => x.key === 'sprout' && x.src === c.uid)) { cast('a_sprout', low.uid); return true; }
      const far = alive.find(h => h !== c && dist(c, h) > 24);
      if (far) { c.goal = { x: far.x, z: far.z, near: 18 }; return false; }
      return false;
    }
  });

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
