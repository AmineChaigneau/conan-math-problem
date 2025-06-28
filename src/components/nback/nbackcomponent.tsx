"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { IS_CHECKPOINT } from "@/constants/block";
import { Fira_Code } from "next/font/google";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

interface ResponseData {
  stimulusIndex: number;
  stimulusValue: string;
  isMatchExpected: boolean;
  userResponded: boolean;
  reactionTime: number | null;
  responseTime?: number;
}

interface TrialSummary {
  totalStimuli: number;
  totalMatches: number;
  correctHits: number;
  falseAlarms: number;
  misses: number;
  correctRejections: number;
  accuracy: number;
  meanReactionTime: number | null;
  hitRate: number;
  falseAlarmRate: number;
}

interface TrialResults {
  trialId: string | number;
  stimuliSequence: string[];
  responses: ResponseData[];
  summary: TrialSummary;
}

interface NbackComponentProps {
  trialId: string | number;
  N: number;
  stimulusset: string[];
  stimulusTime: number; // 500-1500ms
  intertrialInterval: number; // 2000ms typically
  sequenceLength?: number; // Default to 20 if not provided
  targetKey?: string; // Default to spacebar
  predefinedSequence?: string[]; // Use predefined sequence from levels.json
  restartFromIndex?: number; // Index to restart from (for checkpoint mode)
  onTrialEnd: (results: TrialResults) => void;
  onError?: (errorData: {
    stimulusIndex: number;
    errorType: "miss" | "falseAlarm";
    currentResponses: ResponseData[];
    checkpointIndex: number; // Add checkpoint index to error data
  }) => void;
}

