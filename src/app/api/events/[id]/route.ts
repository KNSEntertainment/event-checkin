import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB, getEventById, deleteEvent, getEventsByClerkId, updateEvent, getRegistrations } from '@/lib/database-mongodb';
import { sendEventCancellationEmail } from '@/lib/email-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    const event = await getEventById({}, eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: eventId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
    
    // Check if event exists and belongs to user
    const event = await getEventById({}, eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get user's organizer to verify ownership
    const userEvents = await getEventsByClerkId({}, userId);
    const userEventIds = userEvents.map(e => e.id);
    
    if (!userEventIds.includes(eventId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all registrants for this event to send cancellation emails
    const registrations = await getRegistrations({}, eventId);
    
    // Only send emails if there are registrants with email addresses
    if (registrations.some(reg => reg.email)) {
      // Send cancellation emails to all registrants with email addresses
      const emailPromises = registrations
        .filter(reg => reg.email) // Only send to registrants with email
        .map(reg => 
          sendEventCancellationEmail(reg.email, {
            eventName: event.name,
            eventDate: event.date,
            eventVenue: event.venue,
            eventAddress: event.address,
            userName: reg.name
          })
        );

      // Send all emails in parallel (don't wait for completion to avoid blocking deletion)
      Promise.allSettled(emailPromises).then(results => {
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`Event deletion: ${successful} emails sent successfully, ${failed} failed`);
      });
    }

    // Delete the event
    await deleteEvent({}, eventId);

    return NextResponse.json({ 
      success: true,
      emailsSent: registrations.filter(reg => reg.email).length,
      totalRegistrants: registrations.length
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id: eventId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const { name, date } = await request.json();

    if (!name || !date) {
      return NextResponse.json(
        { error: 'Event name and date are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    // Check if event exists and belongs to user
    const event = await getEventById({}, eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Get user's organizer to verify ownership
    const userEvents = await getEventsByClerkId({}, userId);
    const userEventIds = userEvents.map(e => e.id);
    
    if (!userEventIds.includes(eventId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const updatedEvent = await updateEvent({}, eventId, { name, date });
    
    if (!updatedEvent) {
      return NextResponse.json(
        { error: 'Failed to update event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: updatedEvent });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
