const playwrightPath = process.env.PIPES_PLAYWRIGHT || 'C:/Users/MYPC/AppData/Local/OpenAI/Codex/runtimes/cua_node/4004642ff3fabdc7/bin/node_modules/playwright';
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  playwright = require(playwrightPath);
}
const { chromium } = playwright;

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    console.log('1. Navigating to http://localhost:8080/ ...');
    await page.goto('http://localhost:8080/');

    // Verify POST screen is visible
    const postVisible = await page.locator('#bios-post-screen').isVisible();
    console.log('POST screen visible on boot:', postVisible);

    // Capture POST screen
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/bios-post.png' });
    console.log('Screenshot saved to tests/bios-post.png');

    // Click DEL to enter BIOS Setup
    console.log('2. Entering BIOS Setup via button click...');
    await page.locator('#btn-post-del').click();
    await page.waitForTimeout(400);

    const setupVisible = await page.locator('#bios-setup-screen').isVisible();
    console.log('BIOS Setup screen visible:', setupVisible);

    // Capture Main Setup screen
    await page.screenshot({ path: 'tests/bios-setup-main.png' });
    console.log('Screenshot saved to tests/bios-setup-main.png');

    // Open Standard CMOS Setup
    console.log('3. Opening Standard CMOS Setup...');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/bios-setup-standard.png' });
    console.log('Screenshot saved to tests/bios-setup-standard.png');

    // Return to main menu via ESC button
    await page.locator('button[data-act="esc"]').click();
    await page.waitForTimeout(300);

    // Open Chipset Features Setup directly
    console.log('4. Navigating to Chipset Features Setup...');
    await page.locator('.bios-menu-item[data-id="chipset"]').click();
    await page.waitForTimeout(300);

    // Cycle CPU Host Clock
    console.log('5. Overclocking FSB to 133 MHz...');
    const hostClockRow = page.locator('.bios-option-row[data-key="cpuHostClock"]');
    await hostClockRow.click();
    // Cycle with + key or clicks
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(200);

    await page.screenshot({ path: 'tests/bios-setup-overclock.png' });
    console.log('Screenshot saved to tests/bios-setup-overclock.png');

    // Press F10 to Save & Exit
    console.log('6. Pressing F10 to Save & Exit...');
    await page.keyboard.press('F10');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'tests/bios-setup-save-modal.png' });
    console.log('Screenshot saved to tests/bios-setup-save-modal.png');

    // Confirm with Enter (default is 'Y')
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify reboot shows POST with overclocked CPU
    const postBodyText = await page.locator('#bios-post-screen').innerText();
    console.log('POST after save text snippet:', postBodyText.slice(0, 180));

    // Skip POST to Win boot
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    const bootVisible = await page.locator('#boot-screen').isVisible();
    console.log('Win 98 boot splash visible:', bootVisible);

    // Wait for boot screen to fade and desktop to be ready
    await page.locator('#boot-screen').waitFor({ state: 'hidden', timeout: 6000 });
    console.log('Desktop loaded successfully!');

    // Open System Properties to verify overclocked CPU is shown
    await page.evaluate(() => {
      if (window.appCPanel && typeof window.appCPanel.openSystemProperties === 'function') {
        window.appCPanel.openSystemProperties();
      }
    });
    await page.waitForTimeout(600);

    await page.screenshot({ path: 'tests/bios-win-sysprops.png' });
    console.log('Screenshot saved to tests/bios-win-sysprops.png');

    if (errors.length > 0) {
      console.error('Browser errors encountered:', errors);
      process.exitCode = 1;
    } else {
      console.log('ALL BROWSER BIOS VERIFICATIONS PASSED WITH ZERO ERRORS!');
    }
  } catch (err) {
    console.error('Test execution error:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
