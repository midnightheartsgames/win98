const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; },
  clear() { this.store = {}; }
};

let lastVfsWrite = null;
let lastNotepadOpen = null;

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

global.window = {
  isOnline: true,
  localStorage: global.localStorage,
  addEventListener: () => {},
  webGif: name => `<span class="gif-${name}"></span>`,
  getIcon: name => `<svg data-icon="${name}"></svg>`,
  soundSys: { playClick: () => {}, playDing: () => {}, playError: () => {} },
  winManager: { windows: new Map(), openDialog: () => {}, createWindow: () => ({}) },
  vfs: {
    mkdir: () => {},
    writeFile: (folder, name, text) => { lastVfsWrite = { folder, name, text }; return true; }
  },
  appNotepad: { open: (name, text) => { lastNotepadOpen = { name, text }; } },
  appClippy: {
    isRunning: () => true,
    opt: () => 'balloon',
    visible: true,
    annoyance: 'normal',
    balloonOpen: () => false,
    speak: () => {},
    setBulb: () => {},
    sound: () => {},
    openInIE: () => {}
  }
};

eval(read('js/game-manager.js'));
eval(read('js/apps/retro-sites.js'));
eval(read('js/apps/clippy-tips.js'));
eval(read('js/apps/clippy-help.js'));
eval(read('js/apps/ashroad-data.js'));
eval(read('js/apps/ashroad-game.js'));
eval(read('js/apps/ashroad-site.js'));
eval(read('js/apps/ie.js'));

const ie = window.appIE;
const site = window.ashroadSite;
const G = window.ashroadGame;
const D = window.ashroadData;
const base = 'http://www.ashroad98.ru';
const routes = ['gate', 'square', 'road', 'fight', 'arena', 'smith', 'hero', 'chronicle'];
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log('  ok -', name);
};

const fresh = (opts) => {
  localStorage.clear();
  return G.resetState(Object.assign({ registered: true, seed: 4242 }, opts || {}));
};

const forceMove = (st, move) => {
  st.combat.intent = { move, tired: false, adaptNote: '', dark: false, chance: 100, read: true, pair: ['head', 'torso'], hidden: false, seenStance: move.stance };
};

test('routes resolve to all 8 views, aliases and a missing page', () => {
  localStorage.clear();
  assert.strictEqual(site.parseRoute(base), 'gate');
  fresh();
  assert.strictEqual(site.parseRoute(base), 'square');
  for (const r of routes) assert.strictEqual(site.parseRoute(`${base}/${r}`), r);
  assert.strictEqual(site.parseRoute(`${base}/duel`), 'arena');
  assert.strictEqual(site.parseRoute(`${base}/combat`), 'fight');
  assert.strictEqual(site.parseRoute(`${base}/map`), 'road');
  assert.strictEqual(site.parseRoute(`${base}/market`), 'smith');
  assert.strictEqual(site.parseRoute(`${base}/lore`), 'chronicle');
  assert.strictEqual(site.parseRoute(`${base}/square?x=1#top`), 'square');
  assert.strictEqual(site.parseRoute(`${base}/nowhere`), 'missing');
  assert.ok(site.renderSite(`${base}/nowhere`).includes('Такой версты на тракте нет'));
});

test('IE routes ashroad98.ru, indexes it in search and WebRing, and Clippy knows it', () => {
  for (const u of [base, `${base}/gate`, `${base}/arena`, 'http://www.pepel98.ru', 'http://www.mmo98.ru']) {
    assert.strictEqual(ie.identifyPageKey(u), 'ashroad', u);
  }
  for (const u of ['http://www.kovcheg98.ru', 'http://www.blizzard.com', 'http://www.search98.com']) {
    assert.notStrictEqual(ie.identifyPageKey(u), 'ashroad', u);
  }
  assert.strictEqual(ie.getPageTitle('ashroad'), "Пепельный Тракт '98 - Многопользовательская игра в браузере");
  const gamesCat = ie.searchDirectory.find(c => c.title === 'Компьютерные игры');
  assert.ok(gamesCat && gamesCat.sites.some(([u]) => u === base));
  for (const q of ['пепельный тракт', 'ashroad', 'ммо', 'старый брод', 'звонарь', 'громов']) {
    assert.ok(ie.performSearch(q).some(r => r.url === base), 'search query ' + q);
  }
  assert.ok(window.retroSites.getWebRingSites().some(s => s.url === base));
  assert.ok(window.clippyTips.catalog['ashroad-mmo']);
  const help = window.clippyHelp.byId('ashroad-site');
  assert.ok(help && help.go === `url:${base}`);
  assert.ok(/факел|темнот/i.test(help.a) && /Глазомер/.test(help.a), 'Clippy help describes torch sight and Focus');
});

