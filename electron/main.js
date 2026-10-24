const { app, BrowserWindow, Menu, session, shell } = require('electron');
const path = require('path');
const server = require('../server');

const PREFERRED_PORT = 39898;
const ICON_PATH = path.join(__dirname, 'icon.ico');

let mainWindow = null;

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

function isAppUrl(url, origin) {
  return url === origin || url.startsWith(origin + '/');
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

function askWhereToSave(browserSession) {
  browserSession.on('will-download', (event, item) => {
    item.setSaveDialogOptions({
      title: item.getFilename(),
      defaultPath: path.join(app.getPath('documents'), item.getFilename())
    });
  });
}

function createMainWindow(origin) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 960,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#000000',
    icon: ICON_PATH,
    webPreferences: {
      autoplayPolicy: 'no-user-gesture-required'
    }
  });

  toggleFullScreenOnF11(mainWindow);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url, origin)) {
      return { action: 'allow', overrideBrowserWindowOptions: { icon: ICON_PATH } };
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
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(origin + '/');
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    askWhereToSave(session.defaultSession);
    const port = await startServer();
    createMainWindow(`http://127.0.0.1:${port}`);
  });

  app.on('window-all-closed', () => {
    server.close();
    app.quit();
  });
}
