(function (K) {
  'use strict';

  const VERSION = 13;
  const MIGRATIONS = {
    1: o => {
      const eyes = a => { const k = a.slice(); k.splice(14, 0, {}); return k; };
      o.player.kit = eyes(o.player.kit);
      const hero = o.player.kit[15], gear = K.Body.HERO_GEAR[hero] || K.Body.HERO_GEAR['elf.m'];
      o.player.fight = { life: 100, weapon: gear[0], shield: gear[1] };
      for (const q of o.people) {
        q.kit = eyes(q.kit);
        const f = K.Body.arm(q.kit[0], q.id);
        q.fight = { life: 100, weapon: f.weapon, shield: f.shield, exp: f.exp };
      }
      for (const b of o.bodies) b.kit = eyes(b.kit);
      o.parts = [];
      o.items = [];
      o.blood = [];
      o.v = 2;
      return o;
    },
    2: o => {
      o.chairs = [];
      o.v = 3;
      return o;
    },
    3: o => {
      o.missiles = [];
      o.stuck = [];
      o.v = 4;
      return o;
    },
    4: o => {
      o.squad = null;
      o.standing = { service: 0, respect: 0, loyalty: 0 };
      o.v = 5;
      return o;
    },
    5: o => {
      o.beasts = [];
      o.carcasses = [];
      o.fauna = null;
      o.relations = {};
      o.v = 6;
      return o;
    },
    6: o => {
      o.econ = null;
      o.law = null;
      o.v = 7;
      return o;
    },
    7: o => {
      o.caravans = null;
      o.v = 8;
      return o;
    },
    8: o => {
      o.world = null;
      o.v = 9;
      return o;
    },
    9: o => {
      o.visited = [];
      o.heard = [];
      o.v = 10;
      return o;
    },
    10: o => {
      o.village = null;
      o.campaign = null;
      o.v = 11;
      return o;
    },
    11: o => {
      o.guard = null;
      o.v = 12;
      return o;
    },
    12: o => {
      o.army = null;
      o.v = 13;
      return o;
    }
  };
  const BEAST_COLORS = ['skin', 'hairColor', 'main', 'accent', 'metal'];
  const packBeastKit = k => ({ c: BEAST_COLORS.map(f => hex(k[f])), cut: Object.assign({}, k.cut || {}) });
  const unpackBeastKit = (kind, sex, o) => { const k = { beast: kind, fig: sex, face: 0, cut: Object.assign({}, o.cut || {}), eyes: {} }; BEAST_COLORS.forEach((f, i) => { k[f] = rgb(o.c[i]); }); return k; };
  const packBeast = b => {
    const o = { id: b.id, kind: b.beast, sex: b.sex, pos: b.mv.pos.map(mm), yaw: mm(b.mv.yaw), life: cm(b.fight.life), max: cm(b.fight.max), kit: packBeastKit(b.kit), home: b.home.map(mm) };
    for (const k of ['group', 'owner', 'leader', 'alt', 'groupR', 'angered', 'hitch']) if (b[k] !== undefined && b[k] !== null && b[k] !== false) o[k] = b[k];
    if (b.fight.bleed > 0) o.bleed = mm(b.fight.bleed);
    if (b.brain && b.brain.over) o.over = b.brain.over.slice();
    return o;
  };
  const unpackBeast = (o, W) => {
    const b = K.Beasts.make(o.id, o.kind, o.pos[0], o.pos[2], o.yaw, W, { sex: o.sex, group: o.group || null, owner: o.owner || null, home: o.home, leader: !!o.leader, alt: o.alt });
    b.mv.pos = o.pos.slice();
    b.kit = unpackBeastKit(o.kind, o.sex, o.kit);
    b.fight.life = o.life;
    b.fight.max = o.max;
    b.fight.bleed = o.bleed || 0;
    if (o.groupR) b.groupR = o.groupR;
    if (o.alt) b.alt = o.alt;
    if (o.angered) b.angered = true;
    if (o.hitch) b.hitch = Object.assign({}, o.hitch);
    if (o.over) b.brain.over = o.over.slice();
    return b;
  };
  const packCarcass = c => {
    const o = { id: c.id, kind: c.beast, kit: packBeastKit(c.kit), sex: c.kit.fig, at: c.at.map(mm), born: Math.round(c.born) };
    if (c.piece) { o.piece = true; o.parts = c.parts.slice(); o.frames = c.parts.map(p => Array.from(c.frames.slice(p * 12, p * 12 + 12), mm)); }
    else { o.yaw = mm(c.yaw || 0); o.y = mm(c.frames[2 * 12 + 10]); }
    for (const k of ['skinned', 'group', 'owner']) if (c[k]) o[k] = c[k];
    return o;
  };
  const unpackCarcass = (o, W) => {
    const c = { id: o.id, beast: o.kind, kit: unpackBeastKit(o.kind, o.sex, o.kit), at: o.at.slice(), born: o.born, frames: new Float32Array(K.Beasts.NP * 12) };
    if (o.piece) { c.piece = true; c.parts = o.parts.slice(); o.parts.forEach((p, i) => c.frames.set(o.frames[i], p * 12)); }
    else { c.yaw = o.yaw; K.Beasts.lay(c, W); }
    for (const k of ['skinned', 'group', 'owner']) if (o[k]) c[k] = o[k];
    return c;
  };
  const PERSON = ['team', 'name', 'debt', 'squad', 'state', 'leader', 'captor', 'witness', 'carry', 'escort', 'healed', 'role', 'shop', 'home', 'merc', 'convoy', 'tell', 'march', 'villager', 'bucket', 'torchHouse', 'torchDone', 'introStraw', 'intro', 'wounded', 'noAid', 'guardman', 'visitor', 'trainer', 'drillStraw', 'escortIntro', 'climbed', 'lever', 'hero', 'soldier', 'saboteur', 'sortie', 'fleeing', 'stormed'];
  const GUARD_SKIP = new Set(['live', 'hourSet', 'tick', 'endingNew', 'fighting']);
  const packGuard = G => { const o = {}; for (const [k, v] of Object.entries(G)) if (!GUARD_SKIP.has(k)) o[k] = JSON.parse(JSON.stringify(v === undefined ? null : v)); o.people = o.people.map(r => { const c = Object.assign({}, r); delete c.spawned; return c; }); return o; };
  const unpackGuard = (o, people) => { const G = JSON.parse(JSON.stringify(o)); G.hourSet = -1; for (const r of G.people) r.spawned = people.some(q => q.guardman === r.i); G.live = G.people.some(r => r.spawned); return G; };
  const ARMY_SKIP = new Set(['live', 'hourSet', 'tick', 'endingNew']);
  const packArmy = A => { const o = {}; for (const [k, v] of Object.entries(A)) if (!ARMY_SKIP.has(k)) o[k] = JSON.parse(JSON.stringify(v === undefined ? null : v)); o.people = o.people.map(r => { const c = Object.assign({}, r); delete c.spawned; return c; }); return o; };
  const unpackArmy = (o, people) => { const A = JSON.parse(JSON.stringify(o)); A.hourSet = -1; for (const r of A.people) r.spawned = people.some(q => q.soldier === r.i); A.live = A.people.some(r => r.spawned); return A; };
  const VILLAGE_SKIP = new Set(['live', 'hourSet', 'tick', 'alarm', 'horn', 'endingNew']);
  const packVillage = V => { const o = {}; for (const [k, v] of Object.entries(V)) if (!VILLAGE_SKIP.has(k)) o[k] = JSON.parse(JSON.stringify(v)); o.people = o.people.map(r => { const c = Object.assign({}, r); delete c.spawned; return c; }); return o; };
  const unpackVillage = (o, people) => { const V = JSON.parse(JSON.stringify(o)); V.live = false; V.hourSet = -1; for (const r of V.people) r.spawned = people.some(q => q.villager === r.i); V.live = V.people.some(r => r.spawned); return V; };
  const WHO = ['team', 'name', 'debt', 'squad', 'exp', 'hand', 'nearHero', 'helped'];
  const pick = (src, keys) => { const o = {}; for (const k of keys) if (src[k] !== undefined && src[k] !== null && src[k] !== false) o[k] = src[k]; return o; };

  const round = (v, k) => Math.round(v * k) / k;
  const mm = v => round(v, 1000);
  const cm = v => round(v, 100);
  const hex = c => c.map(v => Math.round(K.clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');
  const rgb = s => [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
  const packLook = l => ({ face: l.face, hair: l.hair, hc: hex(l.hairColor) });
  const unpackLook = o => ({ face: o.face, hair: o.hair, hairColor: rgb(o.hc) });
  const KIT = ['side', 'fig', 'face', 'skin', 'hair', 'hairColor', 'beard', 'head', 'main', 'accent', 'metal', 'armor', 'pros', 'cut', 'eyes', 'hero'];
  const COLORS = new Set(['skin', 'hairColor', 'main', 'accent', 'metal']);

  const packKit = k => {
    const o = KIT.map(f => COLORS.has(f) ? hex(k[f]) : f === 'beard' ? (k.beard ? 1 : 0) : f === 'armor' ? k.armor.slice() : f === 'pros' || f === 'cut' || f === 'eyes' ? Object.assign({}, k[f]) : f === 'head' ? k.head || null : k[f]);
    if (!k.hero) o.pop();
    return o;
  };

  const unpackKit = a => {
    const k = {};
    KIT.forEach((f, i) => {
      const v = a[i];
      if (COLORS.has(f)) k[f] = rgb(v);
      else if (f === 'beard') k.beard = !!v;
      else if (f === 'armor') k.armor = v.slice();
      else if (f === 'pros' || f === 'cut' || f === 'eyes') k[f] = Object.assign({}, v);
      else if (f === 'hero') { if (v) k.hero = v; }
      else k[f] = v;
    });
    return k;
  };

  const toB64 = (ints, Kind) => {
    const bytes = new Uint8Array(new Kind(ints).buffer);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  };

  const fromB64 = (str, Kind) => {
    const s = atob(str), bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return new Kind(bytes.buffer);
  };

  const packMove = (mv, W) => ({
    pos: mv.pos.map(mm), vel: mv.vel.map(mm), yaw: mm(mv.yaw), onGround: !!mv.onGround, crouch: !!mv.crouch, walk: !!mv.walk,
    stamina: cm(mv.stamina), tired: !!mv.tired, ladder: mv.ladder ? W.ladders.indexOf(mv.ladder) : -1,
    chair: mv.chair || null, pushing: mv.pushing || null
  });

  const unpackMove = (o, W) => {
    const mv = K.Move.body(W, o.pos[0], o.pos[2], o.yaw);
    mv.pos = o.pos.slice();
    mv.vel = o.vel.slice();
    mv.onGround = o.onGround;
    mv.crouch = o.crouch;
    mv.walk = o.walk;
    mv.stamina = o.stamina;
    mv.chair = o.chair || null;
    mv.pushing = o.pushing || null;
    mv.tired = o.tired;
    mv.ladder = o.ladder >= 0 ? W.ladders[o.ladder] : null;
    mv.eye = o.crouch ? K.METRICS.eyeCrouch : K.METRICS.eyeStand;
    return mv;
  };

  const packAct = a => {
    const o = { kind: a.kind };
    if (a.post) o.post = a.post.map(mm);
    if (a.face !== undefined) o.face = mm(a.face);
    if (a.route) o.route = a.route.map(p => p.map(mm));
    return o;
  };

  const packPoints = (o, b, anchor) => {
    if (b.frozen) {
      const a = anchor * 3, at = [cm(b.pts[a]), cm(b.pts[a + 1]), cm(b.pts[a + 2])], d = [];
      for (let i = 0; i < b.pts.length; i++) d.push(i >= a && i < a + 3 ? 0 : Math.round((b.pts[i] - at[i % 3]) * 100));
      o.at = at;
      if (d.every(v => v >= -128 && v <= 127)) o.pts = toB64(d, Int8Array);
      else o.wide = toB64(d, Int16Array);
    } else {
      o.t = b.t;
      o.still = b.still;
      o.pts = Array.from(b.pts);
      o.prev = Array.from(b.prev);
    }
    return o;
  };

  const unpackPoints = (b, o) => {
    if (o.frozen) {
      const d = o.pts ? fromB64(o.pts, Int8Array) : fromB64(o.wide, Int16Array);
      b.pts = new Float64Array(d.length);
      for (let i = 0; i < d.length; i++) b.pts[i] = o.at[i % 3] + d[i] / 100;
      b.prev = null;
    } else {
      b.pts = Float64Array.from(o.pts);
      b.prev = Float64Array.from(o.prev);
    }
    return b;
  };

  const packBody = b => {
    const o = { id: b.id, kit: packKit(b.kit), sack: b.sack.map(s => ({ id: s.id, n: s.n })), born: Math.round(b.born), frozen: b.frozen };
    if (b.cause) o.cause = b.cause;
    if (b.ko > 0) o.ko = cm(b.ko);
    if (b.stable) o.stable = true;
    if (b.who) o.who = pick(b.who, WHO);
    if (b.carrier !== undefined && b.carrier !== null) o.carrier = b.carrier;
    if (b.looted) o.looted = true;
    return packPoints(o, b, 8);
  };

  const unpackBody = o => {
    const b = { id: o.id, kit: unpackKit(o.kit), sack: o.sack.map(s => ({ id: s.id, n: s.n })), born: o.born, frozen: o.frozen, t: o.t || 0, still: o.still || 0 };
    if (o.cause) b.cause = o.cause;
    if (o.ko) b.ko = o.ko;
    if (o.stable) b.stable = true;
    if (o.who) b.who = Object.assign({}, o.who);
    if (o.carrier !== undefined) b.carrier = o.carrier;
    if (o.looted) b.looted = true;
    unpackPoints(b, o);
    b.frames = K.Body.framesFrom(b.pts);
    return b;
  };

  const packPiece = p => {
    const o = { id: p.id, kit: packKit(p.kit), keep: p.keep.slice(), anchor: p.anchor, born: Math.round(p.born), frozen: p.frozen, blood: !!p.blood };
    if (p.item) o.item = p.item;
    if (p.owner !== undefined && p.owner !== null) o.owner = p.owner;
    if (p.straw) o.straw = p.straw;
    return packPoints(o, p, p.anchor);
  };

  const unpackPiece = o => {
    const p = { id: o.id, kit: unpackKit(o.kit), keep: o.keep.slice(), anchor: o.anchor, born: o.born, frozen: o.frozen, blood: o.blood, item: o.item || null, t: o.t || 0, still: o.still || 0 };
    if (o.straw) p.straw = o.straw;
    if (o.owner !== undefined) p.owner = o.owner;
    unpackPoints(p, o);
    p.frames = K.Body.framesFrom(p.pts);
    return p;
  };

  const packItem = it => {
    const o = { uid: it.uid, item: it.item, len: mm(it.len), pts: Array.from(it.pts, mm), edge: it.edge.map(mm), born: Math.round(it.born), frozen: it.frozen };
    if (it.pal) o.pal = packKit(it.pal);
    if (!it.frozen) { o.prev = Array.from(it.prev); o.pts = Array.from(it.pts); o.t = it.t; o.still = it.still; }
    return o;
  };

  const unpackItem = o => {
    const it = { uid: o.uid, item: o.item, len: o.len, pts: Float64Array.from(o.pts), edge: o.edge.slice(), born: o.born, frozen: o.frozen, prev: o.prev ? Float64Array.from(o.prev) : null, t: o.t || 0, still: o.still || 0, anchor: 0 };
    if (o.pal) it.pal = unpackKit(o.pal);
    return it;
  };

  const packBleed = b => b && (b.heavy >= 0 || b.medium > 0 || b.light > 0) ? { heavy: cm(b.heavy), medium: cm(b.medium), light: cm(b.light), n: b.lightN, at: Object.assign({}, b.at || {}) } : null;
  const unpackBleed = o => o ? { heavy: o.heavy, medium: o.medium, light: o.light, lightN: o.n, drip: 0, at: Object.assign({}, o.at || {}) } : { heavy: -1, medium: 0, light: 0, lightN: 0, drip: 0, at: {} };
  const packFight = f => {
    if (!f) return null;
    const o = { life: isFinite(f.life) ? cm(f.life) : -1, weapon: f.weapon || null, shield: !!f.shield, exp: f.exp };
    if (f.hand === 'l') o.hand = 'l';
    const b = packBleed(f.bleed);
    if (b) o.bleed = b;
    if (f.down === 'ko') { o.down = 'ko'; o.ko = cm(f.ko); }
    if (f.stable) o.stable = true;
    if (f.mode && f.mode !== 'melee') o.mode = f.mode;
    if (f.loaded === false) o.loaded = false;
    if (f.shieldLoad) o.shieldLoad = f.shieldLoad;
    return o;
  };
  const unpackFight = o => {
    if (!o) return null;
    const f = K.Combat.fighter({ weapon: o.weapon, shield: o.shield, exp: o.exp || 'soldier', hand: o.hand || 'r' });
    f.life = o.life < 0 ? Infinity : o.life;
    f.bleed = unpackBleed(o.bleed);
    if (o.down === 'ko') { f.down = 'ko'; f.ko = o.ko; }
    if (o.stable) f.stable = true;
    if (o.mode) f.mode = o.mode;
    if (o.loaded === false) f.loaded = false;
    if (o.shieldLoad) f.shieldLoad = o.shieldLoad;
    return f;
  };
  const packShot = m => ({ id: m.id, kind: m.kind, owner: m.owner, pos: m.pos.map(mm), vel: m.vel.map(mm), t: mm(m.t), spin: mm(m.spin), exp: m.exp });
  const unpackShot = o => ({ id: o.id, kind: o.kind, owner: o.owner, pos: o.pos.slice(), prev: o.pos.slice(), vel: o.vel.slice(), t: o.t, spin: o.spin, exp: o.exp });
  const packStuck = s => s.host === null ? { id: s.id, kind: s.kind, host: null, pos: s.pos.map(mm), dir: s.dir.map(mm), born: Math.round(s.born) } : { id: s.id, kind: s.kind, host: s.host, part: s.part, l: s.l.map(mm), d: s.d.map(mm), born: Math.round(s.born) };
  const unpackStuck = o => Object.assign({}, o);
  const packChair = c => ({ id: c.id, pos: c.pos.map(mm), yaw: mm(c.yaw), speed: mm(c.speed), rider: c.rider === null ? null : c.rider, pusher: c.pusher === null ? null : c.pusher });
  const unpackChair = o => ({ id: o.id, pos: o.pos.slice(), yaw: o.yaw, speed: o.speed, rider: o.rider, pusher: o.pusher, stuck: 0 });

  const packPerson = (q, W) => {
    const o = { id: q.id, kit: packKit(q.kit), mv: packMove(q.mv, W), act: packAct(q.act), leg: q.leg, wait: cm(q.wait || 0), sack: q.sack.map(s => ({ id: s.id, n: s.n })), fight: packFight(q.fight) };
    if (q.regrow) o.regrow = Object.fromEntries(Object.entries(q.regrow).map(([k, v]) => [k, cm(v)]));
    Object.assign(o, pick(q, PERSON));
    return o;
  };
  const unpackPerson = (q, W) => {
    const p = { id: q.id, kit: unpackKit(q.kit), mv: unpackMove(q.mv, W), act: q.act, leg: q.leg, wait: q.wait, sack: q.sack, fight: unpackFight(q.fight) };
    if (q.regrow) p.regrow = Object.assign({}, q.regrow);
    Object.assign(p, pick(q, PERSON));
    return p;
  };
  const CARAVAN = ['id', 'kind', 'day', 'state', 'live', 'waitT', 'quiet', 'seen', 'robbed', 'lost', 'passed', 'done', 'told', 'why', 'stopDay', 'total'];
  const packCart = c => ({ i: c.i, bales: c.bales.slice(), silver: c.silver, bells: c.bells, armored: c.armored, animal: Object.assign({}, c.animal, { life: c.animal.life === null ? null : cm(c.animal.life) }), s: mm(c.s || 0), pos: c.pos ? c.pos.map(mm) : null, yaw: mm(c.yaw || 0), beast: c.beast || null });
  const unpackCart = c => Object.assign({}, c, { bales: c.bales.slice(), animal: Object.assign({}, c.animal), pos: c.pos ? c.pos.slice() : null });
  const packCaravans = (E, W) => E ? {
    list: E.list.map(c => Object.assign(pick(c, CARAVAN), { s: mm(c.s), carts: c.carts.map(packCart), crew: c.crew.map(m => ({ role: m.role, side: m.side, person: m.person ? packPerson(m.person, W) : null })) })),
    next: E.next, spawned: Object.assign({}, E.spawned), stats: JSON.parse(JSON.stringify(E.stats)), blame: E.blame.map(b => Object.assign({}, b)), sawn: JSON.parse(JSON.stringify(E.sawn)), stores: JSON.parse(JSON.stringify(E.stores)), usedDay: E.usedDay === undefined ? null : E.usedDay
  } : null;
  const unpackCaravans = (o, W) => o ? {
    list: o.list.map(c => Object.assign({ seen: [], waitT: 0, quiet: 0, people: [] }, c, { seen: (c.seen || []).slice(), carts: c.carts.map(unpackCart), crew: c.crew.map(m => ({ role: m.role, side: m.side, person: m.person ? unpackPerson(m.person, W) : null })) })),
    next: o.next, spawned: Object.assign({}, o.spawned), stats: JSON.parse(JSON.stringify(o.stats)), blame: o.blame.map(b => Object.assign({}, b)), used: {}, sawn: JSON.parse(JSON.stringify(o.sawn)), stores: JSON.parse(JSON.stringify(o.stores)), heard: {}, usedDay: o.usedDay === null ? undefined : o.usedDay
  } : undefined;

  const GROUP = ['id', 'side', 'kind', 'from', 'to', 'target', 'n', 'start', 'state', 'live', 'wait', 'back', 'day', 'fire', 'dogs', 'quiet', 'home', 'prey', 'via', 'final'];
  const packWorld = (E, W) => {
    const o = JSON.parse(JSON.stringify(Object.assign({}, E, { groups: [], acc: 0 })));
    o.groups = E.groups.map(g => Object.assign(pick(g, GROUP), { s: mm(g.s), crew: g.crew.map(p => packPerson(p, W)) }));
    o.reports = o.reports.slice(-40);
    return o;
  };
  const unpackWorld = (o, W) => {
    const E = JSON.parse(JSON.stringify(Object.assign({}, o, { groups: [] })));
    E.groups = o.groups.map(g => Object.assign({ wait: 0, quiet: 0, back: false, fire: false, dogs: false, at: g.from.slice(), line: null }, g, { crew: g.crew.map(p => unpackPerson(p, W)) }));
    return E;
  };

  function pack(S, W) {
    const p = S.player;
    return {
      v: VERSION, seed: S.seed, day: S.day, hour: mm(S.hour), time: cm(S.time), nextId: S.nextId,
      player: Object.assign({ mv: packMove(p.mv, W), pitch: mm(p.pitch), mode: p.mode, kit: packKit(p.kit), bag: p.bag.map(s => ({ id: s.id, n: s.n })), fight: packFight(p.fight) }, p.team ? { team: p.team } : {}, p.look ? { look: packLook(p.look) } : {}, p.name ? { name: p.name } : {}),
      visited: (S.visited || []).slice(),
      heard: (S.heard || []).map(h => ({ id: h.id, kind: h.kind, at: h.at.map(mm), day: h.day, hour: h.hour })),
      people: S.people.map(q => packPerson(q, W)),
      squad: S.squad ? { order: S.squad.order, fire: !!S.squad.fire, at: S.squad.at ? S.squad.at.map(mm) : null, face: mm(S.squad.face || 0) } : null,
      standing: Object.assign({ service: 0, respect: 0, loyalty: 0 }, S.standing || {}),
      beasts: (S.beasts || []).filter(b => !b.fight.down).map(packBeast),
      carcasses: (S.carcasses || []).map(packCarcass),
      fauna: S.fauna ? Object.fromEntries(Object.entries(S.fauna).map(([k, f]) => [k, [f.count, f.max, f.lost || 0, f.day || 1, f.active ? 1 : 0]])) : null,
      relations: Object.assign({}, S.relations || {}),
      econ: S.econ ? JSON.parse(JSON.stringify(S.econ)) : null,
      caravans: packCaravans(S.caravans, W),
      world: S.world ? packWorld(S.world, W) : null,
      smokes: (S.smokes || []).map(s => ({ at: s.at.map(mm), until: cm(s.until), id: s.id })),
      village: S.village ? packVillage(S.village) : null,
      guard: S.guard ? packGuard(S.guard) : null,
      army: S.army ? packArmy(S.army) : null,
      villainName: S.villainName || null,
      campaign: S.campaign ? JSON.parse(JSON.stringify(S.campaign)) : null,
      law: S.law ? { wanted: Object.fromEntries(Object.entries(S.law.wanted).filter(([, v]) => v > S.time).map(([k, v]) => [k, cm(v - S.time)])), offenses: S.law.offenses || 0 } : null,
      bodies: S.bodies.map(packBody),
      parts: S.parts.map(packPiece),
      items: S.items.map(packItem),
      blood: S.blood.map(b => Object.assign({}, b)),
      chairs: (S.chairs || []).map(packChair),
      missiles: (S.missiles || []).map(packShot),
      stuck: (S.stuck || []).map(packStuck)
    };
  }

  function migrate(obj) {
    let o = obj;
    while (o.v < VERSION) {
      const step = MIGRATIONS[o.v];
      if (!step) throw new Error('нет перехода с версии ' + o.v);
      o = step(o);
    }
    if (o.v !== VERSION) throw new Error('неизвестная версия сохранения ' + o.v);
    return o;
  }

  function unpack(obj, W) {
    const o = migrate(JSON.parse(JSON.stringify(obj)));
    const people = o.people.map(q => unpackPerson(q, W));
    const S = {
      seed: o.seed, day: o.day, hour: o.hour, time: o.time, nextId: o.nextId, version: 0,
      player: Object.assign({ mv: unpackMove(o.player.mv, W), pitch: o.player.pitch, mode: o.player.mode, kit: unpackKit(o.player.kit), bag: o.player.bag, fight: unpackFight(o.player.fight) }, o.player.team ? { team: o.player.team } : {}, o.player.look ? { look: unpackLook(o.player.look) } : {}, o.player.name ? { name: o.player.name } : {}),
      visited: (o.visited || []).slice(),
      heard: (o.heard || []).map(h => Object.assign({}, h, { at: h.at.slice() })),
      people,
      squad: o.squad ? Object.assign({}, o.squad, { at: o.squad.at ? o.squad.at.slice() : null }) : null,
      standing: Object.assign({ service: 0, respect: 0, loyalty: 0 }, o.standing || {}),
      beasts: (o.beasts || []).map(b => unpackBeast(b, W)),
      carcasses: (o.carcasses || []).map(c => unpackCarcass(c, W)),
      fauna: o.fauna ? Object.fromEntries(Object.entries(o.fauna).map(([k, f]) => [k, { count: f[0], max: f[1], lost: f[2], day: f[3], active: !!f[4] }])) : undefined,
      relations: Object.assign({}, o.relations || {}),
      econ: o.econ ? JSON.parse(JSON.stringify(o.econ)) : undefined,
      caravans: unpackCaravans(o.caravans, W),
      world: o.world ? unpackWorld(o.world, W) : undefined,
      smokes: (o.smokes || []).map(s => ({ at: s.at.slice(), until: s.until, id: s.id })),
      law: o.law ? { wanted: Object.fromEntries(Object.entries(o.law.wanted).map(([k, v]) => [k, o.time + v])), blamed: -99, offenses: o.law.offenses || 0 } : undefined,
      bodies: o.bodies.map(unpackBody),
      parts: o.parts.map(unpackPiece),
      items: o.items.map(unpackItem),
      blood: o.blood.map(b => Object.assign({}, b)),
      chairs: (o.chairs || []).map(unpackChair),
      missiles: (o.missiles || []).map(unpackShot),
      stuck: (o.stuck || []).map(unpackStuck)
    };
    S.T = W.terrain;
    if (o.village) S.village = unpackVillage(o.village, people);
    if (o.guard) S.guard = unpackGuard(o.guard, people);
    if (o.army) S.army = unpackArmy(o.army, people);
    if (o.villainName) S.villainName = o.villainName;
    if (o.campaign) S.campaign = JSON.parse(JSON.stringify(o.campaign));
    return S;
  }

  function hash(obj) {
    const s = typeof obj === 'string' ? obj : JSON.stringify(obj);
    let a = 0x811c9dc5, b = 0x01000193 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      a = Math.imul(a ^ c, 16777619) >>> 0;
      b = Math.imul(b ^ c, 2246822519) >>> 0;
    }
    return a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0');
  }

  const size = obj => new TextEncoder().encode(JSON.stringify(obj)).length;

  const STARTS = Object.freeze({
    elf: { at: [316, 712], look: [352, 716], hour: 6, hero: 'elf.m', line: 'Рассвет в Корнях. По Лесной дороге идёт корован.' },
    guard: { at: [1225, 700], look: [1225, 735], hour: 6.75, hero: 'guard.m', line: 'Утро в казарме. В семь построение и перекличка во дворе.' },
    villain: { at: [948, 106], look: [965, 98], hour: 22, hero: 'villain', line: 'Ночь в Старом форте. Железная рука скрипит.' }
  });
  const SIDE_HEROES = Object.freeze({ elf: ['elf.m', 'elf.f'], guard: ['guard.m', 'guard.f'], villain: ['villain'] });
  const lookOf = k => ({ face: k.face, hair: k.hair, hairColor: k.hairColor.slice() });

  function heroKit(id, look) {
    const k = K.Body.copyKit(K.Body.HEROES[id].kit);
    k.hero = id;
    if (look) { k.face = look.face; k.hair = look.hair; k.hairColor = look.hairColor.slice(); }
    return k;
  }

  const heroFight = id => { const g = K.Body.HERO_GEAR[id]; return K.Combat.fighter({ weapon: g[0], shield: g[1], exp: 'soldier' }); };
  const startBag = id => [{ id: 'silver', n: K.Econ.START_SILVER }, { id: 'bandage', n: 3 }, { id: 'knife', n: 1 }, { id: 'torch', n: 1 }, ...(K.Data.HERO_RANGED[K.Body.HEROES[id].kit.side] || []).map(([item, n]) => ({ id: item, n }))];

  function start(W, o) {
    const opts = o || {}, side = opts.side || K.Body.HEROES[opts.hero || 'elf.m'].kit.side, at0 = STARTS[side] || STARTS.elf;
    const hero = opts.hero && K.Body.HEROES[opts.hero] ? opts.hero : at0.hero, door = !opts.at ? (side === 'elf' ? K.Places.town(W.terrain).doors[K.Places.KORNI.hero] : side === 'guard' ? K.Places.town(W.terrain).doors.barracks : side === 'villain' ? K.Places.town(W.terrain).doors['fort-hall'] : null) : null, at = opts.at || (door ? door.inside : at0.at);
    const yaw = opts.yaw !== undefined ? opts.yaw : door ? door.face + Math.PI : Math.atan2(at0.look[0] - at[0], -(at0.look[1] - at[1]));
    const look = opts.look || lookOf(K.Body.HEROES[hero].kit);
    const S = {
      seed: 7, day: 1, hour: opts.hour !== undefined ? opts.hour : at0.hour, time: 0, nextId: 1000, version: 0,
      player: { mv: K.Move.body(W, at[0], at[1], yaw), pitch: 0, mode: 'first', kit: heroKit(hero, look), look, bag: startBag(hero), fight: heroFight(hero), team: K.Body.HEROES[hero].kit.side },
      people: [...K.Body.drill(W, 7), ...K.Body.garrison(W, 500), ...K.Body.townsfolk(W, 600)], bodies: [], parts: [], items: [K.Body.drop('crutch', crutchAt(W), { uid: 900, born: 0 })], blood: [],
      squad: null, standing: { service: 0, respect: 0, loyalty: 0 }, visited: [], heard: [],
      chairs: [K.Move.chair(1, K.Places.DRILL.chair.at[0], K.Places.DRILL.chair.at[1], K.Places.DRILL.chair.yaw, W)]
    };
    if (opts.name && side === 'villain') S.player.name = String(opts.name).slice(0, 24);
    if (opts.villainName && side !== 'villain') S.villainName = String(opts.villainName).slice(0, 24);
    S.T = W.terrain;
    K.Caravan.init(S, K.rng(17));
    K.World.state(S);
    if (!opts.at) {
      S.campaign = { side };
      if (side === 'elf' && K.Elves && opts.intro !== false) K.Elves.startIntro(S);
      if (side === 'guard' && K.Guard && opts.intro !== false) K.Guard.startIntro(S);
      if (side === 'villain' && K.Villain && opts.intro !== false) K.Villain.startIntro(S);
    }
    return S;
  }

  const crutchAt = W => { const a = K.Places.DRILL.crutch.at, g = W.terrain.heightAt(a[0], a[1]); return new Float32Array([0, 0, 1, 1, 0, 0, 0, 1, 0, a[0], g + 0.04, a[1]]); };

  const AWARE = 25;
  function blocked(S) {
    const P = S.player, F = P.fight, mv = P.mv;
    if (!F || F.down) return 'Без сознания сохраниться нельзя';
    if (K.Wounds.bleeding(F)) return 'Идёт кровь: сначала перевяжитесь';
    if (mv.swim) return 'В воде сохраниться нельзя';
    if (!mv.onGround && !mv.ladder && !mv.chair) return 'В прыжке сохраниться нельзя';
    const near = q => Math.hypot(q.mv.pos[0] - mv.pos[0], q.mv.pos[2] - mv.pos[2]) < AWARE;
    if (S.people.some(q => q.fight && !q.fight.down && q.fight.hostile === P && near(q))) return 'Враг знает о вас: в бою сохраниться нельзя';
    if ((S.beasts || []).some(b => b.fight && !b.fight.down && b.brain && (b.brain.state === 'hunt' || b.brain.state === 'attack') && near(b))) return 'Зверь рядом: в бою сохраниться нельзя';
    return null;
  }

  function meta(S, T) {
    const P = S.player, p = P.mv.pos, zone = T.zoneAt(p[0], p[2]), spot = T.spotAt(p[0], p[2]), hero = P.kit.hero || 'elf.m';
    return { side: P.team || K.Body.HEROES[hero].kit.side, hero, name: P.name || K.Body.HEROES[hero].name, day: S.day, hour: Math.floor(S.hour), zone, place: spot ? spot.name : K.Places.ZONES[zone] };
  }

  const DB = 'kirill98', STORE = 'saves';
  const SLOTS = Object.freeze(['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6', 'slot7', 'slot8']), AUTOS = Object.freeze(['auto1', 'auto2', 'auto3']), QUICK = 'quick';

  function slots(backend) {
    let base = null;
    const open = () => base || (base = new Promise((ok, no) => {
      if (!backend) { no(new Error('IndexedDB недоступна')); return; }
      const r = backend.open(DB, 1);
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' }); };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error || new Error('IndexedDB: ошибка открытия'));
    }));
    const call = (mode, fn) => open().then(db => new Promise((ok, no) => {
      const tx = db.transaction(STORE, mode), r = fn(tx.objectStore(STORE));
      tx.oncomplete = () => ok(r ? r.result : undefined);
      tx.onerror = () => no(tx.error || new Error('IndexedDB: ошибка записи'));
      tx.onabort = () => no(tx.error || new Error('IndexedDB: запись прервана'));
    }));
    const head = r => ({ id: r.id, date: r.date, meta: r.meta, thumb: r.thumb, size: r.size });
    return {
      list: () => call('readonly', s => s.getAll()).then(all => (all || []).map(head).sort((a, b) => b.date - a.date)),
      get: id => call('readonly', s => s.get(id)),
      put: rec => call('readwrite', s => s.put(rec)),
      remove: id => call('readwrite', s => s.delete(id)),
      close: () => { if (base) base.then(db => db.close(), () => { }); base = null; }
    };
  }

  const autoSlot = list => { const have = new Map(list.filter(r => AUTOS.includes(r.id)).map(r => [r.id, r.date])); return AUTOS.find(id => !have.has(id)) || AUTOS.slice().sort((a, b) => have.get(a) - have.get(b))[0]; };
  const record = (id, data, m, thumb, date) => ({ id, v: data.v, date: date || Date.now(), meta: m, thumb: thumb || null, size: size(data), data });

  K.Save = { VERSION, MIGRATIONS, pack, unpack, migrate, hash, size, STARTS, SIDE_HEROES, heroKit, heroFight, startBag, lookOf, start, blocked, meta, DB, STORE, SLOTS, AUTOS, QUICK, slots, autoSlot, record };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
