'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HeatmapData {
  date: string;
  count: number;
  level: number;
  score?: number;
  difficulty?: string;
}

interface DailyHeatmapProps {
  data: HeatmapData[];
}

export default function DailyHeatmap({ data }: DailyHeatmapProps) {
  const today = new Date().toISOString().split('T')[0];

  // Group data by weeks
  const weeks: HeatmapData[][] = [];
  let currentWeek: HeatmapData[] = [];
  
  // Fill initial empty days if needed
  const firstDateObj = new Date(data[0]?.date || new Date());
  const daysFromSunday = (firstDateObj.getDay() + 7) % 7;
  
  for (let i = 0; i < daysFromSunday; i++) {
    currentWeek.push({
      date: '',
      count: 0,
      level: -1, // Marker for empty cell
    });
  }

  data.forEach((day, index) => {
    currentWeek.push(day);
    
    const dayOfWeek = (daysFromSunday + index) % 7;
    if (dayOfWeek === 6 || index === data.length - 1) {
      // Complete the week if it's the last day
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: '',
          count: 0,
          level: -1,
        });
      }
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const getLevelColor = (level: number) => {
    if (level === -1) return 'bg-transparent';
    if (level === 0) return 'bg-gray-100';
    if (level === 1) return 'bg-green-200';
    if (level === 2) return 'bg-green-400';
    if (level === 3) return 'bg-green-600';
    if (level === 4) return 'bg-green-800';
    return 'bg-gray-100';
  };

  const [hoveredCell, setHoveredCell] = React.useState<HeatmapData | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

  const handleMouseEnter = (day: HeatmapData, e: React.MouseEvent) => {
    if (day.level >= 0) {
      setHoveredCell(day);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">365-Day Activity</h2>
      
      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Day labels */}
          <div className="flex mb-2">
            <div className="w-8" />
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={day} className="h-3 flex items-center">
                  {i % 2 === 1 && day}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ scale: day.level > 0 ? 0.9 : 1, opacity: day.level > 0 ? 0.85 : 1 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: day.level > 0 ? 0.02 : 0 }}
                    whileHover={{ scale: day.level >= 0 ? 1.2 : 1 }}
                    className={`
                      w-3 h-3 rounded-sm cursor-pointer transition-colors
                      ${getLevelColor(day.level)}
                      ${day.level >= 0 ? 'border border-gray-200' : ''}
                      ${day.date === today ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                    `}
                    onMouseEnter={(e) => handleMouseEnter(day, e)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className={`w-4 h-4 rounded-sm ${getLevelColor(level)} border border-gray-200`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && hoveredCell.level >= 0 && hoveredCell.date && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm shadow-xl pointer-events-none"
          style={{
            left: tooltipPos.x + 10,
            top: tooltipPos.y + 10,
          }}
        >
          <div className="font-semibold">{hoveredCell.date}</div>
          <div>
            {hoveredCell.level === 0 ? 'Not played' : `Score: ${hoveredCell.score}`}
          </div>
          {hoveredCell.level > 0 && (
            <div className="capitalize">Difficulty: {hoveredCell.difficulty}</div>
          )}
        </motion.div>
      )}
    </div>
  );
}
