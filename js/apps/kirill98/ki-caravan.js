(function (K) {
  'use strict';

  const SPEED = 1.4, NEAR = 250, FAR = 320, CART_LEN = 2.9, GAP = 4.2, PULL = 2.6, BELLS = 80, NIGHT = [21, 6];
  const AHEAD = 9, CLEAR = 45, QUIET = 8, KEEP = 3, REGROW = 2, CARRY = 40, LEAD = 3, LEAD_SPEED = 1.4, DELIVER = 22, HAVEN = 25, SEE = 40;
  const FALL_TIME = 1.6, FELL_TIME = 3, TRUNK = 11, CRUSH = 35;
  const HOUR = 80;

  const GOODS = Object.freeze({
    bread: { item: 'baleBread', kg: 20, stock: 'food' }, grain: { item: 'baleGrain', kg: 30, stock: 'food' }, cloth: { item: 'baleCloth', kg: 25, stock: 'cloth' },
    wine: { item: 'baleWine', kg: 35, stock: 'food' }, medicine: { item: 'baleMedicine', kg: 15, stock: 'medicine' }, ore: { item: 'baleOre', kg: 40, stock: 'iron' }, iron: { item: 'baleIron', kg: 30, stock: 'iron' }
  });

  const KINDS = Object.freeze({
    trade: { name: 'торговый корован', owner: 'town', every: 1, at: 0, hour: 6, legs: [['south', -1], ['tract', 1], ['tract', -1], ['south', 1]], carts: [1, 3], animals: ['ox', 'horse'], goods: ['bread', 'cloth', 'wine', 'medicine'], guards: [2, 4], crew: 'town', haven: 'town', supply: { food: 0.12, cloth: 0.12, medicine: 0.12 }, mark: 'town' },
    treasury: { name: 'казённый корован', owner: 'guard', every: 7, at: 3, hour: 8, legs: [['tract', 1]], carts: [1, 1], animals: ['horse'], armored: true, silver: [600, 900], guards: [6, 6], crew: 'guard', haven: 'palace' },
    ore: { name: 'рудный корован', owner: 'villain', every: 2, at: 0, hour: 6, legs: [['forest', -1], ['bridge', -1], ['bridge-street', -1]], carts: [2, 2], animals: ['ox'], goods: ['ore', 'iron'], guards: [4, 4], crew: 'villain', haven: 'fort', supply: { iron: 0.12 }, mark: 'end' },
    bread: { name: 'хлебный корован', owner: 'villain', every: 2, at: 1, hour: 6, legs: [['bridge-street', 1], ['bridge', 1], ['forest', 1]], carts: [2, 2], animals: ['ox'], goods: ['bread', 'grain', 'cloth'], guards: [4, 4], crew: 'villain', haven: 'fort' }
  });

  const HAVENS = Object.freeze({ town: { at: [840, 1325], name: 'Мостовица' }, palace: { at: [1146, 700], name: 'ворота дворца' }, fort: { at: [921, 105], name: 'Старый форт' } });
  const STORES = Object.freeze({
    elf: { at: [345, 688], r: 6, name: 'кладовая Корней', cart: false },
    villain: { at: [935, 105], r: 14, name: 'склад форта', cart: [921, 105] },
    guard: { at: [1345, 595], r: 10, name: 'казна дворца', cart: [1146, 700] }
  });
  const USE = Object.freeze({ food: 0.12, cloth: 0.12, medicine: 0.12, iron: 0.06 }), LOCAL = 0.15;

  let ROUTE_CACHE = null;
  const routes = () => {
    if (ROUTE_CACHE) return ROUTE_CACHE;
    ROUTE_CACHE = {};
    for (const [kind, k] of Object.entries(KINDS)) {
      const pts = [], marks = [];
      for (const [id, dir] of k.legs) {
        const r = K.Places.ROADS.find(x => x.id === id), list = dir > 0 ? r.pts.slice() : r.pts.slice().reverse();
        for (const p of list) { const q = pts[pts.length - 1]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.5) pts.push(p.slice()); }
        marks.push(K.Terrain.polyline(pts).length);
      }
      const line = K.Terrain.polyline(pts);
      ROUTE_CACHE[kind] = { line, marks, town: kind === 'trade' ? marks[0] : line.length };
    }
    return ROUTE_CACHE;
  };

  let SAWN_CACHE = null;
  const sawnSpots = () => {
    if (SAWN_CACHE) return SAWN_CACHE;
    const road = K.Terrain.polyline(K.Places.ROADS.find(r => r.id === 'forest').pts), out = [];
    for (const s of [270, 370, 480, 590, 700, 810, 920, 1020]) {
      const p = K.Terrain.pointAt(road, s), side = out.length % 2 ? 1 : -1, nx = -p.tz * side, nz = p.tx * side;
      out.push({ id: 'sawn-' + out.length, at: [p.x + nx * 3.6, p.z + nz * 3.6], fall: [-nx, -nz], s });
    }
    SAWN_CACHE = out;
    return out;
  };

  const flat = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  const state = S => S.caravans || (S.caravans = { list: [], next: 1, spawned: {}, stats: { arrived: {}, lost: {}, robbed: {} }, blame: [], used: {}, sawn: {}, stores: {}, heard: {} });
  const range = (rnd, [a, b]) => a + Math.floor(rnd() * (b - a + 1));
  const night = h => h >= NIGHT[0] || h < NIGHT[1];
  const ownerOf = c => KINDS[c.kind].owner;
  const lineOf = c => routes()[c.kind].line;
  const ground = (W, x, z) => W.groundAt ? W.groundAt(x, z, W.terrain.heightAt(x, z) + 2.5) : W.terrain.heightAt(x, z);
  const at = (c, s) => K.Terrain.pointAt(lineOf(c), K.clamp(s, 0, lineOf(c).length));

  function make(S, kind, day, s, rnd) {
    const E = state(S), k = KINDS[kind], n = range(rnd, k.carts), carts = [];
    for (let i = 0; i < n; i++) {
      const bales = [];
      if (k.goods) for (let j = 0, m = 6 + Math.floor(rnd() * 5); j < m; j++) bales.push(k.goods[Math.floor(rnd() * k.goods.length)]);
      carts.push({ i, bales, silver: k.silver ? range(rnd, k.silver) : 0, bells: true, armored: !!k.armored, animal: { kind: k.animals[Math.floor(rnd() * k.animals.length)], sex: 'm', life: null, dead: false }, s: 0, pos: null, yaw: 0 });
    }
    const crew = [];
    const guards = range(rnd, k.guards);
    for (let i = 0; i < n; i++) crew.push({ role: 'driver', side: k.crew });
    for (let i = 0; i < guards; i++) crew.push({ role: 'escort', side: k.crew });
    const c = { id: 'cv' + E.next++, kind, day, s, total: carts.reduce((m, x) => m + x.bales.length, 0), state: 'go', live: false, carts, crew, people: [], waitT: 0, quiet: 0, seen: [], robbed: false, lost: false, passed: false, done: false, tellers: 0, ends: null };
    E.list.push(c);
    return c;
  }

  function schedule(S, rnd) {
    const E = state(S), day = S.day || 1, hour = S.hour || 0;
    for (const [kind, k] of Object.entries(KINDS)) {
      const key = kind + ':' + day;
      if (E.spawned[key] || (day - k.at) % k.every !== 0 || hour < k.hour) continue;
      E.spawned[key] = true;
      const elapsed = Math.max(0, hour - k.hour) * HOUR * SPEED;
      make(S, kind, day, Math.min(elapsed, lineOf({ kind }).length * 0.6), rnd);
    }
  }

  function init(S, rnd) {
    const E = state(S), day = S.day || 1;
    for (const [kind, k] of Object.entries(KINDS)) {
      for (let d = day; d >= Math.max(1, day - 2); d--) {
        if ((d - k.at) % k.every !== 0) continue;
        const hours = (day - d) * 24 + (S.hour || 0) - k.hour;
        if (hours < 0) continue;
        const s = hours * HOUR * SPEED * 0.6, len = lineOf({ kind }).length;
        E.spawned[kind + ':' + d] = true;
        if (s < len - 30) make(S, kind, d, s, rnd);
        break;
      }
    }
  }

  const crewOf = (S, c) => S.people.filter(p => p.convoy && p.convoy.id === c.id);
  const able = p => !!p && !!p.fight && !p.fight.down && !p.state;
  const beastsOf = (S, c) => (S.beasts || []).filter(b => b.hitch && b.hitch.id === c.id);

  function slotOf(S, p) {
    const c = byId(S, p.convoy.id);
    if (!c || !c.live) return null;
    const i = p.convoy.slot, carts = c.carts, lead = carts[0];
    if (!lead.pos) return null;
    if (p.convoy.role === 'driver') {
      const cart = carts[Math.min(i, carts.length - 1)], b = K.basis(cart.yaw, 0);
      return [cart.pos[0] + b.fwd[0] * (PULL + 0.4) - b.right[0] * 1.3, cart.pos[2] + b.fwd[2] * (PULL + 0.4) - b.right[2] * 1.3];
    }
    const last = carts[carts.length - 1], bl = K.basis(last.yaw, 0), bf = K.basis(lead.yaw, 0);
    const spots = [
      [lead.pos[0] + bf.fwd[0] * 7, lead.pos[2] + bf.fwd[2] * 7], [last.pos[0] - bl.fwd[0] * 5, last.pos[2] - bl.fwd[2] * 5],
      [lead.pos[0] + bf.right[0] * 2.4, lead.pos[2] + bf.right[2] * 2.4], [last.pos[0] + bl.right[0] * 2.4, last.pos[2] + bl.right[2] * 2.4],
      [lead.pos[0] + bf.fwd[0] * 9 + bf.right[0] * 1.5, lead.pos[2] + bf.fwd[2] * 9 + bf.right[2] * 1.5], [last.pos[0] - bl.fwd[0] * 7 + bl.right[0] * 1.5, last.pos[2] - bl.fwd[2] * 7 + bl.right[2] * 1.5]
    ];
    return spots[i % spots.length];
  }

  function wake(S, c, W, rnd) {
    const k = KINDS[c.kind];
    place(S, c, W);
    let slot = 0, drivers = 0;
    for (const m of c.crew) {
      const p = m.person || makeCrew(S, c, m, W, rnd);
      m.person = p;
      const role = m.role, idx = role === 'driver' ? drivers++ : slot++;
      p.convoy = { id: c.id, role, slot: idx };
      const sp = slotOf(S, p) || [c.carts[0].pos[0], c.carts[0].pos[2]];
      p.mv = K.Move.body(W, sp[0], sp[1], c.carts[0].yaw);
      if (!p.anim) p.anim = K.Anim.state();
      S.people.push(p);
    }
    c.crew = [];
    for (const cart of c.carts) {
      if (cart.animal.dead) continue;
      const b = K.basis(cart.yaw, 0), x = cart.pos[0] + b.fwd[0] * PULL, z = cart.pos[2] + b.fwd[2] * PULL;
      const beast = K.Beasts.make(S.nextId++, cart.animal.kind, x, z, cart.yaw, W, { sex: cart.animal.sex, owner: k.owner === 'town' ? 'town' : k.owner, home: [x, z] });
      if (cart.animal.life !== null) beast.fight.life = cart.animal.life;
      if (cart.animal.cut) beast.kit.cut = Object.assign({}, cart.animal.cut);
      beast.hitch = { id: c.id, cart: cart.i };
      S.beasts = S.beasts || [];
      S.beasts.push(beast);
      cart.beast = beast.id;
    }
    c.live = true;
    c.people = [];
    S.version = (S.version || 0) + 1;
  }

  function makeCrew(S, c, m, W, rnd) {
    const id = S.nextId++, p = K.Body.member(id, m.side, 0, 0, 0, W, { kind: 'stand', post: [0, 0], face: 0 });
    if (m.role === 'driver') { p.fight = K.Combat.fighter({}); p.sack = [{ id: 'bread', n: 1 }]; }
    else if (m.side === 'town') { p.fight = K.Combat.fighter({ weapon: rnd() < 0.6 ? 'sword' : 'spear', shield: rnd() < 0.7, exp: m.weak ? 'recruit' : 'soldier' }); p.kit.armor = m.weak ? [] : ['mail']; p.kit.head = m.weak ? null : 'nasal'; p.sack = [{ id: 'bandage', n: 1 }, { id: 'silver', n: 3 + Math.floor(rnd() * 8) }]; }
    p.role = m.role === 'driver' ? 'driver' : 'escort';
    return p;
  }

  function sleep(S, c) {
    const people = crewOf(S, c);
    for (const p of people) {
      S.people.splice(S.people.indexOf(p), 1);
      p.brain = null;
      p.anim = null;
      c.crew.push({ role: p.convoy.role, side: p.team, person: p });
    }
    for (const b of beastsOf(S, c)) {
      const cart = c.carts[b.hitch.cart];
      cart.animal.life = b.fight.life;
      cart.animal.cut = Object.assign({}, b.kit.cut || {});
      S.beasts.splice(S.beasts.indexOf(b), 1);
      cart.beast = null;
    }
    for (const cart of c.carts) if (cart.beast && !(S.beasts || []).some(b => b.id === cart.beast)) { cart.animal.dead = true; cart.beast = null; }
    c.live = false;
    S.version = (S.version || 0) + 1;
  }

  function place(S, c, W) {
    for (const cart of c.carts) {
      if (c.state === 'led' || c.state === 'stopped' && cart.pos) continue;
      const s = c.s - cart.i * (CART_LEN + GAP), p = at(c, s), p2 = at(c, s + 0.5);
      cart.s = s;
      cart.yaw = Math.atan2(p2.x - p.x, -(p2.z - p.z));
      cart.pos = [p.x, ground(W, p.x, p.z), p.z];
    }
  }

  function trail(cart, head, W, len) {
    const dx = head[0] - cart.pos[0], dz = head[2] - cart.pos[2], d = Math.hypot(dx, dz) || 1;
    cart.pos = [head[0] - dx / d * len, 0, head[2] - dz / d * len];
    cart.pos[1] = ground(W, cart.pos[0], cart.pos[2]);
    cart.yaw = Math.atan2(dx, -dz);
  }

  function logAhead(S, c) {
    const E = state(S), line = lineOf(c);
    for (const spot of sawnSpots()) {
      const st = E.sawn[spot.id];
      if (!st || st.state !== 'down') continue;
      const n = K.Terrain.nearest(line, spot.at[0], spot.at[1]);
      if (n.d > 8) continue;
      const ahead = n.s - c.s;
      if (ahead > -1 && ahead < AHEAD) return spot;
    }
    return null;
  }

  function fightOn(S, c) {
    return crewOf(S, c).some(p => p.fight && p.fight.hostile && !p.fight.hostile.fight.down);
  }

  function canGo(S, c) {
    if (c.carts.some(cart => cart.animal.dead)) return 'ox';
    if (c.live) {
      const crew = crewOf(S, c);
      if (!crew.some(p => p.convoy.role === 'driver' && able(p) && !p.tell)) return 'driver';
      if (!crew.some(able)) return 'crew';
      if (c.seen.length && KINDS[c.kind].guards[0] && !crew.some(p => p.convoy.role === 'escort' && able(p))) return 'guards';
    } else {
      if (!c.crew.some(m => m.role === 'driver' && (!m.person || able(m.person)))) return 'driver';
      if (c.seen.length && !c.crew.some(m => m.role === 'escort' && (!m.person || able(m.person)))) return 'guards';
    }
    return null;
  }

  function stop(S, c, why, events) {
    if (c.state === 'stopped') return;
    c.state = 'stopped';
    c.why = why;
    if (!c.lost) {
      c.lost = true;
      const E = state(S);
      E.stats.lost[c.kind] = (E.stats.lost[c.kind] || 0) + 1;
      events.push({ kind: 'lost', caravan: c, why });
    }
  }

  function step(S, dt, W, rnd, events) {
    const E = state(S), focus = S.player ? S.player.mv.pos : S.focus || null;
    schedule(S, rnd);
    sawnStep(S, dt, W, events);
    const fires = [];
    for (const c of E.list.slice()) {
      if (c.done) continue;
      const lead = c.carts[0], head = lead.pos || (() => { const p = at(c, c.s); return [p.x, 0, p.z]; })();
      const d = focus ? flat(focus, head) : Infinity;
      if (!c.live && d < NEAR) wake(S, c, W, rnd);
      else if (c.live && d > FAR) { sleep(S, c); settleFar(S, c, events); }
      if (c.live) for (const cart of c.carts) if (cart.beast && !(S.beasts || []).some(b => b.id === cart.beast)) { cart.animal.dead = true; cart.beast = null; }
      const why = c.state !== 'led' && c.state !== 'arrived' ? canGo(S, c) : null;
      if (why && c.state !== 'stopped') stop(S, c, why, events);
      if (c.state === 'stopped') { stoppedStep(S, c, dt, W, events); if (c.live) hitch(S, c, W, 0); continue; }
      if (c.state === 'led') { ledStep(S, c, dt, W, events); continue; }
      if (c.state === 'arrived') { if (c.live) hitch(S, c, W, 0); continue; }
      const log = logAhead(S, c), fighting = c.live && fightOn(S, c);
      if (fighting) c.quiet = 0; else c.quiet += dt;
      const rest = night(S.hour || 0) || (K.Weather && K.Weather.camps(K.Weather.at(S)));
      let go = !rest && !log && c.quiet > QUIET;
      if (c.live && go) {
        const late = crewOf(S, c).filter(able).some(p => { const sp = slotOf(S, p); return sp && Math.hypot(sp[0] - p.mv.pos[0], sp[1] - p.mv.pos[2]) > 9; });
        if (late) go = false;
      }
      if (log) {
        c.waitT += dt;
        if (c.waitT > CLEAR && !fighting && (c.live ? crewOf(S, c).some(able) : c.crew.length)) { clearLog(S, log, W); c.waitT = 0; events.push({ kind: 'cleared', caravan: c, spot: log }); }
      } else c.waitT = 0;
      c.state = rest ? 'camp' : log ? 'blocked' : 'go';
      const speed = go ? SPEED : 0;
      c.s += speed * dt;
      if (c.live) { place(S, c, W); hitch(S, c, W, speed); }
      if (c.state === 'camp') { const p = at(c, c.s + 4), q = at(c, c.s + 4.5), nx = -(q.z - p.z) * 2, nz = (q.x - p.x) * 2; fires.push({ at: [p.x + nx * 4.5, W.terrain.heightAt(p.x + nx * 4.5, p.z + nz * 4.5) + 0.4, p.z + nz * 4.5], r: 7, caravan: c.id }); }
      milestones(S, c, events);
    }
    E.fires = fires;
    S.fires = fires;
    E.list = E.list.filter(c => !(c.done && !c.live));
    return events;
  }

  function milestones(S, c, events) {
    const R = routes()[c.kind], k = KINDS[c.kind];
    if (!c.passed && c.s >= R.town) {
      c.passed = true;
      const share = c.total ? bales(c) / c.total : 1;
      if (k.supply) { for (const [key, v] of Object.entries(k.supply)) K.Econ.setStock(S, key, K.Econ.state(S).stock[key] + v * share); events.push({ kind: 'supplied', caravan: c, share }); }
    }
    if (c.s >= R.line.length) arrive(S, c, events);
  }

  function arrive(S, c, events) {
    const E = state(S);
    E.stats.arrived[c.kind] = (E.stats.arrived[c.kind] || 0) + 1;
    events.push({ kind: 'arrived', caravan: c });
    if (c.robbed && c.seen.length) testify(S, c, c.seen, events);
    if (c.live) c.state = 'arrived';
    c.done = true;
  }

  function hitch(S, c, W, speed) {
    for (const b of beastsOf(S, c)) {
      const cart = c.carts[b.hitch.cart], f = K.basis(cart.yaw, 0), x = cart.pos[0] + f.fwd[0] * PULL, z = cart.pos[2] + f.fwd[2] * PULL;
      b.mv.pos = [x, ground(W, x, z), z];
      b.mv.vel = [f.fwd[0] * speed, 0, f.fwd[2] * speed];
      b.mv.yaw = cart.yaw;
      b.mv.speed = speed;
      b.mv.onGround = true;
    }
  }

  function stoppedStep(S, c, dt, W, events) {
    const E = state(S);
    c.waitT += dt;
    if (c.live) {
      const crew = crewOf(S, c);
      for (const p of crew) {
        if (!able(p) || p.tell || !c.seen.length) continue;
        if (p.convoy.role === 'driver' || !fightOn(S, c) && c.quiet > QUIET * 2) p.tell = { id: c.id, haven: HAVENS[KINDS[c.kind].haven].at.slice(), sides: c.seen.slice() };
      }
      if (fightOn(S, c)) c.quiet = 0; else c.quiet += dt;
    }
    if (!c.live && (S.day || 1) - (c.stopDay || (c.stopDay = S.day || 1)) >= KEEP) c.done = true;
  }

  function settleFar(S, c, events) {
    const tellers = c.crew.filter(m => m.person && able(m.person) && m.person.tell);
    if (c.state === 'stopped' && c.seen.length && !c.told && (tellers.length || c.crew.some(m => m.person && able(m.person)))) testify(S, c, c.seen, events);
    if (c.state === 'stopped') c.crew = c.crew.filter(m => !(m.person && m.person.tell));
  }

  function testify(S, c, sides, events) {
    if (c.told) return;
    c.told = true;
    const E = state(S), owner = ownerOf(c), R = S.relations || (S.relations = {});
    const player = sides.includes('player');
    E.blame.push({ kind: c.kind, owner, sides: sides.filter(x => x !== 'player'), player, day: S.day || 1 });
    if (player) R[owner] = (R[owner] || 0) - (c.kind === 'treasury' ? 25 : 15);
    events.push({ kind: 'witness', caravan: c, owner, sides, player, haven: HAVENS[KINDS[c.kind].haven].name });
  }

  function tellStep(S, p, events) {
    if (!p.tell) return;
    if (Math.hypot(p.mv.pos[0] - p.tell.haven[0], p.mv.pos[2] - p.tell.haven[1]) > HAVEN) return;
    const c = byId(S, p.tell.id);
    if (c) testify(S, c, p.tell.sides, events);
    p.tell = null;
    p.convoy = null;
    p.act = { kind: 'stand', post: [p.mv.pos[0], p.mv.pos[2]], face: p.mv.yaw };
  }

  function alarm(S, c, who) {
    if (!c || !who || c.state === 'arrived') return;
    const side = who === S.player ? 'player' : who.team || (who.kit && who.kit.side);
    if (side && !c.seen.includes(side)) c.seen.push(side);
    if (who === S.player && S.player.team && !c.seen.includes(S.player.team)) c.seen.push(S.player.team);
    c.quiet = 0;
    if (!c.live) return;
    for (const p of crewOf(S, c)) {
      if (!able(p)) continue;
      const B = p.brain || (p.brain = K.AI.brain());
      if (p.convoy.role === 'driver') { B.fleeUntil = S.time + 10; B.foePos = who.mv.pos.slice(); B.fledAt = S.time; continue; }
      if (!p.fight.hostile && Math.hypot(p.mv.pos[0] - who.mv.pos[0], p.mv.pos[2] - who.mv.pos[2]) < SEE) { p.fight.hostile = who; B.lostT = 0; B.last = who.mv.pos.slice(); B.seenNow = true; B.ignoreUntil = 0; }
    }
  }

  function react(S, events) {
    if (!S.caravans) return;
    for (const e of events) {
      if ((e.kind !== 'hit' && e.kind !== 'kick') || !e.who || !e.to) continue;
      const id = e.to.convoy ? e.to.convoy.id : e.to.hitch ? e.to.hitch.id : null;
      if (id && e.who !== e.to && !(e.who.convoy && e.who.convoy.id === id)) alarm(S, byId(S, id), e.who);
    }
    for (const p of S.people) if (p.tell) tellStep(S, p, events);
  }

  function ledStep(S, c, dt, W, events) {
    const P = S.player, lead = c.carts[0], beast = beastsOf(S, c).find(b => b.hitch.cart === 0);
    if (!P || !beast) { c.state = 'stopped'; return; }
    const head = beast.mv.pos, d = flat(head, P.mv.pos);
    let speed = 0;
    if (d > LEAD) {
      speed = Math.min(LEAD_SPEED, (d - LEAD) * 2);
      const dx = P.mv.pos[0] - head[0], dz = P.mv.pos[2] - head[2], n = Math.hypot(dx, dz) || 1;
      const x = head[0] + dx / n * speed * dt, z = head[2] + dz / n * speed * dt;
      beast.mv.pos = [x, ground(W, x, z), z];
      beast.mv.yaw = Math.atan2(dx, -dz);
    }
    beast.mv.speed = speed;
    trail(lead, beast.mv.pos, W, PULL);
    for (let i = 1; i < c.carts.length; i++) {
      const prev = c.carts[i - 1], cart = c.carts[i], f = K.basis(prev.yaw, 0), tow = [prev.pos[0] - f.fwd[0] * CART_LEN * 0.5, 0, prev.pos[2] - f.fwd[2] * CART_LEN * 0.5];
      const b = beastsOf(S, c).find(x => x.hitch.cart === i);
      if (b) { const dx = tow[0] - b.mv.pos[0], dz = tow[2] - b.mv.pos[2], n = Math.hypot(dx, dz); if (n > 1.2) { b.mv.pos = [tow[0] - dx / n * 1.2, 0, tow[2] - dz / n * 1.2]; b.mv.pos[1] = ground(W, b.mv.pos[0], b.mv.pos[2]); b.mv.yaw = Math.atan2(dx, -dz); } b.mv.speed = speed; trail(cart, b.mv.pos, W, PULL); }
      else trail(cart, tow, W, CART_LEN + 0.6);
    }
    const store = STORES[P.team];
    if (store && store.cart && flat(lead.pos, [store.cart[0], 0, store.cart[1]]) < DELIVER) deliverCaravan(S, c, P.team, events);
  }

  function deliverCaravan(S, c, side, events) {
    const E = state(S), box = E.stores[side] || (E.stores[side] = {});
    let silver = 0, bales = 0;
    for (const cart of c.carts) {
      for (const g of cart.bales) { box[g] = (box[g] || 0) + 1; bales++; }
      cart.bales = [];
      silver += cart.silver;
      cart.silver = 0;
    }
    if (silver && S.player) K.Econ.earn(S, S.player.bag, silver);
    for (const b of beastsOf(S, c)) S.beasts.splice(S.beasts.indexOf(b), 1);
    for (const p of crewOf(S, c)) p.convoy = null;
    c.done = true;
    c.live = false;
    events.push({ kind: 'delivered', caravan: c, side, bales, silver, store: STORES[side].name });
  }

  function lead(S, c) {
    if (!c || c.state !== 'stopped' || c.carts[0].animal.dead) return { ok: false, why: c && c.carts[0].animal.dead ? 'Вол убит: телегу не увести' : 'Корован ещё идёт' };
    if (crewOf(S, c).some(p => able(p) && !p.tell && Math.hypot(p.mv.pos[0] - S.player.mv.pos[0], p.mv.pos[2] - S.player.mv.pos[2]) < 15 && p.convoy.role === 'escort')) return { ok: false, why: 'Охрана рядом' };
    c.state = 'led';
    alarm(S, c, S.player);
    return { ok: true };
  }

  function release(S, c) {
    if (c && c.state === 'led') c.state = 'stopped';
  }

  const ITEM_GOODS = Object.fromEntries(Object.entries(GOODS).map(([g, d]) => [d.item, g]));
  const cargoKg = bag => (bag || []).reduce((m, s) => m + (ITEM_GOODS[s.id] ? GOODS[ITEM_GOODS[s.id]].kg * s.n : 0), 0);

  function take(S, P, c, i, goods) {
    const cart = c.carts[i];
    if (!cart) return { ok: false, why: 'Телеги нет' };
    if (goods === 'silver') {
      if (!cart.silver) return { ok: false, why: 'Серебра нет' };
      const n = cart.silver;
      cart.silver = 0;
      K.Econ.earn(S, P.bag, n);
      rob(S, c, P);
      return { ok: true, silver: n };
    }
    if (goods === 'bells') {
      if (!cart.bells) return { ok: false, why: 'Бубенцов нет' };
      cart.bells = false;
      const s = P.bag.find(x => x.id === 'bells');
      if (s) s.n++; else P.bag.push({ id: 'bells', n: 1 });
      rob(S, c, P);
      return { ok: true };
    }
    const j = cart.bales.indexOf(goods), d = GOODS[goods];
    if (j < 0) return { ok: false, why: 'Такого тюка нет' };
    if (cargoKg(P.bag) + d.kg > CARRY) return { ok: false, why: `Не унести: ноша ${cargoKg(P.bag)} из ${CARRY} кг` };
    cart.bales.splice(j, 1);
    const s = P.bag.find(x => x.id === d.item);
    if (s) s.n++; else P.bag.push({ id: d.item, n: 1 });
    rob(S, c, P);
    return { ok: true, kg: d.kg };
  }

  function rob(S, c, who) {
    if (!c.robbed) { c.robbed = true; const E = state(S); E.stats.robbed[c.kind] = (E.stats.robbed[c.kind] || 0) + 1; }
    alarm(S, c, who);
  }

  function friendsCarry(S, P, c, i) {
    const cart = c.carts[i], got = [];
    for (const q of S.people) {
      if (q.squad !== 'player' || !able(q) || flat(q.mv.pos, P.mv.pos) > 25) continue;
      while (cart.bales.length) {
        const g = cart.bales[cart.bales.length - 1], d = GOODS[g];
        if (cargoKg(q.sack) + d.kg > CARRY) break;
        cart.bales.pop();
        const s = q.sack.find(x => x.id === d.item);
        if (s) s.n++; else q.sack.push({ id: d.item, n: 1 });
        got.push(q);
      }
    }
    if (got.length) rob(S, c, P);
    return [...new Set(got)];
  }

  function deposit(S, P) {
    const st = STORES[P.team];
    if (!st || Math.hypot(P.mv.pos[0] - st.at[0], P.mv.pos[2] - st.at[1]) > st.r) return null;
    const E = state(S), box = E.stores[P.team] || (E.stores[P.team] = {}), got = {};
    let n = 0;
    const empty = bag => {
      for (const s of bag.slice()) {
        const g = ITEM_GOODS[s.id];
        if (!g) continue;
        box[g] = (box[g] || 0) + s.n;
        got[g] = (got[g] || 0) + s.n;
        n += s.n;
        bag.splice(bag.indexOf(s), 1);
      }
    };
    empty(P.bag);
    for (const q of S.people) if (q.squad === 'player' && able(q) && flat(q.mv.pos, P.mv.pos) < 25) empty(q.sack);
    if (n && P.team === 'elf' && K.Elves) { K.Elves.credit(S, got); K.Elves.respect(S, Math.min(8, n * 1.5), 'кладовая'); }
    return { n, name: st.name };
  }

  function nearCart(S, pos, r) {
    let best = null, bd = r;
    for (const c of state(S).list) {
      if (!c.live) continue;
      for (const cart of c.carts) {
        if (!cart.pos) continue;
        const d = flat(cart.pos, pos);
        if (d < bd + 1.4) { bd = d - 1.4; best = { c, i: cart.i, cart }; }
      }
    }
    return best;
  }

  function nearHarness(S, pos, r) {
    for (const c of state(S).list) {
      if (!c.live) continue;
      for (const b of beastsOf(S, c)) if (flat(b.mv.pos, pos) < r && b.hitch.cart === 0) return { c, beast: b };
    }
    return null;
  }

  function sawnStep(S, dt, W, events) {
    const E = state(S);
    for (const spot of sawnSpots()) {
      const st = E.sawn[spot.id] || (E.sawn[spot.id] = { state: 'stand', t: 0, day: 0 });
      if (st.state === 'falling') {
        st.t += dt;
        if (st.t >= FALL_TIME) { st.state = 'down'; st.t = 0; land(S, spot, W, events); }
      } else if (st.state === 'gone' && (S.day || 1) - st.day >= REGROW) { st.state = 'stand'; st.t = 0; }
    }
    if (W.dyn) {
      const logs = sawnSpots().filter(sp => E.sawn[sp.id] && E.sawn[sp.id].state === 'down').map(sp => logBox(sp, W.terrain));
      W.dyn = W.dyn.filter(b => !b.log).concat(logs);
    }
  }

  const logCentre = spot => [spot.at[0] + spot.fall[0] * TRUNK / 2, spot.at[1] + spot.fall[1] * TRUNK / 2];
  function logBox(spot, T) {
    const c = logCentre(spot), yaw = Math.atan2(spot.fall[0], -spot.fall[1]), y = T.heightAt(c[0], c[1]);
    return Object.assign(K.Move.resolveBox({ x: c[0], z: c[1], w: 0.7, d: TRUNK, rot: yaw * 180 / Math.PI, y0: y - 0.2, y1: y + 0.6, kind: 'bark' }, T), { log: spot.id });
  }

  function land(S, spot, W, events) {
    const c = logCentre(spot), yaw = Math.atan2(spot.fall[0], -spot.fall[1]), cs = Math.cos(yaw), sn = Math.sin(yaw);
    const all = S.player ? [S.player, ...S.people] : S.people;
    for (const q of all) {
      if (!q.fight || q.fight.down) continue;
      const dx = q.mv.pos[0] - c[0], dz = q.mv.pos[2] - c[1], u = dx * cs + dz * sn, v = -dx * sn + dz * cs;
      if (Math.abs(u) < 0.8 && Math.abs(v) < TRUNK / 2) { q.fight.life -= CRUSH; q.fight.stun = Math.max(q.fight.stun || 0, 2); events.push({ kind: 'crushed', who: q, at: q.mv.pos.slice() }); }
    }
    events.push({ kind: 'treefall', spot, at: [c[0], W.terrain.heightAt(c[0], c[1]), c[1]] });
  }

  function fell(S, id) {
    const E = state(S), st = E.sawn[id] || (E.sawn[id] = { state: 'stand', t: 0, day: 0 });
    if (st.state !== 'stand') return false;
    st.state = 'falling';
    st.t = 0;
    return true;
  }

  function clearLog(S, spot) {
    const st = state(S).sawn[spot.id];
    if (st) { st.state = 'gone'; st.day = S.day || 1; st.t = 0; }
  }

  function nearSawn(S, pos, r) {
    const E = state(S);
    for (const spot of sawnSpots()) {
      const st = E.sawn[spot.id] || { state: 'stand' };
      if (st.state === 'stand' && Math.hypot(spot.at[0] - pos[0], spot.at[1] - pos[2]) < r) return spot;
    }
    return null;
  }

  function trunkFrame(S, spot, T) {
    const st = state(S).sawn[spot.id] || { state: 'stand', t: 0 };
    if (st.state === 'gone') return null;
    const k = st.state === 'down' ? 1 : st.state === 'falling' ? Math.pow(K.clamp(st.t / FALL_TIME, 0, 1), 2) : 0, a = k * Math.PI / 2 * 0.985;
    const up = [spot.fall[0] * Math.sin(a), Math.cos(a), spot.fall[1] * Math.sin(a)], side = [-spot.fall[1], 0, spot.fall[0]], fwd = [up[1] * side[2] - up[2] * side[1], up[2] * side[0] - up[0] * side[2], up[0] * side[1] - up[1] * side[0]];
    const y = T.heightAt(spot.at[0], spot.at[1]) + (st.state === 'down' ? 0.3 : 0);
    return [side[0] * 0.3, side[1] * 0.3, side[2] * 0.3, up[0] * TRUNK, up[1] * TRUNK, up[2] * TRUNK, fwd[0] * 0.3, fwd[1] * 0.3, fwd[2] * 0.3, spot.at[0], y, spot.at[1]];
  }

  function cartBoxes(S, W) {
    if (!W.dyn) return;
    const out = [];
    for (const c of state(S).list) {
      if (!c.live) continue;
      for (const cart of c.carts) if (cart.pos) out.push(Object.assign(K.Move.resolveBox({ x: cart.pos[0], z: cart.pos[2], w: 1.6, d: CART_LEN, rot: cart.yaw * 180 / Math.PI, y0: cart.pos[1], y1: cart.pos[1] + 1.15, kind: 'wood' }, W.terrain), { cart: true }));
    }
    W.dyn = W.dyn.filter(b => !b.cart).concat(out);
  }

  function daily(S) {
    const E = state(S), day = S.day || 1;
    if (E.usedDay === undefined) E.usedDay = day;
    while (E.usedDay < day) {
      E.usedDay++;
      for (const [key, v] of Object.entries(USE)) { const s = K.Econ.state(S).stock[key]; K.Econ.setStock(S, key, s - v + (1 - s) * LOCAL); }
    }
  }

  function run(S, dt, W, rnd) {
    const events = [];
    daily(S);
    step(S, dt, W, rnd, events);
    cartBoxes(S, W);
    return events;
  }

  function hears(S, pos) {
    const out = [];
    for (const c of state(S).list) {
      if (!c.live || c.state !== 'go') continue;
      for (const b of beastsOf(S, c)) {
        const cart = c.carts[b.hitch.cart];
        if (cart.bells && flat(b.mv.pos, pos) < BELLS) { out.push({ c, at: [b.mv.pos[0], b.mv.pos[1] + 1.2, b.mv.pos[2]], d: flat(b.mv.pos, pos) }); break; }
      }
    }
    return out;
  }

  const byId = (S, id) => S.caravans ? S.caravans.list.find(c => c.id === id) || null : null;

  function bales(c) {
    return c.carts.reduce((n, cart) => n + cart.bales.length, 0);
  }

  K.Caravan = {
    SPEED, NEAR, FAR, BELLS, CARRY, GOODS, KINDS, HAVENS, STORES, USE, CART_LEN, PULL, FELL_TIME, TRUNK,
    routes, sawnSpots, state, make, init, schedule, run, step, react, alarm, wake, sleep, slotOf, crewOf, beastsOf, byId, lead, release, take, friendsCarry, deposit, cargoKg,
    nearCart, nearHarness, nearSawn, fell, clearLog, trunkFrame, hears, bales, canGo, testify, ITEM_GOODS, daily, night
  };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
