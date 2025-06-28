export interface TrialResults {
  trialId: string | number;
  stimuliSequence: string[];
  responses: Array<{
    stimulusIndex: number;
    stimulusValue: string;
    isMatchExpected: boolean;
    userResponded: boolean;
    reactionTime: number | null;
    responseTime?: number;
  }>;
  summary: {
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
  };
}

export interface ResponseData {
  stimulusIndex: number;
  stimulusValue: string;
  isMatchExpected: boolean;
  userResponded: boolean;
  reactionTime: number | null;
  responseTime?: number;
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

export interface BlockSequence {
  blockNumber: number;
  difficulty: "medium" | "hard"; // "2-back (Medium)" or "3-back (Hard)"
  levelIndex: number; // Index in levelsConfig.nbackLevels
}

export interface TaskState {
  currentTrialNumber: number;
  currentBlockIndex: number;
  blockSequence: BlockSequence[];
  trialInCurrentBlock: number;
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
}
