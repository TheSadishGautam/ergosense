import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS } from './ipc';
import { MLEngine } from './mlEngine';
import { FrameMessage, PostureBaseline } from '../models/types';
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

import { BreakManager } from './services/BreakManager';

let win: BrowserWindow | null;
let tray: Tray | null = null;
let isQuitting = false;

const mlEngine = new MLEngine();
const breakManager = new BreakManager(mlEngine.getStore());

mlEngine.on('calibration-progress', (p: number) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.CALIBRATION_PROGRESS, p);
  }
});
mlEngine.on('calibration-complete', (baseline: PostureBaseline) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.CALIBRATION_COMPLETE, baseline);
  }
});
mlEngine.on('calibration-failed', (reason: string) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send(IPC_CHANNELS.CALIBRATION_FAILED, reason);
  }
});

const getTrustedRendererOrigins = (): string[] => {
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    try {
      return [new URL(devUrl).origin];
    } catch {
      return [];
    }
  }

  // file:// is expected in packaged mode when loading local index.html.
  return ['file://'];
};

const isTrustedSender = (event: IpcMainEvent | IpcMainInvokeEvent): boolean => {
  const senderUrl = event.senderFrame?.url || '';
  if (!senderUrl) return false;

  if (app.isPackaged) {
    return senderUrl.startsWith('file://');
  }

  const trustedOrigins = getTrustedRendererOrigins();
  try {
    const origin = new URL(senderUrl).origin;
    return trustedOrigins.includes(origin);
  } catch {
    return senderUrl.startsWith('file://');
  }
};

const assertTrustedSender = (event: IpcMainEvent | IpcMainInvokeEvent): void => {
  if (isTrustedSender(event)) return;
  throw new Error('Rejected IPC from untrusted renderer origin');
};

const safeHandle = (
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => any
) => {
  ipcMain.handle(channel, (event, ...args) => {
    assertTrustedSender(event);
    return handler(event, ...args);
  });
};

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

  // Open external links in default browser and deny any in-app popup navigation.
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch {
      // Ignore malformed URLs.
    }
    return { action: 'deny' };
  });

  // Keep the app pinned to trusted renderer origin.
  win.webContents.on('will-navigate', (event, targetUrl) => {
    const trustedOrigins = getTrustedRendererOrigins();
    if (app.isPackaged && targetUrl.startsWith('file://')) return;
    try {
      const targetOrigin = new URL(targetUrl).origin;
      if (trustedOrigins.includes(targetOrigin)) return;
    } catch {
      // malformed URL should be blocked
    }
    event.preventDefault();
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
  let isProcessingFrame = false;

  ipcMain.on(IPC_CHANNELS.SEND_FRAME, async (event, frame: FrameMessage) => {
    try {
      assertTrustedSender(event);
    } catch {
      return;
    }

    if (isProcessingFrame) return; // Drop frame if busy
    
    isProcessingFrame = true;
    try {
      // Process frame
      const result = await mlEngine.processFrame(frame);
      
      // Send update back to renderer
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.LIVE_STATE_UPDATE, result);
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      isProcessingFrame = false;
    }
  });

  safeHandle(IPC_CHANNELS.GET_METRICS, (event, type: string, timeWindowMs: number) => {
    return mlEngine.getStore().getMetrics(type, timeWindowMs);
  });

  safeHandle('get-zone-metrics', (event, timeWindowMs: number) => {
    return mlEngine.getStore().getZoneMetrics(timeWindowMs);
  });

  safeHandle('get-monitor-metrics', (event, timeWindowMs: number) => {
    return mlEngine.getStore().getMonitorMetrics(timeWindowMs);
  });


  // Notification settings handlers
  safeHandle(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS, () => {
    return mlEngine.getStore().getNotificationSettings();
  });

  safeHandle(IPC_CHANNELS.UPDATE_NOTIFICATION_SETTINGS, (event, settings) => {
    mlEngine.getStore().updateNotificationSettings(settings);
    mlEngine.getNotificationManager().updateSettings(settings);
    return { success: true };
  });

  safeHandle(IPC_CHANNELS.TEST_NOTIFICATION, (event, type) => {
    mlEngine.getNotificationManager().testNotification(type);
    return { success: true };
  });

  // Auto-start handlers
  safeHandle(IPC_CHANNELS.GET_AUTO_START, () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  safeHandle(IPC_CHANNELS.SET_AUTO_START, (event, enable: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enable,
      openAsHidden: true, // Optional: start hidden
    });
    return true;
  });

  // System Stats Handler
  safeHandle(IPC_CHANNELS.GET_SYSTEM_STATS, async () => {
    const memory = await process.getProcessMemoryInfo();
    const cpu = process.getCPUUsage();
    return {
      memory: Math.round(memory.private / 1024), // Convert KB to MB
      cpu: cpu.percentCPUUsage
    };
  });

  safeHandle(IPC_CHANNELS.GET_APP_SETTING, (event, key: string) => {
    return mlEngine.getStore().getAppSetting(key);
  });

  safeHandle(IPC_CHANNELS.SET_APP_SETTING, (event, key: string, value: any) => {
    mlEngine.getStore().setAppSetting(key, value);
    return true;
  });

  safeHandle(IPC_CHANNELS.START_CALIBRATION, async () => {
    mlEngine.startCalibration();
    return;
  });

  safeHandle(IPC_CHANNELS.CANCEL_CALIBRATION, async () => {
    mlEngine.cancelCalibration();
    return true;
  });

  safeHandle(IPC_CHANNELS.GET_POSTURE_BASELINE, () => {
    return mlEngine.getStore().getPostureBaseline();
  });

  safeHandle(IPC_CHANNELS.SET_POSTURE_BASELINE, (event, baseline) => {
    mlEngine.getStore().setPostureBaseline(baseline);
    return;
  });

  // Break Management Handlers
  safeHandle('get-break-settings', () => {
    return breakManager.getSettings();
  });

  safeHandle('update-break-settings', (event, settings) => {
    breakManager.updateSettings(settings);
    return true;
  });

  safeHandle('snooze-break', () => {
    breakManager.snoozeBreak(10);
    return true;
  });

  safeHandle('skip-break', () => {
    breakManager.skipBreak();
    return true;
  });

  safeHandle('start-break', () => {
    breakManager.startBreak();
    return true;
  });

  safeHandle('end-break', (event, postBreakStrain) => {
    breakManager.endBreak(postBreakStrain);
    return true;
  });

  safeHandle('get-break-stats', (event, days) => {
    return mlEngine.getStore().getBreakStats(days || 7);
  });

  safeHandle('get-break-history-window', (event, timeWindowMs: number) => {
    return mlEngine.getStore().getBreakHistoryInWindow(typeof timeWindowMs === 'number' ? timeWindowMs : 86_400_000);
  });

  safeHandle('get-time-until-break', () => {
    return breakManager.getTimeUntilNextBreak();
  });

  // Connect BreakManager events to renderer
  breakManager.on('countdown-update', (data) => {
    win?.webContents.send('break-countdown-update', data);
  });

  breakManager.on('break-due', (data) => {
    win?.webContents.send('break-due', data);
  });

  breakManager.on('break-warning', (data) => {
    win?.webContents.send('break-warning', data);
  });
});
