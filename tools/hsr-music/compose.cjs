const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const PPQ = 480, STEP = PPQ / 4;
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const DRUMS = { boom: 35, kick: 36, rim: 37, snare: 38, clap: 39, snare2: 40, tom6: 41, hat: 42, tom5: 43, pedal: 44, tom4: 45, open: 46, tom3: 47, tom2: 48, crash: 49, tom1: 50, ride: 51, china: 52, tamb: 54, splash: 55, crash2: 57, shaker: 70 };
const HIT = { x: 0, X: 18, o: -30 };
const ROLES = { full: ['3', '7', '6', '9', '5', 'r', '13', '11'], triad: ['r', '3', '5', '9', '11', '13'] };

const fail = msg => { throw new Error(msg); };

function random(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pitchClass(name) {
  let pc = PC[name[0]];
  for (const c of name.slice(1)) pc += c === '#' ? 1 : -1;
  return ((pc % 12) + 12) % 12;
}

function pitch(name) {
  const m = /^([A-G][#b]*)(-?\d)$/.exec(name) || fail('bad note ' + name);
  let pc = PC[m[1][0]];
  for (const c of m[1].slice(1)) pc += c === '#' ? 1 : -1;
  return (+m[2] + 1) * 12 + pc;
}

function chord(sym) {
  const m = /^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/.exec(sym) || fail('bad chord ' + sym);
  const root = pitchClass(m[1]), bass = m[3] ? pitchClass(m[3]) : root, q = m[2], tones = { r: 0 };
  if (q === '5') return { sym, root, bass, tones: { r: 0, 5: 7 } };
  const p = /^(m(?!aj)|dim|aug)?(maj7|maj9|maj13|7|9|11|13|6)?(sus2|sus4|sus)?((?:add9|add11|b5|#5|b9|#9|#11|b13)*)$/.exec(q) || fail('bad chord ' + sym);
  const [, kind, ext = '', sus, alt] = p;
  tones['3'] = sus === 'sus2' ? 2 : sus ? 5 : kind === 'm' || kind === 'dim' ? 3 : 4;
  tones['5'] = kind === 'dim' || alt.includes('b5') ? 6 : kind === 'aug' || alt.includes('#5') ? 8 : 7;
  if (ext === '6') tones['6'] = 9;
  else if (ext) tones['7'] = ext.startsWith('maj') ? 11 : kind === 'dim' ? 9 : 10;
  if (/^(maj)?(9|11|13)$/.test(ext) || alt.includes('add9')) tones['9'] = 14;
  if (alt.includes('b9')) tones['9'] = 13;
  if (alt.includes('#9')) tones['9'] = 15;
  if (ext === '11' || alt.includes('add11')) tones['11'] = 17;
  if (alt.includes('#11')) tones['11'] = 18;
  if (ext.endsWith('13')) tones['13'] = 21;
  if (alt.includes('b13')) tones['13'] = 20;
  return { sym, root, bass, tones };
}

function voicing(c, n, center, prev) {
  const order = (c.tones['7'] !== undefined || c.tones['6'] !== undefined ? ROLES.full : ROLES.triad).filter(r => c.tones[r] !== undefined);
  const pcs = [];
  for (let i = 0; i < n; i++) pcs.push((c.root + c.tones[order[i % order.length]]) % 12);
  pcs.sort((a, b) => a - b);
  let best = null;
  for (let k = 0; k < n; k++) {
    const rot = pcs.slice(k).concat(pcs.slice(0, k)), notes = [];
    let p = center - 12;
    for (const pc of rot) {
      while (((p % 12) + 12) % 12 !== pc || (notes.length && p <= notes[notes.length - 1])) p++;
      notes.push(p);
    }
    for (const shift of [-12, 0, 12]) {
      const v = notes.map(x => x + shift), mean = v.reduce((s, x) => s + x, 0) / n;
      const lead = prev && prev.length === n ? v.reduce((s, x, i) => s + Math.abs(x - prev[i]), 0) : 0;
      const cost = lead + Math.abs(mean - center) * (prev ? 0.5 : 1);
      if (!best || cost < best.cost) best = { v, cost };
    }
  }
  return best.v;
}

function barList(text) {
  return String(text).split('|').map(s => s.trim());
}

function timeline(sec, barSteps) {
  const list = barList(sec.chords || fail('section without chords')), out = [];
  for (let b = 0; b < sec.bars; b++) {
    const toks = list[b % list.length].split(/\s+/).filter(Boolean);
    const lens = toks.map(t => (/:(\d+)$/.exec(t) || [])[1]), used = lens.reduce((s, l) => s + (l ? +l : 0), 0);
    const free = lens.filter(l => !l).length, each = free ? (barSteps - used) / free : 0;
    if (!Number.isInteger(each)) fail('chord bar ' + (b + 1) + ' does not split evenly');
    let at = b * barSteps;
    toks.forEach((t, i) => {
      const len = lens[i] ? +lens[i] : each, sym = t.replace(/:\d+$/, '');
      out.push({ at, len, c: sym === '%' ? out[out.length - 1].c : chord(sym) });
      at += len;
    });
    if (at !== (b + 1) * barSteps) fail('chord bar ' + (b + 1) + ' has ' + (at - b * barSteps) + ' steps');
  }
  return out;
}

function chordAt(tl, step) {
  for (let i = tl.length - 1; i >= 0; i--) if (tl[i].at <= step) return tl[i];
  return tl[0];
}

function hits(rhythm, steps) {
  const r = String(rhythm).replace(/[|\s]/g, ''), out = [];
  for (let s = 0; s < steps; s++) {
    const ch = r[s % r.length];
    if (ch === '-') { if (out.length) out[out.length - 1].len++; continue; }
    if (HIT[ch] !== undefined) out.push({ s, len: 1, acc: HIT[ch] });
    else if (ch !== '.') fail('bad rhythm char ' + ch);
  }
  return out;
}

function literal(spec, sec, barSteps, start, part, where) {
  const line = typeof spec === 'string' ? spec : spec.line, shift = spec.shift || 0, base = spec.vel || part.vel;
  const list = barList(line);
  let last = null;
  for (let b = 0; b < sec.bars; b++) {
    let at = 0;
    for (const tok of list[b % list.length].split(/\s+/).filter(Boolean)) {
      const m = /^(\[[^\]]+\]|[A-G][#b]*-?\d|\.|_)(?::(\d+))?([!?]*)$/.exec(tok) || fail(where + ': bad token ' + tok);
      const len = m[2] ? +m[2] : 2, step = start + b * barSteps + at;
      if (m[1] === '_') { if (last) last.forEach(n => { n.len += len; }); }
      else if (m[1] === '.') last = null;
      else {
        const keys = m[1].startsWith('[') ? m[1].slice(1, -1).trim().split(/\s+/).map(pitch) : [pitch(m[1])];
        const vel = base + (m[3].includes('!') ? 16 : 0) - (m[3].includes('?') ? 22 : 0);
        last = keys.map(k => ({ step, len, key: k + shift, vel }));
        part.notes.push(...last);
      }
      at += len;
    }
    if (at !== barSteps) fail(where + ': bar ' + (b + 1) + ' has ' + at + ' steps');
  }
}

function pattern(p, sec, tl, barSteps, start, part, where) {
  const steps = sec.bars * barSteps, base = p.vel || part.vel, n = p.voices || 3;
  if (p.type === 'pad') {
    let prev = null;
    for (const seg of tl) {
      prev = voicing(seg.c, n, p.center || 60, prev);
      prev.forEach(key => part.notes.push({ step: start + seg.at, len: seg.len, key, vel: base, legato: true }));
    }
    return;
  }
  const hs = hits(p.rhythm || fail(where + ': pattern without rhythm'), steps);
  let prev = null, idx = 0, segAt = -1, inSeg = 0;
  hs.forEach((h, i) => {
    const seg = chordAt(tl, h.s), next = hs[i + 1] ? hs[i + 1].s : steps;
    const len = p.len || (p.legato ? next - h.s : h.len), vel = base + h.acc;
    if (seg.at !== segAt) { segAt = seg.at; inSeg = 0; }
    if (p.type === 'chord') {
      prev = voicing(seg.c, n, p.center || 60, prev);
      prev.forEach(key => part.notes.push({ step: start + h.s, len, key, vel }));
    } else if (p.type === 'arp') {
      prev = voicing(seg.c, n, p.center || 72, prev);
      const tones = [];
      for (let o = 0; o < (p.octaves || 1); o++) prev.forEach(k => tones.push(k + 12 * o));
      const order = p.order || 'up', m = tones.length;
      let j = idx % m;
      if (Array.isArray(order)) j = order[idx % order.length] % m;
      else if (order === 'down') j = m - 1 - (idx % m);
      else if (order === 'updown') { const c = Math.max(1, 2 * m - 2), q = idx % c; j = q < m ? q : c - q; }
      part.notes.push({ step: start + h.s, len, key: tones[j], vel });
      idx++;
    } else if (p.type === 'bass') {
      const seq = String(p.seq || '1').split(/\s+/), tok = seq[inSeg % seq.length], low = p.low || 36;
      const place = pc => low + (((pc - low) % 12) + 12) % 12, c = seg.c, rootKey = place(c.root), bassKey = place(c.bass);
      const key = tok === '1' ? bassKey : tok === '8' ? bassKey + 12 : tok === 'r' ? rootKey : rootKey + (c.tones[tok] !== undefined ? c.tones[tok] : tok === '7' ? 10 : 7);
      if (tok !== '.') part.notes.push({ step: start + h.s, len, key, vel });
      inSeg++;
    } else fail(where + ': bad pattern ' + p.type);
  });
}

function drums(spec, sec, barSteps, start, part, where) {
  const steps = sec.bars * barSteps, fill = spec.fill || {}, once = spec.once || {}, lastBar = steps - barSteps;
  const add = (name, list, offset) => {
    const key = DRUMS[name] || fail(where + ': bad drum ' + name);
    list.forEach(h => part.notes.push({ step: start + offset + h.s, len: 1, key, vel: part.vel + h.acc }));
  };
  for (const [name, rhythm] of Object.entries(spec)) {
    if (name === 'fill' || name === 'once') continue;
    add(name, hits(rhythm, steps).filter(h => (fill[name] === undefined || h.s < lastBar) && (once[name] === undefined || h.s >= barSteps)), 0);
  }
  for (const [name, rhythm] of Object.entries(once)) add(name, hits(rhythm, barSteps), 0);
  for (const [name, rhythm] of Object.entries(fill)) add(name, hits(rhythm, barSteps), lastBar);
}

function vlq(n) {
  const out = [n & 127];
  while ((n = Math.floor(n / 128))) out.unshift((n & 127) | 128);
  return out;
}

function u32(n) { return Buffer.from([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]); }

function trackChunk(events) {
  events.sort((a, b) => a.tick - b.tick || a.ord - b.ord);
  const bytes = [];
  let last = 0;
  for (const e of events) {
    for (const b of vlq(e.tick - last)) bytes.push(b);
    for (const b of e.data) bytes.push(b);
    last = e.tick;
  }
  bytes.push(0, 0xff, 0x2f, 0);
  return Buffer.concat([Buffer.from('MTrk'), u32(bytes.length), Buffer.from(bytes)]);
}

function meta(tick, type, data) { return { tick, ord: 0, data: [0xff, type, ...vlq(data.length), ...data] }; }

function compose(score) {
  const [num, den] = score.time || [4, 4], barSteps = num * 16 / den, swing = Math.round((score.swing || 0) * STEP);
  const rnd = random(score.seed || 1), jitter = score.jitter === undefined ? 5 : score.jitter;
  const tick = s => s * STEP + (s % 2 ? swing : 0);
  const parts = Object.entries(score.parts).map(([name, p]) => Object.assign({ name, vel: 92, vol: 100, pan: 64, rev: 40, gate: 0.92 }, p, { notes: [], cc: [] }));
  const starts = [];
  let step = 0;
  for (const id of score.form) {
    const sec = score.sections[id] || fail('no section ' + id);
    starts.push(step);
    const tl = sec.chords ? timeline(sec, barSteps) : null;
    for (const part of parts) {
      const e = (sec.expr || {})[part.name], from = Array.isArray(e) ? e[0] : e === undefined ? 127 : e, to = Array.isArray(e) ? e[1] : from;
      const beats = sec.bars * barSteps / 4;
      for (let b = 0; b < (from === to ? 1 : beats); b++) part.cc.push({ step: step + b * 4, n: 11, v: Math.round(from + (to - from) * b / Math.max(1, beats - 1)) });
      const spec = sec[part.name];
      if (spec === undefined) continue;
      const where = id + '/' + part.name;
      for (const one of Array.isArray(spec) ? spec : [spec]) {
        if (part.drums) drums(one, sec, barSteps, step, part, where);
        else if (typeof one === 'string' || one.line !== undefined) literal(one, sec, barSteps, step, part, where);
        else pattern(one, sec, tl || fail(where + ': patterns need chords'), barSteps, step, part, where);
      }
    }
    step += sec.bars * barSteps;
  }
  starts.push(step);
  const [ls, le] = score.loop || [0, score.form.length];
  const loopStart = tick(starts[ls]), loopEnd = tick(starts[le]);
  const head = [meta(0, 0x03, [...Buffer.from(score.name || 'HSR 98', 'utf8')])];
  const us = Math.round(60e6 / score.bpm);
  head.push(meta(0, 0x51, [(us >> 16) & 255, (us >> 8) & 255, us & 255]), meta(0, 0x58, [num, Math.log2(den), 24, 8]));
  head.push(meta(loopStart, 0x06, [...Buffer.from('loopStart')]), meta(loopEnd, 0x06, [...Buffer.from('loopEnd')]));
  const chunks = [trackChunk(head)], stats = {};
  for (const part of parts) {
    const ch = part.drums ? 9 : part.ch, ev = [meta(0, 0x03, [...Buffer.from(part.name)])];
    if (!part.drums) ev.push({ tick: 0, ord: 1, data: [0xc0 | ch, part.prog] });
    ev.push({ tick: 0, ord: 1, data: [0xb0 | ch, 7, part.vol] }, { tick: 0, ord: 1, data: [0xb0 | ch, 10, part.pan] }, { tick: 0, ord: 1, data: [0xb0 | ch, 91, part.rev] });
    if (part.bright !== undefined) ev.push({ tick: 0, ord: 1, data: [0xb0 | ch, 74, part.bright] });
    for (const c of part.cc) ev.push({ tick: tick(c.step), ord: 1, data: [0xb0 | ch, c.n, Math.max(0, Math.min(127, c.v))] });
    for (const n of part.notes) {
      const on = tick(n.step), full = tick(n.step + n.len) - on;
      const off = Math.min(loopEnd, on + Math.max(1, Math.round(full * (n.legato || part.drums ? (part.drums ? 0.5 : 1) : part.gate))));
      const vel = Math.max(1, Math.min(127, Math.round(n.vel + (rnd() * 2 - 1) * jitter)));
      if (n.key < 0 || n.key > 127) fail(part.name + ': key ' + n.key + ' out of range');
      ev.push({ tick: on, ord: 3, data: [0x90 | ch, n.key, vel] }, { tick: off, ord: 2, data: [0x80 | ch, n.key, 0] });
    }
    stats[part.name] = part.notes.length;
    chunks.push(trackChunk(ev));
  }
  const header = Buffer.concat([Buffer.from('MThd'), u32(6), Buffer.from([0, 1, (chunks.length >> 8) & 255, chunks.length & 255, PPQ >> 8, PPQ & 255])]);
  const sec = t => t / PPQ * 60 / score.bpm;
  return { bytes: Buffer.concat([header, ...chunks]), info: { length: +sec(tick(step)).toFixed(2), loop: [+sec(loopStart).toFixed(2), +sec(loopEnd).toFixed(2)], notes: stats } };
}

if (require.main === module) {
  const file = process.argv[2] || fail('usage: node tools/hsr-music/compose.cjs <score.json> [out.mid]');
  const score = JSON.parse(fs.readFileSync(file, 'utf8'));
  const out = process.argv[3] || path.join(ROOT, score.out || fail('score has no out'));
  const { bytes, info } = compose(score);
  fs.writeFileSync(out, bytes);
  console.log(path.relative(ROOT, out), JSON.stringify(info));
}

module.exports = { compose, chord, voicing, pitch };
