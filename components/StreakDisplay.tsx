'use client';

import React from 'react';
import { Flame, Award } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakDisplay({ currentStreak, longestStreak }: StreakDisplayProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      {/* Current Streak */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-lg shadow-lg text-white flex-1 min-w-[200px]"
      >
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8" />
          <div>
            <div className="text-sm font-medium opacity-90">Current Streak</div>
            <div className="text-4xl font-bold">{currentStreak}</div>
            <div className="text-sm opacity-75">days</div>
          </div>
        </div>
        
        {currentStreak > 0 && (
          <motion.div
            className="mt-2 flex gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Array.from({ length: Math.min(currentStreak, 7) }, (_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Flame className="w-4 h-4" />
              </motion.div>
            ))}
            {currentStreak > 7 && (
              <span className="text-sm font-semibold ml-1">+{currentStreak - 7}</span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Longest Streak */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-purple-400 to-indigo-500 p-6 rounded-lg shadow-lg text-white flex-1 min-w-[200px]"
      >
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8" />
          <div>
            <div className="text-sm font-medium opacity-90">Best Streak</div>
            <div className="text-4xl font-bold">{longestStreak}</div>
            <div className="text-sm opacity-75">days</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
