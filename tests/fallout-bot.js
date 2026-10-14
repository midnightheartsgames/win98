const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js/apps/fallout');
const GAME = path.join(ROOT, 'content/Fallout');
const ORDER = ['fo-core', 'fo-dat', 'fo-formats', 'fo-files', 'fo-exe', 'fo-gen', 'fo-hex', 'fo-art', 'fo-proto', 'fo-map', 'fo-color', 'fo-render', 'fo-light', 'fo-text', 'fo-acm', 'fo-sound', 'fo-mve', 'fo-path', 'fo-anim', 'fo-rules', 'fo-world', 'fo-vm', 'fo-scripts', 'fo-ops', 'fo-combat', 'fo-ai', 'fo-attack', 'fo-items', 'fo-travel', 'fo-save', 'fo-ui', 'fo-turns', 'fo-iface', 'fo-dialog', 'fo-inven', 'fo-barter', 'fo-charscr', 'fo-perkdlg', 'fo-select', 'fo-panels', 'fo-automap', 'fo-pipboy', 'fo-worldmap', 'fo-prefs', 'fo-movie', 'fo-endgame', 'fo-saveload', 'fo-viewer', 'fo-play', 'fo-menu'];
for (const m of ORDER) require(path.join(DIR, m + '.js'));
const FO = globalThis.FO;

const MODES = process.argv.slice(2).filter(a => !a.startsWith('-'));
const ONLY = (process.argv.find(a => a.startsWith('--map=')) || '').slice(6).toUpperCase();
const VERBOSE = process.argv.includes('-v');
const RUSSIAN = process.argv.includes('--ru');
const t0 = Date.now();
const problems = [];
const LOOPS = new Set(['ADYTOWNR.FleeDude']);
const SEED = +((process.argv.find(a => a.startsWith('--seed=')) || '').slice(7) || 1998);

const idle = () => new Promise(r => setImmediate(r));

function seedRandom(seed) {
  let s = (seed >>> 0) || 1;
  const rng = () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  rng.state = () => s;
  rng.reset = v => { s = v; };
  Math.random = rng;
  return rng;
}

async function makeGame(D) {
  const g = {
    data: D, art: new FO.Art(D), protos: new FO.Protos(D), prefs: {}, scr: new FO.Screen(640, 480), mouse: { x: 0, y: 0, inside: false, down: 0 }, keys: new Set(), opts: {}, now: 0,
    active: () => true,
    setMode(m, entered) {
      if (this.mode && this.mode.leave) this.mode.leave();
      this.mode = m;
      return m && m.enter && !entered ? m.enter() : null;
    },
    text(s, x, y, c, f) {
      const font = this.fonts[f === undefined ? 101 : f];
      return font ? font.draw(this.scr, s, x, y, c, this.colors) : x;
    },
    color(r, gg, b) {
      return this.colors.nearest(r, gg, b);
    }
  };
  g.audio = {
    load: name => ({ name }), play() {}, free() {}, sfx() {}, playMusic() {}, stopMusic() {}, pauseMusic() {}, resumeMusic() {}, apply() {}, speech() {}, stopSpeech() {},
    speechDone: () => true, loadSpeech: async () => null, playSpeech: () => null, speechBytes: () => 0, playPcm: () => null, stopPcm() {}, rate: 22050, channels: 1
  };
  await g.art.init();
  await g.protos.init();
  g.fonts = await FO.loadFonts(D);
  g.colors = new FO.Colors(FO.readPal(await D.get('COLOR.PAL')));
  return g;
}

async function newPlay(g, map) {
  const world = await FO.newWorld(g);
  const sc = new FO.Scripts(g, world);
  await sc.init();
  const play = new FO.Play(g, world, sc);
  g.play = play;
  await g.setMode(play);
  await play.start(map, -1, -1, -1);
  return play;
}

async function tick(g, seconds) {
  for (let t = 0; t < seconds; t += 0.1) {
    const play = g.play;
    if (!play || g.mode !== play) break;
    if (g.colors.fadeJob) g.colors.stepFade(100);
    play.update(0.1);
    play.draw(g.scr);
    await idle();
  }
}

