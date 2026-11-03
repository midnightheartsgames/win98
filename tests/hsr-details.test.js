const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const DIR = path.join(__dirname, '../js/apps/hsr98');

let checks = 0;
const ok = (c, m) => { assert.ok(c, m); checks++; };
const eq = (a, b, m) => { assert.equal(a, b, m); checks++; };

const noop = () => { };
const makeCanvas = (w = 300, h = 150) => {
  const cv = { width: w, height: h, style: {}, className: '', addEventListener: noop, getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 480 }) };
  const grad = () => ({ addColorStop: noop });
  const ctx = {
    canvas: cv, lineWidth: 1, lineCap: 'butt', lineJoin: 'miter', globalAlpha: 1, globalCompositeOperation: 'source-over', font: '10px x', textAlign: 'left', textBaseline: 'alphabetic', imageSmoothingEnabled: false, fillStyle: '#000', strokeStyle: '#000',
    save: noop, restore: noop, beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop, arc: noop, rect: noop, fill: noop, stroke: noop, clip: noop, ellipse: noop,
    fillRect: noop, strokeRect: noop, clearRect: noop, fillText: noop, strokeText: noop, translate: noop, rotate: noop, scale: noop, setLineDash: noop, drawImage: noop, putImageData: noop, setTransform: noop,
    measureText: t => ({ width: String(t).length * 6 }), createPattern: () => ({}), createLinearGradient: grad, createRadialGradient: grad,
    getImageData: (x, y, gw, gh) => ({ data: new Uint8ClampedArray(Math.max(1, gw * gh) * 4), width: gw, height: gh }),
    createImageData: (gw, gh) => ({ data: new Uint8ClampedArray(gw * gh * 4), width: gw, height: gh })
  };
  cv.getContext = () => ctx;
  return cv;
};
const store = new Map();
Object.assign(globalThis, {
  document: { createElement: tag => (tag === 'canvas' ? makeCanvas() : { style: {}, appendChild: noop, addEventListener: noop }), querySelector: () => null, addEventListener: noop, removeEventListener: noop },
  localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
  requestAnimationFrame: () => 1, cancelAnimationFrame: noop
});

const page = fs.readFileSync(path.join(__dirname, '../hsr98.html'), 'utf8');
const listed = [...page.matchAll(/js\/apps\/hsr98\/(hsr-[a-z0-9-]+)\.js/g)].map(m => m[1]);
const H = require(path.join(DIR, 'hsr-core.js'));
for (const f of listed.filter(x => x !== 'hsr-bug' && x !== 'hsr-ui-bug')) require(path.join(DIR, f + '.js'));

{
  const at = f => listed.indexOf(f);
  ok(at('hsr-details') > at('hsr-ui-luofu') && at('hsr-ui-details') > at('hsr-details') && at('hsr-ui-details') < at('hsr-bug'), 'hsr98.html loads the details modules after hsr-ui-luofu and before hsr-bug');
  const main = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8'), pos = f => main.indexOf('js/apps/hsr98/' + f + '.js');
  ok(pos('hsr-details') > pos('hsr-ui-luofu') && pos('hsr-ui-details') > pos('hsr-details') && pos('hsr-ui-details') < pos('hsr-bug'), 'index.html loads the details modules in the same place');
}

const root = { classList: { add: noop }, set innerHTML(v) { this.html = v; }, appendChild: noop, addEventListener: noop, removeEventListener: noop, focus: noop };
const ui = new H.UI(root, { onExit: noop });
const team = ['seele', 'bronya', 'natasha', 'gepard'];
const mkGame = seed => {
  const g = new H.Game({ seed });
  for (const k of team) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0);
  g.state.party = team.slice();
  g.loadMap('express_lab', 'v');
  g.script = null; g.pending = null; g.cg = null; g.events.length = 0;
  return g;
};
const pump = n => { for (let i = 0; i < n; i++) { ui.update(1 / 30); ui.render(); } };
const press = (k, code) => ui.handleKey(k, code || null, {});
const waitIdle = (max = 6000) => { for (let i = 0; i < max && !ui.bdIdle() && !(ui.bt && ui.bt.result) && !ui.screens.length; i++) ui.update(1 / 10); ui.render(); return ui.bdIdle(); };
const fight = (g, o) => {
  ui.game = g; ui.mode = 'field'; ui.screens = []; ui.dlg = null;
  g.startBattle(Object.assign({ lvl: 30, bg: 'station', music: 'battle', seed: 4242 }, o));
  ui.drainGameEvents();
  ui.bt.auto = false;
  ok(ui.mode === 'battle' && g.battle, 'the fight starts');
  ok(waitIdle(), 'the fight waits for input');
  return g.battle;
};
const unitSnap = u => [u.name, u.hp, u.shield, u.shieldT, Math.round(u.energy || 0), Math.round((u.av || 0) * 1000), u.tough, u.frozen, u.taunt, u.buffs.map(x => [x.name, x.s, x.v, x.turns, x.skip || 0]), u.dots.map(d => [d.type, d.turns, d.stacks])];
const snapBattle = b => JSON.stringify([[...b.allies, ...b.enemies, ...b.summons].map(unitSnap), b.sp, b.phase, b.current && b.current.name, b.wave]);
const hitAt = (x, y) => { for (let i = ui.hits.length - 1; i >= 0; i--) { const h = ui.hits[i]; if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) return h; } return null; };
const BTN = { x: 32, y: 341 };
const top = () => ui.top();
const isDetails = () => !!(top() && top().name === 'battleDetails');

