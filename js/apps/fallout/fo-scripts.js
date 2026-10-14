(function (FO) {
  'use strict';

  FO.ACT = {
    START: 1, SPATIAL: 2, DESCRIPTION: 3, PICKUP: 4, DROP: 5, USE: 6, USE_OBJ_ON: 7, USE_SKILL_ON: 8, TALK: 11, CRITTER: 12,
    COMBAT: 13, DAMAGE: 14, MAP_ENTER: 15, MAP_EXIT: 16, CREATE: 17, DESTROY: 18, LOOK_AT: 21, TIMED_EVENT: 22, MAP_UPDATE: 23
  };

  const PROC_NAMES = {
    2: 'spatial_p_proc', 3: 'description_p_proc', 4: 'pickup_p_proc', 5: 'drop_p_proc', 6: 'use_p_proc', 7: 'use_obj_on_p_proc',
    8: 'use_skill_on_p_proc', 11: 'talk_p_proc', 12: 'critter_p_proc', 13: 'combat_p_proc', 14: 'damage_p_proc', 15: 'map_enter_p_proc',
    16: 'map_exit_p_proc', 17: 'create_p_proc', 18: 'destroy_p_proc', 21: 'look_at_p_proc', 22: 'timed_event_p_proc', 23: 'map_update_p_proc'
  };

  const BAD_WORDS = 'DATA\\BADWORDS.TXT';
  const BLEEP = '!@#$%&*@#*!&$%#&%#*%!$&%@*$@&';
  const upper = s => s.replace(/[a-z\u0430-\u044f\u0451]+/g, w => w.toUpperCase());
  const isLetter = c => (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 0x400 && c <= 0x4FF);

  FO.loadBadWords = async function (g) {
    if (g.badWords) return g.badWords;
    g.badWords = [];
    if (!g.data.has(BAD_WORDS)) return g.badWords;
    for (const line of (await g.data.text(BAD_WORDS)).split('\n')) {
      const word = upper(line.replace(/\r$/, ''));
      if (word) g.badWords.push(word);
    }
    return g.badWords;
  };

  FO.filterMessages = function (g, msgs) {
    const words = g.badWords;
    if (!words || !words.length || !((g.prefs && g.prefs.languageFilter) | 0)) return msgs;
    let k = Math.floor(Math.random() * BLEEP.length);
    for (const e of msgs.values()) {
      if (!e.text) continue;
      const up = upper(e.text);
      const out = e.text.split('');
      for (const word of words) {
        const at = up.indexOf(word);
        if (at < 0 || (at > 0 && isLetter(up.charCodeAt(at - 1))) || isLetter(up.charCodeAt(at + word.length))) continue;
        for (let i = 0; i < word.length; i++) {
          out[at + i] = BLEEP[k];
          k = (k + 1) % BLEEP.length;
        }
      }
      e.text = out.join('');
    }
    return msgs;
  };

  FO.ownedScripts = function (objs) {
    const out = [];
    const visit = o => {
      if (o.script) out.push(o.script);
      for (const e of o.inventory || []) visit(e.obj);
    };
    for (const o of objs) visit(o);
    return out;
  };

  FO.TICKS_PER_SEC = 10;
  const DUDE_SCRIPT = { INDEX: 0, TYPE: 4, SID: 0x4000000 };
  FO.START_TIME = 302400;
  const MAP_UPDATE_TICKS = 600;

  class Scripts {
    constructor(game, world) {
      this.g = game;
      this.w = world;
      this.vm = new FO.VM(this);
      this.list = [];
      this.parsed = new Map();
      this.procCache = new Map();
      this.msgLists = new Map();
      this.gvars = [];
      this.gvarNames = [];
      this.time = FO.START_TIME;
      this.requests = [];
      this.errors = [];
      this.debug = [];
      this.dialog = null;
      this.uiDisabled = false;
      this.heartbeatAt = 0;
      this.heartbeatIndex = 0;
      this.updateAt = 0;
      this.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
      this.host = null;
      this.events = [];
      FO.hourOf = () => this.hour();
      FO.registerOps(this);
    }

    async init() {
      const D = this.g.data;
      await D.prefetch(/^SCRIPTS\\/);
      await D.prefetch(new RegExp('^TEXT\\\\' + FO.LANG + '\\\\'));
      this.list = FO.readScriptsLst(await D.text('SCRIPTS\\SCRIPTS.LST'));
      await FO.loadBadWords(this.g);
      const gam = FO.readGam(await D.text('DATA\\VAULT13.GAM'));
      this.gvars = gam.map(v => v.value);
      this.gvarNames = gam.map(v => v.name);
    }

    gvarIndex(name) {
      return this.gvarNames.indexOf(name);
    }

    scriptName(index) {
      const e = this.list[index];
      return e ? e.name.replace(/\.[^.]*$/, '').toUpperCase() : '';
    }

    parsedScript(index) {
      const name = this.scriptName(index);
      if (!name) return null;
      if (this.parsed.has(name)) return this.parsed.get(name);
      const u8 = this.g.data.peek('SCRIPTS\\' + name + '.INT');
      const parsed = u8 ? FO.readInt(u8) : null;
      if (parsed && this.g.strings) for (const [k, s] of parsed.strings) parsed.strings.set(k, FO.tr(this.g, s));
      this.parsed.set(name, parsed);
      return parsed;
    }

    msgList(list) {
      if (this.msgLists.has(list)) return this.msgLists.get(list);
      const name = this.scriptName(list - 1);
      const text = name ? this.g.data.peekText(FO.textPath('DIALOG\\' + name + '.MSG')) : null;
      const m = text ? FO.readMsg(text) : new Map();
      FO.filterMessages(this.g, m);
      this.msgLists.set(list, m);
      return m;
    }

    message(list, num) {
      if (typeof num === 'string') return num;
      const m = this.msgList(list).get(num);
      return m ? m.text : '';
    }

    messageAudio(list, num) {
      if (typeof num === 'string') return '';
      const m = this.msgList(list).get(num);
      return m ? m.audio : '';
    }

    gameMessage(file, num) {
      const key = 'game:' + file;
      let m = this.msgLists.get(key);
      if (!m) {
        const text = this.g.data.peekText(FO.textPath('GAME\\' + file + '.MSG'));
        m = text ? FO.readMsg(text) : new Map();
        this.msgLists.set(key, m);
      }
      const e = m.get(num);
      return e ? e.text : '';
    }

    make(index, opts) {
      const entry = this.list[index];
      const s = {
        index, name: this.scriptName(index), type: opts.type, sid: opts.sid === undefined ? -1 : opts.sid,
        self: opts.self || null, tile: opts.tile === undefined ? -1 : opts.tile, elev: opts.elev || 0, radius: opts.radius || 0,
        lvars: opts.lvars || new Array(entry ? entry.vars : 0).fill(0), prog: null, overrides: false, ret: 0, dead: false
      };
      if (s.self) s.self.script = s;
      return s;
    }

    entryFor(state, sid) {
      for (const group of state.scripts) for (const e of group) if (e.sid === sid) return e;
      return null;
    }

    lvarsOf(state, e, index) {
      const entry = this.list[index];
      const n = Math.max(entry ? entry.vars : 0, e ? e.lvarCount : 0);
      const out = new Array(n).fill(0);
      if (e && e.lvarOffset >= 0) for (let i = 0; i < e.lvarCount; i++) out[i] = state.lvars[e.lvarOffset + i] | 0;
      return out;
    }

    attach(obj, index, state, entry) {
      if (index < 0 || !this.list[index]) return null;
      const s = this.make(index, { type: FO.pidType(obj.pid) === FO.PID.CRITTER ? 4 : 3, sid: obj.sid, self: obj, lvars: state ? this.lvarsOf(state, entry, index) : null });
      if (this.w.map && this.w.map.scriptList) this.w.map.scriptList.push(s);
      return s;
    }

    dudeScript() {
      const d = this.w.dude;
      if (!d.script && this.list[DUDE_SCRIPT.INDEX]) this.make(DUDE_SCRIPT.INDEX, { type: DUDE_SCRIPT.TYPE, sid: DUDE_SCRIPT.SID, self: d });
      return d.script || null;
    }

    bindMap(state, carried) {
      const dude = this.dudeScript();
      const keep = (carried || []).concat(dude && !(carried || []).includes(dude) ? [dude] : []);
      if (!state.scriptList) {
        const list = [];
        state.scriptList = list;
        if (state.header.script > 0) {
          const s = this.make(state.header.script - 1, { type: 0 });
          s.map = true;
          list.push(s);
        }
        for (const e of state.scripts[1]) {
          list.push(this.make(e.index, {
            type: 1, sid: e.sid, tile: e.tile & 0x3FFFFFF, elev: (e.tile >>> 29) & 7, radius: e.radius, lvars: this.lvarsOf(state, e, e.index)
          }));
        }
        const visit = (o) => {
          if (o.script && keep.includes(o.script)) {
            list.push(o.script);
          } else if (o.sid !== -1 && o.sid !== undefined) {
            const e = this.entryFor(state, o.sid);
            const index = e ? e.index : o.scriptIndex;
            if (index >= 0 && this.list[index]) list.push(this.make(index, { type: (o.sid >>> 24) & 0xFF, sid: o.sid, self: o, lvars: this.lvarsOf(state, e, index) }));
          }
          for (const it of o.inventory || []) visit(it.obj);
        };
        for (let e = 0; e < 3; e++) for (const o of state.byElev[e]) visit(o);
        state.timers = state.timers || [];
      } else {
        for (const s of keep) if (!state.scriptList.includes(s)) state.scriptList.push(s);
      }
      for (const s of state.scriptList) this.load(s);
    }

    load(s) {
      const parsed = this.parsedScript(s.index);
      if (!parsed) {
        s.prog = null;
        return;
      }
      s.prog = new FO.Program(parsed, s.name);
      const ctx = { script: s, self: s.self, action: FO.ACT.START, source: null, target: null, usedWith: null, skill: -1, fixed: 0 };
      try {
        this.vm.start(s.prog, ctx);
      } catch (e) {
        this.fail(e, s);
      }
    }

    procIndex(s, action) {
      let cache = this.procCache.get(s.name);
      if (!cache) {
        cache = {};
        this.procCache.set(s.name, cache);
      }
      if (cache[action] !== undefined) return cache[action];
      let idx = -1;
      if (PROC_NAMES[action]) idx = s.prog.proc(PROC_NAMES[action]);
      if (idx < 0) idx = s.prog.proc('start');
      cache[action] = idx;
      return idx;
    }

    has(s, action) {
      return !!(s && s.prog && PROC_NAMES[action] && s.prog.proc(PROC_NAMES[action]) >= 0);
    }

    exec(s, action, o) {
      if (!s || !s.prog || s.dead || s.prog.waiting) return null;
      const opts = o || {};
      const idx = this.procIndex(s, action);
      if (idx < 0) return null;
      const ctx = {
        script: s, self: s.self, action, source: opts.source || null, target: opts.target || null, usedWith: opts.usedWith || null,
        skill: opts.skill === undefined ? -1 : opts.skill, fixed: opts.fixed | 0
      };
      s.overrides = false;
      s.ret = 0;
      try {
        const r = this.vm.call(s.prog, idx, ctx);
        if (r.state === 'suspended') s.suspended = true;
      } catch (e) {
        this.fail(e, s);
      }
      return s;
    }

    fail(e, s) {
      this.errors.push((s ? s.name + ': ' : '') + e.message);
      if (this.errors.length > 200) this.errors.shift();
    }

    each(fn) {
      const st = this.w.map;
      if (!st || !st.scriptList) return;
      for (const s of st.scriptList.slice()) fn(s);
    }

    mapScript() {
      const st = this.w.map;
      return st && st.scriptList ? st.scriptList.find(s => s.map) : null;
    }

    enterMap(carried) {
      const st = this.w.map;
      this.bindMap(st, carried);
      const ms = this.mapScript();
      if (ms) this.exec(ms, FO.ACT.MAP_ENTER);
      this.each(s => { if (!s.map && s.type !== 1) this.exec(s, FO.ACT.MAP_ENTER); });
      this.each(s => { if (s.type !== 1) this.exec(s, FO.ACT.MAP_UPDATE); });
      st.firstRun = false;
      st.lastVisit = this.time;
      this.updateAt = this.time + MAP_UPDATE_TICKS;
    }

    exitMap() {
      const ms = this.mapScript();
      if (ms) this.exec(ms, FO.ACT.MAP_EXIT);
      this.each(s => { if (!s.map && s.type !== 1) this.exec(s, FO.ACT.MAP_EXIT); });
    }

    critterProc(ms) {
      const st = this.w.map;
      if (!st || !st.scriptList || this.dialog || this.uiDisabled) return;
      this.heartbeatAt -= ms;
      if (this.heartbeatAt > 0) return;
      this.heartbeatAt = 100;
      if (this.w.inCombat) return;
      const list = st.scriptList.filter(s => s.self && FO.pidType(s.self.pid) === FO.PID.CRITTER && s.self.elev === this.w.elev && s.self.tile >= 0 && !this.w.isDead(s.self));
      if (!list.length) return;
      const n = Math.max(1, Math.ceil(list.length / 3));
      for (let i = 0; i < n; i++) {
        const s = list[(this.heartbeatIndex++) % list.length];
        this.exec(s, FO.ACT.CRITTER);
        if (this.dialog) break;
      }
    }

    advance(ticks) {
      this.time += ticks;
      return this.processDue();
    }

    processDue() {
      const st = this.w.map;
      let stop = false;
      for (;;) {
        const timers = st ? st.timers || [] : [];
        const due = timers.filter(t => t.at <= this.time).concat(this.events.filter(t => t.at <= this.time)).sort((a, b) => a.at - b.at);
        if (!due.length) break;
        if (st) st.timers = timers.filter(t => t.at > this.time);
        this.events = this.events.filter(t => t.at > this.time);
        for (const t of due) {
          if (t.kind) {
            if (this.host && this.host.queueEvent && this.host.queueEvent(t)) stop = true;
            continue;
          }
          const s = t.obj ? t.obj.script : null;
          if (s) this.exec(s, FO.ACT.TIMED_EVENT, { fixed: t.fixed });
        }
      }
      if (st && this.time >= this.updateAt) {
        this.updateAt = this.time + MAP_UPDATE_TICKS;
        this.each(s => { if (s.type !== 1) this.exec(s, FO.ACT.MAP_UPDATE); });
      }
      return stop;
    }

    nextEventAt() {
      let at = Infinity;
      for (const t of this.events) at = Math.min(at, t.at);
      const st = this.w.map;
      if (st) for (const t of st.timers || []) at = Math.min(at, t.at);
      return at;
    }

    scheduleMidnight() {
      this.events = this.events.filter(t => t.kind !== 'midnight');
      const minutes = Math.floor((this.time >>> 0) / 600);
      const hour = Math.floor(minutes / 60) % 24;
      this.events.push({ at: this.time + 10 * (3600 * (24 - hour) - 60 * (minutes % 60)), obj: null, kind: 'midnight', data: null });
    }

    addTimer(obj, ticks, fixed) {
      const st = this.w.map;
      if (!st) return;
      st.timers = st.timers || [];
      st.timers.push({ at: this.time + Math.max(0, ticks | 0), obj, fixed: fixed | 0 });
    }

    removeTimers(obj, scriptOnly) {
      const st = this.w.map;
      if (st && st.timers) st.timers = st.timers.filter(t => t.obj !== obj || (scriptOnly && t.kind));
      if (!scriptOnly) this.events = this.events.filter(t => t.obj !== obj);
    }

    carried(obj) {
      let o = obj;
      while (o && o.owner) o = o.owner;
      return !!o && !!o.dude;
    }

    addEvent(obj, ticks, kind, data) {
      const t = { at: this.time + Math.max(0, ticks | 0), obj, kind, data: data || null };
      if (this.carried(obj)) {
        this.events.push(t);
        return t;
      }
      const st = this.w.map;
      if (!st) return null;
      st.timers = st.timers || [];
      st.timers.push(t);
      return t;
    }

    allEvents() {
      const st = this.w.map;
      return (st && st.timers ? st.timers : []).concat(this.events);
    }

    eventsOf(obj, kind) {
      return this.allEvents().filter(t => t.obj === obj && t.kind === kind);
    }

    dropEvent(t) {
      const st = this.w.map;
      if (st && st.timers) st.timers = st.timers.filter(x => x !== t);
      this.events = this.events.filter(x => x !== t);
    }

    removeEvents(obj, kind) {
      const keep = t => !(t.obj === obj && t.kind && (!kind || t.kind === kind));
      const st = this.w.map;
      if (st && st.timers) st.timers = st.timers.filter(keep);
      this.events = this.events.filter(keep);
    }

    spatial(obj) {
      const st = this.w.map;
      if (!st || !st.scriptList || obj.tile < 0) return;
      for (const s of st.scriptList) {
        if (s.type !== 1 || s.elev !== obj.elev) continue;
        if (FO.hexDist(s.tile, obj.tile) <= s.radius) this.exec(s, FO.ACT.SPATIAL, { source: obj });
      }
    }

    request(kind, data) {
      this.requests.push(Object.assign({ kind }, data || {}));
    }

    takeRequests() {
      const r = this.requests;
      this.requests = [];
      return r;
    }

    hour() {
      const sec = Math.floor(this.time / FO.TICKS_PER_SEC);
      const day = sec % 86400;
      return Math.floor(day / 3600) * 100 + Math.floor((day % 3600) / 60);
    }

    resumeScript(s) {
      if (!s || !s.prog || !s.prog.waiting) return;
      try {
        const r = this.vm.resume(s.prog);
        s.suspended = r.state === 'suspended';
      } catch (e) {
        this.fail(e, s);
      }
    }

    resumeDialog(choice) {
      const d = this.dialog;
      if (!d || !d.waiting) return;
      const s = d.waiting;
      d.waiting = null;
      const opt = choice === undefined || choice < 0 ? null : d.node.options[choice];
      d.node = { reply: '', options: [], message: false };
      let proc = -1;
      if (opt) {
        proc = typeof opt.proc === 'string' ? s.prog.proc(opt.proc) : opt.proc;
        d.reaction = opt.reaction;
      }
      const after = () => {
        const cur = this.dialog;
        if (cur && (cur.node.reply || cur.node.options.length)) {
          cur.waiting = s;
          return FO.SUSPEND;
        }
        return null;
      };
      try {
        const r = this.vm.resume(s.prog, undefined, proc, after);
        if (r.state !== 'suspended') s.suspended = false;
      } catch (e) {
        this.fail(e, s);
        this.dialog = null;
      }
    }
  }

  FO.Scripts = Scripts;
})(globalThis.FO = globalThis.FO || {});
