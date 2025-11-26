/// <reference types="vite/client" />

import { FrameMessage, LiveState, MetricRecord, NotificationSettings, NotificationType } from '../../models/types';

interface ElectronAPI {
  sendFrame: (frame: FrameMessage) => void;
  onLiveStateUpdate: (callback: (state: LiveState) => void) => () => void;
  getMetrics: (type: string, timeWindowMs: number) => Promise<MetricRecord[]>;
  getZoneMetrics: (timeWindowMs: number) => Promise<any[]>;
  getMonitorMetrics: (timeWindowMs: number) => Promise<any>;
  getNotificationSettings: () => Promise<NotificationSettings>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<{ success: boolean }>;
  testNotification: (type: NotificationType) => Promise<{ success: boolean }>;
  getAutoStart: () => Promise<boolean>;
  setAutoStart: (enable: boolean) => Promise<boolean>;
  getAppSetting: (key: string) => Promise<any>;
  setAppSetting: (key: string, value: any) => Promise<boolean>;
  onUpdateAvailable: (callback: (info: any) => void) => () => void;
  startCalibration: () => Promise<void>;
  getPostureBaseline: () => Promise<any>;
  setPostureBaseline: (baseline: any) => Promise<void>;
  onCalibrationProgress: (callback: (progress: number) => void) => () => void;
  getSystemStats: () => Promise<{ memory: number; cpu: number }>;
  // Break Management
  getBreakSettings: () => Promise<any>;
  updateBreakSettings: (settings: any) => Promise<boolean>;
  snoozeBreak: () => Promise<boolean>;
  skipBreak: () => Promise<boolean>;
  startBreak: () => Promise<boolean>;
  endBreak: (postBreakStrain: number) => Promise<boolean>;
  getBreakStats: (days: number) => Promise<any>;
  getTimeUntilBreak: () => Promise<number>;
  onBreakCountdownUpdate: (callback: (data: any) => void) => () => void;
  onBreakDue: (callback: (data: any) => void) => () => void;
  onBreakWarning: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
