import { EventEmitter } from 'events';
import { MetricStore } from '../db/store';

export interface BreakSettings {
  enabled: boolean;
  baseInterval: number; // minutes (default 45)
  breakDuration: number; // minutes (default 5)
  adaptToStrain: boolean; // Use intelligent timing (default true)
  soundEnabled: boolean; // Ping before breaks (default true)
  showCountdown: boolean; // Show mini timer (default true)
  quietHours: { start: string; end: string }[]; // No breaks during these times
}

export interface BreakRecord {
  id?: number;
  scheduledTime: number;
  actualTime: number | null;
  duration: number;
  wasTaken: boolean;
  wasSnoozed: boolean;
  effectivenessScore: number;
  preBreakStrain: number;
  postBreakStrain: number;
}

export class BreakManager extends EventEmitter {
  private store: MetricStore;
  private settings: BreakSettings;
  private lastBreakTime: number = Date.now();
  private nextBreakTime: number;
  private workSessionStartTime: number = Date.now();
  private activeWorkTime: number = 0; // milliseconds
  private isUserPresent: boolean = false;
  private currentStrainScore: number = 0;
  private breakInProgress: boolean = false;
  private breakStartTime: number | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;

  constructor(store: MetricStore) {
    super();
    this.store = store;
    this.settings = this.loadSettings();
    this.nextBreakTime = this.calculateNextBreakTime();
    this.startTimer();
  }

  private loadSettings(): BreakSettings {
    const stored = this.store.getAppSetting('breakSettings');
    return stored || {
      enabled: true,
      baseInterval: 45,
      breakDuration: 5,
      adaptToStrain: true,
      soundEnabled: true,
      showCountdown: true,
      quietHours: [],
    };
  }

  public updateSettings(settings: Partial<BreakSettings>) {
    this.settings = { ...this.settings, ...settings };
    this.store.setAppSetting('breakSettings', this.settings);
    
    // Recalculate next break time with new settings
    if (settings.baseInterval || settings.adaptToStrain !== undefined) {
      this.nextBreakTime = this.calculateNextBreakTime();
    }
  }

  public getSettings(): BreakSettings {
    return { ...this.settings };
  }

  private startTimer() {
    // Check every 10 seconds
    this.intervalTimer = setInterval(() => {
      this.checkBreakTime();
    }, 10000);
  }

  public updateActivity(isPresent: boolean, strainScore: number) {
    const now = Date.now();
    
    // Track active work time
    if (isPresent && this.isUserPresent) {
      this.activeWorkTime += now - this.workSessionStartTime;
    }
    
    this.isUserPresent = isPresent;
    this.currentStrainScore = strainScore;
    this.workSessionStartTime = now;
    
    // If user returned from being away, check if we should adjust break timing
    if (isPresent && this.activeWorkTime > 5 * 60 * 1000) {
      // User was away for more than 5 minutes - count it as a micro-break
      this.lastBreakTime = now;
      this.nextBreakTime = this.calculateNextBreakTime();
      this.activeWorkTime = 0;
    }
  }

  private calculateNextBreakTime(): number {
    const now = Date.now();
    let intervalMs = this.settings.baseInterval * 60 * 1000;
    
    if (this.settings.adaptToStrain) {
      // Adjust based on current strain
      if (this.currentStrainScore > 0.6) {
        // High strain - shorter interval (30 min)
        intervalMs = 30 * 60 * 1000;
      } else if (this.currentStrainScore < 0.3) {
        // Low strain - longer interval (60 min)
        intervalMs = 60 * 60 * 1000;
      }
      
      // Time of day adjustments
      const hour = new Date().getHours();
      if (hour >= 15) {
        // Afternoon fatigue - reduce by 10%
        intervalMs *= 0.9;
      }
    }
    
    return this.lastBreakTime + intervalMs;
  }

