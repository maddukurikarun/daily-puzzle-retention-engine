// MODULE 1: Puzzle Seed Engine
// Generates deterministic puzzles based on date

export interface PuzzleCell {
  value: number;
  revealed: boolean;
  isClue: boolean;
}

export interface Puzzle {
  id: string;
  date: string;
  type: 'sudoku' | 'nonogram';
  grid: PuzzleCell[][];
  solution: number[][];
  difficulty: 'easy' | 'medium' | 'hard';
  seed: string;
}

// Simple hash function for seed generation
async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for environments without crypto.subtle
  return simpleHash(message);
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0').substring(0, 64);
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    this.seed = parseInt(seed.substring(0, 8), 16);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

export async function generatePuzzleSeed(date: string, secretKey: string): Promise<string> {
  return await sha256(`${date}-${secretKey}`);
}

// Generate a simple 6x6 Sudoku puzzle
export async function generateSudokuPuzzle(date: string): Promise<Puzzle> {
  const secretKey = process.env.NEXT_PUBLIC_PUZZLE_SECRET_KEY || 'ultra-secret-seed-key-2026';
  const seed = await generatePuzzleSeed(date, secretKey);
  const rng = new SeededRandom(seed);

  // Generate a valid 6x6 Sudoku solution
  const size = 6;
  const solution: number[][] = [];

  // Create base solution
  for (let i = 0; i < size; i++) {
    solution[i] = [];
    for (let j = 0; j < size; j++) {
      solution[i][j] = ((i * 3 + Math.floor(i / 2) + j) % size) + 1;
    }
  }

  // Shuffle rows and columns within blocks
  for (let i = 0; i < 3; i++) {
    const rows = [i * 2, i * 2 + 1];
    if (rng.next() > 0.5) {
      [solution[rows[0]], solution[rows[1]]] = [solution[rows[1]], solution[rows[0]]];
    }
  }

  // Determine difficulty and clues
  const difficultyRandom = rng.next();
  let difficulty: 'easy' | 'medium' | 'hard';
  let cluesToReveal: number;

  if (difficultyRandom < 0.33) {
    difficulty = 'easy';
    cluesToReveal = 20; // More clues
  } else if (difficultyRandom < 0.66) {
    difficulty = 'medium';
    cluesToReveal = 16;
  } else {
    difficulty = 'hard';
    cluesToReveal = 12; // Fewer clues
  }

  // Create puzzle grid with clues
  const grid: PuzzleCell[][] = solution.map(row =>
    row.map(value => ({
      value: 0,
      revealed: false,
      isClue: false,
    }))
  );

  // Randomly reveal cells as clues
  const positions: [number, number][] = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      positions.push([i, j]);
    }
  }

  const shuffled = rng.shuffle(positions);
  for (let i = 0; i < cluesToReveal; i++) {
    const [row, col] = shuffled[i];
    grid[row][col] = {
      value: solution[row][col],
      revealed: true,
      isClue: true,
    };
  }

  return {
    id: `sudoku-${date}`,
    date,
    type: 'sudoku',
    grid,
    solution,
    difficulty,
    seed,
  };
}

// Generate a simple Nonogram puzzle
export async function generateNonogramPuzzle(date: string): Promise<Puzzle> {
  const secretKey = process.env.NEXT_PUBLIC_PUZZLE_SECRET_KEY || 'ultra-secret-seed-key-2026';
  const seed = await generatePuzzleSeed(date, secretKey);
  const rng = new SeededRandom(seed);

  const size = 8;
  const solution: number[][] = [];

  // Create a simple pattern
  const patterns = [
    // Heart pattern
    [
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
    // Diamond pattern
    [
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
    ],
  ];

  const patternIndex = rng.nextInt(0, patterns.length - 1);
  const selectedPattern = patterns[patternIndex];

  for (let i = 0; i < size; i++) {
    solution[i] = [...selectedPattern[i]];
  }

  const difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  const grid: PuzzleCell[][] = solution.map(row =>
    row.map(() => ({
      value: 0,
      revealed: false,
      isClue: false,
    }))
  );

  return {
    id: `nonogram-${date}`,
    date,
    type: 'nonogram',
    grid,
    solution,
    difficulty,
    seed,
  };
}

// Main puzzle generator
export async function generateDailyPuzzle(date: string, type?: 'sudoku' | 'nonogram'): Promise<Puzzle> {
  if (!type) {
    const seed = await generatePuzzleSeed(date, 'type-selector');
    const rng = new SeededRandom(seed);
    type = rng.next() > 0.5 ? 'sudoku' : 'nonogram';
  }

  if (type === 'sudoku') {
    return generateSudokuPuzzle(date);
  } else {
    return generateNonogramPuzzle(date);
  }
}
