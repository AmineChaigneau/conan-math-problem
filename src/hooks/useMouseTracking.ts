import { MousePosition } from "@/types/analytics";
import { useEffect, useRef, useState } from "react";

export const useMouseTracking = (isTracking: boolean) => {
  const [positions, setPositions] = useState<MousePosition[]>([]);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<MousePosition | null>(null);

  const resetPositions = () => {
    setPositions([]);
    lastPositionRef.current = null;
  };

  useEffect(() => {
    if (isTracking) {
      // Clear previous positions when starting new tracking
      setPositions([]);

      const handleMouseMove = (e: MouseEvent) => {
        const newPosition = {
          x: e.clientX,
          y: e.clientY,
          timestamp: Date.now(),
        };
        lastPositionRef.current = newPosition;
        setPositions((prev) => [...prev, newPosition]);
      };

      // Add mousemove listener with throttling
      trackingInterval.current = setInterval(() => {
        if (lastPositionRef.current) {
          setPositions((prev) => [
            ...prev,
            lastPositionRef.current as MousePosition,
          ]);
        }
      }, 10);

      window.addEventListener("mousemove", handleMouseMove);

      return () => {
        if (trackingInterval.current) {
          clearInterval(trackingInterval.current);
        }
        window.removeEventListener("mousemove", handleMouseMove);
      };
    } else {
      if (trackingInterval.current) {
        clearInterval(trackingInterval.current);
      }
      lastPositionRef.current = null;
    }
  }, [isTracking]); // Remove positions from dependencies

  return { positions, resetPositions };
};
