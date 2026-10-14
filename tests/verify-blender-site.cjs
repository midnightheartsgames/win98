const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\' + 'Micro' + 'soft\\Edge\\Application\\msedge.exe';

async function runVerification() {
  const edge = spawn(edgePath, [
    '--headless',
    '--remote-debugging-port=9223',
    '--disable-gpu-sandbox',
    '--enable-webgl',
    '--window-size=1200,850',
    'http://localhost:8080/index.html'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2500));
    const list = await new Promise((resolve, reject) => {
      http.get('http://localhost:9223/json', res => {
        let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
      }).on('error', reject);
    });

    const page = list.find(p => p.url.includes('localhost:8080'));
    if (!page) throw new Error('Page not found in Edge targets');

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

    async function captureScreenshot(filepath) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      if (res && res.data) {
        fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
        console.log(`Saved screenshot: ${filepath}`);
      }
    }

    await send('Page.enable');
    await send('DOM.enable');

    console.log('Skipping BIOS POST to Win boot...');
    await evalCode('if (window.biosEngine) window.biosEngine.finishPostInstantly();');
    for (let i = 0; i < 25; i++) {
      const bootVisible = await evalCode('(() => { const bs = document.getElementById("boot-screen"); const ps = document.getElementById("bios-post-screen"); return (bs && bs.style.display !== "none") || (ps && ps.style.display !== "none"); })()');
      if (!bootVisible) break;
      await new Promise(r => setTimeout(r, 400));
    }
    await new Promise(r => setTimeout(r, 1000));

    const initialBlenderIcon = await evalCode('!!document.querySelector(".desktop-icon[data-id=\\"blender\\"]")');
    console.log(`Initial Desktop Blender Icon Present: ${initialBlenderIcon} (Expected: false)`);
    if (initialBlenderIcon) throw new Error('Blender should NOT be on desktop initially!');

    console.log('Opening Internet Explorer to http://www.blender3d.com...');
    await evalCode('window.appIE.open("http://www.blender3d.com");');
    await new Promise(r => setTimeout(r, 1200));

    await captureScreenshot('tests/blender-site.png');

    console.log('Navigating to Download section on Blender website...');
    await evalCode('appIE.navigate(winManager.windows.get("app_ie"), "http://www.blender3d.com/download");');
    await new Promise(r => setTimeout(r, 600));

    console.log('Clicking Blender 1.60 in Previous releases...');
    await evalCode('document.querySelector(".b3d-act[data-act=\\"dl160\\"]")?.click();');
    await new Promise(r => setTimeout(r, 800));

    await captureScreenshot('tests/blender-download.png');

    console.log('Waiting for download to finish...');
    for (let i = 0; i < 15; i++) {
      const runBtn = await evalCode('document.querySelector("[id*=\\"_btn_run\\"]:not([disabled])") !== null');
      if (runBtn) break;
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('Launching Setup Wizard...');
    await evalCode('document.querySelector("[id*=\\"_btn_run\\"]:not([disabled])")?.click();');
    await new Promise(r => setTimeout(r, 800));

    console.log('Setup Wizard: Step 1 -> Next');
    await evalCode('document.querySelector("#wizard_blender .btn-next")?.click();');
    await new Promise(r => setTimeout(r, 500));

    console.log('Setup Wizard: Step 2 -> Install');
    await evalCode('document.querySelector("#wizard_blender .btn-install")?.click();');
    await new Promise(r => setTimeout(r, 2500));

    console.log('Setup Wizard: Step 4 -> Finish');
    await evalCode('document.querySelector("#wizard_blender .btn-finish")?.click();');
    await new Promise(r => setTimeout(r, 1500));

    const afterBlenderIcon = await evalCode('!!document.querySelector(".desktop-icon[data-id=\\"blender\\"]")');
    console.log(`Desktop Blender Icon Present after Setup: ${afterBlenderIcon} (Expected: true)`);
    if (!afterBlenderIcon) throw new Error('Blender MUST be on desktop after installation!');

    const blenderWinOpen = await evalCode('!!document.querySelector("#app_blender")');
    console.log(`Blender Application Window Open: ${blenderWinOpen} (Expected: true)`);

    await captureScreenshot('tests/blender-installed.png');
    console.log('ALL VERIFICATION STEPS PASSED SUCCESSFULLY!');
  } finally {
    edge.kill();
  }
}

runVerification().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
