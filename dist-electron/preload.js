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
  GET_SYSTEM_STATS: "get-system-stats",
  GET_APP_SETTING: "get-app-setting",
  SET_APP_SETTING: "set-app-setting",
  UPDATE_AVAILABLE: "update-available",
  START_CALIBRATION: "start-calibration",
  CALIBRATION_PROGRESS: "calibration-progress",
  GET_POSTURE_BASELINE: "get-posture-baseline",
  SET_POSTURE_BASELINE: "set-posture-baseline"
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
  getZoneMetrics: (timeWindowMs) => electron.ipcRenderer.invoke("get-zone-metrics", timeWindowMs),
  getMonitorMetrics: (timeWindowMs) => electron.ipcRenderer.invoke("get-monitor-metrics", timeWindowMs),
  getNotificationSettings: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_NOTIFICATION_SETTINGS),
  updateNotificationSettings: (settings) => electron.ipcRenderer.invoke(IPC_CHANNELS.UPDATE_NOTIFICATION_SETTINGS, settings),
  testNotification: (type) => electron.ipcRenderer.invoke(IPC_CHANNELS.TEST_NOTIFICATION, type),
  getAutoStart: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_AUTO_START),
  setAutoStart: (enable) => electron.ipcRenderer.invoke(IPC_CHANNELS.SET_AUTO_START, enable),
  getAppSetting: (key) => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_APP_SETTING, key),
  setAppSetting: (key, value) => electron.ipcRenderer.invoke(IPC_CHANNELS.SET_APP_SETTING, key, value),
  onUpdateAvailable: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on(IPC_CHANNELS.UPDATE_AVAILABLE, subscription);
    return () => {
      electron.ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_AVAILABLE, subscription);
    };
  },
  startCalibration: () => electron.ipcRenderer.invoke(IPC_CHANNELS.START_CALIBRATION),
  getPostureBaseline: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_POSTURE_BASELINE),
  setPostureBaseline: (baseline) => electron.ipcRenderer.invoke(IPC_CHANNELS.SET_POSTURE_BASELINE, baseline),
  getSystemStats: () => electron.ipcRenderer.invoke(IPC_CHANNELS.GET_SYSTEM_STATS),
  onCalibrationProgress: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on(IPC_CHANNELS.CALIBRATION_PROGRESS, subscription);
    return () => {
      electron.ipcRenderer.removeListener(IPC_CHANNELS.CALIBRATION_PROGRESS, subscription);
    };
  },
  // Break Management
  getBreakSettings: () => electron.ipcRenderer.invoke("get-break-settings"),
  updateBreakSettings: (settings) => electron.ipcRenderer.invoke("update-break-settings", settings),
  snoozeBreak: () => electron.ipcRenderer.invoke("snooze-break"),
  skipBreak: () => electron.ipcRenderer.invoke("skip-break"),
  startBreak: () => electron.ipcRenderer.invoke("start-break"),
  endBreak: (postBreakStrain) => electron.ipcRenderer.invoke("end-break", postBreakStrain),
  getBreakStats: (days) => electron.ipcRenderer.invoke("get-break-stats", days),
  getTimeUntilBreak: () => electron.ipcRenderer.invoke("get-time-until-break"),
  onBreakCountdownUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on("break-countdown-update", subscription);
    return () => {
      electron.ipcRenderer.removeListener("break-countdown-update", subscription);
    };
  },
  onBreakDue: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on("break-due", subscription);
    return () => {
      electron.ipcRenderer.removeListener("break-due", subscription);
    };
  },
  onBreakWarning: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on("break-warning", subscription);
    return () => {
      electron.ipcRenderer.removeListener("break-warning", subscription);
    };
  }
});
