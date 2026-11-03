(function (H) {
  'use strict';
  const MAX_OPS = 5000;
  const ALLY_LEVEL = 15;
  const CACHE = new Map();
  const NEED = { give: 2, take: 2, spawn: 4, reveal: 1, terrain: 3, flag: 2, gate: 2, moon: 1, scene: 1, set: 1, goal: 2, show: 2, hide: 1, say: 1, win: 0, lose: 0, deal: 2, aim: 1, keep: 1, army: 3, patrol: 2, team: 2, move: 3, recall: 5, road: 5, march: 2 };
  const EVENT_KINDS = {
    day: { name: 'Наступил день', args: 1 },
    week: { name: 'Наступила неделя', args: 1 },
    cell: { name: 'Герой встал на клетку', args: 2 },
    visit: { name: 'Герой посетил объект', args: 1 },
    defeat: { name: 'Разбит герой или отряд', args: 1 },
    capture: { name: 'Захвачен город или объект', args: 1 },
    res: { name: 'Накоплен ресурс', args: 2 },
    flag: { name: 'Поставлен флаг', args: 1 },
    built: { name: 'Построено здание', args: 1 },
    heroes: { name: 'Героев у игрока', args: 1 },
    caravan: { name: 'Обоз пришёл в город', args: 1 },
    done: { name: 'Выполнено задание объекта', args: 1 },
    arrive: { name: 'Отряд дошёл до конца пути', args: 1 },
    risen: { name: 'Поднято из кургана', args: 1 },
    army: { name: 'В войске есть существа', args: 2 }
  };
  const COND_KINDS = { flag: 1, day: 1, res: 2, owns: 1, beaten: 1, hero: 1, diff: 1, kept: 1, army: 1 };

  const tokens = line => {
    const out = [];
    const re = /"([^"]*)"|(\S+)/g;
    let m;
    while ((m = re.exec(line))) out.push(m[1] != null ? m[1] : m[2]);
    return out;
  };

  const parseWho = (words, e) => {
    for (let i = 0; i < words.length; i++) {
      if (words[i] === 'repeat') e.repeat = true;
      else if (words[i] === 'human' || words[i] === 'any') e.who = words[i];
      else if (words[i] === 'player' && /^\d+$/.test(words[i + 1] || '')) e.who = +words[++i];
      else return false;
    }
    return true;
  };

  const parseEvent = text => {
    const parts = text.split('->');
    if (parts.length !== 2) return null;
    const go = parts[1].trim(), w = tokens(parts[0]), kind = w.shift();
    if (!EVENT_KINDS[kind] || !/^[\w-]+$/.test(go)) return null;
    const e = { on: kind, go };
    if (kind === 'day' || kind === 'week') {
      if (!/^\d+$/.test(w[0] || '')) return null;
      e.day = kind === 'day' ? +w.shift() : (+w.shift() - 1) * 7 + 1;
      e.on = 'day';
    } else if (kind === 'cell') {
      if (!/^\d+$/.test(w[0] || '') || !/^\d+$/.test(w[1] || '')) return null;
      e.c = +w.shift();
      e.r = +w.shift();
      e.l = /^\d+$/.test(w[0] || '') ? +w.shift() : 0;
    } else if (kind === 'res') {
      if (!w[0] || !/^\d+$/.test(w[1] || '')) return null;
      e.res = w.shift();
      e.n = +w.shift();
    } else if (kind === 'flag') {
      if (!w[0]) return null;
      e.flag = w.shift();
    } else if (kind === 'built') {
      if (!w[0]) return null;
      e.building = w.shift();
    } else if (kind === 'army') {
      if (!w[0] || !/^\d+$/.test(w[1] || '')) return null;
      e.unit = w.shift();
      e.n = +w.shift();
    } else if (kind === 'heroes' || kind === 'risen') {
      if (!/^\d+$/.test(w[0] || '')) return null;
      e.n = +w.shift();
    } else {
      if (!w[0]) return null;
      e.tag = w.shift();
    }
    return parseWho(w, e) ? e : null;
  };

  const eventText = e => {
    const tail = (e.who != null && e.who !== 'human' ? (typeof e.who === 'number' ? ' player ' + e.who : ' ' + e.who) : '') + (e.repeat ? ' repeat' : '') + ' -> ' + e.go;
    if (e.on === 'day') return 'day ' + e.day + tail;
    if (e.on === 'cell') return 'cell ' + e.c + ' ' + e.r + ' ' + (e.l || 0) + tail;
    if (e.on === 'res') return 'res ' + e.res + ' ' + e.n + tail;
    if (e.on === 'flag') return 'flag ' + e.flag + tail;
    if (e.on === 'built') return 'built ' + e.building + tail;
    if (e.on === 'heroes') return 'heroes ' + e.n + tail;
    if (e.on === 'risen') return 'risen ' + e.n + tail;
    if (e.on === 'army') return 'army ' + e.unit + ' ' + e.n + tail;
    return e.on + ' ' + e.tag + tail;
  };

  const parseCond = w => {
    const not = w[0] === 'not', rest = not ? w.slice(1) : w, kind = rest[0], n = COND_KINDS[kind];
    if (n == null || rest.length !== n + 1) return null;
    return { not, kind, a: rest.slice(1) };
  };

  const parse = text => {
    const src = text || '';
    if (CACHE.has(src)) return CACHE.get(src);
    const P = { ops: [], labels: {}, errors: [], events: [] }, blocks = [];
    let label = null, count = 0;
    const bad = (i, why) => P.errors.push({ line: i + 1, text: why });
    src.split(/\r?\n/).forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      if (line[0] === '@') {
        const name = line.slice(1);
        if (!/^[\w-]+$/.test(name)) return bad(i, 'Плохое имя метки: ' + line);
        if (P.labels[name] != null) return bad(i, 'Метка повторяется: ' + name);
        if (blocks.length) bad(i, 'Блок перед меткой не закрыт словом end');
        blocks.length = 0;
        if (label) P.ops.push({ k: 'end', line: i + 1 });
        P.labels[name] = P.ops.length;
        label = name;
        count = 0;
        return;
      }
      const first = line.split(/\s+/, 1)[0];
      if (first === 'event') {
        const e = parseEvent(line.slice(5));
        if (!e) return bad(i, 'Плохое событие: ' + line);
        P.events.push(e);
        return;
      }
      if (!label) return bad(i, 'Строка вне метки: ' + line);
      const top = blocks[blocks.length - 1];
      if (top && top.k === 'choice' && line[0] === '-') {
        const at = line.lastIndexOf('->'), said = (at > 0 ? line.slice(1, at) : line.slice(1)).trim(), go = at > 0 ? line.slice(at + 2).trim() : null;
        if (!said) return bad(i, 'Пустой ответ');
        top.op.opts.push({ text: said, go, id: label + '.' + count++, line: i + 1 });
        return;
      }
      if (first === 'end') {
        if (!blocks.length) {
          P.ops.push({ k: 'end', line: i + 1 });
          return;
        }
        const b = blocks.pop();
        if (b.k === 'choice' && !b.op.opts.length) bad(i, 'В выборе нет ответов');
        (b.jump || b.op).to = P.ops.length;
        return;
      }
      if (top && top.k === 'choice') return bad(i, 'В выборе ждём строку с тире или end');
      if (first === 'else') {
        if (!top || top.k !== 'if' || top.jump) return bad(i, 'else без if');
        const jump = { k: 'jump', line: i + 1, to: 0 };
        P.ops.push(jump);
        top.op.to = P.ops.length;
        top.jump = jump;
        return;
      }
      if (first === 'if') {
        const cond = parseCond(tokens(line).slice(1));
        if (!cond) return bad(i, 'Плохое условие: ' + line);
        const op = { k: 'if', cond, line: i + 1, to: 0 };
        P.ops.push(op);
        blocks.push({ k: 'if', op });
        return;
      }
      if (first === 'choice') {
        const op = { k: 'choice', opts: [], id: label + '.' + count++, line: i + 1, to: 0 };
        P.ops.push(op);
        blocks.push({ k: 'choice', op });
        return;
      }
      const speech = /^([^\s:"]+):\s*(.+)$/.exec(line);
      if (speech && NEED[speech[1]] == null) {
        P.ops.push({ k: 'line', who: speech[1], text: speech[2], id: label + '.' + count++, line: i + 1 });
        return;
      }
      const w = tokens(line), cmd = w.shift();
      if (NEED[cmd] == null) return bad(i, 'Неизвестная команда: ' + cmd);
      if (w.length < NEED[cmd]) return bad(i, 'Мало слов в команде: ' + line);
      if (cmd === 'say') P.ops.push({ k: 'line', who: null, text: w.join(' '), id: label + '.' + count++, line: i + 1 });
      else {
        const quoted = /"([^"]*)"/.exec(line);
        P.ops.push({ k: 'cmd', cmd, a: w, quoted: quoted ? quoted[1] : null, line: i + 1 });
      }
    });
    if (blocks.length) P.errors.push({ line: src.split(/\r?\n/).length, text: 'Блок не закрыт словом end' });
    if (label) P.ops.push({ k: 'end', line: 0 });
    CACHE.set(src, P);
    if (CACHE.size > 40) CACHE.delete(CACHE.keys().next().value);
    return P;
  };

  const block = (text, label) => {
    const lines = (text || '').split(/\r?\n/), at = lines.findIndex(s => s.trim() === '@' + label);
    if (at < 0) return '';
    const out = [];
    for (let i = at + 1; i < lines.length && lines[i].trim()[0] !== '@' && !/^\s*event\s/.test(lines[i]); i++) out.push(lines[i]);
    while (out.length && !out[out.length - 1].trim()) out.pop();
    return out.join('\n');
  };
  const setBlock = (text, label, body) => {
    const lines = (text || '').split(/\r?\n/), at = lines.findIndex(s => s.trim() === '@' + label), fresh = ['@' + label, ...body.split(/\r?\n/).filter(s => s.trim())];
    if (at < 0) return [...lines.filter((s, i) => s.trim() || i < lines.length - 1), ...fresh].join('\n');
    let stop = at + 1;
    while (stop < lines.length && lines[stop].trim()[0] !== '@' && !/^\s*event\s/.test(lines[stop])) stop++;
    lines.splice(at, stop - at, ...fresh);
    return lines.join('\n');
  };
  const dropBlock = (text, label) => {
    const lines = (text || '').split(/\r?\n/), at = lines.findIndex(s => s.trim() === '@' + label);
    if (at < 0) return text || '';
    let stop = at + 1;
    while (stop < lines.length && lines[stop].trim()[0] !== '@' && !/^\s*event\s/.test(lines[stop])) stop++;
    lines.splice(at, stop - at);
    return lines.join('\n');
  };

  const eventsOf = M => {
    const own = M.events || [];
    return M.scenes ? [...own, ...parse(M.scenes).events] : own;
  };
  const tagged = (S, tag) => S.map.objs.find(o => o.tag === tag) || null;
  const ownerKey = e => e.tag + '/' + (e.who == null ? 'human' : e.who);
  const taggedHero = (S, tag) => S.heroes.find(h => h.tag === tag) || null;

  const init = (S, slots) => {
    S.scene = null;
    S.script = { flags: {}, done: [], goals: [], read: [], queue: [], run: null, slots: slots || null, hero: null, owners: {}, aims: {} };
    for (const e of eventsOf(S.map)) {
      if (e.on !== 'capture') continue;
      const o = tagged(S, e.tag);
      S.script.owners[ownerKey(e)] = o ? o.owner : -1;
    }
  };

  const pidOf = (S, index) => {
    const map = S.script.slots;
    if (!map) return index < S.players.length ? index : -1;
    return map[index] == null ? -1 : map[index];
  };
  const whoFits = (S, who, pid) => {
    if (who === 'any') return true;
    if (typeof who === 'number') return pidOf(S, who) === pid;
    return pid >= 0 && !!S.players[pid] && S.players[pid].human;
  };
  const anyHuman = S => S.players.some(p => p.human && !p.out);
  const firstHuman = S => Math.max(0, S.players.findIndex(p => p.human && !p.out));

  const heroOf = (S, run, pid) => {
    const own = run.hero != null ? S.heroes[run.hero] : null;
    if (own && own.alive && own.owner === pid) return own;
    return S.heroes.find(h => h.alive && h.owner === pid) || null;
  };

  const condTrue = (S, cond, run) => {
    const a = cond.a, pid = run.actor;
    let v = false;
    if (cond.kind === 'flag') v = !!S.script.flags[a[0]];
    else if (cond.kind === 'day') v = S.day >= +a[0];
    else if (cond.kind === 'res') v = S.players[pid].res[a[0]] >= +a[1];
    else if (cond.kind === 'owns') {
      const o = tagged(S, a[0]);
      v = !!o && o.owner === pid;
    } else if (cond.kind === 'beaten') {
      const o = tagged(S, a[0]), h = taggedHero(S, a[0]);
      v = (!!o && !!o.gone) || (!!h && !h.alive);
    } else if (cond.kind === 'hero') {
      const h = run.hero != null ? S.heroes[run.hero] : null;
      v = !!h && h.tag === a[0];
    } else if (cond.kind === 'diff') v = S.difficulty === a[0];
    else if (cond.kind === 'kept') v = !!S.campaign && !!S.campaign.flags[a[0]];
    else if (cond.kind === 'army') v = S.heroes.some(h => h.alive && h.owner === pid && h.army.some(s => s && s.unit === a[0]));
    return cond.not ? !v : v;
  };

  const playerArg = (S, a, run) => {
    const i = a.indexOf('player');
    if (i < 0) return run.actor;
    const pid = pidOf(S, +a[i + 1]);
    a.splice(i, 2);
    return pid;
  };

  const addUnits = (hero, unit, n) => {
    const slot = H.Hero.slotFor(hero.army, unit);
    if (slot >= 0) H.Hero.addTo(hero.army, slot, { unit, count: n, stars: 0, vet: 0 });
  };
  const takeUnits = (hero, unit, n) => {
    let left = n;
    hero.army.forEach((s, i) => {
      if (!s || s.unit !== unit || !left) return;
      const k = Math.min(left, s.count);
      left -= k;
      hero.army[i] = s.count > k ? Object.assign({}, s, { count: s.count - k }) : null;
    });
  };
  const takeArt = (hero, id) => {
    for (const slot of Object.keys(hero.arts)) {
      if (hero.arts[slot] === id) {
        hero.arts[slot] = null;
        return;
      }
    }
    const i = hero.bag.indexOf(id);
    if (i >= 0) hero.bag.splice(i, 1);
  };

  const give = (S, a, run, ev) => {
    const args = a.slice(), pid = playerArg(S, args, run), kind = args[0];
    if (pid < 0 || !S.players[pid]) return;
    const res = S.players[pid].res;
    if (res[kind] != null) {
      res[kind] += +args[1];
      ev.push({ t: 'gain', hero: run.hero, res: { [kind]: +args[1] }, xp: 0, player: pid });
      return;
    }
    const hero = heroOf(S, run, pid);
    if (!hero) return;
    if (kind === 'art' && H.Hero.giveArt(hero, args[1])) ev.push({ t: 'artifact', hero: hero.id, art: args[1] });
    else if (kind === 'xp') H.Hero.addXp(hero, +args[1]);
    else if (kind === 'unit') addUnits(hero, args[1], +args[2]);
    else if (kind === 'spell' && !hero.spells.includes(args[1])) hero.spells.push(args[1]);
  };
  const take = (S, a, run) => {
    const args = a.slice(), pid = playerArg(S, args, run), kind = args[0];
    if (pid < 0 || !S.players[pid]) return;
    const res = S.players[pid].res;
    if (res[kind] != null) {
      res[kind] = Math.max(0, res[kind] - +args[1]);
      return;
    }
    const hero = heroOf(S, run, pid);
    if (!hero) return;
    if (kind === 'art') takeArt(hero, args[1]);
    else if (kind === 'unit') takeUnits(hero, args[1], +args[2]);
    else if (kind === 'spell') hero.spells = hero.spells.filter(id => id !== args[1]);
  };

  const spawn = (S, a, run) => {
    const [what, id] = a, M = S.map;
    if (what === 'mirror') {
      const hero = heroOf(S, run, run.actor), best = hero ? hero.army.filter(Boolean).reduce((x, s) => (!x || s.count * H.UNITS[s.unit].cost > x.count * H.UNITS[x.unit].cost ? s : x), null) : null;
      if (!best) return;
      const count = Math.max(1, Math.round(best.count * +id));
      H.MapData.add(M, { t: 'monster', c: +a[2], r: +a[3], l: +(a[4] || 0), owner: -1, unit: best.unit, count, max: count, mood: 'fierce', tag: a[5] || undefined });
    } else if (what === 'monster') {
      const count = +a[2], mood = a[3], c = +a[4], r = +a[5], l = +(a[6] || 0);
      H.MapData.add(M, { t: 'monster', c, r, l, owner: -1, unit: id, count, max: count * 3, mood, tag: a[7] || undefined });
    } else if (what === 'obj') {
      const c = +a[2], r = +a[3], l = +(a[4] || 0);
      H.MapData.add(M, { t: id, c, r, l, owner: -1, tag: a[5] || undefined });
    } else if (what === 'hero') {
      const pid = pidOf(S, +a[2]), rec = H.HEROES.find(x => x.id === id);
      if (pid < 0 || !rec) return;
      const c = +a[3], r = +a[4], l = +(a[5] || 0);
      const army = rec.army.map(([unit, lo, hi]) => ({ unit, count: Math.round((lo + hi) / 2) }));
      H.Adv.addHero(S, { owner: pid, hid: rec.id, name: rec.name, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, c, r, l, army, tag: a[6] || undefined });
    }
    S.ver++;
  };

  const march = (S, a, ev) => {
    const M = S.map, mob = M.objs.find(o => !o.gone && o.t === 'monster' && o.tag === a[0]), goal = tagged(S, a[1]);
    if (!mob || !goal) return;
    const e = H.MapData.entry(goal) || [goal.c, goal.r], g = H.Adv.grid(S, mob.l, null), end = e[1] * M.w + e[0], byId = new Map(M.objs.map(o => [o.id, o]));
    const cost = i => {
      const o = g.block[i] ? byId.get(g.block[i]) : null;
      return o && o.t !== 'monster' ? 0 : H.MapData.groundCost(M, mob.l, i % M.w, (i / M.w) | 0);
    };
    const found = H.Path.find(M.w, M.h, mob.r * M.w + mob.c, new Set([end]), cost, () => false, 0.6);
    if (!found) return;
    mob.route = found.cells.filter(i => i !== end).map(i => [i % M.w, (i / M.w) | 0]);
    mob.routeAt = 0;
    mob.routeDone = false;
    mob.pace = +(a[2] || 6);
    S.ver++;
    ev.push({ t: 'routes' });
  };

  const recall = (S, a, run, ev) => {
    const args = a.slice(), pid = playerArg(S, args, run), rec = H.HEROES.find(x => x.id === args[0]);
    if (pid < 0 || !rec || S.heroes.some(h => h.alive && h.hid === rec.id)) return;
    const h = H.Adv.addHero(S, { owner: pid, hid: rec.id, name: rec.name, cls: rec.cls, faction: H.CLASSES[rec.cls].faction, c: +args[1], r: +args[2], l: +args[3], army: rec.army.map(([unit, lo, hi]) => ({ unit, count: hi })), tag: args[4] });
    const carry = S.campaign && S.campaign.allies && S.campaign.allies[rec.id];
    if (carry) H.Campaign.carryInto(h, carry);
    else if (H.Campaign.RING.some(x => x.hero === rec.id)) {
      H.Hero.addXp(h, H.XP_TABLE[ALLY_LEVEL]);
      H.Hero.autoUp(S, h);
    }
    h.steps = H.Adv.daySteps(S, h);
    S.ver++;
    ev.push({ t: 'freed', hero: h.id });
  };

  const reveal = (S, a, run) => {
    const args = a.slice(), pid = playerArg(S, args, run);
    if (pid < 0) return;
    if (args[0] === 'all') {
      for (const seen of S.players[pid].seen) seen.fill(1);
    } else H.Adv.reveal(S, pid, +(args[3] || 0), +args[0], +args[1], +(args[2] || 5));
    S.ver++;
  };

  const terrain = (S, a, ev) => {
    const c0 = +a[1], r0 = +a[2], w = +(a[3] || 1), h = +(a[4] || 1), l = +(a[5] || 0), only = a[6] ? H.TERRAIN_INDEX[a[6]] : null, M = S.map;
    H.MapData.paint(M, l, a[0], (c, r) => c >= c0 && r >= r0 && c < c0 + w && r < r0 + h && (only == null || M.ter[l][H.MapData.idx(M, c, r)] === only));
    H.AI.forget(S.map);
    S.ver++;
    ev.push({ t: 'terrain' });
  };

  const road = (S, a, ev) => {
    const M = S.map, kind = +a[0], c0 = +a[1], r0 = +a[2], w = +a[3], h = +a[4], l = +(a[5] || 0);
    for (let r = r0; r < r0 + h; r++) for (let c = c0; c < c0 + w; c++) if (H.MapData.inside(M, c, r)) M.road[l][H.MapData.idx(M, c, r)] = kind;
    H.AI.forget(M);
    S.ver++;
    ev.push({ t: 'terrain' });
  };

  const gate = (S, a, ev) => {
    const o = tagged(S, a[1]);
    if (!o) return;
    if (a[0] === 'close' && H.Adv.heroAt(S, o.l, o.c, o.r)) return;
    o.gone = a[0] === 'open';
    H.AI.forget(S.map);
    S.ver++;
    ev.push({ t: 'terrain' });
  };

  const goal = (S, a, ev) => {
    const st = S.script, op = a[0], id = a[1];
    if (op === 'add') {
      if (st.goals.some(g => g.id === id)) return;
      const to = a.indexOf('to'), stay = a.indexOf('stay'), rec = { id, text: (to > 0 ? a.slice(2, to) : stay > 0 ? a.slice(2, stay) : a.slice(2)).join(' ') || id, state: 'open', targets: to > 0 ? a.slice(to + 1) : stay > 0 ? [a[stay + 1]] : [] };
      if (stay > 0) rec.hold = a[stay + 1];
      st.goals.push(rec);
      ev.push({ t: 'goal', text: rec.text, state: rec.state });
    } else if (op === 'safe') {
      const o = tagged(S, id);
      if (o) S.goals.lose = S.goals.lose.filter(g => !(g.kind === 'town' && g.town === o.id));
    } else if (op === 'point') {
      const g = st.goals.find(x => x.id === id);
      if (g) g.targets = a.slice(2);
    } else if (op === 'done' || op === 'fail') {
      const g = st.goals.find(x => x.id === id);
      if (g && g.state !== op) {
        g.state = op;
        ev.push({ t: 'goal', text: g.text, state: op });
      }
    } else if (op === 'win' || op === 'lose') {
      const rec = { kind: id }, arg = a[2];
      if (id === 'gold') rec.n = +arg;
      else if (id === 'day') rec.day = +arg;
      else if (id === 'hero') rec.hid = arg;
      else if (id === 'flag') {
        rec.flag = arg;
        rec.text = a.slice(3).join(' ') || arg;
      } else if (id === 'town') {
        const o = tagged(S, arg);
        if (!o) return;
        rec.town = o.id;
      }
      if (op === 'win') S.goals.win = [rec];
      else S.goals.lose.push(rec);
    }
  };

  const aim = (S, a, run) => {
    const args = a.slice(), pid = playerArg(S, args, run);
    if (pid < 0) return;
    S.script.aims = S.script.aims || {};
    S.script.aims[pid] = args[0] === 'none' ? [] : args;
  };
  const keep = (S, a) => {
    if (S.campaign) S.campaign.flags[a[0]] = 1;
  };
  const moveHero = (S, a, ev) => {
    const h = taggedHero(S, a[0]), c = +a[1], r = +a[2], l = +(a[3] || 0);
    if (!h || !h.alive || !H.MapData.inside(S.map, c, r) || H.Adv.heroAt(S, l, c, r)) return;
    Object.assign(h, { c, r, l });
    if (h.patrol) Object.assign(h.patrol, { c, r, l });
    S.ver++;
    ev.push({ t: 'teleport', hero: h.id });
  };

  const army = (S, a) => {
    const h = taggedHero(S, a[0]), town = tagged(S, a[0]), rows = h && h.alive ? h.army : town ? town.garrison : null;
    if (!rows) return;
    for (let i = 1; i + 1 < a.length; i += 2) addUnits({ army: rows }, a[i], +a[i + 1]);
    S.ver++;
  };

  const finishGame = (S, a, run, won, ev) => {
    const args = a.slice(), pid = args.length ? pidOf(S, +args[args.indexOf('player') + 1]) : (S.players[run.actor] && S.players[run.actor].human ? run.actor : firstHuman(S));
    if (won) S.over = { winner: pid, why: 'script' };
    else S.over = { winner: -1, why: 'lost' };
    ev.push({ t: 'over', winner: S.over.winner, why: S.over.why });
  };

  const command = (S, op, run, ev) => {
    const a = op.a;
    if (op.cmd === 'give') give(S, a, run, ev);
    else if (op.cmd === 'take') take(S, a, run);
    else if (op.cmd === 'set') S.script.flags[a[0]] = a[1] === '0' ? 0 : 1;
    else if (op.cmd === 'spawn') spawn(S, a, run);
    else if (op.cmd === 'reveal') reveal(S, a, run);
    else if (op.cmd === 'terrain') terrain(S, a, ev);
    else if (op.cmd === 'gate') gate(S, a, ev);
    else if (op.cmd === 'recall') recall(S, a, run, ev);
    else if (op.cmd === 'road') road(S, a, ev);
    else if (op.cmd === 'march') march(S, a, ev);
    else if (op.cmd === 'goal') goal(S, a, ev);
    else if (op.cmd === 'deal') H.Contracts.grant(S, run.actor, a);
    else if (op.cmd === 'aim') aim(S, a, run);
    else if (op.cmd === 'keep') keep(S, a);
    else if (op.cmd === 'team') {
      const p = S.players[pidOf(S, +a[0])];
      if (p) p.team = +a[1];
      S.ver++;
    }
    else if (op.cmd === 'patrol') {
      const h = taggedHero(S, a[0]), rad = +a[1];
      if (h) h.patrol = rad > 0 ? { c: h.c, r: h.r, l: h.l, rad } : undefined;
    }
    else if (op.cmd === 'army') army(S, a);
    else if (op.cmd === 'move') moveHero(S, a, ev);
    else if (op.cmd === 'moon') {
      if (S.moons && H.Moons.byId[a[0]]) S.moons[H.Moons.weekOf(S) % S.moons.length] = a[0];
      S.ver++;
    } else if (op.cmd === 'flag') {
      const o = tagged(S, a[0]);
      if (o) o.owner = a[1] === '-1' ? -1 : pidOf(S, +a[1]);
      S.ver++;
    } else if (op.cmd === 'show') {
      run.shown = run.shown.filter(x => x.id !== a[0] && x.side !== a[1]);
      run.shown.push({ id: a[0], side: a[1], name: op.quoted });
    } else if (op.cmd === 'hide') run.shown = run.shown.filter(x => x.id !== a[0]);
    else if (op.cmd === 'win') finishGame(S, a, run, true, ev);
    else if (op.cmd === 'lose') finishGame(S, a, run, false, ev);
  };

  const speakerName = (run, who) => {
    if (!who) return '';
    const shown = run.shown.find(x => x.id === who);
    if (shown && shown.name) return shown.name;
    const rec = H.HEROES.find(x => x.id === who);
    return rec ? rec.name : H.PEOPLE[who] || who[0].toUpperCase() + who.slice(1);
  };

  const exec = (S, ev) => {
    const st = S.script, P = parse(S.map.scenes);
    let guard = 0;
    while (st.run) {
      const run = st.run, op = P.ops[run.pc];
      if (++guard > MAX_OPS) {
        ev.push({ t: 'note', text: 'Сцена зациклена и прервана', color: '#ff9080' });
        st.run = null;
        break;
      }
      if (!op || op.k === 'end') {
        if (run.stack.length) run.pc = run.stack.pop();
        else st.run = null;
        if (!st.run && st.queue.length) {
          const q = st.queue.shift();
          begin(S, q.label, q.ctx);
        }
        continue;
      }
      if (S.over) {
        st.run = null;
        st.queue = [];
        break;
      }
      run.pc++;
      if (op.k === 'jump') run.pc = op.to;
      else if (op.k === 'if') {
        if (!condTrue(S, op.cond, run)) run.pc = op.to;
      } else if (op.k === 'cmd' && op.cmd === 'scene') {
        if (P.labels[op.a[0]] != null) {
          run.stack.push(run.pc);
          run.pc = P.labels[op.a[0]];
        }
      } else if (op.k === 'cmd') command(S, op, run, ev);
      else if (op.k === 'line' && anyHuman(S)) {
        S.scene = { who: op.who, name: speakerName(run, op.who), text: op.text, id: op.id, shown: run.shown.map(x => Object.assign({}, x)), choice: null, seen: st.read.includes(op.id) };
        ev.push({ t: 'scene' });
        return;
      } else if (op.k === 'choice') {
        if (!anyHuman(S)) {
          const first = op.opts[0];
          run.pc = first.go && P.labels[first.go] != null ? P.labels[first.go] : op.to;
          continue;
        }
        S.scene = { who: null, name: '', text: '', id: op.id, shown: run.shown.map(x => Object.assign({}, x)), choice: op.opts.map(x => x.text), at: run.pc - 1, seen: false };
        ev.push({ t: 'scene' });
        return;
      }
    }
  };

  const begin = (S, label, ctx) => {
    const P = parse(S.map.scenes);
    if (P.labels[label] == null) return false;
    S.script.run = { pc: P.labels[label], stack: [], actor: ctx.pid != null && ctx.pid >= 0 ? ctx.pid : firstHuman(S), hero: ctx.hero == null ? null : ctx.hero, shown: [] };
    return true;
  };

  const start = (S, label, ctx, ev) => {
    if (S.script.run) {
      S.script.queue.push({ label, ctx });
      return;
    }
    if (begin(S, label, ctx)) exec(S, ev);
  };

  const fire = (S, e, i, ctx, ev) => {
    if (!e.repeat) S.script.done.push(i);
    start(S, e.go, ctx, ev);
  };

  const on = (S, kind, ctx, ev) => {
    const list = eventsOf(S.map);
    if (!list.length) return;
    list.forEach((e, i) => {
      if (e.on !== kind || S.script.done.includes(i) || !whoFits(S, e.who, ctx.pid)) return;
      if (kind === 'cell' && (e.c !== ctx.c || e.r !== ctx.r || (e.l || 0) !== ctx.l)) return;
      if ((kind === 'visit' || kind === 'caravan') && e.tag !== ctx.tag) return;
      fire(S, e, i, ctx, ev);
    });
  };

  const pollOne = (S, e) => {
    if (e.on === 'day') return S.day >= e.day ? { pid: firstHuman(S) } : null;
    if (e.on === 'flag') return S.script.flags[e.flag] ? { pid: firstHuman(S) } : null;
    if (e.on === 'built') {
      const p = S.players.find(q => !q.out && whoFits(S, e.who, q.id) && H.Town.list(S, q.id).some(t => t.built.includes(e.building)));
      return p ? { pid: p.id } : null;
    }
    if (e.on === 'heroes') {
      const p = S.players.find(q => !q.out && whoFits(S, e.who, q.id) && S.heroes.filter(h => h.alive && h.owner === q.id).length >= e.n);
      return p ? { pid: p.id } : null;
    }
    if (e.on === 'risen') {
      const p = S.players.find(q => !q.out && whoFits(S, e.who, q.id) && (q.risen || 0) >= e.n);
      return p ? { pid: p.id } : null;
    }
    if (e.on === 'army') {
      const p = S.players.find(q => !q.out && whoFits(S, e.who, q.id) && S.heroes.some(h => h.alive && h.owner === q.id && h.army.some(s => s && s.unit === e.unit && s.count >= e.n)));
      return p ? { pid: p.id } : null;
    }
    if (e.on === 'done') {
      const o = tagged(S, e.tag), p = o && S.players.find(q => whoFits(S, e.who, q.id) && (o.done || []).includes(q.id));
      return p ? { pid: p.id } : null;
    }
    if (e.on === 'arrive') {
      const o = tagged(S, e.tag);
      return o && o.routeDone && !o.gone ? { pid: firstHuman(S) } : null;
    }
    if (e.on === 'res') {
      const p = S.players.find(q => !q.out && whoFits(S, e.who, q.id) && q.res[e.res] >= e.n);
      return p ? { pid: p.id } : null;
    }
    if (e.on === 'defeat') {
      const o = tagged(S, e.tag), h = taggedHero(S, e.tag), fell = (!!o && (!!o.gone || !!o.looted)) || (!!h && !h.alive);
      if (!fell) return null;
      const by = S.turn;
      return e.who == null || e.who === 'any' || whoFits(S, e.who, by) ? { pid: by, hero: S.script.hero } : null;
    }
    if (e.on === 'capture') {
      const o = tagged(S, e.tag);
      const key = ownerKey(e), seen = key in S.script.owners ? S.script.owners[key] : S.script.owners[e.tag];
      if (!o || o.owner === seen) return null;
      S.script.owners[key] = o.owner;
      return o.owner < 0 || !whoFits(S, e.who, o.owner) ? null : { pid: o.owner };
    }
    return null;
  };

  const poll = (S, ev) => {
    const list = eventsOf(S.map);
    if (!list.length) return;
    let changed = true, guard = 0;
    while (changed && guard++ < 50) {
      changed = false;
      list.forEach((e, i) => {
        if (S.script.done.includes(i) || S.over) return;
        const ctx = pollOne(S, e);
        if (!ctx) return;
        fire(S, e, i, ctx, ev);
        changed = true;
      });
    }
  };

  const advance = (S, answer) => {
    const ev = [], scene = S.scene, st = S.script;
    if (!scene) return ev;
    if (scene.id && !st.read.includes(scene.id)) st.read.push(scene.id);
    S.scene = null;
    if (scene.choice && st.run) {
      const P = parse(S.map.scenes), op = P.ops[scene.at], pick = op.opts[answer] || op.opts[0];
      st.run.pc = pick.go && P.labels[pick.go] != null ? P.labels[pick.go] : op.to;
    }
    exec(S, ev);
    if (!S.scene) H.Adv.conclude(S, ev);
    return ev;
  };

  const opening = S => {
    const ev = [];
    if (eventsOf(S.map).length) H.Adv.conclude(S, ev);
    return ev;
  };

  const labelsUsed = P => {
    const out = [];
    for (const op of P.ops) {
      if (op.k === 'cmd' && op.cmd === 'scene') out.push({ label: op.a[0], line: op.line });
      if (op.k === 'choice') for (const x of op.opts) if (x.go) out.push({ label: x.go, line: x.line });
    }
    return out;
  };

  const checkCommand = (op, known, say) => {
    const a = op.a, res = H.RESOURCES.map(r => r[0]), L = 'Строка ' + op.line + ': ';
    if (op.cmd === 'give' || op.cmd === 'take') {
      const kind = a[0];
      if (res.includes(kind) || kind === 'xp') return;
      if (kind === 'art' && !H.ARTIFACTS[a[1]]) say(L + 'нет артефакта ' + a[1]);
      else if (kind === 'unit' && !H.UNITS[a[1]]) say(L + 'нет существа ' + a[1]);
      else if (kind === 'spell' && !H.SPELLS[a[1]]) say(L + 'нет заклинания ' + a[1]);
      else if (!['art', 'unit', 'spell'].includes(kind)) say(L + 'не знаю, что дать: ' + kind);
    } else if (op.cmd === 'spawn') {
      if (a[0] === 'monster' && !H.UNITS[a[1]]) say(L + 'нет существа ' + a[1]);
      else if (a[0] === 'monster' && !H.MAP.mood[a[3]]) say(L + 'нет нрава ' + a[3]);
      else if (a[0] === 'hero' && !H.HEROES.some(x => x.id === a[1])) say(L + 'нет героя ' + a[1]);
      else if (a[0] === 'obj' && !H.OBJ[a[1]]) say(L + 'нет объекта ' + a[1]);
      else if (!['monster', 'hero', 'obj', 'mirror'].includes(a[0])) say(L + 'не знаю, что поставить: ' + a[0]);
    } else if (op.cmd === 'terrain') {
      if (H.TERRAIN_INDEX[a[0]] == null) say(L + 'нет местности ' + a[0]);
      else if (a[6] && H.TERRAIN_INDEX[a[6]] == null) say(L + 'нет местности ' + a[6]);
    } else if (op.cmd === 'recall') {
      if (!H.HEROES.some(x => x.id === a[0])) say(L + 'нет героя ' + a[0]);
      else if (![1, 2, 3].every(i => /^\d+$/.test(a[i]))) say(L + 'recall: герой, клетка, уровень и метка');
    } else if (op.cmd === 'road') {
      if (!/^[0-3]$/.test(a[0])) say(L + 'дорога бывает 0, 1, 2 или 3');
      else if (![1, 2, 3, 4].every(i => /^\d+$/.test(a[i]))) say(L + 'road: вид, клетка, ширина и высота');
    } else if (op.cmd === 'march') {
      if (a[2] && !/^\d+$/.test(a[2])) say(L + 'march: отряд, цель и шагов в день');
    } else if (op.cmd === 'flag') {
      if (!known.tags.has(a[0])) say(L + 'нет метки ' + a[0]);
    } else if (op.cmd === 'gate') {
      if (a[0] !== 'open' && a[0] !== 'close') say(L + 'проход можно открыть или закрыть');
      else if (!known.tags.has(a[1])) say(L + 'нет метки ' + a[1]);
    } else if (op.cmd === 'moon') {
      if (!H.Moons.byId[a[0]]) say(L + 'нет луны ' + a[0]);
    } else if (op.cmd === 'goal') {
      if (!['add', 'done', 'fail', 'win', 'lose', 'point', 'safe'].includes(a[0])) say(L + 'нет действия с целью: ' + a[0]);
      else if (a[0] === 'safe' && !known.tags.has(a[1])) say(L + 'нет метки ' + a[1]);
      else if ((a[0] === 'done' || a[0] === 'fail' || a[0] === 'point') && !known.goals.has(a[1])) say(L + 'нет цели ' + a[1]);
      else if (a[0] === 'win' && !H.Adv.WIN[a[1]]) say(L + 'нет условия победы ' + a[1]);
      else if (a[0] === 'lose' && !H.Adv.LOSE[a[1]]) say(L + 'нет условия поражения ' + a[1]);
      else if ((a[0] === 'win' || a[0] === 'lose') && a[1] === 'town' && !known.tags.has(a[2])) say(L + 'нет метки ' + a[2]);
    } else if (op.cmd === 'show') {
      if (a[1] !== 'left' && a[1] !== 'right') say(L + 'сторона только left или right');
    } else if (op.cmd === 'deal') {
      if (a[0] !== 'hire' && a[0] !== 'bounty' && a[0] !== 'supply') say(L + 'нет такого контракта: ' + a[0]);
      else if (a[0] === 'supply' && !H.RESOURCES.some(r => r[0] === a[1])) say(L + 'нет ресурса ' + a[1]);
      else if (a[0] !== 'supply' && !known.tags.has(a[1])) say(L + 'нет метки ' + a[1]);
    } else if (op.cmd === 'army') {
      if (!known.tags.has(a[0])) say(L + 'нет метки ' + a[0]);
      for (let i = 1; i + 1 < a.length; i += 2) if (!H.UNITS[a[i]]) say(L + 'нет существа ' + a[i]);
    } else if (op.cmd === 'team') {
      if (!/^\d+$/.test(a[0]) || !/^\d+$/.test(a[1])) say(L + 'team: номер игрока и номер союза');
    } else if (op.cmd === 'patrol') {
      if (!known.tags.has(a[0])) say(L + 'нет метки ' + a[0]);
      if (!/^\d+$/.test(a[1])) say(L + 'радиус обхода должен быть числом');
    } else if (op.cmd === 'move') {
      if (!known.tags.has(a[0])) say(L + 'нет метки ' + a[0]);
      if (!/^\d+$/.test(a[1]) || !/^\d+$/.test(a[2])) say(L + 'move: метка героя и клетка');
    } else if (op.cmd === 'aim') {
      const list = a[0] === 'player' ? a.slice(2) : a;
      for (const tag of list) if (tag !== 'none' && !known.tags.has(tag)) say(L + 'нет метки ' + tag);
    }
  };

  const check = (scenes, events, tags) => {
    const P = parse(scenes), all = new Set(tags), out = [], known = { tags: all, goals: new Set(), flags: new Set() };
    const say = text => out.push(text);
    for (const e of P.errors) say('Строка ' + e.line + ': ' + e.text);
    for (const op of P.ops) {
      if (op.k !== 'cmd') continue;
      if (op.cmd === 'goal' && op.a[0] === 'add') known.goals.add(op.a[1]);
      if (op.cmd === 'set') known.flags.add(op.a[0]);
      if (op.cmd === 'spawn') {
        const at = { monster: 7, obj: 5, hero: 6, mirror: 5 }[op.a[0]];
        if (at && op.a[at]) all.add(op.a[at]);
      }
      if (op.cmd === 'recall' && op.a[4]) all.add(op.a[4]);
    }
    for (const op of P.ops) {
      if (op.k === 'cmd' && op.cmd === 'goal' && op.a[0] === 'add' && op.a.includes('to')) for (const t of op.a.slice(op.a.indexOf('to') + 1)) if (!all.has(t)) say('Строка ' + op.line + ': нет метки ' + t);
      if (op.k === 'cmd' && op.cmd === 'goal' && op.a[0] === 'add' && op.a.includes('stay') && !all.has(op.a[op.a.indexOf('stay') + 1])) say('Строка ' + op.line + ': нет метки ' + op.a[op.a.indexOf('stay') + 1]);
    }
    for (const op of P.ops) {
      if (op.k === 'cmd') checkCommand(op, known, say);
      if (op.k === 'if' && (op.cond.kind === 'owns' || op.cond.kind === 'beaten' || op.cond.kind === 'hero') && !all.has(op.cond.a[0])) say('Строка ' + op.line + ': нет метки ' + op.cond.a[0]);
      if (op.k === 'if' && op.cond.kind === 'flag' && !known.flags.has(op.cond.a[0])) say('Строка ' + op.line + ': флаг ' + op.cond.a[0] + ' нигде не ставится');
    }
    for (const x of labelsUsed(P)) if (P.labels[x.label] == null) say('Строка ' + x.line + ': нет метки @' + x.label);
    for (const e of [...(events || []), ...P.events]) {
      const name = eventText(e);
      if (P.labels[e.go] == null) say('Событие ' + name + ': нет сцены @' + e.go);
      if ((e.on === 'visit' || e.on === 'defeat' || e.on === 'capture' || e.on === 'caravan' || e.on === 'done' || e.on === 'arrive') && !all.has(e.tag)) say('Событие ' + name + ': нет метки ' + e.tag);
      if (e.on === 'built' && !Object.values(H.FACTIONS).some(f => f.building[e.building])) say('Событие ' + name + ': нет здания ' + e.building);
      if (e.on === 'flag' && !known.flags.has(e.flag)) say('Событие ' + name + ': флаг нигде не ставится');
      if (e.on === 'res' && !H.RESOURCES.some(r => r[0] === e.res)) say('Событие ' + name + ': нет ресурса ' + e.res);
    }
    return out;
  };

  const speakers = text => {
    const P = parse(text), out = new Set();
    for (const op of P.ops) {
      if (op.k === 'line' && op.who) out.add(op.who);
      if (op.k === 'cmd' && op.cmd === 'show') out.add(op.a[0]);
    }
    return [...out];
  };

  H.Script = { speakers, EVENT_KINDS, parse, parseEvent, eventText, block, setBlock, dropBlock, eventsOf, init, on, poll, advance, opening, check, tokens };
})(globalThis.Heroes98 = globalThis.Heroes98 || {});
