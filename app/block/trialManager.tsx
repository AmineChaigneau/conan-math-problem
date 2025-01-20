import { BadgeCheck, BadgeX } from "lucide-react";
import { useState } from "react";
import { DifficultyChoice } from "./difficulty";
import { MathProblem } from "./math";
import { Problem } from "./page";

export type TrialManagerProps = {
  problem: Problem;
  difficulty: "easy" | "medium" | "hard";
  onTrialComplete: (correct: boolean, easier: boolean) => void;
};

export const TrialManager = (props: TrialManagerProps) => {
  const { problem, difficulty, onTrialComplete } = props;
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleComplete = (correct: boolean) => {
    setIsCorrect(correct);
    setShowFeedback(correct ? "success" : "error");
    setIsAnswered(true);

    // Play success sound if correct
    if (correct) {
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

    // Show feedback for 1 second before showing difficulty choice
    setTimeout(() => {
      setShowFeedback(null);
    }, 1000);
  };

  const handleDifficultyChoice = (giveUp: boolean) => {
    setIsAnswered(false);
    onTrialComplete(isCorrect, giveUp);
  };

  if (showFeedback) {
    return (
      <>
        <div className="h-full w-full"></div>
        <div className="fixed pt-[75px] inset-0 pointer-events-none flex items-center justify-center">
          {showFeedback === "success" ? (
            <BadgeCheck className="w-24 h-24 text-green-500 animate-in fade-in" />
          ) : (
            <BadgeX className="w-24 h-24 text-red-500 animate-in fade-in" />
          )}
        </div>
      </>
    );
  }

  if (isAnswered) {
    // For easy difficulty, skip difficulty choice and complete immediately
    if (difficulty === "easy" || isCorrect) {
      setTimeout(() => {
        handleDifficultyChoice(false);
      }, 500);
      return <div className="h-full w-full"></div>;
    }

    // Show difficulty choice only for incorrect answers on medium/hard difficulties
    return (
      <DifficultyChoice
        isCorrect={isCorrect}
        onChoice={handleDifficultyChoice}
      />
    );
  }

  return (
    <MathProblem
      difficulty={difficulty}
      sequence={problem.sequence}
      answers={problem.answers}
      correctAnswer={problem.correctAnswer}
      onComplete={handleComplete}
    />
  );
};
