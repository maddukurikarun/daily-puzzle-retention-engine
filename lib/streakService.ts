// MODULE 2 & 4: Streak Calculator and Sync Service

import { format, subDays } from 'date-fns';
import * as db from './db';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

export function isConsecutiveDay(lastDate: string, currentDate: string): boolean {
  if (!lastDate) return true;

  const last = parseDateOnly(lastDate);
  const current = parseDateOnly(currentDate);
  const diff = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  
  return diff === 0 || diff === 1;
}

export async function calculateStreak(completedDate: string): Promise<StreakData> {
  const currentStreak = await db.getStreak();
  const lastDate = currentStreak.lastPlayedDate;
  
  let newCurrentStreak = currentStreak.currentStreak;
  let newLongestStreak = currentStreak.longestStreak;

  // Same day - no change
  if (lastDate === completedDate) {
    return {
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastPlayedDate: lastDate,
    };
  }

  // Check if consecutive
  if (isConsecutiveDay(lastDate, completedDate)) {
    newCurrentStreak += 1;
  } else {
    // Streak broken - reset
    newCurrentStreak = 1;
  }

  // Update longest streak
  if (newCurrentStreak > newLongestStreak) {
    newLongestStreak = newCurrentStreak;
  }

  const updatedStreak = {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastPlayedDate: completedDate,
  };

  // Save to IndexedDB
  await db.updateStreak(newCurrentStreak, newLongestStreak, completedDate);

  return updatedStreak;
}

// Sync Service
export async function syncScores(userId: string) {
  try {
    const unsyncedScores = await db.getUnsyncedScores();
    
    if (unsyncedScores.length === 0) {
      return { success: true, synced: 0 };
    }

    // Sync each score
    for (const score of unsyncedScores) {
      const response = await fetch('/api/sync/daily-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: score.date,
          score: score.score,
          completionTime: score.completionTime,
          hintsUsed: score.hintsUsed,
          puzzleType: score.puzzleType,
          difficulty: score.difficulty,
        }),
      });

      if (response.ok) {
        await db.markScoreSynced(score.date);
      }
    }

    return { success: true, synced: unsyncedScores.length };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, synced: 0, error };
  }
}

export async function syncServerScoresToLocal(userId: string) {
  try {
    const response = await fetch(`/api/sync/daily-scores?userId=${encodeURIComponent(userId)}`);
    if (!response.ok) {
      return { success: false, merged: 0 };
    }

    const data = await response.json();
    const scores = Array.isArray(data?.scores) ? data.scores : [];

    for (const score of scores) {
      await db.saveScore(
        score.date,
        score.score,
        score.completionTime,
        score.hintsUsed || 0,
        score.puzzleType,
        score.difficulty || 'medium'
      );
      await db.markScoreSynced(score.date);
      await db.upsertActivityFromSync(
        score.date,
        true,
        score.score,
        score.difficulty || 'medium'
      );
    }

    return { success: true, merged: scores.length };
  } catch {
    return { success: false, merged: 0 };
  }
}

// Background sync when online
export function setupBackgroundSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    const user = await db.getUser();
    if (user && user.id) {
      await syncScores(user.id);
      await syncServerScoresToLocal(user.id);
    }
  });
}

// Generate 365/366 days of activity data for heatmap (handles leap years)
export async function generateHeatmapData(endDate: Date = new Date()) {
  const year = endDate.getFullYear();
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysToShow = isLeapYear ? 365 : 364;
  const startDate = subDays(endDate, daysToShow);
  const activities = await db.getAllActivity();
  
  const activityMap = new Map(
    activities.map(a => [a.date, a])
  );

  const heatmapData: Array<{
    date: string;
    count: number;
    level: number;
    score?: number;
    difficulty?: string;
  }> = [];

  let currentDate = startDate;
  while (currentDate <= endDate) {
    const dateStr = formatDate(currentDate);
    const activity = activityMap.get(dateStr);

    if (activity && activity.completed) {
      // Calculate level based on score and difficulty
      let level = 1;
      if (activity.score > 150) level = 2;
      if (activity.score > 250) level = 3;
      if (activity.score > 400) level = 4;

      heatmapData.push({
        date: dateStr,
        count: 1,
        level,
        score: activity.score,
        difficulty: activity.difficulty,
      });
    } else {
      heatmapData.push({
        date: dateStr,
        count: 0,
        level: 0,
      });
    }

    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return heatmapData;
}
