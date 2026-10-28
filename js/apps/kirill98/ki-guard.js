(function (K) {
  'use strict';

  const P = K.Places, PP = P.PALACE_PTS, CENTER = [1265, 665];
  const NEAR = 300, FAR = 370, ID0 = 92000, POST_R = 10, POST_LEAVE = 30, STRAGGLE = 6, STRAGGLE_T = 10, LADDER_CLIMB = 5, LADDER_BACK = 40, RAM_EVERY = 4, RAM_HIT = 6, BRACE = 10;
  const RANKS = Object.freeze([{ name: 'Рядовой', at: -Infinity, pay: 12 }, { name: 'Старший', at: 6, pay: 20 }, { name: 'Десятник', at: 14, pay: 30 }, { name: 'Сотник', at: 26, pay: 45 }]);
  const TEN = Object.freeze(['Гаврила', 'Сенька', 'Фома', 'Прохор', 'Ерёма', 'Тихон', 'Афоня', 'Кузьма', 'Лука']);
  const KEY = Object.freeze([
    { name: 'Гордей Строгов', role: 'commander', fig: 'm', look: { head: 'crest', hairColor: [0.45, 0.42, 0.4], beard: true, armor: ['mail', 'collar'] }, gear: ['sword', true] },
    { name: 'Савва', role: 'medic', fig: 'm', look: { head: null, hairColor: [0.62, 0.6, 0.56], beard: true, main: [0.9, 0.9, 0.86] }, gear: [null, false] },
    { name: 'Митрофан', role: 'veteran', fig: 'm', look: { head: 'crest', hairColor: [0.7, 0.7, 0.68], beard: true, pros: { rShin: 'peg' }, cut: { rShin: 'healed' } }, gear: ['spear', false] },
    { name: 'Лукьян II', role: 'emperor', fig: 'm', look: { head: null, hairColor: [0.3, 0.24, 0.18], beard: true, main: [0.7, 0.12, 0.14], accent: [0.9, 0.78, 0.3] }, gear: ['sword', false] },
    { name: 'Пантелей', role: 'quarter', fig: 'm', look: { head: null, hairColor: [0.4, 0.3, 0.2], beard: true }, gear: [null, false] },
    { name: 'Демид', role: 'kennel', fig: 'm', look: { head: 'crest', hairColor: [0.3, 0.2, 0.12] }, gear: ['spear', false] }
  ]);
  const EXTRA = Object.freeze(['Никифор', 'Савелий', 'Игнат', 'Ермолай', 'Осип', 'Вавила', 'Евсей', 'Захар', 'Мартын', 'Нестор', 'Агафья', 'Марфа', 'Устинья', 'Пелагея']);
  const ORDERS = Object.freeze({
    gate: { name: 'Пост у ворот', text: 'стоять у ворот до полудня, проверять пропуска', until: 12 },
    wall: { name: 'Пост на стене', text: 'стоять на западной стене до вечера', until: 19 },
    treasury: { name: 'Пост у казны', text: 'стоять у казны до вечера', until: 19 },
    tower: { name: 'Пост на Белой башне', text: 'стоять у Белой башни до вечера', until: 19 },
    patrol: { name: 'Дозор', text: 'пройти путь дозора и вернуться', until: 20 },
    escort: { name: 'Сопровождение', text: 'довести казённый корован до ворот', until: 22 },
    raid: { name: 'Набег', text: 'идти в строю, слушать команды', until: 23 },
    relief: { name: 'Подкрепление', text: 'идти на заставу с десятком', until: 23 },
    duty: { name: 'Наряд', text: 'чистить конюшню', until: 14 }
  });
  const SEALS = Object.freeze({ palace: 'дворцовая', town: 'городская', merchant: 'купеческая' });
  const PURPOSES = Object.freeze([
    { text: 'везу муку на кухню', seal: 'merchant', to: 'к повару', from: 'с мельницы' },
    { text: 'несу письмо писарю', seal: 'town', to: 'к писарю', from: 'из Мостовицы' },
    { text: 'чиню упряжь на конюшне', seal: 'palace', to: 'к конюху', from: 'из Царёва' },
    { text: 'продаю сукно для казармы', seal: 'merchant', to: 'к квартирмейстеру', from: 'с южного тракта' },
    { text: 'несу травы лекарю Савве', seal: 'town', to: 'к лекарю', from: 'с хутора Ключи' },
    { text: 'кую подковы', seal: 'palace', to: 'к кузнецу', from: 'из Царёва' },
    { text: 'принёс жалобу старосты', seal: 'town', to: 'к сотнику', from: 'из Царёва' }
  ]);
  const SPY_ITEMS = Object.freeze(['rope', 'flint', 'wallMap']);
  const ENDINGS = Object.freeze({
    stood: { name: 'Дворец устоял', text: 'На последней перекличке Строгов называет всех по именам. Громче всех звучат те, кого вы выносили.' },
    fort: { name: 'Форт взят', text: 'Старый форт пал изнутри, через штрек. Знамя империи на знаменной башне, Злой бежал или лёг.' },
    fell: { name: 'Дворец пал', text: 'Знамя Злого на Белой башне. Император бежал, война идёт дальше.' },
    expelled: { name: 'Выгнан со службы', text: 'Строгов снимает с вас гребень. Ворота закрываются за спиной.' }
  });
  const INTRO = Object.freeze(['muster', 'gate', 'drill', 'escort', 'ambush', 'report', 'free']);

  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const town = S => P.town(S.T);
  const guardSide = S => !!S.campaign && S.campaign.side === 'guard';
  const rankOf = sv => RANKS.reduce((r, x) => sv >= x.at ? x : r, RANKS[0]);
  const hourOf = S => S.hour || 0;

  function roster() {
    const out = KEY.map((k, i) => Object.assign({ i, alive: true, debt: 0, wound: null, ten: false }, k));
    TEN.forEach((n, j) => out.push({ i: out.length, name: n, role: 'ten', fig: 'm', ten: true, alive: true, debt: 0, wound: null, slot: j < 4 ? j : j + 1 }));
    EXTRA.forEach((n, j) => out.push({ i: out.length, name: n, role: 'guard', fig: j >= 10 ? 'f' : 'm', ten: false, alive: true, debt: 0, wound: null, post: j % 4 }));
    return out;
  }

  function state(S) {
    if (S.guard) return S.guard;
    S.guard = { people: roster(), live: false, order: null, book: [], muster: { day: 0 }, visitors: null, trophies: null, jail: null, gramota: false, ladders: [], gate: { hp: 100, broken: false }, siege: null, hourSet: -1 };
    return S.guard;
  }

  const service = S => (S.standing || {}).service || 0;

  function note(S, d, why, events) {
    const G = state(S), st = S.standing || (S.standing = { service: 0, respect: 0, loyalty: 0 }), before = rankOf(st.service || 0);
    st.service = Math.round(((st.service || 0) + d) * 10) / 10;
    G.book.push({ day: S.day || 1, hour: Math.floor(hourOf(S)), d, why });
    if (G.book.length > 60) G.book.splice(0, G.book.length - 60);
    const after = rankOf(st.service);
    if (events) { events.push({ kind: 'service', d, why, total: st.service }); if (after !== before) events.push({ kind: 'rank', rank: after.name, up: after.at > before.at }); }
    if (st.service <= -10 && guardSide(S) && !S.campaign.ending) finish(S, 'expelled', events);
    return st.service;
  }

  function spotFor(S, r) {
    const G = state(S), o = town(S), h = hourOf(S), night = h >= 22 || h < 6, muster = h >= 6.8 && h < 7.6;
    const keep = id => { const k = o.keepers[id]; return k ? { at: k.at.slice(), face: k.face } : { at: CENTER.slice(), face: 0 }; };
    const bed = id => { const beds = o.beds.filter(b => b.building === id); const b = beds[r.i % beds.length]; return b ? { at: b.at.slice(), face: b.yaw } : keep(id); };
    if (r.role === 'emperor') return keep('throne');
    if (r.role === 'medic') return keep('infirmary');
    if (r.role === 'quarter') return keep('armory');
    if (r.role === 'kennel') return { at: [1252, 590], face: 0 };
    if (r.role === 'veteran') return { at: [PP.gate[0] + 1, PP.gate[1] + 5], face: -Math.PI / 2 };
    if (r.role === 'commander') return muster || G.siege ? { at: PP.commander.slice(), face: 0 } : { at: [1226, 724], face: Math.PI };
    if (r.ten) {
      if (G.siege) { const w = PP.wall[r.slot % 2]; return { at: [w[0] + 3, w[1] + (r.slot - 4) * 1.2], face: -Math.PI / 2 }; }
      if (muster) { const s = PP.line[r.slot]; return { at: s.slice(), face: Math.PI }; }
      if (night) return bed('barracks');
      return { at: [1218 + (r.slot % 5) * 3, 715 + Math.floor(r.slot / 5) * 2.5], face: r.slot };
    }
    const posts = [PP.wall[0], PP.wall[1], PP.treasury, PP.tower];
    const p = posts[r.post % posts.length];
    return { at: [p[0] + (r.post > 3 ? 2 : 0) + (p === PP.wall[0] || p === PP.wall[1] ? 3 : 0), p[1]], face: -Math.PI / 2 };
  }

  function makePerson(S, r, W) {
    const s = spotFor(S, r), p = K.Body.member(ID0 + r.i, 'guard', s.at[0], s.at[1], s.face, W, { kind: 'stand', post: s.at.slice(), face: s.face }, r.fig);
    p.name = r.name;
    p.role = r.role === 'ten' || r.role === 'guard' ? 'soldier' : r.role;
    p.guardman = r.i;
    p.debt = r.debt || 0;
    if (r.look) { Object.assign(p.kit, r.look); p.kit.pros = Object.assign({}, r.look.pros || {}); p.kit.cut = Object.assign({}, r.look.cut || {}); }
    if (r.gear) p.fight = K.Combat.fighter({ weapon: r.gear[0], shield: r.gear[1], exp: r.role === 'commander' || r.role === 'veteran' ? 'veteran' : 'soldier' });
    if (r.role === 'emperor') p.kit.head = 'crown';
    if (r.wound) { p.kit.cut = Object.assign({}, p.kit.cut, r.wound.cut || {}); if (r.wound.life !== undefined) p.fight.life = r.wound.life; }
    p.anim = K.Anim ? K.Anim.state() : null;
    p.frames = new Float32Array(132);
    return p;
  }

  function census(S, W) {
    const G = state(S), focus = S.player ? S.player.mv.pos : S.focus || null, d = focus ? Math.hypot(focus[0] - CENTER[0], focus[2] - CENTER[1]) : Infinity;
    if (!G.live && d < NEAR) {
      for (const r of G.people) if (r.alive && !r.away && !S.people.some(q => q.guardman === r.i)) { S.people.push(makePerson(S, r, W)); r.spawned = true; }
      G.live = true;
      G.hourSet = -1;
    } else if (G.live && d > FAR) {
      for (const q of S.people.slice()) {
        if (q.guardman === undefined || q.squad === 'player' || q.march) continue;
        const r = G.people[q.guardman];
        r.debt = q.debt || 0;
        r.wound = { cut: Object.assign({}, q.kit.cut || {}), life: q.fight ? Math.min(100, q.fight.life) : 100 };
        r.spawned = false;
        S.people.splice(S.people.indexOf(q), 1);
      }
      G.live = false;
    }
  }

  function routine(S) {
    const G = state(S), key = Math.floor(hourOf(S) * 4) + ':' + (G.siege ? 1 : 0);
    if (!G.live || G.hourSet === key) return;
    G.hourSet = key;
    for (const q of S.people) {
      if (q.guardman === undefined || q.squad === 'player' || q.march || q.trainer) continue;
      const s = spotFor(S, G.people[q.guardman]);
      q.act = { kind: 'stand', post: s.at, face: s.face };
    }
  }

  function corpses(S, events) {
    const G = state(S);
    for (const b of S.bodies) {
      if (!b.who || b.who.team !== 'guard' || b.gcounted || b.cause === 'ko') continue;
      const r = G.people.find(x => x.name === b.who.name && x.spawned);
      if (!r) continue;
      b.gcounted = true;
      r.spawned = false;
      r.alive = false;
      if (K.World && S.world) { const E = K.World.state(S).sides.guard; E.men = Math.max(0, E.men - 1); }
      events.push({ kind: 'guardDead', name: r.name });
    }
  }

  function makeOrder(S, rnd, kind, extra) {
    const O = ORDERS[kind], day = S.day || 1;
    const o = Object.assign({ kind, name: O.name, text: O.text, day, until: O.until, state: 'given', away: 0, seen: 0, at: null, pts: null, i: 0 }, extra || {});
    if (kind === 'gate') o.at = PP.gate.slice();
    if (kind === 'wall') o.at = [PP.wall[0][0] + 0.5, PP.wall[0][1]];
    if (kind === 'treasury') o.at = PP.treasury.slice();
    if (kind === 'tower') o.at = PP.tower.slice();
    if (kind === 'duty') o.at = [1215, 591];
    if (kind === 'patrol') { const keys = Object.keys(PP.patrols), k = keys[Math.floor(rnd() * keys.length)]; o.route = k; o.pts = PP.patrols[k].map(q => q.slice()); o.name += ': ' + { ford: 'к броду', fields: 'по полям', outpost: 'к заставе' }[k]; }
    return o;
  }

  function pickOrder(S, rnd) {
    const G = state(S), day = S.day || 1, E = S.world;
    if (G.duty) { G.duty = false; return makeOrder(S, rnd, 'duty'); }
    if (day === 8 && E && E.posts.outpost.side === 'guard') return makeOrder(S, rnd, 'relief');
    if (E && E.groups.some(g => g.side === 'guard' && g.kind === 'punish' && g.day === day && !g.back)) return makeOrder(S, rnd, 'raid');
    if ((day - 3) % 7 === 0) return makeOrder(S, rnd, 'escort');
    const spies = E && E.groups.some(g => g.side === 'villain' && g.kind === 'spy' && g.target === 'palace' && g.state !== 'done');
    const list = spies ? ['gate', 'gate', 'wall', 'patrol'] : ['gate', 'wall', 'treasury', 'tower', 'patrol', 'patrol'];
    return makeOrder(S, rnd, list[Math.floor(rnd() * list.length)]);
  }

  function musterStep(S, W, rnd, events) {
    const G = state(S), Pl = S.player, day = S.day || 1, h = hourOf(S);
    if (!guardSide(S) || !Pl || G.jail || S.campaign.ending || introStep(S) !== 'free') return;
    if (G.muster.day !== day && h >= 6.8 && h < 7.6) G.muster = { day, called: false, late: false };
    if (G.muster.day !== day || G.muster.called) return;
    const slot = PP.line[PP.hero], at = Math.hypot(Pl.mv.pos[0] - slot[0], Pl.mv.pos[2] - slot[1]) < 2.5;
    if (at || h >= 7.6) {
      G.muster.called = true;
      if (!at) { G.muster.late = true; note(S, -1, 'опоздал на построение', events); G.docked = true; }
      const names = G.people.filter(r => r.ten && r.alive).map(r => r.name);
      const rank = rankOf(service(S)), pay = G.docked ? 0 : rank.pay;
      G.docked = false;
      if (day > 1 && pay) { const s = Pl.bag.find(x => x.id === 'silver'); if (s) s.n += pay; else Pl.bag.push({ id: 'silver', n: pay }); }
      G.order = pickOrder(S, rnd);
      events.push({ kind: 'muster', names, late: !at, pay: day > 1 ? pay : 0, order: G.order, rank: rank.name });
    }
  }

  function orderStep(S, dt, W, rnd, events) {
    const G = state(S), o = G.order, Pl = S.player;
    if (!o || o.state !== 'given' || !Pl || !guardSide(S)) return;
    const h = hourOf(S), day = S.day || 1, p = Pl.mv.pos;
    if (o.day < day && o.kind !== 'escort') { o.state = 'failed'; note(S, -1, 'приказ не выполнен: ' + o.name.toLowerCase(), events); return; }
    if (o.at && (o.kind === 'gate' || o.kind === 'wall' || o.kind === 'treasury' || o.kind === 'tower')) {
      const d = Math.hypot(p[0] - o.at[0], p[2] - o.at[1]);
      if (d < POST_R) { o.seen = 1; o.away = 0; } else if (o.seen) { o.away += dt; if (o.away > POST_LEAVE) { o.state = 'failed'; note(S, -2, 'ушёл с поста', events); return; } }
      if (h >= o.until && o.seen) { o.state = 'done'; note(S, o.kind === 'gate' && G.visitors && G.visitors.spiesCaught ? 2 : 1, 'отстоял: ' + o.name.toLowerCase(), events); }
      return;
    }
    if (o.kind === 'patrol') {
      const q = o.pts[o.i];
      if (q && Math.hypot(p[0] - q[0], p[2] - q[1]) < 15) { o.i++; if (o.i >= o.pts.length) { o.state = 'done'; note(S, 1, 'дозор пройден', events); } }
      else if (h >= o.until) { o.state = 'failed'; note(S, -1, 'дозор не пройден', events); }
      return;
    }
    if (o.kind === 'duty') {
      if (Math.hypot(p[0] - o.at[0], p[2] - o.at[1]) < 6) { o.away += dt; if (o.away > 20) { o.state = 'done'; o.skip = 2; note(S, 0, 'наряд отбыт', events); } }
      return;
    }
    if (o.kind === 'escort') {
      const c = S.caravans && S.caravans.list.find(x => x.kind === 'treasury' && x.day === o.day);
      if (!c) return;
      if (c.state === 'arrived' || c.done && !c.lost) { o.state = 'done'; note(S, c.robbed ? 1 : 2, c.robbed ? 'корован дошёл с потерями' : 'корован доведён целым', events); }
      else if (c.lost) { o.state = 'failed'; note(S, -1, 'казённый корован потерян', events); }
      return;
    }
    if (o.kind === 'raid' || o.kind === 'relief') formationStep(S, dt, W, events);
  }

  function joinGroup(S, W, kind) {
    const G = state(S), E = K.World.state(S), Wo = K.World, to = kind === 'relief' ? Wo.POSTS.outpost.at : Wo.POSTS.korni.at;
    const ten = S.people.filter(q => q.guardman !== undefined && (G.people[q.guardman].ten || G.people[q.guardman].role === 'commander') && q.fight && !q.fight.down);
    const g = Wo.launch(S, 'guard', kind === 'relief' ? 'relief' : 'punish', Wo.POSTS.palace.gate, to, ten.length, { target: kind === 'relief' ? 'outpost' : 'korni', fire: kind !== 'relief', dogs: kind !== 'relief' });
    if (!g) return null;
    g.hero = true;
    for (const q of ten) { S.people.splice(S.people.indexOf(q), 1); q.march = null; g.crew.push(q); }
    G.order.group = g.id;
    return g;
  }

  function playerSlot(S) {
    const G = state(S), o = G.order, g = o && o.group && K.World.state(S).groups.find(x => x.id === o.group);
    if (!g || !g.live || !g.line) return null;
    const q = K.Terrain.pointAt(g.line, Math.max(0, g.s - g.n * 1.6)), side = 0.8;
    return { at: [q.x - q.tz * side, q.z + q.tx * side], g };
  }

  function formationStep(S, dt, W, events) {
    const G = state(S), o = G.order, Pl = S.player, Wo = K.World;
    if (!o.group) { if (hourOf(S) >= 8) joinGroup(S, W, o.kind); return; }
    const E = Wo.state(S), g = E.groups.find(x => x.id === o.group);
    if (!g) { o.state = 'done'; note(S, o.disobeyed ? 0 : 1, (o.kind === 'relief' ? 'подкрепление: ' : 'набег: ') + 'вернулись', events); return; }
    const sl = playerSlot(S);
    if (sl) {
      const d = Math.hypot(Pl.mv.pos[0] - sl.at[0], Pl.mv.pos[2] - sl.at[1]);
      o.far = d > STRAGGLE ? (o.far || 0) + dt : 0;
      if (o.far > STRAGGLE_T && !o.straggled) { o.straggled = true; note(S, -1, 'отбился от строя', events); }
      if (o.far === 0) o.straggled = false;
    }
    const target = g.to, near = Math.hypot(g.at[0] - target[0], g.at[2] - target[1]), crew = S.people.filter(q => q.march && q.march.id === g.id), able = crew.filter(q => q.fight && !q.fight.down);
    if (!o.cmd && g.live && near < 90 && !g.back) { o.cmd = 'stop'; o.cmdAt = S.time; events.push({ kind: 'command', text: 'Стой!' }); }
    if (o.cmd === 'stop' && S.time - o.cmdAt > 4) { o.cmd = 'shields'; o.cmdAt = S.time; for (const q of able) if (q.fight.shield) K.Combat.guard(q.fight, true, 'right'); events.push({ kind: 'command', text: 'Щиты!' }); }
    if (o.cmd === 'shields' && S.time - o.cmdAt > 3) { o.cmd = 'forward'; o.cmdAt = S.time; events.push({ kind: 'command', text: 'Вперёд!' }); }
    if (o.cmd === 'stop' && sl) { const ahead = Math.hypot(Pl.mv.pos[0] - target[0], Pl.mv.pos[2] - target[1]) < near - STRAGGLE; if (ahead && !o.disobeyed) { o.disobeyed = true; note(S, -3, 'не выполнил команду «Стой!»', events); } }
    if (o.cmd && o.cmd !== 'back' && able.length && able.length <= g.start * (2 / 3)) { o.cmd = 'back'; o.cmdAt = S.time; events.push({ kind: 'command', text: 'Отход!' }); if (o.kind === 'relief') prohor(S, events); }
    if (o.kind === 'relief' && !o.cmdRelief && E.posts.outpost.side === 'villain' && g.live) { o.cmdRelief = true; o.cmd = 'back'; events.push({ kind: 'command', text: 'Застава потеряна. Отход!' }); prohor(S, events); }
    if (o.cmd === 'back' && sl && !o.disobeyed && Math.hypot(Pl.mv.pos[0] - target[0], Pl.mv.pos[2] - target[1]) < 25 && S.time - o.cmdAt > 15) { o.disobeyed = true; note(S, -3, 'не выполнил команду «Отход!»', events); }
  }

  function prohor(S, events) {
    const q = S.people.find(x => x.name === 'Прохор' && x.fight && !x.fight.down);
    if (!q || S.campaign.prohor) return;
    q.kit.cut = Object.assign({}, q.kit.cut, { rShin: 'fresh' });
    q.fight.bleed = K.Wounds.bleed();
    q.fight.bleed.medium = 120;
    q.noAid = true;
    q.march = null;
    S.campaign.prohor = 'wounded';
    events.push({ kind: 'prohor', who: q });
  }

  function visitorsFor(S, rnd) {
    const day = S.day || 1, n = 8 + Math.floor(rnd() * 8), spies = Math.max(S.campaign && S.campaign.intro && S.campaign.intro.step === 'gate' ? 1 : 0, S.world ? S.world.groups.filter(g => g.kind === 'spy' && g.side === 'villain' && g.target === 'palace' && g.state !== 'done').length : 0);
    const list = [];
    for (let i = 0; i < n; i++) {
      const pu = PURPOSES[Math.floor(rnd() * PURPOSES.length)], spy = i < spies, fig = rnd() < 0.3 ? 'f' : 'm', signs = [];
      const v = { id: 'v' + day + '-' + i, fig, seed: day * 97 + i * 13, name: K.Data.NAMES.town[fig][(day * 3 + i) % K.Data.NAMES.town[fig].length] + ' ' + ['из Царёва', 'из Мостовицы', 'с хутора', 'с тракта'][i % 4], purpose: pu.text, from: pu.from, to: pu.to, seal: pu.seal, fake: false, date: day, items: ['bread'], spy, signs, state: 'queue' };
      if (spy) {
        const k = Math.floor(rnd() * 3);
        if (k === 0 || rnd() < 0.4) { v.fake = true; signs.push('печать'); }
        if (k === 1) { v.seal = ['palace', 'town', 'merchant'].filter(s => s !== pu.seal)[Math.floor(rnd() * 2)]; signs.push('цель'); }
        if (k === 2 || rnd() < 0.5) { v.items.push(SPY_ITEMS[Math.floor(rnd() * SPY_ITEMS.length)]); signs.push('сума'); }
        if (rnd() < 0.3) { v.date = day - 2; signs.push('дата'); }
        v.answer = rnd() < 0.5 ? { from: pu.from, to: 'к казне', why: pu.text } : { from: 'из форта', to: pu.to, why: pu.text };
      } else v.answer = { from: pu.from, to: pu.to, why: pu.text };
      list.push(v);
    }
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    return { day, list, next: 0, t: 0, done: 0, spiesCaught: 0, spiesMissed: 0, wrong: 0 };
  }

  function gateStep(S, dt, W, rnd) {
    const G = state(S), o = G.order, Pl = S.player;
    if (!o || o.kind !== 'gate' || o.state !== 'given' || !Pl) return;
    if (!G.visitors || G.visitors.day !== (S.day || 1)) {
      G.visitors = visitorsFor(S, rnd);
      if (introStep(S) === 'gate') { const L = G.visitors.list, spy = L.find(v => v.spy), hon = L.filter(v => !v.spy); G.visitors.list = [hon[0], spy, hon[1]].filter(Boolean); }
    }
    const V = G.visitors;
    if (S.people.some(q => q.visitor && q.visitor.state === 'queue')) return;
    V.t += dt;
    if (V.t < 6 || V.next >= V.list.length || Math.hypot(Pl.mv.pos[0] - PP.gate[0], Pl.mv.pos[2] - PP.gate[1]) > 20) return;
    V.t = 0;
    const v = V.list[V.next++], q = K.Body.member(S.nextId++, 'town', PP.queue[0], PP.queue[1], Math.PI / 2, W, { kind: 'stand', post: [PP.gate[0] - 3, PP.gate[1] - 1], face: Math.PI / 2 }, v.fig);
    q.kit = K.Body.kit('town', v.fig, K.rng(v.seed));
    q.name = v.name.split(' ')[0];
    q.role = 'visitor';
    q.visitor = v;
    q.fight = K.Combat.fighter({});
    q.sack = v.items.map(id => ({ id, n: 1 }));
    q.anim = K.Anim.state();
    q.frames = new Float32Array(132);
    S.people.push(q);
  }

  function decide(S, q, how, events) {
    const G = state(S), v = q.visitor, V = G.visitors;
    if (!v || v.state !== 'queue') return null;
    v.state = how;
    V.done++;
    let said = '';
    if (how === 'pass') { q.act = { kind: 'stand', post: [1200, 700 + (V.done % 5) * 2], face: Math.PI / 2 }; if (v.spy) { V.spiesMissed++; if (S.world) S.world.sides.villain.intel = Math.min(3, (S.world.sides.villain.intel || 0) + 1); } said = 'Проходи.'; }
    else if (how === 'turn') { q.act = { kind: 'stand', post: [PP.queue[0] - 60, PP.queue[1] + 10], face: -Math.PI / 2 }; said = 'Разворачивайся.'; }
    else {
      const pr = P.PRISONS.guard;
      q.state = 'jailed';
      q.act = { kind: 'stand', post: [pr.at[0] + (V.done % 3) * 1.1, pr.at[1]], face: pr.face };
      if (v.spy) { V.spiesCaught++; const s = S.player.bag.find(x => x.id === 'silver'); if (s) s.n += 50; else S.player.bag.push({ id: 'silver', n: 50 }); note(S, 2, 'пойман шпион', events); if (S.world) { S.world.sides.villain.men = Math.max(0, S.world.sides.villain.men - 1); S.world.sides.guard.alarm = Math.min(3, S.world.sides.guard.alarm + 1); } said = 'Шпион Злого. Награда 50 сер.'; }
      else { V.wrong++; note(S, -1, 'задержан невиновный', events); S.relations = S.relations || {}; S.relations.town = (S.relations.town || 0) - 5; said = 'Это был честный человек.'; }
    }
    events.push({ kind: 'visitor', how, spy: v.spy, who: q });
    return said;
  }

  function trophyStep(S, events) {
    const G = state(S), Pl = S.player;
    if (!Pl || !guardSide(S)) return;
    const fight = S.people.some(q => q.fight && q.fight.hostile && (q.fight.hostile === Pl || q.team === 'guard') && flat(q.mv.pos, Pl.mv.pos) < 40);
    if (fight) { G.fighting = S.time; return; }
    if (G.fighting && S.time - G.fighting > 8 && !G.trophies) {
      const T = G.trophies = { day: S.day || 1, rule: ((S.day || 1) * 7 + Math.floor(S.time)) % 5 < 3 ? 'hand' : 'keep', taken: G.loot || [], handed: false };
      G.loot = [];
      G.fighting = 0;
      events.push({ kind: 'trophies', rule: T.rule });
    }
  }

  function lootNote(S, id, n) {
    const G = state(S);
    if (!guardSide(S)) return;
    if (!G.loot) G.loot = [];
    G.loot.push([id, n]);
  }

  function handIn(S, Pl) {
    const G = state(S), T = G.trophies;
    if (!T || T.rule !== 'hand' || T.handed) return null;
    let n = 0;
    for (const [id, k] of T.taken) { const s = Pl.bag.find(x => x.id === id); if (!s) continue; const m = Math.min(k, s.n); s.n -= m; n += m; if (!s.n) Pl.bag.splice(Pl.bag.indexOf(s), 1); }
    T.handed = true;
    note(S, 1, 'трофеи сданы по описи');
    return n;
  }

  function evening(S, rnd, events) {
    const G = state(S), day = S.day || 1, h = hourOf(S);
    if (!guardSide(S) || G.evening === day || h < 21) return;
    G.evening = day;
    const T = G.trophies;
    if (T && T.rule === 'hand' && !T.handed && T.taken.length) { if (rnd() < 0.5) note(S, -2, 'трофеи не сданы, узнали', events); }
    G.trophies = null;
    const today = G.book.filter(b => b.day === day && b.d < 0).reduce((a, b) => a + b.d, 0);
    if (today <= -3) { G.jail = { until: day + 1 }; events.push({ kind: 'jail' }); }
    else if (today <= -2) { G.duty = true; events.push({ kind: 'penalty', text: 'Наряд на завтра: чистить конюшню' }); }
    if (!G.gramota && service(S) >= 6) { G.gramota = true; S.player.bag.push({ id: 'gramota', n: 1 }); events.push({ kind: 'gramota' }); }
  }

  function siegeStep(S, dt, W, rnd, events) {
    const G = state(S), E = S.world, Wo = K.World;
    if (!E) return;
    const g = E.groups.find(x => x.kind === 'assault' && x.live && !x.back && x.state !== 'done');
    if (!g) { if (G.siege && !E.groups.some(x => x.kind === 'assault' && x.state !== 'done')) { G.siege = null; G.hourSet = -1; } return; }
    const atGate = Math.hypot(g.at[0] - PP.gate[0], g.at[2] - PP.gate[1]) < 70;
    if (!atGate) return;
    if (!G.siege) {
      G.siege = { t: 0, inside: 0, lurkers: 0, start: g.n, ram: Wo.state(S).sides.villain.ram && !g.light ? { at: [PP.gate[0] - 6, PP.gate[1]], t: 0 } : null };
      G.gate = { hp: G.gate.broken ? 0 : 100, broken: G.gate.broken };
      G.ladders = (Wo.state(S).sides.villain.ladders ? PP.wall.slice(0, 2).concat([[1151.5, 648], [1151.5, 740]]) : []).slice(0, Math.max(0, Math.min(g.light ? 2 : 4, Wo.state(S).sides.villain.ladders))).map((w, i) => ({ id: 'ld' + i, at: [w[0] - 3.7, w[1]], top: [w[0] + 0.6, w[1]], up: true, t: 0, back: 0 }));
      G.hourSet = -1;
      if (Wo.state(S).sides.villain.intel >= 2) for (const at of [PP.postern, PP.sluice]) { const q = K.Body.member(S.nextId++, 'villain', at[0] + (at === PP.postern ? 0 : 3), at[1] + (at === PP.postern ? 3 : 0), 0, W); q.role = 'lurker'; q.act = { kind: 'stand', post: PP.lever.slice(), face: 0 }; q.anim = K.Anim.state(); q.frames = new Float32Array(132); S.people.push(q); G.siege.lurkers++; }
      events.push({ kind: 'siege', ladders: G.ladders.length, ram: !!G.siege.ram, lurkers: G.siege.lurkers });
    }
    const Z = G.siege, crew = S.people.filter(q => (q.march && q.march.id === g.id || q.stormed === g.id) && q.fight && !q.fight.down);
    Z.t += dt;
    for (const L of G.ladders) {
      if (!L.up) { L.back += dt; if (L.back > LADDER_BACK && crew.length > 4) { L.up = true; L.back = 0; events.push({ kind: 'ladder', up: true, at: L.at }); } continue; }
      L.t += dt;
      if (L.t > LADDER_CLIMB) {
        L.t = 0;
        const q = crew.filter(x => !x.climbed).sort((a, b) => Math.hypot(a.mv.pos[0] - L.at[0], a.mv.pos[2] - L.at[1]) - Math.hypot(b.mv.pos[0] - L.at[0], b.mv.pos[2] - L.at[1]))[0];
        if (q && Math.hypot(q.mv.pos[0] - L.at[0], q.mv.pos[2] - L.at[1]) < 25) { q.climbed = true; q.stormed = g.id; q.mv = K.Move.body(W, L.top[0] + 2.5, L.top[1], Math.PI / 2); q.march = null; q.fight.hostile = S.player && S.player.team === 'guard' ? S.player : null; events.push({ kind: 'climbed', at: L.top }); }
      }
    }
    if (Z.ram && !G.gate.broken) {
      Z.ram.t += dt;
      const team = crew.filter(q => q.ramCrew);
      if (team.length < 4) for (const q of crew.filter(x => !x.ramCrew && !x.climbed).sort((a, b) => Math.hypot(a.mv.pos[0] - Z.ram.at[0], a.mv.pos[2] - Z.ram.at[1]) - Math.hypot(b.mv.pos[0] - Z.ram.at[0], b.mv.pos[2] - Z.ram.at[1])).slice(0, 4 - team.length)) { q.ramCrew = true; q.march = null; q.stormed = g.id; q.fight.hostile = null; q.act = { kind: 'stand', post: [Z.ram.at[0] - 1.5, Z.ram.at[1] + (q.id % 4 - 1.5) * 1.1], face: Math.PI / 2 }; }
      const pushers = crew.filter(q => Math.hypot(q.mv.pos[0] - Z.ram.at[0], q.mv.pos[2] - Z.ram.at[1]) < 9).length + (S.player && S.player.team === 'villain' && S.player.fight && !S.player.fight.down && Math.hypot(S.player.mv.pos[0] - Z.ram.at[0], S.player.mv.pos[2] - Z.ram.at[1]) < 6 ? 2 : 0);
      if (Z.ram.t > RAM_EVERY && pushers >= 3) {
        Z.ram.t = 0;
        const held = S.people.filter(q => q.team === 'guard' && q.fight && !q.fight.down && Math.hypot(q.mv.pos[0] - PP.lever[0], q.mv.pos[2] - PP.lever[1]) < 12).length;
        G.gate.hp = Math.max(0, G.gate.hp - RAM_HIT / (1 + held * 0.15));
        events.push({ kind: 'ram', hp: G.gate.hp, at: [PP.gate[0] - 3, 0, PP.gate[1]] });
      }
    }
    for (const q of S.people) if (q.role === 'lurker' && q.fight && !q.fight.down && Math.hypot(q.mv.pos[0] - PP.lever[0], q.mv.pos[2] - PP.lever[1]) < 2) { q.lever = (q.lever || 0) + dt; if (q.lever > 10 && !G.gate.broken) { G.gate.hp = 0; events.push({ kind: 'lever' }); } }
    if (G.gate.hp <= 0 && !G.gate.broken) { G.gate.broken = true; events.push({ kind: 'gateBroken' }); for (const q of crew) q.fight.hostile = null; }
    const inside = crew.filter(q => q.mv.pos[0] > 1153 && q.mv.pos[0] < 1388 && q.mv.pos[2] > 562 && q.mv.pos[2] < 758).length;
    Z.inside = inside;
    if (G.gate.broken) for (const q of crew) if (!q.fight.hostile && q.march) { q.march = null; q.stormed = g.id; q.act = { kind: 'stand', post: PP.throne.slice(), face: 0 }; }
    const attackers = S.people.filter(q => q.team === 'villain' && q.fight && !q.fight.down && !q.state && Math.hypot(q.mv.pos[0] - PP.gate[0], q.mv.pos[2] - PP.gate[1]) < 260).length + (g.n - crew.length > 0 ? 0 : 0);
    Z.held = inside >= 10 ? (Z.held || 0) + dt : 0;
    const A = E.assault;
    const defenders = S.people.filter(q => q.team === 'guard' && q.fight && !q.fight.down && !q.state && q.mv.pos[0] > 1150 && q.mv.pos[0] < 1390 && q.mv.pos[2] > 560 && q.mv.pos[2] < 760).length + (S.player && S.player.team === 'guard' && !S.player.fight.down ? 1 : 0);
    Z.defenders = defenders;
    const fallen = defenders <= 3 && inside >= 5, beaten = attackers <= Math.max(3, Z.start / 4) && attackers < defenders;
    if (A && !A.result && (Z.held > 60 || fallen || beaten || Z.t > 900)) {
      A.result = Z.held > 60 || fallen ? 'taken' : 'repelled';
      A.ended = S.day || 1;
      K.World.report(S, 'all', A.result === 'taken' ? 'Дворец пал: знамя Злого на Белой башне' : 'Штурм дворца отбит', PP.gate, 3);
      events.push({ kind: 'assault', result: A.result });
      for (const q of S.people) if (q.team === 'villain' && (q.march && q.march.id === g.id || q.stormed === g.id)) { q.march = null; q.stormed = null; }
      g.n = 0;
      g.state = 'done';
    }
  }

  function brace(S) {
    const G = state(S);
    if (G.gate.broken || !G.siege) return false;
    G.gate.hp = Math.min(100, G.gate.hp + BRACE);
    G.braceAt = S.time;
    return true;
  }

  function pushLadder(S, Pl, events) {
    const G = state(S);
    for (const L of G.ladders) {
      if (!L.up || Math.hypot(Pl.mv.pos[0] - L.top[0], Pl.mv.pos[2] - L.top[1]) > 3) continue;
      L.up = false;
      L.back = 0;
      L.t = 0;
      for (const q of S.people) if (q.team === 'villain' && q.fight && !q.fight.down && Math.hypot(q.mv.pos[0] - L.at[0], q.mv.pos[2] - L.at[1]) < 3) { q.fight.life -= 30; q.mv.hold = 3; }
      if (events) events.push({ kind: 'ladder', up: false, at: L.at });
      return L;
    }
    return null;
  }

  function aditKnown(S) { return !!(S.campaign && S.campaign.adit); }

  function useAdit(S, W, Pl) {
    if (!aditKnown(S)) return false;
    const A = PP.adit, near = (a, r) => Math.hypot(Pl.mv.pos[0] - a[0], Pl.mv.pos[2] - a[1]) < r;
    if (near(A.mouth, 4)) { Pl.mv = K.Move.body(W, A.exit[0], A.exit[1], Math.PI); return 'fort'; }
    if (near(A.exit, 3)) { Pl.mv = K.Move.body(W, A.mouth[0] + 2, A.mouth[1] + 4, Math.PI); return 'mine'; }
    return false;
  }

  function plan(S, rnd) {
    const C = S.campaign, day = S.day || 1, E = S.world;
    if (!E || C.ending) return;
    C.part = day < 10 ? 1 : day < 26 ? 2 : 3;
    C.finales = C.finales || {};
    const V = E.sides.villain;
    if (!C.finales.walls && E.assault) C.finales.walls = { day, done: false };
    if (C.finales.walls && !C.finales.walls.done && E.assault && E.assault.result) { C.finales.walls.done = true; C.finales.walls.result = E.assault.result; return finish(S, E.assault.result === 'taken' ? 'fell' : 'stood'); }
    if (!C.finales.fort && !E.assault && C.adit && day >= 26 && V.readiness < 50 && E.sides.guard.men >= 40) {
      const g = K.World.launch(S, 'guard', 'raid', K.World.POSTS.palace.gate, K.World.POSTS.fort.at, Math.min(30, E.sides.guard.men - 20), { target: 'fort' });
      if (g) { g.final = 'fort'; g.adit = true; C.finales.fort = { day, group: g.id, done: false }; K.World.report(S, 'all', '«Форт»: Строгов ведёт отряд в Старый форт через штрек', K.World.POSTS.palace.gate, 3); }
    }
    if (C.finales.fort && !C.finales.fort.done && !E.groups.some(g => g.id === C.finales.fort.group)) { C.finales.fort.done = true; return finish(S, E.posts.fort.side === 'guard' ? 'fort' : 'stood'); }
    if (day >= 50) finish(S, 'stood');
  }

  function finish(S, id, events) {
    const C = S.campaign;
    if (C.ending) return C.ending;
    const G = state(S), names = G.people.filter(r => r.ten && r.alive).map(r => r.name), carried = (C.rescues || []).map(r => r.who).filter(n => n !== 'вас');
    const end = Object.assign({ id, day: S.day || 1, names, carried, rescues: (C.rescues || []).slice(), fallen: G.people.filter(r => !r.alive).map(r => r.name) }, ENDINGS[id]);
    if (K.World && K.World.villainName(S)) end.text = end.text.replace('Злого', K.World.evilOf(S)).replace('Злой', K.World.evil(S));
    if (id === 'fell') { const debt = S.people.filter(q => q.guardman !== undefined).reduce((a, q) => a + (q.debt || 0), 0) + G.people.reduce((a, r) => a + (r.debt || 0), 0); end.carriedOut = debt >= 4; end.text += end.carriedOut ? ' Свои вынесли вас из дворца.' : ''; }
    C.ending = end;
    C.after = true;
    G.endingNew = true;
    if (events) events.push({ kind: 'ending', ending: end });
    if (K.World && S.world) K.World.report(S, 'guard', 'Летопись службы: ' + end.name, PP.commander, 3);
    return end;
  }

  function intro(S) { return S.campaign && S.campaign.intro; }
  const introStep = S => intro(S) ? intro(S).step : 'free';

  function introGoal(S) {
    const I = intro(S);
    if (!I || !guardSide(S)) return null;
    if (I.step === 'muster') return 'Построение: встать в строй во дворе (пятое место слева)';
    if (I.step === 'gate') return `Пост у ворот: проверить пропуска (${I.checked || 0} из 3). Шпиона задержать (E на посетителе)`;
    if (I.step === 'drill') return I.cut ? `Учебный бой с сержантом: отбить удар (${I.blocks || 0} из 3, ПКМ)` : 'Учебный бой: отрубить руку чучелу';
    if (I.step === 'escort') return 'Сопровождение: идти со Строговым к Мостовице и с корованом назад';
    if (I.step === 'ambush') return 'Засада! Держать строй. Гаврила ранен: перевязать (служба −1) или стоять';
    if (I.step === 'report') return 'Доложить Строгову во дворе';
    return null;
  }

  function startIntro(S) {
    S.campaign = S.campaign || { side: 'guard' };
    S.campaign.intro = { step: 'muster', checked: 0, blocks: 0, cut: false };
    state(S).order = { kind: 'gate', name: ORDERS.gate.name, text: ORDERS.gate.text, day: 1, until: 12, state: 'intro', at: PP.gate.slice(), away: 0, seen: 0 };
  }

  const advance = (S, step, events) => { intro(S).step = step; intro(S).t = 0; events.push({ kind: 'intro', step, goal: introGoal(S) }); };
  const byName = (S, n) => S.people.find(q => q.guardman !== undefined && q.name === n) || null;

  function introRun(S, W, rnd, events) {
    const I = intro(S), Pl = S.player, G = state(S);
    if (!I || I.step === 'free' || !Pl || !guardSide(S)) return;
    const mine = e => e.who === Pl;
    if (I.step === 'muster') {
      const slot = PP.line[PP.hero];
      if (Math.hypot(Pl.mv.pos[0] - slot[0], Pl.mv.pos[2] - slot[1]) < 2.5) { events.push({ kind: 'muster', names: G.people.filter(r => r.ten).map(r => r.name), late: false, pay: 0, order: G.order, rank: 'Рядовой', speech: 'Строй выносит своих. Одиночку не выносит никто.' }); G.order.state = 'given'; G.muster = { day: S.day || 1, called: true }; advance(S, 'gate', events); }
      return;
    }
    if (I.step === 'gate') {
      if (!I.mitrofan && Math.hypot(Pl.mv.pos[0] - PP.gate[0], Pl.mv.pos[2] - PP.gate[1]) < 8) { I.mitrofan = true; events.push({ kind: 'say', who: 'Митрофан', text: 'Ногу мне под лесом оставили. Казённая грамота платит половину протеза у Шарнира, если служба ладная. Запомни.' }); }
      for (const e of events) if (e.kind === 'visitor') I.checked = (I.checked || 0) + 1;
      if ((I.checked || 0) >= 3 || G.visitors.next >= 3 && !S.people.some(q => q.visitor && q.visitor.state === 'queue')) { G.order.state = 'done'; note(S, G.visitors.spiesCaught ? 2 : 1, 'пост у ворот', events); advance(S, 'drill', events); }
      return;
    }
    if (I.step === 'drill') {
      const D = PP.drill;
      if (!S.people.some(q => q.drillStraw)) { const d = K.Body.strawman(S.nextId++, D.dummy[0], D.dummy[1], Math.PI, W); d.drillStraw = true; S.people.push(d); }
      for (const e of events) {
        if (!I.cut && e.kind === 'cut' && mine(e) && e.to && e.to.drillStraw) { I.cut = true; events.push({ kind: 'intro', step: 'drill', goal: introGoal(S) }); }
        if (I.cut && (e.kind === 'block' || e.kind === 'parry') && e.to === Pl && e.who && e.who.trainer) I.blocks = (I.blocks || 0) + 1;
      }
      let sg = S.people.find(q => q.trainer);
      if (I.cut && !sg) {
        sg = K.Body.member(S.nextId++, 'guard', D.sergeant[0], D.sergeant[1], Math.PI, W, { kind: 'stand', post: D.sergeant.slice(), face: Math.PI });
        sg.name = 'сержант Евсей';
        sg.trainer = true;
        sg.fight = K.Combat.fighter({ weapon: 'sword', shield: false, exp: 'recruit' });
        sg.anim = K.Anim.state();
        sg.frames = new Float32Array(132);
        S.people.push(sg);
        Pl.fight.rules = Object.assign({}, Pl.fight.rules || {}, { harm: 0.08, heavy: 600, ko: 30 });
        I.training = true;
      }
      if (sg && I.cut) { if (Math.hypot(sg.mv.pos[0] - Pl.mv.pos[0], sg.mv.pos[2] - Pl.mv.pos[2]) < 6) sg.fight.hostile = Pl; }
      if ((I.blocks || 0) >= 3) {
        if (sg) { sg.fight.hostile = null; S.people.splice(S.people.indexOf(sg), 1); }
        I.training = false;
        advance(S, 'escort', events);
        for (const n of ['Гаврила', 'Сенька', 'Фома', 'Гордей Строгов']) { const q = byName(S, n); if (q) { q.squad = 'player'; q.escortIntro = true; } }
        S.squad = { order: 'follow', fire: false, at: null, face: 0 };
      }
      return;
    }
    if (I.step === 'escort') {
      if (!I.caravan && Math.hypot(Pl.mv.pos[0] - 905, Pl.mv.pos[2] - 1255) < 60) {
        const c = K.Caravan.make(S, 'treasury', S.day || 1, 40, rnd);
        c.intro = true;
        I.caravan = c.id;
      }
      const c = I.caravan && K.Caravan.byId(S, I.caravan);
      if (c && c.s > 360 && !I.ambushed) {
        I.ambushed = true;
        const q = K.Terrain.pointAt(K.Caravan.routes().treasury.line, c.s + 30);
        I.archers = [];
        for (let k = 0; k < 4; k++) { const e = K.Body.member(S.nextId++, 'elf', q.x - q.tz * (26 + k * 2), q.z + q.tx * (26 + k * 2), 0, W); e.fight = K.Combat.fighter({ weapon: 'knife', exp: 'recruit' }); e.sack = [{ id: 'bow', n: 1 }, { id: 'arrow', n: 10 }]; e.role = 'raider'; e.anim = K.Anim.state(); e.frames = new Float32Array(132); e.fight.hostile = Pl; S.people.push(e); I.archers.push(e.id); }
        const ga = byName(S, 'Гаврила');
        if (ga) { ga.kit.cut = Object.assign({}, ga.kit.cut, { rFore: 'fresh' }); ga.fight.bleed = K.Wounds.bleed(); ga.fight.bleed.heavy = 120; ga.noAid = true; ga.squad = null; ga.act = { kind: 'stand', post: [ga.mv.pos[0], ga.mv.pos[2]], face: 0 }; K.Wounds.knockOut(ga.fight); ga.fight.ko = 120; }
        I.ambushAt = S.time;
        events.push({ kind: 'command', text: 'Засада! Держать строй!' });
        advance(S, 'ambush', events);
      }
      return;
    }
    if (I.step === 'ambush') {
      for (const e of events) if (e.kind === 'bound' && e.who === Pl && e.to && (e.to.name === 'Гаврила' || (e.to.who && e.to.who.name === 'Гаврила'))) { if (!I.helped) { I.helped = true; note(S, -1, 'вышел из строя к раненому', events); const r = G.people.find(x => x.name === 'Гаврила'); if (r) r.debt = Math.min(5, (r.debt || 0) + 2); if (e.to.debt !== undefined) e.to.debt = Math.min(5, (e.to.debt || 0) + 1); } }
      const left = (I.archers || []).map(id => S.people.find(q => q.id === id)).filter(q => q && q.fight && !q.fight.down && !q.state);
      const c = K.Caravan.byId(S, I.caravan);
      if (!left.length && S.time - (I.ambushAt || 0) > 40 || (c && (c.state === 'arrived' || c.done))) {
        S.campaign.gavrila = I.helped ? 'bandaged' : S.bodies.some(b => b.who && b.who.name === 'Гаврила' && b.cause === 'ko') || byName(S, 'Гаврила') ? 'medic' : 'lost';
        advance(S, 'report', events);
      }
      return;
    }
    if (I.step === 'report') {
      const c = byName(S, 'Гордей Строгов');
      if ((!c || c.fight.down) && Math.hypot(Pl.mv.pos[0] - PP.commander[0], Pl.mv.pos[2] - PP.commander[1]) < 12) { events.push({ kind: 'say', who: 'Митрофан', text: 'Строгова понесли к Савве. Докладывай мне, передам слово в слово.' }); talked(S, 'commander', events); }
    }
  }

  function talked(S, role, events) {
    const I = intro(S);
    if (role === 'commander' && I && I.step === 'report') {
      advance(S, 'free', events);
      S.campaign.intro = null;
      const s = S.player.bag.find(x => x.id === 'silver');
      if (s) s.n += 12; else S.player.bag.push({ id: 'silver', n: 12 });
      for (const q of S.people) if (q.escortIntro) { q.squad = null; q.escortIntro = false; }
      S.squad = null;
      state(S).hourSet = -1;
      return '«Доложено. Жалованье 12 сер. Вечер твой: хоть в «Колесо». Завтра построение в семь.»';
    }
    if (role === 'commander') { const o = state(S).order; return o ? `«Приказ на сегодня: ${o.name.toLowerCase()}, ${o.text}.»` : '«Служи.»'; }
    if (role === 'veteran') return S.campaign && S.campaign.prohor === 'left' ? '«Так же меня когда-то оставили под лесом. Строй выносит своих… если строй успевает.»' : '«Казённая грамота платит половину у Шарнира. Служи ладно, Савва даст.»';
    if (role === 'emperor') return '«Стены держат не камни, а те, кто на них стоит.»';
    return null;
  }

  function react(S, events) {
    const Pl = S.player, C = S.campaign;
    if (!Pl || !guardSide(S)) return;
    for (const e of events) {
      if (e.kind === 'jailed' && e.who && e.who.captor === 'player' && e.who.team === 'villain' && (S.day || 1) >= 10 && !C.adit) { C.adit = true; events.push({ kind: 'say', who: 'Пленный каторжник', text: 'Из рудника в подвал форта идёт старый штрек. Мы им воду носили. Пусти, расскажу больше.' }); }
      if (e.kind === 'jailed' && e.who && e.who.captor === 'player') note(S, 1, 'пленный сдан на гауптвахту');
      if (e.kind === 'rescued') (C.rescues || (C.rescues = [])).push({ by: e.by && e.by.name || 'свой', who: 'вас', day: S.day || 1 });
      if (e.kind === 'healed' && e.by === 'player' && e.who && e.who.team === 'guard') { (C.rescues || (C.rescues = [])).push({ by: 'вы', who: e.who.name || 'стражник', day: S.day || 1 }); if (e.who.name === 'Прохор') C.prohor = 'carried'; }
      if (e.kind === 'prohor') C.prohorAt = S.time;
    }
    if (C.prohor === 'wounded' && C.prohorAt && S.time - C.prohorAt > 120) { const q = S.people.find(x => x.name === 'Прохор'); C.prohor = q && Pl.carry && Pl.carry.who && Pl.carry.who.name === 'Прохор' ? 'carried' : 'left'; }
  }

  function jailStep(S, W, events) {
    const G = state(S), Pl = S.player;
    if (!G.jail || !Pl) return;
    const h = hourOf(S);
    if (h >= 22 || h < 6 || G.jail.inCell) {
      if (!G.jail.inCell) { const bed = town(S).beds.find(b => b.id === 'cell'); if (bed) Pl.mv = K.Move.body(W, bed.at[0], bed.at[1], 0); G.jail.inCell = true; events.push({ kind: 'cell' }); }
      if (h >= 6 && h < 12 && G.jail.inCell) { G.jail = null; events.push({ kind: 'released' }); }
    }
  }

  function daily(S, rnd) {
    const G = state(S), day = S.day || 1;
    if (G.daily === day) return;
    G.daily = day;
    for (const r of G.people) if (r.alive && r.wound && r.wound.life !== undefined) r.wound.life = Math.min(100, r.wound.life + 40);
    if (guardSide(S)) plan(S, rnd);
  }

  function sync(S) {
    if (!K.World || !S.world) return;
    const G = state(S), men = S.world.sides.guard.men;
    let alive = G.people.filter(r => r.alive);
    while (alive.length > Math.max(KEY.length + TEN.length, men - 40)) {
      const r = alive.filter(x => x.role === 'guard' && !x.spawned).pop();
      if (!r) break;
      r.alive = false;
      alive = G.people.filter(x => x.alive);
    }
  }

  function gateSync(S, W) {
    const G = state(S), want = !!G.siege && !G.gate.broken, i = W.dyn.findIndex(b => b.id === 'palace-gate-door');
    if (want && i < 0) { const y = W.terrain.heightAt(1151.5, 700); W.dyn.push(K.Move.resolveBox({ x: 1151.5, z: 700, w: 3, d: 6.2, y0: y - 0.6, y1: y + 6, kind: 'gate', id: 'palace-gate-door' }, W.terrain)); }
    else if (!want && i >= 0) W.dyn.splice(i, 1);
  }

  function run(S, dt, W, rnd) {
    const events = [];
    if (!S.T) S.T = W.terrain;
    state(S);
    census(S, W);
    routine(S);
    corpses(S, events);
    if (guardSide(S) && !S.campaign.ending) {
      musterStep(S, W, rnd, events);
      orderStep(S, dt, W, rnd, events);
      gateStep(S, dt, W, rnd);
      trophyStep(S, events);
      evening(S, rnd, events);
      jailStep(S, W, events);
    }
    siegeStep(S, dt, W, rnd, events);
    gateSync(S, W);
    if (hourOf(S) >= 6 && state(S).daily !== (S.day || 1)) daily(S, rnd);
    state(S).tick = (state(S).tick || 0) + dt;
    if (state(S).tick > 1) { state(S).tick = 0; sync(S); }
    return events;
  }

  function post(S, events, W, rnd) {
    react(S, events);
    introRun(S, W, rnd, events);
  }

  K.Guard = { RANKS, TEN, KEY, ORDERS, SEALS, PURPOSES, ENDINGS, INTRO, NEAR, FAR, state, roster, rankOf, service, note, spotFor, census, routine, makeOrder, pickOrder, visitorsFor, decide, lootNote, handIn, brace, pushLadder, aditKnown, useAdit, plan, finish, startIntro, introStep, introGoal, talked, react, daily, sync, run, post, gateSync, playerSlot, joinGroup };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
