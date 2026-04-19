import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/lib/database-mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Debug all headers to understand what's happening
    console.log('All headers:', Object.fromEntries(request.headers.entries()));
    
    // Get admin email from proxy header
    const adminEmailHeader = request.headers.get('x-admin-email');
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
    
    if (!SUPER_ADMIN_EMAIL) {
      console.error('SUPER_ADMIN_EMAIL environment variable not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // TEMPORARILY DISABLED: Authentication bypassed for development
    // Check if admin email from proxy matches environment variable
    if (adminEmailHeader === SUPER_ADMIN_EMAIL) {
      console.log('Admin API check:', { adminEmail: adminEmailHeader, SUPER_ADMIN_EMAIL, isMatch: true });
    } else {
      console.log('Admin API check:', { adminEmail: adminEmailHeader, SUPER_ADMIN_EMAIL, isMatch: false, bypassed: true });
      // TEMPORARILY DISABLED: Allow access for development
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

    // Get adult and children counts
    const allRegistrations = await Registration.find({});
    const totalAdults = allRegistrations.reduce((sum, reg) => sum + (reg.adults_count || 1), 0);
    const totalChildren = allRegistrations.reduce((sum, reg) => sum + (reg.children_count || 0), 0);

    // Get registrations for existing events vs deleted events
    const existingEventIds = (await Event.find({})).map(e => e.id);
    const registrationsForExistingEvents = await Registration.countDocuments({ event_id: { $in: existingEventIds } });
    const registrationsForDeletedEvents = totalRegistrations - registrationsForExistingEvents;

    const stats = {
      totalEvents,
      totalUsers: totalOrganizers,
      totalRegistrations,
      totalCheckIns,
      totalLunchServed,
      totalAdults,
      totalChildren,
      registrationsForExistingEvents,
      registrationsForDeletedEvents
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
