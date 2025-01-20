"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NUM_TRIALS_TRAINING } from "@/constants/block";
import { generateMathProblems } from "@/constants/mathProblemGenerator";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TrainingTrialManager } from "./trainingTrialManager";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export interface TrainingProblem {
  sequence: string;
  sequenceArray: (string | number)[];
  correctAnswer: number;
  answers: number[];
  correctButtonPosition: number;
}

export default function Training() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [problems, setProblems] = useState<TrainingProblem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    try {
      const maths = generateMathProblems(NUM_TRIALS_TRAINING);
      setProblems(maths.easy);
      setIsLoaded(true);
    } catch (error) {
      console.error("Error generating problems:", error);
    }
  }, []);

  const handleTrialComplete = (correct: boolean) => {
    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }
    setAttempts((prev) => prev + 1);
    setCurrentProblemIndex((prev) => prev + 1);
  };

  if (!problems.length) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white">
        <img src="/images/loading.svg" alt="Loading..." className="h-8" />
      </div>
    );
  }

  const getCurrentProblem = () => {
    return problems[currentProblemIndex];
  };

  const isTrainingComplete = currentProblemIndex >= NUM_TRIALS_TRAINING;

  if (isTrainingComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-white">
        <div className="max-w-lg mx-auto flex flex-col justify-center gap-4 border-2 bg-white border-zinc-400 rounded-lg shadow-lg p-8">
          <h1
            className={`text-4xl font-bold text-center ${firaCode.className}`}
          >
            Training Complete!
          </h1>
          <h2 className="text-2xl text-center">
            You got <b>{correctAnswers}</b> out of {NUM_TRIALS_TRAINING}{" "}
            correct.
          </h2>
          <p className="text-center">
            Click below to start the main experiment.
          </p>
          <Button
            className={`p-0 w-full ${firaCode.className} text-lg bg-orange-500`}
          >
            <Link
              className="w-full h-full flex justify-center items-center"
              href="/block"
            >
              Start Experiment
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-white">
      <div className="absolute bottom-5 left-5">
        <h2
          className={`text-lg font-bold text-center ${firaCode.className} text-zinc-600`}
        >
          Attempts
        </h2>
        <div
          className={`flex items-center justify-center px-4 py-2 bg-orange-500 rounded-lg shadow-lg ${firaCode.className}`}
        >
          {attempts} / {NUM_TRIALS_TRAINING}
        </div>
      </div>
      {!isLoaded && (
        <div className="fixed top-0 left-0 h-full w-full bg-black bg-opacity-30 flex items-center justify-center">
          <img src="/images/loading.svg" alt="Loading..." className="h-8" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center h-full w-full">
        <div className="h-[75px] w-3/4 flex flex-col items-center justify-center gap-2">
          <Progress
            value={(correctAnswers / 10) * 100}
            className="shadow-2xl"
          />
          <div
            className={`text-sm text-zinc-400 ${firaCode.className} text-center`}
          >
            {correctAnswers} / 40{" "}
            <i className="text-xs">(Correct answers target)</i>
          </div>
        </div>
        <TrainingTrialManager
          problem={getCurrentProblem()}
          onTrialComplete={handleTrialComplete}
        />
      </div>
    </div>
  );
}
