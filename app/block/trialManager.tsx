import { auth, storage } from "@/config/firebase";
import { SAVE_DATA } from "@/constants/block";
import { DifficultyChoiceData, MathTrialData } from "@/types/analytics";
import { ref, uploadString } from "firebase/storage";
import { BadgeCheck, BadgeX } from "lucide-react";
import { useState } from "react";
import { DifficultyChoice } from "./difficulty";
import { MathProblem } from "./math";
import { Problem } from "./page";

export type TrialManagerProps = {
  trialId: number;
  revert: boolean;
  remaining: number;
  problem: Problem;
  difficulty: "easy" | "medium" | "hard";
  onTrialComplete: (correct: boolean, easier: boolean) => void;
};

export const TrialManager = (props: TrialManagerProps) => {
  const { trialId, revert, remaining, problem, difficulty, onTrialComplete } =
    props;
  const [showFeedback, setShowFeedback] = useState<"success" | "error" | null>(
    null
  );
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleReset = () => {
    setShowFeedback(null);
    setIsAnswered(false);
    setIsCorrect(false);
    onTrialComplete(false, false);
  };

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

  const handleDataCollection = async (
    data: MathTrialData | DifficultyChoiceData
  ) => {
    if (!SAVE_DATA) {
      console.log("Data saving is disabled");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user found");
        return;
      }

      const storagePath = `participants/${user.uid}`;
      const type = "sequence" in data ? "math" : "difficulty";
      const storageRef = ref(
        storage,
        `${storagePath}/trials/${data.trialId}_${type}.json`
      );

      await uploadString(storageRef, JSON.stringify(data, null, 2), "raw");
      console.log(`Successfully saved trial ${data.trialId} ${type} data`);
    } catch (error) {
      console.error("Error saving trial data:", error);
    }
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
    // if (difficulty === "easy" || isCorrect) {
    if (difficulty === "easy") {
      setTimeout(() => {
        handleDifficultyChoice(false);
      }, 500);
      return <div className="h-full w-full"></div>;
    }

    // Show difficulty choice only for incorrect answers on medium/hard difficulties
    return (
      <DifficultyChoice
        revert={revert}
        trialId={trialId}
        isCorrect={isCorrect}
        remaining={remaining}
        onChoice={handleDifficultyChoice}
        onDataCollection={handleDataCollection}
      />
    );
  }

  return (
    <MathProblem
      trialId={trialId}
      difficulty={difficulty}
      sequence={problem.sequence}
      answers={problem.answers}
      correctAnswer={problem.correctAnswer}
      onComplete={handleComplete}
      onReset={handleReset}
      onDataCollection={handleDataCollection}
    />
  );
};
