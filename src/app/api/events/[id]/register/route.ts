import { NextRequest, NextResponse } from 'next/server';
import { initDB, createRegistration, getEvent } from '@/lib/database-vercel';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { name, phone, address, adults_count, children_count } = await request.json();

    if (!eventId || !name || !phone || !adults_count) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate address using Geoapify API
    if (address) {
      try {
        const geoResponse = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(address)}&limit=1&type=street&apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_KEY}`);
        if (!geoResponse.ok) {
          return NextResponse.json(
            { error: 'Invalid address' },
            { status: 400 }
          );
        }
        
        const geoData = await geoResponse.json();
        if (!geoData.features || geoData.features.length === 0) {
          return NextResponse.json(
            { error: 'Invalid address' },
            { status: 400 }
          );
        }
      } catch (error) {
        // If Geoapify fails, continue with registration
        console.warn('Address validation failed:', error);
      }
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
      adults_count: (adults_count !== undefined && adults_count !== null) ? adults_count : 1,
      children_count: (children_count !== undefined && children_count !== null) ? children_count : 0
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
