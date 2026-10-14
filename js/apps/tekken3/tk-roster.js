(function (T) {
  'use strict';
  const { mv, chain, nx } = T;

  const ROSTER = [];
  const BY_ID = {};

  function add(def) {
    def.costumes = def.costumes || [{}];
    ROSTER.push(def);
    BY_ID[def.id] = def;
    return def;
  }

  function lookFor(def, costume) {
    const c = def.costumes[costume || 0] || {};
    return Object.assign({}, def.look, c);
  }

  function tenHit(def, spec) {
    const seq = spec.seq.split(',');
    const lv = spec.lv.split('');
    const out = [];
    const ids = ['1', '1,2'];
    for (let i = 2; i < seq.length; i++) ids.push('ten' + i);
    const base = def.moves.find(m => m.id === '1,2') || T.UNIVERSAL.find(m => m.id === '1,2');
    const second = Object.assign({}, base, { nx: [nx(seq[2], ids[2], [3, 18], 13)] });
    if (base.nx) second.nx = base.nx.concat(second.nx);
    out.push(second);
    for (let i = 2; i < seq.length; i++) {
      const last = i === seq.length - 1;
      const b = seq[i];
      const l = lv[i] || 'm';
      const d = spec.dmg[i];
      const anim = spec.anims && spec.anims[i] ? spec.anims[i] : tenAnim(b, l, i);
      const o = { a: anim || undefined, r: l === 'l' ? 1.0 : 0.95, w: 0.3 };
      if (!last) o.nx = [nx(seq[i + 1], ids[i + 1], [3, 18], 13)];
      out.push(chain(ids[i], 'Десять ударов ' + (i + 1), l, d, i === seq.length - 1 ? 13 : 10, 2, last ? 24 : 15, last ? -14 : -2, last ? (spec.end || 'K') : 7, o));
    }
    def.tenHit = seq.join(',');
    def.moves = def.moves.filter(m => m.id !== '1,2').concat(out);
    return def;
  }

  function tenAnim(b, l, i) {
    const alt = i % 2;
    if (b === '1') return l === 'l' ? 'lowp:l' : l === 'm' ? 'body:l' : 'jab';
    if (b === '2') return l === 'l' ? 'lowp:r' : l === 'm' ? (alt ? 'body:r' : 'upper:r') : 'cross';
    if (b === '3') return l === 'l' ? 'lowk:l' : l === 'h' ? 'round:l' : 'front:l';
    if (b === '4') return l === 'l' ? 'lowk:r' : l === 'h' ? 'round:r' : (alt ? 'side:r' : 'front:r');
    if (b === '1+2') return 'palm';
    return 'cross';
  }

  function order() { return ROSTER.slice().sort((a, b) => (a.slot || 0) - (b.slot || 0)); }

  function mimicPool() { return ROSTER.filter(d => !d.mimic && !d.boss && !d.noMimic); }

  Object.assign(T, { ROSTER, FIGHTER: BY_ID, addFighter: add, lookFor, tenHit, rosterOrder: order, mimicPool });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
