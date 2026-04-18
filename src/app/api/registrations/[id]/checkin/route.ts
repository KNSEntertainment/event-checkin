import { NextRequest, NextResponse } from 'next/server';
import { initDB, checkInRegistration, getRegistrationById } from '@/lib/database-vercel';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const db = initDB();
    
    // Check if registration exists and is not already checked in
    const existingRegistration = await getRegistrationById(db, registrationId);
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

    // Check in the registration
    const registration = await checkInRegistration(db, registrationId);

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Error checking in registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
