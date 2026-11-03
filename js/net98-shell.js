(function (root) {
  'use strict';
  const NET_ROOT = 'Network Neighborhood', TICK_MS = 3000, LIST_EVERY_MS = 10000, GAME_ID = 'hsr98';
  const STATUS_KEYS = new Set(['title', 'express', 'battle', 'su', 'desk', 'visit']);
  const tr = (key, ...args) => (root.i18n ? root.i18n.t(key, ...args) : key);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pcName = text => String(text == null ? '' : text).toUpperCase().replace(/[^0-9A-ZА-ЯЁ_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 15) || 'PC';
  const link = (netAct, name, o) => Object.assign({ type: 'action', action: 'net98', icon: 'hsr98', netAct, name }, o);
  let trayEl = null, trayInvite = null, deskSent = false, listAt = -Infinity;

  function storedPcName() {
    try { return root.localStorage.getItem('win98_net_compname') || 'ADMIN-PC'; } catch (err) { return 'ADMIN-PC'; }
  }

  function statusNote(status) {
    if (!status) return '';
    if (status.c === 'hd') return tr('net98.st.hd', Number(status.w) || 1);
    if (status.c === 'map') return tr('net98.st.map');
    return STATUS_KEYS.has(status.c) ? tr('net98.st.' + status.c) : '';
  }

  function myComputer(n) {
    const uid = n.uid(), name = pcName(storedPcName()), profile = tr('net98.myProfile'), friends = tr('net98.friends'), howTo = tr('net98.howTo');
    return [name, {
      type: 'special', name, icon: 'network-pc', comment: esc(tr('net98.thisPc', uid)),
      children: {
        [profile]: link('myProfile', profile),
        [friends]: link('friends', friends),
        [howTo]: { type: 'file', name: howTo, icon: 'file-txt', app: 'notepad', content: tr('net98.howToText', uid) }
      }
    }];
  }

  function friendComputer(n, row, key) {
    const profile = tr('net98.profile'), express = tr('net98.express'), rubezh = tr('net98.rubezh');
    const table = (n.tables || []).find(t => t.hostUid === row.uid), kids = { [profile]: link('friendProfile', profile, { uid: row.uid }), [express]: link('visit', express, { uid: row.uid }) };
    if (table) kids[rubezh] = link('table', rubezh, { code: table.code, sim: table.sim });
    return { type: 'special', name: key, icon: 'network-pc', comment: esc(tr('net98.friendNote', row.uid, statusNote(row.status))), children: kids };
  }

  function tablesFolder(n) {
    const name = tr('net98.tables'), kids = {};
    for (const t of n.tables || []) {
      if (!/^[0-9A-Z]{4}$/.test(String(t.code))) continue;
      const key = tr('net98.tableName', t.code, pcName(t.host));
      kids[key] = link('table', key, { code: t.code, sim: t.sim, comment: esc(tr('net98.tableNote', t.host, tr('net98.diff.' + t.diff), Number(t.seats) || 0)) });
    }
    return [name, { type: 'special', name, icon: 'network-group', comment: esc(tr('net98.tablesNote')), children: kids }];
  }

  function children() {
    const n = root.Net98;
    if (!n) return {};
    if (!n.hasConsent()) {
      const name = tr('net98.connect');
      return { [name]: link('connect', name, { icon: 'dialup', comment: esc(tr('net98.connectNote')) }) };
    }
    const out = {}, [myKey, mine] = myComputer(n);
    out[myKey] = mine;
    if (n.state !== 'online' || !n.friends) {
      const name = tr('net98.unavailable');
      out[name] = link('connect', name, { icon: 'dialup', comment: tr('network.msg') });
      return out;
    }
    for (const row of n.friends.list) {
      if (!row.on) continue;
      const base = pcName(row.name), key = out[base] ? base + '-' + row.uid : base;
      out[key] = friendComputer(n, row, key);
    }
    const [tablesKey, tables] = tablesFolder(n);
    out[tablesKey] = tables;
    return out;
  }

  function note() {
    const n = root.Net98;
    return n && n.hasConsent() && n.state !== 'online' ? tr('network.msg').replace(/<br>/g, ' ') : '';
  }

  function dialog(message, icon) {
    if (root.winManager) root.winManager.openDialog({ title: tr('net98.consentTitle'), icon: icon || 'info', message });
  }

  function openGame(fn) {
    const gm = root.gameManager;
    if (gm && !gm.isInstalled(GAME_ID)) { gm.showInSteam(GAME_ID); return false; }
    if (!root.appHsr98) return false;
    root.appHsr98.open();
    const ui = root.appHsr98.ui;
    if (!ui) return false;
    if ((!ui.game || ui.mode === 'title') && !ui.loadGame(ui.latestSlot())) { dialog(tr('net98.noSave')); return false; }
    fn(ui);
    return true;
  }

  function friendRow(uid) {
    const n = root.Net98, F = n && n.friends;
    return F ? F.list.find(r => r.uid === uid) || null : null;
  }

  function run(item) {
    const n = root.Net98, H = root.Hsr98;
    switch (item.netAct) {
      case 'connect':
        if (root.appDialUp) { root.appDialUp.selectEther(); root.appDialUp.open(); }
        return;
      case 'myProfile':
        openGame(ui => ui.openProfile());
        return;
      case 'friends':
        openGame(ui => ui.openFriends(0));
        return;
      case 'friendProfile': {
        const row = friendRow(item.uid);
        if (row) openGame(ui => ui.openFriendProfile(row));
        return;
      }
      case 'visit': {
        const row = friendRow(item.uid);
        if (row) openGame(ui => ui.visitGo(row));
        return;
      }
      case 'table':
        if (H && H.HD && item.sim && item.sim !== H.HD.SIM) { dialog(tr('net98.otherVersion'), 'warning'); return; }
        if (n) openGame(ui => ui.netInviteAccept({ kind: 'table', code: item.code }));
        return;
      default:
    }
  }

  function fingerprint() {
    return JSON.stringify(children());
  }

  function hideTray() {
    if (trayEl) trayEl.remove();
    trayEl = null;
    trayInvite = null;
  }

  function showTray(inv) {
    const tb = root.taskbar;
    if (trayInvite === inv || !tb || !tb.trayEl || !root.document) return;
    hideTray();
    const el = root.document.createElement('div');
    el.className = 'tray-icon un-tray';
    el.innerHTML = root.Icons && root.Icons.hsr98 ? root.Icons.hsr98 : '';
    el.title = tr(inv.kind === 'visit' ? 'net98.inviteVisit' : 'net98.inviteTable', inv.name);
    el.addEventListener('click', () => {
      hideTray();
      openGame(ui => ui.netInviteAccept(inv));
    });
    tb.trayEl.insertBefore(el, tb.clockEl);
    trayEl = el;
    trayInvite = inv;
    if (root.soundSys && root.soundSys.playDing) root.soundSys.playDing();
  }

  function tick() {
    const n = root.Net98;
    if (!n || !n.hasConsent() || n.state !== 'online') { deskSent = false; hideTray(); return; }
    const at = root.performance.now(), explorer = root.appExplorer, wm = root.winManager;
    if (explorer && explorer.currentPath && explorer.currentPath[0] === NET_ROOT && wm && wm.windows.has('app_explorer') && at - listAt >= LIST_EVERY_MS) {
      listAt = at;
      n.send('tableList');
    }
    if (root.appHsr98 && root.appHsr98.ui) { deskSent = false; hideTray(); return; }
    if (!deskSent && n.send('status', { s: { c: 'desk' } })) deskSent = true;
    const inv = n.activeInvites()[0];
    if (inv) showTray(inv); else hideTray();
  }

  root.Net98Shell = { children, note, run, fingerprint, tick, openGame };
  if (root.document && root.setInterval) {
    const timer = root.setInterval(tick, TICK_MS);
    if (timer && timer.unref) timer.unref();
  }
  if (root.addEventListener) root.addEventListener('net98-changed', tick);
})(globalThis);
