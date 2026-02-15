'use client';

import React, { useState } from 'react';
import { PuzzleCell } from '@/lib/puzzleEngine';
import { motion } from 'framer-motion';

interface NonogramGridProps {
  grid: PuzzleCell[][];
  solution: number[][];
  onCellChange: (row: number, col: number, value: number) => void;
  disabled?: boolean;
}

export default function NonogramGrid({ grid, solution, onCellChange, disabled }: NonogramGridProps) {
  const size = grid.length;

  // Calculate row and column clues
  const rowClues = solution.map(row => {
    const clues: number[] = [];
    let count = 0;
    for (let val of row) {
      if (val === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    return clues.length > 0 ? clues : [0];
  });

  const colClues: number[][] = [];
  for (let col = 0; col < size; col++) {
    const clues: number[] = [];
    let count = 0;
    for (let row = 0; row < size; row++) {
      if (solution[row][col] === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    colClues.push(clues.length > 0 ? clues : [0]);
  }

  const handleCellClick = (row: number, col: number) => {
    if (disabled) return;
    const currentValue = grid[row][col].value;
    const newValue = currentValue === 1 ? 0 : 1;
    onCellChange(row, col, newValue);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <div className="flex">
          {/* Empty corner */}
          <div className="w-16" />
          
          {/* Column clues */}
          <div className="flex">
            {colClues.map((clues, idx) => (
              <div key={idx} className="w-10 h-16 flex flex-col items-center justify-end pb-1 text-xs font-semibold">
                {clues.map((clue, i) => (
                  <div key={i}>{clue}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex">
          {/* Row clues */}
          <div className="flex flex-col">
            {rowClues.map((clues, idx) => (
              <div key={idx} className="w-16 h-10 flex items-center justify-end pr-2 text-xs font-semibold">
                {clues.join(' ')}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="border-2 border-gray-800">
            {grid.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((cell, colIndex) => (
                  <motion.button
                    key={`${rowIndex}-${colIndex}`}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    disabled={disabled}
                    className={`
                      w-10 h-10 border border-gray-300 transition-colors
                      ${cell.revealed && cell.value === 1 ? 'bg-blue-600' : 'bg-white'}
                      ${!disabled ? 'hover:bg-gray-100 cursor-pointer' : ''}
                    `}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Click cells to fill/unfill
      </div>
    </div>
  );
}
