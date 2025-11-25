export type PostureState = 'GOOD' | 'OK' | 'BAD';
export type EyeState = 'OK' | 'STRAINED' | 'HIGH_STRAIN';

export interface ErgonomicsMetric {
  timestamp: number;
  postureScore: number; // 0-1
  eyeStrainScore: number; // 0-1
  postureState: PostureState;
  eyeState: EyeState;
  brightnessLevel: number; // 0-1
  distanceCmEstimate?: number;
}

export interface FrameMessage {
  width: number;
  height: number;
  data: Uint8Array; // RGB or RGBA
  timestamp: number;
}

export interface LiveState {
  postureState: PostureState;
  eyeState: EyeState;
  postureScore: number;
  eyeStrainScore: number;
  brightnessLevel: number;
  distanceCmEstimate?: number;
  blinkRate?: number;
  isUserPresent?: boolean;
}

export interface MetricRecord {
  id: number;
  timestamp: number;
  type: 'POSTURE' | 'EYE' | 'BLINK';
  value: number;
  metadata: string;
}

export interface NotificationSettings {
  posture: {
    enabled: boolean;
    threshold: number; // 0-1
  };
  eyeStrain: {
    enabled: boolean;
    threshold: number; // 0-1
  };
  blinkRate: {
    enabled: boolean;
    threshold: number; // blinks/min
  };
  breaks: {
    enabled: boolean;
    intervalMinutes: number; // 10, 20, 30, 60
  };
  sound: boolean;
}

export enum NotificationType {
  POSTURE = 'posture',
  EYE_STRAIN = 'eye_strain',
  BLINK_RATE = 'blink_rate',
  BREAK_REMINDER = 'break_reminder'
}