test('every page has its own structure', () => {
  fresh({ handle: 'Ратибор_98' });
  const html = r => site.renderSite(`${base}/${r}`);
  assert.ok(html('gate').includes('ar-iron-pass') && html('gate').includes('ar-ledger') && html('gate').includes('name="ar_origin"'));
  assert.ok(html('square').includes('ar-town-svg') && html('square').includes('ar-board') && html('square').includes('ar-chat-log'));
  assert.ok(html('road').includes('ar-map-svg') && html('road').includes('ar-verst') && html('road').includes('ar-journal'));
  assert.ok(html('fight').includes('Сейчас вы ни с кем не бьётесь'));
  assert.ok(html('arena').includes('ar-listing') && html('arena').includes('data-ar-act="challenge"'));
  assert.ok(html('smith').includes('ar-anvil') && html('smith').includes('ar-chalk') && html('smith').includes('ar-ads'));
  assert.ok(html('hero').includes('ar-dossier') && html('hero').includes('ar-bag-cell'));
  assert.ok(html('chronicle').includes('ar-paper-mast') && html('chronicle').includes('ar-ladder'));
  const st = G.loadState();
  G.startArenaCombat(st, 'r_vovan');
  const fight = html('fight');
  assert.ok(fight.includes('ar-duel') && fight.includes('data-ar-zone="head"') && fight.includes('ar-watch') && fight.includes('name="ar_stance"'));
  assert.ok(html('square').includes('ar-sign-alarm') && html('square').includes('Идёт бой'), 'other pages point back to the running fight');
});

test('origins and orders change numbers exactly as their texts say', () => {
  const miner = G.heroStats(fresh({ originId: 'miner', orderId: 'guild' }));
  const scribe = G.heroStats(fresh({ originId: 'scribe', orderId: 'bell' }));
  const dragoon = G.heroStats(fresh({ originId: 'dragoon', orderId: 'guard' }));
  assert.ok(miner.maxHp > scribe.maxHp);
  assert.ok(scribe.read - dragoon.read >= 15 + (15 - 10) * 6 - 1, 'scribe reads better through Focus and the passive');
  assert.strictEqual(scribe.maxTorch, dragoon.maxTorch + 2, 'bell order +2 torch');
  assert.strictEqual(G.moveCost('thrust', false, 'open', 'dragoon', true), 7, 'dragoon thrust costs 3 less');
  assert.strictEqual(G.moveCost('cleave', false, 'narrow', 'miner', true), 25, 'miner cleave not dearer in narrow');
  assert.strictEqual(G.moveCost('cleave', true, 'narrow', 'dragoon', true), 39, 'narrow +4 and leg wound +10');
  assert.ok(D.ORDERS.guard.bonusDesc.includes('15%') && D.ORDERS.bell.bonusDesc.includes('Жетон') && D.ORDERS.guild.bonusDesc.includes('переплавке'));
  const st = fresh({ orderId: 'guard' });
  const w = st.inventory.find(i => i.uid === st.equipped.weapon);
  w.durability -= 10;
  assert.strictEqual(G.repairCost(st, w), 9, 'guard repairs 15% cheaper');
});

