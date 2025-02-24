export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface MathTrialData {
  timeStamp: string;
  trialId: number;
  sequence: string;
  answers: number[];
  correctAnswer: number;
  selectedAnswer: number | null;
  isCorrect: boolean;
  difficulty: string;
  mouseTrajectory: MousePosition[];
  initiationTime: number; // Time from trial start to first drag
  totalTime: number; // Time from trial start to response
  trialStartTime: number;
}

export interface DifficultyChoiceData {
  timeStamp: string;
  trialId: number;
  isCorrect: boolean;
  remaining: number;
  selectedChoice: "continue" | "easier" | null;
  revert: boolean;
  mouseTrajectory: MousePosition[];
  initiationTime: number;
  totalTime: number;
  trialStartTime: number;
}
