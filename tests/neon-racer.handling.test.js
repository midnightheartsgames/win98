const assert = require('node:assert/strict');
for (const file of ['catalog', 'track', 'physics', 'hud', 'race-ai']) {
  require('../js/apps/neon-racer/' + file + '.js');
}
const N = globalThis.NeonRacer;
const free = { sample: () => ({ x: 0, z: 0, yaw: 0 }), halfWidth: 10000, nearest: (x, z) => ({ x, z, distance: 0 }) };

// 1. Heading decoupled from velocity & speed synchronization
{
  const p = new N.Physics(free);
  const drive = { throttle: 1, brake: 0, steer: 0, drift: false, nitro: false };
  for (let i = 0; i < 240; i++) p.step(drive, 1 / 120);
  assert.ok(p.speed > 20, 'Car accelerates forward');
  assert.equal(Math.abs(p.speed - Math.hypot(p.vx, p.vz)) < 1e-6, true, 'speed perfectly matches hypot(vx, vz)');

  // Start turning hard right: steer = -1
  const preYaw = p.yaw;
  p.step({ ...drive, steer: -1 }, 1 / 120);

  // Yaw changes smoothly via steerResponse and yawResponse
  assert.ok(p.yaw < preYaw, 'Yaw turns right');
  // Velocity is decoupled: does not instantly point along the new yaw
  assert.equal(Math.abs(p.speed - Math.hypot(p.vx, p.vz)) < 1e-6, true, 'speed stays synced with velocity vector');
}

