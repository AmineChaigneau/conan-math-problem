interface MathProblem {
  sequence: string;
  sequenceArray: (string | number)[];
  difficulty: string;
  correctAnswer: number;
  answers: number[];
  correctButtonPosition: number;
}

interface TimingConfig {
  fixationTime: number;
  numberTime: number;
  symbolTime: number;
  questionTime: number;
}

export const TIMING: TimingConfig = {
  fixationTime: 400,
  numberTime: 500,
  symbolTime: 500,
  questionTime: 2000,
};

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

export const generateMathProblems = (
  numTrials: number = 5
): Record<Difficulty, MathProblem[]> => {
  console.log("Starting generateMathProblems...");
  const problems: Record<Difficulty, MathProblem[]> = {
    easy: [],
    medium: [],
    hard: [],
  };

  DIFFICULTIES.forEach((difficulty) => {
    for (let trial = 0; trial < numTrials; trial++) {
      let numbers: number[];
      let solution: number;
      let sequence_string: string;

      switch (difficulty) {
        case "easy":
          numbers = Array.from(
            { length: 4 },
            () => Math.floor(Math.random() * 3) + 1
          );

          solution = numbers.reduce((sum, num) => sum + num, 0);
          sequence_string = numbers.join(" + ");
          break;
        case "medium":
          do {
            numbers = Array.from(
              { length: 4 },
              () => Math.floor(Math.random() * 9) + 1
            );
          } while (
            numbers[0] + numbers[1] - numbers[2] <= 0 ||
            numbers[3] <= Math.abs(numbers[0] + numbers[1] - numbers[2]) ||
            new Set(numbers).size !== numbers.length
          );
          solution = numbers[0] + numbers[1] - numbers[2] + numbers[3];
          sequence_string = `${numbers[0]} + ${numbers[1]} - ${numbers[2]} + ${numbers[3]}`;
          break;

        case "hard":
          do {
            numbers = Array.from(
              { length: 4 },
              () => Math.floor(Math.random() * 9) + 1
            );
          } while (
            numbers[0] + numbers[2] <= numbers[1] + numbers[3] ||
            new Set(numbers).size !== numbers.length
          );

          solution = numbers[0] - numbers[1] + numbers[2] - numbers[3];
          sequence_string = `${numbers[0]} - ${numbers[1]} + ${numbers[2]} - ${numbers[3]}`;
          break;
        default:
          throw new Error(`Unknown difficulty: ${difficulty}`);
      }

      const correctPosition = Math.floor(Math.random() * 4);
      const incorrectAnswers = new Set<number>();

      while (incorrectAnswers.size < 3) {
        const noise = Math.round(solution + gaussianRandom(0, 2)); // Mean = 0, StdDev = 2
        if (noise > 0 && noise !== solution) {
          incorrectAnswers.add(noise);
        }
      }

      const answers = Array.from(incorrectAnswers);
      answers.splice(correctPosition, 0, solution);

      problems[difficulty].push({
        sequence: sequence_string,
        sequenceArray: numbers,
        difficulty,
        correctAnswer: solution,
        answers: answers,
        correctButtonPosition: correctPosition,
      });
    }
  });

  console.log("Problems generated:", problems);
  return problems;
};

function gaussianRandom(mean: number, stdDev: number): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdDev + mean;
}
