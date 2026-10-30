(function (A) {
  'use strict';
  const X = A.Script = {};
  const SLOTS = ['left', 'center', 'right'];
  const NAME = /^[a-z][a-z0-9_]*$/;
  const KEY = '[a-z_][a-z0-9_.]*';
  const SPECIAL = /^(dark|restraint|xp|missed|palace|stark_told|sus|respite|(bond|rank|letgo)\.[a-z]+|lekku_read|lekku_tell|lekku_pose|info_[a-z0-9_]+|clue_[a-z0-9_]+|archive_[a-z0-9]+|ambush_score|placed(_a\d)?|clear_[a-z0-9_]+|credits|spent|duel_[a-z0-9_]+)$/;
  const MEMORY_ARGS = ['restore', 'palace', 'stark'];
  const SCENERY = ['say', 'bg', 'show', 'face', 'hide', 'cg', 'still', 'music', 'sfx'];
  X.SLOTS = SLOTS;
  X.GESTURES = ['hello', 'bye', 'love', 'insult'];

  const value = s => (s === 'true' ? true : s === 'false' ? false : isNaN(+s) ? s : +s);

  X.parseEffects = src => src.split(/[\s,]+/).filter(Boolean).map(tok => {
    let m;
    if ((m = new RegExp('^(' + KEY + ')([+-])(\\d+)$').exec(tok))) return { key: m[1], op: m[2], v: +m[3] };
    if ((m = new RegExp('^(' + KEY + ')=([\\w.-]+)$').exec(tok))) return { key: m[1], op: '=', v: value(m[2]) };
    if ((m = new RegExp('^(!?)(' + KEY + ')$').exec(tok))) return { key: m[2], op: '=', v: !m[1] };
    throw new Error('bad effect: ' + tok);
  });

  const atoms = src => src.split('&&').map(p => p.trim()).map(p => {
    let m;
    if ((m = new RegExp('^(' + KEY + ')\\s*(>=|<=|==|!=|>|<)\\s*([\\w.-]+)$').exec(p))) return { key: m[1], cmp: m[2], v: value(m[3]) };
    if ((m = new RegExp('^(!?)(' + KEY + ')$').exec(p))) return { key: m[2], cmp: m[1] ? 'not' : 'truthy' };
    throw new Error('bad condition: ' + p);
  });

  X.parseCond = src => {
    const groups = src.split('||').map(atoms);
    return groups.length === 1 ? groups[0] : [{ cmp: 'or', groups, key: null }];
  };

  X.respiteBg = S => {
    const R = S.respite && A.RESPITES[S.respite.id], place = R && A.PLACES[R.place], room = place && place.rooms.find(r => r.acts.includes('train'));
    const id = room ? room.bg : 'temple_hall', art = A.Art && A.Art.LIST.bg[id];
    return { id, time: art ? art.times[0] : 'day' };
  };

  X.thinker = who => {
    const m = /^([a-z][a-z0-9]*)_thinks$/.exec(who || '');
    return m && A.CAST && A.CAST[m[1]] ? m[1] : null;
  };

  X.condKeys = cond => cond.flatMap(c => (c.cmp === 'or' ? c.groups.flatMap(X.condKeys) : [c.key]));

  const pairs = (rest, allowed) => {
    const out = {}, words = [];
    for (const tok of rest.split(/\s+/).filter(Boolean)) {
      const m = /^([a-z]+)=(.+)$/.exec(tok);
      if (m) {
        if (!allowed.includes(m[1])) throw new Error('unknown option ' + m[1]);
        out[m[1]] = m[2];
      } else words.push(tok);
    }
    return { out, words };
  };

  X.parse = (src, file) => {
    const labels = {}, order = [];
    let cur = null, choice = null, count = 0;
    const stack = [];
    const lines = String(src).replace(/\r/g, '').split('\n');
    lines.forEach((raw, idx) => {
      const n = idx + 1, line = raw.trim();
      const where = `${file || 'script'}:${n}`;
      if (!line) return;
      try {
        if (line.startsWith('@')) {
          if (choice) throw new Error('choice is not closed');
          if (stack.length) throw new Error('if is not closed');
          const name = line.slice(1).trim();
          if (!NAME.test(name)) throw new Error('bad label ' + name);
          if (labels[name]) throw new Error('duplicate label ' + name);
          cur = labels[name] = { name, steps: [], file, line: n };
          order.push(name);
          count = 0;
          return;
        }
        if (!cur) throw new Error('command before the first label');
        const steps = cur.steps;
        const id = () => `${cur.name}.${++count}`;
        if (choice) {
          if (line === 'end') {
            if (choice.options.length < 2) throw new Error('choice needs at least two options');
            steps.push(choice);
            choice = null;
            return;
          }
          const m = /^>\s*(?:\[([a-z ]+)\]\s*)?(.+?)\s*->\s*([a-z][a-z0-9_]*)\s*(?:\|\s*(.+))?$/.exec(line);
          if (!m) throw new Error('bad option');
          const tags = (m[1] || '').split(' ').filter(Boolean);
          if (tags.some(t => t !== 'lie')) throw new Error('unknown option tag');
          choice.options.push({ text: m[2], lie: tags.includes('lie'), to: m[3], effects: m[4] ? X.parseEffects(m[4]) : [], id: id(), line: n });
          return;
        }
        const say = /^(-|[a-z][a-z0-9_]*):\s*(.+)$/.exec(line);
        if (say) {
          steps.push({ op: 'say', who: say[1], text: say[2], id: id(), line: n });
          return;
        }
        const sp = line.indexOf(' ');
        const word = sp < 0 ? line : line.slice(0, sp), rest = sp < 0 ? '' : line.slice(sp + 1).trim();
        const args = rest.split(/\s+/).filter(Boolean);
        switch (word) {
          case 'bg':
            if (args.length < 1 || args.length > 2) throw new Error('bg <id> [time]');
            steps.push({ op: 'bg', id: args[0], time: args[1] || null, line: n });
            break;
          case 'show': {
            const p = pairs(rest, ['lekku']);
            if (p.words.length !== 4) throw new Error('show <who> <slot> <outfit> <face> [lekku=pose]');
            steps.push({ op: 'show', who: p.words[0], slot: p.words[1], outfit: p.words[2], face: p.words[3], lekku: p.out.lekku || null, line: n });
            break;
          }
          case 'face': {
            const p = pairs(rest, ['lekku']);
            if (p.words.length !== 2) throw new Error('face <who> <face> [lekku=pose]');
            steps.push({ op: 'face', who: p.words[0], face: p.words[1], lekku: p.out.lekku || null, line: n });
            break;
          }
          case 'hide':
            if (args.length !== 1) throw new Error('hide <who|all>');
            steps.push({ op: 'hide', who: args[0], line: n });
            break;
          case 'cg':
          case 'still':
          case 'music':
            if (args.length !== 1) throw new Error(word + ' <id|off>');
            steps.push({ op: word, id: args[0] === 'off' ? null : args[0], line: n });
            break;
          case 'sfx':
            if (args.length !== 1) throw new Error('sfx <id>');
            steps.push({ op: 'sfx', id: args[0], line: n });
            break;
          case 'set':
            steps.push({ op: 'set', effects: X.parseEffects(rest), line: n });
            break;
          case 'if':
            stack.push({ at: steps.length, jmp: null });
            steps.push({ op: 'if', cond: X.parseCond(rest), at: -1, line: n });
            break;
          case 'else': {
            const top = stack[stack.length - 1];
            if (!top || top.jmp !== null) throw new Error('else without if');
            top.jmp = steps.length;
            steps.push({ op: 'jmp', at: -1, line: n });
            steps[top.at].at = steps.length;
            break;
          }
          case 'end': {
            const top = stack.pop();
            if (!top) throw new Error('end without if or choice');
            if (top.jmp !== null) steps[top.jmp].at = steps.length;
            else steps[top.at].at = steps.length;
            break;
          }
          case 'goto':
            if (args.length !== 1 || !NAME.test(args[0])) throw new Error('goto <label>');
            steps.push({ op: 'goto', to: args[0], line: n });
            break;
          case 'stop':
            steps.push({ op: 'stop', line: n });
            break;
          case 'credits':
            steps.push({ op: 'credits', line: n });
            break;
          case 'map':
            if (args.length < 1 || args.length > 2) throw new Error('map <id> [entry]');
            steps.push({ op: 'map', id: args[0], at: args[1] || 'start', line: n });
            break;
          case 'battle':
            if (args.length < 1 || args.length > 2) throw new Error('battle <group> [party|enemy|none]');
            steps.push({ op: 'battle', group: args[0], advantage: args[1] || 'none', line: n });
            break;
          case 'field':
          case 'forget':
          case 'rest':
          case 'return':
            if (args.length) throw new Error(word + ' takes no arguments');
            steps.push({ op: word, line: n });
            break;
          case 'chapter':
            if (args.length !== 1 || !NAME.test(args[0])) throw new Error('chapter <id>');
            if (steps.length) throw new Error('chapter must open its label');
            steps.push({ op: 'chapter', id: args[0], line: n });
            break;
          case 'recall':
            if (args.length !== 1 || !/^\d+$/.test(args[0])) throw new Error('recall <fragment number>');
            steps.push({ op: 'recall', id: +args[0], line: n });
            break;
          case 'bond':
          case 'respite':
          case 'cover':
          case 'flight':
            if (args.length !== 1 || !NAME.test(args[0])) throw new Error(word + ' <id>');
            steps.push({ op: word, id: args[0], line: n });
            break;
          case 'memory':
            if (args.length !== 1 || !MEMORY_ARGS.includes(args[0])) throw new Error('memory <' + MEMORY_ARGS.join('|') + '>');
            steps.push({ op: 'memory', what: args[0], line: n });
            break;
          case 'choice': {
            const p = pairs(rest, ['lekku', 'need', 'gestures', 'timer']);
            if (p.words.length) throw new Error('choice [lekku=who need=N gestures=a,b timer=sec]');
            const lekku = p.out.lekku ? { who: p.out.lekku, need: +(p.out.need || 0), gestures: p.out.gestures ? p.out.gestures.split(',') : [] } : null;
            choice = { op: 'choice', lekku, timer: p.out.timer ? +p.out.timer : 0, options: [], line: n };
            break;
          }
          default:
            throw new Error('unknown command ' + word);
        }
      } catch (e) {
        throw new Error(where + ': ' + e.message);
      }
    });
    if (choice) throw new Error(`${file || 'script'}: choice is not closed at the end`);
    if (stack.length) throw new Error(`${file || 'script'}: if is not closed at the end`);
    return { labels, order, file };
  };

  X.build = () => X.merge(Object.values(A.Scripts).map(sc => X.parse(sc.src, sc.file)));

  X.merge = programs => {
    const labels = {}, order = [];
    for (const p of programs) {
      for (const name of p.order) {
        if (labels[name]) throw new Error('label in two scripts: ' + name);
        labels[name] = p.labels[name];
        order.push(name);
      }
    }
    return { labels, order };
  };

  const bondOf = (S, id) => S.bonds[id] || (S.bonds[id] = { rank: 0, pts: 0, letgo: 0 });
  const aaylaOf = S => (S.party || []).find(m => m.id === 'aayla');

  X.getVar = (S, key) => {
    if (key === 'dark') return S.dark;
    if (key === 'restraint') return S.restraint || 0;
    if (key === 'xp') return (aaylaOf(S) || {}).xp || 0;
    if (key === 'missed') return A.Memory.missed(S).length;
    if (key === 'palace') return A.Memory.will(S);
    if (key === 'sus') return S.cover ? Math.round(S.cover.sus) : 0;
    if (key === 'respite') return S.respite ? S.respite.id : '';
    if (key === 'credits') return S.credits || 0;
    const dot = key.indexOf('.');
    if (dot > 0) {
      const b = S.bonds[key.slice(dot + 1)] || {}, kind = key.slice(0, dot);
      if (kind === 'bond') return b.pts || 0;
      if (kind === 'rank') return b.rank || 0;
      if (kind === 'letgo') return b.letgo || 0;
    }
    return S.flags[key];
  };

  X.setVar = (S, key, v) => {
    if (key === 'dark') S.dark = A.clamp(v, 0, 100);
    else if (key === 'restraint') S.restraint = A.clamp(v, 0, 3);
    else if (key === 'suspicion') S.flags.suspicion = A.clamp(v, 0, 100);
    else if (key === 'xp') A.Party.gain(S, v - X.getVar(S, 'xp'));
    else if (key === 'sus') A.Cover.add(S, v - X.getVar(S, 'sus'), 'word');
    else if (key === 'respite') throw new Error('respite is read only');
    else if (key === 'credits') S.credits = Math.max(0, v);
    else if (key.startsWith('bond.')) bondOf(S, key.slice(5)).pts = A.clamp(v, -3, 9);
    else if (key.startsWith('letgo.')) bondOf(S, key.slice(6)).letgo = A.clamp(v, 0, 3);
    else if (key.startsWith('rank.')) throw new Error('ranks grow only through the bond command: ' + key);
    else S.flags[key] = v;
  };

  X.apply = (S, effects) => {
    for (const e of effects) {
      const cur = X.getVar(S, e.key);
      X.setVar(S, e.key, e.op === '+' ? (cur || 0) + e.v : e.op === '-' ? (cur || 0) - e.v : e.v);
    }
  };

  X.test = (S, cond) => cond.every(c => {
    if (c.cmp === 'or') return c.groups.some(g => X.test(S, g));
    const v = X.getVar(S, c.key);
    switch (c.cmp) {
      case 'truthy': return !!v;
      case 'not': return !v;
      case '>=': return (v || 0) >= c.v;
      case '<=': return (v || 0) <= c.v;
      case '>': return (v || 0) > c.v;
      case '<': return (v || 0) < c.v;
      case '==': return v === c.v;
      case '!=': return v !== c.v;
    }
    return false;
  });

  X.lekkuResult = (S, lekku, option, pose) => {
    const shown = pose !== 'calm';
    const tell = !shown && option.lie && ((A.CAST[lekku.who] || {}).truth || (S.restraint || 0) < lekku.need);
    return { read: shown || tell, tell, pose: shown ? (pose === 'show' ? 'up' : pose) : tell ? 'twitch' : 'still' };
  };

  X.Story = class {
    constructor(program, S, start) {
      if (!program.labels[start]) throw new Error('no label ' + start);
      this.program = program;
      this.S = S;
      this.pc = { label: start, i: 0 };
      this.vn = { bg: null, time: null, cg: null, still: null, music: null, busts: {} };
      this.sounds = [];
      this.stack = [];
      this.done = false;
    }

    step() {
      return this.program.labels[this.pc.label].steps[this.pc.i];
    }

    next() {
      const vn = this.vn;
      for (let guard = 0; guard < 10000; guard++) {
        if (this.done) return { type: 'end' };
        const s = this.step();
        if (!s) throw new Error('fell off label ' + this.pc.label);
        switch (s.op) {
          case 'bg': {
            const b = s.id === 'respite' ? X.respiteBg(this.S) : s;
            vn.bg = b.id;
            vn.time = b.time;
            vn.cg = null;
            break;
          }
          case 'show':
            for (const [who, b] of Object.entries(vn.busts)) if (b.slot === s.slot && who !== s.who) delete vn.busts[who];
            vn.busts[s.who] = { slot: s.slot, outfit: s.outfit, face: s.face, lekku: s.lekku || 'still' };
            break;
          case 'face': {
            const b = vn.busts[s.who];
            if (b) {
              b.face = s.face;
              if (s.lekku) b.lekku = s.lekku;
            }
            break;
          }
          case 'hide':
            if (s.who === 'all') vn.busts = {};
            else delete vn.busts[s.who];
            break;
          case 'cg': vn.cg = s.id; break;
          case 'still': vn.still = s.id; break;
          case 'music': vn.music = s.id; break;
          case 'sfx': this.sounds.push(s.id); break;
          case 'set': X.apply(this.S, s.effects); break;
          case 'if':
            if (!X.test(this.S, s.cond)) { this.pc.i = s.at; continue; }
            break;
          case 'jmp': this.pc.i = s.at; continue;
          case 'goto': this.pc = { label: s.to, i: 0 }; continue;
          case 'stop': this.done = true; return { type: 'end' };
          case 'credits': this.done = true; return { type: 'credits' };
          case 'map':
            this.pc.i++;
            this.clear();
            return { type: 'map', id: s.id, at: s.at };
          case 'field':
            this.pc.i++;
            this.clear();
            return { type: 'field' };
          case 'battle':
            this.pc.i++;
            return { type: 'battle', group: s.group, advantage: s.advantage };
          case 'forget':
            this.pc.i++;
            return { type: 'forget' };
          case 'flight':
            this.pc.i++;
            return { type: 'flight', id: s.id, label: this.pc.label };
          case 'chapter':
            this.pc.i++;
            this.clear();
            this.S.chapter = s.id;
            if (A.CHAPTERS[s.id] && A.CHAPTERS[s.id].credits !== undefined) this.S.credits = A.CHAPTERS[s.id].credits;
            return { type: 'chapter', id: s.id, label: this.pc.label };
          case 'recall':
            this.pc.i++;
            A.Memory.recall(this.S, s.id);
            return { type: 'recall', id: s.id };
          case 'rest':
            A.Party.ensure(this.S);
            A.Party.rest(this.S);
            break;
          case 'bond': {
            const r = A.Bonds.plot(this.S, s.id);
            this.stack.push({ label: this.pc.label, i: this.pc.i + 1, bond: s.id, rank: r.rank });
            this.pc = { label: r.label, i: 0 };
            continue;
          }
          case 'return': {
            const back = this.stack.pop();
            if (!back) throw new Error('return without a call in ' + this.pc.label);
            this.pc = { label: back.label, i: back.i };
            if (back.ui || back.bond) return { type: 'return', ui: back.ui || null, bond: back.bond || null, rank: back.rank || 0 };
            continue;
          }
          case 'respite':
            this.pc.i++;
            return { type: 'respite', id: s.id };
          case 'cover':
            if (s.id === 'end') { A.Cover.end(this.S); break; }
            this.pc.i++;
            A.Cover.start(this.S, s.id);
            return { type: 'cover', id: s.id };
          case 'memory': {
            this.pc.i++;
            const ids = s.what === 'restore' ? A.Memory.restore(this.S) : [];
            if (s.what === 'stark') A.Memory.tell(this.S);
            return { type: 'memory', what: s.what, ids };
          }
          case 'say': this.pc.i++; return { type: 'say', who: s.who, text: s.text, id: s.id };
          case 'choice': return { type: 'choice', lekku: s.lekku, timer: s.timer, options: s.options.map(o => ({ text: o.text, id: o.id })) };
        }
        this.pc.i++;
      }
      throw new Error('script loops without a stop in ' + this.pc.label);
    }

    clear() {
      this.vn = { bg: null, time: null, cg: null, still: null, music: this.vn.music, busts: {} };
    }

    jump(label) {
      if (!this.program.labels[label]) throw new Error('no label ' + label);
      this.pc = { label, i: 0 };
      this.stack = [];
      this.done = false;
    }

    call(label, ret) {
      if (!this.program.labels[label]) throw new Error('no label ' + label);
      this.stack.push(Object.assign({ label: this.pc.label, i: this.pc.i }, ret || {}));
      this.pc = { label, i: 0 };
      this.done = false;
    }

    choose(k, pose) {
      const s = this.step();
      if (!s || s.op !== 'choice') throw new Error('no choice here');
      const o = s.options[k];
      if (!o) throw new Error('no option ' + k);
      if (s.lekku) {
        const r = X.lekkuResult(this.S, s.lekku, o, pose || 'calm');
        this.S.flags.lekku_read = r.read;
        this.S.flags.lekku_tell = r.tell;
        this.S.flags.lekku_pose = r.pose;
        if (this.vn.busts.aayla) this.vn.busts.aayla.lekku = r.pose;
      }
      X.apply(this.S, o.effects);
      this.pc = { label: o.to, i: 0 };
      return o;
    }

    snapshot() {
      return { pc: { ...this.pc }, vn: JSON.parse(JSON.stringify(this.vn)), done: this.done, stack: this.stack.map(f => ({ ...f })) };
    }

    restore(snap) {
      this.pc = { ...snap.pc };
      this.vn = JSON.parse(JSON.stringify(snap.vn));
      this.done = snap.done;
      this.stack = (snap.stack || []).map(f => ({ ...f }));
    }
  };

  X.check = (program, ctx) => {
    const errors = [], L = program.labels, sets = new Set();
    const err = (lab, s, msg) => errors.push(`${lab.file || ''}:${s ? s.line : lab.line} ${lab.name}: ${msg}`);
    for (const lab of Object.values(L)) {
      for (const s of lab.steps) {
        if (s.op === 'set') s.effects.forEach(e => sets.add(e.key));
        if (s.op === 'choice') s.options.forEach(o => o.effects.forEach(e => sets.add(e.key)));
      }
    }
    for (const lab of Object.values(L)) {
      const steps = lab.steps, seen = new Set(), todo = [0];
      while (todo.length) {
        const i = todo.pop();
        if (seen.has(i)) continue;
        seen.add(i);
        if (i >= steps.length) { err(lab, steps[steps.length - 1], 'falls off the end of the label'); continue; }
        const s = steps[i];
        if (s.op === 'goto' || s.op === 'stop' || s.op === 'credits' || s.op === 'choice' || s.op === 'map' || s.op === 'field' || s.op === 'return') continue;
        if (s.op === 'jmp') { todo.push(s.at); continue; }
        if (s.op === 'if') todo.push(s.at);
        todo.push(i + 1);
      }
      let dashes = 0;
      for (const s of steps) {
        const cast = ctx.cast;
        const person = w => cast[w] || (X.thinker(w) ? cast[X.thinker(w)] : null);
        if (s.op === 'say') {
          if (s.who !== '-' && !person(s.who)) err(lab, s, 'unknown speaker ' + s.who);
          dashes += (s.text.match(/—/g) || []).length;
          if (ctx.fits && !ctx.fits(s.text)) err(lab, s, 'line does not fit the box: ' + s.text);
        }
        if (s.op === 'show' || s.op === 'face') {
          const c = person(s.who);
          if (!c) { err(lab, s, 'unknown character ' + s.who); continue; }
          if (s.op === 'show') {
            if (!SLOTS.includes(s.slot)) err(lab, s, 'unknown slot ' + s.slot);
            if (!c.outfits[s.outfit]) err(lab, s, `${s.who} has no outfit ${s.outfit}`);
          }
          if (!c.faces.includes(s.face)) err(lab, s, `${s.who} has no face ${s.face}`);
          if (s.lekku && (!c.lekku || !ctx.lekku[s.lekku])) err(lab, s, `bad lekku ${s.lekku} for ${s.who}`);
        }
        if (s.op === 'hide' && s.who !== 'all' && !person(s.who)) err(lab, s, 'unknown character ' + s.who);
        if (s.op === 'bg') {
          const b = s.id === 'respite' ? { times: [s.time] } : ctx.art.bg[s.id];
          if (!b) err(lab, s, 'unknown background ' + s.id);
          else if (s.time && !b.times.includes(s.time)) err(lab, s, `background ${s.id} has no time ${s.time}`);
        }
        if (s.op === 'cg' && s.id && !ctx.art.cg[s.id]) err(lab, s, 'unknown CG ' + s.id);
        if (s.op === 'still' && s.id && !ctx.art.still[s.id]) err(lab, s, 'unknown memory picture ' + s.id);
        if (s.op === 'music' && s.id && !ctx.music.includes(s.id)) err(lab, s, 'unknown music ' + s.id);
        if (s.op === 'goto' && !L[s.to]) err(lab, s, 'goto to unknown label ' + s.to);
        if (s.op === 'battle') {
          if (ctx.groups && !ctx.groups[s.group]) err(lab, s, 'unknown battle group ' + s.group);
          if (!['party', 'enemy', 'none'].includes(s.advantage)) err(lab, s, 'unknown advantage ' + s.advantage);
        }
        if (s.op === 'chapter' && ctx.chapters && !ctx.chapters[s.id]) err(lab, s, 'unknown chapter ' + s.id);
        if (s.op === 'bond' && ctx.bonds && !ctx.bonds[s.id]) err(lab, s, 'unknown bond ' + s.id);
        if (s.op === 'respite' && ctx.respites && !ctx.respites[s.id]) err(lab, s, 'unknown respite ' + s.id);
        if (s.op === 'cover' && ctx.covers && s.id !== 'end' && !ctx.covers[s.id]) err(lab, s, 'unknown cover ' + s.id);
        if (s.op === 'flight') {
          if (ctx.flights && !ctx.flights[s.id]) err(lab, s, 'unknown flight ' + s.id);
          if (steps.slice(0, steps.indexOf(s)).some(p => !SCENERY.includes(p.op))) err(lab, s, 'flight must come before anything that changes the state, the autosave replays its label');
        }
        if (s.op === 'recall' && ctx.memory) {
          const e = ctx.memory.find(x => x.id === s.id);
          if (!e || e.gap) err(lab, s, 'unknown memory fragment ' + s.id);
        }
        if (s.op === 'map' && ctx.maps) {
          const def = ctx.maps[s.id];
          if (!def) err(lab, s, 'unknown map ' + s.id);
          else if (!def.entries[s.at]) err(lab, s, `map ${s.id} has no entry ${s.at}`);
        }
        if (s.op === 'if') X.condKeys(s.cond).forEach(k => { if (!sets.has(k) && !SPECIAL.test(k) && !(ctx.flags || []).includes(k)) err(lab, s, 'condition reads a flag nobody sets: ' + k); });
        if (s.op === 'choice') {
          for (const o of s.options) {
            if (!L[o.to]) err(lab, s, 'option goes to unknown label ' + o.to);
            if (ctx.fits && !ctx.fits(o.text)) err(lab, s, 'option does not fit: ' + o.text);
          }
          if (s.lekku) {
            if (!person(s.lekku.who)) err(lab, s, 'unknown lekku reader ' + s.lekku.who);
            if (!(s.lekku.need >= 0 && s.lekku.need <= 3)) err(lab, s, 'lekku need must be 0..3');
            if (s.lekku.gestures.some(g => !X.GESTURES.includes(g))) err(lab, s, 'unknown gesture');
          }
        }
      }
      if (dashes > 1) err(lab, null, `${dashes} long dashes in one scene, game-human-style allows one`);
    }
    const edges = name => {
      const out = [];
      for (const s of L[name].steps) {
        if (s.op === 'goto') out.push(s.to);
        if (s.op === 'choice') s.options.forEach(o => out.push(o.to));
      }
      return out.filter(n => L[n]);
    };
    const reach = new Set(), todo = [...(ctx.starts || [])];
    while (todo.length) {
      const n = todo.pop();
      if (reach.has(n) || !L[n]) continue;
      reach.add(n);
      todo.push(...edges(n));
    }
    for (const name of program.order) if (!reach.has(name)) err(L[name], null, 'label is not reachable from the chapter start');
    const ends = new Set(program.order.filter(n => L[n].steps.some(s => s.op === 'stop' || s.op === 'credits' || s.op === 'map' || s.op === 'field' || s.op === 'return')));
    let grew = true;
    while (grew) {
      grew = false;
      for (const n of program.order) if (!ends.has(n) && edges(n).some(m => ends.has(m))) { ends.add(n); grew = true; }
    }
    for (const name of program.order) if (!ends.has(name)) err(L[name], null, 'no path from this label to the end');
    const ids = new Set();
    for (const lab of Object.values(L)) for (const s of lab.steps) {
      for (const it of s.op === 'say' ? [s] : s.op === 'choice' ? s.options : []) {
        if (ids.has(it.id)) err(lab, s, 'duplicate line id ' + it.id);
        ids.add(it.id);
      }
    }
    return errors;
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
