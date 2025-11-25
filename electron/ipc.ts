export const IPC_CHANNELS = {
  SEND_FRAME: 'send-frame',
  LIVE_STATE_UPDATE: 'live-state-update',
  GET_METRICS: 'get-metrics',
  GET_NOTIFICATION_SETTINGS: 'get-notification-settings',
  UPDATE_NOTIFICATION_SETTINGS: 'update-notification-settings',
  TEST_NOTIFICATION: 'test-notification',
  GET_AUTO_START: 'get-auto-start',
  SET_AUTO_START: 'set-auto-start',
  GET_APP_SETTING: 'get-app-setting',
  SET_APP_SETTING: 'set-app-setting',
  UPDATE_AVAILABLE: 'update-available',
  UPDATE_DOWNLOADED: 'update-downloaded',
} as const;
