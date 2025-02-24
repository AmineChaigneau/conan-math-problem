import { TimeAlert } from "@/components/timeAlert";
import { Button } from "@/components/ui/button";
import Cursor from "@/components/ui/cursor";
import { STARTING_DEADLINE_DURATION } from "@/constants/block";
import { TIMING } from "@/constants/mathProblemGenerator";
import { useDeadline } from "@/hooks/deadline";
import { useMouseTracking } from "@/hooks/useMouseTracking";
import { MathTrialData } from "@/types/analytics";
import { Plus } from "lucide-react";
import { Fira_Code } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import { Sequence } from "./sequence";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export type MathProblemProps = {
  trialId: number;
  difficulty: string;
  sequence: string;
  answers: number[];
  correctAnswer: number;
  onComplete: (correct: boolean) => void;
  onReset: () => void;
  onDataCollection: (data: MathTrialData) => void;
};

export const MathProblem = (props: MathProblemProps) => {
  const {
    trialId,
    difficulty,
    sequence,
    answers,
    correctAnswer,
    onComplete,
    onReset,
    onDataCollection,
  } = props;

  const [displayState, setDisplayState] = useState<
    "fixation" | "question" | null
  >(null);
  const [isStarted, setIsStarted] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [timeAlertOpen, setTimeAlertOpen] = useState(false);
  const isStartedRef = useRef(false);

  const trialStartTime = useRef(Date.now());
  const dragStartTime = useRef<number | null>(null);
  const { positions, resetPositions } = useMouseTracking(isDragging);

  const containerRef = useRef<HTMLDivElement>(null);
  const [sequenceStarted, setSequenceStarted] = useState(false);

  // Initialize single deadline
  const firstDragDeadline = useDeadline({
    duration: STARTING_DEADLINE_DURATION,
    onExpired: () => {
      if (!isStartedRef.current && !isDragging) {
        resetCursorPosition();
        setIsDragging(false);
        setTimeAlertOpen(true);
        onReset();
      }
    },
    startImmediately: true,
  });

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom - 50,
      });
    }
  }, [displayState]);

  const handleCursorDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setSequenceStarted(true);
    setTimeAlertOpen(false);
    firstDragDeadline.stop();
    isStartedRef.current = true;
    dragStartTime.current = Date.now();
  };

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

  const resetCursorPosition = () => {
    firstDragDeadline.start();
    isStartedRef.current = false;
    resetPositions();

    setTimeout(() => {
      setTimeAlertOpen(false);
    }, TIMING.fixationTime);

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
    setSequenceStarted(false);
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const answerButton = element?.closest("button");

    if (answerButton) {
      const selectedAnswer = parseInt(answerButton.textContent || "0");
      const isCorrect = selectedAnswer === correctAnswer;

      // Collect trial data
      const trialData: MathTrialData = {
        timeStamp: new Date().toISOString(),
        trialId: trialId,
        sequence,
        answers,
        correctAnswer,
        selectedAnswer,
        isCorrect,
        difficulty,
        mouseTrajectory: positions,
        initiationTime: dragStartTime.current
          ? dragStartTime.current - trialStartTime.current
          : 0,
        totalTime: Date.now() - trialStartTime.current,
        trialStartTime: trialStartTime.current,
      };

      onDataCollection(trialData);
      onComplete(isCorrect);
      setIsStarted(false);
    } else {
      onReset();
      setDisplayState("fixation");
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

  useEffect(() => {
    if (!isStarted) {
      setDisplayState("fixation");
      setIsStarted(true);
    }
    const fixationTimer = setTimeout(() => {
      setDisplayState("question");
    }, TIMING.fixationTime);

    return () => clearTimeout(fixationTimer);
  }, [sequence]);

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <TimeAlert open={timeAlertOpen} variant="warning" />
      <div className={`text-8xl ${firaCode.className}`}>
        {displayState === "fixation" && (
          <Plus className="w-16 h-16 text-zinc-400" />
        )}
      </div>
      {displayState === "question" && (
        <>
          <div
            ref={containerRef}
            className="relative h-full aspect-square px-[5px]"
          >
            <Cursor
              position={cursorPosition}
              isVisible={displayState === "question"}
              isDraggable={!isDragging && displayState === "question"}
              onDragStart={handleCursorDragStart}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Sequence
                sequence={sequence}
                isStarting={sequenceStarted}
                shouldReset={!isDragging}
                stimuliType="visual"
              />
            </div>
            <div className="text-2xl absolute bottom-[40px] left-1/2 -translate-x-1/2 text-zinc-200">
              +
            </div>
            <div className="absolute top-5 left-0 right-0 flex flex-row justify-between px-5">
              {[...answers]
                .sort((a, b) => a - b)
                .map((answer, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`
                    p-4 w-[125px] h-[125px] text-4xl ${firaCode.className}
                    ${
                      isDragging
                        ? `border-2 ${
                            difficulty === "easy"
                              ? "border-blue-400"
                              : "border-orange-600"
                          }`
                        : "bg-zinc-300 border-2 border-zinc-500"
                    }
                  `}
                  >
                    {!isDragging ? "" : answer}
                  </Button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
