import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB, getEventsByClerkId, deleteEvent, deleteOrganizer, getOrganizerByClerkId } from '@/lib/database-mongodb';
import mongoose from 'mongoose';

// Data retention periods (in days)
const RETENTION_PERIODS = {
  ACCOUNT_DATA: 730, // 2 years for inactive accounts
  EVENT_DATA: 365,  // 1 year after event completion
  REGISTRATION_DATA: 180, // 6 months after event completion
  TECHNICAL_LOGS: 30, // 30 days for technical logs
};

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (you may want to implement proper admin role checking)
    const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'admin@eventcheckin.com';
    // For now, we'll assume the super admin can perform cleanup
    // In production, you should implement proper role-based access control

    await connectDB();

    const cleanupResults = {
      accountsDeleted: 0,
      eventsDeleted: 0,
      registrationsDeleted: 0,
      cleanupDate: new Date().toISOString(),
    };

    // 1. Clean up inactive accounts (older than 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - RETENTION_PERIODS.ACCOUNT_DATA);

    const Organizer = mongoose.models.Organizer;
    const Event = mongoose.models.Event;
    const Registration = mongoose.models.Registration;

    const inactiveOrganizers = await Organizer.find({
      created_at: { $lt: twoYearsAgo }
    });

    for (const organizer of inactiveOrganizers) {
      try {
        // Get all events for this organizer
        const events = await Event.find({ organizer_id: organizer.clerk_user_id });
        
        // Delete all events and their registrations
        for (const event of events) {
          await Event.deleteOne({ id: event.id });
          await Registration.deleteMany({ event_id: event.id });
          cleanupResults.eventsDeleted++;
        }

        // Delete the organizer
        await Organizer.deleteOne({ id: organizer.id });
        cleanupResults.accountsDeleted++;
      } catch (error) {
        console.error(`Error cleaning up organizer ${organizer.id}:`, error);
      }
    }

    // 2. Clean up old events (older than 1 year from completion)
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - RETENTION_PERIODS.EVENT_DATA);

    const oldEvents = await Event.find({
      date: { $lt: oneYearAgo.toISOString().split('T')[0] }
    });

    for (const event of oldEvents) {
      try {
        // Delete registrations for this event
        const registrationCount = await Registration.countDocuments({ event_id: event.id });
        await Registration.deleteMany({ event_id: event.id });
        
        // Delete the event
        await Event.deleteOne({ id: event.id });
        
        cleanupResults.eventsDeleted++;
        cleanupResults.registrationsDeleted += registrationCount;
      } catch (error) {
        console.error(`Error cleaning up event ${event.id}:`, error);
      }
    }

    // 3. Clean up old registrations (older than 6 months from event date)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - RETENTION_PERIODS.REGISTRATION_DATA);

    const oldRegistrations = await Registration.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: 'id',
          as: 'event'
        }
      },
      {
        $unwind: '$event'
      },
      {
        $match: {
          'event.date': { $lt: sixMonthsAgo.toISOString().split('T')[0] }
        }
      }
    ]);

    for (const reg of oldRegistrations) {
      try {
        await Registration.deleteOne({ id: reg.id });
        cleanupResults.registrationsDeleted++;
      } catch (error) {
        console.error(`Error cleaning up registration ${reg.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Data cleanup completed successfully',
      results: cleanupResults,
      retentionPeriods: RETENTION_PERIODS
    });

  } catch (error) {
    console.error('Error during data cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to perform data cleanup' },
      { status: 500 }
    );
  }
}

// GET endpoint to view cleanup statistics without performing cleanup
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const Organizer = mongoose.models.Organizer;
    const Event = mongoose.models.Event;
    const Registration = mongoose.models.Registration;

    const now = new Date();
    const statistics = {
      totalOrganizers: await Organizer.countDocuments(),
      totalEvents: await Event.countDocuments(),
      totalRegistrations: await Registration.countDocuments(),
      retentionPeriods: RETENTION_PERIODS,
      cleanupCandidates: {
        inactiveAccounts: 0,
        oldEvents: 0,
        oldRegistrations: 0,
      }
    };

    // Count cleanup candidates
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - RETENTION_PERIODS.ACCOUNT_DATA);
    statistics.cleanupCandidates.inactiveAccounts = await Organizer.countDocuments({
      created_at: { $lt: twoYearsAgo }
    });

    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - RETENTION_PERIODS.EVENT_DATA);
    statistics.cleanupCandidates.oldEvents = await Event.countDocuments({
      date: { $lt: oneYearAgo.toISOString().split('T')[0] }
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - RETENTION_PERIODS.REGISTRATION_DATA);
    
    const oldRegistrations = await Registration.aggregate([
      {
        $lookup: {
          from: 'events',
          localField: 'event_id',
          foreignField: 'id',
          as: 'event'
        }
      },
      {
        $unwind: '$event'
      },
      {
        $match: {
          'event.date': { $lt: sixMonthsAgo.toISOString().split('T')[0] }
        }
      }
    ]);
    statistics.cleanupCandidates.oldRegistrations = oldRegistrations.length;

    return NextResponse.json({
      success: true,
      statistics
    });

  } catch (error) {
    console.error('Error fetching cleanup statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cleanup statistics' },
      { status: 500 }
    );
  }
}
