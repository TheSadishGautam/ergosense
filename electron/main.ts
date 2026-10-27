import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, shell, IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import path from 'node:path';
import { IPC_CHANNELS } from './ipc';
import { MLEngine } from './mlEngine';
import { FrameMessage, PostureBaseline } from '../models/types';
import { SENTRY_DSN } from '../models/constants';
import * as Sentry from '@sentry/electron/main';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { getAppIconPath } from './appIcon';

const APP_ID = 'com.sadishgautam.ergosense';
const HIDDEN_LAUNCH_ARG = '--hidden';

// Must run before anything reads app.getPath('userData') (MetricStore below).
app.setName('ErgoSense');

if (process.platform === 'win32') {
  // Windows drops toast notifications unless this matches the installer shortcut's AppUserModelID.
  app.setAppUserModelId(APP_ID);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

log.transports.file.level = 'info';
autoUpdater.logger = log;

Sentry.init({
  dsn: SENTRY_DSN,
});

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

function showWindow() {
  if (!win || win.isDestroyed()) {
    createWindow();
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function createTray() {
  const icon = nativeImage.createFromPath(getAppIconPath());
  if (icon.isEmpty()) {
    log.warn('Tray icon not found at', getAppIconPath());
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('ErgoSense');
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show App',
      click: showWindow,
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
  
  // Windows users expect a single click on the tray icon to restore the app.
  tray.on('click', showWindow);
  tray.on('double-click', showWindow);
}

function createWindow({ startHidden = false } = {}) {
  const iconPath = getAppIconPath();

  if (process.platform === 'darwin') {
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'ErgoSense',
    icon: iconPath,
    show: !startHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
      return false;
    }
    return true;
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:') {
        shell.openExternal(url);
      }
    } catch {
      void 0;
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, targetUrl) => {
    const trustedOrigins = getTrustedRendererOrigins();
    if (app.isPackaged && targetUrl.startsWith('file://')) return;
    try {
      const targetOrigin = new URL(targetUrl).origin;
      if (trustedOrigins.includes(targetOrigin)) return;
    } catch {
      void 0;
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

// A second launch (e.g. clicking the Start menu shortcut while hidden in the tray) focuses this instance.
app.on('second-instance', showWindow);

app.on('before-quit', () => {
  isQuitting = true;
});

const sendToWindow = (channel: string, data: unknown) => {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data);
  }
};

function setupAutoUpdater() {
  // Portable builds and dev runs have no update feed.
  if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_DIR) return;

  autoUpdater.on('update-available', (info) => sendToWindow(IPC_CHANNELS.UPDATE_AVAILABLE, info));
  autoUpdater.on('update-downloaded', (info) => sendToWindow(IPC_CHANNELS.UPDATE_DOWNLOADED, info));
  autoUpdater.on('error', (err) => log.warn('Auto-update error:', err));
  autoUpdater.checkForUpdates().catch((err) => log.warn('Update check failed:', err));
}

const clampTimeWindow = (value: unknown, fallback = 86_400_000): number => {
  const MAX_WINDOW_MS = 366 * 86_400_000;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(value, MAX_WINDOW_MS);
};

app.whenReady().then(() => {
  createWindow({ startHidden: process.argv.includes(HIDDEN_LAUNCH_ARG) });
  createTray();
  setupAutoUpdater();

  let isProcessingFrame = false;

  ipcMain.on(IPC_CHANNELS.SEND_FRAME, async (event, frame: FrameMessage) => {
    try {
      assertTrustedSender(event);
    } catch {
      return;
    }

    if (isProcessingFrame) return;
    
    isProcessingFrame = true;
    try {
      const result = await mlEngine.processFrame(frame);
      
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
    return mlEngine.getStore().getMetrics(String(type), clampTimeWindow(timeWindowMs));
  });

  safeHandle('get-zone-metrics', (event, timeWindowMs: number) => {
    return mlEngine.getStore().getZoneMetrics(clampTimeWindow(timeWindowMs));
  });

  safeHandle('get-monitor-metrics', (event, timeWindowMs: number) => {
    return mlEngine.getStore().getMonitorMetrics(clampTimeWindow(timeWindowMs));
  });

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

  safeHandle(IPC_CHANNELS.GET_AUTO_START, () => {
    return app.getLoginItemSettings().openAtLogin;
  });

  safeHandle(IPC_CHANNELS.SET_AUTO_START, (event, enable: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enable === true,
      // openAsHidden is macOS-only; Windows gets a launch arg checked in whenReady.
      openAsHidden: true,
      args: [HIDDEN_LAUNCH_ARG],
    });
    return true;
  });

  safeHandle(IPC_CHANNELS.GET_SYSTEM_STATS, async () => {
    const memory = await process.getProcessMemoryInfo();
    const cpu = process.getCPUUsage();
    return {
      memory: Math.round(memory.private / 1024),
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
    return mlEngine.getStore().getBreakStats(typeof days === 'number' && days > 0 ? Math.min(days, 366) : 7);
  });

  safeHandle('get-break-history-window', (event, timeWindowMs: number) => {
    return mlEngine.getStore().getBreakHistoryInWindow(clampTimeWindow(timeWindowMs));
  });

  safeHandle('get-time-until-break', () => {
    return breakManager.getTimeUntilNextBreak();
  });

  breakManager.on('countdown-update', (data) => sendToWindow('break-countdown-update', data));
  breakManager.on('break-due', (data) => sendToWindow('break-due', data));
  breakManager.on('break-warning', (data) => sendToWindow('break-warning', data));
});
