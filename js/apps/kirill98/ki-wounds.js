(function (K) {
  'use strict';

  const TINCTURE = Object.freeze({ time: 60, slow: 0.5 });
  const HEAVY = 45, KO_TIME = 20, DEAD_LIFE = -50, POOL_CAP = 240;
  const MEDIUM = Object.freeze({ rate: 0.6, time: 60 }), LIGHT = Object.freeze({ rate: 0.25, time: 40, most: 3 });
  const BIND = Object.freeze({ two: 3, one: 6, other: 2.5, reach: 1.6 });
  const CRAWL = Object.freeze({ one: 0.7, both: 0.5 }), CRUTCH = Object.freeze({ walk: 1.0, run: 1.6 });
  const ARMS = Object.freeze({
    hand: { hold: true, grab: true, draw: true, bind: true, bow: true },
    iron: { hold: true, grab: false, draw: false, bind: false, bow: false, slow: 0.85, sink: true },
    hook: { hold: false, grab: true, draw: false, bind: false, bow: false },
    carved: { hold: false, grab: false, draw: false, bind: false, bow: true },
    hinge: { hold: true, grab: true, draw: true, bind: true, bow: true }
  });
  const LEGS = Object.freeze({
    leg: { run: K.METRICS.run, jump: K.METRICS.jumpHeight, sprint: true, loud: false },
    peg: { run: 3.2, jump: 0.4, sprint: false, loud: true },
    willow: { run: K.METRICS.run, jump: 1.1, sprint: true, loud: false },
    iron: { run: 4.2, jump: K.METRICS.jumpHeight, sprint: false, loud: true, sink: true },
    hinge: { run: K.METRICS.run, jump: K.METRICS.jumpHeight, sprint: true, loud: false }
  });
  const EYES = Object.freeze({ ok: 'ok', patch: 'dark', glass: 'glass', resin: 'resin', ruby: 'ruby' });
  const SIDES = [['l', 'lArm', 'lFore', 'lThigh', 'lShin'], ['r', 'rArm', 'rFore', 'rThigh', 'rShin']];

  const armOf = (kit, arm, fore) => {
    const cut = kit.cut || {}, pros = kit.pros || {};
    if (cut[arm]) return { kind: 'none', state: cut[arm] };
    if (pros[fore]) return { kind: pros[fore], state: 'healed' };
    if (cut[fore]) return { kind: 'stump', state: cut[fore] };
    return { kind: 'hand', state: null };
  };
  const legOf = (kit, thigh, shin) => {
    const cut = kit.cut || {}, pros = kit.pros || {};
    if (cut[thigh]) return { kind: 'none', state: cut[thigh] };
    if (pros[shin]) return { kind: pros[shin], state: 'healed' };
    if (cut[shin]) return { kind: 'stump', state: cut[shin] };
    return { kind: 'leg', state: null };
  };
  const eyeOf = v => !v ? 'ok' : v === true ? 'dark' : EYES[v] || 'dark';

  function limbs(kit) {
    const out = { arms: {}, legs: {}, eyes: {}, fresh: 0 };
    for (const [s, arm, fore, thigh, shin] of SIDES) {
      out.arms[s] = armOf(kit, arm, fore);
      out.legs[s] = legOf(kit, thigh, shin);
      out.eyes[s] = eyeOf((kit.eyes || {})[s]);
    }
    for (const v of Object.values(kit.cut || {})) if (v === 'fresh') out.fresh++;
    return out;
  }

  const capsCache = new Map();
  const keyOf = kit => JSON.stringify([kit.cut || {}, kit.pros || {}, kit.eyes || {}, kit.armor || [], kit.head || null]);

  function caps(kit) {
    const key = keyOf(kit);
    if (capsCache.has(key)) return capsCache.get(key);
    const L = limbs(kit), A = [L.arms.l.kind, L.arms.r.kind].map(k => ARMS[k] || null), has = f => A.filter(a => a && a[f]).length;
    const holders = has('hold'), grabbers = has('grab'), binders = has('bind');
    const pair = (f, g) => (A[0] && A[1] && ((A[0][f] && A[1][g]) || (A[0][g] && A[1][f])));
    const legs = [L.legs.l, L.legs.r], standing = legs.filter(l => LEGS[l.kind]).length, gone = 2 - standing;
    const raw = legs.some(l => (l.kind === 'stump' || l.kind === 'none') && l.state === 'fresh');
    const gait = standing === 2 ? legs.map(l => LEGS[l.kind]) : null;
    const c = {
      hands: holders, weapon: holders > 0, twoHanded: holders === 2, shield: !!pair('hold', 'grab'), bow: !!pair('bow', 'draw'),
      ladder: grabbers > 0, rope: grabbers === 2, carry: grabbers === 2, drag: grabbers > 0, door: grabbers > 0,
      bindSelf: binders === 2 ? BIND.two : binders === 1 ? BIND.one : null, bindOther: binders > 0,
      kick: standing === 2, stand: standing === 2,
      walk: standing === 2 ? K.METRICS.walk : 0,
      run: gait ? Math.min(...gait.map(g => g.run)) : 0,
      jump: gait ? Math.min(...gait.map(g => g.jump)) : 0,
      sprint: gait ? gait.every(g => g.sprint) : false,
      loud: gait ? gait.some(g => g.loud) : false,
      crawl: standing === 2 ? 0 : gone === 2 ? CRAWL.both : CRAWL.one,
      crutch: gone === 1 && !raw && grabbers > 0,
      chair: gone > 0 && !raw,
      swim: !A.some(a => a && a.sink) && !legs.some(l => LEGS[l.kind] && LEGS[l.kind].sink) && !(kit.armor || []).includes('plate'),
      stamina: (kit.armor || []).reduce((m, a) => Math.min(m, K.Data.ARMOR.stamina[a] || 1), 1),
      slit: kit.head === 'closed',
      slow: A.some(a => a && a.slow) ? Math.min(...A.filter(a => a && a.slow).map(a => a.slow)) : 1,
      view: { l: L.eyes.l, r: L.eyes.r }, blind: L.eyes.l === 'dark' && L.eyes.r === 'dark',
      fresh: L.fresh
    };
    capsCache.set(key, Object.freeze(c));
    if (capsCache.size > 400) capsCache.delete(capsCache.keys().next().value);
    return capsCache.get(key);
  }

  const handFor = (kit, prefer) => {
    const L = limbs(kit), ok = s => ARMS[L.arms[s].kind] && ARMS[L.arms[s].kind].hold;
    if (ok(prefer || 'r')) return prefer || 'r';
    if (ok('r')) return 'r';
    if (ok('l')) return 'l';
    return null;
  };

  const bleed = () => ({ heavy: -1, medium: 0, light: 0, lightN: 0, drip: 0, at: {} });
  const bleeding = F => !!F && !!F.bleed && (F.bleed.heavy >= 0 || F.bleed.medium > 0 || F.bleed.light > 0);
  const rate = F => {
    const b = F.bleed;
    return (b.medium > 0 ? MEDIUM.rate : 0) + (b.light > 0 ? LIGHT.rate * b.lightN : 0);
  };

  function hurt(def, r) {
    const F = def.fight;
    if (!F || def.kit.side === 'straw' || r.damage <= 0 && r.cut === null) return;
    F.bleed = F.bleed || bleed();
    if (F.binding) F.binding = null;
    const flesh = r.material === 'flesh';
    if (r.cut !== null && !(def.kit.pros || {})[K.Body.PARTS[r.cut]]) {
      if (r.cut !== 0) F.bleed.heavy = F.bleed.heavy < 0 ? (F.rules ? F.rules.heavy : HEAVY) : F.bleed.heavy;
    } else if ((r.type === 'stab' && (r.part === 1 || r.part === 2) || r.type === 'bite') && r.material !== 'plate') {
      F.bleed.medium = MEDIUM.time;
      F.bleed.at = Object.assign({}, F.bleed.at, { [r.part]: 'medium' });
    } else if (r.type === 'chop' && flesh) {
      F.bleed.light = LIGHT.time;
      F.bleed.lightN = Math.min(LIGHT.most, F.bleed.lightN + 1);
      F.bleed.at = Object.assign({}, F.bleed.at, { [r.part]: F.bleed.at && F.bleed.at[r.part] === 'medium' ? 'medium' : 'light' });
    }
  }

  function bind(who, target, bag) {
    const kit = who.kit, F = who.fight, c = caps(kit), self = target === who;
    if (!F || F.down || F.binding) return { ok: false, why: 'busy' };
    const time = self ? c.bindSelf : c.bindOther ? BIND.other : null;
    if (time === null) return { ok: false, why: 'hands' };
    const stock = bag || who.sack || [], have = stock.find(s => s.id === 'bandage' && s.n > 0);
    if (!have) return { ok: false, why: 'bandage' };
    if (!self) {
      const at = target.pts ? K.Body.anchorOf(target) : target.mv.pos;
      if (Math.hypot(at[0] - who.mv.pos[0], at[2] - who.mv.pos[2]) > BIND.reach) return { ok: false, why: 'far' };
    }
    F.binding = { t: 0, time, target, stock };
    K.Combat.guard(F, false);
    F.act = null;
    return { ok: true, time };
  }

  function tie(target) {
    const kit = target.kit, cut = Object.assign({}, kit.cut || {});
    for (const [k, v] of Object.entries(cut)) if (v === 'fresh') cut[k] = 'bandaged';
    kit.cut = cut;
    const F = target.fight;
    if (F) F.bleed = bleed();
    if (F && F.down === 'ko') F.stable = true;
    target.bleed = null;
    if (target.ko !== undefined && target.ko > 0) target.stable = true;
  }

  function knockOut(F) {
    if (F.down) return;
    F.down = F.life <= DEAD_LIFE ? 'dead' : 'ko';
    F.ko = F.rules ? F.rules.ko : KO_TIME;
    F.binding = null;
    F.act = null;
    F.guard = null;
  }

  function pool(S, x, z, r, born, y) {
    const list = S.blood || (S.blood = []);
    for (const b of list) if (Math.hypot(b.x - x, b.z - z) < Math.max(b.r, r) * 0.6 && b.r >= r) return b;
    const b = { x: Math.round(x * 100) / 100, z: Math.round(z * 100) / 100, r: Math.round(r * 100) / 100, born: Math.round(born * 100) / 100 };
    if (y !== undefined) b.y = Math.round(y * 100) / 100;
    list.push(b);
    if (list.length > POOL_CAP) list.splice(0, list.length - POOL_CAP);
    S.bloodVersion = (S.bloodVersion || 0) + 1;
    return b;
  }

  function step(S, dt) {
    const events = [], who = [];
    if (S.player && S.player.fight) who.push(S.player);
    for (const p of S.people) if (p.fight && p.kit.side !== 'straw') who.push(p);
    for (const p of who) {
      const F = p.fight;
      if (F.down === 'ko' && (F.ko > 0 || F.stable)) {
        if (F.stable) continue;
        F.ko = Math.max(0, F.ko - dt);
        if (F.ko === 0) events.push({ kind: 'unrescued', who: p });
        continue;
      }
      if (F.down) continue;
      if (F.binding) {
        const B = F.binding;
        B.t += dt;
        if (B.t >= B.time) {
          const have = B.stock.find(s => s.id === 'bandage' && s.n > 0);
          if (have) {
            have.n--;
            if (!have.n) B.stock.splice(B.stock.indexOf(have), 1);
            tie(B.target);
            events.push({ kind: 'bound', who: p, to: B.target });
          }
          F.binding = null;
        }
      }
      if (!bleeding(F)) continue;
      const b = F.bleed, fresh = caps(p.kit).fresh, slow = F.tincture > 0 ? TINCTURE.slow : 1;
      if (F.tincture > 0) F.tincture = Math.max(0, F.tincture - dt);
      F.life -= rate(F) * dt * slow;
      if (b.medium > 0) b.medium = Math.max(0, b.medium - dt);
      if (b.light > 0) { b.light = Math.max(0, b.light - dt); if (!b.light) b.lightN = 0; }
      if (!b.medium && !b.light && b.at && Object.keys(b.at).length) b.at = {};
      if (b.heavy >= 0) b.heavy = Math.max(0, b.heavy - dt * slow * (1 + 0.5 * Math.max(0, fresh - 1)));
      b.drip -= dt * (b.heavy >= 0 ? 2.5 : b.medium > 0 ? 1.2 : 0.6);
      if (b.drip <= 0) {
        b.drip = 1;
        const j = Math.sin(S.time * 91.7 + p.id * 13.1);
        events.push({ kind: 'drip', who: p, at: [p.mv.pos[0] + j * 0.15, p.mv.pos[1], p.mv.pos[2] + Math.cos(S.time * 53.3 + p.id) * 0.15], big: b.heavy >= 0 });
      }
      if (b.heavy === 0 || F.life <= 0) { knockOut(F); events.push({ kind: 'faint', who: p, cause: b.heavy === 0 ? 'blood' : 'life' }); }
      if (p !== S.player && !p.noAid && !F.hostile && !F.binding && !(p.state && p.state !== 'surrender') && F.bleed && (F.bleed.heavy >= 0 || F.bleed.medium > 0)) bind(p, p);
    }
    for (const b of S.bodies) {
      if (!(b.ko > 0) || b.stable) continue;
      b.ko = Math.max(0, b.ko - dt);
      if (b.ko === 0) { b.cause = 'dead'; events.push({ kind: 'died', body: b }); }
    }
    return events;
  }

  function drink(p, bag) {
    const s = (bag || []).find(x => x.id === 'tincture' && x.n > 0);
    if (!s || !p.fight) return false;
    s.n--;
    if (!s.n) bag.splice(bag.indexOf(s), 1);
    p.fight.tincture = TINCTURE.time;
    return true;
  }

  K.Wounds = { POOL_CAP, pool, TINCTURE, drink, HEAVY, KO_TIME, DEAD_LIFE, MEDIUM, LIGHT, BIND, CRAWL, CRUTCH, ARMS, LEGS, EYES, limbs, caps, handFor, bleed, bleeding, rate, hurt, bind, tie, knockOut, step };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