test('observation gives partial information: read, pair, disguised feint, dark and hidden rivals', () => {
  const st = fresh({ originId: 'dragoon' });
  G.startRoadCombat(st, 'runaway_miner', 'quarry_approach');
  const feint = { stance: 'feint', strike: 'head', guard: 'torso', tell: 'Рудокоп заносит кайло из-за спины.', fakeAs: 'cleave' };
  st.combat.intent = { move: feint, read: false, dark: false, hidden: false, chance: 30, pair: ['head', 'legs'], seenStance: 'cleave', adaptNote: '' };
  let info = G.describeIntent(st.combat);
  assert.strictEqual(info.stance, 'Размах', 'unread feint looks like the stance it imitates');
  assert.ok(info.zones.includes('голову') && info.zones.includes('ноги') && !info.guard);
  st.combat.intent.read = true;
  st.combat.intent.seenStance = 'feint';
  info = G.describeIntent(st.combat);
  assert.strictEqual(info.stance, 'Финт');
  assert.ok(info.note.includes('ложный') && info.guard.includes('корпус'));
  st.hero.torch = 0;
  G.prepareIntent(st);
  info = G.describeIntent(st.combat);
  assert.ok(info.dark && !info.stance && !info.zones, 'no torch, no tell');
  const torch = st.inventory.find(i => i.itemId === 'pitch_torch') || (st.inventory.push({ uid: 'tt', itemId: 'pitch_torch', temper: 0, durability: 1, maxDurability: 1 }), st.inventory[st.inventory.length - 1]);
  G.useItem(st, torch.uid);
  assert.ok(!st.combat.intent.dark && st.hero.torch > 0, 'lighting a torch mid-fight reveals the tell');
  st.combat.foeStunned = true;
  G.prepareIntent(st);
  assert.ok(st.combat.intent.read && st.combat.intent.chance === 100, 'a stunned foe is read for sure');
  const ar = fresh();
  G.startArenaCombat(ar, 'r_alisa');
  let hiddenSeen = false;
  for (let i = 0; i < 30; i++) {
    G.prepareIntent(ar);
    if (!ar.combat.intent.read) {
      hiddenSeen = true;
      const hInfo = G.describeIntent(ar.combat);
      assert.ok(!hInfo.stance && hInfo.tell.includes('не выдаёт'), 'rivals hide their stance until read');
    }
  }
  assert.ok(hiddenSeen);
});

test('stance triangle and zone wounds', () => {
  const st = fresh({ originId: 'dragoon' });
  G.startRoadCombat(st, 'flail_looter', 'peat_fork');
  forceMove(st, { stance: 'cleave', strike: 'head', guard: 'torso', tell: 't' });
  G.executeRound(st, 'legs', 'thrust', 'torso');
  assert.ok(st.combat.log[0].includes('опережает'), 'thrust interrupts cleave');
  forceMove(st, { stance: 'thrust', strike: 'torso', guard: 'legs', tell: 't' });
  st.hero.stam = 100;
  G.executeRound(st, 'legs', 'cleave', 'torso');
  assert.ok(st.combat.log[0].includes('проламывает защиту'), 'cleave crushes a guard');
  forceMove(st, { stance: 'thrust', strike: 'legs', guard: 'head', tell: 't' });
  const stamBefore = st.hero.stam;
  G.executeRound(st, 'head', 'feint', 'legs');
  assert.ok(st.combat.log[0].includes('Финт обходит'), 'feint bypasses the guarded zone');
  assert.ok(st.hero.stam > stamBefore - 15, 'feint steals breath back');
  forceMove(st, { stance: 'breather', strike: 'legs', guard: 'head', tell: 't' });
  G.executeRound(st, 'torso', 'thrust', 'legs');
  assert.ok(st.combat.log[0].includes('вязнет'), 'breather smothers a thrust into torso');
  forceMove(st, { stance: 'breather', strike: 'legs', guard: 'torso', tell: 't' });
  st.hero.stam = 3;
  G.executeRound(st, 'head', 'cleave', 'legs');
  assert.ok(st.combat.log[0].includes('Дыхания не хватило'), 'no breath forces a breather');
});