export const NbackComponent: React.FC<NbackComponentProps> = ({
  trialId,
  N,
  stimulusset,
  stimulusTime,
  intertrialInterval,
  sequenceLength = 20,
  targetKey = " ", // spacebar
  predefinedSequence,
  restartFromIndex = 0, // Default to start from beginning
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
    "preparing" | "showing" | "interval" | "completed"
  >("preparing");
  const [overallProgress, setOverallProgress] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stimuliRef = useRef<string[]>([]);
  const responsesRef = useRef<ResponseData[]>([]);

  // Add checkpoint tracking
  const lastCheckpointRef = useRef<number>(0);

  // Simple seeded random number generator (LCG)
  const seededRandom = useCallback((seed: number) => {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }, []);

  // Generate stimulus sequence with controlled number of matches
  const generateStimulusSequence = useCallback(
    (
      length: number,
      stimulusSet: string[],
      nBack: number,
      sequenceSeed?: number
    ): string[] => {
      const rng = sequenceSeed ? seededRandom(sequenceSeed) : Math.random;
      const sequence: string[] = [];
      const targetMatchRate = 0.3; // Aim for ~30% matches
      const numMatches = Math.floor(length * targetMatchRate);

      // Fill initial N positions randomly
      for (let i = 0; i < Math.min(nBack, length); i++) {
        sequence.push(stimulusSet[Math.floor(rng() * stimulusSet.length)]);
      }

      // Create matches at specific positions
      const matchPositions = new Set<number>();
      let attemptsLeft = 100; // Prevent infinite loop
      while (matchPositions.size < numMatches && attemptsLeft > 0) {
        const pos = nBack + Math.floor(rng() * (length - nBack));
        if (!matchPositions.has(pos)) {
          matchPositions.add(pos);
        }
        attemptsLeft--;
      }

      // Fill remaining positions
      for (let i = nBack; i < length; i++) {
        if (matchPositions.has(i)) {
          // This should be a match
          sequence.push(sequence[i - nBack]);
        } else {
          // This should not be a match
          let stimulus;
          let attempts = 0;
          do {
            stimulus = stimulusSet[Math.floor(rng() * stimulusSet.length)];
            attempts++;
          } while (stimulus === sequence[i - nBack] && attempts < 10);
          sequence.push(stimulus);
        }
      }

      return sequence;
    },
    [seededRandom]
  );

  // Function to determine checkpoint index based on error type and position
  const determineCheckpointIndex = useCallback(
    (errorIndex: number, errorType: "miss" | "falseAlarm"): number => {
      if (!IS_CHECKPOINT) {
        return 0; // Always restart from beginning if checkpoint mode is disabled
      }

      const responses = responsesRef.current;

      if (errorType === "falseAlarm") {
        // For false alarm: checkpoint is the last correct answer within the sequence
        for (let i = errorIndex - 1; i >= 0; i--) {
          const response = responses[i];
          const isCorrect =
            (response.isMatchExpected && response.userResponded) ||
            (!response.isMatchExpected && !response.userResponded);

          if (isCorrect) {
            return i + 1; // Return index after the last correct response
          }
        }
        return 0; // If no correct response found, restart from beginning
      } else if (errorType === "miss") {
        // For miss: checkpoint is the last correct answer before the first letter of the N-task
        // The "first letter of the N-task" means before the first position where N-back logic applies
        const nTaskStartIndex = Math.max(0, errorIndex - N);

        for (let i = nTaskStartIndex - 1; i >= 0; i--) {
          const response = responses[i];
          const isCorrect =
            (response.isMatchExpected && response.userResponded) ||
            (!response.isMatchExpected && !response.userResponded);

          if (isCorrect) {
            return i + 1; // Return index after the last correct response
          }
        }
        return Math.max(0, nTaskStartIndex); // Restart from N-task start position
      }

      return 0; // Default to beginning
    },
    [N]
  );

  // Initialize trial
  useEffect(() => {
    let sequence: string[];

    if (predefinedSequence && predefinedSequence.length > 0) {
      // Use predefined sequence from levels.json (for medium, hard, and easy difficulties)
      sequence = predefinedSequence;
    } else {
      // Fallback to generated sequence (should rarely be used now)
      sequence = generateStimulusSequence(sequenceLength, stimulusset, N);
    }

    setStimuliSequence(sequence);
    stimuliRef.current = sequence;

    // Initialize responses array - but when restarting from checkpoint,
    // we need to handle the N-back logic correctly
    const initialResponses: ResponseData[] = sequence.map((stimulus, index) => {
      // When restarting from a checkpoint, we need to ensure N-back logic
      // doesn't depend on letters before the restart point
      let isMatchExpected = false;

      if (index >= N) {
        const lookBackIndex = index - N;
        // Only consider it a match if the lookback index is >= restartFromIndex
        // This ensures responses don't depend on previous letters before checkpoint
        if (lookBackIndex >= restartFromIndex) {
          isMatchExpected = stimulus === sequence[lookBackIndex];
        }
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

    // Set initial progress based on restart index
    setOverallProgress(restartFromIndex);

    // Update checkpoint reference
    lastCheckpointRef.current = restartFromIndex;

    // Start the trial after a brief delay
    timeoutRef.current = setTimeout(() => {
      startNextStimulus(restartFromIndex);
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [
    trialId,
    N,
    stimulusset,
    stimulusTime,
    intertrialInterval,
    sequenceLength,
    predefinedSequence,
    restartFromIndex, // Add restartFromIndex as dependency
    generateStimulusSequence,
  ]);

  const startNextStimulus = useCallback(
    (index: number) => {
      if (index >= stimuliRef.current.length) {
        // Trial completed
        setTrialPhase("completed");
        setIsTrialActive(false);
        setOverallProgress(stimuliRef.current.length); // Set to max for completed
        calculateAndSendResults();
        return;
      }

      setCurrentStimulusIndex(index);
      setTrialPhase("showing");
      setStimulusStartTime(Date.now());
      setOverallProgress(index + 1); // Update progress when showing stimulus

      // Hide stimulus after stimulusTime
      timeoutRef.current = setTimeout(() => {
        setTrialPhase("interval");
        setCurrentStimulusIndex(-1);
        setStimulusStartTime(null);

        // Check for errors on this stimulus (miss or false alarm)
        if (onError && index >= 0) {
          const currentResponse = responsesRef.current[index];
          if (currentResponse) {
            // Check for miss (expected response but didn't respond)
            if (
              currentResponse.isMatchExpected &&
              !currentResponse.userResponded
            ) {
              const checkpointIndex = determineCheckpointIndex(index, "miss");
              onError({
                stimulusIndex: index,
                errorType: "miss",
                currentResponses: [...responsesRef.current],
                checkpointIndex,
              });
              return; // Stop the sequence
            }
            // Check for false alarm (unexpected response but did respond)
            if (
              !currentResponse.isMatchExpected &&
              currentResponse.userResponded
            ) {
              const checkpointIndex = determineCheckpointIndex(
                index,
                "falseAlarm"
              );
              onError({
                stimulusIndex: index,
                errorType: "falseAlarm",
                currentResponses: [...responsesRef.current],
                checkpointIndex,
              });
              return; // Stop the sequence
            }
          }
        }

        // Update checkpoint if this was a correct response
        if (index >= 0) {
          const currentResponse = responsesRef.current[index];
          if (currentResponse) {
            const isCorrect =
              (currentResponse.isMatchExpected &&
                currentResponse.userResponded) ||
              (!currentResponse.isMatchExpected &&
                !currentResponse.userResponded);

            if (isCorrect) {
              lastCheckpointRef.current = index + 1;
            }
          }
        }

        // Start next stimulus after inter-trial interval
        timeoutRef.current = setTimeout(() => {
          startNextStimulus(index + 1);
        }, intertrialInterval);
      }, stimulusTime);
    },
    [stimulusTime, intertrialInterval, onError, determineCheckpointIndex]
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
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
      }
    },
    [isTrialActive, currentStimulusIndex, stimulusStartTime, targetKey]
  );

  const calculateAndSendResults = useCallback(() => {
    const finalResponses = responsesRef.current;
    const sequence = stimuliRef.current;

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

    const results: TrialResults = {
      trialId,
      stimuliSequence: sequence,
      responses: finalResponses,
      summary,
    };

    onTrialEnd(results);
  }, [trialId, onTrialEnd]);

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
      currentStimulusIndex >= 0 &&
      currentStimulusIndex < stimuliSequence.length
    ) {
      return stimuliSequence[currentStimulusIndex];
    }
    return "";
  };

  const getPhaseDisplay = () => {
    switch (trialPhase) {
      case "preparing":
        return `Get ready for ${N}-back task...`;
      case "showing":
        return getCurrentStimulus();
      case "interval":
        return "+"; // Fixation cross during interval
      case "completed":
        return "Trial completed!";
      default:
        return "";
    }
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
          fontSize: trialPhase === "showing" ? "72px" : "24px",
          fontWeight: trialPhase === "showing" ? "bold" : "normal",
          color: trialPhase === "showing" ? "#000" : "#666",
        }}
      >
        {getPhaseDisplay()}
      </div>

      {isTrialActive && trialPhase !== "preparing" && (
        <div
          style={{
            position: "absolute",
            bottom: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "300px",
          }}
        >
          <Progress
            value={(overallProgress / stimuliSequence.length) * 100}
            className="h-2 bg-gray-200"
            variant="gray"
          />
        </div>
      )}
    </div>
  );
};
