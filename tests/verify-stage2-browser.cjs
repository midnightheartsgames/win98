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
      await new Promise(r => setTimeout(r, 300));
    }

    // Click QUICK RACE
    await evalCode('document.querySelector("[data-action=\\"front:quick\\"]")?.click()');
    await new Promise(r => setTimeout(r, 300));

    // Choose track
    await evalCode('document.querySelector("[data-action=\\"quick:tracks\\"]")?.click()');
    await new Promise(r => setTimeout(r, 300));

    // Start race
    await evalCode('document.querySelector("[data-action=\\"restart\\"]")?.click()');
    await new Promise(r => setTimeout(r, 500));

    const gameState = await evalCode('game.state');
    console.log('Game state in browser:', gameState);

    // Apply gas and steer right for 1 second in game
    await evalCode('game.controller.keys.add("ArrowUp"); game.controller.keys.add("ArrowRight");');
    await new Promise(r => setTimeout(r, 1000));

    const state = await evalCode('({ glError: game.renderer.gl.getError(), speed: game.physics.speed, wheelSpin: game.physics.wheelSpin, steerVisual: game.physics.steerVisual, pitch: game.physics.pitch, roll: game.physics.roll })');
    console.log('Visual state after driving:', state);

    // Capture screenshot
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot?.data) {
      fs.writeFileSync('tests/stage2-gameplay.png', Buffer.from(shot.data, 'base64'));
      console.log('Saved screenshot to tests/stage2-gameplay.png');
    }

    ws.close();
  } finally {
    edge.kill();
  }
}
test().catch(e => { console.error('Error:', e); process.exit(1); });
