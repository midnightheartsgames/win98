const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'js', 'apps', 'maxpayne');
const SIM = ['mp-core', 'mp-data', 'mp-world', 'mp-nav', 'mp-game', 'mp-ai'];
const LEVEL_FILES = fs.readdirSync(DIR).filter(f => /^mp-l\d\d-.*\.js$/.test(f)).sort().map(f => f.replace(/\.js$/, ''));
const EXTRA = ['mp-story', 'mp-sets'];
for (const f of [...SIM, ...LEVEL_FILES, ...EXTRA]) require(path.join(DIR, f + '.js'));
const M = globalThis.MaxPayne;

let passed = 0;
const only = process.argv[2] || null;
function test(name, fn) {
  if (only && !name.includes(only)) return;
  const t0 = Date.now();
  fn();
  passed++;
  console.log(`  ok - ${name} (${Date.now() - t0} ms)`);
}

function newGame(level, o) { return new M.Game(Object.assign({ level, seed: 7, difficulty: 1 }, o || {})); }
function run(g, sec, fn) {
  const n = Math.round(sec / M.TICK);
  for (let i = 0; i < n; i++) {
    g.step(fn ? fn(g, i) : { yaw: g.player.yaw, pitch: g.player.pitch });
    if (g.events.length > 500) g.events.length = 0;
    if (g.done) break;
  }
}
function tp(g, pos, yaw) {
  const p = g.player;
  p.pos = pos.slice();
  if (p.pos[1] === null || p.pos[1] === undefined) {
    const gr = g.world.groundAt(pos[0], pos[2], 200, 0.2);
    p.pos[1] = gr.y;
  }
  p.vel = [0, 0, 0]; p.onGround = true; p.dodge = null; p.posture = 'stand'; p.h = 1.8;
  if (yaw !== undefined) p.yaw = yaw;
}
function zone(g, id) {
  const t = g.triggers.find(q => q.id === id);
  assert.ok(t, 'trigger ' + id);
  const c = [(t.min[0] + t.max[0]) / 2, 0, (t.min[2] + t.max[2]) / 2];
  const gr = g.world.groundAt(c[0], c[2], t.max[1], 0.2);
  c[1] = gr.y > t.min[1] - 1.5 ? gr.y : t.min[1];
  tp(g, c);
  run(g, 0.1);
}
function kill(g, id) {
  const c = g.char(id);
  assert.ok(c, 'char ' + id);
  if (c.state === 'hidden') c.state = 'alive';
  if (c.state === 'alive') { c.invuln = false; c.hpFloor = undefined; g.damageChar(c, 99999, 'body', [0, 0, 1], 'player', 'beretta'); }
}
function killGroup(g, grp) {
  for (const c of g.chars) if (c.group === grp && (c.state === 'alive' || c.state === 'hidden') && !c.civilian) { c.state = 'alive'; c.invuln = false; c.hpFloor = undefined; g.damageChar(c, 99999, 'body', [0, 0, 1], 'player', 'beretta'); }
}
function use(g, id) {
  const q = g.prop(id);
  assert.ok(q, 'prop ' + id);
  g.use(q);
  run(g, 0.05);
}
function waitFor(g, pred, max, label) {
  const n = Math.round((max || 20) / M.TICK);
  for (let i = 0; i < n && !pred(); i++) { g.step({ yaw: g.player.yaw, pitch: g.player.pitch }); if (g.events.length > 500) g.events.length = 0; }
  assert.ok(pred(), 'timeout waiting for ' + (label || 'condition'));
}
function god(g) { g.god = true; }