test('foes get tired and must rest when out of breath', () => {
  const st = fresh();
  G.startRoadCombat(st, 'old_bellringer', 'belfry_crown');
  st.combat.foeStam = 0;
  G.prepareIntent(st);
  assert.strictEqual(st.combat.intent.move.stance, 'breather');
  assert.ok(st.combat.intent.tired && st.combat.intent.move.tell.includes('колокол'));
});

test('rivals who read remember repeated zones', () => {
  const st = fresh();
  G.startArenaCombat(st, 'r_kpbic');
  st.combat.history = [{ strike: 'legs', stance: 'thrust' }, { strike: 'legs', stance: 'thrust' }];
  for (let i = 0; i < 10; i++) {
    G.prepareIntent(st);
    assert.strictEqual(st.combat.intent.move.guard, 'legs');
  }
  const vovan = fresh();
  G.startArenaCombat(vovan, 'r_vovan');
  vovan.combat.history = [{ strike: 'legs', stance: 'thrust' }, { strike: 'legs', stance: 'thrust' }];
  const guards = new Set();
  for (let i = 0; i < 20; i++) { G.prepareIntent(vovan); guards.add(vovan.combat.intent.move.guard); }
  assert.ok(guards.size > 1, 'a newbie does not adapt');
});

test('the road: blocked paths, retreat, cleared sectors, respawn and campfires', () => {
  const st = fresh({ orderId: 'bell' });
  assert.ok(!G.isReachable(st, 'stone_cross'));
  G.moveTo(st, 'reed_causeway');
  assert.ok(st.road.onExpedition && st.road.expeditions === 1);
  assert.ok(G.isBlocked(st));
  assert.deepStrictEqual(G.reachableIds(st), ['ford_gate'], 'only retreat while the sector is held');
  assert.strictEqual(G.moveTo(st, 'peat_fork'), false);
  assert.strictEqual(G.patrol(st), 'combat');
  st.combat.foeHp = 1;
  G.executeRound(st, 'head', 'thrust', 'torso');
  assert.strictEqual(st.combat.winner, 'player');
  G.closeCombat(st);
  assert.ok(G.isReachable(st, 'peat_fork'));
  assert.strictEqual(G.patrol(st), 'quiet', 'cleared sectors stay quiet for the expedition');
  assert.strictEqual(st.road.heat, 1);
  assert.ok(st.road.lootBag.groshi > 0);
  st.road.clearedNodes.peat_fork = true;
  st.road.clearedNodes.willow_backwater = true;
  G.moveTo(st, 'peat_fork');
  G.moveTo(st, 'stone_cross');
  st.hero.hp = 10;
  assert.strictEqual(G.camp(st), true);
  assert.strictEqual(st.hero.hp, G.heroStats(st).maxHp);
  st.hero.hp = 10;
  assert.strictEqual(G.camp(st), false, 'a campfire warms once per expedition');
  assert.strictEqual(st.hero.hp, 10);
  st.road.lootBag.groshi = 100;
  st.road.lootBag.iron = 4;
  const before = st.hero.groshi;
  G.sendCourier(st);
  assert.strictEqual(st.hero.groshi, before + 85, 'courier keeps 15%');
  assert.strictEqual(st.road.heat, 0, 'banking cools the road');
  G.escortHome(st);
  assert.strictEqual(st.road.currentNodeId, 'ford_gate');
  assert.deepStrictEqual(st.road.clearedNodes, {}, 'foes return for the next expedition');
  assert.ok(!st.road.onExpedition);
  G.moveTo(st, 'reed_causeway');
  assert.strictEqual(G.escortHome(st), false, 'no escort away from campfires');
});