  private checkBreakTime() {
    if (!this.settings.enabled || this.breakInProgress) return;
    
    const now = Date.now();
    
    // Check if in quiet hours
    if (this.isInQuietHours()) {
      if (this.settings.showCountdown) {
        this.emit('countdown-update', {
          timeRemaining: 0,
          nextBreakTime: 0,
          isQuietMode: true,
        });
      }
      return;
    }
    
    // Time for a break?
    if (now >= this.nextBreakTime && this.isUserPresent) {
      this.triggerBreak();
    }
    
    // Emit countdown updates (for mini timer UI)
    const timeUntilBreak = this.nextBreakTime - now;
    if (this.settings.showCountdown && timeUntilBreak > 0) {
      this.emit('countdown-update', {
        timeRemaining: Math.floor(timeUntilBreak / 1000), // seconds
        nextBreakTime: this.nextBreakTime,
      });
    }
    
    // Ping 5 minutes before break
    if (this.settings.soundEnabled && timeUntilBreak <= 5 * 60 * 1000 && timeUntilBreak > 4.9 * 60 * 1000) {
      this.emit('break-warning', { minutesRemaining: 5 });
    }
  }

  private isInQuietHours(): boolean {
    if (!this.settings.quietHours || this.settings.quietHours.length === 0) {
      return false;
    }
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return this.settings.quietHours.some(({ start, end }) => {
      return currentTime >= start && currentTime <= end;
    });
  }

  private triggerBreak() {
    this.breakInProgress = true;
    this.emit('break-due', {
      duration: this.settings.breakDuration,
      strain: this.currentStrainScore,
    });
  }

  public snoozeBreak(minutes: number = 10) {
    this.breakInProgress = false;
    this.nextBreakTime = Date.now() + (minutes * 60 * 1000);
    
    // Record snoozed break
    this.recordBreak({
      scheduledTime: Date.now(),
      actualTime: null,
      duration: 0,
      wasTaken: false,
      wasSnoozed: true,
      effectivenessScore: 0,
      preBreakStrain: this.currentStrainScore,
      postBreakStrain: this.currentStrainScore,
    });
  }

  public skipBreak() {
    this.breakInProgress = false;
    this.lastBreakTime = Date.now();
    this.nextBreakTime = this.calculateNextBreakTime();
    
    // Record skipped break
    this.recordBreak({
      scheduledTime: Date.now(),
      actualTime: null,
      duration: 0,
      wasTaken: false,
      wasSnoozed: false,
      effectivenessScore: 0,
      preBreakStrain: this.currentStrainScore,
      postBreakStrain: this.currentStrainScore,
    });
  }

  public startBreak() {
    this.breakStartTime = Date.now();
    this.breakInProgress = true;
  }

  public endBreak(postBreakStrain: number) {
    if (!this.breakStartTime) return;
    
    const duration = Math.floor((Date.now() - this.breakStartTime) / 1000 / 60); // minutes
    const userLeftComputer = !this.isUserPresent; // Check if user was away during break
    
    // Calculate effectiveness score
    const effectivenessScore = this.calculateEffectiveness(
      duration,
      userLeftComputer,
      this.currentStrainScore,
      postBreakStrain
    );
    
    // Record successful break
    this.recordBreak({
      scheduledTime: this.nextBreakTime,
      actualTime: this.breakStartTime,
      duration,
      wasTaken: true,
      wasSnoozed: false,
      effectivenessScore,
      preBreakStrain: this.currentStrainScore,
      postBreakStrain,
    });
    
    this.breakInProgress = false;
    this.breakStartTime = null;
    this.lastBreakTime = Date.now();
    this.activeWorkTime = 0;
    this.nextBreakTime = this.calculateNextBreakTime();
  }

  private calculateEffectiveness(
    duration: number,
    leftComputer: boolean,
    preStrain: number,
    postStrain: number
  ): number {
    let score = 0;
    
    // Compliance (took the break): 40%
    score += 0.4;
    
    // Adequate duration (>= recommended): 30%
    if (duration >= this.settings.breakDuration) {
      score += 0.3;
    } else {
      score += 0.3 * (duration / this.settings.breakDuration);
    }
    
    // Left computer: 20%
    if (leftComputer) {
      score += 0.2;
    }
    
    // Strain reduction: 10%
    const strainReduction = Math.max(0, preStrain - postStrain);
    score += 0.1 * Math.min(1, strainReduction / 0.3); // Max credit for 30% reduction
    
    return Math.min(1, score);
  }

  private recordBreak(record: BreakRecord) {
    this.store.addBreakRecord(record);
    this.emit('break-recorded', record);
  }

  public getTimeUntilNextBreak(): number {
    return Math.max(0, this.nextBreakTime - Date.now());
  }

  public getBreakHistory(days: number = 7): BreakRecord[] {
    return this.store.getBreakHistory(days);
  }

  public destroy() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
  }
}
