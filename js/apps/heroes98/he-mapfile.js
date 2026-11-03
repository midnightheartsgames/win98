(function (H) {
  'use strict';
  const VERSION = 1;
  const GAME = 'heroes98-map';
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const MD = H.MapData;
  const SIZES = [['малая', 48], ['средняя', 80], ['большая', 112], ['огромная', 144]];
  const MAX_PLAYERS = 8;
  const GUARD_NEAR = 3;
  const WET_ONLY = ['boat', 'whirlpool'];
  const WET_TYPES = ['barrel'];

  const toBase64 = bytes => {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
      const a = bytes[i], b = bytes[i + 1], c = bytes[i + 2];
      out += B64[a >> 2] + B64[((a & 3) << 4) | ((b || 0) >> 4)];
      out += i + 1 < bytes.length ? B64[((b & 15) << 2) | ((c || 0) >> 6)] : '=';
      out += i + 2 < bytes.length ? B64[c & 63] : '=';
    }
    return out;
  };
  const fromBase64 = text => {
    const out = [];
    for (let i = 0; i < text.length; i += 4) {
      const a = B64.indexOf(text[i]), b = B64.indexOf(text[i + 1]), c = B64.indexOf(text[i + 2]), d = B64.indexOf(text[i + 3]);
      out.push((a << 2) | (b >> 4));
      if (c >= 0) out.push(((b & 15) << 4) | (c >> 2));
      if (d >= 0) out.push(((c & 3) << 6) | d);
    }
    return out;
  };

  const packCells = cells => {
    const bytes = [];
    for (let i = 0; i < cells.length;) {
      let n = 1;
      while (n < 255 && i + n < cells.length && cells[i + n] === cells[i]) n++;
      bytes.push(cells[i], n);
      i += n;
    }
    return toBase64(bytes);
  };
  const unpackCells = (text, size) => {
    const bytes = fromBase64(text), out = [];
    for (let i = 0; i + 1 < bytes.length; i += 2) for (let k = 0; k < bytes[i + 1]; k++) out.push(bytes[i]);
    if (out.length !== size) throw new Error('map layer has a wrong size');
    return out;
  };

  const blank = o => {
    const opt = o || {}, w = opt.w || 48, h = opt.h || w, levels = opt.levels || 1, fills = [opt.fill || 'meadow', 'cave'].slice(0, levels), map = MD.create(w, h, fills);
    if (levels > 1) map.ter[1].fill(H.TERRAIN_INDEX.rock);
    const count = opt.players || 2;
    return {
      name: opt.name || 'Новая карта',
      about: opt.about || '',
      map,
      players: Array.from({ length: count }, (_, i) => ({ who: 'both', factions: null, team: i, town: null })),
      goals: { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }] },
      heroes: [],
      events: [],
      scenes: ''
    };
  };

  const write = doc => {
    const M = doc.map;
    return JSON.stringify({
      game: GAME, v: VERSION, name: doc.name, about: doc.about || '', w: M.w, h: M.h, levels: M.levels,
      players: doc.players, goals: doc.goals, forbid: M.forbid || [], heart: M.heart || null, next: M.next,
      ter: M.ter.map(packCells), road: M.road.map(packCells), river: (M.river || []).map(packCells), over: M.over.map(packCells),
      objs: M.objs, heroes: doc.heroes || [], events: doc.events || [], scenes: doc.scenes || ''
    });
  };

  const read = text => {
    let d;
    try {
      d = JSON.parse(text);
    } catch (e) {
      throw new Error('not a Heroes 98 map');
    }
    if (!d || d.game !== GAME) throw new Error('not a Heroes 98 map');
    if (d.v > VERSION) throw new Error('map from a newer version');
    const size = d.w * d.h, none = () => new Array(size).fill(0);
    const map = {
      v: 1, w: d.w, h: d.h, levels: d.levels, next: d.next, objs: d.objs,
      ter: d.ter.map(s => unpackCells(s, size)),
      road: d.road.map(s => unpackCells(s, size)),
      river: d.river && d.river.length ? d.river.map(s => unpackCells(s, size)) : d.ter.map(none),
      over: d.over.map(s => unpackCells(s, size))
    };
    if (d.forbid && d.forbid.length) map.forbid = d.forbid;
    if (d.heart) map.heart = d.heart;
    if (d.ter.length !== d.levels) throw new Error('map levels do not match');
    return { name: d.name, about: d.about || '', map, players: d.players, goals: d.goals, heroes: d.heroes || [], events: d.events || [], scenes: d.scenes || '' };
  };

  const clone = doc => read(write(doc));
  const sizeName = w => (SIZES.find(s => s[1] >= w) || SIZES[3])[0];

  const fromMade = (rec, made) => {
    made.starts.forEach((st, i) => Object.assign(st.town, { faction: i % 3 ? 'barrows' : 'league', name: 'Город игрока ' + (i + 1), built: ['hall1', 'fort1', 'tavern', 'dwell1', 'dwell2'] }));
    return {
      name: rec.name,
      about: rec.about,
      map: made.M,
      players: made.starts.map((st, i) => ({ who: 'both', factions: null, team: i, town: st.town.id, auto: true })),
      goals: made.M.goals || { win: [{ kind: 'defeat' }], lose: [{ kind: 'all' }] },
      heroes: [],
      events: [],
      scenes: ''
    };
  };

  const needsWater = (t, def) => WET_ONLY.includes(def.kind) || WET_TYPES.includes(t);
  const footCells = (t, c, r) => {
    const f = H.OBJ[t].foot, out = [];
    for (let y = 0; y < f[1]; y++) for (let x = 0; x < f[0]; x++) out.push([c + x, r + y]);
    return out;
  };
  const entryCell = (t, c, r) => {
    const e = H.OBJ[t].entry;
    return e ? [c + e[0], r + e[1]] : null;
  };

  const whyNot = (doc, t, c, r, l, skip) => {
    const M = doc.map, def = H.OBJ[t], key = (x, y) => y * M.w + x, wet = needsWater(t, def), used = new Set();
    for (const o of M.objs) {
      if (o === skip || o.l !== l || H.OBJ[o.t].flat) continue;
      for (const [x, y] of MD.cells(o)) used.add(key(x, y));
    }
    for (const h of doc.heroes || []) if (h !== skip && (h.l || 0) === l) used.add(key(h.c, h.r));
    for (const [x, y] of footCells(t, c, r)) {
      if (!MD.inside(M, x, y)) return 'Не помещается на карте';
      if (used.has(key(x, y))) return 'Место занято другим объектом';
      if (wet && !MD.isWater(M, l, x, y)) return 'Этот объект ставится только на воду';
      if (!wet && def.kind !== 'decor' && def.kind !== 'monster' && !MD.groundCost(M, l, x, y)) return 'Здесь нельзя строить: вода или скалы';
    }
    const e = entryCell(t, c, r);
    if (e && !wet && def.kind !== 'monster' && !MD.groundCost(M, l, e[0], e[1])) return 'Ко входу нельзя подойти';
    return null;
  };

  const place = (doc, t, c, r, l, extra) => {
    const why = whyNot(doc, t, c, r, l, null);
    if (why) return { ok: false, why };
    return { ok: true, obj: MD.add(doc.map, Object.assign({ t, c, r, l, owner: -1 }, extra || {})) };
  };

  const removeObj = (doc, o) => {
    const M = doc.map;
    M.objs = M.objs.filter(x => x !== o);
    for (const x of M.objs) if (x.link === o.id) delete x.link;
    for (const p of doc.players) if (p.town === o.id) p.town = null;
  };

  const brush = (M, l, id, c, r, size) => {
    const half = size >> 1, v = H.TERRAIN_INDEX[id], out = [];
    for (let y = r - half; y <= r + half; y++) {
      for (let x = c - half; x <= c + half; x++) {
        if (!MD.inside(M, x, y)) continue;
        M.ter[l][MD.idx(M, x, y)] = v;
        out.push([x, y]);
      }
    }
    return out;
  };
  const brushField = (M, l, id, c, r, size) => {
    const half = size >> 1, v = id ? H.FIELD_INDEX[id] : 0;
    for (let y = r - half; y <= r + half; y++) for (let x = c - half; x <= c + half; x++) if (MD.inside(M, x, y)) M.over[l][MD.idx(M, x, y)] = v;
  };
  const fill = (M, l, id, c, r) => {
    const v = H.TERRAIN_INDEX[id], from = M.ter[l][MD.idx(M, c, r)];
    if (from === v) return 0;
    const stack = [MD.idx(M, c, r)];
    let n = 0;
    while (stack.length) {
      const i = stack.pop();
      if (M.ter[l][i] !== from) continue;
      M.ter[l][i] = v;
      n++;
      const x = i % M.w, y = (i / M.w) | 0;
      if (x > 0) stack.push(i - 1);
      if (x < M.w - 1) stack.push(i + 1);
      if (y > 0) stack.push(i - M.w);
      if (y < M.h - 1) stack.push(i + M.w);
    }
    return n;
  };
  const river = (M, l, kind, pts) => {
    M.river = M.river || M.ter.map(() => new Array(M.w * M.h).fill(0));
    MD.line(pts, (c, r) => { if (MD.inside(M, c, r)) M.river[l][MD.idx(M, c, r)] = kind; });
  };

  const objName = o => (o.t === 'town' ? 'Город ' + (o.name || '') : o.t === 'monster' ? (H.UNITS[o.unit] ? H.UNITS[o.unit].name : 'Отряд') : H.OBJ[o.t].name);
  const startOf = (doc, i) => {
    const pl = doc.players[i], town = doc.map.objs.find(o => o.id === pl.town) || doc.map.objs.find(o => o.t === 'town' && o.owner === i), hero = (doc.heroes || []).find(h => h.owner === i);
    return { town: town || null, hero: hero || null };
  };

  const blockedCells = M => {
    const out = M.objs.reduce((all, o) => {
      if (!all[o.l]) all[o.l] = new Uint8Array(M.w * M.h);
      if (H.OBJ[o.t].flat || H.OBJ[o.t].kind === 'monster') return all;
      const e = MD.entry(o);
      for (const [x, y] of MD.cells(o)) {
        if (!MD.inside(M, x, y) || (e && e[0] === x && e[1] === y)) continue;
        all[o.l][MD.idx(M, x, y)] = 1;
      }
      return all;
    }, Array.from({ length: M.levels }, () => new Uint8Array(M.w * M.h)));
    return out;
  };

  const exitsOf = (M, o) => {
    const def = H.OBJ[o.t];
    if (def.kind === 'portal' || def.kind === 'whirlpool') {
      if (o.link != null) return M.objs.filter(x => x.id === o.link);
      if (def.kind === 'whirlpool') return M.objs.filter(x => x.t === 'whirlpool' && x !== o);
      return [];
    }
    if (def.kind === 'moongate') return M.objs.filter(x => x.t === 'moongate' && x !== o && x.moon === o.moon);
    return [];
  };

  const only = id => p => !!p && !!(p.factions || []).length && p.factions.every(f => f === id);
  const tideOnly = only('tide'), forgeOnly = only('forge');
  const flood = (doc, starts, wet, hot) => {
    const M = doc.map, blocked = blockedCells(M), size = M.w * M.h, seen = Array.from({ length: M.levels }, () => new Uint8Array(size));
    const entries = new Map(), keyOf = (l, i) => l * size + i;
    for (const o of M.objs) {
      const e = MD.entry(o);
      if (!e || !MD.inside(M, e[0], e[1])) continue;
      const k = keyOf(o.l, MD.idx(M, e[0], e[1]));
      if (!entries.has(k)) entries.set(k, []);
      entries.get(k).push(o);
    }
    const sealers = new Set(M.objs.filter(o => o.t === 'sealer').map(o => o.color));
    const closed = o => o.t === 'sealgate' && !sealers.has(o.color);
    let sailing = !!wet;
    const stack = [];
    const push = (l, i) => {
      if (seen[l][i]) return;
      seen[l][i] = 1;
      stack.push([l, i]);
    };
    for (const [l, c, r] of starts) if (MD.inside(M, c, r)) push(l, MD.idx(M, c, r));
    const walk = (l, x, y) => {
      if (!MD.inside(M, x, y)) return false;
      const i = MD.idx(M, x, y), list = entries.get(keyOf(l, i)) || [];
      if (blocked[l][i] || list.some(closed)) return false;
      if (MD.isWater(M, l, x, y)) {
        if (list.some(o => H.OBJ[o.t].kind === 'boat')) sailing = true;
        return sailing;
      }
      return !!MD.groundCost(M, l, x, y) || (!!hot && MD.terrainAt(M, l, x, y).id === 'lava');
    };
    let guard = 0, more = true;
    while (more && guard++ < 4) {
      const was = sailing;
      while (stack.length) {
        const [l, i] = stack.pop(), x = i % M.w, y = (i / M.w) | 0;
        for (const o of entries.get(keyOf(l, i)) || []) {
          if (H.OBJ[o.t].kind === 'shipyard' || (o.t === 'town' && (o.built || []).includes('shipyard'))) sailing = true;
          for (const to of exitsOf(M, o)) {
            const e = MD.entry(to);
            if (e && MD.inside(M, e[0], e[1])) push(to.l, MD.idx(M, e[0], e[1]));
          }
        }
        for (const [dx, dy] of H.Path.DIRS) {
          if (!walk(l, x + dx, y + dy)) continue;
          if (dx && dy && !walk(l, x + dx, y) && !walk(l, x, y + dy)) continue;
          push(l, MD.idx(M, x + dx, y + dy));
        }
      }
      more = sailing && !was;
      if (more) for (let l = 0; l < M.levels; l++) for (let i = 0; i < size; i++) if (seen[l][i]) stack.push([l, i]);
    }
    return seen;
  };

  const reached = (M, seen, o) => {
    const e = MD.entry(o);
    if (e) return MD.inside(M, e[0], e[1]) && !!seen[o.l][MD.idx(M, e[0], e[1])];
    for (const [x, y] of MD.cells(o)) {
      for (const [dx, dy] of H.Path.DIRS) {
        if (MD.inside(M, x + dx, y + dy) && seen[o.l][MD.idx(M, x + dx, y + dy)]) return true;
      }
    }
    return false;
  };

  const startCells = (doc, i) => {
    const st = startOf(doc, i), out = [];
    if (st.town) {
      const e = MD.entry(st.town);
      out.push([st.town.l, e[0], e[1]]);
    }
    for (const h of doc.heroes || []) if (h.owner === i) out.push([h.l || 0, h.c, h.r]);
    return out;
  };

  const unreached = doc => {
    const M = doc.map, union = flood(doc, doc.players.flatMap((p, i) => startCells(doc, i)), doc.players.some(tideOnly), doc.players.some(forgeOnly));
    return M.objs.filter(o => H.OBJ[o.t] && !H.OBJ[o.t].flat && H.OBJ[o.t].kind !== 'decor' && !reached(M, union, o));
  };

  const valuable = o => {
    const def = H.OBJ[o.t];
    if (def.kind === 'vault' || def.kind === 'menhir') return false;
    if (def.kind === 'artifact') return !!H.ARTIFACTS[o.art] && H.ARTIFACTS[o.art].rank !== 'plain';
    if (def.kind === 'chest') return (o.offer || 0) >= 2;
    if (def.kind === 'mine') return !['wood', 'ore'].includes(H.mineRes(o));
    return (def.worth || 0) >= 4000;
  };

  const check = doc => {
    const M = doc.map, out = [];
    const err = (text, at) => out.push(Object.assign({ level: 'error', text }, at || {}));
    const warn = (text, at) => out.push(Object.assign({ level: 'warn', text }, at || {}));
    const place0 = o => ({ c: o.c, r: o.r, l: o.l || 0, obj: o.id });
    const cells = new Map();
    for (const o of M.objs) {
      const def = H.OBJ[o.t];
      if (!def) {
        err('Неизвестный объект: ' + o.t, place0(o));
        continue;
      }
      if (def.flat) continue;
      for (const [x, y] of MD.cells(o)) {
        if (!MD.inside(M, x, y)) {
          err('Объект за краем карты: ' + objName(o), place0(o));
          continue;
        }
        const k = o.l + ':' + y * M.w + ':' + x;
        if (cells.has(k)) err('Следы пересекаются: ' + objName(o) + ' и ' + objName(cells.get(k)), place0(o));
        else cells.set(k, o);
      }
      const wet = needsWater(o.t, def);
      if (wet && !MD.isWater(M, o.l, o.c, o.r)) err(objName(o) + ' стоит не на воде', place0(o));
      const e = MD.entry(o);
      if (e && !wet && def.kind !== 'monster' && MD.inside(M, e[0], e[1]) && !MD.groundCost(M, o.l, e[0], e[1])) err('Ко входу нельзя подойти: ' + objName(o), place0(o));
    }
    for (const h of doc.heroes || []) {
      const k = (h.l || 0) + ':' + h.r * M.w + ':' + h.c, at = { c: h.c, r: h.r, l: h.l || 0 };
      if (!MD.inside(M, h.c, h.r)) err('Герой за краем карты', at);
      else if (cells.has(k) && !MD.entry(cells.get(k))) err('Герой стоит на объекте', at);
      if (h.hid && !H.HEROES.some(x => x.id === h.hid)) err('Неизвестный герой: ' + h.hid, at);
      if (h.owner >= doc.players.length) err('Герой у игрока, которого нет на карте', at);
    }
    if (!doc.players.length) err('На карте нет игроков');
    if (doc.players.length && !doc.players.some(p => p.who !== 'ai')) err('Все игроки только ИИ: человеку негде играть');
    const starts = [];
    doc.players.forEach((p, i) => {
      const st = startOf(doc, i), name = 'Игрок ' + (i + 1) + ' (' + H.PLAYER_NAMES[i] + ')';
      if (!st.town && !st.hero) err(name + ' без старта: нет ни города, ни героя');
      starts.push(startCells(doc, i));
    });
    for (const o of unreached(doc)) err('Недостижимо: ' + objName(o), place0(o));
    if (doc.players.length > 1) {
      doc.players.forEach((p, i) => {
        if (!starts[i].length) return;
        const seen = flood(doc, starts[i], tideOnly(p), forgeOnly(p));
        doc.players.forEach((q, j) => {
          const t = startOf(doc, j).town;
          if (i !== j && t && !reached(M, seen, t)) warn('Игрок ' + (i + 1) + ' не дойдёт до города игрока ' + (j + 1), place0(t));
        });
      });
    }
    const monsters = M.objs.filter(o => o.t === 'monster');
    for (const o of M.objs) {
      if (!H.OBJ[o.t] || !valuable(o)) continue;
      const e = MD.entry(o) || [o.c, o.r];
      if (!monsters.some(m => m.l === o.l && Math.max(Math.abs(m.c - e[0]), Math.abs(m.r - e[1])) <= GUARD_NEAR)) warn('Ценное без охраны: ' + (o.t === 'artifact' ? H.ARTIFACTS[o.art].name : objName(o)), place0(o));
    }
    const tags = new Set();
    const noteTag = (tag, at) => {
      if (!tag) return;
      if (tags.has(tag)) err('Метка повторяется: ' + tag, at);
      tags.add(tag);
    };
    for (const o of M.objs) noteTag(o.tag, place0(o));
    for (const h of doc.heroes || []) noteTag(h.tag, { c: h.c, r: h.r, l: h.l || 0 });
    for (const o of M.objs) {
      const def = H.OBJ[o.t];
      if (!def) continue;
      const at = place0(o);
      if (o.t === 'monster' && !H.UNITS[o.unit]) err('Отряд без существа: ' + (o.unit || 'пусто'), at);
      if (o.t === 'artifact' && !H.ARTIFACTS[o.art]) err('Артефакт не выбран', at);
      if (o.spell && !H.SPELLS[o.spell]) err('Неизвестное заклинание: ' + o.spell, at);
      if (o.t === 'town' && !H.FACTIONS[o.faction]) err('Город без народа', at);
      if (def.kind === 'portal' && !exitsOf(M, o).length && !M.objs.some(x => x.link === o.id)) err(objName(o) + ': нет второго конца', at);
      if (def.kind === 'moongate' && !exitsOf(M, o).length) warn('Лунные врата без пары той же луны', at);
      if (def.kind === 'whirlpool' && !exitsOf(M, o).length) warn('Водоворот без пары', at);
      if ((def.kind === 'quest' || def.kind === 'questgate') && !o.quest) err(objName(o) + ': задание не задано', at);
      if (o.t === 'sealgate' && !M.objs.some(x => x.t === 'sealer' && x.color === o.color)) warn('Застава печати без печатника своего цвета', at);
      if (o.t === 'prison' && o.hid && !H.HEROES.some(x => x.id === o.hid)) err('Неизвестный герой в остроге: ' + o.hid, at);
      if (def.kind === 'menhir' && !M.heart) warn('Менгир на карте без Сердца', at);
    }
    for (const list of [doc.goals.win, doc.goals.lose]) {
      for (const g of list) {
        if (g.kind === 'heart' && !M.heart) err('Цель «Сердце», но Сердце на карте не задано');
        if (g.kind === 'town' && !M.objs.some(o => o.id === g.town)) err('Цель ссылается на город, которого нет');
        if (g.kind === 'hero' && !H.HEROES.some(x => x.id === g.hid)) err('Цель ссылается на героя, которого нет');
      }
    }
    for (const text of H.Script.check(doc.scenes, doc.events, tags)) err(text);
    return out;
  };

  const blocking = list => list.filter(x => x.level === 'error');

  H.MapFile = { unreached, valuable, VERSION, GAME, SIZES, MAX_PLAYERS, blank, write, read, clone, sizeName, fromMade, whyNot, place, removeObj, brush, brushField, fill, river, objName, startOf, check, blocking, packCells, unpackCells };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
