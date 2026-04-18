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

    // Get total counts
    const [totalEvents, totalOrganizers, totalRegistrations] = await Promise.all([
      Event.countDocuments(),
      Organizer.countDocuments(),
      Registration.countDocuments()
    ]);

    // Get total check-ins
    const totalCheckIns = await Registration.countDocuments({ checked_in: true });

    // Get total lunch served
    const totalLunchServed = await Registration.countDocuments({ lunch_served: true });

    const stats = {
      totalEvents,
      totalUsers: totalOrganizers,
      totalRegistrations,
      totalCheckIns,
      totalLunchServed
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
