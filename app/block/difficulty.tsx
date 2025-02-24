import { TimeAlert } from "@/components/timeAlert";
import { Button } from "@/components/ui/button";
import Cursor from "@/components/ui/cursor";
import {
  INTERACTION_DEADLINE_DURATION,
  STARTING_DEADLINE_DURATION,
} from "@/constants/block";
import { useDeadline } from "@/hooks/deadline";
import { useMouseTracking } from "@/hooks/useMouseTracking";
import { DifficultyChoiceData } from "@/types/analytics";
import { Fira_Code } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export type DifficultyProps = {
  revert: boolean;
  trialId: number;
  isCorrect: boolean;
  remaining: number;
  onChoice: (giveUp: boolean) => void;
  onDataCollection: (data: DifficultyChoiceData) => void;
};

export const DifficultyChoice = ({
  revert,
  trialId,
  isCorrect,
  remaining,
  onChoice,
  onDataCollection,
}: DifficultyProps) => {
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
        y: rect.bottom - 50, // Position cursor at bottom center
        // y: rect.top + rect.height / 2,
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
        // y: rect.top + rect.height / 2,
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
      const isGiveUp =
        choiceButton.textContent?.includes("Switch Easy") ?? false;

      // Collect difficulty choice data
      const choiceData: DifficultyChoiceData = {
        timeStamp: new Date().toISOString(),
        trialId: trialId,
        isCorrect,
        remaining,
        selectedChoice: isGiveUp ? "easier" : "continue",
        revert: revert,
        mouseTrajectory: positions,
        initiationTime: dragStartTime.current
          ? dragStartTime.current - trialStartTime.current
          : 0,
        totalTime: Date.now() - trialStartTime.current,
        trialStartTime: trialStartTime.current,
      };

      onDataCollection(choiceData);
      onChoice(isGiveUp);
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

  // if (isCorrect) {
  //   return null;
  // }

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
            p-4 w-[125px] h-[125px] text-xl ${firaCode.className} text-wrap
            ${
              isDragging
                ? "border-2 border-orange-600"
                : "bg-zinc-300 border-2 border-zinc-500 text-zinc-700"
            }
          `}
            variant="outline"
          >
            {/* {isDragging ? "Try Again" : ""} */}
            {revert ? "Continue Difficult" : "Switch Easy"}
          </Button>
          <Button
            className={`
            p-4 w-[125px] h-[125px] text-xl ${firaCode.className} text-wrap
            ${
              isDragging
                ? "border-2 border-orange-600"
                : "bg-zinc-300 border-2 border-zinc-500 text-zinc-700"
            }
          `}
            variant="outline"
          >
            {/* {isDragging ? "Make Easier" : ""} */}
            {!revert ? "Continue Difficult" : "Switch Easy"}
          </Button>
        </div>
        <div
          className={`absolute flex flex-col items-center justify-center gap-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center ${firaCode.className}`}
        >
          <h1 className="text-6xl font-bold">
            {isCorrect ? remaining - 1 : remaining}
          </h1>
          <h2 className="text-4xl">Remaining correct answers</h2>
          <h3 className="text-lg">
            Would you like to try another difficult problem <br /> or switch to
            easier ones?
          </h3>
        </div>
      </div>
    </div>
  );
};
