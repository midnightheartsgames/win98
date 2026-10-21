const fs = require('fs');
const path = require('path');
const assert = require('assert');

global.localStorage = {
  store: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};

function makeStubElement() {
  const el = {
    innerHTML: '',
    textContent: '',
    dataset: {},
    style: {},
    classList: {
      set: new Set(),
      add(...cls) { cls.forEach(c => this.set.add(c)); },
      remove(...cls) { cls.forEach(c => this.set.delete(c)); },
      toggle(c, force) {
        if (force === undefined) {
          if (this.set.has(c)) { this.set.delete(c); return false; }
          this.set.add(c); return true;
        }
        if (force) this.set.add(c); else this.set.delete(c);
        return !!force;
      },
      contains(c) { return this.set.has(c); }
    },
    setAttribute(k, v) { this[k] = v; },
    addEventListener() {},
    querySelector() { return makeStubElement(); },
    querySelectorAll() { return []; },
    getContext() {
      return {
        fillStyle: '',
        strokeStyle: '',
        font: '',
        lineWidth: 1,
        imageSmoothingEnabled: false,
        save() {},
        restore() {},
        scale() {},
        fillRect() {},
        strokeRect() {},
        fillText() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        stroke() {},
        fill() {},
        ellipse() {}
      };
    }
  };
  return el;
}

global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener() {},
  removeEventListener() {},
  soundSys: { muted: false, playClick() {}, playDing() {}, playError() {} },
  winManager: {
    windows: new Map(),
    activeWindowId: null,
    createWindow(cfg) {
      const winObj = { id: cfg.id, title: cfg.title, element: makeStubElement(), onClose: cfg.onClose };
      this.windows.set(cfg.id, winObj);
      this.activeWindowId = cfg.id;
      return winObj;
    },
    focusWindow(id) { this.activeWindowId = id; },
    closeWindow(id) {
      const w = this.windows.get(id);
      if (w && w.onClose) w.onClose();
      this.windows.delete(id);
    },
    openDialog() {}
  }
};

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

eval(read('js/icons.js'));
eval(read('js/filesystem.js'));
eval(read('js/apps/emuland-site.js'));
eval(read('js/apps/emulator/emu-audio.js'));
eval(read('js/apps/emulator/emu-games-nes.js'));
eval(read('js/apps/emulator/emu-games-16bit.js'));
eval(read('js/apps/emulator-app.js'));

let passed = 0;
function check(name, fn) {
  fn();
  passed++;
  console.log('  ok -', name);
}

check('VFS includes EMULAND98.EXE and C:\\Program Files\\EmuLand98 executables', () => {
  const winExec = window.vfs.getNode(['My Computer', 'C:', 'WINDOWS', 'EMULAND98.EXE']);
  assert.ok(winExec && winExec.app === 'emulator');
  const emuFolder = window.vfs.getNode(['My Computer', 'C:', 'Program Files', 'EmuLand98']);
  assert.ok(emuFolder && emuFolder.children['NESTICLE.EXE']);
  assert.ok(emuFolder.children['GENECYST.EXE']);
  assert.ok(emuFolder.children['ZSNESW.EXE']);
  assert.ok(emuFolder.children['VGB98.EXE']);
});

check('Downloading all 9 ROMs from emuland98.ru writes valid ROM files with emulator association', () => {
  const roms = window.emuLandSite.getRoms();
  assert.strictEqual(roms.length, 9);
  roms.forEach(rom => {
    const fname = window.emuLandSite.downloadRom(rom.id);
    assert.strictEqual(fname, rom.file);
    const node = window.vfs.getNode(['My Computer', 'C:', 'My Documents', 'Downloads', fname]);
    assert.ok(node, `Missing VFS node for ${fname}`);
    assert.strictEqual(node.app, 'emulator');
    assert.strictEqual(node.icon, 'file-rom');
    assert.ok(node.content.includes('GoodDump OK'));
  });
});

check('Emulator boots all 9 ROMs from VFS files and runs frames on all 4 console cores', () => {
  const emu = window.appEmulator;
  emu.open();
  const roms = window.emuLandSite.getRoms();
  roms.forEach(rom => {
    const node = window.vfs.getNode(['My Computer', 'C:', 'My Documents', 'Downloads', rom.file]);
    emu.handleTarget(rom.file, node.content, ['My Computer', 'C:', 'My Documents', 'Downloads']);
    assert.strictEqual(emu.activeRom.id, rom.id);
    assert.strictEqual(emu.currentSys, rom.sys);
    assert.ok(emu.activeCore, `Missing activeCore for ${rom.id}`);
    emu.activeCore.onButtonPress('start', emu.input);
    for (let i = 0; i < 15; i++) emu.stepFrame();
  });
});

