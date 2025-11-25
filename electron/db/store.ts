import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { NotificationSettings } from '../../models/types';

export interface MetricRecord {
  id: number;
  timestamp: number;
  type: 'POSTURE' | 'EYE' | 'BLINK' | 'PRESENCE';
  value: number; // Score (0-1) or Count
  metadata: string; // JSON
}

export class MetricStore {
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'ergosense.db');
    console.log('Initializing database at:', dbPath);
    this.db = new Database(dbPath);
    this.init();
  }

  private init() {
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS raw_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        type TEXT NOT NULL,
        value REAL,
        metadata TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_timestamp ON raw_metrics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_type ON raw_metrics(type);
      
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    
    // Initialize default settings if not exists
    this.initDefaultSettings();
  }

  public addMetric(type: 'POSTURE' | 'EYE' | 'BLINK' | 'PRESENCE', value: number, metadata: object = {}) {
    try {
      const stmt = this.db.prepare('INSERT INTO raw_metrics (timestamp, type, value, metadata) VALUES (?, ?, ?, ?)');
      stmt.run(Date.now(), type, value, JSON.stringify(metadata));
    } catch (err) {
      console.error('Failed to add metric:', err);
    }
  }

  public getMetrics(type: string, timeWindowMs: number): MetricRecord[] {
    const since = Date.now() - timeWindowMs;
    const stmt = this.db.prepare('SELECT * FROM raw_metrics WHERE type = ? AND timestamp > ? ORDER BY timestamp ASC');
    return stmt.all(type, since) as MetricRecord[];
  }

  public getAllMetrics(timeWindowMs: number): MetricRecord[] {
    const since = Date.now() - timeWindowMs;
    const stmt = this.db.prepare('SELECT * FROM raw_metrics WHERE timestamp > ? ORDER BY timestamp ASC');
    return stmt.all(since) as MetricRecord[];
  }

  public pruneOldMetrics(maxAgeMs: number) {
    const cutoff = Date.now() - maxAgeMs;
    const stmt = this.db.prepare('DELETE FROM raw_metrics WHERE timestamp < ?');
    stmt.run(cutoff);
  }

  private initDefaultSettings() {
    const defaultSettings: NotificationSettings = {
      posture: { enabled: true, threshold: 0.4 },
      eyeStrain: { enabled: true, threshold: 0.6 },
      blinkRate: { enabled: true, threshold: 10 },
      breaks: { enabled: true, intervalMinutes: 20 },
      sound: false
    };

    // Check if settings exist
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const existing = stmt.get('notificationSettings');
    
    if (!existing) {
      // Insert default settings
      const insertStmt = this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
      insertStmt.run('notificationSettings', JSON.stringify(defaultSettings));
      console.log('Initialized default notification settings');
    }
  }

  public getNotificationSettings(): NotificationSettings {
    try {
      const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
      const result = stmt.get('notificationSettings') as { value: string } | undefined;
      
      if (result) {
        return JSON.parse(result.value);
      }
      
      // Return defaults if not found
      return {
        posture: { enabled: true, threshold: 0.4 },
        eyeStrain: { enabled: true, threshold: 0.6 },
        blinkRate: { enabled: true, threshold: 10 },
        breaks: { enabled: true, intervalMinutes: 20 },
        sound: false
      };
    } catch (err) {
      console.error('Failed to get notification settings:', err);
      throw err;
    }
  }

  public updateNotificationSettings(settings: NotificationSettings) {
    try {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      stmt.run('notificationSettings', JSON.stringify(settings));
      console.log('Updated notification settings');
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      throw err;
    }
  }

  public getAppSetting(key: string): any {
    try {
      const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
      const result = stmt.get(key) as { value: string } | undefined;
      if (result) {
        return JSON.parse(result.value);
      }
      return null;
    } catch (err) {
      console.error(`Failed to get app setting ${key}:`, err);
      return null;
    }
  }

  public setAppSetting(key: string, value: any) {
    try {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      stmt.run(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Failed to set app setting ${key}:`, err);
      throw err;
    }
  }
}
