(function (S) {
  'use strict';
  const { OBJECTS, ACTS, NEED_KEYS, TRAITS, clamp } = S;
  const D = t => OBJECTS[t];

  const CAT_TRAIT = { skill_guitar: 'guitar', skill_painting: 'paint', skill_writing: 'computer', skill_charisma: 'social', workout: 'workout', jog: 'jog', tv: 'tv', computer: 'computer', read: 'read', study: 'read', clean: 'clean', cook: 'cook', eat: 'eat', garden: 'garden', fish: 'fish', chess: 'chess', stargaze: 'stargaze', music: 'music', dance: 'dance', play: 'play', nap: 'nap', repair: 'repair', insane: 'insane', mean: 'mean', art: 'read', sleep: 'sleep' };

  function urgency(v) {
    const x = clamp((100 - v) / 200, 0, 1);
    return x * x * 3.2 + x * 0.25;
  }

  function traitMult(sim, cat) {
    const key = CAT_TRAIT[cat] || cat;
    let m = 1;
    for (const t of sim.traits) { const v = TRAITS[t].auto[key]; if (v !== undefined) m *= v; }
    return m;
  }

  function adScore(sim, ad) {
    let s = 0;
    for (const n of NEED_KEYS) if (ad[n]) s += ad[n] * urgency(sim.needs[n]) / 100;
    return s;
  }

  function objectActs(ob) {
    const def = D(ob.t);
    const list = def.acts.slice();
    if (ob.broken && !list.includes('repair')) list.push('repair');
    if ((ob.dirt || 0) >= 25 && !list.includes('clean_obj')) list.push('clean_obj');
    return list;
  }

  function candidates(game, sim, level) {
    const world = game.world;
    const out = [];
    const toddler = sim.isToddler;
    const sx = sim.x, sy = sim.y;
    const lotId = sim.lot;
    const home = game.hh(sim);
    const onHome = home && lotId === home.lot;
    const radius = lotId >= 0 ? 40 : 16;
    for (const ob of world.objects.values()) {
      if (lotId >= 0 ? ob.lot !== lotId : (Math.abs(ob.x - sx) > radius || Math.abs(ob.y - sy) > radius)) continue;
      if (ob.lot >= 0 && ob.lot !== lotId) continue;
      if (toddler && ob.lot !== lotId) continue;
      const lot = world.lots[ob.lot];
      if (lot && lot.kind === 'home' && (!home || lot.id !== home.lot) && !sim.visitor) continue;
      const def = D(ob.t);
      if (def.rabbit) continue;
      if (sim.noRoute && sim.noRoute[ob.id] && game.t - sim.noRoute[ob.id] < 90) continue;
      const users = Object.keys(ob.use).filter(k => ob.use[k] !== sim.id && game.sims.get(ob.use[k]) && game.sims.get(ob.use[k]).queue.length);
      if (users.length && (def.bed || def.toilet || def.shower || def.tub) && users.length >= (def.bed && def.double ? 2 : 1)) continue;
      for (const key of objectActs(ob)) {
        const A = ACTS[key];
        if (!A || (!A.ad && !A.adFn) || A.hidden) continue;
        if (level === 'low' && !(A.ad && (A.ad.hunger || A.ad.bladder || A.ad.energy || A.ad.hygiene))) continue;
        let t;
        try { t = A.test ? A.test(sim, ob, game) : true; } catch (e) { t = false; }
        if (t !== true) continue;
        let s = adScore(sim, A.ad || { fun: 5 });
        if (A.adFn) s *= A.adFn(sim, ob, game);
        s *= traitMult(sim, A.cat);
        const [cx, cy] = world.center(ob);
        const d = Math.hypot(cx - sx, cy - sy) + Math.abs((ob.lv || 0) - (sim.lv || 0)) * 8;
        s *= 1 / (1 + d / 14);
        if (def.bed) s *= 0.8 + (def.bed || 4) * 0.06;
        if (def.seat && A.key === 'sit') s *= 0.5 + def.seat * 0.08;
        if (def.tv && A.key === 'watch_tv') s *= 0.6 + def.tv * 0.08;
        if (Object.keys(ob.use).length && (A.key === 'use_toilet' || A.key === 'take_shower' || A.key === 'take_bath')) s *= 0.2;
        if (A.skill && sim.skillLevel(A.skill) >= 1) s *= 1.15;
        if (sim.lastActs && game.t - (sim.lastActs[key] || -1e9) < 45 && !(A.ad && (A.ad.hunger || A.ad.bladder || A.ad.energy || A.ad.hygiene))) s *= 0.35;
        if (sim.isKid && (A.cat === 'computer' || A.cat === 'tv' || A.cat === 'play')) s *= 1.2;
        if (game.weatherPenalty) s *= game.weatherPenalty(sim, ob);
        let opt = {};
        if (A.autoOpt) { opt = A.autoOpt(sim, ob, game); if (!opt) continue; }
        if (s > 0.01) out.push({ s, key, target: ob, opt });
      }
    }
    if (level !== 'low') {
      const socialUrg = urgency(sim.needs.social) * traitMult(sim, 'social');
      for (const other of game.simsNear(sim, toddler ? 8 : 14)) {
        if (other.dead || other.hidden || other.isBaby || other.sleeping) continue;
        if (toddler && other.hh !== sim.hh && other.lot !== sim.lot) continue;
        if (other.lot !== sim.lot && sim.lot >= 0) continue;
        const rel = game.rel(sim, other);
        if (sim.npc && other.npc && !rel.met && Math.random() < 0.6) continue;
        let s = socialUrg * 0.9 * (1 + Math.max(0, rel.v) / 100);
        if (sim.has('shy') && !rel.met) s *= 0.4;
        if (sim.has('loner')) s *= 0.6;
        if (game.lastSocialWith(sim, other) < 30) s *= 0.4;
        const key = S.pickSocial(game, sim, other);
        if (!key) continue;
        const cat = S.SOCIALS[key].cat;
        if (cat === 'romantic') s *= traitMult(sim, 'romance');
        if (cat === 'mean') s *= traitMult(sim, 'mean') * (rel.v < -20 ? 1.4 : 0.5);
        if (cat === 'funny') s *= traitMult(sim, 'funny');
        out.push({ s: s * 0.8, key: 'soc_' + key, target: other, opt: {} });
      }
      for (const key of toddler ? [] : ['jog', 'talk_self', 'evil_laugh', 'read_inv', 'do_homework', 'guitar_inv']) {
        const A = ACTS[key];
        let t;
        try { t = A.test ? A.test(sim, sim, game) : true; } catch (e) { t = false; }
        if (t !== true) continue;
        let s = adScore(sim, A.ad || { fun: 10 });
        if (A.adFn) s *= A.adFn(sim, sim, game);
        s *= traitMult(sim, A.cat);
        let opt = {};
        if (key === 'read_inv') { const i = sim.inv.findIndex(x => x.k === 'book'); if (i < 0) continue; opt = { i }; }
        if (key === 'jog' && game.isRaining && game.isRaining()) s *= 0.12;
        out.push({ s, key, target: sim, opt });
      }
      if (lotId >= 0 && !toddler && (onHome || sim.visitor)) {
        const pool = world.poolTiles(lotId);
        if (pool.length) {
          const A = ACTS.swim;
          const tile = pool[Math.floor(Math.random() * pool.length)];
          let t;
          try { t = A.test(sim, tile, game); } catch (e) { t = false; }
          if (t === true) out.push({ s: adScore(sim, A.ad) * A.adFn(sim, tile, game) * traitMult(sim, A.cat) * (game.isRaining && game.isRaining() ? 0.1 : 1), key: 'swim', target: tile, opt: {} });
        }
      }
      if (sim.has('angler') || sim.has('loves_outdoors')) {
        const spot = game.nearWater(sim, 12);
        if (spot) out.push({ s: adScore(sim, { fun: 30 }) * traitMult(sim, 'fish') * (game.isRaining && game.isRaining() && !sim.has('angler') ? 0.3 : 1), key: 'fish_here', target: spot, opt: {} });
      }
    }
    if (S.ageIdx(sim.age) >= 3 && home) {
      for (const id of home.members) {
        const k = game.sims.get(id);
        if (!k || k.dead || !(k.isBaby || k.isToddler) || k.lot !== sim.lot) continue;
        if (k.needs.hunger < 45) out.push({ s: 2.5 + urgency(k.needs.hunger), key: 'feed_baby', target: k, opt: {} });
        if (k.needs.bladder < 35 && !(k.tskills.potty >= 1)) out.push({ s: 2.2 + urgency(k.needs.bladder), key: 'change', target: k, opt: {} });
        if (k.needs.energy < 30 && !k.inCrib && game.nearestObj(sim, o => D(o.t).crib && !o.use.baby, 30)) out.push({ s: 2 + urgency(k.needs.energy), key: 'to_crib', target: k, opt: {} });
        if (k.needs.social < 35 && k.isBaby) out.push({ s: 1.2 + urgency(k.needs.social), key: 'cuddle', target: k, opt: {} });
        if (k.isToddler && k.needs.fun > 20) {
          if (!(k.tskills.walk >= 1)) out.push({ s: 0.5 * (sim.has('family_oriented') ? 2 : 1), key: 'soc_teach_walk', target: k, opt: {} });
          if (!(k.tskills.talk >= 1)) out.push({ s: 0.5 * (sim.has('family_oriented') ? 2 : 1), key: 'soc_teach_talk', target: k, opt: {} });
        }
      }
    }
    return out;
  }

  function decide(game, sim) {
    if (sim.dead || sim.isBaby || sim.hidden || sim.carriedBy) return null;
    const level = sim.npc ? 'full' : game.opts.autonomy;
    if (level === 'off') {
      if (sim.needs.energy < -80) return pickBest(game, sim, candidates(game, sim, 'low').filter(c => c.key === 'sleep'));
      if (sim.needs.bladder < -70) return pickBest(game, sim, candidates(game, sim, 'low').filter(c => c.key === 'use_toilet'));
      if (sim.needs.hunger < -60) return pickBest(game, sim, candidates(game, sim, 'low').filter(c => c.key === 'quick_meal' || c.key === 'serve_plate' || c.key === 'leftovers'));
      return null;
    }
    const list = candidates(game, sim, level);
    if (!list.length) return null;
    return pickBest(game, sim, list);
  }

  function pickBest(game, sim, list) {
    if (!list.length) return null;
    list.sort((a, b) => b.s - a.s);
    if (list.length === 1 || list[0].s > list[1].s * 2 || list[0].s > 1.5) return list[0];
    const top = list.slice(0, 4);
    return game.rng.weighted(top.map(c => [c, c.s * c.s * c.s]));
  }

  Object.assign(S, { urgency, traitMult, adScore, candidates, decide, objectActs, CAT_TRAIT });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
