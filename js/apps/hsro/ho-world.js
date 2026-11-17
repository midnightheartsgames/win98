(function (HO) {
  'use strict';
  const H = globalThis.Hsr98;
  const N = H.HD.N;
  const T = HO.TUN;
  const C = HO.CMB;
  const sec = s => Math.round(s * T.hz);
  const dist = (a, b) => { const dx = a.x - b.x, dz = a.z - b.z; return Math.sqrt(dx * dx + dz * dz); };
  const DIR8 = [[1, 0], [0.7071, 0.7071], [0, 1], [-0.7071, 0.7071], [-1, 0], [-0.7071, -0.7071], [0, -1], [0.7071, -0.7071]];

  HO.DENY_EXTRA = {
    nothing: 'Сейчас здесь нечего делать',
    full: 'В рюкзаке нет места',
    quests: 'Журнал заданий полон',
    notReady: 'Задание ещё не выполнено',
    repair: 'Лифт в Главную контрольную зону ещё на ремонте',
    here: 'Вы уже здесь',
    combat: 'Нельзя в бою',
    nopick: 'Выберите награду',
    cantEquip: 'Этот предмет не подходит вашему Пути',
    noItem: 'Нет такого предмета',
    ghost: 'Проекция не может этого сделать',
    trainerCap: 'Этому научит наставник вашего Пути',
    anchorUnknown: 'Этот Якорь ещё не открыт',
    noBind: 'Карманный якорь ни к чему не привязан',
    recallCd: 'Карманный якорь ещё перезаряжается',
    corpse: 'Тело слишком далеко',
    nothingToRepair: 'Чинить нечего'
  };
  Object.assign(HO.DENY, HO.DENY_EXTRA);

  Object.assign(HO.World.prototype, {
    afterInit() {
      if (!this.state.gates) {
        this.state.gates = {};
        for (const b of this.zone.boxes) if (b[6] === 'gate') this.state.gates[b[7]] = false;
      }
      this.refreshSolid();
    },

    refreshSolid() {
      const g = this.state.gates || {};
      this.boxes = this.zone.boxes.filter(b => !(b[6] === 'gate' && g[b[7]]));
    },

    nav() {
      const key = JSON.stringify(this.state.gates || {});
      if (!this.navMesh || this.navMesh.zone !== this.zone) this.navMesh = new HO.Nav(this.zone, this.state.gates);
      else if (this.navMesh.key !== key) this.navMesh.build(this.state.gates);
      return this.navMesh;
    },

    spawnNpcs() {
      for (const n of this.zone.npcs || []) {
        const y = Math.max(0, this.floorBelow(n.x, n.z, 50, n.r || 0.6));
        this.state.actors.push({
          uid: this.state.uid++, kind: 'npc', id: n.id, name: n.name, role: n.role || '', look: n.look || 'terminal', r: n.r || (n.look && n.look.type === 'person' ? T.radius : 0.6), h: n.h || 1.7,
          x: n.x, y, z: n.z, yaw: n.yaw || 0, vx: 0, vy: 0, vz: 0, wx: 0, wz: 0, ground: true, dead: false, auras: [],
          home: { x: n.x, y, z: n.z, yaw: n.yaw || 0 }, escort: !!n.escort, follow: 0, path: null, pathAt: -999,
          trains: n.trains || (n.role === 'trainer' ? HO.PATH_IDS.slice() : null), trainMax: n.trainMax || 0, repair: !!n.repair
        });
      }
      for (const o of this.zone.objects || []) {
        this.state.actors.push({
          uid: this.state.uid++, kind: 'obj', id: o.id, name: o.name, look: o.look || 'panel', r: 0.6, h: 1.4,
          x: o.x, y: 0, z: o.z, yaw: 0, ground: true, dead: false, auras: [], hiddenUntil: 0
        });
      }
      for (const an of this.zone.anchors || []) {
        this.state.actors.push({
          uid: this.state.uid++, kind: 'obj', id: an.id, name: 'Якорь пространства «' + an.name + '»', look: 'anchor', anchor: an.id, r: 0.8, h: 2.4,
          x: an.x, y: 0, z: an.z, yaw: 0, ground: true, dead: false, auras: [], hiddenUntil: 0
        });
      }
    },

    objDef(o) {
      if (o.anchor) return { id: o.id, act: 'anchor' };
      if (o.chest) return { id: o.id, act: 'chest' };
      return (this.zone.objects || []).find(d => d.id === o.id && d.x === o.x && d.z === o.z);
    },

    inRest(a) {
      for (const id of this.zone.rest || []) {
        const ar = (this.zone.areas || []).find(z => z.id === id);
        if (ar && a.x > ar.x0 && a.x < ar.x1 && a.z > ar.z0 && a.z < ar.z1) return true;
      }
      return false;
    },

    nearestMed(a) {
      const list = this.zone.medpoints && this.zone.medpoints.length ? this.zone.medpoints : [this.zone.spawn];
      let best = list[0], bd = Infinity;
      for (const m of list) { const d = (m.x - a.x) * (m.x - a.x) + (m.z - a.z) * (m.z - a.z); if (d < bd) { bd = d; best = m; } }
      return best;
    },

    releaseHero(a, mode) {
      const m = this.nearestMed(a);
      a.dead = false;
      a.x = m.x + a.seat * 1.2; a.z = m.z; a.y = Math.max(0, this.floorBelow(a.x, a.z, 50)); a.yaw = 0;
      a.vx = 0; a.vy = 0; a.vz = 0; a.ground = true; a.auto = false; a.sit = false; a.target = 0; a.auras = [];
      if (mode === 'medic') {
        a.ghost = false;
        a.hp = this.stat(a, 'maxHp') * C.releaseHp;
        if (HO.PATHS[a.path].resource !== 'rage') a.res = a.base.pool * C.releaseHp;
        for (const slot of HO.GEAR_SLOTS) { const g = a.sheet.gear[slot]; if (g) g.dur = Math.max(0, g.dur - 25); }
        this.addAura(a, { k: 'debuff', key: 'weak', src: a.uid, until: this.state.tick + sec(120), stat: 'atkP', v: -0.25 });
        this.addAura(a, { k: 'debuff', key: 'weakhp', src: a.uid, until: this.state.tick + sec(120), stat: 'hpP', v: -0.25 });
        a.hp = Math.min(a.hp, this.stat(a, 'maxHp'));
        this.events.push({ k: 'release', uid: a.uid, mode: 'medic' });
      } else {
        a.ghost = true;
        a.hp = 1;
        this.events.push({ k: 'release', uid: a.uid, mode: 'ghost' });
      }
    },

    cmd_revive(c, a) {
      if (!a.ghost) return;
      if (!a.corpse || dist(a, a.corpse) > C.reviveRange) return this.deny(a, 'corpse');
      a.ghost = false;
      a.hp = this.stat(a, 'maxHp') * C.releaseHp;
      if (HO.PATHS[a.path].resource !== 'rage') a.res = a.base.pool * C.releaseHp;
      a.corpse = null;
      a.combatAt = this.state.tick;
      this.events.push({ k: 'revived', uid: a.uid });
    },

    teleport(a, zone, x, z, yaw) {
      if (zone === this.zone.id) {
        Object.assign(a, { x, z, yaw: yaw || 0, vx: 0, vy: 0, vz: 0, ground: true, auto: false, sit: false });
        a.y = Math.max(0, this.floorBelow(x, z, 50));
        this.events.push({ k: 'teleport', uid: a.uid });
      } else {
        HO.goalProgress(a.sheet, 'travel', zone, this.events, a.uid);
        this.events.push({ k: 'travel', uid: a.uid, zone, x, z, yaw: yaw || 0 });
      }
    },

    anchorNear(a) {
      return this.state.actors.find(o => o.kind === 'obj' && o.anchor && dist(a, o) <= C.useRange + o.r + 1) || null;
    },

    cmd_anchorGo(c, a) {
      const here = this.anchorNear(a), sh = a.sheet, to = HO.ANCHORS[c.to];
      if (!here) return this.deny(a, 'far');
      if (a.inCombat) return this.deny(a, 'combat');
      if (!sh.anchors[c.to]) return this.deny(a, 'anchorUnknown');
      if (c.to === here.anchor) return this.deny(a, 'here');
      const cost = 5 * sh.lvl;
      if (sh.credits < cost) return this.deny(a, 'credits');
      sh.credits -= cost;
      this.events.push({ k: 'anchorPaid', uid: a.uid, v: cost });
      const at = HO.anchorSpot(c.to);
      this.teleport(a, at.zone, at.x, at.z, 0);
    },

    cmd_bind(c, a) {
      const here = this.anchorNear(a);
      if (!here || here.anchor !== c.anchor) return this.deny(a, 'far');
      a.sheet.bind = c.anchor;
      HO.goalProgress(a.sheet, 'bind', c.anchor, this.events, a.uid);
      this.events.push({ k: 'bound', uid: a.uid, anchor: c.anchor });
    },

    cmd_repair(c, a) {
      const n = this.byUid(c.uid);
      if (!n || n.kind !== 'npc' || !n.repair || !this.near(a, n, 1)) return this.deny(a, 'far');
      const cost = HO.repairCost(a.sheet);
      if (!cost) return this.deny(a, 'nothingToRepair');
      if (a.sheet.credits < cost) return this.deny(a, 'credits');
      a.sheet.credits -= cost;
      for (const slot of HO.GEAR_SLOTS) if (a.sheet.gear[slot]) a.sheet.gear[slot].dur = 100;
      this.events.push({ k: 'repaired', uid: a.uid, v: cost });
    },

    spawnChest(f) {
      if (this.state.actors.some(o => o.chest)) return;
      this.state.actors.push({
        uid: this.state.uid++, kind: 'obj', id: 'incubator_chest', name: f.crumbled ? 'Сундук Инкубатора' : 'Сундук Инкубатора (ранняя победа)', look: 'chest', r: 0.8, h: 1,
        x: f.home.x, y: f.home.y, z: f.home.z - 6, yaw: 0, ground: true, dead: false, auras: [], hiddenUntil: 0, chest: { bonus: !f.crumbled }, opened: []
      });
      this.events.push({ k: 'chestUp', uid: 0, bonus: !f.crumbled });
    },

    openChest(a, o) {
      const sh = a.sheet, slots = ['head', 'hands', 'body', 'feet'];
      if (o.opened.includes(a.uid)) return this.deny(a, 'nothing');
      const bonus = o.chest.bonus && sh.chestDay !== this.state.day;
      const items = ['rel3_' + slots[Math.floor(this.roll() * 4)]];
      if (bonus) items.push('rel4_' + slots[Math.floor(this.roll() * 4)], HO.PATH_CONE4[a.path]);
      if (HO.bagFree(sh) < items.length) return this.deny(a, 'full');
      for (const id of items) HO.bagAdd(sh, id, 1);
      const credits = bonus ? 30 : 10;
      sh.credits += credits;
      if (bonus) sh.chestDay = this.state.day;
      o.opened.push(a.uid);
      this.events.push({ k: 'chest', uid: a.uid, items, credits, bonus });
    },

    npcDef(n) {
      return (this.zone.npcs || []).find(d => d.id === n.id);
    },

    near(a, b, extra) {
      return !!b && dist(a, b) <= C.talkRange + (b.r || 0) + (extra || 0);
    },

    npcById(id) {
      return this.state.actors.find(n => n.kind === 'npc' && n.id === id) || null;
    },

    denyText(a, why, text) {
      this.events.push({ k: 'deny', uid: a.uid, why, text });
      return false;
    },

    giveXp(h, xp, kill) {
      const sh = h.sheet;
      if (!xp || sh.lvl >= HO.MAX_LEVEL) return;
      let bonus = 0;
      if (kill && sh.rested > 0) { bonus = Math.min(xp, Math.floor(sh.rested)); sh.rested -= bonus; }
      xp += bonus;
      sh.xp += xp;
      this.events.push({ k: 'xp', uid: h.uid, v: xp, rested: bonus });
      while (sh.lvl < HO.MAX_LEVEL && sh.xp >= HO.xpNeed(sh.lvl)) {
        sh.xp -= HO.xpNeed(sh.lvl);
        sh.lvl++;
        this.levelUp(h);
      }
      if (sh.lvl >= HO.MAX_LEVEL) sh.xp = 0;
    },

    reward(f) {
      const d = HO.FOES[f.id], table = HO.LOOT[f.id] || { credits: 1, junk: [] };
      f.loot = {};
      const paid = new Set();
      for (const k in f.threat) {
        const h = this.ownerOf(this.byUid(Number(k)));
        if (!h || h.kind !== 'hero' || h.companion || h.dead || paid.has(h.uid) || dist(h, f) > C.groupRange) continue;
        paid.add(h.uid);
        const sh = h.sheet;
        sh.kills++;
        this.giveXp(h, HO.killXp(h.lvl, f.lvl, d.elite), true);
        HO.goalProgress(sh, 'kill', f.id, this.events, h.uid);
        const items = [];
        if (!this.zone.instance) for (const [id, p] of table.junk || []) if (this.roll() < p) items.push({ id, n: 1 });
        for (const [id, p] of table.quest || []) if (HO.wantsItem(sh, id) && this.roll() < p) items.push({ id, n: 1 });
        for (const [id, p] of table.gear || []) if (this.roll() < p) items.push({ id, n: 1 });
        for (const [, p] of table.pathGear || []) if (this.roll() < p) items.push({ id: HO.PATH_CONE4[h.path], n: 1 });
        if (f.id === 'doomsday') {
          if (!sh.echoWin) { items.push({ id: HO.PATH_CONE4[h.path], n: 1 }); sh.echoWin = 1; }
          if (sh.echoDay !== this.state.day) {
            for (let i = 0; i < 2; i++) items.push({ id: 'rel4_' + ['head', 'hands', 'body', 'feet'][Math.floor(this.roll() * 4)], n: 1 });
            sh.echoDay = this.state.day;
          }
        }
        const credits = Math.round(HO.killCredits(f.lvl, d.elite) * (table.credits || 1) * (this.zone.creditMul || 1));
        f.loot[h.uid] = { credits, items };
      }
      if (f.id === 'skaracabaz') this.spawnChest(f);
    },

    applyWorld(c, a) {
      if (a.dead && c.t !== 'abandon') return this.deny(a, 'dead');
      if (a.ghost && c.t !== 'revive' && c.t !== 'abandon') return this.deny(a, 'ghost');
      const fn = this['cmd_' + c.t];
      if (fn) fn.call(this, c, a);
    },

    cmd_talk(c, a) {
      const n = this.npcNear(a, c.uid);
      if (!n) return this.deny(a, 'far');
      a.target = n.uid;
      this.face(a, n);
      if (n.kind === 'npc') HO.goalProgress(a.sheet, 'talk', n.id, this.events, a.uid);
      this.events.push({ k: 'talk', uid: a.uid, npc: n.uid, role: n.role });
    },

    cmd_accept(c, a) {
      const q = HO.QUESTS[c.q], n = q && this.npcById(q.giver);
      if (!q || !this.near(a, n, 1)) return this.deny(a, 'far');
      if (!HO.questAvailable(a.sheet, c.q)) return this.deny(a, 'level');
      if (Object.keys(a.sheet.quests).length >= HO.MAX_QUESTS) return this.deny(a, 'quests');
      a.sheet.quests[c.q] = { prog: q.goals.map(() => 0) };
      for (const [id, k] of q.give) HO.bagAdd(a.sheet, id, k);
      for (const g of q.goals) if (g.k === 'escort') { const e = this.npcById(g.npc); if (e) { e.follow = a.uid; e.path = null; } }
      this.events.push({ k: 'questAccept', uid: a.uid, q: c.q });
    },

    cmd_abandon(c, a) {
      const q = HO.QUESTS[c.q];
      if (!q || !a.sheet.quests[c.q]) return;
      delete a.sheet.quests[c.q];
      for (const g of q.goals) if (g.k === 'escort') this.resetEscort(g.npc);
      this.events.push({ k: 'questAbandon', uid: a.uid, q: c.q });
    },

    resetEscort(id) {
      const e = this.npcById(id);
      if (!e) return;
      Object.assign(e, { follow: 0, path: null, x: e.home.x, y: e.home.y, z: e.home.z, yaw: e.home.yaw, wx: 0, wz: 0 });
    },

    cmd_turnIn(c, a) {
      const q = HO.QUESTS[c.q], sh = a.sheet, n = q && this.npcById(q.turnIn);
      if (!q || !sh.quests[c.q]) return this.deny(a, 'nothing');
      if (!this.near(a, n, 1)) return this.deny(a, 'far');
      if (!HO.questReady(sh, c.q)) return this.deny(a, 'notReady');
      const r = q.reward || {};
      if (r.trace && !(HO.TRACES[a.path] || []).some(t => t.id === c.trace)) return this.deny(a, 'nopick');
      const items = (r.items || []).slice();
      if (r.pathItem3) items.push([HO.PATH_CONE3[a.path], 1]);
      if (r.choice) {
        if (!(c.pick >= 0 && c.pick < r.choice.length)) return this.deny(a, 'nopick');
        items.push([r.choice[c.pick], 1]);
      }
      if (r.pathItem) items.push([HO.PATH_CONE[a.path], 1]);
      for (const g of q.goals) if (g.k === 'collect') HO.bagRemove(sh, g.item, g.n);
      for (const id of q.take || []) HO.bagRemove(sh, id, HO.bagCount(sh, id));
      const need = items.filter(([id]) => !sh.bag.some(s => s && s.id === id && s.n < HO.ITEMS[id].stack)).length;
      if (HO.bagFree(sh) < need) {
        for (const g of q.goals) if (g.k === 'collect') HO.bagAdd(sh, g.item, g.n);
        return this.deny(a, 'full');
      }
      for (const [id, k] of items) HO.bagAdd(sh, id, k);
      sh.credits += r.credits || 0;
      if (r.ult) for (const id of HO.pathAbilities(a.path)) if (HO.ABILITIES[id].ult) sh.learned[id] = 1;
      if (r.trace) sh.trace = c.trace;
      if (r.title) sh.title = r.title;
      delete sh.quests[c.q];
      sh.done[c.q] = 1;
      for (const g of q.goals) if (g.k === 'escort') this.resetEscort(g.npc);
      this.events.push({ k: 'questDone', uid: a.uid, q: c.q, credits: r.credits || 0, items });
      this.giveXp(a, HO.questXp(q));
    },

    cmd_use(c, a) {
      const o = this.byUid(c.uid);
      if (!o || o.kind !== 'obj' || this.state.tick < o.hiddenUntil) return this.deny(a, 'target');
      if (dist(a, o) > C.useRange + o.r) return this.deny(a, 'far');
      const d = this.objDef(o) || {};
      this.face(a, o);
      if (d.act === 'lift') { this.events.push({ k: 'liftMenu', uid: a.uid, obj: o.uid }); return; }
      if (d.act === 'anchor') { this.events.push({ k: 'anchorMenu', uid: a.uid, obj: o.uid }); return; }
      if (d.act === 'trial') return this.startTrial(a, d.trial);
      if (d.act === 'chest') return this.openChest(a, o);
      if (d.act === 'party') {
        if (!d.dungeon && !(d.group || []).some(q => a.sheet.quests[q])) return this.denyText(a, 'locked', 'Напарники приходят только на групповые задания');
        return this.summonParty(a);
      }
      if (d.act === 'locked') return this.denyText(a, 'locked', d.deny);
      if (d.needDone && !a.sheet.done[d.needDone]) return this.denyText(a, 'locked', d.deny);
      if (d.opensAfter && !a.sheet.done[d.opensAfter] && !HO.wantsObject(a.sheet, o.id)) return this.denyText(a, 'locked', d.deny);
      if (d.opensFor && !a.sheet.quests[d.opensFor] && !a.sheet.done[d.opensFor]) return this.denyText(a, 'locked', d.deny);
      if (d.act === 'travel' || (d.opensAfter && a.sheet.done[d.opensAfter])) {
        if (a.inCombat) return this.deny(a, 'combat');
        HO.goalProgress(a.sheet, 'use', o.id, this.events, a.uid);
        this.teleport(a, d.zone, d.to.x, d.to.z, d.to.yaw);
        return;
      }
      if (d.act !== 'gate' && d.need && !HO.bagCount(a.sheet, d.need)) return this.denyText(a, 'locked', 'Нужен предмет: ' + HO.ITEMS[d.need].name);
      if (d.act === 'gate') {
        if (d.need && !HO.bagCount(a.sheet, d.need)) return this.denyText(a, 'locked', d.deny);
        if (!this.state.gates[d.gate]) {
          this.state.gates[d.gate] = true;
          this.refreshSolid();
          this.events.push({ k: 'gate', uid: a.uid, gate: d.gate, open: true });
        }
        HO.goalProgress(a.sheet, 'use', o.id, this.events, a.uid);
        return;
      }
      if (!HO.wantsObject(a.sheet, o.id)) return this.deny(a, 'nothing');
      if (d.calm && a.inCombat) return this.denyText(a, 'combat', 'Создание пугается боя. Сначала закончите бой');
      if (d.give) {
        if (!HO.bagAdd(a.sheet, d.give, 1)) return this.deny(a, 'full');
        this.events.push({ k: 'got', uid: a.uid, item: d.give, n: 1 });
      }
      if (d.aura) this.addAura(a, { k: d.aura.k, key: d.aura.k, src: a.uid, until: this.state.tick + sec(d.aura.dur) });
      if (d.effect === 'slow') this.addAura(a, { k: 'debuff', key: 'weight', src: a.uid, until: this.state.tick + sec(10), stat: 'moveP', v: -0.4 });
      if (d.effect === 'lure') {
        const f = this.foes().filter(x => !x.dead && x.state === 'idle' && dist(x, a) < 25).sort((p, q) => dist(p, a) - dist(q, a) || p.uid - q.uid)[0];
        if (f) this.aggro(f, a);
      }
      if (d.ambush) {
        for (let i = 0; i < 2; i++) {
          const f = this.addFoe(d.ambush[0], { x: o.x + (i ? 1.5 : -1.5), z: o.z + 1.5, yaw: 0 }, d.ambush[1]);
          f.once = true;
          this.aggro(f, a);
        }
      }
      if (d.respawn) o.hiddenUntil = this.state.tick + sec(d.respawn);
      HO.goalProgress(a.sheet, 'use', o.id, this.events, a.uid);
      this.events.push({ k: 'used', uid: a.uid, obj: o.uid });
    },

    cmd_lift(c, a) {
      const lift = this.state.actors.find(o => o.kind === 'obj' && (this.objDef(o) || {}).act === 'lift');
      if (!lift || dist(a, lift) > C.useRange + lift.r + 1) return this.deny(a, 'far');
      if (a.inCombat) return this.deny(a, 'combat');
      if (c.zone === this.zone.id) return this.deny(a, 'here');
      if (!HO.TRAVEL[c.zone] || (HO.LIFT_ZONES && !HO.LIFT_ZONES.includes(c.zone))) return this.deny(a, 'repair');
      HO.goalProgress(a.sheet, 'travel', c.zone, this.events, a.uid);
      const t = HO.TRAVEL[c.zone];
      this.events.push({ k: 'travel', uid: a.uid, zone: c.zone, x: t.x, z: t.z, yaw: t.yaw });
    },

    cmd_loot(c, a) {
      const f = this.byUid(c.uid);
      if (!f || f.kind !== 'foe' || !f.dead || !f.loot || !f.loot[a.uid]) return this.deny(a, 'nothing');
      if (dist(a, f) > C.useRange + f.r) return this.deny(a, 'far');
      const L = f.loot[a.uid], took = [];
      if (L.credits) { a.sheet.credits += L.credits; this.events.push({ k: 'credits', uid: a.uid, v: L.credits }); L.credits = 0; }
      L.items = L.items.filter((it, i) => {
        if (c.i >= 0 && c.i !== i) return true;
        const got = HO.bagAdd(a.sheet, it.id, it.n);
        if (got) took.push({ id: it.id, n: got });
        it.n -= got;
        return it.n > 0;
      });
      for (const t of took) this.events.push({ k: 'got', uid: a.uid, item: t.id, n: t.n });
      if (L.items.length && c.i < 0) this.deny(a, 'full');
      if (!L.items.length && !L.credits) delete f.loot[a.uid];
      this.events.push({ k: 'looted', uid: a.uid, foe: f.uid });
    },

    vendorNear(a, uid) {
      const n = this.byUid(uid);
      return n && n.kind === 'npc' && n.role === 'vendor' && this.near(a, n, 1) ? n : null;
    },

    cmd_buy(c, a) {
      const n = this.vendorNear(a, c.uid), def = n && this.npcDef(n);
      if (!n) return this.deny(a, 'far');
      if (!def.stock.includes(c.item)) return this.deny(a, 'noItem');
      const price = HO.buyPrice(a.sheet, c.item);
      if (a.sheet.credits < price) return this.deny(a, 'credits');
      if (!HO.bagAdd(a.sheet, c.item, 1)) return this.deny(a, 'full');
      a.sheet.credits -= price;
      this.events.push({ k: 'bought', uid: a.uid, item: c.item, price });
    },

    cmd_sell(c, a) {
      if (!this.vendorNear(a, c.uid)) return this.deny(a, 'far');
      const sh = a.sheet, s = sh.bag[c.slot];
      if (!s) return this.deny(a, 'noItem');
      const it = HO.ITEMS[s.id];
      if (it.kind === 'quest') return this.deny(a, 'nothing');
      const v = HO.sellPrice(s.id) * s.n;
      sh.credits += v;
      sh.buyback.push(s.dur >= 0 ? { id: s.id, n: s.n, price: v, dur: s.dur } : { id: s.id, n: s.n, price: v });
      if (sh.buyback.length > 10) sh.buyback.shift();
      sh.bag[c.slot] = null;
      this.events.push({ k: 'sold', uid: a.uid, item: s.id, n: s.n, v });
    },

    cmd_sellJunk(c, a) {
      if (!this.vendorNear(a, c.uid)) return this.deny(a, 'far');
      let total = 0;
      a.sheet.bag.forEach((s, i) => { if (s && HO.ITEMS[s.id].kind === 'junk') { total += HO.sellPrice(s.id) * s.n; a.sheet.bag[i] = null; } });
      a.sheet.credits += total;
      this.events.push({ k: 'sold', uid: a.uid, item: 'junk', n: 0, v: total });
    },

    cmd_buyback(c, a) {
      if (!this.vendorNear(a, c.uid)) return this.deny(a, 'far');
      const sh = a.sheet, b = sh.buyback[c.i];
      if (!b) return this.deny(a, 'noItem');
      if (sh.credits < b.price) return this.deny(a, 'credits');
      if (b.dur >= 0) {
        const free = sh.bag.indexOf(null);
        if (free < 0) return this.deny(a, 'full');
        sh.bag[free] = { id: b.id, n: 1, dur: b.dur };
      } else if (HO.bagAdd(sh, b.id, b.n) < b.n) return this.deny(a, 'full');
      sh.credits -= b.price;
      sh.buyback.splice(c.i, 1);
      this.events.push({ k: 'bought', uid: a.uid, item: b.id, price: b.price });
    },

    cmd_equip(c, a) {
      const sh = a.sheet, s = sh.bag[c.slot];
      if (!s) return this.deny(a, 'noItem');
      if (!HO.canEquip(sh, s.id)) return this.deny(a, 'cantEquip');
      if (a.inCombat && HO.ITEMS[s.id].slot === 'cone') return this.deny(a, 'combat');
      const slot = HO.ITEMS[s.id].slot, was = this.stat(a, 'maxHp');
      const old = sh.gear[slot];
      sh.gear[slot] = { id: s.id, dur: s.dur >= 0 ? s.dur : 100 };
      sh.bag[c.slot] = old ? { id: old.id, n: 1, dur: old.dur } : null;
      a.hp = Math.min(this.stat(a, 'maxHp'), a.hp * this.stat(a, 'maxHp') / was);
      this.events.push({ k: 'equip', uid: a.uid, item: s.id, slot });
    },

    cmd_unequip(c, a) {
      const sh = a.sheet, g = sh.gear[c.gear];
      if (!g) return this.deny(a, 'noItem');
      if (!HO.bagFree(sh)) return this.deny(a, 'full');
      const was = this.stat(a, 'maxHp');
      sh.gear[c.gear] = null;
      sh.bag[sh.bag.indexOf(null)] = { id: g.id, n: 1, dur: g.dur };
      a.hp = Math.min(this.stat(a, 'maxHp'), a.hp * this.stat(a, 'maxHp') / was);
      this.events.push({ k: 'equip', uid: a.uid, item: g.id, slot: c.gear, off: true });
    },

    cmd_item(c, a) {
      const sh = a.sheet, s = sh.bag[c.slot];
      if (!s) return this.deny(a, 'noItem');
      const it = HO.ITEMS[s.id];
      if (!it.use) {
        if (it.kind === 'gear') return this.cmd_equip(c, a);
        return this.deny(a, 'nothing');
      }
      const tick = this.state.tick;
      if (it.use.recall) {
        if (a.inCombat) return this.deny(a, 'combat');
        if (!sh.bind) return this.deny(a, 'noBind');
        if (sh.clock < sh.recallAt) return this.deny(a, 'recallCd');
        sh.recallAt = sh.clock + it.use.recall;
        const an = HO.ANCHORS[sh.bind];
        this.events.push({ k: 'usedItem', uid: a.uid, item: s.id });
        const at = HO.anchorSpot(sh.bind);
        this.teleport(a, at.zone, at.x, at.z, 0);
        return;
      }
      if (it.use.scan) {
        const t = this.byUid(a.target);
        if (!t || t.kind !== 'foe' || t.dead) return this.deny(a, 'target');
        if (dist(a, t) > it.use.scan) return this.deny(a, 'range');
        HO.goalProgress(sh, 'scan', t.id, this.events, a.uid);
        this.events.push({ k: 'scanned', uid: a.uid, foe: t.uid });
        return;
      }
      if (it.use.bag) {
        if (sh.bagSize > HO.BAG_SIZE) return this.deny(a, 'known');
        HO.bagRemove(sh, s.id, 1);
        sh.bagSize = HO.BAG_SIZE + it.use.bag;
        while (sh.bag.length < sh.bagSize) sh.bag.push(null);
        this.events.push({ k: 'usedItem', uid: a.uid, item: s.id });
        return;
      }
      if (it.kind === 'potion') {
        if ((a.cds['item:' + s.id] || 0) > tick) return this.deny(a, 'cd');
        a.cds['item:' + s.id] = tick + sec(it.use.cd);
        this.heal(a, a, this.stat(a, 'maxHp') * it.use.heal);
      } else {
        if (a.inCombat) return this.deny(a, 'combat');
        a.sit = true;
        a.mf = 0; a.ms = 0; a.auto = false;
        this.addAura(a, { k: it.kind === 'food' ? 'eat' : 'drink', key: it.kind, src: a.uid, until: tick + sec(it.use.dur), rate: 1 / sec(it.use.dur) });
      }
      HO.bagRemove(sh, s.id, 1);
      this.events.push({ k: 'usedItem', uid: a.uid, item: s.id });
    },

    worldTick() {
      const tick = this.state.tick;
      for (const a of this.state.actors) {
        if (a.kind === 'hero' && !a.dead) {
          for (const x of a.auras.slice()) {
            if (x.k !== 'eat' && x.k !== 'drink') continue;
            if (!a.sit || a.inCombat) { this.dropAura(a, x); continue; }
            if (x.k === 'eat') a.hp = Math.min(this.stat(a, 'maxHp'), a.hp + this.stat(a, 'maxHp') * x.rate);
            else if (a.base.pool) a.res = Math.min(a.base.pool, a.res + a.base.pool * x.rate);
          }
        }
        if (a.kind === 'npc' && a.follow) this.followTick(a, tick);
        if (a.kind === 'hero' && !a.dead && a.sheet) {
          a.resting = this.inRest(a);
          const need = HO.xpNeed(a.sheet.lvl);
          if (a.resting && need) a.sheet.rested = Math.min(need * 1.5, a.sheet.rested + need * 0.05 / (8 * 3600) * HO.DT);
          if (tick % 5 === 0) for (const o of this.state.actors) {
            if (o.kind !== 'obj' || !o.anchor || dist(a, o) > 6) continue;
            if (!a.sheet.anchors[o.anchor] && !a.ghost) { a.sheet.anchors[o.anchor] = 1; this.events.push({ k: 'anchorFound', uid: a.uid, anchor: o.anchor }); }
            if (!a.ghost) HO.goalProgress(a.sheet, 'anchor', o.anchor, this.events, a.uid);
          }
        }
      }
      if (this.trialTick) this.trialTick();
      if (this.partyTick) this.partyTick();
    },

    followTick(n, tick) {
      const h = this.byUid(n.follow);
      n.wx = 0; n.wz = 0;
      if (!h || h.dead) return;
      const sh = h.sheet;
      for (const qid of Object.keys(sh.quests)) {
        HO.QUESTS[qid].goals.forEach((g, i) => {
          if (g.k !== 'escort' || g.npc !== n.id || sh.quests[qid].prog[i]) return;
          const ar = (this.zone.areas || []).find(z => z.id === g.area);
          if (ar && n.x > ar.x0 && n.x < ar.x1 && n.z > ar.z0 && n.z < ar.z1) {
            HO.goalProgress(sh, 'escort', n.id, this.events, h.uid);
            n.follow = 0;
          }
        });
      }
      if (!n.follow) return;
      const d = dist(n, h);
      if (d < 2.5) return;
      this.steer(n, h, 6.2, tick);
    },

    steer(a, t, speed, tick) {
      const nav = this.nav();
      const d = dist(a, t);
      let tx = t.x, tz = t.z;
      if (!nav.clear(a.x, a.z, t.x, t.z)) {
        if (!a.path || tick - a.pathAt > sec(1) || !a.path.length) {
          a.path = nav.path(a.x, a.z, t.x, t.z, 20000) || [];
          a.pathAt = tick;
        }
        while (a.path.length && (a.path[0][0] - a.x) * (a.path[0][0] - a.x) + (a.path[0][1] - a.z) * (a.path[0][1] - a.z) < 0.36) a.path.shift();
        if (a.path.length) { tx = a.path[0][0]; tz = a.path[0][1]; }
      } else a.path = null;
      const dx = tx - a.x, dz = tz - a.z, l = Math.sqrt(dx * dx + dz * dz) || d || 1;
      a.wx = dx / l * speed; a.wz = dz / l * speed;
      if (dx !== 0 || dz !== 0) a.yaw = HO.wrapAngle(N.atan2(dx, -dz));
    },

    fleeStep(f, h) {
      const nav = this.nav(), sp = C.foeSpeed * HO.FOE_RT[f.id].speed;
      let best = null, bestD = -1;
      for (const [dx, dz] of DIR8) {
        const x = f.x + dx * 3, z = f.z + dz * 3;
        if (!nav.clear(f.x, f.z, x, z)) continue;
        const d = (x - h.x) * (x - h.x) + (z - h.z) * (z - h.z);
        if (d > bestD) { bestD = d; best = [dx, dz]; }
      }
      if (!best) return;
      f.wx = best[0] * sp; f.wz = best[1] * sp;
      f.yaw = HO.wrapAngle(N.atan2(best[0], -best[1]));
    }
  });

  if (typeof module !== 'undefined') module.exports = HO;
})(globalThis.HO = globalThis.HO || {});
