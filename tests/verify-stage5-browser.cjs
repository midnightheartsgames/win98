const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\' + 'Micro' + 'soft\\Edge\\Application\\msedge.exe';

async function test() {
  console.log('--- Starting Stage 5 Browser Verification ---');
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

    async function takeScreenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filename, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
    }

    // Reset localStorage before test
    await evalCode(`localStorage.removeItem('midnight-camera')`);

    // Advance past intro and start race
    await evalCode(`(() => {
      game.menu.advance();
      game.menu.advance();
      game.menu.advance();
      game.action('restart');
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const state = await evalCode('game.state');
    console.log('1. Game state:', state);

    // Accelerate car forward for 1.5s to establish visual speed & road context
    await evalCode(`(() => {
      for (let i = 0; i < 90; i++) {
        game.physics.step({ up: true, down: false, left: false, right: false, handbrake: false, nitro: false }, 1/60);
      }
    })()`);
    await new Promise(r => setTimeout(r, 400));

    // 2. Verify Default Mode (Chase - 0)
    const initialCam = await evalCode(`(() => {
      const cam = game.renderer.camera;
      return {
        mode: cam.mode,
        modeName: cam.modes[cam.mode],
        fov: cam.fov,
        eyeY: cam.eye[1],
        speed: game.physics.speed
      };
    })()`);
    console.log('2. Default camera state:', initialCam);
    if (initialCam.mode !== 0) throw new Error(`Expected mode 0, got ${initialCam.mode}`);

    await takeScreenshot('tests/stage5-chase.png');

    // 3. Switch to Mode 1 (Hood) via KeyC keydown dispatch
    await evalCode(`(() => {
      game.root.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', bubbles: true }));
    })()`);
    await new Promise(r => setTimeout(r, 300));

    const hoodCam = await evalCode(`(() => {
      const cam = game.renderer.camera;
      return {
        mode: cam.mode,
        modeName: cam.modes[cam.mode],
        fov: cam.fov,
        eyeY: cam.eye[1],
        storageVal: localStorage.getItem('midnight-camera')
      };
    })()`);
    console.log('3. Hood camera state:', hoodCam);
    if (hoodCam.mode !== 1) throw new Error(`Expected mode 1 (hood), got ${hoodCam.mode}`);
    if (hoodCam.storageVal !== 'hood') throw new Error(`Expected localStorage "hood", got ${hoodCam.storageVal}`);
    if (Math.abs(hoodCam.eyeY - 1.10) > 0.15) throw new Error(`Expected hood eye height ~1.10m, got ${hoodCam.eyeY}`);

    await takeScreenshot('tests/stage5-hood.png');

    // 4. Switch to Mode 2 (Bumper) via KeyC
    await evalCode(`(() => {
      game.root.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', bubbles: true }));
    })()`);
    await new Promise(r => setTimeout(r, 300));

    const bumperCam = await evalCode(`(() => {
      const cam = game.renderer.camera;
      return {
        mode: cam.mode,
        modeName: cam.modes[cam.mode],
        fov: cam.fov,
        eyeY: cam.eye[1],
        storageVal: localStorage.getItem('midnight-camera')
      };
    })()`);
    console.log('4. Bumper camera state:', bumperCam);
    if (bumperCam.mode !== 2) throw new Error(`Expected mode 2 (bumper), got ${bumperCam.mode}`);
    if (bumperCam.storageVal !== 'bumper') throw new Error(`Expected localStorage "bumper", got ${bumperCam.storageVal}`);
    if (Math.abs(bumperCam.eyeY - 0.42) > 0.15) throw new Error(`Expected bumper eye height ~0.42m, got ${bumperCam.eyeY}`);

    await takeScreenshot('tests/stage5-bumper.png');

    // 5. Cycle back to Mode 0 (Chase) via KeyC
    await evalCode(`(() => {
      game.root.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyC', bubbles: true }));
    })()`);
    await new Promise(r => setTimeout(r, 200));

    const cycledCam = await evalCode(`(() => {
      const cam = game.renderer.camera;
      return {
        mode: cam.mode,
        storageVal: localStorage.getItem('midnight-camera')
      };
    })()`);
    console.log('5. Cycled back to Chase:', cycledCam);
    if (cycledCam.mode !== 0) throw new Error(`Expected mode 0, got ${cycledCam.mode}`);
    if (cycledCam.storageVal !== 'chase') throw new Error(`Expected localStorage "chase", got ${cycledCam.storageVal}`);

    // 6. Test LocalStorage Persistence Across Reload
    console.log('6. Testing persistence across page reload with Hood mode...');
    await evalCode(`(() => {
      game.renderer.setCameraMode(1); // Set to Hood
    })()`);
    // Reload page
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 2000));

    // Start race again
    const restoredCam = await evalCode(`(() => {
      game.menu.advance();
      game.menu.advance();
      game.menu.advance();
      game.action('restart');
      return {
        mode: game.renderer.camera.mode,
        modeName: game.renderer.camera.modes[game.renderer.camera.mode]
      };
    })()`);
    console.log('Restored camera mode on fresh load:', restoredCam);
    if (restoredCam.mode !== 1) throw new Error(`Expected restored mode 1 (hood), got ${restoredCam.mode}`);

    // 7. Test Collision Trauma & Decay in Live Loop
    console.log('7. Testing collision impact trauma and decay...');
    const traumaTest = await evalCode(`(() => {
      const cam = game.renderer.camera;
      const initialTrauma = cam.trauma;

      // Simulate a 16 m/s wall impact
      game.physics.lastWallImpact = 16.0;

      // Update renderer frame
      game.renderer.camera.update(game.physics, 1/60, performance.now() / 1000);
      const postImpactTrauma = cam.trauma;

      // Decay over 15 frames (~0.25s)
      for (let i = 0; i < 15; i++) {
        game.renderer.camera.update(game.physics, 1/60, performance.now() / 1000 + i * 0.016);
      }
      const decayedTrauma = cam.trauma;

      return {
        initialTrauma,
        postImpactTrauma,
        decayedTrauma
      };
    })()`);
    console.log('Trauma test results:', traumaTest);
    if (traumaTest.postImpactTrauma <= 0.3) throw new Error('Trauma did not trigger properly on impact');
    if (traumaTest.decayedTrauma >= traumaTest.postImpactTrauma) throw new Error('Trauma did not decay over time');

    // 8. Verify Zero Physics Glitches when Switching at Speed
    console.log('8. Verifying zero physics glitches on camera toggle...');
    const physicsCheck = await evalCode(`(() => {
      const p = game.physics;
      p.speed = 35.0;
      p.vx = 20.0;
      p.vz = 25.0;
      p.yaw = 0.5;
      const before = { x: p.x, z: p.z, vx: p.vx, vz: p.vz, speed: p.speed, yaw: p.yaw };

      // Cycle camera 3 times
      game.action('cam');
      game.action('cam');
      game.action('cam');

      const after = { x: p.x, z: p.z, vx: p.vx, vz: p.vz, speed: p.speed, yaw: p.yaw };
      return { before, after };
    })()`);
    console.log('Physics check:', physicsCheck);
    for (const key of ['x', 'z', 'vx', 'vz', 'speed', 'yaw']) {
      if (physicsCheck.before[key] !== physicsCheck.after[key]) {
        throw new Error(`Physics parameter ${key} changed on camera switch!`);
      }
    }

    console.log('\n--- ALL BROWSER CDP TESTS FOR STAGE 5 PASSED SUCCESSFULLY! ---');
  } finally {
    edge.kill();
  }
}

test().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
