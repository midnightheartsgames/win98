'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'hsr98');

function loadGame() {
  const html = fs.readFileSync(path.join(ROOT, 'hsr98.html'), 'utf8');
  const mods = [...html.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
  const H = require(path.join(DIR, 'hsr-core.js'));
  for (const f of mods.slice(0, mods.indexOf('hsr-gfx'))) if (f !== 'hsr-core' && f !== 'hsr-atlas-data') require(path.join(DIR, f + '.js'));
  return H;
}

function tokens(expr) {
  const out = [];
  for (const part of String(expr || '').split('|')) for (let t of part.split('&')) {
    t = t.trim();
    if (!t) continue;
    const neg = t[0] === '!';
    if (neg) t = t.slice(1);
    out.push({ neg, t });
  }
  return out;
}

function alternatives(expr) {
  return String(expr || '').split('|').map(part => part.split('&').map(t => t.trim()).filter(Boolean));
}

function questOfToken(t) {
  if (t[0] !== '?') return null;
  return t.slice(1).split(/[=<>!]/)[0];
}

function labelsOf(steps) {
  const labels = {};
  steps.forEach((st, i) => { if (typeof st === 'string' && st[0] === '#') labels[st.slice(1)] = i; });
  return labels;
}

function entryList(steps) {
  const labels = labelsOf(steps), out = [];
  for (const st of steps) {
    if (typeof st === 'string') { if (st[0] !== '#') break; continue; }
    if (st.if !== undefined && st.jump && labels[st.jump] !== undefined) out.push({ cond: st.if, at: labels[st.jump] });
  }
  return out;
}

function buildIndex(H) {
  const scripts = H.SCRIPTS;
  const triggers = new Map();
  const addTrigger = (name, t) => { if (!scripts[name]) return; if (!triggers.has(name)) triggers.set(name, []); triggers.get(name).push(t); };
  for (const [map, def] of Object.entries(H.MAPS)) {
    for (const [ch, mk] of Object.entries(def.marks || {})) {
      for (const key of ['script', 'shift', 'then', 'fail', 'once']) if (typeof mk[key] === 'string') addTrigger(mk[key], { map, ch, cond: mk.if || '', who: mk.who || null, name: mk.name || mk.hint || null, kind: mk.type || null });
    }
    for (const mt of [].concat(def.mate || [])) if (mt && typeof mt.script === 'string') addTrigger(mt.script, { map, ch: null, cond: mt.if || '', who: mt.who || null, name: null, kind: 'mate' });
    for (const oe of def.onEnter || []) addTrigger(oe.script, { map, ch: null, cond: [oe.if, oe.unless ? '!' + oe.unless : ''].filter(Boolean).join('&'), who: null, name: null, kind: 'enter' });
  }
  const callers = new Map();
  for (const [name, steps] of Object.entries(scripts)) {
    steps.forEach((st, i) => {
      if (!st || typeof st !== 'object') return;
      const target = st.script || (st.arg && typeof st.arg === 'object' && st.arg.then);
      if (typeof target === 'string' && scripts[target]) { if (!callers.has(target)) callers.set(target, []); callers.get(target).push({ name, at: i }); }
    });
  }
  return { scripts, triggers, callers };
}

function spanEnd(steps, at) {
  const entries = entryList(steps).map(e => e.at).filter(i => i > at);
  let end = Math.min(steps.length, ...entries);
  for (let i = at + 1; i < end; i++) if (steps[i] && typeof steps[i] === 'object' && steps[i].recap) { end = i; break; }
  return end;
}

function collectEffects(idx, name, from, to, seen, out) {
  const steps = idx.scripts[name];
  if (!steps) return out;
  for (let i = from; i < to; i++) {
    const st = steps[i];
    if (!st || typeof st !== 'object') continue;
    if (st.flag) out.flags.add(st.flag);
    if (st.quest) out.quests.add(st.quest);
    if (st.cine) out.cines.push(st.cine);
    if (st.battle) out.battles.push(st.battle);
    if (st.su) out.su = true;
    if (st.script && !seen.has(st.script) && idx.scripts[st.script] && !idx.scripts[st.script].some(x => x && x.recap)) {
      seen.add(st.script);
      collectEffects(idx, st.script, 0, idx.scripts[st.script].length, seen, out);
    }
  }
  return out;
}

function entryCondAt(steps, at) {
  const entries = entryList(steps);
  let best = null;
  for (const e of entries) if (e.at <= at && (!best || e.at > best.at)) best = e;
  if (best) return best.cond;
  return entries.map(e => alternatives(e.cond).length === 1 && alternatives(e.cond)[0].length === 1 ? negate(alternatives(e.cond)[0][0]) : '').filter(Boolean).join('&');
}

function negate(t) { return t[0] === '!' ? t.slice(1) : '!' + t; }

function activation(idx, name, at, depth = 0) {
  const steps = idx.scripts[name];
  const inner = entryCondAt(steps, at);
  const outs = [];
  const trig = idx.triggers.get(name) || [];
  for (const t of trig) outs.push({ cond: [t.cond, inner].filter(Boolean).join('&'), map: t.map, ch: t.ch, who: t.who, name: t.name, kind: t.kind, via: name });
  if (depth < 6) for (const c of idx.callers.get(name) || []) {
    if (c.name === name) continue;
    for (const a of activation(idx, c.name, c.at, depth + 1)) outs.push(Object.assign({}, a, { cond: [a.cond, inner].filter(Boolean).join('&') }));
  }
  if (!outs.length) outs.push({ cond: inner, map: null, ch: null, who: null, name: null, kind: null, via: name });
  return outs;
}

function analyze(H) {
  const idx = buildIndex(H);
  const beats = [];
  for (const [name, steps] of Object.entries(idx.scripts)) {
    steps.forEach((st, at) => {
      if (!st || typeof st !== 'object' || !st.recap) return;
      const end = spanEnd(steps, at);
      const eff = collectEffects(idx, name, at, end, new Set([name]), { flags: new Set(), quests: new Set(), cines: [], battles: [], su: false });
      const scriptEff = collectEffects(idx, name, 0, steps.length, new Set([name]), { flags: new Set(), quests: new Set(), cines: [], battles: [], su: false });
      const acts = activation(idx, name, at);
      const choiceLabels = new Set();
      for (let i = 0; i < at; i++) {
        const s = steps[i];
        if (s && typeof s === 'object' && (s.choice || s.menu)) for (const o of s.choice || s.menu) choiceLabels.add(o[1]);
      }
      beats.push({ id: st.recap, script: name, at, end, eff, scriptEff, acts, choiceLabels });
    });
  }
  return { idx, beats };
}

function missionTable(H) {
  const trail = H.TRAIL_MISSIONS.map((m, i) => ({ id: m.id, ch: m.ch, i, done: m.done, flags: tokens(m.done).filter(x => !x.neg).map(x => x.t) }));
  return trail;
}

function worldOfMap(H, map) {
  if (!map) return null;
  if (H.expressArea(map)) return 'express';
  for (const w of H.WORLDS) for (const gr of w.groups) for (const a of gr.areas) if (a.map === map) return w.id;
  const def = H.MAPS[map];
  if (def && def.world) return def.world;
  if (/^hs_/.test(map)) return 'herta';
  if (/^[ju]_/.test(map)) return 'jarilo';
  if (/^lf_/.test(map)) return 'luofu';
  return null;
}

function areaName(H, map) {
  const car = H.expressArea(map);
  if (car) return car.name;
  for (const w of H.WORLDS) for (const gr of w.groups) for (const a of gr.areas) if (a.map === map) return a.name;
  const def = H.MAPS[map];
  return def ? def.name.split(': ').pop() : map;
}

const FORCED = [
  [/^(serval_fixed|evn_next)$/, 'tb_night']
];

const OVERRIDES = [
  [/^opening$/, 'tb_chaos'],
  [/^kafka_/, 'tb_chaos'],
  [/^(doom_start|rb_console)$/, 'tb_shadows'],
  [/^herta_scene$/, 'tb_shadows'],
  [/^sec_/, 'rm_star'],
  [/^(plains_sampo|plains_gate|belobog_intro)$/, 'tb_travelers'],
  [/^(fort_audience|gepard_fort|serval_outside)$/, 'tb_night'],
  [/^bp_magflow$/, 'tb_run'],
  [/^blade_[12]$/, 'tb_rule8'],
  [/^mine_cartblock$/, 'tb_abyss'],
  [/^riv_/, 'tb_avalanche'],
  [/^(rot_clara|rot_believe|rot_fixed|st_eric|st_eric_more|svarog_talk)$/, 'tb_rot'],
  [/^ret_door$/, 'tb_purge'],
  [/^rz_dunn_after$/, 'tb_ranks'],
  [/^rz_/, 'tb_idol'],
  [/^dawn_/, 'tb_past'],
  [/^ret_(mem\d|will)$/, 'tb_return'],
  [/^(time_seele|gal_in)$/, 'tb_galaxy'],
  [/^fm_(topaz|m1|m2|dh|hm)$/, 'tb_fm0'],
  [/^lf_dh3_/, 'lf_dh3'],
  [/^lf_al_/, 'lf_q10'],
  [/^lf_sc_/, 'lf_q11'],
  [/^lf_fn_/, 'lf_q12'],
  [/^lf_d_(qq|ting|jy|path)$/, 'lf_q8'],
  [/^lf_m_(jy|aurumaton|march|qq|welt)$/, 'lf_q7'],
  [/^lf_s_(march|welt|arbor)$/, 'lf_q6'],
  [/^lf_cl_(door|soldier1|walk1|walk2|panel)$/, 'lf_q2']
];

function family(name) {
  const parts = name.split('_');
  return /^(lf|fm|ks|ax|hs|st|sec|rm|pc)$/.test(parts[0]) && parts.length > 2 ? parts[0] + '_' + parts[1] : parts[0];
}

function segments(steps) {
  const starts = [0].concat(entryList(steps).map(e => e.at)).filter((v, i, arr) => arr.indexOf(v) === i).sort((x, y) => x - y);
  return starts.map((from, i) => ({ from, to: i + 1 < starts.length ? starts[i + 1] : steps.length }));
}

function attribute(H) {
  const { idx, beats } = analyze(H);
  const trail = missionTable(H);
  const doneOf = new Map();
  for (const m of trail) for (const f of m.flags) if (!doneOf.has(f)) doneOf.set(f, m.i);
  const questIds = new Set(Object.keys(H.QUESTS).filter(q => H.QUESTS[q].ch));
  const units = [];
  for (const [name, steps] of Object.entries(idx.scripts)) {
    for (const seg of segments(steps)) {
      const eff = collectEffects(idx, name, seg.from, seg.to, new Set([name]), { flags: new Set(), quests: new Set(), cines: [], battles: [], su: false });
      const obj = steps.slice(seg.from, seg.to).some(s => s && typeof s === 'object' && s.obj);
      units.push({ name, from: seg.from, to: seg.to, eff, obj, acts: activation(idx, name, seg.from) });
    }
  }
  const flagPhase = new Map(doneOf);
  const bound = acts => {
    let lo = -1, hi = Infinity, any = false;
    for (const a of acts) {
      let alo = -1, ahi = Infinity;
      for (const t of tokens(a.cond)) {
        if (t.t[0] === '?' || t.t[0] === '$') continue;
        if (!flagPhase.has(t.t)) continue;
        const p = flagPhase.get(t.t), isDone = doneOf.has(t.t);
        if (t.neg) ahi = Math.min(ahi, p);
        else alo = Math.max(alo, isDone ? p + 1 : p);
      }
      if (alo >= 0 && (lo < 0 || alo < lo)) lo = alo;
      if (!any || ahi > hi) hi = ahi;
      any = true;
    }
    return { lo, hi };
  };
  const unitMission = u => {
    const done = [...u.eff.flags].filter(f => doneOf.has(f)).map(f => doneOf.get(f));
    if (done.length) return Math.min(...done);
    const { lo, hi } = bound(u.acts);
    if (hi !== Infinity) return lo >= 0 ? Math.min(Math.max(lo, 0), hi) : hi;
    if (lo >= 0 && (u.obj || [...u.eff.flags].some(f => needed.has(f) || (flagPhase.has(f) && flagPhase.get(f) >= lo)))) return lo;
    return -1;
  };
  const needed = new Set();
  for (let pass = 0; pass < 30; pass++) {
    let changed = false;
    for (const u of units) {
      const m = unitMission(u);
      if (m < 0) continue;
      for (const a of u.acts) for (const t of tokens(a.cond)) if (!t.neg && t.t[0] !== '?' && t.t[0] !== '$' && !doneOf.has(t.t) && !needed.has(t.t)) { needed.add(t.t); changed = true; }
      for (const f of u.eff.flags) if (!doneOf.has(f) && (!flagPhase.has(f) || flagPhase.get(f) > m)) { flagPhase.set(f, m); changed = true; }
    }
    if (!changed) break;
  }
  const result = new Map();
  for (const b of beats) {
    const q = [...b.eff.quests].find(x => questIds.has(x));
    if (q) { result.set(b.id, { node: q, how: 'quest' }); continue; }
    const qTok = b.acts.flatMap(a => tokens(a.cond)).filter(x => !x.neg).map(x => questOfToken(x.t)).find(x => x && questIds.has(x) && b.acts.every(a => alternatives(a.cond).every(alt => alt.some(t => questOfToken(t) === x))));
    if (qTok) { result.set(b.id, { node: qTok, how: 'questCond' }); continue; }
    const sq = [...b.scriptEff.quests].find(x => questIds.has(x));
    if (sq) { result.set(b.id, { node: sq, how: 'questScript' }); continue; }
    const u = { eff: b.eff, obj: H.SCRIPTS[b.script].slice(b.at, b.end).some(s => s && typeof s === 'object' && s.obj), acts: b.acts };
    const m = unitMission(u);
    if (m >= 0 && m < trail.length) { result.set(b.id, { node: trail[m].id, how: 'phase' }); continue; }
    result.set(b.id, { node: null, how: 'meet' });
  }
  const owner = new Map();
  for (const b of beats) { const r = result.get(b.id); if (r.node) for (const f of b.eff.flags) if (!owner.has(f)) owner.set(f, { node: r.node, fam: family(b.script) }); }
  for (const u of units) { const m = unitMission(u); if (m >= 0 && m < trail.length) for (const f of u.eff.flags) if (!owner.has(f)) owner.set(f, { node: trail[m].id, fam: family(u.name) }); }
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (const b of beats) {
      if (result.get(b.id).node) continue;
      const fam = family(b.script);
      const hit = b.acts.flatMap(a => tokens(a.cond)).find(t => !t.neg && !doneOf.has(t.t) && owner.has(t.t) && owner.get(t.t).fam === fam);
      if (!hit) continue;
      const node = owner.get(hit.t).node;
      result.set(b.id, { node, how: 'family' });
      for (const f of b.eff.flags) if (!owner.has(f)) owner.set(f, { node, fam });
      changed = true;
    }
    if (!changed) break;
  }
  for (const b of beats) {
    const o = OVERRIDES.find(([re]) => re.test(b.script));
    if (o && !result.get(b.id).node) result.set(b.id, { node: o[1], how: 'manual' });
    const f = FORCED.find(([re]) => re.test(b.script));
    if (f) result.set(b.id, { node: f[1], how: 'manual' });
  }
  return { idx, beats, trail, result, flagPhase, doneOf, bound, owner };
}

