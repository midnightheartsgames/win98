const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const WC98 = require('../js/apps/worldcup98-core.js');

console.log('--- Testing World Cup 98 Core Engine, Modes, Igromania CD & UI ---');

assert.equal(Object.keys(WC98.TEAMS).length, 16, '16 national teams in France 98');
for (const [key, team] of Object.entries(WC98.TEAMS)) {
  assert.equal(team.id, key);
  assert.ok(team.name && team.code, `${key} has name and code`);
  assert.equal(team.roster.length, 7, `${key} has 7 squad members (GK + 6 outfield)`);
  assert.equal(team.roster[0].role, 'GK', `${key} first player is GK`);
  assert.ok(team.primary && team.secondary && team.shorts, `${key} has kit colors`);
}

assert.equal(Object.keys(WC98.FORMATIONS).length, 4, '4 formations available');
assert.ok(WC98.getTacticalBonus('4-3-3', '5-3-2', 'balanced').formationEdge > 1, '4-3-3 counters 5-3-2');
assert.ok(WC98.getTacticalBonus('4-4-2', '4-3-3', 'balanced').formationEdge > 1, '4-4-2 counters 4-3-3');
assert.ok(WC98.getTacticalBonus('3-5-2', '4-4-2', 'balanced').formationEdge > 1, '3-5-2 counters 4-4-2');
assert.ok(WC98.getTacticalBonus('5-3-2', '3-5-2', 'balanced').formationEdge > 1, '5-3-2 counters 3-5-2');

assert.equal(Object.keys(WC98.STADIUMS).length, 4, '4 France 98 stadiums');
assert.equal(Object.keys(WC98.WEATHER_TYPES).length, 3, '3 weather types');
assert.equal(WC98.CLASSIC_SCENARIOS.length, 5, '5 World Cup Classics scenarios');

const match = new WC98.Match({
  homeTeam: 'FRA',
  awayTeam: 'BRA',
  homeFormation: '4-3-3',
  awayFormation: '4-4-2',
  homeMentality: 'attacking',
  awayMentality: 'balanced',
  weather: 'sunny',
  stadium: 'stade_de_france',
  goldenGoal: true
});

assert.equal(match.players.length, 14, '14 players on pitch');
assert.equal(match.state, 'kickoff');
assert.ok(match.controlledPlayer, 'user has controlled player');

match.setFormation('home', '3-5-2');
assert.equal(match.homeFormation, '3-5-2', 'in-match formation switching works');
match.setMentality('home', 'defensive');
assert.equal(match.homeMentality, 'defensive', 'in-match mentality switching works');

const carrier = match.players.find(p => p.team === 'home' && p.role !== 'GK');
match.givePossession(carrier);
assert.equal(match.ball.owner, carrier, 'carrier has ball');
match.pass(1, 0);
assert.equal(match.ball.owner, null, 'ground pass releases ball');
assert.equal(match.state, 'playing', 'pass from kickoff starts play');
assert.ok(match.ball.vx > 0, 'ground pass propels ball toward target');

match.givePossession(carrier);
match.lobPass(1, 0);
assert.equal(match.ball.owner, null, 'lob pass releases ball');
assert.ok(match.ball.vz > 90, 'lob gives vertical lift');

match.givePossession(carrier);
match.skillMove(1, 0);
assert.ok(carrier.evadeTimer > 0, 'skill feint grants evasion window');

match.givePossession(carrier);
carrier.x = WC98.PITCH_HALF_W - 110;
carrier.y = 0;
match.startChargeShot();
assert.equal(match.shotCharge.active, true, 'shot charge active');
match.releaseShot(1, 0.2, 0.4, 0.76);
assert.equal(match.ball.owner, null, 'shot releases ball');
assert.ok(match.ball.vx > 200, 'shot fires toward away goal');

match.givePossession(carrier);
match.releaseShot(1, 0, 0, 1.15);
assert.ok(match.ball.vz > 180, 'overcharged shot skies high');

match.scoreGoal('home');
assert.equal(match.score.home, 1, 'goal increments home score');
assert.equal(match.state, 'goal', 'state becomes goal celebration');

match.state = 'playing';
match.half = 2;
match.score.home = 1;
match.score.away = 1;
match.clock = match.halfDuration;
match.update(0.1, {});
assert.equal(match.half, 3, 'tied match after 90m enters Golden Goal extra time');
match.scoreGoal('home');
assert.equal(match.events[match.events.length - 1].goldenGoal, true, 'Golden Goal recorded');
match.update(2.0, {});
assert.equal(match.state, 'finished', 'Golden Goal ends match immediately');
assert.equal(match.winner, 'home', 'Golden Goal winner is home');

