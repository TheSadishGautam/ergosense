"use strict";
const electron = require("electron");
const IPC_CHANNELS = {
  SEND_FRAME: "send-frame",
  LIVE_STATE_UPDATE: "live-state-update",
  GET_METRICS: "get-metrics",
  GET_NOTIFICATION_SETTINGS: "get-notification-settings",
  UPDATE_NOTIFICATION_SETTINGS: "update-notification-settings",
  TEST_NOTIFICATION: "test-notification",
  GET_AUTO_START: "get-auto-start",
  SET_AUTO_START: "set-auto-start",
  GET_APP_SETTING: "get-app-setting",
  SET_APP_SETTING: "set-app-setting"
};
electron.contextBridge.exposeInMainWorld("electronAPI", {
  sendFrame: (frame) => electron.ipcRenderer.send(IPC_CHANNELS.SEND_FRAME, frame),
  onLiveStateUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on(IPC_CHANNELS.LIVE_STATE_UPDATE, subscription);
    return () => {
      electron.ipcRenderer.removeListener(IPC_CHANNELS.LIVE_STATE_UPDATE, subscription);
    };
  },
  getMetrics: (type, timeWindowMs) => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_METRICS, type, timeWindowMs),
  getNotificationSettings: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS),
  updateNotificationSettings: (settings) => electron.ipcRenderer.invoke(IPC_CHANNELS.UPDATE_NOTIFICATION_SETTINGS, settings),
  testNotification: (type) => electron.ipcRenderer.invoke(IPC_CHANNELS.TEST_NOTIFICATION, type),
  getAutoStart: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_AUTO_START),
  setAutoStart: (enable) => electron.ipcRenderer.invoke(IPC_CHANNELS.SET_AUTO_START, enable),
  getAppSetting: (key) => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_APP_SETTING, key),
  setAppSetting: (key, value) => electron.ipcRenderer.invoke(IPC_CHANNELS.SET_APP_SETTING, key, value)
});
