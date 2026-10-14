(function (T) {
  'use strict';
  const { RNG, clamp } = T;

  const SAVE_KEY = 'tekken3-98-save';
  const UNLOCK_ORDER = ['potapych', 'liu', 'strazh', 'churban', 'genzo', 'colossus', 'colossus2'];

  const DEFAULT_OPTS = {
    diff: 2, rounds: 2, time: 60, sfx: 0.8, music: 0.45, voice: 0.8, announcer: true, chText: true,
    shake: true, fps: false
  };

  const DEFAULT_KEYS = {
    p1: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', b1: 'KeyU', b2: 'KeyI', b3: 'KeyJ', b4: 'KeyK', start: 'Enter' },
    p2: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', b1: 'Numpad4', b2: 'Numpad5', b3: 'Numpad1', b4: 'Numpad2', start: 'NumpadEnter' }
  };

  function freshSave() {
    return {
      v: 1, clears: 0, cleared: {}, unlocked: [], endings: {}, force: false, forceClear: false, ball: false, theater: false,
      records: { ta: [], surv: [], force: [] }, opts: Object.assign({}, DEFAULT_OPTS), keys: JSON.parse(JSON.stringify(DEFAULT_KEYS)), plays: {}
    };
  }

  function loadSave(storage) {
    const st = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    let s = null;
    try { s = st ? JSON.parse(st.getItem(SAVE_KEY) || 'null') : null; } catch (e) { s = null; }
    const base = freshSave();
    if (!s || typeof s !== 'object') return base;
    const out = Object.assign(base, s);
    out.opts = Object.assign({}, DEFAULT_OPTS, s.opts || {});
    out.keys = { p1: Object.assign({}, DEFAULT_KEYS.p1, s.keys && s.keys.p1), p2: Object.assign({}, DEFAULT_KEYS.p2, s.keys && s.keys.p2) };
    out.records = Object.assign({ ta: [], surv: [], force: [] }, s.records || {});
    return out;
  }

  function writeSave(save, storage) {
    const st = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    try { if (st) st.setItem(SAVE_KEY, JSON.stringify(save)); return true; } catch (e) { return false; }
  }

  function isUnlocked(save, def) {
    if (!def.hidden) return true;
    return save.unlocked.includes(def.id);
  }

  function selectable(save) {
    return T.rosterOrder().filter(d => isUnlocked(save, d));
  }

  function nextUnlock(save) {
    return UNLOCK_ORDER.find(id => !save.unlocked.includes(id)) || null;
  }

  function onArcadeClear(save, charId) {
    const events = [];
    save.clears++;
    const first = !save.cleared[charId];
    save.cleared[charId] = (save.cleared[charId] || 0) + 1;
    save.endings[charId] = true;
    if (!save.theater) { save.theater = true; events.push({ kind: 'mode', id: 'theater' }); }
    if (!save.force) { save.force = true; events.push({ kind: 'mode', id: 'force' }); }
    if (save.clears >= 2 && !save.ball) { save.ball = true; events.push({ kind: 'mode', id: 'ball' }); }
    const n = nextUnlock(save);
    if (n && !(n === 'colossus2' && charId !== 'colossus' && save.clears < 9)) { save.unlocked.push(n); events.push({ kind: 'fighter', id: n }); }
    if (first) events.push({ kind: 'costume', id: charId });
    return events;
  }

  function onForceClear(save, score, charId) {
    const events = [];
    const firstClear = !save.forceClear;
    save.forceClear = true;
    if (firstClear && !save.unlocked.includes('liu')) { save.unlocked.push('liu'); events.push({ kind: 'fighter', id: 'liu' }); }
    addRecord(save.records.force, { score, id: charId }, (a, b) => b.score - a.score);
    return events;
  }

  function addRecord(list, rec, cmp) {
    list.push(Object.assign({ date: Date.now() }, rec));
    list.sort(cmp);
    list.length = Math.min(list.length, 5);
    return list.indexOf(list.find(r => r === rec));
  }

  function costumesFor(save, def) {
    const n = def.costumes.length;
    return save.cleared[def.id] ? n : Math.min(n, 2);
  }

  class Ladder {
    constructor(kind, charId, save, seed, opts) {
      this.kind = kind;
      this.charId = charId;
      this.save = save;
      this.rng = new RNG(seed || (Date.now() >>> 0));
      this.o = opts || {};
      this.stage = 0;
      this.wins = 0;
      this.frames = 0;
      this.continues = 0;
      this.hp = null;
      this.list = kind === 'survival' ? [] : this.buildArcade();
    }

    buildArcade() {
      const me = this.charId;
      const pool = T.rosterOrder().filter(d => !d.hidden && d.id !== me);
      const extra = T.rosterOrder().filter(d => d.hidden && !d.boss && !d.subBoss && this.save.unlocked.includes(d.id) && d.id !== me);
      const picks = [];
      const src = pool.slice();
      while (picks.length < 8 && src.length) picks.push(src.splice(this.rng.int(0, src.length - 1), 1)[0].id);
      if (extra.length && this.rng.chance(0.6)) picks[this.rng.int(3, picks.length - 1)] = this.rng.pick(extra).id;
      while (picks.length < 8) picks.push(this.rng.pick(pool).id);
      picks.push(me === 'genzo' ? 'kenta' : 'genzo');
      picks.push('colossus');
      picks.push('colossus2');
      return picks.map((id, i) => ({ id, boss: i >= 8, sub: i === 8, finalBoss: i === 10 }));
    }

    current() {
      if (this.kind === 'survival') {
        if (!this.list[this.stage]) {
          const pool = T.rosterOrder().filter(d => !d.boss && (!d.hidden || this.save.unlocked.includes(d.id)));
          this.list[this.stage] = { id: this.rng.pick(pool).id };
        }
      }
      return this.list[this.stage] || null;
    }

    aiLevel() {
      const base = clamp((this.save.opts.diff || 2), 0, 4);
      if (this.kind === 'survival') return clamp(base - 0.6 + this.stage * 0.18, 0, 4.4);
      const e = this.current();
      const ramp = this.stage / 10 * 1.3;
      return clamp(base - 0.7 + ramp + (e && e.boss ? 0.35 : 0), 0, 4.6);
    }

    matchOpts() {
      const e = this.current();
      const o = { rounds: this.kind === 'survival' ? 1 : this.save.opts.rounds, time: this.save.opts.time };
      if (this.kind === 'survival') o.keepHp = true;
      if (e && e.boss) o.bossDmg = e.finalBoss ? 1.12 : 1.06;
      return o;
    }

    won(hpLeft, maxHp) {
      this.wins++;
      if (this.kind === 'survival') {
        this.hp = Math.min(maxHp, hpLeft + Math.round(maxHp * 0.12));
        this.stage++;
        return { done: false };
      }
      this.stage++;
      return { done: this.stage >= this.list.length };
    }

    lost() {
      if (this.kind === 'survival') return { over: true };
      return { over: false, canContinue: this.kind === 'arcade' || this.kind === 'ta' };
    }
  }

  class Team {
    constructor(a, b) { this.sides = [a.slice(), b.slice()]; this.idx = [0, 0]; this.hp = [null, null]; this.log = []; }
    cur(side) { return this.sides[side][this.idx[side]] || null; }
    result(winnerSide, hpLeft, maxHp) {
      const loser = 1 - winnerSide;
      this.log.push({ w: this.cur(winnerSide), l: this.cur(loser) });
      this.idx[loser]++;
      this.hp[loser] = null;
      this.hp[winnerSide] = Math.min(maxHp, hpLeft + Math.round(maxHp * 0.08));
      return this.idx[loser] >= this.sides[loser].length ? winnerSide : -1;
    }
    left(side) { return this.sides[side].length - this.idx[side]; }
  }

  Object.assign(T, { SAVE_KEY, UNLOCK_ORDER, DEFAULT_OPTS, DEFAULT_KEYS, freshSave, loadSave, writeSave, isUnlocked, selectableFighters: selectable, nextUnlock, onArcadeClear, onForceClear, addRecord, costumesFor, Ladder, Team });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
