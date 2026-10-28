(function (H) {
  'use strict';
  const HD = H.HD, TUN = HD.TUN, DT = HD.DT;
  const TAIL_ARC = Math.PI * 2 / 3, DEG = Math.PI / 180;

  const circle = (x, y, r) => ({ shape: 'circle', x, y, r });
  const threatA = A => HD.THREATS[A.threats[0]];
  const threatB = A => HD.THREATS[A.threats[1] || A.threats[0]];
  const bossThreat = key => Object.values(HD.THREATS).find(T => T.small === key || T.big === key || (key === 'cocolia2' && T.big === 'cocolia1'));

  function waveLabel(A, w) {
    const W = HD.WAVES[w - 1];
    if (!W) return threatA(A).name;
    if (W.a && W.b) return threatA(A).name + ' и ' + threatB(A).name;
    return (W.b || W.boss === 'big' ? threatB(A) : threatA(A)).name;
  }

  function packsOf(A, T, n, ranged) {
    const rng = A.rng, packs = [], far = T.ranged.length ? T.ranged : T.normals;
    while (n > 0) {
      const id = ranged && rng() < ranged ? rng.pick(far) : rng.pick(T.normals);
      const size = HD.FOES[id].pack ? Math.min(HD.FOES[id].pack, n) : 1;
      packs.push(Array(size).fill(id));
      n -= size;
    }
    return packs;
  }

  function buildWave(A) {
    const W = HD.WAVES[A.wave - 1], TA = threatA(A), TB = threatB(A), rng = A.rng;
    let packs = [];
    if (W.a) packs = packs.concat(packsOf(A, TA, W.a, W.ranged));
    if (W.b) packs = packs.concat(packsOf(A, TB, W.b, W.ranged));
    for (let i = 0; i < (W.ea || 0); i++) packs.push([rng.pick(TA.elites)]);
    for (let i = 0; i < (W.eb || 0); i++) packs.push([rng.pick(TB.elites)]);
    for (let i = packs.length - 1; i > 0; i--) { const j = rng.int(i + 1); [packs[i], packs[j]] = [packs[j], packs[i]]; }
    const groups = [], size = () => TUN.spawnGroup[0] + rng.int(TUN.spawnGroup[1] - TUN.spawnGroup[0] + 1);
    let cur = [], want = size();
    for (const p of packs) {
      cur = cur.concat(p);
      if (cur.length >= want) { groups.push(cur); cur = []; want = size(); }
    }
    if (cur.length) groups.push(cur);
    const gap = W.dur / Math.max(1, groups.length), start = rng.int(W.rifts.length), out = [];
    groups.forEach((ids, i) => out.push({ t: TUN.riftGlow + i * gap, rift: W.rifts[(start + i) % W.rifts.length], ids }));
    if (W.pig || W.bigPig) {
      const keys = ['n', 'w', 'e'], from = keys[rng.int(3)], to = keys.filter(k => k !== from)[rng.int(2)];
      out.push({ t: TUN.riftGlow + W.dur / 2, rift: from, ids: [W.bigPig ? 'trotter_big' : 'trotter'], o: { goal: to } });
    }
    if (W.boss) {
      const T = W.boss === 'big' ? TB : TA;
      out.push({ t: TUN.riftGlow + W.dur, rift: 'n', ids: [T[W.boss]], o: W.boss === 'big' ? { big: true, reinf: W.reinf || null } : {} });
    }
    return out;
  }

  function foeFx(A, u, v, fx) {
    if (!fx || !v || v.dead || v.side !== 'ally' || v.fixed) return;
    if (fx.freeze && A.rng() < A.chance(u, v, fx.freeze[0])) A.addFx(v, { n: 'Заморозка', k: 'stun', v: 1, t: fx.freeze[1], deb: true });
    if (fx.burn && A.rng() < A.chance(u, v, fx.burn[0])) A.addFx(v, { n: 'Горение', k: 'dot', v: 0, dps: fx.burn[2] * A.atkOf(u), elem: 'fire', t: fx.burn[1], src: u, deb: true });
    if (fx.slow) A.addFx(v, { n: fx.slowN || 'Замедление', k: 'slow', v: fx.slow[0], t: fx.slow[1], deb: true });
    if (fx.root && A.rng() < A.chance(u, v, fx.root[0])) A.addFx(v, { n: 'Удержание', k: 'root', v: 1, t: fx.root[1], deb: true });
    if (fx.stun && A.rng() < A.chance(u, v, 1)) A.addFx(v, { n: 'Оглушение', k: 'stun', v: 1, t: fx.stun, deb: true });
    if (fx.weak) A.addFx(v, { n: fx.weak[2], k: 'atk', v: -fx.weak[0], t: fx.weak[1], deb: true });
  }

  function strike(A, u, v, sk, mul, fx) {
    if (!v || v.dead || u.dead) return 0;
    const d = A.hit(u, v, { m: sk.m * (mul || 1), elem: sk.e || u.elem, kind: 'skill' });
    foeFx(A, u, v, fx);
    return d;
  }

  function strikeIn(A, u, shape, sk, mul, fx, skip) {
    for (const v of A.unitsIn(shape, 'ally')) if (v !== skip) strike(A, u, v, sk, mul, fx);
  }

  function warn(A, u, a, t, o = {}) {
    const area = A.addArea(Object.assign({ side: 'ally', warn: true, delay: t, src: u.uid }, a));
    u.act = { t, tt: t, cancel: true, ult: !!o.ult, name: o.name || '', areas: [area], fn() {} };
    return area;
  }

  function say(A, u, name, at) { A.emit({ t: 'skill', uid: u.uid, name, x: at ? at.x : u.x, y: at ? at.y : u.y }); }

  function resetCd(A, u) { u.skCd = TUN.foeSkillCd[0] + A.rng() * (TUN.foeSkillCd[1] - TUN.foeSkillCd[0]); }

  function foeTick(A, u) {
    const f = HD.FOES[u.key], e = H.ENEMIES[u.key];
    if (!f || u.act || A.stunned(u)) return;
    if (f.shield) {
      if (u.shT == null) u.shT = A.time + f.shield.cd * (0.3 + 0.7 * A.rng());
      if (A.time >= u.shT && u.tgt != null) {
        u.shT = A.time + f.shield.cd;
        A.addFx(u, { n: e.skills[f.shield.i].n, k: 'shield', v: u.hpMax * f.shield.v, t: f.shield.cd });
        say(A, u, e.skills[f.shield.i].n);
      }
    }
    if (f.rally) {
      if (u.raT == null) u.raT = A.time + f.rally.cd * (0.3 + 0.7 * A.rng());
      if (A.time >= u.raT && u.tgt != null) {
        u.raT = A.time + f.rally.cd;
        for (const v of A.unitsIn(circle(u.x, u.y, f.rally.r), 'foe')) { A.addFx(v, { n: 'Приказ к атаке', k: 'dmg', v: 0.2, t: f.rally.t }); A.addFx(v, { n: 'Приказ к атаке: шаг', k: 'mspd', v: 0.2, t: f.rally.t }); }
        say(A, u, e.skills[f.rally.i].n);
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: f.rally.r, elem: 'wind' });
      }
    }
  }

  function bomb(A, u, t, B, e) {
    const sk = e.skills[B.i];
    warn(A, u, Object.assign(circle(u.x, u.y, B.r), {
      onHit: (A2, v) => { if (!u.dead) strike(A2, u, v, sk); },
      onFire: A2 => { if (!u.dead) { u.dead = true; u.hp = 0; u.blown = true; A2.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: B.r, elem: 'fire' }); } }
    }), B.warn);
    say(A, u, sk.n);
  }

  function foeSkill(A, u, t) {
    const f = HD.FOES[u.key], e = H.ENEMIES[u.key];
    u.hits++;
    if (f.bomb) { bomb(A, u, t, f.bomb, e); return true; }
    if (f.nth && u.hits % f.nth === 0) {
      const sk = e.skills[f.nthSkill];
      strike(A, u, t, sk);
      say(A, u, sk.n);
      return true;
    }
    if (u.skCd > 0) return false;
    if (f.near && A.gap(u, t) <= f.near.r) {
      const sk = e.skills[f.near.i];
      strike(A, u, t, sk);
      say(A, u, sk.n, t);
      resetCd(A, u);
      return true;
    }
    const opts = [];
    if (f.lock) opts.push('lock');
    if (f.stomp && A.gap(u, t) <= f.stomp.r) opts.push('stomp');
    if (f.zone) opts.push('zone');
    if (opts.length) {
      const pick = opts[(u.skI = (u.skI || 0) + 1) % opts.length];
      if (pick === 'lock') {
        const L = f.lock, nx = e.skills[L.next], tid = t.uid;
        if (L.at === 'point') warn(A, u, Object.assign(circle(t.x, t.y, L.r), { onHit: (A2, v) => strike(A2, u, v, nx) }), L.t);
        else warn(A, u, Object.assign(circle(t.x, t.y, 22), { follow: tid, mark: true, onHit: (A2, v) => { if (v.uid !== tid) return; if (L.dash && !v.rect) A2.dash(u, v.x, v.y, L.dash, u.r + (v.r || 0)); strike(A2, u, v, nx); } }), L.t);
        say(A, u, e.skills[L.i].n);
      } else if (pick === 'stomp') {
        const st = f.stomp, sk = e.skills[st.i], fx = Object.assign({}, st.fx, st.stun ? { stun: st.stun } : {});
        warn(A, u, Object.assign(circle(u.x, u.y, st.r), { onHit: (A2, v) => { A2.hit(u, v, { m: sk.m, elem: sk.e, kind: 'skill' }); if (v.kind === 'hero') foeFx(A2, u, v, fx); } }), st.warn);
        say(A, u, sk.n);
      } else {
        const z = f.zone, sk = e.skills[z.i];
        warn(A, u, Object.assign(circle(t.x, t.y, z.r), { onHit: (A2, v) => strike(A2, u, v, sk, 1, z.fx) }), z.warn);
        say(A, u, sk.n, t);
      }
      resetCd(A, u);
      return true;
    }
    if (f.skill) {
      const sk = e.skills[f.skill.i];
      strike(A, u, t, sk, 1, f.skill.fx);
      if (f.skill.r) strikeIn(A, u, circle(t.x, t.y, f.skill.r), sk, 1, f.skill.fx, t);
      A.emit({ t: 'skill', uid: u.uid, name: sk.n, x: t.x, y: t.y, r: f.skill.r || 0 });
      resetCd(A, u);
      return true;
    }
    return false;
  }

  function summon(A, u, ids, cap) {
    const alive = A.units.filter(v => !v.dead && v.by === u.uid).length;
    let n = 0;
    for (const id of ids) {
      if (alive + n >= cap) break;
      const v = A.spawnFoe(id, u.rift, { by: u.uid });
      const a = A.rng() * Math.PI * 2;
      v.x = u.x + Math.cos(a) * (u.r + 30); v.y = u.y + Math.sin(a) * (u.r + 20);
      A.collide(v); v.px = v.x; v.py = v.y;
      n++;
    }
    return n;
  }

  function bossInit(A, u) {
    u.patI = 0; u.gapT = 3; u.phase = 1; u.pT = {};
    const T = bossThreat(u.key);
    A.emit({ t: 'boss', uid: u.uid, name: H.ENEMIES[u.key].name, music: T ? T.music : 'boss' });
  }

  function bossTick(A, u) {
    if (!u.reinf) return;
    if (u.reinfT == null) u.reinfT = u.reinf.every;
    u.reinfT -= DT;
    if (u.reinfT > 0) return;
    u.reinfT += u.reinf.every;
    const keys = ['n', 'w', 'e'], key = keys[A.rng.int(3)];
    const ids = [];
    for (let i = 0; i < u.reinf.a; i++) ids.push(A.rng.pick(threatA(A).normals));
    for (let i = 0; i < u.reinf.b; i++) ids.push(A.rng.pick(threatB(A).normals));
    A.glow[key] = TUN.riftGlow;
    A.emit({ t: 'rift', key });
    A.later(TUN.riftGlow, () => { if (!u.dead && !A.over) for (const id of ids) A.spawnFoe(id, key); });
  }

  function every(A, u, key, period) {
    if (u.pT[key] == null) u.pT[key] = A.time + period;
    if (A.time < u.pT[key]) return false;
    u.pT[key] = A.time + period;
    return true;
  }

  function runPat(A, u, moves, pat) {
    if (u.gapT > 0) { u.gapT -= DT; return false; }
    const t = u.tgt != null ? A.byId(u.tgt) : null;
    for (let k = 0; k < pat.length; k++) {
      const m = moves[pat[(u.patI + k) % pat.length]];
      if (m && m(A, u, t)) {
        u.patI += k + 1;
        u.gapT = TUN.bossGap[0] + A.rng() * (TUN.bossGap[1] - TUN.bossGap[0]);
        return true;
      }
    }
    return false;
  }

  function markTarget(A, u, t, far) {
    const h = A.hero;
    if (far && (!h || h.dead || A.gap(u, h) > far)) return A.base;
    return t || (h && !h.dead ? h : A.base);
  }

  function lineAt(u, ang, len, w) { return { shape: 'line', x: u.x, y: u.y, ang, len, w }; }

  const sk = (u, i) => H.ENEMIES[u.key].skills[i];
  const near = (A, u, t, r) => t && A.gap(u, t) <= r;

  function doomUlt(A, u) {
    const e = H.ENEMIES.doomsday, big = circle(u.x, u.y, 320);
    if (!A.units.some(v => !v.dead && v.side === 'ally' && A.inShape(big, v))) return false;
    warn(A, u, Object.assign(big, { big: true, onHit: (A2, v) => A2.hit(u, v, { m: e.skills[3].m, elem: e.skills[3].e, kind: 'skill' }) }), 4, { ult: true, name: e.skills[2].n });
    A.emit({ t: 'warn', uid: u.uid, text: e.skills[2].text, x: u.x, y: u.y });
    A.emit({ t: 'sfx', id: 'rumble' });
    return true;
  }

  const DOOM = {
    init(A, u) { bossInit(A, u); u.calls = [0.75, 0.5, 0.25]; },
    think(A, u) {
      bossTick(A, u);
      if (u.big && !u.awake && u.hp <= u.hpMax * 0.5) {
        u.awake = true; u.phase = 2; u.doomT = A.time + 25;
        A.addFx(u, { n: 'Пробуждение', k: 'mspd', v: 0.2, t: Infinity });
        A.emit({ t: 'warn', uid: u.uid, text: 'Пробуждение! Зверь Судного дня в ярости!', x: u.x, y: u.y });
      }
      while (u.calls.length && u.hp / u.hpMax <= u.calls[0]) {
        u.calls.shift();
        const ids = ['reaver', 'eliminator', 'reaver'].concat(u.awake ? ['trampler'] : []);
        for (const id of ids) A.spawnFoe(id, u.rift);
        say(A, u, 'Зов Легиона');
      }
      if (u.awake && A.time >= u.doomT && !u.act && !A.stunned(u) && doomUlt(A, u)) u.doomT = A.time + 25;
    },
    act(A, u) {
      if (u.gapT > 0) { u.gapT -= DT; return false; }
      const e = H.ENEMIES.doomsday, pat = e.pat;
      let s = pat[u.patI % pat.length];
      if (s === 1) { u.patI++; s = pat[u.patI % pat.length]; }
      const t = u.tgt != null ? A.byId(u.tgt) : null;
      if (s === 0) {
        if (!t || A.gap(u, t) > 140) return false;
        const k = e.skills[0], ang = Math.atan2(t.y - u.y, t.x - u.x);
        warn(A, u, { shape: 'cone', x: u.x, y: u.y, r: 140, ang, arc: TAIL_ARC, onHit: (A2, v) => { A2.hit(u, v, { m: k.m, elem: k.e, kind: 'skill' }); A2.push(v, u.x, u.y, 80); } }, 0.8);
        say(A, u, k.n);
      } else if (s === 4) {
        if (!t || A.gap(u, t) > 240) return false;
        const k = e.skills[4];
        if (!t.rect) A.dash(u, t.x, t.y, 240, u.r + t.r);
        warn(A, u, Object.assign(circle(u.x, u.y, 80), { onHit: (A2, v) => { A2.hit(u, v, { m: k.m, elem: k.e, kind: 'skill' }); A2.heal(null, u, u.hpMax * 0.02); } }), 0.35);
        say(A, u, k.n);
      } else if (u.awake || !doomUlt(A, u)) {
        if (!u.awake) return false;
        u.patI++;
        return false;
      }
      u.patI++;
      u.gapT = TUN.bossGap[0] + A.rng() * (TUN.bossGap[1] - TUN.bossGap[0]);
      return true;
    }
  };

  const SILVER = ['soldier', 'gunner', 'cannoneer', 'lieutenant'];

  const BRONYA = {
    init: bossInit,
    think(A, u) {
      bossTick(A, u);
      if (!u.act && every(A, u, 'rally', 15)) {
        for (const v of A.unitsIn(circle(u.x, u.y, 300), 'foe')) if (SILVER.includes(v.key)) { A.addFx(v, { n: 'Боевое перестроение', k: 'dmg', v: 0.2, t: 6 }); A.addFx(v, { n: 'Боевое перестроение: шаг', k: 'mspd', v: 0.2, t: 6 }); }
        say(A, u, sk(u, 1).n);
        A.emit({ t: 'fx', kind: 'ring', x: u.x, y: u.y, r: 300, elem: 'wind' });
      }
    },
    moves: {
      bullet(A, u, t) {
        if (!near(A, u, t, 420)) return false;
        const k = sk(u, 0), ang = Math.atan2(t.y - u.y, t.x - u.x);
        warn(A, u, Object.assign(lineAt(u, ang, 440, 26), {
          onFire: (A2, a) => {
            const c = Math.cos(a.ang), s = Math.sin(a.ang);
            const first = A2.unitsIn(a, 'ally').sort((p, q) => ((p.x - a.x) * c + (p.y - a.y) * s) - ((q.x - a.x) * c + (q.y - a.y) * s))[0];
            if (first) strike(A2, u, first, k);
          }
        }), 1);
        say(A, u, k.n);
        return true;
      },
      call(A, u) {
        if (!summon(A, u, ['soldier', 'gunner'], 4)) return false;
        say(A, u, sk(u, 2).n);
        return true;
      },
      ult(A, u, t) {
        if (!near(A, u, t, 340)) return false;
        const k = sk(u, 3), ang = Math.atan2(t.y - u.y, t.x - u.x), cone = { shape: 'cone', x: u.x, y: u.y, r: 340, ang, arc: 60 * DEG };
        warn(A, u, Object.assign({}, cone, {
          big: true,
          onFire: A2 => {
            if (u.dead) return;
            u.act = { t: 2, tt: 2, cancel: false, name: k.n, areas: [], fn() {} };
            A2.addArea(Object.assign({}, cone, { side: 'ally', t: 2, every: 0.25, elem: 'wind', onTick: (A3, ar) => { for (const v of A3.unitsIn(ar, 'ally')) strike(A3, u, v, k, 1 / 8, { slow: [0.2, 6], slowN: 'Подавление' }); } }));
          }
        }), 3, { ult: true, name: k.n });
        A.emit({ t: 'warn', uid: u.uid, text: 'Броня готовит огонь на подавление!', x: u.x, y: u.y });
        return true;
      }
    },
    pat: ['bullet', 'call', 'ult', 'bullet', 'ult', 'call'],
    act(A, u) { return runPat(A, u, BRONYA.moves, BRONYA.pat); }
  };

  const GEPARD = {
    init: bossInit,
    think(A, u) {
      bossTick(A, u);
      if (u.phase === 1 && u.hp <= u.hpMax * 0.5) {
        u.phase = 2; u.pT.guard = A.time;
        summon(A, u, ['soldier', 'soldier', 'lieutenant'], 6);
        A.emit({ t: 'warn', uid: u.uid, text: 'Гепард зовёт гарнизон!', x: u.x, y: u.y });
      }
      if (every(A, u, 'guard', u.phase === 2 ? 12 : 20)) {
        A.addFx(u, { n: sk(u, 2).n, k: 'shield', v: u.hpMax * 0.18, t: 9, guard: true });
        A.emit({ t: 'warn', uid: u.uid, text: sk(u, 2).text, x: u.x, y: u.y });
      }
    },
    moves: {
      fist(A, u, t) {
        if (!near(A, u, t, u.range + 24)) return false;
        strike(A, u, t, sk(u, 0), 1, { freeze: [0.25, 1.5] });
        A.emit({ t: 'swing', uid: u.uid, x: t.x, y: t.y, elem: 'ice' });
        say(A, u, sk(u, 0).n, t);
        return true;
      },
      wall(A, u, t) {
        if (!near(A, u, t, 300)) return false;
        const k = sk(u, 1);
        warn(A, u, Object.assign(lineAt(u, Math.atan2(t.y - u.y, t.x - u.x), 300, 80), { onHit: (A2, v) => strike(A2, u, v, k, 1, { slow: [0.3, 3] }) }), 0.8);
        say(A, u, k.n);
        return true;
      },
      ult(A, u, t) {
        const v = markTarget(A, u, t, 600), k = sk(u, 4);
        warn(A, u, Object.assign(circle(v.x, v.y, 96), {
          follow: v.uid, mark: true, big: true,
          onFire: (A2, a) => { if (u.dead) return; A2.dash(u, a.x, a.y, 2000, 30); strikeIn(A2, u, circle(a.x, a.y, 96), k); A2.emit({ t: 'fx', kind: 'ring', x: a.x, y: a.y, r: 96, elem: 'ice' }); }
        }), 3, { ult: true, name: sk(u, 3).n });
        A.emit({ t: 'warn', uid: u.uid, text: sk(u, 3).text, x: u.x, y: u.y });
        return true;
      }
    },
    pat: ['fist', 'wall', 'fist', 'ult', 'wall', 'fist'],
    act(A, u) { return runPat(A, u, GEPARD.moves, GEPARD.pat); }
  };

  const GRIZZLY = {
    init: bossInit,
    think(A, u) {
      bossTick(A, u);
      if (!u.act && every(A, u, 'swarm', 20) && summon(A, u, ['beetle', 'beetle', 'spider'], 6)) say(A, u, sk(u, 1).n);
    },
    moves: {
      paw(A, u, t) {
        if (!near(A, u, t, u.range + 24)) return false;
        strike(A, u, t, sk(u, 0));
        A.emit({ t: 'swing', uid: u.uid, x: t.x, y: t.y });
        say(A, u, sk(u, 0).n, t);
        return true;
      },
      grab(A, u, t) {
        if (!near(A, u, t, 360)) return false;
        const k = sk(u, 3), tid = t.uid;
        warn(A, u, Object.assign(circle(t.x, t.y, 30), {
          follow: tid, mark: true,
          onFire: (A2, a) => { const v = A2.byId(tid); if (v) strike(A2, u, v, k); strikeIn(A2, u, circle(a.x, a.y, 96), k, 0.2, null, v); }
        }), 2, { name: sk(u, 2).n });
        A.emit({ t: 'warn', uid: u.uid, text: sk(u, 2).text, x: u.x, y: u.y });
        return true;
      },
      ult(A, u) {
        const big = circle(u.x, u.y, 260);
        if (!A.units.some(v => !v.dead && v.side === 'ally' && A.inShape(big, v))) return false;
        warn(A, u, Object.assign(big, { big: true, onHit: (A2, v) => strike(A2, u, v, sk(u, 4), 1, v.kind === 'hero' ? { stun: 1 } : null) }), 2, { ult: true, name: sk(u, 4).n });
        A.emit({ t: 'warn', uid: u.uid, text: 'Гризли бьёт землю! Отойдите!', x: u.x, y: u.y });
        return true;
      }
    },
    pat: ['paw', 'grab', 'ult', 'paw', 'grab', 'paw', 'ult'],
    act(A, u) { return runPat(A, u, GRIZZLY.moves, GRIZZLY.pat); }
  };

  const SVAROG = {
    init: bossInit,
    think(A, u) {
      bossTick(A, u);
      if (u.phase === 1 && u.hp <= u.hpMax * 0.5) {
        u.phase = 2;
        summon(A, u, ['svarog_hand', 'svarog_hand', 'svarog_hand', 'svarog_hand'], 10);
        A.emit({ t: 'warn', uid: u.uid, text: 'Сварог выпускает манипуляторы!', x: u.x, y: u.y });
      }
    },
    moves: {
      guard(A, u) {
        if (!summon(A, u, ['hound', 'hound', 'beetle'], 6)) return false;
        say(A, u, sk(u, 1).n);
        return true;
      },
      aim(A, u, t) {
        if (!near(A, u, t, 420)) return false;
        const k = sk(u, 3), tid = t.uid;
        warn(A, u, Object.assign(circle(t.x, t.y, 30), {
          follow: tid, mark: true,
          onFire: (A2, a) => { const v = A2.byId(tid); if (v) strike(A2, u, v, k); strikeIn(A2, u, circle(a.x, a.y, 96), k, 0.5 / 2.8, null, v); A2.emit({ t: 'fx', kind: 'ring', x: a.x, y: a.y, r: 96, elem: 'elec' }); }
        }), 2, { name: sk(u, 2).n });
        A.emit({ t: 'warn', uid: u.uid, text: sk(u, 2).text, x: u.x, y: u.y });
        return true;
      },
      ult(A, u) {
        const big = circle(u.x, u.y, 300);
        if (!A.units.some(v => !v.dead && v.side === 'ally' && A.inShape(big, v))) return false;
        const k = sk(u, 4);
        warn(A, u, Object.assign(big, {
          big: true,
          onFire: A2 => {
            if (u.dead) return;
            u.act = { t: 3, tt: 3, cancel: false, name: k.n, areas: [], fn() {} };
            for (let i = 0; i < 12; i++) {
              const a = A2.rng() * Math.PI * 2, r = Math.sqrt(A2.rng()) * 300;
              A2.addArea(Object.assign(circle(u.x + Math.cos(a) * r, u.y + Math.sin(a) * r, 64), { side: 'ally', warn: true, delay: 0.4 + i * 0.22, src: u.uid, onHit: (A3, v) => strike(A3, u, v, k) }));
            }
          }
        }), 2, { ult: true, name: k.n });
        A.emit({ t: 'warn', uid: u.uid, text: 'Протокол подавления! Уходите из круга!', x: u.x, y: u.y });
        return true;
      }
    },
    pat: ['guard', 'aim', 'ult', 'aim', 'guard', 'ult'],
    act(A, u) { return runPat(A, u, SVAROG.moves, SVAROG.pat); }
  };

  function blades(A, u, t, k, m, fx) {
    const base = Math.atan2(t.y - u.y, t.x - u.x);
    const areas = [-15, 0, 15].map(da => A.addArea(Object.assign(lineAt(u, base + da * DEG, 320, 22), { side: 'ally', warn: true, delay: 0.6, src: u.uid, onHit: (A2, v) => strike(A2, u, v, k, m, fx) })));
    u.act = { t: 0.6, tt: 0.6, cancel: true, ult: false, name: k.n, areas, fn() {} };
  }

  function blizzard(A, u, t, k, total) {
    const x = t.x, y = t.y;
    warn(A, u, Object.assign(circle(x, y, 160), {
      onFire: A2 => A2.addArea(Object.assign(circle(x, y, 160), { side: 'ally', t: 4, every: 0.5, elem: 'ice', onTick: (A3, ar) => { for (const v of A3.unitsIn(ar, 'ally')) strike(A3, u, v, k, total / 8, { slow: [0.2, 0.6], slowN: 'Вьюга' }); } }))
    }), 0.8);
  }

  const ECHO = {
    init: bossInit,
    think(A, u) {
      bossTick(A, u);
      for (const h of A.heroes) if (!h.dead && Math.hypot(h.x - u.x, h.y - u.y) <= 200) A.addFx(h, { n: 'Холод эха', k: 'slow', v: 0.1, t: 0.5, deb: true });
    },
    moves: {
      blade(A, u, t) {
        if (!near(A, u, t, 320)) return false;
        blades(A, u, t, sk(u, 0), 1, { freeze: [0.25, 1] });
        say(A, u, sk(u, 0).n);
        return true;
      },
      storm(A, u, t) {
        if (!near(A, u, t, 420)) return false;
        blizzard(A, u, t, sk(u, 1), 1);
        say(A, u, sk(u, 1).n, t);
        return true;
      },
      ult(A, u, t) {
        const v = markTarget(A, u, t), k = sk(u, 2);
        warn(A, u, Object.assign(circle(v.x, v.y, 120), { follow: v.uid, mark: true, big: true, onHit: (A2, w) => strike(A2, u, w, k, 2.2 / k.m) }), 2, { ult: true, name: k.n });
        A.emit({ t: 'warn', uid: u.uid, text: 'Холодный приговор! Пробейте Эхо!', x: u.x, y: u.y });
        return true;
      }
    },
    pat: ['blade', 'storm', 'blade', 'ult'],
    act(A, u) { return runPat(A, u, ECHO.moves, ECHO.pat); }
  };

  function cocoliaShift(A, u) {
    const e2 = H.ENEMIES.cocolia2, s2 = HD.foeStats('cocolia2', u.lvl, A.diff);
    u.phase = 2; u.key = 'cocolia2';
    u.toughMax = u.tough = s2.tough; u.brokenT = 0; u.spd = s2.spd; u.weak = e2.weak; u.resist = e2.resist;
    u.invuln = true; u.act = { t: 2, tt: 2, cancel: false, name: 'Мать обмана', areas: [], fn() {} };
    for (const v of A.units) if (!v.dead && v.by === u.uid && v.key === 'iceedge') {
      strikeIn(A, v, circle(v.x, v.y, 64), { m: 0.6, e: 'ice' });
      v.dead = true; v.hp = 0; v.blown = true;
      A.emit({ t: 'fx', kind: 'ring', x: v.x, y: v.y, r: 64, elem: 'ice' });
    }
    A.later(2, () => { u.invuln = false; });
    A.emit({ t: 'warn', uid: u.uid, text: 'Коколия, Мать обмана! Лезвия взрываются!', x: u.x, y: u.y });
  }

  const COCOLIA = {
    init: bossInit,
    think(A, u) {
      bossTick(A, u);
      if (u.phase === 1 && u.hp <= u.hpMax * 0.5 && !u.act) { cocoliaShift(A, u); return; }
      if (!u.act && every(A, u, 'edge', u.phase === 2 ? 15 : 20) && summon(A, u, ['iceedge', 'iceedge'], 4)) say(A, u, 'Призыв Ледяного лезвия');
    },
    moves: {
      blade(A, u, t) {
        if (!near(A, u, t, u.range + 40)) return false;
        const p2 = u.phase === 2, k = sk(u, 0);
        A.shoot(u, t, { m: k.m, elem: 'ice', kind: 'skill', after: (A2, v) => foeFx(A2, u, v, { freeze: [p2 ? 0.35 : 0.3, 1] }) });
        say(A, u, k.n, t);
        return true;
      },
      zone(A, u, t) {
        if (u.phase === 1) {
          if (!near(A, u, t, 420)) return false;
          blizzard(A, u, t, sk(u, 1), 1);
          say(A, u, sk(u, 1).n, t);
          return true;
        }
        const k = sk(u, 4), ring = circle(u.x, u.y, 220);
        if (!A.units.some(v => !v.dead && v.side === 'ally' && A.inShape(ring, v))) return false;
        warn(A, u, Object.assign(ring, { onHit: (A2, v) => strike(A2, u, v, k, 1, { weak: [0.2, 6, 'Шёпот Стелларона'] }) }), 1);
        say(A, u, k.n);
        return true;
      },
      ult(A, u, t) {
        if (u.phase === 1) {
          const v = markTarget(A, u, t), k = sk(u, 3);
          warn(A, u, Object.assign(circle(v.x, v.y, 120), { follow: v.uid, mark: true, big: true, onHit: (A2, w) => strike(A2, u, w, k) }), 2, { ult: true, name: k.n });
          A.emit({ t: 'warn', uid: u.uid, text: 'Холодный приговор! Пробейте Коколию!', x: u.x, y: u.y });
          return true;
        }
        const v = markTarget(A, u, t, 600), k = sk(u, 2), tid = v.uid;
        warn(A, u, Object.assign(circle(v.x, v.y, 260), { follow: tid, mark: true, big: true, onHit: (A2, w) => strike(A2, u, w, k, w.uid === tid ? k.lockBonus : 1) }), 3, { ult: true, name: sk(u, 1).n });
        A.emit({ t: 'warn', uid: u.uid, text: sk(u, 1).text, x: u.x, y: u.y });
        return true;
      }
    },
    pat: ['blade', 'zone', 'blade', 'ult'],
    act(A, u) { return runPat(A, u, COCOLIA.moves, COCOLIA.pat); }
  };

  const BIG_PIG = {
    init(A, u) {
      u.hpMax = u.hp = Math.round(u.hpMax * TUN.bigPigHp);
      u.drops = 0; u.life = TUN.bigPigLife;
      A.emit({ t: 'warn', uid: u.uid, text: 'Большая свинка-копилка! Догоните её!', x: u.x, y: u.y });
    },
    think(A, u) {
      const k = Math.min(9, Math.floor((1 - u.hp / u.hpMax) * 10));
      while (u.drops < k) { u.drops++; A.giveGold(A.hero, Math.round(TUN.bigPigStep * A.diff.gold), null, u); }
      u.life -= DT;
      if (u.life <= 0) { u.dead = true; u.escaped = true; A.emit({ t: 'msg', text: 'Большая свинка-копилка убежала', x: u.x, y: u.y - 30 }); }
    }
  };

  Object.assign(HD.FOE_AI, { doomsday: DOOM, bronya_b: BRONYA, gepard_b: GEPARD, grizzly: GRIZZLY, svarog_b: SVAROG, cocolia_echo: ECHO, cocolia1: COCOLIA, cocolia2: COCOLIA, trotter_big: BIG_PIG });
  Object.assign(HD, { buildWave, foeSkill, foeTick, foeFx, waveLabel });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
