import { NextRequest, NextResponse } from 'next/server';
import { connectDB, updateRegistration, getRegistrationById } from '@/lib/database-mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const { adults_count, children_count } = await request.json();
    
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    // Check if registration exists and is not already checked in
    const existingRegistration = await getRegistrationById({}, registrationId);
    if (!existingRegistration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    if (existingRegistration.checked_in) {
      return NextResponse.json(
        { error: 'Already checked in' },
        { status: 400 }
      );
    }

    // Check in Registration
    const registration = await updateRegistration({}, registrationId, {
      checked_in: true,
      checked_in_at: new Date()
    });

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Error checking in registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
