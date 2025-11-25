import { FrameMessage, LiveState } from '../../models/types';
import { PoseModel } from './poseModel';
import { FaceModel } from './faceModel';
import { calculatePostureMetrics, calculateEyeMetrics } from './analysis';
import { MetricStore } from '../db/store';
import { NotificationManager } from '../services/NotificationManager';

export class MLEngine {
  private poseModel: PoseModel;
  private faceModel: FaceModel;
  private lastState: Partial<LiveState> = {
    postureState: 'OK',
    postureScore: 1,
    eyeState: 'OK',
    eyeStrainScore: 0,
    isUserPresent: false,
  };

  private lastPersonDetectedTime: number = 0;
  private readonly PRESENCE_TIMEOUT_MS = 5000; // 5 seconds without detection = away

  private earBuffer: number[] = [];
  private readonly EAR_BUFFER_SIZE = 3; // Reduced from 10 to capture quick blinks

  // Database & Aggregation
  private db: MetricStore;
  private lastFlushTime: number = Date.now();
  private readonly FLUSH_INTERVAL = 60 * 1000; // 1 minute
  private postureScoreBuffer: number[] = [];
  private recentStrainScores: number[] = [];
  private eyeStrainScoreBuffer: number[] = []; // For DB flushing
  private blinkCountInInterval: number = 0;
  
  // History Buffer for Notifications (stores 1-second averages)
  // We want up to 15 minutes of history. 15 * 60 = 900 seconds.
  private historyBuffer: { timestamp: number; posture: number; eye: number }[] = [];
  private readonly MAX_HISTORY_SECONDS = 900; 
  private currentSecondAccumulator: { posture: number[]; eye: number[] } = { posture: [], eye: [] };
  private lastSecondTimestamp: number = Date.now();

  // Notification Manager
  private notificationManager: NotificationManager;

  constructor() {
    this.poseModel = new PoseModel();
    this.poseModel.load();
    this.faceModel = new FaceModel();
    this.faceModel.load();
    this.db = new MetricStore();
    
    // Initialize notification manager with settings from DB
    const settings = this.db.getNotificationSettings();
    this.notificationManager = new NotificationManager(settings);
  }

  public getStore() {
    return this.db;
  }

  public async processFrame(frame: FrameMessage): Promise<Partial<LiveState>> {
    const keypoints = await this.poseModel.estimatePose(frame);
    // Pass keypoints to face model for cropping
    const faceLandmarks = await this.faceModel.estimateFace(frame, keypoints);
    
    if (keypoints.length > 0) {
      const { postureScore, postureState } = calculatePostureMetrics(keypoints);
      
      this.lastState = {
        ...this.lastState,
        postureScore,
        postureState,
      };
      
      this.postureScoreBuffer.push(postureScore);
      this.currentSecondAccumulator.posture.push(postureScore);
      this.lastPersonDetectedTime = Date.now();
    } else {
       // No body detected
    }

    if (faceLandmarks.length > 0) {
      const { ear } = calculateEyeMetrics(faceLandmarks);
      
      // Smooth EAR
      this.earBuffer.push(ear);
      if (this.earBuffer.length > this.EAR_BUFFER_SIZE) {
        this.earBuffer.shift();
      }
      const smoothedEAR = this.earBuffer.reduce((a, b) => a + b, 0) / this.earBuffer.length;

      // Blink Detection Logic
      this.detectBlink(smoothedEAR);

      // Eye Strain Logic
      // Instead of instantaneous strain, we look for sustained low EAR (squinting/drowsiness)
      // We use a rolling average of EAR over the last few seconds to determine strain
      // Normal blink = momentary dip. Squint/Sleep = sustained dip.
      
      // Calculate instantaneous strain score
      let instantStrain = 0;
      if (smoothedEAR < 0.22) {
        instantStrain = 1.0; // Closed/Very Strained
      } else if (smoothedEAR < 0.26) {
        instantStrain = 0.5; // Warning
      }

      this.recentStrainScores.push(instantStrain);
      // Keep buffer size reasonable (e.g., 30 frames ~ 1-2 seconds depending on FPS)
      // If FPS is ~10, 30 frames is 3 seconds.
      if (this.recentStrainScores.length > 30) {
        this.recentStrainScores.shift();
      }

      // Calculate smoothed strain score
      const avgStrain = this.recentStrainScores.reduce((a, b) => a + b, 0) / this.recentStrainScores.length;
      
      let eyeState: 'OK' | 'STRAINED' = 'OK';
      let eyeStrainScore = avgStrain;

      if (avgStrain > 0.6) {
        eyeState = 'STRAINED';
      }

      this.lastState = {
        ...this.lastState,
        eyeState,
        eyeStrainScore,
        blinkRate: this.calculateBlinkRate(),
      };
      
      // Add to DB buffer
      this.eyeStrainScoreBuffer.push(eyeStrainScore);
      this.currentSecondAccumulator.eye.push(eyeStrainScore);
      this.lastPersonDetectedTime = Date.now();
    }
    
    // Update presence state
    const now = Date.now();
    const isUserPresent = (now - this.lastPersonDetectedTime) < this.PRESENCE_TIMEOUT_MS;
    
    this.lastState = {
        ...this.lastState,
        isUserPresent
    };

    // Update history buffer every second
    this.updateHistoryBuffer();

    // Check and trigger notifications
    this.checkAndSendNotifications();
    
    this.checkFlush();

    return this.lastState;
  }
  