function build(H) {
  const { beats, result, trail, doneOf, owner } = attribute(H);
  const worlds = H.ATLAS_WORLDS;
  const worldOfCh = ch => (worlds.find(w => w.chapters.includes(ch)) || {}).id || null;
  const defOf = id => H.TRAIL_MISSIONS.find(m => m.id === id) ? { type: 'trail', ch: H.TRAIL_MISSIONS.find(m => m.id === id).ch } : { type: H.QUESTS[id].type || 'comp', ch: H.QUESTS[id].ch };
  const missionIds = [];
  for (const w of worlds) for (const ch of w.chapters) {
    for (const m of H.TRAIL_MISSIONS) if (m.ch === ch) missionIds.push(m.id);
    for (const [id, q] of Object.entries(H.QUESTS)) if (q.ch === ch) missionIds.push(id);
  }
  const trailOrder = id => missionIds.indexOf(id);
  const scriptOrder = new Map(Object.keys(H.SCRIPTS).map((n, i) => [n, i]));
  const byBeat = new Map(beats.map(b => [b.id, b]));
  const declOrder = list => list.slice().sort((a, b) => scriptOrder.get(byBeat.get(a).script) - scriptOrder.get(byBeat.get(b).script) || byBeat.get(a).at - byBeat.get(b).at);
  const sortBeats = list => {
    const base = declOrder(list), alts = new Map();
    for (const id of base) {
      const b = byBeat.get(id), sets = [];
      for (const a of b.acts) for (const alt of alternatives(a.cond)) {
        const deps = new Set();
        for (const t of alt) if (t[0] !== '!') for (const o of base) if (o !== id && byBeat.get(o).eff.flags.has(t)) deps.add(o);
        sets.push(deps);
      }
      alts.set(id, sets.length ? sets : [new Set()]);
    }
    const out = [], done = new Set();
    while (out.length < base.length) {
      const ready = id => !done.has(id) && alts.get(id).some(d => [...d].every(x => done.has(x)));
      const next = base.find(ready) || base.find(id => !done.has(id));
      done.add(next);
      out.push(next);
    }
    return out;
  };
  const anchorOf = (b, world) => {
    let best = null;
    const consider = id => { if (!id || defOf(id).type !== 'trail' || worldOfCh(defOf(id).ch) !== world) return; if (best === null || trailOrder(id) > trailOrder(best)) best = id; };
    for (const a of b.acts) for (const t of tokens(a.cond)) {
      if (t.neg) continue;
      if (t.t[0] === '?') { const q = t.t.slice(1).split(/[=<>!]/)[0]; if (H.QUESTS[q]) consider(q); continue; }
      if (doneOf.has(t.t)) consider(trail[doneOf.get(t.t)].id);
      else if (owner.has(t.t)) consider(owner.get(t.t).node);
    }
    return best;
  };
  const earliest = (list, world) => {
    let best = null;
    for (const id of list) { const a = anchorOf(byBeat.get(id), world); if (a && (best === null || trailOrder(a) < trailOrder(best))) best = a; }
    return best;
  };
  const NODES = {};
  for (const id of missionIds) {
    const list = sortBeats(beats.filter(b => result.get(b.id).node === id).map(b => b.id));
    const d = defOf(id), world = worldOfCh(d.ch);
    const after = d.type === 'trail' ? null : earliest(list, world);
    const cine = list.map(x => byBeat.get(x).eff.cines[0]).find(Boolean);
    NODES[id] = { after, beats: list, thumb: cine ? { cine } : null };
  }
  const MEETS = {};
  for (const b of beats) {
    if (result.get(b.id).node) continue;
    const act = b.acts.find(a => a.map) || b.acts[0];
    const map = act.map, world = worldOfMap(H, map);
    if (!worlds.some(w => w.id === world)) throw new Error('meeting without atlas world: ' + b.id + ' ' + map);
    const id = 'meet_' + map;
    if (!MEETS[id]) MEETS[id] = { world, map, after: null, beats: [] };
    MEETS[id].beats.push(b.id);
  }
  for (const m of Object.values(MEETS)) { m.beats = sortBeats(m.beats); m.after = earliest(m.beats, m.world); }
  const BRANCH = {};
  const spanOwner = (script, i) => beats.find(x => x.script === script && x.at <= i && i < x.end);
  for (const b of beats) {
    const steps = H.SCRIPTS[b.script];
    let label = null;
    for (let i = b.at; i >= 0; i--) { const st = steps[i]; if (typeof st === 'string' && st[0] === '#') { label = st.slice(1); break; } if (st && typeof st === 'object' && st.recap && i !== b.at) break; }
    if (!label) continue;
    for (let i = 0; i < b.at; i++) {
      const st = steps[i];
      if (!st || typeof st !== 'object' || !(st.choice || st.menu)) continue;
      const opts = st.choice || st.menu;
      if (!opts.some(o => o[1] === label)) continue;
      const labels = labelsOf(steps);
      if (opts.every(o => labels[o[1]] === undefined || reaches(steps, labels, labels[o[1]], b.at))) continue;
      const from = spanOwner(b.script, i);
      if (from && from !== b && result.get(from.id).node === result.get(b.id).node) BRANCH[b.id] = from.id;
    }
  }
  const PLACE = {};
  for (const b of beats) { const a = b.acts.find(x => x.map); if (a) PLACE[b.id] = [a.map, a.ch]; }
  const TEXT = beats.filter(b => b.eff.su).map(b => b.id).sort();
  return { NODES, MEETS, BRANCH, PLACE, TEXT, result };
}

