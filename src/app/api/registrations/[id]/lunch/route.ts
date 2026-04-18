import { NextRequest, NextResponse } from 'next/server';
import { connectDB, getRegistrationById, updateRegistrationLunch } from '@/lib/database-mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: registrationId } = await params;
    const body = await request.json();
    const { adults_lunch_served, children_lunch_served } = body;
    
    if (!registrationId) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    if (adults_lunch_served === undefined || children_lunch_served === undefined) {
      return NextResponse.json(
        { error: 'Adults and children lunch counts are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();
    
    // Get registration
    const registration = await getRegistrationById({}, registrationId);
    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Check if user is checked in (optional requirement)
    if (!registration.checked_in) {
      return NextResponse.json(
        { error: 'User must be checked in before serving lunch' },
        { status: 400 }
      );
    }

    // Validate lunch counts don't exceed registration counts
    if (adults_lunch_served > registration.adults_count || children_lunch_served > registration.children_count) {
      return NextResponse.json(
        { error: 'Lunch counts cannot exceed registration counts' },
        { status: 400 }
      );
    }

    // Check if already served lunch (allow partial updates)
    if (registration.lunch_served) {
      // Allow additional servings but don't exceed totals
      const newAdultsLunch = Math.min(adults_lunch_served, registration.adults_count - registration.adults_lunch_served);
      const newChildrenLunch = Math.min(children_lunch_served, registration.children_count - registration.children_lunch_served);
      
      if (newAdultsLunch === 0 && newChildrenLunch === 0) {
        return NextResponse.json(
          { error: 'No additional lunch servings possible' },
          { status: 400 }
        );
      }

      const updatedRegistration = await updateRegistrationLunch({}, registrationId, {
        lunch_served: true,
        lunch_served_at: new Date(),
        adults_lunch_served: registration.adults_lunch_served + newAdultsLunch,
        children_lunch_served: registration.children_lunch_served + newChildrenLunch
      });

      return NextResponse.json({ registration: updatedRegistration });
    }

    // First time serving lunch
    const updatedRegistration = await updateRegistrationLunch({}, registrationId, {
      lunch_served: true,
      lunch_served_at: new Date(),
      adults_lunch_served,
      children_lunch_served
    });

    return NextResponse.json({ registration: updatedRegistration });
  } catch (error) {
    console.error('Error serving lunch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