{
  const g = mkGame(11), b = fight(g, { enemies: ['reaver:30', 'eliminator:30', 'flamespawn:30'] });
  ui.render();
  const h = hitAt(BTN.x, BTN.y);
  ok(h, 'the button sits under the turn order');
  ok(ui.turnCell(6).y + ui.turnCell(6).size < 326, 'the last turn order cell ends above the button');

  const was = snapBattle(b), save = JSON.stringify(g.state), target = ui.bt.target, pick = ui.bt.pick;
  h.fn();
  ok(isDetails(), 'a click on the button opens the details at once while the fight waits');
  ok(top().pause, 'the details screen pauses the fight');
  eq(top().side, 'foe', 'the details open on the enemies');
  eq(top().unit, target, 'the details open on the current target');
  ui.bt.auto = true;
  pump(60);
  eq(snapBattle(b), was, 'nothing moves while the details are open, even with auto battle on');
  ui.bt.auto = false;
  press(null, 'Tab');
  eq(top().side, 'ally', 'Tab switches to the allies');
  ok(b.allies.includes(top().unit), 'the ally side shows an ally');
  for (const side of ['ally', 'foe']) {
    for (let t = 0; t < 3; t++) {
      for (let i = 0; i < top().list().length; i++) { pump(1); press('right'); }
      press(null, 'KeyE');
    }
    press(null, 'Tab');
  }
  for (let i = 0; i < 6; i++) press('down');
  for (let i = 0; i < 9; i++) press('up');
  pump(2);
  eq(top().sc.top, 0, 'scrolling up stops at the top');
  press(null, 'PageDown'); pump(1);
  ok(top().sc.top >= 0, 'scrolling never goes below zero');
  press('back');
  ok(!isDetails(), 'Esc closes the details');
  eq(snapBattle(b), was, 'the fight is the same after the details');
  eq(JSON.stringify(g.state), save, 'the save is the same after every tab of every unit');
  eq(ui.bt.target, target, 'the target is kept');
  eq(ui.bt.pick, pick, 'the picked action is kept');

  press(null, 'KeyC');
  ok(isDetails(), 'C opens the details');
  press(null, 'KeyC');
  ok(!isDetails(), 'C closes the details');
  press(null, 'KeyC');
  pump(1);
  const x = hitAt(621, 19);
  ok(x, 'the close button is there');
  x.fn();
  ok(!isDetails(), 'the close button closes the details');

  const list = ui.bdUnits('foe');
  eq(list.length, 3, 'three enemies are listed');
  ok(list.every((u, i) => i === 0 || ui.enemyLayout().get(u).x > ui.enemyLayout().get(list[i - 1]).x), 'enemies follow the arena from left to right');
  ui.bt.target = list[2];
  press(null, 'KeyC');
  eq(top().unit, list[2], 'the details follow a new target');
  press('right');
  eq(top().unit, list[0], 'right arrow wraps around');
  press('left');
  eq(top().unit, list[2], 'left arrow wraps back');
  press(null, 'Tab'); press(null, 'Tab');
  eq(top().unit, list[2], 'the side remembers its unit');
  press(null, 'KeyE');
  eq(top().tab(), 1, 'E goes to the next tab');
  press(null, 'KeyQ'); press(null, 'KeyQ');
  eq(top().tab(), 2, 'Q wraps to the last tab');
  press('back');
  press(null, 'KeyC');
  eq(top().tab(), 2, 'the tab is remembered in this fight');
  press(null, 'KeyE');
  press('back');

  b.enemies[1].dead = true;
  ok(!ui.bdUnits('foe').includes(b.enemies[1]), 'a fallen enemy leaves the list');
  b.enemies[1].dead = false;
  b.allies[3].dead = true;
  eq(ui.bdUnits('ally').length, 4, 'a fallen ally stays in the list');
  const m3 = H.BD.model(b, b.allies[3]);
  ok(m3.dead, 'a fallen ally is marked');
  b.allies[3].dead = false;

  ui.bt.allyMode = { kind: 'skill', target: b.allies[2] };
  press(null, 'KeyC');
  eq(top().side, 'ally', 'choosing an ally opens the details on the allies');
  eq(top().unit, b.allies[2], 'on the chosen ally');
  press('back');
  ui.bt.allyMode = null;
  ok(ui.openBattleDetails(b.allies[1]) && top().unit === b.allies[1] && top().side === 'ally', 'a unit can be opened directly');
  press('back');

  const foe = b.enemies[0], ally = b.allies[0];
  foe.buffs.push({ s: 'defDown', v: 0.2, turns: 2, name: 'Тест: защита', debuff: true });
  foe.dots.push({ type: 'burn', dmg: 120, turns: 3, src: ally, stacks: 2 });
  ally.buffs.push({ s: 'atkP', v: 0.3, turns: 99, name: 'Тест: навсегда' });
  ally.shield = 300; ally.shieldT = 2;
  const mf = H.BD.model(b, foe), ma = H.BD.model(b, ally);
  ok(mf.statuses.debuff.some(s => s.name === 'Тест: защита' && s.turns === 2), 'enemy debuffs come with their turns');
  ok(mf.statuses.debuff.some(s => s.kind === 'dot' && s.stacks === 2 && s.turns === 3), 'DoT comes with stacks and turns');
  ok(ma.statuses.buff.some(s => s.name === 'Тест: навсегда' && s.perm), 'a 99-turn buff lasts to the end');
  ok(ma.statuses.buff[0].kind === 'shield' && ma.statuses.buff[0].value === 300 && ma.statuses.buff[0].turns === 2, 'the shield is listed first with its size');
  eq(mf.counts.debuff, mf.statuses.debuff.length, 'the footer counts debuffs');
  eq(ma.hp, Math.round(ally.hp), 'HP comes from the engine');
  eq(H.BD.rightOf({ perm: true }), 'до конца боя', 'permanent effects say so');
  eq(H.BD.rightOf({ turns: 3, stacks: 2 }), '×2 · Осталось ходов: 3', 'stacks and turns share a line');
  eq(H.BD.rightOf({ count: '2 из 4' }), '2 из 4', 'counters show how full they are');
  ok(mf.statuses.debuff.find(s => s.name === 'Тест: защита').text === 'Защита −20%.', 'a stat debuff is described by its key');
  ok(mf.statuses.debuff.find(s => s.kind === 'dot').text === 'В начале хода получает 240\u00a0огненного урона.', 'DoT damage counts its stacks');
  ok(ma.statuses.buff[0].text.startsWith('Поглощает 300'), 'the shield says how much it absorbs');
  ok(ma.statuses.buff.find(s => s.name === 'Тест: навсегда').right === 'до конца боя', 'the right column says how long');
  press(null, 'KeyC'); pump(2); press(null, 'Tab'); pump(2); press('back');
  foe.buffs.pop(); foe.dots.pop(); ally.buffs.pop(); ally.shield = 0; ally.shieldT = 0;

  ui.bt.ult = { draw: noop, tick: noop, skip: noop, done: false, fading: false };
  ui.render();
  ok(!hitAt(BTN.x, BTN.y), 'no button during an ultimate scene');
  press(null, 'KeyC');
  ok(!isDetails() && ui.bt.bdWant, 'C during a scene becomes a request');
  press(null, 'KeyC');
  ok(!ui.bt.bdWant, 'a second C drops the request');
  ui.bt.ult = null;
  ui.render();
  ok(hitAt(BTN.x, BTN.y), 'the button returns after the scene');
}

