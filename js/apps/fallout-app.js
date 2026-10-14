(function (FO) {
  'use strict';

  const WIN = { ID: 'app_fallout', TITLE: 'Fallout', ICON: 'fallout', TOP: 10 };
  const SCREEN = { W: 640, H: 480 };
  const DATA_DIR = 'content/Fallout/';
  const RU_DIR = 'content/fallout-ru/';

  globalThis.appFallout = {
    game: null,

    open() {
      const wm = window.winManager;
      if (wm.windows.has(WIN.ID)) {
        wm.restoreWindow(WIN.ID);
        return;
      }
      const root = document.createElement('div');
      root.style.cssText = 'width:100%;height:100%;position:relative;background:#000;';
      const saved = wm.getSavedWindowBounds(WIN.ID);
      const [w, h] = this.size(FO.screenPref(FO.loadPrefs(), 'res'));
      wm.createWindow({
        id: WIN.ID, title: WIN.TITLE, icon: WIN.ICON, width: w + 8, height: h + 30,
        x: Math.max(10, (window.innerWidth - w) / 2), y: WIN.TOP, content: root,
        onClose: () => this.close()
      });
      const win = wm.windows.get(WIN.ID);
      if (win && !saved) this.fit(win.element, root, w, h);
      this.game = new FO.Game(root, {
        debug: false,
        lang: window.i18n && window.i18n.getLanguage() === 'en' ? 'en' : 'ru',
        isActive: () => wm.isTopWindow(WIN.ID),
        onExit: () => wm.closeWindow(WIN.ID),
        onResolution: mode => {
          const shown = wm.windows.get(WIN.ID);
          if (shown && !shown.isMaximized && FO.RESOLUTIONS[mode]) this.fit(shown.element, root, ...this.size(mode));
        },
        start: g => FO.boot(g)
      });
      this.game.el.focus({ preventScroll: true });
      this.game.boot(DATA_DIR, RU_DIR).catch(() => null);
    },

    size(mode) {
      return FO.RESOLUTIONS[mode] || [SCREEN.W, SCREEN.H];
    },

    fit(el, root, w, h) {
      el.style.width = (w + el.offsetWidth - root.clientWidth) + 'px';
      el.style.height = (h + el.offsetHeight - root.clientHeight) + 'px';
    },

    close() {
      if (this.game) this.game.destroy();
      this.game = null;
    }
  };
})(globalThis.FO = globalThis.FO || {});
