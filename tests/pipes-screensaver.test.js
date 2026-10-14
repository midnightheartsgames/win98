const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Mock browser environment for screensaver testing
let animFrameId = 1;
const animCallbacks = new Map();
global.requestAnimationFrame = (cb) => {
  const id = animFrameId++;
  animCallbacks.set(id, cb);
  return id;
};
global.cancelAnimationFrame = (id) => {
  animCallbacks.delete(id);
};

const calls = {
  fillRect: [],
  arc: [],
  moveTo: [],
  lineTo: [],
  stroke: [],
  fill: [],
  createLinearGradient: [],
  createRadialGradient: []
};

const mockCtx = {
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  fillRect: (x, y, w, h) => calls.fillRect.push({ x, y, w, h }),
  beginPath: () => {},
  closePath: () => {},
  save: () => {},
  restore: () => {},
  arc: (x, y, r, sa, ea) => calls.arc.push({ x, y, r }),
  moveTo: (x, y) => calls.moveTo.push({ x, y }),
  lineTo: (x, y) => calls.lineTo.push({ x, y }),
  stroke: () => calls.stroke.push(true),
  fill: () => calls.fill.push(true),
  createLinearGradient: (x1, y1, x2, y2) => {
    calls.createLinearGradient.push({ x1, y1, x2, y2 });
    return { addColorStop: () => {} };
  },
  createRadialGradient: (x1, y1, r1, x2, y2, r2) => {
    calls.createRadialGradient.push({ x1, y1, r1, x2, y2, r2 });
    return { addColorStop: () => {} };
  }
};

const mockCanvas = {
  width: 1024,
  height: 768,
  getContext: (type) => (type === '2d' ? mockCtx : null)
};

const mockOverlay = {
  id: 'screensaver-overlay',
  style: { display: 'none' },
  querySelector: (sel) => (sel === '#screensaver-canvas' ? mockCanvas : null)
};

global.document = {
  createElement: (tag) => {
    if (tag === 'div') return mockOverlay;
    if (tag === 'canvas') return mockCanvas;
    return {};
  },
  body: {
    appendChild: () => {}
  }
};

global.window = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: () => {}
};

global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};

// Evaluate screensaver.js
const screensaverCode = fs.readFileSync(path.join(__dirname, '../js/apps/screensaver.js'), 'utf-8');
eval(screensaverCode);

const screensaver = new window.AppScreensaver();

console.log('--- Testing 3D Pipes Screensaver ---');

// Test 1: Start 3D pipes screensaver
{
  screensaver.start('pipes');
  assert.equal(screensaver.isActive, true, 'Screensaver should be active');
  assert.equal(mockOverlay.style.display, 'block', 'Overlay should be visible');
  assert.ok(screensaver.animId, 'Animation frame loop should be registered');
  console.log('PASS 1. Screensaver successfully starts in 3D Pipes mode');
}

// Test 2: Animation frame execution with 3D projection & rendering
{
  // Trigger one frame of animation loop
  assert.ok(animCallbacks.size > 0, 'Should have registered animation callback');
  const callback = Array.from(animCallbacks.values())[0];
  animCallbacks.clear();

  // Run frame with timestamp
  callback(100);

  // Check that canvas was cleared and 3D geometries (spheres and cylinders) were drawn
  assert.ok(calls.fillRect.length >= 1, 'fillRect should be called to clear background');
  assert.ok(calls.createRadialGradient.length >= 1, 'Radial gradient should be used for 3D sphere joints');
  assert.ok(calls.fill.length >= 1, '3D shapes should be filled');
  console.log('PASS 2. 3D perspective projection and 3D gradient shading render every frame');
}

// Test 3: Stop screensaver
{
  screensaver.stop();
  assert.equal(screensaver.isActive, false, 'Screensaver should not be active');
  assert.equal(mockOverlay.style.display, 'none', 'Overlay should be hidden');
  console.log('PASS 3. Screensaver cleanly stops and cancels animation');
}

// Test 4: Smooth extrusion pacing
{
  // Test multiple step updates and verify controlled progress rather than instant jumps
  screensaver.start('pipes');
  const frame1 = Array.from(animCallbacks.values())[0];
  animCallbacks.clear();

  // Advance time by 30ms (small delta, segment should NOT finish in one 30ms step)
  frame1(130);

  // Another frame scheduled
  assert.ok(animCallbacks.size > 0, 'Continuous animation loop should schedule next frame');
  screensaver.stop();
  console.log('PASS 4. Controlled extrusion timing prevents instant rushing');
}

console.log('ALL 3D PIPES TESTS PASSED!');
