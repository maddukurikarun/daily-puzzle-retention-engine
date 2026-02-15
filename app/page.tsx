'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Calendar, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { signIn, useSession } from 'next-auth/react';
import PuzzleGame from '@/components/PuzzleGame';
import DailyHeatmap from '@/components/DailyHeatmap';
import StreakDisplay from '@/components/StreakDisplay';
import * as db from '@/lib/db';
import { formatDate, generateHeatmapData, setupBackgroundSync, syncServerScoresToLocal } from '@/lib/streakService';

export default function Home() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(formatDate(new Date()));
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, lastPlayedDate: '' });
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<'puzzle' | 'stats'>('puzzle');
  const [recentDays, setRecentDays] = useState<Array<{ date: string; status: 'today' | 'completed' | 'locked' }>>([]);

  // Handle authenticated session from Google OAuth
  // This effect runs when NextAuth session changes (after successful Google login)
  useEffect(() => {
    if (status === 'loading') return;

    async function handleAuthSession() {
      await db.initDB();
      
      console.log('📊 Auth status:', status);
      console.log('📊 Session data:', session);
      
      if (session?.user?.email) {
        // User successfully authenticated with Google
        console.log('✓ Setting up authenticated user:', session.user.email);
        console.log('✓ User ID from database:', session.user.id);
        
        const authUser = {
          id: session.user.id || session.user.email,
          name: session.user.name || 'Player',
          email: session.user.email,
          isGuest: false,
        };
        
        // Save authenticated user to IndexedDB for offline access
        await db.saveUser(authUser);
        setUser(authUser);
        
        // Load user's data (streaks, activities, etc.)
        await loadUserData(authUser);
        setIsLoading(false);
        
        console.log('✓ Authenticated user setup complete');
      } else if (status === 'unauthenticated') {
        console.log('ℹ️ No authenticated session - user needs to log in');
        setIsLoading(false);
      }
    }

    handleAuthSession();
  }, [session, status]);

  // Initialize app for guest users
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated') return; // Already handled above
    
    let isMounted = true;

    async function initApp() {
      await db.initDB();

      // Check for existing guest user in IndexedDB
      const savedUser = await db.getUser();
      
      if (savedUser && isMounted) {
        setUser(savedUser);
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
      }

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
  }, [status]);

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
      console.log('🎮 Creating guest user...');
      
      // Call API to create a guest user in the database
      const response = await fetch('/api/guest', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to create guest user: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✓ Guest user created:', data.user.id);
      
      // Create guest user object for local storage
      const guestUser = {
        id: data.user.id,
        guestId: data.user.guestId,
        isGuest: true,
        name: 'Guest User',
      };

      // Save guest user to IndexedDB
      await db.saveUser(guestUser);
      setUser(guestUser);
      
      // Load initial data for guest user
      await loadUserData(guestUser);
      
      console.log('✓ Guest user setup complete');
    } catch (error) {
      console.error('❌ Guest login failed:', error);
      alert('Failed to create guest account. Please try again.');
    }
  }

  async function handleGoogleLogin() {
    try {
      console.log('🔐 Initiating Google Sign-In...');
      
      // Start Google OAuth flow
      // NextAuth will redirect to Google, then back to our app
      const result = await signIn('google', { 
        callbackUrl: window.location.origin,
        redirect: true, // Let NextAuth handle the full redirect flow
      });
      
      // This code may not execute if redirect happens immediately
      if (result?.error) {
        console.error('❌ Google Sign-In error:', result.error);
        alert('Sign in failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Google Sign-In exception:', error);
      alert('An error occurred during sign in. Please try again.');
    }
  }

  async function handleLogout() {
    const confirmLogout = confirm('Are you sure you want to logout? Your progress will be cleared.');
    if (!confirmLogout) return;

    await db.clearAllData();
    setUser(null);
    setStreak({ currentStreak: 0, longestStreak: 0, lastPlayedDate: '' });
    setHeatmapData([]);
    
    // Sign out from NextAuth if it's a Google user
    if (session) {
      window.location.href = '/api/auth/signout';
    }
  }

  async function handlePuzzleComplete(score: number) {
    await loadUserData(user);
  }

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white"></div>
      </div>
    );
  }

  // Show login screen if no user (not authenticated and no guest user)
  if (!user && status === 'unauthenticated') {
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
            {/* Google OAuth Sign-In Button */}
            {/* Flow: Click → signIn('google') → Redirect to Google → OAuth → Redirect back → Session created */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoogleLogin}
              className="w-full border border-gray-300 bg-white text-gray-800 py-4 rounded-lg font-bold text-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>

            {/* Guest Mode Button */}
            {/* Flow: Click → POST /api/guest → Create guest user → Save to IndexedDB → Set user state */}
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
              Your progress is saved locally. Sign in with Google to sync across devices.
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
