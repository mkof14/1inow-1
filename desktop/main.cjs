const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Auto-update from GitHub Releases. Only runs in packaged production builds.
// Reads `build.publish` from package.json — no extra config needed.
if (app.isPackaged) {
  try {
    const { updateElectronApp, UpdateSourceType } = require('update-electron-app');
    updateElectronApp({
      updateInterval: '1 hour',
      logger: console,
      // Defaults to GitHub provider from electron-builder publish config.
    });
  } catch (err) {
    console.error('[auto-update] disabled:', err && err.message);
  }
}

const APP_URL = process.env.ONEINOW_URL || 'https://1inow.lovable.app';

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0B1220',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(APP_URL);

  // Open external links in the default browser, keep app links inside.
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const u = new URL(url);
      const appHost = new URL(APP_URL).host;
      if (u.host !== appHost) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    } catch {}
    return { action: 'allow' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});