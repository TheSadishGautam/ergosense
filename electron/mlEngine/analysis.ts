import { PostureState, EyeState, PostureZone } from '../../models/types';

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

  // Calculate forward lean
  // In image coords: Y increases downward, X increases right
  // Good posture: head should be ABOVE and SLIGHTLY FORWARD of shoulders
  // Bad posture: head is too far forward (dx is large positive) and/or lower than shoulders (dy is positive)
  
  const dx = headX - shoulderMidX; // Horizontal offset
  const dy = headY - shoulderMidY; // Vertical offset (negative = head above shoulders, positive = head below)

  // Calculate the forward lean angle
  // We want to penalize forward head movement
  // atan2 gives us the angle of the head-shoulder vector
  let forwardAngle = 0;
  
  if (dy < 0) {
    // Head is above shoulders (normal case)
    // Calculate how far forward the head is pushed
    // Perfect posture = head directly above shoulders (dx ≈ 0)
    // Bad posture = head pushed forward significantly (large dx)
    
    const verticalDistance = Math.abs(dy);
    const horizontalDistance = Math.abs(dx);
    
    // Calculate angle from vertical
    forwardAngle = Math.atan2(horizontalDistance, verticalDistance) * (180 / Math.PI);
  } else {
    // Head is below or level with shoulders - very bad posture!
    forwardAngle = 45; // Maximum penalty
  }

  // Stricter scoring:
  // 0-5 deg = excellent (0.95-1.0)
  // 5-10 deg = good (0.80-0.95)
  // 10-20 deg = fair (0.50-0.80)
  // 20-30 deg = poor (0.20-0.50)
  // 30+ deg = terrible (0-0.20)
  
  let postureScore = 1.0;
  if (forwardAngle < 5) {
    postureScore = 0.95 + (5 - forwardAngle) * 0.01; // 0.95-1.0
  } else if (forwardAngle < 10) {
    postureScore = 0.80 + ((10 - forwardAngle) / 5) * 0.15; // 0.80-0.95
  } else if (forwardAngle < 20) {
    postureScore = 0.50 + ((20 - forwardAngle) / 10) * 0.30; // 0.50-0.80
  } else if (forwardAngle < 30) {
    postureScore = 0.20 + ((30 - forwardAngle) / 10) * 0.30; // 0.20-0.50
  } else {
    postureScore = Math.max(0, 0.20 - ((forwardAngle - 30) / 20) * 0.20); // 0-0.20
  }

  let postureState: PostureState = 'GOOD';
  if (forwardAngle > 20) {
    postureState = 'BAD';
  } else if (forwardAngle > 10) {
    postureState = 'OK';
  }

  return {
    postureScore: Math.max(0, Math.min(1, postureScore)),
    postureState,
    neckAngle: forwardAngle,
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

export function detectPostureZone(keypoints: Keypoint[]): {
  zone: PostureZone;
  tiltAngle: number;
  forwardAngle: number;
  distanceEstimate: number;
} {
  const leftEar = keypoints[KEYPOINTS.LEFT_EAR];
  const rightEar = keypoints[KEYPOINTS.RIGHT_EAR];
  const leftShoulder = keypoints[KEYPOINTS.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINTS.RIGHT_SHOULDER];
  const nose = keypoints[KEYPOINTS.NOSE];

  const minConfidence = 0.3;
  
  // Default values
  let zone: PostureZone = PostureZone.CENTER;
  let tiltAngle = 0;
  let forwardAngle = 0;
  let distanceEstimate = 60; // default 60cm

  // Need shoulders for reference
  if (leftShoulder.score < minConfidence || rightShoulder.score < minConfidence) {
    return { zone, tiltAngle, forwardAngle, distanceEstimate };
  }

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

  // Calculate head position
  let headX = nose.x;
  let headY = nose.y;
  
  if (leftEar.score > minConfidence && rightEar.score > minConfidence) {
    headX = (leftEar.x + rightEar.x) / 2;
    headY = (leftEar.y + rightEar.y) / 2;
    
    // Calculate left/right tilt from ear positions
    const earDy = rightEar.y - leftEar.y;
    const earDx = rightEar.x - leftEar.x;
    tiltAngle = Math.atan2(earDy, earDx) * (180 / Math.PI);
  }

  // Calculate forward lean
  const dx = headX - shoulderMidX;
  const dy = headY - shoulderMidY;
  
  if (dy < 0) {
    const verticalDistance = Math.abs(dy);
    const horizontalDistance = Math.abs(dx);
    forwardAngle = Math.atan2(horizontalDistance, verticalDistance) * (180 / Math.PI);
  } else {
    forwardAngle = 45; // Max if head is below shoulders
  }

  // Estimate distance from shoulder width
  const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
  if (shoulderWidth > 0) {
    // Rough estimate: assume average shoulders ~45cm, inversely proportional to pixel width
    distanceEstimate = Math.min(100, Math.max(30, (0.15 / shoulderWidth) * 60));
  }

  // Classify into zones
  // Priority: Distance > Forward > Tilt
  
  if (distanceEstimate < 40) {
    zone = PostureZone.TOO_CLOSE;
  } else if (distanceEstimate > 80) {
    zone = PostureZone.TOO_FAR;
  } else if (forwardAngle > 15) {
    zone = PostureZone.FORWARD;
  } else if (Math.abs(tiltAngle) > 15) {
    // Check if tilted left or right
    zone = tiltAngle > 0 ? PostureZone.RIGHT_TILT : PostureZone.LEFT_TILT;
  } else {
    zone = PostureZone.CENTER;
  }

  return {
    zone,
    tiltAngle,
    forwardAngle,
    distanceEstimate,
  };
}

export type HeadDirection = 'CENTER' | 'LEFT' | 'RIGHT';

export interface HeadDirectionResult {
  direction: HeadDirection;
  confidence: number;
  angle: number; // Estimated yaw angle in degrees
}

/**
 * Calculate head direction for multi-monitor awareness
 * Uses ear visibility and nose position to detect LEFT/CENTER/RIGHT turns
 */
export function calculateHeadDirection(keypoints: Keypoint[]): HeadDirectionResult {
  const leftEar = keypoints[KEYPOINTS.LEFT_EAR];
  const rightEar = keypoints[KEYPOINTS.RIGHT_EAR];
  const leftEye = keypoints[KEYPOINTS.LEFT_EYE];
  const rightEye = keypoints[KEYPOINTS.RIGHT_EYE];
  const nose = keypoints[KEYPOINTS.NOSE];
  
  const minConfidence = 0.3;
  
  // Calculate face center using eyes
  const faceCenterX = (leftEye.x + rightEye.x) / 2;
  
  // Calculate ear visibility ratio
  const leftEarVisible = leftEar.score > minConfidence;
  const rightEarVisible = rightEar.score > minConfidence;
  
  // Calculate nose offset from face center (normalized)
  const noseOffset = nose.x - faceCenterX;
  
  // Calculate ear visibility difference (higher = more visible)
  const earVisibilityDiff = rightEar.score - leftEar.score;
  
  // Estimate yaw angle based on:
  // 1. Ear visibility difference
  // 2. Nose offset from center
  
  let yawAngle = 0;
  let confidence = 0;
  
  // Primary indicator: ear visibility
  if (leftEarVisible && rightEarVisible) {
    // Both ears visible - face is mostly centered
    // Use subtle indicators
    yawAngle = earVisibilityDiff * 30; // Scale to degrees
    confidence = 0.6;
  } else if (!leftEarVisible && rightEarVisible) {
    // Only right ear visible = face turned left (right ear facing camera)
    yawAngle = -45; // Negative = left turn
    confidence = 0.9;
  } else if (leftEarVisible && !rightEarVisible) {
    // Only left ear visible = face turned right (left ear facing camera)
    yawAngle = 45; // Positive = right turn
    confidence = 0.9;
  } else {
    // Neither ear visible - face directly facing camera
    yawAngle = 0;
    confidence = 0.7;
  }
  
  // Secondary indicator: nose offset (refine the angle)
  // Nose moves opposite to head turn in image coordinates
  yawAngle += noseOffset * 100; // Scale nose offset
  
  // Determine direction based on angle
  let direction: HeadDirection = 'CENTER';
  const threshold = 20; // degrees
  
  if (yawAngle < -threshold) {
    direction = 'LEFT';
  } else if (yawAngle > threshold) {
    direction = 'RIGHT';
  }
  
  // Adjust confidence based on clarity of direction
  if (direction !== 'CENTER') {
    confidence = Math.min(1.0, confidence + 0.1);
  }
  
  return {
    direction,
    confidence: Math.max(0, Math.min(1, confidence)),
    angle: yawAngle,
  };
}