function facts(play) {
  const w = play.w;
  const sc = play.sc;
  const d = w.dude;
  const fighting = play.combat && play.combat.list && (w.inCombat || play.fighting);
  const ids = st => st.byElev.map(l => l.map(o => o.id + '@' + o.tile + ':' + o.frame).sort().join(',')).join('|');
  const lvars = st => (st.scriptList || []).map(s => (s.self ? s.self.id : 'm' + s.index) + '=' + s.lvars.join('.')).sort().join(',');
  return {
    map: w.map.name, elev: w.elev, tile: d.tile, rot: d.rot, hp: d.critter.hp, level: d.level, exp: d.exp,
    inv: d.inventory.map(e => e.obj.pid + 'x' + e.count + '@' + e.obj.id).join(','),
    time: sc.time, gvars: sc.gvars.join(','), mvars: w.map.gvars.join(','), lvars: lvars(w.map), scripts: (w.map.scriptList || []).length,
    timers: (w.map.timers || []).map(t => t.at + ':' + (t.obj ? t.obj.id : 0) + ':' + (t.kind || '') + ':' + (t.fixed | 0)).sort().join(','),
    events: sc.events.map(t => (t.kind || '') + ':' + t.at + ':' + (t.obj ? t.obj.id : 0)).sort().join(','),
    objects: ids(w.map), others: [...w.states.values()].map(st => st.name + ':' + ids(st)).join(';'),
    wm: JSON.stringify(w.wm), movies: [...w.movies].join(','), walked: FO.toBase64(w.walked), combat: fighting ? play.combat.list.map(o => o.id).join(',') : ''
  };
}

function report(kind, what, detail) {
  problems.push(kind + ' ' + what + ': ' + detail);
  console.log('  !', kind, what, String(detail).slice(0, 400));
}

async function mapsSweep(g) {
  const names = g.data.list(/^MAPS\\[^\\]+\.MAP$/).map(k => k.slice(5, -4));
  let done = 0;
  for (const name of names) {
    if (ONLY && name !== ONLY) continue;
    const t = Date.now();
    let play;
    try {
      play = await newPlay(g, name);
      await tick(g, 3);
    } catch (e) {
      report('start', name, e.stack);
      continue;
    }
    if (g.play !== play || g.mode !== play) {
      console.log('  ', name, 'left the map while running');
      continue;
    }
    const before = facts(play);
    const errorsBefore = play.sc.errors.slice();
    let loaded;
    try {
      const data = JSON.parse(JSON.stringify(FO.saveData(play)));
      const r = await FO.restoreWorld(g, data);
      const restored = facts({ w: r.world, sc: r.sc, combat: { list: r.combat ? r.combat.list : [] }, fighting: !!r.combat });
      const diff = Object.keys(before).filter(k => before[k] !== restored[k]);
      if (diff.length) report('restore', name, diff.map(k => k + ' ' + firstDifference(before[k], restored[k])).join('; '));
      loaded = await FO.loadGameData(g, data);
    } catch (e) {
      report('load', name, e.stack);
      continue;
    }
    const d0 = play.w.dude;
    const d1 = loaded.w.dude;
    if (d0.tile !== d1.tile || d0.elev !== d1.elev || d0.rot !== d1.rot || loaded.w.map.name !== name) report('position', name, d0.tile + '/' + d0.elev + '/' + d0.rot + ' vs ' + d1.tile + '/' + d1.elev + '/' + d1.rot + ' on ' + loaded.w.map.name);
    await tick(g, 2);
    if (errorsBefore.length) report('scripts', name, errorsBefore.slice(0, 3).join(' | '));
    if (loaded.sc.errors.length) report('scripts after load', name, loaded.sc.errors.slice(0, 3).join(' | '));
    done++;
    if (VERBOSE) console.log('  ', name, (Date.now() - t) + 'ms', 'objects', play.w.map.byElev.reduce((n, l) => n + l.length, 0), 'combat', !!before.combat);
  }
  console.log('maps: ' + done + ' maps saved and loaded');
}

function snapVars(play) {
  const w = play.w;
  const sc = play.sc;
  const d = w.dude;
  const all = w.map.byElev.flat();
  return {
    gvars: sc.gvars.slice(), mvars: w.map.gvars.slice(), time: sc.time, events: sc.events.slice(), timers: (w.map.timers || []).slice(),
    lvars: (w.map.scriptList || []).map(s => [s, s.lvars.slice(), s.dead]), scripts: (w.map.scriptList || []).slice(),
    inv: d.inventory.map(e => [e, e.count]), dude: [d.critter.hp, d.exp, d.level, d.karma, d.tile, d.elev],
    byElev: w.map.byElev.map(l => l.slice()),
    objects: all.map(o => [o, o.tile, o.elev, o.fid, o.frame, o.flags, o.critter ? o.critter.results : 0, o.critter ? o.critter.hp : 0, (o.inventory || []).slice()])
  };
}

