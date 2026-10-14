(function (D) {
  'use strict';
  const OPS = ['>=', '<=', '!=', '=', '>', '<'];
  const CHECK_LABEL = { persuade: 'Убеждение', intimidate: 'Запугивание', lie: 'Ложь' };
  const ACTIONS = new Set(['set', 'clr', 'inc', 'quest', 'give', 'take', 'gold', 'xp', 'ap', 'join', 'leave', 'codex', 'run', 'do', 'fight', 'hostile',
    'shop', 'goto', 'remove', 'heal', 'learn', 'end', 'toast', 'equip', 'follow', 'unfollow', 'music', 'party', 'rest', 'mouse']);

  const parseCond = s => {
    let not = false;
    if (s[0] === '!') { not = true; s = s.slice(1); }
    for (const op of OPS) {
      const i = s.indexOf(op);
      if (i > 0) {
        const raw = s.slice(i + op.length);
        const num = Number(raw);
        return { not, name: s.slice(0, i), op, val: raw !== '' && !isNaN(num) ? num : raw };
      }
    }
    return { not, name: s, op: null, val: null };
  };
  const compare = (v, op, val) => {
    switch (op) {
      case '=': return v == val;
      case '!=': return v != val;
      case '>=': return v >= val;
      case '<=': return v <= val;
      case '>': return v > val;
      case '<': return v < val;
      default: return !!v;
    }
  };
  const evalCond = (c, lookup) => {
    const cond = typeof c === 'string' ? parseCond(c) : c;
    const v = lookup(cond.name);
    const r = cond.op ? compare(v, cond.op, cond.val) : !!v;
    return cond.not ? !r : r;
  };
  const evalAll = (conds, lookup) => {
    if (!conds) return true;
    for (const c of conds) {
      if (c.indexOf('|') >= 0) { if (!c.split('|').some(x => evalCond(x, lookup))) return false; }
      else if (!evalCond(c, lookup)) return false;
    }
    return true;
  };
  const parseAct = s => {
    const parts = s.split(':');
    return { name: parts[0], args: parts.slice(1) };
  };

  const parseTokens = (str, into) => {
    for (const tok of str.trim().split(/\s+/)) {
      if (!tok) continue;
      if (tok[0] === '?') into.conds.push(tok.slice(1));
      else if (tok[0] === '!') into.acts.push(tok.slice(1));
      else if (tok[0] === '%') {
        const [kind, dc, fail] = tok.slice(1).split(':');
        into.check = { kind, dc: +dc, fail: fail || 'end' };
      } else if (tok === 'once') into.once = true;
      else if (!into.to) into.to = tok;
      else into.bad = (into.bad || '') + ' ' + tok;
    }
    return into;
  };

  const parseDialogs = (src, out) => {
    out = out || {};
    let dlg = null, node = null, nIdx = 0;
    const lines = src.split(/\r?\n/);
    for (let li = 0; li < lines.length; li++) {
      const raw = lines[li];
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith('==')) {
        const id = line.slice(2).trim();
        dlg = { id, nodes: {}, order: [] };
        out[id] = dlg;
        node = null;
        continue;
      }
      if (!dlg) throw new Error('dialog line outside dialog: ' + line);
      if (line[0] === '@') {
        const id = line.slice(1).trim();
        node = { id, lines: [], acts: [], jumps: [], replies: [], afters: [] };
        dlg.nodes[id] = node;
        dlg.order.push(id);
        continue;
      }
      if (!node) throw new Error('line outside node in ' + dlg.id + ': ' + line);
      if (line[0] === '!') { node.acts.push(...line.slice(1).trim().split(/\s+/).filter(Boolean)); continue; }
      if (line.startsWith('=>')) {
        const j = parseTokens(line.slice(2), { conds: [], acts: [] });
        if (node.lines.length === 0 && !node.replies.length) node.jumps.push(j);
        else node.afters.push(j);
        continue;
      }
      if (line[0] === '*') {
        const k = line.indexOf('=>');
        const text = (k >= 0 ? line.slice(1, k) : line.slice(1)).trim();
        const r = parseTokens(k >= 0 ? line.slice(k + 2) : '', { text, conds: [], acts: [] });
        r.key = dlg.id + ':' + node.id + ':' + (nIdx++);
        if (r.check) r.label = CHECK_LABEL[r.check.kind] || r.check.kind;
        node.replies.push(r);
        continue;
      }
      const c = line.indexOf(':');
      if (c > 0 && c < 24 && !/\s/.test(line.slice(0, c))) {
        node.lines.push({ sp: line.slice(0, c), text: line.slice(c + 1).trim() });
        continue;
      }
      if (node.lines.length) node.lines[node.lines.length - 1].text += ' ' + line;
      else throw new Error('bad dialog line in ' + dlg.id + '/' + node.id + ': ' + line);
    }
    return out;
  };

  const validateDialog = (dlg, ctx) => {
    const errs = [];
    const has = id => id === 'end' || !!dlg.nodes[id];
    if (!dlg.nodes.start) errs.push(dlg.id + ': no start');
    const checkActs = (acts, where) => {
      for (const a of acts) {
        const p = parseAct(a);
        if (!ACTIONS.has(p.name)) errs.push(where + ': unknown action ' + a);
        if (ctx && ctx.checkAct) { const e = ctx.checkAct(p); if (e) errs.push(where + ': ' + e); }
      }
    };
    const checkConds = (conds, where) => {
      for (const c of conds) for (const part of c.split('|')) {
        if (ctx && ctx.checkCond) { const e = ctx.checkCond(parseCond(part)); if (e) errs.push(where + ': ' + e); }
      }
    };
    const reach = new Set(['start']);
    for (const [nid, n] of Object.entries(dlg.nodes)) {
      const w = dlg.id + '/' + nid;
      checkActs(n.acts, w);
      for (const l of n.lines) if (ctx && ctx.speakers && !ctx.speakers(l.sp)) errs.push(w + ': unknown speaker ' + l.sp);
      for (const j of n.jumps.concat(n.afters)) {
        if (!has(j.to)) errs.push(w + ': jump to missing ' + j.to);
        if (j.bad) errs.push(w + ': junk tokens' + j.bad);
        checkConds(j.conds, w); checkActs(j.acts, w);
        reach.add(j.to);
      }
      if (!n.lines.length && !n.jumps.length && !n.acts.length) errs.push(w + ': empty node');
      if (n.jumps.length && n.jumps.every(j => j.conds.length) && !n.lines.length) errs.push(w + ': conditional jumps with no fallback');
      for (const r of n.replies) {
        if (!r.to) errs.push(w + ': reply without target "' + r.text + '"');
        else if (!has(r.to)) errs.push(w + ': reply to missing ' + r.to);
        if (r.bad) errs.push(w + ': junk tokens' + r.bad);
        if (r.check && !has(r.check.fail)) errs.push(w + ': check fail missing ' + r.check.fail);
        if (r.check && !CHECK_LABEL[r.check.kind]) errs.push(w + ': check kind ' + r.check.kind);
        checkConds(r.conds, w); checkActs(r.acts, w);
        reach.add(r.to);
        if (r.check) reach.add(r.check.fail);
      }
    }
    for (const nid of Object.keys(dlg.nodes)) if (!reach.has(nid)) errs.push(dlg.id + '/' + nid + ': unreachable');
    return errs;
  };

  D.DIALOGS = D.DIALOGS || {};
  const dialogs = src => parseDialogs(src, D.DIALOGS);

  Object.assign(D, { parseCond, evalCond, evalAll, parseAct, parseDialogs, validateDialog, dialogs, ACTIONS, CHECK_LABEL });
  if (typeof module !== 'undefined' && module.exports) module.exports = D;
})(globalThis.Dao98 = globalThis.Dao98 || {});