test('the road: heat multiplies loot, darkness hurts, death halves the bag', () => {
  const st = fresh({ orderId: 'bell' });
  G.moveTo(st, 'reed_causeway');
  st.road.heat = 4;
  G.startRoadCombat(st, 'bog_hound', 'reed_causeway');
  st.combat.foeHp = 1;
  G.executeRound(st, 'head', 'thrust', 'torso');
  assert.strictEqual(st.road.lootBag.groshi, Math.round(D.ENEMIES.bog_hound.groshi * 1.6));
  G.closeCombat(st);
  st.hero.torch = 0;
  const hp = st.hero.hp;
  G.moveTo(st, 'peat_fork');
  assert.strictEqual(st.hero.hp, hp - 6, 'walking blind costs health');
  st.road.lootBag.groshi = 41;
  st.road.lootBag.iron = 3;
  G.startRoadCombat(st, 'flail_looter', 'peat_fork');
  assert.ok(st.combat.intent.dark);
  st.hero.hp = 1;
  forceMove(st, { stance: 'thrust', strike: 'head', guard: 'legs', tell: 't' });
  const gBefore = st.hero.groshi;
  G.executeRound(st, 'legs', 'thrust', 'legs');
  assert.strictEqual(st.combat.winner, 'foe');
  assert.strictEqual(st.road.currentNodeId, 'ford_gate');
  assert.strictEqual(st.hero.groshi, gBefore + 20, 'half of the bag (rounded down) reaches the treasury');
  assert.strictEqual(st.road.heat, 0);
});

test('shortcuts need a cleared guardian and then cost one torch', () => {
  const st = fresh();
  st.road.currentNodeId = 'sunken_ferry';
  st.road.visitedNodes.sunken_ferry = true;
  st.road.trail = ['ford_gate', 'reed_causeway', 'peat_fork', 'sunken_ferry'];
  assert.strictEqual(G.unlockShortcut(st), 'combat');
  st.combat = null;
  st.road.clearedNodes.sunken_ferry = true;
  assert.strictEqual(G.unlockShortcut(st), true);
  assert.ok(st.road.shortcuts.ferry_plank);
  assert.strictEqual(st.contracts.c_unlock_ferry.progress, 1);
  G.moveTo(st, 'stone_cross');
  G.escortHome(st);
  const torch = st.hero.torch;
  assert.ok(G.isReachable(st, 'stone_cross'));
  G.moveTo(st, 'stone_cross');
  assert.strictEqual(st.hero.torch, torch - 1);
});

test('the Ring: stakes, rating by expectation, tokens only for worthy wins', () => {
  const st = fresh({ orderId: 'guard' });
  st.hero.groshi = 10;
  assert.strictEqual(G.startArenaCombat(st, 'r_vovan'), false, 'no stake, no bout');
  st.hero.groshi = 200;
  st.hero.rating = 1400;
  const tokens = st.hero.tokens;
  G.startArenaCombat(st, 'r_vovan');
  assert.strictEqual(st.hero.groshi, 180, 'stake goes to the judge');
  st.combat.foeHp = 1;
  G.executeRound(st, 'head', 'thrust', 'torso');
  assert.strictEqual(st.hero.groshi, 220, 'winner takes both stakes');
  assert.ok(st.hero.rating - 1400 <= 6, 'beating a weak rival gives little rating');
  assert.strictEqual(st.hero.tokens, tokens, 'no token for a weak rival');
  G.closeCombat(st);
  st.hero.rating = 1000;
  G.startArenaCombat(st, 'r_sedoy');
  st.combat.foeHp = 1;
  G.executeRound(st, 'head', 'thrust', 'torso');
  assert.ok(st.hero.rating - 1000 >= 25, 'an upset pays well');
  assert.strictEqual(st.hero.tokens, tokens + 1);
  assert.strictEqual(st.contracts.c_upset.progress, 1);
  assert.ok(st.rivals.r_sedoy.rating < 1260 && st.rivals.r_sedoy.losses === 6, 'rival record changes too');
  const ladder = G.ladder(st);
  assert.strictEqual(ladder.find(r => r.handle === 'Седой_Сотник').rating, st.rivals.r_sedoy.rating, 'ladder shows live ratings');
  assert.ok(ladder.every((r, i) => i === 0 || ladder[i - 1].rating >= r.rating), 'ladder is sorted');
  G.closeCombat(st);
  G.startArenaCombat(st, 'r_alisa');
  st.hero.hp = 1;
  forceMove(st, { stance: 'thrust', strike: 'head', guard: 'legs', tell: 't' });
  const g = st.hero.groshi;
  G.executeRound(st, 'legs', 'thrust', 'legs');
  assert.strictEqual(st.combat.winner, 'foe');
  assert.strictEqual(st.hero.groshi, g, 'the lost stake was already paid');
  assert.strictEqual(st.hero.hp, G.heroStats(st).maxHp, 'Ring medics heal');
});

