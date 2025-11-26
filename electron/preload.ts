import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from './ipc';
import { FrameMessage, LiveState } from '../models/types';

contextBridge.exposeInMainWorld('electronAPI', {
  sendFrame: (frame: FrameMessage) => ipcRenderer.send(IPC_CHANNELS.SEND_FRAME, frame),
  onLiveStateUpdate: (callback: (state: LiveState) => void) => {
    const subscription = (_event: any, value: LiveState) => callback(value);
    ipcRenderer.on(IPC_CHANNELS.LIVE_STATE_UPDATE, subscription);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.LIVE_STATE_UPDATE, subscription);
    };
  },
  getMetrics: (type: string, timeWindowMs: number) => ipcRenderer.invoke(IPC_CHANNELS.GET_METRICS, type, timeWindowMs),
  getZoneMetrics: (timeWindowMs: number) => ipcRenderer.invoke('get-zone-metrics', timeWindowMs),
  getMonitorMetrics: (timeWindowMs: number) => ipcRenderer.invoke('get-monitor-metrics', timeWindowMs),
  getNotificationSettings: () => ipcRenderer.invoke(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS),
  updateNotificationSettings: (settings: any) => ipcRenderer.invoke(IPC_CHANNELS.UPDATE_NOTIFICATION_SETTINGS, settings),
  testNotification: (type: string) => ipcRenderer.invoke(IPC_CHANNELS.TEST_NOTIFICATION, type),
  getAutoStart: () => ipcRenderer.invoke(IPC_CHANNELS.GET_AUTO_START),
  setAutoStart: (enable: boolean) => ipcRenderer.invoke(IPC_CHANNELS.SET_AUTO_START, enable),
  getAppSetting: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_APP_SETTING, key),
  setAppSetting: (key: string, value: any) => ipcRenderer.invoke(IPC_CHANNELS.SET_APP_SETTING, key, value),
  onUpdateAvailable: (callback: (info: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, subscription);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_AVAILABLE, subscription);
    };
  },
  startCalibration: () => ipcRenderer.invoke(IPC_CHANNELS.START_CALIBRATION),
  getPostureBaseline: () => ipcRenderer.invoke(IPC_CHANNELS.GET_POSTURE_BASELINE),
  setPostureBaseline: (baseline: any) => ipcRenderer.invoke(IPC_CHANNELS.SET_POSTURE_BASELINE, baseline),
  getSystemStats: () => ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_STATS),
  onCalibrationProgress: (callback: (progress: number) => void) => {
    const subscription = (_event: any, value: number) => callback(value);
    ipcRenderer.on(IPC_CHANNELS.CALIBRATION_PROGRESS, subscription);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.CALIBRATION_PROGRESS, subscription);
    };
  },
  // Break Management
  getBreakSettings: () => ipcRenderer.invoke('get-break-settings'),
  updateBreakSettings: (settings: any) => ipcRenderer.invoke('update-break-settings', settings),
  snoozeBreak: () => ipcRenderer.invoke('snooze-break'),
  skipBreak: () => ipcRenderer.invoke('skip-break'),
  startBreak: () => ipcRenderer.invoke('start-break'),
  endBreak: (postBreakStrain: number) => ipcRenderer.invoke('end-break', postBreakStrain),
  getBreakStats: (days: number) => ipcRenderer.invoke('get-break-stats', days),
  getTimeUntilBreak: () => ipcRenderer.invoke('get-time-until-break'),
  onBreakCountdownUpdate: (callback: (data: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('break-countdown-update', subscription);
    return () => {
      ipcRenderer.removeListener('break-countdown-update', subscription);
    };
  },
  onBreakDue: (callback: (data: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('break-due', subscription);
    return () => {
      ipcRenderer.removeListener('break-due', subscription);
    };
  },
  onBreakWarning: (callback: (data: any) => void) => {
    const subscription = (_event: any, value: any) => callback(value);
    ipcRenderer.on('break-warning', subscription);
    return () => {
      ipcRenderer.removeListener('break-warning', subscription);
    };
  },
});
