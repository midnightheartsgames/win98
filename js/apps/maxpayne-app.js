(function (M) {
  'use strict';
  globalThis.appMaxPayne = {
    open() {
      const id = 'app_maxpayne';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;position:relative;';
      const w = Math.min(1180, window.innerWidth - 30), h = Math.min(800, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Max Payne Demo', icon: 'maxpayne', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new M.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      if (this.ui.el) this.ui.el.focus({ preventScroll: true });
    }
  };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
