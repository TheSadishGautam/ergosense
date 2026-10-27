import { describe, expect, it } from 'vitest';
import type { NotificationSettings } from '../models/types';
import {
  clampDays,
  clampTimeWindow,
  clampUnit,
  isRendererSettingKey,
  sanitizeBreakSettings,
  sanitizeNotificationSettings,
} from './ipcValidation';

const current: NotificationSettings = {
  posture: { enabled: true, threshold: 0.6 },
  eyeStrain: { enabled: true, threshold: 0.7 },
  blinkRate: { enabled: false, threshold: 12 },
  breaks: { enabled: true, intervalMinutes: 20 },
  sound: true,
};

describe('clampTimeWindow', () => {
  it('falls back for missing or invalid values', () => {
    expect(clampTimeWindow(undefined)).toBe(86_400_000);
    expect(clampTimeWindow(-5)).toBe(86_400_000);
    expect(clampTimeWindow(Number.NaN)).toBe(86_400_000);
    expect(clampTimeWindow('3600000')).toBe(86_400_000);
  });

  it('caps very large windows at roughly a year', () => {
    expect(clampTimeWindow(Number.MAX_SAFE_INTEGER)).toBe(366 * 86_400_000);
    expect(clampTimeWindow(3_600_000)).toBe(3_600_000);
  });
});

describe('clampDays / clampUnit', () => {
  it('normalises day counts', () => {
    expect(clampDays(undefined)).toBe(7);
    expect(clampDays(0)).toBe(7);
    expect(clampDays(3.7)).toBe(3);
    expect(clampDays(10_000)).toBe(366);
  });

  it('keeps strain scores within 0-1', () => {
    expect(clampUnit(2)).toBe(1);
    expect(clampUnit(-1)).toBe(0);
    expect(clampUnit('x')).toBe(0);
    expect(clampUnit(0.4)).toBe(0.4);
  });
});

describe('isRendererSettingKey', () => {
  it('only allows renderer-owned keys', () => {
    expect(isRendererSettingKey('onboardingCompleted')).toBe(true);
    expect(isRendererSettingKey('breakSettings')).toBe(false);
    expect(isRendererSettingKey('notificationSettings')).toBe(false);
    expect(isRendererSettingKey(42)).toBe(false);
  });
});

describe('sanitizeNotificationSettings', () => {
  it('passes valid settings through unchanged', () => {
    const next = { ...current, sound: false };
    expect(sanitizeNotificationSettings(next, current)).toEqual(next);
  });

  it('never allows a break interval that would spam notifications', () => {
    const result = sanitizeNotificationSettings({ ...current, breaks: { enabled: true, intervalMinutes: 0 } }, current);
    expect(result.breaks.intervalMinutes).toBe(1);
  });

  it('clamps thresholds and keeps current values for invalid fields', () => {
    const result = sanitizeNotificationSettings(
      { posture: { enabled: 'yes', threshold: 5 }, blinkRate: { threshold: -3 } },
      current
    );
    expect(result.posture).toEqual({ enabled: true, threshold: 1 });
    expect(result.blinkRate).toEqual({ enabled: false, threshold: 0 });
    expect(result.eyeStrain).toEqual(current.eyeStrain);
  });

  it('returns current settings for non-object input', () => {
    expect(sanitizeNotificationSettings(null, current)).toEqual(current);
    expect(sanitizeNotificationSettings('bad', current)).toEqual(current);
  });
});

describe('sanitizeBreakSettings', () => {
  it('keeps only known, well-typed fields', () => {
    expect(
      sanitizeBreakSettings({ enabled: false, baseInterval: 45, injected: 'x', soundEnabled: 'true' })
    ).toEqual({ enabled: false, baseInterval: 45 });
  });

  it('clamps intervals and durations', () => {
    expect(sanitizeBreakSettings({ baseInterval: 0, breakDuration: 999 })).toEqual({
      baseInterval: 5,
      breakDuration: 60,
    });
  });

  it('drops malformed quiet hours', () => {
    const result = sanitizeBreakSettings({
      quietHours: [
        { start: '12:00', end: '13:00' },
        { start: '25:00', end: '13:00' },
        { start: '09:00' },
        'nope',
      ],
    });
    expect(result.quietHours).toEqual([{ start: '12:00', end: '13:00' }]);
  });
});
