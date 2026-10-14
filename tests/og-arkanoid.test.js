const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

console.log('--- Testing Office Arkanoid 98 (Stage 3) ---');

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
      createRadialGradient: () => ({ addColorStop() {} })
    }),
    querySelector(selector) {
      if (selector === '#og_arkanoid_canvas' || selector === 'canvas') {
        let found = this.children.find(c => c.tagName === 'CANVAS');
        if (!found) {
          found = createMockElement('canvas', 'og_arkanoid_canvas');
          found.width = 320;
          found.height = 400;
          this.appendChild(found);
        }
        return found;
      }
      if (selector === '#og_arkanoid_boss' || selector.includes('boss')) {
        let found = this.children.find(c => c.id === 'og_arkanoid_boss');
        if (!found) {
          found = createMockElement('div', 'og_arkanoid_boss');
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
      return { left: 0, top: 0, width: 320, height: 400 };
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
context.performance = { now: () => Date.now() };
context.addEventListener = () => {};
context.removeEventListener = () => {};
context.window.soundSys = mockSoundSys;
context.window.winManager = mockWinManager;

vm.createContext(context);

const arkanoidCode = fs.readFileSync(path.join(__dirname, '../js/apps/officegames/og-arkanoid.js'), 'utf8');
vm.runInContext(arkanoidCode, context);

assert.ok(context.window.appOgArkanoid, 'appOgArkanoid must be registered on window');
const app = context.window.appOgArkanoid;

app.open();
assert.ok(mockWinManager.windows.has('app_og_arkanoid'), 'Window should be created');
assert.ok(app.canvas, 'Canvas element must be initialized');
assert.ok(app.ctx, 'Canvas context must be initialized');

assert.equal(app.gameState, 'ready');
assert.equal(app.level, 1);
assert.equal(app.lives, 3);
assert.equal(app.score, 0);

app.triggerAction();
assert.equal(app.gameState, 'playing');
assert.equal(app.balls.length, 1);
assert.ok(app.bricks.length > 0, 'Bricks must be generated for level 1');

const initialPaddleX = app.paddle.x;
app.onKeyDown({ key: 'ArrowRight', preventDefault() {} });
app.update(16);
assert.ok(app.paddle.x > initialPaddleX, 'Paddle should move right');
app.onKeyUp({ key: 'ArrowRight', preventDefault() {} });

const testBrick = app.bricks[0];
const targetHp = testBrick.hp;
app.balls = [{ x: testBrick.x + 5, y: testBrick.y + 5, r: 4, vx: 0, vy: -1 }];
app.update(16);
assert.ok(testBrick.hp < targetHp || app.score > 0, 'Ball hit should damage brick or increase score');

const livesBefore = app.lives;
app.applyDrop('+');
assert.equal(app.lives, livesBefore + 1, 'Life drop should grant extra life');

app.applyDrop('M');
assert.ok(app.balls.length > 1, 'Multiball should duplicate balls');

app.applyDrop('L');
assert.ok(app.paddle.laserTimer > 0, 'Laser drop should activate laser timer');

app.applyDrop('W');
assert.ok(app.paddle.wideTimer > 0, 'Wide drop should activate wide paddle timer');
assert.equal(app.paddle.w, 84, 'Paddle width should be 84 with wide bonus');

assert.equal(app.bossMode, false);
app.toggleBossKey();
assert.equal(app.bossMode, true, 'Boss mode should be active');
app.toggleBossKey();
assert.equal(app.bossMode, false, 'Boss mode should be deactivated');

app.score = 2500;
app.saveHighScore();
assert.equal(mockLocalStorage.getItem('office_games_scores_arkanoid'), '2500');

app.destroy();
mockWinManager.closeWindow('app_og_arkanoid');
assert.ok(!mockWinManager.windows.has('app_og_arkanoid'), 'Window should be removed on close');

console.log('Office Arkanoid 98 tests passed successfully.');
