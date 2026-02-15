'use client';

import React, { useState, useEffect } from 'react';
import { PuzzleCell } from '@/lib/puzzleEngine';
import { motion } from 'framer-motion';

interface SudokuGridProps {
  grid: PuzzleCell[][];
  onCellChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
  errors?: { row: number; col: number }[];
}

export default function SudokuGrid({ grid, onCellChange, disabled, errors }: SudokuGridProps) {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const size = grid.length;

  const handleCellClick = (row: number, col: number) => {
    if (disabled || grid[row][col].isClue) return;
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (num: number) => {
    if (selectedCell && !disabled) {
      const { row, col } = selectedCell;
      if (!grid[row][col].isClue) {
        onCellChange(row, col, num);
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedCell || disabled) return;
      
      const num = parseInt(e.key);
      if (num >= 1 && num <= size) {
        handleNumberInput(num);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleNumberInput(0);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedCell, disabled]);

  const hasError = (row: number, col: number) => {
    return errors?.some(e => e.row === row && e.col === col) || false;
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Grid */}
      <div className="bg-white p-2 sm:p-4 rounded-lg shadow-lg overflow-x-auto">
        <div className="grid gap-0 border-2 border-gray-800">
          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((cell, colIndex) => {
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                const isClue = cell.isClue;
                const error = hasError(rowIndex, colIndex);
                
                return (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={disabled || isClue}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-base sm:text-lg font-semibold
                      border border-gray-300 transition-colors
                      ${isSelected ? 'bg-blue-200 ring-2 ring-blue-500' : ''}
                      ${isClue ? 'bg-gray-100 text-gray-900 font-bold' : 'bg-white text-blue-600'}
                      ${error ? 'bg-red-100 text-red-600' : ''}
                      ${!isClue && !disabled ? 'hover:bg-gray-50 cursor-pointer' : ''}
                      ${colIndex % 3 === 2 && colIndex < size - 1 ? 'border-r-2 border-r-gray-800' : ''}
                      ${rowIndex % 2 === 1 && rowIndex < size - 1 ? 'border-b-2 border-b-gray-800' : ''}
                    `}
                  >
                    {cell.revealed && cell.value > 0 ? cell.value : ''}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Number Input Buttons */}
      {!disabled && selectedCell && (
        <div className="flex gap-2 flex-wrap justify-center max-w-md">
          {Array.from({ length: size }, (_, i) => i + 1).map(num => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleNumberInput(num)}
              className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg shadow-md"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleNumberInput(0)}
            className="w-12 h-12 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold text-lg shadow-md"
          >
            ✕
          </motion.button>
        </div>
      )}
    </div>
  );
}
