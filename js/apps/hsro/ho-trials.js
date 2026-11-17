(function (HO) {
  'use strict';
  const C = HO.CMB;
  const sec = s => Math.round(s * HO.TUN.hz);
  const dist = (a, b) => { const dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); };

  HO.trialWanted = function (sheet, id) {
    for (const qid of Object.keys(sheet.quests)) {
      const q = HO.QUESTS[qid];
      for (let i = 0; i < q.goals.length; i++) if (q.goals[i].k === 'trial' && q.goals[i].trial === id && !sheet.quests[qid].prog[i]) return true;
    }
    return false;
  };

  Object.assign(HO.World.prototype, {
    startTrial(a, id) {
      const def = HO.TRIALS[id], tick = this.state.tick;
      if (!def || def.zone !== this.zone.id) return this.deny(a, 'nothing');
      if (this.state.trial) return this.denyText(a, 'busy', 'Испытание уже идёт');
      if (this.state.party) return this.denyText(a, 'busy', 'Испытание проходят одному. Сначала отпустите напарников');
      if (!HO.trialWanted(a.sheet, id)) return this.deny(a, 'nothing');
      if (a.inCombat) return this.deny(a, 'combat');
      const T = { id, hero: a.uid, start: tick, end: tick + sec(def.dur), wave: 0, wards: [], foes: [], broke: [], bleedAt: def.bleed ? tick + sec(def.bleed.every) : 0 };
      (def.wards || []).forEach((w, i) => {
        const n = {
          uid: this.state.uid++, kind: 'npc', id: 'ward_' + i, name: def.wardName, role: 'ward', ward: true, look: def.wardLook, r: 0.4, h: 1.7, lvl: 10,
          x: w.x, y: 0, z: w.z, yaw: 0, vx: 0, vy: 0, vz: 0, wx: 0, wz: 0, ground: true, dead: false, auras: [],
          base: { hp: def.wardHp, atk: 1, def: 100 }, hp: def.wardHp * (def.wardStart || 1), to: w.to || null, path: null, pathAt: -999, follow: 0
        };
        n.y = Math.max(0, this.floorBelow(n.x, n.z, 50, n.r));
        this.state.actors.push(n);
        T.wards.push(n.uid);
      });
      this.state.trial = T;
      this.events.push({ k: 'trialStart', uid: a.uid, trial: id });
    },

    trialTick() {
      const T = this.state.trial;
      if (!T) return;
      const def = HO.TRIALS[T.id], tick = this.state.tick, a = this.byUid(T.hero);
      while (def.waves[T.wave] && tick >= T.start + sec(def.waves[T.wave].at)) {
        for (const [id, lvl, x, z] of def.waves[T.wave].foes) {
          const f = this.addFoe(id, { x, z, yaw: 0 }, lvl);
          Object.assign(f, { once: true, solo: true, trial: T.id, passive: !!def.passive });
          f.base.atk *= def.atk || 1;
          if (def.raid) f.state = 'raid';
          T.foes.push(f.uid);
        }
        this.events.push({ k: 'trialWave', uid: T.hero, n: def.waves[T.wave].foes.length });
        T.wave++;
      }
      if (def.need && T.broke.length) {
        const gone = this.state.actors.filter(x => x.kind === 'foe' && T.broke.includes(x.uid) && !x.dead);
        for (const f of gone) {
          f.dead = true; f.hp = 0; f.state = 'dead'; f.threat = {}; f.auras = [];
          this.events.push({ k: 'vanish', uid: f.uid });
          for (const h of this.heroes()) if (h.target === f.uid) { h.target = 0; h.attacking = false; }
        }
      }
      const wards = T.wards.map(u => this.byUid(u)).filter(Boolean);
      for (const w of wards) {
        if (w.dead || !w.to) continue;
        if (dist(w, w.to) > 0.6) this.steer(w, w.to, def.wardSpeed, tick);
        else { w.wx = 0; w.wz = 0; }
      }
      if (def.bleed && tick >= T.bleedAt) {
        T.bleedAt = tick + sec(def.bleed.every);
        const live = wards.filter(w => !w.dead);
        if (live.length) {
          const w = live[Math.floor(this.roll() * live.length)];
          w.hp -= def.wardHp * def.bleed.v;
          this.events.push({ k: 'bleed', uid: w.uid });
          if (w.hp <= 0) this.kill(w, null);
        }
      }
      let lost = null;
      if (!a || a.dead || a.ghost) lost = 'dead';
      else if (dist(a, def.center) > def.radius) lost = 'left';
      else if (wards.some(w => w.dead)) lost = 'ward';
      if (lost) return this.endTrial(false, lost);
      if (def.need && T.broke.length >= def.need) return this.endTrial(true);
      if (tick >= T.end) return def.need ? this.endTrial(false, 'time') : this.endTrial(true);
    },

    raidStep(f) {
      const tick = this.state.tick, rt = HO.FOE_RT[f.id];
      let t = null, best = Infinity;
      for (const n of this.state.actors) if (n.ward && !n.dead && dist(f, n) < best) { best = dist(f, n); t = n; }
      if (!t) { f.state = 'idle'; return; }
      if (best > rt.range + t.r) { this.steer(f, t, C.foeSpeed * rt.speed, tick); return; }
      f.wx = 0; f.wz = 0;
      this.face(f, t);
      if (tick < f.swingAt) return;
      f.swingAt = tick + sec(rt.swing);
      const sk = HO.FOES[f.id].skills[0];
      this.events.push({ k: 'foeSwing', uid: f.uid, tgt: t.uid, skill: sk.n, bolt: !!rt.bolt, elem: sk.e });
      this.damage(f, t, rt.swing * C.foeK * sk.m, { elems: [sk.e] });
    },

    endTrial(won, why) {
      const T = this.state.trial, a = this.byUid(T.hero);
      const gone = new Set([...T.foes, ...T.wards]);
      this.state.actors = this.state.actors.filter(x => !gone.has(x.uid));
      for (const h of this.heroes()) if (gone.has(h.target)) { h.target = 0; h.attacking = false; }
      this.state.trial = null;
      if (won && a) HO.goalProgress(a.sheet, 'trial', T.id, this.events, a.uid);
      this.events.push({ k: 'trialEnd', uid: T.hero, trial: T.id, won: !!won, why: why || '' });
    }
  });

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
