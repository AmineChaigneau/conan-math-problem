import { auth, storage } from "@/config/firebase";
import {
  NbackDifficultyChoiceData,
  TaskState,
  TrialResults,
} from "@/types/nback";
import { ref, uploadString } from "firebase/storage";

interface TrialDataToSave {
  // Basic trial information
  trialResults: TrialResults;
  trialCompletionTime: string;

  // Block and sequence information
  currentTrialNumber: number;
  currentBlockIndex: number;
  trialInCurrentBlock: number;
  trialUniqueId: string | null; // From levels.json

  // All attempts for this trial (including failures and successes)
  allAttempts: Array<{
    attemptNumber: number;
    trialResults: TrialResults;
    wasRestarted: boolean;
    isEasierSequence: boolean;
    difficultyChoiceData?: NbackDifficultyChoiceData;
    timestamp: string;
  }>;
}

interface SaveTrialDataParams {
  trialResults: TrialResults;
  taskState: TaskState;
  attemptNumber?: number;
  isEasierSequence?: boolean;
  wasRestarted?: boolean;
  difficultyChoiceData?: NbackDifficultyChoiceData;
  trialUniqueId?: string | null;
}

// Store attempts for each trial to accumulate them
const trialAttempts: { [trialNumber: number]: TrialDataToSave["allAttempts"] } =
  {};

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

    // Initialize attempts array for this trial if it doesn't exist
    if (!trialAttempts[trialNumber]) {
      trialAttempts[trialNumber] = [];
    }

    // Add this attempt to the trial's attempts
    trialAttempts[trialNumber].push({
      attemptNumber: params.attemptNumber || 1,
      trialResults: params.trialResults,
      wasRestarted: params.wasRestarted || false,
      isEasierSequence: params.isEasierSequence || false,
      difficultyChoiceData: params.difficultyChoiceData,
      timestamp,
    });

    // Only save when trial is actually completed (not on restarts)
    if (!params.wasRestarted) {
      const trialData: TrialDataToSave = {
        // Basic trial information
        trialResults: params.trialResults,
        trialCompletionTime: timestamp,

        // Block and sequence information
        currentTrialNumber: trialNumber,
        currentBlockIndex: params.taskState.currentBlockIndex,
        trialInCurrentBlock: params.taskState.trialInCurrentBlock,
        trialUniqueId: params.trialUniqueId || null,

        // All attempts for this trial
        allAttempts: [...trialAttempts[trialNumber]],
      };

      // Save to Firebase Storage with simplified filename
      const storagePath = `participants/${user.uid}/trials`;
      const fileName = `trial_${trialNumber}_${timestamp.replace(
        /[:.]/g,
        "-"
      )}.json`;
      const storageRef = ref(storage, `${storagePath}/${fileName}`);

      await uploadString(storageRef, JSON.stringify(trialData, null, 2), "raw");

      console.log("Trial data saved to Storage:", fileName);

      // Clear attempts for this trial after saving
      delete trialAttempts[trialNumber];
    }
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

    const sessionSummary = {
      sessionId: taskState.sessionId,
      participantId: user.uid,
      sessionCompletionTime: timestamp,

      // Levels order information
      blockSequence: taskState.blockSequence,
      levelsOrder: taskState.blockSequence.map((block) => ({
        blockNumber: block.blockNumber,
        difficulty: block.difficulty,
        levelIndex: block.levelIndex,
      })),

      totalTrials: allTrialResults.length,

      // Calculate summary statistics
      finalStats: {
        averageAccuracy:
          allTrialResults.reduce(
            (sum, trial) => sum + trial.summary.accuracy,
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
      },

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
  } catch (error) {
    console.error("Error saving session summary:", error);
    throw error;
  }
};

// Save training data - ONLY to Storage
export const saveTrainingData = async (
  trialResults: TrialResults,
  trainingLevel: {
    level: number;
    N: number;
    description: string;
    stimulusTime: number;
    intertrialInterval: number;
    sequenceLength: number;
  },
  attemptNumber: number,
  gameMode: string
): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const timestamp = new Date().toISOString();

    const trainingData = {
      // Basic trial information
      trialResults,
      participantId: user.uid,
      trialCompletionTime: timestamp,

      // Training level information
      trainingLevel,
      attemptNumber,
      isCompleted: !trialResults.trialId.toString().includes("failed"),

      // Additional metadata
      timestamp,
      gameMode,
      taskType: "training",
    };

    // ONLY save to Firebase Storage (skip Firestore)
    const storagePath = `participants/${user.uid}/training`;
    const fileName = `training_${
      trainingLevel.level
    }_attempt_${attemptNumber}_${timestamp.replace(/[:.]/g, "-")}.json`;
    const storageRef = ref(storage, `${storagePath}/${fileName}`);

    await uploadString(
      storageRef,
      JSON.stringify(trainingData, null, 2),
      "raw"
    );

    console.log("Training data saved to Storage:", fileName);
  } catch (error) {
    console.error("Error saving training data:", error);
    throw error;
  }
};