// 2. Natural slip without handbrake
{
  const p = new N.Physics(free, N.Cars[0]);
  // Accelerate to ~150 km/h (> 35 m/s)
  for (let i = 0; i < 600; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(p.speed > 35, 'High speed reached');

  // Hard turn WITHOUT handbrake (drift: false)
  let maxNaturalSlip = 0;
  for (let i = 0; i < 120; i++) {
    p.step({ throttle: 1, brake: 0, steer: 1, drift: false, nitro: false }, 1 / 120);
    if (p.slip > maxNaturalSlip) maxNaturalSlip = p.slip;
  }
  // 8 degrees = 0.14 rad, 18 degrees = 0.31 rad
  assert.ok(maxNaturalSlip > 0.14, 'Natural slip angle emerges without handbrake (> 8 deg)');
  assert.ok(maxNaturalSlip < 0.8, 'Natural slip remains controlled and recoverable');
}

// 3. Handbrake drift produces deeper slip
{
  const pDrift = new N.Physics(free, N.Cars[0]);
  for (let i = 0; i < 600; i++) pDrift.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  let maxHandbrakeSlip = 0;
  for (let i = 0; i < 60; i++) {
    pDrift.step({ throttle: 1, brake: 0, steer: 1, drift: true, nitro: false }, 1 / 120);
    if (pDrift.slip > maxHandbrakeSlip) maxHandbrakeSlip = pDrift.slip;
  }
  assert.ok(maxHandbrakeSlip > 0.20, 'Handbrake causes marked drift slip angle');
}

// 4. Speed-sensitive steering authority
{
  const pLow = new N.Physics(free, N.Cars[0]);
  for (let i = 0; i < 30; i++) pLow.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  for (let i = 0; i < 60; i++) pLow.step({ throttle: 1, brake: 0, steer: 1, drift: false, nitro: false }, 1 / 120);
  const lowSpeedYawRate = Math.abs(pLow.yawRate);

  const pHigh = new N.Physics(free, N.Cars[0]);
  for (let i = 0; i < 800; i++) pHigh.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  for (let i = 0; i < 60; i++) pHigh.step({ throttle: 1, brake: 0, steer: 1, drift: false, nitro: false }, 1 / 120);
  const highSpeedYawRate = Math.abs(pHigh.yawRate);

  assert.ok(highSpeedYawRate < lowSpeedYawRate, 'High speed yaw rate is attenuated for stability');
  assert.ok(highSpeedYawRate > 0.3, 'Car retains responsive high-speed turn-in');
}

// 5. Steering smoothing and rapid direction transitions (Left -> Right -> Left)
{
  const p = new N.Physics(free, N.Cars[0]);
  for (let i = 0; i < 200; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);

  for (let cycle = 0; cycle < 3; cycle++) {
    for (let i = 0; i < 20; i++) p.step({ throttle: 1, brake: 0, steer: -1, drift: false, nitro: false }, 1 / 120);
    assert.ok(Number.isFinite(p.currentSteer) && Number.isFinite(p.yawRate));
    for (let i = 0; i < 20; i++) p.step({ throttle: 1, brake: 0, steer: 1, drift: false, nitro: false }, 1 / 120);
    assert.ok(Number.isFinite(p.currentSteer) && Number.isFinite(p.yawRate));
  }
  for (let i = 0; i < 60; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(Math.abs(p.currentSteer) < 0.05, 'Steering self-centers cleanly');
  assert.ok(Math.abs(p.yawRate) < 0.1, 'Yaw rate settles without oscillation');
}

// 6. Reverse gear and braking to stop
{
  const p = new N.Physics(free, N.Cars[0]);
  for (let i = 0; i < 120; i++) p.step({ throttle: 0, brake: 1, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(p.vForward < -2, 'Car drives backwards when brake is pressed from standstill');
  assert.ok(p.vForward >= -(p.car.reverseSpeed + 0.1), 'Reverse speed is capped');

  for (let i = 0; i < 60; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(p.vForward >= -0.1, 'Forward throttle stops reverse motion');
}

// 7. Distinct vehicle characteristics
{
  const speeds = N.Cars.map(car => {
    const p = new N.Physics(free, car);
    for (let i = 0; i < 1200; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
    return p.speed;
  });
  assert.ok(speeds[1] < speeds[0] && speeds[0] < speeds[2], 'Cars have expected top speed progression: Spark < Pulse < Vandal');
}

// 8. Visual feedback: Wheel spin (forward & reverse)
{
  const p = new N.Physics(free, N.Cars[0]);
  // Forward motion
  for (let i = 0; i < 60; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(p.wheelSpin > 0, 'Wheel spin advances forward when driving forward');

  // Stop car
  for (let i = 0; i < 200; i++) p.step({ throttle: 0, brake: 1, steer: 0, drift: false, nitro: false }, 1 / 120);

  // Release brake to disengage stop lock
  p.step({ throttle: 0, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);

  // Reverse motion
  const spinAtStop = p.wheelSpin;
  for (let i = 0; i < 60; i++) p.step({ throttle: 0, brake: 1, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(p.vForward < -1, 'Car moves backwards in reverse');
  // In reverse, spin decreases
  assert.ok(p.wheelSpin < spinAtStop, 'Wheel spin rotates backwards when reversing');
}

// 9. Visual feedback: Front wheel steering
{
  const p = new N.Physics(free, N.Cars[0]);
  for (let i = 0; i < 60; i++) p.step({ throttle: 1, brake: 0, steer: 1, drift: false, nitro: false }, 1 / 120);
  // 25-30 deg = 0.436 - 0.523 rad
  const maxDeg = p.steerVisual * 180 / Math.PI;
  assert.ok(maxDeg >= 25 && maxDeg <= 30, 'Front wheel steer angle is within ~25-30 deg: ' + maxDeg);

  // Release steer
  for (let i = 0; i < 60; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(Math.abs(p.steerVisual) < 0.05, 'Front wheels self-center');
}

// 10. Visual feedback: Body roll and pitch
{
  const p = new N.Physics(free, N.Cars[0]);
  // Acceleration squat (pitch < 0)
  for (let i = 0; i < 30; i++) p.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  const pitchAccelDeg = p.pitch * 180 / Math.PI;
  assert.ok(pitchAccelDeg < 0, 'Nose pitches up (squats) on acceleration');
  assert.ok(Math.abs(pitchAccelDeg) >= 1.0 && Math.abs(pitchAccelDeg) <= 3.5, 'Pitch angle is within ~1-3 deg on accel: ' + pitchAccelDeg);

  // Hard brake dive (pitch > 0)
  for (let i = 0; i < 30; i++) p.step({ throttle: 0, brake: 1, steer: 0, drift: false, nitro: false }, 1 / 120);
  const pitchBrakeDeg = p.pitch * 180 / Math.PI;
  assert.ok(pitchBrakeDeg > 0, 'Nose dives on braking');
  assert.ok(pitchBrakeDeg >= 1.0 && pitchBrakeDeg <= 3.5, 'Pitch angle is within ~1-3 deg on brake: ' + pitchBrakeDeg);

  // Cornering body roll
  const pTurn = new N.Physics(free, N.Cars[0]);
  for (let i = 0; i < 300; i++) pTurn.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  for (let i = 0; i < 60; i++) pTurn.step({ throttle: 1, brake: 0, steer: 1, drift: false, nitro: false }, 1 / 120);
  const rollDeg = Math.abs(pTurn.roll * 180 / Math.PI);
  assert.ok(rollDeg >= 2.0 && rollDeg <= 4.5, 'Body roll is within ~2-4 deg during hard cornering: ' + rollDeg);
}

// 11. Strict physics isolation: Visual feedback has ZERO effect on physics state
{
  const pA = new N.Physics(free, N.Cars[0]);
  const pB = new N.Physics(free, N.Cars[0]);
  const input = { throttle: 1, brake: 0, steer: 0.8, drift: false, nitro: false };

  // Artificially alter visual states on pB
  pB.wheelSpin = 999;
  pB.pitch = 50;
  pB.roll = -40;
  pB.steerVisual = 25;

  for (let i = 0; i < 120; i++) {
    pA.step(input, 1 / 120);
    pB.step(input, 1 / 120);
  }

  assert.equal(pA.x, pB.x, 'Physics X is identical');
  assert.equal(pA.z, pB.z, 'Physics Z is identical');
  assert.equal(pA.vx, pB.vx, 'Physics VX is identical');
  assert.equal(pA.vz, pB.vz, 'Physics VZ is identical');
  assert.equal(pA.yaw, pB.yaw, 'Physics yaw is identical');
  assert.equal(pA.speed, pB.speed, 'Physics speed is identical');
}

// 12. Frontal vehicle collision: Normal impulse, speed loss, separation
{
  const track = new N.TrackManager();
  const player = new N.Physics(track, N.Cars[0]);
  const session = new N.RaceSession();
  const ai = new N.RaceAI(track, player, session);
  const rival = ai.rivals[0];

  // Position player directly behind rival closing in at 30 m/s
  player.x = 0; player.z = 0; player.vx = 0; player.vz = 30; player.yaw = 0; player.speed = 30;
  rival.body.x = 0; rival.body.z = 1.5; rival.body.vx = 0; rival.body.vz = 10; rival.body.yaw = 0; rival.body.speed = 10;

  const preRelSpeed = player.vz - rival.body.vz; // 20 m/s impact
  ai.collide();

  // Positional separation
  assert.ok(Math.hypot(rival.body.x - player.x, rival.body.z - player.z) >= 2.19, 'Cars separated to collision radius');
  // Player slowed down, rival pushed forward
  assert.ok(player.vz < 25, 'Player loses forward velocity on rear-end impact: ' + player.vz);
  assert.ok(rival.body.vz > 12, 'Rival is pushed forward by impact: ' + rival.body.vz);
  assert.ok(Number.isFinite(player.speed) && Number.isFinite(rival.body.speed), 'Speeds remain finite');
}

// 13. Side collision: Lateral displacement with minimal center spin
{
  const track = new N.TrackManager();
  const player = new N.Physics(track, N.Cars[0]);
  const session = new N.RaceSession();
  const ai = new N.RaceAI(track, player, session);
  const rival = ai.rivals[0];

  // Hit directly in the flank (dx = 1.8, dz = 0)
  player.x = 0; player.z = 10; player.vx = 8; player.vz = 0; player.yaw = Math.PI / 2;
  rival.body.x = 1.8; rival.body.z = 10; rival.body.vx = 0; rival.body.vz = 20; rival.body.yaw = 0;

  ai.collide();
  // Rival receives lateral velocity along normal
  assert.ok(rival.body.vx > 1.5, 'Rival pushed laterally by side impact: ' + rival.body.vx);
  // Center-of-mass hit produces minimal yaw torque
  assert.ok(Math.abs(rival.body.yawRate) < 0.5, 'Side hit in center produces minimal spin');
}

// 14. Rear-quarter off-center hit (PIT effect)
{
  const track = new N.TrackManager();
  const player = new N.Physics(track, N.Cars[0]);
  const session = new N.RaceSession();
  const ai = new N.RaceAI(track, player, session);
  const rival = ai.rivals[0];

  // Rival facing +Z, player impacts rival's rear-left quarter:
  // dx = -1.2 (left), dz = -1.5 (rear)
  rival.body.x = 0; rival.body.z = 10; rival.body.vx = 0; rival.body.vz = 25; rival.body.yaw = 0; rival.body.yawRate = 0;
  player.x = -1.2; player.z = 8.5; player.vx = 6; player.vz = 25; player.yaw = 0;

  ai.collide();
  // Rear quarter hit induces yaw torque rotating the car
  assert.ok(Math.abs(rival.body.yawRate) > 0.15, 'Rear-quarter hit creates yaw torque: ' + rival.body.yawRate);
  assert.ok(Math.abs(rival.body.yawRate) < 2.5, 'Yaw rate is safely clamped to prevent instant 180 flip');
}

// 15. Mass interaction: Heavy (Vandal V8) vs Light (Spark RS)
{
  const track = new N.TrackManager();
  const heavy = new N.Physics(track, N.Cars.find(c => c.id === 'vandal')); // 1520 kg
  const light = new N.Physics(track, N.Cars.find(c => c.id === 'spark'));  // 1050 kg
  const session = new N.RaceSession();
  const ai = new N.RaceAI(track, heavy, session);
  ai.rivals[0].body = light;

  // Head-on symmetric impact: heavy at +20 m/s, light at -20 m/s
  heavy.x = 0; heavy.z = 0; heavy.vx = 0; heavy.vz = 20;
  light.x = 0; light.z = 1.8; light.vx = 0; light.vz = -20;

  ai.collide();
  const deltaVHeavy = 20 - heavy.vz;
  const deltaVLight = Math.abs(-20 - light.vz);
  assert.ok(deltaVLight > deltaVHeavy, 'Light car suffers larger velocity deflection than heavy car: light=' + deltaVLight.toFixed(2) + ' vs heavy=' + deltaVHeavy.toFixed(2));
}

// 16. Continuous rubbing without jitter explosion
{
  const track = new N.TrackManager();
  const player = new N.Physics(track, N.Cars[0]);
  const session = new N.RaceSession();
  const ai = new N.RaceAI(track, player, session);
  const rival = ai.rivals[0];

  player.x = 0; player.z = 0; player.vx = 0; player.vz = 25;
  rival.body.x = 1.9; rival.body.z = 0; rival.body.vx = 0; rival.body.vz = 25;

  // Continuous contact over 30 consecutive frames
  for (let i = 0; i < 30; i++) {
    ai.collide(1 / 120);
    assert.ok(Number.isFinite(player.vz) && Number.isFinite(rival.body.vz));
    assert.ok(Math.abs(player.vx) < 10, 'No explosive velocity amplification on continuous rub');
  }
}

// 17. Wall collisions: Glancing vs frontal and continuous scrape
{
  const track = new N.TrackManager();
  const p = track.sample(0);

  // Glancing hit: shallow approach angle along track
  const glancing = new N.Physics(track, N.Cars[0]);
  glancing.x = p.x; glancing.z = p.z + 7.95; glancing.yaw = p.yaw;
  glancing.vx = 35.0; glancing.vz = 1.5; glancing.speed = Math.hypot(35, 1.5);
  const preSpeedGlance = glancing.speed;
  glancing.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(glancing.speed > preSpeedGlance * 0.85, 'Glancing wall collision preserves speed: ' + glancing.speed);

  // Frontal wall hit: steep outward approach into barrier
  const frontal = new N.Physics(track, N.Cars[0]);
  frontal.x = p.x; frontal.z = p.z + 7.95; frontal.yaw = p.yaw;
  frontal.vx = 10.0; frontal.vz = 25.0; frontal.speed = Math.hypot(10, 25);
  const preSpeedFront = frontal.speed;
  frontal.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
  assert.ok(frontal.speed < preSpeedFront * 0.70, 'Severe speed loss on direct wall impact: ' + frontal.speed);

  // Wall scrape: continuous contact over 60 frames doesn't immediately stall car to 0
  const scrapeCar = new N.Physics(track, N.Cars[0]);
  scrapeCar.x = p.x; scrapeCar.z = p.z + 8.01; scrapeCar.yaw = p.yaw;
  scrapeCar.vx = 25; scrapeCar.vz = 0; scrapeCar.speed = 25;
  for (let i = 0; i < 60; i++) {
    scrapeCar.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1 / 120);
    assert.ok(Number.isFinite(scrapeCar.speed));
    assert.ok(scrapeCar.speed > 5, 'Car maintains momentum and does not stick dead to the wall: ' + scrapeCar.speed);
  }
}

console.log('PASS all Stage 1, Stage 2 & Stage 3 handling, visual and collision tests');