function restoreVars(play, v) {
  const w = play.w;
  const sc = play.sc;
  const d = w.dude;
  sc.gvars = v.gvars.slice();
  w.map.gvars = v.mvars.slice();
  sc.time = v.time;
  sc.events = v.events.slice();
  w.map.timers = v.timers.slice();
  for (const [s, lv, dead] of v.lvars) {
    s.lvars = lv.slice();
    s.dead = dead;
  }
  w.map.scriptList = v.scripts.slice();
  d.inventory = v.inv.map(([e, c]) => {
    e.count = c;
    e.obj.owner = d;
    return e;
  });
  [d.critter.hp, d.exp, d.level, d.karma] = v.dude;
  for (const [o, tile, elev, fid, frame, flags, results, hp, inv] of v.objects) {
    Object.assign(o, { tile, elev, fid, frame, flags, destroyed: false, x: 0, y: 0 });
    if (o.critter) {
      o.critter.results = results;
      o.critter.hp = hp;
    }
    o.inventory = inv.slice();
  }
  w.map.byElev = v.byElev.map(l => l.slice());
  w.map.tiles = new Map();
  for (const list of w.map.byElev) for (const o of list) w.index(o);
  w.elev = v.dude[5];
  w.inCombat = false;
}

function resetTalk(play, scripts) {
  const sc = play.sc;
  const waiting = new Set(scripts);
  if (sc.dialog && sc.dialog.waiting) waiting.add(sc.dialog.waiting);
  for (const s of waiting) if (s && s.prog && s.prog.waiting) sc.load(s);
  sc.dialog = null;
  sc.takeRequests();
  play.pendingCombat = null;
  play.modals.length = 0;
}

async function dialogSweep(g) {
  const names = g.data.list(/^MAPS\\[^\\]+\.MAP$/).map(k => k.slice(5, -4));
  const seenScripts = new Set();
  const total = { talkers: 0, nodes: 0, paths: 0, direct: 0, fights: 0, barters: 0, errors: 0, loops: 0 };
  const ENGINE = /(_p_proc|^start)$/i;
  const isNode = (prog, p, i) => i > 0 && !(p.args | 0) && !ENGINE.test(p.name);
  for (const name of names) {
    if (ONLY && name !== ONLY) continue;
    let play;
    try {
      play = await newPlay(g, name);
    } catch (e) {
      report('start', name, e.stack);
      continue;
    }
    const w = play.w;
    const sc = play.sc;
    const host = Object.create(play);
    let fights = 0;
    let barters = 0;
    host.dialogStart = () => {};
    host.attack = () => { fights++; };
    host.barter = () => { barters++; };
    host.openModal = m => m;
    sc.host = host;
    const talkers = (w.map.scriptList || []).filter(s => s.self && s.prog && !w.isDead(s.self) && (sc.has(s, FO.ACT.TALK) || /talk|dialog/i.test(s.prog.procs.map(p => p.name).join(' '))));
    for (const s of talkers) {
      if (seenScripts.has(s.name)) continue;
      seenScripts.add(s.name);
      const start = snapVars(play);
      const seen = new Set();
      const ran = new Set();
      const stack = [[]];
      let paths = 0;
      const errorsAt = sc.errors.length;
      const fail = (where, e) => {
        if (LOOPS.has(s.name + '.' + where) && /instruction budget exceeded/.test(e)) {
          total.loops++;
          return;
        }
        total.errors++;
        report('dialogue', name + ' ' + s.name + ' ' + where, e);
      };
      while (stack.length && paths < 400 && seen.size < 200) {
        const route = stack.pop();
        paths++;
        resetTalk(play, [s]);
        restoreVars(play, start);
        const before = sc.errors.length;
        try {
          sc.exec(s, FO.ACT.TALK, { source: w.dude });
          let ok = true;
          for (const choice of route) {
            const d = sc.dialog;
            if (!d || !d.waiting) {
              ok = false;
              break;
            }
            const opt = choice >= 0 ? d.node.options[choice] : null;
            if (opt) ran.add((typeof opt.proc === 'string' ? opt.proc : (d.waiting.prog.procs[opt.proc] || {}).name || '').toLowerCase());
            sc.resumeDialog(choice);
          }
          if (sc.errors.length > before) fail('[' + route.join(',') + ']', sc.errors.slice(before).join(' | '));
          const d = sc.dialog;
          if (!ok || !d || !d.waiting) continue;
          const sig = d.node.reply + '|' + d.node.options.map(o => o.text).join('|');
          if (seen.has(sig)) continue;
          seen.add(sig);
          const n = d.node.options.length;
          if (!n) stack.push(route.concat(-1));
          for (let i = n - 1; i >= 0; i--) stack.push(route.concat(i));
        } catch (e) {
          fail('[' + route.join(',') + ']', e.stack);
        }
      }
      let direct = 0;
      for (const [i, p] of s.prog.procs.entries()) {
        const key = p.name.toLowerCase();
        if (!isNode(s.prog, p, i) || ran.has(key)) continue;
        resetTalk(play, [s]);
        restoreVars(play, start);
        sc.dialog = { npc: s.self, script: s, list: 0, mood: 0, head: -1, bg: -1, node: { reply: '', options: [], message: false }, waiting: null, barter: 0 };
        const before = sc.errors.length;
        try {
          sc.vm.call(s.prog, s.prog.proc(p.name), { script: s, self: s.self, action: FO.ACT.TALK, source: w.dude, target: null, usedWith: null, skill: -1, fixed: 0 });
        } catch (e) {
          fail(p.name, e.stack);
        }
        if (sc.errors.length > before) fail(p.name, sc.errors.slice(before).join(' | '));
        direct++;
      }
      resetTalk(play, [s]);
      restoreVars(play, start);
      sc.errors.length = errorsAt;
      total.talkers++;
      total.nodes += seen.size;
      total.paths += paths;
      total.direct += direct;
      if (VERBOSE) console.log('  ', name, s.name, 'nodes', seen.size, 'paths', paths, 'direct', direct);
    }
    total.fights += fights;
    total.barters += barters;
    if (sc.vm.missing.size) report('opcodes', name, [...sc.vm.missing.keys()].join(','));
  }
  console.log('dialogs: ' + total.talkers + ' talkers, ' + total.nodes + ' nodes, ' + total.paths + ' replays, ' + total.direct + ' node procs called directly, ' + total.fights + ' fights, ' + total.barters + ' barters, ' + total.errors + ' errors, ' + total.loops + ' known endless loops of the original scripts');
}

