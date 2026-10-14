/**
 * Win 98 Blue Screen of Death (BSOD) Easter Egg
 * Authentic full-screen text-mode crash screen.
 */
class AppBSOD {
  constructor() {
    this.overlay = null;
    this.isOpen = false;
    this.initDOM();
    this.initShortcut();
  }

  initDOM() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'bsod-screen';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #0000aa;
      color: #ffffff;
      font-family: "Courier New", monospace;
      font-size: 14px;
      line-height: 1.5;
      display: none;
      z-index: 1000000;
      cursor: none;
      user-select: none;
      padding: 10% 15%;
      box-sizing: border-box;
    `;

    this.overlay.innerHTML = `
      <div style="background:#aaaaaa; color:#0000aa; display:inline-block; padding:0 8px; font-weight:bold; margin-bottom:18px;">
        Win
      </div>

      <p style="margin-bottom:18px;">
        A fatal exception 0E has occurred at 0028:C0011E36 in VXD VMM(01) + 00010E36.<br>
        The current application will be terminated.
      </p>

      <p style="margin-bottom:18px;">
        *  Press any key to terminate the current application.<br>
        *  Press CTRL+ALT+DEL again to restart your computer. You will<br>
        &nbsp;&nbsp;&nbsp;lose any unsaved information in all applications.
      </p>

      <div style="text-align:center; margin-top:40px; font-weight:bold;">
        Press any key to continue <span id="bsod-cursor">_</span>
      </div>
    `;

    document.body.appendChild(this.overlay);

    window.addEventListener('keydown', (e) => {
      if (this.isOpen) {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      }
    }, true);

    this.overlay.addEventListener('click', () => {
      if (this.isOpen) this.hide();
    });
  }

  initShortcut() {
    window.addEventListener('keydown', (e) => {
      // Ctrl + Alt + Shift + B triggers BSOD
      if (e.ctrlKey && e.altKey && e.shiftKey && e.code === 'KeyB') {
        e.preventDefault();
        this.trigger();
      }
    });
  }

  trigger() {
    this.isOpen = true;
    this.overlay.style.display = 'block';
    if (window.soundSys) window.soundSys.playError();
    if (window.appClippy) window.appClippy.onBSOD(true);
  }

  hide() {
    this.isOpen = false;
    this.overlay.style.display = 'none';
    if (window.soundSys) window.soundSys.playClick();
    if (window.appClippy) window.appClippy.onBSOD(false);
  }
}

window.appBSOD = new AppBSOD();

