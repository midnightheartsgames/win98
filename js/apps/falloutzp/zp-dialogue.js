(function (Z) {
  'use strict';

  Z.DIALOGUES = Z.DIALOGUES || {};
  Z.DLG_SRC = Z.DLG_SRC || [];
  Z.SCRIPTS = Z.SCRIPTS || {};

  const SKILL_ALIAS = {};
  for (const s of Z.SKILLS) SKILL_ALIAS[s.id] = s.id;
  const STAT_ALIAS = {};
  for (const s of Z.STATS) STAT_ALIAS[s.id] = s.id;

  Z.parseDialogues = src => {
    const out = {};
    let tree = null, node = null;
    const lines = src.split('\n');
    lines.forEach((raw, ln) => {
      const line = raw.replace(/\s+$/, '');
      const t = line.trim();
      if (!t || t.startsWith('//')) return;
      if (t.startsWith('== ')) { const id = t.slice(3).trim(); tree = out[id] = { id, nodes: {}, first: null }; node = null; return; }
      if (!tree) throw new Error('dialogue line outside tree at ' + (ln + 1) + ': ' + t);
      if (t.startsWith('@ ')) { const id = t.slice(2).trim(); node = tree.nodes[id] = { id, lines: [], acts: [], opts: [], redirects: [] }; if (!tree.first) tree.first = id; return; }
      if (!node) throw new Error('line outside node at ' + (ln + 1) + ': ' + t);
      if (t.startsWith('>')) {
        const m = /^>([^:>]{1,30}):\s(.*)$/.exec(t);
        if (m && !/^\s/.test(m[1])) node.lines.push({ who: m[1].trim(), text: m[2] });
        else node.lines.push({ text: t.slice(1).trim() });
        return;
      }
      if (t.startsWith('! ')) { node.acts.push(t.slice(2).trim()); return; }
      if (t.startsWith('=> ')) { const m = /^=>\s+(\S+)(?:\s+\?(.+))?$/.exec(t); if (!m) throw new Error('bad redirect at ' + (ln + 1)); node.redirects.push({ to: m[1], cond: m[2] ? m[2].trim() : null }); return; }
      if (t.startsWith('* ')) {
        const m = /^\*\s+(.*?)\s+->\s+(\S+)(.*)$/.exec(t);
        if (!m) throw new Error('bad option at ' + (ln + 1) + ': ' + t);
        const opt = { text: m[1], to: m[2], cond: null, acts: [], check: null, once: false };
        const mods = m[3].trim();
        const re = /(\?\{[^}]*\}|\?\S+|!\{[^}]*\}|!\S+|#\S+|%once)/g;
        let mm;
        while ((mm = re.exec(mods))) {
          const tok = mm[1];
          if (tok === '%once') opt.once = true;
          else if (tok.startsWith('?{')) opt.cond = tok.slice(2, -1);
          else if (tok.startsWith('?')) opt.cond = tok.slice(1);
          else if (tok.startsWith('!{')) opt.acts.push(tok.slice(2, -1));
          else if (tok.startsWith('!')) opt.acts.push(tok.slice(1).replace(/_/g, ' '));
          else if (tok.startsWith('#')) { const [k, n, fail] = tok.slice(1).split(':'); opt.check = { k, n: +n, fail }; }
        }
        node.opts.push(opt);
        return;
      }
      if (node.lines.length) node.lines[node.lines.length - 1].text += ' ' + t;
      else throw new Error('unknown line at ' + (ln + 1) + ': ' + t);
    });
    return out;
  };

  Z.registerDialogues = src => { Z.DLG_SRC.push(src); Object.assign(Z.DIALOGUES, Z.parseDialogues(src)); };

  const G = Z.Game.prototype;

  G.checkValue = function (k) {
    const p = this.player;
    if (SKILL_ALIAS[k]) return p.sheet.skill(k);
    if (STAT_ALIAS[k]) return p.sheet.stat(k);
    return 0;
  };

  G.checkLabel = function (c) {
    if (SKILL_ALIAS[c.k]) return '[' + Z.skillName(c.k) + ' ' + c.n + ']';
    if (STAT_ALIAS[c.k]) return '[' + Z.statName(c.k) + ' ' + c.n + ']';
    if (c.k === 'talons') return '[' + c.n + ' талонов]';
    return '[' + c.k + ' ' + c.n + ']';
  };

  G.checkPass = function (c) {
    if (c.k === 'talons') return this.player.count('talon') >= c.n;
    return this.checkValue(c.k) >= c.n;
  };

  G.cond = function (expr, ctx = {}) {
    if (!expr) return true;
    const orParts = expr.split('|');
    return orParts.some(part => part.split('&').every(tok => this.condTok(tok.trim(), ctx)));
  };

  G.condTok = function (tok, ctx) {
    if (!tok) return true;
    if (tok.startsWith('!')) return !this.condTok(tok.slice(1), ctx);
    const m = /^([a-z]+):([\w.]+)(?:(>=|<=|=|>|<)(-?[\w.]+))?$/.exec(tok);
    const cmp = (v, op, w) => { const n = isNaN(+w) ? w : +w; switch (op) { case '>=': return v >= n; case '<=': return v <= n; case '>': return v > n; case '<': return v < n; case '=': return v == n; default: return !!v; } };
    if (m) {
      const [, kind, key, op, val] = m;
      const p = this.player;
      switch (kind) {
        case 'q': { const q = this.quests && this.quests[key]; const s = q ? q.stage : 0; return op ? cmp(s, op, val) : s > 0; }
        case 'qdone': return !!(this.quests && this.quests[key] && this.quests[key].done);
        case 'skill': return cmp(p.sheet.skill(key), op || '>=', val || 1);
        case 'stat': return cmp(p.sheet.stat(key), op || '>=', val || 1);
        case 'item': return cmp(p.count(key), op || '>=', val || 1);
        case 'rep': return cmp(this.repLevel(key).v, op || '>=', val || 1);
        case 'sex': return (p.sex || 'm') === key;
        case 'perk': return p.sheet.has(key);
        case 'trait': return p.sheet.traits.includes(key);
        case 'comp': return this.cell.actors.some(a => a.companion && a.cid === key && !a.dead);
        case 'time': { const h = this.hour; return key === 'day' ? h >= 6 && h < 21 : h < 6 || h >= 21; }
        case 'flag': return op ? cmp(this.flags[key], op, val) : !!this.flags[key];
        case 'npc': { const a = this.findActor(key); return key && a ? (op ? cmp(a.dead ? 'dead' : 'alive', op, val) : !a.dead) : false; }
        case 'dead': { const a = this.findActor(key); return !!(a && a.dead) || !!this.flags['dead_' + key]; }
        case 'f': return op ? cmp(this.flags[key], op, val) : !!this.flags[key];
        default: break;
      }
    }
    const m2 = /^(talons|karma|lvl|hp)(>=|<=|=|>|<)(-?\d+)$/.exec(tok);
    if (m2) {
      const v = m2[1] === 'talons' ? this.player.count('talon') : m2[1] === 'karma' ? this.karma : m2[1] === 'lvl' ? this.player.sheet.level : this.player.hp;
      return { '>=': v >= +m2[3], '<=': v <= +m2[3], '=': v === +m2[3], '>': v > +m2[3], '<': v < +m2[3] }[m2[2]];
    }
    if (ctx.actor && tok === 'npcflag') return !!ctx.actor.flags;
    if (Z.SCRIPTS['cond_' + tok]) return !!Z.SCRIPTS['cond_' + tok](this, ctx);
    return !!this.flags[tok];
  };

  G.act = function (str, ctx = {}) {
    const out = [];
    for (const raw of str.split(';').map(s => s.trim()).filter(Boolean)) {
      const qi = raw.indexOf(' ?');
      if (qi >= 0 && !this.cond(raw.slice(qi + 2).trim(), ctx)) continue;
      const a = qi >= 0 ? raw.slice(0, qi).trim() : raw;
      const [cmd, ...args] = a.split(/\s+/);
      const p = this.player;
      switch (cmd) {
        case 'set': { const [k, v] = args[0].split('='); this.flags[k] = v === undefined ? true : isNaN(+v) ? v : +v; break; }
        case 'unset': delete this.flags[args[0]]; break;
        case 'inc': this.flags[args[0]] = (this.flags[args[0]] || 0) + (+args[1] || 1); break;
        case 'q': this.setStage(args[0], +args[1]); break;
        case 'give': { const n = +args[1] || 1; p.give(args[0], n); this.msg((Z.item(args[0]).currency ? 'Талоны: +' + n : Z.item(args[0]).name + (n > 1 ? ' (' + n + ')' : '') + ' — получено.'), 'item'); break; }
        case 'take': { const n = args[1] === 'all' ? p.count(args[0]) : (+args[1] || 1); p.take(args[0], n); if (n) this.msg((Z.item(args[0]).currency ? 'Талоны: −' + n : Z.item(args[0]).name + ' — отдано.'), 'item'); break; }
        case 'talons': { const n = +args[0]; if (n > 0) { p.give('talon', n); this.msg('Талоны: +' + n, 'item'); } else { p.take('talon', -n); this.msg('Талоны: ' + n, 'item'); } break; }
        case 'xp': this.giveXP(+args[0]); break;
        case 'karma': this.addKarma(+args[0]); break;
        case 'rep': this.addRep(args[0], +args[1] || 0, +args[2] || 0); break;
        case 'heal': p.hp = p.hpMax; p.healLimbs(true); if (args[0] === 'rads') { p.rads = 0; this.applyRadSickness(p); } break;
        case 'fight': if (ctx.actor) { ctx.actor.hostile = true; ctx.actor.provoked = true; this.enterCombat(ctx.actor, p); } out.push('end'); break;
        case 'hostile': for (const o of this.cell.actors) if (o.faction === args[0] && !o.dead && o.ai) { o.hostile = true; this.enterCombat(o, p); } break;
        case 'trade': out.push('trade'); break;
        case 'end': out.push('end'); break;
        case 'join': if (ctx.actor) this.recruit(ctx.actor); break;
        case 'leave': if (ctx.actor) this.dismiss(ctx.actor); break;
        case 'wait': if (ctx.actor && ctx.actor.ai) { ctx.actor.ai.wait = true; } break;
        case 'follow': if (ctx.actor && ctx.actor.ai) { ctx.actor.ai.wait = false; } break;
        case 'msg': this.msg(args.join(' '), 'info'); break;
        case 'script': { const fn = Z.SCRIPTS[args[0]]; if (fn) { const r = fn(this, ctx, args.slice(1)); if (r) out.push(r); } break; }
        case 'travel': this.enterCell(args[0], args[1]); out.push('end'); break;
        case 'note': this.readNote(args[0]); break;
        case 'loc': this.discover(args[0]); break;
        case 'repair': for (const e of p.inv) if (e.cond !== undefined) e.cond = Math.max(e.cond, +args[0] || 1); break;
        case 'learn': p.sheet.books[args[0]] = (p.sheet.books[args[0]] || 0) + (+args[1] || 1); this.msg(Z.skillName(args[0]) + ' +' + (+args[1] || 1), 'level'); break;
        case 'perk': p.sheet.perks[args[0]] = (p.sheet.perks[args[0]] || 0) + 1; this.msg('Новый перк: ' + ((Z.perkDef(args[0]) || (Z.COMPANION_PERKS && Z.COMPANION_PERKS[args[0]]) || { name: args[0] }).name), 'level'); break;
        default: throw new Error('unknown action ' + cmd);
      }
    }
    return out;
  };

  G.subst = function (text, ctx = {}) {
    const p = this.player;
    return text.replace(/\{([^}|]*)\|([^}]*)\}/g, (m, a, b) => (p.sex === 'f' ? b : a))
      .replace(/\{name\}/g, p.name)
      .replace(/\{npc\}/g, ctx.actor ? ctx.actor.name : '')
      .replace(/\{talons\}/g, String(p.count('talon')));
  };

  class Dialogue {
    constructor(game, treeId, actor) {
      this.g = game;
      this.tree = Z.DIALOGUES[treeId];
      if (!this.tree) throw new Error('no dialogue ' + treeId);
      this.actor = actor || null;
      this.ctx = { actor };
      this.history = [];
      this.ended = false;
      this.pending = [];
      this.chosen = game.flags['dlg_once_' + treeId] || (game.flags['dlg_once_' + treeId] = {});
    }
    start(nodeId) { this.go(nodeId || this.tree.first); return this; }
    go(id) {
      const g = this.g;
      if (id === 'END' || id === 'end') { this.ended = true; this.node = null; return; }
      if (id === 'TRADE') { this.pending.push('trade'); this.ended = true; return; }
      let node = this.tree.nodes[id];
      if (!node) throw new Error('no node ' + id + ' in ' + this.tree.id);
      for (let guard = 0; guard < 12; guard++) {
        const r = node.redirects.find(rd => g.cond(rd.cond, this.ctx));
        if (!r) break;
        if (r.to === 'END') { this.ended = true; this.node = null; return; }
        node = this.tree.nodes[r.to];
        if (!node) throw new Error('no node ' + r.to);
      }
      this.node = node;
      for (const a of node.acts) for (const r of g.act(a, this.ctx)) this.pending.push(r);
      this.lines = node.lines.map(l => ({ who: l.who, text: g.subst(l.text, this.ctx) }));
      this.options = node.opts.map((o, i) => ({ o, i })).filter(({ o, i }) => g.cond(o.cond, this.ctx) && !(o.once && this.chosen[node.id + ':' + i])).map(({ o, i }) => {
        const label = o.check ? g.checkLabel(o.check) + ' ' : '';
        const pass = o.check ? g.checkPass(o.check) : true;
        return { text: label + g.subst(o.text, this.ctx), pass, o, i };
      });
      if (!this.options.length && !this.ended) this.options = [{ text: '(Уйти)', pass: true, o: { to: 'END', acts: [] } }];
      if (this.pending.includes('end')) this.ended = true;
    }
    choose(k) {
      const op = this.options[k];
      if (!op) return;
      const g = this.g, o = op.o;
      this.history.push({ who: g.player.name, text: op.text });
      if (o.once) this.chosen[this.node.id + ':' + op.i] = true;
      let to = o.to;
      if (o.check) {
        if (op.pass) { g.msg('Проверка пройдена ' + g.checkLabel(o.check), 'info'); g.giveXP(Math.round(5 + o.check.n / 4)); this.lastCheck = 'ok'; }
        else { to = o.check.fail || to; this.lastCheck = 'fail'; }
        if (o.check.k === 'talons' && op.pass) g.player.take('talon', o.check.n);
      }
      if (!o.check || op.pass) for (const a of o.acts) for (const r of g.act(a, this.ctx)) this.pending.push(r);
      if (this.pending.includes('end')) { this.ended = true; return; }
      this.go(to);
    }
  }
  Z.Dialogue = Dialogue;

  G.findActor = function (id) {
    for (const c of this.cells.values()) for (const a of c.actors) if (a.id === id || a.npcId === id) return a;
    return null;
  };

  G.validateDialogues = function () {
    const errs = [];
    for (const [tid, t] of Object.entries(Z.DIALOGUES)) {
      for (const [nid, n] of Object.entries(t.nodes)) {
        for (const o of n.opts) {
          if (o.to !== 'END' && o.to !== 'TRADE' && !t.nodes[o.to]) errs.push(tid + ':' + nid + ' -> ' + o.to);
          if (o.check && o.check.fail && !t.nodes[o.check.fail]) errs.push(tid + ':' + nid + ' fail -> ' + o.check.fail);
          if (o.check && !SKILL_ALIAS[o.check.k] && !STAT_ALIAS[o.check.k] && o.check.k !== 'talons') errs.push(tid + ':' + nid + ' bad check ' + o.check.k);
        }
        for (const r of n.redirects) if (r.to !== 'END' && !t.nodes[r.to]) errs.push(tid + ':' + nid + ' => ' + r.to);
        if (!n.lines.length && !n.redirects.length) errs.push(tid + ':' + nid + ' empty');
      }
    }
    return errs;
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
