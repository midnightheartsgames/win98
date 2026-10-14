(function (B) {
  'use strict';
  globalThis.appBlender204 = {
    open(filePath) {
      const id = 'app_blender204';
      const wm = window.winManager;
      if (wm.windows.has(id)) {
        wm.restoreWindow(id);
        if (filePath && this.app) this.load(filePath);
        return;
      }
      const root = document.createElement('div');
      root.className = 'b204-root';
      const w = Math.min(1018, window.innerWidth - 20), h = Math.min(790, window.innerHeight - 50);
      const hadBounds = !!(wm.getSavedWindowBounds && wm.getSavedWindowBounds(id));
      wm.createWindow({
        id, title: 'Blender', icon: 'blender204', width: w, height: h, minWidth: 480, minHeight: 360,
        x: Math.max(4, (window.innerWidth - w) / 2), y: 4, content: root,
        onClose: () => { if (this.app) this.app.destroy(); this.app = null; }
      });
      if (!hadBounds && window.innerWidth <= 1400) wm.toggleMaximize(id);
      this.app = new B.App(root, {
        isActive: () => wm.isTopWindow(id),
        onQuit: () => wm.closeWindow(id),
        onFocus: () => { if (!wm.isTopWindow(id) && wm.bringToTop) wm.bringToTop(id); }
      });
      if (filePath) this.load(filePath);
      this.app.canvas.focus({ preventScroll: true });
    },
    load(filePath) {
      if (typeof filePath === 'string') B.FileOps.loadPath(this.app, filePath);
      else if (filePath && filePath.name) B.FileOps.loadParts(this.app, filePath.dir, filePath.name);
    }
  };
})(globalThis.B204 = globalThis.B204 || {});
