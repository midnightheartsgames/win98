/**
 * Diablo 98 — Win98 window integration (Start menu, desktop icon, Run dialog, store install).
 */
(function (D) {
  'use strict';
  globalThis.appDiablo = {
    open() {
      const id = 'app_diablo';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(980, window.innerWidth - 30), h = Math.min(760, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Diablo', icon: 'diablo', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new D.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
    }
  };
})(globalThis.Diablo98 = globalThis.Diablo98 || {});
