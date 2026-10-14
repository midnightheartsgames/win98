(function (AW) {
  'use strict';
  globalThis.appAnotherWar = {
    open() {
      const id = 'app_anotherwar';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;position:relative;';
      const w = Math.min(840, window.innerWidth - 30), h = Math.min(668, window.innerHeight - 50);
      window.winManager.createWindow({
        id, title: 'Another War', icon: 'anotherwar', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new AW.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      if (this.ui.el) this.ui.el.focus({ preventScroll: true });
    }
  };
})(globalThis.AW = globalThis.AW || {});