function reaches(steps, labels, from, target) {
  const seen = new Set(), stack = [from];
  while (stack.length) {
    let i = stack.pop();
    while (i < steps.length && !seen.has(i)) {
      seen.add(i);
      if (i === target) return true;
      const st = steps[i];
      if (st && typeof st === 'object') {
        if (st.end) break;
        const opts = st.choice || st.menu;
        if (opts) { for (const o of opts.concat(st.exit ? [st.exit] : [])) if (labels[o[1]] !== undefined) stack.push(labels[o[1]]); break; }
        if (st.rnd) { for (const l of st.rnd) if (labels[l] !== undefined) stack.push(labels[l]); break; }
        if (st.jump && labels[st.jump] !== undefined) {
          if (st.if === undefined && st.suIf === undefined && !st.party) { i = labels[st.jump]; continue; }
          stack.push(labels[st.jump]);
        }
      }
      i++;
    }
  }
  return false;
}

function render(data) {
  const q = v => JSON.stringify(v);
  const lines = ['(function (H) {', "  'use strict';", '  H.ATLAS = {', '    NODES: {'];
  const nodes = Object.entries(data.NODES);
  nodes.forEach(([id, n], i) => {
    lines.push('      ' + id + ': {');
    lines.push('        after: ' + q(n.after) + ',');
    lines.push('        thumb: ' + (n.thumb ? '{ cine: ' + q(n.thumb.cine) + ' }' : 'null') + ',');
    lines.push('        beats: [' + n.beats.map(q).join(', ') + ']');
    lines.push('      }' + (i < nodes.length - 1 ? ',' : ''));
  });
  lines.push('    },', '    MEETS: {');
  const meets = Object.entries(data.MEETS);
  meets.forEach(([id, m], i) => {
    lines.push('      ' + id + ': {');
    lines.push('        world: ' + q(m.world) + ', map: ' + q(m.map) + ', after: ' + q(m.after) + ',');
    lines.push('        beats: [' + m.beats.map(q).join(', ') + ']');
    lines.push('      }' + (i < meets.length - 1 ? ',' : ''));
  });
  lines.push('    },', '    BRANCH: {');
  const br = Object.entries(data.BRANCH);
  br.forEach(([k, v], i) => lines.push('      ' + q(k) + ': ' + q(v) + (i < br.length - 1 ? ',' : '')));
  lines.push('    },', '    PLACE: {');
  const pl = Object.entries(data.PLACE);
  pl.forEach(([k, v], i) => lines.push('      ' + q(k) + ': ' + q(v) + (i < pl.length - 1 ? ',' : '')));
  lines.push('    },', '    TEXT: [' + data.TEXT.map(q).join(', ') + ']', '  };');
  lines.push("  if (typeof module !== 'undefined') module.exports = H;", '})(globalThis.Hsr98 = globalThis.Hsr98 || {});', '');
  return lines.join('\n');
}

