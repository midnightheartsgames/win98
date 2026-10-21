(function (H) {
  'use strict';
  globalThis.appHomm1 = {
    open() {
      const id = 'app_homm1';
      if (window.winManager && window.winManager.windows && window.winManager.windows.has(id)) {
        window.winManager.restoreWindow(id);
        return;
      }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;';
      const canvas = document.createElement('canvas');
      canvas.id = 'homm1-canvas';
      canvas.width = H.W || 640;
      canvas.height = H.H || 480;
      canvas.style.cssText = 'width:100%;height:100%;object-fit:contain;image-rendering:pixelated;display:block;';
      root.appendChild(canvas);

      const w = Math.min(668, window.innerWidth - 30);
      const h = Math.min(528, window.innerHeight - 60);
      window.winManager.createWindow({
        id,
        title: 'Heroes of Might and Magic 98',
        icon: 'homm1',
        width: w,
        height: h,
        x: Math.max(10, Math.floor((window.innerWidth - w) / 2)),
        y: 12,
        content: root,
        onClose: () => {
          if (this.ui) this.ui.destroy();
          this.ui = null;
        }
      });

      this.ui = new H.GameUI(canvas);
      this.ui.startLoop();
      canvas.focus({ preventScroll: true });
    }
  };
})(globalThis.HoMM1 = globalThis.HoMM1 || {});
