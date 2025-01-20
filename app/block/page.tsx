"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  LENGTH_OF_BLOCK,
  NUM_CORRECT_ANSWERS,
  PROBLEMS_MAXIMUM,
} from "@/constants/block";
import { generateMathProblems } from "@/constants/mathProblemGenerator";
import { Fira_Code } from "next/font/google";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TrialManager } from "./trialManager";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export interface Problem {
  sequence: string;
  sequenceArray: (string | number)[];
  difficulty: string;
  correctAnswer: number;
  answers: number[];
  correctButtonPosition: number;
}

export default function Block() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [problems, setProblems] = useState<{
    easy: Problem[];
    medium: Problem[];
    hard: Problem[];
  } | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<
    "easy" | "medium" | "hard"
  >(() => (Math.random() < 0.5 ? "medium" : "hard"));
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isEasyMode, setIsEasyMode] = useState(false);

  useEffect(() => {
    try {
      const maths = generateMathProblems(PROBLEMS_MAXIMUM);
      setProblems(maths);
      setIsLoaded(true);
    } catch (error) {
      console.error("Error generating problems:", error);
    }
  }, []);

  useEffect(() => {
    if (!isEasyMode && attempts > 0 && attempts % LENGTH_OF_BLOCK === 0) {
      setCurrentDifficulty((prev) => (prev === "medium" ? "hard" : "medium"));
    }
  }, [attempts, isEasyMode]);

  const handleTrialComplete = (correct: boolean, easier: boolean) => {
    if (correct) {
      setCorrectAnswers((prev) => prev + 1);
    }

    if (easier) {
      setCurrentDifficulty("easy");
      setIsEasyMode(true);
    }
    setAttempts((prev) => prev + 1);

    setCurrentProblemIndex((prev) => prev + 1);
  };
  if (!problems) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-white">
        <img src="/images/loading.svg" alt="Loading..." className="h-8" />
      </div>
    );
  }

  const getCurrentProblem = () => {
    return problems[currentDifficulty][currentProblemIndex];
  };

  return (
    <div className="relative h-full w-full bg-white">
      <div className="absolute bottom-5 left-5 capitalize text-zinc-400">
        {currentDifficulty} - {attempts}
      </div>
      {!isLoaded && (
        <div className="fixed top-0 left-0 h-full w-full bg-black bg-opacity-30 flex items-center justify-center">
          <img src="/images/loading.svg" alt="Loading..." className="h-8" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center h-full w-full">
        {attempts >= PROBLEMS_MAXIMUM ? (
          <div className="flex flex-col items-center gap-4">
            <h2
              className={`text-2xl text-center font-bold text-zinc-700 ${firaCode.className}`}
            >
              Maximum attempts reached
            </h2>
            <Button
              className={`w-full ${firaCode.className} text-lg bg-orange-500`}
            >
              <Link
                className="w-full h-full flex justify-center items-center"
                href="/end"
              >
                Go to Results
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="h-[75px] w-3/4 flex flex-col items-center justify-center gap-2">
              <Progress
                value={(correctAnswers / NUM_CORRECT_ANSWERS) * 100}
                className="shadow-2xl"
              />
              <div className={`text-sm text-zinc-400 ${firaCode.className}`}>
                {correctAnswers} / {NUM_CORRECT_ANSWERS}
              </div>
            </div>
            <TrialManager
              remaining={NUM_CORRECT_ANSWERS - correctAnswers}
              problem={getCurrentProblem()}
              difficulty={currentDifficulty}
              onTrialComplete={handleTrialComplete}
            />
          </>
        )}
      </div>
    </div>
  );
}
