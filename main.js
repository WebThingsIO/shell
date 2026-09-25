/**
 * WebThings Shell.
 * 
 * Main script starts system chrome.
 */
const {app, BrowserWindow, WebContentsView, ipcMain} = require('electron');
const path = require('path');

let mainWindow;
const browserViews = new Map();
const viewIdsByWebContentsId = new Map();

function sendViewEvent(id, type, details = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('browser-view:event', {id, type, ...details});
  }
}

function createBrowserView(id, url) {
  if (browserViews.has(id)) {
    return;
  }

  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, 'chrome/js/browser-view-preload.js')
    }
  });
  browserViews.set(id, view);
  viewIdsByWebContentsId.set(view.webContents.id, id);
  mainWindow.contentView.addChildView(view);

  view.webContents.on('will-navigate', (event, navigationUrl) => {
    sendViewEvent(id, 'will-navigate', {url: navigationUrl});
  });
  view.webContents.on('did-navigate', (event, navigationUrl) => {
    sendViewEvent(id, 'did-navigate', {url: navigationUrl});
  });
  view.webContents.on('did-navigate-in-page', (event, navigationUrl, isMainFrame) => {
    sendViewEvent(id, 'did-navigate-in-page', {url: navigationUrl, isMainFrame});
  });
  view.webContents.on('did-start-loading', () => sendViewEvent(id, 'did-start-loading'));
  view.webContents.on('did-stop-loading', () => sendViewEvent(id, 'did-stop-loading'));
  view.webContents.on('did-finish-load', () => sendViewEvent(id, 'did-finish-load'));
  view.webContents.on('page-favicon-updated', (event, favicons) => {
    sendViewEvent(id, 'page-favicon-updated', {favicons});
  });
  view.webContents.on('page-title-updated', (event, title) => {
    sendViewEvent(id, 'page-title-updated', {title});
  });
  view.webContents.setWindowOpenHandler(({url: newUrl}) => {
    mainWindow.webContents.send('shell:new-window-requested', {url: newUrl});
    return {action: 'deny'};
  });
  view.webContents.on('destroyed', () => {
    viewIdsByWebContentsId.delete(view.webContents.id);
    browserViews.delete(id);
  });

  if (process.env.SHELL_ENV === 'development') {
    view.webContents.once('dom-ready', () => view.webContents.openDevTools());
  }
  view.webContents.loadURL(url).catch(console.error);
}

ipcMain.on('browser-view:create', (event, id, url) => createBrowserView(id, url));
ipcMain.on('browser-view:bounds', (event, id, bounds) => {
  const view = browserViews.get(id);
  if (!view || view.webContents.isDestroyed()) {
    return;
  }
  view.setBounds(bounds);
});
ipcMain.on('browser-view:destroy', (event, id) => {
  const view = browserViews.get(id);
  if (!view) {
    return;
  }
  mainWindow.contentView.removeChildView(view);
  view.webContents.close();
});
ipcMain.on('browser-view:manifest', (event, manifestUrl, crossOrigin) => {
  const id = viewIdsByWebContentsId.get(event.sender.id);
  if (id) {
    sendViewEvent(id, 'ipc-message', {
      channel: 'manifest',
      args: [manifestUrl, crossOrigin]
    });
  }
});
ipcMain.handle('browser-view:call', async (event, id, method, args = []) => {
  const view = browserViews.get(id);
  if (!view || view.webContents.isDestroyed()) {
    throw new Error('Browser view is no longer available');
  }

  const {webContents} = view;
  switch (method) {
    case 'loadURL':
      return webContents.loadURL(args[0]);
    case 'goBack':
      if (webContents.canGoBack()) webContents.goBack();
      return;
    case 'stop':
      webContents.stop();
      return;
    case 'reload':
      webContents.reload();
      return;
    case 'executeJavaScript':
      return webContents.executeJavaScript(args[0]);
    case 'capturePage':
      return (await webContents.capturePage()).toDataURL();
    default:
      throw new Error(`Unsupported browser view method: ${method}`);
  }
});

function start() {
  // Create the main window
  mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load system chrome into main window
  console.log('Starting system chrome...');
  mainWindow.loadURL('file://' + path.join(__dirname, 'chrome/index.html'));

  if (process.env.SHELL_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.on('ready', start);