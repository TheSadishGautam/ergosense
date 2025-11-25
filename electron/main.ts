import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS } from './ipc';
import { MLEngine } from './mlEngine';
import { FrameMessage } from '../models/types';
import { SENTRY_DSN } from '../models/constants';
import * as Sentry from '@sentry/electron/main';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

Sentry.init({
  dsn: SENTRY_DSN,
});

// The built directory structure
//
// ├─┬─ dist
// │ ├── index.html
// │ ├── assets
// │ └── ...
// ├─┬─ dist-electron
// │ ├── main.js
// │ └── preload.js
//
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public');

let win: BrowserWindow | null;
let tray: Tray | null = null;
let isQuitting = false;

const mlEngine = new MLEngine();

function createTray() {
  const iconPath = path.join(__dirname, '../renderer/src/assets/icon.png'); // Dev path
  // In production, you might need to adjust this path
  const icon = nativeImage.createFromPath(iconPath);
  
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('ErgoSense');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show App', 
      click: () => {
        win?.show();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    win?.show();
  });
}

// Set app name explicitly for macOS menu bar
app.setName('ErgoSense');

function createWindow() {
  const iconPath = path.join(__dirname, '../renderer/src/assets/icon.png');
  
  // Set dock icon for macOS
  if (process.platform === 'darwin') {
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'ErgoSense',
    icon: iconPath, // For Windows/Linux
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Handle close event to minimize to tray
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
      return false;
    }
    return true;
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  // Check for updates
  // Check for updates
  autoUpdater.checkForUpdates();

  autoUpdater.on('update-available', (info) => {
    win?.webContents.send(IPC_CHANNELS.UPDATE_AVAILABLE, info);
  });

  autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send(IPC_CHANNELS.UPDATE_DOWNLOADED, info);
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST || '', 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win?.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  // Setup IPC handlers
  ipcMain.on(IPC_CHANNELS.SEND_FRAME, async (event, frame: FrameMessage) => {
    // Process frame
    const result = await mlEngine.processFrame(frame);
    
    // Send update back to renderer
    if (win && !win.isDestroyed()) {
      win.webContents.send(IPC_CHANNELS.LIVE_STATE_UPDATE, result);
    }
  });

  ipcMain.handle(IPC_CHANNELS.GET_METRICS, (event, type: string, timeWindowMs: number) => {
    return mlEngine.getStore().getMetrics(type, timeWindowMs);
  });

  // Notification settings handlers
  ipcMain.handle(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS, () => {
    return mlEngine.getStore().getNotificationSettings();
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_NOTIFICATION_SETTINGS, (event, settings) => {
    mlEngine.getStore().updateNotificationSettings(settings);
    mlEngine.getNotificationManager().updateSettings(settings);
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.TEST_NOTIFICATION, (event, type) => {
    mlEngine.getNotificationManager().testNotification(type);
    return { success: true };
  });

  // Auto-start handlers
  ipcMain.handle(IPC_CHANNELS.GET_AUTO_START, () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle(IPC_CHANNELS.SET_AUTO_START, (event, enable: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true, // Optional: start hidden
    });
    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle(IPC_CHANNELS.GET_APP_SETTING, (event, key: string) => {
    return mlEngine.getStore().getAppSetting(key);
  });

  ipcMain.handle(IPC_CHANNELS.SET_APP_SETTING, (event, key: string, value: any) => {
    mlEngine.getStore().setAppSetting(key, value);
    return true;
  });
});
