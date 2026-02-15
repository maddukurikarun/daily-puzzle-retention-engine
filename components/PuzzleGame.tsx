'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Puzzle, PuzzleCell, generateDailyPuzzle } from '@/lib/puzzleEngine';
import { validatePuzzle, calculateScore } from '@/lib/puzzleValidator';
import * as db from '@/lib/db';
import { calculateStreak, formatDate, syncScores } from '@/lib/streakService';
import { checkAchievements, checkSpeedAchievement } from '@/lib/achievementService';
import { triggerAchievement } from './AchievementDisplay';
import SudokuGrid from './SudokuGrid';
import NonogramGrid from './NonogramGrid';
import Timer from './Timer';
import { motion } from 'framer-motion';
import { CheckCircle, Lightbulb, RotateCcw } from 'lucide-react';

interface PuzzleGameProps {
  date: string;
  userId: string;
  onComplete?: (score: number) => void;
}

export default function PuzzleGame({ date, userId, onComplete }: PuzzleGameProps) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [currentGrid, setCurrentGrid] = useState<PuzzleCell[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [score, setScore] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(0);
  const [timerKey, setTimerKey] = useState(0);
  const [errors, setErrors] = useState<{ row: number; col: number }[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Load puzzle
  useEffect(() => {
    async function loadPuzzle() {
      try {
        // Check if already completed
        const savedProgress = await db.getPuzzleProgress(date);
        
        if (savedProgress && savedProgress.completed) {
          setIsComplete(true);
          setScore(savedProgress.score || 0);
          setCompletionTime(savedProgress.completionTime || 0);
          setTimerInitialSeconds(savedProgress.completionTime || 0);
          setHintsUsed(savedProgress.hintsUsed || 0);
          setHasStarted(true);
        } else if (savedProgress) {
          setCompletionTime(savedProgress.completionTime || 0);
          setTimerInitialSeconds(savedProgress.completionTime || 0);
          setHintsUsed(savedProgress.hintsUsed || 0);
          setHasStarted(Boolean(savedProgress.hasStarted));
        }

        // Generate or load puzzle
        let puzzleData: Puzzle;
        
        if (savedProgress && savedProgress.puzzleData) {
          puzzleData = savedProgress.puzzleData;
          setCurrentGrid(savedProgress.progress || puzzleData.grid);
        } else {
          puzzleData = await generateDailyPuzzle(date);
          setCurrentGrid(JSON.parse(JSON.stringify(puzzleData.grid)));
          await db.savePuzzleProgress(date, puzzleData, puzzleData.grid, {
            completionTime: 0,
            hintsUsed: 0,
            hasStarted: false,
          });
        }

        setPuzzle(puzzleData);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load puzzle:', error);
        setIsLoading(false);
      }
    }

    loadPuzzle();
  }, [date]);

  // Auto-save progress
  useEffect(() => {
    if (puzzle && hasStarted && !isComplete) {
      const saveProgress = async () => {
        await db.savePuzzleProgress(date, puzzle, currentGrid, {
          completionTime,
          hintsUsed,
          hasStarted,
        });
      };
      
      const timeout = setTimeout(saveProgress, 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentGrid, puzzle, date, hasStarted, isComplete, completionTime, hintsUsed]);

  const handleCellChange = useCallback((row: number, col: number, value: number) => {
    if (!hasStarted) setHasStarted(true);
    
    setCurrentGrid(prev => {
      const newGrid = prev.map(r => r.map(c => ({ ...c })));
      newGrid[row][col].value = value;
      newGrid[row][col].revealed = value > 0;
      return newGrid;
    });

    setErrors(prev => {
      const withoutCurrent = prev.filter(error => error.row !== row || error.col !== col);
      if (!puzzle || value === 0) {
        return withoutCurrent;
      }
      if (value !== puzzle.solution[row][col]) {
        return [...withoutCurrent, { row, col }];
      }
      return withoutCurrent;
    });
  }, [hasStarted, puzzle]);

  const handleValidate = useCallback(async () => {
    if (!puzzle) return;

    const result = validatePuzzle({
      ...puzzle,
      grid: currentGrid,
    });

    if (result.isComplete && result.isValid) {
      // Puzzle solved!
      const finalScore = calculateScore(completionTime, hintsUsed, puzzle.difficulty);
      setScore(finalScore);
      setIsComplete(true);
      setShowSuccess(true);

      // Save to IndexedDB
      await db.markPuzzleComplete(date, finalScore, completionTime, hintsUsed);
      await db.saveScore(date, finalScore, completionTime, hintsUsed, puzzle.type, puzzle.difficulty);
      await db.saveActivity(date, true, finalScore, puzzle.difficulty);

      // Update streak
      await calculateStreak(date);

      // Check and unlock achievements
      const unlockedAchievements = await checkAchievements(date, finalScore, puzzle.difficulty, hintsUsed);
      unlockedAchievements.forEach(id => triggerAchievement(id));

      // Check speed achievement
      if (await checkSpeedAchievement(completionTime, date)) {
        triggerAchievement('speed-demon');
      }

      // Sync if online
      if (navigator.onLine) {
        setSyncStatus('syncing');
        await syncScores(userId);
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus('idle'), 3000);
      }

      onComplete?.(finalScore);
    } else {
      setErrors(result.errors.map(e => ({ row: e.row, col: e.col })));
    }
  }, [puzzle, currentGrid, completionTime, hintsUsed, date, userId, onComplete]);

  const handleHint = useCallback(() => {
    if (!puzzle || hintsUsed >= 3) return;

    // Find an unrevealed cell that's empty
    for (let row = 0; row < puzzle.grid.length; row++) {
      for (let col = 0; col < puzzle.grid[0].length; col++) {
        if (!currentGrid[row][col].revealed && !puzzle.grid[row][col].isClue) {
          setCurrentGrid(prev => {
            const newGrid = prev.map(r => r.map(c => ({ ...c })));
            newGrid[row][col].value = puzzle.solution[row][col];
            newGrid[row][col].revealed = true;
            return newGrid;
          });
          setHintsUsed(prev => prev + 1);
          return;
        }
      }
    }
  }, [puzzle, currentGrid, hintsUsed]);

  const handleReset = useCallback(async () => {
    if (!puzzle) return;
    
    const confirmReset = confirm('Are you sure you want to reset the puzzle?');
    if (!confirmReset) return;

    const freshGrid = JSON.parse(JSON.stringify(puzzle.grid));
    setCurrentGrid(freshGrid);
    setHasStarted(false);
    setErrors([]);
    setHintsUsed(0);
    setCompletionTime(0);
    setTimerInitialSeconds(0);
    setTimerKey(prev => prev + 1);
    await db.savePuzzleProgress(date, puzzle, freshGrid, {
      completionTime: 0,
      hintsUsed: 0,
      hasStarted: false,
    });
  }, [puzzle, date]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="text-center py-20 text-red-600">
        Failed to load puzzle. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 capitalize">
            {puzzle.type} - {puzzle.difficulty}
          </h2>
          <p className="text-sm sm:text-base text-gray-600">{date}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Timer
            key={timerKey}
            isActive={hasStarted && !isComplete}
            onTimeUpdate={setCompletionTime}
            initialSeconds={timerInitialSeconds}
          />
          
          {!isComplete && (
            <div className="flex gap-2 flex-wrap w-full sm:w-auto">
              <button
                onClick={handleHint}
                disabled={hintsUsed >= 3}
                className={`
                  flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center
                  ${hintsUsed >= 3 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-yellow-400 hover:bg-yellow-500 text-gray-800'
                  }
                `}
              >
                <Lightbulb className="w-5 h-5" />
                Hint ({3 - hintsUsed})
              </button>
              
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-800 transition-colors text-sm sm:text-base flex-1 sm:flex-none justify-center"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Puzzle Grid */}
      <div className="flex justify-center">
        {puzzle.type === 'sudoku' ? (
          <SudokuGrid
            grid={currentGrid}
            onCellChange={handleCellChange}
            disabled={isComplete}
            errors={errors}
          />
        ) : (
          <NonogramGrid
            grid={currentGrid}
            solution={puzzle.solution}
            onCellChange={handleCellChange}
            disabled={isComplete}
          />
        )}
      </div>

      {/* Actions */}
      {!isComplete && (
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleValidate}
            className="flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-lg shadow-lg transition-colors"
          >
            <CheckCircle className="w-6 h-6" />
            Validate Solution
          </motion.button>
        </div>
      )}

      {/* Completion Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 border-2 border-green-500 rounded-lg p-6 text-center relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          </motion.div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Puzzle Completed!</h3>
          <p className="text-lg text-green-700">Score: {score} points</p>
          <p className="text-gray-600">Time: {Math.floor(completionTime / 60)}m {completionTime % 60}s</p>
          
          {syncStatus === 'syncing' && (
            <div className="mt-3 text-sm text-blue-600 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Syncing...
            </div>
          )}
          {syncStatus === 'synced' && (
            <div className="mt-3 text-sm text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Synced successfully!
            </div>
          )}
        </motion.div>
      )}

      {errors.length > 0 && !isComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-100 border-2 border-red-500 rounded-lg p-4 text-center text-red-700"
        >
          Some cells are incorrect. Please try again!
        </motion.div>
      )}
    </div>
  );
}
