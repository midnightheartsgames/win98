(function (O) {
  'use strict';
  const MULT = [0, 1, 1.5, 2, 2, 2, 2];

  function onPoint(pt, h) {
    if (!h.alive || h.st.phase > 0 || (h.k && h.k.recalling)) return false;
    const dx = h.pos.x - pt.x, dz = h.pos.z - pt.z;
    return dx * dx + dz * dz <= pt.r * pt.r && h.pos.y > pt.y - 1.2 && h.pos.y < pt.y + pt.h;
  }

  function announce(g, keys, extra) { g.ev('announce', Object.assign({ keys }, extra || {})); }

  function perTeam(g, attKey, defKey) {
    const k = [null, null];
    k[g.attTeam] = attKey; k[1 - g.attTeam] = defKey;
    return k;
  }

  function payloadPos(path, s) {
    const pts = path.pts;
    if (s <= 0) return { x: pts[0].x, y: pts[0].y, z: pts[0].z, yaw: Math.atan2(pts[1].x - pts[0].x, pts[1].z - pts[0].z) };
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].s >= s || i === pts.length - 1) {
        const a = pts[i - 1], b = pts[i];
        const f = Math.max(0, Math.min(1, (s - a.s) / Math.max(1e-6, b.s - a.s)));
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f, yaw: Math.atan2(b.x - a.x, b.z - a.z) };
      }
    }
    const l = pts[pts.length - 1];
    return { x: l.x, y: l.y, z: l.z, yaw: 0 };
  }
  O.payloadPos = payloadPos;

  function timeTick(g, o, dt, touching) {
    if (o.time > 0) { o.time -= dt; if (o.time > 0) return false; o.time = 0; }
    if (touching) {
      if (!o.overtime) { o.overtime = true; g.phase = 'overtime'; announce(g, ['overtime', 'overtime']); }
      o.otFuse = 3;
      return false;
    }
    if (o.overtime) {
      o.otFuse -= dt;
      if (o.otFuse > 0) return false;
    }
    g.finish(1 - g.attTeam);
    return true;
  }

  function capturePoint(g, o, pt, dt, rateBase) {
    let attN = 0, defN = 0;
    for (const h of g.heroes) {
      if (!onPoint(pt, h)) continue;
      if (h.team === g.attTeam) attN++; else defN++;
      h.stats.objTime += dt;
    }
    o.attN = attN; o.defN = defN;
    o.contested = attN > 0 && defN > 0;
    if (attN > 0 && defN === 0) {
      o.prog = Math.min(1, o.prog + rateBase * MULT[Math.min(6, attN)] * dt);
      o.decayT = 0;
      if (g.t - (o.capSaid || -99) > 12) { o.capSaid = g.t; announce(g, perTeam(g, 'capturing', 'losing')); }
    } else if (attN === 0) {
      o.decayT = (o.decayT || 0) + dt;
      if (o.decayT > 3) o.prog = Math.max(o.ticks, o.prog - 0.012 * dt);
    }
    const tk = Math.floor(o.prog * 3 + 1e-6) / 3;
    if (tk > o.ticks && o.prog < 1) o.ticks = tk;
    return attN > 0;
  }

  const assault = {
    init(g) {
      const m = g.map;
      g.obj = { type: 'assault', pts: [m.points.A, m.points.B], idx: 0, prog: 0, ticks: 0, time: g.opts.time || 240, overtime: false, otFuse: 0, attN: 0, defN: 0, contested: false };
      g.stage = 0;
    },
    begin(g) { announce(g, perTeam(g, 'attA', 'defA')); },
    tick(g, dt) {
      runLater(g);
      const o = g.obj;
      const pt = o.pts[o.idx];
      const touching = capturePoint(g, o, pt, dt, o.idx === 0 ? 1 / 11 : 1 / 17);
      if (o.prog >= 1) {
        if (o.idx === 0) {
          announce(g, perTeam(g, 'capOurs', 'capTheirs'), { point: 'A' });
          o.idx = 1; o.prog = 0; o.ticks = 0; o.decayT = 0;
          o.time = Math.max(o.time, 0) + (g.opts.bonus || 180);
          o.overtime = false; g.phase = 'play';
          g.stage = 1; g.applyStage();
          g.ev('stage', { stage: 1 });
          later(g, () => announce(g, perTeam(g, 'attB', 'defB')));
        } else {
          announce(g, perTeam(g, 'capOurs', 'capTheirs'), { point: 'B' });
          g.finish(g.attTeam);
        }
        return;
      }
      timeTick(g, o, dt, touching);
    },
    target(g) { const o = g.obj; return o.pts[o.idx]; },
    nearObjective(g, pos) {
      if (!g.obj) return false;
      const pt = assault.target(g);
      return Math.hypot(pos.x - pt.x, pos.z - pt.z) < pt.r + 10;
    },
    progress(g) { return (g.obj.idx + g.obj.prog) / 2; },
    hud(g) {
      const o = g.obj;
      return { kind: 'points', time: o.time, overtime: o.overtime, otFuse: o.otFuse, pts: o.pts.map((p, i) => ({ name: i ? 'B' : 'A', prog: i < o.idx ? 1 : i === o.idx ? o.prog : 0, locked: i > o.idx, done: i < o.idx, ticks: i === o.idx ? o.ticks : 0 })), cur: o.idx, contested: o.contested, attN: o.attN, defN: o.defN };
    }
  };

  function later(g, fn) { (g.later || (g.later = [])).push({ t: g.t + 2.5, fn }); }

  function runLater(g) {
    if (!g.later || !g.later.length) return;
    const now = g.later.filter(l => l.t <= g.t);
    if (!now.length) return;
    g.later = g.later.filter(l => l.t > g.t);
    for (const l of now) l.fn();
  }

  function escortTick(g, o, dt) {
    const path = g.map.payload;
    const pp = payloadPos(path, o.s);
    o.pos = pp;
    let attN = 0, defN = 0;
    for (const h of g.heroes) {
      if (!h.alive || h.st.phase > 0) continue;
      const d = Math.hypot(h.pos.x - pp.x, h.pos.z - pp.z);
      if (d > 4.5 || Math.abs(h.pos.y - pp.y) > 3) continue;
      if (h.team === g.attTeam) { attN++; h.stats.objTime += dt; } else defN++;
    }
    o.attN = attN; o.defN = defN; o.contested = attN > 0 && defN > 0;
    const lastCp = o.cp > 0 ? path.cpDist[o.cp - 1] : o.base;
    if (attN > 0 && defN === 0) {
      o.speed = [0, 1.4, 1.75, 2.05][Math.min(3, attN)];
      o.s = Math.min(path.len, o.s + o.speed * dt);
      o.idle = 0; o.moving = 1;
      if (g.t - (o.pushSaid || -99) > 20) { o.pushSaid = g.t; announce(g, perTeam(g, 'pushOurs', 'pushTheirs')); }
    } else if (attN === 0) {
      o.idle += dt;
      o.moving = 0;
      if (o.idle > 10 && o.s > lastCp) { o.s = Math.max(lastCp, o.s - 0.35 * dt); o.moving = -1; }
    } else o.moving = 0;
    const np = payloadPos(path, o.s);
    o.pos = np;
    g.dyn.length = 0;
    g.dyn.push({ x: np.x, z: np.z, r: 1.3, y0: np.y, y1: np.y + 1.7, top: true });
    if (o.cp < path.cpDist.length && o.s >= path.cpDist[o.cp] - 0.01) {
      o.cp++;
      const final = o.s >= path.len - 0.01;
      if (final) { announce(g, perTeam(g, 'capOurs', 'capTheirs')); g.finish(g.attTeam); return false; }
      announce(g, perTeam(g, 'cpOurs', 'cpTheirs'));
      o.time = Math.max(0, o.time) + (o.cp === 1 ? (g.opts.bonus || 165) : 135);
      o.overtime = false; g.phase = 'play';
      g.stage = o.stageBase + o.cp; g.applyStage();
      g.ev('stage', { stage: g.stage });
    }
    if (o.s >= path.len - 0.01) { announce(g, perTeam(g, 'capOurs', 'capTheirs')); g.finish(g.attTeam); return false; }
    return attN > 0;
  }

  const escort = {
    init(g) {
      g.obj = { type: 'escort', s: g.map.payload.start || 0, base: 0, cp: 0, stageBase: 0, idle: 0, time: g.opts.time || 270, overtime: false, otFuse: 0, attN: 0, defN: 0, moving: 0 };
      g.obj.pos = payloadPos(g.map.payload, g.obj.s);
      g.stage = 0;
      g.dyn.push({ x: g.obj.pos.x, z: g.obj.pos.z, r: 1.3, y0: g.obj.pos.y, y1: g.obj.pos.y + 1.7, top: true });
    },
    begin(g) { announce(g, perTeam(g, 'payloadAtt', 'payloadDef')); },
    tick(g, dt) {
      runLater(g);
      const o = g.obj;
      const touching = escortTick(g, o, dt);
      if (g.phase === 'end') return;
      timeTick(g, o, dt, touching);
    },
    idle(g) { const o = g.obj; o.pos = payloadPos(g.map.payload, o.s); },
    target(g) { const p = g.obj.pos; return { x: p.x, y: p.y, z: p.z, r: 4.5, payload: true }; },
    nearObjective(g, pos) { if (!g.obj) return false; const p = g.obj.pos; return Math.hypot(pos.x - p.x, pos.z - p.z) < 14; },
    progress(g) { return g.obj.s / g.map.payload.len; },
    hud(g) {
      const o = g.obj, path = g.map.payload;
      return { kind: 'payload', time: o.time, overtime: o.overtime, otFuse: o.otFuse, frac: o.s / path.len, cps: path.cpDist.map(d => d / path.len), cp: o.cp, contested: o.contested, attN: o.attN, defN: o.defN, moving: o.moving };
    }
  };

  const hybrid = {
    init(g) {
      g.obj = { type: 'hybrid', sub: 'point', pts: [g.map.points.A], idx: 0, prog: 0, ticks: 0, s: g.map.payload.start || 0, base: g.map.payload.start || 0, cp: 0, stageBase: 1, idle: 0, time: g.opts.time || 240, overtime: false, otFuse: 0, attN: 0, defN: 0, moving: 0 };
      g.obj.pos = payloadPos(g.map.payload, g.obj.s);
      g.dyn.push({ x: g.obj.pos.x, z: g.obj.pos.z, r: 1.3, y0: g.obj.pos.y, y1: g.obj.pos.y + 1.7, top: true });
      g.stage = 0;
    },
    begin(g) { announce(g, perTeam(g, 'attA', 'defA')); },
    tick(g, dt) {
      runLater(g);
      const o = g.obj;
      if (o.sub === 'point') {
        const touching = capturePoint(g, o, o.pts[0], dt, 1 / 10);
        if (o.prog >= 1) {
          announce(g, perTeam(g, 'capOurs', 'capTheirs'), { point: 'A' });
          o.sub = 'payload'; o.idle = 0;
          o.time = Math.max(o.time, 0) + (g.opts.bonus || 180);
          o.overtime = false; g.phase = 'play';
          g.stage = 1; g.applyStage();
          g.ev('stage', { stage: 1 });
          later(g, () => announce(g, perTeam(g, 'payloadAtt', 'payloadDef')));
          return;
        }
        timeTick(g, o, dt, touching);
        return;
      }
      const touching = escortTick(g, o, dt);
      if (g.phase === 'end') return;
      timeTick(g, o, dt, touching);
    },
    idle(g) { const o = g.obj; o.pos = payloadPos(g.map.payload, o.s); },
    target(g) {
      const o = g.obj;
      if (o.sub === 'point') return o.pts[0];
      const p = o.pos;
      return { x: p.x, y: p.y, z: p.z, r: 4.5, payload: true };
    },
    nearObjective(g, pos) { if (!g.obj) return false; const t = hybrid.target(g); return Math.hypot(pos.x - t.x, pos.z - t.z) < (t.payload ? 14 : t.r + 10); },
    progress(g) { const o = g.obj; return o.sub === 'point' ? o.prog * 0.33 : 0.33 + 0.67 * (o.s - o.base) / Math.max(1, g.map.payload.len - o.base); },
    hud(g) {
      const o = g.obj, path = g.map.payload;
      if (o.sub === 'point') return { kind: 'points', time: o.time, overtime: o.overtime, otFuse: o.otFuse, pts: [{ name: 'A', prog: o.prog, locked: false, done: false, ticks: o.ticks }], cur: 0, contested: o.contested, attN: o.attN, defN: o.defN, hybrid: true };
      return { kind: 'payload', time: o.time, overtime: o.overtime, otFuse: o.otFuse, frac: (o.s - o.base) / Math.max(1, path.len - o.base), cps: path.cpDist.map(d => (d - o.base) / Math.max(1, path.len - o.base)), cp: o.cp, contested: o.contested, attN: o.attN, defN: o.defN, moving: o.moving, hybrid: true };
    }
  };

  const control = {
    init(g) {
      g.obj = { type: 'control', round: 0, wins: [0, 0], pct: [0, 0], owner: -1, cap: 0, capTeam: -1, lockT: 30, n: [0, 0], contested: false, overtime: false, otFuse: 0, unlocked: false, stages: [g.subStage] };
      g.obj.pt = g.map.points.A;
    },
    begin(g) {
      const o = g.obj;
      o.lockT = g.opts.lock === undefined ? 30 : g.opts.lock;
      o.unlocked = o.lockT <= 0;
    },
    tick(g, dt) {
      const o = g.obj, pt = o.pt;
      if (!o.unlocked) {
        o.lockT -= dt;
        if (o.lockT <= 0) { o.unlocked = true; announce(g, ['unlocked', 'unlocked']); }
        return;
      }
      const n = [0, 0];
      for (const h of g.heroes) { if (onPoint(pt, h)) { n[h.team]++; h.stats.objTime += dt; } }
      o.n = n;
      o.contested = n[0] > 0 && n[1] > 0;
      if (!o.contested) {
        const X = n[0] > 0 ? 0 : n[1] > 0 ? 1 : -1;
        if (X >= 0 && X !== o.owner) {
          const rate = (o.owner === -1 ? 1 / 9 : 1 / 11) * MULT[Math.min(6, n[X])];
          if (o.capTeam !== X && o.cap > 0) { o.cap -= rate * dt; if (o.cap <= 0) { o.cap = 0; o.capTeam = X; } }
          else {
            o.capTeam = X;
            o.cap += rate * dt;
            if (g.t - (o.capSaid || -99) > 10) { o.capSaid = g.t; const k = [null, null]; k[X] = 'capturing'; k[1 - X] = 'losing'; announce(g, k); }
            if (o.cap >= 1) {
              o.owner = X; o.cap = 0; o.capTeam = -1;
              const k = [null, null]; k[X] = 'ctrlOurs'; k[1 - X] = 'ctrlTheirs'; announce(g, k);
            }
          }
        } else if (X === -1 && o.cap > 0) {
          o.cap = Math.max(0, o.cap - 0.06 * dt);
          if (o.cap === 0) o.capTeam = -1;
        }
      }
      if (o.owner >= 0) {
        const own = o.owner, enemy = n[1 - own];
        const next = o.pct[own] + dt;
        if (next >= 99 && enemy > 0) {
          o.pct[own] = 99;
          if (!o.overtime) { o.overtime = true; g.phase = 'overtime'; announce(g, ['overtime', 'overtime']); }
          o.otFuse = 3;
        } else if (next >= 99 && o.overtime && o.otFuse > 0) {
          o.otFuse -= dt;
          o.pct[own] = 99;
        } else {
          o.pct[own] = Math.min(100, next);
        }
        if (o.pct[own] >= 100) control.winRound(g, own);
      }
    },
    winRound(g, X) {
      const o = g.obj;
      o.wins[X]++;
      o.overtime = false;
      const k = [null, null]; k[X] = 'roundWon'; k[1 - X] = 'roundLost';
      announce(g, k);
      g.ev('round', { winner: X, wins: o.wins.slice() });
      if (o.wins[X] >= 2) { g.finish(X); return; }
      g.phase = 'roundEnd';
      g.phaseT = 6;
    },
    nextRound(g) {
      const o = g.obj;
      o.round++;
      const n = g.def.stages.length;
      const next = (g.subStage + 1) % n;
      g.subStage = next;
      o.stages.push(next);
      g.loadMap(next);
      g.proj = []; g.deploy = []; g.barriers = [];
      o.pt = g.map.points.A;
      o.pct = [0, 0]; o.owner = -1; o.cap = 0; o.capTeam = -1; o.unlocked = false; o.lockT = g.opts.lock === undefined ? 30 : g.opts.lock; o.contested = false; o.otFuse = 0;
      for (const h of g.heroes) { h.alive = false; h.spawned = false; h.respawnT = 0; if (h.ai) h.ai.reset = true; }
      g.phase = 'assemble';
      g.phaseT = g.opts.roundAssemble === undefined ? 10 : g.opts.roundAssemble;
      g.applyStage();
      g.ev('newround', { round: o.round, stage: next });
    },
    target(g) { return g.obj.pt; },
    nearObjective(g, pos) { if (!g.obj) return false; const pt = g.obj.pt; return Math.hypot(pos.x - pt.x, pos.z - pt.z) < pt.r + 10; },
    progress(g) { return Math.max(g.obj.pct[0], g.obj.pct[1]) / 100; },
    hud(g) {
      const o = g.obj;
      return { kind: 'control', pct: o.pct.slice(), owner: o.owner, cap: o.cap, capTeam: o.capTeam, locked: !o.unlocked, lockT: o.lockT, wins: o.wins.slice(), round: o.round, overtime: o.overtime, otFuse: o.otFuse, contested: o.contested, n: o.n.slice() };
    }
  };

  const TUTORIAL = [
    { title: 'ПЕРЕДВИЖЕНИЕ', text: 'WASD — движение, мышь — обзор. Выйдите из комнаты и пройдите к мишеням.', done: (g, p, s) => Math.hypot(p.pos.x - s.x0, p.pos.z - s.z0) > 12 },
    { title: 'ПРЫЖОК', text: 'ПРОБЕЛ — прыжок. Запрыгните на ящики у дорожки.', done: (g, p) => p.onGround && p.pos.y > 0.9 },
    { title: 'СТРЕЛЬБА', text: 'ЛКМ — огонь из импульсной винтовки. Уничтожьте трёх роботов.', done: (g, p, s) => p.stats.elims - s.e0 >= 3 },
    { title: 'ПЕРЕЗАРЯДКА', text: 'R — перезарядка. Не ждите, пока закончатся патроны.', done: (g, p) => p.reloadT > 0 },
    { title: 'РАКЕТЫ «СПИРАЛЬ»', text: 'ПКМ — залп из трёх ракет. Выстрелите по роботу.', done: (g, p) => p.cd.fire2 > 0 },
    { title: 'СПРИНТ', text: 'Удерживайте SHIFT, двигаясь вперёд.', done: (g, p, s, dt) => (s.sprint += p.k.sprint ? dt : 0) > 1.2 },
    { title: 'БИОТИЧЕСКОЕ ПОЛЕ', text: 'E — поставьте лечащее поле под ногами.', done: (g, p) => p.cd.e > 0 },
    { title: 'СУПЕРСПОСОБНОСТЬ', text: 'Суперспособность заряжена! Q — «Тактический визор» сам наводит винтовку на цели.', enter: (g, p) => { p.ult = p.def.ultCost; }, done: (g, p) => p.ultOn === 'visor' },
    { title: 'ОБУЧЕНИЕ ЗАВЕРШЕНО', text: 'Отличная работа, агент. Миру снова нужны герои!', done: (g, p, s) => s.t > 5, last: true }
  ];

  function tutStep(g, s, p, i) {
    s.step = i; s.t = 0; s.x0 = p.pos.x; s.z0 = p.pos.z; s.e0 = p.stats.elims; s.sprint = 0;
    if (TUTORIAL[i].enter) TUTORIAL[i].enter(g, p, s);
    g.ev('tutorial', { step: i });
  }

  const practice = {
    init(g) {
      g.obj = { type: 'practice', time: 0, tut: g.rules.tutorial ? { step: -1, t: 0 } : null };
      g.stage = 0;
      const used = {};
      for (const h of g.heroes) {
        if (!h.drill) continue;
        const list = g.map.hints.filter(x => x.kind === 'bot' && x.tag === h.drill);
        if (!list.length) continue;
        const i = used[h.drill] || 0;
        used[h.drill] = i + 1;
        h.home = list[i % list.length];
      }
    },
    begin() {},
    tick(g, dt) {
      const o = g.obj, s = o.tut, p = g.player;
      o.time += dt;
      if (!s || !p || !p.alive || !p.heroId) return;
      if (s.step < 0) { tutStep(g, s, p, 0); return; }
      s.t += dt;
      const st = TUTORIAL[s.step];
      if (s.t > 0.8 && st.done(g, p, s, dt)) {
        if (st.last) { g.finish(p.team); return; }
        tutStep(g, s, p, s.step + 1);
      }
    },
    target(g) { const p = g.map.points.A || { x: 0, y: 0, z: 0, r: 4 }; return p; },
    nearObjective() { return false; },
    progress() { return 0; },
    hud(g) {
      const s = g.obj.tut;
      return { kind: 'practice', time: g.obj.time, tut: s && s.step >= 0 ? { step: s.step, n: TUTORIAL.length, title: TUTORIAL[s.step].title, text: TUTORIAL[s.step].text, t: s.t } : null };
    }
  };

  O.MODES = { assault, escort, hybrid, control, practice };
  O.onPoint = onPoint;
})(globalThis.Ow98 = globalThis.Ow98 || {});
