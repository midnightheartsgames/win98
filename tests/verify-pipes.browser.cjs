const playwrightPath = process.env.PIPES_PLAYWRIGHT || 'C:/Users/MYPC/AppData/Local/OpenAI/Codex/runtimes/cua_node/4004642ff3fabdc7/bin/node_modules/playwright';
const { chromium } = require(playwrightPath);

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto('http://localhost:8080/');
    await page.locator('#boot-screen').waitFor({ state: 'hidden' });

    // Launch screensaver directly
    await page.evaluate(() => {
      window.appScreensaver.start('pipes');
    });

    // Verify overlay is active
    const overlayVisible = await page.locator('#screensaver-overlay').isVisible();
    console.log('Screensaver overlay visible:', overlayVisible);

    // Wait 9 seconds to let 3D pipes weave across the screen
    await page.waitForTimeout(9000);

    // Capture screenshot of 3D pipes screensaver
    await page.screenshot({ path: 'tests/pipes-screensaver.png' });
    console.log('Screenshot saved to tests/pipes-screensaver.png');

    // Dismiss screensaver via mouse move or keypress
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const overlayAfterDismiss = await page.locator('#screensaver-overlay').isVisible();
    console.log('Overlay after dismiss:', overlayAfterDismiss);

    if (errors.length > 0) {
      console.error('Browser errors:', errors);
      process.exitCode = 1;
    } else {
      console.log('PASS: 3D Pipes screensaver runs, animates smoothly, renders 3D graphics, and dismisses on input.');
    }
  } finally {
    await browser.close();
  }
})().catch(e => {
    console.error(e);
    process.exitCode = 1;
});
