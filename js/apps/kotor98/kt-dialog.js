(function (K) {
  'use strict';
  K.DIALOGS = K.DIALOGS || {};
  K.NPCS = K.NPCS || {};
  K.SCRIPTS = K.SCRIPTS || {};

  function splitTokens(s) {
    return s.trim().split(/\s+/).filter(t => t && t !== '|');
  }

  function parseTokens(tokens, where) {
    const conds = [], acts = [];
    let check = null;
    for (const t of tokens) {
      if (t[0] === '?') conds.push(t.slice(1));
      else if (t[0] === '!') acts.push(t.slice(1));
      else if (t[0] === '~') {
        const p = t.slice(1).split(':');
        if (p.length !== 3) throw new Error('bad check ' + t + ' at ' + where);
        check = { skill: p[0], dc: +p[1], fail: p[2] };
      } else throw new Error('bad token "' + t + '" at ' + where);
    }
    return { conds, acts, check };
  }

  function parseDialogs(src) {
    const out = {};
    let dlg = null, node = null;
    const lines = src.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      const line = raw.trim();
      const where = 'line ' + (i + 1) + (dlg ? ' in ' + dlg.id : '');
      if (!line) { if (node && node.text.length && node.text[node.text.length - 1] !== '\n') node.text.push('\n'); continue; }
      if (line.startsWith('==')) {
        const id = line.slice(2).trim();
        if (!id || out[id] || K.DIALOGS[id]) throw new Error('dup/empty dialog ' + id + ' at ' + where);
        dlg = { id, starts: [], nodes: {} };
        out[id] = dlg;
        node = null;
        continue;
      }
      if (!dlg) throw new Error('text outside dialog at ' + where);
      if (line[0] === '@') {
        const tk = splitTokens(line.slice(1));
        const p = parseTokens(tk.slice(1), where);
        dlg.starts.push({ node: tk[0], conds: p.conds, acts: p.acts });
        continue;
      }
      if (line[0] === '#') {
        const tk = splitTokens(line.slice(1));
        if (tk.length < 2) throw new Error('node header needs id and speaker at ' + where);
        if (dlg.nodes[tk[0]]) throw new Error('dup node ' + tk[0] + ' at ' + where);
        const p = parseTokens(tk.slice(2), where);
        node = { id: tk[0], who: tk[1], text: [], acts: p.acts, conds: p.conds, replies: [], cont: null };
        dlg.nodes[tk[0]] = node;
        continue;
      }
      if (!node) throw new Error('text outside node at ' + where);
      if (line[0] === '-' && line[1] === ' ') {
        let body = line.slice(2);
        let tokens = [];
        const bar = body.lastIndexOf(' | ');
        if (bar >= 0) { tokens = splitTokens(body.slice(bar + 3)); body = body.slice(0, bar); }
        let target = 'END';
        const arrow = body.lastIndexOf('->');
        if (arrow >= 0) { target = body.slice(arrow + 2).trim(); body = body.slice(0, arrow).trim(); }
        const p = parseTokens(tokens, where);
        node.replies.push({ text: body.trim(), target, conds: p.conds, acts: p.acts, check: p.check });
        continue;
      }
      if (line[0] === '>' ) {
        const tk = splitTokens(line.slice(1));
        node.cont = tk[0];
        const p = parseTokens(tk.slice(1), where);
        node.contActs = p.acts;
        continue;
      }
      node.text.push(line);
    }
    for (const d of Object.values(out)) {
      for (const n of Object.values(d.nodes)) {
        const parts = [];
        let cur = '';
        for (const t of n.text) {
          if (t === '\n') { if (cur) parts.push(cur); cur = ''; } else cur = cur ? cur + ' ' + t : t;
        }
        if (cur) parts.push(cur);
        n.text = parts.join('\n');
      }
    }
    return out;
  }

  function addDialogs(src) {
    const d = parseDialogs(src);
    Object.assign(K.DIALOGS, d);
    return d;
  }

  function addNpcs(defs) {
    for (const [id, d] of Object.entries(defs)) { d.id = id; K.NPCS[id] = d; }
  }

  function addScripts(defs) { Object.assign(K.SCRIPTS, defs); }

  const COND_RE = [
    /^!?[a-z0-9_]+$/,
    /^q:[a-z0-9_]+(>=|<=|=|<|>)\d+$/,
    /^!?party:[a-z0-9_]+$/,
    /^!?joined:[a-z0-9_]+$/,
    /^!?has:[a-z0-9_]+(:\d+)?$/,
    /^cr>=\d+$/,
    /^!?cls:[a-z]+$/,
    /^lvl>=\d+$/,
    /^var:[a-z0-9_]+(>=|<=|=|<|>)-?\d+$/,
    /^!?fem$/,
    /^!?skill:[a-z]{3}:\d+$/,
    /^!?droid$/,
    /^align(>=|<=)\d+$/
  ];
  const ACT_RE = [
    /^set:[a-z0-9_]+$/, /^unset:[a-z0-9_]+$/, /^var:[a-z0-9_]+(\+=|-=|=)-?\d+$/, /^q:[a-z0-9_]+=\d+$/,
    /^xp:\d+$/, /^cr:[+-]\d+$/, /^give:[a-z0-9_]+(:\d+)?$/, /^take:[a-z0-9_]+(:\d+)?$/, /^ls:\d+$/, /^ds:\d+$/,
    /^join:[a-z0-9_]+$/, /^fight:[a-z0-9_]+$/, /^shop:[a-z0-9_]+$/, /^pazaak:[a-z0-9_]+$/, /^swoop$/, /^goto:[a-z0-9_]+:.$/,
    /^run:[a-z0-9_]+$/, /^now:[a-z0-9_]+$/, /^end$/, /^leave$/, /^heal$/, /^duel:[a-z0-9_]+$/, /^party$/, /^rest$/
  ];

  function validCond(c) { const b = c[0] === '!' ? c.slice(1) : c; return COND_RE.some(r => r.test(b)); }
  function validAct(a) { return ACT_RE.some(r => r.test(a)); }

  Object.assign(K, { parseDialogs, addDialogs, addNpcs, addScripts, validCond, validAct });
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