  private updateHistoryBuffer() {
    const now = Date.now();
    if (now - this.lastSecondTimestamp >= 1000) {
      // Calculate averages for the past second
      let avgPosture = 0;
      if (this.currentSecondAccumulator.posture.length > 0) {
        avgPosture = this.currentSecondAccumulator.posture.reduce((a, b) => a + b, 0) / this.currentSecondAccumulator.posture.length;
      } else {
        // If no data (e.g. no person), we might want to skip or carry forward?
        // For now, let's just not add to history if no person detected, effectively pausing the window.
        // Or we can add null/undefined to indicate gap.
        // Given we have presence detection, we can just skip.
      }

      let avgEye = 0;
      if (this.currentSecondAccumulator.eye.length > 0) {
        avgEye = this.currentSecondAccumulator.eye.reduce((a, b) => a + b, 0) / this.currentSecondAccumulator.eye.length;
      }

      if (this.currentSecondAccumulator.posture.length > 0) {
          this.historyBuffer.push({
              timestamp: now,
              posture: avgPosture,
              eye: avgEye
          });
      }

      // Prune old history
      const cutoff = now - (this.MAX_HISTORY_SECONDS * 1000);
      this.historyBuffer = this.historyBuffer.filter(h => h.timestamp > cutoff);

      // Reset accumulators
      this.currentSecondAccumulator = { posture: [], eye: [] };
      this.lastSecondTimestamp = now;
    }
  }

  private checkAndSendNotifications() {
    // 1. Check Presence
    const now = Date.now();
    if (now - this.lastPersonDetectedTime > this.PRESENCE_TIMEOUT_MS) {
      // User is away, do not send notifications
      return;
    }

    const elapsed = now - this.startTime;
    
    // Require at least 5 minutes of data before sending alerts? 
    // Or maybe start with 1 minute for quick feedback, then switch to 5?
    // User requested 5-15 minutes. Let's stick to 5 minutes minimum.
    const MIN_OBSERVATION_TIME = 5 * 60 * 1000; 
    
    if (elapsed < MIN_OBSERVATION_TIME) {
      return;
    }

    // 2. Use Rolling Averages for Notifications (5 Minute Window)
    const WINDOW_SECONDS = 5 * 60;
    const windowCutoff = now - (WINDOW_SECONDS * 1000);
    const windowData = this.historyBuffer.filter(h => h.timestamp > windowCutoff);

    if (windowData.length < WINDOW_SECONDS * 0.5) {
        // Not enough data in the window (e.g. user was away for most of it)
        return;
    }

    const avgPosture = windowData.reduce((sum, h) => sum + h.posture, 0) / windowData.length;
    const avgEyeStrain = windowData.reduce((sum, h) => sum + h.eye, 0) / windowData.length;
    const blinkRate = this.lastState.blinkRate; 

    if (avgPosture !== undefined) {
      this.notificationManager.sendPostureAlert(avgPosture);
    }
    
    if (avgEyeStrain !== undefined) {
      this.notificationManager.sendEyeStrainAlert(avgEyeStrain);
    }
    
    if (blinkRate !== undefined) {
      this.notificationManager.sendBlinkAlert(blinkRate);
    }
  }
  
