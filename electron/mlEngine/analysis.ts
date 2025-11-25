import { PostureState, EyeState } from '../../models/types';

// Keypoint indices for MoveNet
export const KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
};

// FaceMesh keypoints for eyes (approximate indices for 468 model)
// Left Eye
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
// Right Eye
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

export interface Keypoint {
  y: number;
  x: number;
  score: number;
  name?: string;
}

export function calculatePostureMetrics(keypoints: Keypoint[]): {
  postureScore: number;
  postureState: PostureState;
  neckAngle: number;
} {
  const leftEar = keypoints[KEYPOINTS.LEFT_EAR];
  const rightEar = keypoints[KEYPOINTS.RIGHT_EAR];
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
  const nose = keypoints[KEYPOINTS.NOSE];

  // Check confidence
  const minConfidence = 0.3;
  if (
    leftShoulder.score < minConfidence ||
    rightShoulder.score < minConfidence ||
    (leftEar.score < minConfidence && rightEar.score < minConfidence)
  ) {
    return { postureScore: 0, postureState: 'OK', neckAngle: 0 }; // Not enough data
  }

  // Calculate midpoint of shoulders
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

  // Calculate midpoint of ears (or use nose if ears not visible)
  let headX = nose.x;
  let headY = nose.y;
  
  if (leftEar.score > minConfidence && rightEar.score > minConfidence) {
    headX = (leftEar.x + rightEar.x) / 2;
    headY = (leftEar.y + rightEar.y) / 2;
  } else if (leftEar.score > minConfidence) {
    headX = leftEar.x;
    headY = leftEar.y;
  } else if (rightEar.score > minConfidence) {
    headX = rightEar.x;
    headY = rightEar.y;
  }

  // Calculate angle between vertical line and line connecting shoulder-mid to head-mid
  // Vertical line is (0, 1) vector
  // Head-Shoulder vector is (headX - shoulderMidX, headY - shoulderMidY)
  // Note: Y increases downwards in image coordinates
  
  const dx = headX - shoulderMidX;
  const dy = headY - shoulderMidY; // Should be negative if head is above shoulders

  // Angle in degrees relative to vertical
  // atan2(dx, -dy) gives angle from "up" vector
  const angleRad = Math.atan2(dx, -dy);
  const angleDeg = angleRad * (180 / Math.PI);

  // Simple heuristic:
  // 0 deg = perfect upright
  // > 15-20 deg = forward head posture (slouching)
  
  const absAngle = Math.abs(angleDeg);
  
  // Normalize score: 1.0 = perfect (0 deg), 0.0 = terrible (> 45 deg)
  const postureScore = Math.max(0, 1 - (absAngle / 45));

  let postureState: PostureState = 'GOOD';
  if (absAngle > 30) {
    postureState = 'BAD';
  } else if (absAngle > 15) {
    postureState = 'OK';
  }

  return {
    postureScore,
    postureState,
    neckAngle: angleDeg,
  };
}

function calculateEAR(landmarks: number[], indices: number[]): number {
  // landmarks is flat array [x, y, z, x, y, z, ...]
  // indices are 0-based landmark IDs
  
  const getPoint = (idx: number) => ({
    x: landmarks[idx * 3],
    y: landmarks[idx * 3 + 1]
  });

  // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
  // Indices map: p1=0, p2=1, p3=2, p4=3, p5=4, p6=5
  
  const p1 = getPoint(indices[0]);
  const p2 = getPoint(indices[1]);
  const p3 = getPoint(indices[2]);
  const p4 = getPoint(indices[3]);
  const p5 = getPoint(indices[4]);
  const p6 = getPoint(indices[5]);

  const dist = (a: {x:number, y:number}, b: {x:number, y:number}) => 
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

  const numerator = dist(p2, p6) + dist(p3, p5);
  const denominator = 2 * dist(p1, p4);

  return numerator / denominator;
}

export function calculateEyeMetrics(faceLandmarks: number[]): {
  eyeState: EyeState;
  eyeStrainScore: number;
  ear: number;
} {
  // Check if we have enough landmarks (468 * 3 = 1404)
  if (faceLandmarks.length < 1404) {
    return { eyeState: 'OK', eyeStrainScore: 0, ear: 0 };
  }

  const leftEAR = calculateEAR(faceLandmarks, LEFT_EYE_INDICES);
  const rightEAR = calculateEAR(faceLandmarks, RIGHT_EYE_INDICES);
  const avgEAR = (leftEAR + rightEAR) / 2;

  // Thresholds
  // Normal EAR is usually > 0.25
  // Blink/Closed is < 0.2
  
  let eyeState: EyeState = 'OK';
  let eyeStrainScore = 0;

  if (avgEAR < 0.2) {
    // Eyes closed or blinking
    // For now, just show as strained if closed for too long (handled by state machine in MLEngine)
    // But for single frame, we just report openness
    eyeStrainScore = 1.0; 
  } else if (avgEAR < 0.25) {
    eyeState = 'STRAINED';
    eyeStrainScore = 0.5;
  }

  return {
    eyeState,
    eyeStrainScore,
    ear: avgEAR,
  };
}
