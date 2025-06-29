"use client";

import { NbackComponent } from "@/components/nback/nbackcomponent";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GAMEMODE, LEVELS_NB_TRAINING } from "@/constants/block";
import levelsConfig from "@/constants/levels.json";
import { AttemptResults, ResponseData, TrialResults } from "@/types/nback";
import { BadgeCheck, BadgeX } from "lucide-react";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { useState } from "react";
import { TrainingError } from "../../src/components/nback/training_error";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

interface TrainingAttempt {
  sequenceIndex: number;
  attempts: number;
  completed: boolean;
  results?: TrialResults;
}

export default function Training() {
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [completedTrials, setCompletedTrials] = useState<TrialResults[]>([]);
  const [isLoaded] = useState(true); // N-back doesn't need async loading

  // New state for restart mode
  const [trainingAttempts, setTrainingAttempts] = useState<TrainingAttempt[]>(
    []
  );
  const [currentAttempts, setCurrentAttempts] = useState(1);

  // Add feedback and error states
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [showRestartError, setShowRestartError] = useState<{
    errorType: "miss" | "falseAlarm";
    show: boolean;
  } | null>(null);
  const [lastResults, setLastResults] = useState<TrialResults | null>(null);

  // Add attempt tracking for current trial
  const [currentTrialAttempts, setCurrentTrialAttempts] = useState<
    AttemptResults[]
  >([]);

  const currentLevel = levelsConfig.trainingSequence[currentTrialIndex];

  // Helper function to compile AttemptResults into TrialResults
  const compileTrialResults = (attempts: AttemptResults[]): TrialResults => {
    if (attempts.length === 0) {
      throw new Error("No attempts to compile");
    }

    const firstAttempt = attempts[0];
    const lastAttempt = attempts[attempts.length - 1];

    // Use the last attempt's summary for completed trials
    const lastSummary = lastAttempt.summary;

    return {
      stimuliSequence: firstAttempt.stimuliSequence,
      totalAttempts: attempts.length,
      overallAccuracy: lastSummary.accuracy, // Use last attempt's accuracy for training
      attempts: attempts.map((attempt) => ({
        attemptIndex: attempt.attemptIndex,
        responses: attempt.responses,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        isEasierSequence: false, // Training sequences are not easier sequences
        difficultyChoiceData: undefined, // No difficulty choices in training
      })),
      summary: lastSummary, // Use last attempt's summary
    };
  };

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
      setCurrentAttempts((prev) => prev + 1);
    } else {
      // Continue to next sequence - create partial results for completion
      const partialAttempt: AttemptResults = {
        trialId: `training-${currentTrialIndex + 1}-failed`,
        attemptIndex: currentAttempts,
        responses: [],
        startTime: Date.now(),
        endTime: Date.now(),
        stimuliSequence: currentLevel.sequence,
        summary: {
          totalStimuli: 0,
          totalMatches: 0,
          correctHits: 0,
          falseAlarms: showRestartError?.errorType === "falseAlarm" ? 1 : 0,
          misses: showRestartError?.errorType === "miss" ? 1 : 0,
          correctRejections: 0,
          accuracy: 0,
          meanReactionTime: null,
          hitRate: 0,
          falseAlarmRate: showRestartError?.errorType === "falseAlarm" ? 1 : 0,
        },
      };

      // Add the failed attempt and compile results
      const failedAttempts = [...currentTrialAttempts, partialAttempt];
      const trialResults = compileTrialResults(failedAttempts);
      handleTrialComplete(trialResults);
    }
  };

  const handleTrialComplete = async (results: TrialResults) => {
    // Only save if you want to (you mentioned you don't care about saving in training)
    // Commenting out the save logic as requested
    /*
    try {
      await saveTrainingData(results, currentLevel, currentAttempts, GAMEMODE);
      console.log("Training data saved successfully");
    } catch (error) {
      console.error("Failed to save training data:", error);
    }
    */

    setCompletedTrials((prev) => [...prev, results]);

    if (GAMEMODE === "restart") {
      // Track completion for restart mode
      const wasCompleted = results.summary.accuracy > 0; // If accuracy > 0, it was completed (not a failed partial result)
      setTrainingAttempts((prev) => [
        ...prev,
        {
          sequenceIndex: currentTrialIndex,
          attempts: currentAttempts,
          completed: wasCompleted,
          results: results,
        },
      ]);
      setCurrentAttempts(1); // Reset attempts for next sequence
      setCurrentTrialAttempts([]); // Reset attempts for next trial
      setCurrentTrialIndex((prev) => prev + 1);
      return;
    }

    // Percent mode - original behavior with feedback
    setLastResults(results);
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
      setCurrentTrialAttempts([]); // Reset attempts for next trial
      setCurrentTrialIndex((prev) => prev + 1);
    }, 2000);
  };

  // Handle attempt completion from NbackComponent
  const handleAttemptEnd = async (attemptResults: AttemptResults) => {
    // Add attempt to current trial
    const newAttempts = [...currentTrialAttempts, attemptResults];
    setCurrentTrialAttempts(newAttempts);

    // Compile the trial results and handle completion
    const trialResults = compileTrialResults(newAttempts);
    await handleTrialComplete(trialResults);
  };

  const isTrainingComplete = currentTrialIndex >= LEVELS_NB_TRAINING;

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

  const calculateAverageAccuracy = () => {
    if (completedTrials.length === 0) return 0;
    const totalAccuracy = completedTrials.reduce(
      (sum, trial) => sum + trial.summary.accuracy,
      0
    );
    return ((totalAccuracy / completedTrials.length) * 100).toFixed(1);
  };

  const getSuccessfulTrials = () => {
    return completedTrials.filter((trial) => trial.summary.accuracy >= 0.7)
      .length;
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
                    {/* <span>{currentLevel.description}:</span> */}
                    <span
                      className={`font-bold ${
                        attempt.completed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {attempt.attempts} attempt
                      {attempt.attempts > 1 ? "s" : ""} -{" "}
                      {attempt.completed ? "Completed" : "Failed"}
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
      // Original percent mode completion screen
      const averageAccuracy = calculateAverageAccuracy();
      const successfulTrials = getSuccessfulTrials();

      console.log(successfulTrials);

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
                Average Accuracy: <b>{averageAccuracy}%</b>
              </h2>

              <div className=" p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-center">Trial Results:</h4>
                {completedTrials.map((trial, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{currentLevel.description}:</span>
                    <span
                      className={`font-bold ${
                        trial.summary.accuracy >= 0.7
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {(trial.summary.accuracy * 100).toFixed(1)}%
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
    }
  }

  return (
    <div className="relative h-full w-full bg-white">
      <div className="absolute bottom-5 left-5">
        <h2
          className={`text-lg font-bold text-center ${firaCode.className} text-zinc-600`}
        >
          Current Level
        </h2>
        <div
          className={`flex items-center justify-center px-4 py-2 bg-orange-500 rounded-lg shadow-lg ${firaCode.className} text-white text-center min-w-[120px]`}
        >
          {currentLevel.description}
        </div>
        {GAMEMODE === "restart" && (
          <div className="text-center mt-2 text-sm text-gray-600">
            Attempt: {currentAttempts}
          </div>
        )}
      </div>

      {!isLoaded && (
        <div className="fixed top-0 left-0 h-full w-full bg-black bg-opacity-30 flex items-center justify-center">
          <img src="/images/loading.svg" alt="Loading..." className="h-8" />
        </div>
      )}

      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[150px] w-3/4 flex flex-col items-center justify-center gap-2">
          <Progress
            value={(currentTrialIndex / LEVELS_NB_TRAINING) * 100}
            className="shadow-2xl"
          />
          <div
            className={`text-sm text-zinc-400 ${firaCode.className} text-center`}
          >
            {currentTrialIndex} / {LEVELS_NB_TRAINING}{" "}
            <i className="text-xs">(Training sequences completed)</i>
          </div>
          {/* Instructions for current trial */}
          <div className="mb-4 text-center max-w-md">
            <p className="text-sm text-gray-600">
              Press <strong>SPACEBAR</strong> when the current letter matches
              the one from <strong>{currentLevel.N}</strong> trials ago
            </p>
          </div>
        </div>

        <NbackComponent
          trialId={`training-${
            currentTrialIndex + 1
          }-attempt-${currentAttempts}`}
          attemptIndex={currentAttempts}
          N={currentLevel.N}
          stimulusset={levelsConfig.stimulusSet}
          stimulusTime={currentLevel.stimulusTime}
          intertrialInterval={currentLevel.intertrialInterval}
          sequenceLength={currentLevel.sequenceLength}
          targetKey={levelsConfig.targetKey}
          predefinedSequence={currentLevel.sequence}
          onTrialEnd={handleAttemptEnd}
          onError={handleError}
        />
      </div>
    </div>
  );
}
