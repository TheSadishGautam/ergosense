import { FrameMessage, LiveState, PostureBaseline, PostureZone } from '../../models/types';
import { PoseModel } from './poseModel';
import { FaceModel } from './faceModel';
import { calculatePostureMetrics, calculateEyeMetrics, detectPostureZone, calculateHeadDirection } from './analysis';
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

  // Calibration state
  private isCalibrating: boolean = false;
  private calibrationData: {
    shoulderAngles: number[];
    neckAngles: number[];
    headTilts: number[];
    distances: number[];
  } = { shoulderAngles: [], neckAngles: [], headTilts: [], distances: [] };
  private calibrationStartTime: number = 0;
  private readonly CALIBRATION_DURATION_MS = 60000; // 60 seconds

  // Zone tracking
  private zoneDistribution: Map<PostureZone, number> = new Map();
  private lastZoneFlushTime: number = Date.now();
  private readonly ZONE_FLUSH_INTERVAL = 60 * 1000; // 1 minute

  // Monitor gaze tracking
  private monitorGazeDistribution: Map<string, number> = new Map([
    ['CENTER', 0],
    ['LEFT', 0],
    ['RIGHT', 0]
  ]);
  private lastMonitorPosition: string | null = null;
  private monitorSwitches: number = 0;
  private lastMonitorFlushTime: number = Date.now();
  private readonly MONITOR_FLUSH_INTERVAL = 60 * 1000; // 1 minute


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
      // Process calibration data if calibrating
      this.processCalibrationData(keypoints);
      
      const { postureScore, postureState } = calculatePostureMetrics(keypoints);
      
      // Detect posture zone
      const { zone } = detectPostureZone(keypoints);
      this.trackZone(zone);
      
      // Detect head direction for multi-monitor awareness
      const { direction, confidence } = calculateHeadDirection(keypoints);
      if (confidence > 0.5) {
        this.trackMonitorGaze(direction);
      }
      
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
    
    // Also check zone flush
    if (now - this.lastZoneFlushTime > this.ZONE_FLUSH_INTERVAL) {
      this.flushZoneData();
      this.lastZoneFlushTime = now;
    }
    
    // Also check monitor flush
    if (now - this.lastMonitorFlushTime > this.MONITOR_FLUSH_INTERVAL) {
      this.flushMonitorData();
      this.lastMonitorFlushTime = now;
    }
  }

  private trackZone(zone: PostureZone) {
    const current = this.zoneDistribution.get(zone) || 0;
    this.zoneDistribution.set(zone, current + 1);
    
    // Flush zone data periodically
    const now = Date.now();
    if (now - this.lastZoneFlushTime >= this.ZONE_FLUSH_INTERVAL) {
      this.flushZoneData();
      this.lastZoneFlushTime = now;
    }
  }

  private trackMonitorGaze(position: string) {
    // Track time in each position
    const current = this.monitorGazeDistribution.get(position) || 0;
    this.monitorGazeDistribution.set(position, current + 1);
    
    // Track switches (when position changes)
    if (this.lastMonitorPosition && this.lastMonitorPosition !== position) {
      this.monitorSwitches++;
    }
    this.lastMonitorPosition = position;
    
    // Flush monitor data periodically
    const now = Date.now();
    if (now - this.lastMonitorFlushTime >= this.MONITOR_FLUSH_INTERVAL) {
      this.flushMonitorData();
      this.lastMonitorFlushTime = now;
    }
  }

  private flushZoneData() {
    if (this.zoneDistribution.size === 0) return;

    // Calculate total samples
    let total = 0;
    this.zoneDistribution.forEach(count => total += count);

    if (total === 0) return;

    // Store zone distribution in database
    const zoneData: any = {};
    this.zoneDistribution.forEach((count, zone) => {
      zoneData[zone] = {
        count,
        percentage: (count / total) * 100
      };
    });

    this.db.addMetric('ZONE', total, zoneData);
    
    console.log('Flushed zone distribution:', zoneData);
    
    // Reset distribution for next interval
    this.zoneDistribution.clear();
  }

  private flushMonitorData() {
    if (this.monitorGazeDistribution.size === 0) return;

    // Calculate total samples
    let total = 0;
    this.monitorGazeDistribution.forEach(count => total += count);

    if (total === 0) return;

    // Store monitor gaze distribution in database
    const monitorData: any = {
      center: this.monitorGazeDistribution.get('CENTER') || 0,
      left: this.monitorGazeDistribution.get('LEFT') || 0,
      right: this.monitorGazeDistribution.get('RIGHT') || 0,
      switches: this.monitorSwitches,
      total,
    };

    // Calculate percentages
    monitorData.centerPercentage = (monitorData.center / total) * 100;
    monitorData.leftPercentage = (monitorData.left / total) * 100;
    monitorData.rightPercentage = (monitorData.right / total) * 100;

    this.db.addMetric('MONITOR_GAZE', total, monitorData);
    
    console.log('Flushed monitor gaze distribution:', monitorData);
    
    // Reset for next interval
    this.monitorGazeDistribution.set('CENTER', 0);
    this.monitorGazeDistribution.set('LEFT', 0);
    this.monitorGazeDistribution.set('RIGHT', 0);
    this.monitorSwitches = 0;
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

  public startCalibration() {
    console.log('Starting posture calibration...');
    this.isCalibrating = true;
    this.calibrationStartTime = Date.now();
    this.calibrationData = {
      shoulderAngles: [],
      neckAngles: [],
      headTilts: [],
      distances: [],
    };
  }

  private processCalibrationData(keypoints: any[]) {
    if (!this.isCalibrating) return;

    const elapsed = Date.now() - this.calibrationStartTime;
    
    // Check if calibration is complete
    if (elapsed >= this.CALIBRATION_DURATION_MS) {
      this.completeCalibration();
      return;
    }

    // Extract calibration metrics from keypoints
    const { neckAngle } = calculatePostureMetrics(keypoints);
    
    // Calculate shoulder angle and head tilt from keypoints
    const leftShoulder = keypoints[5]; // LEFT_SHOULDER
    const rightShoulder = keypoints[6]; // RIGHT_SHOULDER
    const leftEar = keypoints[3]; // LEFT_EAR
    const rightEar = keypoints[4]; // RIGHT_EAR
    
    if (leftShoulder && rightShoulder && leftShoulder.score > 0.3 && rightShoulder.score > 0.3) {
      const shoulderAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      ) * (180 / Math.PI);
      this.calibrationData.shoulderAngles.push(shoulderAngle);
    }

    if (leftEar && rightEar && leftEar.score > 0.3 && rightEar.score > 0.3) {
      const headTilt = Math.atan2(
        rightEar.y - leftEar.y,
        rightEar.x - leftEar.x
      ) * (180 / Math.PI);
      this.calibrationData.headTilts.push(headTilt);
    }

    this.calibrationData.neckAngles.push(neckAngle);
    
    // Estimate distance (simplified - could be enhanced with more sophisticated algorithm)
    const shoulderWidth = leftShoulder && rightShoulder 
      ? Math.abs(leftShoulder.x - rightShoulder.x) 
      : 0;
    if (shoulderWidth > 0) {
      // Assume average shoulder width ~45cm, estimate distance based on pixel width
      const estimatedDistance = (45 * 640) / (shoulderWidth * 640); // rough estimate
      this.calibrationData.distances.push(Math.min(100, Math.max(30, estimatedDistance)));
    }
  }

  private completeCalibration() {
    console.log('Completing calibration...');
    this.isCalibrating = false;

    // Calculate averages
    const avgShoulder = this.calibrationData.shoulderAngles.length > 0
      ? this.calibrationData.shoulderAngles.reduce((a, b) => a + b, 0) / this.calibrationData.shoulderAngles.length
      : 0;
    
    const avgNeck = this.calibrationData.neckAngles.length > 0
      ? this.calibrationData.neckAngles.reduce((a, b) => a + b, 0) / this.calibrationData.neckAngles.length
      : 0;
    
    const avgHeadTilt = this.calibrationData.headTilts.length > 0
      ? this.calibrationData.headTilts.reduce((a, b) => a + b, 0) / this.calibrationData.headTilts.length
      : 0;
    
    const avgDistance = this.calibrationData.distances.length > 0
      ? this.calibrationData.distances.reduce((a, b) => a + b, 0) / this.calibrationData.distances.length
      : 60; // default 60cm

    const baseline: PostureBaseline = {
      timestamp: Date.now(),
      shoulderAngle: avgShoulder,
      neckAngle: avgNeck,
      headTilt: avgHeadTilt,
      distanceCm: avgDistance,
      samples: this.calibrationData.neckAngles.length,
    };

    // Save to database
    this.db.setPostureBaseline(baseline);
    console.log('Calibration complete:', baseline);
  }
}

