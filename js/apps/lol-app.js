/**
 * League of Legends 98 — Win98 window integration (desktop icon, Start menu, Run dialog, C:\Games\LoL\LOL.EXE).
 */
(function (L) {
  'use strict';
  globalThis.appLoL = {
    open() {
      const id = 'app_lol';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1000, window.innerWidth - 30), h = Math.min(780, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'League of Legends 98', icon: 'lol', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new L.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.LoL98 = globalThis.LoL98 || {});
