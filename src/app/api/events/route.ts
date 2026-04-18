import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initDB, createEvent, createOrganizer, getOrganizerByClerkId } from '@/lib/database-vercel';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, date, start_time, end_time, venue, address, parking_info, organizerEmail } = await request.json();

    if (!name || !date || !organizerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = initDB();
    
    // Get or create organizer
    let organizer = await getOrganizerByClerkId(db, userId);
    if (!organizer) {
      organizer = await createOrganizer(db, userId, organizerEmail);
    }

    // Create event
    const event = await createEvent(db, {
      name,
      date,
      start_time,
      end_time,
      venue,
      address,
      parking_info,
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
