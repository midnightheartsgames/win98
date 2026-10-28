(function (K) {
  'use strict';

  const P = K.Places, KO = P.KORNI;
  const HOUSES = Object.freeze(P.BUILDINGS.filter(b => b.korni).map(b => b.id));
  const NEAR = 260, FAR = 330, SPREAD = 4.5, BURN = 1.15, GROW = 0.035, CATCH = 0.08, POUR = 0.36, CHAIN = 0.18, FILL = 1.5, IGNITE = 2.5, CALL = 40, TRAP_R = 0.9, HOLD_PIT = 5, HOLD_SNARE = 6, ID0 = 90000;
  const PLAN_HOUR = 6;
  const NAMES = Object.freeze({
    m: ['Вереск', 'Терн', 'Тис', 'Клён', 'Хмель', 'Камыш', 'Явор', 'Граб', 'Дрок', 'Бук', 'Остролист', 'Кедр', 'Орешник', 'Багульник', 'Можжевел', 'Боярышник', 'Плаун', 'Аир', 'Шиповник', 'Берест'],
    f: ['Ива', 'Калина', 'Липа', 'Осока', 'Черёмуха', 'Верба', 'Мята', 'Брусника', 'Купава', 'Ракита', 'Ежевика', 'Морошка', 'Медуница', 'Лещина', 'Душица', 'Таволга', 'Полынь', 'Пихта', 'Ромашка', 'Купальница', 'Вишня']
  });
  const KEY = Object.freeze([
    { name: 'Вяз', fig: 'm', role: 'elder', house: 'izba-vyaz', job: 'council', fighter: false, look: { hairColor: [0.78, 0.78, 0.74], head: null, main: [0.38, 0.32, 0.22] } },
    { name: 'Ольха', fig: 'f', role: 'leader', house: 'izba-olha', job: 'watch', fighter: true, look: { hairColor: [0.55, 0.3, 0.16], head: 'hood', main: [0.28, 0.33, 0.2] } },
    { name: 'Рябина', fig: 'f', role: 'healer', house: 'ryabina', job: 'heal', fighter: false, look: { hairColor: [0.62, 0.22, 0.12], head: null, main: [0.42, 0.4, 0.24] } },
    { name: 'Ясень', fig: 'm', role: 'carver', house: 'yasen', job: 'carve', fighter: false, look: { hairColor: [0.3, 0.22, 0.14], head: null, main: [0.4, 0.3, 0.2], pros: { lFore: 'carved' }, cut: { lFore: 'healed' } } },
    { name: 'Мох', fig: 'm', role: 'villager', house: 'izba-moh', job: 'wood', fighter: false, look: { hairColor: [0.36, 0.3, 0.18], head: null, main: [0.34, 0.3, 0.2] } }
  ]);
  const JOBS = ['wood', 'herbs', 'cook', 'craft', 'watch', 'hunt'];
  const SPOTS = Object.freeze({ council: [328, 691], wood: [352, 757], herbs: [384, 731], cook: [331, 686], craft: [306, 750], watch: [395, 660], hunt: [362, 766], heal: [377, 726], carve: [304, 745] });
  const UPGRADES = Object.freeze({
    tower: { name: 'Сторожевая вышка', gives: 'набег видно раньше, рог трубит за 500 м', cost: { wood: 30, silver: 40 } },
    abatis: { name: 'Колючая засека', gives: 'набег идёт по двум тропам вместо пяти: враг слабее на четверть', cost: { wood: 40, iron: 5 } },
    garden: { name: 'Огород Рябины', gives: 'бинты и настойки у Рябины даром', cost: { food: 10, silver: 40 } },
    workshop: { name: 'Мастерская Ясеня', gives: 'протезы Ясеня и Рябины даром', cost: { wood: 30, iron: 10, silver: 60 } },
    house4: { name: 'Четвёртый дом на помосте', gives: 'ещё четверо жителей', cost: { wood: 60, cloth: 10, silver: 120 } }
  });
  const REBUILD = Object.freeze({ wood: 30, silver: 40 });
  const STOCK = Object.freeze({ meat: ['food', 1], bread: ['food', 1], herbs: ['medicine', 0.5], baleBread: ['food', 3], baleGrain: ['food', 3], baleWine: ['food', 3], baleCloth: ['cloth', 3], baleMedicine: ['medicine', 3], baleOre: ['iron', 3], baleIron: ['iron', 3], hideWolf: ['cloth', 1], hideBear: ['cloth', 3], hideBoar: ['cloth', 1], hideDeer: ['cloth', 2], hideHare: ['cloth', 0.5], hideFox: ['cloth', 0.5], hideGoat: ['cloth', 1], bearFat: ['medicine', 1] });
  const GIVES = Object.freeze({ bandage: ['medicine', 1], tincture: ['medicine', 2], stakes: ['wood', 2], snare: ['cloth', 1], arrow: ['wood', 0.4] });
  const INTRO = Object.freeze(['wake', 'bow', 'sickle', 'road', 'fell', 'ambush', 'carry', 'smoke', 'fire', 'moh', 'elders', 'council', 'free']);
  const ENDINGS = Object.freeze({
    hold: { name: 'Лес держится', text: 'Корни целы. Обе стороны ушли из леса, и по тракту снова идёт корован с бубенцами.' },
    burnt: { name: 'Корни сгорели, но люди живы', text: 'Деревня уходит глубже в лес. Старший дуб стоит, на нём вырезают новые имена.' },
    lost: { name: 'Корни потеряны', text: 'Выжившие живут на болоте в Медвежьем углу. В Корнях остались только головешки и дуб.' }
  });

  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const town = S => P.town(S.T);
  const elfSide = S => !!S.campaign && S.campaign.side === 'elf';

  function roster() {
    const out = KEY.map((k, i) => Object.assign({ i, alive: true, debt: 0, wound: null, away: false }, k));
    const free = HOUSES.filter(h => !['ryabina', 'yasen'].includes(h));
    let m = 0, f = 0, fighters = 1;
    for (let i = KEY.length; i < 44; i++) {
      const fig = i % 2 ? 'f' : 'm', name = fig === 'm' ? NAMES.m[m++ % NAMES.m.length] : NAMES.f[f++ % NAMES.f.length];
      const fighter = fighters < 18 && (i % 5 !== 0);
      if (fighter) fighters++;
      out.push({ i, name, fig, role: fighter ? 'fighter' : 'villager', house: free[i % free.length], job: fighter ? (i % 3 ? 'watch' : 'hunt') : JOBS[i % 4], fighter, alive: true, debt: 0, wound: null, away: false });
    }
    return out;
  }

  function state(S) {
    if (S.village) return S.village;
    S.village = {
      houses: Object.fromEntries(HOUSES.map(id => [id, { hp: 100, fire: 0, burnt: false }])),
      people: roster(), live: false, upgrades: {}, traps: [], caches: {}, herbs: {}, oak: [], morning: { day: 0, lines: [] }, task: null, next: 1,
      stock: { silver: 20 }, version: 0, calls: 0
    };
    return S.village;
  }

  const stockOf = S => { const V = state(S), W = K.World ? K.World.state(S).sides.elf.stock : {}; return Object.assign(W, { silver: V.stock.silver }); };
  const intact = S => HOUSES.filter(id => !state(S).houses[id].burnt && (id !== 'nest-4' || state(S).upgrades.house4)).length;
  const burntKey = S => S.village ? HOUSES.filter(id => S.village.houses[id].burnt).join(',') : '';

  function respect(S, d, why) {
    const st = S.standing || (S.standing = { service: 0, respect: 0, loyalty: 0 });
    const before = st.respect || 0;
    st.respect = K.clamp(Math.round((before + d) * 10) / 10, -100, 100);
    return { before, after: st.respect, why };
  }

  function sync(S) {
    if (!K.World || !S.world) return;
    const V = state(S), E = K.World.state(S).sides.elf;
    E.houses = intact(S);
    let alive = V.people.filter(r => r.alive);
    while (alive.length > E.people) {
      const fighters = alive.filter(r => r.fighter).length, want = fighters > E.fighters;
      const pool = alive.filter(r => !r.spawned && r.i >= KEY.length && r.fighter === want);
      const r = pool.pop() || alive.filter(x => !x.spawned && x.i >= KEY.length).pop() || alive.filter(x => !x.spawned).pop();
      if (!r) break;
      die(S, r);
      alive = V.people.filter(x => x.alive);
    }
    for (let k = alive.filter(r => r.fighter).length; k < E.fighters; k++) {
      const r = alive.find(x => !x.fighter && x.role === 'villager' && x.i >= KEY.length);
      if (!r) break;
      r.fighter = true;
      r.role = 'fighter';
      r.job = 'watch';
    }
  }

  function die(S, r) {
    const V = state(S);
    r.alive = false;
    if (!V.oak.includes(r.name)) V.oak.push(r.name);
    V.version++;
  }

  function burnFar(S, n, rnd) {
    const V = state(S), pool = HOUSES.filter(id => !V.houses[id].burnt);
    let done = 0;
    for (let k = 0; k < n && pool.length; k++) {
      const id = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
      Object.assign(V.houses[id], { hp: 0, fire: 0, burnt: true });
      done++;
    }
    V.version++;
    sync(S);
    return done;
  }

  const homeOf = (S, r) => { const h = state(S).houses[r.house]; return h && !h.burnt ? r.house : 'shelter'; };

  function spotFor(S, r, hour) {
    const o = town(S), night = hour >= 21 || hour < 6, evening = hour >= 19 && hour < 21, house = homeOf(S, r);
    const bed = () => { const beds = o.beds.filter(b => b.building === house); if (beds.length) { const b = beds[r.i % beds.length]; return { at: b.at.slice(), face: b.yaw }; } return null; };
    if (S.village.alarm && !r.fighter) return { at: KO.shelter.slice(), face: 0 };
    const step = introStep(S);
    if (r.role === 'leader' && step === 'wake') { const d = o.doors[KO.hero]; return { at: [d.at[0] + Math.sin(d.face + Math.PI) * 1.2, d.at[1] - Math.cos(d.face + Math.PI) * 1.2], face: d.face }; }
    if (r.role === 'leader' && (step === 'bow' || step === 'sickle')) return { at: [KO.training.line[0] - 2, KO.training.line[1] + 3], face: Math.PI / 2 };
    if (r.role === 'healer') return night ? bed() || { at: o.keepers.ryabina.at.slice(), face: 0 } : { at: o.keepers.ryabina.at.slice(), face: o.keepers.ryabina.face };
    if (r.role === 'carver') return night && bed() ? bed() : { at: o.keepers.yasen.at.slice(), face: o.keepers.yasen.face };
    if (night) { const b = bed(); if (b) return b; const d = o.doors[house]; return d ? { at: d.inside.slice(), face: d.face } : { at: KO.shelter.slice(), face: 0 }; }
    if (evening || r.role === 'elder') { const a = (r.i * 2.399) % (Math.PI * 2), rad = r.role === 'elder' ? 1.6 : 2.6 + (r.i % 3) * 0.7; return { at: [KO.council[0] + Math.cos(a) * rad, KO.council[1] + Math.sin(a) * rad], face: Math.atan2(KO.council[0] - (KO.council[0] + Math.cos(a)), -(KO.council[1] - (KO.council[1] + Math.sin(a)))) }; }
    const s = SPOTS[r.job] || SPOTS.cook, j = (r.i * 1.618) % 1;
    return { at: [s[0] + (j - 0.5) * 7, s[1] + ((r.i * 0.37) % 1 - 0.5) * 6], face: j * 6.28 };
  }

  function makePerson(S, r, W) {
    const s = spotFor(S, r, S.hour || 0), p = K.Body.member(ID0 + r.i, 'elf', s.at[0], s.at[1], s.face, W, { kind: 'stand', post: s.at.slice(), face: s.face }, r.fig);
    p.name = r.name;
    p.role = r.role === 'fighter' ? 'villager' : r.role;
    p.villager = r.i;
    p.debt = r.debt || 0;
    if (r.look) { Object.assign(p.kit, r.look); p.kit.pros = Object.assign({}, r.look.pros || {}); p.kit.cut = Object.assign({}, r.look.cut || {}); }
    if (!r.fighter) { p.fight = K.Combat.fighter({}); p.sack = [{ id: 'bandage', n: 1 }]; }
    if (r.role === 'leader') { p.fight = K.Combat.fighter({ weapon: 'sickle', exp: 'veteran' }); p.sack = [{ id: 'bow', n: 1 }, { id: 'arrow', n: 18 }, { id: 'bandage', n: 3 }]; }
    if (r.wound) { p.kit.cut = Object.assign({}, p.kit.cut, r.wound.cut || {}); p.kit.pros = Object.assign({}, p.kit.pros, r.wound.pros || {}); if (r.wound.life !== undefined) p.fight.life = r.wound.life; }
    p.anim = K.Anim ? K.Anim.state() : null;
    p.frames = new Float32Array(132);
    return p;
  }

  function census(S, W) {
    const V = state(S), focus = S.player ? S.player.mv.pos : S.focus || null, d = focus ? Math.hypot(focus[0] - KO.at[0], focus[2] - KO.at[1]) : Infinity;
    if (!V.live && d < NEAR) {
      for (const r of V.people) if (r.alive && !r.away && !S.people.some(q => q.villager === r.i)) { S.people.push(makePerson(S, r, W)); r.spawned = true; }
      V.live = true;
      V.hourSet = -1;
    } else if (V.live && d > FAR) {
      for (const q of S.people.slice()) {
        if (q.villager === undefined) continue;
        const r = V.people[q.villager];
        r.debt = q.debt || 0;
        r.wound = { cut: Object.assign({}, q.kit.cut || {}), pros: Object.assign({}, q.kit.pros || {}), life: q.fight ? Math.min(100, q.fight.life) : 100 };
        r.spawned = false;
        S.people.splice(S.people.indexOf(q), 1);
      }
      V.live = false;
    }
  }

  function routine(S) {
    const V = state(S), hour = Math.floor(S.hour || 0), key = hour + ':' + (V.alarm ? 1 : 0) + ':' + burntKey(S) + ':' + introStep(S);
    if (!V.live || V.hourSet === key) return;
    V.hourSet = key;
    for (const q of S.people) {
      if (q.villager === undefined || q.squad === 'player' || q.bucket) continue;
      const s = spotFor(S, V.people[q.villager], S.hour || 0);
      q.act = { kind: 'stand', post: s.at, face: s.face };
    }
  }

  function corpses(S, events) {
    const V = state(S);
    for (const b of S.bodies) {
      if (!b.who || b.who.team !== 'elf' || b.counted) continue;
      const r = V.people.find(x => x.name === b.who.name && x.spawned);
      if (!r || b.cause === 'ko') continue;
      b.counted = true;
      r.spawned = false;
      die(S, r);
      if (K.World && S.world) { const E = K.World.state(S).sides.elf; E.people = Math.max(0, E.people - 1); if (r.fighter) E.fighters = Math.max(0, E.fighters - 1); }
      events.push({ kind: 'villagerDead', name: r.name, near: S.player && flat(S.player.mv.pos, K.Body.anchorOf(b)) < 30 });
    }
  }

  function houseInfo(S, id) { return town(S).houses[id]; }

  function houseAt(S, pos, reach) {
    const o = town(S);
    let best = null, bd = reach || 3;
    for (const id of HOUSES) {
      const h = o.houses[id];
      if (!h) continue;
      const dx = pos[0] - h.at[0], dz = pos[2] - h.at[1], c = Math.cos(h.rot), s = Math.sin(h.rot), u = Math.abs(dx * c + dz * s) - h.w / 2, v = Math.abs(-dx * s + dz * c) - h.d / 2, d = Math.max(0, u, v);
      if (Math.abs(pos[1] - h.floor) > 4 && h.floor - S.T.heightAt(h.at[0], h.at[1]) > 3 && d < 3) continue;
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  function ignite(S, id, by) {
    const h = state(S).houses[id];
    if (!h || h.burnt) return false;
    h.fire = Math.max(h.fire, 0.12);
    state(S).version++;
    if (by === 'player') state(S).arson = (state(S).arson || 0) + 1;
    return true;
  }

  function pour(S, id, amount) {
    const h = state(S).houses[id];
    if (!h || h.burnt || h.fire <= 0) return false;
    h.fire = Math.max(0, h.fire - amount);
    return true;
  }

  function fireStep(S, dt, rnd, events) {
    const V = state(S), o = town(S);
    for (const id of HOUSES) {
      const h = V.houses[id];
      if (h.burnt || h.fire <= 0) { if (h.fire <= 0 && h.wasBurning) { h.wasBurning = false; events.push({ kind: 'houseSaved', house: id }); } continue; }
      h.wasBurning = true;
      h.fire = Math.min(1, h.fire + GROW * dt);
      h.hp -= BURN * (0.3 + h.fire) * dt;
      const A = o.houses[id];
      if (h.fire > 0.5) for (const j of HOUSES) {
        if (j === id || V.houses[j].burnt || V.houses[j].fire > 0) continue;
        const B = o.houses[j], gap = Math.hypot(A.at[0] - B.at[0], A.at[1] - B.at[1]) - (Math.max(A.w, A.d) + Math.max(B.w, B.d)) / 2;
        if (gap < SPREAD && rnd() < CATCH * dt) { V.houses[j].fire = 0.1; events.push({ kind: 'fireSpread', house: j, from: id }); }
      }
      if (!S.smokes) S.smokes = [];
      {
        const sid = 'h:' + id, s = S.smokes.find(x => x.id === sid);
        if (s) s.until = S.time + 40; else S.smokes.push({ id: sid, at: [A.at[0], A.roof, A.at[1]], until: S.time + 40 });
      }
      if (h.hp <= 0) {
        Object.assign(h, { hp: 0, fire: 0, burnt: true, wasBurning: false });
        V.version++;
        sync(S);
        if (K.World && S.world) K.World.state(S).sides.elf.burnt++;
        events.push({ kind: 'houseBurnt', house: id, name: P.BUILDINGS.find(b => b.id === id).name });
      }
    }
  }

  const burning = S => S.village ? HOUSES.filter(id => S.village.houses[id].fire > 0 && !S.village.houses[id].burnt) : [];

  function flames(S) {
    if (!S.village) return [];
    const o = town(S), out = [];
    for (const id of burning(S)) {
      const A = o.houses[id], f = S.village.houses[id].fire;
      for (let k = 0; k < 7; k++) { const a = k * 1.7 + id.length, r = k ? 0.38 : 0; out.push([A.at[0] + Math.cos(a) * A.w * r, A.roof - 1.2 + (k % 3) * 0.9, A.at[1] + Math.sin(a) * A.d * r, 1, 0.42 + 0.18 * (k % 2), 0.1, 2 + f * 4.5]); }
    }
    return out;
  }

  function wellAt(S, pos, reach) {
    for (const w of town(S).wells) if (Math.hypot(pos[0] - w.at[0], pos[2] - w.at[1]) < (reach || 1.8)) return w;
    return null;
  }

  function call(S, pos) {
    const V = state(S), id = burning(S).sort((a, b) => flat(pos, [houseInfo(S, a).at[0], 0, houseInfo(S, a).at[1]]) - flat(pos, [houseInfo(S, b).at[0], 0, houseInfo(S, b).at[1]]))[0];
    if (!id) return 0;
    let n = 0;
    for (const q of S.people) {
      if (q.villager === undefined || !q.fight || q.fight.down || q.fight.hostile || flat(q.mv.pos, pos) > CALL || q.squad === 'player') continue;
      if (!K.Wounds.caps(q.kit).carry) continue;
      q.bucket = { house: id, phase: 'well', t: 0 };
      n++;
    }
    V.calls++;
    return n;
  }

  function bucketJob(S, p) {
    if (!p.bucket) return null;
    const h = state(S).houses[p.bucket.house];
    if (!h || h.burnt || h.fire <= 0) {
      const next = burning(S)[0];
      if (next) p.bucket.house = next; else { p.bucket = null; state(S).hourSet = -1; return null; }
    }
    return { kind: 'bucket' };
  }

  function bucketStep(p, S, dt, W) {
    const b = p.bucket, mv = p.mv, o = town(S);
    if (!b) return null;
    if (b.phase === 'well') {
      const w = o.wells.slice().sort((x, y) => Math.hypot(x.at[0] - mv.pos[0], x.at[1] - mv.pos[2]) - Math.hypot(y.at[0] - mv.pos[0], y.at[1] - mv.pos[2]))[0];
      const s = K.AI.steer(p, w.at, dt, S, W, { reach: 1.4, sprint: true });
      if (s) return s;
      b.t += dt;
      if (b.t >= FILL) { b.phase = 'house'; b.t = 0; }
      return { fwd: 0, side: 0, yaw: mv.yaw };
    }
    const A = o.houses[b.house], door = o.doors[b.house], goal = door ? door.at : A.at;
    const s = K.AI.steer(p, goal, dt, S, W, { reach: 2.2, sprint: true });
    if (s) return s;
    pour(S, b.house, CHAIN);
    b.phase = 'well';
    return { fwd: 0, side: 0, yaw: mv.yaw };
  }

  function burnJob(S, p) {
    if (!p.march || !p.torchHouse && p.torchDone) return null;
    const g = K.World && K.World.state(S).groups.find(x => x.id === p.march.id);
    if (!g || !g.fire || g.target !== 'korni' || g.back) return null;
    if (Math.hypot(p.mv.pos[0] - KO.at[0], p.mv.pos[2] - KO.at[1]) > 70) return null;
    const V = state(S);
    if (!p.torchHouse || V.houses[p.torchHouse].burnt || V.houses[p.torchHouse].fire > 0) {
      const o = town(S), pool = HOUSES.filter(id => !V.houses[id].burnt && V.houses[id].fire <= 0 && o.houses[id].floor - S.T.heightAt(o.houses[id].at[0], o.houses[id].at[1]) < 3);
      if (!pool.length || p.torchDone) return null;
      p.torchHouse = pool.sort((a, b) => Math.hypot(o.houses[a].at[0] - p.mv.pos[0], o.houses[a].at[1] - p.mv.pos[2]) - Math.hypot(o.houses[b].at[0] - p.mv.pos[0], o.houses[b].at[1] - p.mv.pos[2]))[0];
    }
    return { kind: 'torch' };
  }

  function torchStep(p, S, dt, W) {
    const o = town(S), id = p.torchHouse, door = o.doors[id];
    if (!id) return null;
    if (p.fight && !p.fight.torch) p.fight.torch = true;
    const s = K.AI.steer(p, door ? door.at : o.houses[id].at, dt, S, W, { reach: 1.8, sprint: false });
    if (s) { p.torchT = 0; return s; }
    p.torchT = (p.torchT || 0) + dt;
    if (p.torchT >= IGNITE) { ignite(S, id, p.id); p.torchDone = true; p.torchHouse = null; }
    return { fwd: 0, side: 0, yaw: p.mv.yaw };
  }

  function place(S, Pl, kind) {
    const item = kind === 'pit' ? 'stakes' : 'snare', bag = Pl.bag, s = bag.find(x => x.id === item && x.n > 0);
    if (!s) return { ok: false, why: kind === 'pit' ? 'Нет кольев для ямы' : 'Нет петли' };
    const at = [Pl.mv.pos[0] + Math.sin(Pl.mv.yaw) * 1.2, Pl.mv.pos[2] - Math.cos(Pl.mv.yaw) * 1.2], V = state(S);
    if (V.traps.some(t => t.armed && Math.hypot(t.at[0] - at[0], t.at[1] - at[1]) < 1.5)) return { ok: false, why: 'Здесь уже стоит ловушка' };
    s.n--;
    if (!s.n) bag.splice(bag.indexOf(s), 1);
    const t = { id: 'tr' + V.next++, kind, at, armed: true, by: 'player', day: S.day || 1 };
    V.traps.push(t);
    return { ok: true, trap: t };
  }

  function trapStep(S, dt, events) {
    const V = state(S);
    for (const q of S.people) if (q.mv.hold > 0) q.mv.hold = Math.max(0, q.mv.hold - dt);
    for (const t of V.traps) {
      if (!t.armed) continue;
      for (const q of S.people) {
        if (!q.fight || q.fight.down || q.team === 'elf' || q.kit.side === 'straw' || q.kit.beast) continue;
        if (Math.hypot(q.mv.pos[0] - t.at[0], q.mv.pos[2] - t.at[1]) > TRAP_R) continue;
        t.armed = false;
        q.mv.hold = t.kind === 'pit' ? HOLD_PIT : HOLD_SNARE;
        q.mv.crouch = true;
        if (t.kind === 'pit') {
          const part = q.mv.pos[0] > t.at[0] ? 9 : 10;
          q.fight.life -= 28;
          q.fight.hitTime = S.time;
          if (K.Wounds) K.Wounds.hurt(q, { cut: null, part, damage: 28, type: 'stab', material: 'flesh' });
          q.fight.bleed = q.fight.bleed || K.Wounds.bleed();
          q.fight.bleed.medium = K.Wounds.MEDIUM.time;
        }
        events.push({ kind: 'trap', trap: t, who: q, at: [t.at[0], q.mv.pos[1], t.at[1]] });
        break;
      }
    }
    V.traps = V.traps.filter(t => t.armed || (S.day || 1) - t.day < 2);
  }

  function trapFactor(S) {
    if (!S.village) return 1;
    const V = S.village, near = V.traps.filter(t => t.armed && Math.hypot(t.at[0] - KO.at[0], t.at[1] - KO.at[1]) < 260).length + (V.autoTraps || 0);
    return (1 - Math.min(0.3, near * 0.04)) * (V.upgrades.abatis ? 0.75 : 1);
  }

  function springFar(S, rnd) {
    const V = state(S);
    let n = 0;
    for (const t of V.traps) if (t.armed && Math.hypot(t.at[0] - KO.at[0], t.at[1] - KO.at[1]) < 260 && n < 2 && rnd() < 0.6) { t.armed = false; n++; }
    if (V.autoTraps && rnd() < 0.7) { V.autoTraps--; n++; }
    return n;
  }

  function value(id, n) { const g = K.Econ && K.Econ.GOODS[id]; return (g ? g[0] : 4) * n; }

  function deposit(S, Pl, id, n) {
    const s = Pl.bag.find(x => x.id === id), map = STOCK[id];
    if (!s || (!map && id !== 'silver')) return { ok: false, why: 'Это кладовой не нужно' };
    const k = Math.min(n || s.n, s.n), st = stockOf(S);
    if (id === 'silver') state(S).stock.silver += k;
    else st[map[0]] = Math.round(((st[map[0]] || 0) + map[1] * k) * 10) / 10;
    s.n -= k;
    if (!s.n) Pl.bag.splice(Pl.bag.indexOf(s), 1);
    const gain = Math.min(6, value(id, k) / (id === 'silver' ? 12 : 8));
    if (Pl.team === 'elf') respect(S, gain, 'кладовая');
    state(S).version++;
    return { ok: true, n: k, gain };
  }

  function credit(S, goods) {
    const st = stockOf(S);
    for (const [g, n] of Object.entries(goods)) { const k = K.Caravan.GOODS[g]; if (k) st[k.stock === 'iron' ? 'iron' : k.stock] = (st[k.stock] || 0) + n * 3; }
  }

  function take(S, Pl, id) {
    const map = GIVES[id], st = stockOf(S), free = state(S).upgrades.garden && (id === 'bandage' || id === 'tincture');
    if (!map) return { ok: false, why: 'Этого в кладовой не берут' };
    if (!free && (st[map[0]] || 0) < map[1]) return { ok: false, why: 'В кладовой мало: ' + map[0] };
    if (!free) st[map[0]] = Math.round((st[map[0]] - map[1]) * 10) / 10;
    const n = id === 'arrow' ? 3 : 1, s = Pl.bag.find(x => x.id === id);
    if (s) s.n += n; else Pl.bag.push({ id, n });
    return { ok: true, n };
  }

  function canPay(S, cost) { const st = stockOf(S); return Object.entries(cost).every(([k, v]) => (st[k] || 0) >= v); }
  function payCost(S, cost) { const st = stockOf(S), V = state(S); for (const [k, v] of Object.entries(cost)) { if (k === 'silver') V.stock.silver -= v; else st[k] -= v; } }

  function build(S, id) {
    const U = UPGRADES[id], V = state(S);
    if (!U) return { ok: false, why: 'Нет такой постройки' };
    if (V.upgrades[id]) return { ok: false, why: 'Уже построено' };
    if (!canPay(S, U.cost)) return { ok: false, why: 'В кладовой не хватает' };
    payCost(S, U.cost);
    V.upgrades[id] = S.day || 1;
    if (id === 'house4' && K.World && S.world) { const E = K.World.state(S).sides.elf; E.people += 4; for (let k = 0; k < 4; k++) V.people.push({ i: V.people.length, name: NAMES[k % 2 ? 'f' : 'm'][(V.people.length * 3) % 19], fig: k % 2 ? 'f' : 'm', role: 'villager', house: 'nest-1', job: JOBS[k], fighter: false, alive: true, debt: 0, wound: null, away: false }); }
    respect(S, 4, 'отстройка');
    V.version++;
    sync(S);
    return { ok: true, name: U.name };
  }

  function rebuild(S, id) {
    const V = state(S), h = V.houses[id];
    if (!h || !h.burnt) return { ok: false, why: 'Дом цел' };
    if (!canPay(S, REBUILD)) return { ok: false, why: 'Нужно дерева 30 и серебра 40' };
    payCost(S, REBUILD);
    Object.assign(h, { hp: 100, fire: 0, burnt: false });
    respect(S, 3, 'отстройка');
    V.version++;
    V.hourSet = -1;
    sync(S);
    return { ok: true, name: P.BUILDINGS.find(b => b.id === id).name };
  }

  function herbAt(S, pos) {
    const V = state(S);
    for (let i = 0; i < P.HERB_SPOTS.length; i++) { const h = P.HERB_SPOTS[i]; if (Math.hypot(h[0] - pos[0], h[1] - pos[2]) < 2 && V.herbs[i] !== (S.day || 1)) return i; }
    return -1;
  }

  function pick(S, Pl, i) {
    const V = state(S);
    if (V.herbs[i] === (S.day || 1)) return null;
    V.herbs[i] = S.day || 1;
    const s = Pl.bag.find(x => x.id === 'herbs');
    if (s) s.n += 2; else Pl.bag.push({ id: 'herbs', n: 2 });
    return 2;
  }

  function cacheAt(S, pos) {
    const V = state(S);
    return P.CACHES.find(c => !V.caches[c.id] && Math.hypot(c.at[0] - pos[0], c.at[1] - pos[2]) < 2.2) || null;
  }

  function openCache(S, Pl, c) {
    const V = state(S);
    if (V.caches[c.id]) return null;
    V.caches[c.id] = S.day || 1;
    for (const [id, n] of c.items) { const s = Pl.bag.find(x => x.id === id); if (s) s.n += n; else Pl.bag.push({ id, n }); }
    return c.items;
  }

  function plansReady(S) { return (S.day || 1) >= 10 && !(S.campaign && S.campaign.plans); }

  function takePlans(S, Pl) {
    if (!plansReady(S)) return false;
    Pl.bag.push({ id: 'plans', n: 1 });
    S.campaign = S.campaign || { side: Pl.team };
    S.campaign.plans = 'taken';
    return true;
  }

  function deliverPlans(S, Pl) {
    const s = Pl.bag.find(x => x.id === 'plans');
    if (!s) return false;
    Pl.bag.splice(Pl.bag.indexOf(s), 1);
    S.campaign.plans = 'delivered';
    if (K.World && S.world) { const G = K.World.state(S).sides.guard; G.anger.elf = 0; G.alarm = Math.min(3, G.alarm + 2); K.World.report(S, 'guard', 'У ворот подброшены планы штурма Злого', P.PLAN_DROP.at, 3); }
    if (S.campaign.side === 'elf') { respect(S, 5, 'планы'); S.campaign.grudge = Math.max(0, (S.campaign.grudge || 0) - 60); }
    return true;
  }

  function burnStack(S) {
    if (!K.World || !S.world) return null;
    const V = K.World.state(S).sides.villain, had = { ladders: V.ladders, ram: V.ram, logs: V.stock.logs };
    if (!had.ladders && !had.ram && had.logs < 10) return null;
    V.ladders = 0;
    V.ram = 0;
    V.stock.logs = Math.max(0, V.stock.logs - 40);
    V.anger.elf = (V.anger.elf || 0) + 40;
    K.World.readiness(S);
    K.World.state(S).traces.push({ id: 't' + K.World.state(S).next++, at: P.CUTTERS.stack.slice(), day: S.day || 1, time: S.time, dead: [], fire: true, done: false });
    K.World.report(S, 'all', 'В лагере рубщиков сгорели лестницы и таран Злого', P.CUTTERS.stack, 3);
    if (S.campaign) S.campaign.burned = S.day || 1;
    return had;
  }

  function morning(S) {
    const V = state(S), day = S.day || 1;
    if (V.morning.day === day || (S.hour || 0) < 6) return null;
    const lines = [];
    if (S.caravans) for (const c of S.caravans.list) if (!c.done && c.day === day && (c.kind === 'ore' || c.kind === 'bread' || c.kind === 'treasury')) lines.push(K.Caravan.KINDS[c.kind].name + ' сегодня в пути' + (c.kind === 'treasury' ? ' по Царскому тракту' : ' по Лесной дороге'));
    if (S.world) for (const g of S.world.groups) if (g.state !== 'done' && g.side !== 'elf' && g.kind !== 'spy' && S.T && S.T.zoneAt(g.at[0], g.at[2]) === 3) lines.push(`В лесу ${K.World.NAMES[g.kind]}: ${g.n} чел.`);
    if (S.world) for (const t of S.world.traces) if (t.fire && day - t.day <= 1) { lines.push('Вдали дым: ' + (S.T ? (S.T.spotAt(t.at[0], t.at[t.at.length - 1]) || { name: 'в лесу' }).name : 'в лесу')); break; }
    if (!lines.length) lines.push('В лесу тихо');
    V.morning = { day, lines };
    return V.morning;
  }

  function tasks(S) {
    const out = [], P0 = S.world ? S.world.posts : {};
    if (S.caravans && S.caravans.list.some(c => !c.done && (c.kind === 'ore' || c.kind === 'bread') && c.day === (S.day || 1))) out.push({ kind: 'ambush', text: 'Засада на корован на Лесной дороге', at: [642, 760] });
    for (const t of ['lesoseka', 'tower', 'cutters']) if (P0[t] && P0[t].side !== 'elf') out.push({ kind: 'raid', text: 'Вылазка: ' + K.World.POSTS[t].name, at: [K.World.POSTS[t].at[0], K.World.POSTS[t].at[1]] });
    out.push({ kind: 'herbs', text: 'Сбор трав у троп', at: P.HERB_SPOTS[(S.day || 1) % P.HERB_SPOTS.length].slice() });
    out.push({ kind: 'hunt', text: 'Охота: мясо и шкуры в кладовую', at: [420, 880] });
    if (HOUSES.some(id => state(S).houses[id].burnt) || Object.keys(UPGRADES).some(k => !state(S).upgrades[k])) out.push({ kind: 'build', text: 'Отстройка: кладовая и дерево', at: KO.store.at.slice() });
    if ((S.day || 1) >= 10 && S.campaign && !S.campaign.plans) out.push({ kind: 'plans', text: 'Планы штурма в шатре рубщиков', at: [550, 297] });
    if (S.campaign && S.campaign.plans === 'taken') out.push({ kind: 'plans', text: 'Подбросить планы к воротам дворца', at: P.PLAN_DROP.at.slice() });
    if ((S.day || 1) >= 10 && S.world && (S.world.sides.villain.ladders || S.world.sides.villain.ram)) out.push({ kind: 'burn', text: 'Сжечь лестницы и таран у рубщиков', at: P.CUTTERS.stack.slice() });
    return out;
  }

  function intro(S) { return S.campaign && S.campaign.intro; }
  const introStep = S => intro(S) ? intro(S).step : 'free';

  function introGoal(S) {
    const I = intro(S);
    if (!I) return null;
    const st = I.step;
    if (st === 'wake') return 'Поговорить с Ольхой (E)';
    if (st === 'bow') return `Пни у Корней: попасть из лука в мишени (${I.hits || 0} из 3). Лук: 2`;
    if (st === 'sickle') return 'Соломенное чучело: отрубить руку серпом (1, замах мышью)';
    if (st === 'road') return 'Идти с Ольхой к Лесной дороге. Бурелом: прыжок, в папоротнике присесть (C)';
    if (st === 'fell') return 'Слышны бубенцы. Свалить подпиленную сосну с охряной меткой (E 3 с)';
    if (st === 'ambush') return 'Засада: двое наёмников охраняют корован';
    if (st === 'carry') return `Тюки в кладовую Корней вдвоём с Ольхой (${I.stored || 0} из 2)`;
    if (st === 'smoke') return 'Над Корнями дым! Прогнать дозор империи';
    if (st === 'fire') return 'Потушить сруб: ведро у колодца (E), вылить на огонь (E)';
    if (st === 'moh') return 'Мох истекает кровью: перевязать его (B)';
    if (st === 'elders') return `Зайти к Рябине и Ясеню (${(I.seen || []).length} из 2)`;
    if (st === 'council') return 'Совет у Старшего дуба: поговорить с Вязем';
    return null;
  }

  function startIntro(S) {
    S.campaign = S.campaign || { side: 'elf' };
    S.campaign.intro = { step: 'wake', hits: 0, stored: 0, seen: [], t: 0 };
  }

  const advance = (S, step, events) => { const I = intro(S); I.step = step; I.t = 0; events.push({ kind: 'intro', step, goal: introGoal(S) }); };
  const byName = (S, name) => S.people.find(q => q.villager !== undefined && q.name === name) || null;

  function introSpawnStraw(S, W) {
    if (S.people.some(q => q.introStraw)) return;
    const T = KO.training;
    for (const [x, z] of T.targets) { const p = K.Body.strawman(S.nextId++, x, z, -Math.PI / 2, W); p.introStraw = 'target'; S.people.push(p); }
    const d = K.Body.strawman(S.nextId++, T.dummy[0], T.dummy[1], -Math.PI / 2, W);
    d.introStraw = 'dummy';
    S.people.push(d);
  }

  function introCaravan(S, W, rnd) {
    const C = K.Caravan, spot = C.sawnSpots().slice().sort((a, b) => Math.hypot(a.at[0] - 642, a.at[1] - 715) - Math.hypot(b.at[0] - 642, b.at[1] - 715))[0];
    const line = C.routes().bread.line, s = K.Terrain.nearest(line, spot.at[0], spot.at[1]).s;
    const c = C.make(S, 'bread', S.day || 1, Math.max(0, s - 170), rnd);
    c.carts.length = 1;
    c.carts[0].bales = ['bread', 'bread', 'grain', 'cloth', 'bread', 'grain'];
    c.total = 6;
    c.crew = [{ role: 'driver', side: 'town' }, { role: 'driver', side: 'town' }, { role: 'escort', side: 'villain' }, { role: 'escort', side: 'villain' }];
    c.intro = true;
    intro(S).caravan = c.id;
    intro(S).spot = spot.id;
    return c;
  }

  function introPatrol(S, W) {
    const I = intro(S), base = [278, 712];
    I.patrol = [];
    for (let k = 0; k < 4; k++) {
      const p = K.Body.member(S.nextId++, 'guard', base[0] - k * 1.5, base[1] + (k % 2) * 2, Math.PI / 2, W, { kind: 'stand', post: [300, 706], face: Math.PI / 2 });
      p.role = 'raider';
      p.intro = true;
      p.fight = K.Combat.fighter({ weapon: ['knife', 'sword', 'spear', 'sword'][k], shield: false, exp: 'recruit' });
      p.fight.life = 80;
      p.fight.torch = k === 0;
      p.anim = K.Anim.state();
      p.frames = new Float32Array(132);
      S.people.push(p);
      I.patrol.push(p.id);
    }
    ignite(S, 'izba-moh', 'guard');
    state(S).houses['izba-moh'].fire = 0.35;
    const moh = byName(S, 'Мох');
    if (moh) {
      moh.kit.cut = Object.assign({}, moh.kit.cut, { lFore: 'fresh' });
      moh.fight.bleed = K.Wounds.bleed();
      moh.fight.bleed.medium = 200;
      moh.fight.bleed.heavy = -1;
      moh.fight.life = 80;
      moh.act = { kind: 'stand', post: [298, 714], face: 0 };
      moh.wounded = true;
      moh.noAid = true;
    }
  }

  function introRun(S, W, rnd, events) {
    const I = intro(S), Pl = S.player;
    if (!I || I.step === 'free' || !Pl || !elfSide(S)) return;
    I.t += 1;
    const olha = byName(S, 'Ольха');
    const mine = e => e.who === Pl;
    if (I.step === 'bow' || I.step === 'sickle') introSpawnStraw(S, W);
    for (const e of events) {
      if (I.step === 'bow' && e.kind === 'hit' && mine(e) && e.missile === 'arrow' && e.to && e.to.introStraw === 'target') { I.hits = (I.hits || 0) + 1; if (I.hits >= 3) advance(S, 'sickle', events); else events.push({ kind: 'intro', step: 'bow', goal: introGoal(S) }); }
      if (I.step === 'sickle' && e.kind === 'cut' && mine(e) && e.to && e.to.introStraw === 'dummy') {
        advance(S, 'road', events);
        if (olha) { olha.squad = 'player'; S.squad = { order: 'follow', fire: false, at: null, face: 0 }; }
      }
      if (I.step === 'fell' && e.kind === 'treefall') advance(S, 'ambush', events);
      if (I.step === 'smoke' && e.kind === 'houseSaved' && e.house === 'izba-moh') I.saved = true;
      if ((I.step === 'smoke' || I.step === 'fire') && e.kind === 'houseBurnt' && e.house === 'izba-moh') I.lost = true;
      if (I.step === 'moh' && e.kind === 'bound' && e.who === Pl && e.to && e.to.name === 'Мох') { I.bandaged = true; }
    }
    if (I.step === 'road') {
      const wf = KO.windfall.at, fe = KO.fern;
      I.hints = I.hints || {};
      if (!I.hints.wf && Math.hypot(Pl.mv.pos[0] - wf[0], Pl.mv.pos[2] - wf[1]) < 9) { I.hints.wf = true; events.push({ kind: 'intro', step: 'road', goal: 'Бурелом поперёк тропы: перепрыгнуть (Пробел)' }); }
      if (!I.hints.fern && Math.hypot(Pl.mv.pos[0] - fe[0], Pl.mv.pos[2] - fe[1]) < 10) { I.hints.fern = true; events.push({ kind: 'intro', step: 'road', goal: 'Папоротник: присядьте (C). Присевшего в подлеске не видно дальше 6 м' }); }
      const spot = K.Caravan.sawnSpots().slice().sort((a, b) => Math.hypot(a.at[0] - 642, a.at[1] - 715) - Math.hypot(b.at[0] - 642, b.at[1] - 715))[0];
      if (Math.hypot(Pl.mv.pos[0] - spot.at[0], Pl.mv.pos[2] - spot.at[1]) < 30) { introCaravan(S, W, rnd); advance(S, 'fell', events); }
    }
    if (I.step === 'ambush') {
      const c = K.Caravan.byId(S, I.caravan), crew = c ? K.Caravan.crewOf(S, c) : [];
      for (const q of crew) if (q.role === 'escort' && !q.introWeak) { q.introWeak = true; q.kit.armor = []; q.kit.head = 'cap'; q.fight = K.Combat.fighter({ weapon: q.id % 2 ? 'axe' : 'spear', shield: false, exp: 'recruit' }); q.fight.life = 70; q.sack = [{ id: 'silver', n: 6 }]; }
      const guards = crew.filter(p => p.role === 'escort' && p.fight && !p.fight.down && !p.state);
      if (c && c.live && !guards.length) advance(S, 'carry', events);
      if (c && c.done) advance(S, 'carry', events);
    }
    if (I.step === 'carry') {
      const box = S.caravans && S.caravans.stores && S.caravans.stores.elf || {}, n = Object.values(box).reduce((a, b) => a + b, 0);
      I.stored = n;
      if (n >= 2) { advance(S, 'smoke', events); introPatrol(S, W); }
    }
    if (I.step === 'smoke') {
      const left = (I.patrol || []).map(id => S.people.find(q => q.id === id)).filter(q => q && q.fight && !q.fight.down && !q.state && Math.hypot(q.mv.pos[0] - KO.at[0], q.mv.pos[2] - KO.at[1]) < 90);
      for (const q of left) if (!q.fight.hostile && Math.hypot(q.mv.pos[0] - Pl.mv.pos[0], q.mv.pos[2] - Pl.mv.pos[2]) < 40) q.fight.hostile = Pl;
      if (!left.length) advance(S, I.saved || I.lost || !(state(S).houses['izba-moh'].fire > 0) ? 'moh' : 'fire', events);
    }
    if (I.step === 'fire' && (I.saved || I.lost || !(state(S).houses['izba-moh'].fire > 0))) advance(S, 'moh', events);
    if (I.step === 'moh') {
      const moh = byName(S, 'Мох');
      if (I.bandaged || !moh || moh.fight.down || !K.Wounds.bleeding(moh.fight)) { if (moh) { moh.act = { kind: 'stand', post: SPOTS.wood.slice(), face: 0 }; moh.noAid = false; } advance(S, 'elders', events); }
    }
    if (I.step === 'elders' && (I.seen || []).length >= 2) advance(S, 'council', events);
  }

  function talked(S, role, events) {
    const I = intro(S);
    if (!I) return null;
    if (I.step === 'wake' && role === 'leader') { advance(S, 'bow', events); return 'Ольха: «Вставай. По Лесной дороге идёт корован. Сначала разомни руки у пней, потом пойдём».'; }
    if (I.step === 'elders' && (role === 'healer' || role === 'carver')) { I.seen = I.seen || []; if (!I.seen.includes(role)) I.seen.push(role); return role === 'healer' ? 'Рябина: «Кровь уймём травой, культю залечим. Смоляной глаз сделаю, если деревня тебя ценит».' : 'Ясень: «Видишь руки и ноги на стене? Это для своих. Кто потерял руку за Корни, тому вырежу даром».'; }
    if (I.step === 'council' && role === 'elder') { advance(S, 'free', events); S.campaign.intro = null; return 'Вяз: «Утром разведчики скажут, что в лесу. Выбирай сам: засада, вылазка, травы, охота или отстройка. Корни держатся теми, кто возвращается».'; }
    return null;
  }

  function daily(S, rnd) {
    const V = state(S), day = S.day || 1;
    if (V.daily === day) return;
    V.daily = day;
    if (K.World && S.world) { const E = K.World.state(S).sides.elf; if (E.fighters >= 6 && (V.autoTraps || 0) < 4 && rnd() < 0.5) V.autoTraps = (V.autoTraps || 0) + 1; }
    for (const r of V.people) if (r.alive && r.wound && r.wound.life !== undefined) r.wound.life = Math.min(100, r.wound.life + 40);
    if (elfSide(S)) plan(S, rnd);
  }

  function plan(S, rnd) {
    const C = S.campaign, day = S.day || 1;
    if (!K.World || !S.world || C.ending) return;
    const E = K.World.state(S), G = E.sides.guard;
    C.part = day < 10 ? 1 : day < 26 ? 2 : 3;
    const anger = G.anger.elf || 0;
    C.grudge = (C.grudge || 0) + Math.max(0, anger - (C.lastAnger || 0)) + E.groups.filter(g => g.kind === 'punish' && g.day === day).length * 15;
    C.lastAnger = anger;
    C.finales = C.finales || {};
    if (!C.finales.fire && day >= 26 && C.grudge >= 60 && C.plans !== 'delivered' && G.men >= 45) {
      const n = Math.min(34, G.men - 20), g = K.World.launch(S, 'guard', 'punish', K.World.POSTS.palace.gate, K.World.POSTS.korni.at, n, { target: 'korni', fire: true, dogs: true });
      if (g) { g.final = 'fire'; C.finales.fire = { day, group: g.id, done: false }; K.World.report(S, 'all', `«Огонь»: империя идёт выжечь Корни, ${n} чел. с факелами и собаками`, K.World.POSTS.palace.gate, 3); }
    }
    if (!C.finales.logs && E.assault) C.finales.logs = { day, group: null, done: false, ambushed: false };
    const L = C.finales.logs;
    if (L && !L.done && E.assault && E.assault.result) {
      if (E.assault.result === 'taken' && !L.raid && E.sides.villain.men >= 20) {
        const g = K.World.launch(S, 'villain', 'raid', K.World.POSTS.fort.gate, K.World.POSTS.korni.at, Math.min(26, E.sides.villain.men - 8), { target: 'korni', fire: true });
        if (g) { g.final = 'logs'; L.raid = g.id; K.World.report(S, 'all', '«Брёвна»: войско Злого идёт рубить Корни', K.World.POSTS.fort.gate, 3); }
      } else if (E.assault.result === 'repelled' || !L.raid) L.done = true;
    }
    if (C.finales.fire && !C.finales.fire.done && !E.groups.some(g => g.id === C.finales.fire.group)) C.finales.fire.done = true;
    if (L && L.raid && !E.groups.some(g => g.id === L.raid)) L.done = true;
    const fireDone = !C.finales.fire || C.finales.fire.done, logsDone = L ? L.done : day >= 46;
    if (((C.finales.fire || L) && fireDone && logsDone) || day >= 50) finish(S);
  }

  function ambushArmy(S, rnd) {
    const C = S.campaign;
    if (!elfSide(S) || !C.finales || !C.finales.logs || C.finales.logs.ambushed || !K.World || !S.world) return;
    const E = K.World.state(S), g = E.groups.find(x => x.kind === 'assault' && x.state === 'go' && !x.back && S.T.zoneAt(x.at[0], x.at[2]) === 3 && !x.live);
    if (!g || E.sides.elf.fighters < 6) return;
    C.finales.logs.ambushed = true;
    const n = Math.min(E.sides.elf.fighters - 2, 6 + Math.floor(rnd() * 4));
    K.World.launch(S, 'elf', 'partisans', K.World.POSTS.korni.at, [g.at[0], g.at[2]], n, { target: null });
    K.World.report(S, 'elf', 'Партизаны выходят навстречу войску Злого на Лесной дороге', g.at, 2);
  }

  function ending(S) {
    const V = state(S), E = K.World ? K.World.state(S).sides.elf : { people: 44 }, n = intact(S), people = E.people;
    const id = people < 12 || n <= 2 ? 'lost' : n >= 9 && people >= 18 ? 'hold' : 'burnt';
    return { id, name: ENDINGS[id].name, text: ENDINGS[id].text, intact: n, people, oak: V.oak.slice(), rescues: (S.campaign && S.campaign.rescues || []).slice() };
  }

  function finish(S) {
    const C = S.campaign;
    if (C.ending) return C.ending;
    C.ending = Object.assign(ending(S), { day: S.day || 1 });
    C.after = true;
    if (K.World && S.world) K.World.report(S, 'elf', 'Летопись Корней: ' + C.ending.name, KO.at, 3);
    state(S).endingNew = true;
    return C.ending;
  }

  function react(S, events) {
    const Pl = S.player, V = state(S), side = Pl && Pl.team;
    for (const e of events) {
      if (side === 'elf' && e.kind === 'bound' && e.who === Pl && e.to && e.to.villager !== undefined) respect(S, 2, 'перевязка');
      if (side === 'elf' && e.kind === 'healed' && e.by === 'player' && e.who && e.who.team === 'elf') { respect(S, 4, 'вынос'); if (S.campaign) (S.campaign.rescues || (S.campaign.rescues = [])).push({ by: 'вы', who: e.who.name || 'эльф', day: S.day || 1 }); }
      if (e.kind === 'rescued' && side === 'elf' && S.campaign) (S.campaign.rescues || (S.campaign.rescues = [])).push({ by: e.by && e.by.name || 'свой', who: 'вас', day: S.day || 1 });
      if (side === 'elf' && e.kind === 'houseSaved' && Pl && Math.hypot(Pl.mv.pos[0] - KO.at[0], Pl.mv.pos[2] - KO.at[1]) < 80) respect(S, 3, 'пожар');
      if (side === 'elf' && e.kind === 'houseBurnt' && Pl && Math.hypot(Pl.mv.pos[0] - KO.at[0], Pl.mv.pos[2] - KO.at[1]) < 80) respect(S, -2, 'пожар');
      if (side === 'elf' && e.kind === 'villagerDead' && e.near) respect(S, -1, 'гибель');
      if (side === 'elf' && e.kind === 'down' && e.who && e.who.team && e.who.team !== 'elf' && e.who.fight && e.who.fight.hitBy === Pl && Math.hypot(e.who.mv.pos[0] - KO.at[0], e.who.mv.pos[2] - KO.at[1]) < 120) respect(S, 1, 'защита');
      if (side !== 'elf' && e.kind === 'houseBurnt') V.version++;
    }
  }

  function alarmCheck(S) {
    const V = state(S);
    if (!S.world || !V.live) { V.alarm = false; return; }
    const r = V.upgrades.tower ? 500 : 300;
    const threat = S.people.some(q => q.team && q.team !== 'elf' && q.team !== 'town' && q.team !== 'watch' && q.fight && !q.fight.down && Math.hypot(q.mv.pos[0] - KO.at[0], q.mv.pos[2] - KO.at[1]) < 90) || S.world.groups.some(g => g.target === 'korni' && !g.back && g.state === 'go' && Math.hypot(g.at[0] - KO.at[0], g.at[2] - KO.at[1]) < r);
    if (threat && !V.alarm) V.horn = true;
    V.alarm = threat || burning(S).length > 0;
  }

  function run(S, dt, W, rnd) {
    const events = [];
    if (!S.T) S.T = W.terrain;
    state(S);
    census(S, W);
    fireStep(S, dt, rnd, events);
    trapStep(S, dt, events);
    corpses(S, events);
    alarmCheck(S);
    routine(S);
    if ((S.hour || 0) >= PLAN_HOUR && S.village.daily !== (S.day || 1)) daily(S, rnd);
    S.village.tick = (S.village.tick || 0) + dt;
    if (S.village.tick > 0.5) { S.village.tick = 0; ambushArmy(S, rnd); sync(S); }
    return events;
  }

  function post(S, events, W, rnd) {
    react(S, events);
    introRun(S, W, rnd, events);
  }

  K.Elves = {
    HOUSES, UPGRADES, REBUILD, STOCK, GIVES, INTRO, ENDINGS, NEAR, FAR, POUR, CALL, KEY, SPOTS,
    state, roster, sync, burnFar, intact, burntKey, respect, census, routine, spotFor, ignite, pour, burning, flames, houseAt, wellAt, call,
    bucketJob, bucketStep, burnJob, torchStep, place, trapFactor, springFar, deposit, credit, take, canPay, build, rebuild, herbAt, pick, cacheAt, openCache,
    plansReady, takePlans, deliverPlans, burnStack, morning, tasks, startIntro, introStep, introGoal, talked, daily, plan, ending, finish, react, run, post, stockOf
  };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
