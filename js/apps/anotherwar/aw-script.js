(function (AW) {
  'use strict';

  const TEXT_ONE_ARG = { S: 1, L: 1, F: 0, I: 1, I2: 1, I3: 1, DLG: 1, LEV: 1, OPEN: 1, AMB: 1, GETNOTE: 1, ADDNOTE: 1, MSG: 1, DIARY: 1, CREATE: 0, POPUP: 0, DELETE: 1, DROP: 1, SET: 1, SAYAS: 0 };

  function splitCommands(src) {
    const out = [];
    const s = String(src || '').replace(/\r/g, '');
    let buf = '';
    let depth = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '[' && s[i + 1] === '[') { depth++; buf += '[['; i++; continue; }
      if (ch === ']' && s[i + 1] === ']' && depth > 0) { depth--; buf += ']]'; i++; continue; }
      if ((ch === '|' || ch === '\n') && depth === 0) { if (buf.trim()) out.push(buf.trim()); buf = ''; continue; }
      buf += ch;
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  function parseCommand(raw) {
    const c = raw.indexOf(':');
    const f = (c < 0 ? raw : raw.slice(0, c)).trim().toUpperCase();
    let p = c < 0 ? '' : raw.slice(c + 1);
    if (/^\[\[[\s\S]*\]\]$/.test(p.trim())) p = p.trim().slice(2, -2);
    const args = TEXT_ONE_ARG[f] ? [p] : (p === '' ? [] : p.split(',').map(x => x.trim()));
    return { f, args, raw };
  }

  AW.parseDirArg = function (v) {
    if (v === undefined || v === null || v === '') return null;
    const s = String(v).trim();
    const m = s.match(/^(?:Ang\.)?(N|NE|E|SE|S|SW|W|NW)$/i);
    if (m) return AW.dirByName(m[1]);
    const n = parseFloat(s);
    if (!isNaN(n)) return AW.angToDir(n);
    return null;
  };

  class Task {
    constructor(fn) { this.fn = fn; this.done = false; }
    update(dt) { if (!this.done) this.done = this.fn(dt) === true; return this.done; }
  }

  AW.Seq = class {
    constructor(world, owner) {
      this.world = world;
      this.owner = owner;
      this.go = owner;
      this.goOld = null;
      this.q = [];
      this.tasks = [];
      this.waiting = false;
      this.executed = 0;
    }

    busy() { return this.q.length > 0 || this.tasks.length > 0 || this.waiting; }
    idle() { return !this.busy(); }

    play(src) {
      const cmds = splitCommands(src).map(parseCommand);
      this.q.push({ f: 'GOSELF', args: [], raw: 'GOSELF' });
      let first = true;
      for (const c of cmds) {
        if (first && c.f === 'W' && c.args.length === 1 && isNaN(parseFloat(c.args[0]))) {
          first = false;
          c.waitFor = this.waitTarget(c.args[0]);
        }
        this.q.push(c);
      }
      this.process();
    }

    waitTarget(name) {
      const W = this.world;
      const other = name === 'Game' ? { seq: W.gameSeq } : W.resolve(name);
      if (!other || !other.seq) return null;
      return { seq: other.seq, n: other.seq.executed + other.seq.q.length };
    }

    run(fn) {
      this.q.push({ f: 'FN', fn, args: [], raw: 'FN' });
      this.process();
    }

    sayRaw(text, voice) {
      this.q.push({ f: 'SAYT', text, voice: voice || '', args: [], raw: 'SAYT' });
      this.process();
    }

    reset() {
      this.q = [];
      for (const t of this.tasks) if (t.cancel) t.cancel();
      this.tasks = [];
      this.waiting = false;
      this.go = this.owner;
      this.executed = 0;
    }

    process() {
      let guard = 0;
      while (!this.waiting && this.q.length && guard++ < 500) {
        const c = this.q.shift();
        this.executed++;
        try {
          this.exec(c);
        } catch (e) {
          if (this.world.onScriptError) this.world.onScriptError(e, c.raw);
        }
      }
    }

    update(dt) {
      if (this.tasks.length) {
        const list = this.tasks.slice();
        for (const t of list) if (t.update(dt)) this.tasks.splice(this.tasks.indexOf(t), 1);
      }
      if (this.waiting && this.tasks.length === 0) {
        this.waiting = false;
        this.process();
      }
      if (!this.busy()) this.executed = 0;
    }

    task(fn, cancel) {
      const t = new Task(fn);
      if (cancel) t.cancel = cancel;
      this.tasks.push(t);
      return t;
    }

    actorArg(v) { return this.world.resolve(v); }

    exec(c) {
      const W = this.world;
      const go = this.go;
      const a = c.args;
      switch (c.f) {
        case '': return;
        case 'W': {
          if (a.length === 0) { this.waiting = true; return; }
          const n = parseFloat(a[0]);
          if (!isNaN(n)) { let t = n; this.task(dt => (t -= dt) <= 0); this.waiting = true; return; }
          const wf = c.waitFor || this.waitTarget(a[0]);
          if (wf) this.task(() => wf.seq.idle() || wf.seq.executed > wf.n);
          this.waiting = true;
          return;
        }
        case 'FN': c.fn(this); return;
        case 'GOSELF': this.go = this.owner; this.goOld = null; return;
        case 'SAYT': {
          if (!go || !go.sayText) return;
          let done = false;
          go.sayText(c.text, { voice: c.voice, onEnd: () => { done = true; } });
          const who = go;
          this.task(() => done || !who.say, () => { if (who.say) who.say = null; });
          return;
        }
        case 'WT': return this.cmdWalkTo(a);
        case 'R': {
          const d = AW.parseDirArg(a[0]);
          if (d !== null && go && go.faceDir) go.faceDir(d);
          return;
        }
        case 'S': {
          if (!go || !go.sayText) return;
          const r = W.lookupSay(a[0]);
          let done = false;
          go.sayText(r.text, { voice: r.voice, onEnd: () => { done = true; } });
          const who = go;
          this.task(() => done || !who.say, () => { if (who.say) who.say = null; });
          return;
        }
        case 'A': case 'AA': {
          if (!go || !go.setAnim) return;
          const count = parseInt(a[1] || '1', 10) || 1;
          let done = false;
          const who = go;
          who.setAnim(a[0], { loop: false, count, onEnd: () => { done = true; if (!who.dead) who.idle(); } });
          this.task(() => done || who.dead);
          return;
        }
        case 'AMB': {
          if (!go || !go.idle) return;
          go.fixedAmb = a[0] ? String(a[0]).toLowerCase() : '';
          go.idle();
          return;
        }
        case 'SND': if (go) W.playSound(a[0], go.x, go.y, parseFloat(a[1] || '100')); return;
        case 'CAM': {
          if (a.length === 0) W.camFollow(go);
          else if (a.length === 1) W.camFollow(this.actorArg(a[0]));
          else W.camGoto(parseFloat(a[0]), parseFloat(a[1]));
          return;
        }
        case 'CAMINSTANT': W.camInstant(); return;
        case 'F': W.call(a[0], a.slice(1), this); return;
        case 'L': if (AW.Scripts && AW.Scripts.lua) AW.Scripts.lua(W, a[0]); return;
        case 'SET': {
          const m = String(a[0]).match(/^([\w.]+)\s*=\s*(.*)$/);
          if (m) W.setFlag(m[1], m[2] === '' ? 1 : isNaN(+m[2]) ? m[2] : +m[2]);
          return;
        }
        case 'WM': if (go) go.wmode = parseInt(a[0] || '0', 10); return;
        case 'O': {
          if (a.length && a[0]) { this.goOld = this.go; this.go = this.actorArg(a[0]) || this.go; }
          else this.go = this.goOld || this.owner;
          return;
        }
        case 'CONT': case 'RESUMEAI': if (go) go.aiPaused = 0; return;
        case 'RESUME': { const t = this.actorArg(a[0]); if (t) t.aiPaused = 0; return; }
        case 'MAPON': W.setFlag('map' + a[0], 1); return;
        case 'MAPOFF': W.setFlag('map' + a[0], 0); return;
        case 'OPENBOX': { const t = this.actorArg(a[0]); if (t) W.openBox(t); return; }
        case 'WYJAZD': W.departure(); return;
        case 'TELEPORT': case 'SOUNDON': case 'DLGWND': case 'SPEFFECT': return;
        case 'I2': case 'I3': W.floatText(go, a.join(',')); return;
        case 'CURETEAM': for (const m of W.teamEquip()) if (!m.dead) m.hp = m.hpMax; return;
        case 'PAUSEAI': if (go) go.aiPaused = 1; return;
        case 'DLG': W.openDialog(a[0], go); return;
        case 'LEV': W.requestLevel(a[0]); return;
        case 'OPEN': W.openDoor(a[0]); return;
        case 'CREATE': W.createItem(go, a[0], a.length > 1); return;
        case 'DELETE': W.deleteItem(go, a[0]); return;
        case 'DROP': W.dropItem(go, a[0]); return;
        case 'CASH': W.cash(go, parseFloat(a[0]) || 0); return;
        case 'HEAL': W.healActor(go, parseFloat(a[0]) || 0); return;
        case 'HIT': W.hitActor(go, parseFloat(a[0]) || 0); return;
        case 'GETNOTE': case 'ADDNOTE': W.addNote(a[0]); return;
        case 'GETQUEST': W.questStart(a[0]); return;
        case 'QDONE': W.questDone(a[0]); return;
        case 'DIARY': W.setFlag('diary', 1); return;
        case 'DLGS': W.setDialogStart(a[0], a[1]); return;
        case 'ADDEXP': W.addExp(parseFloat(a[0]) || 0); return;
        case 'KILL': { const t = this.actorArg(a[0]); if (t) W.killActor(t, null, true); return; }
        case 'TRADE': W.openTrade(this.actorArg(a[0])); return;
        case 'POPUP': {
          const sec = parseFloat(a[1] || '3');
          let done = false;
          W.popup(a[0], sec, () => { done = true; });
          this.task(() => done);
          return;
        }
        case 'FDIN': case 'FDOUT': {
          let t = Math.abs(parseFloat(a[0] || '1')) || 1;
          W.fade(c.f === 'FDOUT' ? 1 : 0, t);
          this.task(dt => (t -= dt) <= 0);
          return;
        }
        case 'SHOW': { const t = this.actorArg(a[0]); if (t) W.setVisible(t, true); return; }
        case 'HIDE': { const t = this.actorArg(a[0]); if (t) W.setVisible(t, false); return; }
        case 'AI': { const t = this.actorArg(a[0]); if (t) W.setAI(t, a[1], a.slice(2)); return; }
        case 'SKILL': W.addSkill(go, a[0]); return;
        case 'SHOWALLITEMS': W.restoreItems(go); return;
        case 'HIDEALLITEMS': W.stashItems(go); return;
        case 'MSG': W.message(a[0]); return;
        case 'I': W.floatText(go, a[0]); return;
        case 'AC': case 'GFX': { W.gfxAnim(c.f === 'AC' ? go : this.actorArg(a[0]), c.f === 'AC' ? a[0] : a[1]); return; }
        case 'CONTROL': W.control(parseInt(a[0], 10)); return;
        case 'MUSIC': W.music(a[0]); return;
        case 'SAYAS': return;
        default:
          if (W.onUnknownCommand) W.onUnknownCommand(c.raw);
      }
    }

    cmdWalkTo(a) {
      const W = this.world;
      const go = this.go;
      if (!go || !go.walkTo || go.dead) return;
      let x, y, dir = null;
      const n0 = parseFloat(a[0]);
      if (!isNaN(n0) && a.length >= 2) {
        x = n0; y = parseFloat(a[1]);
        if (a[2] !== undefined) dir = AW.parseDirArg(a[2]);
      } else {
        const t = W.resolve(a[0]);
        if (!t) return;
        if (t.kind === 'area') {
          const pt = a[1] === undefined ? -2 : parseInt(a[1], 10);
          const p = t.point(pt);
          if (!p) return;
          x = p[0]; y = p[1];
          if (p[2] !== undefined && p[2] !== null) dir = AW.angToDir(p[2]);
        } else if (t.kind === 'human') {
          const dist = a[1] === undefined ? 80 : parseFloat(a[1]);
          const np = W.nearPos(go, t, dist);
          x = np[0]; y = np[1];
          dir = null;
          const tgt = t;
          let done = false;
          go.walkTo(x, y, { onArrive: () => { go.face(tgt.x, tgt.y); done = true; }, onFail: () => { done = true; } });
          if (!go.path) { go.face(tgt.x, tgt.y); return; }
          this.task(() => done || !go.path || go.dead, () => go.stopWalk());
          return;
        } else {
          x = t.x; y = t.y;
        }
      }
      let done = false;
      const ok = go.walkTo(x, y, { goalRadius: 40, onArrive: () => { if (dir !== null) go.faceDir(dir); done = true; }, onFail: () => { done = true; } });
      if (!ok) {
        if (dir !== null) go.faceDir(dir);
        return;
      }
      this.task(() => done || !go.path || go.dead, () => go.stopWalk());
    }
  };

  AW.splitCommands = splitCommands;
  AW.parseCommand = parseCommand;
})(globalThis.AW = globalThis.AW || {});
