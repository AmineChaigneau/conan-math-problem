import { useEffect, useRef } from "react";

export type DeadlineConfig = {
  duration: number;
  onExpired: () => void;
  startImmediately?: boolean;
};

export const useDeadline = ({
  duration,
  onExpired,
  startImmediately = false,
}: DeadlineConfig) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const start = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    startTimeRef.current = Date.now();
    timeoutRef.current = setTimeout(onExpired, duration);
  };

  const stop = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startTimeRef.current = null;
  };

  const alert = () => {
    if (!startTimeRef.current) return false;
    return Date.now() - startTimeRef.current > duration;
  };

  useEffect(() => {
    if (startImmediately) {
      start();
    }
    return () => stop();
  }, [startImmediately]);

  return { start, stop, alert };
};
