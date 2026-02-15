'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Calendar, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { signIn } from 'next-auth/react';
import PuzzleGame from '@/components/PuzzleGame';
import DailyHeatmap from '@/components/DailyHeatmap';
import StreakDisplay from '@/components/StreakDisplay';
import * as db from '@/lib/db';
import { formatDate, generateHeatmapData, setupBackgroundSync, syncServerScoresToLocal } from '@/lib/streakService';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [currentDate] = useState(formatDate(new Date()));
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, lastPlayedDate: '' });
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'puzzle' | 'stats'>('puzzle');
  const [recentDays, setRecentDays] = useState<Array<{ date: string; status: 'today' | 'completed' | 'locked' }>>([]);

  // Initialize app
  useEffect(() => {
    let isMounted = true;

    async function initApp() {
      // Initialize IndexedDB
      await db.initDB();

      const sessionResponse = await fetch('/api/auth/session');
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        if (session?.user?.id) {
          const authUser = {
            id: session.user.id,
            name: session.user.name || 'Player',
            email: session.user.email,
            isGuest: false,
          };
          await db.saveUser(authUser);
          if (isMounted) {
            setUser(authUser);
            setShowLogin(false);
          }
        }
      }

      // Check for existing user
      const savedUser = await db.getUser();
      
      if (savedUser && isMounted) {
        setUser(savedUser);
        setShowLogin(false);
        await loadUserData(savedUser);
      }

      if (isMounted) {
        setIsLoading(false);
      }

      // Setup background sync
      setupBackgroundSync();

      // Monitor online/offline
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      if (isMounted) {
        setIsOnline(navigator.onLine);
      };

      return { handleOnline, handleOffline };
    }

    let handlers: { handleOnline: () => void; handleOffline: () => void } | null = null;
    initApp().then(result => {
      handlers = result || null;
    });

    return () => {
      isMounted = false;
      if (handlers) {
        window.removeEventListener('online', handlers.handleOnline);
        window.removeEventListener('offline', handlers.handleOffline);
      }
    };
  }, []);

  async function loadUserData(activeUser?: { id?: string }) {
    if (isOnline && activeUser?.id) {
      await syncServerScoresToLocal(activeUser.id);
    }

    const streakData = await db.getStreak();
    setStreak(streakData);

    const heatmap = await generateHeatmapData();
    setHeatmapData(heatmap);

    const activities = await db.getAllActivity();
    const activityMap = new Map(activities.map(item => [item.date, item]));
    const days: Array<{ date: string; status: 'today' | 'completed' | 'locked' }> = [];

    for (let index = 6; index >= 0; index--) {
      const day = new Date();
      day.setDate(day.getDate() - index);
      const dayStr = formatDate(day);

      if (dayStr === currentDate) {
        days.push({ date: dayStr, status: 'today' });
      } else if (activityMap.get(dayStr)?.completed) {
        days.push({ date: dayStr, status: 'completed' });
      } else {
        days.push({ date: dayStr, status: 'locked' });
      }
    }

    setRecentDays(days);
  }

  async function handleGuestLogin() {
    try {
      // Create guest user via API
      const response = await fetch('/api/guest', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to create guest user');

      const data = await response.json();
      const guestUser = {
        id: data.user.id,
        guestId: data.user.guestId,
        isGuest: true,
        name: 'Guest User',
      };

      await db.saveUser(guestUser);
      setUser(guestUser);
      setShowLogin(false);
      await loadUserData(guestUser);
    } catch (error) {
      console.error('Guest login failed:', error);
      alert('Failed to create guest account. Please try again.');
    }
  }

  async function handleGoogleLogin() {
    await signIn('google', { callbackUrl: '/' });
  }

  async function handleLogout() {
    const confirmLogout = confirm('Are you sure you want to logout? Your progress will be cleared.');
    if (!confirmLogout) return;

    await db.clearAllData();
    setUser(null);
    setShowLogin(true);
    setStreak({ currentStreak: 0, longestStreak: 0, lastPlayedDate: '' });
    setHeatmapData([]);
  }

  async function handlePuzzleComplete(score: number) {
    await loadUserData(user);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
        >
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text"
          >
            Daily Puzzle
          </motion.h1>
          <p className="text-center text-gray-600 mb-8">
            Challenge yourself every day and build your streak!
          </p>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 bg-white text-gray-800 py-4 rounded-lg font-bold text-lg shadow-sm hover:bg-gray-50 transition-all"
            >
              Continue with Google
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGuestLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              🎮 Play as Guest
            </motion.button>

            <div className="text-center text-sm text-gray-500">
              <p>✓ Offline support</p>
              <p>✓ Daily streaks</p>
              <p>✓ Progress tracking</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Your progress is saved locally. Create an account to sync across devices.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
                Daily Puzzle
              </h1>
              <p className="text-sm text-gray-600">
                Welcome, {user?.name || 'Guest'}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              {/* Online Status */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-2 border-b border-gray-200 min-w-max">
            <button
              onClick={() => setActiveTab('puzzle')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                activeTab === 'puzzle'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Today's Puzzle
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-colors ${
                activeTab === 'stats'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Statistics
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'puzzle' ? (
          <div className="space-y-8">
            {/* Streak Display */}
            <StreakDisplay
              currentStreak={streak.currentStreak}
              longestStreak={streak.longestStreak}
            />

            {/* Puzzle Game */}
            <PuzzleGame
              date={currentDate}
              userId={user?.id || ''}
              onComplete={handlePuzzleComplete}
            />

            {/* Daily Unlock Overview */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Daily Unlock</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
                {recentDays.map(day => (
                  <div
                    key={day.date}
                    className={`rounded-lg border p-3 text-center ${
                      day.status === 'today'
                        ? 'border-blue-500 bg-blue-50'
                        : day.status === 'completed'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="text-xs text-gray-500">{day.date}</div>
                    <div className="mt-1 font-semibold text-sm">
                      {day.status === 'today'
                        ? 'Unlocked'
                        : day.status === 'completed'
                        ? 'Completed'
                        : 'Locked'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Streak Display */}
            <StreakDisplay
              currentStreak={streak.currentStreak}
              longestStreak={streak.longestStreak}
            />

            {/* Heatmap */}
            <DailyHeatmap data={heatmapData} />

            {/* Stats Summary */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Journey</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{streak.currentStreak}</div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{streak.longestStreak}</div>
                  <div className="text-sm text-gray-600">Best Streak</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {heatmapData.filter(d => d.count > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">Total Days Played</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Daily Puzzle Retention Engine - Built with ❤️ for daily engagement</p>
          <p className="mt-2">Offline-first • Streak tracking • 365-day history</p>
        </div>
      </footer>
    </div>
  );
}
