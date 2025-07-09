export interface ResponseData {
  stimulusIndex: number;
  stimulusValue: string;
  isMatchExpected: boolean;
  userResponded: boolean;
  reactionTime: number | null;
  responseTime?: number;
}

export interface TrialSummary {
  totalStimuli: number;
  totalMatches: number;
  correctHits: number;
  falseAlarms: number;
  misses: number;
  correctRejections: number;
  accuracy: number;
  meanReactionTime: number | null;
  hitRate: number;
  falseAlarmRate: number;
}

export interface AttemptResults {
  trialId: string | number;
  attemptIndex: number;
  responses: ResponseData[];
  startTime: number;
  endTime: number;
  stimuliSequence: string[];
  summary: TrialSummary;
}

// Simplified difficulty choice data (for storage in attempts)
export interface SimplifiedDifficultyChoiceData {
  selectedChoice: "easier" | "continue" | "restart";
  mouseTrajectory: Array<{ x: number; y: number; timestamp: number }>;
  initiationTime: number;
  totalTime: number;
}

export interface TrialResults {
  stimuliSequence: string[];
  totalAttempts: number;
  overallAccuracy: number;
  // Array of attempts, each attempt is an object with the following properties:
  attempts: Array<{
    attemptIndex: number;
    responses: ResponseData[];
    startTime: number;
    endTime: number;
    isEasierSequence: boolean;
    difficultyChoiceData?: SimplifiedDifficultyChoiceData;
  }>;
  // summary of the trial (all attempts)
  summary: TrialSummary;
}

export interface NbackDifficultyChoiceData {
  timeStamp: string;
  trialId: number;
  trialResults: TrialResults;
  currentLevel: number;
  selectedChoice: "easier" | "continue";
  mouseTrajectory: Array<{ x: number; y: number; timestamp: number }>;
  initiationTime: number;
  totalTime: number;
  trialStartTime: number;
}

export interface NbackDifficultyRestartData {
  timeStamp: string;
  trialId: number;
  trialResults: TrialResults;
  currentLevel: number;
  selectedChoice: "easier" | "restart";
  mouseTrajectory: Array<{ x: number; y: number; timestamp: number }>;
  initiationTime: number;
  totalTime: number;
  trialStartTime: number;
}

export interface SequenceLevel {
  level: number;
  uniqueId: string;
  N: number;
  stimulusTime: number;
  intertrialInterval: number;
  sequenceLength: number;
  description: string;
  matches: number[];
}

export interface TaskState {
  currentTrialNumber: number;
  sequenceOrder: SequenceLevel[];
  sessionId: string;
}

export type TaskPhase =
  | "trial"
  | "difficulty"
  | "difficulty_restart"
  | "auto_restart"
  | "completed";

export interface TrainingLevel {
  level: number;
  N: number;
  stimulusTime: number;
  intertrialInterval: number;
  sequenceLength: number;
  description: string;
  matches: number[];
}
