import { NextRequest, NextResponse } from 'next/server';
import { initDB, createEvent, createOrganizer, getOrganizerByEmail } from '@/lib/database-vercel';

export async function POST(request: NextRequest) {
  try {
    const { name, date, organizerEmail } = await request.json();

    if (!name || !date || !organizerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = initDB();
    
    // Get or create organizer
    let organizer = await getOrganizerByEmail(db, organizerEmail);
    if (!organizer) {
      organizer = await createOrganizer(db, organizerEmail);
    }

    // Create event
    const event = await createEvent(db, {
      name,
      date,
      organizer_id: organizer.id
    });


    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
