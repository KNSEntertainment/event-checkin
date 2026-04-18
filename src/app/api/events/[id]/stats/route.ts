import { NextRequest, NextResponse } from 'next/server';
import { initDB, getEventStats } from '@/lib/database-vercel';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const db = initDB();
    const stats = await getEventStats(db, eventId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
