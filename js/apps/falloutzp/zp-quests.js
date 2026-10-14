(function (Z) {
  'use strict';

  Z.QUESTS = Z.QUESTS || {};
  Z.LOCATIONS = Z.LOCATIONS || [];
  Z.NOTES = Z.NOTES || {};
  const G = Z.Game.prototype;

  Z.GAME_INIT.push(g => {
    g.quests = {};
    g.notes = [];
    g.locations = Z.LOCATIONS.map(l => Object.assign({}, l, { found: false }));
    g.hooks.push((game, dt) => game.stepDiscovery(dt));
  });

  G.setStage = function (id, stage, opts = {}) {
    const def = Z.QUESTS[id];
    if (!def) throw new Error('quest ' + id);
    const q = this.quests[id] || (this.quests[id] = { stage: 0, log: [], done: false, failed: false });
    if (stage <= q.stage && !opts.force) return false;
    const first = q.stage === 0;
    q.stage = stage;
    if (!q.log.includes(stage)) q.log.push(stage);
    const st = def.stages[stage] || {};
    if (first) { this.msg('Новое задание: ' + def.title, 'quest'); if (!this.tracked || def.main) this.tracked = id; }
    else if (st.done) this.msg('Задание выполнено: ' + def.title, 'quest');
    else if (st.fail) this.msg('Задание провалено: ' + def.title, 'warn');
    else if (!opts.silent) this.msg('Задание обновлено: ' + def.title, 'quest');
    if (st.done) { q.done = true; if (def.xp) this.giveXP(def.xp, def.title); if (this.tracked === id) this.tracked = null; }
    if (st.fail) { q.failed = true; q.done = true; if (this.tracked === id) this.tracked = null; }
    if (st.xp) this.giveXP(st.xp);
    this.ev.emit('quest', { id, stage });
    if (def.onStage) def.onStage(this, stage);
    if (st.run) st.run(this);
    return true;
  };

  G.stage = function (id) { const q = this.quests[id]; return q ? q.stage : 0; };

  G.questList = function () {
    const out = [];
    for (const id in this.quests) {
      const q = this.quests[id], def = Z.QUESTS[id];
      if (!def) continue;
      const objectives = [];
      for (const s of q.log) {
        const st = def.stages[s];
        if (!st || !st.text) continue;
        objectives.push({ text: this.subst(st.text), done: s !== q.stage || st.done || st.fail });
      }
      out.push({ id, title: def.title, desc: this.subst(def.desc || ''), objectives, done: q.done, tracked: this.tracked === id, main: def.main });
    }
    out.sort((a, b) => (a.done - b.done) || (b.main - a.main) || a.title.localeCompare(b.title, 'ru'));
    return out;
  };

  G.trackQuest = function (id) { this.tracked = this.tracked === id ? null : id; };

  G.markerPos = function (m) {
    if (!m) return null;
    if (m.npc) {
      const a = this.findActor(m.npc);
      if (!a || a.dead) return null;
      return { x: a.x, z: a.z, cell: a.cell || 'ext' };
    }
    if (m.obj) {
      for (const c of this.cells.values()) { const o = c.objects.find(ob => ob.id === m.obj); if (o) return { x: o.x, z: o.z, cell: c.id }; }
      return null;
    }
    if (m.loc) { const l = this.locations.find(x => x.id === m.loc); return l ? { x: l.x, z: l.z, cell: 'ext' } : null; }
    return { x: m.x, z: m.z, cell: m.cell || 'ext' };
  };

  G.questMarkers = function () {
    const out = [];
    const ids = this.tracked ? [this.tracked] : [];
    for (const id of ids) {
      const q = this.quests[id], def = Z.QUESTS[id];
      if (!q || !def || q.done) continue;
      const st = def.stages[q.stage];
      if (!st || !st.marker) continue;
      for (const m of [].concat(st.marker)) {
        const pos = this.markerPos(m);
        if (!pos) continue;
        if (pos.cell !== this.cell.id) {
          if (this.cell.exterior) { const door = this.doorTo(pos.cell); if (door) out.push({ x: door.x, z: door.z, cell: 'ext', id }); }
          else { const exit = this.cell.objects.find(o => o.T.door && o.to); if (exit) out.push({ x: exit.x, z: exit.z, cell: this.cell.id, id }); }
          continue;
        }
        out.push(Object.assign(pos, { id }));
      }
    }
    return out;
  };

  G.doorTo = function (cellId) {
    for (const o of this.ext.objects) if (o.T.door && o.to === cellId) return o;
    for (const o of this.ext.objects) if (o.T.door && o.to && Z.INTERIORS[o.to] && Z.INTERIORS[o.to].parentOf && Z.INTERIORS[o.to].parentOf.includes(cellId)) return o;
    return null;
  };

  G.discover = function (id, silent) {
    const l = this.locations.find(x => x.id === id);
    if (!l || l.found) return;
    l.found = true;
    this.flags['found_' + id] = true;
    if (!silent) { this.msg('Найдено: ' + l.name, 'loc'); this.giveXP(l.xp || 15); }
    this.ev.emit('discover', { id });
  };

  G.stepDiscovery = function (dt) {
    this.discT = (this.discT || 0) - dt;
    if (this.discT > 0 || !this.cell.exterior) return;
    this.discT = 0.5;
    const p = this.player;
    if (!p) return;
    this.lastExt = [p.x, p.z];
    for (const l of this.locations) if (!l.found && Math.hypot(l.x - p.x, l.z - p.z) < (l.r || 40)) this.discover(l.id);
  };

  G.canFastTravel = function () {
    if (!this.cell.exterior) return 'Быстрое перемещение возможно только снаружи.';
    if (this.cell.actors.some(a => a.ai && !a.dead && a.ai.state === 'combat' && this.hostileToPlayer(a) && Math.hypot(a.x - this.player.x, a.z - this.player.z) < 60)) return 'Рядом враги.';
    if (this.player.weight() > this.player.sheet.carry() && !this.player.sheet.has('chumak')) return 'Вы перегружены.';
    if (this.flags.noTravel) return this.flags.noTravel;
    return null;
  };

  G.fastTravel = function (id) {
    const l = this.locations.find(x => x.id === id);
    if (!l || !l.found) return false;
    const why = this.canFastTravel();
    if (why) { this.msg(why, 'warn'); return false; }
    const p = this.player;
    const d = Math.hypot(l.x - p.x, l.z - p.z);
    const minutes = Math.round(d / 1.3 / 60 * 4);
    const t = l.arrive || [l.x, l.z, 0];
    p.x = t[0]; p.z = t[1]; p.y = this.cell.cw.groundAt(p.x, p.z, 200); p.yaw = t[2] || 0; p.vx = p.vz = 0;
    for (const a of this.cell.actors) if (a.companion && !a.dead && !(a.ai && a.ai.wait)) { a.x = p.x + 1.5; a.z = p.z + 1; a.y = this.cell.cw.groundAt(a.x, a.z, p.y + 3); }
    this.time += minutes;
    this.ev.emit('travel', { id, minutes });
    this.msg('Дорога заняла ' + Math.max(1, Math.round(minutes)) + ' мин.', 'info');
    return true;
  };

  G.compassMarks = function () {
    const p = this.player, out = [];
    const per = p.sheet.stat('per');
    const range = 20 + per * 8;
    for (const a of this.cell.actors) {
      if (a === p || a.dead || a.hidden) continue;
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      if (d > range) continue;
      if (this.hostileToPlayer(a)) out.push({ x: a.x, z: a.z, kind: 'enemy' });
      else if (a.companion || a.canTalk) out.push({ x: a.x, z: a.z, kind: 'friend', col: 'rgba(255,182,66,0.75)' });
    }
    for (const m of this.questMarkers()) out.push({ x: m.x, z: m.z, kind: 'quest' });
    if (this.cell.exterior) for (const l of this.locations) {
      const d = Math.hypot(l.x - p.x, l.z - p.z);
      if (d < 220 && (l.found || d < 120)) out.push({ x: l.x, z: l.z, kind: 'loc', col: l.found ? '#ffb642' : 'rgba(255,182,66,0.4)' });
    }
    return out;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
