export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
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
