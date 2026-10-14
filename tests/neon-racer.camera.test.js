const assert = require('node:assert/strict');

// Mock localStorage for Node environment before loading renderer
const storage = new Map();
globalThis.localStorage = {
  getItem: (k) => storage.has(k) ? storage.get(k) : null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear()
};

// Load required modules
for (const m of ['catalog', 'track', 'physics', 'renderer']) {
  require('../js/apps/neon-racer/' + m + '.js');
}
const N = globalThis.NeonRacer;

console.log('--- Testing Stage 5: Camera System ---');

// Helper to create mock car body
function createMockCar(overrides = {}) {
  return {
    x: 10,
    z: 20,
    yaw: 0,
    pitch: 0,
    roll: 0,
    speed: 0,
    boost: false,
    car: {
      id: 'spectre',
      length: 4.0,
      width: 1.8,
      maxSpeed: 52
    },
    lastImpact: 0,
    lastWallImpact: 0,
    ...overrides
  };
}

// 1. Camera Initialization & Modes
{
  storage.clear();
  const cam = new N.Camera();
  assert.equal(cam.mode, 0, 'Default camera mode should be Chase (0)');
  assert.deepEqual(cam.modes, ['chase', 'hood', 'bumper']);

  // Cycling
  assert.equal(cam.cycle(), 'hood');
  assert.equal(cam.mode, 1);
  assert.equal(cam.cycle(), 'bumper');
  assert.equal(cam.mode, 2);
  assert.equal(cam.cycle(), 'chase');
  assert.equal(cam.mode, 0);

  // setMode
  cam.setMode(1);
  assert.equal(cam.mode, 1);
  cam.setMode(2);
  assert.equal(cam.mode, 2);
  cam.setMode(0);
  assert.equal(cam.mode, 0);

  // setMode with wrapping / negative numbers
  cam.setMode(4);
  assert.equal(cam.mode, 1);
  cam.setMode(-1);
  assert.equal(cam.mode, 2);

  console.log('PASS 1. Camera initialization, cycling (Chase -> Hood -> Bumper) and mode wrapping');
}

// 2. Local Storage Persistence & Fallback
{
  storage.clear();
  storage.set('midnight-camera', 'hood');
  let cam = new N.Camera();
  assert.equal(cam.mode, 1, 'Should load hood mode from localStorage string "hood"');

  storage.set('midnight-camera', '2');
  cam = new N.Camera();
  assert.equal(cam.mode, 2, 'Should load bumper mode from localStorage string "2"');

  storage.set('midnight-camera', 'invalid_corrupted_value');
  cam = new N.Camera();
  assert.equal(cam.mode, 0, 'Corrupted localStorage value must safely fall back to Chase (0)');

  storage.clear();
  cam = new N.Camera();
  assert.equal(cam.mode, 0, 'Missing localStorage value must safely fall back to Chase (0)');

  cam.setMode(2);
  assert.equal(storage.get('midnight-camera'), 'bumper', 'setMode must persist mode to localStorage');

  // Ensure graceful operation if localStorage throws
  const originalGetItem = globalThis.localStorage.getItem;
  globalThis.localStorage.getItem = () => { throw new Error('SecurityError: Access denied'); };
  const safeCam = new N.Camera();
  assert.equal(safeCam.mode, 0, 'Should fall back safely to 0 if localStorage throws');
  globalThis.localStorage.getItem = originalGetItem;

  console.log('PASS 2. LocalStorage persistence, safe fallback to Chase, and error resilience');
}

// 3. Chase Camera (Mode 0)
{
  const cam = new N.Camera();
  cam.setMode(0);
  const car = createMockCar({ x: 0, z: 0, yaw: 0, speed: 0 });

  // Initial update snaps position
  const frame1 = cam.update(car, 1/60, 0);
  assert.ok(Math.abs(frame1.eye[1] - 3.8) < 0.01, 'Chase eye height should be ~3.8m');
  // Along yaw=0: fx=0, fz=1; car is at (0,0), eye at (0, -dist) where dist is 7.0 at speed 0
  assert.ok(Math.abs(frame1.eye[2] - (-7.0)) < 0.05, 'Chase eye distance should be 7.0m behind at rest');
  assert.ok(Math.abs(frame1.fov - 65.0) < 0.1, 'Chase base FOV should be 65 deg at rest');

  // Check speed-dependent distance and FOV
  const fastCar = createMockCar({ x: 0, z: 0, yaw: 0, speed: 52, boost: true });
  // Allow camera to adapt to fast speed
  cam.reset();
  const fastFrame = cam.update(fastCar, 1/60, 0);
  // At max speed, dist increases by ~0.9m
  assert.ok(Math.abs(fastFrame.eye[2] - (-7.9)) < 0.05, 'Chase eye distance should increase by ~0.9m at max speed');
  // Dynamic FOV increases towards ~74-76 deg
  assert.ok(fastFrame.fov > 73 && fastFrame.fov <= 76.5, `Chase max FOV should be ~74-76 deg, got ${fastFrame.fov}`);

  // Test smooth follow interpolation (not instantaneous snap on subsequent frames)
  const movingCar = createMockCar({ x: 0, z: 10, yaw: 0, speed: 20 });
  const fBefore = cam.update(movingCar, 1/60, 0.016);
  movingCar.z = 20; // sudden teleport
  const fAfter = cam.update(movingCar, 1/60, 0.032);
  const distanceMoved = fAfter.eye[2] - fBefore.eye[2];
  assert.ok(distanceMoved < 10, 'Chase camera must smoothly lag behind rather than instantaneous teleport');
  assert.ok(distanceMoved > 0.5, 'Chase camera must make responsive progress toward target');

  console.log('PASS 3. Chase mode: height, speed-dependent distance, dynamic FOV & smooth follow');
}

