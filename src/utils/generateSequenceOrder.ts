import levelsData from "@/constants/levels.json";

export interface SequenceLevel {
  level: number;
  uniqueId: string;
  N: number;
  stimulusTime: number;
  intertrialInterval: number;
  sequenceLength: number;
  description: string;
  matches: number[];
}

/**
 * Generates a randomized order of sequences from levels.json
 * @param totalSequences - Total number of sequences to include in the randomized order
 * @returns Array of randomized sequence levels
 */
export function generateSequenceOrder(totalSequences: number): SequenceLevel[] {
  const allLevels = levelsData.nbackLevels as SequenceLevel[];

  if (totalSequences > allLevels.length) {
    throw new Error(
      `Cannot generate ${totalSequences} sequences: only ${allLevels.length} available in levels.json`
    );
  }

  // Create a copy of the levels array to avoid mutating the original
  const shuffledLevels = [...allLevels];

  // Fisher-Yates shuffle algorithm
  for (let i = shuffledLevels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledLevels[i], shuffledLevels[j]] = [
      shuffledLevels[j],
      shuffledLevels[i],
    ];
  }

  // Return the first 'totalSequences' number of shuffled levels
  return shuffledLevels.slice(0, totalSequences);
}

/**
 * Gets a specific sequence by its index in the randomized order
 * @param sequenceOrder - The randomized sequence order array
 * @param index - The index of the sequence to retrieve (0-based)
 * @returns The sequence level at the specified index
 */
export function getSequenceByIndex(
  sequenceOrder: SequenceLevel[] | undefined,
  index: number
): SequenceLevel {
  if (!sequenceOrder) {
    throw new Error("sequenceOrder is undefined");
  }
  if (index < 0 || index >= sequenceOrder.length) {
    throw new Error(
      `Sequence index ${index} is out of bounds. Available sequences: 0-${
        sequenceOrder.length - 1
      }`
    );
  }
  return sequenceOrder[index];
}
