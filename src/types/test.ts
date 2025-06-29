export interface TrialResults {
  trialId: string | number;
  stimuliSequence: string[];
  totalAttempts: number;
  overallAccuracy: number;
  startTime: number;
  endTime: number;
  // Array of attempts, each attempt is an object with the following properties:
  attempts: Array<{
    trialId: string | number;
    attemptIndex: number;
    responses: Array<{
      stimulusIndex: number;
      stimulusValue: string;
      isMatchExpected: boolean;
      userResponded: boolean;
      reactionTime: number | null;
      responseTime?: number;
    }>;
    startTime: number;
    endTime: number;
  }>;
  // summary of the trial (all attempts)
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