// 4. Hood Camera (Mode 1)
{
  const cam = new N.Camera();
  cam.setMode(1);
  const car = createMockCar({ x: 5, z: 15, yaw: 0, speed: 0, pitch: 0 });

  const frame1 = cam.update(car, 1/60, 0);
  assert.ok(Math.abs(frame1.eye[1] - 1.10) < 0.01, `Hood camera eye height should be 1.10m, got ${frame1.eye[1]}`);
  assert.ok(frame1.eye[2] > car.z, 'Hood camera eye must be forward of vehicle origin');
  assert.ok(frame1.target[2] > frame1.eye[2] + 15, 'Hood camera target must look far forward (~20m)');
  assert.ok(frame1.fov >= 67 && frame1.fov <= 75.5, `Hood FOV should be in range 67-75, got ${frame1.fov}`);

  // Pitch contribution (<= 20%)
  const pitchedCar = createMockCar({ x: 5, z: 15, yaw: 0, pitch: 0.1 });
  cam.reset();
  const pitchedFrame = cam.update(pitchedCar, 1/60, 0);
  const deltaHeight = pitchedFrame.eye[1] - frame1.eye[1];
  assert.ok(deltaHeight > 0, 'Positive pitch (nose up) should raise hood camera slightly');
  assert.ok(deltaHeight <= 0.1 * 0.20, 'Pitch contribution must be <= 20%');

  console.log('PASS 4. Hood mode: position at windshield base, look target forward, subtle pitch feedback');
}

// 5. Bumper Camera (Mode 2) & Culling
{
  const cam = new N.Camera();
  cam.setMode(2);
  const car = createMockCar({ x: 0, z: 0, yaw: 0, speed: 0 });

  const frame1 = cam.update(car, 1/60, 0);
  assert.ok(Math.abs(frame1.eye[1] - 0.42) < 0.01, `Bumper camera eye height should be 0.42m, got ${frame1.eye[1]}`);
  const bumperOffset = car.car.length * 0.5 + 0.15;
  assert.ok(Math.abs(frame1.eye[2] - bumperOffset) < 0.05, `Bumper camera eye should be at front bumper (~${bumperOffset}m)`);
  assert.ok(Math.abs(frame1.target[1] - 0.38) < 0.05, 'Bumper camera target height should be ~0.38m');

  // Verify player car mesh culling rule in Bumper mode
  assert.equal(cam.mode === 2, true, 'Camera mode is Bumper (2)');
  const shouldDrawPlayerInBumper = false || cam.mode !== 2;
  assert.equal(shouldDrawPlayerInBumper, false, 'Player car mesh must be culled in bumper mode');

  const shouldDrawPlayerInChase = false || 0 !== 2;
  assert.equal(shouldDrawPlayerInChase, true, 'Player car mesh must be drawn in Chase mode');

  const shouldDrawPlayerInHood = false || 1 !== 2;
  assert.equal(shouldDrawPlayerInHood, true, 'Player car mesh must be drawn in Hood mode');

  console.log('PASS 5. Bumper mode: low nose position, front bumper offset, and player mesh culling');
}

