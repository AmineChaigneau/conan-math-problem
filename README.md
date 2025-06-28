# Conan N-Back Task

## Task

The N-Back Task is a cognitive training paradigm that challenges working memory by requiring participants to identify when a current stimulus matches one presented N trials ago. This implementation features two distinct game modes with different feedback and progression mechanisms.

### How the N-Back Task Works

Participants see a sequence of letters (A, B, C, D, E, H, I, K, L, M, O, P, R, S, T) presented one at a time. For each letter, they must determine if it matches the letter that appeared **N positions back** in the sequence. When a match is detected, participants press the **SPACEBAR**.

**Example (2-back):**

```
Sequence: A → B → A → C → B → D
          1    2    3    4    5    6
```

- Position 3 (A): Matches position 1 (A) → **PRESS SPACEBAR**
- Position 4 (C): Does not match position 2 (B) → **No response**
- Position 5 (B): Matches position 3 (A) → **No response**
- Position 6 (D): Does not match position 4 (C) → **No response**

### Game Modes

The task operates in two distinct modes determined by the `GAMEMODE` constant in `src/constants/block.ts`:

#### 📊 Percent Mode (`GAMEMODE = "percent"`)

**Traditional N-Back with accuracy-based feedback:**

- **Sequence Completion**: Participants complete full sequences
- **Accuracy**: Participant should reach at least 80% accuracy to continue.
- **Difficulty Choice**: Participants who performed with less than 80% accuracy had to choose between:
  - **"Continue Current Level"**: Stay at current difficulty
  - **"Switch to Easier Level"**: Reduce difficulty to 1-N Back

**Feedback Display:**

```
75.5%
Trial Accuracy
Not enough!

Current Level: 3-back
Trials remaining: 25
Hits: 8 | False Alarms: 2
Avg RT: 650ms
```

#### 🔄 Restart Mode (`GAMEMODE = "restart"`)

- **Error Detection**: Task stops immediately when participant makes an error:
  - **Miss**: Failed to respond to a target match
  - **False Alarm**: Responded when no match was present
- **Immediate Feedback**: Shows "MISSED" or "ERROR" screen instantly
- **Choice Options**: Participants choose between:
  - **"Restart Same Sequence"**: Begin the exact same sequence again (from the begining)
  - **"Switch to Easier Level"**: Move to easier difficulty (1-N Back)
- **Completion**: If sequence completed without errors, automatically proceeds to next sequence

**Error Display:**

```
FAIL
Sequence Failed
You failed within the sequence

Current Level: 3-back
Trials remaining: 25

Would you like to restart the same sequence
or switch to an easier level?
```

### Difficulty Levels

The task includes three difficulty levels with varying cognitive demands:

| Level | N-Back | Stimulus Time | Inter-trial Interval | Description |
| ----- | ------ | ------------- | -------------------- | ----------- |
| 1     | 1-back | 1500ms        | 2000ms               | Easy        |
| 2     | 3-back | 1000ms        | 2000ms               | Medium      |
| 3     | 3-back | 800ms         | 1500ms               | Hard        |

### Training Phase

Both game modes include a training phase with 3 sequences:

- **Percent Mode**: Shows accuracy feedback and automatic progression
- **Restart Mode**: Tracks attempt count and completion status per sequence

### Interaction Method

All difficulty choices and error acknowledgments use a **cursor-dragging interface**:

1. Cursor appears at bottom center of screen
2. Participant drags cursor to desired button
3. Mouse release over button confirms selection
4. Includes deadline timers to ensure timely responses
5. The coordinates of the mouse cursor are recorded during the choice

### Data Collection

The task comprehensively logs:

- **Trial Results**: Complete stimulus sequences, responses, and timing data
- **Difficulty Choices**: Mouse trajectories, reaction times, and selections
- **Performance Metrics**: Hits, false alarms, misses, accuracy, and reaction times
- **Restart Events**: Attempt counts and error types (restart mode only)

### Configuration

Task behavior is controlled by constants in `src/constants/block.ts`:

- `GAMEMODE`: "percent" or "restart"
- `TOTAL_SEQUENCES`: Number of sequences to complete
- `SAVE_DATA`: Whether to save results to server

## Level Generation

The `levels.json` file containing all game levels and training sequences is automatically generated from constants defined in `src/constants/block.ts` using a generation script.

### How It Works

The level generation script (`src/script/generate_levels.js`) reads the constants from `block.ts` and generates:

1. **Main Levels (`nbackLevels`)**: For each difficulty level, it creates `LEVELS_NB` number of trials
2. **Training Sequence (`trainingSequence`)**: Creates `LEVELS_NB_TRAINING` number of "3-back (Medium)" training levels
3. **Stimulus Set**: Uses the predefined stimulus characters
4. **Configuration**: Includes max trials and target key settings

### Parameters Used

The script uses the following constants from `src/constants/block.ts`:

- **`LEVELS_NB`** (40): Number of levels to generate for each difficulty
- **`DIFFICULTY_NB`** (3): Number of different difficulty levels
- **`LEVELS_NB_TRAINING`** (3): Number of training sequence levels
- **`DESCRIPTION`**: Array of difficulty descriptions (`["1-back (Easy)", "3-back (Medium)", "3-back (Hard)"]`)
- **`STIMULUS_TIME`**: Array of stimulus display times in ms (`[1500, 1000, 800]`)
- **`INTERTRIAL_INTERVAL`**: Array of intervals between trials in ms (`[2000, 2000, 1500]`)
- **`SEQUENCE_LENGTH`**: Array of sequence lengths (`[15, 15, 15]`)
- **`N`**: Array of N-back values (`[1, 3, 3]`)
- **`STIMULUS_SET`**: Array of stimulus characters (`["A", "B", "C", "D", "E", "H", "I", "K", "L", "M", "O", "P", "R", "S", "T"]`)
- **`TARGET_KEY`**: The key used for target responses (`" "` - spacebar)

### Generated Structure

The script generates a total of **120 levels** (40 levels × 3 difficulties):

- **Levels 1-40**: 1-back (Easy) - 1500ms stimulus, 2000ms interval
- **Levels 41-80**: 3-back (Medium) - 1000ms stimulus, 2000ms interval
- **Levels 81-120**: 3-back (Hard) - 800ms stimulus, 1500ms interval

### Training Sequence

The training sequence contains **3 levels** of "3-back (Medium)" difficulty to help users practice before the main experiment.

### Usage

To regenerate the `levels.json` file after modifying constants in `block.ts`:

```bash
node src/script/generate_levels.js
```

The script will:

1. Read the current constants from `src/constants/block.ts`
2. Generate the appropriate number of levels for each difficulty
3. Create the training sequence
4. Write the output to `src/constants/levels.json`

### Example Output

```
Successfully generated levels.json with:
- 120 total levels
- 3 training sequences
- 15 stimulus items
File saved to: /path/to/src/constants/levels.json
```

## Old version of the experiment