const carrying = (o, pid) => (o.inventory || []).some(e => e.obj.pid === pid || carrying(e.obj, pid));
const scriptNamed = (play, name) => (play.w.map.scriptList || []).find(s => s.name === name && s.self && !s.self.destroyed);

function freeNear(play, tile, elev) {
  const w = play.w;
  for (let ring = 1; ring < 4; ring++) {
    for (let dir = 0; dir < 6; dir++) {
      let t = tile;
      for (let i = 0; i < ring; i++) t = FO.hexStep(t, dir);
      if (t >= 0 && !w.blocker(t, elev, w.dude)) return t;
    }
  }
  return tile;
}

async function travel(g, name, near) {
  const play = g.play;
  await play.goto(play.w.mapIndex(name), -1, -1, -1);
  if (near) {
    const w = play.w;
    const t = freeNear(play, near.tile, near.elev);
    w.moveTo(w.dude, t, near.elev);
    w.dude.rot = FO.hexDir(t, near.tile);
    play.centerOn(t);
    await w.preload(near.elev);
  }
  return play;
}

function strengthen(d) {
  for (let i = 0; i < 7; i++) d.stats.base[i] = 9;
  FO.recalcDerived(d);
  d.critter.hp = FO.statValue(d, FO.STAT.MAX_HP);
}

function talkHost(play) {
  const host = Object.create(play);
  host.fought = false;
  host.dialogStart = () => {};
  host.attack = () => { host.fought = true; };
  host.barter = () => {};
  host.openModal = m => m;
  return host;
}

function finishTalk(play) {
  const sc = play.sc;
  for (let i = 0; i < 40 && sc.dialog && sc.dialog.waiting; i++) {
    const n = sc.dialog.node.options.length;
    sc.resumeDialog(n ? n - 1 : -1);
  }
  if (sc.dialog) resetTalk(play, []);
}

