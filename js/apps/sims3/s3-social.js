(function (S) {
  'use strict';
  const { SOCIALS, SOCIAL_KEYS, SOCIAL_CATS, TRAITS, defAct, clamp, ageIdx } = S;

  function romanticAges(a, b) {
    if (a.isKid || b.isKid || a.isBaby || b.isBaby) return false;
    if (a.age === 'teen' || b.age === 'teen') return a.age === 'teen' && b.age === 'teen';
    return true;
  }

  function socialTest(game, a, b, key) {
    const d = SOCIALS[key];
    if (!d) return 'Нет такого действия';
    if (a === b) return 'Нельзя';
    if (b.dead || a.dead) return 'Нельзя';
    if (b.inside || b.hidden) return 'Недоступен';
    const r = d.req || {};
    const rel = game.rel(a, b);
    if (b.isBaby && !(r.targetAge && r.targetAge.includes('baby'))) return null;
    if (r.targetAge && !r.targetAge.includes(b.age)) return null;
    if (r.actorAges && !r.actorAges.includes(a.age)) return null;
    if (r.minAge && ageIdx(a.age) < ageIdx(r.minAge)) return null;
    if (r.targetMinAge && ageIdx(b.age) < ageIdx(r.targetMinAge)) return null;
    if (a.isToddler && d.cat !== 'friendly' && d.cat !== 'funny') return null;
    if (a.isToddler && key !== 'chat' && key !== 'funny_face' && key !== 'introduce') return null;
    if (r.met === true && !rel.met) return null;
    if (r.met === false && rel.met) return null;
    if (r.rel && (rel.v < r.rel[0] || rel.v >= r.rel[1])) return 'Отношения: ' + (rel.v < r.rel[0] ? 'нужно больше ' + r.rel[0] : 'слишком хорошие');
    if (r.flags && !r.flags.every(f => rel.flags[f])) return null;
    if (r.noflags && r.noflags.some(f => rel.flags[f])) return null;
    if (r.romanticAges && (!romanticAges(a, b) || game.isFamily(a, b))) return null;
    if (r.canBaby) {
      if (!romanticAges(a, b) || game.isFamily(a, b)) return null;
      if (a.age === 'teen' || a.age === 'elder' || b.age === 'teen' || b.age === 'elder') return null;
      if (a.gender === b.gender) return 'Для этого пары нужно усыновление';
      const f = a.gender === 'f' ? a : b;
      if (f.preg) return 'Уже ждёт ребёнка';
      if (game.householdSize(a) >= 8) return 'В семье нет места';
    }
    if (r.targetSad && b.mood >= 0) return null;
    if (r.actorTrait && !a.has(r.actorTrait)) return null;
    if (r.actorSkill && a.skillLevel(r.actorSkill[0]) < r.actorSkill[1]) return null;
    if (r.otherHousehold && a.hh === b.hh) return null;
    if (r.ownLot) { const hh = game.hh(a); if (!hh || a.lot !== hh.lot) return null; }
    if (r.visitorOnOwnLot) { const hh = game.hh(a); if (!hh || !b.visitor || b.lot !== hh.lot || b.hh === a.hh) return null; }
    if (r.greetable && !(b.visitor && b.visitor.waiting)) return null;
    if (r.teach && (b.tskills[r.teach] || 0) >= 1) return 'Уже умеет';
    if (r.homework && !b.inv.some(i => i.k === 'homework')) return null;
    if (d.bed && !game.findBedFor(a, b)) return 'Нужна кровать';
    return true;
  }

  function chemistry(a, b) { return (S.hashStr(Math.min(a.id, b.id) + ':' + Math.max(a.id, b.id)) % 21) - 10; }

  function socialChance(game, a, b, key) {
    const d = SOCIALS[key];
    if (d.base >= 99) return 100;
    const rel = game.rel(a, b);
    const cat = d.cat;
    let c = d.base;
    if (cat === 'friendly' || cat === 'funny') c += rel.v * 0.22;
    if (cat === 'romantic') c += rel.v * 0.28 - (rel.flags.steady || rel.flags.married ? 0 : 6);
    c += clamp(b.mood * 0.15, -15, 15);
    if (cat !== 'mean') c += a.skillLevel('charisma') * 1.4;
    for (const t of a.traits) { const tr = TRAITS[t]; if (tr.soc_actor && cat !== 'mean') c += tr.soc_actor; if (cat === 'romantic' && tr.soc_romance) c += tr.soc_romance; if (cat === 'funny' && tr.soc_funny) c += tr.soc_funny; }
    for (const t of b.traits) {
      const m = TRAITS[t].soc[cat];
      if (m) c += (cat === 'romantic' && m < 0 && (rel.flags.steady || rel.flags.married)) ? 0 : m;
    }
    if (cat === 'romantic') {
      c += chemistry(a, b);
      if (a.hasReward('attractive')) c += 15;
      const partner = game.partnerOf(b);
      if (partner && partner !== a.id && !b.has('flirty')) c -= 30;
      if (b.hasMood('heartbroken')) c -= 20;
      if (key === 'propose' && b.has('commitment_issues')) c -= 30;
    }
    if (b.hasMood('boiling') || b.hasMood('insulted')) c -= cat === 'mean' ? -10 : 15;
    if (b.sleeping) c -= 40;
    if (a.hasMood('stinky')) c -= 15;
    if (a.hasMood('lucky_day')) c += 8;
    return clamp(Math.round(c), 3, 98);
  }

  function revealTrait(game, a, b, all) {
    const rel = game.rel(a, b);
    const known = rel.known[a.id] = rel.known[a.id] || [];
    const unknown = b.traits.filter(t => !known.includes(t));
    if (!unknown.length) return null;
    if (all || a.hasReward('observant')) { known.push(...unknown); return unknown; }
    const t = unknown[Math.floor(Math.random() * unknown.length)];
    known.push(t);
    return [t];
  }

  function jealousy(game, a, b) {
    for (const s of game.sims.values()) {
      if (s === a || s === b || s.dead || s.hidden || s.sleeping) continue;
      if (Math.hypot(s.x - a.x, s.y - a.y) > 10) continue;
      for (const [cheat, other] of [[a, b], [b, a]]) {
        const r = game.rel(s, cheat);
        if (!(r.flags.steady || r.flags.engaged || r.flags.married)) continue;
        s.addMood('betrayed', game.t);
        game.relAdd(s, cheat, -40);
        game.relAdd(s, other, -30);
        game.notify(s.first + ' видит, как ' + cheat.first + ' флиртует с ' + other.first + '. Это измена!', { sim: s, icon: 'm_broken' });
        if (s.has('hot_headed')) s.addMood('boiling', game.t);
      }
    }
  }

  function applySocial(game, a, b, key, ok) {
    const d = SOCIALS[key];
    const rel = game.rel(a, b);
    const out = ok ? d.ok : d.fail;
    const t = game.t;
    if (!rel.met && key !== 'introduce') game.meet(a, b);
    let dRel = out.rel || 0;
    if (ok && dRel > 0) dRel *= 1 + a.skillLevel('charisma') * 0.04;
    if (ok && out.shared && b.has(out.shared)) dRel += 4;
    game.relAdd(a, b, dRel);
    rel.last = t;
    const soc = (ok ? out.social : 3) || 0;
    a.addNeed('social', soc);
    b.addNeed('social', soc * 0.8);
    if (out.fun) { a.addNeed('fun', out.fun); b.addNeed('fun', out.fun * 0.8); }
    if (out.moodA) a.addMood(out.moodA, t);
    if (out.moodB) b.addMood(out.moodB, t);
    if (ok && out.set) {
      rel.flags[out.set] = true;
      if (out.set === 'romance') rel.flags.crush = true;
      if (out.set === 'steady' || out.set === 'engaged') rel.flags.romance = true;
      game.note(a, { k: 'rel', t: b.id, st: out.set });
      game.note(b, { k: 'rel', t: a.id, st: out.set });
      if (out.set === 'steady') game.notify(a.first + ' и ' + b.first + ' теперь встречаются!', { sim: a, icon: 'm_heart' });
      if (out.set === 'engaged') game.notify(a.first + ' и ' + b.first + ' обручились!', { sim: a, icon: 'm_ring' });
      if (out.set === 'bff') game.notify(a.first + ' и ' + b.first + ' теперь лучшие друзья!', { sim: a, icon: 'm_star' });
    }
    if (d.cat === 'friendly' && ok && a.has('friendly')) a.addMood('good_convo', t);
    if (d.cat === 'funny' && ok) {
      if (b.has('good_sense_of_humor')) b.addMood('laughed', t);
      if (b.has('no_sense_of_humor')) b.addMood('not_funny', t);
    }
    if (d.cat === 'romantic' && ok && key !== 'break_up' && key !== 'divorce') jealousy(game, a, b);
    if (d.cat === 'mean' && ok) {
      if (a.has('evil') || a.has('mean_spirited')) a.addMood('evil_joy', t);
      if (a.has('grumpy')) a.addMood('vented', t);
      if (b.has('hot_headed')) b.addMood('boiling', t);
      else if (!b.has('evil')) b.addMood('sad', t, { dur: 180 });
      if (a.has('good')) a.addMood('sad', t, { dur: 120 });
    }
    const sp = ok ? out.special : null;
    if (sp === 'meet') {
      game.meet(a, b);
      const r = revealTrait(game, a, b);
      revealTrait(game, b, a);
      if (a.has('shy') && Math.random() < 0.3) a.addMood('embarrassed', t, { dur: 90 });
    }
    if (sp === 'reveal') {
      const r = revealTrait(game, a, b);
      if (r && game.isActive(a)) game.notify(a.first + ' узнаёт, что ' + b.first + ': ' + r.map(x => TRAITS[x].name.toLowerCase()).join(', ') + '.', { sim: a, icon: 'm_idea', minor: true });
    }
    if (sp === 'reveal_job') rel.jobKnown = rel.jobKnown || {}, rel.jobKnown[a.id] = true;
    if (sp === 'good_deed' && a.has('good')) a.addMood('good_deed', t);
    if (sp === 'kiss') {
      if (!a.flags.kissed) { a.flags.kissed = true; a.addMood('first_kiss', t); }
      if (!b.flags.kissed) { b.flags.kissed = true; b.addMood('first_kiss', t); }
      if (a.has('great_kisser')) b.addMood('great_kiss', t);
      if (b.has('great_kisser')) a.addMood('great_kiss', t);
      a.addMood('in_love', t, { dur: 480 }); b.addMood('in_love', t, { dur: 480 });
      a.stat('kisses');
      game.noteRomance(a, b);
    }
    if (sp === 'marry') game.marry(a, b);
    if (sp === 'move_in') game.moveIn(a, b);
    if (sp === 'break_up') {
      for (const f of ['crush', 'romance', 'steady', 'engaged']) delete rel.flags[f];
      rel.flags.ex = true;
      a.addMood('sad', t, { dur: 600 }); b.addMood('heartbroken', t);
      game.notify(a.first + ' и ' + b.first + ' расстались.', { sim: a, icon: 'm_broken' });
    }
    if (sp === 'divorce') game.divorce(a, b);
    if (sp === 'fight') {
      const pa = a.skillLevel('athletic') + Math.random() * 5 + (a.has('hot_headed') ? 1 : 0);
      const pb = b.skillLevel('athletic') + Math.random() * 5 + (b.has('hot_headed') ? 1 : 0);
      const win = pa >= pb ? a : b, lose = pa >= pb ? b : a;
      win.addMood('fight_win', t); lose.addMood('fight_lose', t);
      win.addNeed('energy', -10); lose.addNeed('energy', -20); lose.addNeed('hygiene', -20);
      game.notify(win.first + ' победил' + S.genderize(win, '', 'а') + ' в драке с ' + lose.first + '.', { sim: a, icon: 'm_fist', minor: true });
    }
    if (sp === 'leave') game.sendHome(b);
    if (sp === 'greet') game.greet(a, b);
    if (sp === 'teach') {
      const sk = d.req.teach;
      b.tskills[sk] = Math.min(1, (b.tskills[sk] || 0) + 0.14 * (a.has('family_oriented') ? 1.4 : 1) * (b.has('athletic') && sk === 'walk' ? 1.3 : 1));
      game.relAdd(a, b, 3);
      if (b.tskills[sk] >= 1) {
        b.addMood('toddler_learned', t); a.addMood('thrilled', t);
        game.notify(b.first + ' научил' + S.genderize(b, 'ся', 'ась') + ': ' + S.TODDLER_SKILLS[sk].name.toLowerCase() + '!', { sim: b, icon: S.TODDLER_SKILLS[sk].icon });
        game.note(a, { k: 'teach' });
      }
    }
    if (sp === 'homework') {
      const hw = b.inv.find(i => i.k === 'homework');
      if (hw) { hw.p = (hw.p || 0) + 0.6; if (hw.p >= 1) { b.inv.splice(b.inv.indexOf(hw), 1); b.school.perf = clamp(b.school.perf + 12, -100, 100); b.school.hwDone = game.day; b.addMood('homework_done', t); game.note(b, { k: 'homework' }); } }
    }
    if (sp === 'borrow') {
      const m = 100 + Math.floor(Math.random() * 400);
      const hb = game.hh(b), ha = game.hh(a);
      if (hb && ha && hb.funds > m * 3) { hb.funds -= m; game.earn(a, m, 'Заём'); game.fx('money', a, m); }
    }
    if (sp === 'mean' && b.has('coward') && Math.random() < 0.5) b.addMood('trembling', t);
    game.note(a, { k: 'social', s: key, t: b.id, ok, cat: d.cat });
    if (ok && d.cat === 'friendly') game.checkFriendship(a, b);
  }

  function* socialRun(a, sim, target, opt) {
    const game = a.game;
    const key = a.def.soc;
    const d = SOCIALS[key];
    if (!target || target.dead) return;
    if (d.bed) { yield* bedRun(a, sim, target, key); return; }
    for (let attempt = 0; attempt < 3; attempt++) {
      if (sim.isToddler && target.lot !== sim.lot) return;
      const dist = Math.hypot(target.x - sim.x, target.y - sim.y);
      if (dist <= 1.8 && !target.path) break;
      const goals = S.adjTilesSim(game, target);
      if (!goals.length) break;
      goals.sort((p, q) => Math.hypot(p[0] + 0.5 - sim.x, p[1] + 0.5 - sim.y) - Math.hypot(q[0] + 0.5 - sim.x, q[1] + 0.5 - sim.y));
      if (!(yield* a.walk(goals.slice(0, 3)))) return;
      if (target.inside || target.hidden || target.dead) return;
    }
    if (Math.hypot(target.x - sim.x, target.y - sim.y) > 3) return;
    if (socialTest(game, sim, target, key) !== true) return;
    game.engage(target, sim, d.dur + 1);
    a.face(target.x, target.y);
    if (!target.seatOf && !target.lieH) target.face = Math.atan2(sim.y - target.y, sim.x - target.x);
    const close = ['hug', 'kiss', 'slap', 'shove', 'fight', 'highfive', 'tickle', 'propose'].includes(d.anim);
    if (close && !target.seatOf && !target.lieH) {
      const ang = Math.atan2(target.y - sim.y, target.x - sim.x);
      const want = 0.72;
      const nx = target.x - Math.cos(ang) * want, ny = target.y - Math.sin(ang) * want;
      if (game.world.walkable(Math.floor(nx), Math.floor(ny), sim.lv || 0)) yield* a.glide(nx, ny, ang, 0.3);
    }
    const chance = socialChance(game, sim, target, key);
    const ok = Math.random() * 100 < chance;
    a.anim(d.anim === 'jog' ? 'talk' : d.anim === 'kneel' ? 'kneel' : ['hug', 'kiss', 'slap', 'shove', 'fight', 'highfive', 'tickle', 'propose', 'flirt', 'wave', 'funny', 'argue', 'gesture'].includes(d.anim) ? d.anim + '_a' : 'talk');
    if (d.anim === 'fight') { a.anim('fight'); if (target.engage) target.engage.anim = 'fight'; game.fx('dust', sim); }
    a.say(d.icon, d.dur * 0.5);
    let t = 0;
    const half = d.dur * 0.45;
    let reacted = false;
    while (t < d.dur) {
      yield;
      t += a.dt;
      if (!reacted && t >= half) {
        reacted = true;
        if (d.anim === 'fight') reacted = true;
        else if (ok) {
          const rx = { hug: 'hug_b', kiss: 'kiss_b', highfive: 'highfive_b', tickle: 'laugh', funny: 'laugh', gesture: d.cat === 'funny' ? 'laugh' : 'listen', flirt: 'blush', propose: 'cheer', wave: 'wave_b', argue: 'angry', slap: 'hurt', shove: 'hurt' }[d.anim] || 'listen';
          if (target.engage) target.engage.anim = rx;
          target.balloon = { icon: d.cat === 'mean' ? 'm_angry' : d.cat === 'romantic' ? 'm_heart' : d.cat === 'funny' ? 'm_laugh' : S.TOPICS[Math.floor(Math.random() * S.TOPICS.length)], until: game.t + d.dur * 0.5, good: d.cat !== 'mean' };
          if (d.anim === 'propose') a.anim('kneel', 'ring');
        } else {
          if (target.engage) target.engage.anim = d.cat === 'romantic' ? 'reject' : d.cat === 'mean' ? 'shrug' : 'annoyed';
          target.balloon = { icon: 'm_no', until: game.t + d.dur * 0.5, bad: true };
          a.anim('embarrassed');
        }
      }
    }
    applySocial(game, sim, target, key, ok);
    game.disengage(target);
    if (ok && game.isActive(sim)) game.fx('rel', target, SOCIALS[key].ok.rel || 0);
    if (!ok && game.isActive(sim)) game.fx('text', sim, 'Отказ');
  }

  function* bedRun(a, sim, target, key) {
    const game = a.game;
    const bed = game.findBedFor(sim, target);
    if (!bed) return;
    const chance = socialChance(game, sim, target, key);
    const goals = S.adjTilesSim(game, target);
    if (!(yield* a.walk(goals.slice(0, 3)))) return;
    game.engage(target, sim, 3);
    a.anim('flirt_a'); a.say('m_heart', 2);
    yield* a.wait(2);
    game.disengage(target);
    if (Math.random() * 100 >= chance) { applySocial(game, sim, target, key, false); target.balloon = { icon: 'm_no', until: game.t + 3, bad: true }; return; }
    const spots = S.bedSpots(bed);
    if (!a.reserve(bed, 'bed0') || !a.reserve(bed, 'bed1')) return;
    game.queueFront(target, 'woohoo_join', bed, { host: sim.id, user: true });
    if (!(yield* a.walkToObj(bed, 'adj'))) return;
    const s = spots[0];
    yield* a.glideIn(s.pos[0], s.pos[1], s.face, 0.5);
    sim.seatOf = bed.id;
    sim.lieH = S.BED_H[bed.t] || 0.5;
    a.anim('woohoo');
    let waited = 0;
    while (Math.hypot(target.x - s.pos[0], target.y - s.pos[1]) > 1.6 && waited < 15) { yield; waited += a.dt; }
    bed.st.woohoo = game.t + 14; game.dirtyObjs();
    sim.censor = true;
    game.sound('woohoo', sim);
    yield* a.loop(14, dt => { if (Math.random() < dt * 0.5) game.fx('heart', sim); }, null, { noCancel: true });
    sim.censor = false;
    bed.st.woohoo = 0; game.dirtyObjs();
    applySocial(game, sim, target, key, true);
    sim.addMood('woohoo', game.t); target.addMood('woohoo', game.t);
    game.note(sim, { k: 'woohoo', t: target.id }); game.note(target, { k: 'woohoo', t: sim.id });
    if (key === 'try_baby') game.tryForBaby(sim, target);
    sim.lieH = 0;
    yield* a.standUp();
  }

  defAct('woohoo_join', {
    name: 'Шуры-муры', icon: 'm_heart', cat: 'romantic', hidden: true,
    test: () => true,
    run: function* (a, sim, bed, opt) {
      const spots = S.bedSpots(bed);
      const s = spots[1] || spots[0];
      if (!(yield* a.walkToObj(bed, 'adj'))) return;
      yield* a.glideIn(s.pos[0], s.pos[1], s.face, 0.5);
      sim.seatOf = bed.id;
      sim.lieH = S.BED_H[bed.t] || 0.5;
      a.anim('woohoo'); sim.censor = true;
      const host = a.game.sims.get(opt.host);
      let t = 0;
      while (t < 30 && host && host.queue.length && host.queue[0].key.startsWith('soc_')) { yield; t += a.dt; }
      sim.censor = false;
      sim.lieH = 0;
      yield* a.standUp();
    }
  });

  for (const key of SOCIAL_KEYS) {
    const d = SOCIALS[key];
    defAct('soc_' + key, {
      name: d.name, icon: d.icon, cat: 'social', social: true, soc: key, scat: d.cat, top: d.top,
      test: (sim, target, game) => socialTest(game, sim, target, key),
      run: socialRun
    });
  }

  function pickSocial(game, a, b) {
    const rel = game.rel(a, b);
    const opts = [];
    const add = (k, w) => { if (w > 0 && socialTest(game, a, b, k) === true) opts.push([k, w]); };
    if (!rel.met) { add('introduce', 10); return opts.length ? game.rng.weighted(opts) : null; }
    const mean = (a.has('evil') ? 3 : 0) + (a.has('mean_spirited') ? 3 : 0) + (a.has('hot_headed') ? 1 : 0) + (a.has('grumpy') ? 1 : 0) + (rel.v < -30 ? 4 : 0);
    const rom = (a.has('flirty') ? 3 : 0) + (a.has('hopeless_romantic') ? 2 : 0) + (rel.flags.romance ? 4 : 0) + (rel.flags.crush ? 1 : 0) - (a.has('unflirty') ? 5 : 0);
    const fun = 1 + (a.has('good_sense_of_humor') ? 2 : 0) + (a.has('childish') ? 1 : 0) + (a.has('inappropriate') ? 1 : 0) - (a.has('no_sense_of_humor') ? 1 : 0);
    add('chat', 6); add('talk_interests', 3); add('compliment', 2); add('ask_job', 1); add('tell_story', 2); add('friendly_hug', rel.v > 50 ? 2 : 0);
    add('high_five', 1); add('comfort', 3);
    for (const k of ['talk_books', 'talk_sports', 'talk_tech', 'talk_nature', 'talk_food']) add(k, 3);
    add('complain', 2); add('offer_bff', rel.v > 85 ? 2 : 0);
    add('joke', fun * 2); add('funny_face', fun); add('tickle', fun); add('tease', fun * 0.5); add('inappropriate_joke', 2);
    if (rom > 0) { add('flirt', rom); add('compliment_looks', rom * 0.6); add('confess', rom); add('romantic_hug', rom); add('kiss', rom); add('make_out', rom * 0.5); add('go_steady', rom * 0.4); }
    if (mean > 0) { add('insult', mean); add('argue', mean); add('mock', mean * 0.6); add('shove', mean * 0.4); add('slap', mean * 0.3); add('fight', rel.v < -50 ? mean * 0.3 : 0); add('evil_gossip', 2); }
    add('peekaboo', 3); add('play_tag', 3); add('teach_walk', 2); add('teach_talk', 2); add('help_homework', 1);
    if (!opts.length) return null;
    return game.rng.weighted(opts);
  }

  function socialMenu(game, a, b) {
    const out = [];
    const cats = {};
    for (const key of SOCIAL_KEYS) {
      const d = SOCIALS[key];
      const r = socialTest(game, a, b, key);
      if (r === null || r === undefined) continue;
      const entry = { label: d.name, key: 'soc_' + key, disabled: r === true ? null : r };
      if (d.top) out.push(entry);
      else (cats[d.cat] = cats[d.cat] || []).push(entry);
    }
    for (const c of Object.keys(SOCIAL_CATS)) if (cats[c] && cats[c].length) out.push({ label: SOCIAL_CATS[c].name, icon: SOCIAL_CATS[c].icon, sub: cats[c] });
    return out;
  }

  Object.assign(S, { socialTest, socialChance, applySocial, pickSocial, socialMenu, romanticAges, revealTrait, chemistry });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
