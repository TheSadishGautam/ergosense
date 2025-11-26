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
  type: 'POSTURE' | 'EYE' | 'BLINK' | 'ZONE' | 'MONITOR_GAZE';
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

export interface PostureBaseline {
  timestamp: number;
  shoulderAngle: number; // Average shoulder alignment angle
  neckAngle: number; // Average neck forward angle
  headTilt: number; // Average head tilt (left/right)
  distanceCm: number; // Average distance from screen
  samples: number; // Number of samples collected during calibration
}

export enum PostureZone {
  CENTER = 'CENTER',
  LEFT_TILT = 'LEFT_TILT',
  RIGHT_TILT = 'RIGHT_TILT',
  FORWARD = 'FORWARD',
  TOO_CLOSE = 'TOO_CLOSE',
  TOO_FAR = 'TOO_FAR'
}

export interface PostureZoneData {
  zone: PostureZone;
  duration: number; // seconds spent in this zone
  percentage: number; // percentage of total time
  count: number; // number of samples in this zone
}

export type MonitorPosition = 'CENTER' | 'LEFT' | 'RIGHT';

export interface MonitorGazeData {
  position: MonitorPosition;
  duration: number; // seconds spent looking at this position
  percentage: number; // percentage of total time
}

export interface MonitorMetrics {
  centerTime: number;
  leftTime: number;
  rightTime: number;
  switches: number; // number of times user switched between monitors
  totalTime: number;
}