const WALK = {
  tutorial(g) {
    zone(g, 'cor1'); zone(g, 'jump'); zone(g, 'arm');
    tp(g, [24, 0, 1.3]); run(g, 0.2);
    assert.ok(g.player.weapons.beretta, 'beretta picked');
    zone(g, 'range');
    killGroup(g, 'r1'); run(g, 0.2);
    killGroup(g, 'r2'); waitFor(g, () => g.flags.coverHints, 5, 'cover lesson');
    tp(g, [30.2, 0, 3], -Math.PI / 2); g.step({ yaw: -Math.PI / 2, pitch: 0, cover: true });
    assert.ok(g.player.cover, 'took cover at the range barrier');
    waitFor(g, () => g.chars.filter(c => c.group === 'r3').every(c => c.raised), 20, 'r3 raised');
    killGroup(g, 'r3'); run(g, 0.2);
    zone(g, 'cor2'); zone(g, 'dodgeIn'); run(g, 1.5);
    killGroup(g, 'dg'); run(g, 0.2);
    zone(g, 'flash');
    g.player.pk = Math.max(1, g.player.pk); g.player.hp = 50; g.usePainkillers(); run(g, 1);
    zone(g, 'gren');
    killGroup(g, 'gw'); killGroup(g, 'gc'); run(g, 0.3);
    zone(g, 'kh');
    killGroup(g, 'kh');
    waitFor(g, () => g.done, 30, 'tutorial done');
  },
  prologue(g) {
    zone(g, 'yard'); zone(g, 'porch'); zone(g, 'hall');
    killGroup(g, 'down'); run(g, 0.2);
    zone(g, 'stairs'); zone(g, 'upstairs');
    killGroup(g, 'up'); run(g, 0.2);
    zone(g, 'nursery');
    waitFor(g, () => g.chars.some(c => c.group === 'bed' && c.state === 'alive'), 20, 'bed woke');
    killGroup(g, 'bed');
    waitFor(g, () => g.done, 20, 'prologue done');
  },
  roscoe(g) {
    zone(g, 'wc'); killGroup(g, 'platA');
    zone(g, 'stairA'); waitFor(g, () => g.flags.chat, 5); killGroup(g, 'm1');
    zone(g, 'm2'); killGroup(g, 'bars');
    zone(g, 'platB'); killGroup(g, 'platB');
    zone(g, 'c1'); killGroup(g, 'c1');
    zone(g, 'keypadArea');
    zone(g, 'platC'); killGroup(g, 'platC');
    zone(g, 'staffDoor');
    kill(g, 'h1');
    waitFor(g, () => g.prop('door_code').open > 0.9, 60, 'worker opened the code door');
    killGroup(g, 'ctrl'); killGroup(g, 'side'); run(g, 0.2);
    tp(g, [44, 0, 40.8], 0); use(g, 'power');
    assert.equal(g.prop('lever').locked, false);
    tp(g, [44.4, -4, 53.5], -Math.PI / 2); run(g, 0.2);
    use(g, 'lever');
    waitFor(g, () => !g.prop('trainC').moving, 30, 'train arrival');
    assert.ok(g.flags.smashed, 'barricade smashed');
    assert.ok(g.player.pos[0] > 80, 'player rode the train: ' + g.player.pos[0].toFixed(1));
    killGroup(g, 'maint'); run(g, 0.2);
    zone(g, 'tunL'); zone(g, 'exit');
    assert.ok(g.done);
  },
  crimescene(g) {
    zone(g, 'old'); killGroup(g, 'old');
    waitFor(g, () => g.char('runner').state === 'hidden', 20, 'runner fled');
    tp(g, [31, 0, 5], -Math.PI / 2); run(g, 0.2);
    zone(g, 'collapse'); run(g, 1.5);
    assert.ok(g.player.pos[1] < -3, 'fell into the channel: ' + g.player.pos[1].toFixed(2));
    zone(g, 'low'); killGroup(g, 'low'); run(g, 2);
    assert.ok(g.flags['grp:rubble1'], 'rubble dropped');
    zone(g, 'store');
    waitFor(g, () => g.char('a2').state === 'dead', 30, 'argue shot');
    killGroup(g, 'store');
    zone(g, 'breach'); killGroup(g, 'v1');
    waitFor(g, () => g.prop('vphone').ringing, 10, 'phone rings');
    use(g, 'vphone');
    waitFor(g, () => g.dialogs.length === 0, 40, 'call over');
    tp(g, [97, -4, 10.8]); use(g, 'vaultBtn');
    waitFor(g, () => g.chars.some(c => c.group === 'v2' && c.state === 'alive'), 5, 'v2 woke');
    killGroup(g, 'v2'); run(g, 2);
    tp(g, [106, -4, 14.4]); run(g, 0.2);
    assert.ok(g.flags['has:detonator']);
    tp(g, [76, -4, 11.5]); use(g, 'detonate'); run(g, 0.5);
    assert.ok(!g.world.groups.blastwall.on);
    zone(g, 'stairsUp');
    zone(g, 'lobbyIn');
    waitFor(g, () => g.char('alex').state === 'dead', 40, 'alex shot');
    waitFor(g, () => g.chars.some(c => c.group === 'lobby' && c.state === 'alive'), 5, 'lobby woke');
    killGroup(g, 'lobby');
    tp(g, [79, 0, -27.5]); use(g, 'gateBtn'); run(g, 3);
    zone(g, 'exit');
  },
  bogart(g) {
    zone(g, 'door'); killGroup(g, 'lobby');
    use(g, 'vinnie_letter');
    waitFor(g, () => g.flags.reinf, 10, 'reinforcements');
    killGroup(g, 'reinf');
    const glass = g.prop('backglass');
    g.breakGlass(glass, [1, 0, 0]);
    zone(g, 'back'); killGroup(g, 'back');
    zone(g, 'down');
    kill(g, 'tvw');
    zone(g, 'lcw'); killGroup(g, 'lc');
    g.damageProp(g.prop('r13_lock'), 99, g.prop('r13_lock').pos, [0, 0, 1]); run(g, 1);
    zone(g, 'r13');
    g.use({ char: true, id: 'tenant' });
    zone(g, 'lift1in');
    waitFor(g, () => g.flags.lift1At === 'up', 20, 'lift up');
    assert.ok(g.player.pos[1] > 3, 'rode lift1 up: ' + g.player.pos[1].toFixed(2));
    tp(g, [10, 3.4, 16]); run(g, 3); zone(g, 'c2');
    g.damageProp(g.prop('stove'), 99, g.prop('stove').pos, [0, 0, 1]);
    assert.ok(g.flags.stoveFell);
    waitFor(g, () => g.chars.some(c => c.group === 'wave' && c.state === 'alive'), 5, 'wave');
    killGroup(g, 'wave');
    zone(g, 'suite'); killGroup(g, 'finito'); run(g, 0.5);
    zone(g, 'lift2in');
    waitFor(g, () => g.done, 20, 'bogart done');
  },
  bloodveins(g) {
    run(g, 2); killGroup(g, 'bs1');
    tp(g, [24, -4, 5]); killGroup(g, 'bs2');
    tp(g, [25, -4, 11.2]); run(g, 0.2);
    assert.ok(g.player.weapons.bat, 'bat picked');
    zone(g, 'crates');
    for (const id of ['block1', 'block2', 'block3', 'block4']) g.damageProp(g.prop(id), 999, g.prop(id).pos, [0, 0, 1]);
    zone(g, 'kit'); killGroup(g, 'kit');
    zone(g, 'hallDoor');
    waitFor(g, () => g.dialogs.length === 0, 30, 'hall argue');
    killGroup(g, 'hall');
    tp(g, [53, 0, 21.5]); run(g, 0.2);
    assert.ok(g.flags['has:barkey']);
    tp(g, [50, 0, 35.2], Math.PI); run(g, 0.6, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.prop('bar_door').target === 1, 'bar door opened with key');
    killGroup(g, 'bar');
    waitFor(g, () => g.chars.some(c => c.group === 'rico' && c.state === 'alive' && c.id !== 'rico'), 5, 'rico guards');
    killGroup(g, 'rico');
    use(g, 'punch_letter');
    zone(g, 'sb'); killGroup(g, 'sb');
    tp(g, [66, 0, 17.4]); use(g, 'sb_panel');
    zone(g, 'roof'); killGroup(g, 'roof');
    tp(g, [48, 6.4, 8]); run(g, 3);
    assert.ok(g.prop('sky1').broken, 'skylight broke under Max');
    assert.ok(g.player.pos[1] < 1, 'dropped into the lobby');
    killGroup(g, 'lobby');
    tp(g, [65, 0, 11.2]); use(g, 'exit_btn'); run(g, 2);
    zone(g, 'out');
  },
  gun(g) {
    waitFor(g, () => g.flags['grp:bomb2'], 12, 'intro bombs');
    assert.ok(g.prop('merc').origin[0] > 30, 'mercedes drove off');
    zone(g, 'shop'); killGroup(g, 'shop');
    zone(g, 'alley');
    tp(g, [42, 0, 14.6], Math.PI); run(g, 3, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] < -2, 'went down the cellar stairs: ' + g.player.pos[1].toFixed(2));
    zone(g, 'cel'); killGroup(g, 'cel');
    tp(g, [24, -3.4, 20.8], 0); run(g, 3, gg => ({ yaw: 0, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > -0.2, 'climbed into the hall: ' + g.player.pos[1].toFixed(2));
    zone(g, 'hall'); killGroup(g, 'hall'); killGroup(g, 'store');
    tp(g, [28, 0, 11]); run(g, 0.2);
    assert.ok(g.flags['has:swkey']);
    tp(g, [34.8, 0, 1], -Math.PI / 2); run(g, 0.8, gg => ({ yaw: -Math.PI / 2, pitch: 0, fwd: true }));
    assert.ok(g.prop('sw0').target === 1, 'stairwell door opened with key');
    tp(g, [37, 0, 1.5], Math.PI); run(g, 3.2, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    tp(g, [38.5, 1.7, 11], 0); run(g, 2.6, gg => ({ yaw: 0, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > 3.2, 'climbed the switchback: ' + g.player.pos[1].toFixed(2));
    zone(g, 'sw1');
    waitFor(g, () => g.prop('woden_phone').ringing, 6, 'woden rings');
    killGroup(g, 'f1');
    use(g, 'woden_phone');
    waitFor(g, () => g.flags.f1 && g.dialogs.length === 0, 60, 'woden call');
    run(g, 5);
    zone(g, 'f2'); killGroup(g, 'f2');
    tp(g, [28, 6.8, 6.4], Math.PI); run(g, 3.5, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > 10, 'climbed the rubble ramp: ' + g.player.pos[1].toFixed(2));
    zone(g, 'b3'); run(g, 2);
    zone(g, 'a3'); killGroup(g, 'f3'); kill(g, 'fridge');
    const w = g.prop('kitwin'); g.breakGlass(w, [0, 0, 1]);
    zone(g, 'escape');
  },
  wings(g) {
    zone(g, 'sunk');
    g.use({ char: true, id: 'doorman' }); waitFor(g, () => g.dialogs.length === 0, 20, 'doorman talk');
    zone(g, 'b2'); killGroup(g, 'stair2');
    zone(g, 'ap');
    g.use({ char: true, id: 'beg' });
    waitFor(g, () => g.prop('pwdoor').open > 0.5, 120, 'guide opened the club door');
    waitFor(g, () => g.chars.some(c => c.group === 'amb' && c.state === 'alive'), 5, 'ambush');
    killGroup(g, 'amb'); kill(g, 'doorman');
    zone(g, 'liftIn');
    waitFor(g, () => g.prop('lift_up').open > 0.9, 20, 'lift up');
    assert.ok(g.player.pos[1] > 8, 'rode the lift: ' + g.player.pos[1].toFixed(2));
    zone(g, 'pent');
    waitFor(g, () => g.char('singer').ai.mode === 'combat', 30, 'singer out');
    kill(g, 'singer');
    tp(g, [16, 9, 3.6], Math.PI); run(g, 2.5, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > 12, 'up to the roof: ' + g.player.pos[1].toFixed(2));
    tp(g, [1, 12.4, 10.4], Math.PI / 2); run(g, 1.5, gg => ({ yaw: Math.PI / 2, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[0] < -4.2 && g.player.pos[1] > 12, 'crossed the pipes: ' + g.player.pos.map(v => v.toFixed(1)));
    tp(g, [-7, 12.4, 11]); run(g, 0.2);
    tp(g, [-6.9, 12.4, 12.6], 0); run(g, 0.1);
    tp(g, [-6.9, 12.4, 12.5], Math.PI); run(g, 2.2, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] < 10, 'down the roof stairs: ' + g.player.pos[1].toFixed(2));
    zone(g, 'b3c');
    waitFor(g, () => g.flags.exBoom && g.char('ex1').state === 'dead', 20, 'explosives');
    killGroup(g, 'b3a');
    zone(g, 'jamArea'); use(g, 'jamdoor');
    killGroup(g, 'cc');
    zone(g, 'officeFront');
    waitFor(g, () => g.char('vinnie').state === 'alive', 20, 'office opens');
    killGroup(g, 'office');
    const v = g.char('vinnie');
    g.damageChar(v, 500, 'body', [0, 0, 1], 'player', 'beretta');
    assert.ok(g.flags.vinnieRun, 'vinnie runs');
    for (let i = 0; i < 12 && !g.flags.vinnieJumped; i++) {
      const pt = v.route[Math.min(v.ai.route, v.route.length - 1)];
      tp(g, [v.pos[0] + 4, v.pos[1], v.pos[2]]);
      run(g, 4);
    }
    waitFor(g, () => g.flags.vinnieJumped, 60, 'vinnie jumped on the train');
    const t2 = g.prop('train2');
    waitFor(g, () => t2.origin[0] < -40 && t2.origin[0] > -70, 60, 'train2 passes');
    tp(g, [-56, 9.2 + 3.1 + 0.02, 24]);
    g.player.onGround = true; g.player.groundObj = g.world.groundAt(-56, 24, 12.4, 0.2).obj;
    waitFor(g, () => g.done, 5, 'wings done');
  },
  brutality(g) {
    const v = g.char('vinnie');
    const chase = (label, pred, max) => {
      const n = Math.round((max || 90) / 2);
      for (let i = 0; i < n && !pred(); i++) {
        if (v.state === 'alive' && v.ai.mode === 'flee') tp(g, [v.pos[0] - 3, v.pos[1], v.pos[2]]);
        for (const c of g.chars) if (c.state === 'alive' && !c.friendly && c.id !== 'vinnie' && M.dist(c.pos, g.player.pos) < 25) kill(g, c.id);
        run(g, 2);
      }
      assert.ok(pred(), 'timeout: ' + label);
    };
    chase('vinnie reaches the lift', () => g.flags.vinnieGone, 180);
    killGroup(g, 'court'); killGroup(g, 'swA'); killGroup(g, 'r1'); killGroup(g, 'r2');
    waitFor(g, () => g.prop('liftB').origin[1] < 0.1 && !g.flags.liftBusy, 30, 'lift back down');
    zone(g, 'liftBin');
    waitFor(g, () => g.prop('liftB_up').open > 0.9, 30, 'lift to roof');
    assert.ok(g.player.pos[1] > 12, 'on the roof: ' + g.player.pos[1].toFixed(2));
    zone(g, 'r3'); killGroup(g, 'r3'); killGroup(g, 'r3sg');
    tp(g, [55, 12.6, 49.2], Math.PI); run(g, 3.5, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] < 10, 'down the stair house: ' + g.player.pos[1].toFixed(2));
    zone(g, 'tfc'); killGroup(g, 'tfc');
    zone(g, 'loftIn');
    waitFor(g, () => g.chars.some(c => c.group === 'loft' && c.state === 'alive'), 5, 'loft wakes');
    killGroup(g, 'loft');
    assert.equal(v.ai.mode, 'surrender');
    g.use({ char: true, id: 'vinnie' });
    waitFor(g, () => g.done, 5, 'brutality done');
  },
  ragnarock(g) {
    zone(g, 'foyer'); killGroup(g, 'foyer');
    tp(g, [36, 0, 6.6]); use(g, 'secbtn');
    zone(g, 'dance'); run(g, 0.3); killGroup(g, 'dance'); killGroup(g, 'balcony');
    zone(g, 'side'); killGroup(g, 'side');
    g.damageProp(g.prop('pad'), 99, g.prop('pad').pos, [0, 0, 1]); run(g, 1);
    zone(g, 'corr'); killGroup(g, 'corr');
    tp(g, [44, 0, 40.5], Math.PI); run(g, 2.5, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > 4, 'up st1: ' + g.player.pos[1].toFixed(2));
    zone(g, 'gal'); killGroup(g, 'gal');
    zone(g, 'mezz'); killGroup(g, 'mezz');
    zone(g, 'back');
    tp(g, [-6, 4.5, 21.5], Math.PI); run(g, 2.2, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > 7.5, 'up to counting room: ' + g.player.pos[1].toFixed(2));
    zone(g, 'count'); run(g, 0.5); killGroup(g, 'count');
    zone(g, 'barrels'); killGroup(g, 'barrels');
    zone(g, 'tall'); killGroup(g, 'tall');
    tp(g, [6.8, 8, 54.8], Math.PI); run(g, 2.6, gg => ({ yaw: Math.PI, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > 10, 'east run: ' + g.player.pos[1].toFixed(2));
    tp(g, [-6.8, 10.4, 64.6], 0); run(g, 2, gg => ({ yaw: 0, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] > 11.5, 'west run to the beams: ' + g.player.pos[1].toFixed(2));
    tp(g, [-5, 12, 54], -Math.PI / 2); run(g, 3, gg => ({ yaw: -Math.PI / 2, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[0] > 8.5, 'walked the beam out to the roof: ' + g.player.pos[0].toFixed(2));
    zone(g, 'roof'); killGroup(g, 'roof');
    zone(g, 'stageTop'); killGroup(g, 'stairs');
    tp(g, [49.3, 12, 49.6], 0); run(g, 3.5, gg => ({ yaw: 0, pitch: 0, fwd: true }));
    assert.ok(g.player.pos[1] < 2, 'down to the stage: ' + g.player.pos[1].toFixed(2));
    zone(g, 'stageFloor'); killGroup(g, 'stage');
    tp(g, [63, 0, 38]); use(g, 'scenBtn'); run(g, 2);
    zone(g, 'sanctum');
  },
  empire(g) {
    zone(g, 'corr');
    tp(g, [26, 0, 6]); use(g, 'gateLever'); run(g, 3);
    zone(g, 'arena');
    waitFor(g, () => g.chars.some(c => c.group === 'amb' && c.state === 'alive'), 5, 'ambush');
    killGroup(g, 'amb'); killGroup(g, 'balc');
    waitFor(g, () => g.char('lupino').ai.mode === 'combat', 40, 'lupino fights');
    run(g, 2);
    kill(g, 'lupino'); run(g, 1);
    tp(g, [65.6, 0.6, 1.4]); use(g, 'punch_torn');
    waitFor(g, () => g.done, 5, 'empire done');
  }
};

console.log('--- Max Payne 98 ---');

test('all Part I levels are registered in order', () => {
  assert.deepEqual(M.levelOrder, ['tutorial', 'prologue', 'roscoe', 'crimescene', 'bogart', 'bloodveins', 'gun', 'wings', 'brutality', 'ragnarock', 'empire']);
});

for (const id of M.levelOrder) {
  if (!M.levels[id]) continue;
  test(`level ${id} builds with a connected nav mesh`, () => {
    const g = newGame(id);
    assert.ok(g.world.solids.length > 20);
    assert.ok(g.nav.n > 200, 'nav nodes ' + g.nav.n);
    const s = g.nav.nearest(g.player.pos);
    assert.ok(s >= 0, 'start on nav');
    for (const c of g.chars) {
      if (c.state === 'dead' || c.static || c.type === 'dummy' || c.noNav) continue;
      const q = g.nav.nearest(c.pos, 3);
      assert.ok(q >= 0, `${id}: ${c.id} off nav at ${c.pos}`);
    }
    for (const it of g.items) {
      if (it.in) continue;
      const gr = g.world.groundAt(it.pos[0], it.pos[2], it.pos[1] + 0.3, 0.05);
      let top = gr.y;
      for (const d of g.world.decor) {
        const S = M.DECOR[d.model];
        if (!S) continue;
        const r = Math.max(S.w, S.d) / 2 * (d.scale || 1);
        if (Math.abs(d.pos[0] - it.pos[0]) < r && Math.abs(d.pos[2] - it.pos[2]) < r && it.pos[1] >= d.pos[1] - 0.05 && it.pos[1] <= d.pos[1] + S.h * (d.scale || 1) + 0.35) top = Math.max(top, it.pos[1]);
      }
      assert.ok(top > it.pos[1] - 0.4, `${id}: item ${it.id} (${it.kind}) floats at ${it.pos} over ${top.toFixed(2)}`);
    }
  });
  if (WALK[id]) test(`walkthrough ${id}`, () => {
    const g = newGame(id);
    god(g);
    WALK[id](g);
    assert.ok(g.done, id + ' finished');
  });
}

test('bullet time slows the world and drains the hourglass', () => {
  const g = newGame('tutorial');
  g.bt.meter = 1;
  g.step({ yaw: g.player.yaw, pitch: 0, bt: true });
  assert.equal(g.bt.on, true);
  const t0 = g.time, r0 = g.real;
  run(g, 1);
  assert.ok((g.time - t0) < (g.real - r0) * 0.4, 'world runs slower than real time');
  assert.ok(g.bt.meter < 1);
});

test('shootdodge dives, lands and gets up', () => {
  const g = newGame('tutorial');
  tp(g, [4, 0, 3], -Math.PI / 2);
  g.step({ yaw: -Math.PI / 2, pitch: 0, fwd: true, dodge: true });
  assert.ok(g.player.dodge, 'dodge started');
  assert.equal(g.bt.on, true);
  run(g, 3);
  assert.equal(g.player.dodge, null);
  assert.ok(g.player.pos[0] > 6, 'moved forward in the dive');
});

function armed(g) {
  const p = g.player;
  p.weapons.beretta = true; p.cur = 'beretta'; p.clips.beretta = 18; p.ammo['9mm'] = 90;
  for (const c of g.chars) if (c.group) c.state = 'hidden';
}
function hold(g, sec, inp) { run(g, sec, () => Object.assign({ yaw: g.player.yaw, pitch: 0 }, inp)); }

test('cover: low barrier hides Max, slides along it and pops up to shoot', () => {
  const g = newGame('tutorial');
  armed(g);
  const p = g.player;
  tp(g, [30, 0, 3], -Math.PI / 2);
  run(g, 0.2);
  assert.ok(p.coverSpot && !p.coverSpot.tall, 'low cover offered at the barrier');
  g.step({ yaw: p.yaw, pitch: 0, cover: true });
  run(g, 0.5);
  assert.ok(p.cover && !p.cover.tall, 'in low cover');
  assert.equal(p.posture, 'cover');
  assert.ok(M.bodySpheres(p)[0].c[1] < 1.25, 'head stays near the barrier top');
  const z0 = p.pos[2];
  hold(g, 0.6, { left: true });
  assert.ok(Math.abs(p.pos[2] - z0) > 0.5, 'slid along the barrier');
  assert.ok(Math.abs(p.pos[0] - 30.67) < 0.05, 'stayed against the barrier');
  hold(g, 6, { right: true });
  assert.ok(p.pos[2] < 6 && p.cover, 'stopped at the end of the barrier');
  const shots = g.stats.shots;
  g.step({ yaw: p.yaw, pitch: 0, fire: true, firePressed: true });
  assert.equal(g.stats.shots, shots, 'no shot while still hidden');
  run(g, 0.4);
  assert.equal(g.stats.shots, shots + 1, 'queued shot fired after popping up');
  assert.equal(p.posture, 'stand');
  run(g, 1.2);
  assert.equal(p.cover.pop, 0, 'back down after the shot');
  hold(g, 0.5, { back: true });
  assert.equal(p.cover, null, 'stepping away leaves cover');
});

test('cover: tall pillar lets Max lean out at the corner only', () => {
  const g = newGame('tutorial');
  armed(g);
  const p = g.player;
  tp(g, [55.2, 0, 7], -Math.PI / 2);
  g.step({ yaw: p.yaw, pitch: 0, cover: true });
  run(g, 0.6);
  assert.ok(p.cover && p.cover.tall, 'in tall cover');
  assert.ok(p.cover.edge !== 0, 'pillar has a usable corner');
  const base = p.pos.slice();
  hold(g, 0.3, { fire: true });
  assert.ok(M.dist2d(p.pos, base) > 0.5, 'leaned out past the corner');
  run(g, 1.5);
  assert.ok(M.dist2d(p.pos, base) < 0.01, 'back behind the pillar');
  g.leaveCover('key');
  tp(g, [36, 0, -1.3], 0);
  g.step({ yaw: p.yaw, pitch: 0, cover: true });
  run(g, 0.6);
  assert.ok(p.cover && p.cover.tall && p.cover.edge === 0, 'flat wall has no corner');
  g.step({ yaw: p.yaw, pitch: 0, fire: true, firePressed: true });
  assert.equal(p.cover, null, 'firing at a flat wall leaves cover');
});

test('cover: the barrier stops most enemy bullets', () => {
  const hits = mode => {
    let n = 0;
    for (const seed of [1, 2, 3, 4]) {
      const g = newGame('tutorial', { seed });
      armed(g);
      g.diff = Object.assign({}, g.diff, { dmg: 0.0001 });
      const p = g.player;
      tp(g, mode === 'cover' ? [58.4, 0, 0.5] : [58.4, 0, 3.2], -Math.PI / 2);
      if (mode === 'cover') g.step({ yaw: p.yaw, pitch: 0, cover: true });
      run(g, 0.5);
      for (const [id, z] of [['e1', 0.5], ['e2', 3.5]]) M.AI.alertChar(g, g.addChar({ id, type: 'thug', group: 'tst', pos: [62.8, 0, z], yaw: Math.PI / 2, weapon: 'beretta', stay: true }), p.pos, 0.1);
      for (let i = 0; i < 360; i++) { g.step({ yaw: p.yaw, pitch: 0 }); for (const ev of g.events) if (ev.t === 'hurt') n++; g.events.length = 0; }
    }
    return n;
  };
  const inCover = hits('cover'), open = hits('open');
  assert.ok(open > 20, 'shooters hit an exposed Max: ' + open);
  assert.ok(inCover < open * 0.4, `cover ${inCover} vs open ${open}`);
});

test('cover: enemies flank or throw at a Max who keeps hiding', () => {
  let pressured = 0;
  for (const seed of [3, 7, 11, 19]) {
    const g = newGame('tutorial', { seed });
    armed(g);
    god(g);
    const p = g.player;
    tp(g, [58.4, 0, 0.5], -Math.PI / 2);
    g.step({ yaw: p.yaw, pitch: 0, cover: true });
    run(g, 0.5);
    const es = [['e1', 62.5, 0.5], ['e2', 63, 3.5]].map(([id, x, z]) => g.addChar({ id, type: 'thug', group: 'tst', pos: [x, 0, z], yaw: Math.PI / 2, weapon: 'beretta', gren: 1 }));
    for (const c of es) M.AI.alertChar(g, c, p.pos, 0.1);
    let hit = false;
    for (let i = 0; i < 600 && !hit; i++) { g.step({ yaw: p.yaw, pitch: 0 }); hit = es.some(c => c.ai.action === 'flank' || c.gren === 0); }
    if (hit) pressured++;
  }
  assert.ok(pressured >= 3, 'pressure in ' + pressured + ' of 4 runs');
});

test('cover: snapshot keeps Max in cover', () => {
  const g = newGame('tutorial');
  armed(g);
  tp(g, [30, 0, 3], -Math.PI / 2);
  g.step({ yaw: -Math.PI / 2, pitch: 0, cover: true });
  run(g, 0.5);
  const g2 = newGame('tutorial', { snapshot: JSON.parse(JSON.stringify(g.snapshot())) });
  run(g2, 0.3);
  assert.ok(g2.player.cover && g2.player.posture === 'cover');
});

test('hard landing slows Max, a forward roll keeps pace and softens the fall', () => {
  const g = newGame('tutorial');
  const p = g.player;
  tp(g, [36, 0, 3], Math.PI / 2);
  p.pos[1] = 1.5; p.vel[1] = -10; p.onGround = false;
  run(g, 0.2);
  assert.equal(p.land && p.land.kind, 'hard');
  const x0 = p.pos[0];
  hold(g, 0.25, { fwd: true });
  assert.ok(Math.abs(p.pos[0] - x0) < 0.5, 'barely moves right after a hard landing');
  tp(g, [34, 0, 3], -Math.PI / 2);
  hold(g, 0.5, { fwd: true });
  p.pos[1] = 1.5; p.vel[1] = -12.8; p.onGround = false;
  const hp = p.hp;
  hold(g, 0.2, { fwd: true });
  assert.equal(p.land && p.land.kind, 'roll');
  assert.equal(p.hp, hp, 'roll absorbs a fall that would hurt on a hard landing');
  assert.ok(Math.hypot(p.vel[0], p.vel[2]) > 4, 'roll keeps running speed');
});

test('mocap clips for cover, landing and turning decode and pose cleanly', () => {
  require(path.join(DIR, 'mp-mocap.js'));
  require(path.join(DIR, 'mp-anim.js'));
  const A = M.Anim;
  for (const k of ['cover_in_low', 'cover_in_tall', 'cover_out_low', 'cover_out_tall', 'cover_idle_low', 'cover_idle_tall', 'cover_left_low', 'cover_right_low', 'cover_left_tall', 'cover_right_tall', 'jump_up', 'fall', 'land_hard', 'land_roll', 'run_stop', 'turn_l', 'turn_r', 'sprint', 'idle_stance', 'idle_look', 'idle_shift']) {
    const c = A.clip(k);
    assert.ok(c && c.frames > 4 && c.v.every(Number.isFinite), 'clip ' + k);
  }
  assert.ok(A.clip('cover_left_tall').dist > 1, 'sneak clips carry their stride length');
  const base = { t: 1.3, phase: 0, move: [0, 0], speed: 0, hold: 'pistol', pitch: 0, fireT: 9, reloadT: 9, throwT: 9, swingT: 9, flinchT: 9 };
  const states = [
    Object.assign({}, base, { cover: { tall: false, k: 1, enter: -1, out: -1, slide: 0.8, dist: 0.4, edge: 0, wall: 0.3 } }),
    Object.assign({}, base, { cover: { tall: true, k: 0.5, enter: 0.4, out: -1, slide: 0, dist: 0, edge: 1, wall: -2 } }),
    Object.assign({}, base, { cover: { tall: true, k: 1, enter: -1, out: 0.5, slide: 0, dist: 0, edge: 0, wall: 1 } }),
    Object.assign({}, base, { air: true, airT: 0.3, jumped: true }),
    Object.assign({}, base, { land: { kind: 'roll', t: 0.3 } }),
    Object.assign({}, base, { land: { kind: 'hard', t: 0.2 } }),
    Object.assign({}, base, { feet: 0.6, turn: 1, turnT: 0.2 }),
    Object.assign({}, base, { stopT: 0.2, hold: 'none', seed: 5 }),
    Object.assign({}, base, { speed: 5.1, move: [0, 5.1], phase: 3 })
  ];
  for (const s of states) {
    const P = A.pose(s);
    assert.ok(P.root.every(Number.isFinite) && P.rot.every(r => r.every(Number.isFinite)), 'finite pose ' + JSON.stringify(Object.keys(s)));
  }
  const hidden = A.pose(states[0]);
  assert.ok(hidden.root[1] < -0.3, 'low cover pose crouches');
});

test('painkillers heal over time', () => {
  const g = newGame('tutorial');
  g.player.pk = 2; g.player.hp = 30;
  assert.ok(g.usePainkillers());
  run(g, 1.2);
  assert.ok(g.player.hp > 70);
  assert.equal(g.player.pk, 1);
});

test('enemies shoot projectiles that can hurt the player', () => {
  const g = newGame('prologue');
  zone(g, 'hall');
  const hp = g.player.hp;
  run(g, 4);
  assert.ok(g.player.hp < hp, 'player took damage');
});

test('gas cylinder explodes and kills nearby targets', () => {
  const g = newGame('tutorial');
  g.raise('gc');
  run(g, 0.1);
  const cyl = g.prop('tut_cyl');
  g.damageProp(cyl, 100, cyl.pos, [1, 0, 0]);
  run(g, 1);
  assert.ok(cyl.exploded);
  assert.ok(g.chars.filter(c => c.group === 'gc').every(c => c.state === 'dead'));
});

test('snapshot round-trip restores player and world state', () => {
  const g = newGame('prologue');
  zone(g, 'hall');
  killGroup(g, 'down');
  g.player.hp = 42;
  const snap = JSON.parse(JSON.stringify(g.snapshot()));
  const g2 = newGame('prologue', { snapshot: snap });
  assert.equal(Math.round(g2.player.hp), 42);
  assert.ok(g2.chars.filter(c => c.group === 'down').every(c => c.state === 'dead'));
  assert.equal(g2.trigger('hall').fired, true);
});

function findComment(src, css) {
  const BS = String.fromCharCode(92);
  let i = 0, q = null;
  const prevSig = k => { let j = k - 1; while (j >= 0 && ' \t\r\n'.includes(src[j])) j--; return j >= 0 ? src[j] : ''; };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (q) {
      if (c === BS) { i += 2; continue; }
      if (c === q) q = null;
      i++;
      continue;
    }
    if (!css && (c === '"' || c === "'" || c === '`')) { q = c; i++; continue; }
    if (c === '/' && n === '*') return i;
    if (!css && c === '/' && n === '/') return i;
    if (!css && c === '/' && ('(,=:[!&|?{};+-*%<>~^'.includes(prevSig(i)) || src.slice(Math.max(0, i - 8), i).trimEnd().endsWith('return'))) {
      i++;
      let cls = false;
      while (i < src.length && src[i] !== '\n') {
        const d = src[i];
        if (d === BS) { i += 2; continue; }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) break;
        i++;
      }
      i++;
      continue;
    }
    i++;
  }
  return -1;
}

test('story and dialogue text has no em dashes', () => {
  const files = fs.readdirSync(DIR).filter(f => /^mp-(l\d\d-|story|data|menu|ui|novel|hud)/.test(f));
  let total = 0;
  for (const f of files) {
    const src = fs.readFileSync(path.join(DIR, f), 'utf8');
    const n = (src.match(/—/g) || []).length;
    total += n;
    assert.equal(n, 0, 'em dash in ' + f);
  }
  assert.equal(total, 0);
});

test('every chapter has intro and outro pages with valid layouts', () => {
  for (const id of M.levelOrder) {
    const def = M.levels[id];
    for (const key of [def.intro, def.outro]) {
      if (!key) continue;
      const pages = M.STORY[key];
      assert.ok(pages && pages.length, 'story ' + key);
      for (const pg of pages) {
        assert.ok(pg.panels.length >= 1);
        for (const pn of pg.panels) assert.ok(pn.art || pn.shot, key + ' panel');
      }
    }
  }
  assert.ok(M.STORY.alex_dies);
  for (const [k, show] of Object.entries(M.TV)) assert.equal(typeof show.paint, 'function', 'tv ' + k);
});

test('source files contain no comments', () => {
  const files = fs.readdirSync(DIR).map(f => path.join(DIR, f)).concat([path.join(ROOT, 'js', 'apps', 'maxpayne-app.js'), path.join(ROOT, 'tools', 'maxpayne-shots.cjs'), path.join(ROOT, 'css', 'apps', 'maxpayne.css'), __filename]).filter(f => fs.existsSync(f));
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    const at = findComment(src, f.endsWith('.css'));
    assert.equal(at, -1, `comment in ${path.basename(f)} at line ${src.slice(0, Math.max(0, at)).split('\n').length}`);
  }
});

console.log(`${passed} tests passed`);

