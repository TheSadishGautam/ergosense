import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { NotificationSettings, PostureBaseline } from '../../models/types';

export interface MetricRecord {
  id: number;
  timestamp: number;
  type: 'POSTURE' | 'EYE' | 'BLINK' | 'PRESENCE' | 'ZONE' | 'MONITOR_GAZE';
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

      CREATE TABLE IF NOT EXISTS break_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scheduled_time INTEGER NOT NULL,
        actual_time INTEGER,
        duration INTEGER NOT NULL,
        was_taken BOOLEAN NOT NULL,
        was_snoozed BOOLEAN NOT NULL,
        effectiveness_score REAL NOT NULL,
        pre_break_strain REAL NOT NULL,
        post_break_strain REAL NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_break_time ON break_history(scheduled_time);
    `);
    
    // Initialize default settings if not exists
    this.initDefaultSettings();
  }

  public addMetric(type: 'POSTURE' | 'EYE' | 'BLINK' | 'PRESENCE' | 'ZONE' | 'MONITOR_GAZE', value: number, metadata: object = {}) {
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

  public getZoneMetrics(timeWindowMs: number): any {
    const since = Date.now() - timeWindowMs;
    const stmt = this.db.prepare('SELECT * FROM raw_metrics WHERE type = ? AND timestamp > ? ORDER BY timestamp ASC');
    const records = stmt.all('ZONE', since) as MetricRecord[];
    
    // Aggregate zone data from all records
    const zoneAgg: Record<string, { count: number; totalPercentage: number }> = {};
    
    records.forEach(record => {
      try {
        const metadata = JSON.parse(record.metadata);
        Object.keys(metadata).forEach(zone => {
          if (!zoneAgg[zone]) {
            zoneAgg[zone] = { count: 0, totalPercentage: 0 };
          }
          zoneAgg[zone].count += metadata[zone].count || 0;
          zoneAgg[zone].totalPercentage += metadata[zone].percentage || 0;
        });
      } catch (e) {
        // Skip invalid records
      }
    });
    
    // Calculate averages and format as PostureZoneData
    const result = Object.keys(zoneAgg).map(zone => ({
      zone,
      count: zoneAgg[zone].count,
      percentage: records.length > 0 ? zoneAgg[zone].totalPercentage / records.length : 0,
      duration: 0, // Can be calculated from count if needed
    }));
    
    return result;
  }

  public getMonitorMetrics(timeWindowMs: number): any {
    const since = Date.now() - timeWindowMs;
    const stmt = this.db.prepare('SELECT * FROM raw_metrics WHERE type = ? AND timestamp > ? ORDER BY timestamp ASC');
    const records = stmt.all('MONITOR_GAZE', since) as MetricRecord[];
    
    if (records.length === 0) {
      return {
        centerTime: 0,
        leftTime: 0,
        rightTime: 0,
        switches: 0,
        totalTime: 0,
        data: []
      };
    }
    
    // Aggregate from all records
    let totalCenter = 0;
    let totalLeft = 0;
    let totalRight = 0;
    let totalSwitches = 0;
    let totalSamples = 0;
    
    records.forEach(record => {
      try {
        const metadata = JSON.parse(record.metadata);
        totalCenter += metadata.center || 0;
        totalLeft += metadata.left || 0;
        totalRight += metadata.right || 0;
        totalSwitches += metadata.switches || 0;
        totalSamples += metadata.total || 0;
      } catch (e) {
        // Skip invalid records
      }
    });
    
    // Calculate totals and percentages
    const total = totalCenter + totalLeft + totalRight;
    
    // Convert counts to approximate time (samples * seconds per flush interval)
    const secondsPerSample = 60; // Approximate based on flush interval
    
    const result = {
      centerTime: totalCenter,
      leftTime: totalLeft,
      rightTime: totalRight,
      switches: totalSwitches,
      totalTime: total,
      data: [
        {
          position: 'CENTER',
          duration: (totalCenter / total) * timeWindowMs / 1000,
          percentage: total > 0 ? (totalCenter / total) * 100 : 0,
        },
        {
          position: 'LEFT',
          duration: (totalLeft / total) * timeWindowMs / 1000,
          percentage: total > 0 ? (totalLeft / total) * 100 : 0,
        },
        {
          position: 'RIGHT',
          duration: (totalRight / total) * timeWindowMs / 1000,
          percentage: total > 0 ? (totalRight / total) * 100 : 0,
        },
      ],
    };
    
    return result;
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

  public getPostureBaseline(): PostureBaseline | null {
    try {
      const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
      const result = stmt.get('postureBaseline') as { value: string } | undefined;
      if (result) {
        return JSON.parse(result.value) as PostureBaseline;
      }
      return null;
    } catch (err) {
      console.error('Failed to get posture baseline:', err);
      return null;
    }
  }


  public setPostureBaseline(baseline: PostureBaseline) {
    try {
      const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
      stmt.run('postureBaseline', JSON.stringify(baseline));
      console.log('Saved posture baseline:', baseline);
    } catch (err) {
      console.error('Failed to set posture baseline:', err);
      throw err;
    }
  }

  // Break Management
  public addBreakRecord(record: {
    scheduledTime: number;
    actualTime: number | null;
    duration: number;
    wasTaken: boolean;
    wasSnoozed: boolean;
    effectivenessScore: number;
    preBreakStrain: number;
    postBreakStrain: number;
  }): void {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO break_history 
        (scheduled_time, actual_time, duration, was_taken, was_snoozed, effectiveness_score, pre_break_strain, post_break_strain)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        record.scheduledTime,
        record.actualTime,
        record.duration,
        record.wasTaken ? 1 : 0,
        record.wasSnoozed ? 1 : 0,
        record.effectivenessScore,
        record.preBreakStrain,
        record.postBreakStrain
      );
    } catch (err) {
      console.error('Failed to add break record:', err);
    }
  }

  public getBreakHistory(days: number = 7): any[] {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    const stmt = this.db.prepare('SELECT * FROM break_history WHERE scheduled_time > ? ORDER BY scheduled_time DESC');
    return stmt.all(since) as any[];
  }

  public getBreakStats(days: number = 7): {
    totalScheduled: number;
    totalTaken: number;
    totalSnoozed: number;
    totalSkipped: number;
    avgEffectiveness: number;
    avgDuration: number;
  } {
    const history = this.getBreakHistory(days);
    
    if (history.length === 0) {
      return {
        totalScheduled: 0,
        totalTaken: 0,
        totalSnoozed: 0,
        totalSkipped: 0,
        avgEffectiveness: 0,
        avgDuration: 0,
      };
    }

    const taken = history.filter(b => b.was_taken);
    const snoozed = history.filter(b => b.was_snoozed);
    const skipped = history.filter(b => !b.was_taken && !b.was_snoozed);

    return {
      totalScheduled: history.length,
      totalTaken: taken.length,
      totalSnoozed: snoozed.length,
      totalSkipped: skipped.length,
      avgEffectiveness: taken.length > 0 
        ? taken.reduce((sum, b) => sum + b.effectiveness_score, 0) / taken.length 
        : 0,
      avgDuration: taken.length > 0
        ? taken.reduce((sum, b) => sum + b.duration, 0) / taken.length
        : 0,
    };
  }
}
