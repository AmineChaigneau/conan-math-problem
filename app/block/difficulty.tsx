import { Button } from "@/components/ui/button";
import Cursor from "@/components/ui/cursor";
import { Fira_Code } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

export type DifficultyProps = {
  isCorrect: boolean;
  remaining: number;
  onChoice: (giveUp: boolean) => void;
};

export const DifficultyChoice = ({
  isCorrect,
  remaining,
  onChoice,
}: DifficultyProps) => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPosition({
        x: rect.left + rect.width / 2,
        //  y: rect.bottom - 20, // Position cursor at bottom center
        y: rect.top + rect.height / 2,
      });
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.min(Math.max(e.clientX, rect.left), rect.right);
      const y = Math.min(Math.max(e.clientY, rect.top), rect.bottom);
      setCursorPosition({ x, y });
    }
  };

  const handleCursorDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
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
    const choiceButton = element?.closest("button");

    if (choiceButton) {
      const isGiveUp =
        choiceButton.textContent?.includes("Make Easier") ?? false;
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
      className="flex flex-col items-center justify-center w-full h-full p-6"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div ref={containerRef} className="relative h-full w-full">
        <Cursor
          position={cursorPosition}
          isVisible={true}
          isDraggable={!isDragging}
          onDragStart={handleCursorDragStart}
        />
        <Button
          className={`
            absolute top-5 left-0
            p-4 w-[200px] h-[75px] text-2xl ${firaCode.className}
            ${
              isDragging
                ? "border-2 border-orange-600 bg-orange-400"
                : "bg-zinc-300 border-2 border-zinc-500"
            }
          `}
          variant="outline"
        >
          {isDragging ? "Try Again" : ""}
        </Button>
        <Button
          className={`
            absolute top-5 right-0
            p-4 w-[200px] h-[75px] text-2xl ${firaCode.className}
            ${
              isDragging
                ? "border-2 border-orange-600 bg-orange-400"
                : "bg-zinc-300 border-2 border-zinc-500"
            }
          `}
          variant="outline"
        >
          {isDragging ? "Make Easier" : ""}
        </Button>
        <div
          className={`absolute flex flex-col items-center justify-center gap-4 top-1/2 mt-[100px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center ${firaCode.className}`}
        >
          <h1 className="text-6xl font-bold">
            {isCorrect ? remaining - 1 : remaining} remaing
          </h1>
          <h2 className="text-lg">
            Would you like to try another difficult problem <br /> or switch to
            easier ones?
          </h2>
        </div>
      </div>
    </div>
  );
};
