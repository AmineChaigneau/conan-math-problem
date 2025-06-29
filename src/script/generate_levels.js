#!/usr/bin/env node

// Simple script to generate levels.json from block.ts constants
// const fs = require("fs");
// const path = require("path");

// Simple seeded random number generator (LCG)
function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Generate stimulus sequence with controlled number of matches
function generateStimulusSequence(length, stimulusSet, nBack, seed) {
  const rng = seededRandom(seed);
  const sequence = [];
  const targetMatchRate = 0.3; // Aim for ~30% matches
  const numMatches = Math.floor(length * targetMatchRate);

  // Fill initial N positions randomly
  for (let i = 0; i < Math.min(nBack, length); i++) {
    sequence.push(stimulusSet[Math.floor(rng() * stimulusSet.length)]);
  }

  // Create matches at specific positions
  const matchPositions = new Set();
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
}

// Read the block.ts file and extract constants
function extractConstants() {
  const blockPath = path.join(__dirname, "../constants/block.ts");
  const content = fs.readFileSync(blockPath, "utf8");

  // Extract constants using regex
  const constants = {};

  // Extract LEVELS_NB
  const levelsNbMatch = content.match(/export const LEVELS_NB = (\d+);/);
  constants.LEVELS_NB = levelsNbMatch ? parseInt(levelsNbMatch[1]) : 40;

  // Extract DIFFICULTY_NB
  const difficultyNbMatch = content.match(
    /export const DIFFICULTY_NB = (\d+);/
  );
  constants.DIFFICULTY_NB = difficultyNbMatch
    ? parseInt(difficultyNbMatch[1])
    : 3;

  // Extract LEVELS_NB_TRAINING
  const trainingNbMatch = content.match(
    /export const LEVELS_NB_TRAINING = (\d+);/
  );
  constants.LEVELS_NB_TRAINING = trainingNbMatch
    ? parseInt(trainingNbMatch[1])
    : 3;

  // Extract TARGET_KEY
  const targetKeyMatch = content.match(/export const TARGET_KEY = "([^"]+)";/);
  constants.TARGET_KEY = targetKeyMatch ? targetKeyMatch[1] : " ";

  // Extract arrays
  const descriptionMatch = content.match(
    /export const DESCRIPTION = \[([\s\S]*?)\];/
  );
  if (descriptionMatch) {
    constants.DESCRIPTION = descriptionMatch[1]
      .split(",")
      .map((item) => item.trim().replace(/"/g, ""))
      .filter((item) => item);
  } else {
    constants.DESCRIPTION = [
      "1-back (Easy)",
      "3-back (Medium)",
      "3-back (Hard)",
    ];
  }

  const stimulusTimeMatch = content.match(
    /export const STIMULUS_TIME = \[([\s\S]*?)\];/
  );
  if (stimulusTimeMatch) {
    constants.STIMULUS_TIME = stimulusTimeMatch[1]
      .split(",")
      .map((item) => parseInt(item.trim()))
      .filter((item) => !isNaN(item));
  } else {
    constants.STIMULUS_TIME = [1500, 1000, 800];
  }

  const intertrialMatch = content.match(
    /export const INTERTRIAL_INTERVAL = \[([\s\S]*?)\];/
  );
  if (intertrialMatch) {
    constants.INTERTRIAL_INTERVAL = intertrialMatch[1]
      .split(",")
      .map((item) => parseInt(item.trim()))
      .filter((item) => !isNaN(item));
  } else {
    constants.INTERTRIAL_INTERVAL = [2000, 2000, 1500];
  }

  const sequenceLengthMatch = content.match(
    /export const SEQUENCE_LENGTH = \[([\s\S]*?)\];/
  );
  if (sequenceLengthMatch) {
    constants.SEQUENCE_LENGTH = sequenceLengthMatch[1]
      .split(",")
      .map((item) => parseInt(item.trim()))
      .filter((item) => !isNaN(item));
  } else {
    constants.SEQUENCE_LENGTH = [15, 15, 15];
  }

  const nMatch = content.match(/export const N = \[([\s\S]*?)\];/);
  if (nMatch) {
    constants.N = nMatch[1]
      .split(",")
      .map((item) => parseInt(item.trim()))
      .filter((item) => !isNaN(item));
  } else {
    constants.N = [1, 3, 3];
  }

  const stimulusSetMatch = content.match(
    /export const STIMULUS_SET = \[([\s\S]*?)\];/
  );
  if (stimulusSetMatch) {
    constants.STIMULUS_SET = stimulusSetMatch[1]
      .split(",")
      .map((item) => item.trim().replace(/"/g, ""))
      .filter((item) => item);
  } else {
    constants.STIMULUS_SET = [
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
  }

  return constants;
}

function generateLevels() {
  const constants = extractConstants();

  const nbackLevels = [];
  let levelCounter = 1;

  // Generate LEVELS_NB levels for each difficulty
  for (
    let difficultyIndex = 0;
    difficultyIndex < constants.DIFFICULTY_NB;
    difficultyIndex++
  ) {
    for (let i = 0; i < constants.LEVELS_NB; i++) {
      const N = constants.N[difficultyIndex];
      const sequenceLength = constants.SEQUENCE_LENGTH[difficultyIndex];

      // Generate deterministic seed for this level
      const seed = 1000 + levelCounter;

      // Generate the sequence
      const sequence = generateStimulusSequence(
        sequenceLength,
        constants.STIMULUS_SET,
        N,
        seed
      );

      // Create unique ID: N*sequenceLength*sequence
      const uniqueId = `${N}*${sequenceLength}*${sequence.join("")}`;

      nbackLevels.push({
        level: levelCounter++,
        uniqueId: uniqueId,
        N: N,
        stimulusTime: constants.STIMULUS_TIME[difficultyIndex],
        intertrialInterval: constants.INTERTRIAL_INTERVAL[difficultyIndex],
        sequenceLength: sequenceLength,
        description: constants.DESCRIPTION[difficultyIndex],
        sequence: sequence,
      });
    }
  }

  // Generate training sequence - LEVELS_NB_TRAINING of "2-back (Medium)"
  const mediumIndex = constants.DESCRIPTION.findIndex((desc) =>
    desc.includes("Medium")
  );

  const trainingSequence = [];
  for (let i = 0; i < constants.LEVELS_NB_TRAINING; i++) {
    const N = constants.N[mediumIndex];
    const sequenceLength = constants.SEQUENCE_LENGTH[mediumIndex];

    // Generate deterministic seed for training
    const seed = 2000 + i + 1;

    // Generate the sequence
    const sequence = generateStimulusSequence(
      sequenceLength,
      constants.STIMULUS_SET,
      N,
      seed
    );

    // Create unique ID: N*sequenceLength*sequence
    const uniqueId = `${N}*${sequenceLength}*${sequence.join("")}`;

    trainingSequence.push({
      level: i + 1,
      uniqueId: uniqueId,
      N: N,
      stimulusTime: constants.STIMULUS_TIME[mediumIndex],
      intertrialInterval: constants.INTERTRIAL_INTERVAL[mediumIndex],
      sequenceLength: sequenceLength,
      description: constants.DESCRIPTION[mediumIndex],
      sequence: sequence,
    });
  }

  return {
    nbackLevels,
    trainingSequence,
    stimulusSet: constants.STIMULUS_SET,
    maxTrials: 10,
    targetKey: constants.TARGET_KEY,
  };
}

function main() {
  const levelsConfig = generateLevels();

  // Write to constants/levels.json
  const outputPath = path.join(__dirname, "../constants/levels.json");

  try {
    fs.writeFileSync(outputPath, JSON.stringify(levelsConfig, null, 2));
    console.log(`Successfully generated levels.json with:`);
    console.log(`- ${levelsConfig.nbackLevels.length} total levels`);
    console.log(`- ${levelsConfig.trainingSequence.length} training sequences`);
    console.log(`- ${levelsConfig.stimulusSet.length} stimulus items`);
    console.log(`- Each level includes predefined sequence and unique ID`);
    console.log(`File saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error writing levels.json:", error);
  }
}

if (require.main === module) {
  main();
}