const scen = WC98.CLASSIC_SCENARIOS.find(s => s.id === 'final_98_brazil_comeback');
const scenMatch = new WC98.Match({
  homeTeam: scen.homeTeam,
  awayTeam: scen.awayTeam,
  initialHomeScore: scen.initialHomeScore,
  initialAwayScore: scen.initialAwayScore,
  startMinute: scen.startMinute,
  stadium: scen.stadium,
  weather: scen.weather,
  goldenGoal: scen.goldenGoal
});
assert.equal(scenMatch.score.home, scen.initialHomeScore, 'scenario initializes historical home score');
assert.equal(scenMatch.score.away, scen.initialAwayScore, 'scenario initializes historical away score');
assert.equal(scenMatch.half, 2, 'scenario starts in second half');

const shootout = new WC98.PenaltyShootout({ homeTeam: 'FRA', awayTeam: 'ITA' });
assert.equal(shootout.turn, 'home', 'home kicks first');
const kickRes = shootout.takeKick({ zoneX: -1, zoneY: 1, power: 0.78 }, { diveX: 1, diveY: 0 });
assert.ok(kickRes && kickRes.outcome === 'goal', 'penalty kick into opposite corner scores');
for (let i = 0; i < 10 && !shootout.finished; i++) {
  if (shootout.turn === 'home') {
    shootout.takeKick({ zoneX: -1, zoneY: 1, power: 0.78 }, { diveX: 1, diveY: 0 });
  } else {
    shootout.takeKick({ zoneX: 0, zoneY: 1, power: 1.25 }, { diveX: 0, diveY: 1 });
  }
}
assert.equal(shootout.finished, true, 'shootout finishes with a winner');
assert.ok(shootout.winner === 'home' || shootout.winner === 'away', 'shootout declares winner');

const tourn = new WC98.Tournament({ playerTeam: 'RUS' });
assert.equal(tourn.stage, 'group', 'tournament starts in group stage');
assert.equal(Object.keys(tourn.groups).length, 4, '4 groups A-D');
for (let round = 0; round < 3; round++) {
  const nextM = tourn.getNextPlayerFixture();
  assert.ok(nextM, `player has group match ${round + 1}`);
  const isHome = nextM.home === 'RUS';
  tourn.recordPlayerMatchResult(isHome ? 3 : 0, isHome ? 0 : 3);
}
assert.equal(tourn.stage, 'quarter', 'advances to Quarter-Finals after winning group');
const qfFix = tourn.getNextPlayerFixture();
assert.ok(qfFix, 'player has Quarter-Final fixture');
tourn.recordPlayerMatchResult(qfFix.home === 'RUS' ? 2 : 0, qfFix.home === 'RUS' ? 0 : 2);
assert.equal(tourn.stage, 'semi', 'advances to Semi-Finals');
const sfFix = tourn.getNextPlayerFixture();
tourn.recordPlayerMatchResult(sfFix.home === 'RUS' ? 2 : 1, sfFix.home === 'RUS' ? 1 : 2);
assert.equal(tourn.stage, 'final', 'advances to Final');
const finFix = tourn.getNextPlayerFixture();
tourn.recordPlayerMatchResult(finFix.home === 'RUS' ? 3 : 1, finFix.home === 'RUS' ? 1 : 3);
assert.equal(tourn.stage, 'completed', 'wins World Cup 98 trophy');
assert.equal(tourn.knockout.champion, 'RUS', 'RUS crowned World Cup 98 champion');

function createMockElement(tag = 'div', id = '') {
  return {
    tagName: tag.toUpperCase(),
    id,
    className: '',
    width: 840,
    height: 460,
    dataset: {},
    style: {},
    disabled: false,
    textContent: '',
    innerHTML: '',
    children: [],
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    appendChild(c) {
      this.children.push(c);
      c.parentNode = this;
      return c;
    },
    remove() {},
    getAttribute(k) { return this.dataset[k] || ''; },
    toDataURL() { return 'data:image/bmp;base64,mock'; },
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return createMockElement('canvas'); },
    querySelectorAll() { return []; },
    getContext() {
      return new Proxy({}, {
        get: (t, prop) => {
          if (prop === 'createLinearGradient' || prop === 'createRadialGradient') {
            return () => ({ addColorStop() {} });
          }
          if (prop === 'measureText') return () => ({ width: 20 });
          return () => {};
        }
      });
    }
  };
}

