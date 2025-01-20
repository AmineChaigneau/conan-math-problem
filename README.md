# Persistence and Decision-Making

A cognitive training application that studies how decision-making and persistence evolve over time as mathematical sequence problems become increasingly difficult.

## Try It Out

Try the task: [Live Demo](https://conan-mathproblem.web.app/)

## How It Works

1. Users are presented with a sequence of numbers and mathematical operators
2. Each element appears briefly in sequence
3. Users must solve the mathematical sequence and select the correct answer
4. Answers are selected by dragging a cursor to one of four options
5. Feedback is provided after each attempt
6. Users can choose to continue at current difficulty or switch to easier problems

## Technical Details

Built with:

- Next.js 13+ (React Framework)
- TypeScript
- Tailwind CSS
- Lucide Icons
- Custom UI Components

## Key Components

- `TrialManager`: Handles individual problem attempts and feedback
- `MathProblem`: Displays sequences and answer options
- `DifficultyChoice`: Manages difficulty selection interface
- `Cursor`: Custom draggable cursor component

## Game Flow

1. Users start with medium/hard difficulty problems
2. Users can opt for easier problems after answers
3. Progress bar shows advancement toward completion goal
4. Session ends after reaching maximum attempts or completion goal

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Access app at `localhost:3000`

## Usage

1. Read instructions
2. Complete training mode
3. Solve mathematical sequences
4. Track progress toward completion
5. Review results at end of session
