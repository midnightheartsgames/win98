(function (S) {
  'use strict';
  globalThis.appSims3 = {
    open() {
      const id = 'app_sims3';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;position:relative;';
      const w = Math.min(1100, window.innerWidth - 30), h = Math.min(760, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'The Sims 3', icon: 'sims3', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new S.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Sims3 = globalThis.Sims3 || {});
