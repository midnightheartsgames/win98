const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Expanded Office Games Suite (Lines 98, Tetris, Chair GP) ---');

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
      rotate() {},
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
          found.width = 360;
          found.height = 360;
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
      return { left: 0, top: 0, width: 360, height: 360 };
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

const linesCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-lines.js'), 'utf8');
const tetrisCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-tetris.js'), 'utf8');
const chairsCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-chairs.js'), 'utf8');

vm.runInContext(linesCode, context);
vm.runInContext(tetrisCode, context);
vm.runInContext(chairsCode, context);

assert.ok(context.window.appOgLines, 'appOgLines must be registered');
const linesApp = context.window.appOgLines;
linesApp.open();
assert.ok(mockWinManager.windows.has('app_og_lines'), 'Color Lines window created');
assert.equal(linesApp.size, 9);
assert.equal(linesApp.board.length, 9);

let ballCount = 0;
for (let r = 0; r < 9; r++) {
  for (let c = 0; c < 9; c++) {
    if (linesApp.board[r][c] !== -1) ballCount++;
  }
}
assert.equal(ballCount, 5, 'Initial board should have 5 balls spawned');

linesApp.board[0][0] = 0;
linesApp.board[0][1] = 0;
linesApp.board[0][2] = 0;
linesApp.board[0][3] = 0;
linesApp.board[0][4] = 0;
const foundLines = linesApp.findLines();
assert.ok(foundLines.length >= 5, 'findLines should detect line of 5 balls');

const scoreBefore = linesApp.score;
linesApp.clearLines(foundLines);
assert.ok(linesApp.score > scoreBefore, 'Score should increase after clearing line');
assert.equal(linesApp.board[0][0], -1, 'Cleared cells should become empty');

linesApp.board[4][4] = 1;
linesApp.board[4][5] = -1;
assert.equal(linesApp.findPath(4, 4, 4, 5), true, 'Direct path to adjacent cell must exist');

assert.equal(linesApp.bossMode, false);
linesApp.toggleBossKey();
assert.equal(linesApp.bossMode, true);
linesApp.toggleBossKey();
assert.equal(linesApp.bossMode, false);

linesApp.score = 520;
linesApp.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_lines98'), '520');
linesApp.destroy();
mockWinManager.closeWindow('app_og_lines');

assert.ok(context.window.appOgTetris, 'appOgTetris must be registered');
const tetrisApp = context.window.appOgTetris;
tetrisApp.open();
assert.ok(mockWinManager.windows.has('app_og_tetris'), 'Office Tetris window created');
assert.equal(tetrisApp.cols, 10);
assert.equal(tetrisApp.rows, 20);
assert.ok(tetrisApp.currentPiece, 'Current piece must be active');

const startX = tetrisApp.currentPiece.x;
tetrisApp.movePiece(1);
assert.equal(tetrisApp.currentPiece.x, startX + 1, 'Piece moves right by 1');

tetrisApp.rotatePiece();
assert.ok(tetrisApp.currentPiece.shape, 'Piece rotated');

const startY = tetrisApp.currentPiece.y;
tetrisApp.dropPiece();
assert.ok(tetrisApp.currentPiece.y >= startY, 'Piece drops downward');

for (let c = 0; c < 10; c++) {
  tetrisApp.grid[19][c] = '#ff0000';
}
const tetrisScoreBefore = tetrisApp.score;
tetrisApp.clearLines();
assert.ok(tetrisApp.lines > 0, 'Lines cleared counter increments');
assert.ok(tetrisApp.score > tetrisScoreBefore, 'Score increases after clearing line');

assert.equal(tetrisApp.bossMode, false);
tetrisApp.toggleBossKey();
assert.equal(tetrisApp.bossMode, true);
tetrisApp.toggleBossKey();
assert.equal(tetrisApp.bossMode, false);

tetrisApp.score = 6400;
tetrisApp.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_tetris'), '6400');
tetrisApp.destroy();
mockWinManager.closeWindow('app_og_tetris');

assert.ok(context.window.appOgChairs, 'appOgChairs must be registered');
const chairsApp = context.window.appOgChairs;
chairsApp.open();
assert.ok(mockWinManager.windows.has('app_og_chairs'), 'Chair GP window created');
assert.equal(chairsApp.lives, 3);

chairsApp.onKeyDown({ key: ' ', preventDefault() {} });
assert.equal(chairsApp.gameState, 'playing', 'Game starts on Space');

const initialChairX = chairsApp.player.x;
chairsApp.keys.right = true;
chairsApp.updateSimulation();
assert.ok(chairsApp.player.x > initialChairX, 'Chair steers right');
chairsApp.keys.right = false;

const initialSpeed = chairsApp.player.speed;
chairsApp.keys.up = true;
chairsApp.onKeyDown({ key: 'ArrowUp', preventDefault() {} });
assert.ok(chairsApp.player.speed >= initialSpeed, 'Accelerates on push');
chairsApp.keys.up = false;

chairsApp.items = [{ x: chairsApp.player.x, y: chairsApp.player.y, w: 16, h: 16, type: 'coffee', points: 150 }];
chairsApp.updateSimulation();
assert.ok(chairsApp.player.boostTimer > 0, 'Turbo coffee active');

const livesBefore = chairsApp.lives;
chairsApp.hitObstacle({ type: 'cart' }, 0);
assert.equal(chairsApp.lives, livesBefore - 1, 'Cart collision costs a life');

assert.equal(chairsApp.bossMode, false);
chairsApp.toggleBossKey();
assert.equal(chairsApp.bossMode, true);
chairsApp.toggleBossKey();
assert.equal(chairsApp.bossMode, false);

chairsApp.score = 1850;
chairsApp.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_chairs'), '1850');
chairsApp.destroy();
mockWinManager.closeWindow('app_og_chairs');

console.log('Expanded Office Games Suite tests passed successfully.');
