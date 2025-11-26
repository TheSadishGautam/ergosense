export interface StretchExercise {
  id: string;
  name: string;
  description: string;
  duration: number; // seconds
  instructions: string[];
  targetArea: 'neck' | 'shoulders' | 'eyes' | 'back' | 'wrists';
  difficulty: 'easy' | 'medium';
  animation?: string; // emoji or icon to show
}

export const STRETCH_ROUTINES: StretchExercise[] = [
  {
    id: 'neck-tilt',
    name: 'Neck Tilt Stretch',
    description: 'Gentle neck stretch to relieve tension',
    duration: 20,
    targetArea: 'neck',
    difficulty: 'easy',
    animation: '🧘',
    instructions: [
      'Sit up straight with shoulders relaxed',
      'Slowly tilt your head to the right, bringing ear toward shoulder',
      'Hold for 10 seconds',
      'Return to center and repeat on left side',
      'Keep shoulders down and relaxed throughout',
    ],
  },
  {
    id: 'shoulder-rolls',
    name: 'Shoulder Rolls',
    description: 'Release shoulder tension and improve circulation',
    duration: 15,
    targetArea: 'shoulders',
    difficulty: 'easy',
    animation: '💪',
    instructions: [
      'Sit or stand with arms at your sides',
      'Roll shoulders backward in a circular motion (5 times)',
      'Roll shoulders forward in a circular motion (5 times)',
      'Keep movements slow and controlled',
      'Breathe deeply throughout',
    ],
  },
  {
    id: 'eye-palming',
    name: 'Eye Palming',
    description: 'Reduce eye strain and fatigue',
    duration: 30,
    targetArea: 'eyes',
    difficulty: 'easy',
    animation: '👀',
    instructions: [
      'Rub your palms together to generate warmth',
      'Gently cup your palms over closed eyes',
      'Don\'t press on your eyes, just cover them',
      'Relax and breathe deeply for 30 seconds',
      'Remove hands slowly and blink a few times',
    ],
  },
  {
    id: '20-20-20-rule',
    name: '20-20-20 Rule',
    description: 'Give your eyes a break from screen time',
    duration: 20,
    targetArea: 'eyes',
    difficulty: 'easy',
    animation: '🔭',
    instructions: [
      'Look away from your screen',
      'Focus on something 20 feet (6 meters) away',
      'Hold your gaze for 20 seconds',
      'Blink naturally during this time',
      'Return to work feeling refreshed',
    ],
  },
  {
    id: 'upper-back-stretch',
    name: 'Upper Back Stretch',
    description: 'Release tension between shoulder blades',
    duration: 20,
    targetArea: 'back',
    difficulty: 'easy',
    animation: '🤸',
    instructions: [
      'Sit up straight in your chair',
      'Clasp hands together and extend arms forward',
      'Round your upper back, pushing hands away',
      'Feel the stretch between shoulder blades',
      'Hold for 15 seconds, then release',
    ],
  },
  {
    id: 'wrist-flexion',
    name: 'Wrist Flexion Stretch',
    description: 'Prevent wrist strain from typing',
    duration: 15,
    targetArea: 'wrists',
    difficulty: 'easy',
    animation: '✋',
    instructions: [
      'Extend right arm forward, palm up',
      'Use left hand to gently pull fingers back',
      'Hold for 10 seconds',
      'Flip palm down and pull fingers down',
      'Repeat on left wrist',
    ],
  },
];

// Get a random selection of stretches for a quick routine
export function getStretchRoutine(count: number = 3): StretchExercise[] {
  const shuffled = [...STRETCH_ROUTINES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Get stretches for a specific target area
export function getStretchesByArea(area: StretchExercise['targetArea']): StretchExercise[] {
  return STRETCH_ROUTINES.filter(stretch => stretch.targetArea === area);
}

// Calculate total duration for a routine
export function calculateRoutineDuration(exercises: StretchExercise[]): number {
  return exercises.reduce((total, ex) => total + ex.duration, 0);
}
