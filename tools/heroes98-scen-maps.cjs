module.exports = H => {
  const MD = H.MapData, MF = H.MapFile, R = H.Rmg, K = R.kit;
  const recOf = id => H.Maps.LIST.find(m => m.id === id);
  const objOf = (doc, id) => doc.map.objs.find(o => o.id === id) || null;
  const areas = (meta, cls, l) => meta.areas.filter(a => a.cls === cls && (l == null || a.l === l));
  const middle = meta => areas(meta, 'center', 0)[0];

  const generate = (id, o) => {
    const r = R.make(Object.assign({ neutrals: 'normal', water: 'none', levels: 1 }, o));
    if (!r.doc) throw new Error(id + ': генератор не собрал карту: ' + JSON.stringify(r.log.slice(-3)));
    return r;
  };

  const freeCell = (doc, l, c, r) => {
    const M = doc.map;
    if (!MD.inside(M, c, r) || !MD.groundCost(M, l, c, r) || MD.isWater(M, l, c, r)) return false;
    return !M.objs.some(o => o.l === l && !H.OBJ[o.t].flat && MD.cells(o).some(([x, y]) => x === c && y === r));
  };

  const errors = doc => MF.blocking(MF.check(doc)).length;
  const spot = (doc, t, c0, r0, l, extra, rad) => {
    const M = doc.map, before = errors(doc);
    for (let d = 0; d <= (rad || 12); d++) {
      for (let dy = -d; dy <= d; dy++) {
        for (let dx = -d; dx <= d; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue;
          const c = Math.round(c0) + dx, r = Math.round(r0) + dy, probe = { t, c, r, l };
          if (MF.whyNot(doc, t, c, r, l, null)) continue;
          const e = MD.entry(probe);
          if (MD.cells(probe).some(([x, y]) => MD.roadAt(M, l, x, y))) continue;
          if (e && M.objs.some(o => o.l === l && o.t === 'monster' && Math.max(Math.abs(o.c - e[0]), Math.abs(o.r - e[1])) <= 1)) continue;
          if (e && H.Path.DIRS.filter(([x, y]) => freeCell(doc, l, e[0] + x, e[1] + y)).length < 3) continue;
          const o = MD.add(M, Object.assign({ t, c, r, l, owner: -1 }, extra || {}));
          if (errors(doc) <= before) return o;
          MF.removeObj(doc, o);
        }
      }
    }
    throw new Error('нет места для ' + t + ' у ' + Math.round(c0) + ',' + Math.round(r0));
  };

  const guard = (doc, o, unit, count) => {
    const e = MD.entry(o), M = doc.map;
    for (const [x, y] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const c = e[0] + x, r = e[1] + y;
      if (!freeCell(doc, o.l, c, r) || MD.roadAt(M, o.l, c, r)) continue;
      return MD.add(M, { t: 'monster', c, r, l: o.l, owner: -1, unit, count, max: count * 3, mood: 'hostile' });
    }
    throw new Error('некуда поставить охрану к ' + o.t);
  };

  const ringAround = (doc, l, c0, r0, rad) => {
    const pts = [];
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      for (let d = rad; d >= 2; d--) {
        const c = Math.round(c0 + Math.cos(a) * d), r = Math.round(r0 + Math.sin(a) * d);
        if (freeCell(doc, l, c, r)) {
          pts.push([c, r]);
          break;
        }
      }
    }
    return pts;
  };

  const walk = (doc, l, from, to) => {
    const M = doc.map, blocked = new Set();
    for (const o of M.objs) {
      if (o.l !== l || H.OBJ[o.t].flat) continue;
      for (const [x, y] of MD.cells(o)) blocked.add(y * M.w + x);
    }
    const end = to[1] * M.w + to[0], cost = i => (blocked.has(i) && i !== end ? 0 : MD.groundCost(M, l, i % M.w, (i / M.w) | 0));
    const found = H.Path.find(M.w, M.h, from[1] * M.w + from[0], new Set([end]), cost, () => false, 0.6);
    return found ? found.cells.map(i => [i % M.w, (i / M.w) | 0]) : null;
  };

  const loopRoute = (doc, l, pts, times) => {
    const legs = [];
    for (let i = 0; i < pts.length; i++) {
      const leg = walk(doc, l, pts[i], pts[(i + 1) % pts.length]);
      if (!leg) return null;
      legs.push(...leg);
    }
    const out = [];
    for (let k = 0; k < times; k++) out.push(...legs);
    return out;
  };

  const finish = (id, doc, more) => {
    const rec = recOf(id);
    doc.name = rec.name;
    doc.about = rec.about;
    Object.assign(doc, more || {});
    const bad = MF.blocking(MF.check(doc));
    if (bad.length) throw new Error(id + ': ' + bad.slice(0, 4).map(x => x.text + (x.c != null ? ' (' + x.c + ',' + x.r + ',' + (x.l || 0) + ')' : '')).join('; '));
    return doc;
  };

  const lineup = (factions, teams) => factions.map((faction, i) => ({ faction, team: teams ? teams[i] : null }));

  const saltShape = {
    name: 'Соляной путь',
    about: '',
    build: G => {
      G.rules = { wedges: 2, a0: Math.PI, crossWedge: true };
      const mid = K.addZone(G, { cls: 'center', tier: 2, proto: 'market', town: true });
      for (const k of [0, 1]) {
        const turn = p => K.rotate(p, k * Math.PI);
        const s = K.startZone(G, k, turn({ x: 0.14, y: 0.5 }), k);
        const a = K.addZone(G, Object.assign({ wedge: k, proto: 'road', tier: 1 }, turn({ x: 0.34, y: 0.26 })));
        const b = K.addZone(G, Object.assign({ wedge: k, proto: 'yard', tier: 1 }, turn({ x: 0.34, y: 0.76 })));
        K.tie(G, s, a);
        K.tie(G, s, b);
        K.tie(G, a, mid);
        K.tie(G, b, mid);
      }
    }
  };

  const salt = () => {
    const { doc, meta } = generate('salt', { shape: saltShape, w: 48, seed: 4801, players: lineup(['league', 'barrows']) });
    const M = doc.map, mid = middle(meta), town = objOf(doc, mid.town);
    town.name = 'Соляной Торг';
    for (let i = 0; i < M.w * M.h; i++) {
      const c = i % M.w, r = (i / M.w) | 0;
      if (MD.roadAt(M, 0, c, r) || !MD.groundCost(M, 0, c, r) || MD.isWater(M, 0, c, r)) continue;
      if (H.Path.DIRS.some(([x, y]) => MD.inside(M, c + x, r + y) && MD.roadAt(M, 0, c + x, r + y))) M.ter[0][i] = H.TERRAIN_INDEX.saltflat;
    }
    for (const a of areas(meta, 'side').filter(z => z.proto === 'road')) guard(doc, spot(doc, 'saltworks', a.cx, a.cy, 0, {}), 'scorpions', 10);
    return finish('salt', doc);
  };

  const seven = () => {
    const { doc, meta } = generate('seven', { shape: { name: 'Семь рек', about: '', sea: true, build: R.TEMPLATES.bowl.build }, w: 144, seed: 14407, water: 'many', players: lineup(['league', 'barrows', 'thicket', 'tide', 'forge', 'throne', 'tide']) });
    const M = doc.map, half = M.w / 2;
    for (const a of areas(meta, 'start')) {
      const town = objOf(doc, a.town), ang = Math.atan2(town.r - half, town.c - half) + 0.12, at = k => [Math.round(half + Math.cos(ang) * k * M.w), Math.round(half + Math.sin(ang) * k * M.w)];
      MF.river(M, 0, 1, [at(0.5), at(0.42), at(0.34), at(0.24)]);
    }
    return finish('seven', doc);
  };

  const heartNear = (doc, l, c0, r0, from, to) => {
    for (let d = from; d <= to; d++) {
      for (let k = 0; k < 16; k++) {
        const a = k * Math.PI / 8, c = Math.round(c0 + Math.cos(a) * d), r = Math.round(r0 + Math.sin(a) * d);
        if (freeCell(doc, l, c, r) && !MD.roadAt(doc.map, l, c, r) && H.Path.DIRS.filter(([x, y]) => freeCell(doc, l, c + x, r + y)).length >= 5) return { l, c, r };
      }
    }
    return null;
  };

  const crown = () => {
    const { doc, meta } = generate('crown', { shape: { name: 'Кольцо Венца', about: '', sea: true, build: R.TEMPLATES.bowl.build }, w: 112, seed: 11208, water: 'many', players: lineup(['league', 'barrows', 'thicket', 'tide', 'forge', 'throne', 'league', 'barrows']) });
    const M = doc.map, half = M.w / 2, isles = areas(meta, 'islet').sort((p, q) => Math.hypot(p.cx - half, p.cy - half) - Math.hypot(q.cx - half, q.cy - half));
    M.heart = isles.map(a => heartNear(doc, 0, a.cx, a.cy, 0, 8)).find(Boolean);
    if (!M.heart) throw new Error('crown: нет места для Сердца');
    for (const a of areas(meta, 'side')) spot(doc, 'menhir', a.cx, a.cy, 0, {});
    return finish('crown', doc, { goals: { win: [{ kind: 'defeat' }, { kind: 'heart' }], lose: [{ kind: 'all' }] } });
  };

  const HORN_DAYS = [[50, 57], [106, 113], [162, 169], [218, 225]];
  const horn = () => {
    const { doc, meta } = generate('horn', { shape: { name: 'Старый Горн', about: '', build: R.TEMPLATES.ring.build }, w: 80, seed: 8003, players: lineup(['forge', 'league', 'barrows']) });
    const M = doc.map, mid = middle(meta), cx = Math.round(mid.cx), cy = Math.round(mid.cy);
    const core = (c, r) => Math.hypot(c - cx, r - cy) <= 3.5, rim = (c, r) => Math.hypot(c - cx, r - cy) <= 10;
    for (const o of M.objs.slice()) {
      if (MD.cells(o).some(([c, r]) => Math.hypot(c - cx, r - cy) <= 5)) MF.removeObj(doc, o);
    }
    for (let r = 0; r < M.h; r++) {
      for (let c = 0; c < M.w; c++) {
        const i = MD.idx(M, c, r);
        if (MD.roadAt(M, 0, c, r) || !rim(c, r)) continue;
        if (core(c, r)) M.ter[0][i] = H.TERRAIN_INDEX.lava;
        else if (MD.groundCost(M, 0, c, r) && !MD.isWater(M, 0, c, r)) M.ter[0][i] = H.TERRAIN_INDEX.ash;
      }
    }
    spot(doc, 'giantforge', cx, cy + 7, 0, {}, 8);
    const rects = [[cx - 6, cy - 9, 13, 4], [cx - 6, cy + 6, 13, 4], [cx - 9, cy - 5, 4, 11], [cx + 6, cy - 5, 4, 11]];
    const flood = (to, from) => rects.map(([c, r, w, h]) => 'terrain ' + to + ' ' + c + ' ' + r + ' ' + w + ' ' + h + ' 0 ' + from).join('\n');
    const scenes = [
      ...HORN_DAYS.flatMap(([a, b]) => ['event day ' + a + ' any -> wake', 'event day ' + b + ' any -> calm']),
      '',
      '@wake',
      'say Старый Горн проснулся. Лава заливает долины вокруг кратера, через неделю она остынет.',
      flood('lava', 'ash'),
      'end',
      '',
      '@calm',
      'say Лава у Старого Горна остыла, долины снова проходимы.',
      flood('ash', 'lava'),
      'end'
    ].join('\n');
    return finish('horn', doc, { scenes });
  };

  const ruins = () => {
    const { doc, meta } = generate('ruins', { shape: { name: 'Белые руины', about: '', build: R.TEMPLATES.ring.build }, w: 80, seed: 8004, players: lineup(['throne', 'league', 'thicket', 'barrows']) });
    const M = doc.map;
    for (let i = 0; i < M.w * M.h; i++) if (M.road[0][i]) M.road[0][i] = 3;
    for (const a of areas(meta, 'side')) spot(doc, 'whiteruin', a.cx, a.cy, 0, {});
    const mid = middle(meta);
    if (!M.objs.some(o => o.t === 'thronetreasury')) spot(doc, 'thronetreasury', mid.cx, mid.cy, 0, {}, 14);
    return finish('ruins', doc);
  };

  const border = () => {
    const { doc, meta } = generate('border', { shape: { name: 'Порубежье', about: '', build: R.TEMPLATES.ring.build }, w: 80, seed: 8005, players: lineup(['league', 'barrows', 'thicket', 'tide']) });
    const M = doc.map;
    areas(meta, 'side').forEach(a => {
      spot(doc, 'mercenarycamp', a.cx, a.cy, 0, {});
      const pts = ringAround(doc, 0, a.cx, a.cy, 6), route = pts.length >= 4 ? loopRoute(doc, 0, pts, 24) : null;
      if (!route) throw new Error('border: шайке негде ходить у ' + Math.round(a.cx) + ',' + Math.round(a.cy));
      MD.add(M, { t: 'monster', c: pts[0][0], r: pts[0][1], l: 0, owner: -1, unit: 'bandits', count: 70, max: 210, mood: 'hostile', route, pace: 3 });
    });
    return finish('border', doc);
  };

  const conv = () => {
    const { doc, meta } = generate('conv', { shape: { name: 'Схождение', about: '', build: R.TEMPLATES.star.build }, w: 112, seed: 11206, players: lineup(['league', 'barrows', 'thicket', 'tide', 'forge', 'throne']) });
    const M = doc.map, mid = middle(meta);
    M.heart = heartNear(doc, 0, mid.cx, mid.cy, 6, 12);
    if (!M.heart) throw new Error('conv: нет места для Сердца');
    for (const a of areas(meta, 'start')) {
      const town = objOf(doc, a.town);
      spot(doc, 'menhir', (a.cx * 2 + mid.cx) / 3 + (a.cx - town.c) * 0.3, (a.cy * 2 + mid.cy) / 3 + (a.cy - town.r) * 0.3, 0, {});
    }
    return finish('conv', doc, { goals: { win: [{ kind: 'heart' }, { kind: 'defeat' }], lose: [{ kind: 'all' }, { kind: 'day', day: 112 }] } });
  };

  const dark = () => {
    const { doc, meta } = generate('dark', { shape: { name: 'Тьма', about: '', build: R.TEMPLATES.eight.build }, w: 144, seed: 14408, levels: 2, neutrals: 'strong', players: lineup(['league', 'barrows', 'thicket', 'tide', 'forge', 'throne', 'league', 'barrows']) });
    const M = doc.map, top = middle(meta), deep = meta.areas.find(a => a.l === 1 && a.cls === 'center');
    const vaults = Object.keys(H.OBJ).filter(k => H.OBJ[k].kind === 'vault');
    vaults.filter(k => !M.objs.some(o => o.t === k)).forEach((k, i) => {
      const at = i % 2 && deep ? deep : top, a = i * 0.9;
      try {
        spot(doc, k, at.cx + Math.cos(a) * 8, at.cy + Math.sin(a) * 8, at.l, {}, 16);
      } catch (e) {
        if (H.OBJ[k].foot && !/sunken|pirate/.test(k)) throw e;
      }
    });
    return finish('dark', doc);
  };

  const isles = () => {
    const { doc } = generate('isles', { shape: { name: 'Остров на остров', about: '', sea: true, build: R.TEMPLATES.islands.build }, w: 80, seed: 8009, water: 'many', players: lineup(['tide', 'league']) });
    return finish('isles', doc);
  };

  const seals = () => {
    const { doc, meta } = generate('seals', { shape: { name: 'Печати', about: '', build: R.TEMPLATES.ring.build }, w: 80, seed: 8010, players: lineup(['league', 'thicket', 'forge', 'throne']) });
    const M = doc.map, mid = middle(meta), byId = new Map(meta.areas.map(a => [a.id, a])), sides = areas(meta, 'side');
    for (const link of meta.links) {
      const a = byId.get(link.a), b = byId.get(link.b), side = a.cls === 'side' && b.cls === 'center' ? a : b.cls === 'side' && a.cls === 'center' ? b : null;
      if (!side) continue;
      const guard = objOf(doc, link.guard);
      if (guard) MF.removeObj(doc, guard);
      const at = link.path.indexOf(link.mid), c = link.mid % M.w, r = (link.mid / M.w) | 0, prev = link.path[Math.max(0, at - 1)], next = link.path[Math.min(link.path.length - 1, at + 1)];
      const dx = Math.sign((next % M.w) - (prev % M.w)), dy = Math.sign(((next / M.w) | 0) - ((prev / M.w) | 0));
      for (const k of [-1, 1]) {
        const x = c + dy * k, y = r + dx * k;
        if (MD.inside(M, x, y) && MD.groundCost(M, 0, x, y) && !M.objs.some(o => MD.cells(o).some(([p, q]) => p === x && q === y))) M.ter[0][MD.idx(M, x, y)] = H.TERRAIN_INDEX.rock;
      }
      MD.add(M, { t: 'sealgate', c, r, l: 0, owner: -1, color: side.wedge });
    }
    sides.forEach(a => {
      const next = sides.find(q => q.wedge === (a.wedge + 1) % sides.length) || a;
      spot(doc, 'sealer', next.cx, next.cy, 0, { color: a.wedge });
      spot(doc, 'petitioner', a.cx + 4, a.cy + 4, 0, { quest: [{ kind: 'res', res: { wood: 10 } }, { kind: 'res', res: { ore: 10 } }, { kind: 'foes', count: 2 }, { kind: 'res', res: { salt: 5 } }][a.wedge % 4], reward: { gold: 3000, xp: 1500 } });
    });
    if (!M.objs.some(o => o.t === 'library')) spot(doc, 'library', mid.cx, mid.cy, 0, {}, 12);
    return finish('seals', doc);
  };

  const HORDE = { unit: 'mercenaries', count: 240, days: 3 };
  const three = () => {
    const { doc } = generate('three', { shape: { name: 'Три дня', about: '', build: R.TEMPLATES.duel.build }, w: 48, seed: 4803, players: lineup(['league', 'barrows']) });
    const M = doc.map, towns = doc.players.map(p => objOf(doc, p.town));
    towns.forEach((t, i) => { t.tag = 'home' + i; });
    let from = null;
    for (let d = 0; d < M.w && !from; d++) {
      for (const c of [Math.floor(M.w / 2) - d, Math.floor(M.w / 2) + d]) {
        if (freeCell(doc, 0, c, 1) && freeCell(doc, 0, M.w - 1 - c, M.h - 2)) {
          from = [c, 1];
          break;
        }
      }
    }
    if (!from) throw new Error('three: нет края для Орды');
    const twin = [M.w - 1 - from[0], M.h - 1 - from[1]], e = MD.entry(towns[0]), far = walk(doc, 0, from, e) || [];
    const near = (p, t) => Math.hypot(p[0] - t.c, p[1] - t.r), aim = near(from, towns[0]) >= near(from, towns[1]) ? [0, 1] : [1, 0], pace = Math.max(4, Math.ceil(far.length / HORDE.days));
    const scenes = [
      'event day 15 any -> warn',
      'event day 22 any -> horde',
      'event arrive horde' + aim[0] + ' any -> gates',
      '',
      '@warn',
      'say Дозорные видят пыль на краю карты. Через неделю оттуда выйдет Орда и пойдёт к городам.',
      'end',
      '',
      '@horde',
      'say Орда вышла из-за края карты. Через три дня она будет у ворот.',
      'spawn monster ' + HORDE.unit + ' ' + HORDE.count + ' fierce ' + from[0] + ' ' + from[1] + ' 0 horde' + aim[0],
      'spawn monster ' + HORDE.unit + ' ' + HORDE.count + ' fierce ' + twin[0] + ' ' + twin[1] + ' 0 horde' + aim[1],
      'march horde' + aim[0] + ' home' + aim[0] + ' ' + pace,
      'march horde' + aim[1] + ' home' + aim[1] + ' ' + pace,
      'end',
      '',
      '@gates',
      'say Орда стоит у ворот. Пока она там, из города не выйти без боя.',
      'end'
    ].join('\n');
    return finish('three', doc, { scenes });
  };

  const union = () => {
    const { doc } = generate('union', { shape: { name: 'Союз', about: '', build: R.TEMPLATES.ring.build }, w: 112, seed: 11204, players: lineup(['league', 'thicket', 'barrows', 'forge'], [1, 1, 2, 2]) });
    return finish('union', doc);
  };

  return { salt, seven, crown, horn, ruins, border, conv, dark, isles, seals, three, union };
};
