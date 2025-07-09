// Experiment mode
export const MODE = "pre_experiment";
export const SAVE_DATA = true;

// Task settings
export const TASK_TYPE = "nback";
export const TOTAL_SEQUENCES = 20; // should be divisible by NB_BLOCKS
export const GAMEMODE = "restart"; // "percent" or "restart"
export const N_BACK_LEVEL = 2;

// Levels settings
export const LEVELS_NB = TOTAL_SEQUENCES;

export const NB_BLOCKS = 1;
export const LENGTH_N = 2; // Number of different sequence lengths
export const GAP_BETWEEN_CHECKPOINT = 3; // Should be divisible by LENGTH_N
export const SEQUENCE_LENGTH = [15, 30];

export const NB_TRIALS_PER_BLOCK = TOTAL_SEQUENCES / NB_BLOCKS;
export const TARGET_KEY = "click" as " " | "click"; // spacebar or click

export const DESCRIPTION = ["2-back - Short", "2-back - Long"];
export const STIMULUS_TIME = [1000, 1000];
export const INTERTRIAL_INTERVAL = [1200, 1200];
export const N = [2, 2]; // Both use 2-back difficulty
export const N_EASIER = 1;
export const MATCH_RESPONSE_RATE = [0.3, 0.3];

// Training settings
export const LEVELS_NB_TRAINING = 3;

// Stimulus set
export const STIMULUS_SET = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "H",
  "I",
  "K",
  "L",
  "M",
  "O",
  "P",
  "R",
  "S",
  "T",
];

// Trial settings
export const STARTING_DEADLINE_DURATION = 2500;
export const INTERACTION_DEADLINE_DURATION = 2500;
