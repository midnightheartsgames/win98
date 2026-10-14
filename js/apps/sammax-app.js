(function (S) {
  'use strict';
  globalThis.appSamMax = {
    open() {
      const id = 'app_sammax';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(676, window.innerWidth - 30), h = Math.min(468, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Sam & Max: Culture Shock', icon: 'sammax', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 20, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new S.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.SamMax = globalThis.SamMax || {});
