(function (Q) {
  'use strict';
  globalThis.appQuake3 = {
    open() {
      const id = 'app_quake3';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(1024, window.innerWidth - 30), h = Math.min(768, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Quake III Arena', icon: 'quake3', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new Q.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
    }
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
