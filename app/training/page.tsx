"use client";

import { Button } from "@/components/ui/button";
import { GAMEMODE, LEVELS_NB_TRAINING } from "@/constants/block";
import levelsData from "@/constants/levels.json";
import { BadgeCheck, BadgeX } from "lucide-react";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import { TrainingTrialManager } from "./trainingTrialManager";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

interface TrainingAttempt {
  sequenceIndex: number;
  attempts: number;
  completed: boolean;
  wasEasierSequence?: boolean;
}

export default function Training() {
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [isLoaded] = useState(true);

  // State for restart mode
  const [trainingAttempts, setTrainingAttempts] = useState<TrainingAttempt[]>(
    []
  );
  const [currentAttempts, setCurrentAttempts] = useState(1);

  // State for easier sequence tracking
  const [isUsingEasierSequence, setIsUsingEasierSequence] = useState(false);

  // State for checkpoint management
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);

  // State for percent mode
  const [completedTrials, setCompletedTrials] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [lastAccuracy, setLastAccuracy] = useState<number>(0);

  // Get current training level from levels.json
  const getCurrentLevel = () => {
    const originalLevel = levelsData.trainingSequence[currentTrialIndex];

    if (isUsingEasierSequence && originalLevel.N > 1) {
      // Create an easier version (N-1) of the current level
      return {
        ...originalLevel,
        N: originalLevel.N - 1,
        // Optionally adjust other parameters for easier difficulty
        stimulusTime: Math.max(originalLevel.stimulusTime, 1500),
        intertrialInterval: Math.max(originalLevel.intertrialInterval, 1500),
      };
    }

    return originalLevel;
  };

  const currentLevel = getCurrentLevel();

  const handleTrialComplete = (wasSuccessful: boolean) => {
    if (GAMEMODE === "restart") {
      // Track completion for restart mode
      setTrainingAttempts((prev) => [
        ...prev,
        {
          sequenceIndex: currentTrialIndex,
          attempts: currentAttempts,
          completed: wasSuccessful,
          wasEasierSequence: isUsingEasierSequence,
        },
      ]);
      setCurrentAttempts(1);
      setIsUsingEasierSequence(false);
      setCurrentCheckpointIndex(0); // Reset checkpoint for next trial
      setCurrentTrialIndex((prev) => prev + 1);
      return;
    }

    // Percent mode - show feedback and track completion
    setCompletedTrials((prev) => [...prev, wasSuccessful]);
    setLastAccuracy(wasSuccessful ? 75 : 45);
    setShowFeedback(wasSuccessful ? "success" : "error");

    // Show feedback for 2 seconds before moving to next trial
    setTimeout(() => {
      setShowFeedback(null);
      setCurrentTrialIndex((prev) => prev + 1);
    }, 2000);
  };

  const handleRestartSameSequence = () => {
    setCurrentAttempts((prev) => prev + 1);
    // Keep current checkpoint index for restart
  };

  const handleCheckpointError = (checkpointIndex: number) => {
    setCurrentCheckpointIndex(checkpointIndex);
    console.log(
      `Training: Checkpoint error, setting restart index to: ${checkpointIndex}`
    );
  };

  const handleSwitchToEasier = () => {
    const originalLevel = levelsData.trainingSequence[currentTrialIndex];

    if (originalLevel.N > 1) {
      // Switch to easier (N-1) sequence but keep same trial and checkpoint
      setIsUsingEasierSequence(true);
      setCurrentAttempts((prev) => prev + 1);
      // Keep current checkpoint index instead of resetting to 0
      console.log(
        `Training: Switching to easier (N-1) at same checkpoint: ${currentCheckpointIndex}`
      );
    } else {
      // Already at easiest level (1-back), treat as trial completion failure
      handleTrialComplete(false);
    }
  };

  const isTrainingComplete = currentTrialIndex >= LEVELS_NB_TRAINING;

  // Show percent mode feedback
  if (showFeedback) {
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
              <div className="text-2xl font-bold">{lastAccuracy}% Accuracy</div>
              <div className="text-sm mt-2 text-gray-600">
                {showFeedback === "success"
                  ? "Good performance!"
                  : "Keep trying!"}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const calculateSuccessRate = () => {
    if (completedTrials.length === 0) return 0;
    const successfulTrials = completedTrials.filter((trial) => trial).length;
    return ((successfulTrials / completedTrials.length) * 100).toFixed(1);
  };

  const getSuccessfulTrials = () => {
    return completedTrials.filter((trial) => trial).length;
  };

  if (isTrainingComplete) {
    if (GAMEMODE === "restart") {
      // Show attempts and completion status for restart mode
      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-white">
          <div className="max-w-lg mx-auto flex flex-col justify-center gap-4 border-2 bg-white border-zinc-400 rounded-lg shadow-lg p-8">
            <h1
              className={`text-4xl font-bold text-center ${firaCode.className}`}
            >
              Training Complete!
            </h1>

            <div className="space-y-3">
              <div className="p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-center">Training Results:</h4>
                {trainingAttempts.map((attempt, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>Sequence {index + 1}:</span>
                    <span
                      className={`font-bold ${
                        attempt.completed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {attempt.attempts} attempt
                      {attempt.attempts > 1 ? "s" : ""} -{" "}
                      {attempt.completed ? "Completed" : "Failed"}
                      {attempt.wasEasierSequence && (
                        <span className="text-xs text-blue-600 ml-1">
                          (Easier)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              You have completed the N-Back training. Click below to start the
              main experiment.
            </p>
            <Button
              className={`p-0 w-full ${firaCode.className} text-lg bg-orange-500`}
            >
              <Link
                className="w-full h-full flex justify-center items-center"
                href="/task"
              >
                Start N-Back Task
              </Link>
            </Button>
          </div>
        </div>
      );
    } else {
      // Percent mode completion screen
      const successRate = calculateSuccessRate();
      const successfulTrials = getSuccessfulTrials();

      return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-white">
          <div className="max-w-lg mx-auto flex flex-col justify-center gap-4 border-2 bg-white border-zinc-400 rounded-lg shadow-lg p-8">
            <h1
              className={`text-4xl font-bold text-center ${firaCode.className}`}
            >
              Training Complete!
            </h1>

            <div className="space-y-3">
              <h2 className="text-2xl text-center">
                Success Rate: <b>{successRate}%</b>
              </h2>

              <div className="p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-center">Trial Results:</h4>
                {completedTrials.map((trial, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>Sequence {index + 1}:</span>
                    <span
                      className={`font-bold ${
                        trial ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {trial ? "Success" : "Needs Improvement"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-center text-sm text-gray-600">
                Successful trials: {successfulTrials} / {completedTrials.length}
              </div>
            </div>

            <p className="text-center text-sm text-gray-600">
              You have completed the N-Back training. Click below to start the
              main experiment.
            </p>
            <Button
              className={`p-0 w-full ${firaCode.className} text-lg bg-orange-500`}
            >
              <Link
                className="w-full h-full flex justify-center items-center"
                href="/task"
              >
                Start N-Back Task
              </Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="relative h-full w-full bg-white">
      <div className="absolute bottom-5 left-5">
        <h2
          className={`text-lg font-bold text-center ${firaCode.className} text-zinc-600`}
        >
          Training Level
        </h2>
      </div>

      {!isLoaded && (
        <div className="fixed top-0 left-0 h-full w-full bg-black bg-opacity-30 flex items-center justify-center">
          <img src="/images/loading.svg" alt="Loading..." className="h-8" />
        </div>
      )}

      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2">
          {/* Instructions for current trial */}
          <div className="mb-4 text-center max-w-md">
            {/* <p className="text-sm text-gray-600">
              Click on the <strong>GRAY AREA</strong> when the current letter
              matches the one from <strong>{currentLevel.N}</strong> letters ago
              {isUsingEasierSequence && (
                <span className="block text-xs text-blue-600 mt-1">
                  (Easier sequence - N-1 back)
                </span>
              )}
            </p> */}
            <p className="text-sm text-gray-600">
              Move the cursor over one of the target areas to select it.
            </p>
          </div>
        </div>

        <TrainingTrialManager
          trainingLevel={currentLevel}
          trialIndex={currentTrialIndex}
          attemptNumber={currentAttempts}
          isUsingEasierSequence={isUsingEasierSequence}
          currentCheckpointIndex={currentCheckpointIndex}
          onTrialComplete={handleTrialComplete}
          onRestartSameSequence={handleRestartSameSequence}
          onSwitchToEasier={handleSwitchToEasier}
          onCheckpointError={handleCheckpointError}
        />
      </div>
    </div>
  );
}
