import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB, getEventsByClerkId, getRegistrationsByEventId, getOrganizerByClerkId, deleteEvent, deleteOrganizer } from '@/lib/database-mongodb';

export async function POST(request: NextRequest) {
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

    // Get user's events
    const events = await getEventsByClerkId({}, userId);
    
    // Get user's organizer information
    const organizer = await getOrganizerByClerkId({}, userId);
    
    // Track what was deleted for response
    const deletionSummary = {
      eventsDeleted: 0,
      registrationsDeleted: 0,
      organizerDeleted: false,
      deletionDate: new Date().toISOString()
    };

    // Delete all events and their registrations
    for (const event of events) {
      try {
        // Get all registrations for this event
        const registrations = await getRegistrationsByEventId({}, event.id);
        deletionSummary.registrationsDeleted += registrations.length;
        
        // Delete the event (this should cascade delete registrations)
        await deleteEvent({}, event.id);
        deletionSummary.eventsDeleted++;
      } catch (error) {
        console.error(`Error deleting event ${event.id}:`, error);
        // Continue with other events even if one fails
      }
    }

    // Delete organizer record if it exists
    if (organizer) {
      try {
        await deleteOrganizer({}, organizer.id);
        deletionSummary.organizerDeleted = true;
      } catch (error) {
        console.error('Error deleting organizer:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data deletion request processed successfully',
      summary: deletionSummary
    });

  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data' },
      { status: 500 }
    );
  }
}
