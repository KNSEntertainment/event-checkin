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
    
    const Registration = mongoose.models.Registration || mongoose.model('Registration', new mongoose.Schema({}));
    const Event = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({}));
    const Organizer = mongoose.models.Organizer || mongoose.model('Organizer', new mongoose.Schema({}));

    // Get all registrations with event and organizer information
    const registrations = await Registration.find({}).lean();
    const events = await Event.find({}).lean();
    const organizers = await Organizer.find({}).lean();

    // Create mappings
    const eventMap = new Map();
    events.forEach(event => {
      eventMap.set(event.id, { name: event.name, date: event.date });
    });

    const organizerMap = new Map();
    organizers.forEach(org => {
      organizerMap.set(org.clerk_user_id, org.email);
    });

    // Generate CSV data
    const csvData = [
      ['Registration ID', 'Event Name', 'Event Date', 'Name', 'Phone', 'Email', 'Address', 'Adults Count', 'Children Count', 'Checked In', 'Checked In At', 'Lunch Served', 'Lunch Served At', 'Adults Lunch Served', 'Children Lunch Served', 'Created At']
    ];

    for (const registration of registrations) {
      const eventInfo = eventMap.get(registration.event_id);
      
      csvData.push([
        registration.id,
        eventInfo?.name || 'Unknown Event',
        eventInfo?.date || '',
        registration.name,
        registration.phone,
        registration.email || '',
        registration.address || '',
        registration.adults_count.toString(),
        registration.children_count.toString(),
        registration.checked_in ? 'Yes' : 'No',
        registration.checked_in_at || '',
        registration.lunch_served ? 'Yes' : 'No',
        registration.lunch_served_at || '',
        registration.adults_lunch_served.toString(),
        registration.children_lunch_served.toString(),
        registration.created_at
      ]);
    }

    // Convert to CSV string
    const csvString = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Return as CSV file
    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="registrations-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
