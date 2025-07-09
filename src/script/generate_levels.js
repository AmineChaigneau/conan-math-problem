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

// Generate matches array with controlled number of matches
function generateMatchesArray(length, nBack, matchResponseRate, seed) {
  const rng = seededRandom(seed);
  const matches = new Array(length).fill(0); // Initialize matches array with 0s
  const numMatches = Math.ceil(length * matchResponseRate); // Round UP for fixed number of matches

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

  // Mark match positions
  for (let i = nBack; i < length; i++) {
    if (matchPositions.has(i)) {
      matches[i] = 1; // Mark as match position
    } else {
      matches[i] = 0; // Mark as non-match position
    }
  }

  return matches;
}

// Read the block.ts file and extract constants
function extractConstants() {
  const blockPath = path.join(__dirname, "../constants/block.ts");
  const content = fs.readFileSync(blockPath, "utf8");

  // Extract constants using regex
  const constants = {};

  // Extract LEVELS_NB
  const levelsNbMatch = content.match(/export const LEVELS_NB = (\d+);/);
  constants.LEVELS_NB = levelsNbMatch ? parseInt(levelsNbMatch[1]) : 20;

  // Extract LENGTH_N
  const lengthNMatch = content.match(/export const LENGTH_N = (\d+);/);
  constants.LENGTH_N = lengthNMatch ? parseInt(lengthNMatch[1]) : 2;

  // Extract LEVELS_NB_TRAINING
  const trainingNbMatch = content.match(
    /export const LEVELS_NB_TRAINING = (\d+);/
  );
  constants.LEVELS_NB_TRAINING = trainingNbMatch
    ? parseInt(trainingNbMatch[1])
    : 3;

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
      "2-back (Medium) - Short",
      "2-back (Medium) - Long",
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
    constants.STIMULUS_TIME = [1000, 1000];
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
    constants.INTERTRIAL_INTERVAL = [1200, 1200];
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
    constants.SEQUENCE_LENGTH = [15, 30];
  }

  const nMatch = content.match(/export const N = \[([\s\S]*?)\];/);
  if (nMatch) {
    constants.N = nMatch[1]
      .split(",")
      .map((item) => parseInt(item.trim()))
      .filter((item) => !isNaN(item));
  } else {
    constants.N = [2, 2];
  }

  const matchResponseRateMatch = content.match(
    /export const MATCH_RESPONSE_RATE = \[([\s\S]*?)\];/
  );
  if (matchResponseRateMatch) {
    constants.MATCH_RESPONSE_RATE = matchResponseRateMatch[1]
      .split(",")
      .map((item) => parseFloat(item.trim()))
      .filter((item) => !isNaN(item));
  } else {
    constants.MATCH_RESPONSE_RATE = [0.3, 0.3];
  }

  return constants;
}

function generateLevels() {
  const constants = extractConstants();

  const nbackLevels = [];
  let levelCounter = 1;

  // Generate LEVELS_NB levels for each sequence length
  for (let lengthIndex = 0; lengthIndex < constants.LENGTH_N; lengthIndex++) {
    for (let i = 0; i < constants.LEVELS_NB; i++) {
      const N = constants.N[lengthIndex]; // Should be 2 for both
      const sequenceLength = constants.SEQUENCE_LENGTH[lengthIndex];
      const matchResponseRate = constants.MATCH_RESPONSE_RATE[lengthIndex];

      // Generate deterministic seed for this level
      const seed = 1000 + levelCounter;

      // Generate the matches array
      const matches = generateMatchesArray(
        sequenceLength,
        N,
        matchResponseRate,
        seed
      );

      // Create unique ID: N*sequenceLength*level
      const uniqueId = `${N}*${sequenceLength}*${levelCounter}`;

      nbackLevels.push({
        level: levelCounter++,
        uniqueId: uniqueId,
        N: N,
        stimulusTime: constants.STIMULUS_TIME[lengthIndex],
        intertrialInterval: constants.INTERTRIAL_INTERVAL[lengthIndex],
        sequenceLength: sequenceLength,
        description: constants.DESCRIPTION[lengthIndex],
        matches: matches,
      });
    }
  }

  // Generate training sequence - use the first sequence length for training
  const trainingSequence = [];
  for (let i = 0; i < constants.LEVELS_NB_TRAINING; i++) {
    const N = constants.N[0]; // Use first N value (should be 2)
    const sequenceLength = constants.SEQUENCE_LENGTH[0]; // Use first sequence length (should be 15)
    const matchResponseRate = constants.MATCH_RESPONSE_RATE[0]; // Use first match response rate

    // Generate deterministic seed for training
    const seed = 2000 + i + 1;

    // Generate the matches array
    const matches = generateMatchesArray(
      sequenceLength,
      N,
      matchResponseRate,
      seed
    );

    // Create unique ID: N*sequenceLength*training*level
    const uniqueId = `${N}*${sequenceLength}*training*${i + 1}`;

    trainingSequence.push({
      level: i + 1,
      uniqueId: uniqueId,
      N: N,
      stimulusTime: constants.STIMULUS_TIME[0],
      intertrialInterval: constants.INTERTRIAL_INTERVAL[0],
      sequenceLength: sequenceLength,
      description: constants.DESCRIPTION[0],
      matches: matches,
    });
  }

  return {
    nbackLevels,
    trainingSequence,
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
    console.log(`- Each level includes matches array and unique ID`);

    // Show some sample match rates
    const constants = extractConstants();
    for (let i = 0; i < constants.LENGTH_N; i++) {
      const expectedMatches = Math.ceil(
        constants.SEQUENCE_LENGTH[i] * constants.MATCH_RESPONSE_RATE[i]
      );
      console.log(
        `- Length ${
          constants.SEQUENCE_LENGTH[i]
        }: ${expectedMatches} matches (${(
          constants.MATCH_RESPONSE_RATE[i] * 100
        ).toFixed(1)}%)`
      );
    }

    console.log(`File saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error writing levels.json:", error);
  }
}

if (require.main === module) {
  main();
}
