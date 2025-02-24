import { TIMING } from "@/constants/mathProblemGenerator";
import { Fira_Code } from "next/font/google";
import { useEffect, useRef, useState } from "react";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

interface SequenceProps {
  sequence: string;
  isStarting: boolean;
  shouldReset: boolean;
  stimuliType: "audio" | "visual";
}

export const Sequence = ({
  sequence,
  isStarting,
  shouldReset,
  stimuliType = "visual",
}: SequenceProps) => {
  const currentIndexRef = useRef(0);
  const displayIndexRef = useRef(0);
  const isRunningRef = useRef(false);
  const [, forceUpdate] = useState({});
  const sequenceElements = sequence.split(" ");

  const playAudio = (element: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = new Audio(`/audio/${element}.mp3`);
      audio.onended = () => resolve();
      audio.onerror = (error) => reject(error);
      audio.play().catch((error) => reject(error));
    });
  };

  useEffect(() => {
    if (shouldReset) {
      currentIndexRef.current = 0;
      displayIndexRef.current = 0;
      isRunningRef.current = false;
      forceUpdate({});
      return;
    }

    if (!isStarting || isRunningRef.current) return;

    isRunningRef.current = true;
    let timeoutId: NodeJS.Timeout;

    const advanceSequence = async () => {
      if (!isRunningRef.current) return;

      if (currentIndexRef.current < sequenceElements.length - 1) {
        currentIndexRef.current += 1;
        displayIndexRef.current = currentIndexRef.current;

        if (stimuliType === "audio") {
          try {
            await playAudio(sequenceElements[currentIndexRef.current]);
            if (!isRunningRef.current) return;
          } catch (error) {
            console.error("Audio playback failed:", error);
          }
        }

        forceUpdate({});

        const nextDelay =
          stimuliType === "audio"
            ? TIMING.audioTime
            : sequenceElements[currentIndexRef.current].match(/[+\-]/)
            ? TIMING.symbolTime
            : TIMING.numberTime;

        timeoutId = setTimeout(advanceSequence, nextDelay);
      } else {
        isRunningRef.current = false;
        displayIndexRef.current = -1;
        forceUpdate({});
      }
    };

    const startSequence = async () => {
      if (stimuliType === "audio") {
        try {
          await playAudio(sequenceElements[currentIndexRef.current]);
          if (!isRunningRef.current) return;
        } catch (error) {
          console.error("Audio playback failed:", error);
        }
      }

      const initialDelay =
        stimuliType === "audio"
          ? TIMING.audioTime
          : sequenceElements[currentIndexRef.current].match(/[+\-]/)
          ? TIMING.symbolTime
          : TIMING.numberTime;

      timeoutId = setTimeout(advanceSequence, initialDelay);
    };

    startSequence();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      isRunningRef.current = false;
    };
  }, [shouldReset, isStarting, stimuliType]);

  return (
    <div className={`text-8xl ${firaCode.className}`}>
      {(isStarting &&
        stimuliType === "visual" &&
        sequenceElements[displayIndexRef.current]) ||
        ""}
    </div>
  );
};
