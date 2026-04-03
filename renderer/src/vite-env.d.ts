/// <reference types="vite/client" />

import {
  FrameMessage,
  LiveState,
  MetricRecord,
  NotificationSettings,
  NotificationType,
  PostureBaseline,
} from '../../models/types';

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
  cancelCalibration: () => Promise<boolean>;
  getPostureBaseline: () => Promise<any>;
  setPostureBaseline: (baseline: any) => Promise<void>;
  onCalibrationProgress: (callback: (progress: number) => void) => () => void;
  onCalibrationComplete: (callback: (baseline: PostureBaseline) => void) => () => void;
  onCalibrationFailed: (callback: (reason: string) => void) => () => void;
  getSystemStats: () => Promise<{ memory: number; cpu: number }>;
  getBreakSettings: () => Promise<any>;
  updateBreakSettings: (settings: any) => Promise<boolean>;
  snoozeBreak: () => Promise<boolean>;
  skipBreak: () => Promise<boolean>;
  startBreak: () => Promise<boolean>;
  endBreak: (postBreakStrain: number) => Promise<boolean>;
  getBreakStats: (days: number) => Promise<any>;
  getBreakHistoryWindow: (timeWindowMs: number) => Promise<
    Array<{
      scheduled_time: number;
      actual_time: number | null;
      was_taken: number;
      was_snoozed: number;
    }>
  >;
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
