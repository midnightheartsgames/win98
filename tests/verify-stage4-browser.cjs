const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\' + 'Micro' + 'soft\\Edge\\Application\\msedge.exe';

async function test() {
  const edge = spawn(edgePath, [
    '--headless',
    '--remote-debugging-port=9222',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--use-gl=angle',
    'http://localhost:8080/midnight-glide.html'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2000));
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9222/json', res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
      }).on('error', reject);
    });

    const page = list.find(p => p.url.includes('midnight-glide.html'));
    if (!page) throw new Error('Page not found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const msgId = id++;
        const handler = e => {
          const msg = JSON.parse(e.data);
          if (msg.id === msgId) {
            ws.removeEventListener('message', handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    async function evalCode(expr) {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
      return res.result?.value;
    }

    // Advance past intro and start race
    await evalCode(`(() => {
      game.menu.advance();
      game.menu.advance();
      game.menu.advance();
      game.action('restart');
    })()`);
    await new Promise(r => setTimeout(r, 500));

    const state = await evalCode('game.state');
    console.log('Game state:', state);

    // 1. Verify TrafficManager is initialized with vans
    const trafficInfo = await evalCode(`(() => {
      const tm = game.traffic;
      if (!tm) return { error: 'No traffic manager' };
      return {
        count: tm.vehicles.length,
        vehicles: tm.vehicles.map(v => ({
          type: v.type,
          mass: v.mass,
          speed: v.speed,
          laneOffset: v.laneOffset,
          distToPlayer: Math.hypot(v.x - game.physics.x, v.z - game.physics.z)
        }))
      };
    })()`);
    console.log('1. Initial traffic info:', trafficInfo);

    // 2. Test Player ramming a Van directly
    const rearEndImpact = await evalCode(`(() => {
      const tm = game.traffic;
      const van = tm.vehicles[0];
      const player = game.physics;

      // Teleport player right behind van at 32 m/s
      player.x = van.x - Math.sin(van.yaw) * 2.0;
      player.z = van.z - Math.cos(van.yaw) * 2.0;
      player.yaw = van.yaw;
      player.vx = Math.sin(van.yaw) * 32;
      player.vz = Math.cos(van.yaw) * 32;
      player.speed = 32;

      const prePlayerSpeed = player.speed;
      const preVanSpeed = van.speed;

      // Step physics and traffic
      for (let i = 0; i < 5; i++) {
        game.physics.step({ throttle: 1 }, 1/120);
        game.traffic.step(1/120);
      }

      return {
        prePlayerSpeed,
        postPlayerSpeed: player.speed,
        preVanSpeed,
        postVanSpeed: van.speed,
        vanPushedForward: van.speed > preVanSpeed,
        playerLostSpeed: player.speed < prePlayerSpeed
      };
    })()`);
    console.log('2. Rear-end impact test:', rearEndImpact);

    // 3. Test Van recovery after collision
    const vanRecovery = await evalCode(`(() => {
      const van = game.traffic.vehicles[0];
      // Step traffic for 2 seconds (240 steps at 1/120)
      for (let i = 0; i < 240; i++) {
        van.step(1/120);
      }
      return {
        speed: van.speed,
        targetSpeed: van.targetSpeed,
        yawRate: van.yawRate,
        isFinite: Number.isFinite(van.speed) && Number.isFinite(van.x) && Number.isFinite(van.z)
      };
    })()`);
    console.log('3. Van recovery test:', vanRecovery);

    // 4. Test Side Swipe impact against van
    const sideSwipe = await evalCode(`(() => {
      const tm = game.traffic;
      const van = tm.vehicles[1] || tm.vehicles[0];
      const player = game.physics;

      // Teleport player alongside van with lateral velocity
      const nx = Math.cos(van.yaw), nz = -Math.sin(van.yaw);
      player.x = van.x - nx * 1.5;
      player.z = van.z - nz * 1.5;
      player.yaw = van.yaw;
      player.vx = nx * 8 + Math.sin(van.yaw) * 20;
      player.vz = nz * 8 + Math.cos(van.yaw) * 20;
      player.speed = Math.hypot(player.vx, player.vz);

      const prePlayerVx = player.vx;
      game.traffic.collide(1/120);

      return {
        prePlayerVx,
        postPlayerVx: player.vx,
        vanVx: van.vx,
        vanYawRate: van.yawRate
      };
    })()`);
    console.log('4. Side swipe test:', sideSwipe);

    // 5. Test multi-minute lifecycle stability (continuous spawn/despawn cycle)
    const longRun = await evalCode(`(() => {
      const tm = game.traffic;
      const player = game.physics;
      player.vx = Math.sin(player.yaw) * 35;
      player.vz = Math.cos(player.yaw) * 35;
      player.speed = 35;

      const vehicleCounts = [];
      let anyNaN = false;

      // Simulate 800 frames (~7 seconds of intense high-speed driving)
      for (let frame = 0; frame < 800; frame++) {
        player.step({ throttle: 1, steer: 0 }, 1/120);
        game.raceAI.step(1/120);
        tm.step(1/120);

        if (frame % 100 === 0) {
          vehicleCounts.push(tm.vehicles.length);
        }

        for (const v of tm.vehicles) {
          if (!Number.isFinite(v.x) || !Number.isFinite(v.z) || !Number.isFinite(v.speed)) {
            anyNaN = true;
          }
        }
      }

      return {
        vehicleCounts,
        finalCount: tm.vehicles.length,
        anyNaN,
        glError: game.renderer.gl.getError()
      };
    })()`);
    console.log('5. Continuous traffic lifecycle test:', longRun);

    // 6. Test restart race cleans up traffic cleanly
    const restartTest = await evalCode(`(() => {
      const oldCount = game.traffic.vehicles.length;
      game.action('restart');
      const newCount = game.traffic.vehicles.length;
      return {
        oldCount,
        newCount,
        isFresh: game.traffic.vehicles.length >= 3 && game.traffic.vehicles.length <= 5
      };
    })()`);
    console.log('6. Race restart cleanup test:', restartTest);

    // 7. Render frame and take screenshot
    // Position camera near a van to visually inspect in screenshot
    await evalCode(`(() => {
      const van = game.traffic.vehicles[0];
      const p = game.physics;
      p.x = van.x - Math.sin(van.yaw) * 6;
      p.z = van.z - Math.cos(van.yaw) * 6;
      p.yaw = van.yaw;
      game.renderer.render(game.physics, false, false, 1.0, game.raceAI.rivals, game.traffic.vehicles);
    })()`);

    const shot = await send('Page.captureScreenshot');
    if (shot.data) {
      fs.writeFileSync('tests/stage4-traffic.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved screenshot to tests/stage4-traffic.png');
    }

    ws.close();
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  } finally {
    edge.kill();
  }
}

test();