const storage = new Map();
const mockCtx = {
  console,
  Math,
  Date,
  performance: { now: () => 1000 },
  innerWidth: 1024,
  innerHeight: 768,
  localStorage: {
    getItem: k => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: k => storage.delete(k)
  },
  setTimeout: fn => { fn(); return 1; },
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  requestAnimationFrame: () => 1,
  cancelAnimationFrame() {},
  addEventListener() {},
  removeEventListener() {},
  document: {
    createElement: t => createMockElement(t),
    getElementById: id => createMockElement('div', id),
    addEventListener() {},
    removeEventListener() {}
  },
  winManager: {
    windows: new Map(),
    createWindow(opts) {
      const win = { id: opts.id, opts, element: createMockElement('div', opts.id) };
      this.windows.set(opts.id, win);
      return win;
    },
    closeWindow(id) { this.windows.delete(id); },
    restoreWindow() {},
    bringToTop() {},
    openDialog() {}
  }
};
mockCtx.window = mockCtx;
mockCtx.globalThis = mockCtx;
vm.createContext(mockCtx);
vm.runInContext(read('js/i18n.js') + '; window.i18n = new I18nManager();', mockCtx);
vm.runInContext(read('js/icons.js') + '; window.Icons = Icons;', mockCtx);
vm.runInContext(read('js/filesystem.js'), mockCtx);
vm.runInContext(read('js/game-manager.js'), mockCtx);
vm.runInContext(read('js/desktop.js'), mockCtx);
vm.runInContext(read('js/apps/igroman.js'), mockCtx);
vm.runInContext(read('js/apps/worldcup98-core.js'), mockCtx);
vm.runInContext(read('js/apps/worldcup98-app.js'), mockCtx);

const { vfs, gameManager: gm, desktop, appIgroman, appWorldCup98 } = mockCtx;

assert.ok(mockCtx.Icons.worldcup98, 'worldcup98 icon registered');
assert.equal(gm.isInstalled('worldcup98'), false, 'worldcup98 not preinstalled');
const cdExe = vfs.resolvePath(['My Computer', 'D:', 'demo', 'worldcup98.exe']);
assert.ok(cdExe, 'D:\\demo\\worldcup98.exe exists on Igromania CD');
assert.equal(cdExe.app, 'setup');
assert.equal(cdExe.gameId, 'worldcup98');

appIgroman.open();
appIgroman.goToPage(15);
const page15Html = appIgroman.renderStageContent();
assert.ok(page15Html.includes('worldcup98.exe') && page15Html.includes('btn_install_game'), 'Igromania page 15 renders World Cup 98 installer view');

gm.finishInstallation('worldcup98', 'C:\\Games\\WorldCup98');
assert.equal(gm.isInstalled('worldcup98'), true, 'worldcup98 installed from Igromania CD');
const page15InstalledHtml = appIgroman.renderStageContent();
assert.ok(page15InstalledHtml.includes('btn_launch_worldcup98'), 'Igromania page 15 renders launch button when installed');
const wcExe = vfs.resolvePath(['My Computer', 'C:', 'Games', 'WorldCup98', 'WORLDCUP98.EXE']);
const wcReadme = vfs.resolvePath(['My Computer', 'C:', 'Games', 'WorldCup98', 'README.TXT']);
assert.ok(wcExe && wcReadme, 'WORLDCUP98.EXE and README.TXT created in C:\\Games\\WorldCup98');
assert.ok(desktop.computeCurrentIcons().some(i => i.id === 'worldcup98'), 'Desktop shortcut appears after install');

const appInstance = appWorldCup98.open();
assert.ok(mockCtx.winManager.windows.has('app_worldcup98'), 'World Cup 98 window opens');
assert.ok(appInstance.root.innerHTML.includes('WORLD CUP 98'), 'Main menu renders France 98 broadcast ribbon');

appInstance.handleAction('open-friendly');
assert.ok(appInstance.root.innerHTML.includes('wc98-desk-layout'), 'Friendly setup screen uses Pre-Match Desk layout');

appInstance.handleAction('open-tournament');
assert.ok(appInstance.root.innerHTML.includes('wc98-tourney-grid'), 'Tournament hub renders groups and knockout bracket');

appInstance.handleAction('open-classics');
assert.ok(appInstance.root.innerHTML.includes('wc98-classics-list'), 'Classics screen renders historical archive cards');

appInstance.handleAction('open-shootout');
assert.ok(appInstance.root.innerHTML.includes('wc98-pen-grid'), 'Penalty duel screen renders 11m shootout layout');

appInstance.startFriendlyMatch();
assert.equal(appInstance.screen, 'match', 'Match screen active');
const mockCanvasCtx = createMockElement('canvas').getContext('2d');
appInstance.renderPitchCanvas(mockCanvasCtx, 840, 460);
appInstance.destroy();

for (const f of ['js/apps/worldcup98-core.js', 'js/apps/worldcup98-app.js']) {
  const src = read(f).replace(/https?:\/\/[^\s'"`]+/g, '');
  assert.ok(!/\/\/|\/\*/.test(src), `${f} contains zero comments`);
  assert.ok(!/Microsoft|Windows/.test(src), `${f} follows Microslop/Win naming rule`);
}
assert.ok(!read('css/apps/worldcup98.css').includes('/*'), 'css/apps/worldcup98.css contains zero comments');

console.log('ALL WORLD CUP 98 TESTS PASSED!');
