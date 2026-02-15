// API Route: Create Guest User
import { NextRequest, NextResponse } from 'next/server';
import { createGuestUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const guest = await createGuestUser();
    
    return NextResponse.json({
      success: true,
      user: {
        id: guest.id,
        guestId: guest.guestId,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error('Guest creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create guest user' },
      { status: 500 }
    );
  }
}
