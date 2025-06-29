"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GAMEMODE, LEVELS_NB_TRAINING } from "@/constants/block";
import levelsConfig from "@/constants/levels.json";
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
}

export default function Training() {
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [isLoaded] = useState(true);

  // State for restart mode
  const [trainingAttempts, setTrainingAttempts] = useState<TrainingAttempt[]>(
    []
  );
  const [currentAttempts, setCurrentAttempts] = useState(1);

  // State for percent mode
  const [completedTrials, setCompletedTrials] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [lastAccuracy, setLastAccuracy] = useState<number>(0);

  const currentLevel = levelsConfig.trainingSequence[currentTrialIndex];

  const handleTrialComplete = (wasSuccessful: boolean) => {
    if (GAMEMODE === "restart") {
      // Track completion for restart mode
      setTrainingAttempts((prev) => [
        ...prev,
        {
          sequenceIndex: currentTrialIndex,
          attempts: currentAttempts,
          completed: wasSuccessful,
        },
      ]);
      setCurrentAttempts(1); // Reset attempts for next sequence
      setCurrentTrialIndex((prev) => prev + 1);
      return;
    }

    // Percent mode - show feedback and track completion
    setCompletedTrials((prev) => [...prev, wasSuccessful]);
    setLastAccuracy(wasSuccessful ? 75 : 45); // Approximate accuracy for display
    setShowFeedback(wasSuccessful ? "success" : "error");

    // Show feedback for 2 seconds before moving to next trial
    setTimeout(() => {
      setShowFeedback(null);
      setCurrentTrialIndex((prev) => prev + 1);
    }, 2000);
  };

  const handleRestartSameSequence = () => {
    setCurrentAttempts((prev) => prev + 1);
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

        <TrainingTrialManager
          trainingLevel={currentLevel}
          trialIndex={currentTrialIndex}
          attemptNumber={currentAttempts}
          onTrialComplete={handleTrialComplete}
          onRestartSameSequence={handleRestartSameSequence}
        />
      </div>
    </div>
  );
}
