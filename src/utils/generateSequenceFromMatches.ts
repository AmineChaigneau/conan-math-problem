import { STIMULUS_SET } from "@/constants/block";

/**
 * Generates a letter sequence from a matches array
 * @param matches - Array of 0s and 1s indicating where matches should occur
 * @param N - N-back level (e.g., 2 for 2-back)
 * @param seed - Optional seed for deterministic random generation
 * @returns Array of letters following the specified match pattern
 */
export function generateSequenceFromMatches(
  matches: number[],
  N: number,
  seed?: number
): string[] {
  const sequenceLength = matches.length;
  const sequence: string[] = new Array(sequenceLength);

  // Simple seeded random number generator (LCG) if seed is provided
  let rng: () => number;
  if (seed !== undefined) {
    let state = seed;
    rng = () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  } else {
    rng = Math.random;
  }

  // Fill initial N positions randomly
  for (let i = 0; i < Math.min(N, sequenceLength); i++) {
    sequence[i] = STIMULUS_SET[Math.floor(rng() * STIMULUS_SET.length)];
  }

  // Fill remaining positions based on matches array
  for (let i = N; i < sequenceLength; i++) {
    if (matches[i] === 1) {
      // Should match the letter N positions back
      sequence[i] = sequence[i - N];
    } else {
      // Should NOT match the letter N positions back
      let stimulus;
      let attempts = 0;
      do {
        stimulus = STIMULUS_SET[Math.floor(rng() * STIMULUS_SET.length)];
        attempts++;
      } while (stimulus === sequence[i - N] && attempts < 20);
      sequence[i] = stimulus;
    }
  }

  return sequence;
}
