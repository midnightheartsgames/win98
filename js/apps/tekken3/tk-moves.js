(function (T) {
  'use strict';

  function mv(c, n, l, d, st, act, rec, blk, hit, o) {
    const m = Object.assign({ c, id: c, n, l, d, st, act, rec, b: blk, h: hit }, o || {});
    if (m.c === null) delete m.c;
    return m;
  }
  const chain = (id, n, l, d, st, act, rec, blk, hit, o) => mv(null, n, l, d, st, act, rec, blk, hit, Object.assign({ id }, o));
  const nx = (b, id, w, at, o) => Object.assign({ b, id, w, at }, o || {});

  const UNIVERSAL = [
    mv('1', 'Джеб', 'h', 5, 10, 2, 13, 1, 8, { a: 'jab', r: 0.9, w: 0.22, nx: [nx('2', '1,2', [2, 20], 14)] }),
    chain('1,2', 'Раз-два', 'h', 11, 9, 2, 17, -3, 7, { a: 'cross', r: 0.92 }),
    mv('2', 'Прямой правой', 'h', 12, 12, 2, 16, -3, 6, { a: 'cross', r: 0.92, w: 0.22 }),
    mv('3', 'Толчок ногой', 'm', 13, 15, 3, 18, -8, 3, { a: 'front:l', r: 1.05, w: 0.2 }),
    mv('4', 'Хай-кик', 'h', 18, 14, 3, 20, -9, 5, { a: 'round:r', r: 1.08, w: 0.55, ch: 'K', trk: 0.4 }),
    mv('f+2', 'Удар с шагом', 'h', 14, 14, 2, 18, -4, 5, { a: 'cross', r: 1.05, mv: 0.18 }),
    mv('d+1', 'Присед-джеб', 'sm', 5, 10, 2, 12, 0, 6, { a: 'lowp:l', r: 0.85, fc: true, crouch: true }),
    mv('d+2', 'Удар снизу', 'l', 8, 12, 2, 17, -5, 1, { a: 'lowp:r', r: 0.88, fc: true, crouch: true }),
    mv('d+3', 'Лоу-кик', 'l', 11, 16, 3, 21, -13, -2, { a: 'lowk:l', r: 1.0, fc: true, crouch: true, w: 0.35 }),
    mv('d+4', 'Тычок по голени', 'l', 7, 12, 2, 19, -12, -3, { a: 'lowk:r', r: 1.0, fc: true, crouch: true }),
    mv('df+1', 'Удар в корпус', 'm', 10, 13, 2, 15, -1, 4, { a: 'body:l', r: 0.88 }),
    mv('df+2', 'Апперкот', 'm', 15, 15, 2, 22, -12, 'L', { a: 'upper:r', r: 0.85, y: 1.35 }),
    mv('df+3', 'Пинок в живот', 'm', 13, 14, 3, 19, -7, 3, { a: 'front:l', r: 1.05 }),
    mv('df+4', 'Удар ногой в корпус', 'm', 16, 15, 3, 20, -9, 4, { a: 'front:r', r: 1.08 }),
    mv('db+4', 'Подсечка', 'l', 14, 20, 3, 24, -16, 'T', { a: 'sweep:r', r: 1.12, w: 0.8, fc: true, crouch: true, trk: 0.8 }),
    mv('b+1', 'Отводящий удар', 'h', 9, 12, 2, 14, 2, 6, { a: 'back:l', r: 0.88, w: 0.35 }),
    mv('b+2', 'Хук', 'h', 14, 14, 2, 18, -4, 6, { a: 'hook:r', r: 0.85, w: 0.6, trk: 0.6 }),
    mv('ws 1', 'Подъём: удар', 'm', 10, 11, 2, 15, -3, 6, { a: 'upper:l', r: 0.85 }),
    mv('ws 2', 'Подъём: апперкот', 'm', 16, 13, 2, 21, -10, 5, { a: 'upper:r', r: 0.85, ch: 'L' }),
    mv('ws 3', 'Подъём: пинок', 'm', 14, 13, 3, 20, -8, 4, { a: 'front:l', r: 1.05 }),
    mv('ws 4', 'Подъём: взлёт', 'm', 16, 12, 3, 24, -13, 'L', { a: 'front:r', r: 1.02, y: 1.3 }),
    mv('1+2', 'Двойная ладонь', 'm', 20, 18, 3, 22, -8, 'B', { a: 'palm', r: 1.0 }),
    mv('uf+4', 'Прыжок с ногой', 'm', 20, 22, 4, 18, -6, 'K', { a: 'hop:r', r: 1.1, lc: [4, 30], jumpy: true }),
    mv('uf+3', 'Прыжок: колено', 'm', 16, 18, 4, 20, -8, 'K', { a: 'hop:l', r: 1.0, lc: [4, 26], jumpy: true }),
    mv('d+3+4', 'Топот', 'm', 18, 20, 3, 24, -15, 'K', { a: 'stomp:r', r: 0.95, gr: true }),
    mv('1+3', 'Бросок коленом', 't', 35, 12, 2, 28, 0, 0, { throw: 'knee', brk: 1, r: 0.9 }),
    mv('2+4', 'Бросок через бедро', 't', 35, 12, 2, 28, 0, 0, { throw: 'hip', brk: 2, r: 0.9 }),
    mv('run 1+2', 'Прыжок в ноги', 't', 25, 14, 4, 30, 0, 0, { throw: 'tackle', brk: 12, r: 1.1, run: true, low: true }),
    mv('run 3', 'Подкат', 'l', 18, 14, 6, 28, -20, 'T', { a: 'slide', r: 1.2, mv: 0.6 }),
    mv('run 4', 'Удар в прыжке', 'h', 25, 16, 4, 22, -8, 'B', { a: 'hop:r', r: 1.2, mv: 0.5, lc: [4, 22] }),
    mv('run 2', 'Таран плечом', 'm', 25, 12, 4, 26, -12, 'B', { a: 'shoulder', r: 0.9, mv: 0.4 }),
    mv('air 3', 'Удар в прыжке', 'm', 14, 6, 6, 10, -4, 'K', { a: 'front:l', r: 1.05, air: true }),
    mv('air 4', 'Удар в прыжке', 'h', 16, 6, 6, 10, -4, 'K', { a: 'front:r', r: 1.1, air: true }),
    mv('air 1', 'Удар в прыжке', 'm', 10, 5, 5, 10, -3, 4, { a: 'jab', r: 0.95, air: true }),
    mv('air 2', 'Удар в прыжке', 'm', 12, 6, 5, 10, -3, 'K', { a: 'hammer:r', r: 0.95, air: true }),
    mv('down 3', 'Подъём с лоу-киком', 'l', 12, 16, 3, 20, -14, 2, { a: 'lowk:l', r: 1.0, getup: true }),
    mv('down 4', 'Подъём с ударом', 'm', 15, 18, 3, 22, -12, 'K', { a: 'front:r', r: 1.05, getup: true })
  ];

  const AUTO_RAM = mv(null, 'Таран с разбега', 'm', 22, 6, 4, 22, -10, 'B', { id: 'ram', a: 'shoulder', r: 0.8, mv: 0.3 });

  const pose = (o) => o;

  const THROWS = {
    knee: {
      dur: 64, dmg: [[22, 0.3], [38, 0.3], [52, 0.4]], end: { face: 'down', off: [0.85, 0, 0], yaw: Math.PI }, aRec: 6,
      a: [[8, 'grab'], [20, 'kneeUp'], [26, 'grab'], [36, 'kneeUp'], [44, 'grab'], [52, 'shove'], [64, 'stance']],
      v: [[0, [0.62, 0, 0], 0, 0, 'held'], [22, [0.58, 0, 0], 0.35, 0, 'double'], [38, [0.58, 0, 0], 0.45, 0, 'double'], [52, [0.75, 0, 0], 0.7, 0, 'double'], [64, [0.85, 0, 0], 1.5, 0, 'limp']],
      shake: [[22, 3], [38, 3], [52, 5]]
    },
    hip: {
      dur: 60, dmg: [[40, 1]], end: { face: 'up', off: [0.9, 0, 0.1], yaw: Math.PI }, aRec: 8,
      a: [[8, 'grab'], [24, 'hipLoad'], [40, 'hipThrow'], [60, 'stance']],
      v: [[0, [0.6, 0, 0], 0, 0, 'held'], [16, [0.45, 0.1, 0.12], 0.5, 0, 'held'], [28, [0.25, 0.9, 0.2], 2.0, 0, 'fly'], [40, [0.8, 0.15, 0.1], 3.6, 0, 'fly'], [60, [0.9, 0, 0.1], 4.71, 0, 'limp']],
      shake: [[40, 7]]
    },
    suplex: {
      dur: 70, dmg: [[44, 1]], end: { face: 'up', off: [-0.8, 0, 0], yaw: Math.PI }, aRec: 14,
      a: [[8, 'grab'], [24, 'lift'], [44, 'bridge'], [60, 'bridge'], [70, 'stance']],
      v: [[0, [0.55, 0, 0], 0, 0, 'held'], [18, [0.35, 0.35, 0], 0.3, 0, 'held'], [30, [0.0, 1.45, 0], 1.6, 0, 'fly'], [44, [-0.75, 0.25, 0], 3.0, 0, 'fly'], [70, [-0.8, 0, 0], 4.71, 0, 'limp']],
      shake: [[44, 9]]
    },
    slam: {
      dur: 76, dmg: [[52, 1]], end: { face: 'up', off: [0.8, 0, 0], yaw: Math.PI }, aRec: 10,
      a: [[10, 'grab'], [28, 'liftHigh'], [44, 'liftHigh'], [52, 'slamDown'], [76, 'stance']],
      v: [[0, [0.55, 0, 0], 0, 0, 'held'], [20, [0.3, 0.9, 0], -0.8, 0, 'fly'], [30, [0.05, 1.5, 0], -1.57, 0, 'fly'], [44, [0.05, 1.6, 0], -1.57, 0, 'fly'], [52, [0.75, 0.08, 0], -1.57, 0, 'limp'], [76, [0.8, 0, 0], -1.57, 0, 'limp']],
      shake: [[52, 11]]
    },
    headbutt: {
      dur: 56, dmg: [[20, 0.4], [36, 0.6]], end: { face: 'up', off: [1.0, 0, 0], yaw: Math.PI }, aRec: 6,
      a: [[8, 'grab'], [16, 'headBack'], [20, 'headFwd'], [30, 'headBack'], [36, 'headFwd'], [46, 'shove'], [56, 'stance']],
      v: [[0, [0.58, 0, 0], 0, 0, 'held'], [20, [0.62, 0, 0], -0.35, 0, 'held'], [36, [0.66, 0, 0], -0.45, 0, 'held'], [46, [0.9, 0.2, 0], -1.2, 0, 'fly'], [56, [1.0, 0, 0], -1.57, 0, 'limp']],
      shake: [[20, 4], [36, 6]]
    },
    tomoe: {
      dur: 72, dmg: [[46, 1]], end: { face: 'up', off: [-1.1, 0, 0], yaw: 0 }, aRec: 20,
      a: [[8, 'grab'], [26, 'sitBack'], [40, 'rollKick'], [58, 'rollKick'], [72, 'stance']],
      v: [[0, [0.58, 0, 0], 0, 0, 'held'], [26, [0.45, 0.2, 0], 0.5, 0, 'held'], [36, [0.0, 1.1, 0], 1.8, 0, 'fly'], [46, [-1.0, 0.2, 0], 3.4, 0, 'fly'], [72, [-1.1, 0, 0], 4.71, 0, 'limp']],
      shake: [[46, 9]]
    },
    back: {
      dur: 64, dmg: [[40, 1]], end: { face: 'down', off: [-0.7, 0, 0], yaw: 0 }, aRec: 12,
      a: [[8, 'grab'], [24, 'lift'], [40, 'bridge'], [56, 'bridge'], [64, 'stance']],
      v: [[0, [0.55, 0, 0], 0, 0, 'held', 0], [20, [0.3, 0.4, 0], -0.2, 0, 'fly', 0], [30, [-0.1, 1.4, 0], -1.4, 0, 'fly', 0], [40, [-0.7, 0.2, 0], -2.9, 0, 'fly', 0], [64, [-0.7, 0, 0], -4.71, 0, 'limp', 0]],
      shake: [[40, 9]]
    },
    choke: {
      dur: 80, dmg: [[30, 0.3], [50, 0.3], [66, 0.4]], end: { face: 'down', off: [0.6, 0, 0], yaw: Math.PI }, aRec: 10,
      a: [[10, 'grab'], [24, 'choke'], [66, 'choke'], [80, 'stance']],
      v: [[0, [0.55, 0, 0], 0, 0, 'held'], [24, [0.3, -0.3, 0], 0.5, 0, 'held'], [50, [0.35, -0.45, 0], 0.8, 0, 'double'], [66, [0.45, -0.6, 0], 1.2, 0, 'limp'], [80, [0.6, 0, 0], 1.57, 0, 'limp']],
      shake: [[30, 3], [50, 3], [66, 6]]
    },
    tackle: {
      dur: 84, dmg: [[26, 0.25], [44, 0.25], [58, 0.25], [70, 0.25]], end: { face: 'up', off: [0.6, 0, 0], yaw: Math.PI }, aRec: 14,
      a: [[10, 'dive'], [22, 'mount'], [26, 'mountHitL'], [36, 'mount'], [44, 'mountHitR'], [52, 'mount'], [58, 'mountHitL'], [66, 'mount'], [70, 'mountHitR'], [84, 'stance']],
      v: [[0, [0.7, 0, 0], 0, 0, 'held'], [12, [0.75, 0.3, 0], -0.8, 0, 'fly'], [22, [0.75, 0.12, 0], -1.57, 0, 'limp'], [84, [0.75, 0.12, 0], -1.57, 0, 'limp']],
      shake: [[22, 6], [26, 2], [44, 2], [58, 2], [70, 4]]
    },
    bearhug: {
      dur: 72, dmg: [[26, 0.3], [42, 0.3], [60, 0.4]], end: { face: 'up', off: [0.8, 0, 0], yaw: Math.PI }, aRec: 10,
      a: [[10, 'hug'], [26, 'hugShake'], [34, 'hug'], [42, 'hugShake'], [52, 'hug'], [60, 'shove'], [72, 'stance']],
      v: [[0, [0.5, 0, 0], 0, 0, 'held'], [26, [0.45, 0.25, 0], 0, 0.15, 'held'], [42, [0.45, 0.25, 0], 0, -0.15, 'held'], [52, [0.45, 0.25, 0], 0, 0, 'held'], [60, [0.8, 0.2, 0], -1.2, 0, 'fly'], [72, [0.8, 0, 0], -1.57, 0, 'limp']],
      shake: [[26, 4], [42, 4], [60, 7]]
    },
    crush: {
      dur: 70, dmg: [[48, 1]], end: { face: 'up', off: [0.85, 0, 0], yaw: Math.PI }, aRec: 12,
      a: [[10, 'grabHigh'], [34, 'liftOne'], [48, 'slamDown'], [70, 'stance']],
      v: [[0, [0.6, 0, 0], 0, 0, 'held'], [20, [0.62, 0.35, 0], -0.1, 0, 'held'], [34, [0.62, 0.7, 0], -0.2, 0, 'held'], [48, [0.8, 0.08, 0], -1.57, 0, 'limp'], [70, [0.85, 0, 0], -1.57, 0, 'limp']],
      shake: [[48, 12]]
    },
    reverse: {
      dur: 50, dmg: [[26, 1]], end: { face: 'down', off: [0.85, 0, 0.2], yaw: Math.PI }, aRec: 8,
      a: [[6, 'grab'], [18, 'twist'], [30, 'shove'], [50, 'stance']],
      v: [[0, [0.6, 0, 0], 0, 0, 'held'], [18, [0.55, 0.1, 0.1], 0.4, 0.3, 'held'], [26, [0.7, 0.3, 0.2], 1.3, 0.2, 'fly'], [50, [0.85, 0, 0.2], 1.57, 0, 'limp']],
      shake: [[26, 7]]
    },
    armbar: {
      dur: 78, dmg: [[40, 0.4], [62, 0.6]], end: { face: 'down', off: [0.8, 0, 0], yaw: Math.PI }, aRec: 14,
      a: [[8, 'grab'], [26, 'twist'], [40, 'kneelHold'], [62, 'kneelHold'], [78, 'stance']],
      v: [[0, [0.6, 0, 0], 0, 0, 'held'], [26, [0.6, 0.1, 0.15], 0.6, 0.2, 'held'], [40, [0.8, 0.1, 0], 1.57, 0, 'limp'], [78, [0.8, 0, 0], 1.57, 0, 'limp']],
      shake: [[40, 6], [62, 4]]
    }
  };

  function throwChain(parts) {
    for (const [key, chain] of parts) {
      THROWS[key].chain = chain.map(c => Object.assign({ bits: T.parseCmd(c.c).btn }, c));
    }
  }

  function parseAnim(spec, m) {
    const key = (typeof spec === 'string' ? spec : spec.k) || '';
    const [kind, side] = key.split(':');
    const o = typeof spec === 'object' ? Object.assign({}, spec) : {};
    const P = { jab: ['punch', 'jab', 'l'], cross: ['punch', 'straight', 'r'], straight: ['punch', 'straight'], hook: ['punch', 'hook'], upper: ['punch', 'upper'], body: ['punch', 'body'], elbow: ['punch', 'elbow'], back: ['punch', 'back'], hammer: ['punch', 'hammer'], palm: ['punch', 'palm'], lowp: ['punch', 'low'] };
    const KK = { front: 'front', push: 'front', side: 'side', round: 'round', lowk: 'low', hookk: 'hook', axe: 'axe', knee: 'knee', sweep: 'sweep', spin: 'spin', flip: 'flip', hop: 'hop', double: 'double', stomp: 'stomp' };
    const BD = { shoulder: 1, headbutt: 1, tackle: 1, splash: 1, slide: 1, hip: 1 };
    const SW = { slash: 'slash', thrust: 'thrust', lowslash: 'low', over: 'over' };
    if (P[kind]) return Object.assign({ arch: P[kind][0], kind: P[kind][1], side: side || P[kind][2] || 'r' }, o);
    if (KK[kind]) return Object.assign({ arch: 'kick', kind: KK[kind], side: side || 'r' }, o);
    if (BD[kind]) return Object.assign({ arch: 'body', kind }, o);
    if (SW[kind]) return Object.assign({ arch: 'sword', kind: SW[kind] }, o);
    if (kind === 'pose') return Object.assign({ arch: 'pose' }, o);
    return defaultAnim(m);
  }

  function defaultAnim(m) {
    const btn = (m.c || m.id || '').replace(/^[a-z ]*[+ ]?/, '');
    const last = (m.c || m.id || '').split(/[,+ ]/).pop();
    const lv = m.l;
    if (last === '1') return { arch: 'punch', kind: lv === 'l' ? 'low' : 'jab', side: 'l' };
    if (last === '2') return { arch: 'punch', kind: lv === 'l' ? 'low' : 'straight', side: 'r' };
    if (last === '3') return { arch: 'kick', kind: lv === 'l' ? 'low' : lv === 'h' ? 'round' : 'front', side: 'l' };
    if (last === '4') return { arch: 'kick', kind: lv === 'l' ? 'low' : lv === 'h' ? 'round' : 'front', side: 'r' };
    if (btn.includes('3') || btn.includes('4')) return { arch: 'kick', kind: 'front', side: 'r' };
    return { arch: 'punch', kind: 'straight', side: 'r' };
  }

  function compile(def) {
    const list = [];
    const byId = {};
    const drop = new Set(def.drop || []);
    const add = (m) => {
      const c = Object.assign({}, m);
      if (c.l === 't') c.anim = null;
      else c.anim = parseAnim(c.a || null, c);
      c.total = c.st + c.act + c.rec;
      c.r = c.r || 0.9;
      c.w = c.w === undefined ? (c.l === 'l' ? 0.3 : 0.25) : c.w;
      c.trk = c.trk === undefined ? (c.w > 0.45 ? 0.35 : 0.12) : c.trk;
      if (c.c) c.p = T.parseCmd(c.c);
      if (byId[c.id]) {
        const i = list.indexOf(byId[c.id]);
        list[i] = c;
      } else list.push(c);
      byId[c.id] = c;
    };
    if (!def.noUniversal) for (const m of UNIVERSAL) if (!drop.has(m.id)) add(m);
    add(AUTO_RAM);
    for (const m of def.moves || []) add(m);
    for (const m of list) {
      if (m.nx) for (const n of m.nx) {
        if (!byId[n.id]) throw new Error(`${def.id}: missing chain ${m.id} -> ${n.id}`);
        n.bits = T.parseCmd(n.b).btn;
        n.dirN = n.d ? T.DIRN[n.d] : 0;
      }
      m.launch = m.h === 'L' || m.ch === 'L';
      m.kd = typeof m.h === 'string';
      m.safe = typeof m.b === 'number' && m.b >= -10;
      m.chainOnly = !m.c;
    }
    const cmds = list.filter(m => m.c && m.p.btn).sort((a, b) => b.p.score - a.p.score);
    const motion = list.filter(m => m.c && !m.p.btn && m.p.motion.length).sort((a, b) => b.p.score - a.p.score);
    return { list, byId, cmds, motion };
  }

  Object.assign(T, { mv, chain, nx, UNIVERSAL, THROWS, AUTO_RAM, compileMoves: compile, parseAnim, throwChain });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
