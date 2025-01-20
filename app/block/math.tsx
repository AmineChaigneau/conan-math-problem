import { Button } from "@/components/ui/button";
import Cursor from "@/components/ui/cursor";
import { TIMING } from "@/constants/mathProblemGenerator";
import { Plus } from "lucide-react";
import { Fira_Code } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export type MathProblemProps = {
  difficulty: string;
  sequence: string;
  answers: number[];
  correctAnswer: number;
  onComplete: (correct: boolean) => void;
};

export const MathProblem = (props: MathProblemProps) => {
  const { difficulty, sequence, answers, correctAnswer, onComplete } = props;

  const [displayState, setDisplayState] = useState<
    "fixation" | "sequence" | "question" | null
  >(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cursorPositionsRef = useRef<
    { x: number; y: number; timestamp: number }[]
  >([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert sequence string to array of elements
  const sequenceElements = sequence.split(" ");

  // Add useEffect to set initial cursor position when container is mounted
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  }, [displayState]); // Reset when display state changes

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      // Constrain cursor within container bounds
      const x = Math.min(Math.max(e.clientX, rect.left), rect.right);
      const y = Math.min(Math.max(e.clientY, rect.top), rect.bottom);
      setCursorPosition({ x, y });
    }
  };

  const handleCursorDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    cursorPositionsRef.current = [
      {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      },
    ];
  };

  const resetCursorPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;

    setIsDragging(false);
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const answerButton = element?.closest("button");

    if (answerButton) {
      const selectedAnswer = parseInt(answerButton.textContent || "0");
      const isCorrect = selectedAnswer === correctAnswer;
      onComplete(isCorrect);
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
    // Start with fixation cross
    setDisplayState("fixation");

    // Focus the center button which moves cursor to center
    const centerButton = document.getElementById("center-focus-button");
    if (centerButton) {
      centerButton.focus();
    }

    // After fixation time, start sequence
    const fixationTimer = setTimeout(() => {
      setDisplayState("sequence");
      setCurrentIndex(0);
    }, TIMING.fixationTime);

    return () => clearTimeout(fixationTimer);
  }, [sequence]); // Reset when sequence changes

  useEffect(() => {
    if (displayState !== "sequence") return;

    const timer = setTimeout(
      () => {
        if (currentIndex < sequenceElements.length - 1) {
          setCurrentIndex(currentIndex + 1);
        } else {
          setDisplayState("question");
        }
      },
      sequenceElements[currentIndex].match(/[+\-]/)
        ? TIMING.symbolTime
        : TIMING.numberTime
    );

    return () => clearTimeout(timer);
  }, [currentIndex, displayState, sequenceElements]);

  return (
    <div
      className="flex flex-col items-center justify-center w-full h-full relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className={`text-8xl ${firaCode.className}`}>
        {displayState === "fixation" && (
          <Plus className="w-16 h-16 text-zinc-400" />
        )}
        {displayState === "sequence" && sequenceElements[currentIndex]}
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
            <div className="text-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-200">
              +
            </div>
            {answers.map((answer, index) => {
              const position = {
                0: "top-5 left-0",
                1: "top-5 right-0",
                2: "bottom-5 left-0",
                3: "bottom-5 right-0",
              }[index];

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`
                    absolute 
                    ${position} 
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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
