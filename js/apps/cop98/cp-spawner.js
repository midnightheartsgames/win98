(function (C) {
  'use strict';
  const D = C.DATA;
  const STACKED = new Set(['ammo', 'consumable', 'part', 'grenade']);
  const TALK = { stalker: 'stalker', bandit: 'bandit' };
  const ITEM_SHELVES = [
    ['weapon', 'Оружие', ['weapon', 'grenade']],
    ['ammo', 'Патроны', ['ammo']],
    ['outfit', 'Броня', ['outfit']],
    ['detector', 'Детекторы', ['detector']],
    ['artifact', 'Артефакты', ['artifact']],
    ['consumable', 'Медицина и еда', ['consumable']],
    ['part', 'Трофеи', ['part']],
    ['quest', 'Сюжетные', ['quest']]
  ];

  const itemShelf = ([id, title, types]) => ({
    id, title, group: 'items', kind: 'item',
    entries: Object.values(D.ITEMS).filter(it => types.includes(it.type)).map(it => ({ id: it.id, kind: 'item', name: it.name }))
  });
  const creatureShelf = (id, title, human) => ({
    id, title, group: 'world', kind: 'creature',
    entries: Object.entries(D.NPC_TYPES).filter(([, T]) => (T.kind === 'human') === human).map(([type, T]) => ({ id: type, kind: 'creature', name: T.title }))
  });

  const SPAWN_CATALOG = [
    ...ITEM_SHELVES.map(itemShelf),
    creatureShelf('human', 'Люди', true),
    creatureShelf('mutant', 'Мутанты', false),
    { id: 'anomaly', title: 'Аномалии', group: 'world', kind: 'anomaly', entries: Object.entries(D.ANOMALY_TYPES).map(([id, A]) => ({ id, kind: 'anomaly', name: A.name })) },
    { id: 'weather', title: 'Погода', group: 'world', kind: 'weather', entries: C.WEATHER_KINDS.map(id => ({ id, kind: 'weather', name: C.WEATHER[id].name })) }
  ];

  Object.assign(C.Game.prototype, {
    spawnSpot(dist, clearance, turn = 0, minDist = 0.8) {
      for (const t of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9, Math.PI]) {
        const s = this.spotAlong(this.player.yaw + turn + t, dist, clearance, minDist);
        if (s) return s;
      }
      return null;
    },

    spotAlong(yaw, dist, clearance, minDist) {
      const p = this.player, W = this.W, T = this.T, dx = Math.cos(yaw), dy = Math.sin(yaw);
      const hit = W.raycast(p.x, p.y, p.z + 1.2, dx, dy, 0, dist + clearance + 0.3, { noTrees: true, noWater: true });
      for (let d = Math.min(dist, hit ? hit.t - clearance - 0.3 : dist); d >= minDist; d -= 0.4) {
        const x = p.x + dx * d, y = p.y + dy * d, z = W.groundAt(x, y, p.z + 0.3, 0.3).h, th = T.heightAt(x, y);
        if (Math.abs(z - p.z) > 2.5 || (th < -1.1 && z < th + 0.05)) continue;
        const [sx, sy] = W.collide(x, y, z + 0.5, z + 1.7, clearance);
        const sz = W.groundAt(sx, sy, z + 0.3, 0.3).h;
        if (Math.abs(sz - z) < 0.6 && Math.hypot(sx - p.x, sy - p.y) >= minDist) return { x: sx, y: sy, z: sz };
      }
      return null;
    },

    spawnItems(id, count = 1, where = 'bag') {
      const def = D.ITEMS[id];
      if (!def || count < 1) return [];
      const p = this.player;
      const parcels = STACKED.has(def.type) ? [count * (def.type === 'ammo' ? def.box : 1)] : new Array(count).fill(1);
      const cols = Math.min(5, parcels.length);
      const out = parcels.map((n, i) => {
        if (where === 'bag') return this.addInstance(C.makeItem(id, n, { cond: 1 }));
        const d = 1.4 + Math.floor(i / cols) * 0.45;
        const s = this.spawnSpot(d, 0.2, ((i % cols) - (cols - 1) / 2) * 0.4 / d) || { x: p.x, y: p.y, z: p.z };
        if (def.type === 'artifact') return this.spawnSpecialArtifact(id, s.x, s.y, { field: 'spawned', z: s.z + 0.3, visible: true, bob: this.rng() * 6 });
        const entry = this.spawnGroundItem(id, s.x, s.y, n, { cond: 1 }, s.z);
        entry.spawned = true;
        return entry;
      });
      this.sound2d(where === 'bag' ? 'pickup' : 'drop');
      return out;
    },

    spawnCreatures(type, count = 1, opts = {}) {
      const T = D.NPC_TYPES[type];
      if (!T || count < 1) return [];
      const p = this.player, human = T.kind === 'human', attitude = opts.attitude || 'normal';
      const dist = human ? 5 : 8, gap = human ? 1.5 : 3;
      const out = [];
      for (let k = 0; k < count; k++) {
        const s = this.spawnSpot(dist, 0.9, (k - (count - 1) / 2) * gap / dist) || { x: p.x, y: p.y, z: p.z };
        const o = { z: s.z, yaw: Math.atan2(p.y - s.y, p.x - s.x), homeR: 10, role: attitude === 'follow' ? 'follow' : 'wander', extra: { spawned: true } };
        if (human && D.WEAPONS[opts.weapon] && !D.WEAPONS[opts.weapon].melee) o.weapon = opts.weapon;
        if (human && attitude !== 'hostile' && TALK[T.faction]) { o.talk = true; o.dialog = TALK[T.faction]; }
        if (attitude === 'hostile') o.extra.angry = true;
        if (attitude === 'friendly' || attitude === 'follow') { o.friendly = true; if (!human) o.faction = 'player'; }
        if (attitude === 'follow') o.extra.follow = true;
        const a = this.spawnActor(type, s.x, s.y, o);
        if (attitude === 'hostile') { a.target = 'player'; a.alert = 1; a.lastSeen = { x: p.x, y: p.y, t: this.realTime }; }
        out.push(a);
      }
      return out;
    },

    spawnAnomalies(type, count = 1) {
      const A = D.ANOMALY_TYPES[type];
      if (!A || count < 1) return [];
      const gap = A.trigger * 2 + 1.5, dist = A.trigger + 2.5 + gap * 0.6 * (count - 1);
      const out = [];
      for (let k = 0; k < count; k++) {
        const s = this.spawnSpot(dist, 0.3, (k - (count - 1) / 2) * gap / dist, A.trigger + 0.6);
        if (!s) continue;
        const an = { id: 'spawned_' + this.addCount('spawned_anomalies'), field: 'spawned', type, x: s.x, y: s.y, z: Math.max(s.z, 0), radius: A.radius, trigger: A.trigger, state: 'idle', t: 0, cool: 0, phase: this.rng() * 10 };
        this.anomalies.push(an);
        out.push(an);
      }
      return out;
    },

    spawnedCount() {
      return this.actors.filter(a => a.spawned).length + this.anomalies.filter(a => a.field === 'spawned').length +
        this.artifacts.filter(a => a.field === 'spawned' && !a.taken).length + this.items.filter(e => e.spawned).length;
    },

    clearSpawned() {
      const n = this.spawnedCount();
      this.actors = this.actors.filter(a => !a.spawned);
      this.anomalies = this.anomalies.filter(a => a.field !== 'spawned');
      this.artifacts = this.artifacts.filter(a => a.field !== 'spawned' || a.taken);
      this.items = this.items.filter(e => !e.spawned);
      this._actorIndex = null;
      this.focus = null;
      return n;
    }
  });

  C.SPAWN_CATALOG = SPAWN_CATALOG;
})(globalThis.Cop98 = globalThis.Cop98 || {});
