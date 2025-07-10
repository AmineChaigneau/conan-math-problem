"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { GAP_BETWEEN_CHECKPOINT, N_EASIER } from "@/constants/block";
import { AttemptResults, ResponseData, TrialSummary } from "@/types/nback";
import { generateSequenceFromMatches } from "@/utils/generateSequenceFromMatches";
import { Fira_Code } from "next/font/google";
import { GetReady } from "./getReady";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

// Local constant to avoid linting issues
const GAP_CHECKPOINT = GAP_BETWEEN_CHECKPOINT;
const PREPARING_DURATION = 1500; // Duration for preparing phase in milliseconds
const COMPLETED_DURATION = 1000; // Duration for completed phase in milliseconds

interface NbackComponentProps {
  trialId: string | number;
  attemptIndex?: number;
  N: number;
  stimulusTime: number;
  intertrialInterval: number;
  sequenceLength?: number;
  targetKey?: string;
  predefinedSequence?: string[];
  matches?: number[]; // Array of 0s and 1s indicating where matches should occur
  currentTrialIndex?: number; // For logging purposes
  startFromIndex?: number; // Index to start from (for checkpoint restart)
  ghostLetters?: string[]; // Ghost context letters for checkpoint restart
  onTrialEnd: (results: AttemptResults) => void;
  onError?: (errorData: {
    stimulusIndex: number;
    errorType: "miss" | "falseAlarm";
    currentResponses: ResponseData[];
    lastCheckpoint: number; // Add checkpoint info
  }) => void;
}

