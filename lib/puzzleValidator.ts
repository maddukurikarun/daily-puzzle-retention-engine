// MODULE 1: Puzzle Validator
// Client-side validation to prevent tampering

import { Puzzle, PuzzleCell } from './puzzleEngine';

export interface ValidationResult {
  isValid: boolean;
  isComplete: boolean;
  errors: { row: number; col: number; message: string }[];
}

export function validateSudoku(grid: PuzzleCell[][], solution: number[][]): ValidationResult {
  const errors: { row: number; col: number; message: string }[] = [];
  let isComplete = true;

  const size = grid.length;

  // Check if all cells are filled
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (!grid[i][j].revealed) {
        isComplete = false;
      }
    }
  }

  if (!isComplete) {
    return { isValid: false, isComplete: false, errors };
  }

  // Validate against solution
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (grid[i][j].value !== solution[i][j]) {
        errors.push({
          row: i,
          col: j,
          message: `Expected ${solution[i][j]}, got ${grid[i][j].value}`,
        });
      }
    }
  }

  // Check rows
  for (let i = 0; i < size; i++) {
    const rowValues = new Set<number>();
    for (let j = 0; j < size; j++) {
      const value = grid[i][j].value;
      if (value < 1 || value > size) {
        errors.push({ row: i, col: j, message: 'Invalid number' });
      }
      if (rowValues.has(value)) {
        errors.push({ row: i, col: j, message: 'Duplicate in row' });
      }
      rowValues.add(value);
    }
  }

  // Check columns
  for (let j = 0; j < size; j++) {
    const colValues = new Set<number>();
    for (let i = 0; i < size; i++) {
      const value = grid[i][j].value;
      if (colValues.has(value)) {
        errors.push({ row: i, col: j, message: 'Duplicate in column' });
      }
      colValues.add(value);
    }
  }

  // Check 2x3 boxes for 6x6 Sudoku
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 2; boxCol++) {
      const boxValues = new Set<number>();
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 3; j++) {
          const row = boxRow * 2 + i;
          const col = boxCol * 3 + j;
          const value = grid[row][col].value;
          if (boxValues.has(value)) {
            errors.push({ row, col, message: 'Duplicate in box' });
          }
          boxValues.add(value);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    isComplete: true,
    errors,
  };
}

export function validateNonogram(grid: PuzzleCell[][], solution: number[][]): ValidationResult {
  const errors: { row: number; col: number; message: string }[] = [];
  let isComplete = true;

  const size = grid.length;

  // Check if all cells are filled
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (!grid[i][j].revealed) {
        isComplete = false;
      }
    }
  }

  if (!isComplete) {
    return { isValid: false, isComplete: false, errors };
  }

  // Validate against solution
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (grid[i][j].value !== solution[i][j]) {
        errors.push({
          row: i,
          col: j,
          message: `Incorrect cell`,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    isComplete: true,
    errors,
  };
}

export function validatePuzzle(puzzle: Puzzle): ValidationResult {
  if (puzzle.type === 'sudoku') {
    return validateSudoku(puzzle.grid, puzzle.solution);
  } else if (puzzle.type === 'nonogram') {
    return validateNonogram(puzzle.grid, puzzle.solution);
  }
  return { isValid: false, isComplete: false, errors: [{ row: 0, col: 0, message: 'Unknown puzzle type' }] };
}

// Prevent score tampering
export function calculateScore(
  completionTime: number,
  hintsUsed: number,
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  const baseScore: Record<string, number> = {
    easy: 100,
    medium: 200,
    hard: 300,
  };

  const base = baseScore[difficulty];
  
  // Time multiplier (faster = higher score)
  // Max time bonus at 60 seconds, decreasing after
  const timeMultiplier = Math.max(0.5, 2 - completionTime / 300);
  
  // Hint penalty (each hint reduces score by 10%)
  const hintPenalty = Math.pow(0.9, hintsUsed);

  const finalScore = Math.round(base * timeMultiplier * hintPenalty);
  
  return Math.max(10, finalScore); // Minimum 10 points
}

export function isScoreValid(
  score: number,
  completionTime: number,
  hintsUsed: number,
  difficulty: 'easy' | 'medium' | 'hard'
): boolean {
  const calculatedScore = calculateScore(completionTime, hintsUsed, difficulty);
  const maxScore: Record<string, number> = {
    easy: 200,
    medium: 400,
    hard: 600,
  };

  // Allow 10% variance for calculation differences
  const isWithinRange = Math.abs(score - calculatedScore) <= calculatedScore * 0.1;
  const isUnderMax = score <= maxScore[difficulty];
  const timeRealistic = completionTime >= 5 && completionTime <= 3600; // 5 sec to 1 hour

  return isWithinRange && isUnderMax && timeRealistic;
}
