// API Route: Sync Daily Scores
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isScoreValid } from '@/lib/puzzleValidator';

export const dynamic = 'force-dynamic';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(date: string): boolean {
  if (!DATE_REGEX.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, date, score, completionTime, hintsUsed, puzzleType } = body;
    const difficulty = ['easy', 'medium', 'hard'].includes(body?.difficulty)
      ? body.difficulty
      : 'medium';

    // Validation
    if (!userId || !date || score === undefined || completionTime === undefined || !puzzleType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!isValidDateString(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Prevent future dates
    const today = new Date().toISOString().split('T')[0];
    if (date > today) {
      return NextResponse.json(
        { error: 'Cannot submit scores for future dates' },
        { status: 400 }
      );
    }

    if (completionTime < 5 || completionTime > 7200) {
      return NextResponse.json(
        { error: 'Unrealistic completion time' },
        { status: 400 }
      );
    }

    if (score < 10 || score > 1000) {
      return NextResponse.json(
        { error: 'Invalid score range' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid user' },
        { status: 404 }
      );
    }

    // Validate score authenticity
    if (!isScoreValid(score, completionTime, hintsUsed || 0, difficulty || 'medium')) {
      return NextResponse.json(
        { error: 'Invalid score detected' },
        { status: 400 }
      );
    }

    const existing = await prisma.dailyScore.findUnique({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        data: existing,
      });
    }

    const dailyScore = await prisma.dailyScore.create({
      data: {
        userId,
        date,
        puzzleType,
        difficulty,
        score,
        completionTime,
        hintsUsed: hintsUsed || 0,
      },
    });

    // Update streak
    await updateUserStreak(userId, date);

    return NextResponse.json({
      success: true,
      data: dailyScore,
    });
  } catch (error) {
    console.error('Score sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync score' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const scores = await prisma.dailyScore.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 365,
    });

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Get scores error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}

async function updateUserStreak(userId: string, completedDate: string) {
  const streakRecord = await prisma.streakRecord.findUnique({
    where: { userId },
  });

  let currentStreak = 1;
  let longestStreak = 1;

  if (streakRecord && streakRecord.lastPlayedDate) {
    const lastDate = new Date(streakRecord.lastPlayedDate);
    const currentDate = new Date(completedDate);
    const diffDays = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day - no change
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      currentStreak = streakRecord.currentStreak + 1;
      longestStreak = Math.max(currentStreak, streakRecord.longestStreak);
    } else {
      // Streak broken
      currentStreak = 1;
      longestStreak = streakRecord.longestStreak;
    }
  }

  await prisma.streakRecord.upsert({
    where: { userId },
    update: {
      currentStreak,
      longestStreak,
      lastPlayedDate: completedDate,
    },
    create: {
      userId,
      currentStreak,
      longestStreak,
      lastPlayedDate: completedDate,
    },
  });
}