{
  const g = mkGame(12), b = fight(g, { enemies: ['reaver:30', 'eliminator:30'] });
  ui.battleKey('ok', 'Enter');
  ok(!ui.bdIdle(), 'an action keeps the fight busy');
  press(null, 'KeyC');
  ok(!isDetails() && ui.bt.bdWant, 'C while busy waits');
  ui.render();
  ok(hitAt(BTN.x, BTN.y), 'the waiting button stays');
  for (let i = 0; i < 6000 && !isDetails() && !ui.bt.result; i++) ui.update(1 / 10);
  ok(isDetails(), 'the details open as soon as the fight waits');
  ok(ui.bdIdle(), 'and the fight really waits under them');
  ok(!ui.bt.bdWant, 'the request is used up');
  press('back');

  ui.bt.auto = true;
  ui.update(1 / 10);
  ok(!ui.bdIdle(), 'auto battle keeps the fight busy');
  press(null, 'KeyC');
  ok(ui.bt.bdWant && !ui.bt.auto && ui.bt.bdResume, 'a request pauses auto battle');
  press(null, 'KeyV');
  ok(!ui.bt.bdResume && !ui.bt.auto, 'V while waiting changes what happens after the details');
  press(null, 'KeyV');
  ok(ui.bt.bdResume, 'V again brings auto back after the details');
  for (let i = 0; i < 6000 && !isDetails() && !ui.bt.result; i++) ui.update(1 / 10);
  ok(isDetails(), 'the details open in auto battle');
  press('back');
  ok(ui.bt.auto && !ui.bt.bdResume, 'auto battle goes on after the details');

  ui.bt.auto = true;
  ui.update(1 / 10);
  press(null, 'KeyC');
  press(null, 'KeyC');
  ok(!ui.bt.bdWant && ui.bt.auto, 'dropping a request in auto battle turns auto back on');

  ui.bt.auto = false;
  waitIdle();
  ui.bt.bdWant = { u: null }; ui.bt.bdResume = true;
  b.finish(true);
  for (let i = 0; i < 200 && !ui.bt.result; i++) ui.update(1 / 10);
  ok(ui.bt.result && !ui.bt.bdWant && ui.bt.auto, 'a fight that ends drops the request and gives auto back');
  press('ok');
  eq(ui.bt.autoSticky, true, 'auto stays sticky for the next fight');
  ui.bt.autoSticky = false;
}

{
  const run = asking => {
    const g = mkGame(21), b = fight(g, { enemies: ['reaver:30', 'eliminator:30', 'flamespawn:30'], seed: 777 });
    const log = [], ap = ui.applyEvent;
    ui.applyEvent = function (e) { log.push(e.t + ':' + (e.u ? e.u.name : '') + ':' + (e.v != null ? e.v : '')); return ap.call(this, e); };
    ui.bt.auto = true;
    let opened = 0;
    for (let i = 0; i < 40000 && !ui.bt.result; i++) {
      if (isDetails()) { opened++; press('back'); continue; }
      if (asking && i % 37 === 0 && !ui.bt.bdWant) press(null, 'KeyC');
      ui.update(1 / 10);
    }
    delete ui.applyEvent;
    const out = { win: b.result && b.result.win, actions: b.actions, round: b.round, hp: b.allies.map(a => a.hp).join(), log: log.join('|'), opened };
    press('ok');
    ui.bt.autoSticky = false;
    return out;
  };
  const plain = run(false), asked = run(true);
  ok(asked.opened > 2, 'the details opened several times during auto battle');
  eq(asked.win, plain.win, 'opening the details keeps the outcome');
  eq(asked.actions, plain.actions, 'and the number of actions');
  eq(asked.hp, plain.hp, 'and the HP left');
  eq(asked.log, plain.log, 'and every played event');
}

