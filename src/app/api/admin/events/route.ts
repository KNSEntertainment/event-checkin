import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/database-mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // TEMPORARILY DISABLED: Authentication bypassed for development
    const user = await auth();
    
    if (!user?.userId) {
      console.log('Admin Events API: User not authenticated, but bypassing for development');
      // return NextResponse.json(
      //   { error: 'Unauthorized' },
      //   { status: 401 }
      // );
    }

    // Check if user is super admin
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    if (!SUPER_ADMIN_EMAIL) {
      console.error('SUPER_ADMIN_EMAIL environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get admin email from proxy header
    const adminEmailHeader = request.headers.get('x-admin-email');
    
    // TEMPORARILY DISABLED: Authentication bypassed for development
    // Check if admin email from proxy matches environment variable
    if (adminEmailHeader === SUPER_ADMIN_EMAIL) {
      console.log('Admin Events API check:', { adminEmail: adminEmailHeader, SUPER_ADMIN_EMAIL, isMatch: true });
    } else {
      console.log('Admin Events API check:', { adminEmail: adminEmailHeader, SUPER_ADMIN_EMAIL, isMatch: false, bypassed: true });
      // return NextResponse.json(
      //   { error: 'Access denied. Admin privileges required.' },
      //   { status: 403 }
      // );
    }

    // Connect to MongoDB
    await connectDB();
    
    const Event = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({}));
    const Registration = mongoose.models.Registration || mongoose.model('Registration', new mongoose.Schema({}));
    const Organizer = mongoose.models.Organizer || mongoose.model('Organizer', new mongoose.Schema({}));

    // Get all events with creator information
    const events = await Event.find({}).lean();

    // Get organizer information and registration statistics
    const organizerMap = new Map();
    const organizers = await Organizer.find({}).lean();
    organizers.forEach(org => {
      organizerMap.set(org.clerk_user_id, org.email);
    });

    // Get registration statistics for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const [registrationCount, checkInCount, lunchServedCount] = await Promise.all([
          Registration.countDocuments({ event_id: event.id }),
          Registration.countDocuments({ event_id: event.id, checked_in: true }),
          Registration.countDocuments({ event_id: event.id, lunch_served: true })
        ]);

        return {
          id: event.id,
          name: event.name,
          date: event.date,
          start_time: event.start_time,
          end_time: event.end_time,
          venue: event.venue,
          creatorEmail: organizerMap.get(event.organizer_id) || 'Unknown',
          creatorId: event.organizer_id,
          registrationCount,
          checkInCount,
          lunchServedCount,
          created_at: event.created_at
        };
      })
    );

    // Sort by creation date (newest first)
    eventsWithStats.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ events: eventsWithStats });
  } catch (error) {
    console.error('Error fetching admin events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
