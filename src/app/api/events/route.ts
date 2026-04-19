import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB, createEvent, getEventsByClerkId, createOrganizer, getOrganizerByClerkId } from '@/lib/database-mongodb';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { organizer: organizerName, name, date, start_time, end_time, venue, address, parking_info, organizerEmail } = await request.json();

    if (!organizerName || !name || !date || !organizerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    // Get or create organizer
    let organizer = await getOrganizerByClerkId({}, userId);
    if (!organizer) {
      organizer = await createOrganizer({}, userId, organizerEmail);
    }

    // Create event
    const event = await createEvent({}, {
      id: randomUUID(),
      organizer: organizerName,
      name,
      date,
      start_time,
      end_time,
      venue,
      address,
      parking_info,
      organizer_id: userId
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