{
  const g = mkGame(31), b = fight(g, { enemies: ['cocolia1:29', 'iceedge:27'], boss: true });
  press(null, 'KeyC');
  ok(isDetails() && top().list().length === 2, 'a boss fight lists the boss and the add');
  pump(2);
  press('back');
}

{
  const g = mkGame(32);
  fight(g, { waves: [['reaver:20'], ['eliminator:20', 'flamespawn:20']] });
  press(null, 'KeyC');
  pump(2);
  ok(isDetails(), 'a fight with waves opens the details');
  press('back');
}

{
  const g = mkGame(33);
  g.state.squads = []; g.state.squads[3] = team.slice();
  g.state.range = { team: { squad: 3 }, waves: [[{ id: 'reaver', lvl: 20 }, { id: 'eliminator', lvl: 20 }]] };
  ui.game = g; ui.mode = 'field'; ui.screens = [];
  ui.rangeLaunch();
  ok(ui.mode === 'battle' && g.battle.opts.range, 'a Range fight starts');
  ui.bt.auto = false;
  waitIdle();
  press(null, 'KeyC');
  ok(isDetails(), 'C opens the details in the Range');
  press(null, 'Tab');
  ok(isDetails() && top().side === 'ally' && !ui.bt.sub, 'Tab inside the details switches the side, not the Range panel');
  press('back');
  press(null, 'Tab');
  pump(2);
  ok(ui.bt.sub && ui.bt.sub.type === 'range', 'Tab in the fight still opens the Range panel');
  press(null, 'Tab');
  pump(1);
  press(null, 'KeyC');
  ok(isDetails(), 'and the details still open after it');
  press('back');
}

{
  const g = mkGame(34), b = fight(g, { enemies: ['reaver:30'] });
  ui.bt.sub = { type: 'pause', sel: 0 };
  press(null, 'KeyC');
  ok(isDetails(), 'the details open over the pause menu');
  press('back');
  ok(ui.bt.sub && ui.bt.sub.type === 'pause', 'the pause menu waits under them');
  ui.bt.sub = null;
  const had = ui.chainOpen;
  ui.chainOpen = () => true;
  ok(!ui.bdIdle(), 'an open attack chain counts as busy');
  ui.chainOpen = had;
  delete ui.chainOpen;
  ok(b.living.length === 1, 'the fight is untouched');
}

{
  const g = mkGame(41), b = fight(g, { enemies: ['reaver:30', 'eliminator:30'] });
  const a = b.allies[0], e = b.enemies[0];
  a.hp = Math.round(a.maxHp * 0.5);
  a.buffs.push({ s: 'critD', v: 0.4, turns: 2, name: 'Тест: условие', cond: 'hp80' });
  const r = H.BD.statuses(a, b).buff.find(x => x.name === 'Тест: условие');
  ok(r && r.on === false && r.text.includes('Действует при HP от 80%'), 'a buff under its condition says it does not work now');
  a.buffs.pop();
  a.buffs.push({ s: 'hotMark', v: 0, turns: 2, name: 'Тест: лечение', hot: 120 });
  ok(H.BD.statuses(a, b).buff.find(x => x.name === 'Тест: лечение').text === 'В начале хода восстанавливает 120\u00a0HP.', 'healing over time names its amount');
  a.buffs.pop();
  e.buffs.push({ s: 'fireVuln', v: 0.2, turns: 2, name: 'Тест: огонь', debuff: true }, { s: 'iceResDown', v: 0.1, turns: 2, name: 'Тест: лёд', debuff: true });
  const ed = H.BD.statuses(e, b).debuff;
  eq(ed.find(x => x.name === 'Тест: огонь').text, 'Получаемый огненный урон +20%.', 'element vulnerability has its element');
  eq(ed.find(x => x.name === 'Тест: лёд').text, 'Сопротивление ледяному урону −10%.', 'element RES down has its element');
  e.buffs.length -= 2;
  e.frozen = 1; e.frozenDmg = 300; e.stun = 1;
  const fr = H.BD.statuses(e, b).debuff;
  ok(fr.some(x => x.kind === 'freeze' && x.right === 'до своего хода' && x.text.includes('300')), 'a frozen enemy shows the thaw damage');
  ok(fr.some(x => x.kind === 'stun'), 'a stunned enemy is listed');
  e.frozen = 0; e.frozenDmg = 0; e.stun = 0;
  e.charging = 0;
  ok(H.BD.statuses(e, b).other.some(x => x.kind === 'charge' && x.name === 'Готовит: ' + e.data.skills[0].n), 'a charging enemy names the skill');
  e.charging = null;
}

