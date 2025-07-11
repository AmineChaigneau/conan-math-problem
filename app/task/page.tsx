"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { auth, db } from "@/config/firebase";
import { GAMEMODE, TOTAL_SEQUENCES } from "@/constants/block";
import {
  AttemptResults,
  NbackDifficultyChoiceData,
  NbackDifficultyRestartData,
  ResponseData,
  TaskPhase,
  TaskState,
  TrialResults,
} from "@/types/nback";
import { generateSequenceFromMatches } from "@/utils/generateSequenceFromMatches";
import {
  generateSequenceOrder,
  getSequenceByIndex,
} from "@/utils/generateSequenceOrder";
import { saveSessionSummary, saveTrialData } from "@/utils/saveTrialData";
import { doc, updateDoc } from "firebase/firestore";
import { Fira_Code } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NbackDifficultyRestart } from "../../src/components/nback/difficulty_restart";
import { NbackComponent } from "../../src/components/nback/nbackcomponent";

const firaCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
});

const LOCALSTORAGE_KEY = "nback-task-state";
const CHECKPOINT_KEY = "nback-checkpoints";
const REWARD_KEY = "nback-reward";

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
  const [currentAttemptNumber, setCurrentAttemptNumber] = useState(1);
  const [lastDifficultyChoiceData, setLastDifficultyChoiceData] =
    useState<NbackDifficultyChoiceData | null>(null);
  const [currentTrialAttempts, setCurrentTrialAttempts] = useState<
    AttemptResults[]
  >([]);
  const [trialStartTime, setTrialStartTime] = useState<number>(0);

  // Checkpoint management states
  const [currentCheckpointIndex, setCurrentCheckpointIndex] = useState(0);
  const [checkpointData, setCheckpointData] = useState<{
    [trialNumber: number]: number;
  }>({});

  // Reward management state
  const [currentReward, setCurrentReward] = useState(0);

  const router = useRouter();

  // Function to update reward in Firestore
  const updateRewardInFirestore = async (newReward: number) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error("No user found for reward update");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        reward: newReward,
      });

      console.log(`Reward updated in Firestore: ${newReward} points`);
    } catch (error) {
      console.error("Failed to update reward in Firestore:", error);
    }
  };

  // Initialize or load task state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem(LOCALSTORAGE_KEY);
    const savedCheckpoints = localStorage.getItem(CHECKPOINT_KEY);
    const savedReward = localStorage.getItem(REWARD_KEY);

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

    // Load checkpoint data
    if (savedCheckpoints) {
      try {
        const parsedCheckpoints = JSON.parse(savedCheckpoints);
        setCheckpointData(parsedCheckpoints);
        console.log(
          "Loaded checkpoint data from localStorage:",
          parsedCheckpoints
        );
      } catch (error) {
        console.error("Failed to parse checkpoint data:", error);
      }
    }

    // Load reward data
    if (savedReward) {
      try {
        const parsedReward = JSON.parse(savedReward);
        setCurrentReward(parsedReward);
        console.log("Loaded reward from localStorage:", parsedReward);
      } catch (error) {
        console.error("Failed to parse reward data:", error);
      }
    }
  }, []);

  // Save task state to localStorage whenever it changes
  useEffect(() => {
    if (taskState) {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(taskState));
    }
  }, [taskState]);

  // Save checkpoint data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(checkpointData).length > 0) {
      localStorage.setItem(CHECKPOINT_KEY, JSON.stringify(checkpointData));
    }
  }, [checkpointData]);

  // Save reward data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(REWARD_KEY, JSON.stringify(currentReward));
  }, [currentReward]);

  const initializeNewSession = () => {
    const sequenceOrder = generateSequenceOrder(TOTAL_SEQUENCES);
    const newState: TaskState = {
      currentTrialNumber: 1,
      sequenceOrder: sequenceOrder,
      sessionId: `session-${Date.now()}`,
    };

    setTaskState(newState);
    console.log("Initialized new session with randomized sequence order");
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
      matchesSequence: firstAttempt.matchesSequence,
      totalAttempts: attempts.length,
      attempts: attempts.map((attempt) => ({
        attemptIndex: attempt.attemptIndex,
        responses: attempt.responses,
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        isEasierSequence: isEasierSequence,
        difficultyChoiceData: simplifiedDifficultyChoiceData,
        startCheckpoint: attempt.startCheckpoint,
        distanceToGoal: attempt.distanceToGoal,
        errorType: attempt.errorType,
        errorIndex: attempt.errorIndex,
      })),
      summary: {
        totalStimuli: lastAttempt.summary.totalStimuli,
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

  // Get current level configuration
  const getCurrentLevel = () => {
    if (!taskState) {
      return {
        level: 1,
        N: 2,
        stimulusTime: 1000,
        intertrialInterval: 1200,
        sequenceLength: 15,
        description: "2-back - Short",
      };
    }

    // Get the current sequence from the randomized order
    const currentSequenceIndex = taskState.currentTrialNumber - 1;
    const currentSequence = getSequenceByIndex(
      taskState.sequenceOrder,
      currentSequenceIndex
    );

    if (isEasierSequence) {
      return {
        level: 0,
        N: 1,
        stimulusTime: 1000,
        intertrialInterval: 1200,
        sequenceLength: currentSequence.sequenceLength,
        description: "1-back (Easy)",
      };
    }

    return {
      level: currentSequence.level,
      N: currentSequence.N,
      stimulusTime: currentSequence.stimulusTime,
      intertrialInterval: currentSequence.intertrialInterval,
      sequenceLength: currentSequence.sequenceLength,
      description: currentSequence.description,
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

    // Calculate reward for this trial
    const trialReward = isEasierSequence ? 1 : 5;
    const newCurrentReward = currentReward + trialReward;

    // Compile the trial results
    const trialResults = compileTrialResults(
      newAttempts,
      isEasierSequence,
      lastDifficultyChoiceData || undefined
    );
    setLastTrialResults(trialResults);
    setAllTrialResults((prev) => [...prev, trialResults]);

    // Update current reward state
    setCurrentReward(newCurrentReward);

    // Update reward in Firestore
    await updateRewardInFirestore(newCurrentReward);

    // Save trial data to Firebase Storage
    await saveTrialData({
      trialResults: trialResults,
      taskState: taskState,
      attemptNumber: currentAttemptNumber,
      isEasierSequence: isEasierSequence,
      wasRestarted: shouldRestartSameSequence,
      difficultyChoiceData: lastDifficultyChoiceData || undefined,
      trialUniqueId: `trial-${taskState.currentTrialNumber}`,
      reward: trialReward,
      currentReward: newCurrentReward,
    });
    console.log("Trial data saved successfully");

    // Clear checkpoint for current trial since it completed successfully
    const newCheckpointData = { ...checkpointData };
    delete newCheckpointData[taskState.currentTrialNumber];
    setCheckpointData(newCheckpointData);
    setCurrentCheckpointIndex(0);

    // Reset flags after trial completion
    if (shouldRestartSameSequence) {
      setShouldRestartSameSequence(false);
      setCurrentAttemptNumber(1);
    }
    if (isEasierSequence) {
      setIsEasierSequence(false);
    }

    // Reset for next trial
    setCurrentTrialAttempts([]);

    // Check if this is the last trial
    if (taskState.currentTrialNumber >= TOTAL_SEQUENCES) {
      try {
        // Save session summary
        await saveSessionSummary(
          taskState,
          [...allTrialResults, trialResults],
          allDifficultyChoices,
          newCurrentReward
        );
        console.log("Session summary saved successfully");
      } catch (error) {
        console.error("Failed to save session summary:", error);
      }

      // Clean up all localStorage data
      localStorage.removeItem(LOCALSTORAGE_KEY);
      localStorage.removeItem(CHECKPOINT_KEY);
      localStorage.removeItem(REWARD_KEY);
      window.location.href = "/scales";
      return;
    } else {
      // Move to next trial only after successful completion
      setTaskState({
        ...taskState,
        currentTrialNumber: taskState.currentTrialNumber + 1,
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
    lastCheckpoint: number;
  }) => {
    if (GAMEMODE === "restart") {
      // Save checkpoint for current trial
      if (taskState) {
        const newCheckpointData = {
          ...checkpointData,
          [taskState.currentTrialNumber]: errorData.lastCheckpoint,
        };
        setCheckpointData(newCheckpointData);
        setCurrentCheckpointIndex(errorData.lastCheckpoint);
        console.log(
          `Error at index ${errorData.stimulusIndex}, last checkpoint saved at index ${errorData.lastCheckpoint}`
        );
      }

      // Get the current matches array for this trial
      if (!taskState) return;
      const currentSequence = getSequenceByIndex(
        taskState.sequenceOrder,
        taskState.currentTrialNumber - 1
      );
      const currentMatchesArray = currentSequence.matches || [];

      // Create a partial attempt result for the failed attempt
      const partialAttempt: AttemptResults = {
        trialId: `trial-${
          taskState?.currentTrialNumber || 0
        }-attempt-${currentAttemptNumber}`,
        attemptIndex: currentAttemptNumber,
        responses: errorData.currentResponses, // Already filtered in nbackcomponent.tsx
        startTime: trialStartTime,
        endTime: Date.now(),
        matchesSequence: currentMatchesArray,
        startCheckpoint: currentCheckpointIndex,
        distanceToGoal: currentLevel.sequenceLength - currentCheckpointIndex,
        errorType: errorData.errorType,
        errorIndex: errorData.stimulusIndex,
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

      // If already in easier sequence, just restart automatically
      if (isEasierSequence) {
        setTaskPhase("auto_restart");
        // Auto-restart after showing FAIL message
        setTimeout(() => {
          setShouldRestartSameSequence(true);
          // Keep the current checkpoint index for restart
          console.log(
            `Auto-restarting from checkpoint index: ${currentCheckpointIndex}`
          );
          setTaskPhase("trial");
        }, 1000);
      } else {
        setTaskPhase("difficulty_restart");
      }
    }
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
      setIsEasierSequence(true);

      // Keep the same trial and checkpoint when switching to easier
      // Don't move to next trial, just restart with N=1 at same checkpoint
      setShouldRestartSameSequence(true);
      setCurrentAttemptNumber((prev) => prev + 1);

      console.log(
        `Switching to easier (N=1) at same checkpoint: ${currentCheckpointIndex}`
      );
    } else {
      // Restart from checkpoint with same difficulty
      setShouldRestartSameSequence(true);
      setCurrentAttemptNumber((prev) => prev + 1);
      // Keep the current checkpoint index for restart
      console.log(
        `Restarting from checkpoint index: ${currentCheckpointIndex}`
      );
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

  // Trial phase
  if (taskPhase === "trial") {
    // Generate the main sequence first to ensure consistency
    let mainSequence: string[] = [];
    const ghostLetters: string[] = [];

    if (taskState) {
      const currentSequence = getSequenceByIndex(
        taskState.sequenceOrder,
        taskState.currentTrialNumber - 1
      );

      // Generate the sequence once with a consistent seed
      const actualN = isEasierSequence ? 1 : currentLevel.N;
      const consistentSeed =
        parseInt(taskState.sessionId.split("-")[1]) +
        taskState.currentTrialNumber * 1000 +
        currentAttemptNumber;

      // Always use the same matches array from the original sequence
      const matchesArray = currentSequence.matches || [];

      mainSequence = generateSequenceFromMatches(
        matchesArray,
        actualN,
        consistentSeed
      );

      console.log("Main sequence generated:", mainSequence);
      console.log("Matches array used:", matchesArray);
      console.log(
        "N level used:",
        actualN,
        isEasierSequence ? "(easier)" : "(normal)"
      );

      // Generate ghost letters if restarting from checkpoint
      if (shouldRestartSameSequence && currentCheckpointIndex > 0) {
        // For N-back, we need the N previous letters: [checkpoint-N, ..., checkpoint-1]
        for (let i = actualN; i >= 1; i--) {
          const ghostIndex = currentCheckpointIndex - i;
          if (ghostIndex >= 0) {
            ghostLetters.push(mainSequence[ghostIndex]);
          }
        }

        console.log(
          `Generated ghost letters for checkpoint ${currentCheckpointIndex} (N=${actualN}):`,
          ghostLetters,
          `(indices: ${ghostLetters
            .map((_, i) => currentCheckpointIndex - actualN + i)
            .filter((idx) => idx >= 0)})`
        );
      }
    }

    return (
      <div className="relative h-screen bg-white">
        {/* Progress bar */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[90px] w-3/4 flex flex-col items-center justify-center gap-2">
          <Progress
            value={(taskState.currentTrialNumber / TOTAL_SEQUENCES) * 100}
            className="shadow-2xl"
          />
          <div
            className={`text-sm text-zinc-400 ${firaCode.className} text-center`}
          >
            Sequence completed: {taskState.currentTrialNumber} /{" "}
            {TOTAL_SEQUENCES}
          </div>
          <div
            className={`text-sm font-bold text-green-600 ${firaCode.className} text-center`}
          >
            Current Reward: {currentReward} points
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
          stimulusTime={currentLevel.stimulusTime}
          intertrialInterval={currentLevel.intertrialInterval}
          sequenceLength={currentLevel.sequenceLength}
          targetKey={"click"}
          startFromIndex={
            shouldRestartSameSequence ? currentCheckpointIndex : 0
          }
          ghostLetters={ghostLetters.length > 0 ? ghostLetters : undefined}
          predefinedSequence={
            mainSequence.length > 0 ? mainSequence : undefined
          }
          matches={
            // Always pass the matches array from current sequence
            getSequenceByIndex(
              taskState.sequenceOrder,
              taskState.currentTrialNumber - 1
            ).matches || []
          }
          currentTrialIndex={taskState.currentTrialNumber}
          onTrialEnd={handleAttemptEnd}
          onError={handleError}
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
        className={`flex flex-col items-center justify-center h-screen ${firaCode.className} bg-white`}
      >
        <div className="text-center space-y-8">
          <div className="text-6xl font-bold text-red-600 mb-4">FAIL</div>
          <div className="text-2xl text-gray-700">
            Sequence Failed - Restarting from Checkpoint
          </div>
          <div className="text-lg text-gray-500">
            Already at easiest level (1-back Easy)
          </div>
          <div className="text-lg text-blue-600">
            Checkpoint: Position {currentCheckpointIndex + 1}
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

            <div className="grid grid-cols-3 gap-8">
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

              <div className="space-y-2">
                <div className="text-3xl font-bold text-yellow-600">
                  {currentReward}
                </div>
                <div className="text-lg">Total Reward</div>
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
