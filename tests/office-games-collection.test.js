const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Games Compilation Suite (Stage 4) ---');

const storage = new Map();
const mockLocalStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

function createMockElement(tag = 'div', id = '') {
  const el = {
    tagName: tag.toUpperCase(),
    id,
    dataset: {},
    style: {},
    disabled: false,
    textContent: '',
    innerHTML: '',
    clientWidth: 800,
    clientHeight: 572,
    children: [],
    classList: {
      tokens: new Set(),
      add(c) { this.tokens.add(c); },
      remove(c) { this.tokens.delete(c); },
      contains(c) { return this.tokens.has(c); },
      toggle(c, force) {
        if (force === true) this.tokens.add(c);
        else if (force === false) this.tokens.delete(c);
        else if (this.tokens.has(c)) this.tokens.delete(c);
        else this.tokens.add(c);
      }
    },
    appendChild(c) {
      this.children.push(c);
      c.parentNode = this;
      return c;
    },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {},
    getContext: () => ({
      fillRect() {},
      strokeRect() {},
      clearRect() {},
      beginPath() {},
      arc() {},
      fill() {},
      stroke() {},
      moveTo() {},
      lineTo() {},
      bezierCurveTo() {},
      closePath() {},
      setLineDash() {},
      ellipse() {},
      fillText() {},
      measureText: () => ({ width: 10 }),
      createLinearGradient: () => ({ addColorStop() {} }),
      createRadialGradient: () => ({ addColorStop() {} }),
      save() {},
      restore() {},
      translate() {},
      scale() {}
    }),
    querySelector(selector) {
      if (selector.includes('canvas')) {
        let found = this.children.find(c => c.tagName === 'CANVAS');
        if (!found) {
          found = createMockElement('canvas', 'game_canvas');
          found.width = 400;
          found.height = 300;
          this.appendChild(found);
        }
        return found;
      }
      if (selector.includes('boss')) {
        let found = this.children.find(c => c.id && c.id.includes('boss'));
        if (!found) {
          found = createMockElement('div', 'boss_screen');
          this.appendChild(found);
        }
        return found;
      }
      return createMockElement('div');
    },
    querySelectorAll() {
      return [];
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 400, height: 300 };
    }
  };
  return el;
}

const mockDocument = {
  createElement: (tag) => createMockElement(tag),
  getElementById: (id) => createMockElement('div', id),
  addEventListener() {},
  removeEventListener() {}
};

const mockSoundSys = {
  playTone() {},
  play() {}
};

const windowsMap = new Map();
const mockWinManager = {
  windows: windowsMap,
  createWindow(opts) {
    const bodyEl = createMockElement('div');
    const winObj = {
      id: opts.id,
      title: opts.title,
      body: bodyEl,
      close: () => {
        windowsMap.delete(opts.id);
        if (opts.onClose) opts.onClose();
      }
    };
    windowsMap.set(opts.id, winObj);
    return winObj;
  },
  bringToTop() {},
  closeWindow(id) {
    const w = windowsMap.get(id);
    if (w) w.close();
  }
};

const context = {
  window: {},
  document: mockDocument,
  localStorage: mockLocalStorage,
  performance: { now: () => Date.now() },
  console,
  setTimeout: (fn) => setTimeout(fn, 0),
  clearTimeout: (id) => clearTimeout(id),
  requestAnimationFrame: (fn) => setTimeout(fn, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  AudioContext: class {
    createOscillator() {
      return {
        connect() {},
        start() {},
        stop() {},
        frequency: { setValueAtTime() {} }
      };
    }
    createGain() {
      return {
        connect() {},
        gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }
      };
    }
  }
};
context.window = context;
context.addEventListener = () => {};
context.removeEventListener = () => {};
context.window.soundSys = mockSoundSys;
context.window.winManager = mockWinManager;

vm.createContext(context);

const snakeCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-snake3d.js'), 'utf8');
const huntCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-hunt.js'), 'utf8');
const gemsCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-gems.js'), 'utf8');
const rushCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-rush.js'), 'utf8');

vm.runInContext(snakeCode, context);
vm.runInContext(huntCode, context);
vm.runInContext(gemsCode, context);
vm.runInContext(rushCode, context);

assert.ok(context.window.appOgSnake3d, 'appOgSnake3d must be registered');
const snakeApp = context.window.appOgSnake3d;
snakeApp.open();
assert.ok(mockWinManager.windows.has('app_og_snake3d'), 'Snake 3D window created');
assert.equal(snakeApp.snake.length, 3, 'Initial snake length should be 3');
snakeApp.onKeyDown({ key: ' ', preventDefault() {} });
assert.equal(snakeApp.gameState, 'playing', 'Snake starts playing on Space');

const startHead = { ...snakeApp.snake[0] };
snakeApp.step();
assert.equal(snakeApp.snake[0].x, startHead.x + 1, 'Snake should move right by 1');

snakeApp.foods = [{ x: snakeApp.snake[0].x + 1, y: snakeApp.snake[0].y, type: 'floppy', points: 100 }];
const scoreBeforeEat = snakeApp.score;
const lenBeforeEat = snakeApp.snake.length;
snakeApp.step();
assert.equal(snakeApp.score, scoreBeforeEat + 100, 'Score should increase after eating');
assert.equal(snakeApp.snake.length, lenBeforeEat + 1, 'Snake should grow after eating');