{
  const A = require(path.join(__dirname, '../tools/hsr-details-audit.cjs'));
  const miss = A.uncovered(H, A.staticKeys(path.join(__dirname, '..')));
  eq(miss.join(', '), '', 'every buff key in the source has a text');
  const r = A.audit(H, { runs: 40, max: 40 });
  ok(r.battles >= 36 && r.seen.size > 100, 'the audit sample covers many statuses');
  eq([...r.problems.keys()].join('; '), '', 'every status in the audit sample has a proper text');
  const kit = A.audit(H, { kits: ['qingque', 'darkness', 'makoto', 'jingliu'], runs: 6, max: 6 });
  for (const [k] of kit.seen) ok(!/other \| kit \| {2}\| (Закрытый конг|Восторг|Блестяшки|Спектральная трансмиграция)$/.test(k), 'a counter that has a buff of the same name merges into it: ' + k);
  for (const m of A.modes(H, true)) {
    const mr = A.audit(H, m);
    ok(mr.battles > 0 && mr.seen.size > 5, 'the audit plays fights of ' + m.mode);
    eq([...mr.problems.keys()].join('; '), '', 'every status in ' + m.mode + ' has a proper text');
    if (m.mode === 'su remembrance') {
      ok(mr.seen.has('foe | debuff | buff | res | Путь: Память'), 'the Remembrance path on a foe stands among its negative effects');
      ok(mr.seen.has('foe | debuff | buff | vuln | Опыт: Первородные трудности'), 'a blessing that makes foes take more damage is negative for them');
    }
  }
  ok(H.BD.hurts({ s: 'res', v: -0.1 }) && H.BD.hurts({ s: 'defDown', v: 0.2 }) && H.BD.hurts({ s: 'fireVuln', v: 0.1 }) && H.BD.hurts({ s: 'defP', v: -0.3 }), 'lower stats and more damage taken hurt the holder');
  ok(!H.BD.hurts({ s: 'dr', v: 0.2 }) && !H.BD.hurts({ s: 'vuln', v: -0.2 }) && !H.BD.hurts({ s: 'atkP', v: 0.3 }) && !H.BD.hurts({ s: 'shackle', v: 2 }), 'less damage taken and higher stats help the holder');
}

{
  const g = mkGame(51), b = fight(g, { enemies: ['reaver:30', 'eliminator:30'] });
  const S = H.battleStat, a = b.allies[0], e = b.enemies[0];
  a.buffs.push({ s: 'atkP', v: 0.3, turns: 2, name: 'Тест: атака' }, { s: 'critR', v: 0.25, turns: 2, name: 'Тест: крит' }, { s: 'spd', v: 12, turns: 2, name: 'Тест: скорость' }, { s: 'defP', v: -0.2, turns: 2, name: 'Тест: защита', debuff: true });
  const m = H.BD.model(b, a, g), [atk, def, cr, cd, spd] = m.stats.main;
  eq(atk.total, S.atkOf(a), 'attack total comes from the engine');
  eq(atk.text, H.fmt(Math.round(a.base.atk)).replace(/ /g, ' '), 'attack shows the base from the hero sheet');
  eq(atk.plus, '+' + H.fmt(Math.round(S.atkOf(a)) - Math.round(a.base.atk)).replace(/ /g, ' '), 'attack shows the battle bonus apart');
  ok(def.delta < 0 && def.plus.startsWith('−'), 'a defense debuff shows a minus');
  eq(cr.total, S.sv(a, 'critR'), 'crit rate comes from the engine');
  eq(cr.plus, '+25%', 'crit rate bonus is in percent');
  eq(cd.plus, '', 'no bonus means no second number');
  eq(spd.total, S.spdOf(a), 'speed comes from the engine');
  eq(spd.delta, Math.round(S.spdOf(a) * 10) / 10 - Math.round(a.base.spd * 10) / 10, 'speed bonus is the difference');
  ok(m.stats.all.length >= 15 && m.stats.all.every(r => r.label && !/undefined|NaN/.test(r.text + r.plus)), 'every extra stat has a label and a value');
  ok(m.stats.all.some(r => r.key === a.elem + 'P' && r.label === H.ELEMENTS[a.elem].name + ' урон'), 'the element damage row names the hero element');
  a.buffs.length -= 4;

  press(null, 'KeyC'); press(null, 'Tab');
  eq(top().side, 'ally', 'the ally side is open');
  press('ok');
  ok(ui.bt.bd.ext, 'Enter opens all stats');
  pump(2);
  press('ok');
  ok(!ui.bt.bd.ext, 'Enter again returns to five stats');
  press('back');

  a.sets = { station: true };
  const set = () => H.BD.statuses(a, b).other.find(x => x.kind === 'set');
  const spd0 = a.base.spd;
  a.base.spd = 119;
  ok(set() && set().on === false && set().text.includes('скорость 119'), 'a planar set below its speed says it does not work');
  a.base.spd = 121;
  ok(set().on === true && set().right === 'действует', 'a planar set over its speed works');
  a.base.spd = spd0; a.sets = {};

  const fm = H.BD.model(b, e, g);
  eq(fm.spd.total, S.spdOf(e), 'enemy speed comes from the engine');
  eq(fm.effRes.total, S.sv(e, 'res'), 'enemy effect RES comes from the engine');
  eq(fm.others, Object.keys(H.ELEMENTS).length - e.weak.length - fm.resist.length, 'the other elements are counted');
  ok(fm.contact.can && fm.contact.family === H.CONTACT[e.data.fam].name, 'a normal enemy can be contacted and names its family');
  eq(fm.contact.hint.length, 0, 'no hint before any contact outcome is known');
  e.mood.angry = 2;
  g.state.bank.enemies[e.id].contacts = { eager: 2 };
  const fc = H.BD.model(b, e, g).contact;
  ok(fc.mood.includes('злость 2 из ' + H.TUNING.contactThreshold), 'the current mood is listed');
  ok(fc.known.includes('интерес ×2'), 'known outcomes come from the Archive');
  ok(fc.hint.length > 0, 'the hint opens once an outcome is known');
  e.mood.angry = 0;
  g.state.bank.enemies[e.id].contacts = {};
  b.opts.noContact = true;
  ok(H.BD.model(b, e, g).contact.off, 'a fight without Contact says so');
  b.opts.noContact = false;
  press(null, 'KeyC'); pump(2); press('back');
  eq(ui.statValue({ critR: 0.125 }, 'critR', {}, {}), '12,5%', 'the hero menu writes a comma like the details');
}

