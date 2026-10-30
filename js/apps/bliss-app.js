(function (B) {
  'use strict';
  const WIN_ID = 'app_bliss';
  const t = (k, ...a) => (window.i18n ? window.i18n.t(k, ...a) : k);

  globalThis.appBliss = {
    game: null,
    open() {
      const wm = window.winManager;
      if (wm.windows.has(WIN_ID)) { wm.restoreWindow(WIN_ID); wm.bringToTop(WIN_ID); return; }
      const content = document.createElement('div');
      content.className = 'bliss-window';
      content.innerHTML = `
        <div class="win-menubar">
          <div class="win-menu-item">
            ${t('bliss.menuGame')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" data-cmd="new">${t('bliss.menuNew')} <span>F2</span></div>
              <div class="win-dropdown-option" data-cmd="album">${t('bliss.menuAlbum')} <span>Esc</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="sound">${t('bliss.menuSound')} <span>M</span></div>
              <div class="win-dropdown-option" data-cmd="hud">${t('bliss.menuHud')} <span>H</span></div>
              <div class="win-dropdown-option" data-cmd="maximize">${t('bliss.menuMaximize')} <span>F</span></div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="exit">${t('bliss.menuExit')}</div>
            </div>
          </div>
          <div class="win-menu-item">
            ${t('bliss.menuHelp')}
            <div class="win-menu-dropdown">
              <div class="win-dropdown-option" data-cmd="howto">${t('bliss.menuHowTo')}</div>
              <div class="win-menu-separator"></div>
              <div class="win-dropdown-option" data-cmd="about">${t('bliss.menuAbout')}</div>
            </div>
          </div>
        </div>
        <div class="bliss-stage"></div>`;
      const w = Math.min(960, window.innerWidth - 30), h = Math.min(660, window.innerHeight - 60);
      wm.createWindow({
        id: WIN_ID, title: t('app.bliss'), icon: 'bliss', width: w, height: h, minWidth: 420, minHeight: 320,
        x: Math.max(10, (window.innerWidth - w) / 2), y: 10, content,
        onClose: () => { if (this.game) this.game.destroy(); this.game = null; }
      });
      content.addEventListener('click', (e) => {
        const option = e.target.closest('[data-cmd]');
        if (option) this.command(option.dataset.cmd);
      });
      this.game = B.start(content.querySelector('.bliss-stage'), {
        isActive: () => wm.isTopWindow(WIN_ID),
        isMinimized: () => { const win = wm.windows.get(WIN_ID); return !win || win.isMinimized; },
        toggleMaximize: () => wm.toggleMaximize(WIN_ID)
      });
    },
    command(cmd) {
      const wm = window.winManager, game = this.game;
      if (cmd === 'exit') wm.closeWindow(WIN_ID);
      else if (cmd === 'maximize') wm.toggleMaximize(WIN_ID);
      else if (cmd === 'howto') wm.openDialog({ title: t('bliss.menuHowTo'), icon: 'bliss', message: t('bliss.howToText'), width: 440 });
      else if (cmd === 'about') wm.openDialog({ title: t('bliss.aboutTitle'), icon: 'bliss', message: t('bliss.aboutText') });
      else if (!game || !game.R) return;
      else if (cmd === 'new') game.newFlight();
      else if (cmd === 'album') game.showAlbum();
      else if (cmd === 'sound') game.toggleSound();
      else if (cmd === 'hud') game.toggleHud();
    }
  };
})(globalThis.Bliss = globalThis.Bliss || {});