check('All 9 cheats from http://www.emuland98.ru/cheats work via manual input and macro', () => {
  const emu = window.appEmulator;

  emu.loadCartridge('battlecity');
  emu.activeCore.onButtonPress('start', emu.input);
  assert.strictEqual(emu.activeCore.mode, 'stage_select');
  emu.activeCore.onButtonPress('a', emu.input);
  assert.strictEqual(emu.activeCore.stage, 2);
  assert.strictEqual(emu.activeCore.cheatUnlocked, true);

  emu.loadCartridge('smb');
  emu.activeCore.lastLostWorld = 4;
  emu.activeCore.mode = 'gameover';
  emu.activeCore.onButtonPress('start', { a: true });
  assert.strictEqual(emu.activeCore.world, 4);
  assert.strictEqual(emu.activeCore.cheatUnlocked, true);

  emu.loadCartridge('contra');
  ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a', 'start'].forEach(btn => {
    emu.activeCore.onButtonPress(btn, emu.input);
  });
  assert.strictEqual(emu.activeCore.lives, 30);
  assert.strictEqual(emu.activeCore.cheatUnlocked, true);

  emu.loadCartridge('chipdale');
  emu.triggerActiveCheat();
  assert.strictEqual(emu.activeCore.cheatUnlocked, true);
  assert.ok(emu.activeCore.partnerThrownCount >= 1);

  emu.loadCartridge('sonic2');
  emu.triggerActiveCheat();
  assert.strictEqual(emu.activeCore.emeralds, 7);
  assert.strictEqual(emu.activeCore.superSonic, true);

  emu.loadCartridge('umk3');
  ['a', 'c', 'up', 'b', 'up', 'b', 'a', 'down'].forEach(btn => {
    emu.activeCore.onButtonPress(btn, emu.input);
  });
  assert.strictEqual(emu.activeCore.mode, 'killer_codes');
  assert.strictEqual(emu.activeCore.oneButtonFatality, true);

  emu.loadCartridge('comixzone');
  emu.triggerActiveCheat();
  assert.strictEqual(emu.activeCore.cheatUnlocked, true);

  emu.loadCartridge('smw');
  emu.activeCore.onButtonPress('start', emu.input);
  emu.activeCore.onButtonPress('start', emu.input);
  emu.activeCore.onButtonPress('select', emu.input);
  assert.strictEqual(emu.activeCore.mode, 'map');
  assert.strictEqual(emu.activeCore.cheatUnlocked, true);

  emu.loadCartridge('tetris');
  emu.activeCore.onButtonPress('start', { down: true });
  assert.strictEqual(emu.activeCore.heartMode, true);
  assert.strictEqual(emu.activeCore.cheatUnlocked, true);
});

check('Save states and .STA VFS export/import round-trip state', () => {
  const emu = window.appEmulator;
  emu.loadCartridge('contra');
  emu.triggerActiveCheat();
  emu.activeCore.score = 12400;
  const staFile = emu.exportStateToVfs(2);
  assert.strictEqual(staFile, 'CONTRA_S2.STA');
  const staNode = window.vfs.getNode(['My Computer', 'C:', 'My Documents', 'Downloads', staFile]);
  assert.ok(staNode && staNode.content.includes('CONTRA.NES'));

  emu.loadCartridge('battlecity');
  emu.handleTarget(staFile, staNode.content, ['My Computer', 'C:', 'My Documents', 'Downloads']);
  assert.strictEqual(emu.activeRom.id, 'contra');
  assert.strictEqual(emu.activeCore.score, 12400);
  assert.strictEqual(emu.activeCore.lives, 30);
});