{
  const g = mkGame(52), b = fight(g, { enemies: ['cocolia1:29', 'iceedge:27'], boss: true });
  const boss = b.enemies.find(u => u.data.boss), m = H.BD.model(b, boss, g);
  ok(!m.contact.can, 'a boss cannot be contacted');
  ok(m.resist.every(x => !boss.weak.includes(x)), 'resistances never repeat weaknesses');
  press(null, 'KeyC'); pump(2); press('back');
}

{
  const g = mkGame(61), b = fight(g, { enemies: ['reaver:30', 'eliminator:30', 'flamespawn:30'] });
  for (const u of b.allies) {
    const k = u.key, kitId = g.kitOf(k);
    const menu = ui.abilityRows(H.CHARS[kitId], kitId, id => ({ lv: g.traceLevel(k, id), up: g.traceNode(k, id).up || 0 }));
    const mine = ui.bdSkillItems({ u }).filter(it => it.type === 'ab').map(it => it.r);
    eq(mine.map(r => r.desc + '|' + r.lv).join(' / '), menu.map(r => r.desc + '|' + r.lv).join(' / '), 'the abilities of ' + u.name + ' read the same as in the hero menu');
    ok(menu.every(r => r.line === (r.ab.text ? r.kind + ' · ' + r.ab.text + r.extra : r.kind + ' · ' + r.target + ' · ' + r.desc + r.extra)), 'the hero menu line keeps its old shape for ' + u.name);
  }
  press(null, 'KeyC'); press(null, 'Tab'); press(null, 'KeyE');
  eq(top().tab(), 1, 'the ally abilities tab is open');
  const n = ui.bdSkillItems({ u: top().unit }).length;
  press('down');
  eq(ui.bt.bd.ab, 1, 'down picks the next ability');
  press('up'); press('up');
  eq(ui.bt.bd.ab, n - 1, 'up wraps to the last ability');
  for (let i = 0; i < n; i++) { pump(1); press('down'); }
  press('back');
  ui.bt.bd.ab = 0;
}

{
  const g = mkGame(62);
  for (const k of ['darkness', 'himeko', 'kazuma', 'march']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0);
  g.state.party = ['darkness', 'himeko', 'kazuma', 'march'];
  g.state.flags.seen_elation = true;
  const b = fight(g, { enemies: ['reaver:30', 'eliminator:30', 'flamespawn:30'] });
  const dk = b.allies.find(u => u.charId === 'darkness'), hm = b.allies.find(u => u.charId === 'himeko'), kz = b.allies.find(u => u.charId === 'kazuma');
  eq(ui.bdNow(dk, 'basic'), null, 'a plain basic attack is not marked');
  dk.flags.ecstasy = H.TUNING.ecstasyMax;
  const now = ui.bdNow(dk, 'basic');
  ok(now && now.kind === 'enhanced' && now.ab.name === dk.kit.enhanced.name, 'full Ecstasy shows the enhanced attack');
  const items = ui.bdSkillItems({ u: dk });
  ui.bt.bd = ui.bt.bd || { tab: { foe: 0, ally: 0 }, pick: { foe: null, ally: null }, ext: false, ab: 0 };
  ui.bt.bd.ab = 0;
  ok(ui.bdSkillRows({ u: dk }, items).length > 4, 'the attack card has rows');
  const tal = items.findIndex(it => it.type === 'talent'), tech = items.findIndex(it => it.type === 'tech'), con = items.findIndex(it => it.type === 'contact');
  ok(tal > 0 && tech > tal && con > tech, 'talent, technique and Contact follow the three abilities');
  dk.flags.ecstasy = 0;
  ok(ui.bdNow(kz, 'skill') && ui.bdNow(kz, 'skill').ab.name === kz.kit.skills[kz.flags.skillSel | 0].name, 'a hero with skill modes shows the current mode');
  const hs = ui.bdSkillItems({ u: hm }).find(it => it.type === 'ab' && it.r.id === 'skill').r;
  if (hs.ab.target === 'blast') ok(ui.bdTough(hs.shown, 'skill').includes('/'), 'a blast skill shows toughness for the target and its neighbours');
  ok(/^Урон стойкости \d+/.test(ui.bdTough(hs.shown, 'skill')) || !(hs.shown.fx || []).some(f => f.k === 'dmg'), 'a damaging skill names its toughness damage');
  press(null, 'KeyC'); press(null, 'Tab'); press(null, 'KeyE');
  for (let i = 0; i < 4; i++) { for (let j = 0; j < 8; j++) { pump(1); press('down'); } press('right'); }
  press('back');
}

