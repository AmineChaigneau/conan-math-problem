"use client";

import { NbackDifficultyRestart } from "@/components/nback/difficulty_restart";
import { Progress } from "@/components/ui/progress";
import { GAMEMODE, LEVELS_NB_TRAINING } from "@/constants/block";
import {
  AttemptResults,
  NbackDifficultyRestartData,
  ResponseData,
  TrainingLevel,
} from "@/types/nback";
import { generateSequenceFromMatches } from "@/utils/generateSequenceFromMatches";
import { BadgeCheck, BadgeX } from "lucide-react";
import { Fira_Code } from "next/font/google";
import { useMemo, useState } from "react";
import { NbackComponent } from "../../src/components/nback/nbackcomponent";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

type TrainingTrialManagerProps = {
  trainingLevel: TrainingLevel;
  trialIndex: number;
  attemptNumber: number;
  isUsingEasierSequence?: boolean;
  currentCheckpointIndex?: number;
  onTrialComplete: (wasSuccessful: boolean) => void;
  onRestartSameSequence?: () => void;
  onSwitchToEasier?: () => void;
  onCheckpointError?: (checkpointIndex: number) => void;
};

export const TrainingTrialManager = (props: TrainingTrialManagerProps) => {
  const {
    trainingLevel,
    trialIndex,
    attemptNumber,
    isUsingEasierSequence = false,
    currentCheckpointIndex = 0,
    onTrialComplete,
    onRestartSameSequence,
    onSwitchToEasier,
    onCheckpointError,
  } = props;
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [showRestartError, setShowRestartError] = useState<{
    errorType: "miss" | "falseAlarm";
    show: boolean;
  } | null>(null);
  const [showAutoRestart, setShowAutoRestart] = useState(false);
  const [lastResults, setLastResults] = useState<AttemptResults | null>(null);

  console.log("Training level being used:", trainingLevel);

  // Generate letter sequence based on matches array
  const sequence = useMemo(() => {
    return generateSequenceFromMatches(
      trainingLevel.matches,
      trainingLevel.N,
      Date.now() + attemptNumber // Use attempt number as seed for variation
    );
  }, [trainingLevel.matches, trainingLevel.N, attemptNumber]);

  // Generate ghost letters if restarting from checkpoint
  const ghostLetters = useMemo(() => {
    if (currentCheckpointIndex > 0) {
      const letters: string[] = [];
      const actualN = trainingLevel.N;

      // For N-back, we need the N previous letters: [checkpoint-N, ..., checkpoint-1]
      for (let i = actualN; i >= 1; i--) {
        const ghostIndex = currentCheckpointIndex - i;
        if (ghostIndex >= 0) {
          letters.push(sequence[ghostIndex]);
        }
      }

      console.log(
        `Training: Generated ghost letters for checkpoint ${currentCheckpointIndex} (N=${actualN}):`,
        letters,
        `(indices: ${letters
          .map((_, i) => currentCheckpointIndex - actualN + i)
          .filter((idx) => idx >= 0)})`
      );

      return letters;
    }
    return [];
  }, [sequence, currentCheckpointIndex, trainingLevel.N]);

  // Handle immediate error detection (restart mode only)
  const handleError = (errorData: {
    stimulusIndex: number;
    errorType: "miss" | "falseAlarm";
    currentResponses: ResponseData[];
    lastCheckpoint: number;
  }) => {
    if (GAMEMODE === "restart") {
      // Notify parent about checkpoint error
      if (onCheckpointError) {
        onCheckpointError(errorData.lastCheckpoint);
      }

      // Create a mock AttemptResults for the error display
      const mockAttemptResults: AttemptResults = {
        trialId: `training-trial-${trialIndex + 1}-attempt-${attemptNumber}`,
        attemptIndex: attemptNumber,
        responses: errorData.currentResponses,
        startTime: Date.now() - 5000,
        endTime: Date.now(),
        matchesSequence: trainingLevel.matches,
        summary: {
          totalStimuli: errorData.currentResponses.length,
          totalMatches: 0,
          correctHits: 0,
          falseAlarms: errorData.errorType === "falseAlarm" ? 1 : 0,
          misses: errorData.errorType === "miss" ? 1 : 0,
          correctRejections: 0,
          accuracy: 0,
          meanReactionTime: null,
          hitRate: 0,
          falseAlarmRate: errorData.errorType === "falseAlarm" ? 1 : 0,
        },
      };

      setLastResults(mockAttemptResults);

      // If already in easier sequence, show auto-restart screen
      if (isUsingEasierSequence) {
        setShowAutoRestart(true);
        // Auto-restart after showing FAIL message
        setTimeout(() => {
          setShowAutoRestart(false);
          if (onRestartSameSequence) {
            onRestartSameSequence();
          }
        }, 1500);
      } else {
        setShowRestartError({
          errorType: errorData.errorType,
          show: true,
        });
      }
    }
  };

  // Handle choice in restart mode (switchToEasier vs restart from checkpoint)
  const handleRestartChoice = (switchToEasier: boolean) => {
    setShowRestartError(null);

    if (switchToEasier) {
      // Switch to easier (N-1 back) - call the new callback
      if (onSwitchToEasier) {
        onSwitchToEasier();
      } else {
        // Fallback to completing as failed if no easier option
        onTrialComplete(false);
      }
    } else {
      // Restart from beginning
      if (onRestartSameSequence) {
        onRestartSameSequence();
      }
    }
  };

  // No-op data collection function for training (we don't want to save data)
  const handleDataCollection = (data: NbackDifficultyRestartData) => {
    // Do nothing - we don't save data in training mode
    console.log("Training mode: data collection skipped", data);
  };

  const handleAttemptEnd = (results: AttemptResults) => {
    setLastResults(results);

    if (GAMEMODE === "restart") {
      // In restart mode, if we completed without errors, mark as successful
      onTrialComplete(true);
      return;
    }

    // Percent mode - original behavior
    // Determine if performance was good (70% accuracy threshold)
    const isGoodPerformance = results.summary.accuracy >= 0.7;
    setShowFeedback(isGoodPerformance ? "success" : "error");

    // Play sound feedback
    if (isGoodPerformance) {
      const successSound = new Audio("/sounds/success.mp3");
      successSound.play().catch((error) => {
        console.error("Error playing sound:", error);
      });
    } else {
      const errorSound = new Audio("/sounds/error.mp3");
      errorSound.play().catch((error) => {
        console.error("Error playing sound:", error);
      });
    }

    // Show feedback for 2 seconds before moving to next trial
    setTimeout(() => {
      setShowFeedback(null);
      onTrialComplete(isGoodPerformance);
    }, 2000);
  };

  // Show auto-restart screen (when already in easier sequence)
  if (showAutoRestart) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen ${firaCode.className}`}
      >
        <div className="text-center space-y-8">
          <div className="text-6xl font-bold text-red-600 mb-4">FAIL</div>
          <div className="text-2xl text-gray-700">
            Sequence Failed - Restarting from Checkpoint
          </div>
          <div className="text-lg text-gray-500">
            Already at easiest level ({trainingLevel.N}-back)
          </div>
          <div className="text-lg text-blue-600">
            Checkpoint: Position {currentCheckpointIndex + 1}
          </div>
          <div className="text-sm text-gray-400 mt-8">
            Automatically restarting in 1.5 seconds...
          </div>
        </div>
      </div>
    );
  }

  // Show restart error screen (when not in easier sequence)
  if (showRestartError && lastResults && showRestartError.show) {
    return (
      <div className="h-screen w-full bg-white">
        <NbackDifficultyRestart
          trialId={trialIndex + 1}
          trialResults={{
            matchesSequence: lastResults.matchesSequence,
            totalAttempts: 1,
            overallAccuracy: lastResults.summary.accuracy,
            reward: 0,
            currentReward: 0,
            attempts: [
              {
                attemptIndex: lastResults.attemptIndex,
                responses: lastResults.responses,
                startTime: lastResults.startTime,
                endTime: lastResults.endTime,
                isEasierSequence: isUsingEasierSequence,
              },
            ],
            summary: lastResults.summary,
          }}
          currentLevel={trainingLevel.N}
          remainingTrials={LEVELS_NB_TRAINING - trialIndex}
          onChoice={handleRestartChoice}
          onDataCollection={handleDataCollection}
        />
      </div>
    );
  }

  // Show feedback screen (percent mode)
  if (showFeedback && lastResults) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4">
            {showFeedback === "success" ? (
              <BadgeCheck className="w-32 h-32 text-green-500 animate-in fade-in" />
            ) : (
              <BadgeX className="w-32 h-32 text-red-500 animate-in fade-in" />
            )}
            <div className="text-center">
              <div className="text-3xl font-bold">
                {(lastResults.summary.accuracy * 100).toFixed(1)}% Accuracy
              </div>
              <div className="text-lg mt-2 text-gray-600">
                {showFeedback === "success"
                  ? "Good performance!"
                  : "Keep trying!"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main trial component
  return (
    <div className="relative h-full w-full flex items-center justify-center bg-white">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[75px] w-3/4 flex flex-col items-center justify-center gap-2">
        <Progress
          value={(trialIndex / LEVELS_NB_TRAINING) * 100}
          className="shadow-2xl"
        />
        <div
          className={`text-sm text-zinc-400 ${firaCode.className} text-center`}
        >
          {trialIndex} / {LEVELS_NB_TRAINING} sequences completed
        </div>
      </div>

      <NbackComponent
        trialId={`training-trial-${trialIndex + 1}-attempt-${attemptNumber}`}
        attemptIndex={attemptNumber}
        N={trainingLevel.N}
        stimulusTime={trainingLevel.stimulusTime}
        intertrialInterval={trainingLevel.intertrialInterval}
        sequenceLength={trainingLevel.sequenceLength}
        targetKey={"click"}
        startFromIndex={currentCheckpointIndex}
        ghostLetters={ghostLetters.length > 0 ? ghostLetters : undefined}
        predefinedSequence={sequence}
        onTrialEnd={handleAttemptEnd}
        onError={handleError}
      />
    </div>
  );
};
