class AppUpdateNotice {
  constructor() {
    this.trayEl = null;
    this.info = null;
    window.addEventListener('load', () => setTimeout(() => this.check(), 15000));
  }

  L(ru, en) {
    return window.i18n && window.i18n.getLanguage() === 'en' ? en : ru;
  }

  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  version(v) {
    return v && v.version ? v.version + (v.build ? ' (' + v.build + ')' : '') : '';
  }

  async check() {
    const native = window.win98Native;
    if (!native || typeof native.pendingUpdate !== 'function') return;
    try {
      this.info = await native.pendingUpdate();
    } catch (err) {
      this.info = null;
    }
    if (this.info && this.info.remote) this.showTray();
  }

  showTray() {
    const tb = window.taskbar;
    if (!tb || !tb.trayEl || this.trayEl) return;
    const el = document.createElement('div');
    el.className = 'tray-icon un-tray';
    el.innerHTML = Icons['win-update'];
    el.title = this.L('Доступно обновление Win 98 ', 'Win 98 update available: ') + this.version(this.info.remote);
    el.addEventListener('click', () => this.open());
    tb.trayEl.insertBefore(el, tb.clockEl);
    this.trayEl = el;
  }

  hideTray() {
    if (this.trayEl) this.trayEl.remove();
    this.trayEl = null;
  }

  open() {
    const info = this.info;
    if (!info || !window.winManager) return;
    const full = info.state === 'full';
    const lines = [
      '<b>' + this.esc(this.L('Доступна версия Win 98 ', 'Win 98 version available: ') + this.version(info.remote)) + '</b>',
      info.title ? this.esc(info.title) + (info.summary ? '. ' + this.esc(info.summary) : '') : '',
      full
        ? this.esc(this.L('Эта версия меняет саму программу: архив Win98.zip нужно скачать заново. Сохранения останутся.', 'This version changes the program itself: Win98.zip has to be downloaded again. Saves stay.'))
        : this.esc(this.L('Чтобы обновиться, Win 98 завершит работу и откроет лаунчер. Сохраните документы и игры.', 'To update, Win 98 will shut down and open the launcher. Save your documents and games first.'))
    ].filter(Boolean);
    window.winManager.openDialog({
      title: this.L('Обновление Win 98', 'Win 98 Update'),
      icon: 'win-update',
      width: 400,
      message: lines.join('<br><br>'),
      buttons: [
        { text: full ? this.L('Страница загрузки', 'Download page') : this.L('Обновить сейчас', 'Update now'), primary: true, onClick: () => (full ? window.open('https://pennygachi.men/web98/#download') : this.updateNow()) },
        { text: this.L('Позже', 'Later'), onClick: null }
      ]
    });
  }

  updateNow() {
    this.hideTray();
    const shutdown = window.appShutdown;
    if (!shutdown || typeof shutdown.executeAction !== 'function') {
      window.win98Native.openLauncher();
      return;
    }
    shutdown.triggerSafeToTurnOff = function () {
      delete shutdown.triggerSafeToTurnOff;
      window.win98Native.openLauncher();
    };
    shutdown.executeAction('shutdown');
  }
}

window.appUpdateNotice = new AppUpdateNotice();
