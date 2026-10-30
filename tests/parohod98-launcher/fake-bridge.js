(function () {
  'use strict';
  const sc = window.P98_SCENARIO || {};
  const S = JSON.parse(JSON.stringify(sc.state || {}));
  const calls = window.P98_CALLS = [];
  const ui = (fn, ...args) => setTimeout(() => window.parohod98ui && window.parohod98ui[fn] && window.parohod98ui[fn](...args), 0);
  if (sc.language) Object.defineProperty(navigator, 'language', { get: () => sc.language });
  if (sc.webgl2 === false) {
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
      return kind === 'webgl2' ? null : real.call(this, kind, ...rest);
    };
  }
  if (sc.textZoom) {
    document.addEventListener('DOMContentLoaded', () => {
      for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { continue; }
        const walk = list => {
          for (const r of list) {
            if (r.cssRules) walk(r.cssRules);
            if (!r.style) continue;
            const fs = r.style.fontSize;
            if (fs && fs.endsWith('px')) r.style.fontSize = (parseFloat(fs) * sc.textZoom) + 'px';
            const font = r.style.font;
            if (font) {
              const m = /(\d+(?:\.\d+)?)px/.exec(font);
              if (m) r.style.fontSize = (parseFloat(m[1]) * sc.textZoom) + 'px';
            }
          }
        };
        walk(rules);
      }
    });
  }
  const log = (name, ...args) => calls.push([name].concat(args));
  const game = id => (S.games[id] = S.games[id] || {});
  window.Parohod98 = {
    state: () => JSON.stringify(S),
    device: () => JSON.stringify(sc.device || { memory: { totalMB: 7600 }, webview: 'com.google.android.webview 155.0.7700.0' }),
    memory: () => JSON.stringify((sc.device && sc.device.memory) || { totalMB: 7600 }),
    lastCrash: () => sc.crash || '',
    notes: () => JSON.stringify(sc.notes || {}),
    check: () => log('check'),
    network: () => S.network,
    notifications: () => sc.notifications || 'granted',
    askNotifications: () => { log('askNotifications'); ui('notifications', true); },
    download: (id, parts, mode) => {
      log('download', id, parts, mode);
      if (sc.askOnMobile && !mode) return ui('ask', id, parts, sc.askOnMobile);
      const e = S.catalog.games[id];
      game(id).job = { version: e.version, parts: parts ? parts.split(',') : [], paused: false, wifi: mode === 'wifi', error: null, detail: null, done: 0, total: e.download, ready: false };
      ui('state', id, 'queued', '');
    },
    pause: id => { log('pause', id); game(id).job.paused = true; ui('state', id, 'paused', ''); },
    resume: id => { log('resume', id); game(id).job.paused = false; game(id).job.error = null; ui('state', id, 'queued', ''); },
    cancel: id => { log('cancel', id); delete game(id).job; ui('state', id, 'cancelled', ''); },
    remove: id => { log('remove', id); delete game(id).installed; ui('state', id, 'removed', ''); },
    removePart: (id, part) => { log('removePart', id, part); game(id).installed.parts = []; ui('state', id, 'ready', ''); },
    verify: id => { log('verify', id); ui('state', id, 'verifying', ''); setTimeout(() => ui('verified', id, '[]'), 50); },
    setChannel: name => { log('setChannel', name); S.channel = name; },
    setMobile: mode => { log('setMobile', mode); S.mobile = mode; },
    saveFile: (name, text) => { log('saveFile', name, text); ui('fileSaved', true); },
    openFile: () => { log('openFile'); ui('fileOpened', sc.fileText === undefined ? 'none' : 'ok'); },
    takeFile: () => sc.fileText || '',
    downloadApk: () => log('downloadApk'),
    cancelApk: () => log('cancelApk'),
    installApk: () => log('installApk'),
    openInstallSettings: () => log('openInstallSettings'),
    openLink: url => log('openLink', url),
    play: (id, q) => log('play', id, q),
    vibrate: ms => log('vibrate', ms)
  };
})();