{
  const tags = new Set(['Одиночная атака', 'Взрывная атака', 'Групповая атака', 'Отскок', 'Поддержка', 'Усиление', 'Ослабление', 'Восстановление', 'Защита', 'Призыв']);
  let all = 0, hits = 0;
  for (const [id, d] of Object.entries(H.ENEMIES)) for (const sk of d.skills || []) {
    const r = H.BD.foeSkill(sk, d);
    all++;
    if (!r.text || /undefined|NaN|Особое действие/.test(r.text) || !tags.has(r.tag)) { ok(false, 'enemy skill ' + id + ' / ' + sk.n + ' reads: [' + r.tag + '] ' + r.text); continue; }
    if (sk.m && sk.e && ['single', 'blast', 'all'].includes(sk.t)) {
      hits++;
      const word = sk.m < 1 ? 'небольшой ' : sk.m >= 2 ? 'огромный ' : '';
      if (!r.text.startsWith('Наносит ' + word + H.ELEMENTS[sk.e].name.toLowerCase() + ' урон')) ok(false, 'the power word of ' + id + ' / ' + sk.n + ' follows the table: ' + r.text);
    }
  }
  ok(all >= 260 && hits >= 190, 'every enemy skill has a sentence with an official tag (' + all + ' skills, ' + hits + ' hits)');
  const rv = H.BD.foeSkill(H.ENEMIES.reaver.skills[0], H.ENEMIES.reaver);
  eq(rv.tag, 'Одиночная атака', 'a single hit is a single target attack');
  const dw = H.ENEMIES.direwolf, lock = dw.skills.find(sk => sk.t === 'lock'), rl = H.BD.foeSkill(lock, dw);
  ok(rl.text.includes('Следующим ходом: ' + dw.skills[lock.next].n) && rl.warn === lock.text, 'a lock-on names the next hit and keeps its battle line');
  const rally = Object.values(H.ENEMIES).flatMap(d => (d.skills || []).map(sk => [sk, d])).find(([sk]) => sk.t === 'rally');
  ok(rally && H.BD.foeSkill(rally[0], rally[1]).tag === 'Поддержка', 'an order to attack is support');
  const g = mkGame(71);
  for (const k of ['natasha', 'himeko']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0);
  const b = fight(g, { enemies: ['direwolf:30', 'reaver:30'] });
  const hm = H.CHARS.himeko, nt = H.CHARS.natasha;
  eq(H.BD.allyTag(hm.skill), hm.skill.target === 'blast' ? 'Взрывная атака' : H.BD.TAG[hm.skill.target], 'a hero skill gets the official tag of its target');
  eq(H.BD.allyTag(nt.skill), 'Восстановление', 'a healing skill restores');
  const e = b.enemies.find(u => u.id === 'direwolf');
  e.charging = dw.skills.indexOf(dw.skills.find(sk => sk.t === 'single'));
  ui.bt.target = e;
  press(null, 'KeyC'); press(null, 'KeyE');
  eq(top().tab(), 1, 'the enemy abilities tab is open');
  ok(ui.bdFoeSkillRows(H.BD.model(b, e, g)).length === dw.skills.length, 'one row per enemy skill');
  pump(2);
  press('back');
  e.charging = null;
}

{
  const g = mkGame(81), pathOf = k => H.CHARS[g.kitOf(k)].path, ids = Object.keys(H.CONES);
  const same = ids.find(id => H.CONES[id].path === pathOf('seele') && H.CONES[id].desc), other = ids.find(id => id !== same && H.CONES[id].path !== pathOf('bronya'));
  g.addCone(same); g.addCone(other);
  const c1 = g.state.inv.cones.filter(x => x.id === same).pop(), c2 = g.state.inv.cones.filter(x => x.id === other).pop();
  g.equipCone('seele', c1.uid); g.equipCone('bronya', c2.uid);
  g.state.roster.natasha.cone = null;
  const b = fight(g, { enemies: ['reaver:30', 'eliminator:30'] });
  const se = b.allies.find(u => u.key === 'seele'), br = b.allies.find(u => u.key === 'bronya'), na = b.allies.find(u => u.key === 'natasha');
  const a = H.BD.coneOf(g, b, se);
  ok(a && a.id === same && a.match, 'a cone on the same Path is shown as working');
  eq(JSON.stringify(a.stats), JSON.stringify(g.coneStatsOf(c1)), 'cone stats are the same as in the cone screen');
  eq(JSON.stringify(a.lvl), JSON.stringify(g.coneLvlOf(c1, g.state.roster.seele)), 'cone level is the same as in the cone screen');
  eq(a.sup, c1.sup || 1, 'superimposition comes from the cone');
  ok(!H.BD.coneOf(g, b, br).match, 'a cone of another Path gives only stats');
  eq(H.BD.coneOf(g, b, na), null, 'a hero without a cone has none');
  const rows = ui.bdConeRows(H.BD.model(b, se, g)), lines = ui.coneLines(same, a.sup, 348, 11).length, lore = H.CONES[same].desc.split('\n').flatMap(t => ui.wrap(t, 348, 10)).length;
  eq(rows.length, 3 + lines + 1 + lore, 'the cone tab shows the card, the passive text and the quote');
  b.cw = {};
  eq(H.BD.coneOf(g, b, se), null, 'Currency Wars figures have no cones');
  delete b.cw;
  eq(H.BD.coneOf(g, b, Object.assign({}, se, { key: 'trial:seele', trial: true })), null, 'a trial hero has no cone');
  ui.bt.target = b.enemies[0];
  press(null, 'KeyC'); press(null, 'Tab'); press(null, 'KeyQ');
  eq(top().tab(), 2, 'Q from the first tab goes to the cone tab');
  for (let i = 0; i < 4; i++) { pump(1); press('right'); }
  press('back');
}

