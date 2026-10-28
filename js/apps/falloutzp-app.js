(function (Z) {
  'use strict';
  globalThis.appFalloutZP = {
    open() {
      const id = 'app_falloutzp';
      if (window.winManager.windows.has(id)) { window.winManager.restoreWindow(id); return; }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;position:relative;';
      const w = Math.min(1200, window.innerWidth - 30), h = Math.min(820, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Fallout: Запорожье Demo', icon: 'falloutzp', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => { if (this.ui) this.ui.destroy(); this.ui = null; }
      });
      this.ui = new Z.UI(root, {});
      if (this.ui.el) this.ui.el.focus({ preventScroll: true });
    }
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
