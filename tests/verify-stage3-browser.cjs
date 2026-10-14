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

    // Skip intro slides
    for (let i = 0; i < 3; i++) {
      await evalCode('document.querySelector("[data-action=\\"intro-next\\"]")?.click()');
      await new Promise(r => setTimeout(r, 200));
    }

    // Click QUICK RACE -> track -> restart
    await evalCode('document.querySelector("[data-action=\\"front:quick\\"]")?.click()');
    await new Promise(r => setTimeout(r, 200));
    await evalCode('document.querySelector("[data-action=\\"quick:tracks\\"]")?.click()');
    await new Promise(r => setTimeout(r, 200));
    await evalCode('document.querySelector("[data-action=\\"restart\\"]")?.click()');
    await new Promise(r => setTimeout(r, 400));

    console.log('Game state:', await evalCode('game.state'));

    // 1. Weak touch test:
    const weakTouch = await evalCode(`(() => {
      const rival = game.raceAI.rivals[0];
      game.physics.x = rival.body.x; game.physics.z = rival.body.z - 2.15;
      game.physics.vx = 0; game.physics.vz = 15.5;
      rival.body.vx = 0; rival.body.vz = 14.5;
      game.raceAI.collide(1/120);
      return { speed: game.physics.speed, rivalSpeed: rival.body.speed, d: Math.hypot(rival.body.x - game.physics.x, rival.body.z - game.physics.z) };
    })()`);
    console.log('1. Weak touch:', weakTouch);

    // 2. Side hit test:
    const sideHit = await evalCode(`(() => {
      game.raceAI.contacts.clear();
      const rival = game.raceAI.rivals[0];
      game.physics.x = rival.body.x - 1.8; game.physics.z = rival.body.z;
      game.physics.vx = 10; game.physics.vz = 20; game.physics.yaw = Math.PI / 2;
      rival.body.vx = 0; rival.body.vz = 20; rival.body.yaw = 0;
      game.raceAI.collide(1/120);
      return { rivalVx: rival.body.vx, rivalYawRate: rival.body.yawRate };
    })()`);
    console.log('2. Side hit:', sideHit);

    // 3. Rear-quarter hit (PIT):
    const pitHit = await evalCode(`(() => {
      game.raceAI.contacts.clear();
      const rival = game.raceAI.rivals[0];
      game.physics.x = rival.body.x - 1.2; game.physics.z = rival.body.z - 1.5;
      game.physics.vx = 8; game.physics.vz = 25; game.physics.yaw = 0;
      rival.body.vx = 0; rival.body.vz = 25; rival.body.yaw = 0; rival.body.yawRate = 0;
      game.raceAI.collide(1/120);
      return { rivalYawRate: rival.body.yawRate };
    })()`);
    console.log('3. Rear quarter PIT hit:', pitHit);

    // 4. High speed head-on crash:
    const headOn = await evalCode(`(() => {
      game.raceAI.contacts.clear();
      const rival = game.raceAI.rivals[0];
      game.physics.x = 0; game.physics.z = 0; game.physics.vx = 0; game.physics.vz = 40;
      rival.body.x = 0; rival.body.z = 2.0; rival.body.vx = 0; rival.body.vz = -20;
      const preSpeed = game.physics.speed;
      game.raceAI.collide(1/120);
      return { preSpeed, postSpeed: game.physics.speed, playerVz: game.physics.vz, rivalVz: rival.body.vz };
    })()`);
    console.log('4. High speed crash:', headOn);

    // 5. Glancing wall hit:
    const glance = await evalCode(`(() => {
      const p = game.track.sample(0);
      game.physics.x = p.x; game.physics.z = p.z + 7.95; game.physics.yaw = p.yaw;
      game.physics.vx = 35; game.physics.vz = 1.0; game.physics.speed = Math.hypot(35, 1);
      const pre = game.physics.speed;
      game.physics.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1/120);
      return { pre, post: game.physics.speed, ratio: game.physics.speed / pre };
    })()`);
    console.log('5. Glancing wall hit:', glance);

    // 6. Hard frontal wall hit:
    const hardWall = await evalCode(`(() => {
      const p = game.track.sample(0);
      game.physics.x = p.x; game.physics.z = p.z + 7.95; game.physics.yaw = p.yaw;
      game.physics.vx = 10; game.physics.vz = 30; game.physics.speed = Math.hypot(10, 30);
      const pre = game.physics.speed;
      game.physics.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1/120);
      return { pre, post: game.physics.speed, ratio: game.physics.speed / pre };
    })()`);
    console.log('6. Hard frontal wall hit:', hardWall);

    // 7. Multi-second wall scrape:
    const wallScrape = await evalCode(`(() => {
      const p = game.track.sample(0);
      game.physics.x = p.x; game.physics.z = p.z + 8.01; game.physics.yaw = p.yaw;
      game.physics.vx = 25; game.physics.vz = 0; game.physics.speed = 25;
      for (let i = 0; i < 120; i++) {
        game.physics.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1/120);
      }
      return { speed: game.physics.speed, isFinite: Number.isFinite(game.physics.speed) };
    })()`);
    console.log('7. Multi-second wall scrape:', wallScrape);

    // 8. Repeated contact with same rival:
    const repeatContact = await evalCode(`(() => {
      const rival = game.raceAI.rivals[0];
      game.physics.x = 0; game.physics.z = 0; game.physics.vx = 0; game.physics.vz = 20;
      rival.body.x = 1.9; rival.body.z = 0; rival.body.vx = 0; rival.body.vz = 20;
      let maxDeltaVx = 0;
      for (let i = 0; i < 60; i++) {
        const preVx = game.physics.vx;
        game.raceAI.collide(1/120);
        maxDeltaVx = Math.max(maxDeltaVx, Math.abs(game.physics.vx - preVx));
      }
      return { maxDeltaVx, finalVx: game.physics.vx, isCalm: maxDeltaVx < 5 };
    })()`);
    console.log('8. Repeated rubbing contact:', repeatContact);

    // 9. Recovery after collision:
    const recovery = await evalCode(`(() => {
      for (let i = 0; i < 60; i++) {
        game.physics.step({ throttle: 1, brake: 0, steer: 0, drift: false, nitro: false }, 1/120);
      }
      return { recoveredSpeed: game.physics.speed, glError: game.renderer.gl.getError() };
    })()`);
    console.log('9. Recovery after collision:', recovery);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot?.data) {
      fs.writeFileSync('tests/stage3-collisions.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved screenshot to tests/stage3-collisions.png');
    }

    ws.close();
  } finally {
    edge.kill();
  }
}
test().catch(e => { console.error('Error:', e); process.exit(1); });
