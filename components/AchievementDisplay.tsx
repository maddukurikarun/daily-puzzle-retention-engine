'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACHIEVEMENTS } from '@/lib/achievementService';
import * as db from '@/lib/db';

interface AchievementNotificationProps {
  achievementId: string;
  onClose: () => void;
}

function AchievementNotification({ achievementId, onClose }: AchievementNotificationProps) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!achievement) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-4 right-4 z-50 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-lg shadow-2xl p-4 max-w-sm"
    >
      <div className="flex items-start gap-3">
        <div className="text-4xl">{achievement.icon}</div>
        <div>
          <div className="font-bold text-lg">Achievement Unlocked!</div>
          <div className="font-semibold">{achievement.title}</div>
          <div className="text-sm opacity-90">{achievement.description}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AchievementDisplay() {
  const [queue, setQueue] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const handleAchievement = (event: CustomEvent<string>) => {
      setQueue(prev => [...prev, event.detail]);
    };

    window.addEventListener('achievement-unlocked' as any, handleAchievement);
    return () => window.removeEventListener('achievement-unlocked' as any, handleAchievement);
  }, []);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [current, queue]);

  return (
    <AnimatePresence>
      {current && (
        <AchievementNotification
          achievementId={current}
          onClose={() => setCurrent(null)}
        />
      )}
    </AnimatePresence>
  );
}

export function triggerAchievement(achievementId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: achievementId }));
  }
}
