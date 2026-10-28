const { app, BrowserWindow, Menu, ipcMain, shell, net } = require('electron');
const path = require('path');
const { createLauncherHost } = require('./launcher-host');

const ICON_PATH = path.join(__dirname, 'icon.ico');
const LAUNCHER_PRELOAD = path.join(__dirname, 'launcher-preload.js');
const UPDATE_URL = process.env.SR98_UPDATE_URL || 'https://pennygachi.men/web98/update/';
const INSTALL_DIR = process.env.SR98_UPDATE_ROOT || path.dirname(process.execPath);
const DEV = !app.isPackaged && !process.env.SR98_UPDATE_ROOT;
const DOWNLOAD_PAGE = 'https://pennygachi.men/web98/sr98/#/download';

let launcherWindow = null;
let gameWindow = null;
let host = null;
let launcherInfo = {};

function openOutside(url) {
  if (/^https?:\/\//i.test(url)) shell.openExternal(url);
}

function guard(win, allowed) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (allowed(url)) return;
    event.preventDefault();
    openOutside(url);
  });
}

function startGame() {
  if (gameWindow) return;
  const b = host.settings.gameBounds || {};
  gameWindow = new BrowserWindow({
    width: b.width || 1280,
    height: b.height || 960,
    x: b.x,
    y: b.y,
    minWidth: 640,
    minHeight: 480,
    show: false,
    backgroundColor: '#000000',
    icon: ICON_PATH,
    title: 'Star Rail 98',
    webPreferences: { autoplayPolicy: 'no-user-gesture-required' }
  });
  guard(gameWindow, url => url.startsWith('file:') && url.includes('/play/'));
  gameWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      gameWindow.setFullScreen(!gameWindow.isFullScreen());
      event.preventDefault();
    }
  });
  gameWindow.once('ready-to-show', () => {
    if (b.maximized) gameWindow.maximize();
    gameWindow.show();
    if (launcherWindow && !launcherWindow.isDestroyed()) launcherWindow.destroy();
  });
  gameWindow.on('close', () => {
    host.settings.gameBounds = Object.assign(gameWindow.getNormalBounds(), { maximized: gameWindow.isMaximized() });
    host.save();
  });
  gameWindow.on('closed', () => {
    gameWindow = null;
  });
  gameWindow.loadFile(path.join(__dirname, 'play', 'index.html'));
}

function createLauncherWindow(info) {
  launcherInfo = info;
  launcherWindow = new BrowserWindow({
    width: 800,
    height: 600,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    thickFrame: false,
    show: false,
    backgroundColor: '#0b0f26',
    icon: ICON_PATH,
    title: 'Star Rail 98',
    webPreferences: { preload: LAUNCHER_PRELOAD }
  });
  guard(launcherWindow, url => url.startsWith('file:') && url.includes('/launcher/'));
  launcherWindow.once('ready-to-show', () => launcherWindow.show());
  launcherWindow.on('close', event => {
    if (host.applying) event.preventDefault();
  });
  launcherWindow.on('closed', () => {
    launcherWindow = null;
    host.abort();
  });
  launcherWindow.loadFile(path.join(__dirname, 'launcher', 'index.html'));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = gameWindow || launcherWindow;
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    host = createLauncherHost({
      app, ipcMain, shell, net,
      product: 'sr98',
      installDir: INSTALL_DIR,
      updateUrl: UPDATE_URL,
      dev: DEV,
      window: () => launcherWindow,
      start: startGame,
      initInfo: () => ({
        downloadPage: DOWNLOAD_PAGE,
        recovered: launcherInfo.recovered || null,
        after: launcherInfo.after || null
      })
    });
    host.register();
    const { recovered, after } = await host.boot();
    if (after && after.start) return startGame();
    if (host.settings.skipLauncher && !DEV && !recovered && !after) {
      const c = await host.quickCheck();
      if (!['update', 'full'].includes(c.state)) return startGame();
    }
    createLauncherWindow({ recovered, after });
  });

  app.on('window-all-closed', () => app.quit());
}
