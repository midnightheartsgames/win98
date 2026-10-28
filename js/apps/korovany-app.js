(function (K) {
  'use strict';
  globalThis.appKorovany = {
    open() {
      const id = 'app_korovany';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(960, window.innerWidth - 30), h = Math.min(680, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Корованы Demo', icon: 'korovany', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 12, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new K.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Korovany = globalThis.Korovany || {});
