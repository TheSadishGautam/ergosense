import type { NotificationSettings } from '../models/types';
import type { BreakSettings } from './services/BreakManager';

// Pure helpers for sanitising renderer-supplied IPC payloads (no Electron imports, so they are unit-testable).

const DAY_MS = 86_400_000;
const MAX_WINDOW_MS = 366 * DAY_MS;
const MAX_QUIET_HOUR_RANGES = 12;
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

// Keys the renderer may read/write via get/set-app-setting. Internal keys such as
// `breakSettings` and `notificationSettings` must go through their validated channels.
export const RENDERER_SETTING_KEYS: readonly string[] = ['onboardingCompleted'];

export const isRendererSettingKey = (key: unknown): key is string =>
  typeof key === 'string' && RENDERER_SETTING_KEYS.includes(key);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const pickNumber = (value: unknown, fallback: number, min: number, max: number): number =>
  isFiniteNumber(value) ? clamp(value, min, max) : fallback;

const pickBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const clampTimeWindow = (value: unknown, fallback = DAY_MS): number => {
  if (!isFiniteNumber(value) || value <= 0) return fallback;
  return Math.min(value, MAX_WINDOW_MS);
};

export const clampDays = (value: unknown, fallback = 7): number =>
  isFiniteNumber(value) && value > 0 ? Math.min(Math.floor(value), 366) : fallback;

export const clampUnit = (value: unknown, fallback = 0): number => pickNumber(value, fallback, 0, 1);

export const sanitizeNotificationSettings = (
  input: unknown,
  current: NotificationSettings
): NotificationSettings => {
  const raw = asRecord(input);
  const posture = asRecord(raw.posture);
  const eyeStrain = asRecord(raw.eyeStrain);
  const blinkRate = asRecord(raw.blinkRate);
  const breaks = asRecord(raw.breaks);

  return {
    posture: {
      enabled: pickBoolean(posture.enabled, current.posture.enabled),
      threshold: pickNumber(posture.threshold, current.posture.threshold, 0, 1),
    },
    eyeStrain: {
      enabled: pickBoolean(eyeStrain.enabled, current.eyeStrain.enabled),
      threshold: pickNumber(eyeStrain.threshold, current.eyeStrain.threshold, 0, 1),
    },
    blinkRate: {
      enabled: pickBoolean(blinkRate.enabled, current.blinkRate.enabled),
      threshold: pickNumber(blinkRate.threshold, current.blinkRate.threshold, 0, 60),
    },
    breaks: {
      enabled: pickBoolean(breaks.enabled, current.breaks.enabled),
      // A zero/negative interval would make setInterval fire continuously.
      intervalMinutes: Math.round(pickNumber(breaks.intervalMinutes, current.breaks.intervalMinutes, 1, 240)),
    },
    sound: pickBoolean(raw.sound, current.sound),
  };
};

export const sanitizeBreakSettings = (input: unknown): Partial<BreakSettings> => {
  const raw = asRecord(input);
  const result: Partial<BreakSettings> = {};

  if (typeof raw.enabled === 'boolean') result.enabled = raw.enabled;
  if (typeof raw.adaptToStrain === 'boolean') result.adaptToStrain = raw.adaptToStrain;
  if (typeof raw.soundEnabled === 'boolean') result.soundEnabled = raw.soundEnabled;
  if (typeof raw.showCountdown === 'boolean') result.showCountdown = raw.showCountdown;
  if (isFiniteNumber(raw.baseInterval)) result.baseInterval = Math.round(clamp(raw.baseInterval, 5, 240));
  if (isFiniteNumber(raw.breakDuration)) result.breakDuration = Math.round(clamp(raw.breakDuration, 1, 60));

  if (Array.isArray(raw.quietHours)) {
    result.quietHours = raw.quietHours
      .map(asRecord)
      .filter(
        (range): range is { start: string; end: string } =>
          typeof range.start === 'string' &&
          typeof range.end === 'string' &&
          TIME_OF_DAY.test(range.start) &&
          TIME_OF_DAY.test(range.end)
      )
      .map(({ start, end }) => ({ start, end }))
      .slice(0, MAX_QUIET_HOUR_RANGES);
  }

  return result;
};
