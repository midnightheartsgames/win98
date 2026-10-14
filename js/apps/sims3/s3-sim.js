(function (S) {
  'use strict';
  const { NEEDS, NEED_KEYS, MOODLETS, SKILL_XP, SKILLS, TRAITS, TRAIT_KEYS, AGE_INFO, clamp, ageIdx, LTW, ZODIAC, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, SKIN_TONES, COLORS, MUSIC, FOODS } = S;

  const TOP_BY_AGE = { m: ['tshirt', 'shirt', 'sweater', 'tank'], f: ['tshirt', 'blouse', 'sweater', 'dress', 'tank'] };
  const BOTTOM_BY = { m: ['pants', 'jeans', 'shorts'], f: ['pants', 'jeans', 'skirt', 'shorts'] };
  const CLOTH = ['#c83a3a', '#3a6ab8', '#4a8a4a', '#e8c832', '#6a4a8a', '#f0f0ec', '#2a2a30', '#c87a3a', '#e89ab8', '#2a8a8a', '#8a3a5a', '#5a7a9a', '#b8a078', '#e8e0d0', '#4a5a34', '#8ac8e8'];
  const PANTS = ['#2c3a5a', '#3a3a40', '#6a5a44', '#b8a888', '#2a2a2a', '#4a5a7a', '#6a3a2a', '#e8e0d0'];

  function makeOutfit(rng, gender, kind, age) {
    const g = gender === 'f' ? 'f' : 'm';
    const c = () => rng.pick(CLOTH);
    const p = () => rng.pick(PANTS);
    if (kind === 'sleep') {
      const col = rng.pick(['#8ab8e8', '#e8a8c8', '#e8e0d0', '#a8c8a0', '#c8b8e8']);
      if (g === 'f' && rng.chance(0.5)) return { top: 'dress', tc: col, bottom: 'none', bc: col, shoes: '#e8d8c8', sleeves: 0 };
      return { top: 'pajama', tc: col, bottom: 'pants', bc: col, shoes: '#e8d8c8', sleeves: 1 };
    }
    if (kind === 'athletic') return { top: rng.pick(['tank', 'tshirt']), tc: c(), bottom: 'shorts', bc: rng.pick(['#2a2a30', '#3a4a8a', '#c83a3a', '#f0f0ec']), shoes: '#f0f0f0', sleeves: 0 };
    if (kind === 'swim') return g === 'f' ? { top: 'swim', tc: c(), bottom: 'none', bc: c(), shoes: 'skin', sleeves: 0 } : { top: 'none', tc: 'skin', bottom: 'trunks', bc: c(), shoes: 'skin', sleeves: 0 };
    if (kind === 'formal') {
      if (g === 'f' && rng.chance(0.6)) { const col = rng.pick(['#2a2a30', '#8a2a3a', '#2a3a6a', '#4a2a5a', '#e8e0d0']); return { top: 'dress', tc: col, bottom: 'none', bc: col, shoes: '#1c1c20', sleeves: 0, long: true }; }
      const col = rng.pick(['#2a2a30', '#3a3e4a', '#4a3a2a', '#1c2440']);
      return { top: 'jacket', tc: col, bottom: 'pants', bc: col, shoes: '#1c1c20', sleeves: 1, tie: rng.pick(['#8a2a2a', '#2a3a6a', '#1c1c20']) };
    }
    const top = age === 'toddler' ? 'tshirt' : rng.pick(TOP_BY_AGE[g]);
    const out = { top, tc: c(), bottom: top === 'dress' ? 'none' : rng.pick(BOTTOM_BY[g]), bc: p(), shoes: rng.pick(['#3a2a1a', '#f0f0f0', '#2a2a2a', '#6a4a2a', '#8a2a2a']), sleeves: top === 'sweater' || top === 'shirt' ? 1 : 0 };
    if (top === 'dress') out.bc = out.tc;
    if (out.bottom === 'skirt') out.bc = rng.pick(CLOTH);
    return out;
  }

  function makeLook(rng, gender, age, base) {
    const g = gender === 'f' ? 'f' : 'm';
    const styles = HAIR_STYLES[g].filter(s => age !== 'toddler' && age !== 'baby' ? true : ['crew', 'short', 'bob', 'pigtails', 'ponytail', 'short_f'].includes(s[0]));
    const look = {
      skin: base && base.skin !== undefined ? base.skin : rng.int(0, SKIN_TONES.length - 1),
      hair: rng.pick(styles)[0],
      hairC: base && base.hairC ? base.hairC : rng.pick(HAIR_COLORS.slice(0, 6))[1],
      eyes: base && base.eyes ? base.eyes : rng.pick(EYE_COLORS)[1],
      fat: rng.range(0.15, 0.6),
      fit: rng.range(0.2, 0.7),
      outfits: {}
    };
    if (age === 'elder') { look.hairC = rng.chance(0.8) ? '#c8c8cc' : '#e8e8ec'; if (g === 'm' && rng.chance(0.3)) look.hair = 'bald'; }
    for (const k of ['everyday', 'formal', 'sleep', 'athletic', 'swim']) look.outfits[k] = makeOutfit(rng, g, k, age);
    return look;
  }

  function pickTraits(rng, age, n, preset) {
    const out = (preset || []).slice(0, n);
    const allowed = TRAIT_KEYS.filter(k => ageIdx(age) >= ageIdx(TRAITS[k].age));
    let guard = 0;
    while (out.length < n && guard++ < 200) {
      const k = rng.pick(allowed);
      if (out.includes(k)) continue;
      if (out.some(o => TRAITS[o].conflicts.includes(k))) continue;
      out.push(k);
    }
    return out;
  }

  function ltwOptions(traits, rng, count) {
    const scored = Object.keys(LTW).map(k => {
      let s = 0;
      for (const t of LTW[k].traits) if (traits.includes(t)) s += 3;
      return [k, s + (rng ? rng.next() : 0)];
    });
    scored.sort((a, b) => b[1] - a[1]);
    return scored.slice(0, count || 5).map(x => x[0]);
  }

  function zodiacOf(traits) {
    let best = 0, bs = -1;
    ZODIAC.forEach((z, i) => {
      let s = 0;
      for (const t of z.traits) if (traits.includes(t)) s++;
      if (s > bs) { bs = s; best = i; }
    });
    if (bs <= 0) best = traits.length ? S.hashStr(traits.join(',')) % 12 : 0;
    return ZODIAC[best].name;
  }

  class Sim {
    constructor(p) {
      Object.assign(this, {
        id: 0, first: 'Сим', last: 'Симс', gender: 'm', age: 'ya', ageDays: 0, ageLen: 0,
        traits: [], ltw: null, fav: { food: 'mac', music: 'Поп', color: 'Синий' }, voice: 0.5,
        look: null, outfit: 'everyday', hh: 0, home: -1,
        x: 0, y: 0, lv: 0, zOff: 0, face: Math.PI / 2, lot: -1, inside: null, hidden: false,
        needs: {}, moods: [], lh: 0, lhTotal: 0,
        skills: {}, tskills: {}, stats: {}, recipes: {}, fishSeen: {},
        job: null, school: null, inv: [], wishes: [], offers: [], rewards: [],
        queue: [], anim: 'idle', animT: 0, prop: null, carry: null, carriedBy: null,
        preg: null, dead: false, ghost: false, npc: true, visitor: null,
        lastSocial: 0, idleT: 0, autoT: 0, flags: {}, bubble: null, balloon: null, pos: null
      }, p || {});
      for (const n of NEED_KEYS) if (this.needs[n] === undefined) this.needs[n] = 60 + Math.random() * 30;
    }
    get name() { return this.first + ' ' + this.last; }
    has(t) { return this.traits.includes(t); }
    hasReward(r) { return this.rewards.includes(r); }
    get isBaby() { return this.age === 'baby'; }
    get isToddler() { return this.age === 'toddler'; }
    get isChild() { return this.age === 'child'; }
    get isTeen() { return this.age === 'teen'; }
    get isKid() { return ageIdx(this.age) <= 2; }
    get isAdult() { return ageIdx(this.age) >= 4; }
    get scale() { return AGE_INFO[this.age].scale; }
    get canAct() { return !this.dead && !this.isBaby && !this.inside && !this.carriedBy; }

    needMult(n) {
      let m = 1;
      for (const t of this.traits) { const v = TRAITS[t].need[n]; if (v) m *= v; }
      if (n === 'bladder' && this.hasReward('steel_bladder')) m *= 0.5;
      if (n === 'hunger' && this.hasReward('hardly_hungry')) m *= 0.5;
      if (n === 'hygiene' && this.hasReward('fresh_forever')) m *= 0.5;
      if (n === 'energy' && this.hasReward('never_weary')) m *= 0.15;
      if (this.preg && (n === 'hunger' || n === 'bladder')) m *= 1.3;
      if (this.isBaby && n !== 'social') m *= 1.3;
      return m;
    }
    decay(n) { const d = NEEDS.find(x => x.k === n); return d ? d.decay * this.needMult(n) : 0; }
    addNeed(n, v) { this.needs[n] = clamp(this.needs[n] + v, -100, 100); }

    skillLevel(k) {
      const xp = this.skills[k];
      if (xp === undefined) return 0;
      let l = 0;
      while (l < 10 && xp >= SKILL_XP[l + 1]) l++;
      return l;
    }
    knowsSkill(k) { return this.skills[k] !== undefined; }
    skillProgress(k) {
      const xp = this.skills[k] || 0, l = this.skillLevel(k);
      if (l >= 10) return 1;
      return (xp - SKILL_XP[l]) / (SKILL_XP[l + 1] - SKILL_XP[l]);
    }
    skillMult(k) {
      let m = 1;
      for (const t of this.traits) { const v = TRAITS[t].skill[k]; if (v) m *= v; }
      if (this.hasReward('fast_learner')) m *= 1.2;
      if (this.moods.some(md => md.k === 'fascinated')) m *= 1.1;
      return m;
    }
    addXP(k, xp) {
      if (!SKILLS[k]) return 0;
      const before = this.skillLevel(k);
      const fresh = this.skills[k] === undefined;
      this.skills[k] = Math.min(SKILL_XP[10], (this.skills[k] || 0) + xp * this.skillMult(k));
      const after = this.skillLevel(k);
      if (after > before) return after;
      return fresh ? -1 : 0;
    }
    stat(k, v) { this.stats[k] = (this.stats[k] || 0) + (v === undefined ? 1 : v); return this.stats[k]; }

    moodletDef(k) { return MOODLETS[k]; }
    hasMood(k) { return this.moods.some(m => m.k === k); }
    addMood(k, now, opt) {
      const def = MOODLETS[k];
      if (!def) return;
      opt = opt || {};
      let dur = opt.dur !== undefined ? opt.dur : def.dur;
      const v = opt.v !== undefined ? opt.v : def.v;
      if (v < 0 && this.hasReward('mood_manager') && dur > 0) dur *= 0.5;
      const ex = this.moods.find(m => m.k === k);
      if (ex) {
        ex.v = v;
        if (dur > 0) ex.until = Math.max(ex.until || 0, now + dur);
        if (opt.src) ex.src = opt.src;
        return ex;
      }
      const m = { k, v, until: dur > 0 ? now + dur : 0, src: opt.src || null, start: now };
      this.moods.push(m);
      return m;
    }
    removeMood(k) { const i = this.moods.findIndex(m => m.k === k); if (i >= 0) this.moods.splice(i, 1); }
    get mood() { let s = 0; for (const m of this.moods) s += m.v; return s; }
    get moodLevel() {
      const m = this.mood;
      if (m >= 60) return 4;
      if (m >= 25) return 3;
      if (m >= 0) return 2;
      if (m >= -35) return 1;
      return 0;
    }

    currentAction() { return this.queue.length ? this.queue[0] : null; }
    busy() { return this.queue.length > 0; }

    serialize() {
      const o = {};
      for (const k of ['id', 'first', 'last', 'gender', 'age', 'ageDays', 'ageLen', 'traits', 'ltw', 'fav', 'voice', 'look', 'outfit', 'hh', 'home', 'x', 'y', 'lv', 'face', 'lot', 'needs', 'moods', 'lh', 'lhTotal', 'skills', 'tskills', 'stats', 'recipes', 'fishSeen', 'job', 'school', 'inv', 'wishes', 'offers', 'rewards', 'preg', 'dead', 'ghost', 'npc', 'flags']) o[k] = this[k];
      o.x = Math.round(this.x * 100) / 100; o.y = Math.round(this.y * 100) / 100;
      for (const n of NEED_KEYS) o.needs[n] = Math.round(this.needs[n] * 10) / 10;
      return JSON.parse(JSON.stringify(o));
    }
  }

  function randomSim(rng, opt) {
    opt = opt || {};
    const gender = opt.gender || (rng.chance(0.5) ? 'm' : 'f');
    const age = opt.age || 'ya';
    const first = opt.first || rng.pick(gender === 'f' ? S.FEMALE_NAMES : S.MALE_NAMES);
    const last = opt.last || rng.pick(S.LAST_NAMES);
    const n = AGE_INFO[age].traits;
    const traits = pickTraits(rng, age, n, opt.traits);
    const sim = new Sim({
      first, last, gender, age, traits,
      look: opt.look || makeLook(rng, gender, age, opt.base),
      fav: { food: rng.pick(FOODS), music: rng.pick(MUSIC), color: rng.pick(COLORS)[0] },
      voice: rng.range(0.2, 0.8)
    });
    if (S.isAdultish(age) || age === 'teen') sim.ltw = opt.ltw || ltwOptions(traits, rng, 1)[0];
    return sim;
  }

  Object.assign(S, { Sim, makeLook, makeOutfit, pickTraits, ltwOptions, zodiacOf, randomSim, CLOTH, PANTS });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
