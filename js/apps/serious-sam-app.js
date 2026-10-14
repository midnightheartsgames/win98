/**
 * Serious Sam 98 — Win98 window integration (desktop icon, Start menu, Run dialog, C:\Games\SeriousSam\SAM.EXE).
 */
(function (S) {
  'use strict';
  globalThis.appSeriousSam = {
    open() {
      const id = 'app_serioussam';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(960, window.innerWidth - 30), h = Math.min(680, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Serious Sam 98', icon: 'serioussam', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new S.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
