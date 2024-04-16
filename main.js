/**
 * WebThings Shell.
 * 
 * Main script starts system chrome.
 */
 const {app, BrowserWindow} = require('electron');
 const path = require('path');

 function start() {
    // Create the main window
    const mainWindow = new BrowserWindow({
      fullscreen: true,
      webPreferences: {
        nodeIntegration: true,
        webviewTag: true,
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