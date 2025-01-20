import { MouseEvent, useRef } from "react";

interface CursorProps {
  position: { x: number; y: number };
  isVisible: boolean;
  isDraggable: boolean;
  onDragStart: (e: MouseEvent) => void;
}

const Cursor = ({
  position,
  isVisible,
  isDraggable,
  onDragStart,
}: CursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  console.log(position);

  return (
    <div
      ref={cursorRef}
      onMouseDown={(e) => isDraggable && onDragStart(e)}
      className={`
        fixed
        -translate-x-1/2 -translate-y-1/2
        rounded-full
        z-[1000]
        select-none touch-none
        ${
          isDraggable
            ? "w-6 h-6 bg-zinc-400 cursor-grab pointer-events-auto border-2 border-zinc-600 shadow-md"
            : "w-8 h-8 bg-orange-400 cursor-none pointer-events-none border-2 border-orange-800 shadow-2xl"
        }
        ${isVisible ? "block" : "hidden"}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    />
  );
};

export default Cursor;
