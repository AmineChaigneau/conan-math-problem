import { BadgeCheck, BadgeX } from "lucide-react";
import { useState } from "react";
import { MathProblem } from "../block/math";
import { TrainingProblem } from "./page";

export type TrainingTrialManagerProps = {
  problem: TrainingProblem;
  onTrialComplete: (correct: boolean) => void;
};

export const TrainingTrialManager = (props: TrainingTrialManagerProps) => {
  const { problem, onTrialComplete } = props;
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );

  const handleComplete = (correct: boolean) => {
    setShowFeedback(correct ? "success" : "error");

    // Play sound feedback
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

    // Show feedback for 1 second before moving to next trial
    setTimeout(() => {
      setShowFeedback(null);
      onTrialComplete(correct);
    }, 1000);
  };

  const handleReset = () => {
    setShowFeedback(null);
  };

  // Dummy function for onDataCollection
  const handleDataCollection = () => {
    // Do nothing in training mode
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

  return (
    <MathProblem
      trialId={999}
      difficulty="medium"
      sequence={problem.sequence}
      answers={problem.answers}
      correctAnswer={problem.correctAnswer}
      onComplete={handleComplete}
      onReset={handleReset}
      onDataCollection={handleDataCollection}
    />
  );
};
