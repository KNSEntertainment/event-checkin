import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB, getEventsByClerkId, getRegistrationsByEventId, getOrganizerByClerkId } from '@/lib/database-mongodb';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Get user's organizer information
    const organizer = await getOrganizerByClerkId({}, userId);
    
    // Get user's events
    const events = await getEventsByClerkId({}, userId);
    
    // Get all registrations for user's events
    const registrations = [];
    for (const event of events) {
      const eventRegistrations = await getRegistrationsByEventId({}, event.id);
      registrations.push(...eventRegistrations);
    }

    // Prepare export data
    const exportData = {
      user: {
        clerkUserId: userId,
        email: organizer?.email || 'N/A',
        organizerId: organizer?.id || 'N/A',
        createdAt: organizer?.created_at || 'N/A'
      },
      events: events.map(event => ({
        id: event.id,
        name: event.name,
        organizer: event.organizer,
        date: event.date,
        startTime: event.start_time,
        endTime: event.end_time,
        venue: event.venue,
        address: event.address,
        parkingInfo: event.parking_info,
        createdAt: event.created_at
      })),
      registrations: registrations.map(reg => ({
        id: reg.id,
        eventId: reg.event_id,
        name: reg.name,
        phone: reg.phone,
        email: reg.email,
        address: reg.address,
        adultsCount: reg.adults_count,
        childrenCount: reg.children_count,
        checkedIn: reg.checked_in,
        checkedInAt: reg.checked_in_at,
        lunchServed: reg.lunch_served,
        lunchServedAt: reg.lunch_served_at,
        adultsLunchServed: reg.adults_lunch_served,
        childrenLunchServed: reg.children_lunch_served,
        createdAt: reg.created_at
      })),
      exportInfo: {
        exportDate: new Date().toISOString(),
        totalEvents: events.length,
        totalRegistrations: registrations.length,
        format: 'JSON'
      }
    };

    // Create response with appropriate headers
    const response = NextResponse.json(exportData);
    
    // Set headers for file download
    response.headers.set('Content-Type', 'application/json');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="event-checkin-data-export-${new Date().toISOString().split('T')[0]}.json"`
    );
    
    return response;

  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