{
  const pending = new Set();
  const missing = Object.keys(H.ENEMIES).filter(id => !H.foeLore(id));
  eq(missing.filter(id => !pending.has(id)).join(', '), '', 'every enemy has its story');
  ok(['ks_proto', 'mimic', 'dunn', 'timekiller'].every(id => H.foeLore(id)), 'own stories are in for KonoSuba, Section 6, Currency Wars and Dunn');
  eq([...pending].filter(id => H.foeLore(id)).join(', '), '', 'the list of stories still to write is up to date');
  const texts = Object.values(H.FOE_LORE);
  ok(texts.length >= 75 && texts.every(t => t && !t.includes('—') && !/[{}[\]|=]|https?:/.test(t)), 'stories have no long dashes and no wiki markup');
  ok(H.foeLore('antibaryon').startsWith('Чтобы предотвратить столкновение и аннигиляцию античастиц, Легион Антиматерии создал два типа миниатюрных ионных ловушек'), 'the Antibaryon story is the official text');
  eq(H.foeLore('phantylia_x'), H.foeLore('phantylia'), 'a variant reads the story of its original');
  ok(Object.values(H.FOE_LORE_ALIAS).every(id => H.FOE_LORE[id]), 'every alias points to a written story');
  const g = mkGame(91), b = fight(g, { enemies: ['antibaryon:30', 'reaver:30'] });
  const e = b.enemies.find(u => u.id === 'antibaryon');
  ui.bt.target = e;
  press(null, 'KeyC'); press(null, 'KeyQ');
  eq(top().tab(), 2, 'Q from the first tab goes to the story');
  const rows = ui.bdLoreRows(H.BD.model(b, e, g));
  ok(rows.length > 4, 'the story tab has the name, the text and the record line');
  pump(2);
  press('back');
}

{
  const g = mkGame(101);
  for (const k of ['jingyuan']) if (!g.state.roster[k]) g.debugChar(k, 70, 0, 0);
  g.state.party = ['jingyuan', 'seele', 'bronya', 'natasha'];
  const b = fight(g, { enemies: ['reaver:30', 'eliminator:30'] });
  const lord = b.summons.find(u => u.id === 'lord');
  ok(lord, 'Jing Yuan brings the Lightning-Lord');
  ok(ui.bdUnits('ally').includes(lord) && ui.bdUnits('ally').indexOf(lord) === b.allies.length, 'summons follow the heroes on the ally side');
  ui.render();
  const order = ui.turnOrder(7), at = order.findIndex((o, i) => i > 0 && o.u === lord), cell = at > 0 ? ui.turnCell(at) : null;
  if (cell) {
    const h = hitAt(cell.x + cell.size / 2, cell.y + cell.size / 2);
    ok(h, 'turn order icons can be clicked');
    h.fn();
    ok(isDetails() && top().unit === lord && top().side === 'ally', 'a click on a turn order icon opens the details on that unit');
  } else {
    ok(ui.openBattleDetails(lord), 'the Lightning-Lord can be opened directly');
  }
  eq(top().tabs().length, 1, 'a summon has only the first tab');
  press(null, 'KeyE');
  eq(top().tab(), 0, 'tabs do not move on a summon');
  const m = H.BD.model(b, lord, g);
  ok(m.summon && m.owner === b.allies.find(u => u.charId === 'jingyuan').name, 'the summon names its owner');
  ok(ui.bdInfoRows(m, top()).length >= 3, 'the summon card has its rows');
  pump(2);
  press('back');
  ui.render();
  const first = ui.turnOrder(7)[1], c1 = ui.turnCell(1);
  const h1 = hitAt(c1.x + 4, c1.y + 4);
  ok(h1, 'the second turn order icon can be clicked');
  h1.fn();
  ok(isDetails() && top().unit === first.u, 'the click opens that unit');
  press('back');
  ui.battleKey('ok', 'Enter');
  ok(!ui.bdIdle(), 'the fight is busy');
  ui.bdAsk(b.enemies[1]);
  ok(ui.bt.bdWant && ui.bt.bdWant.u === b.enemies[1], 'a click while busy remembers the unit');
  ui.bdAsk(b.enemies[0]);
  ok(ui.bt.bdWant && ui.bt.bdWant.u === b.enemies[0], 'a click on another unit changes the request');
  ui.bdAsk(b.enemies[0]);
  ok(!ui.bt.bdWant, 'a second click on the same unit drops the request');
}

{
  ui.game = mkGame(102); ui.mode = 'field'; ui.screens = [];
  ui.openGuide();
  pump(1);
  ok(ui.top() && ui.top().controls, 'the controls screen opens');
  ui.pop();
  const src = fs.readFileSync(path.join(DIR, 'hsr-ui-menu.js'), 'utf8');
  ok(src.includes("['C', 'детали боя']"), 'the controls list the C key for battle details');
}

console.log('hsr-details: ' + checks + ' checks passed');
