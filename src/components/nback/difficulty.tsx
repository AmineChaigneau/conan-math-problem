"use client";

import { TimeAlert } from "@/components/timeAlert";
import { Button } from "@/components/ui/button";
import Cursor from "@/components/ui/cursor";
import {
  INTERACTION_DEADLINE_DURATION,
  STARTING_DEADLINE_DURATION,
} from "@/constants/block";
import { useDeadline } from "@/hooks/deadline";
import { useMouseTracking } from "@/hooks/useMouseTracking";
import { Fira_Code } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

interface TrialResults {
  trialId: string | number;
  stimuliSequence: string[];
  responses: Array<{
    stimulusIndex: number;
    stimulusValue: string;
    isMatchExpected: boolean;
    userResponded: boolean;
    reactionTime: number | null;
    responseTime?: number;
  }>;
  summary: {
    totalStimuli: number;
    totalMatches: number;
    correctHits: number;
    falseAlarms: number;
    misses: number;
    correctRejections: number;
    accuracy: number;
    meanReactionTime: number | null;
    hitRate: number;
    falseAlarmRate: number;
  };
}

interface NbackDifficultyChoiceData {
  timeStamp: string;
  trialId: number;
  trialResults: TrialResults;
  currentLevel: number;
  selectedChoice: "easier" | "continue";
  mouseTrajectory: Array<{ x: number; y: number; timestamp: number }>;
  initiationTime: number;
  totalTime: number;
  trialStartTime: number;
}

export type NbackDifficultyProps = {
  trialId: number;
  trialResults: TrialResults;
  currentLevel: number;
  remainingTrials: number;
  onChoice: (switchToEasier: boolean) => void;
  onDataCollection: (data: NbackDifficultyChoiceData) => void;
};

export const NbackDifficultyChoice = ({
  trialId,
  trialResults,
  currentLevel,
  remainingTrials,
  onChoice,
  onDataCollection,
}: NbackDifficultyProps) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [timeAlertOpen, setTimeAlertOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isStartedRef = useRef(false);

  const trialStartTime = useRef(Date.now());
  const dragStartTime = useRef<number | null>(null);
  const { positions, resetPositions } = useMouseTracking(isDragging);

  // Initialize deadlines
  const firstDragDeadline = useDeadline({
    duration: STARTING_DEADLINE_DURATION,
    onExpired: () => {
      if (!isStartedRef.current && !isDragging) {
        console.log("first drag deadline expired");
        resetCursorPosition();
        setIsDragging(false);
        setTimeAlertOpen(true);
      } else {
        interactionDeadline.start();
      }
    },
    startImmediately: true,
  });

  const interactionDeadline = useDeadline({
    duration: INTERACTION_DEADLINE_DURATION,
    onExpired: () => {
      console.log("interaction deadline expired");
      setIsDragging(false);
      setTimeAlertOpen(true);
      resetCursorPosition();
      interactionDeadline.stop();
    },
  });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom - 50,
      });
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX, rect.left), rect.right);
      const y = Math.min(Math.max(e.clientY, rect.top), rect.bottom);
      requestAnimationFrame(() => {
        setCursorPosition({ x, y });
      });
    }
  };

  const handleCursorDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setTimeAlertOpen(false);
    firstDragDeadline.stop();
    interactionDeadline.start();
    isStartedRef.current = true;
    dragStartTime.current = Date.now();
  };

  const resetCursorPosition = () => {
    firstDragDeadline.start();
    interactionDeadline.stop();
    isStartedRef.current = false;
    resetPositions();

    setTimeout(() => {
      setTimeAlertOpen(false);
    }, 1000);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom - 50,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (interactionDeadline.alert()) {
      resetCursorPosition();
      interactionDeadline.stop();
      firstDragDeadline.start();
      return;
    }

    const element = document.elementFromPoint(e.clientX, e.clientY);
    const choiceButton = element?.closest("button");

    if (choiceButton) {
      const isSwitchToEasier =
        choiceButton.textContent?.includes("Switch to Easier") ?? false;

      // Collect difficulty choice data
      const choiceData: NbackDifficultyChoiceData = {
        timeStamp: new Date().toISOString(),
        trialId: trialId,
        trialResults: trialResults,
        currentLevel: currentLevel,
        selectedChoice: isSwitchToEasier ? "easier" : "continue",
        mouseTrajectory: positions,
        initiationTime: dragStartTime.current
          ? dragStartTime.current - trialStartTime.current
          : 0,
        totalTime: Date.now() - trialStartTime.current,
        trialStartTime: trialStartTime.current,
      };

      onDataCollection(choiceData);
      onChoice(isSwitchToEasier);
    }

    resetCursorPosition();
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        resetCursorPosition();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isDragging]);

  // Get performance feedback
  const accuracy = (trialResults.summary.accuracy * 100).toFixed(1);
  const isGoodPerformance = trialResults.summary.accuracy >= 0.7; // 70% threshold

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <TimeAlert
        open={timeAlertOpen}
        variant={isDragging ? "reached" : "warning"}
      />
      <div ref={containerRef} className="relative h-full w-full">
        <Cursor
          position={cursorPosition}
          isVisible={true}
          isDraggable={!isDragging}
          onDragStart={handleCursorDragStart}
        />
        <div className="absolute top-5 left-0 right-0 flex flex-row justify-between px-5">
          <Button
            className={`
            p-4 w-[150px] h-[125px] text-lg ${
              firaCode.className
            } text-wrap text-center
            ${
              isDragging
                ? "border-2 border-orange-600"
                : "bg-zinc-300 border-2 border-zinc-500 text-zinc-700"
            }
          `}
            variant="outline"
          >
            Switch to Easier Level
          </Button>
          <Button
            className={`
            p-4 w-[150px] h-[125px] text-lg ${
              firaCode.className
            } text-wrap text-center
            ${
              isDragging
                ? "border-2 border-orange-600"
                : "bg-zinc-300 border-2 border-zinc-500 text-zinc-700"
            }
          `}
            variant="outline"
          >
            Continue Current Level
          </Button>
        </div>
        <div
          className={`absolute flex flex-col items-center justify-center gap-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center ${firaCode.className}`}
        >
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-6xl font-bold text-center">{accuracy}%</h1>
            <h2 className="text-3xl">Trial Accuracy</h2>
            <div
              className={`text-lg ${
                isGoodPerformance ? "text-green-600" : "text-red-600"
              }`}
            >
              {isGoodPerformance ? "Good performance!" : "Room for improvement"}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 text-sm text-gray-600">
            <div>Current Level: {currentLevel}-back</div>
            <div>Trials remaining: {remainingTrials}</div>
            <div>
              Hits: {trialResults.summary.correctHits} | False Alarms:{" "}
              {trialResults.summary.falseAlarms}
            </div>
            {trialResults.summary.meanReactionTime && (
              <div>
                Avg RT: {trialResults.summary.meanReactionTime.toFixed(0)}ms
              </div>
            )}
          </div>

          <h3 className="text-lg mt-4 max-w-md">
            Would you like to continue with the current difficulty <br />
            or switch to an easier level?
          </h3>
        </div>
      </div>
    </div>
  );
};
