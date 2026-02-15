// Achievement unlock logic and definitions

import * as db from './db';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-win',
    title: 'First Victory',
    description: 'Complete your first puzzle',
    icon: '🏆',
  },
  {
    id: 'streak-3',
    title: '3-Day Streak',
    description: 'Solve puzzles for 3 consecutive days',
    icon: '🔥',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Achieve a 7-day streak',
    icon: '⚡',
  },
  {
    id: 'perfect-score',
    title: 'Perfect Score',
    description: 'Score 400+ points on a puzzle',
    icon: '⭐',
  },
  {
    id: 'no-hints',
    title: 'No Help Needed',
    description: 'Complete a puzzle without using hints',
    icon: '🧠',
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Complete a puzzle in under 3 minutes',
    icon: '⚡',
  },
];

export async function checkAchievements(
  date: string,
  score: number,
  difficulty: string,
  hintsUsed: number
): Promise<string[]> {
  const unlockedNow: string[] = [];

  // First win
  if (!(await db.hasAchievement('first-win'))) {
    if (await db.saveAchievement('first-win', { date, score })) {
      unlockedNow.push('first-win');
    }
  }

  // Perfect score (400+)
  if (score >= 400 && !(await db.hasAchievement('perfect-score'))) {
    if (await db.saveAchievement('perfect-score', { date, score, difficulty })) {
      unlockedNow.push('perfect-score');
    }
  }

  // No hints used
  if (hintsUsed === 0 && !(await db.hasAchievement('no-hints'))) {
    if (await db.saveAchievement('no-hints', { date, score })) {
      unlockedNow.push('no-hints');
    }
  }

  // Check streaks
  const streak = await db.getStreak();
  if (streak.currentStreak >= 3 && !(await db.hasAchievement('streak-3'))) {
    if (await db.saveAchievement('streak-3', { streak: 3, date })) {
      unlockedNow.push('streak-3');
    }
  }
  if (streak.currentStreak >= 7 && !(await db.hasAchievement('streak-7'))) {
    if (await db.saveAchievement('streak-7', { streak: 7, date })) {
      unlockedNow.push('streak-7');
    }
  }

  return unlockedNow;
}

export async function checkSpeedAchievement(completionTime: number, date: string): Promise<boolean> {
  if (completionTime <= 180 && !(await db.hasAchievement('speed-demon'))) {
    return await db.saveAchievement('speed-demon', { date, time: completionTime });
  }
  return false;
}
