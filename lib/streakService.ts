// MODULE 2 & 4: Streak Calculator and Sync Service

import { format, parseISO, differenceInDays, subDays } from 'date-fns';
import * as db from './db';

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string;
}

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isConsecutiveDay(lastDate: string, currentDate: string): boolean {
  if (!lastDate) return true;
  
  const last = parseISO(lastDate);
  const current = parseISO(currentDate);
  const diff = differenceInDays(current, last);
  
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

// Background sync when online
export function setupBackgroundSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    console.log('Back online - syncing...');
    const user = await db.getUser();
    if (user && user.id) {
      await syncScores(user.id);
    }
  });
}

// Generate 365 days of activity data for heatmap
export async function generateHeatmapData(endDate: Date = new Date()) {
  const startDate = subDays(endDate, 364);
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
