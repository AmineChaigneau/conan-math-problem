"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DESCRIPTION,
  GAMEMODE,
  INTERTRIAL_INTERVAL,
  N,
  NB_BLOCKS,
  NB_TRIALS_PER_BLOCK,
  SEQUENCE_LENGTH,
  STIMULUS_TIME,
  TOTAL_SEQUENCES,
} from "@/constants/block";
import {
  AttemptResults,
  BlockSequence,
  NbackDifficultyChoiceData,
  NbackDifficultyRestartData,
  ResponseData,
  TaskPhase,
  TaskState,
  TrialResults,
} from "@/types/nback";
import { saveSessionSummary, saveTrialData } from "@/utils/saveTrialData";
import { Fira_Code } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NbackDifficultyChoice } from "../../src/components/nback/difficulty";
import { NbackDifficultyRestart } from "../../src/components/nback/difficulty_restart";
import { NbackComponent } from "../../src/components/nback/nbackcomponent";
import levelsConfig from "../../src/constants/levels.json";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

const LOCALSTORAGE_KEY = "nback-task-state";

export default function TaskPage() {
  const [taskPhase, setTaskPhase] = useState<TaskPhase>("trial");
  const [taskState, setTaskState] = useState<TaskState | null>(null);
  const [lastTrialResults, setLastTrialResults] = useState<TrialResults | null>(
    null
  );
  const [allTrialResults, setAllTrialResults] = useState<TrialResults[]>([]);
  const [allDifficultyChoices, setAllDifficultyChoices] = useState<
    NbackDifficultyChoiceData[]
  >([]);
  const [shouldRestartSameSequence, setShouldRestartSameSequence] =
    useState(false);
  const [isEasierSequence, setIsEasierSequence] = useState(false);

  // Add attempt tracking
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState(1);
  const [lastDifficultyChoiceData, setLastDifficultyChoiceData] =
    useState<NbackDifficultyChoiceData | null>(null);

  // Add sequence tracking
  const [currentLevelIndex, setCurrentLevelIndex] = useState<number | null>(
    null
  );

  // Add checkpoint tracking
  const [checkpointIndex, setCheckpointIndex] = useState<number>(0);

  // Add easy sequence tracking
  const [selectedEasySequenceIndex, setSelectedEasySequenceIndex] = useState<
    number | null
  >(null);

  // Add trial attempt tracking
  const [currentTrialAttempts, setCurrentTrialAttempts] = useState<
    AttemptResults[]
  >([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);

  const router = useRouter();

  // Initialize or load task state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(LOCALSTORAGE_KEY);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setTaskState(parsed);
        console.log("Loaded task state from localStorage:", parsed);
      } catch (error) {
        console.error("Failed to parse saved state:", error);
        initializeNewSession();
      }
    } else {
      initializeNewSession();
    }
  }, []);

  // Save task state to localStorage whenever it changes
  useEffect(() => {
    if (taskState) {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(taskState));
    }
  }, [taskState]);

  const initializeNewSession = () => {
    // Randomly assign block order: [medium, hard] or [hard, medium]
    const blockOrder =
      Math.random() < 0.5 ? ["medium", "hard"] : ["hard", "medium"];

    const blockSequence: BlockSequence[] = blockOrder.map(
      (difficulty, index) => ({
        blockNumber: index + 1,
        difficulty: difficulty as "medium" | "hard",
        levelIndex: difficulty === "medium" ? 1 : 2, // Medium = index 1, Hard = index 2
      })
    );

    const newState: TaskState = {
      currentTrialNumber: 1,
      currentBlockIndex: 0,
      blockSequence,
      trialInCurrentBlock: 1,
      sessionId: `session-${Date.now()}`,
    };

    setTaskState(newState);
    console.log("Initialized new session with block order:", blockOrder);
  };

  // Helper function to compile AttemptResults into TrialResults
  const compileTrialResults = (
    attempts: AttemptResults[],
    isEasierSequence: boolean,
    difficultyChoiceData?: NbackDifficultyChoiceData
  ): TrialResults => {
    if (attempts.length === 0) {
      throw new Error("No attempts to compile");
    }

    const firstAttempt = attempts[0];
    const lastAttempt = attempts[attempts.length - 1];

    // Compile overall summary from all attempts
    let totalCorrectHits = 0;
    let totalFalseAlarms = 0;
    let totalMisses = 0;
    let totalCorrectRejections = 0;
    let totalMatches = 0;
    let totalStimuli = 0;
    const allReactionTimes: number[] = [];

    attempts.forEach((attempt) => {
      totalCorrectHits += attempt.summary.correctHits;
      totalFalseAlarms += attempt.summary.falseAlarms;
      totalMisses += attempt.summary.misses;
      totalCorrectRejections += attempt.summary.correctRejections;
      totalMatches += attempt.summary.totalMatches;
      totalStimuli += attempt.summary.totalStimuli;

      // Collect reaction times from successful attempts
      if (attempt.summary.meanReactionTime) {
        attempt.responses.forEach((response) => {
          if (response.reactionTime) {
            allReactionTimes.push(response.reactionTime);
          }
        });
      }
    });

    const overallAccuracy =
      totalStimuli > 0
        ? (totalCorrectHits + totalCorrectRejections) / totalStimuli
        : 0;
    const meanReactionTime =
      allReactionTimes.length > 0
        ? allReactionTimes.reduce((a, b) => a + b, 0) / allReactionTimes.length
        : null;
    const hitRate = totalMatches > 0 ? totalCorrectHits / totalMatches : 0;
    const falseAlarmRate =
      totalStimuli - totalMatches > 0
        ? totalFalseAlarms / (totalStimuli - totalMatches)
        : 0;

    // Convert difficulty choice data to simplified format if provided
    const simplifiedDifficultyChoiceData = difficultyChoiceData
      ? {
          selectedChoice: difficultyChoiceData.selectedChoice as
            | "easier"
            | "continue"
            | "restart",
          mouseTrajectory: difficultyChoiceData.mouseTrajectory,
          initiationTime: difficultyChoiceData.initiationTime,
          totalTime: difficultyChoiceData.totalTime,
        }
      : undefined;

    return {
      stimuliSequence: firstAttempt.stimuliSequence,
      totalAttempts: attempts.length,
      overallAccuracy,
      attempts: attempts.map((attempt) => ({
        attemptIndex: attempt.attemptIndex,
        responses: attempt.responses,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        isEasierSequence: isEasierSequence,
        difficultyChoiceData: simplifiedDifficultyChoiceData,
      })),
      summary: {
        totalStimuli: lastAttempt.summary.totalStimuli, // Use the sequence length
        totalMatches: lastAttempt.summary.totalMatches,
        correctHits: totalCorrectHits,
        falseAlarms: totalFalseAlarms,
        misses: totalMisses,
        correctRejections: totalCorrectRejections,
        accuracy: overallAccuracy,
        meanReactionTime,
        hitRate,
        falseAlarmRate,
      },
    };
  };

  // Get current level configuration using constants directly
  const getCurrentLevel = () => {
    if (isEasierSequence) {
      // Use predefined easy sequences from levels.json
      let easyIndex = selectedEasySequenceIndex;

      // If no easy sequence selected yet, randomly choose one from the first 40 (easy) sequences
      if (easyIndex === null) {
        easyIndex = Math.floor(Math.random() * 40); // levels 0-39 are 1-back (Easy)
        setSelectedEasySequenceIndex(easyIndex);
      }

      const easyLevel = levelsConfig.nbackLevels[easyIndex];

      if (easyLevel) {
        return {
          level: easyLevel.level,
          N: easyLevel.N,
          stimulusTime: easyLevel.stimulusTime,
          intertrialInterval: easyLevel.intertrialInterval,
          sequenceLength: easyLevel.sequenceLength,
          description: easyLevel.description,
          sequence: easyLevel.sequence,
          uniqueId: easyLevel.uniqueId,
        };
      }

      // Fallback to constants if easy level not found
      return {
        level: 0,
        N: N[0], // 1
        stimulusTime: STIMULUS_TIME[0], // 1500
        intertrialInterval: INTERTRIAL_INTERVAL[0], // 1500
        sequenceLength: SEQUENCE_LENGTH[0], // 15
        description: DESCRIPTION[0], // "1-back (Easy)"
        sequence: null,
        uniqueId: null,
      };
    }

    if (!taskState) {
      // Default to medium if no task state
      return {
        level: 1,
        N: N[1], // 2
        stimulusTime: STIMULUS_TIME[1], // 1000
        intertrialInterval: INTERTRIAL_INTERVAL[1], // 1500
        sequenceLength: SEQUENCE_LENGTH[1], // 15
        description: DESCRIPTION[1], // "2-back (Medium)"
        sequence: null,
        uniqueId: null,
      };
    }

    const currentBlock = taskState.blockSequence[taskState.currentBlockIndex];
    const difficultyIndex = currentBlock.levelIndex;

    // Calculate level index from levels.json based on current trial and difficulty
    let levelIndex = currentLevelIndex;
    if (!shouldRestartSameSequence && levelIndex === null) {
      // Calculate which level from levels.json to use
      // For medium difficulty (index 1): levels 41-80 (indices 40-79)
      // For hard difficulty (index 2): levels 81-120 (indices 80-119)
      const baseIndex = difficultyIndex === 1 ? 40 : 80; // Medium starts at 40, Hard at 80
      const trialInDifficulty = taskState.trialInCurrentBlock - 1; // 0-based
      levelIndex = baseIndex + trialInDifficulty;

      // Set the level index so it persists for restarts
      setCurrentLevelIndex(levelIndex);
    }

    // Get the level from levels.json
    const level =
      (levelIndex !== null && levelsConfig.nbackLevels[levelIndex]) || null;

    console.log("Current block:", currentBlock);
    console.log("Difficulty index:", difficultyIndex);
    console.log("Level index:", levelIndex);
    console.log("Level from JSON:", level);

    if (!level) {
      // Fallback to constants if level not found
      return {
        level: difficultyIndex,
        N: N[difficultyIndex],
        stimulusTime: STIMULUS_TIME[difficultyIndex],
        intertrialInterval: INTERTRIAL_INTERVAL[difficultyIndex],
        sequenceLength: SEQUENCE_LENGTH[difficultyIndex],
        description: DESCRIPTION[difficultyIndex],
        sequence: null,
        uniqueId: null,
      };
    }

    return {
      level: level.level,
      N: level.N,
      stimulusTime: level.stimulusTime,
      intertrialInterval: level.intertrialInterval,
      sequenceLength: level.sequenceLength,
      description: level.description,
      sequence: level.sequence,
      uniqueId: level.uniqueId,
    };
  };

  const currentLevel = getCurrentLevel();
  const remainingTrials = taskState
    ? TOTAL_SEQUENCES - taskState.currentTrialNumber + 1
    : TOTAL_SEQUENCES;

  // Initialize trial start time when starting a new trial
  useEffect(() => {
    if (taskPhase === "trial" && currentTrialAttempts.length === 0) {
      setTrialStartTime(Date.now());
    }
  }, [taskPhase, currentTrialAttempts.length]);

  // Handle attempt completion
  const handleAttemptEnd = async (attemptResults: AttemptResults) => {
    if (!taskState) return;

    // Add attempt to current trial
    const newAttempts = [...currentTrialAttempts, attemptResults];
    setCurrentTrialAttempts(newAttempts);

    // Compile the trial results
    const trialResults = compileTrialResults(
      newAttempts,
      isEasierSequence,
      lastDifficultyChoiceData || undefined
    );
    setLastTrialResults(trialResults);
    setAllTrialResults((prev) => [...prev, trialResults]);

    // Save trial data to Firebase Storage
    await saveTrialData({
      trialResults: trialResults,
      taskState: taskState,
      attemptNumber: currentAttemptNumber,
      isEasierSequence: isEasierSequence,
      wasRestarted: shouldRestartSameSequence,
      difficultyChoiceData: lastDifficultyChoiceData || undefined,
      trialUniqueId: currentLevel.uniqueId, // Pass the unique ID from levels.json
    });
    console.log("Trial data saved successfully");

    // Reset flags after trial completion
    if (shouldRestartSameSequence) {
      setShouldRestartSameSequence(false);
      setCurrentAttemptNumber(1); // Reset attempt count after successful completion
    }
    if (isEasierSequence) {
      setIsEasierSequence(false);
    }

    // Reset for next trial
    setCurrentTrialAttempts([]);
    setCheckpointIndex(0);
    setSelectedEasySequenceIndex(null);

    // Check if this is the last trial
    if (taskState.currentTrialNumber >= TOTAL_SEQUENCES) {
      try {
        // Save session summary
        await saveSessionSummary(
          taskState,
          [...allTrialResults, trialResults],
          allDifficultyChoices
        );
        console.log("Session summary saved successfully");
      } catch (error) {
        console.error("Failed to save session summary:", error);
      }

      localStorage.removeItem(LOCALSTORAGE_KEY); // Clear saved state on completion
      // Redirect to scales page
      window.location.href = "/scales";
      return;
    } else {
      // Move to next trial - clear level index to get new sequence
      setCurrentLevelIndex(null);

      const newTrialInBlock = taskState.trialInCurrentBlock + 1;
      let newBlockIndex = taskState.currentBlockIndex;
      let newTrialInCurrentBlock = newTrialInBlock;

      // Check if we need to move to next block
      if (
        newTrialInBlock > NB_TRIALS_PER_BLOCK &&
        taskState.currentBlockIndex < NB_BLOCKS - 1
      ) {
        newBlockIndex = taskState.currentBlockIndex + 1;
        newTrialInCurrentBlock = 1;
      }

      setTaskState({
        ...taskState,
        currentTrialNumber: taskState.currentTrialNumber + 1,
        currentBlockIndex: newBlockIndex,
        trialInCurrentBlock: newTrialInCurrentBlock,
      });

      if (GAMEMODE === "restart") {
        setTaskPhase("trial");
      } else {
        setTaskPhase("difficulty");
      }
    }
  };

  // Handle immediate error detection (restart mode only)
  const handleError = (errorData: {
    stimulusIndex: number;
    errorType: "miss" | "falseAlarm";
    currentResponses: ResponseData[];
    checkpointIndex: number;
  }) => {
    if (GAMEMODE === "restart") {
      // Create a partial attempt result for the failed attempt
      const partialAttempt: AttemptResults = {
        trialId: `trial-${
          taskState?.currentTrialNumber || 0
        }-attempt-${currentAttemptNumber}`,
        attemptIndex: currentAttemptNumber,
        responses: errorData.currentResponses,
        startTime: trialStartTime,
        endTime: Date.now(),
        stimuliSequence: currentLevel.sequence || [],
        summary: {
          totalStimuli: errorData.currentResponses.length,
          totalMatches: 0,
          correctHits: 0,
          falseAlarms: errorData.errorType === "falseAlarm" ? 1 : 0,
          misses: errorData.errorType === "miss" ? 1 : 0,
          correctRejections: 0,
          accuracy: 0,
          meanReactionTime: null,
          hitRate: 0,
          falseAlarmRate: errorData.errorType === "falseAlarm" ? 1 : 0,
        },
      };

      // Add this failed attempt to the current trial
      const newAttempts = [...currentTrialAttempts, partialAttempt];
      setCurrentTrialAttempts(newAttempts);

      // Compile partial trial results
      const partialTrialResults = compileTrialResults(
        newAttempts,
        isEasierSequence,
        lastDifficultyChoiceData || undefined
      );
      setLastTrialResults(partialTrialResults);

      // Store the checkpoint index for potential restart
      setCheckpointIndex(errorData.checkpointIndex);

      // If already in easier sequence, just restart automatically
      if (isEasierSequence) {
        setTaskPhase("auto_restart");
        // Auto-restart after showing FAIL message
        setTimeout(() => {
          setShouldRestartSameSequence(true);
          // Keep the checkpoint index for restart
          setTaskPhase("trial");
        }, 1000);
      } else {
        setTaskPhase("difficulty_restart");
      }
    }
  };

  // Handle difficulty choice
  const handleDifficultyChoice = (switchToEasier: boolean) => {
    if (!taskState) return;

    if (switchToEasier) {
      // Generate a NEW 1-back (Easy) sequence - clear level index and easy sequence selection
      setIsEasierSequence(true);
      setCurrentLevelIndex(null);
      setCheckpointIndex(0); // Reset checkpoint for new sequence
      setSelectedEasySequenceIndex(null); // Reset easy sequence selection for new sequence
    } else {
      // Continue with current difficulty - clear level index for new sequence
      setCurrentLevelIndex(null);
      setCheckpointIndex(0); // Reset checkpoint for new sequence
    }

    // Reset trial attempts for new trial
    setCurrentTrialAttempts([]);

    // Always move to next trial when choosing in percent mode
    const newTrialInBlock = taskState.trialInCurrentBlock + 1;
    let newBlockIndex = taskState.currentBlockIndex;
    let newTrialInCurrentBlock = newTrialInBlock;

    if (
      newTrialInBlock > NB_TRIALS_PER_BLOCK &&
      taskState.currentBlockIndex < NB_BLOCKS - 1
    ) {
      newBlockIndex = taskState.currentBlockIndex + 1;
      newTrialInCurrentBlock = 1;
    }

    setTaskState({
      ...taskState,
      currentTrialNumber: taskState.currentTrialNumber + 1,
      currentBlockIndex: newBlockIndex,
      trialInCurrentBlock: newTrialInCurrentBlock,
    });

    setTaskPhase("trial");
  };

  // Handle difficulty choice data collection
  const handleDifficultyDataCollection = (data: NbackDifficultyChoiceData) => {
    setAllDifficultyChoices((prev) => [...prev, data]);
    setLastDifficultyChoiceData(data);
    console.log("Difficulty choice data:", data);
  };

  // Handle difficulty choice data collection for restart mode
  const handleRestartDataCollection = (data: NbackDifficultyRestartData) => {
    const convertedData: NbackDifficultyChoiceData = {
      ...data,
      selectedChoice:
        data.selectedChoice === "restart" ? "continue" : data.selectedChoice,
    };
    setAllDifficultyChoices((prev) => [...prev, convertedData]);
    setLastDifficultyChoiceData(convertedData);
    console.log("Restart difficulty choice data:", data);
  };

  // Handle difficulty choice for restart mode
  const handleRestartDifficultyChoice = (switchToEasier: boolean) => {
    if (!taskState) return;

    if (switchToEasier) {
      // Generate a NEW 1-back (Easy) sequence - clear level index and easy sequence selection
      setIsEasierSequence(true);
      setCurrentLevelIndex(null);
      setCheckpointIndex(0); // Reset checkpoint for new sequence
      setSelectedEasySequenceIndex(null); // Reset easy sequence selection for new sequence

      // Reset trial attempts for new trial
      setCurrentTrialAttempts([]);

      // Move to next trial
      const newTrialInBlock = taskState.trialInCurrentBlock + 1;
      let newBlockIndex = taskState.currentBlockIndex;
      let newTrialInCurrentBlock = newTrialInBlock;

      if (
        newTrialInBlock > NB_TRIALS_PER_BLOCK &&
        taskState.currentBlockIndex < NB_BLOCKS - 1
      ) {
        newBlockIndex = taskState.currentBlockIndex + 1;
        newTrialInCurrentBlock = 1;
      }

      setTaskState({
        ...taskState,
        currentTrialNumber: taskState.currentTrialNumber + 1,
        currentBlockIndex: newBlockIndex,
        trialInCurrentBlock: newTrialInCurrentBlock,
      });

      setShouldRestartSameSequence(false);
      setCurrentAttemptNumber(1); // Reset attempts when switching to easier
    } else {
      // Restart same sequence - KEEP the same level index, checkpoint index, and easy sequence index
      setShouldRestartSameSequence(true);
      setCurrentAttemptNumber((prev) => prev + 1); // Increment attempt count
      // Note: We DON'T call setCurrentLevelIndex(null), setCheckpointIndex(0), or setSelectedEasySequenceIndex(null) here - this preserves the same sequence and checkpoint
    }

    setTaskPhase("trial");
  };

  if (!taskState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className={`text-lg ${firaCode.className}`}>Loading...</div>
      </div>
    );
  }

  // Get current block info for display
  const currentBlock = taskState.blockSequence[taskState.currentBlockIndex];
  const currentBlockDescription =
    currentBlock.difficulty === "medium" ? "2-back (Medium)" : "3-back (Hard)";

  // Trial phase
  if (taskPhase === "trial") {
    return (
      <div className="relative h-screen bg-white">
        {/* Progress bar */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[75px] w-3/4 flex flex-col items-center justify-center gap-2">
          <Progress
            value={(taskState.currentTrialNumber / TOTAL_SEQUENCES) * 100}
            className="shadow-2xl"
          />
          <div
            className={`text-sm text-zinc-400 ${firaCode.className} text-center`}
          >
            {taskState.currentTrialNumber} / {TOTAL_SEQUENCES}
          </div>
        </div>
        {/* Trial counter */}
        <div className="absolute bottom-5 left-5">
          <div
            className={`flex items-center justify-center px-4 py-2 bg-orange-500 rounded-lg shadow-lg ${firaCode.className} text-white text-center min-w-[120px] w-fit`}
          >
            {isEasierSequence ? "1-back (Easy)" : currentBlockDescription}
          </div>
        </div>

        <NbackComponent
          trialId={
            shouldRestartSameSequence
              ? `trial-${taskState.currentTrialNumber}-restart`
              : `trial-${taskState.currentTrialNumber}${
                  isEasierSequence ? "-easier" : ""
                }`
          }
          attemptIndex={currentAttemptNumber}
          N={currentLevel.N}
          stimulusset={levelsConfig.stimulusSet}
          stimulusTime={currentLevel.stimulusTime}
          intertrialInterval={currentLevel.intertrialInterval}
          sequenceLength={currentLevel.sequenceLength}
          targetKey={levelsConfig.targetKey}
          predefinedSequence={currentLevel.sequence || undefined}
          restartFromIndex={shouldRestartSameSequence ? checkpointIndex : 0}
          onTrialEnd={handleAttemptEnd}
          onError={handleError}
        />
      </div>
    );
  }

  // Difficulty choice phase
  if (taskPhase === "difficulty" && lastTrialResults) {
    return (
      <div className="h-screen bg-white">
        <NbackDifficultyChoice
          trialId={taskState.currentTrialNumber}
          trialResults={lastTrialResults}
          currentLevel={currentLevel.N}
          remainingTrials={remainingTrials}
          onChoice={handleDifficultyChoice}
          onDataCollection={handleDifficultyDataCollection}
        />
      </div>
    );
  }

  // Difficulty choice phase for restart mode
  if (taskPhase === "difficulty_restart" && lastTrialResults) {
    return (
      <div className="h-screen bg-white">
        <NbackDifficultyRestart
          trialId={taskState.currentTrialNumber}
          trialResults={lastTrialResults}
          currentLevel={currentLevel.N}
          remainingTrials={remainingTrials}
          onChoice={handleRestartDifficultyChoice}
          onDataCollection={handleRestartDataCollection}
        />
      </div>
    );
  }

  // Auto restart phase (when already in easier sequence)
  if (taskPhase === "auto_restart") {
    return (
      <div
        className={`flex flex-col items-center justify-center h-screen ${firaCode.className}`}
      >
        <div className="text-center space-y-8">
          <div className="text-6xl font-bold text-red-600 mb-4">FAIL</div>
          <div className="text-2xl text-gray-700">
            Sequence Failed - Restarting Same Sequence
          </div>
          <div className="text-lg text-gray-500">
            Already at easiest level (1-back Easy)
          </div>
          <div className="text-sm text-gray-400 mt-8">
            Automatically restarting in 1 second...
          </div>
        </div>
      </div>
    );
  }

  // Task completed
  if (taskPhase === "completed") {
    const averageAccuracy =
      allTrialResults.reduce((sum, trial) => sum + trial.summary.accuracy, 0) /
      allTrialResults.length;
    const totalHits = allTrialResults.reduce(
      (sum, trial) => sum + trial.summary.correctHits,
      0
    );
    const totalFalseAlarms = allTrialResults.reduce(
      (sum, trial) => sum + trial.summary.falseAlarms,
      0
    );

    return (
      <div
        className={`flex flex-col items-center justify-center h-screen p-8 ${firaCode.className}`}
      >
        <div className="max-w-4xl text-center space-y-6">
          <h1 className="text-4xl font-bold mb-8">Task Completed!</h1>

          <div className="bg-gray-100 p-8 rounded-lg space-y-4">
            <h2 className="text-2xl font-bold">Final Results</h2>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  {(averageAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-lg">Average Accuracy</div>
              </div>

              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {allTrialResults.length}
                </div>
                <div className="text-lg">Trials Completed</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-500">
                  {totalHits}
                </div>
                <div>Total Correct Hits</div>
              </div>

              <div className="space-y-2">
                <div className="text-2xl font-bold text-red-500">
                  {totalFalseAlarms}
                </div>
                <div>Total False Alarms</div>
              </div>
            </div>
          </div>

          <div className="space-x-4">
            <Button
              className={`w-full max-w-2xl ${firaCode.className} text-lg`}
              onClick={() => router.push("/scales")}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
