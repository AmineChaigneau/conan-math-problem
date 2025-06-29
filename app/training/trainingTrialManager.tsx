"use client";

import { GAMEMODE } from "@/constants/block";
import { AttemptResults, ResponseData, TrainingLevel } from "@/types/nback";
import { BadgeCheck, BadgeX } from "lucide-react";
import { useState } from "react";
import { NbackComponent } from "../../src/components/nback/nbackcomponent";
import { TrainingError } from "../../src/components/nback/training_error";
import levelsConfig from "../../src/constants/levels.json";

type TrainingTrialManagerProps = {
  trainingLevel: TrainingLevel;
  trialIndex: number;
  attemptNumber: number;
  onTrialComplete: (wasSuccessful: boolean) => void;
  onRestartSameSequence?: () => void;
};

export const TrainingTrialManager = (props: TrainingTrialManagerProps) => {
  const {
    trainingLevel,
    trialIndex,
    attemptNumber,
    onTrialComplete,
    onRestartSameSequence,
  } = props;
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [showRestartError, setShowRestartError] = useState<{
    errorType: "miss" | "falseAlarm";
    show: boolean;
  } | null>(null);
  const [lastResults, setLastResults] = useState<AttemptResults | null>(null);

  console.log("Training level being used:", trainingLevel);

  // Handle immediate error detection (restart mode only)
  const handleError = (errorData: {
    stimulusIndex: number;
    errorType: "miss" | "falseAlarm";
    currentResponses: ResponseData[];
  }) => {
    if (GAMEMODE === "restart") {
      setShowRestartError({
        errorType: errorData.errorType,
        show: true,
      });
    }
  };

  // Handle choice in restart mode (restart vs continue)
  const handleRestartChoice = (restart: boolean) => {
    setShowRestartError(null);

    if (restart) {
      // Restart the same sequence
      if (onRestartSameSequence) {
        onRestartSameSequence();
      }
    } else {
      // Continue to next sequence - mark as failed
      onTrialComplete(false);
    }
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

  // Show restart error screen (restart mode only)
  if (showRestartError?.show) {
    return (
      <div className="w-full h-screen">
        <TrainingError
          errorType={showRestartError.errorType}
          onChoice={handleRestartChoice}
        />
      </div>
    );
  }

  // Show percent mode feedback (original behavior)
  if (showFeedback && lastResults) {
    const accuracy = (lastResults.summary.accuracy * 100).toFixed(1);

    return (
      <>
        <div className="h-full w-full"></div>
        <div className="fixed flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {showFeedback === "success" ? (
              <BadgeCheck className="w-24 h-24 text-green-500 animate-in fade-in" />
            ) : (
              <BadgeX className="w-24 h-24 text-red-500 animate-in fade-in" />
            )}
            <div className="text-center">
              <div className="text-2xl font-bold">{accuracy}% Accuracy</div>
              <div className="text-s mt-4 text-gray-600">
                Hits: {lastResults.summary.correctHits} | False Alarms:{" "}
                {lastResults.summary.falseAlarms}
              </div>
              {lastResults.summary.meanReactionTime && (
                <div className="text-sm mt-2 text-gray-600">
                  Avg RT: {lastResults.summary.meanReactionTime.toFixed(0)}ms
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full h-screen">
      <NbackComponent
        trialId={`training-trial-${trialIndex + 1}`}
        attemptIndex={attemptNumber}
        N={trainingLevel.N}
        stimulusset={levelsConfig.stimulusSet}
        stimulusTime={trainingLevel.stimulusTime}
        intertrialInterval={trainingLevel.intertrialInterval}
        sequenceLength={trainingLevel.sequenceLength}
        targetKey={levelsConfig.targetKey}
        onTrialEnd={handleAttemptEnd}
        onError={handleError}
      />
    </div>
  );
};