test('forge, shop and a commission row that sells while you are away', () => {
  const st = fresh({ orderId: 'guild' });
  st.hero.groshi = 1000;
  st.hero.iron = 20;
  st.hero.tokens = 10;
  const w = st.inventory.find(i => i.uid === st.equipped.weapon);
  const c0 = G.temperCost(w);
  G.temper(st, w.uid);
  const c1 = G.temperCost(w);
  assert.ok(w.temper === 1 && c1.groshi > c0.groshi && c1.iron === 2, 'each temper costs more');
  G.buyShop(st, 'broad_saber');
  const saber = st.inventory.find(i => i.itemId === 'broad_saber');
  const ironBefore = st.hero.iron;
  G.buyShop(st, 'shaft_cleaver');
  const cleaver = st.inventory.find(i => i.itemId === 'shaft_cleaver');
  G.smelt(st, cleaver.uid);
  assert.strictEqual(st.hero.iron, ironBefore - 3 + 2 + 1, 'guild smelts +1 iron');
  const gBefore = st.hero.groshi;
  G.listLot(st, saber.uid);
  assert.strictEqual(st.hero.groshi, gBefore, 'listing pays nothing upfront');
  const lot = st.commissionLots.find(l => l.mine);
  G.withdrawLot(st, lot.lotId);
  assert.ok(st.inventory.some(i => i.itemId === 'broad_saber'));
  G.listLot(st, st.inventory.find(i => i.itemId === 'broad_saber').uid);
  const price = st.commissionLots.find(l => l.mine).priceGroshi;
  const others = st.commissionLots.filter(l => !l.mine);
  G.buyLot(st, others[0].lotId);
  G.buyLot(st, others[1].lotId);
  G.moveTo(st, 'reed_causeway');
  const g2 = st.hero.groshi;
  G.moveTo(st, 'ford_gate');
  assert.strictEqual(st.hero.groshi, g2 + price, 'lot sold while away');
  assert.ok(!st.commissionLots.some(l => l.mine));
  assert.ok(st.commissionLots.filter(l => !l.mine).length >= 4, 'the row restocks');
  assert.ok(st.events.some(e => e.text.includes('продано')));
});

test('contracts: bank haul tracks the biggest single delivery', () => {
  const st = fresh();
  st.road.onExpedition = true;
  st.road.currentNodeId = 'stone_cross';
  st.road.lootBag.groshi = 120;
  G.sendCourier(st);
  assert.strictEqual(st.contracts.c_long_haul.progress, 102);
  st.road.lootBag.groshi = 60;
  G.sendCourier(st);
  assert.strictEqual(st.contracts.c_long_haul.progress, 102, 'small deliveries do not add up');
  st.road.lootBag.groshi = 160;
  G.escortHome(st);
  assert.strictEqual(st.contracts.c_long_haul.progress, 150);
  const g = st.hero.groshi;
  assert.strictEqual(G.claimContract(st, 'c_long_haul'), true);
  assert.strictEqual(st.hero.groshi, g + 90);
  assert.strictEqual(G.claimContract(st, 'c_long_haul'), false);
});

