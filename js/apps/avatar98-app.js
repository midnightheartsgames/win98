(function () {
  'use strict';
  const DOCS = ['My Computer', 'C:', 'My Documents'];

  function listSaves() {
    const vfs = window.vfs;
    const folder = vfs && vfs.resolvePath(DOCS);
    if (!folder || !folder.children) return [];
    return Object.keys(folder.children)
      .filter((k) => /\.sav$/i.test(k) && typeof folder.children[k].content === 'string')
      .map((k) => ({ name: k, content: folder.children[k].content }));
  }

  function writeSave(name, content) {
    const vfs = window.vfs;
    if (!vfs || !vfs.writeFile) return false;
    const ok = vfs.writeFile(DOCS, name, content);
    const folder = vfs.resolvePath(DOCS);
    if (ok && folder && folder.children[name]) {
      folder.children[name].icon = 'avatar98';
      folder.children[name].app = 'avatar98save';
      vfs.saveToStorage();
    }
    return ok;
  }

  globalThis.appAvatar98 = {
    open(opts = {}) {
      const id = 'app_avatar98';
      if (window.winManager.windows.has(id)) {
        window.winManager.restoreWindow(id);
        if (opts.importText && this.app) this.app.importText(opts.importText);
        return;
      }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;position:relative;background:#000;';
      const w = Math.min(980, window.innerWidth - 30);
      const h = Math.min(760, window.innerHeight - 60);
      window.winManager.createWindow({
        id, title: 'Аватар: Тихий цикл', icon: 'avatar98', width: w, height: h, x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content: root,
        onClose: () => {
          if (this.app) this.app.destroy();
          this.app = null;
        }
      });
      const lang = window.i18n && window.i18n.getLanguage && window.i18n.getLanguage() === 'en' ? 'en' : 'ru';
      this.app = window.Avatar98.mount(root, {
        lang,
        isActive: () => window.winManager.isTopWindow(id) && document.visibilityState !== 'hidden',
        onExit: () => (window.winManager.closeWindow ? window.winManager.closeWindow(id) : null),
        onExportFile: writeSave,
        listImportFiles: listSaves,
        importText: opts.importText
      });
      root.focus({ preventScroll: true });
    }
  };
})();