const OUT = path.join(DIR, 'hsr-atlas-data.js');

module.exports = { loadGame, analyze, attribute, build, render, worldOfMap, areaName, tokens };

if (require.main === module) {
  const H = loadGame();
  const data = build(H);
  const text = render(data);
  const how = {};
  for (const r of data.result.values()) how[r.how] = (how[r.how] || 0) + 1;
  const meetBeats = Object.values(data.MEETS).reduce((n, m) => n + m.beats.length, 0);
  console.log('beats ' + data.result.size + ', in missions ' + (data.result.size - meetBeats) + ', in meetings ' + meetBeats);
  console.log('by rule: ' + Object.entries(how).map(([k, v]) => k + ' ' + v).join(', '));
  console.log('mission nodes ' + Object.keys(data.NODES).length + ', empty: ' + (Object.entries(data.NODES).filter(([, n]) => !n.beats.length).map(([id]) => id).join(' ') || 'none'));
  console.log('meeting nodes ' + Object.keys(data.MEETS).length + ', single-beat: ' + Object.values(data.MEETS).filter(m => m.beats.length === 1).length);
  console.log('branches ' + Object.keys(data.BRANCH).length + ', text-only ' + data.TEXT.length + ', places ' + Object.keys(data.PLACE).length);
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
    if (cur !== text) { console.log('hsr-atlas-data.js is stale: run node tools/hsr-atlas-map.cjs'); process.exit(1); }
    console.log('hsr-atlas-data.js is up to date');
  } else {
    fs.writeFileSync(OUT, text);
    console.log('wrote ' + path.relative(ROOT, OUT));
  }
}
