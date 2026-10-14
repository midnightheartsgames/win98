(function (S) {
  'use strict';
  globalThis.appSamMax105 = {
    open() {
      const id = 'app_sammax105';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(676, window.innerWidth - 30), h = Math.min(468, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Sam & Max: Reality 2.0', icon: 'sammax105', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 20, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new S.UI(root, {
        ep: S.EP105,
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.SamMax = globalThis.SamMax || {});