test('registration keeps progress, charges a token for a new order, and a v1 save migrates', () => {
  localStorage.clear();
  let st = G.loadState();
  assert.strictEqual(st.registered, false);
  st = G.register(st, { handle: 'Новичок', originId: 'miner', orderId: 'guild' });
  assert.ok(st.registered && st.hero.originId === 'miner' && st.inventory.some(i => i.itemId === 'miner_pick'));
  st.hero.xp = 30;
  const tokens = st.hero.tokens;
  st = G.register(st, { handle: 'Новичок_2', originId: 'scribe', orderId: 'bell' });
  assert.strictEqual(st.hero.originId, 'miner', 'origin is fixed once you have played');
  assert.strictEqual(st.hero.orderId, 'bell');
  assert.strictEqual(st.hero.tokens, tokens - 1);
  localStorage.clear();
  localStorage.setItem(G.LEGACY_KEY, JSON.stringify({
    version: 1, registered: true, uidCounter: 30,
    hero: { handle: 'Старожил', originId: 'scribe', orderId: 'bell', level: 3, xp: 10, xpNext: 210, statPoints: 0, vigor: 11, grit: 12, focus: 16, groshi: 300, iron: 5, tokens: 4, rating: 1100, arenaWins: 3, arenaLosses: 1, roadClears: 9, bossDefeated: false },
    equipped: { weapon: 'itm_1' }, inventory: [{ uid: 'itm_1', itemId: 'ash_rapier', temper: 2, durability: 20, maxDurability: 36 }],
    road: { currentNodeId: 'stone_cross', visitedNodes: { ford_gate: true, stone_cross: true }, clearedNodes: {}, shortcuts: { ferry_plank: true, mine_cage: false }, lootBag: { groshi: 40, iron: 1 }, journal: [] },
    contracts: { c_clear_causeway: { progress: 2, claimed: true } }
  }));
  st = G.loadState();
  assert.strictEqual(st.version, 2);
  assert.strictEqual(st.hero.handle, 'Старожил');
  assert.strictEqual(st.hero.level, 3);
  assert.strictEqual(st.hero.groshi, 340, 'old loot bag is banked');
  assert.ok(st.road.shortcuts.ferry_plank && st.contracts.c_clear_causeway.claimed);
  assert.strictEqual(st.inventory[0].temper, 2);
  assert.strictEqual(localStorage.getItem(G.LEGACY_KEY), null);
});

test('balance: reading the foe beats a mindless routine', () => {
  const Z = ['head', 'torso', 'legs'];
  const reader = st => {
    const it = st.combat.intent;
    const seen = it.dark || it.hidden ? null : it.seenStance;
    const strike = it.read ? Z.find(z => z !== it.move.guard) : 'head';
    const guard = it.read ? it.move.strike : it.pair[0];
    let stance = seen === 'breather' ? 'cleave' : 'thrust';
    if (it.read && seen === 'thrust') stance = 'feint';
    const target = stance === 'feint' ? it.move.guard : strike;
    if (st.hero.stam < 30) stance = 'breather';
    return [target, stance, guard];
  };
  const mindless = () => ['torso', 'thrust', 'torso'];
  const run = (policy, foe, node) => {
    let wins = 0;
    for (let i = 0; i < 60; i++) {
      const st = G.createState({ registered: true, originId: 'dragoon', seed: 900 + i });
      G.startRoadCombat(st, foe, node);
      for (let r = 0; r < 60 && !st.combat.finished; r++) G.executeRound(st, ...policy(st));
      if (st.combat.winner === 'player') wins++;
    }
    return wins / 60;
  };
  const r = run(reader, 'flail_looter', 'peat_fork');
  const m = run(mindless, 'flail_looter', 'peat_fork');
  assert.ok(r >= 0.9, 'reader wins ' + r);
  assert.ok(m <= 0.6, 'mindless wins ' + m);
});