function talkGoal(play, rng, script, open, goal, limit) {
  const sc = play.sc;
  const saved = sc.host;
  const host = talkHost(play);
  sc.host = host;
  const start = snapVars(play);
  const seed = rng.state();
  const queue = [[]];
  const seen = new Set();
  let found = null;
  let paths = 0;
  const replay = route => {
    resetTalk(play, [script]);
    restoreVars(play, start);
    rng.reset(seed);
    host.fought = false;
    open();
    for (const c of route) {
      if (!sc.dialog || !sc.dialog.waiting) return false;
      sc.resumeDialog(c);
    }
    return true;
  };
  while (queue.length && !found && paths < (limit || 3000)) {
    const route = queue.shift();
    paths++;
    const ok = replay(route);
    if (goal()) {
      found = route;
      break;
    }
    const d = sc.dialog;
    if (!ok || host.fought || !d || !d.waiting) continue;
    const sig = d.node.reply + '|' + d.node.options.map(o => o.text).join('|');
    if (seen.has(sig)) continue;
    seen.add(sig);
    const n = d.node.options.length;
    if (!n) queue.push(route.concat(-1));
    for (let i = 0; i < n; i++) queue.push(route.concat(i));
  }
  resetTalk(play, [script]);
  restoreVars(play, start);
  rng.reset(seed);
  if (found) {
    replay(found);
    finishTalk(play);
  }
  sc.host = saved;
  return { found, paths, nodes: seen.size };
}

