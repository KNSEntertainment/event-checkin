import { NextRequest, NextResponse } from 'next/server';
import { connectDB, createRegistration, getEventById } from '@/lib/database-mongodb';
import { sendWelcomeEmail } from '@/lib/email-service';
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { name, phone, email, address, adults_count, children_count } = await request.json();

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

    // Connect to MongoDB
    await connectDB();
    
    // Verify event exists
    const event = await getEventById({}, eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Create registration
    const registration = await createRegistration({}, {
      event_id: eventId,
      name,
      phone,
      email,
      address,
      adults_count: (adults_count !== undefined && adults_count !== null) ? adults_count : 1,
      children_count: (children_count !== undefined && children_count !== null) ? children_count : 0
    });

    // Send welcome email if email is provided
    if (email && event) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const checkinURL = `${baseUrl}/checkin-individual/${registration.id}`;
        
        await sendWelcomeEmail(email, {
          eventName: event.name,
          eventDate: event.date,
          eventVenue: event.venue,
          eventAddress: event.address,
          registrationId: registration.id,
          userName: name,
          checkinURL,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the registration if email fails
      }
    }

    return NextResponse.json({ registration });
  } catch (error) {
    console.error('Error creating registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
