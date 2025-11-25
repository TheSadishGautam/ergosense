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
});