async function storyBot(g) {
  const rng = seedRandom(SEED);
  const step = (name, ok, detail) => {
    console.log((ok ? '  ok ' : '  !! ') + name + (detail ? ' (' + detail + ')' : ''));
    if (!ok) report('story', name, detail || 'failed');
    return ok;
  };
  const G = { CHIP_TAKEN: 30, FIND_CHIP: 101, VATS_BLOWN: 17, MASTER_BLOWN: 18, SLIDES: 299 };
  const PID = { CHIP: 55 };
  const where = (map, tile, elev) => ({ map, tile, elev });
  const SPOT = { computer: where('VAULTNEC', 25270, 2), overseer: where('VAULT13', 21062, 2), vats: where('MBVATS12', 12325, 1), master: where('MSTRLR34', 12058, 0) };
  let play = await newPlay(g, 'V13ENT');
  const d = () => g.play.w.dude;
  let slot = 0;
  const reload = async what => {
    const before = g.play;
    const s0 = slot++ % FO.SAVE.SLOTS;
    await FO.writeSlot(g, s0, before, what, FO.captureThumb(before));
    const loaded = await FO.loadGameData(g, (await FO.readSlot(g, s0)).data);
    const same = loaded.w.map.name === before.w.map.name && loaded.w.dude.tile === before.w.dude.tile && loaded.sc.gvars.join() === before.sc.gvars.join() && loaded.w.dude.inventory.length === before.w.dude.inventory.length;
    step('save and load after ' + what, same && loaded !== before);
    return loaded;
  };
  strengthen(d());
  await tick(g, 2);
  step('new game starts in the cave', g.play.w.map.name === 'V13ENT' && !g.play.sc.errors.length, 'gvar 101 = ' + g.play.sc.gvars[G.FIND_CHIP]);

  play = await travel(g, SPOT.computer.map, SPOT.computer);
  const comp = scriptNamed(play, 'NH2OCOMP');
  let tries = 0;
  while (comp && !carrying(d(), PID.CHIP) && tries < 40) {
    tries++;
    play.useObject(d(), comp.self);
  }
  step('the Vault 12 computer gives the water chip', carrying(d(), PID.CHIP) && play.sc.gvars[G.CHIP_TAKEN] === 1, tries + ' tries');
  play = await reload('the water chip');
  step('the chip survives the reload', carrying(d(), PID.CHIP));

  play = await travel(g, SPOT.overseer.map, SPOT.overseer);
  const over = scriptNamed(play, 'OVER');
  const handed = over && talkGoal(play, rng, over, () => play.sc.exec(over, FO.ACT.TALK, { source: d() }), () => !carrying(d(), PID.CHIP));
  step('the Overseer takes the chip', handed && handed.found && !carrying(d(), PID.CHIP), handed ? 'route ' + JSON.stringify(handed.found) + ', ' + handed.paths + ' replays, gvar 101 = ' + play.sc.gvars[G.FIND_CHIP] : 'no overseer');
  await tick(g, 1);
  play = await reload('the Overseer');

  play = await travel(g, 'CAVES');
  const scorpions = (play.w.map.scriptList || []).filter(sc0 => sc0.name === 'SSRADSCO' && sc0.self && !play.w.isDead(sc0.self)).map(sc0 => sc0.self);
  for (const o of scorpions) {
    FO.setWhoHitMe(o, d());
    FO.setResults(play.combat, o, FO.DAM.DEAD);
    FO.damageCritter(play.combat, o, 9999, false, false, d());
  }
  step('killing the radscorpions in the caves finishes the Shady Sands quest', play.sc.gvars[43] === 2 && play.sc.gvars[2] === 0 && play.sc.gvars[28] === 2, scorpions.length + ' radscorpions, gvar 43 = ' + play.sc.gvars[43]);
  play = await reload('the radscorpions');

  play = await travel(g, SPOT.vats.map, SPOT.vats);
  const vats = scriptNamed(play, 'VCONCOMP');
  let logins = 0;
  while (vats && !vats.lvars[0] && logins < 40) {
    logins++;
    FO.useSkill(play, FO.SKILL.SCIENCE, vats.self);
  }
  step('Science logs into the vats computer', vats && vats.lvars[0] === 1, logins + ' tries');
  const blown = vats && talkGoal(play, rng, vats, () => play.sc.exec(vats, FO.ACT.TALK, { source: d() }), () => play.sc.gvars[G.VATS_BLOWN] === 1);
  step('the vats computer starts the overload', blown && blown.found && play.sc.gvars[G.VATS_BLOWN] === 1, blown ? 'route ' + JSON.stringify(blown.found) + ', ' + blown.paths + ' replays' : 'no computer');
  play = await reload('the vats');

  play = await travel(g, SPOT.master.map, SPOT.master);
  const master = scriptNamed(play, 'MASTER');
  const nuked = master && talkGoal(play, rng, master, () => play.sc.exec(master, FO.ACT.TALK, { source: d() }), () => play.sc.gvars[G.MASTER_BLOWN] === 1);
  if (master && !(nuked && nuked.found)) {
    const boss = master.self;
    FO.setWhoHitMe(boss, d());
    FO.setResults(play.combat, boss, FO.DAM.DEAD);
    FO.damageCritter(play.combat, boss, 9999, false, false, d());
  }
  step('the Master dies or sets off the bomb', master && play.sc.gvars[G.MASTER_BLOWN] === 1, nuked && nuked.found ? 'talked: route ' + JSON.stringify(nuked.found) : 'killed after ' + (nuked ? nuked.paths : 0) + ' dialogue replays without a peaceful route');

  play = await reload('the Master');
  play = await travel(g, 'V13ENT');
  let slides = false;
  let movie = false;
  const talks = [];
  const endgame = FO.endgameMovie;
  FO.endgameMovie = () => { movie = true; };
  for (let i = 0; i < 2000 && !movie; i++) {
    await tick(g, 0.1);
    const top = g.play && g.play.top && g.play.top();
    if (top instanceof FO.DialogScreen && g.play.sc.dialog && g.play.sc.dialog.waiting) {
      const opts = top.options(g.play.sc.dialog);
      talks.push(g.play.sc.dialog.node.reply.slice(0, 60));
      top.choose(opts.length - 1);
    }
    if (top instanceof FO.EndgameScreen && !slides) {
      slides = true;
      g.play.closeModal(top);
      g.play.sc.gvars[G.SLIDES] = 0;
    }
  }
  FO.endgameMovie = endgame;
  step('returning to the vault plays the ending slides', slides);
  step('the ending movie follows', movie, 'Overseer said: ' + talks.join(' / '));
  const errors = g.play ? g.play.sc.errors : [];
  step('no script errors on the way', !errors.length, errors.slice(0, 3).join(' | '));
}

function firstDifference(a, b) {
  const x = String(a);
  const y = String(b);
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  return '@' + i + ' "' + x.slice(Math.max(0, i - 30), i + 50) + '" vs "' + y.slice(Math.max(0, i - 30), i + 50) + '"';
}

(async () => {
  const D = await FO.Data.open(FO.nodeSource(GAME), FO.LOOSE, RUSSIAN ? { src: FO.nodeSource(path.join(ROOT, 'content/fallout-ru'), ''), files: FO.RU } : undefined);
  const g = await makeGame(D);
  if (RUSSIAN) {
    g.lang = 'ru';
    g.strings = FO.readStrings(await D.overlayText(FO.STRINGS_PATH));
  }
  const probe = new FO.World(g);
  await probe.init();
  g.mapNames = probe.mapNames;
  const modes = MODES.length ? MODES : ['maps'];
  for (const mode of modes) {
    if (mode === 'maps') await mapsSweep(g);
    if (mode === 'dialogs') await dialogSweep(g);
    if (mode === 'story') await storyBot(g);
  }
  console.log('fallout bot: ' + problems.length + ' problems in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  process.exit(problems.length ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
