(function (H) {
  'use strict';

  const WORLDS = [
    { id: 'herta', tab: 'Станция «Герта»', name: 'Космическая станция «Герта»', chapters: ['prologue', 'crown', 's6'] },
    { id: 'jarilo', tab: 'Ярило-VI', name: 'Ярило-VI', chapters: ['winter', 'dawn', 'awake', 'furnace'] },
    { id: 'luofu', tab: 'Лофу Сяньчжоу', name: 'Лофу Сяньчжоу', chapters: ['wander', 'tower', 'karmic', 'adv_luofu'] },
    { id: 'express', tab: 'Экспресс', name: 'Звёздный экспресс', chapters: ['adv_express'] },
    { id: 'belzerg', tab: 'Белзерг', name: 'Белзерг', chapters: ['ks'] }
  ];
  const LANES = ['adv', 'trail', 'comp', 'meet'];

  let beatIndex = null;
  function beats() {
    if (beatIndex) return beatIndex;
    beatIndex = new Map();
    for (const [script, steps] of Object.entries(H.SCRIPTS)) steps.forEach((st, at) => { if (st && st.recap && !beatIndex.has(st.recap)) beatIndex.set(st.recap, { script, at, text: st.text }); });
    return beatIndex;
  }

  let ownerIndex = null;
  function owners() {
    if (ownerIndex) return ownerIndex;
    ownerIndex = new Map();
    const A = H.ATLAS || { NODES: {}, MEETS: {} };
    for (const [id, n] of Object.entries(A.NODES)) for (const b of n.beats) ownerIndex.set(b, id);
    for (const [id, n] of Object.entries(A.MEETS)) for (const b of n.beats) ownerIndex.set(b, id);
    return ownerIndex;
  }

  let castIndex = new Map();
  function beatCast(id) {
    if (castIndex.has(id)) return castIndex.get(id);
    const out = scanCast(id);
    castIndex.set(id, out);
    return out;
  }

  function scanCast(id) {
    const b = beats().get(id);
    if (!b) return [];
    const steps = H.SCRIPTS[b.script], entries = H.scriptEntries(steps).filter(i => i > b.at);
    const end = Math.min(steps.length, ...entries);
    const out = [];
    for (let i = b.at + 1; i < end; i++) {
      const st = steps[i];
      if (st && typeof st === 'object' && st.recap) break;
      const line = typeof st === 'string' ? st : null;
      if (!line || line[0] === '#') continue;
      const head = line.slice(0, line.indexOf('|')), spk = head.split('=')[0];
      if (spk && spk !== '@' && H.SPEAKERS[spk]) out.push(spk);
    }
    return out;
  }

  function missionDef(id) {
    const t = H.TRAIL_MISSIONS.find(m => m.id === id);
    if (t) return { name: t.name, desc: t.desc, type: 'trail', ch: t.ch, face: t.face, area: t.area, trail: t };
    const q = H.QUESTS[id];
    if (q) return { name: q.name, desc: q.desc || '', type: q.type || 'comp', ch: q.ch, face: q.face || null, area: q.area || null, trail: null };
    return null;
  }

  function areaName(map) {
    const car = H.expressArea && H.expressArea(map);
    if (car) return car.name;
    for (const w of H.WORLDS) for (const gr of w.groups) for (const a of gr.areas) if (a.map === map) return a.name;
    const def = H.MAPS[map];
    return def ? def.name.split(': ').pop() : map;
  }

  function worldOfChapter(ch) {
    const w = WORLDS.find(x => x.chapters.includes(ch));
    return w ? w.id : null;
  }

  function missionIds(world) {
    const w = WORLDS.find(x => x.id === world);
    if (!w) return [];
    const out = [];
    for (const ch of w.chapters) {
      for (const m of H.TRAIL_MISSIONS) if (m.ch === ch) out.push(m.id);
      for (const [id, q] of Object.entries(H.QUESTS)) if (q.ch === ch) out.push(id);
    }
    return out.filter(id => H.ATLAS && H.ATLAS.NODES[id]);
  }

  function meetIds(world) {
    if (!H.ATLAS) return [];
    const order = missionIds(world);
    const pos = id => { const n = H.ATLAS.MEETS[id], i = n.after ? order.indexOf(n.after) : -1; return i; };
    return Object.keys(H.ATLAS.MEETS).filter(id => H.ATLAS.MEETS[id].world === world).sort((a, b) => pos(a) - pos(b) || a.localeCompare(b));
  }

  Object.assign(H.Game.prototype, {
    atlasState() {
      const s = this.state;
      if (!s.atlas || typeof s.atlas !== 'object') s.atlas = { seen: {}, at: null, noted: false };
      if (!s.atlas.seen) s.atlas.seen = {};
      return s.atlas;
    },

    atlasOpen() { return !!this.state.flags.express_intro && !this.guest; },

    atlasStatus(id) {
      const def = missionDef(id);
      if (!def) return 'locked';
      if (def.trail) {
        const ms = this.missionsState();
        if (ms.done[id] || this.cond(def.trail.done)) return 'done';
        const cur = this.trailCurrent();
        return cur && cur.id === id ? 'active' : 'locked';
      }
      const st = this.state.quests[id];
      return st === 'done' ? 'done' : st ? 'active' : 'locked';
    },

    atlasBeats(ids) {
      const seen = new Set(this.state.recaps), branch = (H.ATLAS && H.ATLAS.BRANCH) || {}, place = (H.ATLAS && H.ATLAS.PLACE) || {};
      return ids.map(id => {
        const b = beats().get(id), from = branch[id] || null;
        const state = seen.has(id) ? 'seen' : from && seen.has(from) ? 'branch' : 'unseen';
        const at = place[id] ? areaName(place[id][0]) : '';
        return { id, state, from, text: b ? b.text : '', at, textOnly: !!(H.ATLAS && H.ATLAS.TEXT.includes(id)) };
      });
    },

    atlasNode(id) {
      const A = H.ATLAS;
      if (!A) return null;
      const meet = A.MEETS[id];
      if (meet) {
        const list = this.atlasBeats(meet.beats), got = list.filter(b => b.state === 'seen').length;
        return {
          id, kind: 'meet', lane: 'meet', world: meet.world, ch: null, after: meet.after, name: areaName(meet.map), desc: '', face: null, area: meet.map,
          status: got === list.length ? 'done' : got ? 'active' : 'locked', visible: got > 0, known: got > 0, near: false, need: '',
          beats: list, got, total: list.length, cast: this.atlasCast(meet.beats), thumb: null, fresh: got > 0 && !this.atlasState().seen[id]
        };
      }
      const n = A.NODES[id], def = missionDef(id);
      if (!n || !def) return null;
      const status = this.atlasStatus(id), list = this.atlasBeats(n.beats), got = list.filter(b => b.state === 'seen').length;
      const near = status === 'locked' && this.atlasNear(id, def);
      return {
        id, kind: 'mission', lane: def.type, world: worldOfChapter(def.ch), ch: def.ch, after: n.after, name: def.name, desc: this.fill(def.desc || ''), face: def.face, area: def.area,
        status, visible: true, known: status !== 'locked' || near, near, need: status === 'locked' ? this.atlasNeed(id, def, near) : '',
        beats: list, got, total: list.length, cast: this.atlasCast(n.beats), thumb: n.thumb || null,
        fresh: status === 'done' && !this.atlasState().seen[id]
      };
    },

    atlasLane(id, def) {
      const all = missionIds(worldOfChapter(def.ch)).filter(x => missionDef(x).type === def.type);
      return def.type === 'trail' ? all : all.filter(x => missionDef(x).ch === def.ch);
    },

    atlasPrev(id, def) {
      const lane = this.atlasLane(id, def), i = lane.indexOf(id), after = H.ATLAS.NODES[id].after;
      if (i > 0) return lane[i - 1];
      return def.type !== 'trail' ? after : null;
    },

    atlasNear(id, def) {
      const after = H.ATLAS.NODES[id].after;
      if (def.type !== 'trail' && after && this.atlasStatus(after) !== 'done') return false;
      const prev = this.atlasPrev(id, def);
      return !prev || this.atlasStatus(prev) !== 'locked';
    },

    atlasNeed(id, def, near) {
      const prev = near ? this.atlasPrev(id, def) : null;
      return prev ? 'Откроется после миссии «' + missionDef(prev).name + '».' : 'Продолжайте Миссии Освоения.';
    },

    atlasCast(ids) {
      const count = new Map();
      for (const id of ids) for (const spk of beatCast(id)) count.set(spk, (count.get(spk) || 0) + 1);
      return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(e => e[0]);
    },

    atlasNodes(world) {
      return missionIds(world).concat(meetIds(world)).map(id => this.atlasNode(id)).filter(n => n && n.visible);
    },

    atlasWorlds() {
      return WORLDS.map(w => {
        const nodes = missionIds(w.id).map(id => this.atlasNode(id));
        const meets = meetIds(w.id).map(id => this.atlasNode(id));
        const open = nodes.some(n => n.status !== 'locked') || meets.some(n => n.visible);
        return { id: w.id, tab: w.tab, name: w.name, open, done: nodes.filter(n => n.status === 'done').length, total: nodes.length, meetsSeen: meets.filter(n => n.visible).length, meetsTotal: meets.length };
      });
    },

    atlasLayout(world) {
      const nodes = this.atlasNodes(world), pos = {}, free = {}, byLane = {};
      const place = (n, want) => {
        const col = Math.max(want, free[n.lane] || 0);
        pos[n.id] = { col, lane: n.lane };
        free[n.lane] = col + 1;
        (byLane[n.lane] = byLane[n.lane] || []).push(n.id);
      };
      for (const n of nodes) if (n.lane === 'trail') place(n, 0);
      const colOf = id => (pos[id] ? pos[id].col : 0);
      let lastCh = null;
      for (const n of nodes) {
        if (n.kind !== 'mission' || n.lane === 'trail') continue;
        const chainCol = n.ch === lastCh ? free[n.lane] || 0 : 0;
        place(n, Math.max(chainCol, n.after ? colOf(n.after) : 0));
        lastCh = n.ch;
      }
      for (const n of nodes) if (n.kind === 'meet') place(n, n.after ? colOf(n.after) : 0);
      const lanes = LANES.filter(l => byLane[l]);
      const chapters = [];
      for (const ch of (WORLDS.find(w => w.id === world) || { chapters: [] }).chapters) {
        const ids = nodes.filter(n => n.ch === ch).map(n => n.id);
        if (!ids.length) continue;
        const cols = ids.map(colOf);
        chapters.push({ ch, lane: pos[ids[0]].lane, from: Math.min(...cols), to: Math.max(...cols), first: ids[0] });
      }
      const cols = Math.max(0, ...Object.values(pos).map(p => p.col + 1));
      return { nodes, pos, lanes, byLane, chapters, cols };
    },

    atlasWorldNeed(world) {
      const first = missionIds(world).find(id => missionDef(id).type === 'trail');
      const i = first ? H.TRAIL_MISSIONS.findIndex(m => m.id === first) : -1;
      return i > 0 ? 'Мир откроется после миссии «' + H.TRAIL_MISSIONS[i - 1].name + '».' : 'Продолжайте Миссии Освоения.';
    },

    atlasBeatNode(beat) { return owners().get(beat) || null; },

    atlasMark(id) { this.atlasState().seen[id] = 1; },

    atlasAlert() {
      if (!this.atlasOpen() || !H.ATLAS) return false;
      const seen = this.atlasState().seen, recaps = new Set(this.state.recaps);
      for (const id of Object.keys(H.ATLAS.NODES)) if (!seen[id] && this.atlasStatus(id) === 'done') return true;
      for (const [id, m] of Object.entries(H.ATLAS.MEETS)) if (!seen[id] && m.beats.some(b => recaps.has(b))) return true;
      return false;
    },

    fixAtlas(old) {
      const st = this.atlasState();
      if (!old) return;
      for (const w of WORLDS) for (const id of missionIds(w.id).concat(meetIds(w.id))) { const n = this.atlasNode(id); if (n && (n.fresh || n.visible && n.kind === 'meet')) st.seen[id] = 1; }
      if (this.state.flags.express_intro) st.noted = true;
    }
  });

  const QUIET = new Set(['toast', 'quest', 'mission', 'obj', 'join', 'tl', 'autosave', 'chat']);
  const SKIPPED_UI = ui => ui !== 'doc';
  let flagIndex = new Map();

  function spanFlags(id) {
    if (flagIndex.has(id)) return flagIndex.get(id);
    const out = new Set(), b = beats().get(id);
    if (b) {
      const walk = (name, from, to, seen) => {
        const steps = H.SCRIPTS[name];
        for (let i = from; i < to; i++) {
          const st = steps[i];
          if (!st || typeof st !== 'object') continue;
          if (i > from && st.recap && name === b.script) break;
          if (st.flag) out.add(st.flag);
          const next = st.script || (st.arg && typeof st.arg === 'object' && st.arg.then);
          if (typeof next === 'string' && H.SCRIPTS[next] && !seen.has(next) && !H.SCRIPTS[next].some(x => x && x.recap)) { seen.add(next); walk(next, 0, H.SCRIPTS[next].length, seen); }
        }
      };
      const steps = H.SCRIPTS[b.script], entries = H.scriptEntries(steps).filter(i => i > b.at);
      walk(b.script, b.at, Math.min(steps.length, ...entries), new Set([b.script]));
    }
    flagIndex.set(id, out);
    return out;
  }

  function storyOrder() {
    return WORLDS.flatMap(w => missionIds(w.id));
  }

  function rewindNodes(nodeId) {
    if (H.ATLAS.MEETS[nodeId]) return [nodeId];
    const order = storyOrder(), i = order.indexOf(nodeId);
    return i < 0 ? [nodeId] : order.slice(i);
  }

  function nodeBeats(nodeId) {
    const n = H.ATLAS.NODES[nodeId] || H.ATLAS.MEETS[nodeId];
    return n ? n.beats : [];
  }

  function replayQueue(home, nodeId, beatId) {
    const seen = new Set(home.state.recaps), branch = H.ATLAS.BRANCH, all = nodeBeats(nodeId);
    const start = beatId && !seen.has(beatId) && branch[beatId] ? branch[beatId] : beatId;
    const from = start ? Math.max(0, all.indexOf(start)) : 0;
    return all.slice(from).filter(b => b === start || seen.has(b));
  }

  H.replayGame = (home, nodeId, beatId) => {
    const queue = replayQueue(home, nodeId, beatId);
    if (!queue.length) return null;
    const g = new H.Game({ state: home.serialize(), seed: 98 });
    const s = g.state, ms = g.missionsState();
    for (const id of rewindNodes(nodeId)) {
      for (const b of nodeBeats(id)) for (const f of spanFlags(b)) delete s.flags[f];
      delete ms.done[id];
      if (H.QUESTS[id] && id !== nodeId) delete s.quests[id];
    }
    s.recaps = s.recaps.filter(b => !queue.includes(b));
    g.scriptQueue.length = 0;
    g.events.length = 0;
    g.replay = { node: nodeId, beats: nodeBeats(nodeId), queue, total: queue.length, n: 0, cur: null, fresh: [], known: new Set(home.state.recaps), done: false };
    return g;
  };

  const baseEmit = H.Game.prototype.emit, baseAlerts = H.Game.prototype.alerts;

  Object.assign(H.Game.prototype, {
    emit(e) {
      if (this.replay && QUIET.has(e.t)) return;
      baseEmit.call(this, e);
    },

    alerts() {
      const a = baseAlerts.call(this);
      a.atlas = this.atlasAlert();
      return a;
    },

    replayNext() {
      const R = this.replay;
      if (!R || R.done) return false;
      this.script = null;
      this.pending = null;
      this.scriptQueue.length = 0;
      const id = R.queue.shift();
      if (!id) { R.done = true; return false; }
      const b = beats().get(id), place = H.ATLAS.PLACE[id];
      if (!b) return this.replayNext();
      if (place && H.MAPS[place[0]]) this.loadMap(place[0], place[1], { silent: true });
      this.events.length = 0;
      this.runScript(b.script, { at: b.at });
      return true;
    },

    replayStep(st, sc) {
      const R = this.replay;
      if (!st || typeof st !== 'object' || st.one) return null;
      if (st.recap) {
        if (!R.beats.includes(st.recap) || (R.cur && st.recap === R.cur)) {
          this.script = null;
          this.skipping = false;
          return 'stop';
        }
        const qi = R.queue.indexOf(st.recap);
        if (qi >= 0) R.queue.splice(qi, 1);
        R.cur = st.recap;
        R.n++;
        const fresh = !R.known.has(st.recap) && !R.fresh.includes(st.recap);
        if (fresh) R.fresh.push(st.recap);
        this.skipping = false;
        sc.recap = st;
        this.noteRecap(st.recap);
        this.pending = { type: 'replayCard', kind: 'beat', id: st.recap, n: R.n, total: Math.max(R.total, R.n + R.queue.length), fresh };
        return 'stop';
      }
      if (st.battle) {
        this.skipping = false;
        this.pending = { type: 'replayCard', kind: 'battle', enc: st.battle };
        return 'stop';
      }
      if (st.save || st.tut || st.su) return 'next';
      if (st.ui && SKIPPED_UI(st.ui)) return 'next';
      if (st.magflow || st.carts) { this.state.flags[st.magflow || st.carts] = true; return 'next'; }
      if (st.lines && st.arg && typeof st.arg === 'object' && typeof st.arg.then === 'string' && H.SCRIPTS[st.arg.then]) {
        const steps = H.SCRIPTS[st.arg.then], labels = {};
        steps.forEach((x, i) => { if (typeof x === 'string' && x[0] === '#') labels[x.slice(1)] = i; });
        this.script = { name: st.arg.then, steps, pc: 0, labels };
        return 'next';
      }
      return null;
    },

    replayIdle() { return !!this.replay && !this.pending && !this.battle && !this.script; },

    replayFresh() { return this.replay ? this.replay.fresh.slice() : []; }
  });

  H.replayEncounterName = enc => {
    const e = H.ENCOUNTERS[enc];
    if (!e) return '';
    const ids = [].concat(e.enemies || [], ...(e.waves || [])).flat(2).filter(x => typeof x === 'string');
    const names = [];
    for (const ref of ids) { const id = ref.split(':')[0], n = H.ENEMIES[id] && H.ENEMIES[id].name; if (n && !names.includes(n)) names.push(n); }
    return names.slice(0, 3).join(', ');
  };

  const resetAtlasCaches = () => { beatIndex = null; ownerIndex = null; flagIndex = new Map(); castIndex = new Map(); };
  Object.assign(H, { ATLAS_WORLDS: WORLDS, ATLAS_LANES: LANES, atlasMissionIds: missionIds, atlasMeetIds: meetIds, resetAtlasCaches });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
