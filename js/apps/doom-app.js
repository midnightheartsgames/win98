/**
 * Doom 98 — Win98 window integration (desktop icon, Start menu, Run dialog, C:\Games\Doom\DOOM.EXE).
 */
(function (D) {
  'use strict';
  globalThis.appDoom = {
    open() {
      const id = 'app_doom';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(820, window.innerWidth - 30), h = Math.min(650, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'DOOM 98', icon: 'doom', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new D.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Doom98 = globalThis.Doom98 || {});