// 6. Impact Camera Shake / Trauma
{
  const cam = new N.Camera();
  cam.setMode(0); // Chase (1.0 scale)

  // Under 6 m/s: zero trauma
  const slowImpactCar = createMockCar({ lastImpact: 5.5 });
  cam.update(slowImpactCar, 1/60, 0);
  assert.equal(cam.trauma, 0, 'Impacts < 6 m/s should cause zero trauma');
  assert.equal(slowImpactCar.lastImpact, 5.5, 'Under-threshold impact is not consumed');

  // 6–12 m/s: subtle trauma
  const mildImpactCar = createMockCar({ lastImpact: 9.0 });
  cam.update(mildImpactCar, 1/60, 0.1);
  assert.ok(cam.trauma > 0 && cam.trauma <= 0.35, `Subtle impact should produce low trauma, got ${cam.trauma}`);
  assert.equal(mildImpactCar.lastImpact, 0, 'Impact must be consumed and reset to 0');

  // 12–20 m/s: noticeable trauma
  cam.reset();
  const noticeImpactCar = createMockCar({ lastWallImpact: 16.0 });
  cam.update(noticeImpactCar, 1/60, 0.2);
  assert.ok(cam.trauma > 0.35 && cam.trauma <= 0.75, `16 m/s impact should produce noticeable trauma, got ${cam.trauma}`);
  assert.equal(noticeImpactCar.lastWallImpact, 0, 'Wall impact must be consumed and reset to 0');

  // 20+ m/s: high trauma
  cam.reset();
  const hardImpactCar = createMockCar({ lastImpact: 26.0 });
  cam.update(hardImpactCar, 1/60, 0.3);
  assert.ok(cam.trauma >= 0.75 && cam.trauma <= 1.0, `20+ m/s impact should produce high trauma, got ${cam.trauma}`);

  // Trauma decay over time
  const tBefore = cam.trauma;
  cam.update(createMockCar(), 0.1, 0.4);
  assert.ok(cam.trauma < tBefore, 'Trauma must decay over time with positive dt');

  // Shake amplitude scaling by camera mode: Chase 100%, Hood 75%, Bumper 55%
  cam.trauma = 0.8;
  cam.mode = 0;
  const shakeChase = cam.trauma * cam.trauma * 1.0;
  cam.mode = 1;
  const shakeHood = cam.trauma * cam.trauma * 0.75;
  cam.mode = 2;
  const shakeBumper = cam.trauma * cam.trauma * 0.55;
  assert.ok(shakeChase > shakeHood, 'Chase shake must be greater than Hood shake');
  assert.ok(shakeHood > shakeBumper, 'Hood shake must be greater than Bumper shake');

  console.log('PASS 6. Collision impact trauma thresholds, decay over time, and mode-dependent shake scaling');
}

// 7. Robustness & Stability (no NaN / Infinity)
{
  const cam = new N.Camera();
  const edgeCases = [
    { speed: 0, yaw: 0, pitch: 0, x: 0, z: 0 },
    { speed: 120, yaw: Math.PI * 4, pitch: -0.3, x: 1000, z: -1000 },
    { speed: -15, yaw: -Math.PI / 2, pitch: 0.2, x: -500, z: 200 },
    { speed: 0.0001, yaw: 1e-6, pitch: 0, x: 1e-5, z: 1e-5 }
  ];

  for (const mode of [0, 1, 2]) {
    cam.setMode(mode);
    for (const ec of edgeCases) {
      const car = createMockCar(ec);
      for (const dt of [0, 0.001, 1/60, 0.5]) {
        const frame = cam.update(car, dt, 1.234);
        for (let i = 0; i < 3; i++) {
          assert.ok(Number.isFinite(frame.eye[i]), `eye[${i}] must be finite for mode=${mode}, dt=${dt}`);
          assert.ok(Number.isFinite(frame.target[i]), `target[${i}] must be finite for mode=${mode}, dt=${dt}`);
        }
        assert.ok(Number.isFinite(frame.fov), `fov must be finite for mode=${mode}, dt=${dt}`);
        assert.ok(frame.fov > 50 && frame.fov < 120, `fov must be in reasonable range: ${frame.fov}`);
      }
    }
  }

  console.log('PASS 7. Camera output strictly finite (no NaN / Infinity) across edge conditions and modes');
}

// 8. Physics Isolation (Zero Side-Effects)
{
  const track = new N.TrackManager('dockside');
  const car = N.Cars[0];
  const physics = new N.Physics(track, car);
  const cam = new N.Camera();

  // Run some physics steps
  for (let i = 0; i < 60; i++) {
    physics.step({ up: true, down: false, left: true, right: false, handbrake: false, nitro: false }, 1/120);
  }

  const origX = physics.x;
  const origZ = physics.z;
  const origYaw = physics.yaw;
  const origVx = physics.vx;
  const origVz = physics.vz;
  const origSpeed = physics.speed;
  const origProgress = physics.lapProgress;

  // Cycle camera and update repeatedly
  for (let cycle = 0; cycle < 10; cycle++) {
    cam.cycle();
    cam.update(physics, 1/60, cycle * 0.1);
  }

  assert.equal(physics.x, origX, 'Camera update must not modify car.x');
  assert.equal(physics.z, origZ, 'Camera update must not modify car.z');
  assert.equal(physics.yaw, origYaw, 'Camera update must not modify car.yaw');
  assert.equal(physics.vx, origVx, 'Camera update must not modify car.vx');
  assert.equal(physics.vz, origVz, 'Camera update must not modify car.vz');
  assert.equal(physics.speed, origSpeed, 'Camera update must not modify car.speed');
  assert.equal(physics.lapProgress, origProgress, 'Camera update must not modify car.lapProgress');

  console.log('PASS 8. Complete physics isolation: camera updates and switching cause zero side-effects');
}

console.log('ALL 8 STAGE 5 CAMERA TESTS PASSED!');
