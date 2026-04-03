export interface QuietHourRange {
  start: string;
  end: string;
}

export interface BreakSettings {
  enabled: boolean;
  baseInterval: number;
  breakDuration: number;
  adaptToStrain: boolean;
  soundEnabled: boolean;
  showCountdown: boolean;
  quietHours: QuietHourRange[];
}