  public getNotificationManager() {
    return this.notificationManager;
  }

  // Blink Detection State
  private blinkState: 'OPEN' | 'CLOSING' | 'CLOSED' | 'OPENING' = 'OPEN';
  private blinkTimestamps: number[] = [];
  private readonly BLINK_WINDOW_MS = 60000; // 1 minute
  private readonly EAR_BLINK_THRESH = 0.24; // Increased from 0.22
  private readonly EAR_OPEN_THRESH = 0.28; // Increased from 0.26

  private detectBlink(ear: number) {
    const now = Date.now();
    // console.log(`EAR: ${ear.toFixed(3)} | State: ${this.blinkState}`);

    switch (this.blinkState) {
      case 'OPEN':
        if (ear < this.EAR_BLINK_THRESH) {
          this.blinkState = 'CLOSING';
        }
        break;
      case 'CLOSING':
        if (ear < this.EAR_BLINK_THRESH) {
          this.blinkState = 'CLOSED';
        } else if (ear > this.EAR_OPEN_THRESH) {
          this.blinkState = 'OPEN'; // False alarm
        }
        break;
      case 'CLOSED':
        if (ear > this.EAR_BLINK_THRESH) {
          this.blinkState = 'OPENING';
        }
        break;
      case 'OPENING':
        if (ear > this.EAR_OPEN_THRESH) {
          this.blinkState = 'OPEN';
          this.blinkTimestamps.push(now);
          this.blinkCountInInterval++;
        } else if (ear < this.EAR_BLINK_THRESH) {
          this.blinkState = 'CLOSED'; // Re-closed
        }
        break;
    }
  }

  private startTime: number = Date.now();

  private calculateBlinkRate(): number {
    const now = Date.now();
    // Remove old blinks
    this.blinkTimestamps = this.blinkTimestamps.filter(t => now - t < this.BLINK_WINDOW_MS);
    
    const count = this.blinkTimestamps.length;
    const elapsed = now - this.startTime;

    // If less than 1 minute has passed, extrapolate the rate
    // But only if we have at least 10 seconds of data to avoid noise
    if (elapsed < this.BLINK_WINDOW_MS) {
      if (elapsed < 10000) {
        return 0; // Too early to tell
      }
      // Extrapolate: (count / elapsed_ms) * 60000
      return Math.round((count / elapsed) * 60000);
    }

    return count;
  }

  private checkFlush() {
    const now = Date.now();
    if (now - this.lastFlushTime > this.FLUSH_INTERVAL) {
      this.flushMetrics();
      this.lastFlushTime = now;
    }
  }

  private flushMetrics() {
    // Calculate averages
    let avgPosture = 0;
    if (this.postureScoreBuffer.length > 0) {
      avgPosture = this.postureScoreBuffer.reduce((a, b) => a + b, 0) / this.postureScoreBuffer.length;
    }

    let avgEyeStrain = 0;
    if (this.eyeStrainScoreBuffer.length > 0) {
      avgEyeStrain = this.eyeStrainScoreBuffer.reduce((a, b) => a + b, 0) / this.eyeStrainScoreBuffer.length;
    }

    // Write to DB
    if (this.postureScoreBuffer.length > 0) {
      this.db.addMetric('POSTURE', avgPosture);
    }

    if (this.eyeStrainScoreBuffer.length > 0) {
      this.db.addMetric('EYE', avgEyeStrain);
    }

    // Log Presence (1 if present in last interval, 0 if not)
    // We can use lastPersonDetectedTime to determine if user was present during this interval
    // A simple heuristic: if lastPersonDetectedTime is within the flush interval, we count as present.
    const wasPresent = (Date.now() - this.lastPersonDetectedTime) < this.FLUSH_INTERVAL;
    this.db.addMetric('PRESENCE', wasPresent ? 1 : 0);

    // Only log blink rate if user was present
    if (wasPresent) {
      this.db.addMetric('BLINK', this.blinkCountInInterval);
    }

    console.log(`Flushed metrics: Posture=${avgPosture.toFixed(2)}, Eye=${avgEyeStrain.toFixed(2)}, Blinks=${this.blinkCountInInterval}, Present=${wasPresent}`);

    // Reset buffers
    this.postureScoreBuffer = [];
    this.eyeStrainScoreBuffer = [];
    this.blinkCountInInterval = 0;
  }
}
