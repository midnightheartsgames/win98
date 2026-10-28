const { app, BrowserWindow, Menu, ipcMain, session, shell, dialog, net } = require('electron');
const path = require('path');
const server = require('../server');
const { createLauncherHost } = require('./launcher-host');

const PREFERRED_PORT = 39898;
const ICON_PATH = path.join(__dirname, 'icon.ico');
const PRELOAD_PATH = path.join(__dirname, 'preload.js');
const LAUNCHER_PRELOAD = path.join(__dirname, 'launcher-preload.js');
const UPDATE_URL = process.env.WIN98_UPDATE_URL || 'https://pennygachi.men/web98/update/';
const INSTALL_DIR = process.env.WIN98_UPDATE_ROOT || path.dirname(process.execPath);
const DEV = !app.isPackaged && !process.env.WIN98_UPDATE_ROOT;
const DOWNLOAD_PAGE = 'https://pennygachi.men/web98/#download';

let mainWindow = null;
let launcherWindow = null;
let origin = '';
let host = null;
let pendingUpdate = null;
let launcherInfo = {};
let fallbackTimer = null;

function listenOn(port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.off('listening', onListening);
      reject(err);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve(server.address().port);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, '127.0.0.1');
  });
}

async function startServer() {
  try {
    return await listenOn(PREFERRED_PORT);
  } catch (err) {
    if (err.code !== 'EADDRINUSE') throw err;
    return listenOn(0);
  }
}

function isAppUrl(url, base) {
  return url === base || url.startsWith(base + '/');
}

function openOutside(url) {
  if (/^https?:\/\//i.test(url)) shell.openExternal(url);
}

function toggleFullScreenOnF11(win) {
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
}

function answerSystem() {
  ipcMain.handle('win98:capture', async (event) => {
    if (!isAppUrl(event.senderFrame.url, origin)) throw new Error('capture is only for the app');
    const image = await event.sender.capturePage();
    return image.toPNG();
  });
  ipcMain.handle('win98:pending-update', (event) => {
    if (!isAppUrl(event.senderFrame.url, origin)) throw new Error('only for the app');
    return pendingUpdate;
  });
  ipcMain.handle('win98:open-launcher', (event) => {
    if (!mainWindow || event.sender !== mainWindow.webContents) throw new Error('only for the system window');
    reopenLauncher();
    return true;
  });
}

function askWhereToSave(browserSession) {
  browserSession.on('will-download', (event, item) => {
    item.setSaveDialogOptions({
      title: item.getFilename(),
      defaultPath: path.join(app.getPath('documents'), item.getFilename())
    });
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#000000',
    icon: ICON_PATH,
    webPreferences: {
      autoplayPolicy: 'no-user-gesture-required',
      preload: PRELOAD_PATH
    }
  });

  toggleFullScreenOnF11(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url, origin)) {
      return { action: 'allow', overrideBrowserWindowOptions: { icon: ICON_PATH, webPreferences: { preload: PRELOAD_PATH } } };
    }
    openOutside(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url, origin)) return;
    event.preventDefault();
    openOutside(url);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
    if (launcherWindow && !launcherWindow.isDestroyed()) launcherWindow.destroy();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(origin + '/');
}

function startSystem() {
  if (mainWindow) return;
  launcherInfo.autoUpdate = false;
  pendingUpdate = host.pending();
  createMainWindow();
}

function reopenLauncher() {
  if (launcherWindow || !mainWindow) return;
  const system = mainWindow;
  createLauncherWindow({ port: launcherInfo.port, autoUpdate: true });
  launcherWindow.once('ready-to-show', () => {
    if (!system.isDestroyed()) system.destroy();
  });
}

function launcherBroken() {
  if (fallbackTimer) clearTimeout(fallbackTimer);
  fallbackTimer = null;
  if (!launcherWindow || launcherWindow.isDestroyed() || mainWindow) return;
  const win = launcherWindow;
  const updater = host.updater;
  dialog.showMessageBox({
    type: 'warning',
    title: 'Microslop Win 98',
    message: 'Лаунчер не открылся.',
    detail: 'Можно проверить и восстановить файлы Win 98 или запустить систему как есть.',
    buttons: ['Проверить и восстановить', 'Запустить Win 98', 'Выход'],
    defaultId: 0,
    cancelId: 2,
    noLink: true
  }).then(async ({ response }) => {
    if (response === 1) return startSystem();
    if (response === 2) return app.quit();
    try {
      const c = await updater.check({ repair: true, onProgress: p => win.setProgressBar(p.total ? p.done / p.total : 0) });
      if (c.state === 'repair' || c.state === 'update') {
        await updater.download(c, { onProgress: p => win.setProgressBar(p.total ? p.done / p.total : 0) });
        await updater.apply(c);
        return host.relaunch({ version: c.manifest.version, repaired: true });
      }
      await dialog.showMessageBox({ type: 'info', title: 'Microslop Win 98', message: c.state === 'latest' ? 'Файлы в порядке.' : 'Проверить файлы не удалось: ' + (c.error ? c.error.message : c.state), buttons: ['Запустить Win 98'] });
    } catch (err) {
      await dialog.showMessageBox({ type: 'error', title: 'Microslop Win 98', message: 'Восстановить файлы не удалось.', detail: err.message, buttons: ['Запустить Win 98'] });
    }
    startSystem();
  });
}

function createLauncherWindow(info) {
  launcherInfo = info;
  launcherWindow = new BrowserWindow({
    width: 600,
    height: 440,
    useContentSize: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    thickFrame: false,
    show: false,
    backgroundColor: '#c0c0c0',
    icon: ICON_PATH,
    title: 'Microslop Win 98',
    webPreferences: { preload: LAUNCHER_PRELOAD }
  });
  launcherWindow.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });
  launcherWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith(origin + '/electron/launcher/')) return;
    event.preventDefault();
  });
  launcherWindow.webContents.on('did-fail-load', () => launcherBroken());
  launcherWindow.once('ready-to-show', () => launcherWindow.show());
  launcherWindow.on('close', event => {
    if (host.applying) event.preventDefault();
  });
  launcherWindow.on('closed', () => {
    launcherWindow = null;
    host.abort();
  });
  fallbackTimer = setTimeout(launcherBroken, 10000);
  launcherWindow.loadURL(origin + '/electron/launcher/index.html');
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = mainWindow || launcherWindow;
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    askWhereToSave(session.defaultSession);
    const port = await startServer();
    origin = `http://127.0.0.1:${port}`;
    launcherInfo = { port };
    answerSystem();
    host = createLauncherHost({
      app, ipcMain, shell, net,
      product: 'win98',
      installDir: INSTALL_DIR,
      updateUrl: UPDATE_URL,
      dev: DEV,
      window: () => launcherWindow,
      start: startSystem,
      onReady: () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = null;
      },
      initInfo: () => ({
        port: launcherInfo.port,
        portBusy: launcherInfo.port !== PREFERRED_PORT,
        downloadPage: DOWNLOAD_PAGE,
        recovered: launcherInfo.recovered || null,
        after: launcherInfo.after || null,
        autoUpdate: !!launcherInfo.autoUpdate
      })
    });
    host.register();
    const { recovered, after } = await host.boot();
    if (after && after.start) return startSystem();
    if (host.settings.skipLauncher && !DEV && !recovered && !after) {
      const c = await host.quickCheck();
      if (!['update', 'full'].includes(c.state)) return startSystem();
    }
    createLauncherWindow({ port, recovered, after });
  });

  app.on('window-all-closed', () => {
    server.close();
    app.quit();
  });
}
