import { NextRequest, NextResponse } from 'next/server';
import { initDB, createRegistration, getEvent } from '@/lib/database-vercel';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { name, phone, children_count } = await request.json();

    if (!eventId || !name || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = initDB();
    
    // Verify event exists
    const event = await getEvent(db, eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Create registration
    const registration = await createRegistration(db, {
      event_id: eventId,
      name,
      phone,
      children_count: children_count || 0
    });

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
