// Experiment mode
export const MODE = "pre_experiment";
export const SAVE_DATA = true;

// Task settings
export const TASK_TYPE = "nback";
export const TOTAL_SEQUENCES = 40; // should be divisible by NB_BLOCKS
export const GAMEMODE = "restart"; // "percent" or "restart"
export const IS_CHECKPOINT = true;

// Levels settings
export const LEVELS_NB = TOTAL_SEQUENCES;
export const DIFFICULTY_NB = 3;
export const NB_BLOCKS = 2;
export const NB_TRIALS_PER_BLOCK = TOTAL_SEQUENCES / NB_BLOCKS;

export const TARGET_KEY = " ";

export const DESCRIPTION = [
  "1-back (Easy)",
  "2-back (Medium)",
  "3-back (Hard)",
];
export const STIMULUS_TIME = [1500, 700, 700];
export const INTERTRIAL_INTERVAL = [1200, 1200, 1200];
export const SEQUENCE_LENGTH = [15, 15, 15];
export const N = [1, 2, 3];

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
