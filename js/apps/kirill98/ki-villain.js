(function (K) {
  'use strict';

  const P = K.Places, FP = P.FORT_PTS, CENTER = [960, 105];
  const NEAR = 260, FAR = 330, ID0 = 94000, TAKE = 100, PAY = 5, IRON_ARM = 15, HEAL = 15, LADDER = 20, RAM_LOGS = 60, RAM_IRON = 20;
  const KEY = Object.freeze([
    { name: 'Гусь', role: 'scribe', look: { head: null, hairColor: [0.5, 0.48, 0.44], beard: false, main: [0.3, 0.27, 0.22] }, gear: [null, false] },
    { name: 'Кривой', role: 'scout', look: { head: null, hairColor: [0.2, 0.16, 0.12], beard: true, eyes: { l: 'ruby' } }, gear: ['sword', false] },
    { name: 'Пень', role: 'chief', look: { head: 'nasal', hairColor: [0.32, 0.26, 0.2], beard: true, armor: ['mail'], pros: { lShin: 'iron', rShin: 'iron' }, cut: { lShin: 'healed', rShin: 'healed' } }, gear: ['axe', true] },
    { name: 'Сыч', role: 'spymaster', look: { head: null, hairColor: [0.12, 0.1, 0.08], beard: false, main: [0.12, 0.12, 0.14] }, gear: ['knife', false] },
    { name: 'Молот', role: 'smith', look: { head: null, hairColor: [0.24, 0.18, 0.12], beard: true, main: [0.36, 0.26, 0.18] }, gear: ['mace', false] },
    { name: 'Фрол', role: 'surgeon', look: { head: null, hairColor: [0.58, 0.56, 0.52], beard: true, main: [0.42, 0.36, 0.3] }, gear: [null, false] }
  ]);
  const ARMY = Object.freeze(['Хвощ', 'Шрам', 'Косой', 'Бугай', 'Клык', 'Гвоздь', 'Чекан', 'Ржавый', 'Кирпич', 'Обух', 'Лом', 'Жбан', 'Хрящ', 'Кремень', 'Щербатый', 'Сажа', 'Дёготь', 'Копоть', 'Ухват', 'Колун', 'Багор', 'Клещ', 'Шило', 'Тесак', 'Кистень', 'Рябой', 'Ёрш', 'Зуб', 'Котёл', 'Крюк', 'Брус', 'Жила', 'Струп', 'Валун']);
  const RECRUITS = Object.freeze(['Пыж', 'Хорь', 'Сом', 'Галка', 'Бобыль', 'Тать', 'Лапоть', 'Ворох', 'Щегол', 'Сухарь', 'Гуж', 'Чирей', 'Ряха', 'Кадка', 'Сивый', 'Грач', 'Дрын', 'Жердь', 'Кочан', 'Ухарь', 'Пескарь', 'Заноза', 'Ломоть', 'Овсюг', 'Болт', 'Шкворень', 'Клин', 'Скоба', 'Чугун', 'Шмат']);
  const WEAPONS = Object.freeze(['axe', 'mace', 'spear', 'sword', 'axe', 'spear', 'mace', 'knife']);
  const SQUADS = Object.freeze([
    { id: 'krivoy', name: 'Разведка Кривого', lead: 'Кривой', from: 1, n: 6 },
    { id: 'pen', name: 'Пехота Пня', lead: 'Пень', from: 7, n: 12 },
    { id: 'sych', name: 'Люди Сыча', lead: 'Сыч', from: 19, n: 3 },
    { id: 'garrison', name: 'Гарнизон', lead: null, from: 22, n: 12 }
  ]);
  const ORDERS = Object.freeze({
    raid: { name: 'Набег', targets: ['korni', 'tsarevo', 'lesoseka', 'outpost', 'tower'] },
    ambush: { name: 'Засада', targets: ['tract', 'forest'] },
    logging: { name: 'Рубка', targets: ['cutters'] },
    guard: { name: 'Охрана', targets: ['fort', 'mines', 'pass'] },
    spies: { name: 'Шпионы', targets: ['palace'] },
    recruit: { name: 'Вербовка', targets: ['mines', 'town'] },
    rest: { name: 'Отдых', targets: ['fort'] }
  });
  const TARGETS = Object.freeze({
    korni: { name: 'Корни', at: [350, 712] }, tsarevo: { name: 'Царёво', at: [1300, 1000] }, lesoseka: { name: 'Лесосека', at: [690, 915] },
    outpost: { name: 'застава', at: [1240, 392] }, tower: { name: 'вышка у брода', at: [786, 752] }, cutters: { name: 'северная опушка', at: [565, 305] },
    fort: { name: 'форт', at: [960, 105] }, mines: { name: 'рудники', at: [1080, 232] }, pass: { name: 'перевал', at: [650, 200] },
    palace: { name: 'дворец', at: [1146, 700] }, town: { name: 'Мостовица', at: [870, 1300] },
    tract: { name: 'Царский тракт', at: [1060, 950] }, forest: { name: 'Лесная дорога', at: [640, 840] }
  });
  const ENDINGS = Object.freeze({
    fear: { name: 'Победа страхом', text: 'Дворец взят. В летописи стоит имя хозяина форта, и рядом с ним никого. Дороги молчат.' },
    loyal: { name: 'Победа верностью', text: 'Дворец взят. Гусь вписывает в летопись имена тех, кто шёл рядом.' },
    abandoned: { name: 'Брошен у стен', text: 'Злой упал у стен дворца. Свои бросили его, как когда-то бросили его самого.' }
  });
  const ATTACKS = Object.freeze(['arson', 'plans', 'sentry', 'prisoners', 'carts']);
  const INTRO = Object.freeze(['hall', 'yard', 'drill', 'table', 'sortie', 'loot', 'home', 'night', 'free']);

  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const flat2 = (p, q) => Math.hypot(p[0] - q[0], p[2] - q[1]);
  const town = S => P.town(S.T);
  const hourOf = S => S.hour || 0;
  const villainSide = S => !!S.campaign && S.campaign.side === 'villain';
  const clamp = v => Math.max(0, Math.min(100, v));
  const world = S => K.World.state(S);

  function roster() {
    const out = KEY.map((k, i) => Object.assign({ i, alive: true, debt: 0, wound: null, army: false, loyalty: 70, fear: 20 }, k));
    ARMY.forEach((n, j) => {
      const sq = SQUADS.find(s => j >= s.from - 1 && j < s.from - 1 + s.n) || SQUADS[3], pros = {}, cut = {};
      if (j === 0) cut.rFore = 'healed';
      else if (j % 7 === 3) { pros.lFore = 'iron'; cut.lFore = 'healed'; }
      else if (j % 9 === 5) { pros.rShin = 'peg'; cut.rShin = 'healed'; }
      out.push({ i: out.length, name: n, role: 'soldier', fig: 'm', army: true, alive: true, debt: 0, wound: null, squad: sq.id, loyalty: 42 + (j * 37) % 24, fear: 24 + (j * 53) % 22, look: Object.keys(cut).length ? { pros, cut } : null, weapon: WEAPONS[j % WEAPONS.length], shield: j % 3 === 0 });
    });
    return out;
  }

  function state(S) {
    if (S.army) return S.army;
    S.army = { people: roster(), live: false, hourSet: -1, squads: SQUADS.map(s => ({ id: s.id, order: s.id === 'garrison' ? 'guard' : 'rest', target: 'fort', group: null, n: 0, out: 0, stock: null, lead: false })), reports: [], book: [], pay: { last: 0, held: false }, cut: 0, forge: { burnt: 0 }, share: null, night: 0, recruits: 0, assault: null, table: false };
    return S.army;
  }

  const soldiers = S => state(S).people.filter(r => r.army && r.alive && !r.deserted);
  const mean = (list, k) => list.length ? Math.round(list.reduce((a, r) => a + r[k], 0) / list.length) : 0;
  const loyalty = S => mean(soldiers(S), 'loyalty');
  const fear = S => mean(soldiers(S), 'fear');
  const byName = (S, n) => state(S).people.find(r => r.name === n) || null;
  const personOf = (S, r) => S.people.find(q => q.soldier === r.i) || null;
  const home = (S, r) => !r.away && r.alive && !r.deserted && !(r.pit > (S.day || 1));

  function stats(S) {
    const A = state(S), st = S.standing || (S.standing = { service: 0, respect: 0, loyalty: 0 }), l = loyalty(S), f = fear(S);
    if (villainSide(S)) st.loyalty = l;
    if (S.world) { const V = world(S).sides.villain; if (villainSide(S)) V.morale = Math.round(Math.min(100, l + f * 0.5)); }
    return { loyalty: l, fear: f, men: soldiers(S).length, A };
  }

  function note(S, who, dl, df, why, events) {
    const A = state(S), list = who === 'all' ? soldiers(S) : [].concat(who).filter(Boolean);
    for (const r of list) { r.loyalty = clamp(r.loyalty + dl); r.fear = clamp(r.fear + df); }
    A.book.push({ day: S.day || 1, hour: Math.floor(hourOf(S)), who: who === 'all' ? 'войско' : list.map(r => r.name).join(', '), dl, df, why });
    if (A.book.length > 60) A.book.splice(0, A.book.length - 60);
    stats(S);
    if (events) events.push({ kind: 'army', dl, df, why, who: who === 'all' ? null : list.map(r => r.name), loyalty: loyalty(S), fear: fear(S) });
  }

  function spotFor(S, r) {
    const o = town(S), h = hourOf(S), night = h >= 22 || h < 6, muster = h >= 6.8 && h < 7.6, I = intro(S), A = state(S);
    const keep = id => { const k = o.keepers[id]; return k ? { at: k.at.slice(), face: k.face } : { at: CENTER.slice(), face: 0 }; };
    const beds = o.beds.filter(b => b.building === 'fort-barracks');
    if (r.role === 'scribe') return keep('fort-hall');
    if (r.role === 'surgeon') return keep('surgeon');
    if (r.role === 'smith') return keep('forge');
    if (r.role === 'spymaster') return { at: [FP.table[0] + 3, FP.table[1] - 1.5], face: -Math.PI / 2 };
    if (r.role === 'scout') return { at: [930.5, 105 + 2.5], face: -Math.PI / 2 };
    if (r.role === 'chief') return A.assault ? { at: FP.yard.slice(), face: 0 } : { at: [FP.hero[0] + 2.2, FP.hero[1] + 1.4], face: Math.PI };
    if (r.pit > (S.day || 1)) return { at: [FP.pit[0] + (r.i % 3 - 1) * 0.6, FP.pit[1]], face: 0 };
    const slot = FP.line[(r.i - KEY.length) % FP.line.length];
    if (I && (I.step === 'yard' || I.step === 'drill') && !r.drill) return { at: slot.slice(), face: Math.PI };
    if (muster) return { at: slot.slice(), face: Math.PI };
    if (night) { const b = beds[r.i % Math.max(1, beds.length)]; return b && r.i % 3 === 0 ? { at: b.at.slice(), face: b.yaw } : { at: [970 + (r.i % 8) * 1.8, 110 + (r.i % 3) * 1.6], face: r.i }; }
    const posts = FP.posts;
    if (r.squad === 'garrison') { const p = posts[r.i % posts.length]; return { at: [p[0] + (r.i % 2) * 1.2, p[1]], face: r.i % 2 ? 0 : Math.PI }; }
    return { at: [946 + (r.i % 10) * 2.6, 108 + (r.i % 4) * 2.2], face: r.i * 0.7 };
  }

  function makePerson(S, r, W, at) {
    const s = at ? { at, face: 0 } : spotFor(S, r), p = K.Body.member(ID0 + r.i, 'villain', s.at[0], s.at[1], s.face, W, { kind: 'stand', post: s.at.slice(), face: s.face }, r.fig);
    p.name = r.name;
    p.role = r.role === 'soldier' ? 'soldier' : r.role;
    p.soldier = r.i;
    p.debt = r.debt || 0;
    if (r.look) { Object.assign(p.kit, r.look); p.kit.pros = Object.assign({}, r.look.pros || {}); p.kit.cut = Object.assign({}, r.look.cut || {}); p.kit.eyes = Object.assign({}, r.look.eyes || {}); }
    if (r.pros) p.kit.pros = Object.assign({}, p.kit.pros, r.pros);
    if (r.army) { p.kit.armor = r.i % 3 === 0 ? ['mail', 'collar', 'bracers'] : r.i % 3 === 1 ? ['mail', 'greaves'] : ['collar', 'bracers']; p.kit.head = r.i % 2 ? 'nasal' : p.kit.head; }
    const gear = r.gear || [r.weapon || 'axe', !!r.shield];
    if (gear[0] || r.role === 'soldier') p.fight = K.Combat.fighter({ weapon: gear[0] || 'knife', shield: gear[1], exp: r.role === 'chief' || r.role === 'scout' ? 'veteran' : 'soldier' });
    else p.fight = K.Combat.fighter({});
    if (r.wound && r.wound.life !== undefined) p.fight.life = r.wound.life;
    if (r.wound && r.wound.cut) p.kit.cut = Object.assign({}, p.kit.cut, r.wound.cut);
    p.anim = K.Anim ? K.Anim.state() : null;
    p.frames = new Float32Array(132);
    return p;
  }

  function census(S, W) {
    const A = state(S), focus = S.player ? S.player.mv.pos : S.focus || null, d = focus ? Math.hypot(focus[0] - CENTER[0], focus[2] - CENTER[1]) : Infinity;
    if (!A.live && d < NEAR) {
      for (const r of A.people) if (home(S, r) && !S.people.some(q => q.soldier === r.i)) { S.people.push(makePerson(S, r, W)); r.spawned = true; }
      A.live = true;
      A.hourSet = -1;
    } else if (A.live && d > FAR) {
      for (const q of S.people.slice()) {
        if (q.soldier === undefined || q.squad === 'player' || q.march) continue;
        stash(S, q);
        S.people.splice(S.people.indexOf(q), 1);
      }
      A.live = false;
    } else if (A.live) {
      for (const r of A.people) if (home(S, r) && !r.spawned && !S.people.some(q => q.soldier === r.i)) { S.people.push(makePerson(S, r, W)); r.spawned = true; }
    }
  }

  function stash(S, q) {
    const r = state(S).people[q.soldier];
    r.debt = q.debt || 0;
    r.wound = { cut: Object.assign({}, q.kit.cut || {}), life: q.fight ? Math.min(100, q.fight.life) : 100 };
    r.pros = Object.assign({}, q.kit.pros || {});
    r.spawned = false;
  }

  function routine(S) {
    const A = state(S), key = Math.floor(hourOf(S) * 4) + ':' + (intro(S) ? intro(S).step : '') + ':' + (A.assault ? 1 : 0);
    if (!A.live || A.hourSet === key) return;
    A.hourSet = key;
    for (const q of S.people) {
      if (q.soldier === undefined || q.squad === 'player' || q.march || q.state) continue;
      const r = A.people[q.soldier];
      if (r.away || r.pit > (S.day || 1) && q.act && q.act.kind === 'stand' && flat2(q.mv.pos, FP.pit) < 2) continue;
      const s = spotFor(S, r);
      q.act = { kind: 'stand', post: s.at, face: s.face };
    }
  }

  function corpses(S, events) {
    const A = state(S);
    for (const b of S.bodies) {
      if (!b.who || b.who.team !== 'villain' || b.vcounted || b.cause === 'ko') continue;
      const r = A.people.find(x => x.name === b.who.name && x.alive && (x.spawned || x.away));
      if (!r) continue;
      b.vcounted = true;
      r.spawned = false;
      r.alive = false;
      if (r.army && S.world) { const V = world(S).sides.villain; V.men = Math.max(0, V.men - 1); }
      events.push({ kind: 'soldierDead', name: r.name });
    }
  }

  function squadOf(S, id) { return state(S).squads.find(s => s.id === id); }
  const members = (S, sq) => state(S).people.filter(r => r.army && r.squad === sq.id && r.alive && !r.deserted);
  const ready = (S, sq) => members(S, sq).filter(r => home(S, r) && !(r.wound && r.wound.heavy > (S.day || 1)));

  function preyFor(S, road) {
    if (!S.caravans) return null;
    const legs = road === 'tract' ? ['trade', 'treasury'] : ['ore', 'bread', 'trade'];
    return S.caravans.list.find(c => legs.includes(c.kind) && !c.done && !c.robbed && c.state !== 'stopped' && !c.hunted && K.Caravan.KINDS[c.kind].owner !== 'villain') || null;
  }

  function order(S, id, kind, target, opts) {
    const A = state(S), sq = squadOf(S, id), O = ORDERS[kind], o = opts || {};
    if (!sq || !O) return { ok: false, why: 'Нет такого приказа' };
    if (sq.group) return { ok: false, why: 'Отряд уже в походе' };
    if (!O.targets.includes(target)) return { ok: false, why: 'Цель не подходит приказу' };
    const men = ready(S, sq);
    sq.order = kind;
    sq.target = target;
    if (kind === 'guard' || kind === 'rest') { for (const r of members(S, sq)) r.post = kind === 'guard' ? target : 'fort'; if (S.world && kind === 'guard' && target === 'mines') world(S).posts.mines.men = Math.max(world(S).posts.mines.men, 6 + men.length); A.hourSet = -1; return { ok: true, text: `${O.name}: ${TARGETS[target].name}` }; }
    const need = kind === 'spies' ? 1 : kind === 'recruit' ? 2 : 3;
    if (men.length < need) return { ok: false, why: `Мало людей: ${men.length}, нужно ${need}` };
    const Wo = K.World, take = kind === 'spies' ? men.slice(0, 1) : men;
    const to = kind === 'ambush' ? null : TARGETS[target].at;
    let g = null;
    if (kind === 'ambush') {
      const c = preyFor(S, target), line = c && K.Caravan.routes()[c.kind].line, q = c ? K.Terrain.pointAt(line, Math.min(line.length, c.s + 260)) : null;
      g = Wo.launch(S, 'villain', 'ambush', Wo.POSTS.fort.gate, q ? [q.x, q.z] : TARGETS[target].at, take.length, { target: null });
      if (g && c) { g.prey = c.id; c.hunted = true; }
    } else if (kind === 'raid') g = Wo.launch(S, 'villain', 'raid', Wo.POSTS.fort.gate, to, take.length, { target, fire: target === 'korni' || target === 'tsarevo' || target === 'lesoseka' });
    else if (kind === 'logging') g = Wo.launch(S, 'villain', 'logging', Wo.POSTS.fort.gate, to, take.length, { target: 'cutters' });
    else if (kind === 'spies') g = Wo.launch(S, 'villain', 'spy', Wo.POSTS.fort.gate, Wo.POSTS.palace.gate, 1, { target: 'palace' });
    else if (kind === 'recruit') g = Wo.launch(S, 'villain', 'recruit', Wo.POSTS.fort.gate, to, take.length, { target: null });
    if (!g) return { ok: false, why: 'Отряд не вышел' };
    const V = world(S).sides.villain;
    sq.group = g.id;
    sq.n = g.n;
    sq.out = S.day || 1;
    sq.sent = take.map(r => r.i);
    sq.stock = { silver: V.stock.silver, iron: V.stock.iron, bread: V.stock.bread, logs: V.stock.logs, intel: V.intel, men: V.men };
    sq.lead = !!o.lead;
    for (const r of take) r.away = g.id;
    g.crew = take.map(r => { const q = personOf(S, r); if (q) { stash(S, q); S.people.splice(S.people.indexOf(q), 1); } const p = makePerson(S, r, o.W, [0, 0]); r.spawned = false; return p; });
    if (o.lead) g.hero = true;
    A.hourSet = -1;
    return { ok: true, text: `${O.name}: ${target === 'tract' || target === 'forest' ? TARGETS[target].name : TARGETS[target] ? TARGETS[target].name : target}, ${take.length} чел.`, group: g };
  }

  function track(S, events) {
    const A = state(S), E = world(S);
    for (const sq of A.squads) {
      if (!sq.group) continue;
      const g = E.groups.find(x => x.id === sq.group);
      if (g) { sq.n = g.n; sq.loot = g.loot || sq.loot || null; sq.recruits = g.recruits || sq.recruits || 0; sq.gone = g.state; continue; }
      settle(S, sq, events);
    }
  }

  function settle(S, sq, events) {
    const A = state(S), V = world(S).sides.villain, sent = (sq.sent || []).map(i => A.people[i]).filter(Boolean);
    const alive = sent.filter(r => { const q = S.people.find(x => x.soldier === r.i); return !q || q.fight && !q.fight.down; });
    for (const q of S.people.slice()) if (q.soldier !== undefined && sent.some(r => r.i === q.soldier) && q.march === null && q.squad !== 'player') { stash(S, q); S.people.splice(S.people.indexOf(q), 1); }
    let keep = Math.max(0, Math.min(alive.length, sq.n));
    const lost = [], hurt = [];
    for (const r of sent) {
      r.away = null;
      if (alive.includes(r) && keep > 0) { keep--; continue; }
      if (!r.alive) continue;
      if (lost.length % 3 === 2) { r.wound = Object.assign({}, r.wound || {}, { life: 40, heavy: (S.day || 1) + 3 }); hurt.push(r.name); lost.push(null); continue; }
      r.alive = false;
      lost.push(r.name);
    }
    const st = sq.stock || {}, loot = { silver: Math.max(0, (V.stock.silver || 0) - (st.silver || 0)), iron: sq.loot && sq.loot.iron ? sq.loot.iron * 2 : 0, bread: Math.max(0, (V.stock.bread || 0) - (st.bread || 0)), logs: Math.max(0, (V.stock.logs || 0) - (st.logs || 0)) };
    if (sq.loot && sq.loot.silver) loot.silver = Math.max(loot.silver, sq.loot.silver);
    if (sq.order === 'logging') A.cut += loot.logs;
    for (let k = 0; k < (sq.recruits || 0); k++) enlist(S);
    const rep = { day: S.day || 1, squad: sq.id, order: sq.order, target: sq.target, lost: lost.filter(Boolean), wounded: hurt, back: sent.length - lost.filter(Boolean).length, loot, intel: Math.max(0, (V.intel || 0) - (st.intel || 0)), recruits: sq.recruits || 0, lead: sq.lead };
    A.reports.push(rep);
    if (A.reports.length > 30) A.reports.splice(0, A.reports.length - 30);
    if (loot.silver > 0) A.share = { silver: Math.floor(loot.silver / 2), squad: sq.id, men: sent.filter(r => r.alive).map(r => r.i) };
    if (rep.lost.length) note(S, 'all', -Math.min(6, rep.lost.length), 0, 'потери в походе');
    sq.group = null;
    sq.sent = null;
    sq.loot = null;
    sq.recruits = 0;
    sq.order = sq.id === 'garrison' ? 'guard' : 'rest';
    sq.target = 'fort';
    sync(S);
    events.push({ kind: 'report', report: rep });
  }

  function enlist(S) {
    const A = state(S), used = new Set(A.people.map(r => r.name)), name = RECRUITS.find(n => !used.has(n)) || 'Новобранец ' + (A.recruits + 1);
    A.recruits++;
    const r = { i: A.people.length, name, role: 'soldier', fig: 'm', army: true, alive: true, debt: 0, wound: null, squad: 'garrison', loyalty: 35, fear: 30, look: null, weapon: WEAPONS[A.people.length % WEAPONS.length], shield: A.people.length % 3 === 0, recruit: true };
    A.people.push(r);
    return r;
  }

  function sync(S) {
    if (!S.world) return;
    const V = world(S).sides.villain, list = soldiers(S), away = list.filter(r => r.away).length, here = list.filter(r => !r.away);
    if (!villainSide(S)) {
      let n = list.length;
      while (n > Math.max(10, V.men)) { const r = here.filter(x => !x.spawned && x.alive).pop(); if (!r) break; r.alive = false; here.splice(here.indexOf(r), 1); n--; }
      while (n < Math.min(V.men, 90)) { enlist(S); n++; }
      return;
    }
    const groups = world(S).groups.filter(g => g.side === 'villain' && g.state !== 'done').reduce((m, g) => m + g.n, 0);
    V.men = Math.max(0, here.length + Math.min(away, groups));
    stats(S);
  }

  function heal(S, i) {
    const A = state(S), r = A.people[i], V = world(S).sides.villain;
    if (!r || !r.alive || !r.wound || r.wound.life === undefined || r.wound.life >= 100 && !r.wound.heavy) return { ok: false, why: 'Ран нет' };
    if ((V.stock.silver || 0) < HEAL) return { ok: false, why: 'В казне нет ' + HEAL + ' серебра' };
    V.stock.silver -= HEAL;
    r.wound = Object.assign({}, r.wound, { life: 100, heavy: 0 });
    const q = personOf(S, r);
    if (q && q.fight) q.fight.life = 100;
    note(S, r, 6, -2, 'Фрол вылечил за счёт казны');
    return { ok: true, text: `Фрол лечит: ${r.name}, ${HEAL} серебра` };
  }

  const stump = r => { const c = Object.assign({}, r.look && r.look.cut || {}, r.wound && r.wound.cut || {}), pr = Object.assign({}, r.look && r.look.pros || {}, r.pros || {}); return ['lFore', 'rFore', 'lShin', 'rShin'].find(k => c[k] && !pr[k]) || null; };

  function forgeArm(S, i, events) {
    const A = state(S), r = A.people[i], V = world(S).sides.villain, part = r && stump(r);
    if (!r || !r.alive || !part) return { ok: false, why: 'Протез не нужен' };
    if (A.forge.burnt > (S.day || 1)) return { ok: false, why: 'Кузня сгорела, Молот отстраивает горн' };
    if ((V.stock.iron || 0) < IRON_ARM) return { ok: false, why: 'Нужно ' + IRON_ARM + ' железа' };
    V.stock.iron -= IRON_ARM;
    r.pros = Object.assign({}, r.pros || {}, { [part]: 'iron' });
    const q = personOf(S, r);
    if (q) q.kit.pros = Object.assign({}, q.kit.pros, { [part]: 'iron' });
    note(S, r, 18, -4, 'Молот выковал железный протез', events);
    note(S, 'all', 2, 0, 'хозяин не бросает калек');
    return { ok: true, text: `Молот куёт ${part.endsWith('Fore') ? 'железную руку' : 'железную ногу'}: ${r.name}` };
  }

  function punish(S, i, how, events) {
    const A = state(S), r = A.people[i];
    if (!r || !r.alive || !r.army) return { ok: false, why: 'Некого' };
    if (how === 'flog') { note(S, r, -8, 15, 'порка', events); note(S, 'all', 0, 4, 'видели порку'); r.wound = Object.assign({}, r.wound || {}, { life: Math.min(r.wound && r.wound.life || 100, 70) }); const q = personOf(S, r); if (q && q.fight) q.fight.life = Math.min(q.fight.life, 70); return { ok: true, text: `${r.name}: порка` }; }
    if (how === 'pit') { note(S, r, -12, 20, 'яма', events); note(S, 'all', -1, 5, 'видели яму'); r.pit = (S.day || 1) + 1; A.hourSet = -1; return { ok: true, text: `${r.name}: в яму до завтра` }; }
    return { ok: false, why: 'Нет такого наказания' };
  }

  function holdPay(S) { const A = state(S); A.pay.held = !A.pay.held; return A.pay.held; }

  function share(S, give, events) {
    const A = state(S), sh = A.share, V = world(S).sides.villain;
    if (!sh) return null;
    A.share = null;
    const men = sh.men.map(i => A.people[i]).filter(r => r && r.alive);
    if (give === 'self' && S.player && (V.stock.silver || 0) >= sh.silver) { V.stock.silver -= sh.silver; K.Econ.earn(S, S.player.bag, sh.silver); note(S, men, -6, 3, 'хозяин забрал долю себе', events); return -sh.silver; }
    if (give === true && (V.stock.silver || 0) >= sh.silver) { V.stock.silver -= sh.silver; note(S, men, 8, -2, 'доля добычи', events); return sh.silver; }
    note(S, men, -3, 0, 'вся добыча в казну', events);
    return 0;
  }

  function takeChest(S, events) {
    const V = world(S).sides.villain;
    if (!S.player || (V.stock.silver || 0) < TAKE) return 0;
    V.stock.silver -= TAKE;
    K.Econ.earn(S, S.player.bag, TAKE);
    note(S, 'all', -2, 1, 'хозяин запустил руку в казну', events);
    return TAKE;
  }

  function build(S, what) {
    const V = world(S).sides.villain;
    if (what === 'ladder') { if (V.stock.logs < LADDER) return { ok: false, why: 'Нужно ' + LADDER + ' брёвен' }; V.stock.logs -= LADDER; V.ladders++; return { ok: true, text: 'Сколочена лестница: всего ' + V.ladders }; }
    if (what === 'ram') { if (V.ram) return { ok: false, why: 'Таран уже есть' }; if (V.stock.logs < RAM_LOGS || V.stock.iron < RAM_IRON) return { ok: false, why: `Нужно ${RAM_LOGS} брёвен и ${RAM_IRON} железа` }; V.stock.logs -= RAM_LOGS; V.stock.iron -= RAM_IRON; V.ram = 1; return { ok: true, text: 'Таран окован' }; }
    return { ok: false, why: '?' };
  }

  function payday(S, events) {
    const A = state(S), V = world(S).sides.villain, day = S.day || 1, list = soldiers(S);
    if (day % 7 !== 0 || A.pay.last === day) return;
    A.pay.last = day;
    if (A.pay.held) { A.pay.held = false; note(S, 'all', -10, 8, 'жалованье задержано', events); return; }
    const cost = list.length * PAY, paid = Math.min(list.length, Math.floor((V.stock.silver || 0) / PAY));
    V.stock.silver -= paid * PAY;
    const sorted = list.slice().sort((a, b) => b.loyalty - a.loyalty);
    if (paid) note(S, sorted.slice(0, paid), 6, -2, 'жалованье в срок', events);
    if (paid < list.length) note(S, sorted.slice(paid), -8, 4, 'не хватило серебра на жалованье', events);
    events.push({ kind: 'pay', paid, total: list.length, cost });
  }

  function daily(S, rnd, events) {
    const A = state(S), day = S.day || 1;
    if (A.daily === day) return;
    A.daily = day;
    for (const r of A.people) {
      if (!r.alive || !r.wound || r.wound.life === undefined) continue;
      const sq = squadOf(S, r.squad), rest = sq && sq.order === 'rest';
      r.wound.life = Math.min(100, r.wound.life + (rest ? 40 : 20));
      if (rest && r.army) r.loyalty = clamp(r.loyalty + 1);
    }
    for (const r of soldiers(S)) r.fear = clamp(r.fear - 2);
    if (villainSide(S) && S.world) { payday(S, events); plan(S, rnd); }
    stats(S);
  }

  function nightly(S, W, rnd, events) {
    const A = state(S), h = hourOf(S), day = S.day || 1;
    if (!villainSide(S) || !S.world || intro(S) || A.night === day || !(h >= 23 || h < 4)) return;
    if (h >= 23) A.night = day;
    else return;
    const l = loyalty(S);
    if (l < 30) {
      const n = 1 + Math.floor(rnd() * 3), list = soldiers(S).filter(r => home(S, r) && !r.spawned).sort((a, b) => a.loyalty - b.loyalty).slice(0, n);
      for (const r of list) { r.deserted = day; r.alive = false; }
      if (list.length) { sync(S); K.World.report(S, 'villain', 'Ночью ушли из форта: ' + list.map(r => r.name).join(', '), CENTER, 2); events.push({ kind: 'desert', names: list.map(r => r.name) }); }
    }
    const L = world(S).sides.elf, guards = soldiers(S).filter(r => r.squad === 'garrison' && home(S, r)).length;
    const p = L.fighters >= 3 ? Math.min(0.6, 0.08 + A.cut / 300) * (guards >= 8 ? 0.7 : 1) : 0;
    if (rnd() >= p) return;
    const kind = ATTACKS[Math.floor(rnd() * ATTACKS.length)], live = S.player && Math.hypot(S.player.mv.pos[0] - CENTER[0], S.player.mv.pos[2] - CENTER[1]) < 90;
    if (live && (kind === 'arson' || kind === 'sentry' || kind === 'prisoners')) { raid(S, W, kind, events); return; }
    attackFar(S, kind, rnd, events);
  }

  function attackFar(S, kind, rnd, events) {
    const A = state(S), V = world(S).sides.villain, day = S.day || 1;
    let text = '';
    if (kind === 'arson') { A.forge.burnt = day + 2; text = 'Эльфы подожгли кузню: Молот два дня без горна'; }
    else if (kind === 'plans') { V.intel = Math.max(0, (V.intel || 0) - 1); text = 'Эльфы украли планы штурма: сведения о дворце пропали'; }
    else if (kind === 'sentry') { const r = soldiers(S).filter(x => x.squad === 'garrison' && home(S, x) && !x.spawned)[0]; if (r) { r.alive = false; sync(S); } text = r ? `Эльфы убили часового: ${r.name}` : 'Эльфы прошли мимо постов'; }
    else if (kind === 'prisoners') { let n = 0; for (const q of S.people) if (q.state === 'jailed' && q.captor && flat2(q.mv.pos, FP.pit) < 6) { q.state = null; n++; } text = n ? `Эльфы вывели из ямы пленных: ${n}` : 'Эльфы открыли яму, но она была пуста'; }
    else { V.stock.logs = Math.max(0, (V.stock.logs || 0) - 10); text = 'Эльфы испортили телеги с брёвнами: −10 брёвен'; }
    K.World.report(S, 'villain', text, CENTER, 2);
    events.push({ kind: 'elfAttack', attack: kind, text });
  }

  function raid(S, W, kind, events) {
    const A = state(S), at = kind === 'arson' ? FP.forge : kind === 'prisoners' ? FP.pit : FP.posts[2];
    A.saboteurs = [];
    for (let k = 0; k < 2; k++) {
      const e = K.Body.member(S.nextId++, 'elf', at[0] + 3 + k * 1.4, at[1] - 4, 0, W);
      e.fight = K.Combat.fighter({ weapon: 'knife', exp: 'soldier' });
      e.role = 'saboteur';
      e.saboteur = { at: S.time, kind };
      e.act = { kind: 'stand', post: [at[0] + 2 + k, at[1] - 3], face: 0 };
      e.anim = K.Anim.state();
      e.frames = new Float32Array(132);
      S.people.push(e);
      A.saboteurs.push(e.id);
    }
    if (kind === 'arson') { A.forge.fire = S.time; A.forge.burnt = (S.day || 1) + 2; }
    events.push({ kind: 'say', who: 'Пень', text: kind === 'arson' ? 'Кузня горит! Эльфы во дворе!' : 'Тревога! Эльфы в форте!' });
  }

  function saboteurStep(S, events) {
    const A = state(S), Pl = S.player;
    if (!A.saboteurs || !A.saboteurs.length) return;
    for (const id of A.saboteurs.slice()) {
      const q = S.people.find(x => x.id === id);
      if (!q || !q.fight || q.fight.down || q.state) { A.saboteurs.splice(A.saboteurs.indexOf(id), 1); continue; }
      const age = S.time - q.saboteur.at, seen = Pl && flat(Pl.mv.pos, q.mv.pos) < 14;
      if ((seen || age > 25) && !q.saboteur.run) { q.saboteur.run = S.time; q.fight.hostile = null; q.act = { kind: 'stand', post: FP.rope.slice(), face: Math.PI }; }
      if (q.saboteur.run && (flat2(q.mv.pos, FP.rope) < 1.6 || S.time - q.saboteur.run > 45)) { q.saboteur.rope = (q.saboteur.rope || 0) + 1 / 60; if (q.saboteur.rope > 6 || S.time - q.saboteur.run > 50) { S.people.splice(S.people.indexOf(q), 1); A.saboteurs.splice(A.saboteurs.indexOf(id), 1); events.push({ kind: 'escaped', name: q.name }); } }
    }
  }

  function cutRope(S, events) {
    const A = state(S);
    let n = 0;
    for (const q of S.people) if (q.saboteur && q.fight && !q.fight.down && flat2(q.mv.pos, FP.rope) < 4) { q.fight.life -= 90; q.mv.hold = 3; n++; }
    A.rope = S.time;
    if (events) events.push({ kind: 'rope', n });
    return n;
  }

  function flames(S) {
    const A = S.army, out = [];
    if (!A || !A.forge.fire || S.time - A.forge.fire > 90) return out;
    const y = S.T ? S.T.heightAt(FP.forge[0], FP.forge[1]) : 140;
    out.push([FP.forge[0], y + 4.4, FP.forge[1], 1, 0.5, 0.15, 3.2], [FP.forge[0] - 3, y + 3.6, FP.forge[1] + 1, 1, 0.6, 0.2, 2.2], [FP.forge[0] + 3, y + 3.8, FP.forge[1] - 1, 1, 0.45, 0.12, 2.4]);
    return out;
  }

  function startAssault(S, W, route, events) {
    const A = state(S), E = world(S), V = E.sides.villain, Wo = K.World;
    if (E.assault && !E.assault.result) return { ok: false, why: 'Штурм уже идёт' };
    if (A.assault) return { ok: false, why: 'Войско уже вышло' };
    const men = soldiers(S).filter(r => home(S, r) && !(r.wound && r.wound.heavy > (S.day || 1)) && !(r.squad === 'garrison' && r.post && r.post !== 'fort'));
    const leads = ['Пень', 'Кривой'].map(n => byName(S, n)).filter(r => r && r.alive);
    if (men.length < 12) return { ok: false, why: 'Для штурма мало людей: ' + men.length };
    const go = men.concat(leads);
    const g = Wo.launch(S, 'villain', 'assault', Wo.POSTS.fort.gate, Wo.POSTS.palace.gate, go.length, { target: 'palace' });
    if (!g) return { ok: false, why: 'Войско не вышло' };
    g.via = route === 'goat' ? 'goat' : 'forest';
    g.light = route === 'goat';
    g.hero = true;
    E.assault = { day: S.day || 1, n: go.length, route: g.via, hero: true };
    for (const r of go) { const q = personOf(S, r); if (q) { stash(S, q); S.people.splice(S.people.indexOf(q), 1); } r.away = g.id; }
    g.crew = go.map(r => makePerson(S, r, W, [0, 0]));
    A.assault = { group: g.id, route: g.via, sent: go.map(r => r.i), day: S.day || 1, emperor: null };
    K.World.report(S, 'all', `${Wo.evil ? Wo.evil(S) : 'Злой'} ведёт войско на штурм дворца: ${go.length} чел., ${route === 'goat' ? 'налегке по козьей тропе' : 'с тараном и лестницами по Лесной дороге'}`, Wo.POSTS.fort.gate, 3);
    if (events) events.push({ kind: 'assaultStart', n: go.length, route: g.via });
    return { ok: true, text: `Войско выходит: ${go.length} чел.`, group: g };
  }

  function assaultStep(S, W, rnd, events) {
    const A = state(S), E = world(S), G = S.guard, Pl = S.player;
    if (!A.assault) return;
    const g = E.groups.find(x => x.id === A.assault.group);
    if (G && G.siege && A.assault.emperor === null && G.siege.inside >= 6) {
      A.assault.emperor = rnd() < 0.5 ? 'flee' : 'fight';
      const em = S.people.find(q => q.guardman !== undefined && q.role === 'emperor');
      if (em) { if (A.assault.emperor === 'flee') { em.act = { kind: 'stand', post: P.PALACE_PTS.postern.slice(), face: 0 }; em.fleeing = true; } else if (Pl) em.fight.hostile = Pl; }
      events.push({ kind: 'say', who: 'Кривой', text: A.assault.emperor === 'flee' ? 'Император бежит к калитке!' : 'Император взял меч. Он в тронном зале!' });
    }
    const em = S.people.find(q => q.fleeing);
    if (em && flat2(em.mv.pos, P.PALACE_PTS.postern) < 2.5) { S.people.splice(S.people.indexOf(em), 1); events.push({ kind: 'say', who: 'Кривой', text: 'Император ушёл через калитку.' }); }
    const res = E.assault && E.assault.result;
    if (!res && g) return;
    for (const i of A.assault.sent) { const r = A.people[i]; if (!r.alive) continue; const q = S.people.find(x => x.soldier === i); if (q && q.fight && q.fight.down) { if (q.fight.down !== 'ko') r.alive = false; } r.away = null; if (q && !q.fight.down && Math.hypot(q.mv.pos[0] - CENTER[0], q.mv.pos[2] - CENTER[1]) > FAR) { stash(S, q); S.people.splice(S.people.indexOf(q), 1); } }
    const beside = A.assault.sent.map(i => A.people[i]).filter(r => r.alive).map(r => r.name);
    A.assault = null;
    A.hourSet = -1;
    sync(S);
    if (res === 'taken' && villainSide(S)) return finish(S, fear(S) > loyalty(S) ? 'fear' : 'loyal', events, beside);
    if (res === 'repelled' && villainSide(S)) { note(S, 'all', -5, 4, 'штурм отбит', events); E.assault = null; }
  }

  function banner(S, Pl, events) {
    const E = world(S), G = S.guard;
    if (!E.assault || E.assault.result || !G || !G.siege) return false;
    if (Math.hypot(Pl.mv.pos[0] - FP.banner[0], Pl.mv.pos[2] - (FP.banner[1] + 8)) > 4) return false;
    E.assault.result = 'taken';
    E.assault.ended = S.day || 1;
    E.assault.banner = true;
    K.World.report(S, 'all', `Знамя ${K.World.evilOf ? K.World.evilOf(S) : 'Злого'} на Белой башне: дворец пал`, FP.banner, 3);
    if (events) events.push({ kind: 'assault', result: 'taken', banner: true });
    const g = E.groups.find(x => x.kind === 'assault' && x.side === 'villain' && x.state !== 'done');
    if (g) { g.state = 'done'; g.n = 0; }
    return true;
  }

  function climb(S, W, Pl) {
    const G = S.guard;
    if (!G || !G.siege) return false;
    const L = G.ladders.find(l => l.up && Math.hypot(Pl.mv.pos[0] - l.at[0], Pl.mv.pos[2] - l.at[1]) < 2.5);
    if (!L) return false;
    Pl.mv = K.Move.body(W, L.top[0], L.top[1], Math.PI / 2);
    return L;
  }

  function plan(S, rnd) {
    const C = S.campaign, day = S.day || 1;
    if (!C || C.ending) return;
    C.part = day < 10 ? 1 : day < 26 ? 2 : 3;
  }

  function finish(S, id, events, beside) {
    const C = S.campaign;
    if (C.ending) return C.ending;
    const A = state(S), name = S.player && S.player.name || 'Злой';
    const end = Object.assign({ id, day: S.day || 1, hero: name, names: id === 'loyal' ? (beside || []).slice() : [], fallen: A.people.filter(r => r.army && !r.alive && !r.deserted).map(r => r.name), deserted: A.people.filter(r => r.deserted).map(r => r.name), loyalty: loyalty(S), fear: fear(S), villain: true }, ENDINGS[id]);
    end.text = end.text.replace('хозяина форта', name);
    C.ending = end;
    C.after = true;
    A.endingNew = true;
    if (events) events.push({ kind: 'ending', ending: end });
    return end;
  }

  function intro(S) { return S.campaign && S.campaign.side === 'villain' && S.campaign.intro && S.campaign.intro.villain ? S.campaign.intro : null; }
  const introStep = S => intro(S) ? intro(S).step : 'free';

  function introGoal(S) {
    const I = intro(S);
    if (!I) return null;
    if (I.step === 'hall') return 'Писарь Гусь ждёт у стола: поговорить (E)';
    if (I.step === 'yard') return 'Выйти во двор: войско в строю. Хвощ просит железную руку';
    if (I.step === 'drill') { const c = I.cmds || {}; return `Учебный бой: «За мной» ${c.follow ? '✓' : '·'}, «Стоять» ${c.hold ? '✓' : '·'}, «Атаковать мою цель» по чучелу ${c.attack && I.hits ? '✓' : '·'} (Q — команды)`; }
    if (I.step === 'table') return 'Военный стол в зале: первая вылазка (E у стола)';
    if (I.step === 'sortie') { const w = FP.sortie[Math.min(FP.sortie.length - 1, I.way || 0)], d = S.player ? Math.round(flat2(S.player.mv.pos, w)) : 0, n = I.way || 0; return `Вести шестерых ${n < 11 ? 'козьей тропой' : n < 13 ? 'в обход заставы западнее, подальше от частокола' : 'полями к Царскому тракту'} · до вехи ${d} м`; }
    if (I.step === 'loot') return 'Перебить охрану корована, добыча ваша';
    if (I.step === 'home') { const d = S.player ? Math.round(Math.hypot(S.player.mv.pos[0] - CENTER[0], S.player.mv.pos[2] - CENTER[1])) : 0; return `Вернуться в форт с добычей · ${d} м`; }
    if (I.step === 'night') return 'Кузня горит! Найти эльфов во дворе. Уходят по верёвке на северной стене: её можно перерезать (E)';
    return null;
  }

  const advance = (S, step, events) => { intro(S).step = step; intro(S).t = 0; events.push({ kind: 'intro', step, goal: introGoal(S) }); };

  function startIntro(S) {
    S.campaign = S.campaign || { side: 'villain' };
    S.campaign.intro = { villain: true, step: 'hall', cmds: {}, hits: 0 };
  }

  function talked(S, role, events, q) {
    const I = intro(S), A = state(S), name = S.player && S.player.name || 'Злой';
    if (role === 'scribe') {
      if (I && I.step === 'hall') { advance(S, 'yard', events); events.push({ kind: 'skip', to: 6.9 }); return `«Впишу в летопись: ${name}, хозяин Старого форта. Утром войско будет в строю.»`; }
      if (I && I.step === 'night') return '«Ловите их, хозяин. Я запишу, кто поймал.»';
      return A.book.length ? `«Записано: ${A.book[A.book.length - 1].why}. Верность войска ${loyalty(S)}, страх ${fear(S)}.»` : '«Летопись ждёт дел.»';
    }
    if (role === 'smith') return A.forge.burnt > (S.day || 1) ? '«Горн разбит. Через день откую снова.»' : '«Железо есть — будет рука. Лестницы и таран сколочу из брёвен.»';
    if (role === 'surgeon') return '«Режу, шью, прижигаю. Серебро вперёд — из казны.»';
    if (role === 'chief') return `«Войско: ${soldiers(S).length} чел. Боятся тебя на ${fear(S)}, верят на ${loyalty(S)}.»`;
    if (role === 'scout') return '«Козья тропа идёт мимо заставы. Ночью там не смотрят вниз.»';
    if (role === 'spymaster') return `«Сведений о дворце: ${S.world ? world(S).sides.villain.intel : 0} из 3. Калитка, сток, смены караула.»`;
    if (role === 'soldier' && q && q.soldier === KEY.length && I && I.step === 'yard') return 'hvosh';
    return null;
  }

  function hvosh(S, give, events) {
    const A = state(S), r = A.people[KEY.length], V = world(S).sides.villain, I = intro(S);
    if (!I || I.step !== 'yard') return null;
    let said;
    if (give && (V.stock.iron || 0) >= IRON_ARM) { V.stock.iron -= IRON_ARM; r.pros = { rFore: 'iron' }; const q = personOf(S, r); if (q) q.kit.pros = Object.assign({}, q.kit.pros, { rFore: 'iron' }); note(S, r, 25, -6, 'железная рука Хвощу', events); note(S, 'all', 3, 0, 'хозяин дал железо калеке'); said = '«Век не забуду, хозяин.»'; S.campaign.hvosh = 'arm'; }
    else { note(S, r, -10, 20, 'отказ Хвощу', events); note(S, 'all', 0, 5, 'хозяин не тратит железо на калек'); said = '«Как скажешь, хозяин.»'; S.campaign.hvosh = 'refused'; }
    advance(S, 'drill', events);
    return said;
  }

  function startSortie(S, W) {
    const I = intro(S), A = state(S);
    if (!I || I.step !== 'table') return false;
    const six = A.people.filter(r => r.army && r.squad === 'krivoy' && r.alive).slice(0, 6);
    for (const r of six) { let q = personOf(S, r); if (!q) { q = makePerson(S, r, W); S.people.push(q); r.spawned = true; } q.squad = 'player'; q.sortie = true; r.drill = true; }
    S.squad = { order: 'follow', fire: false, at: null, face: 0 };
    I.six = six.map(r => r.i);
    advance(S, 'sortie', []);
    return true;
  }

  function introRun(S, W, rnd, events) {
    const I = intro(S), Pl = S.player, A = state(S);
    if (!I || I.step === 'free' || !Pl) return;
    if (I.step === 'yard') {
      const hv = S.people.find(q => q.soldier === KEY.length);
      if (hv && flat2(Pl.mv.pos, FP.hero) < 9 && !I.asked) { I.asked = true; hv.act = { kind: 'stand', post: [Pl.mv.pos[0] + 1.2, Pl.mv.pos[2] + 1.2], face: Math.PI }; events.push({ kind: 'say', who: 'Хвощ', text: 'Хозяин, руку отняли под заставой. Дай железную — буду рубить левой и правой.' }); }
      return;
    }
    if (I.step === 'drill') {
      if (!S.people.some(q => q.drillStraw)) for (const d of FP.dummies) { const s = K.Body.strawman(S.nextId++, d[0], d[1], Math.PI, W); s.drillStraw = true; S.people.push(s); }
      if (!I.squad) {
        I.squad = A.people.filter(r => r.army && r.squad === 'pen' && r.alive).slice(0, 4).map(r => r.i);
        for (const i of I.squad) { const r = A.people[i], q = personOf(S, r); if (q) { q.squad = 'player'; r.drill = true; } }
        S.squad = { order: 'hold', fire: false, at: null, face: 0 };
        I.cmds = {};
      }
      const Q = S.squad || {};
      if (Q.order === 'follow') I.cmds.follow = true;
      if (Q.order === 'hold' && I.cmds.follow) I.cmds.hold = true;
      if (Q.target && Q.target.drillStraw) I.cmds.attack = true;
      for (const e of events) if (e.kind === 'cut' && e.to && e.to.drillStraw && e.who && e.who.squad === 'player') I.hits = (I.hits || 0) + 1;
      if (I.cmds.follow && I.cmds.hold && I.cmds.attack && I.hits) {
        for (const i of I.squad) { const r = A.people[i], q = personOf(S, r); r.drill = false; if (q) { q.squad = null; q.fight.hostile = null; } }
        S.squad = null;
        for (const q of S.people.slice()) if (q.drillStraw) S.people.splice(S.people.indexOf(q), 1);
        events.push({ kind: 'say', who: 'Пень', text: 'Слушаются. Теперь веди их за добычей.' });
        advance(S, 'table', events);
      }
      return;
    }
    if (I.step === 'sortie') {
      I.way = I.way || 0;
      while (I.way < FP.sortie.length - 1 && flat2(Pl.mv.pos, FP.sortie[I.way]) < 22) I.way++;
      if (!I.caravan && flat2(Pl.mv.pos, FP.tract) < 150) {
        const R = K.Caravan.routes().trade, s = K.Terrain.nearest(R.line, FP.tract[0], FP.tract[1]).s;
        const c = K.Caravan.make(S, 'trade', S.day || 1, Math.max(R.marks[0] + 5, s - 110), rnd);
        c.intro = true;
        let e = 0;
        c.crew = c.crew.filter(m => m.role !== 'escort' || e++ < 2);
        for (const m of c.crew) if (m.role === 'escort') m.weak = true;
        I.caravan = c.id;
        events.push({ kind: 'say', who: 'Кривой', text: 'Бубенцы. Торговый корован идёт к дворцу. Ждём у дороги.' });
        advance(S, 'loot', events);
      }
      return;
    }
    if (I.step === 'loot') {
      const c = K.Caravan.byId(S, I.caravan);
      if (!c) { advance(S, 'home', events); return; }
      const escorts = K.Caravan.crewOf(S, c).filter(q => q.role === 'escort' && q.fight && !q.fight.down && !q.state);
      if (escorts.length && flat(escorts[0].mv.pos, Pl.mv.pos) < 40) for (const q of S.people) if (q.sortie && q.fight && !q.fight.down && (!q.fight.hostile || q.fight.hostile.fight.down)) { const foe = escorts[q.id % escorts.length]; q.fight.hostile = foe; const B = q.brain || (q.brain = K.AI.brain()); B.last = foe.mv.pos.slice(); B.lostT = 0; B.ignoreUntil = 0; }
      if (c.live && !escorts.length && !I.robbed) {
        I.robbed = true;
        const V = world(S).sides.villain, silver = 60 + Math.floor(rnd() * 40);
        V.stock.silver += silver;
        V.stock.bread += 20;
        c.robbed = true;
        c.state = 'stopped';
        for (const cart of c.carts) cart.bales = [];
        I.loot = silver;
        A.share = { silver: Math.floor(silver / 2), squad: 'krivoy', men: I.six.slice() };
        events.push({ kind: 'say', who: 'Кривой', text: `Добыча наша: ${silver} серебра и хлеб. Уходим, пока застава не проснулась.` });
        advance(S, 'home', events);
      }
      return;
    }
    if (I.step === 'home') {
      if (Math.hypot(Pl.mv.pos[0] - CENTER[0], Pl.mv.pos[2] - CENTER[1]) < 40) {
        for (const i of I.six || []) { const r = A.people[i], q = personOf(S, r); r.drill = false; if (q) { q.squad = null; q.sortie = false; } }
        S.squad = null;
        A.hourSet = -1;
        events.push({ kind: 'skip', to: 22.5 });
        advance(S, 'night', events);
      }
      return;
    }
    if (I.step === 'night') {
      if (!I.raid && hourOf(S) >= 22) { I.raid = true; raid(S, W, 'arson', events); }
      if (I.raid && (!A.saboteurs || !A.saboteurs.length)) {
        const caught = S.people.filter(q => q.saboteur && (q.fight.down || q.state)).length;
        events.push({ kind: 'say', who: 'Гусь', text: caught ? 'Поймали. Военный стол твой, хозяин: пиши приказы.' : 'Ушли по верёвке. Военный стол твой, хозяин: пиши приказы.' });
        S.campaign.saboteurs = caught ? 'caught' : 'fled';
        A.table = true;
        advance(S, 'free', events);
        S.campaign.intro = null;
      }
    }
  }

  function react(S, events) {
    const Pl = S.player, A = state(S);
    if (!Pl || !villainSide(S)) return;
    for (const e of events) {
      if (e.kind === 'healed' && e.by === 'player' && e.who && e.who.soldier !== undefined) { const r = A.people[e.who.soldier]; note(S, r, 15, -3, 'хозяин вынес раненого сам'); note(S, 'all', 2, 0, 'хозяин выносит своих'); (S.campaign.rescues || (S.campaign.rescues = [])).push({ by: 'вы', who: r.name, day: S.day || 1 }); }
      if (e.kind === 'rescued') (S.campaign.rescues || (S.campaign.rescues = [])).push({ by: e.by && e.by.name || 'свой', who: 'вас', day: S.day || 1 });
      if (e.kind === 'down' && e.who === Pl) heroDown(S, events);
    }
  }

  function heroDown(S, events) {
    const A = state(S), Pl = S.player, l = loyalty(S), f = fear(S), E = world(S);
    let fled = 0, took = 0;
    for (const q of S.people) {
      if (q.soldier === undefined || !q.fight || q.fight.down || flat(q.mv.pos, Pl.mv.pos) > 30) continue;
      const r = A.people[q.soldier];
      if (r.fear > r.loyalty) { fled++; q.act = { kind: 'stand', post: [q.mv.pos[0] + (q.mv.pos[0] - Pl.mv.pos[0]) * 3, q.mv.pos[2] + (q.mv.pos[2] - Pl.mv.pos[2]) * 3], face: 0 }; q.fight.hostile = null; q.squad = null; }
    }
    if (fled && f > l) { const s = Pl.bag.find(x => x.id === 'silver'); if (s && s.n > 0) { took = Math.ceil(s.n / 2); s.n -= took; } }
    if (fled) events.push({ kind: 'say', who: 'Гусь', text: took ? `Боящиеся разбежались, кто-то обшарил хозяина: −${took} серебра.` : 'Боящиеся разбежались.' });
    if (E.assault && !E.assault.result && A.assault && l < 60) finish(S, 'abandoned', events);
  }

  function run(S, dt, W, rnd) {
    const events = [];
    if (!S.T) S.T = W.terrain;
    state(S);
    census(S, W);
    routine(S);
    corpses(S, events);
    if (S.world) {
      track(S, events);
      if (villainSide(S) && !S.campaign.ending) { nightly(S, W, rnd, events); saboteurStep(S, events); assaultStep(S, W, rnd, events); }
      if (hourOf(S) >= 6 && state(S).daily !== (S.day || 1)) daily(S, rnd, events);
    }
    state(S).tick = (state(S).tick || 0) + dt;
    if (state(S).tick > 1) { state(S).tick = 0; sync(S); }
    return events;
  }

  function post(S, events, W, rnd, results) {
    react(S, results && results.length ? events.concat(results) : events);
    introRun(S, W, rnd, events);
  }

  K.Villain = { TAKE, takeChest, KEY, ARMY, SQUADS, ORDERS, TARGETS, ENDINGS, INTRO, ATTACKS, NEAR, FAR, PAY, IRON_ARM, HEAL, LADDER, RAM_LOGS, RAM_IRON, state, roster, soldiers, loyalty, fear, stats, note, spotFor, census, order, track, settle, enlist, sync, heal, forgeArm, punish, holdPay, share, build, payday, daily, nightly, attackFar, raid, cutRope, flames, startAssault, banner, climb, plan, finish, startIntro, introStep, introGoal, talked, hvosh, startSortie, react, run, post, stump, squadOf, members, ready };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
