import { auth, storage } from "@/config/firebase";
import {
  NbackDifficultyChoiceData,
  TaskState,
  TrialResults,
} from "@/types/nback";
import { ref, uploadString } from "firebase/storage";

interface TrialDataToSave {
  // Basic trial information
  trialResults: TrialResults; // This now contains all attempts with full data
  trialStartTime: number;
  trialCompletionTime: string;
  currentTrialNumber: number;

  // Trial information
  trialUniqueId: string | null; // From levels.json

  // Additional context
  wasRestarted: boolean;

  // Reward information
  reward: number;
  currentReward: number;
}

interface SaveTrialDataParams {
  trialResults: TrialResults;
  taskState: TaskState;
  attemptNumber?: number;
  isEasierSequence?: boolean;
  wasRestarted?: boolean;
  difficultyChoiceData?: NbackDifficultyChoiceData;
  trialUniqueId?: string | null;
  reward: number;
  currentReward: number;
}

export const saveTrialData = async (
  params: SaveTrialDataParams
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const timestamp = new Date().toISOString();
    const trialNumber = params.taskState.currentTrialNumber;

    // Calculate trial duration from attempts
    const firstAttempt = params.trialResults.attempts[0];
    const lastAttempt =
      params.trialResults.attempts[params.trialResults.attempts.length - 1];
    const trialDuration = lastAttempt
      ? lastAttempt.endTime - firstAttempt.startTime
      : 0;

    // Create comprehensive trial data with all attempts included
    const trialData: TrialDataToSave = {
      // Basic trial information with all attempts
      trialResults: params.trialResults, // Contains full trial data with all attempts
      trialStartTime: firstAttempt.startTime,
      trialCompletionTime: timestamp,
      currentTrialNumber: trialNumber,

      // Trial information
      trialUniqueId: params.trialUniqueId || null,

      // Additional context
      wasRestarted: params.wasRestarted || false,

      // Reward information
      reward: params.reward,
      currentReward: params.currentReward,
    };

    // Save to Firebase Storage with detailed filename
    const storagePath = `participants/${user.uid}/trials`;
    const fileName = `trial_${params.trialUniqueId}_${trialNumber}.json`;
    const storageRef = ref(storage, `${storagePath}/${fileName}`);

    await uploadString(storageRef, JSON.stringify(trialData, null, 2), "raw");

    console.log(`Trial data saved to Storage: ${fileName}`);
    console.log(`- Total attempts: ${params.trialResults.totalAttempts}`);
    console.log(
      `- Overall accuracy: ${(
        params.trialResults.overallAccuracy * 100
      ).toFixed(1)}%`
    );
    console.log(`- Trial duration: ${trialDuration}ms`);
    console.log(`- Reward earned: ${params.reward}`);
    console.log(`- Current total reward: ${params.currentReward}`);

    // Log attempt details
    params.trialResults.attempts.forEach((attempt, index) => {
      console.log(
        `  Attempt ${index + 1}: ${attempt.responses.length} responses, ${
          attempt.endTime - attempt.startTime
        }ms`
      );
    });
  } catch (error) {
    console.error("Error saving trial data:", error);
    throw error;
  }
};

// Save session summary data at the end - ONLY to Storage
export const saveSessionSummary = async (
  taskState: TaskState,
  allTrialResults: TrialResults[],
  allDifficultyChoices: NbackDifficultyChoiceData[]
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const timestamp = new Date().toISOString();

    // Calculate comprehensive session statistics
    const totalAttempts = allTrialResults.reduce(
      (sum, trial) => sum + trial.totalAttempts,
      0
    );

    // Calculate total trial duration from all attempts
    const totalTrialDuration = allTrialResults.reduce((sum, trial) => {
      if (trial.attempts.length === 0) return sum;
      const firstAttempt = trial.attempts[0];
      const lastAttempt = trial.attempts[trial.attempts.length - 1];
      return sum + (lastAttempt.endTime - firstAttempt.startTime);
    }, 0);

    const sessionSummary = {
      sessionId: taskState.sessionId,
      participantId: user.uid,
      sessionCompletionTime: timestamp,

      // Sequence order information
      sequenceOrder: taskState.sequenceOrder,

      totalTrials: allTrialResults.length,
      totalAttempts: totalAttempts,
      totalSessionDuration: totalTrialDuration,

      // Calculate summary statistics
      finalStats: {
        averageAccuracy:
          allTrialResults.reduce(
            (sum, trial) => sum + trial.summary.accuracy,
            0
          ) / allTrialResults.length,
        averageOverallAccuracy:
          allTrialResults.reduce(
            (sum, trial) => sum + trial.overallAccuracy,
            0
          ) / allTrialResults.length,
        totalCorrectHits: allTrialResults.reduce(
          (sum, trial) => sum + trial.summary.correctHits,
          0
        ),
        totalFalseAlarms: allTrialResults.reduce(
          (sum, trial) => sum + trial.summary.falseAlarms,
          0
        ),
        averageReactionTime:
          allTrialResults
            .filter((trial) => trial.summary.meanReactionTime !== null)
            .reduce(
              (sum, trial) => sum + (trial.summary.meanReactionTime || 0),
              0
            ) /
          allTrialResults.filter(
            (trial) => trial.summary.meanReactionTime !== null
          ).length,
        averageAttemptsPerTrial: totalAttempts / allTrialResults.length,
        trialsWithMultipleAttempts: allTrialResults.filter(
          (trial) => trial.totalAttempts > 1
        ).length,
        totalReward: allTrialResults.reduce(
          (sum, trial) => sum + trial.reward,
          0
        ),
        finalReward:
          allTrialResults.length > 0
            ? allTrialResults[allTrialResults.length - 1].currentReward
            : 0,
      },

      // Full trial data with all attempts
      allTrialResults,
      allDifficultyChoices,
      timestamp,
    };

    // Save to Firebase Storage in sessionInfo directory
    const storagePath = `participants/${user.uid}/sessionInfo`;
    const fileName = `session_${taskState.sessionId}_summary.json`;
    const storageRef = ref(storage, `${storagePath}/${fileName}`);

    await uploadString(
      storageRef,
      JSON.stringify(sessionSummary, null, 2),
      "raw"
    );

    console.log("Session summary saved to Storage:", fileName);
    console.log(`- Total trials: ${allTrialResults.length}`);
    console.log(`- Total attempts: ${totalAttempts}`);
    console.log(
      `- Average attempts per trial: ${(
        totalAttempts / allTrialResults.length
      ).toFixed(1)}`
    );
  } catch (error) {
    console.error("Error saving session summary:", error);
    throw error;
  }
};