test('site actions, events and the dossier', () => {
  fresh({ handle: 'Воевода_98' });
  const text = site.exportDossier(G.loadState());
  assert.ok(text.includes('Воевода_98') && text.includes('чтение замаха'));
  assert.ok(lastVfsWrite && lastVfsWrite.name === 'Ashroad98_Hero.txt');
  assert.ok(lastNotepadOpen && lastNotepadOpen.name === 'Ashroad98_Hero.txt');
  assert.deepStrictEqual(site.act('move', { node: 'reed_causeway' }), { go: 'road' });
  assert.deepStrictEqual(site.act('patrol', {}), { go: 'fight' });
  assert.deepStrictEqual(site.act('round', { strike: 'head', stance: 'thrust', guard: 'torso' }), { stay: true });
  assert.strictEqual(G.loadState().combat.round, 2);
  assert.deepStrictEqual(site.act('say', { text: 'привет всем' }), { stay: true });
  const log = G.loadState().chatLogs.square;
  assert.ok(log.some(m => m.author === 'Воевода_98' && m.text === 'привет всем'));

  const handlers = [];
  const el = (attrs) => ({
    getAttribute: k => (k in attrs ? attrs[k] : null),
    addEventListener: (ev, fn) => handlers.push({ attrs, ev, fn }),
    setAttribute: () => {}
  });
  const buttons = [el({ 'data-ar-act': 'room', 'data-room': 'tavern' })];
  const rootEl = {
    getAttribute: k => (k === 'data-ar-route' ? 'square' : null),
    querySelector: () => null,
    querySelectorAll: sel => (sel === '[data-ar-act]' ? buttons : [])
  };
  const container = { scrollTop: 40, querySelector: sel => (sel === '.ar-page' ? rootEl : null) };
  const calls = [];
  const fakeIe = { currentUrl: `${base}/square`, navigate: (w, u) => calls.push(['nav', u]), renderPage: (w, u) => calls.push(['render', u]) };
  site.attachEvents({}, container, fakeIe);
  handlers[0].fn({ preventDefault: () => {} });
  assert.strictEqual(G.loadState().chatRoom, 'tavern');
  assert.deepStrictEqual(calls[0], ['render', `${base}/square`], 'same-page actions rerender in place');
  assert.strictEqual(container.scrollTop, 40, 'scroll position is kept');
});

test('Web 1.0 rules, web-safe palette, naming and zero comments', () => {
  fresh();
  const st = G.loadState();
  G.startRoadCombat(st, 'old_bellringer', 'belfry_crown');
  for (const r of routes) {
    const html = site.renderSite(`${base}/${r}`);
    assert.ok(!EMOJI.test(html), 'no emoji on ' + r);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/i.test(html), 'no forbidden names on ' + r);
    assert.ok(!html.includes('—'), 'no em dash on ' + r);
  }
  const css = read('css/apps/ashroad-site.css');
  for (const prop of ['border-radius', 'box-shadow', 'text-shadow', 'rgba(', 'linear-gradient', 'radial-gradient', 'blur(', 'transition', 'opacity', 'animation']) {
    assert.ok(!css.includes(prop), 'forbidden CSS ' + prop);
  }
  const files = ['css/apps/ashroad-site.css', 'js/apps/ashroad-data.js', 'js/apps/ashroad-game.js', 'js/apps/ashroad-site.js', 'tests/ashroad-site.test.js'];
  const safe = h => /^#([0369cf])\1([0369cf])\2([0369cf])\3$/i.test(h);
  const combined = files.slice(0, 4).map(read).join('\n');
  const off = [...new Set(combined.match(/#[0-9a-f]{6}\b/gi) || [])].filter(h => !safe(h));
  assert.deepStrictEqual(off, [], 'only the 216 web-safe colours');
  assert.ok(!/fill-opacity|stroke-opacity/.test(combined));
  for (const f of files) {
    const raw = read(f);
    const stripped = raw.replace(/https?:\/{2}/g, '');
    assert.ok(!/\/\*|\*\/|^\s*\/\/|[^:\\]\/\/\s/m.test(stripped), 'zero comments in ' + f);
    assert.ok(!/\bMicrosoft\b|\bWindows\b/.test(raw), 'no forbidden names in ' + f);
  }
  const index = read('index.html');
  const iData = index.indexOf('js/apps/ashroad-data.js');
  const iGame = index.indexOf('js/apps/ashroad-game.js');
  const iSite = index.indexOf('js/apps/ashroad-site.js');
  assert.ok(index.includes('css/apps/ashroad-site.css') && iData > 0 && iGame > iData && iSite > iGame);
});

console.log(`Passed ${passed} tests in ashroad-site.test.js`);
