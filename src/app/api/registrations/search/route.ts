import { NextRequest, NextResponse } from 'next/server';
import { connectDB, searchRegistrationByPhone } from '../../../../lib/database-mongodb';

export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const eventId = searchParams.get('eventId');
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    // Search registrations by phone number
    const registrations = await searchRegistrationByPhone({}, eventId, phone);

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error searching registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
