(function (H) {
  'use strict';
  const UI = H.UI;
  const Game = H.Game;
  if (!UI || !Game || UI.prototype.bugInfo) return;

  const trace = (msg, data) => { if (globalThis.BugTrace) globalThis.BugTrace.note(msg, data); };
  const SKIP_FRAMES = new Set(['push', 'Object.push', 'UI.push', 'hit', 'key', 'click', 'Array.forEach', 'eval', 'Object.<anonymous>']);

  function openerName() {
    const lines = String(new Error().stack || '').split('\n').slice(2);
    for (const line of lines) {
      const m = /at (?:new )?([\w$.<>]+) [(]/.exec(line);
      if (!m) continue;
      const name = m[1].replace(/^(UI|Object|ui)\./, '');
      if (!name || SKIP_FRAMES.has(m[1]) || SKIP_FRAMES.has(name) || name.includes('<anonymous>')) continue;
      return name;
    }
    return '';
  }

  const basePush = UI.prototype.push;
  UI.prototype.push = function (s) {
    if (s && !s.name) s.opener = openerName();
    trace('hsr screen ' + ((s && (s.name || s.opener)) || '?'));
    return basePush.call(this, s);
  };

  const baseFrame = UI.prototype.frame;
  UI.prototype.frame = function (now) {
    if (this.mode !== this.bugMode) {
      if (this.bugMode !== undefined) trace('hsr mode ' + this.mode);
      this.bugMode = this.mode;
    }
    return baseFrame.call(this, now);
  };

  const markCheat = ui => {
    if (!ui.game) return;
    const s = ui.game.state;
    s.dbgUsed = (s.dbgUsed || 0) + 1;
  };
  const baseJade = UI.prototype.debugJade;
  UI.prototype.debugJade = function () {
    const done = baseJade.apply(this, arguments);
    if (done !== false) {
      markCheat(this);
      trace('hsr F7 debug jade');
    }
    return done;
  };
  const baseLabGrant = UI.prototype.labGrant;
  if (baseLabGrant) {
    UI.prototype.labGrant = function () {
      const done = baseLabGrant.apply(this, arguments);
      if (done != null) {
        markCheat(this);
        trace('hsr secret pass grant');
      }
      return done;
    };
  }
  const baseOpenDebug = UI.prototype.openDebug;
  if (baseOpenDebug) {
    UI.prototype.openDebug = function () {
      const done = baseOpenDebug.apply(this, arguments);
      markCheat(this);
      trace('hsr F8 debug menu');
      return done;
    };
  }

  const baseStart = Game.prototype.startBattle;
  Game.prototype.startBattle = function (o) {
    const b = baseStart.apply(this, arguments);
    trace('hsr battle start', { enc: (o && o.encId) || '', waves: b ? b.waves.length : 0 });
    return b;
  };
  const baseRange = Game.prototype.rangeFight;
  if (baseRange) {
    Game.prototype.rangeFight = function () {
      const b = baseRange.apply(this, arguments);
      trace('hsr range fight', { waves: b ? b.waves.length : 0, seed: b ? b.opts.seed : 0 });
      return b;
    };
  }
  const baseEnd = Game.prototype.endBattle;
  Game.prototype.endBattle = function () {
    const r = this.battle && this.battle.result;
    const out = baseEnd.apply(this, arguments);
    if (r) trace('hsr battle end: ' + (r.fled ? 'fled' : r.win ? 'win' : 'lose'));
    return out;
  };
  const baseScript = Game.prototype.runScript;
  Game.prototype.runScript = function (name) {
    trace('hsr script ' + name);
    return baseScript.apply(this, arguments);
  };

  function flat(obj, depth) {
    if (obj == null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.length > 12 || depth <= 0 ? '[' + obj.length + ']' : obj.map(v => flat(v, depth - 1));
    const out = {};
    for (const k of Object.keys(obj).slice(0, 40)) {
      const v = obj[k];
      if (typeof v === 'function') continue;
      out[k] = v && typeof v === 'object' ? (depth > 0 ? flat(v, depth - 1) : Array.isArray(v) ? '[' + v.length + ']' : '{…}') : v;
    }
    return out;
  }

  const round = n => (typeof n === 'number' ? Math.round(n) : n);

  function unit(u) {
    return { id: u.charId || u.id, name: u.name, lvl: u.lvl, hp: round(u.hp), maxHp: round(u.maxHp), energy: u.maxEnergy ? round(u.energy) : undefined, tough: u.tough != null ? round(u.tough) : undefined, weak: u.weak, dead: u.dead || u.hp <= 0 || undefined };
  }

  function battleInfo(g) {
    const b = g.battle;
    if (!b) return null;
    const ctx = g.battleCtx || {};
    return {
      enc: ctx.encId || '',
      boss: !!b.boss,
      wave: b.wave + 1,
      waves: b.waves.length,
      round: b.round,
      actions: b.actions,
      phase: b.phase,
      sp: b.sp,
      current: b.current ? b.current.charId || b.current.id : '',
      over: b.over,
      allies: b.allies.map(unit),
      enemies: b.enemies.map(unit),
      su: !!b.su,
      range: !!(b.opts && b.opts.range)
    };
  }

  function nearby(g) {
    const m = g.map;
    if (!m || !m.ents) return [];
    const px = g.player.x;
    const py = g.player.y;
    return m.ents.filter(e => Math.abs(e.x - px) + Math.abs(e.y - py) <= 3).slice(0, 8).map(e => ({
      kind: e.kind,
      name: e.name || (e.def && e.def.name) || e.who || '',
      script: e.script || (e.def && e.def.script) || '',
      at: [e.x, e.y]
    }));
  }

  function subModes(g) {
    const out = {};
    const s = g.state;
    if (s.su) out.su = flat(s.su, 1);
    if (s.range) out.range = flat(s.range, 2);
    if (s.pf && s.pf.run) out.pf = flat(s.pf.run, 1);
    try {
      const cw = g.cwRun && g.cwRun();
      if (cw) out.cw = flat(cw, 1);
    } catch (err) {}
    try {
      const hd = g.hdRun && g.hdRun();
      if (hd && hd.phase) out.hd = flat(hd, 1);
    } catch (err) {}
    return out;
  }

  UI.prototype.bugInfo = function () {
    const brand = H.BRAND || {};
    const title = brand.standalone ? 'Star Rail 98' : 'Honkai: Star Rail 98';
    const screens = this.screens.map(s => s.name || s.opener || '?');
    const g = this.game;
    const state = { version: H.VERSION, edition: brand.standalone ? (globalThis.Hsr98Standalone || 'standalone') : 'system', mode: this.mode, screens };
    if (!g) return { summary: title + ' > титульный экран' + (screens.length ? ' > ' + screens[screens.length - 1] : ''), details: { mode: this.mode, screens }, state };
    const s = g.state;
    const def = g.map && g.map.def;
    state.cheats = !!s.dbgUsed;
    state.dbgUsed = s.dbgUsed || 0;
    const labHeroes = Object.keys(s.roster).filter(k => H.labOnly(k));
    if (labHeroes.length) state.lab = labHeroes;
    if (this.netSession) {
      const net = this.netSession, link = globalThis.Net98;
      state.table = { code: net.code, seat: net.seat, turn: net.n, last: net.last, tick: net.A ? net.A.tick : null, wave: net.A ? net.A.wave : null, resyncs: net.resyncs, link: link ? link.state : null, rtt: link && link.rtt != null ? Math.round(link.rtt) : null };
    }
    state.map = g.map ? g.map.id : s.map;
    state.mapName = def ? def.name : '';
    state.pos = [g.player.x, g.player.y, g.player.dir];
    state.near = nearby(g);
    if (g.script) state.script = { name: g.script.name || '', pc: g.script.pc, steps: g.script.steps.length, step: String(g.script.steps[g.script.pc] || '').slice(0, 200) };
    state.objective = s.obj;
    state.mission = s.missions && s.missions.track;
    state.party = (s.party || []).map(id => ({ id, lvl: s.roster[id] && s.roster[id].lvl, hp: s.roster[id] && round(s.roster[id].hp) }));
    state.money = { credits: s.credits, jade: s.jade, starlight: s.starlight, embers: s.embers, power: round(s.power) };
    state.tl = s.tl;
    state.pity = s.pity;
    state.playTime = round(s.time);
    const battle = battleInfo(g);
    if (battle) state.battle = battle;
    Object.assign(state, subModes(g));
    const parts = [title, state.mapName || state.map];
    let summary = parts.join(' > ') + ' (x ' + state.pos[0] + ', y ' + state.pos[1] + ')';
    if (battle) summary += ', бой ' + (battle.enc || '') + ': волна ' + battle.wave + '/' + battle.waves + ', раунд ' + battle.round;
    if (state.script) summary += ', сценка ' + state.script.name + ', шаг ' + state.script.pc;
    if (screens.length) summary += ', экран ' + screens[screens.length - 1];
    if (state.cheats) summary += ' [F7/F8]';
    if (state.lab) summary += ' [закрытый тест: ' + state.lab.join(', ') + ']';
    return { summary, details: { map: state.map, mode: this.mode, cheats: state.cheats }, state };
  };

  UI.prototype.bugSave = function () {
    const g = this.homeGame || this.game;
    if (!g) return null;
    const data = { date: new Date().toLocaleString('ru-RU'), summary: g.summary(), state: g.serialize() };
    if (this.netSession) data.table = this.netJournal();
    return data;
  };

  UI.prototype.bugLoad = function (data) {
    if (!data || !data.state) return false;
    this.game = new H.Game({ state: data.state });
    this.screens = [];
    this.enterField();
    this.toast('Состояние из отчёта об ошибке');
    if (data.table) this.netReplay(data.table);
    return true;
  };
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
