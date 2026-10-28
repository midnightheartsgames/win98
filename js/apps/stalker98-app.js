/**
 * S.T.A.L.K.E.R. 98: Shadow of Chernobyl — Win98 window integration (desktop icon, Start menu, Run dialog,
 * C:\Games\Stalker98\XR98.EXE). The text quest in js/apps/stalker.js is a separate game.
 */
(function (S) {
  'use strict';
  globalThis.appStalker98 = {
    open() {
      const id = 'app_stalker98';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1000, window.innerWidth - 30), h = Math.min(700, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'S.T.A.L.K.E.R. 98: Тень Чернобыля Demo', icon: 'stalker98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new S.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Stalker98 = globalThis.Stalker98 || {});
