import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB, getRegistrations } from '@/lib/database-mongodb';
import mongoose from 'mongoose';

export async function GET(
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
    
    const Registration = mongoose.models.Registration || mongoose.model('Registration', new mongoose.Schema({}));
    const Event = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({}));

    // Get event details
    const event = await Event.findOne({ id: eventId }).lean();
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is the event organizer
    if (event.organizer_id !== userId) {
      return NextResponse.json(
        { error: 'Access denied. You can only export your own events.' },
        { status: 403 }
      );
    }

    // Get all registrations for this event
    const registrations = await Registration.find({ event_id: eventId }).lean();

    // Generate CSV data
    const csvData = [
      ['Registration ID', 'Name', 'Phone', 'Email', 'Address', 'Adults Count', 'Children Count', 'Checked In', 'Checked In At', 'Lunch Served', 'Lunch Served At', 'Adults Lunch Served', 'Children Lunch Served', 'Created At']
    ];

    for (const registration of registrations) {
      csvData.push([
        registration.id,
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
        registration.adults_lunch_served?.toString() || '0',
        registration.children_lunch_served?.toString() || '0',
        registration.created_at
      ]);
    }

    // Convert to CSV string
    const csvString = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Create filename with event name and date
    const eventName = event.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    const filename = `${eventName}-registrations-${new Date().toISOString().split('T')[0]}.csv`;

    // Return as CSV file
    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error('Error exporting event registrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