check('Pixel-art engine (EmuGfx) and all 9 upgraded cores render rich pixel sprites and mechanics', () => {
  assert.ok(window.EmuGfx && typeof window.EmuGfx.drawPixelSprite === 'function');
  assert.ok(typeof window.EmuGfx.drawDirectionalSprite === 'function');
  assert.ok(typeof window.EmuGfx.drawExplosionSprite === 'function');

  const countDraws = (fn) => {
    let rects = 0;
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      font: '',
      lineWidth: 1,
      imageSmoothingEnabled: false,
      save() {},
      restore() {},
      scale() {},
      fillRect() { rects++; },
      strokeRect() {},
      fillText() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      stroke() {},
      fill() {},
      ellipse() {}
    };
    fn(ctx);
    return rects;
  };

  const emu = window.appEmulator;
  const roms = window.emuLandSite.getRoms();
  roms.forEach(rom => {
    emu.loadCartridge(rom.id);
    const titleRects = countDraws(ctx => emu.activeCore.render(ctx));
    assert.ok(titleRects > 80, `Expected rich pixel art on title screen of ${rom.id}, got ${titleRects}`);
    emu.activeCore.onButtonPress('start', emu.input);
    if (rom.id === 'battlecity') emu.activeCore.onButtonPress('start', emu.input);
    if (rom.id === 'smw') emu.activeCore.onButtonPress('a', emu.input);
    for (let i = 0; i < 10; i++) emu.activeCore.step(emu.input);
    const playRects = countDraws(ctx => emu.activeCore.render(ctx));
    assert.ok(playRects > 120, `Expected rich pixel art in gameplay of ${rom.id}, got ${playRects}`);

    const shotCanvas = {
      width: 240,
      height: 180,
      getContext() {
        let shotRects = 0;
        return {
          fillStyle: '',
          strokeStyle: '',
          font: '',
          lineWidth: 1,
          imageSmoothingEnabled: false,
          save() {},
          restore() {},
          scale() {},
          fillRect() { shotRects++; },
          strokeRect() {},
          fillText() {},
          beginPath() {},
          moveTo() {},
          lineTo() {},
          stroke() {},
          fill() {},
          ellipse() {},
          getCount() { return shotRects; }
        };
      }
    };
    window.emuLandSite.drawShot(shotCanvas, rom.id);
  });

  emu.loadCartridge('battlecity');
  emu.activeCore.buildStage(1);
  assert.ok(Array.isArray(emu.activeCore.brickMask));
  emu.activeCore.damageBrickTile(11, 5, 0, 1);
  assert.ok(emu.activeCore.brickMask[11][5] < 15);

  emu.loadCartridge('sonic2');
  emu.activeCore.mode = 'play';
  assert.ok(emu.activeCore.tails && typeof emu.activeCore.tails.x === 'number');
  assert.ok(Array.isArray(emu.activeCore.bumpers) && emu.activeCore.bumpers.length > 0);
  emu.activeCore.onButtonPress('a', { down: true });
  assert.ok(emu.activeCore.sonic.spin && Math.abs(emu.activeCore.sonic.vx) > 5);

  emu.loadCartridge('umk3');
  emu.activeCore.mode = 'play';
  emu.activeCore.onButtonPress('c', {});
  assert.ok(emu.activeCore.projectiles.length > 0 && emu.activeCore.projectiles[0].kind === 'harpoon');

  emu.loadCartridge('comixzone');
  emu.activeCore.mode = 'play';
  emu.activeCore.onButtonPress('c', {});
  assert.ok(emu.activeCore.plane && emu.activeCore.plane.active);

  emu.loadCartridge('smw');
  emu.activeCore.mode = 'play';
  emu.activeCore.onButtonPress('c', {});
  assert.ok(emu.activeCore.tongueTimer > 0);

  emu.loadCartridge('tetris');
  emu.activeCore.startGame(false);
  const yBefore = emu.activeCore.cur.y;
  emu.activeCore.onButtonPress('c', {});
  assert.ok(emu.activeCore.score >= (18 - yBefore));
});

check('Zero comments and Microslop/Win naming compliance in all emulator files', () => {
  const files = [
    'css/apps/emulator.css',
    'js/apps/emulator/emu-audio.js',
    'js/apps/emulator/emu-games-nes.js',
    'js/apps/emulator/emu-games-16bit.js',
    'js/apps/emulator-app.js',
    'js/apps/emuland-site.js',
    'css/apps/emuland-site.css',
    'tests/emulator.test.js'
  ];
  files.forEach(f => {
    const src = read(f);
    assert.ok(!/\/\*[\s\S]*?\*\//.test(src), `Block comment found in ${f}`);
    const lines = src.split('\n');
    lines.forEach((line, idx) => {
      const stripped = line.replace(/https?:\/\/[^\s'"`]+/g, '');
      assert.ok(!/^\s*\/\//.test(stripped), `Line comment found in ${f}:${idx + 1}`);
    });
    assert.ok(!/\bMicrosoft\b/i.test(src), `Forbidden word in ${f}`);
  });
});

console.log(`\nALL ${passed} EMULATOR TESTS PASSED!`);
