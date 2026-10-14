(function (W) {
  'use strict';
  globalThis.appWolf3D = {
    open() {
      const id = 'app_wolf3d';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;';
      const w = Math.min(680, window.innerWidth - 30), h = Math.min(540, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Wolfenstein 3D', icon: 'wolf3d', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new W.UI(root, {
        isActive: () => window.winManager.isTopWindow(id),
        onExit: () => window.winManager.closeWindow ? window.winManager.closeWindow(id) : null
      });
      root.focus({ preventScroll: true });
    }
  };
})(globalThis.Wolf3D = globalThis.Wolf3D || {});
