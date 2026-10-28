(function (root) {
  const ru = () => !root.i18n || root.i18n.getLanguage() === 'ru';
  const L = (r, e) => (ru() ? r : e);

  function gameOf(winId) {
    const cat = root.gameManager && root.gameManager.catalog;
    if (!cat || !winId) return null;
    const base = winId.replace(/^app_/, '');
    const id = cat[base] ? base : cat[base + '_demo'] ? base + '_demo' : null;
    if (!id) return null;
    const entry = cat[id];
    const installed = root.gameManager.isInstalled ? !!root.gameManager.isInstalled(id) : null;
    return { id, base, title: entry.title, installed, source: entry.cdDemo ? 'cd' : entry.steam ? 'steam' : 'system' };
  }

  function media(el) {
    if (!el || !el.querySelectorAll) return {};
    const canvases = Array.from(el.querySelectorAll('canvas')).filter(c => c.width && c.height).slice(0, 6).map(c => [c.width, c.height]);
    const out = {};
    if (canvases.length) out.canvases = canvases;
    const doc = root.document;
    if (doc.pointerLockElement && el.contains(doc.pointerLockElement)) out.pointerLock = true;
    if (doc.fullscreenElement) out.fullscreen = true;
    const mixer = root.systemMixer;
    if (mixer && mixer.buses && mixer.buses.size) {
      const states = {};
      mixer.buses.forEach(bus => {
        const state = bus.context && bus.context.state;
        if (state) states[state] = (states[state] || 0) + 1;
      });
      out.audio = states;
    }
    return out;
  }

  const ADAPTERS = [
    {
      match: id => id === 'app_explorer',
      where: () => {
        const path = ((root.appExplorer && root.appExplorer.currentPath) || []).join('\\');
        return { summary: L('Проводник', 'Explorer') + ': ' + path, details: { path } };
      }
    },
    {
      match: id => id === 'app_ie',
      where: () => {
        const url = root.appIE ? root.appIE.currentUrl : '';
        return { summary: 'Internet Explorer: ' + url, details: { url } };
      }
    },
    {
      match: id => id === 'app_netscape',
      where: () => {
        const url = root.appNetscape ? root.appNetscape.currentUrl : '';
        return { summary: 'Netscape: ' + url, details: { url } };
      }
    },
    {
      match: id => id.startsWith('steam_'),
      where: (id, win) => {
        const steam = root.appSteam;
        const gameId = id.replace(/^steam_(details|buy)_/, '') !== id ? id.replace(/^steam_(details|buy)_/, '') : steam && steam.selectedGameId;
        const game = gameId && root.gameManager && root.gameManager.catalog[gameId];
        return { summary: 'Steam: ' + win.title + (game && game.title !== win.title ? ' (' + game.title + ')' : ''), details: { steamWindow: id, game: gameId || '' } };
      }
    },
    {
      match: id => id === 'app_hsr98',
      where: () => {
        const ui = (root.appHsr98 && root.appHsr98.ui) || root.hsrui;
        if (ui && typeof ui.bugInfo === 'function') return ui.bugInfo();
        if (!ui) return null;
        const top = ui.screens && ui.screens.length ? ui.screens[ui.screens.length - 1] : null;
        return { summary: 'Honkai: Star Rail 98 > ' + ui.mode + (top && top.name ? ' > ' + top.name : ''), details: { mode: ui.mode, screens: (ui.screens || []).map(s => s.name || '?') } };
      }
    }
  ];

  function describe(winId) {
    const wm = root.winManager;
    if (!winId || !wm || !wm.windows.has(winId)) {
      const tb = root.taskbar;
      const startOpen = !!(tb && tb.startMenu && tb.startMenu.classList.contains('open'));
      return { summary: L('Рабочий стол', 'Desktop') + (startOpen ? L(', открыто меню «Пуск»', ', Start menu open') : ''), window: '', app: 'desktop', details: { startMenu: startOpen } };
    }
    const win = wm.windows.get(winId);
    const game = gameOf(winId);
    const result = { summary: win.title, window: winId, app: game ? game.id : winId, details: {} };
    const adapter = ADAPTERS.find(a => a.match(winId));
    let found = null;
    if (adapter) {
      try { found = adapter.where(winId, win); } catch (err) { result.details.adapterError = String(err.message || err); }
    }
    if (found) {
      result.summary = found.summary || result.summary;
      Object.assign(result.details, found.details || {});
      if (found.state) result.state = found.state;
    } else if (game && win.title !== game.title) {
      result.summary = game.title + ' > ' + win.title;
    }
    if (game) result.details.game = game;
    Object.assign(result.details, media(win.element));
    return result;
  }

  function saveComponent(winId) {
    const cat = root.BackupCatalog;
    if (!cat || !winId) return null;
    const base = winId.replace(/^app_/, '');
    const game = gameOf(winId);
    const ids = ['game_' + base];
    if (game) ids.push('game_' + game.id, 'game_' + game.id.replace(/_demo$/, ''));
    for (const id of ids) {
      const c = cat.byId(id);
      if (c && c.id !== 'other') return c;
    }
    return null;
  }

  function hsrUi() {
    return (root.appHsr98 && root.appHsr98.ui) || root.hsrui || null;
  }

  function liveSave(winId) {
    if (winId !== 'app_hsr98') return null;
    const ui = hsrUi();
    const data = ui && typeof ui.bugSave === 'function' ? ui.bugSave() : null;
    return data ? { hsr98: data } : null;
  }

  function applyLive(winId, live) {
    if (winId !== 'app_hsr98' || !live || !live.hsr98) return false;
    const ui = hsrUi();
    return !!(ui && typeof ui.bugLoad === 'function' && ui.bugLoad(live.hsr98));
  }

  root.BugWhere = { describe, saveComponent, gameOf, liveSave, applyLive, ADAPTERS };
})(window);