export const NbackComponent: React.FC<NbackComponentProps> = ({
  trialId,
  attemptIndex = 1,
  N = 2,
  stimulusTime,
  intertrialInterval,
  sequenceLength = 20,
  targetKey = " ",
  predefinedSequence,
  matches,
  currentTrialIndex,
  startFromIndex = 0, // Default to start from beginning
  ghostLetters,
  onTrialEnd,
  onError,
}) => {
  const [currentStimulusIndex, setCurrentStimulusIndex] = useState(-1);
  const [stimuliSequence, setStimuliSequence] = useState<string[]>([]);
  const [, setResponses] = useState<ResponseData[]>([]);
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [stimulusStartTime, setStimulusStartTime] = useState<number | null>(
    null
  );
  const [trialPhase, setTrialPhase] = useState<
    "preparing" | "ghost" | "showing" | "interval" | "completed"
  >("preparing");
  const [lettersShown, setLettersShown] = useState(0);
  const [feedbackColor, setFeedbackColor] = useState<string>("#000");
  const [currentGhostIndex, setCurrentGhostIndex] = useState(-1);
  const [validatedCheckpoints, setValidatedCheckpoints] = useState<Set<number>>(
    new Set()
  );

  const attemptStartTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stimuliRef = useRef<string[]>([]);
  const responsesRef = useRef<ResponseData[]>([]);
  const ghostLettersRef = useRef<string[]>([]);

  // Helper function to calculate the last checkpoint index
  const getLastCheckpoint = (errorIndex: number): number => {
    if (errorIndex < GAP_CHECKPOINT) return 0;
    return Math.floor(errorIndex / GAP_CHECKPOINT) * GAP_CHECKPOINT;
  };

  // Function to start ghost letter sequence
  const startGhostSequence = useCallback(() => {
    if (ghostLettersRef.current.length === 0) {
      startNextStimulus(startFromIndex);
      return;
    }

    setCurrentGhostIndex(0);
    setTrialPhase("ghost");
    console.log(
      "Starting ghost sequence with letters:",
      ghostLettersRef.current
    );

    // Show first ghost letter
    showGhostLetter(0);
  }, [startFromIndex]);

  // Function to show individual ghost letters
  const showGhostLetter = useCallback(
    (ghostIndex: number) => {
      if (ghostIndex >= ghostLettersRef.current.length) {
        // Ghost sequence completed, start main sequence
        setCurrentGhostIndex(-1);
        setTrialPhase("interval");
        timeoutRef.current = setTimeout(() => {
          startNextStimulus(startFromIndex);
        }, 300); // Reduced from intertrialInterval to 300ms for smoother transition
        return;
      }

      setCurrentGhostIndex(ghostIndex);
      setTrialPhase("ghost");

      // Show ghost letter for stimulusTime
      timeoutRef.current = setTimeout(() => {
        setTrialPhase("interval");

        // Move to next ghost letter with same timing as normal sequence
        timeoutRef.current = setTimeout(() => {
          showGhostLetter(ghostIndex + 1);
        }, intertrialInterval);
      }, stimulusTime);
    },
    [stimulusTime, intertrialInterval, startFromIndex]
  );

  // Initialize trial
  useEffect(() => {
    let sequence: string[];
    let actualMatches: number[];

    if (predefinedSequence) {
      // Use predefined sequence and calculate matches from it
      sequence = predefinedSequence;

      // Calculate matches for predefined sequence
      actualMatches = new Array(sequence.length).fill(0);
      const actualN = N === 1 ? N_EASIER : N;
      for (let i = actualN; i < sequence.length; i++) {
        if (sequence[i] === sequence[i - actualN]) {
          actualMatches[i] = 1;
        }
      }
    } else if (matches) {
      // Use provided matches array to generate sequence
      const actualN = N === 1 ? N_EASIER : N; // Use N_EASIER for easier sequences
      const seed = Date.now() + attemptIndex;
      sequence = generateSequenceFromMatches(matches, actualN, seed);
      console.log("Sequence:", sequence);
      actualMatches = matches;
    } else {
      // Fallback: generate a basic sequence (shouldn't happen in normal usage)
      console.warn("No matches array or predefined sequence provided");
      sequence = new Array(sequenceLength).fill("A");
      actualMatches = new Array(sequenceLength).fill(0);
    }

    // Log the generated sequence and matches
    console.log(
      `Trial ${currentTrialIndex || "unknown"} - Generated sequence:`,
      sequence
    );
    console.log(
      `Trial ${currentTrialIndex || "unknown"} - Matches:`,
      actualMatches
    );
    console.log(
      `Trial ${currentTrialIndex || "unknown"} - N-back level:`,
      N === 1 ? N_EASIER : N
    );
    console.log(
      `Trial ${currentTrialIndex || "unknown"} - Starting from index:`,
      startFromIndex
    );

    setStimuliSequence(sequence);
    stimuliRef.current = sequence;

    // Set ghost letters if provided
    if (ghostLetters && ghostLetters.length > 0) {
      ghostLettersRef.current = ghostLetters;
      console.log(
        `Trial ${currentTrialIndex || "unknown"} - Ghost letters:`,
        ghostLetters
      );
    } else {
      ghostLettersRef.current = [];
    }

    // Initialize responses array
    const initialResponses: ResponseData[] = sequence.map((stimulus, index) => {
      let isMatchExpected = false;

      if (index >= 0 && actualMatches[index] === 1) {
        isMatchExpected = true;
      }

      return {
        stimulusIndex: index,
        stimulusValue: stimulus,
        isMatchExpected,
        userResponded: false,
        reactionTime: null,
      };
    });

    setResponses(initialResponses);
    responsesRef.current = initialResponses;
    setIsTrialActive(true);

    // Initialize letters shown counter from start index
    setLettersShown(startFromIndex);

    // Initialize validated checkpoints - mark as validated if starting from a checkpoint
    const initialValidatedCheckpoints = new Set<number>();
    if (startFromIndex > 0) {
      // Mark all checkpoints before startFromIndex as validated
      for (let i = 1; i <= Math.floor(startFromIndex / GAP_CHECKPOINT); i++) {
        initialValidatedCheckpoints.add(i);
      }
    }
    setValidatedCheckpoints(initialValidatedCheckpoints);

    // Set attempt start time
    attemptStartTimeRef.current = Date.now();

    // Start the trial - either with ghost letters or directly to the sequence
    timeoutRef.current = setTimeout(() => {
      if (ghostLettersRef.current.length > 0) {
        // Start with ghost letters
        startGhostSequence();
      } else {
        // Start directly with the main sequence
        startNextStimulus(startFromIndex);
      }
    }, PREPARING_DURATION);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    trialId,
    attemptIndex,
    N,
    stimulusTime,
    intertrialInterval,
    sequenceLength,
    predefinedSequence,
    matches,
    currentTrialIndex,
    startFromIndex, // Add to dependencies
    ghostLetters, // Add to dependencies
  ]);

  const startNextStimulus = useCallback(
    (stimulusIndex: number) => {
      if (stimulusIndex >= stimuliRef.current.length) {
        // Trial completed
        setTrialPhase("completed");
        setIsTrialActive(false);

        // Wait for COMPLETED_DURATION before sending results
        timeoutRef.current = setTimeout(() => {
          calculateAndSendResults();
        }, COMPLETED_DURATION);
        return;
      }

      setCurrentStimulusIndex(stimulusIndex);
      setTrialPhase("showing");
      setStimulusStartTime(Date.now());

      // Update progress
      setLettersShown((prev) => prev + 1);

      // Check if we've reached a new checkpoint
      if (stimulusIndex > 0 && stimulusIndex % GAP_CHECKPOINT === 0) {
        const checkpointNumber = Math.floor(stimulusIndex / GAP_CHECKPOINT);
        setValidatedCheckpoints(
          (prev) => new Set([...Array.from(prev), checkpointNumber])
        );
      }

      setFeedbackColor("#000");

      // Hide stimulus after stimulusTime
      timeoutRef.current = setTimeout(() => {
        setTrialPhase("interval");
        setCurrentStimulusIndex(-1);
        setStimulusStartTime(null);

        // Check for errors on this stimulus
        if (onError) {
          const currentResponse = responsesRef.current[stimulusIndex];
          if (currentResponse) {
            // Check for miss
            if (
              currentResponse.isMatchExpected &&
              !currentResponse.userResponded
            ) {
              setFeedbackColor("#ef4444");
              const lastCheckpoint = getLastCheckpoint(stimulusIndex);
              onError({
                stimulusIndex,
                errorType: "miss",
                currentResponses: [...responsesRef.current],
                lastCheckpoint,
              });
              return;
            }
            // Check for false alarm
            if (
              !currentResponse.isMatchExpected &&
              currentResponse.userResponded
            ) {
              setFeedbackColor("#ef4444");
              const lastCheckpoint = getLastCheckpoint(stimulusIndex);
              onError({
                stimulusIndex,
                errorType: "falseAlarm",
                currentResponses: [...responsesRef.current],
                lastCheckpoint,
              });
              return;
            }
          }
        }

        // Start next stimulus after inter-trial interval
        timeoutRef.current = setTimeout(() => {
          startNextStimulus(stimulusIndex + 1);
        }, intertrialInterval);
      }, stimulusTime);
    },
    [stimulusTime, intertrialInterval, onError]
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (targetKey !== " ") return;

      if (!isTrialActive || currentStimulusIndex === -1 || !stimulusStartTime)
        return;

      if (event.key === targetKey) {
        event.preventDefault();

        const reactionTime = Date.now() - stimulusStartTime;
        const responseTime = Date.now();

        // Update the response for current stimulus
        const updatedResponses = [...responsesRef.current];
        updatedResponses[currentStimulusIndex] = {
          ...updatedResponses[currentStimulusIndex],
          userResponded: true,
          reactionTime,
          responseTime,
        };

        setResponses(updatedResponses);
        responsesRef.current = updatedResponses;

        // Set feedback color based on correctness
        const currentResponse = updatedResponses[currentStimulusIndex];
        if (currentResponse.isMatchExpected) {
          setFeedbackColor("#22c55e");
        } else {
          setFeedbackColor("#ef4444");
        }
      }
    },
    [isTrialActive, currentStimulusIndex, stimulusStartTime, targetKey]
  );

  const handleClick = useCallback(() => {
    if (targetKey !== "click") return;

    if (!isTrialActive || currentStimulusIndex === -1 || !stimulusStartTime)
      return;

    const reactionTime = Date.now() - stimulusStartTime;
    const responseTime = Date.now();

    // Update the response for current stimulus
    const updatedResponses = [...responsesRef.current];
    updatedResponses[currentStimulusIndex] = {
      ...updatedResponses[currentStimulusIndex],
      userResponded: true,
      reactionTime,
      responseTime,
    };

    setResponses(updatedResponses);
    responsesRef.current = updatedResponses;

    // Set feedback color based on correctness
    const currentResponse = updatedResponses[currentStimulusIndex];
    if (currentResponse.isMatchExpected) {
      setFeedbackColor("#22c55e");
    } else {
      setFeedbackColor("#ef4444");
    }
  }, [isTrialActive, currentStimulusIndex, stimulusStartTime, targetKey]);

  const calculateAndSendResults = useCallback(() => {
    const finalResponses = responsesRef.current;
    const endTime = Date.now();

    let correctHits = 0;
    let falseAlarms = 0;
    let misses = 0;
    let correctRejections = 0;
    let totalMatches = 0;
    const totalReactionTimes: number[] = [];

    finalResponses.forEach((response) => {
      if (response.isMatchExpected) {
        totalMatches++;
        if (response.userResponded) {
          correctHits++;
          if (response.reactionTime) {
            totalReactionTimes.push(response.reactionTime);
          }
        } else {
          misses++;
        }
      } else {
        if (response.userResponded) {
          falseAlarms++;
          if (response.reactionTime) {
            totalReactionTimes.push(response.reactionTime);
          }
        } else {
          correctRejections++;
        }
      }
    });

    const accuracy = (correctHits + correctRejections) / finalResponses.length;
    const meanReactionTime =
      totalReactionTimes.length > 0
        ? totalReactionTimes.reduce((a, b) => a + b, 0) /
          totalReactionTimes.length
        : null;
    const hitRate = totalMatches > 0 ? correctHits / totalMatches : 0;
    const falseAlarmRate =
      finalResponses.length - totalMatches > 0
        ? falseAlarms / (finalResponses.length - totalMatches)
        : 0;

    const summary: TrialSummary = {
      totalStimuli: finalResponses.length,
      totalMatches,
      correctHits,
      falseAlarms,
      misses,
      correctRejections,
      accuracy,
      meanReactionTime,
      hitRate,
      falseAlarmRate,
    };

    const results: AttemptResults = {
      trialId,
      attemptIndex,
      responses: finalResponses,
      startTime: attemptStartTimeRef.current,
      endTime,
      matchesSequence: matches || [],
      summary,
    };

    onTrialEnd(results);
  }, [trialId, attemptIndex, onTrialEnd]);

  // Keyboard event listener
  useEffect(() => {
    if (isTrialActive) {
      document.addEventListener("keydown", handleKeyPress);
      return () => {
        document.removeEventListener("keydown", handleKeyPress);
      };
    }
  }, [isTrialActive, handleKeyPress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getCurrentStimulus = () => {
    if (
      currentStimulusIndex < 0 ||
      currentStimulusIndex >= stimuliRef.current.length
    ) {
      return "";
    }
    return stimuliRef.current[currentStimulusIndex];
  };

  const getPhaseDisplay = () => {
    // Determine if we should use restart variant
    const isRestart =
      startFromIndex > 0 ||
      (ghostLetters && ghostLetters.length > 0) ||
      N === 1;

    switch (trialPhase) {
      case "preparing":
        return <GetReady N={N} variant={isRestart ? "restart" : "default"} />;
      case "ghost":
        if (
          currentGhostIndex >= 0 &&
          currentGhostIndex < ghostLettersRef.current.length
        ) {
          return ghostLettersRef.current[currentGhostIndex];
        }
        return "";
      case "showing":
        return getCurrentStimulus();
      case "interval":
        return "+";
      case "completed":
        return <GetReady N={N} variant="completed" />;
      default:
        return "";
    }
  };

  const getStimulusColor = () => {
    if (trialPhase === "ghost") {
      return "#999"; // Gray for ghost letters
    }
    if (trialPhase === "showing") {
      return feedbackColor;
    }
    return "#666";
  };

  return (
    <div
      className={`${firaCode.className} flex flex-col items-center justify-center h-full text-4xl`}
    >
      <div
        style={{
          minHeight: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize:
            trialPhase === "showing" || trialPhase === "ghost"
              ? "72px"
              : "24px",
          fontWeight:
            trialPhase === "showing" || trialPhase === "ghost"
              ? "bold"
              : "normal",
          color: getStimulusColor(),
        }}
      >
        {getPhaseDisplay()}
      </div>

      {isTrialActive && trialPhase !== "preparing" && (
        <div
          style={{
            position: "absolute",
            top: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "300px",
          }}
          className="flex flex-col items-center justify-center"
        >
          {/* Checkpoint indicators */}
          <div className="flex gap-2 mb-2">
            {Array.from(
              {
                length: Math.floor(stimuliSequence.length / GAP_CHECKPOINT) - 1,
              },
              (_, i) => {
                const checkpointIndex = i + 1;
                const isValidated = validatedCheckpoints.has(checkpointIndex);
                return (
                  <div
                    key={checkpointIndex}
                    className={`w-3 h-3 rounded-sm ${
                      isValidated ? "bg-red-500" : "bg-orange-500"
                    }`}
                    title={`Checkpoint ${checkpointIndex} ${
                      isValidated ? "(validated)" : ""
                    }`}
                  />
                );
              }
            )}
          </div>

          <Progress
            value={(lettersShown / stimuliSequence.length) * 100}
            className="h-2 bg-gray-200"
            variant="gray"
          />
          <div className="text-sm text-gray-500 mt-2">
            Letters: {lettersShown} / {stimuliSequence.length}
          </div>
        </div>
      )}

      {targetKey === "click" && (
        <div
          id="clickArea"
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-10 h-10 border-2 border-gray-500 bg-slate-200 rounded-lg z-10 hover:bg-orange-400 hover:border-gray-700 transition-colors select-none"
          onClick={handleClick}
          style={{ cursor: "pointer", pointerEvents: "auto" }}
        ></div>
      )}
    </div>
  );
};
