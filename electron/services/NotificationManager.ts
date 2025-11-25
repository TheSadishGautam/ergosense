import { Notification } from 'electron';
import { NotificationSettings, NotificationType } from '../../models/types';
import path from 'path';
import { app } from 'electron';

interface NotificationCooldown {
  [key: string]: number; // timestamp of last notification
}

export class NotificationManager {
  private settings: NotificationSettings;
  private cooldowns: NotificationCooldown = {};
  private breakTimer: NodeJS.Timeout | null = null;
  private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
  private iconPath: string;

  constructor(settings: NotificationSettings) {
    this.settings = settings;
    // Get icon path from app resources
    // In dev, VITE_PUBLIC is set. In prod, we need to resolve relative to the app bundle.
    if (app.isPackaged) {
      this.iconPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'renderer', 'src', 'assets', 'icon.png');
      // Fallback if unpacked doesn't exist (e.g. if not using asar.unpacked)
      if (!require('fs').existsSync(this.iconPath)) {
         this.iconPath = path.join(__dirname, '../../renderer/src/assets/icon.png');
      }
    } else {
      this.iconPath = path.join(__dirname, '../../renderer/src/assets/icon.png');
    }
    
    // Initialize cooldowns to prevent immediate alerts on startup
    // Give a 10-second grace period for all notification types
    const now = Date.now();
    Object.values(NotificationType).forEach(type => {
      this.cooldowns[type] = now - this.COOLDOWN_MS + 10000; // Allow alerts after 10s
    });

    this.startBreakTimer();
  }

  updateSettings(settings: NotificationSettings) {
    this.settings = settings;
    this.restartBreakTimer();
  }

  private canSendNotification(type: NotificationType): boolean {
    const lastSent = this.cooldowns[type];
    if (!lastSent) return true;
    
    const now = Date.now();
    return (now - lastSent) >= this.COOLDOWN_MS;
  }

  private sendNotification(type: NotificationType, title: string, body: string) {
    if (!this.canSendNotification(type)) {
      console.log(`Notification cooldown active for ${type}`);
      return;
    }

    const notification = new Notification({
      title,
      body,
      silent: !this.settings.sound,
      icon: this.iconPath,
    });

    notification.show();
    this.cooldowns[type] = Date.now();
    console.log(`Sent notification: ${type} - ${title}`);
  }

  sendPostureAlert(score: number) {
    if (!this.settings.posture.enabled) return;
    if (score >= this.settings.posture.threshold) return;

    this.sendNotification(
      NotificationType.POSTURE,
      '⚠️ Posture Check',
      `Gentle reminder to sit up straight. Your back will thank you! (Score: ${(score * 100).toFixed(0)}%)`
    );
  }

  sendEyeStrainAlert(strain: number) {
    if (!this.settings.eyeStrain.enabled) return;
    if (strain <= this.settings.eyeStrain.threshold) return;

    this.sendNotification(
      NotificationType.EYE_STRAIN,
      '👁️ Eye Rest Needed',
      `Your eyes seem tired. Look away for a moment to recharge. (${(strain * 100).toFixed(0)}% strain)`
    );
  }

  sendBlinkAlert(rate: number) {
    if (!this.settings.blinkRate.enabled) return;
    if (rate >= this.settings.blinkRate.threshold) return;

    this.sendNotification(
      NotificationType.BLINK_RATE,
      '✨ Blink Reminder',
      `Blinking helps keep your eyes hydrated. Try a few slow blinks now! (${rate.toFixed(0)}/min)`
    );
  }

  private sendBreakReminder() {
    if (!this.settings.breaks.enabled) return;

    this.sendNotification(
      NotificationType.BREAK_REMINDER,
      '⏰ Time to Stretch',
      'Great work! Take 20 seconds to look away and stretch your legs.'
    );
  }

  private startBreakTimer() {
    if (this.breakTimer) {
      clearInterval(this.breakTimer);
    }

    if (!this.settings.breaks.enabled) return;

    const intervalMs = this.settings.breaks.intervalMinutes * 60 * 1000;
    this.breakTimer = setInterval(() => {
      this.sendBreakReminder();
    }, intervalMs);

    console.log(`Break timer started: ${this.settings.breaks.intervalMinutes} minutes`);
  }

  private restartBreakTimer() {
    this.startBreakTimer();
  }

  testNotification(type: NotificationType) {
    // Send test notification without cooldown check
    switch (type) {
      case NotificationType.POSTURE:
        new Notification({
          title: '⚠️ Test: Poor Posture',
          body: 'This is a test posture alert (35%)',
          silent: !this.settings.sound,
          icon: this.iconPath,
        }).show();
        break;
      case NotificationType.EYE_STRAIN:
        new Notification({
          title: '👁️ Test: High Eye Strain',
          body: 'This is a test eye strain alert (75%)',
          silent: !this.settings.sound,
          icon: this.iconPath,
        }).show();
        break;
      case NotificationType.BLINK_RATE:
        new Notification({
          title: '✨ Test: Low Blink Rate',
          body: 'This is a test blink rate alert (8/min)',
          silent: !this.settings.sound,
          icon: this.iconPath,
        }).show();
        break;
      case NotificationType.BREAK_REMINDER:
        new Notification({
          title: '⏰ Test: Break Time',
          body: 'This is a test break reminder',
           silent: !this.settings.sound,
          icon: this.iconPath,
        }).show();
        break;
    }
  }

  cleanup() {
    if (this.breakTimer) {
      clearInterval(this.breakTimer);
      this.breakTimer = null;
    }
  }
}
