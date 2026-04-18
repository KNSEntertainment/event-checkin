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
    
    const Organizer = mongoose.models.Organizer || mongoose.model('Organizer', new mongoose.Schema({}));
    const Event = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({}));

    // Get all users with their event counts
    const organizers = await Organizer.find({}).lean();

    // Generate CSV data
    const csvData = [
      ['User ID', 'Email', 'Clerk User ID', 'Created At', 'Event Count']
    ];

    for (const organizer of organizers) {
      const eventCount = await Event.countDocuments({ organizer_id: organizer.clerk_user_id });
      
      csvData.push([
        organizer.id,
        organizer.email,
        organizer.clerk_user_id,
        organizer.created_at,
        eventCount.toString()
      ]);
    }

    // Convert to CSV string
    const csvString = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    // Return as CSV file
    return new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