assert.equal(snakeApp.bossMode, false);
snakeApp.toggleBossKey();
assert.equal(snakeApp.bossMode, true, 'Boss mode should be active');
snakeApp.toggleBossKey();
assert.equal(snakeApp.bossMode, false, 'Boss mode should be deactivated');

snakeApp.score = 1200;
snakeApp.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_snake3d'), '1200');
snakeApp.destroy();
mockWinManager.closeWindow('app_og_snake3d');

assert.ok(context.window.appOgHunt, 'appOgHunt must be registered');
const huntApp = context.window.appOgHunt;
huntApp.open();
assert.ok(mockWinManager.windows.has('app_og_hunt'), 'Office Hunt window created');
assert.equal(huntApp.ammo, 6, 'Initial ammo should be 6');
assert.equal(huntApp.timeLeft, 90, 'Initial time should be 90s');

huntApp.onKeyDown({ key: ' ', preventDefault() {} });
assert.equal(huntApp.gameState, 'playing', 'Hunt starts playing on Space');

huntApp.targets = [{
  x: 100,
  y: 100,
  w: 20,
  h: 20,
  vx: 2,
  vy: 0,
  type: 'paperclip',
  points: 50,
  color: '#aaa',
  dead: false
}];
huntApp.crosshair = { x: 105, y: 105 };
huntApp.shoot();
assert.equal(huntApp.ammo, 5, 'Ammo should decrement after shot');
assert.equal(huntApp.score, 50, 'Target should be hit and score 50 awarded');
assert.ok(huntApp.targets[0].dead, 'Target should be marked dead');

huntApp.targets.push({
  x: 200,
  y: 50,
  w: 24,
  h: 24,
  vx: 0,
  vy: 0,
  type: 'clock',
  points: 50,
  color: '#ff0',
  dead: false
});
huntApp.crosshair = { x: 210, y: 60 };
const timeBeforeClock = huntApp.timeLeft;
huntApp.shoot();
assert.equal(huntApp.timeLeft, timeBeforeClock + 5, 'Shooting clock adds 5 seconds');

huntApp.ammo = 0;
huntApp.reloadAmmo();
assert.equal(huntApp.ammo, 6, 'Reload should restore ammo to 6');

assert.equal(huntApp.bossMode, false);
huntApp.toggleBossKey();
assert.equal(huntApp.bossMode, true);
huntApp.toggleBossKey();
assert.equal(huntApp.bossMode, false);

huntApp.score = 2300;
huntApp.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_hunt'), '2300');
huntApp.destroy();
mockWinManager.closeWindow('app_og_hunt');

assert.ok(context.window.appOgGems, 'appOgGems must be registered');
const gemsApp = context.window.appOgGems;
gemsApp.open();
assert.ok(mockWinManager.windows.has('app_og_gems'), 'Office Gems window created');
assert.equal(gemsApp.rows, 8);
assert.equal(gemsApp.cols, 8);
assert.equal(gemsApp.movesLeft, 30);

gemsApp.grid[0][0] = 1;
gemsApp.grid[0][1] = 1;
gemsApp.grid[0][2] = 2;
gemsApp.grid[1][2] = 1;
gemsApp.selected = { r: 0, c: 2 };
gemsApp.attemptSwap(0, 2, 1, 2);
assert.ok(gemsApp.score > 0, 'Matching 3 gems should award score');

assert.equal(gemsApp.bossMode, false);
gemsApp.toggleBossKey();
assert.equal(gemsApp.bossMode, true);
gemsApp.toggleBossKey();
assert.equal(gemsApp.bossMode, false);

gemsApp.score = 3400;
gemsApp.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_gems'), '3400');
gemsApp.destroy();
mockWinManager.closeWindow('app_og_gems');

assert.ok(context.window.appOgRush, 'appOgRush must be registered');
const rushApp = context.window.appOgRush;
rushApp.open();
assert.ok(mockWinManager.windows.has('app_og_rush'), 'Office Rush window created');
assert.equal(rushApp.lives, 3);
assert.equal(rushApp.level, 1);

rushApp.onKeyDown({ key: ' ', preventDefault() {} });
assert.equal(rushApp.gameState, 'playing', 'Rush starts playing on Space');

const startX = rushApp.player.x;
rushApp.keys.right = true;
rushApp.updatePlayer();
assert.ok(rushApp.player.x > startX, 'Player moves right');
rushApp.keys.right = false;

rushApp.player.onGround = true;
rushApp.onKeyDown({ key: 'ArrowUp', preventDefault() {} });
assert.ok(rushApp.player.vy < 0, 'Player jumps upward');

rushApp.items = [{ x: rushApp.player.x, y: rushApp.player.y, w: 14, h: 14, type: 'coffee', points: 150 }];
rushApp.updatePlayer();
assert.ok(rushApp.player.boostTimer > 0, 'Coffee gives turbo boost');
assert.ok(rushApp.score >= 150, 'Coffee grants score');

const livesBeforeObstacle = rushApp.lives;
rushApp.hitObstacle();
assert.equal(rushApp.lives, livesBeforeObstacle - 1, 'Obstacle damages player');

assert.equal(rushApp.bossMode, false);
rushApp.toggleBossKey();
assert.equal(rushApp.bossMode, true);
rushApp.toggleBossKey();
assert.equal(rushApp.bossMode, false);

rushApp.score = 4500;
rushApp.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_rush'), '4500');
rushApp.destroy();
mockWinManager.closeWindow('app_og_rush');

console.log('Office Games Compilation Suite tests passed successfully.');
