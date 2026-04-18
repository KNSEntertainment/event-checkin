import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/database-mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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

    const user = await auth();
    const userEmail = user?.sessionClaims?.email as string;
    
    if (userEmail !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    const Event = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({}));
    const Registration = mongoose.models.Registration || mongoose.model('Registration', new mongoose.Schema({}));
    const Organizer = mongoose.models.Organizer || mongoose.model('Organizer', new mongoose.Schema({}));

    // Get all events with creator information and statistics
    const events = await Event.find({}).lean();
    const organizers = await Organizer.find({}).lean();

    // Create organizer mapping
    const organizerMap = new Map();
    organizers.forEach(org => {
      organizerMap.set(org.clerk_user_id, org.email);
    });

    // Generate CSV data
    const csvData = [
      ['Event ID', 'Event Name', 'Date', 'Start Time', 'End Time', 'Venue', 'Address', 'Creator Email', 'Created At', 'Registration Count', 'Check-in Count', 'Lunch Served Count']
    ];

    for (const event of events) {
      const [registrationCount, checkInCount, lunchServedCount] = await Promise.all([
        Registration.countDocuments({ event_id: event.id }),
        Registration.countDocuments({ event_id: event.id, checked_in: true }),
        Registration.countDocuments({ event_id: event.id, lunch_served: true })
      ]);

      csvData.push([
        event.id,
        event.name,
        event.date,
        event.start_time || '',
        event.end_time || '',
        event.venue || '',
        event.address || '',
        organizerMap.get(event.organizer_id) || 'Unknown',
        event.created_at,
        registrationCount.toString(),
        checkInCount.toString(),
        lunchServedCount.toString()
      ]);
    }

    // Convert to CSV string
    const csvString = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Return as CSV file
    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="events-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
