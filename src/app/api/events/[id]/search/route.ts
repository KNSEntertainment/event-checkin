import { NextRequest, NextResponse } from 'next/server';
import { connectDB, searchRegistrationByPhone } from '@/lib/database-mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    
    if (!eventId || !phone) {
      return NextResponse.json(
        { error: 'Event ID and phone number are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
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
