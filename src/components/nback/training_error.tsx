"use client";

import { TimeAlert } from "@/components/timeAlert";
import { Button } from "@/components/ui/button";
import Cursor from "@/components/ui/cursor";
import { useDeadline } from "@/hooks/deadline";
import { useMouseTracking } from "@/hooks/useMouseTracking";
import { Fira_Code } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

// Constants for deadline durations
const STARTING_DEADLINE_DURATION = 2500;
const INTERACTION_DEADLINE_DURATION = 2500;

export type TrainingErrorProps = {
  errorType: "miss" | "falseAlarm";
  onChoice: (restart: boolean) => void;
};

export const TrainingError = ({ errorType, onChoice }: TrainingErrorProps) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [timeAlertOpen, setTimeAlertOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isStartedRef = useRef(false);

  const { resetPositions } = useMouseTracking(isDragging);

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
      const isRestart = choiceButton.textContent?.includes("Restart") ?? false;
      onChoice(isRestart);
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

  const getErrorDisplay = () => {
    return errorType === "miss" ? "MISSED" : "ERROR";
  };

  const getErrorMessage = () => {
    return errorType === "miss"
      ? "You missed a required response"
      : "You responded when you shouldn't have";
  };

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
            Restart
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
            Continue
          </Button>
        </div>
        <div
          className={`absolute flex flex-col items-center justify-center gap-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center ${firaCode.className}`}
        >
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-6xl font-bold text-center text-red-600">
              {getErrorDisplay()}
            </h1>
            <h2 className="text-3xl">Training Error</h2>
            <div className="text-lg text-red-600">{getErrorMessage()}</div>
          </div>

          <h3 className="text-lg mt-4 max-w-md">
            Drag the cursor to continue the training
          </h3>
        </div>
      </div>
    </div>
  );
};
