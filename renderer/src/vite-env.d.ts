/// <reference types="vite/client" />

import { FrameMessage, LiveState, MetricRecord, NotificationSettings, NotificationType } from '../../models/types';

interface ElectronAPI {
  sendFrame: (frame: FrameMessage) => void;
  onLiveStateUpdate: (callback: (state: LiveState) => void) => () => void;
  getMetrics: (type: string, timeWindowMs: number) => Promise<MetricRecord[]>;
  getNotificationSettings: () => Promise<NotificationSettings>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<{ success: boolean }>;
  testNotification: (type: NotificationType) => Promise<{ success: boolean }>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enable: boolean) => Promise<boolean>;
  getAppSetting: (key: string) => Promise<any>;
  setAppSetting: (key: string, value: any) => Promise<boolean>;
  onUpdateAvailable: (callback: (info: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
