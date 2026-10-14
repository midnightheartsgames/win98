(function (K) {
  'use strict';
  globalThis.appKotor98 = {
    open() {
      const id = 'app_kotor98';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(960, window.innerWidth - 30), h = Math.min(720, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Star Wars: Knights of the Old Republic 98', icon: 'kotor98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new K.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
