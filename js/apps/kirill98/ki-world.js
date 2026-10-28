(function (K) {
  'use strict';

  const NEAR = 250, FAR = 320, WALK = 1.6, TICK = 0.5, CONTACT = 30, RETREAT = 1 / 3, TRACE_NEAR = 220, TRACE_DAYS = 3, BURY_AGE = 300, BURY_EVERY = 30;
  const HOUR = 80, PLAN_HOUR = 6;

  const POSTS = Object.freeze({
    korni: { name: 'Корни', side: 'elf', at: [350, 712], walls: false, forest: true },
    palace: { name: 'дворец', side: 'guard', at: [1200, 700], gate: [1146, 700], walls: true },
    outpost: { name: 'застава', side: 'guard', at: [1240, 392], men: 12, walls: false },
    tower: { name: 'вышка у брода', side: 'guard', at: [786, 752], men: 6 },
    lesoseka: { name: 'Лесосека', side: 'guard', at: [690, 915], men: 8, forest: true, work: 'wood' },
    tsarevo: { name: 'Царёво', side: 'guard', at: [1300, 1000], men: 4 },
    cutters: { name: 'лагерь рубщиков', side: 'villain', at: [565, 305], men: 8, forest: true, work: 'logs' },
    mines: { name: 'рудники', side: 'villain', at: [1080, 232], men: 6 },
    fort: { name: 'Старый форт', side: 'villain', at: [960, 105], gate: [921, 105], walls: true }
  });
  const HOME = Object.freeze({ guard: 'palace', elf: 'korni', villain: 'fort' });
  const POWER = Object.freeze({ guard: 1.0, elf: 0.9, villain: 1.05 });
  const ENEMY = Object.freeze({ guard: ['elf', 'villain'], elf: ['guard', 'villain'], villain: ['guard', 'elf'] });
  const READY = Object.freeze({ logs: [180, 35], iron: [140, 20], men: [60, 25], intel: [3, 10], morale: [60, 10] });
  const NAMES = Object.freeze({ patrol: 'дозор', raid: 'набег', punish: 'карательный набег', partisans: 'партизаны', logging: 'рубка', spy: 'шпион', outpost: 'взятие заставы', assault: 'штурм', pursuit: 'погоня', relief: 'подкрепление', ambush: 'засада', recruit: 'вербовка' });

  const range = (rnd, a, b) => a + Math.floor(rnd() * (b - a + 1));
  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const hostile = (a, b) => (ENEMY[a] || []).includes(b);

  function state(S) {
    if (S.world) return S.world;
    S.world = {
      groups: [], next: 1, traces: [], reports: [], planned: 0, assault: null, buried: 0, raidsOn: {}, wins: {}, stats: { battles: 0, dead: { guard: 0, elf: 0, villain: 0 } },
      sides: {
        guard: { men: 70, stock: { silver: 2000, bread: 300, arms: 200 }, anger: { elf: 0, villain: 0 }, walls: 0, alarm: 0 },
        elf: { people: 44, fighters: 18, stock: { food: 120, cloth: 30, iron: 20, medicine: 20, wood: 60 }, houses: 12, burnt: 0, anger: { guard: 0, villain: 0 } },
        villain: { men: 34, stock: { silver: 600, iron: 40, bread: 200, logs: 0 }, intel: 0, morale: 60, ladders: 0, ram: 0, readiness: 0, anger: { guard: 0, elf: 0 } }
      },
      posts: Object.fromEntries(Object.entries(POSTS).map(([id, p]) => [id, { side: p.side, men: p.men || 0, idle: 0 }]))
    };
    return S.world;
  }

  const routeCache = new WeakMap();
  function pathOf(W, from, to, side) {
    let m = routeCache.get(W);
    if (!m) { m = new Map(); routeCache.set(W, m); }
    const key = from.map(Math.round).join() + '>' + to.map(Math.round).join() + ':' + (side === 'elf' ? 'e' : 'o');
    if (!m.has(key)) {
      let pts = null;
      if (K.Nav && W.terrain && W.near) { const r = K.Nav.route(K.Nav.of(W), from, to, { side }); if (r && r.pts && r.pts.length) pts = [from.slice(), ...r.pts, to.slice()]; }
      if (!pts) pts = [from.slice(), to.slice()];
      const clean = [];
      for (const q of pts) { const l = clean[clean.length - 1]; if (Number.isFinite(q[0]) && Number.isFinite(q[1]) && (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.5)) clean.push([q[0], q[1]]); }
      if (clean.length < 2) clean.push([clean[0][0] + 1, clean[0][1]]);
      m.set(key, K.Terrain.polyline(clean));
    }
    return m.get(key);
  }

  function launch(S, side, kind, from, to, n, o) {
    const E = state(S), opts = o || {};
    if (n <= 0) return null;
    const g = { id: 'g' + E.next++, side, kind, from: from.slice(), to: to.slice(), target: opts.target || null, n, start: n, s: 0, state: 'go', live: false, crew: [], wait: 0, back: false, day: S.day || 1, at: from.slice(), fire: !!opts.fire, dogs: !!opts.dogs, quiet: 0, home: opts.home || HOME[side] };
    E.groups.push(g);
    if (kind === 'raid' || kind === 'punish' || kind === 'assault') { const key = g.target || 'none'; E.raidsOn[key] = (E.raidsOn[key] || 0) + 1; }
    report(S, side, `${NAMES[kind]}: ${n} чел. идут на ${g.target ? POSTS[g.target].name : 'место'}`, g.at, kind === 'punish' || kind === 'assault' || kind === 'raid' ? 2 : 1);
    return g;
  }

  function report(S, side, text, at, level) {
    const E = state(S);
    E.reports.push({ day: S.day || 1, hour: Math.floor(S.hour || 0), side, text, at: at ? at.slice() : null, level: level || 1 });
    if (E.reports.length > 120) E.reports.splice(0, E.reports.length - 120);
  }

  let VIA = null;
  const forestWay = () => {
    if (VIA) return VIA;
    const road = id => K.Places.ROADS.find(r => r.id === id).pts, pts = [];
    for (const [id, rev] of [['fort-yard', true], ['forest', true], ['bridge', true], ['bridge-street', true], ['tract', false]]) for (const p of rev ? road(id).slice().reverse() : road(id)) { const l = pts[pts.length - 1]; if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 0.5) pts.push(p.slice()); }
    VIA = K.Terrain.polyline(pts);
    return VIA;
  };
  let GOAT = null;
  const goatWay = () => {
    if (GOAT) return GOAT;
    const road = id => K.Places.ROADS.find(r => r.id === id).pts, pts = [];
    for (const [id, rev] of [['fort-yard', false], ['fort-postern', false], ['goat', true], ['outpost', true]]) for (const p of rev ? road(id).slice().reverse() : road(id)) { const l = pts[pts.length - 1]; if (!l || Math.hypot(l[0] - p[0], l[1] - p[1]) > 0.5) pts.push(p.slice()); }
    GOAT = K.Terrain.polyline(pts);
    return GOAT;
  };
  const lineOf = (W, g) => g.via && !g.back ? (g.via === 'goat' ? goatWay() : forestWay()) : pathOf(W, g.back ? g.to : g.from, g.back ? homeAt(g) : g.to, g.side);
  const villainName = S => S.player && S.player.team === 'villain' ? S.player.name || '' : S.villainName || '';
  const evil = S => villainName(S) ? `Злой по прозвищу ${villainName(S)}` : 'Злой';
  const evilOf = S => villainName(S) ? `Злого по прозвищу ${villainName(S)}` : 'Злого';

  function posOf(W, g) {
    const line = g.line || (g.line = lineOf(W, g));
    const p = K.Terrain.pointAt(line, g.s);
    return [p.x, 0, p.z];
  }
  const homeAt = g => POSTS[g.home] ? (POSTS[g.home].gate || POSTS[g.home].at) : g.from;

  function readiness(S) {
    const V = state(S).sides.villain, part = (v, [need, w]) => Math.min(1, v / need) * w;
    V.readiness = Math.round(part(V.ladders * 20 + V.ram * 60, READY.logs) + part(V.stock.iron, READY.iron) + part(V.men, READY.men) + part(V.intel, READY.intel) + part(V.morale, READY.morale));
    return V.readiness;
  }

  function strength(S) {
    const E = state(S), s = E.sides;
    return { guard: s.guard.men, elf: s.elf.fighters * 2, villain: s.villain.men };
  }

  function mercFactor(S, side) {
    const st = strength(S), E = state(S), score = k => (st[k] || 0) + ((E.wins[k] || []).filter(d => d > (S.day || 1) - 7).length) * 6;
    const list = ['guard', 'elf', 'villain'].sort((a, b) => score(a) - score(b));
    return side === list[2] ? 1.5 : side === list[0] ? 0.7 : 1;
  }

  function heal(S) {
    const E = state(S), day = S.day || 1;
    if (!E.hurt) return;
    for (const h of E.hurt) {
      if (h.day > day) continue;
      const s = E.sides[h.side];
      if (h.side === 'elf') { s.fighters = Math.min(s.people, s.fighters + h.n); }
      else s.men += h.n;
      h.n = 0;
    }
    E.hurt = E.hurt.filter(h => h.n > 0);
  }

  function ambushPlan(S, rnd, fighters) {
    if (fighters < 4 || !S.caravans || !S.T) return false;
    const line = c => K.Caravan.routes()[c.kind].line, meetAt = c => { const l = line(c), now = K.Terrain.pointAt(l, c.s); return K.Terrain.pointAt(l, Math.min(l.length, c.s + Math.hypot(now.x - POSTS.korni.at[0], now.z - POSTS.korni.at[1]) * 0.9 + 20)); };
    const prey = S.caravans.list.find(c => (c.kind === 'ore' || c.kind === 'bread') && !c.live && c.state !== 'stopped' && !c.done && !c.hunted && S.T.zoneAt(meetAt(c).x, meetAt(c).z) === 3);
    if (!prey || rnd() >= 0.5) return false;
    prey.hunted = true;
    const q = meetAt(prey), g = launch(S, 'elf', 'partisans', POSTS.korni.at, [q.x, q.z], Math.min(fighters - 2, range(rnd, 4, 6)), { target: null });
    if (g) g.prey = prey.id;
    return !!g;
  }

  const villainPlayer = S => !!S.campaign && S.campaign.side === 'villain';

  function plan(S, rnd) {
    const E = state(S), day = S.day || 1, G = E.sides.guard, L = E.sides.elf, V = E.sides.villain, P = E.posts, auto = !villainPlayer(S);
    const recruits = auto && day >= 3 ? Math.min(90 - V.men, 2 + (rnd() < 0.5 ? 1 : 0)) : 0;
    if (recruits > 0 && V.stock.silver >= recruits * 10) { V.men += recruits; V.stock.silver -= recruits * 10; }
    heal(S);
    G.men = Math.min(110, G.men + (rnd() < 0.6 ? 1 : 0));
    if (L.fighters < 8 && L.people - L.fighters > 14 && rnd() < 0.4) L.fighters++;
    V.stock.iron += P.mines.side === 'villain' ? 6 : 0;
    V.stock.bread -= Math.round(V.men * 0.5);
    if (V.stock.bread < 0) { V.morale = Math.max(0, V.morale - 6); V.stock.bread = 0; }
    if (auto) {
      V.morale = Math.min(100, V.morale + (day % 7 === 0 && V.stock.silver >= V.men * 5 ? 8 : 0));
      if (day % 7 === 0) V.stock.silver = Math.max(0, V.stock.silver - V.men * 5);
      if (day >= 21 && V.stock.logs >= 20 && V.ladders < 6) { V.stock.logs -= 20; V.ladders++; }
      if (day >= 24 && V.stock.logs >= 60 && !V.ram) { V.stock.logs -= 60; V.ram = 1; }
    }
    if (day >= 20) G.walls = Math.min(5, G.walls + 1);
    const out = (side, kind, from, to, n, o) => launch(S, side, kind, from, to, n, o);
    if (!(S.campaign && S.campaign.intro && S.campaign.intro.villain)) out('guard', 'patrol', POSTS.palace.gate, [778, 760], 4);
    if (auto && P.cutters.side === 'villain') out('villain', 'logging', POSTS.fort.gate, POSTS.cutters.at, 6, { target: 'cutters' });
    const fighters = L.fighters;
    if (fighters >= 4) {
      const choices = [['tower', 3], ['lesoseka', 3], ['cutters', 4]].filter(([t]) => P[t].side !== 'elf');
      const weights = choices.map(([t, w]) => w * (E.sides[P[t].side].anger.elf > 30 ? 0.5 : 1) * (strength(S)[P[t].side] > 60 ? 1.3 : 1));
      if (!ambushPlan(S, rnd, fighters) && rnd() < 0.35 && choices.length) {
        let r = rnd() * weights.reduce((a, b) => a + b, 0), pick = choices[0][0];
        for (let i = 0; i < choices.length; i++) { r -= weights[i]; if (r <= 0) { pick = choices[i][0]; break; } }
        out('elf', 'partisans', POSTS.korni.at, POSTS[pick].at, Math.min(fighters - 2, range(rnd, 3, 6)), { target: pick, fire: pick !== 'tower' });
        if (P[pick].side === 'guard') E.sides.guard.anger.elf += 20;
      }
      if (day % 4 === 1 && rnd() < 0.6) out('elf', 'spy', POSTS.korni.at, POSTS.fort.gate, 1, { target: 'fort' });
    }
    if (auto && day === 8 && P.outpost.side === 'guard') out('villain', 'outpost', POSTS.fort.gate, POSTS.outpost.at, Math.min(V.men - 10, 18), { target: 'outpost' });
    if (auto && day >= 9 && day <= 24 && day % 3 === 0 && V.men >= 30) out('villain', 'raid', POSTS.fort.gate, POSTS.korni.at, 8, { target: 'korni', fire: true });
    if (auto && day >= 3 && day % 2 === 0) out('villain', 'spy', POSTS.fort.gate, POSTS.palace.gate, 1, { target: 'palace' });
    if (day >= 9 && G.anger.elf >= 30 && G.men >= 50) { out('guard', 'punish', POSTS.palace.gate, POSTS.korni.at, range(rnd, 10, 12), { target: 'korni', fire: true, dogs: true }); G.anger.elf = Math.max(0, G.anger.elf - 30); }
    if (day >= 12 && P.outpost.side === 'villain' && G.men >= 75 && day % 5 === 2) out('guard', 'relief', POSTS.palace.gate, POSTS.outpost.at, 14, { target: 'outpost' });
    if (auto && !E.assault && (readiness(S) >= 100 || day >= 45) && V.men >= 40) { const n = Math.min(V.men - 6, 90); E.assault = { day, n }; const ga = out('villain', 'assault', POSTS.fort.gate, POSTS.palace.gate, n, { target: 'palace' }); if (ga && V.ram) ga.via = 'forest'; report(S, 'all', `Злой идёт на штурм дворца: ${n} чел., готовность ${V.readiness} %`, POSTS.fort.gate, 3); }
  }

  function powerOf(S, g) {
    const pos = g.at, forest = K.Terrain && S.T ? S.T.zoneAt(pos[0], pos[2]) === 3 : false;
    return g.n * POWER[g.side] * (g.side === 'elf' && forest ? 1.5 : 1) * (g.dogs ? 1.1 : 1);
  }

  function battle(S, a, b, rnd, events, place) {
    const E = state(S), pa = a.power, pb = b.power, r = pa / Math.max(0.1, pb), win = rnd() < (r * r) / (1 + r * r) ? a : b, lose = win === a ? b : a;
    const lossL = Math.max(1, Math.min(lose.n, Math.ceil(lose.n * RETREAT + rnd() * 1.5)));
    const ratio = (lose === a ? pb : pa) / Math.max(0.1, (lose === a ? pa : pb));
    const lossW = Math.min(win.n - (win.n > 1 ? 1 : 0), Math.round(lossL / Math.max(0.6, ratio) * (0.4 + rnd() * 0.5)));
    lose.n -= lossL;
    win.n -= lossW;
    const hurt = (side, n) => { const k = Math.floor(n * (side === 'elf' ? 0.6 : 0.4)); if (k > 0) (E.hurt || (E.hurt = [])).push({ side, n: k, day: (S.day || 1) + 3 }); };
    hurt(lose.side, lossL);
    hurt(win.side, lossW);
    E.stats.battles++;
    E.stats.dead[lose.side] = (E.stats.dead[lose.side] || 0) + lossL;
    E.stats.dead[win.side] = (E.stats.dead[win.side] || 0) + lossW;
    (E.wins[win.side] || (E.wins[win.side] = [])).push(S.day || 1);
    const at = place || a.at;
    E.traces.push({ id: 't' + E.next++, at: at.slice(), day: S.day || 1, time: S.time, dead: [[lose.side, lossL], [win.side, lossW]].filter(x => x[1] > 0), fire: !!(win.fire && win === a), done: false });
    events.push({ kind: 'battle', winner: win.side, loser: lose.side, lossW, lossL, at: at.slice() });
    return { win, lose, lossW, lossL };
  }

  function arrive(S, g, rnd, events) {
    const E = state(S), t = g.target ? POSTS[g.target] : null, post = g.target ? E.posts[g.target] : null;
    if (g.kind === 'patrol' || g.kind === 'logging' && post && post.side === g.side) {
      if (g.kind === 'logging' && !(post.idle > (S.day || 1))) { E.sides.villain.stock.logs += 12 + range(rnd, 0, 6); }
      return home(S, g);
    }
    if (g.kind === 'spy') {
      if (g.side === 'villain') {
        const caught = rnd() < 0.3 + E.sides.guard.alarm * 0.1;
        if (caught) { E.sides.villain.men--; E.sides.guard.alarm = Math.min(3, E.sides.guard.alarm + 1); report(S, 'guard', 'У ворот пойман шпион Злого', g.at, 2); }
        else { E.sides.villain.intel = Math.min(3, E.sides.villain.intel + 1); report(S, 'villain', 'Шпион вернулся со сведениями о дворце', g.at, 1); }
      } else {
        const caught = rnd() < 0.35;
        if (caught) { E.sides.elf.fighters--; E.sides.elf.people--; report(S, 'villain', 'В форте пойман эльф-лазутчик', g.at, 2); }
        else { const V = E.sides.villain; V.stock.logs = Math.max(0, V.stock.logs - 20); if (V.ladders) V.ladders--; report(S, 'elf', 'Лазутчики подожгли склад брёвен в форте', g.at, 2); E.traces.push({ id: 't' + E.next++, at: POSTS.fort.at.slice(), day: S.day || 1, time: S.time, dead: [], fire: true, done: false }); }
      }
      g.n = 0;
      g.state = 'done';
      return;
    }
    if (g.prey) return ambush(S, g, rnd, events);
    if (g.kind === 'recruit') return recruit(S, g, rnd, events);
    if (g.kind === 'ambush') { report(S, g.side, 'Засада прождала напрасно: корован не прошёл', g.at, 1); return home(S, g); }
    if (!t || !post) return home(S, g);
    if (post.side === g.side) return home(S, g);
    const village = g.target === 'korni' ? Math.max(0, E.sides.elf.people - E.sides.elf.fighters) * 0.35 : 0;
    const defMen = g.target === 'korni' ? Math.max(0, E.sides.elf.fighters - away(S, 'elf')) : g.target === 'palace' ? Math.max(4, E.sides.guard.men - away(S, 'guard')) : g.target === 'fort' ? Math.max(4, E.sides.villain.men - away(S, 'villain')) : post.men;
    const wall = t.walls ? (g.target === 'palace' ? 2.2 + E.sides.guard.walls * 0.15 - (E.sides.villain.ladders >= 4 ? 0.5 : 0) - (E.sides.villain.ram ? 0.5 : 0) - E.sides.villain.intel * 0.1 : 1.8) : 1;
    const tower = g.target === 'korni' && S.village && S.village.upgrades.tower ? 1.1 : 1;
    const def = { side: post.side, n: defMen, power: (defMen * POWER[post.side] * wall + village) * (t.forest && post.side === 'elf' ? 1.5 : 1) * (g.target === 'korni' ? 1.3 : 1) * tower, at: t.at, fire: false };
    g.power = powerOf(S, g) * (g.target === 'korni' && K.Elves ? K.Elves.trapFactor(S) : 1);
    if (g.target === 'korni' && K.Elves && S.village) { const hit = K.Elves.springFar(S, rnd); if (hit) { g.n = Math.max(1, g.n - hit); report(S, 'elf', `Ловушки у Корней: попались ${hit}`, t.at, 1); } }
    if (def.n <= 0 && !village) return take(S, g, t, post, events, rnd);
    const res = battle(S, g, def, rnd, events, t.at);
    lostOnRoad(S, g);
    applyDefenders(S, g.target, post, def.n);
    if (res.win === g) take(S, g, t, post, events, rnd);
    else { report(S, post.side, `${t.name}: ${NAMES[g.kind]} отбит, у врага потери ${res.lossL}`, t.at, 2); home(S, g); }
    if (g.kind === 'assault') {
      E.assault.result = res.win === g ? 'taken' : 'repelled';
      E.assault.ended = S.day || 1;
      report(S, 'all', res.win === g ? `Дворец пал: знамя ${evilOf(S)} на Белой башне` : 'Штурм дворца отбит', t.at, 3);
      events.push({ kind: 'assault', result: E.assault.result });
    }
  }

  const away = (S, side) => state(S).groups.filter(g => g.side === side && g.state !== 'done').reduce((m, g) => m + g.n, 0);

  function applyDefenders(S, id, post, left) {
    const E = state(S);
    if (id === 'korni') E.sides.elf.fighters = Math.max(0, away(S, 'elf') + left);
    else if (id === 'palace') E.sides.guard.men = Math.max(0, away(S, 'guard') + left);
    else if (id === 'fort') E.sides.villain.men = Math.max(0, away(S, 'villain') + left);
    else post.men = Math.max(0, left);
  }

  function take(S, g, t, post, events, rnd) {
    const E = state(S), id = g.target;
    if (id === 'korni') {
      const n = g.fire ? Math.min(E.sides.elf.houses, range(rnd, 1, 2)) : 0, live = g.live && S.village && S.village.live;
      const burnt = live ? 0 : K.Elves ? K.Elves.burnFar(S, n, rnd) : n;
      if (!K.Elves) E.sides.elf.houses -= burnt;
      E.sides.elf.burnt += burnt;
      E.sides.elf.stock.food = Math.max(0, E.sides.elf.stock.food - 20);
      const lost = Math.min(E.sides.elf.people - E.sides.elf.fighters, range(rnd, 0, 2));
      E.sides.elf.people -= lost;
      if (g.side === 'villain') E.sides.villain.stock.logs += 25;
      E.traces.push({ id: 't' + E.next++, at: t.at.slice(), day: S.day || 1, time: S.time, dead: lost ? [['elf', lost]] : [], fire: burnt > 0, done: false });
      if (K.Elves) K.Elves.sync(S);
      report(S, 'elf', live ? 'Набег на Корни отошёл' : `Набег на Корни: сгорело домов ${burnt}`, t.at, 3);
    } else if (t.work) {
      if (t.work === 'logs') E.sides.villain.stock.logs = Math.max(0, E.sides.villain.stock.logs - 30);
      post.idle = (S.day || 1) + 2;
      post.men = Math.max(2, post.men);
      report(S, post.side, `${t.name} ${g.target === 'cutters' ? 'сожжён' : 'сожжена'}`, t.at, 2);
      if (g.fire) E.traces.push({ id: 't' + E.next++, at: t.at.slice(), day: S.day || 1, time: S.time, dead: [], fire: true, done: false });
    } else if (id === 'tsarevo') {
      const V = E.sides.villain;
      V.stock.silver = (V.stock.silver || 0) + 60;
      V.stock.bread = (V.stock.bread || 0) + 30;
      E.sides.guard.anger.villain = (E.sides.guard.anger.villain || 0) + 20;
      report(S, 'all', 'Набег на Царёво: дома ограблены', t.at, 2);
      if (g.fire) E.traces.push({ id: 't' + E.next++, at: t.at.slice(), day: S.day || 1, time: S.time, dead: [], fire: true, done: false });
    } else if (id === 'outpost' || id === 'tower' || id === 'mines') {
      post.side = g.side;
      post.men = Math.max(3, Math.round(g.n * 0.6));
      g.n -= post.men;
      g.start -= post.men;
      report(S, 'all', `${t.name} в руках: ${g.side === 'villain' ? 'Злой' : g.side === 'elf' ? 'эльфы' : 'империя'}`, t.at, 2);
    }
    home(S, g);
  }

  function ambush(S, g, rnd, events) {
    const E = state(S), c = S.caravans && K.Caravan.byId(S, g.prey);
    if (!c || c.live || c.done || c.state === 'stopped') return home(S, g);
    const q = K.Terrain.pointAt(K.Caravan.routes()[c.kind].line, c.s);
    if (Math.hypot(q.x - g.at[0], q.z - g.at[2]) > 220) return home(S, g);
    const owner = K.Caravan.KINDS[c.kind].crew === 'guard' ? 'guard' : K.Caravan.KINDS[c.kind].crew === 'villain' ? 'villain' : 'guard';
    const guards = c.crew.filter(m => m.role === 'escort').length, def = { side: owner, n: guards, power: guards * POWER[owner], at: [q.x, 0, q.z], fire: false };
    g.power = powerOf(S, g) * 1.2;
    const res = guards ? battle(S, g, def, rnd, events, [q.x, q.z]) : { win: g };
    lostOnRoad(S, g);
    if (res.win === g) {
      let kept = guards - (res.lossL || 0);
      c.crew = c.crew.filter(m => m.role !== 'escort' || kept-- > 0);
      c.crew = c.crew.filter(m => m.role !== 'escort');
      if (!c.seen.includes(g.side)) c.seen.push(g.side);
      c.robbed = true;
      const L = E.sides[g.side].stock, loot = { silver: 0, iron: 0, bread: 0, cloth: 0 };
      for (const cart of c.carts) {
        for (const b of cart.bales) { if (b === 'iron' || b === 'ore') loot.iron += 1; else if (b === 'cloth') loot.cloth += 1; else loot.bread += 2; }
        loot.silver += cart.silver || 0;
        cart.bales = [];
        cart.silver = 0;
      }
      if (g.side === 'elf') { L.iron += loot.iron; L.cloth += loot.cloth; L.food += loot.bread; }
      else { L.iron = (L.iron || 0) + loot.iron * 2; L.bread = (L.bread || 0) + loot.bread; L.silver = (L.silver || 0) + loot.silver + loot.cloth * 4; }
      g.loot = loot;
      c.state = 'stopped';
      c.why = 'guards';
      if (!c.lost) { c.lost = true; S.caravans.stats.lost[c.kind] = (S.caravans.stats.lost[c.kind] || 0) + 1; events.push({ kind: 'lost', caravan: c, why: 'guards' }); }
      K.Caravan.testify(S, c, [g.side], events);
      report(S, g.side, (g.side === 'elf' ? 'Засада на Лесной дороге: ' : 'Засада на дороге: ') + K.Caravan.KINDS[c.kind].name + ' ограблен', [q.x, 0, q.z], 2);
    } else { report(S, owner, `Охрана корована отбила засаду ${g.side === 'elf' ? 'эльфов' : 'людей Злого'}`, [q.x, 0, q.z], 1); }
    home(S, g);
  }

  function recruit(S, g, rnd, events) {
    const V = state(S).sides.villain, n = Math.min(90 - V.men, range(rnd, 2, 4), Math.floor((V.stock.silver || 0) / 10));
    if (n > 0) { V.stock.silver -= n * 10; V.men += n; g.recruits = n; }
    report(S, 'villain', n > 0 ? `Вербовка: пришли ${n} чел.` : 'Вербовка: никого не нашли', g.at, 1);
    events.push({ kind: 'recruited', n: Math.max(0, n), group: g });
    home(S, g);
  }

  function liveArrive(S, g, rnd, events) {
    if (g.kind === 'assault' && S.guard && S.guard.siege) return;
    const E = state(S), t = g.target ? POSTS[g.target] : null, post = g.target ? E.posts[g.target] : null;
    if (g.kind === 'recruit') return recruit(S, g, rnd, events);
    if (g.prey) return ambush(S, g, rnd, events);
    if (g.kind === 'spy' || !t || !post || post.side === g.side || g.kind === 'patrol' || g.kind === 'logging' || g.kind === 'ambush') { if (g.kind === 'logging' && !(post && post.idle > (S.day || 1))) E.sides.villain.stock.logs += 12; return home(S, g); }
    take(S, g, t, post, events, rnd);
  }

  function home(S, g) {
    if (g.back) { finish(S, g); return; }
    g.back = true;
    g.s = 0;
    g.line = null;
    g.state = 'go';
  }

  function finish(S, g) {
    const E = state(S);
    g.state = 'done';
    if (g.side === 'elf') E.sides.elf.fighters = Math.min(E.sides.elf.people, E.sides.elf.fighters);
  }

  function lostOnRoad(S, g) {
    const E = state(S), s = E.sides[g.side], lost = g.start - g.n;
    if (lost <= 0) return;
    if (g.side === 'elf') { s.fighters = Math.max(0, s.fighters - lost); s.people = Math.max(0, s.people - Math.ceil(lost * 0.6)); }
    else s.men = Math.max(0, s.men - lost);
    g.start = g.n;
  }

  function meet(S, rnd, events) {
    const E = state(S), active = E.groups.filter(g => g.state === 'go' && !g.live && g.n > 0);
    for (let i = 0; i < active.length; i++) for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (!hostile(a.side, b.side) || a.kind === 'spy' || b.kind === 'spy' || flat(a.at, b.at) > CONTACT || a.n <= 0 || b.n <= 0) continue;
      a.power = powerOf(S, a);
      b.power = powerOf(S, b);
      const res = battle(S, a, b, rnd, events, a.at);
      for (const g of [a, b]) { lostOnRoad(S, g); if (g === res.lose || g.n <= g.start * 0.5) home(S, g); }
    }
  }

  function wake(S, g, W) {
    const E = state(S);
    if (g.crew.length > g.n) g.crew.splice(g.n);
    if (!g.crew.length) for (let i = 0; i < g.n; i++) { const p = K.Body.member(S.nextId++, g.side, 0, 0, 0, W); p.role = g.kind === 'spy' ? 'spy' : 'raider'; if (g.kind === 'spy') { p.kit = K.Body.kit('town', null, K.rng(p.id)); p.name = K.Body.nameFor('town', p.kit.fig, p.id); p.fight = K.Combat.fighter({ weapon: 'knife' }); } g.crew.push(p); }
    const line = g.line || pathOf(W, g.from, g.to, g.side);
    g.crew.forEach((p, i) => {
      const q = K.Terrain.pointAt(line, Math.max(0, g.s - i * 1.6));
      p.mv = K.Move.body(W, q.x, q.z, Math.atan2(q.tx, -q.tz));
      p.march = { id: g.id, slot: i };
      if (!p.anim) p.anim = K.Anim.state();
      S.people.push(p);
    });
    g.crew = [];
    g.live = true;
  }

  function sleep(S, g) {
    const crew = S.people.filter(p => p.march && p.march.id === g.id || p.stormed === g.id);
    for (const p of crew) { S.people.splice(S.people.indexOf(p), 1); p.brain = null; p.anim = null; g.crew.push(p); }
    g.n = crew.filter(p => p.fight && !p.fight.down && !p.state).length;
    g.crew = g.crew.filter(p => p.fight && !p.fight.down && !p.state);
    lostOnRoad(S, g);
    g.live = false;
  }

  function slotOf(S, p) {
    if (!p.march) return null;
    const g = state(S).groups.find(x => x.id === p.march.id);
    if (!g || !g.live || !g.line) return null;
    const q = K.Terrain.pointAt(g.line, Math.max(0, g.s - p.march.slot * 1.6)), side = (p.march.slot % 2 ? 1 : -1) * 0.8;
    return [q.x - q.tz * side, q.z + q.tx * side];
  }

  function traces(S, W, focus) {
    const E = state(S);
    for (const t of E.traces) {
      if (t.done || !focus || Math.hypot(t.at[0] - focus[0], t.at[1] - focus[2]) > TRACE_NEAR) continue;
      t.done = true;
      let k = 0;
      for (const [side, n] of t.dead) for (let i = 0; i < Math.min(n, 6); i++, k++) {
        const a = k * 2.4 + (t.id.length * 0.7), r = 2 + (k % 4) * 2.2, x = t.at[0] + Math.cos(a) * r, z = t.at[1] + Math.sin(a) * r;
        const kit = K.Body.kit(side, null, K.rng(S.nextId * 7 + k)), fig = K.Body.figure(kit), frames = K.Body.fk(fig, K.Body.restPose(), [x, W.terrain.heightAt(x, z), z], a);
        const body = K.Body.fall(kit, frames, { id: S.nextId++, vel: [0, 0, 0], push: [Math.cos(a) * 1.5, 0.2, Math.sin(a) * 1.5], sack: K.Body.sackFor(side, K.rng(S.nextId)), born: S.time });
        body.cause = 'dead';
        body.who = { team: side, name: K.Body.nameFor(side, kit.fig, S.nextId), debt: 0 };
        S.bodies.push(body);
        if (K.Wounds && K.Wounds.pool) K.Wounds.pool(S, x, z, 0.12, S.time, W.terrain.heightAt(x, z));
      }
      if (t.fire) (S.smokes || (S.smokes = [])).push({ at: [t.at[0], W.terrain.heightAt(t.at[0], t.at[1]), t.at[1]], until: S.time + 1800, id: t.id });
      S.version = (S.version || 0) + 1;
    }
    E.traces = E.traces.filter(t => (S.day || 1) - t.day < TRACE_DAYS);
    if (S.smokes) S.smokes = S.smokes.filter(s => s.until > S.time);
  }

  function bury(S, dt) {
    const E = state(S);
    E.buryT = (E.buryT || 0) + dt;
    if (E.buryT < BURY_EVERY) return;
    E.buryT = 0;
    const before = S.bodies.length;
    S.bodies = S.bodies.filter(b => { const a = K.Body.anchorOf(b); return !(b.frozen && !b.carrier && S.time - (b.born || 0) > BURY_AGE && K.Places.inTown(a[0], a[2])); });
    const n = before - S.bodies.length;
    if (n) { E.buried += n; S.version = (S.version || 0) + 1; }
  }

  function react(S, events) {
    const E = state(S);
    for (const e of events) {
      if (e.kind === 'witness') {
        const owner = e.owner === 'town' ? null : e.owner;
        for (const side of e.sides) {
          if (side === 'player' || side === 'town') continue;
          if (owner && E.sides[owner] && E.sides[owner].anger[side] !== undefined) E.sides[owner].anger[side] += e.caravan.kind === 'treasury' ? 40 : 15;
          if (e.owner === 'town' && E.sides.guard.anger[side] !== undefined) E.sides.guard.anger[side] += 10;
        }
      } else if (e.kind === 'lost' && e.caravan) {
        const V = E.sides.villain;
        if (e.caravan.kind === 'ore') V.stock.silver = Math.max(0, V.stock.silver - 150);
        if (e.caravan.kind === 'bread') { V.stock.bread = Math.max(0, V.stock.bread - 80); V.morale = Math.max(0, V.morale - 6); }
        report(S, KINDS_OWNER[e.caravan.kind], 'Пропал ' + K.Caravan.KINDS[e.caravan.kind].name, null, 2);
      } else if (e.kind === 'arrived' && e.caravan) {
        if (e.caravan.kind === 'ore') E.sides.villain.stock.silver += 150;
        if (e.caravan.kind === 'bread') E.sides.villain.stock.bread += 90;
      }
    }
  }
  const KINDS_OWNER = { trade: 'town', treasury: 'guard', ore: 'villain', bread: 'villain' };

  function pursue(S, W, events) {
    if (!S.caravans || !S.player) return;
    const E = state(S);
    for (const c of S.caravans.list) {
      if (c.state !== 'led' || c.chased) continue;
      const owner = K.Caravan.KINDS[c.kind].owner;
      if (owner === 'town') { c.chased = true; continue; }
      c.chased = true;
      const lead = c.carts[0].pos, line = K.Caravan.routes()[c.kind].line, back = K.Terrain.pointAt(line, Math.max(0, K.Terrain.nearest(line, lead[0], lead[2]).s - 45));
      const g = launch(S, owner, 'pursuit', [back.x, back.z], [lead[0], lead[2]], 4, { target: null });
      wake(S, g, W);
      for (const p of S.people) if (p.march && p.march.id === g.id) { p.fight.hostile = S.player; const B = p.brain || (p.brain = K.AI.brain()); B.last = S.player.mv.pos.slice(); B.lostT = 0; B.ignoreUntil = 0; }
      events.push({ kind: 'pursuit', caravan: c, side: owner });
    }
  }

  function step(S, dt, W, rnd, events) {
    const E = state(S), focus = S.player ? S.player.mv.pos : S.focus || null;
    S.T = W.terrain;
    if ((S.hour || 0) >= PLAN_HOUR && E.planned < (S.day || 1)) { E.planned = S.day || 1; plan(S, rnd); }
    if ((S.hour || 0) >= 12 && (E.noon || 0) < (S.day || 1) && E.planned < 900) { E.noon = S.day || 1; ambushPlan(S, rnd, E.sides.elf.fighters - away(S, 'elf')); }
    E.acc = (E.acc || 0) + dt;
    const far = E.acc >= TICK;
    const fdt = E.acc;
    if (far) E.acc = 0;
    for (const g of E.groups) {
      if (g.state === 'done') continue;
      if (!g.line) g.line = lineOf(W, g);
      g.at = posOf(W, g);
      const d = focus ? flat(focus, g.at) : Infinity;
      if (!g.live && d < NEAR && g.n > 0) wake(S, g, W);
      else if (g.live && d > FAR) sleep(S, g);
      if (g.live) {
        const crew = S.people.filter(p => p.march && p.march.id === g.id || p.stormed === g.id), able = crew.filter(p => p.fight && !p.fight.down && !p.state);
        if (!able.length) { g.n = 0; lostOnRoad(S, g); g.state = 'done'; continue; }
        if (able.length <= g.start * (1 - RETREAT) && !g.back && !(g.kind === 'assault' && S.guard && S.guard.siege)) { g.n = able.length; lostOnRoad(S, g); home(S, g); for (const p of able) p.fight.hostile = null; continue; }
        const fighting = able.some(p => p.fight.hostile && !p.fight.hostile.fight.down);
        g.quiet = fighting ? 0 : g.quiet + dt;
        const late = able.some(p => { if (!p.march) return false; const sp = slotOf(S, p); return sp && Math.hypot(sp[0] - p.mv.pos[0], sp[1] - p.mv.pos[2]) > 10; });
        if (g.quiet > 3 && !late) g.s += WALK * dt;
        g.n = able.length;
      } else if (far) g.s += WALK * fdt;
      if (g.s >= g.line.length) {
        g.s = g.line.length;
        if (g.back) { if (g.live) sleep(S, g); finish(S, g); }
        else if (g.kind === 'pursuit') { g.state = 'done'; }
        else if (g.live) { g.wait += dt; if (g.wait > 40 && g.quiet > 10) { g.wait = 0; liveArrive(S, g, rnd, events); } }
        else { g.line = null; arrive(S, g, rnd, events); }
      }
    }
    if (far) meet(S, rnd, events);
    E.groups = E.groups.filter(g => g.state !== 'done' || g.live);
    for (const g of E.groups) if (g.state === 'done' && g.live) { for (const p of S.people) if (p.march && p.march.id === g.id) p.march = null; g.live = false; }
    E.groups = E.groups.filter(g => g.state !== 'done');
    traces(S, W, focus);
    bury(S, dt);
    pursue(S, W, events);
    for (const side of ['guard', 'elf', 'villain']) for (const k of Object.keys(E.sides[side].anger)) E.sides[side].anger[k] = Math.max(0, E.sides[side].anger[k] - dt / (HOUR * 24) * 2);
    readiness(S);
  }

  function run(S, dt, W, rnd) {
    const events = [];
    step(S, dt, W, rnd, events);
    return events;
  }

  function alive(S) {
    const s = state(S).sides;
    return { guard: s.guard.men > 10, elf: s.elf.people > 10, villain: s.villain.men > 5 };
  }

  function nextTreasury(S) {
    const k = K.Caravan.KINDS.treasury, day = S.day || 1;
    for (let d = day; d < day + 8; d++) if ((d - k.at) % k.every === 0 && (d > day || (S.hour || 0) < k.hour)) return d;
    return null;
  }

  function spyNews(S) {
    const g = state(S).groups.find(x => x.kind === 'spy' && x.side === 'villain' && x.state === 'go' && !x.back);
    return g ? g : null;
  }

  function reportsFor(S, side, n) {
    return state(S).reports.filter(r => r.side === side || r.side === 'all').slice(-(n || 12));
  }

  const SKIP = 4;
  function skip(S, W, hours, rnd) {
    const P = S.player, focus = S.focus, out = [];
    S.player = null;
    S.focus = null;
    const h0 = S.hour || 0, d0 = S.day || 1, total = hours * HOUR;
    try {
      for (let done = 0; done < total - 1e-6;) {
        const dt = Math.min(SKIP, total - done), t0 = S.time || 0;
        done += dt;
        const abs = h0 + done / HOUR, days = Math.floor(abs / 24 + 1e-9);
        S.day = d0 + days;
        S.hour = Math.max(0, abs - days * 24);
        S.time = t0 + dt;
        const ev = K.Caravan && S.caravans ? K.Caravan.run(S, dt, W, rnd) : [];
        if (S.world) ev.push(...run(S, dt, W, rnd));
        if (S.world && K.Elves) ev.push(...K.Elves.run(S, dt, W, rnd));
        if (S.world && K.Guard) ev.push(...K.Guard.run(S, dt, W, rnd));
        if (S.world && K.Villain) ev.push(...K.Villain.run(S, dt, W, rnd));
        if (K.Caravan && S.caravans) K.Caravan.react(S, ev);
        if (S.world) react(S, ev);
        for (const e of ev) out.push(e);
      }
    } finally {
      S.player = P;
      S.focus = focus;
    }
    return out;
  }

  const TRAVEL = 4.3, DANGER = ['спокойно', 'опасно', 'очень опасно'], HOLDER = { guard: 'империи', elf: 'эльфов', villain: 'людей Злого' };
  function trip(S, W, from, to, side) {
    const E = state(S), line = pathOf(W, from, to, side), why = [], T = W.terrain, foe = s => K.AI.enemies(side, s);
    const pts = [];
    for (let s = 0; s <= line.length; s += 25) { const p = K.Terrain.pointAt(line, s); pts.push([p.x, p.z]); }
    pts.push(to.slice());
    const near = (at, r) => pts.some(q => Math.hypot(q[0] - at[0], q[1] - at[at.length - 1]) < r);
    let level = 0;
    const night = (S.hour || 0) >= 21 || (S.hour || 0) < 6, wild = pts.some(q => T.zoneAt(q[0], q[1]) >= 3);
    if (night && wild) { why.push('ночью в лесу и в горах ходят волки'); level = 1; }
    for (const [id, p] of Object.entries(E.posts)) if (foe(p.side) && near(POSTS[id].at, 70)) { const n = POSTS[id].name; why.push(n[0].toUpperCase() + n.slice(1) + ' в руках: ' + HOLDER[p.side]); level = 2; }
    for (const g of E.groups) if (g.state !== 'done' && foe(g.side) && near(g.at, 120)) { why.push(NAMES[g.kind] + ' на пути: ' + g.n + ' чел.'); level = 2; }
    for (const t of E.traces) if ((S.day || 1) - t.day <= 1 && near(t.at, 100)) { why.push('недавно здесь был бой'); level = Math.max(level, 1); break; }
    return { pts: line.pts, length: line.length, time: line.length / TRAVEL, hours: line.length / TRAVEL / HOUR, danger: level, word: DANGER[level], why };
  }

  K.World = { villainPlayer, villainName, evil, evilOf, goatWay, POSTS, HOME, POWER, READY, NAMES, NEAR, HOUR, TRAVEL, DANGER, state, plan, launch, run, step, battle, readiness, strength, mercFactor, slotOf, react, alive, nextTreasury, spyNews, reportsFor, pathOf, wake, sleep, bury, report, skip, trip };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
