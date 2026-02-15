// MODULE 5: Offline-First IndexedDB Storage
// Stores puzzle progress, scores, and activity locally

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DailyPuzzleDB extends DBSchema {
  puzzles: {
    key: string; // date
    value: {
      date: string;
      puzzleData: any;
      progress: any;
      completed: boolean;
      score?: number;
      completionTime?: number;
      hintsUsed?: number;
      updatedAt: number;
    };
  };
  scores: {
    key: string; // date
    value: {
      date: string;
      score: number;
      completionTime: number;
      hintsUsed: number;
      puzzleType: string;
      difficulty: string;
      synced: boolean;
      createdAt: number;
    };
  };
  activity: {
    key: string; // date
    value: {
      date: string;
      completed: boolean;
      score: number;
      difficulty: string;
      synced: boolean;
    };
  };
  streak: {
    key: string; // 'current'
    value: {
      currentStreak: number;
      longestStreak: number;
      lastPlayedDate: string;
      updatedAt: number;
    };
  };
  user: {
    key: string; // 'profile'
    value: {
      id?: string;
      email?: string;
      name?: string;
      isGuest: boolean;
      guestId?: string;
      updatedAt: number;
    };
  };
}

let dbInstance: IDBPDatabase<DailyPuzzleDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<DailyPuzzleDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DailyPuzzleDB>('daily-puzzle-db', 1, {
    upgrade(db) {
      // Puzzles store
      if (!db.objectStoreNames.contains('puzzles')) {
        db.createObjectStore('puzzles', { keyPath: 'date' });
      }

      // Scores store
      if (!db.objectStoreNames.contains('scores')) {
        const scoresStore = db.createObjectStore('scores', { keyPath: 'date' });
        scoresStore.createIndex('synced', 'synced');
      }

      // Activity store (for heatmap)
      if (!db.objectStoreNames.contains('activity')) {
        db.createObjectStore('activity', { keyPath: 'date' });
      }

      // Streak store
      if (!db.objectStoreNames.contains('streak')) {
        db.createObjectStore('streak', { keyPath: 'key' });
      }

      // User store
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// Puzzle Progress Management
export async function savePuzzleProgress(date: string, puzzleData: any, progress: any) {
  const db = await initDB();
  await db.put('puzzles', {
    date,
    puzzleData,
    progress,
    completed: false,
    updatedAt: Date.now(),
  });
}

export async function getPuzzleProgress(date: string) {
  const db = await initDB();
  return await db.get('puzzles', date);
}

export async function markPuzzleComplete(
  date: string,
  score: number,
  completionTime: number,
  hintsUsed: number
) {
  const db = await initDB();
  const puzzle = await db.get('puzzles', date);
  if (puzzle) {
    puzzle.completed = true;
    puzzle.score = score;
    puzzle.completionTime = completionTime;
    puzzle.hintsUsed = hintsUsed;
    puzzle.updatedAt = Date.now();
    await db.put('puzzles', puzzle);
  }
}

// Score Management
export async function saveScore(
  date: string,
  score: number,
  completionTime: number,
  hintsUsed: number,
  puzzleType: string,
  difficulty: string
) {
  const db = await initDB();
  await db.put('scores', {
    date,
    score,
    completionTime,
    hintsUsed,
    puzzleType,
    difficulty,
    synced: false,
    createdAt: Date.now(),
  });
}

export async function getScore(date: string) {
  const db = await initDB();
  return await db.get('scores', date);
}

export async function getUnsyncedScores() {
  const db = await initDB();
  const allScores = await db.getAllFromIndex('scores', 'synced', false);
  return allScores;
}

export async function markScoreSynced(date: string) {
  const db = await initDB();
  const score = await db.get('scores', date);
  if (score) {
    score.synced = true;
    await db.put('scores', score);
  }
}

// Activity Management (for heatmap)
export async function saveActivity(date: string, completed: boolean, score: number, difficulty: string) {
  const db = await initDB();
  await db.put('activity', {
    date,
    completed,
    score,
    difficulty,
    synced: false,
  });
}

export async function getActivity(date: string) {
  const db = await initDB();
  return await db.get('activity', date);
}

export async function getAllActivity() {
  const db = await initDB();
  return await db.getAll('activity');
}

export async function getActivityRange(startDate: string, endDate: string) {
  const db = await initDB();
  const allActivity = await db.getAll('activity');
  return allActivity.filter(a => a.date >= startDate && a.date <= endDate);
}

// Streak Management
export async function getStreak() {
  const db = await initDB();
  const streak = await db.get('streak', 'current');
  return streak || {
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedDate: '',
    updatedAt: Date.now(),
  };
}

export async function updateStreak(currentStreak: number, longestStreak: number, lastPlayedDate: string) {
  const db = await initDB();
  await db.put('streak', {
    key: 'current',
    currentStreak,
    longestStreak,
    lastPlayedDate,
    updatedAt: Date.now(),
  });
}

// User Management
export async function saveUser(user: {
  id?: string;
  email?: string;
  name?: string;
  isGuest: boolean;
  guestId?: string;
}) {
  const db = await initDB();
  await db.put('user', {
    key: 'profile',
    ...user,
    updatedAt: Date.now(),
  });
}

export async function getUser() {
  const db = await initDB();
  return await db.get('user', 'profile');
}

// Clear all data (for logout)
export async function clearAllData() {
  const db = await initDB();
  await db.clear('puzzles');
  await db.clear('scores');
  await db.clear('activity');
  await db.clear('streak');
  await db.clear('user');
}
